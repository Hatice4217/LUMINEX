# **LUMINEX Klinik Yönetim Sistemi - Proje Sunum ve Teknik Dokümantasyonu**

---

### **Yönetici Özeti**

LUMINEX, modern klinikler için tasarlanmış, hasta, doktor ve yönetici arasındaki iletişimi ve veri akışını dijitalleştiren, hepsi bir arada bir ön yüz (frontend) yönetim sistemidir. Bu sistem, randevu yönetiminden hasta kayıtlarına, doktor takvimlerinden idari raporlamaya kadar bir kliniğin günlük operasyonlarını basitleştirmeyi hedefler.

En büyük teknolojik avantajı, **sunucu ve veritabanı maliyetlerini sıfırlayan** modern mimarisidir. Tüm veriler güvenli bir şekilde doğrudan kullanıcının tarayıcısında saklanır, bu da hem olağanüstü bir hız hem de ek altyapı ve bakım maliyetlerinden tamamen kurtulma imkanı sunar. LUMINEX, kliniğinizi dijitalleştirirken operasyonel verimliliği artırmak ve maliyetleri düşürmek için anahtar teslim bir çözümdür.

---

### **İçindekiler**

1.  [LUMINEX'in Stratejik Avantajları](#1-luminexin-stratejik-avantajları)
2.  [Giriş, Kayıt ve Şifre Yönetimi](#2-giriş-kayıt-ve-şifre-yönetimi)
    *   [2.1. TC Kimlik Numarası Doğrulama](#21-tc-kimlik-numarası-doğrulama)
3.  [Kullanıcı Rolleri ve Fonksiyonel Özellikler](#3-kullanıcı-rolleri-ve-fonksiyonel-özellikler)
    *   [3.1. Yönetici Paneli](#31-yönetici-paneli)
    *   [3.2. Doktor Paneli](#32-doktor-paneli)
    *   [3.3. Hasta Portalı](#33-hasta-portalı)
4.  [Kullanıcı Rolleri Arası Etkileşim](#4-kullanıcı-rolleri-arası-etkileşim)
5.  [Tipik Kullanım Senaryoları (A'dan Z'ye İş Akışları)](#5-tipik-kullanım-senaryoları-adan-zye-i̇ş-akışları)
    *   [5.1. Yeni Bir Hastanın Yolculuğu](#51-yeni-bir-hastanın-yolculuğu)
    *   [5.2. Bir Doktorun Çalışma Günü](#52-bir-doktorun-çalışma-günü)
    *   [5.3. Yöneticinin İdari İşlemleri](#53-yöneticinin-i̇dari-i̇şlemleri)
6.  [Uygulama Mimarisi ve Teknik Detaylar](#6-uygulama-mimarisi-ve-teknik-detaylar)
    *   [6.1. Genel Mimari Yapı](#61-genel-mimari-yapı)
    *   [6.2. Anahtar Sistem Bileşenleri](#62-anahtar-sistem-bileşenleri)
    *   [6.3. Detaylı Panel ve Modül Açıklamaları](#63-detaylı-panel-ve-modül-açıklamaları)
    *   [6.4. Veri Yönetimi ve Sorgulama (SQL Alternatifi)](#64-veri-yönetimi-ve-sorgulama-sql-alternatifi)
7.  [Gelecek Geliştirmeler ve Yol Haritası](#7-gelecek-geliştirmeler-ve-yol-haritası)
8.  [Kurulum ve Devreye Alma](#8-kurulum-ve-devreye-alma)
9.  [Sonuç: Dijital Kliniğiniz İçin Neden LUMINEX?](#9-sonuç-dijital-kliniğiniz-i̇çin-neden-luminex)

---

### **1. LUMINEX'in Stratejik Avantajları**
*   **Sıfır Altyapı Maliyeti:** Geleneksel yazılımların aksine, LUMINEX'in çalışması için pahalı sunuculara veya SQL veritabanı lisanslarına ihtiyacı yoktur. Bu, binlerce liralık altyapı, barındırma ve bakım maliyetinden tasarruf anlamına gelir.
*   **Hepsi Bir Arada Çözüm:** Yönetici, doktor ve hastalar için özelleştirilmiş paneller sunarak bir kliniğin tüm paydaşlarını tek bir platformda birleştirir.
*   **Olağanüstü Hız ve Performans:** Veriler doğrudan kullanıcının cihazında işlendiği için bekleme süreleri ortadan kalkar ve tüm işlemler anında gerçekleşir.
*   **Kullanıcı Dostu Arayüz:** Her seviyeden bilgisayar kullanıcısının kolayca adapte olabileceği, temiz, modern ve sezgisel bir tasarıma sahiptir.
*   **Güvenlik ve Gizlilik:** Hasta verileri, internet üzerinden bir sunucuya gönderilmeden, güvenli bir şekilde kullanıcının kendi tarayıcısında saklanır. Bu, veri gizliliği için ek bir güvence katmanı sağlar.
*   **Esnek ve Genişletilebilir:** Modern ve modüler yapısı sayesinde, gelecekte kliniğinizin ihtiyaç duyabileceği yeni özelliklerin sisteme eklenmesi son derece kolaydır.

### **2. Giriş, Kayıt ve Şifre Yönetimi**
Sistemin temel kullanıcı döngüsünü oluşturan bu sayfalar, güvenli ve kolay bir kullanıcı deneyimi sunar.

*   **Giriş Sayfası (`login.html`):** Kullanıcıların TC Kimlik Numarası ve şifreleri ile sisteme giriş yaptıkları ana giriş kapısıdır.
*   **Kayıt Sayfası (`register.html`):** Yeni hastaların sisteme kendi kayıtlarını yapmalarını sağlar.
*   **Şifremi Unuttum ve Sıfırlama Sayfaları (`forgot-password.html`, `reset-password.html`):** Kullanıcıların şifrelerini güvenli bir şekilde yenilemelerini sağlayan adımları içerir.

#### **2.1. TC Kimlik Numarası Doğrulama**
Sistem, girilen TC Kimlik Numaralarının sadece 11 haneli bir sayı olmasını değil, aynı zamanda geçerli bir kimlik numarası algoritmasına uyup uymadığını da kontrol eder. Bu algoritma, belirli hanelerin matematiksel toplamlarına ve modlarına dayalı bir kural setidir. Bu sayede, sisteme hatalı veya rastgele bir numara girilmesi engellenerek veri kalitesi ve güvenliği en başından sağlanmış olur. Bu doğrulama işlemi, `js/utils/validation-utils.js` içerisindeki merkezi bir fonksiyon tarafından yönetilmektedir.

### **3. Kullanıcı Rolleri ve Fonksiyonel Özellikler**
LUMINEX, bir klinikteki üç ana rol için özelleştirilmiş deneyimler sunar:

#### **3.1. Yönetici Paneli**
Kliniğin idari yönetimini tek bir merkezden yapmanızı sağlar. Yöneticinin erişebileceği modüller ve yapabileceği işlemler şunlardır:

*   **Ana Panel (`admin-dashboard.html`):** Yöneticinin ilk karşılandığı ekrandır. Bu panelde, kliniğin genel durumu hakkında anlık bilgiler sunan istatistiksel kartlar bulunur. Bu kartlar, toplam hasta sayısı, doktor sayısı, günlük randevu sayısı ve yeni kullanıcı kayıtları gibi kritik verileri içerir. Ayrıca, sistemdeki son aktiviteleri gösteren bir zaman akışı da mevcuttur.

*   **Departman Yönetimi (`admin-departments.html`):** Klinikteki tıbbi departmanların (örn: Kardiyoloji, Nöroloji) yönetildiği yerdir. Yönetici bu modülde;
    *   Yeni bir departman ekleyebilir.
    *   Mevcut bir departmanın adını veya açıklamasını güncelleyebilir.
    *   Artık hizmet vermeyen bir departmanı sistemden silebilir.

*   **Hastane Yönetimi (`admin-hospitals.html`):** Sisteme bağlı hastane veya klinik şubelerinin yönetildiği modüldür. Yönetici burada;
    *   Yeni bir hastane veya şube tanımı yapabilir.
    *   Mevcut bir hastanenin bilgilerini (adres, telefon vb.) düzenleyebilir.
    *   Sistemden bir hastaneyi kaldırabilir.

*   **Raporlama (`admin-reports.html`):** Kliniğin performansı hakkında detaylı raporların alındığı kritik bir modüldür. Yönetici, bu arayüzü kullanarak;
    *   Belirli bir tarih aralığındaki toplam randevu sayısını görebilir.
    *   Doktor bazında randevu ve hasta sayılarını analiz edebilir.
    *   Departmanlara göre hasta yoğunluğunu inceleyebilir.
    *   Bu raporları yazdırılabilir veya indirilebilir formatta alabilir.

*   **Kullanıcı Yönetimi (`admin-users.html`):** Sistemdeki tüm kullanıcıların (doktor, hasta, diğer yöneticiler) yönetildiği merkezi modüldür. Yönetici bu ekranda;
    *   Yeni bir kullanıcı (doktor veya hasta) hesabı oluşturabilir.
    *   Mevcut bir kullanıcının bilgilerini (şifre, rol, kişisel bilgiler) güncelleyebilir.
    *   Bir kullanıcının hesabını askıya alabilir veya tamamen silebilir.
    *   Kullanıcıları role, isme veya duruma göre filtreleyerek arayabilir.

#### **3.2. Doktor Paneli**
Doktorların hastaları ve takvimleri üzerindeki hakimiyetini artırır. Doktorların yetkili olduğu modüller ve fonksiyonlar şunlardır:

*   **Ana Panel (`doctor-dashboard.html`):** Doktora özel bir başlangıç ekranıdır. Bu panelde, doktorun o günkü randevuları, yaklaşan randevuları, tamamlanan randevu sayısı ve aldığı yeni hasta değerlendirmeleri gibi özet bilgiler bulunur. Ayrıca, haftalık randevu yoğunluğunu gösteren bir grafik de yer alır.

*   **Randevularım (`doctor-appointments.html`):** Doktorun tüm randevularını yönettiği ana modüldür. Doktor bu arayüzde;
    *   Geçmiş ve gelecek tüm randevularını listeleyebilir.
    *   Randevuları tarihe, hastaya veya duruma (onay bekleyen, tamamlanmış, iptal edilmiş) göre filtreleyebilir.
    *   Bir randevunun detaylarını (hasta bilgileri, notları vb.) görüntüleyebilir.
    *   Gelecek bir randevuyu iptal edebilir veya geçmiş bir randevuyu "tamamlandı" olarak işaretleyebilir.

*   **Çalışma Takvimi (`doctor-availability.html`):** Doktorun kendi çalışma saatlerini ve müsaitlik durumunu yönettiği yerdir. Doktor burada;
    *   Belirli bir gün veya tarih aralığı için çalışma saatlerini ayarlayabilir.
    *   Özel tatil günleri veya izinli olduğu zamanları takvimde işaretleyebilir.
    *   Hastaların randevu alabileceği zaman dilimlerini (örn: 09:00-12:00 arası) belirleyebilir.

*   **Mesajlar (`doctor-messages.html`, `doctor-send-message.html`, `doctor-sent-messages.html`):** Hastalarla güvenli bir şekilde iletişim kurmasını sağlar. Doktor bu modüllerde;
    *   Hastalarından gelen mesajları okuyabilir.
    *   Bir hastaya doğrudan yeni bir mesaj gönderebilir.
    *   Gönderdiği mesajların geçmişini görüntüleyebilir.

*   **Profilim (`doctor-profile.html`):** Doktorun halka açık profilini ve kişisel bilgilerini düzenlediği yerdir. Doktor burada;
    *   Uzmanlık alanı, fotoğrafı, eğitimi ve deneyimi gibi bilgileri güncelleyebilir.
    *   Şifresini veya iletişim bilgilerini değiştirebilir.

*   **Değerlendirmeler (`doctor-ratings.html`, `doctor-reviews.html`):** Hastaların kendisi hakkında yaptığı değerlendirme ve yorumları gördüğü alandır. Bu, doktorun hizmet kalitesi hakkında geri bildirim almasını sağlar.

#### **3.3. Hasta Portalı**
Hastalarınıza modern ve interaktif bir sağlık hizmeti deneyimi sunar. Hastaların erişebildiği modüller ve yapabilecekleri işlemler şunlardır:

*   **Ana Panel (`dashboard.html`):** Hastanın kişisel sağlık portalıdır. Bu ekranda, yaklaşan randevuları, son test sonuçları ve reçeteleri gibi önemli bilgilere hızlıca erişebilir.

*   **Randevu Alma (`appointment.html`, `doctors.html`):** Hastanın kolayca randevu oluşturmasını sağlar. Hasta bu süreçte;
    *   Tüm doktorları ve uzmanlık alanlarını listeleyebilir.
    *   Bir doktorun profilini, takvimini ve hasta yorumlarını inceleyebilir.
    *   Seçtiği doktordan, uygun bir tarih ve saate randevu talebinde bulunabilir.

*   **Randevularım (`my-appointments.html`):** Hastanın kendi randevu geçmişini yönettiği yerdir. Hasta burada;
    *   Geçmiş ve gelecek tüm randevularını görüntüleyebilir.
    *   Yaklaşan bir randevusunu iptal edebilir.
    *   Tamamlanmış bir randevu sonrası doktora değerlendirme ve yorum bırakabilir.

*   **Sağlık Geçmişim (`health-history.html`, `prescriptions.html`, `radiology-results.html`, `test-results.html`):** Hastanın tüm tıbbi kayıtlarına erişebildiği merkezi bir alandır. Bu modüller altında;
    *   Doktorlar tarafından eklenen tüm test ve laboratuvar sonuçlarını görüntüleyebilir.
    *   Yazılan reçetelerin detaylarına ulaşabilir.
    *   Radyoloji (MR, röntgen vb.) sonuçlarını inceleyebilir.
    *   Tüm bu belgeleri indirebilir veya yazdırabilir.

*   **Profilim (`profile.html`):** Hastanın kendi kişisel bilgilerini ve ayarlarını yönettiği yerdir. Hasta burada;
    *   İletişim bilgilerini güncelleyebilir.
    *   Şifresini değiştirebilir.

*   **İletişim (`contact.html`):** Klinik ile genel konular hakkında iletişime geçmek için kullanabileceği bir form ve klinik bilgilerini içerir.

### **4. Kullanıcı Rolleri Arası Etkileşim**
LUMINEX, farklı kullanıcı rolleri arasında sorunsuz ve güvenli bir etkileşim sağlar.
*   **Yönetici -> Doktor/Hasta:** Yöneticiler, doktor ve hasta hesaplarını oluşturur, günceller ve yönetir. Bu, tüm klinik personelinin ve hastaların sisteme sorunsuz entegrasyonunu sağlar.
*   **Hasta -> Doktor:** Hasta, doktorların profillerini ve uygunluk takvimlerini inceleyerek randevu talep eder. Doktor, bu talebi onaylar veya reddeder. Onaylanan randevu her iki tarafın da takvimine işlenir.
*   **Doktor -> Hasta:** Doktorlar, sistem üzerinden hastalara mesaj gönderebilir, hastaların sağlık kayıtlarını, geçmiş randevularını ve test sonuçlarını görüntüleyebilir.

### **5. Tipik Kullanım Senaryoları (A'dan Z'ye İş Akışları)**

*   **5.1. Yeni Bir Hastanın Yolculuğu:** Yeni bir hasta, `register.html` sayfası üzerinden TC Kimlik Numarası ve kişisel bilgileriyle sisteme kaydolur. Ardından, `doctors.html` sayfasından uzmanlık alanına göre doktorları filtreler, bir doktorun profilini inceler ve `appointment.html` üzerinden uygun bir zamana randevu talebi gönderir. Randevusu onaylandığında, `my-appointments.html` sayfasında görüntüleyebilir.
*   **5.2. Bir Doktorun Çalışma Günü:** Doktor, `login.html` üzerinden sisteme giriş yapar. `doctor-dashboard.html`'de günün randevu özetini ve yeni hasta mesajlarını görür. `doctor-appointments.html`'de bir randevuyu onaylar. `doctor-messages.html` üzerinden hastasının sorusunu yanıtlar. Son olarak, `doctor-availability.html`'e girerek gelecek hafta için takvimini günceller.
*   **5.3. Yöneticinin İdari İşlemleri:** Yönetici, sisteme giriş yapar. `admin-users.html` sayfasından kliniğe yeni katılan bir doktorun hesabını oluşturur ve yetkilerini tanımlar. Ardından, `admin-reports.html`'e girerek geçen ayın randevu istatistiklerini içeren bir raporu inceler.

### **6. Uygulama Mimarisi ve Teknik Detaylar**
#### **6.1. Genel Mimari Yapı**
LUMINEX, **sunucusuz (backend-less)** bir mimariye sahiptir. Veriler, tarayıcının `localStorage` (kalıcı) ve `sessionStorage` (oturum bazlı) depolama alanlarında yönetilir.
#### **6.2. Anahtar Sistem Bileşenleri**
*   **Veri Erişim Katmanı (`js/utils/storage-utils.js`):** Uygulamanın veritabanı yöneticisidir.
*   **Oturum Yönetimi ve Güvenlik (`js/user-session.js`):** Sayfaları korur ve yetkisiz erişimi engeller.
*   **Kimlik Doğrulama (`js/script.js`):** Kullanıcının sisteme giriş mantığını yönetir.
#### **6.3. Detaylı Panel ve Modül Açıklamaları**
Her bir panel, bir HTML dosyası ve onun işlevlerini yöneten bir JavaScript dosyasından oluşur.
#### **6.4. Veri Yönetimi ve Sorgulama (SQL Alternatifi)**
Proje, SQL veritabanı yerine `localStorage` kullandığından, veri işlemleri JavaScript fonksiyonları ile yapılır.

### **7. Gelecek Geliştirmeler ve Yol Haritası**
LUMINEX'in modüler mimarisi, gelecekteki ihtiyaçlara göre yeni özelliklerin hızla eklenmesine olanak tanır: Muhasebe ve Faturalandırma, Stok Takibi, Mobil Uygulama, Gelişmiş Raporlama.

### **8. Kurulum ve Devreye Alma**
Sistemin çalışması için karmaşık sunucu yapılandırmaları gerektirmez. Uygulama dosyaları, herhangi bir standart web barındırma hizmetine kopyalanarak saniyeler içinde çalışır hale getirilebilir.

---
### **9. Sonuç: Dijital Kliniğiniz İçin Neden LUMINEX?**
LUMINEX yalnızca bir yazılım değil; kliniğinizin operasyonel verimliliğini artıran, hasta memnuniyetini en üst düzeye çıkaran ve teknoloji maliyetlerinizi ortadan kaldıran modern bir iş ortağıdır. Kullanıcı dostu arayüzü, eşsiz hızı ve güvenli mimarisi ile LUMINEX, dijital dönüşüm yolculuğunuzda kliniğinizi geleceğe taşıyacak en doğru yatırımdır. Bizimle birlikte, kliniğinizin potansiyelini maksimize edin ve sağlık hizmeti sunumunda yeni bir döneme adım atın.