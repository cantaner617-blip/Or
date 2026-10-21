import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  RefreshCw, 
  Trash2, 
  Plus, 
  UserX, 
  CheckCircle, 
  Clock, 
  Activity, 
  Search, 
  Zap, 
  Ban,
  Slash,
  AlertTriangle,
  Server
} from 'lucide-react';
import { SecurityStats, SecurityLog } from '../types';

export default function AdminSecurityPanel() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form States
  const [ddosEnabled, setDdosEnabled] = useState(true);
  const [rateLimitGlobal, setRateLimitGlobal] = useState(120);
  const [rateLimitAuth, setRateLimitAuth] = useState(10);
  const [rateLimitUpload, setRateLimitUpload] = useState(15);
  const [botProtection, setBotProtection] = useState(true);
  const [maliciousPayload, setMaliciousPayload] = useState(true);

  // IP Add inputs
  const [newBlacklistIp, setNewBlacklistIp] = useState('');
  const [newWhitelistIp, setNewWhitelistIp] = useState('');
  const [logSearchQuery, setLogSearchQuery] = useState('');

  const fetchSecurityStats = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/security/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Güvenlik verileri alınamadı.');
      }
      const data: SecurityStats = await res.json();
      setStats(data);
      setDdosEnabled(data.ddosProtectionEnabled);
      setRateLimitGlobal(data.rateLimitGlobal);
      setRateLimitAuth(data.rateLimitAuth);
      setRateLimitUpload(data.rateLimitUpload);
      setBotProtection(data.botProtectionEnabled);
      setMaliciousPayload(data.maliciousPayloadProtection);
    } catch (err: any) {
      setError(err.message || 'Güvenlik paneli verileri yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityStats();
  }, []);

  const handleSaveSecurityConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/admin/security/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ddosProtectionEnabled: ddosEnabled,
          rateLimitGlobal: Number(rateLimitGlobal),
          rateLimitAuth: Number(rateLimitAuth),
          rateLimitUpload: Number(rateLimitUpload),
          botProtectionEnabled: botProtection,
          maliciousPayloadProtection: maliciousPayload
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ayarlar kaydedilemedi.');
      }

      setSuccessMsg(' Anti-DDoS güvenlik ayarları başarıyla kaydedildi!');
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchSecurityStats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleBlacklistAction = async (ip: string, action: 'add' | 'remove') => {
    if (!ip.trim()) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/security/ip-blacklist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ip: ip.trim(), action })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'İşlem gerçekleştirilemedi.');
      }
      setNewBlacklistIp('');
      fetchSecurityStats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleWhitelistAction = async (ip: string, action: 'add' | 'remove') => {
    if (!ip.trim()) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/security/ip-whitelist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ip: ip.trim(), action })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'İşlem gerçekleştirilemedi.');
      }
      setNewWhitelistIp('');
      fetchSecurityStats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUnbanIp = async (ip: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/security/unban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ip })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Engil kaldırılamadı.');
      }
      fetchSecurityStats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Tüm güvenlik loglarını temizlemek istediğinize emin misiniz?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/admin/security/logs', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Loglar temizlenemedi.');
      }
      fetchSecurityStats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex h-80 items-center justify-center space-x-3 text-zinc-400 bg-zinc-950/60 rounded-3xl border border-zinc-900 shadow-2xl">
        <RefreshCw className="h-7 w-7 animate-spin text-teal-400" />
        <span className="text-sm font-bold tracking-wide">Anti-DDoS Güvenlik Paneli Yükleniyor...</span>
      </div>
    );
  }

  const filteredLogs = (stats?.recentLogs || []).filter(log => 
    log.ip.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
    log.reason.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
    log.endpoint.toLowerCase().includes(logSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Upper Security Alert Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-zinc-950 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4" />
              <span>Gelişmiş Güvenlik &amp; Anti-DDoS Koruma Motoru</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Lock className="h-7 w-7 text-emerald-400" />
              Sözleşmeli Güvenlik ve DDoS Önleme Merkezi
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Sunucumuz otomatik olarak bot trafiğini, brute-force şifre denemelerini, görsel yükleme bombardımanlarını ve DDoS saldırı patlamalarını anlık algılayıp engeller.
            </p>
          </div>
          
          <button
            onClick={fetchSecurityStats}
            className="flex items-center space-x-2 rounded-2xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-200 transition-all cursor-pointer shadow-lg hover:border-emerald-500/40"
          >
            <RefreshCw className="h-4 w-4 text-emerald-400" />
            <span>Güvenlik Verilerini Yenile</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400 flex items-center gap-3 shadow-lg">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/30 p-4 text-sm text-emerald-300 flex items-center gap-3 shadow-lg">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Security Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Anti-DDoS Status */}
        <div className="p-5 rounded-3xl border border-zinc-800/80 bg-zinc-950/80 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Anti-DDoS Durumu</span>
            <div className={`p-2 rounded-2xl border ${ddosEnabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div>
            <span className={`text-xl font-black block ${ddosEnabled ? 'text-emerald-400' : 'text-red-400'}`}>
              {ddosEnabled ? 'KORUMA AKTİF' : 'DEVRE DIŞI'}
            </span>
            <span className="text-[11px] text-zinc-400 mt-1 block">Tüm istekler taranıyor</span>
          </div>
        </div>

        {/* Total Blocked Requests */}
        <div className="p-5 rounded-3xl border border-zinc-800/80 bg-zinc-950/80 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Engellenen Saldırı</span>
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-white font-mono">{stats?.totalBlockedRequests || 0}</span>
            <span className="text-[11px] text-zinc-400 mt-1 block">Engellenen kötücül istek sayısı</span>
          </div>
        </div>

        {/* Active Temporary Bans */}
        <div className="p-5 rounded-3xl border border-zinc-800/80 bg-zinc-950/80 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Geçici Banlı IP'ler</span>
            <div className="p-2 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <Ban className="h-5 w-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-rose-400 font-mono">{stats?.activeBansCount || 0}</span>
            <span className="text-[11px] text-zinc-400 mt-1 block">Aşırı istek yapan IP adresi</span>
          </div>
        </div>

        {/* Blacklisted IPs */}
        <div className="p-5 rounded-3xl border border-zinc-800/80 bg-zinc-950/80 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Kara Liste IP'ler</span>
            <div className="p-2 rounded-2xl bg-zinc-800 text-zinc-300 border border-zinc-700">
              <UserX className="h-5 w-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-zinc-200 font-mono">{stats?.blacklist?.length || 0}</span>
            <span className="text-[11px] text-zinc-400 mt-1 block">Kalıcı engellenmiş IP sayısı</span>
          </div>
        </div>

      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSecurityConfig} className="p-6 sm:p-8 rounded-3xl border border-zinc-800/90 bg-zinc-950/90 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal-400" />
              Anti-DDoS &amp; Trafik Limit Ayarları
            </h3>
            <p className="text-xs text-zinc-400">İstek limitlerini ve saldırı engelleme davranışlarını buradan yapılandırın.</p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={ddosEnabled} 
              onChange={(e) => setDdosEnabled(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-14 h-7 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 block">
              Genel İstek Limiti (Dakika / IP)
            </label>
            <input 
              type="number"
              value={rateLimitGlobal}
              onChange={(e) => setRateLimitGlobal(Number(e.target.value))}
              min={20}
              max={1000}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-teal-500 focus:outline-none font-mono"
            />
            <span className="text-[11px] text-zinc-500 block">Normal ziyaretçiler için dakika başına maks. istek. (Varsayılan: 120)</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 block">
              Giriş &amp; Şifre Limiti (Brute Force Koruması)
            </label>
            <input 
              type="number"
              value={rateLimitAuth}
              onChange={(e) => setRateLimitAuth(Number(e.target.value))}
              min={3}
              max={50}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-teal-500 focus:outline-none font-mono"
            />
            <span className="text-[11px] text-zinc-500 block">Giriş/Kayıt/Şifre için dakika başı maks. deneme. (Varsayılan: 10)</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 block">
              Görsel Yükleme Limiti (5 Dakika / IP)
            </label>
            <input 
              type="number"
              value={rateLimitUpload}
              onChange={(e) => setRateLimitUpload(Number(e.target.value))}
              min={3}
              max={200}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white focus:border-teal-500 focus:outline-none font-mono"
            />
            <span className="text-[11px] text-zinc-500 block">Depolama bombardımanını önlemek için limit. (Varsayılan: 15)</span>
          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-white block">Zararlı Payload &amp; SQLi/XSS Taraması</span>
              <span className="text-xs text-zinc-400 block">URL ve parametrelerdeki şüpheli tarama kodlarını otomatik engeller.</span>
            </div>
            <input 
              type="checkbox"
              checked={maliciousPayload}
              onChange={(e) => setMaliciousPayload(e.target.checked)}
              className="h-5 w-5 accent-teal-500 cursor-pointer"
            />
          </div>

          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-white block">Bot &amp; Otomatik Taramaları Filtreleme</span>
              <span className="text-xs text-zinc-400 block">Boş veya bilinen tarayıcı bot isteklerini engeller.</span>
            </div>
            <input 
              type="checkbox"
              checked={botProtection}
              onChange={(e) => setBotProtection(e.target.checked)}
              className="h-5 w-5 accent-teal-500 cursor-pointer"
            />
          </div>

        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 px-6 py-3 text-xs font-black text-zinc-950 uppercase tracking-wider transition-all shadow-lg hover:shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Kaydediliyor...' : 'Güvenlik Ayarlarını Kaydet'}
          </button>
        </div>
      </form>

      {/* IP Management: Blacklist, Whitelist & Active Bans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Blacklist Box */}
        <div className="p-6 rounded-3xl border border-zinc-800/90 bg-zinc-950/90 shadow-xl space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <UserX className="h-4 w-4 text-rose-400" />
            IP Kara Listesi (Blacklist)
          </h3>
          <p className="text-xs text-zinc-400">Bu listedeki IP adreslerinin siteye erişimi tamamen engellenir.</p>

          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="Örn: 185.220.101.5"
              value={newBlacklistIp}
              onChange={(e) => setNewBlacklistIp(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-rose-500 focus:outline-none font-mono"
            />
            <button
              onClick={() => handleBlacklistAction(newBlacklistIp, 'add')}
              className="px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold hover:bg-rose-500/30 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
            {stats?.blacklist && stats.blacklist.length > 0 ? (
              stats.blacklist.map(ip => (
                <div key={ip} className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 text-zinc-300">
                  <span>{ip}</span>
                  <button
                    onClick={() => handleBlacklistAction(ip, 'remove')}
                    className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Kara listeden çıkar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-4 text-center">Henüz kara listede IP yok.</p>
            )}
          </div>
        </div>

        {/* Active Temporary Bans (Jail) */}
        <div className="p-6 rounded-3xl border border-zinc-800/90 bg-zinc-950/90 shadow-xl space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Ban className="h-4 w-4 text-amber-400" />
            Aktif Geçici Engeller (15 Dk Auto-Ban)
          </h3>
          <p className="text-xs text-zinc-400">DDoS veya aşırı istek nedeniyle sistem tarafından geçici engellenenler.</p>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 text-xs">
            {stats?.activeBans && stats.activeBans.length > 0 ? (
              stats.activeBans.map(ban => (
                <div key={ban.ip} className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-300">{ban.ip}</span>
                    <button
                      onClick={() => handleUnbanIp(ban.ip)}
                      className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[10px] font-bold cursor-pointer"
                    >
                      Engeli Kaldır
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400">{ban.reason}</p>
                  <p className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                    <Clock className="h-3 w-3" />
                    Bitiş: {new Date(ban.expiresAt).toLocaleTimeString('tr-TR')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-8 text-center">Şu an aktif geçici engelli IP yok.</p>
            )}
          </div>
        </div>

        {/* Whitelist Box */}
        <div className="p-6 rounded-3xl border border-zinc-800/90 bg-zinc-950/90 shadow-xl space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-teal-400" />
            IP Beyaz Listesi (Whitelist)
          </h3>
          <p className="text-xs text-zinc-400">Bu listedeki IP adresleri rate limit ve DDoS kısıtlamalarından muaftır.</p>

          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="Örn: 127.0.0.1"
              value={newWhitelistIp}
              onChange={(e) => setNewWhitelistIp(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-teal-500 focus:outline-none font-mono"
            />
            <button
              onClick={() => handleWhitelistAction(newWhitelistIp, 'add')}
              className="px-3 py-2 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-bold hover:bg-teal-500/30 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
            {stats?.whitelist && stats.whitelist.length > 0 ? (
              stats.whitelist.map(ip => (
                <div key={ip} className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 text-zinc-300">
                  <span>{ip}</span>
                  <button
                    onClick={() => handleWhitelistAction(ip, 'remove')}
                    className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Beyaz listeden çıkar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-4 text-center">Henüz beyaz listede IP yok.</p>
            )}
          </div>
        </div>

      </div>

      {/* Live Security Logs Table */}
      <div className="p-6 sm:p-8 rounded-3xl border border-zinc-800/90 bg-zinc-950/90 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="h-5 w-5 text-teal-400" />
              Canlı Güvenlik &amp; DDoS Saldırı Logları
            </h3>
            <p className="text-xs text-zinc-400">Engellenen kısıtlamalar, otomatik banlar ve şüpheli istekler.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input 
                type="text"
                placeholder="IP, endpoint veya neden ara..."
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-9 pr-3 py-1.5 text-xs text-white focus:border-teal-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleClearLogs}
              className="p-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-red-500/20 hover:text-red-300 text-zinc-400 transition-colors cursor-pointer shrink-0"
              title="Logları Temizle"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4 font-bold">Zaman</th>
                <th className="py-3 px-4 font-bold">IP Adresi</th>
                <th className="py-3 px-4 font-bold">Eylem</th>
                <th className="py-3 px-4 font-bold">Açıklama / Neden</th>
                <th className="py-3 px-4 font-bold">Hedef URL</th>
                <th className="py-3 px-4 font-bold text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => {
                  let actionBadge = (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      LIMIT AŞILDI
                    </span>
                  );
                  if (log.action === 'blocked') {
                    actionBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 border border-red-500/30 text-red-400">
                        ENGELLENDİ
                      </span>
                    );
                  } else if (log.action === 'banned') {
                    actionBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 animate-pulse">
                        GEÇİCİ BAN
                      </span>
                    );
                  } else if (log.action === 'suspicious') {
                    actionBadge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 border border-purple-500/30 text-purple-400">
                        ŞÜPHELİ
                      </span>
                    );
                  }

                  return (
                    <tr key={log.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('tr-TR')}
                      </td>
                      <td className="py-3 px-4 text-white font-bold whitespace-nowrap">
                        {log.ip}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {actionBadge}
                      </td>
                      <td className="py-3 px-4 text-zinc-300 font-sans">
                        {log.reason}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 truncate max-w-xs">
                        {log.endpoint}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleBlacklistAction(log.ip, 'add')}
                          className="text-[10px] font-sans font-bold px-2 py-1 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 cursor-pointer"
                        >
                          Kara Listeye Ekle
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-zinc-500 font-sans">
                    Henüz kayıtlı bir güvenlik olayı bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
