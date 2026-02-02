import {
    getLuminexUsers,
    getLoggedInUser,
    setLoggedInUser,
    removeLoggedInUser,
    getActiveProfile,
    setActiveProfile,
    removeActiveProfile
} from './utils/storage-utils.js';
import { applyAdminTheme } from './utils/header-manager.js'; // Import applyAdminTheme

// Global object to hold session management functions
window.Luminex = {};

(function(Luminex) {
    /**
     * Gets the currently active profile from sessionStorage.
     * Falls back to the logged-in user if no active profile is set.
     * @returns {object | null} The active profile object or null if not logged in.s
     */
    Luminex.getActiveProfile = function() {
        const activeProfile = getActiveProfile();
        const loggedInUser = getLoggedInUser();
        return activeProfile || loggedInUser;
    };

    /**
     * Sets the active profile in sessionStorage and reloads the page.
     * @param {object} profile - The profile object to set as active.
     */
    function _setActiveProfileAndReload(profile) { // Renamed to avoid conflict with imported setActiveProfile
        setActiveProfile(profile);
        // Reload the page to ensure all components use the new active profile
        window.location.reload();
    }

    /**
     * Shows a modal to allow the user to switch between their profile and children's profiles.
     */
    Luminex.showProfileSwitcher = function() {
        const loggedInUser = getLoggedInUser();
        if (!loggedInUser) return;

        const allUsers = getLuminexUsers();
        const fullUserData = allUsers.find(user => user.tc === loggedInUser.tc);
        if (!fullUserData) return;

        const children = fullUserData.children || [];
        const activeProfile = Luminex.getActiveProfile();

        // Helper to get initials
        const getInitials = (name) => {
            const names = name.split(' ');
            return names.length > 1 
                ? (names[0][0] + names[names.length - 1][0]).toUpperCase() 
                : name[0].toUpperCase();
        };

        let profilesHtml = '<div class="profile-switcher-grid">';
        
        // Parent profile card
        const isParentActive = activeProfile.tc === fullUserData.tc;
        profilesHtml += `
            <div class="profile-card ${isParentActive ? 'selected' : ''}" data-tc="${fullUserData.tc}" data-ischild="false" data-name="${fullUserData.name}">
                <div class="card-avatar parent">
                    ${getInitials(fullUserData.name)}
                    <div class="icon-badge"><i class="fas fa-user-shield"></i></div>
                </div>
                <div class="card-info">
                    <h3>${fullUserData.name}</h3>
                    <span class="badge parent">Ana Hesap</span>
                </div>
                ${isParentActive ? '<div class="selected-indicator"><i class="fas fa-check"></i></div>' : ''}
            </div>
        `;

        // Children profile cards
        children.forEach(child => {
            const isChildActive = activeProfile.tc === child.tc;
            profilesHtml += `
                <div class="profile-card ${isChildActive ? 'selected' : ''}" data-tc="${child.tc}" data-ischild="true" data-name="${child.name}">
                    <div class="card-avatar child">
                        ${getInitials(child.name)}
                        <div class="icon-badge"><i class="fas fa-child"></i></div>
                    </div>
                    <div class="card-info">
                        <h3>${child.name}</h3>
                        <span class="badge child">Çocuk Hesabı</span>
                    </div>
                    ${isChildActive ? '<div class="selected-indicator"><i class="fas fa-check"></i></div>' : ''}
                </div>
            `;
        });
        profilesHtml += '</div>';

        Swal.fire({
            title: 'Profil Değiştir',
            text: 'İşlem yapmak istediğiniz profili seçiniz',
            html: profilesHtml,
            showCancelButton: false,
            showConfirmButton: false,
            showCloseButton: true,
            width: '600px',
            padding: '2em',
            background: '#fff',
            customClass: {
                popup: 'modern-profile-popup',
                title: 'modern-profile-title',
                htmlContainer: 'modern-profile-container'
            },
            didOpen: () => {
                const popup = Swal.getPopup();
                popup.querySelectorAll('.profile-card').forEach(card => {
                    card.addEventListener('click', () => {
                        // Visual feedback immediately
                        popup.querySelectorAll('.profile-card').forEach(c => c.classList.remove('selected'));
                        card.classList.add('selected');

                        const selectedTc = card.dataset.tc;
                        const isChild = card.dataset.ischild === 'true';
                        const name = card.dataset.name;

                        const selectedProfileData = {
                            tc: selectedTc,
                            name: name,
                            isChild: isChild
                        };
                        
                        // Short delay for visual effect
                        setTimeout(() => {
                             _setActiveProfileAndReload(selectedProfileData);
                             Swal.close();
                        }, 300);
                    });
                });
            }
        });
    };

    // --- Initial Script Execution ---
    document.addEventListener('DOMContentLoaded', function() {
        let loggedInUser = getLoggedInUser();

        // Apply theme based on user preference or local storage
        // This theme application logic is handled by the inline script on login/register pages
        // to prevent flickering.
        // let themeToApply = 'light'; // Default theme
        // if (loggedInUser && loggedInUser.theme) {
        //     themeToApply = loggedInUser.theme;
        // } else {
        //     // Fallback to global theme setting if user-specific theme not found
        //     themeToApply = localStorage.getItem('landingTheme') || 'light';
        // }
        // applyAdminTheme(themeToApply); // Use the imported function to apply theme

        // Ensure loggedInUser (from sessionStorage) is always in the latest format
        if (loggedInUser && (loggedInUser.tcKimlik || loggedInUser.fullName)) {
            const allUsers = getLuminexUsers(); // This call triggers migration in storage-utils
            // Try to find the user by new 'tc' or old 'tcKimlik'
            const migratedUser = allUsers.find(user => user.tc === loggedInUser.tc || user.tcKimlik === loggedInUser.tcKimlik);
            if (migratedUser) {
                // Update loggedInUser in sessionStorage to the migrated format, preserving other props like theme/role
                loggedInUser = { 
                    ...loggedInUser, 
                    tc: migratedUser.tc, 
                    name: migratedUser.name,
                    // Remove old keys
                    tcKimlik: undefined,
                    fullName: undefined
                };
                setLoggedInUser(loggedInUser); 
            } else {
                // User not found in localStorage after migration, means user might be invalid or deleted
                removeLoggedInUser();
                loggedInUser = null;
            }
        }

        // 1. Security Check: If no one is logged in, redirect to login.html
        if (!loggedInUser) {
            // Allow access to public pages without logging error
            if (!window.location.pathname.endsWith('register.html') && 
                !window.location.pathname.endsWith('forgot-password.html') &&
                !window.location.pathname.endsWith('login.html') &&
                !window.location.pathname.endsWith('index.html') &&
                !window.location.pathname.endsWith('doctors.html') &&
                !window.location.pathname.endsWith('contact.html')) { 
                 
                 console.warn("Access denied. Redirecting to login page.");
                 // Mevcut parametreleri (symptom checker vs.) koruyarak yönlendir
                 const currentParams = window.location.search; 
                 window.location.href = 'login.html' + currentParams;
            }
            return; // Stop further execution for non-logged-in users
        }

        // 2. Initial Setup: If there's a logged-in user but no active profile, set the active profile to be the logged-in user.
        const activeProfile = getActiveProfile();
        if (!activeProfile) {
            console.log("No active profile found. Setting to logged-in user.");
            const initialProfile = {
                tc: loggedInUser.tc,
                name: loggedInUser.name,
                isChild: false // The parent account is not a child
            };
            setActiveProfile(initialProfile);
        }
    });

})(window.Luminex);