/**
 * ==========================================================================
 * DERSE Bİ' MOLA - BAĞIMSIZ NEŞELİ PATİKA: ZIPLA & İLERLE (path_game.js)
 * 4. Adım: 5 Sınıf/Konu Sekmesi, Tam Ekran (%96 Genişlik & %94 Yükseklik),
 * %30 Büyütülmüş Soru Kutuları, Cevap Kartları ve Moli Karakteri,
 * Canlı Arka Plan Gradyanları, 8 Taşlı Patika Zıplama Animasyonu,
 * Web Audio API Ses Efektleri & MoliVoiceEngine.speak() Entegrasyonu.
 * app.js ve mevcut oyun motorlarından tamamen bağımsız çalışır.
 * ==========================================================================
 */
(function () {
  'use strict';

  const MODAL_ID = 'moli-path-modal';
  const STYLE_ID = 'moli-path-game-styles';
  const CONFETTI_CANVAS_ID = 'moli-path-confetti-canvas';
  const TOTAL_STEPS = 8;

  // 1. SINIF MEB MAARİF MODELİ HARF GRUPLARI (HECE TAMAMLAMA: an + [ne], ku + [tu], ba + [lık] vb.)
  const READING1_LETTER_GROUPS = [
    { id: 'g1', label: '1. Grup (ANETİL)' },
    { id: 'g2', label: '2. Grup (OKURIM)' },
    { id: 'g3', label: '3. Grup (ÜSÖYDZ)' },
    { id: 'g4', label: '4. Grup (ÇBGCŞ)' },
    { id: 'g5', label: '5. Grup (PHVĞFJ)' },
    { id: 'all', label: '🌟 Tümü' }
  ];

  const READING1_GROUP_QUESTIONS = {
    g1: [
      { promptText: 'an + [ ? ] = anne', spokenText: 'Anne! An, ne. Eksik hece hangisi?', answer: 'ne', distractors: ['na', 'la'] },
      { promptText: 'na + [ ? ] = nane', spokenText: 'Nane! Na, ne. Eksik hece hangisi?', answer: 'ne', distractors: ['la', 'ta'] },
      { promptText: 'la + [ ? ] = lale', spokenText: 'Lale! La, le. Eksik hece hangisi?', answer: 'le', distractors: ['ne', 'na'] },
      { promptText: 'ta + [ ? ] = talat', spokenText: 'Talat! Ta, lat. Eksik hece hangisi?', answer: 'lat', distractors: ['lan', 'la'] },
      { promptText: 'a + [ ? ] = alan', spokenText: 'Alan! A, lan. Eksik hece hangisi?', answer: 'lan', distractors: ['lat', 'le'] },
      { promptText: 'i + [ ? ] = inek', spokenText: 'İnek! İ, nek. Eksik hece hangisi?', answer: 'nek', distractors: ['nil', 'ten'] },
      { promptText: '[ ? ] + ne = anne', spokenText: 'Anne! An, ne. Baştaki hece hangisi?', answer: 'an', distractors: ['al', 'at'] },
      { promptText: '[ ? ] + le = lale', spokenText: 'Lale! La, le. Baştaki hece hangisi?', answer: 'la', distractors: ['na', 'ta'] },
      { promptText: 'e + l = [ ? ]', spokenText: 'El! Tek heceli kelime: El.', answer: 'el', distractors: ['al', 'et'] },
      { promptText: 'a + l = [ ? ]', spokenText: 'Al! Tek heceli kelime: Al.', answer: 'al', distractors: ['el', 'at'] },
      { promptText: 'a + t = [ ? ]', spokenText: 'At! Tek heceli kelime: At.', answer: 'at', distractors: ['al', 'it'] },
      { promptText: 'n + i + l = [ ? ]', spokenText: 'Nil! Tek heceli özel isim: Nil.', answer: 'nil', distractors: ['ten', 'el'] },
      { promptText: 'e + t = [ ? ]', spokenText: 'Et! Tek heceli kelime: Et.', answer: 'et', distractors: ['it', 'el'] },
      { promptText: 'i + t = [ ? ]', spokenText: 'İt! Tek heceli kelime: İt.', answer: 'it', distractors: ['et', 'at'] },
      { promptText: 't + e + n = [ ? ]', spokenText: 'Ten! Tek heceli kelime: Ten.', answer: 'ten', distractors: ['nil', 'et'] }
    ],
    g2: [
      { promptText: 'o + [ ? ] = okul', spokenText: 'Okul! O, kul. Eksik hece hangisi?', answer: 'kul', distractors: ['kol', 'kum'] },
      { promptText: 'ku + [ ? ] = kule', spokenText: 'Kule! Ku, le. Eksik hece hangisi?', answer: 'le', distractors: ['tu', 'ku'] },
      { promptText: 'ko + [ ? ] = koku', spokenText: 'Koku! Ko, ku. Eksik hece hangisi?', answer: 'ku', distractors: ['tu', 'la'] },
      { promptText: 'kuk + [ ? ] = kukla', spokenText: 'Kukla! Kuk, la. Eksik hece hangisi?', answer: 'la', distractors: ['lak', 'le'] },
      { promptText: 'ku + [ ? ] = kulak', spokenText: 'Kulak! Ku, lak. Eksik hece hangisi?', answer: 'lak', distractors: ['la', 'kul'] },
      { promptText: 'ku + [ ? ] = kutu', spokenText: 'Kutu! Ku, tu. Eksik hece hangisi?', answer: 'tu', distractors: ['ku', 'le'] },
      { promptText: 'or + [ ? ] = orman', spokenText: 'Orman! Or, man. Eksik hece hangisi?', answer: 'man', distractors: ['ma', 'sa'] },
      { promptText: 'el + [ ? ] = elma', spokenText: 'Elma! El, ma. Eksik hece hangisi?', answer: 'ma', distractors: ['sa', 'la'] },
      { promptText: 'a + [ ? ] = arı', spokenText: 'Arı! A, rı. Eksik hece hangisi?', answer: 'rı', distractors: ['ra', 'ma'] },
      { promptText: 'ma + [ ? ] = masa', spokenText: 'Masa! Ma, sa. Eksik hece hangisi?', answer: 'sa', distractors: ['ma', 'la'] },
      { promptText: 'k + o + l = [ ? ]', spokenText: 'Kol! Tek heceli kelime: Kol.', answer: 'kol', distractors: ['kar', 'kum'] },
      { promptText: 'k + a + r = [ ? ]', spokenText: 'Kar! Tek heceli kelime: Kar.', answer: 'kar', distractors: ['kol', 'kum'] },
      { promptText: 'k + u + m = [ ? ]', spokenText: 'Kum! Tek heceli kelime: Kum.', answer: 'kum', distractors: ['kol', 'kar'] }
    ],
    g3: [
      { promptText: 'ü + [ ? ] = üzüm', spokenText: 'Üzüm! Ü, züm. Eksik hece hangisi?', answer: 'züm', distractors: ['dek', 'dız'] },
      { promptText: 'ör + [ ? ] = ördek', spokenText: 'Ördek! Ör, dek. Eksik hece hangisi?', answer: 'dek', distractors: ['züm', 'niz'] },
      { promptText: 'yıl + [ ? ] = yıldız', spokenText: 'Yıldız! Yıl, dız. Eksik hece hangisi?', answer: 'dız', distractors: ['niz', 'düz'] },
      { promptText: 'de + [ ? ] = deniz', spokenText: 'Deniz! De, niz. Eksik hece hangisi?', answer: 'niz', distractors: ['dız', 'di'] },
      { promptText: 'ke + [ ? ] = kedi', spokenText: 'Kedi! Ke, di. Eksik hece hangisi?', answer: 'di', distractors: ['sa', 'su'] },
      { promptText: 'ma + [ ? ] = masa', spokenText: 'Masa! Ma, sa. Eksik hece hangisi?', answer: 'sa', distractors: ['di', 'su'] },
      { promptText: 's + ü + t = [ ? ]', spokenText: 'Süt! Tek heceli kelime: Süt.', answer: 'süt', distractors: ['ses', 'söz'] },
      { promptText: 's + e + s = [ ? ]', spokenText: 'Ses! Tek heceli kelime: Ses.', answer: 'ses', distractors: ['söz', 'süt'] },
      { promptText: 'y + a + z = [ ? ]', spokenText: 'Yaz! Tek heceli kelime: Yaz.', answer: 'yaz', distractors: ['düz', 'söz'] },
      { promptText: 's + ö + z = [ ? ]', spokenText: 'Söz! Tek heceli kelime: Söz.', answer: 'söz', distractors: ['ses', 'düz'] },
      { promptText: 'd + ü + z = [ ? ]', spokenText: 'Düz! Tek heceli kelime: Düz.', answer: 'düz', distractors: ['söz', 'yaz'] },
      { promptText: 's + u = [ ? ]', spokenText: 'Su! Tek heceli kelime: Su.', answer: 'su', distractors: ['süt', 'ses'] }
    ],
    g4: [
      { promptText: 'çi + [ ? ] = çiçek', spokenText: 'Çiçek! Çi, çek. Eksik hece hangisi?', answer: 'çek', distractors: ['ker', 'viz'] },
      { promptText: 'ba + [ ? ] = balık', spokenText: 'Balık! Ba, lık. Eksik hece hangisi?', answer: 'lık', distractors: ['lut', 'çek'] },
      { promptText: 'gü + [ ? ] = güneş', spokenText: 'Güneş! Gü, neş. Eksik hece hangisi?', answer: 'neş', distractors: ['ker', 'kuş'] },
      { promptText: 'şe + [ ? ] = şeker', spokenText: 'Şeker! Şe, ker. Eksik hece hangisi?', answer: 'ker', distractors: ['ka', 'neş'] },
      { promptText: 'çan + [ ? ] = çanta', spokenText: 'Çanta! Çan, ta. Eksik hece hangisi?', answer: 'ta', distractors: ['ka', 'ba'] },
      { promptText: 'bu + [ ? ] = bulut', spokenText: 'Bulut! Bu, lut. Eksik hece hangisi?', answer: 'lut', distractors: ['lık', 'viz'] },
      { promptText: 'ce + [ ? ] = ceviz', spokenText: 'Ceviz! Ce, viz. Eksik hece hangisi?', answer: 'viz', distractors: ['lut', 'çek'] },
      { promptText: 'şap + [ ? ] = şapka', spokenText: 'Şapka! Şap, ka. Eksik hece hangisi?', answer: 'ka', distractors: ['ta', 'ker'] },
      { promptText: 'c + a + m = [ ? ]', spokenText: 'Cam! Tek heceli kelime: Cam.', answer: 'cam', distractors: ['göl', 'kuş'] },
      { promptText: 'g + ö + l = [ ? ]', spokenText: 'Göl! Tek heceli kelime: Göl.', answer: 'göl', distractors: ['kuş', 'cam'] },
      { promptText: 'k + u + ş = [ ? ]', spokenText: 'Kuş! Tek heceli kelime: Kuş.', answer: 'kuş', distractors: ['göl', 'cam'] }
    ],
    g5: [
      { promptText: 'pa + [ ? ] = para', spokenText: 'Para! Pa, ra. Eksik hece hangisi?', answer: 'ra', distractors: ['zo', 'lı'] },
      { promptText: 'ha + [ ? ] = havuç', spokenText: 'Havuç! Ha, vuç. Eksik hece hangisi?', answer: 'vuç', distractors: ['ğaç', 'lı'] },
      { promptText: 'va + [ ? ] = vazo', spokenText: 'Vazo! Va, zo. Eksik hece hangisi?', answer: 'zo', distractors: ['ra', 'lı'] },
      { promptText: 'pen + ce + [ ? ] = pencere', spokenText: 'Pencere! Pen, ce, re. Son hece hangisi?', answer: 're', distractors: ['ra', 'ner'] },
      { promptText: 'ha + [ ? ] = halı', spokenText: 'Halı! Ha, lı. Eksik hece hangisi?', answer: 'lı', distractors: ['ra', 'zo'] },
      { promptText: 'a + [ ? ] = ağaç', spokenText: 'Ağaç! A, ğaç. Eksik hece hangisi?', answer: 'ğaç', distractors: ['vuç', 'dağ'] },
      { promptText: 'fe + [ ? ] = fener', spokenText: 'Fener! Fe, ner. Eksik hece hangisi?', answer: 'ner', distractors: ['re', 'vuç'] },
      { promptText: 'd + a + ğ = [ ? ]', spokenText: 'Dağ! Tek heceli kelime: Dağ.', answer: 'dağ', distractors: ['top', 'fil'] },
      { promptText: 'f + i + l = [ ? ]', spokenText: 'Fil! Tek heceli kelime: Fil.', answer: 'fil', distractors: ['jet', 'top'] },
      { promptText: 'j + e + t = [ ? ]', spokenText: 'Jet! Tek heceli kelime: Jet.', answer: 'jet', distractors: ['fil', 'top'] },
      { promptText: 't + o + p = [ ? ]', spokenText: 'Top! Tek heceli kelime: Top.', answer: 'top', distractors: ['dağ', 'jet'] }
    ]
  };

  // 5 SINIF SEVİYESİ VE KONU HAVUZU
  const PATH_TOPICS = {
    reading1: {
      id: 'reading1',
      tabLabel: '📖 1. Sınıf Okuma',
      badge: '📖 1. Sınıf Hece Tamamla & Taştan Taşa Zıpla!',
      isListeningPrompt: true,
      questions: [
        ...READING1_GROUP_QUESTIONS.g1,
        ...READING1_GROUP_QUESTIONS.g2,
        ...READING1_GROUP_QUESTIONS.g3,
        ...READING1_GROUP_QUESTIONS.g4,
        ...READING1_GROUP_QUESTIONS.g5
      ]
    },
    addsub12: {
      id: 'addsub12',
      tabLabel: '➕ 1-2. Sınıf Toplama/Çıkarma',
      badge: '➕ 1-2. Sınıf İşlemi Çöz & İleri Zıpla!',
      isListeningPrompt: false,
      questions: [
        { promptText: '8 + 7 = ?', spokenText: 'Sekiz artı yedi kaç eder?', answer: '15', distractors: ['14', '16'] },
        { promptText: '15 - 6 = ?', spokenText: 'On beş eksi altı kaç eder?', answer: '9', distractors: ['8', '11'] },
        { promptText: '24 + 9 = ?', spokenText: 'Yirmi dört artı dokuz kaç eder?', answer: '33', distractors: ['31', '35'] },
        { promptText: '30 - 12 = ?', spokenText: 'Otuz eksi on iki kaç eder?', answer: '18', distractors: ['16', '22'] },
        { promptText: '18 - 9 = ?', spokenText: 'On sekiz eksi dokuz kaç eder?', answer: '9', distractors: ['7', '11'] },
        { promptText: '14 + 8 = ?', spokenText: 'On dört artı sekiz kaç eder?', answer: '22', distractors: ['20', '24'] },
        { promptText: '25 - 7 = ?', spokenText: 'Yirmi beş eksi yedi kaç eder?', answer: '18', distractors: ['17', '19'] },
        { promptText: '17 + 13 = ?', spokenText: 'On yedi artı on üç kaç eder?', answer: '30', distractors: ['28', '32'] },
        { promptText: '40 - 15 = ?', spokenText: 'Kırk eksi on beş kaç eder?', answer: '25', distractors: ['20', '35'] },
        { promptText: '19 + 6 = ?', spokenText: 'On dokuz artı altı kaç eder?', answer: '25', distractors: ['24', '27'] },
        { promptText: '22 - 8 = ?', spokenText: 'Yirmi iki eksi sekiz kaç eder?', answer: '14', distractors: ['12', '16'] },
        { promptText: '27 + 8 = ?', spokenText: 'Yirmi yedi artı sekiz kaç eder?', answer: '35', distractors: ['33', '37'] }
      ]
    },
    mult24: {
      id: 'mult24',
      tabLabel: '✖️ 2-4. Sınıf Çarpma',
      badge: '✖️ 2-4. Sınıf Çarpım Tablosu Patikası',
      isListeningPrompt: false,
      questions: [
        { promptText: '3 × 4 = ?', spokenText: 'Üç kere dört kaç eder?', answer: '12', distractors: ['9', '16'] },
        { promptText: '6 × 7 = ?', spokenText: 'Altı kere yedi kaç eder?', answer: '42', distractors: ['36', '48'] },
        { promptText: '8 × 9 = ?', spokenText: 'Sekiz kere dokuz kaç eder?', answer: '72', distractors: ['64', '81'] },
        { promptText: '7 × 6 = ?', spokenText: 'Yedi kere altı kaç eder?', answer: '42', distractors: ['45', '49'] },
        { promptText: '4 × 8 = ?', spokenText: 'Dört kere sekiz kaç eder?', answer: '32', distractors: ['28', '36'] },
        { promptText: '9 × 6 = ?', spokenText: 'Dokuz kere altı kaç eder?', answer: '54', distractors: ['48', '56'] },
        { promptText: '7 × 8 = ?', spokenText: 'Yedi kere sekiz kaç eder?', answer: '56', distractors: ['54', '63'] },
        { promptText: '5 × 9 = ?', spokenText: 'Beş kere dokuz kaç eder?', answer: '45', distractors: ['40', '50'] },
        { promptText: '6 × 8 = ?', spokenText: 'Altı kere sekiz kaç eder?', answer: '48', distractors: ['42', '54'] },
        { promptText: '9 × 9 = ?', spokenText: 'Dokuz kere dokuz kaç eder?', answer: '81', distractors: ['72', '90'] },
        { promptText: '4 × 7 = ?', spokenText: 'Dört kere yedi kaç eder?', answer: '28', distractors: ['24', '32'] },
        { promptText: '8 × 8 = ?', spokenText: 'Sekiz kere sekiz kaç eder?', answer: '64', distractors: ['56', '72'] }
      ]
    },
    clock23: {
      id: 'clock23',
      tabLabel: '🕒 2-3. Sınıf Saatler',
      badge: '🕒 2-3. Sınıf Saatleri Bul & Zıpla',
      isListeningPrompt: false,
      questions: [
        { promptText: 'Saat üç buçuk', spokenText: 'Saat üç buçuk', answer: '03:30', distractors: ['03:15', '03:45'] },
        { promptText: 'Yediyi çeyrek geçiyor', spokenText: 'Yediyi çeyrek geçiyor', answer: '07:15', distractors: ['07:30', '06:45'] },
        { promptText: 'Ona çeyrek var', spokenText: 'Ona çeyrek var', answer: '09:45', distractors: ['10:15', '10:45'] },
        { promptText: 'Saat tam sekiz', spokenText: 'Saat tam sekiz', answer: '08:00', distractors: ['08:30', '08:15'] },
        { promptText: 'Saat on buçuk', spokenText: 'Saat on buçuk', answer: '10:30', distractors: ['10:15', '09:30'] },
        { promptText: 'Dördü çeyrek geçiyor', spokenText: 'Dördü çeyrek geçiyor', answer: '04:15', distractors: ['03:45', '04:30'] },
        { promptText: 'Yediye çeyrek var', spokenText: 'Yediye çeyrek var', answer: '06:45', distractors: ['07:15', '07:45'] },
        { promptText: 'Saat tam on iki', spokenText: 'Saat tam on iki', answer: '12:00', distractors: ['12:30', '11:45'] },
        { promptText: 'Saat iki buçuk', spokenText: 'Saat iki buçuk', answer: '02:30', distractors: ['02:15', '02:45'] },
        { promptText: 'Beşi çeyrek geçiyor', spokenText: 'Beşi çeyrek geçiyor', answer: '05:15', distractors: ['04:45', '05:30'] }
      ]
    },
    fractions34: {
      id: 'fractions34',
      tabLabel: '🍕 3-4. Sınıf Kesirler',
      badge: '🍕 3-4. Sınıf Kesir Patikası',
      isListeningPrompt: false,
      questions: [
        { promptText: 'İkide bir (Yarım)', spokenText: 'İkide bir, yani yarım', answer: '1/2', distractors: ['1/4', '2/3'] },
        { promptText: 'Dörtte üç', spokenText: 'Dörtte üç', answer: '3/4', distractors: ['4/3', '1/4'] },
        { promptText: 'Beşte iki', spokenText: 'Beşte iki', answer: '2/5', distractors: ['5/2', '3/5'] },
        { promptText: 'Sekizde beş', spokenText: 'Sekizde beş', answer: '5/8', distractors: ['3/8', '8/5'] },
        { promptText: 'Dörtte bir (Çeyrek)', spokenText: 'Dörtte bir, yani çeyrek', answer: '1/4', distractors: ['1/2', '3/4'] },
        { promptText: 'Üçte bir', spokenText: 'Üçte bir', answer: '1/3', distractors: ['3/1', '2/3'] },
        { promptText: 'Yedi bölü dört', spokenText: 'Yedi bölü dört', answer: '7/4', distractors: ['4/7', '3/4'] },
        { promptText: 'Altıda dört', spokenText: 'Altıda dört', answer: '4/6', distractors: ['6/4', '2/6'] },
        { promptText: 'Beşte beş (Bir Tam)', spokenText: 'Beşte beş, yani bir tam', answer: '5/5', distractors: ['1/5', '4/5'] },
        { promptText: 'Sekizde üç', spokenText: 'Sekizde üç', answer: '3/8', distractors: ['5/8', '8/3'] }
      ]
    }
  };

  const state = {
    isOpen: false,
    activeTopicId: 'reading1',
    activeLetterGroupId: 'g1',
    bagByTopic: {},
    currentStep: 0, // 0..8
    stars: 0,
    currentQuestion: null,
    options: [],
    isJumping: false,
    isFinished: false,
    speakTimer: null,
    nextTimer: null,
    audioCtx: null
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // CANLI ANALOG SAAT SVG ÇİZİMİ
  function buildAnalogClockSvg(timeStr, sizePx) {
    const parts = String(timeStr || '12:00').split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const h12 = hours % 12;

    const minAngleDeg = minutes * 6;
    const hourAngleDeg = h12 * 30 + minutes * 0.5;
    const minRad = ((minAngleDeg - 90) * Math.PI) / 180;
    const hourRad = ((hourAngleDeg - 90) * Math.PI) / 180;

    const cx = 110;
    const cy = 110;
    const r = 96;

    let ticksAndNums = '';
    for (let i = 1; i <= 12; i++) {
      const ang = ((i * 30 - 90) * Math.PI) / 180;
      const tx1 = cx + Math.cos(ang) * (r - 10);
      const ty1 = cy + Math.sin(ang) * (r - 10);
      const tx2 = cx + Math.cos(ang) * (r - 3);
      const ty2 = cy + Math.sin(ang) * (r - 3);
      const nx = cx + Math.cos(ang) * (r - 24);
      const ny = cy + Math.sin(ang) * (r - 24) + 1;
      ticksAndNums += `
        <line x1="${tx1.toFixed(1)}" y1="${ty1.toFixed(1)}" x2="${tx2.toFixed(1)}" y2="${ty2.toFixed(1)}" stroke="#334155" stroke-width="3.5" stroke-linecap="round"/>
        <text x="${nx.toFixed(1)}" y="${ny.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" fill="#0F172A" font-family="'Fredoka','Nunito',sans-serif" font-size="18" font-weight="800">${i}</text>
      `;
    }

    const hourLen = 48;
    const minLen = 70;
    const hx = cx + Math.cos(hourRad) * hourLen;
    const hy = cy + Math.sin(hourRad) * hourLen;
    const mx = cx + Math.cos(minRad) * minLen;
    const my = cy + Math.sin(minRad) * minLen;

    const sz = sizePx || 170;
    return `
      <div class="moli-visual-clock-wrap" style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <svg width="${sz}" height="${sz}" viewBox="0 0 220 220" role="img" aria-label="Analog Saat" style="filter:drop-shadow(0 8px 18px rgba(15,23,42,0.22));">
          <circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="#F59E0B"/>
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFFFFF" stroke="#1E293B" stroke-width="5"/>
          ${ticksAndNums}
          <line x1="${cx}" y1="${cy}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="#DC2626" stroke-width="6" stroke-linecap="round"/>
          <line x1="${cx}" y1="${cy}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#2563EB" stroke-width="9" stroke-linecap="round"/>
          <circle cx="${cx}" cy="${cy}" r="8" fill="#1E293B" stroke="#FFFFFF" stroke-width="2.5"/>
        </svg>
        <div style="font-size:0.8rem;font-weight:800;color:#475569;">
          🔵 Akrep (Saat) • 🔴 Yelkovan (Dakika)
        </div>
      </div>
    `;
  }

  // RENKLİ ŞEKİLLİ KESİRLER SVG ÇİZİMİ
  function buildSinglePieSvg(denom, filledSlices, fillCol, sizePx) {
    const cx = 80;
    const cy = 80;
    const r = 68;
    let paths = '';

    if (denom <= 1) {
      paths = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${filledSlices > 0 ? fillCol : '#F1F5F9'}" stroke="#1E293B" stroke-width="3.5"/>`;
    } else {
      for (let i = 0; i < denom; i++) {
        const startAng = ((i * 360) / denom - 90) * (Math.PI / 180);
        const endAng = (((i + 1) * 360) / denom - 90) * (Math.PI / 180);
        const x1 = cx + r * Math.cos(startAng);
        const y1 = cy + r * Math.sin(startAng);
        const x2 = cx + r * Math.cos(endAng);
        const y2 = cy + r * Math.sin(endAng);
        const largeArc = 360 / denom > 180 ? 1 : 0;
        const isFilled = i < filledSlices;
        const d = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
        paths += `<path d="${d}" fill="${isFilled ? fillCol : '#F1F5F9'}" stroke="#1E293B" stroke-width="3" stroke-linejoin="round"/>`;
      }
    }

    return `
      <svg width="${sizePx}" height="${sizePx}" viewBox="0 0 160 160" role="img" aria-label="Kesir Pastası" style="filter:drop-shadow(0 8px 16px rgba(15,23,42,0.18));">
        ${paths}
      </svg>
    `;
  }

  function buildFractionModelSvg(fractionStr, pieSizePx) {
    const parts = String(fractionStr || '1/2').split('/');
    const num = Math.max(1, parseInt(parts[0], 10) || 1);
    const den = Math.max(1, parseInt(parts[1], 10) || 2);
    const wholeCount = Math.max(1, Math.ceil(num / den));

    const palette = ['#F97316', '#10B981', '#8B5CF6'];
    const fillCol = palette[(num + den) % palette.length];
    const singleSize = wholeCount > 1 ? Math.round((pieSizePx || 140) * 0.76) : (pieSizePx || 140);

    let piesHtml = '';
    let rem = num;
    for (let w = 0; w < wholeCount; w++) {
      const take = Math.min(den, rem);
      rem = Math.max(0, rem - take);
      piesHtml += buildSinglePieSvg(den, take, fillCol, singleSize);
    }

    const totalCells = wholeCount * den;
    const barW = 205;
    const barH = 22;
    const cellW = barW / totalCells;
    let barRects = '';
    for (let i = 0; i < totalCells; i++) {
      const isFilled = i < num;
      barRects += `<rect x="${(i * cellW).toFixed(1)}" y="0" width="${cellW.toFixed(1)}" height="${barH}" fill="${isFilled ? fillCol : '#F1F5F9'}" stroke="#1E293B" stroke-width="2"/>`;
    }

    return `
      <div class="moli-visual-fraction-wrap" style="display:flex;flex-direction:column;align-items:center;gap:6px;">
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;">
          ${piesHtml}
        </div>
        <svg width="${barW}" height="${barH}" viewBox="0 0 ${barW} ${barH}" aria-hidden="true" style="border-radius:6px;overflow:hidden;">
          ${barRects}
        </svg>
      </div>
    `;
  }

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function getAudioContext() {
    if (window.isMuted === true) return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      if (!state.audioCtx || state.audioCtx.state === 'closed') {
        state.audioCtx = new AudioCtx();
      }
      if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
      }
      return state.audioCtx;
    } catch (e) {
      return null;
    }
  }

  function playJumpBoingSound(isGrandFinish) {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = isGrandFinish
        ? [523.25, 659.25, 783.99, 1046.5]
        : [392.0, 523.25, 659.25];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.065);
        gain.gain.setValueAtTime(0.001, now + idx * 0.065);
        gain.gain.exponentialRampToValueAtTime(0.15, now + idx * 0.065 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.065);
        osc.stop(now + idx * 0.065 + 0.32);
      });
    } catch (e) {}
  }

  function playWrongWobbleSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(210, now);
      osc.frequency.exponentialRampToValueAtTime(125, now + 0.24);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.27);
    } catch (e) {}
  }

  function launchPathConfetti(isBig) {
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

    const colors = ['#10B981', '#F59E0B', '#EC4899', '#0EA5E9', '#8B5CF6', '#FACC15'];
    const count = isBig ? 110 : 45;
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.45;
    const particles = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 10;
      return {
        x: cx + (Math.random() - 0.5) * 140,
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
        p.vy += 0.28;
        p.vx *= 0.985;
        p.rot += p.vRot;
        p.life -= isBig ? 0.012 : 0.022;
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
      if (alive && frame < 110) {
        requestAnimationFrame(tick);
      } else {
        canvas.remove();
      }
    }
    requestAnimationFrame(tick);
  }

  function stopVoice() {
    if (state.speakTimer) {
      clearTimeout(state.speakTimer);
      state.speakTimer = null;
    }
    try {
      if (window.MoliVoiceEngine && typeof window.MoliVoiceEngine.stop === 'function') {
        window.MoliVoiceEngine.stop();
      }
    } catch (e) {}
    try {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } catch (e) {}
  }

  function speakText(text) {
    if (!text || !state.isOpen) return;
    stopVoice();
    if (window.MoliVoiceEngine && typeof window.MoliVoiceEngine.speak === 'function') {
      try {
        window.MoliVoiceEngine.speak(text);
        return;
      } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      try {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'tr-TR';
        utter.rate = 0.95;
        window.speechSynthesis.speak(utter);
      } catch (e) {}
    }
  }

  function getActiveTopicQuestions(topicId) {
    const topic = PATH_TOPICS[topicId] || PATH_TOPICS.reading1;
    if (topicId === 'reading1') {
      const grp = state.activeLetterGroupId || 'g1';
      if (grp !== 'all' && READING1_GROUP_QUESTIONS[grp]) {
        return READING1_GROUP_QUESTIONS[grp];
      }
      return topic.questions;
    }
    return topic.questions;
  }

  function drawNextQuestionFromBag(topicId) {
    const pool = getActiveTopicQuestions(topicId);
    const bagKey = topicId === 'reading1' ? `reading1_${state.activeLetterGroupId}` : topicId;
    let bag = state.bagByTopic[bagKey];
    if (!bag || bag.length === 0) {
      bag = shuffleArray(pool.map((_, idx) => idx));
      state.bagByTopic[bagKey] = bag;
    }
    const qIdx = bag.pop();
    return pool[qIdx];
  }

  function syncLetterGroupsBarUI() {
    const bar = document.getElementById('moliPathLetterGroupsBar');
    if (bar) {
      bar.style.display = state.activeTopicId === 'reading1' ? 'flex' : 'none';
    }
    document.querySelectorAll(`#${MODAL_ID} .mpg-letter-group-btn`).forEach((btn) => {
      const active = btn.getAttribute('data-group-id') === state.activeLetterGroupId;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function switchLetterGroup(groupId) {
    if (!READING1_LETTER_GROUPS.some((g) => g.id === groupId)) return;
    state.activeLetterGroupId = groupId;
    state.bagByTopic[`reading1_${groupId}`] = [];
    syncLetterGroupsBarUI();
    startNewPathGame('reading1');
  }

  function startNewPathGame(topicId) {
    if (topicId && PATH_TOPICS[topicId]) {
      state.activeTopicId = topicId;
    }
    stopVoice();
    if (state.nextTimer) clearTimeout(state.nextTimer);

    state.currentStep = 0;
    state.stars = 0;
    state.isJumping = false;
    state.isFinished = false;

    document.querySelectorAll(`#${MODAL_ID} .mpg-topic-tab`).forEach((btn) => {
      const active = btn.getAttribute('data-topic-id') === state.activeTopicId;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    syncLetterGroupsBarUI();
    loadNextStepQuestion();
  }

  function loadNextStepQuestion() {
    state.isJumping = false;
    const q = drawNextQuestionFromBag(state.activeTopicId);
    state.currentQuestion = q;
    state.options = shuffleArray([q.answer, q.distractors[0], q.distractors[1]]);

    renderPathStage();

    state.speakTimer = setTimeout(() => {
      if (state.isOpen && !state.isFinished && state.currentQuestion) {
        speakText(state.currentQuestion.spokenText);
      }
    }, 180);
  }

  function renderPathStage() {
    const stonesWrap = document.getElementById('moliPathStonesRow');
    const questionArea = document.getElementById('moliPathQuestionArea');
    const victoryOverlay = document.getElementById('moliPathVictoryOverlay');

    if (stonesWrap) {
      const stonesHtml = [];
      for (let i = 0; i <= TOTAL_STEPS; i++) {
        const isCurrent = i === state.currentStep;
        const isPassed = i < state.currentStep;
        const isGoal = i === TOTAL_STEPS;
        stonesHtml.push(`
          <div class="mpg-stone ${isCurrent ? 'is-current' : ''} ${isPassed ? 'is-passed' : ''} ${isGoal ? 'is-goal' : ''}">
            ${isCurrent
              ? `
                <div class="mpg-moli-jumper" id="moliPathJumperAvatar">
                  <img src="assets/mascot/moli.webp" class="mpg-moli-img" alt="Zıplayan Moli" width="110" height="110">
                </div>
              `
              : ''
            }
            <div class="mpg-stone-pad">
              ${isGoal ? '🏰🏆' : (isPassed ? '⭐' : i + 1)}
            </div>
          </div>
        `);
      }
      stonesWrap.innerHTML = stonesHtml.join('');
    }

    if (victoryOverlay) {
      if (state.isFinished) {
        victoryOverlay.className = 'mpg-victory-overlay is-open';
        victoryOverlay.innerHTML = `
          <div class="mpg-victory-card">
            <div class="mpg-victory-icon" aria-hidden="true">🏰🏆🐸</div>
            <h3 class="mpg-victory-title">🏆 Harika! Moli Hazine Kalesine Ulaştı!</h3>
            <p class="mpg-victory-sub">Tüm taşları doğru zıplayarak <strong>${TOTAL_STEPS} / ${TOTAL_STEPS}</strong> adımı tamamladın!</p>
            <div class="mpg-victory-actions">
              <button class="mpg-btn-replay" id="moliPathReplayBtn" type="button">🔄 Tekrar Zıpla</button>
              <button class="mpg-btn-close" id="moliPathWinCloseBtn" type="button">✕ Kapat</button>
            </div>
          </div>
        `;
        document.getElementById('moliPathReplayBtn').addEventListener('click', () => startNewPathGame());
        document.getElementById('moliPathWinCloseBtn').addEventListener('click', closePathGame);
      } else {
        victoryOverlay.className = 'mpg-victory-overlay';
        victoryOverlay.innerHTML = '';
      }
    }

    if (!questionArea || !state.currentQuestion) return;
    const topic = PATH_TOPICS[state.activeTopicId] || PATH_TOPICS.reading1;
    const q = state.currentQuestion;

    const cardsHtml = state.options.map((opt) => `
      <button class="mpg-answer-card" type="button" data-option="${escapeHtml(opt)}">
        <span class="mpg-card-leaf">🍀</span>
        <span class="mpg-card-value">${escapeHtml(opt)}</span>
      </button>
    `).join('');

    questionArea.innerHTML = `
      <div class="mpg-question-box">
        <div class="mpg-q-top">
          <span class="mpg-topic-badge">${escapeHtml(topic.badge)}</span>
          <span class="mpg-step-badge">🐾 Adım: <strong>${state.currentStep} / ${TOTAL_STEPS}</strong></span>
        </div>
        ${state.activeTopicId === 'clock23'
          ? `
            ${buildAnalogClockSvg(q.answer, 170)}
            <div class="mpg-question-prompt" style="font-size:clamp(1.35rem,2.3vw,1.9rem);">${escapeHtml(q.promptText)}</div>
          `
          : (state.activeTopicId === 'fractions34'
            ? `
              ${buildFractionModelSvg(q.answer, 140)}
              <div class="mpg-question-prompt" style="font-size:clamp(1.35rem,2.3vw,1.9rem);">${escapeHtml(q.promptText)}</div>
            `
            : `<div class="mpg-question-prompt">${escapeHtml(q.promptText)}</div>`
          )
        }
        <button class="mpg-listen-btn" id="moliPathListenBtn" type="button">
          <span aria-hidden="true">🔊</span>
          <span>Soruyu Dinle</span>
        </button>
      </div>

      <div class="mpg-answers-grid">
        ${cardsHtml}
      </div>
    `;

    const listenBtn = document.getElementById('moliPathListenBtn');
    if (listenBtn) {
      listenBtn.addEventListener('click', () => {
        if (state.currentQuestion) speakText(state.currentQuestion.spokenText);
      });
    }

    questionArea.querySelectorAll('.mpg-answer-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const picked = btn.getAttribute('data-option');
        handleOptionPick(picked, btn);
      });
    });
  }

  function handleOptionPick(picked, btnEl) {
    if (!state.isOpen || state.isJumping || state.isFinished || !state.currentQuestion) return;

    const isCorrect = picked === state.currentQuestion.answer;
    if (isCorrect) {
      state.isJumping = true;
      if (btnEl) btnEl.classList.add('is-correct');

      const jumper = document.getElementById('moliPathJumperAvatar');
      if (jumper) jumper.classList.add('is-leaping');

      state.currentStep += 1;
      state.stars += 1;
      const reachedGoal = state.currentStep >= TOTAL_STEPS;

      playJumpBoingSound(reachedGoal);
      launchPathConfetti(reachedGoal);

      state.nextTimer = setTimeout(() => {
        if (!state.isOpen) return;
        if (reachedGoal) {
          state.isFinished = true;
          renderPathStage();
          speakText('Tebrikler! Moli tüm taşlardan zıplayarak hazine kalesine ulaştı!');
        } else {
          loadNextStepQuestion();
        }
      }, 650);
    } else {
      playWrongWobbleSound();
      if (btnEl) {
        btnEl.classList.add('is-wrong');
        btnEl.disabled = true;
      }
    }
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
        background: linear-gradient(145deg, #065F46 0%, #0284C7 52%, #1E1B4B 100%);
        color: #0F172A;
        font-family: 'Nunito', 'Fredoka', sans-serif;
        border-radius: 28px;
        border: 4px solid rgba(110, 231, 183, 0.38);
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

      /* İnce Üst Başlık Barı */
      #${MODAL_ID} .mpg-topbar {
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
      #${MODAL_ID} .mpg-brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      #${MODAL_ID} .mpg-brand-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, #22C55E 0%, #059669 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.45rem;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
      }
      #${MODAL_ID} .mpg-brand-title {
        margin: 0;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.08rem, 1.8vw, 1.38rem);
        font-weight: 700;
        color: #064E3B;
      }
      #${MODAL_ID} .mpg-brand-sub {
        margin: 0;
        font-size: 0.8rem;
        font-weight: 800;
        color: #64748B;
      }
      #${MODAL_ID} .mpg-close-btn {
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
      }

      /* İnce ve Tek Satır Konu Barı */
      #${MODAL_ID} .mpg-topics-bar {
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
      #${MODAL_ID} .mpg-topic-tab {
        padding: 7px 14px;
        border-radius: 12px;
        border: 2px solid rgba(255, 255, 255, 0.24);
        border-bottom: 3px solid rgba(15, 23, 42, 0.4);
        background: rgba(255, 255, 255, 0.94);
        color: #1E293B;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(0.84rem, 1.15vw, 0.98rem);
        font-weight: 700;
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.14s ease;
      }
      #${MODAL_ID} .mpg-topic-tab.is-active {
        background: linear-gradient(135deg, #22C55E 0%, #059669 100%);
        border-color: #86EFAC;
        border-bottom-color: #065F46;
        color: #FFFFFF;
        box-shadow: 0 5px 15px rgba(34, 197, 94, 0.45);
      }

      /* 1. Sınıf MEB Harf Grubu Seçici Alt Barı */
      #${MODAL_ID} .mpg-letter-groups-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap;
        overflow-x: auto;
        gap: 6px;
        padding: 5px 14px;
        background: rgba(15, 23, 42, 0.72);
        border-bottom: 1px solid rgba(134, 239, 172, 0.28);
        flex-shrink: 0;
      }
      #${MODAL_ID} .mpg-letter-group-label {
        font-size: 0.78rem;
        font-weight: 800;
        color: #86EFAC;
        white-space: nowrap;
        margin-right: 4px;
      }
      #${MODAL_ID} .mpg-letter-group-btn {
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
      #${MODAL_ID} .mpg-letter-group-btn:hover {
        background: rgba(255, 255, 255, 0.24);
      }
      #${MODAL_ID} .mpg-letter-group-btn.is-active {
        background: linear-gradient(135deg, #38BDF8 0%, #0284C7 100%);
        border-color: #BAE6FD;
        color: #FFFFFF;
        box-shadow: 0 3px 10px rgba(14, 165, 233, 0.45);
      }

      /* Ana Sahne */
      #${MODAL_ID} .mpg-stage {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 18px;
        max-width: 1340px;
        width: 100%;
        margin: 0 auto;
        padding: 16px 24px 22px;
      }

      /* Üst Patika: %30 Büyütülmüş Zıplayan Moli ve Dere Taşları */
      #${MODAL_ID} .mpg-path-track {
        background: linear-gradient(180deg, rgba(14, 165, 233, 0.38) 0%, rgba(16, 185, 129, 0.35) 100%);
        border: 4px solid rgba(255, 255, 255, 0.35);
        border-radius: 30px;
        padding: 68px 20px 22px;
        box-shadow: inset 0 4px 20px rgba(15, 23, 42, 0.3), 0 18px 42px rgba(0, 0, 0, 0.35);
      }
      #${MODAL_ID} .mpg-stones-row {
        display: grid;
        grid-template-columns: repeat(9, 1fr);
        align-items: center;
        gap: 12px;
      }
      #${MODAL_ID} .mpg-stone {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      #${MODAL_ID} .mpg-moli-jumper {
        position: absolute;
        bottom: 64px;
        z-index: 8;
        filter: drop-shadow(0 12px 18px rgba(0, 0, 0, 0.45));
        animation: mpgIdleBounce 1.4s ease-in-out infinite;
      }
      #${MODAL_ID} .mpg-moli-jumper.is-leaping {
        animation: mpgLeapForward 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      #${MODAL_ID} .mpg-moli-img {
        width: 112px;
        height: 112px;
        object-fit: contain;
      }
      @keyframes mpgIdleBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      @keyframes mpgLeapForward {
        0% { transform: translate(0, 0) scale(1); }
        45% { transform: translate(45px, -55px) scale(1.18) rotate(8deg); }
        100% { transform: translate(90px, 0) scale(1); }
      }
      #${MODAL_ID} .mpg-stone-pad {
        width: 100%;
        max-width: 112px;
        height: 62px;
        border-radius: 999px;
        background: linear-gradient(180deg, #E2E8F0 0%, #94A3B8 100%);
        border: 4px solid #FFFFFF;
        border-bottom: 8px solid #475569;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.45rem;
        font-weight: 700;
        color: #1E293B;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.35);
      }
      #${MODAL_ID} .mpg-stone.is-passed .mpg-stone-pad {
        background: linear-gradient(180deg, #DCFCE7 0%, #4ADE80 100%);
        border-color: #FFFFFF;
        border-bottom-color: #15803D;
        color: #14532D;
      }
      #${MODAL_ID} .mpg-stone.is-current .mpg-stone-pad {
        background: linear-gradient(180deg, #FEF08A 0%, #F59E0B 100%);
        border-color: #FFFFFF;
        border-bottom-color: #B45309;
        color: #78350F;
        transform: scale(1.08);
        box-shadow: 0 0 0 5px rgba(250, 204, 21, 0.45), 0 14px 28px rgba(0, 0, 0, 0.45);
      }
      #${MODAL_ID} .mpg-stone.is-goal .mpg-stone-pad {
        background: linear-gradient(180deg, #FDE047 0%, #EA580C 100%);
        border-bottom-color: #9A3412;
        font-size: 1.65rem;
      }

      /* Alt Bölüm: %30 Büyütülmüş Soru Kutusu ve 3 Büyük Cevap Kartı */
      #${MODAL_ID} .mpg-question-area {
        flex: 1;
        display: grid;
        grid-template-columns: minmax(340px, 470px) 1fr;
        align-items: stretch;
        gap: 24px;
      }
      #${MODAL_ID} .mpg-question-box {
        background: linear-gradient(180deg, #FFFFFF 0%, #F0FDF4 100%);
        border: 5px solid #4ADE80;
        border-bottom: 10px solid #16A34A;
        border-radius: 30px;
        padding: 26px 24px;
        box-shadow: 0 24px 54px rgba(0, 0, 0, 0.44);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        text-align: center;
        gap: 16px;
      }
      #${MODAL_ID} .mpg-q-top {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
      }
      #${MODAL_ID} .mpg-topic-badge {
        padding: 7px 14px;
        border-radius: 999px;
        background: #DCFCE7;
        color: #166534;
        font-size: 0.92rem;
        font-weight: 800;
      }
      #${MODAL_ID} .mpg-step-badge {
        padding: 7px 14px;
        border-radius: 999px;
        background: #FEF3C7;
        color: #92400E;
        font-size: 0.95rem;
        font-weight: 800;
      }
      #${MODAL_ID} .mpg-question-prompt {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(2rem, 3.8vw, 3.25rem);
        font-weight: 700;
        color: #0F172A;
        line-height: 1.2;
      }
      #${MODAL_ID} .mpg-listen-btn {
        width: 100%;
        padding: 16px 22px;
        border-radius: 18px;
        border: 2.5px solid #0284C7;
        border-bottom: 6px solid #0369A1;
        background: linear-gradient(180deg, #0EA5E9 0%, #0284C7 100%);
        color: #FFFFFF;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.28rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        box-shadow: 0 10px 24px rgba(2, 132, 199, 0.35);
      }

      #${MODAL_ID} .mpg-answers-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        align-items: stretch;
      }
      #${MODAL_ID} .mpg-answer-card {
        border-radius: 28px;
        border: 5px solid #FACC15;
        border-bottom: 10px solid #CA8A04;
        background: linear-gradient(180deg, #FFFFFF 0%, #FEF9C3 100%);
        color: #713F12;
        padding: 24px 16px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(2.1rem, 3.8vw, 3.4rem);
        font-weight: 700;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        box-shadow: 0 20px 44px rgba(0, 0, 0, 0.38);
        transition: transform 0.14s ease, box-shadow 0.14s ease;
      }
      #${MODAL_ID} .mpg-answer-card:hover:not(:disabled) {
        transform: translateY(-4px) scale(1.02);
      }
      #${MODAL_ID} .mpg-card-leaf {
        font-size: 2.2rem;
      }
      #${MODAL_ID} .mpg-answer-card.is-correct {
        background: linear-gradient(180deg, #DCFCE7 0%, #4ADE80 100%) !important;
        border-color: #22C55E !important;
        border-bottom-color: #15803D !important;
        color: #14532D !important;
        transform: scale(1.05);
      }
      #${MODAL_ID} .mpg-answer-card.is-wrong {
        background: linear-gradient(180deg, #FEE2E2 0%, #FCA5A5 100%) !important;
        border-color: #EF4444 !important;
        border-bottom-color: #B91C1C !important;
        color: #7F1D1D !important;
        opacity: 0.75;
      }

      /* Zafer Overlay */
      #${MODAL_ID} .mpg-victory-overlay {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 100002;
        background: rgba(15, 23, 42, 0.78);
        backdrop-filter: blur(8px);
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      #${MODAL_ID} .mpg-victory-overlay.is-open {
        display: flex;
      }
      #${MODAL_ID} .mpg-victory-card {
        width: 100%;
        max-width: 520px;
        background: #FFFFFF;
        border: 5px solid #22C55E;
        border-bottom: 10px solid #15803D;
        border-radius: 30px;
        padding: 30px 24px;
        text-align: center;
        box-shadow: 0 28px 65px rgba(0, 0, 0, 0.5);
      }
      #${MODAL_ID} .mpg-victory-icon {
        font-size: 4.2rem;
        margin-bottom: 10px;
      }
      #${MODAL_ID} .mpg-victory-title {
        margin: 0 0 10px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.9rem;
        color: #14532D;
      }
      #${MODAL_ID} .mpg-victory-sub {
        margin: 0 0 22px;
        font-size: 1.08rem;
        font-weight: 800;
        color: #475569;
      }
      #${MODAL_ID} .mpg-victory-actions {
        display: grid;
        grid-template-columns: 1.4fr 1fr;
        gap: 12px;
      }
      #${MODAL_ID} .mpg-btn-replay {
        padding: 14px 18px;
        border-radius: 16px;
        border: 2px solid #10B981;
        border-bottom: 5px solid #047857;
        background: linear-gradient(180deg, #10B981 0%, #059669 100%);
        color: #FFFFFF;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.12rem;
        font-weight: 700;
        cursor: pointer;
      }
      #${MODAL_ID} .mpg-btn-close {
        padding: 14px 18px;
        border-radius: 16px;
        border: 2px solid #CBD5E1;
        border-bottom: 5px solid #94A3B8;
        background: #F8FAFC;
        color: #334155;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.05rem;
        font-weight: 700;
        cursor: pointer;
      }

      @media (max-width: 900px) {
        #${MODAL_ID} .mpg-question-area {
          grid-template-columns: 1fr;
        }
        #${MODAL_ID} .mpg-answers-grid {
          grid-template-columns: 1fr;
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
    modal.setAttribute('aria-label', 'Neşeli Patika: Zıpla ve İlerle');

    const tabsHtml = Object.values(PATH_TOPICS).map((t) => `
      <button class="mpg-topic-tab ${t.id === state.activeTopicId ? 'is-active' : ''}"
              type="button"
              role="tab"
              data-topic-id="${t.id}"
              aria-selected="${t.id === state.activeTopicId ? 'true' : 'false'}">
        ${escapeHtml(t.tabLabel)}
      </button>
    `).join('');

    const letterGroupsHtml = READING1_LETTER_GROUPS.map((g) => `
      <button class="mpg-letter-group-btn ${g.id === state.activeLetterGroupId ? 'is-active' : ''}"
              type="button"
              data-group-id="${g.id}"
              aria-pressed="${g.id === state.activeLetterGroupId ? 'true' : 'false'}">
        ${escapeHtml(g.label)}
      </button>
    `).join('');

    modal.innerHTML = `
      <header class="mpg-topbar">
        <div class="mpg-brand">
          <div class="mpg-brand-icon" aria-hidden="true">🐸</div>
          <div>
            <h2 class="mpg-brand-title">🐸 Neşeli Patika: Zıpla &amp; Tamamla</h2>
            <p class="mpg-brand-sub">Eksik Hece veya Cevap Taşına Dokun, Moli Zıplayarak Hazine Kalesine Ulaşsın!</p>
          </div>
        </div>
        <button class="mpg-close-btn" id="moliPathCloseBtn" type="button" aria-label="Neşeli Patika Oyununu Kapat">✕ Kapat</button>
      </header>

      <nav class="mpg-topics-bar" role="tablist" aria-label="Sınıf ve Konu Seçimi">
        ${tabsHtml}
      </nav>

      <div class="mpg-letter-groups-bar" id="moliPathLetterGroupsBar" role="toolbar" aria-label="1. Sınıf MEB Harf Grubu Seçimi">
        <span class="mpg-letter-group-label">🔤 Harf Grubu:</span>
        ${letterGroupsHtml}
      </div>

      <main class="mpg-stage">
        <section class="mpg-path-track" aria-label="Moli Zıplama Patikası">
          <div class="mpg-stones-row" id="moliPathStonesRow"></div>
        </section>

        <section class="mpg-question-area" id="moliPathQuestionArea" aria-live="polite"></section>
      </main>

      <div class="mpg-victory-overlay" id="moliPathVictoryOverlay" aria-live="polite"></div>
    `;

    document.body.appendChild(modal);

    document.getElementById('moliPathCloseBtn').addEventListener('click', closePathGame);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closePathGame();
      }
    });

    modal.querySelectorAll('.mpg-topic-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const topicId = btn.getAttribute('data-topic-id');
        startNewPathGame(topicId);
      });
    });

    modal.querySelectorAll('.mpg-letter-group-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const groupId = btn.getAttribute('data-group-id');
        switchLetterGroup(groupId);
      });
    });
  }

  function openPathGame(initialTopicId) {
    buildModal();
    state.isOpen = true;
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.add('is-open');
    startNewPathGame(initialTopicId || state.activeTopicId);
  }

  function closePathGame() {
    state.isOpen = false;
    stopVoice();
    if (state.nextTimer) {
      clearTimeout(state.nextTimer);
      state.nextTimer = null;
    }
    const confetti = document.getElementById(CONFETTI_CANVAS_ID);
    if (confetti) confetti.remove();
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.remove('is-open');
  }

  window.openMoliPathGame = openPathGame;
  window.closeMoliPathGame = closePathGame;

  function injectAndBindShowcaseCard() {
    const arcadeGrid = document.querySelector('#arcadeHubSection .arcade-games-grid');
    if (arcadeGrid && !document.getElementById('arcadeCardPathGame')) {
      const card = document.createElement('div');
      card.className = 'arcade-game-card theme-tug';
      card.id = 'arcadeCardPathGame';
      card.setAttribute('data-open-moli-path', '1');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.innerHTML = `
        <div class="arcade-card-hero-banner banner-tug" aria-hidden="true">
          <div class="banner-scene scene-wheel">
            <div class="mini-wheel-wrap">
              <span class="mini-wheel-icon">🐸</span>
              <span class="mini-gift-icon">🏰</span>
            </div>
            <span class="badge-blinking-new">✨ ZIPLA</span>
          </div>
        </div>
        <div class="arcade-card-top">
          <span class="arcade-card-tag">🐸 Patika &amp; Macera</span>
          <span class="arcade-card-chip chip-green">⭐ 8 Adımda Kale</span>
        </div>
        <h3 class="arcade-card-title">🐸 Neşeli Patika: Zıpla &amp; İlerle</h3>
        <p class="arcade-card-desc">Soruyu dinle, doğru cevabın olduğu dere taşına dokun ve Moli'yi zıplatarak hazine kalesine ulaştır!</p>
        <div class="arcade-card-badges">
          <span>🐸 Zıplayan Moli</span>
          <span>🔊 Sesli Soru &amp; 5 Konu</span>
        </div>
        <button class="arcade-card-play-btn" type="button">Patikaya Gir ›</button>
      `;
      const turboCard = document.getElementById('arcadeCardTurboRacer');
      if (turboCard && turboCard.nextSibling) {
        arcadeGrid.insertBefore(card, turboCard.nextSibling);
      } else {
        arcadeGrid.insertBefore(card, arcadeGrid.firstChild);
      }
    }

    document.querySelectorAll('[data-open-moli-path], #arcadeCardPathGame').forEach((el) => {
      if (el.dataset.moliPathBound) return;
      el.dataset.moliPathBound = '1';
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const topic = el.getAttribute('data-path-topic') || undefined;
        openPathGame(topic);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          const topic = el.getAttribute('data-path-topic') || undefined;
          openPathGame(topic);
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
