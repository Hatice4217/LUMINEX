import { setupHeader } from './utils/header-manager.js';
import {
    getLoggedInUser,
    getActiveProfile,
    getLuminexUsers,
    getLuminexAppointments,
    setLuminexAppointments,
    getLuminexBlockedSlots,
    getLocalStorageItem // Added import
} from './utils/storage-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    setupHeader();

    // --- Set Min/Max Date for Appointment (MHRS Logic: 15 Days) ---
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 15); // Limit to 15 days ahead

    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayString = `${yyyy}-${mm}-${dd}`;
    
    const maxYyyy = maxDate.getFullYear();
    const maxMm = String(maxDate.getMonth() + 1).padStart(2, '0');
    const maxDd = String(maxDate.getDate()).padStart(2, '0');
    const maxDateString = `${maxYyyy}-${maxMm}-${maxDd}`;

    const appointmentDateInput = document.getElementById('appointmentDate');
    if (appointmentDateInput) {
        appointmentDateInput.min = todayString;
        appointmentDateInput.max = maxDateString; // Apply 15-day restriction

        appointmentDateInput.addEventListener('input', function(e) {
            const date = new Date(e.target.value);
            const day = date.getUTCDay(); // Use getUTCDay() to avoid timezone issues
            
            if (day === 6 || day === 0) { // 6 = Saturday, 0 = Sunday
                Swal.fire({
                    icon: 'error',
                    title: 'Hafta Sonu Seçilemez',
                    text: 'Randevular sadece hafta içi günlerde alınabilir. Lütfen geçerli bir tarih seçin.',
                    confirmButtonColor: '#673ab7'
                });
                e.target.value = ''; // Reset the date
            }
        });
    }

    // --- Data ---
    const provinces = [ { id: "adana", name: "Adana" }, { id: "adiyaman", name: "Adıyaman" }, { id: "afyonkarahisar", name: "Afyonkarahisar" }, { id: "agri", name: "Ağrı" }, { id: "aksaray", name: "Aksaray" }, { id: "amasya", name: "Amasya" }, { id: "ankara", name: "Ankara" }, { id: "antalya", name: "Antalya" }, { id: "ardahan", name: "Ardahan" }, { id: "artvin", name: "Artvin" }, { id: "aydin", name: "Aydın" }, { id: "balikesir", name: "Balıkesir" }, { id: "bartin", name: "Bartın" }, { id: "batman", name: "Batman" }, { id: "bayburt", name: "Bayburt" }, { id: "bilecik", name: "Bilecik" }, { id: "bingol", name: "Bingöl" }, { id: "bitlis", name: "Bitlis" }, { id: "bolu", name: "Bolu" }, { id: "burdur", name: "Burdur" }, { id: "bursa", name: "Bursa" }, { id: "canakkale", name: "Çanakkale" }, { id: "cankiri", name: "Çankırı" }, { id: "corum", name: "Çorum" }, { id: "denizli", name: "Denizli" }, { id: "diyarbakir", name: "Diyarbakır" }, { id: "duzce", name: "Düzce" }, { id: "edirne", name: "Edirne" }, { id: "elazig", name: "Elazığ" }, { id: "erzincan", name: "Erzincan" }, { id: "erzurum", name: "Erzurum" }, { id: "eskisehir", name: "Eskişehir" }, { id: "gaziantep", name: "Gaziantep" }, { id: "giresun", name: "Giresun" }, { id: "gumushane", name: "Gümüşhane" }, { id: "hakkari", name: "Hakkâri" }, { id: "hatay", name: "Hatay" }, { id: "igdir", name: "Iğdır" }, { id: "isparta", name: "Isparta" }, { id: "istanbul", name: "İstanbul" }, { id: "izmir", name: "İzmir" }, { id: "kahramanmaras", name: "Kahramanmaraş" }, { id: "karabuk", name: "Karabük" }, { id: "karaman", name: "Karaman" }, { id: "kars", name: "Kars" }, { id: "kastamonu", name: "Kastamonu" }, { id: "kayseri", name: "Kayseri" }, { id: "kirikkale", name: "Kırıkkale" }, { id: "kirklareli", name: "Kırklareli" }, { id: "kirsehir", name: "Kırşehir" }, { id: "kilis", name: "Kilis" }, { id: "kocaeli", name: "Kocaeli" }, { id: "konya", name: "Konya" }, { id: "kutahya", name: "Kütahya" }, { id: "malatya", name: "Malatya" }, { id: "manisa", name: "Manisa" }, { id: "mardin", name: "Mardin" }, { id: "mersin", name: "Mersin" }, { id: "mugla", name: "Muğla" }, { id: "mus", name: "Muş" }, { id: "nevsehir", name: "Nevşehir" }, { id: "nigde", name: "Niğde" }, { id: "ordu", name: "Ordu" }, { id: "osmaniye", name: "Osmaniye" }, { id: "rize", name: "Rize" }, { id: "sakarya", name: "Sakarya" }, { id: "samsun", name: "Samsun" }, { id: "sanliurfa", name: "Şanlıurfa" }, { id: "siirt", name: "Siirt" }, { id: "sinop", name: "Sinop" }, { id: "sivas", name: "Sivas" }, { id: "sirnak", name: "Şırnak" }, { id: "tekirdag", name: "Tekirdağ" }, { id: "tokat", name: "Tokat" }, { id: "trabzon", name: "Trabzon" }, { id: "tunceli", name: "Tunceli" }, { id: "usak", name: "Uşak" }, { id: "van", name: "Van" }, { id: "yalova", name: "Yalova" }, { id: "yozgat", name: "Yozgat" }, { id: "zonguldak", name: "Zonguldak" } ];
    
    const districts = [
        // A
        { id: 'seyhan', name: 'Seyhan', provinceId: 'adana' }, { id: 'yuregir', name: 'Yüreğir', provinceId: 'adana' },
        { id: 'adiyaman_merkez', name: 'Merkez', provinceId: 'adiyaman' }, { id: 'kahta', name: 'Kâhta', provinceId: 'adiyaman' },
        { id: 'afyon_merkez', name: 'Merkez', provinceId: 'afyonkarahisar' }, { id: 'sandikli', name: 'Sandıklı', provinceId: 'afyonkarahisar' },
        { id: 'agri_merkez', name: 'Merkez', provinceId: 'agri' }, { id: 'dogubayazit', name: 'Doğubayazıt', provinceId: 'agri' },
        { id: 'aksaray_merkez', name: 'Merkez', provinceId: 'aksaray' }, { id: 'ortakoy', name: 'Ortaköy', provinceId: 'aksaray' },
        { id: 'amasya_merkez', name: 'Merkez', provinceId: 'amasya' }, { id: 'merzifon', name: 'Merzifon', provinceId: 'amasya' },
        { id: 'cankaya', name: 'Çankaya', provinceId: 'ankara' }, { id: 'yenimahalle', name: 'Yenimahalle', provinceId: 'ankara' },
        { id: 'kepez', name: 'Kepez', provinceId: 'antalya' }, { id: 'muratpasa', name: 'Muratpaşa', provinceId: 'antalya' },
        { id: 'ardahan_merkez', name: 'Merkez', provinceId: 'ardahan' }, { id: 'gole', name: 'Göle', provinceId: 'ardahan' },
        { id: 'artvin_merkez', name: 'Merkez', provinceId: 'artvin' }, { id: 'hopa', name: 'Hopa', provinceId: 'artvin' },
        { id: 'aydin_efeler', name: 'Efeler', provinceId: 'aydin' }, { id: 'nazilli', name: 'Nazilli', provinceId: 'aydin' },
        // B
        { id: 'karesi', name: 'Karesi', provinceId: 'balikesir' }, { id: 'altieylul', name: 'Altıeylül', provinceId: 'balikesir' },
        { id: 'bartin_merkez', name: 'Merkez', provinceId: 'bartin' }, { id: 'ulus', name: 'Ulus', provinceId: 'bartin' },
        { id: 'batman_merkez', name: 'Merkez', provinceId: 'batman' }, { id: 'kozluk', name: 'Kozluk', provinceId: 'batman' },
        { id: 'bayburt_merkez', name: 'Merkez', provinceId: 'bayburt' }, { id: 'demirozu', name: 'Demirözü', provinceId: 'bayburt' },
        { id: 'bilecik_merkez', name: 'Merkez', provinceId: 'bilecik' }, { id: 'bozuyuk', name: 'Bozüyük', provinceId: 'bilecik' },
        { id: 'bingol_merkez', name: 'Merkez', provinceId: 'bingol' }, { id: 'solhan', name: 'Solhan', provinceId: 'bingol' },
        { id: 'tatvan', name: 'Tatvan', provinceId: 'bitlis' }, { id: 'bitlis_merkez', name: 'Merkez', provinceId: 'bitlis' },
        { id: 'bolu_merkez', name: 'Merkez', provinceId: 'bolu' }, { id: 'gerede', name: 'Gerede', provinceId: 'bolu' },
        { id: 'burdur_merkez', name: 'Merkez', provinceId: 'burdur' }, { id: 'bucak', name: 'Bucak', provinceId: 'burdur' },
        { id: 'osmangazi', name: 'Osmangazi', provinceId: 'bursa' }, { id: 'yildirim', name: 'Yıldırım', provinceId: 'bursa' },
        // C - Ç
        { id: 'canakkale_merkez', name: 'Merkez', provinceId: 'canakkale' }, { id: 'biga', name: 'Biga', provinceId: 'canakkale' },
        { id: 'cankiri_merkez', name: 'Merkez', provinceId: 'cankiri' }, { id: 'cerkes', name: 'Çerkeş', provinceId: 'cankiri' },
        { id: 'corum_merkez', name: 'Merkez', provinceId: 'corum' }, { id: 'sungurlu', name: 'Sungurlu', provinceId: 'corum' },
        // D
        { id: 'merkezefendi', name: 'Merkezefendi', provinceId: 'denizli' }, { id: 'pamukkale', name: 'Pamukkale', provinceId: 'denizli' },
        { id: 'kayapinar', name: 'Kayapınar', provinceId: 'diyarbakir' }, { id: 'baglar', name: 'Bağlar', provinceId: 'diyarbakir' },
        { id: 'duzce_merkez', name: 'Merkez', provinceId: 'duzce' }, { id: 'akcakoca', name: 'Akçakoca', provinceId: 'duzce' },
        // E
        { id: 'edirne_merkez', name: 'Merkez', provinceId: 'edirne' }, { id: 'kesan', name: 'Keşan', provinceId: 'edirne' },
        { id: 'elazig_merkez', name: 'Merkez', provinceId: 'elazig' }, { id: 'kovancilar', name: 'Kovancılar', provinceId: 'elazig' },
        { id: 'erzincan_merkez', name: 'Merkez', provinceId: 'erzincan' }, { id: 'tercan', name: 'Tercan', provinceId: 'erzincan' },
        { id: 'erzurum_yakutiye', name: 'Yakutiye', provinceId: 'erzurum' }, { id: 'erzurum_palandoken', name: 'Palandöken', provinceId: 'erzurum' },
        { id: 'eskisehir_odunpazari', name: 'Odunpazarı', provinceId: 'eskisehir' }, { id: 'eskisehir_tepebasi', name: 'Tepebaşı', provinceId: 'eskisehir' },
        // G
        { id: 'sahinbey', name: 'Şahinbey', provinceId: 'gaziantep' }, { id: 'sehitkamil', name: 'Şehitkamil', provinceId: 'gaziantep' },
        { id: 'giresun_merkez', name: 'Merkez', provinceId: 'giresun' }, { id: 'bulancak', name: 'Bulancak', provinceId: 'giresun' },
        { id: 'gumushane_merkez', name: 'Merkez', provinceId: 'gumushane' }, { id: 'kelkit', name: 'Kelkit', provinceId: 'gumushane' },
        // H
        { id: 'yuksekova', name: 'Yüksekova', provinceId: 'hakkari' }, { id: 'hakkari_merkez', name: 'Merkez', provinceId: 'hakkari' },
        { id: 'antakya', name: 'Antakya', provinceId: 'hatay' }, { id: 'iskenderun', name: 'İskenderun', provinceId: 'hatay' },
        // I - İ
        { id: 'igdir_merkez', name: 'Merkez', provinceId: 'igdir' }, { id: 'tuzluca', name: 'Tuzluca', provinceId: 'igdir' },
        { id: 'isparta_merkez', name: 'Merkez', provinceId: 'isparta' }, { id: 'yalvac', name: 'Yalvaç', provinceId: 'isparta' },
        { id: 'kadikoy', name: 'Kadıköy', provinceId: 'istanbul' }, { id: 'sisli', name: 'Şişli', provinceId: 'istanbul' },
        { id: 'konak', name: 'Konak', provinceId: 'izmir' }, { id: 'bornova', name: 'Bornova', provinceId: 'izmir' },
        // K
        { id: 'onikisubat', name: 'Onikişubat', provinceId: 'kahramanmaras' }, { id: 'dulkadiroglu', name: 'Dulkadiroğlu', provinceId: 'kahramanmaras' },
        { id: 'karabuk_merkez', name: 'Merkez', provinceId: 'karabuk' }, { id: 'safranbolu', name: 'Safranbolu', provinceId: 'karabuk' },
        { id: 'karaman_merkez', name: 'Merkez', provinceId: 'karaman' }, { id: 'ermenek', name: 'Ermenek', provinceId: 'karaman' },
        { id: 'kars_merkez', name: 'Merkez', provinceId: 'kars' }, { id: 'kagizman', name: 'Kağızman', provinceId: 'kars' },
        { id: 'kastamonu_merkez', name: 'Merkez', provinceId: 'kastamonu' }, { id: 'tosya', name: 'Tosya', provinceId: 'kastamonu' },
        { id: 'melikgazi', name: 'Melikgazi', provinceId: 'kayseri' }, { id: 'kocasinan', name: 'Kocasinan', provinceId: 'kayseri' },
        { id: 'kirikkale_merkez', name: 'Merkez', provinceId: 'kirikkale' }, { id: 'yahsihan', name: 'Yahşihan', provinceId: 'kirikkale' },
        { id: 'luleburgaz', name: 'Lüleburgaz', provinceId: 'kirklareli' }, { id: 'kirklareli_merkez', name: 'Merkez', provinceId: 'kirklareli' },
        { id: 'kirsehir_merkez', name: 'Merkez', provinceId: 'kirsehir' }, { id: 'kaman', name: 'Kaman', provinceId: 'kirsehir' },
        { id: 'kilis_merkez', name: 'Merkez', provinceId: 'kilis' }, { id: 'musabeyli', name: 'Musabeyli', provinceId: 'kilis' },
        { id: 'gebze', name: 'Gebze', provinceId: 'kocaeli' }, { id: 'izmit', name: 'İzmit', provinceId: 'kocaeli' },
        { id: 'selcuklu', name: 'Selçuklu', provinceId: 'konya' }, { id: 'karatay', name: 'Karatay', provinceId: 'konya' },
        { id: 'kutahya_merkez', name: 'Merkez', provinceId: 'kutahya' }, { id: 'tavsanli', name: 'Tavşanlı', provinceId: 'kutahya' },
        // L - M
        { id: 'yesilyurt', name: 'Yeşilyurt', provinceId: 'malatya' }, { id: 'battalgazi', name: 'Battalgazi', provinceId: 'malatya' },
        { id: 'sehzadeler', name: 'Şehzadeler', provinceId: 'manisa' }, { id: 'yunusemre', name: 'Yunusemre', provinceId: 'manisa' },
        { id: 'kiziltepe', name: 'Kızıltepe', provinceId: 'mardin' }, { id: 'artuklu', name: 'Artuklu', provinceId: 'mardin' },
        { id: 'tarsus', name: 'Tarsus', provinceId: 'mersin' }, { id: 'toroslar', name: 'Toroslar', provinceId: 'mersin' },
        { id: 'bodrum', name: 'Bodrum', provinceId: 'mugla' }, { id: 'fethiye', name: 'Fethiye', provinceId: 'mugla' },
        { id: 'mus_merkez', name: 'Merkez', provinceId: 'mus' }, { id: 'bulanik', name: 'Bulanık', provinceId: 'mus' },
        // N - O
        { id: 'nevsehir_merkez', name: 'Merkez', provinceId: 'nevsehir' }, { id: 'urgup', name: 'Ürgüp', provinceId: 'nevsehir' },
        { id: 'nigde_merkez', name: 'Merkez', provinceId: 'nigde' }, { id: 'bor', name: 'Bor', provinceId: 'nigde' },
        { id: 'altinordu', name: 'Altınordu', provinceId: 'ordu' }, { id: 'unye', name: 'Ünye', provinceId: 'ordu' },
        { id: 'osmaniye_merkez', name: 'Merkez', provinceId: 'osmaniye' }, { id: 'kadirli', name: 'Kadirli', provinceId: 'osmaniye' },
        // R - S
        { id: 'rize_merkez', name: 'Merkez', provinceId: 'rize' }, { id: 'cayeli', name: 'Çayeli', provinceId: 'rize' },
        { id: 'adapazari', name: 'Adapazarı', provinceId: 'sakarya' }, { id: 'serdivan', name: 'Serdivan', provinceId: 'sakarya' },
        { id: 'ilkadim', name: 'İlkadım', provinceId: 'samsun' }, { id: 'atakum', name: 'Atakum', provinceId: 'samsun' },
        { id: 'eyyubiye', name: 'Eyyübiye', provinceId: 'sanliurfa' }, { id: 'haliliye', name: 'Haliliye', provinceId: 'sanliurfa' },
        { id: 'siirt_merkez', name: 'Merkez', provinceId: 'siirt' }, { id: 'kurtalan', name: 'Kurtalan', provinceId: 'siirt' },
        { id: 'sinop_merkez', name: 'Merkez', provinceId: 'sinop' }, { id: 'boyabat', name: 'Boyabat', provinceId: 'sinop' },
        { id: 'sivas_merkez', name: 'Merkez', provinceId: 'sivas' }, { id: 'sarkisla', name: 'Şarkışla', provinceId: 'sivas' },
        { id: 'cizre', name: 'Cizre', provinceId: 'sirnak' }, { id: 'silopi', name: 'Silopi', provinceId: 'sirnak' },
        // T - U
        { id: 'corlu', name: 'Çorlu', provinceId: 'tekirdag' }, { id: 'suleymanpasa', name: 'Süleymanpaşa', provinceId: 'tekirdag' },
        { id: 'tokat_merkez', name: 'Merkez', provinceId: 'tokat' }, { id: 'erbaa', name: 'Erbaa', provinceId: 'tokat' },
        { id: 'ortahisar', name: 'Ortahisar', provinceId: 'trabzon' }, { id: 'akcaabat', name: 'Akçaabat', provinceId: 'trabzon' },
        { id: 'tunceli_merkez', name: 'Merkez', provinceId: 'tunceli' }, { id: 'pertek', name: 'Pertek', provinceId: 'tunceli' },
        { id: 'usak_merkez', name: 'Merkez', provinceId: 'usak' }, { id: 'banaz', name: 'Banaz', provinceId: 'usak' },
        // V - Y - Z
        { id: 'ipekyolu', name: 'İpekyolu', provinceId: 'van' }, { id: 'ercis', name: 'Erciş', provinceId: 'van' },
        { id: 'yalova_merkez', name: 'Merkez', provinceId: 'yalova' }, { id: 'ciftlikkoy', name: 'Çiftlikköy', provinceId: 'yalova' },
        { id: 'yozgat_merkez', name: 'Merkez', provinceId: 'yozgat' }, { id: 'sorgun', name: 'Sorgun', provinceId: 'yozgat' },
        { id: 'eregli', name: 'Ereğli', provinceId: 'zonguldak' }, { id: 'zonguldak_merkez', name: 'Merkez', provinceId: 'zonguldak' },
    ];

    const hospitals = [
        // Adana
        { id: 'adana_sehir', name: 'Adana Şehir Eğitim ve Araştırma Hastanesi', districtId: 'yuregir' },
        { id: 'adana_balcali', name: 'Çukurova Üniversitesi Tıp Fakültesi Balcalı Hastanesi', districtId: 'saricam' }, // Note: district 'saricam' needs to be in districts array if not already
        { id: 'adana_seyhan_devlet', name: 'Seyhan Devlet Hastanesi', districtId: 'seyhan' },
        { id: 'adana_ortadogu', name: 'Özel Adana Ortadoğu Hastanesi', districtId: 'yuregir' },
        { id: 'adana_medline', name: 'Özel Medline Adana Hastanesi', districtId: 'cukurova' }, // Note: district 'cukurova' needs to be in districts array
        { id: 'adana_numune', name: 'Adana Numune Eğitim ve Araştırma Hastanesi', districtId: 'yuregir' },

        // İstanbul (Sample)
        { id: 'ist_capa', name: 'İstanbul Üniversitesi Çapa Tıp Fakültesi Hastanesi', districtId: 'fatih' }, // Add 'fatih' to districts
        { id: 'ist_cerrahpasa', name: 'İstanbul Üniversitesi-Cerrahpaşa Tıp Fakültesi', districtId: 'fatih' },
        { id: 'ist_sisli_etfal', name: 'Şişli Hamidiye Etfal Eğitim ve Araştırma Hastanesi', districtId: 'sisli' },
        { id: 'ist_okmeydani', name: 'Okmeydanı Prof. Dr. Cemil Taşcıoğlu Şehir Hastanesi', districtId: 'sisli' },
        { id: 'ist_acibadem_maslak', name: 'Acıbadem Maslak Hastanesi', districtId: 'sariyer' }, // Add 'sariyer'
        { id: 'ist_medicana_kadikoy', name: 'Medicana Kadıköy Hastanesi', districtId: 'kadikoy' },
        { id: 'ist_cam_sakura', name: 'Başakşehir Çam ve Sakura Şehir Hastanesi', districtId: 'basaksehir' }, // Add 'basaksehir'

        // Ankara (Sample)
        { id: 'ank_hacettepe', name: 'Hacettepe Üniversitesi Tıp Fakültesi Hastanesi', districtId: 'altindag' }, // Add 'altindag'
        { id: 'ank_ibnisina', name: 'Ankara Üniversitesi İbni Sina Hastanesi', districtId: 'altindag' },
        { id: 'ank_sehir', name: 'Ankara Bilkent Şehir Hastanesi', districtId: 'cankaya' },
        { id: 'ank_guven', name: 'Özel Ankara Güven Hastanesi', districtId: 'cankaya' },
        { id: 'ank_memorial', name: 'Memorial Ankara Hastanesi', districtId: 'cankaya' },

        // İzmir (Sample)
        { id: 'izm_ege', name: 'Ege Üniversitesi Tıp Fakültesi Hastanesi', districtId: 'bornova' },
        { id: 'izm_dokuz_eylul', name: 'Dokuz Eylül Üniversitesi Hastanesi', districtId: 'balcova' }, // Add 'balcova'
        { id: 'izm_tepecik', name: 'İzmir Tepecik Eğitim ve Araştırma Hastanesi', districtId: 'konak' },
        { id: 'izm_kent', name: 'Özel Kent Hastanesi', districtId: 'cigli' }, // Add 'cigli'

        // Bursa (Sample)
        { id: 'bur_uludag', name: 'Bursa Uludağ Üniversitesi Sağlık Uygulama ve Araştırma Merkezi', districtId: 'nilufer' }, // Add 'nilufer'
        { id: 'bur_sehir', name: 'Bursa Şehir Hastanesi', districtId: 'nilufer' },
        { id: 'bur_yuksek_ihtisas', name: 'Bursa Yüksek İhtisas Eğitim ve Araştırma Hastanesi', districtId: 'yildirim' },

        // Antalya (Sample)
        { id: 'ant_akdeniz', name: 'Akdeniz Üniversitesi Hastanesi', districtId: 'konyaalti' }, // Add 'konyaalti'
        { id: 'ant_egitim', name: 'Antalya Eğitim ve Araştırma Hastanesi', districtId: 'muratpasa' },
        { id: 'ant_memorial', name: 'Memorial Antalya Hastanesi', districtId: 'kepez' },

        // Other Provinces - Generic Generation
        ...provinces.filter(p => !['adana', 'istanbul', 'ankara', 'izmir', 'bursa', 'antalya'].includes(p.id)).flatMap(p => {
            // Find a default district for this province if any, or fallback
            const provDistricts = districts.filter(d => d.provinceId === p.id);
            const districtId = provDistricts.length > 0 ? provDistricts[0].id : 'merkez_' + p.id;
            
            return [
                { id: `${p.id}_devlet`, name: `${p.name} Devlet Hastanesi`, districtId: districtId },
                { id: `${p.id}_uni`, name: `${p.name} Üniversitesi Eğitim ve Araştırma Hastanesi`, districtId: districtId },
                { id: `${p.id}_ozel`, name: `Özel ${p.name} Hastanesi`, districtId: districtId }
            ];
        })
    ];

    const branches = [
        { id: 'kardiyoloji', name: 'Kardiyoloji' },
        { id: 'dahiliye', name: 'Dahiliye' },
        { id: 'ortopedi', name: 'Ortopedi' },
        { id: 'goz', name: 'Göz Hastalıkları' },
        { id: 'cocuk_sagligi', name: 'Çocuk Sağlığı ve Hastalıkları' },
        { id: 'genel_cerrahi', name: 'Genel Cerrahi' },
        { id: 'kadin_dogum', name: 'Kadın Hastalıkları ve Doğum' },
        { id: 'kbb', name: 'Kulak Burun Boğaz' },
        { id: 'noroloji', name: 'Nöroloji' },
        { id: 'psikiyatri', name: 'Psikiyatri' },
        { id: 'uroloji', name: 'Üroloji' },
        { id: 'ftr', name: 'Fizik Tedavi ve Rehabilitasyon' },
        { id: 'dermatoloji', name: 'Dermatoloji' },
        { id: 'gogus_hastaliklari', name: 'Göğüs Hastalıkları' },
        { id: 'enfeksiyon', name: 'Enfeksiyon Hastalıkları' },
        { id: 'gastroenteroloji', name: 'Gastroenteroloji' },
        { id: 'endokrinoloji', name: 'Endokrinoloji' },
        { id: 'romatoloji', name: 'Romatoloji' },
        { id: 'nefroloji', name: 'Nefroloji' },
        { id: 'onkoloji', name: 'Onkoloji' },
        { id: 'anestezi', name: 'Anesteziyoloji ve Reanimasyon' }
    ].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    const dummyDoctorsData = [
    // Kardiyoloji
    {
        id: 'drkardiyo1',
        name: 'Dr. Ayşe Yılmaz',
        branch: 'Kardiyoloji',
        availability: 'Bugün 14:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F', // Female placeholder
        gender: 'female',
        tc: '10000000001',
        password: 'password123'
    },
    {
        id: 'drkardiyo2',
        name: 'Dr. Zeynep Demir',
        branch: 'Kardiyoloji',
        availability: 'Yarın 11:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F', // Female placeholder
        gender: 'female',
        tc: '10000000002',
        password: 'password123'
    },
    {
        id: 'drkardiyo3',
        name: 'Dr. Can Kaya',
        branch: 'Kardiyoloji',
        availability: 'Bugün 16:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M', // Male placeholder
        gender: 'male',
        tc: '10000000003',
        password: 'password123'
    },
    {
        id: 'drkardiyo4',
        name: 'Dr. Emre Aksoy',
        branch: 'Kardiyoloji',
        availability: 'Yarın 09:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M', // Male placeholder
        gender: 'male',
        tc: '10000000004',
        password: 'password123'
    },

    // Dahiliye
    {
        id: 'drdahiliye1',
        name: 'Dr. Elif Güneş',
        branch: 'Dahiliye',
        availability: 'Bugün 11:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F', // Female placeholder
        gender: 'female',
        tc: '10000000005',
        password: 'password123'
    },
    {
        id: 'drdahiliye2',
        name: 'Dr. Fatma Çelik',
        branch: 'Dahiliye',
        availability: 'Yarın 13:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F', // Female placeholder
        gender: 'female',
        tc: '10000000006',
        password: 'password123'
    },
    {
        id: 'drdahiliye3',
        name: 'Dr. Hakan Demir',
        branch: 'Dahiliye',
        availability: 'Bugün 10:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M', // Male placeholder
        gender: 'male',
        tc: '10000000007',
        password: 'password123'
    },
    {
        id: 'drdahiliye4',
        name: 'Dr. İsmail Kara',
        branch: 'Dahiliye',
        availability: 'Yarın 15:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M', // Male placeholder
        gender: 'male',
        tc: '10000000008',
        password: 'password123'
    },

    // Ortopedi
    {
        id: 'drortopedi1',
        name: 'Dr. Jale Öztürk',
        branch: 'Ortopedi',
        availability: 'Bugün 09:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F', // Female placeholder
        gender: 'female',
        tc: '10000000009',
        password: 'password123'
    },
    {
        id: 'drortopedi2',
        name: 'Dr. Mine Can',
        branch: 'Ortopedi',
        availability: 'Yarın 14:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F', // Female placeholder
        gender: 'female',
        tc: '10000000010',
        password: 'password123'
    },
    {
        id: 'drortopedi3',
        name: 'Dr. Okan Yılmaz',
        branch: 'Ortopedi',
        availability: 'Bugün 13:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M', // Male placeholder
        gender: 'male',
        tc: '10000000011',
        password: 'password123'
    },
    {
        id: 'drortopedi4',
        name: 'Dr. Polat Tuna',
        branch: 'Ortopedi',
        availability: 'Yarın 10:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M', // Male placeholder
        gender: 'male',
        tc: '10000000012',
        password: 'password123'
    },

    // Göz Hastalıkları
    {
        id: 'drgoz1',
        name: 'Dr. Rabia Güneş',
        branch: 'Göz Hastalıkları',
        availability: 'Bugün 10:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F', // Female placeholder
        gender: 'female',
        tc: '10000000013',
        password: 'password123'
    },
    {
        id: 'drgoz2',
        name: 'Dr. Sema Erdem',
        branch: 'Göz Hastalıkları',
        availability: 'Yarın 12:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000014',
        password: 'password123'
    },
    {
        id: 'drgoz3',
        name: 'Dr. Tarık Çelik',
        branch: 'Göz Hastalıkları',
        availability: 'Bugün 15:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000015',
        password: 'password123'
    },
    {
        id: 'drgoz4',
        name: 'Dr. Ufuk Yücel',
        branch: 'Göz Hastalıkları',
        availability: 'Yarın 11:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000016',
        password: 'password123'
    },

    // Çocuk Sağlığı ve Hastalıkları
    {
        id: 'drped1',
        name: 'Dr. Pınar Akın',
        branch: 'Çocuk Sağlığı ve Hastalıkları',
        availability: 'Bugün 09:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000017',
        password: 'password123'
    },
    {
        id: 'drped2',
        name: 'Dr. Gamze Yılmaz',
        branch: 'Çocuk Sağlığı ve Hastalıkları',
        availability: 'Yarın 10:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000018',
        password: 'password123'
    },
    {
        id: 'drped3',
        name: 'Dr. Serkan Can',
        branch: 'Çocuk Sağlığı ve Hastalıkları',
        availability: 'Bugün 14:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000019',
        password: 'password123'
    },
    {
        id: 'drped4',
        name: 'Dr. Tolga Demir',
        branch: 'Çocuk Sağlığı ve Hastalıkları',
        availability: 'Yarın 16:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000020',
        password: 'password123'
    },

    // Genel Cerrahi
    {
        id: 'drgenelcer1',
        name: 'Dr. Hande Güler',
        branch: 'Genel Cerrahi',
        availability: 'Bugün 08:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000021',
        password: 'password123'
    },
    {
        id: 'drgenelcer2',
        name: 'Dr. İpek Kara',
        branch: 'Genel Cerrahi',
        availability: 'Yarın 11:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000022',
        password: 'password123'
    },
    {
        id: 'drgenelcer3',
        name: 'Dr. Kemal Aydın',
        branch: 'Genel Cerrahi',
        availability: 'Bugün 13:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000023',
        password: 'password123'
    },
    {
        id: 'drgenelcer4',
        name: 'Dr. Levent Yılmaz',
        branch: 'Genel Cerrahi',
        availability: 'Yarın 15:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000024',
        password: 'password123'
    },

    // Kadın Hastalıkları ve Doğum
    {
        id: 'drkadin1',
        name: 'Dr. Meltem Deniz',
        branch: 'Kadın Hastalıkları ve Doğum',
        availability: 'Bugün 10:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000025',
        password: 'password123'
    },
    {
        id: 'drkadin2',
        name: 'Dr. Neşe Aktaş',
        branch: 'Kadın Hastalıkları ve Doğum',
        availability: 'Yarın 12:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000026',
        password: 'password123'
    },
    {
        id: 'drkadin3',
        name: 'Dr. Onur Can',
        branch: 'Kadın Hastalıkları ve Doğum',
        availability: 'Bugün 14:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000027',
        password: 'password123'
    },
    {
        id: 'drkadin4',
        name: 'Dr. Poyraz Efe',
        branch: 'Kadın Hastalıkları ve Doğum',
        availability: 'Yarın 16:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000028',
        password: 'password123'
    },

    // Kulak Burun Boğaz
    {
        id: 'drkbb1',
        name: 'Dr. Rengin Su',
        branch: 'Kulak Burun Boğaz',
        availability: 'Bugün 09:30',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000029',
        password: 'password123'
    },
    {
        id: 'drkbb2',
        name: 'Dr. Selin Toprak',
        branch: 'Kulak Burun Boğaz',
        availability: 'Yarın 11:30',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000030',
        password: 'password123'
    },
    {
        id: 'drkbb3',
        name: 'Dr. Tufan Deniz',
        branch: 'Kulak Burun Boğaz',
        availability: 'Bugün 13:30',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000031',
        password: 'password123'
    },
    {
        id: 'drkbb4',
        name: 'Dr. Uğur Can',
        branch: 'Kulak Burun Boğaz',
        availability: 'Yarın 15:30',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000032',
        password: 'password123'
    },

    // Nöroloji
    {
        id: 'drnoroloji1',
        name: 'Dr. Vildan Işık',
        branch: 'Nöroloji',
        availability: 'Bugün 10:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000033',
        password: 'password123'
    },
    {
        id: 'drnoroloji2',
        name: 'Dr. Yasemin Toprak',
        branch: 'Nöroloji',
        availability: 'Yarın 12:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000034',
        password: 'password123'
    },
    {
        id: 'drnoroloji3',
        name: 'Dr. Zafer Mert',
        branch: 'Nöroloji',
        availability: 'Bugün 14:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000035',
        password: 'password123'
    },
    {
        id: 'drnoroloji4',
        name: 'Dr. Altan Güneş',
        branch: 'Nöroloji',
        availability: 'Yarın 16:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000036',
        password: 'password123'
    },

    // Psikiyatri
    {
        id: 'drpsikiyatri1',
        name: 'Dr. Berna Aksoy',
        branch: 'Psikiyatri',
        availability: 'Bugün 09:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000037',
        password: 'password123'
    },
    {
        id: 'drpsikiyatri2',
        name: 'Dr. Ceyda Deniz',
        branch: 'Psikiyatri',
        availability: 'Yarın 10:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000038',
        password: 'password123'
    },
    {
        id: 'drpsikiyatri3',
        name: 'Dr. Deniz Ege',
        branch: 'Psikiyatri',
        availability: 'Bugün 14:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000039',
        password: 'password123'
    },
    {
        id: 'drpsikiyatri4',
        name: 'Dr. Erdem Fırat',
        branch: 'Psikiyatri',
        availability: 'Yarın 16:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000040',
        password: 'password123'
    },

    // Üroloji
    {
        id: 'drüroloji1',
        name: 'Dr. Fulya Gök',
        branch: 'Üroloji',
        availability: 'Bugün 08:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000041',
        password: 'password123'
    },
    {
        id: 'drüroloji2',
        name: 'Dr. Gizem Hazar',
        branch: 'Üroloji',
        availability: 'Yarın 11:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000042',
        password: 'password123'
    },
    {
        id: 'drüroloji3',
        name: 'Dr. Haluk Işık',
        branch: 'Üroloji',
        availability: 'Bugün 13:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000043',
        password: 'password123'
    },
    {
        id: 'drüroloji4',
        name: 'Dr. İlker Jale',
        branch: 'Üroloji',
        availability: 'Yarın 15:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000044',
        password: 'password123'
    },

    // Fizik Tedavi ve Rehabilitasyon
    {
        id: 'drftr1',
        name: 'Dr. Kader Kılıç',
        branch: 'Fizik Tedavi ve Rehabilitasyon',
        availability: 'Bugün 10:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000045',
        password: 'password123'
    },
    {
        id: 'drftr2',
        name: 'Dr. Lale Mavi',
        branch: 'Fizik Tedavi ve Rehabilitasyon',
        availability: 'Yarın 12:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000046',
        password: 'password123'
    },
    {
        id: 'drftr3',
        name: 'Dr. Mert Nazlı',
        branch: 'Fizik Tedavi ve Rehabilitasyon',
        availability: 'Bugün 14:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000047',
        password: 'password123'
    },
    {
        id: 'drftr4',
        name: 'Dr. Necati Ozan',
        branch: 'Fizik Tedavi ve Rehabilitasyon',
        availability: 'Yarın 16:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000048',
        password: 'password123'
    },

    // Dermatoloji
    {
        id: 'drderma1',
        name: 'Dr. Özlem Peker',
        branch: 'Dermatoloji',
        availability: 'Bugün 09:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000049',
        password: 'password123'
    },
    {
        id: 'drderma2',
        name: 'Dr. Pelin Rüzgar',
        branch: 'Dermatoloji',
        availability: 'Yarın 10:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000050',
        password: 'password123'
    },
    {
        id: 'drderma3',
        name: 'Dr. Rıza Sarı',
        branch: 'Dermatoloji',
        availability: 'Bugün 14:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000051',
        password: 'password123'
    },
    {
        id: 'drderma4',
        name: 'Dr. Savaş Tekin',
        branch: 'Dermatoloji',
        availability: 'Yarın 16:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000052',
        password: 'password123'
    },

    // Göğüs Hastalıkları
    {
        id: 'drgogus1',
        name: 'Dr. Tuğçe Uysal',
        branch: 'Göğüs Hastalıkları',
        availability: 'Bugün 11:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000053',
        password: 'password123'
    },
    {
        id: 'drgogus2',
        name: 'Dr. Umut Vural',
        branch: 'Göğüs Hastalıkları',
        availability: 'Yarın 13:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000054',
        password: 'password123'
    },
    {
        id: 'drgogus3',
        name: 'Dr. Volkan Yücel',
        branch: 'Göğüs Hastalıkları',
        availability: 'Bugün 10:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000055',
        password: 'password123'
    },
    {
        id: 'drgogus4',
        name: 'Dr. Yaman Zengin',
        branch: 'Göğüs Hastalıkları',
        availability: 'Yarın 15:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000056',
        password: 'password123'
    },

    // Enfeksiyon Hastalıkları
    {
        id: 'drenfeksiyon1',
        name: 'Dr. Zeynep Arslan',
        branch: 'Enfeksiyon Hastalıkları',
        availability: 'Bugün 09:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000057',
        password: 'password123'
    },
    {
        id: 'drenfeksiyon2',
        name: 'Dr. Ayşe Bilgin',
        branch: 'Enfeksiyon Hastalıkları',
        availability: 'Yarın 10:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000058',
        password: 'password123'
    },
    {
        id: 'drenfeksiyon3',
        name: 'Dr. Burak Can',
        branch: 'Enfeksiyon Hastalıkları',
        availability: 'Bugün 14:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000059',
        password: 'password123'
    },
    {
        id: 'drenfeksiyon4',
        name: 'Dr. Cem Demir',
        branch: 'Enfeksiyon Hastalıkları',
        availability: 'Yarın 16:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000060',
        password: 'password123'
    },

    // Gastroenteroloji
    {
        id: 'drgastro1',
        name: 'Dr. Derya Efe',
        branch: 'Gastroenteroloji',
        availability: 'Bugün 10:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000061',
        password: 'password123'
    },
    {
        id: 'drgastro2',
        name: 'Dr. Esra Fırat',
        branch: 'Gastroenteroloji',
        availability: 'Yarın 12:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000062',
        password: 'password123'
    },
    {
        id: 'drgastro3',
        name: 'Dr. Fatih Gök',
        branch: 'Gastroenteroloji',
        availability: 'Bugün 14:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000063',
        password: 'password123'
    },
    {
        id: 'drgastro4',
        name: 'Dr. Gökhan Hazar',
        branch: 'Gastroenteroloji',
        availability: 'Yarın 16:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000064',
        password: 'password123'
    },

    // Endokrinoloji
    {
        id: 'drendo1',
        name: 'Dr. Hande Işık',
        branch: 'Endokrinoloji',
        availability: 'Bugün 09:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000065',
        password: 'password123'
    },
    {
        id: 'drendo2',
        name: 'Dr. İrem Jale',
        branch: 'Endokrinoloji',
        availability: 'Yarın 10:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000066',
        password: 'password123'
    },
    {
        id: 'drendo3',
        name: 'Dr. Kaan Kılıç',
        branch: 'Endokrinoloji',
        availability: 'Bugün 14:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000067',
        password: 'password123'
    },
    {
        id: 'drendo4',
        name: 'Dr. Levent Mavi',
        branch: 'Endokrinoloji',
        availability: 'Yarın 16:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000068',
        password: 'password123'
    },

    // Romatoloji
    {
        id: 'drroma1',
        name: 'Dr. Meltem Nazlı',
        branch: 'Romatoloji',
        availability: 'Bugün 11:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000069',
        password: 'password123'
    },
    {
        id: 'drroma2',
        name: 'Dr. Neşe Ozan',
        branch: 'Romatoloji',
        availability: 'Yarın 13:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000070',
        password: 'password123'
    },
    {
        id: 'drroma3',
        name: 'Dr. Onur Peker',
        branch: 'Romatoloji',
        availability: 'Bugün 10:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000071',
        password: 'password123'
    },
    {
        id: 'drroma4',
        name: 'Dr. Polat Rüzgar',
        branch: 'Romatoloji',
        availability: 'Yarın 15:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000072',
        password: 'password123'
    },

    // Nefroloji
    {
        id: 'drnefro1',
        name: 'Dr. Rabia Sarı',
        branch: 'Nefroloji',
        availability: 'Bugün 09:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000073',
        password: 'password123'
    },
    {
        id: 'drnefro2',
        name: 'Dr. Sema Tekin',
        branch: 'Nefroloji',
        availability: 'Yarın 10:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000074',
        password: 'password123'
    },
    {
        id: 'drnefro3',
        name: 'Dr. Tarık Uysal',
        branch: 'Nefroloji',
        availability: 'Bugün 14:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000075',
        password: 'password123'
    },
    {
        id: 'drnefro4',
        name: 'Dr. Ufuk Vural',
        branch: 'Nefroloji',
        availability: 'Yarın 16:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000076',
        password: 'password123'
    },

    // Onkoloji
    {
        id: 'dronko1',
        name: 'Dr. Vildan Yücel',
        branch: 'Onkoloji',
        availability: 'Bugün 11:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000077',
        password: 'password123'
    },
    {
        id: 'dronko2',
        name: 'Dr. Yasemin Zengin',
        branch: 'Onkoloji',
        availability: 'Yarın 13:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000078',
        password: 'password123'
    },
    {
        id: 'dronko3',
        name: 'Dr. Zafer Akın',
        branch: 'Onkoloji',
        availability: 'Bugün 10:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000079',
        password: 'password123'
    },
    {
        id: 'dronko4',
        name: 'Dr. Altan Bilgin',
        branch: 'Onkoloji',
        availability: 'Yarın 15:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000080',
        password: 'password123'
    },

    // Anesteziyoloji ve Reanimasyon
    {
        id: 'dranestezi1',
        name: 'Dr. Berna Can',
        branch: 'Anesteziyoloji ve Reanimasyon',
        availability: 'Bugün 09:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000081',
        password: 'password123'
    },
    {
        id: 'dranestezi2',
        name: 'Dr. Ceyda Demir',
        branch: 'Anesteziyoloji ve Reanimasyon',
        availability: 'Yarın 10:00',
        photo: 'https://via.placeholder.com/80/FFC0CB/000000?text=F',
        gender: 'female',
        tc: '10000000082',
        password: 'password123'
    },
    {
        id: 'dranestezi3',
        name: 'Dr. Deniz Efe',
        branch: 'Anesteziyoloji ve Reanimasyon',
        availability: 'Bugün 14:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000083',
        password: 'password123'
    },
    {
        id: 'dranestezi4',
        name: 'Dr. Erdem Fırat',
        branch: 'Anesteziyoloji ve Reanimasyon',
        availability: 'Yarın 16:00',
        photo: 'https://via.placeholder.com/80/ADD8E6/000000?text=M',
        gender: 'male',
        tc: '10000000084',
        password: 'password123'
    }
];

    // Map branch names to branch IDs and assign hospital IDs
    const branchNameToIdMap = new Map(branches.map(b => [b.name, b.id]));
    const availableHospitalIds = hospitals.map(h => h.id);
    let hospitalIndex = 0;

    // Prepare dummy doctors data
    const preparedDummyDoctors = dummyDoctorsData.map(doctor => {
        const branchId = branchNameToIdMap.get(doctor.branch);
        // Ensure hospitalId is always present, use dummy if not available
        const assignedHospitalId = availableHospitalIds[hospitalIndex % availableHospitalIds.length];
        hospitalIndex++; // Increment for each dummy doctor

        return { 
            ...doctor, 
            id: doctor.id, 
            branchId: branchId, 
            hospitalId: assignedHospitalId,
            availability: doctor.availability || 'Müsait',
            photo: doctor.photo || (doctor.gender === 'female' ? 'https://via.placeholder.com/80/FFC0CB/000000?text=F' : 'https://via.placeholder.com/80/ADD8E6/000000?text=M')
        };
    }).filter(doctor => doctor.branchId !== undefined);

    // Get real doctors from local storage
    const allUsers = getLuminexUsers();
    const luminexDoctors = allUsers
        .filter(user => user.role === 'doctor')
        .map(doctor => {
            const branchId = branchNameToIdMap.get(doctor.branch);
            // If the doctor object from localStorage doesn't have a hospitalId, assign a random one from available hospitals.
            const assignedHospitalId = doctor.hospitalId || availableHospitalIds[Math.floor(Math.random() * availableHospitalIds.length)];
            
            // Add a default photo and availability if not present
            const photoUrl = doctor.photo || (doctor.gender === 'female' ? 'https://via.placeholder.com/80/FFC0CB/000000?text=F' : 'https://via.placeholder.com/80/ADD8E6/000000?text=M');

            return {
                id: doctor.id, 
                name: doctor.name,
                branch: doctor.branch,
                branchId: branchId,
                hospitalId: assignedHospitalId, 
                availability: 'Müsait', 
                photo: photoUrl,
                gender: doctor.gender || 'unknown', 
                tc: doctor.tc,
                password: doctor.password 
            };
        }).filter(doctor => doctor.branchId !== undefined);

    // Combine dummy and real doctors
    const doctorsMap = new Map();
    preparedDummyDoctors.forEach(doctor => doctorsMap.set(doctor.id, doctor));
    // Real doctors override dummy doctors if IDs conflict
    luminexDoctors.forEach(doctor => doctorsMap.set(doctor.id, doctor)); 

    const doctors = Array.from(doctorsMap.values());

    // MHRS Style Time Slot Generator
    function getMHRSTimeSlots() {
        const slots = [];
        // Morning Session: 09:00 - 12:00
        for (let h = 9; h < 12; h++) {
            ['00', '15', '30', '45'].forEach(m => slots.push(`${h.toString().padStart(2, '0')}:${m}`));
        }
        // Afternoon Session: 13:00 - 16:45 (End at 17:00)
        for (let h = 13; h < 17; h++) {
            ['00', '15', '30', '45'].forEach(m => slots.push(`${h.toString().padStart(2, '0')}:${m}`));
        }
        return slots;
    }

    const mhrsTimeSlots = getMHRSTimeSlots();

    // --- State & Elements ---
    const loggedInUser = getLoggedInUser(); // The parent account
    const activeProfile = getActiveProfile(); // The currently selected profile

    if (!loggedInUser || !activeProfile) {
        // Redirect to login but keep current parameters (branch, dep, etc.)
        const currentParams = window.location.search;
        window.location.href = 'login.html' + currentParams;
        return;
    }

    const selection = { provinceId: null, districtId: null, hospitalId: null, branchId: null, doctorId: null, date: null, time: null, patientTc: activeProfile.tc, patientName: activeProfile.name }; // Default to active profile
    const formElements = {
        province: { input: document.getElementById('provinceInput'), panel: document.getElementById('provinceOptionsPanel') },
        district: { input: document.getElementById('districtInput'), panel: document.getElementById('districtOptionsPanel') },
        hospital: { input: document.getElementById('hospitalInput'), panel: document.getElementById('hospitalOptionsPanel') },
        branch: { input: document.getElementById('branchInput'), panel: document.getElementById('branchOptionsPanel') },
        doctor: { input: document.getElementById('doctorInput'), panel: document.getElementById('doctorOptionsPanel') },
        date: document.getElementById('appointmentDate'),
        timeSlots: document.getElementById('timeSlots'),
        healthInfo: document.getElementById('healthInfo'),
        patientSelect: document.getElementById('patientSelect'), // Add patient select
        patientSelectionGroup: document.getElementById('patientSelectionGroup'), // Add patient selection group
        submitButton: document.querySelector('#appointmentForm button[type="submit"]'),
        summary: { 
            doctor: document.getElementById('summaryDoctor'), 
            date: document.getElementById('summaryDate'), 
            time: document.getElementById('summaryTime'), 
            patient: document.getElementById('summaryPatient'),
            healthInfo: document.getElementById('summaryHealthInfo')
        }
    };

    // --- Main Functions ---
    function populatePanel(panel, items) {
        if (!panel) return;
        panel.innerHTML = '';
        if (!items) return;
        items.forEach(item => {
            if (item && item.id && item.name) {
                const div = document.createElement('div');
                div.className = 'custom-option';
                div.textContent = item.name;
                div.dataset.id = item.id;
                panel.appendChild(div);
            }
        });
    }

    function setupCustomDropdown(config) {
        const { input, panel, onSelect, items } = config;
        if (!input || !panel) return;

        populatePanel(panel, items || []);

        input.addEventListener('focus', () => {
            console.log(`Focus on ${input.id}. Making panel visible.`);
            panel.classList.add('visible');
            filterPanel(panel, '');
        });

        input.addEventListener('input', () => {
            console.log(`Input in ${input.id}. Making panel visible and filtering.`);
            panel.classList.add('visible');
            filterPanel(panel, input.value);
            if (input.value === '') {
                onSelect(null);
            }
        });

        panel.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('custom-option')) {
                const item = { id: e.target.dataset.id, name: e.target.textContent };
                input.value = item.name;
                panel.classList.remove('visible');
                onSelect(item);
            }
        });
    }

    function filterPanel(panel, filter) {
        if (!panel) return;
        panel.querySelectorAll('.custom-option').forEach(opt => {
            opt.style.display = opt.textContent.toLowerCase().includes(filter.toLowerCase()) ? '' : 'none';
        });
    }

    function getSafeTranslation(key) {
        return window.getTranslation ? window.getTranslation(key) : key;
    }

    function resetFields(fieldsToReset) {
        fieldsToReset.forEach(fieldName => {
            const keyId = fieldName.endsWith('s') ? fieldName : fieldName + 'Id';
            if (selection.hasOwnProperty(keyId)) {
                selection[keyId] = null;
            }

            const el = formElements[fieldName];
            if (el) {
                if (el.input) {
                    el.input.value = '';
                    el.input.disabled = true;
                    if(el.panel) populatePanel(el.panel, []);
                } else if (fieldName === 'date') {
                    el.value = '';
                    el.disabled = true;
                } else if (fieldName === 'timeSlots') {
                    el.innerHTML = `<p class="time-slot-placeholder">${getSafeTranslation('selectDateFirst')}</p>`;
                }
            }
        });
        updateSummary();
        updateUIState();
    }

    function updateUIState() {
        formElements.district.input.disabled = !selection.provinceId;
        formElements.hospital.input.disabled = !selection.districtId;
        formElements.doctor.input.disabled = !selection.branchId; 
        
        // Dinamik Placeholder Güncellemesi (UX İyileştirmesi)
        if (selection.branchId) {
            formElements.doctor.input.placeholder = getSafeTranslation('selectDoctor') || 'Doktor Seçiniz';
        } else {
            formElements.doctor.input.placeholder = getSafeTranslation('selectHospitalAndBranch') || 'Hastane ve Branş Seçiniz';
        }

        formElements.date.disabled = !selection.doctorId;
        formElements.submitButton.disabled = !selection.doctorId || !selection.date || !selection.time;
    }
    
    function updateSummary() {
        const notSelected = getSafeTranslation('notSelected');
        const notEntered = getSafeTranslation('notEntered');

        formElements.summary.doctor.textContent = formElements.doctor.input.value || notSelected;
        formElements.summary.date.textContent = selection.date || notSelected;
        formElements.summary.time.textContent = selection.time || notSelected;
        if (formElements.summary.patient) {
            formElements.summary.patient.textContent = selection.patientName || notSelected;
        }
        if (formElements.summary.healthInfo) {
            const healthInfoVal = formElements.healthInfo.value.trim();
            formElements.summary.healthInfo.textContent = healthInfoVal || notEntered;
        }
    }

    // Add listener for health info to update summary in real-time
    if (formElements.healthInfo) {
        formElements.healthInfo.addEventListener('input', updateSummary);
    }

    function populatePatientSelect() {
        // The dropdown is populated based on the logged-in parent's family, which we get from localStorage for the latest data.
        const allUsers = getLuminexUsers();
        const parentUserData = allUsers.find(user => user.tc === loggedInUser.tc); // Use user.tc
        
        if (parentUserData && parentUserData.children && parentUserData.children.length > 0) {
            formElements.patientSelectionGroup.style.display = 'block'; // Show the dropdown
            
            const myselfText = getSafeTranslation('myself') || 'Kendim';
            let optionsHtml = `<option value="${parentUserData.tc}" data-name="${parentUserData.name}">${myselfText} (${parentUserData.name})</option>`; // Use tc and name
            parentUserData.children.forEach(child => {
                optionsHtml += `<option value="${child.tc}" data-name="${child.name}">${child.name}</option>`; // Use tc and name
            });
            formElements.patientSelect.innerHTML = optionsHtml;

            // Pre-select the dropdown with the currently active profile
            formElements.patientSelect.value = activeProfile.tc;

            formElements.patientSelect.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];
                selection.patientTc = selectedOption.value;
                selection.patientName = selectedOption.dataset.name;
                updateSummary(); // Update summary if needed
            });
        } else {
            formElements.patientSelectionGroup.style.display = 'none'; // Hide if no children
        }
    }

    function onProvinceSelect(item) {
        const newId = item ? item.id : null;
        if (selection.provinceId === newId) return;
        selection.provinceId = newId;
        resetFields(['district', 'hospital', 'doctor', 'date', 'timeSlots']);
        if (selection.provinceId) {
            const filtered = districts.filter(d => d.provinceId === selection.provinceId);
            populatePanel(formElements.district.panel, filtered);
        }
    }

    function onDistrictSelect(item) {
        const newId = item ? item.id : null;
        if (selection.districtId === newId) return;
        selection.districtId = newId;
        resetFields(['hospital', 'doctor', 'date', 'timeSlots']);
        if (selection.districtId) {
            // Merge static hospitals with admin-added hospitals from storage
            const adminHospitals = getLocalStorageItem('luminexHospitals') || [];
            
            // Map admin hospitals to match the dropdown structure (id, name, districtId) if needed
            // Admin hospitals have 'district' name stored, we need to match it to districtId or filter by name
            // The static list uses 'districtId' (e.g., 'seyhan'). Admin list has 'district' (e.g., 'Seyhan').
            // We need to find the district ID for admin hospitals based on their district name.
            
            const mappedAdminHospitals = adminHospitals.map(h => {
                // Find the district object that matches the admin hospital's district name
                // Note: h.district might be "Seyhan", districts array has name "Seyhan" and id "seyhan"
                const dist = districts.find(d => d.name === h.district && d.provinceId === selection.provinceId);
                return {
                    id: h.id,
                    name: h.name,
                    districtId: dist ? dist.id : null
                };
            }).filter(h => h.districtId); // Only keep those we could map

            const allHospitals = [...hospitals, ...mappedAdminHospitals];
            
            // Filter by selected district ID
            const filtered = allHospitals.filter(h => h.districtId === selection.districtId);
            
            // Remove duplicates based on ID just in case
            const uniqueHospitals = Array.from(new Map(filtered.map(item => [item.id, item])).values());
            
            populatePanel(formElements.hospital.panel, uniqueHospitals);
        }
    }

    function onHospitalSelect(item) {
        const newId = item ? item.id : null;
        if (selection.hospitalId === newId) return;
        selection.hospitalId = newId;
        // Doctor list is not dependent on hospital, so we don't call updateDoctors().
        // We only reset subsequent fields.
        resetFields(['date', 'timeSlots']);
    }

    function onBranchSelect(item) {
        const newId = item ? item.id : null;
        if (selection.branchId === newId) return;
        selection.branchId = newId;
        resetFields(['doctor', 'date', 'timeSlots']);
        updateDoctors();
    }

    function onDoctorSelect(item) {
        selection.doctorId = item ? item.id : null;
        resetFields(['date', 'timeSlots']);
        updateSummary();
        updateUIState();
    }

    function updateDoctors() {
        const panel = formElements.doctor.panel;
        populatePanel(panel, []);
        if (selection.branchId) { // Only check for branchId
            const filtered = doctors
                .filter(d => d.branchId === selection.branchId)
                .sort((a, b) => a.name.localeCompare(b.name, 'tr')); // Sort doctors alphabetically
            populatePanel(panel, filtered);
        }
    }

    function generateTimeSlots() {
        const container = formElements.timeSlots;
        container.innerHTML = '';
        selection.time = null;
        if (selection.doctorId && selection.date) {
            const blockedSlots = getLuminexBlockedSlots();
            
            mhrsTimeSlots.forEach(slot => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'btn btn-outline-primary time-slot';
                button.textContent = slot;

                // Check if blocked
                const isBlocked = blockedSlots.some(b => 
                    b.doctorId === selection.doctorId && 
                    b.date === selection.date && 
                    b.time === slot
                );

                // Check if taken by appointment (optional, to be safe)
                const allApps = getLuminexAppointments();
                const isTaken = allApps.some(app => 
                    app.doctorId === selection.doctorId && 
                    app.date === selection.date && 
                    app.time === slot
                );

                if (isBlocked || isTaken) {
                    button.disabled = true;
                    button.classList.add('blocked'); // Will style this gray
                    if (isBlocked) button.title = "Doktor bu saatte müsait değil.";
                    if (isTaken) button.title = "Bu saat dolu.";
                } else {
                    button.addEventListener('click', function() {
                        if (container.querySelector('.selected')) {
                            container.querySelector('.selected').classList.remove('selected');
                        }
                        this.classList.add('selected');
                        selection.time = this.textContent;
                        updateSummary();
                        updateUIState();
                    });
                }
                container.appendChild(button);
            });
        } else {
            container.innerHTML = '<p class="time-slot-placeholder">Lütfen doktor ve tarih seçimi yapınız.</p>';
        }
        updateSummary();
    }

    // --- Function to prefill form from URL or Session Storage ---
    function prefillFormFromURL() {
        const params = new URLSearchParams(window.location.search);
        const doctorId = params.get('doctorId');
        const branchName = params.get('branchName');
        let branchIdParam = params.get('branch'); // From symptom checker URL

        // 1. Check Session Storage (Priority for Login Redirects)
        const recommendedBranchId = sessionStorage.getItem('recommendedBranch');
        if (recommendedBranchId) {
            console.log("Found recommended branch in storage:", recommendedBranchId);
            branchIdParam = recommendedBranchId;
            // Clear it so it doesn't stick forever, but maybe keep it for a moment if page reloads? 
            // Better to clear it once consumed.
            sessionStorage.removeItem('recommendedBranch'); 
            sessionStorage.removeItem('recommendedBranchName'); 
        }

        let selectedBranch = null;

        // 2. Try to find by ID first
        if (branchIdParam) {
            selectedBranch = branches.find(b => b.id === branchIdParam);
        }
        
        // 3. Fallback to Name if ID not found/provided
        if (!selectedBranch && branchName) {
            const decodedBranchName = decodeURIComponent(branchName);
            selectedBranch = branches.find(b => b.name === decodedBranchName);
        }

        if (selectedBranch) {
            console.log("Prefilling branch:", selectedBranch.name);
            // Set branch
            selection.branchId = selectedBranch.id;
            formElements.branch.input.value = selectedBranch.name;
            
            // Force population of doctors
            updateDoctors(); 
            
            // If doctorId is also present, select the doctor
            if (doctorId) {
                const doctor = doctors.find(d => d.id === doctorId && d.branchId === selectedBranch.id);
                if (doctor) {
                    selection.doctorId = doctor.id;
                    formElements.doctor.input.value = doctor.name;
                }
            }
        }
        
        // Final UI refresh to enable inputs and update placeholders
        updateUIState();
        updateSummary();
    }

    // --- Event Listeners ---
    document.addEventListener('click', (e) => {
        if (e.target && !e.target.closest('.custom-select-wrapper')) {
            document.querySelectorAll('.custom-options-panel').forEach(panel => {
                if(panel) panel.classList.remove('visible');
            });
        }
    });

    formElements.date.addEventListener('change', (e) => {
        selection.date = e.target.value;
        generateTimeSlots();
        updateUIState();
    });

    formElements.submitButton.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent actual form submission

        if (selection.doctorId && selection.date && selection.time) {
            const doctorName = formElements.doctor.input.value;
            const healthInfo = formElements.healthInfo.value.trim(); // Get health info

            // Check if the slot is manually blocked by the doctor
            const blockedSlots = getLuminexBlockedSlots();
            const isBlocked = blockedSlots.some(b => 
                b.doctorId === selection.doctorId && 
                b.date === selection.date && 
                b.time === selection.time
            );

            if (isBlocked) {
                Swal.fire({
                    icon: 'error',
                    title: 'Randevu Kapalı',
                    text: 'Bu randevu saati doktor tarafından kapatılmıştır. Lütfen başka bir zaman seçiniz.',
                    confirmButtonText: 'Tamam'
                });
                return;
            }

            // Check for existing appointments to prevent double-booking
            const existingAppointments = getLuminexAppointments();
            const isDoubleBooked = existingAppointments.some(app =>
                app.doctor === doctorName &&
                app.date === selection.date &&
                app.time === selection.time
            );

            if (isDoubleBooked) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Randevu Çakışması!',
                    text: 'Seçtiğiniz doktor, tarih ve saat için başka bir randevu bulunmaktadır. Lütfen farklı bir zaman dilimi seçin.',
                    confirmButtonText: 'Tamam',
                    customClass: {
                        popup: 'modern-swal-popup',
                        title: 'modern-swal-title',
                        content: 'modern-swal-content',
                        confirmButton: 'modern-swal-confirm-button'
                    },
                    showClass: {
                        popup: 'swal2-show',
                        backdrop: 'swal2-backdrop-show',
                        icon: 'swal2-icon-show'
                    },
                    hideClass: {
                        popup: 'swal2-hide',
                        backdrop: 'swal2-backdrop-hide',
                        icon: 'swal2-icon-hide'
                    }
                });
                return; // Stop the booking process
            }
            
            // Save to local storage
            const aiDiagnosis = sessionStorage.getItem('lastAiDiagnosis');
            const aiDescription = sessionStorage.getItem('lastAiDescription');

            const newAppointment = {
                id: `app-${Date.now()}`,
                userTc: loggedInUser.tc, // TC of the logged-in user (parent)
                patientTc: selection.patientTc, // TC of the actual patient (self or child)
                patientName: selection.patientName, // Name of the actual patient (self or child)
                doctorId: selection.doctorId,
                doctor: doctorName,
                branch: formElements.branch.input.value,
                date: selection.date,
                time: selection.time,
                status: 'Onaylandı',
                healthInfo: healthInfo,
                aiSummary: aiDiagnosis ? { title: aiDiagnosis, desc: aiDescription } : null,
                isDummy: false // Explicitly mark as not a dummy appointment
            };
            
            existingAppointments.push(newAppointment);
            setLuminexAppointments(existingAppointments); // Use utility function

            // Clear AI info after use
            sessionStorage.removeItem('lastAiDiagnosis');
            sessionStorage.removeItem('lastAiDescription');

            Swal.fire({
                icon: 'success',
                title: 'Randevu Başarılı!',
                html: `<strong>Hasta:</strong> ${selection.patientName}<br><strong>Doktor:</strong> ${doctorName}<br><strong>Tarih:</strong> ${selection.date}<br><strong>Saat:</strong> ${selection.time}`,
                confirmButtonText: 'Harika!',
                customClass: {
                    popup: 'modern-swal-popup',
                    title: 'modern-swal-title',
                    content: 'modern-swal-content',
                    confirmButton: 'modern-swal-confirm-button'
                },
                showClass: {
                    popup: 'swal2-show',
                    backdrop: 'swal2-backdrop-show',
                    icon: 'swal2-icon-show'
                },
                hideClass: {
                    popup: 'swal2-hide',
                    backdrop: 'swal2-backdrop-hide',
                    icon: 'swal2-icon-hide'
                }
            }).then(() => {
                const params = new URLSearchParams(window.location.search);
                const isRescheduling = params.get('reschedule') === 'true';
                const oldAppointmentId = params.get('appointmentId');

                if (isRescheduling && oldAppointmentId) {
                    let allAppointments = getLuminexAppointments();
                    allAppointments = allAppointments.filter(app => app.id !== oldAppointmentId);
                    setLuminexAppointments(allAppointments);
                }

                // Redirect to the appointments page
                window.location.href = 'my-appointments.html'; 
            });

        } else {
            Swal.fire({
                icon: 'error',
                title: 'Eksik Bilgi',
                text: 'Lütfen randevu almak için tüm alanları doldurun.',
            });
        }
    });

    // --- Initial Setup ---
    populatePatientSelect(); // Call to populate patient selection dropdown
    setupCustomDropdown({ input: formElements.province.input, panel: formElements.province.panel, items: provinces, onSelect: onProvinceSelect });
    setupCustomDropdown({ input: formElements.district.input, panel: formElements.district.panel, items: [], onSelect: onDistrictSelect });
    setupCustomDropdown({ input: formElements.hospital.input, panel: formElements.hospital.panel, items: [], onSelect: onHospitalSelect });
    setupCustomDropdown({ input: formElements.branch.input, panel: formElements.branch.panel, items: branches, onSelect: onBranchSelect });
    setupCustomDropdown({ input: formElements.doctor.input, panel: formElements.doctor.panel, items: [], onSelect: onDoctorSelect });
    
    resetFields(['district', 'hospital', 'doctor', 'date', 'timeSlots']);
    updateUIState();
    updateSummary();
    prefillFormFromURL(); // Call the new function here
});
