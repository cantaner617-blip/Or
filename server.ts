import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { v2 as cloudinary } from 'cloudinary';
import { createServer as createViteServer } from 'vite';
import sharp from 'sharp';
import { db, pwdUtil } from './server/db';
import { signToken, verifyToken } from './server/token';

const app = express();

// Helper to clean environment variables from platform artifacts
function cleanEnvVar(val: string | undefined): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed === 'undefined' || trimmed === 'null' || trimmed === 'placeholder' || trimmed === '') {
    return '';
  }
  return trimmed;
}

// In-memory verification codes storage for password reset
// Key: email (lowercased), Value: { code: string, expiresAt: number }
const verificationCodes = new Map<string, { code: string; expiresAt: number }>();

async function sendVerificationCode(email: string, code: string): Promise<boolean> {
  const envSmtpUser = cleanEnvVar(process.env.SMTP_USER);
  const envSmtpPass = cleanEnvVar(process.env.SMTP_PASS);
  
  const smtpUser = envSmtpUser || 'angfs777@gmail.com';
  const smtpPass = envSmtpPass || 'xejjbvwkznsxvpaa';
  const cleanPass = smtpPass.replace(/\s+/g, '');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: smtpUser,
      pass: cleanPass
    }
  });

  const mailOptions = {
    from: `"AnlıkResim" <${smtpUser}>`,
    to: email,
    subject: 'Şifre Sıfırlama Doğrulama Kodu - AnlıkResim',
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border-radius: 16px; background-color: #0b0f19; color: #f3f4f6; border: 1px solid #1f2937;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #2dd4bf; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Anlık<span style="color: #ffffff;">Resim</span></h2>
          <p style="color: #9ca3af; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; font-weight: 700;">Hızlı & Güvenli Görsel Paylaşım</p>
        </div>
        
        <div style="background-color: #111827; border-radius: 12px; padding: 20px; border: 1px solid #374151; margin-bottom: 25px; text-align: center;">
          <p style="margin-top: 0; font-size: 14px; color: #d1d5db; text-align: left;">Merhaba,</p>
          <p style="font-size: 14px; color: #9ca3af; line-height: 1.6; text-align: left;">Şifrenizi sıfırlamak için talepte bulundunuz. Aşağıdaki 6 haneli doğrulama kodunu kullanarak yeni şifrenizi belirleyebilirsiniz:</p>
          
          <div style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #2dd4bf; background-color: #090d16; border: 1px solid rgba(45, 212, 191, 0.2); padding: 12px 24px; border-radius: 8px; margin: 20px 0; display: inline-block; font-family: monospace;">
            ${code}
          </div>
          
          <p style="font-size: 12px; color: #ef4444; font-weight: 600; margin-bottom: 0;">Bu kod 10 dakika süreyle geçerlidir.</p>
        </div>
        
        <p style="font-size: 11px; color: #6b7280; text-align: center; line-height: 1.5; margin: 0;">Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayınız. Güvenliğiniz için kodunuzu kimseyle paylaşmayınız.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Verification email send error:", error);
    return false;
  }
}
const PORT = 3000;

app.use(express.json());

// ================= ANTI-DDOS & SECURITY SYSTEM =================
let totalBlockedRequestsCount = 0;

// Temporary IP bans (Jail system)
// Key: IP string, Value: { expiresAt: number, reason: string }
const temporaryBans = new Map<string, { expiresAt: number; reason: string }>();

// Request tracking per IP for sliding windows
interface IpTracker {
  global: { count: number; resetAt: number };
  auth: { count: number; resetAt: number };
  upload: { count: number; resetAt: number };
}
const requestTrackers = new Map<string, IpTracker>();

// Cleanup stale rate-limit trackers every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, tracker] of requestTrackers.entries()) {
    if (now > tracker.global.resetAt && now > tracker.auth.resetAt && now > tracker.upload.resetAt) {
      requestTrackers.delete(ip);
    }
  }
  for (const [ip, banInfo] of temporaryBans.entries()) {
    if (now > banInfo.expiresAt) {
      temporaryBans.delete(ip);
    }
  }
}, 5 * 60 * 1000);

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = '';
  if (typeof forwarded === 'string') {
    ip = forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    ip = forwarded[0].trim();
  } else {
    ip = req.socket.remoteAddress || req.ip || '127.0.0.1';
  }
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  return ip;
}

