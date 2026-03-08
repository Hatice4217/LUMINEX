import { getLoggedInUser, setLoggedInUser, getLuminexUsers, setLocalStorageItem, removeLoggedInUser, removeActiveProfile } from './utils/storage-utils.js';
import { setupHeader, applyAdminTheme } from './utils/header-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    setupHeader();
    loadUserProfile();
    setupTabs();
    setupProfileActions();
    setupPasswordChange();
    setupAccountDeletion();
    setupInputMasks();
});

function setupTabs() {
    const tabsContainer = document.querySelector('.profile-tabs');
    if (tabsContainer) {
        tabsContainer.addEventListener('click', (e) => {
            const tab = e.target.closest('.profile-tab');
            if (!tab) return;

            // Handle external links (e.g. Payment Methods)
            if (tab.dataset.externalLink) {
                window.location.href = tab.dataset.externalLink;
                return;
            }

            // Remove active class from all tabs
            document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            const targetId = tab.dataset.target;
            document.querySelectorAll('.profile-section').forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });
        });
    }
}

function setupAccountDeletion() {
    const sendCodeBtn = document.getElementById('sendDeleteCodeBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteAccountBtn');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const step1 = document.getElementById('deleteAccountStep1');
    const step2 = document.getElementById('deleteAccountStep2');
    const emailInput = document.getElementById('deleteEmailInput');
    const codeInput = document.getElementById('deleteCodeInput');

    let generatedCode = null;

    if (sendCodeBtn) {
        sendCodeBtn.addEventListener('click', () => {
            const user = getLoggedInUser();
            if (!user) return;

            const email = emailInput.value.trim();
            if (!email) {
                Swal.fire('Hata', 'Lütfen e-posta adresinizi giriniz.', 'error');
                return;
            }

            if (email.toLowerCase() !== user.email.toLowerCase()) {
                Swal.fire('Hata', 'Girdiğiniz e-posta adresi hesabınızla eşleşmiyor.', 'error');
                return;
            }

            // Simulate code generation
            generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Show loading state on button
            const originalText = sendCodeBtn.textContent;
            sendCodeBtn.disabled = true;
            sendCodeBtn.textContent = 'Gönderiliyor...';

            setTimeout(() => {
                sendCodeBtn.disabled = false;
                sendCodeBtn.textContent = originalText;

                // Show demo code via Toast
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 6000,
                    timerProgressBar: true
                });
                Toast.fire({
                    icon: 'info',
                    title: 'Demo Modu',
                    text: `Doğrulama Kodunuz: ${generatedCode}`
                });

                // Switch to step 2
                step1.style.display = 'none';
                step2.style.display = 'block';
            }, 1500);
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', () => {
            const code = codeInput.value.trim();
            if (!code) {
                Swal.fire('Hata', 'Lütfen doğrulama kodunu giriniz.', 'error');
                return;
            }

            if (code !== generatedCode) {
                Swal.fire('Hata', 'Hatalı doğrulama kodu!', 'error');
                return;
            }

            // Proceed with deletion
            const user = getLoggedInUser();
            if (user) {
                const allUsers = getLuminexUsers();
                const updatedUsers = allUsers.filter(u => u.tc !== user.tc);
                setLocalStorageItem('luminexUsers', updatedUsers);
                
                removeLoggedInUser();
                removeActiveProfile();
                
                Swal.fire({
                    title: 'Hesabınız Silindi',
                    text: 'Tüm verileriniz başarıyla temizlendi. Ana sayfaya yönlendiriliyorsunuz.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = 'index.html';
                });
            }
        });
    }

    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', () => {
            step2.style.display = 'none';
            step1.style.display = 'block';
            emailInput.value = '';
            codeInput.value = '';
            generatedCode = null;
        });
    }
}

