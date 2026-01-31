import { setupHeader } from './utils/header-manager.js';
import { getLoggedInUser, getLuminexAppointments, getLuminexUsers, getLocalStorageItem, setLocalStorageItem } from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const patientSelect = document.getElementById('patientSelect');
    const sendMessageForm = document.getElementById('sendMessageForm');
    const loggedInDoctor = getLoggedInUser();

    if (!loggedInDoctor || loggedInDoctor.role !== 'doctor') {
        window.location.href = 'login.html';
        return;
    }

    function maskTc(tc) {
        if (!tc || tc.length !== 11) {
            return '';
        }
        return `${tc.substring(0, 3)}*****${tc.substring(8)}`;
    }

    function populatePatientDropdown() {
        const appointments = getLuminexAppointments();
        const doctorAppointments = appointments.filter(app => app.doctorId === loggedInDoctor.id);
        const patientTcs = [...new Set(doctorAppointments.map(app => app.patientTc))];
        
        const users = getLuminexUsers();
        const patients = users.filter(user => patientTcs.includes(user.tc));

        patientSelect.innerHTML = '<option value="">Hasta Seçiniz...</option>';
        patients.forEach(patient => {
            const option = document.createElement('option');
            option.value = patient.tc;
            option.textContent = `${patient.name} (T.C.: ${maskTc(patient.tc)})`;
            patientSelect.appendChild(option);
        });
    }

    sendMessageForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const patientTc = patientSelect.value;
        const subject = document.getElementById('messageSubject').value;
        const message = document.getElementById('messageContent').value;

        if (!patientTc || !subject || !message) {
            Swal.fire({
                icon: 'error',
                title: 'Eksik Bilgi',
                text: 'Lütfen tüm alanları doldurun.',
            });
            return;
        }

        const doctorMessages = getLocalStorageItem('doctorMessages') || [];
        const newMessage = {
            id: `msg-${Date.now()}`,
            doctorId: loggedInDoctor.id,
            patientTc: patientTc,
            subject: subject,
            message: message,
            date: new Date().toISOString(),
            read: false
        };

        doctorMessages.push(newMessage);
        setLocalStorageItem('doctorMessages', doctorMessages);

        Swal.fire({
            icon: 'success',
            title: 'Mesaj Gönderildi!',
            text: 'Mesajınız hastaya başarıyla gönderildi.',
        }).then(() => {
            sendMessageForm.reset();
        });
    });

    populatePatientDropdown();
});
