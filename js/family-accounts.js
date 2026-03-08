import { setupHeader } from './utils/header-manager.js';
import { getLocalStorageItem, setLocalStorageItem, getActiveProfile, setActiveProfile, removeActiveProfile, getLoggedInUser } from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    const elements = {
        currentAccountAvatar: document.getElementById('currentAccountAvatar'),
        currentAccountName: document.getElementById('currentAccountName'),
        currentAccountEmail: document.getElementById('currentAccountEmail'),
        familyMembersList: document.getElementById('familyMembersList'),
        searchInput: document.getElementById('familySearch'),
        addFamilyMemberBtn: document.getElementById('addFamilyMemberBtn')
    };

    let allFamilyMembers = [];
    let searchTerm = '';

    function getSafeTranslation(key) {
        return window.getTranslation ? window.getTranslation(key) : key;
    }

    function getInitials(name) {
        if (!name || typeof name !== 'string') return '??';
        const names = name.split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[names.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }

    // Helper to get full name from user object
    function getFullName(user) {
        if (!user) return '';
        if (user.name) return user.name;
        // Backend returns firstName and lastName
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        return `${firstName} ${lastName}`.trim();
    }

    function getGenderClass(name) {
        if (!name || typeof name !== 'string') return 'neutral';
        const firstName = name.split(' ')[0]?.toLowerCase() || '';
        const femaleNames = ['ayşe', 'fatma', 'zeynep', 'elife', 'zeyneb', 'hatice', 'meryem', 'sultan', 'şükriye', 'safiye', 'emin', 'ümmü', 'zeynep', 'esra', 'gülşah', 'büşra', 'betül', 'nur', 'selin', 'cera', 'sude', 'ece', 'sinem', 'deniz', 'nil', 'naz', 'nazlı', 'belinay', 'elin', 'selin', 'balım', 'begüm'];
        const maleNames = ['ahmet', 'mehmet', 'mustafa', 'ali', 'hasan', 'hüseyin', 'ibrahim', 'osman', 'murat', 'can', 'emre', 'burak', 'arda', 'serkan', 'berk', 'mert', 'kaan', 'kerem', 'yusuf', 'eyüp', 'ömer', 'abdullah', 'muhammed', 'yunus', 'veli', 'rıza', 'nuri', 'kemal', 'tamer', 'erkam'];

        if (femaleNames.includes(firstName)) return 'female';
        if (maleNames.includes(firstName)) return 'male';
        return 'neutral';
    }

    function getRelationshipTranslation(relation) {
        const translations = {
            'parent': getSafeTranslation('relationshipParent'),
            'child': getSafeTranslation('relationshipChild'),
            'spouse': getSafeTranslation('relationshipSpouse'),
            'sibling': getSafeTranslation('relationshipSibling'),
            'grandparent': getSafeTranslation('relationshipGrandparent'),
            'other': getSafeTranslation('relationshipOther')
        };
        return translations[relation] || relation;
    }

    function generateDummyFamilyMembers() {
        const loggedInUser = getLoggedInUser();
        if (!loggedInUser) return [];

        return [
            {
                id: 'FAM-001',
                parentId: loggedInUser.tc,
                name: 'Ali Yılmaz',
                tc: '12345678901',
                dateOfBirth: '2015-05-15',
                relationship: 'child',
                isChild: true
            },
            {
                id: 'FAM-002',
                parentId: loggedInUser.tc,
                name: 'Fatma Yılmaz',
                tc: '12345678902',
                dateOfBirth: '2018-08-20',
                relationship: 'child',
                isChild: true
            },
            {
                id: 'FAM-003',
                parentId: loggedInUser.tc,
                name: 'Ahmet Yılmaz',
                tc: '12345678903',
                dateOfBirth: '1945-03-10',
                relationship: 'parent',
                isElderly: true
            }
        ];
    }

    function renderCurrentAccount() {
        const activeProfile = getActiveProfile();
        const loggedInUser = getLoggedInUser();
        const currentUser = activeProfile || loggedInUser;

        // Debug log
        console.log('Active Profile:', activeProfile);
        console.log('Logged In User:', loggedInUser);

        if (!currentUser || !currentUser.name) {
            // Try to get user from localStorage directly as fallback
            const storedUser = getLocalStorageItem('loggedInUser');
            console.log('Stored user from localStorage:', storedUser);

            if (storedUser && storedUser.name) {
                const initials = getInitials(storedUser.name);
                elements.currentAccountAvatar.textContent = initials;
                elements.currentAccountName.textContent = storedUser.name;
                elements.currentAccountEmail.textContent = storedUser.email || '-';
            } else {
                // Fallback to dummy user for testing
                elements.currentAccountAvatar.textContent = 'LH';
                elements.currentAccountName.textContent = 'Luminex User';
                elements.currentAccountEmail.textContent = 'user@luminex.com';
            }
            return;
        }

        const initials = getInitials(currentUser.name);
        elements.currentAccountAvatar.textContent = initials;
        elements.currentAccountName.textContent = currentUser.name;
        elements.currentAccountEmail.textContent = currentUser.email || '-';
    }

    function renderFamilyMemberCards(familyMembers) {
        if (!elements.familyMembersList) return;

        elements.familyMembersList.innerHTML = '';

        if (!familyMembers || familyMembers.length === 0) {
            elements.familyMembersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>${getSafeTranslation('noFamilyMembers')}</h3>
                    <p>${getSafeTranslation('noFamilyDesc') || 'Henüz bağlı aile üyesi bulunmuyor.'}</p>
                </div>
            `;
            return;
        }

        const currentLang = localStorage.getItem('language') || 'tr';
        const dateLocale = currentLang === 'tr' ? 'tr-TR' : 'en-GB';

        familyMembers.forEach(member => {
            const card = document.createElement('div');
            card.className = 'family-member-card';
            card.dataset.id = member.id;

            const initials = getInitials(member.name);
            const genderClass = getGenderClass(member.name);
            const accountTypeClass = member.isChild ? 'child' : member.isElderly ? 'elderly' : '';
            const avatarClass = member.isChild ? 'child' : member.isElderly ? 'elderly' : genderClass;
            const relationshipText = getRelationshipTranslation(member.relationship);

            const birthDate = member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString(dateLocale) : '-';
            const age = member.dateOfBirth
                ? new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear()
                : '-';

            card.innerHTML = `
                <div class="family-member-header">
                    <div class="family-member-avatar ${avatarClass}">${initials}</div>
                    <div class="family-member-info">
                        <h4>${member.name}</h4>
                        <span class="family-member-date">${birthDate} (${age} yaş)</span>
                    </div>
                </div>
                <div class="family-member-badges">
                    <span class="family-member-badge relation">${relationshipText}</span>
                    ${member.isChild ? `<span class="family-member-badge child">${getSafeTranslation('childAccount')}</span>` : ''}
                    ${member.isElderly ? `<span class="family-member-badge elderly">${getSafeTranslation('elderlyAccount')}</span>` : ''}
                </div>
                <div class="family-member-actions">
                    <button class="family-member-btn switch" data-action="switch" data-id="${member.id}">
                        <i class="fas fa-exchange-alt"></i>
                        ${getSafeTranslation('switchAccount')}
                    </button>
                    <button class="family-member-btn remove" data-action="remove" data-id="${member.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;

            elements.familyMembersList.appendChild(card);
        });
    }

    function filterAndSearchFamilyMembers() {
        const loggedInUser = getLoggedInUser();
        if (!loggedInUser) return;

        let filtered = [...allFamilyMembers];

        // Filter by user
        filtered = filtered.filter(fm => fm.parentId === loggedInUser.tc);

        // Search
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(fm =>
                (fm.name && fm.name.toLowerCase().includes(searchLower)) ||
                (fm.tc && fm.tc.includes(searchTerm))
            );
        }

        renderFamilyMemberCards(filtered);
    }

    function loadFamilyMembers() {
        let familyMembers = getLocalStorageItem('luminexFamilyMembers') || [];

        // If no family members exist, generate dummy data
        if (familyMembers.length === 0) {
            familyMembers = generateDummyFamilyMembers();
            setLocalStorageItem('luminexFamilyMembers', familyMembers);
        }

        allFamilyMembers = familyMembers;
        filterAndSearchFamilyMembers();
    }

    function showAddFamilyMemberModal() {
        Swal.fire({
            title: getSafeTranslation('addFamilyMember'),
            html: `
                <form id="addFamilyMemberForm" style="text-align: left;">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">${getSafeTranslation('fullName')}</label>
                        <input type="text" id="familyMemberName" class="swal2-input" placeholder="${getSafeTranslation('fullName')}">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">${getSafeTranslation('tcId')}</label>
                        <input type="text" id="familyMemberTc" class="swal2-input" placeholder="11 haneli TC Kimlik No" maxlength="11">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">${getSafeTranslation('dateOfBirth')}</label>
                        <input type="date" id="familyMemberDob" class="swal2-input">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">${getSafeTranslation('relationship')}</label>
                        <select id="familyMemberRelation" class="swal2-input">
                            <option value="child">${getSafeTranslation('relationshipChild')}</option>
                            <option value="spouse">${getSafeTranslation('relationshipSpouse')}</option>
                            <option value="parent">${getSafeTranslation('relationshipParent')}</option>
                            <option value="sibling">${getSafeTranslation('relationshipSibling')}</option>
                            <option value="grandparent">${getSafeTranslation('relationshipGrandparent')}</option>
                            <option value="other">${getSafeTranslation('relationshipOther')}</option>
                        </select>
                    </div>
                </form>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: getSafeTranslation('registerButton'),
            cancelButtonText: getSafeTranslation('cancel'),
            confirmButtonColor: '#001F6B',
            preConfirm: () => {
                const name = document.getElementById('familyMemberName').value;
                const tc = document.getElementById('familyMemberTc').value;
                const dob = document.getElementById('familyMemberDob').value;
                const relation = document.getElementById('familyMemberRelation').value;

                if (!name || !tc || !dob) {
                    Swal.showValidationMessage('Lütfen tüm alanları doldurun');
                    return false;
                }

                if (tc.length !== 11 || !/^\d+$/.test(tc)) {
                    Swal.showValidationMessage('Geçerli bir 11 haneli TC Kimlik No girin');
                    return false;
                }

                return { name, tc, dob, relation };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const { name, tc, dob, relation } = result.value;
                const loggedInUser = getLoggedInUser();

                const birthDate = new Date(dob);
                const age = new Date().getFullYear() - birthDate.getFullYear();
                const isChild = age < 18;
                const isElderly = age >= 65;

                const newMember = {
                    id: 'FAM-' + Date.now(),
                    parentId: loggedInUser.tc,
                    name: name,
                    tc: tc,
                    dateOfBirth: dob,
                    relationship: relation,
                    isChild: isChild,
                    isElderly: isElderly
                };

                let familyMembers = getLocalStorageItem('luminexFamilyMembers') || [];
                familyMembers.push(newMember);
                setLocalStorageItem('luminexFamilyMembers', familyMembers);

                Swal.fire({
                    icon: 'success',
                    title: getSafeTranslation('addFamilyMemberSuccess'),
                    timer: 2000,
                    showConfirmButton: false
                });

                loadFamilyMembers();
            }
        });
    }

    function switchToAccount(memberId) {
        let familyMembers = getLocalStorageItem('luminexFamilyMembers') || [];
        const member = familyMembers.find(fm => fm.id === memberId);

        if (!member) {
            Swal.fire({
                icon: 'error',
                title: 'Hata',
                text: 'Aile üyesi bulunamadı'
            });
            return;
        }

        // Create a pseudo-user for family member
        const familyUser = {
            id: member.id,
            tc: member.tc,
            name: member.name,
            email: member.tc + '@family.luminex',
            role: 'patient',
            isChild: member.isChild,
            isElderly: member.isElderly
        };

        setActiveProfile(familyUser);

        Swal.fire({
            icon: 'success',
            title: 'Hesap Değiştirildi',
            text: `${member.name} hesabına geçiş yapıldı`,
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
            window.location.href = 'dashboard.html';
        });
    }

    function removeFamilyMember(memberId) {
        Swal.fire({
            title: getSafeTranslation('removeFamilyMemberConfirm'),
            text: 'Bu işlem geri alınamaz',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ff4757',
            confirmButtonText: getSafeTranslation('yesDelete'),
            cancelButtonText: getSafeTranslation('cancel')
        }).then((result) => {
            if (result.isConfirmed) {
                let familyMembers = getLocalStorageItem('luminexFamilyMembers') || [];
                familyMembers = familyMembers.filter(fm => fm.id !== memberId);
                setLocalStorageItem('luminexFamilyMembers', familyMembers);

                Swal.fire({
                    icon: 'success',
                    title: 'Silindi',
                    timer: 2000,
                    showConfirmButton: false
                });

                loadFamilyMembers();
            }
        });
    }

    // Search input event
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value;
            filterAndSearchFamilyMembers();
        });
    }

    // Add family member button
    if (elements.addFamilyMemberBtn) {
        elements.addFamilyMemberBtn.addEventListener('click', showAddFamilyMemberModal);
    }

    // Family member card click events
    if (elements.familyMembersList) {
        elements.familyMembersList.addEventListener('click', (e) => {
            const button = e.target.closest('.family-member-btn');
            if (!button) return;

            const action = button.dataset.action;
            const memberId = button.dataset.id;

            if (action === 'switch') {
                switchToAccount(memberId);
            } else if (action === 'remove') {
                removeFamilyMember(memberId);
            }
        });
    }

    // Initial render
    renderCurrentAccount();
    loadFamilyMembers();

    // Reveal animations
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
});
