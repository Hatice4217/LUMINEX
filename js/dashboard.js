import {
    getLuminexAppointments,
    setLuminexAppointments,
    getActiveProfile,
    removeLoggedInUser,
    removeActiveProfile,
    getSessionStorageItem, 
    setSessionStorageItem,
    getLoggedInUser // Added import
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
                    healthTipElement.textContent = translatedText;
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

            const welcomeMsgSpan = document.getElementById('welcomeMessage'); // Target the header span

            if (upcoming.length > 0 && welcomeMsgSpan) {
                const nextApp = upcoming[0];
                
                // Create or get countdown span in header
                let headerCountdown = document.getElementById('header-countdown-text');
                if (!headerCountdown) {
                    headerCountdown = document.createElement('span');
                    headerCountdown.id = 'header-countdown-text';
                    headerCountdown.style.cssText = "font-size: 0.85rem; color: #e74c3c; font-weight: 600; margin-left: 15px; white-space: nowrap;";
                    welcomeMsgSpan.parentNode.insertBefore(headerCountdown, welcomeMsgSpan.nextSibling);
                }

                const updateTimer = () => {
                    const currentTime = new Date();
                    const diff = nextApp.dateTime - currentTime;

                    if (diff <= 0) {
                        headerCountdown.style.display = 'none'; 
                        return;
                    }

                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                    let timeText = "";
                    if(days > 0) timeText += `${days} ${window.getTranslation('countdownDays')} `;
                    if(hours > 0 || days > 0) timeText += `${hours} ${window.getTranslation('countdownHours')} `;
                    timeText += `${minutes} ${window.getTranslation('countdownMinsRemaining')}`;

                    const headerText = window.getTranslation('countdownHeaderPrefix');
                    headerCountdown.innerHTML = `<i class="fas fa-calendar-check" style="margin-right:5px;"></i> ${headerText} ${timeText}`;
                    headerCountdown.style.display = 'inline';
                    const currentLang = localStorage.getItem('language') || 'tr';
                    const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';
                    headerCountdown.title = `Sıradaki Randevu: ${new Date(nextApp.date).toLocaleDateString(dateLocale)} ${nextApp.time}`;
                };

                updateTimer(); // Run immediately
                setInterval(updateTimer, 60000); // Update every minute is enough for header
            } else {
                const existing = document.getElementById('header-countdown-text');
                if(existing) existing.style.display = 'none';
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
                                <p>Dr. ${app.doctor}</p>
                                <span class="timeline-status">${app.status || statusText}</span>
                            </div>
                        </div>
                    </div>
                `;
            });

            timelineContainer.innerHTML = html;
        }

        startHealthTipsCarousel();
        setupQuickAccessCards();
        // loadAppointments();
        updateStatistics();
        updateCountdown();
        updateHealthTimeline(); // Call the new function

        // --- Sidebar Toggle Functionality ---
        const sidebarToggleButton = document.querySelector('.sidebar-toggle-button');
        console.log('Sidebar toggle button found:', sidebarToggleButton);

        if (sidebarToggleButton) {
            sidebarToggleButton.addEventListener('click', function(e) {
                console.log('Toggle button clicked!');
                e.preventDefault();

                // Body elementine class ekle
                document.body.classList.toggle('sidebar-is-collapsed');

                // Durumu localStorage'a kaydet
                const isCollapsed = document.body.classList.contains('sidebar-is-collapsed');
                console.log('Is collapsed:', isCollapsed);
                localStorage.setItem('sidebarCollapsed', isCollapsed);

                // Buton metnini güncelle
                const buttonText = this.querySelector('span');
                if (buttonText) {
                    buttonText.textContent = isCollapsed ? 'Menüyü Genişlet' : 'Menüyü Daralt';
                }

                // Sidebar'ın yeni genişliğini kontrol et
                const sideMenu = document.querySelector('.side-menu');
                if (sideMenu) {
                    console.log('Sidebar width:', sideMenu.offsetWidth);
                    console.log('Body classes:', document.body.classList.toString());
                }
            });
        }

        document.addEventListener('click', function(e) {
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
