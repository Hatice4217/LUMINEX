import { setupHeader } from './utils/header-manager.js';
import { 
    getLuminexAppointments, 
    getLuminexUsers, 
    getLoggedInUser, 
    setLuminexAppointments,
    getLuminexPrescriptions,
    setLuminexPrescriptions,
    getLuminexTestResults,
    setLuminexTestResults
} from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const elements = {
        appointmentsContainer: document.getElementById('doctor-appointments-list'),
        startDateInput: document.getElementById('filter-start-date'),
        endDateInput: document.getElementById('filter-end-date'),
        patientInput: document.getElementById('filter-patient'),
        statusInput: document.getElementById('filter-status'),
        activeFiltersContainer: document.getElementById('active-filters-container'),
        filterCardHeader: document.querySelector('.filter-card-header'),
        filterCardBody: document.getElementById('filter-card-body'),
        toggleFilterBtn: document.getElementById('toggle-filter-body'),
        applyFiltersBtn: document.getElementById('applyFilters'),
        clearFiltersBtn: document.getElementById('clearFilters')
    };

    // --- State ---
    let activeFilters = {
        startDate: '',
        endDate: '',
        patient: '',
        status: 'all' // Default to showing all, sorted by date
    };

    // --- Check Auth ---
    const loggedInDoctor = getLoggedInUser();
    if (!loggedInDoctor || loggedInDoctor.role !== 'doctor') {
        window.location.href = 'login.html';
        return;
    }

    function renderAppointments(appointments) {
        elements.appointmentsContainer.innerHTML = '';

        if (appointments.length === 0) {
            elements.appointmentsContainer.innerHTML = '<div class="card no-results-card"><i class="fas fa-search"></i><p>Bu kriterlere uygun randevu bulunmamaktadır.</p><span>Filtrelerinizi değiştirmeyi veya temizlemeyi deneyin.</span></div>';
            return;
        }

        const allUsers = getLuminexUsers();
        const now = new Date();

        if (activeFilters.status === 'upcoming') {
             appointments.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
        } else {
             appointments.sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));
        }

        appointments.forEach(appointment => {
            const patient = allUsers.find(u => u.tc === appointment.patientTc);
            const patientName = patient ? patient.name : 'Bilinmeyen Hasta';
            
            const appDateTime = new Date(appointment.date + 'T' + appointment.time);
            const isPast = appDateTime < now || appointment.status === 'Tamamlandı';

            const appointmentItem = document.createElement('div');
            appointmentItem.classList.add('appointment-item');
            if (isPast) {
                appointmentItem.classList.add('past');
            }
            appointmentItem.dataset.id = appointment.id;

            let actionsHtml = '';
            actionsHtml += `<button class="btn btn-sm btn-info" data-action="details">Detaylar</button>`;
            
            if (!isPast) {
                actionsHtml += `<button class="btn btn-sm btn-danger" data-action="cancel">İptal Et</button>`;
            } else {
                 if (appointment.status !== 'Tamamlandı') {
                     actionsHtml += `<button class="btn btn-sm btn-success" data-action="complete">Tamamlandı</button>`;
                 } else {
                     // Actions for completed appointments
                     actionsHtml += `
                        <button class="btn btn-sm btn-primary" data-action="prescribe"><i class="fas fa-file-prescription"></i> Reçete Yaz</button>
                        <button class="btn btn-sm btn-warning" data-action="add-test"><i class="fas fa-vial"></i> Sonuç Ekle</button>
                     `;
                 }
            }

            const displayDate = new Date(appointment.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

            const statusIcon = isPast ? '<i class="fas fa-check-circle" style="color: #2ecc71; margin-right: 8px;"></i>' : '';

            appointmentItem.innerHTML = `
                <div class="appointment-details">
                    <h3>${statusIcon}Hasta: ${patientName}</h3>
                    <p><strong>Tarih:</strong> ${displayDate}</p>
                    <p><strong>Saat:</strong> ${appointment.time}</p>
                    <p><strong>Branş:</strong> ${appointment.branch}</p>
                    ${appointment.healthInfo ? `<p class="health-info-display"><strong>Önemli Sağlık Bilgisi:</strong> ${appointment.healthInfo}</p>` : ''}
                    <p><span class="badge ${appointment.status === 'Tamamlandı' ? 'badge-success' : 'badge-warning'}">${appointment.status || (isPast ? 'Geçmiş' : 'Beklemede')}</span></p>
                </div>
                <div class="appointment-actions">
                    ${actionsHtml}
                </div>
            `;
            elements.appointmentsContainer.appendChild(appointmentItem);
        });
    }

    // --- Load and Filter Appointments ---
    function loadAppointments() {
        const allAppointments = getLuminexAppointments();
        let doctorAppointments = allAppointments.filter(app => app.doctorId === loggedInDoctor.id);

        // Filter
        if (activeFilters.startDate) doctorAppointments = doctorAppointments.filter(app => app.date >= activeFilters.startDate);
        if (activeFilters.endDate) doctorAppointments = doctorAppointments.filter(app => app.date <= activeFilters.endDate);
        
        if (activeFilters.patient) {
            const allUsers = getLuminexUsers();
            doctorAppointments = doctorAppointments.filter(app => {
                const patient = allUsers.find(u => u.tc === app.patientTc);
                const pName = patient ? patient.name.toLowerCase() : '';
                return pName.includes(activeFilters.patient.toLowerCase());
            });
        }

        if (activeFilters.status !== 'all') {
            const now = new Date();
            doctorAppointments = doctorAppointments.filter(app => {
                const isPast = new Date(`${app.date}T${app.time}`) < now || app.status === 'Tamamlandı';
                if (activeFilters.status === 'past') {
                    return isPast;
                } else { // 'upcoming'
                    return !isPast;
                }
            });
        }

        renderAppointments(doctorAppointments);
        updateActiveFilterPills(activeFilters);
    }

    // --- Active Filter Pills ---
    function updateActiveFilterPills(filters) {
        elements.activeFiltersContainer.innerHTML = '';
        let hasFilters = false;

        if (filters.startDate) {
            hasFilters = true;
            createPill(`Başlangıç: ${filters.startDate}`, 'startDate');
        }
        if (filters.endDate) {
            hasFilters = true;
            createPill(`Bitiş: ${filters.endDate}`, 'endDate');
        }
        if (filters.patient) {
            hasFilters = true;
            createPill(`Hasta: "${filters.patient}"`, 'patient');
        }
        if (filters.status && filters.status !== 'all') {
            hasFilters = true;
            const statusOption = Array.from(elements.statusInput.options).find(opt => opt.value === filters.status);
            const statusText = statusOption ? statusOption.text : filters.status;
            createPill(`Durum: ${statusText}`, 'status');
        }
        
        elements.activeFiltersContainer.style.display = hasFilters ? 'flex' : 'none';
    }

    function createPill(text, key) {
        const pill = document.createElement('div');
        pill.className = 'filter-pill';
        pill.innerHTML = `<span>${text}</span><span class="remove-pill" data-filter-key="${key}">&times;</span>`;
        elements.activeFiltersContainer.appendChild(pill);
    }

    // --- Event Listeners ---
    if (elements.filterCardHeader) {
        elements.filterCardHeader.addEventListener('click', () => {
            const isCollapsed = elements.filterCardBody.classList.toggle('collapsed');
            const icon = elements.toggleFilterBtn.querySelector('i');
            icon.className = `fas ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}`;
        });
    }

    if (elements.applyFiltersBtn) {
        elements.applyFiltersBtn.addEventListener('click', () => {
            activeFilters = {
                startDate: elements.startDateInput.value,
                endDate: elements.endDateInput.value,
                patient: elements.patientInput.value,
                status: elements.statusInput.value,
            };
            loadAppointments();
        });
    }
    
    if (elements.clearFiltersBtn) {
        elements.clearFiltersBtn.addEventListener('click', () => {
            elements.startDateInput.value = '';
            elements.endDateInput.value = '';
            elements.patientInput.value = '';
            elements.statusInput.value = 'all';
            
            activeFilters = {
                startDate: '',
                endDate: '',
                patient: '',
                status: 'all'
            };
            
            loadAppointments();
        });
    }

    elements.activeFiltersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-pill')) {
            const keyToRemove = e.target.dataset.filterKey;
            if (elements[`${keyToRemove}Input`]) {
                elements[`${keyToRemove}Input`].value = (keyToRemove === 'status') ? 'all' : '';
            }
            activeFilters[keyToRemove] = (keyToRemove === 'status') ? 'all' : '';
            loadAppointments();
        }
    });

    // --- Action Handling ---
    elements.appointmentsContainer.addEventListener('click', function(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const appointmentItem = button.closest('.appointment-item');
        const appointmentId = appointmentItem.dataset.id;
        
        let allAppointments = getLuminexAppointments();
        const selectedAppointment = allAppointments.find(app => app.id === appointmentId);

        if (!selectedAppointment) return;

        if (action === 'details') {
            const allUsers = getLuminexUsers();
            const patient = allUsers.find(u => u.tc === selectedAppointment.patientTc);
            const patientName = patient ? patient.name : 'Bilinmeyen Hasta';
            const patientInitials = patientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            
            const maskTc = (tc) => {
                if (typeof tc !== 'string' || tc.length < 11) {
                    return 'Geçersiz TC';
                }
                return `${tc.substring(0, 3)}******${tc.substring(9)}`;
            };

            const displayDate = new Date(selectedAppointment.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });

            Swal.fire({
                customClass: {
                    popup: 'swal-premium-details',
                },
                title: '', // Başlığı HTML içine alıyoruz
                html: `
                    <div class="swal-patient-header">
                        <div class="swal-patient-avatar">${patientInitials}</div>
                        <div class="swal-patient-info">
                            <h3>${patientName}</h3>
                            <span>Hasta Kayıt Detayları</span>
                        </div>
                    </div>
                    <div class="swal-details-grid">
                        <div class="swal-detail-item">
                            <span class="swal-detail-label">TC Kimlik</span>
                            <span class="swal-detail-value">${maskTc(selectedAppointment.patientTc)}</span>
                        </div>
                        <div class="swal-detail-item">
                            <span class="swal-detail-label">Tarih</span>
                            <span class="swal-detail-value">${displayDate}</span>
                        </div>
                        <div class="swal-detail-item">
                            <span class="swal-detail-label">Saat</span>
                            <span class="swal-detail-value">${selectedAppointment.time}</span>
                        </div>
                        <div class="swal-detail-item">
                            <span class="swal-detail-label">Branş</span>
                            <span class="swal-detail-value">${selectedAppointment.branch}</span>
                        </div>
                        
                        ${selectedAppointment.healthInfo ? `
                        <div class="swal-detail-full">
                            <strong><i class="fas fa-notes-medical"></i> Önemli Sağlık Bilgisi</strong>
                            <p>${selectedAppointment.healthInfo}</p>
                        </div>
                        ` : ''}

                        ${selectedAppointment.aiSummary ? `
                        <div class="swal-detail-full ai-highlight">
                            <strong><i class="fas fa-robot"></i> Yapay Zeka Ön Değerlendirmesi</strong>
                            <p><strong>Bulgu:</strong> ${selectedAppointment.aiSummary.title}</p>
                            <p><strong>AI Analizi:</strong> ${selectedAppointment.aiSummary.desc}</p>
                        </div>
                        ` : ''}
                    </div>
                `,
                confirmButtonText: 'Kapat',
                showCloseButton: true,
                buttonsStyling: false,
                customClass: {
                    confirmButton: 'btn btn-primary',
                    popup: 'swal-premium-details'
                }
            });
        } else if (action === 'cancel') {
            Swal.fire({
                title: 'Emin misiniz?',
                text: "Bu randevuyu iptal etmek istediğinizden emin misiniz?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Evet, iptal et!',
                cancelButtonText: 'Hayır'
            }).then((result) => {
                if (result.isConfirmed) {
                    allAppointments = allAppointments.filter(app => app.id !== appointmentId);
                    setLuminexAppointments(allAppointments);
                    loadAppointments();
                    Swal.fire('İptal Edildi!', 'Randevu başarıyla iptal edildi.', 'success');
                }
            });
        } else if (action === 'complete') {
            Swal.fire({
                title: 'Randevu Tamamla',
                text: "Bu randevuyu tamamlandı olarak işaretlemek istiyor musunuz?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Evet, tamamla',
                cancelButtonText: 'İptal'
            }).then((result) => {
                if (result.isConfirmed) {
                     selectedAppointment.status = 'Tamamlandı';
                     const appIndex = allAppointments.findIndex(app => app.id === appointmentId);
                     if(appIndex !== -1) {
                         allAppointments[appIndex] = selectedAppointment;
                         setLuminexAppointments(allAppointments);
                         loadAppointments();
                         Swal.fire({
                             title: 'Başarılı!',
                             text: 'Randevu tamamlandı. Şimdi reçete yazmak veya tahlil sonucu eklemek ister misiniz?',
                             icon: 'success',
                             showCancelButton: true,
                             confirmButtonText: 'Reçete Yaz',
                             cancelButtonText: 'Kapat',
                             showDenyButton: true,
                             denyButtonText: 'Tahlil Ekle'
                         }).then((res) => {
                             if (res.isConfirmed) {
                                 handlePrescribe(selectedAppointment);
                             } else if (res.isDenied) {
                                 handleAddTest(selectedAppointment);
                             }
                         });
                     }
                }
            });
        } else if (action === 'prescribe') {
            handlePrescribe(selectedAppointment);
        } else if (action === 'add-test') {
            handleAddTest(selectedAppointment);
        }
    });

    function handlePrescribe(appointment) {
        const allUsers = getLuminexUsers();
        const patient = allUsers.find(u => u.tc === appointment.patientTc);
        const patientName = patient ? patient.name : 'Bilinmeyen Hasta';

        Swal.fire({
            title: 'Reçete Yaz',
            html: `
                <div class="swal-form">
                    <div class="form-group">
                        <label>Tanı</label>
                        <input id="swal-diagnosis" class="swal2-input" placeholder="Tanı giriniz...">
                    </div>
                    <div id="medicine-list">
                        <div class="medicine-item" style="display: flex; gap: 5px; margin-bottom: 5px;">
                            <input class="swal2-input medicine-name" placeholder="İlaç Adı" style="margin:0; flex:2;">
                            <input class="swal2-input medicine-dosage" placeholder="Doz" style="margin:0; flex:1;">
                        </div>
                    </div>
                    <button type="button" id="add-medicine" class="btn btn-sm btn-outline-primary" style="margin-top:10px;">+ İlaç Ekle</button>
                    <div class="form-group" style="margin-top:15px;">
                        <label>Notlar</label>
                        <textarea id="swal-notes" class="swal2-textarea" placeholder="Ek notlar..."></textarea>
                    </div>
                </div>
            `,
            didOpen: () => {
                document.getElementById('add-medicine').addEventListener('click', () => {
                    const list = document.getElementById('medicine-list');
                    const div = document.createElement('div');
                    div.className = 'medicine-item';
                    div.style.cssText = 'display: flex; gap: 5px; margin-bottom: 5px;';
                    div.innerHTML = `
                        <input class="swal2-input medicine-name" placeholder="İlaç Adı" style="margin:0; flex:2;">
                        <input class="swal2-input medicine-dosage" placeholder="Doz" style="margin:0; flex:1;">
                    `;
                    list.appendChild(div);
                });
            },
            focusConfirm: false,
            preConfirm: () => {
                const diagnosis = document.getElementById('swal-diagnosis').value;
                const notes = document.getElementById('swal-notes').value;
                const medicineElements = document.querySelectorAll('.medicine-item');
                const medications = [];
                
                medicineElements.forEach(el => {
                    const name = el.querySelector('.medicine-name').value;
                    const dosage = el.querySelector('.medicine-dosage').value;
                    if (name) {
                        medications.push({ name, dosage, instructions: 'Doktor talimatına göre kullanınız.' });
                    }
                });

                if (!diagnosis) {
                    Swal.showValidationMessage('Lütfen en az bir tanı giriniz.');
                    return false;
                }
                if (medications.length === 0) {
                    Swal.showValidationMessage('Lütfen en az bir ilaç ekleyiniz.');
                    return false;
                }

                return { diagnosis, notes, medications };
            },
            showCancelButton: true,
            confirmButtonText: 'Kaydet ve Gönder',
            cancelButtonText: 'İptal'
        }).then((result) => {
            if (result.isConfirmed) {
                const prescriptions = getLuminexPrescriptions();
                const newPrescription = {
                    id: 'pres_' + Date.now(),
                    patientTc: appointment.patientTc,
                    doctorName: loggedInDoctor.name,
                    date: new Date().toISOString().split('T')[0],
                    diagnosis: result.value.diagnosis,
                    notes: result.value.notes,
                    medications: result.value.medications,
                    status: 'Onaylandı'
                };
                prescriptions.push(newPrescription);
                setLuminexPrescriptions(prescriptions);
                Swal.fire('Başarılı!', 'Reçete başarıyla oluşturuldu ve hastaya iletildi.', 'success');
            }
        });
    }

    function handleAddTest(appointment) {
        Swal.fire({
            title: 'Tahlil Sonucu Ekle',
            html: `
                <div class="swal-form">
                    <div class="form-group">
                        <label>Tahlil Adı</label>
                        <input id="swal-test-name" class="swal2-input" placeholder="Örn: Tam Kan Sayımı">
                    </div>
                    <div id="parameter-list">
                        <div class="parameter-item" style="display: flex; gap: 5px; margin-bottom: 5px;">
                            <input class="swal2-input param-name" placeholder="Parametre (Örn: WBC)" style="margin:0; flex:2;">
                            <input class="swal2-input param-value" placeholder="Değer" style="margin:0; flex:1;">
                            <input class="swal2-input param-unit" placeholder="Birim" style="margin:0; flex:1;">
                        </div>
                    </div>
                    <button type="button" id="add-parameter" class="btn btn-sm btn-outline-primary" style="margin-top:10px;">+ Parametre Ekle</button>
                </div>
            `,
            didOpen: () => {
                document.getElementById('add-parameter').addEventListener('click', () => {
                    const list = document.getElementById('parameter-list');
                    const div = document.createElement('div');
                    div.className = 'parameter-item';
                    div.style.cssText = 'display: flex; gap: 5px; margin-bottom: 5px;';
                    div.innerHTML = `
                        <input class="swal2-input param-name" placeholder="Parametre" style="margin:0; flex:2;">
                        <input class="swal2-input param-value" placeholder="Değer" style="margin:0; flex:1;">
                        <input class="swal2-input param-unit" placeholder="Birim" style="margin:0; flex:1;">
                    `;
                    list.appendChild(div);
                });
            },
            preConfirm: () => {
                const testName = document.getElementById('swal-test-name').value;
                const paramElements = document.querySelectorAll('.parameter-item');
                const results = [];
                
                paramElements.forEach(el => {
                    const parameter = el.querySelector('.param-name').value;
                    const value = el.querySelector('.param-value').value;
                    const unit = el.querySelector('.param-unit').value;
                    if (parameter && value) {
                        results.push({ parameter, value, unit, reference: '-' });
                    }
                });

                if (!testName) {
                    Swal.showValidationMessage('Lütfen tahlil adı giriniz.');
                    return false;
                }
                if (results.length === 0) {
                    Swal.showValidationMessage('Lütfen en az bir parametre ekleyiniz.');
                    return false;
                }

                return { testName, results };
            },
            showCancelButton: true,
            confirmButtonText: 'Sonuçları Kaydet'
        }).then((result) => {
            if (result.isConfirmed) {
                const testResults = getLuminexTestResults();
                const newResult = {
                    id: 'test_res_' + Date.now(),
                    patientTc: appointment.patientTc,
                    testName: result.value.testName,
                    resultDate: new Date().toISOString().split('T')[0],
                    doctorName: loggedInDoctor.name,
                    status: 'Sonuç Çıktı',
                    results: result.value.results
                };
                testResults.push(newResult);
                setLuminexTestResults(testResults);
                Swal.fire('Başarılı!', 'Tahlil sonuçları sisteme kaydedildi.', 'success');
            }
        });
    }

    // --- Initial Load ---
    loadAppointments();
});

