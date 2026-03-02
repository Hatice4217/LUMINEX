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
        tabs: document.querySelectorAll('.payment-tab')
    };

    let currentTab = 'all';

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

    function renderPayments() {
        let payments = getLocalStorageItem('luminexPayments') || [];

        // If no payments exist, generate dummy data
        if (payments.length === 0) {
            payments = generateDummyPayments();
            setLocalStorageItem('luminexPayments', payments);
        }

        const activeProfile = getActiveProfile();
        const loggedInUser = getLoggedInUser();
        const userTc = activeProfile ? activeProfile.tc : (loggedInUser ? loggedInUser.tc : null);

        // Filter payments for current user
        const userPayments = userTc ? payments.filter(p => p.userId === userTc) : payments;

        // Filter by tab
        let filteredPayments = userPayments;
        if (currentTab !== 'all') {
            filteredPayments = userPayments.filter(p => p.status === currentTab);
        }

        // Update stats
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

        // Render list
        if (filteredPayments.length === 0) {
            const emptyMessage = currentTab === 'all'
                ? getSafeTranslation('noPaymentsFound')
                : getSafeTranslation('noPendingBills');

            elements.paymentsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>${emptyMessage}</p>
                </div>
            `;
            return;
        }

        const currentLang = localStorage.getItem('language') || 'tr';
        const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

        elements.paymentsList.innerHTML = filteredPayments.sort((a, b) => new Date(b.date) - new Date(a.date)).map(payment => {
            const paymentDate = new Date(payment.date).toLocaleDateString(dateLocale, {
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

            let actionsHtml = '';

            if (payment.status === 'paid' && payment.invoiceNumber) {
                actionsHtml += `<button class="btn-payment" onclick="window.downloadInvoice('${payment.id}')">
                    <i class="fas fa-download"></i> ${getSafeTranslation('downloadInvoice')}
                </button>`;
            }

            if (payment.status === 'pending') {
                actionsHtml += `<button class="btn-payment primary" onclick="window.payNow('${payment.id}')">
                    <i class="fas fa-credit-card"></i> ${getSafeTranslation('payNow')}
                </button>`;
            }

            return `
                <div class="payment-card">
                    <div class="payment-card-left">
                        <div class="payment-card-icon">
                            <i class="fas ${typeIcon}"></i>
                        </div>
                        <div class="payment-card-info">
                            <h4>${payment.title}</h4>
                            <p><i class="fas fa-calendar-alt"></i> ${paymentDate}</p>
                            ${payment.paymentMethod ? `<p><i class="fas fa-credit-card"></i> ${getPaymentMethodTranslation(payment.paymentMethod)}</p>` : ''}
                            ${payment.invoiceNumber ? `<p><i class="fas fa-file-invoice"></i> ${payment.invoiceNumber}</p>` : ''}
                        </div>
                    </div>
                    <div class="payment-card-right">
                        <span class="payment-amount">${formatCurrency(payment.amount)}</span>
                        <span class="payment-status ${payment.status}">${getStatusTranslation(payment.status)}</span>
                        ${actionsHtml ? `<div class="payment-actions">${actionsHtml}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Re-init reveal animations
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) entry.target.classList.add('active');
            });
        }, { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    }

    // Tab click handlers
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            renderPayments();
        });
    });

    // Global functions
    window.downloadInvoice = (paymentId) => {
        Swal.fire({
            title: getSafeTranslation('downloadInvoice'),
            text: 'Fatura indiriliyor...',
            icon: 'info',
            timer: 2000,
            showConfirmButton: false
        });
    };

    window.payNow = (paymentId) => {
        Swal.fire({
            title: getSafeTranslation('payNow'),
            html: `
                <div style="text-align: left;">
                    <p>Ödeme yapmak için aşağıdaki bilgileri kullanabilirsiniz:</p>
                    <div style="background: var(--input-bg); padding: 15px; border-radius: 10px; margin-top: 15px;">
                        <p><strong>Banka:</strong> Garanti BBVA</p>
                        <p><strong>IBAN:</strong> TR12 3456 7890 1234 5678 9012 34</p>
                        <p><strong>Hesap Sahibi:</strong> LUMINEX Sağlık Hizmetleri A.Ş.</p>
                    </div>
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Tamam'
        });
    };

    // Initial render
    renderPayments();

    // Reveal animations
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
});
