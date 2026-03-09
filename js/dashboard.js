import {
    getLuminexAppointments,
    setLuminexAppointments,
    getActiveProfile,
    removeLoggedInUser,
    removeActiveProfile,
    getSessionStorageItem,
    setSessionStorageItem,
    getLoggedInUser,
    getDoctorDisplayName,
    getLuminexUsers
} from './utils/storage-utils.js';

import { setupHeader } from './utils/header-manager.js'; 
import { healthTips } from './utils/data.js';

document.addEventListener('DOMContentLoaded', function () {
        const loggedInUser = getLoggedInUser();

        if (!loggedInUser) {
            window.location.href = 'login.html';
            return;
        }

        // Role-based redirection safety check
        if (loggedInUser.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
            return;
        } else if (loggedInUser.role === 'doctor') {
            window.location.href = 'doctor-dashboard.html';
            return;
        }

        // setupHeader çağrısı ve menü kontrolü
        try {
            setupHeader();

            // Menü yüklenmediyse yedek menüyü göster
            setTimeout(() => {
                const dynamicMenu = document.getElementById('dynamicSideMenu');
                const fallbackMenu = document.getElementById('fallbackSideMenu');

                if (dynamicMenu && fallbackMenu) {
                    if (dynamicMenu.children.length === 0) {
                        console.warn('Dinamik menü yüklenemedi, yedek menü gösteriliyor');
                        fallbackMenu.style.display = 'block';
                        dynamicMenu.style.display = 'none';
                    } else {
                        dynamicMenu.style.display = 'block';
                        fallbackMenu.style.display = 'none';
                    }
                }
            }, 500);
        } catch (error) {
            console.error('setupHeader hatası:', error);
            // Hata durumunda yedek menüyü göster
            const fallbackMenu = document.getElementById('fallbackSideMenu');
            const dynamicMenu = document.getElementById('dynamicSideMenu');
            if (fallbackMenu) fallbackMenu.style.display = 'block';
            if (dynamicMenu) dynamicMenu.style.display = 'none';
        }

        // --- Smart Notification Cleanup (One-time fix for multilingual support) ---
        try {
            const storedNotifs = localStorage.getItem('luminexNotifications');
            if (storedNotifs) {
                const notifs = JSON.parse(storedNotifs);
                // Check if any notification message is still hardcoded Turkish (starts with 'Yarın', 'Son', 'İlaç' etc.)
                // or contains doctor-specific keywords. Using a broad check for Turkish strings.
                const hasHardcodedTurkish = notifs.some(n => 
                    n.message && (
                        n.message.includes('randevunuz') || 
                        n.message.includes('sonuçlarınız') || 
                        n.message.includes('Hatırlatması') ||
                        n.message.includes('TC:')
                    )
                );
                
                if (hasHardcodedTurkish) {
                    console.log('Old or hardcoded notification data detected. Refreshing for multilingual support...');
                    localStorage.removeItem('luminexNotifications');
                    // Data will be re-initialized from data.js (which now uses keys) on next access
                    window.location.reload(); 
                }
            }
        } catch (e) {
            console.error('Error cleaning up notifications:', e);
        }
        
        // --- Weather Widget Logic ---
        const weatherScenarios = [
            { type: 'sunny', icon: 'fa-sun', bg: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', temp: '24°C', label: 'sunny', tip: 'sunnyTip' },
            { type: 'cloudy', icon: 'fa-cloud', bg: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', temp: '18°C', label: 'cloudy', tip: 'cloudyTip' },
            { type: 'rainy', icon: 'fa-cloud-showers-heavy', bg: 'linear-gradient(135deg, #001F6B 0%, #764ba2 100%)', temp: '15°C', label: 'rainy', tip: 'rainyTip' }
        ];
        
        const randomWeather = weatherScenarios[Math.floor(Math.random() * weatherScenarios.length)];
        const widget = document.getElementById('weatherWidget');
        
        if (widget) {
            widget.style.background = randomWeather.bg;
            document.getElementById('weatherIcon').className = `fas ${randomWeather.icon}`;
            document.getElementById('weatherTemp').textContent = `${randomWeather.temp}, ${window.getTranslation(randomWeather.label)}`;
            document.getElementById('weatherTip').textContent = window.getTranslation(randomWeather.tip);
        }

        // --- Medicine Reminder Logic ---
        const medicineBtn = document.getElementById('medicineTakenBtn');
        if (medicineBtn) {
            const today = new Date().toLocaleDateString();
            const lastTaken = localStorage.getItem('medicineTakenDate');

            if (lastTaken === today) {
                markMedicineAsTaken(medicineBtn);
            }

            medicineBtn.addEventListener('click', () => {
                Swal.fire({
                    icon: 'success',
                    title: window.getTranslation('medicineSuccessTitle'),
                    text: window.getTranslation('medicineSuccessText'),
                    timer: 2000,
                    showConfirmButton: false
                });
                localStorage.setItem('medicineTakenDate', today);
                markMedicineAsTaken(medicineBtn);
            });
        }

        function markMedicineAsTaken(btn) {
            btn.textContent = window.getTranslation('medicineTaken');
            btn.disabled = true;
            btn.style.backgroundColor = '#2ecc71'; // Green
            btn.style.borderColor = '#2ecc71';
            btn.style.cursor = 'default';
            btn.style.opacity = '0.9';
        }
        const appointmentsContainer = document.getElementById('appointments-container');
        const loadingSpinner = document.getElementById('loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.style.display = 'none';
        }

        // --- PREMIUM: Kişiselleştirilmiş Karşılama ---
        function updateWelcomeMessage() {
            const h1 = document.querySelector('.dashboard-content h1');
            if (h1) {
                const hour = new Date().getHours();
                let greeting = 'İyi Günler';
                let emoji = '👋';

                if (hour >= 5 && hour < 12) {
                    greeting = 'Günaydın';
                    emoji = '☀️';
                } else if (hour >= 17 || hour < 5) {
                    greeting = 'İyi Akşamlar';
                    emoji = '🌙';
                }

                const activeProfile = getActiveProfile();
                const loggedInUser = getLoggedInUser();
                
                let rawName = 'Misafir';

                // Yardımcı fonksiyon: Kullanıcı nesnesinden en uygun ismi çek
                const getName = (u) => {
                    if (!u) return null;
                    const name = u.name || u.fullName || (u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : null);
                    return (name && name !== 'undefined' && name !== 'Kullanıcı') ? name : null;
                };

                // Önce aktif profili, yoksa giriş yapan ana kullanıcıyı kontrol et
                rawName = getName(activeProfile) || getName(loggedInUser);
                    
                // Eğer hala bulunamadıysa (placeholder ise) ana kullanıcı listesinden T.C. ile sorgula
                if (!rawName) {
                    const userTc = (activeProfile?.tc || activeProfile?.tcKimlik) || (loggedInUser?.tc || loggedInUser?.tcNo || loggedInUser?.tcKimlik);
                    if (userTc) {
                        const allUsers = getLuminexUsers();
                        const fullUser = allUsers.find(u => (u.tc || u.tcNo || u.tcKimlik) === userTc);
                        rawName = getName(fullUser) || 'Kullanıcı';
                    }
                }

                const name = rawName.split(' ')[0];

                h1.innerHTML = `${greeting}, ${name} ${emoji} <div style="font-size: 1rem; color: #6c757d; font-weight: 400; margin-top: 5px;">Bugün sağlığınız için neler yapabiliriz?</div>`;
            }
        }
    
        function startHealthTipsCarousel() {
            const healthTipElement = document.getElementById('health-tip');
            const announcementCard = healthTipElement ? healthTipElement.closest('.announcements-card') : null;
            if (!healthTipElement || !announcementCard || healthTips.length === 0) return;
    
            let currentTipIndex = 0;
            const displayTip = () => {
                const currentTip = healthTips[currentTipIndex];
                
                // Remove old type classes
                announcementCard.classList.remove('announcement-info', 'announcement-warning', 'announcement-health');

                // Add new class
                announcementCard.classList.add(`announcement-${currentTip.type}`);
                
                healthTipElement.style.opacity = '0';
                setTimeout(() => {
                    const translatedText = window.getTranslation ? window.getTranslation(currentTip.text) : currentTip.text;
                    
                    // PREMIUM: İkon Ekleme
                    let icon = '';
                    if (currentTip.type === 'health' || currentTip.text.includes('su') || currentTip.text.includes('water')) icon = ' 💧';
                    else if (currentTip.text.includes('yürüyüş') || currentTip.text.includes('walk')) icon = ' 🏃‍♀️';
                    else if (currentTip.text.includes('uyku') || currentTip.text.includes('sleep')) icon = ' 😴';

                    healthTipElement.innerHTML = translatedText + icon;
                    healthTipElement.style.opacity = '1';
                    currentTipIndex = (currentTipIndex + 1) % healthTips.length;
                }, 500);
            };
            displayTip();
            setInterval(displayTip, 7000);
        }
    
        function setupQuickAccessCards() {
            document.querySelectorAll('.quick-access-item').forEach(card => {
                card.addEventListener('click', function() {
                    const targetPage = this.dataset.target;
                    if (targetPage) {
                        window.location.href = targetPage;
                    }
                });
            });
        }
    
        function updateStatistics() {
            const activeProfile = getActiveProfile();
            if (!activeProfile) return;

            const allAppointments = getLuminexAppointments();
            const userAppointments = allAppointments.filter(app => app.patientTc === activeProfile.tc);

            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            // Tamamlanan randevular (bu ay)
            let completedAppointmentsThisMonth = 0;
            userAppointments.forEach(app => {
                const appDate = new Date(app.date);
                if (appDate < now && appDate.getMonth() === currentMonth && appDate.getFullYear() === currentYear) {
                    completedAppointmentsThisMonth++;
                }
            });

            // Sıradaki randevular
            const upcomingAppointments = userAppointments.filter(app => {
                const appDateTime = new Date(`${app.date}T${app.time}`);
                return appDateTime > now;
            }).length;

            // Ziyaret edilen doktorlar (benzersiz)
            const visitedDoctors = new Set();
            userAppointments.forEach(app => {
                if (new Date(app.date) < now) {
                    visitedDoctors.add(app.doctor);
                }
            });

            // Update UI
            const completedEl = document.getElementById('completedAppointments');
            const upcomingEl = document.getElementById('upcomingAppointments');
            const doctorsEl = document.getElementById('visitedDoctors');

            if (completedEl) completedEl.textContent = completedAppointmentsThisMonth;
            if (upcomingEl) upcomingEl.textContent = upcomingAppointments;
            if (doctorsEl) doctorsEl.textContent = visitedDoctors.size;
        }

        function updateCountdown() {
            const activeProfile = getActiveProfile();
            if (!activeProfile) return;

            // Hide old widget if exists (cleanup)
            const oldWidget = document.getElementById('appointmentCountdown');
            if(oldWidget) oldWidget.style.display = 'none';
            
            // PREMIUM: Header'daki eski kırmızı yazıyı kaldır
            const headerCountdown = document.getElementById('header-countdown-text');
            if (headerCountdown) headerCountdown.remove();

            const allAppointments = getLuminexAppointments();
            const userAppointments = allAppointments.filter(app => app.patientTc === activeProfile.tc && app.status !== 'İptal Edildi' && app.status !== 'Tamamlandı');

            const now = new Date();
            
            // Find next appointment
            const upcoming = userAppointments
                .map(app => {
                    const appDateTime = new Date(`${app.date}T${app.time}`);
                    return { ...app, dateTime: appDateTime };
                })
                .filter(app => app.dateTime > now)
                .sort((a, b) => a.dateTime - b.dateTime);

            // PREMIUM: Yeni Banner Alanı Oluştur
            let banner = document.getElementById('appointment-banner');
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'appointment-banner';
                banner.className = 'appointment-banner';
                // H1 başlığının hemen altına ekle
                const h1 = document.querySelector('.dashboard-content h1');
                if (h1 && h1.parentNode) {
                    h1.parentNode.insertBefore(banner, h1.nextSibling);
                }
            }

            if (upcoming.length > 0) {
                const nextApp = upcoming[0];
                const diff = nextApp.dateTime - now;
                
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                const currentLang = localStorage.getItem('language') || 'tr';
                const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';
                const dateStr = new Date(nextApp.date).toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

                banner.innerHTML = `
                    <div class="banner-content">
                        <div class="banner-icon">
                            <i class="fas fa-calendar-check"></i>
                        </div>
                        <div class="banner-info">
                            <h4>Sıradaki Randevunuz</h4>
                            <p><strong>${getDoctorDisplayName(nextApp.doctor)}</strong> - ${nextApp.branch}</p>
                            <p class="banner-date"><i class="far fa-clock"></i> ${dateStr} - ${nextApp.time}</p>
                        </div>
                        <div class="banner-timer">
                            <div class="timer-box"><span class="timer-val">${days}</span><span class="timer-label">Gün</span></div>
                            <div class="timer-box"><span class="timer-val">${hours}</span><span class="timer-label">Sa</span></div>
                            <div class="timer-box"><span class="timer-val">${minutes}</span><span class="timer-label">Dk</span></div>
                        </div>
                        <button class="btn-banner-action" onclick="window.location.href='my-appointments.html'">
                            Detaylar <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                `;
                banner.style.display = 'block';
                
                // Timer'ı güncellemek için basit bir reload yerine sadece UI update yapılabilir ama şimdilik statik kalsın
            } else {
                if(banner) banner.style.display = 'none';
            }
        }
    
        function updateHealthTimeline() {
            const activeProfile = getActiveProfile();
            if (!activeProfile) return;
            
            const timelineContainer = document.getElementById('healthTimelineList');
            if (!timelineContainer) return;

            const allAppointments = getLuminexAppointments();
            const userAppointments = allAppointments.filter(app => app.patientTc === activeProfile.tc);

            if (userAppointments.length === 0) {
                timelineContainer.innerHTML = `
                    <div class="empty-timeline">
                        <i class="fas fa-notes-medical"></i>
                        <p>${window.getTranslation('noHealthRecords')}</p>
                    </div>`;
                return;
            }

            const now = new Date();
            
            // Sort all by date
            userAppointments.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA - dateB;
            });

            const pastApps = userAppointments.filter(app => new Date(`${app.date}T${app.time}`) < now);
            const futureApps = userAppointments.filter(app => new Date(`${app.date}T${app.time}`) >= now);

            // Get last 2 past and next 2 future items
            const displayItems = [
                ...pastApps.slice(-2), 
                ...futureApps.slice(0, 2)
            ];

            // Re-sort for display order (oldest to newest)
            displayItems.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA - dateB;
            });

            let html = '';
            displayItems.forEach(app => {
                const currentLang = localStorage.getItem('language') || 'tr';
                const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';
                const appDate = new Date(`${app.date}T${app.time}`);
                const isPast = appDate < now;
                const statusClass = isPast ? 'past' : 'future';
                const icon = isPast ? 'fa-check-circle' : 'fa-clock';
                const dateStr = appDate.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' });
                
                const branchText = app.branch === 'Muayene' ? window.getTranslation('examination') : app.branch;
                const statusText = isPast ? window.getTranslation('completed') : window.getTranslation('waiting');

                html += `
                    <div class="timeline-item ${statusClass}">
                        <div class="timeline-marker">
                            <i class="fas ${icon}"></i>
                        </div>
                        <div class="timeline-content">
                            <div class="timeline-date">${dateStr}</div>
                            <div class="timeline-details">
                                <h4>${branchText}</h4>
                                <p>${getDoctorDisplayName(app.doctor)}</p>
                                <span class="timeline-status">${app.status || statusText}</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            timelineContainer.innerHTML = html;
        }

        // PREMIUM: Izgara Düzeni (Grid Layout)
        function restructureDashboardLayout() {
            const content = document.querySelector('.dashboard-content');
            if (!content || document.querySelector('.dashboard-grid-bottom')) return;

            // Kartları bul
            const statsEl = document.getElementById('completedAppointments');
            const statsCard = statsEl ? statsEl.closest('.card') : null;
            
            const timelineEl = document.getElementById('healthTimelineList');
            const timelineCard = timelineEl ? timelineEl.closest('.card') : null;
            
            const announcementsCard = document.querySelector('.announcements-card');

            if (statsCard && timelineCard && announcementsCard) {
                const grid = document.createElement('div');
                grid.className = 'dashboard-grid-bottom';
                
                const left = document.createElement('div');
                left.className = 'dashboard-left-col';
                
                const right = document.createElement('div');
                right.className = 'dashboard-right-col';
                
                // Kartları taşı
                left.appendChild(statsCard);
                left.appendChild(timelineCard);
                right.appendChild(announcementsCard);
                
                grid.appendChild(left);
                grid.appendChild(right);
                
                content.appendChild(grid);
            }
        }

        updateWelcomeMessage();
        startHealthTipsCarousel();
        setupQuickAccessCards();
        // loadAppointments();
        updateStatistics();
        updateCountdown();
        updateHealthTimeline(); // Call the new function
        restructureDashboardLayout();


        document.addEventListener('click', function(e) {
            // --- PREMIUM: Bildirim Paneli Aç/Kapat ---
            const notifBtn = e.target.closest('.notification-wrapper button');
            if (notifBtn) {
                const dropdown = notifBtn.closest('.notification-wrapper').querySelector('.notification-dropdown');
                if (dropdown) {
                    dropdown.classList.toggle('show');
                }
            } else if (!e.target.closest('.notification-dropdown')) {
                const openDropdown = document.querySelector('.notification-dropdown.show');
                if (openDropdown) openDropdown.classList.remove('show');
            }

            if (e.target && e.target.classList.contains('cancel-appointment-btn')) {
                const appointmentId = e.target.getAttribute('data-id');
                Swal.fire({
                    title: window.getTranslation('confirmCancelTitle'),
                    text: window.getTranslation('confirmCancelText'),
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: window.getTranslation('yesCancel'),
                    cancelButtonText: window.getTranslation('noStay')
                }).then((result) => {
                    if (result.isConfirmed) {
                        let allAppointments = getLuminexAppointments();
                        allAppointments = allAppointments.filter(app => String(app.id) !== String(appointmentId));
                        setLuminexAppointments(allAppointments);
                        loadAppointments();
                        Swal.fire(window.getTranslation('cancelledTitle'), window.getTranslation('cancelledText'), 'success');
                    }
                });
            }
        });
    });
