// health-history.js - Dropdown sorunu çözümü için lokal fonksiyonlar içerir.

import { setupHeader } from './utils/header-manager.js';
import { 
    getLuminexAppointments,
    getLuminexTestResults,
    getLuminexPrescriptions,
    getLuminexRadiologyResults
} from './utils/storage-utils.js';

// --- Dropdown için Lokal Fonksiyonlar ---
// Bu fonksiyonlar, paylaşılan custom-select.js yerine doğrudan bu dosyaya eklendi.

function populatePanel(panel, items) {
    if (!panel || !items) return;
    panel.innerHTML = '';
    items.forEach(item => {
        if (item && item.id !== undefined && item.name) {
            const div = document.createElement('div');
            div.className = 'custom-option';
            div.textContent = item.name;
            div.dataset.id = item.id;
            panel.appendChild(div);
        }
    });
}

function filterPanel(panel, filter) {
    if (!panel) return;
    const normalize = str => str.toLowerCase().replace(/i/g, 'ı'); // Basit Türkçe karakter desteği
    const search = normalize(filter);
    
    let hasVisible = false;
    panel.querySelectorAll('.custom-option').forEach(opt => {
        const match = normalize(opt.textContent).includes(search);
        opt.style.display = match ? '' : 'none';
        if (match) hasVisible = true;
    });
    return hasVisible;
}

function updateHighlight(options, index) {
    options.forEach((option, i) => {
        if (i === index) {
            option.classList.add('highlighted');
            // Smooth scroll yerine auto kullanarak daha hızlı tepki verelim
            option.scrollIntoView({ block: 'nearest', behavior: 'auto' });
        } else {
            option.classList.remove('highlighted');
        }
    });
}

function setupCustomDropdown(config) {
    const { input, panel, onSelect, items } = config;
    if (!input || !panel) return;

    populatePanel(panel, items || []);
    let highlightedIndex = -1;

    const openPanel = () => {
        panel.classList.add('visible');
        // Input "Tümü" ise veya boşsa hepsini göster
        const filterText = (input.value === 'Tümü') ? '' : input.value;
        filterPanel(panel, filterText);
    };

    const closePanel = () => {
        panel.classList.remove('visible');
        highlightedIndex = -1;
        panel.querySelectorAll('.custom-option').forEach(opt => opt.classList.remove('highlighted'));
    };

    // Inputa tıklayınca aç
    input.addEventListener('click', (e) => {
        e.stopPropagation();
        openPanel();
    });

    // Inputa odaklanınca aç (Tab ile gelindiğinde)
    input.addEventListener('focus', (e) => {
        openPanel();
    });

    // Yazarken filtrele
    input.addEventListener('input', () => {
        if (!panel.classList.contains('visible')) panel.classList.add('visible');
        filterPanel(panel, input.value);
        if (onSelect) onSelect({ id: null, name: input.value }); // Serbest metin girişi
    });

    // Klavye kontrolü
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            closePanel();
            return;
        }

        // Kapalıysa ve yön tuşuna basıldıysa aç
        if (!panel.classList.contains('visible') && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            openPanel();
            return;
        }

        const options = Array.from(panel.querySelectorAll('.custom-option:not([style*="display: none"])'));
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (options.length > 0) {
                    highlightedIndex = (highlightedIndex + 1) % options.length;
                    updateHighlight(options, highlightedIndex);
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (options.length > 0) {
                    highlightedIndex = (highlightedIndex - 1 + options.length) % options.length;
                    updateHighlight(options, highlightedIndex);
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex > -1 && options[highlightedIndex]) {
                    options[highlightedIndex].click(); // Tıklamayı tetikle
                } else {
                    closePanel(); // Seçim yoksa kapat
                }
                break;
            case 'Escape':
                closePanel();
                input.blur();
                break;
        }
    });

    // Seçenek tıklama (Event Delegation)
    panel.addEventListener('click', (e) => {
        const option = e.target.closest('.custom-option');
        if (option) {
            const item = { id: option.dataset.id, name: option.textContent };
            input.value = item.name;
            if (onSelect) onSelect(item);
            closePanel();
        }
    });

    // Dışarı tıklayınca kapat (Document level listener)
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !panel.contains(e.target)) {
            closePanel();
        }
    });
}


function getSafeTranslation(key) {
    return window.getTranslation ? window.getTranslation(key) : key;
}

