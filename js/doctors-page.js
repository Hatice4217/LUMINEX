import { branches, dummyDoctors } from './utils/data.js';
import { setupHeader } from './utils/header-manager.js';
import { getLuminexUsers, initAllDummyData, getLuminexAppointments } from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    initAllDummyData();
    setupHeader();

    const elements = {
        doctorSearchInput: document.getElementById('doctorSearchInput'),
        doctorListContainer: document.getElementById('doctorList'),
        branchFilterInput: document.getElementById('branchFilterInput'),
        branchFilterPanel: document.getElementById('branchFilterPanel'),
        ratingFilterInput: document.getElementById('ratingFilterInput'), 
        toggleFilterBtn: document.getElementById('toggle-filter-body'),
        filterCardHeader: document.querySelector('.filter-card-header'),
        filterCardBody: document.getElementById('filter-card-body'),
        applyFiltersBtn: document.getElementById('applyFilters'),
        clearFiltersBtn: document.getElementById('clearFilters'),
    };

    if (!elements.doctorListContainer || !elements.branchFilterInput || !elements.branchFilterPanel || !elements.ratingFilterInput) {
        console.error("doctors-page.js: A required element was not found!");
        return;
    }

    let selection = { branch: '' };

    // --- Dinamik Müsaitlik Hesaplayıcı ---
    function calculateNextAvailable(doctor) {
        if (doctor.availability && !doctor.availability.includes('dummy')) {
            return doctor.availability;
        }

        const appointments = getLuminexAppointments() || [];
        const doctorAppointments = appointments.filter(app => app.doctorId === doctor.id);

        const now = new Date();
        let nextDate = new Date();
        nextDate.setMinutes(0);
        nextDate.setSeconds(0);

        if (now.getHours() < 9) {
            nextDate.setHours(9);
        } else {
            if (now.getHours() >= 17) {
                nextDate.setDate(now.getDate() + 1);
                nextDate.setHours(9);
            } else {
                nextDate.setHours(now.getHours() + 1);
            }
        }

        const busyMinutes = doctorAppointments.length * 30;
        nextDate.setMinutes(nextDate.getMinutes() + busyMinutes);

        const isToday = nextDate.getDate() === now.getDate();
        const timeStr = nextDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        
        return `${isToday ? 'Bugün' : 'Yarın'} ${timeStr}`;
    }

    function getInitials(name) {
        const words = name.replace('Dr. ', '').split(' ');
        if (words.length > 1) {
            return (words[0][0] + words[words.length - 1][0]).toUpperCase();
        } else if (words.length === 1 && words[0].length > 1) {
            return (words[0][0] + words[0][1]).toUpperCase();
        }
        return (name[0] || '').toUpperCase();
    }

    function renderStarRating(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<i class="fas fa-star ${i <= rating ? 'selected' : ''}" style="${i <= rating ? 'color: #FFD700;' : 'color: #ddd;'} font-size: 0.8rem;"></i>`;
        }
        return stars;
    }
    
    function populatePanel(panel, items) {
        if (!panel || !items) return;
        panel.innerHTML = '';
        items.forEach(item => {
            if (item && item.id !== undefined && item.name) {
                const div = document.createElement('div');
                div.className = 'custom-option';
                div.textContent = item.name;
                div.dataset.id = item.id;
                panel.appendChild(div);
            }
        });
    }

    function setupCustomDropdown(config) {
        const { input, panel, onSelect, items } = config;
        if (!input || !panel) return;

        populatePanel(panel, items || []);

        let highlightedIndex = -1;

        input.addEventListener('click', (e) => {
             e.stopPropagation();
             panel.classList.add('visible');
             filterPanel(panel, '');
        });

        input.addEventListener('input', () => {
            panel.classList.add('visible');
            filterPanel(panel, input.value);
            onSelect({ id: null, name: input.value }); 
        });

        panel.addEventListener('mousedown', (e) => { 
            const option = e.target.closest('.custom-option');
            if (option) {
                const item = { id: option.dataset.id, name: option.textContent };
                input.value = item.name;
                onSelect(item);
                panel.classList.remove('visible');
            }
        });

        input.addEventListener('keydown', (e) => {
            const options = Array.from(panel.querySelectorAll('.custom-option:not([style*="display: none"])'));
            if (options.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                highlightedIndex = (highlightedIndex + 1) % options.length;
                updateHighlight(options, highlightedIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                highlightedIndex = (highlightedIndex - 1 + options.length) % options.length;
                updateHighlight(options, highlightedIndex);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedIndex > -1) {
                    options[highlightedIndex].click();
                }
                 panel.classList.remove('visible');
            }
        });

        panel.addEventListener('wheel', (e) => {
            e.preventDefault();
            panel.scrollTop += e.deltaY;
        }, { passive: false });

        function updateHighlight(options, index) {
            options.forEach((option, i) => {
                if (i === index) {
                    option.classList.add('highlighted');
                    option.scrollIntoView({ block: 'nearest' });
                } else {
                    option.classList.remove('highlighted');
                }
            });
        }
    }

    function filterPanel(panel, filter) {
        if (!panel) return;
        panel.querySelectorAll('.custom-option').forEach(opt => {
            opt.style.display = opt.textContent.toLowerCase().includes(filter.toLowerCase()) ? '' : 'none';
        });
    }

    function getSafeTranslation(key) {
        return window.getTranslation ? window.getTranslation(key) : key;
    }

    function renderDoctors(doctors) {
        const container = elements.doctorListContainer;
        container.innerHTML = ''; // Clear previous content
        
        // Show Skeleton Loaders
        for (let i = 0; i < 4; i++) {
            const skeletonItem = document.createElement('div');
            skeletonItem.className = 'doctor-item skeleton-item';
            skeletonItem.innerHTML = `
                <div class="skeleton skeleton-avatar"></div>
                <div class="doctor-details" style="flex:1;">
                    <div class="skeleton skeleton-title" style="width: 70%;"></div>
                    <div class="skeleton skeleton-text" style="width: 50%;"></div>
                    <div class="skeleton skeleton-text" style="width: 80%; margin-top:10px;"></div>
                </div>
            `;
            container.appendChild(skeletonItem);
        }

        // Simulate network delay and then render real data
        setTimeout(() => {
            container.innerHTML = ''; // Clear skeletons
            if (doctors.length === 0) {
                container.innerHTML = `<div class="card no-results-card" style="padding: 50px; text-align: center;"><i class="fas fa-search" style="font-size: 2rem; opacity: 0.3;"></i><p style="margin-top:15px;">${getSafeTranslation('noDoctorsFound')}</p></div>`;
                return;
            }

            const doctorRatings = JSON.parse(localStorage.getItem('doctorRatings')) || [];

            doctors.forEach(doctor => {
                const doctorItem = document.createElement('div');
                doctorItem.classList.add('doctor-item');
                doctorItem.dataset.id = doctor.id;
                doctorItem.dataset.doctorName = doctor.name;
                doctorItem.dataset.branch = doctor.branch; 

                const ratings = doctorRatings.filter(r => r.doctorId === doctor.id);
                const averageRating = ratings.length > 0 ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length : 0;

                const stars = Array(5).fill(0).map((_, i) =>
                    i < Math.round(averageRating) ? '<i class="fas fa-star selected"></i>' : '<i class="fas fa-star"></i>'
                ).join('');

                const reviewsText = getSafeTranslation('reviewsCount').replace('{count}', ratings.length);
                
                const nextAvailable = calculateNextAvailable(doctor);
                const availabilityColor = nextAvailable.includes('Bugün') ? '#27ae60' : '#f39c12';

                doctorItem.innerHTML = `
                    <div class="doctor-initials ${doctor.gender}">${getInitials(doctor.name)}</div>
                    <div class="doctor-details">
                        <h3>${doctor.name}</h3>
                        <p class="doctor-branch">${doctor.branch}</p>
                        <div class="doctor-rating">${stars} <span class="reviews-count">(${reviewsText})</span></div>
                        <div class="doctor-availability" style="margin-top: 10px; font-size: 0.85rem; font-weight: 600; color: ${availabilityColor};">
                            <i class="far fa-clock"></i> En Yakın: ${nextAvailable}
                        </div>
                    </div>
                    <div class="doctor-actions">
                        <button class="btn btn-primary btn-sm" data-action="book-appointment">${getSafeTranslation('bookAppointmentQuick')}</button>
                        <button class="btn btn-secondary btn-sm" data-action="read-reviews">${getSafeTranslation('readReviews')}</button>
                    </div>
                `;
                container.appendChild(doctorItem);
            });
        }, 800); // 800ms simulated delay
    }

    function showReviews(doctorId, doctorName) {
        const doctorRatings = JSON.parse(localStorage.getItem('doctorRatings')) || [];
        const reviews = doctorRatings.filter(r => r.doctorId === doctorId);

        if (reviews.length === 0) {
            Swal.fire({
                title: getSafeTranslation('reviewsNotFoundTitle'),
                text: getSafeTranslation('reviewsNotFoundText').replace('{name}', doctor.name),
                icon: 'info',
                confirmButtonText: getSafeTranslation('ok')
            });
            return;
        }

        const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
        const starCount = Math.round(averageRating);
        const headerStars = Array(5).fill(0).map((_, i) => 
            i < starCount ? '<i class="fas fa-star" style="color: #FFD700;"></i>' : '<i class="fas fa-star" style="color: rgba(255,255,255,0.5);"></i>'
        ).join('');

        const reviewsHtml = reviews.map(r => `
            <div class="result-parameter-card" style="flex-direction: column; align-items: flex-start; gap: 10px;">
                <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                    <div style="color: #ffc107; font-size: 0.9rem;">
                        ${Array(5).fill(0).map((_, i) => i < r.rating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>').join('')}
                    </div>
                    <span style="font-size: 0.85rem; color: #6e6e73; font-weight: 500;">${anonymizeName(r.patientName)}</span>
                </div>
                <p style="margin: 0; color: #1d1d1f; font-style: italic; font-size: 0.95rem;">"${r.review}"</p>
                <div style="width: 100%; text-align: right; font-size: 0.75rem; color: #86868b;">
                    ${r.date || 'Tarih yok'}
                </div>
            </div>
        `).join('');

        const html = `
            <div class="modern-results-container">
                <div class="modern-results-header" style="text-align: center; padding: 30px 20px;">
                    <div style="width: 70px; height: 70px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px auto; font-size: 2rem; color: #fff;">
                        <i class="fas fa-user-md"></i>
                    </div>
                    <h2 style="color: #fff; margin-bottom: 5px;">${doctorName}</h2>
                    <div style="font-size: 1.2rem; margin-bottom: 5px;">${headerStars}</div>
                    <p style="color: rgba(255,255,255,0.9); font-size: 0.9rem;">${getSafeTranslation('averageRatingLabel')}: <strong>${averageRating.toFixed(1)}</strong> / 5 (${getSafeTranslation('reviewsCount').replace('{count}', reviews.length)})</p>
                </div>
                <div class="modern-results-body" style="background-color: #f5f5f7;">
                    ${reviewsHtml}
                </div>
            </div>
        `;

        Swal.fire({
            html: html,
            width: '600px',
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                popup: 'modern-swal-popup',
                htmlContainer: 'modern-swal-container'
            }
        });
    }

    function anonymizeName(name) {
        if (!name || typeof name !== 'string') return 'Anonim';
        return name.split(' ').map(word => {
            if (word.length <= 1) return '*';
            return word.charAt(0) + '*'.repeat(word.length - 1);
        }).join(' ');
    }
    
    function filterAndSearchDoctors() {
        const searchTerm = elements.doctorSearchInput.value.toLowerCase();
        const allBranchesLabel = getSafeTranslation('allBranches');
        const selectedBranch = (selection.branch === allBranchesLabel ? '' : selection.branch);
        const selectedRating = parseInt(elements.ratingFilterInput.value, 10);
        
        const doctorRatings = JSON.parse(localStorage.getItem('doctorRatings')) || [];
        const allLuminexUsers = getLuminexUsers();
        const actualDoctors = allLuminexUsers.filter(user => user.role === 'doctor');

        const filtered = actualDoctors.filter(doctor => {
            const nameMatch = doctor.name.toLowerCase().includes(searchTerm);
            const branchMatch = !selectedBranch || (doctor.branch && doctor.branch.toLowerCase() === selectedBranch.toLowerCase());
            
            let ratingMatch = true;
            if (selectedRating > 0) {
                const ratings = doctorRatings.filter(r => r.doctorId === doctor.id);
                const averageRating = ratings.length > 0 ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length : 0;
                ratingMatch = Math.round(averageRating) >= selectedRating; 
            }

            return nameMatch && branchMatch && ratingMatch;
        }).sort((a, b) => (a.branch || '').localeCompare(b.branch || '')); 
        
        renderDoctors(filtered);
    }

    function onBranchSelect(item) {
        selection.branch = (item && item.id !== '') ? item.name : '';
        if (item && item.id === '') elements.branchFilterInput.value = '';
    }

    if (elements.filterCardHeader) {
        const filterCard = elements.filterCardHeader.closest('.filter-card');
        elements.filterCardHeader.addEventListener('click', () => {
            filterCard.classList.toggle('collapsed');
        });
    }

    if (elements.applyFiltersBtn) {
        elements.applyFiltersBtn.addEventListener('click', filterAndSearchDoctors);
    }

    if (elements.clearFiltersBtn) {
        elements.clearFiltersBtn.addEventListener('click', () => {
            elements.doctorSearchInput.value = '';
            elements.branchFilterInput.value = '';
            elements.ratingFilterInput.value = '0';
            selection.branch = '';
            filterAndSearchDoctors();
        });
    }

    elements.doctorListContainer.addEventListener('click', function(event) {
        const button = event.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const doctorItem = button.closest('.doctor-item');
        const doctorId = doctorItem.dataset.id;
        const doctorBranch = doctorItem.dataset.branch;

        if (action === 'book-appointment') {
            if (doctorId && doctorBranch) {
                window.location.href = `appointment.html?doctorId=${doctorId}&branchName=${encodeURIComponent(doctorBranch)}`;
            } else {
                Swal.fire({ icon: 'error', title: getSafeTranslation('errorTitle'), text: getSafeTranslation('contentLoadError') });
            }
        } else if (action === 'read-reviews') {
            const doctorName = doctorItem.dataset.doctorName;
            showReviews(doctorId, doctorName);
        }
    });
    
    document.addEventListener('click', (e) => {
        if (e.target && !e.target.closest('.custom-select-wrapper')) {
            document.querySelectorAll('.custom-options-panel').forEach(panel => {
                if(panel) panel.classList.remove('visible');
            });
        }
    });

    const allLuminexUsers = getLuminexUsers();
    const allDoctors = allLuminexUsers.filter(user => user.role === 'doctor');

    const allBranchesOption = { id: '', name: getSafeTranslation('allBranches') };
    const translatedBranches = branches.map(b => ({
        id: b.id,
        name: getSafeTranslation(b.id)
    }));
    
    const sortedBranches = [allBranchesOption, ...translatedBranches.sort((a, b) => a.name.localeCompare(b.name, 'tr'))];
    
    setupCustomDropdown({
        input: elements.branchFilterInput,
        panel: elements.branchFilterPanel,
        items: sortedBranches,
        onSelect: onBranchSelect
    });

    const sortedDoctors = allDoctors.sort((a, b) => (a.branch || '').localeCompare(b.branch || ''));
    renderDoctors(sortedDoctors);
});