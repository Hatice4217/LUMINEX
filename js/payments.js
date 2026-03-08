import { setupHeader } from './utils/header-manager.js';
import { getLocalStorageItem, setLocalStorageItem, getActiveProfile, getLoggedInUser } from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const elements = {
        totalPayments: document.getElementById('totalPayments'),
        paidPayments: document.getElementById('paidPayments'),
        pendingPayments: document.getElementById('pendingPayments'),
        refundCount: document.getElementById('refundCount'),
        paymentsList: document.getElementById('paymentsList'),
        statusTabs: document.getElementById('statusTabs'),
        searchInput: document.getElementById('paymentSearch')
    };

    let allPayments = [];
    let selectedStatus = 'all';
    let searchTerm = '';

    function getSafeTranslation(key) {
        return window.getTranslation ? window.getTranslation(key) : key;
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
    }

    function getPaymentMethodTranslation(method) {
        const translations = {
            'credit_card': getSafeTranslation('paymentMethodCreditCard'),
            'cash': getSafeTranslation('paymentMethodCash'),
            'bank_transfer': getSafeTranslation('paymentMethodBankTransfer'),
            'online': getSafeTranslation('paymentMethodOnline')
        };
        return translations[method] || method;
    }

    function getStatusTranslation(status) {
        const translations = {
            'paid': getSafeTranslation('paymentStatusPaid'),
            'pending': getSafeTranslation('paymentStatusPending'),
            'cancelled': getSafeTranslation('paymentStatusCancelled'),
            'refunded': getSafeTranslation('paymentStatusRefunded')
        };
        return translations[status] || status;
    }

    function generateDummyPayments() {
        const activeProfile = getActiveProfile();
        const loggedInUser = getLoggedInUser();

        if (!activeProfile && !loggedInUser) return [];

        const userTc = activeProfile ? activeProfile.tc : loggedInUser.tc;

        const dummyPayments = [
            {
                id: 'PAY-001',
                userId: userTc,
                type: 'appointment',
                title: 'Dr. Ayşe Yılmaz - Kardiyoloji Muayene',
                amount: 750,
                status: 'paid',
                paymentMethod: 'credit_card',
                date: '2025-02-15T14:30:00',
                invoiceNumber: 'INV-2025-001'
            },
            {
                id: 'PAY-002',
                userId: userTc,
                type: 'appointment',
                title: 'Dr. Mehmet Kaya - Dahiliye Muayene',
                amount: 500,
                status: 'paid',
                paymentMethod: 'online',
                date: '2025-02-10T10:00:00',
                invoiceNumber: 'INV-2025-002'
            },
            {
                id: 'PAY-003',
                userId: userTc,
                type: 'appointment',
                title: 'Dr. Zeynep Demir - Göz Muayene',
                amount: 600,
                status: 'pending',
                paymentMethod: null,
                date: '2025-02-28T16:00:00',
                invoiceNumber: null
            },
            {
                id: 'PAY-004',
                userId: userTc,
                type: 'lab_test',
                title: 'Kan Tahlili Paketi',
                amount: 350,
                status: 'paid',
                paymentMethod: 'cash',
                date: '2025-02-05T09:15:00',
                invoiceNumber: 'INV-2025-004'
            },
            {
                id: 'PAY-005',
                userId: userTc,
                type: 'refund',
                title: 'İptal Edilen Randevu - Dr. Ali Öz',
                amount: 400,
                status: 'refunded',
                paymentMethod: 'bank_transfer',
                date: '2025-02-01T11:00:00',
                invoiceNumber: 'REF-2025-001'
            }
        ];

        return dummyPayments;
    }

    function renderPaymentCards(payments) {
        if (!elements.paymentsList) return;

        elements.paymentsList.innerHTML = '';

        if (!payments || payments.length === 0) {
            const emptyMessage = selectedStatus === 'all'
                ? getSafeTranslation('noPaymentsFound')
                : getSafeTranslation('noPendingBills');

            elements.paymentsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h3>${emptyMessage}</h3>
                    <p>${getSafeTranslation('noPaymentsDesc') || 'Henüz ödeme kaydınız bulunmuyor.'}</p>
                </div>
            `;
            return;
        }

        const currentLang = localStorage.getItem('language') || 'tr';
        const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

        payments.forEach(payment => {
            const card = document.createElement('div');
            card.className = 'payment-card';
            card.dataset.id = payment.id;

            const formattedDate = new Date(payment.date).toLocaleDateString(dateLocale, {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const typeIcon = payment.type === 'appointment' ? 'fa-calendar-check' :
                            payment.type === 'lab_test' ? 'fa-vial' :
                            payment.type === 'radiology' ? 'fa-x-ray' :
                            payment.type === 'refund' ? 'fa-undo' : 'fa-file-invoice';

            const iconClass = payment.type === 'lab_test' ? 'lab' :
                            payment.type === 'radiology' ? 'radiology' :
                            payment.type === 'refund' ? 'refund' : '';

            let actionsHtml = '';

            if (payment.status === 'paid' && payment.invoiceNumber) {
                actionsHtml += `<button class="payment-btn download" data-action="download" data-id="${payment.id}">
                    <i class="fas fa-download"></i> ${getSafeTranslation('downloadInvoice')}
                </button>`;
            }

            if (payment.status === 'pending') {
                actionsHtml += `<button class="payment-btn pay" data-action="pay" data-id="${payment.id}">
                    <i class="fas fa-credit-card"></i> ${getSafeTranslation('payNow')}
                </button>`;
            }

            card.innerHTML = `
                <div class="payment-header">
                    <div class="payment-icon ${iconClass}">
                        <i class="fas ${typeIcon}"></i>
                    </div>
                    <div class="payment-info">
                        <h4>${payment.title}</h4>
                        <span class="payment-date">${formattedDate}</span>
                    </div>
                </div>
                <div class="payment-meta">
                    ${payment.paymentMethod ? `<div class="payment-meta-item">
                        <i class="fas fa-credit-card"></i>
                        <span>${getPaymentMethodTranslation(payment.paymentMethod)}</span>
                    </div>` : ''}
                    ${payment.invoiceNumber ? `<div class="payment-meta-item">
                        <i class="fas fa-file-invoice"></i>
                        <span>${payment.invoiceNumber}</span>
                    </div>` : ''}
                </div>
                <div class="payment-footer">
                    <span class="payment-amount">${formatCurrency(payment.amount)}</span>
                    <span class="payment-status ${payment.status}">${getStatusTranslation(payment.status)}</span>
                    ${actionsHtml ? `<div class="payment-actions">${actionsHtml}</div>` : ''}
                </div>
            `;

            elements.paymentsList.appendChild(card);
        });
    }

    function filterAndSearchPayments() {
        const activeProfile = getActiveProfile();
        const loggedInUser = getLoggedInUser();
        const userTc = activeProfile ? activeProfile.tc : (loggedInUser ? loggedInUser.tc : null);

        let filtered = [...allPayments];

        // Filter by user
        if (userTc) {
            filtered = filtered.filter(p => p.userId === userTc);
        }

        // Filter by status
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(p => p.status === selectedStatus);
        }

        // Search
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                (p.title && p.title.toLowerCase().includes(searchLower)) ||
                (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(searchLower))
            );
        }

        // Update stats
        const userPayments = userTc ? allPayments.filter(p => p.userId === userTc) : allPayments;
        const totalAmount = userPayments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + p.amount, 0);
        const paidCount = userPayments.filter(p => p.status === 'paid').length;
        const pendingCount = userPayments.filter(p => p.status === 'pending').length;
        const refundCount = userPayments.filter(p => p.status === 'refunded').length;

        elements.totalPayments.textContent = formatCurrency(totalAmount);
        elements.paidPayments.textContent = paidCount;
        elements.pendingPayments.textContent = pendingCount;
        elements.refundCount.textContent = refundCount;

        // Sort by date descending
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        renderPaymentCards(filtered);
    }

    function loadPayments() {
        let payments = getLocalStorageItem('luminexPayments') || [];

        // If no payments exist, generate dummy data
        if (payments.length === 0) {
            payments = generateDummyPayments();
            setLocalStorageItem('luminexPayments', payments);
        }

        allPayments = payments;
        filterAndSearchPayments();
    }

    // Status tabs click events
    if (elements.statusTabs) {
        elements.statusTabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.status-tab');
            if (!tab) return;

            document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            selectedStatus = tab.dataset.status;
            filterAndSearchPayments();
        });
    }

    // Search input event
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            filterAndSearchPayments();
        });
    }

    // Payment card button click events
    if (elements.paymentsList) {
        elements.paymentsList.addEventListener('click', (e) => {
            const button = e.target.closest('.payment-btn');
            if (!button) return;

            const action = button.dataset.action;
            const paymentId = button.dataset.id;
            const payment = allPayments.find(p => p.id === paymentId);

            if (!payment) return;

            if (action === 'download') {
                Swal.fire({
                    title: getSafeTranslation('downloadInvoice'),
                    text: getSafeTranslation('downloadingInvoice'),
                    icon: 'info',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else if (action === 'pay') {
                Swal.fire({
                    title: getSafeTranslation('payNow'),
                    html: `
                        <div style="text-align: left;">
                            <p>${getSafeTranslation('payNowInfo')}</p>
                            <div style="background: var(--input-bg); padding: 15px; border-radius: 10px; margin-top: 15px;">
                                <p><strong>${getSafeTranslation('bankName')}:</strong> Garanti BBVA</p>
                                <p><strong>${getSafeTranslation('bankIBAN')}:</strong> TR12 3456 7890 1234 5678 9012 34</p>
                                <p><strong>${getSafeTranslation('companyOwner')}:</strong> LUMINEX Sağlık Hizmetleri A.Ş.</p>
                            </div>
                        </div>
                    `,
                    icon: 'info',
                    confirmButtonText: getSafeTranslation('confirmPay')
                });
            }
        });
    }

    // Initial load
    loadPayments();

    // Reveal animations
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
});
