import { setupHeader } from './utils/header-manager.js';
import { getLuminexRadiologyResults, getActiveProfile } from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const elements = {
        radiologyResultsListContainer: document.getElementById('radiologyResultsList'),
        toggleFilterBtn: document.getElementById('toggle-filter-body'),
        filterCardHeader: document.querySelector('.filter-card-header'),
        filterCardBody: document.getElementById('filter-card-body'),
        startDateInput: document.getElementById('filter-start-date'),
        endDateInput: document.getElementById('filter-end-date'),
        typeInput: document.getElementById('filter-type'), // Changed from testNameInput
        applyFiltersBtn: document.getElementById('applyFilters'),
        clearFiltersBtn: document.getElementById('clearFilters'),
        activeFiltersContainer: document.getElementById('active-filters-container'),
    };

    if (!elements.radiologyResultsListContainer) {
        console.error("radiology-results.js: A required element was not found!");
        return;
    }

    function getSafeTranslation(key) {
        return window.getTranslation ? window.getTranslation(key) : key;
    }

    function renderRadiologyResults(results) {
        elements.radiologyResultsListContainer.innerHTML = '';
        if (results.length === 0) {
            elements.radiologyResultsListContainer.innerHTML = `
                <div class="card no-results-card">
                    <i class="fas fa-search"></i>
                    <p>${getSafeTranslation('noResultsFound')}</p>
                    <span>${getSafeTranslation('tryChangingFilters')}</span>
                </div>`;
            return;
        }
        results.sort((a, b) => new Date(b.date) - new Date(a.date));

        const currentLang = localStorage.getItem('language') || 'tr';
        const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

        results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.classList.add('test-result-item');
            const statusClass = result.status === 'Raporlandı' ? 'badge-success' : 'badge-warning';
            const displayDate = new Date(result.date).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' });
            resultItem.innerHTML = `
                <div class="test-icon"><i class="fas fa-x-ray"></i></div>
                <div class="test-details">
                    <h3>${result.type}</h3>
                    <p>${getSafeTranslation('dateLabel')}: ${displayDate} | ${getSafeTranslation('doctorLabel')}: ${result.doctorName}</p>
                    <p><span class="badge ${statusClass}">${result.status || getSafeTranslation('waiting')}</span></p>
                </div>
                <div class="test-actions">
                    <button class="btn btn-sm btn-info" data-action="view-details" data-id="${result.id}" ${result.status !== 'Raporlandı' ? 'disabled' : ''}>${getSafeTranslation('viewReport')}</button>
                    <button class="btn btn-sm btn-primary" data-action="view-images" data-id="${result.id}" ${result.status !== 'Raporlandı' ? 'disabled' : ''}>${getSafeTranslation('openImages')}</button>
                </div>
            `;
            elements.radiologyResultsListContainer.appendChild(resultItem);
        });
    }

    function loadRadiologyResults() {
        const activeProfile = getActiveProfile(); // Get active user profile
        if (!activeProfile) {
            elements.radiologyResultsListContainer.innerHTML = `<p>${getSafeTranslation('loginToSeeResults')}</p>`;
            return;
        }

        const allResults = getLuminexRadiologyResults();
        let userResults = allResults; // Show all radiology results

        const filters = {
            startDate: elements.startDateInput.value,
            endDate: elements.endDateInput.value,
            type: elements.typeInput.value.toLowerCase(), // Updated
        };
        let filteredResults = userResults;
        if (filters.startDate) filteredResults = filteredResults.filter(r => r.date >= filters.startDate);
        if (filters.endDate) filteredResults = filteredResults.filter(r => r.date <= filters.endDate);
        if (filters.type) filteredResults = filteredResults.filter(r => r.type.toLowerCase().includes(filters.type)); // Updated
        renderRadiologyResults(filteredResults);
        updateActiveFilterPills(filters);
    }

    function showRadiologyReport(result) {
        const currentLang = localStorage.getItem('language') || 'tr';
        const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

        const fullHtml = `
            <div class="modern-results-container">
                <div class="modern-results-header">
                    <h2>${result.type}</h2>
                    <p><strong>${getSafeTranslation('dateLabel')}:</strong> ${new Date(result.date).toLocaleDateString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric' })} | <strong>${getSafeTranslation('doctorLabel')}:</strong> ${result.doctorName}</p>
                </div>
                <div class="modern-results-body">
                    <div class="result-report-card">
                        <h4>${getSafeTranslation('technique')}</h4>
                        <p>${result.details.technique || getSafeTranslation('noInfo')}</p>
                        <h4>${getSafeTranslation('findings')}</h4>
                        <p>${result.details.findings || getSafeTranslation('noInfo')}</p>
                        <hr>
                        <h4>${getSafeTranslation('resultComment')}</h4>
                        <p><strong>${result.details.impression || getSafeTranslation('noInfo')}</strong></p>
                    </div>
                </div>
            </div>
        `;
        Swal.fire({
            html: fullHtml,
            showCloseButton: true,
            showConfirmButton: false,
            width: '800px',
            customClass: { popup: 'modern-swal-popup', htmlContainer: 'modern-swal-container' }
        });
    }

    function showRadiologyImage(result) {
        const safeName = (result && typeof result.type === 'string' && result.type) ? result.type : getSafeTranslation('unknownTetkik') || 'Bilinmeyen Tetkik';
        const lowerCaseName = safeName.toLowerCase();
        
        let svgContent = '';
        let title = '';

        // Common Filters
        const commonDefs = `
            <defs>
                <filter id="medicalNoise">
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
                    <feColorMatrix type="saturate" values="0"/>
                    <feComponentTransfer><feFuncA type="linear" slope="0.1"/></feComponentTransfer>
                </filter>
                <filter id="boneGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur"/>
                    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                </filter>
            </defs>
        `;

        // Professional Footer
        const overlayFooter = `
            <rect x="0" y="550" width="500" height="50" fill="#000" opacity="0.8"/>
            <text x="20" y="570" fill="#00ff00" font-family="monospace" font-size="12">LUMINEX MEDICAL IMAGING SYSTEM v4.2</text>
            <text x="20" y="585" fill="#ccc" font-family="monospace" font-size="10">PATIENT ID: ${Math.floor(Math.random()*1000000)} | ${new Date().toISOString().split('T')[0]}</text>
            <text x="350" y="580" fill="#fff" font-family="monospace" font-size="14" font-weight="bold">CONFIDENTIAL</text>
        `;

        // 1. MR (Manyetik Rezonans)
        if (lowerCaseName.includes('mr') || lowerCaseName.includes('emar') || lowerCaseName.includes('rezonans')) {
            title = 'MR Görüntüleme (Manyetik Rezonans)';
            svgContent = `
                <svg xmlns="http://www.w3.org/2000/svg" width="500" height="600" viewBox="0 0 500 600" style="background:#000;">
                    ${commonDefs}
                    <rect width="100%" height="100%" filter="url(#medicalNoise)" opacity="0.3"/>
                    <g transform="translate(250, 300) scale(1.8)">
                        <path d="M0,-100 C50,-100 90,-60 90,0 C90,70 50,110 0,110 C-50,110 -90,70 -90,0 C-90,-60 -50,-100 0,-100" fill="none" stroke="#444" stroke-width="8"/>
                        <path d="M0,-95 C45,-95 85,-55 85,0 C85,65 45,105 0,105 C-45,105 -85,65 -85,0 C-85,-55 -45,-95 0,-95" fill="#1a1a1a" stroke="#888" stroke-width="2"/>
                        <g fill="#666" opacity="0.8" filter="url(#boneGlow)">
                            <path d="M-20,-80 Q-60,-40 -50,0 Q-60,50 -20,80 Q0,40 0,-80" fill="#333"/>
                            <path d="M20,-80 Q60,-40 50,0 Q60,50 20,80 Q0,40 0,-80" fill="#333"/>
                            <path d="M-10,-20 L-5,10 L0,-20 L5,10 L10,-20" stroke="#000" stroke-width="3" fill="none"/>
                        </g>
                    </g>
                    <text x="20" y="30" fill="#fff" font-family="Arial" font-size="14">SEQ: T2_FLAIR</text>
                    ${overlayFooter}
                </svg>
            `;
        } 
        // 2. BT (Bilgisayarlı Tomografi)
        else if (lowerCaseName.includes('bt') || lowerCaseName.includes('tomografi') || lowerCaseName.includes('ct')) {
            title = 'Bilgisayarlı Tomografi (BT)';
            // BT looks like MR but bones (skull) are very bright white
            svgContent = `
                <svg xmlns="http://www.w3.org/2000/svg" width="500" height="600" viewBox="0 0 500 600" style="background:#000;">
                    ${commonDefs}
                    <rect width="100%" height="100%" filter="url(#medicalNoise)" opacity="0.2"/>
                    <g transform="translate(250, 300) scale(1.7)">
                        <!-- Skull Bone (Bright White) -->
                        <path d="M0,-105 C55,-105 95,-65 95,0 C95,75 55,115 0,115 C-55,115 -95,75 -95,0 C-95,-65 -55,-105 0,-105" 
                              fill="none" stroke="#fff" stroke-width="12" filter="url(#boneGlow)"/>
                        
                        <!-- Brain Tissue (Grey) -->
                        <path d="M0,-95 C45,-95 85,-55 85,0 C85,65 45,105 0,105 C-45,105 -85,65 -85,0 C-85,-55 -45,-95 0,-95" 
                              fill="#333" stroke="none"/>
                        
                        <!-- Ventricles (Dark) -->
                        <path d="M-15,-10 Q0,-30 15,-10 Q0,20 -15,-10" fill="#000"/>
                    </g>
                    <text x="20" y="30" fill="#fff" font-family="Arial" font-size="14">AXIAL CT HEAD</text>
                    ${overlayFooter}
                </svg>
            `;
        }
        // 3. Röntgen (X-Ray)
        else if (lowerCaseName.includes('röntgen') || lowerCaseName.includes('grafi') || lowerCaseName.includes('x-ray') || lowerCaseName.includes('direkt')) {
            title = 'Dijital Radyografi (X-Ray)';
            svgContent = `
                <svg xmlns="http://www.w3.org/2000/svg" width="500" height="600" viewBox="0 0 500 600" style="background:#050505;">
                    ${commonDefs}
                    <!-- Spine -->
                    <g stroke="#e0e0e0" stroke-width="15" stroke-linecap="round" opacity="0.7" filter="url(#boneGlow)">
                        <line x1="250" y1="50" x2="250" y2="500" stroke-dasharray="20,5"/>
                    </g>
                    <!-- Ribs -->
                    <g stroke="#ccc" stroke-width="12" fill="none" opacity="0.6" filter="url(#boneGlow)">
                        <path d="M250,100 Q150,120 100,200" /> <path d="M250,150 Q140,170 90,250" />
                        <path d="M250,100 Q350,120 400,200" /> <path d="M250,150 Q360,170 410,250" />
                    </g>
                    <!-- Lungs -->
                    <path d="M230,120 Q150,150 130,350 Q180,400 230,350 Z" fill="#000" opacity="0.4" filter="url(#boneGlow)"/>
                    <path d="M270,120 Q350,150 370,350 Q320,400 270,350 Z" fill="#000" opacity="0.4" filter="url(#boneGlow)"/>
                    <text x="450" y="50" fill="#fff" font-family="Arial" font-size="24" font-weight="bold">L</text>
                    ${overlayFooter}
                </svg>
            `;
        }
        // 4. Ultrason (USG)
        else if (lowerCaseName.includes('usg') || lowerCaseName.includes('ultrason') || lowerCaseName.includes('doppler') || lowerCaseName.includes('eko')) {
            title = 'Ultrasonografi (USG)';
            svgContent = `
                <svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450" style="background:#000;">
                    ${commonDefs}
                    <defs><clipPath id="sectorClip"><path d="M300,50 L550,400 L50,400 Z" /></clipPath></defs>
                    <path d="M300,50 L550,400 Q300,450 50,400 Z" fill="#111"/>
                    <rect x="0" y="0" width="600" height="450" filter="url(#medicalNoise)" opacity="0.5" clip-path="url(#sectorClip)"/>
                    <g clip-path="url(#sectorClip)" filter="url(#boneGlow)" opacity="0.7">
                        <ellipse cx="300" cy="250" rx="80" ry="40" fill="#333"/>
                        <ellipse cx="350" cy="280" rx="50" ry="20" fill="#555"/>
                    </g>
                    <text x="20" y="30" fill="#fff" font-family="Arial" font-size="14">PROBE: C5-1</text>
                    ${overlayFooter}
                </svg>
            `;
        }
        // 5. Varsayılan (Genel)
        else {
            title = 'Tıbbi Görüntüleme';
            svgContent = `
                <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500" style="background:#111;">
                    ${commonDefs}
                    <rect width="100%" height="100%" filter="url(#medicalNoise)" opacity="0.4"/>
                    <circle cx="250" cy="250" r="150" fill="none" stroke="#333" stroke-width="20" filter="url(#boneGlow)"/>
                    <circle cx="250" cy="250" r="100" fill="none" stroke="#555" stroke-width="10"/>
                    <line x1="250" y1="50" x2="250" y2="450" stroke="#444" stroke-width="2"/>
                    <line x1="50" y1="250" x2="450" y2="250" stroke="#444" stroke-width="2"/>
                    <text x="20" y="30" fill="#fff" font-family="Arial" font-size="14">GENERIC SCAN</text>
                    ${overlayFooter}
                </svg>
            `;
        }
        
        let imageUrl = 'data:image/svg+xml,' + encodeURIComponent(svgContent);
        
        Swal.fire({
            title: title, 
            imageUrl: imageUrl, 
            imageWidth: 'auto', 
            imageHeight: 'auto', 
            imageAlt: safeName, 
            confirmButtonText: getSafeTranslation('close'),
            width: '650px',
            background: '#1a1a1a',
            color: '#fff'
        });
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
        if (filters.type) { 
            hasFilters = true;
            createPill(`${getSafeTranslation('imagingType')}: "${filters.type}"`, 'type');
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

    if (elements.applyFiltersBtn) elements.applyFiltersBtn.addEventListener('click', loadRadiologyResults);
    if (elements.clearFiltersBtn) {
        elements.clearFiltersBtn.addEventListener('click', () => {
            elements.startDateInput.value = '';
            elements.endDateInput.value = '';
            elements.typeInput.value = ''; 
            loadRadiologyResults();
        });
    }

    if (elements.radiologyResultsListContainer) {
        elements.radiologyResultsListContainer.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-action]');
            if (!button || button.disabled) return;
            const resultId = button.dataset.id;
            const result = getLuminexRadiologyResults().find(r => r.id === resultId);
            if (!result) return;

            if (button.dataset.action === 'view-details') {
                showRadiologyReport(result);
            } else if (button.dataset.action === 'view-images') {
                showRadiologyImage(result);
            }
        });
    }
    
    elements.activeFiltersContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-pill')) {
            const keyToRemove = e.target.dataset.filterKey;
            if (keyToRemove === 'startDate') elements.startDateInput.value = '';
            if (keyToRemove === 'endDate') elements.endDateInput.value = '';
            if (keyToRemove === 'type') elements.typeInput.value = ''; 
            loadRadiologyResults();
        }
    });

    [elements.startDateInput, elements.endDateInput, elements.typeInput].forEach(input => {
        if (input) {
            input.addEventListener('input', loadRadiologyResults);
        }
    });

    loadRadiologyResults();
});
