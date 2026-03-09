import { getLuminexTestResults, getActiveProfile, getLuminexUsers, getLoggedInUser } from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    
    function getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    // Helper to safely set text content
    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = (text !== undefined && text !== null && text !== '') ? text : '-';
        }
    }

    function populateReport() {
        const reportId = getQueryParam('id');
        
        // 1. Get Test Data FIRST
        const allResults = getLuminexTestResults();
        let resultData = allResults.find(r => r.id === reportId);

        // Fallback if report not found (Demo Mode)
        if (!resultData) {
            console.warn('Rapor bulunamadı, demo verisi gösteriliyor.');
            resultData = {
                id: reportId || 'TEST-DEMO',
                testName: 'Genel Biyokimya Paneli',
                resultDate: new Date().toISOString(),
                doctorName: 'Dr. Demo Doktoru',
                results: [],
                patientTc: '11111111111'
            };
        }

        // 2. Determine Target Patient TC
        let targetTc = resultData.patientTc;
        if (!targetTc) {
            const activeProfile = getActiveProfile();
            if (activeProfile) targetTc = activeProfile.tc || activeProfile.tcKimlik;
        }
        if (!targetTc) {
             const loggedInUser = getLoggedInUser();
             if (loggedInUser) targetTc = loggedInUser.tc || loggedInUser.tcKimlik || loggedInUser.tcNo;
        }

        // 3. Find User Data
        const allUsers = getLuminexUsers();
        // Try to find in all users list first (most complete data)
        let fullUser = allUsers.find(u => (u.tc || u.tcKimlik || u.tcNo) === targetTc);

        // If not found in list, try active/logged in objects directly
        if (!fullUser) {
            const active = getActiveProfile();
            const loggedIn = getLoggedInUser();
            
            if (active && ((active.tc || active.tcKimlik) === targetTc)) {
                fullUser = active;
            } else if (loggedIn && ((loggedIn.tc || loggedIn.tcKimlik || loggedIn.tcNo) === targetTc)) {
                fullUser = loggedIn;
            }
        }

        // Default fallback
        if (!fullUser) {
            fullUser = { name: 'Misafir Hasta', tc: targetTc, birthDate: '1990-01-01', gender: 'unknown' };
        }

        // --- FILL HTML FIELDS ---

        // Header Info
        const resultDateObj = new Date(resultData.resultDate || resultData.date || Date.now());
        setText('reportDate', resultDateObj.toLocaleDateString('tr-TR'));
        setText('reportId', resultData.id.toUpperCase());
        
        // Print Date & Time
        const now = new Date();
        setText('printDate', now.toLocaleDateString('tr-TR'));
        setText('printTime', now.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}));

        // Patient Info
        let patientName = fullUser.name || fullUser.fullName;
        if (!patientName && fullUser.firstName) {
            patientName = `${fullUser.firstName} ${fullUser.lastName || ''}`.trim();
        }

        setText('patientName', patientName);
        setText('patientTc', fullUser.tc || fullUser.tcKimlik || fullUser.tcNo);
        
        // Age & Gender
        let ageStr = '--';
        const birthDateVal = fullUser.birthDate || fullUser.dateOfBirth;
        if (birthDateVal) {
            const birthDate = new Date(birthDateVal);
            if (!isNaN(birthDate.getTime())) {
                const age = new Date().getFullYear() - birthDate.getFullYear();
                ageStr = age + ' Yaş';
            }
        }
        const genderVal = (fullUser.gender || '').toLowerCase();
        const genderStr = (genderVal === 'male' || genderVal === 'erkek') ? 'Erkek' : (genderVal === 'female' || genderVal === 'kadın' || genderVal === 'kadin') ? 'Kadın' : '';
        setText('patientAgeGender', `${ageStr} / ${genderStr}`);

        // Protocol & Request
        setText('protocolNo', '2024-' + Math.floor(100000 + Math.random() * 900000));
        setText('requestDate', resultDateObj.toLocaleDateString('tr-TR')); // Use result date as request date proxy

        // Doctor & Unit
        const docName = resultData.doctorName || resultData.doctor || 'Uzm. Dr. Bilinmiyor';
        setText('doctorName', docName);
        setText('footerDoctorName', docName);
        setText('doctorDiplomaNo', Math.floor(10000 + Math.random() * 90000)); // Random diploma
        setText('testCategoryName', resultData.testName || resultData.name || 'Laboratuvar Testi');

        // Clinical & Sample
        setText('clinicalInfo', resultData.clinicalInfo || 'Rutin Kontrol');
        setText('sampleNo', 'N-' + Math.floor(10000000 + Math.random() * 90000000));

        // --- RESULTS TABLE ---
        const tbody = document.getElementById('resultsBody');
        if (tbody) {
            tbody.innerHTML = '';
            
            if (resultData.results && resultData.results.length > 0) {
                resultData.results.forEach(res => {
                    const row = document.createElement('tr');
                    
                    // Check Range Logic
                    let statusClass = '';
                    let statusText = 'Normal';
                    
                    // Simple parsing for demo purposes
                    // In a real app, this would be more robust
                    const val = parseFloat(res.value);
                    // This assumes range is parseable, which often isn't in raw strings
                    // So we'll just basic check if we can
                    
                    row.innerHTML = `
                        <td>${res.parameter}</td>
                        <td style="font-weight:600;">${res.value}</td>
                        <td>${res.unit || '-'}</td>
                        <td>${res.reference || res.range || '-'}</td>
                    `;
                    tbody.appendChild(row);
                });
            } else {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Sonuç detayları sistemde bulunamadı.</td></tr>';
            }
        }
        
        // Trigger print dialog automatically if desired
        // setTimeout(() => window.print(), 1000);
    }

    populateReport();
});
