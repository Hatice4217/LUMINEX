# Kod Yapısı

Bu belge, Luminex projesinde kullanılan dizin yapısını, dosya organizasyonunu ve genel kodlama kurallarını özetlemektedir.

## Dizin Yapısı

Projenin kök dizini, farklı uygulama görünümlerini temsil eden HTML dosyalarını, ayrıca stil ve betik için sırasıyla `css/` ve `js/` dizinlerini içerir.

```
.
├── admin-dashboard.html
├── ... (diğer HTML dosyaları)
├── css/
│   ├── custom-select.css
│   ├── dark-mode-v2.css
│   ├── dark-mode.css
│   ├── skeleton.css
│   └── style.css
├── js/
│   ├── admin-dashboard.js
│   ├── ... (diğer ana JS dosyaları)
│   └── utils/
│       ├── custom-select.js
│       ├── data.js
│       ├── header-manager.js
│       ├── storage-utils.js
│       └── validation-utils.js
├── node_modules/ ... (npm paketleri için)
├── docs/ (yeni oluşturulan dokümantasyon dizini)
│   ├── architecture.md
│   ├── features.md
│   ├── code-structure.md
│   ├── api-integration.md
│   ├── setup.md
│   ├── deployment.md
│   └── troubleshooting.md
├── package.json
├── package-lock.json
└── README.md
```

### `css/` Dizini

Bu dizin, uygulamanın görsel sunumunu tanımlayan tüm Basamaklı Stil Sayfaları (`.css`) dosyalarını içerir.

-   **`style.css`**: Genel uygulama stili için ana stil sayfası.
-   **`dark-mode.css` / `dark-mode-v2.css`**: Koyu mod temaları için stil sayfaları.
-   **`skeleton.css`**: Temel düzen ve stil için potansiyel olarak hafif bir CSS çerçevesi.
-   **`custom-select.css`**: Özel açılır/seçim öğeleri için stiller.

### `js/` Dizini

Bu dizin, uygulamanın dinamik davranışından, etkileşiminden ve iş mantığından sorumlu tüm JavaScript (`.js`) dosyalarını içerir.

-   **Kök `js/` dosyaları**: Her ana HTML sayfası tipik olarak karşılık gelen bir JavaScript dosyasına sahiptir (örn. `admin-dashboard.html` için `admin-dashboard.js`). Bu dosyalar sayfaya özgü mantık, olay dinleyicileri ve veri manipülasyonu içerir.
-   **`js/utils/` Dizini**: Bu alt dizin, uygulamanın farklı bölümlerinde paylaşılan yardımcı işlevleri ve yeniden kullanılabilir modülleri barındırır.
    -   **`custom-select.js`**: Özel seçme/açılır UI bileşenleri için mantık.
    -   **`data.js`**: Muhtemelen veri çekme, manipülasyon veya yerel depolama etkileşimlerini yönetir.
    -   **`header-manager.js`**: Ortak başlık öğelerini veya gezinmeyi yönetir.
    -   **`storage-utils.js`**: `localStorage` veya `sessionStorage` ile etkileşim için yardımcı işlevler.
    -   **`validation-utils.js`**: Formlardaki kullanıcı girişini doğrulamak için işlevler.
-   **`user-session.js`**: Oturumdaki kullanıcı giriş durumunu, kimlik doğrulama belirteçlerini ve kullanıcıya özgü verileri yönetir.

## Adlandırma Kuralları

-   **HTML Dosyaları**: Genellikle temsil ettikleri görünümü veya modülü yansıtan açıklayıcı şekilde adlandırılır (örn. `admin-dashboard.html`, `doctor-appointments.html`).
-   **CSS Dosyaları**: Amaçlarını veya stillendirdikleri bileşeni belirtmek için adlandırılır (örn. `style.css`, `dark-mode.css`, `custom-select.css`).
-   **JavaScript Dosyaları**:
    -   Sayfaya özgü JS dosyaları, ilgili HTML dosyalarıyla aynı şekilde adlandırılır (örn. `admin-dashboard.html` için `admin-dashboard.js`).
    -   `js/utils/` içindeki yardımcı dosyalar, işlevsel sorumluluklarını yansıtacak şekilde adlandırılır (örn. `validation-utils.js`).
    -   Değişkenler ve işlevler genellikle `camelCase` kuralına uyar.
    -   Sabitler `UPPER_SNAKE_CASE` şeklindedir.

## Kodlama Stili

*(Bu bölüm, girintileme, küme ayracı yerleşimi, yorum stili vb. gibi belirli kodlama stili yönergelerini detaylandıracaktır. Şimdilik standart JavaScript en iyi uygulamaları varsayılmıştır.)*

-   **Girinti**: (örn. 2 veya 4 boşluk)
-   **Noktalı Virgül**: (örn. her zaman kullanılır veya mümkün olduğunda atlanır)
-   **Tırnak İşaretleri**: (örn. dizeler için tek veya çift tırnak)
-   **Yorumlar**: Karmaşık mantığı açıklamak için anlamlı yorumlar kullanın, ancak kendi kendini belgeleyen kodu tercih edin.

## Varlık Yönetimi

-   Görseller kök dizinde saklanır (örn. `clean-logo.png`, `luminex-logo.png`).
-   Faviconlar (`favicon.png`, `favicon.svg`) da kök dizindedir.