import { getLuminexUsers, getDoctorDisplayName } from './utils/storage-utils.js';
import { setupHeader } from './utils/header-manager.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const elements = {
        doctorsListContainer: document.getElementById('doctors-list'),
        searchInput: document.getElementById('doctorSearch'),
        branchTabs: document.getElementById('branchTabs')
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

    let allDoctors = [];
    let selectedBranch = 'all';
    let searchTerm = '';

    function getDoctorInitials(name) {
        const cleanName = name ? name.replace(/^(Dr\.?\s*)+/i, '') : '';
        return cleanName
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    function renderBranchTabs(doctors) {
        const branches = [...new Set(doctors.map(d => d.branch).filter(b => b))];

        elements.branchTabs.innerHTML = `
            <button class="branch-tab all ${selectedBranch === 'all' ? 'active' : ''}" data-branch="all">
                ${getSafeTranslation('all')}
            </button>
        `;

        branches.forEach(branch => {
            const tab = document.createElement('button');
            tab.className = `branch-tab ${selectedBranch === branch ? 'active' : ''}`;
            tab.dataset.branch = branch;
            tab.textContent = translateBranch(branch);
            elements.branchTabs.appendChild(tab);
        });

        // Tab click events
        elements.branchTabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.branch-tab');
            if (!tab) return;

            document.querySelectorAll('.branch-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            selectedBranch = tab.dataset.branch;
            filterAndSearchDoctors();
        });
    }

    function renderDoctors(doctors) {
        if (doctors.length === 0) {
            elements.doctorsListContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-doctor"></i>
                    <h3>${getSafeTranslation('noDoctorsFound')}</h3>
                    <p>${getSafeTranslation('noDoctorsDesc')}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">${getSafeTranslation('tryAgain')}</button>
                </div>
            `;
            return;
        }

        const currentLang = localStorage.getItem('language') || 'tr';
        const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

        elements.doctorsListContainer.innerHTML = '';

        doctors.forEach(doctor => {
            const initials = getDoctorInitials(doctor.name || 'Dr');
            const branchName = translateBranch(doctor.branch);
            const currentLang = localStorage.getItem('language') || 'tr';

            const doctorCard = document.createElement('div');
            doctorCard.className = 'doctor-card';
            doctorCard.dataset.id = doctor.id;
            doctorCard.dataset.branch = doctor.branch;

            doctorCard.innerHTML = `
                <div class="doctor-header">
                    <div class="doctor-avatar">
                        <i class="fas fa-user-md"></i>
                    </div>
                    <div class="doctor-info">
                        <h3>${getDoctorDisplayName(doctor.name)}</h3>
                        <span class="doctor-branch">${branchName}</span>
                    </div>
                </div>
                <div class="doctor-meta">
                    <div class="doctor-meta-item">
                        <i class="fas fa-hospital"></i>
                        <span>${doctor.hospital || getSafeTranslation('luminexHospital')}</span>
                    </div>
                    <div class="doctor-meta-item">
                        <i class="fas fa-stethoscope"></i>
                        <span>${doctor.experience ? `${doctor.experience} ${getSafeTranslation('years')}` : ''}</span>
                    </div>
                </div>
                <div class="doctor-rating">
                    <div class="stars">
                        ${Array(5).fill(0).map((_, i) => `
                            <i class="fas fa-star" style="${i < (doctor.rating || 4) ? '' : 'color: #ddd;'}"></i>
                        `).join('')}
                    </div>
                    <span class="rating-count">(${doctor.reviewCount || 0})</span>
                </div>
                <div class="doctor-actions">
                    <button class="doctor-btn profile" data-action="profile" data-id="${doctor.id}">
                        <i class="fas fa-info-circle"></i>
                        ${getSafeTranslation('profile')}
                    </button>
                    <button class="doctor-btn book" data-action="book" data-id="${doctor.id}" data-branch="${doctor.branch}">
                        <i class="fas fa-calendar-plus"></i>
                        ${getSafeTranslation('bookAppointment')}
                    </button>
                </div>
            `;

            elements.doctorsListContainer.appendChild(doctorCard);
        });
    }

    function filterAndSearchDoctors() {
        let filtered = [...allDoctors];

        // Filter by branch
        if (selectedBranch !== 'all') {
            filtered = filtered.filter(d => d.branch === selectedBranch);
        }

        // Search by name or branch
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(d =>
                (d.name && d.name.toLowerCase().includes(searchLower)) ||
                (d.branch && d.branch.toLowerCase().includes(searchLower))
            );
        }

        renderDoctors(filtered);
    }

    function loadDoctors() {
        const allUsers = getLuminexUsers();
        allDoctors = allUsers.filter(user => user.role === 'doctor');

        if (allDoctors.length === 0) {
            elements.doctorsListContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-doctor"></i>
                    <h3>${getSafeTranslation('noDoctors')}</h3>
                    <p>${getSafeTranslation('noDoctorsDesc')}</p>
                </div>
            `;
            return;
        }

        renderBranchTabs(allDoctors);
        renderDoctors(allDoctors);
    }

    // Search input event
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            filterAndSearchDoctors();
        });
    }

    // Doctor card click events
    elements.doctorsListContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.doctor-btn');
        if (!button) return;

        const action = button.dataset.action;
        const doctorId = button.dataset.id;
        const doctor = allDoctors.find(d => d.id === doctorId);

        if (!doctor) return;

        if (action === 'profile') {
            // Show doctor profile modal
            const branchName = translateBranch(doctor.branch);
            Swal.fire({
                title: '',
                html: `
                    <div style="text-align: left; font-family: 'Poppins', sans-serif;">
                        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px solid rgba(0,31,107,0.08);">
                            <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #001F6B 0%, #003B8E 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">
                                <i class="fas fa-user-md"></i>
                            </div>
                            <div>
                                <h3 style="margin: 0 0 5px 0; color: #001F6B; font-size: 1.4rem;">${getDoctorDisplayName(doctor.name)}</h3>
                                <span style="display: inline-block; padding: 4px 12px; background: rgba(120,199,199,0.15); color: #78C7C7; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">${branchName}</span>
                            </div>
                        </div>
                        <p style="margin-bottom: 12px;"><strong style="color: #001F6B;">${getSafeTranslation('hospitalLabel')}:</strong> ${doctor.hospital || getSafeTranslation('luminexHospital')}</p>
                        <p style="margin-bottom: 12px;"><strong style="color: #001F6B;">${getSafeTranslation('experienceLabel')}:</strong> ${doctor.experience ? `${doctor.experience} ${getSafeTranslation('years')}` : '-'}</p>
                        <p style="margin-bottom: 12px;"><strong style="color: #001F6B;">${getSafeTranslation('branchSelection')}:</strong> ${branchName}</p>
                        ${doctor.bio ? `<p style="margin-bottom: 0;"><strong style="color: #001F6B;">${getSafeTranslation('aboutDoctor')}:</strong><br><span style="color: #64748b;">${doctor.bio}</span></p>` : ''}
                    </div>
                `,
                confirmButtonText: getSafeTranslation('close'),
                confirmButtonColor: '#001F6B'
            });
        } else if (action === 'book') {
            // Navigate to appointment page
            const branchName = button.dataset.branch;
            window.location.href = `appointment.html?doctorId=${doctorId}&branchName=${encodeURIComponent(branchName)}`;
        }
    });

    // Initial load
    loadDoctors();
});
