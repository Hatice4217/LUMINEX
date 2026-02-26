import {
    getLocalStorageItem,
    setLocalStorageItem,
    removeLocalStorageItem,
    getLuminexUsers,
    setLuminexUsers,
    setLoggedInUser,
    removeLoggedInUser,
    initAllDummyData
} from './utils/storage-utils.js';
import { hashString, encryptData, decryptData, APP_SECRET } from './utils/crypto-utils.js';
import { validateAge } from './utils/validation-utils.js';
import logger from './utils/logger.js';

// ============================================
// TOAST BİLDİRİM FONKSİYONU
// ============================================
window.showToast = function(type, title, message, duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
        success: '✓',
        error: '⚠',
        warning: '⚡'
    };

    toast.innerHTML = `
        <div class="toast-icon">${iconMap[type] || 'ℹ'}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>
    `;

    container.appendChild(toast);

    // Otomatik scroll yap (eğer form görünümrdeyse)
    const authCard = document.querySelector('.auth-card');
    const loginForm = document.getElementById('loginForm');
    if (authCard && (type === 'error' || type === 'warning')) {
        authCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Belirli süre sonra kaldır
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
};

// SweetAlert Global Defaults - Fix Transparent Backdrop Issue
if (typeof Swal !== 'undefined') {
    Swal.mixin({
        showClass: {
            popup: 'swal2-show',
            backdrop: 'swal2-backdrop-show',
            icon: 'swal2-icon-show'
        },
        hideClass: {
            popup: 'swal2-hide',
            backdrop: 'swal2-backdrop-hide',
            icon: 'swal2-icon-hide'
        },
        customClass: {
            container: 'swal2-container-luminex'
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {

    // --- NEW: Scroll Position Restoration Logic ---
    // Check if a scroll position is saved
    const scrollPosition = sessionStorage.getItem('scrollPosition');
    if (scrollPosition) {
        // Use a small timeout to ensure the page has rendered and layout is stable
        setTimeout(() => {
            window.scrollTo(0, parseInt(scrollPosition, 10));
            // Clear the saved position so it doesn't affect subsequent visits
            sessionStorage.removeItem('scrollPosition');
        }, 100);
    }

    // Find all links that might navigate away and should save scroll position
    const linksToSaveScroll = document.querySelectorAll('a[href^="payment.html"], a[href^="login.html"], a[href^="register.html"], a[href^="kvkk.html"]');
    linksToSaveScroll.forEach(link => {
        link.addEventListener('click', (e) => {
            // Skip if target="_blank"
            if (link.getAttribute('target') === '_blank') return;
            // Save the current scroll position before navigating
            sessionStorage.setItem('scrollPosition', window.scrollY);
        });
    });
    // --- END of Scroll Logic ---

    // --- HAMBURGER MENU LOGIC ---
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const navMenu = document.getElementById('navMenu');
    const navRightActions = document.getElementById('navRightActions');
    const navOverlay = document.getElementById('navOverlay');

    // Sadece menü elementleri varsa çalıştır
    if (navMenu && hamburgerBtn) {
        // Toggle mobile menu
        function toggleMobileMenu() {
            hamburgerBtn.classList.toggle('active');
            navMenu.classList.toggle('active');
            if (navRightActions) navRightActions.classList.toggle('active');
            if (navOverlay) navOverlay.classList.toggle('active');

            // Prevent body scroll when menu is open
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        }

        // Close mobile menu
        function closeMobileMenu() {
            hamburgerBtn.classList.remove('active');
            navMenu.classList.remove('active');
            if (navRightActions) navRightActions.classList.remove('active');
            if (navOverlay) navOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Hamburger button click
        hamburgerBtn.addEventListener('click', toggleMobileMenu);

        // Overlay click to close
        if (navOverlay) {
            navOverlay.addEventListener('click', closeMobileMenu);
        }

        // Close menu when clicking on nav links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) {
                    closeMobileMenu();
                }
            });
        });

        // Close menu on window resize if screen becomes larger
        window.addEventListener('resize', () => {
            if (window.innerWidth > 992 && navMenu.classList.contains('active')) {
                closeMobileMenu();
            }
        });

        // OPTIMIZATION: Close menu with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                closeMobileMenu();
            }
        });
    }
    // --- END of Hamburger Menu Logic ---

    const loginForm = document.getElementById('loginForm');
    const tcKimlikInput = document.getElementById('tcLogin');
    const passwordLoginInput = document.getElementById('passwordLogin');
    const togglePassword = document.querySelector('.toggle-password');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    // Load remembered TC Kimlik on page load (DECRYPTED for security)
    if (tcKimlikInput && rememberMeCheckbox) {
        const rememberedTcKimlikEncrypted = getLocalStorageItem('rememberedTcKimlik');
        if (rememberedTcKimlikEncrypted) {
            // Decrypt the stored TC Kimlik
            decryptData(rememberedTcKimlikEncrypted, APP_SECRET).then(decrypted => {
                if (decrypted) {
                    tcKimlikInput.value = decrypted;
                    rememberMeCheckbox.checked = true;
                }
            });
        }
    }

    // Toggle password visibility
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordLoginInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordLoginInput.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    }

    // Handle Forgot Password link
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(event) {
            event.preventDefault();
            window.location.href = 'forgot-password.html';
        });
    }

    // Helper function to show error messages and re-trigger animations
    function showError(inputElement, message) {
        // Checkbox için özel durum - parent kvkk-check class'ını bul
        let formGroup;
        if (inputElement.type === 'checkbox') {
            formGroup = inputElement.closest('.kvkk-check');
        } else {
            formGroup = inputElement.closest('.form-group');
        }

        if (!formGroup) return;

        let errorElement = formGroup.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }
        errorElement.textContent = message;

        // Force re-trigger animation by removing and re-adding the class
        formGroup.classList.remove('error');
        void formGroup.offsetWidth; // This forces the browser to repaint
        formGroup.classList.add('error');
    }

    // Helper function to clear all error messages
    function clearErrors() {
        document.querySelectorAll('.form-group.error').forEach(formGroup => {
            formGroup.classList.remove('error');
            const errorMessage = formGroup.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        });
    }

    // --- Theme Logic (Unified) ---
    const themeToggleButton = document.getElementById('landingThemeToggle');
    const savedTheme = localStorage.getItem('landingTheme') || 'light';
    const isLandingPage = !!document.querySelector('.hero'); // Unique element on the landing page

    const applyTheme = (theme) => {
        const icon = themeToggleButton ? themeToggleButton.querySelector('i') : null;

        // Apply class based on page type
        document.body.classList.toggle('theme-light', theme === 'light');
        document.body.classList.toggle('theme-dark', theme === 'dark');

        // Update icon universally
        if (icon) {
            if (theme === 'dark') {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }

        // Note: Logo is handled by CSS (landing.css:298-305) using mask/filter
    };

    // Apply saved theme on initial load
    applyTheme(savedTheme);

    // Add a single, universal click listener
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            const isCurrentlyDark = document.body.classList.contains('theme-dark');
            
            const newTheme = isCurrentlyDark ? 'light' : 'dark';
            
            localStorage.setItem('landingTheme', newTheme);
            applyTheme(newTheme);

            // Optional: visual feedback
            const icon = themeToggleButton.querySelector('i');
            if (icon) {
                icon.style.transition = 'transform 0.5s ease';
                icon.style.transform = 'rotate(360deg)';
                setTimeout(() => {
                    icon.style.transform = 'rotate(0deg)';
                }, 500);
            }
        });
    }

    if (loginForm) {
        const MAX_ATTEMPTS = 3;
        const LOCKOUT_DURATION = 30 * 1000; // 30 seconds
        const submitButton = loginForm.querySelector('button[type="submit"]');
        let lockoutInterval;

        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            clearErrors();

            const tc = tcKimlikInput.value.trim();
            const password = passwordLoginInput.value.trim();

            // Check if account is locked
            const lockoutTime = sessionStorage.getItem(`lockout_${tc}`);
            if (lockoutTime && Date.now() < parseInt(lockoutTime)) {
                submitButton.disabled = true;

                const updateTimer = () => {
                    const remainingMs = parseInt(lockoutTime) - Date.now();
                    if (remainingMs <= 0) {
                        clearInterval(lockoutInterval);
                        clearErrors();
                        submitButton.disabled = false;
                    } else {
                        const remainingSeconds = Math.ceil(remainingMs / 1000);
                        const message = window.getTranslation('tooManyAttempts').replace('{seconds}', remainingSeconds);
                        showError(tcKimlikInput, message);
                    }
                };

                updateTimer();
                lockoutInterval = setInterval(updateTimer, 1000);
                return;
            }

            if (rememberMeCheckbox && tcKimlikInput) {
                if (rememberMeCheckbox.checked) {
                    setLocalStorageItem('rememberedTcKimlik', tc);
                } else {
                    removeLocalStorageItem('rememberedTcKimlik');
                }
            }

            if (!tc || !password) {
                if (!tc) showError(tcKimlikInput, window.getTranslation('tcRequired'));
                if (!password) showError(passwordLoginInput, window.getTranslation('passwordRequired'));
                return;
            }

            // TC Kimlik validasyonu
            const tcDigits = tc.replace(/\D/g, '');
            if (tcDigits.length !== 11) {
                showError(tcKimlikInput, 'TC Kimlik numarası 11 haneli olmalıdır');
                return;
            }

            // Show loading
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + (window.getTranslation?.('loading') || 'Yükleniyor...');

            try {
                // Backend API'ye login isteği
                const apiBaseUrl = window.getApiBaseUrl ? window.getApiBaseUrl() : 'http://localhost:3000/api';
                const response = await fetch(`${apiBaseUrl}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ tcNo: tc, password })
                });

                const result = await response.json();

                if (result.success && result.data) {
                    // Giriş başarılı
                    const user = result.data.user;
                    const token = result.data.token;

                    // Token'ı sakla
                    setLocalStorageItem('authToken', token);
                    setLocalStorageItem('loggedInUser', JSON.stringify(user));

                    // Giriş başarılı - temizlik
                    sessionStorage.removeItem(`attempts_${tc}`);
                    sessionStorage.removeItem(`lockout_${tc}`);

                    logger.info('User login successful', { userId: user.id, role: user.role });

                    // Rol bazlı yönlendirme
                    const userRole = user.role.toLowerCase();

                    // Check for redirect parameter
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirectPage = urlParams.get('redirect');
                    const deptParam = urlParams.get('dep');
                    const branchParam = urlParams.get('branch');

                    // Yönlendirilecek sayfayı belirle
                    let targetPage;
                    if (redirectPage) {
                        targetPage = redirectPage;
                    } else if (deptParam) {
                        targetPage = `appointment.html?dep=${encodeURIComponent(deptParam)}`;
                        if (branchParam) targetPage += `&branch=${branchParam}`;
                    } else if (userRole === 'admin') {
                        targetPage = 'admin-dashboard.html';
                    } else if (userRole === 'doctor') {
                        targetPage = 'doctor-dashboard.html';
                    } else {
                        targetPage = 'dashboard.html';
                    }

                    // Toast bildirimi göster
                    showToast('success', 'Giriş Başarılı', 'Kimlik doğrulama başarılı. Sisteme aktarılıyorsunuz...');

                    // 2.5 saniye sonra yönlendir
                    setTimeout(() => {
                        window.location.replace(targetPage);
                    }, 2500);
                } else {
                    // Login başarısız
                    let attempts = parseInt(sessionStorage.getItem(`attempts_${tc}`) || '0') + 1;

                    if (attempts >= MAX_ATTEMPTS) {
                        const lockoutUntil = Date.now() + LOCKOUT_DURATION;
                        sessionStorage.setItem(`lockout_${tc}`, lockoutUntil);
                        sessionStorage.removeItem(`attempts_${tc}`);
                        submitButton.disabled = false;
                        submitButton.innerHTML = window.getTranslation?.('login') || 'Giriş Yap';
                        loginForm.requestSubmit();
                        return;
                    }

                    sessionStorage.setItem(`attempts_${tc}`, attempts);
                    const remainingAttemptsMsg = window.getTranslation('attemptsRemaining')?.replace('{attempts}', MAX_ATTEMPTS - attempts) || `${MAX_ATTEMPTS - attempts} deneme hakkınız kaldı`;
                    showError(passwordLoginInput, `${window.getTranslation('passwordIncorrect') || 'Hatalı şifre'} ${remainingAttemptsMsg}`);

                    // Toast bildirimi göster
                    showToast('error', 'Giriş Hatası', `${window.getTranslation('passwordIncorrect') || 'Hatalı şifre'} ${remainingAttemptsMsg}`, 4000);

                    submitButton.disabled = false;
                    submitButton.innerHTML = window.getTranslation?.('login') || 'Giriş Yap';
                }
            } catch (error) {
                // API hatası - localStorage ile fallback
                console.error('Backend API error, falling back to localStorage:', error);

                // localStorage kontrolü
                const registeredUsers = getLuminexUsers();
                const userIndex = registeredUsers.findIndex(u => (u.tc || u.tcKimlik) === tc);

                if (userIndex === -1) {
                    showError(tcKimlikInput, '❌ Kayıtlı değilsiniz. Lütfen önce kayıt olun.');
                    showToast('error', 'Kayıt Bulunamadı', 'Bu TC Kimlik Numarası ile kayıtlı kullanıcı bulunamadı. Lütfen önce kayıt olun.', 4000);
                    submitButton.disabled = false;
                    submitButton.innerHTML = window.getTranslation?.('login') || 'Giriş Yap';
                    return;
                }

                const user = registeredUsers[userIndex];
                const hashedPassword = await hashString(password);
                let passwordMatch = false;

                if (hashedPassword === user.password) {
                    passwordMatch = true;
                } else if (password === user.password) {
                    passwordMatch = true;
                    registeredUsers[userIndex].password = hashedPassword;
                    setLuminexUsers(registeredUsers);
                }

                if (!passwordMatch) {
                    let attempts = parseInt(sessionStorage.getItem(`attempts_${tc}`) || '0') + 1;

                    if (attempts >= MAX_ATTEMPTS) {
                        const lockoutUntil = Date.now() + LOCKOUT_DURATION;
                        sessionStorage.setItem(`lockout_${tc}`, lockoutUntil);
                        sessionStorage.removeItem(`attempts_${tc}`);
                        submitButton.disabled = false;
                        submitButton.innerHTML = window.getTranslation?.('login') || 'Giriş Yap';
                        loginForm.requestSubmit();
                        return;
                    }

                    sessionStorage.setItem(`attempts_${tc}`, attempts);
                    const remainingAttemptsMsg = window.getTranslation('attemptsRemaining')?.replace('{attempts}', MAX_ATTEMPTS - attempts);
                    showError(passwordLoginInput, `${window.getTranslation('passwordIncorrect')} ${remainingAttemptsMsg}`);
                    submitButton.disabled = false;
                    submitButton.innerHTML = window.getTranslation?.('login') || 'Giriş Yap';
                    return;
                }

                // Giriş başarılı (localStorage fallback)
                sessionStorage.removeItem(`attempts_${tc}`);
                sessionStorage.removeItem(`lockout_${tc}`);
                setLoggedInUser(user);
                logger.info('User login successful (localStorage fallback)', { userId: user.id, role: user.role });

                const userRole = user.role || 'patient';
                if (userRole === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else if (userRole === 'doctor') {
                    window.location.href = 'doctor-dashboard.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }
        });
    }

    // --- NEW: Contact Form Submission Logic ---
    const contactForm = document.getElementById('contactForm');
    const indexFormWarning = document.getElementById('indexFormWarning'); // Get reference to the warning div

    if (contactForm) {
        // Helper to show in-page warning
        function showIndexFormWarning(titleKey, messageKey) {
            if (indexFormWarning) {
                indexFormWarning.querySelector('h4[data-lang="warningTitle"]').textContent = window.getTranslation(titleKey);
                indexFormWarning.querySelector('p[data-lang="fillAllFields"]').textContent = window.getTranslation(messageKey);
                indexFormWarning.style.display = 'flex';
            }
        }

        // Helper to hide in-page warning
        function hideIndexFormWarning() {
            if (indexFormWarning) {
                indexFormWarning.style.display = 'none';
            }
        }

        contactForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            hideIndexFormWarning(); // Always hide previous warnings on new submission attempt

            const contactName = document.getElementById('contactName');
            const contactPosition = document.getElementById('contactPosition');
            const contactPhone = document.getElementById('contactPhone');
            const contactEmail = document.getElementById('contactEmail');
            const companyName = document.getElementById('companyName');
            const branchCount = document.getElementById('branchCount');
            const dailyPatients = document.getElementById('dailyPatients');
            const requestType = document.getElementById('requestType');
            const contactMessage = document.getElementById('contactMessage');
            const submitButton = contactForm.querySelector('button[type="submit"]');

            // Önce tüm hataları temizle
            clearErrors();

            // Hataları topla
            const errors = [];

            // İsim kontrolü
            if (!contactName.value.trim()) {
                errors.push({ input: contactName, message: 'Lütfen adınızı ve soyadınızı giriniz.' });
            }

            // Pozisyon kontrolü
            if (!contactPosition.value.trim()) {
                errors.push({ input: contactPosition, message: 'Lütfen pozisyonunuzu seçiniz.' });
            }

            // Telefon kontrolü
            if (!contactPhone.value.trim() || contactPhone.value === '0') {
                errors.push({ input: contactPhone, message: 'Lütfen telefon numaranızı giriniz.' });
            } else {
                const phoneDigits = contactPhone.value.replace(/\D/g, '');
                if (phoneDigits.length < 10) {
                    errors.push({ input: contactPhone, message: 'Telefon numarası en az 10 haneli olmalıdır.' });
                }
            }

            // Email kontrolü
            if (!contactEmail.value.trim()) {
                errors.push({ input: contactEmail, message: 'Lütfen e-posta adresinizi giriniz.' });
            } else {
                const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
                if (!emailRegex.test(contactEmail.value.trim())) {
                    errors.push({ input: contactEmail, message: 'Lütfen geçerli bir e-posta adresi giriniz.' });
                }
            }

            // Şirket adı kontrolü
            if (!companyName.value.trim()) {
                errors.push({ input: companyName, message: 'Lütfen klinik/hastane adını giriniz.' });
            }

            // Branş sayısı kontrolü
            if (!branchCount.value.trim()) {
                errors.push({ input: branchCount, message: 'Lütfen branş sayısını seçiniz.' });
            }

            // Günlük hasta sayısı kontrolü
            if (!dailyPatients.value.trim()) {
                errors.push({ input: dailyPatients, message: 'Lütfen günlük hasta sayısını seçiniz.' });
            }

            // Talep türü kontrolü
            if (!requestType.value.trim()) {
                errors.push({ input: requestType, message: 'Lütfen talep türünü seçiniz.' });
            }

            // Mesaj kontrolü (opsiyonel ama yine de kontrol edelim)
            if (!contactMessage.value.trim()) {
                errors.push({ input: contactMessage, message: 'Lütfen mesajınızı yazınız.' });
            }

            // KVKK onayı kontrolü
            const kvkkCheckbox = document.getElementById('kvkkApprove');
            if (kvkkCheckbox && !kvkkCheckbox.checked) {
                errors.push({ input: kvkkCheckbox, message: 'KVKK Aydınlatma Metnini okuyup onaylamanız gerekmektedir.' });
            }

            // Hata varsa, tüm hataları göster
            if (errors.length > 0) {
                errors.forEach(err => showError(err.input, err.message));
                // İlk hatalı alana odaklan
                errors[0].input.focus();
                return;
            }

            // Disable button to prevent multiple submissions and show sending state
            submitButton.disabled = true;
            submitButton.classList.add('btn-loading');
            submitButton.setAttribute('data-original-text', window.getTranslation('sendMessage'));
            submitButton.textContent = ''; // Clear text for spinner

            // Form'u disable et ama şeffaflık yapma (SweetAlert açıkken)
            contactForm.querySelectorAll('input, select, textarea').forEach(el => {
                el.disabled = true;
            });

            // Show "Sending..." SweetAlert
            const isDarkMode = document.body.classList.contains('theme-dark');
            Swal.fire({
                title: window.getTranslation('sendingTitle'),
                text: window.getTranslation('sendingText'),
                timerProgressBar: true,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
                background: isDarkMode ? '#1e293b' : '#ffffff',
                backdrop: isDarkMode
                    ? 'rgba(0, 0, 0, 0.85)'
                    : 'rgba(0, 15, 80, 0.85)',
                customClass: {
                    popup: 'swal-premium-popup',
                    title: 'swal-premium-title',
                    htmlContainer: 'swal-premium-text',
                    timerProgressBar: 'swal-premium-progressbar',
                },
            });

            try {
                const formData = new FormData(event.target);
                const response = await fetch(event.target.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                Swal.close(); // Close the "Sending..." SweetAlert

                const isDarkMode = document.body.classList.contains('theme-dark');

                if (response.ok) {
                    Swal.fire({
                        title: window.getTranslation('contactSuccessTitle'),
                        text: window.getTranslation('contactSuccessText'),
                        icon: 'success',
                        timer: 3000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                        padding: '2em',
                        background: isDarkMode ? '#1e293b' : '#ffffff',
                        backdrop: isDarkMode
                            ? 'rgba(0, 0, 0, 0.9)'
                            : 'rgba(0, 15, 80, 0.9)',
                        customClass: {
                            popup: 'swal-premium-popup',
                            title: 'swal-premium-title',
                            htmlContainer: 'swal-premium-text',
                            timerProgressBar: 'swal-premium-progressbar',
                        },
                        willOpen: () => {
                            contactForm.reset();
                        }
                    });
                } else {
                    const data = await response.json();
                    let serverErrorMessage = window.getTranslation('genericErrorMessageServer');
                    if (Object.hasOwn(data, 'errors')) {
                        serverErrorMessage = data.errors.map(err => err.message).join(", ");
                    }
                    Swal.fire({
                        icon: 'error',
                        title: window.getTranslation('genericErrorTitle'),
                        text: serverErrorMessage,
                        confirmButtonText: window.getTranslation('okButton'),
                        background: isDarkMode ? '#1e293b' : '#ffffff',
                        backdrop: isDarkMode
                            ? 'rgba(0, 0, 0, 0.9)'
                            : 'rgba(0, 15, 80, 0.9)',
                        customClass: {
                            popup: 'swal-premium-popup',
                            title: 'swal-premium-title',
                            htmlContainer: 'swal-premium-text',
                            confirmButton: 'swal-premium-confirm-button',
                        },
                        buttonsStyling: false,
                    });
                }
            } catch (error) {
                logger.error('Formspree submission failed', error);

                // FALLBACK: Formspree çökerse native form submit
                logger.warn('Attempting fallback submission');

                // Kullanıcıya fallback olduğunu bildir
                Swal.fire({
                    icon: 'info',
                    title: 'Bağlantı Hatası',
                    text: 'Formunuz alternate yöntemle gönderiliyor...',
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    background: isDarkMode ? '#1e293b' : '#ffffff',
                    backdrop: isDarkMode
                        ? 'rgba(0, 0, 0, 0.9)'
                        : 'rgba(0, 15, 80, 0.9)',
                    customClass: {
                        popup: 'swal-premium-popup',
                        title: 'swal-premium-title',
                        htmlContainer: 'swal-premium-text',
                    }
                });

                // Native form submit (fallback)
                // Not: Bu çalışması için SweetAlert'i kapatmamız gerekiyor
                setTimeout(() => {
                    Swal.close();
                    // Native submit - browser'ın default form handling
                    contactForm.submit();
                }, 2000);
            } finally {
                // Re-enable button and restore original text
                submitButton.disabled = false;
                submitButton.classList.remove('btn-loading');
                submitButton.textContent = submitButton.getAttribute('data-original-text') || window.getTranslation('sendMessage');

                // Form elemanlarını tekrar enable et
                contactForm.querySelectorAll('input, select, textarea').forEach(el => {
                    el.disabled = false;
                });
            }
        });
    }

    // --- NEW: FAQ Accordion Logic ---
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const item = question.parentElement;
            
            // Close other items (optional - if you want only one open at a time)
            document.querySelectorAll('.faq-item').forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });

            item.classList.toggle('active');
        });
    });

    // --- NEW: Scroll to Top Button ---
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- NEW: Scroll Animations (Reveal) ---
    const revealElements = document.querySelectorAll('.reveal');
    
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.remove('hidden');
                    entry.target.classList.add('active');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        revealElements.forEach(el => {
            el.classList.add('hidden'); // Only hide if observer is supported
            revealObserver.observe(el);
        });
    } else {
        // Fallback for older browsers
        revealElements.forEach(el => el.classList.remove('hidden'));
    }

    // --- NEW: Navbar Scroll Behavior ---
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.onscroll = () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        };
    }

    // --- NEW: Universal Smooth Scroll for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // --- NEW: Navbar Active Link Highlight on Scroll ---
    const sections = document.querySelectorAll('section[id]');
    const scrollNavLinks = document.querySelectorAll('.nav-link');

    const navObserverOptions = {
        threshold: 0.6 // Section should be 60% visible
    };

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                scrollNavLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, navObserverOptions);

    sections.forEach(section => navObserver.observe(section));

    // --- NEW: Hero Slider Auto-Play ---
    const slides = document.querySelectorAll('.slide');
    if (slides.length > 0) {
        let currentSlide = 0;
        setInterval(() => {
            // Remove active from current
            slides[currentSlide].classList.remove('active');
            
            // Move to next
            currentSlide = (currentSlide + 1) % slides.length;
            
            // Add active to next
            slides[currentSlide].classList.add('active');
        }, 4000); // Change every 4 seconds
    }

    // --- TELEFON FORMATLAMA (Türkiye) ---
    const contactPhone = document.getElementById('contactPhone');
    if (contactPhone) {
        // Başlangıçta 0 yoksa ekle
        if (!contactPhone.value) {
            contactPhone.value = '0';
        }

        // 0'ı silmeyi engelle (backspace/delete kontrolü)
        contactPhone.addEventListener('keydown', function(e) {
            const currentValue = e.target.value;

            // Eğer sadece 0 varsa ve silmek isteniyorsa engelle
            if (currentValue === '0' && (e.key === 'Backspace' || e.key === 'Delete')) {
                e.preventDefault();
            }

            // İmleç başta ve backspace basılıyorsa engelle (0'ı korumak için)
            if (e.key === 'Backspace' && e.target.selectionStart === 1 && e.target.selectionEnd === 1) {
                e.preventDefault();
            }
        });

        contactPhone.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, ''); // Sadece rakamları al

            // 0 ile başlamalı, maksimum 11 hane
            if (!value.startsWith('0') && value.length > 0) {
                value = '0' + value;
            } else if (value === '') {
                value = '0'; // Hiçbir şey yoksa 0 koy
            }

            // Maksimum 11 hane (0XXXXXXXXXX)
            if (value.length > 11) {
                value = value.substring(0, 11);
            }

            // Format: 0XXX XXX XX XX
            let formatted = '';
            if (value.length > 0) {
                formatted = value[0]; // 0
            }
            if (value.length > 1) {
                formatted += value.substring(1, 4); // XXX
            }
            if (value.length > 4) {
                formatted += ' ' + value.substring(4, 7); // XXX
            }
            if (value.length > 7) {
                formatted += ' ' + value.substring(7, 9); // XX
            }
            if (value.length > 9) {
                formatted += ' ' + value.substring(9, 11); // XX
            }

            e.target.value = formatted;
        });

        // Sadece rakam girişine izin ver
        contactPhone.addEventListener('keypress', function(e) {
            const charCode = (e.which) ? e.which : e.keyCode;
            if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                e.preventDefault();
            }
        });
    }

    // --- OPTIMIZATION: Page Transition Loader ---
    const pageLoader = document.createElement('div');
    pageLoader.className = 'page-transition-loader';
    document.body.appendChild(pageLoader);

    // Show loader on page navigation
    document.querySelectorAll('a[href]:not([href^="#"]):not([href^="mailto:"]):not([href^="tel:"])').forEach(link => {
        link.addEventListener('click', function() {
            // Skip for target="_blank" links
            if (this.getAttribute('target') === '_blank') return;
            pageLoader.classList.add('active');
        });
    });

    // Hide loader when page is fully loaded
    window.addEventListener('load', () => {
        setTimeout(() => {
            pageLoader.classList.remove('active');
        }, 500);
    });

    // --- OPTIMIZATION: Enhanced Form Loading States ---
    const forms = document.querySelectorAll('form[data-loading-state]');
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.classList.add('btn-loading');
            }
            this.classList.add('form-loading');
        });
    });

    // --- OPTIMIZATION: Global Loading Overlay Helper ---
    window.showLoading = function(message = 'Yükleniyor...') {
        let overlay = document.querySelector('.loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="spinner"></div>';
            document.body.appendChild(overlay);
        }
        overlay.classList.add('active');
        return overlay;
    };

    window.hideLoading = function() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    };
});