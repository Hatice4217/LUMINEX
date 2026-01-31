import { setupHeader, applyAdminTheme } from './utils/header-manager.js';
import { getLocalStorageItem, setLocalStorageItem, getLoggedInUser } from './utils/storage-utils.js'; // Import storage utilities


document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const doctorProfileForm = document.getElementById('doctorProfileForm');
    const doctorFullName = document.getElementById('doctorFullName');
    const doctorEmail = document.getElementById('doctorEmail');
    const doctorBranch = document.getElementById('doctorBranch');
    const doctorHospital = document.getElementById('doctorHospital');
    const doctorTitle = document.getElementById('doctorTitle');
    const doctorAbout = document.getElementById('doctorAbout');

    const editDoctorProfileBtn = document.getElementById('editDoctorProfileBtn');
    const saveDoctorProfileBtn = document.getElementById('saveDoctorProfileBtn');
    const cancelDoctorEditBtn = document.getElementById('cancelDoctorEditBtn');

    const doctorPasswordChangeForm = document.getElementById('doctorPasswordChangeForm');
    const doctorCurrentPasswordInput = document.getElementById('doctorCurrentPassword');
    const doctorNewPasswordInput = document.getElementById('doctorNewPassword');
    const doctorConfirmNewPasswordInput = document.getElementById('doctorConfirmNewPassword');

    const doctorThemeSettingsForm = document.getElementById('doctorThemeSettingsForm');
    const doctorThemeOptionsContainer = document.getElementById('doctorThemeOptions');

    let originalDoctorProfileData = {}; // To store data before editing

    // Helper to render individual theme options
    function renderThemeOption(value, label, bgColor, primaryColor, currentSelected) {
        const isSelected = value === currentSelected;
        return `
            <label class="theme-option ${isSelected ? 'selected' : ''}" data-theme-value="${value}">
                <div class="theme-preview-circle" style="background: ${bgColor}; border-color: ${primaryColor};"></div>
                <span class="theme-label">${label}</span>
                <input type="radio" name="userTheme" class="theme-radio" value="${value}" ${isSelected ? 'checked' : ''}>
            </label>
        `;
    }

    // Helper to convert hex to rgb for dynamic css variable
    function hexToRgb(hex) {
        if (!hex || hex.indexOf('#') === -1) return '0,0,0';
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '0,0,0';
    }


    // --- Tab Switching Logic ---
    const tabs = document.querySelectorAll('.profile-tab');
    const sections = document.querySelectorAll('.profile-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Activate clicked
            tab.classList.add('active');
            const targetId = tab.dataset.target;
            document.getElementById(targetId).classList.add('active');

            // Render theme options if theme tab is active
            if (targetId === 'theme-settings') {
                renderDoctorThemeOptions();
            }
        });
    });

    function renderDoctorThemeOptions() {
        if (!doctorThemeOptionsContainer) return;

        const loggedInUser = getLoggedInUser();
        const currentUserTheme = (loggedInUser && loggedInUser.theme) ? loggedInUser.theme : 'light';
        
        doctorThemeOptionsContainer.innerHTML = `
            ${renderThemeOption('light', '🌞 Aydınlık Tema', '#f5f5f7', '#3667A8', currentUserTheme)}
            ${renderThemeOption('dark', '🌙 Karanlık Tema', '#0f172a', '#818cf8', currentUserTheme)}
            ${renderThemeOption('blue', '🔵 Kurumsal Mavi', '#f0f7ff', '#0984e3', currentUserTheme)}
            ${renderThemeOption('gold', '🏆 Gold Premium', '#fdfcf5', '#D4B88C', currentUserTheme)}
        `;

        // Add event listeners for the new theme options
        doctorThemeOptionsContainer.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                doctorThemeOptionsContainer.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                option.querySelector('.theme-radio').checked = true;
            });
        });
    }

    // --- Helper Functions ---
    function setProfileFieldsEditable(editable) {
        doctorTitle.readOnly = !editable;
        doctorAbout.readOnly = !editable;

        if (editable) {
            editDoctorProfileBtn.style.display = 'none';
            saveDoctorProfileBtn.style.display = 'inline-block';
            cancelDoctorEditBtn.style.display = 'inline-block';
        } else {
            editDoctorProfileBtn.style.display = 'inline-block';
            saveDoctorProfileBtn.style.display = 'none';
            cancelDoctorEditBtn.style.display = 'none';
        }
    }

    function loadDoctorProfileData() {
        // In a real app, this would fetch data from a backend based on logged-in doctor
        const dummyDoctorData = {
            fullName: 'Dr. Ayşe Yılmaz',
            email: 'ayse.yilmaz@example.com',
            branch: 'Kardiyoloji',
            hospital: 'Medicana Hastanesi',
            title: 'Uzm. Dr.',
            about: 'Kardiyoloji alanında 10 yılı aşkın tecrübem bulunmaktadır. Kalp sağlığı konusunda hastalarıma en iyi hizmeti sunmayı hedefliyorum.',
            password: 'password123' // Dummy password for validation
        };

        doctorFullName.value = dummyDoctorData.fullName;
        doctorEmail.value = dummyDoctorData.email;
        doctorBranch.value = dummyDoctorData.branch;
        doctorHospital.value = dummyDoctorData.hospital;
        doctorTitle.value = dummyDoctorData.title;
        doctorAbout.value = dummyDoctorData.about;

        // Update Sidebar Info
        const nameDisplay = document.getElementById('profileNameDisplay');
        const titleDisplay = document.getElementById('profileTitleDisplay');
        if(nameDisplay) nameDisplay.textContent = dummyDoctorData.fullName;
        if(titleDisplay) titleDisplay.textContent = `${dummyDoctorData.title} - ${dummyDoctorData.branch}`;

        // Load Saved Profile Image
        const savedImage = localStorage.getItem('doctorProfileImage');
        if (savedImage) {
            document.getElementById('profileImageDisplay').src = savedImage;
        }

        originalDoctorProfileData = { ...dummyDoctorData };
        setProfileFieldsEditable(false); // Start in read-only mode

    }

    // --- Profile Image Upload Logic ---
    const avatarUploadInput = document.getElementById('avatarUpload');
    if (avatarUploadInput) {
        avatarUploadInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const base64String = event.target.result;
                    // 1. Update UI immediately
                    document.getElementById('profileImageDisplay').src = base64String;
                    // 2. Save to Storage
                    localStorage.setItem('doctorProfileImage', base64String);
                    // 3. Notify User
                    const Toast = Swal.mixin({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000
                    });
                    Toast.fire({
                        icon: 'success',
                        title: 'Profil fotoğrafı güncellendi'
                    });
                };
                reader.readAsDataURL(file);
            }
        });
    }

    function validatePassword(password) {
        const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&/])[A-Za-z\d@$!%*?&/]{8,}$/;
        return re.test(password);
    }

    function showError(inputElement, message) {
        const formGroup = inputElement.closest('.form-group');
        formGroup.classList.add('error');
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        formGroup.appendChild(errorElement);
    }

    function clearErrors() {
        document.querySelectorAll('.form-group.error').forEach(formGroup => {
            formGroup.classList.remove('error');
            const errorElement = formGroup.querySelector('.error-message');
            if (errorElement) {
                errorElement.remove();
            }
        });
    }

    // --- Event Listeners ---
    editDoctorProfileBtn.addEventListener('click', function() {
        setProfileFieldsEditable(true);
    });

    cancelDoctorEditBtn.addEventListener('click', function() {
        // Revert to original data
        doctorTitle.value = originalDoctorProfileData.title || '';
        doctorAbout.value = originalDoctorProfileData.about || '';
        setProfileFieldsEditable(false);
        clearErrors();
    });

    doctorProfileForm.addEventListener('submit', function(event) {
        event.preventDefault();
        clearErrors();

        let hasError = false;

        if (doctorTitle.value.trim() === '') {
            showError(doctorTitle, 'Ünvan boş bırakılamaz.');
            hasError = true;
        }
        if (doctorAbout.value.trim() === '') {
            showError(doctorAbout, 'Hakkında alanı boş bırakılamaz.');
            hasError = true;
        }

        if (hasError) {
            return;
        }

        // Simulate saving data
        originalDoctorProfileData.title = doctorTitle.value;
        originalDoctorProfileData.about = doctorAbout.value;
        setProfileFieldsEditable(false);
        alert('Profil bilgileri başarıyla güncellendi (simülasyon)!');
        // In a real app, send updated data to backend
    });

    doctorPasswordChangeForm.addEventListener('submit', function(event) {
        event.preventDefault();
        clearErrors();

        let hasError = false;

        if (doctorCurrentPasswordInput.value !== originalDoctorProfileData.password) {
            showError(doctorCurrentPasswordInput, 'Mevcut şifreniz yanlış.');
            hasError = true;
        }
        if (!validatePassword(doctorNewPasswordInput.value)) {
            showError(doctorNewPasswordInput, 'Yeni şifre en az 8 karakter olmalı, en az bir büyük harf, bir küçük harf, bir sayı ve bir özel karakter içermelidir.');
            hasError = true;
        }
        if (doctorNewPasswordInput.value !== doctorConfirmNewPasswordInput.value) {
            showError(doctorConfirmNewPasswordInput, 'Yeni şifreler eşleşmiyor.');
            hasError = true;
        }

        if (hasError) {
            return;
        }

        // Simulate password change
        originalDoctorProfileData.password = doctorNewPasswordInput.value; // Update dummy password
        alert('Şifreniz başarıyla değiştirildi (simülasyon)!');
        doctorPasswordChangeForm.reset(); // Clear form
        // In a real app, send request to backend to change password
    });

    // --- Theme Settings Form Listener ---
    if (doctorThemeSettingsForm) {
        doctorThemeSettingsForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const selectedTheme = document.querySelector('input[name="userTheme"]:checked').value;
            
            // Update LoggedIn User Session
            const loggedInUser = getLoggedInUser();
            if (loggedInUser) {
                loggedInUser.theme = selectedTheme;
                sessionStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
                
                 // Update Persistent User Data (if doctor exists in luminexUsers)
                const allUsers = JSON.parse(localStorage.getItem('luminexUsers')) || [];
                const userIndex = allUsers.findIndex(u => u.email === loggedInUser.email || u.tc === loggedInUser.tc); // Try matching by email or TC
                if (userIndex !== -1) {
                    allUsers[userIndex].theme = selectedTheme;
                    localStorage.setItem('luminexUsers', JSON.stringify(allUsers));
                }
            }
            
            applyAdminTheme(selectedTheme); // Apply theme

            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            Toast.fire({
                icon: 'success',
                title: 'Tema ayarları güncellendi'
            });
        });
    }

    // --- Initial Load ---
    loadDoctorProfileData();
    renderDoctorThemeOptions(); // Initial render of theme options
});
