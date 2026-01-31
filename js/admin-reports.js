import { setupHeader } from './utils/header-manager.js';
import { getLoggedInUser, getLuminexAppointments, getLuminexUsers, getLuminexHospitals } from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const loggedInUser = getLoggedInUser();
    if (!loggedInUser || loggedInUser.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    // Load Data
    let allAppointments = getLuminexAppointments();

    // --- 1. Weekly Activity Chart (Dynamic Bar Generation) ---
    function updateWeeklyActivityChart() {
        const container = document.getElementById('weeklyActivityChart');
        if (!container) return;

        // Simulate data for Mon-Sun
        const weeklyData = [
            { day: 'Pzt', val: 45, color: '#6c5ce7' },
            { day: 'Sal', val: 72, color: '#a55eea' },
            { day: 'Çar', val: 58, color: '#74b9ff' },
            { day: 'Per', val: 85, color: '#0984e3' },
            { day: 'Cum', val: 64, color: '#00b894' },
            { day: 'Cmt', val: 35, color: '#00cec9' },
            { day: 'Paz', val: 20, color: '#dfe6e9' }
        ];
        
        // Find max for scaling
        const maxVal = Math.max(...weeklyData.map(d => d.val));

        let html = '';
        weeklyData.forEach(item => {
            const height = (item.val / maxVal) * 100;
            html += `
                <div class="chart-bar-wrapper">
                    <div class="chart-tooltip">${item.val} Randevu</div>
                    <div class="chart-bar" style="height: ${height}%; background: ${item.color}; opacity: 0.8;"></div>
                    <div class="chart-label">${item.day}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    // --- 2. Status Donut Chart ---
    function updateAppointmentStatusChart() {
        const donutRing = document.querySelector('.donut-ring');
        const donutValue = document.querySelector('.donut-value');
        
        if (!donutRing || !donutValue) return;

        const completed = allAppointments.filter(a => a.status === 'Tamamlandı').length;
        const total = allAppointments.length;
        
        // Avoid division by zero
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

        // Update Text
        donutValue.textContent = `%${percentage}`;

        // Update Conic Gradient
        // Primary color (success) vs grey
        donutRing.style.background = `conic-gradient(
            #00b894 0% ${percentage}%, 
            #dfe6e9 ${percentage}% 100%
        )`;
    }

    // --- 3. Reports Table ---
    const dummyReports = [
        { id: 'rep1', name: 'Aylık Yönetim Özeti', type: 'PDF', date: '25 Kas 2025', size: '2.4 MB', iconClass: 'icon-pdf fa-file-pdf' },
        { id: 'rep2', name: 'Mali Gelir Tablosu', type: 'XLSX', date: '20 Kas 2025', size: '1.1 MB', iconClass: 'icon-xls fa-file-excel' },
        { id: 'rep3', name: 'Hasta Memnuniyet Analizi', type: 'CSV', date: '18 Kas 2025', size: '560 KB', iconClass: 'icon-csv fa-file-csv' },
        { id: 'rep4', name: 'Haftalık Doktor KPI', type: 'PDF', date: '15 Kas 2025', size: '1.8 MB', iconClass: 'icon-pdf fa-file-pdf' },
        { id: 'rep5', name: 'İlaç Stok Envanteri', type: 'XLSX', date: '10 Kas 2025', size: '3.2 MB', iconClass: 'icon-xls fa-file-excel' }
    ];

    function renderReportsTable() {
        const tbody = document.getElementById('reportsTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';
        dummyReports.forEach(rep => {
            const row = document.createElement('tr');
            row.className = 'report-row';
            row.innerHTML = `
                <td>
                    <div style="display: flex; align-items: center;">
                        <div class="file-icon-box ${rep.iconClass.split(' ')[0]}">
                            <i class="fas ${rep.iconClass.split(' ')[1]}"></i>
                        </div>
                        <div>
                            <div style="font-weight: 600; color: #2d3436;">${rep.name}</div>
                            <div style="font-size: 0.75rem; color: #b2bec3;">PDF Dosyası</div>
                        </div>
                    </div>
                </td>
                <td><span style="color: #636e72; font-weight: 500;">${rep.date}</span></td>
                <td><span class="badge badge-light" style="background: #f1f2f6; color: #636e72;">${rep.size}</span></td>
                <td>
                    <button class="btn-download" onclick="window.downloadReport('${rep.id}')">
                        <i class="fas fa-cloud-download-alt"></i> İndir
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // --- Helper: Open Dummy Report in New Tab ---
    function openDummyReport(reportName, type) {
        let content = '';
        let mimeType = 'text/html'; // Defaulting to HTML for better visualization in new tab

        if (type === 'PDF' || type === 'XLSX' || type === 'CSV') {
             // Create a print-friendly HTML page to simulate a document view
            content = `
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${reportName} - Önizleme</title>
                    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet">
                    <style>
                        body { font-family: 'Poppins', sans-serif; padding: 40px; color: #333; line-height: 1.6; max-width: 800px; margin: 0 auto; background: #f9f9f9; }
                        .report-container { background: white; padding: 50px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 12px; }
                        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                        h1 { color: #2c3e50; margin: 0; font-size: 1.8rem; }
                        .meta { color: #7f8c8d; font-size: 0.9rem; }
                        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 8rem; opacity: 0.03; pointer-events: none; font-weight: 800; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
                        th { background-color: #f8f9fa; color: #2d3436; }
                        .btn-print { background: #2d3436; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-family: 'Poppins', sans-serif; margin-top: 20px; }
                        .btn-print:hover { background: #000; }
                        .confidential { color: #d63031; font-weight: bold; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; border: 1px solid #d63031; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-bottom: 5px; }
                    </style>
                </head>
                <body>
                    <div class="watermark">LUMINEX</div>
                    <div class="report-container">
                        <div class="header">
                            <div>
                                <h1>LUMINEX Sağlık Grubu</h1>
                                <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">Raporlama Merkezi</div>
                            </div>
                            <div style="text-align: right;">
                                <div class="confidential">Gizli Belge</div>
                                <div style="font-weight: 600; font-size: 1.2rem;">${reportName}</div>
                                <div class="meta">Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
                                <div class="meta">Dosya Türü: ${type}</div>
                            </div>
                        </div>

                        <h3>Rapor Özeti</h3>
                        <p>Bu rapor, LUMINEX Yönetim Paneli üzerinden <strong>${getLoggedInUser()?.name || 'Yönetici'}</strong> tarafından oluşturulmuştur. Aşağıdaki veriler, sistemdeki anlık kayıtları ve istatistikleri yansıtmaktadır.</p>

                        <table>
                            <thead>
                                <tr>
                                    <th>Parametre</th>
                                    <th>Değer</th>
                                    <th>Durum</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Veri Doğrulama</td>
                                    <td>%100</td>
                                    <td style="color: green;">Tamamlandı</td>
                                </tr>
                                <tr>
                                    <td>İşlenen Kayıt Sayısı</td>
                                    <td>${Math.floor(Math.random() * 500) + 50}</td>
                                    <td>-</td>
                                </tr>
                                <tr>
                                    <td>Rapor Dönemi</td>
                                    <td>Bu Ay</td>
                                    <td>Cari Dönem</td>
                                </tr>
                            </tbody>
                        </table>

                        <div style="margin-top: 30px; padding: 20px; background: #f1f2f6; border-radius: 8px; font-size: 0.85rem; color: #636e72;">
                            <strong>Yasal Uyarı:</strong> Bu belge, kurumsal gizlilik politikaları gereğince yalnızca yetkili personel tarafından görüntülenebilir ve çoğaltılabilir. İzinsiz paylaşımı yasaktır.
                        </div>

                        <button class="btn-print" onclick="window.print()"><i class="fas fa-print"></i> Yazdır / PDF Olarak Kaydet</button>
                    </div>
                </body>
                </html>
            `;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }

    // --- Global Actions ---
    window.downloadReport = function(id) {
        const report = dummyReports.find(r => r.id === id);
        if(report) {
            // 1. Show Notification
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
              
            Toast.fire({
                icon: 'success',
                title: `${report.name} indiriliyor...`
            });

            // 2. Open in New Tab after a short delay
            setTimeout(() => {
                openDummyReport(report.name, report.type);
            }, 1000);
        }
    };

    window.generateNewReport = function() {
        Swal.fire({
            title: 'Yapay Zeka Analizi',
            text: 'Hangi veri seti üzerinde analiz yapmak istersiniz?',
            input: 'select',
            inputOptions: {
                'appointments': 'Randevu Verimliliği',
                'financial': 'Finansal Öngörüler',
                'satisfaction': 'Hasta Duygu Analizi',
                'inventory': 'Stok Tahminleme'
            },
            inputPlaceholder: 'Bir analiz türü seçin',
            showCancelButton: true,
            confirmButtonText: 'Analizi Başlat',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#6c5ce7',
            showLoaderOnConfirm: true,
            preConfirm: (value) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(value)
                    }, 2000) // Fake loading
                })
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            if (result.isConfirmed) {
                // Determine report name based on selection
                let reportName = "Yeni AI Analizi";
                const type = result.value;
                if(type === 'appointments') reportName = "Randevu Verimlilik Analizi (AI)";
                else if(type === 'financial') reportName = "Finansal Öngörü Raporu (AI)";
                else if(type === 'satisfaction') reportName = "Hasta Duygu Durum Analizi (AI)";
                else if(type === 'inventory') reportName = "Stok Tahmin Raporu (AI)";

                Swal.fire({
                    title: 'Analiz Tamamlandı!',
                    text: 'Raporunuz oluşturuldu. Yeni sekmede açılıyor...',
                    icon: 'success',
                    confirmButtonColor: '#00b894',
                    timer: 2000,
                    showConfirmButton: false
                });

                // Open the generated report
                setTimeout(() => {
                    openDummyReport(reportName, 'PDF');
                }, 1500);
            }
        });
    };

    // --- Top Bar Interactions ---
    const btnOverview = document.getElementById('btnOverview');
    const btnFinancial = document.getElementById('btnFinancial');
    const btnKPI = document.getElementById('btnKPI');
    const btnDateFilter = document.getElementById('btnDateFilter');

    if (btnOverview) btnOverview.addEventListener('click', () => switchView('overview'));
    if (btnFinancial) btnFinancial.addEventListener('click', () => switchView('financial'));
    if (btnKPI) btnKPI.addEventListener('click', () => switchView('kpi'));
    if (btnDateFilter) btnDateFilter.addEventListener('click', () => showDateFilter());

    function switchView(viewType) {
        // Update Active State
        [btnOverview, btnFinancial, btnKPI].forEach(btn => btn.classList.remove('active'));
        if (viewType === 'overview') btnOverview.classList.add('active');
        if (viewType === 'financial') btnFinancial.classList.add('active');
        if (viewType === 'kpi') btnKPI.classList.add('active');

        // Simulate Loading
        Swal.fire({
            title: 'Veriler Güncelleniyor...',
            timer: 600,
            didOpen: () => Swal.showLoading(),
            showConfirmButton: false
        }).then(() => {
            if (viewType === 'overview') {
                updateWeeklyActivityChart(); 
            } else if (viewType === 'financial') {
                updateFinancialCharts();
            } else if (viewType === 'kpi') {
                updateKPICharts();
            }
        });
    }

    function showDateFilter() {
        Swal.fire({
            title: 'Tarih Aralığı Seçin',
            html: '<input type="date" class="swal2-input" id="startDate"><input type="date" class="swal2-input" id="endDate">',
            confirmButtonText: 'Filtrele',
            preConfirm: () => {
                return [document.getElementById('startDate').value, document.getElementById('endDate').value];
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire('Filtre Uygulandı', `${result.value[0]} - ${result.value[1]} aralığı gösteriliyor.`, 'success');
            }
        });
    }

    // --- Helper to animate bars ---
    function animateBars(container) {
        const bars = container.querySelectorAll('.chart-bar');
        // Force reflow
        container.offsetHeight; 
        // Set actual heights
        bars.forEach(bar => {
            const targetHeight = bar.getAttribute('data-height');
            bar.style.height = targetHeight;
        });
    }

    function updateWeeklyActivityChart() {
        const container = document.getElementById('weeklyActivityChart');
        if (!container) return;

        // Update Title & Subtitle
        const titleEl = container.previousElementSibling.previousElementSibling;
        const subTitleEl = container.previousElementSibling;
        if (titleEl) titleEl.innerHTML = '<i class="fas fa-wave-square" style="color: #6c5ce7;"></i> Haftalık Randevu Yoğunluğu';
        if (subTitleEl) subTitleEl.textContent = 'Gerçek zamanlı hasta trafiği analizi';

        const weeklyData = [
            { day: 'Pzt', val: 45, color: '#6c5ce7' },
            { day: 'Sal', val: 72, color: '#a55eea' },
            { day: 'Çar', val: 58, color: '#74b9ff' },
            { day: 'Per', val: 85, color: '#0984e3' },
            { day: 'Cum', val: 64, color: '#00b894' },
            { day: 'Cmt', val: 35, color: '#00cec9' },
            { day: 'Paz', val: 20, color: '#dfe6e9' }
        ];
        const maxVal = Math.max(...weeklyData.map(d => d.val));

        let html = '';
        weeklyData.forEach(item => {
            const height = (item.val / maxVal) * 100;
            // Init height 0 for animation
            html += `
                <div class="chart-bar-wrapper">
                    <div class="chart-tooltip">${item.val} Randevu</div>
                    <div class="chart-bar" data-height="${height}%" style="height: 0%; background: ${item.color}; opacity: 0.8; width: 100%; border-radius: 10px;"></div>
                    <div class="chart-label">${item.day}</div>
                </div>
            `;
        });
        container.innerHTML = html;
        setTimeout(() => animateBars(container), 50);
    }

    function updateFinancialCharts() {
        const container = document.getElementById('weeklyActivityChart');
        if (container) {
            const titleEl = container.previousElementSibling.previousElementSibling;
            const subTitleEl = container.previousElementSibling;
            if (titleEl) titleEl.innerHTML = '<i class="fas fa-lira-sign" style="color: #00b894;"></i> Haftalık Gelir Akışı';
            if (subTitleEl) subTitleEl.textContent = 'Poliklinik ve tedavi hizmetleri ciro dağılımı';

            const data = [
                { day: 'Pzt', val: 15000, color: '#00b894' },
                { day: 'Sal', val: 22000, color: '#00cec9' },
                { day: 'Çar', val: 18000, color: '#0984e3' },
                { day: 'Per', val: 25000, color: '#6c5ce7' },
                { day: 'Cum', val: 19000, color: '#fd79a8' },
                { day: 'Cmt', val: 12000, color: '#fab1a0' },
                { day: 'Paz', val: 8000, color: '#dfe6e9' }
            ];
            const maxVal = Math.max(...data.map(d => d.val));
            
            let html = '';
            data.forEach(item => {
                const height = (item.val / maxVal) * 100;
                // Thinner bars for financial
                html += `
                    <div class="chart-bar-wrapper">
                        <div class="chart-tooltip">${item.val} TL</div>
                        <div class="chart-bar" data-height="${height}%" style="height: 0%; background: ${item.color}; opacity: 0.9; width: 60%; border-radius: 4px;"></div>
                        <div class="chart-label">${item.day}</div>
                    </div>
                `;
            });
            container.innerHTML = html;
            setTimeout(() => animateBars(container), 50);
        }
    }

    function updateKPICharts() {
        const container = document.getElementById('weeklyActivityChart');
        if (container) {
            const titleEl = container.previousElementSibling.previousElementSibling;
            const subTitleEl = container.previousElementSibling;
            if (titleEl) titleEl.innerHTML = '<i class="fas fa-user-md" style="color: #e17055;"></i> Doktor Performans Puanı';
            if (subTitleEl) subTitleEl.textContent = 'Haftalık hasta memnuniyeti ve işlem puanları';

            const data = [
                { day: 'Dr. A', val: 95, color: '#e17055' },
                { day: 'Dr. B', val: 88, color: '#fab1a0' },
                { day: 'Dr. C', val: 92, color: '#ffeaa7' },
                { day: 'Dr. D', val: 85, color: '#fdcb6e' },
                { day: 'Dr. E', val: 98, color: '#00b894' },
                { day: 'Dr. F', val: 75, color: '#636e72' },
                { day: 'Dr. G', val: 90, color: '#0984e3' }
            ];
            
            let html = '';
            data.forEach(item => {
                const height = item.val; // 0-100 scale
                // Different style for KPI
                html += `
                    <div class="chart-bar-wrapper">
                        <div class="chart-tooltip">${item.val} Puan</div>
                        <div class="chart-bar" data-height="${height}%" style="height: 0%; background: ${item.color}; opacity: 0.9; width: 80%; border-radius: 20px 20px 0 0;"></div>
                        <div class="chart-label">${item.day}</div>
                    </div>
                `;
            });
            container.innerHTML = html;
            setTimeout(() => animateBars(container), 50);
        }
    }

    // Initialize
    updateWeeklyActivityChart();
    updateAppointmentStatusChart();
    renderReportsTable();
});