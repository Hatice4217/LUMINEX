import { setupHeader } from './utils/header-manager.js';
import { 
    getLuminexNotifications, 
    getLoggedInUser, 
    markNotificationAsRead, 
    markAllNotificationsAsRead 
} from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', () => {
    setupHeader();

    // --- Cleanup Old Data ---
    const storedNotifs = localStorage.getItem('luminexNotifications');
    if (storedNotifs) {
        try {
            const notifs = JSON.parse(storedNotifs);
            const hasOldData = notifs.some(n => n.message && n.message.includes(' ')); // Translatable keys don't have spaces
            if (hasOldData) {
                localStorage.removeItem('luminexNotifications');
                window.location.reload();
                return;
            }
        } catch(e) {}
    }

    const elements = {
        listContainer: document.getElementById('notifications-list'),
        filterTabs: document.querySelectorAll('.filter-tab'),
        markAllReadBtn: document.getElementById('markAllReadBtn'),
        searchInput: document.getElementById('notifSearch'),
        categorySelect: document.getElementById('categoryFilter')
    };

    let currentFilter = 'all'; // 'all' or 'unread'
    let searchQuery = '';
    let currentCategory = 'all';

    function getNotificationIcon(type) {
        switch(type) {
            case 'appointment': return 'fa-calendar-check';
            case 'test_result': return 'fa-microscope';
            case 'alert': return 'fa-exclamation-circle';
            case 'system': return 'fa-cog';
            case 'warning': return 'fa-exclamation-triangle';
            case 'info': return 'fa-info-circle';
            case 'admin-reply': return 'fa-envelope';
            default: return 'fa-bell';
        }
    }

    function renderNotifications() {
        const loggedInUser = getLoggedInUser();
        if (!loggedInUser) {
            elements.listContainer.innerHTML = `<p>${window.getTranslation ? window.getTranslation('loginToSeeNotifications') : 'Lütfen giriş yapın.'}</p>`;
            return;
        }

        const allNotifications = getLuminexNotifications();
        const userNotifications = allNotifications.filter(n => {
            if (loggedInUser.role === 'admin') return n.role === 'admin';
            if (loggedInUser.role === 'doctor') return n.role === 'doctor';
            return n.role === 'patient' || !n.role;
        });

        // Clone and Sort by ID (newest first)
        let filteredNotifs = [...userNotifications].reverse();
        
        // 1. Filter by Read/Unread
        if (currentFilter === 'unread') {
            filteredNotifs = filteredNotifs.filter(n => !n.read);
        }

        // 2. Filter by Category
        if (currentCategory !== 'all') {
            filteredNotifs = filteredNotifs.filter(n => n.type === currentCategory);
        }

        // 3. Filter by Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredNotifs = filteredNotifs.filter(n => n.message.toLowerCase().includes(query));
        }

        elements.listContainer.innerHTML = ''; // Clear previous content

        if (filteredNotifs.length === 0) {
            let emptyStateMessage = (window.getTranslation ? window.getTranslation('noNotificationsEver') : 'Henüz bildiriminiz bulunmuyor.');
            
            if (searchQuery || currentCategory !== 'all') {
                emptyStateMessage = (window.getTranslation ? window.getTranslation('noNotificationsFound') : "Aradığınız kriterlere uygun bildirim bulunamadı.");
            } else if (currentFilter === 'unread') {
                emptyStateMessage = (window.getTranslation ? window.getTranslation('noUnreadNotifications') : 'Okunmamış bildiriminiz yok.');
            }
            
            elements.listContainer.innerHTML = `
                <div class="card no-results-card" style="text-align: center; padding: 40px; color: var(--text-light);">
                    <i class="far fa-bell-slash" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.5;"></i>
                    <p>${emptyStateMessage}</p>
                </div>`;
            return;
        }

        filteredNotifs.forEach(notification => {
            const item = document.createElement('div');
            item.className = `notification-full-item ${notification.read ? 'read' : 'unread'}`;
            const notifId = notification.id || `temp-${Math.random().toString(36).substr(2, 9)}`;
            item.dataset.id = notifId;

            // Translate message
            const translatedMessage = window.getTranslation ? window.getTranslation(notification.message) : notification.message;
            
            // Translate date (e.g., "today, 10:45" -> "Today, 10:45")
            let translatedDate = notification.date;
            if (window.getTranslation) {
                translatedDate = translatedDate.replace('today', window.getTranslation('today'));
                translatedDate = translatedDate.replace('yesterday', window.getTranslation('yesterday'));
            }

            item.innerHTML = `
                <div class="notif-full-icon ${notification.type || 'info'}">
                    <i class="fas ${getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notif-full-content" style="position: relative;">
                    ${!notification.read ? '<span class="red-dot-indicator" style="position: absolute; top: 15px; right: 15px; width: 10px; height: 10px; background-color: #ff4757; border-radius: 50%;"></span>' : ''}
                    <p style="${!notification.read ? 'font-weight: 600;' : ''}">${translatedMessage}</p>
                    <div class="notif-full-time">
                        <i class="far fa-clock"></i> ${translatedDate}
                    </div>
                </div>
                <div class="notif-full-actions">
                    ${!notification.read ? `
                    <button class="mark-as-read-btn" title="${window.getTranslation ? window.getTranslation('markAsRead') : 'Okundu İşaretle'}">
                        <i class="fas fa-check-circle"></i>
                    </button>` : `<span style="color: var(--primary-color); font-size: 0.8rem;"><i class="fas fa-check-double"></i> ${window.getTranslation ? window.getTranslation('alreadyRead') : 'Okundu'}</span>`}
                </div>
            `;
            elements.listContainer.appendChild(item);
        });
    }

    // --- Event Listeners ---
    elements.filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderNotifications();
        });
    });

    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderNotifications();
        });
    }

    if (elements.categorySelect) {
        elements.categorySelect.addEventListener('change', (e) => {
            currentCategory = e.target.value;
            renderNotifications();
        });
    }

    if (elements.markAllReadBtn) {
        elements.markAllReadBtn.addEventListener('click', () => {
            const loggedInUser = getLoggedInUser();
            if (loggedInUser) {
                markAllNotificationsAsRead(loggedInUser.role || 'patient');
            }
        });
    }

    elements.listContainer.addEventListener('click', (e) => {
        const markButton = e.target.closest('.mark-as-read-btn');
        if (markButton) {
            const notifItem = markButton.closest('.notification-full-item');
            const notifId = notifItem.dataset.id;
            if (notifId) {
                markNotificationAsRead(notifId);
            }
        }
    });

    // Listen for global updates (e.g. from header dropdown)
    window.addEventListener('notificationUpdated', renderNotifications);

    // --- NEW: Reveal Animation Support ---
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });
    revealElements.forEach(el => revealObserver.observe(el));

    // Initial render
    renderNotifications();
});
