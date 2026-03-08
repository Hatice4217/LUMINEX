import { setupHeader } from './utils/header-manager.js';
import {
    getLuminexAppointments,
    getLuminexTestResults,
    getLuminexPrescriptions,
    getLuminexRadiologyResults
} from './utils/storage-utils.js';

function getSafeTranslation(key) {
    return window.getTranslation ? window.getTranslation(key) : key;
}

const elements = {
    historyListContainer: document.getElementById('healthHistoryList'),
    searchInput: document.getElementById('historySearch'),
    typeTabs: document.getElementById('typeTabs')
};

let allHistory = [];
let selectedType = 'all';
let searchTerm = '';

function getIconForType(type) {
    const icons = {
        'randevu': 'fa-calendar-check',
        'tahlil': 'fa-vials',
        'recete': 'fa-file-prescription',
        'rontgen': 'fa-x-ray'
    };
    return icons[type] || 'fa-notes-medical';
}

function compileHealthHistory() {
    const appointments = getLuminexAppointments().map(item => ({
        id: `randevu-${item.id}`,
        type: 'randevu',
        originalId: item.id,
        date: item.date,
        title: `${item.branch || getSafeTranslation('appointmentTitle')}`,
        details: `${getSafeTranslation('doctorLabel')}: ${item.doctor || getSafeTranslation('noInfo')}`,
        status: item.status || getSafeTranslation('completed')
    }));

    const testResults = getLuminexTestResults().map(item => ({
        id: `tahlil-${item.id}`,
        type: 'tahlil',
        originalId: item.id,
        date: item.resultDate || item.date,
        title: item.testName || item.name || getSafeTranslation('testTitle'),
        details: `${getSafeTranslation('doctorLabel')}: ${item.doctor || item.doctorName || getSafeTranslation('noInfo')}`,
        status: item.status || getSafeTranslation('completed')
    }));

    const prescriptions = getLuminexPrescriptions().map(item => ({
        id: `recete-${item.id}`,
        type: 'recete',
        originalId: item.id,
        date: item.date,
        title: `${item.diagnosis || item.notes || getSafeTranslation('prescriptionTitle')}`,
        details: `${getSafeTranslation('doctorLabel')}: ${item.doctorName || item.doctor || getSafeTranslation('noInfo')}`,
        status: item.status || getSafeTranslation('completed')
    }));

    const radiologyResults = getLuminexRadiologyResults().map(item => ({
        id: `rontgen-${item.id}`,
        type: 'rontgen',
        originalId: item.id,
        date: item.date,
        title: `${item.type || item.name || getSafeTranslation('radiologyTitle')}`,
        details: `${getSafeTranslation('doctorLabel')}: ${item.doctor || item.doctorName || getSafeTranslation('noInfo')}`,
        status: item.status || getSafeTranslation('completed')
    }));

    return [...appointments, ...testResults, ...prescriptions, ...radiologyResults]
        .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderHealthHistory(items) {
    if (!elements.historyListContainer) return;

    elements.historyListContainer.innerHTML = '';

    if (!items || items.length === 0) {
        elements.historyListContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-notes-medical"></i>
                <h3>${getSafeTranslation('noHealthHistoryFound')}</h3>
                <p>${getSafeTranslation('noHistoryDesc') || 'Sağlık geçmişinizde henüz kayıt bulunmuyor.'}</p>
            </div>
        `;
        return;
    }

    const currentLang = localStorage.getItem('language') || 'tr';
    const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.dataset.id = item.id;
        card.dataset.type = item.type;

        const formattedDate = new Date(item.date).toLocaleDateString(dateLocale, {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        card.innerHTML = `
            <div class="history-header">
                <div class="history-icon ${item.type}">
                    <i class="fas ${getIconForType(item.type)}"></i>
                </div>
                <div class="history-info">
                    <h3>${item.title}</h3>
                    <span class="history-date">${formattedDate}</span>
                </div>
            </div>
            <div class="history-meta">
                <div class="history-meta-item">
                    <i class="fas fa-stethoscope"></i>
                    <span>${item.details}</span>
                </div>
                <div class="history-meta-item">
                    <i class="fas fa-check-circle"></i>
                    <span>${item.status}</span>
                </div>
            </div>
            <div class="history-actions">
                <button class="history-btn view" data-action="view" data-id="${item.id}">
                    <i class="fas fa-eye"></i>
                    ${getSafeTranslation('viewDetails')}
                </button>
            </div>
        `;

        elements.historyListContainer.appendChild(card);
    });
}

function filterAndSearchHistory() {
    let filtered = [...allHistory];

    // Filter by type
    if (selectedType !== 'all') {
        filtered = filtered.filter(item => item.type === selectedType);
    }

    // Search by title or details
    if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(item =>
            (item.title && item.title.toLowerCase().includes(searchLower)) ||
            (item.details && item.details.toLowerCase().includes(searchLower))
        );
    }

    renderHealthHistory(filtered);
}

// --- Detail Modals ---

function showTestResultDetails(result) {
    const isOutOfRange = (value, range) => {
        if (typeof value !== 'string' || !range || range.trim() === '') return false;
        const numericValue = parseFloat(value.replace(',', '.'));
        if (isNaN(numericValue)) return false;
        if (range.startsWith('<')) return numericValue >= parseFloat(range.substring(1));
        if (range.startsWith('>')) return numericValue <= parseFloat(range.substring(1));
        const rangeParts = range.split('-').map(p => parseFloat(p.trim()));
        return rangeParts.length === 2 ? (numericValue < rangeParts[0] || numericValue > rangeParts[1]) : false;
    };

    const formatRange = (range, unit) => {
        if (!range || range.trim() === '' || !unit) return getSafeTranslation('noInfo');
        return `${range} ${unit}`;
    };

    const currentLang = localStorage.getItem('language') || 'tr';
    const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

    let content = result.results?.map(res => {
        const rangeDisplay = formatRange(res.range, res.unit);
        const outOfRange = isOutOfRange(res.value, res.range);

        return `
        <div class="result-parameter-card ${outOfRange ? 'out-of-range' : ''}">
            <div class="parameter-info">
                <span class="parameter-name">${res.parameter}</span>
                <span class="parameter-range">${getSafeTranslation('referenceLabel')}: ${rangeDisplay}</span>
            </div>
            <div class="parameter-value">
                <span class="value">${res.value}</span>
                <span class="unit">${res.unit}</span>
                ${outOfRange ?
                    `<i class="fas fa-exclamation-triangle range-indicator" title="${getSafeTranslation('outOfRangeWarning')}"></i>` :
                    `<i class="fas fa-check-circle range-indicator" title="${getSafeTranslation('inRangeInfo')}"></i>`
                }
            </div>
        </div>
    `;
    }).join('') || '';

    const html = `
        <div class="modern-results-container">
            <div class="modern-results-header">
                <h2 style="color: #0f172a; font-size: 1.4rem;">${result.testName || result.name}</h2>
                <p style="color: #475569; font-size: 0.9rem; margin: 4px 0;"><strong>${getSafeTranslation('dateLabel')}:</strong> ${new Date(result.resultDate || result.date).toLocaleDateString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric' })} | <strong>${getSafeTranslation('doctorLabel')}:</strong> ${result.doctorName || result.doctor}</p>
            </div>
            <div class="modern-results-body">${content}</div>
        </div>
    `;

    Swal.fire({
        html,
        showCloseButton: true,
        showConfirmButton: false,
        width: '800px',
        customClass: {
            popup: 'modern-swal-popup',
            htmlContainer: 'modern-swal-container'
        }
    });
}

function showPrescriptionDetails(p) {
    const currentLang = localStorage.getItem('language') || 'tr';
    const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

    let meds = p.medications?.map(m => `
        <div class="result-parameter-card">
            <div class="parameter-info">
                <span class="parameter-name">${m.name}</span>
                <span class="parameter-range">${getSafeTranslation('dosage') || 'Dozaj'}: ${m.dosage}</span>
            </div>
            <div class="parameter-value">
                <span class="unit" style="font-size: 1rem; text-align: right;">${m.instructions || ''}</span>
            </div>
        </div>
    `).join('') || '';

    const html = `
        <div class="modern-results-container">
            <div class="modern-results-header">
                <h2 style="color: #0f172a; font-size: 1.4rem;">${getSafeTranslation('prescriptionTitle')} ${getSafeTranslation('details')}</h2>
                <p style="color: #475569; font-size: 0.9rem; margin: 4px 0;"><strong>${getSafeTranslation('dateLabel')}:</strong> ${new Date(p.date).toLocaleDateString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric' })} | <strong>${getSafeTranslation('doctorLabel')}:</strong> ${p.doctorName}</p>
                <p style="color: #475569; font-size: 0.9rem; margin: 4px 0;"><strong>${getSafeTranslation('diagnosisLabel')}:</strong> ${p.diagnosis || p.notes}</p>
            </div>
            <div class="modern-results-body">${meds}</div>
        </div>
    `;

    Swal.fire({
        html,
        showCloseButton: true,
        showConfirmButton: false,
        width: '800px',
        customClass: {
            popup: 'modern-swal-popup',
            htmlContainer: 'modern-swal-container'
        }
    });
}

function showRadiologyDetails(r) {
    const currentLang = localStorage.getItem('language') || 'tr';
    const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

    const html = `
        <div class="modern-results-container">
            <div class="modern-results-header">
                <h2 style="color: #0f172a; font-size: 1.4rem;">${r.type || r.name}</h2>
                <p style="color: #475569; font-size: 0.9rem; margin: 4px 0;"><strong>${getSafeTranslation('dateLabel')}:</strong> ${new Date(r.date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })} | <strong>${getSafeTranslation('doctorLabel')}:</strong> ${r.doctorName || r.doctor}</p>
            </div>
            <div class="modern-results-body">
                <div class="result-report-card">
                    <div style="margin-bottom: 16px;">
                        <h4 style="color: #001F6B; font-size: 1rem; margin-bottom: 8px; display: block;">
                            <i class="fas fa-microscope" style="margin-right: 8px;"></i> ${getSafeTranslation('technique')}
                        </h4>
                        <p style="margin: 0 0 16px 0; color: #334155;">${r.details?.technique || getSafeTranslation('noInfo')}</p>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <h4 style="color: #001F6B; font-size: 1rem; margin-bottom: 8px; display: block;">
                            <i class="fas fa-search" style="margin-right: 8px;"></i> ${getSafeTranslation('findings')}
                        </h4>
                        <p style="margin: 0 0 16px 0; color: #334155;">${r.details?.findings || getSafeTranslation('noInfo')}</p>
                    </div>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                    <div style="margin-bottom: 16px;">
                        <h4 style="color: #001F6B; font-size: 1rem; margin-bottom: 8px; display: block;">
                            <i class="fas fa-clipboard-check" style="margin-right: 8px;"></i> ${getSafeTranslation('resultComment')}
                        </h4>
                        <p style="margin: 0 0 16px 0; font-weight: 500; color: #334155;">${r.details?.impression || getSafeTranslation('noInfo')}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    Swal.fire({
        html,
        showCloseButton: true,
        showConfirmButton: false,
        width: '800px',
        customClass: {
            popup: 'modern-swal-popup',
            htmlContainer: 'modern-swal-container'
        }
    });
}

function showGenericDetails(item) {
    const currentLang = localStorage.getItem('language') || 'tr';
    const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

    const formattedDate = new Date(item.date).toLocaleDateString(dateLocale, {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const html = `
        <div class="modern-results-container">
            <div class="modern-results-header">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; background: var(--primary-gradient);">
                        <i class="fas ${getIconForType(item.type)}" style="font-size: 1.5rem;"></i>
                    </div>
                    <div>
                        <h2 style="margin: 0; color: #0f172a; font-size: 1.3rem;">${item.title}</h2>
                        <p style="margin: 0; opacity: 0.9; color: #64748b;">${formattedDate}</p>
                    </div>
                </div>
            </div>
            <div class="modern-results-body">
                <div class="result-report-card">
                    <h4 style="color: #0f172a; margin-bottom: 10px;">${getSafeTranslation('details')}</h4>
                    <p style="line-height: 1.6; color: #334155;">${item.details}</p>
                </div>
            </div>
        </div>
    `;

    Swal.fire({
        html,
        showCloseButton: true,
        showConfirmButton: false,
        width: '600px',
        customClass: {
            popup: 'modern-swal-popup',
            htmlContainer: 'modern-swal-container'
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    // Load initial data
    allHistory = compileHealthHistory();
    filterAndSearchHistory();

    // Search input event
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            filterAndSearchHistory();
        });
    }

    // Type tabs click events
    if (elements.typeTabs) {
        elements.typeTabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.type-tab');
            if (!tab) return;

            document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            selectedType = tab.dataset.type;
            filterAndSearchHistory();
        });
    }

    // Card button click events
    if (elements.historyListContainer) {
        elements.historyListContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.history-btn');
            if (!button) return;

            const itemId = button.dataset.id;
            const [type, originalId] = itemId.split(/-(.+)/);

            switch (type) {
                case 'tahlil':
                    showTestResultDetails(getLuminexTestResults().find(r => r.id === originalId));
                    break;
                case 'recete':
                    showPrescriptionDetails(getLuminexPrescriptions().find(p => p.id === originalId));
                    break;
                case 'rontgen':
                    showRadiologyDetails(getLuminexRadiologyResults().find(r => r.id === originalId));
                    break;
                default:
                    showGenericDetails(allHistory.find(item => item.id === itemId));
                    break;
            }
        });
    }
});
