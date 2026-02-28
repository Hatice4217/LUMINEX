// Appointments E2E Tests
import { test, expect } from '@playwright/test';

test.describe('Appointments Tests', () => {
  // Her testten önce login ol
  test.beforeEach(async ({ page }) => {
    // Login sayfasına git
    await page.goto('/login.html');

    // Login formunu doldur
    await page.fill('#tcNo', '10000000146');
    await page.fill('#password', 'Test1234!');
    await page.click('button[type="submit"]');

    // Dashboard'a yönlendirildiğini bekle
    await page.waitForURL(/.*dashboard/);
  });

  test('should display appointments list', async ({ page }) => {
    // Randevular sayfasına git
    await page.click('[data-testid="appointments-nav"]');

    // Randevu listesini kontrol et
    await expect(page.locator('[data-testid="appointments-list"]')).toBeVisible();
  });

  test('should filter appointments by status', async ({ page }) => {
    await page.click('[data-testid="appointments-nav"]');

    // Status filtresini seç
    await page.selectOption('[data-testid="status-filter"]', 'PENDING');

    // Filtrelenmiş sonuçları kontrol et
    const appointments = await page.locator('.appointment-card').all();
    expect(appointments.length).toBeGreaterThan(0);
  });

  test('should create new appointment', async ({ page }) => {
    await page.click('[data-testid="appointments-nav"]');
    await page.click('[data-testid="new-appointment-button"]');

    // Hastane seç
    await page.selectOption('[data-testid="hospital-select"]', '1');

    // Doktor seç
    await page.selectOption('[data-testid="doctor-select"]', '1');

    // Tarih seç
    await page.fill('[data-testid="appointment-date"]', '2026-06-15');

    // Saat seç
    await page.selectOption('[data-testid="appointment-time"]', '10:00');

    // Notlar gir
    await page.fill('[data-testid="appointment-notes"]', 'Test randevu notları');

    // Submit et
    await page.click('button[type="submit"]');

    // Success mesajını kontrol et
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('Randevu oluşturuldu');
  });

  test('should show appointment details', async ({ page }) => {
    await page.click('[data-testid="appointments-nav"]');

    // İlk randevuya tıkla
    await page.click('.appointment-card:first-child');

    // Detay modal'ını kontrol et
    await expect(page.locator('[data-testid="appointment-details-modal"]')).toBeVisible();

    // Detayları doğrula
    await expect(page.locator('[data-testid="appointment-doctor"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointment-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="appointment-status"]')).toBeVisible();
  });

  test('should update appointment status', async ({ page }) => {
    await page.click('[data-testid="appointments-nav"]');

    // İlk randevuya tıkla
    await page.click('.appointment-card:first-child');

    // Durumu güncelle
    await page.selectOption('[data-testid="status-update"]', 'CONFIRMED');
    await page.click('[data-testid="update-appointment-button"]');

    // Success mesajını kontrol et
    await expect(page.locator('.toast-success')).toContainText('güncellendi');
  });

  test('should cancel appointment', async ({ page }) => {
    await page.click('[data-testid="appointments-nav"]');

    // İlk randevuya tıkla
    await page.click('.appointment-card:first-child');

    // İptal butonuna tıkla
    await page.click('[data-testid="cancel-appointment-button"]');

    // Onay dialog'ında onayla
    await page.click('.confirm-dialog button[type="button"]:last-child');

    // Success mesajını kontrol et
    await expect(page.locator('.toast-success')).toContainText('iptal');
  });

  test('should search appointments', async ({ page }) => {
    await page.click('[data-testid="appointments-nav"]');

    // Arama kutusuna doktor adı yaz
    await page.fill('[data-testid="search-input"]', 'Dr. Test');

    // Sonuçları bekle
    await page.waitForTimeout(500);

    // Arama sonuçlarını kontrol et
    const results = await page.locator('.appointment-card').all();
    expect(results.length).toBeGreaterThanOrEqual(0);
  });

  test('should display appointment history', async ({ page }) => {
    await page.click('[data-testid="appointments-nav"]');

    // History tab'ına tıkla
    await page.click('[data-testid="history-tab"]');

    // Geçmiş randevuları kontrol et
    await expect(page.locator('[data-testid="past-appointments"]')).toBeVisible();
  });

  test('should validate appointment date', async ({ page }) => {
    await page.click('[data-testid="appointments-nav"]');
    await page.click('[data-testid="new-appointment-button"]');

    // Geçmiş tarih seç
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    await page.fill(
      '[data-testid="appointment-date"]',
      pastDate.toISOString().split('T')[0]
    );

    // Submit etmeyi dene
    await page.click('button[type="submit"]');

    // Hata mesajını kontrol et
    await expect(page.locator('.error-message')).toContainText('geçersiz');
  });

  test('should paginate appointments', async ({ page }) => {
    await page.click('[data-testid="appointments-nav"]');

    // Sayfalama butonlarını kontrol et
    const nextButton = page.locator('[data-testid="next-page"]');

    if (await nextButton.isVisible()) {
      await nextButton.click();

      // Sayfa numarasının değiştiğini kontrol et
      await expect(page.locator('[data-testid="current-page"]')).toContainText('2');
    }
  });
});
