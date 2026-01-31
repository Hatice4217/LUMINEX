import { setupHeader } from './utils/header-manager.js';
import { getLoggedInUser, getLocalStorageItem } from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const loggedInDoctor = getLoggedInUser();
    if (!loggedInDoctor || loggedInDoctor.role !== 'doctor') {
        window.location.href = 'login.html';
        return;
    }

    const elements = {
        reviewsSummaryContainer: document.getElementById('reviews-summary'),
        reviewsListContainer: document.getElementById('reviews-list'),
        ratingInput: document.getElementById('filter-rating'),
        ratingPanel: document.getElementById('ratingPanel'),
        applyFiltersBtn: document.getElementById('applyFilters'),
        clearFiltersBtn: document.getElementById('clearFilters'),
        filterCardHeader: document.querySelector('.filter-card-header'),
        filterCardBody: document.getElementById('filter-card-body'),
        toggleFilterBtn: document.getElementById('toggle-filter-body')
    };

    let activeFilter = 'Tümü';

    // --- Helpers ---
    function anonymizeName(name) {
        if (!name || typeof name !== 'string') return 'Anonim';
        return name.split(' ').map((word, index) => {
            if (index === 0) return word; 
            return word.charAt(0) + '.'; 
        }).join(' ');
    }

    function renderStarRating(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<i class="fas fa-star ${i <= rating ? 'selected' : ''}" style="${i <= rating ? 'color: #FFD700;' : 'color: #ddd;'}"></i>`;
        }
        return stars;
    }

    // --- Dropdown Logic ---
    function populatePanel(panel, items) {
        if (!panel || !items) return;
        panel.innerHTML = '';
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'custom-option';
            // Render stars in dropdown
            if (item.id === 'all') {
                div.textContent = item.name;
            } else {
                div.innerHTML = `<div style="display:flex; align-items:center; gap:5px;"><span>${item.name}</span> ${renderStarRating(item.value)}</div>`;
            }
            div.dataset.value = item.value; // Store numeric value or 'all'
            div.dataset.label = item.name;
            panel.appendChild(div);
        });
    }

    function setupCustomDropdown(config) {
        const { input, panel, onSelect, items } = config;
        
        populatePanel(panel, items);

        input.addEventListener('click', (e) => {
            e.stopPropagation();
            panel.classList.add('visible');
        });

        panel.addEventListener('click', (e) => {
            const option = e.target.closest('.custom-option');
            if (option) {
                const value = option.dataset.value;
                const label = option.dataset.label;
                
                // For display, maybe show just text or text + stars? Let's show text
                input.value = label;
                activeFilter = value;
                
                panel.classList.remove('visible');
                if (onSelect) onSelect(value);
            }
        });

        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !panel.contains(e.target)) {
                panel.classList.remove('visible');
            }
        });
    }

    // --- Render Functions ---
    function renderReviews() {
        const allRatings = getLocalStorageItem('doctorRatings') || [];
        let doctorRatings = allRatings.filter(r => r.doctorId === loggedInDoctor.id);

        // Filter
        if (activeFilter !== 'Tümü' && activeFilter !== 'all') {
            const ratingVal = parseInt(activeFilter);
            doctorRatings = doctorRatings.filter(r => r.rating === ratingVal);
        }

        // Update Summary (Always based on TOTAL ratings, or filtered? Usually total is better for dashboard header, but filter affects list)
        // Let's keep summary for ALL ratings to show overall performance.
        const allDocRatings = allRatings.filter(r => r.doctorId === loggedInDoctor.id);
        renderSummary(allDocRatings);

        // Render List
        elements.reviewsListContainer.innerHTML = '';
        if (doctorRatings.length === 0) {
            elements.reviewsListContainer.innerHTML = `
                <div class="no-results-card">
                    <i class="fas fa-comment-slash"></i>
                    <p>Bu kriterlere uygun değerlendirme bulunamadı.</p>
                </div>`;
            return;
        }

        doctorRatings
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(review => {
                const card = document.createElement('div');
                // Using styles similar to 'result-parameter-card' but custom for review
                card.className = 'review-card-premium'; 
                card.style.cssText = `
                    background: #fff;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 15px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                    border: 1px solid #f0f0f0;
                    transition: transform 0.2s ease;
                `;
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 40px; height: 40px; background: #e3f2fd; color: var(--primary-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600;">
                                ${review.patientName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style="font-weight: 600; color: #333;">${anonymizeName(review.patientName)}</div>
                                <div style="font-size: 0.8rem; color: #888;">${new Date(review.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            </div>
                        </div>
                        <div style="background: #fff8e1; padding: 5px 10px; border-radius: 20px; border: 1px solid #ffe082;">
                            ${renderStarRating(review.rating)}
                        </div>
                    </div>
                    <p style="color: #555; line-height: 1.6; font-style: italic;">"${review.review}"</p>
                `;
                elements.reviewsListContainer.appendChild(card);
            });
    }

    function renderSummary(ratings) {
        if (!elements.reviewsSummaryContainer) return;
        
        const total = ratings.length;
        const avg = total > 0 ? (ratings.reduce((a, b) => a + b.rating, 0) / total).toFixed(1) : '0.0';
        
        // Calculate distribution
        const distribution = { 5:0, 4:0, 3:0, 2:0, 1:0 };
        ratings.forEach(r => distribution[r.rating] = (distribution[r.rating] || 0) + 1);

        elements.reviewsSummaryContainer.innerHTML = `
            <div style="display: flex; gap: 30px; align-items: center; flex-wrap: wrap;">
                <div style="text-align: center; min-width: 150px;">
                    <div style="font-size: 3.5rem; font-weight: 700; color: var(--primary-color); line-height: 1;">${avg}</div>
                    <div style="margin: 5px 0;">${renderStarRating(Math.round(avg))}</div>
                    <div style="color: #666; font-size: 0.9rem;">Toplam ${total} değerlendirme</div>
                </div>
                
                <div style="flex: 1; border-left: 1px solid #eee; padding-left: 30px;">
                    ${[5, 4, 3, 2, 1].map(star => {
                        const count = distribution[star];
                        const percentage = total > 0 ? (count / total) * 100 : 0;
                        return `
                            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                                <span style="font-weight: 600; width: 10px;">${star}</span> <i class="fas fa-star" style="font-size: 0.8rem; color: #FFD700;"></i>
                                <div style="flex: 1; height: 8px; background: #eee; border-radius: 4px; overflow: hidden;">
                                    <div style="width: ${percentage}%; height: 100%; background: #FFD700; border-radius: 4px;"></div>
                                </div>
                                <span style="font-size: 0.8rem; color: #666; width: 30px; text-align: right;">${count}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // --- Initial Setup ---
    const ratingOptions = [
        { name: 'Tümü', value: 'all', id: 'all' },
        { name: '5 Yıldız', value: 5, id: '5' },
        { name: '4 Yıldız', value: 4, id: '4' },
        { name: '3 Yıldız', value: 3, id: '3' },
        { name: '2 Yıldız', value: 2, id: '2' },
        { name: '1 Yıldız', value: 1, id: '1' }
    ];

    setupCustomDropdown({
        input: elements.ratingInput,
        panel: elements.ratingPanel,
        items: ratingOptions,
        onSelect: (val) => {
            // activeFilter is set inside setupCustomDropdown click handler based on logic above, 
            // but we can trigger render here.
            renderReviews();
        }
    });

    if (elements.filterCardHeader) {
        elements.filterCardHeader.addEventListener('click', () => {
            const isCollapsed = elements.filterCardBody.classList.toggle('collapsed');
            const icon = elements.toggleFilterBtn.querySelector('i');
            icon.className = `fas ${isCollapsed ? 'fa-chevron-up' : 'fa-chevron-down'}`;
        });
    }

    if (elements.applyFiltersBtn) elements.applyFiltersBtn.addEventListener('click', renderReviews);
    
    if (elements.clearFiltersBtn) {
        elements.clearFiltersBtn.addEventListener('click', () => {
            elements.ratingInput.value = 'Tümü';
            activeFilter = 'all';
            renderReviews();
        });
    }

    renderReviews();
});
