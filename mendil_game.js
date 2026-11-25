/**
 * ==========================================================================
 * DERSE Bİ' MOLA - BAĞIMSIZ MENDİL KAPMACA: CANLI YARIŞ (mendil_game.js)
 * 2. Adım: 5 Sınıf/Konu Sekmesi, Akıllı Tahta (2 Kişilik 3 Sütunlu Yarış) ve
 * Mobil (Tek Kişilik Hız Modu), Yeşil Mendil Çekme Animasyonu,
 * 1.5 sn Yanlış Ceza Kilidi, Web Audio API Ses Efektleri & MoliVoiceEngine.
 * app.js ve mevcut oyun motorlarından tamamen bağımsız çalışır.
 * ==========================================================================
 */
(function () {
  'use strict';

  const MODAL_ID = 'moli-mendil-modal';
  const STYLE_ID = 'moli-mendil-game-styles';
  const CONFETTI_CANVAS_ID = 'moli-mendil-confetti-canvas';
  const TARGET_SCORE = 5;
  const PENALTY_LOCK_MS = 1500;

  // 1. SINIF MEB MAARİF MODELİ HARF GRUPLARI (ANETİL, OKURIM, ÜSÖYDZ, ÇBGCŞ, PHVĞFJ)
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
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Anne! An, ne.', answer: 'ANNE', distractors: ['NANE', 'ALAN'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'El! Tek heceli kelime: El.', answer: 'EL', distractors: ['AL', 'ET'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Al! Tek heceli kelime: Al.', answer: 'AL', distractors: ['AT', 'EL'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'At! Tek heceli kelime: At.', answer: 'AT', distractors: ['AL', 'İT'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Nil! Tek heceli özel isim: Nil.', answer: 'NİL', distractors: ['TEN', 'LALE'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Talat! Ta, lat.', answer: 'TALAT', distractors: ['ALAN', 'LALE'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Nane! Na, ne.', answer: 'NANE', distractors: ['ANNE', 'LALE'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Et! Tek heceli kelime: Et.', answer: 'ET', distractors: ['İT', 'EL'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'İt! Tek heceli kelime: İt.', answer: 'İT', distractors: ['ET', 'AT'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'İnek! İ, nek.', answer: 'İNEK', distractors: ['NANE', 'TEN'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Alan! A, lan.', answer: 'ALAN', distractors: ['TALAT', 'ANNE'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Ten! Tek heceli kelime: Ten.', answer: 'TEN', distractors: ['NİL', 'ET'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Lale! La, le.', answer: 'LALE', distractors: ['NANE', 'ANNE'] }
    ],
    g2: [
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Okul! O, kul.', answer: 'OKUL', distractors: ['KULE', 'KOL'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Kule! Ku, le.', answer: 'KULE', distractors: ['OKUL', 'KUTU'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Koku! Ko, ku.', answer: 'KOKU', distractors: ['KUTU', 'KOL'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Kukla! Kuk, la.', answer: 'KUKLA', distractors: ['KULAK', 'KULE'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Kulak! Ku, lak.', answer: 'KULAK', distractors: ['KUKLA', 'KUTU'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Kutu! Ku, tu.', answer: 'KUTU', distractors: ['KOKU', 'KULE'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Kol! Tek heceli kelime: Kol.', answer: 'KOL', distractors: ['KAR', 'KUM'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Kar! Tek heceli kelime: Kar.', answer: 'KAR', distractors: ['KOL', 'KUM'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Kum! Tek heceli kelime: Kum.', answer: 'KUM', distractors: ['KOL', 'KAR'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Orman! Or, man.', answer: 'ORMAN', distractors: ['OKUL', 'MASA'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Elma! El, ma.', answer: 'ELMA', distractors: ['MASA', 'ARI'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Arı! A, rı.', answer: 'ARI', distractors: ['KAR', 'ELMA'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Masa! Ma, sa.', answer: 'MASA', distractors: ['ELMA', 'KASA'] }
    ],
    g3: [
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Süt! Tek heceli kelime: Süt.', answer: 'SÜT', distractors: ['SES', 'SÖZ'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Üzüm! Ü, züm.', answer: 'ÜZÜM', distractors: ['ÖRDEK', 'DÜZ'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Ördek! Ör, dek.', answer: 'ÖRDEK', distractors: ['ÜZÜM', 'KEDİ'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Yıldız! Yıl, dız.', answer: 'YILDIZ', distractors: ['DENİZ', 'YAZ'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Deniz! De, niz.', answer: 'DENİZ', distractors: ['YILDIZ', 'KEDİ'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Ses! Tek heceli kelime: Ses.', answer: 'SES', distractors: ['SÖZ', 'SÜT'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Yaz! Tek heceli kelime: Yaz.', answer: 'YAZ', distractors: ['DÜZ', 'SÖZ'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Söz! Tek heceli kelime: Söz.', answer: 'SÖZ', distractors: ['SES', 'DÜZ'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Düz! Tek heceli kelime: Düz.', answer: 'DÜZ', distractors: ['SÖZ', 'YAZ'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Kedi! Ke, di.', answer: 'KEDİ', distractors: ['DENİZ', 'MASA'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Masa! Ma, sa.', answer: 'MASA', distractors: ['KEDİ', 'YAZ'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Su! Tek heceli kelime: Su.', answer: 'SU', distractors: ['SÜT', 'SES'] }
    ],
    g4: [
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Çiçek! Çi, çek.', answer: 'ÇİÇEK', distractors: ['ÇANTA', 'ŞEKER'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Balık! Ba, lık.', answer: 'BALIK', distractors: ['BULUT', 'ÇİÇEK'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Güneş! Gü, neş.', answer: 'GÜNEŞ', distractors: ['ŞEKER', 'GÖL'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Cam! Tek heceli kelime: Cam.', answer: 'CAM', distractors: ['GÖL', 'KUŞ'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Şeker! Şe, ker.', answer: 'ŞEKER', distractors: ['ŞAPKA', 'GÜNEŞ'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Çanta! Çan, ta.', answer: 'ÇANTA', distractors: ['ŞAPKA', 'ÇİÇEK'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Bulut! Bu, lut.', answer: 'BULUT', distractors: ['BALIK', 'CEVİZ'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Göl! Tek heceli kelime: Göl.', answer: 'GÖL', distractors: ['KUŞ', 'CAM'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Ceviz! Ce, viz.', answer: 'CEVİZ', distractors: ['ÇİÇEK', 'BULUT'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Şapka! Şap, ka.', answer: 'ŞAPKA', distractors: ['ÇANTA', 'ŞEKER'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Kuş! Tek heceli kelime: Kuş.', answer: 'KUŞ', distractors: ['GÖL', 'CAM'] }
    ],
    g5: [
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Para! Pa, ra.', answer: 'PARA', distractors: ['HALI', 'VAZO'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Havuç! Ha, vuç.', answer: 'HAVUÇ', distractors: ['HALI', 'AĞAÇ'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Vazo! Va, zo.', answer: 'VAZO', distractors: ['PARA', 'HALI'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Dağ! Tek heceli kelime: Dağ.', answer: 'DAĞ', distractors: ['TOP', 'FİL'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Fil! Tek heceli kelime: Fil.', answer: 'FİL', distractors: ['JET', 'TOP'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Jet! Tek heceli kelime: Jet.', answer: 'JET', distractors: ['FİL', 'TOP'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Pencere! Pen, ce, re.', answer: 'PENCERE', distractors: ['FENER', 'PARA'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Halı! Ha, lı.', answer: 'HALI', distractors: ['HAVUÇ', 'PARA'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Ağaç! A, ğaç.', answer: 'AĞAÇ', distractors: ['HAVUÇ', 'DAĞ'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Fener! Fe, ner.', answer: 'FENER', distractors: ['PENCERE', 'VAZO'] },
      { promptText: '🎧 Dinle ve Doğru Kelimeyi Kap!', spokenText: 'Top! Tek heceli kelime: Top.', answer: 'TOP', distractors: ['DAĞ', 'JET'] }
    ]
  };

  // 5 SINIF SEVİYESİ VE KONU HAVUZU
  const MENDIL_TOPICS = {
    reading1: {
      id: 'reading1',
      tabLabel: '📖 1. Sınıf Okuma',
      badge: '📖 1. Sınıf Dinle & Doğru Kelimeyi Kap',
      isListeningOnlyPrompt: true,
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
      badge: '➕ 1-2. Sınıf Hızlı İşlem Kapmacası',
      isListeningOnlyPrompt: false,
      questions: [
        { promptText: '8 + 7 = ?', spokenText: 'Sekiz artı yedi kaç eder?', answer: '15', distractors: ['14', '16'] },
        { promptText: '15 - 6 = ?', spokenText: 'On beş eksi altı kaç eder?', answer: '9', distractors: ['8', '11'] },
        { promptText: '24 + 9 = ?', spokenText: 'Yirmi dört artı dokuz kaç eder?', answer: '33', distractors: ['32', '35'] },
        { promptText: '30 - 12 = ?', spokenText: 'Otuz eksi on iki kaç eder?', answer: '18', distractors: ['16', '22'] },
        { promptText: '18 - 9 = ?', spokenText: 'On sekiz eksi dokuz kaç eder?', answer: '9', distractors: ['7', '11'] },
        { promptText: '14 + 8 = ?', spokenText: 'On dört artı sekiz kaç eder?', answer: '22', distractors: ['21', '24'] },
        { promptText: '25 - 7 = ?', spokenText: 'Yirmi beş eksi yedi kaç eder?', answer: '18', distractors: ['17', '19'] },
        { promptText: '17 + 13 = ?', spokenText: 'On yedi artı on üç kaç eder?', answer: '30', distractors: ['29', '31'] },
        { promptText: '40 - 15 = ?', spokenText: 'Kırk eksi on beş kaç eder?', answer: '25', distractors: ['20', '35'] },
        { promptText: '19 + 6 = ?', spokenText: 'On dokuz artı altı kaç eder?', answer: '25', distractors: ['24', '26'] },
        { promptText: '22 - 8 = ?', spokenText: 'Yirmi iki eksi sekiz kaç eder?', answer: '14', distractors: ['12', '16'] },
        { promptText: '27 + 8 = ?', spokenText: 'Yirmi yedi artı sekiz kaç eder?', answer: '35', distractors: ['33', '36'] },
        { promptText: '36 - 14 = ?', spokenText: 'Otuz altı eksi on dört kaç eder?', answer: '22', distractors: ['20', '24'] },
        { promptText: '16 + 16 = ?', spokenText: 'On altı artı on altı kaç eder?', answer: '32', distractors: ['30', '34'] },
        { promptText: '50 - 18 = ?', spokenText: 'Elli eksi on sekiz kaç eder?', answer: '32', distractors: ['28', '34'] },
        { promptText: '9 + 6 = ?', spokenText: 'Dokuz artı altı kaç eder?', answer: '15', distractors: ['13', '17'] }
      ]
    },
    mult24: {
      id: 'mult24',
      tabLabel: '✖️ 2-4. Sınıf Çarpma',
      badge: '✖️ 2-4. Sınıf Çarpım Tablosu Yarışı',
      isListeningOnlyPrompt: false,
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
        { promptText: '8 × 8 = ?', spokenText: 'Sekiz kere sekiz kaç eder?', answer: '64', distractors: ['56', '72'] },
        { promptText: '7 × 7 = ?', spokenText: 'Yedi kere yedi kaç eder?', answer: '49', distractors: ['42', '56'] },
        { promptText: '6 × 6 = ?', spokenText: 'Altı kere altı kaç eder?', answer: '36', distractors: ['30', '42'] },
        { promptText: '3 × 9 = ?', spokenText: 'Üç kere dokuz kaç eder?', answer: '27', distractors: ['24', '30'] },
        { promptText: '5 × 7 = ?', spokenText: 'Beş kere yedi kaç eder?', answer: '35', distractors: ['30', '40'] }
      ]
    },
    clock23: {
      id: 'clock23',
      tabLabel: '🕒 2-3. Sınıf Saatler',
      badge: '🕒 2-3. Sınıf Dijital Saat Bulma',
      isListeningOnlyPrompt: false,
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
        { promptText: 'Beşi çeyrek geçiyor', spokenText: 'Beşi çeyrek geçiyor', answer: '05:15', distractors: ['04:45', '05:30'] },
        { promptText: 'On ikiye çeyrek var', spokenText: 'On ikiye çeyrek var', answer: '11:45', distractors: ['12:15', '12:45'] },
        { promptText: 'Saat bir buçuk', spokenText: 'Saat bir buçuk', answer: '01:30', distractors: ['01:15', '01:00'] },
        { promptText: 'Dokuzu çeyrek geçiyor', spokenText: 'Dokuzu çeyrek geçiyor', answer: '09:15', distractors: ['08:45', '09:30'] },
        { promptText: 'Dörde çeyrek var', spokenText: 'Dörde çeyrek var', answer: '03:45', distractors: ['04:15', '04:45'] }
      ]
    },
    fractions34: {
      id: 'fractions34',
      tabLabel: '🍕 3-4. Sınıf Kesirler',
      badge: '🍕 3-4. Sınıf Kesir Avı',
      isListeningOnlyPrompt: false,
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
        { promptText: 'Sekizde üç', spokenText: 'Sekizde üç', answer: '3/8', distractors: ['5/8', '8/3'] },
        { promptText: 'Dokuz bölü beş', spokenText: 'Dokuz bölü beş', answer: '9/5', distractors: ['5/9', '4/5'] },
        { promptText: 'Altıda bir', spokenText: 'Altıda bir', answer: '1/6', distractors: ['6/1', '5/6'] },
        { promptText: 'Onda yedi', spokenText: 'Onda yedi', answer: '7/10', distractors: ['3/10', '10/7'] },
        { promptText: 'Beş bölü üç', spokenText: 'Beş bölü üç', answer: '5/3', distractors: ['3/5', '2/3'] }
      ]
    }
  };

  // OYUN DURUMU
  const state = {
    activeTopicId: 'reading1',
    activeLetterGroupId: 'g1',
    bagByTopic: {},
    currentQuestion: null,
    leftOptions: [],
    rightOptions: [],
    scores: { 1: 0, 2: 0 },
    lockedUntil: { 1: 0, 2: 0 },
    lockTimers: { 1: null, 2: null },
    roundResolved: false,
    matchWinner: null,
    nextRoundTimer: null,
    speakTimer: null,
    audioCtx: null,
    isOpen: false
  };

  function isMobileSoloMode() {
    return window.innerWidth <= 768;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // CANLI ANALOG SAAT SVG ÇİZİMİ (Beyaz kadran, 1-12 rakamları, mavi kalın Akrep, kırmızı uzun Yelkovan)
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

    const sz = sizePx || 175;
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
        <div style="font-size:0.84rem;font-weight:800;color:#475569;">
          🔵 Akrep (Saat) • 🔴 Yelkovan (Dakika)
        </div>
      </div>
    `;
  }

  // RENKLİ ŞEKİLLİ KESİRLER SVG ÇİZİMİ (Pasta Daire Dilimleri + Kesir Çubuğu)
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
    const singleSize = wholeCount > 1 ? Math.round((pieSizePx || 145) * 0.76) : (pieSizePx || 145);

    let piesHtml = '';
    let rem = num;
    for (let w = 0; w < wholeCount; w++) {
      const take = Math.min(den, rem);
      rem = Math.max(0, rem - take);
      piesHtml += buildSinglePieSvg(den, take, fillCol, singleSize);
    }

    const totalCells = wholeCount * den;
    const barW = 210;
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

  function playWrongBuzzSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(195, now);
      osc.frequency.exponentialRampToValueAtTime(115, now + 0.22);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  function playApplauseAndPointSound(isGrandVictory) {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = isGrandVictory
        ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
        : [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.065);
        gain.gain.setValueAtTime(0.001, now + idx * 0.065);
        gain.gain.exponentialRampToValueAtTime(0.15, now + idx * 0.065 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.34);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.065);
        osc.stop(now + idx * 0.065 + 0.36);
      });

      const clapCount = isGrandVictory ? 10 : 6;
      for (let i = 0; i < clapCount; i++) {
        const start = now + 0.04 + i * 0.075 + Math.random() * 0.02;
        const bufLen = Math.floor(ctx.sampleRate * 0.055);
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
        clapGain.gain.exponentialRampToValueAtTime(0.001, start + 0.055);

        noise.connect(filter);
        filter.connect(clapGain);
        clapGain.connect(ctx.destination);
        noise.start(start);
        noise.stop(start + 0.06);
      }
    } catch (e) {}
  }

  function launchMendilConfetti(isBig) {
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

    const colors = ['#10B981', '#F59E0B', '#F97316', '#0EA5E9', '#EC4899', '#FACC15'];
    const count = isBig ? 110 : 42;
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.45;
    const particles = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = (isBig ? 6 : 4) + Math.random() * 10;
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
        p.vy += 0.3;
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
    const topic = MENDIL_TOPICS[topicId] || MENDIL_TOPICS.reading1;
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

  function clearRoundTimers() {
    if (state.nextRoundTimer) {
      clearTimeout(state.nextRoundTimer);
      state.nextRoundTimer = null;
    }
    [1, 2].forEach((team) => {
      if (state.lockTimers[team]) {
        clearTimeout(state.lockTimers[team]);
        state.lockTimers[team] = null;
      }
      state.lockedUntil[team] = 0;
    });
  }

  function syncLetterGroupsBarUI() {
    const bar = document.getElementById('moliMendilLetterGroupsBar');
    if (bar) {
      bar.style.display = state.activeTopicId === 'reading1' ? 'flex' : 'none';
    }
    document.querySelectorAll(`#${MODAL_ID} .mmg-letter-group-btn`).forEach((btn) => {
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
    startNewMatch('reading1');
  }

  function startNewMatch(topicId) {
    if (topicId && MENDIL_TOPICS[topicId]) {
      state.activeTopicId = topicId;
    }
    clearRoundTimers();
    stopVoice();
    state.scores = { 1: 0, 2: 0 };
    state.roundResolved = false;
    state.matchWinner = null;

    document.querySelectorAll(`#${MODAL_ID} .mmg-topic-tab`).forEach((btn) => {
      const active = btn.getAttribute('data-topic-id') === state.activeTopicId;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    syncLetterGroupsBarUI();
    loadNextRound();
  }

  function loadNextRound() {
    clearRoundTimers();
    state.roundResolved = false;

    const q = drawNextQuestionFromBag(state.activeTopicId);
    state.currentQuestion = q;

    const baseChoices = [q.answer, q.distractors[0], q.distractors[1]];
    state.leftOptions = shuffleArray(baseChoices);
    state.rightOptions = shuffleArray(baseChoices);
    // İki tarafın sırası mümkünse farklı olsun
    if (
      state.rightOptions[0] === state.leftOptions[0] &&
      state.rightOptions[1] === state.leftOptions[1]
    ) {
      const tmp = state.rightOptions[0];
      state.rightOptions[0] = state.rightOptions[2];
      state.rightOptions[2] = tmp;
    }

    renderScoreboard();
    renderArena();

    // Yeni soru geldiğinde otomatik seslendirme (MoliVoiceEngine.speak)
    state.speakTimer = setTimeout(() => {
      if (state.isOpen && !state.matchWinner && state.currentQuestion) {
        speakText(state.currentQuestion.spokenText);
      }
    }, 180);
  }

  function renderScoreboard() {
    const sb = document.getElementById('moliMendilScoreboard');
    if (!sb) return;

    if (isMobileSoloMode()) {
      sb.innerHTML = `
        <div class="mmg-score-pill mmg-pill-solo-mode">
          <span>⚡ Tek Kişilik Hız Modu</span>
        </div>
        <div class="mmg-score-center-title">🧣 Mendil Kapmaca</div>
        <div class="mmg-score-pill mmg-pill-team1">
          <span>🏆 Doğru: <strong>${state.scores[1]} / ${TARGET_SCORE}</strong></span>
        </div>
      `;
    } else {
      sb.innerHTML = `
        <div class="mmg-score-pill mmg-pill-team1 ${state.scores[1] > state.scores[2] ? 'is-leading' : ''}">
          <span>🟡 1. Takım</span>
          <strong>(${state.scores[1]}/${TARGET_SCORE})</strong>
        </div>
        <div class="mmg-score-center-title">🧣 Mendil Kapmaca</div>
        <div class="mmg-score-pill mmg-pill-team2 ${state.scores[2] > state.scores[1] ? 'is-leading' : ''}">
          <span>🟠 2. Takım</span>
          <strong>(${state.scores[2]}/${TARGET_SCORE})</strong>
        </div>
      `;
    }
  }

  function renderTeamCards(teamNum, options) {
    const isLocked = Date.now() < state.lockedUntil[teamNum];
    const teamColorCls = teamNum === 1 ? 'mmg-team-yellow' : 'mmg-team-orange';
    const teamTitle = isMobileSoloMode() && teamNum === 1
      ? '⚡ Doğru Kartı Seç &amp; Mendili Kap!'
      : (teamNum === 1 ? '🟡 1. TAKIM (SARI)' : '🟠 2. TAKIM (TURUNCU)');

    const cardsHtml = options.map((optText, idx) => `
      <button class="mmg-answer-card ${teamColorCls}"
              type="button"
              data-team="${teamNum}"
              data-option="${escapeHtml(optText)}"
              data-idx="${idx}"
              ${isLocked || state.roundResolved ? 'disabled' : ''}>
        <span class="mmg-card-text">${escapeHtml(optText)}</span>
      </button>
    `).join('');

    return `
      <div class="mmg-team-header ${teamColorCls}">
        <span class="mmg-team-title">${teamTitle}</span>
        <span class="mmg-lock-badge ${isLocked ? 'is-visible' : ''}" id="mmgLockBadge${teamNum}">🔒 1.5 sn Kilitli!</span>
      </div>
      <div class="mmg-cards-stack">
        ${cardsHtml}
      </div>
    `;
  }

  function renderArena() {
    const leftCol = document.getElementById('moliMendilColLeft');
    const centerCol = document.getElementById('moliMendilColCenter');
    const rightCol = document.getElementById('moliMendilColRight');
    const victoryOverlay = document.getElementById('moliMendilVictoryOverlay');

    if (victoryOverlay) {
      if (state.matchWinner) {
        const solo = isMobileSoloMode();
        const winTitle = solo
          ? `🏆 Tebrikler! ${TARGET_SCORE}/${TARGET_SCORE} Mendili Kaptın!`
          : (state.matchWinner === 1
            ? '🏆 1. Takım (Sarı) Mendili Kaptı ve Kazandı!'
            : '🏆 2. Takım (Turuncu) Mendili Kaptı ve Kazandı!');
        const winThemeCls = state.matchWinner === 1 ? 'is-team1-win' : 'is-team2-win';

        victoryOverlay.className = `mmg-victory-overlay is-open ${winThemeCls}`;
        victoryOverlay.innerHTML = `
          <div class="mmg-victory-card">
            <div class="mmg-victory-trophy" aria-hidden="true">🏆🧣</div>
            <h3 class="mmg-victory-title">${winTitle}</h3>
            <p class="mmg-victory-sub">
              ${solo
                ? 'Müthiş hız ve dikkat! Tüm soruları doğru yanıtladın.'
                : `Skor: 🟡 1. Takım (${state.scores[1]}) — 🟠 2. Takım (${state.scores[2]})`}
            </p>
            <div class="mmg-victory-actions">
              <button class="mmg-btn-replay" id="moliMendilReplayBtn" type="button">🔄 Tekrar Oyna</button>
              <button class="mmg-btn-finish" id="moliMendilWinCloseBtn" type="button">✕ Kapat</button>
            </div>
          </div>
        `;
        document.getElementById('moliMendilReplayBtn').addEventListener('click', () => startNewMatch());
        document.getElementById('moliMendilWinCloseBtn').addEventListener('click', closeMendilGame);
      } else {
        victoryOverlay.className = 'mmg-victory-overlay';
        victoryOverlay.innerHTML = '';
      }
    }

    if (!state.currentQuestion) return;
    const topic = MENDIL_TOPICS[state.activeTopicId] || MENDIL_TOPICS.reading1;
    const q = state.currentQuestion;

    if (leftCol) {
      leftCol.innerHTML = renderTeamCards(1, state.leftOptions);
      leftCol.classList.toggle('is-locked', Date.now() < state.lockedUntil[1]);
    }
    if (rightCol) {
      rightCol.innerHTML = renderTeamCards(2, state.rightOptions);
      rightCol.classList.toggle('is-locked', Date.now() < state.lockedUntil[2]);
    }

    if (centerCol) {
      centerCol.innerHTML = `
        <div class="mmg-topic-pill">${escapeHtml(topic.badge)}</div>

        <!-- Moli + Elinde Yeşil Mendil Sahnesi (%30 Büyütülmüş) -->
        <div class="mmg-moli-referee-box">
          <div class="mmg-moli-avatar-wrap">
            <img src="assets/mascot/moli.webp" class="mmg-moli-img" alt="Hakem Moli" width="125" height="125">
            <div class="mmg-handkerchief-wrap" id="moliMendilCloth" aria-hidden="true">
              <svg class="mmg-green-mendil-svg" width="86" height="76" viewBox="0 0 66 58" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 10C26 5 46 7 58 18C52 33 43 44 26 52C17 41 10 27 14 10Z" fill="#22C55E" stroke="#FFFFFF" stroke-width="3.5" stroke-linejoin="round"/>
                <path d="M22 18C30 22 38 28 43 38" stroke="#86EFAC" stroke-width="3" stroke-linecap="round"/>
                <circle cx="15" cy="12" r="5" fill="#FACC15" stroke="#FFFFFF" stroke-width="2.5"/>
              </svg>
            </div>
          </div>
          <div class="mmg-round-status-banner" id="moliMendilStatusBanner">
            ${topic.isListeningOnlyPrompt
              ? '🧣 Sesli okunan kelimeye ilk dokunan mendili kapar!'
              : '🧣 Doğru cevaba ilk dokunan mendili kapar!'}
          </div>
        </div>

        <!-- Hedef Soru / Kelime Kutusu (Saatler ve Kesirler için Canlı SVG Görsel) -->
        <div class="mmg-question-card ${topic.isListeningOnlyPrompt ? 'is-listening-card' : ''}">
          ${state.activeTopicId === 'clock23'
            ? `
              ${buildAnalogClockSvg(q.answer, 175)}
              <div class="mmg-question-text" style="font-size:clamp(1.25rem,2.1vw,1.7rem);">${escapeHtml(q.promptText)}</div>
            `
            : (state.activeTopicId === 'fractions34'
              ? `
                ${buildFractionModelSvg(q.answer, 145)}
                <div class="mmg-question-text" style="font-size:clamp(1.25rem,2.1vw,1.7rem);">${escapeHtml(q.promptText)}</div>
              `
              : `<div class="mmg-question-text">${escapeHtml(q.promptText)}</div>`
            )
          }
          <button class="mmg-btn-listen" id="moliMendilListenBtn" type="button">
            <span aria-hidden="true">🔊</span>
            <span>Soruyu Dinle</span>
          </button>
        </div>
      `;

      const listenBtn = document.getElementById('moliMendilListenBtn');
      if (listenBtn) {
        listenBtn.addEventListener('click', () => {
          if (state.currentQuestion) {
            speakText(state.currentQuestion.spokenText);
          }
        });
      }
    }

    bindCardInteractions();
  }

  function bindCardInteractions() {
    const cards = document.querySelectorAll(`#${MODAL_ID} .mmg-answer-card`);
    cards.forEach((btn) => {
      let handledPointerAt = 0;

      btn.addEventListener('pointerdown', (e) => {
        if (e.button && e.button !== 0) return;
        handledPointerAt = Date.now();
        const teamNum = parseInt(btn.getAttribute('data-team'), 10);
        const opt = btn.getAttribute('data-option');
        handleCardPick(teamNum, opt, btn);
      });

      btn.addEventListener('click', (e) => {
        // Dokunma / fare sonrası çift tetiklemeyi önle, klavye Enter/Space çalışsın
        if (Date.now() - handledPointerAt < 450) {
          e.preventDefault();
          return;
        }
        const teamNum = parseInt(btn.getAttribute('data-team'), 10);
        const opt = btn.getAttribute('data-option');
        handleCardPick(teamNum, opt, btn);
      });
    });
  }

  function handleCardPick(teamNum, selectedOption, btnEl) {
    if (!state.isOpen || state.roundResolved || state.matchWinner || !state.currentQuestion) return;
    if (Date.now() < state.lockedUntil[teamNum]) return;

    const isCorrect = selectedOption === state.currentQuestion.answer;

    if (isCorrect) {
      state.roundResolved = true;
      state.scores[teamNum] += 1;

      if (btnEl) btnEl.classList.add('is-correct');

      // Diğer kartları kilitle
      document.querySelectorAll(`#${MODAL_ID} .mmg-answer-card`).forEach((c) => {
        c.disabled = true;
      });

      // Yeşil mendili kazanan takıma çekme animasyonu
      const clothEl = document.getElementById('moliMendilCloth');
      const statusBanner = document.getElementById('moliMendilStatusBanner');
      const solo = isMobileSoloMode();

      if (clothEl) {
        clothEl.classList.remove('is-pulled-left', 'is-pulled-right', 'is-pulled-solo');
        if (solo) {
          clothEl.classList.add('is-pulled-solo');
        } else if (teamNum === 1) {
          clothEl.classList.add('is-pulled-left');
        } else {
          clothEl.classList.add('is-pulled-right');
        }
      }

      if (statusBanner) {
        statusBanner.classList.add('is-win-banner');
        statusBanner.textContent = solo
          ? `🎉 Harika! Mendili Kaptın! (${state.scores[1]}/${TARGET_SCORE})`
          : `🎉 ${teamNum}. Takım Mendili Kaptı! (+1 Puan)`;
      }

      renderScoreboard();

      const hasWonMatch = state.scores[teamNum] >= TARGET_SCORE;
      playApplauseAndPointSound(hasWonMatch);

      if (hasWonMatch) {
        state.matchWinner = teamNum;
        launchMendilConfetti(true);
        state.nextRoundTimer = setTimeout(() => {
          renderArena();
          const winSpeech = solo
            ? 'Tebrikler! Beş mendili de kaptın ve şampiyon oldun!'
            : `Tebrikler! ${teamNum}. takım mendili kaptı ve yarışmayı kazandı!`;
          speakText(winSpeech);
        }, 700);
      } else {
        launchMendilConfetti(false);
        state.nextRoundTimer = setTimeout(() => {
          if (state.isOpen && !state.matchWinner) {
            loadNextRound();
          }
        }, 1250);
      }
      return;
    }

    // Yanlış karta basıldı -> 1.5 saniye takım kilidi
    playWrongBuzzSound();
    state.lockedUntil[teamNum] = Date.now() + PENALTY_LOCK_MS;

    const colEl = document.getElementById(teamNum === 1 ? 'moliMendilColLeft' : 'moliMendilColRight');
    const lockBadge = document.getElementById(`mmgLockBadge${teamNum}`);
    if (btnEl) btnEl.classList.add('is-wrong');
    if (colEl) colEl.classList.add('is-locked');
    if (lockBadge) lockBadge.classList.add('is-visible');

    document.querySelectorAll(`#${MODAL_ID} .mmg-answer-card[data-team="${teamNum}"]`).forEach((c) => {
      c.disabled = true;
    });

    if (state.lockTimers[teamNum]) clearTimeout(state.lockTimers[teamNum]);
    state.lockTimers[teamNum] = setTimeout(() => {
      state.lockedUntil[teamNum] = 0;
      if (state.roundResolved || state.matchWinner) return;

      if (colEl) colEl.classList.remove('is-locked');
      if (lockBadge) lockBadge.classList.remove('is-visible');
      document.querySelectorAll(`#${MODAL_ID} .mmg-answer-card[data-team="${teamNum}"]`).forEach((c) => {
        c.classList.remove('is-wrong');
        c.disabled = false;
      });
    }, PENALTY_LOCK_MS);
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
        background: linear-gradient(145deg, #064E3B 0%, #0F766E 42%, #0F172A 100%);
        color: #0F172A;
        font-family: 'Nunito', 'Fredoka', sans-serif;
        border-radius: 28px;
        border: 4px solid rgba(110, 231, 183, 0.35);
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

      /* Üst Bar (İnce ve Tek Satır) */
      #${MODAL_ID} .mmg-topbar {
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
      #${MODAL_ID} .mmg-brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      #${MODAL_ID} .mmg-brand-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.45rem;
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);
        flex-shrink: 0;
      }
      #${MODAL_ID} .mmg-brand-title {
        margin: 0;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.08rem, 1.8vw, 1.38rem);
        font-weight: 700;
        color: #064E3B;
      }
      #${MODAL_ID} .mmg-brand-sub {
        margin: 0;
        font-size: 0.8rem;
        font-weight: 800;
        color: #64748B;
      }
      #${MODAL_ID} .mmg-close-btn {
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
      #${MODAL_ID} .mmg-close-btn:hover {
        background: #FEE2E2;
        transform: translateY(-1px);
      }

      /* 5 Konu Sekmesi Barı (İnce ve Tek Satır) */
      #${MODAL_ID} .mmg-topics-bar {
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
      #${MODAL_ID} .mmg-topic-tab {
        padding: 7px 14px;
        border-radius: 12px;
        border: 2px solid rgba(255, 255, 255, 0.25);
        border-bottom: 3px solid rgba(15, 23, 42, 0.4);
        background: rgba(255, 255, 255, 0.94);
        color: #1E293B;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(0.85rem, 1.15vw, 0.98rem);
        font-weight: 700;
        white-space: nowrap;
        cursor: pointer;
        touch-action: manipulation;
        transition: all 0.14s ease;
      }
      #${MODAL_ID} .mmg-topic-tab:hover {
        transform: translateY(-1px);
        background: #FFFFFF;
      }
      #${MODAL_ID} .mmg-topic-tab.is-active {
        background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        border-color: #6EE7B7;
        border-bottom-color: #065F46;
        color: #FFFFFF;
        box-shadow: 0 5px 15px rgba(16, 185, 129, 0.45);
        transform: translateY(-1px);
      }

      /* 1. Sınıf MEB Harf Grubu Seçici Alt Barı */
      #${MODAL_ID} .mmg-letter-groups-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap;
        overflow-x: auto;
        gap: 6px;
        padding: 5px 14px;
        background: rgba(15, 23, 42, 0.72);
        border-bottom: 1px solid rgba(110, 231, 183, 0.28);
        flex-shrink: 0;
      }
      #${MODAL_ID} .mmg-letter-group-label {
        font-size: 0.78rem;
        font-weight: 800;
        color: #6EE7B7;
        white-space: nowrap;
        margin-right: 4px;
      }
      #${MODAL_ID} .mmg-letter-group-btn {
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
      #${MODAL_ID} .mmg-letter-group-btn:hover {
        background: rgba(255, 255, 255, 0.24);
      }
      #${MODAL_ID} .mmg-letter-group-btn.is-active {
        background: linear-gradient(135deg, #38BDF8 0%, #0284C7 100%);
        border-color: #BAE6FD;
        color: #FFFFFF;
        box-shadow: 0 3px 10px rgba(14, 165, 233, 0.45);
      }

      /* Skor Tabelası */
      #${MODAL_ID} .mmg-scoreboard {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        max-width: 1360px;
        width: 100%;
        margin: 10px auto 0;
        padding: 0 24px;
        flex-shrink: 0;
      }
      #${MODAL_ID} .mmg-score-pill {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 24px;
        border-radius: 20px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.15rem, 1.8vw, 1.45rem);
        font-weight: 700;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.35);
        border: 3px solid #FFFFFF;
      }
      #${MODAL_ID} .mmg-pill-team1 {
        background: linear-gradient(135deg, #FEF08A 0%, #FACC15 100%);
        color: #713F12;
      }
      #${MODAL_ID} .mmg-pill-team2 {
        background: linear-gradient(135deg, #FED7AA 0%, #FB923C 100%);
        color: #7C2D12;
      }
      #${MODAL_ID} .mmg-pill-solo-mode {
        background: linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%);
        color: #0369A1;
      }
      #${MODAL_ID} .mmg-score-pill.is-leading {
        transform: scale(1.05);
        box-shadow: 0 0 0 4px #22C55E, 0 12px 28px rgba(34, 197, 94, 0.42);
      }
      #${MODAL_ID} .mmg-score-center-title {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.25rem, 2.1vw, 1.7rem);
        font-weight: 700;
        color: #FFFFFF;
        text-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
        text-align: center;
      }

      /* 3 Sütunlu Yarış Sahnesi (%30 Büyütülmüş Elemanlar) */
      #${MODAL_ID} .mmg-arena {
        position: relative;
        flex: 1;
        display: grid;
        grid-template-columns: 1fr minmax(350px, 460px) 1fr;
        align-items: stretch;
        gap: 24px;
        max-width: 1360px;
        width: 100%;
        margin: 0 auto;
        padding: 12px 24px 20px;
      }

      /* Takım Sütunları */
      #${MODAL_ID} .mmg-team-col {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 18px;
        border-radius: 28px;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.08) 100%);
        border: 2.5px solid rgba(255, 255, 255, 0.28);
        box-shadow: 0 18px 42px rgba(0, 0, 0, 0.32);
        backdrop-filter: blur(8px);
        transition: opacity 0.18s ease, filter 0.18s ease;
      }
      #${MODAL_ID} .mmg-team-col.is-locked {
        opacity: 0.72;
        filter: grayscale(0.2);
      }
      #${MODAL_ID} .mmg-team-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 12px 16px;
        border-radius: 18px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.2rem;
        font-weight: 700;
        box-shadow: 0 6px 16px rgba(15, 23, 42, 0.22);
      }
      #${MODAL_ID} .mmg-team-header.mmg-team-yellow {
        background: linear-gradient(135deg, #FEF9C3 0%, #FEF08A 100%);
        color: #854D0E;
        border: 2.5px solid #FACC15;
      }
      #${MODAL_ID} .mmg-team-header.mmg-team-orange {
        background: linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%);
        color: #9A3412;
        border: 2.5px solid #FB923C;
      }
      #${MODAL_ID} .mmg-lock-badge {
        display: none;
        padding: 5px 12px;
        border-radius: 999px;
        background: #EF4444;
        color: #FFFFFF;
        font-size: 0.88rem;
        font-weight: 800;
        animation: mmgShake 0.3s ease;
      }
      #${MODAL_ID} .mmg-lock-badge.is-visible {
        display: inline-block;
      }

      #${MODAL_ID} .mmg-cards-stack {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 16px;
      }
      #${MODAL_ID} .mmg-answer-card {
        flex: 1;
        min-height: 120px;
        padding: 20px 18px;
        border-radius: 26px;
        border: 5px solid;
        border-bottom-width: 10px;
        background: #FFFFFF;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(2.1rem, 3.6vw, 3.3rem);
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        box-shadow: 0 14px 32px rgba(15, 23, 42, 0.34);
        touch-action: manipulation;
        transition: transform 0.1s ease, background 0.14s ease, border-color 0.14s ease;
      }
      #${MODAL_ID} .mmg-answer-card.mmg-team-yellow {
        border-color: #FACC15;
        border-bottom-color: #CA8A04;
        color: #713F12;
        background: linear-gradient(180deg, #FFFFFF 0%, #FEF9C3 100%);
      }
      #${MODAL_ID} .mmg-answer-card.mmg-team-orange {
        border-color: #FB923C;
        border-bottom-color: #C2410C;
        color: #7C2D12;
        background: linear-gradient(180deg, #FFFFFF 0%, #FFEDD5 100%);
      }
      #${MODAL_ID} .mmg-answer-card:active:not(:disabled) {
        transform: scale(0.97) translateY(2px);
      }
      #${MODAL_ID} .mmg-answer-card.is-correct {
        background: linear-gradient(180deg, #DCFCE7 0%, #86EFAC 100%) !important;
        border-color: #22C55E !important;
        border-bottom-color: #15803D !important;
        color: #14532D !important;
        transform: scale(1.05);
        box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.5), 0 18px 36px rgba(22, 163, 74, 0.5);
      }
      #${MODAL_ID} .mmg-answer-card.is-wrong {
        background: linear-gradient(180deg, #FEE2E2 0%, #FECACA 100%) !important;
        border-color: #EF4444 !important;
        border-bottom-color: #B91C1C !important;
        color: #7F1D1D !important;
        animation: mmgShake 0.32s ease;
      }
      #${MODAL_ID} .mmg-answer-card:disabled {
        cursor: not-allowed;
      }

      @keyframes mmgShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-7px); }
        50% { transform: translateX(7px); }
        75% { transform: translateX(-5px); }
      }

      /* Orta Sütun: %30 Büyütülmüş Hakem Moli + Yeşil Mendil + Soru Kutusu */
      #${MODAL_ID} .mmg-center-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        text-align: center;
      }
      #${MODAL_ID} .mmg-topic-pill {
        padding: 8px 18px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.96);
        color: #065F46;
        font-size: 0.96rem;
        font-weight: 800;
        box-shadow: 0 6px 16px rgba(15, 23, 42, 0.28);
      }
      #${MODAL_ID} .mmg-moli-referee-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        width: 100%;
      }
      #${MODAL_ID} .mmg-moli-avatar-wrap {
        position: relative;
        width: 158px;
        height: 148px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 36px;
        background: radial-gradient(circle, #FFFFFF 0%, #A7F3D0 100%);
        border: 5px solid #34D399;
        box-shadow: 0 18px 40px rgba(0, 0, 0, 0.42);
      }
      #${MODAL_ID} .mmg-moli-img {
        width: 118px;
        height: 118px;
        object-fit: contain;
        filter: drop-shadow(0 6px 12px rgba(15, 23, 42, 0.25));
      }
      #${MODAL_ID} .mmg-handkerchief-wrap {
        position: absolute;
        right: -30px;
        bottom: -10px;
        z-index: 6;
        filter: drop-shadow(0 8px 14px rgba(15, 23, 42, 0.45));
        animation: mmgMendilWave 1.8s ease-in-out infinite;
        transition: transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes mmgMendilWave {
        0%, 100% { transform: rotate(-6deg) translateY(0); }
        50% { transform: rotate(8deg) translateY(-4px); }
      }
      #${MODAL_ID} .mmg-handkerchief-wrap.is-pulled-left {
        animation: none;
        transform: translate(-220px, 18px) rotate(-26deg) scale(1.28);
      }
      #${MODAL_ID} .mmg-handkerchief-wrap.is-pulled-right {
        animation: none;
        transform: translate(195px, 18px) rotate(26deg) scale(1.28);
      }
      #${MODAL_ID} .mmg-handkerchief-wrap.is-pulled-solo {
        animation: none;
        transform: translate(-10px, 190px) rotate(12deg) scale(1.28);
      }

      #${MODAL_ID} .mmg-round-status-banner {
        padding: 10px 16px;
        border-radius: 16px;
        background: rgba(15, 23, 42, 0.65);
        color: #F8FAFC;
        font-size: 1rem;
        font-weight: 800;
        border: 2px solid rgba(255, 255, 255, 0.22);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28);
      }
      #${MODAL_ID} .mmg-round-status-banner.is-win-banner {
        background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
        color: #FFFFFF;
        border-color: #DCFCE7;
        box-shadow: 0 10px 24px rgba(34, 197, 94, 0.55);
      }

      /* %30 Büyütülmüş Soru Kartı */
      #${MODAL_ID} .mmg-question-card {
        width: 100%;
        background: linear-gradient(180deg, #FFFFFF 0%, #ECFDF5 100%);
        border: 5px solid #34D399;
        border-bottom: 10px solid #059669;
        border-radius: 30px;
        padding: 28px 22px;
        box-shadow: 0 24px 52px rgba(0, 0, 0, 0.44);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 18px;
      }
      #${MODAL_ID} .mmg-question-text {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.95rem, 3.6vw, 3.1rem);
        font-weight: 700;
        color: #0F172A;
        line-height: 1.2;
      }
      #${MODAL_ID} .mmg-question-card.is-listening-card .mmg-question-text {
        font-size: clamp(1.45rem, 2.3vw, 1.9rem);
        color: #0369A1;
      }
      #${MODAL_ID} .mmg-btn-listen {
        width: 100%;
        padding: 16px 22px;
        border-radius: 18px;
        border: 2.5px solid #0284C7;
        border-bottom: 6px solid #0369A1;
        background: linear-gradient(180deg, #0EA5E9 0%, #0284C7 100%);
        color: #FFFFFF;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.3rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        box-shadow: 0 10px 24px rgba(2, 132, 199, 0.38);
        touch-action: manipulation;
        transition: transform 0.12s ease;
      }
      #${MODAL_ID} .mmg-btn-listen:hover {
        transform: translateY(-2px);
      }

      /* Zafer Overlay */
      #${MODAL_ID} .mmg-victory-overlay {
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
      #${MODAL_ID} .mmg-victory-overlay.is-open {
        display: flex;
      }
      #${MODAL_ID} .mmg-victory-card {
        width: 100%;
        max-width: 520px;
        background: #FFFFFF;
        border: 5px solid #22C55E;
        border-bottom: 10px solid #15803D;
        border-radius: 30px;
        padding: 30px 24px;
        text-align: center;
        box-shadow: 0 28px 65px rgba(0, 0, 0, 0.45);
        animation: mmgWinPop 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes mmgWinPop {
        0% { transform: scale(0.84); opacity: 0.3; }
        100% { transform: scale(1); opacity: 1; }
      }
      #${MODAL_ID} .mmg-victory-trophy {
        font-size: 4.2rem;
        margin-bottom: 10px;
      }
      #${MODAL_ID} .mmg-victory-title {
        margin: 0 0 10px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.5rem, 2.8vw, 2.1rem);
        color: #14532D;
      }
      #${MODAL_ID} .mmg-victory-sub {
        margin: 0 0 22px;
        font-size: 1.05rem;
        font-weight: 800;
        color: #475569;
      }
      #${MODAL_ID} .mmg-victory-actions {
        display: grid;
        grid-template-columns: 1.4fr 1fr;
        gap: 12px;
      }
      #${MODAL_ID} .mmg-btn-replay {
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
      #${MODAL_ID} .mmg-btn-finish {
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

      /* MOBİL DÜZEN (<= 768px): Sağ sütunu gizle, üstte Moli + soru, altta 3 büyük kart */
      @media (max-width: 768px) {
        #${MODAL_ID} .mmg-topbar {
          padding: 10px 14px;
        }
        #${MODAL_ID} .mmg-brand-sub {
          display: none;
        }
        #${MODAL_ID} .mmg-scoreboard {
          padding: 0 12px;
          margin-top: 10px;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }
        #${MODAL_ID} .mmg-score-center-title {
          display: none;
        }
        #${MODAL_ID} .mmg-arena {
          grid-template-columns: 1fr;
          padding: 12px;
          gap: 14px;
        }
        #${MODAL_ID} #moliMendilColRight {
          display: none !important;
        }
        #${MODAL_ID} #moliMendilColCenter {
          order: 1;
        }
        #${MODAL_ID} #moliMendilColLeft {
          order: 2;
        }
        #${MODAL_ID} .mmg-answer-card {
          min-height: 74px;
          font-size: 1.65rem;
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
    modal.setAttribute('aria-label', 'Mendil Kapmaca: Canlı Yarış');

    const tabsHtml = Object.values(MENDIL_TOPICS).map((t) => `
      <button class="mmg-topic-tab ${t.id === state.activeTopicId ? 'is-active' : ''}"
              type="button"
              role="tab"
              data-topic-id="${t.id}"
              aria-selected="${t.id === state.activeTopicId ? 'true' : 'false'}">
        ${escapeHtml(t.tabLabel)}
      </button>
    `).join('');

    const letterGroupsHtml = READING1_LETTER_GROUPS.map((g) => `
      <button class="mmg-letter-group-btn ${g.id === state.activeLetterGroupId ? 'is-active' : ''}"
              type="button"
              data-group-id="${g.id}"
              aria-pressed="${g.id === state.activeLetterGroupId ? 'true' : 'false'}">
        ${escapeHtml(g.label)}
      </button>
    `).join('');

    modal.innerHTML = `
      <header class="mmg-topbar">
        <div class="mmg-brand">
          <div class="mmg-brand-icon" aria-hidden="true">🧣</div>
          <div>
            <h2 class="mmg-brand-title">🧣 Mendil Kapmaca: Canlı Yarış</h2>
            <p class="mmg-brand-sub">Doğru Karta İlk Dokunan Yeşil Mendili Kapar • 5 Puan Alan Kazanır!</p>
          </div>
        </div>
        <button class="mmg-close-btn" id="moliMendilCloseBtn" type="button" aria-label="Mendil Kapmaca Oyununu Kapat">✕ Kapat</button>
      </header>

      <nav class="mmg-topics-bar" role="tablist" aria-label="Sınıf ve Konu Seçimi">
        ${tabsHtml}
      </nav>

      <div class="mmg-letter-groups-bar" id="moliMendilLetterGroupsBar" role="toolbar" aria-label="1. Sınıf MEB Harf Grubu Seçimi">
        <span class="mmg-letter-group-label">🔤 Harf Grubu:</span>
        ${letterGroupsHtml}
      </div>

      <div class="mmg-scoreboard" id="moliMendilScoreboard"></div>

      <main class="mmg-arena">
        <section class="mmg-team-col" id="moliMendilColLeft" aria-label="1. Takım Cevapları"></section>
        <section class="mmg-center-col" id="moliMendilColCenter" aria-label="Hakem Moli ve Soru"></section>
        <section class="mmg-team-col" id="moliMendilColRight" aria-label="2. Takım Cevapları"></section>
      </main>

      <div class="mmg-victory-overlay" id="moliMendilVictoryOverlay" aria-live="polite"></div>
    `;

    document.body.appendChild(modal);

    document.getElementById('moliMendilCloseBtn').addEventListener('click', closeMendilGame);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeMendilGame();
      }
    });

    modal.querySelectorAll('.mmg-topic-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const topicId = btn.getAttribute('data-topic-id');
        startNewMatch(topicId);
      });
    });

    modal.querySelectorAll('.mmg-letter-group-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const groupId = btn.getAttribute('data-group-id');
        switchLetterGroup(groupId);
      });
    });

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (!state.isOpen) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        renderScoreboard();
        renderArena();
      }, 120);
    });
  }

  function openMendilGame(initialTopicId) {
    buildModal();
    state.isOpen = true;
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.add('is-open');
    startNewMatch(initialTopicId || state.activeTopicId);
  }

  function closeMendilGame() {
    state.isOpen = false;
    clearRoundTimers();
    stopVoice();
    const confetti = document.getElementById(CONFETTI_CANVAS_ID);
    if (confetti) confetti.remove();
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.remove('is-open');
  }

  window.openMoliMendilGame = openMendilGame;
  window.closeMoliMendilGame = closeMendilGame;

  function injectAndBindShowcaseCard() {
    const arcadeGrid = document.querySelector('#arcadeHubSection .arcade-games-grid');
    if (arcadeGrid && !document.getElementById('arcadeCardMendilGame')) {
      const card = document.createElement('div');
      card.className = 'arcade-game-card theme-tug';
      card.id = 'arcadeCardMendilGame';
      card.setAttribute('data-open-moli-mendil', '1');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.innerHTML = `
        <div class="arcade-card-hero-banner banner-tug" aria-hidden="true">
          <div class="banner-scene scene-tug">
            <div class="banner-tug-team team-blue">
              <span class="mini-puller-icon">🟡</span>
              <span class="mini-team-pill">1. Takım</span>
            </div>
            <div class="banner-tug-rope">
              <div class="rope-line"></div>
              <div class="rope-center-badge">
                <span class="badge-shield">🧣</span>
                <span class="badge-bolt">🤖</span>
              </div>
            </div>
            <div class="banner-tug-team team-orange">
              <span class="mini-puller-icon">🟠</span>
              <span class="mini-team-pill">2. Takım</span>
            </div>
          </div>
        </div>
        <div class="arcade-card-top">
          <span class="arcade-card-tag">🧣 2 Kişi &amp; 📱 Tek Kişi</span>
          <span class="arcade-card-chip chip-green">⚡ Canlı Yarış</span>
        </div>
        <h3 class="arcade-card-title">🧣 Mendil Kapmaca: Canlı Yarış</h3>
        <p class="arcade-card-desc">Moli'nin tuttuğu yeşil mendili kap! Doğru kelimeye, işleme, saate veya kesire ilk dokunan +1 puan alır!</p>
        <div class="arcade-card-badges">
          <span>🔊 Otomatik Sesli Soru</span>
          <span>🔒 1.5s Yanlış Kilidi</span>
        </div>
        <button class="arcade-card-play-btn" type="button">Yarışı Başlat ›</button>
      `;
      const wheelCard = document.getElementById('arcadeCardSmartWheel');
      if (wheelCard && wheelCard.nextSibling) {
        arcadeGrid.insertBefore(card, wheelCard.nextSibling);
      } else {
        arcadeGrid.insertBefore(card, arcadeGrid.firstChild);
      }
    }

    document.querySelectorAll('[data-open-moli-mendil], #arcadeCardMendilGame').forEach((el) => {
      if (el.dataset.moliMendilBound) return;
      el.dataset.moliMendilBound = '1';
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const topic = el.getAttribute('data-mendil-topic') || undefined;
        openMendilGame(topic);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          const topic = el.getAttribute('data-mendil-topic') || undefined;
          openMendilGame(topic);
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
