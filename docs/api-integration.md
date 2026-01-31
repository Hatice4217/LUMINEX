# API Entegrasyonu

Bu belge, Luminex ön uç uygulamasının arka uç Uygulama Programlama Arayüzleri (API'ler) ile nasıl etkileşim kurduğunu açıklamaktadır.

## Genel Bakış

Luminex uygulaması, bir veya daha fazla arka uç API'si tarafından sağlanan verileri ve hizmetleri tüketen istemci tarafı bir arayüz olarak tasarlanmıştır. Ön uç (JavaScript) ile arka uç arasındaki iletişim tipik olarak eşzamansız HTTP istekleri (AJAX/Fetch API) aracılığıyla gerçekleşir.

## Varsayımlar ve Desenler

Dosya yapısına (örn. `js/utils/data.js`, `js/user-session.js`) dayanarak, aşağıdakiler varsayılmaktadır:

-   **RESTful API'ler:** Arka uç muhtemelen çeşitli kaynaklar (kullanıcılar, randevular, hastaneler vb.) için RESTful uç noktaları sunar.
-   **JSON Veri Formatı:** İstek ve yanıt gövdeleri tipik olarak JSON olarak biçimlendirilir.
-   **Kimlik Doğrulama:** Kullanıcı kimlik doğrulaması (giriş, kayıt) API çağrıları aracılığıyla yapılır. Kullanıcı oturumları, istemci tarafında, muhtemelen `localStorage` veya `sessionStorage`'da (`js/user-session.js`) depolanan jetonlar (örn. JWT) kullanılarak yönetilir.
-   **Veri Çekme:** HTTP istekleri yapmak için `fetch` API veya benzer bir mekanizma (örn. XMLHttpRequest) kullanılır. `js/utils/data.js` dosyası bu veri çekme yardımcı programlarını kapsayabilir.

## Kimlik Doğrulama Akışı

1.  **Giriş:**
    -   Kullanıcı, bir giriş formu aracılığıyla kimlik bilgilerini (kullanıcı adı/e-posta, şifre) sağlar.
    -   Ön uç, bir kimlik doğrulama API uç noktasına (örn. `/api/login`) bir `POST` isteği gönderir.
    -   Arka uç kimlik bilgilerini doğrular ve başarılı olursa bir kimlik doğrulama jetonu (örn. JWT) döndürür.
    -   Ön uç bu jetonu depolama alanına (örn. `js/user-session.js` aracılığıyla `localStorage`'a) kaydeder.
2.  **Kimliği Doğrulanmış İstekler:**
    -   Korumalı API uç noktalarına yapılan sonraki istekler için, depolanan jeton istek başlıklarına (örn. `Authorization: Bearer <jeton>`) dahil edilir.
    -   `js/user-session.js` veya `js/utils/data.js` bu jetonun otomatik olarak dahil edilmesini sağlayabilir.
3.  **Çıkış:**
    -   Kullanıcı çıkış yapar.
    -   Ön uç, depolanan jetonu istemci tarafı depolama alanından kaldırır.
    -   İsteğe bağlı olarak, sunucu tarafındaki jetonu geçersiz kılmak için bir çıkış API uç noktasına istek gönderir.

## Örnek API Etkileşimleri (Varsayımsal)

Mevcut ön uç yapısında belirli API uç noktaları tanımlanmamış olsa da, tipik etkileşimler şunları içerir:

### Kullanıcı Profilini Al

-   **Yöntem:** `GET`
-   **Uç Nokta:** `/api/users/me`
-   **Başlıklar:** `Authorization: Bearer <jeton>`
-   **Yanıt:**
    ```json
    {
        "id": "user123",
        "username": "john.doe",
        "role": "patient",
        "email": "john.doe@example.com",
        "firstName": "John",
        "lastName": "Doe"
    }
    ```

### Yeni Randevu Oluştur

-   **Yöntem:** `POST`
-   **Uç Nokta:** `/api/appointments`
-   **Başlıklar:** `Content-Type: application/json`, `Authorization: Bearer <jeton>`
-   **İstek Gövdesi:**
    ```json
    {
        "doctorId": "doc456",
        "patientId": "user123",
        "date": "2025-12-25",
        "time": "10:00",
        "reason": "Routine Checkup"
    }
    ```
-   **Yanıt:**
    ```json
    {
        "message": "Appointment created successfully",
        "appointmentId": "app789"
    }
    ```

## Hata Yönetimi

-   Ön uç JavaScript, API istekleri için sağlam hata yönetimi (örn. `fetch` ile `try...catch`, `response.ok` kontrolü) uygulamalıdır.
-   Başarısız istekler için kullanıcı dostu hata mesajları görüntüleyin.
-   Belirli HTTP durum kodlarını (örn. yetkisiz için 401, yasak için 403, bulunamadı için 404, sunucu hataları için 500) işleyin.

## API Etkileşimi için Ana Dosyalar

-   `js/user-session.js`: Kullanıcı kimlik doğrulama durumunu ve jetonları yönetir.
-   `js/utils/data.js`: Muhtemelen API çağrıları yapmak için genel işlevler içerir.
-   Bireysel sayfaya özgü JavaScript dosyaları (örn. `js/appointment.js`, `js/profile.js`), işlevleriyle ilgili API'leri çağırmak için belirli mantığı içerecektir.