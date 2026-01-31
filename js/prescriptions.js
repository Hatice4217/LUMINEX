import { setupHeader } from './utils/header-manager.js';
import {
    getActiveProfile,
    getLuminexPrescriptions,
    getLuminexUsers
} from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();
    function getSafeTranslation(key) {
        return window.getTranslation ? window.getTranslation(key) : key;
    }

    function renderPrescriptions(prescriptions) {
        elements.prescriptionsListContainer.innerHTML = '';
        if (prescriptions.length === 0) {
            elements.prescriptionsListContainer.innerHTML = `<div class="card no-results-card"><p>${getSafeTranslation('noPrescriptionsFound')}</p></div>`;
            return;
        }

        const currentLang = localStorage.getItem('language') || 'tr';
        const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

        prescriptions.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'prescription-item reveal'; // Added reveal
            
            const status = item.status || getSafeTranslation('completed');
            let statusClass = 'badge-success'; 
            
            // Fallback for missing diagnosis in old data
            const diagnosis = item.diagnosis || item.notes || getSafeTranslation('unspecifiedDiagnosis');
            
            itemEl.innerHTML = `
                <div class="prescription-main">
                    <div class="prescription-icon">
                        <i class="fas fa-file-prescription"></i>
                    </div>
                    <div class="prescription-details">
                        <span class="history-date">${new Date(item.date).toLocaleDateString(dateLocale)}</span>
                        <h3>${diagnosis}</h3>
                        <p>${getSafeTranslation('doctorLabel')}: ${item.doctorName}</p>
                        <p><span class="badge ${statusClass}">${status}</span></p>
                    </div>
                </div>
                <div class="prescription-actions">
                    <button class="btn btn-sm btn-info" data-action="view-details" data-id="${item.id}">${getSafeTranslation('prescriptionDetail')}</button>
                    <button class="btn btn-sm btn-primary" data-action="download-pdf" data-id="${item.id}">${getSafeTranslation('downloadPdf')}</button>
                </div>
            `;
            elements.prescriptionsListContainer.appendChild(itemEl);
        });

        // Trigger reveal animations
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    }

    function showDetailsModal(id) {
        const item = getLuminexPrescriptions().find(p => p.id === id);
        if (!item) return;

        const currentLang = localStorage.getItem('language') || 'tr';
        const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

        let medicinesHtml = item.medications.map(med => `
            <div class="result-parameter-card">
                <div class="parameter-info">
                    <span class="parameter-name">${med.name}</span>
                    <span class="parameter-range">${getSafeTranslation('dosage')}: ${med.dosage}</span>
                </div>
                <div class="parameter-value">
                    <span class="unit" style="font-size: 1rem; text-align: right;">${med.instructions || ''}</span>
                </div>
            </div>
        `).join('');

        const fullHtml = `
            <div class="modern-results-container">
                <div class="modern-results-header">
                    <h2>${getSafeTranslation('prescriptionDetailsTitle')}</h2>
                    <p><strong>${getSafeTranslation('dateLabel')}:</strong> ${new Date(item.date).toLocaleDateString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric' })} | <strong>${getSafeTranslation('doctorLabel')}:</strong> ${item.doctorName}</p>
                    <p><strong>${getSafeTranslation('diagnosisLabel')}:</strong> ${item.diagnosis || item.notes || getSafeTranslation('unspecifiedDiagnosis')}</p>
                </div>
                <div class="modern-results-body">
                    ${medicinesHtml}
                </div>
            </div>
        `;

        Swal.fire({
            html: fullHtml,
            showCloseButton: true,
            showConfirmButton: false,
            width: '800px',
            customClass: {
                popup: 'modern-swal-popup',
                htmlContainer: 'modern-swal-container'
            }
        });
    }

    function loadPrescriptions() {
        const allPrescriptions = getLuminexPrescriptions();
        
        const filters = {
            startDate: elements.startDateInput.value,
            endDate: elements.endDateInput.value,
            doctor: elements.doctorInput ? elements.doctorInput.value.toLowerCase() : '',
        };

        let userPrescriptions = allPrescriptions;

        if (filters.startDate) userPrescriptions = userPrescriptions.filter(p => p.date >= filters.startDate);
        if (filters.endDate) userPrescriptions = userPrescriptions.filter(p => p.date <= filters.endDate);
        if (filters.doctor) userPrescriptions = userPrescriptions.filter(p => p.doctorName.toLowerCase().includes(filters.doctor));
        
        renderPrescriptions(userPrescriptions);
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
        elements.filterCardHeader.addEventListener('click', () => {
            filterCard.classList.toggle('collapsed');
        });
    }

    if (elements.applyFiltersBtn) {
        elements.applyFiltersBtn.addEventListener('click', loadPrescriptions);
    }

    if (elements.clearFiltersBtn) {
        elements.clearFiltersBtn.addEventListener('click', () => {
            elements.startDateInput.value = '';
            elements.endDateInput.value = '';
            if (elements.doctorInput) elements.doctorInput.value = '';
            loadPrescriptions();
        });
    }
    
    elements.activeFiltersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-pill')) {
            const keyToRemove = e.target.dataset.filterKey;
            if(elements[`${keyToRemove}Input`]) {
                elements[`${keyToRemove}Input`].value = '';
            } else if (keyToRemove === 'doctor' && elements.doctorInput) {
                elements.doctorInput.value = '';
            }
            loadPrescriptions();
        }
    });

    [elements.startDateInput, elements.endDateInput, elements.doctorInput].forEach(input => {
        if (input) {
            input.addEventListener('input', loadPrescriptions);
        }
    });
    
    if (elements.prescriptionsListContainer) {
        elements.prescriptionsListContainer.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-action]');
            if (!button) return;

            const prescriptionId = button.dataset.id;
            const action = button.dataset.action;

            if (action === 'view-details') {
                showDetailsModal(prescriptionId);
            } else if (action === 'download-pdf') {
                const item = getLuminexPrescriptions().find(p => p.id === prescriptionId);
                const activeProfile = getActiveProfile();
                
                if (!item) return;

                Swal.fire({
                    title: getSafeTranslation('confirmTitle'),
                    text: getSafeTranslation('openReportInNewTab'),
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: getSafeTranslation('yesOpen'),
                    cancelButtonText: getSafeTranslation('cancel')
                }).then((result) => {
                    if (result.isConfirmed) {
                        Swal.fire({
                            title: getSafeTranslation('preparing'), 
                            text: getSafeTranslation('preparingDesc'),
                            timer: 1000,
                            timerProgressBar: true,
                            didOpen: () => {
                                Swal.showLoading();
                            }
                        }).then(() => {
                            const printWindow = window.open('prescription-report-template.html', '_blank');
                            
                            // Prepare Realistic Dummy Data
                            
                            // 1. Patient Details (Gender & Age)
                            let age = 'Bilinmiyor';
                            let gender = 'Kadın'; // Default dummy fallback
                            
                            if (activeProfile) {
                                const allUsers = getLuminexUsers();
                                const fullUser = allUsers.find(u => u.tc === activeProfile.tc);
                                
                                if (fullUser && fullUser.gender) {
                                    gender = fullUser.gender === 'male' ? 'Erkek' : 'Kadın';
                                }
                                
                                if (activeProfile.birthDate) {
                                    const birthYear = new Date(activeProfile.birthDate).getFullYear();
                                    age = new Date().getFullYear() - birthYear;
                                }
                            }

                            // 2. Random Protocols & Codes
                            const randomProtocol = '24' + Math.floor(1000000 + Math.random() * 9000000);
                            const randomMedula = '11' + Math.floor(1000000 + Math.random() * 9000000);
                            const randomDiploma = '12' + Math.floor(1000 + Math.random() * 9000);
                            
                            // 3. ICD-10 Codes Pool
                            const icdCodes = [
                                'J06.9 - Akut Üst Solunum Yolu Enfeksiyonu, Tanımlanmamış',
                                'I10 - Esansiyel (Primer) Hipertansiyon',
                                'E11 - Tip 2 Diabetes Mellitus',
                                'M54.5 - Bel Ağrısı',
                                'K21.9 - Gastro-özofajiyal Reflü Hastalığı'
                            ];
                            const randomDiagnosisCode = icdCodes[Math.floor(Math.random() * icdCodes.length)];

                            // 4. Insurance Types
                            const insuranceTypes = ['SGK - Çalışan', 'SGK - Emekli', 'Özel Sigorta', 'Yeşil Kart'];
                            const randomInsurance = insuranceTypes[Math.floor(Math.random() * insuranceTypes.length)];

                            const printData = {
                                id: item.id,
                                protocolNo: randomProtocol,
                                medulaNo: randomMedula,
                                date: new Date(item.date).toLocaleDateString('tr-TR'),
                                time: new Date(item.date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}),
                                
                                hospitalName: 'LUMINEX ÖZEL SAĞLIK KOMPLEKSİ',
                                hospitalDept: 'Dahiliye Polikliniği', // Can be mapped to doctor branch
                                doctorName: item.doctorName,
                                doctorDiplomaNo: randomDiploma,
                                doctorBranch: 'İç Hastalıkları (Dahiliye)', // Mock branch
                                
                                diagnosis: item.diagnosis,
                                diagnosisCode: randomDiagnosisCode,
                                
                                patientName: activeProfile ? activeProfile.name : 'Sayın Hasta',
                                patientTC: activeProfile ? activeProfile.tc : '***********',
                                patientGender: gender,
                                patientAge: age,
                                patientType: randomInsurance,
                                
                                medicines: item.medications.map(m => ({
                                    name: m.name,
                                    activeIngredient: 'Etken Madde: ' + m.name.substring(0, 4).toUpperCase() + 'ifen 500 mg',
                                    barcode: '869' + Math.floor(1000000000 + Math.random() * 9000000000),
                                    dosage: m.dosage,
                                    usage: m.instructions,
                                    boxCount: Math.floor(Math.random() * 2) + 1, // 1 or 2 boxes
                                    period: '10 Gün'
                                }))
                            };

                            // Save to LocalStorage to avoid race conditions
                            localStorage.setItem('luminex_print_data', JSON.stringify(printData));

                            // Open the window
                            window.open('prescription-report-template.html', '_blank');
                        });
                    }
                });
            }
        });
    }

    loadPrescriptions();
});

