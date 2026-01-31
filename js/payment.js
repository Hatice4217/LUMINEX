document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get('plan') || 'standard'; // Default to standard if no plan is specified

    const planData = {
        basic: {
            name: "Başlangıç Planı",
            price: "₺1.499",
            features: ["Online Randevu Sistemi", "Sınırsız Hasta Kaydı", "SMS Bildirimleri (500 Adet)"]
        },
        standard: {
            name: "Profesyonel Plan",
            price: "₺3.999",
            features: ["Her Şey Dahil Randevu", "Gelişmiş Raporlama", "AI Destekli Triyaj", "Laboratuvar Entegrasyonu"]
        },
        premium: {
            name: "Kurumsal Plan",
            price: "₺8.999",
            features: ["Tüm Özellikler Sınırsız", "Özel Eğitilmiş AI Modeli", "Tam White-Label Deneyimi", "7/24 Öncelikli Teknik Destek"]
        }
    };

    const selectedPlan = planData[plan];
    const summaryCard = document.getElementById('plan-summary-card');

    if (selectedPlan) {
        summaryCard.innerHTML = `
            <div class="summary-header">
                <h3>Sipariş Özeti</h3>
            </div>
            
            <div class="selected-plan-card">
                <div class="plan-icon-wrapper"><i class="fas fa-crown"></i></div>
                <div class="plan-text">
                    <h4>${selectedPlan.name}</h4>
                    <p>Aylık Abonelik</p>
                </div>
            </div>

            <div class="summary-divider"></div>

            <div class="cost-line">
                <span>Ara Toplam</span>
                <span>${selectedPlan.price}</span>
            </div>
            <div class="cost-line">
                <span>KDV (%20)</span>
                <span>Dahil</span>
            </div>

            <div class="summary-divider"></div>

            <div class="total-line">
                <span>Ödenecek Tutar</span>
                <span class="final-price">${selectedPlan.price}</span>
            </div>

            <button type="submit" form="paymentForm" class="btn-submit" id="submit-button">
                <span id="submit-button-text">
                    <i class="fas fa-lock"></i> Ödemeyi Tamamla
                </span>
            </button>

            <div class="trust-badges-vertical">
                <div class="badge"><i class="fas fa-shield-alt"></i> 256-Bit SSL ile korunmaktadır.</div>
                <div class="badge"><i class="fab fa-cc-visa"></i> <i class="fab fa-cc-mastercard"></i></div>
            </div>
        `;
    }

    const paymentForm = document.getElementById('paymentForm');
    paymentForm.noValidate = true; // Tarayıcı doğrulamalarını devre dışı bırak

    // --- GİRİŞ FORMATLAMA (INPUT MASKS) ---
    setupInputFormatters();

    function setupInputFormatters() {
        // 1. Vergi Numarası: Sadece rakam, Max 11 hane
        const taxInput = document.getElementById('taxNumber');
        if (taxInput) {
            taxInput.addEventListener('input', function(e) {
                // Sadece rakamları al
                let val = this.value.replace(/[^0-9]/g, '');
                // 11 haneden fazlasını kes
                if (val.length > 11) val = val.substring(0, 11);
                this.value = val;
            });
        }

        // 2. Telefon: 0 ile başlar, 0XXX XXX XX XX formatı
        const phoneInput = document.getElementById('contactPhone');
        if (phoneInput) {
            // Başlangıçta boşsa 0 koyma, kullanıcı yazmaya başlayınca hallet
            phoneInput.addEventListener('input', function(e) {
                // Sadece rakamları temizle
                let val = this.value.replace(/[^0-9]/g, '');

                // Eğer kullanıcı sildiyse ve boşsa, boş bırak
                if (val.length === 0) {
                    this.value = '';
                    return;
                }

                // İlk karakter 0 değilse, başına 0 ekle
                if (val.charAt(0) !== '0') {
                    val = '0' + val;
                }

                // Maksimum uzunluk (0 + 10 rakam = 11 rakam)
                if (val.length > 11) val = val.substring(0, 11);

                // Formatlama: 0555 555 55 55
                let formatted = val;
                if (val.length > 4) {
                    formatted = val.substring(0, 4) + ' ' + val.substring(4);
                }
                if (val.length > 7) {
                    formatted = formatted.substring(0, 8) + ' ' + formatted.substring(8);
                }
                if (val.length > 10) {
                    formatted = formatted.substring(0, 11) + ' ' + formatted.substring(11);
                }

                this.value = formatted;
            });

            // Odaklanınca 0 yoksa ekle (opsiyonel, kullanıcı deneyimi için)
            phoneInput.addEventListener('focus', function() {
                if (this.value === '') this.value = '0';
            });
        }

        // 3. Kredi Kartı: 4'erli gruplar
        const cardInput = document.getElementById('cardNumber');
        const cardIcon = document.getElementById('card-type-icon');
        if (cardInput) {
            cardInput.addEventListener('input', function(e) {
                let val = this.value.replace(/[^0-9]/g, '');
                if (val.length > 16) val = val.substring(0, 16);

                // Kart Tipi Algılama
                if (val.startsWith('4')) {
                    cardIcon.className = 'fab fa-cc-visa';
                    cardIcon.style.color = '#1a1f71';
                } else if (val.startsWith('5')) {
                    cardIcon.className = 'fab fa-cc-mastercard';
                    cardIcon.style.color = '#eb001b';
                } else {
                    cardIcon.className = 'fas fa-credit-card';
                    cardIcon.style.color = '#cbd5e1';
                }

                // Boşluk Ekleme
                let formatted = '';
                for (let i = 0; i < val.length; i++) {
                    if (i > 0 && i % 4 === 0) formatted += ' ';
                    formatted += val[i];
                }
                this.value = formatted;
            });
        }

        // 4. Son Kullanma Tarihi: AA / YY
        const expiryInput = document.getElementById('cardExpiry');
        if (expiryInput) {
            expiryInput.addEventListener('input', function(e) {
                let val = this.value.replace(/[^0-9]/g, '');
                if (val.length > 4) val = val.substring(0, 4);

                if (val.length >= 2) {
                    this.value = val.substring(0, 2) + ' / ' + val.substring(2);
                } else {
                    this.value = val;
                }
            });
        }

        // 5. CVC: Max 4 hane
        const cvcInput = document.getElementById('cardCVC');
        if (cvcInput) {
            cvcInput.addEventListener('input', function(e) {
                let val = this.value.replace(/[^0-9]/g, '');
                if (val.length > 4) val = val.substring(0, 4);
                this.value = val;
            });
        }
    }

    paymentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors();

        if (!validatePaymentForm()) {
            return;
        }

        // Ödeme işlemi simülasyonu
        const submitButton = document.getElementById('submit-button');
        submitButton.textContent = 'İşleniyor...';
        submitButton.disabled = true;

        setTimeout(() => {
            Swal.fire({
                icon: 'success',
                title: 'Abonelik Başarılı!',
                text: `${selectedPlan.name} planına aboneliğiniz başarıyla oluşturuldu. Yönetim paneline yönlendiriliyorsunuz.`,
                timer: 3000,
                showConfirmButton: false,
                customClass: { popup: 'modern-swal-popup' }
            }).then(() => {
                window.location.href = 'admin-dashboard.html';
            });
        }, 1500);
    });

    function validatePaymentForm() {
        let isValid = true;
        const fields = [
            { id: 'clinicName', name: 'Klinik Adı' },
            { id: 'taxNumber', name: 'Vergi Numarası' },
            { id: 'contactName', name: 'Yetkili Adı' },
            { id: 'contactEmail', name: 'E-posta' },
            { id: 'contactPhone', name: 'Telefon' },
            { id: 'cardName', name: 'Kart Üzerindeki İsim' },
            { id: 'cardNumber', name: 'Kart Numarası' },
            { id: 'cardExpiry', name: 'Son K. Tarihi' },
            { id: 'cardCVC', name: 'CVC' }
        ];

        fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (!input.value.trim()) {
                showError(input, `${field.name} alanı zorunludur.`);
                isValid = false;
            }
        });

        return isValid;
    }

    function showError(inputElement, message) {
        const formGroup = inputElement.closest('.form-group');
        let errorElement = formGroup.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            formGroup.appendChild(errorElement);
        }
        errorElement.textContent = message;
        inputElement.classList.add('is-invalid');
    }

    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    }

    // --- Modal Logic ---
    const modal = document.getElementById('legal-modal');
    const modalBody = document.getElementById('modal-body');
    const btnTerms = document.getElementById('btn-terms');
    const btnPrivacy = document.getElementById('btn-privacy');
    const btnClose = document.querySelector('.modal-close');

    function openModal(url, title) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        modalBody.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Yükleniyor...</div>';

        fetch(url)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                let content = doc.querySelector('.legal-card') || doc.querySelector('main') || doc.querySelector('.container');
                
                if (content) {
                    modalBody.innerHTML = content.innerHTML;
                    
                    // Initialize Tabs
                    const firstTab = modalBody.querySelector('.tab-btn');
                    if (firstTab) {
                        // Manually trigger the first tab
                        const tabName = firstTab.getAttribute('onclick').match(/'([^']+)'/)[1];
                        openTab(null, tabName);
                        firstTab.classList.add('active');
                    }

                    // Re-bind click events to ensure they work in modal context
                    const tabBtns = modalBody.querySelectorAll('.tab-btn');
                    tabBtns.forEach(btn => {
                        btn.onclick = function(event) {
                            const tabName = this.getAttribute('onclick').match(/'([^']+)'/)[1];
                            openTab(event, tabName);
                        };
                    });

                } else {
                    modalBody.innerHTML = '<p class="error-message">İçerik yüklenemedi.</p>';
                }
            })
            .catch(err => {
                console.error('Modal fetch error:', err);
                modalBody.innerHTML = '<p class="error-message">Bir hata oluştu. Lütfen daha sonra tekrar deneyin.</p>';
            });
    }

    // Tab Switching Logic (Global for Modal)
    window.openTab = function(evt, tabName) {
        var i, tabcontent, tablinks;
        // Search within modalBody to avoid conflicts
        tabcontent = modalBody.getElementsByClassName("legal-content-pane");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
            tabcontent[i].classList.remove("active");
        }
        tablinks = modalBody.getElementsByClassName("tab-btn");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].classList.remove("active");
        }
        
        const targetTab = modalBody.querySelector(`#${tabName}`);
        if (targetTab) {
            targetTab.style.display = "block";
            targetTab.classList.add("active");
        }
        
        if (evt && evt.currentTarget) {
            evt.currentTarget.classList.add("active");
        }
    };

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }

    if (btnTerms) {
        btnTerms.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('terms-of-use.html');
        });
    }

    if (btnPrivacy) {
        btnPrivacy.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('privacy-policy.html');
        });
    }

    if (btnClose) {
        btnClose.addEventListener('click', closeModal);
    }

    // Close on click outside content
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
});
