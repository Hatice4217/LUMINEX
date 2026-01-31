import { validatePassword } from './utils/validation-utils.js';
import { hashString } from './utils/crypto-utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const resetStatusDiv = document.getElementById('resetStatus');
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');

    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', function () {
            const input = this.previousElementSibling;
            const iconElement = this.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                iconElement.classList.remove('fa-eye');
                iconElement.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                iconElement.classList.remove('fa-eye-slash');
                iconElement.classList.add('fa-eye');
            }
        });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    let userTcFromToken = null; // Token'dan gelen kullanıcının TC'sini tutacak

    // --- Token Doğrulama ---
    if (!token) {
        resetStatusDiv.innerHTML = `<div class="alert alert-danger">${window.getTranslation('invalidOrMissingResetToken')}</div>`;
        resetPasswordForm.style.display = 'none';
        return;
    }

    let tokenData = null;
    try {
        const storedTokenData = sessionStorage.getItem(token);
        if (storedTokenData) {
            tokenData = JSON.parse(storedTokenData);
        }
    } catch (e) {
        console.error("sessionStorage'dan token verisi ayrıştırma hatası:", e);
    }

    if (!tokenData || !tokenData.tc || !tokenData.expiry || Date.now() >= tokenData.expiry) {
        resetStatusDiv.innerHTML = `<div class="alert alert-danger">${window.getTranslation('invalidOrExpiredToken')}</div>`;
        resetPasswordForm.style.display = 'none';
        // Geçersiz/süresi dolmuş token'ı sessionStorage'dan temizle
        if (token) sessionStorage.removeItem(token);
        // Akışı yeniden başlatmak için forgot password sayfasına yönlendir
        setTimeout(() => {
            window.location.href = 'forgot-password.html';
        }, 3000);
        return;
    }

    userTcFromToken = tokenData.tc; // Geçerli token bulundu, kullanıcının TC'sini al

    // --- Token Doğrulama Sonu ---

    resetPasswordForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        clearErrors();
        resetStatusDiv.innerHTML = '';

        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        let isValid = true;

        if (!newPassword) {
            showError(newPasswordInput, window.getTranslation('enterNewPassword'));
            isValid = false;
        } else if (!validatePassword(newPassword)) { // Yeni şifre karmaşıklığını doğrula
            showError(newPasswordInput, window.getTranslation('passwordInvalid'));
            isValid = false;
        }

        if (!confirmPassword) {
            showError(confirmPasswordInput, window.getTranslation('confirmNewPassword'));
            isValid = false;
        }

        if (newPassword !== confirmPassword) {
            showError(confirmPasswordInput, window.getTranslation('passwordsDoNotMatch'));
            isValid = false;
        }
        
        if (!isValid) {
            return;
        }

        const users = JSON.parse(localStorage.getItem('luminexUsers')) || [];
        // Token'dan gelen doğrulanmış TC'yi kullanarak kullanıcıyı bul
        const userIndex = users.findIndex(u => (u.tc || u.tcKimlik) === userTcFromToken); 

        if (userIndex > -1) {
            const hashedPassword = await hashString(newPassword);
            users[userIndex].password = hashedPassword;
            localStorage.setItem('luminexUsers', JSON.stringify(users));

            // Modern Inline Success Message (Matching Forgot Password Style)
            // Use CSS variables or high-contrast colors for dark mode compatibility
            const textColor = document.body.classList.contains('theme-dark') ? '#4ade80' : '#28a745'; // Brighter green for dark mode
            const subTextColor = document.body.classList.contains('theme-dark') ? '#cbd5e1' : '#666'; // Light gray for dark mode

            resetStatusDiv.innerHTML = `
                <div style="text-align: center; margin-top: 15px; color: ${textColor}; font-size: 1.1rem; font-weight: 600; animation: fadeIn 0.5s;">
                    <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
                    ${window.getTranslation('passwordUpdateSuccess')}
                    <br>
                    <span style="font-size: 0.9rem; color: ${subTextColor}; margin-top: 5px; display: inline-block;">
                        <i class="fas fa-spinner fa-spin" style="margin-right: 5px;"></i> ${window.getTranslation('redirecting') || 'Yönlendiriliyorsunuz...'}
                    </span>
                </div>
            `;

            // Kullanılan token'ı temizle
            sessionStorage.removeItem(token);

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);

        } else {
            // Token doğrulaması geçmiş olsa bile bu durum oluşmamalı ama bir fallback olarak
            resetStatusDiv.innerHTML = `<div class="alert alert-danger">${window.getTranslation('invalidOrExpiredToken')}</div>`;
            // Kullanıcı bulunamazsa veya manipüle edilmişse, akışı baştan başlatmak için forgot password sayfasına yönlendir
            setTimeout(() => {
                window.location.href = 'forgot-password.html';
            }, 3000);
        }
    });

    function showError(inputElement, message) {
        const formGroup = inputElement.closest('.form-group');
        if (!formGroup) return;

        // Mevcut hata mesajını güncellemek için kaldır
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Animasyonu yeniden tetiklemek için sınıfı kaldır ve yeniden ekle
        formGroup.classList.remove('error');
        void formGroup.offsetWidth; // Tarayıcıyı yeniden boyamaya zorla
        formGroup.classList.add('error');
        
        // Yeni mesajı oluştur ve ekle
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        formGroup.appendChild(errorElement);
    }

    function clearErrors() {
        document.querySelectorAll('.form-group.error').forEach(formGroup => {
            formGroup.classList.remove('error');
            const errorMessage = formGroup.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        });
        document.querySelectorAll('.error-message').forEach(error => {
            error.remove();
        });
    }
});