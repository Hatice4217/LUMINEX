// js/utils/storage-utils.js
import { 
    initialLuminexAppointments, 
    dummyNotifications, 
    dummyRadiologyResults, 
    dummyDoctors,
    branches,
    initialLuminexTestResults,
    initialLuminexPrescriptions // Added initialLuminexPrescriptions import
} from './data.js';

export function getLocalStorageItem(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error(`Error parsing localStorage item "${key}":`, e);
        return null;
    }
}

export function setLocalStorageItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Error setting localStorage item "${key}":`, e);
    }
}

export function removeLocalStorageItem(key) {
    localStorage.removeItem(key);
}

export function getSessionStorageItem(key) {
    try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error(`Error parsing sessionStorage item "${key}":`, e);
        return null;
    }
}

export function setSessionStorageItem(key, value) {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Error setting sessionStorage item "${key}":`, e);
    }
}

export function removeSessionStorageItem(key) {
    sessionStorage.removeItem(key);
}

// Specific storage functions for Luminex project related to user session
export function getActiveProfile() {
    return getSessionStorageItem('activeProfile');
}

export function setActiveProfile(profile) {
    setSessionStorageItem('activeProfile', profile);
}

export function removeActiveProfile() {
    removeSessionStorageItem('activeProfile');
}

export function getLoggedInUser() {
    return getSessionStorageItem('loggedInUser');
}

export function setLoggedInUser(user) {
    setSessionStorageItem('loggedInUser', user);
}

export function removeLoggedInUser() {
    removeSessionStorageItem('loggedInUser');
}

// --- Provinces and Districts ---
export const provinces = [ { id: "adana", name: "Adana" }, { id: "adiyaman", name: "Adıyaman" }, { id: "afyonkarahisar", name: "Afyonkarahisar" }, { id: "agri", name: "Ağrı" }, { id: "aksaray", name: "Aksaray" }, { id: "amasya", name: "Amasya" }, { id: "ankara", name: "Ankara" }, { id: "antalya", name: "Antalya" }, { id: "ardahan", name: "Ardahan" }, { id: "artvin", name: "Artvin" }, { id: "aydin", name: "Aydın" }, { id: "balikesir", name: "Balıkesir" }, { id: "bartin", name: "Bartın" }, { id: "batman", name: "Batman" }, { id: "bayburt", name: "Bayburt" }, { id: "bilecik", name: "Bilecik" }, { id: "bingol", name: "Bingöl" }, { id: "bitlis", name: "Bitlis" }, { id: "bolu", name: "Bolu" }, { id: "burdur", name: "Burdur" }, { id: "bursa", name: "Bursa" }, { id: "canakkale", name: "Çanakkale" }, { id: "cankiri", name: "Çankırı" }, { id: "corum", name: "Çorum" }, { id: "denizli", name: "Denizli" }, { id: "diyarbakir", name: "Diyarbakır" }, { id: "duzce", name: "Düzce" }, { id: "edirne", name: "Edirne" }, { id: "elazig", name: "Elazığ" }, { id: "erzincan", name: "Erzincan" }, { id: "erzurum", name: "Erzurum" }, { id: "eskisehir", name: "Eskişehir" }, { id: "gaziantep", name: "Gaziantep" }, { id: "giresun", name: "Giresun" }, { id: "gumushane", name: "Gümüşhane" }, { id: "hakkari", name: "Hakkâri" }, { id: "hatay", name: "Hatay" }, { id: "igdir", name: "Iğdır" }, { id: "isparta", name: "Isparta" }, { id: "istanbul", name: "İstanbul" }, { id: "izmir", name: "İzmir" }, { id: "kahramanmaras", name: "Kahramanmaraş" }, { id: "karabuk", name: "Karabük" }, { id: "karaman", name: "Karaman" }, { id: "kars", name: "Kars" }, { id: "kastamonu", name: "Kastamonu" }, { id: "kayseri", name: "Kayseri" }, { id: "kirikkale", name: "Kırıkkale" }, { id: "kirklareli", name: "Kırklareli" }, { id: "kirsehir", name: "Kırşehir" }, { id: "kilis", name: "Kilis" }, { id: "kocaeli", name: "Kocaeli" }, { id: "konya", name: "Konya" }, { id: "kutahya", name: "Kütahya" }, { id: "malatya", name: "Malatya" }, { id: "manisa", name: "Manisa" }, { id: "mardin", name: "Mardin" }, { id: "mersin", name: "Mersin" }, { id: "mugla", name: "Muğla" }, { id: "mus", name: "Muş" }, { id: "nevsehir", name: "Nevşehir" }, { id: "nigde", name: "Niğde" }, { id: "ordu", name: "Ordu" }, { id: "osmaniye", name: "Osmaniye" }, { id: "rize", name: "Rize" }, { id: "sakarya", name: "Sakarya" }, { id: "samsun", name: "Samsun" }, { id: "sanliurfa", name: "Şanlıurfa" }, { id: "siirt", name: "Siirt" }, { id: "sinop", name: "Sinop" }, { id: "sivas", name: "Sivas" }, { id: "sirnak", name: "Şırnak" }, { id: "tekirdag", name: "Tekirdağ" }, { id: "tokat", name: "Tokat" }, { id: "trabzon", name: "Trabzon" }, { id: "tunceli", name: "Tunceli" }, { id: "usak", name: "Uşak" }, { id: "van", name: "Van" }, { id: "yalova", name: "Yalova" }, { id: "yozgat", name: "Yozgat" }, { id: "zonguldak", name: "Zonguldak" } ];

