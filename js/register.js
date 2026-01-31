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
            this.querySelector('i').classList.toggle('fa-eye-slash');
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

        const registerBtn = registerForm.querySelector('button[type="submit"]');
        registerBtn.textContent = window.getTranslation('registerSuccess');
        registerBtn.style.backgroundColor = '#28a745';
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
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

    function showError(inputElement, message) {
        const formGroup = inputElement.closest('.form-group') || inputElement.closest('.form-check');
        if (!formGroup) return;

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
    
    Swal.fire({
        title: window.getTranslation('loadingText'),
        didOpen: () => {
            Swal.showLoading();
        },
        heightAuto: false // Prevent layout shift
    });

    fetch('kullanim-sartlari.html')
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const content = doc.querySelector('.container') || doc.body;
            
            // Translate content
            const currentLang = localStorage.getItem('language') || 'tr';
            if (window.updateTexts) {
                window.updateTexts(currentLang, content);
            }

            // Extract styles
            const styles = doc.querySelectorAll('style');
            let styleContent = '';
            styles.forEach(style => styleContent += style.innerHTML);

            // Dark Mode Overrides
            const isDarkMode = document.body.classList.contains('theme-dark') || localStorage.getItem('landingTheme') === 'dark';
            if (isDarkMode) {
                styleContent += `
                    .container { background-color: transparent !important; box-shadow: none !important; color: #f1f5f9 !important; padding: 0 !important; }
                    h1, h2, h3, strong { color: #ffffff !important; }
                    p, li { color: #cbd5e1 !important; }
                    .footer-note { color: #94a3b8 !important; }
                `;
            }

            const backBtn = content.querySelector('.btn');
            if(backBtn) backBtn.remove();

            const h1 = content.querySelector('h1');
            if(h1) h1.style.fontSize = '1.8rem';

            Swal.fire({
                html: `
                    <style>${styleContent}</style>
                    <div style="text-align: left; max-height: 60vh; overflow-y: auto; padding: 10px;">${content.innerHTML}</div>
                `,
                width: '900px',
                showConfirmButton: true,
                confirmButtonText: window.getTranslation('readAndUnderstood'),
                confirmButtonColor: '#001F6B',
                showCloseButton: true,
                heightAuto: false, // Prevent layout shift
                background: isDarkMode ? '#1e293b' : '#fff',
                color: isDarkMode ? '#fff' : '#333'
            });
        })
        .catch(error => {
            console.error('Error loading terms:', error);
            Swal.fire(window.getTranslation('errorTitle'), window.getTranslation('contentLoadError'), 'error');
        });
};

window.showKvkkModal = function(e) {
    if(e) e.preventDefault();

    Swal.fire({
        title: window.getTranslation('loadingText'),
        didOpen: () => {
            Swal.showLoading();
        },
        heightAuto: false // Prevent layout shift
    });

    fetch('kvkk-standalone.html')
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const content = doc.querySelector('.container') || doc.body;

            // Translate content
            const currentLang = localStorage.getItem('language') || 'tr';
            if (window.updateTexts) {
                window.updateTexts(currentLang, content);
            }

            // Extract styles
            const styles = doc.querySelectorAll('style');
            let styleContent = '';
            styles.forEach(style => styleContent += style.innerHTML);

            // Dark Mode Overrides
            const isDarkMode = document.body.classList.contains('theme-dark') || localStorage.getItem('landingTheme') === 'dark';
            if (isDarkMode) {
                styleContent += `
                    .container { background-color: transparent !important; box-shadow: none !important; color: #f1f5f9 !important; padding: 0 !important; }
                    h1, h2, h3, strong { color: #ffffff !important; }
                    p, li { color: #cbd5e1 !important; }
                    .footer-note { color: #94a3b8 !important; }
                    li:before { color: #60a5fa !important; }
                `;
            }

            const backBtn = content.querySelector('.btn');
            if(backBtn) backBtn.remove();

            const h1 = content.querySelector('h1');
            if(h1) h1.style.fontSize = '1.8rem';

            Swal.fire({
                html: `
                    <style>${styleContent}</style>
                    <div style="text-align: left; max-height: 60vh; overflow-y: auto; padding: 10px;">${content.innerHTML}</div>
                `,
                width: '900px',
                showConfirmButton: true,
                confirmButtonText: window.getTranslation('readAndUnderstood'),
                confirmButtonColor: '#001F6B',
                showCloseButton: true,
                heightAuto: false, // Prevent layout shift
                background: isDarkMode ? '#1e293b' : '#fff',
                color: isDarkMode ? '#fff' : '#333'
            });
        })
        .catch(error => {
            console.error('Error loading KVKK:', error);
            Swal.fire(window.getTranslation('errorTitle'), window.getTranslation('contentLoadError'), 'error');
        });
};
