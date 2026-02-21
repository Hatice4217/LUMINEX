import { validateEmail, validatePassword, validateTcKimlik, validateAge } from './utils/validation-utils.js';
import { getLuminexUsers, setLuminexUsers } from './utils/storage-utils.js';
import { hashString } from './utils/crypto-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    const passwordInput = document.getElementById('passwordRegister');
    const passwordConfirmInput = document.getElementById('passwordConfirm');
    const togglePasswords = document.querySelectorAll('.toggle-password');

    // Input Masking
    const tcInput = document.getElementById('tcKimlikRegister');
    const phoneInput = document.getElementById('phone');

    if (tcInput) {
        tcInput.addEventListener('input', function(e) {
            // Remove non-numeric characters
            this.value = this.value.replace(/\D/g, '').substring(0, 11);
        });
    }

    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, '');
            // Prevent first digit from being 0
            if (val.startsWith('0')) {
                val = val.substring(1);
            }
            let x = val.match(/(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? ' ' + x[3] : '') + (x[4] ? ' ' + x[4] : '');
        });
    }

    togglePasswords.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    });

    registerForm.addEventListener('submit', async function(event) { // Make async
        event.preventDefault();
        clearErrors();

        if (!validateForm()) {
            return;
        }

        const tcKimlik = document.getElementById('tcKimlikRegister').value;
        const email = document.getElementById('emailRegister').value;

        // Get existing users
        const users = getLuminexUsers();

        // Check if user with the same TC Kimlik or Email already exists
        const userExists = users.some(user => user.tc === tcKimlik || user.email === email);
        if (userExists) {
            showError(document.getElementById('tcKimlikRegister'), window.getTranslation('userExistsError'));
            showError(document.getElementById('emailRegister'), window.getTranslation('userExistsError'));
            return;
        }
        
        // Hash the password
        const hashedPassword = await hashString(passwordInput.value);

        // Add new user to the array
        const newUser = {
            id: 'user-' + Date.now(),
            tc: tcKimlik,
            password: hashedPassword, // Save the hashed password
            name: document.getElementById('fullName').value,
            email: email,
            phone: document.getElementById('phone').value,
            birthDate: document.getElementById('birthDate').value,
            gender: document.getElementById('gender').value
        };
        users.push(newUser);

        // Save the updated users array back to localStorage
        setLuminexUsers(users);

        // Show success message with SweetAlert
        const isDarkMode = document.body.classList.contains('theme-dark') || localStorage.getItem('landingTheme') === 'dark';
        const accentColor = isDarkMode ? '#78C7C7' : '#001F6B';

        Swal.fire({
            icon: 'success',
            title: window.getTranslation('registerSuccess'),
            text: window.getTranslation('niceToSeeYou'),
            confirmButtonText: 'OK',
            confirmButtonColor: accentColor,
            background: isDarkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
            color: isDarkMode ? '#fff' : '#1a1a2e',
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
                confirmButton: 'swal2-confirm-button',
                popup: 'swal2-popup'
            },
            didClose: () => {
                window.location.href = 'login.html';
            }
        });
    });

    function validateForm() {
        let hasError = false;
        const fields = [
            { id: 'fullName', validate: (val) => val.trim() !== '', message: window.getTranslation('fullNameRequired') },
            { id: 'tcKimlikRegister', validate: validateTcKimlik, message: window.getTranslation('tcIdInvalid') },
            { id: 'emailRegister', validate: validateEmail, message: window.getTranslation('emailInvalid') },
            { id: 'phone', validate: (val) => {
                const digits = val.replace(/\D/g, '');
                return digits.length === 0 || digits.length === 10;
            }, message: window.getTranslation('phoneInvalid') },
            { id: 'passwordRegister', validate: validatePassword, message: window.getTranslation('passwordInvalid') },
            { id: 'passwordConfirm', validate: (val) => val === passwordInput.value, message: window.getTranslation('passwordMismatch') },
            { id: 'birthDate', validate: validateAge, message: window.getTranslation('ageInvalid') },
            { id: 'termsCheck', validate: (val, el) => el.checked, message: window.getTranslation('termsRequired') }
        ];

        fields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element.type === 'checkbox') {
                 if (!field.validate(element.value, element)) {
                     showError(element.parentElement, field.message);
                     hasError = true;
                 }
            } else {
                 if (!element.value) {
                    showError(element, window.getTranslation('fieldRequired'));
                    hasError = true;
                } else if (!field.validate(element.value, element)) {
                    showError(element, field.message);
                    hasError = true;
                }
            }
        });

        return !hasError;
    }

    function showError(inputElement, messageKey) {
        const formGroup = inputElement.closest('.form-group') || inputElement.closest('.form-check');
        if (!formGroup) return;

        // Store the message key for language changes
        formGroup.dataset.errorKey = messageKey;

        // Get current language and translate the message dynamically
        const currentLang = localStorage.getItem('language') || 'tr';
        const message = window.translations && window.translations[currentLang] ?
            (window.translations[currentLang][messageKey] || messageKey) :
            messageKey;

        // Remove existing error message to update it
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Force re-trigger animation by removing and re-adding the class
        formGroup.classList.remove('error');
        void formGroup.offsetWidth; // This forces the browser to repaint
        formGroup.classList.add('error');

        // Create and append the new message
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        formGroup.appendChild(errorElement);
    }

    // Update all error messages when language changes
    function updateErrorMessages() {
        const currentLang = localStorage.getItem('language') || 'tr';
        document.querySelectorAll('.form-group.error, .form-check.error').forEach(formGroup => {
            const messageKey = formGroup.dataset.errorKey;
            if (messageKey && window.translations && window.translations[currentLang]) {
                const errorElement = formGroup.querySelector('.error-message');
                if (errorElement) {
                    const newMessage = window.translations[currentLang][messageKey] || messageKey;
                    errorElement.textContent = newMessage;
                }
            }
        });
    }

    // Listen for language changes
    window.addEventListener('languageChanged', function(e) {
        updateErrorMessages();
    });

    function clearErrors() {
        document.querySelectorAll('.form-group.error, .form-check.error').forEach(formGroup => {
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

// Global Modal Functions
window.showTermsModal = function(e) {
    if(e) e.preventDefault();

    const isDarkMode = document.body.classList.contains('theme-dark') || localStorage.getItem('landingTheme') === 'dark';

    // Store original body styles and lock body size
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPadding = document.body.style.paddingRight;
    const authCard = document.querySelector('.auth-card');
    const originalCardHeight = authCard ? authCard.offsetHeight : null;

    Swal.fire({
        title: '',
        html: `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                <div class="premium-spinner"></div>
                <p style="margin: 0; font-size: 0.95rem; opacity: 0.8;">${window.getTranslation('loadingText')}</p>
            </div>
            <style>
                .premium-spinner {
                    width: 50px;
                    height: 50px;
                    border: 3px solid rgba(120, 199, 199, 0.2);
                    border-top-color: #78C7C7;
                    border-radius: 50%;
                    animation: premium-spin 0.8s linear infinite;
                }
                @keyframes premium-spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `,
        showConfirmButton: false,
        showCloseButton: false,
        background: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdrop: `rgba(0, 0, 0, ${isDarkMode ? '0.7' : '0.5'})`,
        customClass: {
            popup: 'premium-modal-loading'
        },
        didOpen: () => {
            // Fix body padding that SweetAlert adds
            document.body.style.paddingRight = originalBodyPadding;
        }
    });

    fetch('kullanim-sartlari.html')
        .then(response => response.text())
        .then(html => {
            // Close loading modal first
            Swal.close();

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const content = doc.querySelector('.container') || doc.body;

            // Translate content - using all elements with data-lang
            const currentLang = localStorage.getItem('language') || 'tr';
            if (window.translations && window.translations[currentLang]) {
                // Manually translate all data-lang elements
                content.querySelectorAll('[data-lang]').forEach(el => {
                    const key = el.dataset.lang;
                    const translation = window.translations[currentLang][key];
                    if (translation) {
                        el.textContent = translation;
                    }
                });
            }

            // Extract styles
            const styles = doc.querySelectorAll('style');
            let styleContent = '';
            styles.forEach(style => styleContent += style.innerHTML);

            // Premium Modal Styles
            const accentColor = isDarkMode ? '#78C7C7' : '#001F6B';
            const textColor = isDarkMode ? '#ffffff' : '#1a1a2e';
            const secondaryTextColor = isDarkMode ? '#cbd5e1' : '#64748b';

            styleContent += `
                /* High z-index to ensure modal is above everything */
                div:where(.swal2-container) {
                    z-index: 99999 !important;
                }
                .swal2-popup {
                    z-index: 99999 !important;
                }
                .swal2-backdrop-show {
                    z-index: 99998 !important;
                }

                /* SweetAlert Animasyonlarını Yavaşlat - Patma efekti olmadan */
                .swal2-show {
                    animation-duration: 0.8s !important;
                    animation-timing-function: ease-out !important;
                }
                .swal2-hide {
                    animation-duration: 0.6s !important;
                    animation-timing-function: ease-in !important;
                }
                .swal2-backdrop-show {
                    animation-duration: 0.8s !important;
                    animation-timing-function: ease-out !important;
                }

                .premium-modal-content {
                    font-family: 'Poppins', sans-serif;
                    color: ${textColor};
                }
                .premium-modal-content h1 {
                    font-size: 1.8rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    background: linear-gradient(135deg, ${accentColor} 0%, ${isDarkMode ? '#ffffff' : '#0036a8'} 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .premium-modal-content h2 {
                    font-size: 1.3rem;
                    font-weight: 600;
                    margin-top: 1.5rem;
                    margin-bottom: 0.8rem;
                    color: ${accentColor};
                }
                .premium-modal-content p, .premium-modal-content li {
                    color: ${secondaryTextColor};
                    line-height: 1.7;
                    margin-bottom: 0.8rem;
                }
                .premium-modal-content ul {
                    padding-left: 1.5rem;
                    margin-bottom: 1rem;
                }
                .premium-modal-content li {
                    position: relative;
                    margin-bottom: 0.6rem;
                }
                .premium-modal-content li::marker {
                    color: ${accentColor};
                }
                .premium-modal-content strong {
                    color: ${accentColor};
                    font-weight: 600;
                }
                .premium-modal-content .footer-note {
                    margin-top: 2rem;
                    padding: 1rem;
                    background: ${isDarkMode ? 'rgba(120, 199, 199, 0.1)' : 'rgba(0, 31, 107, 0.05)'};
                    border-left: 3px solid ${accentColor};
                    border-radius: 8px;
                    font-size: 0.9rem;
                }
                .premium-modal-content::-webkit-scrollbar {
                    width: 8px;
                }
                .premium-modal-content::-webkit-scrollbar-track {
                    background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
                    border-radius: 10px;
                }
                .premium-modal-content::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, ${accentColor} 0%, ${isDarkMode ? '#5ab4b4' : '#0036a8'} 100%);
                    border-radius: 10px;
                }
            `;

            const backBtn = content.querySelector('.btn');
            if(backBtn) backBtn.remove();

            const h1 = content.querySelector('h1');
            if(h1) h1.style.fontSize = '1.8rem';

            Swal.fire({
                html: `
                    <style>${styleContent}</style>
                    <div class="premium-modal-content" style="text-align: left; max-height: 65vh; overflow-y: auto; padding: 10px 5px;">${content.innerHTML}</div>
                `,
                width: '95%',
                maxWidth: '950px',
                showConfirmButton: true,
                confirmButtonText: `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>${window.getTranslation('readAndUnderstood')}</span>
                        <i class="fas fa-check"></i>
                    </div>
                `,
                confirmButtonColor: accentColor,
                showCloseButton: true,
                closeButtonHtml: '<i class="fas fa-times"></i>',
                heightAuto: false,
                background: isDarkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                color: textColor,
                backdrop: `rgba(0, 0, 0, ${isDarkMode ? '0.7' : '0.5'})`,
                customClass: {
                    popup: 'premium-modal-popup',
                    confirmButton: 'premium-modal-confirm',
                    closeButton: 'premium-modal-close'
                },
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
                didOpen: () => {
                    // Fix body padding that SweetAlert adds
                    document.body.style.paddingRight = originalBodyPadding;
                },
                didClose: () => {
                    // Restore original body styles - without animation
                    document.body.style.overflow = originalBodyOverflow;
                    document.body.style.paddingRight = originalBodyPadding;
                    // Don't restore card height - let it stay natural
                }
            });
        })
        .catch(error => {
            console.error('Error loading terms:', error);
            Swal.fire({
                title: '',
                html: `
                    <div style="text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                        <h3 style="margin: 0 0 0.5rem 0; color: ${isDarkMode ? '#fff' : '#1a1a2e'};">${window.getTranslation('errorTitle')}</h3>
                        <p style="margin: 0; opacity: 0.7;">${window.getTranslation('contentLoadError')}</p>
                    </div>
                `,
                confirmButtonColor: accentColor,
                background: isDarkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                color: textColor,
                didOpen: () => {
                    document.body.style.paddingRight = originalBodyPadding;
                }
            });
        });
};

window.showKvkkModal = function(e) {
    if(e) e.preventDefault();

    const isDarkMode = document.body.classList.contains('theme-dark') || localStorage.getItem('landingTheme') === 'dark';

    // Store original body styles
    const originalBodyPadding = document.body.style.paddingRight;

    Swal.fire({
        title: '',
        html: `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
                <div class="premium-spinner"></div>
                <p style="margin: 0; font-size: 0.95rem; opacity: 0.8;">${window.getTranslation('loadingText')}</p>
            </div>
            <style>
                .premium-spinner {
                    width: 50px;
                    height: 50px;
                    border: 3px solid rgba(120, 199, 199, 0.2);
                    border-top-color: #78C7C7;
                    border-radius: 50%;
                    animation: premium-spin 0.8s linear infinite;
                }
                @keyframes premium-spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `,
        showConfirmButton: false,
        showCloseButton: false,
        background: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdrop: `rgba(0, 0, 0, ${isDarkMode ? '0.7' : '0.5'})`,
        didOpen: () => {
            document.body.style.paddingRight = originalBodyPadding;
        }
    });

    fetch('kvkk-standalone.html')
        .then(response => response.text())
        .then(html => {
            // Close loading modal first
            Swal.close();

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const content = doc.querySelector('.container') || doc.body;

            // Translate content - using all elements with data-lang
            const currentLang = localStorage.getItem('language') || 'tr';
            if (window.translations && window.translations[currentLang]) {
                // Manually translate all data-lang elements
                content.querySelectorAll('[data-lang]').forEach(el => {
                    const key = el.dataset.lang;
                    const translation = window.translations[currentLang][key];
                    if (translation) {
                        el.textContent = translation;
                    }
                });
            }

            // Extract styles
            const styles = doc.querySelectorAll('style');
            let styleContent = '';
            styles.forEach(style => styleContent += style.innerHTML);

            // Premium Modal Styles
            const accentColor = isDarkMode ? '#78C7C7' : '#001F6B';
            const textColor = isDarkMode ? '#ffffff' : '#1a1a2e';
            const secondaryTextColor = isDarkMode ? '#cbd5e1' : '#64748b';

            styleContent += `
                /* High z-index to ensure modal is above everything */
                div:where(.swal2-container) {
                    z-index: 99999 !important;
                }
                .swal2-popup {
                    z-index: 99999 !important;
                }
                .swal2-backdrop-show {
                    z-index: 99998 !important;
                }

                /* SweetAlert Animasyonlarını Yavaşlat - Patma efekti olmadan */
                .swal2-show {
                    animation-duration: 0.8s !important;
                    animation-timing-function: ease-out !important;
                }
                .swal2-hide {
                    animation-duration: 0.6s !important;
                    animation-timing-function: ease-in !important;
                }
                .swal2-backdrop-show {
                    animation-duration: 0.8s !important;
                    animation-timing-function: ease-out !important;
                }

                .premium-modal-content {
                    font-family: 'Poppins', sans-serif;
                    color: ${textColor};
                }
                .premium-modal-content h1 {
                    font-size: 1.8rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    background: linear-gradient(135deg, ${accentColor} 0%, ${isDarkMode ? '#ffffff' : '#0036a8'} 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                .premium-modal-content h2 {
                    font-size: 1.3rem;
                    font-weight: 600;
                    margin-top: 1.5rem;
                    margin-bottom: 0.8rem;
                    color: ${accentColor};
                }
                .premium-modal-content p, .premium-modal-content li {
                    color: ${secondaryTextColor};
                    line-height: 1.7;
                    margin-bottom: 0.8rem;
                }
                .premium-modal-content ul {
                    padding-left: 1.5rem;
                    margin-bottom: 1rem;
                }
                .premium-modal-content li {
                    position: relative;
                    margin-bottom: 0.6rem;
                }
                .premium-modal-content li::marker {
                    color: ${accentColor};
                }
                .premium-modal-content strong {
                    color: ${accentColor};
                    font-weight: 600;
                }
                .premium-modal-content .footer-note {
                    margin-top: 2rem;
                    padding: 1rem;
                    background: ${isDarkMode ? 'rgba(120, 199, 199, 0.1)' : 'rgba(0, 31, 107, 0.05)'};
                    border-left: 3px solid ${accentColor};
                    border-radius: 8px;
                    font-size: 0.9rem;
                }
                .premium-modal-content::-webkit-scrollbar {
                    width: 8px;
                }
                .premium-modal-content::-webkit-scrollbar-track {
                    background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
                    border-radius: 10px;
                }
                .premium-modal-content::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, ${accentColor} 0%, ${isDarkMode ? '#5ab4b4' : '#0036a8'} 100%);
                    border-radius: 10px;
                }
            `;

            const backBtn = content.querySelector('.btn');
            if(backBtn) backBtn.remove();

            const h1 = content.querySelector('h1');
            if(h1) h1.style.fontSize = '1.8rem';

            Swal.fire({
                html: `
                    <style>${styleContent}</style>
                    <div class="premium-modal-content" style="text-align: left; max-height: 65vh; overflow-y: auto; padding: 10px 5px;">${content.innerHTML}</div>
                `,
                width: '95%',
                maxWidth: '950px',
                showConfirmButton: true,
                confirmButtonText: `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span>${window.getTranslation('readAndUnderstood')}</span>
                        <i class="fas fa-check"></i>
                    </div>
                `,
                confirmButtonColor: accentColor,
                showCloseButton: true,
                closeButtonHtml: '<i class="fas fa-times"></i>',
                heightAuto: false,
                background: isDarkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                color: textColor,
                backdrop: `rgba(0, 0, 0, ${isDarkMode ? '0.7' : '0.5'})`,
                customClass: {
                    popup: 'premium-modal-popup',
                    confirmButton: 'premium-modal-confirm',
                    closeButton: 'premium-modal-close'
                },
                showClass: {
                    popup: 'swal2-show',
                    backdrop: 'swal2-backdrop-show',
                    icon: 'swal2-icon-show'
                },
                hideClass: {
                    popup: 'swal2-hide',
                    backdrop: 'swal2-backdrop-hide',
                    icon: 'swal2-icon-hide'
                }
            });
        })
        .catch(error => {
            console.error('Error loading KVKK:', error);
            Swal.fire({
                title: '',
                html: `
                    <div style="text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                        <h3 style="margin: 0 0 0.5rem 0; color: ${isDarkMode ? '#fff' : '#1a1a2e'};">${window.getTranslation('errorTitle')}</h3>
                        <p style="margin: 0; opacity: 0.7;">${window.getTranslation('contentLoadError')}</p>
                    </div>
                `,
                confirmButtonColor: accentColor,
                background: isDarkMode ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                color: textColor
            });
        });
};