export const districts = [
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
    { id: 'kirsehir_merkez', name: 'Merkez', provinceId: 'kirsehir' }, { id: 'kaman', name: 'Kaman', provinceId: 'kaman' },
    { id: 'kilis_merkez', name: 'Merkez', provinceId: 'kilis' }, { id: 'musabeyli', name: 'Musabeyli', provinceId: 'kilis' },
    { id: 'gebze', name: 'Gebze', provinceId: 'kocaeli' }, { id: 'izmit', name: 'İzmit', provinceId: 'kocaeli' },
    { id: 'selcuklu', name: 'Selçuklu', provinceId: 'konya' }, { id: 'karatay', name: 'Karatay', provinceId: 'konya' },
    { id: 'kutahya_merkez', name: 'Merkez', provinceId: 'kutahya' }, { id: 'tavsanli', name: 'Tavşanlı', provinceId: 'kutahya' },
    // L - M
    { id: 'yesilyurt', name: 'Yeşilyurt', provinceId: 'malatya' }, { id: 'battalgazi', name: 'Battalgazi', provinceId: 'malatya' },
    { id: 'sehzadeler', name: 'Şehzadeler', provinceId: 'manisa' }, { id: 'yunusemre', name: 'Yunusemre', provinceId: 'manisa' },
    { id: 'kiziltepe', name: 'Kızıltepe', provinceId: 'mardin' }, { id: 'artuklu', name: 'Artuklu', provinceId: 'mardin' },
    { id: 'mersin_tarsus_medicalpark', name: 'Medical Park Tarsus Hastanesi', districtId: 'tarsus' }, { id: 'mersin_toroslar_devlet', name: 'Mersin Toros Devlet Hastanesi', districtId: 'toroslar' },
    { id: 'mugla_bodrum_memorial', name: 'Memorial Bodrum Hastanesi', districtId: 'bodrum' }, { id: 'mugla_fethiye_devlet', name: 'Fethiye Devlet Hastanesi', districtId: 'fethiye' },
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

// Hospital Image Pool
export const hospitalImages = [
    'https://r.resimlink.com/dK5k_xM_gY8.png', // Example 1
    'https://r.resimlink.com/dK5k_L1_uP.png', // Example 2
    'https://r.resimlink.com/dK5k_D1_Ue.png', // Example 3
    'https://r.resimlink.com/dK5k_e6_Wd3.png', // Example 4
    'https://r.resimlink.com/dK5k_C7_S4Q.png', // Example 5
    'https://r.resimlink.com/dK5k_wY_yQx.png', // Example 6
    'https://r.resimlink.com/dK5k_qH_N0h.png', // Example 7
    'https://r.resimlink.com/dK5k_xZ_e93.png'  // Example 8
];

// Generate dynamic hospital data
function generateInitialHospitals() {
    const generatedHospitals = [];
    let hospitalCounter = 1;

    // Example: Create 2-3 hospitals for Istanbul, Ankara, Izmir, Adana
    const targetProvinces = ['istanbul', 'ankara', 'izmir', 'adana', 'bursa', 'antalya', 'gaziantep', 'hatay', 'kayseri', 'konya'];

    targetProvinces.forEach(pId => {
        const relevantDistricts = districts.filter(d => d.provinceId === pId);
        const provinceName = provinces.find(p => p.id === pId)?.name || pId;

        // Create 2 hospitals per target province
        for (let i = 0; i < 2; i++) {
            const district = relevantDistricts[Math.floor(Math.random() * relevantDistricts.length)];
            if (!district) continue; // Skip if no district found

            const hospitalName = `${provinceName} ${i === 0 ? 'Şehir Hastanesi' : 'Özel Sağlık Merkezi'} ${hospitalCounter}`;
            generatedHospitals.push({
                id: `hosp-${hospitalCounter.toString().padStart(3, '0')}`,
                name: hospitalName,
                address: `${district.name}, ${provinceName}`,
                phone: `0${Math.floor(Math.random() * 899) + 100} ${Math.floor(Math.random() * 899) + 100} ${Math.floor(Math.random() * 89) + 10}`,
                city: provinceName,
                district: district.name,
                doctorCount: Math.floor(Math.random() * 80) + 20, // 20-100 doctors
                imageUrl: hospitalImages[hospitalCounter % hospitalImages.length]
            });
            hospitalCounter++;
        }
    });

    return generatedHospitals;
}

// Generate dynamic department data
function generateInitialDepartments(hospitals) {
    const generatedDepartments = [];
    const commonDepts = [
        'Kardiyoloji', 'Dahiliye', 'Nöroloji', 'Ortopedi', 'Göz Hastalıkları', 
        'Genel Cerrahi', 'Çocuk Sağlığı ve Hastalıkları', 'Kadın Hastalıkları ve Doğum',
        'Kulak Burun Boğaz', 'Psikiyatri', 'Üroloji', 'Fizik Tedavi ve Rehabilitasyon',
        'Dermatoloji', 'Göğüs Hastalıkları', 'Enfeksiyon Hastalıkları', 'Gastroenteroloji',
        'Endokrinoloji', 'Romatoloji', 'Nefroloji', 'Onkoloji', 'Anesteziyoloji ve Reanimasyon'
    ];
    let departmentCounter = 1;

    hospitals.forEach(hosp => {
        const numDepts = Math.floor(Math.random() * 5) + 3; // 3-7 departments per hospital
        const shuffledDepts = commonDepts.sort(() => 0.5 - Math.random()); // Shuffle for variety

        for (let i = 0; i < numDepts; i++) {
            const deptName = shuffledDepts[i % shuffledDepts.length];
            generatedDepartments.push({
                id: `dept-${departmentCounter.toString().padStart(3, '0')}`,
                name: deptName,
                hospitalId: hosp.id,
                doctorCount: Math.floor(Math.random() * 15) + 3 // 3-18 doctors per department
            });
            departmentCounter++;
        }
    });

    return generatedDepartments;
}


// --- Data Accessor Functions ---

export function getLuminexUsers() {
    const defaultDoctors = [
        { id: 'drkardiyo1', name: 'Dr. Ayşe Yılmaz', branch: 'Kardiyoloji', tc: '10000000001', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drkardiyo2', name: 'Dr. Zeynep Demir', branch: 'Kardiyoloji', tc: '10000000002', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drkardiyo3', name: 'Dr. Can Kaya', branch: 'Kardiyoloji', tc: '10000000003', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drkardiyo4', name: 'Dr. Emre Aksoy', branch: 'Kardiyoloji', tc: '10000000004', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drdahiliye1', name: 'Dr. Elif Güneş', branch: 'Dahiliye', tc: '10000000005', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drdahiliye2', name: 'Dr. Fatma Çelik', branch: 'Dahiliye', tc: '10000000006', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drdahiliye3', name: 'Dr. Hakan Demir', branch: 'Dahiliye', tc: '10000000007', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drdahiliye4', name: 'Dr. İsmail Kara', branch: 'Dahiliye', tc: '10000000008', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drortopedi1', name: 'Dr. Jale Öztürk', branch: 'Ortopedi', tc: '10000000009', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drortopedi2', name: 'Dr. Mine Can', branch: 'Ortopedi', tc: '10000000010', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drortopedi3', name: 'Dr. Okan Yılmaz', branch: 'Ortopedi', tc: '10000000011', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drortopedi4', name: 'Dr. Polat Tuna', branch: 'Ortopedi', tc: '10000000012', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drgoz1', name: 'Dr. Rabia Güneş', branch: 'Göz Hastalıkları', tc: '10000000013', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drgoz2', name: 'Dr. Sema Erdem', branch: 'Göz Hastalıkları', tc: '10000000014', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drgoz3', name: 'Dr. Tarık Çelik', branch: 'Göz Hastalıkları', tc: '10000000015', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drgoz4', name: 'Dr. Ufuk Yücel', branch: 'Göz Hastalıkları', tc: '10000000016', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drped1', name: 'Dr. Pınar Akın', branch: 'Çocuk Sağlığı ve Hastalıkları', tc: '10000000017', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drped2', name: 'Dr. Gamze Yılmaz', branch: 'Çocuk Sağlığı ve Hastalıkları', tc: '10000000018', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drped3', name: 'Dr. Serkan Can', branch: 'Çocuk Sağlığı ve Hastalıkları', tc: '10000000019', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drped4', name: 'Dr. Tolga Demir', branch: 'Çocuk Sağlığı ve Hastalıkları', tc: '10000000020', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drgenelcer1', name: 'Dr. Hande Güler', branch: 'Genel Cerrahi', tc: '10000000021', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drgenelcer2', name: 'Dr. İpek Kara', branch: 'Genel Cerrahi', tc: '10000000022', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drgenelcer3', name: 'Dr. Kemal Aydın', branch: 'Genel Cerrahi', tc: '10000000023', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drgenelcer4', name: 'Dr. Levent Yılmaz', branch: 'Genel Cerrahi', tc: '10000000024', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drkadin1', name: 'Dr. Meltem Deniz', branch: 'Kadın Hastalıkları ve Doğum', tc: '10000000025', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drkadin2', name: 'Dr. Neşe Aktaş', branch: 'Kadın Hastalıkları ve Doğum', tc: '10000000026', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drkadin3', name: 'Dr. Onur Can', branch: 'Kadın Hastalıkları ve Doğum', tc: '10000000027', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drkadin4', name: 'Dr. Poyraz Efe', branch: 'Kadın Hastalıkları ve Doğum', tc: '10000000028', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drkbb1', name: 'Dr. Rengin Su', branch: 'Kulak Burun Boğaz', tc: '10000000029', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drkbb2', name: 'Dr. Selin Toprak', branch: 'Kulak Burun Boğaz', tc: '10000000030', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drkbb3', name: 'Dr. Tufan Deniz', branch: 'Kulak Burun Boğaz', tc: '10000000031', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drkbb4', name: 'Dr. Uğur Can', branch: 'Kulak Burun Boğaz', tc: '10000000032', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drnoroloji1', name: 'Dr. Vildan Işık', branch: 'Nöroloji', tc: '10000000033', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drnoroloji2', name: 'Dr. Yasemin Toprak', branch: 'Nöroloji', tc: '10000000034', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drnoroloji3', name: 'Dr. Zafer Mert', branch: 'Nöroloji', tc: '10000000035', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drnoroloji4', name: 'Dr. Altan Güneş', branch: 'Nöroloji', tc: '10000000036', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drpsikiyatri1', name: 'Dr. Berna Aksoy', branch: 'Psikiyatri', tc: '10000000037', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drpsikiyatri2', name: 'Dr. Ceyda Deniz', branch: 'Psikiyatri', tc: '10000000038', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drpsikiyatri3', name: 'Dr. Deniz Ege', branch: 'Psikiyatri', tc: '10000000039', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drpsikiyatri4', name: 'Dr. Erdem Fırat', branch: 'Psikiyatri', tc: '10000000040', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drüroloji1', name: 'Dr. Fulya Gök', branch: 'Üroloji', tc: '10000000041', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drüroloji2', name: 'Dr. Gizem Hazar', branch: 'Üroloji', tc: '10000000042', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drüroloji3', name: 'Dr. Haluk Işık', branch: 'Üroloji', tc: '10000000043', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drüroloji4', name: 'Dr. İlker Jale', branch: 'Üroloji', tc: '10000000044', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drftr1', name: 'Dr. Kader Kılıç', branch: 'Fizik Tedavi ve Rehabilitasyon', tc: '10000000045', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drftr2', name: 'Dr. Lale Mavi', branch: 'Fizik Tedavi ve Rehabilitasyon', tc: '10000000046', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drftr3', name: 'Dr. Mert Nazlı', branch: 'Fizik Tedavi ve Rehabilitasyon', tc: '10000000047', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drftr4', name: 'Dr. Necati Ozan', branch: 'Fizik Tedavi ve Rehabilitasyon', tc: '10000000048', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drderma1', name: 'Dr. Özlem Peker', branch: 'Dermatoloji', tc: '10000000049', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drderma2', name: 'Dr. Pelin Rüzgar', branch: 'Dermatoloji', tc: '10000000050', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drderma3', name: 'Dr. Rıza Sarı', branch: 'Dermatoloji', tc: '10000000051', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drderma4', name: 'Dr. Savaş Tekin', branch: 'Dermatoloji', tc: '10000000052', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drgogus1', name: 'Dr. Tuğçe Uysal', branch: 'Göğüs Hastalıkları', tc: '10000000053', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drgogus2', name: 'Dr. Umut Vural', branch: 'Göğüs Hastalıkları', tc: '10000000054', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drgogus3', name: 'Dr. Volkan Yücel', branch: 'Göğüs Hastalıkları', tc: '10000000055', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drgogus4', name: 'Dr. Yaman Zengin', branch: 'Göğüs Hastalıkları', tc: '10000000056', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drenfeksiyon1', name: 'Dr. Zeynep Arslan', branch: 'Enfeksiyon Hastalıkları', tc: '10000000057', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drenfeksiyon2', name: 'Dr. Ayşe Bilgin', branch: 'Enfeksiyon Hastalıkları', tc: '10000000058', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drenfeksiyon3', name: 'Dr. Burak Can', branch: 'Enfeksiyon Hastalıkları', tc: '10000000059', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drenfeksiyon4', name: 'Dr. Cem Demir', branch: 'Enfeksiyon Hastalıkları', tc: '10000000060', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drgastro1', name: 'Dr. Derya Efe', branch: 'Gastroenteroloji', tc: '10000000061', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drgastro2', name: 'Dr. Esra Fırat', branch: 'Gastroenteroloji', tc: '10000000062', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drgastro3', name: 'Dr. Fatih Gök', branch: 'Gastroenteroloji', tc: '10000000063', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drgastro4', name: 'Dr. Gökhan Hazar', branch: 'Gastroenteroloji', tc: '10000000064', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drendo1', name: 'Dr. Hande Işık', branch: 'Endokrinoloji', tc: '10000000065', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drendo2', name: 'Dr. İrem Jale', branch: 'Endokrinoloji', tc: '10000000066', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drendo3', name: 'Dr. Kaan Kılıç', branch: 'Endokrinoloji', tc: '10000000067', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drendo4', name: 'Dr. Levent Mavi', branch: 'Endokrinoloji', tc: '10000000068', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drroma1', name: 'Dr. Meltem Nazlı', branch: 'Romatoloji', tc: '10000000069', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drroma2', name: 'Dr. Neşe Ozan', branch: 'Romatoloji', tc: '10000000070', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drroma3', name: 'Dr. Onur Peker', branch: 'Romatoloji', tc: '10000000071', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drroma4', name: 'Dr. Polat Rüzgar', branch: 'Romatoloji', tc: '10000000072', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drnefro1', name: 'Dr. Rabia Sarı', branch: 'Nefroloji', tc: '10000000073', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drnefro2', name: 'Dr. Sema Tekin', branch: 'Nefroloji', tc: '10000000074', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'drnefro3', name: 'Dr. Tarık Uysal', branch: 'Nefroloji', tc: '10000000075', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'drnefro4', name: 'Dr. Ufuk Vural', branch: 'Nefroloji', tc: '10000000076', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'dronko1', name: 'Dr. Vildan Yücel', branch: 'Onkoloji', tc: '10000000077', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'dronko2', name: 'Dr. Yasemin Zengin', branch: 'Onkoloji', tc: '10000000078', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'dronko3', name: 'Dr. Zafer Akın', branch: 'Onkoloji', tc: '10000000079', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'dronko4', name: 'Dr. Altan Bilgin', branch: 'Onkoloji', tc: '10000000080', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'dranestezi1', name: 'Dr. Berna Can', branch: 'Anesteziyoloji ve Reanimasyon', tc: '10000000081', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'dranestezi2', name: 'Dr. Ceyda Demir', branch: 'Anesteziyoloji ve Reanimasyon', tc: '10000000082', password: 'password123', role: 'doctor', gender: 'female' },
        { id: 'dranestezi3', name: 'Dr. Deniz Ege', branch: 'Anesteziyoloji ve Reanimasyon', tc: '10000000083', password: 'password123', role: 'doctor', gender: 'male' },
        { id: 'dranestezi4', name: 'Dr. Erdem Fırat', branch: 'Anesteziyoloji ve Reanimasyon', tc: '10000000084', password: 'password123', role: 'doctor', gender: 'male' }
    ];

    const adminUser = { id: 'admin', name: 'Admin User', tc: '22859328234', password: 'mustafa/70', role: 'admin' };
    const testUser = { id: 'test-user', name: 'Test Kullanıcısı', tc: '11111111111', password: '1234', role: 'patient' };

    let storedUsers = getLocalStorageItem('luminexUsers');
    let usersModified = false;

    if (!storedUsers || storedUsers.length === 0) {
        // If no users, initialize with all default users including admin and test user
        storedUsers = [...defaultDoctors, adminUser, testUser];
        usersModified = true;
    } else {
        // Check if admin exists
        const adminExists = storedUsers.some(user => user.tc === adminUser.tc);
        if (!adminExists) {
            storedUsers.push(adminUser);
            usersModified = true;
        }
        // Check if test user exists
        const testUserExists = storedUsers.some(user => user.tc === testUser.tc);
        if (!testUserExists) {
            storedUsers.push(testUser);
            usersModified = true;
        }
    }

    // Always ensure default doctors are also in the list if they are missing
    defaultDoctors.forEach(defaultDoctor => {
        const doctorExists = storedUsers.some(user => user.tc === defaultDoctor.tc);
        if (!doctorExists) {
            storedUsers.push(defaultDoctor);
            usersModified = true;
        }
    });

    if (usersModified) {
        setLocalStorageItem('luminexUsers', storedUsers);
    }
    return storedUsers;
}

export function setLuminexUsers(users) {
    setLocalStorageItem('luminexUsers', users);
}

export function getLuminexAppointments() {
    let storedAppointments = getLocalStorageItem('luminexAppointments');
    if (!storedAppointments || storedAppointments.length === 0) {
        storedAppointments = initialLuminexAppointments;
        setLocalStorageItem('luminexAppointments', storedAppointments);
    }
    return storedAppointments;
}

export function setLuminexAppointments(appointments) {
    setLocalStorageItem('luminexAppointments', appointments);
}

export function getLuminexTestResults() {
    let storedTestResults = getLocalStorageItem('luminexTestResults');
    if (!storedTestResults || storedTestResults.length === 0) {
        storedTestResults = initialLuminexTestResults;
        setLocalStorageItem('luminexTestResults', storedTestResults);
    }
    return storedTestResults;
}

export function setLuminexTestResults(results) {
    setLocalStorageItem('luminexTestResults', results);
}

export function getLuminexPrescriptions() {
    let storedPrescriptions = getLocalStorageItem('luminexPrescriptions');
    if (!storedPrescriptions || storedPrescriptions.length === 0) {
        storedPrescriptions = initialLuminexPrescriptions;
        setLocalStorageItem('luminexPrescriptions', storedPrescriptions);
    }
    return storedPrescriptions;
}

export function setLuminexPrescriptions(prescriptions) {
    setLocalStorageItem('luminexPrescriptions', prescriptions);
}

export function getLuminexRadiologyResults() {
    let storedRadiologyResults = getLocalStorageItem('luminexRadiologyResults');
    if (!storedRadiologyResults || storedRadiologyResults.length === 0) {
        storedRadiologyResults = dummyRadiologyResults;
        setLocalStorageItem('luminexRadiologyResults', storedRadiologyResults);
    }
    return storedRadiologyResults;
}

export function setLuminexRadiologyResults(results) {
    setLocalStorageItem('luminexRadiologyResults', results);
}

export function getLuminexBlockedSlots() {
    let storedBlockedSlots = getLocalStorageItem('luminexBlockedSlots');
    if (!storedBlockedSlots) {
        storedBlockedSlots = [];
        setLocalStorageItem('luminexBlockedSlots', storedBlockedSlots);
    }
    return storedBlockedSlots;
}

export function setLuminexBlockedSlots(slots) {
    setLocalStorageItem('luminexBlockedSlots', slots);
}

export function getLuminexHospitals() {
    let storedHospitals = getLocalStorageItem('luminexHospitals');
    if (!storedHospitals || storedHospitals.length === 0) {
        storedHospitals = generateInitialHospitals();
        setLocalStorageItem('luminexHospitals', storedHospitals);
    }
    return storedHospitals;
}

export function setLuminexHospitals(hospitals) {
    setLocalStorageItem('luminexHospitals', hospitals);
}

export function getLuminexDepartments() {
    let storedDepartments = getLocalStorageItem('luminexDepartments');
    if (!storedDepartments || storedDepartments.length === 0) {
        const hospitals = getLuminexHospitals(); // Ensure hospitals are initialized first
        storedDepartments = generateInitialDepartments(hospitals);
        setLocalStorageItem('luminexDepartments', storedDepartments);
    }
    return storedDepartments;
}

export function setLuminexDepartments(departments) {
    setLocalStorageItem('luminexDepartments', departments);
}

export function getLuminexTickets() {
    let storedTickets = getLocalStorageItem('luminexTickets');
    if (!storedTickets) {
        storedTickets = [];
        setLocalStorageItem('luminexTickets', storedTickets);
    }
    return storedTickets;
}

export function setLuminexTickets(tickets) {
    setLocalStorageItem('luminexTickets', tickets);
}

export function getLuminexNotifications() {
    let storedNotifications = getLocalStorageItem('luminexNotifications');
    // Load dummy data if null OR empty array
    if (!storedNotifications || storedNotifications.length === 0) {
        storedNotifications = dummyNotifications || [];
        setLocalStorageItem('luminexNotifications', storedNotifications);
    }
    return storedNotifications;
}

export function setLuminexNotifications(notifications) {
    setLocalStorageItem('luminexNotifications', notifications);
}

// Notification Helper Functions
export function getUnreadNotificationCount(userRole = 'patient') {
    const notifications = getLuminexNotifications();
    return notifications.filter(n => {
        const notifRole = n.role || 'patient'; // Treat missing role as patient
        return notifRole === userRole && !n.read;
    }).length;
}

export function markNotificationAsRead(id) {
    const notifications = getLuminexNotifications();
    const notificationIndex = notifications.findIndex(n => n.id === id);
    if (notificationIndex > -1) {
        notifications[notificationIndex].read = true;
        setLuminexNotifications(notifications);
        // Trigger a custom event to update UI
        window.dispatchEvent(new CustomEvent('notificationUpdated'));
    }
}

export function deleteNotification(id) {
    let notifications = getLuminexNotifications();
    notifications = notifications.filter(n => n.id !== id);
    setLuminexNotifications(notifications);
    window.dispatchEvent(new CustomEvent('notificationUpdated'));
}

export function markAllNotificationsAsRead(userRole = 'patient') {
    const notifications = getLuminexNotifications();
    let updated = false;
    notifications.forEach(n => {
        const notifRole = n.role || 'patient'; // Treat missing role as patient
        if (notifRole === userRole && !n.read) {
            n.read = true;
            updated = true;
        }
    });
    if (updated) {
        setLuminexNotifications(notifications);
        window.dispatchEvent(new CustomEvent('notificationUpdated'));
    }
}


// --- Global Initializer ---

export function initAllDummyData() {
    localStorage.removeItem('luminexUsers');
    // These calls ensure that if localStorage is empty, it gets populated from initial data
    getLuminexUsers();
    getLuminexAppointments();
    getLuminexTestResults();
    getLuminexRadiologyResults();
    getLuminexPrescriptions();
    getLuminexBlockedSlots();
    getLuminexHospitals(); // Initialize hospitals
    getLuminexDepartments(); // Initialize departments
    getLuminexTickets(); // Initialize tickets
    getLuminexNotifications(); // Initialize notifications
}