# Özellikler

Bu belge, Luminex web uygulamasında uygulanan temel özellikler hakkında ayrıntılı bilgi sağlar. Her özellik, amacı, işlevselliği ve ilgili dosyalarıyla birlikte açıklanmıştır.

## İçindekiler Tablosu

- [Kullanıcı Kimlik Doğrulama ve Yetkilendirme](#kullanıcı-kimlik-doğrulama-ve-yetkilendirme)
- [Yönetici Paneli ve Yönetimi](#yönetici-paneli-ve-yönetimi)
- [Doktor Paneli ve İş Akışı](#doktor-paneli-ve-iş-akışı)
- [Hasta Paneli ve Hizmetleri](#hasta-paneli-ve-hizmetleri)
- [Randevu Yönetimi](#randevu-yönetimi)
- [Sağlık Kayıtları](#sağlık-kayıtları)
- [Mesajlaşma Sistemi](#mesajlaşma-sistemi)
- [Raporlama](#raporlama)

---

## Kullanıcı Kimlik Doğrulama ve Yetkilendirme

**Amaç:** Yalnızca yetkili kullanıcıların rolleri (Yönetici, Doktor, Hasta) temelinde belirli işlevlere erişmesine izin vererek uygulamayı güvence altına almak.

**İşlevsellik:**
- Kullanıcı kaydı (`register.html`, `js/register.js`)
- Kullanıcı girişi (`login.html` veya özel giriş sayfası, genel giriş/oturum yönetimi için `js/script.js`)
- Şifre sıfırlama (`forgot-password.html`, `reset-password.html`, `js/forgot-password.js`, `js/reset-password.js`)
- Oturum yönetimi (`js/user-session.js`)

**Ana Dosyalar:**
- `register.html`
- `login.html` (giriş formu için potansiyel)
- `forgot-password.html`
- `reset-password.html`
- `js/register.js`
- `js/forgot-password.js`
- `js/reset-password.js`
- `js/user-session.js`
- `js/utils/validation-utils.js` (giriş doğrulaması için)

---

## Yönetici Paneli ve Yönetimi

**Amaç:** Yöneticilere tüm sistemi denetleme, kullanıcıları, hastaneleri, departmanları yönetme ve sistem raporlarını görüntüleme araçları sağlamak.

**İşlevsellik:**
- Yönetici paneli genel bakışı (`admin-dashboard.html`, `js/admin-dashboard.js`)
- Kullanıcı yönetimi (kullanıcı oluşturma, okuma, güncelleme, silme) (`admin-users.html`, `js/admin-users.js`)
- Hastane yönetimi (`admin-hospitals.html`, `js/admin-hospitals.js`)
- Departman yönetimi (`admin-departments.html`, `js/admin-departments.js`)
- Sistem raporlarına erişim (`admin-reports.html`, `js/admin-reports.js`)

**Ana Dosyalar:**
- `admin-dashboard.html`
- `admin-users.html`
- `admin-hospitals.html`
- `admin-departments.html`
- `admin-reports.html`
- `js/admin-dashboard.js`
- `js/admin-users.js`
- `js/admin-hospitals.js`
- `js/admin-departments.js`
- `js/admin-reports.js`

---

## Doktor Paneli ve İş Akışı

**Amaç:** Doktorlara randevularını, uygunluklarını, hasta etkileşimlerini ve profillerini yönetmeleri için kişiselleştirilmiş bir kontrol paneli sunar.

**İşlevsellik:**
- Kontrol paneli genel bakışı (`doctor-dashboard.html`, `js/doctor-dashboard.js`)
- Randevuları görüntüleme ve yönetme (`doctor-appointments.html`, `js/doctor-appointments.js`)
- Uygunluğu ayarlama ve güncelleme (`doctor-availability.html`, `js/doctor-availability.js`)
- Profil bilgilerini yönetme (`doctor-profile.html`, `js/doctor-profile.js`)
- Hasta yorumlarını ve derecelendirmelerini görüntüleme (`doctor-ratings.html`, `doctor-reviews.html`, `js/doctor-ratings.js`, `js/doctor-reviews.js`)

**Ana Dosyalar:**
- `doctor-dashboard.html`
- `doctor-appointments.html`
- `doctor-availability.html`
- `doctor-profile.html`
- `doctor-ratings.html`
- `doctor-reviews.html`
- `js/doctor-dashboard.js`
- `js/doctor-appointments.js`
- `js/doctor-availability.js`
- `js/doctor-profile.js`
- `js/doctor-ratings.js`
- `js/doctor-reviews.js`

---

## Hasta Paneli ve Hizmetleri

**Amaç:** Hastalara randevularını yönetmeleri, sağlık geçmişlerini, reçetelerini ve test sonuçlarını görüntülemeleri için bir arayüz sağlar.

**İşlevsellik:**
- Kontrol paneli genel bakışı (`dashboard.html`, `js/dashboard.js`)
- Kişisel randevuları görüntüleme ve yönetme (`my-appointments.html`, `js/my-appointments.js`)
- Sağlık geçmişine erişim (`health-history.html`, `js/health-history.js`)
- Reçeteleri görüntüleme (`prescriptions.html`, `js/prescriptions.js`)
- Laboratuvar ve radyoloji sonuçlarını görüntüleme (`lab-report-template.html`, `radiology-results.html`, `test-results.html`, `js/lab-report.js`, `js/radiology-results.js`, `js/test-results.js`)
- Kişisel profili güncelleme (`profile.html`, `js/profile.js`)
- Doktor arama (`doctors.html`, `js/doctors.js`, `js/doctors-page.js`)

**Ana Dosyalar:**
- `dashboard.html`
- `my-appointments.html`
- `health-history.html`
- `prescriptions.html`
- `lab-report-template.html`
- `radiology-results.html`
- `test-results.html`
- `profile.html`
- `doctors.html`
- `js/dashboard.js`
- `js/my-appointments.js`
- `js/health-history.js`
- `js/prescriptions.js`
- `js/lab-report.js`
- `js/radiology-results.js`
- `js/test-results.js`
- `js/profile.js`
- `js/doctors.js`
- `js/doctors-page.js`

---

## Randevu Yönetimi

**Amaç:** Hem doktorlar hem de hastalar için randevuların planlanmasını, görüntülenmesini ve değiştirilmesini kolaylaştırır.

**İşlevsellik:**
- Yeni randevular oluşturma (`appointment.html`, `js/appointment.js`)
- Yaklaşan ve geçmiş randevuları görüntüleme
- Randevuları iptal etme veya yeniden planlama

**Ana Dosyalar:**
- `appointment.html`
- `my-appointments.html`
- `doctor-appointments.html`
- `js/appointment.js`
- `js/my-appointments.js`
- `js/doctor-appointments.js`

---

## Sağlık Kayıtları

**Amaç:** Hastanın reçeteler, laboratuvar sonuçları ve radyoloji bulguları dahil olmak üzere tıbbi geçmişini sürdürmek ve görüntülemek.

**İşlevsellik:**
- Kapsamlı sağlık geçmişini görüntüleme (`health-history.html`, `js/health-history.js`)
- Reçete detaylarına erişim (`prescriptions.html`, `prescription-report-template.html`, `js/prescriptions.js`, `js/prescription-report.js`)
- Laboratuvar test sonuçlarını inceleme (`test-results.html`, `lab-report-template.html`, `js/test-results.js`, `js/lab-report.js`)
- Radyoloji sonuçlarını inceleme (`radiology-results.html`, `js/radiology-results.js`)

**Ana Dosyalar:**
- `health-history.html`
- `prescriptions.html`
- `prescription-report-template.html`
- `test-results.html`
- `lab-report-template.html`
- `radiology-results.html`
- `js/health-history.js`
- `js/prescriptions.js`
- `js/prescription-report.js`
- `js/test-results.js`
- `js/lab-report.js`
- `js/radiology-results.js`

---

## Mesajlaşma Sistemi

**Amaç:** Doktorlar ve hastalar arasında veya idari personel içinde güvenli iletişimi sağlar.

**İşlevsellik:**
- Alınan mesajları görüntüleme (`doctor-messages.html`, `js/doctor-messages.js`)
- Mesaj gönderme (`doctor-send-message.html`, `js/doctor-send-message.js`)
- Gönderilen mesajları görüntüleme (`doctor-sent-messages.html`, `js/doctor-sent-messages.js`)

**Ana Dosyalar:**
- `doctor-messages.html`
- `doctor-send-message.html`
- `doctor-sent-messages.html`
- `js/doctor-messages.js`
- `js/doctor-send-message.js`
- `js/doctor-sent-messages.js`

---

## Raporlama

**Amaç:** İdari ve analitik amaçlar için çeşitli raporlar oluşturmak.

**İşlevsellik:**
- İdari raporlar oluşturma (`admin-reports.html`, `js/admin-reports.js`)
- Reçete raporları oluşturma (`prescription-report-template.html`, `js/prescription-report.js`)
- Laboratuvar raporları oluşturma (`lab-report-template.html`, `js/lab-report.js`)

**Ana Dosyalar:**
- `admin-reports.html`
- `prescription-report-template.html`
- `lab-report-template.html`
- `js/admin-reports.js`
- `js/prescription-report.js`
- `js/lab-report.js`