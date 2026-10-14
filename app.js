/**
 * ==========================================================================
 * DERSE Bİ' MOLA (dersebimola.com) - UYGULAMA MOTORU (app.js)
 * MEB FATİH AĞI & PARDUS ETAP AKILLI TAHTA MULTI-TOUCH DÜELLO SİSTEMİ
 * SIFIR HARİCİ KÜTÜPHANE - %100 SAF VANILLA JAVASCRIPT & WEB AUDIO API
 * ==========================================================================
 */

(function () {
  'use strict';

  /* ==========================================================================
     1. UYGULAMA DURUMU (APPLICATION STATE)
     ========================================================================== */
  const state = {
    // Aktif Görünüm: 'lobby' | 'duel'
    currentView: 'lobby',

    // Sınıf Seviyesi: 1, 2, 3 veya 4
    currentGrade: 1,

    // Aktif Oyun Türü: 'math' | 'turkish'
    currentGameType: 'math',

    // Düello Ayarları
    targetScore: 5,
    showAutoExplanation: true,
    soundEnabled: true,

    // Yarışmacı Öğrenci Bilgileri
    player1: {
      name: '1. Öğrenci (Mavi)',
      score: 0,
      avatar: '👦',
      isLocked: false,
      lockTimer: null,
    },
    player2: {
      name: '2. Öğrenci (Kırmızı)',
      score: 0,
      avatar: '👧',
      isLocked: false,
      lockTimer: null,
    },

    // O anki aktif soru nesnesi
    currentQuestion: null,
    questionNumber: 1,
    isQuestionAnswered: false,

    // Öğretmen Oturumu (Simüle Edilmiş Google Login)
    teacherSession: {
      isLoggedIn: false,
      name: '',
      email: '',
    },

    // Sınıf Öğrenci Listesi
    classRoster: [
      'Ali', 'Ayşe', 'Mehmet', 'Fatma', 'Can', 'Zeynep',
      'Yusuf', 'Elif', 'Kerem', 'Defne', 'Emir', 'Asya',
      'Burak', 'Nehir', 'Mert', 'Yağmur', 'Arda', 'Zehra',
      'Umut', 'Ela', 'Efe', 'Ceren', 'Baran', 'Duru'
    ],

    // Özel Soru Bankası (Öğretmenin Ekledikleri)
    customQuestions: [],

    // Sınıf Ligi Maç Geçmişi
    leagueScores: {}
  };

  /* ==========================================================================
     2. SES MOTORU: WEB AUDIO API (SIFIR HARİCİ SES DOSYASI)
     ========================================================================== */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.initOnFirstTouch = this.initOnFirstTouch.bind(this);
      window.addEventListener('pointerdown', this.initOnFirstTouch, { once: true });
      window.addEventListener('keydown', this.initOnFirstTouch, { once: true });
    }

    initOnFirstTouch() {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass && !this.ctx) {
          this.ctx = new AudioContextClass();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      } catch (e) {
        console.warn('Web Audio API başlatılamadı:', e);
      }
    }

    ensureContext() {
      if (!this.ctx) {
        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) this.ctx = new AudioContextClass();
        } catch (e) {
          return false;
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return !!this.ctx;
    }

    // Doğru Cevap: Neşeli, yükselen akor melodisi (C5 -> E5 -> G5 -> C6)
    playCorrect() {
      if (!state.soundEnabled || !this.ensureContext()) return;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    }

    // Yanlış Cevap: Tok, uyarıcı bas sesi
    playWrong() {
      if (!state.soundEnabled || !this.ensureContext()) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    }

    // Zafer Şampiyonluk Melodisi: Görkemli marş motifi
    playVictory() {
      if (!state.soundEnabled || !this.ensureContext()) return;
      const fanfare = [
        { f: 523.25, d: 0.14 }, // C5
        { f: 523.25, d: 0.14 }, // C5
        { f: 523.25, d: 0.14 }, // C5
        { f: 659.25, d: 0.35 }, // E5
        { f: 783.99, d: 0.25 }, // G5
        { f: 1046.50, d: 0.70 } // C6
      ];

      let cur = this.ctx.currentTime + 0.05;
      fanfare.forEach(note => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, cur);

        gain.gain.setValueAtTime(0, cur);
        gain.gain.linearRampToValueAtTime(0.3, cur + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, cur + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(cur);
        osc.stop(cur + note.d + 0.05);
        cur += note.d + 0.04;
      });
    }

    // Kura / Çark Çevirme Tık Sesi
    playTick() {
      if (!state.soundEnabled || !this.ensureContext()) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.04);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    }

    // Buton Tıklama Sesi
    playClick() {
      if (!state.soundEnabled || !this.ensureContext()) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.065);
    }
  }

  const audio = new SoundEngine();

  /* ==========================================================================
     3. DİNAMİK SORU MOTORU (GRADE-BASED QUESTION ENGINE)
     ========================================================================== */
  const QuestionEngine = {
    // -------------------------------------------------------------
    // ANASINIFI (OKUL ÖNCESİ - 4-6 YAŞ) ETKİNLİK HAVUZU
    // -------------------------------------------------------------
    generateKindergartenMath() {
      const mode = Math.floor(Math.random() * 2);
      if (mode === 0) {
        // Sevimli Nesne / Meyve Sayma (1 - 5 arası dev emojiler)
        const fruits = [
          { emoji: '🍎', name: 'Kırmızı Elma' },
          { emoji: '🍌', name: 'Sarı Muz' },
          { emoji: '🍓', name: 'Tatlı Çilek' },
          { emoji: '🍊', name: 'Turuncu Portakal' },
          { emoji: '⭐', name: 'Parlak Yıldız' },
          { emoji: '🎈', name: 'Renkli Balon' },
          { emoji: '🚗', name: 'Sevimli Araba' }
        ];
        const chosen = fruits[Math.floor(Math.random() * fruits.length)];
        const count = Math.floor(Math.random() * 5) + 1; // 1..5
        const display = Array(count).fill(chosen.emoji).join('  ');
        
        const d1 = count === 5 ? '4' : (count + 1).toString();
        const d2 = count === 1 ? '3' : (count - 1).toString();

        return {
          question: `${display}\n\nKaç tane ${chosen.name} var?`,
          correct: `${count} Tane (${chosen.emoji})`,
          distractors: [
            `${d1} Tane (${chosen.emoji})`,
            `${d2} Tane (${chosen.emoji})`
          ],
          explanation: `Birlikte sayalım: Tam ${count} tane ${chosen.name} var! Harikasın! 👏`
        };
      } else {
        // Renkler ve Şekiller
        const shapes = [
          { q: 'Hangisi KIRMIZI renktir? 🔴', correct: '🔴 Kırmızı Daire', d: ['🔵 Mavi Daire', '🟡 Sarı Daire'], exp: 'Kırmızı, elma ve çileğin rengidir! 🍎' },
          { q: 'Hangisi SARI renktir? 🟡', correct: '🟡 Sarı Daire', d: ['🟢 Yeşil Daire', '🟣 Mor Daire'], exp: 'Sarı, parlayan Güneş\'in ve muzun rengidir! ☀️' },
          { q: 'Hangisi MAVİ renktir? 🔵', correct: '🔵 Mavi Daire', d: ['🟠 Turuncu Daire', '🔴 Kırmızı Daire'], exp: 'Mavi, gökyüzünün ve denizlerin rengidir! 🌊' },
          { q: 'Hangisi YEŞİL renktir? 🟢', correct: '🟢 Yeşil Daire', d: ['🔴 Kırmızı Daire', '🟡 Sarı Daire'], exp: 'Yeşil, ağaç yapraklarının ve çimenlerin rengidir! 🌿' },
          { q: 'Hangisi parlayan YILDIZ şeklidir? ⭐', correct: '⭐ Sarı Yıldız', d: ['🔺 Mavi Üçgen', '⬛ Siyah Kare'], exp: 'Gökyüzünde parlayan yıldız tam olarak böyledir! ⭐' },
          { q: 'Hangisi SEVGİ DOLU KALP şeklidir? 💖', correct: '💖 Pembe Kalp', d: ['🟢 Yeşil Daire', '🔺 Turuncu Üçgen'], exp: 'Kalp sevginin ve kucaklaşmanın sembolüdür! 💖' },
          { q: 'Hangisi ÜÇGEN şeklidir? (3 köşesi var)', correct: '🔺 Üçgen', d: ['⚪ Daire', '🟩 Kare'], exp: 'Üçgenin tam 3 köşesi vardır! 🔺' },
          { q: 'Hangisi yuvarlak DAİRE şeklidir? ⭕', correct: '⭕ Daire', d: ['🟩 Kare', '🔺 Üçgen'], exp: 'Daire tıpkı bir top gibi yuvarlaktır! ⚽' }
        ];
        const s = shapes[Math.floor(Math.random() * shapes.length)];
        return {
          question: s.q,
          correct: s.correct,
          distractors: s.d,
          explanation: s.exp
        };
      }
    },

    grade0AnimalsAndNaturePool: [
      { q: 'Hangi sevimli hayvan "MİYAV" der? 🐾', a: '🐱 Kedi', d: ['🐶 Köpek', '🐮 İnek'], exp: 'Kediler sevilmeyi çok sever ve "Miyav" derler! 🐱' },
      { q: 'Hangi sadık dostumuz "HAV HAV" der? 🦴', a: '🐶 Köpek', d: ['🐱 Kedi', '🐥 Civciv'], exp: 'Köpekler kuyruklarını sallayarak "Hav hav" derler! 🐶' },
      { q: 'Ormanların kralı olan yeleli güçlü hayvan hangisidir?', a: '🦁 Aslan', d: ['🐵 Maymun', '🐰 Tavşan'], exp: 'Aslan güçlü kükremesiyle ormanların kralıdır! 🦁' },
      { q: 'Havuç yemeyi çok seven, uzun kulaklı zıp zıp hayvan hangisidir? 🥕', a: '🐰 Tavşan', d: ['🐻 Ayı', '🐸 Kurbağa'], exp: 'Tavşanlar zıp zıp zıplar ve çıtır çıtır havuç yer! 🐰' },
      { q: 'Mavi denizlerde yüzgeçleriyle yüzen sevimli canlı hangisidir? 🌊', a: '🐟 Balık', d: ['🐦 Kuş', '🐱 Kedi'], exp: 'Balıklar suda yüzer ve solungaçlarıyla nefes alır! 🐟' },
      { q: 'Gökyüzünde kanat çırparak uçan ve "Cik cik" öten hangisidir? 🌳', a: '🐦 Kuş', d: ['🐢 Kaplumbağa', '🐶 Köpek'], exp: 'Kuşlar kanatlarını açıp gökyüzünde süzülür! 🐦' },
      { q: 'Hangisi ÇOK DAHA BÜYÜKTÜR ve kocaman bir hortumu vardır?', a: '🐘 Koca Fil', d: ['🐭 Küçük Fare', '🐜 Minik Karınca'], exp: 'Fil dünyanın en büyük ve en güçlü kara hayvanıdır! 🐘' },
      { q: 'Gündüzleri gökyüzümüzü aydınlatan ve ısıtan sıcacık dostumuz hangisidir?', a: '☀️ Parlak Güneş', d: ['🌙 Gece Ayı', '🌧️ Yağmur Bulutu'], exp: 'Güneş her sabah doğar ve dünyamızı ısıtır! ☀️' },
      { q: 'Bize lezzetli ve sağlıklı taze süt veren sevimli hayvan hangisidir? 🥛', a: '🐮 İnek', d: ['🦁 Aslan', '🐺 Kurt'], exp: 'İnekler "Mööö" der ve bize bembeyaz süt verir! 🥛' },
      { q: 'Hangisi tatlı, kırmızı ve çok lezzetli bir yaz meyvesidir?', a: '🍓 Çilek', d: ['🧅 Soğan', '🥔 Patates'], exp: 'Çilek minik noktalı, kırmızı çok tatlı bir meyvedir! 🍓' },
      { q: 'Derelerde "VAK VAK" diyerek neşeyle zıplayan yeşil dostumuz hangisidir?', a: '🐸 Kurbağa', d: ['🦊 Tilki', '🐴 At'], exp: 'Kurbağalar nilüfer yapraklarının üstünde zıplar! 🐸' }
    ],

    // -------------------------------------------------------------
    // 1. SINIF SORU HAVUZU VE DİNAMİK ÜRETECİ
    // -------------------------------------------------------------
    generateGrade1Math() {
      const type = Math.floor(Math.random() * 3);
      if (type === 0) {
        // 20'ye kadar basit toplama
        const a = Math.floor(Math.random() * 11) + 2; // 2..12
        const b = Math.floor(Math.random() * (20 - a)) + 1;
        const ans = a + b;
        return {
          question: `${a} + ${b} = ?`,
          correct: ans.toString(),
          distractors: [
            (ans + (Math.random() > 0.5 ? 1 : 2)).toString(),
            Math.max(1, ans - (Math.random() > 0.5 ? 1 : 2)).toString()
          ],
          explanation: `${a} sayısına ${b} eklediğimizde sonuç ${ans} olur.`
        };
      } else if (type === 1) {
        // 20'ye kadar basit çıkarma
        const a = Math.floor(Math.random() * 12) + 8; // 8..19
        const b = Math.floor(Math.random() * (a - 2)) + 1;
        const ans = a - b;
        return {
          question: `${a} - ${b} = ?`,
          correct: ans.toString(),
          distractors: [
            (ans + 1).toString(),
            Math.max(0, ans - 1).toString()
          ],
          explanation: `${a} sayısından ${b} geriye doğru saydığımızda ${ans} kalır.`
        };
      } else {
        // Ritmik sayma (2'şer, 5'er, 10'ar)
        const step = [2, 5, 10][Math.floor(Math.random() * 3)];
        const start = step;
        const s1 = start;
        const s2 = start + step;
        const s3 = start + step * 2;
        const ans = start + step * 3;
        return {
          question: `${s1} - ${s2} - ${s3} - ?`,
          correct: ans.toString(),
          distractors: [(ans + step).toString(), (ans - 1).toString()],
          explanation: `Sayılar ${step}'şer ritmik olarak artmaktadır. ${s3}'ten sonra ${ans} gelir.`
        };
      }
    },

    grade1TurkishPool: [
      { q: '"Büyük" kelimesinin zıt anlamlısı nedir?', a: 'Küçük', d: ['İri', 'Geniş'], exp: 'Büyük ve Küçük birbirinin tam karşıtı olan zıt kavramlardır.' },
      { q: '"Uzun" kelimesinin zıt anlamlısı nedir?', a: 'Kısa', d: ['İnce', 'Düz'], exp: 'Uzun boyun zıttı kısa boydur.' },
      { q: '"Sıcak" kelimesinin zıt anlamlısı nedir?', a: 'Soğuk', d: ['Ilık', 'Buz'], exp: 'Sıcak havanın zıttı soğuk havadır.' },
      { q: '"Hızlı" kelimesinin zıt anlamlısı nedir?', a: 'Yavaş', d: ['Durgun', 'Sakin'], exp: 'Tavşan hızlıdır, kaplumbağa ise yavaştır.' },
      { q: '"Açık" kelimesinin zıt anlamlısı nedir?', a: 'Kapalı', d: ['Koyu', 'Kilitli'], exp: 'Açık kapının karşıtı kapalı kapıdır.' },
      { q: '"Dolu" kelimesinin zıt anlamlısı nedir?', a: 'Boş', d: ['Yarım', 'Temiz'], exp: 'Dolu bardağın karşıtı boş bardaktır.' },
      { q: '"Gece" kelimesinin zıt anlamlısı nedir?', a: 'Gündüz', d: ['Akşam', 'Sabah'], exp: 'Güneş battığında gece, doğduğunda gündüz olur.' },
      { q: '"Ağır" kelimesinin zıt anlamlısı nedir?', a: 'Hafif', d: ['Küçük', 'Yumuşak'], exp: 'Fil ağırdır, kuş tüyü ise hafiftir.' },
      { q: '"Ön" kelimesinin zıt anlamlısı nedir?', a: 'Arka', d: ['Yan', 'Üst'], exp: 'Ön tarafın zıttı arka taraftır.' },
      { q: 'Hangisi bir sesli (ünlü) harftir?', a: 'A', d: ['B', 'K'], exp: 'Alfabemizdeki ünlü harfler: A, E, I, İ, O, Ö, U, Ü.' },
      { q: '"KALEM" kelimesi kaç harflidir?', a: '5', d: ['4', '6'], exp: 'K-A-L-E-M kelimesi 5 harften oluşur.' },
      { q: 'Hangi hayvan havada uçar?', a: 'Kuş', d: ['Kedi', 'Balık'], exp: 'Kuşların kanatları vardır ve uçabilirler.' }
    ],

    // -------------------------------------------------------------
    // 2. SINIF SORU HAVUZU VE DİNAMİK ÜRETECİ
    // -------------------------------------------------------------
    generateGrade2Math() {
      const type = Math.floor(Math.random() * 3);
      if (type === 0) {
        // İki basamaklı eldeli/eldesiz toplama
        const a = Math.floor(Math.random() * 45) + 15;
        const b = Math.floor(Math.random() * 35) + 12;
        const ans = a + b;
        return {
          question: `${a} + ${b} = ?`,
          correct: ans.toString(),
          distractors: [(ans + 10).toString(), (ans - 2).toString()],
          explanation: `${a} + ${b}: Birlikleri topla (${a%10}+${b%10}), onlukları ekle -> Sonuç: ${ans}.`
        };
      } else if (type === 1) {
        // İki basamaklı çıkarma
        const a = Math.floor(Math.random() * 40) + 50; // 50..89
        const b = Math.floor(Math.random() * 30) + 12; // 12..41
        const ans = a - b;
        return {
          question: `${a} - ${b} = ?`,
          correct: ans.toString(),
          distractors: [(ans + 2).toString(), (ans - 10).toString()],
          explanation: `${a} sayısından ${b} çıkarıldığında fark ${ans} olur.`
        };
      } else {
        // Ritmik sayma (3'er veya 4'er)
        const step = Math.random() > 0.5 ? 3 : 4;
        const start = step * (Math.floor(Math.random() * 4) + 1);
        const s1 = start;
        const s2 = start + step;
        const s3 = start + step * 2;
        const ans = start + step * 3;
        return {
          question: `${s1} - ${s2} - ${s3} - ?`,
          correct: ans.toString(),
          distractors: [(ans + step).toString(), (ans - 2).toString()],
          explanation: `Sayılar ${step}'er ritmik sayma kuralına göre ilerliyor. Doğru cevap: ${ans}.`
        };
      }
    },

    grade2TurkishPool: [
      { q: '"Siyah" kelimesinin eş anlamlısı nedir?', a: 'Kara', d: ['Karanlık', 'Koyu'], exp: 'Siyah ile Kara aynı anlama gelen eş anlamlı kelimelerdir.' },
      { q: '"Beyaz" kelimesinin eş anlamlısı nedir?', a: 'Ak', d: ['Açık', 'Parlak'], exp: 'Beyaz bayrak yerine ak bayrak da diyebiliriz.' },
      { q: '"Kırmızı" kelimesinin eş anlamlısı nedir?', a: 'Al', d: ['Bordo', 'Pembe'], exp: 'Al bayrak göklerde dalgalanıyor cümlesinde "al", kırmızı demektir.' },
      { q: '"Doktor" kelimesinin eş anlamlısı nedir?', a: 'Hekim', d: ['Hemşire', 'Eczacı'], exp: 'Doktor ve Hekim hastaları tedavi eden meslek için eş anlamlıdır.' },
      { q: '"Talebe" kelimesinin eş anlamlısı nedir?', a: 'Öğrenci', d: ['Öğretmen', 'Müdür'], exp: 'Eski dilde talebe, günümüzde öğrenci kelimesi kullanılır.' },
      { q: '"Cevap" kelimesinin eş anlamlısı nedir?', a: 'Yanıt', d: ['Soru', 'Mesaj'], exp: 'Sorunun cevabı ile sorunun yanıtı aynı şeydir.' },
      { q: '"Mektep" kelimesinin eş anlamlısı nedir?', a: 'Okul', d: ['Sınıf', 'Kütüphane'], exp: 'Mektep, okul kelimesinin eş anlamlısıdır.' },
      { q: '"Vatan" kelimesinin eş anlamlısı nedir?', a: 'Yurt', d: ['Şehir', 'Dünya'], exp: 'Vatanımız Türkiye, Yurdumuz Türkiye demektir.' },
      { q: '"Yaşlı" kelimesinin zıt anlamlısı nedir?', a: 'Genç', d: ['Çocuk', 'Taze'], exp: 'Yaşlı bir dedenin zıttı genç bir delikanlıdır.' },
      { q: '"Taze" kelimesinin zıt anlamlısı nedir?', a: 'Bayat', d: ['Çürük', 'Eski'], exp: 'Taze ekmeğin karşıtı bayat ekmektir.' },
      { q: '"Pahalı" kelimesinin zıt anlamlısı nedir?', a: 'Ucuz', d: ['Bedava', 'Basit'], exp: 'Fiyatı yüksek olan pahalıdır, düşük olan ucuzdur.' },
      { q: '"Cesur" kelimesinin zıt anlamlısı nedir?', a: 'Korkak', d: ['Zayıf', 'Ürkek'], exp: 'Cesur yüreğin zıttı korkak davranmaktır.' }
    ],

    // -------------------------------------------------------------
    // 3. SINIF SORU HAVUZU VE DİNAMİK ÜRETECİ
    // -------------------------------------------------------------
    generateGrade3Math() {
      const type = Math.floor(Math.random() * 3);
      if (type === 0) {
        // Çarpım Tablosu Düellosu (2'lerden 9'lara kadar dinamik)
        const a = Math.floor(Math.random() * 8) + 2; // 2..9
        const b = Math.floor(Math.random() * 8) + 2; // 2..9
        const ans = a * b;
        return {
          question: `${a} × ${b} = ?`,
          correct: ans.toString(),
          distractors: [
            (ans + (Math.random() > 0.5 ? a : b)).toString(),
            Math.max(2, ans - (Math.random() > 0.5 ? a : b)).toString()
          ],
          explanation: `${a} kere ${b} = ${ans} eder. Çarpma, tekrarlı toplama işlemidir.`
        };
      } else if (type === 1) {
        // Basit bölme işlemi
        const div = Math.floor(Math.random() * 7) + 3; // 3..9
        const quot = Math.floor(Math.random() * 8) + 2; // 2..9
        const dividend = div * quot;
        return {
          question: `${dividend} ÷ ${div} = ?`,
          correct: quot.toString(),
          distractors: [(quot + 1).toString(), Math.max(1, quot - 1).toString()],
          explanation: `${dividend} sayısını ${div} eşit parçaya bölersek her parçada ${quot} bulunur.`
        };
      } else {
        // 3 basamaklı sayılarda basamak değeri
        const hundreds = Math.floor(Math.random() * 8) + 1;
        const tens = Math.floor(Math.random() * 8) + 1;
        const ones = Math.floor(Math.random() * 9);
        const number = hundreds * 100 + tens * 10 + ones;
        const askTens = Math.random() > 0.5;

        if (askTens) {
          return {
            question: `${number} sayısındaki ${tens} rakamının basamak değeri kaçtır?`,
            correct: (tens * 10).toString(),
            distractors: [tens.toString(), (tens * 100).toString()],
            explanation: `${tens} rakamı onlar basamağında olduğu için değeri ${tens} × 10 = ${tens * 10}'dur.`
          };
        } else {
          return {
            question: `${number} sayısındaki ${hundreds} rakamının basamak değeri kaçtır?`,
            correct: (hundreds * 100).toString(),
            distractors: [(hundreds * 10).toString(), hundreds.toString()],
            explanation: `${hundreds} rakamı yüzler basamağında olduğu için basamak değeri ${hundreds * 100}'dür.`
          };
        }
      }
    },

    grade3TurkishSciencePool: [
      { q: 'Dünya\'nın kendi etrafında 1 tam tur dönmesiyle ne oluşur?', a: 'Bir Gün (Gece-Gündüz)', d: ['Bir Yıl (Mevsimler)', 'Bir Ay'], exp: 'Dünya kendi etrafında 24 saatte döner ve gece ile gündüz oluşur.' },
      { q: 'Hangisi doğal bir ışık kaynağıdır?', a: 'Güneş', d: ['Mum', 'El Feneri'], exp: 'Güneş kendiliğinden ışık yayan devasa doğal bir ışık kaynağımızdır.' },
      { q: '"Yüz" kelimesi hangi özelliği gösterir?', a: 'Eş Sesli (Sesteş)', d: ['Zıt Anlamlı', 'Eş Anlamlı'], exp: '"Yüz" hem sayı (100), hem çehre/surat, hem de suda yüzmek anlamına gelir.' },
      { q: '"Gül" kelimesi hangi özelliği gösterir?', a: 'Eş Sesli (Sesteş)', d: ['Zıt Anlamlı', 'Kök Kelime'], exp: '"Gül" hem güzel kokulu bir çiçek, hem de gülümsemek eylemidir.' },
      { q: 'Kuvvet uygulandığında şekil değiştiren, bırakılınca eski haline dönen cisimlere ne denir?', a: 'Esnek Madde', d: ['Kırılgan Madde', 'Sert Madde'], exp: 'Sünger ve lastik esnek maddelere harika birer örnektir.' },
      { q: 'Hangisi canlı bir varlıktır?', a: 'Ağaç', d: ['Taş', 'Toprak'], exp: 'Bitkiler ve ağaçlar büyür, beslenir ve solunum yapar; canlıdır.' },
      { q: 'Işık ve ses yayılırken hangisi daha hızlı hareket eder?', a: 'Işık', d: ['Ses', 'İkisi de Aynı'], exp: 'Işık sesten çok daha hızlıdır. Bu yüzden şimşek önce görülür, gök gürültüsü sonra duyulur!' },
      { q: '"Çay" kelimesi kaç farklı temel anlama sahiptir?', a: 'Eş Sesli (2 Anlam)', d: ['Tek Anlamlı', 'Zıt Anlamlı'], exp: 'İçtiğimiz sıcak çay ve dereden büyük küçük akarsu (çay) eş seslidir.' }
    ],

    // -------------------------------------------------------------
    // 4. SINIF SORU HAVUZU VE DİNAMİK ÜRETECİ
    // -------------------------------------------------------------
    generateGrade4Math() {
      const type = Math.floor(Math.random() * 3);
      if (type === 0) {
        // Dört işlem zihinden hesaplama hızı
        const a = [25, 50, 75, 12, 15, 20][Math.floor(Math.random() * 6)];
        const b = [2, 4, 3, 5][Math.floor(Math.random() * 4)];
        const ans = a * b;
        return {
          question: `${a} × ${b} = ?`,
          correct: ans.toString(),
          distractors: [(ans + 10).toString(), (ans - a).toString()],
          explanation: `Zihinden hesaplama: ${a} sayısını ${b} ile çarptığımızda ${ans} elde ederiz.`
        };
      } else if (type === 1) {
        // Kesirler (Basit birim kesir / hesaplama)
        const total = [24, 32, 40, 48, 60][Math.floor(Math.random() * 5)];
        const denom = 4;
        const ans = total / denom;
        return {
          question: `${total} sayısının 1/4'ü (çeyreği) kaçtır?`,
          correct: ans.toString(),
          distractors: [(ans + 2).toString(), (total / 2).toString()],
          explanation: `Bir sayının 1/4'ünü (çeyreğini) bulmak için o sayıyı 4'e böleriz: ${total} ÷ 4 = ${ans}.`
        };
      } else {
        // Geometri / Açı Türleri
        const angles = [
          { q: 'Ölçüsü 90 dereceden küçük olan açılara ne denir?', a: 'Dar Açı', d: ['Geniş Açı', 'Dik Açı'], exp: '0° ile 90° arasındaki açılara dar açı denir.' },
          { q: 'Ölçüsü tam 90 derece olan açıya ne denir?', a: 'Dik Açı', d: ['Dar Açı', 'Doğru Açı'], exp: 'Köşe açısı tam 90 derece olan açılara dik açı adı verilir.' },
          { q: 'Ölçüsü 90 dereceden büyük, 180\'den küçük açılara ne denir?', a: 'Geniş Açı', d: ['Dar Açı', 'Tam Açı'], exp: '90° ile 180° arasındaki açılar geniş açıdır.' },
          { q: 'Bir üçgenin iç açıları toplamı kaç derecedir?', a: '180°', d: ['90°', '360°'], exp: 'Tüm üçgenlerin iç açıları toplamı her zaman 180 derecedir.' }
        ];
        const chosen = angles[Math.floor(Math.random() * angles.length)];
        return {
          question: chosen.q,
          correct: chosen.a,
          distractors: chosen.d,
          explanation: chosen.exp
        };
      }
    },

    grade4TurkishSocialPool: [
      { q: '"Etekleri zil çalmak" deyimi ne anlama gelir?', a: 'Çok sevinmek', d: ['Korkmak', 'Öfkelenmek'], exp: 'Büyük bir müjde veya mutluluk karşısında aşırı sevinmeyi ifade eder.' },
      { q: '"Göz gezdirmek" deyimi ne anlama gelir?', a: 'Kısaca, derinleşmeden bakmak', d: ['Gözü bozulmak', 'Dikkatle ezberlemek'], exp: 'Bir kitaba veya nesneye derinlemesine dalmadan yüzeysel bakmaktır.' },
      { q: '"Burnu havada olmak" deyimi ne anlama gelir?', a: 'Kibirlenmek / Kendini beğenmek', d: ['Çok uzun boylu olmak', 'Hızlı koşmak'], exp: 'Başkalarını küçük gören, kibirli insanlara burnu havada denir.' },
      { q: '"Ağzı kulaklarına varmak" deyimi ne anlama gelir?', a: 'Çok mutlu olmak', d: ['Şaşkına dönmek', 'Yorulmak'], exp: 'Gülümsemekten ağzı yanaklarına kadar açılacak kadar çok sevinmektir.' },
      { q: '"Pireyi deve yapmak" deyimi ne anlama gelir?', a: 'Küçük bir olayı çok büyütmek', d: ['Hayvanları sevmek', 'Çok çalışmak'], exp: 'Önemsiz ve ufak bir sorunu abartarak büyük bir dert haline getirmektir.' },
      { q: 'Pusulanın renkli (kırmızı) ucu daima hangi yönü gösterir?', a: 'Kuzey', d: ['Güney', 'Doğu'], exp: 'Pusula ibresinin renkli ucu Dünya\'nın manyetik kuzey kutbunu işaret eder.' },
      { q: 'Bir yerin kuş bakışı görünüşünün kaba taslak ölçüsüz çizimine ne denir?', a: 'Kroki', d: ['Harita', 'Plan'], exp: 'Ölçeksiz, kaba taslak çizimlere kroki adı verilir.' },
      { q: 'Kurtuluş Savaşı\'nda Doğu Cephesi komutanımız kimdir?', a: 'Kazım Karabekir', d: ['İsmet İnönü', 'Fevzi Çakmak'], exp: 'Doğu Cephesi kahramanımız ve yetimlerin babası Kazım Karabekir Paşa\'dır.' }
    ],

    // Şıkları rastgele karıştırarak A, B, C formatında sun
    buildQuestionItem(qData, category) {
      const options = [qData.correct, ...qData.distractors];
      // Karıştır (Fisher-Yates)
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      return {
        question: qData.question,
        options: options,
        correct: qData.correct,
        explanation: qData.explanation,
        category: category
      };
    },

    // İstenen sınıf ve türe göre bir soru getir
    getNextQuestion(grade, gameType) {
      // 1. Önce öğretmenin eklediği özel soru var mı kontrol et (varsa %40 ihtimalle araya serpiştir)
      const matchingCustom = state.customQuestions.filter(
        q => parseInt(q.grade, 10) === parseInt(grade, 10) && q.category === gameType
      );
      if (matchingCustom.length > 0 && Math.random() < 0.4) {
        const cq = matchingCustom[Math.floor(Math.random() * matchingCustom.length)];
        return this.buildQuestionItem({
          question: cq.question,
          correct: cq.correct,
          distractors: [cq.wrong1, cq.wrong2],
          explanation: cq.explanation || 'Bu soru öğretmeniniz tarafından hazırlanmıştır.'
        }, gameType === 'math' ? '📐 Matematik' : '📚 Türkçe & Dikkat');
      }

      // 2. Yerleşik Dinamik Motor
      const g = parseInt(grade, 10);
      if (gameType === 'math') {
        let raw;
        if (g === 0) raw = this.generateKindergartenMath();
        else if (g === 1) raw = this.generateGrade1Math();
        else if (g === 2) raw = this.generateGrade2Math();
        else if (g === 3) raw = this.generateGrade3Math();
        else raw = this.generateGrade4Math();
        return this.buildQuestionItem(raw, g === 0 ? '🎨 Renkler & Sayma' : '📐 Matematik Düellosu');
      } else {
        // Türkçe & Dikkat & Doğa
        let pool;
        if (g === 0) pool = this.grade0AnimalsAndNaturePool;
        else if (g === 1) pool = this.grade1TurkishPool;
        else if (g === 2) pool = this.grade2TurkishPool;
        else if (g === 3) pool = this.grade3TurkishSciencePool;
        else pool = this.grade4TurkishSocialPool;

        const raw = pool[Math.floor(Math.random() * pool.length)];
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, g === 0 ? '🦁 Hayvanlar & Doğa' : '📚 Türkçe & Dikkat Avcısı');
      }
    }
  };

  /* ==========================================================================
     4. KONFETİ SİSTEMİ: CANVAS PARTİKÜL MOTORU
     ========================================================================== */
  class ConfettiCanon {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.particles = [];
      this.animId = null;
      this.resize = this.resize.bind(this);
      window.addEventListener('resize', this.resize);
      this.resize();
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    burst() {
      if (!this.canvas || !this.ctx) return;
      this.resize();
      this.particles = [];
      const colors = ['#f59e0b', '#38bdf8', '#ef4444', '#10b981', '#ec4899', '#8b5cf6', '#ffffff'];

      for (let i = 0; i < 180; i++) {
        this.particles.push({
          x: this.canvas.width / 2 + (Math.random() - 0.5) * 200,
          y: this.canvas.height / 2 + (Math.random() - 0.5) * 100,
          w: Math.random() * 12 + 6,
          h: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          vx: (Math.random() - 0.5) * 18,
          vy: Math.random() * -18 - 4,
          gravity: 0.35,
          rot: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 12,
          opacity: 1
        });
      }

      if (this.animId) cancelAnimationFrame(this.animId);
      this.loop = this.loop.bind(this);
      this.animId = requestAnimationFrame(this.loop);
    }

    loop() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      let alive = 0;
      for (let p of this.particles) {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        p.opacity -= 0.005;

        if (p.opacity > 0 && p.y < this.canvas.height + 50) {
          alive++;
          this.ctx.save();
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate((p.rot * Math.PI) / 180);
          this.ctx.globalAlpha = Math.max(0, p.opacity);
          this.ctx.fillStyle = p.color;
          this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          this.ctx.restore();
        }
      }

      if (alive > 0) {
        this.animId = requestAnimationFrame(this.loop);
      } else {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    stop() {
      if (this.animId) cancelAnimationFrame(this.animId);
      if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /* ==========================================================================
     5. YEREL DEPOLAMA (LOCALSTORAGE) YÖNETİCİSİ
     ========================================================================== */
  const StorageManager = {
    KEYS: {
      TEACHER: 'dersebimola_teacher',
      ROSTER: 'dersebimola_roster',
      CUSTOM_Q: 'dersebimola_custom_questions',
      LEAGUE: 'dersebimola_league',
      SETTINGS: 'dersebimola_settings'
    },

    loadAll() {
      try {
        const teacher = localStorage.getItem(this.KEYS.TEACHER);
        if (teacher) state.teacherSession = JSON.parse(teacher);

        const roster = localStorage.getItem(this.KEYS.ROSTER);
        if (roster) state.classRoster = JSON.parse(roster);

        const customQ = localStorage.getItem(this.KEYS.CUSTOM_Q);
        if (customQ) state.customQuestions = JSON.parse(customQ);

        const league = localStorage.getItem(this.KEYS.LEAGUE);
        if (league) state.leagueScores = JSON.parse(league);

        const settings = localStorage.getItem(this.KEYS.SETTINGS);
        if (settings) {
          const parsed = JSON.parse(settings);
          if (parsed.targetScore) state.targetScore = parsed.targetScore;
          if (parsed.soundEnabled !== undefined) state.soundEnabled = parsed.soundEnabled;
          if (parsed.showAutoExplanation !== undefined) state.showAutoExplanation = parsed.showAutoExplanation;
        }
      } catch (e) {
        console.warn('LocalStorage yükleme hatası:', e);
      }
    },

    saveTeacher() {
      try { localStorage.setItem(this.KEYS.TEACHER, JSON.stringify(state.teacherSession)); } catch (e) {}
    },
    saveRoster() {
      try { localStorage.setItem(this.KEYS.ROSTER, JSON.stringify(state.classRoster)); } catch (e) {}
    },
    saveCustomQuestions() {
      try { localStorage.setItem(this.KEYS.CUSTOM_Q, JSON.stringify(state.customQuestions)); } catch (e) {}
    },
    saveLeague() {
      try { localStorage.setItem(this.KEYS.LEAGUE, JSON.stringify(state.leagueScores)); } catch (e) {}
    },
    saveSettings() {
      try {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify({
          targetScore: state.targetScore,
          soundEnabled: state.soundEnabled,
          showAutoExplanation: state.showAutoExplanation
        }));
      } catch (e) {}
    }
  };

  /* ==========================================================================
     6. DOM SEÇİCİLERİ VE ARAYÜZ ELEMANLARI
     ========================================================================== */
  const DOM = {
    // Görünümler
    viewLobby: document.getElementById('viewLobby'),
    viewDuel: document.getElementById('viewDuel'),
    victoryOverlay: document.getElementById('victoryOverlay'),

    // Header & Butonlar
    logoBtn: document.getElementById('logoBtn'),
    gradeChips: document.querySelectorAll('.grade-chip'),
    gradeCards: document.querySelectorAll('.grade-card'),
    btnToggleSound: document.getElementById('btnToggleSound'),
    iconSoundOn: document.querySelector('.icon-sound-on'),
    iconSoundOff: document.querySelector('.icon-sound-off'),
    btnToggleFullscreen: document.getElementById('btnToggleFullscreen'),
    iconFsEnter: document.querySelector('.icon-fullscreen-enter'),
    iconFsExit: document.querySelector('.icon-fullscreen-exit'),
    btnTeacherAuth: document.getElementById('btnTeacherAuth'),
    authBtnText: document.getElementById('authBtnText'),
    authIcon: document.getElementById('authIcon'),

    // Pro Butonlar
    btnOpenPicker: document.getElementById('btnOpenPicker'),
    btnOpenCustomQ: document.getElementById('btnOpenCustomQ'),
    btnOpenLeaderboard: document.getElementById('btnOpenLeaderboard'),

    // Lobi Elemanları
    lobbyP1Name: document.getElementById('lobbyPlayer1Name'),
    lobbyP2Name: document.getElementById('lobbyPlayer2Name'),
    btnQuickDraw: document.getElementById('btnQuickDrawPlayers'),
    btnStartMath: document.getElementById('btnStartMathGame'),
    btnStartTurkish: document.getElementById('btnStartTurkishGame'),
    btnLaunchMathCard: document.getElementById('btnLaunchMath'),
    btnLaunchTurkishCard: document.getElementById('btnLaunchTurkish'),
    targetScoreBtns: document.querySelectorAll('.score-btn'),
    chkAutoExplanation: document.getElementById('chkAutoExplanation'),

    // Düello HUD
    btnExitDuel: document.getElementById('btnExitDuel'),
    duelGradeBadge: document.getElementById('duelGradeBadge'),
    duelGameTypeBadge: document.getElementById('duelGameTypeBadge'),
    duelRoundBadge: document.getElementById('duelRoundBadge'),
    btnToggleSolutionNow: document.getElementById('btnToggleSolutionNow'),
    btnSkipQuestion: document.getElementById('btnSkipQuestion'),

    // Düello: Oyuncu 1 (Mavi)
    p1Panel: document.getElementById('playerPanel1'),
    duelP1Name: document.getElementById('duelP1Name'),
    p1ScoreBadge: document.getElementById('p1ScoreBadge'),
    p1StarsTrack: document.getElementById('p1StarsTrack'),
    p1QuestionCard: document.getElementById('p1QuestionCard'),
    p1QuestionCategory: document.getElementById('p1QuestionCategory'),
    p1QuestionText: document.getElementById('p1QuestionText'),
    p1OptA: document.getElementById('p1OptA'),
    p1OptB: document.getElementById('p1OptB'),
    p1OptC: document.getElementById('p1OptC'),
    p1OptTextA: document.getElementById('p1OptTextA'),
    p1OptTextB: document.getElementById('p1OptTextB'),
    p1OptTextC: document.getElementById('p1OptTextC'),
    p1LockOverlay: document.getElementById('p1LockoutOverlay'),
    p1LockProgress: document.getElementById('p1LockProgress'),
    p1WinToast: document.getElementById('p1WinToast'),

    // Düello: Oyuncu 2 (Kırmızı)
    p2Panel: document.getElementById('playerPanel2'),
    duelP2Name: document.getElementById('duelP2Name'),
    p2ScoreBadge: document.getElementById('p2ScoreBadge'),
    p2StarsTrack: document.getElementById('p2StarsTrack'),
    p2QuestionCard: document.getElementById('p2QuestionCard'),
    p2QuestionCategory: document.getElementById('p2QuestionCategory'),
    p2QuestionText: document.getElementById('p2QuestionText'),
    p2OptA: document.getElementById('p2OptA'),
    p2OptB: document.getElementById('p2OptB'),
    p2OptC: document.getElementById('p2OptC'),
    p2OptTextA: document.getElementById('p2OptTextA'),
    p2OptTextB: document.getElementById('p2OptTextB'),
    p2OptTextC: document.getElementById('p2OptTextC'),
    p2LockOverlay: document.getElementById('p2LockoutOverlay'),
    p2LockProgress: document.getElementById('p2LockProgress'),
    p2WinToast: document.getElementById('p2WinToast'),

    // Çözüm Bildirimi
    solutionPopup: document.getElementById('solutionPopup'),
    solutionText: document.getElementById('solutionText'),
    btnCloseSolution: document.getElementById('btnCloseSolution'),

    // Zafer Ekranı
    victoryWinnerTitle: document.getElementById('victoryWinnerTitle'),
    victoryBlueName: document.getElementById('victoryBlueName'),
    victoryBlueScore: document.getElementById('victoryBlueScore'),
    victoryRedName: document.getElementById('victoryRedName'),
    victoryRedScore: document.getElementById('victoryRedScore'),
    btnRematchSame: document.getElementById('btnRematchSame'),
    btnSelectNewStudents: document.getElementById('btnSelectNewStudents'),
    btnBackToLobby: document.getElementById('btnBackToLobby'),

    // Modaller
    modalAuth: document.getElementById('modalAuth'),
    btnSimulateGoogleLogin: document.getElementById('btnSimulateGoogleLogin'),

    modalPicker: document.getElementById('modalPicker'),
    slotName1: document.getElementById('slotName1'),
    slotName2: document.getElementById('slotName2'),
    btnSpinWheel: document.getElementById('btnSpinWheel'),
    btnApplySelectedStudents: document.getElementById('btnApplySelectedStudents'),
    rosterCount: document.getElementById('rosterCount'),
    rosterTextarea: document.getElementById('rosterTextarea'),
    btnSaveRoster: document.getElementById('btnSaveRoster'),
    btnResetRoster: document.getElementById('btnResetRoster'),

    modalCustomQ: document.getElementById('modalCustomQ'),
    formAddQuestion: document.getElementById('formAddQuestion'),
    customGrade: document.getElementById('customGrade'),
    customCategory: document.getElementById('customCategory'),
    customQuestionText: document.getElementById('customQuestionText'),
    customCorrect: document.getElementById('customCorrect'),
    customWrong1: document.getElementById('customWrong1'),
    customWrong2: document.getElementById('customWrong2'),
    customExplanation: document.getElementById('customExplanation'),
    savedQCount: document.getElementById('savedQCount'),
    savedQList: document.getElementById('savedQList'),

    modalLeaderboard: document.getElementById('modalLeaderboard'),
    leaderboardTbody: document.getElementById('leaderboardTbody'),
    btnResetLeague: document.getElementById('btnResetLeague'),

    // Global Toast
    globalToast: document.getElementById('globalToast'),
    toastMsg: document.getElementById('toastMsg')
  };

  const confetti = new ConfettiCanon('confettiCanvas');

  /* ==========================================================================
     7. YARDIMCI VE BİLDİRİM FONKSİYONLARI
     ========================================================================== */
  function showToast(message, duration = 3000) {
    DOM.toastMsg.textContent = message;
    DOM.globalToast.classList.remove('hide');
    setTimeout(() => {
      DOM.globalToast.classList.add('hide');
    }, duration);
  }

  function openModal(modalEl) {
    audio.playClick();
    modalEl.classList.remove('hide');
  }

  function closeModal(modalEl) {
    audio.playClick();
    modalEl.classList.add('hide');
  }

  // Tüm modal kapatma butonları
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-close-modal');
      const target = document.getElementById(targetId);
      if (target) closeModal(target);
    });
  });

  // Modal dışına tıklayınca kapatma
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('pointerdown', (e) => {
      if (e.target === backdrop) {
        closeModal(backdrop);
      }
    });
  });

  /* ==========================================================================
     8. TAM EKRAN VE SES KONTROLLERİ
     ========================================================================== */
  function toggleFullscreen() {
    audio.playClick();
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      }
      DOM.iconFsEnter.classList.add('hide');
      DOM.iconFsExit.classList.remove('hide');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      DOM.iconFsEnter.classList.remove('hide');
      DOM.iconFsExit.classList.add('hide');
    }
  }

  function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    StorageManager.saveSettings();
    updateSoundUI();
    if (state.soundEnabled) {
      audio.ensureContext();
      audio.playCorrect();
      showToast('🔊 Ses efektleri açıldı');
    } else {
      showToast('🔇 Ses efektleri kapatıldı');
    }
  }

  function updateSoundUI() {
    if (state.soundEnabled) {
      DOM.iconSoundOn.classList.remove('hide');
      DOM.iconSoundOff.classList.add('hide');
    } else {
      DOM.iconSoundOn.classList.add('hide');
      DOM.iconSoundOff.classList.remove('hide');
    }
  }

  /* ==========================================================================
     9. SINIF VE OYUN SEÇİMİ
     ========================================================================== */
  function setGrade(gradeNumber) {
    state.currentGrade = parseInt(gradeNumber, 10);
    audio.playClick();

    // Çip butonları güncelle
    DOM.gradeChips.forEach(chip => {
      const g = parseInt(chip.getAttribute('data-grade'), 10);
      chip.classList.toggle('active', g === state.currentGrade);
    });

    // Lobi kartlarını güncelle
    DOM.gradeCards.forEach(card => {
      const g = parseInt(card.getAttribute('data-grade'), 10);
      card.classList.toggle('active', g === state.currentGrade);
    });

    // Lobi oyun açıklamalarını güncelle
    updateLobbyDescriptions();
  }

  function updateLobbyDescriptions() {
    const mathDesc = document.getElementById('mathGameDesc');
    const trDesc = document.getElementById('turkishGameDesc');
    const mathTitle = document.querySelector('#btnLaunchMath .game-title');
    const trTitle = document.querySelector('#btnLaunchTurkish .game-title');
    const mathIcon = document.querySelector('#btnLaunchMath .game-visual-icon');
    const trIcon = document.querySelector('#btnLaunchTurkish .game-visual-icon');
    const g = state.currentGrade;

    if (g === 0) {
      if (mathTitle) mathTitle.textContent = "Renkler, Şekiller & Sayma";
      if (mathIcon) mathIcon.textContent = "🎨";
      if (trTitle) trTitle.textContent = "Sevimli Hayvanlar & Doğa";
      if (trIcon) trIcon.textContent = "🦁";
      if (mathDesc) mathDesc.textContent = "Okul Öncesi: Canlı renkler, parlayan şekiller ve 1-5 arası meyvelerle neşeli görsel sayma oyunu!";
      if (trDesc) trDesc.textContent = "Okul Öncesi: Sevimli hayvan sesleri, doğa kahramanları ve büyük-küçük kavramları keşfi!";
    } else {
      if (mathTitle) mathTitle.textContent = "Kafa Kafaya Matematik";
      if (mathIcon) mathIcon.textContent = "🧮";
      if (trTitle) trTitle.textContent = "Hızlı Türkçe & Dikkat Avcısı";
      if (trIcon) trIcon.textContent = "🦉";

      if (g === 1) {
        mathDesc.textContent = "1. Sınıf: 20'ye kadar basit toplama-çıkarma, 2-5-10'ar ritmik sayma.";
        trDesc.textContent = "1. Sınıf: Temel zıt kavramlar (büyük-küçük, uzun-kısa), ünlü harf ve dikkat avı.";
      } else if (g === 2) {
        mathDesc.textContent = "2. Sınıf: İki basamaklı işlemler, deste ve düzine, 3'er ve 4'er ritmik sayma.";
        trDesc.textContent = "2. Sınıf: Eş anlamlılar (siyah-kara), zıt anlamlılar (taze-bayat) ve yazım kuralları.";
      } else if (g === 3) {
        mathDesc.textContent = "3. Sınıf: Çarpım tablosu fırtınası (2x-9x), basit bölme ve basamak değeri düellosu.";
        trDesc.textContent = "3. Sınıf: Eş sesli kelimeler (yüz, gül), Fen & Hayat Bilgisi doğru-yanlış gerçekleri.";
      } else {
        mathDesc.textContent = "4. Sınıf: Hızlı 4 işlem, çeyrek ve kesir hesapları, açı türleri (dar, dik, geniş).";
        trDesc.textContent = "4. Sınıf: Zengin deyimler (etekleri zil çalmak vb.), Sosyal Bilgiler & genel kültür.";
      }
    }
  }

  /* ==========================================================================
     10. FREEMIUM MODEL & ÖĞRETMEN OTURUMU
     ========================================================================== */
  function updateTeacherAuthUI() {
    if (state.teacherSession.isLoggedIn) {
      DOM.btnTeacherAuth.classList.add('logged-in');
      DOM.authBtnText.textContent = state.teacherSession.name || 'Öğretmenim';
      DOM.authIcon.textContent = '🎓';
    } else {
      DOM.btnTeacherAuth.classList.remove('logged-in');
      DOM.authBtnText.textContent = 'Öğretmen Girişi';
      DOM.authIcon.textContent = '👨‍🏫';
    }
  }

  function simulateGoogleLogin() {
    DOM.btnSimulateGoogleLogin.disabled = true;
    DOM.btnSimulateGoogleLogin.innerHTML = '<span>⏳ Giriş Yapılıyor...</span>';

    setTimeout(() => {
      state.teacherSession = {
        isLoggedIn: true,
        name: 'Öğretmenim',
        email: 'ogretmen@meb.k12.tr',
        school: 'Fatih Projesi Akıllı Tahta'
      };
      StorageManager.saveTeacher();
      updateTeacherAuthUI();

      DOM.btnSimulateGoogleLogin.disabled = false;
      DOM.btnSimulateGoogleLogin.innerHTML = `
        <svg class="google-svg" viewBox="0 0 24 24" width="22" height="22">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        <span>Google ile Tek Tıkla Giriş Yap (MEB Uyumlu)</span>
      `;

      closeModal(DOM.modalAuth);
      audio.playCorrect();
      showToast('🎉 Hoş geldiniz Öğretmenim! Sınıf listeniz ve özel soru yetkileriniz aktifleşti.');

      // Eğer çarkıfelek için basılmışsa hemen çarkıfeleği aç
      openPickerModal();
    }, 700);
  }

  function handleAuthClick() {
    if (state.teacherSession.isLoggedIn) {
      if (confirm('Öğretmen oturumunu kapatmak istiyor musunuz?')) {
        state.teacherSession = { isLoggedIn: false, name: '', email: '' };
        StorageManager.saveTeacher();
        updateTeacherAuthUI();
        showToast('Oturum kapatıldı. Misafir modundasınız.');
      }
    } else {
      openModal(DOM.modalAuth);
    }
  }

  /* ==========================================================================
     11. SINIF LİSTESİ VE ÇARKIFELEK KURA SİSTEMİ
     ========================================================================== */
  function openPickerModal() {
    if (!state.teacherSession.isLoggedIn) {
      openModal(DOM.modalAuth);
      return;
    }
    DOM.rosterCount.textContent = state.classRoster.length;
    DOM.rosterTextarea.value = state.classRoster.join('\n');
    openModal(DOM.modalPicker);
  }

  let spinTimer = null;
  function spinStudentWheel() {
    if (state.classRoster.length < 2) {
      showToast('⚠️ Kura için en az 2 öğrenci olmalıdır!');
      return;
    }

    DOM.btnSpinWheel.disabled = true;
    DOM.btnApplySelectedStudents.classList.add('hide');

    let steps = 0;
    const maxSteps = 22;
    let speed = 70;

    function step() {
      // 2 farklı rastgele isim seç
      const r1 = Math.floor(Math.random() * state.classRoster.length);
      let r2 = Math.floor(Math.random() * state.classRoster.length);
      while (r2 === r1 && state.classRoster.length > 1) {
        r2 = Math.floor(Math.random() * state.classRoster.length);
      }

      DOM.slotName1.textContent = state.classRoster[r1];
      DOM.slotName2.textContent = state.classRoster[r2];
      audio.playTick();

      steps++;
      if (steps < maxSteps) {
        speed += 12; // Yavaşla
        spinTimer = setTimeout(step, speed);
      } else {
        // Tamamlandı
        DOM.btnSpinWheel.disabled = false;
        DOM.btnApplySelectedStudents.classList.remove('hide');
        audio.playCorrect();
        showToast(`🎯 Seçilen Yarışmacılar: ${DOM.slotName1.textContent} vs ${DOM.slotName2.textContent}`);
      }
    }

    step();
  }

  function applySelectedStudents() {
    const s1 = DOM.slotName1.textContent.trim();
    const s2 = DOM.slotName2.textContent.trim();

    if (s1 && s2 && s1 !== 'Seçim Yapılmadı') {
      state.player1.name = s1;
      state.player2.name = s2;
      updatePlayerNamesUI();
      closeModal(DOM.modalPicker);
      audio.playClick();
      showToast(`🚀 Düello yarışmacıları güncellendi: ${s1} ve ${s2}`);
    }
  }

  function updatePlayerNamesUI() {
    DOM.lobbyP1Name.textContent = state.player1.name;
    DOM.lobbyP2Name.textContent = state.player2.name;
    DOM.duelP1Name.textContent = state.player1.name;
    DOM.duelP2Name.textContent = state.player2.name;
  }

  function saveClassRoster() {
    const lines = DOM.rosterTextarea.value
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (lines.length < 2) {
      alert('Lütfen en az 2 öğrenci ismi giriniz!');
      return;
    }

    state.classRoster = lines;
    StorageManager.saveRoster();
    DOM.rosterCount.textContent = lines.length;
    audio.playClick();
    showToast(`✅ Sınıf listesi kaydedildi (${lines.length} Öğrenci)`);
  }

  function resetDefaultRoster() {
    if (confirm('Varsayılan örnek öğrenci listesini yüklemek istiyor musunuz?')) {
      state.classRoster = [
        'Ali', 'Ayşe', 'Mehmet', 'Fatma', 'Can', 'Zeynep',
        'Yusuf', 'Elif', 'Kerem', 'Defne', 'Emir', 'Asya',
        'Burak', 'Nehir', 'Mert', 'Yağmur', 'Arda', 'Zehra',
        'Umut', 'Ela', 'Efe', 'Ceren', 'Baran', 'Duru'
      ];
      StorageManager.saveRoster();
      DOM.rosterCount.textContent = state.classRoster.length;
      DOM.rosterTextarea.value = state.classRoster.join('\n');
      audio.playClick();
      showToast('Örnek liste başarıyla yüklendi.');
    }
  }

  /* ==========================================================================
     12. KENDİ SORULARIMI EKLE (ÖĞRETMEN ÖZEL SORU BANKASI)
     ========================================================================== */
  function openCustomQModal() {
    if (!state.teacherSession.isLoggedIn) {
      openModal(DOM.modalAuth);
      return;
    }
    renderCustomQuestionsList();
    openModal(DOM.modalCustomQ);
  }

  function handleAddCustomQuestion(e) {
    e.preventDefault();
    const newQ = {
      id: Date.now().toString(),
      grade: DOM.customGrade.value,
      category: DOM.customCategory.value,
      question: DOM.customQuestionText.value.trim(),
      correct: DOM.customCorrect.value.trim(),
      wrong1: DOM.customWrong1.value.trim(),
      wrong2: DOM.customWrong2.value.trim(),
      explanation: DOM.customExplanation.value.trim()
    };

    if (!newQ.question || !newQ.correct || !newQ.wrong1 || !newQ.wrong2) {
      alert('Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }

    state.customQuestions.push(newQ);
    StorageManager.saveCustomQuestions();
    renderCustomQuestionsList();

    // Formu temizle
    DOM.customQuestionText.value = '';
    DOM.customCorrect.value = '';
    DOM.customWrong1.value = '';
    DOM.customWrong2.value = '';
    DOM.customExplanation.value = '';

    audio.playCorrect();
    showToast('✨ Özel sorunuz havuza eklendi ve düellolarda çıkacak!');
  }

  function renderCustomQuestionsList() {
    DOM.savedQCount.textContent = state.customQuestions.length;
    if (state.customQuestions.length === 0) {
      DOM.savedQList.innerHTML = '<div class="empty-q-msg">Henüz özel soru eklemediniz.</div>';
      return;
    }

    DOM.savedQList.innerHTML = state.customQuestions.map(q => `
      <div class="saved-q-item">
        <div>
          <strong>[${q.grade}. Sınıf ${q.category === 'math' ? 'Mat' : 'Tr'}]</strong> ${escapeHtml(q.question)}
          <div class="saved-q-meta">Doğru: ${escapeHtml(q.correct)} | Yanlış: ${escapeHtml(q.wrong1)}, ${escapeHtml(q.wrong2)}</div>
        </div>
        <button class="btn-del-q" data-del-id="${q.id}" title="Sil">✕</button>
      </div>
    `).join('');

    DOM.savedQList.querySelectorAll('[data-del-id]').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-del-id');
        deleteCustomQuestion(id);
      });
    });
  }

  function deleteCustomQuestion(id) {
    state.customQuestions = state.customQuestions.filter(q => q.id !== id);
    StorageManager.saveCustomQuestions();
    renderCustomQuestionsList();
    audio.playClick();
    showToast('Soru havuzdan silindi.');
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  /* ==========================================================================
     13. SINIF LİGİ & PUAN TABLOSU
     ========================================================================== */
  function openLeaderboardModal() {
    renderLeaderboard();
    openModal(DOM.modalLeaderboard);
  }

  function recordDuelWinner(winnerName, loserName, winnerScore, loserScore) {
    if (!state.leagueScores[winnerName]) {
      state.leagueScores[winnerName] = { wins: 0, points: 0, matches: 0 };
    }
    if (!state.leagueScores[loserName]) {
      state.leagueScores[loserName] = { wins: 0, points: 0, matches: 0 };
    }

    state.leagueScores[winnerName].wins += 1;
    state.leagueScores[winnerName].points += winnerScore;
    state.leagueScores[winnerName].matches += 1;

    state.leagueScores[loserName].points += loserScore;
    state.leagueScores[loserName].matches += 1;

    StorageManager.saveLeague();
  }

  function renderLeaderboard() {
    const list = Object.keys(state.leagueScores).map(name => ({
      name,
      wins: state.leagueScores[name].wins || 0,
      points: state.leagueScores[name].points || 0
    }));

    list.sort((a, b) => b.wins - a.wins || b.points - a.points);

    if (list.length === 0) {
      DOM.leaderboardTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 24px; color:#94a3b8;">Henüz kayıtlı düello maçı yok. İlk düelloyu başlatın!</td></tr>';
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    DOM.leaderboardTbody.innerHTML = list.map((item, idx) => `
      <tr>
        <td><strong>#${idx + 1}</strong></td>
        <td>${escapeHtml(item.name)}</td>
        <td>${item.wins} Galibiyet</td>
        <td>${item.points} Puan</td>
        <td>${medals[idx] || '⭐'}</td>
      </tr>
    `).join('');
  }

  function resetLeagueScores() {
    if (confirm('Sınıf ligi puan tablosunu sıfırlamak istiyor musunuz?')) {
      state.leagueScores = {};
      StorageManager.saveLeague();
      renderLeaderboard();
      audio.playClick();
      showToast('Sınıf ligi puanları sıfırlandı.');
    }
  }

  /* ==========================================================================
     14. DÜELLO OYUN AKIŞI & MEKANİĞİ
     ========================================================================== */
  function startDuel(gameType) {
    state.currentGameType = gameType;
    state.player1.score = 0;
    state.player2.score = 0;
    state.player1.isLocked = false;
    state.player2.isLocked = false;
    state.questionNumber = 1;

    // UI'ları sıfırla
    DOM.duelGradeBadge.textContent = state.currentGrade === 0 ? '🎈 Anasınıfı' : `${state.currentGrade}. Sınıf`;
    if (state.currentGrade === 0) {
      DOM.duelGameTypeBadge.textContent = gameType === 'math' ? '🎨 Renkler & Sayma' : '🦁 Sevimli Hayvanlar';
    } else {
      DOM.duelGameTypeBadge.textContent = gameType === 'math' ? '📐 Matematik' : '📚 Türkçe & Dikkat';
    }
    updatePlayerNamesUI();
    renderScoreTrack();

    // Lobi -> Düello Görünümüne Geçiş
    DOM.viewLobby.classList.remove('active');
    DOM.viewDuel.classList.add('active');
    state.currentView = 'duel';

    audio.playCorrect();
    loadNextQuestion();
  }

  function exitDuel() {
    if (confirm('Düelloyu sonlandırıp lobiye dönmek istiyor musunuz?')) {
      clearAllLockouts();
      DOM.solutionPopup.classList.add('hide');
      DOM.victoryOverlay.classList.add('hide');
      confetti.stop();

      DOM.viewDuel.classList.remove('active');
      DOM.viewLobby.classList.add('active');
      state.currentView = 'lobby';
      audio.playClick();
    }
  }

  function renderScoreTrack() {
    DOM.p1ScoreBadge.textContent = `${state.player1.score} / ${state.targetScore}`;
    DOM.p2ScoreBadge.textContent = `${state.player2.score} / ${state.targetScore}`;

    // Yıldızları oluştur/güncelle
    renderStarSlots(DOM.p1StarsTrack, state.player1.score, state.targetScore);
    renderStarSlots(DOM.p2StarsTrack, state.player2.score, state.targetScore);
  }

  function renderStarSlots(container, currentScore, maxScore) {
    container.innerHTML = '';
    for (let i = 0; i < maxScore; i++) {
      const star = document.createElement('span');
      star.className = `star-slot ${i < currentScore ? 'filled' : ''}`;
      star.textContent = '⭐';
      container.appendChild(star);
    }
  }

  function loadNextQuestion() {
    clearAllLockouts();
    DOM.solutionPopup.classList.add('hide');
    state.isQuestionAnswered = false;

    DOM.duelRoundBadge.textContent = `Soru ${state.questionNumber}`;

    // Yeni soruyu üret
    state.currentQuestion = QuestionEngine.getNextQuestion(state.currentGrade, state.currentGameType);

    // Mavi Tarafına Bas
    DOM.p1QuestionCategory.textContent = state.currentQuestion.category;
    DOM.p1QuestionText.textContent = state.currentQuestion.question;
    DOM.p1OptTextA.textContent = state.currentQuestion.options[0];
    DOM.p1OptTextB.textContent = state.currentQuestion.options[1];
    DOM.p1OptTextC.textContent = state.currentQuestion.options[2];

    // Kırmızı Tarafına Bas (Tamamen Simetrik)
    DOM.p2QuestionCategory.textContent = state.currentQuestion.category;
    DOM.p2QuestionText.textContent = state.currentQuestion.question;
    DOM.p2OptTextA.textContent = state.currentQuestion.options[0];
    DOM.p2OptTextB.textContent = state.currentQuestion.options[1];
    DOM.p2OptTextC.textContent = state.currentQuestion.options[2];

    // Buton stillerini sıfırla
    [DOM.p1OptA, DOM.p1OptB, DOM.p1OptC, DOM.p2OptA, DOM.p2OptB, DOM.p2OptC].forEach(btn => {
      btn.className = 'duel-option-btn';
      btn.disabled = false;
    });

    DOM.p1Panel.classList.remove('winner-glow');
    DOM.p2Panel.classList.remove('winner-glow');
    DOM.p1WinToast.classList.add('hide');
    DOM.p2WinToast.classList.add('hide');
  }

  /* ==========================================================================
     15. AKILLI TAHTA MULTI-TOUCH CEVAP KONTROLÜ (POINTERDOWN)
     ========================================================================== */
  function handleAnswer(playerNum, optionIndex) {
    if (state.isQuestionAnswered) return;

    // Ceza kilidi aktifse engelle
    if (playerNum === 1 && state.player1.isLocked) return;
    if (playerNum === 2 && state.player2.isLocked) return;

    const chosenText = state.currentQuestion.options[optionIndex];
    const isCorrect = (chosenText === state.currentQuestion.correct);

    if (isCorrect) {
      // -------------------------------------------------------------
      // DOĞRU CEVAP MEKANİĞİ
      // -------------------------------------------------------------
      state.isQuestionAnswered = true;
      audio.playCorrect();

      // Puanı artır
      if (playerNum === 1) {
        state.player1.score += 1;
        DOM.p1Panel.classList.add('winner-glow');
        DOM.p1WinToast.classList.remove('hide');
        highlightCorrectOption(DOM.p1OptionsGrid, optionIndex);
      } else {
        state.player2.score += 1;
        DOM.p2Panel.classList.add('winner-glow');
        DOM.p2WinToast.classList.remove('hide');
        highlightCorrectOption(DOM.p2OptionsGrid, optionIndex);
      }

      renderScoreTrack();

      // Pedagojik Çözümü Göster
      DOM.solutionText.textContent = state.currentQuestion.explanation;
      if (state.showAutoExplanation) {
        DOM.solutionPopup.classList.remove('hide');
      }

      // 5 puana ulaşıldı mı kontrol et
      if (state.player1.score >= state.targetScore || state.player2.score >= state.targetScore) {
        setTimeout(() => {
          triggerVictory(playerNum === 1 ? state.player1 : state.player2);
        }, 1200);
      } else {
        // Sonraki soruya geçiş (2.2 saniye sonra)
        state.questionNumber += 1;
        setTimeout(() => {
          if (state.currentView === 'duel') {
            loadNextQuestion();
          }
        }, 2200);
      }

    } else {
      // -------------------------------------------------------------
      // YANLIŞ CEVAP: 1.5 SANİYELİK KİLİT VE CEZA OVERLAY'I
      // -------------------------------------------------------------
      audio.playWrong();
      applyLockout(playerNum, optionIndex);
    }
  }

  function highlightCorrectOption(gridEl, index) {
    const buttons = gridEl.querySelectorAll('.duel-option-btn');
    if (buttons[index]) {
      buttons[index].classList.add('btn-correct');
    }
  }

  function applyLockout(playerNum, optionIndex) {
    const isP1 = (playerNum === 1);
    const lockOverlay = isP1 ? DOM.p1LockOverlay : DOM.p2LockOverlay;
    const lockProgress = isP1 ? DOM.p1LockProgress : DOM.p2LockProgress;
    const gridEl = isP1 ? DOM.p1OptionsGrid : DOM.p2OptionsGrid;

    // Yanlış basılan butonu kızart
    const buttons = gridEl.querySelectorAll('.duel-option-btn');
    if (buttons[optionIndex]) {
      buttons[optionIndex].classList.add('btn-wrong');
    }

    if (isP1) state.player1.isLocked = true;
    else state.player2.isLocked = true;

    // Overlay'i aç ve süre çubuğunu doldur/boşalt
    lockOverlay.classList.remove('hide');
    lockProgress.style.transition = 'none';
    lockProgress.style.width = '100%';

    // Bir sonraki frame'de animasyonu başlat
    requestAnimationFrame(() => {
      lockProgress.style.transition = 'width 1.5s linear';
      lockProgress.style.width = '0%';
    });

    const timer = setTimeout(() => {
      if (isP1) state.player1.isLocked = false;
      else state.player2.isLocked = false;
      lockOverlay.classList.add('hide');
    }, 1500);

    if (isP1) state.player1.lockTimer = timer;
    else state.player2.lockTimer = timer;
  }

  function clearAllLockouts() {
    clearTimeout(state.player1.lockTimer);
    clearTimeout(state.player2.lockTimer);
    state.player1.isLocked = false;
    state.player2.isLocked = false;
    DOM.p1LockOverlay.classList.add('hide');
    DOM.p2LockOverlay.classList.add('hide');
  }

  /* ==========================================================================
     16. MAÇ SONU & ZAFER EKRANI (VICTORY SCREEN)
     ========================================================================== */
  function triggerVictory(winner) {
    clearAllLockouts();
    DOM.solutionPopup.classList.add('hide');

    const isP1 = (winner === state.player1);
    DOM.victoryWinnerTitle.textContent = `${winner.name} (${isP1 ? 'Mavi Takım' : 'Kırmızı Takım'}) Kazandı!`;

    DOM.victoryBlueName.textContent = state.player1.name;
    DOM.victoryBlueScore.textContent = state.player1.score;
    DOM.victoryRedName.textContent = state.player2.name;
    DOM.victoryRedScore.textContent = state.player2.score;

    DOM.victoryOverlay.classList.remove('hide');

    // Zafer Müziği ve Konfeti Patlat
    audio.playVictory();
    confetti.burst();

    // Sınıf ligine kaydet
    const loser = isP1 ? state.player2 : state.player1;
    recordDuelWinner(winner.name, loser.name, winner.score, loser.score);
  }

  function handleRematchSame() {
    audio.playClick();
    DOM.victoryOverlay.classList.add('hide');
    confetti.stop();
    startDuel(state.currentGameType);
  }

  function handleSelectNewStudentsFromVictory() {
    audio.playClick();
    DOM.victoryOverlay.classList.add('hide');
    confetti.stop();
    DOM.viewDuel.classList.remove('active');
    DOM.viewLobby.classList.add('active');
    state.currentView = 'lobby';
    openPickerModal();
  }

  function handleBackToLobby() {
    audio.playClick();
    DOM.victoryOverlay.classList.add('hide');
    confetti.stop();
    DOM.viewDuel.classList.remove('active');
    DOM.viewLobby.classList.add('active');
    state.currentView = 'lobby';
  }

  /* ==========================================================================
     17. ETKİNLİK DİNLEYİCİLERİ (EVENT LISTENERS)
     ========================================================================== */
  function setupEventListeners() {
    // -------------------------------------------------------------
    // Akıllı Tahta Güvenliği: Çift tıklama ve sağ tık menüsünü engelle
    // -------------------------------------------------------------
    document.addEventListener('contextmenu', e => e.preventDefault());

    // Header Kontrolleri
    DOM.logoBtn.addEventListener('pointerdown', () => {
      audio.playClick();
      if (state.currentView === 'duel') {
        exitDuel();
      }
    });

    DOM.btnToggleFullscreen.addEventListener('pointerdown', toggleFullscreen);
    DOM.btnToggleSound.addEventListener('pointerdown', toggleSound);
    DOM.btnTeacherAuth.addEventListener('pointerdown', handleAuthClick);
    DOM.btnSimulateGoogleLogin.addEventListener('pointerdown', simulateGoogleLogin);

    // Pro Butonlar
    DOM.btnOpenPicker.addEventListener('pointerdown', openPickerModal);
    DOM.btnOpenCustomQ.addEventListener('pointerdown', openCustomQModal);
    DOM.btnOpenLeaderboard.addEventListener('pointerdown', openLeaderboardModal);
    DOM.btnResetLeague.addEventListener('pointerdown', resetLeagueScores);

    // Sınıf Çipleri (Header)
    DOM.gradeChips.forEach(chip => {
      chip.addEventListener('pointerdown', () => {
        setGrade(chip.getAttribute('data-grade'));
      });
    });

    // Sınıf Kartları (Lobi)
    DOM.gradeCards.forEach(card => {
      card.addEventListener('pointerdown', () => {
        setGrade(card.getAttribute('data-grade'));
      });
    });

    // Lobi Hızlı Öğrenci Değiştir
    DOM.btnQuickDraw.addEventListener('pointerdown', openPickerModal);

    // Hedef Puan Seçicileri
    DOM.targetScoreBtns.forEach(btn => {
      btn.addEventListener('pointerdown', () => {
        audio.playClick();
        DOM.targetScoreBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.targetScore = parseInt(btn.getAttribute('data-score'), 10);
        StorageManager.saveSettings();
      });
    });

    // Çözüm Gösterme Switch'i
    DOM.chkAutoExplanation.addEventListener('change', () => {
      state.showAutoExplanation = DOM.chkAutoExplanation.checked;
      StorageManager.saveSettings();
    });

    // Oyun Başlatma Butonları
    DOM.btnStartMath.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      startDuel('math');
    });
    DOM.btnLaunchMathCard.addEventListener('pointerdown', () => {
      startDuel('math');
    });

    DOM.btnStartTurkish.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      startDuel('turkish');
    });
    DOM.btnLaunchTurkishCard.addEventListener('pointerdown', () => {
      startDuel('turkish');
    });

    // Düello Kontrolleri
    DOM.btnExitDuel.addEventListener('pointerdown', exitDuel);
    DOM.btnSkipQuestion.addEventListener('pointerdown', () => {
      audio.playClick();
      state.questionNumber += 1;
      loadNextQuestion();
    });

    DOM.btnToggleSolutionNow.addEventListener('pointerdown', () => {
      audio.playClick();
      if (state.currentQuestion) {
        DOM.solutionText.textContent = state.currentQuestion.explanation;
        DOM.solutionPopup.classList.toggle('hide');
      }
    });

    DOM.btnCloseSolution.addEventListener('pointerdown', () => {
      audio.playClick();
      DOM.solutionPopup.classList.add('hide');
    });

    // -------------------------------------------------------------
    // Akıllı Tahta Multi-Touch Şık Butonları (Pointerdown)
    // -------------------------------------------------------------
    // 1. Oyuncu (Mavi)
    DOM.p1OptA.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(1, 0); });
    DOM.p1OptB.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(1, 1); });
    DOM.p1OptC.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(1, 2); });

    // 2. Oyuncu (Kırmızı)
    DOM.p2OptA.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(2, 0); });
    DOM.p2OptB.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(2, 1); });
    DOM.p2OptC.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(2, 2); });

    // Çarkıfelek Kura Butonları
    DOM.btnSpinWheel.addEventListener('pointerdown', spinStudentWheel);
    DOM.btnApplySelectedStudents.addEventListener('pointerdown', applySelectedStudents);
    DOM.btnSaveRoster.addEventListener('pointerdown', saveClassRoster);
    DOM.btnResetRoster.addEventListener('pointerdown', resetDefaultRoster);

    // Özel Soru Formu
    DOM.formAddQuestion.addEventListener('submit', handleAddCustomQuestion);

    // Zafer Ekranı Butonları
    DOM.btnRematchSame.addEventListener('pointerdown', handleRematchSame);
    DOM.btnSelectNewStudents.addEventListener('pointerdown', handleSelectNewStudentsFromVictory);
    DOM.btnBackToLobby.addEventListener('pointerdown', handleBackToLobby);
  }

  /* ==========================================================================
     18. BAŞLANGIÇ (BOOTSTRAP)
     ========================================================================== */
  function init() {
    StorageManager.loadAll();
    updateSoundUI();
    updateTeacherAuthUI();
    updatePlayerNamesUI();
    updateLobbyDescriptions();

    // Kayıtlı ayarları UI'a yansıt
    DOM.chkAutoExplanation.checked = state.showAutoExplanation;
    DOM.targetScoreBtns.forEach(btn => {
      const s = parseInt(btn.getAttribute('data-score'), 10);
      btn.classList.toggle('active', s === state.targetScore);
    });

    setupEventListeners();
    console.log("🎯 Derse Bi' Mola başarıyla başlatıldı. MEB Fatih & ETAP uyumlu.");
  }

  // DOM hazır olduğunda başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
