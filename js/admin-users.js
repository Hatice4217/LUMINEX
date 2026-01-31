import { setupHeader } from './utils/header-manager.js';
import { getLoggedInUser, getLuminexUsers, setLuminexUsers, getLuminexDepartments } from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const loggedInUser = getLoggedInUser();
    if (!loggedInUser || loggedInUser.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    const elements = {
        userListContainer: document.getElementById('userList'),
        searchInput: document.getElementById('userSearchInput'),
        roleFilter: document.getElementById('userRoleFilter'),
        addUserBtn: document.getElementById('addUserBtn')
    };

    let allUsers = getLuminexUsers();

    // --- Helper: Get Initials ---
    function getInitials(name) {
        if (!name) return '?';
        const parts = name.split(' ');
        if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    }

    // --- Render Cards ---
    function renderUsers(users) {
        elements.userListContainer.innerHTML = '';
        
        if (users.length === 0) {
            elements.userListContainer.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:60px; background: white; border-radius: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.03);">
                    <i class="fas fa-users-slash" style="font-size: 3rem; color: #e0e0e0; margin-bottom: 15px;"></i>
                    <h3 style="color: #636e72; font-weight: 500;">Kullanıcı Bulunamadı</h3>
                    <p style="color: #b2bec3;">Arama kriterlerinize uygun kayıt mevcut değil.</p>
                </div>`;
            return;
        }

        users.forEach(user => {
            const card = document.createElement('div');
            card.className = 'user-card';
            
            const role = user.role || 'patient';
            const roleLabel = role === 'admin' ? 'Yönetici' : role === 'doctor' ? 'Doktor' : 'Hasta';
            const roleClass = role === 'admin' ? 'role-admin' : role === 'doctor' ? 'role-doctor' : 'role-patient';
            
            // Branch Display for Doctors
            const branchDisplay = (role === 'doctor' && user.branch) 
                ? `<div style="font-size: 0.85rem; color: #636e72; margin-top: 6px; display: flex; align-items: center; gap: 5px;">
                     <i class="fas fa-stethoscope" style="color: #00b894; font-size: 0.8rem;"></i> ${user.branch}
                   </div>` 
                : '';

            // Dynamic Avatar Gradient based on name
            const charCode = user.name ? user.name.charCodeAt(0) : 0;
            const gradients = [
                'linear-gradient(135deg, #fd79a8 0%, #e17055 100%)',
                'linear-gradient(135deg, #0984e3 0%, #00cec9 100%)',
                'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)',
                'linear-gradient(135deg, #00b894 0%, #55efc4 100%)'
            ];
            const bgGradient = gradients[charCode % gradients.length];

            card.innerHTML = `
                <div class="user-card-header">
                    <div class="user-avatar" style="background: ${bgGradient};">
                        ${getInitials(user.name)}
                    </div>
                    <div class="user-identity">
                        <h3>${user.name}</h3>
                        <div style="display: flex; flex-direction: column; align-items: flex-start;">
                            <span class="role-badge ${roleClass}">${roleLabel}</span>
                            ${branchDisplay}
                        </div>
                    </div>
                </div>
                
                <div class="user-card-body">
                    <div class="info-item">
                        <i class="fas fa-envelope"></i>
                        <span>${user.email || 'E-posta yok'}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-phone"></i>
                        <span>${user.phone || 'Telefon yok'}</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-id-card"></i>
                        <span>${user.tc || 'TC yok'}</span>
                    </div>
                </div>
                
                <div class="user-card-footer">
                    <div class="status-active">
                        <span class="status-dot"></span>
                        <span>Aktif</span>
                    </div>
                    <div class="card-actions">
                        <button class="btn-card-action btn-edit" title="Düzenle" onclick="editUser('${user.id}')"><i class="fas fa-pen"></i></button>
                        <button class="btn-card-action btn-delete" title="Sil" onclick="deleteUser('${user.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            elements.userListContainer.appendChild(card);
        });
    }

    // --- Filter ---
    function filterUsers() {
        const term = elements.searchInput.value.toLowerCase();
        const role = elements.roleFilter.value;

        const filtered = allUsers.filter(user => {
            const nameMatch = user.name && user.name.toLowerCase().includes(term);
            const emailMatch = user.email && user.email.toLowerCase().includes(term);
            const tcMatch = user.tc && user.tc.includes(term);
            
            const userRole = user.role || 'patient';
            const roleMatch = !role || userRole === role;

            return (nameMatch || emailMatch || tcMatch) && roleMatch;
        });

        renderUsers(filtered);
    }

    // --- Global Actions ---
    window.deleteUser = function(id) {
        const user = allUsers.find(u => u.id === id);
        if (!user) return;

        if (user.role === 'admin') {
            Swal.fire({
                icon: 'error',
                title: 'İşlem Engellendi',
                text: 'Yönetici hesabı silinemez.',
                confirmButtonColor: '#2d3436'
            });
            return;
        }

        Swal.fire({
            title: 'Kullanıcıyı Sil?',
            text: `"${user.name}" hesabı kalıcı olarak silinecek.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Evet, Sil',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#ff7675',
            cancelButtonColor: '#b2bec3'
        }).then((result) => {
            if (result.isConfirmed) {
                allUsers = allUsers.filter(u => u.id !== id);
                setLuminexUsers(allUsers);
                filterUsers(); // Refresh view
                
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                })
                Toast.fire({
                    icon: 'success',
                    title: 'Kullanıcı silindi'
                })
            }
        });
    };

    window.editUser = function(id) {
        Swal.fire({
            icon: 'info',
            title: 'Yakında',
            text: 'Kullanıcı düzenleme modülü geliştirilme aşamasındadır.',
            confirmButtonColor: '#6c5ce7'
        });
    };

    // --- Add User Modal ---
    elements.addUserBtn.addEventListener('click', () => {
        // Get departments from storage
        let departments = getLuminexDepartments();
        let systemBranches = departments ? departments.map(d => d.name) : [];

        // Comprehensive list of standard medical branches
        const standardBranches = [
            'Acil Tıp', 'Adli Tıp', 'Aile Hekimliği', 'Anesteziyoloji ve Reanimasyon', 
            'Beyin ve Sinir Cerrahisi', 'Çocuk Cerrahisi', 'Çocuk Sağlığı ve Hastalıkları', 
            'Dahiliye (İç Hastalıkları)', 'Dermatoloji', 'Enfeksiyon Hastalıkları', 
            'Fizik Tedavi ve Rehabilitasyon', 'Gastroenteroloji', 'Genel Cerrahi', 'Geriatri', 
            'Göğüs Cerrahisi', 'Göğüs Hastalıkları', 'Göz Hastalıkları', 'Hematoloji', 
            'Kadın Hastalıkları ve Doğum', 'Kalp ve Damar Cerrahisi', 'Kardiyoloji', 
            'Kulak Burun Boğaz', 'Nefroloji', 'Nöroloji', 'Nükleer Tıp', 'Onkoloji', 
            'Ortopedi ve Travmatoloji', 'Plastik, Rekonstrüktif ve Estetik Cerrahi', 
            'Psikiyatri', 'Radyasyon Onkolojisi', 'Radyoloji', 'Spor Hekimliği', 
            'Tıbbi Genetik', 'Tıbbi Mikrobiyoloji', 'Tıbbi Patoloji', 'Üroloji'
        ];

        // Merge system branches with standard list and remove duplicates
        let allBranches = [...new Set([...systemBranches, ...standardBranches])];
        
        // Sort alphabetically
        allBranches.sort((a, b) => a.localeCompare(b, 'tr'));
        
        const branchOptions = allBranches.map(b => `<option value="${b}">${b}</option>`).join('');

        const formHtml = `
            <div style="text-align: left; padding: 0 10px;">
                <div style="background: linear-gradient(135deg, #6c5ce7, #a29bfe); padding: 20px; border-radius: 12px; color: white; margin-bottom: 25px; text-align: center;">
                    <i class="fas fa-user-plus" style="font-size: 3rem; margin-bottom: 10px; opacity: 0.9;"></i>
                    <h3 style="margin: 0; font-weight: 600;">Yeni Kullanıcı</h3>
                    <p style="margin: 5px 0 0; font-size: 0.9rem; opacity: 0.8;">Sisteme yeni bir üye tanımlayın</p>
                </div>
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3436;">Ad Soyad</label>
                    <input id="swal-name" type="text" class="form-control" placeholder="Ad Soyad" style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid #dfe6e9; background-color: #f8f9fa;">
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                    <div class="form-group">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3436;">TC Kimlik No</label>
                        <input id="swal-tc" type="text" maxlength="11" class="form-control" placeholder="11 Haneli TC" style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid #dfe6e9; background-color: #f8f9fa;">
                    </div>
                    <div class="form-group">
                        <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3436;">Rol</label>
                        <select id="swal-role" class="form-control" style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid #dfe6e9; background-color: #f8f9fa; cursor:pointer;">
                            <option value="patient" selected>Hasta</option>
                            <option value="doctor">Doktor</option>
                            <option value="admin">Yönetici</option>
                        </select>
                    </div>
                </div>

                <!-- Branch Selection (Hidden by default) -->
                <div id="branch-field" class="form-group" style="margin-bottom: 15px; display: none;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3436;">Uzmanlık Branşı</label>
                    <select id="swal-branch" class="form-control" style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid #dfe6e9; background-color: #f8f9fa; cursor:pointer;">
                        <option value="" disabled selected>Branş Seçiniz...</option>
                        ${branchOptions}
                    </select>
                </div>

                <div class="form-group" style="margin-bottom: 10px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2d3436;">Şifre</label>
                    <input id="swal-password" type="password" class="form-control" placeholder="Giriş Şifresi" style="width: 100%; padding: 12px 15px; border-radius: 10px; border: 1px solid #dfe6e9; background-color: #f8f9fa;">
                </div>
            </div>
        `;

        Swal.fire({
            html: formHtml,
            width: '500px',
            showCloseButton: true,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-check"></i> Kaydet',
            cancelButtonText: 'İptal',
            confirmButtonColor: '#6c5ce7',
            cancelButtonColor: '#b2bec3',
            customClass: {
                popup: 'modern-swal-popup',
                content: 'modern-swal-content'
            },
            didOpen: () => {
                const roleSelect = document.getElementById('swal-role');
                const branchField = document.getElementById('branch-field');
                
                roleSelect.addEventListener('change', () => {
                    if (roleSelect.value === 'doctor') {
                        branchField.style.display = 'block';
                    } else {
                        branchField.style.display = 'none';
                    }
                });
            },
            preConfirm: () => {
                const name = document.getElementById('swal-name').value;
                const tc = document.getElementById('swal-tc').value;
                const role = document.getElementById('swal-role').value;
                const password = document.getElementById('swal-password').value;
                const branch = document.getElementById('swal-branch').value;

                if (!name || !tc || !password) {
                    Swal.showValidationMessage('Tüm alanları doldurunuz.');
                    return false;
                }
                if (tc.length !== 11 || isNaN(tc)) {
                    Swal.showValidationMessage('Geçerli bir TC Kimlik No giriniz.');
                    return false;
                }
                if (role === 'doctor' && !branch) {
                    Swal.showValidationMessage('Doktor için branş seçimi zorunludur.');
                    return false;
                }

                return { name, tc, role, password, branch: role === 'doctor' ? branch : '' };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const newUser = {
                    id: 'user-' + Date.now(),
                    name: result.value.name,
                    tc: result.value.tc,
                    password: result.value.password,
                    role: result.value.role,
                    branch: result.value.branch, // Save branch
                    email: '',
                    phone: ''
                };
                
                allUsers.push(newUser);
                setLuminexUsers(allUsers);
                filterUsers();
                
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                })
                Toast.fire({
                    icon: 'success',
                    title: 'Kullanıcı oluşturuldu'
                })
            }
        });
    });

    // --- Listeners ---
    elements.searchInput.addEventListener('input', filterUsers);
    elements.roleFilter.addEventListener('change', filterUsers);

    // Initial Render
    renderUsers(allUsers);
});
