document.addEventListener('DOMContentLoaded', () => {
    // Global Elements
    const wizardContent = document.getElementById('wizardContent');
    let currentLanguage = localStorage.getItem('language') || 'tr';
    
    // State
    let userData = {
        gender: null,
        ageRange: null,
        isSenior: false,
        symptom: null
    };

    // --- LOCALIZATION DATA ---
    const resources = {
        tr: {
            greeting: (name) => `Merhaba ${name}, şikayetiniz nedir?`,
            guestName: "Misafir",
            letsKnowYou: "Sizi biraz tanıyalım",
            genderLabel: "Cinsiyetiniz:",
            ageLabel: "Yaş Aralığınız:",
            startBtn: "Analize Başla",
            loading: "Semptomlar yükleniyor...",
            genderOptions: { kadin: "Kadın", erkek: "Erkek", diger: "Diğer" },
            categories: [
                {
                    title: "Genel Ağrılar",
                    icon: "fa-procedures",
                    items: [
                        { id: "bas_agrisi", label: "Baş Ağrısı" },
                        { id: "eklem_agrisi", label: "Eklem/Kemik Ağrısı" },
                        { id: "goz_agrisi", label: "Göz Ağrısı" },
                        { id: "dis_agrisi", label: "Diş Ağrısı" }
                    ]
                },
                {
                    title: "Solunum & KBB",
                    icon: "fa-lungs",
                    items: [
                        { id: "nefes_darligi", label: "Nefes Darlığı" },
                        { id: "bogaz_agrisi", label: "Boğaz Ağrısı" },
                        { id: "kulak_agrisi", label: "Kulak Ağrısı" },
                        { id: "burun_tikanikligi", label: "Burun Tıkanıklığı" }
                    ]
                },
                {
                    title: "Sindirim & Karın",
                    icon: "fa-stomach",
                    customIcon: '<i class="fas fa-utensils"></i>',
                    items: [
                        { id: "karin_agrisi", label: "Karın Ağrısı" },
                        { id: "bulanti", label: "Bulantı / Kusma" },
                        { id: "kabizlik", label: "Kabızlık / İshal" }
                    ]
                },
                {
                    title: "Diğer Şikayetler",
                    icon: "fa-notes-medical",
                    items: [
                        { id: "cilt_sorunu", label: "Cilt Problemleri" },
                        { id: "halsizlik", label: "Aşırı Halsizlik" },
                        { id: "carpinti", label: "Kalp Çarpıntısı" },
                        { id: "idrar_yanmasi", label: "İdrarda Yanma" }
                    ]
                }
            ],
            symptomData: {
                // --- BAŞ AĞRISI ---
                'bas_agrisi': {
                    question: "Baş ağrınız başınızın tam olarak neresinde yoğunlaşıyor?",
                    options: [
                        { text: "Tek taraflı (Sadece sağ veya sadece sol)", next: 'bas_tek_taraflı' },
                        { text: "Tüm başımda, bir bant sıkıştırıyormuş gibi", next: 'bas_gerilim' },
                        { text: "Göz çevremde ve alnımda yoğun baskı var", next: 'bas_sinüzit' },
                        { text: "Ense kökümden yukarı doğru yayılıyor", next: 'bas_ense' }
                    ]
                },
                'bas_tek_taraflı': {
                    question: "Ağrınız zonklayıcı (kalp atışı gibi) karakterde mi?",
                    options: [
                        { text: "Evet, zonkluyor", next: 'bas_migren_aura' },
                        { text: "Hayır, daha çok saplanma tarzında", next: 'bas_kume' }
                    ]
                },
                'bas_migren_aura': {
                    question: "Ağrı başlamadan önce ışık çakması, bulanık görme veya koku hassasiyeti yaşıyor musunuz?",
                    options: [
                        { text: "Evet, yaşıyorum", next: 'bas_migren_bulantı' },
                        { text: "Hayır, direkt ağrı başlıyor", next: 'bas_migren_bulantı' }
                    ]
                },
                'bas_migren_bulantı': {
                    question: "Baş ağrısına eşlik eden mide bulantısı veya kusma var mı?",
                    options: [
                        { text: "Evet, midem bulanıyor", result: { title: "Migren Atağı", desc: "Belirtileriniz migreni güçlü bir şekilde işaret ediyor. Karanlık ve sessiz bir ortamda dinlenmeniz önerilir.", department: "Nöroloji", branchId: "noroloji" } },
                        { text: "Hayır", result: { title: "Vasküler Baş Ağrısı", desc: "Damar genişlemesine bağlı baş ağrısı olabilir.", department: "Nöroloji", branchId: "noroloji" } }
                    ]
                },
                'bas_gerilim': {
                    question: "Ağrı günün ilerleyen saatlerinde, özellikle stresli anlarda mı artıyor?",
                    options: [
                        { text: "Evet, akşamları daha kötü", next: 'bas_gerilim_uyku' },
                        { text: "Hayır, sabahları daha şiddetli", result: { title: "Kronik Baş Ağrısı", desc: "Sabah baş ağrıları hipertansiyon veya uyku apnesi ile ilişkili olabilir.", department: "İç Hastalıkları / Nöroloji", branchId: "dahiliye" } }
                    ]
                },
                'bas_gerilim_uyku': {
                    question: "Son zamanlarda uykusuzluk veya yoğun iş stresi yaşadınız mı?",
                    options: [
                        { text: "Evet, çok yoğunum", result: { title: "Gerilim Tipi Baş Ağrısı", desc: "Stres ve kas gerginliğine bağlı en yaygın ağrı türüdür. Dinlenme ve gevşeme egzersizleri önerilir.", department: "Nöroloji", branchId: "noroloji" } },
                        { text: "Hayır, iyiyim", result: { title: "Psikosomatik Baş Ağrısı", desc: "Genel kontrol amaçlı muayene olmanızda fayda var.", department: "Nöroloji", branchId: "noroloji" } }
                    ]
                },
                'bas_sinüzit': {
                    question: "Öne doğru eğildiğinizde ağrınız ve yüzünüzdeki baskı artıyor mu?",
                    options: [
                        { text: "Evet, çok artıyor", next: 'bas_sinüzit_ates' },
                        { text: "Hayır, fark etmiyor", result: { title: "Göz Bozukluğu Kaynaklı Ağrı", desc: "Göz yorgunluğu veya numara değişikliği baş ağrısı yapabilir.", department: "Göz Hastalıkları", branchId: "goz" } }
                    ]
                },
                'bas_sinüzit_ates': {
                    question: "Geniz akıntısı veya hafif ateş eşlik ediyor mu?",
                    options: [
                        { text: "Evet, akıntım da var", result: { title: "Akut Sinüzit", desc: "Yüz kemiklerindeki boşlukların iltihabı ağrıya sebep olur.", department: "Kulak Burun Boğaz", branchId: "kbb" } },
                        { text: "Hayır", result: { title: "Yüz Nevraljisi", desc: "Yüzdeki sinir hassasiyetleri araştırılmalı.", department: "Nöroloji / KBB", branchId: "noroloji" } }
                    ]
                },
                'bas_ense': {
                    question: "Tansiyon probleminiz var mı?",
                    options: [
                        { text: "Evet, hipertansiyon hastasıyım", result: { title: "Hipertansif Baş Ağrısı", desc: "Tansiyon yüksekliği ense ağrısı yapabilir. Tansiyonunuzu ölçtürünüz.", department: "Kardiyoloji / Dahiliye", branchId: "kardiyoloji" } },
                        { text: "Hayır, tansiyonum normal", result: { title: "Servikal Disk (Boyun) Kaynaklı", desc: "Boyun düzleşmesi veya fıtık kaynaklı olabilir.", department: "Fizik Tedavi", branchId: "fizik_tedavi" } }
                    ]
                },
                
                // --- KARIN AĞRISI ---
                'karin_agrisi': {
                    question: "Ağrı karnınızın tam olarak neresinde yoğunlaşıyor?",
                    options: [
                        { text: "Sağ alt tarafta (Keskin)", next: 'karin_apandisit' },
                        { text: "Mide bölgemde (Üst orta)", next: 'karin_mide' },
                        { text: "Karnımın tamamında şişkinlikle beraber", next: 'karin_bagirsak' },
                        { text: "Sırtıma vuran bir ağrı (Böğür)", next: 'karin_bobrek' }
                    ]
                },
                'karin_apandisit': {
                    question: "Zıplayınca veya öksürünce sağ alt taraftaki ağrı bıçak gibi saplanıyor mu?",
                    options: [
                        { text: "Evet, dayanılmaz", next: 'karin_apandisit_ates' },
                        { text: "Hayır, ama sürekli sızlıyor", result: { title: "Kas/Bağırsak Zorlanması", desc: "Bağırsak hareketlerini takip ediniz.", department: "Genel Cerrahi", branchId: "genel_cerrahi" } }
                    ]
                },
                'karin_apandisit_ates': {
                    question: "Mide bulantısı veya hafif ateşiniz var mı?",
                    options: [
                        { text: "Evet, hiçbir şey yiyemiyorum", result: { title: "Apandisit Şüphesi", desc: "ACİL DURUM! Apandisit riski yüksek. Hemen hastaneye başvurunuz.", department: "ACİL SERVİS", branchId: "acil", urgent: true } },
                        { text: "Hayır", result: { title: "Cerrahi Karın Ağrısı", desc: "Genel cerrahi muayenesi ihmal edilmemeli.", department: "Genel Cerrahi", branchId: "genel_cerrahi" } }
                    ]
                },
                'karin_mide': {
                    question: "Ağzınıza acı su gelmesi veya göğüs kafesinde yanma oluyor mu?",
                    options: [
                        { text: "Evet, çok sık oluyor", next: 'karin_mide_yemek' },
                        { text: "Hayır, sadece karın ağrısı", next: 'karin_mide_kazınma' }
                    ]
                },
                'karin_mide_yemek': {
                    question: "Yemek yedikten hemen sonra şikayetleriniz artıyor mu?",
                    options: [
                        { text: "Evet, hemen başlıyor", result: { title: "Gastrit / Reflü", desc: "Mide asidi problemi olabilir. Diyetinize dikkat ediniz.", department: "Gastroenteroloji", branchId: "gastroenteroloji" } },
                        { text: "Hayır, uzanınca daha kötü", result: { title: "Reflü Hastalığı", desc: "Mide içeriğinin yemek borusuna kaçması durumu.", department: "Gastroenteroloji", branchId: "gastroenteroloji" } }
                    ]
                },
                'karin_mide_kazınma': {
                    question: "Açken midenizde 'kazınma' veya 'kemirilme' hissi oluyor mu?",
                    options: [
                        { text: "Evet, bir şeyler yiyince geçiyor", result: { title: "Mide Ülseri Şüphesi", desc: "Ülser açken ağrı yapabilir. Uzman kontrolü gerekir.", department: "Gastroenteroloji", branchId: "gastroenteroloji" } },
                        { text: "Hayır", result: { title: "Non-Spesifik Dispepsi", desc: "Hazımsızlık veya genel mide hassasiyeti.", department: "İç Hastalıkları", branchId: "dahiliye" } }
                    ]
                },
                'karin_bagirsak': {
                    question: "Son zamanlarda tuvalet alışkanlığınızda değişiklik (ishal/kabızlık) oldu mu?",
                    options: [
                        { text: "Evet, ishal/kabızlık var", result: { title: "İrritabl Bağırsak Sendromu", desc: "Bağırsak hareket bozukluğu olabilir.", department: "Gastroenteroloji", branchId: "gastroenteroloji" } },
                        { text: "Hayır, sadece gaz var", result: { title: "Dispepsi / Gaz Sancısı", desc: "Yediklerinize bağlı gaz birikmesi olabilir.", department: "Dahiliye", branchId: "dahiliye" } }
                    ]
                },
                'karin_bobrek': {
                    question: "İdrar yaparken yanma veya renk değişikliği var mı?",
                    options: [
                        { text: "Evet, yanma var", result: { title: "Böbrek Taşı / Enfeksiyon", desc: "Böbrek taşı veya enfeksiyon belirtisi olabilir.", department: "Üroloji", branchId: "uroloji" } },
                        { text: "Hayır", result: { title: "Kas İskelet Ağrısı", desc: "Ters hareket kaynaklı kas ağrısı olabilir.", department: "Fizik Tedavi", branchId: "fizik_tedavi" } }
                    ]
                },

                // --- NEFES DARLIĞI ---
                'nefes_darligi': {
                    question: "Nefes darlığınız ne zaman ve nasıl başladı?",
                    options: [
                        { text: "Aniden başladı (Birkaç dakika içinde)", next: 'nefes_ani' },
                        { text: "Günlerdir var, hareket ettikçe artıyor", next: 'nefes_kronik' },
                        { text: "Toz, polen veya bir koku sonrası başladı", next: 'nefes_alerji' }
                    ]
                },
                'nefes_ani': {
                    question: "Göğsünüzde şiddetli baskı, sol kola veya çeneye vuran ağrı var mı?",
                    options: [
                        { text: "Evet, var", result: { title: "KALP KRİZİ RİSKİ", desc: "HAYATİ TEHLİKE! DERHAL 112'Yİ ARAYIN!", department: "ACİL SERVİS", branchId: "acil", urgent: true } },
                        { text: "Hayır, sadece nefesim daralıyor", next: 'nefes_ani_carpıntı' }
                    ]
                },
                'nefes_ani_carpıntı': {
                    question: "Kalbiniz küt küt atıyor mu veya ölecekmişsiniz gibi hissediyor musunuz?",
                    options: [
                        { text: "Evet, fenalık hissi var", result: { title: "Panik Atak / Anksiyete", desc: "Fiziksel bir sebep yoksa psikolojik olabilir ama yine de kardiyoloji görmeli.", department: "Kardiyoloji / Psikiyatri", branchId: "kardiyoloji" } },
                        { text: "Hayır, hırıltı var", result: { title: "Akut Solunum Sıkıntısı", desc: "Acil müdahale gerektiren bir akciğer sorunu olabilir.", department: "ACİL SERVİS", branchId: "acil", urgent: true } }
                    ]
                },
                'nefes_kronik': {
                    question: "Geceleri yatınca nefesiniz daralıyor ve yastık yükseltme ihtiyacı hissediyor musunuz?",
                    options: [
                        { text: "Evet, düz yatamıyorum", result: { title: "Kalp Yetmezliği Şüphesi", desc: "Kalp yetmezliği belirtisi olabilir.", department: "Kardiyoloji", branchId: "kardiyoloji" } },
                        { text: "Hayır, sadece yürüyünce", result: { title: "KOAH / Astım", desc: "Akciğer kapasitesinde azalma olabilir.", department: "Göğüs Hastalıkları", branchId: "gogus" } }
                    ]
                },
                'nefes_alerji': {
                    question: "Hapşırma, burun akıntısı veya gözlerde yaşarma eşlik ediyor mu?",
                    options: [
                        { text: "Evet, hepsi var", result: { title: "Alerjik Astım / Rinit", desc: "Mevsimsel veya toz alerjisi kaynaklı olabilir.", department: "Göğüs Hastalıkları / KBB", branchId: "gogus" } },
                        { text: "Hayır, sadece tıkanıklık", result: { title: "Nazal Polip / Deviasyon", desc: "Burun içi et veya kemik eğriliği olabilir.", department: "Kulak Burun Boğaz", branchId: "kbb" } }
                    ]
                },

                // --- DİĞERLERİ (GENİŞLETİLMİŞ) ---
                'halsizlik': {
                    question: "Halsizliğinize ateş, titreme veya boğaz ağrısı eşlik ediyor mu?",
                    options: [
                        { text: "Evet, ateşim var", next: 'halsizlik_enfeksiyon' },
                        { text: "Hayır, sadece bitkinim", next: 'halsizlik_kronik' }
                    ]
                },
                'halsizlik_enfeksiyon': {
                    question: "Yaygın vücut ve eklem ağrınız var mı?",
                    options: [
                        { text: "Evet, her yerim dökülüyor", result: { title: "Viral Enfeksiyon (Grip/Covid)", desc: "İstirahat ve bol sıvı tüketimi önerilir.", department: "İç Hastalıkları / Enfeksiyon", branchId: "dahiliye" } },
                        { text: "Hayır, sadece halsizim", result: { title: "Genel Enfeksiyon", desc: "Vücutta bir iltihabi durum olabilir.", department: "İç Hastalıkları", branchId: "dahiliye" } }
                    ]
                },
                'halsizlik_kronik': {
                    question: "Son zamanlarda kilo değişimi veya saç dökülmesi yaşadınız mı?",
                    options: [
                        { text: "Evet, kilo aldım/verdim", result: { title: "Tiroid Bozukluğu / Anemi", desc: "Hormon veya vitamin eksikliği olabilir.", department: "Dahiliye / Endokrinoloji", branchId: "endokrinoloji" } },
                        { text: "Hayır, değişiklik yok", result: { title: "Kronik Yorgunluk / Depresyon", desc: "Stres veya yaşam tarzı kaynaklı olabilir.", department: "Psikiyatri / Dahiliye", branchId: "psikiyatri" } }
                    ]
                },

                'bulanti': {
                    question: "Kusma eşlik ediyor mu?",
                    options: [
                        { text: "Evet, durmadan kusuyorum", result: { title: "Gastroenterit", desc: "Mide-bağırsak enfeksiyonu olabilir. Sıvı kaybına dikkat.", department: "Dahiliye", branchId: "dahiliye" } },
                        { text: "Hayır, sadece bulantı", next: 'bulanti_bas' }
                    ]
                },
                'bulanti_bas': {
                    question: "Baş dönmesi veya denge kaybı var mı?",
                    options: [
                        { text: "Evet, başım dönüyor", result: { title: "Vertigo / İç Kulak", desc: "İç kulak kristallerinde sorun olabilir.", department: "Kulak Burun Boğaz", branchId: "kbb" } },
                        { text: "Hayır", result: { title: "Mide Hassasiyeti / Gebelik", desc: "Kadın hastalarda gebelik ihtimali de düşünülmelidir.", department: "Dahiliye / Kadın Doğum", branchId: "dahiliye" } }
                    ]
                },

                // --- YENİ & GELİŞTİRİLMİŞ KATEGORİLER ---

                // 1. Cilt Sorunları (Geliştirilmiş)
                'cilt_sorunu': {
                    question: "Cildinizde kaşıntı var mı?",
                    options: [
                        { text: "Evet, kaşınıyor", next: 'cilt_kasinti' },
                        { text: "Hayır, kaşıntı yok", next: 'cilt_leke' }
                    ]
                },
                'cilt_kasinti': {
                    question: "Kızarıklık, kabarma veya döküntü var mı?",
                    options: [
                        { text: "Evet, kabardı/kızardı", result: { title: "Ürtiker / Alerji", desc: "Alerjik bir reaksiyon olabilir. Antihistaminik gerekebilir.", department: "Dermatoloji", branchId: "dermatoloji" } },
                        { text: "Hayır, sadece kuruluk var", result: { title: "Kserozis (Cilt Kuruluğu)", desc: "Nemlendirici kullanımı faydalı olabilir.", department: "Dermatoloji", branchId: "dermatoloji" } }
                    ]
                },
                'cilt_leke': {
                    question: "Mevcut bir bende renk/şekil değişikliği veya yeni bir leke mi?",
                    options: [
                        { text: "Evet, ben değişti/yeni leke", result: { title: "Şüpheli Lezyon", desc: "Ben değişiklikleri önemlidir. Dermatoskopik inceleme gerekir.", department: "Dermatoloji", branchId: "dermatoloji" } },
                        { text: "Hayır, sivilce/akne gibi", result: { title: "Akne Vulgaris", desc: "Ergenlik veya hormonal kaynaklı sivilce problemi.", department: "Dermatoloji", branchId: "dermatoloji" } }
                    ]
                },

                // 2. Çarpıntı (Geliştirilmiş)
                'carpinti': {
                    question: "Çarpıntı ile beraber göğüs ağrısı veya bayılma hissi var mı?",
                    options: [
                        { text: "Evet, sıkışıyorum/fenalaşıyorum", result: { title: "Ritim Bozukluğu / Angina", desc: "ACİL değerlendirme gerekebilir. Kalp grafisi (EKG) çekilmelidir.", department: "Kardiyoloji", branchId: "kardiyoloji", urgent: true } },
                        { text: "Hayır, sadece hızlı atıyor", next: 'carpinti_efor' }
                    ]
                },
                'carpinti_efor': {
                    question: "Çarpıntı ne zaman oluyor?",
                    options: [
                        { text: "Dinlenirken, durduk yere", result: { title: "Stres / Tiroid / Panik", desc: "Kansızlık veya tiroid bezinin fazla çalışması sebep olabilir.", department: "Dahiliye / Kardiyoloji", branchId: "dahiliye" } },
                        { text: "Yol yürüyünce, yorulunca", result: { title: "Efor Dispnesi / Kondisyon", desc: "Kalp kapakçıklarında sorun veya kondisyon eksikliği olabilir.", department: "Kardiyoloji", branchId: "kardiyoloji" } }
                    ]
                },

                // 3. İdrar Yanması (Geliştirilmiş)
                'idrar_yanmasi': {
                    question: "Yanmaya yüksek ateş veya bel/böğür ağrısı eşlik ediyor mu?",
                    options: [
                        { text: "Evet, ateşim ve ağrım var", result: { title: "Piyelonefrit (Böbrek Enfeksiyonu)", desc: "Böbreklere yayılan enfeksiyon riski. Tedavi edilmelidir.", department: "Üroloji", branchId: "uroloji", urgent: true } },
                        { text: "Hayır, sadece idrarda yanma", next: 'idrar_siklik' }
                    ]
                },
                'idrar_siklik': {
                    question: "Sık idrara çıkma ve ani sıkışma hissi var mı?",
                    options: [
                        { text: "Evet, sürekli tuvaletim geliyor", result: { title: "Sistit (Mesane Enfeksiyonu)", desc: "Alt idrar yolu enfeksiyonu. Antibiyotik tedavisi gerekebilir.", department: "Üroloji", branchId: "uroloji" } },
                        { text: "Hayır, akıntı var", result: { title: "Üretrit", desc: "İdrar kanalı iltihabı.", department: "Üroloji", branchId: "uroloji" } }
                    ]
                },

                // 4. Eklem Ağrısı (YENİ)
                'eklem_agrisi': {
                    question: "Ağrı tek bir eklemde mi yoksa birden fazla eklemde mi?",
                    options: [
                        { text: "Tek bir eklemde (Diz, omuz vs.)", next: 'eklem_tek' },
                        { text: "Birden fazla, gezen ağrılar", next: 'eklem_coklu' }
                    ]
                },
                'eklem_tek': {
                    question: "O eklemde şişlik, kızarıklık veya sıcaklık var mı?",
                    options: [
                        { text: "Evet, şiş ve sıcak", result: { title: "Septik Artrit / Gut", desc: "Eklem iltihabı veya gut atağı olabilir.", department: "Romatoloji / Ortopedi", branchId: "ortopedi" } },
                        { text: "Hayır, sadece hareketle ağrıyor", result: { title: "Mekanik Ağrı / Kireçlenme", desc: "Zorlanma veya kireçlenme (artroz) belirtisi.", department: "Ortopedi / FTR", branchId: "ortopedi" } }
                    ]
                },
                'eklem_coklu': {
                    question: "Sabahları eklemlerinizde tutukluk (sertlik) oluyor mu?",
                    options: [
                        { text: "Evet, 30 dakikadan uzun sürüyor", result: { title: "Romatoid Artrit Şüphesi", desc: "İltihaplı romatizma belirtisi olabilir.", department: "Romatoloji", branchId: "romatoloji" } },
                        { text: "Hayır, hareket edince açılıyor", result: { title: "Yaygın Kireçlenme / Fibromiyalji", desc: "Yumuşak doku romatizması veya kireçlenme.", department: "Fizik Tedavi", branchId: "fizik_tedavi" } }
                    ]
                },

                // 5. Göz Ağrısı (YENİ)
                'goz_agrisi': {
                    question: "Görme kaybı veya ciddi bulanıklık var mı?",
                    options: [
                        { text: "Evet, görmem azaldı", result: { title: "Göz Tansiyonu / Akut Durum", desc: "Görme kaybı ACİL bir durumdur.", department: "Göz Hastalıkları", branchId: "goz", urgent: true } },
                        { text: "Hayır, sadece ağrı/batma", next: 'goz_batma' }
                    ]
                },
                'goz_batma': {
                    question: "Çapaklanma, kızarıklık veya sulanma var mı?",
                    options: [
                        { text: "Evet, çapaklanıyor", result: { title: "Konjonktivit", desc: "Göz nezlesi/mikrobu olabilir.", department: "Göz Hastalıkları", branchId: "goz" } },
                        { text: "Hayır, kuruluk hissi var", result: { title: "Göz Kuruluğu / Yorgunluk", desc: "Ekran kullanımı veya nemsizliğe bağlı olabilir.", department: "Göz Hastalıkları", branchId: "goz" } }
                    ]
                },

                // 6. Diş Ağrısı (YENİ)
                'dis_agrisi': {
                    question: "Yüzünüzde şişlik var mı?",
                    options: [
                        { text: "Evet, yanağım şişti", result: { title: "Diş Apsesi", desc: "Enfeksiyon yayılmış olabilir. Antibiyotik gerekebilir.", department: "Diş Hekimliği", branchId: "dis" } },
                        { text: "Hayır, sadece dişim ağrıyor", next: 'dis_sicak' }
                    ]
                },
                'dis_sicak': {
                    question: "Soğuk veya sıcak bir şey yiyip içince ağrı artıyor mu?",
                    options: [
                        { text: "Evet, sızlıyor", result: { title: "Diş Çürüğü / Hassasiyet", desc: "Mine kaybı veya çürük başlangıcı.", department: "Diş Hekimliği", branchId: "dis" } },
                        { text: "Hayır, gece zonkluyor", result: { title: "Pulpitis (Kanal Tedavisi)", desc: "Diş sinirine inen iltihap olabilir.", department: "Diş Hekimliği", branchId: "dis" } }
                    ]
                },

                // 7. Boğaz Ağrısı (YENİ)
                'bogaz_agrisi': {
                    question: "Yutkunurken zorlanma veya takılma hissi var mı?",
                    options: [
                        { text: "Evet, çok acıyor", next: 'bogaz_ates' },
                        { text: "Hayır, gıcık tarzında", result: { title: "Farenjit / Alerji", desc: "Boğaz tahrişi veya alerjik akıntı.", department: "KBB", branchId: "kbb" } }
                    ]
                },
                'bogaz_ates': {
                    question: "Ateşiniz 38 derecenin üzerinde mi?",
                    options: [
                        { text: "Evet, yüksek ateşim var", result: { title: "Akut Tonsillit (Bademcik)", desc: "Bakteriyel enfeksiyon olabilir.", department: "KBB / Dahiliye", branchId: "kbb" } },
                        { text: "Hayır", result: { title: "Viral Üst Solunum Yolu Enf.", desc: "Soğuk algınlığına bağlı boğaz ağrısı.", department: "KBB", branchId: "kbb" } }
                    ]
                },

                // 8. Kulak Ağrısı (YENİ)
                'kulak_agrisi': {
                    question: "Kulaktan akıntı geliyor mu veya işitme kaybı var mı?",
                    options: [
                        { text: "Evet, akıntı/kayıp var", result: { title: "Orta Kulak İltihabı / Zar Sorunu", desc: "Kulak zarı delinmesi veya iltihap.", department: "KBB", branchId: "kbb" } },
                        { text: "Hayır, sadece ağrı", next: 'kulak_dis' }
                    ]
                },
                'kulak_dis': {
                    question: "Çenenizi hareket ettirince ağrı artıyor mu?",
                    options: [
                        { text: "Evet, artıyor", result: { title: "Çene Eklemi / Diş Kaynaklı", desc: "Ağrı kulaktan değil çene ekleminden yansıyor olabilir.", department: "Diş / Çene Cerrahisi", branchId: "dis" } },
                        { text: "Hayır, kulağım ağrıyor", result: { title: "Dış Kulak Yolu Enfeksiyonu", desc: "Havuz/deniz sonrası olduysa dış kulak iltihabı olabilir.", department: "KBB", branchId: "kbb" } }
                    ]
                },

                // 9. Burun Tıkanıklığı (YENİ)
                'burun_tikanikligi': {
                    question: "Burun akıntısının rengi nasıl?",
                    options: [
                        { text: "Sarı / Yeşil ve koyu", result: { title: "Sinüzit / Bakteriyel Enf.", desc: "Bakteriyel bir enfeksiyon işareti olabilir.", department: "KBB", branchId: "kbb" } },
                        { text: "Şeffaf / Su gibi", next: 'burun_mevsim' }
                    ]
                },
                'burun_mevsim': {
                    question: "Şikayetleriniz bahar aylarında veya tozlu ortamda artıyor mu?",
                    options: [
                        { text: "Evet, artıyor", result: { title: "Alerjik Rinit", desc: "Saman nezlesi veya ev tozu alerjisi.", department: "KBB / Alerji", branchId: "kbb" } },
                        { text: "Hayır, sürekli tıkalı", result: { title: "Burun Kemiği Eğriliği / Polip", desc: "Yapısal bir tıkanıklık olabilir.", department: "KBB", branchId: "kbb" } }
                    ]
                },
                'kabizlik': {
                    question: "Ne zamandır devam ediyor?",
                    options: [
                        { text: "Birkaç gündür", result: { title: "Geçici Kabızlık", desc: "Beslenme değişikliği veya az su içmeye bağlı olabilir.", department: "Beslenme / Diyet", branchId: "diyetisyen" } },
                        { text: "Uzun süredir / Kronik", result: { title: "Kronik Kabızlık", desc: "Bağırsak tembelliği veya başka bir sorun araştırılmalı.", department: "Gastroenteroloji", branchId: "gastroenteroloji" } }
                    ]
                }
            }
        },
        en: {
            greeting: (name) => `Hello ${name}, what is your complaint?`,
            guestName: "Guest",
            letsKnowYou: "Let's get to know you",
            genderLabel: "Gender:",
            ageLabel: "Age Range:",
            startBtn: "Start Analysis",
            loading: "Loading symptoms...",
            genderOptions: { kadin: "Female", erkek: "Male", diger: "Other" },
            categories: [
                {
                    title: "General Pain",
                    icon: "fa-procedures",
                    items: [
                        { id: "bas_agrisi", label: "Headache" },
                        { id: "eklem_agrisi", label: "Joint/Bone Pain" },
                        { id: "goz_agrisi", label: "Eye Pain" },
                        { id: "dis_agrisi", label: "Toothache" }
                    ]
                },
                {
                    title: "Respiratory & ENT",
                    icon: "fa-lungs",
                    items: [
                        { id: "nefes_darligi", label: "Shortness of Breath" },
                        { id: "bogaz_agrisi", label: "Sore Throat" },
                        { id: "kulak_agrisi", label: "Earache" },
                        { id: "burun_tikanikligi", label: "Nasal Congestion" }
                    ]
                },
                {
                    title: "Digestion & Abdomen",
                    icon: "fa-stomach",
                    customIcon: '<i class="fas fa-utensils"></i>',
                    items: [
                        { id: "karin_agrisi", label: "Abdominal Pain" },
                        { id: "bulanti", label: "Nausea / Vomiting" },
                        { id: "kabizlik", label: "Constipation / Diarrhea" }
                    ]
                },
                {
                    title: "Other Complaints",
                    icon: "fa-notes-medical",
                    items: [
                        { id: "cilt_sorunu", label: "Skin Problems" },
                        { id: "halsizlik", label: "Excessive Fatigue" },
                        { id: "carpinti", label: "Heart Palpitations" },
                        { id: "idrar_yanmasi", label: "Burning Urination" }
                    ]
                }
            ],
            symptomData: {
                // --- HEADACHE ---
                'bas_agrisi': {
                    question: "Where exactly is your headache concentrated?",
                    options: [
                        { text: "Unilateral (Right or Left side only)", next: 'bas_tek_taraflı' },
                        { text: "All over my head, like a band squeezing", next: 'bas_gerilim' },
                        { text: "Intense pressure around eyes and forehead", next: 'bas_sinüzit' },
                        { text: "Spreading upwards from the nape of neck", next: 'bas_ense' }
                    ]
                },
                'bas_tek_taraflı': {
                    question: "Is your pain throbbing (like a heartbeat)?",
                    options: [
                        { text: "Yes, throbbing", next: 'bas_migren_aura' },
                        { text: "No, more like stabbing", next: 'bas_kume' }
                    ]
                },
                'bas_migren_aura': {
                    question: "Do you experience flashing lights, blurred vision, or sensitivity to smell before the pain starts?",
                    options: [
                        { text: "Yes, I do", next: 'bas_migren_bulantı' },
                        { text: "No, the pain starts directly", next: 'bas_migren_bulantı' }
                    ]
                },
                'bas_migren_bulantı': {
                    question: "Is there nausea or vomiting accompanying the headache?",
                    options: [
                        { text: "Yes, I feel nauseous", result: { title: "Migraine Attack", desc: "Your symptoms strongly suggest migraine. Resting in a dark and quiet room is recommended.", department: "Neurology", branchId: "noroloji" } },
                        { text: "No", result: { title: "Vascular Headache", desc: "Could be headache due to vessel dilation.", department: "Neurology", branchId: "noroloji" } }
                    ]
                },
                'bas_gerilim': {
                    question: "Does the pain increase later in the day, especially during stressful moments?",
                    options: [
                        { text: "Yes, worse in the evenings", next: 'bas_gerilim_uyku' },
                        { text: "No, more severe in the mornings", result: { title: "Chronic Headache", desc: "Morning headaches can be related to hypertension or sleep apnea.", department: "Internal Medicine / Neurology", branchId: "dahiliye" } }
                    ]
                },
                'bas_gerilim_uyku': {
                    question: "Have you experienced insomnia or intense work stress recently?",
                    options: [
                        { text: "Yes, very busy", result: { title: "Tension Type Headache", desc: "Most common type of pain due to stress and muscle tension. Rest and relaxation exercises are recommended.", department: "Neurology", branchId: "noroloji" } },
                        { text: "No, I am fine", result: { title: "Psychosomatic Headache", desc: "A general check-up might be beneficial.", department: "Neurology", branchId: "noroloji" } }
                    ]
                },
                'bas_sinüzit': {
                    question: "Does your pain and facial pressure increase when you lean forward?",
                    options: [
                        { text: "Yes, increases a lot", next: 'bas_sinüzit_ates' },
                        { text: "No, doesn't change", result: { title: "Eye Strain Headache", desc: "Eye fatigue or prescription change can cause headaches.", department: "Ophthalmology", branchId: "goz" } }
                    ]
                },
                'bas_sinüzit_ates': {
                    question: "Is there postnasal drip or mild fever?",
                    options: [
                        { text: "Yes, I have discharge", result: { title: "Acute Sinusitis", desc: "Inflammation of facial cavities causes pain.", department: "Ear Nose Throat", branchId: "kbb" } },
                        { text: "No", result: { title: "Facial Neuralgia", desc: "Nerve sensitivities in the face should be investigated.", department: "Neurology / ENT", branchId: "noroloji" } }
                    ]
                },
                // --- ABDOMINAL PAIN ---
                'karin_agrisi': {
                    question: "Where exactly is the pain concentrated in your abdomen?",
                    options: [
                        { text: "Lower right side (Sharp)", next: 'karin_apandisit' },
                        { text: "Stomach area (Upper middle)", next: 'karin_mide' },
                        { text: "All over abdomen with bloating", next: 'karin_bagirsak' },
                        { text: "Pain radiating to back (Flank)", next: 'karin_bobrek' }
                    ]
                },
                'karin_apandisit': {
                    question: "Does the pain in lower right side stab like a knife when you jump or cough?",
                    options: [
                        { text: "Yes, unbearable", next: 'karin_apandisit_ates' },
                        { text: "No, but aches constantly", result: { title: "Muscle/Bowel Strain", desc: "Monitor bowel movements.", department: "General Surgery", branchId: "genel_cerrahi" } }
                    ]
                },
                'karin_apandisit_ates': {
                    question: "Do you have nausea or mild fever?",
                    options: [
                        { text: "Yes, can't eat anything", result: { title: "Appendicitis Suspicion", desc: "EMERGENCY! High risk of appendicitis. Go to hospital immediately.", department: "EMERGENCY SERVICE", branchId: "acil", urgent: true } },
                        { text: "No", result: { title: "Surgical Abdominal Pain", desc: "General surgery examination should not be neglected.", department: "General Surgery", branchId: "genel_cerrahi" } }
                    ]
                },
                'karin_mide': {
                    question: "Do you have bitter water coming to mouth or burning in chest?",
                    options: [
                        { text: "Yes, happens often", next: 'karin_mide_yemek' },
                        { text: "No, only abdominal pain", next: 'karin_mide_kazınma' }
                    ]
                },
                'karin_mide_yemek': {
                    question: "Do symptoms increase immediately after eating?",
                    options: [
                        { text: "Yes, starts immediately", result: { title: "Gastritis / Reflux", desc: "Could be stomach acid problem. Watch your diet.", department: "Gastroenterology", branchId: "gastroenteroloji" } },
                        { text: "No, worse when lying down", result: { title: "Reflux Disease", desc: "Stomach content flowing back to esophagus.", department: "Gastroenterology", branchId: "gastroenteroloji" } }
                    ]
                },
                'karin_mide_kazınma': {
                    question: "Do you feel 'gnawing' sensation in stomach when hungry?",
                    options: [
                        { text: "Yes, passes when I eat", result: { title: "Stomach Ulcer Suspicion", desc: "Ulcer can cause pain when hungry. Specialist check required.", department: "Gastroenterology", branchId: "gastroenteroloji" } },
                        { text: "No", result: { title: "Non-Specific Dyspepsia", desc: "Indigestion or general stomach sensitivity.", department: "Internal Medicine", branchId: "dahiliye" } }
                    ]
                },
                // --- SHORTNESS OF BREATH ---
                'nefes_darligi': {
                    question: "When and how did your shortness of breath start?",
                    options: [
                        { text: "Started suddenly (Within minutes)", next: 'nefes_ani' },
                        { text: "Present for days, increases with movement", next: 'nefes_kronik' },
                        { text: "Started after dust, pollen or smell", next: 'nefes_alerji' }
                    ]
                },
                'nefes_ani': {
                    question: "Is there severe pressure in chest, pain radiating to left arm or jaw?",
                    options: [
                        { text: "Yes, there is", result: { title: "HEART ATTACK RISK", desc: "LIFE THREATENING! CALL EMERGENCY IMMEDIATELY!", department: "EMERGENCY SERVICE", branchId: "acil", urgent: true } },
                        { text: "No, just short of breath", next: 'nefes_ani_carpıntı' }
                    ]
                },
                'nefes_ani_carpıntı': {
                    question: "Is your heart pounding or do you feel like dying?",
                    options: [
                        { text: "Yes, feeling faint", result: { title: "Panic Attack / Anxiety", desc: "If no physical cause, could be psychological but cardiology should see.", department: "Cardiology / Psychiatry", branchId: "kardiyoloji" } },
                        { text: "No, there is wheezing", result: { title: "Acute Respiratory Distress", desc: "Lung problem requiring urgent intervention.", department: "EMERGENCY SERVICE", branchId: "acil", urgent: true } }
                    ]
                },
                'halsizlik': {
                    question: "Is fever, chills or sore throat accompanying your fatigue?",
                    options: [
                        { text: "Yes, I have fever", next: 'halsizlik_enfeksiyon' },
                        { text: "No, just exhausted", next: 'halsizlik_kronik' }
                    ]
                },
                'halsizlik_enfeksiyon': {
                    question: "Do you have widespread body and joint pain?",
                    options: [
                        { text: "Yes, aching all over", result: { title: "Viral Infection (Flu/Covid)", desc: "Rest and plenty of fluids recommended.", department: "Internal Medicine / Infection", branchId: "dahiliye" } },
                        { text: "No, just weak", result: { title: "General Infection", desc: "Could be an inflammatory condition.", department: "Internal Medicine", branchId: "dahiliye" } }
                    ]
                },
                'bulanti': {
                    question: "Is vomiting accompanying?",
                    options: [
                        { text: "Yes, vomiting constantly", result: { title: "Gastroenteritis", department: "Internal Medicine" } },
                        { text: "No, only nausea", next: 'bulanti_bas' }
                    ]
                },
                'bulanti_bas': {
                    question: "Is there dizziness or loss of balance?",
                    options: [
                        { text: "Yes, dizzy", result: { title: "Vertigo / Inner Ear", department: "Ear Nose Throat" } },
                        { text: "No", result: { title: "Stomach Sensitivity", department: "Internal Medicine" } }
                    ]
                },
                'carpinti': {
                    question: "Is there chest pain with palpitations?",
                    options: [
                        { text: "Yes, squeezing", result: { title: "Arrhythmia", department: "Cardiology", urgent: true } },
                        { text: "No, just beating fast", result: { title: "Anxiety / Caffeine Consumption", department: "Cardiology" } }
                    ]
                },
                'idrar_yanmasi': {
                    question: "Is there back pain or fever?",
                    options: [
                        { text: "Yes, have fever", result: { title: "Kidney Infection", department: "Urology", urgent: true } },
                        { text: "No, just burning when urinating", result: { title: "Cystitis (UTI)", department: "Urology" } }
                    ]
                },
                'cilt_sorunu': {
                    question: "Is there itching?",
                    options: [
                        { text: "Yes, itching a lot", result: { title: "Allergic Reaction", department: "Dermatology" } },
                        { text: "No, just spot/acne", result: { title: "Dermatological Issue", department: "Dermatology" } }
                    ]
                }
            }
        }
    };

    // Helper to get current resources
    const getRes = () => resources[currentLanguage];

    // Listen for Language Changes
    window.addEventListener('languageChanged', (e) => {
        currentLanguage = e.detail.language;
        // Reload current view
        if (userData.symptom) {
            // If already started flow, maybe reset or try to stay? 
            // Resetting is safer to avoid data mismatch
            // But if just at demographics, we can re-render demographics
            if (document.querySelector('.gender-grid')) {
                renderDemographics();
            } else {
                // If deep in questions, reset or re-render current step?
                // Re-rendering current step might be tricky if structure differs, but keys are same.
                // Let's try to re-render current step if symptom is selected.
                initSmartAnalysis();
            }
        } else {
            renderSymptomSelector();
        }
    });

    // Check URL Params
    const urlParams = new URLSearchParams(window.location.search);
    const initialSymptom = urlParams.get('symptom');

    // Init
    if (initialSymptom) {
        userData.symptom = initialSymptom;
        renderDemographics();
    } else {
        renderSymptomSelector();
    }

    function renderSymptomSelector() {
        const res = getRes();
        const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
        const userName = loggedInUser ? loggedInUser.name : res.guestName;

        wizardContent.innerHTML = '';
        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.maxWidth = '1200px';
        container.style.animation = "fadeIn 0.5s ease";

        let html = `
            <h2 class="question-text">${res.greeting(userName)}</h2>
            <div class="symptom-selector-grid">
        `;

        res.categories.forEach(cat => {
            html += `
                <div class="symptom-category-card">
                    <h3>
                        ${cat.customIcon || `<i class="fas ${cat.icon}"></i>`} ${cat.title}
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 10px; flex: 1;">
            `;
            cat.items.forEach(item => {
                html += `
                    <button class="symptom-btn" onclick="selectSymptom('${item.id}')">
                        ${item.label} <i class="fas fa-chevron-right"></i>
                    </button>
                `;
            });
            html += `</div></div>`;
        });

        html += `</div>`;
        container.innerHTML = html;
        wizardContent.appendChild(container);

        // Add Styles if not exists (checked by class or just add)
        if (!document.getElementById('symptom-styles')) {
            const style = document.createElement('style');
            style.id = 'symptom-styles';
            style.textContent = `
                .symptom-selector-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; width: 100%; }
                @media (max-width: 1100px) { .symptom-selector-grid { grid-template-columns: repeat(2, 1fr); } }
                @media (max-width: 600px) { .symptom-selector-grid { grid-template-columns: 1fr; } }
                .symptom-btn:hover { background: #001F6B !important; color: white !important; border-color: #001F6B !important; transform: translateX(5px); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                .symptom-btn:hover i { opacity: 1 !important; }
            `;
            document.head.appendChild(style);
        }

        window.selectSymptom = function(id) {
            userData.symptom = id;
            renderDemographics();
        };
    }

    function renderDemographics() {
        const res = getRes();
        wizardContent.innerHTML = '';

        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.maxWidth = '500px';
        container.style.animation = "fadeIn 0.5s ease";

        container.innerHTML = `
            <h2 class="question-text">${res.letsKnowYou}</h2>
            
            <div style="margin-bottom: 30px;">
                <label style="display:block; margin-bottom: 10px; font-weight:600; color:#555;">${res.genderLabel}</label>
                <div class="gender-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div class="gender-option" data-value="kadin">
                        <i class="fas fa-venus" style="color: #e91e63;"></i> ${res.genderOptions.kadin}
                    </div>
                    <div class="gender-option" data-value="erkek">
                        <i class="fas fa-mars" style="color: #2196f3;"></i> ${res.genderOptions.erkek}
                    </div>
                    <div class="gender-option" data-value="diger">
                        <i class="fas fa-genderless" style="color: #9c27b0;"></i> ${res.genderOptions.diger}
                    </div>
                </div>
            </div>

            <div style="margin-bottom: 25px;">
                <label style="display:block; margin-bottom: 12px; font-weight:600; color:#555;">${res.ageLabel}</label>
                <div class="age-grid" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;">
                    <div class="age-option" data-value="child" style="padding: 10px 5px; font-size: 0.9rem;">0-12</div>
                    <div class="age-option" data-value="young" style="padding: 10px 5px; font-size: 0.9rem;">13-18</div>
                    <div class="age-option" data-value="adult" style="padding: 10px 5px; font-size: 0.9rem;">19-40</div>
                    <div class="age-option" data-value="middle" style="padding: 10px 5px; font-size: 0.9rem;">41-65</div>
                    <div class="age-option" data-value="senior" style="padding: 10px 5px; font-size: 0.9rem;">65+</div>
                </div>
            </div>

            <button id="startBtn" class="action-btn" style="width: 100%; opacity: 0.5; cursor: not-allowed; padding: 12px;" disabled>${res.startBtn}</button>
        `;

        wizardContent.appendChild(container);

        // Add Styles
        if (!document.getElementById('demo-styles')) {
            const style = document.createElement('style');
            style.id = 'demo-styles';
            style.textContent = `
                .gender-option, .age-option {
                    border: 2px solid #eee;
                    border-radius: 10px;
                    padding: 15px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-weight: 500;
                    color: #555;
                    text-align: center;
                }
                .gender-option:hover, .age-option:hover { background: #f9f9f9; border-color: #ddd; }
                .gender-option.selected, .age-option.selected {
                    border-color: #001F6B !important;
                    background: rgba(0, 31, 107, 0.1) !important;
                    color: #001F6B !important;
                    font-weight: 700;
                    box-shadow: 0 0 0 3px rgba(0, 31, 107, 0.2);
                }
                .gender-option i { display: block; font-size: 1.5rem; margin-bottom: 5px; }
            `;
            document.head.appendChild(style);
        }

        // Restore selection if exists
        const genderOptions = container.querySelectorAll('.gender-option');
        if (userData.gender) {
            genderOptions.forEach(opt => {
                if (opt.dataset.value === userData.gender) opt.classList.add('selected');
            });
        }
        
        const ageOptions = container.querySelectorAll('.age-option');
        if (userData.ageRange) {
            ageOptions.forEach(opt => {
                if (opt.dataset.value === userData.ageRange) opt.classList.add('selected');
            });
        }
        
        validateForm();

        // Listeners
        genderOptions.forEach(option => {
            option.addEventListener('click', () => {
                genderOptions.forEach(el => el.classList.remove('selected'));
                option.classList.add('selected');
                userData.gender = option.dataset.value;
                validateForm();
            });
        });

        ageOptions.forEach(option => {
            option.addEventListener('click', () => {
                ageOptions.forEach(el => el.classList.remove('selected'));
                option.classList.add('selected');
                userData.ageRange = option.dataset.value;
                userData.isSenior = (option.dataset.value === 'senior');
                validateForm();
            });
        });

        function validateForm() {
            const btn = document.getElementById('startBtn');
            if (userData.gender && userData.ageRange) {
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.disabled = false;
            }
        }

        document.getElementById('startBtn').addEventListener('click', () => {
            if (userData.gender && userData.ageRange) {
                initSmartAnalysis();
            }
        });
    }

    function initSmartAnalysis() {
        let startNode = userData.symptom;
        if (!startNode) return;
        renderStep(startNode);
    }

    function transitionContent(renderCallback) {
        const currentContent = wizardContent.firstElementChild;
        if (currentContent) {
            currentContent.style.transition = "opacity 0.3s ease, transform 0.3s ease";
            currentContent.style.opacity = "0";
            currentContent.style.transform = "translateX(-20px)";
            
            setTimeout(() => {
                wizardContent.innerHTML = '';
                renderCallback();
                const newContent = wizardContent.firstElementChild;
                if(newContent) {
                    newContent.style.opacity = "0";
                    newContent.style.transform = "translateX(20px)";
                    newContent.style.transition = "opacity 0.4s ease, transform 0.4s ease";
                    void newContent.offsetWidth;
                    newContent.style.opacity = "1";
                    newContent.style.transform = "translateX(0)";
                }
            }, 300);
        } else {
            wizardContent.innerHTML = '';
            renderCallback();
        }
    }

    function renderStep(key) {
        const res = getRes();
        const data = res.symptomData[key];
        
        // If data not found in current lang (maybe key mismatch), fallback
        if (!data) {
            console.warn("Symptom step data not found for key:", key);
            transitionContent(() => {
                _buildResultCard({
                    title: (currentLanguage === 'en' ? "Guidance" : "Yönlendirme"),
                    desc: (currentLanguage === 'en' ? "Please consult a specialist for detailed evaluation." : "Detaylı değerlendirme için lütfen bir uzmana danışınız."),
                    department: (currentLanguage === 'en' ? "Internal Medicine" : "İç Hastalıkları"),
                    branchId: "dahiliye"
                });
            });
            return;
        }
        
        transitionContent(() => {
            if (data.result) {
                _buildResultCard(data.result);
            } else {
                const wrapper = document.createElement('div');
                wrapper.style.width = '100%';
                wrapper.style.display = 'flex';
                wrapper.style.flexDirection = 'column';
                wrapper.style.alignItems = 'center';
                wrapper.style.margin = 'auto';

                const q = document.createElement('div'); 
                q.className = 'question-text'; 
                q.textContent = data.question;
                
                const grid = document.createElement('div'); 
                grid.className = 'options-grid';
                
                data.options.forEach(opt => {
                    const b = document.createElement('button'); 
                    b.className = 'option-btn'; 
                    b.innerHTML = `<span>${opt.text}</span> <i class="fas fa-chevron-right"></i>`;
                    b.onclick = () => opt.next ? renderStep(opt.next) : renderResult(opt.result);
                    grid.appendChild(b);
                });
                
                wrapper.appendChild(q); 
                wrapper.appendChild(grid);
                wizardContent.appendChild(wrapper);
            }
        });
    }

    function renderResult(res) {
        transitionContent(() => {
            _buildResultCard(res);
        });
    }

    function _buildResultCard(res) {
        const card = document.createElement('div'); 
        card.className = `premium-result-card ${res.urgent ? 'urgent' : ''}`;
        
        // Button text based on lang
        const bookBtnText = currentLanguage === 'en' ? "Book Appointment Now" : "Hemen Randevu Al";
        const recLabel = currentLanguage === 'en' ? "Recommended Department" : "Önerilen Poliklinik";
        const iconClass = res.urgent ? 'fa-ambulance' : 'fa-clipboard-check';

        card.innerHTML = `
            <div class="result-header">
                <div class="result-icon-wrapper">
                    <i class="fas ${iconClass}"></i>
                </div>
                <h3>${res.title}</h3>
            </div>
            <div class="result-body">
                <p class="result-desc">${res.desc || (currentLanguage === 'en' ? "Symptoms evaluated." : "Belirtileriniz değerlendirildi.")}</p>
                
                <div class="recommendation-box">
                    <span class="rec-label">${recLabel}</span>
                    <h2 class="rec-dept">${res.department}</h2>
                </div>
            </div>
            <div class="result-footer">
                <button class="premium-action-btn" onclick="
                    sessionStorage.setItem('recommendedBranch', '${res.branchId}');
                    sessionStorage.setItem('recommendedBranchName', '${res.department}');
                    sessionStorage.setItem('lastAiDiagnosis', '${res.title}');
                    sessionStorage.setItem('lastAiDescription', '${res.desc}');
                    window.location.href='appointment.html?branch=${res.branchId}&dep=${encodeURIComponent(res.department)}'
                ">
                    ${bookBtnText} <i class="fas fa-arrow-right"></i>
                </button>
                
                <div class="ai-disclaimer">
                    <i class="fas fa-info-circle"></i>
                    <p>${currentLanguage === 'en' ? 
                        "This result is an AI-assisted preliminary assessment. It does not replace a professional medical diagnosis. Please consult a specialist." : 
                        "Bu sonuç yapay zeka destekli bir ön değerlendirmedir. Kesin tıbbi teşhis yerine geçmez. Lütfen panik yapmadan bir uzmana danışınız."}
                    </p>
                </div>
            </div>
        `;
        wizardContent.appendChild(card);
    }
});