// Global Security & Anti-DDoS Protection Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  // Set Anti-DDoS & Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-DDoS-Protection', 'Active');

  const rawUrl = req.originalUrl || req.url || '';
  const pathname = (req.path || rawUrl.split('?')[0] || '').toLowerCase();

  // 0. Completely exempt static assets, Vite dev server modules, and frontend pages from rate limiting and flood counters
  const isStaticOrDev = 
    pathname.startsWith('/@') ||
    pathname.startsWith('/src/') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/public/') ||
    pathname.startsWith('/node_modules/') ||
    pathname === '/favicon.ico' ||
    /\.(js|mjs|ts|tsx|css|webp|png|jpe?g|gif|svg|ico|woff2?|ttf|eot|map|json|html)$/i.test(pathname);

  if (isStaticOrDev || !pathname.startsWith('/api')) {
    return next();
  }

  const sysConfig = db.getSystemConfig();
  const ddosEnabled = sysConfig.ddosProtectionEnabled !== false;

  if (!ddosEnabled) {
    return next();
  }

  const clientIp = getClientIp(req);
  const now = Date.now();

  // 1. Check Whitelist
  const whitelist = sysConfig.ipWhitelist || [];
  if (whitelist.includes(clientIp)) {
    temporaryBans.delete(clientIp);
    res.setHeader('X-Security-Bypass', 'Whitelisted');
    return next();
  }

  // 2. Check Blacklist
  const blacklist = sysConfig.ipBlacklist || [];
  if (blacklist.includes(clientIp)) {
    totalBlockedRequestsCount++;
    db.addSecurityLog({
      ip: clientIp,
      action: 'blocked',
      reason: 'Kara listedeki IP engellendi',
      endpoint: req.originalUrl || req.url
    });
    return res.status(403).json({
      error: 'Erişiminiz güvenlik sistemimiz tarafından kalıcı olarak engellenmiştir (Kara Liste).',
      code: 'IP_BLACKLISTED'
    });
  }

  // 3. Check Temporary Bans (Jail System)
  const banInfo = temporaryBans.get(clientIp);
  if (banInfo) {
    if (now < banInfo.expiresAt) {
      totalBlockedRequestsCount++;
      const retryAfterSec = Math.ceil((banInfo.expiresAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec.toString());
      return res.status(429).json({
        error: `Aşırı istek ve olası DDoS saldırısı nedeniyle IP adresiniz geçici olarak engellenmiştir. (${banInfo.reason})`,
        code: 'TEMPORARILY_BANNED',
        retryAfterSeconds: retryAfterSec
      });
    } else {
      temporaryBans.delete(clientIp);
    }
  }

  // 4. Inspect Malicious Payloads / Automated Scanners
  if (sysConfig.maliciousPayloadProtection !== false) {
    const suspiciousPatterns = [
      /<script\b/i,
      /UNION\s+SELECT/i,
      /SELECT\s+.*\s+FROM/i,
      /etc\/passwd/i,
      /eval\(/i
    ];

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(rawUrl));
    if (isSuspicious) {
      totalBlockedRequestsCount++;
      db.addSecurityLog({
        ip: clientIp,
        action: 'suspicious',
        reason: 'Zararlı URL / Payload taraması algılandı',
        endpoint: rawUrl
      });
      return res.status(400).json({ error: 'Güvenlik ihlali algılandı. Geçersiz istek dizilimi.' });
    }
  }

  // 5. Rate Limiting Logic (Only counts backend API requests)
  let tracker = requestTrackers.get(clientIp);
  if (!tracker) {
    tracker = {
      global: { count: 0, resetAt: now + 60000 },
      auth: { count: 0, resetAt: now + 60000 },
      upload: { count: 0, resetAt: now + 300000 }
    };
    requestTrackers.set(clientIp, tracker);
  }

  // Global Rate Limit for API calls
  if (now > tracker.global.resetAt) {
    tracker.global.count = 0;
    tracker.global.resetAt = now + 60000;
  }
  tracker.global.count++;

  const limitGlobal = sysConfig.rateLimitGlobal || 600;
  if (tracker.global.count > limitGlobal) {
    totalBlockedRequestsCount++;
    // If request rate is > 3x threshold (e.g. > 1800 req/min on API), trigger 15-min auto ban
    if (tracker.global.count > limitGlobal * 3) {
      const banDurationMs = 15 * 60 * 1000; // 15 mins
      temporaryBans.set(clientIp, {
        expiresAt: now + banDurationMs,
        reason: 'Aşırı DDoS Trafik Yüklemesi'
      });
      db.addSecurityLog({
        ip: clientIp,
        action: 'banned',
        reason: `DDoS Saldırı Tespiti! Dakikada ${tracker.global.count} istek (15 dk geçici ban)`,
        endpoint: req.originalUrl || req.url
      });
    } else if (tracker.global.count === limitGlobal + 1) {
      db.addSecurityLog({
        ip: clientIp,
        action: 'rate_limited',
        reason: `Genel API istek limiti aşıldı (${limitGlobal} req/dk)`,
        endpoint: req.originalUrl || req.url
      });
    }

    res.setHeader('Retry-After', '60');
    return res.status(429).json({
      error: 'Çok fazla istek gönderdiniz! Sitemiz Anti-DDoS koruması altındadır. Lütfen 1 dakika bekleyin.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  // Auth Endpoints Rate Limit (Brute Force Protection)
  const isAuthRoute = req.originalUrl.startsWith('/api/auth/login') ||
                      req.originalUrl.startsWith('/api/auth/register') ||
                      req.originalUrl.startsWith('/api/auth/forgot-password') ||
                      req.originalUrl.startsWith('/api/auth/reset-password');

  if (isAuthRoute) {
    if (now > tracker.auth.resetAt) {
      tracker.auth.count = 0;
      tracker.auth.resetAt = now + 60000;
    }
    tracker.auth.count++;

    const limitAuth = sysConfig.rateLimitAuth || 30;
    if (tracker.auth.count > limitAuth) {
      totalBlockedRequestsCount++;
      if (tracker.auth.count === limitAuth + 1) {
        db.addSecurityLog({
          ip: clientIp,
          action: 'rate_limited',
          reason: `Brute-force koruması: Şifre/Kayıt limiti aşıldı (${limitAuth} req/dk)`,
          endpoint: req.originalUrl || req.url
        });
      }

      res.setHeader('Retry-After', '60');
      return res.status(429).json({
        error: 'Güvenlik Nedeniyle Engellendi: Çok fazla giriş/şifre denemesi yaptınız! Lütfen 1 dakika bekleyin.',
        code: 'AUTH_RATE_LIMITED'
      });
    }
  }

  // Upload Endpoint Rate Limit (Storage Flooding Protection)
  const isUploadRoute = req.originalUrl.startsWith('/api/upload');
  if (isUploadRoute) {
    if (now > tracker.upload.resetAt) {
      tracker.upload.count = 0;
      tracker.upload.resetAt = now + 300000; // 5 min
    }
    tracker.upload.count++;

    const limitUpload = sysConfig.rateLimitUpload || 120;
    if (tracker.upload.count > limitUpload) {
      totalBlockedRequestsCount++;
      if (tracker.upload.count === limitUpload + 1) {
        db.addSecurityLog({
          ip: clientIp,
          action: 'rate_limited',
          reason: `Görsel yükleme saldırısı koruması: Limit aşıldı (${limitUpload} req/5dk)`,
          endpoint: req.originalUrl || req.url
        });
      }

      res.setHeader('Retry-After', '300');
      return res.status(429).json({
        error: 'Çok fazla görsel yükleme isteği gönderdiniz! Lütfen 5 dakika bekleyin.',
        code: 'UPLOAD_RATE_LIMITED'
      });
    }
  }

  next();
});

// Cloudinary Configuration
const envCloudName = cleanEnvVar(process.env.CLOUDINARY_CLOUD_NAME);
const envApiKey = cleanEnvVar(process.env.CLOUDINARY_API_KEY);
const envApiSecret = cleanEnvVar(process.env.CLOUDINARY_API_SECRET);

const cloudinaryCloudName = envCloudName || 'xkxhqfy8';
const cloudinaryApiKey = envApiKey || '343837662874489';
const cloudinaryApiSecret = envApiSecret || 'ikyRqVp_pz-eVEnT_DDo7icHtWk';

const isCloudinaryConfigured = !!(
  cloudinaryCloudName &&
  cloudinaryApiKey &&
  cloudinaryApiSecret
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudinaryCloudName,
    api_key: cloudinaryApiKey,
    api_secret: cloudinaryApiSecret,
  });
  console.log("Cloudinary successfully configured with cloud name:", cloudinaryCloudName);
} else {
  console.warn("Cloudinary configuration missing! Using local database storage fallback for uploaded images.");
}

// Helper to delete image from storage (Cloudinary or Bunny.net)
async function deleteImageFromStorage(image: any) {
  if (!image) return;

  const sysConfig = db.getSystemConfig();
  const bunnyEnabled = sysConfig.bunnyStorageEnabled || !!process.env.BUNNY_STORAGE_ENABLED;
  const bunnyZoneName = sysConfig.bunnyStorageZoneName || process.env.BUNNY_STORAGE_ZONE_NAME;
  const bunnyApiKey = sysConfig.bunnyStorageApiKey || process.env.BUNNY_STORAGE_API_KEY;
  const bunnyRegion = sysConfig.bunnyStorageRegion || process.env.BUNNY_STORAGE_REGION || '';

  const isBunnyUrl = image.url && (
    image.url.includes('b-cdn.net') || 
    (sysConfig.bunnyStoragePullZoneUrl && image.url.includes(sysConfig.bunnyStoragePullZoneUrl.replace(/https?:\/\//, '')))
  );

  if (isBunnyUrl && bunnyZoneName && bunnyApiKey) {
    try {
      const region = bunnyRegion.trim().toLowerCase();
      const host = (region === '' || region === 'de' || region === 'default') 
        ? 'storage.bunnycdn.com' 
        : `${region}.storage.bunnycdn.com`;
      
      const deleteUrl = `https://${host}/${bunnyZoneName}/${image.id}.${image.format || 'png'}`;
      console.log(`Deleting from Bunny.net storage: ${deleteUrl}`);
      
      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'AccessKey': bunnyApiKey,
        }
      });
      
      if (deleteResponse.ok) {
        console.log(`Successfully deleted Bunny.net asset for image ${image.id}`);
      } else {
        const errText = await deleteResponse.text().catch(() => '');
        console.error(`Bunny.net delete failed with status ${deleteResponse.status}: ${errText}`);
      }
    } catch (bunnyErr) {
      console.error(`Bunny.net delete failed for image ${image.id}:`, bunnyErr);
    }
  }

  if (isCloudinaryConfigured && image.publicId) {
    try {
      await cloudinary.uploader.destroy(image.publicId);
      console.log(`Successfully deleted Cloudinary asset for image ${image.id}`);
    } catch (cloudinaryErr) {
      console.error(`Cloudinary destroy failed for image ${image.id}:`, cloudinaryErr);
    }
  }
}


// Multer storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB limit
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];

// Auth middleware typings
export interface AuthRequest extends Request {
  user?: { id: string; username: string };
}

function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Bu işlem için giriş yapmalısınız.' });
  }
  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum.' });
  }
  req.user = decoded;
  next();
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user) return res.status(401).json({ error: 'Giriş yapılmadı.' });
    const userObj = db.getUserById(req.user.id);
    if (!userObj || !userObj.isAdmin) {
      return res.status(403).json({ error: 'Bu işlem için yönetici yetkiniz bulunmamaktadır.' });
    }
    next();
  });
}

// ================= API ENDPOINTS =================