function loadUserProfile() {
    const user = getLoggedInUser();
    if (!user) {
        // Redirect if not logged in, though user-session.js handles this usually
        return;
    }

    const nameInput = document.getElementById('profileFullName');
    const emailInput = document.getElementById('profileEmail');
    const phoneInput = document.getElementById('profilePhone');
    const birthDateInput = document.getElementById('profileBirthDate');
    const genderSelect = document.getElementById('profileGender');

    if (nameInput) nameInput.value = user.name || (user.firstName + ' ' + user.lastName) || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '';
    
    if (birthDateInput && user.dateOfBirth) {
        try {
            // Handle both ISO string and YYYY-MM-DD
            const dateVal = new Date(user.dateOfBirth);
            if (!isNaN(dateVal.getTime())) {
                birthDateInput.value = dateVal.toISOString().split('T')[0];
            }
        } catch (e) { console.error("Date parse error", e); }
    }
    
    if (genderSelect && user.gender) {
        genderSelect.value = user.gender;
    }
}

function setupProfileActions() {
    const editBtn = document.getElementById('editProfileBtn');
    const saveBtn = document.getElementById('saveProfileBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const form = document.getElementById('profileForm');
    
    if (!editBtn || !form) return;

    const toggleEdit = (isEditing) => {
        const editableInputs = [
            document.getElementById('profilePhone'),
            document.getElementById('profileBirthDate'),
            document.getElementById('profileGender')
        ];

        editableInputs.forEach(input => {
            if (input) input.disabled = !isEditing;
        });

        if (isEditing) {
            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-block';
            cancelBtn.style.display = 'inline-block';
        } else {
            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
        }
    };

    // Initial state
    toggleEdit(false);

    editBtn.addEventListener('click', () => toggleEdit(true));
    
    cancelBtn.addEventListener('click', () => {
        toggleEdit(false);
        loadUserProfile(); // Reset values
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        saveUserProfile();
        toggleEdit(false);
    });
}

function saveUserProfile() {
    const user = getLoggedInUser();
    if (!user) return;

    const phoneInput = document.getElementById('profilePhone');
    const birthDateInput = document.getElementById('profileBirthDate');
    const genderSelect = document.getElementById('profileGender');

    if (phoneInput) user.phone = phoneInput.value;
    if (birthDateInput) user.dateOfBirth = birthDateInput.value;
    if (genderSelect) user.gender = genderSelect.value;

    setLoggedInUser(user);
    
    // Update in full list
    const allUsers = getLuminexUsers();
    const index = allUsers.findIndex(u => u.tc === user.tc);
    if (index !== -1) {
        allUsers[index] = { ...allUsers[index], ...user };
        setLocalStorageItem('luminexUsers', allUsers);
    }

    Swal.fire({
        icon: 'success',
        title: 'Başarılı',
        text: 'Profil bilgileriniz güncellendi.',
        timer: 1500,
        showConfirmButton: false
    });
}

function setupPasswordChange() {
    const form = document.getElementById('passwordChangeForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentPass = document.getElementById('currentPassword').value;
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmNewPassword').value;

        if (newPass !== confirmPass) {
            Swal.fire('Hata', 'Yeni şifreler eşleşmiyor.', 'error');
            return;
        }

        if (newPass.length < 6) {
            Swal.fire('Hata', 'Şifre en az 6 karakter olmalıdır.', 'error');
            return;
        }

        const user = getLoggedInUser();
        const allUsers = getLuminexUsers();
        const dbUser = allUsers.find(u => u.tc === user.tc);

        if (dbUser && dbUser.password === currentPass) {
            dbUser.password = newPass;
            setLocalStorageItem('luminexUsers', allUsers);

            Swal.fire('Başarılı', 'Şifreniz güncellendi.', 'success');
            form.reset();
        } else {
            Swal.fire('Hata', 'Mevcut şifre yanlış.', 'error');
        }
    });
}

function setupInputMasks() {
    const phoneInput = document.getElementById('profilePhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.substring(0, 11);
            
            if (value.length > 0 && value[0] !== '0') {
                value = '0' + value;
            }
            
            let formatted = '';
            if (value.length > 0) {
                formatted = value.substring(0, 4);
            }
            if (value.length > 4) {
                formatted += ' ' + value.substring(4, 7);
            }
            if (value.length > 7) {
                formatted += ' ' + value.substring(7, 9);
            }
            if (value.length > 9) {
                formatted += ' ' + value.substring(9, 11);
            }
            
            e.target.value = formatted;
        });
    }
}