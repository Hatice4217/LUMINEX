// js/utils/header-manager.js
import {
    removeLoggedInUser,
    removeActiveProfile,
    getActiveProfile,
    getLoggedInUser,
    setLoggedInUser,
    getLocalStorageItem,
    setLocalStorageItem,
    getLuminexNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from './storage-utils.js';
import { dummyNotifications } from './data.js';

// Default Admin Settings
const defaultAdminSettings = {
    siteTitle: 'LUMINEX Sağlık Grubu',
    maintenanceMode: 'off', 
    emailNotifications: true,
    smsNotifications: false,
    autoApproveNewUsers: false,
    backupFrequency: 'weekly', 
    adminTheme: 'light' 
};

// --- Notification Widget Logic ---
function updateNotificationBadge() {
    const loggedInUser = getLoggedInUser();
    if (!loggedInUser) return;
    
    const userRole = loggedInUser.role || 'patient';
    const unreadCount = getUnreadNotificationCount(userRole);
    const badge = document.querySelector('.notification-badge');
    
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

function renderNotificationDropdown() {
    const loggedInUser = getLoggedInUser();
    if (!loggedInUser) return;

    const dropdown = document.querySelector('.notification-dropdown');
    if (!dropdown) return;

    const notifications = getLuminexNotifications().filter(n => {
        if (loggedInUser.role === 'admin') return n.role === 'admin';
        if (loggedInUser.role === 'doctor') return n.role === 'doctor';
        return n.role === 'patient' || !n.role;
    });
    
    // Sort: Unread first, then by date (reverse logic for now as data is appended usually)
    const sortedNotifications = notifications.reverse();
    const latestNotifications = sortedNotifications.slice(0, 5); 

    let html = `
        <div class="dropdown-header" style="padding: 15px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <h4 style="margin: 0; font-size: 1rem; color: var(--primary-color);">Bildirimler</h4>
            <span style="font-size: 0.8rem; color: var(--primary-color); cursor: pointer;" id="markAllReadBtnDropdown">Tümünü Okundu İşaretle</span>
        </div>
        <div class="dropdown-content" style="max-height: 300px; overflow-y: auto;">
    `;

    if (latestNotifications.length === 0) {
        html += `<div style="padding: 20px; text-align: center; color: var(--text-light);">Bildiriminiz bulunmamaktadır.</div>`;
    } else {
        latestNotifications.forEach(notif => {
            const translatedMessage = window.getTranslation ? window.getTranslation(notif.message) : notif.message;
            
            // Translate date
            let translatedDate = notif.date;
            if (window.getTranslation) {
                translatedDate = translatedDate.replace('today', window.getTranslation('today'));
                translatedDate = translatedDate.replace('yesterday', window.getTranslation('yesterday'));
            }

            html += `
                <div class="notification-item ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}" style="padding: 15px; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background 0.2s; position: relative; ${notif.read ? 'opacity: 0.7;' : 'background: rgba(0, 184, 148, 0.05); border-left: 3px solid #00b894;'}">
                    ${!notif.read ? '<span style="position: absolute; top: 15px; right: 15px; width: 8px; height: 8px; background-color: #ff4757; border-radius: 50%;"></span>' : ''}
                    <div style="font-size: 0.9rem; margin-bottom: 5px; color: var(--text-color); ${!notif.read ? 'font-weight: 600; padding-right: 15px;' : ''}">${translatedMessage}</div>
                    <div style="font-size: 0.75rem; color: var(--text-light); text-align: right;">${translatedDate}</div>
                </div>
            `;
        });
    }

    html += `
        </div>
        <div class="dropdown-footer" style="padding: 10px; text-align: center; border-top: 1px solid var(--border-color);">
            <a href="notifications.html" style="color: var(--primary-color); font-weight: 500; font-size: 0.9rem; text-decoration: none;">Tümünü Gör</a>
        </div>
    `;

    dropdown.innerHTML = html;

    // Attach listeners
    const markAllBtn = dropdown.querySelector('#markAllReadBtnDropdown');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            markAllNotificationsAsRead(loggedInUser.role || 'patient');
        });
    }

    dropdown.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
             const id = item.dataset.id;
             markNotificationAsRead(id);
             // Optional: Navigate based on type
             window.location.href = 'notifications.html'; 
        });
    });
}