async function processAndStoreLocalImage(
  req: AuthRequest,
  fileId: string,
  filename: string,
  rawBuffer: Buffer,
  deleteAfter?: string,
  expiresAt?: string | null
) {
  let processedBuffer = rawBuffer;
  let finalFormat = 'webp';
  let finalWidth = 600;
  let finalHeight = 400;

  try {
    const metadata = await sharp(rawBuffer).metadata();
    finalWidth = metadata.width || 600;
    finalHeight = metadata.height || 400;

    let pipeline = sharp(rawBuffer).rotate();

    if (finalWidth > 2560 || finalHeight > 2560) {
      pipeline = pipeline.resize(2560, 2560, { fit: 'inside', withoutEnlargement: true });
    }

    if (metadata.format === 'gif') {
      processedBuffer = rawBuffer;
      finalFormat = 'gif';
    } else {
      processedBuffer = await pipeline.webp({ quality: 83, effort: 3 }).toBuffer();
      finalFormat = 'webp';
    }

    const updatedMeta = await sharp(processedBuffer).metadata().catch(() => null);
    if (updatedMeta?.width) finalWidth = updatedMeta.width;
    if (updatedMeta?.height) finalHeight = updatedMeta.height;
  } catch (err) {
    console.warn("Sharp image processing warning, using original buffer:", err);
  }

  const base64Data = processedBuffer.toString('base64');
  const siteUrl = process.env.APP_URL || `http://localhost:${PORT}`;
  const imageUrl = `${siteUrl}/api/local-images/${fileId}`;

  const isLoggedIn = !!req.user;
  if (!isLoggedIn) {
    let guestId = (req.headers['x-guest-uuid'] as string) || '';
    if (!guestId) {
      guestId = crypto.createHash('sha256').update(req.ip || 'unknown-ip').digest('hex');
    }
    db.incrementGuestUploadCount(guestId);
  }

  const record = db.addImage({
    id: fileId,
    userId: req.user ? req.user.id : null,
    url: imageUrl,
    filename,
    format: finalFormat,
    bytes: processedBuffer.length,
    width: finalWidth,
    height: finalHeight,
    isLocal: true,
    localData: base64Data,
    expiresAt: expiresAt || null,
    deleteAfter: deleteAfter || 'never',
  });

  const siteUrlVal = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  return {
    id: record.id,
    directUrl: `${siteUrlVal}/${record.id}.${record.format || 'webp'}`,
    pageUrl: `/i/${record.id}`,
    width: record.width,
    height: record.height,
    bytes: record.bytes,
    filename: record.filename,
    isLocalFallback: true,
    expiresAt: record.expiresAt,
    deleteAfter: record.deleteAfter,
  };
}

async function optimizeExistingLocalDbImages() {
  try {
    const images = db.getImages();
    let updatedCount = 0;
    for (const img of images) {
      if (img.isLocal && img.localData && img.localData.length > 500000 && img.format !== 'gif') {
        try {
          const rawBuffer = Buffer.from(img.localData, 'base64');
          const metadata = await sharp(rawBuffer).metadata();
          let pipeline = sharp(rawBuffer).rotate();
          if ((metadata.width || 0) > 2560 || (metadata.height || 0) > 2560) {
            pipeline = pipeline.resize(2560, 2560, { fit: 'inside', withoutEnlargement: true });
          }
          const webpBuffer = await pipeline.webp({ quality: 83, effort: 3 }).toBuffer();
          if (webpBuffer.length < rawBuffer.length) {
            img.localData = webpBuffer.toString('base64');
            img.bytes = webpBuffer.length;
            img.format = 'webp';
            const meta2 = await sharp(webpBuffer).metadata();
            if (meta2.width) img.width = meta2.width;
            if (meta2.height) img.height = meta2.height;
            updatedCount++;
          }
        } catch (e) {
          console.warn(`Could not optimize image ${img.id}:`, e);
        }
      }
    }
    if (updatedCount > 0) {
      console.log(`Optimized ${updatedCount} existing local images in database for fast serving.`);
    }
  } catch (err) {
    console.warn("Startup image optimization check skipped:", err);
  }
}

setTimeout(() => { optimizeExistingLocalDbImages(); }, 1000);

// Local fallback image renderer
app.get('/api/local-images/:id', (req, res) => {
  const image = db.getImageById(req.params.id);
  if (!image || !image.isLocal || !image.localData) {
    return res.status(404).send('Resim bulunamadı.');
  }

  // Check if image is expired on-the-fly
  const now = new Date().toISOString();
  if (image.expiresAt && image.expiresAt <= now) {
    db.deleteImage(image.id);
    return res.status(404).send('Resim bulunamadı veya süresi doldu.');
  }

  const buffer = Buffer.from(image.localData, 'base64');
  let contentType = 'image/png';
  if (image.format === 'jpeg' || image.format === 'jpg') {
    contentType = 'image/jpeg';
  } else if (image.format === 'gif') {
    contentType = 'image/gif';
  } else if (image.format === 'webp') {
    contentType = 'image/webp';
  } else if (image.format === 'bmp') {
    contentType = 'image/bmp';
  }
  res.set('Content-Type', contentType);

  // If the image is temporary/has an expiration, disable caching completely
  if (image.expiresAt) {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  } else {
    res.set('Cache-Control', 'public, max-age=31536000');
  }

  res.send(buffer);
});

// Universal Direct Image Proxy (Handles local and Cloudinary, with strict on-the-fly expiration check)
app.get('/api/direct-image/:id', async (req, res) => {
  try {
    const image = db.getImageById(req.params.id);
    if (!image) {
      return res.status(404).send('Resim bulunamadı.');
    }

    // Check if image is expired on-the-fly
    const now = new Date().toISOString();
    if (image.expiresAt && image.expiresAt <= now) {
      deleteImageFromStorage(image).catch((err: any) => {
        console.error(`Failed to destroy expired asset for image ${image.id} on direct access:`, err);
      });
      db.deleteImage(image.id);
      return res.status(404).send('Resim bulunamadı veya süresi doldu.');
    }

    // Disable caching entirely for temporary/self-destructing images to prevent browser/CDN caching
    if (image.expiresAt) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    } else {
      res.set('Cache-Control', 'public, max-age=31536000');
    }

    // Determine content type
    let contentType = 'image/png';
    const fmt = (image.format || '').toLowerCase();
    if (fmt === 'jpeg' || fmt === 'jpg') {
      contentType = 'image/jpeg';
    } else if (fmt === 'gif') {
      contentType = 'image/gif';
    } else if (fmt === 'webp') {
      contentType = 'image/webp';
    } else if (fmt === 'bmp') {
      contentType = 'image/bmp';
    }

    res.set('Content-Type', contentType);

    if (req.query.download === 'true') {
      res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(image.filename)}"; filename*=UTF-8''${encodeURIComponent(image.filename)}`);
    }

    // If local, serve from local database data
    if (image.isLocal && image.localData) {
      const buffer = Buffer.from(image.localData, 'base64');
      return res.send(buffer);
    }

    // If Cloudinary, proxy fetch the image stream so that the raw Cloudinary link is completely private
    if (image.url) {
      try {
        const response = await fetch(image.url);
        if (!response.ok) {
          // If proxy fetch fails, try to redirect as absolute fallback
          return res.redirect(image.url);
        }
        
        const responseContentType = response.headers.get('content-type');
        if (responseContentType) {
          res.set('Content-Type', responseContentType);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return res.send(buffer);
      } catch (proxyErr) {
        console.error(`Proxy fetch failed for image ${image.id}, redirecting to source url:`, proxyErr);
        return res.redirect(image.url);
      }
    }

    return res.status(404).send('Resim bulunamadı.');
  } catch (err: any) {
    console.error("Direct image proxy error:", err);
    res.status(500).send('Resim yüklenirken bir sunucu hatası oluştu.');
  }
});

// Short Direct Image Route (e.g., /6b7ad519.jpeg, /6b7ad519.png)
app.get('/:id.:format', async (req, res, next) => {
  try {
    const { id } = req.params;
    // Strip extension just in case, though id parameter should not include it
    const cleanId = id.split('.')[0];
    const image = db.getImageById(cleanId);
    if (!image) {
      return next(); // Fall through to next routes, static files, or SPA index.html
    }

    // Check if image is expired on-the-fly
    const now = new Date().toISOString();
    if (image.expiresAt && image.expiresAt <= now) {
      deleteImageFromStorage(image).catch((err: any) => {
        console.error(`Failed to destroy expired asset for image ${image.id} on direct access:`, err);
      });
      db.deleteImage(image.id);
      return res.status(404).send('Resim bulunamadı veya süresi doldu.');
    }

    // Disable caching entirely for temporary/self-destructing images to prevent browser/CDN caching
    if (image.expiresAt) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    } else {
      res.set('Cache-Control', 'public, max-age=31536000');
    }

    // Determine content type
    let contentType = 'image/png';
    const fmt = (image.format || '').toLowerCase();
    if (fmt === 'jpeg' || fmt === 'jpg') {
      contentType = 'image/jpeg';
    } else if (fmt === 'gif') {
      contentType = 'image/gif';
    } else if (fmt === 'webp') {
      contentType = 'image/webp';
    } else if (fmt === 'bmp') {
      contentType = 'image/bmp';
    }

    res.set('Content-Type', contentType);

    if (req.query.download === 'true') {
      res.set('Content-Disposition', `attachment; filename="${encodeURIComponent(image.filename)}"; filename*=UTF-8''${encodeURIComponent(image.filename)}`);
    }

    // If local, serve from local database data
    if (image.isLocal && image.localData) {
      const buffer = Buffer.from(image.localData, 'base64');
      return res.send(buffer);
    }

    // If Cloudinary / Bunny, proxy fetch the image stream so that storage origins remain private
    if (image.url) {
      try {
        const response = await fetch(image.url);
        if (!response.ok) {
          return res.redirect(image.url);
        }
        
        const responseContentType = response.headers.get('content-type');
        if (responseContentType) {
          res.set('Content-Type', responseContentType);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return res.send(buffer);
      } catch (proxyErr) {
        console.error(`Proxy fetch failed for image ${image.id}, redirecting to source url:`, proxyErr);
        return res.redirect(image.url);
      }
    }

    return res.status(404).send('Resim bulunamadı.');
  } catch (err: any) {
    console.error("Short direct image proxy error:", err);
    res.status(500).send('Resim yüklenirken bir sunucu hatası oluştu.');
  }
});

