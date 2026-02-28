// Real-time Features E2E Tests
import { test, expect } from '@playwright/test';

test.describe('Real-time Features Tests', () => {
  test.beforeEach(async ({ page, context }) => {
    // İlk sayfayı aç ve login yap
    await page.goto('/login.html');
    await page.fill('#tcNo', '10000000146');
    await page.fill('#password', 'Test1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);
  });

  test('should receive real-time notifications', async ({ page, context }) => {
    // İkinci bir browser context oluştur (başka kullanıcı)
    const secondPage = await context.newPage();

    // İkinci sayfada farklı kullanıcı ile login yap
    await secondPage.goto('/login.html');
    await secondPage.fill('#tcNo', '10000000147');
    await secondPage.fill('#password', 'Test1234!');
    await secondPage.click('button[type="submit"]');
    await secondPage.waitForURL(/.*dashboard/);

    // İlk sayfada randevu oluştur
    await page.click('[data-testid="appointments-nav"]');
    await page.click('[data-testid="new-appointment-button"]');

    await page.selectOption('[data-testid="hospital-select"]', '1');
    await page.selectOption('[data-testid="doctor-select"]', '2'); // İkinci kullanıcı (doktor)
    await page.fill('[data-testid="appointment-date"]', '2026-06-15');
    await page.selectOption('[data-testid="appointment-time"]', '10:00');
    await page.click('button[type="submit"]');

    // İkinci sayfada bildirimin gelmesini bekle
    await expect(secondPage.locator('[data-testid="notification-badge"]')).toBeVisible({ timeout: 5000 });

    // Bildirimi tıkla
    await secondPage.locator('[data-testid="notification-badge"]').click();

    // Bildirim listesini kontrol et
    await expect(secondPage.locator('[data-testid="notification-list"]')).toBeVisible();

    // Yeni randevu bildirimini kontrol et
    await expect(secondPage.locator('.notification-item:first-child')).toContainText('Yeni randevu');

    await secondPage.close();
  });

  test('should show user online status', async ({ page, context }) => {
    // İkinci bir browser context oluştur
    const secondPage = await context.newPage();

    // İkinci sayfada login yap
    await secondPage.goto('/login.html');
    await secondPage.fill('#tcNo', '10000000147');
    await secondPage.fill('#password', 'Test1234!');
    await secondPage.click('button[type="submit"]');
    await secondPage.waitForURL(/.*dashboard/);

    // Mesajlar sayfasına git
    await page.click('[data-testid="messages-nav"]');

    // Kullanıcı listesini kontrol et
    await expect(page.locator('[data-testid="users-list"]')).toBeVisible();

    // İkinci kullanıcının online olduğunu kontrol et
    const onlineUser = page.locator('[data-user-id="10000000147"][data-online="true"]');
    await expect(onlineUser).toBeVisible({ timeout: 5000 });

    await secondPage.close();
  });

  test('should send and receive real-time messages', async ({ page, context }) => {
    // İkinci bir browser context oluştur
    const secondPage = await context.newPage();

    // İkinci sayfada login yap
    await secondPage.goto('/login.html');
    await secondPage.fill('#tcNo', '10000000147');
    await secondPage.fill('#password', 'Test1234!');
    await secondPage.click('button[type="submit"]');
    await secondPage.waitForURL(/.*dashboard/);

    // Her iki sayfada da mesajlar sayfasına git
    await page.click('[data-testid="messages-nav"]');
    await secondPage.click('[data-testid="messages-nav"]');

    // İlk sayfada kullanıcı seç
    await page.click('[data-user-id="10000000147"]');

    // Mesaj gönder
    const testMessage = 'Test mesajı - ' + Date.now();
    await page.fill('[data-testid="message-input"]', testMessage);
    await page.click('[data-testid="send-message-button"]');

    // İkinci sayfada mesajın gelmesini bekle
    await expect(secondPage.locator('.message-item:last-child')).toContainText(testMessage, { timeout: 5000 });

    // Mesajın gönderildiğini kontrol et
    await expect(page.locator('.message-item:last-child')).toContainText(testMessage);

    await secondPage.close();
  });

  test('should show typing indicator', async ({ page, context }) => {
    // İkinci bir browser context oluştur
    const secondPage = await context.newPage();

    // İkinci sayfada login yap
    await secondPage.goto('/login.html');
    await secondPage.fill('#tcNo', '10000000147');
    await secondPage.fill('#password', 'Test1234!');
    await secondPage.click('button[type="submit"]');
    await secondPage.waitForURL(/.*dashboard/);

    // Her iki sayfada da mesajlar sayfasına git
    await page.click('[data-testid="messages-nav"]');
    await secondPage.click('[data-testid="messages-nav"]');

    // İlk sayfada kullanıcı seç
    await page.click('[data-user-id="10000000147"]');

    // Yazmaya başla
    await page.fill('[data-testid="message-input"]', 'Test');

    // İkinci sayfada typing indicator'ını kontrol et
    await expect(secondPage.locator('[data-testid="typing-indicator"]')).toBeVisible({ timeout: 3000 });

    await secondPage.close();
  });

  test('should update appointment status in real-time', async ({ page, context }) => {
    // İkinci bir browser context oluştur
    const secondPage = await context.newPage();

    // İkinci sayfada doktor olarak login yap
    await secondPage.goto('/login.html');
    await secondPage.fill('#tcNo', '10000000147');
    await secondPage.fill('#password', 'Test1234!');
    await secondPage.click('button[type="submit"]');
    await secondPage.waitForURL(/.*dashboard/);

    // İlk sayfada randevular sayfasına git
    await page.click('[data-testid="appointments-nav"]');

    // İlk randevunun durumunu kontrol et
    const initialStatus = await page.locator('.appointment-card:first-child [data-testid="appointment-status"]').textContent();

    // İkinci sayfada randevular sayfasına git
    await secondPage.click('[data-testid="appointments-nav"]');

    // İlk randevuyu güncelle
    await secondPage.click('.appointment-card:first-child');
    await secondPage.selectOption('[data-testid="status-update"]', 'CONFIRMED');
    await secondPage.click('[data-testid="update-appointment-button"]');

    // İlk sayfada durumun güncellendiğini kontrol et
    await expect(page.locator('.appointment-card:first-child [data-testid="appointment-status"]'))
      .toContainText('CONFIRMED', { timeout: 5000 });

    await secondPage.close();
  });

  test('should mark message as read in real-time', async ({ page, context }) => {
    // İkinci bir browser context oluştur
    const secondPage = await context.newPage();

    // İkinci sayfada login yap
    await secondPage.goto('/login.html');
    await secondPage.fill('#tcNo', '10000000147');
    await secondPage.fill('#password', 'Test1234!');
    await secondPage.click('button[type="submit"]');
    await secondPage.waitForURL(/.*dashboard/);

    // Her iki sayfada da mesajlar sayfasına git
    await page.click('[data-testid="messages-nav"]');
    await secondPage.click('[data-testid="messages-nav"]');

    // İlk sayfada kullanıcı seç
    await page.click('[data-user-id="10000000147"]');

    // Mesaj gönder
    await page.fill('[data-testid="message-input"]', 'Test mesajı');
    await page.click('[data-testid="send-message-button"]');

    // İkinci sayfada mesajı okundu işaretle
    await secondPage.click('.message-item:last-child');

    // İlk sayfada okundu işaretini kontrol et
    await expect(page.locator('.message-item:last-child [data-testid="read-receipt"]'))
      .toBeVisible({ timeout: 5000 });

    await secondPage.close();
  });

  test('should display online users count', async ({ page }) => {
    // Mesajlar sayfasına git
    await page.click('[data-testid="messages-nav"]');

    // Online kullanıcı sayısını kontrol et
    await expect(page.locator('[data-testid="online-users-count"]')).toBeVisible();

    // Sayının en az 1 (kendi kendisi) olduğunu kontrol et
    const countText = await page.locator('[data-testid="online-users-count"]').textContent();
    const count = parseInt(countText);
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should handle reconnection', async ({ page }) => {
    // Mesajlar sayfasına git
    await page.click('[data-testid="messages-nav"]');

    // Bağlantı durumunu kontrol et
    await expect(page.locator('[data-testid="connection-status"][data-connected="true"]')).toBeVisible();

    // Network simülasyonu (tarayıcı offline mod)
    await page.context().setOffline(true);

    // Offline durumunu bekle
    await expect(page.locator('[data-testid="connection-status"][data-connected="false"]')).toBeVisible({ timeout: 5000 });

    // Network'i geri aç
    await page.context().setOffline(false);

    // Reconnection'ı bekle
    await expect(page.locator('[data-testid="connection-status"][data-connected="true"]')).toBeVisible({ timeout: 10000 });
  });
});
