import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Scale, FileText, Lock, Undo2, Truck, ShieldCheck } from 'lucide-react';

type TabType = 'uyelik' | 'mesafeli' | 'onbilgilendirme' | 'kvkk' | 'iade' | 'teslimat';

export default function Legal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType;
  const [activeTab, setActiveTab] = useState<TabType>('uyelik');

  useEffect(() => {
    if (tabParam && ['uyelik', 'mesafeli', 'onbilgilendirme', 'kvkk', 'iade', 'teslimat'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const tabs = [
    { id: 'uyelik', label: 'Üyelik Sözleşmesi', icon: Scale },
    { id: 'mesafeli', label: 'Mesafeli Satış Sözleşmesi', icon: FileText },
    { id: 'onbilgilendirme', label: 'Ön Bilgilendirme Formu', icon: ShieldCheck },
    { id: 'kvkk', label: 'Gizlilik ve KVKK Politikası', icon: Lock },
    { id: 'iade', label: 'İptal ve İade Koşulları', icon: Undo2 },
    { id: 'teslimat', label: 'Teslimat & Aktivasyon', icon: Truck },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="max-w-6xl mx-auto space-y-8 py-4"
      id="legal-page"
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

      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Yasal Sözleşmeler ve Politikalar
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed">
          AnlıkResim platformu yasal mevzuatları, tüketici hakları, PayTR ödeme güvenliği standartları ve üyelik şartları detayları.
        </p>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-4">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="sticky top-24 rounded-2xl border border-zinc-900 bg-zinc-950/20 p-4 space-y-1.5">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-3 block mb-3">Yasal Dokümanlar</span>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as TabType)}
                  className={`w-full flex items-center space-x-3 rounded-xl px-3 py-3 text-xs font-bold transition-all duration-200 text-left ${
                    isActive
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/25'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-zinc-500'}`} />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/20 p-6 sm:p-8 space-y-6 text-zinc-300 text-sm leading-relaxed max-w-none">
            
            {activeTab === 'uyelik' && (
              <div className="space-y-6" id="legal-uyelik">
                <h2 className="text-xl font-extrabold text-white border-b border-zinc-900 pb-3">Kullanıcı ve Üyelik Sözleşmesi</h2>
                
                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">1. Taraflar</h3>
                  <p>
                    İşbu Üyelik Sözleşmesi ("Sözleşme"), <strong>AnlıkResim</strong> ("Platform") ile Platform'a üye olan internet kullanıcısı ("Kullanıcı" veya "Üye") arasında, Kullanıcı'nın Platform'a üye olması amacıyla ve Platform'un sunduğu hizmetlerden faydalanma şartlarını belirlemek üzere akdedilmiştir.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">2. Sözleşmenin Konusu</h3>
                  <p>
                    İşbu Sözleşme'nin konusu, Platform üzerinde sunulan hızlı görsel barındırma, yükleme, paylaşım, yönetim ve ücretli Premium üyelik hizmetlerinden Üye'nin yararlanma şartlarının, tarafların hak ve yükümlülüklerinin belirlenmesidir.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">3. Hak ve Sorumluluklar</h3>
                  <p>
                    3.1. Üye, Platform'u kullanırken Türkiye Cumhuriyeti yasalarına, kamu düzenine ve genel ahlak kurallarına uymayı kabul eder. Yüklenen tüm görsel materyallerin mülkiyeti ve yasal sorumluluğu tamamen yükleyen Üye'ye aittir.
                  </p>
                  <p>
                    3.2. Platform, 5651 sayılı "İnternet Ortamında Yapılan Yayınların Düzenlenmesi ve Bu Yayınlar Yoluyla İşlenen Suçlarla Mücadele Edilmesi Hakkında Kanun" kapsamında <strong>"Yer Sağlayıcı"</strong> sıfatına sahiptir. Bu kapsamda yasa dışı içerikleri kontrol etme yükümlülüğü bulunmamaktadır, ancak bildirim yapılması halinde (uyar-kaldır prensibi) ilgili görseli 24 saat içinde kaldırmayı taahhüt eder.
                  </p>
                  <p>
                    3.3. Premium Üyelik kapsamında sağlanan ek özellikler (reklamsız deneyim, daha yüksek dosya limiti, API erişimi vb.) satın alma anında belirtilen süre boyunca geçerlidir.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">4. Mücbir Sebepler ve Kesinti</h3>
                  <p>
                    Altyapı sağlayıcıları, doğal afetler, yangın, hükümet kararları veya siber saldırılar gibi Platform'un kontrolü dışındaki mücbir sebeplerden ötürü hizmette yaşanabilecek geçici kesintilerden Platform sorumlu tutulamaz.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">5. Yürürlük</h3>
                  <p>
                    Kullanıcı, üyelik formunu doldurup onayladığı veya Platform hizmetlerini kullanmaya başladığı andan itibaren işbu sözleşme hükümlerini kabul etmiş sayılır.
                  </p>
                </section>
              </div>
            )}

            {activeTab === 'mesafeli' && (
              <div className="space-y-6" id="legal-mesafeli">
                <h2 className="text-xl font-extrabold text-white border-b border-zinc-900 pb-3">Mesafeli Satış Sözleşmesi</h2>
                
                <section className="space-y-2 text-xs text-zinc-400 bg-zinc-950/40 p-4 rounded-xl border border-zinc-900 mb-6">
                  <p className="font-bold text-zinc-300">Önemli Uyarı:</p>
                  <p>İşbu sözleşme, alıcının satın aldığı dijital Premium paketlerin elektronik ortamda anında teslim edilmesini içerdiğinden, tüketici mevzuatındaki anında ifa edilen hizmet kapsamındadır.</p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">Madde 1 - Taraflar</h3>
                  <p className="font-medium text-zinc-200">1.1. SATICI:</p>
                  <ul className="list-none pl-2 space-y-1 text-xs text-zinc-400">
                    <li><strong>Unvan/Ad Soyad:</strong> AnlıkResim (İrem Saltanat)</li>
                    <li><strong>E-posta:</strong> iremsaltanat002001@gmail.com</li>
                    <li><strong>Web Adresi:</strong> {window.location.origin}</li>
                  </ul>
                  
                  <p className="font-medium text-zinc-200 pt-2">1.2. ALICI:</p>
                  <p>
                    AnlıkResim web sitesi üzerinden Premium üyelik hizmeti satın alan, ödeme formunda bilgileri yer alan ve sözleşmeyi elektronik ortamda onaylayan internet kullanıcısıdır.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">Madde 2 - Sözleşmenin Konusu</h3>
                  <p>
                    İşbu Sözleşmenin konusu, ALICI'nın SATICI'ya ait AnlıkResim internet sitesinden elektronik ortamda siparişini yaptığı, nitelikleri ve satış ücreti belirtilen dijital Premium hizmetinin satışı ve teslimi ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin saptanmasıdır.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">Madde 3 - Sözleşme Konusu Hizmet ve Ödeme</h3>
                  <p>
                    Sözleşme konusu hizmet; AnlıkResim platformunda sunulan, Premium paket içeriğinde belirtilen reklam kaldırma, limitsiz görsel saklama süresi ve gelişmiş özellikleri içeren dijital üyelik paketidir. Hizmet bedeli ve ödeme şekli, sipariş ekranında ALICI tarafından seçilen paket tarifesine göre tahsil edilir. Ödemeler PayTR aracılığı ile güvenli SSL altyapısı ile gerçekleştirilir.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">Madde 4 - Teslimat Şekli ve Süresi</h3>
                  <p>
                    Sözleşme konusu Premium Hizmeti, tamamen <strong>dijital ve gayrimaddi</strong> nitelikte olup fiziki kargo veya teslimat gerektirmez. PayTR kanalı ile ödemenin başarılı bir şekilde onaylanmasını müteakip, ALICI'nın üye hesabı sistem tarafından otomatik olarak <strong>milisaniyeler içinde</strong> "Premium" statüsüne yükseltilir ve anında kullanıma sunulur.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">Madde 5 - Cayma Hakkı</h3>
                  <p>
                    Mesafeli Sözleşmeler Yönetmeliği’nin 15. maddesinin (ğ) bendi uyarınca; <strong>"Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallara ilişkin sözleşmeler"</strong> kapsamında cayma hakkı kullanılamaz. Premium hizmeti satın alındığı anda aktifleştiğinden, cayma hakkı ve iade hakkı bulunmamaktadır.
                  </p>
                </section>
              </div>
            )}

            {activeTab === 'onbilgilendirme' && (
              <div className="space-y-6" id="legal-onbilgilendirme">
                <h2 className="text-xl font-extrabold text-white border-b border-zinc-900 pb-3">Ön Bilgilendirme Formu</h2>
                
                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">1. Satıcı Bilgileri</h3>
                  <p>
                    AnlıkResim dijital platformu üzerinden sunulan Premium üyelikler, AnlıkResim (İrem Saltanat) tarafından sağlanmaktadır. İletişim için iremsaltanat002001@gmail.com e-posta adresi kullanılmaktadır.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">2. Sözleşme Konusu Hizmetin Temel Özellikleri</h3>
                  <p>
                    Alıcıya sunulacak olan dijital hizmet, AnlıkResim platformunda reklamsız gezinme, yüksek çözünürlüklü ve limitsiz görsel yükleme, silme zamanlayıcıları üzerinde tam kontrol ve Premium rozeti gibi avantajları sağlayan abonelik modelidir.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">3. Toplam Fiyat ve Ödeme Bilgileri</h3>
                  <p>
                    Premium paketlerin fiyatları vergiler dahil olarak ödeme sayfasında açıkça belirtilmiştir. Ücretlendirme tek seferlik veya periyodik abonelik modeliyle tahsil edilir. Tüm ödemeler PayTR sanal POS sistemi üzerinden SSL şifreleme ve 3D Secure güvencesiyle tahsil edilmektedir.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">4. Teslimat ve İfa</h3>
                  <p>
                    Ödeme onaylandığı an sistem dijital hizmeti anında üyenin profiline tanımlar. Fiziki bir kargo gönderimi yapılmayacaktır.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">5. Şikayet ve İtiraz Mercileri</h3>
                  <p>
                    Alıcı, satın alım işlemlerine ilişkin her türlü şikayet ve talebini doğrudan iremsaltanat002001@gmail.com adresine iletebilir. SATICI sorunu en geç 3 iş günü içerisinde çözmeyi taahhüt eder. Ayrıca Alıcı, yasal hakları çerçevesinde İl veya İlçe Tüketici Hakem Heyetlerine başvuruda bulunabilir.
                  </p>
                </section>
              </div>
            )}

            {activeTab === 'kvkk' && (
              <div className="space-y-6" id="legal-kvkk">
                <h2 className="text-xl font-extrabold text-white border-b border-zinc-900 pb-3">Gizlilik ve Kişisel Verilerin Korunması (KVKK) Politikası</h2>
                
                <p>
                  AnlıkResim olarak, kullanıcılarımızın kişisel verilerinin korunmasına büyük önem veriyoruz. 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, veri sorumlusu sıfatıyla sizi bilgilendirmek isteriz.
                </p>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">1. Hangi Verileri İşliyoruz?</h3>
                  <p>
                    Platformumuza kayıt olurken veya işlem yaparken sağladığınız; kullanıcı adı, e-posta adresi, şifre karması (şifreleriniz şifrelenmiş olarak tutulur, tarafımızca görülemez) ve ödeme işlemleri esnasında PayTR tarafından güvenli bir şekilde işlenen işlem verileri saklanmaktadır. <strong>Kredi kartı bilgileriniz hiçbir şekilde sunucularımızda saklanmaz veya işlenmez.</strong>
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">2. Veri İşleme Amaçlarımız</h3>
                  <p>
                    Kişisel verileriniz; üyeliğinizin oluşturulması, Premium paket haklarınızın tanımlanması, faturalandırma süreçleri, sistem güvenliğinin sağlanması, kötüye kullanım bildirimlerinin takibi ve yasal yükümlülüklerin yerine getirilmesi amacıyla işlenir.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">3. Görsel Meta Verileri (EXIF)</h3>
                  <p>
                    AnlıkResim, kullanıcı gizliliğini korumak amacıyla yüklenen resimlerin EXIF (coğrafi konum, kamera modeli, çekim saati vb.) verilerini otomatik olarak temizleme opsiyonuna sahiptir. Bu işlem, güvenliğiniz ve gizliliğiniz için varsayılan olarak optimize edilir.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">4. Çerezler (Cookies)</h3>
                  <p>
                    Platformumuz, oturumunuzu açık tutabilmek, tema tercihlerinizi (gece modu vb.) hatırlayabilmek ve kullanıcı deneyimini iyileştirmek amacıyla temel çerezleri kullanır. Reklamların kişiselleştirilmesi amacıyla da üçüncü taraf çerez sağlayıcıları (Google AdSense vb.) veri işleyebilir.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">5. Haklarınız</h3>
                  <p>
                    KVKK'nın 11. maddesi uyarınca iremsaltanat002001@gmail.com adresine yazarak; verilerinizin işlenip işlenmediğini öğrenme, işlenme amacına uygun kullanılıp kullanılmadığını sorgulama ve verilerinizin tamamen silinmesini (hesap kapatma) talep etme hakkına sahipsiniz.
                  </p>
                </section>
              </div>
            )}

            {activeTab === 'iade' && (
              <div className="space-y-6" id="legal-iade">
                <h2 className="text-xl font-extrabold text-white border-b border-zinc-900 pb-3">İptal ve İade Koşulları</h2>
                
                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">1. Hizmetin Niteliği</h3>
                  <p>
                    AnlıkResim Premium hizmetleri, tamamen dijital ortamda sunulan ve anında teslim edilen gayrimaddi bir hizmettir. Bu tür hizmetler Tüketici Hakları mevzuatında "anında teslim ve ifa edilen hizmetler" kapsamında yer aldığından fiziksel bir iade süreci bulunmamaktadır.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">2. İptal Koşulları</h3>
                  <p>
                    Kullanıcılar Premium aboneliklerini diledikleri zaman hesap ayarlarından veya destek ekibimiz üzerinden iptal edebilirler. Abonelik iptal edildiğinde, mevcut fatura döneminin sonuna kadar Premium özellikleri aktif kalmaya devam eder, bir sonraki dönem için yeni bir tahsilat yapılmaz.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">3. İade Koşulları</h3>
                  <p>
                    Ödeme onayından sonra sistem kaynaklı teknik bir arıza nedeniyle hizmetin ALICI'ya teslim edilememesi veya 24 saat boyunca Premium özelliklerin aktifleşmemesi durumunda, ALICI'nın iremsaltanat002001@gmail.com adresi üzerinden destek talep etmesi kaydıyla tahsil edilen ücret PayTR altyapısı üzerinden <strong>%100 kesintisiz olarak iade edilir.</strong>
                  </p>
                  <p>
                    Kullanıcıların kendi tercihleri veya kullanım vazgeçişleri sebebiyle, aktif olarak kullanılan Premium dönemlerin kısmi veya tam iadesi yapılamaz.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">4. İade Süreci</h3>
                  <p>
                    Onaylanan iadeler, bankacılık süreçlerine bağlı olarak alıcının kredi/banka kartına 3-10 iş günü içerisinde yansıtılır. SATICI'nın banka süreçlerinden kaynaklanan gecikmelerde sorumluluğu bulunmamaktadır.
                  </p>
                </section>
              </div>
            )}

            {activeTab === 'teslimat' && (
              <div className="space-y-6" id="legal-teslimat">
                <h2 className="text-xl font-extrabold text-white border-b border-zinc-900 pb-3">Teslimat ve Aktivasyon Politikası</h2>
                
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-4">
                  <Truck className="h-6 w-6" />
                </div>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">1. Fiziksel Kargo Gönderimi Yoktur</h3>
                  <p>
                    AnlıkResim, bir bulut tabanlı resim yükleme ve barındırma platformudur. Bu sebeple sunduğumuz hiçbir Premium üyelik paketi veya özellik <strong>fiziksel kargo, posta ya da nakliye gerektirmez.</strong> Adresinize herhangi bir paket gönderilmeyecektir.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">2. Anında Dijital Teslimat ve Aktivasyon</h3>
                  <p>
                    Satın aldığınız Premium üyelik paketi, ödemenin PayTR sanal POS kanalı üzerinden başarıyla tamamlanmasını takip eden <strong>milisaniyeler içerisinde otomatik olarak hesabınıza tanımlanır.</strong> Aktivasyon anında gerçekleşir ve siteyi yenilediğinizde Premium özellikler (reklamsız arayüz, yüksek yükleme hızları, API erişimi vb.) anında kullanılabilir hale gelir.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="font-bold text-white text-base">3. Aktivasyon Sorunları Çözümü</h3>
                  <p>
                    Ender de olsa ödeme kuruluşu ile platformumuz arasındaki veri gecikmelerinden dolayı aktivasyonunuz gecikirse, lütfen panik yapmayınız. İşlem dekontunuz veya e-posta adresinizle birlikte <strong>iremsaltanat002001@gmail.com</strong> adresine e-posta gönderebilir veya platformun "Destek" kısmından anında bize yazabilirsiniz. Ekibimiz en geç 12 saat (genellikle 30 dakika) içerisinde manuel aktivasyonu sağlayacaktır.
                  </p>
                </section>
              </div>
            )}

          </div>
        </div>

      </div>

    </motion.div>
  );
}
