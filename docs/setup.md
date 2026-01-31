# Kurulum ve Yükleme

Bu belge, Luminex web uygulamasını geliştirme veya tanıtım amaçlı olarak yerel ortamda nasıl kuracağınızı ve çalıştıracağınızı açıklar.

## Ön Koşullar

Başlamadan önce aşağıdakilerin kurulu olduğundan emin olun:

-   Modern bir web tarayıcısı (örn. Chrome, Firefox, Edge, Safari).
-   *(İsteğe bağlı, ancak geliştirme için önerilir)* Visual Studio Code gibi bir kod düzenleyici.
-   *(İsteğe bağlı, geliştirme bağımlılıkları için npm kullanılıyorsa)* Node.js ve npm (Node Paket Yöneticisi). [nodejs.org](https://nodejs.org/) adresinden indirebilirsiniz.

## Başlarken

Luminex uygulamasını yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin:

1.  **Depoyu Klonlayın:**
    Git kuruluysa, terminalinizi veya komut istemcinizi açın ve şunu çalıştırın:
    ```bash
    git clone [depo-url] # [depo-url]'yi gerçek URL ile değiştirin
    cd "LUMINEX GEMINI" # Proje dizinine gidin
    ```
    Git kurulu değilse, proje ZIP dosyasını depounun kaynağından indirip çıkarabilirsiniz.

2.  **Bağımlılıkları Yükleyin (varsa):**
    Mevcut proje yapısı, ağırlıklı olarak HTML, CSS ve JavaScript kullanan istemci tarafı bir uygulamayı işaret etmektedir. npm aracılığıyla yönetilen (örn. lintleyiciler, paketleyiciler, test çerçeveleri) herhangi bir geliştirme aracı veya kütüphane varsa, bunları yüklemeniz gerekebilir.
    Terminalinizde projenin kök dizinine gidin ve şunu çalıştırın:
    ```bash
    npm install
    ```
    *(Not: Eğer `npm install` başarısız olursa veya gereksiz görünüyorsa, bu, projenin tamamen statik olduğu ve çalışma zamanı için Node.js paketlerine dayanmadığı, yalnızca burada açıkça kullanılmayan geliştirme araçları için olabileceği anlamına gelebilir.)*

3.  **Uygulamayı Çalıştırın:**
    Luminex bir istemci tarafı web uygulaması olduğundan, belirli API CORS sorunları veya diğer sunucu tarafı gereksinimlerle uğraşmıyorsanız, yerel geliştirme için özel bir web sunucusuna genellikle ihtiyacınız yoktur.

    **Seçenek A: Doğrudan Tarayıcıda Açın (En Basit)**
    -   Projenin kök dizinindeki `login.html` dosyasını bulun.
    -   Varsayılan web tarayıcınızda açmak için `login.html`'e çift tıklayın.
    -   Alternatif olarak, `login.html`'e sağ tıklayın ve tercih ettiğiniz tarayıcıyı seçmek için "Birlikte Aç..."ı seçin.

    **Seçenek B: Yerel Bir Web Sunucusu Kullanarak (Tutarlılık ve CORS sorunlarından kaçınmak için önerilir)**
    Özellikle API çağrılarıyla uğraşırken, daha sağlam bir yerel geliştirme ortamı için dosyaları basit bir yerel web sunucusu aracılığıyla sunmak genellikle daha iyidir.

    Python yüklüyse:
    ```bash
    python -m http.server 8000
    # Ardından tarayıcınızı http://localhost:8000 adresine açın
    ```
    Node.js ve npm yüklüyse, `http-server` kullanabilirsiniz:
    ```bash
    # http-server'ı global olarak yükleyin (daha önce kurulu değilse)
    npm install -g http-server
    # Ardından proje kök dizininden
    http-server
    # Veya bir port belirtmek için
    http-server -p 8080
    # Ardından tarayıcınızı http://localhost:8080 adresine açın
    ```

    Bu komutlardan herhangi birini çalıştırdıktan sonra, web tarayıcınızı açın ve sunucu tarafından sağlanan adrese gidin (örn. `http://localhost:8000` veya `http://127.0.0.1:8080`).

## Kurulum Sonrası Kontroller

-   Tüm HTML sayfalarının doğru yüklendiğini doğrulayın.
-   Tarayıcının geliştirici konsolunda herhangi bir JavaScript hatası olup olmadığını kontrol edin.
-   CSS stillerinin beklendiği gibi uygulandığından emin olun.
-   Sayfalar arası gezinme gibi temel işlevleri test edin.

Bu, Luminex için kurulum sürecini tamamlar. Artık uygulamayı keşfetmeye ve geliştirmeye hazırsınız.