// --- Sayfa Mantığı ---

function compileHealthHistory() {
    const appointments = getLuminexAppointments().map(item => ({ 
        id: `randevu-${item.id}`, 
        type: 'randevu', 
        originalId: item.id, 
        date: item.date, 
        title: `${item.branch || getSafeTranslation('appointmentTitle')} ${getSafeTranslation('appointmentTitle')}`, 
        details: `${getSafeTranslation('doctorLabel')}: ${item.doctor || getSafeTranslation('noInfo')}. ${getSafeTranslation('statusLabel') || 'Durum'}: ${item.status || getSafeTranslation('noInfo')}.` 
    }));
    
    const testResults = getLuminexTestResults().map(item => ({ 
        id: `tahlil-${item.id}`, 
        type: 'tahlil', 
        originalId: item.id, 
        date: item.resultDate || item.date, 
        title: item.testName || item.name || getSafeTranslation('testTitle'), 
        details: `${getSafeTranslation('doctorLabel')}: ${item.doctor || item.doctorName || getSafeTranslation('noInfo')}. ${getSafeTranslation('statusLabel') || 'Durum'}: ${item.status || getSafeTranslation('completed')}.` 
    }));
    
    const prescriptions = getLuminexPrescriptions().map(item => ({ 
        id: `recete-${item.id}`, 
        type: 'recete', 
        originalId: item.id, 
        date: item.date, 
        title: `${item.diagnosis || item.notes || getSafeTranslation('prescriptionTitle')} ${getSafeTranslation('prescriptionTitle')}`, 
        details: `${getSafeTranslation('doctorLabel')}: ${item.doctorName || item.doctor || getSafeTranslation('noInfo')}.` 
    }));
    
    const radiologyResults = getLuminexRadiologyResults().map(item => ({ 
        id: `rontgen-${item.id}`, 
        type: 'rontgen', 
        originalId: item.id, 
        date: item.date, 
        title: `${item.type || item.name || getSafeTranslation('radiologyTitle')}`, 
        details: `${getSafeTranslation('doctorLabel')}: ${item.doctor || item.doctorName || getSafeTranslation('noInfo')}. ${getSafeTranslation('statusLabel') || 'Durum'}: ${item.status || getSafeTranslation('completed')}.` 
    }));
    
    const combinedHistory = [...appointments, ...testResults, ...prescriptions, ...radiologyResults];
    combinedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    return combinedHistory;
}

function renderHealthHistory(items) {
    const historyListContainer = document.getElementById('healthHistoryList');
    if (!historyListContainer) return;
    
    historyListContainer.innerHTML = '';

    if (!items || items.length === 0) {
        historyListContainer.innerHTML = `<div class="card no-results-card"><p>${getSafeTranslation('noHealthHistoryFound')}</p></div>`;
        return;
    }
    
    const getIconForType = type => ({ 
        'randevu': 'fa-calendar-check', 
        'tahlil': 'fa-vial', 
        'recete': 'fa-file-prescription', 
        'rontgen': 'fa-x-ray' 
    }[type] || 'fa-notes-medical');

    const currentLang = localStorage.getItem('language') || 'tr';
    const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'health-history-item reveal'; // Added reveal
        const formattedDate = new Date(item.date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' });
        
        itemElement.innerHTML = `
            <div class="health-history-main">
                <div class="history-icon">
                    <i class="fas ${getIconForType(item.type)}"></i>
                </div>
                <div class="health-history-details">
                    <span class="history-date">${formattedDate}</span>
                    <h3>${item.title}</h3>
                    <p>${item.details}</p>
                </div>
            </div>
            <div class="health-history-actions">
                <button class="btn btn-sm btn-info" data-id="${item.id}">${getSafeTranslation('viewDetails')}</button>
            </div>
        `;
        historyListContainer.appendChild(itemElement);
    });

    // Re-init reveal animations
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

