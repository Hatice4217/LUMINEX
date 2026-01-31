import { setupHeader } from './utils/header-manager.js';
import { 
    getLoggedInUser, 
    getLuminexAppointments, 
    getLuminexUsers, 
    setLuminexAppointments,
    getLuminexPrescriptions,
    setLuminexPrescriptions,
    getLuminexTestResults,
    setLuminexTestResults
} from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const elements = {
        todayAppointmentsContainer: document.getElementById('todayAppointments'),
        upcomingAppointmentsContainer: document.getElementById('upcomingDoctorAppointments'),
        dashboardDate: document.getElementById('dashboardDate'),
        statToday: document.getElementById('statTodayCount'),
        statUpcoming: document.getElementById('statUpcomingCount'),
        statCompleted: document.getElementById('statCompletedCount'),
        statReviews: document.getElementById('statReviewsCount'),
    };
    
    const loggedInDoctor = getLoggedInUser();

    if (!loggedInDoctor || loggedInDoctor.role !== 'doctor') {
        window.location.href = 'login.html';
        return;
    }

    // Helper for counting animation
    function animateValue(obj, start, end, duration) {
        if (!obj) return;
        let startTimestamp = null;
        const endVal = parseInt(end, 10) || 0; // Ensure end is a number
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.textContent = Math.floor(progress * (endVal - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function loadDashboardData() {
        // 1. Show Skeletons Immediately (Lists & Stats)
        
        // List Skeletons
        const skeletonHtml = `
            <div class="appointment-item skeleton-card" style="display:flex; gap:15px; align-items:center; padding: 15px;">
                <div class="skeleton" style="width:50px; height:50px; border-radius:50%; background-color:#e0e0e0;"></div>
                <div style="flex:1;">
                    <div class="skeleton" style="width:50%; height:15px; margin-bottom:8px; background-color:#e0e0e0;"></div>
                    <div class="skeleton" style="width:30%; height:10px; background-color:#e0e0e0;"></div>
                </div>
            </div>
            <div class="appointment-item skeleton-card" style="display:flex; gap:15px; align-items:center; padding: 15px;">
                <div class="skeleton" style="width:50px; height:50px; border-radius:50%; background-color:#e0e0e0;"></div>
                <div style="flex:1;">
                    <div class="skeleton" style="width:60%; height:15px; margin-bottom:8px; background-color:#e0e0e0;"></div>
                    <div class="skeleton" style="width:40%; height:10px; background-color:#e0e0e0;"></div>
                </div>
            </div>
        `;
        elements.todayAppointmentsContainer.innerHTML = skeletonHtml;
        elements.upcomingAppointmentsContainer.innerHTML = skeletonHtml;

        // Stats Skeletons - Set explicit style for visibility
        const statElements = [elements.statToday, elements.statUpcoming, elements.statCompleted, elements.statReviews];
        statElements.forEach(el => {
            if(el) el.innerHTML = '<span class="skeleton" style="width:40px; height:25px; display:inline-block; background-color:#e0e0e0; border-radius:4px;"></span>';
        });

        // 2. Simulate Delay (800ms)
        setTimeout(() => {
            // Set Date
            const today = new Date();
            elements.dashboardDate.textContent = today.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            const allAppointments = getLuminexAppointments();
            const allUsers = getLuminexUsers();
            const doctorAppointments = allAppointments.filter(app => app.doctorId === loggedInDoctor.id);

            const now = new Date();
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);
            
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            const todayAppointments = doctorAppointments.filter(app => {
                const appDate = new Date(app.date);
                const isActive = app.status === 'Onaylandı' || app.status === 'Beklemede';
                return appDate >= todayStart && appDate <= todayEnd && isActive;
            }).sort((a,b) => a.time.localeCompare(b.time));

            const upcomingAppointments = doctorAppointments.filter(app => {
                const appDate = new Date(app.date);
                const isActive = app.status === 'Onaylandı' || app.status === 'Beklemede';
                return appDate > todayEnd && isActive;
            });
            
            const completedThisMonth = doctorAppointments.filter(app => {
                const appDate = new Date(app.date);
                return appDate < todayStart && appDate >= thisMonthStart;
            });

            // Update Stat Cards with Animation
            animateValue(elements.statToday, 0, todayAppointments.length, 1000);
            animateValue(elements.statUpcoming, 0, upcomingAppointments.length, 1200);
            animateValue(elements.statCompleted, 0, completedThisMonth.length, 800);
            animateValue(elements.statReviews, 0, 12, 1000); // Dummy data

            // Render sections (This replaces the skeletons)
            renderAppointments(todayAppointments, elements.todayAppointmentsContainer);
            renderUpcomingAppointments(upcomingAppointments.slice(0, 5), allUsers); // Show only top 5 upcoming

            // --- Chart Initialization ---
            const chartCanvas = document.getElementById('doctorWeeklyChart');
            if (chartCanvas) {
                const ctx = chartCanvas.getContext('2d');
                
                // Calculate last 7 days data
                const last7Days = [];
                const dataPoints = [];
                // Start 2 days before today, end 4 days after today (total 7 days)
                for (let i = -2; i <= 4; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() + i); 
                    d.setHours(0,0,0,0);
                    const dayLabel = d.toLocaleDateString('tr-TR', { weekday: 'short', day: '2-digit', month: 'short' });
                    last7Days.push(dayLabel);
                    
                    // Count appointments for this day
                    const count = doctorAppointments.filter(app => {
                        const appDateString = new Date(app.date).toLocaleDateString('en-CA'); // YYYY-MM-DD
                        const loopDateString = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
                        return appDateString === loopDateString;
                    }).length;
                    dataPoints.push(count);
                }

                // Check theme for chart colors
                const isDarkMode = document.body.classList.contains('theme-dark');
                const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                const textColor = isDarkMode ? '#cbd5e1' : '#666';

                // Destroy existing chart if any
                if (window.doctorChartInstance) {
                    window.doctorChartInstance.destroy();
                }

                window.doctorChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: last7Days,
                        datasets: [{
                            label: 'Randevu Sayısı',
                            data: dataPoints,
                            borderColor: '#3667A8', // Primary Color
                            backgroundColor: 'rgba(54, 103, 168, 0.1)',
                            borderWidth: 3,
                            pointBackgroundColor: '#fff',
                            pointBorderColor: '#3667A8',
                            pointRadius: 5,
                            pointHoverRadius: 7,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                                titleColor: isDarkMode ? '#fff' : '#333',
                                bodyColor: isDarkMode ? '#cbd5e1' : '#666',
                                borderColor: 'rgba(0,0,0,0.1)',
                                borderWidth: 1,
                                padding: 10,
                                displayColors: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: gridColor,
                                    drawBorder: false
                                },
                                ticks: {
                                    color: textColor,
                                    stepSize: 1
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                },
                                ticks: {
                                    color: textColor
                                }
                            }
                        }
                    }
                });
            }
        }, 800); // End Timeout
    }

    function getInitials(name) {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return parts[0][0] + parts[parts.length - 1][0];
        }
        return name.substring(0, 2);
    }

    function renderAppointments(appointments, container) {
        container.innerHTML = ''; 
        if (appointments.length === 0) {
            container.innerHTML = `<div class="no-results-card">
                                     <i class="fas fa-calendar-check"></i>
                                     <p>Bugün için randevunuz bulunmuyor.</p>
                                     <span>Gününüz sakin geçecek gibi görünüyor.</span>
                                   </div>`;
            return;
        }

        const allUsers = getLuminexUsers();

        appointments.forEach(appointment => {
            const patientUser = allUsers.find(user => user.tc === appointment.patientTc);
            const patientName = patientUser ? patientUser.name : 'Bilinmeyen Hasta';
            const avatarInitials = getInitials(patientName);

            const appointmentItem = document.createElement('div');
            appointmentItem.classList.add('appointment-item');
            appointmentItem.dataset.id = appointment.id;

            // Tooltip (simple title for now)
            appointmentItem.title = `${appointment.time} - ${patientName}\nBranş: ${appointment.branch}\nNot: ${appointment.healthInfo || 'Yok'}`;

            const maskedTc = appointment.patientTc ? `${appointment.patientTc.substring(0, 3)}*****${appointment.patientTc.substring(8)}` : 'Yok';

            appointmentItem.innerHTML = `
                <div class="patient-avatar">${avatarInitials}</div>
                <div class="appointment-details">
                    <h3>${patientName}</h3>
                    <p>Saat: ${appointment.time}</p>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-sm btn-info" data-action="details">Detaylar</button>
                    <button class="btn btn-sm btn-success" data-action="complete">Tamamlandı</button>
                </div>
            `;
            container.appendChild(appointmentItem);
        });
    }

    function renderUpcomingAppointments(appointments, allUsers) {
        const container = elements.upcomingAppointmentsContainer;
        container.innerHTML = '';
        if (appointments.length === 0) {
            container.innerHTML = `<div class="no-results-card" style="padding: 20px;">
                                     <p>Yaklaşan randevu yok.</p>
                                   </div>`;
            return;
        }

        appointments.forEach(appointment => {
            const patient = allUsers.find(u => u.tc === appointment.patientTc);
            const patientName = patient ? patient.name : 'Bilinmeyen Hasta';
            const avatarInitials = getInitials(patientName);
            const displayDate = new Date(appointment.date).toLocaleDateString('tr-TR', { month: 'long', day: 'numeric' });

            const appointmentItem = document.createElement('div');
            appointmentItem.className = 'appointment-item';
            appointmentItem.dataset.id = appointment.id;
            appointmentItem.title = `${displayDate} - ${appointment.time} - ${patientName}\nBranş: ${appointment.branch}`; // Tooltip
            
            // Made the action icon a functional button for details
            appointmentItem.innerHTML = `
                 <div class="patient-avatar">${avatarInitials}</div>
                 <div class="appointment-details">
                    <h3>${patientName}</h3>
                    <p>${displayDate}<br>${appointment.time}</p>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-sm btn-icon-only" data-action="details" style="background:none; border:none; color:var(--primary-color);"><i class="fas fa-chevron-right"></i></button>
                </div>
            `;
            container.appendChild(appointmentItem);
        });
    }

    function handleAppointmentAction(event) {
        const targetButton = event.target.closest('button[data-action]');
        if (!targetButton) return;

        const action = targetButton.dataset.action;
        const appointmentItem = targetButton.closest('.appointment-item');
        if (!appointmentItem) return;
        
        const appointmentId = appointmentItem.dataset.id;
        if (!appointmentId) return;

        const allAppointments = getLuminexAppointments();
        const selectedAppointment = allAppointments.find(app => app.id === appointmentId);

        if (!selectedAppointment) return;

        if (action === 'details') {
            const allUsers = getLuminexUsers();
            const patient = allUsers.find(u => u.tc === selectedAppointment.patientTc);
            const patientName = patient ? patient.name : 'Bilinmeyen Hasta';
            const maskedTc = selectedAppointment.patientTc ? `${selectedAppointment.patientTc.substring(0, 3)}*****${selectedAppointment.patientTc.substring(8)}` : 'Yok';
            
            const detailsHtml = `
                <div class="modern-appointment-details">
                    <div class="modern-results-header">
                        <i class="fas fa-user-circle" style="font-size: 1.5rem; margin-right: 15px;"></i>
                        <div class="header-text">
                            <h2>${patientName}</h2>
                            <p>Randevu Detayları</p>
                        </div>
                    </div>
                    <div class="modern-results-body">
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label"><i class="fas fa-calendar-day"></i> Tarih</span>
                                <span class="detail-value">${new Date(selectedAppointment.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label"><i class="fas fa-clock"></i> Saat</span>
                                <span class="detail-value">${selectedAppointment.time}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label"><i class="fas fa-stethoscope"></i> Branş</span>
                                <span class="detail-value">${selectedAppointment.branch}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label"><i class="fas fa-id-card"></i> T.C. Kimlik No</span>
                                <span class="detail-value">${maskedTc}</span>
                            </div>
                        </div>
                        ${selectedAppointment.healthInfo ? `
                            <div class="detail-note">
                                <h4><i class="fas fa-notes-medical"></i> Hasta Notu</h4>
                                <p>${selectedAppointment.healthInfo}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;

            Swal.fire({
                html: detailsHtml,
                showCloseButton: true,
                showConfirmButton: false,
                width: '600px',
                customClass: {
                    popup: 'modern-swal-popup',
                    htmlContainer: 'modern-swal-container'
                }
            });
        } else if (action === 'complete') {
            Swal.fire({
                title: 'Emin misiniz?',
                text: "Bu randevuyu tamamlandı olarak işaretlemek istediğinizden emin misiniz?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#28a745',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Evet, tamamla!',
                cancelButtonText: 'Hayır'
            }).then((result) => {
                if (result.isConfirmed) {
                    const appointmentIndex = allAppointments.findIndex(app => app.id === appointmentId);
                    if (appointmentIndex > -1) {
                        allAppointments[appointmentIndex].status = 'Tamamlandı';
                        setLuminexAppointments(allAppointments);
                        loadDashboardData(); // Re-render dashboard
                        
                        Swal.fire({
                             title: 'Tamamlandı!',
                             text: 'Randevu başarıyla tamamlandı olarak işaretlendi. Şimdi reçete yazmak veya tahlil sonucu eklemek ister misiniz?',
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
        }
    }

    function handlePrescribe(appointment) {
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

    // Use a single, delegated event listener on a parent that exists at DOMContentLoaded
    document.querySelector('.doctor-dashboard-grid').addEventListener('click', handleAppointmentAction);

    // Initial Load
    loadDashboardData();
});