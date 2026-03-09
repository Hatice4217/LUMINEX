import { setupHeader } from './utils/header-manager.js';
import { getActiveProfile, getLocalStorageItem, setLocalStorageItem, getDoctorDisplayName, getLuminexUsers } from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();
    const doctorMessagesList = document.getElementById('doctorMessagesList');
    const searchInput = document.getElementById('messageSearchInput');
    const unreadFilter = document.getElementById('unreadFilter');
    const archivedFilter = document.getElementById('archivedFilter');
    const activeProfile = getActiveProfile();

    if (!activeProfile) {
        window.location.href = 'login.html';
        return;
    }

    // --- Helper: Get Doctor Info ---
    function getDoctorInfo(doctorId) {
        const users = getLuminexUsers();
        const doctor = users.find(user => user.id === doctorId);
        return doctor || { name: 'Bilinmeyen Doktor', branch: 'Genel' };
    }

    // --- Helper: Get Initials ---
    function getInitials(name) {
        const cleanName = name.replace(/^(Dr\.?\s*)+/i, '');
        const parts = cleanName.split(' ');
        if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return cleanName.substring(0, 2).toUpperCase();
    }

    // --- Helper: Get Badge Class ---
    function getBadgeClass(branch) {
        const b = branch.toLowerCase();
        if (b.includes('ortopedi')) return 'badge-ortopedi';
        if (b.includes('çocuk') || b.includes('pediatri')) return 'badge-pediatri';
        if (b.includes('dahiliye')) return 'badge-dahiliye';
        if (b.includes('kardiyo')) return 'badge-kardiyoloji';
        return 'badge-default';
    }

    // --- Generate Dummy Data if Empty ---
    function ensureDummyMessages() {
        let allMessages = getLocalStorageItem('doctorMessages') || [];
        const userMessages = allMessages.filter(msg => msg.patientTc === activeProfile.tc);

        if (userMessages.length === 0) {
            const newMessages = [
                {
                    id: 'msg-demo-1',
                    doctorId: 'drortopedi1', // Dr. Jale Öztürk ID (from data.js)
                    patientTc: activeProfile.tc,
                    subject: 'MR Sonuçlarınız Hakkında',
                    message: 'MR sonuçlarınızı inceledim. Herhangi bir sorun görünmüyor, detayları pazartesi günkü randevumuzda konuşuruz.',
                    date: new Date().toISOString(), // Today
                    read: false
                },
                {
                    id: 'msg-demo-2',
                    doctorId: 'drped2', // Dr. Gamze Yılmaz ID (from data.js)
                    patientTc: activeProfile.tc,
                    subject: 'Tahlil Sonuçları İsteği',
                    message: 'Yarınki kontrol randevunuza gelmeden önce lütfen eski tahlil sonuçlarınızı sekreterliğe iletin.',
                    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                    read: true
                }
            ];
            allMessages = [...allMessages, ...newMessages];
            setLocalStorageItem('doctorMessages', allMessages);
        }
    }

    ensureDummyMessages();

    function renderMessages() {
        const allMessages = getLocalStorageItem('doctorMessages') || [];
        let messages = allMessages.filter(msg => msg.patientTc === activeProfile.tc);

        // Filter
        const searchTerm = searchInput.value.toLowerCase();
        const showUnreadOnly = unreadFilter.checked;
        const showArchived = archivedFilter.checked;

        messages = messages.filter(msg => {
            const isArchived = !!msg.archived;
            // Arşiv filtresi seçiliyse sadece arşivlenmişleri, değilse arşivlenmemişleri (gelen kutusu) göster
            if (showArchived !== isArchived) return false;

            const doctor = getDoctorInfo(msg.doctorId);
            const matchesSearch = doctor.name.toLowerCase().includes(searchTerm) || 
                                  msg.subject.toLowerCase().includes(searchTerm) ||
                                  msg.message.toLowerCase().includes(searchTerm);
            const matchesUnread = showUnreadOnly ? !msg.read : true;
            return matchesSearch && matchesUnread;
        });

        // Sort by date desc
        messages.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (messages.length === 0) {
            doctorMessagesList.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-inbox" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 15px;"></i>
                    <p style="color: #64748b;">Görüntülenecek mesaj bulunamadı.</p>
                </div>`;
            return;
        }

        doctorMessagesList.innerHTML = messages.map(msg => {
            const doctor = getDoctorInfo(msg.doctorId);
            const initials = getInitials(doctor.name);
            const badgeClass = getBadgeClass(doctor.branch);
            const time = new Date(msg.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            const isUnread = !msg.read;
            const isArchived = !!msg.archived;

            return `
            <div class="doctor-message-item ${isUnread ? 'unread' : ''}" data-id="${msg.id}" style="
                display: grid;
                grid-template-columns: auto 1fr auto;
                gap: 20px;
                align-items: center;
                padding: 20px;
                border-radius: 16px;
                background: var(--white-color);
                border: 1px solid var(--border-color);
                margin-bottom: 15px;
                transition: all 0.3s ease;
                cursor: pointer;
                position: relative;
            ">
                ${isUnread ? '<div style="position: absolute; top: 20px; right: 20px; width: 10px; height: 10px; background: #ff4757; border-radius: 50%;"></div>' : ''}
                
                <div style="
                    width: 55px; height: 55px; border-radius: 50%; 
                    background: ${isUnread ? '#001F6B' : '#94a3b8'}; 
                    color: white; display: flex; align-items: center; justify-content: center; 
                    font-weight: 700; font-size: 1.2rem;">
                    ${initials}
                </div>

                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                        <span style="font-weight: 600; color: var(--text-color); font-size: 1rem;">${getDoctorDisplayName(doctor.name)}</span>
                        <span class="branch-badge ${badgeClass}">${doctor.branch}</span>
                    </div>
                    <div style="font-size: 0.95rem; color: var(--text-color); ${isUnread ? 'font-weight: 700;' : ''}">${msg.subject}</div>
                    <div style="font-size: 0.85rem; color: var(--text-light); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 400px;">
                        ${msg.message}
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px; min-width: 140px;">
                    <span style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 5px;">${time}</span>
                    <div class="message-actions-hover">
                        <button class="action-icon-btn" title="Yanıtla" onclick="event.stopPropagation(); window.replyMessage('${msg.id}')">
                            <i class="fas fa-reply"></i>
                        </button>
                        <button class="action-icon-btn" title="${isArchived ? 'Arşivden Çıkar' : 'Arşivle'}" onclick="event.stopPropagation(); window.archiveMessage('${msg.id}')">
                            <i class="fas ${isArchived ? 'fa-box-open' : 'fa-box-archive'}"></i>
                        </button>
                        <div style="position: relative;">
                            <button class="action-icon-btn" title="Diğer İşlemler" onclick="event.stopPropagation(); window.toggleDropdown('${msg.id}')">
                                <i class="fas fa-ellipsis-vertical"></i>
                            </button>
                            <div id="dropdown-${msg.id}" class="action-dropdown">
                                <button class="dropdown-item" onclick="event.stopPropagation(); window.downloadMessagePdf('${msg.id}')"><i class="fas fa-file-pdf"></i> PDF Olarak İndir / Yazdır</button>
                                <button class="dropdown-item" onclick="event.stopPropagation(); window.toggleReadStatus('${msg.id}')"><i class="fas ${msg.read ? 'fa-envelope' : 'fa-envelope-open'}"></i> ${msg.read ? 'Okunmadı İşaretle' : 'Okundu İşaretle'}</button>
                                <div class="dropdown-divider"></div>
                                <button class="dropdown-item text-danger" onclick="event.stopPropagation(); window.deleteMessage('${msg.id}')"><i class="fas fa-trash-alt"></i> Sil</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `}).join('');
    }

    function showMessageDetails(id) {
        let allMessages = getLocalStorageItem('doctorMessages') || [];
        const message = allMessages.find(msg => msg.id === id);

        if (message) {
            const doctor = getDoctorInfo(message.doctorId);
            // Mark as read
            if (!message.read) {
                message.read = true;
                setLocalStorageItem('doctorMessages', allMessages);
                renderMessages(); // Re-render to update the read status
            }

            Swal.fire({
                title: '',
                html: `
                    <div style="text-align: left;">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                            <div style="width: 50px; height: 50px; border-radius: 50%; background: #001F6B; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;">
                                ${getInitials(doctor.name)}
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 1.2rem; color: #001F6B;">${getDoctorDisplayName(doctor.name)}</h3>
                                <span style="font-size: 0.85rem; color: #64748b;">${doctor.branch}</span>
                            </div>
                        </div>
                        <h4 style="margin-bottom: 10px; color: #333;">${message.subject}</h4>
                        <p style="color: #666; line-height: 1.6; background: #f8fafc; padding: 15px; border-radius: 10px;">${message.message}</p>
                        <div style="margin-top: 15px; font-size: 0.8rem; color: #94a3b8; text-align: right;">
                            ${new Date(message.date).toLocaleString('tr-TR')}
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: '<i class="fas fa-reply"></i> Yanıtla',
                cancelButtonText: 'Kapat',
                confirmButtonColor: '#001F6B',
                width: '600px'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.replyMessage(message.id);
                }
            });
        }
    }

    // --- Event Listeners ---
    doctorMessagesList.addEventListener('click', (e) => {
        const item = e.target.closest('.doctor-message-item');
        if (item) showMessageDetails(item.dataset.id);
    });

    searchInput.addEventListener('input', renderMessages);
    unreadFilter.addEventListener('change', renderMessages);
    archivedFilter.addEventListener('change', renderMessages);

    // Global actions
    window.replyMessage = (id) => {
        const allMessages = getLocalStorageItem('doctorMessages') || [];
        const message = allMessages.find(msg => msg.id === id);
        
        if (!message) return;
        
        const doctor = getDoctorInfo(message.doctorId);
        const initials = getInitials(doctor.name);
        
        Swal.fire({
            title: '',
            html: `
                <div style="text-align: left;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                        <div style="width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #001F6B 0%, #003B8E 100%); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; box-shadow: 0 4px 12px rgba(0,31,107,0.2);">
                            ${initials}
                        </div>
                        <div>
                            <div style="font-size: 0.8rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Alıcı</div>
                            <div style="font-size: 1.15rem; font-weight: 700; color: #0f172a;">${getDoctorDisplayName(doctor.name)}</div>
                            <div style="font-size: 0.85rem; color: #64748b;">${doctor.branch}</div>
                        </div>
                    </div>
                    
                    <div style="background: #f8fafc; padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                        <div style="color: #64748b; font-size: 0.85rem; margin-bottom: 4px;">Konu</div>
                        <div style="color: #334155; font-weight: 600; font-size: 1rem;">${message.subject}</div>
                    </div>

                    <div style="position: relative;">
                        <textarea id="replyMessageText" class="form-control" placeholder="Mesajınızı buraya yazın..." style="width: 100%; height: 200px; resize: none; padding: 15px; border-radius: 12px; border: 1px solid #cbd5e1; font-family: 'Inter', sans-serif; font-size: 0.95rem; line-height: 1.6; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); background-image: none !important;"></textarea>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '<span style="display: flex; align-items: center; gap: 8px;">Gönder <i class="fas fa-paper-plane"></i></span>',
            cancelButtonText: 'Vazgeç',
            confirmButtonColor: '#001F6B',
            cancelButtonColor: '#94a3b8',
            width: '600px',
            padding: '30px',
            preConfirm: () => {
                const text = document.getElementById('replyMessageText').value;
                if (!text || text.trim() === '') {
                    Swal.showValidationMessage('Lütfen bir mesaj yazın');
                    return false;
                }
                return text;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire('Gönderildi!', 'Yanıtınız doktora başarıyla iletildi.', 'success');
            }
        });
    };

    window.archiveMessage = (id) => { 
        let allMessages = getLocalStorageItem('doctorMessages') || [];
        const msgIndex = allMessages.findIndex(m => m.id === id);
        if (msgIndex !== -1) {
            const isArchived = !!allMessages[msgIndex].archived;
            allMessages[msgIndex].archived = !isArchived; // Durumu tersine çevir (Arşivle <-> Çıkar)
            setLocalStorageItem('doctorMessages', allMessages);
            
            Swal.fire({
                icon: 'success',
                title: isArchived ? 'Arşivden Çıkarıldı' : 'Arşivlendi',
                text: isArchived ? 'Mesaj gelen kutusuna taşındı.' : 'Mesaj arşive taşındı.',
                timer: 1500,
                showConfirmButton: false
            });
            renderMessages();
        }
    };
    
    window.toggleDropdown = (id) => {
        const dropdown = document.getElementById(`dropdown-${id}`);
        const allDropdowns = document.querySelectorAll('.action-dropdown');
        
        // Reset z-index for all items
        document.querySelectorAll('.doctor-message-item').forEach(item => {
            item.style.zIndex = '';
        });

        allDropdowns.forEach(d => {
            if (d.id !== `dropdown-${id}`) d.classList.remove('show');
        });
        
        if (dropdown) {
            dropdown.classList.toggle('show');
            if (dropdown.classList.contains('show')) {
                const parentItem = dropdown.closest('.doctor-message-item');
                if (parentItem) {
                    parentItem.style.zIndex = '100';
                }
            }
        }
    };

    window.downloadMessagePdf = (id) => {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
        Toast.fire({
            icon: 'success',
            title: 'PDF Hazırlanıyor...'
        });
        // Simulate download
        setTimeout(() => {
             // In a real app, this would trigger a download
        }, 1500);
    };

    window.toggleReadStatus = (id) => {
        let allMessages = getLocalStorageItem('doctorMessages') || [];
        const index = allMessages.findIndex(m => m.id === id);
        if (index !== -1) {
            allMessages[index].read = !allMessages[index].read;
            setLocalStorageItem('doctorMessages', allMessages);
            renderMessages();
        }
    };

    window.deleteMessage = (id) => {
        Swal.fire({
            title: 'Emin misiniz?',
            text: "Bu mesaj kalıcı olarak silinecektir!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'İptal'
        }).then((result) => {
            if (result.isConfirmed) {
                let allMessages = getLocalStorageItem('doctorMessages') || [];
                allMessages = allMessages.filter(m => m.id !== id);
                setLocalStorageItem('doctorMessages', allMessages);
                Swal.fire('Silindi!', 'Mesaj silindi.', 'success');
                renderMessages();
            }
        });
    };

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.action-icon-btn') && !e.target.closest('.action-dropdown')) {
            document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('show'));
            document.querySelectorAll('.doctor-message-item').forEach(item => {
                item.style.zIndex = '';
            });
        }
    });

    renderMessages();
});