function applyFilters() {
    const allHistory = compileHealthHistory();
    const startDate = document.getElementById('filter-start-date').value;
    const endDate = document.getElementById('filter-end-date').value;
    const eventTypeRaw = document.getElementById('filter-event-type').value.toLowerCase();
    
    // Map translated dropdown value back to internal type
    const typeMap = {
        [getSafeTranslation('all').toLowerCase()]: 'all',
        [getSafeTranslation('appointmentTitle').toLowerCase()]: 'randevu',
        [getSafeTranslation('testTitle').toLowerCase()]: 'tahlil',
        [getSafeTranslation('prescriptionTitle').toLowerCase()]: 'recete',
        [getSafeTranslation('radiologyTitle').toLowerCase()]: 'rontgen'
    };
    
    const eventType = typeMap[eventTypeRaw] || 'all';

    const filteredHistory = allHistory.filter(item => {
        const itemDate = new Date(item.date);
        return (!startDate || itemDate >= new Date(startDate)) && 
               (!endDate || itemDate <= new Date(endDate)) && 
               (eventType === 'all' || item.type.toLowerCase() === eventType);
    });
    renderHealthHistory(filteredHistory);
}

// --- Detay Modal Pencereleri ---
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
    const currentLang = localStorage.getItem('language') || 'tr';
    const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

    let content = result.results?.map(res => `<div class="result-parameter-card ${isOutOfRange(res.value, res.range) ? 'out-of-range' : ''}"><div class="parameter-info"><span class="parameter-name">${res.parameter}</span><span class="parameter-range">${getSafeTranslation('referenceLabel')}: ${res.range} ${res.unit}</span></div><div class="parameter-value"><span class="value">${res.value}</span><span class="unit">${res.unit}</span>${isOutOfRange(res.value, res.range) ? `<i class="fas fa-exclamation-triangle range-indicator" title="${getSafeTranslation('outOfRangeWarning')}"></i>` : `<i class="fas fa-check-circle range-indicator" title="${getSafeTranslation('inRangeInfo')}"></i>`}</div></div>`).join('') || '';
    const html = `<div class="modern-results-container"><div class="modern-results-header"><h2>${result.testName || result.name}</h2><p><strong>${getSafeTranslation('dateLabel')}:</strong> ${new Date(result.resultDate || result.date).toLocaleDateString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric' })} | <strong>${getSafeTranslation('doctorLabel')}:</strong> ${result.doctorName || result.doctor}</p></div><div class="modern-results-body">${content}</div></div>`;
    Swal.fire({ html, showCloseButton: true, showConfirmButton: false, width: '800px', customClass: { popup: 'modern-swal-popup', htmlContainer: 'modern-swal-container' } });
}
function showPrescriptionDetails(p) {
    const currentLang = localStorage.getItem('language') || 'tr';
    const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';
    let meds = p.medications?.map(m => `<div class="result-parameter-card"><div class="parameter-info"><span class="parameter-name">${m.name}</span><span class="parameter-range">${getSafeTranslation('dosage') || 'Dozaj'}: ${m.dosage}</span></div><div class="parameter-value"><span class="unit" style="font-size: 1rem; text-align: right;">${m.instructions || ''}</span></div></div>`).join('') || '';
    const html = `<div class="modern-results-container"><div class="modern-results-header"><h2>${getSafeTranslation('prescriptionTitle')} ${getSafeTranslation('details')}</h2><p><strong>${getSafeTranslation('dateLabel')}:</strong> ${new Date(p.date).toLocaleDateString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric' })} | <strong>${getSafeTranslation('doctorLabel')}:</strong> ${p.doctorName}</p><p><strong>${getSafeTranslation('diagnosisLabel')}:</strong> ${p.diagnosis || p.notes}</p></div><div class="modern-results-body">${meds}</div></div>`;
    Swal.fire({ html, showCloseButton: true, showConfirmButton: false, width: '800px', customClass: { popup: 'modern-swal-popup', htmlContainer: 'modern-swal-container' } });
}
function showRadiologyDetails(r) {
    const currentLang = localStorage.getItem('language') || 'tr';
    const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';
    const html = `<div class="modern-results-container">
        <div class="modern-results-header">
            <h2>${r.type || r.name}</h2>
            <p><strong>${getSafeTranslation('dateLabel')}:</strong> ${new Date(r.date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })} | <strong>${getSafeTranslation('doctorLabel')}:</strong> ${r.doctorName || r.doctor}</p>
        </div>
        <div class="modern-results-body">
            <div class="result-report-card">
                <h4 style="color: var(--primary-color); display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <i class="fas fa-microscope"></i> ${getSafeTranslation('technique')}
                </h4>
                <p style="margin-bottom: 20px;">${r.details?.technique || getSafeTranslation('noInfo')}</p>
                
                <h4 style="color: var(--primary-color); display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <i class="fas fa-search"></i> ${getSafeTranslation('findings')}
                </h4>
                <p style="margin-bottom: 20px;">${r.details?.findings || getSafeTranslation('noInfo')}</p>
                
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                
                <h4 style="color: var(--primary-color); display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <i class="fas fa-clipboard-check"></i> ${getSafeTranslation('resultComment')}
                </h4>
                <p style="font-weight: 500; color: #333;">${r.details?.impression || getSafeTranslation('noInfo')}</p>
            </div>
        </div>
    </div>`;
    Swal.fire({ html, showCloseButton: true, showConfirmButton: false, width: '800px', customClass: { popup: 'modern-swal-popup', htmlContainer: 'modern-swal-container' } });
}
function showGenericDetails(item) {
    const currentLang = localStorage.getItem('language') || 'tr';
    const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';
    const date = new Date(item.date).toLocaleDateString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric' });
    
    const getIconForType = type => ({ 
        'randevu': 'fa-calendar-check', 
        'tahlil': 'fa-vial', 
        'recete': 'fa-file-prescription', 
        'rontgen': 'fa-x-ray' 
    }[type] || 'fa-notes-medical');

    const html = `
        <div class="modern-results-container">
            <div class="modern-results-header">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="fas ${getIconForType(item.type)}" style="font-size: 1.2rem;"></i>
                    </div>
                    <div>
                        <h2 style="margin: 0; font-size: 1.3rem;">${item.title}</h2>
                        <p style="margin: 0; opacity: 0.9;">${date}</p>
                    </div>
                </div>
            </div>
            <div class="modern-results-body">
                <div class="result-report-card">
                    <h4 style="color: var(--primary-color); margin-bottom: 10px;">${getSafeTranslation('details')}</h4>
                    <p style="line-height: 1.6; color: #333;">${item.details}</p>
                </div>
            </div>
        </div>
    `;
    
    Swal.fire({
        html: html,
        showCloseButton: true,
        showConfirmButton: false,
        width: '600px',
        customClass: {
            popup: 'modern-swal-popup',
            htmlContainer: 'modern-swal-container'
        }
    });
}

