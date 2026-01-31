import { setupHeader } from './utils/header-manager.js';
import { getActiveProfile, getLocalStorageItem, setLocalStorageItem } from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();
    const doctorMessagesList = document.getElementById('doctorMessagesList');
    const activeProfile = getActiveProfile();

    if (!activeProfile) {
        window.location.href = 'login.html';
        return;
    }

    function getDoctorName(doctorId) {
        const users = getLocalStorageItem('luminexUsers') || [];
        const doctor = users.find(user => user.id === doctorId);
        return doctor ? doctor.name : 'Bilinmeyen Doktor';
    }

    function renderMessages() {
        const allMessages = getLocalStorageItem('doctorMessages') || [];
        const messages = allMessages.filter(msg => msg.patientTc === activeProfile.tc);

        if (messages.length === 0) {
            doctorMessagesList.innerHTML = '<p>Hiç doktor mesajınız bulunmamaktadır.</p>';
            return;
        }

        doctorMessagesList.innerHTML = messages.map(msg => `
            <div class="doctor-message-item ${msg.read ? '' : 'unread'}">
                <div class="message-sender">
                    <h3>${getDoctorName(msg.doctorId)}</h3>
                    <p>${msg.subject}</p>
                </div>
                <div class="message-date">
                    <p>${new Date(msg.date).toLocaleDateString('tr-TR')}</p>
                </div>
                <div class="message-actions">
                    <button class="btn btn-sm btn-info" data-id="${msg.id}">Oku</button>
                </div>
            </div>
        `).join('');
    }

    function showMessageDetails(id) {
        let allMessages = getLocalStorageItem('doctorMessages') || [];
        const message = allMessages.find(msg => msg.id === id);

        if (message) {
            // Mark as read
            if (!message.read) {
                message.read = true;
                setLocalStorageItem('doctorMessages', allMessages);
                renderMessages(); // Re-render to update the read status
            }

            Swal.fire({
                title: `Dr. ${getDoctorName(message.doctorId)}`,
                subheader: message.subject,
                html: `
                    <div style="text-align: left;">
                        <p><strong>Tarih:</strong> ${new Date(message.date).toLocaleString('tr-TR')}</p>
                        <hr>
                        <p>${message.message}</p>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'Kapat'
            });
        }
    }

    doctorMessagesList.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-info')) {
            const messageId = e.target.dataset.id;
            showMessageDetails(messageId);
        }
    });

    renderMessages();
});