// Auth API
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı, e-posta ve şifre zorunludur.' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Kullanıcı adı en az 3 karakter olmalıdır.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır.' });
    }

    const existingEmail = db.getUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda.' });
    }

    const existingUsername = db.getUserByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: 'Bu kullanıcı adı zaten alınmış.' });
    }

    const passwordHash = pwdUtil.hash(password);
    const user = db.addUser({
      username,
      email,
      passwordHash
    });

    const token = signToken({ id: user.id, username: user.username });
    res.status(201).json({
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        isAdmin: user.isAdmin,
        isPremium: user.isPremium,
        premiumPlan: user.premiumPlan,
        premiumExpiresAt: user.premiumExpiresAt
      }
    });
  } catch (err: any) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message || 'Kayıt işlemi gerçekleştirilirken sunucu tarafında bir hata oluştu.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre zorunludur.' });
    }

    const user = db.getUserByEmail(email);
    if (!user || !pwdUtil.verify(password, user.passwordHash)) {
      return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
    }

    const token = signToken({ id: user.id, username: user.username });
    res.json({
      token,
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        isAdmin: user.isAdmin,
        isPremium: user.isPremium,
        premiumPlan: user.premiumPlan,
        premiumExpiresAt: user.premiumExpiresAt
      }
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message || 'Giriş işlemi gerçekleştirilirken sunucu tarafında bir hata oluştu.' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'E-posta adresi zorunludur.' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Bu e-posta adresine kayıtlı bir kullanıcı bulunamadı.' });
    }

    // Generate a secure 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 10 minutes from now
    verificationCodes.set(email.toLowerCase(), {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000
    });

    console.log(`Sending verification code ${code} to ${email}...`);
    const isSent = await sendVerificationCode(email, code);

    if (!isSent) {
      return res.status(500).json({ error: 'Doğrulama e-postası gönderilemedi. Lütfen e-posta adresinizi kontrol edin veya SMTP sunucu bağlantısını inceleyin.' });
    }

    res.json({ message: '6 haneli doğrulama kodu e-posta adresinize gönderildi.' });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: 'Şifre sıfırlama işlemi başlatılırken bir sunucu hatası oluştu.' });
  }
});

app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'E-posta, doğrulama kodu ve yeni şifre alanları zorunludur.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır.' });
    }

    const savedRecord = verificationCodes.get(email.toLowerCase());
    if (!savedRecord) {
      return res.status(400).json({ error: 'Lütfen önce şifre sıfırlama talebinde bulununuz.' });
    }

    if (Date.now() > savedRecord.expiresAt) {
      verificationCodes.delete(email.toLowerCase());
      return res.status(400).json({ error: 'Doğrulama kodunun süresi dolmuş. Lütfen yeni bir kod isteyin.' });
    }

    if (savedRecord.code !== code.trim()) {
      return res.status(400).json({ error: 'Girdiğiniz doğrulama kodu hatalı.' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // Hash and update password
    const passwordHash = pwdUtil.hash(newPassword);
    db.updateUserPassword(user.id, passwordHash);

    // Clean up code
    verificationCodes.delete(email.toLowerCase());

    res.json({ message: 'Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz.' });
  } catch (err: any) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: 'Şifre sıfırlanırken bir sunucu hatası oluştu.' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Giriş yapılmadı' });
  const user = db.getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  }
  res.json({
    user: { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      isAdmin: user.isAdmin, 
      isPremium: user.isPremium,
      premiumPlan: user.premiumPlan,
      premiumExpiresAt: user.premiumExpiresAt,
      createdAt: user.createdAt 
    }
  });
});

// Image Upload API
app.post('/api/upload', optionalAuth, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Lütfen yüklenecek bir resim seçin.' });
    }

    // Maintenance Mode Check
    const sysConfig = db.getSystemConfig();
    const userObj = req.user ? db.getUserById(req.user.id) : null;
    const isAdminUser = userObj?.isAdmin === true;

    if (sysConfig.maintenanceMode && !isAdminUser) {
      return res.status(503).json({ error: 'Sistem şu anda bakım modundadır. Lütfen daha sonra tekrar deneyiniz.' });
    }

    // Guest Upload Limit Check
    const isLoggedIn = !!req.user;
    let guestId = '';
    if (!isLoggedIn) {
      guestId = (req.headers['x-guest-uuid'] as string) || '';
      if (!guestId) {
        guestId = crypto.createHash('sha256').update(req.ip || 'unknown-ip').digest('hex');
      }
      const allowedLimit = sysConfig.guestUploadLimit !== undefined ? sysConfig.guestUploadLimit : 5;
      const currentGuestCount = db.getGuestUploadCount(guestId);
      if (currentGuestCount >= allowedLimit) {
        return res.status(400).json({
          error: `Misafir yükleme limitine ulaştınız! Misafir olarak en fazla ${allowedLimit} resim yükleyebilirsiniz. Hemen ücretsiz kayıt olarak sınırsız yüklemeye başlayın!`,
          limitReached: true,
          limit: allowedLimit
        });
      }
    }

    // 20MB vs 100MB Upload Limit
    const limitBytes = isLoggedIn ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
    if (req.file.size > limitBytes) {
      const limitMb = isLoggedIn ? 100 : 20;
      return res.status(400).json({ 
        error: `Maksimum yükleme limitini aştınız! ${isLoggedIn ? 'Üyeler' : 'Ziyaretçiler'} için maksimum limit ${limitMb} MB'dır. ${!isLoggedIn ? 'Hemen ücretsiz üye olarak 100 MB limitine yükseltebilirsiniz!' : ''}`
      });
    }

    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Sadece JPG, PNG, GIF, BMP ve WEBP formatları desteklenir.' });
    }

    const fileId = crypto.randomBytes(4).toString('hex'); // 8 char hex string
    const filename = req.file.originalname;
    const format = req.file.mimetype.split('/')[1] || 'png';
    const bytes = req.file.size;

    // Self-destruct time calculation
    const deleteAfter = req.body.deleteAfter; // '5m', '1h', '1d', '7d', 'never'
    let expiresAt: string | null = null;
    if (deleteAfter && deleteAfter !== 'never') {
      const now = new Date();
      if (deleteAfter === '5m') {
        now.setMinutes(now.getMinutes() + 5);
      } else if (deleteAfter === '1h') {
        now.setHours(now.getHours() + 1);
      } else if (deleteAfter === '1d') {
        now.setDate(now.getDate() + 1);
      } else if (deleteAfter === '7d') {
        now.setDate(now.getDate() + 7);
      }
      expiresAt = now.toISOString();
    }

    let imageUrl = '';
    let publicId = '';
    let width = 600;
    let height = 400;

    const bunnyEnabled = sysConfig.bunnyStorageEnabled || !!process.env.BUNNY_STORAGE_ENABLED;
    const bunnyZoneName = sysConfig.bunnyStorageZoneName || process.env.BUNNY_STORAGE_ZONE_NAME;
    const bunnyApiKey = sysConfig.bunnyStorageApiKey || process.env.BUNNY_STORAGE_API_KEY;
    const bunnyPullZoneUrl = sysConfig.bunnyStoragePullZoneUrl || process.env.BUNNY_STORAGE_PULL_ZONE_URL;
    const bunnyRegion = sysConfig.bunnyStorageRegion || process.env.BUNNY_STORAGE_REGION || '';

    const isBunnyConfigured = !!(bunnyEnabled && bunnyZoneName && bunnyApiKey && bunnyPullZoneUrl);

    if (isBunnyConfigured) {
      try {
        const region = bunnyRegion.trim().toLowerCase();
        const host = (region === '' || region === 'de' || region === 'default') 
          ? 'storage.bunnycdn.com' 
          : `${region}.storage.bunnycdn.com`;
        
        const uploadUrl = `https://${host}/${bunnyZoneName}/${fileId}.${format}`;
        
        console.log(`Uploading to Bunny.net storage: ${uploadUrl}`);
        
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'AccessKey': bunnyApiKey,
            'Content-Type': req.file.mimetype,
          },
          body: req.file.buffer
        });

        if (!uploadResponse.ok) {
          const errText = await uploadResponse.text().catch(() => '');
          throw new Error(`Bunny.net upload failed with status ${uploadResponse.status}: ${errText}`);
        }

        const cleanPullZone = bunnyPullZoneUrl.replace(/\/$/, '');
        imageUrl = `${cleanPullZone}/${fileId}.${format}`;
        console.log(`Successfully uploaded image ${fileId} to Bunny.net: ${imageUrl}`);
      } catch (bunnyErr: any) {
        console.error("Bunny.net upload failed, falling back to local database storage...", bunnyErr);
        const resultPayload = await processAndStoreLocalImage(req, fileId, filename, req.file.buffer, deleteAfter, expiresAt);
        return res.json(resultPayload);
      }
    } else if (isCloudinaryConfigured) {
      // Stream to Cloudinary
      try {
        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'resimyukle',
              public_id: fileId,
              resource_type: 'image',
            },
            (err, res) => {
              if (err) return reject(err);
              resolve(res);
            }
          );
          uploadStream.end(req.file!.buffer);
        });

        imageUrl = result.secure_url;
        publicId = result.public_id;
        width = result.width;
        height = result.height;
        console.log(`Successfully uploaded image ${fileId} to Cloudinary: ${imageUrl}`);
      } catch (cloudinaryErr: any) {
        console.error("Cloudinary upload failed, falling back to local database storage...", cloudinaryErr);
        const resultPayload = await processAndStoreLocalImage(req, fileId, filename, req.file.buffer, deleteAfter, expiresAt);
        return res.json(resultPayload);
      }
    } else {
      // Local Database Optimized Fallback
      const resultPayload = await processAndStoreLocalImage(req, fileId, filename, req.file.buffer, deleteAfter, expiresAt);
      return res.json(resultPayload);
    }
    if (!isLoggedIn && guestId) {
      db.incrementGuestUploadCount(guestId);
    }

    const record = db.addImage({
      id: fileId,
      userId: req.user ? req.user.id : null,
      url: imageUrl,
      publicId: publicId || null,
      filename,
      format,
      bytes,
      width,
      height,
      expiresAt: expiresAt || null,
      deleteAfter: deleteAfter || 'never',
    });

    const siteUrlVal = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res.json({
      id: record.id,
      directUrl: `${siteUrlVal}/${record.id}.${record.format || 'png'}`,
      pageUrl: `/i/${record.id}`,
      width: record.width,
      height: record.height,
      bytes: record.bytes,
      filename: record.filename,
      expiresAt: record.expiresAt,
      deleteAfter: record.deleteAfter,
    });
  } catch (err: any) {
    console.error('Upload handler error:', err);
    res.status(500).json({ error: 'Yükleme sırasında teknik bir hata oluştu: ' + err.message });
  }
});

