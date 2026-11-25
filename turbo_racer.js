/**
 * ==========================================================================
 * DERSE Bİ' MOLA - BAĞIMSIZ TURBO OTOBAN YARIŞI (turbo_racer.js)
 * 3. Adım: 5 Sınıf/Konu Sekmesi, 3 Şeritli Canlı Otoban (HTML5 Canvas),
 * Yanlarda Akan Ağaçlar ve Evler, Sarı/Turuncu Yarış Arabası,
 * İlkokul Seviyesine Uygun Okunaklı Kapılar, Doğrudan Şeride Dokunma & Klavye,
 * 🔥 TURBO Butonu + Alev Efekti, 8 Doğruda Damalı Bitiş Çizgisi & Zafer!
 * app.js ve mevcut oyun motorlarından tamamen bağımsız çalışır.
 * ==========================================================================
 */
(function () {
  'use strict';

  const MODAL_ID = 'moli-turbo-modal';
  const STYLE_ID = 'moli-turbo-racer-styles';
  const CONFETTI_CANVAS_ID = 'moli-turbo-confetti-canvas';
  const TARGET_CORRECT = 8;
  const MAX_LIVES = 3;

  // 1. SINIF MEB MAARİF MODELİ 29 HARF TAM ÖĞRETİM SIRASI VE KESİN KÜMÜLATİF FİLTRE
  const MEB_ORDER = ['A','N','E','T','İ','L','O','K','U','R','I','M','Ü','S','Ö','Y','D','Z','Ç','B','G','C','Ş','P','H','V','Ğ','F','J'];

  const READING1_LETTER_GROUPS = [
    { id: 'g1', label: '1. Grup (A-N-E-T-İ-L)', letters: ['A', 'N', 'E', 'T', 'İ', 'L'], lastLetter: 'L' },
    { id: 'g2', label: '2. Grup (O-K-U-R-I-M)', letters: ['O', 'K', 'U', 'R', 'I', 'M'], lastLetter: 'M' },
    { id: 'g3', label: '3. Grup (Ü-S-Ö-Y-D-Z)', letters: ['Ü', 'S', 'Ö', 'Y', 'D', 'Z'], lastLetter: 'Z' },
    { id: 'g4', label: '4. Grup (Ç-B-G-C-Ş)', letters: ['Ç', 'B', 'G', 'C', 'Ş'], lastLetter: 'Ş' },
    { id: 'g5', label: '5. Grup (P-H-V-Ğ-F-J)', letters: ['P', 'H', 'V', 'Ğ', 'F', 'J'], lastLetter: 'J' }
  ];

  function makeReadingEntry(word, syllStr) {
    const parts = syllStr.split('-').map((s) => s.trim());
    const upper = word.toLocaleUpperCase('tr-TR');
    const spoken = parts.length === 1
      ? `${word}! Tek heceli kelime: ${word}.`
      : `${word}! ${parts.join(', ')}.`;
    return {
      word: upper,
      syllables: parts,
      spokenText: spoken
    };
  }

  const READING1_MASTER_WORDS = [
    // --- 1. GRUP: A, N, E, T, İ, L ---
    makeReadingEntry('AN', 'an'),
    makeReadingEntry('ANA', 'a-na'),
    makeReadingEntry('NANA', 'na-na'),
    makeReadingEntry('ANAN', 'a-nan'),
    makeReadingEntry('NAN', 'nan'),
    makeReadingEntry('NAA', 'na-a'),
    makeReadingEntry('ANNE', 'an-ne'),
    makeReadingEntry('NANE', 'na-ne'),
    makeReadingEntry('ENE', 'e-ne'),
    makeReadingEntry('NE', 'ne'),
    makeReadingEntry('EN', 'en'),
    makeReadingEntry('ANANE', 'a-na-ne'),
    makeReadingEntry('NENE', 'ne-ne'),
    makeReadingEntry('AT', 'at'),
    makeReadingEntry('ATA', 'a-ta'),
    makeReadingEntry('ET', 'et'),
    makeReadingEntry('TEN', 'ten'),
    makeReadingEntry('TAN', 'tan'),
    makeReadingEntry('NET', 'net'),
    makeReadingEntry('ANT', 'ant'),
    makeReadingEntry('TENE', 'te-ne'),
    makeReadingEntry('ANTEN', 'an-ten'),
    makeReadingEntry('TANE', 'ta-ne'),
    makeReadingEntry('İT', 'it'),
    makeReadingEntry('İN', 'in'),
    makeReadingEntry('ETİ', 'e-ti'),
    makeReadingEntry('İNAT', 'i-nat'),
    makeReadingEntry('NİNE', 'ni-ne'),
    makeReadingEntry('TİNET', 'ti-net'),
    makeReadingEntry('ATİ', 'a-ti'),
    makeReadingEntry('ANİ', 'a-ni'),
    makeReadingEntry('EL', 'el'),
    makeReadingEntry('AL', 'al'),
    makeReadingEntry('LALE', 'la-le'),
    makeReadingEntry('ELA', 'e-la'),
    makeReadingEntry('TALAT', 'ta-lat'),
    makeReadingEntry('NİL', 'nil'),
    makeReadingEntry('TEL', 'tel'),
    makeReadingEntry('ALT', 'alt'),
    makeReadingEntry('İLE', 'i-le'),
    makeReadingEntry('ELİT', 'e-lit'),
    makeReadingEntry('ALET', 'a-let'),
    makeReadingEntry('İLET', 'i-let'),
    makeReadingEntry('NİNEL', 'ni-nel'),
    makeReadingEntry('ELTİ', 'el-ti'),
    makeReadingEntry('ATEL', 'a-tel'),
    makeReadingEntry('ALAN', 'a-lan'),
    makeReadingEntry('NAL', 'nal'),
    makeReadingEntry('ALİ', 'a-li'),

    // --- 2. GRUP: + O, K, U, R, I, M ---
    makeReadingEntry('OL', 'ol'),
    makeReadingEntry('ON', 'on'),
    makeReadingEntry('ONA', 'o-na'),
    makeReadingEntry('OT', 'ot'),
    makeReadingEntry('OTA', 'o-ta'),
    makeReadingEntry('OTEL', 'o-tel'),
    makeReadingEntry('NOTA', 'no-ta'),
    makeReadingEntry('TON', 'ton'),
    makeReadingEntry('ALO', 'a-lo'),
    makeReadingEntry('LOTO', 'lo-to'),
    makeReadingEntry('OLTA', 'ol-ta'),
    makeReadingEntry('ATOL', 'a-tol'),
    makeReadingEntry('OK', 'ok'),
    makeReadingEntry('KALE', 'ka-le'),
    makeReadingEntry('KOL', 'kol'),
    makeReadingEntry('KOLA', 'ko-la'),
    makeReadingEntry('KEK', 'kek'),
    makeReadingEntry('TOK', 'tok'),
    makeReadingEntry('TOKA', 'to-ka'),
    makeReadingEntry('KOT', 'kot'),
    makeReadingEntry('KOTA', 'ko-ta'),
    makeReadingEntry('İNEK', 'i-nek'),
    makeReadingEntry('ELEK', 'e-lek'),
    makeReadingEntry('LEKE', 'le-ke'),
    makeReadingEntry('TEK', 'tek'),
    makeReadingEntry('TEKNE', 'tek-ne'),
    makeReadingEntry('ETEK', 'e-tek'),
    makeReadingEntry('OKUL', 'o-kul'),
    makeReadingEntry('KULE', 'ku-le'),
    makeReadingEntry('KOKU', 'ko-ku'),
    makeReadingEntry('KUKLA', 'kuk-la'),
    makeReadingEntry('KULAK', 'ku-lak'),
    makeReadingEntry('KUTU', 'ku-tu'),
    makeReadingEntry('UTKU', 'ut-ku'),
    makeReadingEntry('UN', 'un'),
    makeReadingEntry('ULU', 'u-lu'),
    makeReadingEntry('KULU', 'ku-lu'),
    makeReadingEntry('OKU', 'o-ku'),
    makeReadingEntry('OLUK', 'o-luk'),
    makeReadingEntry('KONU', 'ko-nu'),
    makeReadingEntry('KONUK', 'ko-nuk'),
    makeReadingEntry('KAR', 'kar'),
    makeReadingEntry('KURU', 'ku-ru'),
    makeReadingEntry('TUR', 'tur'),
    makeReadingEntry('KURT', 'kurt'),
    makeReadingEntry('KORO', 'ko-ro'),
    makeReadingEntry('KORNA', 'kor-na'),
    makeReadingEntry('TARLA', 'tar-la'),
    makeReadingEntry('TERLİK', 'ter-lik'),
    makeReadingEntry('KARTAL', 'kar-tal'),
    makeReadingEntry('REKOR', 're-kor'),
    makeReadingEntry('TREN', 'tren'),
    makeReadingEntry('ARI', 'a-rı'),
    makeReadingEntry('ILIK', 'ı-lık'),
    makeReadingEntry('ALTI', 'al-tı'),
    makeReadingEntry('ARTI', 'ar-tı'),
    makeReadingEntry('TARTI', 'tar-tı'),
    makeReadingEntry('KATI', 'ka-tı'),
    makeReadingEntry('TAKI', 'ta-kı'),
    makeReadingEntry('ATKI', 'at-kı'),
    makeReadingEntry('TIR', 'tır'),
    makeReadingEntry('KIR', 'kır'),
    makeReadingEntry('ANIT', 'a-nıt'),
    makeReadingEntry('KANIT', 'ka-nıt'),
    makeReadingEntry('KUM', 'kum'),
    makeReadingEntry('ORMAN', 'or-man'),
    makeReadingEntry('ELMA', 'el-ma'),
    makeReadingEntry('MARUL', 'ma-rul'),
    makeReadingEntry('MOLA', 'mo-la'),
    makeReadingEntry('KLİMA', 'kli-ma'),
    makeReadingEntry('ROMAN', 'ro-man'),
    makeReadingEntry('RAKAM', 'ra-kam'),
    makeReadingEntry('KALEM', 'ka-lem'),
    makeReadingEntry('IRMAK', 'ır-mak'),
    makeReadingEntry('MUM', 'mum'),
    makeReadingEntry('LİMON', 'li-mon'),

    // --- 3. GRUP: + Ü, S, Ö, Y, D, Z ---
    makeReadingEntry('ÜTÜ', 'ü-tü'),
    makeReadingEntry('ÜLKE', 'ül-ke'),
    makeReadingEntry('ÜNLÜ', 'ün-lü'),
    makeReadingEntry('KÜL', 'kül'),
    makeReadingEntry('TÜL', 'tül'),
    makeReadingEntry('KÜRE', 'kü-re'),
    makeReadingEntry('KÜREK', 'kü-rek'),
    makeReadingEntry('TÜRK', 'türk'),
    makeReadingEntry('TÜRKÜ', 'tür-kü'),
    makeReadingEntry('KÜTÜK', 'kü-tük'),
    makeReadingEntry('SÜT', 'süt'),
    makeReadingEntry('SES', 'ses'),
    makeReadingEntry('SU', 'su'),
    makeReadingEntry('SÜS', 'süs'),
    makeReadingEntry('MASA', 'ma-sa'),
    makeReadingEntry('SIRA', 'sı-ra'),
    makeReadingEntry('SAAT', 'sa-at'),
    makeReadingEntry('SİMİT', 'si-mit'),
    makeReadingEntry('MISIR', 'mı-sır'),
    makeReadingEntry('ASKI', 'as-kı'),
    makeReadingEntry('KASA', 'ka-sa'),
    makeReadingEntry('ÖRTÜ', 'ör-tü'),
    makeReadingEntry('ÖRNEK', 'ör-nek'),
    makeReadingEntry('KÖK', 'kök'),
    makeReadingEntry('KÖMÜR', 'kö-mür'),
    makeReadingEntry('SÖK', 'sök'),
    makeReadingEntry('KÖRÜK', 'kö-rük'),
    makeReadingEntry('ÖN', 'ön'),
    makeReadingEntry('ÖNLÜK', 'ön-lük'),
    makeReadingEntry('KÖTÜ', 'kö-tü'),
    makeReadingEntry('OYUN', 'o-yun'),
    makeReadingEntry('TÜYLÜ', 'tüy-lü'),
    makeReadingEntry('YILAN', 'yı-lan'),
    makeReadingEntry('ÖYKÜ', 'öy-kü'),
    makeReadingEntry('YAY', 'yay'),
    makeReadingEntry('YOL', 'yol'),
    makeReadingEntry('YEM', 'yem'),
    makeReadingEntry('YÜN', 'yün'),
    makeReadingEntry('KÖY', 'köy'),
    makeReadingEntry('KAYIK', 'ka-yık'),
    makeReadingEntry('LEYLEK', 'ley-lek'),
    makeReadingEntry('ÖRDEK', 'ör-dek'),
    makeReadingEntry('KEDİ', 'ke-di'),
    makeReadingEntry('ODA', 'o-da'),
    makeReadingEntry('DEDE', 'de-de'),
    makeReadingEntry('DERE', 'de-re'),
    makeReadingEntry('DERİ', 'de-ri'),
    makeReadingEntry('DÜDÜK', 'dü-dük'),
    makeReadingEntry('DAMLA', 'dam-la'),
    makeReadingEntry('DONDURMA', 'don-dur-ma'),
    makeReadingEntry('MÜDÜR', 'mü-dür'),
    makeReadingEntry('ÜZÜM', 'ü-züm'),
    makeReadingEntry('YILDIZ', 'yıl-dız'),
    makeReadingEntry('DENİZ', 'de-niz'),
    makeReadingEntry('YAZ', 'yaz'),
    makeReadingEntry('SÖZ', 'söz'),
    makeReadingEntry('DÜZ', 'düz'),
    makeReadingEntry('YÜZ', 'yüz'),
    makeReadingEntry('ZEYTİN', 'zey-tin'),
    makeReadingEntry('ZİL', 'zil'),
    makeReadingEntry('TUZ', 'tuz'),
    makeReadingEntry('KIZAK', 'kı-zak'),

    // --- 4. GRUP: + Ç, B, G, C, Ş ---
    makeReadingEntry('ÇİÇEK', 'çi-çek'),
    makeReadingEntry('ÇANTA', 'çan-ta'),
    makeReadingEntry('ÇİLEK', 'çi-lek'),
    makeReadingEntry('ÇINAR', 'çı-nar'),
    makeReadingEntry('ÇAY', 'çay'),
    makeReadingEntry('ÇATAL', 'ça-tal'),
    makeReadingEntry('ÇADIR', 'ça-dır'),
    makeReadingEntry('UÇAK', 'u-çak'),
    makeReadingEntry('SAÇ', 'saç'),
    makeReadingEntry('ÜÇ', 'üç'),
    makeReadingEntry('BALIK', 'ba-lık'),
    makeReadingEntry('BULUT', 'bu-lut'),
    makeReadingEntry('BEBEK', 'be-bek'),
    makeReadingEntry('BARDAK', 'bar-dak'),
    makeReadingEntry('BAL', 'bal'),
    makeReadingEntry('BALON', 'ba-lon'),
    makeReadingEntry('BAYRAK', 'bay-rak'),
    makeReadingEntry('BİBER', 'bi-ber'),
    makeReadingEntry('KELEBEK', 'ke-le-bek'),
    makeReadingEntry('KABAK', 'ka-bak'),
    makeReadingEntry('GÖL', 'göl'),
    makeReadingEntry('GÖZLÜK', 'göz-lük'),
    makeReadingEntry('GEMİ', 'ge-mi'),
    makeReadingEntry('GÜN', 'gün'),
    makeReadingEntry('GÜL', 'gül'),
    makeReadingEntry('GÖZ', 'göz'),
    makeReadingEntry('GİTAR', 'gi-tar'),
    makeReadingEntry('SİLGİ', 'sil-gi'),
    makeReadingEntry('DERGİ', 'der-gi'),
    makeReadingEntry('GAGALI', 'ga-ga-lı'),
    makeReadingEntry('CAM', 'cam'),
    makeReadingEntry('CEVİZ', 'ce-viz'),
    makeReadingEntry('GECE', 'ge-ce'),
    makeReadingEntry('BACA', 'ba-ca'),
    makeReadingEntry('ÇOCUK', 'ço-cuk'),
    makeReadingEntry('BÖCEK', 'bö-cek'),
    makeReadingEntry('CÜCE', 'cü-ce'),
    makeReadingEntry('CEKET', 'ce-ket'),
    makeReadingEntry('CÜZDAN', 'cüz-dan'),
    makeReadingEntry('BONCUK', 'bon-cuk'),
    makeReadingEntry('GÜNEŞ', 'gü-neş'),
    makeReadingEntry('ŞEKER', 'şe-ker'),
    makeReadingEntry('KUŞ', 'kuş'),
    makeReadingEntry('ŞARKI', 'şar-kı'),
    makeReadingEntry('ŞEMSİYE', 'şem-si-ye'),
    makeReadingEntry('TAŞ', 'taş'),
    makeReadingEntry('KAŞIK', 'ka-şık'),
    makeReadingEntry('BEŞİK', 'be-şik'),
    makeReadingEntry('ŞİŞE', 'şi-şe'),
    makeReadingEntry('GÜMÜŞ', 'gü-müş'),

    // --- 5. GRUP: + P, H, V, Ğ, F, J ---
    makeReadingEntry('PARA', 'pa-ra'),
    makeReadingEntry('PENCERE', 'pen-ce-re'),
    makeReadingEntry('TOP', 'top'),
    makeReadingEntry('KAPI', 'ka-pı'),
    makeReadingEntry('ŞAPKA', 'şap-ka'),
    makeReadingEntry('KİTAP', 'ki-tap'),
    makeReadingEntry('KÖPEK', 'kö-pek'),
    makeReadingEntry('PAPATYA', 'pa-pat-ya'),
    makeReadingEntry('PEMBE', 'pem-be'),
    makeReadingEntry('KÜPE', 'kü-pe'),
    makeReadingEntry('HALI', 'ha-lı'),
    makeReadingEntry('HOROZ', 'ho-roz'),
    makeReadingEntry('BAHÇE', 'bah-çe'),
    makeReadingEntry('SABAH', 'sa-bah'),
    makeReadingEntry('TAHTA', 'tah-ta'),
    makeReadingEntry('NEHİR', 'ne-hir'),
    makeReadingEntry('ŞEHİR', 'şe-hir'),
    makeReadingEntry('HEDİYE', 'he-di-ye'),
    makeReadingEntry('HIZ', 'hız'),
    makeReadingEntry('HİLAL', 'hi-lal'),
    makeReadingEntry('HAVUÇ', 'ha-vuç'),
    makeReadingEntry('VAZO', 'va-zo'),
    makeReadingEntry('VAGON', 'va-gon'),
    makeReadingEntry('VALİZ', 'va-liz'),
    makeReadingEntry('GÜVERCİN', 'gü-ver-cin'),
    makeReadingEntry('TAVUK', 'ta-vuk'),
    makeReadingEntry('TAVŞAN', 'tav-şan'),
    makeReadingEntry('KAVUN', 'ka-vun'),
    makeReadingEntry('AYVA', 'ay-va'),
    makeReadingEntry('EV', 'ev'),
    makeReadingEntry('DAĞ', 'dağ'),
    makeReadingEntry('AĞAÇ', 'a-ğaç'),
    makeReadingEntry('YAĞMUR', 'yağ-mur'),
    makeReadingEntry('PAPAĞAN', 'pa-pa-ğan'),
    makeReadingEntry('SOĞAN', 'so-ğan'),
    makeReadingEntry('BAĞ', 'bağ'),
    makeReadingEntry('KURBAĞA', 'kur-ba-ğa'),
    makeReadingEntry('KAĞIT', 'ka-ğıt'),
    makeReadingEntry('YOĞURT', 'yo-ğurt'),
    makeReadingEntry('İĞNE', 'iğ-ne'),
    makeReadingEntry('FİL', 'fil'),
    makeReadingEntry('FENER', 'fe-ner'),
    makeReadingEntry('FINDIK', 'fın-dık'),
    makeReadingEntry('FARE', 'fa-re'),
    makeReadingEntry('FIRIN', 'fı-rın'),
    makeReadingEntry('FİDAN', 'fi-dan'),
    makeReadingEntry('SINIF', 'sı-nıf'),
    makeReadingEntry('DEFTER', 'def-ter'),
    makeReadingEntry('ZÜRAFA', 'zü-ra-fa'),
    makeReadingEntry('ŞEFTALİ', 'şef-ta-li'),
    makeReadingEntry('JET', 'jet'),
    makeReadingEntry('JÖLE', 'jö-le'),
    makeReadingEntry('PİJAMA', 'pi-ja-ma'),
    makeReadingEntry('JAGUAR', 'ja-gu-ar'),
    makeReadingEntry('BARAJ', 'ba-raj'),
    makeReadingEntry('GARAJ', 'ga-raj'),
    makeReadingEntry('BAGAJ', 'ba-gaj'),
    makeReadingEntry('MESAJ', 'me-saj'),
    makeReadingEntry('PLAJ', 'plaj'),
    makeReadingEntry('JETON', 'je-ton')
  ];

  // 5 SINIF SEVİYESİ VE KONU HAVUZU
  const TURBO_TOPICS = {
    reading1: {
      id: 'reading1',
      tabLabel: '📖 1. Sınıf Okuma',
      badge: '📖 1. Sınıf Dinle & Doğru Kelime Şeridine Geç',
      isListeningPrompt: true,
      questions: []
    },
    addsub12: {
      id: 'addsub12',
      tabLabel: '➕ 1-2. Sınıf Toplama/Çıkarma',
      badge: '➕ 1-2. Sınıf Hızlı İşlem Otobanı',
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
        { promptText: '27 + 8 = ?', spokenText: 'Yirmi yedi artı sekiz kaç eder?', answer: '35', distractors: ['33', '37'] },
        { promptText: '36 - 14 = ?', spokenText: 'Otuz altı eksi on dört kaç eder?', answer: '22', distractors: ['20', '24'] },
        { promptText: '16 + 16 = ?', spokenText: 'On altı artı on altı kaç eder?', answer: '32', distractors: ['30', '34'] }
      ]
    },
    mult24: {
      id: 'mult24',
      tabLabel: '✖️ 2-4. Sınıf Çarpma',
      badge: '✖️ 2-4. Sınıf Çarpım Tablosu Otobanı',
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
        { promptText: '8 × 8 = ?', spokenText: 'Sekiz kere sekiz kaç eder?', answer: '64', distractors: ['56', '72'] },
        { promptText: '7 × 7 = ?', spokenText: 'Yedi kere yedi kaç eder?', answer: '49', distractors: ['42', '56'] },
        { promptText: '6 × 6 = ?', spokenText: 'Altı kere altı kaç eder?', answer: '36', distractors: ['30', '42'] }
      ]
    },
    clock23: {
      id: 'clock23',
      tabLabel: '🕒 2-3. Sınıf Saatler',
      badge: '🕒 2-3. Sınıf Dijital Saat Otobanı',
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
        { promptText: 'Beşi çeyrek geçiyor', spokenText: 'Beşi çeyrek geçiyor', answer: '05:15', distractors: ['04:45', '05:30'] },
        { promptText: 'On ikiye çeyrek var', spokenText: 'On ikiye çeyrek var', answer: '11:45', distractors: ['12:15', '12:45'] },
        { promptText: 'Saat bir buçuk', spokenText: 'Saat bir buçuk', answer: '01:30', distractors: ['01:15', '01:00'] }
      ]
    },
    fractions34: {
      id: 'fractions34',
      tabLabel: '🍕 3-4. Sınıf Kesirler',
      badge: '🍕 3-4. Sınıf Kesir Otobanı',
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
        { promptText: 'Sekizde üç', spokenText: 'Sekizde üç', answer: '3/8', distractors: ['5/8', '8/3'] },
        { promptText: 'Dokuz bölü beş', spokenText: 'Dokuz bölü beş', answer: '9/5', distractors: ['5/9', '4/5'] },
        { promptText: 'Onda yedi', spokenText: 'Onda yedi', answer: '7/10', distractors: ['3/10', '10/7'] }
      ]
    }
  };

  // OYUN DURUMU
  const state = {
    isOpen: false,
    activeTopicId: 'reading1',
    activeLetterGroupId: 'g1',
    activeLetterFilter: 'ALL',
    bagByTopic: {},
    currentQuestion: null,
    gateOptions: ['A', 'B', 'C'], // 0: Sol şerit, 1: Orta şerit, 2: Sağ şerit
    correctLane: 1,
    carLane: 1,                  // Hedef şerit (0, 1, 2)
    carVisualX: 0.5,             // Yumuşak geçiş için 0..1 arası normalize X
    carForwardBoostY: 0,         // Turbo sırasında ileri atılma ofseti
    gateY: -90,                  // Kapının Y konumu (Canvas yüksekliğine göre)
    gateEvaluated: false,
    gateResultType: null,        // 'correct' | 'wrong' | null
    gateHitLane: -1,
    finishLineActive: false,     // 8 doğruya ulaşıldığında damalı bitiş çizgisi
    finishLineY: -120,
    turboActiveUntil: 0,         // 🔥 TURBO butonu veya doğru kapı alev süresi
    flashGreenAlpha: 0,
    flashRedAlpha: 0,
    shakeFrames: 0,
    roadOffset: 0,
    sceneryItems: [],
    correctCount: 0,
    lives: MAX_LIVES,
    elapsedSeconds: 0,
    clockTimer: null,
    speakTimer: null,
    animFrameId: null,
    lastFrameTs: 0,
    gameOverType: null,          // 'win' | 'lose' | null
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
    const singleSize = wholeCount > 1 ? Math.round((pieSizePx || 145) * 0.76) : (pieSizePx || 145);

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

  function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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

  // Şerit değiştirme hafif swoosh sesi
  function playLaneSwitchSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.07);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.085);
    } catch (e) {}
  }

  // 🔥 TURBO Motor Kükreme Sesi
  function playTurboBoostSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.32);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {}
  }

  // Doğru kapıdan geçiş: Motor + Alkış + Zafer Notaları
  function playCorrectGateSound(isGrandFinish) {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = isGrandFinish
        ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
        : [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.065);
        gain.gain.setValueAtTime(0.001, now + idx * 0.065);
        gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.065 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.065 + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.065);
        osc.stop(now + idx * 0.065 + 0.34);
      });

      const clapCount = isGrandFinish ? 10 : 5;
      for (let i = 0; i < clapCount; i++) {
        const start = now + 0.04 + i * 0.075;
        const bufLen = Math.floor(ctx.sampleRate * 0.05);
        const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let k = 0; k < bufLen; k++) {
          data[k] = (Math.random() * 2 - 1) * Math.exp(-k / (bufLen * 0.25));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200 + Math.random() * 500, start);
        const clapGain = ctx.createGain();
        clapGain.gain.setValueAtTime(0.14, start);
        clapGain.gain.exponentialRampToValueAtTime(0.001, start + 0.05);
        noise.connect(filter);
        filter.connect(clapGain);
        clapGain.connect(ctx.destination);
        noise.start(start);
        noise.stop(start + 0.055);
      }
    } catch (e) {}
  }

  // Yanlış kapıdan geçiş: Fren / Çarpma Sesi
  function playWrongCrashSound() {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(185, now);
      osc.frequency.exponentialRampToValueAtTime(92, now + 0.28);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.31);
    } catch (e) {}
  }

  function launchTurboConfetti() {
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

    const colors = ['#F59E0B', '#10B981', '#EF4444', '#0EA5E9', '#FACC15', '#EC4899'];
    const cx = canvas.width * 0.55;
    const cy = canvas.height * 0.45;
    const particles = Array.from({ length: 105 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 11;
      return {
        x: cx + (Math.random() - 0.5) * 140,
        y: cy + (Math.random() - 0.5) * 70,
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
        p.life -= 0.012;
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
      if (alive && frame < 115) {
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

  function initScenery() {
    const types = ['tree', 'house', 'pine', 'tree', 'house', 'bush'];
    const houseColors = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];
    const items = [];
    for (let i = 0; i < 8; i++) {
      items.push({
        side: 'left',
        yRatio: i / 8,
        type: types[i % types.length],
        roofColor: houseColors[i % houseColors.length]
      });
      items.push({
        side: 'right',
        yRatio: ((i / 8) + 0.06) % 1,
        type: types[(i + 2) % types.length],
        roofColor: houseColors[(i + 3) % houseColors.length]
      });
    }
    state.sceneryItems = items;
  }

  function toTurkishUpper(str) {
    return String(str || '').toLocaleUpperCase('tr-TR');
  }

  function wordContainsLetter(word, letter) {
    if (!letter || letter === 'ALL') return true;
    return toTurkishUpper(word).includes(toTurkishUpper(letter));
  }

  function isWordStrictlyAllowed(word, allowedSet) {
    const upper = toTurkishUpper(word);
    if (!upper) return false;
    for (let i = 0; i < upper.length; i++) {
      if (!allowedSet.has(upper[i])) return false;
    }
    return true;
  }

  function getCumulativeAllowedSet(groupId, letterFilter) {
    const grpObj = READING1_LETTER_GROUPS.find((g) => g.id === groupId) || READING1_LETTER_GROUPS[0];
    const cutoffLetter =
      letterFilter && letterFilter !== 'ALL'
        ? toTurkishUpper(letterFilter)
        : toTurkishUpper(grpObj.lastLetter || 'L');
    const cutoffIdx = MEB_ORDER.indexOf(cutoffLetter);
    const maxIdx = cutoffIdx >= 0 ? cutoffIdx : MEB_ORDER.length - 1;
    return new Set(MEB_ORDER.slice(0, maxIdx + 1));
  }

  function buildDynamicReading1Questions() {
    const grp = state.activeLetterGroupId || 'g1';
    const letter = state.activeLetterFilter || 'ALL';
    const allowedSet = getCumulativeAllowedSet(grp, letter);

    const cumulativeEntries = READING1_MASTER_WORDS.filter((it) =>
      isWordStrictlyAllowed(it.word, allowedSet)
    );

    let targetEntries = [];
    if (letter !== 'ALL') {
      const targetUpper = toTurkishUpper(letter);
      targetEntries = cumulativeEntries.filter((it) =>
        wordContainsLetter(it.word, targetUpper)
      );
    } else {
      const grpObj = READING1_LETTER_GROUPS.find((g) => g.id === grp) || READING1_LETTER_GROUPS[0];
      const grpSet = new Set(grpObj.letters.map((l) => toTurkishUpper(l)));
      targetEntries = cumulativeEntries.filter((it) => {
        const w = toTurkishUpper(it.word);
        for (let i = 0; i < w.length; i++) {
          if (grpSet.has(w[i])) return true;
        }
        return false;
      });
    }

    if (targetEntries.length < 3) {
      targetEntries = cumulativeEntries.slice();
    }

    const allCandidateWords = targetEntries.map((it) => it.word);
    return targetEntries.map((entry) => {
      const others = shuffleArray(allCandidateWords.filter((w) => w !== entry.word));
      const d1 = others[0] || 'AN';
      const d2 = others[1] || 'ANA';
      return {
        promptText: '🎧 Dinle ve Doğru Şeritten Geç!',
        spokenText: entry.spokenText,
        answer: entry.word,
        distractors: [d1, d2]
      };
    });
  }

  function getActiveTopicQuestions(topicId) {
    const topic = TURBO_TOPICS[topicId] || TURBO_TOPICS.reading1;
    if (topicId === 'reading1') {
      return buildDynamicReading1Questions();
    }
    return topic.questions;
  }

  function drawNextQuestionFromBag(topicId) {
    const pool = getActiveTopicQuestions(topicId);
    const bagKey = topicId === 'reading1'
      ? `reading1_${state.activeLetterGroupId}_${state.activeLetterFilter}`
      : topicId;
    let bag = state.bagByTopic[bagKey];
    if (!bag || bag.length === 0) {
      bag = shuffleArray(pool.map((_, idx) => idx));
      state.bagByTopic[bagKey] = bag;
    }
    const qIdx = bag.pop();
    return pool[qIdx] || pool[0];
  }

  function spawnNextGate(autoSpeak) {
    if (state.finishLineActive || state.gameOverType) return;

    const q = drawNextQuestionFromBag(state.activeTopicId);
    state.currentQuestion = q;

    const choices = shuffleArray([q.answer, q.distractors[0], q.distractors[1]]);
    state.gateOptions = choices;
    state.correctLane = choices.indexOf(q.answer);
    state.gateY = -75;
    state.gateEvaluated = false;
    state.gateResultType = null;
    state.gateHitLane = -1;

    renderTargetQuestionPanel();

    if (autoSpeak) {
      state.speakTimer = setTimeout(() => {
        if (state.isOpen && !state.gameOverType && state.currentQuestion) {
          speakText(state.currentQuestion.spokenText);
        }
      }, 150);
    }
  }

  function updateHudBar() {
    const correctEl = document.getElementById('moliTurboHudCorrect');
    const livesEl = document.getElementById('moliTurboHudLives');
    const timeEl = document.getElementById('moliTurboHudTime');

    if (correctEl) {
      correctEl.innerHTML = `✅ Doğru: <strong>${state.correctCount} / ${TARGET_CORRECT}</strong>`;
    }
    if (livesEl) {
      const fullHearts = '❤️'.repeat(Math.max(0, state.lives));
      const emptyHearts = '🖤'.repeat(Math.max(0, MAX_LIVES - state.lives));
      livesEl.innerHTML = `${fullHearts}${emptyHearts} <span>(${state.lives} Can)</span>`;
    }
    if (timeEl) {
      timeEl.innerHTML = `⏱️ Süre: <strong>${formatDuration(state.elapsedSeconds)}</strong>`;
    }
  }

  function renderTargetQuestionPanel() {
    const panel = document.getElementById('moliTurboQuestionBox');
    if (!panel || !state.currentQuestion) return;

    const topic = TURBO_TOPICS[state.activeTopicId] || TURBO_TOPICS.reading1;
    const q = state.currentQuestion;

    panel.innerHTML = `
      <div class="mtr-topic-badge">${escapeHtml(topic.badge)}</div>
      <div class="mtr-moli-coach-row">
        <img src="assets/mascot/moli.webp" class="mtr-moli-avatar" alt="Pilot Moli" width="73" height="73">
        <div class="mtr-coach-tip">
          ${topic.isListeningPrompt
            ? 'Sesi dinle, doğru kelimenin olduğu şeride dokun!'
            : 'Doğru cevabın olduğu şeride dokun veya ok tuşlarıyla geç!'}
        </div>
      </div>

      <div class="mtr-target-display ${topic.isListeningPrompt ? 'is-listening-mode' : ''}">
        <div class="mtr-target-label">🎯 HEDEF SORU / KELİME</div>
        ${state.activeTopicId === 'clock23'
          ? `
            ${buildAnalogClockSvg(q.answer, 170)}
            <div class="mtr-target-value" style="font-size:clamp(1.25rem,2vw,1.65rem);margin-top:4px;">${escapeHtml(q.promptText)}</div>
          `
          : (state.activeTopicId === 'fractions34'
            ? `
              ${buildFractionModelSvg(q.answer, 145)}
              <div class="mtr-target-value" style="font-size:clamp(1.25rem,2vw,1.65rem);margin-top:4px;">${escapeHtml(q.promptText)}</div>
            `
            : `<div class="mtr-target-value">${escapeHtml(q.promptText)}</div>`
          )
        }
      </div>

      <button class="mtr-listen-btn" id="moliTurboListenBtn" type="button">
        <span aria-hidden="true">🔊</span>
        <span>Dinle</span>
      </button>

      <div class="mtr-lane-quick-btns" aria-label="Şerit Seçim Butonları">
        <button class="mtr-lane-btn ${state.carLane === 0 ? 'is-selected' : ''}" type="button" data-pick-lane="0">⬅️ 1. Şerit</button>
        <button class="mtr-lane-btn ${state.carLane === 1 ? 'is-selected' : ''}" type="button" data-pick-lane="1">⬆️ 2. Şerit</button>
        <button class="mtr-lane-btn ${state.carLane === 2 ? 'is-selected' : ''}" type="button" data-pick-lane="2">➡️ 3. Şerit</button>
      </div>
    `;

    const listenBtn = document.getElementById('moliTurboListenBtn');
    if (listenBtn) {
      listenBtn.addEventListener('click', () => {
        if (state.currentQuestion) {
          speakText(state.currentQuestion.spokenText);
        }
      });
    }

    panel.querySelectorAll('[data-pick-lane]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const lane = parseInt(btn.getAttribute('data-pick-lane'), 10);
        setCarLane(lane);
      });
    });
  }

  function syncLaneQuickButtons() {
    document.querySelectorAll(`#${MODAL_ID} [data-pick-lane]`).forEach((btn) => {
      const lane = parseInt(btn.getAttribute('data-pick-lane'), 10);
      btn.classList.toggle('is-selected', lane === state.carLane);
    });
  }

  function setCarLane(newLane) {
    if (!state.isOpen || state.gameOverType) return;
    const clamped = Math.max(0, Math.min(2, newLane));
    if (clamped !== state.carLane) {
      state.carLane = clamped;
      playLaneSwitchSound();
      syncLaneQuickButtons();
    }
  }

  function triggerTurboButton() {
    if (!state.isOpen || state.gameOverType || state.finishLineActive) return;
    state.turboActiveUntil = performance.now() + 950;
    playTurboBoostSound();

    const turboBtn = document.getElementById('moliTurboBoostBtn');
    if (turboBtn) {
      turboBtn.classList.add('is-boosting');
      setTimeout(() => turboBtn.classList.remove('is-boosting'), 750);
    }
  }

  function renderSingleLettersRow() {
    const row = document.getElementById('moliTurboSingleLettersRow');
    if (!row) return;
    const grpObj = READING1_LETTER_GROUPS.find((g) => g.id === state.activeLetterGroupId) || READING1_LETTER_GROUPS[0];
    const allActive = state.activeLetterFilter === 'ALL';

    const btns = [
      `<button class="mtr-single-letter-btn ${allActive ? 'is-active' : ''}" type="button" data-letter="ALL" aria-pressed="${allActive ? 'true' : 'false'}">🌟 Tümü</button>`
    ].concat(
      grpObj.letters.map((l) => {
        const active = state.activeLetterFilter === l;
        return `<button class="mtr-single-letter-btn ${active ? 'is-active' : ''}" type="button" data-letter="${escapeHtml(l)}" aria-pressed="${active ? 'true' : 'false'}">${escapeHtml(l)}</button>`;
      })
    );

    row.innerHTML = `<span class="mtr-letter-group-label">🎯 Harf Seç:</span>${btns.join('')}`;
    row.querySelectorAll('.mtr-single-letter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const letter = btn.getAttribute('data-letter') || 'ALL';
        switchSingleLetterFilter(letter);
      });
    });
  }

  function syncLetterGroupsBarUI() {
    const wrap = document.getElementById('moliTurboReadingSelectorWrap');
    if (wrap) {
      wrap.style.display = state.activeTopicId === 'reading1' ? 'flex' : 'none';
    }
    document.querySelectorAll(`#${MODAL_ID} .mtr-letter-group-btn`).forEach((btn) => {
      const active = btn.getAttribute('data-group-id') === state.activeLetterGroupId;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    renderSingleLettersRow();
  }

  function switchSingleLetterFilter(letter) {
    state.activeLetterFilter = letter || 'ALL';
    state.bagByTopic[`reading1_${state.activeLetterGroupId}_${state.activeLetterFilter}`] = [];
    syncLetterGroupsBarUI();
    startNewRace('reading1');
  }

  function switchLetterGroup(groupId) {
    if (!READING1_LETTER_GROUPS.some((g) => g.id === groupId)) return;
    state.activeLetterGroupId = groupId;
    state.activeLetterFilter = 'ALL';
    state.bagByTopic[`reading1_${groupId}_ALL`] = [];
    syncLetterGroupsBarUI();
    startNewRace('reading1');
  }

  function startNewRace(topicId) {
    if (topicId && TURBO_TOPICS[topicId]) {
      state.activeTopicId = topicId;
    }

    stopVoice();
    if (state.clockTimer) clearInterval(state.clockTimer);

    state.correctCount = 0;
    state.lives = MAX_LIVES;
    state.elapsedSeconds = 0;
    state.carLane = 1;
    state.carVisualX = 0.5;
    state.carForwardBoostY = 0;
    state.finishLineActive = false;
    state.finishLineY = -120;
    state.turboActiveUntil = 0;
    state.flashGreenAlpha = 0;
    state.flashRedAlpha = 0;
    state.shakeFrames = 0;
    state.gameOverType = null;

    initScenery();
    updateHudBar();
    renderOverlayModal();

    document.querySelectorAll(`#${MODAL_ID} .mtr-topic-tab`).forEach((btn) => {
      const active = btn.getAttribute('data-topic-id') === state.activeTopicId;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    syncLetterGroupsBarUI();
    spawnNextGate(true);

    state.clockTimer = setInterval(() => {
      if (state.isOpen && !state.gameOverType) {
        state.elapsedSeconds += 1;
        updateHudBar();
      }
    }, 1000);

    if (!state.animFrameId) {
      state.lastFrameTs = performance.now();
      state.animFrameId = requestAnimationFrame(gameLoop);
    }
  }

  function evaluateGateCrossing() {
    if (state.gateEvaluated || state.gameOverType) return;
    state.gateEvaluated = true;
    state.gateHitLane = state.carLane;

    const isCorrect = state.carLane === state.correctLane;
    if (isCorrect) {
      state.gateResultType = 'correct';
      state.correctCount += 1;
      state.flashGreenAlpha = 0.45;
      // Doğru kapıdan geçince araba alev efektiyle ileri fırlasın
      state.turboActiveUntil = performance.now() + 900;
      updateHudBar();

      const reachedTarget = state.correctCount >= TARGET_CORRECT;
      playCorrectGateSound(reachedTarget);

      if (reachedTarget) {
        // 8 doğruya ulaşıldı -> Damalı Bitiş Çizgisi gelsin!
        state.finishLineActive = true;
        state.finishLineY = -110;
      }
    } else {
      state.gateResultType = 'wrong';
      state.lives = Math.max(0, state.lives - 1);
      state.flashRedAlpha = 0.5;
      state.shakeFrames = 18;
      playWrongCrashSound();
      updateHudBar();

      if (state.lives <= 0) {
        state.gameOverType = 'lose';
        setTimeout(() => {
          renderOverlayModal();
          speakText('Canların bitti ama harika yarıştın! Tekrar denemeye ne dersin?');
        }, 450);
      }
    }
  }

  function onFinishLineCrossed() {
    if (state.gameOverType === 'win') return;
    state.gameOverType = 'win';
    playCorrectGateSound(true);
    launchTurboConfetti();
    renderOverlayModal();
    speakText('Şampiyon! Sekiz soruyu da doğru bildin ve yarışı kazandın!');
  }

  function renderOverlayModal() {
    const overlay = document.getElementById('moliTurboEndOverlay');
    if (!overlay) return;

    if (!state.gameOverType) {
      overlay.className = 'mtr-end-overlay';
      overlay.innerHTML = '';
      return;
    }

    const isWin = state.gameOverType === 'win';
    overlay.className = `mtr-end-overlay is-open ${isWin ? 'is-win' : 'is-lose'}`;
    overlay.innerHTML = `
      <div class="mtr-end-card">
        <div class="mtr-end-icon" aria-hidden="true">${isWin ? '🏆🏁🏎️' : '🛠️🏎️'}</div>
        <h3 class="mtr-end-title">
          ${isWin ? '🏆 ŞAMPİYON! Yarışı Kazandın!' : '⛽ Yarış Tamamlandı!'}
        </h3>
        <p class="mtr-end-desc">
          ${isWin
            ? `Tebrikler! <strong>${TARGET_CORRECT}/${TARGET_CORRECT}</strong> doğru kapıdan geçerek damalı bayrağa ulaştın!`
            : `Toplam <strong>${state.correctCount} / ${TARGET_CORRECT}</strong> doğru kapıdan geçtin. Hemen yeni yarışa başlayabilirsin!`}
        </p>
        <div class="mtr-end-stats">
          <span>✅ Doğru: <strong>${state.correctCount}/${TARGET_CORRECT}</strong></span>
          <span>⏱️ Süre: <strong>${formatDuration(state.elapsedSeconds)}</strong></span>
        </div>
        <div class="mtr-end-actions">
          <button class="mtr-btn-replay" id="moliTurboReplayBtn" type="button">🔄 Tekrar Yarış</button>
          <button class="mtr-btn-exit" id="moliTurboExitBtn" type="button">✕ Kapat</button>
        </div>
      </div>
    `;

    document.getElementById('moliTurboReplayBtn').addEventListener('click', () => startNewRace());
    document.getElementById('moliTurboExitBtn').addEventListener('click', closeTurboRacer);
  }

  // HTML5 CANVAS OTOBAN, AĞAÇLAR/EVLER, KAPILAR, BİTİŞ ÇİZGİSİ VE TURBO ARABA ÇİZİMİ
  function gameLoop(ts) {
    if (!state.isOpen) {
      state.animFrameId = null;
      return;
    }

    const dt = Math.min(0.05, Math.max(0.008, (ts - state.lastFrameTs) / 1000));
    state.lastFrameTs = ts;

    updatePhysics(dt, ts);
    drawHighwayCanvas(ts);

    state.animFrameId = requestAnimationFrame(gameLoop);
  }

  function updatePhysics(dt, nowTs) {
    if (state.gameOverType) return;

    const canvas = document.getElementById('moliTurboCanvas');
    const h = canvas ? (canvas.clientHeight || 540) : 540;
    const carBaseY = h - 105;

    const isTurboTime = nowTs < state.turboActiveUntil;
    const isCorrectLane = state.carLane === state.correctLane;
    // Araba doğru şeritteyken TURBO basılırsa veya doğru kapıdan geçildiyse hızlanır
    const turboMultiplier = isTurboTime ? (isCorrectLane || state.gateEvaluated ? 2.25 : 1.55) : 1;

    // İlkokul seviyesine uygun, çocukların rahatça okuyup karar verebileceği hız
    const baseGateSpeed = h * 0.21; // ~5 saniyede yukarıdan arabaya ulaşır
    const gateSpeed = baseGateSpeed * turboMultiplier;
    const roadSpeed = 195 * turboMultiplier;

    state.roadOffset = (state.roadOffset + roadSpeed * dt) % 80;

    // Yanlardaki ağaçlar ve evler aşağı doğru aksın
    const scenerySpeed = (roadSpeed / h) * dt;
    for (let i = 0; i < state.sceneryItems.length; i++) {
      state.sceneryItems[i].yRatio = (state.sceneryItems[i].yRatio + scenerySpeed) % 1;
    }

    // Arabanın yatay şerit kayması (yumuşak interpolasyon)
    const targetNormX = (state.carLane + 0.5) / 3;
    state.carVisualX += (targetNormX - state.carVisualX) * Math.min(1, dt * 13);

    // Turbo ileri atılma efekti
    const targetBoostY = isTurboTime ? -24 : 0;
    state.carForwardBoostY += (targetBoostY - state.carForwardBoostY) * Math.min(1, dt * 10);

    // Parlama ve sarsıntı sönümlemesi
    if (state.flashGreenAlpha > 0) state.flashGreenAlpha = Math.max(0, state.flashGreenAlpha - dt * 1.1);
    if (state.flashRedAlpha > 0) state.flashRedAlpha = Math.max(0, state.flashRedAlpha - dt * 1.1);
    if (state.shakeFrames > 0) state.shakeFrames -= 1;

    // 8 Doğru tamamlandıysa Damalı Bitiş Çizgisi arabaya doğru gelsin
    if (state.finishLineActive) {
      state.finishLineY += baseGateSpeed * 1.85 * dt;
      if (state.finishLineY >= carBaseY - 25) {
        onFinishLineCrossed();
      }
      return;
    }

    // Cevap Kapısı Hareketi
    state.gateY += gateSpeed * dt;

    // Kapı arabaya ulaştı mı?
    const triggerY = carBaseY - 38;
    if (!state.gateEvaluated && state.gateY >= triggerY) {
      evaluateGateCrossing();
    }

    // Kapı ekranın altından çıktıysa yeni soru kapısını gönder
    if (state.gateY > h + 75 && !state.finishLineActive && !state.gameOverType) {
      spawnNextGate(true);
    }
  }

  function drawHighwayCanvas(nowTs) {
    const canvas = document.getElementById('moliTurboCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth || 640;
    const cssH = canvas.clientHeight || 540;
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Yanlış kapıda kırmızı titreme efekti
    if (state.shakeFrames > 0) {
      const dx = (Math.random() - 0.5) * 12;
      const dy = (Math.random() - 0.5) * 8;
      ctx.translate(dx, dy);
    }

    // 1) ÇİM KENARLAR (SOL VE SAĞ YEŞİL ALAN)
    ctx.fillStyle = '#15803D';
    ctx.fillRect(0, 0, cssW, cssH);

    const sideMargin = Math.max(46, Math.min(92, cssW * 0.13));
    const roadX = sideMargin;
    const roadW = cssW - sideMargin * 2;
    const laneW = roadW / 3;

    // Çim şerit dokusu
    ctx.fillStyle = '#166534';
    for (let y = -80 + (state.roadOffset % 80); y < cssH; y += 80) {
      ctx.fillRect(0, y, sideMargin, 38);
      ctx.fillRect(roadX + roadW, y, sideMargin, 38);
    }

    // 2) YANLARDA AKAN AĞAÇLAR VE EVLER
    drawSideScenery(ctx, cssW, cssH, sideMargin, roadX + roadW);

    // 3) ASFALT OTOBAN VE KIRMIZI-BEYAZ BORDÜRLER
    ctx.fillStyle = '#334155';
    ctx.fillRect(roadX, 0, roadW, cssH);

    // Yol kenarı kırmızı-beyaz yarış bordürleri
    const curbW = 10;
    for (let y = -40 + (state.roadOffset % 40); y < cssH; y += 40) {
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(roadX - curbW, y, curbW, 20);
      ctx.fillRect(roadX + roadW, y, curbW, 20);
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(roadX - curbW, y + 20, curbW, 20);
      ctx.fillRect(roadX + roadW, y + 20, curbW, 20);
    }

    // Şerit numarası filigranları (Öğrencinin kolayca dokunması için)
    ctx.save();
    ctx.font = '800 15px "Fredoka", "Nunito", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
    ctx.textAlign = 'center';
    for (let lane = 0; lane < 3; lane++) {
      const lx = roadX + lane * laneW + laneW / 2;
      ctx.fillText(`${lane + 1}. ŞERİT`, lx, cssH - 16);
    }
    ctx.restore();

    // 3 Şerit Ayırıcı Kesikli Beyaz Çizgiler
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.lineWidth = 5;
    ctx.setLineDash([32, 28]);
    ctx.lineDashOffset = -state.roadOffset;
    for (let i = 1; i <= 2; i++) {
      const dividerX = roadX + laneW * i;
      ctx.beginPath();
      ctx.moveTo(dividerX, 0);
      ctx.lineTo(dividerX, cssH);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 4) DAMALI BİTİŞ ÇİZGİSİ VEYA 3 ŞERİTLİ CEVAP KAPISI
    if (state.finishLineActive) {
      drawCheckeredFinishLine(ctx, roadX, roadW, state.finishLineY);
    } else {
      drawAnswerGates(ctx, roadX, laneW, state.gateY);
    }

    // 5) %30 BÜYÜTÜLMÜŞ SARI/TURUNCU YARIŞ ARABASI + TURBO ALEV EFEKTİ
    const carCenterX = roadX + state.carVisualX * roadW;
    const carCenterY = cssH - 122 + state.carForwardBoostY;
    const isTurbo = nowTs < state.turboActiveUntil;
    drawRaceCar(ctx, carCenterX, carCenterY, isTurbo);

    // 6) DOĞRU (YEŞİL PARILTI) / YANLIŞ (KIRMIZI FLAŞ) EKRAN EFEKTLERİ
    if (state.flashGreenAlpha > 0) {
      ctx.fillStyle = `rgba(34, 197, 94, ${state.flashGreenAlpha})`;
      ctx.fillRect(0, 0, cssW, cssH);
    }
    if (state.flashRedAlpha > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${state.flashRedAlpha})`;
      ctx.fillRect(0, 0, cssW, cssH);
    }

    ctx.restore();
  }

  function drawSideScenery(ctx, cssW, cssH, leftWidth, rightStart) {
    for (let i = 0; i < state.sceneryItems.length; i++) {
      const item = state.sceneryItems[i];
      const y = item.yRatio * (cssH + 90) - 45;
      const cx = item.side === 'left' ? leftWidth * 0.46 : rightStart + (cssW - rightStart) * 0.54;

      ctx.save();
      ctx.translate(cx, y);

      if (item.type === 'house') {
        // Şirin Ev
        ctx.fillStyle = '#FEF3C7';
        ctx.fillRect(-16, -8, 32, 24);
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 2;
        ctx.strokeRect(-16, -8, 32, 24);
        // Çatı
        ctx.beginPath();
        ctx.moveTo(-20, -8);
        ctx.lineTo(0, -24);
        ctx.lineTo(20, -8);
        ctx.closePath();
        ctx.fillStyle = item.roofColor || '#EF4444';
        ctx.fill();
        // Kapı & Pencere
        ctx.fillStyle = '#78350F';
        ctx.fillRect(-4, 4, 8, 12);
        ctx.fillStyle = '#38BDF8';
        ctx.fillRect(-12, -3, 6, 6);
        ctx.fillRect(6, -3, 6, 6);
      } else if (item.type === 'pine') {
        // Çam Ağacı
        ctx.fillStyle = '#78350F';
        ctx.fillRect(-4, 8, 8, 12);
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.moveTo(0, -22);
        ctx.lineTo(-17, 10);
        ctx.lineTo(17, 10);
        ctx.closePath();
        ctx.fill();
      } else {
        // Yuvarlak Yeşil Ağaç
        ctx.fillStyle = '#78350F';
        ctx.fillRect(-4, 6, 8, 13);
        ctx.beginPath();
        ctx.arc(0, -4, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#4ADE80';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-5, -8, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#86EFAC';
        ctx.fill();
      }

      ctx.restore();
    }
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawAnswerGates(ctx, roadX, laneW, gateY) {
    const gateH = 96;
    for (let lane = 0; lane < 3; lane++) {
      const pad = 10;
      const gx = roadX + lane * laneW + pad;
      const gw = laneW - pad * 2;
      const gy = gateY - gateH / 2;
      const text = String(state.gateOptions[lane] || '');

      let bgGradTop = '#FFFFFF';
      let bgGradBot = '#FEF9C3';
      let borderCol = '#F59E0B';
      let textCol = '#0F172A';

      if (state.gateEvaluated && lane === state.gateHitLane) {
        if (state.gateResultType === 'correct') {
          bgGradTop = '#DCFCE7';
          bgGradBot = '#86EFAC';
          borderCol = '#16A34A';
          textCol = '#14532D';
        } else if (state.gateResultType === 'wrong') {
          bgGradTop = '#FEE2E2';
          bgGradBot = '#FCA5A5';
          borderCol = '#DC2626';
          textCol = '#7F1D1D';
        }
      }

      ctx.save();
      // Kapı Gölgesi
      ctx.shadowColor = 'rgba(15, 23, 42, 0.45)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 7;

      const grad = ctx.createLinearGradient(gx, gy, gx, gy + gateH);
      grad.addColorStop(0, bgGradTop);
      grad.addColorStop(1, bgGradBot);

      drawRoundedRect(ctx, gx, gy, gw, gateH, 20);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = borderCol;
      ctx.stroke();
      ctx.restore();

      // Kapı Üst Şerit Numarası Küçük Etiket
      ctx.save();
      ctx.font = '800 14px "Nunito", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'center';
      ctx.fillText(`${lane + 1}. Şerit`, gx + gw / 2, gy + 20);

      // %30 Büyütülmüş Okunaklı Cevap Metni
      let fontSize = 35;
      if (text.length >= 6) fontSize = 28;
      if (text.length >= 8) fontSize = 24;
      ctx.font = `900 ${fontSize}px "Fredoka", "Nunito", sans-serif`;
      ctx.fillStyle = textCol;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, gx + gw / 2, gy + gateH / 2 + 8);
      ctx.restore();
    }
  }

  function drawCheckeredFinishLine(ctx, roadX, roadW, finishY) {
    const rows = 3;
    const cols = 12;
    const cellW = roadW / cols;
    const cellH = 26;
    const startY = finishY - (rows * cellH) / 2;

    ctx.save();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#FFFFFF' : '#0F172A';
        ctx.fillRect(roadX + c * cellW, startY + r * cellH, cellW + 0.5, cellH + 0.5);
      }
    }
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 5;
    ctx.strokeRect(roadX, startY, roadW, rows * cellH);

    // BİTİŞ yazısı
    ctx.fillStyle = '#FACC15';
    ctx.font = '900 26px "Fredoka", "Nunito", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏁 BİTİŞ ÇİZGİSİ 🏁', roadX + roadW / 2, startY - 14);
    ctx.restore();
  }

  function drawRaceCar(ctx, cx, cy, isTurbo) {
    const carW = 76;
    const carH = 125;

    ctx.save();
    ctx.translate(cx, cy);

    // 🔥 TURBO ALEV EFEKTİ (Arabanın arkasından çıkan ikili egzoz alevi)
    if (isTurbo) {
      const flicker = 22 + Math.random() * 24;
      [-16, 16].forEach((offsetX) => {
        ctx.beginPath();
        ctx.moveTo(offsetX - 10, carH / 2 - 4);
        ctx.lineTo(offsetX, carH / 2 + flicker + 18);
        ctx.lineTo(offsetX + 10, carH / 2 - 4);
        ctx.closePath();
        ctx.fillStyle = '#EF4444';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(offsetX - 5, carH / 2 - 4);
        ctx.lineTo(offsetX, carH / 2 + flicker);
        ctx.lineTo(offsetX + 5, carH / 2 - 4);
        ctx.closePath();
        ctx.fillStyle = '#FACC15';
        ctx.fill();
      });
    }

    // Tekerlekler (4 adet siyah lastik)
    ctx.fillStyle = '#0F172A';
    drawRoundedRect(ctx, -carW / 2 - 8, -carH / 2 + 16, 10, 28, 5);
    ctx.fill();
    drawRoundedRect(ctx, carW / 2 - 2, -carH / 2 + 16, 10, 28, 5);
    ctx.fill();
    drawRoundedRect(ctx, -carW / 2 - 8, carH / 2 - 44, 10, 28, 5);
    ctx.fill();
    drawRoundedRect(ctx, carW / 2 - 2, carH / 2 - 44, 10, 28, 5);
    ctx.fill();

    // Araba Gövdesi (Sarı / Turuncu Yarış Arabası Gradyanı + Belirgin Gölge)
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.55)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 8;

    const bodyGrad = ctx.createLinearGradient(0, -carH / 2, 0, carH / 2);
    bodyGrad.addColorStop(0, '#FACC15');
    bodyGrad.addColorStop(0.55, '#F59E0B');
    bodyGrad.addColorStop(1, '#EA580C');

    drawRoundedRect(ctx, -carW / 2, -carH / 2, carW, carH, 22);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();
    ctx.restore();

    // Ortadaki Beyaz Yarış Şeridi
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(-7, -carH / 2 + 8, 14, carH - 16);

    // Ön Cam / Kokpit
    drawRoundedRect(ctx, -carW / 2 + 12, -21, carW - 24, 44, 12);
    ctx.fillStyle = '#1E293B';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#38BDF8';
    ctx.stroke();

    // Ön Farlar
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(-carW / 2 + 10, -carH / 2 + 3, 13, 6);
    ctx.fillRect(carW / 2 - 23, -carH / 2 + 3, 13, 6);

    // Arka Spoiler
    drawRoundedRect(ctx, -carW / 2 + 6, carH / 2 - 13, carW - 12, 9, 4);
    ctx.fillStyle = '#B91C1C';
    ctx.fill();

    ctx.restore();
  }

  function handleCanvasLanePointer(e) {
    if (!state.isOpen || state.gameOverType) return;
    const canvas = document.getElementById('moliTurboCanvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const w = rect.width || 640;
    const sideMargin = Math.max(46, Math.min(92, w * 0.13));
    const roadW = w - sideMargin * 2;

    const relX = clickX - sideMargin;
    let pickedLane = Math.floor((relX / roadW) * 3);
    pickedLane = Math.max(0, Math.min(2, pickedLane));
    setCarLane(pickedLane);
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
        background: linear-gradient(145deg, #0F172A 0%, #1E293B 48%, #064E3B 100%);
        color: #0F172A;
        font-family: 'Nunito', 'Fredoka', sans-serif;
        border-radius: 28px;
        border: 4px solid rgba(251, 191, 36, 0.35);
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

      /* Üst Başlık Barı (İnce) */
      #${MODAL_ID} .mtr-topbar {
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
      #${MODAL_ID} .mtr-brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      #${MODAL_ID} .mtr-brand-icon {
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
      #${MODAL_ID} .mtr-brand-title {
        margin: 0;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.08rem, 1.8vw, 1.38rem);
        font-weight: 700;
        color: #0F172A;
      }
      #${MODAL_ID} .mtr-brand-sub {
        margin: 0;
        font-size: 0.8rem;
        font-weight: 800;
        color: #64748B;
      }
      #${MODAL_ID} .mtr-close-btn {
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
      }

      /* 5 Konu Sekmesi Barı (İnce ve Tek Satır) */
      #${MODAL_ID} .mtr-topics-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap;
        overflow-x: auto;
        gap: 8px;
        padding: 6px 16px;
        background: rgba(15, 23, 42, 0.55);
        border-bottom: 1px solid rgba(255, 255, 255, 0.16);
        flex-shrink: 0;
      }
      #${MODAL_ID} .mtr-topic-tab {
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
        touch-action: manipulation;
        transition: all 0.14s ease;
      }
      #${MODAL_ID} .mtr-topic-tab.is-active {
        background: linear-gradient(135deg, #F59E0B 0%, #EA580C 100%);
        border-color: #FDE047;
        border-bottom-color: #9A3412;
        color: #FFFFFF;
        box-shadow: 0 5px 15px rgba(245, 158, 11, 0.45);
        transform: translateY(-1px);
      }

      /* 1. Sınıf MEB 2 Satırlı Grup + Tekil Harf Seçici */
      #${MODAL_ID} .mtr-reading-selector-wrap {
        display: flex;
        flex-direction: column;
        background: rgba(15, 23, 42, 0.78);
        border-bottom: 1px solid rgba(253, 224, 71, 0.28);
        flex-shrink: 0;
      }
      #${MODAL_ID} .mtr-letter-groups-bar,
      #${MODAL_ID} .mtr-single-letters-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap;
        overflow-x: auto;
        gap: 6px;
        padding: 5px 14px;
      }
      #${MODAL_ID} .mtr-single-letters-bar {
        background: rgba(2, 6, 23, 0.45);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding: 5px 14px 6px;
      }
      #${MODAL_ID} .mtr-letter-group-label {
        font-size: 0.78rem;
        font-weight: 800;
        color: #FDE047;
        white-space: nowrap;
        margin-right: 4px;
      }
      #${MODAL_ID} .mtr-letter-group-btn {
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
      #${MODAL_ID} .mtr-letter-group-btn:hover {
        background: rgba(255, 255, 255, 0.24);
      }
      #${MODAL_ID} .mtr-letter-group-btn.is-active {
        background: linear-gradient(135deg, #38BDF8 0%, #0284C7 100%);
        border-color: #BAE6FD;
        color: #FFFFFF;
        box-shadow: 0 3px 10px rgba(14, 165, 233, 0.45);
      }
      #${MODAL_ID} .mtr-single-letter-btn {
        min-width: 36px;
        height: 30px;
        padding: 0 11px;
        border-radius: 9px;
        border: 2px solid rgba(255, 255, 255, 0.28);
        border-bottom: 3px solid rgba(15, 23, 42, 0.5);
        background: rgba(255, 255, 255, 0.92);
        color: #1E293B;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.92rem;
        font-weight: 800;
        cursor: pointer;
        touch-action: manipulation;
        transition: all 0.12s ease;
      }
      #${MODAL_ID} .mtr-single-letter-btn.is-active {
        background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
        border-color: #FEF08A;
        border-bottom-color: #991B1B;
        color: #FFFFFF;
        box-shadow: 0 4px 10px rgba(239, 68, 68, 0.45);
        transform: translateY(-1px);
      }

      /* Üst Bilgi Barı (Doğru: 0/8, 3 Can, Süre) */
      #${MODAL_ID} .mtr-hud-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 14px;
        max-width: 1360px;
        width: 100%;
        margin: 8px auto 0;
        padding: 0 22px;
        flex-shrink: 0;
      }
      #${MODAL_ID} .mtr-hud-pill {
        padding: 8px 20px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.96);
        border: 2.5px solid #E2E8F0;
        border-bottom: 5px solid #CBD5E1;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1rem, 1.5vw, 1.2rem);
        font-weight: 700;
        color: #0F172A;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.28);
      }

      /* Ana Sahne: %30 Büyütülmüş Sol Hedef Kutu + Orta/Sağ 3 Şeritli Otoban */
      #${MODAL_ID} .mtr-main-stage {
        flex: 1;
        display: grid;
        grid-template-columns: minmax(340px, 440px) minmax(420px, 820px);
        align-items: stretch;
        justify-content: center;
        gap: 24px;
        max-width: 1360px;
        width: 100%;
        margin: 0 auto;
        padding: 10px 22px 16px;
        min-height: 0;
      }

      /* Sol Panel (%30 Büyütülmüş Hedef Kutu) */
      #${MODAL_ID} .mtr-left-panel {
        background: linear-gradient(180deg, #FFFFFF 0%, #FFFBEB 100%);
        border: 5px solid #FCD34D;
        border-bottom: 10px solid #F59E0B;
        border-radius: 30px;
        padding: 22px;
        box-shadow: 0 24px 54px rgba(0, 0, 0, 0.45);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 14px;
      }
      #${MODAL_ID} .mtr-topic-badge {
        display: inline-block;
        padding: 7px 14px;
        border-radius: 999px;
        background: #FEF3C7;
        color: #92400E;
        font-size: 0.92rem;
        font-weight: 800;
        text-align: center;
      }
      #${MODAL_ID} .mtr-moli-coach-row {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #FFFFFF;
        border: 2.5px solid #FDE68A;
        border-radius: 20px;
        padding: 12px 14px;
        box-shadow: 0 8px 20px rgba(245, 158, 11, 0.14);
      }
      #${MODAL_ID} .mtr-moli-avatar {
        width: 72px;
        height: 72px;
        object-fit: contain;
        flex-shrink: 0;
        filter: drop-shadow(0 4px 10px rgba(15, 23, 42, 0.22));
      }
      #${MODAL_ID} .mtr-coach-tip {
        font-size: 1rem;
        font-weight: 800;
        color: #334155;
        line-height: 1.35;
      }
      #${MODAL_ID} .mtr-target-display {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 24px 18px;
        border-radius: 26px;
        background: linear-gradient(180deg, #FFFBEB 0%, #FEF08A 100%);
        border: 4px solid #F59E0B;
        box-shadow: inset 0 2px 10px rgba(255, 255, 255, 0.8), 0 12px 28px rgba(245, 158, 11, 0.25);
      }
      #${MODAL_ID} .mtr-target-label {
        font-size: 0.92rem;
        font-weight: 800;
        color: #B45309;
        letter-spacing: 0.05em;
        margin-bottom: 8px;
      }
      #${MODAL_ID} .mtr-target-value {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(2.2rem, 3.9vw, 3.35rem);
        font-weight: 700;
        color: #0F172A;
        line-height: 1.18;
      }
      #${MODAL_ID} .mtr-target-display.is-listening-mode .mtr-target-value {
        font-size: clamp(1.5rem, 2.5vw, 2rem);
        color: #0369A1;
      }
      #${MODAL_ID} .mtr-listen-btn {
        width: 100%;
        padding: 16px 20px;
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
        touch-action: manipulation;
      }
      #${MODAL_ID} .mtr-lane-quick-btns {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
      #${MODAL_ID} .mtr-lane-btn {
        padding: 13px 8px;
        border-radius: 14px;
        border: 2.5px solid #CBD5E1;
        border-bottom: 5px solid #94A3B8;
        background: #F8FAFC;
        color: #1E293B;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.05rem;
        font-weight: 700;
        cursor: pointer;
        touch-action: manipulation;
      }
      #${MODAL_ID} .mtr-lane-btn.is-selected {
        background: linear-gradient(180deg, #FEF9C3 0%, #FDE047 100%);
        border-color: #F59E0B;
        border-bottom-color: #D97706;
        color: #78350F;
        box-shadow: 0 6px 14px rgba(245, 158, 11, 0.32);
      }

      /* Orta Sahne: 3 Şeritli Otoban & Sağ Alt 🔥 TURBO Butonu */
      #${MODAL_ID} .mtr-highway-wrap {
        position: relative;
        border-radius: 30px;
        overflow: hidden;
        border: 5px solid rgba(255, 255, 255, 0.9);
        box-shadow: 0 26px 60px rgba(0, 0, 0, 0.55);
        background: #15803D;
        min-height: 480px;
        display: flex;
      }
      #${MODAL_ID} #moliTurboCanvas {
        width: 100%;
        height: 100%;
        display: block;
        cursor: pointer;
        touch-action: manipulation;
      }
      #${MODAL_ID} .mtr-highway-hint {
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        padding: 6px 14px;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.72);
        color: #F8FAFC;
        font-size: 0.82rem;
        font-weight: 800;
        pointer-events: none;
        white-space: nowrap;
      }

      /* Sağ Alt 🔥 TURBO Butonu */
      #${MODAL_ID} .mtr-turbo-btn {
        position: absolute;
        right: 16px;
        bottom: 18px;
        z-index: 8;
        padding: 14px 20px;
        border-radius: 20px;
        border: 3px solid #FDE047;
        border-bottom: 6px solid #B91C1C;
        background: linear-gradient(180deg, #F97316 0%, #DC2626 100%);
        color: #FFFFFF;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.15rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 10px 26px rgba(220, 38, 38, 0.55);
        touch-action: manipulation;
        transition: transform 0.12s ease;
      }
      #${MODAL_ID} .mtr-turbo-btn:active,
      #${MODAL_ID} .mtr-turbo-btn.is-boosting {
        transform: scale(1.08) translateY(-3px);
        box-shadow: 0 0 0 5px rgba(250, 204, 21, 0.55), 0 14px 32px rgba(239, 68, 68, 0.75);
      }

      /* Bitiş / Zafer Overlay */
      #${MODAL_ID} .mtr-end-overlay {
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
      #${MODAL_ID} .mtr-end-overlay.is-open {
        display: flex;
      }
      #${MODAL_ID} .mtr-end-card {
        width: 100%;
        max-width: 500px;
        background: #FFFFFF;
        border: 5px solid #22C55E;
        border-bottom: 10px solid #15803D;
        border-radius: 30px;
        padding: 28px 24px;
        text-align: center;
        box-shadow: 0 28px 65px rgba(0, 0, 0, 0.45);
      }
      #${MODAL_ID} .mtr-end-overlay.is-lose .mtr-end-card {
        border-color: #F59E0B;
        border-bottom-color: #D97706;
      }
      #${MODAL_ID} .mtr-end-icon {
        font-size: 3.8rem;
        margin-bottom: 8px;
      }
      #${MODAL_ID} .mtr-end-title {
        margin: 0 0 10px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.45rem, 2.6vw, 2rem);
        color: #14532D;
      }
      #${MODAL_ID} .mtr-end-overlay.is-lose .mtr-end-title {
        color: #92400E;
      }
      #${MODAL_ID} .mtr-end-desc {
        margin: 0 0 16px;
        font-size: 1.02rem;
        font-weight: 700;
        color: #475569;
        line-height: 1.45;
      }
      #${MODAL_ID} .mtr-end-stats {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        margin-bottom: 20px;
        padding: 10px 14px;
        border-radius: 14px;
        background: #F8FAFC;
        font-size: 0.98rem;
        font-weight: 800;
        color: #1E293B;
      }
      #${MODAL_ID} .mtr-end-actions {
        display: grid;
        grid-template-columns: 1.4fr 1fr;
        gap: 12px;
      }
      #${MODAL_ID} .mtr-btn-replay {
        padding: 14px 18px;
        border-radius: 16px;
        border: 2px solid #10B981;
        border-bottom: 5px solid #047857;
        background: linear-gradient(180deg, #10B981 0%, #059669 100%);
        color: #FFFFFF;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.1rem;
        font-weight: 700;
        cursor: pointer;
      }
      #${MODAL_ID} .mtr-btn-exit {
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

      /* Mobil Uyumluluk */
      @media (max-width: 820px) {
        #${MODAL_ID} .mtr-brand-sub {
          display: none;
        }
        #${MODAL_ID} .mtr-main-stage {
          grid-template-columns: 1fr;
          padding: 10px 12px 16px;
          gap: 12px;
        }
        #${MODAL_ID} .mtr-left-panel {
          padding: 12px;
          gap: 8px;
        }
        #${MODAL_ID} .mtr-moli-coach-row {
          display: none;
        }
        #${MODAL_ID} .mtr-target-display {
          padding: 10px 12px;
        }
        #${MODAL_ID} .mtr-highway-wrap {
          min-height: 360px;
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
    modal.setAttribute('aria-label', 'Turbo Otoban Yarışı');

    const tabsHtml = Object.values(TURBO_TOPICS).map((t) => `
      <button class="mtr-topic-tab ${t.id === state.activeTopicId ? 'is-active' : ''}"
              type="button"
              role="tab"
              data-topic-id="${t.id}"
              aria-selected="${t.id === state.activeTopicId ? 'true' : 'false'}">
        ${escapeHtml(t.tabLabel)}
      </button>
    `).join('');

    const letterGroupsHtml = READING1_LETTER_GROUPS.map((g) => `
      <button class="mtr-letter-group-btn ${g.id === state.activeLetterGroupId ? 'is-active' : ''}"
              type="button"
              data-group-id="${g.id}"
              aria-pressed="${g.id === state.activeLetterGroupId ? 'true' : 'false'}">
        ${escapeHtml(g.label)}
      </button>
    `).join('');

    modal.innerHTML = `
      <header class="mtr-topbar">
        <div class="mtr-brand">
          <div class="mtr-brand-icon" aria-hidden="true">🏎️</div>
          <div>
            <h2 class="mtr-brand-title">🏎️ Turbo Otoban Yarışı</h2>
            <p class="mtr-brand-sub">Doğru Şeride Dokun, 🔥 TURBO ile Hızlan ve 8 Doğruda Damalı Bayrağa Ulaş!</p>
          </div>
        </div>
        <button class="mtr-close-btn" id="moliTurboCloseBtn" type="button" aria-label="Turbo Otoban Yarışını Kapat">✕ Kapat</button>
      </header>

      <nav class="mtr-topics-bar" role="tablist" aria-label="Sınıf ve Konu Seçimi">
        ${tabsHtml}
      </nav>

      <div class="mtr-reading-selector-wrap" id="moliTurboReadingSelectorWrap">
        <div class="mtr-letter-groups-bar" id="moliTurboLetterGroupsBar" role="toolbar" aria-label="1. Sınıf MEB Harf Grubu Seçimi">
          <span class="mtr-letter-group-label">🔤 Harf Grubu:</span>
          ${letterGroupsHtml}
        </div>
        <div class="mtr-single-letters-bar" id="moliTurboSingleLettersRow" role="toolbar" aria-label="Tekil Harf Seçimi"></div>
      </div>

      <!-- Üst Bilgi Barı -->
      <div class="mtr-hud-bar">
        <div class="mtr-hud-pill" id="moliTurboHudCorrect">✅ Doğru: <strong>0 / 8</strong></div>
        <div class="mtr-hud-pill" id="moliTurboHudLives">❤️❤️❤️ <span>(3 Can)</span></div>
        <div class="mtr-hud-pill" id="moliTurboHudTime">⏱️ Süre: <strong>00:00</strong></div>
      </div>

      <!-- Ana Sahne: Sol Hedef Kutu + Orta 3 Şeritli Otoban -->
      <main class="mtr-main-stage">
        <aside class="mtr-left-panel" id="moliTurboQuestionBox" aria-live="polite"></aside>

        <section class="mtr-highway-wrap" aria-label="3 Şeritli Yarış Otobanı">
          <div class="mtr-highway-hint">👆 Gitmek İstediğin Şeride Doğrudan Dokun veya ⬅️ ➡️ Ok Tuşlarını Kullan</div>
          <canvas id="moliTurboCanvas" width="640" height="540"></canvas>
          <button class="mtr-turbo-btn" id="moliTurboBoostBtn" type="button" title="Turbo Hızlanma!">
            <span aria-hidden="true">🔥</span>
            <span>TURBO</span>
          </button>
        </section>
      </main>

      <div class="mtr-end-overlay" id="moliTurboEndOverlay" aria-live="polite"></div>
    `;

    document.body.appendChild(modal);

    document.getElementById('moliTurboCloseBtn').addEventListener('click', closeTurboRacer);

    modal.querySelectorAll('.mtr-topic-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const topicId = btn.getAttribute('data-topic-id');
        startNewRace(topicId);
      });
    });

    modal.querySelectorAll('.mtr-letter-group-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const groupId = btn.getAttribute('data-group-id');
        switchLetterGroup(groupId);
      });
    });

    const canvas = document.getElementById('moliTurboCanvas');
    if (canvas) {
      canvas.addEventListener('pointerdown', (e) => {
        if (e.button && e.button !== 0) return;
        handleCanvasLanePointer(e);
      });
    }

    const turboBtn = document.getElementById('moliTurboBoostBtn');
    if (turboBtn) {
      turboBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerTurboButton();
      });
      turboBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerTurboButton();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (!state.isOpen) return;
      if (e.key === 'Escape') {
        closeTurboRacer();
        return;
      }
      if (state.gameOverType) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setCarLane(state.carLane - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setCarLane(state.carLane + 1);
      } else if (e.key === 'ArrowUp' || e.key === ' ') {
        e.preventDefault();
        triggerTurboButton();
      }
    });
  }

  function openTurboRacer(initialTopicId) {
    buildModal();
    state.isOpen = true;
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.add('is-open');
    startNewRace(initialTopicId || state.activeTopicId);
  }

  function closeTurboRacer() {
    state.isOpen = false;
    stopVoice();
    if (state.clockTimer) {
      clearInterval(state.clockTimer);
      state.clockTimer = null;
    }
    if (state.animFrameId) {
      cancelAnimationFrame(state.animFrameId);
      state.animFrameId = null;
    }
    const confetti = document.getElementById(CONFETTI_CANVAS_ID);
    if (confetti) confetti.remove();
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.remove('is-open');
  }

  window.openMoliTurboRacer = openTurboRacer;
  window.closeMoliTurboRacer = closeTurboRacer;

  function injectAndBindShowcaseCard() {
    const arcadeGrid = document.querySelector('#arcadeHubSection .arcade-games-grid');
    if (arcadeGrid && !document.getElementById('arcadeCardTurboRacer')) {
      const card = document.createElement('div');
      card.className = 'arcade-game-card theme-wheel';
      card.id = 'arcadeCardTurboRacer';
      card.setAttribute('data-open-moli-turbo', '1');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.innerHTML = `
        <div class="arcade-card-hero-banner banner-wheel" aria-hidden="true">
          <div class="banner-scene scene-wheel">
            <div class="mini-wheel-wrap">
              <span class="mini-wheel-icon">🏎️</span>
              <span class="mini-gift-icon">🏁</span>
            </div>
            <span class="badge-blinking-new">🔥 TURBO</span>
          </div>
        </div>
        <div class="arcade-card-top">
          <span class="arcade-card-tag">🏎️ 3 Şeritli Otoban</span>
          <span class="arcade-card-chip chip-orange">🔥 Turbo &amp; 5 Konu</span>
        </div>
        <h3 class="arcade-card-title">🏎️ Turbo Otoban Yarışı</h3>
        <p class="arcade-card-desc">Soruyu dinle, 3 şeritli otobanda doğru cevabın kapısına dokunarak geç! 🔥 TURBO ile alev saçarak bitiş çizgisine ulaş!</p>
        <div class="arcade-card-badges">
          <span>🛣️ 3 Şeritli Canlı Yol</span>
          <span>🏁 8 Doğruda Şampiyonluk</span>
        </div>
        <button class="arcade-card-play-btn" type="button">Gaza Bas ›</button>
      `;
      const mendilCard = document.getElementById('arcadeCardMendilGame');
      if (mendilCard && mendilCard.nextSibling) {
        arcadeGrid.insertBefore(card, mendilCard.nextSibling);
      } else {
        arcadeGrid.insertBefore(card, arcadeGrid.firstChild);
      }
    }

    document.querySelectorAll('[data-open-moli-turbo], #arcadeCardTurboRacer').forEach((el) => {
      if (el.dataset.moliTurboBound) return;
      el.dataset.moliTurboBound = '1';
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const topic = el.getAttribute('data-turbo-topic') || undefined;
        openTurboRacer(topic);
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          const topic = el.getAttribute('data-turbo-topic') || undefined;
          openTurboRacer(topic);
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
