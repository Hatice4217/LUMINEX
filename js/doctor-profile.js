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

    let originalDoctorProfileData = {}; // To store data before editing

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
        });
    });

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

    // --- Initial Load ---
    loadDoctorProfileData();
});