// Single Image Details (increment views)
app.get('/api/images/:id', (req, res) => {
  const image = db.getImageById(req.params.id);
  if (!image) {
    return res.status(404).json({ error: 'Resim bulunamadı.' });
  }

  // Check if image is expired on-the-fly
  const now = new Date().toISOString();
  if (image.expiresAt && image.expiresAt <= now) {
    db.deleteImage(image.id);
    return res.status(404).json({ error: 'Resim bulunamadı veya süresi doldu.' });
  }

  db.incrementImageViews(req.params.id);

  // Exclude localData from response
  const { localData, ...safeImage } = image;
  const siteUrlVal = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  safeImage.url = `${siteUrlVal}/${image.id}.${image.format || 'png'}`;
  res.json({
    ...safeImage,
    views: image.views + 1
  });
});

// Authenticated user's images
app.get('/api/images-mine', requireAuth, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Giriş yapılmadı' });
  const list = db.getImagesByUserId(req.user.id);
  const siteUrlVal = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  // Strip large localData fields and route image URLs through the secure proxy
  const safeList = list.map(({ localData, ...img }) => ({
    ...img,
    url: `${siteUrlVal}/${img.id}.${img.format || 'png'}`
  }));
  res.json({ images: safeList });
});

// Delete Image
app.delete('/api/images/:id', requireAuth, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Giriş yapılmadı' });
  const image = db.getImageById(req.params.id);
  if (!image) {
    return res.status(404).json({ error: 'Resim bulunamadı.' });
  }

  if (image.userId !== req.user.id) {
    return res.status(403).json({ error: 'Bu resmi silme yetkiniz bulunmamaktadır.' });
  }

  // Attempt to delete from cloud storage if configured
  await deleteImageFromStorage(image);

  db.deleteImage(req.params.id);
  res.json({ success: true, message: 'Resim başarıyla silindi.' });
});

// System Status Info (checks if Cloudinary is configured to display a helper badge)
app.get('/api/system-status', (req, res) => {
  const sysConfig = db.getSystemConfig();
  res.json({
    isCloudinaryConfigured,
    localFallbackActive: !isCloudinaryConfigured,
    maintenanceMode: sysConfig.maintenanceMode,
    announcement: sysConfig.announcement,
    announcementTemplate: sysConfig.announcementTemplate,
    announcements: sysConfig.announcements || [],
    guestUploadLimit: sysConfig.guestUploadLimit !== undefined ? sysConfig.guestUploadLimit : 5,
    adEnabled: sysConfig.adEnabled,
    adImageUrl: sysConfig.adImageUrl,
    adTargetUrl: sysConfig.adTargetUrl,
    adTitle: sysConfig.adTitle,
    adDescription: sysConfig.adDescription,
    adButtonText: sysConfig.adButtonText,
    adDuration: sysConfig.adDuration,
    premiumEnabled: sysConfig.premiumEnabled,
    premiumMonthlyPrice: sysConfig.premiumMonthlyPrice,
    premiumYearlyPrice: sysConfig.premiumYearlyPrice,
    adShowToRegistered: sysConfig.adShowToRegistered,
    bankName: sysConfig.bankName,
    bankIban: sysConfig.bankIban,
    bankReceiver: sysConfig.bankReceiver,
    adsenseEnabled: sysConfig.adsenseEnabled,
    adsensePublisherId: sysConfig.adsensePublisherId,
    adsenseAutoAdsEnabled: sysConfig.adsenseAutoAdsEnabled,
    adsenseResponsiveAdsEnabled: sysConfig.adsenseResponsiveAdsEnabled,
    bunnyStorageEnabled: sysConfig.bunnyStorageEnabled,
    bunnyStorageZoneName: sysConfig.bunnyStorageZoneName,
    bunnyStorageApiKey: sysConfig.bunnyStorageApiKey,
    bunnyStoragePullZoneUrl: sysConfig.bunnyStoragePullZoneUrl,
    bunnyStorageRegion: sysConfig.bunnyStorageRegion,
    instagramUrl: sysConfig.instagramUrl,
    twitterUrl: sysConfig.twitterUrl
  });
});

// Guest Upload Stats Endpoint
app.get('/api/guest-stats', (req, res) => {
  const sysConfig = db.getSystemConfig();
  const allowedLimit = sysConfig.guestUploadLimit !== undefined ? sysConfig.guestUploadLimit : 5;
  let guestId = (req.headers['x-guest-uuid'] as string) || '';
  if (!guestId) {
    guestId = crypto.createHash('sha256').update(req.ip || 'unknown-ip').digest('hex');
  }
  const count = db.getGuestUploadCount(guestId);
  res.json({
    count,
    limit: allowedLimit,
    remaining: Math.max(0, allowedLimit - count)
  });
});

// System Config (Public GET)
app.get('/api/system-config', (req, res) => {
  res.json(db.getSystemConfig());
});

// Dynamic ads.txt for Google AdSense verification
app.get('/ads.txt', (req, res) => {
  const sysConfig = db.getSystemConfig();
  const rawPubId = sysConfig.adsensePublisherId || '';
  // Clean publisher id just in case they added ca-pub- or pub- prefix or left it raw
  let pubId = rawPubId.trim();
  if (pubId && !pubId.startsWith('pub-')) {
    if (pubId.startsWith('ca-pub-')) {
      pubId = pubId.replace('ca-pub-', 'pub-');
    } else {
      pubId = 'pub-' + pubId;
    }
  }
  if (!pubId) {
    pubId = 'pub-0000000000000000'; // Default fallback until set
  }
  res.setHeader('Content-Type', 'text/plain');
  res.send(`google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`);
});

