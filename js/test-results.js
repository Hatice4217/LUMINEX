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

            // Add status class for left border
            resultItem.className = `test-result-item ${hasOutOfRange ? 'status-warning' : 'status-normal'}`;

            // Determine status class
            let statusClass = 'badge-warning'; // Default to pending/warning
            const status = result.status || 'Sonuç Bekleniyor';
            const isCompleted = ['Sonuç Çıktı', 'Raporlandı', 'Tamamlandı'].includes(status);
            
            if (isCompleted) {
                statusClass = 'badge-success';
            } else if (status === 'İptal Edildi') {
                statusClass = 'badge-danger';
            }

            const outOfRangeLabel = hasOutOfRange ? `<span class="badge-warning-custom"><i class="fas fa-exclamation-triangle"></i> ${getSafeTranslation('outOfRangeValuesPresent')}</span>` : '';

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
                    <button class="btn btn-sm btn-outline-primary" data-action="view-details" data-id="${result.id}" ${!isCompleted ? 'disabled' : ''}>
                        <i class="fas fa-eye"></i> ${getSafeTranslation('viewDetails')}
                    </button>
                    <button class="btn btn-sm btn-outline-primary" data-action="download-pdf" data-id="${result.id}" ${!isCompleted ? 'disabled' : ''}>
                        <i class="fas fa-file-pdf"></i> ${getSafeTranslation('downloadPdf')}
                    </button>
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
        elements.clearFiltersBtn.style.color = '#fff';
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

                // Check for out of range values to determine header style
                const hasOutOfRange = result.results && result.results.some(res => isOutOfRange(res.value, res.reference || res.range));
                
                // Badge configuration
                const badgeStyle = hasOutOfRange 
                    ? 'background-color: #dc3545; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;' 
                    : 'background-color: #28a745; color: white; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;';
                
                const badgeIcon = hasOutOfRange ? 'fa-exclamation-triangle' : 'fa-check-circle';
                const badgeText = hasOutOfRange ? getSafeTranslation('outOfRangeWarning') : getSafeTranslation('inRangeInfo');

                let resultsHtml = `
                    <div class="modern-results-container" style="font-family: 'Poppins', sans-serif; text-align: left;">
                        <div class="modern-results-header-clean" style="padding-bottom: 15px;">
                            <div class="header-top-row" style="display: flex; flex-direction: column; align-items: flex-start; gap: 10px; margin-bottom: 20px;">
                                <h2 class="result-title" style="margin: 0; font-size: 1.6rem; color: #001F6B; font-weight: 700;">${result.testName || result.name}</h2>
                                <div style="${badgeStyle}">
                                    <i class="fas ${badgeIcon}"></i>
                                    <span>${badgeText}</span>
                                </div>
                            </div>
                            
                            <div class="info-bar" style="background-color: #f8f9fa; padding: 15px; border-radius: 10px; display: flex; gap: 25px; align-items: center; border: 1px solid #e9ecef;">
                                <div class="info-item" style="display: flex; align-items: center; gap: 8px; color: #495057;">
                                    <i class="far fa-calendar-alt" style="color: #001F6B;"></i>
                                    <span style="font-size: 0.9rem; font-weight: 500;">${getSafeTranslation('dateLabel')}:</span>
                                    <strong style="color: #212529;">${new Date(result.resultDate).toLocaleDateString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                                </div>
                                <div class="info-item" style="display: flex; align-items: center; gap: 8px; color: #495057;">
                                    <i class="fas fa-user-md" style="color: #001F6B;"></i>
                                    <span style="font-size: 0.9rem; font-weight: 500;">${getSafeTranslation('doctorLabel')}:</span>
                                    <strong style="color: #212529;">${result.doctorName}</strong>
                                </div>
                            </div>
                        </div>
                        
                        <div class="modern-results-body" style="padding: 10px 0;">
                            <div class="result-list-container">
                `;

                if (result.results.length > 0 && result.results[0].parameter === 'Bulgular') {
                    // Radyoloji gibi metin tabanlı sonuçlar için özel görünüm
                    resultsHtml += `
                        <div class="result-report-card" style="background: #fff; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
                            <h4 style="color: #001F6B; margin-bottom: 10px;">${result.results[0].parameter}</h4>
                            <p style="color: #333; line-height: 1.6;">${result.results[0].value}</p>
                        </div>
                    `;
                } else {
                    // Parametreli sonuçlar için kart görünümü
                    result.results.forEach(res => {
                        const refRange = res.reference || res.range || '';
                        const outOfRange = isOutOfRange(res.value, refRange);
                        
                        // Styles for result value
                        const valueStyle = outOfRange 
                            ? 'font-size: 1.5rem; font-weight: 800; color: #dc3545;' 
                            : 'font-size: 1.5rem; font-weight: 700; color: #2c3e50;';
                        
                        resultsHtml += `
                            <div class="result-row-premium" style="display: flex; justify-content: space-between; align-items: center; padding: 18px 10px; border-bottom: 1px solid #f1f1f1;">
                                <div class="result-info-left">
                                    <div class="parameter-name" style="font-weight: 600; color: #333; font-size: 1.1rem; margin-bottom: 4px;">${res.parameter}</div>
                                    <div class="reference-range" style="font-size: 0.85rem; color: #adb5bd;">${getSafeTranslation('referenceLabel')}: ${refRange}</div>
                                </div>
                                <div class="result-value-right" style="text-align: right;">
                                    <div class="value-display" style="${valueStyle}">
                                        ${res.value} <span style="font-size: 1rem; font-weight: 500; color: #888; margin-left: 4px;">${res.unit || ''}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                }

                resultsHtml += `
                            </div>
                        </div>
                        <div class="modern-results-footer" style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee;">
                            <button class="btn" onclick="Swal.close()" style="background-color: #6c757d; color: #fff; border: 1px solid #6c757d; padding: 12px 24px; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s;">
                                ${getSafeTranslation('close')}
                            </button>
                            <button class="btn" onclick="window.print()" style="background-color: #001F6B; color: #fff; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0, 31, 107, 0.2);">
                                <i class="fas fa-print"></i> ${getSafeTranslation('print') || 'Yazdır'}
                            </button>
                        </div>
                    </div>
                `;

                Swal.fire({
                    html: resultsHtml,
                    showCloseButton: true,
                    showConfirmButton: false,
                    width: '750px',
                    padding: '0',
                    customClass: {
                        popup: 'modern-swal-popup',
                        htmlContainer: 'modern-swal-container'
                    },
                    didOpen: () => {
                        // Add hover effects for buttons via JS since inline styles don't support pseudo-classes easily
                        const btns = Swal.getHtmlContainer().querySelectorAll('.btn');
                        btns.forEach(btn => {
                            btn.addEventListener('mouseenter', () => {
                                btn.style.transform = 'translateY(-2px)';
                                if(btn.innerText.includes(getSafeTranslation('print'))) {
                                    btn.style.boxShadow = '0 6px 16px rgba(0, 31, 107, 0.3)';
                                }
                            });
                            btn.addEventListener('mouseleave', () => {
                                btn.style.transform = 'translateY(0)';
                                if(btn.innerText.includes(getSafeTranslation('print'))) {
                                    btn.style.boxShadow = '0 4px 12px rgba(0, 31, 107, 0.2)';
                                }
                            });
                        });
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