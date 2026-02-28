// File Upload E2E Tests
import { test, expect } from '@playwright/test';

test.describe('File Upload Tests', () => {
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

  test('should navigate to profile page', async ({ page }) => {
    await page.click('[data-testid="profile-nav"]');

    // Profil sayfasını kontrol et
    await expect(page).toHaveURL(/.*profile/);
    await expect(page.locator('[data-testid="profile-form"]')).toBeVisible();
  });

  test('should upload profile picture', async ({ page }) => {
    await page.click('[data-testid="profile-nav"]');

    // Dosya yükleme input'unu bul
    const fileInput = page.locator('input[type="file"][data-testid="profile-picture-input"]');

    // Test dosyası oluştur ve yükle
    const filePath = 'tests/fixtures/test-profile.jpg';
    await fileInput.setInputFiles(filePath);

    // Yükleme butonuna tıkla
    await page.click('[data-testid="upload-profile-button"]');

    // Success mesajını kontrol et
    await expect(page.locator('.toast-success')).toBeVisible();
    await expect(page.locator('.toast-success')).toContainText('profil resmi');
  });

  test('should validate file type', async ({ page }) => {
    await page.click('[data-testid="profile-nav"]');

    // Yanlış dosya türü yükle (.txt)
    const fileInput = page.locator('input[type="file"][data-testid="profile-picture-input"]');

    const filePath = 'tests/fixtures/test-file.txt';
    await fileInput.setInputFiles(filePath);

    await page.click('[data-testid="upload-profile-button"]');

    // Hata mesajını kontrol et
    await expect(page.locator('.error-message')).toContainText('dosya türü');
  });

  test('should validate file size', async ({ page }) => {
    await page.click('[data-testid="profile-nav"]');

    // Büyük dosya yükle (> 5MB)
    const fileInput = page.locator('input[type="file"][data-testid="profile-picture-input"]');

    // Mock büyük dosya
    const largeFilePath = 'tests/fixtures/large-file.jpg';
    await fileInput.setInputFiles(largeFilePath);

    await page.click('[data-testid="upload-profile-button"]');

    // Hata mesajını kontrol et
    await expect(page.locator('.error-message')).toContainText('boyutu');
  });

  test('should display upload progress', async ({ page }) => {
    await page.click('[data-testid="profile-nav"]');

    const fileInput = page.locator('input[type="file"][data-testid="profile-picture-input"]');

    const filePath = 'tests/fixtures/test-profile.jpg';
    await fileInput.setInputFiles(filePath);

    await page.click('[data-testid="upload-profile-button"]');

    // Progress bar'ını kontrol et
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();

    // Yükleme tamamlandığında progress bar'ın kaybolmasını bekle
    await page.waitForSelector('[data-testid="upload-progress"]', { state: 'hidden' });
  });

  test('should replace existing profile picture', async ({ page }) => {
    await page.click('[data-testid="profile-nav"]');

    // Mevcut profil resmini kontrol et
    const currentProfilePic = page.locator('[data-testid="current-profile-picture"]');
    const hasExistingProfile = await currentProfilePic.isVisible();

    // Yeni profil resmi yükle
    const fileInput = page.locator('input[type="file"][data-testid="profile-picture-input"]');

    const filePath = 'tests/fixtures/test-profile-new.jpg';
    await fileInput.setInputFiles(filePath);

    await page.click('[data-testid="upload-profile-button"]');

    // Onay dialog'ında onayla
    await page.click('.confirm-dialog button[type="button"]:last-child');

    // Success mesajını kontrol et
    await expect(page.locator('.toast-success')).toContainText(' Profil resmi güncellendi');
  });

  test('should delete profile picture', async ({ page }) => {
    await page.click('[data-testid="profile-nav"]');

    // Profil resmini sil butonuna tıkla
    await page.click('[data-testid="delete-profile-button"]');

    // Onay dialog'ında onayla
    await page.click('.confirm-dialog button[type="button"]:last-child');

    // Success mesajını kontrol et
    await expect(page.locator('.toast-success')).toContainText('silindi');

    // Varsayılan profil resminin göründüğünü kontrol et
    await expect(page.locator('[data-testid="default-profile-picture"]')).toBeVisible();
  });

  test('should upload medical document', async ({ page }) => {
    await page.click('[data-testid="documents-nav"]');

    // Dosya yükleme alanına git
    await page.click('[data-testid="upload-document-button"]');

    // Kategori seç
    await page.selectOption('[data-testid="document-category"]', 'MEDICAL_RECORD');

    // Dosya seç
    const fileInput = page.locator('input[type="file"]');
    const filePath = 'tests/fixtures/test-document.pdf';
    await fileInput.setInputFiles(filePath);

    // Yükle
    await page.click('[data-testid="confirm-upload-button"]');

    // Success mesajını kontrol et
    await expect(page.locator('.toast-success')).toContainText('dosya yüklendi');
  });

  test('should display uploaded files list', async ({ page }) => {
    await page.click('[data-testid="documents-nav"]');

    // Dosya listesini kontrol et
    await expect(page.locator('[data-testid="files-list"]')).toBeVisible();

    // Dosya kartlarını kontrol et
    const fileCards = await page.locator('.file-card').all();
    expect(fileCards.length).toBeGreaterThanOrEqual(0);
  });

  test('should download uploaded file', async ({ page }) => {
    await page.click('[data-testid="documents-nav"]');

    // İlk dosyayı bul
    const firstFile = page.locator('.file-card:first-child');

    if (await firstFile.isVisible()) {
      // Download event'ini dinle
      const downloadPromise = page.waitForEvent('download');

      // Download butonuna tıkla
      await firstFile.locator('[data-testid="download-file-button"]').click();

      // Download'ı bekle
      const download = await downloadPromise;
      expect(download).toBeDefined();
    }
  });

  test('should delete uploaded file', async ({ page }) => {
    await page.click('[data-testid="documents-nav"]');

    // İlk dosyayı bul
    const firstFile = page.locator('.file-card:first-child');

    if (await firstFile.isVisible()) {
      // Delete butonuna tıkla
      await firstFile.locator('[data-testid="delete-file-button"]').click();

      // Onay dialog'ında onayla
      await page.click('.confirm-dialog button[type="button"]:last-child');

      // Success mesajını kontrol et
      await expect(page.locator('.toast-success')).toContainText('silindi');
    }
  });

  test('should preview image file', async ({ page }) => {
    await page.click('[data-testid="documents-nav"]');

    // Resim dosyası bul
    const imageFile = page.locator('.file-card[data-file-type="image"]:first-child');

    if (await imageFile.isVisible()) {
      // Preview butonuna tıkla
      await imageFile.locator('[data-testid="preview-file-button"]').click();

      // Preview modal'ını kontrol et
      await expect(page.locator('[data-testid="file-preview-modal"]')).toBeVisible();
      await expect(page.locator('[data-testid="preview-image"]')).toBeVisible();
    }
  });
});
