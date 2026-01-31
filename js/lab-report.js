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
        
        // 1. Get User Data (Try active profile, then logged in user)
        let user = getActiveProfile() || getLoggedInUser();
        
        // Fallback for demo if no user
        if (!user) {
            user = { name: 'Misafir Hasta', tc: '11111111111', birthDate: '1990-01-01', gender: 'unknown' };
        }

        // 2. Get Test Data
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
                results: []
            };
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
        const fullUser = getLuminexUsers().find(u => u.tc === user.tc) || user;
        setText('patientName', fullUser.name);
        setText('patientTc', fullUser.tc);
        
        // Age & Gender
        let ageStr = '--';
        if (fullUser.birthDate) {
            const birthDate = new Date(fullUser.birthDate);
            const age = new Date().getFullYear() - birthDate.getFullYear();
            ageStr = age + ' Yaş';
        }
        const genderStr = (fullUser.gender === 'male' ? 'Erkek' : (fullUser.gender === 'female' ? 'Kadın' : ''));
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
                        <td>${res.unit || '-'}
                        <td>${res.range || '-'}
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
