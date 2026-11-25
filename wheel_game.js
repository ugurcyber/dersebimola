/**
 * ==========================================================================
 * DERSE Bİ' MOLA - BAĞIMSIZ AKILLI ÇARK: ÇEVİR & ÇÖZ (wheel_game.js)
 * 1. Adım: 5 Sınıf/Konu Sekmesi, 12 Dilimli Canlı Pastel HTML5 Canvas Çarkı,
 * Gerçekçi Sürtünme Fiziği, Web Audio API Tık-Tık & Alkış Sesleri,
 * MoliVoiceEngine.speak() Entegrasyonu ve Çıkanı Çarktan Kaldır Özelliği.
 * app.js ve mevcut oyun motorlarından tamamen bağımsız çalışır.
 * ==========================================================================
 */
(function () {
  'use strict';

  const MODAL_ID = 'moli-wheel-modal';
  const STYLE_ID = 'moli-wheel-game-styles';
  const CONFETTI_CANVAS_ID = 'moli-wheel-confetti-canvas';

  // 12 Canlı Pastel Dilim Renk Paleti (Akıllı Tahtada Yüksek Kontrastlı)
  const SLICE_PALETTE = [
    { bg: '#FFE4E6', border: '#FDA4AF', text: '#9F1239', accent: '#F43F5E' },
    { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E', accent: '#F59E0B' },
    { bg: '#DCFCE7', border: '#86EFAC', text: '#166534', accent: '#22C55E' },
    { bg: '#E0F2FE', border: '#7DD3FC', text: '#075985', accent: '#0EA5E9' },
    { bg: '#EDE9FE', border: '#C4B5FD', text: '#5B21B6', accent: '#8B5CF6' },
    { bg: '#FCE7F3', border: '#F9A8D4', text: '#9D174D', accent: '#EC4899' },
    { bg: '#FFEDD5', border: '#FDBA74', text: '#9A3412', accent: '#F97316' },
    { bg: '#CCFBF1', border: '#5EEAD4', text: '#115E59', accent: '#14B8A6' },
    { bg: '#FEF9C3', border: '#FDE047', text: '#854D0E', accent: '#EAB308' },
    { bg: '#DBEAFE', border: '#93C5FD', text: '#1E40AF', accent: '#3B82F6' },
    { bg: '#F3E8FF', border: '#D8B4FE', text: '#6B21A8', accent: '#A855F7' },
    { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46', accent: '#10B981' }
  ];

  // 1. SINIF MEB MAARİF MODELİ HARF GRUPLARI (ANETİL, OKURIM, ÜSÖYDZ, ÇBGCŞ, PHVĞFJ)
  const READING1_LETTER_GROUPS = [
    { id: 'g1', label: '1. Grup (ANETİL)' },
    { id: 'g2', label: '2. Grup (OKURIM)' },
    { id: 'g3', label: '3. Grup (ÜSÖYDZ)' },
    { id: 'g4', label: '4. Grup (ÇBGCŞ)' },
    { id: 'g5', label: '5. Grup (PHVĞFJ)' },
    { id: 'all', label: '🌟 Tümü' }
  ];

  const READING1_GROUP_POOLS = {
    g1: [
      { label: 'ANNE', spoken: 'Anne. An, ne.', answer: 'an - ne (2 Hece)', detail: '1. Grup (ANETİL) • Bizi sevgiyle büyüten annemiz 💛' },
      { label: 'EL', spoken: 'El. Tek heceli kelime: El.', answer: 'el (1 Hece)', detail: '1. Grup (ANETİL) • Tutma ve yazma organımız ✋' },
      { label: 'AL', spoken: 'Al. Tek heceli kelime: Al.', answer: 'al (1 Hece)', detail: '1. Grup (ANETİL) • Kırmızı renk, al bayrak 🇹🇷' },
      { label: 'AT', spoken: 'At. Tek heceli kelime: At.', answer: 'at (1 Hece)', detail: '1. Grup (ANETİL) • Hızlı koşan binek hayvanı 🐎' },
      { label: 'NİL', spoken: 'Nil. Tek heceli özel isim: Nil.', answer: 'Nil (1 Hece)', detail: '1. Grup (ANETİL) • Özel isim ve nehir adı 🌊' },
      { label: 'TALAT', spoken: 'Talat. Ta, lat.', answer: 'Ta - lat (2 Hece)', detail: '1. Grup (ANETİL) • Özel insan ismi 👦' },
      { label: 'NANE', spoken: 'Nane. Na, ne.', answer: 'na - ne (2 Hece)', detail: '1. Grup (ANETİL) • Mis kokulu yeşil bitki 🌿' },
      { label: 'ET', spoken: 'Et. Tek heceli kelime: Et.', answer: 'et (1 Hece)', detail: '1. Grup (ANETİL) • Besleyici gıda 🥩' },
      { label: 'İT', spoken: 'İt. Tek heceli kelime: İt.', answer: 'it (1 Hece)', detail: '1. Grup (ANETİL) • İleri doğru itmek hareketi 👐' },
      { label: 'İNEK', spoken: 'İnek. İ, nek.', answer: 'i - nek (2 Hece)', detail: '1. Grup (ANETİL) • Bize süt veren çiftlik hayvanı 🐄' },
      { label: 'ALAN', spoken: 'Alan. A, lan.', answer: 'a - lan (2 Hece)', detail: '1. Grup (ANETİL) • Geniş meydan, saha 🏞️' },
      { label: 'TEN', spoken: 'Ten. Tek heceli kelime: Ten.', answer: 'ten (1 Hece)', detail: '1. Grup (ANETİL) • Cildimiz, derimiz 😊' },
      { label: 'LALE', spoken: 'Lale. La, le.', answer: 'la - le (2 Hece)', detail: '1. Grup (ANETİL) • Baharda açan zarif çiçek 🌷' }
    ],
    g2: [
      { label: 'OKUL', spoken: 'Okul. O, kul.', answer: 'o - kul (2 Hece)', detail: '2. Grup (OKURIM) • Eğitim gördüğümüz yer 🏫' },
      { label: 'KULE', spoken: 'Kule. Ku, le.', answer: 'ku - le (2 Hece)', detail: '2. Grup (OKURIM) • Yüksek yapı 🏰' },
      { label: 'KOKU', spoken: 'Koku. Ko, ku.', answer: 'ko - ku (2 Hece)', detail: '2. Grup (OKURIM) • Çiçeklerin güzel kokusu 🌸' },
      { label: 'KUKLA', spoken: 'Kukla. Kuk, la.', answer: 'kuk - la (2 Hece)', detail: '2. Grup (OKURIM) • Oyun kuklası 🎭' },
      { label: 'KULAK', spoken: 'Kulak. Ku, lak.', answer: 'ku - lak (2 Hece)', detail: '2. Grup (OKURIM) • Duyma organımız 👂' },
      { label: 'KUTU', spoken: 'Kutu. Ku, tu.', answer: 'ku - tu (2 Hece)', detail: '2. Grup (OKURIM) • Hediye kutusu 🎁' },
      { label: 'KOL', spoken: 'Kol. Tek heceli kelime: Kol.', answer: 'kol (1 Hece)', detail: '2. Grup (OKURIM) • Vücudumuzun bölümü 💪' },
      { label: 'KAR', spoken: 'Kar. Tek heceli kelime: Kar.', answer: 'kar (1 Hece)', detail: '2. Grup (OKURIM) • Kışın yağan beyaz yağış ❄️' },
      { label: 'KUM', spoken: 'Kum. Tek heceli kelime: Kum.', answer: 'kum (1 Hece)', detail: '2. Grup (OKURIM) • Deniz kıyısındaki ince taneler 🏖️' },
      { label: 'ORMAN', spoken: 'Orman. Or, man.', answer: 'or - man (2 Hece)', detail: '2. Grup (OKURIM) • Ağaçlarla dolu yeşil alan 🌲' },
      { label: 'ELMA', spoken: 'Elma. El, ma.', answer: 'el - ma (2 Hece)', detail: '2. Grup (OKURIM) • Kırmızı sulu meyve 🍎' },
      { label: 'ARI', spoken: 'Arı. A, rı.', answer: 'a - rı (2 Hece)', detail: '2. Grup (OKURIM) • Bal yapan çalışkan böcek 🐝' },
      { label: 'MASA', spoken: 'Masa. Ma, sa.', answer: 'ma - sa (2 Hece)', detail: '2. Grup (OKURIM) • Üzerinde ders çalıştığımız eşya 🪑' }
    ],
    g3: [
      { label: 'SÜT', spoken: 'Süt. Tek heceli kelime: Süt.', answer: 'süt (1 Hece)', detail: '3. Grup (ÜSÖYDZ) • Kemikleri güçlendiren beyaz içecek 🥛' },
      { label: 'ÜZÜM', spoken: 'Üzüm. Ü, züm.', answer: 'ü - züm (2 Hece)', detail: '3. Grup (ÜSÖYDZ) • Salkım salkım tatlı meyve 🍇' },
      { label: 'ÖRDEK', spoken: 'Ördek. Ör, dek.', answer: 'ör - dek (2 Hece)', detail: '3. Grup (ÜSÖYDZ) • Suda yüzen sevimli kuş 🦆' },
      { label: 'YILDIZ', spoken: 'Yıldız. Yıl, dız.', answer: 'yıl - dız (2 Hece)', detail: '3. Grup (ÜSÖYDZ) • Gece gökyüzünde parlar ⭐' },
      { label: 'DENİZ', spoken: 'Deniz. De, niz.', answer: 'de - niz (2 Hece)', detail: '3. Grup (ÜSÖYDZ) • Mavi geniş su kütlesi 🌊' },
      { label: 'SES', spoken: 'Ses. Tek heceli kelime: Ses.', answer: 'ses (1 Hece)', detail: '3. Grup (ÜSÖYDZ) • Kulağımızla duyduğumuz titreşim 🔊' },
      { label: 'YAZ', spoken: 'Yaz. Tek heceli kelime: Yaz.', answer: 'yaz (1 Hece)', detail: '3. Grup (ÜSÖYDZ) • En sıcak mevsimimiz ☀️' },
      { label: 'SÖZ', spoken: 'Söz. Tek heceli kelime: Söz.', answer: 'söz (1 Hece)', detail: '3. Grup (ÜSÖYDZ) • Anlamlı konuşma, kelime 💬' },
      { label: 'DÜZ', spoken: 'Düz. Tek heceli kelime: Düz.', answer: 'düz (1 Hece)', detail: '3. Grup (ÜSÖYDZ) • Eğri olmayan, dümdüz 📏' },
      { label: 'KEDİ', spoken: 'Kedi. Ke, di.', answer: 'ke - di (2 Hece)', detail: '3. Grup (ÜSÖYDZ) • Miyavlayan sevimli dostumuz 🐱' },
      { label: 'MASA', spoken: 'Masa. Ma, sa.', answer: 'ma - sa (2 Hece)', detail: '3. Grup (ÜSÖYDZ) • Sınıf ve ev eşyası 🪑' },
      { label: 'SU', spoken: 'Su. Tek heceli kelime: Su.', answer: 'su (1 Hece)', detail: '3. Grup (ÜSÖYDZ) • Yaşam kaynağımız 💧' }
    ],
    g4: [
      { label: 'ÇİÇEK', spoken: 'Çiçek. Çi, çek.', answer: 'çi - çek (2 Hece)', detail: '4. Grup (ÇBGCŞ) • Bahçenin renkli süsü 🌼' },
      { label: 'BALIK', spoken: 'Balık. Ba, lık.', answer: 'ba - lık (2 Hece)', detail: '4. Grup (ÇBGCŞ) • Denizde yüzen canlı 🐟' },
      { label: 'GÜNEŞ', spoken: 'Güneş. Gü, neş.', answer: 'gü - neş (2 Hece)', detail: '4. Grup (ÇBGCŞ) • Isı ve ışık kaynağımız ☀️' },
      { label: 'CAM', spoken: 'Cam. Tek heceli kelime: Cam.', answer: 'cam (1 Hece)', detail: '4. Grup (ÇBGCŞ) • Penceredeki saydam madde 🪟' },
      { label: 'ŞEKER', spoken: 'Şeker. Şe, ker.', answer: 'şe - ker (2 Hece)', detail: '4. Grup (ÇBGCŞ) • Tatlı yiyecek 🍬' },
      { label: 'ÇANTA', spoken: 'Çanta. Çan, ta.', answer: 'çan - ta (2 Hece)', detail: '4. Grup (ÇBGCŞ) • Okul eşyalarımızı taşıdığımız çanta 🎒' },
      { label: 'BULUT', spoken: 'Bulut. Bu, lut.', answer: 'bu - lut (2 Hece)', detail: '4. Grup (ÇBGCŞ) • Gökyüzündeki beyaz pamuk kümesi ☁️' },
      { label: 'GÖL', spoken: 'Göl. Tek heceli kelime: Göl.', answer: 'göl (1 Hece)', detail: '4. Grup (ÇBGCŞ) • Karalar içindeki durgun su 🏞️' },
      { label: 'CEVİZ', spoken: 'Ceviz. Ce, viz.', answer: 'ce - viz (2 Hece)', detail: '4. Grup (ÇBGCŞ) • Beyne faydalı sert kabuklu yemiş 🌰' },
      { label: 'ŞAPKA', spoken: 'Şapka. Şap, ka.', answer: 'şap - ka (2 Hece)', detail: '4. Grup (ÇBGCŞ) • Başımıza taktığımız giysi 🧢' },
      { label: 'KUŞ', spoken: 'Kuş. Tek heceli kelime: Kuş.', answer: 'kuş (1 Hece)', detail: '4. Grup (ÇBGCŞ) • Gökyüzünde uçan kanatlı canlı 🐦' }
    ],
    g5: [
      { label: 'PARA', spoken: 'Para. Pa, ra.', answer: 'pa - ra (2 Hece)', detail: '5. Grup (PHVĞFJ) • Alışveriş aracı 🪙' },
      { label: 'HAVUÇ', spoken: 'Havuç. Ha, vuç.', answer: 'ha - vuç (2 Hece)', detail: '5. Grup (PHVĞFJ) • Tavşanların sevdiği turuncu sebze 🥕' },
      { label: 'VAZO', spoken: 'Vazo. Va, zo.', answer: 'va - zo (2 Hece)', detail: '5. Grup (PHVĞFJ) • Çiçek koyduğumuz kap 🏺' },
      { label: 'DAĞ', spoken: 'Dağ. Tek heceli kelime: Dağ.', answer: 'dağ (1 Hece)', detail: '5. Grup (PHVĞFJ) • Yüksek yeryüzü şekli ⛰️' },
      { label: 'FİL', spoken: 'Fil. Tek heceli kelime: Fil.', answer: 'fil (1 Hece)', detail: '5. Grup (PHVĞFJ) • Uzun hortumlu büyük hayvan 🐘' },
      { label: 'JET', spoken: 'Jet. Tek heceli kelime: Jet.', answer: 'jet (1 Hece)', detail: '5. Grup (PHVĞFJ) • Çok hızlı uçak ✈️' },
      { label: 'PENCERE', spoken: 'Pencere. Pen, ce, re.', answer: 'pen - ce - re (3 Hece)', detail: '5. Grup (PHVĞFJ) • Odamızı aydınlatan açıklık 🪟' },
      { label: 'HALI', spoken: 'Halı. Ha, lı.', answer: 'ha - lı (2 Hece)', detail: '5. Grup (PHVĞFJ) • Yere serilen dokuma eşya 🧶' },
      { label: 'AĞAÇ', spoken: 'Ağaç. A, ğaç.', answer: 'a - ğaç (2 Hece)', detail: '5. Grup (PHVĞFJ) • Doğanın yeşil akciğeri 🌳' },
      { label: 'FENER', spoken: 'Fener. Fe, ner.', answer: 'fe - ner (2 Hece)', detail: '5. Grup (PHVĞFJ) • Karanlığı aydınlatan ışık 🔦' },
      { label: 'TOP', spoken: 'Top. Tek heceli kelime: Top.', answer: 'top (1 Hece)', detail: '5. Grup (PHVĞFJ) • Oyun oynadığımız yuvarlak araç ⚽' }
    ]
  };

  // 5 SINIF SEVİYESİ VE KONU HAVUZU
  const WHEEL_TOPICS = {
    reading1: {
      id: 'reading1',
      tabLabel: '📖 1. Sınıf Okuma',
      badge: '📖 1. Sınıf İlk Okuma ve Hece-Kelime',
      prompt: 'Okun gösterdiği kelimeyi yüksek sesle oku ve hecele!',
      isReadingMode: true,
      items: [
        ...READING1_GROUP_POOLS.g1,
        ...READING1_GROUP_POOLS.g2,
        ...READING1_GROUP_POOLS.g3,
        ...READING1_GROUP_POOLS.g4,
        ...READING1_GROUP_POOLS.g5
      ]
    },
    addsub12: {
      id: 'addsub12',
      tabLabel: '➕ 1-2. Sınıf Toplama/Çıkarma',
      badge: '➕ 1-2. Sınıf Zihinden Toplama ve Çıkarma',
      prompt: 'Çarkta çıkan işlemin sonucunu zihinden bulalım!',
      isReadingMode: false,
      items: [
        { label: '8 + 7', spoken: 'Sekiz artı yedi kaç eder?', answer: '15', detail: '8 + 7 = 15' },
        { label: '15 - 6', spoken: 'On beş eksi altı kaç eder?', answer: '9', detail: '15 - 6 = 9' },
        { label: '24 + 9', spoken: 'Yirmi dört artı dokuz kaç eder?', answer: '33', detail: '24 + 9 = 33' },
        { label: '30 - 12', spoken: 'Otuz eksi on iki kaç eder?', answer: '18', detail: '30 - 12 = 18' },
        { label: '9 + 6', spoken: 'Dokuz artı altı kaç eder?', answer: '15', detail: '9 + 6 = 15' },
        { label: '18 - 9', spoken: 'On sekiz eksi dokuz kaç eder?', answer: '9', detail: '18 - 9 = 9' },
        { label: '14 + 8', spoken: 'On dört artı sekiz kaç eder?', answer: '22', detail: '14 + 8 = 22' },
        { label: '25 - 7', spoken: 'Yirmi beş eksi yedi kaç eder?', answer: '18', detail: '25 - 7 = 18' },
        { label: '17 + 13', spoken: 'On yedi artı on üç kaç eder?', answer: '30', detail: '17 + 13 = 30' },
        { label: '40 - 15', spoken: 'Kırk eksi on beş kaç eder?', answer: '25', detail: '40 - 15 = 25' },
        { label: '19 + 6', spoken: 'On dokuz artı altı kaç eder?', answer: '25', detail: '19 + 6 = 25' },
        { label: '22 - 8', spoken: 'Yirmi iki eksi sekiz kaç eder?', answer: '14', detail: '22 - 8 = 14' },
        { label: '27 + 8', spoken: 'Yirmi yedi artı sekiz kaç eder?', answer: '35', detail: '27 + 8 = 35' },
        { label: '36 - 14', spoken: 'Otuz altı eksi on dört kaç eder?', answer: '22', detail: '36 - 14 = 22' },
        { label: '16 + 16', spoken: 'On altı artı on altı kaç eder?', answer: '32', detail: '16 + 16 = 32' },
        { label: '50 - 18', spoken: 'Elli eksi on sekiz kaç eder?', answer: '32', detail: '50 - 18 = 32' }
      ]
    },
    mult24: {
      id: 'mult24',
      tabLabel: '✖️ 2-4. Sınıf Çarpma',
      badge: '✖️ 2-4. Sınıf Çarpım Tablosu Ustası',
      prompt: 'Çarpma işleminin sonucunu hızlıca söyle!',
      isReadingMode: false,
      items: [
        { label: '3 x 4', spoken: 'Üç kere dört kaç eder?', answer: '12', detail: '3 × 4 = 12' },
        { label: '6 x 7', spoken: 'Altı kere yedi kaç eder?', answer: '42', detail: '6 × 7 = 42' },
        { label: '8 x 9', spoken: 'Sekiz kere dokuz kaç eder?', answer: '72', detail: '8 × 9 = 72' },
        { label: '7 x 6', spoken: 'Yedi kere altı kaç eder?', answer: '42', detail: '7 × 6 = 42' },
        { label: '4 x 8', spoken: 'Dört kere sekiz kaç eder?', answer: '32', detail: '4 × 8 = 32' },
        { label: '9 x 6', spoken: 'Dokuz kere altı kaç eder?', answer: '54', detail: '9 × 6 = 54' },
        { label: '7 x 8', spoken: 'Yedi kere sekiz kaç eder?', answer: '56', detail: '7 × 8 = 56' },
        { label: '5 x 9', spoken: 'Beş kere dokuz kaç eder?', answer: '45', detail: '5 × 9 = 45' },
        { label: '6 x 8', spoken: 'Altı kere sekiz kaç eder?', answer: '48', detail: '6 × 8 = 48' },
        { label: '9 x 9', spoken: 'Dokuz kere dokuz kaç eder?', answer: '81', detail: '9 × 9 = 81' },
        { label: '4 x 7', spoken: 'Dört kere yedi kaç eder?', answer: '28', detail: '4 × 7 = 28' },
        { label: '8 x 8', spoken: 'Sekiz kere sekiz kaç eder?', answer: '64', detail: '8 × 8 = 64' },
        { label: '7 x 7', spoken: 'Yedi kere yedi kaç eder?', answer: '49', detail: '7 × 7 = 49' },
        { label: '6 x 6', spoken: 'Altı kere altı kaç eder?', answer: '36', detail: '6 × 6 = 36' },
        { label: '3 x 9', spoken: 'Üç kere dokuz kaç eder?', answer: '27', detail: '3 × 9 = 27' },
        { label: '5 x 7', spoken: 'Beş kere yedi kaç eder?', answer: '35', detail: '5 × 7 = 35' }
      ]
    },
    clock23: {
      id: 'clock23',
      tabLabel: '🕒 2-3. Sınıf Saatler',
      badge: '🕒 2-3. Sınıf Tam, Yarım ve Çeyrek Saatler',
      prompt: 'Bu dijital saatin okunuşu nedir?',
      isReadingMode: false,
      items: [
        { label: '03:30', spoken: 'Saat sıfır üç otuz kaç diye okunur?', answer: 'Saat üç buçuk', detail: 'Akrep 3 ile 4 arasında, yelkovan 6 üzerinde 🕞' },
        { label: '07:15', spoken: 'Saat sıfır yedi on beş nasıl okunur?', answer: 'Yediyi çeyrek geçiyor', detail: '15 dakika = Çeyrek geçe 🕖' },
        { label: '09:45', spoken: 'Saat sıfır dokuz kırk beş nasıl okunur?', answer: 'Ona çeyrek var', detail: '45 dakika = Bir sonraki saate çeyrek kala 🕙' },
        { label: '08:00', spoken: 'Saat sıfır sekiz çift sıfır nasıl okunur?', answer: 'Saat tam sekiz', detail: 'Yelkovan 12 üzerinde, tam saat 🕗' },
        { label: '10:30', spoken: 'Saat on otuz nasıl okunur?', answer: 'Saat on buçuk', detail: '30 dakika = Yarım (Buçuk) 🕥' },
        { label: '04:15', spoken: 'Saat sıfır dört on beş nasıl okunur?', answer: 'Dördü çeyrek geçiyor', detail: '4 saat 15 dakika = Dördü çeyrek geçiyor 🕓' },
        { label: '06:45', spoken: 'Saat sıfır altı kırk beş nasıl okunur?', answer: 'Yediye çeyrek var', detail: 'Saat 7\'ye 15 dakika (çeyrek) kalmış 🕖' },
        { label: '12:00', spoken: 'Saat on iki çift sıfır nasıl okunur?', answer: 'Saat tam on iki', detail: 'Akrep ve yelkovan 12 üzerinde 🕛' },
        { label: '02:30', spoken: 'Saat sıfır iki otuz nasıl okunur?', answer: 'Saat iki buçuk', detail: 'Yelkovan 6 üzerinde = İki buçuk 🕝' },
        { label: '05:15', spoken: 'Saat sıfır beş on beş nasıl okunur?', answer: 'Beşi çeyrek geçiyor', detail: 'Yelkovan 3 üzerinde = Çeyrek geçiyor 🕔' },
        { label: '11:45', spoken: 'Saat on bir kırk beş nasıl okunur?', answer: 'On ikiye çeyrek var', detail: 'Yelkovan 9 üzerinde = Çeyrek kala 🕛' },
        { label: '01:30', spoken: 'Saat sıfır bir otuz nasıl okunur?', answer: 'Saat bir buçuk', detail: '1 saat 30 dakika = Bir buçuk 🕜' },
        { label: '09:15', spoken: 'Saat sıfır dokuz on beş nasıl okunur?', answer: 'Dokuzu çeyrek geçiyor', detail: '9\'u 15 dakika (çeyrek) geçiyor 🕘' },
        { label: '03:45', spoken: 'Saat sıfır üç kırk beş nasıl okunur?', answer: 'Dörde çeyrek var', detail: 'Saat 4\'e 15 dakika (çeyrek) var 🕓' }
      ]
    },
    fractions34: {
      id: 'fractions34',
      tabLabel: '🍕 3-4. Sınıf Kesirler',
      badge: '🍕 3-4. Sınıf Birim, Basit ve Bileşik Kesirler',
      prompt: 'Bu kesrin okunuşunu ve türünü söyleyelim!',
      isReadingMode: false,
      items: [
        { label: '1/2', spoken: 'Bir bölü iki kesri nasıl okunur ve türü nedir?', answer: 'İkide bir (Yarım) • Birim Kesir', detail: 'Payı 1 olduğu için Birim (ve aynı zamanda Basit) Kesirdir 🍕' },
        { label: '3/4', spoken: 'Üç bölü dört kesri nasıl okunur ve türü nedir?', answer: 'Dörtte üç • Basit Kesir', detail: 'Payı (3) paydasından (4) küçük olduğu için Basit Kesirdir 🍕' },
        { label: '2/5', spoken: 'İki bölü beş kesri nasıl okunur ve türü nedir?', answer: 'Beşte iki • Basit Kesir', detail: '5 eş parçadan 2\'si alınmış (Basit Kesir) 🍕' },
        { label: '5/8', spoken: 'Beş bölü sekiz kesri nasıl okunur ve türü nedir?', answer: 'Sekizde beş • Basit Kesir', detail: '8 eş parçadan 5\'i alınmış (Basit Kesir) 🍕' },
        { label: '1/4', spoken: 'Bir bölü dört kesri nasıl okunur ve türü nedir?', answer: 'Dörtte bir (Çeyrek) • Birim Kesir', detail: 'Bütünün 4 eş parçasından 1\'i (Çeyrek / Birim Kesir) 🍕' },
        { label: '1/3', spoken: 'Bir bölü üç kesri nasıl okunur ve türü nedir?', answer: 'Üçte bir • Birim Kesir', detail: 'Payı 1 olan kesirlere Birim Kesir denir 🍕' },
        { label: '7/4', spoken: 'Yedi bölü dört kesri nasıl okunur ve türü nedir?', answer: 'Yedi bölü dört • Bileşik Kesir', detail: 'Payı (7) paydasından (4) büyük olduğu için Bileşik Kesirdir 🍕' },
        { label: '4/6', spoken: 'Dört bölü altı kesri nasıl okunur ve türü nedir?', answer: 'Altıda dört • Basit Kesir', detail: '6 eş parçadan 4\'ü boyalı (Basit Kesir) 🍕' },
        { label: '5/5', spoken: 'Beş bölü beş kesri nasıl okunur ve türü nedir?', answer: 'Beşte beş (1 Tam) • Bileşik Kesir', detail: 'Payı paydasına eşit olduğu için 1 Bütündür ve Bileşik Kesirdir 🍕' },
        { label: '3/8', spoken: 'Üç bölü sekiz kesri nasıl okunur ve türü nedir?', answer: 'Sekizde üç • Basit Kesir', detail: '8 eş parçadan 3\'ü alınmış (Basit Kesir) 🍕' },
        { label: '9/5', spoken: 'Dokuz bölü beş kesri nasıl okunur ve türü nedir?', answer: 'Dokuz bölü beş • Bileşik Kesir', detail: 'Payı (9) paydasından (5) büyük olduğu için Bileşik Kesirdir 🍕' },
        { label: '1/6', spoken: 'Bir bölü altı kesri nasıl okunur ve türü nedir?', answer: 'Altıda bir • Birim Kesir', detail: '6 eş parçadan yalnızca 1\'ini gösteren Birim Kesir 🍕' },
        { label: '7/10', spoken: 'Yedi bölü on kesri nasıl okunur ve türü nedir?', answer: 'Onda yedi • Basit Kesir', detail: '10 eş parçadan 7\'si (Basit Kesir) 🍕' },
        { label: '5/3', spoken: 'Beş bölü üç kesri nasıl okunur ve türü nedir?', answer: 'Beş bölü üç • Bileşik Kesir', detail: '1 tamdan büyüktür, Bileşik Kesirdir 🍕' }
      ]
    }
  };

  // OYUN DURUMU (STATE)
  const wheelState = {
    activeTopicId: 'reading1',
    activeLetterGroupId: 'g1',
    slices: [],               // Aktif çarktaki dilimler (başlangıçta 12 dilim)
    removedLabels: new Set(), // Çarktan kaldırılanlar
    removeOnLand: false,      // "🗑️ Çıkanı Çarktan Kaldır" kutucuğu
    pendingRemovalLabel: null,// Bir sonraki çevirişten önce kaldırılacak dilim
    rotation: 0,              // Radyan cinsinden mevcut açı
    angularVelocity: 0,       // Radyan/frame hız
    isSpinning: false,
    animFrameId: null,
    lastTickSliceIdx: -1,
    selectedItem: null,
    selectedSliceColor: null,
    answerRevealed: false,
    audioCtx: null
  };

  function getAudioContext() {
    if (window.isMuted === true) return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      if (!wheelState.audioCtx || wheelState.audioCtx.state === 'closed') {
        wheelState.audioCtx = new AudioCtx();
      }
      if (wheelState.audioCtx.state === 'suspended') {
        wheelState.audioCtx.resume();
      }
      return wheelState.audioCtx;
    } catch (e) {
      return null;
    }
  }

  // Çark dönerken her dilim geçişinde hafif mekanik "tık-tık" sesi
  function playWheelTickSound(speedFactor) {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const baseFreq = 620 + Math.min(350, speedFactor * 900);
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(190, now + 0.028);

      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.032);
    } catch (e) {}
  }

  // Çark durduğunda zafer çanı
  function playWheelStopChime() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.001, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.13, now + i * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.3);
      });
    } catch (e) {}
  }

  // Cevap gösterildiğinde alkış ve fanfar efekti
  function playWheelApplauseAndFanfare() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.075);
        gain.gain.setValueAtTime(0.001, now + idx * 0.075);
        gain.gain.exponentialRampToValueAtTime(0.15, now + idx * 0.075 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.075 + 0.36);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.075);
        osc.stop(now + idx * 0.075 + 0.38);
      });

      const clapCount = 8;
      for (let i = 0; i < clapCount; i++) {
        const start = now + 0.05 + i * 0.08 + Math.random() * 0.02;
        const bufLen = Math.floor(ctx.sampleRate * 0.06);
        const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let k = 0; k < bufLen; k++) {
          data[k] = (Math.random() * 2 - 1) * Math.exp(-k / (bufLen * 0.25));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1150 + Math.random() * 650, start);
        filter.Q.setValueAtTime(1.4, start);

        const clapGain = ctx.createGain();
        clapGain.gain.setValueAtTime(0.15, start);
        clapGain.gain.exponentialRampToValueAtTime(0.001, start + 0.06);

        noise.connect(filter);
        filter.connect(clapGain);
        clapGain.connect(ctx.destination);
        noise.start(start);
        noise.stop(start + 0.065);
      }
    } catch (e) {}
  }

  function launchWheelConfetti() {
    let canvas = document.getElementById(CONFETTI_CANVAS_ID);
    if (canvas) canvas.remove();

    canvas = document.createElement('canvas');
    canvas.id = CONFETTI_CANVAS_ID;
    canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:100005;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      canvas.remove();
      return;
    }

    const colors = ['#F43F5E', '#F59E0B', '#10B981', '#0EA5E9', '#8B5CF6', '#EC4899'];
    const cx = canvas.width * 0.68;
    const cy = canvas.height * 0.48;
    const particles = Array.from({ length: 75 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 10;
      return {
        x: cx + (Math.random() - 0.5) * 100,
        y: cy + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 6 + Math.random() * 7,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.25,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1
      };
    });

    let frame = 0;
    function tick() {
      frame += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        p.vx *= 0.985;
        p.rot += p.vRot;
        p.life -= 0.015;
        if (p.life <= 0) continue;
        alive = true;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65);
        ctx.restore();
      }
      if (alive && frame < 100) {
        requestAnimationFrame(tick);
      } else {
        canvas.remove();
      }
    }
    requestAnimationFrame(tick);
  }

  function speakWithMoli(text) {
    if (!text) return;
    try {
      if (window.MoliVoiceEngine && typeof window.MoliVoiceEngine.stop === 'function') {
        window.MoliVoiceEngine.stop();
      }
    } catch (e) {}

    if (window.MoliVoiceEngine && typeof window.MoliVoiceEngine.speak === 'function') {
      try {
        window.MoliVoiceEngine.speak(text);
        return;
      } catch (e) {}
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'tr-TR';
        utter.rate = 0.95;
        window.speechSynthesis.speak(utter);
      } catch (e) {}
    }
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getActiveTopicPool(topicId) {
    const topic = WHEEL_TOPICS[topicId] || WHEEL_TOPICS.reading1;
    if (topicId === 'reading1') {
      const grp = wheelState.activeLetterGroupId || 'g1';
      if (grp !== 'all' && READING1_GROUP_POOLS[grp]) {
        return READING1_GROUP_POOLS[grp];
      }
      return topic.items;
    }
    return topic.items;
  }

  function buildTopicSlices(topicId, resetRemoved) {
    const pool = getActiveTopicPool(topicId);
    if (resetRemoved) {
      wheelState.removedLabels.clear();
      wheelState.pendingRemovalLabel = null;
    }

    const available = pool.filter((it) => !wheelState.removedLabels.has(it.label));
    if (available.length === 0) {
      wheelState.removedLabels.clear();
      wheelState.pendingRemovalLabel = null;
      return pool.slice(0, 12).map((item, idx) => ({
        ...item,
        palette: SLICE_PALETTE[idx % SLICE_PALETTE.length]
      }));
    }

    return available.slice(0, 12).map((item, idx) => ({
      ...item,
      palette: SLICE_PALETTE[idx % SLICE_PALETTE.length]
    }));
  }

  // Sağ kenardaki sabit ok (açı = 0 radyan, yani saat 3 yönü) hangi dilimi gösteriyor?
  function getPointedSliceIndex(rotation, sliceCount) {
    if (!sliceCount || sliceCount <= 0) return 0;
    const twoPi = Math.PI * 2;
    const sliceArc = twoPi / sliceCount;
    // Ok sağ kenarda (angle = 0). Çark `rotation` kadar döndüğünde 0 açısına denk gelen lokal açı:
    const relativeAngle = ((twoPi - (rotation % twoPi)) + twoPi) % twoPi;
    return Math.floor(relativeAngle / sliceArc) % sliceCount;
  }

  // HTML5 CANVAS ÇARK ÇİZİMİ (12 DİLİMLİ, CANLI PASTEL RENKLİ, AKILLI TAHTA UYUMLU)
  function drawWheelCanvas() {
    const canvas = document.getElementById('moliWheelCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssSize = 560;
    if (canvas.width !== cssSize * dpr || canvas.height !== cssSize * dpr) {
      canvas.width = cssSize * dpr;
      canvas.height = cssSize * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssSize, cssSize);

    const cx = cssSize / 2;
    const cy = cssSize / 2;
    const outerRadius = cssSize / 2 - 14;
    const sliceRadius = outerRadius - 12;

    // Dış Çerçeve Gölgeli Kasnak
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#1E293B';
    ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 8;
    ctx.fill();
    ctx.restore();

    // Altın / Beyaz Dış Çember Halkası
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius - 3, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#F59E0B';
    ctx.stroke();

    const slices = wheelState.slices;
    const count = slices.length;

    if (count === 0) {
      ctx.restore();
      return;
    }

    const sliceArc = (Math.PI * 2) / count;
    const pointedIdx = getPointedSliceIndex(wheelState.rotation, count);

    for (let i = 0; i < count; i++) {
      const startAngle = wheelState.rotation + i * sliceArc;
      const endAngle = startAngle + sliceArc;
      const slice = slices[i];
      const pal = slice.palette || SLICE_PALETTE[i % SLICE_PALETTE.length];

      // Dilim dolgusu
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, sliceRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = pal.bg;
      ctx.fill();

      // Seçili / Okun gösterdiği dilime parlak iç vurgu
      if (!wheelState.isSpinning && wheelState.selectedItem && i === pointedIdx) {
        ctx.save();
        ctx.lineWidth = 6;
        ctx.strokeStyle = pal.accent;
        ctx.stroke();
        ctx.restore();
      }

      // Dilim ayırıcı çizgi
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // Dilim dış kenar renkli şerit
      ctx.beginPath();
      ctx.arc(cx, cy, sliceRadius - 3, startAngle, endAngle);
      ctx.lineWidth = 7;
      ctx.strokeStyle = pal.accent;
      ctx.stroke();

      // Dilim Metni (Akıllı tahtada arka sıradan bile net okunacak büyük & kalın tipografi)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + sliceArc / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const textStr = String(slice.label || '');
      let fontSize = 29;
      if (count <= 6) fontSize = 33;
      if (textStr.length >= 7) fontSize = 25;
      if (textStr.length >= 9) fontSize = 22;

      ctx.font = `900 ${fontSize}px "Fredoka", "Nunito", sans-serif`;
      ctx.fillStyle = pal.text;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      const textRadius = sliceRadius - 26;
      ctx.strokeText(textStr, textRadius, 0);
      ctx.fillText(textStr, textRadius, 0);
      ctx.restore();
    }

    // Kasnak Üzerindeki 12 Beyaz/Altın Çivi Noktası (Pegs)
    for (let i = 0; i < count; i++) {
      const pegAngle = wheelState.rotation + i * sliceArc;
      const px = cx + Math.cos(pegAngle) * (sliceRadius + 2);
      const py = cy + Math.sin(pegAngle) * (sliceRadius + 2);
      ctx.beginPath();
      ctx.arc(px, py, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#F59E0B';
      ctx.stroke();
    }

    // Merkez Göbek (Dokunulabilir Çevir Göbeği)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 56, 0, Math.PI * 2);
    const hubGrad = ctx.createRadialGradient(cx - 12, cy - 12, 8, cx, cy, 56);
    hubGrad.addColorStop(0, '#F59E0B');
    hubGrad.addColorStop(1, '#D97706');
    ctx.fillStyle = hubGrad;
    ctx.shadowColor = 'rgba(15, 23, 42, 0.38)';
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 18px "Fredoka", "Nunito", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(wheelState.isSpinning ? '🎡' : 'ÇEVİR', cx, cy);
    ctx.restore();

    ctx.restore();
  }

  function applyPendingSliceRemovalIfNeeded() {
    if (!wheelState.pendingRemovalLabel) return;
    const labelToRemove = wheelState.pendingRemovalLabel;
    wheelState.pendingRemovalLabel = null;

    if (wheelState.slices.length > 2) {
      wheelState.removedLabels.add(labelToRemove);
      wheelState.slices = wheelState.slices.filter((s) => s.label !== labelToRemove);
      updateSliceCounterUI();
    }
  }

  function startWheelSpin() {
    if (wheelState.isSpinning) return;

    // Önceki turda "Çıkanı Çarktan Kaldır" işaretliyse yeni tur başlarken dilimi çarktan çıkar
    if (wheelState.removeOnLand && wheelState.pendingRemovalLabel) {
      applyPendingSliceRemovalIfNeeded();
    }

    if (wheelState.slices.length === 0) {
      wheelState.slices = buildTopicSlices(wheelState.activeTopicId, true);
    }

    wheelState.isSpinning = true;
    wheelState.answerRevealed = false;
    // Gerçekçi başlangıç açısal hızı (hızlı başlar, sürtünmeyle yavaşlar)
    wheelState.angularVelocity = 0.36 + Math.random() * 0.22;
    wheelState.lastTickSliceIdx = getPointedSliceIndex(wheelState.rotation, wheelState.slices.length);

    updateSpinButtonUI();

    const pointerEl = document.getElementById('moliWheelPointer');

    function stepFrame() {
      if (!wheelState.isSpinning) return;

      wheelState.rotation = (wheelState.rotation + wheelState.angularVelocity) % (Math.PI * 2);
      // Gerçekçi sürtünme katsayısı
      wheelState.angularVelocity *= 0.984;

      const currentIdx = getPointedSliceIndex(wheelState.rotation, wheelState.slices.length);
      if (currentIdx !== wheelState.lastTickSliceIdx) {
        wheelState.lastTickSliceIdx = currentIdx;
        playWheelTickSound(wheelState.angularVelocity);

        // Sağdaki ok imlecinde hafif esneme animasyonu
        if (pointerEl) {
          pointerEl.classList.remove('is-ticking');
          void pointerEl.offsetWidth;
          pointerEl.classList.add('is-ticking');
        }
      }

      drawWheelCanvas();

      if (wheelState.angularVelocity <= 0.0022) {
        wheelState.isSpinning = false;
        wheelState.angularVelocity = 0;
        onWheelSpinCompleted();
        return;
      }

      wheelState.animFrameId = requestAnimationFrame(stepFrame);
    }

    wheelState.animFrameId = requestAnimationFrame(stepFrame);
  }

  function onWheelSpinCompleted() {
    const count = wheelState.slices.length;
    if (count === 0) return;

    const winnerIdx = getPointedSliceIndex(wheelState.rotation, count);
    const winnerSlice = wheelState.slices[winnerIdx];
    wheelState.selectedItem = winnerSlice;
    wheelState.selectedSliceColor = winnerSlice.palette || SLICE_PALETTE[0];
    wheelState.answerRevealed = false;

    if (wheelState.removeOnLand && count > 2) {
      wheelState.pendingRemovalLabel = winnerSlice.label;
    } else {
      wheelState.pendingRemovalLabel = null;
    }

    drawWheelCanvas();
    playWheelStopChime();
    updateSpinButtonUI();
    renderResultCard(true);
  }

  function updateSpinButtonUI() {
    const spinBtn = document.getElementById('moliWheelSpinBtn');
    if (!spinBtn) return;
    spinBtn.disabled = wheelState.isSpinning;
    spinBtn.innerHTML = wheelState.isSpinning
      ? '<span aria-hidden="true">🌀</span> <span>ÇARK DÖNÜYOR...</span>'
      : '<span aria-hidden="true">🎡</span> <span>ÇARKI ÇEVİR</span>';
  }

  function updateSliceCounterUI() {
    const badge = document.getElementById('moliWheelSliceCountBadge');
    const resetBtn = document.getElementById('moliWheelResetSlicesBtn');
    if (badge) {
      badge.textContent = `🎡 ${wheelState.slices.length} Dilim Aktif`;
    }
    if (resetBtn) {
      resetBtn.style.display = wheelState.removedLabels.size > 0 ? 'inline-flex' : 'none';
    }
  }

  function renderResultCard(animatePop) {
    const container = document.getElementById('moliWheelResultCard');
    if (!container) return;

    const topic = WHEEL_TOPICS[wheelState.activeTopicId] || WHEEL_TOPICS.reading1;
    const item = wheelState.selectedItem;
    const pal = wheelState.selectedSliceColor || SLICE_PALETTE[3];

    if (!item) {
      container.innerHTML = `
        <div class="mwg-result-empty">
          <div class="mwg-empty-wheel-icon" aria-hidden="true">🎡</div>
          <span class="mwg-topic-badge">${escapeHtml(topic.badge)}</span>
          <h3 class="mwg-empty-title">Çarkı Çevirmeye Hazır mısın?</h3>
          <p class="mwg-empty-desc">
            Ortadaki çarka veya <strong>"🎡 ÇARKI ÇEVİR"</strong> butonuna dokun! Okun gösterdiği kelime veya soru burada büyüyerek açılacak.
          </p>
        </div>
      `;
      return;
    }

    const revealBtnLabel = topic.isReadingMode
      ? (wheelState.answerRevealed ? '🙈 Hecelemeyi Gizle' : '👁️ Cevabı Göster (Hecele)')
      : (wheelState.answerRevealed ? '🙈 Cevabı Gizle' : '👁️ Cevabı Göster');

    const removedNoticeHtml = (wheelState.removeOnLand && wheelState.slices.length > 2)
      ? `<div class="mwg-removed-pill">🗑️ Bu soru bir sonraki çevirişte çarktan kaldırılacak</div>`
      : '';

    container.innerHTML = `
      <div class="mwg-result-inner ${animatePop ? 'is-popping' : ''}">
        <div class="mwg-result-top-row">
          <span class="mwg-topic-badge">${escapeHtml(topic.badge)}</span>
          <span class="mwg-selected-tag" style="background:${pal.bg}; color:${pal.text}; border-color:${pal.accent};">
            🎯 Seçilen Dilim
          </span>
        </div>

        <p class="mwg-prompt-text">${escapeHtml(topic.prompt)}</p>

        <!-- BÜYÜTÜLMÜŞ SONUÇ DİLİM KUTUSU -->
        <div class="mwg-picked-display" style="background:${pal.bg}; border-color:${pal.accent}; color:${pal.text};">
          <div class="mwg-picked-value">${escapeHtml(item.label)}</div>
        </div>

        ${removedNoticeHtml}

        <!-- CEVAP KUTUSU -->
        <div class="mwg-answer-panel ${wheelState.answerRevealed ? 'is-revealed' : ''}" id="moliWheelAnswerPanel">
          ${wheelState.answerRevealed
            ? `
              <div class="mwg-answer-title">🎉 DOĞRU CEVAP:</div>
              <div class="mwg-answer-main">${escapeHtml(item.answer)}</div>
              ${item.detail ? `<div class="mwg-answer-detail">${escapeHtml(item.detail)}</div>` : ''}
            `
            : `
              <div class="mwg-answer-hidden">❓ Cevap gizli — önce öğrenciye sor, sonra <strong>"👁️ Cevabı Göster"</strong> butonuna dokun!</div>
            `
          }
        </div>

        <!-- AKSİYON BUTONLARI: 🔊 DİNLE & 👁️ CEVABI GÖSTER -->
        <div class="mwg-result-actions">
          <button class="mwg-action-btn mwg-btn-listen" id="moliWheelListenBtn" type="button">
            <span aria-hidden="true">🔊</span>
            <span>Dinle</span>
          </button>
          <button class="mwg-action-btn mwg-btn-reveal ${wheelState.answerRevealed ? 'is-active' : ''}" id="moliWheelRevealBtn" type="button">
            <span>${revealBtnLabel}</span>
          </button>
        </div>
      </div>
    `;

    const listenBtn = document.getElementById('moliWheelListenBtn');
    if (listenBtn) {
      listenBtn.addEventListener('click', () => {
        const textToRead = wheelState.answerRevealed
          ? `${item.spoken} Cevap: ${item.answer}`
          : item.spoken;
        speakWithMoli(textToRead);
      });
    }

    const revealBtn = document.getElementById('moliWheelRevealBtn');
    if (revealBtn) {
      revealBtn.addEventListener('click', () => {
        const wasRevealed = wheelState.answerRevealed;
        wheelState.answerRevealed = !wasRevealed;
        renderResultCard(false);
        if (!wasRevealed) {
          playWheelApplauseAndFanfare();
          launchWheelConfetti();
        }
      });
    }
  }

  function syncLetterGroupsBarUI() {
    const bar = document.getElementById('moliWheelLetterGroupsBar');
    if (bar) {
      bar.style.display = wheelState.activeTopicId === 'reading1' ? 'flex' : 'none';
    }
    document.querySelectorAll(`#${MODAL_ID} .mwg-letter-group-btn`).forEach((btn) => {
      const active = btn.getAttribute('data-group-id') === wheelState.activeLetterGroupId;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function switchLetterGroup(groupId) {
    if (!READING1_LETTER_GROUPS.some((g) => g.id === groupId)) return;
    if (wheelState.isSpinning) {
      wheelState.isSpinning = false;
      if (wheelState.animFrameId) cancelAnimationFrame(wheelState.animFrameId);
    }
    wheelState.activeLetterGroupId = groupId;
    wheelState.slices = buildTopicSlices('reading1', true);
    wheelState.selectedItem = null;
    wheelState.answerRevealed = false;
    wheelState.rotation = 0;

    syncLetterGroupsBarUI();
    updateSpinButtonUI();
    updateSliceCounterUI();
    drawWheelCanvas();
    renderResultCard(false);
  }

  function switchTopic(topicId) {
    if (!WHEEL_TOPICS[topicId]) return;
    if (wheelState.isSpinning) {
      wheelState.isSpinning = false;
      if (wheelState.animFrameId) cancelAnimationFrame(wheelState.animFrameId);
    }

    wheelState.activeTopicId = topicId;
    wheelState.slices = buildTopicSlices(topicId, true);
    wheelState.selectedItem = null;
    wheelState.answerRevealed = false;
    wheelState.rotation = 0;

    document.querySelectorAll(`#${MODAL_ID} .mwg-topic-tab`).forEach((btn) => {
      const active = btn.getAttribute('data-topic-id') === topicId;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    syncLetterGroupsBarUI();
    updateSpinButtonUI();
    updateSliceCounterUI();
    drawWheelCanvas();
    renderResultCard(false);
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${MODAL_ID} {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 96vw;
        height: 94vh;
        max-width: 1400px;
        z-index: 99999;
        display: none;
        flex-direction: column;
        background: linear-gradient(135deg, #1E1B4B 0%, #312E81 45%, #0F172A 100%);
        color: #0F172A;
        font-family: 'Nunito', 'Fredoka', sans-serif;
        border-radius: 28px;
        border: 4px solid rgba(255, 255, 255, 0.28);
        box-shadow: 0 0 0 100vmax rgba(2, 6, 23, 0.78), 0 32px 80px rgba(0, 0, 0, 0.75);
        overflow-y: auto;
        overflow-x: hidden;
        box-sizing: border-box;
        user-select: none;
        -webkit-user-select: none;
      }
      #${MODAL_ID}.is-open {
        display: flex;
      }
      #${MODAL_ID} * {
        box-sizing: border-box;
      }

      /* Üst Başlık ve Konu Seçici Bar */
      #${MODAL_ID} .mwg-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 20px;
        background: rgba(255, 255, 255, 0.97);
        border-bottom: 3px solid #CBD5E1;
        box-shadow: 0 6px 20px rgba(15, 23, 42, 0.25);
        flex-shrink: 0;
      }
      #${MODAL_ID} .mwg-brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      #${MODAL_ID} .mwg-brand-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, #F59E0B 0%, #EA580C 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.45rem;
        box-shadow: 0 4px 12px rgba(234, 88, 12, 0.35);
        flex-shrink: 0;
      }
      #${MODAL_ID} .mwg-brand-title {
        margin: 0;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.1rem, 1.8vw, 1.38rem);
        font-weight: 700;
        color: #1E1B4B;
      }
      #${MODAL_ID} .mwg-brand-sub {
        margin: 0;
        font-size: 0.8rem;
        font-weight: 800;
        color: #64748B;
      }
      #${MODAL_ID} .mwg-close-btn {
        background: #FEF2F2;
        border: 2px solid #FCA5A5;
        border-bottom: 4px solid #EF4444;
        color: #B91C1C;
        border-radius: 12px;
        padding: 7px 16px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        flex-shrink: 0;
        touch-action: manipulation;
        transition: transform 0.14s ease, background 0.14s ease;
      }
      #${MODAL_ID} .mwg-close-btn:hover {
        background: #FEE2E2;
        transform: translateY(-1px);
      }

      /* 5 Konu Sekmesi Barı (İnce ve Tek Satır) */
      #${MODAL_ID} .mwg-topics-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap;
        overflow-x: auto;
        gap: 8px;
        padding: 6px 16px;
        background: rgba(15, 23, 42, 0.52);
        border-bottom: 1px solid rgba(255, 255, 255, 0.16);
        flex-shrink: 0;
      }
      #${MODAL_ID} .mwg-topic-tab {
        padding: 7px 14px;
        border-radius: 12px;
        border: 2px solid rgba(255, 255, 255, 0.22);
        border-bottom: 3px solid rgba(15, 23, 42, 0.45);
        background: rgba(255, 255, 255, 0.94);
        color: #1E293B;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(0.86rem, 1.15vw, 1rem);
        font-weight: 700;
        white-space: nowrap;
        cursor: pointer;
        touch-action: manipulation;
        transition: all 0.15s ease;
      }
      #${MODAL_ID} .mwg-topic-tab:hover {
        transform: translateY(-1px);
        background: #FFFFFF;
      }
      #${MODAL_ID} .mwg-topic-tab.is-active {
        background: linear-gradient(135deg, #F59E0B 0%, #EA580C 100%);
        border-color: #FDE047;
        border-bottom-color: #9A3412;
        color: #FFFFFF;
        box-shadow: 0 5px 15px rgba(245, 158, 11, 0.45);
        transform: translateY(-1px);
      }

      /* 1. Sınıf MEB Harf Grubu Seçici Alt Barı */
      #${MODAL_ID} .mwg-letter-groups-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap;
        overflow-x: auto;
        gap: 6px;
        padding: 5px 14px;
        background: rgba(15, 23, 42, 0.72);
        border-bottom: 1px solid rgba(253, 224, 71, 0.25);
        flex-shrink: 0;
      }
      #${MODAL_ID} .mwg-letter-group-label {
        font-size: 0.78rem;
        font-weight: 800;
        color: #FDE047;
        white-space: nowrap;
        margin-right: 4px;
      }
      #${MODAL_ID} .mwg-letter-group-btn {
        padding: 5px 11px;
        border-radius: 999px;
        border: 1.5px solid rgba(255, 255, 255, 0.25);
        background: rgba(255, 255, 255, 0.12);
        color: #F8FAFC;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.8rem;
        font-weight: 700;
        white-space: nowrap;
        cursor: pointer;
        touch-action: manipulation;
        transition: all 0.14s ease;
      }
      #${MODAL_ID} .mwg-letter-group-btn:hover {
        background: rgba(255, 255, 255, 0.24);
      }
      #${MODAL_ID} .mwg-letter-group-btn.is-active {
        background: linear-gradient(135deg, #38BDF8 0%, #0284C7 100%);
        border-color: #BAE6FD;
        color: #FFFFFF;
        box-shadow: 0 3px 10px rgba(14, 165, 233, 0.45);
      }

      /* Ana Sahne: Sol/Merkez Büyük Çark + Sağ Sonuç Kartı */
      #${MODAL_ID} .mwg-stage {
        flex: 1;
        display: grid;
        grid-template-columns: minmax(480px, 620px) minmax(380px, 580px);
        align-items: center;
        justify-content: center;
        gap: 32px;
        padding: 14px 28px 18px;
        max-width: 1360px;
        width: 100%;
        margin: 0 auto;
      }

      /* Sol/Merkez: Canvas Çark Bölümü (Ekranın yarısını kaplayan 560px dev çark) */
      #${MODAL_ID} .mwg-wheel-column {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }
      #${MODAL_ID} .mwg-wheel-frame {
        position: relative;
        width: min(86vw, 560px);
        height: min(86vw, 560px);
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 18px 40px rgba(0, 0, 0, 0.5));
      }
      #${MODAL_ID} #moliWheelCanvas {
        width: 100%;
        height: 100%;
        cursor: pointer;
        border-radius: 50%;
        touch-action: manipulation;
      }

      /* Sağ Kenarda Sabit Büyük Ok İmleci */
      #${MODAL_ID} .mwg-wheel-pointer {
        position: absolute;
        right: -22px;
        top: 50%;
        transform: translateY(-50%);
        width: 68px;
        height: 62px;
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 8px 16px rgba(15, 23, 42, 0.55));
        z-index: 5;
        pointer-events: none;
        transform-origin: right center;
      }
      #${MODAL_ID} .mwg-wheel-pointer.is-ticking {
        animation: mwgPointerTick 0.11s ease-out;
      }
      @keyframes mwgPointerTick {
        0% { transform: translateY(-50%) rotate(0deg); }
        45% { transform: translateY(-50%) rotate(-18deg); }
        100% { transform: translateY(-50%) rotate(0deg); }
      }

      /* Çark Altı Kontroller */
      #${MODAL_ID} .mwg-wheel-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        width: 100%;
      }
      #${MODAL_ID} .mwg-spin-btn {
        width: 100%;
        max-width: 420px;
        padding: 16px 32px;
        border-radius: 22px;
        border: 3px solid #FDE047;
        border-bottom: 6px solid #B45309;
        background: linear-gradient(180deg, #F59E0B 0%, #EA580C 100%);
        color: #FFFFFF;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.3rem, 2.2vw, 1.6rem);
        font-weight: 700;
        letter-spacing: 0.03em;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        box-shadow: 0 12px 30px rgba(234, 88, 12, 0.5);
        touch-action: manipulation;
        transition: transform 0.14s ease, box-shadow 0.14s ease;
      }
      #${MODAL_ID} .mwg-spin-btn:hover:not(:disabled) {
        transform: translateY(-2px) scale(1.01);
      }
      #${MODAL_ID} .mwg-spin-btn:disabled {
        opacity: 0.78;
        cursor: wait;
      }

      #${MODAL_ID} .mwg-options-row {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 12px;
      }
      #${MODAL_ID} .mwg-remove-check-label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.94);
        color: #1E293B;
        font-size: 0.95rem;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.22);
      }
      #${MODAL_ID} .mwg-remove-check-label input[type="checkbox"] {
        width: 19px;
        height: 19px;
        accent-color: #EA580C;
        cursor: pointer;
      }
      #${MODAL_ID} .mwg-slice-badge {
        padding: 8px 14px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.18);
        color: #F8FAFC;
        font-size: 0.92rem;
        font-weight: 800;
      }
      #${MODAL_ID} .mwg-reset-slices-btn {
        padding: 8px 14px;
        border-radius: 12px;
        border: 2px solid #7DD3FC;
        background: #E0F2FE;
        color: #0369A1;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.92rem;
        font-weight: 700;
        cursor: pointer;
      }

      /* Sağ Sütun: Büyütülmüş Sonuç Kartı */
      #${MODAL_ID} .mwg-result-card {
        background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
        border: 4px solid #E2E8F0;
        border-bottom: 10px solid #CBD5E1;
        border-radius: 32px;
        padding: 30px;
        box-shadow: 0 26px 65px rgba(15, 23, 42, 0.45);
        min-height: 480px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      #${MODAL_ID} .mwg-result-inner.is-popping {
        animation: mwgCardPop 0.36s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes mwgCardPop {
        0% { transform: scale(0.86); opacity: 0.3; }
        100% { transform: scale(1); opacity: 1; }
      }
      #${MODAL_ID} .mwg-result-empty {
        text-align: center;
        padding: 24px 12px;
      }
      #${MODAL_ID} .mwg-empty-wheel-icon {
        font-size: 4.8rem;
        margin-bottom: 12px;
      }
      #${MODAL_ID} .mwg-empty-title {
        margin: 14px 0 10px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.85rem;
        color: #1E1B4B;
      }
      #${MODAL_ID} .mwg-empty-desc {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 700;
        color: #475569;
        line-height: 1.55;
      }

      #${MODAL_ID} .mwg-result-top-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 12px;
      }
      #${MODAL_ID} .mwg-topic-badge {
        display: inline-block;
        padding: 7px 14px;
        border-radius: 999px;
        background: #EEF2FF;
        color: #4338CA;
        font-size: 0.94rem;
        font-weight: 800;
      }
      #${MODAL_ID} .mwg-selected-tag {
        padding: 6px 14px;
        border-radius: 999px;
        border: 2px solid;
        font-size: 0.92rem;
        font-weight: 800;
      }
      #${MODAL_ID} .mwg-prompt-text {
        margin: 4px 0 16px;
        font-size: 1.2rem;
        font-weight: 800;
        color: #334155;
      }

      #${MODAL_ID} .mwg-picked-display {
        border: 5px solid;
        border-radius: 26px;
        padding: 28px 20px;
        text-align: center;
        margin-bottom: 16px;
        box-shadow: inset 0 2px 12px rgba(255, 255, 255, 0.75), 0 12px 26px rgba(15, 23, 42, 0.14);
      }
      #${MODAL_ID} .mwg-picked-value {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(3rem, 5.8vw, 4.8rem);
        font-weight: 700;
        line-height: 1.1;
        letter-spacing: 0.03em;
      }

      #${MODAL_ID} .mwg-removed-pill {
        margin-bottom: 14px;
        padding: 8px 14px;
        border-radius: 12px;
        background: #FFF7ED;
        border: 1.5px solid #FDBA74;
        color: #C2410C;
        font-size: 0.9rem;
        font-weight: 800;
        text-align: center;
      }

      #${MODAL_ID} .mwg-answer-panel {
        padding: 20px;
        border-radius: 20px;
        background: #F8FAFC;
        border: 3px dashed #CBD5E1;
        text-align: center;
        margin-bottom: 18px;
      }
      #${MODAL_ID} .mwg-answer-panel.is-revealed {
        background: linear-gradient(135deg, #ECFDF5 0%, #FEFCE8 100%);
        border: 3.5px solid #22C55E;
        box-shadow: 0 10px 26px rgba(34, 197, 94, 0.22);
      }
      #${MODAL_ID} .mwg-answer-hidden {
        font-size: 1.08rem;
        font-weight: 700;
        color: #64748B;
      }
      #${MODAL_ID} .mwg-answer-title {
        font-size: 0.95rem;
        font-weight: 800;
        color: #15803D;
        letter-spacing: 0.05em;
        margin-bottom: 6px;
      }
      #${MODAL_ID} .mwg-answer-main {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.9rem, 3.5vw, 2.85rem);
        font-weight: 700;
        color: #166534;
      }
      #${MODAL_ID} .mwg-answer-detail {
        margin-top: 6px;
        font-size: 1.05rem;
        font-weight: 800;
        color: #0F766E;
      }

      #${MODAL_ID} .mwg-result-actions {
        display: grid;
        grid-template-columns: 1fr 1.35fr;
        gap: 14px;
      }
      #${MODAL_ID} .mwg-action-btn {
        padding: 16px 20px;
        border-radius: 18px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.2rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        touch-action: manipulation;
        transition: transform 0.14s ease, box-shadow 0.14s ease;
      }
      #${MODAL_ID} .mwg-action-btn:hover {
        transform: translateY(-2px);
      }
      #${MODAL_ID} .mwg-btn-listen {
        background: linear-gradient(180deg, #0EA5E9 0%, #0284C7 100%);
        border: 2px solid #0284C7;
        border-bottom: 5px solid #0369A1;
        color: #FFFFFF;
        box-shadow: 0 8px 20px rgba(2, 132, 199, 0.32);
      }
      #${MODAL_ID} .mwg-btn-reveal {
        background: linear-gradient(180deg, #10B981 0%, #059669 100%);
        border: 2px solid #059669;
        border-bottom: 5px solid #047857;
        color: #FFFFFF;
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.32);
      }
      #${MODAL_ID} .mwg-btn-reveal.is-active {
        background: linear-gradient(180deg, #64748B 0%, #475569 100%);
        border-color: #475569;
        border-bottom-color: #334155;
      }

      @media (max-width: 1024px) {
        #${MODAL_ID} .mwg-stage {
          grid-template-columns: 1fr;
          padding: 14px;
          gap: 18px;
        }
        #${MODAL_ID} .mwg-wheel-frame {
          width: min(84vw, 440px);
          height: min(84vw, 440px);
        }
        #${MODAL_ID} .mwg-result-card {
          min-height: auto;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function buildModal() {
    if (document.getElementById(MODAL_ID)) return;
    injectStyles();

    const modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Akıllı Çark: Çevir ve Çöz');

    const tabsHtml = Object.values(WHEEL_TOPICS).map((t) => `
      <button class="mwg-topic-tab ${t.id === wheelState.activeTopicId ? 'is-active' : ''}"
              type="button"
              role="tab"
              data-topic-id="${t.id}"
              aria-selected="${t.id === wheelState.activeTopicId ? 'true' : 'false'}">
        ${escapeHtml(t.tabLabel)}
      </button>
    `).join('');

    const letterGroupsHtml = READING1_LETTER_GROUPS.map((g) => `
      <button class="mwg-letter-group-btn ${g.id === wheelState.activeLetterGroupId ? 'is-active' : ''}"
              type="button"
              data-group-id="${g.id}"
              aria-pressed="${g.id === wheelState.activeLetterGroupId ? 'true' : 'false'}">
        ${escapeHtml(g.label)}
      </button>
    `).join('');

    modal.innerHTML = `
      <header class="mwg-topbar">
        <div class="mwg-brand">
          <div class="mwg-brand-icon" aria-hidden="true">🎡</div>
          <div>
            <h2 class="mwg-brand-title">🎡 Akıllı Çark: Çevir &amp; Çöz</h2>
            <p class="mwg-brand-sub">Sınıf Seviyene Göre Konunu Seç, Çarkı Çevir ve Soruyu Çöz!</p>
          </div>
        </div>
        <button class="mwg-close-btn" id="moliWheelCloseBtn" type="button" aria-label="Akıllı Çarkı Kapat">✕ Kapat</button>
      </header>

      <nav class="mwg-topics-bar" role="tablist" aria-label="Sınıf ve Konu Seçimi">
        ${tabsHtml}
      </nav>

      <div class="mwg-letter-groups-bar" id="moliWheelLetterGroupsBar" role="toolbar" aria-label="1. Sınıf MEB Harf Grubu Seçimi">
        <span class="mwg-letter-group-label">🔤 Harf Grubu:</span>
        ${letterGroupsHtml}
      </div>

      <div class="mwg-stage">
        <div class="mwg-wheel-column">
          <div class="mwg-wheel-frame">
            <canvas id="moliWheelCanvas" width="560" height="560" title="Çarkı çevirmek için dokunun"></canvas>
            <!-- Sağ Kenarda Sabit Büyük Ok İmleci -->
            <div class="mwg-wheel-pointer" id="moliWheelPointer" aria-hidden="true">
              <svg width="68" height="62" viewBox="0 0 58 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 27L46 5V49L4 27Z" fill="#EF4444" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round"/>
                <circle cx="44" cy="27" r="7" fill="#FDE047" stroke="#FFFFFF" stroke-width="3"/>
              </svg>
            </div>
          </div>

          <div class="mwg-wheel-controls">
            <button class="mwg-spin-btn" id="moliWheelSpinBtn" type="button">
              <span aria-hidden="true">🎡</span>
              <span>ÇARKI ÇEVİR</span>
            </button>

            <div class="mwg-options-row">
              <label class="mwg-remove-check-label" for="moliWheelRemoveChk">
                <input type="checkbox" id="moliWheelRemoveChk">
                <span>🗑️ Çıkanı Çarktan Kaldır</span>
              </label>
              <span class="mwg-slice-badge" id="moliWheelSliceCountBadge">🎡 12 Dilim Aktif</span>
              <button class="mwg-reset-slices-btn" id="moliWheelResetSlicesBtn" type="button" style="display:none;">
                ↺ Dilimleri Sıfırla
              </button>
            </div>
          </div>
        </div>

        <div class="mwg-result-card" id="moliWheelResultCard" aria-live="polite"></div>
      </div>
    `;

    document.body.appendChild(modal);

    // Olay Dinleyicileri
    document.getElementById('moliWheelCloseBtn').addEventListener('click', closeWheelGame);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeWheelGame();
      }
    });

    modal.querySelectorAll('.mwg-topic-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const topicId = btn.getAttribute('data-topic-id');
        switchTopic(topicId);
      });
    });

    modal.querySelectorAll('.mwg-letter-group-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const groupId = btn.getAttribute('data-group-id');
        switchLetterGroup(groupId);
      });
    });

    const spinBtn = document.getElementById('moliWheelSpinBtn');
    const canvasEl = document.getElementById('moliWheelCanvas');
    if (spinBtn) spinBtn.addEventListener('click', startWheelSpin);
    if (canvasEl) canvasEl.addEventListener('click', startWheelSpin);

    const removeChk = document.getElementById('moliWheelRemoveChk');
    if (removeChk) {
      removeChk.addEventListener('change', (e) => {
        wheelState.removeOnLand = !!e.target.checked;
        if (wheelState.removeOnLand && wheelState.selectedItem && wheelState.slices.length > 2) {
          wheelState.pendingRemovalLabel = wheelState.selectedItem.label;
        } else {
          wheelState.pendingRemovalLabel = null;
        }
        renderResultCard(false);
      });
    }

    const resetBtn = document.getElementById('moliWheelResetSlicesBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        wheelState.slices = buildTopicSlices(wheelState.activeTopicId, true);
        wheelState.selectedItem = null;
        wheelState.answerRevealed = false;
        updateSliceCounterUI();
        drawWheelCanvas();
        renderResultCard(false);
      });
    }

    wheelState.slices = buildTopicSlices(wheelState.activeTopicId, true);
    updateSliceCounterUI();
    drawWheelCanvas();
    renderResultCard(false);
  }

  function openWheelGame(initialTopicId) {
    buildModal();
    if (initialTopicId && WHEEL_TOPICS[initialTopicId]) {
      switchTopic(initialTopicId);
    } else {
      drawWheelCanvas();
    }
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.add('is-open');
  }

  function closeWheelGame() {
    if (wheelState.isSpinning) {
      wheelState.isSpinning = false;
      if (wheelState.animFrameId) cancelAnimationFrame(wheelState.animFrameId);
    }
    try {
      if (window.MoliVoiceEngine && typeof window.MoliVoiceEngine.stop === 'function') {
        window.MoliVoiceEngine.stop();
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } catch (e) {}

    const confetti = document.getElementById(CONFETTI_CANVAS_ID);
    if (confetti) confetti.remove();

    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.remove('is-open');
  }

  // Global Erişim Fonksiyonları
  window.openMoliSmartWheel = openWheelGame;
  window.closeMoliSmartWheel = closeWheelGame;

  // Popüler Oyunlar vitrinindeki kartı ve varsa dinamik tetikleyicileri bağla
  function injectAndBindShowcaseCard() {
    const arcadeGrid = document.querySelector('#arcadeHubSection .arcade-games-grid');
    if (arcadeGrid && !document.getElementById('arcadeCardSmartWheel')) {
      const card = document.createElement('div');
      card.className = 'arcade-game-card theme-wheel';
      card.id = 'arcadeCardSmartWheel';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.innerHTML = `
        <div class="arcade-card-hero-banner banner-wheel" aria-hidden="true">
          <div class="banner-scene scene-wheel">
            <div class="mini-wheel-wrap">
              <span class="mini-wheel-icon">🎡</span>
              <span class="mini-gift-icon">🎯</span>
            </div>
            <span class="badge-blinking-new">🔴 YENİ</span>
          </div>
        </div>
        <div class="arcade-card-top">
          <span class="arcade-card-tag">🎡 1-4. Sınıf &amp; Tahta</span>
          <span class="arcade-card-chip chip-orange">✨ 5 Konu Sekmesi</span>
        </div>
        <h3 class="arcade-card-title">🎡 Akıllı Çark: Çevir &amp; Çöz</h3>
        <p class="arcade-card-desc">1. Sınıf Okuma, Toplama/Çıkarma, Çarpma, Saatler ve Kesirler! 12 dilimli çarkı çevir, sesli dinle ve çöz!</p>
        <div class="arcade-card-badges">
          <span>🎡 12 Dilimli Canvas Çark</span>
          <span>🔊 Sesli Oku &amp; Alkış</span>
        </div>
        <button class="arcade-card-play-btn" type="button">Çarkı Çevir ›</button>
      `;
      arcadeGrid.insertBefore(card, arcadeGrid.firstChild);
    }

    document.querySelectorAll('[data-open-moli-wheel], #arcadeCardSmartWheel').forEach((el) => {
      if (el.dataset.moliWheelBound) return;
      el.dataset.moliWheelBound = '1';
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const topic = el.getAttribute('data-wheel-topic') || undefined;
        openWheelGame(topic);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          const topic = el.getAttribute('data-wheel-topic') || undefined;
          openWheelGame(topic);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectAndBindShowcaseCard);
  } else {
    injectAndBindShowcaseCard();
  }
})();
