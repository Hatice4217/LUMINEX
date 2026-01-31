# LUMINEX Projesi Yapılacaklar Listesi

Bu dosya, kod analizi sonrası tespit edilen hataları ve iyileştirme önerilerini takip etmek için oluşturulmuştur.

### Hata Düzeltmeleri (Bugs)

- [ ] **İletişim Formu Çalışmıyor:** `index.html` dosyasındaki iletişim formunun `action` attribute'unda bulunan `https://formspree.io/f/YOUR_FORM_ID_HERE` adresi gerçek Formspree ID'si ile değiştirilmelidir. Bu yapılmadığı sürece form çalışmayacaktır.
- [ ] **Kırık Link Kontrolü:** Sosyal medya ve diğer dış bağlantıların (`#` olmayanlar) geçerli hedeflere yönlendirdiği doğrulanmalıdır.

### Kod Kalitesi ve İyileştirmeler

- [ ] **Inline CSS'i Kaldır:** `index.html` (satır 59) içerisindeki "Kayıt Ol" butonunda bulunan `style` attribute'u kaldırılarak stiller `landing.css` dosyasına bir sınıf (class) olarak taşınmalıdır.
- [ ] **`!important` Kullanımını Refactor Et:** `landing.css` dosyasında koyu mod logosu için kullanılan `!important` kuralı, daha spesifik CSS seçicileri kullanılarak ortadan kaldırılmalıdır. Bu, kodun sürdürülebilirliğini artırır.
- [ ] **Koyu Mod Logo Mantığını İyileştir:** Logoyu CSS `mask` ile değiştirmek yerine, JavaScript kullanarak `<img>` etiketinin `src` özelliğini tema değişiminde dinamik olarak değiştirmek daha standart ve sağlam bir yöntemdir.

### Performans Optimizasyonu

- [ ] **CSS Dosyalarını Böl (Code Splitting):** `style.css` ve `landing.css` dosyaları çok büyük ve birden fazla sayfaya ait stiller içeriyor. Performansı artırmak için bu dosyaları sayfa bazlı (örneğin `login.css`, `dashboard.css`) veya bileşen bazlı daha küçük dosyalara ayır.
- [ ] **JavaScript Dosyalarını Böl (Code Splitting):** `script.js` dosyası birden çok sayfanın mantığını içeriyor. Sadece ilgili sayfanın ihtiyaç duyduğu JavaScript kodunun yüklenmesi için sayfa özelinde (örn: `landing.js`) dosyalar oluştur.

