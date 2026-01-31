import { setupHeader } from './utils/header-manager.js';
import { 
    getLoggedInUser, 
    getLuminexTickets, 
    setLuminexTickets, 
    getLuminexNotifications, 
    setLuminexNotifications 
} from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const loggedInUser = getLoggedInUser();
    const isAdmin = loggedInUser && loggedInUser.role === 'admin';

    const elements = {
        adminView: document.getElementById('adminSupportView'),
        patientView: document.getElementById('patientContactView'),
        ticketGrid: document.getElementById('ticketGrid'),
        ticketCount: document.getElementById('ticketCount'),
        ticketSearch: document.getElementById('ticketSearchInput'),
        ticketFilter: document.getElementById('ticketFilterStatus'),
        faqAccordion: document.getElementById('faqAccordion'),
        contactForm: document.getElementById('contactForm'),
        contactFormAlert: document.getElementById('contactFormAlert')
    };

    function displayAlert(message, type = 'error', iconClass = '') {
        const alertElement = elements.contactFormAlert;
        if (!alertElement) {
            console.error('contactFormAlert element not found!');
            return;
        }

        alertElement.style.display = 'flex';
        alertElement.className = 'form-alert'; // Reset classes
        alertElement.classList.add(type); // Add 'error' or 'success' class
        alertElement.innerHTML = `${iconClass ? `<i class="${iconClass}"></i>` : ''}<span>${message}</span>`;
    }

    function clearAlert() {
        const alertElement = elements.contactFormAlert;
        if (alertElement) {
            alertElement.style.display = 'none';
            alertElement.innerHTML = '';
            alertElement.className = 'form-alert'; // Reset to base class
        }
    }

    // Toggle Views
    if (isAdmin) {
        if(elements.patientView) elements.patientView.style.display = 'none';
        if(elements.adminView) elements.adminView.style.display = 'block';
        renderAdminTickets();
    } else {
        if(elements.adminView) elements.adminView.style.display = 'none';
        if(elements.patientView) elements.patientView.style.display = 'block';
        initPatientLogic();
    }

    // --- REVEAL ANIMATIONS ---
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // --- ADMIN LOGIC ---
    function renderAdminTickets() {
        let tickets = getLuminexTickets();
        if (!tickets || tickets.length === 0) {
            tickets = [
                { id: 'TK-1042', user: 'Ahmet Yılmaz', userId: 'guest', avatarBg: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', subject: 'Randevu İptali Sorunu', preview: 'Yarınki kardiyoloji randevumu iptal etmeye çalışıyorum fakat sistem hata veriyor.', date: '28 Kas, 10:30', status: 'open', priority: 'high' },
                { id: 'TK-1041', user: 'Zeynep Kaya', userId: 'guest', avatarBg: 'linear-gradient(135deg, #fd79a8, #e17055)', subject: 'E-Reçete Görüntüleme', preview: 'Son muayenemdeki ilaçlarımı sistemde göremiyorum. Yardımcı olur musunuz?', date: '27 Kas, 16:15', status: 'closed', priority: 'medium' }
            ];
            setLuminexTickets(tickets);
        }

        function filterAndRender() {
            const term = elements.ticketSearch.value.toLowerCase();
            const status = elements.ticketFilter.value;

            const filtered = tickets.filter(t => {
                const matchesTerm = t.id.toLowerCase().includes(term) || t.user.toLowerCase().includes(term) || t.subject.toLowerCase().includes(term);
                const matchesStatus = status === 'all' || t.status === status;
                return matchesTerm && matchesStatus;
            });

            elements.ticketGrid.innerHTML = '';
            filtered.forEach(t => {
                const card = document.createElement('div');
                card.className = 'ticket-card reveal';
                card.innerHTML = `
                    <div class="ticket-header">
                        <div class="user-meta">
                            <div class="user-avatar-ticket" style="background: ${t.avatarBg}">${t.user.substring(0,2).toUpperCase()}</div>
                            <div class="user-details"><h4>${t.user}</h4><span>${t.id} • ${t.date}</span></div>
                        </div>
                        <span class="priority-dot priority-${t.priority}"></span>
                    </div>
                    <div class="ticket-body"><span class="ticket-subject">${t.subject}</span><p class="ticket-preview">${t.preview}</p></div>
                    <div class="ticket-footer">
                        <span class="status-pill status-${t.status}">${t.status === 'open' ? 'Açık' : 'Kapalı'}</span>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-footer-action btn-reply" onclick="window.replyTicket('${t.id}')"><i class="fas fa-reply"></i></button>
                            <button class="btn-footer-action btn-delete" onclick="window.deleteTicket('${t.id}')"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
                elements.ticketGrid.appendChild(card);
                revealObserver.observe(card);
            });
        }

        elements.ticketSearch.addEventListener('input', filterAndRender);
        elements.ticketFilter.addEventListener('change', filterAndRender);
        filterAndRender();
    }

    // --- PATIENT LOGIC ---
    function initPatientLogic() {
        const userRole = loggedInUser ? loggedInUser.role : 'patient';

        // FAQ Data
        const faqData = [
            { q: window.getTranslation('faq1Question'), a: window.getTranslation('faq1Answer') },
            { q: window.getTranslation('faq2Question'), a: window.getTranslation('faq2Answer') },
            { q: window.getTranslation('faq3Question'), a: window.getTranslation('faq3Answer') },
            { q: window.getTranslation('faq4Question'), a: window.getTranslation('faq4Answer') }
        ];

        if (elements.faqAccordion) {
            elements.faqAccordion.innerHTML = faqData.map(item => `
                <div class="faq-item">
                    <div class="faq-question"><h4>${item.q}</h4><i class="fas fa-chevron-down"></i></div>
                    <div class="faq-answer"><p>${item.a}</p></div>
                </div>
            `).join('');

            elements.faqAccordion.querySelectorAll('.faq-question').forEach(q => {
                q.addEventListener('click', () => {
                    const item = q.parentElement;
                    const isActive = item.classList.contains('active');
                    elements.faqAccordion.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
                    if (!isActive) item.classList.add('active');
                });
            });
        }

        // Contact Form Subject Dropdown
        const subjects = [
            { group: window.getTranslation('categoryAppointment'), options: [window.getTranslation('appointmentEvent'), window.getTranslation('reschedule'), window.getTranslation('bookAppointmentQuick')] },
            { group: window.getTranslation('categorySystem'), options: [window.getTranslation('login'), window.getTranslation('contentLoadError'), window.getTranslation('profile')] },
            { group: window.getTranslation('other'), options: [window.getTranslation('genericInfo'), window.getTranslation('corporate')] }
        ];

        const subjectInput = document.getElementById('contactSubject');
        const subjectPanel = document.getElementById('contactSubjectPanel');

        if (subjectInput && subjectPanel) {
            setupCustomDropdown({
                input: subjectInput,
                panel: subjectPanel,
                items: subjects,
                onSelect: (item) => { subjectInput.value = item.name; },
                isGrouped: true
            });
        }

        // Form Submit
        if (elements.contactForm) {
            elements.contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                clearAlert(); // Clear previous alerts

                const subjectInput = document.getElementById('contactSubject');
                const messageInput = document.getElementById('contactMessage');

                // Basic validation
                if (!subjectInput.value.trim() || !messageInput.value.trim()) {
                    displayAlert(window.getTranslation('fillAllFields'), 'error', 'fas fa-exclamation-triangle');
                    return; // Stop form submission
                }

                // Simulate sending message (e.g., API call)
                try {
                    // Show sending message
                    Swal.fire({
                        title: window.getTranslation('sendingTitle'),
                        text: window.getTranslation('sendingText'),
                        allowOutsideClick: false,
                        showConfirmButton: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    // Simulate API call delay
                    await new Promise(resolve => setTimeout(resolve, 1500)); 

                    // Assuming success for demonstration
                    Swal.fire({
                        icon: 'success',
                        title: window.getTranslation('contactSuccessTitle'),
                        text: window.getTranslation('contactSuccessText'),
                        confirmButtonColor: 'var(--primary-color)'
                    });
                    elements.contactForm.reset();
                } catch (error) {
                    console.error('Error sending message:', error);
                    Swal.fire({
                        icon: 'error',
                        title: window.getTranslation('genericErrorTitle'),
                        text: window.getTranslation('genericErrorMessageNetwork'), // Or genericErrorMessageServer
                        confirmButtonColor: 'var(--primary-color)'
                    });
                    displayAlert(window.getTranslation('genericErrorMessageNetwork'), 'error', 'fas fa-times-circle');
                }
            });
        }

        // Map Init
        initMap();
    }

    function displayAlert(message, type = 'error', iconClass = '') {
        const alertElement = elements.contactFormAlert;
        if (!alertElement) return;

        alertElement.style.display = 'flex';
        alertElement.className = 'form-alert'; // Reset classes
        alertElement.classList.add(type); // Add 'error' or 'success' class
        alertElement.innerHTML = `${iconClass ? `<i class="${iconClass}"></i>` : ''}<span>${message}</span>`;
    }

    function clearAlert() {
        const alertElement = elements.contactFormAlert;
        if (alertElement) {
            alertElement.style.display = 'none';
            alertElement.innerHTML = '';
            alertElement.className = 'form-alert'; // Reset to base class
        }
    }



    function initMap() {
        const mapElement = document.getElementById('map');
        if (!mapElement || typeof L === 'undefined') return;
        const lat = 37.189255, lon = 33.220406;
        const map = L.map(mapElement).setView([lat, lon], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        L.marker([lat, lon]).addTo(map).bindPopup('Luminex Karaman').openPopup();
    }
});

function setupCustomDropdown(config) {
    const { input, panel, items, onSelect, isGrouped } = config;
    if (!input || !panel) return;

    panel.innerHTML = '';
    if (isGrouped) {
        items.forEach(group => {
            const grpDiv = document.createElement('div');
            grpDiv.className = 'custom-optgroup';
            grpDiv.textContent = group.group;
            panel.appendChild(grpDiv);
            group.options.forEach(opt => {
                const optDiv = document.createElement('div');
                optDiv.className = 'custom-option';
                optDiv.textContent = opt;
                optDiv.addEventListener('mousedown', () => {
                    input.value = opt;
                    onSelect({ name: opt });
                    panel.classList.remove('visible');
                });
                panel.appendChild(optDiv);
            });
        });
    }

    input.addEventListener('focus', () => panel.classList.add('visible'));
    input.addEventListener('blur', () => setTimeout(() => panel.classList.remove('visible'), 200));
}

// Admin window functions
window.replyTicket = (id) => Swal.fire('Yanıtla', `Talep No: ${id}`, 'info');
window.deleteTicket = (id) => {
    Swal.fire({
        title: 'Emin misiniz?',
        text: 'Bu talep silinecektir!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff7675'
    }).then(res => {
        if(res.isConfirmed) Swal.fire('Silindi!', '', 'success');
    });
};