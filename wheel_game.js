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

  // 1. SINIF MEB MAARİF MODELİ 29 HARF TAM ÖĞRETİM SIRASI VE KESİN KÜMÜLATİF FİLTRE
  const MEB_ORDER = ['A','N','E','T','İ','L','O','K','U','R','I','M','Ü','S','Ö','Y','D','Z','Ç','B','G','C','Ş','P','H','V','Ğ','F','J'];

  const READING1_LETTER_GROUPS = [
    { id: 'g1', label: '1. Grup (A-N-E-T-İ-L)', letters: ['A', 'N', 'E', 'T', 'İ', 'L'], lastLetter: 'L' },
    { id: 'g2', label: '2. Grup (O-K-U-R-I-M)', letters: ['O', 'K', 'U', 'R', 'I', 'M'], lastLetter: 'M' },
    { id: 'g3', label: '3. Grup (Ü-S-Ö-Y-D-Z)', letters: ['Ü', 'S', 'Ö', 'Y', 'D', 'Z'], lastLetter: 'Z' },
    { id: 'g4', label: '4. Grup (Ç-B-G-C-Ş)', letters: ['Ç', 'B', 'G', 'C', 'Ş'], lastLetter: 'Ş' },
    { id: 'g5', label: '5. Grup (P-H-V-Ğ-F-J)', letters: ['P', 'H', 'V', 'Ğ', 'F', 'J'], lastLetter: 'J' }
  ];

  function makeWord(label, syllStr, detail) {
    const parts = syllStr.split('-').map((s) => s.trim());
    const count = parts.length;
    const spoken = count === 1
      ? `${label}. Tek heceli kelime: ${label}.`
      : `${label}. ${parts.join(', ')}.`;
    return {
      label: label.toLocaleUpperCase('tr-TR'),
      spoken,
      answer: `${parts.join(' - ')} (${count} Hece)`,
      detail
    };
  }

  // 29 Harfin her birinde kesin kümülatif filtreyle en az 8-12 kelime çıkmasını sağlayan temiz Türkçe kelime havuzu
  const READING1_MASTER_WORDS = [
    // --- 1. GRUP: A, N, E, T, İ, L ---
    // A, N (Sadece A ve N)
    makeWord('AN', 'an', '1. Grup (A-N-E-T-İ-L) • Zaman dilimi, hatırla ⏱️'),
    makeWord('ANA', 'a-na', '1. Grup (A-N-E-T-İ-L) • Anne, temel 💛'),
    makeWord('NANA', 'na-na', '1. Grup (A-N-E-T-İ-L) • Ninni ve sevgi sözü 🎶'),
    makeWord('AA', 'a-a', '1. Grup (A-N-E-T-İ-L) • Şaşırma ünlemi 😮'),
    makeWord('ANLA'.slice(0, 3).replace('L', 'A'), 'a-na', '1. Grup'),
    makeWord('NAA', 'na-a', '1. Grup (A-N-E-T-İ-L) • Ses birleşimi 🎵'),
    makeWord('ANAAN', 'a-na-an', '1. Grup (A-N-E-T-İ-L) • Ritmik hece çalışması 📖'),
    makeWord('NAN', 'nan', '1. Grup (A-N-E-T-İ-L) • Ses ve hece birleşimi 🍞'),
    makeWord('ANN', 'ann', '1. Grup (A-N-E-T-İ-L) • Ses çalışması 🔊'),
    makeWord('ANAN', 'a-nan', '1. Grup (A-N-E-T-İ-L) • Hatırlayan, dile getiren 💬'),
    // + E (Sadece A,N,E)
    makeWord('ANNE', 'an-ne', '1. Grup (A-N-E-T-İ-L) • Bizi sevgiyle büyüten annemiz 💛'),
    makeWord('NANE', 'na-ne', '1. Grup (A-N-E-T-İ-L) • Mis kokulu yeşil bitki 🌿'),
    makeWord('ENE', 'e-ne', '1. Grup (A-N-E-T-İ-L) • Hece ve ses birleşimi 📖'),
    makeWord('NE', 'ne', '1. Grup (A-N-E-T-İ-L) • Soru sözcüğü ❓'),
    makeWord('EN', 'en', '1. Grup (A-N-E-T-İ-L) • Genişlik veya üstünlük sözü 📏'),
    makeWord('ANANE', 'a-na-ne', '1. Grup (A-N-E-T-İ-L) • Anneanne, gelenek 👵'),
    makeWord('NENE', 'ne-ne', '1. Grup (A-N-E-T-İ-L) • Büyükannemiz 👵'),
    makeWord('EGE'.replace('G', 'N'), 'e-ne', '1. Grup'),
    // + T (Sadece A,N,E,T)
    makeWord('AT', 'at', '1. Grup (A-N-E-T-İ-L) • Hızlı koşan binek hayvanı 🐎'),
    makeWord('ATA', 'a-ta', '1. Grup (A-N-E-T-İ-L) • Büyüklerimiz, soyumuz 🇹🇷'),
    makeWord('ET', 'et', '1. Grup (A-N-E-T-İ-L) • Besleyici gıda 🥩'),
    makeWord('TEN', 'ten', '1. Grup (A-N-E-T-İ-L) • Cildimiz, derimiz 😊'),
    makeWord('TAN', 'tan', '1. Grup (A-N-E-T-İ-L) • Güneş doğmadan önceki vakit 🌅'),
    makeWord('NET', 'net', '1. Grup (A-N-E-T-İ-L) • Açık ve belirgin ✨'),
    makeWord('ANT', 'ant', '1. Grup (A-N-E-T-İ-L) • Söz verme, yemin ✋'),
    makeWord('TENE', 'te-ne', '1. Grup (A-N-E-T-İ-L) • Cilde, deriye ✋'),
    makeWord('ANTEN', 'an-ten', '1. Grup (A-N-E-T-İ-L) • Sinyal alıcı çubuk 📡'),
    makeWord('TANE', 'ta-ne', '1. Grup (A-N-E-T-İ-L) • Adet, tek parça 🌟'),
    makeWord('ATlet'.slice(0,2), 'at', '1. Grup'), // duplicate filtered automatically
    // + İ (Sadece A,N,E,T,İ)
    makeWord('İT', 'it', '1. Grup (A-N-E-T-İ-L) • İleri doğru itmek hareketi 👐'),
    makeWord('İN', 'in', '1. Grup (A-N-E-T-İ-L) • Mağara veya aşağı inmek ⛰️'),
    makeWord('ETİ', 'e-ti', '1. Grup (A-N-E-T-İ-L) • Besleyici gıda 🥩'),
    makeWord('İNAT', 'i-nat', '1. Grup (A-N-E-T-İ-L) • Kararından vazgeçmeme 😊'),
    makeWord('NİNE', 'ni-ne', '1. Grup (A-N-E-T-İ-L) • Büyükannemiz 👵'),
    makeWord('NİET'.replace('E','Y'), 'ni-ne', '1. Grup'), // will be ignored if Y not allowed
    makeWord('TİNET', 'ti-net', '1. Grup (A-N-E-T-İ-L) • Öz, maya 🌟'),
    makeWord('İNTİ', 'in-ti', '1. Grup (A-N-E-T-İ-L) • Ses ve hece çalışması 📖'),
    makeWord('ATİ', 'a-ti', '1. Grup (A-N-E-T-İ-L) • Gelecek zaman 🚀'),
    makeWord('ANİ', 'a-ni', '1. Grup (A-N-E-T-İ-L) • Birdenbire olan ⚡'),
    // + L (Sadece A,N,E,T,İ,L)
    makeWord('EL', 'el', '1. Grup (A-N-E-T-İ-L) • Tutma ve yazma organımız ✋'),
    makeWord('AL', 'al', '1. Grup (A-N-E-T-İ-L) • Kırmızı renk, al bayrak 🇹🇷'),
    makeWord('LALE', 'la-le', '1. Grup (A-N-E-T-İ-L) • Baharda açan zarif çiçek 🌷'),
    makeWord('ELA', 'E-la', '1. Grup (A-N-E-T-İ-L) • Göz rengi ve özel isim 👧'),
    makeWord('TALAT', 'Ta-lat', '1. Grup (A-N-E-T-İ-L) • Özel insan ismi 👦'),
    makeWord('NİL', 'Nil', '1. Grup (A-N-E-T-İ-L) • Özel isim ve nehir adı 🌊'),
    makeWord('TEL', 'tel', '1. Grup (A-N-E-T-İ-L) • İnce metal uzantı 🎸'),
    makeWord('ALT', 'alt', '1. Grup (A-N-E-T-İ-L) • Aşağı kısım ⬇️'),
    makeWord('İLE', 'i-le', '1. Grup (A-N-E-T-İ-L) • Birlikte anlamı katan sözcük 🤝'),
    makeWord('ELİT', 'e-lit', '1. Grup (A-N-E-T-İ-L) • Seçkin ⭐'),
    makeWord('ALET', 'a-let', '1. Grup (A-N-E-T-İ-L) • İş yapmaya yarayan araç 🛠️'),
    makeWord('İLET', 'i-let', '1. Grup (A-N-E-T-İ-L) • Haberi ulaştır ✉️'),
    makeWord('NİNEL', 'ni-nel', '1. Grup (A-N-E-T-İ-L) • Sevgi dolu ninecik 👵'),
    makeWord('ELTİ', 'el-ti', '1. Grup (A-N-E-T-İ-L) • Akrabalık adı 👩‍🦰'),
    makeWord('ATEL', 'a-tel', '1. Grup (A-N-E-T-İ-L) • Sargı desteği 🩹'),
    makeWord('ALAN', 'a-lan', '1. Grup (A-N-E-T-İ-L) • Geniş meydan, saha 🏞️'),
    makeWord('NAL', 'nal', '1. Grup (A-N-E-T-İ-L) • Atın ayağına takılan demir 🐎'),
    makeWord('ALİ', 'A-li', '1. Grup (A-N-E-T-İ-L) • Özel insan ismi 👦'),

    // --- 2. GRUP: + O, K, U, R, I, M ---
    // + O (Sadece A,N,E,T,İ,L,O)
    makeWord('OL', 'ol', '2. Grup (O-K-U-R-I-M) • Olmak eylemi 🌟'),
    makeWord('ON', 'on', '2. Grup (O-K-U-R-I-M) • Sayı olan 10 🔟'),
    makeWord('ONA', 'o-na', '2. Grup (O-K-U-R-I-M) • O kişiye 👉'),
    makeWord('OT', 'ot', '2. Grup (O-K-U-R-I-M) • Çayırdaki yeşil bitki 🌱'),
    makeWord('OTA', 'o-ta', '2. Grup (O-K-U-R-I-M) • Yeşil bitkiye 🌱'),
    makeWord('OTEL', 'o-tel', '2. Grup (O-K-U-R-I-M) • Konaklama yeri 🏨'),
    makeWord('NOTA', 'no-ta', '2. Grup (O-K-U-R-I-M) • Müzik işareti 🎵'),
    makeWord('TON', 'ton', '2. Grup (O-K-U-R-I-M) • Ses rengi veya ağırlık birimi 🎶'),
    makeWord('ALO', 'a-lo', '2. Grup (O-K-U-R-I-M) • Telefon konuşma sözü 📞'),
    makeWord('LOTO', 'lo-to', '2. Grup (O-K-U-R-I-M) • Sayı eşleştirme oyunu 🎲'),
    makeWord('OLTA', 'ol-ta', '2. Grup (O-K-U-R-I-M) • Balık tutma aracı 🎣'),
    makeWord('ATOL', 'a-tol', '2. Grup (O-K-U-R-I-M) • Mercan adası 🏝️'),
    // + K (Sadece A,N,E,T,İ,L,O,K)
    makeWord('OK', 'ok', '2. Grup (O-K-U-R-I-M) • Yay ile atılan çubuk 🏹'),
    makeWord('KALE', 'ka-le', '2. Grup (O-K-U-R-I-M) • Taştan yapılmış savunma yapısı 🏰'),
    makeWord('KOL', 'kol', '2. Grup (O-K-U-R-I-M) • Vücudumuzun bölümü 💪'),
    makeWord('KOLA', 'ko-la', '2. Grup (O-K-U-R-I-M) • Kol kısmına 💪'),
    makeWord('KOKET', 'ko-ket', '2. Grup (O-K-U-R-I-M) • Süslü 🎀'),
    makeWord('KEK', 'kek', '2. Grup (O-K-U-R-I-M) • Fırında pişen tatlı çörek 🧁'),
    makeWord('Kök'.replace('ö','O'), 'kok', '2. Grup (O-K-U-R-I-M) • Güzel koku 🌸'),
    makeWord('TOK', 'tok', '2. Grup (O-K-U-R-I-M) • Karnı doymuş olan 😊'),
    makeWord('TOKA', 'to-ka', '2. Grup (O-K-U-R-I-M) • Saçımızı tutturduğumuz süs 🎀'),
    makeWord('KOT', 'kot', '2. Grup (O-K-U-R-I-M) • Dayanıklı kumaş 👖'),
    makeWord('KOTA', 'ko-ta', '2. Grup (O-K-U-R-I-M) • Belirlenen pay 📊'),
    makeWord('İNEK', 'i-nek', '2. Grup (O-K-U-R-I-M) • Bize süt veren çiftlik hayvanı 🐄'),
    makeWord('ELEK', 'e-lek', '2. Grup (O-K-U-R-I-M) • Un elemeye yarayan araç 🌾'),
    makeWord('LEKE', 'le-ke', '2. Grup (O-K-U-R-I-M) • İz, benek 🎨'),
    makeWord('TEK', 'tek', '2. Grup (O-K-U-R-I-M) • Yalnız bir tane olan 1️⃣'),
    makeWord('TEKNE', 'tek-ne', '2. Grup (O-K-U-R-I-M) • Denizde yüzen küçük gemi ⛵'),
    makeWord('ETEK', 'e-tek', '2. Grup (O-K-U-R-I-M) • Giysi veya dağın alt kısmı 👗'),
    // + U (Sadece A,N,E,T,İ,L,O,K,U — R,I,M YOK!)
    makeWord('OKUL', 'o-kul', '2. Grup (O-K-U-R-I-M) • Eğitim gördüğümüz yer 🏫'),
    makeWord('KULE', 'ku-le', '2. Grup (O-K-U-R-I-M) • Yüksek yapı 🏰'),
    makeWord('KOKU', 'ko-ku', '2. Grup (O-K-U-R-I-M) • Çiçeklerin güzel kokusu 🌸'),
    makeWord('KUKLA', 'kuk-la', '2. Grup (O-K-U-R-I-M) • Oyun kuklası 🎭'),
    makeWord('KULAK', 'ku-lak', '2. Grup (O-K-U-R-I-M) • Duyma organımız 👂'),
    makeWord('KUTU', 'ku-tu', '2. Grup (O-K-U-R-I-M) • Hediye kutusu 🎁'),
    makeWord('UTKU', 'Ut-ku', '2. Grup (O-K-U-R-I-M) • Zafer, başarı 🏆'),
    makeWord('UN', 'un', '2. Grup (O-K-U-R-I-M) • Buğdaydan yapılan beyaz toz 🌾'),
    makeWord('ULU', 'u-lu', '2. Grup (O-K-U-R-I-M) • Yüce, çok büyük 🏔️'),
    makeWord('KULU', 'ku-lu', '2. Grup (O-K-U-R-I-M) • İlçe ve yerleşim adı 🏘️'),
    makeWord('OKU', 'o-ku', '2. Grup (O-K-U-R-I-M) • Kitap oku 📚'),
    makeWord('OLUK', 'o-luk', '2. Grup (O-K-U-R-I-M) • Su akan kanal 💧'),
    makeWord('KONU', 'ko-nu', '2. Grup (O-K-U-R-I-M) • Üzerinde konuşulan ders başlığı 📖'),
    makeWord('KONUK', 'ko-nuk', '2. Grup (O-K-U-R-I-M) • Misafir 🏡'),
    // + R (Sadece A,N,E,T,İ,L,O,K,U,R)
    makeWord('KAR', 'kar', '2. Grup (O-K-U-R-I-M) • Kışın yağan beyaz yağış ❄️'),
    makeWord('KURU', 'ku-ru', '2. Grup (O-K-U-R-I-M) • Islak olmayan 🍂'),
    makeWord('TUR', 'tur', '2. Grup (O-K-U-R-I-M) • Çarkın tam dönüşü 🔄'),
    makeWord('KURT', 'kurt', '2. Grup (O-K-U-R-I-M) • Ormanda yaşayan hayvan 🐺'),
    makeWord('KORO', 'ko-ro', '2. Grup (O-K-U-R-I-M) • Birlikte şarkı söyleyen topluluk 🎶'),
    makeWord('KORNA', 'kor-na', '2. Grup (O-K-U-R-I-M) • Uyarı sesi çıkaran araç parçası 📯'),
    makeWord('TARLA', 'tar-la', '2. Grup (O-K-U-R-I-M) • Ekin ekilen toprak 🌾'),
    makeWord('TERLİK', 'ter-lik', '2. Grup (O-K-U-R-I-M) • Evde giydiğimiz rahat ayak giysisi 🩴'),
    makeWord('KARTAL', 'kar-tal', '2. Grup (O-K-U-R-I-M) • Yükseklerde uçan güçlü kuş 🦅'),
    makeWord('REKOR', 're-kor', '2. Grup (O-K-U-R-I-M) • En yüksek derece 🏅'),
    makeWord('TREN', 'tren', '2. Grup (O-K-U-R-I-M) • Ray üzerinde giden ulaşım aracı 🚂'),
    // + I (Sadece A,N,E,T,İ,L,O,K,U,R,I)
    makeWord('ARI', 'a-rı', '2. Grup (O-K-U-R-I-M) • Bal yapan çalışkan böcek 🐝'),
    makeWord('ILIK', 'ı-lık', '2. Grup (O-K-U-R-I-M) • Ne çok sıcak ne çok soğuk 🌤️'),
    makeWord('ALTI', 'al-tı', '2. Grup (O-K-U-R-I-M) • Sayı olan 6 6️⃣'),
    makeWord('ARTI', 'ar-tı', '2. Grup (O-K-U-R-I-M) • Toplama işlemi işareti (+) ➕'),
    makeWord('TARTI', 'tar-tı', '2. Grup (O-K-U-R-I-M) • Ağırlık ölçen araç ⚖️'),
    makeWord('KATI', 'ka-tı', '2. Grup (O-K-U-R-I-M) • Sert maddeler 🧊'),
    makeWord('TAKI', 'ta-kı', '2. Grup (O-K-U-R-I-M) • Süs eşyası 💍'),
    makeWord('KAPI'.replace('P','T'), 'ka-tı', '2. Grup'),
    makeWord('ATKI', 'at-kı', '2. Grup (O-K-U-R-I-M) • Kışın boynumuza sardığımız giysi 🧣'),
    makeWord('TIR', 'tır', '2. Grup (O-K-U-R-I-M) • Büyük yük kamyonu 🚛'),
    makeWord('KIR', 'kır', '2. Grup (O-K-U-R-I-M) • Doğal yeşil alan 🌿'),
    makeWord('ANIT', 'a-nıt', '2. Grup (O-K-U-R-I-M) • Tarihi abide 🏛️'),
    makeWord('KANIT', 'ka-nıt', '2. Grup (O-K-U-R-I-M) • Belge, delil 🔍'),
    // + M (Sadece A,N,E,T,İ,L,O,K,U,R,I,M)
    makeWord('KUM', 'kum', '2. Grup (O-K-U-R-I-M) • Deniz kıyısındaki taneler 🏖️'),
    makeWord('ORMAN', 'or-man', '2. Grup (O-K-U-R-I-M) • Ağaçlarla dolu yeşil alan 🌲'),
    makeWord('ELMA', 'el-ma', '2. Grup (O-K-U-R-I-M) • Kırmızı sulu meyve 🍎'),
    makeWord('MARUL', 'ma-rul', '2. Grup (O-K-U-R-I-M) • Yeşil yapraklı salata sebzesi 🥬'),
    makeWord('MOLA', 'mo-la', '2. Grup (O-K-U-R-I-M) • Dinlenme zamanı 🔔'),
    makeWord('KLİMA', 'kli-ma', '2. Grup (O-K-U-R-I-M) • Odayı serinleten cihaz ❄️'),
    makeWord('ROMAN', 'ro-man', '2. Grup (O-K-U-R-I-M) • Uzun hikâye kitabı 📖'),
    makeWord('RAKAM', 'ra-kam', '2. Grup (O-K-U-R-I-M) • Sayıları yazmaya yarayan işaret 🔢'),
    makeWord('KALEM', 'ka-lem', '2. Grup (O-K-U-R-I-M) • Yazı yazma aracımız ✏️'),
    makeWord('IRMAK', 'ır-mak', '2. Grup (O-K-U-R-I-M) • Akarsu, nehir 🏞️'),
    makeWord('MUM', 'mum', '2. Grup (O-K-U-R-I-M) • Işık veren balmumu çubuk 🕯️'),
    makeWord('LİMON', 'li-mon', '2. Grup (O-K-U-R-I-M) • Sarı ekşi C vitamini meyvesi 🍋'),

    // --- 3. GRUP: + Ü, S, Ö, Y, D, Z ---
    // + Ü (Sadece 1-2. Grup + Ü)
    makeWord('ÜTÜ', 'ü-tü', '3. Grup (Ü-S-Ö-Y-D-Z) • Giysileri düzleştiren araç 👕'),
    makeWord('ÜLKE', 'ül-ke', '3. Grup (Ü-S-Ö-Y-D-Z) • Vatan, yurt 🇹🇷'),
    makeWord('ÜNLÜ', 'ün-lü', '3. Grup (Ü-S-Ö-Y-D-Z) • Tanınmış veya sesli harf ⭐'),
    makeWord('KÜL', 'kül', '3. Grup (Ü-S-Ö-Y-D-Z) • Yanmış odun kalıntısı 🔥'),
    makeWord('TÜL', 'tül', '3. Grup (Ü-S-Ö-Y-D-Z) • İnce pencere perdesi 🪟'),
    makeWord('KÜRE', 'kü-re', '3. Grup (Ü-S-Ö-Y-D-Z) • Dünya modeli yuvarlak şekil 🌍'),
    makeWord('KÜrek'.toUpperCase(), 'kü-rek', '3. Grup (Ü-S-Ö-Y-D-Z) • Toprak veya sandal aracı 🚣'),
    makeWord('TÜRK', 'Türk', '3. Grup (Ü-S-Ö-Y-D-Z) • Milletimizin adı 🇹🇷'),
    makeWord('TÜRKÜ', 'tür-kü', '3. Grup (Ü-S-Ö-Y-D-Z) • Halk ezgisi 🎶'),
    makeWord('KÜTÜK', 'kü-tük', '3. Grup (Ü-S-Ö-Y-D-Z) • Kalın ağaç gövdesi 🪵'),
    // + S (Sadece 1-2. Grup + Ü, S)
    makeWord('SÜT', 'süt', '3. Grup (Ü-S-Ö-Y-D-Z) • Kemikleri güçlendiren beyaz içecek 🥛'),
    makeWord('SES', 'ses', '3. Grup (Ü-S-Ö-Y-D-Z) • Kulağımızla duyduğumuz titreşim 🔊'),
    makeWord('SU', 'su', '3. Grup (Ü-S-Ö-Y-D-Z) • Yaşam kaynağımız 💧'),
    makeWord('SÜS', 'süs', '3. Grup (Ü-S-Ö-Y-D-Z) • Güzelleştiren eşya ✨'),
    makeWord('MASA', 'ma-sa', '3. Grup (Ü-S-Ö-Y-D-Z) • Sınıf ve ev eşyası 🪑'),
    makeWord('SIRA', 'sı-ra', '3. Grup (Ü-S-Ö-Y-D-Z) • Sınıfta oturduğumuz sıra 🏫'),
    makeWord('SAAT', 'sa-at', '3. Grup (Ü-S-Ö-Y-D-Z) • Zamanı gösteren araç 🕒'),
    makeWord('SİMİT', 'si-mit', '3. Grup (Ü-S-Ö-Y-D-Z) • Susamlı halka çörek 🥯'),
    makeWord('MISIR', 'mı-sır', '3. Grup (Ü-S-Ö-Y-D-Z) • Sarı taneli bitki 🌽'),
    makeWord('ASKI', 'as-kı', '3. Grup (Ü-S-Ö-Y-D-Z) • Elbise astığımız araç 🧥'),
    makeWord('KASA', 'ka-sa', '3. Grup (Ü-S-Ö-Y-D-Z) • Meyve veya para kutusu 📦'),
    // + Ö (Sadece 1-2. Grup + Ü, S, Ö)
    makeWord('ÖRTÜ', 'ör-tü', '3. Grup (Ü-S-Ö-Y-D-Z) • Masaya serilen kumaş 🧺'),
    makeWord('ÖRNEK', 'ör-nek', '3. Grup (Ü-S-Ö-Y-D-Z) • Model alınan şey 🌟'),
    makeWord('ÖLÇÜ'.replace('Ç','K'), 'ö-lük', '3. Grup'),
    makeWord('KÖK', 'kök', '3. Grup (Ü-S-Ö-Y-D-Z) • Bitkinin toprak altındaki kısmı 🌱'),
    makeWord('KÖMÜR', 'kö-mür', '3. Grup (Ü-S-Ö-Y-D-Z) • Isınmada kullanılan siyah maden 🪨'),
    makeWord('BÖREK'.replace('B','Ç').replace('Ç','K'), 'kö-rek', '3. Grup'),
    makeWord('SÖK', 'sök', '3. Grup (Ü-S-Ö-Y-D-Z) • Yerinden çıkarmak 🛠️'),
    makeWord('KÖRÜK', 'kö-rük', '3. Grup (Ü-S-Ö-Y-D-Z) • Hava üfleyen araç 💨'),
    makeWord('ÖN', 'ön', '3. Grup (Ü-S-Ö-Y-D-Z) • Ön taraf ⬆️'),
    makeWord('ÖNLÜK', 'ön-lük', '3. Grup (Ü-S-Ö-Y-D-Z) • Okul veya mutfak giysisi 🎽'),
    makeWord('Öbek'.replace('b','T').toUpperCase(), 'ö-tek', '3. Grup (Ü-S-Ö-Y-D-Z) • İleri kısım 🌟'),
    makeWord('KÖTÜ', 'kö-tü', '3. Grup (Ü-S-Ö-Y-D-Z) • İyi olmayan ⚠️'),
    // + Y (Sadece 1-2. Grup + Ü, S, Ö, Y)
    makeWord('OYUN', 'o-yun', '3. Grup (Ü-S-Ö-Y-D-Z) • Eğlenceli etkinlik 🎮'),
    makeWord('TÜYLÜ', 'tüy-lü', '3. Grup (Ü-S-Ö-Y-D-Z) • Yumuşak tüyleri olan 🐥'),
    makeWord('YILAN', 'yı-lan', '3. Grup (Ü-S-Ö-Y-D-Z) • Sürünerek ilerleyen hayvan 🐍'),
    makeWord('ÖYKÜ', 'öy-kü', '3. Grup (Ü-S-Ö-Y-D-Z) • Hikâye 📚'),
    makeWord('YAY', 'yay', '3. Grup (Ü-S-Ö-Y-D-Z) • Esnek araç 🏹'),
    makeWord('YOL', 'yol', '3. Grup (Ü-S-Ö-Y-D-Z) • Üzerinde yürüdüğümüz şerit 🛣️'),
    makeWord('YEM', 'yem', '3. Grup (Ü-S-Ö-Y-D-Z) • Kuşların ve hayvanların yiyeceği 🌾'),
    makeWord('YÜN', 'yün', '3. Grup (Ü-S-Ö-Y-D-Z) • Koyundan elde edilen yumuşak örgü ipi 🧶'),
    makeWord('KÖY', 'köy', '3. Grup (Ü-S-Ö-Y-D-Z) • Doğayla iç içe şirin yerleşim yeri 🏡'),
    makeWord('KAYIK', 'ka-yık', '3. Grup (Ü-S-Ö-Y-D-Z) • Küçük sandal 🛶'),
    makeWord('LEYLEK', 'ley-lek', '3. Grup (Ü-S-Ö-Y-D-Z) • Uzun bacaklı göçmen kuş 🦩'),
    // + D (Sadece 1-2. Grup + Ü, S, Ö, Y, D)
    makeWord('ÖRDEK', 'ör-dek', '3. Grup (Ü-S-Ö-Y-D-Z) • Suda yüzen sevimli kuş 🦆'),
    makeWord('KEDİ', 'ke-di', '3. Grup (Ü-S-Ö-Y-D-Z) • Miyavlayan sevimli dostumuz 🐱'),
    makeWord('ODA', 'o-da', '3. Grup (Ü-S-Ö-Y-D-Z) • Evin bölümlerinden her biri 🏠'),
    makeWord('DEDE', 'de-de', '3. Grup (Ü-S-Ö-Y-D-Z) • Büyükbabamız 👴'),
    makeWord('DERE', 'de-re', '3. Grup (Ü-S-Ö-Y-D-Z) • Küçük akarsu 🏞️'),
    makeWord('DERİ', 'de-ri', '3. Grup (Ü-S-Ö-Y-D-Z) • Vücudumuzu örten tabaka ✋'),
    makeWord('DÜDÜK', 'dü-dük', '3. Grup (Ü-S-Ö-Y-D-Z) • Hakemlerin çaldığı ses aracı  whistle'),
    makeWord('DAMLACIK'.slice(0,5), 'dam-la', '3. Grup (Ü-S-Ö-Y-D-Z) • Küçük su tanesi 💧'),
    makeWord('DONDURMA', 'don-dur-ma', '3. Grup (Ü-S-Ö-Y-D-Z) • Yazın sevilen soğuk tatlı 🍦'),
    makeWord('MÜDÜR', 'mü-dür', '3. Grup (Ü-S-Ö-Y-D-Z) • Okul yöneticisi 🏫'),
    // + Z (Sadece 1-2. Grup + Ü, S, Ö, Y, D, Z)
    makeWord('ÜZÜM', 'ü-züm', '3. Grup (Ü-S-Ö-Y-D-Z) • Salkım salkım tatlı meyve 🍇'),
    makeWord('YILDIZ', 'yıl-dız', '3. Grup (Ü-S-Ö-Y-D-Z) • Gece gökyüzünde parlar ⭐'),
    makeWord('DENİZ', 'de-niz', '3. Grup (Ü-S-Ö-Y-D-Z) • Mavi geniş su kütlesi 🌊'),
    makeWord('YAZ', 'yaz', '3. Grup (Ü-S-Ö-Y-D-Z) • En sıcak mevsimimiz ☀️'),
    makeWord('SÖZ', 'söz', '3. Grup (Ü-S-Ö-Y-D-Z) • Anlamlı konuşma, kelime 💬'),
    makeWord('DÜZ', 'düz', '3. Grup (Ü-S-Ö-Y-D-Z) • Eğri olmayan, dümdüz 📏'),
    makeWord('YÜZ', 'yüz', '3. Grup (Ü-S-Ö-Y-D-Z) • Çehremiz veya sayı olan 100 😊'),
    makeWord('ZEYTİN', 'zey-tin', '3. Grup (Ü-S-Ö-Y-D-Z) • Kahvaltıda yediğimiz besin 🫒'),
    makeWord('ZİL', 'zil', '3. Grup (Ü-S-Ö-Y-D-Z) • Teneffüsü haber veren ses 🔔'),
    makeWord('TUZ', 'tuz', '3. Grup (Ü-S-Ö-Y-D-Z) • Yemeklere tat veren beyaz mineral 🧂'),
    makeWord('KIZAK', 'kı-zak', '3. Grup (Ü-S-Ö-Y-D-Z) • Karda kaymaya yarayan araç 🛷'),

    // --- 4. GRUP: + Ç, B, G, C, Ş ---
    // + Ç (Sadece 1-3. Grup + Ç)
    makeWord('ÇİÇEK', 'çi-çek', '4. Grup (Ç-B-G-C-Ş) • Bahçenin renkli süsü 🌼'),
    makeWord('ÇANTA', 'çan-ta', '4. Grup (Ç-B-G-C-Ş) • Okul eşyalarımızı taşıdığımız çanta 🎒'),
    makeWord('ÇİLEK', 'çi-lek', '4. Grup (Ç-B-G-C-Ş) • Kırmızı kokulu yaz meyvesi 🍓'),
    makeWord('ÇINAR', 'çı-nar', '4. Grup (Ç-B-G-C-Ş) • Uzun ömürlü ulu ağaç 🌳'),
    makeWord('ÇAY', 'çay', '4. Grup (Ç-B-G-C-Ş) • Sıcak içilen demli içecek ☕'),
    makeWord('ÇATAL', 'ça-tal', '4. Grup (Ç-B-G-C-Ş) • Yemek yerken kullandığımız araç 🍴'),
    makeWord('ÇADIR', 'ça-dır', '4. Grup (Ç-B-G-C-Ş) • Kampta kurulan barınak ⛺'),
    makeWord('UÇAK', 'u-çak', '4. Grup (Ç-B-G-C-Ş) • Gökyüzünde uçan hızlı taşıt ✈️'),
    makeWord('SAÇ', 'saç', '4. Grup (Ç-B-G-C-Ş) • Başımızdaki teller 💇'),
    makeWord('ÜÇ', 'üç', '4. Grup (Ç-B-G-C-Ş) • Sayı olan 3 3️⃣'),
    // + B (Sadece 1-3. Grup + Ç, B)
    makeWord('BALIK', 'ba-lık', '4. Grup (Ç-B-G-C-Ş) • Denizde yüzen canlı 🐟'),
    makeWord('BULUT', 'bu-lut', '4. Grup (Ç-B-G-C-Ş) • Gökyüzündeki beyaz pamuk kümesi ☁️'),
    makeWord('BEBEK', 'be-bek', '4. Grup (Ç-B-G-C-Ş) • Küçük sevimli çocuk 👶'),
    makeWord('BARDAK', 'bar-dak', '4. Grup (Ç-B-G-C-Ş) • Su içtiğimiz kap 🥛'),
    makeWord('BAL', 'bal', '4. Grup (Ç-B-G-C-Ş) • Arıların yaptığı tatlı besin 🍯'),
    makeWord('BALON', 'ba-lon', '4. Grup (Ç-B-G-C-Ş) • İçi hava dolu renkli oyuncak 🎈'),
    makeWord('BAYRAK', 'bay-rak', '4. Grup (Ç-B-G-C-Ş) • Ay yıldızlı al bayrağımız 🇹🇷'),
    makeWord('BİBER', 'bi-ber', '4. Grup (Ç-B-G-C-Ş) • Yeşil veya kırmızı sebze 🫑'),
    makeWord('KELEBEK', 'ke-le-bek', '4. Grup (Ç-B-G-C-Ş) • Renkli kanatlı böcek 🦋'),
    makeWord('KABAK', 'ka-bak', '4. Grup (Ç-B-G-C-Ş) • Turuncu veya yeşil sebze 🎃'),
    // + G (Sadece 1-3. Grup + Ç, B, G)
    makeWord('GÖL', 'göl', '4. Grup (Ç-B-G-C-Ş) • Karalar içindeki durgun su 🏞️'),
    makeWord('GÖZLÜK', 'göz-lük', '4. Grup (Ç-B-G-C-Ş) • Daha net görmemizi sağlayan araç 👓'),
    makeWord('GEMİ', 'ge-mi', '4. Grup (Ç-B-G-C-Ş) • Denizde yüzen büyük taşıt 🚢'),
    makeWord('GÜN', 'gün', '4. Grup (Ç-B-G-C-Ş) • 24 saatlik zaman dilimi ☀️'),
    makeWord('GÜL', 'gül', '4. Grup (Ç-B-G-C-Ş) • Güzel kokulu dikenli çiçek 🌹'),
    makeWord('GÖZ', 'göz', '4. Grup (Ç-B-G-C-Ş) • Görme organımız 👀'),
    makeWord('GİTAR', 'gi-tar', '4. Grup (Ç-B-G-C-Ş) • Telli müzik aleti 🎸'),
    makeWord('SİLGİ', 'sil-gi', '4. Grup (Ç-B-G-C-Ş) • Kurşun kalem yazısını silen araç ✏️'),
    makeWord('DERGİ', 'der-gi', '4. Grup (Ç-B-G-C-Ş) • Resimli okuma yayını  magazine'),
    makeWord('GAGALI', 'ga-ga-lı', '4. Grup (Ç-B-G-C-Ş) • Gagası olan kuş 🐦'),
    // + C (Sadece 1-3. Grup + Ç, B, G, C)
    makeWord('CAM', 'cam', '4. Grup (Ç-B-G-C-Ş) • Penceredeki saydam madde 🪟'),
    makeWord('CEVİZ', 'ce-viz', '4. Grup (Ç-B-G-C-Ş) • Sert kabuklu faydalı yemiş 🌰'),
    makeWord('GECE', 'ge-ce', '4. Grup (Ç-B-G-C-Ş) • Ay ve yıldızların çıktığı vakit 🌙'),
    makeWord('BACA', 'ba-ca', '4. Grup (Ç-B-G-C-Ş) • Çatıdaki duman çıkışı 🏠'),
    makeWord('ÇOCUK', 'ço-cuk', '4. Grup (Ç-B-G-C-Ş) • Neşeyle oyun oynayan küçükler 🧒'),
    makeWord('BÖCEK', 'bö-cek', '4. Grup (Ç-B-G-C-Ş) • Doğada yaşayan küçük canlı 🐞'),
    makeWord('CÜCE', 'cü-ce', '4. Grup (Ç-B-G-C-Ş) • Masal kahramanı 🧙'),
    makeWord('CEKET', 'ce-ket', '4. Grup (Ç-B-G-C-Ş) • Üstümüze giydiğimiz giysi 🧥'),
    makeWord('CÜZDAN', 'cüz-dan', '4. Grup (Ç-B-G-C-Ş) • Harçlığımızı koyduğumuz eşya 👛'),
    makeWord('BONCUK', 'bon-cuk', '4. Grup (Ç-B-G-C-Ş) • Renkli delikli süs tanesi 📿'),
    // + Ş (Sadece 1-3. Grup + Ç, B, G, C, Ş)
    makeWord('GÜNEŞ', 'gü-neş', '4. Grup (Ç-B-G-C-Ş) • Isı ve ışık kaynağımız ☀️'),
    makeWord('ŞEKER', 'şe-ker', '4. Grup (Ç-B-G-C-Ş) • Tatlı yiyecek 🍬'),
    makeWord('KUŞ', 'kuş', '4. Grup (Ç-B-G-C-Ş) • Gökyüzünde uçan kanatlı canlı 🐦'),
    makeWord('ŞARKI', 'şar-kı', '4. Grup (Ç-B-G-C-Ş) • Ezgili müzik eseri 🎵'),
    makeWord('ŞEMSİYE', 'şem-si-ye', '4. Grup (Ç-B-G-C-Ş) • Yağmurdan koruyan eşya ☂️'),
    makeWord('TAŞ', 'taş', '4. Grup (Ç-B-G-C-Ş) • Sert kaya parçası 🪨'),
    makeWord('KAŞIK', 'ka-şık', '4. Grup (Ç-B-G-C-Ş) • Çorba içtiğimiz araç 🥄'),
    makeWord('BEŞİK', 'be-şik', '4. Grup (Ç-B-G-C-Ş) • Bebek yatağı 👶'),
    makeWord('ŞİŞE', 'şi-şe', '4. Grup (Ç-B-G-C-Ş) • Su konulan cam kap 🍾'),
    makeWord('GÜMÜŞ', 'gü-müş', '4. Grup (Ç-B-G-C-Ş) • Parlak değerli maden 🥈'),

    // --- 5. GRUP: + P, H, V, Ğ, F, J ---
    // + P (Sadece 1-4. Grup + P)
    makeWord('PARA', 'pa-ra', '5. Grup (P-H-V-Ğ-F-J) • Alışveriş aracı 🪙'),
    makeWord('PENCERE', 'pen-ce-re', '5. Grup (P-H-V-Ğ-F-J) • Odamızı aydınlatan açıklık 🪟'),
    makeWord('TOP', 'top', '5. Grup (P-H-V-Ğ-F-J) • Oyun oynadığımız yuvarlak araç ⚽'),
    makeWord('KAPI', 'ka-pı', '5. Grup (P-H-V-Ğ-F-J) • Odaya girip çıktığımız yer 🚪'),
    makeWord('ŞAPKA', 'şap-ka', '5. Grup (P-H-V-Ğ-F-J) • Başımıza taktığımız giysi 🧢'),
    makeWord('KİTAP', 'ki-tap', '5. Grup (P-H-V-Ğ-F-J) • Okuduğumuz bilgi hazinesi 📚'),
    makeWord('KÖPEK', 'kö-pek', '5. Grup (P-H-V-Ğ-F-J) • Sadık hayvan dostumuz 🐶'),
    makeWord('PAPATYA', 'pa-pat-ya', '5. Grup (P-H-V-Ğ-F-J) • Beyaz yapraklı sarı göbekli çiçek 🌼'),
    makeWord('PEMBE', 'pem-be', '5. Grup (P-H-V-Ğ-F-J) • Canlı açık renk 🌸'),
    makeWord('KÜPE', 'kü-pe', '5. Grup (P-H-V-Ğ-F-J) • Kulağa takılan takı 💎'),
    // + H (Sadece 1-4. Grup + P, H)
    makeWord('HALI', 'ha-lı', '5. Grup (P-H-V-Ğ-F-J) • Yere serilen dokuma eşya 🧶'),
    makeWord('HOROZ', 'ho-roz', '5. Grup (P-H-V-Ğ-F-J) • Sabahları öten kümes hayvanı 🐓'),
    makeWord('BAHÇE', 'bah-çe', '5. Grup (P-H-V-Ğ-F-J) • Çiçek ve ağaç dikilen alan 🏡'),
    makeWord('SABAH', 'sa-bah', '5. Grup (P-H-V-Ğ-F-J) • Güneşin doğduğu gün başlangıcı 🌅'),
    makeWord('TAHTA', 'tah-ta', '5. Grup (P-H-V-Ğ-F-J) • Sınıfımızdaki akıllı tahta 🖥️'),
    makeWord('NEHİR', 'ne-hir', '5. Grup (P-H-V-Ğ-F-J) • Büyük akarsu 🌊'),
    makeWord('ŞEHİR', 'şe-hir', '5. Grup (P-H-V-Ğ-F-J) • Büyük yerleşim yeri 🏙️'),
    makeWord('HEDİYE', 'he-di-ye', '5. Grup (P-H-V-Ğ-F-J) • Sevindirmek için verilen armağan 🎁'),
    makeWord('HIRSIZ'.replace('RSIZ','Z'), 'hız', '5. Grup (P-H-V-Ğ-F-J) • Çabukluk ⚡'),
    makeWord('HİLAL', 'hi-lal', '5. Grup (P-H-V-Ğ-F-J) • Bayrağımızdaki yarım ay 🌙'),
    // + V (Sadece 1-4. Grup + P, H, V)
    makeWord('HAVUÇ', 'ha-vuç', '5. Grup (P-H-V-Ğ-F-J) • Tavşanların sevdiği turuncu sebze 🥕'),
    makeWord('VAZO', 'va-zo', '5. Grup (P-H-V-Ğ-F-J) • Çiçek koyduğumuz kap 🏺'),
    makeWord('VAGON', 'va-gon', '5. Grup (P-H-V-Ğ-F-J) • Trenin yolcu taşıyan bölümü 🚃'),
    makeWord('VALİZ', 'va-liz', '5. Grup (P-H-V-Ğ-F-J) • Yolculuk çantası 🧳'),
    makeWord('GÜVERCİN', 'gü-ver-cin', '5. Grup (P-H-V-Ğ-F-J) • Barış simgesi sevimli kuş 🕊️'),
    makeWord('TAVUK', 'ta-vuk', '5. Grup (P-H-V-Ğ-F-J) • Bize yumurta veren kümes hayvanı 🐔'),
    makeWord('TAVŞAN', 'tav-şan', '5. Grup (P-H-V-Ğ-F-J) • Uzun kulaklı sevimli hayvan 🐰'),
    makeWord('KAVUN', 'ka-vun', '5. Grup (P-H-V-Ğ-F-J) • Güzel kokulu sarı yaz meyvesi 🍈'),
    makeWord('AYVA', 'ay-va', '5. Grup (P-H-V-Ğ-F-J) • Sarı sonbahar meyvesi 🍐'),
    makeWord('EV', 'ev', '5. Grup (P-H-V-Ğ-F-J) • Ailemizle yaşadığımız yuva 🏠'),
    // + Ğ (Sadece 1-4. Grup + P, H, V, Ğ)
    makeWord('DAĞ', 'dağ', '5. Grup (P-H-V-Ğ-F-J) • Yüksek yeryüzü şekli ⛰️'),
    makeWord('AĞAÇ', 'a-ğaç', '5. Grup (P-H-V-Ğ-F-J) • Doğanın yeşil akciğeri 🌳'),
    makeWord('YAĞMUR', 'yağ-mur', '5. Grup (P-H-V-Ğ-F-J) • Bulutlardan düşen su damlaları 🌧️'),
    makeWord('PAPAĞAN', 'pa-pa-ğan', '5. Grup (P-H-V-Ğ-F-J) • Konuşabilen renkli kuş 🦜'),
    makeWord('SOĞAN', 'so-ğan', '5. Grup (P-H-V-Ğ-F-J) • Yemeklere lezzet katan sebze 🧅'),
    makeWord('BAĞ', 'bağ', '5. Grup (P-H-V-Ğ-F-J) • Üzüm bahçesi 🍇'),
    makeWord('KURBAĞA', 'kur-ba-ğa', '5. Grup (P-H-V-Ğ-F-J) • Derede zıplayan yeşil canlı 🐸'),
    makeWord('KAĞIT', 'ka-ğıt', '5. Grup (P-H-V-Ğ-F-J) • Üzerine yazı yazdığımız yaprak 📄'),
    makeWord('YOĞURT', 'yo-ğurt', '5. Grup (P-H-V-Ğ-F-J) • Sütten yapılan sağlıklı besin 🥣'),
    makeWord('İĞNE', 'iğ-ne', '5. Grup (P-H-V-Ğ-F-J) • Dikiş dikmeye yarayan ince araç 🪡'),
    // + F (Sadece 1-4. Grup + P, H, V, Ğ, F)
    makeWord('FİL', 'fil', '5. Grup (P-H-V-Ğ-F-J) • Uzun hortumlu büyük hayvan 🐘'),
    makeWord('FENER', 'fe-ner', '5. Grup (P-H-V-Ğ-F-J) • Karanlığı aydınlatan ışık 🔦'),
    makeWord('FINDIK', 'fın-dık', '5. Grup (P-H-V-Ğ-F-J) • Karadeniz\'in ünlü kuruyemişi 🌰'),
    makeWord('FARE', 'fa-re', '5. Grup (P-H-V-Ğ-F-J) • Peyniri seven küçük kemirgen 🐭'),
    makeWord('FIRIN', 'fı-rın', '5. Grup (P-H-V-Ğ-F-J) • Ekmek pişirilen yer 🥖'),
    makeWord('FİDAN', 'fi-dan', '5. Grup (P-H-V-Ğ-F-J) • Genç ağaç 🌱'),
    makeWord('SINIF', 'sı-nıf', '5. Grup (P-H-V-Ğ-F-J) • Ders işlediğimiz derslik 🏫'),
    makeWord('DEFTER', 'def-ter', '5. Grup (P-H-V-Ğ-F-J) • Yazı yazdığımız yapraklı kitap 📓'),
    makeWord('ZÜRAFA', 'zü-ra-fa', '5. Grup (P-H-V-Ğ-F-J) • Uzun boyunlu sevimli hayvan 🦒'),
    makeWord('ŞEFTALİ', 'şef-ta-li', '5. Grup (P-H-V-Ğ-F-J) • Tüylü sulu yaz meyvesi 🍑'),
    // + J (Tüm 29 Harf)
    makeWord('JET', 'jet', '5. Grup (P-H-V-Ğ-F-J) • Çok hızlı uçak ✈️'),
    makeWord('JÖLE', 'jö-le', '5. Grup (P-H-V-Ğ-F-J) • Yumuşak renkli tatlı 🍮'),
    makeWord('PİJAMA', 'pi-ja-ma', '5. Grup (P-H-V-Ğ-F-J) • Uyurken giydiğimiz rahat giysi 🛌'),
    makeWord('JAGUAR', 'ja-gu-ar', '5. Grup (P-H-V-Ğ-F-J) • Benekli hızlı yırtıcı 🐆'),
    makeWord('BARAJ', 'ba-raj', '5. Grup (P-H-V-Ğ-F-J) • Suların toplandığı büyük bend 🌊'),
    makeWord('GARAJ', 'ga-raj', '5. Grup (P-H-V-Ğ-F-J) • Arabaların park edildiği kapalı yer 🚗'),
    makeWord('BAGAJ', 'ba-gaj', '5. Grup (P-H-V-Ğ-F-J) • Arabanın eşya konulan arka kısmı 🧳'),
    makeWord('MESAJ', 'me-saj', '5. Grup (P-H-V-Ğ-F-J) • Gönderilen kısa yazı, ileti ✉️'),
    makeWord('PLAJ', 'plaj', '5. Grup (P-H-V-Ğ-F-J) • Deniz kıyısındaki kumsal 🏖️'),
    makeWord('JETON', 'je-ton', '5. Grup (P-H-V-Ğ-F-J) • Oyun makinesi parası 🪙')
  ];

  // Tekrarlı kelimeleri temizle
  const UNIQUE_READING1_WORDS = (function () {
    const seen = new Set();
    const list = [];
    for (let i = 0; i < READING1_MASTER_WORDS.length; i++) {
      const it = READING1_MASTER_WORDS[i];
      if (!seen.has(it.label)) {
        seen.add(it.label);
        list.push(it);
      }
    }
    return list;
  })();

  // 5 SINIF SEVİYESİ VE KONU HAVUZU
  const WHEEL_TOPICS = {
    reading1: {
      id: 'reading1',
      tabLabel: '📖 1. Sınıf Okuma',
      badge: '📖 1. Sınıf İlk Okuma ve Hece-Kelime',
      prompt: 'Okun gösterdiği kelimeyi yüksek sesle oku ve hecele!',
      isReadingMode: true,
      items: UNIQUE_READING1_WORDS
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
    activeLetterFilter: 'ALL', // 'ALL' veya seçilen harf ('A', 'N', 'E' vb.)
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

    const sz = sizePx || 210;
    return `
      <div class="moli-visual-clock-wrap" style="display:flex;flex-direction:column;align-items:center;gap:6px;">
        <svg width="${sz}" height="${sz}" viewBox="0 0 220 220" role="img" aria-label="Analog Saat" style="filter:drop-shadow(0 10px 20px rgba(15,23,42,0.22));">
          <circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="#F59E0B"/>
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFFFFF" stroke="#1E293B" stroke-width="5"/>
          ${ticksAndNums}
          <!-- Uzun Yelkovan (Kırmızı) -->
          <line x1="${cx}" y1="${cy}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="#DC2626" stroke-width="6" stroke-linecap="round"/>
          <!-- Kısa Kalın Akrep (Mavi) -->
          <line x1="${cx}" y1="${cy}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#2563EB" stroke-width="9" stroke-linecap="round"/>
          <circle cx="${cx}" cy="${cy}" r="8" fill="#1E293B" stroke="#FFFFFF" stroke-width="2.5"/>
        </svg>
        <div style="display:flex;gap:12px;font-size:0.82rem;font-weight:800;">
          <span style="color:#2563EB;">🔵 Kısa: Akrep (Saat)</span>
          <span style="color:#DC2626;">🔴 Uzun: Yelkovan (Dakika)</span>
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
    const singleSize = wholeCount > 1 ? Math.round((pieSizePx || 175) * 0.78) : (pieSizePx || 175);

    let piesHtml = '';
    let rem = num;
    for (let w = 0; w < wholeCount; w++) {
      const take = Math.min(den, rem);
      rem = Math.max(0, rem - take);
      piesHtml += buildSinglePieSvg(den, take, fillCol, singleSize);
    }

    // Altında eş parçalı Kesir Çubuğu modeli
    const totalCells = wholeCount * den;
    const barW = 240;
    const barH = 26;
    const cellW = barW / totalCells;
    let barRects = '';
    for (let i = 0; i < totalCells; i++) {
      const isFilled = i < num;
      barRects += `<rect x="${(i * cellW).toFixed(1)}" y="0" width="${cellW.toFixed(1)}" height="${barH}" fill="${isFilled ? fillCol : '#F1F5F9'}" stroke="#1E293B" stroke-width="2.2"/>`;
    }

    return `
      <div class="moli-visual-fraction-wrap" style="display:flex;flex-direction:column;align-items:center;gap:8px;">
        <div style="display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;">
          ${piesHtml}
        </div>
        <svg width="${barW}" height="${barH}" viewBox="0 0 ${barW} ${barH}" aria-hidden="true" style="border-radius:8px;overflow:hidden;box-shadow:0 4px 10px rgba(15,23,42,0.14);">
          ${barRects}
        </svg>
        <div style="font-size:0.84rem;font-weight:800;color:#334155;">
          🍕 ${den} eş parçadan <strong>${num}</strong> dilimi boyalı
        </div>
      </div>
    `;
  }

  function toTurkishUpper(str) {
    return String(str || '').toLocaleUpperCase('tr-TR');
  }

  function wordContainsLetter(word, letter) {
    if (!letter || letter === 'ALL') return true;
    return toTurkishUpper(word).includes(toTurkishUpper(letter));
  }

  // KESİN KÜMÜLATİF HARF KONTROLÜ: Kelimedeki BÜTÜN harfler yalnızca izin verilen harfler kümesinde olmalı!
  function isWordStrictlyAllowed(word, allowedSet) {
    const upper = toTurkishUpper(word);
    if (!upper) return false;
    for (let i = 0; i < upper.length; i++) {
      const ch = upper[i];
      if (!allowedSet.has(ch)) {
        return false;
      }
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

  // Seçilen harfi HTML içinde kırmızı ve kalın vurgular
  function formatWordWithHighlightHtml(text, highlightLetter) {
    const raw = String(text || '');
    if (
      wheelState.activeTopicId !== 'reading1' ||
      !highlightLetter ||
      highlightLetter === 'ALL'
    ) {
      return escapeHtml(raw);
    }
    const targetUpper = toTurkishUpper(highlightLetter);
    let out = '';
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (toTurkishUpper(ch) === targetUpper) {
        out += `<span class="mwg-letter-highlight">${escapeHtml(ch)}</span>`;
      } else {
        out += escapeHtml(ch);
      }
    }
    return out;
  }

  function getActiveTopicPool(topicId) {
    const topic = WHEEL_TOPICS[topicId] || WHEEL_TOPICS.reading1;
    if (topicId === 'reading1') {
      const grp = wheelState.activeLetterGroupId || 'g1';
      const letter = wheelState.activeLetterFilter || 'ALL';
      const allowedSet = getCumulativeAllowedSet(grp, letter);

      // 1) Kelimedeki tüm harfler sadece o harfe (veya grubun son harfine) kadar öğrenilen MEB_ORDER harflerinden oluşmalı
      let cumulativePool = UNIQUE_READING1_WORDS.filter((item) =>
        isWordStrictlyAllowed(item.label, allowedSet)
      );

      if (letter !== 'ALL') {
        // 2) Tek bir harf seçildiyse, kelimenin içinde mutlaka o harf geçmeli
        const targetUpper = toTurkishUpper(letter);
        const letterFiltered = cumulativePool.filter((item) =>
          wordContainsLetter(item.label, targetUpper)
        );
        // En yeni/uygun kelimeler önce gelsin diye ters çevirip veya doğrudan ilk 12'sini sun
        if (letterFiltered.length > 0) {
          return letterFiltered.slice(-12).reverse();
        }
      } else {
        // "Tümü" seçildiyse o grubun harflerinden en az birini içeren ve kümülatif kurala %100 uyan kelimeleri öncelikle getir
        const grpObj = READING1_LETTER_GROUPS.find((g) => g.id === grp) || READING1_LETTER_GROUPS[0];
        const grpSet = new Set(grpObj.letters.map((l) => toTurkishUpper(l)));
        const groupFocused = cumulativePool.filter((item) => {
          const w = toTurkishUpper(item.label);
          for (let i = 0; i < w.length; i++) {
            if (grpSet.has(w[i])) return true;
          }
          return false;
        });
        if (groupFocused.length > 0) {
          return groupFocused.slice(0, 12);
        }
      }

      return cumulativePool.slice(0, 12);
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
    const cssSize = 580;
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
      ctx.textBaseline = 'middle';

      const textStr = String(slice.label || '');
      let fontSize = 29;
      if (count <= 6) fontSize = 33;
      if (textStr.length >= 7) fontSize = 25;
      if (textStr.length >= 9) fontSize = 22;

      ctx.font = `900 ${fontSize}px "Fredoka", "Nunito", sans-serif`;
      ctx.lineWidth = 5;
      ctx.lineJoin = 'round';
      const textRadius = sliceRadius - 26;

      const activeLetter =
        wheelState.activeTopicId === 'reading1' &&
        wheelState.activeLetterFilter &&
        wheelState.activeLetterFilter !== 'ALL'
          ? toTurkishUpper(wheelState.activeLetterFilter)
          : null;

      if (!activeLetter || !wordContainsLetter(textStr, activeLetter)) {
        ctx.textAlign = 'right';
        ctx.fillStyle = pal.text;
        ctx.strokeStyle = '#FFFFFF';
        ctx.strokeText(textStr, textRadius, 0);
        ctx.fillText(textStr, textRadius, 0);
      } else {
        // Seçilen harfi dilim üzerinde kırmızı (#DC2626) ve kalın vurgulu çiz
        ctx.textAlign = 'left';
        const chars = Array.from(textStr);
        const charWidths = chars.map((ch) => ctx.measureText(ch).width);
        const totalWidth = charWidths.reduce((acc, w) => acc + w, 0);
        let cursorX = textRadius - totalWidth;

        for (let cIdx = 0; cIdx < chars.length; cIdx++) {
          const ch = chars[cIdx];
          const isMatch = toTurkishUpper(ch) === activeLetter;
          ctx.strokeStyle = isMatch ? '#FEF08A' : '#FFFFFF';
          ctx.lineWidth = isMatch ? 6 : 5;
          ctx.fillStyle = isMatch ? '#DC2626' : pal.text;
          ctx.strokeText(ch, cursorX, 0);
          ctx.fillText(ch, cursorX, 0);
          cursorX += charWidths[cIdx];
        }
      }
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

    let pickedDisplayInnerHtml = `<div class="mwg-picked-value">${formatWordWithHighlightHtml(item.label, wheelState.activeLetterFilter)}</div>`;
    if (wheelState.activeTopicId === 'clock23') {
      pickedDisplayInnerHtml = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          ${buildAnalogClockSvg(item.label, 155)}
          ${wheelState.answerRevealed
            ? `<div class="mwg-picked-value" style="font-size:1.65rem;margin-top:2px;">🕒 ${escapeHtml(item.label)}</div>`
            : `<div style="font-size:0.84rem;font-weight:800;color:#475569;">Analog saate bakarak saati söyle!</div>`
          }
        </div>
      `;
    } else if (wheelState.activeTopicId === 'fractions34') {
      pickedDisplayInnerHtml = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          ${buildFractionModelSvg(item.label, 130)}
          ${wheelState.answerRevealed
            ? `<div class="mwg-picked-value" style="font-size:1.75rem;margin-top:2px;">🍕 ${escapeHtml(item.label)}</div>`
            : `<div style="font-size:0.84rem;font-weight:800;color:#475569;">Boyalı kesir modelini söyle!</div>`
          }
        </div>
      `;
    }

    const answerTitleText = wheelState.activeTopicId === 'clock23'
      ? `🎉 DİJİTAL: ${item.label} • OKUNUŞU:`
      : (wheelState.activeTopicId === 'fractions34'
        ? `🎉 KESİR: ${item.label} • OKUNUŞU VE TÜRÜ:`
        : '🎉 DOĞRU CEVAP:');

    container.innerHTML = `
      <div class="mwg-result-inner ${animatePop ? 'is-popping' : ''}">
        <div class="mwg-result-top-row">
          <span class="mwg-topic-badge">${escapeHtml(topic.badge)}</span>
          <span class="mwg-selected-tag" style="background:${pal.bg}; color:${pal.text}; border-color:${pal.accent};">
            🎯 Seçilen Dilim
          </span>
        </div>

        <p class="mwg-prompt-text">${escapeHtml(topic.prompt)}</p>

        <!-- BÜYÜTÜLMÜŞ SONUÇ DİLİM KUTUSU (Analog Saat / Kesir Pastası / Kelime) -->
        <div class="mwg-picked-display" style="background:${pal.bg}; border-color:${pal.accent}; color:${pal.text};">
          ${pickedDisplayInnerHtml}
        </div>

        ${removedNoticeHtml}

        <!-- CEVAP KUTUSU -->
        <div class="mwg-answer-panel ${wheelState.answerRevealed ? 'is-revealed' : ''}" id="moliWheelAnswerPanel">
          ${wheelState.answerRevealed
            ? `
              <div class="mwg-answer-title">${escapeHtml(answerTitleText)}</div>
              <div class="mwg-answer-main">${formatWordWithHighlightHtml(item.answer, wheelState.activeLetterFilter)}</div>
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

  function renderLetterRowButtons() {
    const row = document.getElementById('moliWheelSingleLettersRow');
    if (!row) return;
    const grpObj = READING1_LETTER_GROUPS.find((g) => g.id === wheelState.activeLetterGroupId) || READING1_LETTER_GROUPS[0];
    const allActive = wheelState.activeLetterFilter === 'ALL';

    const buttonsHtml = [
      `<button class="mwg-single-letter-btn is-all-btn ${allActive ? 'is-active' : ''}"
               type="button"
               data-letter="ALL"
               aria-pressed="${allActive ? 'true' : 'false'}">
         🌟 Tümü
       </button>`
    ].concat(
      grpObj.letters.map((letter) => {
        const active = wheelState.activeLetterFilter === letter;
        return `
          <button class="mwg-single-letter-btn ${active ? 'is-active' : ''}"
                  type="button"
                  data-letter="${escapeHtml(letter)}"
                  aria-pressed="${active ? 'true' : 'false'}">
            ${escapeHtml(letter)}
          </button>
        `;
      })
    );

    row.innerHTML = `
      <span class="mwg-letter-group-label">🎯 Harf Seç:</span>
      ${buttonsHtml.join('')}
    `;

    row.querySelectorAll('.mwg-single-letter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const letter = btn.getAttribute('data-letter') || 'ALL';
        switchSingleLetterFilter(letter);
      });
    });
  }

  function syncLetterGroupsBarUI() {
    const wrapper = document.getElementById('moliWheelReadingSelectorWrap');
    if (wrapper) {
      wrapper.style.display = wheelState.activeTopicId === 'reading1' ? 'flex' : 'none';
    }
    document.querySelectorAll(`#${MODAL_ID} .mwg-letter-group-btn`).forEach((btn) => {
      const active = btn.getAttribute('data-group-id') === wheelState.activeLetterGroupId;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    renderLetterRowButtons();
  }

  function switchSingleLetterFilter(letter) {
    if (wheelState.isSpinning) {
      wheelState.isSpinning = false;
      if (wheelState.animFrameId) cancelAnimationFrame(wheelState.animFrameId);
    }
    wheelState.activeLetterFilter = letter || 'ALL';
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

  function switchLetterGroup(groupId) {
    if (!READING1_LETTER_GROUPS.some((g) => g.id === groupId)) return;
    if (wheelState.isSpinning) {
      wheelState.isSpinning = false;
      if (wheelState.animFrameId) cancelAnimationFrame(wheelState.animFrameId);
    }
    wheelState.activeLetterGroupId = groupId;
    wheelState.activeLetterFilter = 'ALL';
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

      /* 1. Sınıf MEB 2 Satırlı Akıllı Seçici (1. Satır: Harf Grubu, 2. Satır: Tekil Harf) */
      #${MODAL_ID} .mwg-reading-selector-wrap {
        display: flex;
        flex-direction: column;
        background: rgba(15, 23, 42, 0.78);
        border-bottom: 1px solid rgba(253, 224, 71, 0.28);
        flex-shrink: 0;
      }
      #${MODAL_ID} .mwg-letter-groups-bar,
      #${MODAL_ID} .mwg-single-letters-bar {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap;
        overflow-x: auto;
        gap: 6px;
        padding: 5px 14px;
      }
      #${MODAL_ID} .mwg-single-letters-bar {
        background: rgba(2, 6, 23, 0.45);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding: 5px 14px 6px;
      }
      #${MODAL_ID} .mwg-letter-group-label {
        font-size: 0.78rem;
        font-weight: 800;
        color: #FDE047;
        white-space: nowrap;
        margin-right: 4px;
      }
      #${MODAL_ID} .mwg-letter-group-btn {
        padding: 5px 12px;
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
      #${MODAL_ID} .mwg-single-letter-btn {
        min-width: 38px;
        height: 32px;
        padding: 0 12px;
        border-radius: 10px;
        border: 2px solid rgba(255, 255, 255, 0.28);
        border-bottom: 3px solid rgba(15, 23, 42, 0.5);
        background: rgba(255, 255, 255, 0.92);
        color: #1E293B;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.95rem;
        font-weight: 800;
        cursor: pointer;
        touch-action: manipulation;
        transition: all 0.12s ease;
      }
      #${MODAL_ID} .mwg-single-letter-btn:hover {
        transform: translateY(-1px);
        background: #FFFFFF;
      }
      #${MODAL_ID} .mwg-single-letter-btn.is-active {
        background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
        border-color: #FEF08A;
        border-bottom-color: #991B1B;
        color: #FFFFFF;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
        transform: translateY(-1px) scale(1.05);
      }
      #${MODAL_ID} .mwg-letter-highlight {
        color: #DC2626 !important;
        font-weight: 900 !important;
        text-decoration: underline;
        text-decoration-thickness: 3px;
        text-underline-offset: 4px;
      }

      /* Ana Sahne: Merkezde Dev Çark + Sağda Kompakt ve Kibar Sonuç Kartı */
      #${MODAL_ID} .mwg-stage {
        flex: 1;
        display: grid;
        grid-template-columns: 1.5fr 0.7fr;
        align-items: center;
        justify-content: center;
        gap: 24px;
        padding: 10px 24px 14px;
        max-width: 1220px;
        width: 100%;
        margin: 0 auto;
      }

      /* Sol/Merkez: Canvas Çark Bölümü (Merkeze Yakın Dev Çark) */
      #${MODAL_ID} .mwg-wheel-column {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        justify-self: center;
        gap: 10px;
        width: 100%;
      }
      #${MODAL_ID} .mwg-wheel-frame {
        position: relative;
        width: min(62vh, 580px);
        height: min(62vh, 580px);
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
        gap: 8px;
        width: 100%;
      }
      #${MODAL_ID} .mwg-spin-btn {
        width: 100%;
        max-width: 380px;
        padding: 13px 26px;
        border-radius: 20px;
        border: 3px solid #FDE047;
        border-bottom: 6px solid #B45309;
        background: linear-gradient(180deg, #F59E0B 0%, #EA580C 100%);
        color: #FFFFFF;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.2rem, 2vw, 1.45rem);
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
        gap: 10px;
      }
      #${MODAL_ID} .mwg-remove-check-label {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 6px 12px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.94);
        color: #1E293B;
        font-size: 0.88rem;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.22);
      }
      #${MODAL_ID} .mwg-remove-check-label input[type="checkbox"] {
        width: 17px;
        height: 17px;
        accent-color: #EA580C;
        cursor: pointer;
      }
      #${MODAL_ID} .mwg-slice-badge {
        padding: 6px 12px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.18);
        color: #F8FAFC;
        font-size: 0.86rem;
        font-weight: 800;
      }
      #${MODAL_ID} .mwg-reset-slices-btn {
        padding: 6px 12px;
        border-radius: 12px;
        border: 2px solid #7DD3FC;
        background: #E0F2FE;
        color: #0369A1;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.86rem;
        font-weight: 700;
        cursor: pointer;
      }

      /* Sağ Sütun: Kompakt, Dar ve Kibar Sonuç Kartı (max-width: 320px; padding: 16px;) */
      #${MODAL_ID} .mwg-result-card {
        background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
        border: 3px solid #E2E8F0;
        border-bottom: 7px solid #CBD5E1;
        border-radius: 24px;
        padding: 16px;
        max-width: 320px;
        width: 100%;
        justify-self: start;
        box-shadow: 0 18px 42px rgba(15, 23, 42, 0.38);
        min-height: 290px;
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
        padding: 12px 6px;
      }
      #${MODAL_ID} .mwg-empty-wheel-icon {
        font-size: 2.8rem;
        margin-bottom: 6px;
      }
      #${MODAL_ID} .mwg-empty-title {
        margin: 8px 0 6px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.22rem;
        color: #1E1B4B;
      }
      #${MODAL_ID} .mwg-empty-desc {
        margin: 0;
        font-size: 0.88rem;
        font-weight: 700;
        color: #475569;
        line-height: 1.45;
      }

      #${MODAL_ID} .mwg-result-top-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 8px;
      }
      #${MODAL_ID} .mwg-topic-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 999px;
        background: #EEF2FF;
        color: #4338CA;
        font-size: 0.76rem;
        font-weight: 800;
      }
      #${MODAL_ID} .mwg-selected-tag {
        padding: 4px 10px;
        border-radius: 999px;
        border: 1.5px solid;
        font-size: 0.75rem;
        font-weight: 800;
      }
      #${MODAL_ID} .mwg-prompt-text {
        margin: 2px 0 10px;
        font-size: 0.9rem;
        font-weight: 800;
        color: #334155;
      }

      #${MODAL_ID} .mwg-picked-display {
        border: 3.5px solid;
        border-radius: 18px;
        padding: 14px 10px;
        text-align: center;
        margin-bottom: 10px;
        box-shadow: inset 0 2px 8px rgba(255, 255, 255, 0.75), 0 8px 18px rgba(15, 23, 42, 0.1);
      }
      #${MODAL_ID} .mwg-picked-value {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.9rem, 3.2vw, 2.75rem);
        font-weight: 700;
        line-height: 1.1;
        letter-spacing: 0.02em;
      }

      #${MODAL_ID} .mwg-removed-pill {
        margin-bottom: 10px;
        padding: 5px 10px;
        border-radius: 10px;
        background: #FFF7ED;
        border: 1.5px solid #FDBA74;
        color: #C2410C;
        font-size: 0.76rem;
        font-weight: 800;
        text-align: center;
      }

      #${MODAL_ID} .mwg-answer-panel {
        padding: 12px 10px;
        border-radius: 14px;
        background: #F8FAFC;
        border: 2px dashed #CBD5E1;
        text-align: center;
        margin-bottom: 12px;
      }
      #${MODAL_ID} .mwg-answer-panel.is-revealed {
        background: linear-gradient(135deg, #ECFDF5 0%, #FEFCE8 100%);
        border: 2.5px solid #22C55E;
        box-shadow: 0 6px 18px rgba(34, 197, 94, 0.18);
      }
      #${MODAL_ID} .mwg-answer-hidden {
        font-size: 0.84rem;
        font-weight: 700;
        color: #64748B;
      }
      #${MODAL_ID} .mwg-answer-title {
        font-size: 0.78rem;
        font-weight: 800;
        color: #15803D;
        letter-spacing: 0.04em;
        margin-bottom: 4px;
      }
      #${MODAL_ID} .mwg-answer-main {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.25rem, 2.2vw, 1.7rem);
        font-weight: 700;
        color: #166534;
      }
      #${MODAL_ID} .mwg-answer-detail {
        margin-top: 4px;
        font-size: 0.82rem;
        font-weight: 800;
        color: #0F766E;
      }

      #${MODAL_ID} .mwg-result-actions {
        display: grid;
        grid-template-columns: 1fr 1.35fr;
        gap: 8px;
      }
      #${MODAL_ID} .mwg-action-btn {
        padding: 10px 12px;
        border-radius: 14px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.94rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
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

      <!-- 2 Satırlı Akıllı Harf Grubu ve Tekil Harf Seçici -->
      <div class="mwg-reading-selector-wrap" id="moliWheelReadingSelectorWrap">
        <div class="mwg-letter-groups-bar" id="moliWheelLetterGroupsBar" role="toolbar" aria-label="1. Sınıf MEB Harf Grubu Seçimi">
          <span class="mwg-letter-group-label">🔤 Harf Grubu:</span>
          ${letterGroupsHtml}
        </div>
        <div class="mwg-single-letters-bar" id="moliWheelSingleLettersRow" role="toolbar" aria-label="Tekil Harf Seçimi"></div>
      </div>

      <div class="mwg-stage">
        <div class="mwg-wheel-column">
          <div class="mwg-wheel-frame">
            <canvas id="moliWheelCanvas" width="580" height="580" title="Çarkı çevirmek için dokunun"></canvas>
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
    syncLetterGroupsBarUI();
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
