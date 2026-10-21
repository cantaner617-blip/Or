import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSecurityPanel from './AdminSecurityPanel';
import { 
  Settings, 
  Megaphone, 
  ShieldAlert, 
  ShieldCheck,
  Trash2, 
  Eye, 
  Sparkles, 
  Users, 
  Image as ImageIcon, 
  Eye as EyeIcon, 
  AlertTriangle,
  RefreshCw,
  Clock,
  MessageSquare,
  Mail,
  User,
  CheckCircle,
  ExternalLink,
  Search,
  ArrowUpDown,
  Filter,
  Send,
  CreditCard,
  HardDrive,
  Globe,
  Sliders,
  Check
} from 'lucide-react';
import { User as UserType, ImageRecord, Announcement, AbuseReport, SupportMessage } from '../types';

interface AdminPanelProps {
  user: UserType | null;
}

interface AdminImageRecord extends ImageRecord {
  userId: string | null;
  username?: string;
}

export default function AdminPanel({ user }: AdminPanelProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'system' | 'images' | 'reports' | 'support' | 'users' | 'security'>('system');
  const [systemSubTab, setSystemSubTab] = useState<'general' | 'announcements' | 'ads' | 'premium' | 'storage'>('general');
  
  const [images, setImages] = useState<AdminImageRecord[]>([]);
  const [reports, setReports] = useState<AbuseReport[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [usersList, setUsersList] = useState<UserType[]>([]);
  
  const [stats, setStats] = useState({
    totalImages: 0,
    totalViews: 0,
    guestImages: 0,
    memberImages: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // System Config State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [guestLimit, setGuestLimit] = useState(5);
  const [announcementsList, setAnnouncementsList] = useState<Announcement[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [announcementTemplate, setAnnouncementTemplate] = useState<'info' | 'warning' | 'success'>('info');

  // Premium Settings State
  const [premiumEnabled, setPremiumEnabled] = useState(true);
  const [premiumMonthlyPrice, setPremiumMonthlyPrice] = useState(150);
  const [premiumYearlyPrice, setPremiumYearlyPrice] = useState(1200);
  const [adShowToRegistered, setAdShowToRegistered] = useState(false);
  const [bankName, setBankName] = useState('Akbank');
  const [bankIban, setBankIban] = useState('TR56 0004 6000 1580 0745 9931 10');
  const [bankReceiver, setBankReceiver] = useState('ANINDARSİM YAZILIM BİLİŞİM LİMİTED ŞİRKETİ');

  // Users Tab Search
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Support Reply State
  const [replyMessageId, setReplyMessageId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Advertisement Settings State
  const [adEnabled, setAdEnabled] = useState(false);
  const [adImageUrl, setAdImageUrl] = useState('');
  const [adTargetUrl, setAdTargetUrl] = useState('');
  const [adTitle, setAdTitle] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adButtonText, setAdButtonText] = useState('');
  const [adDuration, setAdDuration] = useState(5);

  // Google AdSense Settings State
  const [adsenseEnabled, setAdsenseEnabled] = useState(false);
  const [adsensePublisherId, setAdsensePublisherId] = useState('');
  const [adsenseAutoAdsEnabled, setAdsenseAutoAdsEnabled] = useState(true);
  const [adsenseResponsiveAdsEnabled, setAdsenseResponsiveAdsEnabled] = useState(true);

  // Bunny.net Storage Settings State
  const [bunnyStorageEnabled, setBunnyStorageEnabled] = useState(false);
  const [bunnyStorageZoneName, setBunnyStorageZoneName] = useState('');
  const [bunnyStorageApiKey, setBunnyStorageApiKey] = useState('');
  const [bunnyStoragePullZoneUrl, setBunnyStoragePullZoneUrl] = useState('');
  const [bunnyStorageRegion, setBunnyStorageRegion] = useState('');

  // Social Media Links
  const [instagramUrl, setInstagramUrl] = useState('https://instagram.com/anlikresimcom');
  const [twitterUrl, setTwitterUrl] = useState('https://x.com/anlikresimcom');

  // Interactive Image Pool search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'guest' | 'member'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'views' | 'size'>('newest');

  // Image Preview Modal State
  const [previewImage, setPreviewImage] = useState<AdminImageRecord | null>(null);

  // Ready-Made Announcement Templates
  const readyTemplates = [
    {
      id: 'update',
      name: 'Sistem Güncellemesi 🚀',
      text: 'Sizlere daha iyi hizmet verebilmek için altyapımızı güncelledik! Artık yüklemeler %50 daha hızlı ve stabil çalışıyor. Keyifli paylaşımlar dileriz.',
      type: 'success' as const
    },
    {
      id: 'maintenance',
      name: 'Planlı Bakım Duyurusu 🛠️',
      text: 'Sistemlerimizde yapılacak planlı bakım çalışması nedeniyle bu gece 02:00 - 04:00 saatleri arasında yüklemelerde kısa süreli kesintiler yaşanabilir.',
      type: 'warning' as const
    },
    {
      id: 'welcome',
      name: 'AnlıkResim\'e Hoş Geldiniz! 🎉',
      text: 'Hızlı, reklamsız ve sınırsız görsel paylaşımının tadını çıkarın. Ücretsiz üye olarak yükleme limitinizi 100 MB\'a çıkarabileceğinizi unutmayın!',
      type: 'info' as const
    },
    {
      id: 'limit_increase',
      name: 'Yükleme Limiti Artırıldı! 🌟',
      text: 'Tüm kayıtlı üyelerimizin tek seferlik görsel yükleme limiti 100 MB\'tan 250 MB\'a çıkarılmıştır! Yüksek kaliteli fotoğraflarınızı kolayca paylaşabilirsiniz.',
      type: 'success' as const
    },
    {
      id: 'dmca_notice',
      name: 'Telif Hakkı & DMCA Bildirimi ⚖️',
      text: 'Platformumuzda telif hakkı ihlali veya izinsiz içerik tespiti durumunda, "Kötüye Kullanım Bildir" sayfamızdan ya da e-posta adresimizden bize ulaşabilirsiniz.',
      type: 'info' as const
    },
    {
      id: 'community_rules',
      name: 'Topluluk Kuralları Hatırlatması 🛡️',
      text: 'Güvenli bir paylaşım ortamı sağlamak adına platformumuza yasa dışı, yetişkin veya şiddet içeren görsel yüklenmesi kesinlikle yasaktır. İhlal durumunda IP engellemesi uygulanır.',
      type: 'warning' as const
    }
  ];

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    
    try {
      const statusRes = await fetch('/api/system-status');
      const statusData = await statusRes.json();
      if (statusRes.ok) {
        setMaintenanceMode(statusData.maintenanceMode || false);
        setAnnouncementsList(statusData.announcements || []);
        setGuestLimit(statusData.guestUploadLimit !== undefined ? statusData.guestUploadLimit : 5);
        setAdEnabled(statusData.adEnabled || false);
        setAdImageUrl(statusData.adImageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80");
        setAdTargetUrl(statusData.adTargetUrl || "https://ai.studio/build");
        setAdTitle(statusData.adTitle || "Sponsorlu Reklam");
        setAdDescription(statusData.adDescription || "Resim yükleme hizmetimizi ücretsiz sunabilmemiz için sponsorumuzu ziyaret edin.");
        setAdButtonText(statusData.adButtonText || "Sponsoru Ziyaret Et");
        setAdDuration(statusData.adDuration !== undefined ? statusData.adDuration : 5);
        
        setPremiumEnabled(statusData.premiumEnabled !== false);
        setPremiumMonthlyPrice(statusData.premiumMonthlyPrice !== undefined ? statusData.premiumMonthlyPrice : 150);
        setPremiumYearlyPrice(statusData.premiumYearlyPrice !== undefined ? statusData.premiumYearlyPrice : 1200);
        setAdShowToRegistered(statusData.adShowToRegistered || false);
        setBankName(statusData.bankName || 'Akbank');
        setBankIban(statusData.bankIban || 'TR56 0004 6000 1580 0745 9931 10');
        setBankReceiver(statusData.bankReceiver || 'ANINDARSİM YAZILIM BİLİŞİM LİMİTED ŞİRKETİ');

        setAdsenseEnabled(statusData.adsenseEnabled || false);
        setAdsensePublisherId(statusData.adsensePublisherId || '');
        setAdsenseAutoAdsEnabled(statusData.adsenseAutoAdsEnabled !== false);
        setAdsenseResponsiveAdsEnabled(statusData.adsenseResponsiveAdsEnabled !== false);

        setBunnyStorageEnabled(statusData.bunnyStorageEnabled || false);
        setBunnyStorageZoneName(statusData.bunnyStorageZoneName || '');
        setBunnyStorageApiKey(statusData.bunnyStorageApiKey || '');
        setBunnyStoragePullZoneUrl(statusData.bunnyStoragePullZoneUrl || '');
        setBunnyStorageRegion(statusData.bunnyStorageRegion || '');

        setInstagramUrl(statusData.instagramUrl || 'https://instagram.com/anlikresimcom');
        setTwitterUrl(statusData.twitterUrl || 'https://x.com/anlikresimcom');
      }

      const imagesRes = await fetch('/api/admin/images', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const imagesData = await imagesRes.json();
      
      if (!imagesRes.ok) {
        throw new Error(imagesData.error || "Yönetici verileri alınamadı.");
      }

      const allImages: AdminImageRecord[] = imagesData.images || [];
      setImages(allImages);

      const totalViews = allImages.reduce((sum, img) => sum + (img.views || 0), 0);
      const guestImages = allImages.filter(img => !img.userId).length;
      const memberImages = allImages.filter(img => img.userId).length;

      setStats({
        totalImages: allImages.length,
        totalViews,
        guestImages,
        memberImages
      });

      const reportsRes = await fetch('/api/admin/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (reportsRes.ok) {
        const rData = await reportsRes.json();
        setReports(rData.reports || []);
      }

      const supportRes = await fetch('/api/admin/support-messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (supportRes.ok) {
        const sData = await supportRes.json();
        setSupportMessages(sData.supportMessages || []);
      }

      const usersRes = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsersList(uData.users || []);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "İdari veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }
    fetchAdminData();
  }, [user]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/system-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          maintenanceMode,
          announcements: announcementsList,
          announcement: announcementsList.length > 0 ? announcementsList[0].message : null,
          announcementTemplate: announcementsList.length > 0 ? announcementsList[0].template : null,
          guestUploadLimit: Number(guestLimit),
          adEnabled,
          adImageUrl,
          adTargetUrl,
          adTitle,
          adDescription,
          adButtonText,
          adDuration: Number(adDuration),
          premiumEnabled,
          premiumMonthlyPrice: Number(premiumMonthlyPrice),
          premiumYearlyPrice: Number(premiumYearlyPrice),
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
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ayarlar kaydedilemedi.");
      }

      alert("✨ Tüm sistem ayarları başarıyla güncellendi ve www.anlikresim.com üzerinde aktif edildi!");
      fetchAdminData();
    } catch (err: any) {
      setError(err.message || "Ayarlar güncellenirken hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAnnouncement = () => {
    if (!announcement.trim()) return;
    const newAnn: Announcement = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      message: announcement.trim(),
      template: announcementTemplate,
      createdAt: new Date().toISOString()
    };
    setAnnouncementsList(prev => [newAnn, ...prev]);
    setAnnouncement('');
    setAnnouncementTemplate('info');
  };

  const handleRemoveAnnouncement = (id: string) => {
    setAnnouncementsList(prev => prev.filter(item => item.id !== id));
  };

  const handleDeleteImage = async (id: string) => {
    if (!window.confirm("Bu görseli sunucudan kalıcı olarak silmek istediğinize emin misiniz?")) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/admin/images/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Resim silinemedi.");
      }

      setImages(prev => prev.filter(img => img.id !== id));
      setStats(prev => ({
        ...prev,
        totalImages: prev.totalImages - 1
      }));
      if (previewImage?.id === id) {
        setPreviewImage(null);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAllImages = async () => {
    if (!window.confirm("⚠️ DİKKAT: SİSTEMDEKİ TÜM GÖRSELLERİ KALICI OLARAK SİLMEK İSTEDİĞİNİZE EMİN MİSİNİZ?\n\nBu işlem geri alınamaz!")) {
      return;
    }
    
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/admin/images', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Görseller silinemedi.");
      }

      setImages([]);
      setStats(prev => ({
        ...prev,
        totalImages: 0,
        totalViews: 0,
        guestImages: 0,
        memberImages: 0
      }));
      setPreviewImage(null);
      alert("Sistemdeki tüm görseller başarıyla temizlendi.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'resolved' })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Rapor güncellenemedi.');
      }
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm("Bu bildirim kaydını listeden tamamen silmek istediğinize emin misiniz?")) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Rapor silinemedi.');
      }
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMarkSupportMessage = async (msgId: string, status: 'read' | 'resolved') => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/support-messages/${msgId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Mesaj güncellenemedi.');
      }
      setSupportMessages(prev => prev.map(m => m.id === msgId ? { ...m, status } : m));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSupportMessage = async (msgId: string) => {
    if (!window.confirm("Bu destek talebini silmek istediğinize emin misiniz?")) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/support-messages/${msgId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Destek talebi silinemedi.');
      }
      setSupportMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetGuestUploads = async () => {
    if (!window.confirm("Tüm misafirlerin yükleme sayaçlarını sıfırlamak ve limitlerini tazelemek istediğinize emin misiniz?")) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/reset-guest-uploads', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Sayaçlar sıfırlanamadı.');
      }
      alert('Tüm misafir yükleme limitleri başarıyla sıfırlandı!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTogglePremium = async (userId: string, currentStatus: boolean) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/users/${userId}/premium`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPremium: !currentStatus })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Premium durumu güncellenemedi.');
      }
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, isPremium: !currentStatus } : u));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendReply = async (msgId: string) => {
    if (!replyContent.trim()) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/admin/support-messages/${msgId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reply: replyContent.trim() })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Cevap gönderilemedi.');
      }
      setSupportMessages(prev => prev.map(m => m.id === msgId ? { 
        ...m, 
        status: 'resolved', 
        adminReply: replyContent.trim(), 
        repliedAt: new Date().toISOString() 
      } : m));
      setReplyMessageId(null);
      setReplyContent('');
      alert('Cevabınız başarıyla iletildi!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const applyTemplate = (text: string, type: 'info' | 'warning' | 'success') => {
    setAnnouncement(text);
    setAnnouncementTemplate(type);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center space-x-3 text-zinc-400 bg-zinc-950/60 rounded-3xl border border-zinc-900 shadow-2xl">
        <RefreshCw className="h-7 w-7 animate-spin text-teal-400" />
        <span className="text-sm font-bold tracking-wide">Yönetim paneli yükleniyor...</span>
      </div>
    );
  }

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;
  const unreadMessagesCount = supportMessages.filter(m => m.status === 'unread').length;

  const filteredImages = images
    .filter(img => {
      const matchesSearch = img.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (img.filename && img.filename.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesType = filterType === 'all' || 
                          (filterType === 'member' && img.userId) || 
                          (filterType === 'guest' && !img.userId);
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'views') {
        return (b.views || 0) - (a.views || 0);
      } else if (sortBy === 'size') {
        return b.bytes - a.bytes;
      }
      return 0;
    });

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6" id="admin-panel">
      
      {/* Upper Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-zinc-900/80 to-zinc-950 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400/50 to-transparent"></div>
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-16 left-1/3 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-black uppercase tracking-wider shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
              <span>www.anlikresim.com • Yönetici Kontrol Merkezi</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <ShieldAlert className="h-9 w-9 text-teal-400 drop-shadow-[0_0_12px_rgba(20,184,166,0.3)]" />
              Sistem Yönetim Paneli
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed font-medium">
              Duyurular, reklam kampanyaları, Bunny.net depolama entegrasyonu, DMCA ihbarları ve 7/24 destek taleplerini tek merkezden profesyonelce yönetin.
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={fetchAdminData}
              className="flex items-center space-x-2 rounded-2xl border border-zinc-800/90 bg-zinc-900/90 hover:bg-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-200 transition-all cursor-pointer shadow-lg hover:border-teal-500/40 hover:text-white"
            >
              <RefreshCw className="h-4 w-4 text-teal-400 animate-spin-hover" />
              <span>Verileri Yenile</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 rounded-2xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 px-4 py-2.5 text-xs font-extrabold text-teal-300 transition-all cursor-pointer shadow-lg hover:border-teal-500/50"
            >
              <Globe className="h-4 w-4" />
              <span>Siteye Dön</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-400 flex items-center gap-3 shadow-lg">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Admin Quick Metrics Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="admin-stats-grid">
        
        {/* Metric 1: Total Images */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 flex flex-col justify-between shadow-xl group hover:border-teal-500/50 hover:shadow-[0_0_25px_rgba(20,184,166,0.12)] transition-all duration-300 backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500/40 via-cyan-400/40 to-transparent"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Toplam Görsel</span>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/25 group-hover:scale-110 group-hover:bg-teal-500/20 transition-all duration-300 shadow-inner">
              <ImageIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-white block tracking-tight font-mono">{stats.totalImages}</span>
            <span className="text-[11px] text-zinc-400 block font-medium">
              <span className="text-teal-400 font-bold">{stats.memberImages}</span> üye • <span className="text-zinc-500 font-bold">{stats.guestImages}</span> misafir
            </span>
          </div>
        </div>

        {/* Metric 2: Total Views */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 flex flex-col justify-between shadow-xl group hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.12)] transition-all duration-300 backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/40 via-teal-400/40 to-transparent"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Toplam İzlenme</span>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300 shadow-inner">
              <EyeIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-white block tracking-tight font-mono">{stats.totalViews.toLocaleString('tr-TR')}</span>
            <span className="text-[11px] text-zinc-400 block font-medium">Görsel görüntülenme</span>
          </div>
        </div>

        {/* Metric 3: DMCA Abuse Reports */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 flex flex-col justify-between shadow-xl group hover:border-rose-500/50 hover:shadow-[0_0_25px_rgba(244,63,94,0.12)] transition-all duration-300 backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-rose-500/40 via-pink-400/40 to-transparent"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">DMCA İhbarlar</span>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border group-hover:scale-110 transition-all duration-300 shadow-inner ${
              pendingReportsCount > 0 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 group-hover:bg-rose-500/20' 
                : 'bg-zinc-900/60 text-zinc-500 border-zinc-800'
            }`}>
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <span className={`text-3xl font-black block tracking-tight font-mono ${pendingReportsCount > 0 ? 'text-rose-400' : 'text-zinc-400'}`}>
              {pendingReportsCount}
            </span>
            <span className="text-[11px] text-zinc-400 block font-medium">Bekleyen şikayet</span>
          </div>
        </div>

        {/* Metric 4: Unread Support Messages */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 flex flex-col justify-between shadow-xl group hover:border-indigo-500/50 hover:shadow-[0_0_25px_rgba(99,102,241,0.12)] transition-all duration-300 backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500/40 via-blue-400/40 to-transparent"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Okunmamış Destek</span>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border group-hover:scale-110 transition-all duration-300 shadow-inner ${
              unreadMessagesCount > 0 
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 group-hover:bg-indigo-500/20' 
                : 'bg-zinc-900/60 text-zinc-500 border-zinc-800'
            }`}>
              <MessageSquare className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <span className={`text-3xl font-black block tracking-tight font-mono ${unreadMessagesCount > 0 ? 'text-indigo-400' : 'text-zinc-400'}`}>
              {unreadMessagesCount}
            </span>
            <span className="text-[11px] text-zinc-400 block font-medium">Cevap bekleyen mesaj</span>
          </div>
        </div>

        {/* Metric 5: Registered Users */}
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 flex flex-col justify-between shadow-xl group hover:border-amber-500/50 hover:shadow-[0_0_25px_rgba(245,158,11,0.12)] transition-all duration-300 backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/40 via-yellow-400/40 to-transparent"></div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Kayıtlı Üyeler</span>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/25 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300 shadow-inner">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-white block tracking-tight font-mono">{usersList.length}</span>
            <span className="text-[11px] text-amber-400 font-bold block">
              {usersList.filter(u => u.isPremium).length} VIP Üye
            </span>
          </div>
        </div>

      </div>

      {/* Main Upgraded Pill Tab Navigation */}
      <div className="p-2 rounded-2xl border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex flex-wrap gap-2 shadow-xl" id="admin-tabs">
        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 sm:px-5 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2.5 cursor-pointer ${
            activeTab === 'system' 
              ? 'bg-gradient-to-r from-teal-500/20 via-emerald-500/10 to-teal-500/20 border border-teal-500/40 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.15)]' 
              : 'bg-zinc-900/40 border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/80 hover:border-zinc-800'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Sistem &amp; Altyapı</span>
        </button>
        <button
          onClick={() => setActiveTab('images')}
          className={`px-4 sm:px-5 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2.5 cursor-pointer ${
            activeTab === 'images' 
              ? 'bg-gradient-to-r from-teal-500/20 via-emerald-500/10 to-teal-500/20 border border-teal-500/40 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.15)]' 
              : 'bg-zinc-900/40 border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/80 hover:border-zinc-800'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          <span>Görsel Havuzu</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-zinc-900 border border-zinc-800 text-teal-400 font-mono">
            {images.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 sm:px-5 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2.5 cursor-pointer ${
            activeTab === 'reports' 
              ? 'bg-gradient-to-r from-rose-500/20 via-pink-500/10 to-rose-500/20 border border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)]' 
              : 'bg-zinc-900/40 border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/80 hover:border-zinc-800'
          }`}
        >
          <ShieldAlert className="h-4 w-4" />
          <span>DMCA İhbarları</span>
          {pendingReportsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold animate-pulse">
              {pendingReportsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`px-4 sm:px-5 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2.5 cursor-pointer ${
            activeTab === 'support' 
              ? 'bg-gradient-to-r from-indigo-500/20 via-blue-500/10 to-indigo-500/20 border border-indigo-500/40 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
              : 'bg-zinc-900/40 border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/80 hover:border-zinc-800'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Destek Talepleri</span>
          {unreadMessagesCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold animate-pulse">
              {unreadMessagesCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 sm:px-5 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2.5 cursor-pointer ${
            activeTab === 'users' 
              ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
              : 'bg-zinc-900/40 border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/80 hover:border-zinc-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Kullanıcı Yönetimi</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-zinc-900 border border-zinc-800 text-amber-400 font-mono">
            {usersList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 sm:px-5 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2.5 cursor-pointer ${
            activeTab === 'security' 
              ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
              : 'bg-zinc-900/40 border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/80 hover:border-zinc-800'
          }`}
        >
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Güvenlik &amp; Anti-DDoS</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
            AKTİF
          </span>
        </button>
      </div>

      {/* ================= TAB 1: SYSTEM & CONFIGURATION ================= */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-200" id="tab-system-content">
          {/* Left Secondary Sub-Navigation */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-zinc-950/80 rounded-3xl border border-zinc-800/80 p-4 space-y-2 shadow-xl backdrop-blur-md">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-3 pb-2 block border-b border-zinc-800/80 mb-2">Altyapı Menüsü</span>
              
              <button
                type="button"
                onClick={() => setSystemSubTab('general')}
                className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-between cursor-pointer border ${
                  systemSubTab === 'general'
                    ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/10 border-teal-500/40 text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.12)]'
                    : 'bg-zinc-900/30 border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/80 hover:border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="h-4 w-4 text-teal-400" />
                  <span>Genel &amp; Limitler</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSystemSubTab('announcements')}
                className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-between cursor-pointer border ${
                  systemSubTab === 'announcements'
                    ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/10 border-teal-500/40 text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.12)]'
                    : 'bg-zinc-900/30 border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/80 hover:border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Megaphone className="h-4 w-4 text-teal-400" />
                  <span>Duyurular</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-900 border border-zinc-800 text-teal-400 font-mono">
                  {announcementsList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSystemSubTab('ads')}
                className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-between cursor-pointer border ${
                  systemSubTab === 'ads'
                    ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/10 border-teal-500/40 text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.12)]'
                    : 'bg-zinc-900/30 border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/80 hover:border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Sponsor &amp; AdSense</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSystemSubTab('storage')}
                className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-between cursor-pointer border ${
                  systemSubTab === 'storage'
                    ? 'bg-gradient-to-r from-teal-500/20 to-emerald-500/10 border-teal-500/40 text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.12)]'
                    : 'bg-zinc-900/30 border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/80 hover:border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <HardDrive className="h-4 w-4 text-cyan-400" />
                  <span>Bunny.net Depolama</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSystemSubTab('premium')}
                className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs font-extrabold transition-all flex items-center justify-between cursor-pointer border ${
                  systemSubTab === 'premium'
                    ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.12)]'
                    : 'bg-zinc-900/30 border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/80 hover:border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="h-4 w-4 text-amber-400" />
                  <span>VIP &amp; Banka İban</span>
                </div>
              </button>
            </div>

            <div className="bg-zinc-950/40 rounded-3xl border border-zinc-900 p-5 space-y-2 text-xs text-zinc-400 shadow-lg">
              <span className="font-extrabold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Clock className="h-3.5 w-3.5 text-teal-400" /> Kaydetme Onayı
              </span>
              <p className="leading-relaxed">Ayarlar sekmesinde yapacağınız tüm değişiklikler sağ alttaki veya üstteki <strong>"Tüm Ayarları Kaydet"</strong> butonuyla anında siteye yansır.</p>
            </div>
          </div>

          {/* Right Sub-Tab View Area */}
          <div className="md:col-span-3">
            <form onSubmit={handleSaveConfig} className="space-y-6">
              
              {/* SUB-TAB 1: GENERAL */}
              {systemSubTab === 'general' && (
                <div className="rounded-3xl border border-zinc-900 bg-zinc-950/60 p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                      <Sliders className="h-5 w-5 text-teal-400" />
                      Genel Sistem &amp; Ziyaretçi Limitleri
                    </h3>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span>Ayarları Kaydet</span>
                    </button>
                  </div>
                  
                  {/* Site Maintenance Toggle */}
                  <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-5 flex items-center justify-between shadow-inner">
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-white block">Site Bakım Modu</span>
                      <span className="text-xs text-zinc-400 block">Aktif edildiğinde sadece yöneticiler giriş yapabilir, ziyaretçilere bakım ekranı gösterilir.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={maintenanceMode}
                        onChange={(e) => setMaintenanceMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500 peer-checked:after:bg-zinc-950"></div>
                    </label>
                  </div>

                  {maintenanceMode && (
                    <div className="flex items-center gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 p-4 text-xs text-amber-300">
                      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
                      <span>Bakım modu açık! Değişiklikleri kaydettiğinizde www.anlikresim.com ziyaretçilere geçici olarak kapatılacaktır.</span>
                    </div>
                  )}

                  {/* Guest Limit Control */}
                  <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-5 space-y-4 shadow-inner">
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-white block">Misafir Görsel Yükleme Sınırı</span>
                      <span className="text-xs text-zinc-400 block">Ziyaretçilerin üye olmadan yükleyebileceği maksimum görsel sayısı.</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={guestLimit}
                        onChange={(e) => setGuestLimit(Number(e.target.value))}
                        className="w-full sm:w-1/3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleResetGuestUploads}
                        className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs px-4 py-3 transition-all cursor-pointer shadow-md"
                      >
                        <RefreshCw className="h-4 w-4 text-teal-400" />
                        <span>Tüm Misafir Sayaçlarını Sıfırla</span>
                      </button>
                    </div>
                  </div>

                  {/* Social Media Connections */}
                  <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-5 space-y-4 shadow-inner">
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-white block">Sosyal Medya Hesapları</span>
                      <span className="text-xs text-zinc-400 block">Ziyaretçilerin takip edebilmesi için alt bilgi alanında yer alan sosyal medya linkleri.</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-400">Instagram Sayfası URL</label>
                        <input
                          type="url"
                          placeholder="https://instagram.com/anlikresimcom"
                          value={instagramUrl}
                          onChange={(e) => setInstagramUrl(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-200 focus:border-teal-500 focus:outline-none font-medium"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-400">Twitter (X) Sayfası URL</label>
                        <input
                          type="url"
                          placeholder="https://x.com/anlikresimcom"
                          value={twitterUrl}
                          onChange={(e) => setTwitterUrl(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-200 focus:border-teal-500 focus:outline-none font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span>Değişiklikleri Kaydet</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: ANNOUNCEMENTS */}
              {systemSubTab === 'announcements' && (
                <div className="rounded-3xl border border-zinc-900 bg-zinc-950/60 p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                      <Megaphone className="h-5 w-5 text-teal-400" />
                      Duyuru &amp; Banner Yönetimi
                    </h3>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span>Ayarları Kaydet</span>
                    </button>
                  </div>

                  {/* Ready Presets */}
                  <div className="space-y-3 bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-5 shadow-inner">
                    <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider block">Hazır Duyuru Şablonları (Tek Tıkla Yükle)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {readyTemplates.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => applyTemplate(tmpl.text, tmpl.type)}
                          className="p-3 text-left rounded-xl border border-zinc-800 bg-zinc-950 hover:border-teal-500/50 hover:bg-zinc-900/60 transition-all group cursor-pointer space-y-1"
                        >
                          <span className="text-xs font-bold text-zinc-200 group-hover:text-teal-400 block">{tmpl.name}</span>
                          <p className="text-[11px] text-zinc-500 line-clamp-2">{tmpl.text}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Add Announcement Form */}
                  <div className="space-y-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-5 shadow-inner">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">Yeni Duyuru Metni</label>
                      <textarea
                        rows={3}
                        value={announcement}
                        onChange={(e) => setAnnouncement(e.target.value)}
                        placeholder="Ziyaretçilere site üst kısmında gösterilecek duyuru metnini yazın..."
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-white placeholder-zinc-600 focus:border-teal-500 focus:outline-none font-medium leading-relaxed"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-zinc-400">Şablon Tipi:</span>
                        <div className="flex items-center gap-2">
                          {[
                            { id: 'info', label: 'Mavi (Bilgi)' },
                            { id: 'success', label: 'Yeşil (Başarı)' },
                            { id: 'warning', label: 'Turuncu (Uyarı)' }
                          ].map(t => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setAnnouncementTemplate(t.id as any)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                                announcementTemplate === t.id 
                                  ? 'bg-teal-500 text-zinc-950 border-teal-500 shadow-md' 
                                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddAnnouncement}
                        className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 text-xs font-extrabold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Megaphone className="h-4 w-4" />
                        <span>Duyuruyu Listeye Ekle</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Announcements List */}
                  <div className="space-y-3">
                    <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider block">Aktif Duyuru Yayınları ({announcementsList.length})</span>
                    {announcementsList.length > 0 ? (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {announcementsList.map((item) => (
                          <div 
                            key={item.id}
                            className={`rounded-2xl border p-4 text-xs space-y-2 flex items-start justify-between gap-4 ${
                              item.template === 'success' 
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                                : item.template === 'warning'
                                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                  : 'bg-blue-500/10 text-blue-300 border-blue-500/20'
                            }`}
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[9px]">
                                <span className="h-2 w-2 rounded-full bg-current animate-pulse"></span>
                                {item.template === 'success' ? 'Başarılı / Güncelleme' : item.template === 'warning' ? 'Önemli Uyarı' : 'Sistem Bilgilendirmesi'}
                              </div>
                              <p className="leading-relaxed whitespace-pre-line font-medium text-zinc-200">{item.message}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveAnnouncement(item.id)}
                              className="p-2 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 transition-colors shrink-0 cursor-pointer"
                              title="Duyuruyu Kaldır"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-zinc-850 p-8 text-center text-xs text-zinc-600">
                        Şu anda aktif duyuru bulunmuyor.
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span>Tüm Değişiklikleri Kaydet</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: ADS & ADSENSE */}
              {systemSubTab === 'ads' && (
                <div className="rounded-3xl border border-zinc-900 bg-zinc-950/60 p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                      <Sparkles className="h-5 w-5 text-teal-400" />
                      Sponsor Reklam &amp; Google AdSense Entegrasyonu
                    </h3>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span>Ayarları Kaydet</span>
                    </button>
                  </div>

                  {/* Post-Upload Sponsor Banner Toggle */}
                  <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-5 space-y-4 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-white block">Görsel Yükleme Sonrası Sponsor Popup / Banner</span>
                        <span className="text-xs text-zinc-400 block">Kullanıcı görsel yükledikten sonra başarı ekranında çıkacak olan reklam modülü.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={adEnabled}
                          onChange={(e) => setAdEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-zinc-950"></div>
                      </label>
                    </div>

                    {adEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-zinc-800/60">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-400">Sponsor Görsel URL</label>
                          <input
                            type="url"
                            value={adImageUrl}
                            onChange={(e) => setAdImageUrl(e.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-200 focus:border-teal-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-400">Hedef Bağlantı (Target URL)</label>
                          <input
                            type="url"
                            value={adTargetUrl}
                            onChange={(e) => setAdTargetUrl(e.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-200 focus:border-teal-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-400">Reklam Başlığı</label>
                          <input
                            type="text"
                            value={adTitle}
                            onChange={(e) => setAdTitle(e.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-200 focus:border-teal-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-400">Buton Yazısı</label>
                          <input
                            type="text"
                            value={adButtonText}
                            onChange={(e) => setAdButtonText(e.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-200 focus:border-teal-500 focus:outline-none"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="text-xs font-bold text-zinc-400">Açıklama Metni</label>
                          <textarea
                            rows={2}
                            value={adDescription}
                            onChange={(e) => setAdDescription(e.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-200 focus:border-teal-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Google AdSense Configuration */}
                  <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-5 space-y-4 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-white block">Google AdSense Otomatik Reklamlar &amp; ads.txt</span>
                        <span className="text-xs text-zinc-400 block">Google AdSense yayıncı kimliğinizi girerek sitenizde onaylı reklam gösterimini başlatın.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={adsenseEnabled}
                          onChange={(e) => setAdsenseEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500 peer-checked:after:bg-zinc-950"></div>
                      </label>
                    </div>

                    {adsenseEnabled && (
                      <div className="space-y-4 pt-3 border-t border-zinc-800/60">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-400">Google Publisher ID (Örn: ca-pub-XXXXXXXXXXXXXXXX veya XXXXXXXXXXXXXXXX)</label>
                          <input
                            type="text"
                            placeholder="ca-pub-1234567890123456"
                            value={adsensePublisherId}
                            onChange={(e) => setAdsensePublisherId(e.target.value)}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-teal-300 font-mono focus:border-teal-500 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-6 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-300">
                            <input
                              type="checkbox"
                              checked={adsenseAutoAdsEnabled}
                              onChange={(e) => setAdsenseAutoAdsEnabled(e.target.checked)}
                              className="rounded border-zinc-800 bg-zinc-955 text-teal-500 focus:ring-0"
                            />
                            <span>Otomatik Reklamlar (Auto Ads) Aktif</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-300">
                            <input
                              type="checkbox"
                              checked={adsenseResponsiveAdsEnabled}
                              onChange={(e) => setAdsenseResponsiveAdsEnabled(e.target.checked)}
                              className="rounded border-zinc-800 bg-zinc-955 text-teal-500 focus:ring-0"
                            />
                            <span>Duyarlı (Responsive) Yerleşimler</span>
                          </label>
                        </div>
                        <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-[11px] text-teal-300">
                          ℹ️ Sistem otomatik olarak <code className="font-mono text-white">www.anlikresim.com/ads.txt</code> dosyasını girdiğiniz yayıncı kimliğinizle günceller.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span>Tüm Değişiklikleri Kaydet</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: BUNNY STORAGE */}
              {systemSubTab === 'storage' && (
                <div className="rounded-3xl border border-zinc-900 bg-zinc-950/60 p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                      <HardDrive className="h-5 w-5 text-teal-400" />
                      Bunny.net CDN &amp; Cloud Storage Entegrasyonu
                    </h3>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span>Ayarları Kaydet</span>
                    </button>
                  </div>

                  <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-5 space-y-4 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-white block">Bunny.net Bulut Depolama Kullan</span>
                        <span className="text-xs text-zinc-400 block">Yüklenen tüm görselleri yüksek hızlı Bunny.net Storage Zone alanınıza depolayın ve CDN ile sunun.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={bunnyStorageEnabled}
                          onChange={(e) => setBunnyStorageEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500 peer-checked:after:bg-zinc-950"></div>
                      </label>
                    </div>

                    {bunnyStorageEnabled && (
                      <div className="space-y-4 pt-3 border-t border-zinc-800/60">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-400">Storage Zone Adı (Storage Zone Name)</label>
                            <input
                              type="text"
                              placeholder="anlikresim-storage"
                              value={bunnyStorageZoneName}
                              onChange={(e) => setBunnyStorageZoneName(e.target.value)}
                              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-teal-300 font-mono focus:border-teal-500 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-400">API Şifresi (Storage API Access Key)</label>
                            <input
                              type="password"
                              placeholder="************************"
                              value={bunnyStorageApiKey}
                              onChange={(e) => setBunnyStorageApiKey(e.target.value)}
                              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-200 font-mono focus:border-teal-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-400">Pull Zone CDN URL (Örn: https://anlikresim.b-cdn.net)</label>
                            <input
                              type="url"
                              placeholder="https://anlikresim.b-cdn.net"
                              value={bunnyStoragePullZoneUrl}
                              onChange={(e) => setBunnyStoragePullZoneUrl(e.target.value)}
                              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-teal-300 font-mono focus:border-teal-500 focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-400">Bölge (Storage Region: de, falkenstein, ny, sg, vb.)</label>
                            <input
                              type="text"
                              placeholder="de (veya boş bırakın)"
                              value={bunnyStorageRegion}
                              onChange={(e) => setBunnyStorageRegion(e.target.value)}
                              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-200 font-mono focus:border-teal-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span>Tüm Değişiklikleri Kaydet</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SUB-TAB 5: PREMIUM & BANK */}
              {systemSubTab === 'premium' && (
                <div className="rounded-3xl border border-zinc-900 bg-zinc-950/60 p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                      <CreditCard className="h-5 w-5 text-teal-400" />
                      VIP Paket &amp; Banka Havale / EFT Ayarları
                    </h3>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span>Ayarları Kaydet</span>
                    </button>
                  </div>

                  <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-5 space-y-4 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-sm font-bold text-white block">Premium / VIP Abonelik Sistemi</span>
                        <span className="text-xs text-zinc-400 block">Kullanıcıların aylık veya yıllık VIP paket alabilmesini ve reklamsız yüksek limitli kullanmasını sağlayın.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={premiumEnabled}
                          onChange={(e) => setPremiumEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-zinc-950"></div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-zinc-800/60">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-400">Aylık VIP Fiyatı (TL)</label>
                        <input
                          type="number"
                          value={premiumMonthlyPrice}
                          onChange={(e) => setPremiumMonthlyPrice(Number(e.target.value))}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-amber-400 font-bold focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-400">Yıllık VIP Fiyatı (TL)</label>
                        <input
                          type="number"
                          value={premiumYearlyPrice}
                          onChange={(e) => setPremiumYearlyPrice(Number(e.target.value))}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-amber-400 font-bold focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/40 rounded-2xl border border-zinc-800/80 p-5 space-y-4 shadow-inner">
                    <span className="text-sm font-bold text-white block">Banka Havale / EFT Bilgileri (Ödeme Ekranı için)</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-400">Banka Adı</label>
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-200 focus:border-teal-500 focus:outline-none font-medium"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-zinc-400">IBAN Numarası</label>
                        <input
                          type="text"
                          value={bankIban}
                          onChange={(e) => setBankIban(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-teal-300 font-mono focus:border-teal-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-3">
                        <label className="text-xs font-bold text-zinc-400">Hesap Sahibi / Alıcı Unvanı</label>
                        <input
                          type="text"
                          value={bankReceiver}
                          onChange={(e) => setBankReceiver(e.target.value)}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-200 focus:border-teal-500 focus:outline-none font-medium uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-zinc-950 rounded-xl font-extrabold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span>Tüm Değişiklikleri Kaydet</span>
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      )}

      {/* ================= TAB 2: IMAGE POOL & MANAGEMENT ================= */}
      {activeTab === 'images' && (
        <div className="rounded-3xl border border-zinc-900 bg-zinc-950/60 p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200" id="tab-images-content">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ImageIcon className="h-6 w-6 text-teal-400" />
                Sistem Görsel Havuzu ({filteredImages.length} / {images.length})
              </h2>
              <p className="text-xs text-zinc-400">Sunucu üzerinde kayıtlı olan tüm görselleri arayın, detaylı inceleyin veya kalıcı olarak silin.</p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              {(searchQuery || filterType !== 'all' || sortBy !== 'newest') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setSortBy('newest');
                  }}
                  className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
                >
                  Filtreleri Sıfırla
                </button>
              )}

              {images.length > 0 && (
                <button
                  onClick={handleDeleteAllImages}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 hover:border-red-500 text-xs font-bold text-red-400 hover:text-red-300 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Tüm Görselleri Kalıcı Olarak Sil</span>
                </button>
              )}
            </div>
          </div>

          {/* Search and Filters Controller Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/80 shadow-inner">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="h-4 w-4 text-zinc-500" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ID veya Dosya adı ara..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-500 transition-all font-medium"
              />
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3.5 pointer-events-none">
                <Filter className="h-4 w-4 text-zinc-500" />
              </span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-8 text-xs text-zinc-200 cursor-pointer focus:outline-none focus:border-teal-500 font-medium"
              >
                <option value="all">Tüm Yükleyenler</option>
                <option value="member">Sadece Kayıtlı Üyeler</option>
                <option value="guest">Sadece Misafirler</option>
              </select>
              <span className="absolute right-3.5 text-zinc-500 text-[10px] pointer-events-none">▼</span>
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3.5 pointer-events-none">
                <ArrowUpDown className="h-4 w-4 text-zinc-500" />
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-8 text-xs text-zinc-200 cursor-pointer focus:outline-none focus:border-teal-500 font-medium"
              >
                <option value="newest">Sıralama: En Yeni</option>
                <option value="oldest">Sıralama: En Eski</option>
                <option value="views">Sıralama: En Çok İzlenen</option>
                <option value="size">Sıralama: En Büyük Dosya</option>
              </select>
              <span className="absolute right-3.5 text-zinc-500 text-[10px] pointer-events-none">▼</span>
            </div>
          </div>

          {filteredImages.length === 0 ? (
            <div className="text-center p-16 rounded-2xl bg-zinc-900/20 text-sm text-zinc-500 border border-zinc-900">
              Kriterlere uyan hiçbir görsel bulunamadı.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-900 shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-950/80 text-zinc-400 uppercase tracking-widest font-extrabold border-b border-zinc-900 text-[10px]">
                    <th className="p-4">Önizleme</th>
                    <th className="p-4">Görsel ID &amp; Dosya Adı</th>
                    <th className="p-4">Yükleyen</th>
                    <th className="p-4">Boyut &amp; Çözünürlük</th>
                    <th className="p-4">İzlenme</th>
                    <th className="p-4">Tarih</th>
                    <th className="p-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {filteredImages.map((img) => {
                    const fileSizeKb = (img.bytes / 1024).toFixed(1);
                    return (
                      <tr key={img.id} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="p-4">
                          <div 
                            onClick={() => setPreviewImage(img)}
                            className="h-12 w-12 shrink-0 bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center border border-zinc-800 cursor-pointer hover:border-teal-500 transition-all shadow-md group"
                          >
                            <img 
                              src={img.url} 
                              alt={img.filename} 
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        </td>
                        <td className="p-4 font-mono max-w-[220px]">
                          <span className="text-teal-400 font-bold block">{img.id}</span>
                          <span className="text-zinc-500 block text-[10px] truncate font-sans">{img.filename}</span>
                        </td>
                        <td className="p-4">
                          {img.userId ? (
                            <span className="inline-flex items-center rounded-full bg-teal-400/10 px-2.5 py-0.5 text-[10px] font-bold text-teal-400 border border-teal-400/20">
                              Kayıtlı Üye
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-bold text-zinc-400">
                              Misafir Kullanıcı
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-zinc-300 font-medium">
                          <span className="block">{fileSizeKb} KB</span>
                          <span className="block text-[10px] text-zinc-500">{img.width}x{img.height} px</span>
                        </td>
                        <td className="p-4 text-zinc-200 font-extrabold font-mono">
                          {img.views || 0}
                        </td>
                        <td className="p-4 text-zinc-500 font-medium">
                          {new Date(img.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => setPreviewImage(img)}
                            className="rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 p-2 transition-all cursor-pointer shadow-md"
                            title="Büyük Önizle"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/i/${img.id}`)}
                            className="rounded-xl border border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 p-2 transition-all cursor-pointer shadow-md"
                            title="Detay Sayfası"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteImage(img.id)}
                            className="rounded-xl border border-red-950 bg-red-950/20 hover:bg-red-950/50 text-red-400 p-2 transition-all cursor-pointer shadow-md"
                            title="Kalıcı Olarak Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Image Preview Modal */}
          {previewImage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in">
              <div className="relative max-w-2xl w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white truncate max-w-md">{previewImage.filename}</h3>
                    <p className="text-xs text-zinc-400 font-mono">ID: <span className="text-teal-400">{previewImage.id}</span> • {previewImage.width}x{previewImage.height} px</p>
                  </div>
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="flex items-center justify-center bg-zinc-950 rounded-2xl p-4 max-h-[60vh] overflow-hidden border border-zinc-800/80">
                  <img 
                    src={previewImage.url} 
                    alt={previewImage.filename} 
                    referrerPolicy="no-referrer"
                    className="max-h-[55vh] object-contain rounded-xl shadow-lg"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      const id = previewImage.id;
                      setPreviewImage(null);
                      navigate(`/i/${id}`);
                    }}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Detay Sayfasına Git</span>
                  </button>
                  <button
                    onClick={() => handleDeleteImage(previewImage.id)}
                    className="px-4 py-2 bg-red-950/50 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Görseli Kalıcı Olarak Sil</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: DMCA / ABUSE REPORTS ================= */}
      {activeTab === 'reports' && (
        <div className="rounded-3xl border border-zinc-900 bg-zinc-950/60 p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200" id="tab-reports-content">
          <div className="border-b border-zinc-900 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <ShieldAlert className="h-6 w-6 text-red-400" />
              Telif Hakkı (DMCA) &amp; İhlal İhbarları ({reports.length})
            </h2>
            <p className="text-xs text-zinc-400">Ziyaretçiler tarafından iletilen telif hakkı bildirimlerini ve uygunsuz içerik şikayetlerini bu panelden denetleyin.</p>
          </div>

          {reports.length === 0 ? (
            <div className="text-center p-16 rounded-2xl bg-zinc-900/20 text-sm text-zinc-500 border border-zinc-900">
              Harika! Şu anda incelenmeyi bekleyen hiçbir ihlal bildirimi bulunmuyor.
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((rep) => (
                <div 
                  key={rep.id} 
                  className={`rounded-3xl border p-6 space-y-4 transition-all shadow-xl ${
                    rep.status === 'pending'
                      ? 'bg-red-950/10 border-red-900/40'
                      : 'bg-zinc-900/30 border-zinc-800/80 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                          rep.reason.includes('Telif') 
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}>
                          {rep.reason}
                        </span>
                        
                        {rep.status === 'pending' ? (
                          <span className="inline-flex items-center rounded-full bg-red-400/10 px-3 py-1 text-xs font-bold text-red-400 ring-1 ring-inset ring-red-400/30">
                            İnceleme Bekliyor
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-inset ring-emerald-400/30">
                            Çözüldü / İncelendi
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 font-bold">Rapor ID: <span className="font-mono text-zinc-400">{rep.id}</span> • {new Date(rep.createdAt).toLocaleString('tr-TR')}</p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {rep.status === 'pending' && (
                        <button
                          onClick={() => handleResolveReport(rep.id)}
                          className="flex items-center space-x-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-md"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Çözüldü Olarak İşaretle</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReport(rep.id)}
                        className="rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 p-2 transition-colors cursor-pointer shadow-md"
                        title="İhbarı Arşivden Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-zinc-950/60 p-4 rounded-2xl border border-zinc-900">
                    <div>
                      <span className="text-zinc-500 font-extrabold block uppercase tracking-wider text-[9px] mb-1">Bildiren Kişi</span>
                      <p className="text-zinc-200 font-bold">{rep.reporterName}</p>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-extrabold block uppercase tracking-wider text-[9px] mb-1">İletişim E-Posta</span>
                      <a href={`mailto:${rep.reporterEmail}`} className="text-teal-400 hover:underline font-bold block">{rep.reporterEmail}</a>
                    </div>
                  </div>

                  {(rep.imageId || rep.imageUrl) && (
                    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-900 text-xs">
                      <div className="flex items-center gap-4 min-w-0">
                        {rep.imageUrl && (
                          <div className="h-16 w-16 shrink-0 bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden flex items-center justify-center shadow-md">
                            <img 
                              src={rep.imageUrl} 
                              alt="Şikayet Edilen Görsel" 
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="space-y-1 min-w-0">
                          <span className="text-zinc-500 font-extrabold uppercase tracking-wider text-[9px] block">İhbar Edilen İçerik</span>
                          {rep.imageId && <p className="text-zinc-300 font-mono text-xs">ID: <span className="text-teal-400 font-bold">{rep.imageId}</span></p>}
                          {rep.imageUrl && (
                            <a 
                              href={rep.imageUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-teal-400 hover:underline font-medium truncate block flex items-center gap-1"
                            >
                              <span>Görsel Bağlantısını Aç</span>
                              <ExternalLink className="h-3 w-3 inline-block" />
                            </a>
                          )}
                        </div>
                      </div>

                      {rep.imageId && (
                        <button
                          onClick={() => handleDeleteImage(rep.imageId!)}
                          className="flex items-center space-x-1.5 rounded-xl border border-red-950 bg-red-950/30 hover:bg-red-900/60 text-red-400 px-4 py-2 font-bold transition-all shrink-0 text-xs cursor-pointer shadow-md"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Görseli Sunucudan Sil</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <span className="text-zinc-500 font-extrabold uppercase tracking-wider text-[9px] block">Şikayet Açıklaması &amp; Gerekçe</span>
                    <p className="text-sm text-zinc-200 font-medium whitespace-pre-wrap leading-relaxed bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 select-text">
                      {rep.description}
                    </p>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: SUPPORT MESSAGES ================= */}
      {activeTab === 'support' && (
        <div className="rounded-3xl border border-zinc-900 bg-zinc-950/60 p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200" id="tab-support-content">
          <div className="border-b border-zinc-900 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <MessageSquare className="h-6 w-6 text-blue-400" />
              7/24 İletişim &amp; Destek Merkezi Talepleri ({supportMessages.length})
            </h2>
            <p className="text-xs text-zinc-400">Kullanıcılar tarafından form üzerinden gönderilen yardım, destek ve vip talepleri.</p>
          </div>

          {supportMessages.length === 0 ? (
            <div className="text-center p-16 rounded-2xl bg-zinc-900/20 text-sm text-zinc-500 border border-zinc-900">
              Şu anda cevaplanmayı bekleyen hiçbir destek talebi bulunmuyor.
            </div>
          ) : (
            <div className="space-y-4">
              {supportMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`rounded-3xl border p-6 space-y-4 transition-all shadow-xl ${
                    msg.status === 'unread'
                      ? 'bg-blue-950/10 border-blue-900/40'
                      : 'bg-zinc-900/30 border-zinc-800/80 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <strong className="text-base text-white font-extrabold">{msg.subject}</strong>
                        
                        {msg.isPremium && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-0.5 text-[10px] font-black text-amber-400 border border-amber-500/30 animate-pulse">
                            <Sparkles className="h-3 w-3 fill-amber-400/20 text-amber-400" />
                            <span>PREMIUM VIP TALEBİ</span>
                          </span>
                        )}

                        {msg.status === 'unread' ? (
                          <span className="inline-flex items-center rounded-full bg-blue-400/10 px-3 py-1 text-xs font-bold text-blue-400 ring-1 ring-inset ring-blue-400/30 animate-pulse">
                            Yeni Mesaj
                          </span>
                        ) : msg.status === 'read' ? (
                          <span className="inline-flex items-center rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-400">
                            Okundu
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-inset ring-emerald-400/30">
                            Cevaplandı / Çözüldü
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 font-bold">Mesaj ID: <span className="font-mono text-zinc-400">{msg.id}</span> • {new Date(msg.createdAt).toLocaleString('tr-TR')}</p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {msg.status === 'unread' && (
                        <button
                          onClick={() => handleMarkSupportMessage(msg.id, 'read')}
                          className="flex items-center space-x-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer shadow-md"
                        >
                          <span>Okundu İşaretle</span>
                        </button>
                      )}
                      {msg.status !== 'resolved' && (
                        <button
                          onClick={() => handleMarkSupportMessage(msg.id, 'resolved')}
                          className="flex items-center space-x-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-md"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Çözüldü Olarak İşaretle</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSupportMessage(msg.id)}
                        className="rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 p-2 transition-colors cursor-pointer shadow-md"
                        title="Talebi Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-zinc-950/60 p-4 rounded-2xl border border-zinc-900">
                    <div>
                      <span className="text-zinc-500 font-extrabold block uppercase tracking-wider text-[9px] mb-1">Gönderen Kişi</span>
                      <p className="text-zinc-200 font-bold flex items-center gap-1.5">
                        <User className="h-4 w-4 text-teal-400" />
                        {msg.name}
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-extrabold block uppercase tracking-wider text-[9px] mb-1">E-Posta Adresi</span>
                      <a href={`mailto:${msg.email}`} className="text-teal-400 hover:underline font-bold block flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-teal-400" />
                        {msg.email}
                      </a>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-zinc-500 font-extrabold uppercase tracking-wider text-[9px] block">İletilen Mesaj İçeriği</span>
                    <p className="text-sm text-zinc-200 font-medium whitespace-pre-wrap leading-relaxed bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 select-text">
                      {msg.message}
                    </p>
                  </div>

                  {msg.adminReply && (
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-5 text-xs space-y-2 shadow-inner">
                      <div className="flex items-center justify-between text-[10px] font-extrabold text-amber-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-amber-400 fill-amber-400/20" />
                          <span>YÖNETİCİ DESTEK CEVABI (CANLI)</span>
                        </span>
                        <span>{msg.repliedAt ? new Date(msg.repliedAt).toLocaleString('tr-TR') : ''}</span>
                      </div>
                      <p className="text-zinc-100 font-medium whitespace-pre-wrap leading-relaxed">{msg.adminReply}</p>
                    </div>
                  )}

                  <div className="pt-2">
                    {replyMessageId === msg.id ? (
                      <div className="space-y-3 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 shadow-xl">
                        <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest block">Kullanıcı Paneline İletilecek Yanıt:</span>
                        <textarea
                          required
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Kullanıcının panelinde anında görünecek profesyonel cevabınızı buraya yazın..."
                          rows={4}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors placeholder-zinc-600 font-medium leading-relaxed"
                        />
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyMessageId(null);
                              setReplyContent('');
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          >
                            İptal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendReply(msg.id)}
                            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg transition-colors"
                          >
                            <span>Cevabı Yayınla</span>
                            <Send className="h-4 w-4 text-zinc-950" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 flex-wrap">
                        <button
                          onClick={() => {
                            setReplyMessageId(msg.id);
                            setReplyContent('');
                          }}
                          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-400 text-xs font-bold transition-all cursor-pointer shadow-md"
                        >
                          <MessageSquare className="h-4 w-4 text-amber-400" />
                          <span>Destek Sisteminden Yanıtla</span>
                        </button>
                        
                        <a 
                          href={`mailto:${msg.email}?subject=Ynt: ${encodeURIComponent(msg.subject)}`}
                          className="inline-flex items-center space-x-1.5 text-xs font-bold text-teal-400 hover:underline"
                        >
                          <Mail className="h-4 w-4" />
                          <span>E-Posta ile Yanıt Gönder</span>
                        </a>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 5: USERS MANAGEMENT ================= */}
      {activeTab === 'users' && (
        <div className="rounded-3xl border border-zinc-900 bg-zinc-950/60 p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-200" id="tab-users-content">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                <Users className="h-6 w-6 text-teal-400" />
                Kullanıcı Yönetimi ({usersList.length})
              </h2>
              <p className="text-xs text-zinc-400">Kayıtlı kullanıcıları listeleyin ve Premium VIP üyelik durumlarını tek tıkla yönetin.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 shadow-inner">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Kullanıcı adı veya e-posta adresi ile arayın..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500 font-medium transition-colors"
              />
            </div>
          </div>

          <div className="border border-zinc-900 bg-zinc-905 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-950/80 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">
                    <th className="p-4.5">Kullanıcı Bilgileri</th>
                    <th className="p-4.5">Yetki Seviyesi</th>
                    <th className="p-4.5">Kayıt Tarihi</th>
                    <th className="p-4.5 text-right">VIP / Premium Durumu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {usersList
                    .filter(u => {
                      const query = userSearchQuery.toLowerCase();
                      return u.username.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
                    })
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-900/30 text-xs text-zinc-300 transition-colors">
                        <td className="p-4.5">
                          <div className="font-extrabold text-white text-sm">{item.username}</div>
                          <div className="text-[11px] text-zinc-400 font-medium">{item.email}</div>
                        </td>
                        <td className="p-4.5">
                          {item.isAdmin ? (
                            <span className="inline-flex items-center rounded-lg bg-red-500/15 px-2.5 py-1 text-[10px] font-black text-red-400 border border-red-500/30">
                              Yönetici (Admin)
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-lg bg-zinc-800 px-2.5 py-1 text-[10px] font-bold text-zinc-400">
                              Standart Üye
                            </span>
                          )}
                        </td>
                        <td className="p-4.5 text-zinc-400 font-medium">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                        </td>
                        <td className="p-4.5 text-right">
                          <div className="inline-flex items-center gap-4 justify-end">
                            {item.isPremium ? (
                              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-3 py-1 text-[11px] font-black text-amber-400 border border-amber-500/30">
                                <Sparkles className="h-3.5 w-3.5 fill-amber-400/25" />
                                Premium VIP Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-1 text-[11px] font-bold text-zinc-500">
                                Standart Plan
                              </span>
                            )}
                            <label className="relative inline-flex items-center cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={item.isPremium}
                                onChange={() => handleTogglePremium(item.id, item.isPremium)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-zinc-950"></div>
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {usersList.filter(u => {
                    const query = userSearchQuery.toLowerCase();
                    return u.username.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
                  }).length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-zinc-500 text-xs font-semibold">
                        Aranan kriterlere uygun kullanıcı bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 6: SECURITY & ANTI-DDOS ================= */}
      {activeTab === 'security' && (
        <div className="animate-in fade-in duration-200" id="tab-security-content">
          <AdminSecurityPanel />
        </div>
      )}

    </div>
  );
}
