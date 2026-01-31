import { getActiveProfile, getLuminexAppointments, setLuminexAppointments, getLuminexUsers, getLocalStorageItem, setLocalStorageItem } from './utils/storage-utils.js';
import { setupHeader } from './utils/header-manager.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const elements = {
        appointmentsListContainer: document.getElementById('appointments-list'),
        startDateInput: document.getElementById('filter-start-date'),
        endDateInput: document.getElementById('filter-end-date'),
        doctorInput: document.getElementById('filter-doctor'),
        statusInput: document.getElementById('filter-status'),
        activeFiltersContainer: document.getElementById('active-filters-container'),
        filterCardHeader: document.querySelector('.filter-card-header'),
        filterCardBody: document.getElementById('filter-card-body'),
        toggleFilterBtn: document.getElementById('toggle-filter-body'),
        applyFiltersBtn: document.getElementById('applyFilters'),
        clearFiltersBtn: document.getElementById('clearFilters')
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

    // --- REVEAL ANIMATIONS ---
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    function renderAppointments(appointments) {
        elements.appointmentsListContainer.innerHTML = '';
        const activeProfile = getActiveProfile();
        const currentLang = localStorage.getItem('language') || 'tr';
        const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

        if (!activeProfile) {
            elements.appointmentsListContainer.innerHTML = `<p>${getSafeTranslation('loginToSeeReviews')}</p>`;
            return;
        }

        if (appointments.length === 0) {
            elements.appointmentsListContainer.innerHTML = `<div class="card no-results-card"><i class="fas fa-search"></i><p>${getSafeTranslation('noAppointmentsFound')}</p></div>`;
            return;
        }

        const allRatings = getLocalStorageItem('doctorRatings') || [];
        appointments.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(app => {
            const appEl = document.createElement('div');
            appEl.className = 'appointment-item reveal';
            const now = new Date();
            const appDate = new Date(`${app.date}T${app.time}`);
            const isPast = appDate < now || app.status === 'Tamamlandı';

            if (isPast) appEl.classList.add('past');

            const displayDate = new Date(app.date).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' });
            const existingReview = allRatings.find(r => r.appointmentId === app.id);

            let actionsHtml = '';
            if (isPast) {
                actionsHtml += `<button class="btn btn-sm btn-secondary" data-action="details" data-id="${app.id}">${getSafeTranslation('details')}</button>`;
                if (existingReview) {
                    actionsHtml += `<button class="btn btn-sm btn-danger" data-action="delete-review" data-rating-id="${existingReview.id}">${getSafeTranslation('deleteReview')}</button>`;
                } else {
                    actionsHtml += `<button class="btn btn-sm btn-success" data-action="review" data-id="${app.id}">${getSafeTranslation('evaluate') || 'Değerlendir'}</button>`;
                }
            } else {
                actionsHtml = `
                    <button class="btn btn-sm btn-info" data-action="calendar" data-id="${app.id}"><i class="fas fa-calendar-plus"></i> Takvime Ekle</button>
                    <button class="btn btn-sm btn-warning" data-action="reschedule" data-id="${app.id}">${getSafeTranslation('reschedule') || 'Yeniden Planla'}</button>
                    <button class="btn btn-sm btn-danger" data-action="cancel" data-id="${app.id}">${getSafeTranslation('cancelAppointment')}</button>
                `;
            }

            const statusClass = (app.status === 'Onaylandı' || app.status === 'Tamamlandı') ? 'badge-success' : 'badge-warning';
            
            // Comprehensive status translation
            let statusText = app.status;
            if (app.status === 'İptal Edildi') statusText = getSafeTranslation('statusCancelled');
            else if (app.status === 'Onaylandı') statusText = getSafeTranslation('statusApproved');
            else if (app.status === 'Tamamlandı') statusText = getSafeTranslation('statusPast');
            else if (!app.status) statusText = isPast ? getSafeTranslation('statusPast') : getSafeTranslation('statusWaiting');

            const statusIcon = isPast ? '<i class="fas fa-check-circle" style="color: #2ecc71; margin-right: 8px;"></i>' : '';

            appEl.innerHTML = `
                <div class="appointment-details">
                    <h3>${statusIcon}${translateBranch(app.branch)}</h3>
                    <p><i class="fas fa-user-md"></i> Dr. ${app.doctor}</p>
                    <p><i class="fas fa-calendar-alt"></i> ${displayDate} | <i class="fas fa-clock"></i> ${app.time}</p>
                    ${app.healthInfo ? `<p class="health-info-display"><strong>${getSafeTranslation('healthInfo') || 'Sağlık Bilgisi'}:</strong> ${app.healthInfo}</p>` : ''}
                    <p><strong>${getSafeTranslation('statusLabel') || 'Durum'}:</strong> <span class="badge ${statusClass}">${statusText}</span></p>
                </div>
                <div class="appointment-actions">${actionsHtml}</div>
            `;
            elements.appointmentsListContainer.appendChild(appEl);
            revealObserver.observe(appEl);
        });
    }

    function loadAppointments() {
        const activeProfile = getActiveProfile();
        if (!activeProfile) return;

        const allAppointments = getLuminexAppointments();
        let userAppointments = allAppointments.filter(app => app.patientTc === activeProfile.tc);

        const filters = {
            startDate: elements.startDateInput.value,
            endDate: elements.endDateInput.value,
            doctor: elements.doctorInput.value.toLowerCase(),
            status: elements.statusInput.value
        };

        if (filters.startDate) userAppointments = userAppointments.filter(app => app.date >= filters.startDate);
        if (filters.endDate) userAppointments = userAppointments.filter(app => app.date <= filters.endDate);
        if (filters.doctor) userAppointments = userAppointments.filter(app => app.doctor.toLowerCase().includes(filters.doctor));
        
        if (filters.status === 'upcoming') {
            userAppointments = userAppointments.filter(app => new Date(app.date) >= new Date() && app.status !== 'İptal Edildi');
        } else if (filters.status === 'past') {
            userAppointments = userAppointments.filter(app => new Date(app.date) < new Date());
        }

        renderAppointments(userAppointments);
        updateActiveFilterPills(filters);
    }

    function updateActiveFilterPills(filters) {
        elements.activeFiltersContainer.innerHTML = '';
        let hasFilters = false;

        if (filters.startDate) {
            hasFilters = true;
            createPill(`${getSafeTranslation('startDate')}: ${filters.startDate}`, 'startDate');
        }
        if (filters.endDate) {
            hasFilters = true;
            createPill(`${getSafeTranslation('endDate')}: ${filters.endDate}`, 'endDate');
        }
        if (filters.doctor) {
            hasFilters = true;
            createPill(`${getSafeTranslation('doctorLabel')}: "${filters.doctor}"`, 'doctor');
        }
        if (filters.status !== 'all') {
            hasFilters = true;
            const statusLabel = filters.status === 'upcoming' ? getSafeTranslation('statusUpcoming') : getSafeTranslation('statusPast');
            createPill(`${getSafeTranslation('statusLabel') || 'Durum'}: ${statusLabel}`, 'status');
        }

        elements.activeFiltersContainer.style.display = hasFilters ? 'flex' : 'none';
    }

    function createPill(text, key) {
        const pill = document.createElement('div');
        pill.className = 'filter-pill';
        pill.innerHTML = `<span>${text}</span><span class="remove-pill" data-filter-key="${key}">&times;</span>`;
        elements.activeFiltersContainer.appendChild(pill);
    }

    if (elements.filterCardHeader) {
        const filterCard = elements.filterCardHeader.closest('.filter-card');
        elements.filterCardHeader.addEventListener('click', (e) => {
            if (e.target.closest('.filter-form-compact')) return;
            filterCard.classList.toggle('collapsed');
        });
    }

    if (elements.applyFiltersBtn) elements.applyFiltersBtn.addEventListener('click', loadAppointments);
    if (elements.clearFiltersBtn) {
        elements.clearFiltersBtn.addEventListener('click', () => {
            elements.startDateInput.value = '';
            elements.endDateInput.value = '';
            elements.doctorInput.value = '';
            elements.statusInput.value = 'all';
            loadAppointments();
        });
    }

    elements.activeFiltersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-pill')) {
            const key = e.target.dataset.filterKey;
            if (key === 'status') elements.statusInput.value = 'all';
            else if (elements[`${key}Input`]) elements[`${key}Input`].value = '';
            loadAppointments();
        }
    });

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
                confirmButtonColor: '#d33',
                confirmButtonText: getSafeTranslation('yesCancel'),
                cancelButtonText: getSafeTranslation('noStay')
            }).then((result) => {
                if (result.isConfirmed) {
                    let allApps = getLuminexAppointments();
                    const appIndex = allApps.findIndex(app => String(app.id) === String(appointmentId));
                    if (appIndex !== -1) {
                        allApps[appIndex].status = 'İptal Edildi';
                        setLuminexAppointments(allApps);
                        loadAppointments();
                        Swal.fire(getSafeTranslation('cancelledTitle'), getSafeTranslation('cancelledText'), 'success');
                    }
                }
            });
        } else if (action === 'reschedule') {
            const branchName = button.closest('.appointment-item').dataset.branchName || appointment.branch;
            window.location.href = `appointment.html?reschedule=true&appointmentId=${appointmentId}&branchName=${encodeURIComponent(branchName)}`;
        } else if (action === 'details') {
            const displayDate = new Date(appointment.date).toLocaleDateString(localStorage.getItem('language') || 'tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
            Swal.fire({
                title: '',
                html: `
                    <div class="swal-patient-header" style="margin-bottom: 15px;">
                        <div class="swal-patient-avatar"><i class="fas fa-calendar-check"></i></div>
                        <div class="swal-patient-info">
                            <h3>${getSafeTranslation('appointmentDetails')}</h3>
                            <span>Dr. ${appointment.doctor}</span>
                        </div>
                    </div>
                    <div class="swal-details-grid">
                        <div class="swal-detail-item">
                            <span class="swal-detail-label">${getSafeTranslation('branchSelection')}</span>
                            <span class="swal-detail-value">${appointment.branch}</span>
                        </div>
                        <div class="swal-detail-item">
                            <span class="swal-detail-label">${getSafeTranslation('dateLabel')}</span>
                            <span class="swal-detail-value">${displayDate}</span>
                        </div>
                        <div class="swal-detail-item">
                            <span class="swal-detail-label">${getSafeTranslation('timeLabel')}</span>
                            <span class="swal-detail-value">${appointment.time}</span>
                        </div>
                         <div class="swal-detail-item">
                            <span class="swal-detail-label">${getSafeTranslation('statusLabel')}</span>
                            <span class="swal-detail-value">${appointment.status}</span>
                        </div>
                        ${appointment.healthInfo ? `<div class="swal-detail-full"><strong>${getSafeTranslation('healthInfo')}</strong><p>${appointment.healthInfo}</p></div>` : ''}
                    </div>
                `,
                customClass: { popup: 'swal-premium-details' }
            });
        } else if (action === 'review') {
            Swal.fire({
                title: `${getSafeTranslation('evaluate')} Dr. ${appointment.doctor}`,
                html: `
                    <div id="star-rating" class="star-rating" style="font-size: 2.5rem; margin-bottom: 25px; cursor: pointer;">
                        <i class="fas fa-star" data-value="1"></i><i class="fas fa-star" data-value="2"></i><i class="fas fa-star" data-value="3"></i><i class="fas fa-star" data-value="4"></i><i class="fas fa-star" data-value="5"></i>
                    </div>
                    <textarea id="review-comment" class="form-control" style="min-height: 120px;" placeholder="${getSafeTranslation('yourMessage')}"></textarea>
                `,
                customClass: { popup: 'swal-premium-details' },
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
                        Swal.showValidationMessage('Lütfen yıldıza tıklayarak puan verin.');
                        return false;
                    }
                    return { rating: parseInt(rating), comment: document.getElementById('review-comment').value };
                },
                showCancelButton: true
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
                    Swal.fire('Teşekkürler!', 'Değerlendirmeniz alındı.', 'success');
                    loadAppointments();
                }
            });
        }
    });

    loadAppointments();
});