function setFavicon() {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.href = 'site-ikonu.png';
    link.type = 'image/png';
}

function updateSiteTitle(title) {
    document.title = title;
}

function updateActiveMenuItem() {
    const currentPath = window.location.pathname.split('/').pop() || 'login.html';
    const menuItems = document.querySelectorAll('.side-menu ul li a');
    
    menuItems.forEach(item => {
        if (item.getAttribute('href') === currentPath) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}


function setupSidebarToggler() {
    const toggleButton = document.querySelector('.sidebar-toggle-wrapper .sidebar-toggle-button');
    const sideMenu = document.querySelector('.side-menu');
    const storageKey = 'sidebarCollapsed';

    if (localStorage.getItem(storageKey) === 'true') {
        document.documentElement.classList.add('sidebar-is-collapsed');
    }

    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            const isCollapsed = document.documentElement.classList.toggle('sidebar-is-collapsed');
            localStorage.setItem(storageKey, isCollapsed);
        });
    }

    if (sideMenu) {
        sideMenu.addEventListener('click', function(e) {
            const isInteractiveClick = e.target.closest('a, button');
            if (!isInteractiveClick) {
                if (toggleButton) {
                    toggleButton.click();
                }
            }
        });
    }
}

function setupThemeToggler() {
    const themeToggleButton = document.getElementById('themeToggleButton');
    if (!themeToggleButton) return;

    const themeIcon = themeToggleButton.querySelector('i');

    // Sync with global landingTheme preference on load
    const savedTheme = localStorage.getItem('landingTheme') || 'light';

    if (savedTheme === 'dark') {
        document.body.classList.add('theme-dark');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
    } else {
        document.body.classList.remove('theme-dark');
        if (themeIcon) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }

    themeToggleButton.addEventListener('click', () => {
        const isCurrentlyDark = document.body.classList.contains('theme-dark');
        const newTheme = isCurrentlyDark ? 'light' : 'dark';

        // Save to global preference
        localStorage.setItem('landingTheme', newTheme);

        applyAdminTheme(newTheme);

        if (newTheme === 'dark') {
            if (themeIcon) {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            }
        } else {
            if (themeIcon) {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            }
        }

        const loggedInUser = getLoggedInUser();
        if (loggedInUser) {
            loggedInUser.theme = newTheme;
            setLoggedInUser(loggedInUser);
            const allUsers = getLocalStorageItem('luminexUsers') || [];
            const userIndex = allUsers.findIndex(u => u.id === loggedInUser.id);
            if (userIndex !== -1) {
                allUsers[userIndex].theme = newTheme;
                setLocalStorageItem('luminexUsers', allUsers);
            }
        }
    });
}


export function applyAdminTheme(theme) {
    document.body.classList.remove('theme-dark', 'theme-blue', 'theme-gold');
    if (theme === 'dark') {
        document.body.classList.add('theme-dark');
    } else if (theme === 'blue') {
        document.body.classList.add('theme-blue');
    } else if (theme === 'gold') {
        document.body.classList.add('theme-gold');
    }

    const themeToggleButton = document.getElementById('themeToggleButton');
    if (themeToggleButton) {
        const themeIcon = themeToggleButton.querySelector('i');
        if (themeIcon) {
            if (theme === 'dark') {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            } else {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            }
        }
    }
}

// CACHE-BUST: v2.0 - Helper function to get user name from various formats
function getUserName(user) {
    if (!user) return null;
    if (user.name) return user.name;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    return null;
}

