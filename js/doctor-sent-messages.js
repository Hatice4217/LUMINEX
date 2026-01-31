import { setupHeader } from './utils/header-manager.js';
import { getLoggedInUser, getLocalStorageItem, setLocalStorageItem } from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const sentMessagesList = document.getElementById('sentMessagesList');
    const loggedInDoctor = getLoggedInUser();

    if (!loggedInDoctor || loggedInDoctor.role !== 'doctor') {
        window.location.href = 'login.html';
        return;
    }

    function getPatientName(patientTc) {
        const users = getLocalStorageItem('luminexUsers') || [];
        const patient = users.find(user => user.tc === patientTc);
        return patient ? patient.name : 'Bilinmeyen Hasta';
    }

    function renderSentMessages() {
        const allMessages = getLocalStorageItem('doctorMessages') || [];
        const doctorSentMessages = allMessages.filter(msg => msg.doctorId === loggedInDoctor.id);

        if (doctorSentMessages.length === 0) {
            sentMessagesList.innerHTML = '<p>Hiç gönderilmiş mesajınız bulunmamaktadır.</p>';
            return;
        }

        sentMessagesList.innerHTML = doctorSentMessages.map(msg => `
            <div class="doctor-message-item">
                <div class="message-sender">
                    <h3>Kime: ${getPatientName(msg.patientTc)}</h3>
                    <p>${msg.subject}</p>
                </div>
                <div class="message-date">
                    <p>${new Date(msg.date).toLocaleDateString('tr-TR')}</p>
                </div>
                <div class="message-actions">
                    <button class="btn btn-sm btn-info" data-id="${msg.id}">Oku</button>
                    <button class="btn btn-sm btn-danger delete-message-btn" data-id="${msg.id}">Sil</button>
                </div>
            </div>
        `).join('');
    }

    function showMessageDetails(id) {
        const allMessages = getLocalStorageItem('doctorMessages') || [];
        const message = allMessages.find(msg => msg.id === id);

        if (message) {
            Swal.fire({
                title: `Kime: ${getPatientName(message.patientTc)}`,
                subheader: message.subject,
                html: `
                    <div style="text-align: left;">
                        <p><strong>Konu:</strong> ${message.subject}</p>
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

    function deleteMessage(id) {
        Swal.fire({
            title: 'Mesajı Sil',
            text: 'Bu mesajı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Evet, Sil!',
            cancelButtonText: 'İptal'
        }).then((result) => {
            if (result.isConfirmed) {
                let allMessages = getLocalStorageItem('doctorMessages') || [];
                const updatedMessages = allMessages.filter(msg => msg.id !== id);
                setLocalStorageItem('doctorMessages', updatedMessages);
                renderSentMessages(); // Re-render the list
                Swal.fire('Silindi!', 'Mesaj başarıyla silindi.', 'success');
            }
        });
    }

    sentMessagesList.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-info')) {
            const messageId = e.target.dataset.id;
            showMessageDetails(messageId);
        } else if (e.target.classList.contains('delete-message-btn')) {
            const messageId = e.target.dataset.id;
            deleteMessage(messageId);
        }
    });

    renderSentMessages();
});
