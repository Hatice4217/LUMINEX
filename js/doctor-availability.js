import { setupHeader } from './utils/header-manager.js';
import { getLuminexAppointments, getLoggedInUser, getLuminexUsers, setLuminexAppointments, getLuminexBlockedSlots, setLuminexBlockedSlots } from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const elements = {
        tableHeaderRow: document.getElementById('tableHeaderRow'),
        tableBody: document.getElementById('tableBody'),
        prevWeekBtn: document.getElementById('prevWeekBtn'),
        nextWeekBtn: document.getElementById('nextWeekBtn'),
        currentWeekLabel: document.getElementById('currentWeekLabel')
    };

    let currentWeekStart = getStartOfWeek(new Date());
    const loggedInDoctor = getLoggedInUser();

    if (!loggedInDoctor || loggedInDoctor.role !== 'doctor') {
        window.location.href = 'login.html';
        return;
    }

    // --- Helpers ---
    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setDate(diff));
    }

    function formatDate(date) {
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
    }

    function formatDateISO(date) {
        // Returns YYYY-MM-DD using local time zone logic roughly
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset*60*1000));
        return localDate.toISOString().split('T')[0];
    }

    function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    function generateTimeSlots() {
        const slots = [];
        // Morning Session: 09:00 - 12:00
        for (let h = 9; h < 12; h++) {
            ['00', '15', '30', '45'].forEach(m => slots.push(`${h.toString().padStart(2, '0')}:${m}`));
        }
        // Afternoon Session: 13:00 - 17:00
        for (let h = 13; h < 17; h++) {
            ['00', '15', '30', '45'].forEach(m => slots.push(`${h.toString().padStart(2, '0')}:${m}`));
        }
        return slots;
    }

    // --- Render ---
    function renderTable() {
        elements.tableHeaderRow.innerHTML = '<th class="time-col" style="z-index: 20;">GÜN</th>'; // Top-left corner
        elements.tableBody.innerHTML = '';

        const appointments = getLuminexAppointments().filter(app => app.doctorId === loggedInDoctor.id);
        const blockedSlots = getLuminexBlockedSlots().filter(slot => slot.doctorId === loggedInDoctor.id);
        
        const timeSlots = generateTimeSlots();
        const weekDays = [];

        // Generate Headers (Time Slots)
        timeSlots.forEach(time => {
            const th = document.createElement('th');
            th.innerHTML = `<div>${time}</div>`;
            elements.tableHeaderRow.appendChild(th);
        });

        // Update Label to show Monday to Friday
        const weekEnd = addDays(currentWeekStart, 4);
        elements.currentWeekLabel.textContent = `${formatDate(currentWeekStart)} - ${formatDate(weekEnd)}`;

        // Generate Rows (Days - Monday to Friday)
        const now = new Date();

        for (let i = 0; i < 5; i++) { // Loop for 5 days
            const currentDay = addDays(currentWeekStart, i);
            const tr = document.createElement('tr');
            
            // Day Column
            const dayTd = document.createElement('td');
            dayTd.className = 'time-col';
            const dayName = currentDay.toLocaleDateString('tr-TR', { weekday: 'long' });
            dayTd.innerHTML = `
                <div style="font-size: 0.95rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">${dayName}</div>
                <div style="font-size: 0.8rem; font-weight: 400; opacity: 0.8;">${formatDate(currentDay)}</div>
            `;
            tr.appendChild(dayTd);
            weekDays.push(currentDay);

            // Time Slot Columns
            timeSlots.forEach(time => {
                const td = document.createElement('td');
                const isoDate = formatDateISO(currentDay);
                
                // Check status
                const appointment = appointments.find(app => app.date === isoDate && app.time === time);
                const blockedSlot = blockedSlots.find(slot => slot.date === isoDate && slot.time === time);
                
                // Create comparable Date objects for 'past' check
                const slotDateTime = new Date(`${isoDate}T${time}`);
                
                td.dataset.date = isoDate;
                td.dataset.time = time;
                td.dataset.formattedDate = formatDate(currentDay);

                if (appointment) {
                    const patientName = getPatientName(appointment.patientTc);
                    td.className = 'slot-occupied';
                    td.dataset.status = 'occupied';
                    td.dataset.patientName = patientName;
                    td.dataset.patientTc = appointment.patientTc;
                    td.dataset.healthInfo = appointment.healthInfo || 'Belirtilmemiş';
                    td.dataset.id = appointment.id;
                } else if (blockedSlot) {
                    td.className = 'slot-blocked-manual';
                    td.dataset.status = 'blocked-manual';
                    td.dataset.id = blockedSlot.id;
                    td.innerHTML = '<i class="fas fa-lock"></i>';
                } else if (slotDateTime < now) {
                    td.className = 'slot-blocked';
                    td.dataset.status = 'blocked-past';
                } else {
                    td.className = 'slot-available';
                    td.dataset.status = 'available';
                    td.innerHTML = '<i class="fas fa-check-circle"></i>';
                }

                tr.appendChild(td);
            });

            elements.tableBody.appendChild(tr);
        }
    }

    function getPatientName(tc) {
        const users = getLuminexUsers();
        const user = users.find(u => u.tc === tc);
        return user ? user.name : 'Bilinmeyen Hasta';
    }

    // --- Click Interaction ---
    elements.tableBody.addEventListener('click', (e) => {
        const td = e.target.closest('td');
        if (!td || td.classList.contains('time-col')) return;

        const status = td.dataset.status;
        const dateStr = td.dataset.formattedDate;
        const isoDate = td.dataset.date;
        const time = td.dataset.time;

        if (status === 'occupied') {
            const patientName = td.dataset.patientName;
            const healthInfo = td.dataset.healthInfo;
            const appointmentId = td.dataset.id;
            
            Swal.fire({
                title: `<div style="display:flex; flex-direction:column; align-items:center;">
                            <div style="width:60px; height:60px; background:#ffebee; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:10px;">
                                <i class="fas fa-user-injured" style="font-size:24px; color:#c62828;"></i>
                            </div>
                            <span>Randevu Detayı</span>
                        </div>`,
                html: `
                    <div style="text-align: center; margin-top: 10px;">
                        <h3 style="color: #c62828; margin-bottom: 5px;">${patientName}</h3>
                        <p style="color: #666; font-size: 0.9rem; margin-bottom: 20px;">
                            <i class="far fa-calendar-alt" style="margin-right:5px;"></i> ${dateStr} 
                            <span style="margin: 0 8px;">|</span> 
                            <i class="far fa-clock" style="margin-right:5px;"></i> ${time}
                        </p>
                        
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 10px; text-align: left; border-left: 4px solid #c62828;">
                            <strong style="display:block; color:#333; margin-bottom:5px; font-size:0.9rem;">Hasta Notu / Şikayet:</strong>
                            <span style="color:#555; font-size:0.95rem;">${healthInfo}</span>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Kapat',
                confirmButtonColor: '#6c757d',
                cancelButtonText: '<i class="fas fa-times"></i> Randevuyu İptal Et',
                cancelButtonColor: '#d33',
                showCloseButton: true,
            }).then((result) => {
                if (result.dismiss === Swal.DismissReason.cancel) {
                    Swal.fire({
                        title: 'Randevu İptali',
                        text: 'Bu randevuyu iptal etmek istediğinize emin misiniz?',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#d33',
                        confirmButtonText: 'Evet, İptal Et',
                        cancelButtonText: 'Vazgeç'
                    }).then((cancelRes) => {
                        if (cancelRes.isConfirmed) {
                            const currentApps = getLuminexAppointments();
                            const newApps = currentApps.filter(a => a.id !== appointmentId);
                            setLuminexAppointments(newApps);
                            renderTable(); // Re-render
                            Swal.fire('İptal Edildi', 'Randevu başarıyla iptal edildi.', 'success');
                        }
                    });
                }
            });

        } else if (status === 'available') {
            Swal.fire({
                title: 'Müsait Zaman Dilimi',
                html: `
                    <div style="text-align:center;">
                        <i class="fas fa-check-circle" style="font-size: 48px; color: #28a745; margin-bottom: 15px;"></i>
                        <p style="font-size: 1.1rem;"><strong>${dateStr} - ${time}</strong></p>
                        <p style="color: #666;">Bu zaman dilimini randevu alımına kapatmak (bloke etmek) ister misiniz?</p>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Evet, Kapat',
                confirmButtonColor: '#673ab7', 
                cancelButtonText: 'Vazgeç',
                cancelButtonColor: '#6c757d'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Save to storage
                    const currentBlocked = getLuminexBlockedSlots();
                    currentBlocked.push({
                        id: 'block-' + Date.now(),
                        doctorId: loggedInDoctor.id,
                        date: isoDate,
                        time: time
                    });
                    setLuminexBlockedSlots(currentBlocked);
                    
                    renderTable(); // Update UI
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Zaman Dilimi Kapatıldı',
                        text: 'Bu saat artık randevu alımına kapalı olarak görünecek.',
                        confirmButtonColor: '#673ab7'
                    });
                }
            });

        } else if (status === 'blocked-manual') {
            Swal.fire({
                title: 'Kapalı Zaman Dilimi',
                html: `
                    <div style="text-align:center;">
                        <i class="fas fa-lock" style="font-size: 48px; color: #673ab7; margin-bottom: 15px;"></i>
                        <p style="font-size: 1.1rem;"><strong>${dateStr} - ${time}</strong></p>
                        <p style="color: #666;">Bu zaman dilimi şu an kapalı. Tekrar randevu alımına açmak ister misiniz?</p>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Evet, Aç',
                confirmButtonColor: '#28a745',
                cancelButtonText: 'Vazgeç',
                cancelButtonColor: '#6c757d'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Remove from storage
                    const blockId = td.dataset.id;
                    const currentBlocked = getLuminexBlockedSlots();
                    const newBlocked = currentBlocked.filter(b => b.id !== blockId);
                    setLuminexBlockedSlots(newBlocked);
                    
                    renderTable(); // Update UI
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Zaman Dilimi Açıldı',
                        text: 'Artık bu saate randevu alınabilir.',
                        confirmButtonColor: '#28a745'
                    });
                }
            });

        } else if (status === 'blocked-past') {
             const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });

            Toast.fire({
                icon: 'info',
                title: 'Bu zaman dilimi geçmişte kalmış.'
            });
        }
    });

    // --- Event Listeners ---
    elements.prevWeekBtn.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, -7);
        renderTable();
    });

    elements.nextWeekBtn.addEventListener('click', () => {
        currentWeekStart = addDays(currentWeekStart, 7);
        renderTable();
    });

    renderTable();
});