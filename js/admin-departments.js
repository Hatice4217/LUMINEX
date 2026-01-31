import { setupHeader } from './utils/header-manager.js';
import { 
    getLoggedInUser, 
    getLuminexHospitals, 
    getLuminexDepartments, 
    setLuminexDepartments,
    provinces, // Import provinces for custom dropdown
    districts // Import districts for custom dropdown
} from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const loggedInUser = getLoggedInUser();
    if (!loggedInUser || loggedInUser.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    const elements = {
        departmentListContainer: document.getElementById('departmentList'),
        searchInput: document.getElementById('departmentSearchInput'),
        hospitalInput: document.getElementById('hospitalInput'),
        hospitalPanel: document.getElementById('hospitalPanel'),
        addDepartmentBtn: document.getElementById('addDepartmentBtn'),
        filterCardHeader: document.querySelector('.filter-card-header'),
        filterCardBody: document.getElementById('filter-card-body'),
        toggleFilterBtn: document.getElementById('toggle-filter-body')
    };

    let selectedHospitalId = '';
    let luminexHospitals = getLuminexHospitals(); // Get hospitals from storage-utils
    let luminexDepartments = getLuminexDepartments(); // Get departments from storage-utils

    // --- Dropdown Logic ---
    function populatePanel(panel, items) {
        if (!panel) return;
        panel.innerHTML = '';
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'custom-option';
            div.textContent = item.name;
            div.dataset.id = item.id;
            panel.appendChild(div);
        });
        // Add "All" option
        const allDiv = document.createElement('div');
        allDiv.className = 'custom-option';
        allDiv.textContent = 'Tüm Hastaneler';
        allDiv.dataset.id = '';
        panel.prepend(allDiv);
    }

    function filterPanel(panel, filter) {
        if (!panel) return;
        panel.querySelectorAll('.custom-option').forEach(opt => {
            opt.style.display = opt.textContent.toLowerCase().includes(filter.toLowerCase()) ? '' : 'none';
        });
    }

    function setupCustomDropdown(config) {
        const { input, panel, onSelect, items } = config;
        if (!input || !panel) return;

        populatePanel(panel, items);

        input.addEventListener('focus', () => {
            panel.classList.add('visible');
            filterPanel(panel, '');
        });

        input.addEventListener('input', () => {
            panel.classList.add('visible');
            filterPanel(panel, input.value);
        });

        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !panel.contains(e.target)) {
                panel.classList.remove('visible');
            }
        });

        panel.addEventListener('click', (e) => {
            const option = e.target.closest('.custom-option');
            if (option) {
                const item = { id: option.dataset.id, name: option.textContent };
                input.value = item.name;
                panel.classList.remove('visible');
                if (onSelect) onSelect(item);
            }
        });
    }

    // --- Helper: Get Icon ---
    function getDeptIcon(name) {
        name = name.toLowerCase();
        if (name.includes('kardiyo')) return 'fa-heartbeat';
        if (name.includes('göz')) return 'fa-eye';
        if (name.includes('diş')) return 'fa-tooth';
        if (name.includes('beyin') || name.includes('nöro')) return 'fa-brain';
        if (name.includes('çocuk')) return 'fa-baby';
        if (name.includes('kadın')) return 'fa-female';
        if (name.includes('cerrahi')) return 'fa-scalpel';
        return 'fa-clinic-medical';
    }

    // --- Render ---
    function renderDepartments(departments) {
        elements.departmentListContainer.innerHTML = '';
        
        if (departments.length === 0) {
            elements.departmentListContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:60px; background: white; border-radius: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.03);">
                    <i class="fas fa-folder-open" style="font-size: 3rem; color: #e0e0e0; margin-bottom: 15px;"></i>
                    <h3 style="color: #636e72; font-weight: 500;">Kayıt Bulunamadı</h3>
                    <p style="color: #b2bec3;">Arama kriterlerinize uygun bölüm mevcut değil.</p>
                </div>`;
            return;
        }

        departments.forEach(d => {
            const hospital = luminexHospitals.find(h => h.id === d.hospitalId);
            const hospitalName = hospital ? hospital.name : 'Bilinmeyen Hastane';
            const icon = getDeptIcon(d.name);

            const card = document.createElement('div');
            card.className = 'department-card';
            
            card.innerHTML = `
                <div class="card-header">
                    <div class="icon-box">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="action-menu">
                        <button class="btn-dots" onclick="editDepartment('${d.id}')" title="Düzenle"><i class="fas fa-pen"></i></button>
                        <button class="btn-dots" onclick="deleteDepartment('${d.id}')" title="Sil" style="color: #ff7675;"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                
                <div class="card-body">
                    <h3>${d.name}</h3>
                    <div class="hospital-tag">
                        <i class="fas fa-hospital-alt" style="color: #a4b0be;"></i>
                        <span>${hospitalName}</span>
                    </div>
                </div>
                
                <div class="card-footer">
                    <div class="stat-group">
                        <div class="stat-val">${d.doctorCount}</div>
                        <div class="stat-label">Doktor</div>
                    </div>
                    <div>
                        <span class="status-dot"></span>
                        <span class="status-text">Aktif</span>
                    </div>
                </div>
            `;
            elements.departmentListContainer.appendChild(card);
        });
    }

    // --- Logic ---
    function filterDepartments() {
        // Get the latest departments from storage
        luminexDepartments = getLuminexDepartments();

        const term = elements.searchInput.value.toLowerCase();
        
        const filtered = luminexDepartments.filter(d => {
            const nameMatch = d.name.toLowerCase().includes(term);
            const hospMatch = !selectedHospitalId || d.hospitalId === selectedHospitalId;
            
            const hospital = luminexHospitals.find(h => h.id === d.hospitalId);
            const hospitalNameMatch = hospital && hospital.name.toLowerCase().includes(term);

            return (nameMatch || hospitalNameMatch) && hospMatch;
        });
        
        renderDepartments(filtered);
    }

    // Expose functions
    window.deleteDepartment = function(id) {
        Swal.fire({
            title: 'Emin misiniz?',
            text: "Bu bölümü silmek istediğinizden emin misiniz?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Evet, Sil'
        }).then((result) => {
            if (result.isConfirmed) {
                let currentDepartments = getLuminexDepartments().filter(d => d.id !== id);
                setLuminexDepartments(currentDepartments);
                luminexDepartments = currentDepartments; // Update local reference
                filterDepartments();
                Swal.fire('Silindi!', 'Bölüm silindi.', 'success');
            }
        });
    };

    window.editDepartment = function(id) {
        const d = getLuminexDepartments().find(item => item.id === id); // Get from latest storage
        if(!d) return;

        Swal.fire({
            title: 'Bölümü Düzenle',
            html: `
                <input id="swal-name" class="swal2-input" placeholder="Bölüm Adı" value="${d.name}">
                <input id="swal-count" type="number" class="swal2-input" placeholder="Doktor Sayısı" value="${d.doctorCount}">
            `,
            showCancelButton: true,
            confirmButtonText: 'Kaydet',
            preConfirm: () => {
                return {
                    name: document.getElementById('swal-name').value,
                    count: document.getElementById('swal-count').value
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                let currentDepartments = getLuminexDepartments();
                let departmentToUpdate = currentDepartments.find(item => item.id === id);
                if (departmentToUpdate) {
                    departmentToUpdate.name = result.value.name;
                    departmentToUpdate.doctorCount = parseInt(result.value.count) || 0;
                    setLuminexDepartments(currentDepartments);
                    luminexDepartments = currentDepartments; // Update local reference
                    filterDepartments();
                    Swal.fire('Başarılı', 'Bilgiler güncellendi.', 'success');
                }
            }
        });
    };

    // --- Listeners ---
    elements.searchInput.addEventListener('input', filterDepartments);
    
    if (elements.filterCardHeader) {
        elements.filterCardHeader.addEventListener('click', () => {
            const isCollapsed = elements.filterCardBody.classList.toggle('collapsed');
            const icon = elements.toggleFilterBtn.querySelector('i');
            if(icon) icon.className = `fas ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}`;
        });
    }

    elements.addDepartmentBtn.addEventListener('click', () => {
        // Get the latest hospitals for the select dropdown
        let currentHospitals = getLuminexHospitals();
        let options = '';
        currentHospitals.forEach(h => {
            options += `<option value="${h.id}">${h.name}</option>`;
        });

        const formHtml = `
            <div style="text-align: left; padding: 0 10px;">
                <div style="background: linear-gradient(135deg, #001F6B, #764ba2); padding: 20px; border-radius: 12px; color: white; margin-bottom: 25px; text-align: center;">
                    <i class="fas fa-plus-circle" style="font-size: 3rem; margin-bottom: 10px; opacity: 0.9;"></i>
                    <h3 style="margin: 0; font-weight: 600;">Yeni Departman Oluştur</h3>
                    <p style="margin: 5px 0 0; font-size: 0.9rem; opacity: 0.8;">Kurumsal yapıya yeni bir birim ekleyin</p>
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3436;">Bağlı Olduğu Hastane</label>
                    <div style="position: relative;">
                        <i class="fas fa-hospital" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #a4b0be;"></i>
                        <select id="swal-hospital" class="form-control" style="width: 100%; padding: 12px 15px 12px 40px; border-radius: 10px; border: 1px solid #dfe6e9; background-color: #f8f9fa; appearance: none; cursor: pointer;">
                            <option value="" disabled selected>Hastane Seçiniz...</option>
                            ${options}
                        </select>
                        <i class="fas fa-chevron-down" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: #a4b0be; pointer-events: none;"></i>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3436;">Bölüm Adı</label>
                    <div style="position: relative;">
                        <i class="fas fa-clinic-medical" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #a4b0be;"></i>
                        <input id="swal-name" type="text" class="form-control" placeholder="Örn: Kardiyoloji" style="width: 100%; padding: 12px 15px 12px 40px; border-radius: 10px; border: 1px solid #dfe6e9; box-sizing: border-box;">
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3436;">Doktor Kapasitesi</label>
                    <div style="position: relative;">
                        <i class="fas fa-user-md" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #a4b0be;"></i>
                        <input id="swal-count" type="number" class="form-control" placeholder="Varsayılan: 0" style="width: 100%; padding: 12px 15px 12px 40px; border-radius: 10px; border: 1px solid #dfe6e9; box-sizing: border-box;">
                    </div>
                </div>
            </div>
        `;

        Swal.fire({
            html: formHtml,
            width: '500px',
            showCloseButton: true,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-save"></i> Kaydet ve Ekle',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#6c5ce7',
            cancelButtonColor: '#b2bec3',
            customClass: {
                popup: 'modern-swal-popup',
                content: 'modern-swal-content'
            },
            preConfirm: () => {
                const name = document.getElementById('swal-name').value;
                const hospId = document.getElementById('swal-hospital').value;
                if (!name || !hospId) {
                    Swal.showValidationMessage('Lütfen hastane ve bölüm adını giriniz.');
                    return false;
                }
                return {
                    name: name,
                    hospitalId: hospId,
                    count: document.getElementById('swal-count').value
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const newD = {
                    id: 'dept-' + Date.now(),
                    name: result.value.name,
                    hospitalId: result.value.hospitalId,
                    doctorCount: parseInt(result.value.count) || 0
                };
                let currentDepartments = getLuminexDepartments(); // Get current list
                currentDepartments.push(newD);
                setLuminexDepartments(currentDepartments); // Save updated list
                luminexDepartments = currentDepartments; // Update local reference
                filterDepartments();
                
                // Success Toast
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer)
                        toast.addEventListener('mouseleave', Swal.resumeTimer)
                    }
                })
                Toast.fire({
                    icon: 'success',
                    title: 'Bölüm Başarıyla Eklendi'
                })
            }
        });
    });

    // --- Initialize Custom Dropdowns ---
    setupCustomDropdown({
        input: elements.hospitalInput,
        panel: elements.hospitalPanel,
        items: luminexHospitals, // Pass current hospitals
        onSelect: (item) => {
            selectedHospitalId = item ? item.id : '';
            filterDepartments();
        }
    });

    // Initial Render
    filterDepartments();
});