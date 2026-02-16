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

    // Toggle mobile menu
    function toggleMobileMenu() {
        hamburgerBtn.classList.toggle('active');
        navMenu.classList.toggle('active');
        navRightActions.classList.toggle('active');
        navOverlay.classList.toggle('active');

        // Prevent body scroll when menu is open
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    }

    // Close mobile menu
    function closeMobileMenu() {
        hamburgerBtn.classList.remove('active');
        navMenu.classList.remove('active');
        navRightActions.classList.remove('active');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Hamburger button click
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleMobileMenu);
    }

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
        const formGroup = inputElement.closest('.form-group');
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

        loginForm.addEventListener('submit', async function(event) { // Make async
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

                updateTimer(); // Initial call
                lockoutInterval = setInterval(updateTimer, 1000);
                return;
            }

            if (rememberMeCheckbox && tcKimlikInput) {
                if (rememberMeCheckbox.checked) {
                    // Encrypt TC Kimlik before storing (XSS prevention)
                    encryptData(tc, APP_SECRET).then(encrypted => {
                        if (encrypted) {
                            setLocalStorageItem('rememberedTcKimlik', encrypted);
                        }
                    });
                } else {
                    removeLocalStorageItem('rememberedTcKimlik');
                }
            }

            if (!tc || !password) {
                if (!tc) showError(tcKimlikInput, window.getTranslation('tcRequired'));
                if (!password) showError(passwordLoginInput, window.getTranslation('passwordRequired'));
                return;
            }

            // ========================================
            // TC KIMLIK VALIDASYONU (Production Ready)
            // ========================================
            function validateTCKimlik(tc) {
                // 1. Temel kontroller
                if (!tc || typeof tc !== 'string') return false;

                // Sadece rakamlar
                const tcDigits = tc.replace(/\D/g, '');
                if (tcDigits.length !== 11) return false;
                if (tcDigits[0] === '0') return false; // Ilk hane 0 olamaz

                // 2. TC Kimlik Algoritma Kontrolü (Resmi Spec)
                const digits = tcDigits.split('').map(Number);

                // 10. hane: ilk 9 hanenin toplamının 10'a bölümünden kalan
                const first9Sum = digits.slice(0, 9).reduce((a, b) => a + b, 0);
                const tenthDigit = (first9Sum % 10);
                if (digits[9] !== tenthDigit) return false;

                // 11. hane: 1,3,5,7,9 pozisyonlarının toplamı * 7 + 2,4,6,8 pozisyonlarının toplamı
                //          Sonucun 10'a bölümünden kalan
                const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
                const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
                const eleventhDigit = ((oddSum * 7) + evenSum) % 10;
                if (digits[10] !== eleventhDigit) return false;

                return true;
            }

            // TC Kimlik validasyonunu çalıştır
            if (!validateTCKimlik(tc)) {
                showError(tcKimlikInput, window.getTranslation('invalidTC') || 'Geçersiz TC Kimlik numarası');
                return;
            }
            // ========================================

            const registeredUsers = getLuminexUsers();
            const userIndex = registeredUsers.findIndex(u => (u.tc || u.tcKimlik) === tc);
            
            if (userIndex > -1) {
                const user = registeredUsers[userIndex];
                const hashedPassword = await hashString(password);
                let passwordMatch = false;

                // 1. Try matching with hashed password (new system)
                if (hashedPassword === user.password) {
                    passwordMatch = true;
                } 
                // 2. If not, try matching with plain text (for old accounts)
                else if (password === user.password) {
                    passwordMatch = true;
                    // Lazy migration: Update the old plain-text password to a hashed one
                    registeredUsers[userIndex].password = hashedPassword;
                    setLuminexUsers(registeredUsers);
                    logger.info('Password migrated to hash', { userId: user.id });
                }

                if (passwordMatch) {
                    // On successful login, clear attempts and lockout
                    sessionStorage.removeItem(`attempts_${tc}`);
                    sessionStorage.removeItem(`lockout_${tc}`);

                    // Check user role and redirect accordingly. Default to 'patient'
                    const userRole = user.role || 'patient';
                    
                    setLoggedInUser(user);

                    logger.info('User login successful', { userId: user.id, role: userRole });

                    // Check for redirect parameter or symptom checker parameters
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirectPage = urlParams.get('redirect');
                    const deptParam = urlParams.get('dep');
                    const branchParam = urlParams.get('branch');

                    if (redirectPage) {
                        window.location.href = redirectPage;
                    } else if (deptParam) {
                        // Eğer departman parametresi varsa, appointment.html'e yönlendir ve parametreleri taşı
                        let targetUrl = `appointment.html?dep=${encodeURIComponent(deptParam)}`;
                        if(branchParam) targetUrl += `&branch=${branchParam}`;
                        window.location.href = targetUrl;
                    } else if (userRole === 'admin') {
                        logger.debug('Redirecting to admin dashboard');
                        window.location.href = 'admin-dashboard.html'; 
                    } else if (userRole === 'doctor') {
                        logger.debug('Redirecting to doctor dashboard');
                        window.location.href = 'doctor-dashboard.html';
                    } else { // Patient
                        if (user.birthDate && !validateAge(user.birthDate)) {
                            showError(tcKimlikInput, window.getTranslation('ageRestriction'));
                            removeLoggedInUser(); 
                            return;
                        }

                        // Akıllı Yönlendirme: Eğer hafızada bir AI önerisi varsa randevu sayfasına git
                        const hasAiRecommendation = sessionStorage.getItem('recommendedBranch');
                        if (hasAiRecommendation) {
                            logger.info('AI recommendation redirect', { hasRecommendation: true });
                            window.location.href = 'appointment.html';
                            return;
                        }

                        logger.debug('Redirecting to patient dashboard');
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    // Password incorrect, handle attempts
                    let attempts = parseInt(sessionStorage.getItem(`attempts_${tc}`) || '0') + 1;
                    
                    if (attempts >= MAX_ATTEMPTS) {
                        const lockoutUntil = Date.now() + LOCKOUT_DURATION;
                        sessionStorage.setItem(`lockout_${tc}`, lockoutUntil);
                        sessionStorage.removeItem(`attempts_${tc}`);
                        // Trigger the lockout timer immediately by re-running the submit logic
                        loginForm.requestSubmit();
                    } else {
                        sessionStorage.setItem(`attempts_${tc}`, attempts);
                        const remainingAttemptsMsg = window.getTranslation('attemptsRemaining').replace('{attempts}', MAX_ATTEMPTS - attempts);
                        showError(passwordLoginInput, `${window.getTranslation('passwordIncorrect')} ${remainingAttemptsMsg}`);
                    }
                }
            } else {
                // User with this TC does not exist
                showError(tcKimlikInput, window.getTranslation('userNotFound'));
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
            const contactPhone = document.getElementById('contactPhone');
            const contactEmail = document.getElementById('contactEmail');
            const contactMessage = document.getElementById('contactMessage');
            const submitButton = contactForm.querySelector('button[type="submit"]');

            // Alan bazlı kontrol ve SweetAlert uyarısı
            if (!contactName.value.trim()) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Eksik Bilgi!',
                    text: 'Lütfen adınızı ve soyadınızı giriniz.',
                    confirmButtonColor: '#78C7C7',
                    confirmButtonText: 'Tamam'
                });
                contactName.focus();
                return;
            }

            if (!contactPhone.value.trim()) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Eksik Bilgi!',
                    text: 'Lütfen telefon numaranızı giriniz.',
                    confirmButtonColor: '#78C7C7',
                    confirmButtonText: 'Tamam'
                });
                contactPhone.focus();
                return;
            }

            // Telefon format kontrolü (0XXX XXX XX XX)
            const phonePattern = /^0[0-9]{3} [0-9]{3} [0-9]{2} [0-9]{2}$/;
            if (!phonePattern.test(contactPhone.value.trim())) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Geçersiz Telefon!',
                    text: 'Telefon numarası formatı: 0XXX XXX XX XX olmalıdır.',
                    confirmButtonColor: '#78C7C7',
                    confirmButtonText: 'Tamam'
                });
                contactPhone.focus();
                return;
            }

            if (!contactEmail.value.trim()) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Eksik Bilgi!',
                    text: 'Lütfen e-posta adresinizi giriniz.',
                    confirmButtonColor: '#78C7C7',
                    confirmButtonText: 'Tamam'
                });
                contactEmail.focus();
                return;
            }

            // Email validasyonu - Production-ready regex
            // Not: Backend'de MX record check yapılmalı (production için)
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            if (!emailRegex.test(contactEmail.value.trim())) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Geçersiz E-posta!',
                    text: 'Lütfen geçerli bir e-posta adresi giriniz (örn: ornek@domain.com).',
                    confirmButtonColor: '#78C7C7',
                    confirmButtonText: 'Tamam'
                });
                contactEmail.focus();
                return;
            }

            // TODO: Production için Backend MX record check
            // fetch('/api/validate-email?email=' + encodeURIComponent(contactEmail.value))
            //   .then(res => res.json())
            //   .then(data => { if (!data.valid) { /* Show error */ } });


            if (!contactMessage.value.trim()) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Eksik Bilgi!',
                    text: 'Lütfen mesajınızı yazınız.',
                    confirmButtonColor: '#78C7C7',
                    confirmButtonText: 'Tamam'
                });
                contactMessage.focus();
                return;
            }

            // KVKK onayı kontrolü
            const kvkkCheckbox = document.getElementById('kvkkApprove');
            if (kvkkCheckbox && !kvkkCheckbox.checked) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Onay Gerekli!',
                    text: 'KVKK Aydınlatma Metni\'ni okuyup onaylamanız gerekmektedir.',
                    confirmButtonColor: '#78C7C7',
                    confirmButtonText: 'Tamam'
                });
                return;
            }

            // Disable button to prevent multiple submissions and show sending state
            submitButton.disabled = true;
            submitButton.textContent = window.getTranslation('sendingMessage');

            // Show "Sending..." SweetAlert
            Swal.fire({
                title: window.getTranslation('sendingTitle'),
                text: window.getTranslation('sendingText'),
                timerProgressBar: true,
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                },
                customClass: { // Re-apply premium class to sending SweetAlert
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

                if (response.ok) {
                    Swal.fire({
                        title: window.getTranslation('contactSuccessTitle'),
                        text: window.getTranslation('contactSuccessText'),
                        timer: 3000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                        padding: '2em',
                        background: 'rgba(0, 4, 40, 0.85)', // Re-applying the premium style with slightly lighter default dark
                        backdrop: `
                            rgba(0, 15, 80, 0.4)
                            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill='%2378c7c7' fill-opacity='0.1'%3E%3Crect x='0' y='0' width='100' height='100'/%3E%3C/g%3E%3C/svg%3E")
                            left top
                            repeat
                        `,
                        customClass: {
                            popup: 'swal-premium-popup',
                            title: 'swal-premium-title',
                            htmlContainer: 'swal-premium-text',
                            timerProgressBar: 'swal-premium-progressbar',
                        },
                        iconHtml: '<div class="swal-custom-icon"><i class="fas fa-check"></i></div>', // Custom animated icon
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
                        customClass: { // Re-apply premium class to error SweetAlert
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
                    text: 'Formsunuz alternate yöntemle gönderiliyor...',
                    timer: 2000,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    background: 'rgba(0, 4, 40, 0.85)',
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
                submitButton.textContent = window.getTranslation('sendMessage');
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

    // --- TELEFON FORMATLAMA (Türkiye) ---
    const contactPhone = document.getElementById('contactPhone');
    if (contactPhone) {
        contactPhone.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, ''); // Sadece rakamları al

            // 0 ile başlamalı, maksimum 11 hane
            if (!value.startsWith('0') && value.length > 0) {
                value = '0' + value;
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
    }
});