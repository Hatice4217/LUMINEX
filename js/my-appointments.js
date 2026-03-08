import { getActiveProfile, getLuminexAppointments, setLuminexAppointments, getLocalStorageItem, setLocalStorageItem, getDoctorDisplayName } from './utils/storage-utils.js';
import { setupHeader } from './utils/header-manager.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const elements = {
        appointmentsListContainer: document.getElementById('appointments-list'),
        statusInput: document.getElementById('statusFilter') || { value: 'all' },
        searchInput: document.getElementById('searchInput') || { value: '' },
        applyFiltersBtn: document.getElementById('applyFilters'),
        clearFiltersBtn: document.getElementById('clearFilters'),
        statTotal: document.getElementById('statTotal'),
        statUpcoming: document.getElementById('statUpcoming'),
        statCompleted: document.getElementById('statCompleted'),
        statCancelled: document.getElementById('statCancelled')
    };

    function getSafeTranslation(key) {
        return window.getTranslation ? window.getTranslation(key) : key;
    }

    function translateBranch(branchName) {
        if (!branchName) return getSafeTranslation('appointmentTitle');
        const branchMap = {
            'Kardiyoloji': 'cardiology',
            'Dahiliye': 'internalMedicine',
            'Ortopedi': 'orthopedics',
            'Göz Hastalıkları': 'ophthalmology',
            'Çocuk Sağlığı ve Hastalıkları': 'pediatrics',
            'Genel Cerrahi': 'generalSurgery',
            'Kadın Hastalıkları ve Doğum': 'gynecology',
            'Kulak Burun Boğaz': 'otolaryngology',
            'Nöroloji': 'neurology',
            'Psikiyatri': 'psychiatry',
            'Üroloji': 'urology',
            'Fizik Tedavi ve Rehabilitasyon': 'physicalTherapy',
            'Dermatoloji': 'dermatology',
            'Göğüs Hastalıkları': 'pulmonology',
            'Enfeksiyon Hastalıkları': 'infection',
            'Gastroenteroloji': 'gastroenterology',
            'Endokrinoloji': 'endocrinology',
            'Romatoloji': 'rheumatology',
            'Nefroloji': 'nephrology',
            'Onkoloji': 'oncology',
            'Anesteziyoloji ve Reanimasyon': 'anesthesiology'
        };
        const key = branchMap[branchName];
        return key ? getSafeTranslation(key) : branchName;
    }

    function updateStats(appointments) {
        const now = new Date();

        const total = appointments.length;
        const upcoming = appointments.filter(app => {
            const appDate = new Date(`${app.date}T${app.time}`);
            return appDate >= now && app.status !== 'İptal Edildi';
        }).length;
        const completed = appointments.filter(app => {
            const appDate = new Date(`${app.date}T${app.time}`);
            return appDate < now || app.status === 'Tamamlandı';
        }).length;
        const cancelled = appointments.filter(app => app.status === 'İptal Edildi').length;

        if (elements.statTotal) elements.statTotal.textContent = total;
        if (elements.statUpcoming) elements.statUpcoming.textContent = upcoming;
        if (elements.statCompleted) elements.statCompleted.textContent = completed;
        if (elements.statCancelled) elements.statCancelled.textContent = cancelled;
    }

    function getStatusBadge(status, isPast) {
        const statusMap = {
            'Onaylandı': { class: 'confirmed', text: getSafeTranslation('statusApproved') },
            'Tamamlandı': { class: 'completed', text: getSafeTranslation('statusPast') },
            'İptal Edildi': { class: 'cancelled', text: getSafeTranslation('statusCancelled') },
            'Beklemede': { class: 'pending', text: getSafeTranslation('statusWaiting') }
        };

        if (!status) {
            return { class: isPast ? 'completed' : 'pending', text: isPast ? getSafeTranslation('statusPast') : getSafeTranslation('statusWaiting') };
        }

        return statusMap[status] || { class: 'pending', text: status };
    }

    function renderAppointments(appointments) {
        elements.appointmentsListContainer.innerHTML = '';
        const activeProfile = getActiveProfile();
        const currentLang = localStorage.getItem('language') || 'tr';
        const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

        if (!activeProfile) {
            elements.appointmentsListContainer.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-xmark"></i><h3>${getSafeTranslation('loginRequired')}</h3><p>${getSafeTranslation('loginToSeeAppointments')}</p></div>`;
            return;
        }

        if (appointments.length === 0) {
            elements.appointmentsListContainer.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-xmark"></i><h3>${getSafeTranslation('noAppointments')}</h3><p>${getSafeTranslation('noAppointmentsDesc')}</p><a href="doctors.html" class="btn btn-primary">${getSafeTranslation('bookAppointment')}</a></div>`;
            return;
        }

        const allRatings = getLocalStorageItem('doctorRatings') || [];

        // Sort: upcoming first, then by date
        appointments.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });

        appointments.forEach(app => {
            const now = new Date();
            const appDate = new Date(`${app.date}T${app.time}`);
            const isPast = appDate < now || app.status === 'Tamamlandı';
            const isCancelled = app.status === 'İptal Edildi';

            let cardClass = 'upcoming';
            if (isPast && !isCancelled) cardClass = 'completed';
            else if (isCancelled) cardClass = 'cancelled';

            const dateObj = new Date(app.date);
            const day = dateObj.getDate();
            const monthName = dateObj.toLocaleDateString(dateLocale, { month: 'short' });

            const statusBadge = getStatusBadge(app.status, isPast);
            const existingReview = allRatings.find(r => r.appointmentId === app.id);

            let actionsHtml = '';
            if (isCancelled) {
                actionsHtml = '';
            } else if (isPast) {
                actionsHtml += `<button class="action-btn details" data-action="details" data-id="${app.id}" title="${getSafeTranslation('details')}"><i class="fas fa-info-circle"></i></button>`;
                if (existingReview) {
                    actionsHtml += `<button class="action-btn review" data-action="view-review" data-rating-id="${existingReview.id}" title="${getSafeTranslation('viewReview')}"><i class="fas fa-star"></i></button>`;
                } else {
                    actionsHtml += `<button class="action-btn review" data-action="review" data-id="${app.id}" title="${getSafeTranslation('evaluate')}"><i class="fas fa-star"></i></button>`;
                }
            } else {
                actionsHtml += `<button class="action-btn calendar" data-action="calendar" data-id="${app.id}" title="${getSafeTranslation('addToCalendar')}"><i class="fas fa-calendar-plus"></i></button>`;
                actionsHtml += `<button class="action-btn reschedule" data-action="reschedule" data-id="${app.id}" title="${getSafeTranslation('reschedule')}"><i class="fas fa-clock"></i></button>`;
                actionsHtml += `<button class="action-btn cancel" data-action="cancel" data-id="${app.id}" title="${getSafeTranslation('cancelAppointment')}"><i class="fas fa-times"></i></button>`;
            }

            const appEl = document.createElement('div');
            appEl.className = `appointment-card ${cardClass}`;
            appEl.dataset.id = app.id;

            appEl.innerHTML = `
                <div class="date-badge">
                    <div class="day">${day}</div>
                    <div class="month">${monthName}</div>
                </div>
                <div class="appointment-info">
                    <h3>
                        ${translateBranch(app.branch)}
                        <span class="status-badge ${statusBadge.class}">${statusBadge.text}</span>
                    </h3>
                    <div class="doctor"><i class="fas fa-user-md"></i> ${getDoctorDisplayName(app.doctor)}</div>
                    <div class="time"><i class="fas fa-clock"></i> ${app.time}</div>
                </div>
                <div class="appointment-actions">${actionsHtml}</div>
            `;

            elements.appointmentsListContainer.appendChild(appEl);
        });
    }

    function loadAppointments() {
        const activeProfile = getActiveProfile();
        if (!activeProfile) return;

        const allAppointments = getLuminexAppointments();
        let userAppointments = allAppointments.filter(app => app.patientTc === activeProfile.tc);

        const filters = {
            status: elements.statusInput.value,
            search: elements.searchInput.value.toLowerCase()
        };

        // Status filter
        if (filters.status === 'upcoming') {
            userAppointments = userAppointments.filter(app => {
                const appDate = new Date(`${app.date}T${app.time}`);
                return appDate >= new Date() && app.status !== 'İptal Edildi';
            });
        } else if (filters.status === 'past') {
            userAppointments = userAppointments.filter(app => {
                const appDate = new Date(`${app.date}T${app.time}`);
                return appDate < new Date() || app.status === 'Tamamlandı';
            });
        } else if (filters.status === 'cancelled') {
            userAppointments = userAppointments.filter(app => app.status === 'İptal Edildi');
        }

        // Search filter
        if (filters.search) {
            userAppointments = userAppointments.filter(app =>
                app.doctor.toLowerCase().includes(filters.search) ||
                app.branch.toLowerCase().includes(filters.search)
            );
        }

        updateStats(allAppointments.filter(app => app.patientTc === activeProfile.tc));
        renderAppointments(userAppointments);
    }

    // Event Listeners
    if (elements.applyFiltersBtn) elements.applyFiltersBtn.addEventListener('click', loadAppointments);

    if (elements.clearFiltersBtn) {
        elements.clearFiltersBtn.addEventListener('click', () => {
            if (elements.statusInput) elements.statusInput.value = 'all';
            if (elements.searchInput) elements.searchInput.value = '';
            loadAppointments();
        });
    }

    if (elements.searchInput) {
        elements.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') loadAppointments();
        });
    }

    // Button Actions
    document.addEventListener('click', function(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const appointmentId = button.dataset.id;
        const allAppointments = getLuminexAppointments();
        const appointment = allAppointments.find(app => String(app.id) === String(appointmentId));

        if (!appointment) return;

        if (action === 'cancel') {
            Swal.fire({
                title: getSafeTranslation('confirmCancelTitle'),
                text: getSafeTranslation('confirmCancelText'),
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#e74c3c',
                cancelButtonColor: '#3085d6',
                confirmButtonText: getSafeTranslation('yesCancel'),
                cancelButtonText: getSafeTranslation('noStay'),
                customClass: { confirmButton: 'btn-danger', cancelButton: 'btn-primary' }
            }).then((result) => {
                if (result.isConfirmed) {
                    const appIndex = allAppointments.findIndex(app => String(app.id) === String(appointmentId));
                    if (appIndex !== -1) {
                        allAppointments[appIndex].status = 'İptal Edildi';
                        setLuminexAppointments(allAppointments);
                        loadAppointments();
                        Swal.fire(getSafeTranslation('cancelledTitle'), getSafeTranslation('cancelledText'), 'success');
                    }
                }
            });
        } else if (action === 'reschedule') {
            window.location.href = `appointment.html?reschedule=true&appointmentId=${appointmentId}&branchName=${encodeURIComponent(appointment.branch)}`;
        } else if (action === 'details') {
            const displayDate = new Date(appointment.date).toLocaleDateString(localStorage.getItem('language') || 'tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
            Swal.fire({
                title: getSafeTranslation('appointmentDetails'),
                html: `
                    <div style="text-align: left; font-family: 'Poppins', sans-serif;">
                        <p style="margin-bottom: 12px;"><strong style="color: #001F6B;">${getSafeTranslation('branchSelection')}:</strong> ${translateBranch(appointment.branch)}</p>
                        <p style="margin-bottom: 12px;"><strong style="color: #001F6B;">${getSafeTranslation('doctorLabel')}:</strong> ${getDoctorDisplayName(appointment.doctor)}</p>
                        <p style="margin-bottom: 12px;"><strong style="color: #001F6B;">${getSafeTranslation('dateLabel')}:</strong> ${displayDate}</p>
                        <p style="margin-bottom: 12px;"><strong style="color: #001F6B;">${getSafeTranslation('timeLabel')}:</strong> ${appointment.time}</p>
                        <p style="margin-bottom: 0;"><strong style="color: #001F6B;">${getSafeTranslation('statusLabel')}:</strong> <span style="color: ${appointment.status === 'İptal Edildi' ? '#e74c3c' : '#2ecc71'}">${appointment.status || getSafeTranslation('statusWaiting')}</span></p>
                        ${appointment.healthInfo ? `<p style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee;"><strong style="color: #001F6B;">${getSafeTranslation('healthInfo')}:</strong><br><span style="color: #64748b;">${appointment.healthInfo}</span></p>` : ''}
                    </div>
                `,
                confirmButtonText: getSafeTranslation('close'),
                confirmButtonColor: '#001F6B'
            });
        } else if (action === 'review') {
            Swal.fire({
                title: `${getSafeTranslation('evaluate')} ${getDoctorDisplayName(appointment.doctor)}`,
                html: `
                    <div id="star-rating" style="font-size: 2rem; margin-bottom: 20px; cursor: pointer;">
                        <i class="fas fa-star" data-value="1" style="color: #ddd;"></i>
                        <i class="fas fa-star" data-value="2" style="color: #ddd;"></i>
                        <i class="fas fa-star" data-value="3" style="color: #ddd;"></i>
                        <i class="fas fa-star" data-value="4" style="color: #ddd;"></i>
                        <i class="fas fa-star" data-value="5" style="color: #ddd;"></i>
                    </div>
                    <textarea id="review-comment" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-family: 'Poppins', sans-serif; resize: vertical;" rows="4" placeholder="${getSafeTranslation('yourMessage')}"></textarea>
                `,
                confirmButtonText: getSafeTranslation('submit'),
                cancelButtonText: getSafeTranslation('cancel'),
                showCancelButton: true,
                confirmButtonColor: '#001F6B',
                cancelButtonColor: '#64748b',
                didOpen: () => {
                    const stars = document.querySelectorAll('#star-rating .fa-star');
                    stars.forEach(star => {
                        star.addEventListener('mouseover', () => {
                            const rating = parseInt(star.dataset.value);
                            stars.forEach((s, i) => s.style.color = i < rating ? '#ffc107' : '#ddd');
                        });
                        star.addEventListener('mouseout', () => {
                            const currentRating = document.getElementById('star-rating').dataset.rating || 0;
                            stars.forEach((s, i) => s.style.color = i < currentRating ? '#ffc107' : '#ddd');
                        });
                        star.addEventListener('click', () => {
                            const rating = parseInt(star.dataset.value);
                            document.getElementById('star-rating').dataset.rating = rating;
                        });
                    });
                },
                preConfirm: () => {
                    const rating = document.getElementById('star-rating').dataset.rating;
                    if (!rating) {
                        Swal.showValidationMessage(getSafeTranslation('pleaseRate'));
                        return false;
                    }
                    return { rating: parseInt(rating), comment: document.getElementById('review-comment').value };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const activeProfile = getActiveProfile();
                    let allRatings = getLocalStorageItem('doctorRatings') || [];
                    const newRating = {
                        id: `rating_${Date.now()}`,
                        appointmentId: appointmentId,
                        doctorId: appointment.doctorId,
                        patientName: activeProfile.name,
                        patientTc: activeProfile.tc,
                        rating: result.value.rating,
                        comment: result.value.comment,
                        date: new Date().toISOString()
                    };
                    allRatings.push(newRating);
                    setLocalStorageItem('doctorRatings', allRatings);
                    Swal.fire(getSafeTranslation('thankYou'), getSafeTranslation('reviewSubmitted'), 'success');
                    loadAppointments();
                }
            });
        } else if (action === 'calendar') {
            const appDate = new Date(`${appointment.date}T${appointment.time}`);
            const title = `Randevu: ${getDoctorDisplayName(appointment.doctor)} - ${translateBranch(appointment.branch)}`;
            const location = 'LUMINEX Hastanesi';

            // Create Google Calendar link
            const startDate = appDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            const endDate = new Date(appDate.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent('Sağlık randevunuz')}&location=${encodeURIComponent(location)}`;

            window.open(googleCalendarUrl, '_blank');
        }
    });

    // Initial load
    loadAppointments();
});
