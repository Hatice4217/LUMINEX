# Mimari

Bu belge, Luminex web uygulamasının genel mimarisini açıklamaktadır.

## Üst Düzey Genel Bakış

Luminex, öncelikli olarak HTML, CSS ve JavaScript ile oluşturulmuş istemci taraflı bir web uygulamasıdır. Prensip olarak Tek Sayfalı Uygulama (SPA) olarak çalışır; burada farklı HTML dosyaları farklı görünümleri veya modülleri (örn. yönetici panosu, doktor randevuları, hasta profilleri) temsil eder. Bu görünümler arasındaki gezinme, içeriği yüklemek veya yeniden yönlendirmek için JavaScript kullanılarak istemci tarafında yönetilir.

Uygulama, dinamik içerik oluşturmak ve etkileşimli işlevsellikler sağlamak için çeşitli HTML, CSS ve JavaScript dosyalarıyla etkileşime girer.

## Temel Teknolojiler

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Stil:** Özel CSS, muhtemelen bir CSS çerçevesi (örn. `css/` dizinindeki `skeleton.css` ile belirtilen Skeleton CSS).
- **İstemci Taraflı Mantık:** Modüller halinde düzenlenmiş saf JavaScript (örn. `js/utils/`, `js/`).
- **Veri Depolama:** İstemci tarafı veri kalıcılığı, kullanıcı oturumu yönetimi (`user-session.js`) ve muhtemelen harici API'lerden veri çekme için `localStorage` veya `sessionStorage` kullanır.

## Veri Akışı

*(Bu bölüm, kullanıcı girdisinden görüntülemeye kadar uygulamanın veri akışını, varsa herhangi bir arka uç API'si ile etkileşimleri detaylandıracaktır.)*

## Modül Dağılımı

Uygulama, her biri belirli işlevlerden sorumlu olan birkaç modüle ayrılmıştır:

-   **Yönetici Modülü:** (`admin-dashboard.html`, `admin-users.js`, `admin-hospitals.js` vb.)
    -   Kullanıcıları, hastaneleri, departmanları yönetir ve raporlar oluşturur.
-   **Doktor Modülü:** (`doctor-dashboard.html`, `doctor-appointments.js`, `doctor-profile.js` vb.)
    -   Randevular, uygunluk, mesajlar ve hasta yorumları gibi doktora özgü işlevleri yönetir.
-   **Hasta/Kullanıcı Modülü:** (`dashboard.html`, `my-appointments.js`, `profile.html`, `health-history.js` vb.)
    -   Hastaların randevuları yönetmesi, sağlık kayıtlarını görüntülemesi ve profillerini güncellemesi için işlevler sağlar.
-   **Çekirdek Yardımcı Programlar:** (`js/utils/`)
    -   Doğrulama, veri işleme ve özel UI bileşenleri için yeniden kullanılabilir işlevler içerir.

## API Entegrasyonu

Luminex, veri alma, gönderme ve kimlik doğrulama için harici arka uç API'leri ile etkileşime girmek üzere tasarlanmıştır. `js/user-session.js` ve `js/utils/data.js` dosyaları muhtemelen bu etkileşimleri yönetir.

*(API uç noktaları, istek/yanıt formatları, kimlik doğrulama mekanizmaları ve hata yönetimi ile ilgili daha fazla ayrıntı özel bir `api-entegrasyonu.md` belgesinde sağlanacaktır.)*