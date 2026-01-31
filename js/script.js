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
import { hashString } from './utils/crypto-utils.js';
import { validateAge } from './utils/validation-utils.js';

// Initialize localStorage keys if they don't exist
// initAllDummyData(); 

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
    const linksToSaveScroll = document.querySelectorAll('a[href^="payment.html"], a[href^="login.html"], a[href^="register.html"]');
    linksToSaveScroll.forEach(link => {
        link.addEventListener('click', () => {
            // Save the current scroll position before navigating
            sessionStorage.setItem('scrollPosition', window.scrollY);
        });
    });
    // --- END of Scroll Logic ---

    const loginForm = document.getElementById('loginForm');
    const tcKimlikInput = document.getElementById('tcLogin');
    const passwordLoginInput = document.getElementById('passwordLogin');
    const togglePassword = document.querySelector('.toggle-password');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    // Load remembered TC Kimlik on page load
    if (tcKimlikInput && rememberMeCheckbox) {
        const rememberedTcKimlik = getLocalStorageItem('rememberedTcKimlik');
        if (rememberedTcKimlik) {
            tcKimlikInput.value = rememberedTcKimlik;
            rememberMeCheckbox.checked = true;
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
        const logo = document.getElementById('main-logo');
        
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

        // Update logo universally
        if (logo) {
            if (theme === 'dark') {
                logo.src = 'clean-logo-dark.png';
            } else {
                logo.src = 'clean-logo.png';
            }
        }
    };

    // Apply saved theme on initial load - REMOVED TO PREVENT FLICKER
    // applyTheme(savedTheme);

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
                    console.log(`User ${user.tc}'s password has been updated to a new hash.`);
                }

                if (passwordMatch) {
                    // On successful login, clear attempts and lockout
                    sessionStorage.removeItem(`attempts_${tc}`);
                    sessionStorage.removeItem(`lockout_${tc}`);

                    // Check user role and redirect accordingly. Default to 'patient'
                    const userRole = user.role || 'patient';
                    
                    setLoggedInUser(user);

                    console.log('Login successful for user:', user.tc, 'Role:', userRole);

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
                        console.log('Redirecting to admin-dashboard.html');
                        window.location.href = 'admin-dashboard.html'; 
                    } else if (userRole === 'doctor') {
                        console.log('Redirecting to doctor-dashboard.html');
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
                            console.log('AI önerisi tespit edildi, randevu sayfasına yönlendiriliyor...');
                            window.location.href = 'appointment.html';
                            return;
                        }

                        console.log('Redirecting to dashboard.html');
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
            const contactEmail = document.getElementById('contactEmail');
            const contactMessage = document.getElementById('contactMessage');
            const submitButton = contactForm.querySelector('button[type="submit"]');

            let isValid = true;
            let errorMessageKey = 'fillAllFields'; // Default message key

            if (!contactName.value.trim()) {
                isValid = false;
            } else if (!contactEmail.value.trim()) {
                isValid = false;
            } else if (!/\S+@\S+\.\S+/.test(contactEmail.value)) { // Basic email format validation
                errorMessageKey = 'emailInvalid';
                isValid = false;
            } else if (!contactMessage.value.trim()) {
                isValid = false;
            }

            if (!isValid) {
                showIndexFormWarning('warningTitle', errorMessageKey);
                return; // Stop submission if validation fails
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
                console.error('Contact form submission error:', error);
                Swal.close(); // Close the "Sending..." SweetAlert if still open
                Swal.fire({
                    icon: 'error',
                    title: window.getTranslation('genericErrorTitle'),
                    text: window.getTranslation('genericErrorMessageNetwork'),
                    confirmButtonText: window.getTranslation('okButton'),
                    customClass: { // Re-apply premium class to error SweetAlert
                        popup: 'swal-premium-popup',
                        title: 'swal-premium-title',
                        htmlContainer: 'swal-premium-text',
                        confirmButton: 'swal-premium-confirm-button',
                    },
                    buttonsStyling: false,
                });
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
    const navLinks = document.querySelectorAll('.nav-link');

    const navObserverOptions = {
        threshold: 0.6 // Section should be 60% visible
    };

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
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
});