// Update System Config (Admin POST)
app.post('/api/system-config', requireAdmin, (req: AuthRequest, res) => {
  const { 
    maintenanceMode, 
    announcement, 
    announcementTemplate, 
    announcements, 
    guestUploadLimit,
    adEnabled,
    adImageUrl,
    adTargetUrl,
    adTitle,
    adDescription,
    adButtonText,
    adDuration,
    premiumEnabled,
    premiumMonthlyPrice,
    premiumYearlyPrice,
    adShowToRegistered,
    bankName,
    bankIban,
    bankReceiver,
    adsenseEnabled,
    adsensePublisherId,
    adsenseAutoAdsEnabled,
    adsenseResponsiveAdsEnabled,
    bunnyStorageEnabled,
    bunnyStorageZoneName,
    bunnyStorageApiKey,
    bunnyStoragePullZoneUrl,
    bunnyStorageRegion,
    instagramUrl,
    twitterUrl
  } = req.body;
  
  const updated = db.updateSystemConfig({
    maintenanceMode: maintenanceMode === true,
    announcement: announcement === undefined ? null : announcement,
    announcementTemplate: announcementTemplate === undefined ? null : announcementTemplate,
    announcements: Array.isArray(announcements) ? announcements : [],
    guestUploadLimit: typeof guestUploadLimit === 'number' ? guestUploadLimit : 5,
    adEnabled: adEnabled === true,
    adImageUrl: typeof adImageUrl === 'string' ? adImageUrl : undefined,
    adTargetUrl: typeof adTargetUrl === 'string' ? adTargetUrl : undefined,
    adTitle: typeof adTitle === 'string' ? adTitle : undefined,
    adDescription: typeof adDescription === 'string' ? adDescription : undefined,
    adButtonText: typeof adButtonText === 'string' ? adButtonText : undefined,
    adDuration: typeof adDuration === 'number' ? adDuration : undefined,
    premiumEnabled: premiumEnabled === true,
    premiumMonthlyPrice: typeof premiumMonthlyPrice === 'number' ? premiumMonthlyPrice : undefined,
    premiumYearlyPrice: typeof premiumYearlyPrice === 'number' ? premiumYearlyPrice : undefined,
    adShowToRegistered: adShowToRegistered === true,
    bankName: typeof bankName === 'string' ? bankName : undefined,
    bankIban: typeof bankIban === 'string' ? bankIban : undefined,
    bankReceiver: typeof bankReceiver === 'string' ? bankReceiver : undefined,
    adsenseEnabled: adsenseEnabled === true,
    adsensePublisherId: typeof adsensePublisherId === 'string' ? adsensePublisherId : undefined,
    adsenseAutoAdsEnabled: adsenseAutoAdsEnabled === true,
    adsenseResponsiveAdsEnabled: adsenseResponsiveAdsEnabled === true,
    bunnyStorageEnabled: bunnyStorageEnabled === true,
    bunnyStorageZoneName: typeof bunnyStorageZoneName === 'string' ? bunnyStorageZoneName : undefined,
    bunnyStorageApiKey: typeof bunnyStorageApiKey === 'string' ? bunnyStorageApiKey : undefined,
    bunnyStoragePullZoneUrl: typeof bunnyStoragePullZoneUrl === 'string' ? bunnyStoragePullZoneUrl : undefined,
    bunnyStorageRegion: typeof bunnyStorageRegion === 'string' ? bunnyStorageRegion : undefined,
    instagramUrl: typeof instagramUrl === 'string' ? instagramUrl : undefined,
    twitterUrl: typeof twitterUrl === 'string' ? twitterUrl : undefined
  });
  res.json(updated);
});

// Admin All Images list (Admin GET)
app.get('/api/admin/images', requireAdmin, (req: AuthRequest, res) => {
  const images = db.getImages();
  const siteUrlVal = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  // Strip large localData fields and route image URLs through the secure proxy
  const safeImages = images.map(({ localData, ...img }) => ({
    ...img,
    url: `${siteUrlVal}/${img.id}.${img.format || 'png'}`
  }));
  res.json({ images: safeImages });
});

// Admin Delete Image (Admin DELETE)
app.delete('/api/admin/images/:id', requireAdmin, async (req: AuthRequest, res) => {
  const image = db.getImageById(req.params.id);
  if (!image) {
    return res.status(404).json({ error: 'Resim bulunamadı.' });
  }

  // Attempt to delete from cloud storage if configured
  await deleteImageFromStorage(image);

  db.deleteImage(req.params.id);
  res.json({ success: true, message: 'Resim yönetici tarafından başarıyla silindi.' });
});

// Admin Delete All Images (Admin DELETE)
app.delete('/api/admin/images', requireAdmin, async (req: AuthRequest, res) => {
  const images = db.getImages();

  // Attempt to delete all images from cloud storage
  for (const image of images) {
    await deleteImageFromStorage(image);
  }

  db.deleteAllImages();
  res.json({ success: true, message: 'Tüm görseller başarıyla silindi.' });
});

// ================= ADMIN SECURITY & ANTI-DDOS ENDPOINTS =================

// Get Security Stats & Logs
app.get('/api/admin/security/stats', requireAdmin, (req: AuthRequest, res) => {
  const sysConfig = db.getSystemConfig();
  const now = Date.now();
  
  const activeBansArray: { ip: string; expiresAt: string; reason: string }[] = [];
  for (const [ip, ban] of temporaryBans.entries()) {
    if (now < ban.expiresAt) {
      activeBansArray.push({
        ip,
        expiresAt: new Date(ban.expiresAt).toISOString(),
        reason: ban.reason
      });
    }
  }

  res.json({
    ddosProtectionEnabled: sysConfig.ddosProtectionEnabled !== false,
    rateLimitGlobal: sysConfig.rateLimitGlobal || 600,
    rateLimitAuth: sysConfig.rateLimitAuth || 30,
    rateLimitUpload: sysConfig.rateLimitUpload || 120,
    botProtectionEnabled: sysConfig.botProtectionEnabled !== false,
    maliciousPayloadProtection: sysConfig.maliciousPayloadProtection !== false,
    totalBlockedRequests: totalBlockedRequestsCount,
    activeBansCount: activeBansArray.length,
    blacklist: db.getBlacklist(),
    whitelist: db.getWhitelist(),
    activeBans: activeBansArray,
    recentLogs: db.getSecurityLogs()
  });
});

// Update Security Config
app.post('/api/admin/security/config', requireAdmin, (req: AuthRequest, res) => {
  const {
    ddosProtectionEnabled,
    rateLimitGlobal,
    rateLimitAuth,
    rateLimitUpload,
    botProtectionEnabled,
    maliciousPayloadProtection
  } = req.body;

  const currentSysConfig = db.getSystemConfig();
  const updated = db.updateSystemConfig({
    ...currentSysConfig,
    ddosProtectionEnabled: ddosProtectionEnabled === true,
    rateLimitGlobal: typeof rateLimitGlobal === 'number' ? rateLimitGlobal : 600,
    rateLimitAuth: typeof rateLimitAuth === 'number' ? rateLimitAuth : 30,
    rateLimitUpload: typeof rateLimitUpload === 'number' ? rateLimitUpload : 120,
    botProtectionEnabled: botProtectionEnabled === true,
    maliciousPayloadProtection: maliciousPayloadProtection === true
  });

  res.json({ success: true, config: updated });
});

// Blacklist IP Management
app.post('/api/admin/security/ip-blacklist', requireAdmin, (req: AuthRequest, res) => {
  const { ip, action } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP adresi zorunludur.' });

  if (action === 'remove') {
    const blacklist = db.removeBlacklistedIp(ip);
    return res.json({ success: true, blacklist });
  } else {
    const blacklist = db.addBlacklistedIp(ip);
    db.addSecurityLog({
      ip,
      action: 'blocked',
      reason: 'Yönetici tarafından elle kara listeye eklendi',
      endpoint: 'ADMIN_PANEL'
    });
    return res.json({ success: true, blacklist });
  }
});

// Whitelist IP Management
app.post('/api/admin/security/ip-whitelist', requireAdmin, (req: AuthRequest, res) => {
  const { ip, action } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP adresi zorunludur.' });

  if (action === 'remove') {
    const whitelist = db.removeWhitelistedIp(ip);
    return res.json({ success: true, whitelist });
  } else {
    const whitelist = db.addWhitelistedIp(ip);
    db.addSecurityLog({
      ip,
      action: 'whitelisted',
      reason: 'Yönetici tarafından elle beyaz listeye eklendi',
      endpoint: 'ADMIN_PANEL'
    });
    return res.json({ success: true, whitelist });
  }
});

// Unban Temporary Banned IP
app.post('/api/admin/security/unban', requireAdmin, (req: AuthRequest, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP adresi zorunludur.' });

  temporaryBans.delete(ip);
  requestTrackers.delete(ip);
  res.json({ success: true, message: `${ip} adresi üzerindeki geçici engel kaldırıldı.` });
});

