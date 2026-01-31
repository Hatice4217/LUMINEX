# Dağıtım

Bu belge, Luminex web uygulamasını üretim ortamına dağıtmak için yönergeler ve talimatlar sağlar.

## Genel Bakış

Luminex, istemci tarafı bir web uygulamasıdır; yani, bir derleme adımı varsa, derlendikten sonra statik HTML, CSS ve JavaScript dosyalarından oluşur. Dağıtım, temel olarak bu statik varlıkları bir web sunucusu veya statik site barındırma hizmeti aracılığıyla sunmayı içerir.

## Dağıtım Seçenekleri

Luminex gibi statik bir web uygulamasını dağıtmanın birkaç yolu vardır:

1.  **Geleneksel Web Sunucusu (örn. Nginx, Apache):**
    -   Statik dosyaları yönettiğiniz bir web sunucusunda barındırın.
    -   **Adımlar:**
        1.  Tüm proje dosyalarını (HTML, CSS, JS, görseller, `docs/` vb.) web sunucusunun belge kök dizinine (örn. Apache için `/var/www/html/` veya Nginx için belirtilen bir dizin) aktarın.
        2.  Web sunucunuzu bu statik dosyaları sunacak şekilde yapılandırın. Farklı dosya uzantıları için doğru MIME türlerinin ayarlandığından emin olun.
        3.  Özel bir alan adı kullanıyorsanız, DNS kayıtlarını sunucunuzun IP adresini gösterecek şekilde yapılandırın.
        4.  Güvenli iletişim için bir SSL sertifikası (örn. Let's Encrypt) kullanarak HTTPS uygulayın.

2.  **Statik Site Barındırma Hizmetleri (Basitlik ve ölçeklenebilirlik için önerilir):**
    -   Netlify, Vercel, GitHub Pages, Firebase Hosting, AWS S3 + CloudFront gibi hizmetler, statik siteler için mükemmel seçeneklerdir. Genellikle şunları sunarlar:
        -   Hızlı içerik teslimi için Global CDN.
        -   Otomatik HTTPS.
        -   Git depolarından Sürekli Dağıtım.
        -   Özel alan adı desteği.
    -   **Genel Adımlar:**
        1.  Proje kodunuzu bir Git deposuna (örn. GitHub, GitLab, Bitbucket) gönderin.
        2.  Deponuzu seçtiğiniz statik site barındırma hizmetine bağlayın.
        3.  Derleme komutunu (varsa, örn. daha sonra bir derleme süreci eklerseniz `npm run build`) ve yayın dizinini (genellikle proje kökü veya bir derleme adımı eklenirse `dist/` klasörü) yapılandırın.
        4.  Hizmet, uygulamanızı otomatik olarak derleyecek ve dağıtacaktır.
        5.  Gerektiğinde özel alan adlarını ve yeniden yönlendirme kurallarını yapılandırın.

## Dağıtım Öncesi Kontrol Listesi

Üretim ortamına dağıtım yapmadan önce aşağıdakileri göz önünde bulundurun:

-   **Küçültme/Paketleme:** Performans için HTML, CSS ve JavaScript dosyalarının ideal olarak küçültülmesi ve paketlenmesi gerekir. Bu proje şu anda bir derleme süreci göstermese de, üretim için yaygın bir optimizasyondur.
-   **HTTPS:** Kullanıcılar ve uygulamanız arasındaki iletişimi güvenli hale getirmek için her zaman HTTPS kullanın.
-   **Hata Sayfaları:** Özel 404 hata sayfalarını yapılandırın.
-   **Önbellekleme:** Yükleme sürelerini iyileştirmek için statik varlıklar için uygun önbellekleme başlıkları uygulayın.
-   **Ortam Değişkenleri:** Uygulamanız ortam tabanlı değişkenler (örn. API anahtarları) kullanıyorsa, dağıtım sırasında bunların güvenli bir şekilde ele alındığından emin olun (örn. bir derleme süreci varsa derleme zamanında enjekte edilir veya barındırma hizmeti tarafından yönetilir).
-   **Güvenlik Başlıkları:** Güvenliği artırmak için uygun HTTP güvenlik başlıklarını (örn. İçerik Güvenliği Politikası, X-XSS-Koruması) yapılandırın.
-   **Test:** Dağıtılan uygulamayı çeşitli tarayıcılarda ve cihazlarda kapsamlı bir şekilde test edin.

## Dağıtım Sonrası Eylemler

-   **İzleme:** Dağıtılan uygulamanızın performansını ve hatalarını izlemek için izleme ve günlük kaydı ayarlayın.
-   **Yedeklemeler:** Kaynak kodunuz ve ilgili verileriniz için bir yedekleme stratejiniz olduğundan emin olun.
-   **DNS Yapılandırması:** Alan adınızın DNS kayıtlarının dağıtılan uygulamayı doğru şekilde gösterdiğini doğrulayın.

Bu belge yüksek düzeyde bir genel bakış sunmaktadır. Belirli dağıtım adımları seçilen barındırma çözümüne bağlı olarak değişecektir.