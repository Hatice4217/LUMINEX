// --- Bu dosya, özel, aranabilir ve klavye ile kontrol edilebilir bir dropdown (açılır menü) bileşeni oluşturur. ---

/**
 * Paneldeki seçenekleri (items) oluşturur ve HTML'e ekler.
 * @param {HTMLElement} panel - Seçeneklerin ekleneceği div elementi.
 * @param {Array<Object>} items - {id, name} formatında seçenek nesneleri dizisi.
 */
function populatePanel(panel, items) {
    if (!panel || !items) return;
    panel.innerHTML = '';
    items.forEach(item => {
        if (item && item.id !== undefined && item.name) {
            const div = document.createElement('div');
            div.className = 'custom-option';
            div.textContent = item.name;
            div.dataset.id = item.id;
            panel.appendChild(div);
        }
    });
}

/**
 * Paneli, input'a girilen metne göre filtreler.
 * @param {HTMLElement} panel - Filtrelenecek seçenekleri içeren panel.
 * @param {string} filter - Filtreleme metni.
 */
function filterPanel(panel, filter) {
    if (!panel) return;
    panel.querySelectorAll('.custom-option').forEach(opt => {
        opt.style.display = opt.textContent.toLowerCase().includes(filter.toLowerCase()) ? '' : 'none';
    });
}

/**
 * Klavye navigasyonu için seçeneklerin vurgusunu günceller.
 * @param {Array<HTMLElement>} options - Vurgulanacak seçenek (option) elementleri.
 * @param {number} index - Vurgulanacak olan seçeneğin indeksi.
 */
function updateHighlight(options, index) {
    options.forEach((option, i) => {
        if (i === index) {
            option.classList.add('highlighted');
            // Elemanı görünür alana kaydır
            option.scrollIntoView({ block: 'nearest' });
        } else {
            option.classList.remove('highlighted');
        }
    });
}

/**
 * Özel dropdown'ı kuran ana fonksiyon.
 * @param {Object} config - Kurulum ayarları: { input, panel, onSelect, items }.
 */
export function setupCustomDropdown(config) {
    const { input, panel, onSelect, items } = config;
    if (!input || !panel) return;

    populatePanel(panel, items || []);

    let highlightedIndex = -1;

    // Input'a odaklanıldığında paneli göster
    input.addEventListener('focus', () => {
        panel.classList.add('visible');
        filterPanel(panel, ''); // Tüm seçenekleri göster
    });

    // Input odağını kaybettiğinde paneli gizle (küçük bir gecikmeyle)
    input.addEventListener('blur', () => {
        setTimeout(() => {
            panel.classList.remove('visible');
            highlightedIndex = -1; // Vurguyu sıfırla
        }, 200); // Tıklama olayının çalışmasına izin vermek için 200ms bekle
    });

    // Input'a yazı yazıldığında paneli filtrele
    input.addEventListener('input', () => {
        panel.classList.add('visible');
        filterPanel(panel, input.value);
        if (onSelect) {
            onSelect({ id: null, name: input.value });
        }
    });

    // Bir seçeneğe tıklandığında değeri al ve paneli gizle
    panel.addEventListener('mousedown', (e) => {
        if (e.target && e.target.classList.contains('custom-option')) {
            e.preventDefault(); // blur olayının erken tetiklenmesini engelle
            const item = { id: e.target.dataset.id, name: e.target.textContent };
            input.value = item.name;
            if (onSelect) {
                onSelect(item);
            }
            panel.classList.remove('visible');
            highlightedIndex = -1;
        }
    });

    // Klavye (ok tuşları ve Enter) ile navigasyon
    input.addEventListener('keydown', (e) => {
        const options = Array.from(panel.querySelectorAll('.custom-option:not([style*="display: none"])'));
        if (options.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                highlightedIndex = (highlightedIndex + 1) % options.length;
                updateHighlight(options, highlightedIndex);
                break;
            case 'ArrowUp':
                e.preventDefault();
                highlightedIndex = (highlightedIndex - 1 + options.length) % options.length;
                updateHighlight(options, highlightedIndex);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex > -1) {
                    // Vurgulanan seçeneğe programatik olarak 'mousedown' olayı gönder
                    const mousedownEvent = new MouseEvent('mousedown', { bubbles: true });
                    options[highlightedIndex].dispatchEvent(mousedownEvent);
                } else {
                    // Eğer bir şey seçili değilse sadece paneli kapat
                    panel.classList.remove('visible');
                }
                break;
            case 'Escape':
                panel.classList.remove('visible');
                highlightedIndex = -1;
                break;
        }
    });
    
    // Mouse wheel ile panelin içinde scroll yapabilme
    panel.addEventListener('wheel', (e) => {
        e.stopPropagation(); 
    }, { passive: true });
}