// --- Sayfa Yüklendiğinde Çalışacak Kodlar ---
document.addEventListener('DOMContentLoaded', function() {
    setupHeader();
    const historyListContainer = document.getElementById('healthHistoryList');
    if (historyListContainer) {
        historyListContainer.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-id]');
            if (!button) return;
            const [type, originalId] = button.dataset.id.split(/-(.+)/);
            switch(type) {
                case 'tahlil': showTestResultDetails(getLuminexTestResults().find(r => r.id === originalId)); break;
                case 'recete': showPrescriptionDetails(getLuminexPrescriptions().find(p => p.id === originalId)); break;
                case 'rontgen': showRadiologyDetails(getLuminexRadiologyResults().find(r => r.id === originalId)); break;
                default: showGenericDetails(compileHealthHistory().find(item => item.id === button.dataset.id)); break;
            }
        });
    }
    const eventTypeInput = document.getElementById('filter-event-type');
    const eventTypePanel = document.getElementById('eventTypePanel');
    const eventTypes = [
        { id: 'all', name: getSafeTranslation('all') }, 
        { id: 'randevu', name: getSafeTranslation('appointmentTitle') }, 
        { id: 'tahlil', name: getSafeTranslation('testTitle') }, 
        { id: 'recete', name: getSafeTranslation('prescriptionTitle') }, 
        { id: 'rontgen', name: getSafeTranslation('radiologyTitle') }
    ];
    if (eventTypeInput && eventTypePanel) {
        setupCustomDropdown({ 
            input: eventTypeInput, 
            panel: eventTypePanel, 
            items: eventTypes, 
            onSelect: item => { 
                eventTypeInput.value = item ? (item.name) : getSafeTranslation('all'); 
                applyFilters(); 
            } 
        });
    }
    ['filter-start-date', 'filter-end-date'].forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', () => {
        document.getElementById('filter-start-date').value = '';
        document.getElementById('filter-end-date').value = '';
        eventTypeInput.value = getSafeTranslation('all');
        applyFilters();
    });
    const filterCardHeader = document.querySelector('.filter-card-header');
    if (filterCardHeader) {
        const filterCard = filterCardHeader.closest('.filter-card');
        filterCardHeader.addEventListener('click', () => {
            filterCard.classList.toggle('collapsed');
        });
    }
    applyFilters(); 
});