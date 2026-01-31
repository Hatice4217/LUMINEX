import { generateUUID } from './utils/uuid-utils.js'; // ES modül sintaksına uygun olarak en üste taşındı.

document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const forgotPasswordTcInput = document.getElementById('forgotPasswordTc');
    const forgotPasswordFirstNameInput = document.getElementById('forgotPasswordFirstName'); // Yazım hatası düzeltildi
    const forgotPasswordLastNameInput = document.getElementById('forgotPasswordLastName');
    const forgotPasswordEmailInput = document.getElementById('forgotPasswordEmail');
    const resetResultDiv = document.getElementById('resetResult');

    const forgotPasswordFormSection = document.getElementById('forgotPasswordFormSection');
    const verificationCodeSection = document.getElementById('verificationCodeSection');
    const verificationCodeInput = document.getElementById('verificationCode');
    const verifyCodeBtn = document.getElementById('verifyCodeBtn');
    const codeSentMessageElement = verificationCodeSection.querySelector('p[data-lang="codeSentMessage"]');

    let verifiedUserTc = null; // Doğrulanan TC'yi geçici olarak saklamak için

    if (forgotPasswordTcInput) {
        forgotPasswordTcInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/\D/g, '').substring(0, 11);
        });
    }

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

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    function validateTcKimlik(tc) {
        return /^[1-9]{1}[0-9]{10}$/.test(String(tc));
    }

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', function(event) {
            event.preventDefault();
            clearErrors();
            if(resetResultDiv) resetResultDiv.innerHTML = '';

            const tc = forgotPasswordTcInput.value.trim();
            const firstName = forgotPasswordFirstNameInput.value.trim();
            const lastName = forgotPasswordLastNameInput.value.trim();
            const email = forgotPasswordEmailInput.value.trim();

            let isValid = true;
            if (!validateTcKimlik(tc)) {
                showError(forgotPasswordTcInput, window.getTranslation('forgotTcInvalid'));
                isValid = false;
            }
            if (!firstName) {
                showError(forgotPasswordFirstNameInput, window.getTranslation('forgotFirstNameRequired'));
                isValid = false;
            }
            if (!lastName) {
                showError(forgotPasswordLastNameInput, window.getTranslation('forgotLastNameRequired'));
                isValid = false;
            }
            if (!validateEmail(email)) {
                showError(forgotPasswordEmailInput, window.getTranslation('forgotEmailInvalid'));
                isValid = false;
            }

            if (!isValid) {
                return;
            }

            // Loading state
            if(resetResultDiv) {
                resetResultDiv.innerHTML = `
                    <div style="margin-top: 15px; text-align: center; font-weight: 500; color: #001F6B;">
                        <i class="fas fa-spinner fa-spin"></i> ${window.getTranslation('checkingInfo')}
                    </div>`;
            }

            setTimeout(() => {
                const users = JSON.parse(localStorage.getItem('luminexUsers')) || [];
                const fullNameInput = `${firstName} ${lastName}`;

                const user = users.find(u => {
                    const uTc = u.tc || u.tcKimlik;
                    const uName = u.name || u.fullName;
                    const uEmail = u.email;

                    if (!uTc || !uName || !uEmail) return false;

                    return uTc === tc &&
                        uName.toLocaleLowerCase('tr-TR') === fullNameInput.toLocaleLowerCase('tr-TR') &&
                        uEmail.toLocaleLowerCase('tr-TR') === email.toLocaleLowerCase('tr-TR');
                });

                if (user) {
                    // Generate a UUID for the reset token
                    const resetToken = generateUUID();
                    const expiryTime = Date.now() + (10 * 60 * 1000); // Token 10 dakika geçerli olacak

                    // Token verilerini sessionStorage'a kaydet (anahtar UUID'nin kendisi)
                    sessionStorage.setItem(resetToken, JSON.stringify({ tc: user.tc || user.tcKimlik, expiry: expiryTime }));

                    if(resetResultDiv) {
                        resetResultDiv.innerHTML = `
                            <div style="margin-top: 15px; text-align: center; font-weight: 600; color: #001F6B;">
                                <i class="fas fa-check"></i> ${window.getTranslation('infoVerifiedRedirecting')}
                            </div>`;
                    }
                    setTimeout(() => {
                        // İlk formu gizle ve doğrulama kodu bölümünü göster
                        forgotPasswordFormSection.style.display = 'none';
                        verificationCodeSection.style.display = 'block';
                        // Doğrulama bölümündeki mesajı güncelle
                        if(codeSentMessageElement) {
                            codeSentMessageElement.textContent = window.getTranslation('codeSentMessage');
                        }
                        // Önceki durum mesajını temizle
                        if(resetResultDiv) resetResultDiv.innerHTML = '';

                        // Doğrulama adımı için oluşturulan token'ı geçici olarak sakla
                        sessionStorage.setItem('pendingResetToken', resetToken); 

                    }, 1500); // Kullanıcıya doğrulama mesajını okuması için zaman tanı
                } else {
                    if(resetResultDiv) {
                        resetResultDiv.innerHTML = `
                            <div style="margin-top: 15px; text-align: center; font-weight: 500; color: #dc3545;">
                                <i class="fas fa-times"></i> ${window.getTranslation('userNotFoundForgot')}
                            </div>`;
                    }
                }
            }, 1500);
        });
    }

    if (verifyCodeBtn) {
        verifyCodeBtn.addEventListener('click', function() {
            clearErrors();
            const enteredCode = verificationCodeInput.value.trim();
            const SIMULATED_CODE = '123456'; // Simüle edilmiş doğrulama kodu

            if (enteredCode === SIMULATED_CODE) {
                // Gerçek oluşturulan token'ı al
                const resetToken = sessionStorage.getItem('pendingResetToken');
                let tokenData = null;

                if (resetToken) {
                    try {
                        tokenData = JSON.parse(sessionStorage.getItem(resetToken));
                    } catch (e) {
                        console.error("sessionStorage'dan token verisi ayrıştırma hatası:", e);
                    }
                }
                
                if (tokenData && tokenData.tc && tokenData.expiry && Date.now() < tokenData.expiry) {
                    if(resetResultDiv) {
                        resetResultDiv.innerHTML = `
                            <div style="margin-top: 15px; text-align: center; font-weight: 600; color: #001F6B;">
                                <i class="fas fa-check"></i> ${window.getTranslation('infoVerifiedRedirecting')}
                            </div>`;
                    }
                    setTimeout(() => {
                        sessionStorage.removeItem('pendingResetToken'); // Bekleyen token'ı temizle
                        // Asıl resetToken'ı buradan henüz kaldırma, reset-password.html'de lazım olacak
                        window.location.href = `reset-password.html?token=${resetToken}`;
                    }, 1500);
                } else {
                    // Token süresi dolmuş veya geçersiz
                    showError(verificationCodeInput, window.getTranslation('invalidCode'));
                    setTimeout(() => {
                        // Token geçersiz/süresi dolmuşsa temizle ve akışı baştan başlat
                        sessionStorage.removeItem('forgotPasswordVerifiedTc');
                        sessionStorage.removeItem('pendingResetToken');
                        if (resetToken) sessionStorage.removeItem(resetToken); // Geçersiz asıl token'ı kaldır
                        window.location.href = 'forgot-password.html';
                    }, 2000);
                }
            } else {
                showError(verificationCodeInput, window.getTranslation('invalidCode'));
            }
        });
    }
});