export function setupHeader() {
    setupSidebarToggler();
    setupThemeToggler();

    const activeProfile = getActiveProfile();
    const loggedInUser = getLoggedInUser();
    const currentUser = activeProfile || loggedInUser;


    if (!currentUser) return;

    // --- Notification Widget Setup ---
    const notificationBell = document.querySelector('.notification-bell');
    const notificationDropdown = document.querySelector('.notification-dropdown');

    if (notificationBell && notificationDropdown) {
        // Initial Render
        updateNotificationBadge();

        // Toggle Dropdown
        notificationBell.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = notificationDropdown.classList.contains('show');

            // Close others
            document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('show', 'active'));
            document.querySelectorAll('.lang-switcher').forEach(d => d.classList.remove('active'));

            if (!isActive) {
                renderNotificationDropdown();
                notificationDropdown.classList.add('show');
            } else {
                notificationDropdown.classList.remove('show');
            }
        });

        // Listen for updates
        window.addEventListener('notificationUpdated', () => {
            updateNotificationBadge();
            if (notificationDropdown.classList.contains('show')) {
                renderNotificationDropdown();
            }
        });
    }

    // --- Language Switcher Setup ---
    const langSwitcher = document.querySelector('.lang-switcher');
    if (langSwitcher) {
        const selectedLang = langSwitcher.querySelector('.selected-lang');
        const langOptionsDropdown = langSwitcher.querySelector('.lang-options');
        const langOptions = langSwitcher.querySelectorAll('.lang-options li');

        selectedLang.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = langSwitcher.classList.toggle('active');

            // Manually show/hide dropdown
            if (langOptionsDropdown) {
                langOptionsDropdown.style.display = isActive ? 'block' : 'none';
            }

            // Close notification dropdown
            if (notificationDropdown) {
                notificationDropdown.classList.remove('show', 'active');
            }
        });

        // Dil seçeneklerine tıklandığında
        langOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const selectedLangCode = option.getAttribute('data-lang');

                // Dil değiştir
                if (window.setLanguage) {
                    window.setLanguage(selectedLangCode);
                    localStorage.setItem('language', selectedLangCode);
                }

                // Dropdown'ı kapat
                langSwitcher.classList.remove('active');
                if (langOptionsDropdown) {
                    langOptionsDropdown.style.display = 'none';
                }
            });
        });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.notification-dropdown') && !e.target.closest('.notification-bell')) {
            if (notificationDropdown) {
                notificationDropdown.classList.remove('show', 'active');
            }
        }
        if (!e.target.closest('.lang-switcher')) {
            if (langSwitcher) {
                langSwitcher.classList.remove('active');
                const dropdown = langSwitcher.querySelector('.lang-options');
                if (dropdown) {
                    dropdown.style.display = 'none';
                }
            }
        }
    });
    });

    const mainLogoLink = document.getElementById('mainLogoLink');
    if (mainLogoLink) {
        mainLogoLink.href = loggedInUser.role === 'admin' ? 'admin-dashboard.html' : 'dashboard.html';
    }

    const welcomeMessageElement = document.getElementById('welcomeMessage');
    if (welcomeMessageElement) {
        if (loggedInUser.role === 'doctor') {
            welcomeMessageElement.textContent = `Hoş geldiniz, ${loggedInUser.name}!`;
            welcomeMessageElement.style.fontSize = '1rem';
            welcomeMessageElement.style.fontWeight = '500';
            welcomeMessageElement.style.color = 'var(--text-color)';
        } else if (loggedInUser.role === 'admin') {
            const now = new Date();
            const hour = now.getHours();
            let greeting = "Hoş Geldiniz";

            if (hour >= 5 && hour < 12) {
                greeting = "Günaydın";
            } else if (hour >= 12 && hour < 18) {
                greeting = "İyi günler";
            } else if (hour >= 18 && hour < 22) {
                greeting = "İyi akşamlar";
            } else {
                greeting = "İyi geceler";
            }

            welcomeMessageElement.textContent = `${greeting}, Mustafa Şarlak`;
            welcomeMessageElement.style.fontSize = '1rem';
            welcomeMessageElement.style.fontWeight = '500';
            welcomeMessageElement.style.color = 'var(--text-color)';
            welcomeMessageElement.style.cursor = 'default';
        } else {
            const nameToDisplay = getUserName(currentUser) || getUserName(loggedInUser);
            if (!nameToDisplay) {
                console.warn("User name is not available to display. Showing generic greeting.");
                welcomeMessageElement.textContent = "Hoş Geldiniz";
                welcomeMessageElement.style.fontSize = '1rem';
                welcomeMessageElement.style.fontWeight = '500';
                welcomeMessageElement.style.color = 'var(--text-color)';
                // Skip profile pill creation and continue to menu setup
            } else {
                const isChild = currentUser.isChild || false;

                // Cinsiyet tespiti
                const detectGender = (name) => {
                    const firstName = name.split(' ')[0].toLowerCase();
                    const femaleNames = ['ayşe', 'fatma', 'zeynep', 'elife', 'zeyneb', 'hatice', 'meryem', 'sultan', 'şükriye', 'safiye', 'emin', 'ümmü', 'zeynep', 'esra', 'gülşah', 'büşra', 'betül', 'nur', 'selin', 'cera', 'sude', 'ece', 'sinem', 'deniz', 'nil', 'naz', 'nazlı', 'belinay', 'elin', 'selin', 'balım', 'begüm'];
                    const maleNames = ['ahmet', 'mehmet', 'mustafa', 'ali', 'hasan', 'hüseyin', 'ibrahim', 'osman', 'murat', 'can', 'emre', 'burak', 'arda', 'serkan', 'berk', 'mert', 'kaan', 'kerem', 'yusuf', 'eyüp', 'ömer', 'abdullah', 'muhammed', 'yunus', 'veli', 'rıza', 'nuri', 'kemal', 'tamer', 'erkam'];

                    if (femaleNames.includes(firstName)) return 'female';
                    if (maleNames.includes(firstName)) return 'male';
                    return 'neutral';
                };

                const genderClass = isChild ? 'neutral' : detectGender(nameToDisplay);

                const names = nameToDisplay.split(' ');
                const initials = names.length > 1
                    ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
                    : nameToDisplay[0].toUpperCase();

                const profilePillHtml = `
                    <div class="profile-pill ${isChild ? 'child' : ''}" onclick="Luminex.showProfileSwitcher()">
                        <div class="profile-avatar ${genderClass}">${initials}</div>
                        <div class="profile-info">
                            <span class="name">${nameToDisplay}</span>
                            <span class="role-badge">${isChild ? 'Çocuk Hesabı' : 'Ana Hesap'}</span>
                        </div>
                        <i class="fas fa-chevron-down toggle-icon"></i>
                    </div>
                `;

                welcomeMessageElement.innerHTML = profilePillHtml;
                const profilePillElement = welcomeMessageElement.querySelector('.profile-pill');
                if (profilePillElement) {
                    profilePillElement.style.cursor = 'pointer';
                    profilePillElement.addEventListener('click', () => {
                        if (window.Luminex && window.Luminex.showProfileSwitcher) {
                            window.Luminex.showProfileSwitcher();
                        } else {
                            console.error("Luminex.showProfileSwitcher is not defined.");
                        }
                    });
                }
            }
        }
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            Swal.fire({
                title: 'Oturumu Kapat',
                text: "Çıkış yapmak istediğinize emin misiniz?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#ff7675',
                cancelButtonColor: '#b2bec3',
                confirmButtonText: 'Evet, Çıkış Yap',
                cancelButtonText: 'İptal',
                customClass: {
                    popup: 'modern-swal-popup',
                    confirmButton: 'modern-swal-confirm-button'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const styleSheet = document.createElement("style");
                    styleSheet.innerText = `
                        .logout-overlay {
                            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                            background: rgba(5, 10, 20, 0.95);
                            backdrop-filter: blur(15px);
                            z-index: 99999;
                            display: flex; flex-direction: column; align-items: center; justify-content: center;
                            opacity: 0; transition: opacity 0.8s ease-in-out;
                            font-family: 'Exo 2', sans-serif;
                        }
                        .logout-content { text-align: center; transform: translateY(20px); transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1); }
                        .logout-logo-container { width: 100px; height: 100px; margin: 0 auto 30px; position: relative; display: flex; align-items: center; justify-content: center; }
                        .logout-logo-circle { width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, #004e92, #000428); box-shadow: 0 0 30px rgba(0, 78, 146, 0.4); display: flex; align-items: center; justify-content: center; animation: pulseLogo 2s infinite; }
                        .logout-logo-text { font-size: 3rem; font-weight: 700; color: white; letter-spacing: 4px; text-shadow: 0 0 20px rgba(255,255,255,0.2); margin-bottom: 10px; }
                        .logout-message { font-family: 'Poppins', sans-serif; font-size: 1.5rem; color: rgba(255,255,255,0.9); font-weight: 300; margin-bottom: 40px; }
                        .logout-loader-container { width: 300px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; position: relative; }
                        .logout-loader-bar { position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: linear-gradient(90deg, #00b894, #0984e3); box-shadow: 0 0 10px rgba(0, 184, 148, 0.5); transition: width 2s cubic-bezier(0.4, 0, 0.2, 1); }
                        .logout-status { font-family: 'Poppins', sans-serif; font-size: 0.85rem; color: rgba(255,255,255,0.5); margin-top: 15px; letter-spacing: 1px; text-transform: uppercase; }
                        @keyframes pulseLogo { 0% { box-shadow: 0 0 0 0 rgba(0, 78, 146, 0.4); } 70% { box-shadow: 0 0 0 20px rgba(0, 78, 146, 0); } 100% { box-shadow: 0 0 0 0 rgba(0, 78, 146, 0); } }
                    `;
                    document.head.appendChild(styleSheet);

                    const overlay = document.createElement('div');
                    overlay.className = 'logout-overlay';
                    const userName = loggedInUser.role === 'admin' ? 'Mustafa Şarlak' : currentUser.name.split(' ')[0];
                    overlay.innerHTML = `
                        <div class="logout-content">
                            <div class="logout-logo-container">
                                <div class="logout-logo-circle">
                                    <i class="fas fa-shield-alt" style="font-size: 40px; color: white;"></i>
                                </div>
                            </div>
                            <div class="logout-logo-text">LUMINEX</div>
                            <div class="logout-message">Görüşmek Üzere, <span style="color: #00b894; font-weight: 500;">${userName}</span></div>
                            <div class="logout-loader-container">
                                <div class="logout-loader-bar"></div>
                            </div>
                            <div class="logout-status">Oturum Güvenle Kapatılıyor...</div>
                        </div>
                    `;
                    document.body.appendChild(overlay);

                    requestAnimationFrame(() => {
                        overlay.style.opacity = '1';
                        overlay.querySelector('.logout-content').style.transform = 'translateY(0)';
                        setTimeout(() => {
                            overlay.querySelector('.logout-loader-bar').style.width = '100%';
                        }, 100);
                    });

                    setTimeout(() => {
                        removeLoggedInUser();
                        removeActiveProfile();
                        window.location.href = 'index.html';
                    }, 2200);
                }
            });
        });
    }

    const settingsButton = document.querySelector('.fa-cog');
    if (settingsButton) {
        settingsButton.addEventListener('click', function() {
            if (!loggedInUser) return;
            if (loggedInUser.role === 'admin') {
                window.openUserSettings();
            } else if (loggedInUser.role === 'doctor') {
                window.location.href = 'doctor-profile.html';
            } else { 
                window.location.href = 'profile.html'; 
            }
        });
    }

    const dynamicSideMenu = document.getElementById('dynamicSideMenu');
    if (dynamicSideMenu) {
        let menuHtml = '';
        if (loggedInUser.role === 'admin') {
            menuHtml = `
                <li><a href="admin-dashboard.html"><i class="fas fa-tachometer-alt"></i> <span data-lang="adminDashboardSidebar">Kontrol Paneli</span></a></li>
                <li><a href="notifications.html"><i class="fas fa-bell"></i> <span data-lang="notificationsTitle">Bildirimler</span></a></li>
                <li><a href="admin-users.html"><i class="fas fa-users"></i> <span data-lang="adminUsersSidebar">Kullanıcılar</span></a></li>
                <li><a href="admin-hospitals.html"><i class="fas fa-hospital"></i> <span data-lang="adminHospitalsSidebar">Hastaneler</span></a></li>
                <li><a href="admin-departments.html"><i class="fas fa-building"></i> <span data-lang="adminDepartmentsSidebar">Departmanlar</span></a></li>
                <li><a href="admin-reports.html"><i class="fas fa-chart-line"></i> <span data-lang="adminReportsSidebar">Raporlar</span></a></li>
                <li><a href="contact.html"><i class="fas fa-headset"></i> <span data-lang="contactSupportSidebar">İletişim / Destek</span></a></li>
            `;
        } else if (loggedInUser.role === 'doctor') {
            menuHtml = `
                <li><a href="doctor-dashboard.html"><i class="fas fa-tachometer-alt"></i> <span data-lang="dashboardSidebar">Kontrol Paneli</span></a></li>
                <li><a href="notifications.html"><i class="fas fa-bell"></i> <span data-lang="notificationsTitle">Bildirimler</span></a></li>
                <li><a href="doctor-appointments.html"><i class="fas fa-calendar-check"></i> <span data-lang="myAppointmentsSidebar">Randevularım</span></a></li>
                <li><a href="doctor-availability.html"><i class="fas fa-clock"></i> <span data-lang="doctorAvailabilitySidebar">Müsaitlik</span></a></li>
                <li><a href="doctor-profile.html"><i class="fas fa-user-md"></i> <span data-lang="profileSidebar">Profilim</span></a></li>
                <li><a href="doctor-reviews.html"><i class="fas fa-star"></i> <span data-lang="myReviewsSidebar">Değerlendirmelerim</span></a></li>
                <li><a href="doctor-send-message.html"><i class="fas fa-paper-plane"></i> <span data-lang="doctorSendMessageSidebar">Hastaya Mesaj Gönder</span></a></li>
                <li><a href="doctor-sent-messages.html"><i class="fas fa-envelope-open-text"></i> <span data-lang="doctorSentMessagesSidebar">Gönderilen Mesajlar</span></a></li>
                <li><a href="contact.html"><i class="fas fa-headset"></i> <span data-lang="contactSupportSidebar">İletişim / Destek</span></a></li>
            `;
        } else {
            menuHtml = `
                <li><a href="dashboard.html"><i class="fas fa-tachometer-alt"></i> <span data-lang="dashboardSidebar">Kontrol Paneli</span></a></li>
                <li><a href="my-appointments.html"><i class="fas fa-calendar-alt"></i> <span data-lang="myAppointmentsSidebar">Randevularım</span></a></li>
                <li><a href="doctors.html"><i class="fas fa-user-md"></i> <span data-lang="doctorsBranchesSidebar">Doktorlar / Branşlar</span></a></li>
                <li><a href="prescriptions.html"><i class="fas fa-prescription-bottle-alt"></i> <span data-lang="prescriptionsSidebar">Reçetelerim</span></a></li>
                <li><a href="health-history.html"><i class="fas fa-notes-medical"></i> <span data-lang="healthHistorySidebar">Sağlık Geçmişim</span></a></li>
                <li><a href="payments.html"><i class="fas fa-credit-card"></i> <span data-lang="paymentsSidebar">Ödemeler & Faturalar</span></a></li>
                <li><a href="family-accounts.html"><i class="fas fa-users"></i> <span data-lang="familyAccountsSidebar">Bağlı Hesaplar</span></a></li>
                <li><a href="my-reviews.html"><i class="fas fa-star"></i> <span data-lang="myReviewsSidebar">Değerlendirmelerim</span></a></li>
                <li><a href="feedback.html"><i class="fas fa-comment-dots"></i> <span data-lang="feedbackSidebar">Geri Bildirim</span></a></li>
                <li><a href="contact.html"><i class="fas fa-headset"></i> <span data-lang="contactSupportSidebar">İletişim / Destek</span></a></li>
            `;
        }
        dynamicSideMenu.innerHTML = menuHtml;
    }

    updateActiveMenuItem();
}
// Global click listener to close dropdown
document.addEventListener('click', (e) => {
    const dropdown = document.querySelector('.notification-dropdown');
    if (dropdown && dropdown.classList.contains('active')) {
        if (!e.target.closest('.notification-dropdown') && !e.target.closest('.fa-bell')) {
            dropdown.classList.remove('active');
        }
    }
});
