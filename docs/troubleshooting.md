# Sorun Giderme

Bu belge, Luminex web uygulamasının geliştirme, kurulum veya işletim aşamalarında ortaya çıkabilecek yaygın sorunlara çözümler sunmaktadır.

## İçindekiler Tablosu

- [Genel Sorunlar](#genel-sorunlar)
- [Kurulum Sorunları](#kurulum-sorunları)
- [Uygulama İşlevselliği Sorunları](#uygulama-işlevselliği-sorunları)
- [API Entegrasyon Sorunları](#api-entegrasyon-sorunları)
- [Performans Sorunları](#performans-sorunları)

---

## Genel Sorunlar

### Boş Sayfa veya Uygulama Yüklenmiyor

**Sorun:** `login.html` açıldığında veya uygulamaya gidildiğinde sadece boş bir sayfa görüntüleniyor.

**Çözüm:**
1.  **Tarayıcı Konsolunu Kontrol Edin:** Tarayıcınızın geliştirici araçlarını (genellikle `F12` veya `Ctrl+Shift+I`/`Cmd+Option+I` tuşlarına basarak) açın ve "Konsol" sekmesine gidin. Herhangi bir JavaScript hatası arayın. Bu hatalar genellikle sözdizimi sorunlarını, işlenmeyen istisnaları veya betik yükleme sorunlarını gösterir.
2.  **Ağ Sekmesi:** Geliştirici araçlarında "Ağ" sekmesini kontrol edin. Sayfayı yeniden yükleyin ve tüm HTML, CSS ve JavaScript dosyalarının başarıyla yüklendiğinden (HTTP durum kodu 200) emin olun. Gerekli varlıklar için başarısız istekler (örn. 404 Bulunamadı) arayın.
3.  **Dosya Yolları:** HTML'inizdeki tüm dosya yollarının (örn. betikler için `src`, stil sayfaları için `href`) HTML dosyasına veya belge köküne göre doğru olduğundan emin olun.

### Stiller Uygulanmıyor / Bozuk Düzen

**Sorun:** Uygulamanın düzeni yanlış veya stiller eksik.

**Çözüm:**
1.  **Tarayıcı Konsolunu Kontrol Edin:** CSS yükleme veya ayrıştırma ile ilgili hatalar arayın.
2.  **Ağ Sekmesi:** Tüm CSS dosyalarının doğru yüklendiğinden (HTTP durum kodu 200) emin olun.
3.  **Öğe Denetleyicisi:** Tarayıcının öğe denetleyicisini kullanarak (sayfadaki bir öğeyi seçin ve sağ tıklayın -> "İncele") hangi CSS kurallarının uygulandığını ve hangilerinin geçersiz kılınmış olabileceğini görün.
4.  **CSS Dosya Yolları:** HTML dosyalarınızdaki `<link rel="stylesheet">` etiketlerindeki `href` özelliklerini iki kez kontrol edin.

---

## Kurulum Sorunları

### `npm install` Başarısız Oluyor

**Sorun:** `npm install` çalıştırıldığında komut hatalarla başarısız oluyor.

**Çözüm:**
1.  **Hata Mesajlarını Kontrol Edin:** Hata mesajlarını dikkatlice okuyun. Genellikle eksik bağımlılıkları, ağ sorunlarını veya izin sorunlarını gösterirler.
2.  **Node.js/npm Sürümü:** Uyumlu bir Node.js ve npm sürümüne sahip olduğunuzdan emin olun. Sürümlerinizi `node -v` ve `npm -v` ile kontrol edebilirsiniz.
3.  **npm Önbelleğini Temizle:** `npm cache clean --force` ile npm önbelleğini temizlemeyi deneyin ve ardından `npm install` komutunu tekrar çalıştırın.
4.  **`node_modules` ve `package-lock.json`'ı Silin:** `node_modules` dizinini ve `package-lock.json` dosyasını kaldırın, ardından `npm install` komutunu tekrar çalıştırın. Bu, bağımlılıkların yeni bir kurulumunu sağlar.
5.  **Proxy Sorunları:** Bir şirket proxy'sinin arkasındaysanız, npm proxy ayarlarınızın doğru yapılandırıldığından emin olun.

### Yerel Web Sunucusu Sorunları

**Sorun:** Yerel web sunucusu (örn. `python -m http.server`, `http-server`) başlamıyor veya dosya sunmuyor.

**Çözüm:**
1.  **Port Çakışması:** Kullanmaya çalıştığınız portun (örn. 8000, 8080) başka bir uygulama tarafından zaten kullanılmadığından emin olun. Farklı bir port deneyin.
2.  **Doğru Dizin:** Sunucu komutunu projenizin kök dizininden çalıştırdığınızdan emin olun.
3.  **Güvenlik Duvarı:** Güvenlik duvarınızın portu engellemediğini kontrol edin.
4.  **Çıktı Mesajları:** Sunucu komutundan gelen çıktı mesajlarını hata göstergeleri açısından gözden geçirin.

---

## Uygulama İşlevselliği Sorunları

### JavaScript İşlevleri Çalışmıyor

**Sorun:** Düğmeler yanıt vermiyor, formlar gönderilmiyor veya dinamik içerik güncellenmiyor.

**Çözüm:**
1.  **Tarayıcı Konsolu:** Bu sizin birincil aracınızdır. JavaScript çalışma zamanı hatalarını arayın. Bu hatalar genellikle sonraki betiklerin yürütülmesini engeller.
2.  **Olay Dinleyicileri:** Olay dinleyicilerinin etkileşim kurmasını beklediğiniz öğelere doğru şekilde eklendiğinden emin olun (örn. `addEventListener`).
3.  **DOM Manipülasyonu:** JavaScript'inizin DOM'daki öğeleri doğru şekilde seçtiğinden ve amaçlandığı gibi manipüle ettiğinden emin olun. Değişkenleri ve öğe durumlarını incelemek için `console.log()` kullanın.
4.  **Betik Yükleme Sırası:** Betiklerin doğru sırada yüklendiğinden emin olun, özellikle bir betik diğerine bağlıysa. Genellikle `<script>` etiketleri `<body>`'nin sonuna yerleştirilir veya `defer` veya `async` öznitelikleri kullanılır.

### Kullanıcı Oturumu / Kimlik Doğrulama Sorunları

**Sorun:** Kullanıcılar giriş yapamıyor veya oturumları korunmuyor.

**Çözüm:**
1.  **API Entegrasyonu:** Bu genellikle API entegrasyonuyla ilgili sorunları işaret eder. [API Entegrasyon Sorunları](#api-entegrasyon-sorunları) bölümüne bakın.
2.  **`localStorage`/`sessionStorage`:** Tarayıcınızın geliştirici araçlarındaki "Uygulama" sekmesini kontrol ederek kimlik doğrulama belirteçlerinin veya kullanıcı verilerinin `localStorage` veya `sessionStorage`'da doğru şekilde saklanıp alınmadığını görün.
3.  **`js/user-session.js`:** Belirteç işleme, depolama ve alma mantığını `user-session.js` dosyasında inceleyin.

---

## API Entegrasyon Sorunları

### Başarısız API İstekleri (Ağ Hataları)

**Sorun:** API çağrıları başarısız oluyor ve konsolda "Failed to fetch" veya "CORS error" gibi hatalar görüyorsunuz.

**Çözüm:**
1.  **Ağ Sekmesi:** Geliştirici araçlarındaki "Ağ" sekmesini kontrol edin. Başarısız API isteklerini ve HTTP durum kodlarını (örn. 401 Yetkisiz, 403 Yasak, 404 Bulunamadı, 500 İç Sunucu Hatası, ağ/CORS sorunları için 0) arayın.
2.  **CORS (Çapraz Kaynak Paylaşımı):** CORS hataları görüyorsanız, bu, ön uç alanınızın arka uç API alanına istek yapmasına izin verilmediği anlamına gelir. Bu, *arka uç sunucusunda* yapılandırılmalıdır. Yerel geliştirme için, geçici tarayıcı uzantıları CORS'u atlayabilir, ancak uygun bir çözüm arka uç yapılandırması gerektirir.
3.  **Uç Nokta URL'si:** Çağrılan API uç nokta URL'lerinin doğru ve erişilebilir olduğunu doğrulayın.
4.  **Sunucu Durumu:** Arka uç API sunucusunun çalıştığından ve erişilebilir olduğundan emin olun.

### Yanlış API Yanıtları / Veri Sorunları

**Sorun:** API istekleri başarılı oluyor, ancak alınan veriler beklenildiği gibi değil veya gönderilen veriler doğru işlenmiyor.

**Çözüm:**
1.  **Ağ Sekmesi (Önizleme/Yanıt):** Tarayıcının geliştirici araçlarında belirli API isteği için "Önizleme" veya "Yanıt" sekmesini inceleyerek gönderilen ve alınan verileri tam olarak görün.
2.  **İstek Yükü:** `POST` veya `PUT` istekleri için, istek gövdesinin (yük) doğru biçimlendirildiğinden (örn. geçerli JSON) ve gerekli tüm verileri içerdiğinden emin olun.
3.  **Arka Uç Günlükleri:** Arka uç günlüklerine erişiminiz varsa, API çağrılarıyla ilgili herhangi bir hata veya uyarı olup olmadığını kontrol edin.
4.  **API Dokümantasyonu:** Ön uçunuzun belirtilen sözleşmeye göre istekler yaptığından emin olmak için arka uç API dokümantasyonuna başvurun.

---

## Performans Sorunları

### Yavaş Sayfa Yüklemeleri / Yanıt Vermeyen Kullanıcı Arayüzü

**Sorun:** Uygulamanın yüklenmesi uzun sürüyor veya kullanıcı arayüzü yanıt vermiyor.

**Çözüm:**
1.  **Ağ Sekmesi (Zamanlama):** Büyük dosyaları, yavaş ağ isteklerini veya varlıkların uzun yükleme sürelerini belirlemek için "Ağ" sekmesini kullanın.
2.  **Performans Sekmesi:** Geliştirici araçlarındaki "Performans" sekmesini kullanarak bir oturumu kaydedin ve JavaScript yürütme sürelerini, render darboğazlarını ve düzen çalkalamasını analiz edin.
3.  **Büyük Varlıklar:** Görsel boyutlarını optimize edin, görseller ve diğer kritik olmayan varlıklar için tembel yüklemeyi (lazy loading) düşünün.
4.  **Verimsiz JavaScript:** Ana iş parçacığındaki ağır hesaplamalar, sonsuz döngüler veya aşırı DOM manipülasyonları için JavaScript kodunu gözden geçirin. Uygun olduğunda olay işleyicileri için `debounce` veya `throttle` kullanın.
5.  **API Çağrı Optimizasyonu:** API çağrılarının sayısını azaltın, önbelleklemeyi uygulayın veya mümkünse istekleri toplu hale getirin.
6.  **CSS/Renderleme:** Karmaşık CSS seçicilerinden, aşırı yeniden çizimlerden/yeniden akışlardan ve renderlemeyi yavaşlatabilecek büyük düzenlerden kaçının.

Bu sorun giderme kılavuzu yaşayan bir belgedir. Yeni sorunlar belirlenip çözüldükçe buraya eklenmelidir.