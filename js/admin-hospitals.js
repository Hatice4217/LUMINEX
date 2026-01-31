import { setupHeader } from './utils/header-manager.js';
import { 
    getLoggedInUser, 
    getLuminexHospitals, 
    setLuminexHospitals, 
    provinces, 
    districts
    // hospitalImages is no longer imported or used for default visuals
} from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const loggedInUser = getLoggedInUser();
    if (!loggedInUser || loggedInUser.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    const elements = {
        hospitalListContainer: document.getElementById('hospitalList'),
        searchInput: document.getElementById('hospitalSearchInput'),
        provinceInput: document.getElementById('provinceInput'),
        provincePanel: document.getElementById('provincePanel'),
        districtInput: document.getElementById('districtInput'),
        districtPanel: document.getElementById('districtPanel'),
        addHospitalBtn: document.getElementById('addHospitalBtn'),
        filterCardHeader: document.querySelector('.filter-card-header'),
        filterCardBody: document.getElementById('filter-card-body'),
        toggleFilterBtn: document.getElementById('toggle-filter-body')
    };

    let selectedCityId = null;
    let luminexHospitals = getLuminexHospitals(); // Get initial hospitals from storage-utils

    // --- Dropdown Logic ---
    function populatePanel(panel, items) {
        if (!panel) return;
        panel.innerHTML = '';
        if (!items) return;
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'custom-option';
            div.textContent = item.name;
            div.dataset.id = item.id;
            panel.appendChild(div);
        });
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
            if (input.value === '') {
                onSelect(null);
            }
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

    // --- Render ---
    function renderHospitals(hospitals) {
        elements.hospitalListContainer.innerHTML = '';
        
        if (hospitals.length === 0) {
            elements.hospitalListContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:60px; background: white; border-radius: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.03);">
                    <i class="fas fa-hospital-alt" style="font-size: 3rem; color: #e0e0e0; margin-bottom: 15px;"></i>
                    <h3 style="color: #636e72; font-weight: 500;">Kayıt Bulunamadı</h3>
                    <p style="color: #b2bec3;">Arama kriterlerinize uygun hastane mevcut değil.</p>
                </div>`;
            return;
        }

        // Modern Gradients for Hospital Cards
        const cardStyles = [
            { bg: 'linear-gradient(135deg, #001F6B 0%, #764ba2 100%)', icon: 'fa-hospital' },
            { bg: 'linear-gradient(135deg, #2af598 0%, #009efd 100%)', icon: 'fa-clinic-medical' },
            { bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)', icon: 'fa-heartbeat' },
            { bg: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', icon: 'fa-user-md' },
            { bg: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', icon: 'fa-ambulance' },
            { bg: 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)', icon: 'fa-hospital-alt' }
        ];

        hospitals.forEach((h) => {
            const card = document.createElement('div');
            card.className = 'hospital-card';
            
            // Deterministic random style based on ID
            const styleIndex = (h.id.split('').reduce((a,b)=>a+b.charCodeAt(0),0)) % cardStyles.length;
            const style = cardStyles[styleIndex];
            
            card.innerHTML = `
                <div class="card-visual" style="background: ${style.bg};">
                    <i class="fas ${style.icon}"></i>
                </div>
                
                <div class="card-content">
                    <h3 class="hospital-name">${h.name}</h3>
                    <div class="location-tag">
                        <i class="fas fa-map-marker-alt" style="color: #a4b0be;"></i>
                        <span>${h.district}, ${h.city}</span>
                    </div>
                    
                    <div class="card-footer">
                        <div class="stats-container" style="display: flex; gap: 10px;">
                            <div class="stat-pill" title="Toplam Doktor">
                                <i class="fas fa-user-md"></i> <span>${h.doctorCount || 0}</span>
                            </div>
                            <div class="stat-pill" title="Poliklinik Sayısı">
                                <i class="fas fa-clinic-medical"></i> <span>15+</span>
                            </div>
                        </div>
                        <div class="footer-actions" style="display: flex; gap: 8px;">
                            <a href="tel:${h.phone}" class="btn-footer-action btn-phone" title="Ara"><i class="fas fa-phone"></i></a>
                            <button class="btn-footer-action btn-edit" onclick="editHospital('${h.id}')" title="Düzenle"><i class="fas fa-pen"></i></button>
                            <button class="btn-footer-action btn-delete" onclick="deleteHospital('${h.id}')" title="Sil"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
            elements.hospitalListContainer.appendChild(card);
        });
    }

    // --- Logic ---
    function filterHospitals() {
        const term = elements.searchInput.value.toLowerCase().trim();
        const city = elements.provinceInput.value.trim();
        const district = elements.districtInput.value.trim();

        // Get the latest hospitals from storage
        luminexHospitals = getLuminexHospitals();

        const filtered = luminexHospitals.filter(h => {
            const nameMatch = h.name.toLowerCase().includes(term);
            
            const cityMatch = !city || (h.city && h.city.toLocaleLowerCase('tr-TR') === city.toLocaleLowerCase('tr-TR'));
            const districtMatch = !district || (h.district && h.district.toLocaleLowerCase('tr-TR') === district.toLocaleLowerCase('tr-TR'));
            
            return nameMatch && cityMatch && districtMatch;
        });
        
        renderHospitals(filtered);
    }

    // Expose functions to global scope for onclick handlers
    window.deleteHospital = function(id) {
        Swal.fire({
            title: 'Emin misiniz?',
            text: "Bu hastaneyi silmek istediğinizden emin misiniz?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Evet, Sil'
        }).then((result) => {
            if (result.isConfirmed) {
                let currentHospitals = getLuminexHospitals();
                currentHospitals = currentHospitals.filter(h => h.id !== id);
                setLuminexHospitals(currentHospitals); // Use setter from storage-utils
                luminexHospitals = currentHospitals; // Update local reference
                filterHospitals();
                Swal.fire('Silindi!', 'Hastane kaydı silindi.', 'success');
            }
        });
    };

    window.editHospital = function(id) {
        const h = getLuminexHospitals().find(item => item.id === id); // Get from latest storage
        if(!h) return;

        Swal.fire({
            title: 'Hastaneyi Düzenle',
            html: `
                <input id="swal-name" class="swal2-input" placeholder="Hastane Adı" value="${h.name}">
                <input id="swal-city" class="swal2-input" placeholder="İl" value="${h.city}">
                <input id="swal-district" class="swal2-input" placeholder="İlçe" value="${h.district}">
                <input id="swal-phone" class="swal2-input" placeholder="Telefon" value="${h.phone}">
                <!-- Removed image URL input -->
            `,
            showCancelButton: true,
            confirmButtonText: 'Kaydet',
            preConfirm: () => {
                return {
                    name: document.getElementById('swal-name').value,
                    city: document.getElementById('swal-city').value,
                    district: document.getElementById('swal-district').value,
                    phone: document.getElementById('swal-phone').value
                    // imageUrl: not collected
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                let currentHospitals = getLuminexHospitals();
                let hospitalToUpdate = currentHospitals.find(item => item.id === id);
                if (hospitalToUpdate) {
                    hospitalToUpdate.name = result.value.name;
                    hospitalToUpdate.city = result.value.city;
                    hospitalToUpdate.district = result.value.district;
                    hospitalToUpdate.phone = result.value.phone;
                    // hospitalToUpdate.imageUrl = undefined; // Ensure no image URL
                    setLuminexHospitals(currentHospitals); // Save updated list
                    luminexHospitals = currentHospitals; // Update local reference
                    filterHospitals();
                    Swal.fire('Başarılı', 'Bilgiler güncellendi.', 'success');
                }
            }
        });
    };

    // --- Listeners ---
    elements.searchInput.addEventListener('input', filterHospitals);
    
    if (elements.filterCardHeader) {
        elements.filterCardHeader.addEventListener('click', () => {
            const isCollapsed = elements.filterCardBody.classList.toggle('collapsed');
            const icon = elements.toggleFilterBtn.querySelector('i');
            if(icon) icon.className = `fas ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}`;
        });
    }

    elements.addHospitalBtn.addEventListener('click', () => {
        // Prepare Province Options for the Select inside SweetAlert
        const provinceOptions = provinces.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

        const formHtml = `
            <div style="text-align: left; padding: 0 10px;">
                <!-- Premium Header -->
                <div style="background: linear-gradient(135deg, #2af598, #009efd); padding: 20px; border-radius: 12px; color: white; margin-bottom: 25px; text-align: center;">
                    <i class="fas fa-hospital-medical" style="font-size: 3rem; margin-bottom: 10px; opacity: 0.9;"></i>
                    <h3 style="margin: 0; font-weight: 600;">Yeni Hastane Ekle</h3>
                    <p style="margin: 5px 0 0; font-size: 0.9rem; opacity: 0.8;">Sağlık ağına yeni bir merkez tanımlayın</p>
                </div>
                
                <!-- Hospital Name -->
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3436;">Hastane Adı</label>
                    <div style="position: relative;">
                        <i class="fas fa-h-square" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #a4b0be;"></i>
                        <input id="swal-name" type="text" class="form-control" placeholder="Örn: İstanbul Şehir Hastanesi" style="width: 100%; padding: 12px 15px 12px 40px; border-radius: 10px; border: 1px solid #dfe6e9; box-sizing: border-box;">
                    </div>
                </div>

                <!-- Location Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div class="form-group">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3436;">İl</label>
                        <div style="position: relative;">
                            <select id="swal-city" class="form-control" style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid #dfe6e9; background-color: #f8f9fa; appearance: none; cursor: pointer;">
                                <option value="" disabled selected>Seçiniz...</option>
                                ${provinceOptions}
                            </select>
                            <i class="fas fa-chevron-down" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: #a4b0be; pointer-events: none; font-size: 0.8rem;"></i>
                        </div>
                    </div>
                    <div class="form-group">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3436;">İlçe</label>
                        <div style="position: relative;">
                            <select id="swal-district" class="form-control" disabled style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid #dfe6e9; background-color: #e9ecef; appearance: none; cursor: pointer;">
                                <option value="" disabled selected>Önce İl</option>
                            </select>
                            <i class="fas fa-chevron-down" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); color: #a4b0be; pointer-events: none; font-size: 0.8rem;"></i>
                        </div>
                    </div>
                </div>

                <!-- Phone -->
                <div class="form-group" style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3436;">Telefon</label>
                    <div style="position: relative;">
                        <i class="fas fa-phone" style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #a4b0be;"></i>
                        <input id="swal-phone" type="text" class="form-control" placeholder="0212 555 55 55" style="width: 100%; padding: 12px 15px 12px 40px; border-radius: 10px; border: 1px solid #dfe6e9; box-sizing: border-box;">
                    </div>
                </div>
            </div>
        `;

        Swal.fire({
            html: formHtml,
            width: '550px',
            showCloseButton: true,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-save"></i> Kaydet ve Ekle',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#009efd',
            cancelButtonColor: '#b2bec3',
            customClass: {
                popup: 'modern-swal-popup',
                content: 'modern-swal-content'
            },
            didOpen: () => {
                const citySelect = document.getElementById('swal-city');
                const districtSelect = document.getElementById('swal-district');

                citySelect.addEventListener('change', () => {
                    const selectedProvinceId = citySelect.value;
                    
                    // Enable district select
                    districtSelect.disabled = false;
                    districtSelect.style.backgroundColor = '#f8f9fa';
                    
                    // Filter districts
                    const relevantDistricts = districts.filter(d => d.provinceId === selectedProvinceId);
                    
                    // Populate
                    districtSelect.innerHTML = '<option value="" disabled selected>Seçiniz...</option>' + 
                        relevantDistricts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
                });
            },
            preConfirm: () => {
                const name = document.getElementById('swal-name').value;
                const citySelect = document.getElementById('swal-city');
                const district = document.getElementById('swal-district').value;
                const phone = document.getElementById('swal-phone').value;

                if (!name || !citySelect.value || !district) {
                    Swal.showValidationMessage('Lütfen hastane adı, il ve ilçe bilgilerini eksiksiz doldurun.');
                    return false;
                }

                // Get city name (text) instead of ID for storage
                const cityName = citySelect.options[citySelect.selectedIndex].text;

                return {
                    name: name,
                    city: cityName,
                    district: district,
                    phone: phone
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const newH = {
                    id: 'hosp-' + Date.now(),
                    name: result.value.name,
                    city: result.value.city,
                    district: result.value.district,
                    phone: result.value.phone,
                    doctorCount: 0,
                    address: `${result.value.district}, ${result.value.city}`
                };
                
                let currentHospitals = getLuminexHospitals(); // Get current list
                currentHospitals.push(newH);
                setLuminexHospitals(currentHospitals); // Save updated list
                luminexHospitals = currentHospitals; // Update local reference
                
                filterHospitals(); // Refresh Grid
                
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
                    title: 'Hastane Başarıyla Eklendi'
                })
            }
        });
    });

    // --- Initialize Custom Dropdowns ---
    setupCustomDropdown({
        input: elements.provinceInput,
        panel: elements.provincePanel,
        items: provinces,
        onSelect: (item) => {
            selectedCityId = item ? item.id : null;
            // Clear district
            elements.districtInput.value = '';
            elements.districtInput.disabled = !selectedCityId;
            
            // Filter districts
            const relevantDistricts = selectedCityId ? districts.filter(d => d.provinceId === selectedCityId) : [];
            populatePanel(elements.districtPanel, relevantDistricts);
            
            filterHospitals();
        }
    });

    setupCustomDropdown({
        input: elements.districtInput,
        panel: elements.districtPanel,
        items: [], // Initially empty
        onSelect: () => {
            filterHospitals();
        }
    });

    // Initial Render
    filterHospitals();
});