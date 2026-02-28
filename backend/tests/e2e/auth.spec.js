// Authentication E2E Tests
import { test, expect } from '@playwright/test';

test.describe('Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to login page', async ({ page }) => {
    // Login butonuna tıkla
    await page.click('[data-testid="login-button"]');

    // URL'in değiştiğini kontrol et
    await expect(page).toHaveURL(/.*login/);

    // Login formunu kontrol et
    await expect(page.locator('form#loginForm')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('[data-testid="login-button"]');

    // Formu boş gönder
    await page.click('button[type="submit"]');

    // Hata mesajlarını kontrol et
    const errorMessages = await page.locator('.error-message').allTextContents();
    expect(errorMessages.length).toBeGreaterThan(0);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.click('[data-testid="login-button"]');

    // Formu doldur
    await page.fill('#tcNo', '10000000146');
    await page.fill('#password', 'Test1234!');

    // Submit et
    await page.click('button[type="submit"]');

    // Başarılı login'i kontrol et
    await expect(page).toHaveURL(/.*dashboard/);

    // Kullanıcı bilgilerini kontrol et
    await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.click('[data-testid="login-button"]');

    // Yanlış bilgilerle dene
    await page.fill('#tcNo', '00000000000');
    await page.fill('#password', 'WrongPassword123!');

    await page.click('button[type="submit"]');

    // Hata mesajını kontrol et
    await expect(page.locator('.toast-error')).toBeVisible();
    await expect(page.locator('.toast-error')).toContainText('hatalı');
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    await page.click('[data-testid="register-link"]');

    await expect(page).toHaveURL(/.*register/);
  });

  test('should register new user successfully', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    await page.click('[data-testid="register-link"]');

    // Kayıt formunu doldur
    const randomTC = Math.floor(Math.random() * 90000000000) + 10000000000;
    await page.fill('#tcNo', randomTC.toString());
    await page.fill('#password', 'Test1234!');
    await page.fill('#confirmPassword', 'Test1234!');
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'User');
    await page.fill('#email', `test${randomTC}@example.com`);
    await page.fill('#phone', '05551234567');

    // Submit et
    await page.click('button[type="submit"]');

    // Başarılı kaydı kontrol et
    await expect(page.locator('.toast-success')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    await page.click('[data-testid="register-link"]');

    // Zayıf şifre dene
    await page.fill('#password', '123456');
    await page.fill('#confirmPassword', '123456');

    // Password strength indicator'ını kontrol et
    const strengthIndicator = page.locator('.password-strength');
    await expect(strengthIndicator).toContainText('Zayıf');
  });

  test('should logout successfully', async ({ page }) => {
    // Önce login ol
    await page.click('[data-testid="login-button"]');
    await page.fill('#tcNo', '10000000146');
    await page.fill('#password', 'Test1234!');
    await page.click('button[type="submit"]');

    // Dashboard'a git
    await expect(page).toHaveURL(/.*dashboard/);

    // Logout yap
    await page.click('[data-testid="logout-button"]');

    // Login sayfasına dönüldüğünü kontrol et
    await expect(page).toHaveURL(/.*login/);
  });

  test('should request password reset', async ({ page }) => {
    await page.click('[data-testid="login-button"]');
    await page.click('[data-testid="forgot-password-link"]');

    // Email gir
    await page.fill('#email', 'test@example.com');
    await page.click('button[type="submit"]');

    // Success mesajını kontrol et
    await expect(page.locator('.toast-success')).toBeVisible();
  });
});