// Clear Security Logs
app.delete('/api/admin/security/logs', requireAdmin, (req: AuthRequest, res) => {
  db.clearSecurityLogs();
  res.json({ success: true, message: 'Güvenlik logları başarıyla temizlendi.' });
});

// ================= SITE LOGO ENDPOINTS =================

// Get Site Logo (Public)
app.get('/api/site-logo', (req, res) => {
  const logoPath = path.join(process.cwd(), 'public/logo.webp');
  if (fs.existsSync(logoPath)) {
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.sendFile(logoPath);
  }
  res.status(404).json({ error: 'Logo bulunamadı.' });
});

// Download Site Logo (Admin Only)
app.get('/api/download-logo', (req, res) => {
  let token = req.query.token as string;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Bu işlem için yetkiniz bulunmamaktadır.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum.' });
  }

  const userObj = db.getUserById(decoded.id);
  if (!userObj || !userObj.isAdmin) {
    return res.status(403).json({ error: 'Bu işlem için yönetici yetkiniz bulunmamaktadır.' });
  }

  const logoPath = path.join(process.cwd(), 'public/logo.jpg');
  if (fs.existsSync(logoPath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="anlikresim_logo.jpg"');
    res.setHeader('Content-Type', 'image/jpeg');
    return res.sendFile(logoPath);
  }
  res.status(404).json({ error: 'Logo bulunamadı.' });
});

// Download Instagram Profile Avatar (Public PNG)
app.get('/api/download-instagram', (req, res) => {
  const avatarPath = path.join(process.cwd(), 'src/assets/images/instagram_profile_picture_1786006991427.jpg');
  if (fs.existsSync(avatarPath)) {
    res.setHeader('Content-Disposition', 'attachment; filename="resimyukle_instagram_profile.png"');
    res.setHeader('Content-Type', 'image/png');
    return res.sendFile(avatarPath);
  }
  res.status(404).json({ error: 'Profil resmi bulunamadı.' });
});

// ================= ABUSE REPORTS (DMCA / VIOLATIONS) =================

// Public Submit Abuse Report
app.post('/api/reports', (req, res) => {
  const { imageId, imageUrl, reporterName, reporterEmail, reason, description } = req.body;
  if (!reporterName || !reporterEmail || !reason || !description) {
    return res.status(400).json({ error: 'Lütfen tüm alanları doldurun.' });
  }
  const report = db.addReport({
    imageId: imageId || null,
    imageUrl: imageUrl || null,
    reporterName,
    reporterEmail,
    reason,
    description
  });
  res.status(201).json({ success: true, report });
});

// Admin Get All Reports
app.get('/api/admin/reports', requireAdmin, (req: AuthRequest, res) => {
  res.json({ reports: db.getReports() });
});

// Admin Update Report Status
app.post('/api/admin/reports/:id/status', requireAdmin, (req: AuthRequest, res) => {
  const { status } = req.body;
  if (status !== 'pending' && status !== 'resolved') {
    return res.status(400).json({ error: 'Geçersiz durum.' });
  }
  const updated = db.updateReportStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Rapor bulunamadı.' });
  }
  res.json({ success: true, report: updated });
});

// Admin Delete Report
app.delete('/api/admin/reports/:id', requireAdmin, (req: AuthRequest, res) => {
  const deleted = db.deleteReport(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Rapor bulunamadı.' });
  }
  res.json({ success: true, message: 'Rapor silindi.' });
});

// ================= SUPPORT MESSAGES (CONTACT) =================

// Public Submit Support Message
app.post('/api/support-messages', optionalAuth, (req: AuthRequest, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Lütfen tüm alanları doldurun.' });
  }

  // Determine if premium user
  let isPremium = false;
  if (req.user) {
    const user = db.getUserById(req.user.id);
    if (user?.isPremium) {
      isPremium = true;
    }
  } else {
    const user = db.getUserByEmail(email);
    if (user?.isPremium) {
      isPremium = true;
    }
  }

  const msg = db.addSupportMessage({
    name,
    email,
    subject,
    message,
    isPremium
  });
  res.status(201).json({ success: true, message: msg });
});

// User Get Their Own Support Messages with Replies
app.get('/api/user/support-messages', requireAuth, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Lütfen giriş yapın.' });
  const fullUser = db.getUserById(req.user.id);
  if (!fullUser) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  const messages = db.getSupportMessages().filter(
    m => m.email.toLowerCase() === fullUser.email.toLowerCase()
  );
  res.json({ messages });
});

// Admin Get All Support Messages
app.get('/api/admin/support-messages', requireAdmin, (req: AuthRequest, res) => {
  res.json({ messages: db.getSupportMessages() });
});

// Admin Update Support Message Status
app.post('/api/admin/support-messages/:id/status', requireAdmin, (req: AuthRequest, res) => {
  const { status } = req.body;
  if (status !== 'unread' && status !== 'read' && status !== 'resolved') {
    return res.status(400).json({ error: 'Geçersiz durum.' });
  }
  const updated = db.updateSupportMessageStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Mesaj bulunamadı.' });
  }
  res.json({ success: true, message: updated });
});

// Admin Delete Support Message
app.delete('/api/admin/support-messages/:id', requireAdmin, (req: AuthRequest, res) => {
  const deleted = db.deleteSupportMessage(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Mesaj bulunamadı.' });
  }
  res.json({ success: true, message: 'Mesaj silindi.' });
});

// Admin Reset All Guest Counters
app.post('/api/admin/reset-guest-uploads', requireAdmin, (req: AuthRequest, res) => {
  db.resetAllGuestUploads();
  res.json({ success: true, message: 'Tüm misafir yükleme limitleri sıfırlandı.' });
});

// ================= PREMIUM & MEMBERSHIP MANAGEMENT ENDPOINTS =================

// Public Premium Purchase
app.post('/api/user/premium', requireAuth, (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Lütfen giriş yapın.' });
  const { plan, paymentMethod } = req.body;
  if (!plan || !paymentMethod) {
    return res.status(400).json({ error: 'Paket planı ve ödeme yöntemi seçilmelidir.' });
  }

  // Calculate expiration date
  const now = new Date();
  if (plan === 'monthly') {
    now.setMonth(now.getMonth() + 1);
  } else if (plan === 'yearly') {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    return res.status(400).json({ error: 'Geçersiz plan seçimi.' });
  }

  const updatedUser = db.updateUserPremium(req.user.id, true, plan, now.toISOString());
  if (!updatedUser) {
    return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  }

  res.json({
    success: true,
    message: 'Tebrikler! Premium üyeliğiniz başarıyla aktif edildi. Sınırsız, reklamsız ve 25 adete kadar toplu resim yükleme ayrıcalıklarınız başladı.',
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      isPremium: updatedUser.isPremium,
      premiumPlan: updatedUser.premiumPlan,
      premiumExpiresAt: updatedUser.premiumExpiresAt
    }
  });
});

// Admin Get All Registered Users
app.get('/api/admin/users', requireAdmin, (req: AuthRequest, res) => {
  const users = db.getUsers().map(({ passwordHash, ...u }) => u);
  res.json({ users });
});

// Admin Toggle User Premium Status Manually
app.post('/api/admin/users/:id/premium', requireAdmin, (req: AuthRequest, res) => {
  const { isPremium, plan } = req.body;
  const user = db.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
  }
  const expiresAt = isPremium ? (plan === 'yearly' ? new Date(Date.now() + 365*24*60*60*1000).toISOString() : new Date(Date.now() + 30*24*60*60*1000).toISOString()) : null;
  const updated = db.updateUserPremium(req.params.id, isPremium === true, isPremium ? plan || 'monthly' : null, expiresAt);
  res.json({ success: true, user: updated });
});

// Admin Reply To Support Message
app.post('/api/admin/support-messages/:id/reply', requireAdmin, (req: AuthRequest, res) => {
  const { reply } = req.body;
  if (!reply || !reply.trim()) {
    return res.status(400).json({ error: 'Lütfen geçerli bir cevap metni girin.' });
  }
  const updated = db.replyToSupportMessage(req.params.id, reply);
  if (!updated) {
    return res.status(404).json({ error: 'Destek talebi bulunamadı.' });
  }
  res.json({ success: true, message: updated });
});

// ================= SEO ENDPOINTS =================

// Dynamic robots.txt
app.get('/robots.txt', (req: Request, res: Response) => {
  const host = req.get('host') || 'www.anlikresim.com';
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  
  res.type('text/plain');
  res.send(
`User-agent: *
Allow: /
Allow: /i/
Allow: /api/system-status
Allow: /api/guest-stats
Allow: /api/site-logo
Allow: /api/images/
Disallow: /admin/
Disallow: /api/
Disallow: /galerim/

Sitemap: ${protocol}://${host}/sitemap.xml`
  );
});

