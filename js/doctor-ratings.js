import { dummyDoctors, branches } from './utils/data.js';
import { setupHeader } from './utils/header-manager.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader(); // Call setupHeader to display welcome message and handle logout
    // --- State & Elements ---
    let selection = { branch: '' };
    const doctorSearchInput = document.getElementById('doctorSearchInput');
    const doctorRatingsListContainer = document.getElementById('doctorRatingsList');
    const branchFilter = {
        input: document.getElementById('branchFilterInput'),
        panel: document.getElementById('branchFilterPanel')
    };

    if (!doctorRatingsListContainer || !branchFilter.input || !branchFilter.panel) {
        console.error("doctor-ratings.js: A required element was not found!");
        return;
    }

    // --- Helper to get Initials ---
    function getInitials(name) {
        const words = name.replace('Dr. ', '').split(' ');
        if (words.length > 1) {
            return (words[0][0] + words[words.length - 1][0]).toUpperCase();
        } else if (words.length === 1 && words[0].length > 1) {
            return (words[0][0] + words[0][1]).toUpperCase();
        }
        return (name[0] || '').toUpperCase();
    }
    
    // --- Custom Dropdown Functions ---
    function populatePanel(panel, items) {
        if (!panel) return;
        panel.innerHTML = '';
        if (!items) return;
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

        input.addEventListener('focus', () => {
            panel.classList.add('visible');
            filterPanel(panel, '');
        });

        input.addEventListener('input', () => {
            panel.classList.add('visible');
            filterPanel(panel, input.value);
            if (input.value === '') {
                onSelect({ id: '', name: '' });
            }
        });

        panel.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('custom-option')) {
                const item = { id: e.target.dataset.id, name: e.target.textContent };
                input.value = item.name;
                panel.classList.remove('visible');
                onSelect(item);
            }
        });
    }

    function filterPanel(panel, filter) {
        if (!panel) return;
        panel.querySelectorAll('.custom-option').forEach(opt => {
            opt.style.display = opt.textContent.toLowerCase().includes(filter.toLowerCase()) ? '' : 'none';
        });
    }

    // --- Page-Specific Functions ---
    function renderDoctorRatings(doctors) {
        doctorRatingsListContainer.innerHTML = '';
        if (doctors.length === 0) {
            doctorRatingsListContainer.innerHTML = '<p>Aradığınız kriterlere uygun doktor bulunamadı.</p>';
            return;
        }

        const doctorRatings = JSON.parse(localStorage.getItem('doctorRatings')) || [];

        doctors.forEach(doctor => {
            const doctorItem = document.createElement('div');
            doctorItem.classList.add('doctor-item');
            doctorItem.dataset.id = doctor.id;
            doctorItem.dataset.doctorName = doctor.name;

            const ratings = doctorRatings.filter(r => r.doctorId === doctor.id);
            const averageRating = ratings.length > 0 ? ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length : 0;

            const stars = Array(5).fill(0).map((_, i) => 
                i < Math.round(averageRating) ? '<i class="fas fa-star selected"></i>' : '<i class="fas fa-star"></i>'
            ).join('');

            doctorItem.innerHTML = `
                <div class="doctor-initials ${doctor.gender}">${getInitials(doctor.name)}</div>
                <div class="doctor-details">
                    <h3>${doctor.name}</h3>
                    <p>${doctor.branch}</p>
                    <div class="doctor-rating">${stars} (${ratings.length} değerlendirme)</div>
                </div>
                <div class="doctor-actions">
                    <button class="btn btn-primary btn-sm" data-action="rate-doctor">Değerlendir</button>
                    <button class="btn btn-secondary btn-sm" data-action="read-reviews">Yorumları Oku</button>
                </div>
            `;
            doctorRatingsListContainer.appendChild(doctorItem);
        });
    }

    function showReviews(doctorId, doctorName) {
        const doctorRatings = JSON.parse(localStorage.getItem('doctorRatings')) || [];
        const reviews = doctorRatings.filter(r => r.doctorId === doctorId);
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

        if (reviews.length === 0) {
            Swal.fire({
                title: `${doctorName} için hiç yorum bulunamadı.`,
                icon: 'info'
            });
            return;
        }

        const reviewsHtml = reviews.map(r => {
            // const isMyReview = loggedInUser && (r.patientTc === loggedInUser.tc); // Keep this logic if needed for other purposes
            const deleteBtn = ''; // Always empty, effectively removing the delete button
            
            return `
            <div class="review-item" style="position: relative;">
                <div class="review-rating">${Array(5).fill(0).map((_, i) => i < r.rating ? '<i class="fas fa-star selected"></i>' : '<i class="fas fa-star"></i>').join('')}</div>
                <p class="review-text">"${r.review}"</p>
                <p class="review-author">- ${anonymizeName(r.patientName)}</p>
                ${deleteBtn}
            </div>
        `}).join('');

        Swal.fire({
            title: `${doctorName} için Yorumlar`,
            html: `<div class="reviews-container">${reviewsHtml}</div>`,
            width: '600px',
            didOpen: () => {
                const popup = Swal.getPopup();
                popup.addEventListener('click', (e) => {
                    if (e.target.classList.contains('delete-review-btn')) {
                        const reviewId = e.target.dataset.id;
                        Swal.fire({
                            title: 'Emin misiniz?',
                            text: "Bu yorumu silmek istediğinizden emin misiniz?",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#d33',
                            cancelButtonColor: '#3085d6',
                            confirmButtonText: 'Evet, sil',
                            cancelButtonText: 'İptal'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                let allRatings = JSON.parse(localStorage.getItem('doctorRatings')) || [];
                                allRatings = allRatings.filter(r => r.id !== reviewId && r.id != reviewId); // Handle both string/number IDs just in case
                                localStorage.setItem('doctorRatings', JSON.stringify(allRatings));
                                
                                Swal.fire('Silindi!', 'Yorumunuz silindi.', 'success').then(() => {
                                    // Refresh the reviews list or close
                                    // To refresh, we would recursively call showReviews, but we need to handle the stack.
                                    // Simplest is to close and let user re-open, or just show success.
                                    // Let's re-open to show updated list.
                                    showReviews(doctorId, doctorName);
                                    filterAndSearchDoctors(); // Update average ratings on main page
                                });
                            } else {
                                // If cancelled, re-show reviews because the warning closed the reviews modal
                                showReviews(doctorId, doctorName);
                            }
                        });
                    }
                });
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
        const searchTerm = doctorSearchInput.value.toLowerCase();
        const selectedBranch = selection.branch;

        const filtered = dummyDoctors.filter(doctor => {
            const matchesSearch = doctor.name.toLowerCase().includes(searchTerm) ||
                                  doctor.branch.toLowerCase().includes(searchTerm);
            const matchesBranch = !selectedBranch || doctor.branch === selectedBranch;

            return matchesSearch && matchesBranch;
        }).sort((a, b) => a.branch.localeCompare(b.branch));
        renderDoctorRatings(filtered);
    }

    function onBranchSelect(item) {
        selection.branch = item ? item.name : '';
        // If "Tüm Branşlar" is selected, the input should be cleared
        if (item && item.id === '') {
            branchFilter.input.value = '';
        }
        filterAndSearchDoctors();
    }

    function showRatingForm(doctorId, doctorName) {
        Swal.fire({
            title: `${doctorName} için Değerlendirme Yap`,
            html: `
                <div class="swal2-html-container" style="text-align: left;">
                    <p>Lütfen doktoru 1 ile 5 yıldız arasında değerlendirin ve yorumunuzu yazın.</p>
                    <div class="star-rating-input" style="display: flex; justify-content: center; margin: 20px 0;">
                        <i class="fas fa-star" data-rating="1"></i>
                        <i class="fas fa-star" data-rating="2"></i>
                        <i class="fas fa-star" data-rating="3"></i>
                        <i class="fas fa-star" data-rating="4"></i>
                        <i class="fas fa-star" data-rating="5"></i>
                    </div>
                    <textarea id="swal-input-review" class="swal2-textarea" placeholder="Yorumunuzu buraya yazın..." style="height: 100px;"></textarea>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Gönder',
            cancelButtonText: 'İptal',
            preConfirm: () => {
                const selectedStars = Swal.getPopup().querySelectorAll('.star-rating-input .selected');
                const rating = selectedStars.length > 0 ? selectedStars[selectedStars.length - 1].dataset.rating : null;
                const review = Swal.getPopup().querySelector('#swal-input-review').value;

                if (!rating) {
                    Swal.showValidationMessage('Lütfen bir yıldız seçerek doktoru değerlendirin.');
                    return false;
                }
                if (!review.trim()) {
                    Swal.showValidationMessage('Lütfen yorumunuzu yazın.');
                    return false;
                }
                return { rating: parseInt(rating), review: review.trim() };
            },
            didOpen: () => {
                const stars = Swal.getPopup().querySelectorAll('.star-rating-input .fa-star');
                stars.forEach(star => {
                    star.addEventListener('click', function() {
                        const selectedRating = parseInt(this.dataset.rating);
                        stars.forEach(s => {
                            if (parseInt(s.dataset.rating) <= selectedRating) {
                                s.classList.add('selected');
                            } else {
                                s.classList.remove('selected');
                            }
                        });
                    });
                });
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const { rating, review } = result.value;
                saveDoctorRating(doctorId, doctorName, rating, review);
                Swal.fire('Başarılı!', 'Değerlendirmeniz gönderildi.', 'success');
                filterAndSearchDoctors(); // Re-render to update average rating
            }
        });
    }

    function saveDoctorRating(doctorId, doctorName, rating, review) {
        let allDoctorRatings = JSON.parse(localStorage.getItem('doctorRatings')) || [];
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

        const newRating = {
            id: `rating-${Date.now()}`, // Unique ID for the rating
            doctorId: doctorId, // Use doctorId for consistency
            doctorName: doctorName,
            patientName: loggedInUser ? loggedInUser.name : 'Anonim', // Get patient name from session
            patientTc: loggedInUser ? loggedInUser.tc : null,
            rating: rating,
            review: review,
            date: new Date().toISOString().slice(0, 10) // YYYY-MM-DD
        };

        allDoctorRatings.push(newRating);
        localStorage.setItem('doctorRatings', JSON.stringify(allDoctorRatings));
    }

    // --- Event Listeners ---
    doctorSearchInput.addEventListener('keyup', filterAndSearchDoctors);

    doctorRatingsListContainer.addEventListener('click', function(event) {
        const button = event.target.closest('button');
        if (!button) return;

        const action = button.dataset.action;
        const doctorItem = button.closest('.doctor-item');
        const doctorId = doctorItem.dataset.id;
        const doctorName = doctorItem.dataset.doctorName;

        if (action === 'rate-doctor') {
            showRatingForm(doctorId, doctorName);
        } else if (action === 'read-reviews') {
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

    // --- Initial Load ---
    const allBranchesOption = { id: '', name: 'Tüm Branşlar' };
    const sortedBranches = [allBranchesOption, ...branches].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    setupCustomDropdown({
        input: branchFilter.input,
        panel: branchFilter.panel,
        items: sortedBranches,
        onSelect: onBranchSelect
    });
    // Initial sort by branch
    const sortedDoctors = dummyDoctors.sort((a, b) => a.branch.localeCompare(b.branch));
    renderDoctorRatings(sortedDoctors);
});