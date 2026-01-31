import { setupHeader, applyAdminTheme } from './utils/header-manager.js'; // Import applyAdminTheme
import { getLoggedInUser, getLocalStorageItem, setLocalStorageItem, getActiveProfile, setLoggedInUser } from './utils/storage-utils.js'; // Corrected import

document.addEventListener('DOMContentLoaded', function() {
    setupHeader(); // Call setupHeader to display welcome message and handle logout

    const profileForm = document.getElementById('profileForm');
    const profileFullName = document.getElementById('profileFullName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    const profileBirthDate = document.getElementById('profileBirthDate');
    const profileGender = document.getElementById('profileGender');

    const editProfileBtn = document.getElementById('editProfileBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    const passwordChangeForm = document.getElementById('passwordChangeForm');
    const passwordChangeCard = passwordChangeForm.closest('.profile-section'); // Updated to profile-section
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');

    const addChildForm = document.getElementById('addChildForm');
    const childrenCard = addChildForm.closest('.profile-section'); // Updated to profile-section
    const childTcKimlikInput = document.getElementById('childTcKimlik');
    const childFullNameInput = document.getElementById('childFullName');
    const childrenListContainer = document.getElementById('childrenList');

    const themeSettingsForm = document.getElementById('themeSettingsForm'); // New: Theme settings form
    const patientThemeOptionsContainer = document.getElementById('patientThemeOptions'); // New: Container for theme options

    let originalProfileData = {};

    // Helper to render individual theme options (copied from doctor-profile.js or header-manager.js)
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

    // Helper to convert hex to rgb for dynamic css variable (copied from doctor-profile.js or header-manager.js)
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
                renderPatientThemeOptions();
            }
        });
    });

    function getSafeTranslation(key) {
        return window.getTranslation ? window.getTranslation(key) : key;
    }

    function renderPatientThemeOptions() {
        if (!patientThemeOptionsContainer) return;

        // Load theme from user profile
        const loggedInUser = getLoggedInUser();
        const currentUserTheme = (loggedInUser && loggedInUser.theme) ? loggedInUser.theme : 'light';
        
        patientThemeOptionsContainer.innerHTML = `
            ${renderThemeOption('light', '🌞 ' + getSafeTranslation('lightTheme'), '#f5f5f7', '#3667A8', currentUserTheme)}
            ${renderThemeOption('dark', '🌙 ' + getSafeTranslation('darkTheme'), '#0f172a', '#818cf8', currentUserTheme)}
            ${renderThemeOption('blue', '🔵 ' + getSafeTranslation('blueTheme'), '#f0f7ff', '#0984e3', currentUserTheme)}
            ${renderThemeOption('gold', '🏆 ' + getSafeTranslation('goldTheme'), '#fdfcf5', '#D4B88C', currentUserTheme)}
        `;

        // Add event listeners for the new theme options
        patientThemeOptionsContainer.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                patientThemeOptionsContainer.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                option.querySelector('.theme-radio').checked = true;
            });
        });
    }

    function setProfileFieldsEditable(editable) {
        profileFullName.readOnly = !editable;
        profilePhone.readOnly = !editable;
        profileBirthDate.readOnly = !editable;
        profileGender.disabled = !editable;

        if (editable) {
            editProfileBtn.style.display = 'none';
            saveProfileBtn.style.display = 'inline-block';
            cancelEditBtn.style.display = 'inline-block';
        } else {
            editProfileBtn.style.display = 'inline-block';
            saveProfileBtn.style.display = 'none';
            cancelEditBtn.style.display = 'none';
        }
    }

    function loadProfileData() {
        // Find the active profile logic first from window.Luminex.getActiveProfile
        const activeProfile = getActiveProfile(); // Use imported getActiveProfile
        const loggedInUser = getLoggedInUser();

        if (!activeProfile || !loggedInUser) {
            Swal.fire({
                icon: 'error',
                title: getSafeTranslation('sessionErrorTitle'),
                text: getSafeTranslation('sessionErrorText'),
            }).then(() => window.location.href = 'login.html');
            return;
        }

        const allUsers = JSON.parse(localStorage.getItem('luminexUsers')) || [];
        // Find the data for the currently active profile (could be parent or child)
        const activeProfileData = allUsers.find(user => user.tc === activeProfile.tc);
        // Always find the full data for the logged-in parent to manage children
        const parentUserData = allUsers.find(user => user.tc === loggedInUser.tc);

        if (activeProfile.isChild) {
            // Viewing a child's profile
            profileFullName.value = activeProfile.name || '';
            profileEmail.value = 'N/A'; // Children don't have separate accounts
            profilePhone.value = 'N/A';
            profileBirthDate.value = '';
            profileGender.value = 'other';
            profileGender.disabled = true;

            // Hide and disable all editing functionality for child profiles tabs
            if (document.getElementById('personal-info')) document.getElementById('personal-info').style.display = 'block'; 
            if (document.getElementById('security')) document.getElementById('security').style.display = 'none';
            if (document.getElementById('theme-settings')) document.getElementById('theme-settings').style.display = 'none';
            if (document.getElementById('children')) document.getElementById('children').style.display = 'none';

            // Deactivate irrelevant tabs
            tabs.forEach(tab => {
                if (tab.dataset.target !== 'personal-info') {
                    tab.style.display = 'none';
                }
            });
            document.querySelector('.profile-tab[data-target="personal-info"]').classList.add('active');


            editProfileBtn.style.display = 'none';
            saveProfileBtn.style.display = 'none';
            cancelEditBtn.style.display = 'none';
            
            profileFullName.readOnly = true;
            profileEmail.readOnly = true;
            profilePhone.readOnly = true;
            profileBirthDate.readOnly = true;

        } else if (parentUserData) {
            // Viewing the parent's own profile
            profileFullName.value = parentUserData.name || '';
            profileEmail.value = parentUserData.email || '';
            profilePhone.value = parentUserData.phone || '';
            profileBirthDate.value = parentUserData.birthDate || '';
            profileGender.value = parentUserData.gender || 'other';
            
            originalProfileData = { ...parentUserData };
            
            // Show editing functionality
            sections.forEach(s => {
                s.classList.remove('active');
                s.style.display = ''; // Clear any inline styles
            });
            
            const personalInfoSection = document.getElementById('personal-info');
            if (personalInfoSection) {
                personalInfoSection.classList.add('active');
            }
            
            // Reset tab states
            tabs.forEach(t => t.classList.remove('active'));
            const personalInfoTab = document.querySelector('.profile-tab[data-target="personal-info"]');
            if (personalInfoTab) {
                personalInfoTab.classList.add('active');
            }


            renderChildrenList(parentUserData.children || []);
            setProfileFieldsEditable(false); // Start in read-only mode

            // Call initial render for theme options
            renderPatientThemeOptions();
        }
    }

    function renderChildrenList(children) {
        childrenListContainer.innerHTML = '';
        if (!children || children.length === 0) {
            childrenListContainer.innerHTML = `<p>${getSafeTranslation('noChildrenRegistered')}</p>`;
            return;
        }
        children.forEach(child => {
            const childItem = document.createElement('div');
            childItem.classList.add('child-item');
            childItem.innerHTML = `
                <span>${child.name} (T.C.: ${child.tc})</span>
                <button class="btn btn-sm btn-danger remove-child-btn" data-tc="${child.tc}">${getSafeTranslation('remove')}</button>
            `;
            childrenListContainer.appendChild(childItem);
        });
    }
    
    function updateUserData(updatedLocalUser) {
        let allUsers = JSON.parse(localStorage.getItem('luminexUsers')) || [];
        const userIndex = allUsers.findIndex(user => user.tc === updatedLocalUser.tc);
        if (userIndex !== -1) {
            allUsers[userIndex] = updatedLocalUser;
            localStorage.setItem('luminexUsers', JSON.stringify(allUsers));
        }

        const loggedInUser = getLoggedInUser();
        if (loggedInUser && loggedInUser.tc === updatedLocalUser.tc) {
            const updatedSessionUser = {
                ...loggedInUser,
                name: updatedLocalUser.name,
                children: updatedLocalUser.children || []
            };
            sessionStorage.setItem('loggedInUser', JSON.stringify(updatedSessionUser));
            
            // Also update the active profile if it was the parent
            const activeProfile = getActiveProfile();
            if (activeProfile && !activeProfile.isChild) {
                 sessionStorage.setItem('activeProfile', JSON.stringify({
                    tc: updatedLocalUser.tc,
                    name: updatedLocalUser.name,
                    isChild: false
                 }));
            }
        }
    }

    function showError(inputElement, message) {
        const formGroup = inputElement.closest('.form-group');
        if (!formGroup) return; // In case the element is not in a form-group
        formGroup.classList.add('error');
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) existingError.remove();
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

    function formatPhoneNumber(value) {
        const numbers = value.replace(/\D/g, '');
        let formatted = '';
        if (numbers.length > 0) {
            formatted += numbers.substring(0, 3);
        }
        if (numbers.length > 3) {
            formatted += ' ' + numbers.substring(3, 6);
        }
        if (numbers.length > 6) {
            formatted += ' ' + numbers.substring(6, 8);
        }
        if (numbers.length > 8) {
            formatted += ' ' + numbers.substring(8, 10);
        }
        return formatted;
    }

    // --- Event Listeners ---
    if (profilePhone) {
        profilePhone.addEventListener('input', (e) => {
            e.target.value = formatPhoneNumber(e.target.value);
        });
    }
    
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => setProfileFieldsEditable(true));
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            loadProfileData(); // This will revert to original data
            setProfileFieldsEditable(false);
            clearErrors();
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent page reload
            clearErrors();
            const loggedInUser = getLoggedInUser();
            if (!loggedInUser) return;

            let hasError = false;
            const phoneNumbers = profilePhone.value.replace(/\D/g, '');
            if (phoneNumbers.length > 0 && phoneNumbers.length !== 10) {
                showError(profilePhone.parentNode, getSafeTranslation('phoneInvalid'));
                hasError = true;
            }
            if (hasError) return;

            const allUsers = JSON.parse(localStorage.getItem('luminexUsers')) || [];
            const userIndex = allUsers.findIndex(user => user.tc === loggedInUser.tc);
            if (userIndex === -1) return;

            const updatedUser = {
                ...allUsers[userIndex],
                phone: profilePhone.value,
                birthDate: profileBirthDate.value,
                gender: profileGender.value,
                name: profileFullName.value // Also save name changes
            };
            
            updateUserData(updatedUser);
            originalProfileData = { ...updatedUser }; // Update original data to reflect changes
            setProfileFieldsEditable(false); 
            
            Swal.fire({
                icon: 'success',
                title: getSafeTranslation('profileUpdateSuccessTitle'),
                text: getSafeTranslation('profileUpdateSuccessText'),
                timer: 2000,
                showConfirmButton: false
            }).then(() => window.location.reload()); // Reload to update header
        });
    }
    
    if(passwordChangeForm) {
        passwordChangeForm.addEventListener('submit', function(event) {
            event.preventDefault();
            clearErrors();
            const loggedInUser = getLoggedInUser();
            if (!loggedInUser) return;

            const allUsers = JSON.parse(localStorage.getItem('luminexUsers')) || [];
            const userIndex = allUsers.findIndex(user => user.tc === loggedInUser.tc);
            if (userIndex === -1) return;

            const currentUser = allUsers[userIndex];
            let hasError = false;

            if (currentPasswordInput.value !== currentUser.password) {
                showError(currentPasswordInput, getSafeTranslation('currentPasswordError'));
                hasError = true;
            }
            if (newPasswordInput.value.length < 6) {
                showError(newPasswordInput, getSafeTranslation('passwordLengthError'));
                hasError = true;
            }
            if (newPasswordInput.value !== confirmNewPasswordInput.value) {
                showError(confirmNewPasswordInput, getSafeTranslation('passwordMatchError'));
                hasError = true;
            }
            if (hasError) return;

            currentUser.password = newPasswordInput.value;
            updateUserData(currentUser);
            
            Swal.fire(getSafeTranslation('profileUpdateSuccessTitle'), getSafeTranslation('passwordChangeSuccess'), 'success');
            passwordChangeForm.reset();
        });
    }

    if (addChildForm) {
        addChildForm.addEventListener('submit', function(event) {
            event.preventDefault();
            clearErrors();
            const childTc = childTcKimlikInput.value.trim();
            const childName = childFullNameInput.value.trim();

            if (!childTc || !/^\d{11}$/.test(childTc)) { 
                showError(childTcKimlikInput.parentNode, getSafeTranslation('childTcError'));
                return;
             }
            if (!childName) {
                showError(childFullNameInput.parentNode, getSafeTranslation('childNameError'));
                return;
            }

            const loggedInUser = getLoggedInUser();
            if (!loggedInUser) return;
            
            const allUsers = JSON.parse(localStorage.getItem('luminexUsers')) || [];
            const userIndex = allUsers.findIndex(user => user.tc === loggedInUser.tc);
            if (userIndex === -1) return;

            const currentUserData = allUsers[userIndex];
            if (!currentUserData.children) currentUserData.children = [];

            if (currentUserData.children.some(child => child.tc === childTc)) {
                showError(childTcKimlikInput.parentNode, getSafeTranslation('childExistsError'));
                return;
            }

            currentUserData.children.push({ tc: childTc, name: childName });
            updateUserData(currentUserData);
            renderChildrenList(currentUserData.children);
            addChildForm.reset();
            Swal.fire(getSafeTranslation('profileUpdateSuccessTitle'), getSafeTranslation('childAddedSuccess'), 'success').then(() => {
                if (window.Luminex && typeof window.Luminex.showProfileSwitcher === 'function') {
                    window.Luminex.showProfileSwitcher();
                }
            });
        });
    }

    if (childrenListContainer) {
        childrenListContainer.addEventListener('click', function(event) {
            if (event.target.classList.contains('remove-child-btn')) {
                const childTcToRemove = event.target.getAttribute('data-tc');
                
                Swal.fire({
                    title: getSafeTranslation('confirmCancelTitle'),
                    text: getSafeTranslation('deleteReviewConfirmMsg'),
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: getSafeTranslation('yesDelete'),
                    cancelButtonText: getSafeTranslation('cancel')
                }).then((result) => {
                    if (result.isConfirmed) {
                        const loggedInUser = getLoggedInUser();
                        if (!loggedInUser) return;

                        const allUsers = JSON.parse(localStorage.getItem('luminexUsers')) || [];
                        const userIndex = allUsers.findIndex(user => user.tc === loggedInUser.tc);
                        if (userIndex === -1) return;

                        const currentUserData = allUsers[userIndex];
                        currentUserData.children = currentUserData.children.filter(child => child.tc !== childTcToRemove);
                        
                        updateUserData(currentUserData);
                        renderChildrenList(currentUserData.children);

                        Swal.fire(getSafeTranslation('deleted'), getSafeTranslation('childDeletedSuccess'), 'success');
                    }
                });
            }
        });
    }

    // --- Theme Settings Form Listener ---
    if (themeSettingsForm) {
        themeSettingsForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const selectedTheme = document.querySelector('input[name="userTheme"]:checked').value;
            
            // Update LoggedIn User in Session
            const loggedInUser = getLoggedInUser();
            if (loggedInUser) {
                loggedInUser.theme = selectedTheme;
                setLoggedInUser(loggedInUser); // Correctly update session storage
                
                // Update Persistent User Data
                const allUsers = JSON.parse(localStorage.getItem('luminexUsers')) || [];
                const userIndex = allUsers.findIndex(u => u.tc === loggedInUser.tc);
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
                title: getSafeTranslation('themeUpdateSuccess')
            });
        });
    }

    // --- Initial Load ---
    loadProfileData();
});