// Dynamic sitemap.xml
app.get('/sitemap.xml', (req: Request, res: Response) => {
  try {
    const host = req.get('host') || 'www.anlikresim.com';
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;
    const currentDate = new Date().toISOString().split('T')[0];

    // Core static pages
    const staticPages = [
      { loc: '', changefreq: 'daily', priority: '1.0' },
      { loc: '/premium', changefreq: 'weekly', priority: '0.9' },
      { loc: '/yardim', changefreq: 'weekly', priority: '0.8' },
      { loc: '/hakkimizda', changefreq: 'monthly', priority: '0.7' },
      { loc: '/destek', changefreq: 'monthly', priority: '0.7' },
      { loc: '/sartlar', changefreq: 'monthly', priority: '0.5' },
      { loc: '/ihbar', changefreq: 'monthly', priority: '0.4' }
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static routes
    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page.loc}</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    // Dynamic Image Detail pages (if public images exist)
    try {
      const images = db.getImages();
      // Only index non-expired images
      const now = new Date().toISOString();
      const publicImages = images.filter(img => {
        return !img.expiresAt || img.expiresAt > now;
      });

      // Limit dynamic pages to top 5000 to keep it extremely fast
      const limitImages = publicImages.slice(0, 5000);
      limitImages.forEach(img => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/i/${img.id}</loc>\n`;
        const imgDate = img.createdAt ? img.createdAt.split('T')[0] : currentDate;
        xml += `    <lastmod>${imgDate}</lastmod>\n`;
        xml += '    <changefreq>monthly</changefreq>\n';
        xml += '    <priority>0.6</priority>\n';
        xml += '  </url>\n';
      });
    } catch (err) {
      console.error("Error adding dynamic image details to sitemap:", err);
    }

    xml += '</urlset>';

    res.type('application/xml');
    res.send(xml);
  } catch (globalErr) {
    console.error("Global error in sitemap generation:", globalErr);
    // Fallback: guaranteed valid XML sitemap on failure
    const host = req.get('host') || 'www.anlikresim.com';
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;
    const currentDate = new Date().toISOString().split('T')[0];
    
    let fallbackXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    fallbackXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    fallbackXml += '  <url>\n';
    fallbackXml += `    <loc>${baseUrl}</loc>\n`;
    fallbackXml += `    <lastmod>${currentDate}</lastmod>\n`;
    fallbackXml += '    <changefreq>daily</changefreq>\n';
    fallbackXml += '    <priority>1.0</priority>\n';
    fallbackXml += '  </url>\n';
    fallbackXml += '</urlset>';
    
    res.type('application/xml');
    res.send(fallbackXml);
  }
});

// ================= BACKGROUND CLEANUP OF EXPIRED IMAGES =================
function cleanupExpiredImages() {
  try {
    const now = new Date().toISOString();
    const images = db.getImages();
    const expired = images.filter(img => img.expiresAt && img.expiresAt <= now);
    if (expired.length > 0) {
      console.log(`[CLEANUP] Found ${expired.length} expired images.`);
      for (const img of expired) {
        deleteImageFromStorage(img).catch((err: any) => {
          console.error(`Failed to destroy expired asset for image ${img.id} during background cleanup:`, err);
        });
        db.deleteImage(img.id);
        console.log(`[CLEANUP] Successfully deleted expired image: ${img.id}`);
      }
    }
  } catch (err) {
    console.error("[CLEANUP] Error during expired images cleanup:", err);
  }
}

// ================= VITE OR STATIC SERVING =================

async function start() {
  // Start periodic cleanup of self-destructing/temporary images (runs every 10 seconds)
  setInterval(cleanupExpiredImages, 10000);

  // Initialize and synchronize Firestore with the local database in the background (non-blocking)
  db.initFirestore().then(() => {
    console.log("Firestore database synchronization finished in background.");
  }).catch((dbErr) => {
    console.error("Failed to initialize database connection/sync in background:", dbErr);
  });

  let vite: any = null;
  if (process.env.NODE_ENV !== 'production') {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
  }

  // Dynamic Open Graph / SEO Meta Tag Injection for image pages (/i/:id)
  app.get('/i/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const image = db.getImageById(id);
      
      let templatePath = '';
      if (process.env.NODE_ENV !== 'production') {
        templatePath = path.join(process.cwd(), 'index.html');
      } else {
        templatePath = path.join(process.cwd(), 'dist', 'index.html');
      }
      
      if (!fs.existsSync(templatePath)) {
        return next();
      }
      
      let html = fs.readFileSync(templatePath, 'utf8');
      
      // If we are in development mode and Vite is loaded, run Vite's HTML transformer
      if (process.env.NODE_ENV !== 'production' && vite) {
        html = await vite.transformIndexHtml(req.originalUrl, html);
      }
      
      const host = req.get('host') || 'www.anlikresim.com';
      const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;
      
      if (image) {
        const now = new Date().toISOString();
        if (!image.expiresAt || image.expiresAt > now) {
          const sizeStr = image.bytes >= 1024 * 1024 
            ? `${(image.bytes / (1024 * 1024)).toFixed(2)} MB` 
            : `${(image.bytes / 1024).toFixed(2)} KB`;
            
          const pageTitle = `${image.filename} - AnlıkResim`;
          const description = `AnlıkResim'e yüklenen ${image.filename} görselini görüntüleyin. Boyut: ${sizeStr}, Çözünürlük: ${image.width}x${image.height}.`;
          const directUrl = `${baseUrl}/${image.id}.${image.format || 'png'}`;
          const pageUrl = `${baseUrl}/i/${image.id}`;
          
          // Replace primary meta tags
          html = html.replace(/<title>.*?<\/title>/g, `<title>${pageTitle}</title>`);
          html = html.replace(/<meta name="title" content=".*?" \/>/g, `<meta name="title" content="${pageTitle}" />`);
          html = html.replace(/<meta name="description" content=".*?" \/>/g, `<meta name="description" content="${description}" />`);
          html = html.replace(/<link rel="canonical" href=".*?" \/>/g, `<link rel="canonical" href="${pageUrl}" />`);
          
          // Open Graph (Facebook / WhatsApp / Slack)
          html = html.replace(/<meta property="og:title" content=".*?" \/>/g, `<meta property="og:title" content="${pageTitle}" />`);
          html = html.replace(/<meta property="og:description" content=".*?" \/>/g, `<meta property="og:description" content="${description}" />`);
          html = html.replace(/<meta property="og:image" content=".*?" \/>/g, `<meta property="og:image" content="${directUrl}" />`);
          html = html.replace(/<meta property="og:url" content=".*?" \/>/g, `<meta property="og:url" content="${pageUrl}" />`);
          
          // Twitter Cards
          html = html.replace(/<meta property="twitter:title" content=".*?" \/>/g, `<meta property="twitter:title" content="${pageTitle}" />`);
          html = html.replace(/<meta property="twitter:description" content=".*?" \/>/g, `<meta property="twitter:description" content="${description}" />`);
          html = html.replace(/<meta property="twitter:image" content=".*?" \/>/g, `<meta property="twitter:image" content="${directUrl}" />`);
          html = html.replace(/<meta property="twitter:url" content=".*?" \/>/g, `<meta property="twitter:url" content="${pageUrl}" />`);
        }
      }
      
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'text/html');
      return res.send(html);
    } catch (err) {
      console.error("Open Graph Injector Middleware Error:", err);
      return next();
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    app.use(vite.middlewares);
    console.log("Vite dev server mounted as middleware.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    
    // Serve static files with optimized headers
    app.use(express.static(distPath, {
      maxAge: '1y', // Default cache for 1 year (will be overridden for HTML below)
      setHeaders: (res, filePath) => {
        // If it is index.html or any HTML file, or NOT in the assets folder, do not cache
        if (filePath.endsWith('.html') || !filePath.includes(path.join('dist', 'assets'))) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        } else {
          // Vite-built hashed assets are immutable and safe to cache forever on CDN & browsers
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    
    app.get('*', (req, res) => {
      // Set absolute no-cache for index.html SPA routing so users always get the latest updates instantly
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Production static files server mounted with optimized Caching policies.");
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} with Anti-DDoS Protection active.`);
  });

  // Slowloris & Hanging Request Protection Timeouts
  httpServer.headersTimeout = 10000; // 10s max headers
  httpServer.requestTimeout = 15000; // 15s max request processing
  httpServer.keepAliveTimeout = 5000; // 5s max keep-alive idle
}

start().catch((err) => {
  console.error("Failed to start server:", err);
});
