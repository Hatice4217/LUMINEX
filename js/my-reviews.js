import { setupHeader } from './utils/header-manager.js';
import { getLocalStorageItem, setLocalStorageItem, getActiveProfile } from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const elements = {
        list: document.getElementById('myReviewsList'),
        totalCount: document.getElementById('totalReviewsCount'),
        avgRating: document.getElementById('avgRatingValue'),
        searchDoc: document.getElementById('searchReviewDoc'),
        filterRating: document.getElementById('filterReviewRating'),
        applyBtn: document.getElementById('applyReviewFilters'),
        clearBtn: document.getElementById('clearReviewFilters'),
        filterHeader: document.querySelector('.filter-card-header'), // Get the whole header
        toggleFilter: document.getElementById('toggle-filter-body'),
        filterBody: document.getElementById('filter-card-body')
    };

    function getSafeTranslation(key) {
        return window.getTranslation ? window.getTranslation(key) : key;
    }

    function renderMyReviews() {
        const activeProfile = getActiveProfile();
        if (!activeProfile) {
            elements.list.innerHTML = `<p>Aktif bir profil bulunamadı. Lütfen giriş yapın.</p>`;
            return;
        }

        const allReviews = getLocalStorageItem('doctorRatings') || [];
        const allUsers = getLocalStorageItem('luminexUsers') || []; // Get all users for doctor/patient info

        // Filter reviews for the currently active profile
        const userReviews = allReviews.filter(r => r.patientTc === activeProfile.tc);

        // Update Stats
        elements.totalCount.textContent = userReviews.length;
        const avg = userReviews.length > 0 ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length).toFixed(1) : '0.0';
        elements.avgRating.textContent = avg;

        // Apply Search/Filter
        const search = elements.searchDoc.value.toLowerCase();
        const ratingFilter = elements.filterRating.value;

        const filtered = userReviews.filter(r => {
            const doctor = allUsers.find(u => u.id === r.doctorId);
            const doctorName = doctor ? doctor.name : 'Bilinmeyen Doktor';
            
            const matchesSearch = doctorName.toLowerCase().includes(search) || 
                                 (r.comment && r.comment.toLowerCase().includes(search));
            const matchesRating = ratingFilter === 'all' || r.rating.toString() === ratingFilter;
            return matchesSearch && matchesRating;
        });

        elements.list.innerHTML = '';

        if (filtered.length === 0) {
            elements.list.innerHTML = `<div class="card no-results-card" style="text-align:center; padding: 50px;">
                <i class="fas fa-search" style="font-size: 3rem; opacity: 0.2; margin-bottom: 15px;"></i>
                <p>${getSafeTranslation('noReviewsFoundPlaceholder')}</p>
            </div>`;
            return;
        }

        filtered.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(r => {
            const card = document.createElement('div');
            card.className = 'review-card-modern reveal';
            
            const doctor = allUsers.find(u => u.id === r.doctorId);
            const doctorName = doctor ? doctor.name : 'Bilinmeyen Doktor';

            const currentLang = localStorage.getItem('language') || 'tr';
            const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

            const stars = Array(5).fill(0).map((_, i) => 
                `<i class="fas fa-star" style="color: ${i < r.rating ? '#ffb800' : '#dfe4ea'}"></i>`
            ).join('');

            card.innerHTML = `
                <div class="review-header-new">
                    <div class="doc-badge-info">
                        <div class="doc-icon-circle"><i class="fas fa-user-md"></i></div>
                        <div>
                            <h4 style="margin:0; font-size: 1.1rem; color: var(--text-color);">${doctorName}</h4>
                            <span style="font-size: 0.8rem; color: var(--text-light);">${new Date(r.date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                    </div>
                    <div class="stars-wrap" style="display: flex; gap: 3px;">${stars}</div>
                </div>
                <div class="review-text-quote">${r.comment}</div>
                <div class="review-footer-actions">
                    <span style="font-size: 0.8rem; color: var(--text-light);"><i class="fas fa-check-circle" style="color: #00b894;"></i> İncelendi</span>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-action-minimal" onclick="window.editReview('${r.id}')"><i class="fas fa-edit"></i> ${getSafeTranslation('editReview')}</button>
                        <button class="btn-action-minimal delete" onclick="window.deleteReview('${r.id}')"><i class="fas fa-trash-alt"></i> ${getSafeTranslation('deleteReview')}</button>
                    </div>
                </div>
            `;
            elements.list.appendChild(card);
        });

        // Re-init reveal animations for new items
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('active');
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    }

    // --- REVEAL ANIMATIONS ---
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // --- BUTTON ACTIONS ---
    // Removed real-time listeners to apply filters only on button click
    
    if(elements.applyBtn) {
        elements.applyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            renderMyReviews();
        });
    }

    if(elements.clearBtn) {
        elements.clearBtn.addEventListener('click', () => {
            elements.searchDoc.value = '';
            elements.filterRating.value = 'all';
            renderMyReviews();
        });
    }

    if(elements.filterHeader) {
        const filterCard = elements.filterHeader.closest('.filter-card');
        elements.filterHeader.addEventListener('click', (e) => {
            if (e.target.closest('.filter-form-compact')) return;
            filterCard.classList.toggle('collapsed');
        });
    }

    // Global Functions for buttons
    window.deleteReview = (id) => {
        Swal.fire({
            title: getSafeTranslation('deleteReviewConfirm'),
            text: getSafeTranslation('deleteReviewConfirmMsg'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff4757',
            confirmButtonText: getSafeTranslation('yesDelete'),
            cancelButtonText: getSafeTranslation('cancel'),
            customClass: { popup: 'modern-swal-popup', confirmButton: 'modern-swal-confirm-button' }
        }).then(res => {
            if (res.isConfirmed) {
                let all = getLocalStorageItem('doctorRatings') || [];
                setLocalStorageItem('doctorRatings', all.filter(r => r.id !== id));
                Swal.fire(getSafeTranslation('deleted'), '', 'success');
                renderMyReviews();
            }
        });
    };

    window.editReview = (id) => {
        const all = getLocalStorageItem('doctorRatings') || [];
        const review = all.find(r => r.id === id);
        if(!review) return;

        Swal.fire({
            title: getSafeTranslation('editYourReview'),
            html: `
                <div class="star-rating-input" style="display:flex; justify-content:center; gap:10px; margin-bottom:20px; font-size:2rem; color:#dfe4ea;">
                    ${[1,2,3,4,5].map(i => `<i class="fas fa-star" data-rating="${i}" style="cursor:pointer; transition:all 0.2s; ${i <= review.rating ? 'color:#ffb800' : ''}"></i>`).join('')}
                </div>
                <textarea id="editReviewText" class="form-control" style="height:120px; border-radius:15px; padding:15px;">${review.review}</textarea>
            `,
            didOpen: () => {
                const stars = Swal.getPopup().querySelectorAll('.fa-star');
                let currentRating = review.rating;
                stars.forEach(s => {
                    s.addEventListener('click', () => {
                        currentRating = s.dataset.rating;
                        stars.forEach((st, idx) => st.style.color = idx < currentRating ? '#ffb800' : '#dfe4ea');
                    });
                });
                window._tempRating = () => currentRating;
            },
            showCancelButton: true,
            confirmButtonText: getSafeTranslation('saveChanges'),
            confirmButtonColor: 'var(--primary-color)',
            preConfirm: () => {
                const text = document.getElementById('editReviewText').value;
                if(!text.trim()) { Swal.showValidationMessage('Lütfen bir yorum yazın'); return false; }
                return { rating: parseInt(window._tempRating()), review: text.trim() };
            }
        }).then(res => {
            if(res.isConfirmed) {
                const index = all.findIndex(r => r.id === id);
                all[index].rating = res.value.rating;
                all[index].review = res.value.review;
                setLocalStorageItem('doctorRatings', all);
                Swal.fire('Başarılı!', '', 'success');
                renderMyReviews();
            }
        });
    };

    renderMyReviews();
});