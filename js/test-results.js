import { setupHeader } from './utils/header-manager.js';
import { getActiveProfile, getLuminexTestResults, setLuminexTestResults } from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', async function() {
    // --- Auto-Repair Data Logic ---
    const currentResults = getLuminexTestResults();
    const hasEmptyResults = currentResults.some(r => !r.results || r.results.length === 0);

    if (hasEmptyResults) {
        try {
            const module = await import('./utils/data.js');
            const freshData = module.initialLuminexTestResults;
            
            let updatedCount = 0;
            const fixedResults = currentResults.map(r => {
                if (!r.results || r.results.length === 0) {
                    const match = freshData.find(f => f.id === r.id);
                    if (match && match.results && match.results.length > 0) {
                        updatedCount++;
                        return { ...r, results: match.results }; // Inject missing results
                    }
                }
                return r;
            });

            if (updatedCount > 0) {
                setLuminexTestResults(fixedResults);
                console.log(`Auto-repaired ${updatedCount} test results with missing data.`);
            }
        } catch (e) {
            console.error("Failed to auto-repair test data:", e);
        }
    }
    
    setupHeader();

    const elements = {
        testResultsListContainer: document.getElementById('testResultsList'),
        toggleFilterBtn: document.getElementById('toggle-filter-body'),
        filterCardHeader: document.querySelector('.filter-card-header'),
        filterCardBody: document.getElementById('filter-card-body'),
        startDateInput: document.getElementById('filter-start-date'),
        endDateInput: document.getElementById('filter-end-date'),
        testNameInput: document.getElementById('filter-test-name'),
        outOfRangeCheckbox: document.getElementById('filter-out-of-range'), // New checkbox
        applyFiltersBtn: document.getElementById('applyFilters'),
        clearFiltersBtn: document.getElementById('clearFilters'),
        activeFiltersContainer: document.getElementById('active-filters-container'),
    };

    const isOutOfRange = (value, range) => {
        if (typeof value !== 'string' || !range || range.trim() === '' || (['<', '>'].every(c => !range.includes(c)) && !range.includes('-'))) {
            return false;
        }
        const numericValue = parseFloat(value.replace(',', '.'));
        if (isNaN(numericValue)) return false;

        const rangeParts = range.replace(',', '.').split('-').map(p => p.trim());
        if (range.startsWith('<')) {
            const limit = parseFloat(range.substring(1).trim());
            return numericValue >= limit;
        }
        if (range.startsWith('>')) {
            const limit = parseFloat(range.substring(1).trim());
            return numericValue <= limit;
        }
        if (rangeParts.length === 2) {
            const [min, max] = rangeParts.map(parseFloat);
            return numericValue < min || numericValue > max;
        }
        return false;
    };

    if (!elements.testResultsListContainer) {
        console.error("test-results.js: A required element was not found!");
        return;
    }

    function getSafeTranslation(key) {
        return window.getTranslation ? window.getTranslation(key) : key;
    }

    function renderTestResults(results) {
        elements.testResultsListContainer.innerHTML = '';
        if (results.length === 0) {
            elements.testResultsListContainer.innerHTML = `
                <div class="card no-results-card">
                    <i class="fas fa-search"></i>
                    <p>${getSafeTranslation('noResultsFound')}</p>
                    <span>${getSafeTranslation('tryChangingFilters')}</span>
                </div>`;
            return;
        }

        results.sort((a, b) => new Date(b.resultDate) - new Date(a.resultDate));

        const currentLang = localStorage.getItem('language') || 'tr';
        const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.classList.add('test-result-item');
            
            const displayDate = new Date(result.resultDate).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' });

            // Determine if any parameter is out of range
            const hasOutOfRange = result.results && result.results.some(res => isOutOfRange(res.value, res.reference || res.range));

            // Determine status class
            let statusClass = 'badge-warning'; // Default to pending/warning
            const status = result.status || 'Sonuç Bekleniyor';
            
            if (status === 'Sonuç Çıktı' || status === 'Raporlandı' || status === 'Tamamlandı') {
                statusClass = 'badge-success';
            } else if (status === 'İptal Edildi') {
                statusClass = 'badge-danger';
            }

            const outOfRangeLabel = hasOutOfRange ? `<span style="color: #dc3545; font-size: 0.8rem; font-weight: 600; margin-left: 10px;">${getSafeTranslation('outOfRangeValuesPresent')}</span>` : '';

            resultItem.innerHTML = `
                <div class="test-icon ${hasOutOfRange ? 'text-danger' : ''}">
                    <i class="fas ${hasOutOfRange ? 'fa-exclamation-triangle' : 'fa-vial'}"></i>
                </div>
                <div class="test-details">
                    <h3>${result.testName} ${outOfRangeLabel}</h3>
                    <p>${getSafeTranslation('dateLabel')}: ${displayDate} | ${getSafeTranslation('doctorLabel')}: ${result.doctorName}</p>
                    <p><span class="badge ${statusClass}">${status}</span></p>
                </div>
                <div class="test-actions">
                    <button class="btn btn-sm btn-info" data-action="view-details" data-id="${result.id}" ${result.status !== 'Sonuç Çıktı' ? 'disabled' : ''}>${getSafeTranslation('viewDetails')}</button>
                    <button class="btn btn-sm btn-primary" data-action="download-pdf" data-id="${result.id}" ${result.status !== 'Sonuç Çıktı' ? 'disabled' : ''}>${getSafeTranslation('downloadPdf')}</button>
                </div>
            `;
            elements.testResultsListContainer.appendChild(resultItem);
        });
    }

    function loadTestResults() {
        const activeProfile = getActiveProfile(); // Get active user profile
        if (!activeProfile) {
            elements.testResultsListContainer.innerHTML = `<p>${getSafeTranslation('loginToSeeResults')}</p>`;
            return;
        }

        const allTestResults = getLuminexTestResults();
        let userTestResults = allTestResults; 

        const filters = {
            startDate: elements.startDateInput.value,
            endDate: elements.endDateInput.value,
            testName: elements.testNameInput.value.toLowerCase(),
            outOfRangeOnly: elements.outOfRangeCheckbox ? elements.outOfRangeCheckbox.checked : false
        };

        let filteredResults = userTestResults; 
        if (filters.startDate) filteredResults = filteredResults.filter(r => r.resultDate >= filters.startDate);
        if (filters.endDate) filteredResults = filteredResults.filter(r => r.resultDate <= filters.endDate);
        if (filters.testName) filteredResults = filteredResults.filter(r => r.testName.toLowerCase().includes(filters.testName));
        
        // Apply Out of Range Filter
        if (filters.outOfRangeOnly) {
            filteredResults = filteredResults.filter(result => 
                result.results && result.results.some(res => isOutOfRange(res.value, res.reference || res.range))
            );
        }

        renderTestResults(filteredResults);
        updateActiveFilterPills(filters);
    }

    function updateActiveFilterPills(filters) {
        elements.activeFiltersContainer.innerHTML = '';
        let hasFilters = false;

        if (filters.startDate) {
            hasFilters = true;
            createPill(`${getSafeTranslation('startDate')}: ${filters.startDate}`, 'startDate');
        }
        if (filters.endDate) {
            hasFilters = true;
            createPill(`${getSafeTranslation('endDate')}: ${filters.endDate}`, 'endDate');
        }
        if (filters.testName) {
            hasFilters = true;
            createPill(`${getSafeTranslation('testName')}: "${filters.testName}"`, 'testName');
        }
        if (filters.outOfRangeOnly) {
            hasFilters = true;
            createPill(getSafeTranslation('outOfRangeOnly'), 'outOfRange');
        }
        
        elements.activeFiltersContainer.style.display = hasFilters ? 'flex' : 'none';
    }

    function createPill(text, key) {
        const pill = document.createElement('div');
        pill.className = 'filter-pill';
        pill.innerHTML = `<span>${text}</span><span class="remove-pill" data-filter-key="${key}">&times;</span>`;
        elements.activeFiltersContainer.appendChild(pill);
    }
    
    if (elements.filterCardHeader) {
        const filterCard = elements.filterCardHeader.closest('.filter-card');
        elements.filterCardHeader.addEventListener('click', () => {
            filterCard.classList.toggle('collapsed');
        });
    }
    
    if (elements.applyFiltersBtn) {
        elements.applyFiltersBtn.addEventListener('click', loadTestResults);
    }

    if (elements.clearFiltersBtn) {
        elements.clearFiltersBtn.addEventListener('click', () => {
            elements.startDateInput.value = '';
            elements.endDateInput.value = '';
            elements.testNameInput.value = '';
            if (elements.outOfRangeCheckbox) elements.outOfRangeCheckbox.checked = false;
            loadTestResults();
        });
    }
    
    elements.activeFiltersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-pill')) {
            const keyToRemove = e.target.dataset.filterKey;
            if (keyToRemove === 'outOfRange') {
                if (elements.outOfRangeCheckbox) elements.outOfRangeCheckbox.checked = false;
            } else if (elements[`${keyToRemove}Input`]) {
                elements[`${keyToRemove}Input`].value = '';
            }
            loadTestResults();
        }
    });

    [elements.startDateInput, elements.endDateInput, elements.testNameInput, elements.outOfRangeCheckbox].forEach(input => {
        if (input) {
            input.addEventListener('input', loadTestResults);
        }
    });

    if (elements.testResultsListContainer) {
        elements.testResultsListContainer.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-action]');
            if (!button || button.disabled) return;

            const action = button.getAttribute('data-action');
            const resultId = button.getAttribute('data-id');
            const allTestResults = getLuminexTestResults();
            const result = allTestResults.find(r => r.id === resultId);
            if (!result) return;

            if (action === 'view-details') {
                const currentLang = localStorage.getItem('language') || 'tr';
                const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

                let resultsHtml = `
                    <div class="modern-results-container">
                        <div class="modern-results-header">
                            <h2>${result.testName || result.name}</h2>
                            <p><strong>${getSafeTranslation('dateLabel')}:</strong> ${new Date(result.resultDate).toLocaleDateString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric' })} | <strong>${getSafeTranslation('doctorLabel')}:</strong> ${result.doctorName}</p>
                        </div>
                        <div class="modern-results-body">
                `;

                if (result.results.length > 0 && result.results[0].parameter === 'Bulgular') {
                    // Radyoloji gibi metin tabanlı sonuçlar için özel görünüm
                    resultsHtml += `
                        <div class="result-report-card">
                            <h4>${result.results[0].parameter}</h4>
                            <p>${result.results[0].value}</p>
                        </div>
                    `;
                } else {
                    // Parametreli sonuçlar için kart görünümü
                    result.results.forEach(res => {
                        const refRange = res.reference || res.range || '';
                        const outOfRange = isOutOfRange(res.value, refRange);
                        
                        resultsHtml += `
                            <div class="result-parameter-card ${outOfRange ? 'out-of-range' : ''}">
                                <div class="parameter-info">
                                    <span class="parameter-name">${res.parameter}</span>
                                    <span class="parameter-range">${getSafeTranslation('referenceLabel')}: ${refRange} ${res.unit || ''}</span>
                                </div>
                                <div class="parameter-value">
                                    <span class="value">${res.value}</span>
                                    <span class="unit">${res.unit || ''}</span>
                                    ${outOfRange ? `<i class="fas fa-exclamation-triangle range-indicator" title="${getSafeTranslation('outOfRangeWarning')}"></i>` : `<i class="fas fa-check-circle range-indicator" title="${getSafeTranslation('inRangeInfo')}"></i>`}
                                </div>
                            </div>
                        `;
                    });
                }

                resultsHtml += '</div></div>';

                Swal.fire({
                    html: resultsHtml,
                    showCloseButton: true,
                    showConfirmButton: false,
                    width: '800px',
                    customClass: {
                        popup: 'modern-swal-popup',
                        htmlContainer: 'modern-swal-container'
                    }
                });
            } else if (action === 'download-pdf') {
                Swal.fire({
                    title: getSafeTranslation('confirmTitle'),
                    text: getSafeTranslation('openReportInNewTab'),
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: getSafeTranslation('yesOpen'),
                    cancelButtonText: getSafeTranslation('cancel')
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.open(`lab-report-template.html?id=${resultId}`, '_blank');
                    }
                });
            }
        });
    }
    
    loadTestResults();
});