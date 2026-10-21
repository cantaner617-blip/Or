import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Globe, Cpu, Database, Server, Sparkles, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';
import siteLogo from '../assets/images/logo.webp';

interface AboutProps {
  user: User | null;
}

export default function About({ user }: AboutProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto space-y-8 py-4"
      id="about-page"
    >
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Ana Sayfaya Dön</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Hakkımızda &amp; Platform Mimarisi
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Türkiye'nin yeni nesil, yüksek performanslı ve modern resim yükleme platformu hakkında merak ettiğiniz mimari detaylar.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        
        {/* About Info Left Side */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-400" />
              Vizyonumuz
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              AnlıkResim, kullanıcıların görsellerini internete yüklerken reklamlar, yavaş hızlar veya karmaşık üyelik adımları ile zaman kaybetmesini önlemek amacıyla geliştirilmiş yüksek performanslı bir bulut platformudur. Amacımız, tek tıkla hem misafirlere hem de kayıtlı üyelerimize kusursuz, sade ve şık bir paylaşım deneyimi sunmaktır.
            </p>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Gelişmiş altyapımız sayesinde yüklediğiniz her görsel otomatik olarak optimize edilir, küresel içerik dağıtım ağı (CDN) aracılığıyla tüm dünyada milisaniyeler içinde görüntülenir.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="h-5 w-5 text-teal-400" />
              Gelişmiş Platform Özellikleri
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900 space-y-1.5">
                <span className="text-xs font-bold text-white block">Asenkron Yükleme Motoru</span>
                <span className="text-xs text-zinc-400 block">Modern drag-and-drop arayüzü ile dosyaları anında analiz eder ve eşzamanlı olarak güvenli bulut sunucularına aktarır.</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900 space-y-1.5">
                <span className="text-xs font-bold text-white block">Otomatik Link Jeneratörü</span>
                <span className="text-xs text-zinc-400 block">Doğrudan görsel bağlantıları, HTML yerleştirme kodları, Markdown ve forumlar için özel BBCode otomatik üretilir.</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900 space-y-1.5">
                <span className="text-xs font-bold text-white block">Akıllı Sıkıştırma Teknolojisi</span>
                <span className="text-xs text-zinc-400 block">Yüklenen resimlerin kalitesini korurken dosya boyutlarını azaltarak sitenizin yüklenme hızını maksimum düzeye taşır.</span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-900 space-y-1.5">
                <span className="text-xs font-bold text-white block">Esnek Depolama Seçenekleri</span>
                <span className="text-xs text-zinc-400 block">Hem yerel disk veritabanını hem de dünya standartlarındaki Cloudinary entegrasyonunu dinamik olarak destekler.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Architecture Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-white tracking-wider uppercase flex items-center gap-2">
              <Server className="h-4 w-4 text-teal-400" />
              Sistem Mimarisi
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="border-l-2 border-teal-500/40 pl-3 space-y-1">
                <span className="font-bold text-zinc-200 block">Frontend (Arayüz)</span>
                <span className="text-zinc-400 block">React 18, Vite, Tailwind CSS ve akıcı sayfa geçişleri için Motion kütüphanesi tercih edilmiştir.</span>
              </div>

              <div className="border-l-2 border-teal-500/40 pl-3 space-y-1">
                <span className="font-bold text-zinc-200 block">Backend (Sunucu)</span>
                <span className="text-zinc-400 block">TypeScript tabanlı asenkron Node.js ve hafif, yüksek performanslı Express.js mimarisi.</span>
              </div>

              <div className="border-l-2 border-teal-500/40 pl-3 space-y-1">
                <span className="font-bold text-zinc-200 block">Veri Depolama</span>
                <span className="text-zinc-400 block">Lokal JSON Veritabanı ve Firestore eşzamanlama motoruyla tam yedekli veri güvenliği.</span>
              </div>

              <div className="border-l-2 border-teal-500/40 pl-3 space-y-1">
                <span className="font-bold text-zinc-200 block">Bulut Entegrasyonu</span>
                <span className="text-zinc-400 block">Görseller için küresel Cloudinary depolama ve optimize edilmiş CDN altyapısı aktiftir.</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-5 space-y-3 text-xs text-zinc-400">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              %100 Güvenli Altyapı
            </h4>
            <p className="leading-relaxed">
              Yüklenen tüm içerikler sunucu tarafında virüs ve zararlı yazılımlara karşı taranmaktadır. Gizliliğinize önem veriyor, üye bilgilerini şifreli olarak saklıyoruz.
            </p>
          </div>

          {/* New Corporate Branding & Download Section */}
          {user?.isAdmin && (
            <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-yellow-500/5 p-5 space-y-4 text-xs">
              <h4 className="font-extrabold text-white flex items-center gap-1.5 uppercase tracking-wider text-amber-400">
                <Sparkles className="h-4 w-4 text-amber-400" />
                Marka Logomuz
              </h4>
              <div className="flex flex-col items-center gap-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-900/80">
                <img 
                  src="/logo.webp" 
                  alt="AnlıkResim Kurumsal Logo" 
                  width="96"
                  height="96"
                  loading="eager"
                  fetchPriority="high"
                  decoding="sync"
                  className="h-24 w-24 rounded-2xl object-cover shadow-[0_4px_20px_rgba(20,184,166,0.2)] border border-teal-500/20"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.src = siteLogo; }}
                />
                <p className="text-[10px] text-zinc-400 text-center leading-normal">
                  Platformumuzun resmi, yüksek kaliteli markalama ve paylaşım logosu.
                </p>
                <a 
                  href={`/api/download-logo?token=${localStorage.getItem('token') || ''}`}
                  download="anindaresim_logo.png"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 px-3 py-2 text-xs font-black text-zinc-950 transition-all shadow-md cursor-pointer"
                >
                  <span>PNG Olarak İndir</span>
                </a>
              </div>
            </div>
          )}
        </div>

      </div>

    </motion.div>
  );
}
