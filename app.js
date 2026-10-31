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

    // Aktif Lobi Bölümü: 'home' (Karşılama Vitrini) | 'subjects' (Dersler) | 'games' (Oyunlar)
    currentSection: 'home',

    // Sınıf Seviyesi: 0 (Anasınıfı), 1, 2, 3 veya 4
    currentGrade: 1,

    // Aktif Seçili Ders: null (tüm dersler listesi açık) veya ders id'si ('math', 'firstreading', vb.)
    currentSubject: null,

    // Aktif Kategori / Konu Filtresi: 'all' veya derse özel konu id'si
    currentCategory: 'all',

    // Aktif Oyun Türü: 'math' | 'turkish' | 'oddone' | 'stroop' | 'memory' | 'reflex'
    currentGameType: 'math',

    // Türkiye Yüzyılı Maarif Modeli (2026) 1. Sınıf İlk Okuma Durumu
    maarifGroup: 'g1',
    activeMaarifLetter: 'a',
    isMaarifGeneral: false,

    // Oyun Modu: 'duel' (👥 İki Kişilik Düello - Varsayılan) | 'solo' (👤 Tek Kişilik Pratik)
    gameMode: 'duel',

    // Düello Ayarları
    targetScore: 5,
    showAutoExplanation: true,
    soundEnabled: true,
    announcerEnabled: true, // Öğretmen Kontrolü: Edge-TTS Sunucu & Zafer Sesleri
    autoReadQuestion: true, // Soru Sesli Okuma (Edge-TTS & TTS)

    // Yarışmacı Öğrenci Bilgileri
    player1: {
      name: '1. Öğrenci (Mavi)',
      score: 0,
      streak: 0,
      avatar: '👦',
      isLocked: false,
      lockTimer: null,
      frostInterval: null,
    },
    player2: {
      name: '2. Öğrenci (Kırmızı)',
      score: 0,
      streak: 0,
      avatar: '👧',
      isLocked: false,
      lockTimer: null,
      frostInterval: null,
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

    // Sınıf Öğrenci Listesi (Kalıcı LocalStorage Hafızası)
    classRoster: [
      'Ali', 'Ayşe', 'Mehmet', 'Fatma', 'Can', 'Zeynep',
      'Yusuf', 'Elif', 'Kerem', 'Defne', 'Emir', 'Asya',
      'Burak', 'Nehir', 'Mert', 'Yağmur', 'Arda', 'Zehra',
      'Umut', 'Ela', 'Efe', 'Ceren', 'Baran', 'Duru'
    ],

    // Bugün Seçilen Öğrenciler (Anti-Repeat / Tekrar Önleme)
    todaySelectedStudents: [],
    excludeTodaySelected: true,
    pickerMode: 'single', // 'single' (Tek Öğrenci) | 'duel' (2 Öğrenci Düello)
    lastPickedStudent: null,

    // Özel Soru Bankası & Özel Sınavlar (Custom Quiz Builder)
    customQuestions: [],
    customQuizzes: [],
    activeCustomQuiz: null,
    customQuizQueue: [],

    // Sınıf Ligi Maç Geçmişi
    leagueScores: {},

    // Maç Başlangıç Zamanı (Sınıf İçi Kullanım Süresi Ölçümü İçin)
    matchStartTime: null
  };

  /* ==========================================================================
     1.1 GOOGLE ANALYTICS 4 & AKILLI TAHTA ETKİLEŞİM TAKİP MOTORU
     ========================================================================== */
  const AnalyticsTracker = {
    getDeviceInfo() {
      return (typeof window !== 'undefined' && window.__DERSE_BI_MOLA_DEVICE_INFO__) || {};
    },

    trackEvent(eventName, params) {
      try {
        if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
          const deviceInfo = this.getDeviceInfo();
          const payload = Object.assign({}, deviceInfo, params || {});
          window.gtag('event', eventName, payload);
        }
      } catch (err) {
        // Çevrimdışı veya MEB Fatih ağında engel durumunda sessizce devam et
      }
    },

    // 1) Sınıf Seçimi
    trackClassSelect(gradeNumber, gradeLabel) {
      const label = gradeLabel || (gradeNumber === 0 ? 'Anasınıfı' : `${gradeNumber}. Sınıf`);
      this.trackEvent('select_class', {
        grade: label,
        grade_number: gradeNumber,
        game_name: 'Ders Seçim Ekranı'
      });
    },

    // 2) Ders Seçimi
    trackSubjectSelect(subjectId, subjectTitle, gradeNumber) {
      const grade = gradeNumber === 0 ? 'Anasınıfı' : `${gradeNumber}. Sınıf`;
      this.trackEvent('select_subject', {
        subject_id: subjectId,
        subject_title: subjectTitle,
        grade: grade,
        game_name: subjectTitle
      });
    },

    // 3) Düello / Pratik Başlangıcı
    trackDuelStart(gameType, gameTitle, gradeNumber, gameMode) {
      const grade = gradeNumber === 0 ? 'Anasınıfı' : `${gradeNumber}. Sınıf`;
      this.trackEvent('start_duel', {
        game_name: gameTitle || gameType,
        game_type: gameType,
        grade: grade,
        game_mode: gameMode || 'duel'
      });
    },

    // 4) Oyun / Maç Sonu
    trackGameFinish(gameType, gameTitle, gradeNumber, gameMode, winnerName, p1Score, p2Score, durationSec) {
      const grade = gradeNumber === 0 ? 'Anasınıfı' : `${gradeNumber}. Sınıf`;
      this.trackEvent('finish_game', {
        game_name: gameTitle || gameType,
        game_type: gameType,
        grade: grade,
        game_mode: gameMode || 'duel',
        winner: winnerName || 'Belirsiz',
        p1_score: p1Score || 0,
        p2_score: p2Score || 0,
        play_duration_seconds: durationSec || 0
      });
    }
  };

  /* ==========================================================================
     2. SES MOTORU: WEB AUDIO API & EMA LIGHTNING DOĞAL TÜRKÇE SES KATMANI
     ========================================================================== */

  // -------------------------------------------------------------
  // EMA Lightning Doğal Türkçe Ses Anahtarlama ve Normalizasyon Motoru
  // -------------------------------------------------------------
  function normalizeSpeechText(text) {
    return (text || '').toString().normalize('NFC').trim().replace(/\s+/g, ' ');
  }

  function cyrb53(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }

  function speechKey(text) {
    return cyrb53(normalizeSpeechText(text)).toString(16).padStart(14, '0');
  }

  let recordedSpeechKeys = new Set();
  async function loadSpeechIndex() {
    try {
      const res = await fetch('sesler/index.json?v=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.anahtarlar)) {
          recordedSpeechKeys = new Set(data.anahtarlar);
        }
      }
    } catch (e) {
      recordedSpeechKeys = new Set();
    }
  }

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.currentAudio = null;
      this.currentAnnouncerAudio = null;
      this.ttsTimeout = null;
      this.ttsReady = false;
      this.speechSeq = 0;
      this.initOnFirstTouch = this.initOnFirstTouch.bind(this);
      window.addEventListener('pointerdown', this.initOnFirstTouch, { once: true });
      window.addEventListener('keydown', this.initOnFirstTouch, { once: true });
    }

    // Google TTS & Web Speech motorunu sayfa yüklendikten (window.onload) sonraya ertele (defer)
    initTTSDeferred() {
      if (this.ttsReady) return;
      this.ttsReady = true;

      const setupTTS = () => {
        try {
          if ('speechSynthesis' in window) {
            // Ses motorunu arka planda bloklamadan hazırla (warmup)
            window.speechSynthesis.getVoices();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
              window.speechSynthesis.onvoiceschanged = () => {
                try { window.speechSynthesis.getVoices(); } catch (e) {}
              };
            }
          }
        } catch (e) {}
      };

      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(setupTTS, { timeout: 2500 });
      } else {
        setTimeout(setupTTS, 1200);
      }
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

    // Doğru Cevap: "Ding ding" yerine parlak, neşeli kristal yıldız / marimba parıltısı ("Bling! ✨")
    playCorrect() {
      if (!state.soundEnabled || !this.ensureContext()) return;
      const now = this.ctx.currentTime;

      // 1. Adım (Hızlı Yükselen Marimba Çıkışı): 0.05s
      const oscUp = this.ctx.createOscillator();
      const gainUp = this.ctx.createGain();
      oscUp.type = 'triangle';
      oscUp.frequency.setValueAtTime(659.25, now); // E5
      oscUp.frequency.exponentialRampToValueAtTime(783.99, now + 0.05); // G5
      gainUp.gain.setValueAtTime(0, now);
      gainUp.gain.linearRampToValueAtTime(0.22, now + 0.015);
      gainUp.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      oscUp.connect(gainUp);
      gainUp.connect(this.ctx.destination);
      oscUp.start(now);
      oscUp.stop(now + 0.075);

      // 2. Adım (Zengin Parıltılı Armonik Akor): now + 0.055
      const chordTime = now + 0.055;
      const freqs = [
        { f: 1046.50, vol: 0.28, decay: 0.45 }, // C6 (Ana Kristal Çan)
        { f: 1318.51, vol: 0.20, decay: 0.38 }, // E6 (Neşeli Majör Üçlü)
        { f: 1567.98, vol: 0.16, decay: 0.32 }, // G6 (Parlak Beşli)
        { f: 2093.00, vol: 0.08, decay: 0.22 }  // C7 (Yıldız Parıltısı)
      ];

      freqs.forEach(item => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(item.f, chordTime);

        gain.gain.setValueAtTime(0, chordTime);
        gain.gain.linearRampToValueAtTime(item.vol, chordTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, chordTime + item.decay);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(chordTime);
        osc.stop(chordTime + item.decay + 0.05);
      });
    }

    // Yanlış Cevap: Korkutucu testere sesi yerine sevimli, tok uyarı ("Ops!" thud)
    playWrong() {
      if (!state.soundEnabled || !this.ensureContext()) return;
      const now = this.ctx.currentTime;

      // 1. Tok Bas Vuruşu
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.22);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);

      // 2. İkinci Yumuşak Düşüş (Wobble)
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(140, now + 0.07);
      osc2.frequency.exponentialRampToValueAtTime(70, now + 0.25);

      gain2.gain.setValueAtTime(0, now + 0.07);
      gain2.gain.linearRampToValueAtTime(0.18, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.26);
    }

    // Balon Patlatma Sesi: Tok ve çıtır ahşap/balon patlama vuruşu ("Pop! 🎈💥")
    playPop() {
      if (!state.soundEnabled || !this.ensureContext()) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(850, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } catch (e) {}
    }

    // Hareketli Balon Patlatma Sesi: Tok kauçuk balon patlaması ve çıtırtı
    playBalloonPop() {
      if (!state.soundEnabled || !this.ensureContext()) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.11);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } catch (e) {}
    }

    // Hafıza Kartı Çevirme Sesi: Kart çevirme ("Whoosh / Flip 🃏")
    playCardFlip() {
      if (!state.soundEnabled || !this.ensureContext()) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(360, now);
        osc.frequency.exponentialRampToValueAtTime(720, now + 0.06);
        gain.gain.setValueAtTime(0.26, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
      } catch (e) {}
    }

    // Hece & Küp Yerleştirme Sesi: Kristal tık ("Snap! 🧱")
    playSnap() {
      if (!state.soundEnabled || !this.ensureContext()) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(1080, now + 0.06);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
      } catch (e) {}
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

    // Kura / Çark Çevirme Tık Sesi: Tok ahşap çark tıkı
    playTick() {
      if (!state.soundEnabled || !this.ensureContext()) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.03);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    }

    // Kura Davul Ritmi (Drumroll): 3-4 saniyelik gerilimi tırmandıran tok ve hızlanan trampet vuruşları
    playDrumroll(durationMs = 3400) {
      if (!state.soundEnabled || !this.ensureContext()) return { stop: () => {} };
      try {
        const ctx = this.ctx;
        let isStopped = false;
        let timer = null;
        const startTime = Date.now();

        const hit = () => {
          if (isStopped) return;
          const elapsed = Date.now() - startTime;
          const progress = Math.min(1, elapsed / durationMs);

          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          const baseFreq = 125 + Math.random() * 45 + (progress * 65);
          osc.frequency.setValueAtTime(baseFreq, now);
          osc.frequency.exponentialRampToValueAtTime(45, now + 0.045);

          const vol = 0.14 + (progress * 0.28);
          gain.gain.setValueAtTime(vol, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.042);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.045);

          if (elapsed < durationMs) {
            // Davul ritmi gittikçe sıklaşır (60ms'den 22ms'ye hızlanır)
            const interval = Math.max(22, 60 - Math.floor(progress * 38));
            timer = setTimeout(hit, interval);
          }
        };

        hit();

        return {
          stop: () => {
            isStopped = true;
            if (timer) clearTimeout(timer);
          }
        };
      } catch (e) {
        return { stop: () => {} };
      }
    }

    // Kura Zafer Zili / Ta-da Çan Sesi: Kura durduğunda coşkulu kadehler ve çanlar
    playCymbalTada() {
      if (!state.soundEnabled || !this.ensureContext()) return;
      try {
        const now = this.ctx.currentTime;
        const freqs = [659.25, 880, 1318.5]; // E5, A5, E6
        freqs.forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + idx * 0.06);
          gain.gain.setValueAtTime(0.3, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.85);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.9);
        });
      } catch (e) {}
    }

    // Buton & Arayüz Tıklama Sesi: Ding ding yerine canlı, tatlı ahşap/balon pop sesi
    playClick() {
      if (!state.soundEnabled || !this.ensureContext()) return;
      const now = this.ctx.currentTime;
      // İnce doğal pitch varyasyonu (her tık tekdüze mekanik olmasın)
      const v = 0.96 + Math.random() * 0.08;

      // 1. Katman: Gövde (Juicy Bubble / Wooden Pop)
      const oscBody = this.ctx.createOscillator();
      const gainBody = this.ctx.createGain();
      oscBody.type = 'sine';
      oscBody.frequency.setValueAtTime(820 * v, now);
      oscBody.frequency.exponentialRampToValueAtTime(230 * v, now + 0.042);

      gainBody.gain.setValueAtTime(0.25, now);
      gainBody.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      oscBody.connect(gainBody);
      gainBody.connect(this.ctx.destination);
      oscBody.start(now);
      oscBody.stop(now + 0.06);

      // 2. Katman: Çıtır Parmak Dokunuş Transient'i (Crisp Tap Snap)
      const oscSnap = this.ctx.createOscillator();
      const gainSnap = this.ctx.createGain();
      oscSnap.type = 'triangle';
      oscSnap.frequency.setValueAtTime(1550 * v, now);
      oscSnap.frequency.exponentialRampToValueAtTime(420 * v, now + 0.018);

      gainSnap.gain.setValueAtTime(0.14, now);
      gainSnap.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      oscSnap.connect(gainSnap);
      gainSnap.connect(this.ctx.destination);
      oscSnap.start(now);
      oscSnap.stop(now + 0.024);
    }

    // Kombo & Ateş Modu Sesi: Coşkulu, yükselen alev arpej ve parıltısı ("🔥 3x SERİ!")
    playComboFire() {
      if (!state.soundEnabled || !this.ensureContext()) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      notes.forEach((freq, i) => {
        const t = now + i * 0.055;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, t + 0.12);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.25, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      });
    }

    // Buz / Donma Sesi: Hatalı şıkta kristal buz kilitlenme efekti ("❄️ 1.5s")
    playIceFreeze() {
      if (!state.soundEnabled || !this.ensureContext()) return;
      const now = this.ctx.currentTime;
      const iceFreqs = [2400, 1800, 1320];
      iceFreqs.forEach((freq, idx) => {
        const t = now + idx * 0.04;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + 0.1);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.18);
      });
    }

    // Yükselen Puan Sesi: +10 Puan süzülürken ince parlak kristal tınısı
    playScorePoints() {
      if (!state.soundEnabled || !this.ensureContext()) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08); // E6
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    }

    // -------------------------------------------------------------
    // Edge-TTS Sunucu & Zafer Seslendirmeleri
    // -------------------------------------------------------------
    playAnnouncer(name) {
      if (!state.soundEnabled || !state.announcerEnabled) return;
      try {
        if (this.currentAnnouncerAudio) {
          try {
            this.currentAnnouncerAudio.onended = null;
            this.currentAnnouncerAudio.onerror = null;
            this.currentAnnouncerAudio.pause();
            this.currentAnnouncerAudio.currentTime = 0;
          } catch (e) {}
          this.currentAnnouncerAudio = null;
        }
        const audioEl = new Audio(`sounds/${name}.mp3`);
        this.currentAnnouncerAudio = audioEl;
        audioEl.volume = 0.95;
        audioEl.onended = () => {
          if (this.currentAnnouncerAudio === audioEl) {
            this.currentAnnouncerAudio = null;
          }
        };
        audioEl.onerror = () => {
          if (this.currentAnnouncerAudio === audioEl) {
            this.currentAnnouncerAudio = null;
          }
        };
        audioEl.play().catch(() => {});
      } catch (err) {
        console.warn('Ses dosyası oynatılamadı:', err);
      }
    }

    playAnnouncerStart() { this.playAnnouncer('announcer_start'); }
    playAnnouncerBluePoint() { this.playAnnouncer('announcer_blue_point'); }
    playAnnouncerRedPoint() { this.playAnnouncer('announcer_red_point'); }
    playAnnouncerBlueWin() { this.playAnnouncer('announcer_blue_win'); }
    playAnnouncerRedWin() { this.playAnnouncer('announcer_red_win'); }
    playAnnouncerLockout() { this.playAnnouncer('announcer_lockout'); }
    playAnnouncerBomb() { this.playAnnouncer('announcer_bomb'); }

    // -------------------------------------------------------------
    // Soru Sesli Okuma (Önceden Üretilmiş MP3 veya Online Doğal TTS)
    // -------------------------------------------------------------
    playQuestionFile(key, onEnded) {
      if (!state.soundEnabled) {
        if (onEnded) onEnded();
        return;
      }
      this.stopQuestionAudio();
      try {
        const a = new Audio(`sounds/q/${key}.mp3`);
        this.currentAudio = a;
        a.volume = 1.0;
        let finished = false;
        const finish = () => {
          if (!finished) {
            finished = true;
            this.currentAudio = null;
            if (onEnded) onEnded();
          }
        };
        a.onended = finish;
        a.onerror = () => {
          if (state.currentQuestion) {
            this.speakTurkishText(getSpokenTextForQuestion(state.currentQuestion), finish);
          } else {
            finish();
          }
        };
        const p = a.play();
        if (p !== undefined) {
          p.catch(() => {
            if (state.currentQuestion) {
              this.speakTurkishText(getSpokenTextForQuestion(state.currentQuestion), finish);
            } else {
              finish();
            }
          });
        }
      } catch (err) {
        console.warn('Soru sesi oynatma hatası:', err);
        if (onEnded) onEnded();
      }
    }

    speakText(text, lang = 'tr', onEnded) {
      if (!state.soundEnabled) {
        if (onEnded) onEnded();
        return;
      }
      // Devam eden önceki ses veya konuşmayı mutlaka durdur
      this.stopQuestionAudio();
      this.speechSeq = (this.speechSeq || 0) + 1;
      const currentSeq = this.speechSeq;

      // 1) Emojileri temizle ve matematik sembollerini metne çevir
      let cleanText = (text || '').toString()
        .replace(/\p{Extended_Pictographic}/gu, '')
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}\u{1F680}-\u{1F6FF}]/gu, '')
        .replace(/[\uFE00-\uFE0F]/g, '');

      const isEn = (lang === 'en' || lang.startsWith('en'));

      if (isEn) {
        cleanText = cleanText
          .replace(/[-−–—]/g, ' ')
          .replace(/[?!.,;:"'()]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      } else {
        // Matematik sembollerini doğal Türkçe metne dönüştür
        if (cleanText.includes('=')) {
          cleanText = cleanText
            .replace(/\+/g, ' artı ')
            .replace(/[-−–—]/g, ' eksi ')
            .replace(/(\d+)\s*[*×xX]\s*(\d+)/g, '$1 çarpı $2')
            .replace(/(^|\s)[*×xX](\s|$)/g, '$1 çarpı $2')
            .replace(/[*×]/g, ' çarpı ')
            .replace(/[\/÷]/g, ' bölü ')
            .replace(/=/g, ' eşittir ')
            .replace(/\b(kaç eder|kaçtır)\s*\?/gi, '$1')
            .replace(/\?/g, ' kaçtır ')
            .replace(/\s+/g, ' ')
            .trim();
        } else {
          cleanText = cleanText.replace(/\s+/g, ' ').trim();
        }
      }

      if (!cleanText) {
        if (onEnded) onEnded();
        return;
      }

      let done = false;
      const finish = () => {
        if (currentSeq !== this.speechSeq) return;
        if (!done) {
          done = true;
          if (this.ttsTimeout) {
            clearTimeout(this.ttsTimeout);
            this.ttsTimeout = null;
          }
          this.currentAudio = null;
          if (onEnded) onEnded();
        }
      };

      const ttsLang = isEn ? 'en' : 'tr';
      const synthLang = isEn ? 'en-US' : 'tr-TR';

      // -------------------------------------------------------------
      // YEDEK SES MOTORU: Web Speech API (speechSynthesis)
      // -------------------------------------------------------------
      const playWithSpeechSynthesis = () => {
        if (currentSeq !== this.speechSeq || done) return;
        if (!('speechSynthesis' in window)) {
          finish();
          return;
        }
        try {
          window.speechSynthesis.cancel();
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }

          const u = new SpeechSynthesisUtterance(cleanText);
          u.lang = synthLang;
          u.rate = isEn ? 0.90 : 0.95;
          u.pitch = isEn ? 1.0 : 1.05;

          const voices = window.speechSynthesis.getVoices() || [];
          let matchedVoice = null;

          if (isEn) {
            matchedVoice = voices.find(v => 
              (v.lang && (v.lang === 'en-US' || v.lang === 'en-GB' || v.lang.toLowerCase().startsWith('en'))) ||
              (v.name && (v.name.toLowerCase().includes('english') || v.name.toLowerCase().includes('google us') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('zira')))
            );
          } else {
            matchedVoice = voices.find(v => 
              (v.lang && (v.lang === 'tr-TR' || v.lang.toLowerCase().startsWith('tr') || v.lang === 'tr')) ||
              (v.name && (v.name.toLowerCase().includes('turkish') || v.name.toLowerCase().includes('türkçe') || v.name.toLowerCase().includes('yelda') || v.name.toLowerCase().includes('tolga')))
            );
          }

          if (matchedVoice) {
            u.voice = matchedVoice;
          } else {
            u.lang = synthLang;
          }

          u.onend = () => {
            if (currentSeq === this.speechSeq) finish();
          };
          u.onerror = () => {
            if (currentSeq === this.speechSeq) finish();
          };
          window.speechSynthesis.speak(u);
        } catch (e) {
          finish();
        }
      };

      // -------------------------------------------------------------
      // İKİNCİL YEDEK MOTOR: Online Doğal TTS (Google TTS Ses Akışı)
      // -------------------------------------------------------------
      let fallbackTriggered = false;
      const triggerFallback = () => {
        if (currentSeq !== this.speechSeq) return;
        if (fallbackTriggered || done) return;
        fallbackTriggered = true;
        if (this.ttsTimeout) {
          clearTimeout(this.ttsTimeout);
          this.ttsTimeout = null;
        }
        if (this.currentAudio) {
          try {
            this.currentAudio.onended = null;
            this.currentAudio.onerror = null;
            this.currentAudio.pause();
          } catch (e) {}
          this.currentAudio = null;
        }
        playWithSpeechSynthesis();
      };

      const playWithGoogleTts = () => {
        if (currentSeq !== this.speechSeq || done) return;
        try {
          const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${ttsLang}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
          const audioEl = new Audio(googleUrl);
          this.currentAudio = audioEl;
          audioEl.volume = 1.0;

          this.ttsTimeout = setTimeout(() => {
            if (currentSeq === this.speechSeq) triggerFallback();
          }, 3500);

          audioEl.onplaying = () => {
            if (currentSeq === this.speechSeq && this.ttsTimeout) {
              clearTimeout(this.ttsTimeout);
              this.ttsTimeout = null;
            }
          };

          audioEl.onended = () => {
            if (currentSeq === this.speechSeq) {
              if (this.ttsTimeout) {
                clearTimeout(this.ttsTimeout);
                this.ttsTimeout = null;
              }
              finish();
            }
          };

          audioEl.onerror = () => {
            if (currentSeq === this.speechSeq) triggerFallback();
          };

          const p = audioEl.play();
          if (p !== undefined) {
            p.catch(() => {
              if (currentSeq === this.speechSeq) triggerFallback();
            });
          }
        } catch (err) {
          triggerFallback();
        }
      };

      // -------------------------------------------------------------
      // BİRİNCİL SES MOTORU: EMA Lightning Yerel Doğal MP3 Kaydı
      // Eğer cümlenin anahtarı index.json'da varsa sesler/<anahtar>.mp3 çalınır
      // Yoksa veya açılamazsa aynı cümle Google TTS / cihaz sesi ile söylenir
      // -------------------------------------------------------------
      if (!isEn) {
        let key = speechKey(text);
        if (!recordedSpeechKeys.has(key)) {
          const altKey = speechKey(cleanText);
          if (recordedSpeechKeys.has(altKey)) {
            key = altKey;
          }
        }
        if (recordedSpeechKeys.has(key)) {
          try {
            const recordedAudio = new Audio(`sesler/${key}.mp3`);
            this.currentAudio = recordedAudio;
            recordedAudio.volume = 1.0;

            this.ttsTimeout = setTimeout(() => {
              if (currentSeq === this.speechSeq) playWithGoogleTts();
            }, 4000);

            recordedAudio.onplaying = () => {
              if (currentSeq === this.speechSeq && this.ttsTimeout) {
                clearTimeout(this.ttsTimeout);
                this.ttsTimeout = null;
              }
            };

            recordedAudio.onended = () => {
              if (currentSeq === this.speechSeq) {
                if (this.ttsTimeout) {
                  clearTimeout(this.ttsTimeout);
                  this.ttsTimeout = null;
                }
                finish();
              }
            };

            recordedAudio.onerror = () => {
              if (currentSeq === this.speechSeq) playWithGoogleTts();
            };

            const p = recordedAudio.play();
            if (p !== undefined) {
              p.catch(() => {
                if (currentSeq === this.speechSeq) playWithGoogleTts();
              });
            }
            return;
          } catch (e) {
            playWithGoogleTts();
            return;
          }
        } else {
          // Geliştirici yardımı: kaydı olmayan her cümleyi konsola yaz
          console.log(`[ses] kaydı yok: "${text}" (anahtar: ${key})`);
        }
      }

      // Kayıt yoksa eski yöntemle söyle
      playWithGoogleTts();
    }

    speakTurkishText(text, onEnded) {
      this.speakText(text, 'tr', onEnded);
    }

    speakEnglishText(text, onEnded) {
      this.speakText(text, 'en', onEnded);
    }

    stopQuestionAudio() {
      this.speechSeq = (this.speechSeq || 0) + 1;
      if (this.ttsTimeout) {
        clearTimeout(this.ttsTimeout);
        this.ttsTimeout = null;
      }
      if (this.currentAudio) {
        try {
          this.currentAudio.onended = null;
          this.currentAudio.onerror = null;
          this.currentAudio.onplaying = null;
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
        } catch (e) {}
        this.currentAudio = null;
      }
      if (this.currentAnnouncerAudio) {
        try {
          this.currentAnnouncerAudio.onended = null;
          this.currentAnnouncerAudio.onerror = null;
          this.currentAnnouncerAudio.pause();
          this.currentAnnouncerAudio.currentTime = 0;
        } catch (e) {}
        this.currentAnnouncerAudio = null;
      }
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
    }

    stopAllAudio() {
      this.stopQuestionAudio();
    }
  }

  const audio = new SoundEngine();
  window.__DERSE_BI_MOLA_AUDIO__ = audio;

  // Google TTS (Ses motoru) başlatma fonksiyonunu sayfa yüklendikten (window.onload) sonraya ertele (defer)
  if (document.readyState === 'complete') {
    audio.initTTSDeferred();
  } else {
    window.addEventListener('load', () => {
      audio.initTTSDeferred();
    });
  }

  // -------------------------------------------------------------
  // Soru Sesli Okuma Yardımcıları (Edge-TTS & Web Speech)
  // -------------------------------------------------------------
  function getSpokenTextForQuestion(q) {
    if (!q) return '';
    if (q.spokenText) return q.spokenText;
    let text = q.question || '';
    if (!text && q.questionHtml) {
      text = q.questionHtml;
    }

    // HTML etiketlerini ve içeriğini temizle
    text = text.replace(/<[^>]*>/g, ' ');

    // Matematik sembollerini akıcı Türkçeye çevir
    // Önce 4 işlem denklemlerini kontrol et (içinde '=' ve '?' varsa)
    if (text.includes('=')) {
      text = text
        .replace(/(\d+)\s*\+\s*(\d+)\s*=\s*\?/g, '$1 artı $2 kaç eder?')
        .replace(/(\d+)\s*[-−–]\s*(\d+)\s*=\s*\?/g, '$1 eksi $2 kaç eder?')
        .replace(/(\d+)\s*[*×xX]\s*(\d+)\s*=\s*\?/g, '$1 çarpı $2 kaç eder?')
        .replace(/(\d+)\s*[\/÷]\s*(\d+)\s*=\s*\?/g, '$1 bölü $2 kaç eder?');
    } else if (/^\s*\d+\s*[-−–]\s*\d+\s*[-−–]/.test(text) || (text.includes(' - ') && text.includes('?'))) {
      // Ritmik sayma (örn: 2 - 4 - 6 - ?)
      text = text.replace(/\s*[-−–]\s*\?/g, '... Sıradaki sayı kaçtır?').replace(/\s*[-−–]\s*/g, ', ');
    }

    // Emojileri temizle
    text = text.replace(/[\u{1F300}-\u{1FAFF}]/gu, '').replace(/[\u{2600}-\u{27BF}]/gu, '').trim();
    // Fazla boşlukları düzelt
    text = text.replace(/\s+/g, ' ');
    return text || q.question || 'Soruyu çöz';
  }

  function readCurrentQuestion(isManual = false) {
    if (isManual && !state.soundEnabled) {
      state.soundEnabled = true;
      StorageManager.saveSettings();
      updateSoundUI();
    }
    if (!state.soundEnabled) return;
    if (!state.currentQuestion) return;

    audio.ensureContext();

    const btns = [DOM.btnReadAloudP1, DOM.btnReadAloudP2, DOM.btnHudReadQuestion];
    btns.forEach(b => { if (b) b.classList.add('reading-active'); });

    const finish = () => {
      btns.forEach(b => { if (b) b.classList.remove('reading-active'); });
    };

    const isEnglish = (
      state.currentGameType === 'english' ||
      (typeof state.currentGameType === 'string' && state.currentGameType.startsWith('english_')) ||
      (state.currentQuestion && (state.currentQuestion.lang === 'en' || !!state.currentQuestion.englishWord))
    );

    if (state.currentQuestion.audioKey) {
      audio.playQuestionFile(state.currentQuestion.audioKey, finish);
    } else if (isEnglish) {
      const enWord = state.currentQuestion.englishWord || state.currentQuestion.spokenText || getSpokenTextForQuestion(state.currentQuestion);
      audio.speakEnglishText(enWord, finish);
    } else {
      const spoken = getSpokenTextForQuestion(state.currentQuestion);
      audio.speakTurkishText(spoken, finish);
    }
  }

  /* ==========================================================================
     2.5. 3D FLUENT ICON SİSTEMİ & EMOJİ DÖNÜŞTÜRÜCÜ (%100 YEREL & ÇEVRİMDIŞI)
     ========================================================================== */
  const EMOJI_TO_3D = {
    // Sınıf & Lobi & Ana Başlıklar
    '🎈': 'assets/icons/3d/balloon.png',
    '🌱': 'assets/icons/3d/seedling.png',
    '🚀': 'assets/icons/3d/rocket.png',
    '⚡': 'assets/icons/3d/lightning.png',
    '👑': 'assets/icons/3d/crown.png',
    '🎨': 'assets/icons/3d/artist_palette.png',
    '🧮': 'assets/icons/3d/abacus.png',
    '🦁': 'assets/icons/3d/lion.png',
    '🦉': 'assets/icons/3d/owl.png',
    '👀': 'assets/icons/3d/eyes.png',
    '🎯': 'assets/icons/3d/bullseye.png',
    '🧠': 'assets/icons/3d/brain.png',
    '🌈': 'assets/icons/3d/rainbow.png',
    '🌟': 'assets/icons/3d/star.png',
    '⭐': 'assets/icons/3d/star.png',
    '🏆': 'assets/icons/3d/trophy.png',
    '🥇': 'assets/icons/3d/medal.png',
    '💎': 'assets/icons/3d/gem.png',
    '🔔': 'assets/icons/3d/bell.png',
    '🎮': 'assets/icons/3d/video_game.png',
    '🧩': 'assets/icons/3d/puzzle_piece.png',
    '📚': 'assets/icons/3d/books.png',
    '📖': 'assets/icons/3d/open_book.png',
    '🌍': 'assets/icons/3d/globe.png',
    '✨': 'assets/icons/3d/sparkles.png',

    // Meyve, Yiyecek & Nesneler
    '🍎': 'assets/icons/3d/apple.png',
    '🍏': 'assets/icons/3d/apple.png',
    '🍌': 'assets/icons/3d/banana.png',
    '🍓': 'assets/icons/3d/strawberry.png',
    '🍊': 'assets/icons/3d/orange.png',
    '🍅': 'assets/icons/3d/tomato.png',
    '🚗': 'assets/icons/3d/car.png',
    '🚙': 'assets/icons/3d/car.png',
    '🚕': 'assets/icons/3d/car.png',
    '🥑': 'assets/icons/3d/avocado.png',
    '🍐': 'assets/icons/3d/avocado.png',
    '🍑': 'assets/icons/3d/peach.png',
    '🍒': 'assets/icons/3d/cherries.png',
    '🍇': 'assets/icons/3d/grapes.png',
    '🥕': 'assets/icons/3d/carrot.png',
    '🍕': 'assets/icons/3d/pizza.png',
    '🍦': 'assets/icons/3d/ice_cream.png',
    '🍪': 'assets/icons/3d/cookie.png',
    '🍩': 'assets/icons/3d/doughnut.png',
    '🧁': 'assets/icons/3d/cupcake.png',
    '⚽': 'assets/icons/3d/soccer.png',
    '🎸': 'assets/icons/3d/guitar.png',
    '💣': 'assets/icons/3d/bomb.png',
    '🌵': 'assets/icons/3d/cactus.png',
    '🧸': 'assets/icons/3d/teddy_bear.png',
    '✈️': 'assets/icons/3d/airplane.png',
    '✈': 'assets/icons/3d/airplane.png',
    '🚲': 'assets/icons/3d/bicycle.png',
    '⛵': 'assets/icons/3d/sailboat.png',
    '🚤': 'assets/icons/3d/speedboat.png',
    '🎁': 'assets/icons/3d/gift.png',
    '🎉': 'assets/icons/3d/party_popper.png',
    '🌍': 'assets/icons/3d/globe.png',
    '🌎': 'assets/icons/3d/globe.png',
    '🌏': 'assets/icons/3d/globe.png',
    '💡': 'assets/icons/3d/light_bulb.png',
    '🔑': 'assets/icons/3d/key.png',
    '🔒': 'assets/icons/3d/locked.png',
    '🔓': 'assets/icons/3d/unlocked.png',
    '💍': 'assets/icons/3d/ring.png',
    '⏰': 'assets/icons/3d/alarm_clock.png',
    '⏱️': 'assets/icons/3d/alarm_clock.png',
    '🕒': 'assets/icons/3d/alarm_clock.png',
    '🕓': 'assets/icons/3d/alarm_clock.png',
    '🕔': 'assets/icons/3d/alarm_clock.png',
    '⏳': 'assets/icons/3d/hourglass.png',
    '🌸': 'assets/icons/3d/cherry_blossom.png',
    '🌺': 'assets/icons/3d/hibiscus.png',
    '🌻': 'assets/icons/3d/sunflower.png',
    '😀': 'assets/icons/3d/grinning_face.png',
    '😅': 'assets/icons/3d/grinning_face_sweat.png',
    '😂': 'assets/icons/3d/joy.png',

    // Hayvanlar & Doğa
    '🐱': 'assets/icons/3d/cat.png',
    '🐶': 'assets/icons/3d/dog.png',
    '🐰': 'assets/icons/3d/rabbit.png',
    '🐟': 'assets/icons/3d/fish.png',
    '🐦': 'assets/icons/3d/bird.png',
    '🐘': 'assets/icons/3d/elephant.png',
    '☀️': 'assets/icons/3d/sun.png',
    '☀': 'assets/icons/3d/sun.png',
    '🌙': 'assets/icons/3d/crescent_moon.png',
    '🌕': 'assets/icons/3d/full_moon.png',
    '🌖': 'assets/icons/3d/gibbous_moon.png',
    '🌗': 'assets/icons/3d/half_moon.png',
    '🌧️': 'assets/icons/3d/cloud_rain.png',
    '🌧': 'assets/icons/3d/cloud_rain.png',
    '🐮': 'assets/icons/3d/cow.png',
    '🐸': 'assets/icons/3d/frog.png',
    '🦆': 'assets/icons/3d/duck.png',
    '🐵': 'assets/icons/3d/monkey.png',
    '🐻': 'assets/icons/3d/bear.png',
    '🐥': 'assets/icons/3d/chick.png',
    '🐭': 'assets/icons/3d/mouse.png',
    '🐜': 'assets/icons/3d/ant.png',
    '🐢': 'assets/icons/3d/turtle.png',
    '🦒': 'assets/icons/3d/giraffe.png',
    '🦊': 'assets/icons/3d/fox.png',
    '🐴': 'assets/icons/3d/horse.png',
    '🐺': 'assets/icons/3d/wolf.png',
    '🐯': 'assets/icons/3d/tiger.png',
    '🦋': 'assets/icons/3d/butterfly.png',
    '🐝': 'assets/icons/3d/honeybee.png',
    '🐞': 'assets/icons/3d/lady_beetle.png',

    // Renkler & Geometrik Şekiller
    '🔴': 'assets/icons/3d/red_circle.png',
    '🔵': 'assets/icons/3d/blue_circle.png',
    '🟡': 'assets/icons/3d/yellow_circle.png',
    '🟢': 'assets/icons/3d/green_circle.png',
    '🟣': 'assets/icons/3d/purple_circle.png',
    '🟠': 'assets/icons/3d/orange_circle.png',
    '⚪': 'assets/icons/3d/white_circle.svg',
    '🔺': 'assets/icons/3d/red_triangle.svg',
    '🟩': 'assets/icons/3d/green_square.png',
    '⬛': 'assets/icons/3d/black_square.png',
    '⭕': 'assets/icons/3d/red_circle.png',
    '💖': 'assets/icons/3d/heart.png',
    '❤️': 'assets/icons/3d/heart.png',
    '🔷': 'assets/icons/3d/blue_circle.png',
    '🔶': 'assets/icons/3d/orange_circle.png',
    '🔹': 'assets/icons/3d/blue_circle.png',
    '🏮': 'assets/icons/3d/balloon.png',
    '🟦': 'assets/icons/3d/blue_square.svg',
    '🟤': 'assets/icons/3d/brown_circle.svg',
    '⚫': 'assets/icons/3d/black_circle.svg',
    '🍃': 'assets/icons/3d/leaf.svg',
    '🪨': 'assets/icons/3d/rock.svg',
    '🪶': 'assets/icons/3d/feather.svg'
  };

  const EMOJI_KEYS_SORTED = Object.keys(EMOJI_TO_3D).sort((a, b) => b.length - a.length);

  function replaceEmojisWith3D(str, customClass = 'inline-3d-icon') {
    if (!str || typeof str !== 'string') return str || '';
    let result = str;
    for (let i = 0; i < EMOJI_KEYS_SORTED.length; i++) {
      const key = EMOJI_KEYS_SORTED[i];
      if (result.indexOf(key) !== -1) {
        const iconPath = EMOJI_TO_3D[key];
        const webpPath = (iconPath && iconPath.endsWith('.png')) ? iconPath.slice(0, -4) + '.webp' : iconPath;
        const imgTag = `<img src="${webpPath}" onerror="if(this.dataset.fb!=='1'){this.dataset.fb='1';this.src='${iconPath}';}" class="${customClass}" alt="" draggable="false" loading="lazy" decoding="async">`;
        result = result.split(key).join(imgTag);
      }
    }
    return result;
  }

  /* ==========================================================================
     TÜRKİYE YÜZYILI MAARİF MODELİ (2026) İLK OKUMA YAZMA KÜMÜLATİF VERİ HAVUZU
     ========================================================================== */
  const MAARIF_2026_CONFIG = {
    groups: [
      { id: 'g1', name: '1. Grup', code: 'ANETİL', letters: ['a', 'n', 'e', 't', 'i', 'l'] },
      { id: 'g2', name: '2. Grup', code: 'OKURIM', letters: ['o', 'k', 'u', 'r', 'ı', 'm'] },
      { id: 'g3', name: '3. Grup', code: 'ÜSÖYDZ', letters: ['ü', 's', 'ö', 'y', 'd', 'z'] },
      { id: 'g4', name: '4. Grup', code: 'ÇBGCŞ', letters: ['ç', 'b', 'g', 'c', 'ş'] },
      { id: 'g5', name: '5. Grup', code: 'PHVĞFJ', letters: ['p', 'h', 'v', 'ğ', 'f', 'j'] }
    ],
    letterOrder: ['a', 'n', 'e', 't', 'i', 'l', 'o', 'k', 'u', 'r', 'ı', 'm', 'ü', 's', 'ö', 'y', 'd', 'z', 'ç', 'b', 'g', 'c', 'ş', 'p', 'h', 'v', 'ğ', 'f', 'j'],
    letters: {
      // 1. GRUP (ANETİL)
      'a': {
        letter: 'a', upper: 'A', group: 'g1', groupName: '1. Grup (ANETİL)',
        soundWords: [
          { word: 'Arı', emoji: '🐝', position: 'başta', hasSound: true },
          { word: 'Ayı', emoji: '🐻', position: 'başta', hasSound: true },
          { word: 'Araba', emoji: '🚗', position: 'başta', hasSound: true },
          { word: 'Ağaç', emoji: '🌳', position: 'başta', hasSound: true },
          { word: 'Elma', emoji: '🍎', position: 'sonda', hasSound: true },
          { word: 'Balık', emoji: '🐟', position: 'ortada', hasSound: true },
          { word: 'Tavşan', emoji: '🐰', position: 'ortada', hasSound: true }
        ],
        noSoundWords: [
          { word: 'Kedi', emoji: '🐱', hasSound: false },
          { word: 'Köpek', emoji: '🐶', hasSound: false },
          { word: 'Süt', emoji: '🥛', hasSound: false },
          { word: 'Fil', emoji: '🐘', hasSound: false }
        ],
        cumulativeWords: [
          { word: 'A', parts: ['A'], distractors: ['a'], icon: '🅰️' },
          { word: 'a', parts: ['a'], distractors: ['A'], icon: '🔤' },
          { word: 'Aa', parts: ['A', 'a'], distractors: ['a'], icon: '🅰️' },
          { word: 'aA', parts: ['a', 'A'], distractors: ['A'], icon: '🔤' },
          { word: 'AA', parts: ['A', 'A'], distractors: ['a'], icon: '🗣️' },
          { word: 'AAA', parts: ['A', 'A', 'A'], distractors: ['A'], icon: '📣' }
        ],
        cumulativeSentences: [
          { sentence: 'A a a!', blankSentence: 'A a _____!', missing: 'a', options: ['a', 'A', 'Aa'], fullText: 'A a a!' },
          { sentence: 'A A A!', blankSentence: 'A A _____!', missing: 'A', options: ['A', 'a', 'Aa'], fullText: 'A A A!' },
          { sentence: 'A, a, a!', blankSentence: '_____, a, a!', missing: 'A', options: ['A', 'a', 'Aa'], fullText: 'A, a, a!' }
        ]
      },
      'n': {
        letter: 'n', upper: 'N', group: 'g1', groupName: '1. Grup (ANETİL)',
        soundWords: [
          { word: 'Nar', emoji: '🍎', position: 'başta', hasSound: true },
          { word: 'Nal', emoji: '🐎', position: 'başta', hasSound: true },
          { word: 'Nane', emoji: '🌿', position: 'başta', hasSound: true },
          { word: 'Aslan', emoji: '🦁', position: 'sonda', hasSound: true },
          { word: 'Balon', emoji: '🎈', position: 'sonda', hasSound: true },
          { word: 'Limon', emoji: '🍋', position: 'sonda', hasSound: true },
          { word: 'Güneş', emoji: '☀️', position: 'ortada', hasSound: true }
        ],
        noSoundWords: [
          { word: 'Arı', emoji: '🐝', hasSound: false },
          { word: 'Kedi', emoji: '🐱', hasSound: false },
          { word: 'Kuş', emoji: '🐦', hasSound: false },
          { word: 'Ayı', emoji: '🐻', hasSound: false }
        ],
        cumulativeWords: [
          { word: 'AN', parts: ['A', 'N'], distractors: ['NA'], icon: '⏳' },
          { word: 'NA', parts: ['N', 'A'], distractors: ['AN'], icon: '🔤' },
          { word: 'ANA', parts: ['A', 'NA'], distractors: ['AN'], icon: '👩' },
          { word: 'NANA', parts: ['NA', 'NA'], distractors: ['AN'], icon: '👶' }
        ],
        cumulativeSentences: [
          { sentence: 'Ana an.', blankSentence: 'Ana _____.', missing: 'an', options: ['an', 'na', 'ana'], fullText: 'Ana an.' }
        ]
      },
      'e': {
        letter: 'e', upper: 'E', group: 'g1', groupName: '1. Grup (ANETİL)',
        soundWords: [
          { word: 'Elma', emoji: '🍎', position: 'başta', hasSound: true },
          { word: 'Eşek', emoji: '🫏', position: 'başta', hasSound: true },
          { word: 'Ekmek', emoji: '🍞', position: 'başta', hasSound: true },
          { word: 'Ev', emoji: '🏠', position: 'başta', hasSound: true },
          { word: 'Kedi', emoji: '🐱', position: 'ortada', hasSound: true },
          { word: 'Güneş', emoji: '☀️', position: 'ortada', hasSound: true },
          { word: 'Nane', emoji: '🌿', position: 'sonda', hasSound: true }
        ],
        noSoundWords: [
          { word: 'Ayı', emoji: '🐻', hasSound: false },
          { word: 'Kuş', emoji: '🐦', hasSound: false },
          { word: 'Balık', emoji: '🐟', hasSound: false },
          { word: 'Muz', emoji: '🍌', hasSound: false }
        ],
        cumulativeWords: [
          { word: 'EN', parts: ['E', 'N'], distractors: ['AN', 'NE'], icon: '📏' },
          { word: 'NE', parts: ['N', 'E'], distractors: ['NA', 'EN'], icon: '❓' },
          { word: 'ANE', parts: ['A', 'NE'], distractors: ['NA', 'EN'], icon: '👵' },
          { word: 'ANNE', parts: ['AN', 'NE'], distractors: ['NA', 'EN'], icon: '❤️' },
          { word: 'NANE', parts: ['NA', 'NE'], distractors: ['EN', 'AN'], icon: '🌿' }
        ],
        cumulativeSentences: [
          { sentence: 'Anne nane.', blankSentence: 'Anne _____.', missing: 'nane', options: ['nane', 'an', 'en'], fullText: 'Anne nane.' },
          { sentence: 'Ana ne?', blankSentence: 'Ana _____?', missing: 'ne', options: ['ne', 'en', 'an'], fullText: 'Ana ne?' }
        ]
      },
      't': {
        letter: 't', upper: 'T', group: 'g1', groupName: '1. Grup (ANETİL)',
        soundWords: [
          { word: 'Tavşan', emoji: '🐰', position: 'başta', hasSound: true },
          { word: 'Timsah', emoji: '🐊', position: 'başta', hasSound: true },
          { word: 'Top', emoji: '⚽', position: 'başta', hasSound: true },
          { word: 'Tren', emoji: '🚂', position: 'başta', hasSound: true },
          { word: 'At', emoji: '🐴', position: 'sonda', hasSound: true },
          { word: 'Et', emoji: '🥩', position: 'sonda', hasSound: true },
          { word: 'Süt', emoji: '🥛', position: 'sonda', hasSound: true },
          { word: 'Anten', emoji: '📡', position: 'ortada', hasSound: true }
        ],
        noSoundWords: [
          { word: 'Elma', emoji: '🍎', hasSound: false },
          { word: 'Arı', emoji: '🐝', hasSound: false },
          { word: 'Ayı', emoji: '🐻', hasSound: false },
          { word: 'Kedi', emoji: '🐱', hasSound: false }
        ],
        cumulativeWords: [
          { word: 'AT', parts: ['A', 'T'], distractors: ['ET', 'TA'], icon: '🐴' },
          { word: 'ET', parts: ['E', 'T'], distractors: ['AT', 'TE'], icon: '🥩' },
          { word: 'TA', parts: ['T', 'A'], distractors: ['TE', 'NA'], icon: '🔤' },
          { word: 'TE', parts: ['T', 'E'], distractors: ['TA', 'NE'], icon: '🔤' },
          { word: 'TAN', parts: ['T', 'AN'], distractors: ['TEN', 'TA'], icon: '🌅' },
          { word: 'TEN', parts: ['T', 'EN'], distractors: ['TAN', 'TE'], icon: '🧴' },
          { word: 'NET', parts: ['N', 'ET'], distractors: ['TEN', 'NE'], icon: '🎯' },
          { word: 'TAT', parts: ['T', 'AT'], distractors: ['ET', 'TA'], icon: '👅' },
          { word: 'ATA', parts: ['A', 'TA'], distractors: ['TE', 'AN'], icon: '🇹🇷' },
          { word: 'TANE', parts: ['TA', 'NE'], distractors: ['TE', 'NA'], icon: '🌾' },
          { word: 'ANTEN', parts: ['AN', 'TEN'], distractors: ['TAN', 'TA'], icon: '📡' },
          { word: 'NATA', parts: ['NA', 'TA'], distractors: ['TE', 'AN'], icon: '⛵' }
        ],
        cumulativeSentences: [
          { sentence: 'Ata at.', blankSentence: 'Ata _____.', missing: 'at', options: ['at', 'et', 'tat'], fullText: 'Ata at.' },
          { sentence: 'Anne et tat.', blankSentence: 'Anne _____ tat.', missing: 'et', options: ['et', 'at', 'anten'], fullText: 'Anne et tat.' },
          { sentence: 'Ata tane tane tat.', blankSentence: 'Ata tane _____ tat.', missing: 'tane', options: ['tane', 'anten', 'ata'], fullText: 'Ata tane tane tat.' }
        ]
      },
      'i': {
        letter: 'i', upper: 'İ', group: 'g1', groupName: '1. Grup (ANETİL)',
        soundWords: [
          { word: 'İnek', emoji: '🐮', position: 'başta', hasSound: true },
          { word: 'İncir', emoji: '🫐', position: 'başta', hasSound: true },
          { word: 'İp', emoji: '🪢', position: 'başta', hasSound: true },
          { word: 'İki', emoji: '2️⃣', position: 'başta', hasSound: true },
          { word: 'Kedi', emoji: '🐱', position: 'sonda', hasSound: true },
          { word: 'Gemi', emoji: '🚢', position: 'sonda', hasSound: true },
          { word: 'Timsah', emoji: '🐊', position: 'ortada', hasSound: true }
        ],
        noSoundWords: [
          { word: 'Ayı', emoji: '🐻', hasSound: false },
          { word: 'At', emoji: '🐴', hasSound: false },
          { word: 'Top', emoji: '⚽', hasSound: false },
          { word: 'Kuş', emoji: '🐦', hasSound: false }
        ],
        cumulativeWords: [
          { word: 'İN', parts: ['İ', 'N'], distractors: ['AN', 'EN'], icon: '⬇️' },
          { word: 'İT', parts: ['İ', 'T'], distractors: ['AT', 'ET'], icon: '👉' },
          { word: 'Nİ', parts: ['N', 'İ'], distractors: ['NE', 'NA'], icon: '🔤' },
          { word: 'Tİ', parts: ['T', 'İ'], distractors: ['TE', 'TA'], icon: '🔤' },
          { word: 'NİN', parts: ['N', 'İN'], distractors: ['TİN', 'Nİ'], icon: '🔤' },
          { word: 'TİN', parts: ['T', 'İN'], distractors: ['NİN', 'Tİ'], icon: '🔤' },
          { word: 'NİNE', parts: ['Nİ', 'NE'], distractors: ['Tİ', 'NA'], icon: '👵' },
          { word: 'ANİ', parts: ['A', 'Nİ'], distractors: ['NE', 'Tİ'], icon: '⚡' },
          { word: 'İNAT', parts: ['İ', 'NAT'], distractors: ['AN', 'AT'], icon: '🐐' },
          { word: 'ETİ', parts: ['E', 'Tİ'], distractors: ['TE', 'TA'], icon: '🥩' },
          { word: 'TENİ', parts: ['TE', 'Nİ'], distractors: ['Tİ', 'NE'], icon: '🧴' }
        ],
        cumulativeSentences: [
          { sentence: 'Nine et tat.', blankSentence: 'Nine _____ tat.', missing: 'et', options: ['et', 'it', 'inat'], fullText: 'Nine et tat.' },
          { sentence: 'Ata in.', blankSentence: 'Ata _____.', missing: 'in', options: ['in', 'it', 'et'], fullText: 'Ata in.' },
          { sentence: 'Nine nane tat.', blankSentence: 'Nine _____ tat.', missing: 'nane', options: ['nane', 'tane', 'anten'], fullText: 'Nine nane tat.' },
          { sentence: 'Ata eti tat.', blankSentence: 'Ata _____ tat.', missing: 'eti', options: ['eti', 'teni', 'nine'], fullText: 'Ata eti tat.' }
        ]
      },
      'l': {
        letter: 'l', upper: 'L', group: 'g1', groupName: '1. Grup (ANETİL)',
        soundWords: [
          { word: 'Limon', emoji: '🍋', position: 'başta', hasSound: true },
          { word: 'Leylek', emoji: '🪶', position: 'başta', hasSound: true },
          { word: 'Lale', emoji: '🌷', position: 'başta', hasSound: true },
          { word: 'Aslan', emoji: '🦁', position: 'ortada', hasSound: true },
          { word: 'Balık', emoji: '🐟', position: 'ortada', hasSound: true },
          { word: 'Fil', emoji: '🐘', position: 'sonda', hasSound: true },
          { word: 'Gül', emoji: '🌹', position: 'sonda', hasSound: true }
        ],
        noSoundWords: [
          { word: 'Ayı', emoji: '🐻', hasSound: false },
          { word: 'Kedi', emoji: '🐱', hasSound: false },
          { word: 'Arı', emoji: '🐝', hasSound: false },
          { word: 'Kuş', emoji: '🐦', hasSound: false }
        ],
        cumulativeWords: [
          { word: 'EL', parts: ['E', 'L'], distractors: ['AL', 'İL'], icon: '✋' },
          { word: 'AL', parts: ['A', 'L'], distractors: ['EL', 'LA'], icon: '🔴' },
          { word: 'İL', parts: ['İ', 'L'], distractors: ['AL', 'Lİ'], icon: '🏙️' },
          { word: 'LA', parts: ['L', 'A'], distractors: ['LE', 'AL'], icon: '🔤' },
          { word: 'LE', parts: ['L', 'E'], distractors: ['LA', 'EL'], icon: '🔤' },
          { word: 'Lİ', parts: ['L', 'İ'], distractors: ['LE', 'İL'], icon: '🔤' },
          { word: 'TEL', parts: ['T', 'EL'], distractors: ['TAL', 'TE'], icon: '🧶' },
          { word: 'NAL', parts: ['N', 'AL'], distractors: ['NEL', 'NA'], icon: '🐎' },
          { word: 'ELA', parts: ['E', 'LA'], distractors: ['LE', 'NA'], icon: '👧' },
          { word: 'LALE', parts: ['LA', 'LE'], distractors: ['Lİ', 'TE'], icon: '🌷' },
          { word: 'ALİ', parts: ['A', 'Lİ'], distractors: ['LA', 'Tİ'], icon: '👦' },
          { word: 'AİLE', parts: ['A', 'İ', 'LE'], distractors: ['LA', 'NA'], icon: '👨‍👩‍👦' },
          { word: 'ELTİ', parts: ['EL', 'Tİ'], distractors: ['AL', 'TE'], icon: '👩‍🦰' },
          { word: 'TALAN', parts: ['TA', 'LAN'], distractors: ['TEL', 'TAN'], icon: '🌪️' },
          { word: 'ATLET', parts: ['AT', 'LET'], distractors: ['AL', 'TET'], icon: '🏃' },
          { word: 'NANELİ', parts: ['NA', 'NE', 'Lİ'], distractors: ['LE', 'LA'], icon: '🌿' },
          { word: 'TATİL', parts: ['TA', 'TİL'], distractors: ['TE', 'TEL'], icon: '🏖️' }
        ],
        cumulativeSentences: [
          { sentence: 'Ali lale al.', blankSentence: 'Ali _____ al.', missing: 'lale', options: ['lale', 'ela', 'nal'], fullText: 'Ali lale al.' },
          { sentence: 'Ela nane al.', blankSentence: 'Ela _____ al.', missing: 'nane', options: ['nane', 'atlet', 'lale'], fullText: 'Ela nane al.' },
          { sentence: 'Ali ata nal ilet.', blankSentence: 'Ali ata _____ ilet.', missing: 'nal', options: ['nal', 'tel', 'et'], fullText: 'Ali ata nal ilet.' },
          { sentence: 'Aile tatil et.', blankSentence: 'Aile _____ et.', missing: 'tatil', options: ['tatil', 'atlet', 'lale'], fullText: 'Aile tatil et.' }
        ]
      },

      // 2. GRUP (OKURIM)
      'o': {
        letter: 'o', upper: 'O', group: 'g2', groupName: '2. Grup (OKURIM)',
        soundWords: [
          { word: 'Otobüs', emoji: '🚌', position: 'başta', hasSound: true },
          { word: 'Orman', emoji: '🌲', position: 'başta', hasSound: true },
          { word: 'Otel', emoji: '🏨', position: 'başta', hasSound: true },
          { word: 'Balon', emoji: '🎈', position: 'ortada', hasSound: true },
          { word: 'Limon', emoji: '🍋', position: 'ortada', hasSound: true },
          { word: 'Radyo', emoji: '📻', position: 'sonda', hasSound: true }
        ],
        noSoundWords: [
          { word: 'Elma', emoji: '🍎', hasSound: false },
          { word: 'Arı', emoji: '🐝', hasSound: false },
          { word: 'Kedi', emoji: '🐱', hasSound: false }
        ],
        cumulativeWords: [
          { word: 'ON', parts: ['O', 'N'], distractors: ['AN'], icon: '🔟' },
          { word: 'OT', parts: ['O', 'T'], distractors: ['AT'], icon: '🌿' },
          { word: 'OTO', parts: ['O', 'TO'], distractors: ['TE'], icon: '🚗' },
          { word: 'OTEL', parts: ['O', 'TEL'], distractors: ['TAL'], icon: '🏨' },
          { word: 'ALO', parts: ['A', 'LO'], distractors: ['LA'], icon: '📞' }
        ],
        cumulativeSentences: [
          { sentence: 'Ali on lale al.', blankSentence: 'Ali _____ lale al.', missing: 'on', options: ['on', 'ot', 'oto'], fullText: 'Ali on lale al.' },
          { sentence: 'Ela otele ait.', blankSentence: 'Ela _____ ait.', missing: 'otele', options: ['otele', 'on', 'alo'], fullText: 'Ela otele ait.' }
        ]
      },
      'k': {
        letter: 'k', upper: 'K', group: 'g2', groupName: '2. Grup (OKURIM)',
        soundWords: [
          { word: 'Kedi', emoji: '🐱', position: 'başta', hasSound: true },
          { word: 'Köpek', emoji: '🐶', position: 'başta', hasSound: true },
          { word: 'Kuş', emoji: '🐦', position: 'başta', hasSound: true },
          { word: 'Kitap', emoji: '📚', position: 'başta', hasSound: true },
          { word: 'Tavuk', emoji: '🐔', position: 'sonda', hasSound: true },
          { word: 'Ördek', emoji: '🦆', position: 'sonda', hasSound: true },
          { word: 'Balık', emoji: '🐟', position: 'sonda', hasSound: true }
        ],
        noSoundWords: [
          { word: 'Arı', emoji: '🐝', hasSound: false },
          { word: 'Ayı', emoji: '🐻', hasSound: false },
          { word: 'Aslan', emoji: '🦁', hasSound: false }
        ],
        cumulativeWords: [
          { word: 'KALE', parts: ['KA', 'LE'], distractors: ['TE'], icon: '🏰' },
          { word: 'KOLİ', parts: ['KO', 'Lİ'], distractors: ['KA'], icon: '📦' },
          { word: 'İKİ', parts: ['İ', 'Kİ'], distractors: ['KA'], icon: '2️⃣' },
          { word: 'LEKE', parts: ['LE', 'KE'], distractors: ['LA'], icon: '👕' },
          { word: 'KEK', parts: ['K', 'EK'], distractors: ['AL'], icon: '🧁' }
        ],
        cumulativeSentences: [
          { sentence: 'Ali kek al.', blankSentence: 'Ali _____ al.', missing: 'kek', options: ['kek', 'kale', 'iki'], fullText: 'Ali kek al.' },
          { sentence: 'Ela iki koli al.', blankSentence: 'Ela _____ koli al.', missing: 'iki', options: ['iki', 'kek', 'leke'], fullText: 'Ela iki koli al.' }
        ]
      },
      'u': {
        letter: 'u', upper: 'U', group: 'g2', groupName: '2. Grup (OKURIM)',
        soundWords: [
          { word: 'Uçak', emoji: '✈️', position: 'başta', hasSound: true },
          { word: 'Uğur Böceği', emoji: '🐞', position: 'başta', hasSound: true },
          { word: 'Kutu', emoji: '📦', position: 'ortada', hasSound: true },
          { word: 'Koyun', emoji: '🐑', position: 'ortada', hasSound: true },
          { word: 'Bulut', emoji: '☁️', position: 'sonda', hasSound: true },
          { word: 'Kuku', emoji: '🦉', position: 'sonda', hasSound: true }
        ],
        noSoundWords: [
          { word: 'Kedi', emoji: '🐱', hasSound: false },
          { word: 'Elma', emoji: '🍎', hasSound: false },
          { word: 'Balık', emoji: '🐟', hasSound: false }
        ],
        cumulativeWords: [
          { word: 'UN', parts: ['U', 'N'], distractors: ['AN'], icon: '🌾' },
          { word: 'OKUL', parts: ['O', 'KUL'], distractors: ['KOL'], icon: '🏫' },
          { word: 'KULE', parts: ['KU', 'LE'], distractors: ['KA'], icon: '🗼' },
          { word: 'KUKLA', parts: ['KUK', 'LA'], distractors: ['KA'], icon: '🧸' },
          { word: 'KUTU', parts: ['KU', 'TU'], distractors: ['TE'], icon: '📦' }
        ],
        cumulativeSentences: [
          { sentence: 'Ela un al.', blankSentence: 'Ela _____ al.', missing: 'un', options: ['un', 'okul', 'kule'], fullText: 'Ela un al.' },
          { sentence: 'Ali okula kutu al.', blankSentence: 'Ali okula _____ al.', missing: 'kutu', options: ['kutu', 'un', 'kule'], fullText: 'Ali okula kutu al.' }
        ]
      },
      'r': {
        letter: 'r', upper: 'R', group: 'g2', groupName: '2. Grup (OKURIM)',
        soundWords: [
          { word: 'Radyo', emoji: '📻', position: 'başta', hasSound: true },
          { word: 'Robot', emoji: '🤖', position: 'başta', hasSound: true },
          { word: 'Roket', emoji: '🚀', position: 'başta', hasSound: true },
          { word: 'Araba', emoji: '🚗', position: 'ortada', hasSound: true },
          { word: 'Karpuz', emoji: '🍉', position: 'ortada', hasSound: true },
          { word: 'Nar', emoji: '🍎', position: 'sonda', hasSound: true },
          { word: 'Demir', emoji: '⛓️', position: 'sonda', hasSound: true }
        ],
        noSoundWords: [
          { word: 'Kedi', emoji: '🐱', hasSound: false },
          { word: 'Ayı', emoji: '🐻', hasSound: false },
          { word: 'Kuş', emoji: '🐦', hasSound: false }
        ],
        cumulativeWords: [
          { word: 'NAR', parts: ['N', 'AR'], distractors: ['ER'], icon: '🍎' },
          { word: 'KAR', parts: ['K', 'AR'], distractors: ['UR'], icon: '❄️' },
          { word: 'KART', parts: ['K', 'ART'], distractors: ['OR'], icon: '🃏' },
          { word: 'ROKET', parts: ['RO', 'KET'], distractors: ['TE'], icon: '🚀' },
          { word: 'TORUN', parts: ['TO', 'RUN'], distractors: ['RA'], icon: '👦' },
          { word: 'KİRA', parts: ['Kİ', 'RA'], distractors: ['RO'], icon: '🏠' }
        ],
        cumulativeSentences: [
          { sentence: 'Ali nar al.', blankSentence: 'Ali _____ al.', missing: 'nar', options: ['nar', 'kar', 'kart'], fullText: 'Ali nar al.' },
          { sentence: 'Torun roket al.', blankSentence: 'Torun _____ al.', missing: 'roket', options: ['roket', 'nar', 'kira'], fullText: 'Torun roket al.' }
        ]
      },
      'ı': {
        letter: 'ı', upper: 'I', group: 'g2', groupName: '2. Grup (OKURIM)',
        soundWords: [
          { word: 'Ispanak', emoji: '🥬', position: 'başta', hasSound: true },
          { word: 'Işık', emoji: '💡', position: 'başta', hasSound: true },
          { word: 'Irmak', emoji: '🏞️', position: 'başta', hasSound: true },
          { word: 'Balık', emoji: '🐟', position: 'ortada', hasSound: true },
          { word: 'Arı', emoji: '🐝', position: 'sonda', hasSound: true },
          { word: 'Atkı', emoji: '🧣', position: 'sonda', hasSound: true }
        ],
        noSoundWords: [
          { word: 'Kedi', emoji: '🐱', hasSound: false },
          { word: 'Köpek', emoji: '🐶', hasSound: false },
          { word: 'Kuş', emoji: '🐦', hasSound: false }
        ],
        cumulativeWords: [
          { word: 'ARI', parts: ['A', 'RI'], distractors: ['RA'], icon: '🐝' },
          { word: 'TIR', parts: ['T', 'IR'], distractors: ['AR'], icon: '🚛' },
          { word: 'ATKI', parts: ['AT', 'KI'], distractors: ['KA'], icon: '🧣' },
          { word: 'ILIK', parts: ['I', 'LIK'], distractors: ['LAK'], icon: '🥛' },
          { word: 'KALIN', parts: ['KA', 'LIN'], distractors: ['LAN'], icon: '📖' },
          { word: 'AKIL', parts: ['A', 'KIL'], distractors: ['KAL'], icon: '🧠' }
        ],
        cumulativeSentences: [
          { sentence: 'Ela kalın atkı tak.', blankSentence: 'Ela kalın _____ tak.', missing: 'atkı', options: ['atkı', 'arı', 'tır'], fullText: 'Ela kalın atkı tak.' },
          { sentence: 'Ali ılık un al.', blankSentence: 'Ali _____ un al.', missing: 'ılık', options: ['ılık', 'akıl', 'atkı'], fullText: 'Ali ılık un al.' }
        ]
      },
      'm': {
        letter: 'm', upper: 'M', group: 'g2', groupName: '2. Grup (OKURIM)',
        soundWords: [
          { word: 'Mantar', emoji: '🍄', position: 'başta', hasSound: true },
          { word: 'Maymun', emoji: '🐵', position: 'başta', hasSound: true },
          { word: 'Muz', emoji: '🍌', position: 'başta', hasSound: true },
          { word: 'Elma', emoji: '🍎', position: 'ortada', hasSound: true },
          { word: 'Kalem', emoji: '✏️', position: 'sonda', hasSound: true },
          { word: 'Limon', emoji: '🍋', position: 'ortada', hasSound: true },
          { word: 'Lokum', emoji: '🍬', position: 'sonda', hasSound: true }
        ],
        noSoundWords: [
          { word: 'Kedi', emoji: '🐱', hasSound: false },
          { word: 'Köpek', emoji: '🐶', hasSound: false },
          { word: 'Kuş', emoji: '🐦', hasSound: false }
        ],
        cumulativeWords: [
          { word: 'ELMA', parts: ['EL', 'MA'], distractors: ['LE'], icon: '🍎' },
          { word: 'KALEM', parts: ['KA', 'LEM'], distractors: ['LİM'], icon: '✏️' },
          { word: 'LİMON', parts: ['Lİ', 'MON'], distractors: ['MAN'], icon: '🍋' },
          { word: 'LOKUM', parts: ['LO', 'KUM'], distractors: ['KAM'], icon: '🍬' },
          { word: 'MUM', parts: ['M', 'UM'], distractors: ['AM'], icon: '🕯️' },
          { word: 'ARMUT', parts: ['AR', 'MUT'], distractors: ['MAT'], icon: '🍐' }
        ],
        cumulativeSentences: [
          { sentence: 'Ali elma al.', blankSentence: 'Ali _____ al.', missing: 'elma', options: ['elma', 'kalem', 'lokum'], fullText: 'Ali elma al.' },
          { sentence: 'Anne kalem al.', blankSentence: 'Anne _____ al.', missing: 'kalem', options: ['kalem', 'limon', 'mum'], fullText: 'Anne kalem al.' },
          { sentence: 'Ela lokum tat.', blankSentence: 'Ela _____ tat.', missing: 'lokum', options: ['lokum', 'armut', 'elma'], fullText: 'Ela lokum tat.' }
        ]
      },

      // 3. GRUP (ÜSÖYDZ)
      'ü': {
        letter: 'ü', upper: 'Ü', group: 'g3', groupName: '3. Grup (ÜSÖYDZ)',
        soundWords: [
          { word: 'Üzüm', emoji: '🍇', position: 'başta', hasSound: true },
          { word: 'Ütü', emoji: '🧼', position: 'başta', hasSound: true },
          { word: 'Düdük', emoji: '🎺', position: 'ortada', hasSound: true },
          { word: 'Gül', emoji: '🌹', position: 'ortada', hasSound: true },
          { word: 'Süt', emoji: '🥛', position: 'ortada', hasSound: true }
        ],
        noSoundWords: [{ word: 'Elma', emoji: '🍎', hasSound: false }, { word: 'Arı', emoji: '🐝', hasSound: false }],
        cumulativeWords: [
          { word: 'ÜTÜ', parts: ['Ü', 'TÜ'], distractors: ['TA'], icon: '🧼' },
          { word: 'TÜL', parts: ['T', 'ÜL'], distractors: ['AL'], icon: '🪟' },
          { word: 'ÜNLÜ', parts: ['ÜN', 'LÜ'], distractors: ['LA'], icon: '⭐' },
          { word: 'TÜNEL', parts: ['TÜ', 'NEL'], distractors: ['NAL'], icon: '🚇' },
          { word: 'KÜTÜK', parts: ['KÜ', 'TÜK'], distractors: ['TAK'], icon: '🪵' }
        ],
        cumulativeSentences: [
          { sentence: 'Anne tül al.', blankSentence: 'Anne _____ al.', missing: 'tül', options: ['tül', 'ütü', 'ünlü'], fullText: 'Anne tül al.' },
          { sentence: 'Ali tül ütüle.', blankSentence: 'Ali tül _____.', missing: 'ütüle', options: ['ütüle', 'tut', 'al'], fullText: 'Ali tül ütüle.' }
        ]
      },
      's': {
        letter: 's', upper: 'S', group: 'g3', groupName: '3. Grup (ÜSÖYDZ)',
        soundWords: [
          { word: 'Salyangoz', emoji: '🐌', position: 'başta', hasSound: true },
          { word: 'Saat', emoji: '⏰', position: 'başta', hasSound: true },
          { word: 'Süt', emoji: '🥛', position: 'başta', hasSound: true },
          { word: 'Masa', emoji: '🪑', position: 'ortada', hasSound: true },
          { word: 'Aslan', emoji: '🦁', position: 'ortada', hasSound: true },
          { word: 'Ses', emoji: '🔊', position: 'sonda', hasSound: true }
        ],
        noSoundWords: [{ word: 'Kedi', emoji: '🐱', hasSound: false }, { word: 'Fil', emoji: '🐘', hasSound: false }],
        cumulativeWords: [
          { word: 'SU', parts: ['S', 'U'], distractors: ['SA'], icon: '💧' },
          { word: 'SÜT', parts: ['S', 'ÜT'], distractors: ['AT'], icon: '🥛' },
          { word: 'MASA', parts: ['MA', 'SA'], distractors: ['SO'], icon: '🪑' },
          { word: 'KASA', parts: ['KA', 'SA'], distractors: ['SE'], icon: '🪙' },
          { word: 'SİMİT', parts: ['Sİ', 'MİT'], distractors: ['MAT'], icon: '🥯' },
          { word: 'SARI', parts: ['SA', 'RI'], distractors: ['RO'], icon: '🟡' }
        ],
        cumulativeSentences: [
          { sentence: 'Ali süt tat.', blankSentence: 'Ali _____ tat.', missing: 'süt', options: ['süt', 'su', 'simit'], fullText: 'Ali süt tat.' },
          { sentence: 'Anne simit al.', blankSentence: 'Anne _____ al.', missing: 'simit', options: ['simit', 'masa', 'kasa'], fullText: 'Anne simit al.' }
        ]
      },
      'ö': {
        letter: 'ö', upper: 'Ö', group: 'g3', groupName: '3. Grup (ÜSÖYDZ)',
        soundWords: [
          { word: 'Ördek', emoji: '🦆', position: 'başta', hasSound: true },
          { word: 'Önlük', emoji: '🥼', position: 'başta', hasSound: true },
          { word: 'Örümcek', emoji: '🕷️', position: 'başta', hasSound: true },
          { word: 'Göz', emoji: '👁️', position: 'ortada', hasSound: true },
          { word: 'Köy', emoji: '🏡', position: 'ortada', hasSound: true }
        ],
        noSoundWords: [{ word: 'Elma', emoji: '🍎', hasSound: false }, { word: 'Ayı', emoji: '🐻', hasSound: false }],
        cumulativeWords: [
          { word: 'ÖN', parts: ['Ö', 'N'], distractors: ['AN'], icon: '⬆️' },
          { word: 'ÖRTÜ', parts: ['ÖR', 'TÜ'], distractors: ['TA'], icon: '🛏️' },
          { word: 'ÖMÜR', parts: ['Ö', 'MÜR'], distractors: ['MAR'], icon: '⏳' },
          { word: 'KÖMÜR', parts: ['KÖ', 'MÜR'], distractors: ['KUM'], icon: '🪵' }
        ],
        cumulativeSentences: [
          { sentence: 'Ela örtü ser.', blankSentence: 'Ela _____ ser.', missing: 'örtü', options: ['örtü', 'ömür', 'ön'], fullText: 'Ela örtü ser.' },
          { sentence: 'Ömer kömür al.', blankSentence: 'Ömer _____ al.', missing: 'kömür', options: ['kömür', 'örtü', 'ön'], fullText: 'Ömer kömür al.' }
        ]
      },
      'y': {
        letter: 'y', upper: 'Y', group: 'g3', groupName: '3. Grup (ÜSÖYDZ)',
        soundWords: [
          { word: 'Yıldız', emoji: '⭐', position: 'başta', hasSound: true },
          { word: 'Yılan', emoji: '🐍', position: 'başta', hasSound: true },
          { word: 'Yumurta', emoji: '🥚', position: 'başta', hasSound: true },
          { word: 'Ayı', emoji: '🐻', position: 'ortada', hasSound: true },
          { word: 'Ayna', emoji: '🪞', position: 'ortada', hasSound: true },
          { word: 'Ay', emoji: '🌙', position: 'sonda', hasSound: true }
        ],
        noSoundWords: [{ word: 'Kedi', emoji: '🐱', hasSound: false }, { word: 'Balık', emoji: '🐟', hasSound: false }],
        cumulativeWords: [
          { word: 'AY', parts: ['A', 'Y'], distractors: ['OY'], icon: '🌙' },
          { word: 'YOL', parts: ['Y', 'OL'], distractors: ['AL'], icon: '🛣️' },
          { word: 'AYNA', parts: ['AY', 'NA'], distractors: ['NE'], icon: '🪞' },
          { word: 'YEMEK', parts: ['YE', 'MEK'], distractors: ['MAK'], icon: '🍲' },
          { word: 'KUYU', parts: ['KU', 'YU'], distractors: ['YA'], icon: '🪣' },
          { word: 'YATAK', parts: ['YA', 'TAK'], distractors: ['TOK'], icon: '🛏️' }
        ],
        cumulativeSentences: [
          { sentence: 'Ali yemek ye.', blankSentence: 'Ali _____ ye.', missing: 'yemek', options: ['yemek', 'ayna', 'yatak'], fullText: 'Ali yemek ye.' },
          { sentence: 'Ela ayna al.', blankSentence: 'Ela _____ al.', missing: 'ayna', options: ['ayna', 'yol', 'kuyu'], fullText: 'Ela ayna al.' }
        ]
      },
      'd': {
        letter: 'd', upper: 'D', group: 'g3', groupName: '3. Grup (ÜSÖYDZ)',
        soundWords: [
          { word: 'Deve', emoji: '🐪', position: 'başta', hasSound: true },
          { word: 'Dondurma', emoji: '🍦', position: 'başta', hasSound: true },
          { word: 'Düdük', emoji: '🎺', position: 'başta', hasSound: true },
          { word: 'Ördek', emoji: '🦆', position: 'ortada', hasSound: true },
          { word: 'Kedi', emoji: '🐱', position: 'ortada', hasSound: true }
        ],
        noSoundWords: [{ word: 'Arı', emoji: '🐝', hasSound: false }, { word: 'Ayı', emoji: '🐻', hasSound: false }],
        cumulativeWords: [
          { word: 'DEDE', parts: ['DE', 'DE'], distractors: ['DA'], icon: '👴' },
          { word: 'KEDİ', parts: ['KE', 'Dİ'], distractors: ['DA'], icon: '🐱' },
          { word: 'ODA', parts: ['O', 'DA'], distractors: ['DE'], icon: '🚪' },
          { word: 'DÜDÜK', parts: ['DÜ', 'DÜK'], distractors: ['DAK'], icon: '🎺' },
          { word: 'ÖRDEK', parts: ['ÖR', 'DEK'], distractors: ['DAK'], icon: '🦆' }
        ],
        cumulativeSentences: [
          { sentence: 'Dede kediye süt dök.', blankSentence: 'Dede _____ süt dök.', missing: 'kediye', options: ['kediye', 'ördek', 'düdük'], fullText: 'Dede kediye süt dök.' },
          { sentence: 'Ali odada kal.', blankSentence: 'Ali _____ kal.', missing: 'odada', options: ['odada', 'dede', 'kedi'], fullText: 'Ali odada kal.' }
        ]
      },
      'z': {
        letter: 'z', upper: 'Z', group: 'g3', groupName: '3. Grup (ÜSÖYDZ)',
        soundWords: [
          { word: 'Zebra', emoji: '🦓', position: 'başta', hasSound: true },
          { word: 'Zürafa', emoji: '🦒', position: 'başta', hasSound: true },
          { word: 'Zil', emoji: '🔔', position: 'başta', hasSound: true },
          { word: 'Kiraz', emoji: '🍒', position: 'sonda', hasSound: true },
          { word: 'Yıldız', emoji: '⭐', position: 'sonda', hasSound: true },
          { word: 'Deniz', emoji: '🌊', position: 'sonda', hasSound: true }
        ],
        noSoundWords: [{ word: 'Kedi', emoji: '🐱', hasSound: false }, { word: 'Ayı', emoji: '🐻', hasSound: false }],
        cumulativeWords: [
          { word: 'MUZ', parts: ['M', 'UZ'], distractors: ['AZ'], icon: '🍌' },
          { word: 'TUZ', parts: ['T', 'UZ'], distractors: ['OZ'], icon: '🧂' },
          { word: 'ZİL', parts: ['Z', 'İL'], distractors: ['AL'], icon: '🔔' },
          { word: 'KİRAZ', parts: ['Kİ', 'RAZ'], distractors: ['REZ'], icon: '🍒' },
          { word: 'DENİZ', parts: ['DE', 'NİZ'], distractors: ['NAZ'], icon: '🌊' },
          { word: 'YILDIZ', parts: ['YIL', 'DIZ'], distractors: ['DAZ'], icon: '⭐' }
        ],
        cumulativeSentences: [
          { sentence: 'Ali kiraz ye.', blankSentence: 'Ali _____ ye.', missing: 'kiraz', options: ['kiraz', 'tuz', 'zil'], fullText: 'Ali kiraz ye.' },
          { sentence: 'Ela denize yüz.', blankSentence: 'Ela _____ yüz.', missing: 'denize', options: ['denize', 'yıldız', 'muz'], fullText: 'Ela denize yüz.' }
        ]
      },

      // 4. GRUP (ÇBGCŞ)
      'ç': {
        letter: 'ç', upper: 'Ç', group: 'g4', groupName: '4. Grup (ÇBGCŞ)',
        soundWords: [
          { word: 'Çilek', emoji: '🍓', position: 'başta', hasSound: true },
          { word: 'Çiçek', emoji: '🌸', position: 'başta', hasSound: true },
          { word: 'Çekiç', emoji: '🔨', position: 'başta', hasSound: true },
          { word: 'Ağaç', emoji: '🌳', position: 'sonda', hasSound: true },
          { word: 'Taç', emoji: '👑', position: 'sonda', hasSound: true }
        ],
        noSoundWords: [{ word: 'Elma', emoji: '🍎', hasSound: false }, { word: 'Kedi', emoji: '🐱', hasSound: false }],
        cumulativeWords: [
          { word: 'ÇAY', parts: ['Ç', 'AY'], distractors: ['OY'], icon: '🍵' },
          { word: 'ÇAM', parts: ['Ç', 'AM'], distractors: ['OM'], icon: '🌲' },
          { word: 'ÇİÇEK', parts: ['Çİ', 'ÇEK'], distractors: ['ÇAK'], icon: '🌸' },
          { word: 'ÇİLEK', parts: ['Çİ', 'LEK'], distractors: ['LAK'], icon: '🍓' },
          { word: 'ÇANTA', parts: ['ÇAN', 'TA'], distractors: ['TE'], icon: '🎒' }
        ],
        cumulativeSentences: [
          { sentence: 'Ela çilek ye.', blankSentence: 'Ela _____ ye.', missing: 'çilek', options: ['çilek', 'çay', 'çam'], fullText: 'Ela çilek ye.' },
          { sentence: 'Ali çay iç.', blankSentence: 'Ali _____ iç.', missing: 'çay', options: ['çay', 'çanta', 'çiçek'], fullText: 'Ali çay iç.' }
        ]
      },
      'b': {
        letter: 'b', upper: 'B', group: 'g4', groupName: '4. Grup (ÇBGCŞ)',
        soundWords: [
          { word: 'Balık', emoji: '🐟', position: 'başta', hasSound: true },
          { word: 'Bebek', emoji: '👶', position: 'başta', hasSound: true },
          { word: 'Biber', emoji: '🫑', position: 'başta', hasSound: true },
          { word: 'Bulut', emoji: '☁️', position: 'başta', hasSound: true },
          { word: 'Sabun', emoji: '🧼', position: 'ortada', hasSound: true },
          { word: 'Araba', emoji: '🚗', position: 'ortada', hasSound: true }
        ],
        noSoundWords: [{ word: 'Kedi', emoji: '🐱', hasSound: false }, { word: 'Fil', emoji: '🐘', hasSound: false }],
        cumulativeWords: [
          { word: 'BAL', parts: ['B', 'AL'], distractors: ['EL'], icon: '🍯' },
          { word: 'BEBEK', parts: ['BE', 'BEK'], distractors: ['BAK'], icon: '👶' },
          { word: 'BALIK', parts: ['BA', 'LIK'], distractors: ['LAK'], icon: '🐟' },
          { word: 'BULUT', parts: ['BU', 'LUT'], distractors: ['LAT'], icon: '☁️' },
          { word: 'BİBER', parts: ['Bİ', 'BER'], distractors: ['BAR'], icon: '🫑' },
          { word: 'SABUN', parts: ['SA', 'BUN'], distractors: ['BAN'], icon: '🧼' }
        ],
        cumulativeSentences: [
          { sentence: 'Ali balık tut.', blankSentence: 'Ali _____ tut.', missing: 'balık', options: ['balık', 'bebek', 'bal'], fullText: 'Ali balık tut.' },
          { sentence: 'Bebek süt iç.', blankSentence: '_____ süt iç.', missing: 'bebek', options: ['bebek', 'sabun', 'bulut'], fullText: 'Bebek süt iç.' }
        ]
      },
      'g': {
        letter: 'g', upper: 'G', group: 'g4', groupName: '4. Grup (ÇBGCŞ)',
        soundWords: [
          { word: 'Gemi', emoji: '🚢', position: 'başta', hasSound: true },
          { word: 'Gül', emoji: '🌹', position: 'başta', hasSound: true },
          { word: 'Gözlük', emoji: '👓', position: 'başta', hasSound: true },
          { word: 'Geyik', emoji: '🦌', position: 'başta', hasSound: true },
          { word: 'Gaga', emoji: '🦜', position: 'başta', hasSound: true }
        ],
        noSoundWords: [{ word: 'Elma', emoji: '🍎', hasSound: false }, { word: 'Ayı', emoji: '🐻', hasSound: false }],
        cumulativeWords: [
          { word: 'GÜL', parts: ['G', 'ÜL'], distractors: ['AL'], icon: '🌹' },
          { word: 'GEMİ', parts: ['GE', 'Mİ'], distractors: ['MA'], icon: '🚢' },
          { word: 'GEYİK', parts: ['GE', 'YİK'], distractors: ['YAK'], icon: '🦌' },
          { word: 'GÖZLÜK', parts: ['GÖZ', 'LÜK'], distractors: ['LAK'], icon: '👓' },
          { word: 'GAGA', parts: ['GA', 'GA'], distractors: ['GO'], icon: '🦜' }
        ],
        cumulativeSentences: [
          { sentence: 'Ali gül al.', blankSentence: 'Ali _____ al.', missing: 'gül', options: ['gül', 'gemi', 'gözlük'], fullText: 'Ali gül al.' },
          { sentence: 'Gemi denizde yüz.', blankSentence: '_____ denizde yüz.', missing: 'gemi', options: ['gemi', 'geyik', 'gül'], fullText: 'Gemi denizde yüz.' }
        ]
      },
      'c': {
        letter: 'c', upper: 'C', group: 'g4', groupName: '4. Grup (ÇBGCŞ)',
        soundWords: [
          { word: 'Civciv', emoji: '🐥', position: 'başta', hasSound: true },
          { word: 'Ceviz', emoji: '🌰', position: 'başta', hasSound: true },
          { word: 'Cam', emoji: '🪟', position: 'başta', hasSound: true },
          { word: 'Ceket', emoji: '🧥', position: 'başta', hasSound: true },
          { word: 'Cüce', emoji: '🧙', position: 'başta', hasSound: true },
          { word: 'Amca', emoji: '👨', position: 'ortada', hasSound: true }
        ],
        noSoundWords: [{ word: 'Kedi', emoji: '🐱', hasSound: false }, { word: 'Balık', emoji: '🐟', hasSound: false }],
        cumulativeWords: [
          { word: 'CAM', parts: ['C', 'AM'], distractors: ['EM'], icon: '🪟' },
          { word: 'CÜCE', parts: ['CÜ', 'CE'], distractors: ['CA'], icon: '🧙' },
          { word: 'CEKET', parts: ['CE', 'KET'], distractors: ['KAT'], icon: '🧥' },
          { word: 'AMCA', parts: ['AM', 'CA'], distractors: ['CO'], icon: '👨' }
        ],
        cumulativeSentences: [
          { sentence: 'Amca cam sil.', blankSentence: 'Amca _____ sil.', missing: 'cam', options: ['cam', 'ceket', 'cüce'], fullText: 'Amca cam sil.' },
          { sentence: 'Ali ceket giy.', blankSentence: 'Ali _____ giy.', missing: 'ceket', options: ['ceket', 'cüce', 'amca'], fullText: 'Ali ceket giy.' }
        ]
      },
      'ş': {
        letter: 'ş', upper: 'Ş', group: 'g4', groupName: '4. Grup (ÇBGCŞ)',
        soundWords: [
          { word: 'Şapka', emoji: '🧢', position: 'başta', hasSound: true },
          { word: 'Şeker', emoji: '🍬', position: 'başta', hasSound: true },
          { word: 'Şişe', emoji: '🍾', position: 'başta', hasSound: true },
          { word: 'Kuş', emoji: '🐦', position: 'sonda', hasSound: true },
          { word: 'Diş', emoji: '🦷', position: 'sonda', hasSound: true },
          { word: 'Güneş', emoji: '☀️', position: 'sonda', hasSound: true },
          { word: 'Kaşık', emoji: '🥄', position: 'ortada', hasSound: true }
        ],
        noSoundWords: [{ word: 'Kedi', emoji: '🐱', hasSound: false }, { word: 'Elma', emoji: '🍎', hasSound: false }],
        cumulativeWords: [
          { word: 'KUŞ', parts: ['K', 'UŞ'], distractors: ['AŞ'], icon: '🐦' },
          { word: 'DİŞ', parts: ['D', 'İŞ'], distractors: ['EŞ'], icon: '🦷' },
          { word: 'TAŞ', parts: ['T', 'AŞ'], distractors: ['OŞ'], icon: '🪨' },
          { word: 'ŞİŞE', parts: ['Şİ', 'ŞE'], distractors: ['ŞA'], icon: '🍾' },
          { word: 'GÜNEŞ', parts: ['GÜ', 'NEŞ'], distractors: ['NAŞ'], icon: '☀️' },
          { word: 'ŞEKER', parts: ['ŞE', 'KER'], distractors: ['KAR'], icon: '🍬' }
        ],
        cumulativeSentences: [
          { sentence: 'Ali şişe tut.', blankSentence: 'Ali _____ tut.', missing: 'şişe', options: ['şişe', 'kuş', 'taş'], fullText: 'Ali şişe tut.' },
          { sentence: 'Güneş açtı.', blankSentence: '_____ açtı.', missing: 'güneş', options: ['güneş', 'şeker', 'diş'], fullText: 'Güneş açtı.' }
        ]
      },

      // 5. GRUP (PHVĞFJ)
      'p': {
        letter: 'p', upper: 'P', group: 'g5', groupName: '5. Grup (PHVĞFJ)',
        soundWords: [
          { word: 'Portakal', emoji: '🍊', position: 'başta', hasSound: true },
          { word: 'Pasta', emoji: '🎂', position: 'başta', hasSound: true },
          { word: 'Pamuk', emoji: '☁️', position: 'başta', hasSound: true },
          { word: 'Top', emoji: '⚽', position: 'sonda', hasSound: true },
          { word: 'İp', emoji: '🪢', position: 'sonda', hasSound: true },
          { word: 'Köpek', emoji: '🐶', position: 'ortada', hasSound: true },
          { word: 'Kapı', emoji: '🚪', position: 'ortada', hasSound: true }
        ],
        noSoundWords: [{ word: 'Kedi', emoji: '🐱', hasSound: false }, { word: 'Arı', emoji: '🐝', hasSound: false }],
        cumulativeWords: [
          { word: 'TOP', parts: ['T', 'OP'], distractors: ['AP'], icon: '⚽' },
          { word: 'İP', parts: ['İ', 'P'], distractors: ['EP'], icon: '🪢' },
          { word: 'KAPI', parts: ['KA', 'PI'], distractors: ['PA'], icon: '🚪' },
          { word: 'PASTA', parts: ['PAS', 'TA'], distractors: ['TE'], icon: '🎂' },
          { word: 'KÖPEK', parts: ['KÖ', 'PEK'], distractors: ['PAK'], icon: '🐶' },
          { word: 'SEPET', parts: ['SE', 'PET'], distractors: ['PAT'], icon: '🧺' }
        ],
        cumulativeSentences: [
          { sentence: 'Ali top oyna.', blankSentence: 'Ali _____ oyna.', missing: 'top', options: ['top', 'ip', 'kapı'], fullText: 'Ali top oyna.' },
          { sentence: 'Ela pasta yap.', blankSentence: 'Ela _____ yap.', missing: 'pasta', options: ['pasta', 'köpek', 'sepet'], fullText: 'Ela pasta yap.' }
        ]
      },
      'h': {
        letter: 'h', upper: 'H', group: 'g5', groupName: '5. Grup (PHVĞFJ)',
        soundWords: [
          { word: 'Havuç', emoji: '🥕', position: 'başta', hasSound: true },
          { word: 'Horoz', emoji: '🐓', position: 'başta', hasSound: true },
          { word: 'Halı', emoji: '🧶', position: 'başta', hasSound: true },
          { word: 'Hediye', emoji: '🎁', position: 'başta', hasSound: true },
          { word: 'Timsah', emoji: '🐊', position: 'sonda', hasSound: true },
          { word: 'Sabah', emoji: '🌅', position: 'sonda', hasSound: true },
          { word: 'Bahçe', emoji: '🏡', position: 'ortada', hasSound: true }
        ],
        noSoundWords: [{ word: 'Elma', emoji: '🍎', hasSound: false }, { word: 'Ayı', emoji: '🐻', hasSound: false }],
        cumulativeWords: [
          { word: 'HALI', parts: ['HA', 'LI'], distractors: ['LA'], icon: '🧶' },
          { word: 'HOROZ', parts: ['HO', 'ROZ'], distractors: ['RAZ'], icon: '🐓' },
          { word: 'HEDİYE', parts: ['HE', 'Dİ', 'YE'], distractors: ['YA'], icon: '🎁' },
          { word: 'HAMSİ', parts: ['HAM', 'Sİ'], distractors: ['SO'], icon: '🐟' },
          { word: 'SABAH', parts: ['SA', 'BAH'], distractors: ['BEH'], icon: '🌅' }
        ],
        cumulativeSentences: [
          { sentence: 'Horoz sabah öttü.', blankSentence: '_____ sabah öttü.', missing: 'horoz', options: ['horoz', 'halı', 'hediye'], fullText: 'Horoz sabah öttü.' },
          { sentence: 'Ela hediye al.', blankSentence: 'Ela _____ al.', missing: 'hediye', options: ['hediye', 'hamsi', 'sabah'], fullText: 'Ela hediye al.' }
        ]
      },
      'v': {
        letter: 'v', upper: 'V', group: 'g5', groupName: '5. Grup (PHVĞFJ)',
        soundWords: [
          { word: 'Vapur', emoji: '⛴️', position: 'başta', hasSound: true },
          { word: 'Vazo', emoji: '🏺', position: 'başta', hasSound: true },
          { word: 'Vida', emoji: '🔩', position: 'başta', hasSound: true },
          { word: 'Deve', emoji: '🐪', position: 'ortada', hasSound: true },
          { word: 'Civciv', emoji: '🐥', position: 'sonda', hasSound: true },
          { word: 'Ev', emoji: '🏠', position: 'sonda', hasSound: true }
        ],
        noSoundWords: [{ word: 'Kedi', emoji: '🐱', hasSound: false }, { word: 'Balık', emoji: '🐟', hasSound: false }],
        cumulativeWords: [
          { word: 'EV', parts: ['E', 'V'], distractors: ['AV'], icon: '🏠' },
          { word: 'DEVE', parts: ['DE', 'VE'], distractors: ['VA'], icon: '🐪' },
          { word: 'VAZO', parts: ['VA', 'ZO'], distractors: ['ZE'], icon: '🏺' },
          { word: 'VAPUR', parts: ['VA', 'PUR'], distractors: ['PAR'], icon: '⛴️' },
          { word: 'KAVUN', parts: ['KA', 'VUN'], distractors: ['VAN'], icon: '🍈' },
          { word: 'CİVCİV', parts: ['CİV', 'CİV'], distractors: ['CAV'], icon: '🐥' }
        ],
        cumulativeSentences: [
          { sentence: 'Vapur denizde yüz.', blankSentence: '_____ denizde yüz.', missing: 'vapur', options: ['vapur', 'vazo', 'deve'], fullText: 'Vapur denizde yüz.' },
          { sentence: 'Eve vazo koy.', blankSentence: 'Eve _____ koy.', missing: 'vazo', options: ['vazo', 'kavun', 'civciv'], fullText: 'Eve vazo koy.' }
        ]
      },
      'ğ': {
        letter: 'ğ', upper: 'Ğ', group: 'g5', groupName: '5. Grup (PHVĞFJ)',
        soundWords: [
          { word: 'Ağaç', emoji: '🌳', position: 'ortada', hasSound: true },
          { word: 'Yağmur', emoji: '🌧️', position: 'ortada', hasSound: true },
          { word: 'Düğme', emoji: '🔘', position: 'ortada', hasSound: true },
          { word: 'İğne', emoji: '🪡', position: 'ortada', hasSound: true },
          { word: 'Dağ', emoji: '⛰️', position: 'sonda', hasSound: true },
          { word: 'Bağ', emoji: '🍇', position: 'sonda', hasSound: true }
        ],
        noSoundWords: [{ word: 'Kedi', emoji: '🐱', hasSound: false }, { word: 'Elma', emoji: '🍎', hasSound: false }],
        cumulativeWords: [
          { word: 'DAĞ', parts: ['D', 'AĞ'], distractors: ['EĞ'], icon: '⛰️' },
          { word: 'YAĞ', parts: ['Y', 'AĞ'], distractors: ['OĞ'], icon: '🧈' },
          { word: 'AĞAÇ', parts: ['A', 'ĞAÇ'], distractors: ['GEÇ'], icon: '🌳' },
          { word: 'DÜĞME', parts: ['DÜĞ', 'ME'], distractors: ['MA'], icon: '🔘' },
          { word: 'İĞNE', parts: ['İĞ', 'NE'], distractors: ['NA'], icon: '🪡' },
          { word: 'YAĞMUR', parts: ['YAĞ', 'MUR'], distractors: ['MAR'], icon: '🌧️' }
        ],
        cumulativeSentences: [
          { sentence: 'Dağda yağmur yağdı.', blankSentence: 'Dağda _____ yağdı.', missing: 'yağmur', options: ['yağmur', 'ağaç', 'düğme'], fullText: 'Dağda yağmur yağdı.' },
          { sentence: 'Ağaçta kuş öttü.', blankSentence: '_____ kuş öttü.', missing: 'ağaçta', options: ['ağaçta', 'dağ', 'iğne'], fullText: 'Ağaçta kuş öttü.' }
        ]
      },
      'f': {
        letter: 'f', upper: 'F', group: 'g5', groupName: '5. Grup (PHVĞFJ)',
        soundWords: [
          { word: 'Fil', emoji: '🐘', position: 'başta', hasSound: true },
          { word: 'Fare', emoji: '🐭', position: 'başta', hasSound: true },
          { word: 'Fındık', emoji: '🌰', position: 'başta', hasSound: true },
          { word: 'Fırça', emoji: '🪥', position: 'başta', hasSound: true },
          { word: 'Telefon', emoji: '📱', position: 'ortada', hasSound: true },
          { word: 'Zürafa', emoji: '🦒', position: 'ortada', hasSound: true }
        ],
        noSoundWords: [{ word: 'Kedi', emoji: '🐱', hasSound: false }, { word: 'Ayı', emoji: '🐻', hasSound: false }],
        cumulativeWords: [
          { word: 'FİL', parts: ['F', 'İL'], distractors: ['AL'], icon: '🐘' },
          { word: 'FARE', parts: ['FA', 'RE'], distractors: ['RO'], icon: '🐭' },
          { word: 'FINDIK', parts: ['FIN', 'DIK'], distractors: ['DAK'], icon: '🌰' },
          { word: 'FIRÇA', parts: ['FIR', 'ÇA'], distractors: ['ÇO'], icon: '🪥' },
          { word: 'FENER', parts: ['FE', 'NER'], distractors: ['NAR'], icon: '🔦' },
          { word: 'TELEFON', parts: ['TE', 'LE', 'FON'], distractors: ['FAN'], icon: '📱' }
        ],
        cumulativeSentences: [
          { sentence: 'Fil fındık yedi.', blankSentence: 'Fil _____ yedi.', missing: 'fındık', options: ['fındık', 'fare', 'fener'], fullText: 'Fil fındık yedi.' },
          { sentence: 'Telefon çaldı.', blankSentence: '_____ çaldı.', missing: 'telefon', options: ['telefon', 'fırça', 'fil'], fullText: 'Telefon çaldı.' }
        ]
      },
      'j': {
        letter: 'j', upper: 'J', group: 'g5', groupName: '5. Grup (PHVĞFJ)',
        soundWords: [
          { word: 'Jelibon', emoji: '🍬', position: 'başta', hasSound: true },
          { word: 'Jant', emoji: '🛞', position: 'başta', hasSound: true },
          { word: 'Jet', emoji: '✈️', position: 'başta', hasSound: true },
          { word: 'Ruj', emoji: '💄', position: 'sonda', hasSound: true },
          { word: 'Garaj', emoji: '🏠', position: 'sonda', hasSound: true },
          { word: 'Mesaj', emoji: '💬', position: 'sonda', hasSound: true },
          { word: 'Viraj', emoji: '🔄', position: 'sonda', hasSound: true }
        ],
        noSoundWords: [{ word: 'Kedi', emoji: '🐱', hasSound: false }, { word: 'Elma', emoji: '🍎', hasSound: false }],
        cumulativeWords: [
          { word: 'JET', parts: ['J', 'ET'], distractors: ['AT'], icon: '✈️' },
          { word: 'RUJ', parts: ['R', 'UJ'], distractors: ['AJ'], icon: '💄' },
          { word: 'JANT', parts: ['J', 'ANT'], distractors: ['ONT'], icon: '🛞' },
          { word: 'GARAJ', parts: ['GA', 'RAJ'], distractors: ['ROJ'], icon: '🏠' },
          { word: 'MESAJ', parts: ['ME', 'SAJ'], distractors: ['SOJ'], icon: '💬' },
          { word: 'VİRAJ', parts: ['Vİ', 'RAJ'], distractors: ['ROJ'], icon: '🔄' }
        ],
        cumulativeSentences: [
          { sentence: 'Jet hızla uçtu.', blankSentence: '_____ hızla uçtu.', missing: 'jet', options: ['jet', 'ruj', 'jant'], fullText: 'Jet hızla uçtu.' },
          { sentence: 'Araba garaja girdi.', blankSentence: 'Araba _____ girdi.', missing: 'garaja', options: ['garaja', 'mesaj', 'viraj'], fullText: 'Araba garaja girdi.' }
        ]
      }
    }
  };

  function getLearnedLettersUpTo(letter) {
    const idx = MAARIF_2026_CONFIG.letterOrder.indexOf((letter || 'a').toLowerCase());
    if (idx === -1) return ['A'];
    return MAARIF_2026_CONFIG.letterOrder.slice(0, idx + 1).map(l => l.toUpperCase('tr-TR'));
  }

  /**
   * TÜRKİYE YÜZYILI MAARİF MODELİ DİNAMİK KÜMÜLATİF DOĞRULAMA MOTORU
   * 5 Ses Grubu (ANETİL, OKURIM, ÜSÖYDZ, ÇBGCŞ, PHVĞFJ) için harf indeksine göre
   * henüz öğrenilmemiş sesleri içeren hece/kelimeleri KESİNLİKLE filtreler ve eler.
   */
  function isWordAllowedUpTo(wordOrObj, selectedLetter) {
    if (!wordOrObj) return false;
    const normSelected = (selectedLetter || 'a').toLocaleLowerCase('tr-TR');
    const targetIdx = MAARIF_2026_CONFIG.letterOrder.indexOf(normSelected);
    if (targetIdx === -1) return false;

    // Hedef harfe kadar öğrenilmiş harfler kümesi
    const allowedSet = new Set(MAARIF_2026_CONFIG.letterOrder.slice(0, targetIdx + 1));

    // Dize (String) kontrolü
    if (typeof wordOrObj === 'string') {
      const chars = wordOrObj.toLocaleLowerCase('tr-TR').split('');
      for (const ch of chars) {
        if (/[a-zçğıöşü]/i.test(ch)) {
          const charIdx = MAARIF_2026_CONFIG.letterOrder.indexOf(ch);
          if (charIdx > targetIdx || (charIdx !== -1 && !allowedSet.has(ch))) {
            return false;
          }
        }
      }
      return true;
    }

    // Kelime nesnesi ({ word, parts, distractors }) kontrolü
    if (typeof wordOrObj === 'object') {
      if (wordOrObj.word && !isWordAllowedUpTo(wordOrObj.word, selectedLetter)) {
        return false;
      }
      if (Array.isArray(wordOrObj.parts)) {
        for (const p of wordOrObj.parts) {
          if (!isWordAllowedUpTo(p, selectedLetter)) return false;
        }
      }
      return true;
    }

    return false;
  }

  function filterAllowedWords(selectedLetter, pool) {
    const normSelected = (selectedLetter || 'a').toLocaleLowerCase('tr-TR');
    const targetIdx = MAARIF_2026_CONFIG.letterOrder.indexOf(normSelected);
    if (targetIdx === -1) return [];

    let rawPool = pool;
    if (!Array.isArray(rawPool)) {
      rawPool = [];
      if (targetIdx === 0) {
        // 1. Ses 'a': Büyük-küçük A harf ve ses birleştirme parçaları
        const data = MAARIF_2026_CONFIG.letters['a'];
        if (data && Array.isArray(data.cumulativeWords)) {
          rawPool.push(...data.cumulativeWords);
        }
      } else {
        for (let i = 1; i <= targetIdx; i++) {
          const l = MAARIF_2026_CONFIG.letterOrder[i];
          const data = MAARIF_2026_CONFIG.letters[l];
          if (data && Array.isArray(data.cumulativeWords)) {
            rawPool.push(...data.cumulativeWords);
          }
        }
      }
    }

    const learnedLettersUpper = MAARIF_2026_CONFIG.letterOrder
      .slice(0, targetIdx + 1)
      .map(l => l.toUpperCase('tr-TR'));

    const filtered = [];
    for (const item of rawPool) {
      if (!isWordAllowedUpTo(item, normSelected)) continue;

      if (typeof item === 'object' && item !== null) {
        const validDistractors = Array.isArray(item.distractors)
          ? item.distractors.filter(d => isWordAllowedUpTo(d, normSelected))
          : [];

        const safeDistractors = validDistractors.length > 0
          ? validDistractors
          : (targetIdx === 0 ? ['a'] : learnedLettersUpper.filter(l => !item.parts || !item.parts.includes(l)).slice(0, 2));

        filtered.push({
          ...item,
          distractors: safeDistractors.length ? safeDistractors : [learnedLettersUpper[0]]
        });
      } else {
        filtered.push(item);
      }
    }

    return filtered;
  }

  function filterAllowedSentences(selectedLetter, pool) {
    const normSelected = (selectedLetter || 'a').toLocaleLowerCase('tr-TR');
    const targetIdx = MAARIF_2026_CONFIG.letterOrder.indexOf(normSelected);
    if (targetIdx === -1) return [];

    let rawPool = pool;
    if (!Array.isArray(rawPool)) {
      rawPool = [];
      if (targetIdx === 0) {
        const data = MAARIF_2026_CONFIG.letters['a'];
        if (data && Array.isArray(data.cumulativeSentences)) {
          rawPool.push(...data.cumulativeSentences);
        }
      } else {
        for (let i = 0; i <= targetIdx; i++) {
          const l = MAARIF_2026_CONFIG.letterOrder[i];
          const data = MAARIF_2026_CONFIG.letters[l];
          if (data && Array.isArray(data.cumulativeSentences)) {
            rawPool.push(...data.cumulativeSentences);
          }
        }
      }
    }

    return rawPool.filter(item => {
      if (!item) return false;
      if (item.sentence && !isWordAllowedUpTo(item.sentence, normSelected)) return false;
      if (item.missing && !isWordAllowedUpTo(item.missing, normSelected)) return false;
      if (Array.isArray(item.options)) {
        for (const opt of item.options) {
          if (!isWordAllowedUpTo(opt, normSelected)) return false;
        }
      }
      return true;
    });
  }

  function getAllCumulativeWordsUpTo(letter) {
    return filterAllowedWords(letter);
  }

  function getAllCumulativeSentencesUpTo(letter) {
    return filterAllowedSentences(letter);
  }

  window.filterAllowedWords = filterAllowedWords;
  window.filterAllowedSentences = filterAllowedSentences;

  function getMaarifLetterSoundName(letter) {
    const l = (letter || '').toLowerCase('tr-TR');
    const map = {
      'a': 'a!', 'e': 'e!', 'ı': 'ı!', 'i': 'i!', 'o': 'o!', 'ö': 'ö!', 'u': 'u!', 'ü': 'ü!',
      'b': 'be!', 'c': 'ce!', 'ç': 'çe!', 'd': 'de!', 'f': 'fe!', 'g': 'ge!', 'ğ': 'yumuşak ge!',
      'h': 'he!', 'j': 'je!', 'k': 'ke!', 'l': 'le!', 'm': 'me!', 'n': 'ne!', 'p': 'pe!',
      'r': 're!', 's': 'se!', 'ş': 'şe!', 't': 'te!', 'v': 've!', 'y': 'ye!', 'z': 'ze!'
    };
    return map[l] || `${l}!`;
  }

  window.derseBiMolaSpeakText = function(text, onEnded) {
    if (window.__DERSE_BI_MOLA_AUDIO__ && typeof window.__DERSE_BI_MOLA_AUDIO__.speakTurkishText === 'function') {
      window.__DERSE_BI_MOLA_AUDIO__.speakTurkishText(text, onEnded);
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'tr-TR';
      if (onEnded) u.onend = onEnded;
      window.speechSynthesis.speak(u);
    }
  };

  /* ==========================================================================
     3. DİNAMİK SORU MOTORU (GRADE-BASED QUESTION ENGINE)
     ========================================================================== */
  const QuestionEngine = {
    // -------------------------------------------------------------
    // FİSHER-YATES SHUFFLE VE KARIŞTIRMA SİSTEMİ (ANTİ-REPEAT ENGINE)
    // -------------------------------------------------------------
    fisherYatesShuffle(array) {
      if (!array || !Array.isArray(array)) return [];
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },

    sessionQueues: {},
    recentSignatures: [],

    initSession(grade, gameType) {
      this.sessionQueues = {};
      this.recentSignatures = [];
    },

    drawFromPool(pool, poolKey = null) {
      if (!pool || !pool.length) return null;
      const key = poolKey || (pool.__poolId || (pool.__poolId = 'pool_' + Math.random().toString(36).substring(2, 9)));
      if (!this.sessionQueues[key] || this.sessionQueues[key].length === 0) {
        this.sessionQueues[key] = this.fisherYatesShuffle(pool);
      }
      return this.sessionQueues[key].pop();
    },

    // -------------------------------------------------------------
    // ANASINIFI & 1. SINIF: ÇOKTAN SEÇMELİ OLMAYAN İNTERAKTİF MOTORLAR
    // -------------------------------------------------------------


    // =========================================================================
    // YENİ MOTOR 1: SESLİ YÖNERGE VE BÜYÜK GÖRSEL BUTONLAR (DİNLE & SEÇ)
    // =========================================================================
    generateVisualChoiceQuestion(grade, category = null) {
      let pool = this.grade0VisualQuestionsPool;
      if (category) {
        const filtered = pool.filter(item => item.category.toLowerCase().includes(category.toLowerCase()));
        if (filtered.length > 0) pool = filtered;
      }
      const item = this.drawFromPool(pool, 'grade0VisualQuestionsPool') || pool[Math.floor(Math.random() * pool.length)];
      const shuffledCards = this.fisherYatesShuffle([...item.cards]);

      return {
        type: 'visual_choice',
        question: item.prompt,
        spokenText: item.spokenText || item.prompt,
        correct: item.correct,
        explanation: item.explanation,
        category: `🎨 ${item.category}`,
        visualCards: shuffledCards,
        interactiveData: {
          prompt: item.prompt,
          spokenText: item.spokenText,
          category: item.category,
          cards: shuffledCards
        }
      };
    },

    // =========================================================================
    // YENİ MOTOR 2: HAREKETLİ BALON PATLATMA MOTORU (HARF / HECE / SAYI AVI)
    // =========================================================================
    generateFloatingBalloonQuestion(grade, levelType = null) {
      const g = parseInt(grade, 10);
      let pool = this.grade1BalloonLevelsPool;
      let poolKey = 'grade1BalloonLevelsPool';

      if (g === 0) {
        pool = this.grade0BalloonLevelsPool;
        poolKey = 'grade0BalloonLevelsPool';
        if (levelType === 'colors') {
          pool = pool.filter(l => l.category === 'Renkler');
        } else if (levelType === 'numbers') {
          pool = pool.filter(l => l.category === 'Sayılar');
        } else if (levelType === 'shapes') {
          pool = pool.filter(l => l.category === 'Şekiller' || l.category === 'Hayvanlar' || l.category === 'Meyveler');
        }
        if (!pool || pool.length === 0) pool = this.grade0BalloonLevelsPool;
      } else {
        if (levelType === 'reading' || levelType === 'letters') {
          pool = pool.filter(l => l.category.includes('Harfler') || l.category.includes('Heceler'));
        } else if (levelType === 'rhythmic' || levelType === 'math') {
          pool = pool.filter(l => l.category.includes('Sayılar') || l.category.includes('Ritmik') || l.category.includes('Toplama'));
        }
        if (!pool || pool.length === 0) pool = this.grade1BalloonLevelsPool;
      }

      const level = this.drawFromPool(pool, poolKey) || pool[Math.floor(Math.random() * pool.length)];
      const colorClasses = [
        'balloon-color-red', 'balloon-color-blue', 'balloon-color-green', 
        'balloon-color-yellow', 'balloon-color-purple', 'balloon-color-pink', 'balloon-color-orange'
      ];

      const isColorLevel = level.isColorLevel || level.category === 'Renkler';
      const targetCount = level.targetsNeeded || 2;
      const balloons = [];

      if (isColorLevel && level.targetColorClass) {
        // Renk Seviyeleri: Balonların rengi kendi gövde rengidir (içinde yuvarlak emoji/yazı olmaz)
        for (let i = 0; i < targetCount; i++) {
          balloons.push({
            text: '',
            colorClass: level.targetColorClass,
            isTarget: true
          });
        }
        const distCount = 4;
        const dColors = level.distractorColorClasses || colorClasses.filter(c => c !== level.targetColorClass);
        for (let i = 0; i < distCount; i++) {
          balloons.push({
            text: '',
            colorClass: dColors[i % dColors.length],
            isTarget: false
          });
        }
      } else {
        // Sayılar, Harfler, Şekiller ve Semboller
        const targetList = level.targets || [level.target];
        const distractorList = level.distractors || ['A', 'B', 'C', 'D'];
        for (let i = 0; i < targetCount; i++) {
          const tVal = targetList[i % targetList.length];
          balloons.push({ text: tVal, isTarget: true });
        }
        const distCount = 4;
        for (let i = 0; i < distCount; i++) {
          const dVal = distractorList[i % distractorList.length];
          balloons.push({ text: dVal, isTarget: false });
        }
      }

      const shuffledBalloons = this.fisherYatesShuffle(balloons).map((b, idx) => {
        const speed = parseFloat((4.8 + Math.random() * 2.2).toFixed(2));
        const delay = parseFloat((idx * 0.35 + Math.random() * 0.25).toFixed(2));
        const left = Math.floor(6 + (idx * 14 + Math.random() * 6) % 78);
        return {
          ...b,
          colorClass: b.colorClass || colorClasses[idx % colorClasses.length],
          speed,
          delay,
          left
        };
      });

      return {
        type: 'floating_balloon',
        question: level.instruction,
        spokenText: level.spokenText,
        correct: level.target,
        explanation: level.explanation,
        category: `🎈 ${level.category}`,
        interactiveData: {
          id: level.id,
          instruction: level.instruction,
          spokenText: level.spokenText,
          target: level.target,
          targetsNeeded: targetCount,
          balloons: shuffledBalloons
        }
      };
    },

    // =========================================================================
    // YENİ MOTOR 3: EŞLEŞTİRME VE HAFIZA KARTLARI (ARDIŞIK DOKUNMA)
    // =========================================================================
    generateMemoryGridQuestion(grade, matchType = null) {
      const g = parseInt(grade, 10);
      let cat = matchType;
      if (!cat) {
        if (g === 0) {
          cat = 'kindergarten_visual';
        } else {
          const r = Math.random();
          if (r < 0.35) cat = 'letters';
          else if (r < 0.7) cat = 'antonyms';
          else cat = 'math';
        }
      }
      if (g === 0 && (!this.matchingPairsPool[cat] || cat !== 'kindergarten_visual')) {
        cat = 'kindergarten_visual';
      }

      const rawPool = this.matchingPairsPool[cat] || this.matchingPairsPool.kindergarten_visual || this.matchingPairsPool.antonyms;
      const pairsCount = (g === 0) ? 3 : (Math.random() < 0.4 ? 3 : 6);
      const gridSize = pairsCount === 3 ? 'grid-2x3' : 'grid-3x4';

      const shuffledPairs = this.fisherYatesShuffle([...rawPool]).slice(0, pairsCount);
      const cards = [];

      shuffledPairs.forEach((pair, idx) => {
        const pairKey = `pair_${cat}_${idx}`;
        cards.push({ cardId: `c_${idx}_a`, pairKey, text: pair.left });
        cards.push({ cardId: `c_${idx}_b`, pairKey, text: pair.right });
      });

      const randomizedCards = this.fisherYatesShuffle(cards);

      let themeTitle = 'Eşleşen kartları bul! Kartlara sırayla dokun.';
      let categoryName = '🧠 Hafıza & Eşleştirme';
      let spoken = 'Eşleşen kartları bul! Kartlara sırayla dokun.';
      if (cat === 'kindergarten_visual') {
        themeTitle = '👀 Eşleşen sevimli görselleri bul! Dokun ve eşleştir.';
        categoryName = '🧩 Sevimli Görsel Hafıza';
        spoken = 'Eşleşen sevimli görselleri bul! Dokun ve eşleştir.';
      } else if (cat === 'letters') {
        themeTitle = '🔤 Büyük Harf - Küçük Harf Eşleştirmesi! Eşini bul.';
        categoryName = '🔤 Harf Hafıza Kartları';
        spoken = 'Büyük harf ile küçük harfi eşleştir! Eşini bul.';
      } else if (cat === 'antonyms') {
        themeTitle = '🔄 Zıt Anlamlı Kelimeleri Eşleştir!';
        categoryName = '🔄 Zıt Anlam Hafızası';
        spoken = 'Zıt anlamlı kelimeleri eşleştir!';
      } else if (cat === 'math') {
        themeTitle = '➕ Toplama İşlemi ve Sonucunu Eşleştir!';
        categoryName = '➕ Toplama Eşleştirme Kartları';
        spoken = 'Toplama işlemi ve sonucunu eşleştir!';
      }

      return {
        type: 'memory',
        question: themeTitle,
        spokenText: spoken,
        correct: 'Tüm Kartlar',
        explanation: 'Muhteşem hafıza! Bütün eşleşen kartları eksiksiz buldun! 🧠⭐',
        category: categoryName,
        interactiveData: {
          gridSize,
          totalPairs: pairsCount,
          cards: randomizedCards
        }
      };
    },

    // -------------------------------------------------------------------------
    // ANASINIFI 55 SORULUK DEV GÖRSEL SORU HAVUZU
    // -------------------------------------------------------------------------
    grade0VisualQuestionsPool: [
      // 1) HAYVANLAR (12 Soru)
    { prompt: 'Hangi sevimli dostumuz "MİYAV" der? 🐱', spokenText: 'Hangi sevimli hayvan miyav der? Kediye dokun.', category: 'Hayvanlar', correct: 'Kedi', cards: [{ text: 'Kedi', icon: '🐱', isCorrect: true }, { text: 'Köpek', icon: '🐶', isCorrect: false }, { text: 'İnek', icon: '🐮', isCorrect: false }], exp: 'Kediler sevilmeyi çok sever ve "Miyav" derler! 🐱👏' },
    { prompt: 'Hangi sadık dostumuz "HAV HAV" der? 🐶', spokenText: 'Hangi sadık dostumuz hav hav der? Köpeğe dokun.', category: 'Hayvanlar', correct: 'Köpek', cards: [{ text: 'Köpek', icon: '🐶', isCorrect: true }, { text: 'Kedi', icon: '🐱', isCorrect: false }, { text: 'Civciv', icon: '🐥', isCorrect: false }], exp: 'Köpekler kuyruklarını sallayarak "Hav hav" derler! 🐶👏' },
    { prompt: 'Bize taze ve sağlıklı süt veren sevimli dostumuz hangisidir? 🐮', spokenText: 'Bize taze ve sağlıklı süt veren hayvan hangisidir? İneğe dokun.', category: 'Hayvanlar', correct: 'İnek', cards: [{ text: 'İnek', icon: '🐮', isCorrect: true }, { text: 'Aslan', icon: '🦁', isCorrect: false }, { text: 'Kurt', icon: '🐺', isCorrect: false }], exp: 'İnekler "Mööö" der ve bize bembeyaz süt verir! 🐮🥛' },
    { prompt: 'Ormanların güçlü ve yeleli kralı hangisidir? 🦁', spokenText: 'Ormanların güçlü ve yeleli kralı hangisidir? Aslana dokun.', category: 'Hayvanlar', correct: 'Aslan', cards: [{ text: 'Aslan', icon: '🦁', isCorrect: true }, { text: 'Maymun', icon: '🐵', isCorrect: false }, { text: 'Tavşan', icon: '🐰', isCorrect: false }], exp: 'Aslan güçlü kükremesiyle ormanların kralıdır! 🦁👑' },
    { prompt: 'Havuç yemeyi çok seven, uzun kulaklı zıp zıp dostumuz hangisidir? 🐰', spokenText: 'Havuç yemeyi seven uzun kulaklı hayvan hangisidir? Tavşana dokun.', category: 'Hayvanlar', correct: 'Tavşan', cards: [{ text: 'Tavşan', icon: '🐰', isCorrect: true }, { text: 'Ayı', icon: '🐻', isCorrect: false }, { text: 'Kurbağa', icon: '🐸', isCorrect: false }], exp: 'Tavşanlar zıp zıp zıplar ve çıtır havuç yer! 🐰🥕' },
    { prompt: 'Mavi denizlerde yüzgeçleriyle yüzen sevimli canlı hangisidir? 🐟', spokenText: 'Mavi denizlerde yüzen canlı hangisidir? Balığa dokun.', category: 'Hayvanlar', correct: 'Balık', cards: [{ text: 'Balık', icon: '🐟', isCorrect: true }, { text: 'Kuş', icon: '🐦', isCorrect: false }, { text: 'Kedi', icon: '🐱', isCorrect: false }], exp: 'Balıklar denizde yüzer ve solungaçlarıyla nefes alır! 🐟🌊' },
    { prompt: 'Gökyüzünde kanat çırparak uçan ve "Cik cik" öten hangisidir? 🐦', spokenText: 'Gökyüzünde uçan ve cik cik öten hangisidir? Kuşa dokun.', category: 'Hayvanlar', correct: 'Kuş', cards: [{ text: 'Kuş', icon: '🐦', isCorrect: true }, { text: 'Kaplumbağa', icon: '🐢', isCorrect: false }, { text: 'Köpek', icon: '🐶', isCorrect: false }], exp: 'Kuşlar kanatlarını açıp gökyüzünde süzülür! 🐦🌿' },
    { prompt: 'Kocaman kulakları ve uzun bir hortumu olan dev hayvan hangisidir? 🐘', spokenText: 'Kocaman kulakları ve uzun bir hortumu olan hayvan hangisidir? File dokun.', category: 'Hayvanlar', correct: 'Fil', cards: [{ text: 'Fil', icon: '🐘', isCorrect: true }, { text: 'Fare', icon: '🐭', isCorrect: false }, { text: 'Tavşan', icon: '🐰', isCorrect: false }], exp: 'Fil dünyanın en büyük ve en güçlü kara hayvanıdır! 🐘💧' },
    { prompt: 'Çiçeklerden nektar toplayıp tatlı bal yapan çalışkan dostumuz hangisidir? 🐝', spokenText: 'Çiçeklerden bal toplayan çalışkan dostumuz hangisidir? Arıya dokun.', category: 'Hayvanlar', correct: 'Arı', cards: [{ text: 'Arı', icon: '🐝', isCorrect: true }, { text: 'Kelebek', icon: '🦋', isCorrect: false }, { text: 'Karınca', icon: '🐜', isCorrect: false }], exp: 'Arılar vız vız uçar ve şifalı bal yapar! 🐝🍯' },
    { prompt: 'Nilüfer yapraklarında "VAK VAK" diyerek zıplayan yeşil dostumuz hangisidir? 🐸', spokenText: 'Vak vak diyerek zıplayan yeşil dostumuz hangisidir? Kurbağaya dokun.', category: 'Hayvanlar', correct: 'Kurbağa', cards: [{ text: 'Kurbağa', icon: '🐸', isCorrect: true }, { text: 'Tilki', icon: '🦊', isCorrect: false }, { text: 'At', icon: '🐴', isCorrect: false }], exp: 'Kurbağalar göletlerde neşeyle zıplar! 🐸💧' },
    { prompt: 'Sırtında sert kabuğuyla yavaş yavaş yürüyen sevimli dostumuz hangisidir? 🐢', spokenText: 'Sırtında sert kabuğu olan sevimli dostumuz hangisidir? Kaplumbağaya dokun.', category: 'Hayvanlar', correct: 'Kaplumbağa', cards: [{ text: 'Kaplumbağa', icon: '🐢', isCorrect: true }, { text: 'Zıp Tavşan', icon: '🐰', isCorrect: false }, { text: 'Hızlı At', icon: '🐴', isCorrect: false }], exp: 'Kaplumbağa evi olan kabuğunu sırtında taşır! 🐢💚' },
    { prompt: 'Ağaçlarda daldan dala atlayan ve muz seven sevimli hayvan hangisidir? 🐵', spokenText: 'Daldan dala atlayan ve muz seven sevimli hayvan hangisidir? Maymuna dokun.', category: 'Hayvanlar', correct: 'Maymun', cards: [{ text: 'Maymun', icon: '🐵', isCorrect: true }, { text: 'Kurt', icon: '🐺', isCorrect: false }, { text: 'Ayı', icon: '🐻', isCorrect: false }], exp: 'Maymunlar neşeyle zıplar ve muz yemeye bayılır! 🐵🍌' },

    // 2) MEYVELER & SEBZELER (11 Soru)
    { prompt: 'Hangisi kırmızı ve küçük benekli, çok tatlı bir yaz meyvesidir? 🍓', spokenText: 'Hangisi kırmızı ve küçük benekli tatlı bir meyvedir? Çileğe dokun.', category: 'Meyveler', correct: 'Çilek', cards: [{ text: 'Çilek', icon: '🍓', isCorrect: true }, { text: 'Havuç', icon: '🥕', isCorrect: false }, { text: 'Muz', icon: '🍌', isCorrect: false }], exp: 'Çilek kokulu, kırmızı çok tatlı bir meyvedir! 🍓😋' },
    { prompt: 'Maymunların yemeye bayıldığı sarı ve tatlı meyve hangisidir? 🍌', spokenText: 'Maymunların yemeye bayıldığı sarı ve tatlı meyve hangisidir? Muza dokun.', category: 'Meyveler', correct: 'Muz', cards: [{ text: 'Muz', icon: '🍌', isCorrect: true }, { text: 'Domates', icon: '🍅', isCorrect: false }, { text: 'Havuç', icon: '🥕', isCorrect: false }], exp: 'Muz enerji dolu, tatlı ve sapsarı bir meyvedir! 🍌☀️' },
    { prompt: 'Hangisi kış aylarında bol C vitamini veren sulu portakaldır? 🍊', spokenText: 'Hangisi kış aylarında bol C vitamini veren meyvedir? Portakala dokun.', category: 'Meyveler', correct: 'Portakal', cards: [{ text: 'Portakal', icon: '🍊', isCorrect: true }, { text: 'Mor Üzüm', icon: '🍇', isCorrect: false }, { text: 'Kiraz', icon: '🍒', isCorrect: false }], exp: 'Portakal bizi hastalıklardan koruyan sulu bir kış meyvesidir! 🍊💪' },
    { prompt: 'Kırmızı veya yeşil renkli, çıtır çıtır ısırılan meyve hangisidir? 🍎', spokenText: 'Kırmızı veya yeşil renkli, çıtır ısırılan meyve hangisidir? Elmaya dokun.', category: 'Meyveler', correct: 'Elma', cards: [{ text: 'Elma', icon: '🍎', isCorrect: true }, { text: 'Havuç', icon: '🥕', isCorrect: false }, { text: 'Muz', icon: '🍌', isCorrect: false }], exp: 'Günde bir elma yemek sağlığımıza çok iyi gelir! 🍎✨' },
    { prompt: 'Tüylü kabuğu ve tatlı aromasıyla yazın sevilen pembe şeftali hangisidir? 🍑', spokenText: 'Tatlı şeftali hangisidir? Şeftaliye dokun.', category: 'Meyveler', correct: 'Şeftali', cards: [{ text: 'Şeftali', icon: '🍑', isCorrect: true }, { text: 'Avokado', icon: '🥑', isCorrect: false }, { text: 'Elma', icon: '🍎', isCorrect: false }], exp: 'Şeftali sulu ve nefis kokulu bir yaz meyvesidir! 🍑😋' },
    { prompt: 'Kahvaltıda ve salatalarda yediğimiz sulu kırmızı domates hangisidir? 🍅', spokenText: 'Sulu kırmızı domates hangisidir? Domatese dokun.', category: 'Meyveler', correct: 'Domates', cards: [{ text: 'Domates', icon: '🍅', isCorrect: true }, { text: 'Muz', icon: '🍌', isCorrect: false }, { text: 'Çilek', icon: '🍓', isCorrect: false }], exp: 'Domates salataların ve kahvaltıların vazgeçilmezidir! 🍅❤️' },
    { prompt: 'Salkım salkım yetişen mor renkli tatlı meyve hangisidir? 🍇', spokenText: 'Salkım salkım yetişen tatlı meyve hangisidir? Üzüme dokun.', category: 'Meyveler', correct: 'Üzüm', cards: [{ text: 'Üzüm', icon: '🍇', isCorrect: true }, { text: 'Havuç', icon: '🥕', isCorrect: false }, { text: 'Elma', icon: '🍎', isCorrect: false }], exp: 'Üzüm taneleri çok tatlı ve lezzetlidir! 🍇🍇' },
    { prompt: 'Tavşanların çıtır çıtır yemeyi çok sevdiği turuncu sebze hangisidir? 🥕', spokenText: 'Tavşanların yemeyi çok sevdiği turuncu sebze hangisidir? Havuca dokun.', category: 'Meyveler', correct: 'Havuç', cards: [{ text: 'Havuç', icon: '🥕', isCorrect: true }, { text: 'Çilek', icon: '🍓', isCorrect: false }, { text: 'Muz', icon: '🍌', isCorrect: false }], exp: 'Havuç gözlerimize çok iyi gelen turuncu bir sebzedir! 🥕👁️' },
    { prompt: 'İkiz sapları olan minik kırmızı tatlı meyve hangisidir? 🍒', spokenText: 'İkiz sapları olan kırmızı meyve hangisidir? Kiraza dokun.', category: 'Meyveler', correct: 'Kiraz', cards: [{ text: 'Kiraz', icon: '🍒', isCorrect: true }, { text: 'Avokado', icon: '🥑', isCorrect: false }, { text: 'Portakal', icon: '🍊', isCorrect: false }], exp: 'Kirazları kulağımıza küpe gibi takmayı da severiz! 🍒🌸' },
    { prompt: 'Koyu yeşil kabuklu ve içi yumuşacık faydalı meyve hangisidir? 🥑', spokenText: 'İçi yumuşacık yeşil avokadoya dokun.', category: 'Meyveler', correct: 'Avokado', cards: [{ text: 'Avokado', icon: '🥑', isCorrect: true }, { text: 'Domates', icon: '🍅', isCorrect: false }, { text: 'Portakal', icon: '🍊', isCorrect: false }], exp: 'Avokado çok faydalı ve besleyici bir meyvedir! 🥑💪' },
    { prompt: 'Fırında sıcacık pişen, peynirli yuvarlak lezzetli yiyecek hangisidir? 🍕', spokenText: 'Fırında pişen nefis pizzaya dokun.', category: 'Meyveler', correct: 'Pizza', cards: [{ text: 'Nefis Pizza', icon: '🍕', isCorrect: true }, { text: 'Çilek', icon: '🍓', isCorrect: false }, { text: 'Elma', icon: '🍎', isCorrect: false }], exp: 'Pizza çıtır kenarları ve peyniriyle çok sevilir! 🍕😋' },

    // 3) TAŞITLAR (8 Soru)
    { prompt: 'Gökyüzünde bulutların üstünde kanatlarıyla uçan taşıt hangisidir? ✈️', spokenText: 'Gökyüzünde bulutların üstünde uçan taşıt hangisidir? Uçağa dokun.', category: 'Taşıtlar', correct: 'Uçak', cards: [{ text: 'Uçak', icon: '✈️', isCorrect: true }, { text: 'Araba', icon: '🚗', isCorrect: false }, { text: 'Yelkenli', icon: '⛵', isCorrect: false }], exp: 'Uçaklar bizi uzak şehirlere hızla götürür! ✈️☁️' },
    { prompt: 'Mavi sularda beyaz yelkenleriyle süzülen deniz taşıtı hangisidir? ⛵', spokenText: 'Mavi sularda süzülen yelkenliye dokun.', category: 'Taşıtlar', correct: 'Yelkenli', cards: [{ text: 'Yelkenli', icon: '⛵', isCorrect: true }, { text: 'Araba', icon: '🚗', isCorrect: false }, { text: 'Bisiklet', icon: '🚲', isCorrect: false }], exp: 'Yelkenli rüzgarın gücüyle sularda kayar! ⛵🌊' },
    { prompt: 'Denizde dalgaları yararak hızla ilerleyen motorlu tekne hangisidir? 🚤', spokenText: 'Hızla giden sürat motoruna dokun.', category: 'Taşıtlar', correct: 'Sürat Motoru', cards: [{ text: 'Sürat Motoru', icon: '🚤', isCorrect: true }, { text: 'Bisiklet', icon: '🚲', isCorrect: false }, { text: 'Araba', icon: '🚗', isCorrect: false }], exp: 'Sürat motoru köpükler saçarak hızla yol alır! 🚤💨' },
    { prompt: 'İki tekerleği olan ve pedallarını çevirerek sürdüğümüz taşıt hangisidir? 🚲', spokenText: 'Pedallarını çevirerek sürdüğümüz bisiklete dokun.', category: 'Taşıtlar', correct: 'Bisiklet', cards: [{ text: 'Bisiklet', icon: '🚲', isCorrect: true }, { text: 'Araba', icon: '🚗', isCorrect: false }, { text: 'Uçak', icon: '✈️', isCorrect: false }], exp: 'Bisiklet sürmek hem çok eğlenceli hem de sağlıklıdır! 🚲🚴' },
    { prompt: 'Uzaya, Ay\'a ve parlayan yıldızlara gitmek için ateşlenen dev araç hangisidir? 🚀', spokenText: 'Uzaya ve Ay\'a gitmek için ateşlenen rokete dokun.', category: 'Taşıtlar', correct: 'Roket', cards: [{ text: 'Roket', icon: '🚀', isCorrect: true }, { text: 'Uçak', icon: '✈️', isCorrect: false }, { text: 'Yelkenli', icon: '⛵', isCorrect: false }], exp: 'Roketler Dünya\'nın yerçekimini yenip uzaya uçar! 🚀⭐' },
    { prompt: 'Düt düt diye korna çalan dört tekerlekli aile taşıtı hangisidir? 🚗', spokenText: 'Düt düt diye korna çalan arabaya dokun.', category: 'Taşıtlar', correct: 'Araba', cards: [{ text: 'Araba', icon: '🚗', isCorrect: true }, { text: 'Bisiklet', icon: '🚲', isCorrect: false }, { text: 'Yelkenli', icon: '⛵', isCorrect: false }], exp: 'Arabaya bindiğimizde daima emniyet kemerimizi takarız! 🚗🛡️' },
    { prompt: 'Gökyüzüne doğru fırlayan ve şimşek gibi hızlanan hangisidir? 🚀', spokenText: 'En hızlı giden rokete dokun.', category: 'Taşıtlar', correct: 'Roket', cards: [{ text: 'Hızlı Roket', icon: '🚀', isCorrect: true }, { text: 'Bisiklet', icon: '🚲', isCorrect: false }, { text: 'Yelkenli', icon: '⛵', isCorrect: false }], exp: 'Roket gökyüzüne alevler saçarak yükselir! 🚀✨' },
    { prompt: 'Sahilde kaskımızı takıp pedallarını çevirdiğimiz taşıt hangisidir? 🚲', spokenText: 'İki tekerlekli bisiklete dokun.', category: 'Taşıtlar', correct: 'Bisiklet', cards: [{ text: 'Bisiklet', icon: '🚲', isCorrect: true }, { text: 'Uçak', icon: '✈️', isCorrect: false }, { text: 'Sürat Motoru', icon: '🚤', isCorrect: false }], exp: 'Bisiklet binerken her zaman kask ve dizlik takarız! 🚲🛡️' },

    // 4) OKUL, OYUN VE SANAT (8 Soru)
    { prompt: 'Ressamların harika resimler yapmak için boyalarını koyduğu RENKLİ PALET hangisidir? 🎨', spokenText: 'Ressamın boya paletine dokun.', category: 'Okul & Sanat', correct: 'Boya Paleti', cards: [{ text: 'Boya Paleti', icon: '🎨', isCorrect: true }, { text: 'Gitar', icon: '🎸', isCorrect: false }, { text: 'Kitap', icon: '📚', isCorrect: false }], exp: 'Ressamlar paletlerindeki rengarenk boyalarla dünyayı güzelleştirir! 🎨✨' },
    { prompt: 'Okulda öğretmenimizle birlikte okuduğumuz bilgi dolu KİTAPLAR hangisidir? 📚', spokenText: 'Bilgi dolu kitaplara dokun.', category: 'Okul & Sanat', correct: 'Kitaplar', cards: [{ text: 'Kitaplar', icon: '📚', isCorrect: true }, { text: 'Boya Paleti', icon: '🎨', isCorrect: false }, { text: 'Futbol Topu', icon: '⚽', isCorrect: false }], exp: 'Kitaplar bize yepyeni masallar ve bilgiler öğretir! 📚🌟' },
    { prompt: 'Müzisyenlerin neşeli şarkılar çaldığı TELLİ GİTAR hangisidir? 🎸', spokenText: 'Neşeli şarkılar çalan gitara dokun.', category: 'Okul & Sanat', correct: 'Gitar', cards: [{ text: 'Gitar', icon: '🎸', isCorrect: true }, { text: 'Futbol Topu', icon: '⚽', isCorrect: false }, { text: 'Kitap', icon: '📚', isCorrect: false }], exp: 'Gitarın telleri titreşerek kulağımıza tatlı melodiler fısıldar! 🎸🎶' },
    { prompt: 'Futbolcuların yeşil sahada kaleye şut çektiği TOP hangisidir? ⚽', spokenText: 'Yeşil sahadaki futbol topuna dokun.', category: 'Okul & Sanat', correct: 'Futbol Topu', cards: [{ text: 'Futbol Topu', icon: '⚽', isCorrect: true }, { text: 'Gitar', icon: '🎸', isCorrect: false }, { text: 'Boya Paleti', icon: '🎨', isCorrect: false }], exp: 'Topla oynamak spor yapmamızı ve güçlenmemizi sağlar! ⚽🏃' },
    { prompt: 'Arkadaşımıza doğum gününde sevgiyle verdiğimiz sürpriz HEDİYE PAKETİ hangisidir? 🎁', spokenText: 'Sürpriz hediye paketine dokun.', category: 'Okul & Sanat', correct: 'Hediye Paketi', cards: [{ text: 'Hediye Paketi', icon: '🎁', isCorrect: true }, { text: 'Uçan Balon', icon: '🎈', isCorrect: false }, { text: 'Ayıcık', icon: '🧸', isCorrect: false }], exp: 'Hediyeleşmek sevgimizi ve dostluğumuzu büyütür! 🎁💖' },
    { prompt: 'Gökyüzüne doğru neşeyle yükselen renkli UÇAN BALON hangisidir? 🎈', spokenText: 'Renkli uçan balona dokun.', category: 'Okul & Sanat', correct: 'Uçan Balon', cards: [{ text: 'Uçan Balon', icon: '🎈', isCorrect: true }, { text: 'Hediye', icon: '🎁', isCorrect: false }, { text: 'Futbol Topu', icon: '⚽', isCorrect: false }], exp: 'Balonlar hafif oldukları için gökyüzüne süzülür! 🎈☁️' },
    { prompt: 'Yumuşacık sarılıp uyuduğumuz sevimli OYUNCAK AYI hangisidir? 🧸', spokenText: 'Sevimli oyuncak ayıya dokun.', category: 'Okul & Sanat', correct: 'Oyuncak Ayı', cards: [{ text: 'Oyuncak Ayı', icon: '🧸', isCorrect: true }, { text: 'Futbol Topu', icon: '⚽', isCorrect: false }, { text: 'Gitar', icon: '🎸', isCorrect: false }], exp: 'Oyuncak ayıcık yumuşacık tüyleriyle en tatlı dostumuzdur! 🧸💤' },
    { prompt: 'Şampiyon olduğumuzda gururla kaldırdığımız ALTIN KUPA hangisidir? 🏆', spokenText: 'Altın şampiyonluk kupasına dokun.', category: 'Okul & Sanat', correct: 'Altın Kupa', cards: [{ text: 'Altın Kupa', icon: '🏆', isCorrect: true }, { text: 'Altın Madalya', icon: '🥇', isCorrect: false }, { text: 'Hediye', icon: '🎁', isCorrect: false }], exp: 'Kupa çalışıp başardığımızda kazandığımız ödülü simgeler! 🏆⭐' },

    // 5) RENKLER & ŞEKİLLER (10 Soru)
    { prompt: 'Hangisi gökyüzünün ve denizlerin rengi olan MAVİDİR? 🔵', spokenText: 'Hangisi mavi renktir? Mavi daireye dokun.', category: 'Renkler & Şekiller', correct: 'Mavi Daire', cards: [{ text: 'Mavi Daire', icon: '🔵', isCorrect: true }, { text: 'Kırmızı Daire', icon: '🔴', isCorrect: false }, { text: 'Sarı Daire', icon: '🟡', isCorrect: false }], exp: 'Mavi ferahlatıcı gökyüzünün ve denizin rengidir! 🔵🌊' },
    { prompt: 'Hangisi taze çimenlerin ve yaprakların rengi olan YEŞİLDİR? 🟢', spokenText: 'Hangisi yeşil renktir? Yeşil daireye dokun.', category: 'Renkler & Şekiller', correct: 'Yeşil Daire', cards: [{ text: 'Yeşil Daire', icon: '🟢', isCorrect: true }, { text: 'Mor Daire', icon: '🟣', isCorrect: false }, { text: 'Turuncu Daire', icon: '🟠', isCorrect: false }], exp: 'Yeşil doğanın ve ağaçların rengidir! 🟢🌿' },
    { prompt: 'Hangisi sıcacık Güneş\'in ve olgun muzun rengi olan SARIDIR? 🟡', spokenText: 'Hangisi sarı renktir? Sarı daireye dokun.', category: 'Renkler & Şekiller', correct: 'Sarı Daire', cards: [{ text: 'Sarı Daire', icon: '🟡', isCorrect: true }, { text: 'Mavi Daire', icon: '🔵', isCorrect: false }, { text: 'Kırmızı Daire', icon: '🔴', isCorrect: false }], exp: 'Sarı içimizi ısıtan Güneş\'in rengidir! 🟡☀️' },
    { prompt: 'Hangisi parlak çileğin ve kalbin rengi olan KIRMIZIDIR? 🔴', spokenText: 'Hangisi kırmızı renktir? Kırmızı daireye dokun.', category: 'Renkler & Şekiller', correct: 'Kırmızı Daire', cards: [{ text: 'Kırmızı Daire', icon: '🔴', isCorrect: true }, { text: 'Yeşil Daire', icon: '🟢', isCorrect: false }, { text: 'Mor Daire', icon: '🟣', isCorrect: false }], exp: 'Kırmızı canlı ve neşeli bir renktir! 🔴🍓' },
    { prompt: 'Hangisi geceleri gökyüzünde ışıl ışıl parlayan YILDIZ şeklidir? ⭐', spokenText: 'Hangisi parlayan yıldız şeklidir? Yıldıza dokun.', category: 'Renkler & Şekiller', correct: 'Sarı Yıldız', cards: [{ text: 'Sarı Yıldız', icon: '⭐', isCorrect: true }, { text: 'Kırmızı Üçgen', icon: '🔺', isCorrect: false }, { text: 'Yeşil Kare', icon: '🟩', isCorrect: false }], exp: 'Yıldız gökyüzünde ışıl ışıl göz kırpar! ⭐✨' },
    { prompt: 'Hangisi sevgimizi anlatan pembe KALP şeklidir? 💖', spokenText: 'Hangisi pembe kalp şeklidir? Kalbe dokun.', category: 'Renkler & Şekiller', correct: 'Pembe Kalp', cards: [{ text: 'Pembe Kalp', icon: '💖', isCorrect: true }, { text: 'Yeşil Daire', icon: '🟢', isCorrect: false }, { text: 'Kırmızı Üçgen', icon: '🔺', isCorrect: false }], exp: 'Kalp sevgi ve dostluğun en güzel sembolüdür! 💖' },
    { prompt: 'Hangisi tıpkı bir futbol topu gibi yuvarlak DAİREDİR? 🔴', spokenText: 'Hangisi yuvarlak dairedir? Daireye dokun.', category: 'Renkler & Şekiller', correct: 'Daire', cards: [{ text: 'Kırmızı Daire', icon: '🔴', isCorrect: true }, { text: 'Yeşil Kare', icon: '🟩', isCorrect: false }, { text: 'Kırmızı Üçgen', icon: '🔺', isCorrect: false }], exp: 'Dairenin köşesi yoktur, top gibi yuvarlaktır! 🔴⚽' },
    { prompt: 'Hangisi tam 3 köşesi ve 3 kenarı olan ÜÇGENDİR? 🔺', spokenText: 'Hangisi üç köşeli üçgendir? Üçgene dokun.', category: 'Renkler & Şekiller', correct: 'Üçgen', cards: [{ text: 'Kırmızı Üçgen', icon: '🔺', isCorrect: true }, { text: 'Beyaz Daire', icon: '⚪', isCorrect: false }, { text: 'Yeşil Kare', icon: '🟩', isCorrect: false }], exp: 'Üçgenin tam 3 sivri köşesi vardır! 🔺📐' },
    { prompt: 'Hangisi 4 kenarı da birbirine eşit olan KAREDİR? 🟩', spokenText: 'Hangisi dört kenarı eşit karedir? Kareye dokun.', category: 'Renkler & Şekiller', correct: 'Kare', cards: [{ text: 'Yeşil Kare', icon: '🟩', isCorrect: true }, { text: 'Kırmızı Daire', icon: '🔴', isCorrect: false }, { text: 'Kırmızı Üçgen', icon: '🔺', isCorrect: false }], exp: 'Kare kutu gibi dengeli ve dört köşelidir! 🟩📦' },
    { prompt: 'Hangisi lezzetli bir portakalın rengi olan TURUNCUDUR? 🟠', spokenText: 'Hangisi turuncu renktir? Turuncu daireye dokun.', category: 'Renkler & Şekiller', correct: 'Turuncu Daire', cards: [{ text: 'Turuncu Daire', icon: '🟠', isCorrect: true }, { text: 'Mor Daire', icon: '🟣', isCorrect: false }, { text: 'Yeşil Daire', icon: '🟢', isCorrect: false }], exp: 'Turuncu portakal ve havuç rengidir! 🟠🍊' },

    // 6) DUYGULARIM VE KALBİM (6 Soru)
    { prompt: 'Parkta neşeyle oynarken yüzümüzü güldüren MUTLU yüz hangisidir? 😀', spokenText: 'Neşeyle gülen mutlu yüze dokun.', category: 'Duygular', correct: 'Mutlu Yüz', cards: [{ text: 'Mutlu Yüz', icon: '😀', isCorrect: true }, { text: 'Şaşkın Yüz', icon: '😅', isCorrect: false }, { text: 'Gülen Yüz', icon: '😂', isCorrect: false }], exp: 'Mutlu olunca yüzümüzde kocaman sıcacık bir tebessüm açar! 😀✨' },
    { prompt: 'Çok komik bir şaka duyunca neşeyle KAHKAHA ATAN yüz hangisidir? 😂', spokenText: 'Kahkaha atan neşeli yüze dokun.', category: 'Duygular', correct: 'Neşeli Yüz', cards: [{ text: 'Neşeli Yüz', icon: '😂', isCorrect: true }, { text: 'Gülümseyen', icon: '😀', isCorrect: false }, { text: 'Heyecanlı', icon: '😅', isCorrect: false }], exp: 'Kahkaha atmak içimizi neşeyle ve enerjiyle doldurur! 😂🎉' },
    { prompt: 'Sürpriz hediye karşısında tatlı bir heyecan duyan yüz hangisidir? 😅', spokenText: 'Heyecanlı yüze dokun.', category: 'Duygular', correct: 'Heyecanlı Yüz', cards: [{ text: 'Heyecanlı Yüz', icon: '😅', isCorrect: true }, { text: 'Mutlu Yüz', icon: '😀', isCorrect: false }, { text: 'Neşeli Yüz', icon: '😂', isCorrect: false }], exp: 'Sürprizler karşısında tatlı bir heyecan yaşarız! 😅🎁' },
    { prompt: 'Bize yardım eden arkadaşımıza sevgimizi gösteren sıcacık KALP hangisidir? 💖', spokenText: 'Sevgimizi gösteren kalbe dokun.', category: 'Duygular', correct: 'Sevgi Kalbi', cards: [{ text: 'Sevgi Kalbi', icon: '💖', isCorrect: true }, { text: 'Parlak Yıldız', icon: '⭐', isCorrect: false }, { text: 'Mavi Daire', icon: '🔵', isCorrect: false }], exp: 'Sevgimizi ve teşekkürümüzü sıcacık bir kalple gösteririz! 💖🥰' },
    { prompt: 'Geceleri tatlı rüyalar görmek için gökyüzünde parlayan HİLAL AY hangisidir? 🌙', spokenText: 'Tatlı rüyalar için parlayan hilale dokun.', category: 'Duygular', correct: 'Hilal Ay', cards: [{ text: 'Hilal Ay', icon: '🌙', isCorrect: true }, { text: 'Güneş', icon: '☀️', isCorrect: false }, { text: 'Yıldız', icon: '⭐', isCorrect: false }], exp: 'Hilal ay geceleri bize tatlı rüyalar diler! 🌙💤' },
    { prompt: 'Doğum günümüzde arkadaşlarımızla kutlama yaptığımız PARTİ ŞAPKASI hangisidir? 🎉', spokenText: 'Kutlama yapan parti şapkasına dokun.', category: 'Duygular', correct: 'Parti Süsü', cards: [{ text: 'Parti Süsü', icon: '🎉', isCorrect: true }, { text: 'Hediye', icon: '🎁', isCorrect: false }, { text: 'Balon', icon: '🎈', isCorrect: false }], exp: 'Parti ve kutlamalar sevdiklerimizle neşeyi paylaşmaktır! 🎉🎂' },

    // 7) BOYUTLAR & MONTESSORİ KARŞILAŞTIRMALARI (10 Soru - Tamamen 3D Grafikler)
    { prompt: 'Hangisi ÇOK DAHA BÜYÜKTÜR ve kocaman kulakları vardır? 🐘', spokenText: 'Hangisi daha büyüktür? Koca file dokun.', category: 'Boyutlar', correct: 'Koca Fil', cards: [{ text: 'Koca Fil', icon: '🐘', isCorrect: true }, { text: 'Minik Fare', icon: '🐭', isCorrect: false }, { text: 'Küçük Karınca', icon: '🐜', isCorrect: false }], exp: 'Fil dünyanın en büyük ve en güçlü kara hayvanıdır! 🐘' },
    { prompt: 'Hangisi ÇOK DAHA KÜÇÜKTÜR ve parmağımızdan bile ufaktır? 🐜', spokenText: 'Hangisi daha küçüktür? Minik karıncaya dokun.', category: 'Boyutlar', correct: 'Minik Karınca', cards: [{ text: 'Minik Karınca', icon: '🐜', isCorrect: true }, { text: 'Kocaman Ayı', icon: '🐻', isCorrect: false }, { text: 'Büyük İnek', icon: '🐮', isCorrect: false }], exp: 'Karınca miniciktir ama çok çalışkandır! 🐜🔍' },
    { prompt: 'Hangisi ÇOK DAHA UZUNDUR ve yüksek dallara yetişir? 🦒', spokenText: 'Hangisi daha uzundur? Zürafaya dokun.', category: 'Boyutlar', correct: 'Uzun Zürafa', cards: [{ text: 'Uzun Zürafa', icon: '🦒', isCorrect: true }, { text: 'Minik Kaplumbağa', icon: '🐢', isCorrect: false }, { text: 'Küçük Tavşan', icon: '🐰', isCorrect: false }], exp: 'Zürafanın upuzun boynu en yüksek dallara bile uzanır! 🦒🌳' },
    { prompt: 'Hangisi ÇOK DAHA AĞIRDIR? 🐘', spokenText: 'Hangisi çok daha ağırdır? Koca file dokun.', category: 'Boyutlar', correct: 'Koca Fil (Ağır)', cards: [{ text: 'Koca Fil (Ağır)', icon: '🐘', isCorrect: true }, { text: 'Uçan Balon (Hafif)', icon: '🎈', isCorrect: false }, { text: 'Minik Kuş (Hafif)', icon: '🐦', isCorrect: false }], exp: 'Koca fil tonlarca ağırlıktadır, rengarenk balon ise havada süzülür! 🐘🎈' },
    { prompt: 'Hangisi rüzgardan bile ÇOK DAHA HIZLIDIR? 🚀', spokenText: 'Hangisi daha hızlıdır? Hızlı rokete dokun.', category: 'Boyutlar', correct: 'Hızlı Roket', cards: [{ text: 'Hızlı Roket', icon: '🚀', isCorrect: true }, { text: 'Yavaş Kaplumbağa', icon: '🐢', isCorrect: false }, { text: 'Minik Karınca', icon: '🐜', isCorrect: false }], exp: 'Roket gökyüzüne şimşek gibi fırlar! 🚀🐢' },
    { prompt: 'Gündüzleri dünyamızı ısıtan SICACIK dostumuz hangisidir? ☀️', spokenText: 'Hangisi sıcaktır? Parlak güneşe dokun.', category: 'Boyutlar', correct: 'Sıcak Güneş', cards: [{ text: 'Sıcak Güneş', icon: '☀️', isCorrect: true }, { text: 'Gece Ayı', icon: '🌙', isCorrect: false }, { text: 'Yağmur Bulutu', icon: '🌧️', isCorrect: false }], exp: 'Güneş her sabah doğar ve sıcacık ışıklarıyla dünyamızı ısıtır! ☀️' },
    { prompt: 'Hangisi BUZ GİBİ SOĞUK ve tatlı bir yaz lezzetidir? 🍦', spokenText: 'Hangisi soğuktur? Dondurmaya dokun.', category: 'Boyutlar', correct: 'Soğuk Dondurma', cards: [{ text: 'Soğuk Dondurma', icon: '🍦', isCorrect: true }, { text: 'Sıcak Pizza', icon: '🍕', isCorrect: false }, { text: 'Kurabiye', icon: '🍪', isCorrect: false }], exp: 'Dondurma buz gibi soğuktur, yazın bizi serinletir! 🍦❄️' },
    { prompt: 'Hangisi tatlı sürprizlerle DOLU bir hediye paketidir? 🎁', spokenText: 'İçi dolu hediye paketine dokun.', category: 'Boyutlar', correct: 'Dolu Hediye', cards: [{ text: 'Dolu Hediye', icon: '🎁', isCorrect: true }, { text: 'Mavi Daire', icon: '🔵', isCorrect: false }, { text: 'Kırmızı Daire', icon: '🔴', isCorrect: false }], exp: 'Hediye paketi içi sevgi dolu sürprizlerle doludur! 🎁' },
    { prompt: 'Bulutların üstünde EN YÜKSEKTE hangisi uçar? ✈️', spokenText: 'En yüksekte hangisi uçar? Uçağa dokun.', category: 'Boyutlar', correct: 'Yüksek Uçak', cards: [{ text: 'Yüksek Uçak', icon: '✈️', isCorrect: true }, { text: 'Yerdeki Karınca', icon: '🐜', isCorrect: false }, { text: 'Yavaş Kaplumbağa', icon: '🐢', isCorrect: false }], exp: 'Uçaklar masmavi gökyüzünde bulutların üstünde uçar! ✈️☁️' },
    { prompt: 'Kuşlara ve sevimli sincaplara yuva olan yeşil DOĞA DOSTUMUZ hangisidir? 🌱', spokenText: 'Doğa dostumuz minik fidana dokun.', category: 'Boyutlar', correct: 'Minik Fidan', cards: [{ text: 'Minik Fidan', icon: '🌱', isCorrect: true }, { text: 'Kırmızı Çiçek', icon: '🌺', isCorrect: false }, { text: 'Sarı Ayçiçeği', icon: '🌻', isCorrect: false }], exp: 'Fidanlar büyüyüp kocaman gölgeli ağaçlar olur! 🌱🌳' },

    // 8) SAYMA VE MİKTAR (Meyve & Yıldız Sayma / Çoktan Aza)
    { prompt: 'Hangisinde TAM 1 TANE kırmızı elma var? 🍎', spokenText: 'Hangisinde sadece bir tane elma var? Tek elmaya dokun.', category: 'Sayma', correct: '1 Elma', cards: [{ text: '1 Elma (Bir)', icon: '🍎', isCorrect: true }, { text: '3 Elma', icon: '🍎🍎🍎', isCorrect: false }, { text: '5 Elma', icon: '🍎🍎🍎🍎🍎', isCorrect: false }], exp: 'Harika sayma! Burada tam 1 tane tatlı elma var! 🍎1️⃣' },
    { prompt: 'Hangisinde TAM 2 TANE parıldayan yıldız var? ⭐⭐', spokenText: 'Hangisinde iki tane yıldız var? İki yıldıza dokun.', category: 'Sayma', correct: '2 Yıldız', cards: [{ text: '2 Yıldız (İki)', icon: '⭐⭐', isCorrect: true }, { text: '1 Yıldız', icon: '⭐', isCorrect: false }, { text: '4 Yıldız', icon: '⭐⭐⭐⭐', isCorrect: false }], exp: 'Bir, iki! Tam 2 tane yıldız parıldıyor! ⭐⭐2️⃣' },
    { prompt: 'Hangisinde TAM 3 TANE sevimli kedi var? 🐱🐱🐱', spokenText: 'Hangisinde üç tane kedi var? Üç kediye dokun.', category: 'Sayma', correct: '3 Kedi', cards: [{ text: '3 Kedi (Üç)', icon: '🐱🐱🐱', isCorrect: true }, { text: '1 Kedi', icon: '🐱', isCorrect: false }, { text: '5 Kedi', icon: '🐱🐱🐱🐱🐱', isCorrect: false }], exp: 'Bir, iki, üç! Tam 3 miyavlayan kedi dostumuz var! 🐱3️⃣' },
    { prompt: 'Hangisinde TAM 4 TANE renkli uçan balon var? 🎈🎈🎈🎈', spokenText: 'Hangisinde dört tane balon var? Dört balona dokun.', category: 'Sayma', correct: '4 Balon', cards: [{ text: '4 Balon (Dört)', icon: '🎈🎈🎈🎈', isCorrect: true }, { text: '2 Balon', icon: '🎈🎈', isCorrect: false }, { text: '1 Balon', icon: '🎈', isCorrect: false }], exp: 'Bir, iki, üç, dört! Tam 4 tane rengarenk balon! 🎈4️⃣' },
    { prompt: 'Hangisinde TAM 5 TANE lezzetli çilek var? 🍓🍓🍓🍓🍓', spokenText: 'Hangisinde beş tane çilek var? Beş çileğe dokun.', category: 'Sayma', correct: '5 Çilek', cards: [{ text: '5 Çilek (Beş)', icon: '🍓🍓🍓🍓🍓', isCorrect: true }, { text: '2 Çilek', icon: '🍓🍓', isCorrect: false }, { text: '1 Çilek', icon: '🍓', isCorrect: false }], exp: 'Tam beş parmağımız kadar: 5 tane lezzetli çilek! 🍓🖐️5️⃣' },
    { prompt: 'Hangisinde DAHA ÇOK muz var? 🍌🍌🍌🍌', spokenText: 'Hangisinde daha çok muz var? Çok olan sepeti seç.', category: 'Sayma', correct: 'Çok Muz', cards: [{ text: 'Çok Muz (Dört Tane)', icon: '🍌🍌🍌🍌', isCorrect: true }, { text: 'Az Muz (Bir Tane)', icon: '🍌', isCorrect: false }, { text: 'Elma', icon: '🍎', isCorrect: false }], exp: 'Burada tam 4 muz var, diğerinde ise sadece 1 tane var! 🍌👏' },
    { prompt: 'Hangisinde DAHA AZ yıldız var? ⭐', spokenText: 'Hangisinde daha az yıldız var? En az olana dokun.', category: 'Sayma', correct: '1 Yıldız (Az)', cards: [{ text: '1 Yıldız (Az)', icon: '⭐', isCorrect: true }, { text: '4 Yıldız (Çok)', icon: '⭐⭐⭐⭐', isCorrect: false }, { text: '5 Yıldız (Çok)', icon: '⭐⭐⭐⭐⭐', isCorrect: false }], exp: 'Sadece 1 yıldız var, yani en az olan budur! ⭐👍' },

    // 9) GÖRSEL DİKKAT VE FARKLI OLANI BUL (10 Soru)
    { prompt: 'Kırmızı elmaların arasındaki FARKLI meyve hangisidir? 🥑', spokenText: 'Hangisi diğerlerinden farklıdır? Farklı olana dokun.', category: 'Farklı', correct: 'Yeşil Avokado', cards: [{ text: 'Farklı Avokado', icon: '🥑', isCorrect: true }, { text: 'Kırmızı Elma', icon: '🍎', isCorrect: false }, { text: 'Kırmızı Elma', icon: '🍎', isCorrect: false }], exp: 'Tebrikler! İkisi kırmızı elma, ama diğeri yeşil avokado! 🥑👀' },
    { prompt: 'Sevimli köpeklerin arasına saklanan FARKLI dostumuz hangisidir? 🐱', spokenText: 'Köpeklerin arasındaki farklı kediye dokun.', category: 'Farklı', correct: 'Miyavlayan Kedi', cards: [{ text: 'Farklı Kedi', icon: '🐱', isCorrect: true }, { text: 'Sadık Köpek', icon: '🐶', isCorrect: false }, { text: 'Sadık Köpek', icon: '🐶', isCorrect: false }], exp: 'Keskin gözler! Köpekler arasındaki sevimli kediyi hemen fark ettin! 🐱✨' },
    { prompt: 'Sarı yıldızların arasındaki FARKLI şekil hangisidir? 💖', spokenText: 'Yıldızların arasındaki farklı kalbe dokun.', category: 'Farklı', correct: 'Pembe Kalp', cards: [{ text: 'Farklı Kalp', icon: '💖', isCorrect: true }, { text: 'Sarı Yıldız', icon: '⭐', isCorrect: false }, { text: 'Sarı Yıldız', icon: '⭐', isCorrect: false }], exp: 'Harika dikkat! Sarı yıldızlar arasında parlayan pembe kalbi buldun! 💖⭐' },
    { prompt: 'Uçan taşıtların arasındaki FARKLI olan kara taşıtı hangisidir? 🚗', spokenText: 'Uçanların arasındaki arabaya dokun.', category: 'Farklı', correct: 'Kırmızı Araba', cards: [{ text: 'Farklı Araba', icon: '🚗', isCorrect: true }, { text: 'Hızlı Uçak', icon: '✈️', isCorrect: false }, { text: 'Hızlı Roket', icon: '🚀', isCorrect: false }], exp: 'Uçak ve roket havada uçar, araba ise yolda gider! 🚗🛣️' },
    { prompt: 'Mavi dairelerin arasındaki FARKLI renk hangisidir? 🔴', spokenText: 'Mavilerin arasındaki kırmızı daireye dokun.', category: 'Farklı', correct: 'Kırmızı Daire', cards: [{ text: 'Kırmızı Daire', icon: '🔴', isCorrect: true }, { text: 'Mavi Daire', icon: '🔵', isCorrect: false }, { text: 'Mavi Daire', icon: '🔵', isCorrect: false }], exp: 'Masmavi daireler arasındaki kırmızı daireyi anında yakaladın! 🔴🔵' },
    { prompt: 'Denizde yüzen canlıların arasındaki FARKLI dostumuz hangisidir? 🦁', spokenText: 'Yüzenlerin arasındaki aslana dokun.', category: 'Farklı', correct: 'Aslan', cards: [{ text: 'Farklı Aslan', icon: '🦁', isCorrect: true }, { text: 'Yüzen Balık', icon: '🐟', isCorrect: false }, { text: 'Yavaş Kaplumbağa', icon: '🐢', isCorrect: false }], exp: 'Balık ve kaplumbağa suda yüzer, aslan karada yaşar! 🦁🌊' },
    { prompt: 'Sarı muzların arasına saklanan FARKLI meyve hangisidir? 🍓', spokenText: 'Muzların arasındaki çileğe dokun.', category: 'Farklı', correct: 'Kırmızı Çilek', cards: [{ text: 'Farklı Çilek', icon: '🍓', isCorrect: true }, { text: 'Sarı Muz', icon: '🍌', isCorrect: false }, { text: 'Sarı Muz', icon: '🍌', isCorrect: false }], exp: 'Muzların arasındaki kırmızı çileği hemen buldun! 🍓🍌' },
    { prompt: 'Sarı ayçiçeklerinin arasındaki FARKLI pembe çiçek hangisidir? 🌸', spokenText: 'Ayçiçeklerinin arasındaki pembe çiçeğe dokun.', category: 'Farklı', correct: 'Pembe Çiçek', cards: [{ text: 'Farklı Çiçek', icon: '🌸', isCorrect: true }, { text: 'Sarı Ayçiçeği', icon: '🌻', isCorrect: false }, { text: 'Sarı Ayçiçeği', icon: '🌻', isCorrect: false }], exp: 'Sarı ayçiçekleri arasında açan pembe çiçeği yakaladın! 🌸🌻' },
    { prompt: 'Kuşların arasındaki FARKLI balık hangisidir? 🐟', spokenText: 'Uçan kuşların arasındaki balığa dokun.', category: 'Farklı', correct: 'Yüzen Balık', cards: [{ text: 'Farklı Balık', icon: '🐟', isCorrect: true }, { text: 'Sevimli Kuş', icon: '🐦', isCorrect: false }, { text: 'Sevimli Kuş', icon: '🐦', isCorrect: false }], exp: 'Kuşlar gökyüzünde uçar, balık suda yüzer! 🐟🐦' },
    { prompt: 'Sevimli tavşanların arasındaki FARKLI civciv hangisidir? 🐥', spokenText: 'Tavşanların arasındaki sarı civcive dokun.', category: 'Farklı', correct: 'Sarı Civciv', cards: [{ text: 'Farklı Civciv', icon: '🐥', isCorrect: true }, { text: 'Zıp Tavşan', icon: '🐰', isCorrect: false }, { text: 'Zıp Tavşan', icon: '🐰', isCorrect: false }], exp: 'Tavşanların arasındaki minik sarı civcivi hemen fark ettin! 🐥🐰' },

    // 10) HAYVAN SESLERİ VE DOĞA (8 Soru - 100% 3D Hayvan Grafikleri)
    { prompt: 'Ağaç dalında "CİK CİK" öten sevimli dostumuz hangisidir? 🐦', spokenText: 'Cik cik öten kuşa dokun.', category: 'Hayvan Sesleri', correct: 'Kuş', cards: [{ text: 'Sevimli Kuş', icon: '🐦', isCorrect: true }, { text: 'İnek', icon: '🐮', isCorrect: false }, { text: 'Aslan', icon: '🦁', isCorrect: false }], exp: 'Kuşlar minik gagalarıyla neşeyle "Cik cik" şarkılar söyler! 🐦🎶' },
    { prompt: 'Gölde neşeyle yüzen ve "VAK VAK" diyen sarı gagalı dostumuz hangisidir? 🦆', spokenText: 'Vak vak diyen sevimli ördeğe dokun.', category: 'Hayvan Sesleri', correct: 'Ördek', cards: [{ text: 'Vak Vak Ördek', icon: '🦆', isCorrect: true }, { text: 'Tavşan', icon: '🐰', isCorrect: false }, { text: 'Kedi', icon: '🐱', isCorrect: false }], exp: 'Ördekler paytak paytak yürür ve suda "Vak vak" der! 🦆🌊' },
    { prompt: 'Çimenlerde otlayan ve "MÖÖÖ" diyerek süt veren dostumuz hangisidir? 🐮', spokenText: 'Möö diyen ineğe dokun.', category: 'Hayvan Sesleri', correct: 'Sevimli İnek', cards: [{ text: 'Sevimli İnek', icon: '🐮', isCorrect: true }, { text: 'Köpek', icon: '🐶', isCorrect: false }, { text: 'Kurt', icon: '🐺', isCorrect: false }], exp: 'İnekler "Mööö" der ve bize lezzetli bembeyaz süt verir! 🐮🌾' },
    { prompt: 'Kuyruğunu sallayarak "HAV HAV" diyen sadık dostumuz hangisidir? 🐶', spokenText: 'Hav hav diyen köpeğe dokun.', category: 'Hayvan Sesleri', correct: 'Sadık Köpek', cards: [{ text: 'Sadık Köpek', icon: '🐶', isCorrect: true }, { text: 'Kedi', icon: '🐱', isCorrect: false }, { text: 'Civciv', icon: '🐥', isCorrect: false }], exp: 'Köpekler dost canlısıdır ve "Hav hav" diyerek bizi korur! 🐶🦴' },
    { prompt: 'Çiçeklerden bal toplayan ve "VZZZZ" diyen çalışkan arı hangisidir? 🐝', spokenText: 'Vzzz diyen bal arısına dokun.', category: 'Hayvan Sesleri', correct: 'Bal Arısı', cards: [{ text: 'Çalışkan Arı', icon: '🐝', isCorrect: true }, { text: 'Fil', icon: '🐘', isCorrect: false }, { text: 'Maymun', icon: '🐵', isCorrect: false }], exp: 'Arılar vızıldayarak çiçekten çiçeğe uçar ve tatlı bal yapar! 🐝🍯' },
    { prompt: 'Dıgıdık dıgıdık koşan ve yelesi rüzgarda dalgalanan AT hangisidir? 🐴', spokenText: 'Dıgıdık koşan ata dokun.', category: 'Hayvan Sesleri', correct: 'At', cards: [{ text: 'Koşan At', icon: '🐴', isCorrect: true }, { text: 'Kaplumbağa', icon: '🐢', isCorrect: false }, { text: 'Kedi', icon: '🐱', isCorrect: false }], exp: 'Atlar rüzgar gibi hızlı koşar ve "İ-hi-hii" der! 🐴🌾' },
    { prompt: 'Derelerde nilüfer yaprağında zıplayan "VRAK VRAK" kurbağa hangisidir? 🐸', spokenText: 'Vrak vrak diyen kurbağaya dokun.', category: 'Hayvan Sesleri', correct: 'Kurbağa', cards: [{ text: 'Zıp Kurbağa', icon: '🐸', isCorrect: true }, { text: 'Ayı', icon: '🐻', isCorrect: false }, { text: 'Aslan', icon: '🦁', isCorrect: false }], exp: 'Kurbağalar nilüfer yapraklarının üstünde zıp zıp zıplar! 🐸' },
    { prompt: 'Ormanların derinliklerinde güçlüce "KÜKREEE" diyen aslan kral hangisidir? 🦁', spokenText: 'Kükreyen aslana dokun.', category: 'Hayvan Sesleri', correct: 'Güçlü Aslan', cards: [{ text: 'Güçlü Aslan', icon: '🦁', isCorrect: true }, { text: 'Fare', icon: '🐭', isCorrect: false }, { text: 'Tavşan', icon: '🐰', isCorrect: false }], exp: 'Aslan güçlü kükremesiyle ormanların kralıdır! 🦁👑' },

    // 11) GEOMETRİK ŞEKİLLER VE RENKLER (8 Soru - 100% 3D Şekiller)
    { prompt: 'Tıpkı parlak güneş ve yuvarlak tekerlek gibi DAİRE hangisidir? 🔴', spokenText: 'Daire şekline dokun.', category: 'Şekiller', correct: 'Daire', cards: [{ text: 'Kırmızı Daire', icon: '🔴', isCorrect: true }, { text: 'Yeşil Kare', icon: '🟩', isCorrect: false }, { text: 'Kırmızı Üçgen', icon: '🔺', isCorrect: false }], exp: 'Daire top gibi yuvarlaktır, köşesi yoktur! 🔴⭕' },
    { prompt: 'Hediye kutusu gibi dört kenarı birbirine eşit olan KARE hangisidir? 🟩', spokenText: 'Kare şekline dokun.', category: 'Şekiller', correct: 'Kare', cards: [{ text: 'Yeşil Kare', icon: '🟩', isCorrect: true }, { text: 'Kırmızı Daire', icon: '🔴', isCorrect: false }, { text: 'Pembe Kalp', icon: '💖', isCorrect: false }], exp: 'Kare tıpkı bir kutu gibi dört eşit kenara sahiptir! 🟩📦' },
    { prompt: 'Lezzetli bir dilim pizza gibi üç sivri köşeli ÜÇGEN hangisidir? 🔺', spokenText: 'Üçgen şekline dokun.', category: 'Şekiller', correct: 'Üçgen', cards: [{ text: 'Kırmızı Üçgen', icon: '🔺', isCorrect: true }, { text: 'Kırmızı Daire', icon: '🔴', isCorrect: false }, { text: 'Yeşil Kare', icon: '🟩', isCorrect: false }], exp: 'Üçgenin 3 tane sivri köşesi vardır, tıpkı çatı gibi! 🔺🍕' },
    { prompt: 'Gece gökyüzünde ışıl ışıl parıldayan YILDIZ hangisidir? ⭐', spokenText: 'Yıldız şekline dokun.', category: 'Şekiller', correct: 'Yıldız', cards: [{ text: 'Parlak Yıldız', icon: '⭐', isCorrect: true }, { text: 'Yeşil Kare', icon: '🟩', isCorrect: false }, { text: 'Kırmızı Daire', icon: '🔴', isCorrect: false }], exp: 'Yıldız gökyüzünde bize göz kırpar ve ışık saçar! ⭐✨' },
    { prompt: 'Pamuk şeker ve güzel kokulu gül rengi olan PEMBE hangisidir? 💖', spokenText: 'Pembe kalbe dokun.', category: 'Renkler', correct: 'Pembe Kalp', cards: [{ text: 'Pembe Kalp', icon: '💖', isCorrect: true }, { text: 'Mavi Daire', icon: '🔵', isCorrect: false }, { text: 'Yeşil Daire', icon: '🟢', isCorrect: false }], exp: 'Pembe pamuk şekerin ve mis kokulu güllerin rengidir! 💖🍭' },
    { prompt: 'Ferahlatıcı gökyüzünün ve mavi denizlerin rengi olan MAVİ hangisidir? 🔵', spokenText: 'Mavi renge dokun.', category: 'Renkler', correct: 'Mavi Daire', cards: [{ text: 'Mavi Daire', icon: '🔵', isCorrect: true }, { text: 'Sarı Daire', icon: '🟡', isCorrect: false }, { text: 'Kırmızı Daire', icon: '🔴', isCorrect: false }], exp: 'Mavi ferah gökyüzünün ve serin denizlerin rengidir! 🔵🌊' },
    { prompt: 'Kocaman sevgi dolu kırmızı KALP hangisidir? 💖', spokenText: 'Kalp şekline dokun.', category: 'Şekiller', correct: 'Kalp', cards: [{ text: 'Sevgi Kalbi', icon: '💖', isCorrect: true }, { text: 'Yeşil Kare', icon: '🟩', isCorrect: false }, { text: 'Kırmızı Üçgen', icon: '🔺', isCorrect: false }], exp: 'Kalp sevgiyi ve mutluluğu simgeler! 💖🥰' },
    { prompt: 'Sıcacık Güneş\'in ve tatlı muzun rengi olan SARI hangisidir? 🟡', spokenText: 'Sarı renge dokun.', category: 'Renkler', correct: 'Sarı Daire', cards: [{ text: 'Sarı Daire', icon: '🟡', isCorrect: true }, { text: 'Mavi Daire', icon: '🔵', isCorrect: false }, { text: 'Mor Daire', icon: '🟣', isCorrect: false }], exp: 'Sarı içimizi ısıtan Güneş\'in rengidir! 🟡☀️' }
    ],

    // -------------------------------------------------------------------------
    // ANASINIFI: 16 SEVİYELİK 100% GÖRSEL VE İŞİTSEL BALON PATLATMA HAVUZU
    // (Okuma Yazma Gerektirmez, 2026 Maarif Renk, Miktar ve Şekil Kazanımları)
    // -------------------------------------------------------------------------
    grade0BalloonLevelsPool: [
      // 1) Renk Balonları (Canlı Renk Tanıma - Yuvarlaklar Olmadan, Balonun Kendi Rengiyle)
      { 
        id: 'b0_red', 
        instruction: '🎈 Sadece KIRMIZI balonları patlat!', 
        spokenText: 'Sadece kırmızı renkli balonları patlat.', 
        target: 'Kırmızı', 
        category: 'Renkler', 
        isColorLevel: true,
        targetColorClass: 'balloon-color-red',
        distractorColorClasses: ['balloon-color-blue', 'balloon-color-yellow', 'balloon-color-green', 'balloon-color-purple', 'balloon-color-orange'],
        targetsNeeded: 2, 
        exp: 'Güm! Kırmızı renkli balonları ustalıkla patlattın! 🎈💥' 
      },
      { 
        id: 'b0_blue', 
        instruction: '🎈 Sadece MAVİ balonları patlat!', 
        spokenText: 'Sadece mavi renkli balonları patlat.', 
        target: 'Mavi', 
        category: 'Renkler', 
        isColorLevel: true,
        targetColorClass: 'balloon-color-blue',
        distractorColorClasses: ['balloon-color-red', 'balloon-color-yellow', 'balloon-color-green', 'balloon-color-orange', 'balloon-color-purple'],
        targetsNeeded: 2, 
        exp: 'Harika! Masmavi balonları havada yakaladın! 🎈✨' 
      },
      { 
        id: 'b0_yellow', 
        instruction: '🎈 Sadece SARI balonları patlat!', 
        spokenText: 'Sadece sarı renkli balonları patlat.', 
        target: 'Sarı', 
        category: 'Renkler', 
        isColorLevel: true,
        targetColorClass: 'balloon-color-yellow',
        distractorColorClasses: ['balloon-color-red', 'balloon-color-blue', 'balloon-color-green', 'balloon-color-purple', 'balloon-color-orange'],
        targetsNeeded: 2, 
        exp: 'Süpersin! Parlak sarı balonlar patladı! 🎈⭐' 
      },
      { 
        id: 'b0_green', 
        instruction: '🎈 Sadece YEŞİL balonları patlat!', 
        spokenText: 'Sadece yeşil renkli balonları patlat.', 
        target: 'Yeşil', 
        category: 'Renkler', 
        isColorLevel: true,
        targetColorClass: 'balloon-color-green',
        distractorColorClasses: ['balloon-color-red', 'balloon-color-blue', 'balloon-color-yellow', 'balloon-color-purple', 'balloon-color-orange'],
        targetsNeeded: 2, 
        exp: 'Bravo! Yemyeşil balonları tam zamanında vurdun! 🎈🌿' 
      },
      { 
        id: 'b0_purple', 
        instruction: '🎈 Sadece MOR balonları patlat!', 
        spokenText: 'Sadece mor renkli balonları patlat.', 
        target: 'Mor', 
        category: 'Renkler', 
        isColorLevel: true,
        targetColorClass: 'balloon-color-purple',
        distractorColorClasses: ['balloon-color-red', 'balloon-color-blue', 'balloon-color-yellow', 'balloon-color-green', 'balloon-color-orange'],
        targetsNeeded: 2, 
        exp: 'Nefis refleks! Mor balonlar güm diye patladı! 🎈🎉' 
      },
      { 
        id: 'b0_orange', 
        instruction: '🎈 Sadece TURUNCU balonları patlat!', 
        spokenText: 'Sadece turuncu renkli balonları patlat.', 
        target: 'Turuncu', 
        category: 'Renkler', 
        isColorLevel: true,
        targetColorClass: 'balloon-color-orange',
        distractorColorClasses: ['balloon-color-red', 'balloon-color-blue', 'balloon-color-green', 'balloon-color-purple', 'balloon-color-yellow'],
        targetsNeeded: 2, 
        exp: 'Tebrikler! Turuncu renkli balonları kaçırmadın! 🎈🍊' 
      },
      { 
        id: 'b0_pink', 
        instruction: '🎈 Sadece PEMBE balonları patlat!', 
        spokenText: 'Sadece pembe renkli balonları patlat.', 
        target: 'Pembe', 
        category: 'Renkler', 
        isColorLevel: true,
        targetColorClass: 'balloon-color-pink',
        distractorColorClasses: ['balloon-color-red', 'balloon-color-blue', 'balloon-color-green', 'balloon-color-yellow', 'balloon-color-purple'],
        targetsNeeded: 2, 
        exp: 'Harika! Pembe renkli balonları yakaladın! 🎈💖' 
      },

      // 2) Minik Sayılar 1-5 (Dokunmatik Sayı Balonları)
      { id: 'b0_num_1', instruction: '🎈 Sadece "1" yazan balonları patlat!', spokenText: 'Sadece bir yazan balonları patlat.', target: '1', category: 'Sayılar', targetsNeeded: 2, targets: ['1'], distractors: ['2', '3', '4', '5'], exp: 'Harika başlangıç! 1 yazan balonları patlattın! 🎈👏' },
      { id: 'b0_num_2', instruction: '🎈 Sadece "2" yazan balonları patlat!', spokenText: 'Sadece iki yazan balonları patlat.', target: '2', category: 'Sayılar', targetsNeeded: 2, targets: ['2'], distractors: ['1', '3', '4', '5'], exp: 'İki tavşan kulağı gibi: 2 balonlarını buldun! 🎈🐰' },
      { id: 'b0_num_3', instruction: '🎈 Sadece "3" yazan balonları patlat!', spokenText: 'Sadece üç yazan balonları patlat.', target: '3', category: 'Sayılar', targetsNeeded: 2, targets: ['3'], distractors: ['1', '2', '4', '5'], exp: '1-2-3! 3 yazan balonlar güm diye patladı! 🎈🚀' },
      { id: 'b0_num_4', instruction: '🎈 Sadece "4" yazan balonları patlat!', spokenText: 'Sadece dört yazan balonları patlat.', target: '4', category: 'Sayılar', targetsNeeded: 2, targets: ['4'], distractors: ['1', '2', '3', '5'], exp: 'Dört tekerlek gibi: 4 balonları patladı! 🎈🚗' },
      { id: 'b0_num_5', instruction: '🎈 Sadece "5" yazan balonları patlat!', spokenText: 'Sadece beş yazan balonları patlat.', target: '5', category: 'Sayılar', targetsNeeded: 2, targets: ['5'], distractors: ['1', '2', '3', '4'], exp: 'Çak bir beşlik! 5 yazan balonları yakaladın! 🎈🖐️' },

      // 3) Sevimli Şekiller ve Semboller (Görsel Balonlar)
      { id: 'b0_star', instruction: '🎈 Sadece YILDIZ olan balonları patlat!', spokenText: 'Sadece yıldız olan balonları patlat.', target: '⭐', category: 'Şekiller', targetsNeeded: 2, targets: ['⭐'], distractors: ['💖', '🍎', '🐱', '🚗'], exp: 'Işıl ışıl parlayan yıldız balonlarını patlattın! ⭐🎈✨' },
      { id: 'b0_heart', instruction: '🎈 Sadece KALP olan sevgi balonlarını patlat!', spokenText: 'Sadece kalp olan balonları patlat.', target: '💖', category: 'Şekiller', targetsNeeded: 2, targets: ['💖'], distractors: ['⭐', '🍎', '🚗', '🐱'], exp: 'Kocaman sevgiyle kalp balonlarını patlattın! 💖🎈🥰' },
      { id: 'b0_cat', instruction: '🎈 Sadece KEDİ olan miyav balonlarını patlat!', spokenText: 'Sadece sevimli kedi balonlarını patlat.', target: '🐱', category: 'Hayvanlar', targetsNeeded: 2, targets: ['🐱'], distractors: ['🐶', '🐰', '🦁', '🐸'], exp: 'Miyav! Sevimli kedili balonları yakaladın! 🐱🎈🐾' },
      { id: 'b0_apple', instruction: '🎈 Sadece KIRMIZI ELMA olan balonları patlat!', spokenText: 'Sadece elma olan balonları patlat.', target: '🍎', category: 'Meyveler', targetsNeeded: 2, targets: ['🍎'], distractors: ['🍌', '🍓', '🍇', '🍉'], exp: 'Kıtır kıtır elmalı balonlar patladı! 🍎🎈😋' }
    ],

    // -------------------------------------------------------------------------
    // 1. SINIF: 42 SEVİYELİK BALON PATLATMA HAVUZU (HARF, HECE, SAYI, RİTMİK)
    // -------------------------------------------------------------------------
    grade1BalloonLevelsPool: [
      // 1. Grup Harfler (E-L-A-K-İ-N) - 12 Bölüm
      { id: 'b_e_up', instruction: '🎈 Sadece "E" harfi olan balonları patlat!', spokenText: 'Sadece e! sesi olan balonları patlat.', target: 'E', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['E'], distractors: ['L', 'A', 'K', 'İ', 'N'], exp: 'Harika refleks! "E" harfini yakaladın! 🎈👏' },
      { id: 'b_e_low', instruction: '🎈 Sadece küçük "e" harfi olan balonları patlat!', spokenText: 'Sadece küçük e! sesi olan balonları patlat.', target: 'e', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['e'], distractors: ['l', 'a', 'k', 'i', 'n'], exp: 'Süpersin! Küçük "e" balonlarını patlattın! 🎈✨' },
      { id: 'b_l_up', instruction: '🎈 Sadece "L" harfi olan balonları patlat!', spokenText: 'Sadece le! sesi olan balonları patlat.', target: 'L', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['L'], distractors: ['E', 'A', 'K', 'T', 'N'], exp: 'Tebrikler! "L" harfi balonları patladı! 🎈🎉' },
      { id: 'b_l_low', instruction: '🎈 Sadece küçük "l" harfi olan balonları patlat!', spokenText: 'Sadece küçük le! sesi olan balonları patlat.', target: 'l', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['l'], distractors: ['e', 'i', 't', 'k', 'a'], exp: 'Çok hızlısın! Küçük "l" harfini buldun! 🎈⭐' },
      { id: 'b_a_up', instruction: '🎈 Sadece "A" harfi olan balonları patlat!', spokenText: 'Sadece a! sesi olan balonları patlat.', target: 'A', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['A'], distractors: ['E', 'L', 'O', 'K', 'İ'], exp: 'Muhteşem! "A" sesi balonunu avladın! 🎈👏' },
      { id: 'b_a_low', instruction: '🎈 Sadece küçük "a" harfi olan balonları patlat!', spokenText: 'Sadece küçük a! sesi olan balonları patlat.', target: 'a', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['a'], distractors: ['e', 'o', 'u', 'k', 'n'], exp: 'Bravo! Küçük "a" harfini kaçırmadın! 🎈💖' },
      { id: 'b_k_up', instruction: '🎈 Sadece "K" harfi olan balonları patlat!', spokenText: 'Sadece ke! sesi olan balonları patlat.', target: 'K', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['K'], distractors: ['L', 'E', 'N', 'T', 'İ'], exp: 'Harika atış! "K" harfi patladı! 🎈💥' },
      { id: 'b_k_low', instruction: '🎈 Sadece küçük "k" harfi olan balonları patlat!', spokenText: 'Sadece küçük ke! sesi olan balonları patlat.', target: 'k', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['k'], distractors: ['l', 't', 'b', 'h', 'n'], exp: 'Nefis gözlem! Küçük "k" balonunu patlattın! 🎈👍' },
      { id: 'b_i_up', instruction: '🎈 Sadece "İ" harfi olan balonları patlat!', spokenText: 'Sadece i! sesi olan balonları patlat.', target: 'İ', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['İ'], distractors: ['E', 'L', 'A', 'K', 'T'], exp: 'Süper! Noktalı "İ" harfini hemen yakaladın! 🎈🌟' },
      { id: 'b_i_low', instruction: '🎈 Sadece küçük "i" harfi olan balonları patlat!', spokenText: 'Sadece küçük i! sesi olan balonları patlat.', target: 'i', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['i'], distractors: ['l', 'e', 't', 'k', 'j'], exp: 'Çok dikkatlisin! Küçük "i" harfini buldun! 🎈👏' },
      { id: 'b_n_up', instruction: '🎈 Sadece "N" harfi olan balonları patlat!', spokenText: 'Sadece ne! sesi olan balonları patlat.', target: 'N', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['N'], distractors: ['M', 'K', 'L', 'Z', 'H'], exp: 'Tebrikler! "N" harfi balonlarını patlattın! 🎈🎉' },
      { id: 'b_n_low', instruction: '🎈 Sadece küçük "n" harfi olan balonları patlat!', spokenText: 'Sadece küçük ne! sesi olan balonları patlat.', target: 'n', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['n'], distractors: ['u', 'm', 'h', 'r', 'k'], exp: 'Harikasın! Küçük "n" harfini ustalıkla patlattın! 🎈💥' },

      // 2. Grup Harfler (O-M-U-T-Ü-Y) - 10 Bölüm
      { id: 'b_o_up', instruction: '🎈 Sadece "O" harfi olan balonları patlat!', spokenText: 'Sadece o! sesi olan balonları patlat.', target: 'O', category: '2. Grup Harfler', targetsNeeded: 2, targets: ['O'], distractors: ['U', 'A', 'E', 'C', 'D'], exp: 'Tıpkı bir çember gibi olan "O" harfini patlattın! 🎈⭕' },
      { id: 'b_m_up', instruction: '🎈 Sadece "M" harfi olan balonları patlat!', spokenText: 'Sadece me! sesi olan balonları patlat.', target: 'M', category: '2. Grup Harfler', targetsNeeded: 2, targets: ['M'], distractors: ['N', 'K', 'T', 'W', 'V'], exp: 'Nefis refleks! "M" sesini yakaladın! 🎈👏' },
      { id: 'b_m_low', instruction: '🎈 Sadece küçük "m" harfi olan balonları patlat!', spokenText: 'Sadece küçük me! sesi olan balonları patlat.', target: 'm', category: '2. Grup Harfler', targetsNeeded: 2, targets: ['m'], distractors: ['n', 'u', 'w', 'v', 'h'], exp: 'İki tepeli küçük "m" harfini buldun! 🎈✨' },
      { id: 'b_u_up', instruction: '🎈 Sadece "U" harfi olan balonları patlat!', spokenText: 'Sadece u! sesi olan balonları patlat.', target: 'U', category: '2. Grup Harfler', targetsNeeded: 2, targets: ['U'], distractors: ['O', 'Ü', 'A', 'V', 'C'], exp: 'Harika! "U" harfi balonlarını patlattın! 🎈⭐' },
      { id: 'b_t_up', instruction: '🎈 Sadece "T" harfi olan balonları patlat!', spokenText: 'Sadece te! sesi olan balonları patlat.', target: 'T', category: '2. Grup Harfler', targetsNeeded: 2, targets: ['T'], distractors: ['L', 'K', 'Y', 'F', 'İ'], exp: 'Çok hızlısın! "T" harfi patladı! 🎈💥' },
      { id: 'b_t_low', instruction: '🎈 Sadece küçük "t" harfi olan balonları patlat!', spokenText: 'Sadece küçük te! sesi olan balonları patlat.', target: 't', category: '2. Grup Harfler', targetsNeeded: 2, targets: ['t'], distractors: ['l', 'f', 'k', 'i', 'j'], exp: 'Bravo! Küçük "t" balonunu tam zamanında patlattın! 🎈👍' },
      { id: 'b_u2_up', instruction: '🎈 Sadece noktalı "Ü" harfi olan balonları patlat!', spokenText: 'Sadece noktalı ü! sesi olan balonları patlat.', target: 'Ü', category: '2. Grup Harfler', targetsNeeded: 2, targets: ['Ü'], distractors: ['U', 'O', 'Ö', 'Y', 'T'], exp: 'Süper dikkat! Noktalı "Ü" harfini patlattın! 🎈🌟' },
      { id: 'b_y_up', instruction: '🎈 Sadece "Y" harfi olan balonları patlat!', spokenText: 'Sadece ye! sesi olan balonları patlat.', target: 'Y', category: '2. Grup Harfler', targetsNeeded: 2, targets: ['Y'], distractors: ['T', 'K', 'V', 'X', 'U'], exp: 'Muhteşem! "Y" harfi balonunu yakaladın! 🎈🎉' },
      { id: 'b_y_low', instruction: '🎈 Sadece küçük "y" harfi olan balonları patlat!', spokenText: 'Sadece küçük ye! sesi olan balonları patlat.', target: 'y', category: '2. Grup Harfler', targetsNeeded: 2, targets: ['y'], distractors: ['u', 'v', 'g', 'j', 'p'], exp: 'Harika! Küçük "y" balonlarını havada vurdun! 🎈💖' },
      { id: 'b_vowels', instruction: '🎈 Sadece SESLİ (Ünlü) harfleri patlat! (A, E, İ, O, U)', spokenText: 'Sadece sesli harfleri patlat.', target: 'Sesli Harfler', category: 'Harf Bilgisi', targetsNeeded: 3, targets: ['A', 'E', 'İ', 'O', 'U'], distractors: ['K', 'L', 'T', 'M', 'N'], exp: 'Şampiyon! Sesli harfleri eksiksiz topladın! 🎈🏆' },

      // 1. Sınıf Heceler - 10 Bölüm
      { id: 'b_syl_el', instruction: '🎈 Sadece "EL" hecesi olan balonları patlat!', spokenText: 'Sadece el hecesi olan balonları patlat.', target: 'EL', category: 'Heceler', targetsNeeded: 2, targets: ['EL'], distractors: ['LE', 'AL', 'LA', 'EK'], exp: 'Süpersin! "EL" hecesini hemen okudun ve patlattın! 🎈✋' },
      { id: 'b_syl_al', instruction: '🎈 Sadece "AL" hecesi olan balonları patlat!', spokenText: 'Sadece al hecesi olan balonları patlat.', target: 'AL', category: 'Heceler', targetsNeeded: 2, targets: ['AL'], distractors: ['LA', 'EL', 'OL', 'AT'], exp: 'Harika! "AL" hecesi balonlarını patlattın! 🎈🔴' },
      { id: 'b_syl_ak', instruction: '🎈 Sadece "AK" hecesi olan balonları patlat!', spokenText: 'Sadece ak hecesi olan balonları patlat.', target: 'AK', category: 'Heceler', targetsNeeded: 2, targets: ['AK'], distractors: ['KA', 'EK', 'OK', 'KE'], exp: 'Nefis! "AK" hecesini tam hedeften vurdun! 🎈⚪' },
      { id: 'b_syl_ek', instruction: '🎈 Sadece "EK" hecesi olan balonları patlat!', spokenText: 'Sadece ek hecesi olan balonları patlat.', target: 'EK', category: 'Heceler', targetsNeeded: 2, targets: ['EK'], distractors: ['KE', 'AK', 'ET', 'EL'], exp: 'Tebrikler! "EK" hecesi balonları patladı! 🎈🌾' },
      { id: 'b_syl_et', instruction: '🎈 Sadece "ET" hecesi olan balonları patlat!', spokenText: 'Sadece et hecesi olan balonları patlat.', target: 'ET', category: 'Heceler', targetsNeeded: 2, targets: ['ET'], distractors: ['TE', 'AT', 'OT', 'İT'], exp: 'Çok hızlısın! "ET" hecesini yakaladın! 🎈🥩' },
      { id: 'b_syl_an', instruction: '🎈 Sadece "AN" hecesi olan balonları patlat!', spokenText: 'Sadece an hecesi olan balonları patlat.', target: 'AN', category: 'Heceler', targetsNeeded: 2, targets: ['AN'], distractors: ['NA', 'EN', 'ON', 'AL'], exp: 'Harika okuma! "AN" hecesi patladı! 🎈✨' },
      { id: 'b_syl_la', instruction: '🎈 Sadece "LA" hecesi olan balonları patlat!', spokenText: 'Sadece la hecesi olan balonları patlat.', target: 'LA', category: 'Heceler', targetsNeeded: 2, targets: ['LA'], distractors: ['AL', 'LE', 'LI', 'LO'], exp: 'Bravo! "LA" hecesini ustalıkla patlattın! 🎈🎶' },
      { id: 'b_syl_ma', instruction: '🎈 Sadece "MA" hecesi olan balonları patlat!', spokenText: 'Sadece ma hecesi olan balonları patlat.', target: 'MA', category: 'Heceler', targetsNeeded: 2, targets: ['MA'], distractors: ['AM', 'ME', 'MO', 'MU'], exp: 'Süper! "MA" hecesi balonları patladı! 🎈⭐' },
      { id: 'b_syl_to', instruction: '🎈 Sadece "TO" hecesi olan balonları patlat!', spokenText: 'Sadece to hecesi olan balonları patlat.', target: 'TO', category: 'Heceler', targetsNeeded: 2, targets: ['TO'], distractors: ['OT', 'TA', 'TE', 'TU'], exp: 'Harika refleks! "TO" hecesini patlattın! 🎈⚽' },
      { id: 'b_syl_ku', instruction: '🎈 Sadece "KU" hecesi olan balonları patlat!', spokenText: 'Sadece ku hecesi olan balonları patlat.', target: 'KU', category: 'Heceler', targetsNeeded: 2, targets: ['KU'], distractors: ['UK', 'KO', 'KA', 'KE'], exp: 'Tebrikler! "KU" hecesini yakaladın! 🎈🐦' },

      // Sayılar ve Ritmik Sayma - 10 Bölüm
      { id: 'b_num_5', instruction: '🎈 Sadece "5" yazan balonları patlat!', spokenText: 'Sadece beş yazan balonları patlat.', target: '5', category: 'Sayılar', targetsNeeded: 2, targets: ['5'], distractors: ['2', '3', '6', '8', '9'], exp: 'Harika! 5 yazan balonları patlattın! 🎈🖐️' },
      { id: 'b_num_10', instruction: '🎈 Sadece "10" yazan balonları patlat!', spokenText: 'Sadece on yazan balonları patlat.', target: '10', category: 'Sayılar', targetsNeeded: 2, targets: ['10'], distractors: ['1', '0', '7', '12', '9'], exp: 'Muhteşem! İki basamaklı 10 sayısını yakaladın! 🎈🔟' },
      { id: 'b_even', instruction: '🎈 Sadece ÇİFT sayıları patlat! (2, 4, 6, 8, 10)', spokenText: 'Sadece çift sayıları patlat.', target: 'Çift Sayılar', category: 'Sayılar', targetsNeeded: 3, targets: ['2', '4', '6', '8', '10'], distractors: ['1', '3', '5', '7', '9'], exp: 'Harika matematik refleksi! Çift sayıları patlattın! 🎈🎯' },
      { id: 'b_odd', instruction: '🎈 Sadece TEK sayıları patlat! (1, 3, 5, 7, 9)', spokenText: 'Sadece tek sayıları patlat.', target: 'Tek Sayılar', category: 'Sayılar', targetsNeeded: 3, targets: ['1', '3', '5', '7', '9'], distractors: ['2', '4', '6', '8', '10'], exp: 'Süpersin! Bütün tek sayıları tam zamanında yakaladın! 🎈⚡' },
      { id: 'b_gt_5', instruction: '🎈 5\'ten BÜYÜK olan sayıları patlat! (6, 7, 8, 9)', spokenText: 'Beşten büyük olan sayıları patlat.', target: '> 5', category: 'Sayılar', targetsNeeded: 3, targets: ['6', '7', '8', '9'], distractors: ['1', '2', '3', '4'], exp: 'Nefis karşılaştırma! 5\'ten büyük sayıları patlattın! 🎈📈' },
      { id: 'b_lt_5', instruction: '🎈 5\'ten KÜÇÜK olan sayıları patlat! (1, 2, 3, 4)', spokenText: 'Beşten küçük olan sayıları patlat.', target: '< 5', category: 'Sayılar', targetsNeeded: 3, targets: ['1', '2', '3', '4'], distractors: ['6', '7', '8', '9', '10'], exp: 'Tebrikler! 5\'ten küçük sayıları buldun! 🎈📉' },
      { id: 'b_rhythm_2', instruction: '🎈 2\'şer Ritmik Sayma sayılarını patlat! (2, 4, 6, 8, 10)', spokenText: 'İkişer ritmik sayma sayılarını patlat.', target: '2\'şer Sayma', category: 'Ritmik Sayma', targetsNeeded: 3, targets: ['2', '4', '6', '8', '10'], distractors: ['3', '5', '7', '9', '11'], exp: '2-4-6-8-10! 2\'şer ritmik saymayı harika biliyorsun! 🎈🚀' },
      { id: 'b_rhythm_5', instruction: '🎈 5\'er Ritmik Sayma sayılarını patlat! (5, 10, 15, 20)', spokenText: 'Beşer ritmik sayma sayılarını patlat.', target: '5\'er Sayma', category: 'Ritmik Sayma', targetsNeeded: 3, targets: ['5', '10', '15', '20'], distractors: ['7', '12', '18', '22', '16'], exp: '5-10-15-20! 5\'er saymada bir yıldızsın! 🎈⭐' },
      { id: 'b_rhythm_10', instruction: '🎈 10\'ar Ritmik Sayma sayılarını patlat! (10, 20, 30, 40)', spokenText: 'Onar ritmik sayma sayılarını patlat.', target: '10\'ar Sayma', category: 'Ritmik Sayma', targetsNeeded: 3, targets: ['10', '20', '30', '40'], distractors: ['15', '25', '35', '45', '18'], exp: '10-20-30-40! Hızına kimse yetişemez! 🎈💨' },
      { id: 'b_sum_10', instruction: '🎈 Sonucu 10 eden toplama işlemlerini patlat! (5+5, 8+2, 7+3)', spokenText: 'Sonucu on eden toplama işlemlerini patlat.', target: '= 10', category: 'Toplama', targetsNeeded: 2, targets: ['5+5', '8+2', '7+3', '9+1'], distractors: ['4+4', '6+2', '9+3', '5+3'], exp: 'Müthiş hesap! Sonucu 10 olan balonları patlattın! 🎈🏆' }
    ],

    // -------------------------------------------------------------------------
    // 77 ÇİFTLİK HAFIZA & EŞLEŞTİRME HAVUZU (HARF, ZIT ANLAM, TOPLAMA)
    // -------------------------------------------------------------------------
    matchingPairsPool: {
      kindergarten_visual: [
        { left: '🐱', right: '🐱' }, { left: '🐶', right: '🐶' }, { left: '🍎', right: '🍎' },
        { left: '⭐', right: '⭐' }, { left: '🚗', right: '🚗' }, { left: '🍓', right: '🍓' },
        { left: '🦁', right: '🦁' }, { left: '🎈', right: '🎈' }, { left: '🐻', right: '🐻' },
        { left: '☀️', right: '☀️' }, { left: '🚀', right: '🚀' }, { left: '🍌', right: '🍌' }
      ],
      letters: [
        { left: 'A', right: 'a' }, { left: 'B', right: 'b' }, { left: 'C', right: 'c' }, { left: 'Ç', right: 'ç' },
        { left: 'D', right: 'd' }, { left: 'E', right: 'e' }, { left: 'F', right: 'f' }, { left: 'G', right: 'g' },
        { left: 'H', right: 'h' }, { left: 'I', right: 'ı' }, { left: 'İ', right: 'i' }, { left: 'K', right: 'k' },
        { left: 'L', right: 'l' }, { left: 'M', right: 'm' }, { left: 'N', right: 'n' }, { left: 'O', right: 'o' },
        { left: 'Ö', right: 'ö' }, { left: 'P', right: 'p' }, { left: 'R', right: 'r' }, { left: 'S', right: 's' },
        { left: 'Ş', right: 'ş' }, { left: 'T', right: 't' }, { left: 'U', right: 'u' }, { left: 'Ü', right: 'ü' },
        { left: 'V', right: 'v' }, { left: 'Y', right: 'y' }, { left: 'Z', right: 'z' }, { left: 'J', right: 'j' }
      ],
      antonyms: [
        { left: 'Sıcak ☀️', right: 'Soğuk ❄️' }, { left: 'Büyük 🐘', right: 'Küçük 🐭' },
        { left: 'Hızlı 🐆', right: 'Yavaş 🐢' }, { left: 'Açık 📖', right: 'Kapalı 📕' },
        { left: 'Uzun 🦒', right: 'Kısa 🦔' }, { left: 'Ağır 🐘', right: 'Hafif 🎈' },
        { left: 'Temiz ✨', right: 'Kirli 🧼' }, { left: 'Genç 🧒', right: 'Yaşlı 👴' },
        { left: 'Mutlu 😊', right: 'Üzgün 😢' }, { left: 'Aşağı ⬇️', right: 'Yukarı ⬆️' },
        { left: 'Gündüz ☀️', right: 'Gece 🌙' }, { left: 'Ön 🚗', right: 'Arka 🚙' },
        { left: 'Dolu 🥛', right: 'Boş 🍽️' }, { left: 'Zengin 💰', right: 'Fakir 🪙' },
        { left: 'Kolay 👍', right: 'Zor 🧠' }, { left: 'Sert 🧱', right: 'Yumuşak 🧸' },
        { left: 'Doğru ✅', right: 'Yanlış ❌' }, { left: 'Erken ⏰', right: 'Geç ⏳' },
        { left: 'İnce ✏️', right: 'Kalın 🖍️' }, { left: 'Karanlık 🌑', right: 'Aydınlık 💡' },
        { left: 'Güzel 🌸', right: 'Çirkin 🧟' }, { left: 'Taze 🍏', right: 'Bayat 🥖' },
        { left: 'Tatlı 🍯', right: 'Acı 🌶️' }, { left: 'Çalışkan 🐝', right: 'Tembel 🦥' },
        { left: 'Cesur 🦁', right: 'Korkak 🐭' }
      ],
      math: [
        { left: '2 + 1', right: '3' }, { left: '2 + 2', right: '4' }, { left: '3 + 2', right: '5' },
        { left: '4 + 2', right: '6' }, { left: '5 + 2', right: '7' }, { left: '4 + 4', right: '8' },
        { left: '5 + 4', right: '9' }, { left: '5 + 5', right: '10' }, { left: '6 + 4', right: '10' },
        { left: '7 + 3', right: '10' }, { left: '8 + 2', right: '10' }, { left: '9 + 1', right: '10' },
        { left: '6 + 5', right: '11' }, { left: '7 + 5', right: '12' }, { left: '8 + 4', right: '12' },
        { left: '6 + 6', right: '12' }, { left: '7 + 6', right: '13' }, { left: '8 + 5', right: '13' },
        { left: '9 + 5', right: '14' }, { left: '7 + 7', right: '14' }, { left: '10 + 5', right: '15' },
        { left: '8 + 8', right: '16' }, { left: '9 + 9', right: '18' }, { left: '10 + 10', right: '20' }
      ]
    },

    // 1) 🎈 BALON PATLATMA MOTORU (Ses & Harf Balonları ve Renk Balonları)
    generateBalloonQuestion(grade, gameType) {
      if (gameType === 'color_balloon' || grade === 0) {
        const colorPool = [
          { name: 'Kırmızı', colorClass: 'balloon-color-red', prompt: '🎈 Sadece KIRMIZI balonu patlat!' },
          { name: 'Mavi', colorClass: 'balloon-color-blue', prompt: '🎈 Sadece MAVİ balonu patlat!' },
          { name: 'Sarı', colorClass: 'balloon-color-yellow', prompt: '🎈 Sadece SARI balonu patlat!' },
          { name: 'Yeşil', colorClass: 'balloon-color-green', prompt: '🎈 Sadece YEŞİL balonu patlat!' },
          { name: 'Turuncu', colorClass: 'balloon-color-orange', prompt: '🎈 Sadece TURUNCU balonu patlat!' },
          { name: 'Mor', colorClass: 'balloon-color-purple', prompt: '🎈 Sadece MOR balonu patlat!' },
          { name: 'Pembe', colorClass: 'balloon-color-pink', prompt: '🎈 Sadece PEMBE balonu patlat!' }
        ];
        const target = colorPool[Math.floor(Math.random() * colorPool.length)];
        const otherColors = colorPool.filter(c => c.name !== target.name);
        const shuffledOthers = [...otherColors].sort(() => 0.5 - Math.random()).slice(0, 3);
        const balloons = [
          { text: '', colorClass: target.colorClass, isTarget: true },
          ...shuffledOthers.map(o => ({ text: '', colorClass: o.colorClass, isTarget: false }))
        ].sort(() => 0.5 - Math.random());

        return {
          type: 'balloon',
          question: target.prompt,
          spokenText: target.name + ' balonu patlat',
          correct: target.name,
          explanation: `Harika refleks! ${target.name} balonu tam zamanında patlattın! 🎈💥`,
          interactiveData: { balloons }
        };
      } else {
        // 1. Sınıf: Türkiye Yüzyılı Maarif Modeli Ses Grupları (ANETİL)
        const subMode = Math.floor(Math.random() * 3);
        if (subMode === 0) {
          // Doğrudan Harf Sesi
          const letterPool = [
            { letter: 'A', spoken: 'A harfi olan balonu patlat' },
            { letter: 'N', spoken: 'N sesini patlat' },
            { letter: 'E', spoken: 'E harfi olan balonu patlat' },
            { letter: 'T', spoken: 'T sesini patlat' },
            { letter: 'İ', spoken: 'İ harfini patlat' },
            { letter: 'L', spoken: 'L sesini patlat' },
            { letter: 'O', spoken: 'O harfini patlat' },
            { letter: 'K', spoken: 'K sesini patlat' },
            { letter: 'U', spoken: 'U harfini patlat' },
            { letter: 'R', spoken: 'R sesini patlat' },
            { letter: 'I', spoken: 'I harfini patlat' },
            { letter: 'M', spoken: 'M sesini patlat' }
          ];
          const allLetters = ['A', 'N', 'E', 'T', 'İ', 'L', 'O', 'K', 'U', 'R', 'I', 'M'];
          const chosen = letterPool[Math.floor(Math.random() * letterPool.length)];
          const distractors = allLetters.filter(l => l !== chosen.letter).sort(() => 0.5 - Math.random()).slice(0, 3);
          const colorClasses = ['balloon-color-red', 'balloon-color-blue', 'balloon-color-green', 'balloon-color-yellow', 'balloon-color-purple'];

          const balloons = [
            { text: chosen.letter, isTarget: true },
            ...distractors.map(d => ({ text: d, isTarget: false }))
          ].sort(() => 0.5 - Math.random()).map((b, i) => ({ ...b, colorClass: colorClasses[i % colorClasses.length] }));

          return {
            type: 'balloon',
            question: `🎈 "${chosen.letter}" harfi olan balonu patlat!`,
            spokenText: chosen.spoken,
            correct: chosen.letter,
            explanation: `Tebrikler! "${chosen.letter}" harfini doğru buldun ve balonu patlattın! 🎈👏`,
            interactiveData: { balloons }
          };
        } else if (subMode === 1) {
          // İçinde O Ses Geçen Görsel
          const soundQuestions = [
            { sound: 'E', prompt: 'İçinde "E" sesi olan balonu patlat! 🍎', spoken: 'İçinde E sesi olan balonu patlat', target: '🍎 Elma', d: ['🚗 Araba', '🐟 Balık', '🦁 Aslan'] },
            { sound: 'A', prompt: 'İçinde "A" sesi olan balonu patlat! 🚗', spoken: 'İçinde A sesi olan balonu patlat', target: '🚗 Araba', d: ['🥛 Süt', '🐶 Köpek', '🍋 Limon'] },
            { sound: 'K', prompt: 'İçinde "K" sesi olan balonu patlat! 🐱', spoken: 'İçinde K sesi olan balonu patlat', target: '🐱 Kedi', d: ['🦁 Aslan', '🐦 Kuş', '🐘 Fil'] },
            { sound: 'S', prompt: 'İçinde "S" sesi olan balonu patlat! 🥛', spoken: 'İçinde S sesi olan balonu patlat', target: '🥛 Süt', d: ['🍎 Elma', '🍇 Üzüm', '🍊 Portakal'] },
            { sound: 'M', prompt: 'İçinde "M" sesi olan balonu patlat! 🍌', spoken: 'İçinde M sesi olan balonu patlat', target: '🍌 Muz', d: ['🥕 Havuç', '🐟 Balık', '🚗 Araba'] }
          ];
          const chosen = soundQuestions[Math.floor(Math.random() * soundQuestions.length)];
          const colorClasses = ['balloon-color-blue', 'balloon-color-orange', 'balloon-color-green', 'balloon-color-pink'];
          const balloons = [
            { text: chosen.target, isTarget: true },
            ...chosen.d.map(item => ({ text: item, isTarget: false }))
          ].sort(() => 0.5 - Math.random()).map((b, i) => ({ ...b, colorClass: colorClasses[i % colorClasses.length] }));

          return {
            type: 'balloon',
            question: `🎈 ${chosen.prompt}`,
            spokenText: chosen.spoken,
            correct: chosen.target,
            explanation: `Harika! ${chosen.target} sözcüğünde "${chosen.sound}" sesi vardır! 🎈⭐`,
            interactiveData: { balloons }
          };
        } else {
          // Hece Balonları
          const syllableItems = [
            { target: 'EL', d: ['LE', 'AL', 'LA'], spoken: 'EL hecesini patlat' },
            { target: 'AL', d: ['LA', 'EL', 'OL'], spoken: 'AL hecesini patlat' },
            { target: 'AT', d: ['TA', 'ET', 'OT'], spoken: 'AT hecesini patlat' },
            { target: 'AN', d: ['NA', 'EN', 'ON'], spoken: 'AN hecesini patlat' },
            { target: 'ET', d: ['TE', 'AT', 'İT'], spoken: 'ET hecesini patlat' },
            { target: 'LA', d: ['AL', 'LE', 'LI'], spoken: 'LA hecesini patlat' }
          ];
          const chosen = syllableItems[Math.floor(Math.random() * syllableItems.length)];
          const colorClasses = ['balloon-color-purple', 'balloon-color-yellow', 'balloon-color-red', 'balloon-color-green'];
          const balloons = [
            { text: chosen.target, isTarget: true },
            ...chosen.d.map(item => ({ text: item, isTarget: false }))
          ].sort(() => 0.5 - Math.random()).map((b, i) => ({ ...b, colorClass: colorClasses[i % colorClasses.length] }));

          return {
            type: 'balloon',
            question: `🎈 "${chosen.target}" hecesi olan balonu patlat!`,
            spokenText: chosen.spoken,
            correct: chosen.target,
            explanation: `Süpersin! "${chosen.target}" hecesini jet hızında patlattın! 🎈💥`,
            interactiveData: { balloons }
          };
        }
      }
    },

    // 2) 🧩 GÖRSEL & GÖLGE EŞLEŞTİRME MOTORU (SHADOW MATCH)
    generateShadowMatchQuestion(grade) {
      const pool = [
        { name: 'Aslan', emoji: '🦁' },
        { name: 'Koca Fil', emoji: '🐘' },
        { name: 'Zıp Tavşan', emoji: '🐰' },
        { name: 'Sevimli Kedi', emoji: '🐱' },
        { name: 'Sadık Köpek', emoji: '🐶' },
        { name: 'Kırmızı Araba', emoji: '🚗' },
        { name: 'Hızlı Uçak', emoji: '✈️' },
        { name: 'Tatlı Elma', emoji: '🍎' },
        { name: 'Rengarenk Kelebek', emoji: '🦋' },
        { name: 'Yüzen Balık', emoji: '🐟' }
      ];
      const target = pool[Math.floor(Math.random() * pool.length)];
      const distractors = pool.filter(p => p.name !== target.name).sort(() => 0.5 - Math.random()).slice(0, 2);

      const cards = [
        { name: target.name, emoji: target.emoji, isTarget: true },
        ...distractors.map(d => ({ name: d.name, emoji: d.emoji, isTarget: false }))
      ].sort(() => 0.5 - Math.random());

      const targetImg = EMOJI_TO_3D[target.emoji]
        ? `<img src="${EMOJI_TO_3D[target.emoji]}" class="q-3d-fruit" alt="${target.name}">`
        : `<span style="font-size:3.5rem;">${target.emoji}</span>`;

      return {
        type: 'shadow_match',
        question: `Bu sevimli dostumuzun GÖLGESİNİ bul!`,
        questionHtml: `
          <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
            <div>${targetImg}</div>
            <div style="font-size:1.35rem; font-weight:900;">${target.name} dostumuzun GÖLGESİ hangisidir?</div>
          </div>
        `,
        spokenText: `${target.name} dostumuzun gölgesini bul.`,
        correct: target.name,
        explanation: `Harika gözlem! ${target.name} dostumuzun gölgesini doğru buldun! ${target.emoji}👏`,
        interactiveData: { target, cards }
      };
    },

    // 2.5) 🔤 TÜRKİYE YÜZYILI MAARİF MODELİ (2026) SES VE İLK OKUMA OYUNLARI
    generateMaarifQuestion(gameType, letter) {
      const activeL = (letter || 'a').toLowerCase();
      const data = MAARIF_2026_CONFIG.letters[activeL] || MAARIF_2026_CONFIG.letters['a'];
      const upper = data.upper;
      const lower = data.letter;
      const soundPhonetic = getMaarifLetterSoundName(activeL);
      const learned = getLearnedLettersUpTo(activeL);
      const learnedWords = getAllCumulativeWordsUpTo(activeL);
      const learnedSentences = getAllCumulativeSentencesUpTo(activeL);

      if (gameType === 'maarif_sound_find') {
        // 1) Sesi Hisset ve Bul (Görsel & İşitsel Algı)
        const subMode = Math.random() < 0.5 ? 'which_has' : 'has_or_not';
        if (subMode === 'which_has' && data.soundWords && data.soundWords.length > 0) {
          const target = data.soundWords[Math.floor(Math.random() * data.soundWords.length)];
          const distractors = data.noSoundWords.slice().sort(() => 0.5 - Math.random()).slice(0, 2);
          const correctChoice = `${target.word} ${target.emoji}`;
          const options = [
            correctChoice,
            ...distractors.map(d => `${d.word} ${d.emoji}`)
          ].sort(() => 0.5 - Math.random());

          return {
            question: `Hangisinin adında <strong>"${upper}"</strong> sesi vardır?`,
            spokenText: `Hangisinin adında ${soundPhonetic} sesi vardır?`,
            options,
            correct: correctChoice,
            explanation: `Tebrikler! "${target.word}" sözcüğünde "${upper}" sesi vardır! ${target.emoji}👏`
          };
        } else {
          // Evet / Hayır
          const isYes = Math.random() < 0.5;
          const pool = isYes ? data.soundWords : data.noSoundWords;
          const item = (pool && pool.length) ? pool[Math.floor(Math.random() * pool.length)] : { word: 'Elma', emoji: '🍎', hasSound: false };
          const correctChoice = isYes ? '✅ Evet, Var' : '❌ Hayır, Yok';

          return {
            question: `"${item.word} ${item.emoji}" görselinin adında <strong>"${upper}"</strong> sesi var mı?`,
            spokenText: `"${item.word}" adında ${soundPhonetic} sesi var mı?`,
            options: ['✅ Evet, Var', '❌ Hayır, Yok'],
            correct: correctChoice,
            explanation: isYes
              ? `Tebrikler! "${item.word}" sözcüğünde "${upper}" sesi bulunur! ${item.emoji}👏`
              : `Tebrikler! "${item.word}" sözcüğünde "${upper}" sesi yoktur! ${item.emoji}👏`
          };
        }
      } else if (gameType === 'maarif_position') {
        // 2) Başta mı, Ortada mı, Sonda mı?
        const pool = (data.soundWords && data.soundWords.length) ? data.soundWords : [{ word: 'Tavşan', emoji: '🐰', position: 'başta' }];
        const item = pool[Math.floor(Math.random() * pool.length)];
        const posMap = {
          'başta': '🟢 Başta',
          'ortada': '🟡 Ortada',
          'sonda': '🔴 Sonda'
        };
        const correctChoice = posMap[item.position] || '🟢 Başta';

        return {
          question: `"${item.word} ${item.emoji}" sözcüğünde <strong>"${upper}"</strong> sesi neresindedir?`,
          spokenText: `"${item.word}" sözcüğünde ${soundPhonetic} sesi neresindedir?`,
          options: ['🟢 Başta', '🟡 Ortada', '🔴 Sonda'],
          correct: correctChoice,
          explanation: `Tebrikler! "${item.word}" sözcüğünde "${upper}" sesi ${item.position} yer alır! ${item.emoji}👏`
        };
      } else if (gameType === 'maarif_case_match') {
        // 3) Büyük-Küçük Harf Eşleştirme & Avı
        const mode = Math.random() < 0.5 ? 'find_lower' : 'find_upper';
        const otherLetters = MAARIF_2026_CONFIG.letterOrder.filter(l => l !== lower);
        const dists = otherLetters.slice().sort(() => 0.5 - Math.random()).slice(0, 2);

        if (mode === 'find_lower') {
          const options = [lower, ...dists].sort(() => 0.5 - Math.random());
          return {
            question: `Büyük <strong>"${upper}"</strong> harfinin küçük yazılışı hangisidir?`,
            spokenText: `Büyük ${soundPhonetic} harfinin küçük yazılışı hangisidir?`,
            options,
            correct: lower,
            explanation: `Tebrikler! "${upper}" büyük harfinin küçüğü "${lower}" harfidir! 🔤👏`
          };
        } else {
          const upperDists = dists.map(l => l.toUpperCase('tr-TR'));
          const options = [upper, ...upperDists].sort(() => 0.5 - Math.random());
          return {
            question: `Küçük <strong>"${lower}"</strong> harfinin büyük yazılışı hangisidir?`,
            spokenText: `Küçük ${soundPhonetic} harfinin büyük yazılışı hangisidir?`,
            options,
            correct: upper,
            explanation: `Tebrikler! "${lower}" küçük harfinin büyüğü "${upper}" harfidir! 🔤👏`
          };
        }
      } else if (gameType === 'maarif_syllable_build') {
        // 4) Hece ve Kelime İnşası (Kümülatif Birleştirme)
        if (!learnedWords || !learnedWords.length) {
          // 'a' harfinde hece birleştirme olamaz, harf eşleştirmeye güvenli yönlendir
          return this.generateMaarifQuestion('maarif_case_match', activeL);
        }
        const chosen = learnedWords[Math.floor(Math.random() * learnedWords.length)];
        const allCubes = [
          ...chosen.parts.map(p => ({ text: p, isRequired: true })),
          ...(chosen.distractors || []).map(d => ({ text: d, isRequired: false }))
        ].sort(() => 0.5 - Math.random());

        const iconImg = EMOJI_TO_3D[chosen.icon]
          ? `<img src="${EMOJI_TO_3D[chosen.icon]}" class="q-3d-fruit" alt="${chosen.word}">`
          : `<span style="font-size:3rem;">${chosen.icon || '🔤'}</span>`;

        return {
          type: 'syllable_builder',
          question: `Küp parçalarına sırayla dokunarak "${chosen.word}" kelimesini oluştur!`,
          questionHtml: `
            <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
              <div>${iconImg}</div>
              <div style="font-size:1.35rem; font-weight:900;">Küp parçalarına dokunarak <strong>"${chosen.word}"</strong> kelimesini oluştur:</div>
            </div>
          `,
          spokenText: `${chosen.word.toLowerCase('tr-TR')} kelimesini oluştur.`,
          correct: chosen.word,
          explanation: `Tebrikler! Parçaları birleştirip "${chosen.word}" kelimesini tamamladın ve okudun! 🧱👏`,
          interactiveData: {
            word: chosen.word,
            parts: chosen.parts,
            icon: chosen.icon || '🔤',
            cubes: allCubes
          }
        };
      } else if (gameType === 'maarif_speed_read') {
        // 5) Hızlı Okuma ve Kelime Yakalama (Ritimli Okuma)
        if (!learnedWords || !learnedWords.length) {
          return this.generateMaarifQuestion('maarif_sound_find', activeL);
        }
        const targetWordObj = learnedWords[Math.floor(Math.random() * learnedWords.length)];
        const targetWord = targetWordObj.word;
        const targetWordLower = targetWord.toLowerCase('tr-TR');
        const otherWords = learnedWords.filter(w => w.word !== targetWord).map(w => w.word);
        let dists = otherWords.slice().sort(() => 0.5 - Math.random()).slice(0, 2);
        if (dists.length < 2) {
          const fallbackLetters = learned.filter(w => w !== targetWord);
          dists = fallbackLetters.slice(0, 2);
        }
        const options = [targetWord, ...dists].sort(() => 0.5 - Math.random());

        return {
          question: `Duyduğun kelimeyi yakala!`,
          questionHtml: `
            <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
              <span style="font-size:2.4rem;">🔊👂</span>
              <div style="font-size:1.3rem; font-weight:900;">Duyduğun kelimeyi yakala:</div>
              <button type="button" class="btn-sound-replay" onclick="window.derseBiMolaSpeakText && window.derseBiMolaSpeakText('${targetWordLower}!')" style="background:rgba(6,182,212,0.25); border:1.5px solid #22D3EE; color:#fff; border-radius:20px; padding:4px 14px; font-weight:800; cursor:pointer;">🔁 Tekrar Dinle</button>
            </div>
          `,
          spokenText: `Duyduğun kelimeyi yakala: ${targetWordLower}!`,
          options,
          correct: targetWord,
          explanation: `Tebrikler! Doğru okunan kelime: "${targetWord}"! ⭐👏`
        };
      } else if (gameType === 'maarif_sentence_complete') {
        // 6) Cümle Tamamlama
        if (!learnedSentences || !learnedSentences.length) {
          return this.generateMaarifQuestion('maarif_sound_find', activeL);
        }
        const item = learnedSentences[Math.floor(Math.random() * learnedSentences.length)];

        return {
          question: `Cümledeki boşluğu tamamla: <strong>"${item.blankSentence}"</strong>`,
          spokenText: `Cümledeki eksik kelimeyi bul.`,
          options: item.options.slice().sort(() => 0.5 - Math.random()),
          correct: item.missing,
          explanation: `Tebrikler! Cümlemiz: "${item.fullText}" oldu! 📖👏`
        };
      }
    },

    // 3) 🔤 HECE VE KELİME İNŞAATI MOTORU (DOKUN & BİRLEŞTİR)
    generateSyllableBuilderQuestion() {
      const items = [
        { word: 'EL', parts: ['E', 'L'], distractors: ['A'], icon: '✋' },
        { word: 'AL', parts: ['A', 'L'], distractors: ['E'], icon: '🔴' },
        { word: 'AT', parts: ['A', 'T'], distractors: ['İ'], icon: '🐴' },
        { word: 'ET', parts: ['E', 'T'], distractors: ['L'], icon: '🥩' },
        { word: 'ANA', parts: ['A', 'NA'], distractors: ['LA'], icon: '👩' },
        { word: 'ALA', parts: ['A', 'LA'], distractors: ['NA'], icon: '🎨' },
        { word: 'ALİ', parts: ['A', 'Lİ'], distractors: ['Tİ'], icon: '👦' },
        { word: 'ANNE', parts: ['AN', 'NE'], distractors: ['TE'], icon: '❤️' },
        { word: 'ELMA', parts: ['EL', 'MA'], distractors: ['LE'], icon: '🍎' },
        { word: 'NANE', parts: ['NA', 'NE'], distractors: ['LA'], icon: '🌿' },
        { word: 'KALE', parts: ['KA', 'LE'], distractors: ['EL'], icon: '🏰' },
        { word: 'KEDİ', parts: ['KE', 'Dİ'], distractors: ['Lİ'], icon: '🐱' },
        { word: 'OKUL', parts: ['O', 'KUL'], distractors: ['KOL'], icon: '🏫' },
        { word: 'KİTAP', parts: ['Kİ', 'TAP'], distractors: ['KAP'], icon: '📚' },
        { word: 'SÜT', parts: ['S', 'Ü', 'T'], distractors: ['M'], icon: '🥛' },
        { word: 'LİMON', parts: ['Lİ', 'MON'], distractors: ['MAN'], icon: '🍋' },
        { word: 'BALIK', parts: ['BA', 'LIK'], distractors: ['LAK'], icon: '🐟' },
        { word: 'KALEM', parts: ['KA', 'LEM'], distractors: ['LİM'], icon: '✏️' }
      ];

      const chosen = items[Math.floor(Math.random() * items.length)];
      const allCubes = [
        ...chosen.parts.map(p => ({ text: p, isRequired: true })),
        ...chosen.distractors.map(d => ({ text: d, isRequired: false }))
      ].sort(() => 0.5 - Math.random());

      const iconImg = EMOJI_TO_3D[chosen.icon]
        ? `<img src="${EMOJI_TO_3D[chosen.icon]}" class="q-3d-fruit" alt="${chosen.word}">`
        : `<span style="font-size:3rem;">${chosen.icon}</span>`;

      return {
        type: 'syllable_builder',
        question: `Küp parçalarına sırayla dokunarak "${chosen.word}" kelimesini oluştur!`,
        questionHtml: `
          <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
            <div>${iconImg}</div>
            <div style="font-size:1.35rem; font-weight:900;">Küp parçalarına dokunarak <strong>"${chosen.word}"</strong> kelimesini oluştur:</div>
          </div>
        `,
        spokenText: `${chosen.word.toLowerCase('tr-TR')} kelimesini oluştur.`,
        correct: chosen.word,
        explanation: `Muhteşem! Parçaları birleştirip "${chosen.word}" kelimesini tamamladın ve okudun! ${chosen.icon}👏`,
        interactiveData: {
          word: chosen.word,
          parts: chosen.parts,
          icon: chosen.icon,
          cubes: allCubes
        }
      };
    },

    // 4) 🔢 KAÇ TANE VAR? (DOKUNARAK SAYMA MOTORU)
    generateCountTapQuestion() {
      const items = [
        { name: 'Kırmızı Elma', emoji: '🍎' },
        { name: 'Sevimli Tavşan', emoji: '🐰' },
        { name: 'Parlak Yıldız', emoji: '⭐' },
        { name: 'Miyavlayan Kedi', emoji: '🐱' },
        { name: 'Renkli Balon', emoji: '🎈' },
        { name: 'Hızlı Araba', emoji: '🚗' },
        { name: 'Tatlı Çilek', emoji: '🍓' }
      ];
      const item = items[Math.floor(Math.random() * items.length)];
      const count = Math.floor(Math.random() * 5) + 1; // 1..5

      return {
        type: 'count_tap',
        question: `Ekranda kaç tane ${item.name} var? Dokunarak say! ${item.emoji}`,
        spokenText: `Kaç tane ${item.name} var? Dokunarak say.`,
        correct: count.toString(),
        explanation: `Tebrikler! Birlikte saydık: Tam ${count} tane ${item.name} var! ${item.emoji}👏`,
        interactiveData: { count, item }
      };
    },

    // 5) ⭐ HIZLI KELİME YAKALA (WORD CATCH)
    generateWordCatchQuestion() {
      const pool = [
        { visual: '🍎', name: 'Elma', q: 'Bu lezzetli meyvenin İLK HARFİ hangisidir? 🍎', spokenText: 'Bu lezzetli meyvenin ilk harfi hangisidir?', a: 'E', d: ['A', 'M'], exp: 'Elma "E" harfi ile başlar! 🍎' },
        { visual: '🐴', name: 'At', q: 'Bu rüzgar gibi koşan dostumuzun adı nedir? 🐴', spokenText: 'Bu rüzgar gibi koşan dostumuzun adı nedir?', a: 'AT', d: ['OT', 'ET'], exp: 'Rüzgar gibi koşan dostumuz AT! 🐴' },
        { visual: '🥛', name: 'Süt', q: 'Bembeyaz sağlıklı içeceğin İLK SESİ nedir? 🥛', spokenText: 'Bembeyaz sağlıklı içeceğin ilk sesi nedir?', a: 'S', d: ['K', 'B'], exp: 'Süt "S" sesiyle başlar: S-ü-t! 🥛' },
        { visual: '🍋', name: 'Limon', q: 'Sarı ekşi meyvenin İLK SESİ nedir? 🍋', spokenText: 'Sarı ekşi meyvenin ilk sesi nedir?', a: 'L', d: ['N', 'T'], exp: 'Limon "L" sesiyle başlar: L-i-m-o-n! 🍋' },
        { visual: '🐱', name: 'Kedi', q: 'Miyav diyen sevimli dostumuzun adı nedir? 🐱', spokenText: 'Miyav diyen sevimli dostumuzun adı nedir?', a: 'KEDİ', d: ['KÖPEK', 'KUŞ'], exp: 'Miyav diyen dostumuz KEDİ! 🐱' },
        { visual: '🚗', name: 'Araba', q: 'Düt düt diye korna çalan taşıtın İLK SESİ nedir? 🚗', spokenText: 'Düt düt diye korna çalan taşıtın ilk sesi nedir?', a: 'A', d: ['O', 'E'], exp: 'Araba "A" harfiyle başlar: A-r-a-b-a! 🚗' },
        { visual: '🐟', name: 'Balık', q: 'Mavi sularda yüzen sevimli canlının İLK HARFİ nedir? 🐟', spokenText: 'Mavi sularda yüzen sevimli canlının ilk harfi nedir?', a: 'B', d: ['D', 'P'], exp: 'Balık "B" harfiyle başlar: B-a-l-ı-k! 🐟' },
        { visual: '☀️', name: 'Güneş', q: 'Dünyamızı ısıtan sıcacık dostumuzun İLK SESİ nedir? ☀️', spokenText: 'Dünyamızı ısıtan sıcacık dostumuzun ilk sesi nedir?', a: 'G', d: ['S', 'M'], exp: 'Güneş "G" harfiyle başlar! ☀️' }
      ];

      const item = pool[Math.floor(Math.random() * pool.length)];
      const options = [
        { text: item.a, isTarget: true },
        { text: item.d[0], isTarget: false },
        { text: item.d[1], isTarget: false }
      ].sort(() => 0.5 - Math.random());

      const visualImg = EMOJI_TO_3D[item.visual]
        ? `<img src="${EMOJI_TO_3D[item.visual]}" class="q-3d-fruit" alt="${item.name}">`
        : `<span style="font-size:3rem;">${item.visual}</span>`;

      return {
        type: 'word_catch',
        question: item.q,
        questionHtml: `
          <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
            <div>${visualImg}</div>
            <div style="font-size:1.35rem; font-weight:900;">${item.q}</div>
          </div>
        `,
        spokenText: item.spokenText || item.q,
        correct: item.a,
        explanation: item.exp,
        interactiveData: { options }
      };
    },

    // -------------------------------------------------------------
    // ANASINIFI (OKUL ÖNCESİ - 4-6 YAŞ) ETKİNLİK HAVUZU
    // -------------------------------------------------------------
    generateKindergartenMath() {
      const mode = Math.floor(Math.random() * 2);
      if (mode === 0) {
        // Sevimli Nesne / Meyve Sayma (1 - 5 arası dev 3D simgeler)
        const fruits = [
          { emoji: '🍎', name: 'Kırmızı Elma', audioKey: 'q_sayma_elma' },
          { emoji: '🍌', name: 'Sarı Muz', audioKey: 'q_sayma_muz' },
          { emoji: '🍓', name: 'Tatlı Çilek', audioKey: 'q_sayma_cilek' },
          { emoji: '🍊', name: 'Turuncu Portakal', audioKey: 'q_sayma_portakal' },
          { emoji: '⭐', name: 'Parlak Yıldız', audioKey: 'q_sayma_yildiz' },
          { emoji: '🎈', name: 'Renkli Balon', audioKey: 'q_sayma_balon' },
          { emoji: '🚗', name: 'Sevimli Araba', audioKey: 'q_sayma_araba' }
        ];
        const chosen = fruits[Math.floor(Math.random() * fruits.length)];
        const count = Math.floor(Math.random() * 5) + 1; // 1..5
        const display = Array(count).fill(chosen.emoji).join('  ');
        
        const d1 = count === 5 ? '4' : (count + 1).toString();
        const d2 = count === 1 ? '3' : (count - 1).toString();

        const fruitImg = EMOJI_TO_3D[chosen.emoji] 
          ? `<img src="${EMOJI_TO_3D[chosen.emoji]}" class="q-3d-fruit" alt="${chosen.name}">` 
          : chosen.emoji;
        const displayHtml = `
          <div class="q-fruit-row">
            ${Array(count).fill(fruitImg).join('')}
          </div>
          <div style="font-size:1.25rem; font-weight:900; margin-top:8px;">Kaç tane ${chosen.name} var?</div>
        `;

        return {
          question: `${display}\n\nKaç tane ${chosen.name} var?`,
          questionHtml: displayHtml,
          correct: `${count} Tane (${chosen.emoji})`,
          distractors: [
            `${d1} Tane (${chosen.emoji})`,
            `${d2} Tane (${chosen.emoji})`
          ],
          explanation: `Birlikte sayalım: Tam ${count} tane ${chosen.name} var! Harikasın! 👏`,
          audioKey: chosen.audioKey
        };
      } else {
        // Renkler ve Şekiller
        const shapes = [
          { q: 'Hangisi KIRMIZI renktir? 🔴', correct: '🔴 Kırmızı Daire', d: ['🔵 Mavi Daire', '🟡 Sarı Daire'], exp: 'Kırmızı, elma ve çileğin rengidir! 🍎', audioKey: 'q_renk_kirmizi' },
          { q: 'Hangisi SARI renktir? 🟡', correct: '🟡 Sarı Daire', d: ['🟢 Yeşil Daire', '🟣 Mor Daire'], exp: 'Sarı, parlayan Güneş\'in ve muzun rengidir! ☀️', audioKey: 'q_renk_sari' },
          { q: 'Hangisi MAVİ renktir? 🔵', correct: '🔵 Mavi Daire', d: ['🟠 Turuncu Daire', '🔴 Kırmızı Daire'], exp: 'Mavi, gökyüzünün ve denizlerin rengidir! 🌊', audioKey: 'q_renk_mavi' },
          { q: 'Hangisi YEŞİL renktir? 🟢', correct: '🟢 Yeşil Daire', d: ['🔴 Kırmızı Daire', '🟡 Sarı Daire'], exp: 'Yeşil, ağaç yapraklarının ve çimenlerin rengidir! 🌿', audioKey: 'q_renk_yesil' },
          { q: 'Hangisi parlayan YILDIZ şeklidir? ⭐', correct: '⭐ Sarı Yıldız', d: ['🔺 Mavi Üçgen', '⬛ Siyah Kare'], exp: 'Gökyüzünde parlayan yıldız tam olarak böyledir! ⭐', audioKey: 'q_sekil_yildiz' },
          { q: 'Hangisi SEVGİ DOLU KALP şeklidir? 💖', correct: '💖 Pembe Kalp', d: ['🟢 Yeşil Daire', '🔺 Turuncu Üçgen'], exp: 'Kalp sevginin ve kucaklaşmanın sembolüdür! 💖', audioKey: 'q_sekil_kalp' },
          { q: 'Hangisi ÜÇGEN şeklidir? (3 köşesi var)', correct: '🔺 Üçgen', d: ['⚪ Daire', '🟩 Kare'], exp: 'Üçgenin tam 3 köşesi vardır! 🔺', audioKey: 'q_sekil_ucgen' },
          { q: 'Hangisi yuvarlak DAİRE şeklidir? ⭕', correct: '⭕ Daire', d: ['🟩 Kare', '🔺 Üçgen'], exp: 'Daire tıpkı bir top gibi yuvarlaktır! ⚽', audioKey: 'q_sekil_daire' }
        ];
        const s = shapes[Math.floor(Math.random() * shapes.length)];
        return {
          question: s.q,
          correct: s.correct,
          distractors: s.d,
          explanation: s.exp,
          audioKey: s.audioKey
        };
      }
    },

    grade0AnimalsAndNaturePool: [
      { q: 'Hangi sevimli hayvan "MİYAV" der? 🐾', a: '🐱 Kedi', d: ['🐶 Köpek', '🐮 İnek'], exp: 'Kediler sevilmeyi çok sever ve "Miyav" derler! 🐱', audioKey: 'q_kedi' },
      { q: 'Hangi sadık dostumuz "HAV HAV" der? 🦴', a: '🐶 Köpek', d: ['🐱 Kedi', '🐥 Civciv'], exp: 'Köpekler kuyruklarını sallayarak "Hav hav" derler! 🐶', audioKey: 'q_kopek' },
      { q: 'Ormanların kralı olan yeleli güçlü hayvan hangisidir?', a: '🦁 Aslan', d: ['🐵 Maymun', '🐰 Tavşan'], exp: 'Aslan güçlü kükremesiyle ormanların kralıdır! 🦁', audioKey: 'q_aslan' },
      { q: 'Havuç yemeyi çok seven, uzun kulaklı zıp zıp hayvan hangisidir? 🥕', a: '🐰 Tavşan', d: ['🐻 Ayı', '🐸 Kurbağa'], exp: 'Tavşanlar zıp zıp zıplar ve çıtır çıtır havuç yer! 🐰', audioKey: 'q_tavsan' },
      { q: 'Mavi denizlerde yüzgeçleriyle yüzen sevimli canlı hangisidir? 🌊', a: '🐟 Balık', d: ['🐦 Kuş', '🐱 Kedi'], exp: 'Balıklar suda yüzer ve solungaçlarıyla nefes alır! 🐟', audioKey: 'q_balik' },
      { q: 'Gökyüzünde kanat çırparak uçan ve "Cik cik" öten hangisidir? 🌳', a: '🐦 Kuş', d: ['🐢 Kaplumbağa', '🐶 Köpek'], exp: 'Kuşlar kanatlarını açıp gökyüzünde süzülür! 🐦', audioKey: 'q_kus' },
      { q: 'Hangisi ÇOK DAHA BÜYÜKTÜR ve kocaman bir hortumu vardır?', a: '🐘 Koca Fil', d: ['🐭 Küçük Fare', '🐜 Minik Karınca'], exp: 'Fil dünyanın en büyük ve en güçlü kara hayvanıdır! 🐘', audioKey: 'q_fil' },
      { q: 'Gündüzleri gökyüzümüzü aydınlatan ve ısıtan sıcacık dostumuz hangisidir?', a: '☀️ Parlak Güneş', d: ['🌙 Gece Ayı', '🌧️ Yağmur Bulutu'], exp: 'Güneş her sabah doğar ve dünyamızı ısıtır! ☀️', audioKey: 'q_gunes' },
      { q: 'Bize lezzetli ve sağlıklı taze süt veren sevimli hayvan hangisidir? 🥛', a: '🐮 İnek', d: ['🦁 Aslan', '🐺 Kurt'], exp: 'İnekler "Mööö" der ve bize bembeyaz süt verir! 🥛', audioKey: 'q_inek' },
      { q: 'Hangisi tatlı, kırmızı ve çok lezzetli bir yaz meyvesidir?', a: '🍓 Çilek', d: ['🥕 Havuç', '🍌 Muz'], exp: 'Çilek minik noktalı, kırmızı çok tatlı bir meyvedir! 🍓', audioKey: 'q_cilek' },
      { q: 'Derelerde "VAK VAK" diyerek neşeyle zıplayan yeşil dostumuz hangisidir?', a: '🐸 Kurbağa', d: ['🦊 Tilki', '🐴 At'], exp: 'Kurbağalar nilüfer yapraklarının üstünde zıplar! 🐸', audioKey: 'q_kurbaga' }
    ],

    // -------------------------------------------------------------
    // 1. SINIF: 2026 TÜRKİYE YÜZYILI MAARİF MODELİ SORU HAVUZLARI VE MOTORLARI
    // (Hayat Bilgisi 5 Tema, Matematik 5 Konu <= 20, Türkçe 3 Konu + TTS Sesli Okuma)
    // -------------------------------------------------------------

    // --- 1. DERS: HAYAT BİLGİSİ (2026 Maarif Modeli 5 Tema) ---

    // Tema 1: Ben ve Okulum (22 Özgün Soru)
    grade1LifeScienceSchoolPool: [
      { q: 'Sınıfta öğretmenimizden veya arkadaşımızdan söz isterken ne yaparız? ✋', spokenText: 'Sınıfta söz hakkı almak için ne yaparız?', a: 'Parmak kaldırırız ✋', d: ['Bağırarak konuşuruz 🗣️', 'Ayağa kalkıp gezeriz 🚶‍♂️'], exp: 'Söz hakkı almak için nezaketle parmak kaldırırız.' },
      { q: 'Arkadaşımız bize boya kalemini ödünç verdiğinde hangi nezaket sözünü söyleriz? 🤝', spokenText: 'Arkadaşımız bize kalem verdiğinde ne deriz?', a: 'Teşekkür ederim 🙏', d: ['Özür dilerim 🥺', 'Güle güle 👋'], exp: 'Bize iyilik yapan veya yardım eden birine "Teşekkür ederim" deriz.' },
      { q: 'İstemeden bir arkadaşımıza çarptığımızda hangi sihirli sözü söylemeliyiz? 🥺', spokenText: 'İstemeden arkadaşımıza çarptığımızda ne söyleriz?', a: 'Özür dilerim 🤝', d: ['Teşekkür ederim 🙏', 'Rica ederim 😊'], exp: 'Hata yaptığımızda veya birine çarptığımızda "Özür dilerim" deriz.' },
      { q: 'Birinden silgisini ödünç isterken cümlemize hangi nazik kelimeyle başlarız? ✨', spokenText: 'Birinden silgi isterken hangi nazik kelimeyi kullanırız?', a: 'Lütfen ✨', d: ['Hemen ver 😠', 'Bana borçlusun!'], exp: 'Bir şey rica ederken daima "Lütfen" kelimesini kullanırız.' },
      { q: 'Sabah okula geldiğimizde öğretmenimize ve arkadaşlarımıza nasıl selam veririz? ☀️', spokenText: 'Sabah okula geldiğimizde nasıl selam veririz?', a: 'Günaydın! ☀️', d: ['İyi geceler! 🌙', 'Güle güle! 👋'], exp: 'Sabah karşılaştığımız kişilere "Günaydın" diyerek selam veririz.' },
      { q: 'Akşam okuldan ayrılırken öğretmenimize ve arkadaşlarımıza ne deriz? 👋', spokenText: 'Okuldan ayrılırken ne deriz?', a: 'İyi günler, hoşça kalın! 👋', d: ['Günaydın! ☀️', 'Tünaydın! 🌤️'], exp: 'Ayrılırken "İyi günler" veya "Hoşça kalın" diyerek vedalaşırız.' },
      { q: 'Okul koridorlarında ve merdivenlerde nasıl yürümeliyiz? 🚶‍♂️', spokenText: 'Okul koridorlarında ve merdivenlerde nasıl yürümeliyiz?', a: 'Sakin ve sağdan yürümeliyiz 🚶‍♂️', d: ['Hızla koşarak yarışmalıyız 🏃‍♂️', 'Merdiven korkuluğundan kaymalıyız 🎢'], exp: 'Kazaları önlemek için koridor ve merdivenlerde sağdan ve yavaş yürürüz.' },
      { q: 'Okul kütüphanesinde kitap okurken nasıl davranmalıyız? 📚', spokenText: 'Okul kütüphanesinde nasıl davranmalıyız?', a: 'Sessiz olmalı ve kitapları korumalıyız 🤫', d: ['Yüksek sesle şarkı söylemeliyiz 🎶', 'Top oynamalıyız ⚽'], exp: 'Kütüphanede herkesin ders çalışabilmesi için sessizlik kuralına uyarız.' },
      { q: 'Okulumuzun idari işlerini yöneten ve okulu idare eden kişi kimdir? 🏫', spokenText: 'Okulumuzun yöneticisi kimdir?', a: 'Okul Müdürü 👔', d: ['Bahçıvan 🌻', 'Şoför 🚌'], exp: 'Okulun yönetiminden okul müdürü sorumludur.' },
      { q: 'Bize okuma yazma, sayılar ve güzel davranışlar öğreten kişi kimdir? 👨‍🏫', spokenText: 'Bize okuma yazma ve güzel bilgiler öğreten kimdir?', a: 'Öğretmenimiz 👨‍🏫', d: ['Doktor 🩺', 'Aşçı 🍳'], exp: 'Sınıfta bize rehberlik eden ve öğreten kişi öğretmenimizdir.' },
      { q: 'Ders zili çaldığında ne yapmalıyız? 🔔', spokenText: 'Ders zili çaldığında ne yapmalıyız?', a: 'Hemen sınıfımıza girip sıramıza oturmalıyız 📚', d: ['Bahçede oyun oynamaya devam etmeliyiz ⚽', 'Okul dışına çıkmalıyız 🚪'], exp: 'Zil çalınca derse zamanında başlamak için sınıfımıza geçeriz.' },
      { q: 'Çöplerimizi nereye atmalıyız? 🗑️', spokenText: 'Çöplerimizi nereye atmalıyız?', a: 'Çöp kutusuna 🗑️', d: ['Sıramızın altına 📦', 'Pencereden bahçeye 🌳'], exp: 'Çöpler daima çöp kutusuna atılır, sınıfımız temiz tutulur.' },
      { q: 'Arkadaşımızın sınavdan yüksek not aldığını görünce hangi duyguyu hissederiz? 😊', spokenText: 'Arkadaşımız başarılı olduğunda hangi duyguyu hissederiz?', a: 'Mutluluk ve sevinç 😊', d: ['Kıskançlık ve öfke 😠', 'Korku 😨'], exp: 'Arkadaşlarımızın başarısıyla sevinir ve mutlu oluruz.' },
      { q: 'En sevdiği oyuncağı kaybolan bir çocuk genellikle hangi duyguyu hisseder? 😢', spokenText: 'Oyuncağı kaybolan çocuk hangi duyguyu hisseder?', a: 'Üzüntü 😢', d: ['Kahkaha 😄', 'Gurur 🦁'], exp: 'Sevdiğimiz bir şeyi kaybettiğimizde üzüntü duyarız.' },
      { q: 'Sınıfımızdaki eşyaları ve sıraları nasıl kullanmalıyız? 🏫', spokenText: 'Sınıfımızdaki eşyaları ve sıraları nasıl kullanmalıyız?', a: 'Özenle koruyup temiz tutmalıyız ✨', d: ['Üzerine boya ile resim çizmeliyiz 🖍️', 'Sıraların üzerine çıkıp zıplamalıyız 👟'], exp: 'Okul eşyaları ortak malımızdır, özenle koruruz.' },
      { q: 'Okulda bir arkadaşımız düşüp incindiğinde ne yapmalıyız? 🤝', spokenText: 'Arkadaşımız düşüp incindiğinde ne yapmalıyız?', a: 'Hemen öğretmenimize haber verip yardım etmeliyiz 🤝', d: ['Ona gülüp yanından kaçmalıyız 🏃‍♂️', 'Görmezden gelmeliyiz 🙈'], exp: 'Zor durumda olan arkadaşımıza yardım eder ve öğretmenimize söyleriz.' },
      { q: 'Öğretmenimiz ders anlatırken nasıl dinlemeliyiz? 👂', spokenText: 'Öğretmenimiz ders anlatırken nasıl dinlemeliyiz?', a: 'Dikkatle ve sözünü kesmeden 👂', d: ['Arkadaşımızla fısıldaşarak 🗣️', 'Uyumaya çalışarak 😴'], exp: 'Dersi iyi öğrenmek için öğretmenimizi dikkatle dinleriz.' },
      { q: 'Okul lavabolarını kullandıktan sonra ne yapmalıyız? 🚰', spokenText: 'Okul lavabolarını kullandıktan sonra ne yapmalıyız?', a: 'Musluğu kapatıp ellerimizi kurulamalıyız 🚰', d: ['Musluğu sonuna kadar açık bırakmalıyız 💧', 'Suyu yerlere saçmalıyız 💦'], exp: 'Su tasarrufu ve temizlik için musluğu kapatırız.' },
      { q: 'Arkadaşımız bize bir şey ikram ettiğinde ama istemiyorsak ne deriz? 🍬', spokenText: 'Bize ikram edilen bir şeyi istemiyorsak ne deriz?', a: '"Hayır, teşekkür ederim." 🙏', d: ['"İğrenç bu, al başına çal!" 😠', 'Yere atarız ❌'], exp: 'Kibarca reddederken "Hayır, teşekkür ederim" deriz.' },
      { q: 'Okul bahçesinde oyun oynarken kurallara neden uyarız? ⚽', spokenText: 'Bahçede oyun oynarken kurallara neden uyarız?', a: 'Adil ve güvenli oynamak için 🤝', d: ['Sadece kendimiz kazanmak için 🏆', 'Arkadaşımızı kızdırmak için 😠'], exp: 'Oyun kuralları adalet ve barış içinde eğlenmemizi sağlar.' },
      { q: 'Okulda temizlik ve hijyeni sağlayan değerli personele ne ad verilir? 🧹', spokenText: 'Okulda temizliği sağlayan görevli kimdir?', a: 'Temizlik Görevlisi 🧹', d: ['Pilot ✈️', 'Kaptan ⚓'], exp: 'Okul görevlileri okulumuzun tertemiz ve sağlıklı olmasını sağlar.' },
      { q: 'Sınıfta arkadaşımızın boya kalemini kullanmak istediğimizde ilk ne yaparız? ✏️', spokenText: 'Arkadaşımızın boya kalemini almadan önce ne yaparız?', a: 'Kibarca izin isteriz 🤝', d: ['Haber vermeden gizlice alırız 🚫', 'Zorla elinden çekeriz 😠'], exp: 'Başkasına ait bir eşyayı kullanmadan önce mutlaka izin istenir.' }
    ],

    // Tema 2: Sağlığım ve Güvenliğim (22 Özgün Soru)
    grade1LifeScienceHealthTrafficPool: [
      { q: 'Yemeklerden önce ve sonra ellerimizi ne ile yıkamalıyız? 🧼', spokenText: 'Yemekten önce ve sonra ellerimizi ne ile yıkamalıyız?', a: 'Su ve sabunla en az 20 saniye 🧼', d: ['Sadece suyla ıslatıp geçeriz 💧', 'Peçeteyle silip geçeriz 🧻'], exp: 'Mikroplardan korunmak için eller su ve sabunla iyice yıkanır.' },
      { q: 'Dişlerimizin çürümemesi için günde en az kaç kez fırçalamalıyız? 🪥', spokenText: 'Dişlerimizi günde kaç kez fırçalamalıyız?', a: 'Günde 2 kez (sabah ve akşam) 🪥', d: ['Haftada 1 kez 📅', 'Hiç fırçalamamalıyız ❌'], exp: 'Sabah kahvaltıdan sonra ve akşam yatmadan önce dişler fırçalanır.' },
      { q: 'Kemiklerimizin ve dişlerimizin güçlenmesini sağlayan kalsiyum deposu içecek hangisidir? 🥛', spokenText: 'Kemiklerimizi güçlendiren kalsiyum deposu içecek hangisidir?', a: 'Süt 🥛', d: ['Kola ve asitli gazoz 🥤', 'Şekerli şurup 🍬'], exp: 'Süt kemik ve diş sağlığı için en temel doğal besindir.' },
      { q: 'Trafikte yayaların karşıdan karşıya güvenle geçmesi için yola çizilen beyaz çizgilere ne denir? 🦓', spokenText: 'Yayaların karşıdan karşıya geçtiği beyaz çizgili yola ne denir?', a: 'Yaya geçidi 🚶‍♂️', d: ['Bisiklet yolu 🚲', 'Tren rayı 🚂'], exp: 'Yaya geçidi yayaların güvenle karşıya geçmesini sağlar.' },
      { q: 'Trafik ışığında YAYALAR için KIRMIZI ışık yandığında ne yapmalıyız? 🛑', spokenText: 'Trafik ışığı kırmızı yandığında ne yapmalıyız?', a: 'Kaldırımda durup beklemeliyiz 🛑', d: ['Hızla yola fırlamalıyız 🏃‍♂️', 'Gözümüzü kapatıp geçmeliyiz 🙈'], exp: 'Kırmızı ışıkta yayalar ve araçlar kesinlikle durur.' },
      { q: 'Trafik ışığında YAYALAR için YEŞİL ışık yandığında ne yapmalıyız? 🟢', spokenText: 'Yeşil ışık yandığında ne yapmalıyız?', a: 'Yolu kontrol ederek dikkatle geçmeliyiz 🚶‍♂️', d: ['Yere oturup beklemeliyiz 🛑', 'Geriye doğru koşmalıyız 🔙'], exp: 'Yeşil ışık yandığında önce sola sonra sağa bakıp güvenle geçeriz.' },
      { q: 'Ülkemizde ambulans, polis ve itfaiye gibi TÜM acil durumlar için aranan tek numara kaçtır? 🚑🚒🚓', spokenText: 'Tüm acil durumlar için aranan acil yardım numarası kaçtır?', a: '112 (Bir Bir İki) 📞', d: ['155 📞', '100 📞'], exp: 'Türkiye\'de tüm acil durumlar tek çatı altında 112 numarasında toplanmıştır.' },
      { q: 'Arabada veya okul servisinde yolculuk yaparken güvenliğimiz için ilk ne takarız? 🛡️', spokenText: 'Arabada veya serviste ilk ne takarız?', a: 'Emniyet kemeri 🛡️', d: ['Güneş gözlüğü 🕶️', 'Kulaklık 🎧'], exp: 'Emniyet kemeri ani frenlerde ve sarsıntılarda hayat kurtarır.' },
      { q: 'Hangisi sağlığımıza ZARARLI olan abur cubur bir yiyecektir? 🚫', spokenText: 'Hangisi sağlığımıza zararlı olan abur cuburdur?', a: 'Aşırı yağlı cips ve asitli gazoz 🥤', d: ['Taze elma ve havuç 🍎🥕', 'Haşlanmış yumurta 🥚'], exp: 'Cips ve asitli içecekler obeziteye ve diş çürüğüne yol açar.' },
      { q: 'Yoğun araç trafiğinin aktığı yollarda yayaların yukarıdan geçmesini sağlayan köprüye ne denir? 🌉', spokenText: 'Yayaların yukarıdan geçtiği köprüye ne denir?', a: 'Üst geçit 🌉', d: ['Deniz iskelesi 🚢', 'Kaydırak 🎢'], exp: 'Üst geçit ve alt geçitler yayalar için en güvenli yoldur.' },
      { q: 'Tanımadığımız biri bize çikolata veya oyuncak vermek isterse ne yapmalıyız? 🛑', spokenText: 'Tanımadığımız biri bize hediye vermek isterse ne yapmalıyız?', a: 'Asla kabul etmeyip ailemizin yanına gitmeliyiz 🛑', d: ['Hemen alıp onunla gitmeliyiz 🏃‍♂️', 'Teşekkür edip hemen yemeliyiz 🍫'], exp: 'Güvenliğimiz için tanımadığımız kişilerden hiçbir şey almayız.' },
      { q: 'Vücudumuzun su ihtiyacını karşılamak için günde bolca ne içmeliyiz? 💧', spokenText: 'Vücudumuz için günde bolca ne içmeliyiz?', a: 'Temiz su 💧', d: ['Gazoz 🥤', 'Koyu çay ☕'], exp: 'Su yaşamsal sıvımızdır, her gün yeterli su içmeliyiz.' },
      { q: 'Oyun oynamak için aşağıdaki alanlardan hangisi GÜVENLİDİR? 🛝', spokenText: 'Oyun oynamak için hangisi güvenli bir alandır?', a: 'Çocuk parkı ve okul bahçesi 🛝🌳', d: ['İnşaat alanı 🏗️', 'Trafiğe açık cadde 🚗'], exp: 'Parklar ve okul bahçeleri çocuklar için güvenli oyun alanlarıdır.' },
      { q: 'Hapşırırken veya öksürürken mikropların yayılmaması için ne yapmalıyız? 🤧', spokenText: 'Hapşırırken ağzımızı ne ile kapatmalıyız?', a: 'Mendil veya dirseğimizin içiyle kapatmalıyız 🧻', d: ['Arkadaşımızın yüzüne doğru üflemeliyiz 💨', 'Elimizin içiyle kapatıp her yere sürmeliyiz ✋'], exp: 'Mendil veya dirsek içi kullanımı mikropların bulaşmasını engeller.' },
      { q: 'Kişisel temizliğimiz için haftada en az kaç kez banyo yapmalıyız? 🚿', spokenText: 'Kişisel temizliğimiz için haftada en az kaç kez banyo yapmalıyız?', a: 'En az 2 kez 🚿', d: ['Yılda 1 kez 📅', 'Hiç yapmamalıyız 🚫'], exp: 'Düzenli banyo yapmak cilt sağlığımız ve ferahlığımız için şarttır.' },
      { q: 'Göz sağlığımızı korumak için tablet veya televizyona nasıl bakmalıyız? 📱', spokenText: 'Gözlerimizi korumak için ekrana nasıl bakmalıyız?', a: 'Belirli mesafeden ve sınırlı süreyle ⏳', d: ['Karanlıkta gözümüzün dibine sokarak 🌑', 'Bütün gün aralıksız 📱'], exp: 'Ekranlara çok yakından ve uzun bakmak gözlerimizi yorar.' },
      { q: 'Güne zinde başlamak için en önemli ana öğün hangisidir? 🍳', spokenText: 'Günün en önemli öğünü hangisidir?', a: 'Sabah kahvaltısı 🍳', d: ['Gece yarısı atıştırması 🌙', 'Öğleden sonra cipsi 🍟'], exp: 'Kahvaltı büyüme ve derse odaklanma için en kritik öğündür.' },
      { q: 'Evde elektrik prizlerine yabancı cisim sokmak neden çok tehlikelidir? 🔌⚡', spokenText: 'Elektrik prizlerine dokunmak neden tehlikelidir?', a: 'Elektrik çarpabilir ⚡', d: ['Işıklar daha çok yanar 💡', 'Tehlikeli değildir ✅'], exp: 'Prizler ölümcül elektrik akımı taşır, asla cisim sokulmaz.' },
      { q: 'Gözlerimizin daha iyi ve sağlıklı görmesi için hangi sebzeyi tüketmeliyiz? 🥕', spokenText: 'Gözlerimiz için çok faydalı olan sebze hangisidir?', a: 'Havuç 🥕', d: ['Lolipop şeker 🍭', 'Patates kızartması 🍟'], exp: 'Havuç bol miktarda A vitamini içerir ve gözlerimizi korur.' },
      { q: 'Tırnaklarımız uzadığında ne yapmalıyız? ✂️', spokenText: 'Tırnaklarımız uzadığında ne yapmalıyız?', a: 'Büyüklerimizden yardım alarak temizce kesmeliyiz ✂️', d: ['Dişlerimizle kemirmeliyiz 😬', 'Uzamasına izin vermeliyiz 💅'], exp: 'Uzayan tırnakların arasına mikrop dolar, düzenli kesilmelidir.' },
      { q: 'Pencerelerden veya balkondan aşağıya doğru ne yapmamalıyız? 🏢', spokenText: 'Pencereden veya balkondan ne yapmamalıyız?', a: 'Asla sarkmamalı ve tırmanmamalıyız ⚠️', d: ['Hava almamalıyız 🌬️', 'Dışarı bakmamalıyız 👀'], exp: 'Düşme tehlikesine karşı pencere ve balkon korkuluklarından sarkılmaz.' },
      { q: 'Kış mevsiminde soğuktan ve gripten korunmak için bol bol ne tüketmeliyiz? 🍊', spokenText: 'Kışın gripten korunmak için hangi meyveleri tüketmeliyiz?', a: 'Portakal ve mandalina (C Vitamini) 🍊', d: ['Dondurma 🍦', 'Buzlu içecek 🧊'], exp: 'Portakal ve mandalina kışın vücut direncimizi artıran vitamin depolarıdır.' }
    ],

    // Tema 3: Ailem ve Toplum (20 Özgün Soru)
    grade1LifeScienceFamilyHomePool: [
      { q: 'Babamızın annesine ne ad veririz? 👵', spokenText: 'Babamızın annesine ne ad veririz?', a: 'Babaanne 👵', d: ['Anneanne 👵', 'Teyze 👩'], exp: 'Babamızın annesi babaanne, annemizin annesi anneannedir.' },
      { q: 'Annemizin annesine ne ad veririz? 👵', spokenText: 'Annemizin annesine ne ad veririz?', a: 'Anneanne 👵', d: ['Babaanne 👵', 'Hala 👩'], exp: 'Annemizin annesi anneannedir.' },
      { q: 'Annemizin kız kardeşine ne ad veririz? 👩', spokenText: 'Annemizin kız kardeşine ne ad veririz?', a: 'Teyze 👩', d: ['Hala 👩', 'Yenge 👩'], exp: 'Annemizin kız kardeşi teyzemizdir.' },
      { q: 'Babamızın kız kardeşine ne ad veririz? 👩', spokenText: 'Babamızın kız kardeşine ne ad veririz?', a: 'Hala 👩', d: ['Teyze 👩', 'Dayı 👨'], exp: 'Babamızın kız kardeşi halamızdır.' },
      { q: 'Annemizin erkek kardeşine ne ad veririz? 👨', spokenText: 'Annemizin erkek kardeşine ne ad veririz?', a: 'Dayı 👨', d: ['Amca 👨', 'Dede 👴'], exp: 'Annemizin erkek kardeşi dayımızdır.' },
      { q: 'Babamızın erkek kardeşine ne ad veririz? 👨', spokenText: 'Babamızın erkek kardeşine ne ad veririz?', a: 'Amca 👨', d: ['Dayı 👨', 'Enişte 👨'], exp: 'Babamızın erkek kardeşi amcamızdır.' },
      { q: 'Evde oyun oynadıktan sonra oyuncaklarımızı kim toplamalıdır? 🧸', spokenText: 'Oyuncakları kim toplamalıdır?', a: 'Kendimiz toplamalıyız 👦👧', d: ['Sadece annemiz toplamalıdır 👩', 'Yerde dağınık kalmalıdır ❌'], exp: 'Her çocuk kendi odasını ve oyuncaklarını toplama sorumluluğuna sahiptir.' },
      { q: 'Kaybolduğumuzda veya acil bir durumda güvenlik görevlilerine söyleyebilmek için neyi ezbere bilmeliyiz? 📍', spokenText: 'Kaybolduğumuzda neyi ezbere bilmeliyiz?', a: 'Ev adresimizi ve ailemizin telefon numarasını 📍📞', d: ['Tuttuğumuz futbol takımını ⚽', 'En sevdiğimiz çizgi filmi 📺'], exp: 'Ev adresi ve veli telefonu güvenlik için mutlaka öğrenilmelidir.' },
      { q: 'Apartmanda yaşarken komşularımızı rahatsız etmemek için ne yapmalıyız? 🏢', spokenText: 'Komşularımızı rahatsız etmemek için ne yaparız?', a: 'Evde koşup zıplamamalı ve yüksek ses çıkarmamalıyız 🤫', d: ['Gece yarısı davul çalmalıyız 🥁', 'Merdivenlerde bağırmalıyız 📢'], exp: 'Komşuluk hakkı için gürültü yapmamaya özen gösteririz.' },
      { q: 'Sabah komşumuzla merdivende karşılaştığımızda ne deriz? 🤝', spokenText: 'Sabah komşumuzla karşılaştığımızda ne deriz?', a: 'Günaydın, hayırlı sabahlar! ☀️', d: ['Hiç bakmadan koşarız 🏃‍♂️', 'Kapıyı yüzüne çarparız 🚪'], exp: 'Komşularımıza selam verip güler yüz gösteririz.' },
      { q: 'Akşam yemeği sofrası kurulurken ailemize nasıl yardımcı olabiliriz? 🍽️', spokenText: 'Yemek sofrası kurulurken nasıl yardım edebiliriz?', a: 'Ekmek sepetini veya peçeteleri masaya taşıyarak 🥖', d: ['Sıcak tencereleri tek başımıza kaldırarak ⚠️', 'Oturup bağırmalıyız 😠'], exp: 'Kırılmayacak ve güvenli eşyaları sofraya taşımak güzel bir yardımlaşmadır.' },
      { q: 'Aile içinde kararlar alınırken her bireyin ne hakkı vardır? 👨‍👩‍👧', spokenText: 'Aile içinde herkesin ne hakkı vardır?', a: 'Fikrini söyleme ve söz hakkı 🗣️', d: ['Sadece bağırma hakkı 📢', 'Hiç konuşmama zorunluluğu 🤐'], exp: 'Mutlu bir ailede herkesin görüşüne saygı duyulur.' },
      { q: 'Akşam yatarken aile bireylerimize ne dileriz? 🌙', spokenText: 'Akşam yatarken sevdiklerimize ne dileriz?', a: 'İyi geceler ve tatlı rüyalar 🌙', d: ['Günaydın ☀️', 'Tünaydın 🌤️'], exp: 'Uyumadan önce ev halkına "İyi geceler" dileriz.' },
      { q: 'Akrabalarımız arasında babamızın babasına veya annemizin babasına ne deriz? 👴', spokenText: 'Babamızın veya annemizin babasına ne deriz?', a: 'Dede (Büyükbaba) 👴', d: ['Amca 👨', 'Dayı 👨'], exp: 'Büyükbabamıza Dede deriz.' },
      { q: 'Teyzemizin veya amcamızın çocukları bizim neyimiz olur? 👦👧', spokenText: 'Teyzemizin veya amcamızın çocukları bizim neyimiz olur?', a: 'Kuzenimiz 🤝', d: ['Kardeşimiz', 'Torunumuz'], exp: 'Akraba çocukları bizim kuzenlerimizdir.' },
      { q: 'Evimizde elektrik veya su faturası geldiğinde bütçemizi korumak için ne yapmalıyız? 💡💧', spokenText: 'Evde faturaları azaltmak için ne yapmalıyız?', a: 'Gereksiz yanan ışıkları ve muslukları kapatmalıyız 💡❌', d: ['Her odaya fazladan lamba takmalıyız 💡', 'Bütün muslukları açmalıyız 💦'], exp: 'Tasarruf aile bütçemizi ve doğamızı korur.' },
      { q: 'Yaşlı veya hasta bir komşumuz olduğunda ne yapmalıyız? 👵', spokenText: 'Yaşlı bir komşumuz olduğunda ne yaparız?', a: 'Hallerini hatırlarını sorup gerekirse yardım ederiz 🤝', d: ['Kapı ziline basıp kaçarız 🏃‍♂️', 'Pencerelerine taş atarız ❌'], exp: 'Büyüklere ve hastalara yardım etmek en güzel erdemdir.' },
      { q: 'Evdeki kişisel eşyalarımızı (çanta, defter, giysi) nasıl tutmalıyız? 🎒', spokenText: 'Kişisel eşyalarımızı nasıl tutmalıyız?', a: 'Düzenli ve yerli yerinde 🎒✨', d: ['Odanın ortasına fırlatılmış halde 🧹', 'Dolabın arkasına tıkılmış halde 📦'], exp: 'Düzenli olmak aradığımızı kolayca bulmamızı sağlar.' },
      { q: 'Yemek yerken ağzımızda lokma varken ne yapmamalıyız? 🍽️', spokenText: 'Ağzımızda lokma varken ne yapmamalıyız?', a: 'Konuşmamalıyız 🤐', d: ['Çiğnememeliyiz', 'Yutmamalıyız'], exp: 'Görgü kuralı olarak lokma yutulduktan sonra konuşulur.' },
      { q: 'Büyüklerimiz bir konu hakkında konuşurken sözlerini kesmek istersek ne deriz? 🗣️', spokenText: 'Büyüklerin sözünü keserken ne deriz?', a: '"Özür dilerim, bölebilir miyim?" ✨', d: ['"Susun dinleyin beni!" 😠', 'Çığlık atarız 📢'], exp: 'Kibarca izin isteyerek söze başlarız.' }
    ],

    // Tema 4: Yaşadığım Yer ve Ülkem (20 Özgün Soru)
    grade1LifeScienceCountryFlagPool: [
      { q: 'Şanlı Türk bayrağımızın üzerinde hangi simgeler yer alır? 🇹🇷', spokenText: 'Türk bayrağımızın üzerinde hangi simgeler vardır?', a: 'Beyaz Hilal (Ay) ve Yıldız 🌙⭐', d: ['Güneş ve Bulut ☀️☁️', 'Çiçek ve Kuş 🌸🕊️'], exp: 'Bayrağımız al kırmızı zemin üzerine beyaz hilal ve yıldızdan oluşur.' },
      { q: 'İstiklal Marşımızın yazarı olan büyük milli şairimiz kimdir? 📜', spokenText: 'İstiklal Marşımızın şairi kimdir?', a: 'Mehmet Akif Ersoy ✍️', d: ['Nasreddin Hoca 🧙‍♂️', 'Keloğlan 👦'], exp: 'İstiklal Marşımızı milli şairimiz Mehmet Akif Ersoy yazmıştır.' },
      { q: 'Milli Marşımız söylenirken ve bayrak göndere çekilirken nasıl durmalıyız? 🇹🇷', spokenText: 'İstiklal Marşı söylenirken nasıl durmalıyız?', a: 'Hazır ol vaziyetinde dimdik ve saygıyla 🇹🇷', d: ['Arkadaşımızla şakalaşarak 🤼', 'Yere oturup dinlenerek 🛋️'], exp: 'Bayrağımıza ve marşımıza saygımızı hazır ol duruşuyla gösteririz.' },
      { q: 'Türkiye Cumhuriyeti\'nin kurucusu ve ilk Cumhurbaşkanı kimdir? 🇹🇷', spokenText: 'Cumhuriyetimizin kurucusu kimdir?', a: 'Gazi Mustafa Kemal Atatürk 🇹🇷', d: ['Fatih Sultan Mehmet 👑', 'Ali Kuşçu 🔭'], exp: 'Kurtuluş Savaşımızın lideri ve Cumhuriyetimizin kurucusu Atatürk\'tür.' },
      { q: 'Mustafa Kemal Atatürk hangi şehirde dünyaya gelmiştir? 🏡', spokenText: 'Atatürk hangi şehirde doğmuştur?', a: 'Selanik 🏡', d: ['İstanbul 🕌', 'Ankara 🏛️'], exp: 'Atatürk 1881 yılında Selanik\'te pembe boyalı evde doğmuştur.' },
      { q: 'Atatürk\'ün çok sevdiği annesinin adı nedir? 👵', spokenText: 'Atatürk\'ün annesinin adı nedir?', a: 'Zübeyde Hanım 👵', d: ['Makbule Hanım 👩', 'Fatma Hanım 👩'], exp: 'Atatürk\'ün annesi Zübeyde Hanım, babası Ali Rıza Efendi\'dir.' },
      { q: 'Atatürk\'ün kabrinin bulunduğu Anıtkabir hangi şehrimizdedir? 🏛️', spokenText: 'Anıtkabir hangi şehrimizdedir?', a: 'Ankara (Başkentimiz) 🏛️', d: ['İzmir 🏖️', 'Antalya 🌴'], exp: 'Anıtkabir başkentimiz Ankara\'da yer alır.' },
      { q: 'Atatürk\'ün çocuklara armağan ettiği milli bayramımız hangisidir? 🎈', spokenText: 'Çocuklara armağan edilen milli bayram hangisidir?', a: '23 Nisan Ulusal Egemenlik ve Çocuk Bayramı 🎈', d: ['29 Ekim Cumhuriyet Bayramı 🇹🇷', '30 Ağustos Zafer Bayramı 🎖️'], exp: '23 Nisan dünyada çocuklara armağan edilen tek çocuk bayramıdır.' },
      { q: 'Cumhuriyetimizin ilan edildiği ve coşkuyla kutladığımız milli bayramımız hangisidir? 🇹🇷', spokenText: 'Cumhuriyet Bayramı hangi gün kutlanır?', a: '29 Ekim Cumhuriyet Bayramı 🇹🇷', d: ['1 Ocak Yılbaşı ❄️', '19 Mayıs Gençlik Bayramı 🏃‍♂️'], exp: '29 Ekim 1923\'te Cumhuriyet ilan edilmiştir.' },
      { q: 'Türkiye Cumhuriyeti\'nin başkenti neresidir? 🇹🇷', spokenText: 'Ülkemizin başkenti neresidir?', a: 'Ankara 🏛️', d: ['İstanbul 🌉', 'Bursa 🏔️'], exp: 'Türkiye Cumhuriyeti\'nin başkenti Ankara\'dır.' },
      { q: 'Dini bayramlarımızda (Ramazan ve Kurban) ailece ne yaparız? 🍬', spokenText: 'Dini bayramlarımızda ne yaparız?', a: 'Büyüklerimizi ziyaret eder, el öper ve paylaşırız 🍬🤝', d: ['Kapıları kilitleyip kimseyle görüşmeyiz 🚪', 'Kavga ederiz 😠'], exp: 'Dini bayramlar sevgi, yardımlaşma ve büyükleri ziyaret günleridir.' },
      { q: 'Kurtuluş Savaşı\'nın başladığı gün olan 19 Mayıs hangi bayramımızdır? 🏃‍♂️', spokenText: '19 Mayıs hangi bayramdır?', a: 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı 🏃‍♂️', d: ['Zafer Bayramı 🎖️', 'Kurban Bayramı 🐑'], exp: '19 Mayıs gençlere ve spora adanmış milli bayramımızdır.' },
      { q: 'Ordumuzun büyük zafer kazandığı 30 Ağustos hangi bayram olarak kutlanır? 🎖️', spokenText: '30 Ağustos hangi bayramdır?', a: '30 Ağustos Zafer Bayramı 🎖️', d: ['23 Nisan Çocuk Bayramı 🎈', 'Cumhuriyet Bayramı 🇹🇷'], exp: '30 Ağustos şanlı ordumuzun Zafer Bayramı\'dır.' },
      { q: 'İstiklal Marşımızın ilk kelimesi hangisidir? 📜', spokenText: 'İstiklal Marşımızın ilk kelimesi nedir?', a: 'Korkma! 🇹🇷', d: ['Dur! 🛑', 'Dinle! 👂'], exp: 'İstiklal Marşımız "Korkma, sönmez bu şafaklarda yüzen al sancak" mısrasıyla başlar.' },
      { q: 'Yaşadığımız çevrede tarihi camileri, müzeleri ve kaleleri nasıl koruruz? 🏰', spokenText: 'Tarihi yerleri ve eserleri nasıl koruruz?', a: 'Zarar vermeden gezer ve temiz tutarız ✨', d: ['Duvarlarına yazı yazarız 🖍️', 'Taşlarını sökeriz ❌'], exp: 'Tarihi eserler milletimizin ortak mirasıdır.' },
      { q: 'Atatürk\'ün kız kardeşinin adı nedir? 👩', spokenText: 'Atatürk\'ün kız kardeşinin adı nedir?', a: 'Makbule Hanım 👩', d: ['Zübeyde Hanım 👵', 'Sabiha Gökçen ✈️'], exp: 'Atatürk\'ün kız kardeşi Makbule Hanım\'dır.' },
      { q: 'Bayrağımızın kırmızı rengi neyi temsil eder? 🇹🇷', spokenText: 'Bayrağımızın kırmızı rengi neyi temsil eder?', a: 'Şehitlerimizin kahramanlığını ve kanını 🇹🇷', d: ['Gül bahçesini 🌹', 'Domates tarlasını 🍅'], exp: 'Bayrağımızdaki al renk vatan uğruna can veren şehitlerimizi simgeler.' },
      { q: 'Ülkemizin haritadaki genel şekli neye benzer? 🗺️', spokenText: 'Ülkemizin haritadaki şekli neye benzer?', a: 'Bir dikdörtgene benzer 🚪', d: ['Tam bir yuvarlağa ⚪', 'Üçgene 🔺'], exp: 'Türkiye haritası doğudan batıya uzanan bir dikdörtgeni andırır.' },
      { q: 'Farklı ülkelerden gelen misafir çocuklara nasıl davranmalıyız? 🌍', spokenText: 'Farklı ülkelerden gelen çocuklara nasıl davranmalıyız?', a: 'Misafirperver ve sevgi dolu 🤝', d: ['Dışlayıp alay etmeliyiz 😠', 'Konuşmamalıyız ❌'], exp: 'Türk milleti misafirperverdir, herkese sevgiyle kucak açar.' },
      { q: 'Milli marşımız toplam kaç kıtadan oluşur? 📜', spokenText: 'İstiklal Marşı kaç kıtadır?', a: '10 kıtadan oluşur (Okulda ilk 2 kıtası söylenir) 📜', d: ['20 kıta', '5 kıta'], exp: 'İstiklal Marşımız 10 kıtadır, törenlerde ilk iki kıtası coşkuyla okunur.' }
    ],

    // Tema 5: Doğa ve Çevre (20 Özgün Soru)
    grade1LifeScienceNatureRecyclingPool: [
      { q: 'Kullanılmış kağıt, karton ve defterleri nereye atmalıyız? 📦♻️', spokenText: 'Eski kağıt ve kartonları nereye atmalıyız?', a: 'Mavi Kağıt Geri Dönüşüm Kutusuna ♻️', d: ['Sokağa yere 🍂', 'Dereye veya denize 🌊'], exp: 'Kağıtları geri dönüştürerek ağaçların kesilmesini önleriz.' },
      { q: 'Kullanılmış plastik şişeleri ve su kaplarını nereye atmalıyız? 🧴♻️', spokenText: 'Plastik şişeleri nereye atmalıyız?', a: 'Sarı Plastik Geri Dönüşüm Kutusuna ♻️', d: ['Ormana 🌲', 'Yere ❌'], exp: 'Plastikler doğada yüzlerce yıl yok olmaz, geri dönüştürülmelidir.' },
      { q: 'Bitmiş pilleri normal çöpe atmak yerine nereye atmalıyız? 🔋', spokenText: 'Bitmiş pilleri nereye atmalıyız?', a: 'Atık Pil Toplama Kutusuna 🔋', d: ['Evdeki normal çöp kovasına 🗑️', 'Toprağa gömmeliyiz 🌱'], exp: 'Pillerdeki kimyasallar toprağa ve suya zarar verir, atık pil kutusuna atılır.' },
      { q: 'Dişlerimizi fırçalarken su tasarrufu yapmak için ne yapmalıyız? 🚰', spokenText: 'Diş fırçalarken su tasarrufu için ne yapmalıyız?', a: 'Musluğu kapalı tutmalıyız 🚰', d: ['Suyu boşa akıtmalıyız 💧', 'Hortumla su tutmalıyız 💦'], exp: 'Diş fırçalarken musluğu kapatmak tonlarca suyu kurtarır.' },
      { q: 'Gündüz güneş varken aydınlık odada elektrik tasarrufu için ne yaparız? 💡', spokenText: 'Gündüz aydınlık odada ne yaparız?', a: 'Lambaları söndürürüz 💡❌', d: ['Bütün ışıkları açarız 💡💡', 'Televizyonu açık bırakıp gideriz 📺'], exp: 'Gereksiz yanan lambaları söndürerek enerji tasarrufu sağlarız.' },
      { q: 'Ağaçların çiçek açtığı, kuşların cıvıldadığı ve havaların ısınmaya başladığı mevsim hangisidir? 🌸', spokenText: 'Ağaçların çiçek açtığı ilkbahar mevsimi hangisidir?', a: 'İlkbahar 🌸', d: ['Kış ❄️', 'Sonbahar 🍂'], exp: 'İlkbaharda doğa uyanır ve çiçekler açar.' },
      { q: 'Havanın en sıcak olduğu, ince tişört giyilip denize girilen mevsim hangisidir? ☀️', spokenText: 'En sıcak mevsim hangisidir?', a: 'Yaz ☀️', d: ['Kış ❄️', 'Sonbahar 🍂'], exp: 'Yaz mevsimi yılın en sıcak mevsimidir.' },
      { q: 'Ağaçların yapraklarını döktüğü, rüzgarlı ve okulların açıldığı mevsim hangisidir? 🍂', spokenText: 'Yaprakların döküldüğü mevsim hangisidir?', a: 'Sonbahar 🍂', d: ['İlkbahar 🌸', 'Yaz ☀️'], exp: 'Sonbaharda havalar serinler ve sararan yapraklar dökülür.' },
      { q: 'Kar yağan, kardan adam yapılan ve kalın montlar giyilen soğuk mevsim hangisidir? ⛄', spokenText: 'Kar yağan soğuk mevsim hangisidir?', a: 'Kış ❄️', d: ['Yaz ☀️', 'İlkbahar 🌸'], exp: 'Kışın hava çok soğur, kar yağar ve kalın giyiniriz.' },
      { q: 'Sokaktaki sevimli kedi ve köpekler için özellikle sıcak yaz günlerinde kapımızın önüne ne koymalıyız? 🐱🐶', spokenText: 'Sokak hayvanları için kapımızın önüne ne koymalıyız?', a: 'Bir kap temiz su ve mama 🥣💧', d: ['Taş ve sopa 🚫', 'Çöp poşeti 🗑️'], exp: 'Sokak hayvanlarının su ve besin ihtiyacına yardım ederiz.' },
      { q: 'Park ve bahçelerdeki rengarenk çiçekleri ve fidanları nasıl koruruz? 🌷', spokenText: 'Çiçekleri nasıl koruruz?', a: 'Koparmadan sever, gerekirse sularız 🌷💧', d: ['Hepsini kökünden koparırız ❌', 'Üstlerinde zıplarız 👞'], exp: 'Çiçekler dalında güzeldir, asla koparılmaz.' },
      { q: 'Bir yılda toplam kaç mevsim yaşanır? 🌍', spokenText: 'Bir yılda kaç mevsim vardır?', a: '4 Mevsim (İlkbahar, Yaz, Sonbahar, Kış) 🍂', d: ['2 Mevsim', '12 Mevsim'], exp: 'Bir yılda 4 mevsim vardır.' },
      { q: 'Yağmurlu havalarda ıslanmamak için yanımıza ne alırız? ☔', spokenText: 'Yağmur yağınca ne alırız?', a: 'Şemsiye ve yağmurluk ☔', d: ['Güneş gözlüğü 🕶️', 'Yelpaze 🪭'], exp: 'Yağmurdan şemsiye ile korunuruz.' },
      { q: 'Cam şişe ve kavanozları doğaya atmak yerine nereye atmalıyız? 🍾♻️', spokenText: 'Cam şişeleri nereye atmalıyız?', a: 'Yeşil Cam Geri Dönüşüm Kutusuna ♻️', d: ['Kumsala veya ormana 🏖️', 'Pencereden dışarı 🚪'], exp: 'Cam atıklar yangın çıkarabilir, mutlaka cam kumbarasına atılmalıdır.' },
      { q: 'Evdeki bitkilerimizi büyütmek için onlara ne vermeliyiz? 🌱', spokenText: 'Bitkileri büyütmek için ne vermeliyiz?', a: 'Güneş ışığı ve yeterli su ☀️💧', d: ['Kola ve meyve suyu 🥤', 'Çikolata 🍫'], exp: 'Bitkiler su ve güneş ışığı ile beslenir.' },
      { q: 'Ağaç dikmek doğamıza ne kazandırır? 🌲', spokenText: 'Ağaç dikmek doğaya ne kazandırır?', a: 'Temiz hava ve bol oksijen 🌲💨', d: ['Hava kirliliği', 'Toz ve duman'], exp: 'Ağaçlar dünyamızın akciğerleridir, havayı temizler.' },
      { q: 'Hangi davranış doğaya ZARAR verir? 🚫', spokenText: 'Hangi davranış doğaya zarar verir?', a: 'Piknikten sonra çöpleri ormanda bırakmak 🗑️', d: ['Fidan dikmek 🌱', 'Kuşlara yem vermek 🐦'], exp: 'Doğaya çöp bırakmak orman yangınlarına ve kirliliğe yol açar.' },
      { q: 'Kışın dışarı çıkarken hangi giysileri tercih ederiz? 🧣', spokenText: 'Kışın hangi giysileri giyeriz?', a: 'Kalın mont, bere ve atkı 🧤', d: ['Mayo ve şort 🩳', 'Kısa kollu tişört 👕'], exp: 'Soğuk kış günlerinde kalın giyinerek hastalıklardan korunuruz.' },
      { q: 'Denize veya akarsulara çöp atmak hangi canlılara zarar verir? 🐟', spokenText: 'Denize çöp atmak kime zarar verir?', a: 'Balıklara ve tüm deniz canlılarına 🐟🐢', d: ['Hiçbir canlıya zarar vermez', 'Sadece uçaklara'], exp: 'Su kirliliği denizdeki tüm canlıların yaşamını tehdit eder.' },
      { q: 'Hangisi çevre dostu bir ulaşım aracıdır? 🚲', spokenText: 'Hangisi havayı kirletmeyen çevre dostu araçtır?', a: 'Bisiklet 🚲', d: ['Eski duman çıkaran kamyon 🚛', 'Uçak ✈️'], exp: 'Bisiklet yakıt tüketmez, havayı kirletmez ve sağlıklıdır.' }
    ],

    // Hayat Bilgisi 5 Tema Karma Motoru
    generateGrade1LifeScienceKarma() {
      const themeIdx = Math.floor(Math.random() * 5);
      if (themeIdx === 0) return this.drawFromPool(this.grade1LifeScienceSchoolPool, "grade1LifeScienceSchoolPool");
      if (themeIdx === 1) return this.drawFromPool(this.grade1LifeScienceHealthTrafficPool, "grade1LifeScienceHealthTrafficPool");
      if (themeIdx === 2) return this.drawFromPool(this.grade1LifeScienceFamilyHomePool, "grade1LifeScienceFamilyHomePool");
      if (themeIdx === 3) return this.drawFromPool(this.grade1LifeScienceCountryFlagPool, "grade1LifeScienceCountryFlagPool");
      return this.drawFromPool(this.grade1LifeScienceNatureRecyclingPool, "grade1LifeScienceNatureRecyclingPool");
    },


    // --- 2. DERS: MATEMATİK (2026 Maarif Modeli 5 Konu - KESİN SINIR <= 20) ---

    // Konu 1: Nesnelerin Geometrisi ve Uzamsal İlişkiler
    generateGrade1SpatialGeo() {
      const mode = Math.floor(Math.random() * 3);
      if (mode === 0) {
        // Geometrik Şekil Özellikleri (Üçgen, Kare, Dikdörtgen, Çember)
        const shapes = [
          { q: '3 kenarı ve 3 köşesi olan geometrik şekil hangisidir? 🔺', spoken: 'Üç kenarı ve üç köşesi olan geometrik şekil hangisidir?', a: 'Üçgen 🔺', d: ['Kare 🟦', 'Dikdörtgen 🚪'], exp: 'Üçgenin 3 kenarı ve 3 köşesi vardır.' },
          { q: '4 kenarı, 4 köşesi olan ve tüm kenar uzunlukları birbirine EŞİT şekil hangisidir? 🟦', spoken: 'Dört kenarı eşit olan geometrik şekil hangisidir?', a: 'Kare 🟦', d: ['Üçgen 🔺', 'Çember ⚪'], exp: 'Karenin 4 kenarı eşittir ve 4 köşesi vardır.' },
          { q: '2 uzun ve 2 kısa kenarı olan, 4 köşeli şekil hangisidir? 🚪', spoken: 'İki uzun ve iki kısa kenarı olan şekil hangisidir?', a: 'Dikdörtgen 🚪', d: ['Kare 🟦', 'Üçgen 🔺'], exp: 'Dikdörtgenin karşılıklı kenarları eşittir: 2 uzun, 2 kısa.' },
          { q: 'Hiç köşesi ve düz kenarı olmayan, yuvarlak şekil hangisidir? ⚪', spoken: 'Köşesi ve kenarı olmayan yuvarlak şekil hangisidir?', a: 'Çember ⚪', d: ['Kare 🟦', 'Üçgen 🔺'], exp: 'Çember yuvarlaktır, köşesi ve kenarı yoktur.' },
          { q: 'Karenin kaç adet köşesi vardır? 🟦', spoken: 'Karenin kaç köşesi vardır?', a: '4 köşe 🟦', d: ['3 köşe 🔺', '0 köşe ⚪'], exp: 'Karenin 4 köşesi ve 4 kenarı bulunur.' },
          { q: 'Üçgenin kaç adet kenarı vardır? 🔺', spoken: 'Üçgenin kaç kenarı vardır?', a: '3 kenar 🔺', d: ['4 kenar 🟦', '2 kenar'], exp: 'Üçgen 3 kenardan oluşur.' },
          { q: 'Çemberin kaç adet köşesi vardır? ⚪', spoken: 'Çemberin kaç köşesi vardır?', a: '0 (Köşesi yoktur) ⚪', d: ['1 köşe', '4 köşe'], exp: 'Çember yuvarlaktır, hiç köşesi yoktur.' }
        ];
        const item = shapes[Math.floor(Math.random() * shapes.length)];
        return { question: item.q, spokenText: item.spoken, correct: item.a, distractors: item.d, explanation: item.exp };
      } else if (mode === 1) {
        // Günlük Hayattaki Eşyaların Şekli
        const items = [
          { q: 'Sınıfımızdaki yazı tahtası veya kapı hangi şekle benzer? 🚪', spoken: 'Yazı tahtası veya sınıf kapısı hangi şekle benzer?', a: 'Dikdörtgen 🚪', d: ['Çember ⚪', 'Üçgen 🔺'], exp: 'Yazı tahtası 2 uzun 2 kısa kenarlı dikdörtgendir.' },
          { q: 'Oyun zarı 🎲 veya hediye kutusu hangi geometrik şekle benzer?', spoken: 'Oyun zarı hangi geometrik şekle benzer?', a: 'Kare 🟦', d: ['Üçgen 🔺', 'Çember ⚪'], exp: 'Zarın her yüzeyi karedir.' },
          { q: 'Futbol topu ⚽ veya madeni 1 TL paramız hangi şekle benzer?', spoken: 'Futbol topu veya madeni paramız hangi şekle benzer?', a: 'Çember / Daire ⚪', d: ['Kare 🟦', 'Üçgen 🔺'], exp: 'Madeni para ve top yuvarlaktır, çembere benzer.' },
          { q: 'Trafikteki tehlike uyarı levhaları ⚠️ hangi şekildedir?', spoken: 'Trafikteki tehlike uyarı levhası hangi şekildedir?', a: 'Üçgen 🔺', d: ['Kare 🟦', 'Çember ⚪'], exp: 'Uyarı levhaları çoğunlukla üçgendir.' },
          { q: 'Bir dilim pizza 🍕 genellikle hangi geometrik şekle benzer?', spoken: 'Bir dilim pizza hangi şekle benzer?', a: 'Üçgen 🔺', d: ['Kare 🟦', 'Dikdörtgen 🚪'], exp: 'Pizza dilimi 3 köşeli üçgene benzer.' }
        ];
        const item = items[Math.floor(Math.random() * items.length)];
        return { question: item.q, spokenText: item.spoken, correct: item.a, distractors: item.d, explanation: item.exp };
      } else {
        // Uzamsal İlişkiler (Üstünde-Altında, İçinde-Dışında, Sağında-Solunda, Arasında, Yüksek-Alçak)
        const spatialItems = [
          { q: 'Elma masanın ÜSTÜNDE 🍎, çanta masanın ALTINDA 🎒 duruyor. Masanın ÜSTÜNDE ne vardır?', spoken: 'Masanın üstünde ne vardır?', a: 'Elma 🍎', d: ['Çanta 🎒', 'Kalem ✏️'], exp: 'Elma masanın üstündedir.' },
          { q: 'Kedi kutunun İÇİNDE 🐱, köpek kutunun DIŞINDA 🐶 duruyor. Kutunun İÇİNDE kim vardır?', spoken: 'Kutunun içinde kim vardır?', a: 'Kedi 🐱', d: ['Köpek 🐶', 'Kuş 🐦'], exp: 'Kedi kutunun içindedir.' },
          { q: 'Ağacın SAĞINDA sincap 🐿️, SOLUNDA tavşan 🐰 var. Ağacın SAĞINDA kim vardır?', spoken: 'Ağacın sağında kim vardır?', a: 'Sincap 🐿️', d: ['Tavşan 🐰', 'Kedi 🐱'], exp: 'Sincap ağacın sağ tarafındadır.' },
          { q: 'Ali ile Ayşe\'nin TAM ARASINDA Can duruyor. Ortada duran kimdir? 👦', spoken: 'Ali ile Ayşe\'nin tam arasında kim duruyor?', a: 'Can 👦', d: ['Ali 👦', 'Ayşe 👧'], exp: 'İki kişinin arasında Can durmaktadır.' },
          { q: 'Uçak gökyüzünde YÜKSEKTE ✈️, karınca yerde ALÇAKTA 🐜 yürüyor. Hangisi DAHA YÜKSEKTEDİR?', spoken: 'Hangisi daha yüksektedir?', a: 'Uçak ✈️', d: ['Karınca 🐜', 'İkisi de aynı'], exp: 'Uçak gökyüzünde daha yüksekte uçar.' }
        ];
        const item = spatialItems[Math.floor(Math.random() * spatialItems.length)];
        return { question: item.q, spokenText: item.spoken, correct: item.a, distractors: item.d, explanation: item.exp };
      }
    },

    // Konu 2: Sayılar ve Nicelikler (1-20 Arası, Onluk-Birlik, Ritmik Sayma)
    generateGrade1NumbersQuantities() {
      const mode = Math.floor(Math.random() * 4);
      if (mode === 0) {
        // Onluk ve Birlik Kavramı (10-19)
        const units = Math.floor(Math.random() * 10); // 0..9
        const num = 10 + units;
        if (Math.random() > 0.5) {
          return {
            question: '1 Onluk ve ' + units + ' Birlikten oluşan sayı kaçtır? 📦',
            spokenText: 'Bir onluk ve ' + units + ' birlikten oluşan sayı kaçtır?',
            correct: num.toString(),
            distractors: [(num > 10 ? num - 1 : 12).toString(), (num < 19 ? num + 1 : 18).toString()],
            explanation: '1 Onluk = 10, ' + units + ' Birlik = ' + units + '. Toplam 10 + ' + units + ' = ' + num + ' eder.'
          };
        } else {
          return {
            question: '"' + num + '" sayısında kaç ONLUK ve kaç BİRLİK vardır? 📦',
            spokenText: num + ' sayısında kaç onluk ve kaç birlik vardır?',
            correct: '1 Onluk, ' + units + ' Birlik',
            distractors: [units + ' Onluk, 1 Birlik', '2 Onluk, ' + units + ' Birlik'],
            explanation: num + ' sayısı 1 onluk (10) ve ' + units + ' birlikten oluşur.'
          };
        }
      } else if (mode === 1) {
        // Sayı Karşılaştırması (Büyük-Küçük, 1..20)
        const n1 = Math.floor(Math.random() * 16) + 3; // 3..18
        let n2 = Math.floor(Math.random() * 16) + 3;
        while (n2 === n1) n2 = Math.floor(Math.random() * 16) + 3;
        const wantBigger = Math.random() > 0.5;
        const correct = wantBigger ? Math.max(n1, n2) : Math.min(n1, n2);
        const wrong = wantBigger ? Math.min(n1, n2) : Math.max(n1, n2);
        return {
          question: wantBigger ? 'Hangisi DİĞERİNDEN DAHA BÜYÜKTÜR? (' + n1 + ' mi, ' + n2 + ' mi?) 🔢' : 'Hangisi DİĞERİNDEN DAHA KÜÇÜKTÜR? (' + n1 + ' mi, ' + n2 + ' mi?) 🔢',
          spokenText: wantBigger ? n1 + ' ile ' + n2 + ' sayılarından hangisi daha büyüktür?' : n1 + ' ile ' + n2 + ' sayılarından hangisi daha küçüktür?',
          correct: correct.toString(),
          distractors: [wrong.toString(), (correct === 20 ? 19 : correct + 1).toString()],
          explanation: wantBigger ? correct + ' sayısı ' + wrong + ' sayısından daha büyüktür.' : correct + ' sayısı ' + wrong + ' sayısından daha küçüktür.'
        };
      } else if (mode === 2) {
        // Sıra Sayıları (1., 2., 3., 4., 5.)
        const ordinals = [
          { q: 'Koşu yarışında en önde bitiş çizgisine ulaşan kaçıncı olur? 🥇', spoken: 'Yarışta en önde bitişe ulaşan kaçıncı olur?', a: '1. (Birinci) 🥇', d: ['2. (İkinci) 🥈', '3. (Üçüncü) 🥉'], exp: 'En öndeki kişi 1. (birinci) olur.' },
          { q: 'Yarışı 1. bitirenin hemen arkasından gelen kişi kaçıncı olur? 🥈', spoken: 'Birincinin hemen arkasındaki kaçıncı olur?', a: '2. (İkinci) 🥈', d: ['3. (Üçüncü) 🥉', '1. (Birinci) 🥇'], exp: 'Birinciden hemen sonra gelen 2. (ikinci) olur.' },
          { q: '14 sayısından hemen ÖNCE gelen sayı kaçtır? 🔢', spoken: '14 sayısından hemen önce gelen sayı kaçtır?', a: '13', d: ['15', '12'], exp: '14\'ten bir önce 13 gelir.' },
          { q: '17 sayısından hemen SONRA gelen sayı kaçtır? 🔢', spoken: '17 sayısından hemen sonra gelen sayı kaçtır?', a: '18', d: ['16', '19'], exp: '17\'den bir sonra 18 gelir.' }
        ];
        const item = ordinals[Math.floor(Math.random() * ordinals.length)];
        return { question: item.q, spokenText: item.spoken, correct: item.a, distractors: item.d, explanation: item.exp };
      } else {
        // 1. Sınıf Ritmik Sayma (2'şer en çok 20, 5'er en çok 50, 10'ar en çok 100)
        const rhythmType = Math.floor(Math.random() * 3);
        if (rhythmType === 0) {
          // 2'şer ileri sayma (2..20)
          const start = [2, 4, 6, 8, 10, 12, 14][Math.floor(Math.random() * 7)];
          const s1 = start, s2 = s1 + 2, s3 = s2 + 2, ans = s3 + 2;
          return {
            question: s1 + ' - ' + s2 + ' - ' + s3 + ' - ? (2\'şer ileri sayma)',
            spokenText: s1 + ', ' + s2 + ', ' + s3 + '... İkişer sayarken sıradaki sayı kaçtır?',
            correct: ans.toString(),
            distractors: [(ans + 2).toString(), (ans - 1).toString()],
            explanation: 'Sayılar 2\'şer artmaktadır. ' + s3 + '\'ten sonra ' + ans + ' gelir.'
          };
        } else if (rhythmType === 1) {
          // 5'er ileri sayma (5..50)
          const start = [5, 10, 15, 20, 25, 30, 35][Math.floor(Math.random() * 7)];
          const s1 = start, s2 = s1 + 5, s3 = s2 + 5, ans = s3 + 5;
          return {
            question: s1 + ' - ' + s2 + ' - ' + s3 + ' - ? (5\'er ileri sayma)',
            spokenText: s1 + ', ' + s2 + ', ' + s3 + '... Beşer sayarken sıradaki sayı kaçtır?',
            correct: ans.toString(),
            distractors: [(ans + 5).toString(), (ans - 5).toString()],
            explanation: 'Sayılar 5\'er artmaktadır. ' + s3 + '\'ten sonra ' + ans + ' gelir.'
          };
        } else {
          // 10'ar ileri veya geri sayma (10..100)
          const start = [10, 20, 30, 40, 50, 60, 70][Math.floor(Math.random() * 7)];
          const s1 = start, s2 = s1 + 10, s3 = s2 + 10, ans = s3 + 10;
          return {
            question: s1 + ' - ' + s2 + ' - ' + s3 + ' - ? (10\'ar ileri sayma)',
            spokenText: s1 + ', ' + s2 + ', ' + s3 + '... Onar sayarken sıradaki sayı kaçtır?',
            correct: ans.toString(),
            distractors: [(ans + 10).toString(), (ans - 10).toString()],
            explanation: 'Sayılar 10\'ar artmaktadır. ' + s3 + '\'ten sonra ' + ans + ' gelir.'
          };
        }
      }
    },

    // Konu 3: İşlemlerden Cebirsel Düşünmeye (Toplama, Çıkarma, Örüntü - KESİN TOPLAM <= 20)
    generateGrade1OperationsPatterns() {
      const mode = Math.floor(Math.random() * 4);
      if (mode === 0) {
        // Toplamı 20'yi geçmeyen Doğal Sayılarla Toplama
        const a = Math.floor(Math.random() * 11) + 2; // 2..12
        const maxB = 20 - a;
        const b = Math.floor(Math.random() * Math.min(8, maxB)) + 1; // 1..maxB
        const ans = a + b;
        return {
          question: a + ' + ' + b + ' = ? ➕',
          spokenText: a + ' artı ' + b + ' kaç eder?',
          correct: ans.toString(),
          distractors: [(ans + 1).toString(), (ans > 1 ? ans - 1 : ans + 2).toString()],
          explanation: a + ' sayısına ' + b + ' eklediğimizde ' + ans + ' elde ederiz.'
        };
      } else if (mode === 1) {
        // 20'ye kadar Sayılarla Çıkarma (Eksiltme)
        const a = Math.floor(Math.random() * 13) + 7; // 7..19
        const b = Math.floor(Math.random() * (a - 2)) + 1; // 1..a-2
        const ans = a - b;
        return {
          question: a + ' - ' + b + ' = ? ➖',
          spokenText: a + ' eksi ' + b + ' kaç eder?',
          correct: ans.toString(),
          distractors: [(ans + 1).toString(), Math.max(0, ans - 1).toString()],
          explanation: a + ' sayısından ' + b + ' geriye doğru saydığımızda ' + ans + ' kalır.'
        };
      } else if (mode === 2) {
        // Zihinden 10'a Tamamlama
        const a = Math.floor(Math.random() * 9) + 1; // 1..9
        const complement = 10 - a;
        return {
          question: a + ' sayısına kaç eklersek sonuç 10 olur? 🔟',
          spokenText: a + ' sayısına kaç eklersek sonuç on olur?',
          correct: complement.toString(),
          distractors: [(complement + 1).toString(), Math.max(1, complement - 1).toString()],
          explanation: a + ' + ' + complement + ' = 10 eder.'
        };
      } else {
        // Şekil ve Basit Sayı Örüntüleri
        const patternType = Math.floor(Math.random() * 3);
        if (patternType === 0) {
          return {
            question: '🔺 🟦 🔺 🟦 🔺 ? (Sıradaki şekil hangisidir?) 🧩',
            spokenText: 'Üçgen, kare, üçgen, kare, üçgen... Sıradaki şekil hangisidir?',
            correct: '🟦 (Kare)',
            distractors: ['🔺 (Üçgen)', '⚪ (Çember)'],
            explanation: 'Örüntü bir üçgen, bir kare şeklinde ilerlemektedir. Sıradaki şekil mavidir (kare).'
          };
        } else if (patternType === 1) {
          return {
            question: '🍎 🍌 🍎 🍌 🍎 ? (Sıradaki meyve hangisidir?) 🍎🍌',
            spokenText: 'Elma, muz, elma, muz, elma... Sıradaki meyve hangisidir?',
            correct: '🍌 (Muz)',
            distractors: ['🍎 (Elma)', '🍓 (Çilek)'],
            explanation: 'Örüntü elma-muz sırasıyla gitmektedir. Elmadan sonra muz gelir.'
          };
        } else {
          return {
            question: '1 - 3 - 5 - 7 - ? (Kurala göre eksik sayı kaçtır?) 🔢',
            spokenText: '1, 3, 5, 7... Sıradaki sayı kaçtır?',
            correct: '9',
            distractors: ['8', '10'],
            explanation: 'Sayılar ikişer ikişer artan bir örüntü oluşturmaktadır. 7 + 2 = 9 eder.'
          };
        }
      }
    },

    // Konu 4: Ölçme, Paralarımız ve Zaman (Saatler, TL & Kuruş, Karış-Adım)
    generateGrade1MeasureMoneyTime() {
      const mode = Math.floor(Math.random() * 4);
      if (mode === 0) {
        // Saatler (Tam ve Yarım Saatler)
        const hour = Math.floor(Math.random() * 11) + 1; // 1..11
        const isHalf = Math.random() > 0.5;
        if (isHalf) {
          return {
            question: 'Akrep ' + hour + ' ile ' + (hour + 1) + ' arasında, yelkovan 6\'yı gösterirken saat kaçtır? ⏰',
            spokenText: 'Akrep ' + hour + ' ile ' + (hour + 1) + ' arasında, yelkovan altıyı gösterirken saat kaçtır?',
            correct: 'Saat ' + hour + ' buçuk ⏰',
            distractors: ['Saat ' + hour + ' ⏰', 'Saat ' + (hour + 1) + ' ⏰'],
            explanation: 'Yelkovan 6\'nın üzerindeyken saat "buçuk" (yarım saat) demektir. Saat ' + hour + ' buçuktur.'
          };
        } else {
          return {
            question: 'Akrep ' + hour + '\'i, yelkovan tam 12\'yi gösterirken saat kaçtır? ⏰',
            spokenText: 'Akrep ' + hour + ' üzerinde, yelkovan tam 12 üzerinde olduğunda saat kaçtır?',
            correct: 'Saat ' + hour + ' (Tam saat) ⏰',
            distractors: ['Saat ' + hour + ' buçuk ⏰', 'Saat ' + (hour === 12 ? 1 : hour + 1) + ' ⏰'],
            explanation: 'Yelkovan 12\'nin üzerindeyken saat tam saati gösterir: Saat ' + hour + '.'
          };
        }
      } else if (mode === 1) {
        // Paralarımız (TL ve Kuruşlar)
        const moneyQuestions = [
          { q: '1 Türk Lirası (1 TL) kaç kuruşa eşittir? 🪙', spoken: '1 Türk Lirası kaç kuruşa eşittir?', a: '100 Kuruş 🪙', d: ['50 Kuruş 🪙', '10 Kuruş 🪙'], exp: '1 TL = 100 Kuruştur.' },
          { q: 'En büyük madeni (demir) paramız hangisidir? 🪙', spoken: 'En büyük madeni paramız hangisidir?', a: '1 Türk Lirası (1 TL) 🪙', d: ['50 Kuruş 🪙', '25 Kuruş 🪙'], exp: 'Madeni paralarımızın en büyüğü 1 TL\'dir.' },
          { q: 'En küçük değerli kağıt paramız hangisidir? 💵', spoken: 'En küçük değerli kağıt paramız hangisidir?', a: '5 TL 💵', d: ['10 TL 💵', '20 TL 💵'], exp: 'Kağıt paralarımızın en küçüğü 5 TL\'dir.' },
          { q: '2 tane 50 Kuruş bir araya gelirse kaç TL eder? 🪙', spoken: 'İki tane elli kuruş bir araya gelirse kaç lira eder?', a: '1 TL 🪙', d: ['2 TL 🪙', '75 Kuruş 🪙'], exp: '50 Kr + 50 Kr = 100 Kr = 1 TL eder.' },
          { q: '2 tane 10 TL kağıt para toplam kaç TL eder? 💵', spoken: 'İki tane on lira kağıt para kaç lira eder?', a: '20 TL 💵', d: ['15 TL 💵', '30 TL 💵'], exp: '10 + 10 = 20 TL eder.' },
          { q: 'Kumbarasında 12 TL olan Efe\'ye dedesi 5 TL harçlık verdi. Efe\'nin kaç TL\'si oldu? 🪙', spoken: 'Kumbarasında 12 lirası olan Efe\'ye dedesi 5 lira verirse kaç lirası olur?', a: '17 TL 💵', d: ['15 TL 💵', '18 TL 💵'], exp: '12 + 5 = 17 TL olur.' },
          { q: 'Tanesi 4 TL olan kalemden 2 tane alan Zeynep kaç TL öder? ✏️', spoken: 'Tanesi 4 lira olan kalemden iki tane alan Zeynep kaç lira öder?', a: '8 TL 💵', d: ['6 TL 💵', '10 TL 💵'], exp: '4 + 4 = 8 TL öder.' }
        ];
        const item = moneyQuestions[Math.floor(Math.random() * moneyQuestions.length)];
        return { question: item.q, spokenText: item.spoken, correct: item.a, distractors: item.d, explanation: item.exp };
      } else if (mode === 2) {
        // Standart Olmayan Ölçüler ve Sıvı Ölçme
        const measures = [
          { q: 'Parmaklarımızı yana doğru açtığımızda başparmak ile serçeparmak arasındaki mesafeye ne denir? ✋', spoken: 'Başparmak ile serçeparmak arasındaki mesafeye ne ad verilir?', a: 'Karış ✋', d: ['Adım 👟', 'Kulaç 👐'], exp: 'Açılmış el parmakları arasındaki mesafeye karış denir.' },
          { q: 'Yürürken iki ayağımızın açıklığı arasındaki mesafeye ne denir? 🚶‍♂️', spoken: 'Yürürken iki ayağımız arasındaki mesafeye ne ad verilir?', a: 'Adım 👟', d: ['Karış ✋', 'Parmak ☝️'], exp: 'Yürürken atılan mesafeye adım denir.' },
          { q: 'İki kolumuzu iki yana doğru sonuna kadar açtığımızda oluşan uzunluğa ne denir? 👐', spoken: 'İki kolumuzu iki yana açtığımızda oluşan mesafeye ne ad verilir?', a: 'Kulaç 👐', d: ['Ayak 🦶', 'Karış ✋'], exp: 'İki kolun iki yana açık mesafesi kulaçtır.' },
          { q: 'İçinde hiç su kalmamış bir bardağa ne denir? 🥛', spoken: 'İçinde hiç su olmayan bardağa ne denir?', a: 'Boş bardak 🥛', d: ['Dolu bardak 🥛', 'Yarım bardak 🥛'], exp: 'İçinde sıvı olmayan kap boştur.' },
          { q: 'Çizgisine kadar su ile doldurulmuş bir bardağa ne denir? 🥛', spoken: 'Tamamen su doldurulmuş bardağa ne denir?', a: 'Dolu bardak 🥛', d: ['Boş bardak 🥛', 'Yarım bardak 🥛'], exp: 'Ağzına kadar sıvıyla kaplanmış kap doludur.' }
        ];
        const item = measures[Math.floor(Math.random() * measures.length)];
        return { question: item.q, spokenText: item.spoken, correct: item.a, distractors: item.d, explanation: item.exp };
      } else {
        // Zaman Kavramları (Günler, Aylar, Dün-Bugün-Yarın)
        const timeItems = [
          { q: 'Bir haftada toplam kaç gün vardır? 📅', spoken: 'Bir haftada kaç gün vardır?', a: '7 gün 📅', d: ['5 gün', '10 gün'], exp: 'Bir hafta 7 gündür (Pazartesi, Salı, Çarşamba, Perşembe, Cuma, Cumartesi, Pazar).' },
          { q: 'Bir yılda toplam kaç ay vardır? 📅', spoken: 'Bir yılda kaç ay vardır?', a: '12 ay 📅', d: ['4 ay', '10 ay'], exp: 'Bir takvim yılında 12 ay bulunur.' },
          { q: 'Bugün GÜNLERDEN PAZARTESİ ise YARIN hangi gündür? ☀️', spoken: 'Bugün günlerden Pazartesi ise yarın hangi gündür?', a: 'Salı ☀️', d: ['Çarşamba', 'Pazar'], exp: 'Pazartesi gününden sonra Salı gelir.' },
          { q: 'Bugün GÜNLERDEN ÇARŞAMBA ise DÜN hangi gündü? 📅', spoken: 'Bugün Çarşamba ise dün hangi gündü?', a: 'Salı 📅', d: ['Pazartesi', 'Perşembe'], exp: 'Çarşamba gününden bir önceki gün Salı\'dır.' }
        ];
        const item = timeItems[Math.floor(Math.random() * timeItems.length)];
        return { question: item.q, spokenText: item.spoken, correct: item.a, distractors: item.d, explanation: item.exp };
      }
    },

    // Konu 5: Veriden Olasılığa (Tablo ve Grafik Dedektifi)
    generateGrade1DataTables() {
      const mode = Math.floor(Math.random() * 3);
      if (mode === 0) {
        // Meyve Tablosu (3 Kategori)
        const apples = Math.floor(Math.random() * 4) + 4; // 4..7
        const bananas = Math.floor(Math.random() * 3) + 2; // 2..4
        const strawberries = Math.floor(Math.random() * 3) + 1; // 1..3
        const qType = Math.floor(Math.random() * 3);
        if (qType === 0) {
          return {
            question: '📊 [Tablo: Elma: ' + apples + ' tane 🍎 | Muz: ' + bananas + ' tane 🍌 | Çilek: ' + strawberries + ' tane 🍓]\nTabloya göre EN ÇOK hangi meyveden vardır? 🔍',
            spokenText: 'Elma ' + apples + ', muz ' + bananas + ', çilek ' + strawberries + ' tane. Tabloya göre en çok hangi meyve vardır?',
            correct: 'Elma (' + apples + ' tane) 🍎',
            distractors: ['Muz (' + bananas + ' tane) 🍌', 'Çilek (' + strawberries + ' tane) 🍓'],
            explanation: apples + ' sayısı ' + bananas + ' ve ' + strawberries + '\'ten daha büyüktür. En çok elma vardır.'
          };
        } else if (qType === 1) {
          return {
            question: '📊 [Tablo: Elma: ' + apples + ' 🍎 | Muz: ' + bananas + ' 🍌 | Çilek: ' + strawberries + ' 🍓]\nTabloya göre EN AZ hangi meyveden vardır? 🔍',
            spokenText: 'Elma ' + apples + ', muz ' + bananas + ', çilek ' + strawberries + ' tane. Tabloya göre en az hangi meyve vardır?',
            correct: 'Çilek (' + strawberries + ' tane) 🍓',
            distractors: ['Elma (' + apples + ' tane) 🍎', 'Muz (' + bananas + ' tane) 🍌'],
            explanation: strawberries + ' sayısı diğerlerinden küçüktür. En az çilek vardır.'
          };
        } else {
          const diff = apples - bananas;
          return {
            question: '📊 [Tablo: Elma: ' + apples + ' 🍎 | Muz: ' + bananas + ' 🍌]\nElmaların sayısı muzlardan KAÇ FAZLADIR? 🍎➖🍌',
            spokenText: 'Elma ' + apples + ', muz ' + bananas + ' tane. Elmalar muzlardan kaç fazladır?',
            correct: diff.toString(),
            distractors: [(diff + 1).toString(), Math.max(1, diff - 1).toString()],
            explanation: apples + ' - ' + bananas + ' = ' + diff + ' fazladır.'
          };
        }
      } else if (mode === 1) {
        // Oyuncak Tablosu (Araba, Top, Ayıcık)
        const cars = 5, balls = 3, bears = 4;
        const total = cars + balls + bears;
        return {
          question: '📊 [Sepet: 5 Araba 🚗 | 3 Top ⚽ | 4 Oyuncak Ayı 🧸]\nSepette TOPLAM kaç oyuncak vardır? 🧸➕⚽➕🚗',
          spokenText: 'Sepette 5 araba, 3 top ve 4 oyuncak ayı vardır. Toplam kaç oyuncak vardır?',
          correct: total + ' oyuncak',
          distractors: [(total + 2) + ' oyuncak', (total - 2) + ' oyuncak'],
          explanation: '5 + 3 + 4 = ' + total + ' oyuncak eder.'
        };
      } else {
        // Hayvan Grafiği (Kedi, Köpek, Kuş)
        return {
          question: '📊 [Bahçe: 6 Kedi 🐱 | 4 Köpek 🐶 | 2 Kuş 🐦]\nKediler köpeklerden kaç fazladır? (6 - 4) 🐱➖🐶',
          spokenText: 'Bahçede 6 kedi ve 4 köpek var. Kediler köpeklerden kaç fazladır?',
          correct: '2',
          distractors: ['3', '1'],
          explanation: '6 - 4 = 2 fazladır.'
        };
      }
    },

    // Matematik Tüm Müfredat Karma Motoru
    generateGrade1MathKarma() {
      const topicIdx = Math.floor(Math.random() * 5);
      if (topicIdx === 0) return this.generateGrade1SpatialGeo();
      if (topicIdx === 1) return this.generateGrade1NumbersQuantities();
      if (topicIdx === 2) return this.generateGrade1OperationsPatterns();
      if (topicIdx === 3) return this.generateGrade1MeasureMoneyTime();
      return this.generateGrade1DataTables();
    },


    // --- 3. DERS: TÜRKÇE (2026 Maarif Modeli - Okuma Anlama, Zıt Kavramlar, Cümle & Noktalama) ---

    // Konu 1: Dinleme ve Görsel Okuma Havuzu (22 Soru)
    grade1TurkishListeningComprehensionPool: [
      { q: '🔊 "Ali bahçede sarı köpeğiyle neşeyle top oynuyor."\nBu cümleyi anlatan görsel hangisidir? 🐕⚽', spokenText: 'Ali bahçede sarı köpeğiyle neşeyle top oynuyor. Bu cümleyi anlatan görsel hangisidir?', a: 'Top oynayan çocuk ve sevimli köpek 🐕⚽', d: ['Denizde yüzen balık 🐟', 'Gökyüzünde uçan uçak ✈️'], exp: 'Cümle bahçede köpekle top oynamayı anlatmaktadır.' },
      { q: '🔊 "Gökyüzünde kara bulutlar belirdi, yağmur başlayınca Elif renkli şemsiyesini açtı."\nElif yağmurdan korunmak için ne yapmıştır? ☔', spokenText: 'Gökyüzünde kara bulutlar belirdi, yağmur başlayınca Elif renkli şemsiyesini açtı. Elif ne yapmıştır?', a: 'Şemsiyesini açmıştır ☔', d: ['Güneş gözlüğü takmıştır 🕶️', 'Denize atlamıştır 🏊‍♀️'], exp: 'Elif yağmurdan korunmak için şemsiyesini açmıştır.' },
      { q: '🔊 "Küçük kedi Minnoş ağacın tepesine çıktı ama aşağı inemedi. İtfaiyeci merdivenle onu kurtardı."\nKediyi ağaçtan kim kurtarmıştır? 🚒', spokenText: 'Küçük kedi Minnoş ağacın tepesine çıktı ama aşağı inemedi. İtfaiyeci merdivenle onu kurtardı. Kediyi kim kurtarmıştır?', a: 'İtfaiyeci 🚒', d: ['Doktor 🩺', 'Aşçı 🍳'], exp: 'Kedi Minnoş\'u itfaiyeci merdivenle kurtarmıştır.' },
      { q: '⏳ Olayların oluş sırasına göre ÖNCE hangisi yapılır? 🧼🥪', spokenText: 'Olayların oluş sırasına göre önce hangisi yapılır?', a: 'Eller sabunla yıkanır 🧼', d: ['Yemek afiyetle yenir 🥪', 'Dişler fırçalanır 🪥'], exp: 'Yemek yemeden önce ilk olarak eller su ve sabunla yıkanır.' },
      { q: '⏳ Fidan yetiştirirken ÖNCE hangisi yapılır? 🌱', spokenText: 'Fidan yetiştirirken ilk önce hangisi yapılır?', a: 'Tohum toprağa ekilir 🌱', d: ['Ağaçtan elma toplanır 🍎', 'Kocaman dallar budanır 🌳'], exp: 'Bitkinin büyümesi için önce tohum toprağa ekilir.' },
      { q: '🔊 "Sabah horozun ötüşüyle uyanan Ahmet, elini yüzünü yıkayıp kahvaltısını yaptı."\nAhmet\'i sabah kim uyandırmıştır? 🐓', spokenText: 'Sabah horozun ötüşüyle uyanan Ahmet kahvaltısını yaptı. Ahmet\'i kim uyandırmıştır?', a: 'Horozun ötüşü 🐓', d: ['Çalar saat zili ⏰', 'Televizyon sesi 📺'], exp: 'Ahmet horozun ötüşüyle uyanmıştır.' },
      { q: '🔊 "Zeynep kütüphaneden aldığı resimli masal kitabını sessizce okudu."\nZeynep kütüphanede ne yapmıştır? 📖', spokenText: 'Zeynep kütüphaneden aldığı resimli masal kitabını okudu. Zeynep kütüphanede ne yapmıştır?', a: 'Masal kitabı okumuştur 📖', d: ['Top oynamıştır ⚽', 'Resim boyamıştır 🎨'], exp: 'Zeynep kütüphanede kitap okumuştur.' },
      { q: '🔊 "Kuşlar sıcak ülkelere uçtu, ağaçlar sarı yapraklarını döktü."\nBu cümle hangi mevsimi anlatmaktadır? 🍂', spokenText: 'Kuşlar sıcak ülkelere uçtu, ağaçlar yapraklarını döktü. Bu cümle hangi mevsimi anlatır?', a: 'Sonbahar 🍂', d: ['Yaz ☀️', 'İlkbahar 🌸'], exp: 'Ağaçların yaprak dökmesi sonbahar mevsiminin özelliğidir.' },
      { q: '⏳ Okula gitmeden önce ÖNCE hangisi yapılır? 🎒', spokenText: 'Okula gitmeden önce sabah ilk ne yapılır?', a: 'Yataktan kalkıp kahvaltı yapılır 🍳', d: ['Akşam ödevi yapılır 📝', 'Uykudan önce masal dinlenir 🌙'], exp: 'Güne başlarken önce uyanıp besleyici bir kahvaltı yapılır.' },
      { q: '🔊 "Emre bahçedeki çiçekleri suladı, açan gülleri koklayıp gülümsedi."\nEmre bahçede ne yapmıştır? 🌷', spokenText: 'Emre bahçedeki çiçekleri suladı. Emre ne yapmıştır?', a: 'Çiçekleri sulamıştır 🌷💧', d: ['Çiçekleri koparmıştır ✂️', 'Ağaca tırmanmıştır 🌲'], exp: 'Emre çiçeklere su vererek onları sulamıştır.' },
      { q: '🔊 "Bembeyaz karlar her yeri kaplayınca çocuklar bahçede kardan adam yaptı."\nÇocuklar kardan adamı hangi mevsimde yapmıştır? ⛄', spokenText: 'Bembeyaz karlar her yeri kaplayınca kardan adam yapıldı. Hangi mevsimdir?', a: 'Kış ❄️', d: ['Yaz ☀️', 'İlkbahar 🌸'], exp: 'Kardan adam kar yağan kış mevsiminde yapılır.' },
      { q: '🔊 "Güneş açınca denize koşan çocuklar kumdan kale yaptı."\nÇocuklar sahilde ne inşa etmiştir? 🏖️', spokenText: 'Güneş açınca denize koşan çocuklar kumdan ne yapmıştır?', a: 'Kumdan kale 🏰', d: ['Kardan adam ⛄', 'Taş köprü 🌉'], exp: 'Sahilde kumdan kale yapmışlardır.' }
    ],

    // Dinleme ve Görsel Okuma Üreteci
    generateGrade1ListeningComprehension() {
      const item = this.drawFromPool(this.grade1TurkishListeningComprehensionPool, "grade1TurkishListeningComprehensionPool");
      return {
        question: item.q,
        spokenText: item.spokenText || item.q,
        correct: item.a,
        distractors: item.d,
        explanation: item.exp
      };
    },

    // Konu 2: Zıt Kavramlar Havuzu (35+ Kelime)
    grade1AntonymsPool: [
      { q: '"Büyük" kelimesinin zıt anlamlısı nedir? 🐘', spokenText: 'Büyük kelimesinin zıt anlamlısı nedir?', a: 'Küçük 🐁', d: ['Geniş', 'İri'], exp: 'Büyük ve Küçük birbirinin zıttıdır.' },
      { q: '"Uzun" kelimesinin zıt anlamlısı nedir? 🦒', spokenText: 'Uzun kelimesinin zıt anlamlısı nedir?', a: 'Kısa', d: ['İnce', 'Düz'], exp: 'Uzun boyun zıttı kısa boydur.' },
      { q: '"Sıcak" kelimesinin zıt anlamlısı nedir? ☀️', spokenText: 'Sıcak kelimesinin zıt anlamlısı nedir?', a: 'Soğuk ❄️', d: ['Ilık', 'Buz'], exp: 'Sıcak havanın zıttı soğuk havadır.' },
      { q: '"Hızlı" kelimesinin zıt anlamlısı nedir? 🐆', spokenText: 'Hızlı kelimesinin zıt anlamlısı nedir?', a: 'Yavaş 🐢', d: ['Durgun', 'Sakin'], exp: 'Çita hızlıdır, kaplumbağa yavaştır.' },
      { q: '"Açık" kapının zıt anlamlısı nedir? 🚪', spokenText: 'Açık kelimesinin zıt anlamlısı nedir?', a: 'Kapalı 🚪', d: ['Koyu', 'Kilitli'], exp: 'Açık kapının karşıtı kapalıdır.' },
      { q: '"Dolu" bardağın zıt anlamlısı nedir? 🥛', spokenText: 'Dolu kelimesinin zıt anlamlısı nedir?', a: 'Boş 🥛', d: ['Yarım', 'Temiz'], exp: 'Dolu bardağın karşıtı boş bardaktır.' },
      { q: '"Gece" kelimesinin zıt anlamlısı nedir? 🌙', spokenText: 'Gece kelimesinin zıt anlamlısı nedir?', a: 'Gündüz ☀️', d: ['Akşam', 'Sabah'], exp: 'Gece karanlık, gündüz aydınlıktır.' },
      { q: '"Ağır" taşın zıt anlamlısı nedir? 🪨', spokenText: 'Ağır kelimesinin zıt anlamlısı nedir?', a: 'Hafif 🪶', d: ['Küçük', 'Yumuşak'], exp: 'Taş ağırdır, kuş tüyü hafiftir.' },
      { q: '"Ön" kelimesinin zıt anlamlısı nedir? 🚗', spokenText: 'Ön kelimesinin zıt anlamlısı nedir?', a: 'Arka', d: ['Yan', 'Üst'], exp: 'Ön tarafın karşıtı arka taraftır.' },
      { q: '"Sert" tuğlanın zıt anlamlısı nedir? 🧱', spokenText: 'Sert kelimesinin zıt anlamlısı nedir?', a: 'Yumuşak 🧸', d: ['İnce', 'Kırılgan'], exp: 'Tuğla serttir, pamuk yumuşaktır.' },
      { q: '"Aşağı" kelimesinin zıt anlamlısı nedir? ⬇️', spokenText: 'Aşağı kelimesinin zıt anlamlısı nedir?', a: 'Yukarı ⬆️', d: ['İleri', 'Geri'], exp: 'Aşağı ve yukarı birbirinin zıttıdır.' },
      { q: '"Taze" ekmeğin zıt anlamlısı nedir? 🥖', spokenText: 'Taze kelimesinin zıt anlamlısı nedir?', a: 'Bayat 🥖', d: ['Çürük', 'Eski'], exp: 'Taze ekmeğin zıttı bayat ekmektir.' },
      { q: '"Temiz" ellerin zıt anlamlısı nedir? 🧼', spokenText: 'Temiz kelimesinin zıt anlamlısı nedir?', a: 'Kirli', d: ['Islak', 'Tozlu'], exp: 'Temiz olmanın karşıtı kirlidir.' },
      { q: '"Acı" biberin tat olarak zıt anlamlısı nedir? 🌶️', spokenText: 'Acı biberin zıt anlamlısı nedir?', a: 'Tatlı 🍯', d: ['Ekşi', 'Tuzlu'], exp: 'Acının zıttı tatlıdır.' },
      { q: '"İyi" kalplinin zıt anlamlısı nedir? 😇', spokenText: 'İyi kelimesinin zıt anlamlısı nedir?', a: 'Kötü 😈', d: ['Zayıf', 'Çirkin'], exp: 'İyi ve kötü karşıt kavramlardır.' },
      { q: '"Siyah" rengin zıt anlamlısı nedir? ⚫', spokenText: 'Siyah kelimesinin zıt anlamlısı nedir?', a: 'Beyaz ⚪', d: ['Gri', 'Koyu'], exp: 'Siyahın karşıtı beyazdır.' },
      { q: '"Doğru" cevabın zıt anlamlısı nedir? ✅', spokenText: 'Doğru kelimesinin zıt anlamlısı nedir?', a: 'Yanlış ❌', d: ['Eksik', 'Yalan'], exp: 'Doğrunun zıttı yanlıştır.' },
      { q: '"Islak" giysinin zıt anlamlısı nedir? 🌧️', spokenText: 'Islak kelimesinin zıt anlamlısı nedir?', a: 'Kuru ☀️', d: ['Nemli', 'Sıcak'], exp: 'Islanan giysi güneşte kurur.' },
      { q: '"Zor" sorunun zıt anlamlısı nedir? 🧩', spokenText: 'Zor kelimesinin zıt anlamlısı nedir?', a: 'Kolay ✨', d: ['Basit', 'Kısa'], exp: 'Zor bulmacanın zıttı kolaydır.' },
      { q: '"Neşeli" çocuğun zıt anlamlısı nedir? 😄', spokenText: 'Neşeli kelimesinin zıt anlamlısı nedir?', a: 'Üzgün 😢', d: ['Kızgın', 'Yorgun'], exp: 'Neşeli olmanın zıttı üzgün olmaktır.' },
      { q: '"İç" kelimesinin zıt anlamlısı nedir? 📦', spokenText: 'İç kelimesinin zıt anlamlısı nedir?', a: 'Dış', d: ['Üst', 'Alt'], exp: 'Kutunun içi ve dışı karşıttır.' },
      { q: '"Uzak" memleketin zıt anlamlısı nedir? 🗺️', spokenText: 'Uzak kelimesinin zıt anlamlısı nedir?', a: 'Yakın 🏡', d: ['Hızlı', 'Geniş'], exp: 'Uzağın zıttı yakındır.' },
      { q: '"Genç" delikanlının zıt anlamlısı nedir? 👦', spokenText: 'Genç kelimesinin zıt anlamlısı nedir?', a: 'Yaşlı 👴', d: ['Büyük', 'Yorgun'], exp: 'Gencin zıttı yaşlıdır.' },
      { q: '"Cesur" kahramanın zıt anlamlısı nedir? 🦁', spokenText: 'Cesur kelimesinin zıt anlamlısı nedir?', a: 'Korkak 🐭', d: ['Küçük', 'Zayıf'], exp: 'Cesur olmanın zıttı korkak olmaktır.' },
      { q: '"Giriş" kapısının zıt anlamlısı nedir? 🚪', spokenText: 'Giriş kelimesinin zıt anlamlısı nedir?', a: 'Çıkış 🚶‍♂️', d: ['Açılış', 'Dönüş'], exp: 'Girişin zıttı çıkıştır.' },
      { q: '"Gülmek" eyleminin zıt anlamlısı nedir? 😊', spokenText: 'Gülmek kelimesinin zıt anlamlısı nedir?', a: 'Ağlamak 😭', d: ['Susmak', 'Kızmak'], exp: 'Gülmenin zıttı ağlamaktır.' },
      { q: '"Gelmek" fiilinin zıt anlamlısı nedir? 🏃‍♂️', spokenText: 'Gelmek kelimesinin zıt anlamlısı nedir?', a: 'Gitmek 🚶‍♂️', d: ['Koşmak', 'Durmak'], exp: 'Gelmenin zıttı gitmektir.' },
      { q: '"Almak" kelimesinin zıt anlamlısı nedir? 🎁', spokenText: 'Almak kelimesinin zıt anlamlısı nedir?', a: 'Vermek 🤲', d: ['Satmak', 'Koymak'], exp: 'Almanın zıttı vermektir.' },
      { q: '"Yeni" ayakkabının zıt anlamlısı nedir? ✨', spokenText: 'Yeni kelimesinin zıt anlamlısı nedir?', a: 'Eski 📦', d: ['Kırık', 'Tozlu'], exp: 'Yeninin zıttı eskidir.' },
      { q: '"Aydınlık" odanın zıt anlamlısı nedir? 💡', spokenText: 'Aydınlık kelimesinin zıt anlamlısı nedir?', a: 'Karanlık 🌑', d: ['Dar', 'Koyu'], exp: 'Aydınlığın zıttı karanlıktır.' },
      { q: '"Kalın" kitabın zıt anlamlısı nedir? 📚', spokenText: 'Kalın kelimesinin zıt anlamlısı nedir?', a: 'İnce 📖', d: ['Hafif', 'Dar'], exp: 'Kalının zıttı incedir.' }
    ],

    // Konu 3: Anlamlı ve Kurallı Cümle / Temel Noktalama Havuzu (20 Soru)
    grade1SentencePunctuationPool: [
      { q: '"Ali okula gitti (  )"\nCümlenin sonuna hangi noktalama işareti gelmelidir? ✍️', spokenText: 'Ali okula gitti. Cümlenin sonuna hangi işaret gelir?', a: 'Nokta (.)', d: ['Soru İşareti (?)', 'Ünlem (!)'], exp: 'Tamamlanmış düz cümlelerin sonuna nokta (.) konur.' },
      { q: '"Senin adın ne (  )"\nCümlenin sonuna hangi noktalama işareti gelmelidir? ✍️', spokenText: 'Senin adın ne? Cümlenin sonuna hangi işaret gelir?', a: 'Soru İşareti (?)', d: ['Nokta (.)', 'Virgül (,)'], exp: 'Soru soran cümlelerin sonuna soru işareti (?) konur.' },
      { q: '"Bugün hava çok güzel (  )"\nCümlenin sonuna hangi noktalama işareti gelmelidir? ☀️', spokenText: 'Bugün hava çok güzel. Cümle sonuna hangi işaret gelir?', a: 'Nokta (.)', d: ['Soru İşareti (?)', 'Kesme İşareti (\')'], exp: 'Düz bilgi veren cümlenin sonuna nokta (.) konur.' },
      { q: '"Kalemimi kim aldı (  )"\nCümlenin sonuna hangi noktalama işareti gelmelidir? ✏️', spokenText: 'Kalemimi kim aldı? Cümlenin sonuna hangi işaret gelir?', a: 'Soru İşareti (?)', d: ['Nokta (.)', 'Kısa Çizgi (-)'], exp: 'Soru sorulduğu için sonuna soru işareti (?) konur.' },
      { q: '"Saat kaç oldu (  )"\nCümlesinin sonuna hangisi gelmelidir? ⏰', spokenText: 'Saat kaç oldu? Cümlesinin sonuna hangisi gelmelidir?', a: 'Soru İşareti (?)', d: ['Nokta (.)', 'Ünlem (!)'], exp: 'Saat sorulduğu için soru işareti (?) gelir.' },
      { q: '"Ayşe süt içti (  )"\nCümlesinin sonuna hangisi konmalıdır? 🥛', spokenText: 'Ayşe süt içti. Cümlenin sonuna hangisi konur?', a: 'Nokta (.)', d: ['Soru İşareti (?)', 'İki Nokta (:)'], exp: 'Biten cümlenin sonuna nokta konur.' },
      { q: 'Cümlelerin İLK HARFİ her zaman nasıl yazılır? 🔤', spokenText: 'Cümlelerin ilk harfi nasıl yazılır?', a: 'Büyük Harfle 🔠', d: ['Küçük Harfle 🔡', 'Rakamla 🔢'], exp: 'Cümleler daima büyük harfle başlar.' },
      { q: 'İnsan isimleri (Ali, Zeynep, Mehmet) daima nasıl harfle başlar? 👦👧', spokenText: 'İnsan isimleri daima nasıl harfle başlar?', a: 'Büyük Harfle 🔠', d: ['Küçük Harfle 🔡', 'Fark etmez'], exp: 'Özel isimler her zaman büyük harfle başlar.' },
      { q: 'Karışık verilen sözcüklerden ANLAMLI ve KURALLI cümle hangisidir?\n[okula - gitti - Can] 🎒', spokenText: 'Karışık sözcüklerden doğru cümle hangisidir?', a: 'Can okula gitti. 🎒', d: ['Gitti Can okula.', 'Okula gitti Can.'], exp: 'Kurallı cümlede işi yapan başta (Can), yapılan eylem sonda olur: Can okula gitti.' },
      { q: 'Karışık verilen sözcüklerden ANLAMLI ve KURALLI cümle hangisidir?\n[kitap - okudu - Elif] 📖', spokenText: 'Karışık sözcüklerden doğru cümle hangisidir?', a: 'Elif kitap okudu. 📖', d: ['Okudu Elif kitap.', 'Kitap Elif okudu.'], exp: 'Kurallı cümle: Elif kitap okudu.' },
      { q: 'Karışık verilen sözcüklerden ANLAMLI cümle hangisidir?\n[yedi - elma - kırmızı - Kerem] 🍎', spokenText: 'Karışık sözcüklerden doğru cümle hangisidir?', a: 'Kerem kırmızı elma yedi. 🍎', d: ['Yedi Kerem elma.', 'Elma yedi kırmızı Kerem.'], exp: 'Doğru sıralama: Kerem kırmızı elma yedi.' },
      { q: 'Hangisi bir SORU cümlesidir? ❓', spokenText: 'Hangisi bir soru cümlesidir?', a: 'Ödevini bitirdin mi? ❓', d: ['Ödevimi bitirdim. 📝', 'Okula gidiyorum. 🎒'], exp: '"Ödevini bitirdin mi?" cümlesi cevap bekleyen bir soru cümlesidir.' }
    ],

    // Cümle & Noktalama Üreteci
    generateGrade1SentencePunctuation() {
      const item = this.drawFromPool(this.grade1SentencePunctuationPool, "grade1SentencePunctuationPool");
      return {
        question: item.q,
        spokenText: item.spokenText || item.q,
        correct: item.a,
        distractors: item.d,
        explanation: item.exp
      };
    },

    // Türkçe Tüm Konular Karma Motoru
    generateGrade1TurkishKarma() {
      const r = Math.random();
      if (r < 0.35) {
        return this.generateGrade1ListeningComprehension();
      } else if (r < 0.70) {
        const raw = this.drawFromPool(this.grade1AntonymsPool, "grade1AntonymsPool");
        return {
          question: raw.q,
          spokenText: raw.spokenText || raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        };
      } else {
        return this.generateGrade1SentencePunctuation();
      }
    },


    // --- 4. MODÜL: 1. SINIF BÜYÜK KARMA DÜELLO (TÜM DERSLER) ---
    generateGrade1GrandDuel() {
      const subjectIdx = Math.floor(Math.random() * 3);
      if (subjectIdx === 0) return this.generateGrade1MathKarma();
      if (subjectIdx === 1) return this.generateGrade1TurkishKarma();
      return this.generateGrade1LifeScienceKarma();
    },

    // Geriye dönük uyumluluk takma adları
    generateGrade1Math() { return this.generateGrade1MathKarma(); },
    generateGrade1Rhythmic() { return this.generateGrade1NumbersQuantities(); },
    grade1ShapesAndMoneyPool: [
      { q: 'Hangi geometrik şeklin 4 kenarı, 4 köşesi vardır ve tüm kenarları EŞİTTİR?', a: 'Kare 🟦', d: ['Üçgen 🔺', 'Çember ⚪'], exp: 'Karenin 4 eşit kenarı ve 4 dik köşesi vardır.' },
      { q: '3 kenarı ve 3 köşesi olan geometrik şekil hangisidir?', a: 'Üçgen 🔺', d: ['Kare 🟦', 'Dikdörtgen 🚪'], exp: 'Üçgenin 3 kenarı ve 3 köşesi bulunur.' },
      { q: 'En büyük madeni paramız hangisidir?', a: '1 Türk Lirası (1 TL) 🪙', d: ['50 Kuruş 🪙', '25 Kuruş 🪙'], exp: 'Madeni paralarımızın en büyüğü 1 TL\'dir.' },
      { q: '1 Türk Lirası (1 TL) kaç kuruşa eşittir?', a: '100 Kuruş 🪙', d: ['50 Kuruş 🪙', '10 Kuruş 🪙'], exp: '1 TL = 100 Kuruştur.' }
    ],
    generateGrade1SyllablesAndLetters() { return this.generateGrade1SentencePunctuation(); },
    grade1SchoolHomeLifePool: [
      { q: 'Sınıfta öğretmenimizden veya arkadaşımızdan söz isterken ne yaparız? ✋', a: 'Parmak kaldırırız ✋', d: ['Bağırarak konuşuruz', 'Ayağa kalkıp gezeriz'], exp: 'Söz hakkı almak için nezaketle parmak kaldırırız.' },
      { q: 'Arkadaşımız bize yardım ettiğinde hangi nezaket sözünü söyleriz? 🤝', a: 'Teşekkür ederim 🙏', d: ['Özür dilerim', 'Rica ederim'], exp: 'Bize yardım eden birine "Teşekkür ederim" deriz.' }
    ],
    grade1HealthSeasonsPool: [
      { q: 'Yemeklerden önce ve sonra ellerimizi ne ile yıkamalıyız? 🧼', a: 'Su ve sabunla 🧼', d: ['Sadece peçeteyle', 'Yıkamamıza gerek yoktur'], exp: 'Mikroplardan korunmak için ellerimizi su ve sabunla en az 20 saniye yıkarız.' }
    ],
    grade1TurkishPool: [
      { q: '"Büyük" kelimesinin zıt anlamlısı nedir? 🐘', a: 'Küçük 🐁', d: ['Geniş', 'İri'], exp: 'Büyük ve Küçük birbirinin zıttıdır.' }
    ],

    // -------------------------------------------------------------
    // 2. SINIF MATEMATİK: 2026 MAARİF MODELİ DİNAMİK MOTORLARI VE HAVUZLARI
    // (100'e Kadar Sayılar, Çarpma Sadece 1-5 ve 10, Bölme <= 20 Kalansız)
    // -------------------------------------------------------------

    // 1. Sayılar ve Nicelikler (100'e Kadar Doğal Sayılar)
    generateGrade2PlaceValue() {
      const mode = Math.floor(Math.random() * 5);

      if (mode === 0) {
        // Onluk ve Birlik Modeli
        const tens = Math.floor(Math.random() * 9) + 1; // 1-9
        const units = Math.floor(Math.random() * 10);   // 0-9
        const num = tens * 10 + units;
        const qType = Math.random() < 0.5;

        if (qType) {
          const question = `${tens} onluk ve ${units} birlikten oluşan doğal sayı kaçtır? 📦`;
          const spokenText = `${tens} onluk ve ${units} birlikten oluşan doğal sayı kaçtır?`;
          const correct = `${num}`;
          const distractors = [
            `${units * 10 + tens}`,
            `${Math.max(10, num + (num > 50 ? -10 : 10))}`
          ];
          return { question, spokenText, correct, distractors, explanation: `${tens} onluk (${tens * 10}) + ${units} birlik = ${num} eder.` };
        } else {
          const question = `${num} doğal sayısında kaç onluk ve kaç birlik vardır? 🔢`;
          const spokenText = `${num} sayısında kaç onluk ve kaç birlik vardır?`;
          const correct = `${tens} onluk, ${units} birlik`;
          const distractors = [
            `${units} onluk, ${tens} birlik`,
            `${tens} onluk, ${(units + 2) % 10} birlik`
          ];
          return { question, spokenText, correct, distractors, explanation: `${num} sayısının onlar basamağında ${tens}, birler basamağında ${units} vardır.` };
        }
      } else if (mode === 1) {
        // Basamak Değeri
        const tens = Math.floor(Math.random() * 9) + 1;
        const units = Math.floor(Math.random() * 9) + 1;
        const num = tens * 10 + units;
        const askTens = Math.random() < 0.5;

        if (askTens) {
          const question = `${num} sayısındaki "${tens}" rakamının basamak değeri kaçtır? 🎯`;
          const spokenText = `${num} sayısındaki ${tens} rakamının basamak değeri kaçtır?`;
          const correct = `${tens * 10}`;
          const distractors = [`${tens}`, `${units * 10}`];
          return { question, spokenText, correct, distractors, explanation: `"${tens}" rakamı onlar basamağında olduğu için basamak değeri ${tens} × 10 = ${tens * 10}'dur.` };
        } else {
          const question = `${num} sayısındaki "${units}" rakamının basamak değeri kaçtır? 🎯`;
          const spokenText = `${num} sayısındaki ${units} rakamının basamak değeri kaçtır?`;
          const correct = `${units}`;
          const distractors = [`${units * 10}`, `${tens * 10}`];
          return { question, spokenText, correct, distractors, explanation: `"${units}" rakamı birler basamağında olduğu için basamak değeri ${units} × 1 = ${units}'tir.` };
        }
      } else if (mode === 2) {
        // En Yakın Onluğa Yuvarlama
        const tens = Math.floor(Math.random() * 9) + 1; // 1-9
        const units = Math.floor(Math.random() * 9) + 1; // 1-9
        const num = tens * 10 + units;
        const rounded = units >= 5 ? (tens + 1) * 10 : tens * 10;
        const otherTens = units >= 5 ? tens * 10 : (tens + 1) * 10;
        const thirdTens = (tens > 2 ? tens - 1 : tens + 2) * 10;

        const question = `${num} doğal sayısı en yakın hangi onluğa yuvarlanır? 🎯`;
        const spokenText = `${num} sayısı en yakın hangi onluğa yuvarlanır?`;
        const correct = `${rounded}`;
        const distractors = [`${otherTens}`, `${thirdTens}`];
        return {
          question,
          spokenText,
          correct,
          distractors,
          explanation: `${num} sayısının birler basamağında ${units} vardır. ${units >= 5 ? '5 ve 5\'ten büyük olduğu için bir sonraki onluk olan ' + rounded + '\'a yuvarlanır.' : '5\'ten küçük olduğu için kendi onluğu olan ' + rounded + '\'a yuvarlanır.'}`
        };
      } else if (mode === 3) {
        // Ritmik Sayma (2, 3, 4, 5, 10)
        const steps = [2, 3, 4, 5, 10];
        const step = steps[Math.floor(Math.random() * steps.length)];
        const maxStart = 100 - (step * 4);
        const start = Math.floor(Math.random() * Math.floor(maxStart / step)) * step + step;
        const seq = [start, start + step, start + (step * 2), start + (step * 3)];
        const missingIdx = Math.floor(Math.random() * 4);
        const ans = seq[missingIdx];
        const displaySeq = seq.map((val, idx) => idx === missingIdx ? '?' : val).join(' - ');

        const question = `${displaySeq} (${step}'er ileri ritmik saymada "?" yerine kaç gelmelidir? 🚂)`;
        const spokenText = `${step}'er ileri ritmik saymada soru işareti yerine hangi sayı gelmelidir?`;
        const correct = `${ans}`;
        const distractors = [
          `${ans - step > 0 ? ans - step : ans + (step * 2)}`,
          `${ans + step <= 100 ? ans + step : ans - (step * 2)}`
        ];
        return { question, spokenText, correct, distractors, explanation: `Kural ${step}'er artarak saymaktır. Eksik sayı ${ans}'dir.` };
      } else {
        // Deste ve Düzine / Sayı Örüntüsü
        const pool = [
          { q: '1 deste kalem ile 1 düzine kalemin toplamı kaç kalem eder? ✏️', spoken: 'Bir deste ile bir düzinenin toplamı kaçtır?', a: '22', d: ['20', '24'], exp: '1 deste = 10, 1 düzine = 12. Toplam: 10 + 12 = 22 eder.' },
          { q: '3 deste silgi toplam kaç silgi eder? 🧼', spoken: 'Üç deste silgi kaç silgi eder?', a: '30', d: ['20', '36'], exp: '1 deste 10 tanedir. 3 × 10 = 30 silgi eder.' },
          { q: '2 düzine bardak toplam kaç bardak eder? 🥛', spoken: 'İki düzine bardak kaç bardak eder?', a: '24', d: ['20', '22'], exp: '1 düzine 12 tanedir. 2 × 12 = 24 bardak eder.' },
          { q: '4 deste fındık, 3 düzine fındıktan kaç fazladır? 🌰', spoken: 'Dört deste fındık, üç düzine fındıktan kaç fazladır?', a: '4', d: ['2', '6'], exp: '4 deste = 40. 3 düzine = 36. Fark: 40 - 36 = 4 fazladır.' },
          { q: '18 - 22 - 26 - ? Sayı örüntüsünde soru işareti yerine hangi sayı gelmelidir? 🧩', spoken: 'Sayı örüntüsünde soru işareti yerine ne gelmelidir?', a: '30', d: ['28', '32'], exp: 'Örüntü dörder artmaktadır. 26 + 4 = 30 olur.' },
          { q: '50 - 45 - 40 - ? Geriye doğru beşer azalan örüntüde soru işareti kaçtır? 🧩', spoken: 'Geriye doğru beşer azalan örüntüde soru işareti kaçtır?', a: '35', d: ['30', '38'], exp: 'Örüntü beşer azalmaktadır. 40 - 5 = 35 olur.' }
        ];
        const item = pool[Math.floor(Math.random() * pool.length)];
        return { question: item.q, spokenText: item.spoken, correct: item.a, distractors: item.d, explanation: item.exp };
      }
    },

    // 2. Toplama ve Çıkarma İşlemleri (100 İçinde)
    generateGrade2Operations() {
      const mode = Math.floor(Math.random() * 5);

      if (mode === 0) {
        // 2 Basamaklı Toplama (Sonuç <= 100)
        const a = Math.floor(Math.random() * 45) + 15; // 15-59
        const maxB = 100 - a;
        const b = Math.floor(Math.random() * (maxB - 10)) + 10;
        const sum = a + b;
        const question = `${a} + ${b} işleminin sonucu kaçtır? ➕`;
        const spokenText = `${a} artı ${b} işleminin sonucu kaçtır?`;
        const correct = `${sum}`;
        const distractors = [
          `${sum - 10 > 0 ? sum - 10 : sum + 5}`,
          `${sum + (sum % 2 === 0 ? 2 : -2)}`
        ];
        return { question, spokenText, correct, distractors, explanation: `${a} + ${b} = ${sum} eder.` };
      } else if (mode === 1) {
        // 2 Basamaklı Çıkarma (Onluk bozarak / eldesiz, Eksilen <= 100)
        const a = Math.floor(Math.random() * 60) + 35; // 35-94
        const b = Math.floor(Math.random() * (a - 15)) + 12; // < a
        const diff = a - b;
        const question = `${a} - ${b} işleminin sonucu kaçtır? ➖`;
        const spokenText = `${a} eksi ${b} işleminin sonucu kaçtır?`;
        const correct = `${diff}`;
        const distractors = [
          `${diff + 10 <= 100 ? diff + 10 : diff - 5}`,
          `${diff + (diff % 2 === 0 ? 2 : -2)}`
        ];
        return { question, spokenText, correct, distractors, explanation: `${a} - ${b} = ${diff} eder.` };
      } else if (mode === 2) {
        // Verilmeyen toplananı bulma (A + ? = C)
        const a = Math.floor(Math.random() * 40) + 15;
        const missing = Math.floor(Math.random() * 40) + 12;
        const total = a + missing;

        const question = `${a} + ? = ${total} işleminde verilmeyen toplanan sayı kaçtır? ❓`;
        const spokenText = `${a} artı soru işareti eşittir ${total} işleminde verilmeyen sayı kaçtır?`;
        const correct = `${missing}`;
        const distractors = [
          `${missing + 10 <= 100 ? missing + 10 : missing - 5}`,
          `${missing - 2 > 0 ? missing - 2 : missing + 4}`
        ];
        return { question, spokenText, correct, distractors, explanation: `Verilmeyen toplananı bulmak için toplamdan verilen sayı çıkarılır: ${total} - ${a} = ${missing}.` };
      } else if (mode === 3) {
        // Zihinden ve Tahmini İşlemler
        const pool = [
          { q: '50 + 30 işlemini zihinden yaparsak sonuç kaç olur? 🧠', spoken: '50 artı 30 işlemini zihinden yaparsak sonuç kaç olur?', a: '80', d: ['70', '90'], exp: '5 onluk + 3 onluk = 8 onluk, yani 80 eder.' },
          { q: '90 - 40 işlemini zihinden yaparsak sonuç kaç olur? 🧠', spoken: '90 eksi 40 işlemini zihinden yaparsak sonuç kaç olur?', a: '50', d: ['40', '60'], exp: '9 onluk - 4 onluk = 5 onluk, yani 50 eder.' },
          { q: '60 + 20 işleminin sonucu zihinden kaçtır? 🧠', spoken: '60 artı 20 işleminin sonucu kaçtır?', a: '80', d: ['70', '90'], exp: '6 onluk + 2 onluk = 80 eder.' },
          { q: '80 - 50 işleminin sonucu zihinden kaçtır? 🧠', spoken: '80 eksi 50 işleminin sonucu kaçtır?', a: '30', d: ['20', '40'], exp: '8 onluktan 5 onluk çıkarsa 3 onluk (30) kalır.' },
          { q: '32 + 49 işleminin tahmini sonucu en yakın onluklara yuvarlanarak kaçtır? 🎯', spoken: '32 artı 49 işleminin tahmini sonucu en yakın onluklara yuvarlanarak kaçtır?', a: '80', d: ['70', '90'], exp: '32 -> 30\'a, 49 -> 50\'ye yuvarlanır. 30 + 50 = 80 olur.' },
          { q: '71 - 29 işleminin tahmini sonucu en yakın onluklarla kaçtır? 🎯', spoken: '71 eksi 29 işleminin tahmini sonucu kaçtır?', a: '40', d: ['50', '30'], exp: '71 -> 70\'e, 29 -> 30\'a yuvarlanır. 70 - 30 = 40 olur.' }
        ];
        const item = pool[Math.floor(Math.random() * pool.length)];
        return { question: item.q, spokenText: item.spoken, correct: item.a, distractors: item.d, explanation: item.exp };
      } else {
        // Günlük Hayat Problemleri
        const problems = [
          { q: 'Bir otobüste 38 yolcu vardı. İlk durakta 17 yolcu daha bindi. Otobüste kaç yolcu oldu? 🚌', spoken: 'Otobüste 38 yolcu vardı. 17 yolcu daha bindi. Toplam kaç yolcu oldu?', a: '55 yolcu', d: ['45 yolcu', '51 yolcu'], exp: '38 + 17 = 55 yolcu olur.' },
          { q: 'Ali\'nin 64 lirası vardı. 28 lirasına hikaye kitabı aldı. Ali\'nin kaç lirası kaldı? 📚', spoken: 'Ali\'nin 64 lirası vardı. 28 liraya kitap aldı. Kaç lirası kaldı?', a: '36 lira', d: ['46 lira', '34 lira'], exp: '64 - 28 = 36 lira kalır.' },
          { q: 'Bir çiftlikte 27 koyun, koyunlardan 15 fazla kuzu vardır. Çiftlikte kaç kuzu vardır? 🐑', spoken: 'Çiftlikte 27 koyun ve 15 fazla kuzu vardır. Kaç kuzu vardır?', a: '42 kuzu', d: ['32 kuzu', '45 kuzu'], exp: '27 + 15 = 42 kuzu vardır.' },
          { q: 'Ayşe 80 sayfalık kitabın 45 sayfasını okudu. Okunacak kaç sayfa kaldı? 📖', spoken: 'Ayşe 80 sayfalık kitabın 45 sayfasını okudu. Kaç sayfa kaldı?', a: '35 sayfa', d: ['45 sayfa', '25 sayfa'], exp: '80 - 45 = 35 sayfa kalır.' },
          { q: 'Bir manavda sabah 52 kg elma vardı. Gün boyu 36 kg elma satıldı. Geriye kaç kg elma kaldı? 🍎', spoken: '52 kilo elmanın 36 kilosu satıldı. Geriye kaç kilo elma kaldı?', a: '16 kg', d: ['26 kg', '18 kg'], exp: '52 - 36 = 16 kg elma kalır.' }
        ];
        const item = problems[Math.floor(Math.random() * problems.length)];
        return { question: item.q, spokenText: item.spoken, correct: item.a, distractors: item.d, explanation: item.exp };
      }
    },

    // 3. Çarpma ve Bölme (1-5 ve 10'lar ile Çarpma, 20 İçinde Kalansız Bölme)
    generateGrade2MultiplicationDivision() {
      const isMult = Math.random() < 0.65;

      if (isMult) {
        const mode = Math.floor(Math.random() * 4);
        if (mode === 0) {
          // Çarpmanın tekrarlı toplama anlamı
          const factorA = Math.floor(Math.random() * 4) + 2; // 2-5
          const factorB = Math.floor(Math.random() * 5) + 1; // 1-5
          const sumArray = Array(factorA).fill(factorB);
          const sumStr = sumArray.join(' + ');

          const question = `${sumStr} toplama işlemi çarpma olarak nasıl yazılır? ✖️`;
          const spokenText = `${sumStr} toplama işlemi çarpma olarak nasıl yazılır?`;
          const correct = `${factorA} × ${factorB}`;
          const distractors = [
            `${factorA + 1} × ${factorB}`,
            `${factorA} × ${factorB + 1}`
          ];
          return { question, spokenText, correct, distractors, explanation: `${factorA} tane ${factorB}'nin toplamı ${factorA} × ${factorB} olarak yazılır.` };
        } else if (mode === 1) {
          // 0 ve 1'in Etkisi
          const pool = [
            { q: 'Çarpma işleminde "0" (sıfır) hangi elemandır? ✖️', spoken: 'Çarpma işleminde sıfır hangi elemandır?', a: 'Yutan eleman (Sonucu 0 yapar) 🕳️', d: ['Etkisiz eleman', 'Büyüten eleman'], exp: 'Sıfır çarpmada yutan elemandır; ne ile çarpılırsa sonuç sıfır olur.' },
            { q: 'Çarpma işleminde "1" (bir) hangi elemandır? ✖️', spoken: 'Çarpma işleminde bir hangi elemandır?', a: 'Etkisiz eleman (Sayıyı değiştirmez) ✨', d: ['Yutan eleman', 'Sıfırlayan eleman'], exp: 'Bir çarpmada etkisiz elemandır; sayıyı olduğu gibi korur.' },
            { q: '9 × 1 işleminin sonucu kaçtır? ✖️', spoken: 'Dokuz kere bir işleminin sonucu kaçtır?', a: '9', d: ['1', '0'], exp: '1 etkisiz elemandır: 9 × 1 = 9 eder.' },
            { q: '8 × 0 işleminin sonucu kaçtır? ✖️', spoken: 'Sekiz kere sıfır işleminin sonucu kaçtır?', a: '0', d: ['8', '1'], exp: '0 yutan elemandır: 8 × 0 = 0 eder.' }
          ];
          const item = pool[Math.floor(Math.random() * pool.length)];
          return { question: item.q, spokenText: item.spoken, correct: item.a, distractors: item.d, explanation: item.exp };
        } else {
          // Çarpım Tablosu (SADECE 1, 2, 3, 4, 5 ve 10'lar!)
          const validFactors = [1, 2, 3, 4, 5, 10];
          const a = validFactors[Math.floor(Math.random() * validFactors.length)];
          const b = Math.floor(Math.random() * 9) + 1; // 1-9
          const prod = a * b;

          const question = `${a} × ${b} işleminin sonucu kaçtır? ✖️`;
          const spokenText = `${a} kere ${b} işleminin sonucu kaçtır?`;
          const correct = `${prod}`;
          const distractors = [
            `${prod + a <= 100 ? prod + a : prod - a}`,
            `${prod - a > 0 ? prod - a : prod + (a * 2)}`
          ];
          return { question, spokenText, correct, distractors, explanation: `${a} × ${b} = ${prod} eder.` };
        }
      } else {
        // Bölme İşlemi (SADECE 20 İçinde, Kalansız ve Eşit Paylaştırma)
        const validDivisions = [
          { total: 20, div: 4, quo: 5, item: 'elmayı 4 tabağa', unit: 'elma' },
          { total: 20, div: 5, quo: 4, item: 'balonu 5 çocuğa', unit: 'balon' },
          { total: 20, div: 2, quo: 10, item: 'cevizi 2 kardeşe', unit: 'ceviz' },
          { total: 18, div: 2, quo: 9, item: 'kurabiyeyi 2 tabağa', unit: 'kurabiye' },
          { total: 18, div: 3, quo: 6, item: 'fındığı 3 sincaba', unit: 'fındık' },
          { total: 16, div: 4, quo: 4, item: 'kalemi 4 kutuya', unit: 'kalem' },
          { total: 16, div: 2, quo: 8, item: 'sayfayı 2 günde', unit: 'sayfa' },
          { total: 15, div: 3, quo: 5, item: 'çiçeği 3 vazoya', unit: 'çiçek' },
          { total: 15, div: 5, quo: 3, item: 'şekeri 5 arkadaşa', unit: 'şeker' },
          { total: 14, div: 2, quo: 7, item: 'havucu 2 tavşana', unit: 'havuç' },
          { total: 12, div: 3, quo: 4, item: 'kitabı 3 rafa', unit: 'kitap' },
          { total: 12, div: 4, quo: 3, item: 'bardağı 4 tepsiye', unit: 'bardak' },
          { total: 12, div: 2, quo: 6, item: 'armudu 2 sepete', unit: 'armut' },
          { total: 10, div: 2, quo: 5, item: 'lirayı 2 kumbaraya', unit: 'lira' },
          { total: 10, div: 5, quo: 2, item: 'cevizi 5 çocuğa', unit: 'ceviz' },
          { total: 8, div: 2, quo: 4, item: 'çileği 2 tabağa', unit: 'çilek' },
          { total: 8, div: 4, quo: 2, item: 'balığı 4 akvaryuma', unit: 'balık' },
          { total: 6, div: 2, quo: 3, item: 'topu 2 fileye', unit: 'top' },
          { total: 6, div: 3, quo: 2, item: 'kuşu 3 kafese', unit: 'kuş' }
        ];

        const divItem = validDivisions[Math.floor(Math.random() * validDivisions.length)];
        const isWordProblem = Math.random() < 0.5;

        if (isWordProblem) {
          const question = `${divItem.total} ${divItem.item} eşit şekilde paylaştırırsak her birine kaç ${divItem.unit} düşer? ➗`;
          const spokenText = `${divItem.total} nesne ${divItem.div} gruba eşit paylaştırılırsa her gruba kaç tane düşer?`;
          const correct = `${divItem.quo} ${divItem.unit}`;
          const distractors = [
            `${divItem.quo + 1} ${divItem.unit}`,
            `${divItem.quo - 1 > 0 ? divItem.quo - 1 : divItem.quo + 2} ${divItem.unit}`
          ];
          return { question, spokenText, correct, distractors, explanation: `${divItem.total} ÷ ${divItem.div} = ${divItem.quo} ${divItem.unit} düşer.` };
        } else {
          const question = `${divItem.total} ÷ ${divItem.div} işleminin sonucu kaçtır? ➗`;
          const spokenText = `${divItem.total} bölü ${divItem.div} işleminin sonucu kaçtır?`;
          const correct = `${divItem.quo}`;
          const distractors = [
            `${divItem.quo + 1}`,
            `${divItem.quo - 1 > 0 ? divItem.quo - 1 : divItem.quo + 2}`
          ];
          return { question, spokenText, correct, distractors, explanation: `${divItem.total} sayısının içinde ${divItem.div}, ${divItem.quo} defa vardır.` };
        }
      }
    },

    // 4. Kesirler, Zaman ve Paralarımız
    generateGrade2FractionsTimeMoney() {
      const mode = Math.floor(Math.random() * 3);

      if (mode === 0) {
        // Bütün, Yarım, Çeyrek (1 Bütün = 2 Yarım = 4 Çeyrek)
        const fractionPool = [
          { q: '1 bütün ekmek kaç yarım ekmek eder? 🥖', spoken: 'Bir bütün ekmek kaç yarım ekmek eder?', a: '2 yarım', d: ['4 yarım', '1 yarım'], exp: '1 bütün 2 eşit yarımdan oluşur.' },
          { q: '1 bütün pizzadan kaç adet çeyrek pizza dilimi çıkar? 🍕', spoken: 'Bir bütün pizzadan kaç çeyrek dilim çıkar?', a: '4 çeyrek', d: ['2 çeyrek', '8 çeyrek'], exp: '1 bütün 4 eşit çeyrekten oluşur.' },
          { q: '4 yarım elma kaç bütün elma eder? 🍎', spoken: 'Dört yarım elma kaç bütün elma eder?', a: '2 bütün', d: ['1 bütün', '4 bütün'], exp: '2 yarım 1 bütün ettiğine göre, 4 yarım 2 bütün eder.' },
          { q: '8 çeyrek portakal kaç bütün portakal eder? 🍊', spoken: 'Sekiz çeyrek portakal kaç bütün portakal eder?', a: '2 bütün', d: ['4 bütün', '1 bütün'], exp: '4 çeyrek 1 bütündür. 8 çeyrek = 2 bütün portakal eder.' },
          { q: '6 yarım simit kaç bütün simit eder? 🥯', spoken: 'Altı yarım simit kaç bütün simit eder?', a: '3 bütün', d: ['2 bütün', '4 bütün'], exp: '6 ÷ 2 = 3 bütün simit eder.' },
          { q: '12 çeyrek pasta kaç bütün pasta eder? 🎂', spoken: 'On iki çeyrek pasta kaç bütün pasta eder?', a: '3 bütün', d: ['4 bütün', '2 bütün'], exp: '12 ÷ 4 = 3 bütün pasta eder.' },
          { q: '2 bütün elma ile 4 yarım elma toplam kaç bütün elma eder? 🍏', spoken: 'İki bütün ve dört yarım elma toplam kaç bütün elma eder?', a: '4 bütün', d: ['3 bütün', '6 bütün'], exp: '4 yarım = 2 bütün. 2 + 2 = 4 bütün elma eder.' }
        ];
        const item = fractionPool[Math.floor(Math.random() * fractionPool.length)];
        return { question: item.q, spokenText: item.spoken, correct: item.a, distractors: item.d, explanation: item.exp };
      } else if (mode === 1) {
        // Zamanı Ölçme (Tam, Yarım, Çeyrek Saatler, Takvim)
        const timePool = [
          { q: 'Saat üzerinde kısa ve kalın olan kola ne ad verilir? ⏰', spoken: 'Saat üzerindeki kısa kola ne denir?', a: 'Akrep (Saati gösterir) ⏰', d: ['Yelkovan', 'Saniye ibresi'], exp: 'Kısa kol akreptir ve saat başlarını gösterir.' },
          { q: 'Saat üzerinde uzun olan kola ne ad verilir? ⏰', spoken: 'Saat üzerindeki uzun kola ne denir?', a: 'Yelkovan (Dakikayı gösterir) ⏰', d: ['Akrep', 'Takvim'], exp: 'Uzun kol yelkovandır ve dakikaları gösterir.' },
          { q: 'Akrep 4\'ü, yelkovan tam 12\'yi gösteriyorsa saat kaçtır? ⏰', spoken: 'Akrep 4\'ü, yelkovan 12\'yi gösteriyorsa saat kaçtır?', a: '04:00 (Tam dört) ⏰', d: ['04:30', '12:20'], exp: 'Yelkovan 12 üzerinde iken tam saattir.' },
          { q: 'Yelkovan tam 6\'nın üzerindeyken saat nasıl okunur? ⏳', spoken: 'Yelkovan 6 üzerindeyken saat nasıl okunur?', a: 'Buçuk (Yarım saat) ⏳', d: ['Çeyrek geçiyor', 'Tam saat'], exp: 'Yelkovan 6 üzerinde iken yarım saati, yani "buçuk" olduğunu gösterir.' },
          { q: 'Yelkovan 3\'ün üzerindeyken saat nasıl okunur? ⏰', spoken: 'Yelkovan 3 üzerindeyken saat nasıl okunur?', a: 'Çeyrek geçiyor ⏰', d: ['Çeyrek var', 'Buçuk'], exp: 'Yelkovan 3\'te iken 15 dakika geçmektedir (çeyrek geçiyor).' },
          { q: 'Yelkovan 9\'un üzerindeyken saat nasıl okunur? ⏰', spoken: 'Yelkovan 9 üzerindeyken saat nasıl okunur?', a: 'Çeyrek var ⏰', d: ['Çeyrek geçiyor', 'Tam saat'], exp: 'Yelkovan 9\'da iken bir sonraki saate 15 dakika kalmıştır (çeyrek var).' },
          { q: 'Öğleden sonra saat 2:00 dijital saatte nasıl gösterilir? ⏰', spoken: 'Öğleden sonra saat iki dijital saatte nasıl gösterilir?', a: '14:00 ⏰', d: ['12:00', '16:00'], exp: 'Öğleden sonra saatlere 12 eklenir: 12 + 2 = 14:00.' },
          { q: '1 saat kaç dakikadır? ⏳', spoken: 'Bir saat kaç dakikadır?', a: '60 dakika ⏳', d: ['30 dakika', '100 dakika'], exp: '1 saat 60 dakikadır.' },
          { q: 'Yarım saat kaç dakikadır? ⏳', spoken: 'Yarım saat kaç dakikadır?', a: '30 dakika ⏳', d: ['15 dakika', '45 dakika'], exp: '60 dakikanın yarısı 30 dakikadır.' },
          { q: 'Çeyrek saat kaç dakikadır? ⏳', spoken: 'Çeyrek saat kaç dakikadır?', a: '15 dakika ⏳', d: ['30 dakika', '20 dakika'], exp: 'Bir saatin çeyreği (dörtte biri) 15 dakikadır.' },
          { q: 'Bir yılda kaç mevsim ve kaç ay vardır? 🍂', spoken: 'Bir yılda kaç mevsim ve kaç ay vardır?', a: '4 mevsim, 12 ay 🗓️', d: ['2 mevsim, 10 ay', '4 mevsim, 52 ay'], exp: 'Bir takvim yılında 4 mevsim ve 12 ay bulunur.' },
          { q: 'Bir hafta kaç gündür? 📅', spoken: 'Bir hafta kaç gündür?', a: '7 gün 📅', d: ['5 gün', '10 gün'], exp: 'Pazartesiden Pazara bir haftada 7 gün vardır.' }
        ];
        const item = timePool[Math.floor(Math.random() * timePool.length)];
        return { question: item.q, spokenText: item.spoken, correct: item.a, distractors: item.d, explanation: item.exp };
      } else {
        // Paralarımız (Lira ve Kuruş Hesapları)
        const moneyPool = [
          { q: '1 Türk Lirası (1 TL) kaç Kuruşa eşittir? 🪙', spoken: 'Bir Türk Lirası kaç kuruşa eşittir?', a: '100 Kuruş 🪙', d: ['10 Kuruş', '50 Kuruş'], exp: '1 TL = 100 Kuruştur.' },
          { q: '2 tane 50 Kuruş toplam kaç Lira eder? 🪙', spoken: 'İki tane 50 kuruş kaç lira eder?', a: '1 TL 🪙', d: ['2 TL', '50 TL'], exp: '50 Kuruş + 50 Kuruş = 100 Kuruş, yani 1 TL eder.' },
          { q: '4 tane 25 Kuruş toplam kaç Lira eder? 🪙', spoken: 'Dört tane 25 kuruş kaç lira eder?', a: '1 TL 🪙', d: ['4 TL', '2 TL'], exp: '25 + 25 + 25 + 25 = 100 Kuruş = 1 TL eder.' },
          { q: 'En büyük madeni paramız hangisidir? 🪙', spoken: 'En büyük madeni paramız hangisidir?', a: '1 TL 🪙', d: ['50 Kuruş', '5 TL'], exp: 'Türkiye\'de tedavüldeki en büyük madeni para 1 Türk Lirasıdır.' },
          { q: 'Kumbarasında 3 tane 10 TL ve 1 tane 20 TL olan Elif\'in toplam kaç lirası vardır? 💰', spoken: 'Kumbarasında üç tane 10 lira ve bir tane 20 lira olanın kaç lirası vardır?', a: '50 TL 💰', d: ['40 TL', '60 TL'], exp: '3 × 10 = 30 TL. 30 + 20 = 50 TL eder.' },
          { q: 'Fiyatı 35 TL olan kitaba 50 TL veren biri kaç TL para üstü alır? 💵', spoken: '35 liralık kitaba 50 lira veren biri kaç lira para üstü alır?', a: '15 TL', d: ['25 TL', '10 TL'], exp: '50 - 35 = 15 TL para üstü alır.' },
          { q: 'Tanesi 5 lira olan kalemlerden 4 tane alan Can 50 TL verirse kaç lira para üstü alır? ✏️', spoken: 'Tanesi 5 lira olan kalemlerden 4 tane alan 50 lira verirse para üstü ne kadar alır?', a: '30 TL', d: ['20 TL', '35 TL'], exp: '4 × 5 = 20 TL harcar. 50 - 20 = 30 TL para üstü alır.' }
        ];
        const item = moneyPool[Math.floor(Math.random() * moneyPool.length)];
        return { question: item.q, spokenText: item.spoken, correct: item.a, distractors: item.d, explanation: item.exp };
      }
    },

    // 5. Geometri ve Simetri (20 Özgün Soru)
    grade2GeometrySolidsPool: [
      {
        q: 'Tüm yüzleri birbirine eşit 6 karesel bölgeden oluşan, 8 köşesi ve 12 ayrıtı olan geometrik cisim hangisidir? 🎲',
        spokenText: 'Tüm yüzleri eşit 6 kareden oluşan, 8 köşesi olan geometrik cisim hangisidir?',
        a: 'Küp 🎲',
        d: ['Silindir 🥫', 'Koni 🍦'],
        exp: 'Küpün 6 karesel yüzü, 8 köşesi ve 12 ayrıtı vardır (Örn: zeka küpü, tavla zarı).'
      },
      {
        q: 'Bir kibrit kutusu, ayakkabı kutusu veya tuğla hangi geometrik cisme benzer? 📦',
        spokenText: 'Kibrit kutusu veya tuğla hangi geometrik cisme benzer?',
        a: 'Dikdörtgen Prizma 📦',
        d: ['Küre ⚽', 'Koni 🍦'],
        exp: 'Tüm yüzleri dikdörtgen olan üç boyutlu cisim dikdörtgen prizmadır.'
      },
      {
        q: 'Tabanları daire olan, eğri bir yan yüzeyi bulunan, köşesi ve ayrıtı OLMAYAN cisim hangisidir? 🥫',
        spokenText: 'Tabanları daire olan, köşesi ve ayrıtı olmayan cisim hangisidir?',
        a: 'Silindir (Örn: Salça kutusu, pil) 🥫',
        d: ['Küp 🎲', 'Üçgen prizma ⛺'],
        exp: 'Silindirin 2 düz dairesel tabanı ve 1 eğri yüzü vardır; köşe ve ayrıtı yoktur.'
      },
      {
        q: 'Dondurma külahı veya doğum günü şapkası hangi geometrik cisme benzer? 🍦',
        spokenText: 'Dondurma külahı veya parti şapkası hangi cisme benzer?',
        a: 'Koni 🍦',
        d: ['Silindir 🥫', 'Küp 🎲'],
        exp: 'Daire tabanı ve sivri tepesi olan eğri yüzeyli cisim konidir; köşesi ve ayrıtı yoktur.'
      },
      {
        q: 'Futbol topu, portakal veya gezegenimiz Dünya hangi geometrik cisme modeldir? ⚽',
        spokenText: 'Futbol topu veya portakal hangi geometrik cisme modeldir?',
        a: 'Küre ⚽',
        d: ['Küp 🎲', 'Kare prizma 🧊'],
        exp: 'Küre tek bir eğri yüzeyden oluşur; köşesi ve ayrıtı yoktur.'
      },
      {
        q: 'Kamp çadırı veya evlerin çatısı genellikle hangi geometrik cisme benzer? ⛺',
        spokenText: 'Kamp çadırı genellikle hangi geometrik cisme benzer?',
        a: 'Üçgen Prizma ⛺',
        d: ['Koni 🍦', 'Silindir 🥫'],
        exp: 'Üçgen prizmanın 2 üçgen tabanı ve 3 dikdörtgen yan yüzü vardır.'
      },
      {
        q: 'Küpün kaç adet köşesi ve kaç adet ayrıtı (kenarı) vardır? 🎲',
        spokenText: 'Küpün kaç köşesi ve kaç ayrıtı vardır?',
        a: '8 köşesi, 12 ayrıtı 🎲',
        d: ['6 köşesi, 8 ayrıtı', '4 köşesi, 6 ayrıtı'],
        exp: 'Küpün 8 köşesi ve 12 ayrıtı bulunur.'
      },
      {
        q: 'Silindir, koni ve kürenin ortak özelliği nedir? ⚪',
        spokenText: 'Silindir, koni ve kürenin ortak özelliği nedir?',
        a: 'Köşelerinin ve ayrıtlarının olmaması ⚪',
        d: ['Tüm yüzlerinin kare olması', '12 ayrıtlarının olması'],
        exp: 'Silindir, koni ve kürenin köşe ve ayrıtları yoktur, eğri yüzeyleri vardır.'
      },
      {
        q: 'Bir şekli tam ortasından katladığımızda iki parça üst üste tam çakışıyorsa bu şekle ne denir? 🪞',
        spokenText: 'Katlandığında iki parça tam çakışıyorsa bu şekle ne denir?',
        a: 'Simetrik şekil 🪞',
        d: ['Geometrik cisim', 'Örüntü'],
        exp: 'Katlandığında iki eş parçaya ayrılan şekiller simetriktir.'
      },
      {
        q: 'Simetrik bir şekli iki eş parçaya ayıran çizgiye ne ad verilir? 📏',
        spokenText: 'Simetrik bir şekli iki eş parçaya ayıran çizgiye ne ad verilir?',
        a: 'Simetri doğrusu 📏',
        d: ['Köşegen', 'Ayrıt'],
        exp: 'Şekli iki ayna görüntüsüne ayıran çizgiye simetri doğrusu denir.'
      },
      {
        q: 'Bir karenin kaç adet simetri doğrusu vardır? 🟦',
        spokenText: 'Bir karenin kaç adet simetri doğrusu vardır?',
        a: '4 adet 🟦',
        d: ['2 adet', '1 adet'],
        exp: 'Karenin yatay, dikey ve iki köşegen olmak üzere 4 simetri doğrusu vardır.'
      },
      {
        q: 'Bir dikdörtgenin kaç adet simetri doğrusu vardır? 🚪',
        spokenText: 'Bir dikdörtgenin kaç adet simetri doğrusu vardır?',
        a: '2 adet (Yatay ve dikey) 🚪',
        d: ['4 adet', '1 adet'],
        exp: 'Dikdörtgenin köşegenleri simetri doğrusu değildir; 2 simetri doğrusu vardır.'
      },
      {
        q: 'Alfabemizdeki hangi harf dikey bir simetri doğrusuna sahiptir? (Katlandığında eşleşir) 🔤',
        spokenText: 'Hangi harf dikey bir simetri doğrusuna sahiptir?',
        a: 'A harfi 🅰️',
        d: ['F harfi', 'P harfi'],
        exp: 'A harfi ortadan dikey katlandığında sağ ve sol yarıları tam üst üste gelir.'
      },
      {
        q: 'Aşağıdaki hayvanlardan hangisinin vücudu mükemmel bir doğal simetri örneğidir? 🦋',
        spokenText: 'Hangi hayvanın kanatları doğal bir simetri örneğidir?',
        a: 'Kelebek 🦋',
        d: ['Salyangoz 🐌', 'Yengeç 🦀'],
        exp: 'Kelebeğin sağ ve sol kanatları birbirinin simetri aynasıdır.'
      },
      {
        q: '3 kenarı ve 3 köşesi olan düzlemsel geometrik şekil hangisidir? 🔺',
        spokenText: '3 kenarı ve 3 köşesi olan geometrik şekil hangisidir?',
        a: 'Üçgen 🔺',
        d: ['Kare 🟦', 'Çember ⚪'],
        exp: 'Üçgen 3 kenar ve 3 köşeden oluşur.'
      },
      {
        q: 'Tüm kenar uzunlukları birbirine EŞİT olan 4 köşeli şekil hangisidir? 🟦',
        spokenText: 'Tüm kenarları eşit olan 4 köşeli şekil hangisidir?',
        a: 'Kare 🟦',
        d: ['Dikdörtgen 🚪', 'Çember ⚪'],
        exp: 'Karenin 4 kenarı eşit uzunluktadır ve 4 köşesi vardır.'
      },
      {
        q: 'Karşılıklı kenarları eşit (2 uzun, 2 kısa) olan 4 köşeli şekil hangisidir? 🚪',
        spokenText: 'İki uzun ve iki kısa kenarı olan şekil hangisidir?',
        a: 'Dikdörtgen 🚪',
        d: ['Kare 🟦', 'Üçgen 🔺'],
        exp: 'Dikdörtgenin karşılıklı kenarları birbirine eşittir.'
      },
      {
        q: 'Hiç köşesi ve düz kenarı olmayan yuvarlak şekil hangisidir? ⚪',
        spokenText: 'Hiç köşesi ve kenarı olmayan yuvarlak şekil hangisidir?',
        a: 'Çember ⚪',
        d: ['Kare 🟦', 'Üçgen 🔺'],
        exp: 'Çember yuvarlaktır, kenarı ve köşesi yoktur.'
      },
      {
        q: 'Kare prizmanın tabanları hangi geometrik şekildedir? 🧊',
        spokenText: 'Kare prizmanın tabanları hangi şekildedir?',
        a: 'Kare 🟦',
        d: ['Üçgen 🔺', 'Daire ⚪'],
        exp: 'Kare prizmanın alt ve üst tabanları kare, yan yüzleri dikdörtgendir.'
      },
      {
        q: 'Buzdolabı veya çamaşır makinesi kutusu genellikle hangi geometrik cisme örnektir? 🧊',
        spokenText: 'Buzdolabı genellikle hangi geometrik cisme örnektir?',
        a: 'Kare Prizma veya Dikdörtgen Prizma 🧊',
        d: ['Küre ⚽', 'Koni 🍦'],
        exp: 'Tabanı kare, yüksekliği farklı olan kutular kare prizmadır.'
      }
    ],

    generateGrade2GeometrySolids() {
      return this.drawFromPool(this.grade2GeometrySolidsPool, "grade2GeometrySolidsPool");
    },

    // 6. Ölçme ve Veri (Grafik/Tablo - 20 Özgün Soru)
    grade2MeasureDataPool: [
      {
        q: 'Sınıf tahtasının boyunu, odanın uzunluğunu veya kapının yüksekliğini hangi standart birimle ölçeriz? 🚪',
        spokenText: 'Kapının boyunu veya oda uzunluğunu hangi standart birimle ölçeriz?',
        a: 'Metre (m) 📏',
        d: ['Kilogram (kg)', 'Litre (L)'],
        exp: 'Büyük uzunluklar standart ölçme birimi olan metre (m) ile ölçülür.'
      },
      {
        q: '1 metre (1 m) kaç santimetreye (cm) eşittir? 📏',
        spokenText: 'Bir metre kaç santimetreye eşittir?',
        a: '100 cm 📏',
        d: ['10 cm', '1000 cm'],
        exp: '1 metre = 100 santimetredir.'
      },
      {
        q: 'Kalemimizin, silgimizin veya defterimizin boyunu cetvelle hangi birimle ölçmek uygundur? ✏️',
        spokenText: 'Kalem ve defter boyunu hangi birimle ölçmek uygundur?',
        a: 'Santimetre (cm) 📏',
        d: ['Metre (m)', 'Kilogram (kg)'],
        exp: 'Küçük nesnelerin uzunlukları santimetre ile cetvel kullanılarak ölçülür.'
      },
      {
        q: 'Boyu 1 metre 35 cm olan bir çocuğun boyu toplam kaç santimetredir? 📏',
        spokenText: '1 metre 35 santimetre toplam kaç santimetre eder?',
        a: '135 cm 📏',
        d: ['130 cm', '145 cm'],
        exp: '1 m = 100 cm. 100 + 35 = 135 cm eder.'
      },
      {
        q: '50 cm uzunluğundaki bir kumaşa kaç cm daha eklenirse 1 metre (100 cm) olur? 🧵',
        spokenText: '50 santimetreye kaç santimetre eklenirse bir metre olur?',
        a: '50 cm 🧵',
        d: ['40 cm', '60 cm'],
        exp: '100 - 50 = 50 cm daha eklenmelidir (yarım metre).'
      },
      {
        q: 'Pazardan elma, patates veya un alırken ağırlıkları hangi birimle tartılır? ⚖️',
        spokenText: 'Elma veya patatesin ağırlığı hangi birimle tartılır?',
        a: 'Kilogram (kg) ⚖️',
        d: ['Metre (m)', 'Santimetre (cm)'],
        exp: 'Kütle (ağırlık) standart birimi kilogramdır (kg).'
      },
      {
        q: '2 adet yarım kilogramlık un paketi toplam kaç kilogram eder? 🌾',
        spokenText: 'İki yarım kilogram un kaç kilogram eder?',
        a: '1 kilogram (1 kg) 🌾',
        d: ['2 kg', '4 kg'],
        exp: '2 yarım kilogram = 1 tam kilogram eder.'
      },
      {
        q: 'Aşağıdakilerden hangisi 1 kilogramdan DAHA HAFİFTİR? 🪶',
        spokenText: 'Hangisi 1 kilogramdan daha hafiftir?',
        a: 'Bir adet kurşun kalem ✏️',
        d: ['Büyük bir karpuz 🍉', 'Dolu bir okul çantası 🎒'],
        exp: 'Kurşun kalem birkaç gramdır, 1 kilogramdan çok daha hafiftir.'
      },
      {
        q: 'Aşağıdakilerden hangisi 1 kilogramdan DAHA AĞIRDIR? 🍉',
        spokenText: 'Hangisi 1 kilogramdan daha ağırdır?',
        a: 'Büyük bir kış karpuzu 🍉',
        d: ['Bir adet silgi 🧼', 'Bir adet elma 🍎'],
        exp: 'Büyük bir karpuz genellikle 5-10 kilogram gelir.'
      },
      {
        q: 'Çetele tablosunda dört dikey çizgi ve üzerini kesen bir yatay çizgi (卌) hangi sayıyı ifade eder? 📊',
        spokenText: 'Çetele tablosunda beşli çizgi grubu hangi sayıyı gösterir?',
        a: '5 (Beş) 📊',
        d: ['4', '10'],
        exp: 'Çetele tablosunda her grup 5 çizgiden oluşur.'
      },
      {
        q: 'Çetele tablosundaki çizgilerin sayı rakamlarıyla yazılmış haline ne ad verilir? 📋',
        spokenText: 'Verilerin sayılarla gösterildiği tabloya ne ad verilir?',
        a: 'Sıklık Tablosu 📋',
        d: ['Boy cetveli', 'Nesne listesi'],
        exp: 'Verilerin sayılarla gösterildiği tabloya sıklık tablosu denir.'
      },
      {
        q: 'Bir nesne grafiğinde her yıldız sembolü 2 kitabı gösteriyorsa, 4 yıldız sembolü kaç kitabı temsil eder? ⭐',
        spokenText: 'Her yıldız 2 kitabı gösteriyorsa 4 yıldız kaç kitaptır?',
        a: '8 kitap (4 × 2 = 8) 📚',
        d: ['6 kitap', '10 kitap'],
        exp: '4 × 2 = 8 kitap eder.'
      },
      {
        q: 'Grafikteki her gülen yüz 3 öğrenciyi gösteriyorsa, 5 gülen yüz kaç öğrencidir? 😊',
        spokenText: 'Her gülen yüz 3 öğrenciyi gösteriyorsa 5 gülen yüz kaç öğrencidir?',
        a: '15 öğrenci (5 × 3 = 15) 👥',
        d: ['12 öğrenci', '18 öğrenci'],
        exp: '5 × 3 = 15 öğrenci eder.'
      },
      {
        q: 'Bir sıklık tablosunda: Elma=14, Muz=8, Çilek=18 ise en çok sevilen meyve hangisidir? 🍓',
        spokenText: 'Elma 14, Muz 8, Çilek 18 ise en çok sevilen meyve hangisidir?',
        a: 'Çilek (18) 🍓',
        d: ['Elma (14)', 'Muz (8)'],
        exp: 'En büyük sayı 18 olduğu için en çok çilek sevilmektedir.'
      },
      {
        q: 'Bir sınıfta 16 öğrenci futbol, 9 öğrenci basketbol seviyorsa, futbol sevenler basketbol sevenlerden kaç fazladır? ⚽',
        spokenText: '16 futbol ve 9 basketbol varsa futbol sevenler kaç fazladır?',
        a: '7 öğrenci fazla (16 - 9 = 7) ⚽',
        d: ['5 öğrenci', '8 öğrenci'],
        exp: '16 - 9 = 7 fazladır.'
      },
      {
        q: '1 sürahi su ile 4 su bardağı doluyorsa, 3 sürahi su ile kaç su bardağı doldurulabilir? 🥛',
        spokenText: '1 sürahi 4 bardak dolduruyorsa 3 sürahi kaç bardak doldurur?',
        a: '12 bardak (3 × 4 = 12) 🥛',
        d: ['10 bardak', '14 bardak'],
        exp: '3 × 4 = 12 bardak su dolar.'
      },
      {
        q: 'Aşağıdaki kaplardan hangisi en fazla sıvı alır? 🪣',
        spokenText: 'Aşağıdaki kaplardan hangisi en fazla sıvı alır?',
        a: 'Büyük bir su kovası 🪣',
        d: ['Çay bardağı ☕', 'Çorba kaşığı 🥄'],
        exp: 'Kovanın hacmi bardak ve kaşıktan çok daha büyüktür.'
      },
      {
        q: 'Aşağıdaki kaplardan hangisi en az sıvı alır? 🥄',
        spokenText: 'Aşağıdaki kaplardan hangisi en az sıvı alır?',
        a: 'Çay kaşığı 🥄',
        d: ['Su bardağı 🥛', 'Sürahi 🫖'],
        exp: 'Çay kaşığı en küçük sıvı kabıdır.'
      },
      {
        q: '3 metre uzunluğundaki bir ipten 1 metresi kesilirse geriye kaç metre ip kalır? 🧵',
        spokenText: '3 metre ipten 1 metresi kesilirse kaç metre kalır?',
        a: '2 metre (3 - 1 = 2) 🧵',
        d: ['1 metre', '4 metre'],
        exp: '3 - 1 = 2 metre kalır.'
      },
      {
        q: 'Ali 28 kilogram, kardeşi ise 19 kilogramdır. İki kardeşin toplam ağırlığı kaç kilogramdır? ⚖️',
        spokenText: '28 kilo ve 19 kilonun toplamı kaç kilogramdır?',
        a: '47 kg (28 + 19 = 47) ⚖️',
        d: ['37 kg', '49 kg'],
        exp: '28 + 19 = 47 kilogram eder.'
      }
    ],

    generateGrade2MeasureData() {
      return this.drawFromPool(this.grade2MeasureDataPool, "grade2MeasureDataPool");
    },

    // 2. Sınıf Matematik Büyük Karma Düello (6 Konudan Dengeli Soru Çekimi)
    generateGrade2MathKarma() {
      const topicIdx = Math.floor(Math.random() * 6);
      if (topicIdx === 0) return this.generateGrade2PlaceValue();
      if (topicIdx === 1) return this.generateGrade2Operations();
      if (topicIdx === 2) return this.generateGrade2MultiplicationDivision();
      if (topicIdx === 3) return this.generateGrade2FractionsTimeMoney();
      if (topicIdx === 4) return this.generateGrade2GeometrySolids();
      return this.generateGrade2MeasureData();
    },

    // Geriye Dönük Uyumluluk Fonksiyonları (Legacy Aliases)
    generateGrade2Math() {
      return this.generateGrade2MathKarma();
    },
    generateGrade2Multiplication() {
      return this.generateGrade2MultiplicationDivision();
    },
    get grade2AdditionSubtractionPool() { return []; },
    get grade2PlaceValuePool() { return []; },
    get grade2MultiplicationPool() { return []; },
    get grade2ClocksPool() { return []; },


    // -------------------------------------------------------------
    // 2. SINIF: 2026 TÜRKİYE YÜZYILI MAARİF MODELİ TÜRKÇE SORU HAVUZLARI
    // (5 Öğrenme Alanı - Eş/Zıt, Sözlük Sırası & Hece, 5N1K, Cümle, Noktalama + TTS)
    // -------------------------------------------------------------

    grade2TurkishSynAntPool: [
      {"q":"\"Siyah\" kelimesinin eş anlamlısı (anlamdaşı) nedir? ⚫","a":"Kara","d":["Karanlık","Koyu"],"exp":"Siyah ve Kara eş anlamlıdır.","spokenText":"Siyah kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Beyaz\" kelimesinin eş anlamlısı nedir? ⚪","a":"Ak","d":["Açık","Parlak"],"exp":"Beyaz ve Ak eş anlamlıdır.","spokenText":"Beyaz kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Kırmızı\" kelimesinin eş anlamlısı nedir? 🔴","a":"Al","d":["Bordo","Pembe"],"exp":"Kırmızı ve Al eş anlamlıdır.","spokenText":"Kırmızı kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Okul\" kelimesinin eş anlamlısı nedir? 🏫","a":"Mektep","d":["Sınıf","Kütüphane"],"exp":"Okul ve Mektep eş anlamlıdır.","spokenText":"Okul kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Öğrenci\" kelimesinin eş anlamlısı nedir? 🎒","a":"Talebe","d":["Öğretmen","Müdür"],"exp":"Öğrenci ve Talebe eş anlamlıdır.","spokenText":"Öğrenci kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Öğretmen\" kelimesinin eş anlamlısı nedir? 👩‍🏫","a":"Muallim","d":["Müdür","Memur"],"exp":"Öğretmen ve Muallim eş anlamlıdır.","spokenText":"Öğretmen kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Yaşlı\" kelimesinin eş anlamlısı nedir? 👴","a":"İhtiyar","d":["Büyük","Dedecik"],"exp":"Yaşlı ve İhtiyar eş anlamlıdır.","spokenText":"Yaşlı kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Doktor\" kelimesinin eş anlamlısı nedir? 👨‍⚕️","a":"Hekim","d":["Hemşire","Eczacı"],"exp":"Doktor ve Hekim eş anlamlıdır.","spokenText":"Doktor kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Rüya\" kelimesinin eş anlamlısı nedir? 🌙","a":"Düş","d":["Uyku","Hayal"],"exp":"Rüya ve Düş eş anlamlıdır.","spokenText":"Rüya kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Ev\" kelimesinin eş anlamlısı nedir? 🏠","a":"Konut","d":["Oda","Bina"],"exp":"Ev ve Konut eş anlamlıdır.","spokenText":"Ev kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Sonbahar\" mevsiminin eş anlamlısı nedir? 🍂","a":"Güz","d":["Bahar","Kış"],"exp":"Sonbahar ve Güz eş anlamlıdır.","spokenText":"Sonbahar kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Kelime\" sözcüğünün eş anlamlısı nedir? 📖","a":"Sözcük","d":["Harf","Hece"],"exp":"Kelime ve Sözcük eş anlamlıdır.","spokenText":"Kelime kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Hediye\" kelimesinin eş anlamlısı nedir? 🎁","a":"Armağan","d":["Paket","Ödül"],"exp":"Hediye ve Armağan eş anlamlıdır.","spokenText":"Hediye kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Vatan\" kelimesinin eş anlamlısı nedir? 🇹🇷","a":"Yurt","d":["Şehir","Dünya"],"exp":"Vatan ve Yurt eş anlamlıdır.","spokenText":"Vatan kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Cevap\" kelimesinin eş anlamlısı nedir? ✍️","a":"Yanıt","d":["Soru","Mesaj"],"exp":"Cevap ve Yanıt eş anlamlıdır.","spokenText":"Cevap kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Soru\" kelimesinin eş anlamlısı nedir? ❓","a":"Sual","d":["Cevap","Test"],"exp":"Soru ve Sual eş anlamlıdır.","spokenText":"Soru kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Yıl\" kelimesinin eş anlamlısı nedir? 🗓️","a":"Sene","d":["Ay","Mevsim"],"exp":"Yıl ve Sene eş anlamlıdır.","spokenText":"Yıl kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Zaman\" kelimesinin eş anlamlısı nedir? ⏳","a":"Vakit","d":["Saat","Gün"],"exp":"Zaman ve Vakit eş anlamlıdır.","spokenText":"Zaman kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Kalp\" organımızın eş anlamlısı nedir? ❤️","a":"Yürek","d":["Göğüs","Akıl"],"exp":"Kalp ve Yürek eş anlamlıdır.","spokenText":"Kalp kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Nehir\" kelimesinin eş anlamlısı nedir? 🌊","a":"Irmak","d":["Göl","Deniz"],"exp":"Nehir ve Irmak eş anlamlıdır.","spokenText":"Nehir kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Hatıra\" kelimesinin eş anlamlısı nedir? 📸","a":"Anı","d":["Resim","Rüya"],"exp":"Hatıra ve Anı eş anlamlıdır.","spokenText":"Hatıra kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Konuk\" kelimesinin eş anlamlısı nedir? 🏡","a":"Misafir","d":["Ev sahibi","Komşu"],"exp":"Konuk ve Misafir eş anlamlıdır.","spokenText":"Konuk kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Şair\" kelimesinin eş anlamlısı nedir? 📜","a":"Ozan","d":["Yazar","Ressam"],"exp":"Şair ve Ozan eş anlamlıdır.","spokenText":"Şair kelimesinin eş anlamlısı nedir?"},
      {"q":"\"İsim\" kelimesinin eş anlamlısı nedir? 🏷️","a":"Ad","d":["Soyadı","Başlık"],"exp":"İsim ve Ad eş anlamlıdır.","spokenText":"İsim kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Rüzgar\" kelimesinin eş anlamlısı nedir? 💨","a":"Yel","d":["Fırtına","Boran"],"exp":"Rüzgar ve Yel eş anlamlıdır.","spokenText":"Rüzgar kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Lider\" kelimesinin eş anlamlısı nedir? 🎖️","a":"Önder","d":["Başkan","Kaptan"],"exp":"Lider ve Önder eş anlamlıdır.","spokenText":"Lider kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Millet\" kelimesinin eş anlamlısı nedir? 🇹🇷","a":"Ulus","d":["Halk","Toplum"],"exp":"Millet ve Ulus eş anlamlıdır.","spokenText":"Millet kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Cümle\" kelimesinin eş anlamlısı nedir? 📝","a":"Tümce","d":["Kelime","Paragraf"],"exp":"Cümle ve Tümce eş anlamlıdır.","spokenText":"Cümle kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Fayda\" kelimesinin eş anlamlısı nedir? ✨","a":"Yarar","d":["Kâr","Kazanç"],"exp":"Fayda ve Yarar eş anlamlıdır.","spokenText":"Fayda kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Baş\" kelimesinin eş anlamlısı nedir? 🧠","a":"Kafa","d":["Boyun","Yüz"],"exp":"Baş ve Kafa eş anlamlıdır.","spokenText":"Baş kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Görev\" kelimesinin eş anlamlısı nedir? 📋","a":"Vazife","d":["İş","Ödev"],"exp":"Görev ve Vazife eş anlamlıdır.","spokenText":"Görev kelimesinin eş anlamlısı nedir?"},
      {"q":"\"Acemi\" kelimesinin zıt (karşıt) anlamlısı nedir? 🛠️","a":"Usta","d":["Çırak","Yeni"],"exp":"Aceminin karşıtı ustadır.","spokenText":"Acemi kelimesinin zıt anlamlısı nedir?"},
      {"q":"\"Taze\" ekmeğin zıt anlamlısı nedir? 🥖","a":"Bayat","d":["Çürük","Eski"],"exp":"Taze ekmeğin zıttı bayat ekmektir.","spokenText":"Taze kelimesinin zıt anlamlısı nedir?"},
      {"q":"\"Doğru\" cevabın zıt anlamlısı nedir? ✅","a":"Yanlış","d":["Eksik","Yalan"],"exp":"Doğrunun zıttı yanlıştır.","spokenText":"Doğru kelimesinin zıt anlamlısı nedir?"},
      {"q":"\"Çalışkan\" karıncanın zıt anlamlısı nedir? 🐜","a":"Tembel","d":["Yavaş","Uykucu"],"exp":"Çalışkanın zıttı tembeldir.","spokenText":"Çalışkan kelimesinin zıt anlamlısı nedir?"},
      {"q":"\"Yüksek\" dağın zıt anlamlısı nedir? 🏔️","a":"Alçak","d":["Derin","Kısa"],"exp":"Yükseğin zıttı alçaktır.","spokenText":"Yüksek kelimesinin zıt anlamlısı nedir?"},
      {"q":"\"Ucuz\" meyvenin zıt anlamlısı nedir? 🏷️","a":"Pahalı","d":["Bedava","Zengin"],"exp":"Ucuzun zıttı pahalıdır.","spokenText":"Ucuz kelimesinin zıt anlamlısı nedir?"},
      {"q":"\"Cesur\" aslanın zıt anlamlısı nedir? 🦁","a":"Korkak","d":["Zayıf","Ürkek"],"exp":"Cesurun zıttı korkaktır.","spokenText":"Cesur kelimesinin zıt anlamlısı nedir?"},
      {"q":"\"Temiz\" ellerin zıt anlamlısı nedir? 🧼","a":"Kirli","d":["Islak","Tozlu"],"exp":"Temizin zıttı kirlidir.","spokenText":"Temiz kelimesinin zıt anlamlısı nedir?"},
      {"q":"\"Yaşlı\" dedenin zıt anlamlısı nedir? 👴","a":"Genç","d":["Çocuk","Bebek"],"exp":"Yaşlının zıttı gençtir.","spokenText":"Yaşlı kelimesinin zıt anlamlısı nedir?"},
      {"q":"\"Erken\" uyanmanın zıt anlamlısı nedir? ⏰","a":"Geç","d":["Yavaş","Hızlı"],"exp":"Erkenin zıttı geçtir.","spokenText":"Erken kelimesinin zıt anlamlısı nedir?"},
      {"q":"\"Kolay\" sorunun zıt anlamlısı nedir? ✨","a":"Zor","d":["Ağır","Karışık"],"exp":"Kolayın zıttı zordur.","spokenText":"Kolay kelimesinin zıt anlamlısı nedir?"},
      {"q":"\"Aydınlık\" odanın zıt anlamlısı nedir? 💡","a":"Karanlık","d":["Loş","Gölge"],"exp":"Aydınlığın zıttı karanlıktır.","spokenText":"Aydınlık kelimesinin zıt anlamlısı nedir?"},
      {"q":"\"Barış\" ortamının zıt anlamlısı nedir? 🕊️","a":"Savaş","d":["Kavga","Düşmanlık"],"exp":"Barışın zıttı savaştır.","spokenText":"Barış kelimesinin zıt anlamlısı nedir?"},
      {"q":"\"Dost\" kelimesinin zıt anlamlısı nedir? 🤝","a":"Düşman","d":["Yabancı","Kırgın"],"exp":"Dostun zıttı düşmandır.","spokenText":"Dost kelimesinin zıt anlamlısı nedir?"},
      {"q":"\"Zengin\" kelimesinin zıt anlamlısı nedir? 💰","a":"Yoksul (Fakir)","d":["Cimri","Borçlu"],"exp":"Zenginin zıttı yoksuldur.","spokenText":"Zengin kelimesinin zıt anlamlısı nedir?"},
      {"q":"\"Cömert\" (eli açık) kelimesinin zıt anlamlısı nedir? 🤲","a":"Cimri (eli sıkı)","d":["Kötü","Kıskanç"],"exp":"Cömerdin zıttı cimridir.","spokenText":"Cömert kelimesinin zıt anlamlısı nedir?"},
      {"q":"\"Tatlı\" elmanın zıt anlamlısı nedir? 🍎","a":"Acı","d":["Tuzlu","Ekşi"],"exp":"Tatlının zıttı acıdır.","spokenText":"Tatlı kelimesinin zıt anlamlısı nedir?"},
      {"q":"\"Geniş\" caddenin zıt anlamlısı nedir? 🛣️","a":"Dar","d":["İnce","Kısa"],"exp":"Geniş caddenin zıttı dar sokaktır.","spokenText":"Geniş kelimesinin zıt anlamlısı nedir?"},
      {"q":"\"Yaş\" (ıslak) havlunun zıt anlamlısı nedir? 🌧️","a":"Kuru","d":["Sert","Sıcak"],"exp":"Yaş olanın zıttı kurudur.","spokenText":"Yaş havlunun zıt anlamlısı nedir?"},
      {"q":"\"Ağır\" kutunun zıt anlamlısı nedir? 📦","a":"Hafif","d":["Küçük","Yumuşak"],"exp":"Ağır olanın zıttı hafiftir.","spokenText":"Ağır kutunun zıt anlamlısı nedir?"},
      {"q":"\"Sıcak\" çorbanın zıt anlamlısı nedir? 🍲","a":"Soğuk","d":["Ilık","Acı"],"exp":"Sıcağın zıttı soğuktur.","spokenText":"Sıcak çorbanın zıt anlamlısı nedir?"},
      {"q":"\"Açık\" kapının zıt anlamlısı nedir? 🚪","a":"Kapalı","d":["Kilitli","Kırık"],"exp":"Açığın zıttı kapalıdır.","spokenText":"Açık kapının zıt anlamlısı nedir?"}
    ],

    grade2TurkishAlphabetSyllablePool: [
      {"q":"\"armut, muz, elma\" sözcüklerinin SÖZLÜK SIRASI (alfabetik) hangisidir? 🍎","a":"armut - elma - muz","d":["elma - armut - muz","muz - armut - elma"],"exp":"İlk harfler: a (armut), e (elma), m (muz) sırasıyla gelir.","spokenText":"Armut, muz, elma kelimelerinin sözlük sırası nasıldır?"},
      {"q":"\"çanta, çilek, çorap\" sözcüklerinin sözlük sırası nasıldır? 🎒🍓🧦","a":"çanta - çilek - çorap","d":["çilek - çanta - çorap","çorap - çanta - çilek"],"exp":"İlk harfleri aynı (ç), 2. harflere bakarız: a, i, o sırasıyla gelir.","spokenText":"Çanta, çilek, çorap kelimelerinin alfabetik sözlük sırası nedir?"},
      {"q":"\"baba, balık, bebek\" sözcükleri sözlükte nasıl sıralanır? 👶🐟","a":"baba - balık - bebek","d":["bebek - baba - balık","balık - baba - bebek"],"exp":"İlk iki harfi aynıysa (ba-ba, ba-lık) 3. harfe bakılır; bebek (be) sonra gelir.","spokenText":"Baba, balık, bebek sözcüklerinin sözlük sırası hangisidir?"},
      {"q":"\"kalem, kedi, kitap\" sözcüklerinin doğru sözlük sırası hangisidir? ✏️🐱📖","a":"kalem - kedi - kitap","d":["kitap - kalem - kedi","kedi - kalem - kitap"],"exp":"İlk harfler k; 2. harfler: a (kalem), e (kedi), i (kitap).","spokenText":"Kalem, kedi, kitap kelimelerinin sözlük sıralaması nasıldır?"},
      {"q":"\"gözlük, gül, gemi\" sözcükleri sözlükte nasıl sıralanır? 👓🌹🚢","a":"gemi - gözlük - gül","d":["gözlük - gemi - gül","gül - gemi - gözlük"],"exp":"İkinci harflere göre e (gemi), ö (gözlük), ü (gül) sırasıyla gelir.","spokenText":"Gözlük, gül, gemi kelimelerinin sözlük sırası nasıldır?"},
      {"q":"\"araba, bisiklet, tren\" sözcüklerinin alfabetik sırası hangisidir? 🚗🚲🚂","a":"araba - bisiklet - tren","d":["tren - araba - bisiklet","bisiklet - araba - tren"],"exp":"İlk harfler alfabetik olarak A, B, T sırasındadır.","spokenText":"Araba, bisiklet, tren kelimeleri sözlükte nasıl sıralanır?"},
      {"q":"\"aslan, kedi, leylek\" sözcüklerinin sözlük sırası hangisidir? 🦁🐱🕊️","a":"aslan - kedi - leylek","d":["kedi - aslan - leylek","leylek - kedi - aslan"],"exp":"İlk harfler A, K, L sırasıyla alfabetiktir.","spokenText":"Aslan, kedi, leylek sözcüklerinin sözlük sırası hangisidir?"},
      {"q":"\"maymun, sincap, tavşan\" sözcüklerinin sözlük sırası hangisidir? 🐒🐿️🐇","a":"maymun - sincap - tavşan","d":["tavşan - sincap - maymun","sincap - maymun - tavşan"],"exp":"İlk harfler: M (maymun), S (sincap), T (tavşan).","spokenText":"Maymun, sincap, tavşan kelimeleri sözlükte nasıl sıralanır?"},
      {"q":"Sözlükte \"ayva, kiraz, portakal\" sözcüklerinden hangisi EN ÖNCE gelir? 🍊","a":"Ayva","d":["Kiraz","Portakal"],"exp":"Alfabemizin ilk harfi \"A\" olduğu için Ayva en önce gelir.","spokenText":"Ayva, kiraz, portakal sözcüklerinden hangisi sözlükte en önce gelir?"},
      {"q":"Sözlükte \"zambak, lale, gül\" sözcüklerinden hangisi EN SONDA yer alır? 🌸","a":"Zambak","d":["Lale","Gül"],"exp":"\"Z\" harfi alfabemizin son harfi olduğu için Zambak en sonda yer alır.","spokenText":"Zambak, lale, gül kelimelerinden hangisi sözlükte en sonda yer alır?"},
      {"q":"Sözlükte ilk harfleri AYNI olan kelimeleri sıralarken neye bakarız? 🔍","a":"İkinci harflerine bakarız 🔤","d":["Kelimenin uzunluğuna bakarız","Son harfine bakarız"],"exp":"İlk harfleri aynı olan kelimelerin 2. harfine, onlar da aynıysa 3. harfine bakılır.","spokenText":"İlk harfleri aynı olan kelimeleri alfabetik sıralarken neye bakarız?"},
      {"q":"\"Cumhuriyet\" kelimesi kaç heceden oluşur? 🇹🇷","a":"4 hece (Cüm-hu-ri-yet)","d":["3 hece","5 hece"],"exp":"Cüm-hu-ri-yet kelimesinde 4 ünlü harf (ü, u, i, e) vardır, yani 4 hecelidir.","spokenText":"Cumhuriyet kelimesi kaç hecelidir?"},
      {"q":"\"Öğretmen\" kelimesi kaç hecelidir? 👩‍🏫","a":"3 hece (Öğ-ret-men)","d":["2 hece","4 hece"],"exp":"Öğ-ret-men 3 hecelidir (ö, e, e ünlüleri).","spokenText":"Öğretmen kelimesi kaç hecelidir?"},
      {"q":"\"Kitaplık\" kelimesi kaç hecelidir? 📚","a":"3 hece (Ki-tap-lık)","d":["2 hece","4 hece"],"exp":"Ki-tap-lık 3 heceden oluşur.","spokenText":"Kitaplık kelimesi kaç hecelidir?"},
      {"q":"\"Gözlük\" kelimesi kaç hecelidir? 👓","a":"2 hece (Göz-lük)","d":["1 hece","3 hece"],"exp":"Göz-lük 2 hecelidir.","spokenText":"Gözlük kelimesi kaç hecelidir?"},
      {"q":"\"Televizyon\" kelimesi kaç hecelidir? 📺","a":"4 hece (Te-le-viz-yon)","d":["3 hece","5 hece"],"exp":"Te-le-viz-yon 4 heceden oluşur.","spokenText":"Televizyon kelimesi kaç hecelidir?"},
      {"q":"\"Kütüphane\" kelimesi kaç hecelidir? 🏛️","a":"4 hece (Kü-tüp-ha-ne)","d":["3 hece","5 hece"],"exp":"Kü-tüp-ha-ne 4 hecelidir.","spokenText":"Kütüphane kelimesi kaç hecelidir?"},
      {"q":"\"Papatya\" çiçeğinin adı kaç hecedir? 🌼","a":"3 hece (Pa-pat-ya)","d":["2 hece","4 hece"],"exp":"Pa-pat-ya 3 hecedir.","spokenText":"Papatya kelimesi kaç hecelidir?"},
      {"q":"Bir kelimedeki hece sayısını en kolay yoldan bulmak için ne yaparız? 💡","a":"Sesli (ünlü) harflerini sayarız 🔤","d":["Sessiz harflerini sayarız","Harfleri ikişer sayarız"],"exp":"Her hecede mutlaka bir sesli harf bulunur; sesli harf sayısı = hece sayısıdır.","spokenText":"Bir kelimenin hece sayısını en kolay nasıl buluruz?"},
      {"q":"Hangisi TEK heceli bir kelimedir? 🐺","a":"Kurt","d":["Kedi","Köpek"],"exp":"\"Kurt\" kelimesinde sadece bir ünlü harf (u) vardır, tek hecelidir.","spokenText":"Hangisi tek heceli bir kelimedir?"},
      {"q":"Hangisi İKİ heceli bir kelimedir? 📒","a":"Defter (Def-ter)","d":["Kalemtıraş","Silgi"],"exp":"\"Defter\" iki hecelidir (Def-ter).","spokenText":"Hangisi iki heceli bir kelimedir?"},
      {"q":"Satır sonuna sığmayan \"ilkokul\" kelimesi doğru nasıl bölünür? 🏫","a":"ilk- / okul","d":["il- / kokul","ilko- / kul"],"exp":"Bileşik kelimeler hecelenirken ulama kuralına göre hecelenir: ilk-o-kul.","spokenText":"Satır sonuna sığmayan ilkokul kelimesi kısa çizgi ile nasıl bölünür?"},
      {"q":"Satır sonuna sığmayan \"başöğretmen\" kelimesi doğru nasıl bölünür? 🎖️","a":"ba- / şöğretmen veya başöğ- / retmen","d":["baş- / öğretmen","başö- / ğretmen"],"exp":"Doğru heceleme \"ba-şöğ-ret-men\" şeklindedir.","spokenText":"Satır sonuna sığmayan başöğretmen kelimesi hecesinden nasıl bölünür?"},
      {"q":"Satır sonuna sığmayan \"hanımeli\" çiçeği doğru nasıl bölünür? 🌺","a":"ha- / nımeli veya hanı- / meli değil ha-nı-me-li!","d":["hanım- / eli","han- / ımeli"],"exp":"Birleşik sözcükler \"ha-nı-me-li\" şeklinde hecelenir.","spokenText":"Satır sonuna sığmayan hanımeli kelimesi nasıl bölünür?"},
      {"q":"Satır sonunda veya satır başında TEK BİR HARF bırakılabilir mi? ⚠️","a":"Hayır, tek harf asla bırakılamaz ❌","d":["Evet, her zaman bırakılabilir","Sadece ünlü harfse bırakılır"],"exp":"Satır sonunda veya başında tek harf bırakılmaz (Örn: \"a- raba\" YANLIŞTIR!).","spokenText":"Satır sonunda veya başında tek bir harf bırakılabilir mi?"},
      {"q":"Hangisi satır sonuna sığmadığında YANLIŞ bölünmüştür? ❌","a":"a- / rabası (Tek harf satırda kalamaz)","d":["ara- / bası","araba- / sı"],"exp":"Tek harf \"a-\" satır sonunda tek başına bırakılamaz.","spokenText":"Hangisi satır sonuna sığmadığında yanlış bölünmüştür?"},
      {"q":"Hangisi satır sonuna sığmadığında DOĞRU hecelenerek bölünmüştür? ✅","a":"uçurt- / ma","d":["u- / çurtma","uç- / urtma"],"exp":"\"uçurt-ma\" doğru heceden bölünmüştür; \"u-\" tek harf kalamaz.","spokenText":"Hangisi satır sonuna sığmadığında doğru hecelenerek bölünmüştür?"},
      {"q":"Satır sonuna sığmayan kelimeleri hecelerinden bölmek için hangi işaret kullanılır? ✍️","a":"Kısa çizgi (-)","d":["Nokta (.)","Virgül (,)"],"exp":"Satır sonuna sığmayan sözcükler kısa çizgi (-) ile hecesinden bölünür.","spokenText":"Satır sonuna sığmayan kelimeleri bölmek için hangi noktalama işareti kullanılır?"}
    ],

    grade2TurkishReading5N1KPool: [
      {"q":"Metin: \"Mert, pazar sabahı dedesiyle birlikte göl kenarına balık tutmaya gitti. Kovalarına üç tane kırmızı balık koydular.\"\nSoru: Mert balık tutmaya NE ZAMAN gitmiştir? 🎣","a":"Pazar sabahı","d":["Cumartesi akşamı","Pazartesi öğleden sonra"],"exp":"Metinde \"Mert, pazar sabahı dedesiyle gitti\" denilmektedir.","spokenText":"Metni dinle: Mert, pazar sabahı dedesiyle göl kenarına balık tutmaya gitti. Mert balık tutmaya ne zaman gitmiştir?"},
      {"q":"Metin: \"Küçük kedi Pamuk, yüksek çınar ağacının dalında mahsur kaldı. İtfaiyeci amca merdivenle tırmanıp Pamuk'u kucağına aldı.\"\nSoru: Pamuk'u ağaçtan KİM kurtardı? 🐱","a":"İtfaiyeci amca 🚒","d":["Bahçıvan","Mahalle bakkalı"],"exp":"Pamuk'u merdivenle tırmanıp kurtaran itfaiyeci amcadır.","spokenText":"Küçük kedi Pamuk çınar ağacında mahsur kaldı. İtfaiyeci amca merdivenle tırmanıp Pamuk'u kurtardı. Pamuk'u kim kurtardı?"},
      {"q":"Metin: \"Ece, okul kütüphanesinden aldığı masal kitabını kimseyi rahatsız etmemek için sessizce okudu.\"\nSoru: Ece kitabı NASIL okudu? 📖","a":"Sessizce","d":["Şarkı söyleyerek","Bağırarak"],"exp":"Metinde Ece'nin kitabı sessizce okuduğu belirtilmiştir.","spokenText":"Ece, kütüphaneden aldığı kitabı kimseyi rahatsız etmemek için sessizce okudu. Ece kitabı nasıl okudu?"},
      {"q":"Metin: \"Ali, dışarıda şiddetli yağmur yağdığı için teneffüste bahçeye çıkamadı.\"\nSoru: Ali bahçeye NİÇİN çıkamadı? 🌧️","a":"Şiddetli yağmur yağdığı için","d":["Uykusu geldiği için","Zili duymadığı için"],"exp":"Ali dışarıda yağmur yağdığı için bahçeye çıkamamıştır.","spokenText":"Ali, dışarıda şiddetli yağmur yağdığı için teneffüste bahçeye çıkamadı. Ali bahçeye niçin çıkamadı?"},
      {"q":"Metin: \"Selin, okuldan sonra resim yarışması için rengarenk bir doğa resmi çizdi.\"\nSoru: Selin NE çizmiştir? 🎨","a":"Doğa resmi","d":["Uzay gemisi","Araba"],"exp":"Metinde Selin'in doğa resmi çizdiği yazmaktadır.","spokenText":"Selin, okuldan sonra resim yarışması için rengarenk bir doğa resmi çizdi. Selin ne çizmiştir?"},
      {"q":"Metin: \"Göçmen kuşlar sonbahar gelip havalar soğuyunca sıcak ülkelere doğru göç ederler.\"\nSoru: Kuşlar NEREYE doğru göç ederler? 🕊️","a":"Sıcak ülkelere","d":["Buzullara","Karlı dağlara"],"exp":"Kuşlar soğuktan korunmak için sıcak ülkelere uçar.","spokenText":"Göçmen kuşlar sonbaharda sıcak ülkelere doğru göç ederler. Kuşlar nereye doğru göç ederler?"},
      {"q":"Metin: \"Emre sabah erkenden uyandı. Elini yüzünü yıkadı, kahvaltısını yaptı. En sonunda çantasını alıp okula gitti.\"\nSoru: Olayların oluş sırasına göre Emre EN SON ne yapmıştır? 🎒","a":"Çantasını alıp okula gitmiştir","d":["Uyanmıştır","Kahvaltı yapmıştır"],"exp":"Oluş sırasına göre en son yapılan eylem okula gitmektir.","spokenText":"Emre sabah uyandı, elini yüzünü yıkadı, kahvaltısını yaptı ve en sonunda çantasını alıp okula gitti. Emre en son ne yapmıştır?"},
      {"q":"Metin: \"Ağaçlar çiçek açar, kuşlar neşeyle cıvıldaşır, kelebekler uçar ve her yer yemyeşil olur.\"\nSoru: Bu kısa metne en uygun BAŞLIK hangisidir? 🌱","a":"İlkbaharın Gelişi 🌸","d":["Kış Eğlencesi ❄️","Çöl Hayatı 🏜️"],"exp":"Çiçekler, kelebekler ve yeşillik ilkbahar mevsimini anlatır.","spokenText":"Ağaçlar çiçek açar, kuşlar cıvıldaşır, kelebekler uçar. Bu metne en uygun başlık hangisidir?"},
      {"q":"Metin: \"Barış, sokakta bacağı incinmiş minik köpeği görünce hemen veterinere götürdü. Veteriner köpeğin bacağını sardı.\"\nSoru: Barış köpeği NEREYE götürmüştür? 🐕","a":"Veteriner kliniğine","d":["Markete","Parka"],"exp":"Yaralı köpeğin tedavisi için veterinere götürmüştür.","spokenText":"Barış sokakta yaralı köpeği görünce veterinere götürdü. Barış köpeği nereye götürmüştür?"},
      {"q":"Metin: \"Kerem dişlerini düzenli fırçalamayı unuttuğu için dişi çok ağrıdı.\"\nSoru: Kerem'in dişi NİÇİN ağrımıştır? 🦷","a":"Dişlerini fırçalamayı unuttuğu için","d":["Çok su içtiği için","Erken uyuduğu için"],"exp":"Kerem dişlerini fırçalamadığı için dişi ağrımıştır.","spokenText":"Kerem dişlerini fırçalamayı unuttuğu için dişi çok ağrıdı. Kerem'in dişi niçin ağrımıştır?"},
      {"q":"Metin: \"Zeynep, doğum günü partisi için annesiyle birlikte nefis bir çilekli pasta yaptı.\"\nSoru: Zeynep pastayı KİMLE birlikte yaptı? 🎂","a":"Annesiyle birlikte","d":["Öğretmeniyle","Komşusuyla"],"exp":"Zeynep pastayı annesiyle birlikte yapmıştır.","spokenText":"Zeynep doğum günü için annesiyle çilekli pasta yaptı. Zeynep pastayı kimle birlikte yaptı?"},
      {"q":"Metin: \"Deniz, ders başlamadan önce sırasının altında kaybettiği kırmızı silgisini bulunca çok sevindi.\"\nSoru: Deniz silgisini NEREDE buldu? 🔍","a":"Sırasının altında","d":["Çantasının cebinde","Öğretmen masasında"],"exp":"Metinde \"sırasının altında buldu\" ifadesi yer alır.","spokenText":"Deniz kaybettiği kırmızı silgisini sırasının altında buldu. Deniz silgisini nerede buldu?"},
      {"q":"Metin: \"Can, sabah saat sekizde okul servisinin geldiğini görünce hemen kapıya koştu.\"\nSoru: Okul servisi NE ZAMAN geldi? ⏰","a":"Sabah saat sekizde","d":["Öğlen saat birde","Akşam saat beşte"],"exp":"Metinde sabah saat sekiz olarak belirtilmiştir.","spokenText":"Can sabah saat sekizde okul servisinin geldiğini gördü. Okul servisi ne zaman geldi?"},
      {"q":"Metin: \"Ayşe, soğuk kış gününde pencerenin önüne konan minik kuşa ekmek kırıntıları ve buğday verdi.\"\nSoru: Ayşe kuşa NE vermiştir? 🐦","a":"Ekmek kırıntıları ve buğday","d":["Peynir ve zeytin","Meyve suyu"],"exp":"Ayşe kuşa ekmek kırıntısı ve buğday vermiştir.","spokenText":"Ayşe pencerenin önüne konan kuşa ekmek kırıntıları ve buğday verdi. Ayşe kuşa ne verdi?"},
      {"q":"Metin: \"Tavşan hızına çok güvendiği için yol kenarında uyuyakaldı, azimli kaplumbağa ise hiç durmadan yürüyüp yarışı kazandı.\"\nSoru: Yarışı KİM kazandı? 🐢","a":"Azimli kaplumbağa 🐢","d":["Hızlı tavşan 🐇","Orman faresi 🐭"],"exp":"Durmadan yürüyen azimli kaplumbağa yarışı kazanmıştır.","spokenText":"Tavşan yol kenarında uyuyakaldı, azimli kaplumbağa hiç durmadan yürüyüp yarışı kazandı. Yarışı kim kazandı?"},
      {"q":"Metin: \"Önce tohumu toprağa ektik, sonra can suyu verdik, en sonunda yeşil filizler açtı.\"\nSoru: Olayların oluş sırasına göre EN BAŞTA ne yapılmıştır? 🌱","a":"Tohum toprağa ekilmiştir","d":["Can suyu verilmiştir","Filizler çıkmıştır"],"exp":"İlk adım tohumun toprağa ekilmesidir.","spokenText":"Önce tohumu toprağa ektik, sonra can suyu verdik, en sonunda filizler açtı. İlk başta ne yapılmıştır?"},
      {"q":"Metin: \"Yağmur dindikten sonra gökyüzünde rengarenk pırıl pırıl bir gökkuşağı belirdi.\"\nSoru: Gökkuşağı NE ZAMAN belirdi? 🌈","a":"Yağmur dindikten sonra","d":["Güneş doğmadan önce","Gece yarısı"],"exp":"Metinde yağmur dindikten sonra belirdiği ifade edilir.","spokenText":"Yağmur dindikten sonra gökyüzünde rengarenk bir gökkuşağı belirdi. Gökkuşağı ne zaman belirdi?"},
      {"q":"Metin: \"Karıncalar kış mevsimine hazırlık yapmak için yuvalarına durmadan yiyecek taşırlar.\"\nSoru: Karıncalar yuvalarına NİÇİN yiyecek taşırlar? 🐜","a":"Kış mevsimine hazırlık yapmak için","d":["Oyun oynamak için","Yuvalarını süslemek için"],"exp":"Karıncalar kışa hazırlık amacıyla yiyecek toplarlar.","spokenText":"Karıncalar kış mevsimine hazırlık yapmak için yuvalarına durmadan yiyecek taşırlar. Karıncalar niçin yiyecek taşırlar?"},
      {"q":"Metin: \"Güneş yavaşça batarken gökyüzü turuncuya boyandı ve serin bir akşam rüzgarı esti.\"\nSoru: Güneş NASIL batmıştır? 🌅","a":"Yavaşça","d":["Aniden","Gürültüyle"],"exp":"Güneşin yavaşça battığı belirtilmiştir.","spokenText":"Güneş yavaşça batarken gökyüzü turuncuya boyandı. Güneş nasıl batmıştır?"},
      {"q":"Metin: \"Defne, ödevini bitirince odasındaki oyuncakları topladı ve annesine sofrayı kurmada yardım etti.\"\nSoru: Defne odasını NE ZAMAN topladı? 🧸","a":"Ödevini bitirince","d":["Sabah uyanınca","Okula gitmeden önce"],"exp":"Defne ödevini bitirdikten sonra odasını toplamıştır.","spokenText":"Defne, ödevini bitirince odasındaki oyuncakları topladı. Defne odasını ne zaman topladı?"},
      {"q":"Metin: \"Ormandaki tüm sevimli hayvanlar bilge baykuşun anlattığı masalı dinlemek için büyük çınarın altına toplandı.\"\nSoru: Hayvanlar KİMİ dinlemek için toplandı? 🦉","a":"Bilge baykuşu 🦉","d":["Kurnaz tilkiyi","Hızlı tavşanı"],"exp":"Hayvanlar bilge baykuşun masalını dinlemek için toplanmıştır.","spokenText":"Ormandaki tüm hayvanlar bilge baykuşun anlattığı masalı dinlemek için toplandı. Hayvanlar kimi dinlemek için toplandı?"},
      {"q":"Metin: \"Burak her gün en az yirmi sayfa kitap okur. Kitap okudukça yeni bilgiler öğrenir ve hayal gücü gelişir.\"\nSoru: Bu metnin ANA DÜŞÜNCESİ (konusu) nedir? 📖","a":"Kitap okumanın yararları 💡","d":["Erken uyanmanın önemi","Spor yapmanın faydası"],"exp":"Metin kitap okumanın insana kazandırdığı faydaları anlatır.","spokenText":"Burak her gün yirmi sayfa kitap okur. Kitap okudukça bilgisi ve hayal gücü artar. Bu metnin konusu nedir?"}
    ],

    grade2TurkishSentenceLogicPool: [
      {"q":"\"okula - Ali - gitti - sabah\" sözcükleriyle kurulan ANLAMLI ve KURALLI cümle hangisidir? 🎒","a":"Ali sabah okula gitti.","d":["Gitti Ali okula sabah.","Sabah gitti okula Ali."],"exp":"Kurallı cümlede iş, oluş bildiren kelime (yüklem) cümlenin sonunda yer alır.","spokenText":"Okula, Ali, gitti, sabah kelimeleriyle kurulan anlamlı ve kurallı cümle hangisidir?"},
      {"q":"\"kitap - Zeynep - okudu - akşam\" sözcükleriyle kurulan kurallı cümle hangisidir? 📖","a":"Zeynep akşam kitap okudu.","d":["Okudu Zeynep kitap akşam.","Akşam okudu Zeynep kitap."],"exp":"\"Okudu\" iş bildiren kelime olduğu için cümlenin sonunda olmalıdır.","spokenText":"Kitap, Zeynep, okudu, akşam sözcükleriyle kurulan kurallı cümle hangisidir?"},
      {"q":"\"yaptı - resim - güzel - Ayşe\" sözcükleriyle kurulan kurallı cümle hangisidir? 🎨","a":"Ayşe güzel resim yaptı.","d":["Yaptı Ayşe güzel resim.","Güzel yaptı Ayşe resim."],"exp":"Kurallı cümlede yapılan işi bildiren \"yaptı\" sözcüğü sonda bulunur.","spokenText":"Yaptı, resim, güzel, Ayşe sözcükleriyle kurulan kurallı cümle hangisidir?"},
      {"q":"\"uçtu - gökyüzünde - kuşlar\" sözcükleriyle kurulan kurallı cümle hangisidir? 🐦","a":"Kuşlar gökyüzünde uçtu.","d":["Uçtu kuşlar gökyüzünde.","Gökyüzünde uçtu kuşlar."],"exp":"Hareket bildiren \"uçtu\" kelimesi cümlenin sonunda yer alır.","spokenText":"Uçtu, gökyüzünde, kuşlar sözcükleriyle kurulan kurallı cümle hangisidir?"},
      {"q":"\"pazardan - elma - aldık - taze\" karışık kelimeleriyle kurulan kurallı cümle hangisidir? 🍎","a":"Pazardan taze elma aldık.","d":["Aldık pazardan taze elma.","Taze aldık pazardan elma."],"exp":"\"Aldık\" eylemi cümlenin en sonunda yer alır.","spokenText":"Pazardan, elma, aldık, taze kelimeleriyle kurulan kurallı cümle hangisidir?"},
      {"q":"Kurallı bir cümlede iş, oluş veya hareket bildiren kelime cümlenin NERESİNDE yer alır? 📝","a":"Cümlenin sonunda yer alır ✍️","d":["Cümlenin başında yer alır","Cümlenin tam ortasında yer alır"],"exp":"Türkçemizde kurallı cümlelerin yüklemi (eylemi) daima cümlenin sonundadır.","spokenText":"Kurallı bir cümlede iş veya hareket bildiren kelime cümlenin neresinde yer alır?"},
      {"q":"\"Hava çok soğuk olduğu için ...\" cümlesi hangisiyle tamamlanırsa ANLAMLI bir sebep-sonuç cümlesi olur? ❄️","a":"... kalın montunu giydi. 🧥","d":["... dondurma yemeye gitti.","... denize yüzmeye gitti."],"exp":"Soğuk havanın sonucu kalın mont giymektir.","spokenText":"Hava çok soğuk olduğu için cümlesi hangisiyle tamamlanırsa anlamlı bir sebep sonuç cümlesi olur?"},
      {"q":"\"Dersine düzenli çalıştığı için ...\" cümlesi nasıl tamamlanmalıdır? 📚","a":"... sınavdan yüksek not aldı. 💯","d":["... dersi dinlemedi.","... kalemini kaybetti."],"exp":"Düzenli çalışmanın sonucu başarıdır.","spokenText":"Dersine düzenli çalıştığı için cümlesi mantıklı nasıl tamamlanır?"},
      {"q":"\"Alarm çalmadığı için ...\" cümlesi en uygun nasıl tamamlanır? ⏰","a":"... sabah uyanmakta gecikti.","d":["... erkenden okula vardı.","... kahvaltısını iki kez yaptı."],"exp":"Alarm çalmayınca uyanmak gecikir.","spokenText":"Alarm çalmadığı için cümlesi nasıl tamamlanmalıdır?"},
      {"q":"\"Karnı çok acıktığı için ...\" cümlesi en uygun hangisiyle tamamlanır? 🥪","a":"... hemen mutfağa koşup yemek yedi.","d":["... dışarı çıkıp koştu.","... kitap okumaya başladı."],"exp":"Acıkmanın mantıklı sonucu yemek yemektir.","spokenText":"Karnı çok acıktığı için cümlesi nasıl tamamlanır?"},
      {"q":"Aşağıdaki cümlelerden hangisi bir SEBEP-SONUÇ cümlesidir? ☔","a":"Yağmur yağdığı için şemsiyesini açtı.","d":["Yarın arkadaşlarımla parkta oynayacağım.","Mavi kazağımı çok beğeniyorum."],"exp":"Yağmur yağması sebep, şemsiye açmak ise sonuçtur.","spokenText":"Aşağıdaki cümlelerden hangisi bir sebep sonuç cümlesidir?"},
      {"q":"\"Gözleri bozulduğu için ...\" cümlesinin mantıklı sonucu hangisidir? 👓","a":"... doktora gidip gözlük takmaya başladı.","d":["... müzik dinledi.","... koşu yarışına katıldı."],"exp":"Göz bozulunca göz doktoruna gidilir ve gözlük takılır.","spokenText":"Gözleri bozulduğu için cümlesinin mantıklı sonucu hangisidir?"},
      {"q":"Aşağıdaki kelimelerden hangisi ÇOĞUL bir kelimedir? 🌳","a":"Ağaçlar","d":["Orman","Fidan"],"exp":"\"-lar\" çoğul ekini alan \"Ağaçlar\" birden fazla ağacı belirtir.","spokenText":"Aşağıdaki kelimelerden hangisi çoğul bir kelimedir?"},
      {"q":"Aşağıdaki kelimelerden hangisi TEKİL bir kelimedir? ✏️","a":"Kalem","d":["Defterler","Silgiler"],"exp":"Kalem çoğul eki almamıştır, tek bir varlığı gösterir.","spokenText":"Aşağıdaki kelimelerden hangisi tekil bir kelimedir?"},
      {"q":"\"Öğrenci\" kelimesine çoğul eki gelirse nasıl yazılır? 🎒","a":"Öğrenciler","d":["Öğrencilar","Öğrencil"],"exp":"İnce ünlüyle bittiği için \"-ler\" eki gelir: Öğrenciler.","spokenText":"Öğrenci kelimesine çoğul eki gelirse nasıl yazılır?"},
      {"q":"\"Çiçek\" kelimesinin çoğul hali hangisidir? 🌸","a":"Çiçekler","d":["Çiçeklar","Çiçek"],"exp":"Çiçek sözcüğünün çoğulu \"Çiçekler\"dir.","spokenText":"Çiçek kelimesinin çoğul hali hangisidir?"},
      {"q":"\"Elma\" kelimesinin çoğul hali hangisidir? 🍎","a":"Elmalar","d":["Elmaler","Elmas"],"exp":"Kalın ünlü içerdiği için \"-lar\" eki alır: Elmalar.","spokenText":"Elma kelimesinin çoğul hali hangisidir?"},
      {"q":"Aşağıdakilerden hangisi birden çok varlığı ifade eder? 🐦","a":"Kuşlar 🐦🐦","d":["Güneş ☀️","Bulut ☁️"],"exp":"\"Kuşlar\" çoğuldur, kuş birden fazladır.","spokenText":"Hangisi birden çok varlığı ifade eder?"},
      {"q":"Soru eki olan \"mı, mi, mu, mü\" nasıl yazılır? ✍️","a":"Kendisinden önceki kelimeden DAİMA AYRI yazılır ✍️","d":["Kelimeye bitişik yazılır","Kesme işaretiyle birleştirilir"],"exp":"Soru eki mı/mi/mu/mü her zaman kendinden önceki kelimeden ayrı yazılır.","spokenText":"Soru eki olan mı, mi, mu, mü nasıl yazılır?"},
      {"q":"Aşağıdaki cümlelerin hangisinde soru ekinin yazımı DOĞRUDUR? ❓","a":"Sen de bizimle gelecek misin?","d":["Sen de bizimle gelecekmisin?","Sen de bizimle gelecek mis in?"],"exp":"\"misin\" soru eki kelimeden ayrı yazılır: \"gelecek misin?\"","spokenText":"Aşağıdaki cümlelerin hangisinde soru ekinin yazımı doğrudur?"},
      {"q":"Hangisinde soru eki DOĞRU yazılmıştır? 📖","a":"Ödevini bitirdin mi?","d":["Ödevini bitirdinmi?","Ödevinimi bitirdin?"],"exp":"\"bitirdin mi?\" şeklinde ayrı yazılmalıdır.","spokenText":"Hangisinde soru eki doğru yazılmıştır?"},
      {"q":"Hangisinde yazım YANLIŞI vardır? ❌","a":"Bugün sinemaya gidiyormuyuz?","d":["Bugün okula gittin mi?","Kitabını okudun mu?"],"exp":"\"gidiyor muyuz?\" şeklinde \"muyuz\" ayrı yazılmalıydı.","spokenText":"Hangisinde soru ekinin yazımında yanlışlık yapılmıştır?"}
    ],

    grade2TurkishPunctuationSpellingPool: [
      {"q":"\"Ali bugün okula gitti( )\" Cümlesinin sonuna hangi noktalama işareti konur? ✍️","a":"Nokta (.)","d":["Soru işareti (?)","Ünlem (!)"],"exp":"Tamamlanmış haber cümlelerinin sonuna nokta (.) konur.","spokenText":"Ali bugün okula gitti cümlesinin sonuna hangi işaret konur?"},
      {"q":"\"2( ) sınıf öğrencisiyiz.\" Sıra bildiren (ikinci) sayısının yanına hangi işaret konur? 🥇","a":"Nokta (.)","d":["Virgül (,)","Soru işareti (?)"],"exp":"Sıra bildirmek için sayıların yanına nokta konur (2. = ikinci).","spokenText":"Sıra bildiren sayının yanına hangi işaret konur?"},
      {"q":"Tarihlerin yazılışında gün, ay ve yıl arasına hangi noktalama işareti konur? 📅","a":"Nokta (.)","d":["Soru işareti (?)","Ünlem (!)"],"exp":"Örnek: 29.10.1923 şeklinde aralara nokta (.) konur.","spokenText":"Tarihlerin yazılışında gün, ay ve yıl arasına ne konur?"},
      {"q":"\"Bugün hava pırıl pırıl ve çok güzel( )\" Cümlesinin sonuna ne konur? ☀️","a":"Nokta (.)","d":["Soru işareti (?)","Virgül (,)"],"exp":"Haber cümlesi olduğu için sonuna nokta (.) konur.","spokenText":"Bugün hava çok güzel cümlesinin sonuna ne konur?"},
      {"q":"\"Sen de bizimle parka gelecek misin( )\" Cümlesinin sonuna hangi noktalama işareti konur? ❓","a":"Soru işareti (?)","d":["Nokta (.)","Virgül (,)"],"exp":"Soru bildiren cümlelerin sonuna soru işareti (?) konur.","spokenText":"Sen de bizimle parka gelecek misin cümlesinin sonuna ne konur?"},
      {"q":"\"Saat kaçta buluşacağız( )\" Cümlesinin sonuna ne konur? ⏰","a":"Soru işareti (?)","d":["Nokta (.)","Ünlem (!)"],"exp":"Saat sorulduğu için soru işareti (?) kullanılır.","spokenText":"Saat kaçta buluşacağız cümlesinin sonuna ne konur?"},
      {"q":"\"Kitabını açtın mı( )\" Cümlesinin sonuna hangi işaret gelir? 📖","a":"Soru işareti (?)","d":["Nokta (.)","Virgül (,)"],"exp":"Soru sorulduğu için soru işareti konur.","spokenText":"Kitabını açtın mı cümlesinin sonuna hangi işaret konur?"},
      {"q":"\"Kiminle konuştun( )\" Cümlesinin sonuna ne konur? 📱","a":"Soru işareti (?)","d":["Nokta (.)","Ünlem (!)"],"exp":"Soru bildirdiği için soru işareti (?) konur.","spokenText":"Kiminle konuştun cümlesinin sonuna ne konur?"},
      {"q":"Hangisi bir soru cümlesidir? ❓","a":"Ödevini yaptın mı?","d":["Ödevimi bitirdim.","Çok güzel bir gün!"],"exp":"\"Yaptın mı?\" soru bildirmektedir.","spokenText":"Hangisi bir soru cümlesidir?"},
      {"q":"\"Eyvah, süt döküldü( )\" Cümlesinin sonuna hangi noktalama işareti konur? ⚠️","a":"Ünlem işareti (!)","d":["Nokta (.)","Soru işareti (?)"],"exp":"Korku, heyecan, şaşkınlık bildiren cümlelerin sonuna ünlem işareti (!) konur.","spokenText":"Eyvah süt döküldü cümlesinin sonuna ne konur?"},
      {"q":"\"Yaşasın, sınavdan 100 aldım( )\" Cümlesinin sonuna ne konur? 🎉","a":"Ünlem işareti (!)","d":["Soru işareti (?)","Nokta (.)"],"exp":"Sevinç ve coşku bildiren cümlelerin sonuna ünlem (!) konur.","spokenText":"Yaşasın sınavdan yüz aldım cümlesinin sonuna ne konur?"},
      {"q":"\"İmdat, boğuluyorum( )\" Cümlesinin sonuna hangi noktalama işareti konur? 🌊","a":"Ünlem işareti (!)","d":["Nokta (.)","Soru işareti (?)"],"exp":"Acil durum ve yardım çağrılarında ünlem işareti (!) kullanılır.","spokenText":"İmdat boğuluyorum cümlesinin sonuna ne konur?"},
      {"q":"Hangisi bir ünlem cümlesidir? ⚡","a":"Dikkat et, araba geliyor!","d":["Araba çok hızlı gitti.","Araba ne renk?"],"exp":"Uyarı ve heyecan bildiren cümle ünlem cümlesidir.","spokenText":"Hangisi bir ünlem cümlesidir?"},
      {"q":"\"Pazardan elma( ) armut ve muz aldık.\" Parantez içine hangi işaret gelmelidir? 🍎","a":"Virgül (,)","d":["Nokta (.)","Kesme işareti (')"],"exp":"Birbiri ardınca sıralanan eş görevli kelimeler arasına virgül (,) konur.","spokenText":"Pazardan elma, armut ve muz aldık cümlesinde boşluğa ne gelir?"},
      {"q":"\"Çantamda kalem( ) silgi ve defter var.\" Boşluğa ne gelmelidir? 🎒","a":"Virgül (,)","d":["Nokta (.)","Ünlem (!)"],"exp":"Sıralanan eşyalar arasına virgül (,) konur.","spokenText":"Çantamda kalem silgi ve defter var cümlesinde araya ne konur?"},
      {"q":"\"Ah( ) ayağım taşa çarptı!\" Acı bildiren ünlemden sonra virgül konabilir mi? 🥺","a":"Evet, virgül konur 🥺","d":["Hayır, hiçbir şey konmaz","Sadece nokta konur"],"exp":"Ünlem sözcüğünden sonra virgül konup ünlem işareti cümlenin sonuna bırakılabilir.","spokenText":"Ah ayağım taşa çarptı cümlesinde ahtan sonra virgül konabilir mi?"},
      {"q":"\"Ankara( )ya hızlı trenle gittik.\" Şehir adına gelen eki ayırmak için ne kullanılır? 🏛️","a":"Kesme işareti (')","d":["Virgül (,)","Kısa çizgi (-)"],"exp":"Özel isimlere getirilen ekleri ayırmak için kesme işareti (') kullanılır.","spokenText":"Ankaraya hızlı trenle gittik cümlesinde şehir adına gelen eki ayırmak için ne kullanılır?"},
      {"q":"\"Kedimiz Pamuk( )un aşılarını yaptırdık.\" Hayvan adlarına gelen eki ayırmak için ne kullanılır? 🐱","a":"Kesme işareti (')","d":["Virgül (,)","Nokta (.)"],"exp":"Hayvanlara verilen özel isimlere gelen ekler kesme işaretiyle (') ayrılır.","spokenText":"Kedimiz Pamukun aşılarını yaptırdık cümlesinde hangi işaret kullanılır?"},
      {"q":"\"Atatürk( )ün hayatını okudum.\" Boşluğa hangi işaret gelir? 🇹🇷","a":"Kesme işareti (')","d":["Virgül (,)","Nokta (.)"],"exp":"Atatürk özel isim olduğu için gelen ek kesme işaretiyle (') ayrılır.","spokenText":"Atatürkün hayatını okudum cümlesinde boşluğa ne gelir?"},
      {"q":"\"29 Ekim Cumhuriyet Bayramı( )nı coşkuyla kutladık.\" Boşluğa ne konur? 🎈","a":"Kesme işareti (')","d":["Nokta (.)","Kısa çizgi (-)"],"exp":"Milli ve dini bayram adlarına gelen ekler kesme işaretiyle ayrılır.","spokenText":"Cumhuriyet Bayramını kutladık cümlesinde bayram adına gelen ek neyle ayrılır?"},
      {"q":"\"Türkiye( )nin başkenti Ankara( )dır.\" Cümlesinde parantezlere ne konur? 🏛️","a":"Kesme işareti (')","d":["Virgül (,)","Nokta (.)"],"exp":"Türkiye ve Ankara özel isimlerine gelen ekler kesme işaretiyle ayrılır.","spokenText":"Türkiyenin başkenti Ankaradır cümlesinde ekleri neyle ayırırız?"},
      {"q":"Hangisinin yazımı DOĞRUDUR? 🐶","a":"Karabaş'a yemek verdim.","d":["karabaşa yemek verdim.","Karabaşa yemek verdim."],"exp":"Hayvanlara verdiğimiz isimler de özel isimdir, büyük harfle başlar ve ek kesmeyle ayrılır.","spokenText":"Hangisinin yazımı doğrudur?"},
      {"q":"Cümlelerin ilk harfi DAİMA nasıl başlar? ✍️","a":"Büyük harfle başlar 🔤","d":["Küçük harfle başlar","Fark etmez"],"exp":"Türkçemizde her cümle mutlaka büyük harfle başlar.","spokenText":"Cümlelerin ilk harfi daima nasıl başlar?"},
      {"q":"Hangisi özel bir isimdir ve ilk harfi daima BÜYÜK yazılmalıdır? 🇹🇷","a":"Mustafa","d":["kalem","defter"],"exp":"İnsan adları (özel isimler) her zaman büyük harfle başlar.","spokenText":"Hangisi özel bir isimdir ve ilk harfi daima büyük yazılmalıdır?"},
      {"q":"Şiirlerin her bir dizesi (mısrası) nasıl başlar? 📜","a":"Büyük harfle başlar","d":["Küçük harfle başlar","İstediğimiz gibi"],"exp":"Şiirlerin her dizesi büyük harfle başlatılır.","spokenText":"Şiirlerin her bir dizesi nasıl başlar?"},
      {"q":"Aşağıdaki cümlelerin hangisinde yazım yanlışı YOKTUR? ✅","a":"Mehmet dün Bursa'ya gitti.","d":["mehmet dün bursa'ya gitti.","Mehmet dün bursaya gitti."],"exp":"Cümle başı ve şehir adı büyük harfle başlar, kesme işaretiyle ek ayrılır.","spokenText":"Hangi cümlede yazım yanlışı yoktur?"},
      {"q":"Satır sonuna sığmayan kelimeleri hecelerinden bölmek için ne kullanılır? ✍️","a":"Kısa çizgi (-)","d":["Nokta (.)","Virgül (,)"],"exp":"Satır sonuna sığmayan sözcükler hecesinden kısa çizgiyle (-) bölünür.","spokenText":"Satır sonuna sığmayan kelimeleri bölmek için ne kullanılır?"},
      {"q":"Cümle içinde konuşma çizgisi (uzun çizgi) nerede kullanılır? 🗣️","a":"Karşılıklı konuşmaların başında 🗣️","d":["Cümlenin sonunda","Kelime aralarında"],"exp":"Diyaloglarda konuşan kişinin sözü başına uzun çizgi (—) konur.","spokenText":"Konuşma çizgisi nerede kullanılır?"}
    ],

    // 2. Sınıf Türkçe Karma Üreteci (5 Öğrenme Alanından Dengeli Çekim)
    generateGrade2TurkishKarma() {
      const topic = Math.floor(Math.random() * 5);
      if (topic === 0) return this.drawFromPool(this.grade2TurkishSynAntPool, "grade2TurkishSynAntPool");
      if (topic === 1) return this.drawFromPool(this.grade2TurkishAlphabetSyllablePool, "grade2TurkishAlphabetSyllablePool");
      if (topic === 2) return this.drawFromPool(this.grade2TurkishReading5N1KPool, "grade2TurkishReading5N1KPool");
      if (topic === 3) return this.drawFromPool(this.grade2TurkishSentenceLogicPool, "grade2TurkishSentenceLogicPool");
      return this.drawFromPool(this.grade2TurkishPunctuationSpellingPool, "grade2TurkishPunctuationSpellingPool");
    },

    // 2. SINIF BÜYÜK KARMA DÜELLO (Hayat Bilgisi, Matematik, Türkçe)
    generateGrade2GrandDuel() {
      const subjectIdx = Math.floor(Math.random() * 3);
      if (subjectIdx === 0) return this.generateGrade2MathKarma();
      if (subjectIdx === 1) return this.generateGrade2TurkishKarma();
      return this.generateGrade2LifeScienceKarma();
    },

    // Geriye dönük uyumluluk takma adları
    get grade2SynAntPool() { return this.grade2TurkishSynAntPool; },
    get grade2PunctuationPool() { return this.grade2TurkishPunctuationSpellingPool; },
    get grade2TurkishPool() { return this.grade2TurkishSynAntPool; },

// -------------------------------------------------------------
// 2. SINIF: 2026 TÜRKİYE YÜZYILI MAARİF MODELİ HAYAT BİLGİSİ SORU HAVUZLARI
// (6 Öğrenme Alanı - Her Temada 20 Özgün, Eğitici Soru + TTS Sesli Okuma)
// -------------------------------------------------------------

    // Tema 1: Ben ve Okulum (Okulumuzda Hayat - 20 Soru)
    grade2LifeScienceSchoolPool: [
      {
        q: 'Sınıfımızdaki arkadaşlarımızın boy, saç rengi veya ilgi alanlarının farklı olması neyi gösterir? 🤝',
        spokenText: 'Arkadaşlarımızın boy veya ilgi alanlarının farklı olması neyi gösterir?',
        a: 'Bireysel farklılıklarımızı ve zenginliğimizi 🤝',
        d: ['Kusurlu olduğumuzu ❌', 'Birbirimizle tartışmamız gerektiğini 😠'],
        exp: 'Her birey özeldir; fiziksel ve kişisel farklılıklarımız sınıfımızın zenginliğidir.'
      },
      {
        q: 'Gözlük veya işitme cihazı kullanan bir arkadaşımıza karşı nasıl davranmalıyız? 👓',
        spokenText: 'Gözlük veya işitme cihazı kullanan arkadaşımıza nasıl davranmalıyız?',
        a: 'Saygılı, anlayışlı ve destekleyici 🤝',
        d: ['Onunla alay etmeliyiz 🚫', 'Oyunlara almamalıyız ❌'],
        exp: 'Bireysel farklılıklara ve özel ihtiyaçlara daima saygı ve empati gösteririz.'
      },
      {
        q: 'Okul lavabosunda ellerimizi sabunlarken musluğu açık bırakmak neye sebep olur? 🚰',
        spokenText: 'Ellerimizi sabunlarken musluğu açık bırakmak neye sebep olur?',
        a: 'Su israfına ve kaynakların tükenmesine 💧',
        d: ['Daha temiz olmamıza ✨', 'Sabunun köpürmesine 🫧'],
        exp: 'Eller sabunlanırken musluk kapatılarak su tasarrufu sağlanır.'
      },
      {
        q: 'Gündüz hava güneşli ve sınıfımız aydınlıkken lambaları açık bırakmak nedir? 💡',
        spokenText: 'Gündüz sınıf aydınlıkken lambaları açık bırakmak nedir?',
        a: 'Elektrik israfıdır 💡',
        d: ['Doğru bir davranıştır ✅', 'Daha iyi görmemizi sağlar 👀'],
        exp: 'Gündüz yeterli gün ışığı varsa lambalar kapatılarak enerji tasarrufu yapılır.'
      },
      {
        q: 'Grup çalışmalarında başarılı olmak için grup üyeleri arasında ne olmalıdır? 👥',
        spokenText: 'Grup çalışmalarında başarılı olmak için ne olmalıdır?',
        a: 'İş birliği, yardımlaşma ve adil görev paylaşımı 🤝',
        d: ['Sadece bir kişinin dediklerinin yapılması 👑', 'Kavga ve kıskançlık 😠'],
        exp: 'Grup çalışmalarında herkes sorumluluk alır ve birbirini destekler.'
      },
      {
        q: 'Grup arkadaşımızın fikrine katılmadığımızda bunu nasıl ifade etmeliyiz? 🗣️',
        spokenText: 'Grup arkadaşımızın fikrine katılmadığımızda bunu nasıl söyleriz?',
        a: 'Kibarca ve saygılı bir dille fikrimizi söyleyerek 💬',
        d: ['Ona bağırıp kaba sözler söyleyerek 😠', 'Gruptan hemen ayrılarak 🚪'],
        exp: 'Farklı fikirlere saygı duyar, kendi düşüncemizi nezaketle dile getiririz.'
      },
      {
        q: 'Kendimizi arkadaşımızın yerine koyup onun duygularını anlamaya çalışmaya ne denir? 💖',
        spokenText: 'Kendimizi başkasının yerine koyup duygularını anlamaya ne denir?',
        a: 'Empati kurmak 💖',
        d: ['Övünmek 🦚', 'Görmezden gelmek 🙈'],
        exp: 'Empati, başkalarının duygularını ve hissettiklerini anlamaktır.'
      },
      {
        q: 'Arkadaşımıza duygumuzu anlatırken suçlayıcı olmak yerine kırıcı olmadan kendimizi ifade etmeye ne denir? 🗣️',
        spokenText: 'Kırıcı olmadan kendimizi ifade etmeye hangi dil denir?',
        a: '"Ben" dili kullanmak 💬',
        d: ['Lakap takmak 🚫', 'İnatlaşmak 😤'],
        exp: '"Ben" dili suçlayıcı değil, duyguyu yapıcı bir şekilde ifade etmeyi sağlar.'
      },
      {
        q: 'Okul çantamızı hazırlarken nelere dikkat etmeliyiz? 🎒',
        spokenText: 'Okul çantamızı hazırlarken nelere dikkat etmeliyiz?',
        a: 'Haftalık ders programına göre gerekenleri koymaya 📅',
        d: ['Evdeki tüm oyuncak ve kitapları doldurmaya 🧸', 'Hiçbir ders kitabını almamaya 🚫'],
        exp: 'Ders programına göre çanta hazırlamak gereksiz yükten ve omurga eğriliğinden korur.'
      },
      {
        q: 'Okul çantasının aşırı ağır olması vücudumuzda ne gibi bir soruna yol açabilir? 🎒',
        spokenText: 'Okul çantasının aşırı ağır olması vücudumuzda neye yol açar?',
        a: 'Sırt ve omurga sağlığımızın bozulmasına 🦴',
        d: ['Daha hızlı koşmamıza 🏃‍♂️', 'Boyumuzun aniden uzamasına 🦒'],
        exp: 'Ağır çantalar sırt ağrılarına ve duruş bozukluklarına sebep olur.'
      },
      {
        q: 'Sınıftaki sıraları, yazı tahtasını ve panoları nasıl kullanmalıyız? 🏫',
        spokenText: 'Sınıftaki sıraları ve eşyaları nasıl kullanmalıyız?',
        a: 'Temiz, özenli ve koruyarak ✨',
        d: ['Üzerine boya ve yazılar çizerek ✍️', 'Sıraların üzerine basıp zıplayarak 👟'],
        exp: 'Okul eşyaları ortak malımızdır, korunarak sonraki öğrencilere temiz bırakılmalıdır.'
      },
      {
        q: 'Teneffüste arkadaşımız yere düşüp canı yandığında hangi empati davranışı doğrudur? 🤝',
        spokenText: 'Arkadaşımız yere düşüp canı yandığında ne yapmalıyız?',
        a: 'Hemen yanına gidip yardım etmek ve teselli etmek 🤝',
        d: ['Gülüp alay etmek 😄', 'Hiç umursamadan koşmaya devam etmek 🏃‍♂️'],
        exp: 'Zor durumda olan arkadaşımıza yardımcı olmak empati ve dostluk gereğidir.'
      },
      {
        q: 'Tuvalet kağıdı ve sıvı sabunu okulda kullanırken nasıl davranmalıyız? 🧼',
        spokenText: 'Sıvı sabun ve tuvalet kağıdını nasıl kullanmalıyız?',
        a: 'Yalnızca ihtiyacımız kadar tasarruflu kullanmalıyız 🌿',
        d: ['Bütün sabunu lavaboya boşaltmalıyız 🧴', 'Kağıtları top yapıp fırlatmalıyız 🧻'],
        exp: 'Okul hijyen malzemeleri tasarruflu kullanılmalıdır.'
      },
      {
        q: 'Sınıf içi kuralların belirlenmesinde kimler söz hakkına sahiptir? 🏫',
        spokenText: 'Sınıf içi kuralların belirlenmesinde kimler söz hakkına sahiptir?',
        a: 'Öğretmenimiz ve tüm sınıf arkadaşları birlikte 🤝',
        d: ['Yalnızca en uzun boylu öğrenciler 🦒', 'Sadece okul bekçisi 🔑'],
        exp: 'Kurallar tüm sınıfın katılımıyla demokratik şekilde belirlenir ve uygulanır.'
      },
      {
        q: 'Bir arkadaşımızın kalemtraşına ihtiyacımız olduğunda izin istemeden çantasına el uzatmak doğru mudur? ✏️',
        spokenText: 'Arkadaşımızın eşyasını izin almadan almak doğru mudur?',
        a: 'Hayır, mutlaka kibarca izin istemeliyiz ❌',
        d: ['Evet, çaktırmadan alabiliriz ✅', 'Farketmez, geri koyarız 📦'],
        exp: 'Başkasına ait bir eşyayı kullanmadan önce mutlaka izin alınmalıdır.'
      },
      {
        q: 'Hangi arkadaşlık davranışı okulda güven ve huzuru artırır? 🤝',
        spokenText: 'Hangi davranış okulda güven ve huzuru artırır?',
        a: 'Dürüst, güvenilir ve adil olmak 🌟',
        d: ['Yalan söylemek ve sırları yaymak 🤫', 'Sadece oyun kazananlarla arkadaş olmak 🏆'],
        exp: 'Dürüstlük ve güven arkadaşlık ilişkilerinin temel direğidir.'
      },
      {
        q: 'Öğretmenimiz ders anlatırken veya bir arkadaşımız konuşurken ne yapmalıyız? 👂',
        spokenText: 'Öğretmenimiz ders anlatırken ne yapmalıyız?',
        a: 'Sözünü kesmeden dikkatle dinlemeliyiz 👂',
        d: ['Arkadaşımıza kağıt fırlatmalıyız 📜', 'Yüksek sesle şarkı söylemeliyiz 🎶'],
        exp: 'İletişimde en önemli kural dinleme nezaketidir.'
      },
      {
        q: 'Okul koridorlarında nöbetçi öğretmen veya çalışan birine rastladığımızda ne yaparız? 👋',
        spokenText: 'Okul koridorlarında bir görevliye rastladığımızda ne deriz?',
        a: 'Güleryüzle selam verir ve "Kolay gelsin" deriz 👋',
        d: ['Koşup yanlarından hızla geçeriz 🏃‍♂️', 'Görmezden gelip başımızı çeviririz 🙈'],
        exp: 'Okul personeline ve öğretmenlere selam vermek nezaket kuralıdır.'
      },
      {
        q: 'Sınıfta fikir ayrılığı yaşadığımızda sorunu çözmenin en medeni yolu nedir? 🕊️',
        spokenText: 'Fikir ayrılığı yaşadığımızda sorunu nasıl çözmeliyiz?',
        a: 'Konuşarak ve birbirimizi dinleyerek uzlaşmak 🤝',
        d: ['Küsip günlerce konuşmamak 🤐', 'Kavga edip bağırışmak 😠'],
        exp: 'Sorunlar diyalog ve uzlaşma yoluyla barışçıl çözülür.'
      },
      {
        q: 'Okulumuzun spor salonundaki topları ve malzemeleri kullandıktan sonra ne yapmalıyız? ⚽',
        spokenText: 'Okuldaki spor malzemelerini kullandıktan sonra ne yapmalıyız?',
        a: 'Düzenli bir şekilde yerine koyup teslim etmeliyiz 📦',
        d: ['Bahçede yağmurun altında bırakmalıyız 🌧️', 'Topları patlatmalıyız 💥'],
        exp: 'Kullanılan ortak araç gereçler düzenli biçimde yerine kaldırılır.'
      }
    ],

    // Tema 2: Sağlığım ve Güvenliğim (Sağlıklı Hayat - 20 Soru)
    grade2LifeScienceHealthPool: [
      {
        q: 'Vücudumuzun sağlıklı büyüyüp gelişmesi için her besin grubundan yeteri kadar tüketmeye ne denir? 🥗',
        spokenText: 'Her besin grubundan yeteri kadar tüketmeye ne denir?',
        a: 'Dengeli ve yeterli beslenme 🥗',
        d: ['Abur cubur beslenme 🍟', 'Tek tip beslenme 🍔'],
        exp: 'Vücudun tüm vitamin ve mineralleri alması için dengeli beslenmek gerekir.'
      },
      {
        q: 'Güne enerjik başlamak, zihnimizi açmak ve dersi iyi anlamak için en önemli ana öğün hangisidir? 🍳',
        spokenText: 'Günün en önemli ana öğünü hangisidir?',
        a: 'Sabah kahvaltısı 🍳',
        d: ['Gece atıştırmalığı 🌙', 'Öğleden sonra cipsi 🍟'],
        exp: 'Sabah kahvaltısı metabolizmayı çalıştıran ve odaklanmayı sağlayan en kritik öğündür.'
      },
      {
        q: 'Kış mevsiminde soğuk algınlığından korunmak için hangi mevsim meyvelerini tüketmeliyiz? 🍊',
        spokenText: 'Kış mevsiminde hangi meyveleri tüketmeliyiz?',
        a: 'Portakal, mandalina ve nar 🍊',
        d: ['Karpuz ve şeftali 🍉', 'Çilek ve kiraz 🍓'],
        exp: 'Kışın bol C vitamini içeren portakal ve mandalina tüketilir.'
      },
      {
        q: 'Yaz mevsiminde bol sulu ve taze olarak yetişen sebze ve meyveler hangileridir? 🍉',
        spokenText: 'Yaz mevsiminde hangi sebze ve meyveler yetişir?',
        a: 'Karpuz, domates ve salatalık 🍉🥒',
        d: ['Kestane ve portakal 🌰🍊', 'Pırasa ve lahana 🥬'],
        exp: 'Karpuz ve domates yaz güneşinde doğal olarak olgunlaşan yaz ürünleridir.'
      },
      {
        q: 'Meyve ve sebzeleri neden mevsiminde tüketmeliyiz? 🥦',
        spokenText: 'Meyve ve sebzeleri neden mevsiminde tüketmeliyiz?',
        a: 'Daha taze, vitaminli ve katkısız oldukları için 🥦✨',
        d: ['Pahalı oldukları için 💰', 'Tatsız oldukları için ❌'],
        exp: 'Mevsiminde yetişen besinlerin besin değeri yüksektir ve doğaldır.'
      },
      {
        q: 'Mikroplardan ve bulaşıcı hastalıklardan korunmanın en kolay ve etkili yolu nedir? 🧼',
        spokenText: 'Mikroplardan korunmanın en etkili yolu nedir?',
        a: 'Ellerimizi su ve sabunla en az 20 saniye yıkamak 🧼',
        d: ['Elimizi elbisemize sürmek 👕', 'Sadece ıslak mendille silmek 🧻'],
        exp: 'Sabun ve su ile 20 saniye yıkamak mikropları yok eder.'
      },
      {
        q: 'Hapşırırken veya öksürürken mikropların yayılmaması için ne yapmalıyız? 🤧',
        spokenText: 'Hapşırırken mikropların yayılmaması için ne yapmalıyız?',
        a: 'Ağzımızı tek kullanımlık mendil veya dirsek içiyle kapatmalıyız 🧻',
        d: ['Arkadaşımızın yüzüne doğru dönmeliyiz 💨', 'Elimizin içine hapşırıp her yere sürmeliyiz 🚪'],
        exp: 'Mendil veya dirsek içi kullanımı solunum yolu mikroplarının yayılmasını önler.'
      },
      {
        q: 'Bizi tehlikeli hastalıklardan koruyan ve vücudumuza bağışıklık kazandıran sağlık uygulaması nedir? 💉',
        spokenText: 'Bizi hastalıklardan koruyan sağlık uygulaması nedir?',
        a: 'Aşı olmak 🛡️',
        d: ['Çikolata yemek 🍫', 'Ağrı kesici yutmak 💊'],
        exp: 'Aşılar bağışıklık sistemini mikroplara karşı eğiterek hayat kurtarır.'
      },
      {
        q: 'Hastaneye veya doktora gittiğimizde neden korkmamalıyız? 👨‍⚕️',
        spokenText: 'Hastaneye veya doktora gittiğimizde neden korkmamalıyız?',
        a: 'Çünkü doktor ve hemşireler sağlığımız için bize yardım eder 🩺',
        d: ['Çünkü bize ceza verirler 🚫', 'Korkmalıyız çünkü can yakarlar ❌'],
        exp: 'Sağlık çalışanları bizim dostumuzdur ve bizi iyileştirmek için çalışırlar.'
      },
      {
        q: 'Dişlerimizin çürümesini önlemek ve diş etlerimizi korumak için ne yapmalıyız? 🪥',
        spokenText: 'Dişlerimizi korumak için ne yapmalıyız?',
        a: 'Günde en az iki kez fırçalamalı ve diş hekimine kontrole gitmeliyiz 🪥',
        d: ['Sürekli lolipop şeker yemeliyiz 🍭', 'Yılda bir kez fırçalamalıyız 📅'],
        exp: 'Düzenli fırçalama ve 6 ayda bir diş kontrolü diş sağlığı için şarttır.'
      },
      {
        q: '2. sınıf öğrencisinin sağlıklı büyümesi ve gelişmesi için günde yaklaşık kaç saat uyuması gerekir? 🛌',
        spokenText: '2. sınıf öğrencisi günde kaç saat uyumalıdır?',
        a: '9 - 10 saat 😴',
        d: ['3 - 4 saat 🥱', '15 saat 💤'],
        exp: 'Büyüme hormonları uykuda salgılanır, bu yaşta 9-10 saat kaliteli uyku gerekir.'
      },
      {
        q: 'Kemiklerimizin ve kaslarımızın güçlü olması, zinde hissetmemiz için ne yapmalıyız? 🏃‍♂️',
        spokenText: 'Kemik ve kaslarımızın güçlü olması için ne yapmalıyız?',
        a: 'Düzenli spor ve egzersiz yapmalıyız ⚽🏃‍♀️',
        d: ['Bütün gün televizyon karşısında hareketsiz yatmalıyız 📺', 'Ağır yük taşımalıyız 🏋️‍♂️'],
        exp: 'Fiziksel aktivite kemik yoğunluğunu artırır ve kalbi güçlendirir.'
      },
      {
        q: 'Paketli gıdaların üzerindeki Son Kullanma Tarihine (SKT) neden dikkat etmeliyiz? 📅',
        spokenText: 'Son kullanma tarihine neden dikkat etmeliyiz?',
        a: 'Tarihi geçmiş bozuk besinler zehirlenmeye yol açabilir ⚠️',
        d: ['Paketin rengini öğrenmek için 🎨', 'Fiyatını hesaplamak için 💰'],
        exp: 'Son kullanma tarihi geçmiş ürünler sağlığa zararlıdır ve tüketilmez.'
      },
      {
        q: 'Pazardan veya manavdan aldığımız meyve ve sebzeleri yemeden önce ne yapmalıyız? 🍎',
        spokenText: 'Meyve ve sebzeleri yemeden önce ne yapmalıyız?',
        a: 'Bol temiz su ile iyice yıkamalıyız 💧',
        d: ['Hemen kabuğuyla tozlu tozlu yemeliyiz 🍎', 'Güneşte bekletmeliyiz ☀️'],
        exp: 'Üzerindeki toz ve tarım ilacı kalıntılarından arındırmak için bol suyla yıkanır.'
      },
      {
        q: 'Vücudumuzun su ihtiyacını karşılamak için günde yaklaşık ne kadar su tüketmeliyiz? 💧',
        spokenText: 'Günde yaklaşık ne kadar su tüketmeliyiz?',
        a: 'Günde 6 - 8 bardak temiz su 💧',
        d: ['Hiç su içmeyip asitli gazoz içmeliyiz 🥤', 'Haftada 1 bardak 🥛'],
        exp: 'Su hayat kaynağıdır, her gün yeterli su içilmelidir.'
      },
      {
        q: 'Hangi besin grubu kemiklerimizi ve dişlerimizi güçlendiren kalsiyum içerir? 🥛',
        spokenText: 'Kemiklerimizi güçlendiren kalsiyum hangi besinlerde bulunur?',
        a: 'Süt, yoğurt, peynir ve ayran 🧀',
        d: ['Cips ve şekerleme 🍭', 'Hazır bulyon ve ketçap 🥫'],
        exp: 'Süt ve süt ürünleri kalsiyum deposudur, boy uzamasını destekler.'
      },
      {
        q: 'Gece geç saatlere kadar tabletle oynamak vücudumuza nasıl zarar verir? 📱',
        spokenText: 'Gece geç saate kadar tabletle oynamak nasıl zarar verir?',
        a: 'Uyku düzenimizi bozar, gözlerimizi yorar ve dikkatimizi dağıtır 😵',
        d: ['Bizi daha dinç yapar ⚡', 'Daha iyi rüya görmemizi sağlar 🌈'],
        exp: 'Mavi ekran ışığı melatonin hormonunu baskılar ve uyku kalitesini düşürür.'
      },
      {
        q: 'Grip veya nezle olduğumuzda arkadaşlarımıza bulaştırmamak için ne yapmalıyız? 🤒',
        spokenText: 'Grip olduğumuzda arkadaşlarımıza bulaştırmamak için ne yapmalıyız?',
        a: 'Evde dinlenmeli, bol sıvı almalı ve maske takmalıyız 😷',
        d: ['Kalabalık yerlerde herkesle kucaklaşmalıyız 🫂', 'Dondurma yemeliyiz 🍦'],
        exp: 'Hastalık döneminde dinlenmek ve teması azaltmak bulaşmayı engeller.'
      },
      {
        q: 'Mahallemizde en yakın birinci basamak sağlık hizmeti aldığımız yer neresidir? 🏥',
        spokenText: 'Mahallemizde en yakın sağlık hizmeti aldığımız yer neresidir?',
        a: 'Aile Sağlığı Merkezi (Sağlık Ocağı) 🩺',
        d: ['İtfaiye merkezi 🚒', 'Kütüphane 📚'],
        exp: 'Rutin kontroller ve aşılar Aile Sağlığı Merkezlerinde yapılır.'
      },
      {
        q: 'Sağlıklı bir tabak oluştururken tabağımızda hangilerinin dengeli bulunması gerekir? 🍽️',
        spokenText: 'Sağlıklı bir tabakta neler bulunmalıdır?',
        a: 'Sebze, protein (et/yumurta/bakliyat), süt ürünü ve tahıl 🥦🍗🍞',
        d: ['Sadece patates kızartması ve mayonez 🍟', 'Sadece şeker ve çikolata 🍬'],
        exp: 'Farklı besin gruplarını içeren tabak dengeli ve sağlıklı tabaktır.'
      }
    ],

    // Tema 3: Güvenli Hayat (20 Soru)
    grade2LifeScienceSafetyPool: [
      {
        q: 'Okul servisinde seyahat ederken ilk yapmamız gereken güvenlik kuralı nedir? 🚌',
        spokenText: 'Okul servisinde ilk yapmamız gereken güvenlik kuralı nedir?',
        a: 'Emniyet kemerimizi takıp yerimize oturmak 🛡️',
        d: ['Servis içinde ayakta dans etmek 💃', 'Camdan kafamızı çıkarmak 🪟'],
        exp: 'Serviste emniyet kemeri ani frenlerde savrulmamızı ve yaralanmamızı önler.'
      },
      {
        q: 'Okul servisi şoförünün dikkatini dağıtmamak için nasıl davranmalıyız? 🚌',
        spokenText: 'Servis şoförünün dikkatini dağıtmamak için nasıl davranmalıyız?',
        a: 'Yüksek sesle bağırmamalı ve şoförle gereksiz konuşmamalıyız 🤫',
        d: ['Kornaya basmaya çalışmalıyız 📢', 'Şoförün gözünü kapatmalıyız 🙈'],
        exp: 'Şoförün dikkatinin dağılması büyük trafik kazalarına yol açabilir.'
      },
      {
        q: 'Servisten indikten sonra karşıya geçmek için ne yapmalıyız? 🚸',
        spokenText: 'Servisten indikten sonra karşıya geçmek için ne yapmalıyız?',
        a: 'Servis aracının tamamen uzaklaşmasını bekleyip yolu görerek geçmeliyiz 🚶‍♂️',
        d: ['Hemen servisin önünden veya arkasından kör noktadan yola fırlamalıyız 🏃‍♂️', 'Gözümüz kapalı koşmalıyız 🙈'],
        exp: 'Büyük araçların önü ve arkası kör noktadır, sürücüler bizi göremez.'
      },
      {
        q: 'Oyun oynamak için aşağıdaki alanlardan hangisi GÜVENLİDİR? 🛝',
        spokenText: 'Oyun oynamak için aşağıdaki alanlardan hangisi güvenlidir?',
        a: 'Trafiğe kapalı çocuk parkı ve okul bahçesi 🛝🌳',
        d: ['İnşaat alanları ve metruk binalar 🏗️', 'İşlek ana caddeler 🚗'],
        exp: 'Parklar ve okul bahçeleri çocuklar için tasarlanmış güvenli oyun alanlarıdır.'
      },
      {
        q: 'İnşaat alanları veya derin su birikintileri neden oyun için tehlikelidir? ⚠️',
        spokenText: 'İnşaat alanları neden oyun için tehlikelidir?',
        a: 'Çivi batması, göçük, boğulma ve düşme tehlikesi olduğu için ⚠️',
        d: ['Çok kalabalık olduğu için 👥', 'Top oynamak kolay olduğu için ⚽'],
        exp: 'İnşaatlar ve derin su çukurları ölümcül tehlikeler barındırır.'
      },
      {
        q: 'Kaybolduğumuzda veya acil bir durum olduğunda ezbere bilmemiz gereken en önemli bilgi nedir? 📞',
        spokenText: 'Kaybolduğumuzda ezbere bilmemiz gereken en önemli bilgi nedir?',
        a: 'Anne veya babamızın telefon numarası ve ev adresimiz 📱🏠',
        d: ['En sevdiğimiz çizgi filmin adı 📺', 'Tuttuğumuz takımın marşı ⚽'],
        exp: 'Ebeveyn telefonunu ve ev adresini bilmek kaybolma anında bize hemen ulaşılmasını sağlar.'
      },
      {
        q: 'Tüm acil yardım ihtiyaçlarında (yangın, kaza, sağlık, asayiş) aranan tek numara hangisidir? 🚑🚒🚓',
        spokenText: 'Tüm acil yardım ihtiyaçlarında aranan tek numara hangisidir?',
        a: '112 Acil Çağrı Merkezi 📞',
        d: ['155 📞', '110 📞'],
        exp: 'Türkiye\'de polis, jandarma, itfaiye ve ambulans 112 altında toplanmıştır.'
      },
      {
        q: '112 Acil Çağrı Merkezini asılsız yere arayıp meşgul etmek neye sebep olur? 🚨',
        spokenText: '112 Acil Çağrıyı asılsız meşgul etmek neye sebep olur?',
        a: 'Gerçekten ölüm kalım savaşı veren insanların yardım alamamasına ⚠️',
        d: ['Hattın daha hızlı çalışmasına ⚡', 'Telefonumuzun ödül kazanmasına 🏆'],
        exp: '112\'yi boş yere meşgul etmek suçtur ve insan hayatını tehlikeye atar.'
      },
      {
        q: 'Tanımadığımız biri sokakta bize "Sana oyuncak ve çikolata vereyim, gel" derse ne yapmalıyız? 🛑',
        spokenText: 'Tanımadığımız biri bize hediye teklif ederse ne yapmalıyız?',
        a: '"HAYIR!" diyerek hemen uzaklaşmalı ve güvenli bir yetişkine söylemeliyiz 🏃‍♂️',
        d: ['Hemen teklifi kabul edip arabasına binmeliyiz 🚗', 'Teklif ettiği şekeri yiyip teşekkür etmeliyiz 🍫'],
        exp: 'Tanımadığımız kişilerden asla yiyecek veya hediye kabul edilmez.'
      },
      {
        q: 'Tanımadığımız biri bizi zorla bir yere götürmeye çalışırsa ne yapmalıyız? 🗣️',
        spokenText: 'Tanımadığımız biri bizi zorla götürmeye çalışırsa ne yapmalıyız?',
        a: 'Avazımız çıktığı kadar "İMDAT! SENİ TANIMIYORUM!" diye bağırmalıyız 📢',
        d: ['Sessizce onunla yürümeliyiz 🚶‍♂️', 'Utanıp yere bakmalıyız 🙈'],
        exp: 'Çevredekilerin dikkatini çekmek için yüksek sesle bağırıp yardım istenir.'
      },
      {
        q: 'İnternette tablet veya bilgisayar kullanırken tanımadığımız kişilere ne vermemeliyiz? 💻',
        spokenText: 'İnternette tanımadığımız kişilere hangi bilgileri vermemeliyiz?',
        a: 'Adımızı, ev adresimizi, okulumuzu ve şifrelerimizi 🔒',
        d: ['Merhaba dememeliyiz 👋', 'Oyun oynamamalıyız 🎮'],
        exp: 'İnternette kişisel bilgiler gizli tutulmalı, kimseyle paylaşılmamalıdır.'
      },
      {
        q: 'Günde tablet veya televizyon başında ne kadar zaman geçirmek sağlıklıdır? ⏳',
        spokenText: 'Günde ekran başında ne kadar zaman geçirmek sağlıklıdır?',
        a: 'Ailemizin belirlediği süre kadar (en fazla 30-45 dakika) ⏳',
        d: ['Sabahtan akşama kadar aralıksız 📱', 'Gece yarısına kadar 🌙'],
        exp: 'Aşırı ekran süresi göz ve beyin sağlığını bozar, bağımlılık yapar.'
      },
      {
        q: 'Evde temizlik deterjanları, çamaşır suyu ve ilaçlar nereye konulmalıdır? 🧴',
        spokenText: 'Temizlik deterjanları ve ilaçlar nereye konulmalıdır?',
        a: 'Çocukların erişemeyeceği kilitli ve yüksek dolaplara 🔒',
        d: ['Mutfak masasının üzerine açıkta 🍽️', 'Yere oyuncakların yanına 🧸'],
        exp: 'Kimyasallar ve ilaçlar zehirlenmeye sebep olabileceği için kilit altında tutulmalıdır.'
      },
      {
        q: 'Prizlere sivri cisim sokmak veya ıslak elle elektrik anahtarına dokunmak neden tehlikelidir? ⚡',
        spokenText: 'Prizlere dokunmak neden tehlikelidir?',
        a: 'Elektrik çarpmasına ve hayati tehlikeye yol açar ⚡',
        d: ['Işıkların sönmesine sebep olur 💡', 'Eldivenimiz kirlenir 🧤'],
        exp: 'Elektrik akımı ölümcül olabilir, prizlere ve ıslak anahtarlara dokunulmaz.'
      },
      {
        q: 'Evde yanık veya sıcak su dökülmesi durumunda ilk yapılması gereken nedir? 💧',
        spokenText: 'Sıcak su dökülmesi veya yanık durumunda ilk ne yapılır?',
        a: 'Yanan bölgeyi hemen soğuk musluk suyu altında 10-15 dakika tutmak 💧',
        d: ['Üzerine diş macunu veya salça sürmek 🍅', 'Ateşe yaklaştırmak 🔥'],
        exp: 'Yanıklara asla salça veya macun sürülmez; temiz akan serin su tutulur.'
      },
      {
        q: 'Bisiklet, paten ve kaykay sürerken kask takmanın temel amacı nedir? 🪖',
        spokenText: 'Bisiklet sürerken kask takmanın temel amacı nedir?',
        a: 'Düşme anında başımızı ve beynimizi darbelerden korumak 🪖',
        d: ['Daha havalı ve süslü görünmek ✨', 'Rüzgarı engellemek 💨'],
        exp: 'Kask baş yaralanmalarını ve travmaları önleyen en önemli güvenlik aracıdır.'
      },
      {
        q: 'Cadde kenarında yürürken topumuz yola kaçarsa ne yapmalıyız? ⚽',
        spokenText: 'Topumuz yola kaçarsa ne yapmalıyız?',
        a: 'Asla yola fırlamamalı, büyüklerimizden yardım istemeliyiz 🛑',
        d: ['Gözümüzü kapatıp arkasından hemen koşmalıyız 🏃‍♂️', 'Yolun ortasına oturmalıyız 🛑'],
        exp: 'Topun peşinden aniden yola fırlamak en sık görülen trafik kazası nedenidir.'
      },
      {
        q: 'Toplu taşıma araçlarında (otobüs, metro) yaşlı, hamile ve engellilere ne yapmalıyız? 👵',
        spokenText: 'Toplu taşımada yaşlı ve hamilelere nasıl davranmalıyız?',
        a: 'Güleryüzle yer vermeliyiz 🤝',
        d: ['Görmezden gelip uyuyor numarası yapmalıyız 😴', 'Onları itmeliyiz 🚫'],
        exp: 'Özel gereksinimli bireylere yer vermek temel bir nezaket ve güvenlik kuralıdır.'
      },
      {
        q: 'Trafik ışığı olmayan bir yolda karşıdan karşıya güvenle nasıl geçilir? 🚶‍♂️',
        spokenText: 'Trafik ışığı olmayan yolda karşıya nasıl geçilir?',
        a: 'Önce sola, sonra sağa, tekrar sola bakıp yol boşsa dikkatle 🚶‍♂️',
        d: ['Direkt koşarak 🏃‍♂️', 'Yalnızca yukarı bakarak ☁️'],
        exp: 'Güvenli geçiş kuralı: Sol-Sağ-Sol kontrolüdür.'
      },
      {
        q: 'İnternette veya gerçek hayatta bizi rahatsız eden bir durumla karşılaştığımızda ilk kime söylemeliyiz? 👨‍👩‍👧',
        spokenText: 'Bizi rahatsız eden bir durumla karşılaştığımızda kime söylemeliyiz?',
        a: 'Anne, baba veya öğretmenimize 👨‍🏫',
        d: ['Hiç kimseye söylemeyip içimize atmalıyız 🤫', 'Tanımadığımız bir yabancıya 👤'],
        exp: 'Güvenliğimiz için ailemiz ve öğretmenimiz en doğru rehberdir.'
      }
    ],

    // Tema 4: Ailem ve Toplum (Evimizde Hayat - 20 Soru)
    grade2LifeScienceHomeFamilyPool: [
      {
        q: 'Annemizin erkek kardeşine ne ad veririz? 👨',
        spokenText: 'Annemizin erkek kardeşine ne denir?',
        a: 'Dayı 👨',
        d: ['Amca 👨', 'Hala 👩'],
        exp: 'Annenin erkek kardeşi dayı, babanın erkek kardeşi amcadır.'
      },
      {
        q: 'Babamızın kız kardeşine ne ad verilir? 👩',
        spokenText: 'Babamızın kız kardeşine ne denir?',
        a: 'Hala 👩',
        d: ['Teyze 👩', 'Yenge 👩'],
        exp: 'Babanın kız kardeşi hala, annenin kız kardeşi teyzedir.'
      },
      {
        q: 'Teyzemizin, dayımızın, amcamızın veya halamızın çocukları bizim neyimiz olur? 👦👧',
        spokenText: 'Akrabalarımızın çocukları bizim neyimiz olur?',
        a: 'Kuzenimiz 🤝',
        d: ['Kardeşimiz 👶', 'Yeğenimiz 🧒'],
        exp: 'Akraba çocuklarına kuzen denir.'
      },
      {
        q: 'Annemizin annesine ne hitap ederiz? 👵',
        spokenText: 'Annemizin annesine ne hitap ederiz?',
        a: 'Anneanne (veya Büyükanne) 👵',
        d: ['Babaanne 👵', 'Teyze 👩'],
        exp: 'Annenin annesi anneanne, babanın annesi babaannedir.'
      },
      {
        q: 'Ev adresimizde aşağıdaki bilgilerden hangisinin bulunması ZORUNLUDUR? 🏠',
        spokenText: 'Ev adresimizde hangisinin bulunması zorunludur?',
        a: 'İl, ilçe, mahalle, cadde/sokak ve kapı numarası 📍',
        d: ['En sevdiğimiz meyvenin adı 🍎', 'Evdeki televizyonun markası 📺'],
        exp: 'Tam adres; il, ilçe, mahalle, sokak, bina ve daire numarasını içerir.'
      },
      {
        q: 'Postacının veya acil servisin evimizi kolayca bulabilmesi için neyi doğru bilmeliyiz? 📬',
        spokenText: 'Evimizi kolayca bulabilmeleri için neyi bilmeliyiz?',
        a: 'Ev adresimizi eksiksiz ve doğru bilmeliyiz 🏠',
        d: ['Evin çatısının rengini 🎨', 'Evdeki halı sayısını 🛋️'],
        exp: 'Acil durumlarda ve posta gönderilerinde adres hayati önem taşır.'
      },
      {
        q: 'Ailemizde tatile nereye gidileceği veya ev için bir eşya alınacağı zaman ne yapılmalıdır? 👨‍👩‍👧',
        spokenText: 'Ailede karar alınırken nasıl davranılmalıdır?',
        a: 'Bütün aile bireylerinin fikri alınarak ortak karar verilmelidir 🤝',
        d: ['Yalnızca televizyonun sesine göre karar verilmelidir 📺', 'Çocukların fikri hiç sorulmamalıdır ❌'],
        exp: 'Demokratik ailede herkesin görüşüne değer verilir ve ortak karar alınır.'
      },
      {
        q: 'Aşağıdakilerden hangisi 2. sınıf öğrencisinin evdeki sorumluluklarından biridir? 🛏️',
        spokenText: 'Hangisi evdeki sorumluluklarımızdan biridir?',
        a: 'Kendi odasını ve yatağını düzenli tutmak, oyuncaklarını toplamak 🛏️🧸',
        d: ['Evin elektrik tesisatını tamir etmek ⚡', 'Araba kullanıp alışverişe gitmek 🚗'],
        exp: 'Çocuklar yaşlarına uygun olarak odasını toplar ve ailesine destek olur.'
      },
      {
        q: 'Yemek saatinde sofranın kurulmasına ve toplanmasına yardım etmek neyin göstergesidir? 🍽️',
        spokenText: 'Sofranın kurulmasına yardım etmek neyin göstergesidir?',
        a: 'Evde iş bölümü ve yardımlaşmanın 🤝',
        d: ['Zorla çalıştırılmanın 🚫', 'Yalnızlığın 😔'],
        exp: 'İş bölümü evdeki işleri hafifletir ve aile bağlarını güçlendirir.'
      },
      {
        q: 'Aşağıdakilerden hangisi yaşamımızı sürdürmek için ZORUNLU olan temel bir İHTİYAÇTIR? 🍞',
        spokenText: 'Hangisi yaşam için zorunlu olan temel bir ihtiyaçtır?',
        a: 'Beslenme, su ve giyinme 🍞💧👕',
        d: ['Pahalı bir uzaktan kumandalı araba 🏎️', 'Akıllı saat ⌚'],
        exp: 'İhtiyaçlar karşılanmadığında hayatta kalamayacağımız zorunlu unsurlardır.'
      },
      {
        q: 'Aşağıdakilerden hangisi bir İSTEKTİR (olmasa da hayatımıza devam edebiliriz)? 🎮',
        spokenText: 'Hangisi olmasa da yaşayabileceğimiz bir istektir?',
        a: 'Yepyeni bir video oyunu veya paten 🎮🛼',
        d: ['Kışın giyilecek sıcak tutan mont 🧥', 'Her gün içtiğimiz temiz içme suyu 💧'],
        exp: 'İstekler zevk ve eğlence içindir; yokluğunda yaşam tehlikeye girmez.'
      },
      {
        q: 'Alışveriş yaparken aile bütçemizi korumak için hangisine ÖNCELİK vermeliyiz? 🛒',
        spokenText: 'Alışveriş yaparken hangisine öncelik vermeliyiz?',
        a: 'Önce zorunlu ihtiyaçlarımıza, para kalırsa isteklerimize 📋',
        d: ['Yalnızca canımızın çektiği oyuncaklara 🧸', 'En pahalı süs eşyalarına 💎'],
        exp: 'Bütçe yönetiminde altın kural: Önce temel ihtiyaçlar karşılanır.'
      },
      {
        q: 'Harçlıklarımızdan artan paraları kumbarada biriktirmek bize hangi erdemi kazandırır? 💰',
        spokenText: 'Kumbarada para biriktirmek bize ne kazandırır?',
        a: 'Tasarruf ve bütçe bilinci 🪙',
        d: ['Cimrilik ve bencillik ❌', 'Parayı tamamen unutmak 🚫'],
        exp: 'Tasarruf gelecekteki önemli ihtiyaçlarımız için birikim yapmayı öğretir.'
      },
      {
        q: 'Evde su, elektrik ve doğalgazı tasarruflu kullanmak kime fayda sağlar? 💡',
        spokenText: 'Evde kaynakları tasarruflu kullanmak kime fayda sağlar?',
        a: 'Hem aile bütçemize hem de ülkemizin kaynaklarına 🇹🇷💰',
        d: ['Yalnızca komşumuza 🏡', 'Hiç kimseye fayda sağlamaz ❌'],
        exp: 'Tasarruf aile ekonomisini güçlendirir ve doğayı korur.'
      },
      {
        q: 'Akrabalarımızı bayramlarda veya özel günlerde ziyaret etmek aile bağlarını nasıl etkiler? 🤝',
        spokenText: 'Akraba ziyaretleri aile bağlarını nasıl etkiler?',
        a: 'Sevgi, saygı ve dayanışmayı güçlendirir 💖',
        d: ['İnsanları birbirinden soğutur ❄️', 'Zaman kaybına yol açar ⏰'],
        exp: 'Akraba ziyaretleri toplumsal dayanışma ve birlik duygusunu pekiştirir.'
      },
      {
        q: 'Evde kardeşimizle bir oyuncağı paylaşırken nasıl davranmalıyız? 🧸',
        spokenText: 'Kardeşimizle oyuncak paylaşırken nasıl davranmalıyız?',
        a: 'Sırayla oynayarak ve adaleti gözeterek 🤝',
        d: ['Oyuncağı zorla çekip elinden alarak 😠', 'Oyuncağı kırıp yere atarak 💥'],
        exp: 'Paylaşmak ve sırasını beklemek kardeşlik bağını kuvvetlendirir.'
      },
      {
        q: 'Babanızın erkek kardeşine ne hitap edersiniz? 👨',
        spokenText: 'Babanızın erkek kardeşine ne denir?',
        a: 'Amca 👨',
        d: ['Dayı 👨', 'Enişte 👨'],
        exp: 'Babanın erkek kardeşi amcadır.'
      },
      {
        q: 'Evimizde yemek piştikten sonra açık unutulan ocağı veya musluğu fark edersek ne yapmalıyız? ⚠️',
        spokenText: 'Açık unutulan ocağı veya musluğu fark edince ne yapmalıyız?',
        a: 'Hemen büyüklerimize haber vermeliyiz 👨‍👩‍👧',
        d: ['Görmezden gelip odamıza gitmeliyiz 🙈', 'Ocakla oynamaya başlamalıyız 🔥'],
        exp: 'Evdeki tehlikeli durumlarda hemen yetişkinlere haber verilir.'
      },
      {
        q: 'Komşularımız hastalandığında veya bir şeye ihtiyaç duyduğunda ne yapmalıyız? 🍲',
        spokenText: 'Komşularımız hastalandığında ne yapmalıyız?',
        a: 'Geçmiş olsun deyip elimizden gelen yardımı yapmalıyız 🤝',
        d: ['Yüksek sesle müzik açıp rahatsız etmeliyiz 📢', 'Kapılarını tekmelemeliyiz 🚫'],
        exp: 'Komşuluk ilişkilerinde yardımlaşma ve saygı çok önemlidir.'
      },
      {
        q: 'Alışverişe çıkmadan önce evde ne hazırlamak gereksiz harcamaları önler? 📝',
        spokenText: 'Gereksiz harcamaları önlemek için ne hazırlamalıyız?',
        a: 'Alışveriş ihtiyaç listesi hazırlamak 📝',
        d: ['Boş bir torba almak 🛍️', 'Bütün parayı yanımıza almak 💵'],
        exp: 'Alışveriş listesi yalnızca ihtiyaç olanların alınmasını sağlayarak israfı önler.'
      }
    ],

    // Tema 5: Yaşadığım Yer ve Ülkem (Ülkemizde Hayat - 20 Soru)
    grade2LifeScienceCountryCulturePool: [
      {
        q: 'Harita ve küre üzerinde yaşadığımız güzel ülkenin adı nedir? 🇹🇷',
        spokenText: 'Yaşadığımız güzel ülkenin adı nedir?',
        a: 'Türkiye Cumhuriyeti 🇹🇷',
        d: ['Avrupa 🌍', 'Asya 🗺️'],
        exp: 'Vatanımız Türkiye Cumhuriyeti Devleti\'dir.'
      },
      {
        q: 'Türkiye Cumhuriyeti\'nin başkenti hangi ilimizdir? 🏛️',
        spokenText: 'Türkiye Cumhuriyeti\'nin başkenti hangi ilimizdir?',
        a: 'Ankara 🏛️',
        d: ['İstanbul 🕌', 'İzmir 🌊'],
        exp: 'Ülkemizin yönetim merkezi ve başkenti Ankara\'dır.'
      },
      {
        q: 'Mustafa Kemal Atatürk\'ün kabri olan Anıtkabir hangi şehrimizdedir? 🏛️',
        spokenText: 'Anıtkabir hangi şehrimizdedir?',
        a: 'Ankara 🏛️',
        d: ['Selanik 🏛️', 'Çanakkale ⚓'],
        exp: 'Atatürk\'ün anıt mezarı Anıtkabir başkentimiz Ankara\'dadır.'
      },
      {
        q: 'Atatürk çocukken ilk olarak annesinin isteğiyle hangi okula başlamıştır? 🏫',
        spokenText: 'Atatürk ilk olarak annesinin isteğiyle hangi okula başlamıştır?',
        a: 'Mahalle Mektebi 🏫',
        d: ['Harp Akademisi ⚔️', 'Selanik Lisesi 🎒'],
        exp: 'Atatürk eğitimine önce Mahalle Mektebinde başlamıştır.'
      },
      {
        q: 'Mustafa Kemal\'e modern yöntemlerle eğitim veren ve babasının istediği okul hangisidir? 📚',
        spokenText: 'Mustafa Kemal\'e babasının isteğiyle modern eğitim veren okul hangisidir?',
        a: 'Şemsi Efendi Okulu 🏫',
        d: ['Askeri İdadi 🎖️', 'Köy Mektebi 🌾'],
        exp: 'Şemsi Efendi Okulu dönemin çağdaş ve yenilikçi okuludur.'
      },
      {
        q: 'Mustafa\'ya "Kemal" adını hangi dersin öğretmeni üstün başarısından dolayı vermiştir? 📐',
        spokenText: 'Mustafa\'ya Kemal adını hangi dersin öğretmeni vermiştir?',
        a: 'Matematik öğretmeni Yüzbaşı Mustafa Bey 📐',
        d: ['Beden eğitimi öğretmeni 🏃‍♂️', 'Müzik öğretmeni 🎶'],
        exp: 'Matematik öğretmeni "Senin de adın Mustafa benim de; senin adın Mustafa Kemal olsun" demiştir.'
      },
      {
        q: '29 Ekim günü tüm yurtta coşkuyla kutladığımız en büyük milli bayramımız hangisidir? 🇹🇷',
        spokenText: '29 Ekim günü kutladığımız en büyük milli bayramımız hangisidir?',
        a: 'Cumhuriyet Bayramı 🇹🇷',
        d: ['Zafer Bayramı 🎖️', 'Gençlik Bayramı ⚡'],
        exp: '29 Ekim 1923\'te Cumhuriyet ilan edilmiştir.'
      },
      {
        q: '23 Nisan günü Atatürk\'ün dünya çocuklarına armağan ettiği bayram hangisidir? 🎈',
        spokenText: '23 Nisan günü kutlanan bayram hangisidir?',
        a: 'Ulusal Egemenlik ve Çocuk Bayramı 🎈',
        d: ['Kurban Bayramı 🍬', 'Öğretmenler Günü 👨‍🏫'],
        exp: '23 Nisan 1920\'de TBMM açılmış ve çocuk bayramı ilan edilmiştir.'
      },
      {
        q: 'Atatürk\'ün Kurtuluş Savaşı\'nı başlatmak için Samsun\'a ayak bastığı 19 Mayıs\'ta hangi bayramı kutlarız? 🏃‍♂️',
        spokenText: '19 Mayıs\'ta hangi bayramı kutlarız?',
        a: 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı ⚡',
        d: ['Demokrasi Bayramı 🤝', 'Cumhuriyet Bayramı 🇹🇷'],
        exp: '19 Mayıs 1919 Kurtuluş Savaşı\'nın başlangıç meşalesidir.'
      },
      {
        q: '30 Ağustos günü kahraman ordumuzun kazandığı büyük zaferin bayramı hangisidir? 🎖️',
        spokenText: '30 Ağustos günü kutlanan bayram hangisidir?',
        a: 'Zafer Bayramı 🎖️',
        d: ['Çocuk Bayramı 🎈', 'Yılbaşı 🎄'],
        exp: '30 Ağustos Başkomutanlık Meydan Muharebesi büyük zaferidir.'
      },
      {
        q: '15 Temmuz günü milletimizin birlik ve beraberliğini andığımız gün hangisidir? 🤝',
        spokenText: '15 Temmuz günü hangi günü anarız?',
        a: 'Demokrasi ve Milli Birlik Günü 🇹🇷',
        d: ['Tiyatro Günü 🎭', 'Bahar Bayramı 🌸'],
        exp: '15 Temmuz milli birlik ve demokrasi zaferini simgeler.'
      },
      {
        q: 'Aşağıdakilerden hangisi milletçe kutladığımız DİNİ bayramlarımızdan biridir? 🍬',
        spokenText: 'Aşağıdakilerden hangisi dini bayramlarımızdandır?',
        a: 'Ramazan Bayramı ve Kurban Bayramı 🍬',
        d: ['23 Nisan ve 19 Mayıs 🎈', 'Nevruz Bayramı 🌿'],
        exp: 'Ramazan ve Kurban Bayramı İslam aleminin iki büyük dini bayramıdır.'
      },
      {
        q: 'Karadeniz bölgesinin kemençe eşliğinde coşkuyla oynanan meşhur halk oyunu hangisidir? 💃',
        spokenText: 'Karadeniz bölgesinin meşhur halk oyunu hangisidir?',
        a: 'Horon 💃',
        d: ['Zeybek 🦅', 'Halay 🥁'],
        exp: 'Horon Karadeniz bölgesine ait hareketli ve neşeli bir halk oyunudur.'
      },
      {
        q: 'Ege bölgesinde efelerin ağırbaşlı ve cesurca oynadığı geleneksel halk oyunu nedir? 🦅',
        spokenText: 'Ege bölgesinde efelerin oynadığı halk oyunu nedir?',
        a: 'Zeybek 🦅',
        d: ['Horon 🌊', 'Vals 🩰'],
        exp: 'Zeybek Ege\'nin efelerine özgü yiğitlik dansıdır.'
      },
      {
        q: 'Topraklarımızda buğday, pamuk, zeytin ve fındık yetiştirilmesine hangi üretim faaliyeti denir? 🌾',
        spokenText: 'Topraktan bitkisel ürünler elde etme faaliyetine ne denir?',
        a: 'Tarım faaliyeti 🌾',
        d: ['Madencilik ⛏️', 'Sanayi 🏭'],
        exp: 'Topraktan bitkisel ürünler elde etme işine tarım denir.'
      },
      {
        q: 'İnek, koyun ve keçi gibi hayvanların beslenip süt, et ve yün elde edilmesine ne denir? 🐄',
        spokenText: 'Hayvanlardan süt ve et elde etme faaliyetine ne denir?',
        a: 'Hayvancılık 🐄🐑',
        d: ['Ormancılık 🌲', 'Balıkçılık 🎣'],
        exp: 'Hayvanların yetiştirilmesi ve ürünlerinden yararlanılması hayvancılıktır.'
      },
      {
        q: 'Milli marşımız İstiklal Marşı söylenirken nasıl durmalıyız? 🇹🇷',
        spokenText: 'İstiklal Marşı söylenirken nasıl durmalıyız?',
        a: 'Hazır ol duruşunda kıpırdamadan ve coşkuyla eşlik ederek 🇹🇷',
        d: ['Ellerimiz cebimizde sakız çiğneyerek 🚫', 'Arkadaşımızla sohbet ederek 🗣️'],
        exp: 'İstiklal Marşı\'na saygı milletimizin bağımsızlığına ve bayrağına saygıdır.'
      },
      {
        q: 'Ülkemizin üç tarafı hangi denizlerle çevrilidir? 🌊',
        spokenText: 'Ülkemizin üç tarafı hangi denizlerle çevrilidir?',
        a: 'Karadeniz, Akdeniz ve Ege Denizi 🌊',
        d: ['Okyanuslar ve Hazar Denizi 🌊', 'Kutup Denizi 🧊'],
        exp: 'Türkiye üç tarafı denizlerle (Karadeniz, Ege, Akdeniz) çevrili bir yarımadadır.'
      },
      {
        q: 'Fıkralarıyla tüm dünyada tanınan, eşeğe ters binen bilge halk kahramanımız kimdir? 🫏',
        spokenText: 'Eşeğe ters binen bilge halk kahramanımız kimdir?',
        a: 'Nasreddin Hoca 🫏',
        d: ['Keloğlan 🪓', 'Hacivat 🎭'],
        exp: 'Nasreddin Hoca fıkralarıyla güldürürken ders veren kültür hazinemizdir.'
      },
      {
        q: 'Geleneksel Türk misafirperverliğinde eve gelen konuğa ilk ne ikram edilir? ☕',
        spokenText: 'Geleneksel misafirperverliğimizde konuğa ilk ne ikram edilir?',
        a: 'Güleryüz, kolonya ve Türk kahvesi/çay ☕🍬',
        d: ['Soğuk su ve tuz 🧂', 'Hiçbir şey ikram edilmez ❌'],
        exp: 'Kolonya ve kahve Türk misafirperverliğinin en sıcak sembolleridir.'
      }
    ],

    // Tema 6: Doğa ve Çevre (Doğada Hayat - 20 Soru)
    grade2LifeScienceNatureEnvironmentPool: [
      {
        q: 'Bir bitkinin büyüyüp yeşermesi için hangilerine mutlaka ihtiyacı vardır? 🌱',
        spokenText: 'Bir bitkinin büyümesi için nelere ihtiyacı vardır?',
        a: 'Su, hava, güneş ışığı ve verimli toprak 🌱☀️💧',
        d: ['Kola, çikolata ve karanlık oda 🍫', 'Plastik torba ve deterjan 🧴'],
        exp: 'Bitkiler su, güneş ışığı, hava ve toprak ile fotosentez yapar ve büyür.'
      },
      {
        q: 'Doğada kendiliğinden var olan, insanlar tarafından yapılmamış varlıklara ne denir? 🏔️',
        spokenText: 'Doğada kendiliğinden var olan varlıklara ne denir?',
        a: 'Doğal unsurlar (Dağ, göl, orman) 🌲',
        d: ['Beşeri unsurlar (Bina, köprü) 🏢', 'Yapay zeka 🤖'],
        exp: 'Dağlar, nehirler, denizler ve ormanlar doğal unsurlardır.'
      },
      {
        q: 'Aşağıdakilerden hangisi insanlar tarafından inşa edilmiş BEŞERİ bir unsurdur? 🌉',
        spokenText: 'Hangisi insanlar tarafından inşa edilmiş beşeri bir unsurdur?',
        a: 'Köprü, baraj ve gökdelen 🌉🏢',
        d: ['Deniz ve şelale 🌊', 'Peri bacaları 🏔️'],
        exp: 'İnsan aklı ve emeğiyle yapılan yapılar beşeri unsurdur.'
      },
      {
        q: 'Kullanılmış kağıt, cam, plastik ve metallerin fabrikalarda yeniden işlenmesine ne denir? ♻️',
        spokenText: 'Atıkların yeniden işlenerek kazandırılmasına ne denir?',
        a: 'Geri dönüşüm ♻️',
        d: ['Çöp biriktirme 🗑️', 'İsraf etme 💸'],
        exp: 'Geri dönüşüm doğal kaynakları korur ve enerji tasarrufu sağlar.'
      },
      {
        q: 'Geri dönüşüm sayesinde 1 ton atık kağıdın geri kazanılması neyi kurtarır? 🌳',
        spokenText: '1 ton kağıdın geri dönüştürülmesi neyi kurtarır?',
        a: '17 adet büyük ağacın kesilmesini önler 🌳✨',
        d: ['Denizlerin kurumasını 🌊', 'Güneşin batmasını ☀️'],
        exp: 'Kağıt geri dönüşümü ormanlarımızın yok olmasını engeller.'
      },
      {
        q: 'Tükenmiş atık pilleri çöpe veya toprağa atmak yerine nereye atmalıyız? 🔋',
        spokenText: 'Tükenmiş atık pilleri nereye atmalıyız?',
        a: 'Kırmızı atık pil toplama kutularına 🔋📦',
        d: ['Nehre veya denize 🌊', 'Normal çöp kutusuna 🗑️'],
        exp: 'Pillerdeki ağır metaller toprağı ve yer altı sularını zehirler; özel pil kutusuna atılır.'
      },
      {
        q: 'Deprem sarsıntısı başladığında sağlam bir eşyanın yanında hangi hayat kurtaran hareketi yaparız? 🛡️',
        spokenText: 'Deprem sarsıntısı başladığında hangi hareketi yaparız?',
        a: 'Çök - Kapan - Tutun 🛡️',
        d: ['Balkondan aşağı atlamak 🏃‍♂️', 'Asansöre binip kaçmak 🛗'],
        exp: 'Çök-Kapan-Tutun başımızı ve boynumuzu düşen eşyalardan korur.'
      },
      {
        q: 'Deprem anında kesinlikle hangisi KULLANILMAMALIDIR? 🚫',
        spokenText: 'Deprem anında kesinlikle hangisi kullanılmaz?',
        a: 'Asansör ve merdivenler 🛗🚫',
        d: ['Masa kenarı 🪵', 'Sağlam baza yanı 🛏️'],
        exp: 'Depremde asansör elektrik kesilince kilitlenir veya düşebilir, asla binilmez.'
      },
      {
        q: 'Karlı ve eğimli dağ yamaçlarından büyük kar kütlelerinin aşağıya doğru kaymasına ne ad verilir? ❄️',
        spokenText: 'Büyük kar kütlelerinin yamaçtan kaymasına ne denir?',
        a: 'Çığ ❄️',
        d: ['Heyelan ⛰️', 'Deprem 🌍'],
        exp: 'Dağlarda biriken kar örtüsünün kopup kaymasına çığ denir.'
      },
      {
        q: 'Şiddetli yağmurlar sonucu toprağın kayarak yamaçtan aşağı sürüklenmesine ne denir? ⛰️',
        spokenText: 'Toprağın kayarak sürüklenmesine ne denir?',
        a: 'Heyelan (Toprak kayması) ⛰️',
        d: ['Fırtına 🌪️', 'Hortum 🌀'],
        exp: 'Aşırı yağış ve eğim nedeniyle toprağın kaymasına heyelan denir; ağaçlandırma önler.'
      },
      {
        q: 'Güneşli bir günde öğle vakti Güneş\'in doğduğu tarafa sağ kolumuzu uzatırsak, önümüz hangi yönü gösterir? 🧭',
        spokenText: 'Sağ kolumuzu doğuya uzatırsak önümüz hangi yönü gösterir?',
        a: 'Kuzey 🧭',
        d: ['Güney 🧭', 'Batı 🧭'],
        exp: 'Sağ kol Doğu, sol kol Batı ise önümüz Kuzey, arkamız Güney\'dir.'
      },
      {
        q: 'Doğada yönümüzü bulmak için karınca yuvalarına baktığımızda yuvanın ağzı nereye bakar? 🐜',
        spokenText: 'Karınca yuvalarının ağzı hangi yöne bakar?',
        a: 'Güney yönüne (sıcak tarafa) ☀️',
        d: ['Kuzey yönüne ❄️', 'Batı yönüne 🌅'],
        exp: 'Karıncalar yuva girişlerini sıcak rüzgarlara yani Güney\'e doğru yaparlar.'
      },
      {
        q: 'Ağaç gövdelerinin ve taşların yosun tutan tarafı daima hangi yönü gösterir? 🌲',
        spokenText: 'Ağaç gövdelerinin yosun tutan tarafı hangi yönü gösterir?',
        a: 'Kuzey yönünü (gölge tarafı) 🧭',
        d: ['Güney yönünü ☀️', 'Doğu yönünü 🌅'],
        exp: 'Güneş görmeyen nemli taraf Kuzey\'dir; bu yüzden yosunlar Kuzey\'de oluşur.'
      },
      {
        q: 'Bulutsuz bir gecede gökyüzünde daima Kuzey yönünü gösteren parlak yıldız hangisidir? ⭐',
        spokenText: 'Daima Kuzey yönünü gösteren parlak yıldız hangisidir?',
        a: 'Kutup Yıldızı (Demirkazık) ⭐',
        d: ['Kuyruklu Yıldız ☄️', 'Çoban Yıldızı 🌟'],
        exp: 'Kutup Yıldızı daima Kuzey kutup noktasını gösterir.'
      },
      {
        q: 'Pusulanın renkli (genellikle kırmızı) ibresi serbest bırakıldığında her zaman nereyi gösterir? 🧭',
        spokenText: 'Pusulanın renkli ibresi her zaman nereyi gösterir?',
        a: 'Kuzey yönünü 🧭',
        d: ['Güney yönünü ☀️', 'Batı yönünü 🌅'],
        exp: 'Pusula ibresi Dünya\'nın manyetik alanı sayesinde Kuzey\'i işaret eder.'
      },
      {
        q: 'Dünya\'nın kendi ekseni etrafında 24 saatte dönmesi sonucunda ne oluşur? 🌍',
        spokenText: 'Dünya\'nın kendi ekseni etrafında dönmesiyle ne oluşur?',
        a: 'Gece ve gündüz (1 gün) ☀️🌙',
        d: ['Mevsimler (1 yıl) 🍂', 'Doğal afetler 🌪️'],
        exp: 'Dünya kendi etrafında 24 saatte döner ve gece ile gündüz birbirini izler.'
      },
      {
        q: 'Dünya\'nın Güneş\'in etrafında 365 gün 6 saatte dolanması sonucunda ne oluşur? 🌞',
        spokenText: 'Dünya\'nın Güneş etrafında dolanmasıyla ne oluşur?',
        a: 'Dört mevsim (1 yıl) 🌸☀️🍂❄️',
        d: ['Saatler ve dakikalar ⏰', 'Gelgit olayları 🌊'],
        exp: 'Dünya Güneş etrafında dolanınca İlkbahar, Yaz, Sonbahar, Kış mevsimleri oluşur.'
      },
      {
        q: 'Gezegenimiz Dünya\'nın şekli neye benzer? 🌐',
        spokenText: 'Gezegenimiz Dünya\'nın şekli neye benzer?',
        a: 'Kutuplardan hafifçe basık küreye (Geoit) 🌐',
        d: ['Düz bir tepsiye 🍽️', 'Küp şekline 🧊'],
        exp: 'Dünya yuvarlaktır; kutuplardan basık, ekvatordan şişkin küre biçimindedir.'
      },
      {
        q: 'Orman yangınlarını ve çevre kirliliğini önlemek için piknik sonrası ne yapmalıyız? 🔥',
        spokenText: 'Orman yangınlarını önlemek için piknik sonrası ne yapmalıyız?',
        a: 'Ateşi tamamen söndürmeli ve çöplerimizi yanımıza almalıyız 🧯🗑️',
        d: ['Cam şişeleri güneşin altında kuru otlara bırakmalıyız 🍾', 'Ateşi yanar halde bırakmalıyız 🔥'],
        exp: 'Cam kırıkları büyüteç etkisi yaparak orman yangını çıkarır; ateş tamamen söndürülür.'
      },
      {
        q: 'Sokak hayvanlarının sıcak yaz günlerinde susuz kalmaması için ne yapabiliriz? 🐱🐶',
        spokenText: 'Sokak hayvanlarının susuz kalmaması için ne yapabiliriz?',
        a: 'Kapımızın önüne bir kap temiz su ve mama koyabiliriz 🥣💧',
        d: ['Onları kovalayıp taş atmalıyız 🚫', 'Sularını dökmeliyiz ❌'],
        exp: 'Hayvanları korumak ve bir kap su koymak doğa sevgisi ve merhamet göstergesidir.'
      }
    ],

    // 2. Sınıf Hayat Bilgisi Karma Düello Motoru (6 Temadan Dengeli Soru Çekimi)
    generateGrade2LifeScienceKarma() {
      const themeIdx = Math.floor(Math.random() * 6);
      if (themeIdx === 0) return this.drawFromPool(this.grade2LifeScienceSchoolPool, "grade2LifeScienceSchoolPool");
      if (themeIdx === 1) return this.drawFromPool(this.grade2LifeScienceHealthPool, "grade2LifeScienceHealthPool");
      if (themeIdx === 2) return this.drawFromPool(this.grade2LifeScienceSafetyPool, "grade2LifeScienceSafetyPool");
      if (themeIdx === 3) return this.drawFromPool(this.grade2LifeScienceHomeFamilyPool, "grade2LifeScienceHomeFamilyPool");
      if (themeIdx === 4) return this.drawFromPool(this.grade2LifeScienceCountryCulturePool, "grade2LifeScienceCountryCulturePool");
      return this.drawFromPool(this.grade2LifeScienceNatureEnvironmentPool, "grade2LifeScienceNatureEnvironmentPool");
    },

    get grade2TrafficSafeLifePool() { return this.grade2LifeScienceSafetyPool; },
    get grade2CultureAndCountryPool() { return this.grade2LifeScienceCountryCulturePool; },


    // 2. SINIF: CLASSROOM OBJECTS, COLORS & NUMBERS (1-20) (26 ÖZGÜN SORU)
    englishSchoolObjectsPool: [
      { englishWord: 'Book', q: 'İngilizce "Book" hangi okul eşyamızdır? 📚', a: 'Kitap 📚', d: ['Defter 📓', 'Kalem ✏️'], exp: 'Book = Kitap demektir. 📚' },
      { englishWord: 'Pencil', q: 'İngilizce "Pencil" hangisidir? ✏️', a: 'Kurşun Kalem ✏️', d: ['Silgi 🧼', 'Çanta 🎒'], exp: 'Pencil = Kurşun Kalem demektir. ✏️' },
      { englishWord: 'School bag', q: 'İngilizce "School bag" ne demektir? 🎒', a: 'Okul Çantası 🎒', d: ['Kalemlik 👝', 'Sıra 🪑'], exp: 'School bag = Okul çantası demektir. 🎒' },
      { englishWord: 'Eraser', q: 'İngilizce "Eraser" (veya Rubber) hangisidir? 🧼', a: 'Silgi 🧼', d: ['Cetvel 📏', 'Kalemtıraş ✏️'], exp: 'Eraser = Silgi demektir. 🧼' },
      { englishWord: 'Ruler', q: 'İngilizce "Ruler" düz çizgi çizdiğimiz hangi araçtır? 📏', a: 'Cetvel 📏', d: ['Kitap 📚', 'Boya kalemi 🖍️'], exp: 'Ruler = Cetvel demektir. 📏' },
      { englishWord: 'Desk', q: 'Sınıfta üzerine kitap koyup oturduğumuz "Desk" nedir? 🪑', a: 'Sıra / Çalışma Masası 🪑', d: ['Dolap 🚪', 'Kapı 🚪'], exp: 'Desk = Okul sırası veya çalışma masasıdır.' },
      { englishWord: 'Pencil case', q: 'Kalemlerimizi koyduğumuz "Pencil case" ne demektir? 👝', a: 'Kalemlik / Kalem kutusu 👝', d: ['Okul çantası 🎒', 'Cüzdan 👛'], exp: 'Pencil case = Kalemlik / Kalem kutusu demektir.' },
      { englishWord: 'Sharpener', q: 'Kalemimizin ucunu açan "Sharpener" nedir? ✏️', a: 'Kalemtıraş ✏️', d: ['Makas ✂️', 'Yapıştırıcı 🧴'], exp: 'Sharpener = Kalemtıraş demektir.' },
      { englishWord: 'Notebook', q: 'İçine yazı yazdığımız "Notebook" nedir? 📓', a: 'Defter 📓', d: ['Kitap 📚', 'Gazete 📰'], exp: 'Notebook = Defter demektir.' },
      { englishWord: 'Scissors', q: 'Kağıt kestiğimiz "Scissors" eşyası hangisidir? ✂️', a: 'Makas ✂️', d: ['Bant 🩹', 'Cetvel 📏'], exp: 'Scissors = Makas demektir.' },
      { englishWord: 'Chair', q: 'Sınıfta oturduğumuz "Chair" nedir? 🪑', a: 'Sandalye 🪑', d: ['Masa 🪵', 'Pencere 🪟'], exp: 'Chair = Sandalye demektir.' },
      { englishWord: 'Crayon', q: 'Resim yaptığımız "Crayon" nedir? 🖍️', a: 'Pastel Boya 🖍️', d: ['Sulu boya 🎨', 'Kurşun kalem ✏️'], exp: 'Crayon = Pastel boya kalemi demektir.' },
      { englishWord: 'Eleven', q: 'İngilizce "Eleven" hangi sayıdır? 🔢', a: '11 (On Bir) 🔢', d: ['12 (On İki) 🔢', '7 (Yedi) 7️⃣'], exp: 'Eleven = 11 demektir.' },
      { englishWord: 'Twelve', q: 'İngilizce "Twelve" hangi sayıdır? 🔢', a: '12 (On İki) 🔢', d: ['20 (Yirmi) 🔢', '11 (On Bir) 🔢'], exp: 'Twelve = 12 demektir.' },
      { englishWord: 'Thirteen', q: 'İngilizce "Thirteen" hangi sayıdır? 🔢', a: '13 (On Üç) 🔢', d: ['15 (On Beş) 🔢', '30 (Otuz) 🔢'], exp: 'Thirteen = 13 demektir.' },
      { englishWord: 'Fourteen', q: 'İngilizce "Fourteen" hangi sayıdır? 🔢', a: '14 (On Dört) 🔢', d: ['16 (On Altı) 🔢', '4 (Dört) 4️⃣'], exp: 'Fourteen = 14 demektir.' },
      { englishWord: 'Fifteen', q: 'İngilizce "Fifteen" hangi sayıdır? 🔢', a: '15 (On Beş) 🔢', d: ['13 (On Üç) 🔢', '50 (Elli) 🔢'], exp: 'Fifteen = 15 demektir.' },
      { englishWord: 'Sixteen', q: 'İngilizce "Sixteen" hangi sayıdır? 🔢', a: '16 (On Altı) 🔢', d: ['18 (On Sekiz) 🔢', '6 (Altı) 6️⃣'], exp: 'Sixteen = 16 demektir.' },
      { englishWord: 'Seventeen', q: 'İngilizce "Seventeen" hangi sayıdır? 🔢', a: '17 (On Yedi) 🔢', d: ['19 (On Dokuz) 🔢', '7 (Yedi) 7️⃣'], exp: 'Seventeen = 17 demektir.' },
      { englishWord: 'Eighteen', q: 'İngilizce "Eighteen" hangi sayıdır? 🔢', a: '18 (On Sekiz) 🔢', d: ['16 (On Altı) 🔢', '8 (Sekiz) 8️⃣'], exp: 'Eighteen = 18 demektir.' },
      { englishWord: 'Nineteen', q: 'İngilizce "Nineteen" hangi sayıdır? 🔢', a: '19 (On Dokuz) 🔢', d: ['17 (On Yedi) 🔢', '9 (Dokuz) 9️⃣'], exp: 'Nineteen = 19 demektir.' },
      { englishWord: 'Twenty', q: 'İngilizce "Twenty" hangi sayıdır? 🔢', a: '20 (Yirmi) 🔢', d: ['12 (On İki) 🔢', '10 (On) 🔟'], exp: 'Twenty = 20 demektir.' },
      { englishWord: 'Book', q: '"Kitap" sözcüğünün İngilizce karşılığı hangisidir? 📚', a: 'Book 📚', d: ['Desk 🪑', 'Door 🚪'], exp: 'Kitap İngilizce "Book" demektir.' },
      { englishWord: 'Pencil', q: '"Kurşun Kalem" sözcüğünün İngilizcesi hangisidir? ✏️', a: 'Pencil ✏️', d: ['Ruler 📏', 'Bag 🎒'], exp: 'Kurşun kalem İngilizce "Pencil" demektir.' },
      { englishWord: 'Eraser', q: '"Silgi" sözcüğünün İngilizce karşılığı hangisidir? 🧼', a: 'Eraser 🧼', d: ['Sharpener ✏️', 'Notebook 📓'], exp: 'Silgi İngilizce "Eraser" demektir.' },
      { englishWord: 'Ten', q: '"10" (On) 🔟 sayısının İngilizce karşılığı hangisidir?', a: 'Ten 🔟', d: ['Two 2️⃣', 'Twelve 12'], exp: '10 sayısı İngilizce "Ten" olarak yazılır.' }
    ],

    // 2. SINIF: ANIMALS & FRUITS (32 ÖZGÜN KELİME)
    englishAnimalsAndFruitsPool: [
      { englishWord: 'Apple', q: 'İngilizce "Apple" hangi lezzetli meyvedir? 🍎', a: 'Elma 🍎', d: ['Armut 🍐', 'Muz 🍌'], exp: 'Apple = Elma demektir. 🍎' },
      { englishWord: 'Banana', q: 'İngilizce "Banana" hangi sarı meyvedir? 🍌', a: 'Muz 🍌', d: ['Limon 🍋', 'Kavun 🍈'], exp: 'Banana = Muz demektir. 🍌' },
      { englishWord: 'Orange', q: 'İngilizce "Orange" hangi C vitamini deposu meyvedir? 🍊', a: 'Portakal 🍊', d: ['Elma 🍎', 'Şeftali 🍑'], exp: 'Orange = Portakal demektir (aynı zamanda turuncu renk). 🍊' },
      { englishWord: 'Strawberry', q: 'İngilizce "Strawberry" hangi kırmızı meyvedir? 🍓', a: 'Çilek 🍓', d: ['Kiraz 🍒', 'Karpuz 🍉'], exp: 'Strawberry = Çilek demektir. 🍓' },
      { englishWord: 'Grape', q: 'İngilizce "Grape" salkım salkım hangi meyvedir? 🍇', a: 'Üzüm 🍇', d: ['İncir 🫐', 'Dut 🍓'], exp: 'Grape = Üzüm demektir. 🍇' },
      { englishWord: 'Lemon', q: 'İngilizce "Lemon" hangi ekşi meyvedir? 🍋', a: 'Limon 🍋', d: ['Muz 🍌', 'Ayva 🍐'], exp: 'Lemon = Limon demektir. 🍋' },
      { englishWord: 'Watermelon', q: 'İngilizce "Watermelon" yazın yediğimiz dev meyve hangisidir? 🍉', a: 'Karpuz 🍉', d: ['Kavun 🍈', 'Balkabağı 🎃'], exp: 'Watermelon = Karpuz demektir. 🍉' },
      { englishWord: 'Peach', q: 'İngilizce "Peach" tüylü ve tatlı hangi meyvedir? 🍑', a: 'Şeftali 🍑', d: ['Kayısı 🥭', 'Erik 🫐'], exp: 'Peach = Şeftali demektir. 🍑' },
      { englishWord: 'Cherry', q: 'İngilizce "Cherry" çift saplı sevimli meyve nedir? 🍒', a: 'Kiraz 🍒', d: ['Vişne', 'Çilek 🍓'], exp: 'Cherry = Kiraz demektir. 🍒' },
      { englishWord: 'Pear', q: 'İngilizce "Pear" hangi meyvedir? 🍐', a: 'Armut 🍐', d: ['Elma 🍎', 'Avokado 🥑'], exp: 'Pear = Armut demektir. 🍐' },
      { englishWord: 'Cat', q: 'İngilizce "Cat" hangi hayvandır? 🐱', a: 'Kedi 🐱', d: ['Köpek 🐶', 'Fare 🐭'], exp: 'Cat = Kedi demektir. 🐱' },
      { englishWord: 'Dog', q: 'İngilizce "Dog" hangi hayvandır? 🐶', a: 'Köpek 🐶', d: ['Kurt 🐺', 'Tilki 🦊'], exp: 'Dog = Köpek demektir. 🐶' },
      { englishWord: 'Bird', q: 'İngilizce "Bird" hangi kanatlı dostumuzdur? 🐦', a: 'Kuş 🐦', d: ['Tavuk 🐔', 'Kelebek 🦋'], exp: 'Bird = Kuş demektir. 🐦' },
      { englishWord: 'Lion', q: 'İngilizce "Lion" ormanların kralı kimdir? 🦁', a: 'Aslan 🦁', d: ['Kaplan 🐯', 'Leopar 🐆'], exp: 'Lion = Aslan demektir. 🦁' },
      { englishWord: 'Elephant', q: 'İngilizce "Elephant" hortumlu koca kulak kimdir? 🐘', a: 'Fil 🐘', d: ['Zürafa 🦒', 'Hipopotam 🦛'], exp: 'Elephant = Fil demektir. 🐘' },
      { englishWord: 'Monkey', q: 'İngilizce "Monkey" muz seven neşeli hayvan kimdir? 🐵', a: 'Maymun 🐵', d: ['Sincap 🐿️', 'Koala 🐨'], exp: 'Monkey = Maymun demektir. 🐵' },
      { englishWord: 'Rabbit', q: 'İngilizce "Rabbit" havuç seven uzun kulak kimdir? 🐰', a: 'Tavşan 🐰', d: ['Kanguru 🦘', 'Köpek 🐶'], exp: 'Rabbit = Tavşan demektir. 🐰' },
      { englishWord: 'Bear', q: 'İngilizce "Bear" kış uykusuna yatan dostumuz kimdir? 🐻', a: 'Ayı 🐻', d: ['Kurt 🐺', 'Panda 🐼'], exp: 'Bear = Ayı demektir. 🐻' },
      { englishWord: 'Horse', q: 'İngilizce "Horse" asil koşan hayvan kimdir? 🐴', a: 'At 🐴', d: ['Eşek 🫏', 'Zebra 🦓'], exp: 'Horse = At demektir. 🐴' },
      { englishWord: 'Duck', q: 'İngilizce "Duck" vak vak yüzen sevimli hayvan kimdir? 🦆', a: 'Ördek 🦆', d: ['Kaz 🦢', 'Kuğu 🦢'], exp: 'Duck = Ördek demektir. 🦆' },
      { englishWord: 'Cow', q: 'İngilizce "Cow" çiftlikte yaşayan sütçü dostumuz kimdir? 🐮', a: 'İnek 🐮', d: ['Koyun 🐑', 'Keçi 🐐'], exp: 'Cow = İnek demektir. 🐮' },
      { englishWord: 'Fish', q: 'İngilizce "Fish" denizde yüzen canlı kimdir? 🐟', a: 'Balık 🐟', d: ['Yunus 🐬', 'Ahtapot 🐙'], exp: 'Fish = Balık demektir. 🐟' },
      { englishWord: 'Bee', q: 'İngilizce "Bee" vız vız bal yapan çalışkan dostumuz kimdir? 🐝', a: 'Arı 🐝', d: ['Sinek 🪰', 'Karınca 🐜'], exp: 'Bee = Arı demektir. 🐝' },
      { englishWord: 'Butterfly', q: 'İngilizce "Butterfly" renkli kanatlı narin dostumuz kimdir? 🦋', a: 'Kelebek 🦋', d: ['Kuş 🐦', 'Uğur Böceği 🐞'], exp: 'Butterfly = Kelebek demektir. 🦋' },
      { englishWord: 'Sheep', q: 'İngilizce "Sheep" meleyen yünlü dostumuz kimdir? 🐑', a: 'Koyun 🐑', d: ['Keçi 🐐', 'Kuzu 🐏'], exp: 'Sheep = Koyun demektir. 🐑' },
      { englishWord: 'Frog', q: 'İngilizce "Frog" gölette vıraklayan yeşil dostumuz kimdir? 🐸', a: 'Kurbağa 🐸', d: ['Kertenkele 🦎', 'Kaplumbağa 🐢'], exp: 'Frog = Kurbağa demektir. 🐸' },
      { englishWord: 'Apple', q: '"Elma" 🍎 meyvesinin İngilizcesi hangisidir?', a: 'Apple 🍎', d: ['Banana 🍌', 'Orange 🍊'], exp: 'Elma İngilizce "Apple" demektir.' },
      { englishWord: 'Banana', q: '"Muz" 🍌 meyvesinin İngilizcesi hangisidir?', a: 'Banana 🍌', d: ['Grape 🍇', 'Peach 🍑'], exp: 'Muz İngilizce "Banana" demektir.' },
      { englishWord: 'Cat', q: '"Kedi" 🐱 hayvanının İngilizce adı hangisidir?', a: 'Cat 🐱', d: ['Dog 🐶', 'Bird 🐦'], exp: 'Kedi İngilizce "Cat" demektir.' },
      { englishWord: 'Dog', q: '"Köpek" 🐶 hayvanının İngilizce adı hangisidir?', a: 'Dog 🐶', d: ['Cat 🐱', 'Rabbit 🐰'], exp: 'Köpek İngilizce "Dog" demektir.' },
      { englishWord: 'Strawberry', q: '"Çilek" 🍓 meyvesinin İngilizcesi hangisidir?', a: 'Strawberry 🍓', d: ['Cherry 🍒', 'Lemon 🍋'], exp: 'Çilek İngilizce "Strawberry" demektir.' },
      { englishWord: 'Fish', q: '"Balık" 🐟 hayvanının İngilizcesi hangisidir?', a: 'Fish 🐟', d: ['Frog 🐸', 'Duck 🦆'], exp: 'Balık İngilizce "Fish" demektir.' }
    ],
    // -------------------------------------------------------------
    // 3. SINIF SORU HAVUZU VE DİNAMİK ÜRETECİLERİ
    // -------------------------------------------------------------

    // 3. SINIF: 3 BASAMAKLI SAYILAR, BASAMAK DEĞERİ VE ROMEN RAKAMLARI (26 SORU)
    grade3RomenPlacePool: [
      {
            "q": "Romen rakamıyla \"IV\" hangi doğal sayıdır? 🏛️",
            "a": "4",
            "d": [
                  "3",
                  "6"
            ],
            "exp": "Romen rakamlarındaki IV sayısı 4 değerindedir."
      },
      {
            "q": "Romen rakamıyla \"IX\" hangi doğal sayıdır? 🏛️",
            "a": "9",
            "d": [
                  "8",
                  "11"
            ],
            "exp": "Romen rakamlarındaki IX sayısı 9 değerindedir."
      },
      {
            "q": "Romen rakamıyla \"XIV\" hangi doğal sayıdır? 🏛️",
            "a": "14",
            "d": [
                  "13",
                  "16"
            ],
            "exp": "X (10) ve IV (4) birleşimi 14 eder."
      },
      {
            "q": "Romen rakamıyla \"XIX\" hangi doğal sayıdır? 🏛️",
            "a": "19",
            "d": [
                  "18",
                  "21"
            ],
            "exp": "X (10) ve IX (9) birleşimi 19 eder."
      },
      {
            "q": "Romen rakamıyla \"VII\" hangi doğal sayıdır? 🏛️",
            "a": "7",
            "d": [
                  "6",
                  "8"
            ],
            "exp": "V (5) ve II (2) birleşimi 7 eder."
      },
      {
            "q": "Romen rakamıyla \"XII\" hangi doğal sayıdır? 🏛️",
            "a": "12",
            "d": [
                  "11",
                  "13"
            ],
            "exp": "X (10) ve II (2) birleşimi 12 eder."
      },
      {
            "q": "Romen rakamıyla \"XV\" hangi doğal sayıdır? 🏛️",
            "a": "15",
            "d": [
                  "14",
                  "16"
            ],
            "exp": "X (10) ve V (5) birleşimi 15 eder."
      },
      {
            "q": "Romen rakamıyla \"XVIII\" hangi doğal sayıdır? 🏛️",
            "a": "18",
            "d": [
                  "17",
                  "19"
            ],
            "exp": "X (10) ve VIII (8) birleşimi 18 eder."
      },
      {
            "q": "Romen rakamıyla \"XX\" hangi doğal sayıdır? 🏛️",
            "a": "20",
            "d": [
                  "15",
                  "25"
            ],
            "exp": "İki adet X yan yana 10 + 10 = 20 eder."
      },
      {
            "q": "16 doğal sayısının Romen rakamıyla yazılışı hangisidir? 🏛️",
            "a": "XVI",
            "d": [
                  "XIV",
                  "XVII"
            ],
            "exp": "16 sayısı Romen rakamıyla XVI şeklinde yazılır."
      },
      {
            "q": "13 doğal sayısının Romen rakamıyla yazılışı hangisidir? 🏛️",
            "a": "XIII",
            "d": [
                  "XII",
                  "XIV"
            ],
            "exp": "13 sayısı Romen rakamıyla XIII şeklinde yazılır."
      },
      {
            "q": "17 doğal sayısının Romen rakamıyla yazılışı hangisidir? 🏛️",
            "a": "XVII",
            "d": [
                  "XVI",
                  "XVIII"
            ],
            "exp": "17 sayısı Romen rakamıyla XVII şeklinde yazılır."
      },
      {
            "q": "485 sayısındaki 4 rakamının basamak değeri kaçtır? 📦",
            "a": "400",
            "d": [
                  "40",
                  "4"
            ],
            "exp": "4 rakamı yüzler basamağında yer aldığı için basamak değeri 400'dür."
      },
      {
            "q": "672 sayısındaki 7 rakamının basamak değeri kaçtır? 📦",
            "a": "70",
            "d": [
                  "700",
                  "7"
            ],
            "exp": "7 rakamı onlar basamağında yer aldığı için basamak değeri 70'tir."
      },
      {
            "q": "839 sayısındaki 9 rakamının basamak değeri kaçtır? 📦",
            "a": "9",
            "d": [
                  "90",
                  "900"
            ],
            "exp": "9 rakamı birler basamağında yer aldığı için basamak değeri 9'dur."
      },
      {
            "q": "526 sayısındaki 5 rakamının basamak değeri kaçtır? 📦",
            "a": "500",
            "d": [
                  "50",
                  "5"
            ],
            "exp": "5 rakamı yüzler basamağında yer aldığı için basamak değeri 500'dür."
      },
      {
            "q": "714 sayısındaki 1 rakamının basamak değeri kaçtır? 📦",
            "a": "10",
            "d": [
                  "100",
                  "1"
            ],
            "exp": "1 rakamı onlar basamağında yer aldığı için basamak değeri 10'dur."
      },
      {
            "q": "958 sayısındaki 9 rakamının basamak değeri kaçtır? 📦",
            "a": "900",
            "d": [
                  "90",
                  "9"
            ],
            "exp": "9 rakamı yüzler basamağında yer aldığı için basamak değeri 900'dür."
      },
      {
            "q": "348 sayısı en yakın hangi yüzlüğe yuvarlanır? 🎯",
            "a": "300",
            "d": [
                  "400",
                  "350"
            ],
            "exp": "Onlar basamağında 4 olduğu için (50'den küçük) 300 yüzlüğüne yuvarlanır."
      },
      {
            "q": "562 sayısı en yakın hangi yüzlüğe yuvarlanır? 🎯",
            "a": "600",
            "d": [
                  "500",
                  "550"
            ],
            "exp": "Onlar basamağında 6 olduğu için (50 ve üzeri) 600 yüzlüğüne yuvarlanır."
      },
      {
            "q": "785 sayısı en yakın hangi yüzlüğe yuvarlanır? 🎯",
            "a": "800",
            "d": [
                  "700",
                  "750"
            ],
            "exp": "Onlar basamağında 8 olduğu için 800 yüzlüğüne yuvarlanır."
      },
      {
            "q": "419 sayısı en yakın hangi yüzlüğe yuvarlanır? 🎯",
            "a": "400",
            "d": [
                  "500",
                  "450"
            ],
            "exp": "Onlar basamağında 1 olduğu için 400 yüzlüğüne yuvarlanır."
      },
      {
            "q": "650 sayısı en yakın hangi yüzlüğe yuvarlanır? 🎯",
            "a": "700",
            "d": [
                  "600",
                  "650"
            ],
            "exp": "Onlar basamağında 5 olduğu için yukarı, yani 700 yüzlüğüne yuvarlanır."
      },
      {
            "q": "4 yüzlük, 6 onluk ve 3 birlikten oluşan sayı kaçtır? 📦",
            "a": "463",
            "d": [
                  "436",
                  "643"
            ],
            "exp": "400 + 60 + 3 = 463 eder."
      },
      {
            "q": "7 yüzlük, 0 onluk ve 8 birlikten oluşan sayı kaçtır? 📦",
            "a": "708",
            "d": [
                  "780",
                  "78"
            ],
            "exp": "700 + 0 + 8 = 708 eder."
      },
      {
            "q": "5 yüzlük, 9 onluk ve 2 birlikten oluşan sayı kaçtır? 📦",
            "a": "592",
            "d": [
                  "529",
                  "952"
            ],
            "exp": "500 + 90 + 2 = 592 eder."
      }
],

    generateGrade3RomenAndPlace() {
      const item = this.drawFromPool(this.grade3RomenPlacePool, "grade3RomenPlacePool");
      return {
        question: item.q,
        correct: item.a,
        distractors: item.d,
        explanation: item.exp
      };
    },

    // 3. SINIF: ÇARPMA, BÖLME VE SÖZEL PROBLEMLER (26 SORU)
    grade3MultDivPool: [
      {
            "q": "6 kere 7 işleminin sonucu kaçtır? ✖️",
            "a": "42",
            "d": [
                  "36",
                  "48"
            ],
            "exp": "6 × 7 = 42 eder."
      },
      {
            "q": "7 kere 8 işleminin sonucu kaçtır? ✖️",
            "a": "56",
            "d": [
                  "48",
                  "64"
            ],
            "exp": "7 × 8 = 56 eder."
      },
      {
            "q": "8 kere 9 işleminin sonucu kaçtır? ✖️",
            "a": "72",
            "d": [
                  "64",
                  "81"
            ],
            "exp": "8 × 9 = 72 eder."
      },
      {
            "q": "6 kere 8 işleminin sonucu kaçtır? ✖️",
            "a": "48",
            "d": [
                  "42",
                  "54"
            ],
            "exp": "6 × 8 = 48 eder."
      },
      {
            "q": "7 kere 9 işleminin sonucu kaçtır? ✖️",
            "a": "63",
            "d": [
                  "56",
                  "72"
            ],
            "exp": "7 × 9 = 63 eder."
      },
      {
            "q": "8 kere 8 işleminin sonucu kaçtır? ✖️",
            "a": "64",
            "d": [
                  "56",
                  "72"
            ],
            "exp": "8 × 8 = 64 eder."
      },
      {
            "q": "9 kere 9 işleminin sonucu kaçtır? ✖️",
            "a": "81",
            "d": [
                  "72",
                  "90"
            ],
            "exp": "9 × 9 = 81 eder."
      },
      {
            "q": "6 kere 6 işleminin sonucu kaçtır? ✖️",
            "a": "36",
            "d": [
                  "30",
                  "42"
            ],
            "exp": "6 × 6 = 36 eder."
      },
      {
            "q": "7 kere 7 işleminin sonucu kaçtır? ✖️",
            "a": "49",
            "d": [
                  "42",
                  "56"
            ],
            "exp": "7 × 7 = 49 eder."
      },
      {
            "q": "6 kere 9 işleminin sonucu kaçtır? ✖️",
            "a": "54",
            "d": [
                  "48",
                  "60"
            ],
            "exp": "6 × 9 = 54 eder."
      },
      {
            "q": "24 sayısı 4 eşit parçaya bölündüğünde sonuç kaç olur? ➗",
            "a": "6",
            "d": [
                  "5",
                  "7"
            ],
            "exp": "24 ÷ 4 = 6 olur."
      },
      {
            "q": "35 sayısı 5 eşit parçaya bölündüğünde sonuç kaç olur? ➗",
            "a": "7",
            "d": [
                  "6",
                  "8"
            ],
            "exp": "35 ÷ 5 = 7 olur."
      },
      {
            "q": "42 sayısı 6 eşit parçaya bölündüğünde sonuç kaç olur? ➗",
            "a": "7",
            "d": [
                  "6",
                  "8"
            ],
            "exp": "42 ÷ 6 = 7 olur."
      },
      {
            "q": "48 sayısı 8 eşit parçaya bölündüğünde sonuç kaç olur? ➗",
            "a": "6",
            "d": [
                  "5",
                  "7"
            ],
            "exp": "48 ÷ 8 = 6 olur."
      },
      {
            "q": "56 sayısı 7 eşit parçaya bölündüğünde sonuç kaç olur? ➗",
            "a": "8",
            "d": [
                  "7",
                  "9"
            ],
            "exp": "56 ÷ 7 = 8 olur."
      },
      {
            "q": "54 sayısı 6 eşit parçaya bölündüğünde sonuç kaç olur? ➗",
            "a": "9",
            "d": [
                  "8",
                  "7"
            ],
            "exp": "54 ÷ 6 = 9 olur."
      },
      {
            "q": "63 sayısı 9 eşit parçaya bölündüğünde sonuç kaç olur? ➗",
            "a": "7",
            "d": [
                  "6",
                  "8"
            ],
            "exp": "63 ÷ 9 = 7 olur."
      },
      {
            "q": "72 sayısı 8 eşit parçaya bölündüğünde sonuç kaç olur? ➗",
            "a": "9",
            "d": [
                  "8",
                  "7"
            ],
            "exp": "72 ÷ 8 = 9 olur."
      },
      {
            "q": "81 sayısı 9 eşit parçaya bölündüğünde sonuç kaç olur? ➗",
            "a": "9",
            "d": [
                  "8",
                  "10"
            ],
            "exp": "81 ÷ 9 = 9 olur."
      },
      {
            "q": "36 sayısı 6 eşit parçaya bölündüğünde sonuç kaç olur? ➗",
            "a": "6",
            "d": [
                  "5",
                  "7"
            ],
            "exp": "36 ÷ 6 = 6 olur."
      },
      {
            "q": "Günde 8 sayfa kitap okuyan Zeynep 7 günde toplam kaç sayfa okur? 📖",
            "a": "56 sayfa",
            "d": [
                  "48 sayfa",
                  "64 sayfa"
            ],
            "exp": "7 gün × 8 sayfa = 56 sayfa okur."
      },
      {
            "q": "Bir pastanede 6 tepsi kurabiye var. Her tepside 9 kurabiye olduğuna göre toplam kaç kurabiye vardır? 🍪",
            "a": "54 kurabiye",
            "d": [
                  "48 kurabiye",
                  "60 kurabiye"
            ],
            "exp": "6 tepsi × 9 kurabiye = 54 kurabiye eder."
      },
      {
            "q": "Tanesi 7 lira olan defterlerden 8 tane alan Can kırtasiyeciye kaç lira öder? 📚",
            "a": "56 lira",
            "d": [
                  "49 lira",
                  "63 lira"
            ],
            "exp": "8 defter × 7 lira = 56 lira öder."
      },
      {
            "q": "32 öğrenci 4 gruba eşit olarak ayrılırsa her grupta kaç öğrenci olur? 🏫",
            "a": "8 öğrenci",
            "d": [
                  "6 öğrenci",
                  "9 öğrenci"
            ],
            "exp": "32 ÷ 4 = 8 öğrenci olur."
      },
      {
            "q": "45 elma 5 sepete eşit olarak paylaştırılırsa her sepette kaç elma olur? 🍎",
            "a": "9 elma",
            "d": [
                  "8 elma",
                  "7 elma"
            ],
            "exp": "45 ÷ 5 = 9 elma olur."
      },
      {
            "q": "Bir çiftlikte 9 tavşan var. Bu tavşanların toplam kaç ayağı vardır? 🐇",
            "a": "36 ayak",
            "d": [
                  "27 ayak",
                  "40 ayak"
            ],
            "exp": "9 tavşan × 4 ayak = 36 ayak eder."
      }
],

    generateGrade3MultDiv() {
      const item = this.drawFromPool(this.grade3MultDivPool, "grade3MultDivPool");
      return {
        question: item.q,
        correct: item.a,
        distractors: item.d,
        explanation: item.exp
      };
    },

    // 3. SINIF: KESİRLER VE GEOMETRİK CİSİMLER (26 ÖZGÜN SORU)
    grade3FractionsAndShapesPool: [
      { q: 'Payı 1 olan kesirlere (örneğin 1/2, 1/3, 1/5) ne ad verilir? 🍕', a: 'Birim Kesir 🍕', d: ['Bileşik Kesir', 'Tam Sayılı Kesir'], exp: 'Payı 1 olan bütün kesirler "birim kesir" olarak adlandırılır.' },
      { q: 'Kesir çizgisinin ÜSTÜNDE yer alan ve eş parçalardan kaç tanesinin alındığını gösteren sayıya ne denir?', a: 'Pay ⬆️', d: ['Payda ⬇️', 'Bölüm'], exp: 'Kesir çizgisinin üstündeki sayı pay, altındaki sayı ise paydadır.' },
      { q: 'Kesir çizgisinin ALTINDA yer alan ve bir bütünün kaç eşit parçaya bölündüğünü gösteren sayıya ne denir?', a: 'Payda ⬇️', d: ['Pay ⬆️', 'Kalan'], exp: 'Payda, bir bütünün kaç eşit parçaya bölündüğünü ifade eder.' },
      { q: '32 sayısının 1/4\'ü (çeyreği) kaçtır? 🔢', a: '8', d: ['6', '12'], exp: '32 sayısının 1/4\'ünü bulmak için 4\'e böleriz: 32 ÷ 4 = 8.' },
      { q: '45 elmanın 1/5\'i kaç elma eder? 🍎', a: '9 elma 🍎', d: ['8 elma', '10 elma'], exp: '45 ÷ 5 = 9 elma eder.' },
      { q: 'Tüm yüzleri kare olan, 6 yüzü, 8 köşesi ve 12 ayrıtı olan geometrik cisim hangisidir? 🧊', a: 'Küp 🧊', d: ['Kare Prizma', 'Küre ⚽'], exp: 'Küpün 6 eşit kare yüzü, 8 köşesi ve 12 ayrıtı vardır.' },
      { q: 'Küpün kaç adet AYRITI (kenarı) vardır? 🧊', a: '12 ayrıt 🧊', d: ['8 ayrıt', '6 ayrıt'], exp: 'Küpün 12 tane ayrıtı (kenarı) bulunur.' },
      { q: 'Küpün kaç adet KÖŞESİ vardır? 🧊', a: '8 köşe 🧊', d: ['6 köşe', '12 köşe'], exp: 'Küpün 8 köşesi bulunur.' },
      { q: 'Kare prizmanın kaç tane karesel yüzü vardır? 📦', a: '2 tane karesel yüz 📦', d: ['4 tane', '6 tane'], exp: 'Kare prizmanın alt ve üst tabanı olmak üzere 2 kare, yanlarında 4 dikdörtgen yüzü vardır.' },
      { q: 'Dikdörtgen prizmanın tüm yüzleri hangi geometrik şekildedir? 🚪', a: 'Dikdörtgen 🚪', d: ['Kare', 'Üçgen'], exp: 'Dikdörtgenler prizmasının 6 yüzünün tamamı dikdörtgendir.' },
      { q: 'Üçgen prizmanın kaç köşesi vardır? 📐', a: '6 köşe 📐', d: ['8 köşe', '4 köşe'], exp: 'Üçgen prizmanın üstte 3, altta 3 olmak üzere toplam 6 köşesi vardır.' },
      { q: 'Hiç köşesi ve ayrıtı olmayan, yuvarlak uzay cismi hangisidir? ⚽', a: 'Küre ⚽', d: ['Silindir 🛢️', 'Koni 🍦'], exp: 'Kürenin eğri tek bir yüzeyi vardır; köşesi ve ayrıtı yoktur.' },
      { q: 'Dondurma külahı veya trafik konisi hangi geometrik cisme benzer? 🍦', a: 'Koni 🍦', d: ['Silindir 🛢️', 'Prizma 📦'], exp: 'Trafik konisi ve dondurma külahı koni modelidir.' },
      { q: 'Konserve kutusu veya pil hangi geometrik cisme benzer? 🛢️', a: 'Silindir 🛢️', d: ['Koni 🍦', 'Küp 🧊'], exp: 'Konserve kutusu ve pil silindir şeklindedir (2 daire taban, 1 eğri yüz).' },
      { q: 'Silindirin kaç adet köşesi vardır? 🛢️', a: '0 (Köşesi yoktur) 🛢️', d: ['2 köşe', '4 köşe'], exp: 'Silindirin köşesi ve ayrıtı bulunmaz.' },
      { q: '50 liranın 1/2\'si (yarısı) kaç liradır? 💵', a: '25 TL 💵', d: ['20 TL', '30 TL'], exp: '50 ÷ 2 = 25 TL eder.' },
      { q: 'Bir bütünü 8 eş parçaya böldüğümüzde oluşan her bir parçanın kesir gösterimi nedir?', a: '1/8 🍕', d: ['1/4', '8/1'], exp: '8 eş parçadan biri 1/8 olarak gösterilir.' },
      { q: 'Bir pastanın 3/4\'ü yendiğinde geriye pastanın ne kadarı kalır? 🎂', a: '1/4\'ü (Çeyreği) 🎂', d: ['2/4\'ü', 'Yarısı'], exp: 'Tam pasta 4/4\'tür. 4/4 - 3/4 = 1/4 kalır.' },
      { q: 'Üçgen prizmanın kaç adet yüzü vardır? 📐', a: '5 yüz (2 üçgen, 3 dikdörtgen) 📐', d: ['6 yüz', '4 yüz'], exp: 'Üçgen prizmanın 2 üçgen tabanı ve 3 dikdörtgen yan yüzü vardır.' },
      { q: '60 dakikanın 1/3\'ü kaç dakikadır? ⏳', a: '20 dakika ⏳', d: ['15 dakika', '30 dakika'], exp: '60 ÷ 3 = 20 dakikadır.' },
      { q: 'Kibrit kutusu hangi geometrik cisme benzer? 📦', a: 'Dikdörtgenler prizması 📦', d: ['Küp', 'Koni'], exp: 'Kibrit kutusu karşılıklı yüzleri eşit dikdörtgenler prizmasıdır.' },
      { q: '24 cevizin 1/6\'sı kaç cevizdir? 🌰', a: '4 ceviz 🌰', d: ['6 ceviz', '8 ceviz'], exp: '24 ÷ 6 = 4 ceviz eder.' },
      { q: 'Futbol topu hangi geometrik cisme benzer? ⚽', a: 'Küre ⚽', d: ['Çember', 'Silindir'], exp: 'Futbol topu 3 boyutlu bir küre cismidir.' },
      { q: 'Aşağıdaki cisimlerin hangisinin KÖŞESİ VARDIR? 🧊', a: 'Küp 🧊', d: ['Silindir 🛢️', 'Küre ⚽'], exp: 'Küpün 8 köşesi varken silindir ve kürenin köşesi yoktur.' },
      { q: '36 yolcunun 1/4\'ü otobüsten indiğinde kaç yolcu inmiş olur? 🚌', a: '9 yolcu 🚌', d: ['8 yolcu', '12 yolcu'], exp: '36 ÷ 4 = 9 yolcu inmiştir.' },
      { q: 'Paydası 7, payı 3 olan kesir nasıl yazılır?', a: '3/7 📝', d: ['7/3', '3/10'], exp: 'Pay yukarıya (3), payda aşağıya (7) yazılır: 3/7.' }
    ],

    // 3. SINIF: EŞ SESLİ KELİMELER VE MECAZ ANLAM (30 ÖZGÜN SORU)
    grade3HomonymsFigurativePool: [
      { q: '"Yüz" kelimesi hangi özelliği taşır? 🎭', a: 'Eş Sesli (Sesteş) 🎭', d: ['Zıt Anlamlı', 'Terim Anlam'], exp: '"Yüz" hem sayı (100), hem surat/çehre, hem de suda yüzmek eylemidir.' },
      { q: '"Çay" kelimesi hangi iki farklı anlama gelir? ☕🌊', a: 'İçilen sıcak çay ve küçük akarsu 🌊', d: ['Meyve ve sebze', 'Deniz ve göl'], exp: 'Çay hem kahvaltıda içtiğimiz içecek hem de dereden büyük akarsudur.' },
      { q: '"Arkadaşının bu kırıcı sözleri kalbini çok kırdı." cümlesindeki "kırdı" sözcüğü hangi anlamdadır?', a: 'Mecaz Anlam 💔', d: ['Gerçek Anlam', 'Terim Anlam'], exp: 'Kalp porselen gibi fiziksel kırılmaz; üzülmeyi, incinmeyi anlattığı için mecaz anlamdır.' },
      { q: '"Yere düşen cam bardak tuzla buz oldu, kırıldı." cümlesindeki "kırıldı" sözcüğü hangi anlamdadır?', a: 'Gerçek Anlam 🥛', d: ['Mecaz Anlam', 'Zıt Anlam'], exp: 'Bardağın fiziksel olarak parçalanması sözcüğün ilk ve gerçek anlamıdır.' },
      { q: '"Bizi kapıda çok SICAK ve samimi karşıladılar." cümlesinde "sıcak" hangi anlamdadır? ☀️', a: 'Mecaz Anlam (İçten, dostça) 🤝', d: ['Gerçek Anlam (Yüksek ısı)', 'Terim Anlam'], exp: 'İnsanın davranışının sıcak olması dostça ve sevgi dolu olduğunu belirten mecazdır.' },
      { q: '"Sıcak çorba dilimi yaktı." cümlesinde "sıcak" hangi anlamdadır? 🥣', a: 'Gerçek Anlam 🥣', d: ['Mecaz Anlam', 'Eş Sesli'], exp: 'Çorbanın ısısının yüksek olması gerçek anlamdır.' },
      { q: '"Kaz" kelimesi eş sesli olarak hangi anlamlara gelir? 🦆⛏️', a: 'Beyaz kümes hayvanı ve toprağı kazmak ⛏️', d: ['Uçak ve araba', 'Kedi ve köpek'], exp: 'Kaz hem sevimli kanatlı hayvan hem de kazma eylemidir.' },
      { q: '"Gül" kelimesi hangi anlamlara gelen bir sesteş sözcüktür? 🌹😊', a: 'Güzel kokulu çiçek ve gülümsemek 😊', d: ['Ağlamak ve gülmek', 'Meyve ve ağaç'], exp: 'Gül hem çiçek hem de neşelenip gülmektir.' },
      { q: '"Ağır sözleriyle salondaki herkesi susturdu." cümlesindeki "ağır" ne anlama gelir?', a: 'Mecaz Anlam (Kırıcı, incitici) 💔', d: ['Gerçek Anlam (Tartıda ağır)', 'Eş Sesli'], exp: 'Söz tartılamaz; kırıcı ve dokunaklı olması mecazdır.' },
      { q: '"Pazardan aldığımız çanta çok ağırdı." cümlesindeki "ağır" hangi anlamdadır? 🛍️', a: 'Gerçek Anlam (Kilosu fazla) ⚖️', d: ['Mecaz Anlam', 'Zıt Anlam'], exp: 'Çantanın tartıdaki ağırlığı gerçek fiziksel anlamdır.' },
      { q: '"Kır" sözcüğü aşağıdaki cümlelerin hangisinde "yeşillik, çimenlik doğa" anlamında kullanılmıştır? 🌿', a: 'Hafta sonu kır çiçekleri toplamaya gittik. 🌸', d: ['Dedemin saçlarına aklar ve kırlar düşmüş.', 'Tahtayı ortadan ikiye kır.'], exp: 'Kır çiçekleri ve kır pikniği doğayı ifade eder.' },
      { q: '"Dal" sözcüğü eş sesli olarak hangi anlamlara sahiptir? 🌿🏊‍♂️', a: 'Ağacın dalı ve suya dalmak 🏊‍♂️', d: ['Yaprak ve kök', 'Güneş ve bulut'], exp: 'Ağaç dalı ve denize dalmak sesteştir.' },
      { q: '"Bin" sözcüğü hangi iki farklı anlama gelir? 🔢🐎', a: '1000 sayısı ve ata/arabaya binmek 🐎', d: ['Yürümek ve koşmak', 'Yüz ve on'], exp: 'Bin hem 1000 rakamı hem de bir taşıta binmektir.' },
      { q: '"Bu haberi alınca gözleri sevinçle parladı." cümlesinde mecazi bir anlatım var mıdır? ✨', a: 'Evet, mecaz anlam vardır (Aşırı sevinmek) ✨', d: ['Hayır, lamba gibi ışık saçmıştır', 'Terim anlamdır'], exp: 'Göz fener gibi ışık saçmaz, aşırı mutluluğu anlatan mecazdır.' },
      { q: '"Tatlı dilli olursan herkes seni sever." cümlesinde "tatlı" hangi anlamdadır? 🍯', a: 'Mecaz Anlam (Sevimli, hoş konuşan) 😊', d: ['Gerçek Anlam (Şekerli)', 'Zıt Anlam'], exp: 'Dilin şekerli olması değil, sözlerin hoş olması mecazdır.' },
      { q: '"Annem bayram için çok tatlı bir baklava yaptı." cümlesinde "tatlı" nedir? 🥮', a: 'Gerçek Anlam (Şeker tadı) 🥮', d: ['Mecaz Anlam', 'Eş Sesli'], exp: 'Şekerli yiyecek gerçek anlamdır.' },
      { q: '"Yaz" sözcüğü hangi iki anlama gelen eş sesli bir kelimedir? ☀️✍️', a: 'Sıcak mevsim ve deftere yazı yazmak ✍️', d: ['Kış ve bahar', 'Kitap ve defter'], exp: 'Yaz mevsimi ve yazı yazmak eş seslidir.' },
      { q: '"Bağ" kelimesi hangi anlamlara gelebilir? 🍇👟', a: 'Üzüm bağı ve ayakkabı bağı 👟', d: ['Elma ve armut', 'Çorap ve pantolon'], exp: 'Üzüm bahçesi ve bağlamak için kullanılan ip (bağ) eş seslidir.' },
      { q: '"Karanlık işlere bulaşmamalısın." cümlesindeki "karanlık" ne demektir? 🌑', a: 'Mecaz Anlam (Yasa dışı, gizli, kötü) 🕵️', d: ['Gerçek Anlam (Işıksız ortam)', 'Terim Anlam'], exp: 'Kötü ve gizli işler için mecazen "karanlık" denir.' },
      { q: '"Güneş batınca sokaklar karanlık oldu." cümlesindeki "karanlık" nedir? 🌑', a: 'Gerçek Anlam (Işığın olmaması) 🌑', d: ['Mecaz Anlam', 'Eş Anlam'], exp: 'Işığın çekilmesi gerçek anlamdır.' },
      { q: '"At" sözcüğü hangi anlamlara sahiptir? 🐴🎾', a: 'Binek hayvanı ve bir nesneyi fırlatmak 🎾', d: ['Eşek ve katır', 'Koşmak ve yürümek'], exp: 'At hayvanı ve topu atmak eş seslidir.' },
      { q: '"Boş sözlerle beni oyalamayı bırak." cümlesindeki "boş" hangi anlamdadır? 📦', a: 'Mecaz Anlam (Yararsız, anlamsız) 💬', d: ['Gerçek Anlam (İçinde madde olmayan)', 'Eş Sesli'], exp: 'Sözün içinde eşya olmaması değil, yararsız olması mecazdır.' },
      { q: '"Boş bardağa süt doldurdum." cümlesindeki "boş" nedir? 🥛', a: 'Gerçek Anlam (İçi dolu olmayan) 🥛', d: ['Mecaz Anlam', 'Zıt Anlam'], exp: 'Bardağın içinde madde bulunmaması gerçek anlamdır.' },
      { q: '"Yaş" sözcüğü eş sesli olarak hangi anlamlara gelir? 💧🎂', a: 'Islak olma durumu ve doğum yılı yaşı 🎂', d: ['Kuru ve nemli', 'Genç ve ihtiyar'], exp: 'Yaş bez (ıslak) ve "9 yaşındayım" eş seslidir.' },
      { q: '"Ocak" sözcüğü eş sesli olarak hangilerini ifade eder? 🗓️🔥', a: 'Yılın 1. ayı ve yemek pişirilen ateşlik 🔥', d: ['Şubat ve Mart', 'Fırın ve buzdolabı'], exp: 'Ocak ayı ve mutfaktaki ocak sesteştir.' },
      { q: '"Ekmek" kelimesi hangi iki temel anlama gelir? 🥖🌱', a: 'Fırında pişen ekmek ve tohum ekmek 🌱', d: ['Su ve yemek', 'Ağaç ve çiçek'], exp: 'Yediğimiz ekmek ve tarlaya buğday ekmek eş seslidir.' },
      { q: '"Dolu" kelimesi hangi anlamlara sahiptir? 🌧️🥛', a: 'Buzlu yağış türü ve içi doldurulmuş kap 🥛', d: ['Kar ve yağmur', 'Boş ve yarım'], exp: 'Gökyüzünden yağan dolu ve dolu bardak eş seslidir.' },
      { q: '"Sönmek" sözcüğü hangisinde MECAZ anlamda kullanılmıştır? 💡', a: 'Bu haberden sonra içindeki tüm umutlar söndü. 💔', d: ['İtfaiye yangını söndürdü.', 'Kömürün ateşi söndü.'], exp: 'Umut ateş gibi yanıp sönmez; yok olmasını anlatan mecazdır.' },
      { q: '"Ben" sözcüğü hangi iki anlama gelen eş sesli bir sözcüktür? 👤🤎', a: '1. tekil şahıs (kendim) ve derideki siyah leke 🤎', d: ['Sen ve o', 'Göz ve kulak'], exp: 'Kişi zamiri "ben" ve ciltteki küçük ben eş seslidir.' },
      { q: '"Boya" kelimesi hem bir malzeme hem de bir eylemdir. Bu duruma ne denir? 🎨', a: 'Eş Seslilik (Sesteşlik) 🎨', d: ['Zıt Anlamlılık', 'Mecazlık'], exp: 'Resim boyası ve duvarı boyamak eş sesli kullanımdır.' }
    ],

    // 3. SINIF: NOKTALAMA, YAZIM KURALLARI VE 5N1K (26 ÖZGÜN SORU)
    grade3Punctuation5N1KPool: [
      { q: '"Ali dün akşam parkta arkadaşlarıyla bisiklet sürdü." cümlesinde Ali NE ZAMAN bisiklet sürmüştür? 🚲', a: 'Dün akşam 🚲', d: ['Parkta', 'Arkadaşlarıyla'], exp: '"Ne zaman?" sorusu zamanı belirtir: Dün akşam.' },
      { q: '"Ayşe hasta olduğu için bugün okula gelemedi." cümlesinde Ayşe NİÇİN (NEDEN) okula gelememiştir? 🏫', a: 'Hasta olduğu için 🤒', d: ['Bugün', 'Okula'], exp: 'Eylemin sebebini bildiren ifade "Hasta olduğu için"dir.' },
      { q: '"Mustafa tatilde dedesini ziyaret etmek için Köyceğiz\'e gitti." Mustafa NEREYE gitmiştir? 🏡', a: 'Köyceğiz\'e 🏡', d: ['Tatilde', 'Dedesine'], exp: '"Nereye?" sorusu mekanı belirtir: Köyceğiz\'e.' },
      { q: '"Kırtasiyeden defter, kalem, silgi ve cetvel aldım." cümlesinde art arda sıralanan eş görevli kelimelerin arasına ne konur? ✏️', a: 'Virgül (,) ✏️', d: ['Nokta (.)', 'Soru İşareti (?)'], exp: 'Eş görevli kelimeleri ayırmak için virgül (,) kullanılır.' },
      { q: '"Yaşasın, yarın okulumuzda tiyatro var" cümlesinin sonuna hangi noktalama işareti konmalıdır? 🎉', a: 'Ünlem İşareti (!) 🎉', d: ['Nokta (.)', 'Soru İşareti (?)'], exp: 'Sevinç, heyecan, korku bildiren cümlelerin sonuna ünlem işareti konur.' },
      { q: '"Öğretmenimiz içeri girdi ve şöyle dedi: — Çocuklar, kitaplarınızı açın." Konuşma öncesinde hangi işaret kullanılır? 💬', a: 'İki Nokta (:) 💬', d: ['Noktalı Virgül (;)', 'Virgül (,)'], exp: 'Konuşma ve açıklamalardan önce iki nokta (:) konur.' },
      { q: '"Öğretmen Ali\'ye sordu: ( ) Ödevini neden bitirmedin ( )" Parantez içlerine sırasıyla ne gelmelidir? ❓', a: 'Tırnak işareti (") ve Soru işareti (?) ❓', d: ['Nokta ve Virgül', 'Ünlem ve Nokta'], exp: 'Alıntı cümle tırnak ("...") içine alınır ve soru cümlesi soru işaretiyle biter.' },
      { q: 'Özel isimlere getirilen çekim eklerini ayırmak için hangi işaret kullanılır? 🇹🇷', a: 'Kesme İşareti (\') 🇹🇷', d: ['Kısa Çizgi (-)', 'Virgül (,)'], exp: 'Atatürk\'ün, Ankara\'da gibi özel isim ekleri kesme işaretiyle ayrılır.' },
      { q: 'Aşağıdaki cümlelerin hangisinde "de / da" bağlacının yazımı DOĞRUDUR? ✅', a: 'Ahmet de bizimle maça gelecek. ✅', d: ['Ahmetde bizimle gelecek.', 'Kitabım ev de kaldı.'], exp: 'Cümleden çıkarıldığında anlam bozulmayan "de/da" bağlacı ayrı yazılır.' },
      { q: 'Aşağıdaki cümlelerin hangisinde "mi" soru ekinin yazımı YANLIŞTIR? ❌', a: 'Seninle sinemaya gelelimmi? ❌', d: ['Bize yardım eder misin?', 'Ödevini yaptın mı?'], exp: '"mi/mı/mu/mü" soru eki her zaman kendinden önceki kelimeden ayrı yazılır.' },
      { q: 'Dijital saatlerde saat ve dakikanın arasına Türk Dil Kurumu\'na göre hangi işaret konur? ⏰', a: 'Tek Nokta (.) [Örn: 09.30] ⏰', d: ['İki Nokta (:) [09:30]', 'Virgül (,) [09,30]'], exp: 'TDK yazım kuralına göre saat ve dakika arasına tek nokta (.) konur.' },
      { q: '"Satır sonuna sığmayan kelimeler hecelerinden bölünürken satır sonuna ne konur? ✍️', a: 'Kısa Çizgi (-) ✍️', d: ['Uzun Çizgi (—)', 'Eğik Çizgi (/)'], exp: 'Satır sonuna sığmayan kelimeleri hecelerine ayırmak için kısa çizgi kullanılır.' },
      { q: '"Doktor Elif Hanım hastalarını güler yüzle muayene etti." cümlesinde HASTALARI KİM muayene etmiştir? 👩‍⚕️', a: 'Doktor Elif Hanım 👩‍⚕️', d: ['Hastalar', 'Güler yüzle'], exp: '"Kim?" sorusunun cevabı eylemi yapan özneyi verir: Doktor Elif Hanım.' },
      { q: '"Mehmet yarışmada birincilik kupasını hızla koşarak kazandı." Mehmet kupayı NASIL kazanmıştır? 🏃‍♂️', a: 'Hızla koşarak 🏃‍♂️', d: ['Mehmet', 'Yarışmada'], exp: '"Nasıl?" sorusu eylemin yapılma biçimini açıklar: Hızla koşarak.' },
      { q: 'Hangisinde büyük harflerin yazımıyla ilgili bir YANLIŞLIK yapılmıştır? ❌', a: 'Yarın ankara\'ya gideceğiz. ❌', d: ['Mustafa Kemal Atatürk büyük bir liderdir.', 'Türkçe dersini çok seviyorum.'], exp: 'Şehir isimleri özel isimdir ve mutlaka büyük harfle başlamalıdır: Ankara\'ya.' },
      { q: 'Cümlelerin sonuna konan en temel noktalama işareti hangisidir? 🛑', a: 'Nokta (.) 🛑', d: ['Virgül (,)', 'İki Nokta (:)'], exp: 'Tamamlanmış yargı bildiren cümlelerin sonuna nokta konur.' },
      { q: 'Tarihlerin yazılışında gün, ay ve yılı gösteren sayıların arasına hangisi konabilir? 📅', a: 'Nokta (.) [Örn: 29.10.1923] 📅', d: ['Virgül (,)', 'İki Nokta (:)'], exp: 'Tarihler arasında nokta (.) veya eğik çizgi (/) kullanılır.' },
      { q: '"Hangi okula gidiyorsun( )" cümlesinin sonuna hangi işaret konmalıdır? 🏫', a: 'Soru İşareti (?) ❓', d: ['Nokta (.)', 'Ünlem İşareti (!)'], exp: 'Soru bildiren cümlelerin sonuna soru işareti konur.' },
      { q: '"Eyvah, süt taştı( )" cümlesinin sonuna hangi işaret konmalıdır? 🥛', a: 'Ünlem İşareti (!) 💥', d: ['Nokta (.)', 'Soru İşareti (?)'], exp: '"Eyvah" telaş ve panik bildirdiği için ünlem işareti konur.' },
      { q: 'Aşağıdaki kelimelerden hangisi satır sonunda DOĞRU hecelenmiştir? ✍️', a: 'Ba-şöğ-ret-men 👨‍🏫', d: ['Baş-öğ-ret-men', 'Ba-şö-ğret-men'], exp: 'Türkçe heceleme kuralına göre "ba-şöğ-ret-men" şeklinde bölünür.' },
      { q: '"İmdat, boğuluyorum( )" cümlesinin sonuna ne konur? 🆘', a: 'Ünlem İşareti (!) 🆘', d: ['Nokta (.)', 'Virgül (,)'], exp: 'Yardım çağrısı ve korku bildiren cümlelerin sonuna ünlem işareti konur.' },
      { q: '"Kitaplığımda romanlar( ) masallar ve şiir kitapları var." Paranteze ne konur? 📚', a: 'Virgül (,) 📚', d: ['Nokta (.)', 'Soru İşareti (?)'], exp: 'Eş görevli kelimeler virgülle ayrılır.' },
      { q: '"Akşam babamla beraber satranç oynadık." cümlesinde çocuk KİMİNLE satranç oynamıştır? ♟️', a: 'Babasıyla ♟️', d: ['Akşam', 'Satranç'], exp: '"Kiminle?" sorusunun yanıtı "Babamla" ifadesidir.' },
      { q: 'Aşağıdaki kısaltmalardan hangisinin yazımı DOĞRUDUR? 🇹🇷', a: 'TBMM 🇹🇷', d: ['T.B.M.M.', 'T.b.m.m'], exp: 'Büyük harflerle yapılan kısaltmalarda (T.C. ve T. hariç) araya nokta konmaz.' },
      { q: '"Kedi mırıldanarak kucağıma çıktı." cümlesinde kedi kucağa NASIL çıkmıştır? 🐱', a: 'Mırıldanarak 🐱', d: ['Kucağıma', 'Çıktı'], exp: '"Nasıl?" sorusunun cevabı eylemin durumunu belirten "mırıldanarak"tır.' },
      { q: '"Sen de bizimle kitap okumak ister misin( )" Cümle sonuna ne konur? 📖', a: 'Soru İşareti (?) 📖', d: ['Nokta (.)', 'Ünlem (!)'], exp: 'Soru eylemi içerdiği için soru işareti konur.' }
    ],

    // -------------------------------------------------------------
    // 3. SINIF: 2026 TÜRKİYE YÜZYILI MAARİF MODELİ FEN BİLİMLERİ SORU HAVUZLARI
    // (7 Öğrenme Alanı - Dünya, Duyular, Kuvvet, Madde, Işık/Ses, Canlılar, Elektrik + TTS)
    // -------------------------------------------------------------

    grade3SciencePlanetLayersPool: [
      {"q":"Eski zamanlarda Dünya'nın düz bir tepsi gibi olduğunu sananların aksine, sürekli batıya yelken açarak Dünya'nın küreye benzediğini kanıtlayan ünlü denizci kimdir? ⛵","a":"Macellan ⛵","d":["Kristof Kolomb","Piri Reis"],"exp":"Macellan sürekli batıya giderek başladığı yere dönmüş ve Dünya'nın küre şeklinde olduğunu kanıtlamıştır.","spokenText":"Dünya'nın küre şeklinde olduğunu yelken açarak kanıtlayan ünlü denizci kimdir?"},
      {"q":"Uzaktan kıyıya yaklaşan bir geminin ÖNCE bacası ve dumanı, sonra direkleri, en son ise gövdesi görünür. Bu durum neyin kanıtıdır? 🚢","a":"Dünya'nın yuvarlak (küre) şeklinde olduğunun 🌍","d":["Denizin çok derin olduğunun","Geminin çok hızlı gittiğinin"],"exp":"Dünya küre şeklinde olduğu için yaklaşan cisimlerin önce en yüksek kısımları ufukta belirir.","spokenText":"Ufuktan yaklaşan geminin önce bacasının görülmesi neyin kanıtıdır?"},
      {"q":"Dünyamızın uzaydan bakıldığında \"Mavi Gezegen\" olarak adlandırılmasının temel sebebi nedir? 🌍","a":"Yüzeyinin yaklaşık 3/4'ünün sularla kaplı olması 🌊","d":["Gökyüzünün mavi olması","Kutuplarda buzullar olması"],"exp":"Dünya yüzeyinin yaklaşık 4'te 3'ü sularla, 4'te 1'i karalarla kaplıdır.","spokenText":"Dünyamız uzaydan bakıldığında niçin Mavi Gezegen olarak görünür?"},
      {"q":"Dünya'mızın en iç merkezinde bulunan, EN SICAK ve EN AĞIR katmanı hangisidir? 🟡","a":"Çekirdek (Ağır Küre / Barisfer) 🟡","d":["Manto (Ateş Küre)","Yer Kabuğu (Taş Küre)"],"exp":"Dünya'nın merkezinde yer alan çekirdek en sıcak ve en yoğun katmandır.","spokenText":"Dünya'nın en iç merkezinde bulunan en sıcak ve en ağır katmanı hangisidir?"},
      {"q":"Yanardağlardan fışkıran erimiş kızgın lavların kaynağı olan ateş katmanına ne denir? 🌋","a":"Manto (Ateş Küre / Magma) 🌋","d":["Çekirdek","Yer Kabuğu"],"exp":"Taş kürenin hemen altında erimiş akkor haldeki kayaçlardan oluşan magma tabakası mantodur.","spokenText":"Yanardağlardan çıkan lavların kaynağı olan kızgın katman hangisidir?"},
      {"q":"İnsanların, hayvanların ve bitkilerin üzerinde yaşadığı, dağlar ve ovalardan oluşan katman hangisidir? 🏔️","a":"Yer Kabuğu (Taş Küre / Litosfer) 🏔️","d":["Ateş Küre","Hava Küre"],"exp":"Canlıların üzerinde hayatını sürdürdüğü katı dış tabakaya yer kabuğu (taş küre) denir.","spokenText":"Canlıların üzerinde yaşadığı dağlar ve ovalardan oluşan katman hangisidir?"},
      {"q":"Okyanuslar, denizler, göller, nehirler ve yer altı suları Dünya'nın hangi katmanını oluşturur? 🌊","a":"Su Katmanı (Su Küre / Hidrosfer) 🌊","d":["Hava Katmanı","Taş Küre"],"exp":"Yeryüzündeki tüm su kaynakları su katmanını meydana getirir.","spokenText":"Okyanuslar, denizler ve göller Dünya'nın hangi katmanını oluşturur?"},
      {"q":"Dünyamızı çepeçevre saran, içinde soluduğumuz oksijenin bulunduğu gaz kalkanına ne denir? 🌬️","a":"Hava Katmanı (Hava Küre / Atmosfer) 🌬️","d":["Su Küre","Ateş Küre"],"exp":"Dünya'yı saran gaz tabakası atmosferdir; bizi Güneş'in zararlı ışınlarından da korur.","spokenText":"Dünyamızı saran ve soluduğumuz havayı içeren gaz katmanına ne denir?"},
      {"q":"Dünya'nın katmanlarının İÇTEN DIŞA doğru doğru sıralanışı hangisidir? 🎯","a":"Çekirdek ➔ Manto ➔ Yer Kabuğu ➔ Su Küre ➔ Hava Küre","d":["Yer Kabuğu ➔ Manto ➔ Çekirdek","Hava Küre ➔ Su Küre ➔ Manto"],"exp":"En içeride çekirdek, sonra manto, en dışta ise yer kabuğu, sular ve atmosfer yer alır.","spokenText":"Dünya'nın katmanlarının içten dışa doğru sıralanışı nasıldır?"},
      {"q":"Dünya yüzeyinde karalar mı yoksa sular mı daha geniş alan kaplar? 🌊","a":"Sular çok daha fazla alan kaplar (Yaklaşık 3/4) 🌊","d":["Karalar daha fazladır","Karalar ve sular eşittir"],"exp":"Dünya yüzeyinin yaklaşık dörtte üçü su, dörtte biri karadır.","spokenText":"Dünya yüzeyinde karalar mı yoksa sular mı daha çok yer kaplar?"},
      {"q":"Eski Türk-İslam bilgini olup Dünya'nın küre şeklinde olduğunu ve döndüğünü asırlar önce savunan bilim insanı kimdir? 📜","a":"Biruni 📜","d":["İbn-i Sina","Ali Kuşçu"],"exp":"Biruni, Dünya'nın çapını ve küre biçimini o dönemin imkanlarıyla gerçeğe çok yakın hesaplamıştır.","spokenText":"Dünya'nın küre biçiminde olduğunu asırlar önce savunan Türk-İslam bilgini kimdir?"},
      {"q":"Yağmur, kar, rüzgar gibi hava olayları Dünya'nın hangi katmanında gerçekleşir? 🌧️","a":"Hava Katmanı (Atmosfer) 🌬️","d":["Taş Küre","Ateş Küre"],"exp":"Tüm meteorolojik hava olayları atmosfer tabakasında meydana gelir.","spokenText":"Yağmur, kar ve rüzgar Dünya'nın hangi katmanında gerçekleşir?"},
      {"q":"Ay tutulması sırasında Dünya'nın Ay üzerine düşen gölgesi hangi şekildedir? 🌕","a":"Daire (Yuvarlak) şeklindedir 🌑","d":["Kare şeklindedir","Üçgen şeklindedir"],"exp":"Ay tutulmasında Dünya'nın gölgesi daire biçimindedir, bu da Dünya'nın küre olduğunu kanıtlar.","spokenText":"Ay tutulması sırasında Dünya'nın Ay üzerine düşen gölgesi hangi şekildedir?"},
      {"q":"Aşağıdakilerden hangisi Dünya'mızın katmanlarından biri DEĞİLDİR? 🪐","a":"Halka Katmanı 🪐","d":["Taş Küre","Ateş Küre"],"exp":"Dünya'nın Satürn gibi halka katmanı yoktur.","spokenText":"Hangisi Dünya'mızın katmanlarından biri değildir?"},
      {"q":"Yer kabuğu okyanus ve deniz tabanlarında mı yoksa yüksek dağlarda mı daha incedir? 🏔️","a":"Okyanus diplerinde daha incedir 🌊","d":["Dağların tepesinde daha incedir","Her yerde aynı kalınlıktadır"],"exp":"Yer kabuğu yüksek dağlarda kalın, derin okyanus tabanlarında ise daha incedir.","spokenText":"Yer kabuğu okyanus diplerinde mi yoksa dağlarda mı daha incedir?"}
    ],

    grade3ScienceSensesPool: [
      {"q":"Çevremizdeki varlıkların rengini, şeklini ve büyüklüğünü algılamamızı sağlayan duyu organımız hangisidir? 👁️","a":"Göz 👁️","d":["Kulak 👂","Burun 👃"],"exp":"Görme duyusu organımız gözdür.","spokenText":"Cisimlerin rengini ve şeklini algılamamızı sağlayan duyu organımız hangisidir?"},
      {"q":"Gözümüze gelen ışık miktarını ayarlayan ve gözün ortasındaki küçük siyah deliğe ne ad verilir? 👁️","a":"Göz bebeği 👁️","d":["İris","Göz kapağı"],"exp":"Göz bebeği karanlıkta büyür, aydınlıkta küçülerek ışığı ayarlar.","spokenText":"Gözün ortasındaki ışığa göre büyüyüp küçülen siyah noktaya ne ad verilir?"},
      {"q":"Göz sağlığımızı korumak için aşağıdakilerden hangisini YAPMAMALIYIZ? ❌","a":"Televizyon ve telefon ekranına çok yakından bakmak ❌","d":["Yeterli ve dengeli ışıkta kitap okumak","Gözümüzü temiz tutmak"],"exp":"Ekranlara çok yakından bakmak gözleri yorar ve görme bozukluğuna yol açabilir.","spokenText":"Göz sağlığımızı korumak için hangisini yapmamalıyız?"},
      {"q":"Çevremizdeki sesleri algılamamızı ve dengemizi korumamızı sağlayan duyu organımız hangisidir? 👂","a":"Kulak 👂","d":["Dil 👅","Deri 🖐️"],"exp":"Kulak hem işitme hem de vücut dengesini sağlama organımızdır.","spokenText":"Çevremizdeki sesleri algılamamızı ve dengemizi sağlayan organ hangisidir?"},
      {"q":"Kulağımızı temizlerken sivri uçlu sert cisimler sokarsak hangi hassas yapı delinebilir? ⚠️","a":"Kulak zarı 👂","d":["Göz kapağı","Dil ucu"],"exp":"Sivri cisimler kulak zarını zedeleyerek işitme kaybına sebep olabilir.","spokenText":"Kulağımıza sivri cisim sokarsak hangi hassas yapımız zarar görür?"},
      {"q":"Koku alma ve solunum duyusu organımız hangisidir? 👃","a":"Burun 👃","d":["Ağız","Kulak"],"exp":"Burun hem nefes aldığımız havayı süzer hem de kokuları beynimize iletir.","spokenText":"Koku alma ve solunum organımız hangisidir?"},
      {"q":"Burun içindeki kılların ve mukus tabakasının en önemli görevi nedir? 🛡️","a":"Havayı ısıtmak, nemlendirmek ve tozları tutmak 🛡️","d":["Sadece ses çıkarmak","Yiyecekleri çiğnemek"],"exp":"Burnumuz akciğerlere giden havayı ısıtır, nemlendirir ve tozlardan arındırır.","spokenText":"Burun içindeki kılların ve nemli yapının en önemli görevi nedir?"},
      {"q":"Yiyeceklerin tadını almamızı ve konuşurken sesleri çıkarmamızı sağlayan duyu organımız hangisidir? 👅","a":"Dil 👅","d":["Dudak","Yanak"],"exp":"Dilimiz üzerindeki tat tomurcukları sayesinde tatları ayırt ederiz.","spokenText":"Yiyeceklerin tadını almamızı sağlayan duyu organımız hangisidir?"},
      {"q":"Dilimiz temel olarak hangi tatları algılayabilir? 🍯🍋","a":"Tatlı, tuzlu, ekşi ve acı 👅","d":["Sıcak ve soğuk","Sert ve yumuşak"],"exp":"Dilimiz tatlı, tuzlu, ekşi ve acı olmak üzere dört temel tadı algılar.","spokenText":"Dilimiz temel olarak hangi tatları algılar?"},
      {"q":"Nezle veya grip olduğumuzda yemeklerin tadını iyi alamamamızın sebebi nedir? 🍲","a":"Koku ve tat alma duyularının birlikte çalışması 👃👅","d":["Dilin küçülmesi","Dişlerin zayıflaması"],"exp":"Tat alma duyusu koku alma ile ortak çalışır; koku alamayınca tat da eksik algılanır.","spokenText":"Grip olunca yemeklerin tadını iyi alamamamızın sebebi nedir?"},
      {"q":"Vücudumuzu tamamen örten, sıcak-soğuk, sert-yumuşak hissini veren duyu organımız hangisidir? 🖐️","a":"Deri 🖐️","d":["Kas","Kemik"],"exp":"Deri dokunma organımızdır ve vücudumuzu dış etkenlere karşı korur.","spokenText":"Vücudumuzu kaplayan ve dokunma hissini veren duyu organımız hangisidir?"},
      {"q":"Görme engelli bireylerin dokunarak kitap okumasını sağlayan kabartmalı yazı sistemine ne ad verilir? 📖","a":"Braille (Kabartma) Alfabesi 📖","d":["Mors Alfabesi","Romen Alfabesi"],"exp":"Braille alfabesi görme engellilerin parmak uçlarıyla dokunarak okuduğu sistemdir.","spokenText":"Görme engellilerin dokunarak okuduğu kabartmalı alfabeye ne denir?"},
      {"q":"Aşağıdaki kimyasal maddelerden hangisini koklamak veya tadına bakmak ÇOK TEHLİKELİDİR? ☠️","a":"Çamaşır suyu ve tuz ruhu ☠️","d":["Papatya çiçeği 🌼","Nane çayı 🌿"],"exp":"Kimyasal temizlik ürünlerini koklamak veya tatmak zehirlenmeye yol açar.","spokenText":"Hangi kimyasal maddeleri koklamak veya tatmak çok tehlikelidir?"},
      {"q":"Çok yüksek sesli inşaat veya fabrika ortamlarında çalışanlar kulaklarını korumak için ne takmalıdır? 🎧","a":"Koruyucu kulaklık 🎧","d":["Güneş gözlüğü","Kask"],"exp":"Yüksek sesten kaynaklanan işitme kaybını önlemek için koruyucu kulaklık kullanılır.","spokenText":"Çok gürültülü ortamlarda çalışanlar kulaklarını korumak için ne kullanmalıdır?"},
      {"q":"Yazın güneşin zararlı ultraviyole ışınlarından derimizi korumak için hangisini yapmalıyız? 🧴","a":"Güneş koruyucu krem sürmek ve şapka takmak 🧴","d":["Gözlerimizi kapatmak","Kalın yün kazak giymek"],"exp":"Güneş kremi ve şapka derimizi güneş yanıklarından ve zararlı ışınlardan korur.","spokenText":"Güneşin zararlı ışınlarından derimizi korumak için ne yapmalıyız?"}
    ],

    grade3ScienceForceMotionPool: [
      {"q":"Duran bir futbol topuna ayağımızla vurduğumuzda topa hangi kuvveti uygularız? ⚽","a":"İtme kuvveti ⚽","d":["Çekme kuvveti","Döndürme kuvveti"],"exp":"Bir cismi kendimizden ileriye doğru hareket ettirmek için itme kuvveti uygulanır.","spokenText":"Futbol topuna ayağımızla vurduğumuzda hangi kuvveti uygularız?"},
      {"q":"Masanın çekmecesini kendimize doğru açmak için çekmeceye hangi kuvveti uygularız? 🚪","a":"Çekme kuvveti 🚪","d":["İtme kuvveti","Bükme kuvveti"],"exp":"Bir nesneyi kendimize yaklaştırmak için çekme kuvveti uygularız.","spokenText":"Masa çekmecesini açmak için hangi kuvveti uygularız?"},
      {"q":"Hareket halindeki bir bisikletin frenine bastığımızda bisiklette hangi hareket değişimi gözlenir? 🚲","a":"Yavaşlama ve durma 🛑","d":["Hızlanma","Dönme"],"exp":"Fren sıkıldığında sürtünme kuvveti bisikleti yavaşlatır ve durdurur.","spokenText":"Bisikletin frenine basıldığında hangi hareket gerçekleşir?"},
      {"q":"Pistten havalanmak için kalkışa geçen bir uçak hangi hareketi yapar? 🛫","a":"Hızlanma hareketi 🛫","d":["Yavaşlama hareketi","Sallanma hareketi"],"exp":"Kalkış yapan uçak hızını sürekli artırır, yani hızlanma hareketi yapar.","spokenText":"Kalkışa geçen bir uçak hangi hareketi yapar?"},
      {"q":"Parktaki salıncakta sallanan bir çocuk veya duvar saatinin sarkacı hangi hareketi yapar? 🎠","a":"Sallanma hareketi 🎠","d":["Dönme hareketi","Hızlanma hareketi"],"exp":"İleri ve geri düzenli gidip gelme hareketi sallanmadır.","spokenText":"Salıncakta sallanan bir çocuk hangi hareketi yapar?"},
      {"q":"Dönme dolap, rüzgar türbini pervanesi ve topaç hangi hareketi yapar? 🎡","a":"Dönme hareketi 🔄","d":["Sallanma hareketi","Yavaşlama hareketi"],"exp":"Bir merkez etrafında tur atan varlıklar dönme hareketi yapar.","spokenText":"Dönme dolap ve topaç hangi hareketi yapar?"},
      {"q":"Virajlı bir yolda direksiyonu çeviren şoför arabaya hangi hareket etkisini kazandırır? 🚗","a":"Yön değiştirme hareketi 🚗","d":["Durdurma hareketi","Sallanma hareketi"],"exp":"Viraj dönülürken cismin hareket yönü değişir.","spokenText":"Virajı dönen bir araba hangi hareketi yapar?"},
      {"q":"Raketle gelen tenis topuna vurduğumuzda top hangi hareketi yapar? 🎾","a":"Yön değiştirme ve hızlanma 🎾","d":["Sallanma","Durma"],"exp":"Raket topa ters yönde kuvvet uygulayarak yönünü değiştirir.","spokenText":"Raketle vurulan tenis topunda hangi hareket gözlenir?"},
      {"q":"Oyun hamuruna veya süngere elimizle bastırdığımızda kuvvetin hangi etkisini görürüz? 🧸","a":"Şekil değiştirme etkisi 🧸","d":["Hızlanma etkisi","Dönme etkisi"],"exp":"Kuvvet cisimlerin şeklini değiştirebilir.","spokenText":"Oyun hamuruna bastırdığımızda kuvvetin hangi etkisi görülür?"},
      {"q":"Aşağıdaki durumlardan hangisi HAREKETLİ cisimlerin sebep olabileceği bir TEHLİKEDİR? ⚠️","a":"Dağdan hızla yuvarlanan kar kütlesi (Çığ) ❄️","d":["Rafta duran kitap","Yerde duran top"],"exp":"Hızla hareket eden çığ, kaya ve sel kütleleri büyük tehlike oluşturur.","spokenText":"Hangisi hareketli cisimlerin sebep olabileceği bir tehlikedir?"},
      {"q":"Mıknatısın toplu iğneleri veya demir çivileri kendine çekmesi hangi kuvvet türüdür? 🧲","a":"Temas gerektirmeyen çekme kuvveti 🧲","d":["İtme kuvveti","Sallama kuvveti"],"exp":"Manyetik kuvvet uzaktan dokunmadan çekme kuvveti uygulayabilir.","spokenText":"Mıknatısın demir çivileri çekmesi hangi kuvvettir?"},
      {"q":"Aşağıdakilerden hangisi bir İTME kuvveti örneğidir? 🛒","a":"Markette alışveriş arabasını ileri doğru sürmek 🛒","d":["Kuyudan kova çekmek 🪣","Yerdeki çantayı yukarı kaldırmak 🎒"],"exp":"Arabayı kendimizden uzaklaştırmak itme kuvvetidir.","spokenText":"Hangisi bir itme kuvveti örneğidir?"},
      {"q":"Aşağıdakilerden hangisi bir ÇEKME kuvveti örneğidir? 🪢","a":"Halat çekme oyununda ipi kendine doğru asılmak 🪢","d":["Bebek arabasını itmek 👶","Duvara çivi çakmak 🔨"],"exp":"İpi kendine doğru çekmek çekme kuvvetidir.","spokenText":"Hangisi bir çekme kuvveti örneğidir?"},
      {"q":"Çalışır durumdaki bir vantilatörün pervanesine elimizi yaklaştırmak neden tehlikelidir? 🌀","a":"Hızlı dönen parçalar parmağımızı yaralayabilir ⚠️","d":["Odanın havası bozulur","Vantilatör hemen donar"],"exp":"Hızlı dönen mekanik pervanelere dokunmak ciddi yaralanmalara neden olur.","spokenText":"Çalışan vantilatör pervanesine dokunmak neden tehlikelidir?"},
      {"q":"Futbol maçında kalecinin sert gelen şutu yakalaması kuvvetin hangi etkisine örnektir? 🧤","a":"Hareket eden cismi durdurma etkisi 🧤","d":["Cismi hızlandırma","Cismi döndürme"],"exp":"Kaleci topu yakalayarak hareketini durdurur.","spokenText":"Kalecinin gelen topu yakalaması kuvvetin hangi etkisine örnektir?"}
    ],

    grade3ScienceMatterStatesPool: [
      {"q":"Kuvvet uygulandığında şekli değişen, kuvvet kalktığında ESKİ HALİNE DÖNEN maddelere ne denir? 🧽","a":"Esnek Madde 🧽","d":["Kırılgan Madde","Sert Madde"],"exp":"Sünger ve paket lastiği esnek maddelere örnektir.","spokenText":"Kuvvet kalktığında eski haline dönebilen maddelere ne denir?"},
      {"q":"Darbe aldığında veya yere düştüğünde kolayca parçalanan maddelere ne ad verilir? 🥛","a":"Kırılgan Madde 🥛","d":["Esnek Madde","Pürüzsüz Madde"],"exp":"Cam, porselen ve ayna kırılgan maddelerdir.","spokenText":"Darbe aldığında kolayca parçalanan maddelere ne ad verilir?"},
      {"q":"Aşağıdaki maddelerden hangisi ESNEK bir maddedir? 🎈","a":"Paket lastiği 🎈","d":["Cam bardak 🥛","Tahta cetvel 📏"],"exp":"Paket lastiği çekilip bırakıldığında eski şekline geri döner.","spokenText":"Hangisi esnek bir maddedir?"},
      {"q":"Belirli bir şekli olan ve dışarıdan kuvvet uygulanmadıkça şeklini koruyan maddeler hangi haldedir? 🪨","a":"Katı Madde 🪨","d":["Sıvı Madde 💧","Gaz Madde 💨"],"exp":"Taş, masa, kitap gibi maddeler katıdır ve belirli şekilleri vardır.","spokenText":"Belirli bir şekli olan ve şeklini koruyan maddeler hangi haldedir?"},
      {"q":"Belirli bir şekli olmayan, akışkan olan ve konulduğu KABIN ŞEKLİNİ ALAN maddeler hangi haldedir? 💧","a":"Sıvı Madde 💧","d":["Katı Madde 🪨","Gaz Madde 💨"],"exp":"Su, süt, meyve suyu ve zeytinyağı sıvıdır.","spokenText":"Belirli bir şekli olmayıp akışkan olan maddeler hangi haldedir?"},
      {"q":"Belirli bir şekli olmayıp bulunduğu odanın veya kabın HER YERİNE HIZLA YAYILAN maddeler hangi haldedir? 💨","a":"Gaz Madde 💨","d":["Katı Madde 🪨","Sıvı Madde 💧"],"exp":"Hava, su buharı ve gazlar ortamın tamamına yayılır.","spokenText":"Bulunduğu ortama hızla yayılan maddeler hangi haldedir?"},
      {"q":"Buzluktan çıkarılan buz küpünün oda sıcaklığında suya dönüşmesi hangi hal değişimidir? 🧊➡️💧","a":"Katı halden sıvı hale geçiş (Erime) 💧","d":["Donma","Buharlaşma"],"exp":"Buz ısı alarak erir ve sıvı suya dönüşür.","spokenText":"Buzun eriyerek suya dönüşmesi hangi hal değişimidir?"},
      {"q":"Çaydanlıkta kaynayan suyun buharlaşarak havaya karışması hangi hal değişimidir? 💧➡️💨","a":"Sıvı halden gaz hale geçiş (Buharlaşma) 💨","d":["Donma","Erime"],"exp":"Sıvı su ısı alarak gaz (su buharı) haline geçer.","spokenText":"Suyun buharlaşarak havaya karışması hangi hal değişimidir?"},
      {"q":"Aşağıdaki maddelerden hangisi PÜRÜZSÜZ bir yüzeye sahiptir? 🪞","a":"Cam ayna 🪞","d":["Ağaç kabuğu 🪵","Zımpara kağıdı"],"exp":"Cam ve ayna yüzeyleri kaygan ve son derece pürüzsüzdür.","spokenText":"Hangisi pürüzsüz bir yüzeye sahiptir?"},
      {"q":"Aşağıdaki maddelerden hangisi KOKULU bir maddedir? 🌸","a":"Limon kolonyası 🌸","d":["Saf içme suyu 💧","Demir çivi 🔩"],"exp":"Kolonya etrafa güçlü koku yayan bir maddedir.","spokenText":"Hangisi kokulu bir maddedir?"},
      {"q":"Aşağıdakilerden hangisi BERK (SERT) bir maddedir? 🧱","a":"Tuğla ve demir 🧱","d":["Pamuk yastık ☁️","Yün kazak 🧶"],"exp":"Tuğla ve demir kolay bükülmeyen sert (berk) maddelerdir.","spokenText":"Hangisi sert yani berk bir maddedir?"},
      {"q":"Şişirilmiş bir uçan balonun içindeki madde hangi haldedir? 🎈","a":"Gaz halindedir (Helyum/Hava) 💨","d":["Sıvı halindedir","Katı halindedir"],"exp":"Balonun içini dolduran hava gaz halindedir.","spokenText":"Balonun içindeki hava maddenin hangi halindedir?"},
      {"q":"Kışın donarak göl yüzeyinde oluşan buz tabakası suyun hangi halidir? ❄️","a":"Katı hali ❄️","d":["Sıvı hali","Gaz hali"],"exp":"Buz suyun katılaşmış halidir.","spokenText":"Buz suyun hangi halidir?"},
      {"q":"Tuz, şeker ve un gibi küçük taneli katı maddeler sıvılara hangi yönden BENZER? 🧂","a":"Konuldukları kabın şeklini alabilirler 🧂","d":["Akışkan sıvı olurlar","Uçup odaya yayılırlar"],"exp":"Küçük taneli katılar (tuz, pirinç vb.) kabın şeklini alsalar da taneleri katıdır.","spokenText":"Tuz ve un gibi küçük taneli katılar sıvılara hangi yönden benzer?"},
      {"q":"Evdeki deterjan, çamaşır suyu veya yapıştırıcı gibi kimyasal maddelere ne yapmalıyız? ⚠️","a":"Asla koklamamalı, tatmamalı ve çıplak elle dokunmamalıyız ⚠️","d":["Tadına bakıp anlamalıyız","Koklayarak ayırt etmeliyiz"],"exp":"Bilinmeyen ve kimyasal maddeler zehirlenmeye sebep olabileceği için tehlikelidir.","spokenText":"Deterjan ve çamaşır suyu gibi maddelere karşı nasıl davranmalıyız?"}
    ],

    grade3ScienceLightSoundPool: [
      {"q":"Çevremizdeki varlıkları görebilmemiz için aşağıdakilerden hangisi KESİNLİKLE gereklidir? 💡","a":"Işık 💡","d":["Ses","Rüzgar"],"exp":"Gözümüz ancak cisimlerden yansıyan ışık sayesinde görme olayını gerçekleştirir.","spokenText":"Çevremizdeki varlıkları görebilmemiz için kesinlikle ne gereklidir?"},
      {"q":"Zifiri karanlık, hiçbir ışığın olmadığı bir odada gözlerimiz ne kadar alışırsa alışsın görebilir miyiz? 🌑","a":"Hayır, hiç ışık yoksa asla göremeyiz 🌑","d":["Evet, biraz bekleyince her şeyi görürüz","Sadece beyaz cisimleri görürüz"],"exp":"Görme olayının gerçekleşmesi için ortamda mutlaka en azından az bir ışık bulunmalıdır.","spokenText":"Hiç ışık olmayan zifiri karanlık bir odada görebilir miyiz?"},
      {"q":"İnsanlar tarafından üretilmeyen, doğada kendiliğinden ışık yayan kaynaklara ne denir? ☀️","a":"Doğal Işık Kaynağı ☀️","d":["Yapay Işık Kaynağı 💡","Geçici Işık Kaynağı"],"exp":"Güneş, yıldızlar ve şimşek doğal ışık kaynaklarıdır.","spokenText":"Kendiliğinden ışık yayan doğal kaynaklara ne denir?"},
      {"q":"Gündüzleri Dünya'mızı aydınlatan ve ısıtan EN BÜYÜK DOĞAL ışık kaynağımız hangisidir? ☀️","a":"Güneş ☀️","d":["Ay 🌙","Kutup Yıldızı ⭐"],"exp":"Güneş Dünya'mızın temel doğal ısı ve ışık kaynağıdır.","spokenText":"Dünya'mızı aydınlatan en büyük doğal ışık kaynağı hangisidir?"},
      {"q":"İnsanlar tarafından sonradan üretilen ışık kaynaklarına ne ad verilir? 💡","a":"Yapay Işık Kaynağı 💡","d":["Doğal Işık Kaynağı ☀️","Tükenmez Işık Kaynağı"],"exp":"Ampul, mum, fener, trafik lambası yapay ışık kaynaklarıdır.","spokenText":"İnsanlar tarafından üretilen ışık kaynaklarına ne denir?"},
      {"q":"Aşağıdakilerden hangisi DOĞAL bir ışık kaynağıdır? 🪲","a":"Ateş böceği 🪲","d":["El feneri 🔦","Mum 🕯️"],"exp":"Ateş böceği kendi vücudunda ışık üreten canlı bir doğal ışık kaynağıdır.","spokenText":"Hangisi doğal bir ışık kaynağıdır?"},
      {"q":"Geceleri gökyüzünde parlayan AY bir ışık kaynağı mıdır? 🌙","a":"Hayır, Güneş'ten aldığı ışığı yansıtır 🌙","d":["Evet, doğal ışık kaynağıdır","Evet, yapay ışık kaynağıdır"],"exp":"Ay bir ışık kaynağı değildir; ayna gibi Güneş'ten gelen ışığı yansıtır.","spokenText":"Ay bir ışık kaynağı mıdır?"},
      {"q":"Ses nasıl yayılır? 📢","a":"Suya atılan taş gibi her yöne dalgalar halinde 🌊📢","d":["Sadece dümdüz ileriye doğru","Sadece yukarıya doğru"],"exp":"Ses titreşimlerden oluşur ve kaynaktan her yöne dairesel dalgalar halinde yayılır.","spokenText":"Ses çevremize nasıl yayılır?"},
      {"q":"Aşağıdakilerden hangisi DOĞAL bir ses kaynağıdır? 🐦","a":"Kuş cıvıltısı ve şelale sesi 🐦🌊","d":["Araba kornası 🚗","Flüt sesi 🎶"],"exp":"Canlıların ve doğanın çıkardığı sesler doğal ses kaynaklarıdır.","spokenText":"Hangisi doğal bir ses kaynağıdır?"},
      {"q":"Aşağıdakilerden hangisi YAPAY bir ses kaynağıdır? 🎸","a":"Gitar ve ambulans sireni 🎸🚑","d":["Gök gürültüsü ⚡","Köpek havlaması 🐕"],"exp":"İnsanların ürettiği alet ve araçların sesleri yapay sestir.","spokenText":"Hangisi yapay bir ses kaynağıdır?"},
      {"q":"Bir ses kaynağından UZAKLAŞTIKÇA sesin şiddetinde ne değişir? 📉","a":"Sesin şiddeti azalır (daha az duyulur) 📉","d":["Sesin şiddeti artar","Hiç değişmez"],"exp":"Ses kaynağından uzaklaştıkça ses dalgaları yayılır ve şiddeti azalır.","spokenText":"Ses kaynağından uzaklaştıkça sesin şiddeti nasıl değişir?"},
      {"q":"Kulaklıkla çok yüksek sesle müzik dinlemek hangi organımıza kalıcı zarar verebilir? 🎧","a":"Kulağımıza (İşitme kaybı) 👂","d":["Gözümüze","Burnumuza"],"exp":"Yüksek şiddetteki sesler kulak zarına ve işitme hücrelerine zarar verir.","spokenText":"Yüksek sesle müzik dinlemek hangi organımıza zarar verir?"},
      {"q":"Aşağıdakilerden hangisi ışık kaynağı olmadığı halde üzerine düşen ışığı YANSITAN bir maddedir? 🪞","a":"Trafik reflektörü ve ayna 🪞","d":["Güneş ☀️","Yanan mum 🕯️"],"exp":"Reflektör ve ayna ışık üretmez, gelen ışığı yansıtır.","spokenText":"Hangisi ışık kaynağı olmayıp ışığı yansıtan bir maddedir?"},
      {"q":"Şimşek çakması ve gök gürültüsü sırasında hangisi ÖNCE gözlenir? ⚡","a":"Önce şimşeğin ışığı görülür ⚡ (Işık sesten hızlıdır)","d":["Önce gök gürültüsü duyulur","İkisi aynı anda duyulup görülür"],"exp":"Işık sesten çok daha hızlı yayıldığı için önce şimşeğin ışığını görürüz.","spokenText":"Şimşek çakmasında ışık mı önce gelir yoksa ses mi?"},
      {"q":"Göz sağlığımız için ders çalışırken masa lambası ışığı nereye yönelmelidir? 📖","a":"Doğrudan göze değil, çalışma masasına ve kitaba 📖","d":["Doğrudan gözümüzün içine","Tavana"],"exp":"Işığın doğrudan göze gelmesi gözü kamaştırır ve yorar; kitaba gelmelidir.","spokenText":"Ders çalışırken masa lambası ışığı nereye gelmelidir?"}
    ],

    grade3ScienceLivingEnvironmentPool: [
      {"q":"Aşağıdaki varlıklardan hangisi CANLI bir varlıktır? 🌻","a":"Ayçiçeği bitkisi 🌻","d":["Taş 🪨","Su bardağı 🥛"],"exp":"Bitkiler büyür, beslenir ve çoğalır; canlı varlıklardır.","spokenText":"Aşağıdaki varlıklardan hangisi canlı bir varlıktır?"},
      {"q":"Aşağıdakilerden hangisi CANSIZ bir varlıktır? 🪨","a":"Toprak ve kayaçlar 🪨","d":["Sincap 🐿️","Çam ağacı 🌲"],"exp":"Toprak ve taşlar beslenmez ve büyümez, cansız varlıklardır.","spokenText":"Hangisi cansız bir varlıktır?"},
      {"q":"Aşağıdakilerden hangisi TÜM CANLILARIN ortak özelliklerinden biridir? 🌱","a":"Büyüme, beslenme ve çoğalma 🌱","d":["Uçabilme","Konuşabilme"],"exp":"Büyüme, beslenme, boşaltım, solunum ve çoğalma tüm canlıların ortak özelliğidir.","spokenText":"Hangisi tüm canlıların ortak özelliklerinden biridir?"},
      {"q":"Bitkiler kendi besinlerini üretebilmek için yapraklarıyla neyi kullanırlar? ☀️","a":"Güneş ışığı, su ve karbondioksit ☀️🌿","d":["Meyve suyu","Sadece süt"],"exp":"Bitkiler güneş ışığı yardımıyla fotosentez yaparak kendi besinlerini üretir.","spokenText":"Bitkiler besin üretebilmek için neyi kullanırlar?"},
      {"q":"Bir tohumun çimlenerek filizlenmesi için aşağıdakilerden hangisi ŞARTTIR? 🌱","a":"Su (nem), oksijen (hava) ve uygun sıcaklık 💧🌡️","d":["Sadece karanlık ortam","Aşırı soğuk"],"exp":"Tohumun uyanıp filizlenmesi için su, hava ve uygun sıcaklık şarttır.","spokenText":"Bir tohumun çimlenmesi için hangileri gereklidir?"},
      {"q":"Bir fasulye bitkisinin yaşam döngüsünün DOĞRU sıralanışı hangisidir? 🫘","a":"Tohum ➔ Çimlenme (Filiz) ➔ Genç Bitki ➔ Olgun Bitki (Çiçek/Meyve) 🌸","d":["Meyve ➔ Tohum ➔ Ağaç","Filiz ➔ Tohum ➔ Çiçek"],"exp":"Bitkiler tohumdan çimlenerek genç bitkiye ve çiçek açan olgun bitkiye dönüşür.","spokenText":"Bir bitkinin yaşam döngüsünün doğru sırası nasıldır?"},
      {"q":"İnsan eli değmeden, doğada kendiliğinden oluşmuş alanlara ne ad verilir? 🌲","a":"Doğal Çevre (Orman, Deniz, Göl) 🌲🌊","d":["Yapay Çevre (Park, Akvaryum)","Şehir Çevresi"],"exp":"Ormanlar, dağlar ve denizler doğal çevreye örnektir.","spokenText":"İnsan eli değmeden kendiliğinden oluşmuş ortamlara ne denir?"},
      {"q":"İnsanlar tarafından planlanarak inşa edilen çevrelere ne ad verilir? 🏙️","a":"Yapay Çevre 🏙️","d":["Doğal Çevre","Yaban Hayatı"],"exp":"Şehir parkları, binalar, akvaryumlar ve barajlar yapay çevredir.","spokenText":"İnsanlar tarafından inşa edilen çevrelere ne ad verilir?"},
      {"q":"Aşağıdakilerden hangisi YAPAY bir çevreye örnektir? 🐠","a":"Evdeki balık akvaryumu 🐠","d":["Van Gölü 🌊","Belgrad Ormanı 🌲"],"exp":"Akvaryum ve hayvanat bahçeleri insan yapımı yapay çevredir.","spokenText":"Hangisi yapay bir çevre örneğidir?"},
      {"q":"Doğayı ve çevremizi korumak için aşağıdakilerden hangisini YAPMALIYIZ? ♻️","a":"Atıkları kağıt, cam, plastik olarak geri dönüşüme atmak ♻️","d":["Pilleri ve çöpleri toprağa gömmek","Ağaçları kesmek"],"exp":"Geri dönüşüm doğal kaynakları korur ve çevre kirliliğini önler.","spokenText":"Çevremizi korumak için hangisini yapmalıyız?"},
      {"q":"Bitkiler hayvanlar gibi yer değiştiremeseler de nasıl HAREKET ederler? 🌻","a":"Güneşe doğru yönelerek veya kökleriyle suya uzanarak 🌻","d":["Hiçbir hareket yapamazlar","Geceleri yürürler"],"exp":"Bitkiler güneşe yönelme gibi durum değiştirme hareketleri yaparlar.","spokenText":"Bitkiler nasıl hareket ederler?"},
      {"q":"Canlıların vücutlarındaki zararlı ve atık maddeleri dışarı atmasına ne denir? 💧","a":"Boşaltım (Terleme, yaprak dökümü vb.) 💧","d":["Solunum","Çoğalma"],"exp":"Terleme, idrar ve bitkilerde yaprak dökümü birer boşaltım şeklidir.","spokenText":"Canlıların zararlı atıkları vücutlarından atmasına ne denir?"},
      {"q":"Aşağıdakilerden hangisi DOĞAL bir çevre örneğidir? 🏞️","a":"Karasu Şelalesi ve orman 🏞️","d":["Çocuk oyun parkı 🛝","Alışveriş merkezi 🏬"],"exp":"Şelaleler ve ormanlar doğanın kendiliğinden oluşturduğu alanlardır.","spokenText":"Hangisi doğal bir çevre örneğidir?"},
      {"q":"Küstüm otunun dokunulduğunda yapraklarını kapatması canlıların hangi özelliğidir? 🌿","a":"Uyarılara tepki verme 🌿","d":["Büyüme","Beslenme"],"exp":"Küstüm otu dokunma uyarısına tepki vererek yapraklarını kapatır.","spokenText":"Küstüm otunun dokununca yapraklarını kapatması hangi özelliktir?"},
      {"q":"Ormanların yok edilmesi hangi canlıların yaşamını doğrudan TEHDİT EDER? 🌲🐾","a":"Ormanda yaşayan tüm hayvan ve bitkilerin yaşamını 🐾","d":["Sadece uzaydaki göktaşlarını","Sadece robotları"],"exp":"Ormanlar binlerce hayvan ve bitki türünün doğal yaşam alanıdır.","spokenText":"Ormanların yok edilmesi hangi canlıların yaşamını tehdit eder?"}
    ],

    grade3ScienceElectricitySafetyPool: [
      {"q":"Evimizdeki buzdolabı, çamaşır makinesi ve fırın hangi elektrik kaynağı ile çalışır? 🔌","a":"Şehir elektriği (Priz) 🔌","d":["Küçük pil 🔋","Güneş pili"],"exp":"Yüksek elektrik gücü gerektiren büyük ev aletleri prizdeki şehir elektriğiyle çalışır.","spokenText":"Buzdolabı ve çamaşır makinesi hangi elektrik kaynağıyla çalışır?"},
      {"q":"Duvar saati, televizyon kumandası ve el feneri hangi elektrik kaynağı ile çalışır? 🔋","a":"Pil 🔋","d":["Akü 🚗","Şehir elektriği"],"exp":"Taşınabilir küçük cihazlar düşük voltajlı pillerle çalışır.","spokenText":"Kumanda ve duvar saati hangi elektrik kaynağı ile çalışır?"},
      {"q":"Otomobil, otobüs ve motosikletlerin motorunu çalıştırmak ve farlarını yakmak için ne kullanılır? 🚗","a":"Akü 🚗","d":["İnce kalem pil","Şehir elektriği"],"exp":"Motorlu taşıtların elektrik kaynağı aküdür.","spokenText":"Otomobillerin motorunu ve farlarını çalıştıran elektrik kaynağı nedir?"},
      {"q":"Cep telefonu, tablet ve dizüstü bilgisayarlar hangi elektrik kaynağı ile çalışır? 📱","a":"Batarya (Şarj edilebilir piller) 📱","d":["Akü","Sadece şehir elektriği"],"exp":"Akıllı cihazlar tekrar tekrar şarj edilebilen bataryalarla çalışır.","spokenText":"Cep telefonu ve tabletler hangi elektrik kaynağı ile çalışır?"},
      {"q":"Aşağıdaki araçlardan hangisi ISINMA amacıyla kullanılan bir elektrikli araçtır? ♨️","a":"Elektrikli soba ve ısıtıcı ♨️","d":["Buzdolabı 🧊","Vantilatör 🌀"],"exp":"Elektrikli sobalar elektrik enerjisini ısı enerjisine dönüştürür.","spokenText":"Hangisi ısınma amacıyla kullanılan elektrikli bir araçtır?"},
      {"q":"Aşağıdaki araçlardan hangisi AYDINLATMA amacıyla kullanılan bir elektrikli araçtır? 💡","a":"Masa lambası ve avize 💡","d":["Ütü 👔","Mikser 🥣"],"exp":"Lambalar ve avizeler ortamı aydınlatmak için kullanılır.","spokenText":"Hangisi aydınlatma amacıyla kullanılan bir araçtır?"},
      {"q":"Aşağıdaki araçlardan hangisi TEMİZLİK ve EV İŞLERİNDE kullanılan bir elektrikli araçtır? 🧹","a":"Elektrikli süpürge ve çamaşır makinesi 🧹","d":["Televizyon 📺","Radyo 📻"],"exp":"Süpürge ve çamaşır makinesi ev temizliğinde kullanılan araçlardır.","spokenText":"Hangisi temizlik amacıyla kullanılan bir elektrikli araçtır?"},
      {"q":"Biten atık pilleri çöpe veya toprağa atmak neden ÇOK ZARARLIDIR? ☠️","a":"İçindeki zehirli kimyasallar toprağa ve yer altı sularına karışır ☠️","d":["Hemen patlayarak ses çıkarırlar","Piller hiçbir zarar vermez"],"exp":"Atık piller cıva ve kurşun gibi ağır metaller içerir, toprağı ve suyu zehirler.","spokenText":"Biten pilleri çöpe atmak neden çok zararlıdır?"},
      {"q":"Kullanım ömrü bitmiş atık pilleri nereye atmalıyız? 🗑️","a":"Kırmızı Atık Pil Toplama Kutusuna (TAP) 🪫","d":["Normal çöp tenekesine","Denize veya göle"],"exp":"Atık piller özel atık pil kutularında toplanarak geri dönüştürülmelidir.","spokenText":"Kullanım ömrü bitmiş pilleri nereye atmalıyız?"},
      {"q":"Elektrik prizlerine ve anahtarlarına ISLAK ELLE dokunursak ne olabilir? ⚡","a":"Elektrik çarpabilir çünkü ıslak el elektriği iletir ⚡","d":["Priz hemen bozulur","Hiçbir şey olmaz"],"exp":"Su elektriği ilettiği için ıslak elle dokunmak ölümcül elektrik çarpmasına yol açabilir.","spokenText":"Islak elle elektrik prizlerine dokunursak ne olabilir?"},
      {"q":"Elektrik prizlerine sivri uçlu metal teller veya çiviler sokulması neden tehlikelidir? ⚠️","a":"Elektrik akımı vücudumuza geçip çarpar ⚠️","d":["Prizin rengi solar","Elektrik faturası artar"],"exp":"Metaller elektrik iletkenidir; prize sokulduklarında akım doğrudan insana geçer.","spokenText":"Elektrik prizlerine metal cisim sokmak neden tehlikelidir?"},
      {"q":"Kablosu yıpranmış veya plastik kılıfı soyulmuş bir elektrikli aleti ne yapmalıyız? 🔌","a":"Fişini çekmeli ve yetkili bir tamirciye onartmalıyız 🔌","d":["Kullanmaya devam etmeliyiz","Üzerine su dökmeliyiz"],"exp":"Soyulmuş kablolar yangına ve elektrik çarpmasına sebep olabilir.","spokenText":"Kablosu soyulmuş bir elektrikli aleti görünce ne yapmalıyız?"},
      {"q":"Sokakta kopup yere düşmüş bir elektrik teli gördüğümüzde ilk yapmamız gereken nedir? 🚨","a":"Asla yaklaşmamalı, büyüklerimize ve elektrik arızaya haber vermeliyiz 🚨","d":["Yerden tutup kenara çekmeliyiz","Üzerine basıp geçmeliyiz"],"exp":"Kopuk elektrik tellerinde yüksek gerilim vardır, kesinlikle yaklaşılmamalıdır.","spokenText":"Kopmuş bir elektrik teli gördüğümüzde ne yapmalıyız?"},
      {"q":"Aşağıdaki araçlardan hangisi HABERLEŞME amacıyla kullanılan bir elektrikli alettir? 📱","a":"Televizyon, telefon ve bilgisayar 📱💻","d":["Elektrikli şofben 🚿","Saç kurutma makinesi 💇"],"exp":"Telefon ve bilgisayar bilgi alma ve iletişim araçlarıdır.","spokenText":"Hangisi haberleşme amacıyla kullanılan bir elektrikli araçtır?"},
      {"q":"Elektrikli aletleri prizden çıkarırken kablosundan asılarak değil, nasıl tutarak çekmeliyiz? 🔌","a":"Fişin plastik gövdesinden tutarak çekmeliyiz 🔌","d":["Kablodan sertçe asılmalıyız","Ayağımızla basmalıyız"],"exp":"Kablodan asılmak kablo içindeki telleri koparabilir ve kısa devreye yol açabilir.","spokenText":"Elektrikli aletleri prizden çıkarırken nasıl çekmeliyiz?"}
    ],

    // 3. Sınıf Fen Bilimleri Karma Üreteci (7 Üniteden Dengeli Çekim)
    generateGrade3ScienceKarma() {
      const topic = Math.floor(Math.random() * 7);
      if (topic === 0) return this.drawFromPool(this.grade3SciencePlanetLayersPool, "grade3SciencePlanetLayersPool");
      if (topic === 1) return this.drawFromPool(this.grade3ScienceSensesPool, "grade3ScienceSensesPool");
      if (topic === 2) return this.drawFromPool(this.grade3ScienceForceMotionPool, "grade3ScienceForceMotionPool");
      if (topic === 3) return this.drawFromPool(this.grade3ScienceMatterStatesPool, "grade3ScienceMatterStatesPool");
      if (topic === 4) return this.drawFromPool(this.grade3ScienceLightSoundPool, "grade3ScienceLightSoundPool");
      if (topic === 5) return this.drawFromPool(this.grade3ScienceLivingEnvironmentPool, "grade3ScienceLivingEnvironmentPool");
      return this.drawFromPool(this.grade3ScienceElectricitySafetyPool, "grade3ScienceElectricitySafetyPool");
    },

    // Geriye dönük uyumluluk takma adları
    get grade3EarthSensesPool() {
      return [...this.grade3SciencePlanetLayersPool, ...this.grade3ScienceSensesPool];
    },
    get grade3ForceMatterPool() {
      return [...this.grade3ScienceForceMotionPool, ...this.grade3ScienceMatterStatesPool];
    },

    // -------------------------------------------------------------
    // 3. SINIF: 2026 TÜRKİYE YÜZYILI MAARİF MODELİ HAYAT BİLGİSİ SORU HAVUZLARI
    // (6 Öğrenme Alanı - Okul/Meslek, Ev/Bütçe, Sağlık/Tüketici, Trafik/Güvenlik, Yönetim, Doğa/Yön + TTS)
    // -------------------------------------------------------------

    grade3LifeScienceSchoolProfessionsPool: [
      {"q":"Binaların, evlerin ve köprülerin planını ve projesini çizen meslek hangisidir? 🏛️","a":"Mimar 🏛️","d":["Doktor 🩺","Aşçı 👨‍🍳"],"exp":"Mimarlar güvenli, estetik ve kullanışlı yapıların plan ve projelerini çizerler.","spokenText":"Binaların ve evlerin plan ve projesini çizen meslek hangisidir?"},
      {"q":"Bir yerin KUŞ BAKIŞI (tam üstten) görünüşünün ölçeksiz, kaba taslak çizimine ne denir? 📐","a":"Kroki 🗺️","d":["Harita","Plan"],"exp":"Ölçeksiz, kaba taslak kuş bakışı çizimlere kroki denir.","spokenText":"Bir yerin kuş bakışı görünüşünün kaba taslak çizimine ne denir?"},
      {"q":"Sınıfımızın krokisini çizerken sıraları, öğretmen masasını ve kapıyı göstermek için ne kullanırız? 🏷️","a":"Basit geometrik şekiller ve semboller 🏷️","d":["Büyük ve renkli fotoğraflar","Gerçek boyutlu çizimler"],"exp":"Krokilerde eşyalar ve mekanlar semboller ve geometrik çizimlerle temsil edilir.","spokenText":"Sınıf krokisi çizerken eşyaları göstermek için ne kullanırız?"},
      {"q":"Kedi, köpek, koyun ve inek gibi hayvanların hastalıklarını tedavi eden ve aşılarını yapan meslek hangisidir? 🐾","a":"Veteriner 🐾","d":["Mimar","Eczacı"],"exp":"Veteriner hekimler hayvan sağlığı ve tedavisiyle ilgilenen uzmanlardır.","spokenText":"Hayvanların hastalıklarını tedavi eden meslek hangisidir?"},
      {"q":"Yangınları söndüren, sel ve kaza gibi afetlerde can kurtaran fedakar meslek çalışanları kimlerdir? 🚒","a":"İtfaiyeci 🚒","d":["Kütüphaneci","Terzi"],"exp":"İtfaiyeciler yangın söndürme ve acil kurtarma görevlerini yürütürler.","spokenText":"Yangınları söndüren ve afetlerde can kurtaran meslek hangisidir?"},
      {"q":"Arkadaşımızın sahip olduğu bir başarıyı veya güzel bir davranışını görünce ne yapmalıyız? 👏","a":"Onu içtenlikle tebrik etmeli ve takdir etmeliyiz 👏","d":["Onu kıskanıp küsmeliyiz","Görmezden gelmeliyiz"],"exp":"Arkadaşlarımızın başarısını tebrik etmek arkadaşlık bağlarını güçlendirir.","spokenText":"Arkadaşımızın bir başarısını görünce nasıl davranmalıyız?"},
      {"q":"Okulda bir sorun yaşadığımızda veya bir istekte bulunmak istediğimizde bunu nasıl ifade etmeliyiz? 🗳️","a":"Dilek kutusunu kullanarak veya öğretmenimizle nezaketle konuşarak 🗳️","d":["Bağırıp öfkelenerek","Eşyalara zarar vererek"],"exp":"Demokratik ortamlarda istek ve şikayetler nezaketle ve dilek kutusu yoluyla iletilir.","spokenText":"Okulda istek veya şikayetlerimizi nasıl ifade etmeliyiz?"},
      {"q":"Tarlalarda toprağı işleyen, sebze ve meyveleri yetiştirerek soframıza ulaştıran meslek hangisidir? 🌾","a":"Çiftçi 🌾","d":["Mühendis","Avukat"],"exp":"Çiftçiler tarımsal üretim yaparak besinlerimizi yetiştirirler.","spokenText":"Sebze ve meyveleri yetiştiren meslek hangisidir?"},
      {"q":"Grup ve takım çalışmalarında başarılı olmak için en çok hangisine ihtiyaç duyarız? 🤝","a":"İş birliği, saygı ve dayanışmaya 🤝","d":["Sadece kendi dediğini yaptırmaya","Görev almaktan kaçınmaya"],"exp":"Grup çalışmalarında iş birliği ve görev paylaşımı başarıyı getirir.","spokenText":"Grup çalışmalarında başarılı olmak için neye ihtiyaç duyarız?"},
      {"q":"Hak ve adaleti savunarak mahkemelerde insanları savunan meslek hangisidir? ⚖️","a":"Avukat ⚖️","d":["Mimar","Kaptan"],"exp":"Avukatlar adalet önünde kişi haklarını savunurlar.","spokenText":"Mahkemelerde insanları savunan meslek hangisidir?"},
      {"q":"Okulumuzdaki Kızılay kulübünün temel amacı nedir? 🩸","a":"Yardımlaşma, dayanışma ve afet bilinci geliştirmek 🤝","d":["Sadece spor müsabakaları yapmak","Kitap satmak"],"exp":"Kızılay kulübü öğrencilere yardımlaşma ve acil durumlarda destek olma bilinci aşılar.","spokenText":"Okuldaki Kızılay kulübünün temel amacı nedir?"},
      {"q":"Bir arkadaşımızın sırrını başkalarına anlatmak arkadaşlık ilişkilerini nasıl etkiler? 💔","a":"Güveni kırar ve arkadaşlığa zarar verir 💔","d":["Arkadaşlığı çok güçlendirir","Hiçbir etkisi olmaz"],"exp":"Arkadaşlıkta dürüstlük ve sır tutma güvenin temelidir.","spokenText":"Arkadaşımızın sırrını başkasına söylemek arkadaşlığı nasıl etkiler?"},
      {"q":"Kendimizin geliştirmesi gereken yönlerini fark edip çalışmak bize ne kazandırır? 📈","a":"Daha başarılı ve öz güvenli olmamızı sağlar 🌟","d":["Üzülüp ders çalışmayı bırakmamızı sağlar","Zaman kaybettirir"],"exp":"Eksiklerimizi bilip üzerinde çalışmak kişisel gelişimimizi sağlar.","spokenText":"Geliştirmemiz gereken yönlerimizi fark etmek bize ne kazandırır?"},
      {"q":"Yol, köprü, baraj, makine ve bilgisayar yazılımları tasarlayan meslek hangisidir? 💻","a":"Mühendis 💻","d":["Aşçı","Berber"],"exp":"Mühendisler teknik projeler ve yeni teknolojiler üretirler.","spokenText":"Köprü, makine ve yazılımlar tasarlayan meslek hangisidir?"},
      {"q":"Okul kurallarına uymak okulumuzda neyi sağlar? 🏫","a":"Huzurlu, adil ve güvenli bir öğrenme ortamı 🛡️","d":["Derslerin çok sıkıcı olmasını","Teneffüslerin iptal edilmesini"],"exp":"Kurallar herkesin güvenli ve huzurlu bir ortamda eğitim almasını sağlar.","spokenText":"Okul kurallarına uymak neyi sağlar?"}
    ],

    grade3LifeScienceHomeBudgetPool: [
      {"q":"Geçmişte büyüklerimizin oynadığı geleneksel sokak oyunlarına hangisi örnektir? 🎲","a":"Seksek, saklambaç ve çelik çomak 🎲","d":["Tablet video oyunları","Sanal gerçeklik oyunları"],"exp":"Seksek, saklambaç, körebe ve çelik çomak geçmişten gelen geleneksel oyunlarımızdır.","spokenText":"Büyüklerimizin çocukken oynadığı geleneksel oyunlara hangisi örnektir?"},
      {"q":"\"Komşu komşunun külüne muhtaçtır\" atasözü hangi önemli değeri vurgular? 🏡","a":"Komşuluk dayanışması ve yardımlaşmasını 🤝","d":["Cimrilik yapmayı","Kimseyle konuşmamayı"],"exp":"Komşular en zor anlarda birbirlerinin yardımına koşar.","spokenText":"Komşu komşunun külüne muhtaçtır atasözü neyi vurgular?"},
      {"q":"Aşağıdakilerden hangisi evde üzerimize düşen sorumluluklardan biridir? 🛏️","a":"Odamızı toplamak ve yatağımızı düzeltmek 🛏️","d":["Bütün gün televizyon izlemek","Çöpleri odanın ortasına atmak"],"exp":"Odamızı ve çalışma masamızı düzenli tutmak kendi sorumluluğumuzdur.","spokenText":"Evde üzerimize düşen sorumluluklardan biri hangisidir?"},
      {"q":"Evdeki su ve elektrik gibi kaynakları tasarruflu kullanmak için hangisini yapmalıyız? 💡","a":"Diş fırçalarken musluğu kapatmak ve gereksiz lambaları söndürmek 💡","d":["Musluğu sonuna kadar açık bırakmak","Bütün odaların ışıklarını açık tutmak"],"exp":"Gereksiz tüketimi önlemek kaynaklarımızı korur ve aile bütçesine katkı sağlar.","spokenText":"Evdeki kaynakları tasarruflu kullanmak için ne yapmalıyız?"},
      {"q":"Günlük ve haftalık plan yapmanın bize en büyük faydası nedir? ⏰","a":"Zamanımızı verimli kullanmak ve derslerimize, oyunumuza vakit ayırmak ⏰","d":["Bizi çok yorması","Oyun oynamayı tamamen yasaklaması"],"exp":"Planlı yaşamak işlerimizi zamanında bitirip dinlenmemize olanak tanır.","spokenText":"Günlük ve haftalık plan yapmanın en büyük faydası nedir?"},
      {"q":"Aile bütçemizi korumak için alışveriş yaparken hangisine ÖNCELİK vermeliyiz? 🛒","a":"Temel ihtiyaçlarımıza (Beslenme, sağlık vb.) 🍞","d":["Pahalı oyuncaklara ve isteklere","Sadece süs eşyalarına"],"exp":"Alışverişte her zaman ihtiyaçlar isteklere göre önceliklidir.","spokenText":"Aile bütçesini korumak için hangisine öncelik vermeliyiz?"},
      {"q":"Harçlıklarımızın bir kısmını kumbaraya atmak bize hangi alışkanlığı kazandırır? 🪙","a":"Tasarruf yapma ve birikim bilincini 🪙","d":["İsraf yapmayı","Borçlanmayı"],"exp":"Düzenli para biriktirmek gelecekteki hedeflerimiz için tasarruf bilinci kazandırır.","spokenText":"Harçlığımızın bir kısmını kumbarada biriktirmek bize ne kazandırır?"},
      {"q":"Apartmanda yaşarken komşularımızı rahatsız etmemek için hangisine dikkat etmeliyiz? 🔇","a":"Geç saatlerde yüksek ses çıkarmamak ve gürültü yapmamak 🔇","d":["Merdivenlerde koşup bağırmak","Kapı önlerine çöp yığmak"],"exp":"Ortak yaşam alanlarında gürültü yapmamak komşuluk hakkına saygıdır.","spokenText":"Komşularımızı rahatsız etmemek için neye dikkat etmeliyiz?"},
      {"q":"Evde artan bayat ekmekleri çöpe atmak yerine ne yapabiliriz? 🥖","a":"Yumurta veya köfte harcında kullanarak değerlendirebiliriz 🥖","d":["Hemen çöpe fırlatmalıyız","Balkondan aşağı saçmalıyız"],"exp":"Bayat ekmekleri yemeklerde değerlendirmek ekmek israfını önler.","spokenText":"Bayat ekmekleri israf etmemek için ne yapabiliriz?"},
      {"q":"Geçmişte uzaktaki akrabalarla iletişim mektupla sağlanırken, günümüzde nasıl sağlanmaktadır? 📱","a":"Akıllı telefon ve görüntülü internet aramalarıyla 📱","d":["Sadece dumanla","Güvercinlerle"],"exp":"Teknolojinin gelişmesiyle anlık ve görüntülü iletişim yaygınlaşmıştır.","spokenText":"Günümüzde uzaktaki yakınlarımızla iletişim en çok nasıl sağlanır?"},
      {"q":"Evimizin bulunduğu yeri tarif etmek ve bulmayı kolaylaştırmak için ne çizebiliriz? 🗺️","a":"Kroki 🗺️","d":["Portre resmi","Karikatür"],"exp":"Evimizin çevresini kuş bakışı gösteren basit bir kroki yön bulmayı kolaylaştırır.","spokenText":"Evimizin yerini tarif etmek için ne çizebiliriz?"},
      {"q":"Aşağıdakilerden hangisi bir İSTEK değil, yaşamsal bir İHTİYAÇTIR? 💧","a":"Temiz içme suyu ve kışlık mont 💧🧥","d":["En son model akıllı saat ⌚","Video oyun konsolu 🎮"],"exp":"Su ve giyinme yaşamak için zorunlu temel ihtiyaçtır.","spokenText":"Hangisi yaşamsal bir temel ihtiyaçtır?"},
      {"q":"Soğuk kış günlerinde evdeki ısı kaybını önlemek ve doğalgazdan tasarruf etmek için ne yapılmalıdır? 🌡️","a":"Kapı ve pencerelerin yalıtımına dikkat edilmelidir 🏠","d":["Kombi sonuna kadar açıkken pencereler açılmalıdır","Peteklerin üzeri kalın örtülerle kapatılmalıdır"],"exp":"Isı yalıtımı yakıt tasarrufu sağlar ve evi sıcak tutar.","spokenText":"Kışın doğalgazdan tasarruf etmek için ne yapılmalıdır?"},
      {"q":"Aile bireyleri arasında kararlar alınırken hangisi demokratik bir tutumdur? 👨‍👩‍👧","a":"Bütün aile üyelerinin fikrini dinleyip ortak karar almak 🤝","d":["Sadece bir kişinin istediğini zorla yaptırması","Kimsenin fikrini sormamak"],"exp":"Aile meclisinde herkesin düşüncesini dinlemek demokratik ve sevgi dolu bir tutumdur.","spokenText":"Ailede karar alınırken hangi tutum demokratiktir?"},
      {"q":"Kullanılmayan cep telefonu şarj aletini prizde takılı bırakmak neye sebep olur? ⚡","a":"Gereksiz elektrik tüketimine ve güvenlik riskine ⚡","d":["Telefonun kendi kendine şarj olmasına","Elektrik faturasının düşmesine"],"exp":"Prizde unutulan adaptörler az da olsa elektrik harcamaya devam eder.","spokenText":"Şarj aletini prizde takılı bırakmak neye yol açar?"}
    ],

    grade3LifeScienceHealthConsumerPool: [
      {"q":"Marketten süt, yoğurt veya peynir alırken paket üzerinde İLK ÖNCE nereye bakmalıyız? 🥛","a":"Son Kullanma Tarihine (SKT) 📅","d":["Paketin resmine","Fiyat etiketinin rengine"],"exp":"Tarihi geçmiş süt ürünleri tüketildiğinde ciddi gıda zehirlenmesine yol açabilir.","spokenText":"Paketli yiyecek alırken ilk önce nereye bakmalıyız?"},
      {"q":"Satın aldığımız ürünlerin üzerinde \"TSE\" damgasının bulunması neyi kanıtlar? 🛡️","a":"Ürünün Türk Standartlarına uygun, kaliteli ve güvenli olduğunu 🛡️","d":["Ürünün bedava olduğunu","Yurt dışından ithal geldiğini"],"exp":"TSE (Türk Standartları Enstitüsü) damgası ürünün sağlık ve kalite denetiminden geçtiğini gösterir.","spokenText":"Ürünün üzerindeki TSE damgası ne anlama gelir?"},
      {"q":"Alışveriş yaptıktan sonra satıcıdan mutlaka neyi istemeli ve saklamalıyız? 🧾","a":"Fiş veya Faturayı 🧾","d":["Fazladan poşet","Şekerleme"],"exp":"Fiş ve fatura alışveriş belgesidir; ayıplı mal iadesinde kanıttır ve vergi geliri sağlar.","spokenText":"Alışveriş yaptıktan sonra satıcıdan mutlaka ne istemeliyiz?"},
      {"q":"Satın aldığımız ayakkabı veya oyuncak bozuk/defolu çıktığında ne yapmalıyız? 📦","a":"Faturamız veya fişimizle birlikte mağazaya gidip değişim istemeliyiz 🧾","d":["Hemen çöpe atmalıyız","Hiçbir şey yapmamalıyız"],"exp":"Bilinçli tüketici hakkını arar ve alışveriş fişiyle ürünü iade veya değişim ettirir.","spokenText":"Satın aldığımız ürün ayıplı çıkarsa ne yapmalıyız?"},
      {"q":"Tüketici hakları konusunda destek almak ve şikayette bulunmak için hangi hattı ararız? 📞","a":"ALO 175 Tüketici Danışma Hattı 📞","d":["ALO 112","ALO 182"],"exp":"ALO 175 Tüketici Danışma Hattı haklarımızı korumada yardımcı olur.","spokenText":"Tüketici hakları danışma hattı numarası kaçtır?"},
      {"q":"Kış mevsiminde sağlığımızı ve bağışıklığımızı korumak için hangi meyve ve sebzeleri tüketmeliyiz? 🍊","a":"Portakal, mandalina, kivi, ıspanak ve lahana 🍊🥦","d":["Karpuz, kavun ve şeftali 🍉","Dondurma ve buzlu içecekler"],"exp":"C vitamini deposu olan narenciye ve kış sebzeleri mevsiminde tüketilmelidir.","spokenText":"Kışın bağışıklığımızı güçlendirmek için hangi meyveleri yemeliyiz?"},
      {"q":"Günde en az iki kez dişlerimizi fırçalamak hangi sağlık sorununu önler? 🦷","a":"Diş çürüklerini ve diş eti hastalıklarını 🦷","d":["Saç dökülmesini","Göz yorgunluğunu"],"exp":"Düzenli diş fırçalamak plak oluşumunu ve çürükleri engeller.","spokenText":"Düzenli diş fırçalamak neyi önler?"},
      {"q":"Aşırı şekerli, yağlı ve hazır (fast-food) yiyeceklerle beslenmek hangi sağlık sorununa yol açar? 🍔","a":"Obezite ve kalp-damar rahatsızlıklarına ⚠️","d":["Boyun çok hızlı uzamasına","Dişlerin parlamasına"],"exp":"Dengesiz ve aşırı kalorili beslenme obeziteye sebep olur.","spokenText":"Aşırı yağlı ve hazır gıdalarla beslenmek hangi soruna yol açar?"},
      {"q":"Okul tuvaletleri ve parklar gibi ortak kullanım alanlarında hijyeni sağlamak için ne yapmalıyız? 🧼","a":"Sifonu çekmeli, çöpleri kutuya atmalı ve ellerimizi sabunla yıkamalıyız 🧼","d":["Suyu sürekli açık bırakmalıyız","Yere çöp atmalıyız"],"exp":"Ortak alanları temiz kullanmak bulaşıcı hastalıkların yayılmasını önler.","spokenText":"Okul tuvaleti gibi ortak alanlarda hijyen için ne yapmalıyız?"},
      {"q":"Tırnak temizliği ve bakımında el tırnakları ve ayak tırnakları nasıl kesilmelidir? ✂️","a":"El tırnakları kavisli (yuvarlak), ayak tırnakları düz kesilmelidir ✂️","d":["Hepsi sivri kesilmelidir","Hiç kesilmemelidir"],"exp":"Tırnak batmasını önlemek için ayak tırnakları düz kesilmelidir.","spokenText":"Tırnak keserken el ve ayak tırnakları nasıl kesilmelidir?"},
      {"q":"Konserve kutusunun kapağı şişmiş veya ambalajı delinmiş bir yiyeceği ne yapmalıyız? 🥫","a":"Asla satın almamalı ve yememeliyiz, bozulmuş olabilir ⚠️","d":["Pişirip hemen yemeliyiz","Tadına bakıp karar vermeliyiz"],"exp":"Kapağı şişmiş konservelerde ölümcül zehirli bakteriler üremiş olabilir.","spokenText":"Kapağı şişmiş bir konservede ne yapılmalıdır?"},
      {"q":"Vücudumuzun sağlıklı gelişmesi için günde kaç saat düzenli uyumalıyız? 🛌","a":"9 - 10 saat 🛌","d":["3 - 4 saat","15 - 16 saat"],"exp":"Büyüme hormonları uykuda salgılanır, 3. sınıf çocukları için 9-10 saat uyku gereklidir.","spokenText":"İlkokul çağındaki çocuklar günde kaç saat uyumalıdır?"},
      {"q":"Gıda ürünlerinin arkasındaki \"İçindekiler\" bölümünü okumak özellikle kimler için hayatidir? 🔍","a":"Besin alerjisi olan bireyler için ⚠️","d":["Sadece market sahipleri için","Hiç kimse için gerekmez"],"exp":"Fındık, süt, gluten alerjisi olanlar içerik etiketini mutlaka kontrol etmelidir.","spokenText":"İçindekiler bölümünü okumak özellikle kimler için çok önemlidir?"},
      {"q":"Yemek yemeden önce ve tuvaletten çıktıktan sonra ellerimizi en az kaç saniye sabunlamalıyız? 🧼","a":"En az 20 saniye bol su ve sabunla 🧼","d":["Sadece 2 saniye su değdirerek","Sabun kullanmadan"],"exp":"Mikropların ölmesi için eller 20 saniye boyunca parmak aralarıyla birlikte sabunlanmalıdır.","spokenText":"Ellerimizi sabunla en az kaç saniye yıkamalıyız?"},
      {"q":"Yemek israfını önlemek için tabağımıza ne kadar yemek almalıyız? 🍽️","a":"Yiyebileceğimiz kadar 🍽️","d":["Tabağı tepeleme doldurmalıyız","Yarısını dökecek kadar almalıyız"],"exp":"Tabağa yiyebileceğimiz kadar yemek almak besin israfını önler.","spokenText":"Yemek israfını önlemek için tabağımıza ne kadar yemek almalıyız?"}
    ],

    grade3LifeScienceSafetyTrafficPool: [
      {"q":"Mavi zemin üzerinde el ele tutuşan iki çocuk figürü olan trafik levhası neyi bildirir? 🚸","a":"Okul Geçidini 🚸","d":["Bisiklet Giremez","Otoyol Başlangıcı"],"exp":"Bu levha okul geçidini gösterir; sürücüler yavaşlamalı, yayalara yol vermelidir.","spokenText":"İki çocuk figürü bulunan trafik levhası neyi bildirir?"},
      {"q":"Kırmızı üçgen veya daire içinde bisiklet resmi olan ve üzerinde kırmızı çizgi bulunan levha nedir? 🚫🚲","a":"Bisiklet Giremez 🚫","d":["Bisiklet Yolu","Mecburi Bisiklet Yolu"],"exp":"Kırmızı yasaklama levhaları o yola bisikletin giremeyeceğini bildirir.","spokenText":"Üzerinde kırmızı çizgi olan bisiklet levhası neyi bildirir?"},
      {"q":"Karşıdan karşıya geçerken trafik lambası yoksa en güvenli yer neresidir? 🦓","a":"Yaya geçidi, alt geçit veya üst geçit 🦓","d":["Virajlı ve dar yollar","Arabaların hızla geçtiği yerler"],"exp":"Yaya geçitleri, alt ve üst geçitler yayalar için en güvenli noktalardır.","spokenText":"Trafik lambası olmayan yollarda en güvenli geçiş yerleri nerelerdir?"},
      {"q":"Karşıdan karşıya geçerken adımlarımızı nasıl kontrol etmeliyiz? 👀","a":"Önce sola, sonra sağa, tekrar sola bakıp hızlı adımlarla geçmeliyiz 👀","d":["Koşarak gözümüz kapalı geçmeliyiz","Sadece sağa bakmalıyız"],"exp":"Trafik kuralına göre: Sol ➔ Sağ ➔ Sol kontrol edilip dikkatlice geçilir.","spokenText":"Karşıdan karşıya geçerken sırasıyla nereye bakmalıyız?"},
      {"q":"Otomobilde seyahat ederken arka koltukta otursak bile mutlaka ne takmalıyız? 🚗","a":"Emniyet kemeri 🛡️","d":["Kask","Güneş gözlüğü"],"exp":"Emniyet kemeri olası kaza anında fırlamayı ve yaralanmayı önler.","spokenText":"Otomobilde seyahat ederken mutlaka ne takmalıyız?"},
      {"q":"Ülkemizde ambulans, itfaiye, polis ve jandarma gibi tüm acil durumlar için aranan TEK numara kaçtır? 🚨","a":"112 Acil Çağrı Merkezi 🚨","d":["155","110"],"exp":"Türkiye'de tüm acil yardım hatları 112 numarası altında birleştirilmiştir.","spokenText":"Tüm acil durumlar için aranan tek numara kaçtır?"},
      {"q":"Deprem sarsıntısı başladığında sınıfta veya evde yapmamız gereken EN DOĞRU hareket nedir? 🛡️","a":"Çök - Kapan - Tutun pozisyonu almak 🛡️","d":["Merdivenlere koşmak ve asansöre binmek","Pencereden dışarı atlamak"],"exp":"Sağlam bir eşyanın yanında Çök-Kapan-Tutun yaparak başımızı korumalıyız.","spokenText":"Deprem anında yapmamız gereken en doğru hareket nedir?"},
      {"q":"Yangın anında odada duman varsa dışarı çıkarken nasıl hareket etmeliyiz? 🌫️","a":"Ağzımızı ıslak mendille kapatıp yer seviyesinde eğilerek/emekleyerek 🌫️","d":["Ayakta dikilerek derin derin nefes almalıyız","Dolabın içine saklanmalıyız"],"exp":"Duman ve zehirli gazlar tavana yükselir; tabanda temiz hava bulunur.","spokenText":"Dumanlı bir ortamda yangından kaçarken nasıl ilerlemeliyiz?"},
      {"q":"Parkta veya sokakta tanımadığımız bir yabancı bize çikolata verip arabasına binmemizi söylerse ne yapmalıyız? 🛑","a":"Asla kabul etmemeli, yüksek sesle \"HAYIR!\" deyip güvenli yere koşmalıyız 🛑","d":["Hemen arabasına binmeliyiz","Çikolatayı alıp teşekkür etmeliyiz"],"exp":"Tanımadığımız kişilerin tekliflerini reddetmeli ve hemen büyüklerimizden yardım istemeliyiz.","spokenText":"Yabancı biri arabasına binmemizi isterse ne yapmalıyız?"},
      {"q":"Okul koridorlarında ve merdivenlerde hızla koşmak ne tür kazalara yol açabilir? ⚠️","a":"Çarpışma, düşme ve kırık-çıkık yaralanmalarına ⚠️","d":["Dersleri daha erken bitirmeye","Sağlığımızın güçlenmesine"],"exp":"Koridorlarda koşmak diğer arkadaşlarımıza çarpmamıza ve yaralanmalara neden olur.","spokenText":"Okul merdivenlerinde koşmak ne tür tehlikelere yol açar?"},
      {"q":"Evde temizlik maddeleri ve ilaçlar nerede saklanmalıdır? 🔒","a":"Çocukların ulaşamayacağı kilitli ve yüksek dolaplarda 🔒","d":["Mutfak masasının üzerinde","Oyuncak sepetinde"],"exp":"Zehirlenme kazalarını önlemek için ilaç ve deterjanlar kilitli tutulmalıdır.","spokenText":"İlaç ve temizlik maddeleri nerede saklanmalıdır?"},
      {"q":"Deprem sonrasında binayı terk ederken asansörü kullanmak neden TEHLİKELİDİR? 🛗","a":"Elektrikler kesilebilir ve asansör boşluğunda mahsur kalınabilir 🛗","d":["Asansör çok yavaş iner","Asansör ücretlidir"],"exp":"Afet anlarında asansörler asla kullanılmaz, merdivenler tercih edilir.","spokenText":"Depremde asansör kullanmak neden tehlikelidir?"},
      {"q":"Gece yürüyüş yaparken sürücülerin bizi uzaktan fark edebilmesi için nasıl giyinmeliyiz? 🦺","a":"Açık renkli veya reflektörlü (parlayan) kıyafetler 🦺","d":["Tamamen kapkara kıyafetler","Gözlük takarak"],"exp":"Açık renk ve reflektörlü giysiler araç farı altında parlayarak fark edilmeyi sağlar.","spokenText":"Gece yürürken sürücülerin bizi görmesi için nasıl giyinmeliyiz?"},
      {"q":"112 Acil Çağrı Merkezini gereksiz yere arayıp meşgul etmek neden suçtur ve yanlıştır? 🚨","a":"Gerçekten ölüm kalım savaşı veren hastaların yardım almasını engeller 🚨","d":["Telefon faturasını artırır","Sadece komik olduğu için"],"exp":"112 hayati bir hattır; meşgul etmek başkalarının hayatına mal olabilir.","spokenText":"112 acil hattını meşgul etmek neden çok yanlıştır?"},
      {"q":"Sıcak ütüye, fırına veya kaynayan çaydanlığa dokunmak hangi kazaya yol açar? 🔥","a":"Ciltte ağır yanıklara 🔥","d":["Elektrik çarpmasına","Zehirlenmeye"],"exp":"Sıcak yüzeylerle temas derin cilt yanıklarına sebep olur.","spokenText":"Sıcak çaydanlık veya ütüye dokunmak neye yol açar?"}
    ],

    grade3LifeScienceCountryLeadersPool: [
      {"q":"İlimizdeki en yetkili mülki amir olan ve devleti ilde temsil eden yönetici kimdir? 🏛️","a":"Vali 🏛️","d":["Muhtar","Kaymakam"],"exp":"İlleri vali yönetir; vali devlet (Cumhurbaşkanı) tarafından atanır.","spokenText":"İldeki en yetkili yönetici kimdir?"},
      {"q":"İlçemizdeki en yetkili devlet yöneticisi (mülki idare amiri) kimdir? 🏢","a":"Kaymakam 🏢","d":["Vali","Bakan"],"exp":"İlçelerin yönetiminden kaymakam sorumludur.","spokenText":"İlçedeki en yetkili devlet yöneticisi kimdir?"},
      {"q":"Köy veya mahallemizde halkın oylarıyla seçilen yerel yönetici kimdir? 🗳️","a":"Muhtar 🗳️","d":["Kaymakam","Vali"],"exp":"Köy ve mahalleleri seçimle göreve gelen muhtarlar yönetir.","spokenText":"Mahalle veya köyde seçimle iş başına gelen yönetici kimdir?"},
      {"q":"Şehrimizde yol, temizlik, su, park ve ulaşım gibi belediye hizmetlerini yürüten yönetici kimdir? 🚍","a":"Belediye Başkanı 🚍","d":["Emniyet Müdürü","Okul Müdürü"],"exp":"Belediye başkanları halk tarafından seçilir ve çevre/altyapı hizmetlerini yürütür.","spokenText":"Şehirdeki temizlik, yol ve su hizmetlerini hangi yönetici yürütür?"},
      {"q":"Halkın kendi yöneticilerini seçim yoluyla kendisinin belirlediği yönetim şekline ne denir? 🇹🇷","a":"Cumhuriyet 🇹🇷","d":["Krallık","Monarşi"],"exp":"Cumhuriyet milli egemenliğe dayanan, halkın kendi kendini yönettiği rejimdir.","spokenText":"Halkın yöneticilerini kendisinin seçtiği yönetim şekline ne denir?"},
      {"q":"İstiklal Marşı'mızın yazarı, vatan şairimiz kimdir? 📜","a":"Mehmet Akif Ersoy 📜","d":["Nazım Hikmet","Yahya Kemal"],"exp":"Mehmet Akif Ersoy Kurtuluş Savaşı'nda milletimize İstiklal Marşı'nı hediye etmiştir.","spokenText":"İstiklal Marşı'mızın yazarı milli şairimiz kimdir?"},
      {"q":"Türkiye'nin ilk yerli uçağını tasarlayıp üreten, ilk sivil havacılık okulunu kuran kahraman pilotumuz kimdir? ✈️","a":"Vecihi Hürkuş ✈️","d":["Nuri Demirağ","Hezarfen Ahmet Çelebi"],"exp":"Vecihi Hürkuş Türk havacılık tarihinin en önemli öncülerindendir.","spokenText":"Türkiye'nin ilk sivil uçağını tasarlayan ünlü havacımız kimdir?"},
      {"q":"DNA onarımı alanındaki üstün başarılarıyla Nobel Kimya Ödülü'nü kazanan Türk bilim insanı kimdir? 🧪","a":"Prof. Dr. Aziz Sancar 🧪","d":["Cahit Arf","Oktay Sinanoğlu"],"exp":"Aziz Sancar 2015 Nobel Kimya Ödülü'nü kazanarak ülkemizi gururlandırmıştır.","spokenText":"Nobel Kimya Ödülü'nü kazanan dünyaca ünlü Türk bilim insanımız kimdir?"},
      {"q":"Olimpiyatlarda kendi ağırlığının 3 katından fazlasını kaldırarak rekorlar kıran efsane haltercimiz (\"Cep Herkülü\") kimdir? 🏋️‍♂️","a":"Naim Süleymanoğlu 🏋️‍♂️","d":["Halil Mutlu","Rıza Kayaalp"],"exp":"Naim Süleymanoğlu dünya ve olimpiyat şampiyonu efsanevi sporcumuzdur.","spokenText":"Cep Herkülü lakaplı dünya rekortmeni efsane haltercimiz kimdir?"},
      {"q":"Türkiye'nin ilk kadın arkeoloğu olup Perge ve Side antik kentlerini gün ışığına çıkaran öncümüz kimdir? 🏺","a":"Jale İnan 🏺","d":["Afet İnan","Halet Çambel"],"exp":"Prof. Dr. Jale İnan tarihi eserlerimizin korunması ve kazılmasında büyük öncüdür.","spokenText":"Türkiye'nin ilk kadın arkeoloğu kimdir?"},
      {"q":"Rize ve Karadeniz bölgesinde çay tarımını başlatıp geliştiren, \"Çayın Babası\" olarak bilinen ziraatçı kimdir? 🍵","a":"Zihni Derin 🍵","d":["Vecihi Hürkuş","Mehmet Akif"],"exp":"Zihni Derin Karadeniz bölgesine çayı getirerek halkın geçim kaynağı olmasını sağlamıştır.","spokenText":"Türkiye'de çay tarımını başlatan ziraat uzmanı kimdir?"},
      {"q":"Kapadokya'da rüzgar ve yağmurun tüfleri aşındırmasıyla oluşan eşsiz doğal güzelliklerimiz hangisidir? 🏜️","a":"Peri Bacaları 🏜️","d":["Pamukkale Travertenleri","Düden Şelalesi"],"exp":"Peri bacaları Nevşehir Kapadokya bölgesindeki dünyaca ünlü doğal harikalardır.","spokenText":"Kapadokya'da oluşan dünyaca ünlü doğal güzelliğimiz hangisidir?"},
      {"q":"Denizli ilimizde bulunan, kireçli sıcak suların oluşturduğu beyaz basamaklı doğal güzellik hangisidir? ⚪","a":"Pamukkale Travertenleri ⚪","d":["Manavgat Şelalesi","Damlatas Mağarası"],"exp":"Pamukkale travertenleri beyaz teraslarıyla ülkemizin simge doğal zenginliğidir.","spokenText":"Denizli'de bulunan beyaz basamaklı doğal güzelliğimiz hangisidir?"},
      {"q":"Atatürk'ün Çanakkale ve Kurtuluş Savaşı'nda düşmanın planlarını önceden tahmin etmesi onun hangi özelliğini gösterir? 🎖️","a":"İleri görüşlülüğünü 🎖️","d":["Sanatseverliğini","Aceleciliğini"],"exp":"Atatürk gelecekteki olayları doğru tahmin eden eşsiz bir ileri görüşlülüğe sahipti.","spokenText":"Atatürk'ün olayları önceden tahmin edebilmesi hangi özelliğini gösterir?"},
      {"q":"Parktaki banklara, okul sıralarına ve otobüs duraklarına zarar vermemek neden bir vatandaşlık görevidir? 🌳","a":"Bunlar tüm milletin vergileriyle yapılan ortak milli servettir 🇹🇷","d":["Sadece ceza almaktan korktuğumuz için","Eski eşyalar oldukları için"],"exp":"Ortak kullanım alanları hepimizin malıdır; korumak milli bir ödevdir.","spokenText":"Ortak kullanım alanlarına ve eşyalara zarar vermemek neden vatandaşlık görevidir?"}
    ],

    grade3LifeScienceNatureDirectionsPool: [
      {"q":"Pusulanın renkli (kırmızı) ibresi daima hangi ana yönü gösterir? 🧭","a":"Kuzey 🧭","d":["Güney","Doğu"],"exp":"Pusula ibresinin renkli ucu Dünya'nın manyetik kuzeyini gösterir.","spokenText":"Pusulanın renkli ibresi daima hangi yönü gösterir?"},
      {"q":"Güneş'in doğduğu yöne SAĞ KOLUMUZU uzatırsak, ÖNÜMÜZ hangi ana yönü gösterir? ☀️","a":"Kuzey 🧭","d":["Güney","Batı"],"exp":"Sağ kol Doğu, sol kol Batı olduğunda önümüz Kuzey, arkamız Güney olur.","spokenText":"Güneşin doğduğu yöne sağ kolumuzu uzatırsak önümüz nereyi gösterir?"},
      {"q":"Geceleri bulutsuz ve açık bir havada gökyüzünde daima KUZEYİ gösteren parlak yıldız hangisidir? ⭐","a":"Kutup Yıldızı (Demirkazık) ⭐","d":["Çoban Yıldızı","Kuyruklu Yıldız"],"exp":"Kutup Yıldızı gökyüzünde yer değiştirmeden daima kuzeyi işaret eder.","spokenText":"Geceleri daima kuzey yönünü gösteren parlak yıldız hangisidir?"},
      {"q":"Ormanda yönünü kaybeden bir izci ağaçların ve taşların YOSUNLU tarafına bakarak hangi yönü bulur? 🌲","a":"Kuzey (Yosunlu taraf) 🌲","d":["Güney","Doğu"],"exp":"Kuzey tarafı güneş görmediği ve nemli kaldığı için yosun tutar.","spokenText":"Ağaç gövdelerinin ve taşların yosunlu tarafı hangi yönü gösterir?"},
      {"q":"Karınca yuvalarının giriş ağzı hangi yöne bakar? 🐜","a":"Güney yönüne (Toprak yığını kuzeydedir) 🐜","d":["Kuzey yönüne","Batı yönüne"],"exp":"Karıncalar rüzgardan korunmak için yuva kapılarını güneye doğru açarlar.","spokenText":"Karınca yuvalarının giriş ağzı hangi yönü gösterir?"},
      {"q":"Cami minarelerinde ezan okunan yer olan şerefenin kapısı daima hangi yöne açılır? 🕌","a":"Güney yönüne (Kıbleye) 🕌","d":["Kuzey yönüne","Doğu yönüne"],"exp":"Ülkemizde cami minarelerinin şerefe kapıları güneye, yani kıbleye bakar.","spokenText":"Cami minarelerindeki şerefe kapısı hangi yöne bakar?"},
      {"q":"Ülkemizde Şanlıurfa Birecik'te koruma altına alınan, nesli tükenme tehlikesindeki kuş türü hangisidir? 🪶","a":"Kelaynak Kuşları 🪶","d":["Leylek","Kaya Kartalı"],"exp":"Kelaynaklar dünyada sayılı kalan ve Birecik'te üretme istasyonunda korunan kuşlardır.","spokenText":"Şanlıurfa Birecik'te korunan nesli tehlikedeki kuş türü hangisidir?"},
      {"q":"Akdeniz sahillerinde (Dalyan, İztuzu kumsalı) yumurtlayan ve koruma altında olan deniz canlısı hangisidir? 🐢","a":"Caretta Caretta (İribaş Deniz Kaplumbağası) 🐢","d":["Yunus Balığı 🐬","Mavi Balina 🐋"],"exp":"Caretta carettalar nesli tükenme tehlikesi nedeniyle koruma altındadır.","spokenText":"Dalyan sahillerinde yumurtlayan koruma altındaki deniz kaplumbağası hangisidir?"},
      {"q":"Kullanılmış kağıt ve kartonları geri dönüşüm kutusuna atmak doğada neyi kurtarır? 🌲","a":"Ağaçların kesilmesini önler 🌲","d":["Göllerin taşmasını sağlar","Havanın soğumasını sağlar"],"exp":"1 ton kağıdın geri dönüştürülmesi yaklaşık 17 ağacın kesilmesini engeller.","spokenText":"Kağıtları geri dönüştürmek doğada neyi kurtarır?"},
      {"q":"Bitkiler fotosentez yaparak havaya hangi hayati gazı verirler? 🌿","a":"Oksijen 🌿","d":["Karbondioksit","Doğalgaz"],"exp":"Ormanlar ve bitkiler Dünya'mızın oksijen fabrikalarıdır.","spokenText":"Bitkiler havaya hangi gazı verirler?"},
      {"q":"Piknik yaptıktan sonra ormanda cam şişe veya kırık cam parçaları bırakmak neden çok tehlikelidir? 🔥","a":"Güneş ışığını mercek gibi odaklayıp orman yangını çıkarabilir 🔥","d":["Ağaçların büyümesini hızlandırır","Kuşların yuva yapmasını sağlar"],"exp":"Cam kırıkları güneş ışığını toplayarak kuru otları tutuşturur ve yangın başlatır.","spokenText":"Ormanda cam şişe bırakmak neden yangın tehlikesi oluşturur?"},
      {"q":"Güneş akşamları hangi ana yönden batar? 🌅","a":"Batı 🌅","d":["Doğu","Kuzey"],"exp":"Güneş Doğu'dan doğar, Batı'dan batar.","spokenText":"Güneş akşamları hangi yönden batar?"},
      {"q":"Çay ve fındık tarımı ülkemizde en çok hangi bölgemizde yapılır? 🍵","a":"Karadeniz Bölgesi (Bol yağışlı ve ılıman) 🍵","d":["İç Anadolu Bölgesi","Güneydoğu Anadolu"],"exp":"Çay ve fındık bol yağış ve nem istediği için Karadeniz'de yetişir.","spokenText":"Çay ve fındık en çok hangi bölgemizde yetişir?"},
      {"q":"Denizlere ve nehirlere dökülen plastik atıklar deniz canlılarını nasıl etkiler? 🌊🐢","a":"Balık ve kaplumbağaların yutarak zehirlenmesine ve ölmesine yol açar ⚠️","d":["Denizleri daha temiz yapar","Balıkların büyümesini sağlar"],"exp":"Plastik atıklar deniz canlıları için ölümcül bir kirliliktir.","spokenText":"Plastik atıklar deniz canlılarını nasıl etkiler?"},
      {"q":"Toplam kaç tane ANA YÖN ve kaç tane ARA YÖN vardır? 🧭","a":"4 ana yön, 4 ara yön vardır (Toplam 8) 🧭","d":["2 ana yön, 2 ara yön","6 ana yön, 6 ara yön"],"exp":"Ana yönler: Kuzey, Güney, Doğu, Batı. Ara yönler: Kuzeydoğu, Kuzeybatı, Güneydoğu, Güneybatı.","spokenText":"Toplam kaç ana yön ve kaç ara yön vardır?"}
    ],

    // 3. Sınıf Hayat Bilgisi Karma Üreteci (6 Temadan Dengeli Çekim)
    generateGrade3LifeScienceKarma() {
      const topic = Math.floor(Math.random() * 6);
      if (topic === 0) return this.drawFromPool(this.grade3LifeScienceSchoolProfessionsPool, "grade3LifeScienceSchoolProfessionsPool");
      if (topic === 1) return this.drawFromPool(this.grade3LifeScienceHomeBudgetPool, "grade3LifeScienceHomeBudgetPool");
      if (topic === 2) return this.drawFromPool(this.grade3LifeScienceHealthConsumerPool, "grade3LifeScienceHealthConsumerPool");
      if (topic === 3) return this.drawFromPool(this.grade3LifeScienceSafetyTrafficPool, "grade3LifeScienceSafetyTrafficPool");
      if (topic === 4) return this.drawFromPool(this.grade3LifeScienceCountryLeadersPool, "grade3LifeScienceCountryLeadersPool");
      return this.drawFromPool(this.grade3LifeScienceNatureDirectionsPool, "grade3LifeScienceNatureDirectionsPool");
    },

    // Geriye dönük uyumluluk takma adları
    get grade3CompassConsumerPool() {
      return [...this.grade3LifeScienceHealthConsumerPool, ...this.grade3LifeScienceNatureDirectionsPool];
    },

    // 3. SINIF: FAMILY MEMBERS, FEELINGS & ABILITIES (30 ÖZGÜN KELİME & SESLİ)
    grade3FamilyFeelingsPool: [
      { englishWord: 'Father', q: 'İngilizce "Father" ailemizdeki hangi bireydir? 👨', a: 'Baba 👨', d: ['Anne 👩', 'Dede 👴'], exp: 'Father / Dad = Baba demektir.' },
      { englishWord: 'Mother', q: 'İngilizce "Mother" ailemizdeki hangi bireydir? 👩', a: 'Anne 👩', d: ['Teyze 👩‍🦰', 'Abla 👧'], exp: 'Mother / Mom = Anne demektir.' },
      { englishWord: 'Brother', q: 'İngilizce "Brother" kimdir? 👦', a: 'Erkek Kardeş / Abi 👦', d: ['Kız Kardeş 👧', 'Amca 👨'], exp: 'Brother = Erkek kardeş demektir.' },
      { englishWord: 'Sister', q: 'İngilizce "Sister" kimdir? 👧', a: 'Kız Kardeş / Abla 👧', d: ['Erkek Kardeş 👦', 'Teyze 👩'], exp: 'Sister = Kız kardeş demektir.' },
      { englishWord: 'Grandfather', q: 'İngilizce "Grandfather" kimdir? 👴', a: 'Dede / Büyükbaba 👴', d: ['Baba 👨', 'Amca 👨'], exp: 'Grandfather / Grandpa = Dede demektir.' },
      { englishWord: 'Grandmother', q: 'İngilizce "Grandmother" kimdir? 👵', a: 'Büyükanne / Nine 👵', d: ['Anne 👩', 'Hala 👩'], exp: 'Grandmother / Grandma = Büyükanne demektir.' },
      { englishWord: 'Uncle', q: 'İngilizce "Uncle" ailemizdeki hangi akrabadır? 👨', a: 'Amca / Dayı 👨', d: ['Hala / Teyze 👩', 'Kuzen 👦'], exp: 'Uncle = Amca veya Dayı demektir.' },
      { englishWord: 'Aunt', q: 'İngilizce "Aunt" ailemizdeki hangi akrabadır? 👩', a: 'Teyze / Hala 👩', d: ['Amca 👨', 'Dede 👴'], exp: 'Aunt = Teyze veya Hala demektir.' },
      { englishWord: 'Cousin', q: 'İngilizce "Cousin" kimdir? 🧒', a: 'Kuzen 🧒', d: ['Kardeş 👦', 'Bebek 👶'], exp: 'Cousin = Kuzen demektir.' },
      { englishWord: 'Happy', q: 'İngilizce "I am happy" diyen biri nasıl hissediyordur? 😊', a: 'Mutlu 😊', d: ['Üzgün 😢', 'Kızgın 😠'], exp: 'Happy = Mutlu demektir.' },
      { englishWord: 'Sad', q: 'İngilizce "Sad" ne anlama gelir? 😢', a: 'Üzgün 😢', d: ['Neşeli 😄', 'Yorgun 🥱'], exp: 'Sad = Üzgün demektir.' },
      { englishWord: 'Angry', q: 'İngilizce "Angry" nasıl bir duygudur? 😠', a: 'Kızgın / Öfkeli 😠', d: ['Korkmuş 😨', 'Mutlu 😊'], exp: 'Angry = Kızgın demektir.' },
      { englishWord: 'Tired', q: 'İngilizce "I am tired" diyen biri nasıldır? 🥱', a: 'Yorgun 🥱', d: ['Enerjik ⚡', 'Aç 🥪'], exp: 'Tired = Yorgun demektir.' },
      { englishWord: 'Hungry', q: 'İngilizce "I am hungry" diyen biri ne hisseder? 🥪', a: 'Açıkmış (Karnı aç) 🥪', d: ['Susamış 🥤', 'Uykulu 😴'], exp: 'Hungry = Aç demektir.' },
      { englishWord: 'Thirsty', q: 'İngilizce "I am thirsty" diyen biri ne hisseder? 🥤', a: 'Susamış 🥤', d: ['Açıkmış 🥪', 'Tok 🥧'], exp: 'Thirsty = Susamış demektir.' },
      { englishWord: 'Surprised', q: 'İngilizce "Surprised" hangi duygu ifadesidir? 😲', a: 'Şaşırmış 😲', d: ['Korkmuş 😱', 'Sıkılmış 😑'], exp: 'Surprised = Şaşırmış demektir.' },
      { englishWord: 'Swim', q: '"A fish can swim." cümlesinin Türkçe karşılığı nedir? 🐟', a: 'Bir balık yüzebilir. 🐟', d: ['Bir balık uçabilir.', 'Bir balık koşabilir.'], exp: 'Can = -ebilmek (yetenek), Swim = Yüzmek demektir.' },
      { englishWord: 'Fly', q: '"Birds can fly." cümlesi ne anlama gelir? 🐦', a: 'Kuşlar uçabilir. 🐦', d: ['Kuşlar yüzebilir.', 'Kuşlar tırmanabilir.'], exp: 'Fly = Uçmak demektir.' },
      { englishWord: 'Climb', q: '"Monkeys can climb trees." cümlesi ne demektir? 🐵', a: 'Maymunlar ağaçlara tırmanabilir. 🐵', d: ['Maymunlar ağaç diker.', 'Maymunlar uçamaz.'], exp: 'Climb = Tırmanmak demektir.' },
      { englishWord: 'Run', q: '"A cheetah can run fast." cümlesi ne anlama gelir? 🐆', a: 'Bir çita hızlı koşabilir. 🐆', d: ['Bir çita yavaş yürür.', 'Bir çita zıplayamaz.'], exp: 'Run = Koşmak, Fast = Hızlı demektir.' },
      { englishWord: 'Jump', q: '"Kangaroos can jump high." cümlesi ne demektir? 🦘', a: 'Kangurular yükseğe zıplayabilir. 🦘', d: ['Kangurular uçamaz.', 'Kangurular yüzer.'], exp: 'Jump = Zıplamak, High = Yükseğe demektir.' },
      { englishWord: 'Ride a bike', q: '"I can ride a bicycle." cümlesi ne demektir? 🚲', a: 'Ben bisiklet sürebilirim. 🚲', d: ['Ben araba sürerim.', 'Ben bisiklet alamam.'], exp: 'Ride a bike = Bisiklet sürmek demektir.' },
      { englishWord: 'Play football', q: '"Can you play football?" sorusuna nasıl cevap verilir? ⚽', a: 'Yes, I can. ⚽', d: ['No, I am happy.', 'Yes, I am father.'], exp: '"Can you...?" sorusuna "Yes, I can" veya "No, I can\'t" ile cevap verilir.' },
      { englishWord: 'Sing', q: '"She can sing a song." cümlesi ne anlatır? 🎤', a: 'O şarkı söyleyebilir. 🎤', d: ['O dans edemez.', 'O resim çizer.'], exp: 'Sing = Şarkı söylemek demektir.' },
      { englishWord: 'Dance', q: '"They can dance." cümlesi ne demektir? 💃', a: 'Onlar dans edebilir. 💃', d: ['Onlar koşamaz.', 'Onlar şarkı söyler.'], exp: 'Dance = Dans etmek demektir.' },
      { englishWord: 'Father', q: '"Baba" sözcüğünün İngilizce karşılığı hangisidir? 👨', a: 'Father 👨', d: ['Mother 👩', 'Brother 👦'], exp: 'Baba İngilizce "Father" demektir.' },
      { englishWord: 'Mother', q: '"Anne" sözcüğünün İngilizce karşılığı hangisidir? 👩', a: 'Mother 👩', d: ['Sister 👧', 'Aunt 👩'], exp: 'Anne İngilizce "Mother" demektir.' },
      { englishWord: 'Happy', q: '"Mutlu" 😊 kelimesinin İngilizce karşılığı hangisidir?', a: 'Happy 😊', d: ['Sad 😢', 'Angry 😠'], exp: 'Mutlu İngilizce "Happy" demektir.' },
      { englishWord: 'Tired', q: '"Yorgun" 🥱 kelimesinin İngilizce karşılığı hangisidir?', a: 'Tired 🥱', d: ['Hungry 🥪', 'Thirsty 🥤'], exp: 'Yorgun İngilizce "Tired" demektir.' },
      { englishWord: 'Can\'t', q: '"An elephant CAN\'T fly." ne demektir? 🐘', a: 'Bir fil UÇAMAZ. 🐘', d: ['Bir fil uçabilir.', 'Bir fil koşamaz.'], exp: 'Can\'t olumsuz yeteneksizlik bildirir: Uçamaz.' }
    ],

    // -------------------------------------------------------------
    // 4. SINIF SORU HAVUZU VE DİNAMİK ÜRETECİLERİ
    // -------------------------------------------------------------

    // 4. SINIF: 4, 5, 6 BASAMAKLI SAYILAR VE DÖRT İŞLEM (26 SORU)
    grade4DigitsOperationsPool: [
      {
            "q": "45.820 sayısının binler bölüğündeki sayı kaçtır? 👑",
            "a": "45",
            "d": [
                  "820",
                  "58"
            ],
            "exp": "Sayının solundaki basamaklar binler bölüğüdür: 45."
      },
      {
            "q": "128.450 sayısının birler bölüğündeki sayı kaçtır? 👑",
            "a": "450",
            "d": [
                  "128",
                  "28"
            ],
            "exp": "Sayının sağındaki üç basamak birler bölüğüdür: 450."
      },
      {
            "q": "67.314 sayısının binler bölüğündeki sayı kaçtır? 👑",
            "a": "67",
            "d": [
                  "314",
                  "73"
            ],
            "exp": "Sayının binler bölüğündeki sayı 67'dir."
      },
      {
            "q": "250.789 sayısının birler bölüğündeki sayı kaçtır? 👑",
            "a": "789",
            "d": [
                  "250",
                  "50"
            ],
            "exp": "Sayının birler bölüğündeki sayı 789'dur."
      },
      {
            "q": "84.905 sayısındaki 8 rakamının basamak değeri kaçtır? 📦",
            "a": "80.000",
            "d": [
                  "8.000",
                  "800"
            ],
            "exp": "8 rakamı on binler basamağında yer aldığı için basamak değeri 80.000'dir."
      },
      {
            "q": "156.420 sayısındaki 1 rakamının basamak değeri kaçtır? 📦",
            "a": "100.000",
            "d": [
                  "10.000",
                  "1.000"
            ],
            "exp": "1 rakamı yüz binler basamağında yer aldığı için basamak değeri 100.000'dir."
      },
      {
            "q": "73.680 sayısındaki 3 rakamının basamak değeri kaçtır? 📦",
            "a": "3.000",
            "d": [
                  "30.000",
                  "300"
            ],
            "exp": "3 rakamı binler basamağında yer aldığı için basamak değeri 3.000'dir."
      },
      {
            "q": "42 sayısını 10 ile zihinden çarptığımızda sonuç kaç olur? ⚡",
            "a": "420",
            "d": [
                  "4200",
                  "42"
            ],
            "exp": "10 ile çarpmak için sayının sağına bir sıfır eklenir: 420."
      },
      {
            "q": "65 sayısını 100 ile zihinden çarptığımızda sonuç kaç olur? ⚡",
            "a": "6500",
            "d": [
                  "650",
                  "65000"
            ],
            "exp": "100 ile çarpmak için sayının sağına iki sıfır eklenir: 6500."
      },
      {
            "q": "18 sayısını 1000 ile zihinden çarptığımızda sonuç kaç olur? ⚡",
            "a": "18000",
            "d": [
                  "1800",
                  "180"
            ],
            "exp": "1000 ile çarpmak için sayının sağına üç sıfır eklenir: 18000."
      },
      {
            "q": "74 sayısını 100 ile zihinden çarptığımızda sonuç kaç olur? ⚡",
            "a": "7400",
            "d": [
                  "740",
                  "74000"
            ],
            "exp": "100 ile çarpmak için sayının sağına iki sıfır eklenir: 7400."
      },
      {
            "q": "50 sayısını 1000 ile zihinden çarptığımızda sonuç kaç olur? ⚡",
            "a": "50000",
            "d": [
                  "5000",
                  "500"
            ],
            "exp": "50 × 1000 = 50.000 eder."
      },
      {
            "q": "480 sayısını 10'a kısa yoldan böldüğümüzde sonuç kaç olur? ➗",
            "a": "48",
            "d": [
                  "480",
                  "4"
            ],
            "exp": "10'a bölerken bir sıfır silinir: 48."
      },
      {
            "q": "3500 sayısını 100'e kısa yoldan böldüğümüzde sonuç kaç olur? ➗",
            "a": "35",
            "d": [
                  "350",
                  "3"
            ],
            "exp": "100'e bölerken iki sıfır silinir: 35."
      },
      {
            "q": "7200 sayısını 100'e kısa yoldan böldüğümüzde sonuç kaç olur? ➗",
            "a": "72",
            "d": [
                  "720",
                  "7"
            ],
            "exp": "100'e bölerken iki sıfır silinir: 72."
      },
      {
            "q": "9000 sayısını 1000'e kısa yoldan böldüğümüzde sonuç kaç olur? ➗",
            "a": "9",
            "d": [
                  "90",
                  "900"
            ],
            "exp": "1000'e bölerken üç sıfır silinir: 9."
      },
      {
            "q": "3480 sayısı en yakın hangi binliğe yuvarlanır? 🎯",
            "a": "3000",
            "d": [
                  "4000",
                  "3500"
            ],
            "exp": "Yüzler basamağında 4 olduğu için 3000 binliğine yuvarlanır."
      },
      {
            "q": "6720 sayısı en yakın hangi binliğe yuvarlanır? 🎯",
            "a": "7000",
            "d": [
                  "6000",
                  "6500"
            ],
            "exp": "Yüzler basamağında 7 olduğu için 7000 binliğine yuvarlanır."
      },
      {
            "q": "5290 sayısı en yakın hangi binliğe yuvarlanır? 🎯",
            "a": "5000",
            "d": [
                  "6000",
                  "5500"
            ],
            "exp": "Yüzler basamağında 2 olduğu için 5000 binliğine yuvarlanır."
      },
      {
            "q": "8650 sayısı en yakın hangi binliğe yuvarlanır? 🎯",
            "a": "9000",
            "d": [
                  "8000",
                  "8500"
            ],
            "exp": "Yüzler basamağında 6 olduğu için 9000 binliğine yuvarlanır."
      },
      {
            "q": "4150 sayısı en yakın hangi binliğe yuvarlanır? 🎯",
            "a": "4000",
            "d": [
                  "5000",
                  "4500"
            ],
            "exp": "Yüzler basamağında 1 olduğu için 4000 binliğine yuvarlanır."
      },
      {
            "q": "9820 sayısı en yakın hangi binliğe yuvarlanır? 🎯",
            "a": "10000",
            "d": [
                  "9000",
                  "9500"
            ],
            "exp": "Yüzler basamağında 8 olduğu için 10000 binliğine yuvarlanır."
      },
      {
            "q": "325 ile 175 sayılarının toplamı zihinden kaç eder? ➕",
            "a": "500",
            "d": [
                  "450",
                  "550"
            ],
            "exp": "325 + 175 = 500 eder."
      },
      {
            "q": "650 sayısından 250 çıkarıldığında fark kaç olur? ➖",
            "a": "400",
            "d": [
                  "350",
                  "450"
            ],
            "exp": "650 - 250 = 400 kalır."
      },
      {
            "q": "Dört basamaklı en küçük doğal sayı kaçtır? 🔢",
            "a": "1000",
            "d": [
                  "1001",
                  "1023"
            ],
            "exp": "Dört basamaklı en küçük doğal sayı 1000'dir."
      },
      {
            "q": "Dört basamaklı rakamları farklı en küçük doğal sayı kaçtır? 🔢",
            "a": "1023",
            "d": [
                  "1000",
                  "1234"
            ],
            "exp": "Rakamları farklı dört basamaklı en küçük sayı 1023'tür."
      }
],

    generateGrade4DigitsOperations() {
      const item = this.drawFromPool(this.grade4DigitsOperationsPool, "grade4DigitsOperationsPool");
      return {
        question: item.q,
        correct: item.a,
        distractors: item.d,
        explanation: item.exp
      };
    },

    // 4. SINIF: KESİRLER, ZAMAN VE AÇILAR (26 ÖZGÜN SORU)
    grade4FractionsAnglesPool: [
      { q: 'Payı paydasından KÜÇÜK olan kesirlere (örneğin 3/5, 2/7) ne ad verilir? 🍕', a: 'Basit Kesir 🍕', d: ['Bileşik Kesir', 'Tam Sayılı Kesir'], exp: 'Payı paydasından küçük olan kesirlere basit kesir denir.' },
      { q: 'Payı paydasına EŞİT veya paydasından BÜYÜK olan kesirlere (örneğin 7/4, 5/5) ne denir? 🍕', a: 'Bileşik Kesir 🍕', d: ['Basit Kesir', 'Birim Kesir'], exp: 'Payı paydasına eşit veya büyük kesirler bileşik kesirdir.' },
      { q: 'Bir tam sayı ve bir basit kesirden oluşan (örneğin 2 tam 1/3) kesirlere ne ad verilir? 🎂', a: 'Tam Sayılı Kesir 🎂', d: ['Birim Kesir', 'Basit Kesir'], exp: 'Tam kısmı bulunan kesirlere tam sayılı kesir denir.' },
      { q: 'Ölçüsü 0° ile 90° arasında olan açılara ne ad verilir? 📐', a: 'Dar Açı 📐', d: ['Dik Açı', 'Geniş Açı'], exp: 'Ölçüsü 90 dereceden küçük açılar dar açıdır.' },
      { q: 'Ölçüsü tam 90 derece (90°) olan açıya ne ad verilir? 📐', a: 'Dik Açı 📐', d: ['Dar Açı', 'Doğru Açı'], exp: 'Birbirini dik kesen doğruların oluşturduğu 90° açı dik açıdır.' },
      { q: 'Ölçüsü 90° ile 180° arasında olan açılara ne ad verilir? 📐', a: 'Geniş Açı 📐', d: ['Dar Açı', 'Tam Açı'], exp: '90 dereceden büyük, 180 dereceden küçük açılar geniş açıdır.' },
      { q: 'Ölçüsü tam 180 derece (180°) olan açıya ne denir? 📏', a: 'Doğru Açı 📏', d: ['Dik Açı', 'Geniş Açı'], exp: 'Düz bir doğru oluşturan 180 derecelik açıya doğru açı denir.' },
      { q: 'Bir üçgenin iç açıları toplamı her zaman kaç derecedir? 🔺', a: '180° 🔺', d: ['90°', '360°'], exp: 'Tüm üçgenlerin iç açıları toplamı daima 180 derecedir.' },
      { q: 'Bir dörtgenin (kare, dikdörtgen) iç açıları toplamı kaç derecedir? 🟦', a: '360° 🟦', d: ['180°', '270°'], exp: 'Dörtgenlerin iç açıları toplamı 360 derecedir.' },
      { q: '1 saat kaç saniyeye eşittir? ⏳', a: '3600 saniye ⏳', d: ['60 saniye', '600 saniye'], exp: '1 saat = 60 dakika, her dakika = 60 saniye. 60 × 60 = 3600 saniyedir.' },
      { q: 'Şubat ayının 4 yılda bir 29 gün çektiği ve yılın 366 gün olduğu yıllara ne denir? 📅', a: 'Artık Yıl 📅', d: ['Güneş Yılı', 'Ay Yılı'], exp: '4 yılda bir 6 saatlik farklar 1 tam gün eder ve o yıla artık yıl denir.' },
      { q: '60 sayısının 3/5\'i kaçtır? 🔢', a: '36', d: ['30', '40'], exp: '60 ÷ 5 = 12. 12 × 3 = 36.' },
      { q: '72 sayısının 5/8\'i kaçtır? 🔢', a: '45', d: ['40', '50'], exp: '72 ÷ 8 = 9. 9 × 5 = 45.' },
      { q: 'Aşağıdaki açılardan hangisi bir DAR AÇIDIR? 📐', a: '45° 📐', d: ['95°', '120°'], exp: '45 derece 90 dereceden küçük olduğu için dar açıdır.' },
      { q: 'Aşağıdaki açılardan hangisi bir GENİŞ AÇIDIR? 📐', a: '135° 📐', d: ['89°', '90°'], exp: '135 derece 90 ile 180 arasında olduğu için geniş açıdır.' },
      { q: 'Bir dik açı ile bir doğru açının toplamı kaç derecedir? (90° + 180°)', a: '270° 📐', d: ['360°', '200°'], exp: '90 + 180 = 270 derece eder.' },
      { q: '3 saat 25 dakika toplam kaç dakikadır? ⏰', a: '205 dakika ⏰', d: ['180 dakika', '225 dakika'], exp: '3 saat = 180 dakika. 180 + 25 = 205 dakika.' },
      { q: '240 saniye kaç dakikaya eşittir? ⏱️', a: '4 dakika ⏱️', d: ['3 dakika', '6 dakika'], exp: '240 ÷ 60 = 4 dakikadır.' },
      { q: 'Paydaları eşit 3/7 ile 2/7 kesirlerinin toplamı kaçtır? ➕', a: '5/7', d: ['5/14', '6/7'], exp: 'Paydalar eşitken sadece paylar toplanır: (3 + 2)/7 = 5/7.' },
      { q: '8/9 kesrinden 3/9 kesri çıkarıldığında sonuç ne olur? ➖', a: '5/9', d: ['5/0', '11/9'], exp: '(8 - 3)/9 = 5/9 kalır.' },
      { q: 'Bir açıyı ölçmek ve çizmek için kullandığımız yarım daire şeklindeki alete ne denir? 📐', a: 'İletki (Açıölçer) 📐', d: ['Pergel', 'Gönyeli Cetvel'], exp: 'Açıları derece cinsinden iletki (açıölçer) ile ölçeriz.' },
      { q: 'Bir üçgenin iki açısı 50° ve 60° ise üçüncü açısı kaç derecedir? 🔺', a: '70° 🔺', d: ['60°', '80°'], exp: 'İç açılar toplamı 180°dir. 50 + 60 = 110°. 180 - 110 = 70°.' },
      { q: 'Tam açının ölçüsü kaç derecedir? 🔄', a: '360° 🔄', d: ['180°', '90°'], exp: 'Tam bir çember dairesi 360 derecelik tam açıdır.' },
      { q: '5 tam 3/4 kesri bileşik kesre çevrildiğinde payı kaç olur? (5 × 4 + 3)', a: '23 (23/4)', d: ['20', '19'], exp: '5 × 4 = 20, 20 + 3 = 23. Kesir 23/4 olur.' },
      { q: 'Saat 14:15\'te sinemaya giren Ali, 1 saat 45 dakika sonra çıktığında saat kaç olur? 🎬', a: '16:00 🎬', d: ['15:45', '16:15'], exp: '14:15 + 45 dk = 15:00. 1 saat daha = 16:00.' },
      { q: 'Bir yılda toplam kaç hafta vardır? 📆', a: '52 hafta 📆', d: ['40 hafta', '48 hafta'], exp: 'Bir takvim yılında yaklaşık 52 hafta bulunur.' }
    ],

    // 4. SINIF: ÇEVRE VE ALAN HESAPLAMA (26 SORU)
    grade4PerimeterAreaPool: [
      {
            "q": "Bir kenarı 5 cm olan karenin çevresi kaç santimetredir? 🟦",
            "a": "20 cm",
            "d": [
                  "15 cm",
                  "25 cm"
            ],
            "exp": "Çevre = 4 × 5 = 20 cm'dir."
      },
      {
            "q": "Bir kenarı 8 cm olan karenin çevresi kaç santimetredir? 🟦",
            "a": "32 cm",
            "d": [
                  "24 cm",
                  "40 cm"
            ],
            "exp": "Çevre = 4 × 8 = 32 cm'dir."
      },
      {
            "q": "Bir kenarı 12 cm olan karenin çevresi kaç santimetredir? 🟦",
            "a": "48 cm",
            "d": [
                  "36 cm",
                  "60 cm"
            ],
            "exp": "Çevre = 4 × 12 = 48 cm'dir."
      },
      {
            "q": "Bir kenarı 15 cm olan karenin çevresi kaç santimetredir? 🟦",
            "a": "60 cm",
            "d": [
                  "45 cm",
                  "75 cm"
            ],
            "exp": "Çevre = 4 × 15 = 60 cm'dir."
      },
      {
            "q": "Bir kenarı 20 cm olan karenin çevresi kaç santimetredir? 🟦",
            "a": "80 cm",
            "d": [
                  "60 cm",
                  "100 cm"
            ],
            "exp": "Çevre = 4 × 20 = 80 cm'dir."
      },
      {
            "q": "Bir kenarı 4 cm olan karenin alanı kaç santimetrekaredir? 🟦",
            "a": "16 cm²",
            "d": [
                  "12 cm²",
                  "20 cm²"
            ],
            "exp": "Alan = 4 × 4 = 16 cm²'dir."
      },
      {
            "q": "Bir kenarı 6 cm olan karenin alanı kaç santimetrekaredir? 🟦",
            "a": "36 cm²",
            "d": [
                  "24 cm²",
                  "42 cm²"
            ],
            "exp": "Alan = 6 × 6 = 36 cm²'dir."
      },
      {
            "q": "Bir kenarı 7 cm olan karenin alanı kaç santimetrekaredir? 🟦",
            "a": "49 cm²",
            "d": [
                  "28 cm²",
                  "56 cm²"
            ],
            "exp": "Alan = 7 × 7 = 49 cm²'dir."
      },
      {
            "q": "Bir kenarı 9 cm olan karenin alanı kaç santimetrekaredir? 🟦",
            "a": "81 cm²",
            "d": [
                  "36 cm²",
                  "72 cm²"
            ],
            "exp": "Alan = 9 × 9 = 81 cm²'dir."
      },
      {
            "q": "Bir kenarı 10 cm olan karenin alanı kaç santimetrekaredir? 🟦",
            "a": "100 cm²",
            "d": [
                  "40 cm²",
                  "80 cm²"
            ],
            "exp": "Alan = 10 × 10 = 100 cm²'dir."
      },
      {
            "q": "Kısa kenarı 4 cm, uzun kenarı 7 cm olan dikdörtgenin çevresi kaç santimetredir? 📐",
            "a": "22 cm",
            "d": [
                  "18 cm",
                  "28 cm"
            ],
            "exp": "Çevre = 2 × (4 + 7) = 2 × 11 = 22 cm'dir."
      },
      {
            "q": "Kısa kenarı 6 cm, uzun kenarı 10 cm olan dikdörtgenin çevresi kaç santimetredir? 📐",
            "a": "32 cm",
            "d": [
                  "26 cm",
                  "60 cm"
            ],
            "exp": "Çevre = 2 × (6 + 10) = 2 × 16 = 32 cm'dir."
      },
      {
            "q": "Kısa kenarı 5 cm, uzun kenarı 9 cm olan dikdörtgenin çevresi kaç santimetredir? 📐",
            "a": "28 cm",
            "d": [
                  "24 cm",
                  "45 cm"
            ],
            "exp": "Çevre = 2 × (5 + 9) = 2 × 14 = 28 cm'dir."
      },
      {
            "q": "Kısa kenarı 8 cm, uzun kenarı 12 cm olan dikdörtgenin çevresi kaç santimetredir? 📐",
            "a": "40 cm",
            "d": [
                  "32 cm",
                  "96 cm"
            ],
            "exp": "Çevre = 2 × (8 + 12) = 2 × 20 = 40 cm'dir."
      },
      {
            "q": "Kısa kenarı 3 cm, uzun kenarı 8 cm olan dikdörtgenin alanı kaç santimetrekaredir? 📐",
            "a": "24 cm²",
            "d": [
                  "22 cm²",
                  "26 cm²"
            ],
            "exp": "Alan = 3 × 8 = 24 cm²'dir."
      },
      {
            "q": "Kısa kenarı 5 cm, uzun kenarı 7 cm olan dikdörtgenin alanı kaç santimetrekaredir? 📐",
            "a": "35 cm²",
            "d": [
                  "24 cm²",
                  "42 cm²"
            ],
            "exp": "Alan = 5 × 7 = 35 cm²'dir."
      },
      {
            "q": "Kısa kenarı 6 cm, uzun kenarı 9 cm olan dikdörtgenin alanı kaç santimetrekaredir? 📐",
            "a": "54 cm²",
            "d": [
                  "30 cm²",
                  "45 cm²"
            ],
            "exp": "Alan = 6 × 9 = 54 cm²'dir."
      },
      {
            "q": "Kısa kenarı 4 cm, uzun kenarı 11 cm olan dikdörtgenin alanı kaç santimetrekaredir? 📐",
            "a": "44 cm²",
            "d": [
                  "30 cm²",
                  "40 cm²"
            ],
            "exp": "Alan = 4 × 11 = 44 cm²'dir."
      },
      {
            "q": "Çevresi 36 cm olan bir karenin bir kenar uzunluğu kaç santimetredir? 🟦",
            "a": "9 cm",
            "d": [
                  "8 cm",
                  "12 cm"
            ],
            "exp": "Kenar = 36 ÷ 4 = 9 cm'dir."
      },
      {
            "q": "Çevresi 48 cm olan bir karenin bir kenar uzunluğu kaç santimetredir? 🟦",
            "a": "12 cm",
            "d": [
                  "10 cm",
                  "16 cm"
            ],
            "exp": "Kenar = 48 ÷ 4 = 12 cm'dir."
      },
      {
            "q": "Alanı 64 santimetrekare olan bir karenin bir kenar uzunluğu kaç santimetredir? 🟦",
            "a": "8 cm",
            "d": [
                  "6 cm",
                  "16 cm"
            ],
            "exp": "8 × 8 = 64 olduğu için kenar 8 cm'dir."
      },
      {
            "q": "Alanı 81 santimetrekare olan bir karenin bir kenar uzunluğu kaç santimetredir? 🟦",
            "a": "9 cm",
            "d": [
                  "8 cm",
                  "18 cm"
            ],
            "exp": "9 × 9 = 81 olduğu için kenar 9 cm'dir."
      },
      {
            "q": "Bir kenarı 25 metre olan kare şeklindeki bahçenin çevresi kaç metredir? 🌳",
            "a": "100 metre",
            "d": [
                  "75 metre",
                  "125 metre"
            ],
            "exp": "Çevre = 4 × 25 = 100 metredir."
      },
      {
            "q": "Kısa kenarı 15 metre, uzun kenarı 20 metre olan bahçenin çevresi kaç metredir? 🏡",
            "a": "70 metre",
            "d": [
                  "60 metre",
                  "80 metre"
            ],
            "exp": "Çevre = 2 × (15 + 20) = 2 × 35 = 70 metredir."
      },
      {
            "q": "Tüm kenarları eşit üçgen olan eşkenar üçgenin bir kenarı 7 cm ise çevresi kaç santimetredir? 🔺",
            "a": "21 cm",
            "d": [
                  "14 cm",
                  "28 cm"
            ],
            "exp": "Çevre = 3 × 7 = 21 cm'dir."
      },
      {
            "q": "Kenar uzunlukları 5 cm, 7 cm ve 9 cm olan çeşitkenar üçgenin çevresi kaç santimetredir? 🔺",
            "a": "21 cm",
            "d": [
                  "19 cm",
                  "23 cm"
            ],
            "exp": "Çevre = 5 + 7 + 9 = 21 cm'dir."
      }
],

    generateGrade4PerimeterArea() {
      const item = this.drawFromPool(this.grade4PerimeterAreaPool, "grade4PerimeterAreaPool");
      return {
        question: item.q,
        correct: item.a,
        distractors: item.d,
        explanation: item.exp
      };
    },

    // 4. SINIF: DEYİMLER VE ATASÖZLERİ DÜELLOSU (35 ÖZGÜN SORU)
    grade4IdiomsProverbsPool: [
      { q: '"Göze girmek" deyimi ne anlama gelir? 👁️', a: 'Davranışlarıyla sevgi ve güven kazanmak 🌟', d: ['Gözü ağrımak', 'Görünmez olmak'], exp: 'Çalışkanlığı ve dürüstlüğüyle başkalarının takdirini kazanmaktır.' },
      { q: '"Gözden düşmek" deyimi ne anlama gelir? 💔', a: 'Eski değer ve sevgisini kaybetmek 💔', d: ['Yere yuvarlanmak', 'Uyumak'], exp: 'Kötü bir davranış sonucu birinin gözündeki değerini yitirmektir.' },
      { q: '"Kulak kabartmak" deyimi ne anlama gelir? 👂', a: 'Belli etmemeye çalışarak gizlice dinlemek 👂', d: ['Kulağı şişmek', 'Bağırarak konuşmak'], exp: 'Yanında konuşulanları çaktırmadan dinlemeye kulak kabartmak denir.' },
      { q: '"Kulak misafiri olmak" deyimi ne anlatır? 👂', a: 'İstemeden, yanındayken bir konuşmayı duymak 👂', d: ['Misafirliğe gitmek', 'Kulak temizletmek'], exp: 'Kendi konuşması olmadığı halde yanı başında konuşulanları tesadüfen duymaktır.' },
      { q: '"Diline dolamak" deyimi ne anlama gelir? 👅', a: 'Bir konuyu veya kişiyi durmadan tekrar edip söylemek 🗣️', d: ['Yemek yemek', 'Hiç konuşmamak'], exp: 'Sürekli aynı şeyi konuşup dedikodusunu yapmaktır.' },
      { q: '"Baltayı taşa vurmak" deyimi ne anlama gelir? 🪓', a: 'Farkında olmadan pot kırmak, karşısındakini incitecek söz söylemek 🙈', d: ['Odun kesmek', 'Taş kırmak'], exp: 'İstemeden uygunsuz ve mahcup edici bir laf etmektir.' },
      { q: '"Çantada keklik" deyimi neyi ifade eder? 🎒', a: 'Kolayca ve kesin olarak elde edilecek şey 🎯', d: ['Avcılık yapmak', 'Kayıp eşya'], exp: 'Zaten kazanılmış, kesin gözüyle bakılan işler için kullanılır.' },
      { q: '"Pabucu dama atılmak" deyimi ne anlatır? 👞', a: 'Kendinden üstün birinin gelmesiyle eski ilgiyi kaybetmek 👞', d: ['Yeni ayakkabı almak', 'Çatıya çıkmak'], exp: 'Özellikle yeni kardeş doğunca veya yeni birisi gelince gözden düşmektir.' },
      { q: '"Etekleri zil çalmak" deyimi ne anlama gelir? 🔔', a: 'Çok büyük bir sevinç ve heyecan duymak 🎉', d: ['Korkudan titremek', 'Müzik yapmak'], exp: 'Aşırı mutlu olmak ve içi içine sığmamaktır.' },
      { q: '"Ağzı kulaklarına varmak" deyimi neyi belirtir? 😄', a: 'Gülümsemekten yüzü aydınlanacak kadar çok sevinmek 😄', d: ['Şaşkınlıktan donakalmak', 'Yorulmak'], exp: 'Çok mutlu ve neşeli olmayı anlatır.' },
      { q: '"Saman alevi gibi parlamak" deyimi ne anlama gelir? 🌾🔥', a: 'Birden öfkelenip çok çabuk yatışmak 🌾', d: ['Sürekli sinirli olmak', 'Karanlığı aydınlatmak'], exp: 'Öfkesi çabucak geçip sakinleşen kişiler için söylenir.' },
      { q: '"Burnundan kıl aldırmamak" deyimi ne anlatır? 👃', a: 'Çok kibirli ve en küçük eleştiriye bile gelememek 😤', d: ['Çok titiz olmak', 'Grip olmak'], exp: 'Kendini çok beğenmiş, dokunulmaz sanan kişiler için kullanılır.' },
      { q: '"Pireyi deve yapmak" deyimi ne anlama gelir? 🐪', a: 'Küçük bir sorunu aşırı büyüterek abartmak 🐪', d: ['Hayvanları sevmek', 'Çok çalışmak'], exp: 'Önemsiz bir meseleyi devasa bir dert haline getirmektir.' },
      { q: '"İpe un sermek" deyimi ne demektir? 🧶', a: 'Geçersiz bahaneler uydurarak işi yapmaktan kaçınmak 🏃‍♂️', d: ['Börek yapmak', 'Temizlik yapmak'], exp: 'Olmayacak engeller öne sürüp işi savsaklamaktır.' },
      { q: '"Can kulağıyla dinlemek" deyimi ne anlatır? 👂', a: 'Bütün dikkatini vererek büyük bir özenle dinlemek 🎯', d: ['Müzik dinlemek', 'Hiç duymamak'], exp: 'Hiçbir kelimeyi kaçırmadan tam odakla dinlemektir.' },
      { q: '"Ateş püskürmek" deyimi ne anlama gelir? 🔥', a: 'Çok fazla sinirlenmek ve öfke saçmak 😡', d: ['Ateş yakmak', 'Ejderha olmak'], exp: 'Aşırı kızgınlık halinde bağırıp çağırmaktır.' },
      { q: '"İçi içine sığmamak" deyimi neyi anlatır? 🎈', a: 'Coşku, sevinç ve heyecandan yerinde duramamak 🎈', d: ['Çok kilo almak', 'Dar elbiseler giymek'], exp: 'Sabırsızlıkla büyük bir sevinç yaşamaktır.' },
      { q: '"Sineğin yağını çıkarmak" deyimi ne demektir? 🦟', a: 'Aşırı derecede cimri ve çıkarcı davranmak 💰', d: ['Temizlik yapmak', 'Sinek avlamak'], exp: 'En ufak şeyden bile haksız kazanç çıkarmaya çalışan cimriler için söylenir.' },
      { q: '"Damlaya damlaya göl olur" atasözü neyi öğütler? 💧', a: 'Küçük birikimlerin zamanla büyük değerlere dönüşeceğini (Tasarruf) 💧', d: ['Yağmur yağmasını beklemeyi', 'Su israf etmeyi'], exp: 'Küçük paralar ve tasarruflar birikerek büyük servet olur.' },
      { q: '"Ağaç yaşken eğilir" atasözünün anlamı nedir? 🌳', a: 'İnsanların küçük yaşlarda daha kolay eğitilebileceği 👦', d: ['Yaş ağaçların kırılacağı', 'Bahçeye ağaç dikilmesi gerektiği'], exp: 'Eğitim ve güzel ahlak çocuklukta kazanılır.' },
      { q: '"Sakla samanı, gelir zamanı" atasözü ne anlatır? 🌾', a: 'Değersiz görünen şeylerin bile bir gün işe yarayacağını 🌾', d: ['Saman alıp satmayı', 'Hayvan beslemeyi'], exp: 'Hiçbir şeyi gereksiz yere israf etmemek gerektiğini öğütler.' },
      { q: '"Ev alma, komşu al" atasözü neyi vurgular? 🏡', a: 'İyi bir komşunun evden çok daha değerli olduğunu 🤝', d: ['Pahalı ev satın almayı', 'Yalnız yaşamayı'], exp: 'Huzurlu bir yaşam için komşuluk ilişkileri binadan önemlidir.' },
      { q: '"Bir elin nesi var, iki elin sesi var" atasözü neyi anlatır? 👏', a: 'Birlik, beraberlik ve yardımlaşmanın gücünü 🤝', d: ['Alkış yapmayı', 'El yıkamayı'], exp: 'Birlikte çalışmak tek başına yapmaktan çok daha güçlü sonuçlar verir.' },
      { q: '"İşleyen demir ışıldar" atasözü ne demektir? ⚙️', a: 'Sürekli çalışan ve gayret eden insanın başarılı ve sağlıklı olacağı 🌟', d: ['Demir eşyaların parlatılması gerektiği', 'Tembellik yapmayı'], exp: 'Çalışmak insanı diri, zinde ve başarılı tutar.' },
      { q: '"Acele işe şeytan karışır" atasözü neyi öğütler? ⏳', a: 'Sabırsız ve telaşla yapılan işlerin yanlış ve kusurlu olacağını ⏳', d: ['Çok hızlı koşmayı', 'Hemen bitirmeyi'], exp: 'İşleri dikkatli, sakin ve düşünerek yapmak gerekir.' },
      { q: '"Tatlı dil yılanı deliğinden çıkarır" atasözü neyi anlatır? 🐍', a: 'Güzel, tatlı ve nazik sözün en zor kişileri bile ikna edeceğini 🍯', d: ['Yılanları sevmeyi', 'Ormanda gezmeyi'], exp: 'Nezaket ve güzel söz her kapıyı açar.' },
      { q: '"Ne doğrarsan aşına, o çıkar kaşığına" atasözü ne demektir? 🍲', a: 'Kişi ne kadar emek verirse o kadar karşılık alır 🍲', d: ['Çorba pişirmeyi', 'Yemek seçmeyi'], exp: 'Bugün yaptığımız iyi veya kötü işlerin karşılığını gelecekte görürüz.' },
      { q: '"Ayağını yorganına göre uzat" atasözü neyi öğütler? 🛏️', a: 'Giderlerini gelirine göre ayarlamayı ve bütçeni aşmamayı 💰', d: ['Uzun yorgan satın almayı', 'Erken uyumayı'], exp: 'Kazancından fazlasını harcayanlar borç ve sıkıntıya düşer.' },
      { q: '"Gülme komşuna, gelir başına" atasözü ne anlatır? 👥', a: 'Başkalarının başına gelen kötü duruma sevinmemek gerektiğini 👥', d: ['Komşulara şaka yapmayı', 'Kahkaha atmayı'], exp: 'Kötü talih herkesin başına gelebilir; başkasıyla alay edilmemelidir.' },
      { q: '"Vakit nakittir" atasözü neyi ifade eder? ⏰', a: 'Zamanın en az para kadar değerli ve geri getirilemez olduğunu ⏰', d: ['Saat satın almayı', 'Hızlı yürümeyi'], exp: 'Zamanı boşa harcamamak gerekir.' },
      { q: '"Dost kara günde belli olur" atasözü ne demektir? 🤝', a: 'Gerçek dostların zor ve sıkıntılı zamanlarda yanımızda olduğu 🤝', d: ['Hava kararınca dostla gezmeyi', 'Sadece iyi günlerde eğlenmeyi'], exp: 'Zor zamanlarda yanımızdan ayrılmayanlar hakiki dosttur.' },
      { q: '"Sütten ağzı yanan yoğurdu üfleyerek yer" atasözü ne anlatır? 🥛', a: 'Bir olaydan zarar görenin benzer durumlarda aşırı temkinli davranacağını 🥛', d: ['Sıcak yoğurt yemeyi', 'Soğuk süt içmeyi'], exp: 'Yaşanan tecrübeler insanı daha dikkatli ve tedbirli yapar.' },
      { q: '"Akıl akıldan üstündür" atasözü neyi vurgular? 🧠', a: 'Önemli işlerde başkalarına danışmanın ve fikir almanın faydasını 🧠', d: ['Kendi aklına güvenmeyi', 'Her şeyi bilmeyi'], exp: 'İstişare etmek ve fikir alışverişinde bulunmak en doğru yoldur.' },
      { q: '"Meyve veren ağaç taşlanır" atasözü ne demektir? 🍎', a: 'Başarılı ve yetenekli insanların kıskanılıp eleştirilebileceğini 🍎', d: ['Bahçedeki ağaçlara taş atmayı', 'Meyve toplamayı'], exp: 'Başarılı kimseleri kıskananlar onlara kusur bulmaya çalışır.' },
      { q: '"Öfkeyle kalkan zararla oturur" atasözü neyi öğütler? 😡', a: 'Öfke anında düşünmeden davrananların sonunda pişman olacağını 😡', d: ['Ayağa kalkmayı', 'Kızgın görünmeyi'], exp: 'Öfkeyle verilen kararlar daima kayıp getirir; sakin olmak gerekir.' }
    ],

    // 4. SINIF: SEBEP-SONUÇ, AMAÇ-SONUÇ VE ÖZNEL/NESNEL YARGILAR (30 ÖZGÜN SORU)
    grade4SentencesLogicPool: [
      { q: '"Kar yağdığı için köy yolları ulaşıma kapandı." cümlesinde hangi anlam ilişkisi vardır? ❄️', a: 'Sebep - Sonuç (Neden - Sonuç) ❄️', d: ['Amaç - Sonuç', 'Koşul - Sonuç'], exp: 'Köy yollarının kapanmasının gerçekleşmiş gerçek sebebi kar yağmasıdır.' },
      { q: '"Sınavdan yüksek not almak için gece gündüz ders çalıştı." cümlesinde hangi anlam ilişkisi vardır? 🎯', a: 'Amaç - Sonuç 🎯', d: ['Sebep - Sonuç', 'Benzetme'], exp: 'Ders çalışmasının hedefi/gayesi yüksek not almaktır (Amaç-Sonuç).' },
      { q: '"Hızlı koştuğundan nefes nefese kaldı." cümlesi hangi tür bir cümledir? 🏃‍♂️', a: 'Sebep - Sonuç 🏃‍♂️', d: ['Koşul - Sonuç', 'Öznel Cümle'], exp: 'Nefes nefese kalmanın gerçekleşen nedeni hızlı koşmaktır.' },
      { q: '"Kilo vermek amacıyla her sabah düzenli yürüyüş yapıyor." cümlesi hangisidir? 🚶‍♂️', a: 'Amaç - Sonuç 🚶‍♂️', d: ['Sebep - Sonuç', 'Nesnel Cümle'], exp: '"Amacıyla" ifadesi açıkça amaç-sonuç ilişkisini gösterir.' },
      { q: '"Ödevlerini zamanında bitirirsen hafta sonu parka gidebilirsin." cümlesinde hangi anlam vardır? 🎡', a: 'Koşul - Sonuç (Şart) 🎡', d: ['Amaç - Sonuç', 'Sebep - Sonuç'], exp: 'Parka gitmenin şartı/koşulu ödevleri bitirmektir (-se / -sa).' },
      { q: '"Türkiye\'nin başkenti Ankara\'dır." cümlesi ne tür bir yargı bildirir? 🏛️', a: 'Nesnel Yargı (Kanıtlanabilir) 🏛️', d: ['Öznel Yargı (Kişisel)', 'Amaç Bildiren'], exp: 'Herkes için geçerli, kişiden kişiye değişmeyen bilimsel/resmi gerçekler nesneldir.' },
      { q: '"En güzel ve dinlendirici renk mavidir." cümlesi ne tür bir yargıdır? 🔵', a: 'Öznel Yargı (Kişisel beğeni) 🔵', d: ['Nesnel Yargı', 'Koşul Bildiren'], exp: 'Güzellik kişiden kişiye değişir, kanıtlanamaz; bu yüzden özneldir.' },
      { q: '"Türkiye\'nin en yüksek dağı Ağrı Dağı\'dır." cümlesi hangi tür yargıdır? 🏔️', a: 'Nesnel Yargı 🏔️', d: ['Öznel Yargı', 'Sebep-Sonuç'], exp: 'Ölçülebilir coğrafi bir gerçektir, nesneldir.' },
      { q: '"Bu film hayatımda izlediğim en harika filmdi." cümlesi nedir? 🎬', a: 'Öznel Yargı 🎬', d: ['Nesnel Yargı', 'Amaç Cümlesi'], exp: 'Filmin harika olması tamamen izleyicinin kendi kişisel yorumudur.' },
      { q: '"Şemsiyesini evde unuttuğu için yağmurda ıslandı." cümlesi hangisidir? 🌧️', a: 'Sebep - Sonuç 🌧️', d: ['Amaç - Sonuç', 'Öznel Cümle'], exp: 'Islanmasının gerçek sebebi şemsiyesini unutmasıdır.' },
      { q: '"Yeni bir bisiklet almak üzere para biriktiriyor." cümlesinde hangi anlam vardır? 🚲', a: 'Amaç - Sonuç 🚲', d: ['Sebep - Sonuç', 'Koşul - Sonuç'], exp: 'Para biriktirmesinin gayesi yeni bisiklet almaktır.' },
      { q: '"Hava soğuk olduğu için kalın montunu giydi." cümlesinde sebep nedir? 🧥', a: 'Havanın soğuk olması 🧥', d: ['Montunu giymesi', 'Dışarı çıkması'], exp: 'Mont giyme eyleminin gerekçesi havanın soğuk olmasıdır.' },
      { q: '"Kitap okursan hayal gücün zenginleşir." cümlesi hangi türdür? 📖', a: 'Koşul - Sonuç 📖', d: ['Amaç - Sonuç', 'Öznel Yargı'], exp: 'Hayal gücünün zenginleşmesi kitap okuma şartına bağlanmıştır.' },
      { q: '"Pamuk gibi yumuşacık elleri vardı." cümlesinde hangi sanat/anlatım vardır? ☁️', a: 'Benzetme ☁️', d: ['Karşılaştırma', 'Sebep-Sonuç'], exp: 'Eller yumuşaklık yönünden pamuğa benzetilmiştir.' },
      { q: '"Ali, sınıfın en uzun boylu öğrencisidir." cümlesinde hangi anlatım vardır? 📏', a: 'Karşılaştırma 📏', d: ['Benzetme', 'Koşul'], exp: 'Ali ile sınıftaki diğer öğrencilerin boyları kıyaslanmıştır.' },
      { q: '"Güneş batınca ortalık zifiri karanlığa büründü." cümlesi ne bildirir? 🌑', a: 'Nesnel Yargı 🌑', d: ['Öznel Yargı', 'Amaç'], exp: 'Güneş battığında havanın kararması doğa kanunudur, nesneldir.' },
      { q: '"Çilekli dondurma vanilyalı dondurmadan çok daha lezzetlidir." cümlesi nedir? 🍨', a: 'Öznel Yargı 🍨', d: ['Nesnel Yargı', 'Koşul'], exp: 'Lezzet algısı kişiseldir, kanıtlanamaz.' },
      { q: '"Trafik kurallarına uyarsak kazalar önlenir." cümlesi hangisidir? 🚦', a: 'Koşul - Sonuç 🚦', d: ['Amaç - Sonuç', 'Öznel'], exp: 'Kazaların önlenmesi kurallara uyma şartına bağlıdır.' },
      { q: '"Yabancı dil öğrenmek maksadıyla kursa kaydoldu." cümlesi nedir? 🌍', a: 'Amaç - Sonuç 🌍', d: ['Sebep - Sonuç', 'Koşul'], exp: '"Maksadıyla" kelimesi amaca işaret eder.' },
      { q: '"Elektrikler kesilince asansörde mahsur kaldılar." cümlesi nedir? ⚡', a: 'Sebep - Sonuç ⚡', d: ['Amaç - Sonuç', 'Öznel Yargı'], exp: 'Asansörde kalmanın gerçekleşmiş nedeni elektriğin kesilmesidir.' },
      { q: '"Su 100 derecede kaynar." cümlesi hangi tür yargıdır? 💧', a: 'Nesnel Yargı 💧', d: ['Öznel Yargı', 'Amaç'], exp: 'Deneyle ispatlanabilir bilimsel gerçek nesneldir.' },
      { q: '"Sonbahar mevsimi insana hüzün verir." cümlesi ne tür bir yargıdır? 🍂', a: 'Öznel Yargı 🍂', d: ['Nesnel Yargı', 'Koşul'], exp: 'Sonbaharın hüzünlü gelmesi kişiden kişiye değişen duygudur.' },
      { q: '"Geç kaldığı için öğretmeninden özür diledi." cümlesi hangisidir? ⏰', a: 'Sebep - Sonuç ⏰', d: ['Amaç - Sonuç', 'Öznel'], exp: 'Özür dilemesinin sebebi derse geç kalmasıdır.' },
      { q: '"Temiz bir çevre istiyorsan çöpleri kutuya atmalısın." cümlesi nedir? ♻️', a: 'Koşul - Sonuç ♻️', d: ['Amaç - Sonuç', 'Nesnel'], exp: 'Temiz çevreye kavuşmanın şartı çöpleri kutuya atmaktır.' },
      { q: '"Bir haftada yedi gün vardır." cümlesi ne tür bir yargıdır? 📅', a: 'Nesnel Yargı 📅', d: ['Öznel Yargı', 'Koşul'], exp: 'Takvim kuralı kesin ve nesneldir.' },
      { q: '"Tavşan gibi hızlı koşan bir çocuktu." cümlesinde ne vardır? 🐰', a: 'Benzetme 🐰', d: ['Koşul', 'Amaç'], exp: 'Çocuğun hızı tavşana benzetilmiştir.' },
      { q: '"Bu yazarın dili diğer yazarlara göre daha akıcıdır." cümlesinde ne vardır? ✍️', a: 'Karşılaştırma ve Öznel Yargı ✍️', d: ['Nesnel Yargı', 'Sebep-Sonuç'], exp: 'Yazarlar arasında akıcılık yönünden kişisel bir kıyaslama yapılmıştır.' },
      { q: '"Kütüphaneden kitap almak üzere evden çıktı." cümlesi nedir? 📚', a: 'Amaç - Sonuç 📚', d: ['Sebep - Sonuç', 'Nesnel'], exp: 'Evden çıkma gayesi kütüphaneden kitap almaktır.' },
      { q: '"Buzdolabının kapağı açık kaldığı için yiyecekler bozuldu." cümlesi nedir? 🧊', a: 'Sebep - Sonuç 🧊', d: ['Amaç - Sonuç', 'Öznel'], exp: 'Yiyeceklerin bozulmasının somut nedeni kapağın açık kalmasıdır.' },
      { q: '"En heyecan verici spor futboldur." cümlesi nedir? ⚽', a: 'Öznel Yargı ⚽', d: ['Nesnel Yargı', 'Sebep-Sonuç'], exp: 'Futbolun en heyecanlı olması kişisel bir zevktir.' }
    ],

    // 4. SINIF: YER KABUĞU, DÜNYA'NIN HAREKETLERİ VE BESİNLERİMİZ (30 ÖZGÜN SORU)
    grade4CrustNutritionPool: [
      { q: 'Yer kabuğunu oluşturan kayaçların parçalanmasıyla sırasıyla kaya, taş, çakıl ve en son ne oluşur? 🏖️', a: 'Toprak ve Kum 🏖️', d: ['Maden', 'Fosil'], exp: 'Kayaçlar rüzgar ve suyla aşınarak ufalanır ve toprağı meydana getirir.' },
      { q: 'Kayaçların içinde bulunan ve ekonomik değeri olan değerli minerallere ne ad verilir? 💎', a: 'Maden 💎', d: ['Fosil', 'Toprak'], exp: 'Ekonomik değere sahip kayaçlara maden denir (Altın, Bor, Bakır vb.).' },
      { q: 'Ülkemizin dünyada 1. sırada rezervine sahip olduğu, roket yakıtı ve temizlikte kullanılan stratejik maden hangisidir? 🚀', a: 'Bor Madeni 🚀', d: ['Taş Kömürü', 'Petrol'], exp: 'Türkiye dünyadaki bor rezervlerinin yaklaşık %73\'üne sahiptir.' },
      { q: 'Eski çağlarda yaşamış canlıların kayaç tabakaları arasında taşlaşmış kalıntı ve izlerine ne denir? 🦖', a: 'Fosil 🦖', d: ['Mineral', 'Linyit'], exp: 'Milyonlarca yıllık canlı kalıntıları fosil olarak adlandırılır.' },
      { q: 'Dünya\'nın kendi ekseni etrafında batıdan doğuya dönmesi ne kadar sürer? ⏳', a: '24 saat (1 gün) ⏳', d: ['365 gün 6 saat', '12 saat'], exp: 'Dünya kendi etrafındaki 1 tam dönüşünü 24 saatte tamamlar.' },
      { q: 'Dünya\'nın kendi etrafında dönmesi sonucunda hangisi OLUŞUR? 🌍', a: 'Gece ve Gündüz 🌍', d: ['Mevsimler', 'Artık Yıl'], exp: 'Dünya\'nın kendi etrafında dönmesiyle gece ve gündüz döngüsü oluşur.' },
      { q: 'Dünya\'nın Güneş etrafında dolanması ne kadar sürer? ☀️', a: '365 gün 6 saat (1 yıl) ☀️', d: ['24 saat', '30 gün'], exp: 'Dünya Güneş etrafındaki 1 tam dolanımını 1 yılda tamamlar.' },
      { q: 'Dünya\'nın Güneş etrafında dolanması ve eksen eğikliği sonucunda hangisi OLUŞUR? 🍂🌸', a: 'Dört Mevsim (İlkbahar, Yaz, Sonbahar, Kış) 🍂', d: ['Gece ve Gündüz', 'Gelgit'], exp: 'Güneş etrafındaki dolanma mevsimleri meydana getirir.' },
      { q: 'Vücudumuza öncelikli olarak ENERJİ sağlayan temel besin grubu hangisidir? 🍞', a: 'Karbonhidratlar (Ekmek, Makarna, Patates) 🍞', d: ['Proteinler', 'Vitaminler'], exp: 'Karbonhidratlar vücudumuzun 1. dereceden enerji yakıtıdır.' },
      { q: 'Vücudumuzda BÜYÜME, GELİŞME ve YARALARIN İYİLEŞMESİNİ sağlayan yapıcı-onarıcı besin hangisidir? 🥩', a: 'Proteinler (Et, Süt, Yumurta, Balık) 🥩', d: ['Yağlar', 'Karbonhidratlar'], exp: 'Proteinler vücudun yapı taşıdır; kas ve hücreleri onarır.' },
      { q: 'Vücudumuza enerji veren, fazlası depolanan ve soğuktan koruyan besin grubu nedir? 🧈', a: 'Yağlar (Zeytinyağı, Tereyağı, Ceviz) 🧈', d: ['Mineraller', 'Su'], exp: 'Yağlar yüksek enerji içerir ve organları korur.' },
      { q: 'Vücudumuzda DÜZENLEYİCİ olarak görev yapan ve hastalıklara karşı direncimizi artıran besin grubu nedir? 🍎🥦', a: 'Vitaminler (Meyve ve Sebzeler) 🍎', d: ['Karbonhidratlar', 'Yağlar'], exp: 'Vitaminler bağışıklık sistemini güçlendirir ve hastalıklardan korur.' },
      { q: 'Vücudumuzun yaklaşık %70\'ini oluşturan, her besinde bulunan ve hayati önem taşıyan madde nedir? 💧', a: 'Su ve Mineraller 💧', d: ['Sadece Şeker', 'Sadece Tuz'], exp: 'Su ve mineraller vücudun çalışması için her gün mutlaka tüketilmelidir.' },
      { q: 'Kayaçların farklı renk ve sertlikte olmasını sağlayan temel yapı nedir? 🪨', a: 'İçerdikleri Mineraller 🪨', d: ['Toprağın nemi', 'Havanın sıcaklığı'], exp: 'Kayaçlara özelliklerini içindeki mineraller kazandırır.' },
      { q: 'Mutfak tezgahlarında ve heykellerde kullanılan değerli ve sert kayaç/maden hangisidir? 🏛️', a: 'Mermer 🏛️', d: ['Kömür', 'Tuz'], exp: 'Afyon ve Marmara Adası mermerleriyle dünyaca ünlüdür.' },
      { q: 'Termik santrallerde yakılarak elektrik enerjisi üretilen kahverengi kömür madeni hangisidir? ⛏️', a: 'Linyit ⛏️', d: ['Bor', 'Bakır'], exp: 'Linyit ülkemizde yaygın olarak çıkarılan bir enerji madenidir.' },
      { q: 'Fosilleri inceleyen bilim dalına ne ad verilir? 🦖', a: 'Paleontoloji (Fosil Bilimi) 🦖', d: ['Arkeoloji', 'Meteoroloji'], exp: 'Fosilleri inceleyen uzmanlara paleontolog denir.' },
      { q: 'Aşırı ve dengesiz beslenme ile hareketsiz yaşamın yol açtığı tehlikeli sağlık sorunu nedir? ⚖️', a: 'Obezite (Aşırı Şişmanlık) ⚖️', d: ['Grip', 'Kansızlık'], exp: 'Dengesiz beslenme obeziteye yol açar.' },
      { q: 'Sigara dumanında bulunan ve akciğer kanserine yol açan en zararlı zehirli maddeler nelerdir? 🚭', a: 'Nikotin ve Katran 🚭', d: ['Vitamin ve Mineral', 'Kalsiyum'], exp: 'Sigara dumanında binlerce kanserojen zehir bulunur.' },
      { q: 'Alkol kullanımı öncelikli olarak hangi hayati organımızı tahrip eder ve siroza yol açar? 🍺', a: 'Karaciğer 🩺', d: ['Mide', 'Göz'], exp: 'Alkol karaciğeri zehirleyerek kalıcı hasar verir.' },
      { q: 'Kemik ve dişlerimizin güçlü olması için hangi mineral özellikle gereklidir? 🥛', a: 'Kalsiyum 🥛', d: ['Şeker', 'Katran'], exp: 'Süt ve peynirdeki kalsiyum kemikleri güçlendirir.' },
      { q: 'Güneş\'in sabah doğudan doğup akşam batıdan batıyor gibi görünmesinin sebebi nedir? ☀️', a: 'Dünya\'nın kendi ekseni etrafında batıdan doğuya dönmesi 🌍', d: ['Güneş\'in koşması', 'Ay\'ın durması'], exp: 'Dünya kendi etrafında döndüğü için Güneş gökyüzünde hareket ediyormuş gibi görünür.' },
      { q: 'Fosil oluşumu genellikle hangi tür kayaç tabakalarında gerçekleşir? 🦴', a: 'Tortul Kayaçlar 🦴', d: ['Magma lavları', 'Ateş küre'], exp: 'Lavlar canlıyı yakar; fosiller tortul kayaçlar arasında korunur.' },
      { q: 'Elektrik kablolarının içinde elektriği mükemmel ileten hangi maden kullanılır? 🔌', a: 'Bakır 🔌', d: ['Kömür', 'Kireç'], exp: 'Bakır yüksek iletkenliğiyle kablolarda vazgeçilmezdir.' },
      { q: 'Gözlerimizin karanlıkta daha iyi görmesini sağlayan ve havuçta bolca bulunan vitamin hangisidir? 🥕', a: 'A Vitamini 🥕', d: ['C Vitamini', 'D Vitamini'], exp: 'A vitamini göz retinası için çok faydalıdır.' },
      { q: 'Portakal, limon ve mandalina gibi kış meyvelerinde bolca bulunan bağışıklık vitamini hangisidir? 🍊', a: 'C Vitamini 🍊', d: ['A Vitamini', 'B Vitamini'], exp: 'C vitamini gribe karşı vücut direncini artırır.' }
    ],

    // 4. SINIF: KUVVET, MIKNATISLAR VE BASİT ELEKTRİK DEVRELERİ (30 ÖZGÜN SORU)
    grade4CircuitsMagnetsPool: [
      { q: 'Bir mıknatısın kaç adet manyetik kutbu vardır? 🧲', a: '2 kutbu vardır (N ve S) 🧲', d: ['1 kutbu', '4 kutbu'], exp: 'Mıknatısın Kuzey (N) ve Güney (S) olmak üzere iki kutbu bulunur.' },
      { q: 'İki mıknatısın AYNI KUTUPLARI (N-N veya S-S) birbirine yaklaştırılırsa ne olur? 🧲', a: 'Birbirini İTER ↔️', d: ['Birbirini çeker', 'Yapışır'], exp: 'Aynı kutuplar birbirini iter, zıt kutuplar çeker.' },
      { q: 'İki mıknatısın ZIT KUTUPLARI (N-S) birbirine yaklaştırılırsa ne olur? 🧲', a: 'Birbirini ÇEKER 🧲', d: ['Birbirini iter', 'Hiçbir şey olmaz'], exp: 'Zıt kutuplar birbirini güçlü bir şekilde çeker.' },
      { q: 'Mıknatıs aşağıdaki maddelerden hangisini KESİNLİKLE ÇEKMEZ? 🪵', a: 'Tahta parçası ve plastik 🪵', d: ['Demir çivi 📌', 'Nikel para 🪙'], exp: 'Mıknatıslar demir, nikel, kobaltı çeker; tahta, plastik, camı çekmez.' },
      { q: 'Bir mıknatıs ortadan ikiye kırılırsa yeni oluşan parçalarda ne görülür? 🧲', a: 'Her parçada yine 2 kutup (N ve S) oluşur 🧲', d: ['Mıknatıslık özelliği yok olur', 'Sadece N kutbu kalır'], exp: 'Mıknatıs ne kadar bölünürse bölünsün daima N ve S kutuplarına sahip olur.' },
      { q: 'Yön bulmaya yarayan pusulanın ibresi hangi aletin çalışma prensibine dayanır? 🧭', a: 'Mıknatıs 🧭', d: ['Ayna', 'Pil'], exp: 'Pusula ibresi küçük ve hassas bir mıknatıstır.' },
      { q: 'Rayların üzerinde temas etmeden havada süzülerek giden çok hızlı trenlere ne denir? 🚄', a: 'Maglev (Manyetik Levitasyon) Treni 🚄', d: ['Buharlı Tren', 'Metro'], exp: 'Maglev trenleri güçlü elektromıknatıslarla rayların üstünde uçar gibi gider.' },
      { q: 'Aşağıdakilerden hangisi SAF BİR MADDEDİR? 💧', a: 'Saf su ve tuz 💧🧂', d: ['Meyve salatası 🥗', 'Limonata 🍋'], exp: 'Saf maddeler tek cins atom veya molekülden oluşur; limonata karışımdır.' },
      { q: 'Birden çok maddenin kendi özelliğini kaybetmeden bir araya gelmesiyle ne oluşur? 🥗', a: 'Karışım 🥗', d: ['Saf Madde', 'Element'], exp: 'Salata, ayran ve hava birer karışımdır.' },
      { q: 'Demir tozları ile kum karışımını en kolay hangi yöntemle ayırabiliriz? 🧲', a: 'Mıknatıs kullanarak 🧲', d: ['Suda bekleterek', 'Elekle eleyerek'], exp: 'Mıknatıs demir tozlarını çeker, kum ise geride kalır.' },
      { q: 'Tuzlu sudaki tuzu geri elde etmek için hangi ayırma yöntemi uygulanır? 🧂', a: 'Buharlaştırma ☀️', d: ['Mıknatısla çekme', 'Süzme'], exp: 'Su buharlaştığında kabın dibinde tuz kristalleri kalır.' },
      { q: 'Makarna ile haşlama suyunu birbirinden ayırmak için hangi alet kullanılır? 🍝', a: 'Süzgeç (Süzme yöntemi) 🍝', d: ['Mıknatıs', 'Elek'], exp: 'Katı-sıvı karışımlar süzgeçle süzülür.' },
      { q: 'Basit bir elektrik devresinde elektrik ENERJİSİ KAYNAĞI olan eleman nedir? 🔋', a: 'Pil 🔋', d: ['Ampul 💡', 'Anahtar'], exp: 'Pil kimyasal enerjiyi elektrik enerjisine çevirir.' },
      { q: 'Basit bir elektrik devresinde elektrik enerjisini IŞIĞA çeviren eleman hangisidir? 💡', a: 'Ampul 💡', d: ['Anahtar', 'Kablo'], exp: 'Ampul devre tamamlandığında ışık saçar.' },
      { q: 'Elektrik akımını açıp kapatmaya yarayan (duvardaki lamba düğmesi gibi) devre elemanı nedir? 🎛️', a: 'Anahtar 🎛️', d: ['Pil', 'Duy'], exp: 'Anahtar devreden akım geçişini kontrol eder.' },
      { q: 'Basit bir devrede anahtar AÇIK konumdayken ampul neden IŞIK VERMEZ? 💡', a: 'Devre tamamlanmadığı ve akım geçmediği için ❌', d: ['Pil bittiği için', 'Ampul kırıldığı için'], exp: 'Anahtar açıkken köprü kalkmış gibidir; akım iletilmez.' },
      { q: 'Ampulün devrede vidalanarak takıldığı yuvaya ne ad verilir? 💡', a: 'Duy 💡', d: ['Pil yatağı', 'Sigorta'], exp: 'Ampul duya yerleştirilir.' },
      { q: 'Evimizdeki prizlerde kullanılan şehir elektriği kaç volt gerilime sahiptir? ⚡', a: '220 Volt ⚡', d: ['1.5 Volt', '12 Volt'], exp: 'Evlerdeki prizler 220V yüksek gerilim taşır; asla yabancı cisim sokulmamalıdır!' },
      { q: 'Islak ellerle elektrik anahtarına veya prize dokunmak neden çok tehlikelidir? ⚠️', a: 'Islak ten elektriği ileterek elektrik çarpmasına yol açar ⚡', d: ['Anahtar kirlenir', 'Elektrik faturası artar'], exp: 'Su ve nem elektriği iletir; ölümcül elektrik çarpması riski doğar.' },
      { q: 'Hangisi elektrik akımını İLETEN (İletken) bir maddedir? 🔌', a: 'Bakır tel ve demir çivi 🔌', d: ['Plastik eldiven', 'Kuru tahta'], exp: 'Metaller elektrik akımını çok iyi iletir.' },
      { q: 'Hangisi elektrik akımını İLETMEYEN (Yalıtkan) bir maddedir? 🧤', a: 'Plastik ve kauçuk 🧤', d: ['Bakır', 'Alüminyum folyo'], exp: 'Plastik elektrik teknisyenlerini koruyan yalıtkan bir malzemedir.' },
      { q: 'Buzdolabı kapaklarının kendiliğinden yapışıp kapanmasını sağlayan nedir? 🧲', a: 'Lastik şeritlerin içindeki mıknatıs 🧲', d: ['Yapıştırıcı', 'Kilit mekanizması'], exp: 'Buzdolabı contalarında gizli mıknatıslar bulunur.' },
      { q: 'Çakıl taşı ile kum karışımını birbirinden ayırmak için hangi araç kullanılır? 🏖️', a: 'Elek (Eleme yöntemi) 🏖️', d: ['Mıknatıs', 'Buharlaştırma'], exp: 'Tanecik boyutları farklı katılar elekle ayrılır.' },
      { q: 'Hoparlör, kulaklık ve kapı zillerinin içinde hangi parça ses üretmeye yardımcı olur? 🔊', a: 'Mıknatıs 🧲', d: ['Cam', 'Pil'], exp: 'Hoparlörün diyaframı mıknatısın titreşimiyle ses üretir.' },
      { q: 'Devredeki pillerin güvenle yerleştirildiği plastik kutuya ne ad verilir? 🔋', a: 'Pil Yatağı 🔋', d: ['Duy', 'Anahtar'], exp: 'Piller pil yatağına takılır.' },
      { q: 'Atık pilleri doğaya veya çöpe atmayıp nereye bırakmalıyız? ♻️', a: 'Atık Pil Toplama Kutusuna ♻️', d: ['Denize', 'Toprağa'], exp: 'Pillerdeki ağır kimyasallar toprağa ve yer altı sularına karışmamalıdır.' }
    ],

    // 4. SINIF: BİREY VE TOPLUM & MİLLİ MÜCADELE KAHRAMANLARIMIZ (30 ÖZGÜN SORU)
    grade4IdentityHeroesPool: [
      { q: 'Türkiye Cumhuriyeti vatandaşlarının kimlik belgesinde kaç haneli T.C. Kimlik No bulunur? 🪪', a: '11 Haneli 🪪', d: ['10 Haneli', '12 Haneli'], exp: 'T.C. Kimlik numarası 11 haneden oluşur ve her birey için benzersizdir.' },
      { q: 'Yeni çipli kimlik kartlarımızın üzerindeki küçük elektronik bölüme ne ad verilir? 💳', a: 'Çip (Yonga) 💳', d: ['Barkod', 'Etiket'], exp: 'Çip üzerinde parmak izi gibi güvenli dijital bilgiler saklanır.' },
      { q: 'Olayların oluş sırasına göre zaman dizinine konulmasına ne ad verilir? ⏳', a: 'Kronoloji ⏳', d: ['Biyografi', 'Otobiyografi'], exp: 'Tarihsel sıralamaya kronoloji denir.' },
      { q: 'Kendimizi karşımızdaki kişinin yerine koyarak onun duygularını anlama becerisine ne denir? 🤝', a: 'Empati 🤝', d: ['Bencillik', 'Sempati'], exp: 'Empati kurmak toplumda saygı ve hoşgörüyü pekiştirir.' },
      { q: 'Kurtuluş Savaşı\'mız (Milli Mücadele) Mustafa Kemal Paşa\'nın hangi şehre ayak basmasıyla resmen başlamıştır? 🚢', a: 'Samsun (19 Mayıs 1919) 🚢', d: ['Ankara', 'İzmir'], exp: '19 Mayıs 1919\'da Bandırma Vapuru ile Samsun\'a çıkış kurtuluş meşalesidir.' },
      { q: 'Kurtuluş Savaşı\'nda Doğu Cephesi Komutanı olan ve yetim çocukların babası sayılan kahramanımız kimdir? 🇹🇷', a: 'Kazım Karabekir Paşa 🇹🇷', d: ['İsmet İnönü', 'Ali Fuat Cebesoy'], exp: 'Kazım Karabekir Doğu Cephesi\'nde Ermenileri mağlup etmiş ve Gümrü Antlaşması\'nı imzalamıştır.' },
      { q: 'Güney Cephesi\'nde Kahramanmaraş\'ta Fransız işgalcilere ilk kurşunu sıkarak direnişi başlatan kahraman kimdir? 🇹🇷', a: 'Sütçü İmam 🇹🇷', d: ['Şahin Bey', 'Ali Saip Bey'], exp: 'Sütçü İmam Maraş direnişinin bayrak ismidir.' },
      { q: 'Gaziantep savunmasında düşmana geçit vermemek için canını feda eden kahramanımız kimdir? 🇹🇷', a: 'Şahin Bey 🇹🇷', d: ['Sütçü İmam', 'Hasan Tahsin'], exp: 'Şahin Bey Antep savunmasında kahramanca şehit düşmüştür.' },
      { q: 'İzmir işgal edildiğinde Kordon\'da düşmana ilk kurşunu sıkarak şehit olan gazeteci kahramanımız kimdir? 🇹🇷', a: 'Hasan Tahsin 🇹🇷', d: ['Yörük Ali Efe', 'İsmet İnönü'], exp: 'Hasan Tahsin Batı Cephesi\'nde milli bilinci ateşlemiştir.' },
      { q: 'İnebolu\'dan Kastamonu cephesine kağnısıyla mermi taşırken donarak şehit olan kahraman Türk kadını kimdir? 🇹🇷', a: 'Şerife Bacı 🇹🇷', d: ['Nene Hatun', 'Halide Edip'], exp: 'Şerife Bacı bebeği ve cephaneler üzerindeki örtüyü koruyarak şehit olmuştur.' },
      { q: 'Batı Cephesi\'nde I. ve II. İnönü Savaşlarını kazanan komutanımız kimdir? 🇹🇷', a: 'İsmet İnönü 🇹🇷', d: ['Kazım Karabekir', 'Fevzi Çakmak'], exp: 'İsmet İnönü düşman ordularını durdurmuş ve büyük zaferler kazanmıştır.' },
      { q: 'Türkiye Büyük Millet Meclisi (TBMM) hangi tarihte Ankara\'da açılmıştır? 🏛️', a: '23 Nisan 1920 🏛️', d: ['19 Mayıs 1919', '29 Ekim 1923'], exp: '23 Nisan 1920 milletin kendi kaderine el koyduğu gündür.' },
      { q: 'Türkiye Cumhuriyeti hangi tarihte ilan edilmiştir? 🇹🇷', a: '29 Ekim 1923 🇹🇷', d: ['23 Nisan 1920', '30 Ağustos 1922'], exp: '29 Ekim 1923\'te Cumhuriyet resmen ilan edilmiştir.' },
      { q: 'Düşmanı yurdumuzdan tamamen temizleyen Büyük Taarruz Zaferi hangi gün kazanılmıştır? 🏆', a: '30 Ağustos 1922 🏆', d: ['19 Mayıs', '23 Nisan'], exp: '30 Ağustos Zafer Bayramı olarak coşkuyla kutlanır.' },
      { q: 'Milli Mücadele\'de Aydın yöresinde düşmana karşı destan yazan efelerin lideri kimdir? 🇹🇷', a: 'Yörük Ali Efe 🇹🇷', d: ['Şahin Bey', 'Sütçü İmam'], exp: 'Yörük Ali Efe Kuva-yı Milliye kahramanıdır.' },
      { q: 'Kurtuluş Savaşı\'nda Türk milletinin yazdığı kahramanlık destanını ölümsüzleştiren İstiklal Marşımızın şairi kimdir? 📜', a: 'Mehmet Akif Ersoy 📜', d: ['Ziya Gökalp', 'Yahya Kemal'], exp: 'Milli şairimiz Mehmet Akif Ersoy İstiklal Marşı\'nı orduya ve millete armağan etmiştir.' },
      { q: 'İstiklal Marşı TBMM tarafından hangi tarihte milli marşımız olarak kabul edilmiştir? 📜', a: '12 Mart 1921 📜', d: ['29 Ekim 1923', '23 Nisan 1920'], exp: '12 Mart 1921 İstiklal Marşı\'nın kabul tarihidir.' },
      { q: 'Her insanın parmak izinin birbirine benzememesi neyi kanıtlar? 🖐️', a: 'Her bireyin eşsiz ve benzersiz olduğunu 🖐️', d: ['İnsanların aynı olduğunu', 'Tesadüf olduğunu'], exp: 'Parmak izi dünyadaki 8 milyar insanın tamamında farklıdır.' },
      { q: 'Milli kültürümüzü yansıtan aşağıdaki ögelerden hangisi geleneksel bir içeceğimizdir? ☕', a: 'Türk Kahvesi ve Ayran ☕', d: ['Kola', 'Gazoz'], exp: 'Türk kahvesi UNESCO somut olmayan kültürel miras listesindedir.' },
      { q: 'Kurtuluş Savaşı\'nda cephe gerisindeki kadınların kurduğu cemiyetlerle orduya yardım eden kadın yazarımız kimdir? 📚', a: 'Halide Edib Adıvar 📚', d: ['Sabiha Gökçen', 'Afife Jale'], exp: 'Halide Edip onbaşı ve çavuş rütbeleriyle cephede görev yapmıştır.' },
      { q: 'T.C. Kimlik Kartımızın arka yüzünde hangi resmi imza alanı ve semboller bulunur? 🪪', a: 'Türk Bayrağı ve güvenlik hologramı 🇹🇷', d: ['Futbol amblemi', 'Banka logosu'], exp: 'Ay yıldız ve özel hologramlar sahteciliği önler.' },
      { q: 'Aşağıdakilerden hangisi bir halk oyunu türümüz DEĞİLDİR? 💃', a: 'Tango 💃', d: ['Zeybek 🕺', 'Horon 🌊'], exp: 'Zeybek, horon, halay milli danslarımızdır; tango yabancı danstır.' },
      { q: 'Milli Mücadele\'de düzenli ordu kurulmadan önce halkın oluşturduğu gönüllü direniş birliklerine ne denir? 🇹🇷', a: 'Kuva-yı Milliye (Milli Kuvvetler) 🇹🇷', d: ['Yeniçeri Ocağı', 'Zabıta'], exp: 'Kuva-yı Milliye vatanını savunan sivil halk direnişidir.' },
      { q: 'Mustafa Kemal Atatürk\'ün nüfus cüzdanında doğum yeri olarak hangi şehir yazar? 🏛️', a: 'Selanik 🏛️', d: ['Ankara', 'İstanbul'], exp: 'Mustafa Kemal 1881 yılında Selanik\'te doğmuştur.' },
      { q: 'Resmi belgelerde ve sınavlarda kimliğimizi doğrulamak için kimlik kartında neyin olması zorunludur? 📸', a: 'Biyometrik Fotoğraf 📸', d: ['İmza resmi', 'Boy ölçüsü'], exp: 'Biyometrik fotoğraf kimlik doğrulamanın temel şartıdır.' },
      { q: 'Milli Mücadele\'de Güney Cephesi kahramanlıkları sebebiyle Antep şehrimize TBMM tarafından hangi unvan verilmiştir? 🏅', a: 'Gazi (Gaziantep) 🏅', d: ['Kahraman', 'Şanlı'], exp: 'Antep\'e Gazi, Maraş\'a Kahraman, Urfa\'ya Şanlı unvanı verilmiştir.' }
    ],

    // 4. SINIF: İNSANLAR, YERLER VE ÜRETİMDEN TÜKETİME (25 ÖZGÜN SORU)
    grade4PlacesEconomyPool: [
      { q: 'Meteoroloji Genel Müdürlüğü tarafından yapılan hava tahmin raporlarında gökyüzünde güneş ve bulut sembolü neyi ifade eder? ⛅', a: 'Parçalı Bulutlu ⛅', d: ['Gök Gürültülü Sağanak', 'Karlı'], exp: 'Güneş ve bulut birlikteyse hava parçalı bulutludur.' },
      { q: 'Eğimli arazilerde aşırı yağışlar sonucu toprağın büyük kütleler halinde kaymasına ne ad verilir? ⛰️', a: 'Heyelan (Toprak Kayması) ⛰️', d: ['Deprem', 'Erozyon'], exp: 'Karadeniz gibi eğimli ve çok yağış alan bölgelerde heyelan sık görülür.' },
      { q: 'Dağlık ve dik yamaçlarda biriken kar kütlesinin aşağıya doğru hızla kaymasına ne ad verilir? ❄️', a: 'Çığ ❄️', d: ['Sel', 'Fırtına'], exp: 'Yoğun kar yağışında eğimli yamaçlardan çığ düşebilir.' },
      { q: 'Aşırı yağmur veya eriyen karlar sebebiyle akarsuların yatağından taşarak etrafı sular altında bırakmasına ne denir? 🌊', a: 'Sel 🌊', d: ['Heyelan', 'Kuraklık'], exp: 'Sel baskınları dere yataklarına ev yapıldığında felakete dönüşür.' },
      { q: 'Toprağın rüzgar ve sularla süpürülüp yok olmasını önlemek için yapılacak en etkili çalışma nedir? 🌲', a: 'Ağaçlandırma yapmak (Fidan dikmek) 🌲', d: ['Ağaçları kesmek', 'Bina yapmak'], exp: 'Ağaç kökleri toprağı sıkıca tutarak erozyonu önler.' },
      { q: 'Olası bir depreme karşı evlerimizde mutlaka hazır bulundurmamız gereken çantaya ne denir? 🎒', a: 'Acil Durum ve Deprem Çantası 🎒', d: ['Okul Çantası', 'Piknik Çantası'], exp: 'Deprem çantasında su, fener, düdük, ilk yardım seti ve bisküvi olmalıdır.' },
      { q: 'Deprem sarsıntısı bittikten sonra binadan tahliye olurken hangisi KESİNLİKLE KULLANILMAMALIDIR? 🚫', a: 'Asansör 🚫', d: ['Merdivenler', 'Yangın çıkışı'], exp: 'Deprem anında elektrik kesilebilir veya asansör boşluğa düşebilir; asansöre binilmez!' },
      { q: 'Ailemizin belirli bir süre içindeki gelir ve giderlerini gösteren plana ne ad verilir? 💰', a: 'Aile Bütçesi 💰', d: ['Alışveriş Listesi', 'Fatura'], exp: 'Bütçe, gelire göre harcama yapmayı sağlayan finansal plandır.' },
      { q: 'İnsanın yaşamını sürdürebilmesi için vazgeçilmez olan beslenme, barınma ve giyinmeye ne denir? 🏠', a: 'Temel İhtiyaç 🏠', d: ['Sosyal İstek', 'Lüks Harcama'], exp: 'İhtiyaçlar karşılanmazsa yaşam tehlikeye girer.' },
      { q: 'Olmasa da yaşayabileceğimiz, ancak sahip olmak istediğimiz (pahalı oyuncak, son model telefon) şeylere ne denir? 🎮', a: 'İstek 🎮', d: ['Zorunlu İhtiyaç', 'Vergi'], exp: 'İstekler ihtiyaçlardan sonra bütçeye göre karşılanmalıdır.' },
      { q: 'Bilinçli bir tüketici alışverişe çıkmadan önce parasını doğru harcamak için ne hazırlamalıdır? 📝', a: 'İhtiyaç Listesi 📝', d: ['Fotoğraf albümü', 'Hediye kutusu'], exp: 'Alışveriş listesi gereksiz harcamaları ve israfı önler.' },
      { q: 'Ekmek, su ve elektriğin gereksiz yere fazlaca harcanıp tüketilmesine ne ad verilir? ❌', a: 'İsraf ❌', d: ['Tasarruf', 'Üretim'], exp: 'Kaynakların boş yere harcanması israftır.' },
      { q: 'Geri dönüştürülebilen 1 ton kağıdın geri kazanılması kaç yetişkin ağacın kesilmesini önler? 🌳', a: 'Yaklaşık 17 ağaç 🌳', d: ['1 ağaç', '100 ağaç'], exp: 'Kağıt geri dönüşümü ormanları korumak için muazzam bir katkıdır.' },
      { q: 'Ülkemizde afet ve acil durum yönetimini yürüten resmi devlet kurumu hangisidir? 🚨', a: 'AFAD 🚨', d: ['TSE', 'TÜİK'], exp: 'AFAD, Afet ve Acil Durum Yönetimi Başkanlığı\'dır.' },
      { q: 'Tükettiğimiz domates, buğday ve elma hangi ekonomik faaliyet koluna aittir? 🚜', a: 'Tarım 🚜', d: ['Sanayi', 'Madencilik'], exp: 'Topraktan yetiştirilen bitkisel ürünler tarım sektörüdür.' },
      { q: 'İnek, koyun ve tavuk besleyerek et, süt ve yumurta elde etme faaliyetine ne denir? 🐮', a: 'Hayvancılık 🐮', d: ['Ormancılık', 'Turizm'], exp: 'Hayvansal besinler hayvancılık faaliyetiyle üretilir.' },
      { q: 'Fabrikalarda hammaddelerin işlenerek yeni ürünlere dönüştürülmesine ne ad verilir? 🏭', a: 'Sanayi (Üretim) 🏭', d: ['Ticaret', 'Hizmet'], exp: 'Sanayi tesisleri un, kumaş, araba ve eşya üretir.' },
      { q: 'Doktor, öğretmen, şoför ve avukat gibi doğrudan mal üretmeyip hizmet sunan sektör hangisidir? 💼', a: 'Hizmet Sektörü 💼', d: ['Tarım Sektörü', 'Madencilik'], exp: 'Hizmet sektörü toplumun eğitim, sağlık, ulaşım ihtiyaçlarını karşılar.' },
      { q: 'Bir ürünün bozulması durumunda satıcının tamir veya değişim garantisi verdiği resmi evrak nedir? 📄', a: 'Garanti Belgesi 📄', d: ['Kullanma kılavuzu', 'Reklam broşürü'], exp: 'Garanti belgesi tüketiciyi arızalara karşı korur.' },
      { q: 'Alışverişte aldığımız fiş üzerindeki KDV ibaresi devlete ne ödendiğini gösterir? 🏛️', a: 'Vergi (Katma Değer Vergisi) 🏛️', d: ['Bağış', 'Ceza'], exp: 'Vergiler okullar, yollar ve hastaneler olarak millete geri döner.' },
      { q: 'Deprem sarsıntısı anında başımızı korumak için sağlam bir masanın yanında hangi pozisyonu alırız? 🛡️', a: 'Çök - Kapan - Tutun 🛡️', d: ['Ayağa kalkıp koşmak', 'Pencereden bakmak'], exp: 'Çök-Kapan-Tutun düşen cisimlerden başımızı korur.' },
      { q: 'Orman yangınlarını yetkililere bildirmek için hangi acil çağrı numarası aranır? 🌲🔥', a: '112 Acil Çağrı (Orman Yangın İhbar) 📞', d: ['155', '182'], exp: 'Artık tüm acil durumlar 112 numarasında birleşmiştir.' },
      { q: 'Suyun buharlaşarak atmosfere çıkması ve yağmur olarak yeryüzüne geri dönmesine ne ad verilir? 💧', a: 'Su Döngüsü 💧', d: ['Rüzgar akımı', 'Toprak kayması'], exp: 'Su döngüsü Dünya\'daki tatlı su kaynaklarını yeniler.' },
      { q: 'Tarihi ve doğal güzellikleri görmek için ülkemize gelen turistlerin oluşturduğu gelir kapısına ne ad verilir? 🧳', a: 'Turizm (Bacasız Sanayi) 🧳', d: ['Tarım', 'Madencilik'], exp: 'Turizm ülkemize döviz ve kültürel zenginlik kazandırır.' },
      { q: 'Aşağıdakilerden hangisi çevre kirliliğini ÖNLEYEN bir davranıştır? 🌱', a: 'Toplu taşıma araçlarını tercih etmek 🌱', d: ['Çöpleri yere atmak', 'Naylon poşetleri yakmak'], exp: 'Toplu taşıma karbon salınımını azaltır.' }
    ],

    // 4. SINIF: COUNTRIES, NATIONALITIES, JOBS & ROUTINES (35 ÖZGÜN KELİME & SESLİ)
    grade4CountriesRoutinesPool: [
      { englishWord: 'Turkey', q: 'İngilizce "Turkey" hangi ülkedir? 🇹🇷', a: 'Türkiye 🇹🇷', d: ['Almanya 🇩🇪', 'Fransa 🇫🇷'], exp: 'Turkey = Türkiye demektir.' },
      { englishWord: 'Turkish', q: '"I am from Turkey. I am Turkish." cümlesinde "Turkish" ne anlama gelir? 🇹🇷', a: 'Türk (Milliyet) 🇹🇷', d: ['İngiliz', 'Fransız'], exp: 'Turkish = Türk demektir.' },
      { englishWord: 'England', q: 'İngilizce "England" hangi ülkedir? 🇬🇧', a: 'İngiltere 🇬🇧', d: ['İtalya 🇮🇹', 'İspanya 🇪🇸'], exp: 'England = İngiltere demektir.' },
      { englishWord: 'English', q: '"He is from England. He is English." cümlesinde "English" nedir? 🇬🇧', a: 'İngiliz 🇬🇧', d: ['Alman', 'Japon'], exp: 'English = İngiliz demektir.' },
      { englishWord: 'Germany', q: 'İngilizce "Germany" hangi ülkedir? 🇩🇪', a: 'Almanya 🇩🇪', d: ['Fransa 🇫🇷', 'Rusya 🇷🇺'], exp: 'Germany = Almanya demektir.' },
      { englishWord: 'German', q: '"She is from Germany. She is German." cümlesinde "German" nedir? 🇩🇪', a: 'Alman 🇩🇪', d: ['İtalyan', 'İspanyol'], exp: 'German = Alman demektir.' },
      { englishWord: 'France', q: 'İngilizce "France" hangi ülkedir? 🇫🇷', a: 'Fransa 🇫🇷', d: ['İtalya 🇮🇹', 'Japonya 🇯🇵'], exp: 'France = Fransa demektir.' },
      { englishWord: 'French', q: '"They are from France. They are French." cümlesinde "French" nedir? 🇫🇷', a: 'Fransız 🇫🇷', d: ['Alman', 'İngiliz'], exp: 'French = Fransız demektir.' },
      { englishWord: 'Spain', q: 'İngilizce "Spain" hangi ülkedir? 🇪🇸', a: 'İspanya 🇪🇸', d: ['İtalya 🇮🇹', 'Çin 🇨🇳'], exp: 'Spain = İspanya demektir.' },
      { englishWord: 'Spanish', q: 'İngilizce "Spanish" hangi milliyettir? 🇪🇸', a: 'İspanyol 🇪🇸', d: ['Fransız', 'Alman'], exp: 'Spanish = İspanyol demektir.' },
      { englishWord: 'Italy', q: 'İngilizce "Italy" hangi ülkedir? 🇮🇹', a: 'İtalya 🇮🇹', d: ['İspanya 🇪🇸', 'Yunanistan 🇬🇷'], exp: 'Italy = İtalya demektir.' },
      { englishWord: 'Italian', q: 'İngilizce "Italian" hangi milliyettir? 🇮🇹', a: 'İtalyan 🇮🇹', d: ['Alman', 'Fransız'], exp: 'Italian = İtalyan demektir.' },
      { englishWord: 'Japan', q: 'İngilizce "Japan" hangi Asya ülkesidir? 🇯🇵', a: 'Japonya 🇯🇵', d: ['Çin 🇨🇳', 'Kore 🇰🇷'], exp: 'Japan = Japonya demektir.' },
      { englishWord: 'Japanese', q: 'İngilizce "Japanese" hangi millettir? 🇯🇵', a: 'Japon 🇯🇵', d: ['Çinli', 'Koreli'], exp: 'Japanese = Japon demektir.' },
      { englishWord: 'China', q: 'İngilizce "China" hangi ülkedir? 🇨🇳', a: 'Çin 🇨🇳', d: ['Japonya 🇯🇵', 'Hindistan 🇮🇳'], exp: 'China = Çin demektir.' },
      { englishWord: 'Doctor', q: 'İngilizce "Doctor" hangi meslektir? 🩺', a: 'Doktor 🩺', d: ['Öğretmen 👨‍🏫', 'Pilot ✈️'], exp: 'Doctor = Doktor demektir.' },
      { englishWord: 'Teacher', q: 'İngilizce "Teacher" hangi meslektir? 👨‍🏫', a: 'Öğretmen 👨‍🏫', d: ['Polis 👮', 'Aşçı 👨‍🍳'], exp: 'Teacher = Öğretmen demektir.' },
      { englishWord: 'Pilot', q: 'İngilizce "Pilot" ne iş yapar? ✈️', a: 'Uçak kullanır (Pilot) ✈️', d: ['Gemi kullanır', 'Yemek yapar'], exp: 'Pilot = Pilot (Uçak sürücüsü) demektir.' },
      { englishWord: 'Firefighter', q: 'İngilizce "Firefighter" hangi cesur meslektir? 🚒', a: 'İtfaiyeci 🚒', d: ['Polis 👮', 'Çiftçi 🚜'], exp: 'Firefighter = İtfaiyeci demektir.' },
      { englishWord: 'Police officer', q: 'İngilizce "Police officer" hangi meslektir? 👮', a: 'Polis Memuru 👮', d: ['Doktor 🩺', 'Hemşire 👩‍⚕️'], exp: 'Police officer = Polis memuru demektir.' },
      { englishWord: 'Vet', q: 'İngilizce "Vet (Veterinarian)" hangi hayvan dostu doktordur? 🐾', a: 'Veteriner 🐾', d: ['Diş hekimi 🦷', 'Aşçı 👨‍🍳'], exp: 'Vet = Veteriner hekim demektir.' },
      { englishWord: 'Chef', q: 'İngilizce "Chef" hangi meslektir? 👨‍🍳', a: 'Aşçı / Şef 👨‍🍳', d: ['Garson ☕', 'Çiftçi 🚜'], exp: 'Chef = Aşçı demektir.' },
      { englishWord: 'Farmer', q: 'İngilizce "Farmer" tarlada çalışan hangi meslektir? 🚜', a: 'Çiftçi 🚜', d: ['Mühendis', 'Bahçıvan'], exp: 'Farmer = Çiftçi demektir.' },
      { englishWord: 'Nurse', q: 'İngilizce "Nurse" hastanedeki hangi sağlık çalışanıdır? 👩‍⚕️', a: 'Hemşire 👩‍⚕️', d: ['Doktor 🩺', 'Eczacı 💊'], exp: 'Nurse = Hemşire demektir.' },
      { englishWord: 'Get up', q: 'İngilizce "I get up early in the morning." cümlesinde "Get up" nedir? ⏰', a: 'Uyanmak / Yataktan kalkmak ⏰', d: ['Uyumak 😴', 'Kahvaltı yapmak 🍳'], exp: 'Get up = Yataktan kalkmak demektir.' },
      { englishWord: 'Brush teeth', q: 'İngilizce "I brush my teeth." ne anlama gelir? 🪥', a: 'Dişlerimi fırçalarım. 🪥', d: ['Yüzümü yıkarım. 🧼', 'Giyinirim. 👕'], exp: 'Brush teeth = Diş fırçalamak demektir.' },
      { englishWord: 'Have breakfast', q: 'İngilizce "Have breakfast" hangi öğündür? 🍳', a: 'Kahvaltı yapmak 🍳', d: ['Öğle yemeği 🥪', 'Akşam yemeği 🍲'], exp: 'Breakfast = Kahvaltı demektir.' },
      { englishWord: 'Go to school', q: 'İngilizce "I go to school by bus." cümlesi ne demektir? 🚌', a: 'Okula otobüsle giderim. 🚌', d: ['Okuldan eve dönerim.', 'Parka giderim.'], exp: 'Go to school = Okula gitmek demektir.' },
      { englishWord: 'Do homework', q: 'İngilizce "Do homework" hangi okul rutinidir? 📝', a: 'Ödev yapmak 📝', d: ['Oyun oynamak 🎮', 'Kitap almak 📚'], exp: 'Do homework = Ödev yapmak demektir.' },
      { englishWord: 'What time is it', q: '"What time is it? — It is four o\'clock." Saat kaçtır? ⏰', a: 'Saat 04:00 (Dört) ⏰', d: ['Saat 04:30', 'Saat 05:00'], exp: 'Four o\'clock = Saat tam dört demektir.' },
      { englishWord: 'Half past', q: '"It is half past two." ifadesi dijital saatte hangisidir? ⏰', a: '02:30 ⏰', d: ['02:15', '03:00'], exp: 'Half past = Buçuk demektir. Half past two = İki buçuk (02:30).' },
      { englishWord: 'Where are you from', q: '"Where are you from?" sorusunun Türkçe karşılığı nedir? 🗺️', a: 'Nerelisin? (Hangi ülkedensin?) 🗺️', d: ['Adın ne?', 'Kaç yaşındasın?'], exp: '"Where are you from?" nereli olduğunu sorar.' },
      { englishWord: 'Sleep', q: 'İngilizce "I go to bed and sleep at ten." ne anlatır? 😴', a: 'Saat onda yatağa gider ve uyurum. 😴', d: ['Saat onda uyanırım.', 'Saat onda yemek yerim.'], exp: 'Sleep = Uyumak demektir.' },
      { englishWord: 'Sing a song', q: 'İngilizce "Singer" (şarkıcı) ne yapar? 🎤', a: 'Sings a song (Şarkı söyler) 🎤', d: ['Drives a car', 'Flies a plane'], exp: 'Singer şarkıcı demektir.' },
      { englishWord: 'Read a book', q: 'İngilizce "I read a book every evening." ne demektir? 📖', a: 'Her akşam kitap okurum. 📖', d: ['Her sabah koşarım.', 'Kitap yazarım.'], exp: 'Read a book = Kitap okumak demektir.' }
    ],

    // -------------------------------------------------------------
    // KARMA MATEMATİK FONKSİYONLARI (3. VE 4. SINIF)
    // -------------------------------------------------------------
    generateGrade3Math() {
      const r = Math.random();
      if (r < 0.35) {
        return this.generateGrade3MultDiv();
      } else if (r < 0.70) {
        return this.generateGrade3RomenAndPlace();
      } else {
        const item = this.drawFromPool(this.grade3FractionsAndShapesPool, "grade3FractionsAndShapesPool");
        return {
          question: item.q,
          correct: item.a,
          distractors: item.d,
          explanation: item.exp
        };
      }
    },

    generateGrade4Math() {
      const r = Math.random();
      if (r < 0.35) {
        return this.generateGrade4DigitsOperations();
      } else if (r < 0.70) {
        return this.generateGrade4PerimeterArea();
      } else {
        const item = this.drawFromPool(this.grade4FractionsAnglesPool, "grade4FractionsAnglesPool");
        return {
          question: item.q,
          correct: item.a,
          distractors: item.d,
          explanation: item.exp
        };
      }
    },

    // -------------------------------------------------------------
    // 1. SINIF: İLK OKUMA YAZMA HAVUZU
    // -------------------------------------------------------------
    firstReadingPool: [
      { q: '"🍎 Elma" sözcüğünün ilk harfi / sesi hangisidir?', a: 'E', d: ['A', 'M'], exp: 'Elma sözcüğü "E" sesiyle başlar: E-l-m-a. 🍎' },
      { q: '"🚗 Araba" sözcüğünün ilk harfi / sesi hangisidir?', a: 'A', d: ['O', 'B'], exp: 'Araba sözcüğü "A" harfiyle başlar: A-r-a-b-a. 🚗' },
      { q: '"K - A - L - E - M" sesleri birleşince hangi kelime oluşur?', a: 'Kalem', d: ['Kelam', 'Kitap'], exp: 'K-A-L-E-M harfleri bir araya geldiğinde "Kalem" kelimesini oluşturur. ✏️' },
      { q: '"🐱 Kedi" kelimesi kaç heceden oluşur?', a: '2 Hece (Ke - di)', d: ['1 Hece', '3 Hece'], exp: 'Ke-di kelimesinde 2 ünlü harf (e, i) vardır ve 2 heceden oluşur. 🐱' },
      { q: '"Okul" sözcüğünün ilk hecesi hangisidir?', a: 'O', d: ['Ok', 'Kul'], exp: 'Okul sözcüğü "O - kul" şeklinde hecelerine ayrılır. İlk hecesi "O"dur. 🏫' },
      { q: 'Hangisi BÜYÜK "M" harfidir?', a: 'M', d: ['n', 'u'], exp: 'M harfi büyük yazıldığında "M" şeklinde yazılır.' },
      { q: 'Küçük "d" harfinin BÜYÜK hali hangisidir?', a: 'D', d: ['B', 'P'], exp: 'Küçük "d" harfinin büyük yazılışı "D"dir.' },
      { q: '"A - N - N - E" harfleri birleşince ne okunur?', a: 'Anne', d: ['Nine', 'Nane'], exp: 'A-N-N-E harfleri birleştiğinde canımız "Anne"miz olur. ❤️' },
      { q: '"Balık" kelimesinde kaç tane "A" harfi vardır?', a: '1 Tane', d: ['2 Tane', 'Hiç Yok'], exp: 'B-A-L-I-K sözcüğünde 1 tane "A" harfi vardır. 🐟' },
      { q: 'Hangisi bir sesli (ünlü) harftir?', a: 'A', d: ['K', 'T'], exp: 'Türkçemizde a, e, ı, i, o, ö, u, ü sesli (ünlü) harflerdir.' },
      { q: '"🌟 Yıldız" kelimesinin son harfi nedir?', a: 'Z', d: ['Y', 'S'], exp: 'Yıldız sözcüğünün son sesi "Z" harfidir. ⭐' },
      { q: '"K - İ - T - A - P" harfleri birleştiğinde ne oluşur?', a: 'Kitap', d: ['Kip', 'Katip'], exp: 'K-İ-T-A-P harfleri birleşince "Kitap" okunur. 📚' }
    ],

    // -------------------------------------------------------------
    // 1., 2. & 3. SINIF: HAYAT BİLGİSİ HAVUZU
    // -------------------------------------------------------------
    lifeSciencePool: [
      { q: 'Yemeklerden önce ve sonra sağlığımız için ne yapmalıyız?', a: 'Ellerimizi sabunla yıkamalıyız 🧼', d: ['Hemen uyumalıyız', 'Oyun oynamalıyız'], exp: 'Mikroplardan korunmak için yemekten önce ve sonra eller mutlaka sabunla yıkanmalıdır. 🧼', grade: 1 },
      { q: 'Sınıfta öğretmenimizden veya arkadaşımızdan söz isterken ne yaparız?', a: 'Parmak kaldırırız ✋', d: ['Bağırarak konuşuruz', 'Ayağa kalkıp gezeriz'], exp: 'Sınıf kuralı olarak söz hakkı almak için nezaketle parmak kaldırırız. ✋', grade: 1 },
      { q: 'Trafikte karşıdan karşıya geçerken nereden geçmeliyiz?', a: 'Yaya geçidinden 🚶‍♂️', d: ['Arabaların arasından', 'Yolun ortasından'], exp: 'Can güvenliğimiz için yaya geçidi, alt veya üst geçitleri kullanmalıyız. 🚦', grade: 1 },
      { q: 'Türkiye Cumhuriyeti\'nin kurucusu ve ilk Cumhurbaşkanı kimdir?', a: 'Mustafa Kemal Atatürk 🇹🇷', d: ['Fatih Sultan Mehmet', 'Mehmet Akif Ersoy'], exp: 'Cumhuriyetimizin kurucusu ulu önder Gazi Mustafa Kemal Atatürk\'tür. 🇹🇷', grade: 1 },
      { q: 'Sağlıklı büyümek ve gelişmek için sabahları ne yapmalıyız?', a: 'Dengeli kahvaltı yapmalıyız 🥚', d: ['Sadece şeker yemeliyiz', 'Hiçbir şey yememeliyiz'], exp: 'Güne zinde başlamak için yumurta, süt, peynir içeren kahvaltı çok önemlidir. 🍳', grade: 1 },
      { q: 'Acil bir sağlık yardımı veya ambulans gerektiğinde hangi numara aranır?', a: '112 Acil Çağrı 🚑', d: ['155', '110'], exp: 'Ülkemizde tüm acil durumlar tek bir numarada, 112 Acil Çağrı Merkezi\'nde birleştirilmiştir. 🚑', grade: 2 },
      { q: 'Evimizde ve okulumuzda elektrik ve suyu boşa harcamamaya ne denir?', a: 'Tasarruf 💡', d: ['İsraf', 'Tüketim'], exp: 'Kaynaklarımızı bilinçli ve gerektiği kadar kullanmaya tasarruf denir. 💡', grade: 2 },
      { q: 'Kullanılmış kağıt, cam ve plastikleri çöpe değil nereye atmalıyız?', a: 'Geri Dönüşüm Kutusuna ♻️', d: ['Sokağa', 'Denize'], exp: 'Doğayı korumak ve ağaçları kurtarmak için geri dönüşüm kutularını kullanırız. ♻️', grade: 2 },
      { q: 'Şanlı bayrağımızın üzerindeki beyaz semboller nelerdir?', a: 'Hilal (Ay) ve Yıldız 🌙⭐', d: ['Güneş ve Bulut', 'Kartal ve Yıldız'], exp: 'Al bayrağımızın üzerinde bembeyaz bir hilal (ay) ve beş köşeli yıldız yer alır. 🇹🇷', grade: 2 },
      { q: 'Deprem sarsıntısı başladığında güvenli bir yerde hangi hareketi yaparız?', a: 'Çök - Kapan - Tutun 🛡️', d: ['Koşarak balkona çıkmak', 'Asansöre binmek'], exp: 'Deprem anında sağlam bir eşyanın yanında Çök-Kapan-Tutun pozisyonu hayat kurtarır. 🛡️', grade: 3 },
      { q: 'İlçemizi yöneten en yetkili mülki idare amiri kimdir?', a: 'Kaymakam 🏛️', d: ['Muhtar', 'Belediye Zabıtası'], exp: 'İlçelerde devleti temsil eden ve ilçeyi yöneten en yetkili amir Kaymakamdır. 🏛️', grade: 3 },
      { q: 'Pusula ibresinin renkli ucu daima hangi yönü gösterir?', a: 'Kuzey 🧭', d: ['Güney', 'Doğu'], exp: 'Pusula ibresi dünyanın manyetik alanı sayesinde daima Kuzeyi gösterir. 🧭', grade: 3 }
    ],

    // -------------------------------------------------------------
    // 3. & 4. SINIF: FEN BİLİMLERİ HAVUZU
    // -------------------------------------------------------------
    sciencePool: [
      { q: 'Dünyamızın uzaydan çekilen fotoğraflarına göre şekli neye benzer?', a: 'Küreye (Geoit) 🌍', d: ['Düz bir tepsiye', 'Küp şekline'], exp: 'Dünyamız kutuplardan hafif basık, ekvatordan şişkin küre (geoit) biçimindedir. 🌍', grade: 3 },
      { q: 'Çevremizdeki sesleri algılamamızı sağlayan duyu organımız hangisidir?', a: 'Kulak 👂', d: ['Göz', 'Burun'], exp: 'İşitme duyusu organımız kulaktır. 👂', grade: 3 },
      { q: 'Mıknatıs aşağıdaki maddelerden hangisini ÇEKER?', a: 'Demir çiviyi 🧲', d: ['Plastik cetveli', 'Tahta kaşığı'], exp: 'Mıknatıslar demir, nikel ve kobalt gibi maddeleri güçlü bir şekilde çeker. 🧲', grade: 3 },
      { q: 'Hareketsiz bir topu durduğu yerden hareket ettirmek için ne uygularız?', a: 'İtme kuvveti ⚽', d: ['Çekme kuvveti', 'Durdurma kuvveti'], exp: 'Topa ayağımızla vurduğumuzda itme kuvveti uygularız. ⚽', grade: 3 },
      { q: 'Işık olmadan göremeyiz. Dünyamızın en büyük doğal ışık kaynağı nedir?', a: 'Güneş ☀️', d: ['Ay', 'Ampul'], exp: 'Güneş hem doğal ışık hem de ısı kaynağımızdır. (Ay sadece Güneş ışığını yansıtır). ☀️', grade: 3 },
      { q: 'Vücudumuza gereken enerjiyi sağlayan temel besin grubu hangisidir?', a: 'Karbonhidratlar (Ekmek, Makarna) 🍞', d: ['Vitaminler', 'Mineraller'], exp: 'Karbonhidratlar vücudumuzun öncelikli enerji deposudur. 🍞⚡', grade: 4 },
      { q: 'Yaralarımızın iyileşmesini, büyüme ve gelişmemizi sağlayan besin hangisidir?', a: 'Proteinler (Et, Süt, Yumurta) 🥩', d: ['Yağlar', 'Şekerler'], exp: 'Proteinler vücudumuzun yapıcı ve onarıcı besin maddeleridir. 🥛🍳', grade: 4 },
      { q: 'Suyun ısı kaybederek katı (buz) hale geçmesine ne ad verilir?', a: 'Donma ❄️', d: ['Erime', 'Buharlaşma'], exp: 'Sıvı su sıfır derecenin altına soğuduğunda donarak buza dönüşür. 🧊', grade: 4 },
      { q: 'Basit bir elektrik devresinde elektrik akımını açıp kapatmaya yarayan eleman nedir?', a: 'Anahtar 💡', d: ['Pil', 'Bağlantı kablosu'], exp: 'Anahtar devreyi açarak veya kapatıp akımı kontrol eder. 💡', grade: 4 },
      { q: 'Dünya\'nın kendi ekseni etrafında 1 tam tur dönmesiyle ne oluşur?', a: 'Gece ve Gündüz (24 Saat) ⏳', d: ['Mevsimler (1 Yıl)', 'Gelgit Olayı'], exp: 'Dünya\'nın kendi etrafında dönmesi 24 saat sürer ve 1 gün, yani gece-gündüz oluşur. 🌍', grade: 4 },
      { q: 'Aşağıdakilerden hangisi saf bir maddedir?', a: 'Saf Su 💧', d: ['Limonata', 'Salata'], exp: 'Saf su içinde başka madde barındırmayan tek cins maddedir; limonata ise karışımdır. 💧', grade: 4 }
    ],

    // -------------------------------------------------------------
    // 4. SINIF: SOSYAL BİLGİLER HAVUZU
    // -------------------------------------------------------------
    socialPool: [
      { q: 'Her Türkiye Cumhuriyeti vatandaşının sahip olduğu 11 haneli resmi belge nedir?', a: 'T.C. Kimlik Kartı 🪪', d: ['Öğrenci Karnesi', 'Kütüphane Kartı'], exp: 'T.C. Kimlik Kartı her vatandaşa özel eşsiz 11 haneli kimlik numarası taşır. 🪪', grade: 4 },
      { q: 'Güneş\'in doğduğu yöne sağ kolumuzu uzatırsak, önümüz hangi yönü gösterir?', a: 'Kuzey 🧭', d: ['Güney', 'Batı'], exp: 'Sağ kol doğu, sol kol batı, önümüz kuzey, arkamız ise güneydir. 🧭', grade: 4 },
      { q: 'Kurtuluş Savaşı\'nda cepheye kağnısıyla mermi taşırken şehit olan kahraman Türk kadını kimdir?', a: 'Şerife Bacı 🇹🇷', d: ['Sabiha Gökçen', 'Halide Edip'], exp: 'Şerife Bacı ve nice kahraman kadınımız Milli Mücadele\'nin unutulmaz simgeleridir. 🇹🇷', grade: 4 },
      { q: 'Hangisi kültürümüze ait geleneksel bir zeka ve strateji oyunudur?', a: 'Mangala 🎯', d: ['Bilgisayar Oyunu', 'Bowling'], exp: 'Mangala Türk tarihinin en köklü zeka ve strateji oyunlarındandır. 🎯', grade: 4 },
      { q: 'Bilinçli bir tüketici olarak bir ürün satın aldığımızda mutlaka ne istemeliyiz?', a: 'Fiş veya Fatura 🧾', d: ['Hediye Paketi', 'Poşet'], exp: 'Fiş ve fatura alışverişin yasal belgesidir, vergi gelirini ve tüketici hakkını korur. 🧾', grade: 4 },
      { q: 'T.S.E. (Türk Standartları Enstitüsü) damgası bir ürün üzerinde neyi gösterir?', a: 'Ürünün kaliteli ve güvenli olduğunu 🛡️', d: ['Ürünün bedava olduğunu', 'Yurt dışından geldiğini'], exp: 'TSE damgası ürünün Türk standartlarına uygun ve güvenli olduğunu belgeler. 🛡️', grade: 4 },
      { q: 'Ülkemizin başkenti neresidir?', a: 'Ankara 🏛️', d: ['İstanbul', 'İzmir'], exp: 'Türkiye Cumhuriyeti\'nin başkenti Ankara\'dır. 🏛️', grade: 4 },
      { q: 'Bireylerin kendilerini başkalarının yerine koyarak anlamasına ne denir?', a: 'Empati 🤝', d: ['Bencillik', 'Kıskançlık'], exp: 'Empati, karşımızdaki kişinin duygu ve düşüncelerini anlayabilme becerisidir. 🤝', grade: 4 }
    ],

    // -------------------------------------------------------------
    // İLKOKUL İNGİLİZCE (ENGLISH) HAVUZLARI & KELİME EŞLEŞTİRME
    // -------------------------------------------------------------
    // 1) Renkler (Colors)
    englishColorsPool: [
      { englishWord: 'Red', q: 'İngilizce "Red" hangi renktir? 🔴', a: 'Kırmızı 🔴', d: ['Mavi 🔵', 'Sarı 🟡'], exp: 'Red = Kırmızı demektir. 🔴' },
      { englishWord: 'Blue', q: 'İngilizce "Blue" hangi renktir? 🔵', a: 'Mavi 🔵', d: ['Yeşil 🟢', 'Kırmızı 🔴'], exp: 'Blue = Mavi demektir. 🔵' },
      { englishWord: 'Yellow', q: 'İngilizce "Yellow" hangi renktir? 🟡', a: 'Sarı 🟡', d: ['Mor 🟣', 'Turuncu 🟠'], exp: 'Yellow = Sarı demektir. 🟡' },
      { englishWord: 'Green', q: 'İngilizce "Green" hangi renktir? 🟢', a: 'Yeşil 🟢', d: ['Mavi 🔵', 'Siyah ⚫'], exp: 'Green = Yeşil demektir. 🟢' },
      { englishWord: 'Orange', q: 'İngilizce "Orange" hangi renktir? 🟠', a: 'Turuncu 🟠', d: ['Sarı 🟡', 'Pembe 🌸'], exp: 'Orange = Turuncu demektir (aynı zamanda portakal). 🟠' },
      { englishWord: 'Purple', q: 'İngilizce "Purple" hangi renktir? 🟣', a: 'Mor 🟣', d: ['Kırmızı 🔴', 'Kahverengi 🟤'], exp: 'Purple = Mor demektir. 🟣' },
      { englishWord: 'Pink', q: 'İngilizce "Pink" hangi renktir? 🌸', a: 'Pembe 🌸', d: ['Beyaz ⚪', 'Mavi 🔵'], exp: 'Pink = Pembe demektir. 🌸' },
      { englishWord: 'Black', q: 'İngilizce "Black" hangi renktir? ⚫', a: 'Siyah ⚫', d: ['Gri 🔘', 'Beyaz ⚪'], exp: 'Black = Siyah demektir. ⚫' },
      { englishWord: 'White', q: 'İngilizce "White" hangi renktir? ⚪', a: 'Beyaz ⚪', d: ['Sarı 🟡', 'Kırmızı 🔴'], exp: 'White = Beyaz demektir. ⚪' },
      { englishWord: 'Brown', q: 'İngilizce "Brown" hangi renktir? 🟤', a: 'Kahverengi 🟤', d: ['Siyah ⚫', 'Yeşil 🟢'], exp: 'Brown = Kahverengi demektir. 🟤' },
      { englishWord: 'Red', q: '"Kırmızı" 🔴 renginin İngilizce karşılığı hangisidir?', a: 'Red 🔴', d: ['Blue 🔵', 'Green 🟢'], exp: 'Kırmızı rengi İngilizce "Red" demektir. 🔴' },
      { englishWord: 'Green', q: '"Yeşil" 🟢 renginin İngilizce karşılığı hangisidir?', a: 'Green 🟢', d: ['Yellow 🟡', 'Purple 🟣'], exp: 'Yeşil rengi İngilizce "Green" demektir. 🟢' },
      { englishWord: 'Blue', q: '"Mavi" 🔵 renginin İngilizce karşılığı hangisidir?', a: 'Blue 🔵', d: ['Black ⚫', 'Pink 🌸'], exp: 'Mavi rengi İngilizce "Blue" demektir. 🔵' }
    ],

    // 2) Hayvanlar (Animals)
    englishAnimalsPool: [
      { englishWord: 'Cat', q: 'İngilizce "Cat" hangi sevimli dostumuzdur? 🐱', a: 'Kedi 🐱', d: ['Köpek 🐶', 'Kuş 🐦'], exp: 'Cat = Kedi demektir. 🐱' },
      { englishWord: 'Dog', q: 'İngilizce "Dog" hangi sadık dostumuzdur? 🐶', a: 'Köpek 🐶', d: ['Kedi 🐱', 'Tavşan 🐰'], exp: 'Dog = Köpek demektir. 🐶' },
      { englishWord: 'Bird', q: 'İngilizce "Bird" gökyüzündeki hangi hayvandır? 🐦', a: 'Kuş 🐦', d: ['Balık 🐟', 'Kelebek 🦋'], exp: 'Bird = Kuş demektir. 🐦' },
      { englishWord: 'Fish', q: 'İngilizce "Fish" suda yüzen hangi canlıdır? 🐟', a: 'Balık 🐟', d: ['Kurbağa 🐸', 'Kaplumbağa 🐢'], exp: 'Fish = Balık demektir. 🐟' },
      { englishWord: 'Lion', q: 'İngilizce "Lion" ormanların kralı hangi hayvandır? 🦁', a: 'Aslan 🦁', d: ['Kaplan 🐯', 'Ayı 🐻'], exp: 'Lion = Aslan demektir. 🦁' },
      { englishWord: 'Elephant', q: 'İngilizce "Elephant" hortumlu dev dostumuz kimdir? 🐘', a: 'Fil 🐘', d: ['Zürafa 🦒', 'Ayı 🐻'], exp: 'Elephant = Fil demektir. 🐘' },
      { englishWord: 'Monkey', q: 'İngilizce "Monkey" muz seven sevimli hayvan kimdir? 🐵', a: 'Maymun 🐵', d: ['Sincap 🐿️', 'Panda 🐼'], exp: 'Monkey = Maymun demektir. 🐵' },
      { englishWord: 'Rabbit', q: 'İngilizce "Rabbit" havuç seven zıp zıp hayvan kimdir? 🐰', a: 'Tavşan 🐰', d: ['Köpek 🐶', 'Fare 🐭'], exp: 'Rabbit = Tavşan demektir. 🐰' },
      { englishWord: 'Bear', q: 'İngilizce "Bear" bal seven orman dostumuz kimdir? 🐻', a: 'Ayı 🐻', d: ['Kurt 🐺', 'Aslan 🦁'], exp: 'Bear = Ayı demektir. 🐻' },
      { englishWord: 'Horse', q: 'İngilizce "Horse" hızlı koşan asil hayvan hangisidir? 🐴', a: 'At 🐴', d: ['İnek 🐮', 'Koyun 🐑'], exp: 'Horse = At demektir. 🐴' },
      { englishWord: 'Duck', q: 'İngilizce "Duck" vak vak sesli sevimli hayvan kimdir? 🦆', a: 'Ördek 🦆', d: ['Tavuk 🐔', 'Kaz 🦢'], exp: 'Duck = Ördek demektir. 🦆' },
      { englishWord: 'Cow', q: 'İngilizce "Cow" bize süt veren çiftlik dostumuz kimdir? 🐮', a: 'İnek 🐮', d: ['Koyun 🐑', 'Keçi 🐐'], exp: 'Cow = İnek demektir. 🐮' },
      { englishWord: 'Lion', q: '"Aslan" 🦁 hayvanının İngilizce adı hangisidir?', a: 'Lion 🦁', d: ['Bear 🐻', 'Tiger 🐯'], exp: 'Aslan İngilizce "Lion" demektir. 🦁' },
      { englishWord: 'Rabbit', q: '"Tavşan" 🐰 hayvanının İngilizce adı hangisidir?', a: 'Rabbit 🐰', d: ['Duck 🦆', 'Dog 🐶'], exp: 'Tavşan İngilizce "Rabbit" demektir. 🐰' }
    ],

    // 3) Sayılar (Numbers)
    englishNumbersPool: [
      { englishWord: 'One', q: 'İngilizce "One" hangi sayıdır? 1️⃣', a: '1 (Bir) 1️⃣', d: ['2 (İki) 2️⃣', '3 (Üç) 3️⃣'], exp: 'One = 1 (Bir) demektir. 1️⃣' },
      { englishWord: 'Two', q: 'İngilizce "Two" hangi sayıdır? 2️⃣', a: '2 (İki) 2️⃣', d: ['3 (Üç) 3️⃣', '1 (Bir) 1️⃣'], exp: 'Two = 2 (İki) demektir. 2️⃣' },
      { englishWord: 'Three', q: 'İngilizce "Three" hangi sayıdır? 3️⃣', a: '3 (Üç) 3️⃣', d: ['4 (Dört) 4️⃣', '2 (İki) 2️⃣'], exp: 'Three = 3 (Üç) demektir. 3️⃣' },
      { englishWord: 'Four', q: 'İngilizce "Four" hangi sayıdır? 4️⃣', a: '4 (Dört) 4️⃣', d: ['5 (Beş) 5️⃣', '3 (Üç) 3️⃣'], exp: 'Four = 4 (Dört) demektir. 4️⃣' },
      { englishWord: 'Five', q: 'İngilizce "Five" hangi sayıdır? 5️⃣', a: '5 (Beş) 5️⃣', d: ['6 (Altı) 6️⃣', '4 (Dört) 4️⃣'], exp: 'Five = 5 (Beş) demektir. 5️⃣' },
      { englishWord: 'Six', q: 'İngilizce "Six" hangi sayıdır? 6️⃣', a: '6 (Altı) 6️⃣', d: ['7 (Yedi) 7️⃣', '8 (Sekiz) 8️⃣'], exp: 'Six = 6 (Altı) demektir. 6️⃣' },
      { englishWord: 'Seven', q: 'İngilizce "Seven" hangi sayıdır? 7️⃣', a: '7 (Yedi) 7️⃣', d: ['6 (Altı) 6️⃣', '9 (Dokuz) 9️⃣'], exp: 'Seven = 7 (Yedi) demektir. 7️⃣' },
      { englishWord: 'Eight', q: 'İngilizce "Eight" hangi sayıdır? 8️⃣', a: '8 (Sekiz) 8️⃣', d: ['7 (Yedi) 7️⃣', '10 (On) 🔟'], exp: 'Eight = 8 (Sekiz) demektir. 8️⃣' },
      { englishWord: 'Nine', q: 'İngilizce "Nine" hangi sayıdır? 9️⃣', a: '9 (Dokuz) 9️⃣', d: ['6 (Altı) 6️⃣', '8 (Sekiz) 8️⃣'], exp: 'Nine = 9 (Dokuz) demektir. 9️⃣' },
      { englishWord: 'Ten', q: 'İngilizce "Ten" hangi sayıdır? 🔟', a: '10 (On) 🔟', d: ['9 (Dokuz) 9️⃣', '11 (On Bir) 🔢'], exp: 'Ten = 10 (On) demektir. 🔟' },
      { englishWord: 'Twelve', q: 'İngilizce "Twelve" hangi sayıdır? 🔢', a: '12 (On İki) 🔢', d: ['11 (On Bir) 🔢', '20 (Yirmi) 🔢'], exp: 'Twelve = 12 (On İki) demektir. 🔢' },
      { englishWord: 'Twenty', q: 'İngilizce "Twenty" hangi sayıdır? 🔢', a: '20 (Yirmi) 🔢', d: ['12 (On İki) 🔢', '10 (On) 🔟'], exp: 'Twenty = 20 (Yirmi) demektir. 🔢' },
      { englishWord: 'Five', q: '"5" (Beş) 5️⃣ sayısının İngilizce okunuşu hangisidir?', a: 'Five 5️⃣', d: ['Four 4️⃣', 'Six 6️⃣'], exp: '5 sayısı İngilizce "Five" olarak okunur. 5️⃣' },
      { englishWord: 'Eight', q: '"8" (Sekiz) 8️⃣ sayısının İngilizce okunuşu hangisidir?', a: 'Eight 8️⃣', d: ['Seven 7️⃣', 'Nine 9️⃣'], exp: '8 sayısı İngilizce "Eight" olarak okunur. 8️⃣' }
    ],

    // 4) Günlük İfadeler (Greetings & Daily Expressions)
    englishGreetingsPool: [
      { englishWord: 'Hello', q: 'İngilizce "Hello" ne anlama gelir? 👋', a: 'Merhaba 👋', d: ['Güle güle 👋', 'Teşekkürler 🙏'], exp: 'Hello = Merhaba / Selam demektir. 👋' },
      { englishWord: 'Good morning', q: 'İngilizce "Good morning" ne anlama gelir? ☀️', a: 'Günaydın ☀️', d: ['İyi geceler 🌙', 'İyi akşamlar 🌆'], exp: 'Good morning = Günaydın demektir. ☀️' },
      { englishWord: 'Good night', q: 'İngilizce "Good night" ne anlama gelir? 🌙', a: 'İyi geceler 🌙', d: ['Günaydın ☀️', 'Tünaydın 🌤️'], exp: 'Good night = İyi geceler demektir. 🌙' },
      { englishWord: 'Goodbye', q: 'İngilizce "Goodbye" ne anlama gelir? 👋', a: 'Hoşça kal / Güle güle 👋', d: ['Hoş geldin 🌟', 'Nasılsın? 😊'], exp: 'Goodbye = Hoşça kal, güle güle demektir. 👋' },
      { englishWord: 'Thank you', q: 'İngilizce "Thank you" ne anlama gelir? 🙏', a: 'Teşekkür ederim 🙏', d: ['Lütfen ✨', 'Özür dilerim 🥺'], exp: 'Thank you = Teşekkür ederim demektir. 🙏' },
      { englishWord: 'How are you?', q: 'İngilizce "How are you?" ne sormaktadır? 😊', a: 'Nasılsın? 😊', d: ['Adın ne? ❓', 'Kaç yaşındasın? 🎂'], exp: '"How are you?" sorusu "Nasılsın?" anlamına gelir. 😊' },
      { englishWord: 'I am fine', q: '"How are you?" (Nasılsın) sorusuna İngilizce nasıl "İyiyim" denir? 👍', a: 'I am fine, thank you! 👍', d: ['Goodbye! 👋', 'My name is Ali. 👦'], exp: '"I am fine, thank you" = İyiyim, teşekkürler demektir. 👍' },
      { englishWord: 'Nice to meet you', q: 'İngilizce "Nice to meet you" ne anlama gelir? 🤝', a: 'Tanıştığıma memnun oldum 🤝', d: ['Görüşürüz 👋', 'Nerede oturuyorsun? 🏠'], exp: 'Nice to meet you = Tanıştığıma memnun oldum demektir. 🤝' },
      { englishWord: 'Please', q: 'İngilizce kibarca bir şey isterken "Please" ne demektir? ✨', a: 'Lütfen ✨', d: ['Pardon ✋', 'Tamam 👍'], exp: 'Please = Lütfen anlamına gelen sihirli kelimedir. ✨' },
      { englishWord: 'Welcome', q: 'Kapıda veya girişte yazan "Welcome" ne demektir? 🌟', a: 'Hoş geldiniz 🌟', d: ['Güle güle 👋', 'Görüşmek üzere 👋'], exp: 'Welcome = Hoş geldiniz demektir. 🌟' },
      { englishWord: 'See you', q: 'Ayrılırken söylenen "See you later" ne demektir? 👋', a: 'Sonra görüşmek üzere 👋', d: ['Hoş geldiniz 🌟', 'Günaydın ☀️'], exp: 'See you later = Sonra görüşmek üzere demektir. 👋' },
      { englishWord: 'Good morning', q: 'Sabah arkadaşımıza İngilizce nasıl "Günaydın" deriz? ☀️', a: 'Good morning! ☀️', d: ['Good evening! 🌆', 'Good night! 🌙'], exp: 'Sabahları "Good morning!" (Günaydın) denir. ☀️' }
    ],

    // Genel İngilizce Karma Havuz (2., 3. ve 4. Sınıf Genel)
    englishPool: [
      { englishWord: 'Red', q: '"Kırmızı" renginin İngilizcesi nedir? 🔴', a: 'Red 🔴', d: ['Blue 🔵', 'Yellow 🟡'], exp: 'Kırmızı = Red, Mavi = Blue, Sarı = Yellow. 🔴', grade: 2 },
      { englishWord: 'Hello', q: '"Hello! How are you?" sorusuna en kibar ve doğru cevap hangisidir?', a: "I'm fine, thank you! 😊", d: ["Goodbye!", "My name is Ali."], exp: '"Nasılsın?" sorusuna "İyiyim, teşekkür ederim" (I\'m fine, thank you) denir. 😊', grade: 2 },
      { englishWord: 'Four', q: '"One, two, three, ...?" Sıradaki sayı hangisidir? 🔢', a: 'Four (4) 4️⃣', d: ['Five (5) 5️⃣', 'Six (6) 6️⃣'], exp: '1: One, 2: Two, 3: Three, 4: Four! 🔢', grade: 2 },
      { englishWord: 'Cat', q: '"Cat" İngilizce hangi sevimli dostumuzdur? 🐾', a: 'Kedi 🐱', d: ['Köpek 🐶', 'Kuş 🐦'], exp: 'Cat = Kedi, Dog = Köpek, Bird = Kuş. 🐱', grade: 2 },
      { englishWord: 'Good morning', q: 'Sabahları birine İngilizce nasıl "Günaydın" deriz? ☀️', a: 'Good morning! ☀️', d: ['Good night! 🌙', 'Good evening! 🌆'], exp: 'Good morning = Günaydın! Good night = İyi geceler! ☀️', grade: 2 },
      { englishWord: 'Pencil', q: '"Pencil" hangi okul eşyamızdır? ✏️', a: 'Kurşun Kalem ✏️', d: ['Silgi 🧼', 'Okul Çantası 🎒'], exp: 'Pencil = Kurşun Kalem, Eraser = Silgi, Bag = Çanta. ✏️', grade: 3 },
      { englishWord: 'Book', q: '"Book" sözcüğünün Türkçe anlamı nedir? 📚', a: 'Kitap 📚', d: ['Defter 📓', 'Masa 🪑'], exp: 'Book = Kitap, Notebook = Defter, Desk = Sıra/Masa. 📚', grade: 3 },
      { englishWord: 'Mother', q: '"Family" ailemizi anlatır. "Mother" kimdir? 👩', a: 'Anne 👩', d: ['Baba 👨', 'Kız Kardeş 👧'], exp: 'Mother = Anne, Father = Baba, Sister = Kız Kardeş. 👩❤️', grade: 3 },
      { englishWord: 'What time is it?', q: '"What time is it?" sorusu ne anlama gelir? ⏰', a: 'Saat kaç? ⏰', d: ['Adın ne? ❓', 'Kaç yaşındasın? 🎂'], exp: '"What time is it?" saat sormak için kullanılır. ⏰', grade: 4 },
      { englishWord: 'Teacher', q: '"Teacher" mesleği Türkçe ne demektir? 👨‍🏫', a: 'Öğretmen 👨‍🏫', d: ['Doktor 👩‍⚕️', 'Polis 👮'], exp: 'Teacher = Öğretmen, Doctor = Doktor, Police = Polis. 👨‍🏫', grade: 4 },
      { englishWord: 'Turkey', q: '"Where are you from?" sorusuna Türkiye\'den biri nasıl cevap verir? 🇹🇷', a: "I am from Turkey 🇹🇷", d: ["I am 10 years old", "I like apples"], exp: '"Nerelisin?" sorusuna "I am from Turkey" (Türkiyeliyim) denir. 🇹🇷', grade: 4 }
    ],

    // -------------------------------------------------------------
    // DOĞRU / YANLIŞ REFLEKS HAVUZU (36+ MEB MÜFREDAT SORUSU)
    // -------------------------------------------------------------
    trueFalsePool: [
      // Fen Bilimleri & Doğa
      { q: "Örümceklerin 8 bacağı vardır.", a: true, subject: 'science', exp: "Doğrudur! Örümcekler 8 bacaklı eklembacaklılardır (böcekler 6 bacaklıdır)." },
      { q: "Güneş, Dünya'mıza en yakın yıldızdır.", a: true, subject: 'science', exp: "Doğrudur! Güneş, Samanyolu Galaksisi'nde Dünya'ya en yakın yıldızdır." },
      { q: "Balıklar akciğerleriyle solunum yapar.", a: false, subject: 'science', exp: "Yanlıştır! Balıklar solungaçlarıyla solunum yaparlar." },
      { q: "Bitkiler fotosentez yaparak oksijen üretir.", a: true, subject: 'science', exp: "Doğrudur! Bitkiler Güneş ışığı ve karbondioksit kullanarak oksijen üretir." },
      { q: "Su 0 derecede kaynar.", a: false, subject: 'science', exp: "Yanlıştır! Su 0 derecede donar, 100 derecede kaynar." },
      { q: "Dünya'nın kendi etrafında dönmesiyle mevsimler oluşur.", a: false, subject: 'science', exp: "Yanlıştır! Kendi etrafında dönmesiyle gece-gündüz, Güneş etrafında dolanmasıyla mevsimler oluşur." },
      { q: "Yarasalar uçabilen memeli hayvanlardır.", a: true, subject: 'science', exp: "Doğrudur! Yarasalar yumurtlamaz, doğurarak çoğalan memeli canlılardır." },
      { q: "Mıknatısların aynı kutupları birbirini çeker.", a: false, subject: 'science', exp: "Yanlıştır! Mıknatıslarda aynı kutuplar birbirini iter, zıt kutuplar çeker." },
      { q: "Penguenler uçabilen kuşlardır.", a: false, subject: 'science', exp: "Yanlıştır! Penguenler uçamazlar, ancak buzlu sularda çok hızlı yüzerler." },
      { q: "Ay, Dünya'mızın tek doğal uydusudur.", a: true, subject: 'science', exp: "Doğrudur! Ay, Dünya'nın tek doğal uydusudur." },
      // Matematik
      { q: "Üçgenin 3 köşesi ve 3 kenarı vardır.", a: true, subject: 'math', exp: "Doğrudur! Üçgen 3 kenar ve 3 köşeye sahiptir." },
      { q: "Bir saat 50 dakikadır.", a: false, subject: 'math', exp: "Yanlıştır! Bir saat tam 60 dakikadır." },
      { q: "5 × 5 = 25 eder.", spokenText: "5 kere 5 eşittir 25 eder.", a: true, subject: 'math', exp: "Doğrudur! 5 kere 5 eşittir 25." },
      { q: "Karenin 4 kenar uzunluğu birbirine eşittir.", a: true, subject: 'math', exp: "Doğrudur! Karenin tüm kenarları eşit uzunluktadır." },
      { q: "En küçük iki basamaklı sayı 11'dir.", a: false, subject: 'math', exp: "Yanlıştır! En küçük iki basamaklı doğal sayı 10'dur." },
      { q: "Bir yılda 12 ay vardır.", a: true, subject: 'math', exp: "Doğrudur! Bir yıl Ocak'tan Aralık'a 12 aydır." },
      { q: "80 sayısı 8 onluktan oluşur.", a: true, subject: 'math', exp: "Doğrudur! 8 onluk = 80 eder." },
      { q: "Çift sayıların birler basamağında 1, 3, 5, 7 veya 9 bulunur.", a: false, subject: 'math', exp: "Yanlıştır! Bunlar tek sayılardır. Çift sayılar 0, 2, 4, 6, 8 ile biter." },
      { q: "Bir haftada 7 gün vardır.", a: true, subject: 'math', exp: "Doğrudur! Pazartesi'den Pazar'a haftada 7 gün vardır." },
      { q: "100 kuruş, 1 Türk Lirası'na eşittir.", a: true, subject: 'math', exp: "Doğrudur! 100 kuruş = 1 TL eder." },
      // Türkçe & Dil Bilgisi
      { q: "'Kara' ve 'Siyah' kelimeleri eş anlamlıdır.", a: true, subject: 'turkish', exp: "Doğrudur! Kara ve siyah aynı anlamı taşır." },
      { q: "Soru bildiren cümlelerin sonuna nokta konur.", a: false, subject: 'turkish', exp: "Yanlıştır! Soru bildiren cümlelerin sonuna soru işareti (?) konur." },
      { q: "Türkçemizde 8 tane sesli (ünlü) harf vardır.", a: true, subject: 'turkish', exp: "Doğrudur! a, e, ı, i, o, ö, u, ü olmak üzere 8 ünlü harf vardır." },
      { q: "'Geniş' kelimesinin zıt anlamlısı 'Dardır'.", a: true, subject: 'turkish', exp: "Doğrudur! Geniş sözcüğünün zıttı dardır." },
      { q: "'Kitaplık' kelimesi 2 hecelidir.", a: false, subject: 'turkish', exp: "Yanlıştır! Ki-tap-lık tam 3 hecelidir." },
      { q: "Özel isimlerin ilk harfi her zaman büyük yazılır.", a: true, subject: 'turkish', exp: "Doğrudur! Ali, Ankara, Türkiye gibi özel adlar büyük harfle başlar." },
      // Hayat Bilgisi & Sosyal
      { q: "Türkiye Cumhuriyeti'nin başkenti İstanbul'dur.", a: false, subject: 'lifescience', exp: "Yanlıştır! Başkentimiz Ankara'dır." },
      { q: "Trafik ışıklarında kırmızı 'DUR', yeşil 'GEÇ' anlamına gelir.", a: true, subject: 'lifescience', exp: "Doğrudur! Kırmızı dur, sarı hazırlan, yeşil geç demektir." },
      { q: "Sonbahar mevsiminde ağaçlar yeşerir ve çiçek açar.", a: false, subject: 'lifescience', exp: "Yanlıştır! Ağaçlar ilkbaharda yeşerir, sonbaharda yaprak döker." },
      { q: "Atatürk, 19 Mayıs 1919'da Samsun'a çıkmıştır.", a: true, subject: 'lifescience', exp: "Doğrudur! Milli Mücadele'nin başlangıcı 19 Mayıs 1919 Samsun'dur." },
      { q: "Yemeklerden önce ve sonra ellerimizi yıkamalıyız.", a: true, subject: 'lifescience', exp: "Doğrudur! Sağlığımız ve mikroplardan korunmak için eller yıkanmalıdır." },
      // İngilizce
      { q: "'Apple' kelimesi Türkçede 'Elma' demektir.", a: true, subject: 'english', exp: "Doğrudur! Apple = Elma demektir." },
      { q: "'Blue' kelimesi Türkçede 'Kırmızı' anlamına gelir.", a: false, subject: 'english', exp: "Yanlıştır! Blue = Mavi demektir (Kırmızı = Red)." },
      { q: "'Dog' kelimesi 'Köpek' demektir.", a: true, subject: 'english', exp: "Doğrudur! Dog = Köpek demektir." },
      { q: "'School' kelimesi Türkçede 'Hastane' demektir.", a: false, subject: 'english', exp: "Yanlıştır! School = Okul demektir (Hospital = Hastane)." }
    ],

    // -------------------------------------------------------------
    // DOKUN VE EŞLEŞTİR (MATCHING) HAVUZU (12+ TEMATİK SET)
    // -------------------------------------------------------------
    matchingPool: [
      {
        subject: 'english',
        title: '🐾 Animals (İngilizce Hayvanlar)',
        explanation: 'Harika eşleştirme! İngilizce hayvan isimlerini eksiksiz bildin! 🐾👏',
        pairs: [
          { id: 'm1', left: '🐱 Cat', right: 'Kedi' },
          { id: 'm2', left: '🐶 Dog', right: 'Köpek' },
          { id: 'm3', left: '🐦 Bird', right: 'Kuş' },
          { id: 'm4', left: '🐟 Fish', right: 'Balık' }
        ]
      },
      {
        subject: 'english',
        title: '🎒 Classroom & School (Okul Eşyaları)',
        explanation: 'Süper başarı! Sınıf eşyalarının İngilizce karşılıklarını eşleştirdin! 🎒✨',
        pairs: [
          { id: 'm1', left: '📖 Book', right: 'Kitap' },
          { id: 'm2', left: '✏️ Pencil', right: 'Kurşun Kalem' },
          { id: 'm3', left: '🏫 School', right: 'Okul' },
          { id: 'm4', left: '👨‍🏫 Teacher', right: 'Öğretmen' }
        ]
      },
      {
        subject: 'english',
        title: '🎨 Colors (İngilizce Renkler)',
        explanation: 'Renk uzmanı! İngilizce renklerin tamamını doğru birleştirdin! 🎨🌟',
        pairs: [
          { id: 'm1', left: '🔴 Red', right: 'Kırmızı' },
          { id: 'm2', left: '🔵 Blue', right: 'Mavi' },
          { id: 'm3', left: '🟡 Yellow', right: 'Sarı' },
          { id: 'm4', left: '🟢 Green', right: 'Yeşil' }
        ]
      },
      {
        subject: 'math',
        title: 'Matematik İşlem ve Sonuçları',
        explanation: 'Şimşek hızında hesaplama! İşlemleri sonuçlarıyla eşleştirdin! 🔢⚡',
        pairs: [
          { id: 'm1', left: '4 + 5', right: '9' },
          { id: 'm2', left: '6 × 2', right: '12' },
          { id: 'm3', left: '15 - 7', right: '8' },
          { id: 'm4', left: '20 ÷ 4', right: '5' }
        ]
      },
      {
        subject: 'math',
        title: '📐 Geometrik Şekiller ve Kenarlar',
        explanation: 'Geometri dehası! Şekilleri özellikleri ile doğru eşleştirdin! 📐🏆',
        pairs: [
          { id: 'm1', left: '🔺 Üçgen', right: '3 Kenar / 3 Köşe' },
          { id: 'm2', left: '🟦 Kare', right: '4 Eşit Kenar' },
          { id: 'm3', left: '⭕ Çember', right: '0 Köşe' },
          { id: 'm4', left: '⬟ Beşgen', right: '5 Kenar' }
        ]
      },
      {
        subject: 'turkish',
        title: '🔄 Zıt Anlamlı Kelimeler',
        explanation: 'Kelimelerin tam karşıtlarını şıp diye buldun! 🔄👏',
        pairs: [
          { id: 'm1', left: '🔥 Sıcak', right: '❄️ Soğuk' },
          { id: 'm2', left: '🐘 Büyük', right: '🐭 Küçük' },
          { id: 'm3', left: '🦒 Uzun', right: '🦔 Kısa' },
          { id: 'm4', left: '⚡ Hızlı', right: '🐢 Yavaş' }
        ]
      },
      {
        subject: 'turkish',
        title: '✨ Eş Anlamlı Kelimeler',
        explanation: 'Anlamdaş sözcükleri kusursuz eşleştirdin! ✨🎉',
        pairs: [
          { id: 'm1', left: '🔴 Al', right: 'Kırmızı' },
          { id: 'm2', left: '🏫 Mektep', right: 'Okul' },
          { id: 'm3', left: '🤍 Ak', right: 'Beyaz' },
          { id: 'm4', left: '🎁 Hediye', right: 'Armağan' }
        ]
      },
      {
        subject: 'lifescience',
        title: '🌍 Ülkeler ve Başkentler',
        explanation: 'Genel kültür şampiyonu! Ülkeleri başkentleriyle eşleştirdin! 🌍🇹🇷',
        pairs: [
          { id: 'm1', left: '🇹🇷 Türkiye', right: 'Ankara' },
          { id: 'm2', left: '🇫🇷 Fransa', right: 'Paris' },
          { id: 'm3', left: '🇬🇧 İngiltere', right: 'Londra' },
          { id: 'm4', left: '🇩🇪 Almanya', right: 'Berlin' }
        ]
      },
      {
        subject: 'science',
        title: '🐾 Canlılar ve Yaşam Alanları',
        explanation: 'Doğa dostu! Canlıları yuvalarıyla doğru birleştirdin! 🌿🐾',
        pairs: [
          { id: 'm1', left: '🐦 Kuş', right: 'Yuva' },
          { id: 'm2', left: '🐝 Arı', right: 'Kovan' },
          { id: 'm3', left: '🐠 Balık', right: 'Deniz' },
          { id: 'm4', left: '🐜 Karınca', right: 'Karınca Yuvası' }
        ]
      },
      {
        subject: 'science',
        title: '👀 Duyu Organlarımız ve Görevleri',
        explanation: 'Biyoloji ustası! Duyu organlarımızı başarıyla eşleştirdin! 👀🧠',
        pairs: [
          { id: 'm1', left: '👀 Göz', right: 'Görme Duyusu' },
          { id: 'm2', left: '👂 Kulak', right: 'İşitme Duyusu' },
          { id: 'm3', left: '👃 Burun', right: 'Koklama Duyusu' },
          { id: 'm4', left: '👅 Dil', right: 'Tat Alma Duyusu' }
        ]
      },
      {
        subject: 'math',
        title: '✖️ Çarpım Tablosu İkizleri',
        explanation: 'Çarpma şampiyonu! Çarpım sonuçlarını şimşek gibi eşleştirdin! ✖️⚡',
        pairs: [
          { id: 'm1', left: '3 × 3', right: '9' },
          { id: 'm2', left: '4 × 4', right: '16' },
          { id: 'm3', left: '5 × 5', right: '25' },
          { id: 'm4', left: '6 × 6', right: '36' }
        ]
      },
      {
        subject: 'lifescience',
        title: '⏰ Zaman Ölçüleri Eşleştirmesi',
        explanation: 'Zaman ustası! Zaman birimlerini doğru karşılıklarıyla eşleştirdin! ⏰🌟',
        pairs: [
          { id: 'm1', left: '1 Saat', right: '60 Dakika' },
          { id: 'm2', left: '1 Hafta', right: '7 Gün' },
          { id: 'm3', left: '1 Yıl', right: '12 Ay' },
          { id: 'm4', left: '1 Gün', right: '24 Saat' }
        ]
      }
    ],

    // -------------------------------------------------------------
    // İNTERAKTİF GENERATOR: DOĞRU / YANLIŞ REFLEKS
    // -------------------------------------------------------------
    generateTrueFalseQuestion(grade, categoryFilter = null) {
      let pool = this.trueFalsePool;
      if (categoryFilter) {
        const filtered = pool.filter(item => item.subject === categoryFilter);
        if (filtered.length > 0) pool = filtered;
      }
      const item = this.drawFromPool(pool, 'trueFalsePool_' + (categoryFilter || 'all'));
      const statement = item.q;
      const isTrue = item.a;

      return {
        type: 'true_false',
        question: statement,
        statement: statement,
        isTrue: isTrue,
        correct: isTrue ? 'DOĞRU' : 'YANLIŞ',
        options: ['DOĞRU', 'YANLIŞ'],
        explanation: item.exp,
        category: '⚡ Doğru / Yanlış Refleks',
        timeLimit: 6000,
        spokenText: `${item.spokenText || statement}. Doğru mu, yanlış mı?`,
        interactiveData: {
          statement: statement,
          isTrue: isTrue,
          timeLimit: 6000
        }
      };
    },

    // -------------------------------------------------------------
    // İNTERAKTİF GENERATOR: DOKUN VE EŞLEŞTİR (MATCHING)
    // -------------------------------------------------------------
    generateMatchingQuestion(grade, categoryFilter = null) {
      let pool = this.matchingPool;
      if (categoryFilter) {
        const filtered = pool.filter(item => item.subject === categoryFilter);
        if (filtered.length > 0) pool = filtered;
      }
      const item = this.drawFromPool(pool, 'matchingPool_' + (categoryFilter || 'all'));
      const pairs = this.fisherYatesShuffle(item.pairs);

      return {
        type: 'matching',
        question: item.title || 'Dokun ve Eşleştir!',
        options: [],
        correct: 'Tüm Eşleşmeler',
        explanation: item.explanation || 'Harika eşleştirme! Bütün çiftleri başarıyla birleştirdin! 🧩👏',
        category: '🧩 Dokun ve Eşleştir',
        spokenText: `${item.title}. Kutulara dokunarak doğru ikilileri eşleştir.`,
        interactiveData: {
          title: item.title,
          pairs: pairs
        }
      };
    },

    // Şıkları rastgele karıştırarak A, B, C, D formatında sun (Ezber Bozan Fisher-Yates)
    buildQuestionItem(qData, category) {
      if (!qData) return null;
      const question = qData.question || qData.q;
      const correct = qData.correct !== undefined ? qData.correct : qData.a;
      const distractors = qData.distractors || qData.d || [];
      const explanation = qData.explanation !== undefined ? qData.explanation : qData.exp;
      const spokenText = qData.spokenText || qData.spoken || (qData.englishWord ? qData.englishWord : null);

      const allOpts = (qData.options && qData.options.length) ? qData.options : [correct, ...distractors];
      const options = (qData.options && qData.options.length) ? qData.options : this.fisherYatesShuffle(allOpts);

      let questionHtml = qData.questionHtml;
      if (!questionHtml && qData.englishWord) {
        questionHtml = `
          <div class="english-card-badge">
            <span class="en-flag-pill">🇬🇧 LISTEN & MATCH</span>
            <span class="en-big-word">${replaceEmojisWith3D(qData.englishWord, 'inline-3d-icon')}</span>
            <span class="en-audio-hint">🔊 Doğru telaffuzu dinle</span>
          </div>
          <div class="en-question-subtext">${replaceEmojisWith3D(question, 'q-3d-item')}</div>
        `;
      }

      return {
        question: question,
        questionHtml: questionHtml || (question ? question.replace(/\n/g, '<br>') : ''),
        options: options,
        correct: correct,
        explanation: explanation,
        category: qData.category || category,
        audioKey: qData.audioKey || null,
        englishWord: qData.englishWord || null,
        lang: qData.lang || (qData.englishWord ? 'en' : 'tr'),
        spokenText: spokenText,
        type: qData.type || 'standard',
        visualCards: qData.visualCards || (qData.interactiveData ? qData.interactiveData.cards : null),
        interactiveData: qData.interactiveData || null
      };
    },

    // -------------------------------------------------------------
    // DERS DIŞI 1: FARKLI OLANI YAKALA (GÖRSEL DİKKAT DÜELLOSU)
    // -------------------------------------------------------------
    generateOddOneQuestion(grade) {
      const g = parseInt(grade, 10);
      let pairPool;
      let totalCount;
      let cols;

      if (g === 0) {
        // Anasınıfı: 3x3 (9 eleman), çok bariz ve sevimli zıtlıklar
        totalCount = 9;
        cols = 3;
        pairPool = [
          { base: { emoji: '🍎', name: 'Elma' }, diff: { emoji: '🍅', name: 'Domates' }, extra: { emoji: '🍌', name: 'Muz' } },
          { base: { emoji: '🐶', name: 'Köpek' }, diff: { emoji: '🐱', name: 'Kedi' }, extra: { emoji: '🐰', name: 'Tavşan' } },
          { base: { emoji: '🚗', name: 'Araba' }, diff: { emoji: '✈️', name: 'Uçak' }, extra: { emoji: '🚲', name: 'Bisiklet' } },
          { base: { emoji: '☀️', name: 'Güneş' }, diff: { emoji: '🌙', name: 'Hilal' }, extra: { emoji: '⭐', name: 'Yıldız' } },
          { base: { emoji: '🎈', name: 'Balon' }, diff: { emoji: '🎁', name: 'Hediye' }, extra: { emoji: '🎉', name: 'Kutlama' } },
          { base: { emoji: '🍓', name: 'Çilek' }, diff: { emoji: '🍒', name: 'Kiraz' }, extra: { emoji: '🍇', name: 'Üzüm' } },
          { base: { emoji: '🐸', name: 'Kurbağa' }, diff: { emoji: '🦆', name: 'Ördek' }, extra: { emoji: '🐟', name: 'Balık' } }
        ];
      } else if (g === 1 || g === 2) {
        // 1. ve 2. Sınıf: 3x3 (9 eleman), görsel benzerliği yüksek emojiler
        totalCount = 9;
        cols = 3;
        pairPool = [
          { base: { emoji: '😀', name: 'Gülümseyen' }, diff: { emoji: '😅', name: 'Terleyen' }, extra: { emoji: '😂', name: 'Gülen' } },
          { base: { emoji: '🐱', name: 'Kedi' }, diff: { emoji: '🐯', name: 'Kaplan' }, extra: { emoji: '🦁', name: 'Aslan' } },
          { base: { emoji: '🚗', name: 'Kırmızı Araba' }, diff: { emoji: '🚙', name: 'Mavi Araba' }, extra: { emoji: '🚕', name: 'Taksi' } },
          { base: { emoji: '🌸', name: 'Pembe Çiçek' }, diff: { emoji: '🌺', name: 'Kırmızı Çiçek' }, extra: { emoji: '🌻', name: 'Ayçiçeği' } },
          { base: { emoji: '🍪', name: 'Kurabiye' }, diff: { emoji: '🍩', name: 'Donut' }, extra: { emoji: '🧁', name: 'Kek' } },
          { base: { emoji: '🍐', name: 'Armut' }, diff: { emoji: '🥑', name: 'Avokado' }, extra: { emoji: '🍏', name: 'Yeşil Elma' } },
          { base: { emoji: '🌕', name: 'Dolunay' }, diff: { emoji: '🌖', name: 'Şişkin Ay' }, extra: { emoji: '🌗', name: 'Yarım Ay' } },
          { base: { emoji: '🦋', name: 'Kelebek' }, diff: { emoji: '🐝', name: 'Arı' }, extra: { emoji: '🐞', name: 'Uğur Böceği' } }
        ];
      } else {
        // 3. ve 4. Sınıf: 3x4 (12 eleman), dikkat gerektiren zorlu semboller
        totalCount = 12;
        cols = 4;
        pairPool = [
          { base: { emoji: '🕒', name: 'Saat 3:00' }, diff: { emoji: '🕓', name: 'Saat 4:00' }, extra: { emoji: '🕔', name: 'Saat 5:00' } },
          { base: { emoji: '⛵', name: 'Yelkenli' }, diff: { emoji: '🚤', name: 'Sürat Teknesi' }, extra: { emoji: '🛳️', name: 'Gemi' } },
          { base: { emoji: '🎈', name: 'Kırmızı Balon' }, diff: { emoji: '🏮', name: 'Kırmızı Fener' }, extra: { emoji: '💡', name: 'Lamba' } },
          { base: { emoji: '🔷', name: 'Mavi Elmas' }, diff: { emoji: '🔶', name: 'Turuncu Elmas' }, extra: { emoji: '🔹', name: 'Küçük Elmas' } },
          { base: { emoji: '🔒', name: 'Kilitli' }, diff: { emoji: '🔓', name: 'Açık Kilit' }, extra: { emoji: '🔑', name: 'Anahtar' } },
          { base: { emoji: '⏰', name: 'Çalar Saat' }, diff: { emoji: '⏱️', name: 'Kronometre' }, extra: { emoji: '⏳', name: 'Kum Saati' } },
          { base: { emoji: '🍎', name: 'Kırmızı Elma' }, diff: { emoji: '🍏', name: 'Yeşil Elma' }, extra: { emoji: '🍑', name: 'Şeftali' } },
          { base: { emoji: '💎', name: 'Pırlanta' }, diff: { emoji: '💍', name: 'Yüzük' }, extra: { emoji: '👑', name: 'Taç' } }
        ];
      }

      const pair = pairPool[Math.floor(Math.random() * pairPool.length)];
      const items = Array(totalCount).fill(pair.base.emoji);
      const diffIndex = Math.floor(Math.random() * totalCount);
      items[diffIndex] = pair.diff.emoji;

      const gridHtml = `
        <div style="font-size:0.92rem; color:#ea580c; font-weight:800; margin-bottom:4px; display:inline-flex; align-items:center; gap:6px;">${replaceEmojisWith3D('👀', 'chip-3d-icon')} GÖRSEL DİKKAT DÜELLOSU</div>
        <div class="grid-visual-box" style="grid-template-columns: repeat(${cols}, 1fr); max-width: ${cols === 4 ? '280px' : '220px'};">
          ${items.map(em => `<span>${replaceEmojisWith3D(em, 'grid-3d-item')}</span>`).join('')}
        </div>
        <div style="font-size:1.15rem; font-weight:900; margin-top:6px;">Bu grupta DİĞERLERİNDEN FARKLI olan hangisidir?</div>
      `;

      return {
        question: `Farklı olanı yakala: ${pair.diff.emoji}`,
        questionHtml: gridHtml,
        correct: `${pair.diff.emoji} ${pair.diff.name}`,
        distractors: [
          `${pair.base.emoji} ${pair.base.name}`,
          `${pair.extra.emoji} ${pair.extra.name}`
        ],
        explanation: `Süper dikkat! Grupta saklanan farklı sembol ${pair.diff.emoji} (${pair.diff.name}) idi! 👏🎯`,
        audioKey: 'q_farkli_olan'
      };
    },

    // -------------------------------------------------------------
    // DERS DIŞI 2: RENK TUZAKLARI (STROOP DİKKAT TESTİ)
    // -------------------------------------------------------------
    generateStroopQuestion(grade) {
      const g = parseInt(grade, 10);

      if (g === 0) {
        // Anasınıfı: Doğrudan görsel 3D renk & büyüklük tanıma
        const kindergartenStroop = [
          {
            html: '<div style="margin:6px auto;"><img src="assets/icons/3d/red_circle.webp" class="q-3d-fruit" alt="Kırmızı Daire"></div><div style="font-weight:900; font-size:1.2rem;">Bu sevimli daire hangi renktir?</div>',
            correct: '🔴 Kırmızı',
            distractors: ['🔵 Mavi', '🟡 Sarı'],
            exp: 'Kırmızı, elmanın ve uğur böceğinin rengidir! 🍎',
            audioKey: 'q_daire_kirmizi'
          },
          {
            html: '<div style="margin:6px auto;"><img src="assets/icons/3d/blue_circle.webp" class="q-3d-fruit" alt="Mavi Daire"></div><div style="font-weight:900; font-size:1.2rem;">Bu parlak daire hangi renktir?</div>',
            correct: '🔵 Mavi',
            distractors: ['🟢 Yeşil', '🔴 Kırmızı'],
            exp: 'Mavi, engin gökyüzünün ve denizlerin rengidir! 🌊',
            audioKey: 'q_daire_mavi'
          },
          {
            html: '<div style="margin:6px auto;"><img src="assets/icons/3d/yellow_circle.webp" class="q-3d-fruit" alt="Sarı Daire"></div><div style="font-weight:900; font-size:1.2rem;">Bu sıcacık daire hangi renktir?</div>',
            correct: '🟡 Sarı',
            distractors: ['🟣 Mor', '🟠 Turuncu'],
            exp: 'Sarı, parlayan Güneş\'in ve tatlı muzun rengidir! ☀️',
            audioKey: 'q_daire_sari'
          },
          {
            html: '<div style="margin:6px auto;"><img src="assets/icons/3d/green_circle.webp" class="q-3d-fruit" alt="Yeşil Daire"></div><div style="font-weight:900; font-size:1.2rem;">Bu doğa rengi daire hangi renktir?</div>',
            correct: '🟢 Yeşil',
            distractors: ['🔴 Kırmızı', '🔵 Mavi'],
            exp: 'Yeşil, ağaç yapraklarının ve çimenlerin rengidir! 🌿',
            audioKey: 'q_daire_yesil'
          },
          {
            html: '<div class="q-fruit-row" style="margin:8px auto; gap:24px; align-items:center;"><img src="assets/icons/3d/elephant.webp" class="q-3d-fruit" alt="Fil" style="width:84px; height:84px;"> <span style="font-size:1.6rem; font-weight:900; color:#64748b;">vs</span> <img src="assets/icons/3d/ant.webp" class="q-3d-fruit" alt="Karınca" style="width:48px; height:48px;"></div><div style="font-weight:900; font-size:1.2rem;">Hangisi GERÇEKTE çok daha BÜYÜKTÜR?</div>',
            correct: '🐘 Fil (Kocaman)',
            distractors: ['🐜 Karınca (Minik)', 'İkisi de Aynı'],
            exp: 'Fil devasa bir canlıdır, karıncadan kat kat büyüktür! 🐘',
            audioKey: 'q_fil_vs_karinca'
          },
          {
            html: '<div class="q-fruit-row" style="margin:8px auto; gap:24px; align-items:center;"><img src="assets/icons/3d/giraffe.webp" class="q-3d-fruit" alt="Zürafa" style="width:84px; height:84px;"> <span style="font-size:1.6rem; font-weight:900; color:#64748b;">vs</span> <img src="assets/icons/3d/turtle.webp" class="q-3d-fruit" alt="Kaplumbağa" style="width:52px; height:52px;"></div><div style="font-weight:900; font-size:1.2rem;">Hangisi çok daha UZUNDUR?</div>',
            correct: '🦒 Zürafa (Uzun Boylu)',
            distractors: ['🐢 Kaplumbağa', 'İkisi de Aynı'],
            exp: 'Zürafalar upuzun boyunlarıyla ağaçların en tepesine ulaşır! 🦒',
            audioKey: 'q_zurafa_vs_kaplumbaga'
          }
        ];
        const chosen = kindergartenStroop[Math.floor(Math.random() * kindergartenStroop.length)];
        return {
          question: 'Renk ve Kavram Düellosu',
          questionHtml: chosen.html,
          correct: chosen.correct,
          distractors: chosen.distractors,
          explanation: chosen.exp,
          audioKey: chosen.audioKey
        };
      }

      // 1, 2, 3 ve 4. Sınıflar: Stroop Yanıltmaca Testi
      const colors = [
        { text: 'KIRMIZI', colorHex: '#dc2626', name: 'Kırmızı' },
        { text: 'MAVİ', colorHex: '#2563eb', name: 'Mavi' },
        { text: 'YEŞİL', colorHex: '#16a34a', name: 'Yeşil' },
        { text: 'SARI', colorHex: '#ca8a04', name: 'Sarı' },
        { text: 'MOR', colorHex: '#9333ea', name: 'Mor' },
        { text: 'TURUNCU', colorHex: '#ea580c', name: 'Turuncu' }
      ];

      // Kelime ve Mürekkep rengini farklı seç (Çatışma / Conflict)
      const textIndex = Math.floor(Math.random() * colors.length);
      let inkIndex = Math.floor(Math.random() * colors.length);
      while (inkIndex === textIndex) {
        inkIndex = Math.floor(Math.random() * colors.length);
      }

      const textItem = colors[textIndex];
      const inkItem = colors[inkIndex];

      // Üçüncü şık için başka bir renk seç
      const remainingColors = colors.filter((_, idx) => idx !== textIndex && idx !== inkIndex);
      const thirdColor = remainingColors[Math.floor(Math.random() * remainingColors.length)];

      const mode = Math.random() < 0.65 ? 'ask_color' : 'ask_word';

      if (mode === 'ask_color') {
        // "Yazının RENGİ nedir? (Ne yazdığına aldanma!)"
        const stroopHtml = `
          <div style="font-size:0.92rem; color:#dc2626; font-weight:800; margin-bottom:4px;">⚠️ DİKKAT TUZAĞI: STROOP ETKİSİ!</div>
          <div class="stroop-word" style="color: ${inkItem.colorHex};">${textItem.text}</div>
          <div style="font-size:1.15rem; font-weight:900; margin-top:6px;">Bu kelimenin RENGİ nedir? (Ne yazdığına aldanma!)</div>
        `;
        return {
          question: `Yazının rengi nedir? (${textItem.text})`,
          questionHtml: stroopHtml,
          correct: inkItem.name,
          distractors: [textItem.name, thirdColor.name],
          explanation: `Harika konsantrasyon! Kelimede '${textItem.text}' yazıyordu ama yazı rengi ${inkItem.name} idi! 🧠🎯`,
          audioKey: 'q_stroop_genel'
        };
      } else {
        // "Burada NE YAZIYOR? (Rengine aldanma!)"
        const stroopHtml = `
          <div style="font-size:0.92rem; color:#7c3aed; font-weight:800; margin-bottom:4px;">🧠 BEYİN JİMNASTİĞİ: HIZLI ODAK!</div>
          <div class="stroop-word" style="color: ${inkItem.colorHex};">${textItem.text}</div>
          <div style="font-size:1.15rem; font-weight:900; margin-top:6px;">Burada NE YAZIYOR? (Yazı rengine aldanma!)</div>
        `;
        return {
          question: `Burada ne yazıyor?`,
          questionHtml: stroopHtml,
          correct: textItem.name,
          distractors: [inkItem.name, thirdColor.name],
          explanation: `Gözün yanılmadı! Mürekkep ${inkItem.name} olsa da kelime '${textItem.text}' idi! 👏`,
          audioKey: 'q_stroop_genel'
        };
      }
    },

    // -------------------------------------------------------------
    // DERS DIŞI 3: SÜPER HAFIZA (SIRAYI HATIRLA)
    // -------------------------------------------------------------
    generateMemorySequenceQuestion(grade) {
      const g = parseInt(grade, 10);
      const iconPool = [
        { emoji: '🐶', name: 'Köpek' },
        { emoji: '🐱', name: 'Kedi' },
        { emoji: '🚀', name: 'Roket' },
        { emoji: '🚗', name: 'Araba' },
        { emoji: '🍌', name: 'Muz' },
        { emoji: '🍎', name: 'Elma' },
        { emoji: '⭐', name: 'Yıldız' },
        { emoji: '🎈', name: 'Balon' },
        { emoji: '⚽', name: 'Futbol Topu' },
        { emoji: '🍦', name: 'Dondurma' },
        { emoji: '🦁', name: 'Aslan' },
        { emoji: '💎', name: 'Elmas' },
        { emoji: '🎸', name: 'Gitar' },
        { emoji: '🍕', name: 'Pizza' },
        { emoji: '🏆', name: 'Kupa' }
      ];

      // Karıştırıp seç
      const shuffled = [...iconPool].sort(() => 0.5 - Math.random());
      const seqLength = (g === 0 || g === 1) ? 3 : (g >= 4 ? 5 : 4);
      const sequence = shuffled.slice(0, seqLength);
      const unchosen = shuffled[seqLength];

      const modes = ['ask_second', 'ask_first', 'ask_last', 'ask_not_in_seq', 'ask_third'];
      const chosenMode = modes[Math.floor(Math.random() * modes.length)];

      let questionTitle = '';
      let correct = '';
      let distractors = [];

      if (chosenMode === 'ask_second') {
        questionTitle = 'Bu seride 2. (İKİNCİ) sırada hangi sembol vardı?';
        correct = `2. ${sequence[1].emoji} ${sequence[1].name}`;
        distractors = [
          `1. ${sequence[0].emoji} ${sequence[0].name}`,
          `3. ${sequence[2].emoji} ${sequence[2].name}`
        ];
      } else if (chosenMode === 'ask_first') {
        questionTitle = 'Bu seride İLK (1.) sırada hangi sembol vardı?';
        correct = `1. ${sequence[0].emoji} ${sequence[0].name}`;
        distractors = [
          `2. ${sequence[1].emoji} ${sequence[1].name}`,
          `3. ${sequence[2].emoji} ${sequence[2].name}`
        ];
      } else if (chosenMode === 'ask_third') {
        questionTitle = 'Bu seride 3. (ÜÇÜNCÜ) sırada hangi sembol vardı?';
        correct = `3. ${sequence[2].emoji} ${sequence[2].name}`;
        distractors = [
          `1. ${sequence[0].emoji} ${sequence[0].name}`,
          `2. ${sequence[1].emoji} ${sequence[1].name}`
        ];
      } else if (chosenMode === 'ask_last') {
        const lastIdx = seqLength - 1;
        questionTitle = `Bu seride EN SON (${seqLength}.) sırada hangisi vardı?`;
        correct = `${seqLength}. ${sequence[lastIdx].emoji} ${sequence[lastIdx].name}`;
        distractors = [
          `1. ${sequence[0].emoji} ${sequence[0].name}`,
          `2. ${sequence[1].emoji} ${sequence[1].name}`
        ];
      } else {
        questionTitle = 'Aşağıdakilerden hangisi bu sırada HİÇ YOKTU?';
        correct = `${unchosen.emoji} ${unchosen.name} (Yoktu)`;
        distractors = [
          `${sequence[0].emoji} ${sequence[0].name}`,
          `${sequence[1].emoji} ${sequence[1].name}`
        ];
      }

      const memoryHtml = `
        <div style="font-size:0.92rem; color:#059669; font-weight:800; margin-bottom:4px; display:inline-flex; align-items:center; gap:6px;">${replaceEmojisWith3D('🧠', 'chip-3d-icon')} SÜPER HAFIZA: SIRAYI HATIRLA!</div>
        <div class="memory-sequence-box">
          ${sequence.map((item, idx) => `<span><strong>${idx + 1}.</strong> ${replaceEmojisWith3D(item.emoji, 'memory-3d-item')}</span>`).join('')}
        </div>
        <div style="font-size:1.15rem; font-weight:900; margin-top:6px;">${questionTitle}</div>
      `;

      const expSeq = sequence.map((s, i) => `${i + 1}. ${s.emoji}`).join('  ➔  ');
      return {
        question: questionTitle,
        questionHtml: memoryHtml,
        correct: correct,
        distractors: distractors,
        explanation: `Süper hafıza! Sıralama: [ ${expSeq} ] şeklindeydi! Harikasın! 🧠✨`
      };
    },

    // -------------------------------------------------------------
    // DERS DIŞI 4: ŞİMŞEK REFLEKS (KÖSTEBEK / HEDEF AVI)
    // -------------------------------------------------------------
    generateSpeedReflexQuestion(grade) {
      const g = parseInt(grade, 10);
      const targets = [
        { target: '⭐', name: 'YILDIZ', hazard: '💣', hazardName: 'BOMBA', distract: '💎', distractName: 'Elmas' },
        { target: '🎯', name: 'HEDEF', hazard: '💣', hazardName: 'BOMBA', distract: '⚡', distractName: 'Şimşek' },
        { target: '🚀', name: 'ROKET', hazard: '💣', hazardName: 'BOMBA', distract: '🛸', distractName: 'UFO' },
        { target: '🏆', name: 'KUPA', hazard: '💣', hazardName: 'BOMBA', distract: '🥇', distractName: 'Madalya' },
        { target: '🔔', name: 'ÇAN', hazard: '💣', hazardName: 'BOMBA', distract: '⏰', distractName: 'Saat' },
        { target: '🎈', name: 'BALON', hazard: '🌵', hazardName: 'KAKTÜS', distract: '🧸', distractName: 'Ayıcık' }
      ];

      const chosen = targets[Math.floor(Math.random() * targets.length)];

      const reflexHtml = `
        <div style="font-size:0.92rem; color:#d97706; font-weight:800; margin-bottom:4px; display:inline-flex; align-items:center; gap:6px;">${replaceEmojisWith3D('⚡', 'chip-3d-icon')} ŞİMŞEK REFLEKS & HEDEF AVI!</div>
        <div class="reflex-target-box">
          <span style="font-size:1.15rem; background:#fee2e2; color:#b91c1c; padding:6px 14px; border-radius:12px; border:2px dashed #ef4444; font-weight:900; display:inline-flex; align-items:center; gap:6px;">${replaceEmojisWith3D(chosen.hazard, 'chip-3d-icon')} DOKUNMA!</span>
          <span class="pulse-target" style="margin:0 14px; display:inline-flex; align-items:center;">${replaceEmojisWith3D(chosen.target, 'q-3d-fruit')}</span>
          <span style="font-size:1.15rem; background:#dcfce7; color:#15803d; padding:6px 14px; border-radius:12px; border:2px dashed #22c55e; font-weight:900; display:inline-flex; align-items:center; gap:6px;">${replaceEmojisWith3D(chosen.target, 'chip-3d-icon')} İLK SEN BAS!</span>
        </div>
        <div style="font-size:1.15rem; font-weight:900; margin-top:6px;">HEDEF: Sadece ${chosen.name}! Tuzaklara basma!</div>
      `;

      return {
        question: `Hedefe bas: ${chosen.target}`,
        questionHtml: reflexHtml,
        correct: `${chosen.target} ${chosen.name} (HEDEF!)`,
        distractors: [
          `${chosen.hazard} ${chosen.hazardName} (BOMBA!)`,
          `${chosen.distract} ${chosen.distractName}`
        ],
        explanation: `Şimşek refleks! Hedefi (${chosen.target}) tam zamanında yakaladın ve tuzaktan (${chosen.hazard}) kaçındın! ⚡🏆`
      };
    },

    // İstenen sınıf ve türe göre bir soru getir (Anti-Repeat Fisher-Yates Motoru)
    getNextQuestion(grade, gameType) {
      // Özel Sınav (Custom Quiz) Modu: Öğretmenin Sınavından Soruları Şıklarını Karıştırarak Çek
      if (gameType === 'custom_quiz' && state.activeCustomQuiz) {
        if (!state.customQuizQueue || state.customQuizQueue.length === 0) {
          state.customQuizQueue = this.fisherYatesShuffle([...state.activeCustomQuiz.questions]);
        }
        const cq = state.customQuizQueue.shift();
        return this.buildQuestionItem({
          question: cq.question,
          correct: cq.correctText,
          distractors: cq.wrongOptions,
          explanation: cq.explanation || `Özel Sınav: "${state.activeCustomQuiz.title}"`
        }, `📝 ${state.activeCustomQuiz.title}`);
      }

      // Standart derslerde her 4. soruda bir derse uygun Doğru/Yanlış veya Dokun-Eşleştir interaktif molası
      const isStandardSubject = ['math', 'turkish', 'english', 'lifescience', 'science', 'social'].includes(gameType);
      if (parseInt(grade, 10) > 1 && isStandardSubject && state.questionNumber > 1 && (state.questionNumber % 4 === 0)) {
        let catFilter = gameType;
        if (gameType === 'social') catFilter = 'lifescience';
        if (Math.random() < 0.5) {
          return this.generateTrueFalseQuestion(grade, catFilter);
        } else {
          return this.generateMatchingQuestion(grade, catFilter);
        }
      }

      let attempts = 0;
      let finalQ = null;
      while (attempts < 10) {
        finalQ = this._getRawQuestion(grade, gameType);
        if (!finalQ) break;
        const sig = String(finalQ.question || finalQ.spokenText || '') + '_' + JSON.stringify(finalQ.correct);
        if (!this.recentSignatures.includes(sig) || attempts >= 9) {
          this.recentSignatures.push(sig);
          if (this.recentSignatures.length > 25) this.recentSignatures.shift();
          break;
        }
        attempts++;
      }
      return finalQ;
    },

    _getRawQuestion(grade, gameType) {
      // 1. Önce öğretmenin eklediği özel soru var mı kontrol et (varsa %40 ihtimalle araya serpiştir)
      const matchingCustom = state.customQuestions.filter(
        q => parseInt(q.grade, 10) === parseInt(grade, 10) && q.category === gameType
      );
      if (matchingCustom.length > 0 && Math.random() < 0.4) {
        const cq = this.drawFromPool(matchingCustom, "matchingCustom");
        return this.buildQuestionItem({
          question: cq.question,
          correct: cq.correct,
          distractors: [cq.wrong1, cq.wrong2],
          explanation: cq.explanation || 'Bu soru öğretmeniniz tarafından hazırlanmıştır.'
        }, gameType === 'math' ? '📐 Matematik' : '📚 Türkçe & Dikkat');
      }

      // 2. Yerleşik Dinamik Motor
      const g = parseInt(grade, 10);
      if (g === 0) {
        // ANASINIFI (OKUL ÖNCESİ): Okuma yazma gerektirmeyen, 100% görsel, işitsel ve motor oyun motorları
        if (gameType === 'color_balloon' || gameType === 'balloon') {
          return this.buildQuestionItem(this.generateFloatingBalloonQuestion(0, 'colors'), '🎈 Renkli Balon Avı');
        } else if (gameType === 'kinder_number_balloon') {
          return this.buildQuestionItem(this.generateFloatingBalloonQuestion(0, 'numbers'), '🎈 Sayı Balonları');
        } else if (gameType === 'count_tap') {
          return this.buildQuestionItem(this.generateCountTapQuestion(), '🍎 Kaç Tane Var? Dokun & Say');
        } else if (gameType === 'shadow_match') {
          return this.buildQuestionItem(this.generateShadowMatchQuestion(0), '🧩 Gölgesini Bul');
        } else if (gameType === 'memory' || gameType === 'matching') {
          return this.buildQuestionItem(this.generateMemoryGridQuestion(0, 'kindergarten_visual'), '🧠 Sevimli Hafıza Kartları');
        } else if (gameType === 'kinder_emotions') {
          return this.buildQuestionItem(this.generateVisualChoiceQuestion(0, 'Duygular'), '💖 Duygularım & Yüz İfadeleri');
        } else if (gameType === 'kinder_size') {
          return this.buildQuestionItem(this.generateVisualChoiceQuestion(0, 'Boyutlar'), '🐘 Büyük ve Küçük');
        } else if (gameType === 'kinder_shapes') {
          return this.buildQuestionItem(this.generateVisualChoiceQuestion(0, 'Şekiller'), '⭐ Şekilleri Keşfet');
        } else if (gameType === 'kinder_counting') {
          return this.buildQuestionItem(this.generateVisualChoiceQuestion(0, 'Sayma'), '🔢 Meyve & Yıldız Sayma');
        } else if (gameType === 'kinder_animal_sounds') {
          return this.buildQuestionItem(this.generateVisualChoiceQuestion(0, 'Hayvan Sesleri'), '🐾 Kim Miyavlar? Hayvan Sesleri');
        } else if (gameType === 'kinder_fruits') {
          return this.buildQuestionItem(this.generateVisualChoiceQuestion(0, 'Meyveler'), '🍓 Meyve Sepeti');
        } else if (gameType === 'kinder_oddone' || gameType === 'oddone') {
          return this.buildQuestionItem(this.generateVisualChoiceQuestion(0, 'Farklı'), '👀 Farklı Olanı Yakala');
        } else if (gameType === 'kinder_colors') {
          return this.buildQuestionItem(this.generateVisualChoiceQuestion(0, 'Renkler'), '🎨 Canlı Renkler');
        } else {
          // Genel Anasınıfı Rotasyonu (Her kategoriden dengeli görsel/işitsel dağıtım)
          const r = Math.random();
          if (r < 0.40) {
            return this.buildQuestionItem(this.generateVisualChoiceQuestion(0), '🎨 Dinle & Seç');
          } else if (r < 0.65) {
            return this.buildQuestionItem(this.generateFloatingBalloonQuestion(0), '🎈 Hareketli Balon Avı');
          } else if (r < 0.85) {
            return this.buildQuestionItem(this.generateMemoryGridQuestion(0, 'kindergarten_visual'), '🧠 Sevimli Hafıza Kartları');
          } else {
            return this.buildQuestionItem(this.generateShadowMatchQuestion(0), '🧩 Gölgesini Bul');
          }
        }
      }

      // 2026 Türkiye Yüzyılı Maarif Modeli İlk Okuma Yazma Motoru
      if (gameType && gameType.startsWith('maarif_')) {
        const activeL = (state.activeMaarifLetter || 'a').toLowerCase();
        const raw = this.generateMaarifQuestion(gameType, activeL);
        const letterUpper = activeL.toUpperCase('tr-TR');
        return this.buildQuestionItem(raw, `🔤 Maarif Okuma (${letterUpper} Sesi)`);
      }

      if (gameType === 'color_balloon') {
        const raw = this.generateFloatingBalloonQuestion(0);
        return this.buildQuestionItem(raw, '🎈 Renkli Balon Avı');
      } else if (gameType === 'firstreading_balloon') {
        const raw = this.generateFloatingBalloonQuestion(1, 'reading');
        return this.buildQuestionItem(raw, '🎈 Harf & Hece Balonları');
      } else if (gameType === 'syllable_builder') {
        const raw = this.generateSyllableBuilderQuestion();
        return this.buildQuestionItem(raw, '🔤 Hece Birleştirme Atölyesi');
      } else if (gameType === 'word_catch') {
        const raw = this.generateWordCatchQuestion();
        return this.buildQuestionItem(raw, '⭐ Hızlı Kelime Yakala');
      } else if (gameType === 'shadow_match') {
        const raw = this.generateShadowMatchQuestion(g);
        return this.buildQuestionItem(raw, '🧩 Gölgesini Bul');
      } else if (gameType === 'count_tap') {
        const raw = this.generateCountTapQuestion();
        return this.buildQuestionItem(raw, '🔢 Kaç Tane Var? Dokun & Say');
      } else if (gameType === 'firstreading') {
        // 1. Sınıf Okuma-Yazma Rotasyonu: Hareketli Balon (%45), Hafıza Kartları (%35), Hece İnşaatı (%20)
        const r = Math.random();
        if (r < 0.45) {
          return this.buildQuestionItem(this.generateFloatingBalloonQuestion(1, 'reading'), '🎈 Harf & Hece Balonları');
        } else if (r < 0.80) {
          return this.buildQuestionItem(this.generateMemoryGridQuestion(1, 'letters'), '🧠 Büyük-Küçük Harf Hafızası');
        } else {
          return this.buildQuestionItem(this.generateSyllableBuilderQuestion(), '🔤 Hece Birleştirme Atölyesi');
        }
      // --- 1. SINIF: 2026 MAARİF MODELİ ÖĞRENME ALANLARI VE OYUNLARI ---
      } else if (gameType === 'lifescience_school_1') {
        const raw = this.drawFromPool(this.grade1LifeScienceSchoolPool, "grade1LifeScienceSchoolPool");
        return this.buildQuestionItem(raw, '🏫 Ben ve Okulum');
      } else if (gameType === 'lifescience_health_traffic_1') {
        const raw = this.drawFromPool(this.grade1LifeScienceHealthTrafficPool, "grade1LifeScienceHealthTrafficPool");
        return this.buildQuestionItem(raw, '🧼 Sağlığım ve Güvenliğim');
      } else if (gameType === 'lifescience_family_home_1') {
        const raw = this.drawFromPool(this.grade1LifeScienceFamilyHomePool, "grade1LifeScienceFamilyHomePool");
        return this.buildQuestionItem(raw, '🏡 Ailem ve Toplum');
      } else if (gameType === 'lifescience_country_flag_1') {
        const raw = this.drawFromPool(this.grade1LifeScienceCountryFlagPool, "grade1LifeScienceCountryFlagPool");
        return this.buildQuestionItem(raw, '🇹🇷 Yaşadığım Yer ve Ülkem');
      } else if (gameType === 'lifescience_nature_recycling_1') {
        const raw = this.drawFromPool(this.grade1LifeScienceNatureRecyclingPool, "grade1LifeScienceNatureRecyclingPool");
        return this.buildQuestionItem(raw, '🌿 Doğa ve Çevre');
      } else if (gameType === 'lifescience_1_karma' || gameType === 'lifescience_school_home_1' || gameType === 'lifescience_health_seasons_1') {
        const raw = this.generateGrade1LifeScienceKarma();
        return this.buildQuestionItem(raw, '🌱 Hayat Bilgisi Karma Düello');
      } else if (gameType === 'math_spatial_geo_1') {
        const raw = this.generateGrade1SpatialGeo();
        return this.buildQuestionItem(raw, '📐 Geometri & Uzamsal');
      } else if (gameType === 'math_numbers_quantities_1' || gameType === 'math_rhythmic_1') {
        const raw = this.generateGrade1NumbersQuantities();
        return this.buildQuestionItem(raw, '🔢 Sayılar & Nicelikler (1-20)');
      } else if (gameType === 'math_operations_patterns_1') {
        const raw = this.generateGrade1OperationsPatterns();
        return this.buildQuestionItem(raw, '➕➖ Toplama, Çıkarma & Örüntü');
      } else if (gameType === 'math_measure_money_time_1' || gameType === 'math_shapes_money_1') {
        const raw = this.generateGrade1MeasureMoneyTime();
        return this.buildQuestionItem(raw, '⏰ Ölçme, Saat & Paralarımız');
      } else if (gameType === 'math_data_tables_1') {
        const raw = this.generateGrade1DataTables();
        return this.buildQuestionItem(raw, '📊 Grafik Dedektifi');
      } else if (gameType === 'math_1_karma') {
        const raw = this.generateGrade1MathKarma();
        return this.buildQuestionItem(raw, '🧮 1. Sınıf Matematik Karma');
      } else if (gameType === 'turkish_listen_comprehend_1') {
        const raw = this.generateGrade1ListeningComprehension();
        return this.buildQuestionItem(raw, '🎧 Dinleme ve Görsel Okuma');
      } else if (gameType === 'turkish_antonyms_1') {
        const raw = this.drawFromPool(this.grade1AntonymsPool, "grade1AntonymsPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp,
          spokenText: raw.spokenText || raw.q
        }, '🔄 Zıt Kavramlar Düellosu');
      } else if (gameType === 'turkish_sentence_punctuation_1' || gameType === 'turkish_syllables_letters_1') {
        const raw = this.generateGrade1SentencePunctuation();
        return this.buildQuestionItem(raw, '✍️ Cümle Kurucu & Noktalama');
      } else if (gameType === 'turkish_1_karma') {
        const raw = this.generateGrade1TurkishKarma();
        return this.buildQuestionItem(raw, '📚 1. Sınıf Türkçe Karma');
      } else if (gameType === 'grade1_grand_duel') {
        const raw = this.generateGrade1GrandDuel();
        return this.buildQuestionItem(raw, '🏆 1. Sınıf Büyük Karma Düello');
      // --- 2. SINIF: 2026 MAARİF MODELİ MATEMATİK 6 ÖĞRENME ALANI ---
      } else if (gameType === 'math_place_value_2') {
        const raw = this.generateGrade2PlaceValue();
        return this.buildQuestionItem(raw, '🔢 Sayılar ve Nicelikler (100\'e Kadar)');
      } else if (gameType === 'math_operations_2') {
        const raw = this.generateGrade2Operations();
        return this.buildQuestionItem(raw, '➕➖ Toplama ve Çıkarma (100 İçinde)');
      } else if (gameType === 'math_multiplication_division_2' || gameType === 'math_multiplication_2') {
        const raw = this.generateGrade2MultiplicationDivision();
        return this.buildQuestionItem(raw, '✖️➗ Çarpma ve Bölme (1-5 & 10)');
      } else if (gameType === 'math_fractions_time_money_2' || gameType === 'math_clock_2') {
        const raw = this.generateGrade2FractionsTimeMoney();
        return this.buildQuestionItem(raw, '🍰 Kesirler, Zaman ve Paralarımız');
      } else if (gameType === 'math_geometry_solids_2') {
        const raw = this.generateGrade2GeometrySolids();
        return this.buildQuestionItem(raw, '📐 Geometri ve Simetri');
      } else if (gameType === 'math_measure_data_2') {
        const raw = this.generateGrade2MeasureData();
        return this.buildQuestionItem(raw, '📊 Ölçme ve Veri (Grafik/Tablo)');
      } else if (gameType === 'math_2_karma') {
        const raw = this.generateGrade2MathKarma();
        return this.buildQuestionItem(raw, '🏆 2. Sınıf Matematik Karma Düello');
      // --- 2. SINIF: 2026 MAARİF MODELİ TÜRKÇE 5 ÖĞRENME ALANI ---
      } else if (gameType === 'turkish_syn_ant_2') {
        const raw = this.drawFromPool(this.grade2TurkishSynAntPool, "grade2TurkishSynAntPool");
        return this.buildQuestionItem(raw, '✨ Eş ve Zıt Anlam Avcısı');
      } else if (gameType === 'turkish_alphabet_syllable_2') {
        const raw = this.drawFromPool(this.grade2TurkishAlphabetSyllablePool, "grade2TurkishAlphabetSyllablePool");
        return this.buildQuestionItem(raw, '🔤 Sözlük Sırası & Doğru Hece Bölme');
      } else if (gameType === 'turkish_reading_5n1k_2') {
        const raw = this.drawFromPool(this.grade2TurkishReading5N1KPool, "grade2TurkishReading5N1KPool");
        return this.buildQuestionItem(raw, '🔍 5N1K Dedektifi & Metin Anlama');
      } else if (gameType === 'turkish_sentence_logic_2') {
        const raw = this.drawFromPool(this.grade2TurkishSentenceLogicPool, "grade2TurkishSentenceLogicPool");
        return this.buildQuestionItem(raw, '🧱 Kurallı Cümle İnşası');
      } else if (gameType === 'turkish_punctuation_spelling_2' || gameType === 'turkish_punctuation_2') {
        const raw = this.drawFromPool(this.grade2TurkishPunctuationSpellingPool, "grade2TurkishPunctuationSpellingPool");
        return this.buildQuestionItem(raw, '✍️ Noktalama & Yazım Ustası');
      } else if (gameType === 'turkish_2_karma') {
        const raw = this.generateGrade2TurkishKarma();
        return this.buildQuestionItem(raw, '📚 2. Sınıf Türkçe Karma Düello');
      } else if (gameType === 'grade2_grand_duel') {
        const raw = this.generateGrade2GrandDuel();
        return this.buildQuestionItem(raw, '🏆 2. Sınıf Büyük Karma Düello');
      // --- 2. SINIF: 2026 MAARİF MODELİ HAYAT BİLGİSİ 6 ÖĞRENME ALANI ---
      } else if (gameType === 'lifescience_school_2') {
        const raw = this.drawFromPool(this.grade2LifeScienceSchoolPool, "grade2LifeScienceSchoolPool");
        return this.buildQuestionItem(raw, '🏫 Ben ve Okulum (Okulumuzda Hayat)');
      } else if (gameType === 'lifescience_health_2') {
        const raw = this.drawFromPool(this.grade2LifeScienceHealthPool, "grade2LifeScienceHealthPool");
        return this.buildQuestionItem(raw, '🍎 Sağlığım ve Güvenliğim (Sağlıklı Hayat)');
      } else if (gameType === 'lifescience_safety_2' || gameType === 'lifescience_traffic_2') {
        const raw = this.drawFromPool(this.grade2LifeScienceSafetyPool, "grade2LifeScienceSafetyPool");
        return this.buildQuestionItem(raw, '🚦 Güvenli Hayat');
      } else if (gameType === 'lifescience_home_family_2') {
        const raw = this.drawFromPool(this.grade2LifeScienceHomeFamilyPool, "grade2LifeScienceHomeFamilyPool");
        return this.buildQuestionItem(raw, '🏡 Ailem ve Toplum (Evimizde Hayat)');
      } else if (gameType === 'lifescience_country_culture_2' || gameType === 'lifescience_culture_2') {
        const raw = this.drawFromPool(this.grade2LifeScienceCountryCulturePool, "grade2LifeScienceCountryCulturePool");
        return this.buildQuestionItem(raw, '🇹🇷 Yaşadığım Yer ve Ülkem (Ülkemizde Hayat)');
      } else if (gameType === 'lifescience_nature_environment_2') {
        const raw = this.drawFromPool(this.grade2LifeScienceNatureEnvironmentPool, "grade2LifeScienceNatureEnvironmentPool");
        return this.buildQuestionItem(raw, '🌿 Doğa ve Çevre (Doğada Hayat)');
      } else if (gameType === 'lifescience_2_karma') {
        const raw = this.generateGrade2LifeScienceKarma();
        return this.buildQuestionItem(raw, '🌟 2. Sınıf Hayat Bilgisi Karma Düello');
      } else if (gameType === 'english_school_objects_2') {
        const raw = this.drawFromPool(this.englishSchoolObjectsPool, "englishSchoolObjectsPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp,
          englishWord: raw.englishWord,
          lang: 'en'
        }, '🎒 Classroom Objects & Numbers');
      } else if (gameType === 'english_animals_fruits_2') {
        const raw = this.drawFromPool(this.englishAnimalsAndFruitsPool, "englishAnimalsAndFruitsPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp,
          englishWord: raw.englishWord,
          lang: 'en'
        }, '🍎 Animals & Fruits');
      } else if (gameType === 'math_romen_place_3') {
        const raw = this.generateGrade3RomenAndPlace();
        return this.buildQuestionItem(raw, '🏛️ 3 Basamaklı Sayılar & Romen Rakamları');
      } else if (gameType === 'math_mult_div_3') {
        const raw = this.generateGrade3MultDiv();
        return this.buildQuestionItem(raw, '🌪️ Çarpım Tablosu & Bölme Düellosu');
      } else if (gameType === 'math_fractions_shapes_3') {
        const raw = this.drawFromPool(this.grade3FractionsAndShapesPool, "grade3FractionsAndShapesPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '🧊 Kesirler & Geometrik Cisimler');
      } else if (gameType === 'turkish_homonyms_figurative_3') {
        const raw = this.drawFromPool(this.grade3HomonymsFigurativePool, "grade3HomonymsFigurativePool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '🎭 Eş Sesli Kelimeler & Mecaz Anlam');
      } else if (gameType === 'turkish_punctuation_5n1k_3') {
        const raw = this.drawFromPool(this.grade3Punctuation5N1KPool, "grade3Punctuation5N1KPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '✍️ Noktalama, Yazım Kuralları & 5N1K');
      // --- 3. SINIF: 2026 MAARİF MODELİ FEN BİLİMLERİ 7 ÖĞRENME ALANI ---
      } else if (gameType === 'science_planet_layers_3') {
        const raw = this.drawFromPool(this.grade3SciencePlanetLayersPool, "grade3SciencePlanetLayersPool");
        return this.buildQuestionItem(raw, '🌍 Dünya\'nın Katmanları & Gezegen Keşfi');
      } else if (gameType === 'science_senses_3') {
        const raw = this.drawFromPool(this.grade3ScienceSensesPool, "grade3ScienceSensesPool");
        return this.buildQuestionItem(raw, '👂 Beş Duyu Dedektifi');
      } else if (gameType === 'science_force_motion_3') {
        const raw = this.drawFromPool(this.grade3ScienceForceMotionPool, "grade3ScienceForceMotionPool");
        return this.buildQuestionItem(raw, '🧲 İtme mi Çekme mi? & Hareket Türleri');
      } else if (gameType === 'science_matter_states_3') {
        const raw = this.drawFromPool(this.grade3ScienceMatterStatesPool, "grade3ScienceMatterStatesPool");
        return this.buildQuestionItem(raw, '🧊 Katı-Sıvı-Gaz Avcısı & Madde Özellikleri');
      } else if (gameType === 'science_light_sound_3') {
        const raw = this.drawFromPool(this.grade3ScienceLightSoundPool, "grade3ScienceLightSoundPool");
        return this.buildQuestionItem(raw, '💡 Doğal mı Yapay mı? (Işık ve Ses)');
      } else if (gameType === 'science_living_environment_3') {
        const raw = this.drawFromPool(this.grade3ScienceLivingEnvironmentPool, "grade3ScienceLivingEnvironmentPool");
        return this.buildQuestionItem(raw, '🌱 Canlı-Cansız Sınıflandır & Çevre');
      } else if (gameType === 'science_electricity_safety_3') {
        const raw = this.drawFromPool(this.grade3ScienceElectricitySafetyPool, "grade3ScienceElectricitySafetyPool");
        return this.buildQuestionItem(raw, '⚡ Elektrik Kaynakları & Güvenli Kullanım');
      } else if (gameType === 'science_3_karma') {
        const raw = this.generateGrade3ScienceKarma();
        return this.buildQuestionItem(raw, '🔬 3. Sınıf Fen Bilimleri Karma Düello');
      // Geriye dönük uyumluluk
      } else if (gameType === 'science_earth_senses_3') {
        const raw = Math.random() < 0.5 ? this.drawFromPool(this.grade3SciencePlanetLayersPool, "grade3SciencePlanetLayersPool") : this.drawFromPool(this.grade3ScienceSensesPool, "grade3ScienceSensesPool");
        return this.buildQuestionItem(raw, '🌍 Gezegenimiz Dünya ve Beş Duyumuz');
      } else if (gameType === 'science_force_matter_3') {
        const raw = Math.random() < 0.5 ? this.drawFromPool(this.grade3ScienceForceMotionPool, "grade3ScienceForceMotionPool") : this.drawFromPool(this.grade3ScienceMatterStatesPool, "grade3ScienceMatterStatesPool");
        return this.buildQuestionItem(raw, '🧲 Kuvveti Tanıyalım ve Madde');
      // --- 3. SINIF: 2026 MAARİF MODELİ HAYAT BİLGİSİ 6 ÖĞRENME ALANI ---
      } else if (gameType === 'lifescience_school_professions_3') {
        const raw = this.drawFromPool(this.grade3LifeScienceSchoolProfessionsPool, "grade3LifeScienceSchoolProfessionsPool");
        return this.buildQuestionItem(raw, '🏫 Kroki Okuma & Meslekler Düellosu');
      } else if (gameType === 'lifescience_home_budget_3') {
        const raw = this.drawFromPool(this.grade3LifeScienceHomeBudgetPool, "grade3LifeScienceHomeBudgetPool");
        return this.buildQuestionItem(raw, '🏡 Planlı Yaşam & Bütçe/Tasarruf');
      } else if (gameType === 'lifescience_health_consumer_3') {
        const raw = this.drawFromPool(this.grade3LifeScienceHealthConsumerPool, "grade3LifeScienceHealthConsumerPool");
        return this.buildQuestionItem(raw, '🍎 Bilinçli Tüketici & Sağlıklı Beslenme');
      } else if (gameType === 'lifescience_safety_traffic_3') {
        const raw = this.drawFromPool(this.grade3LifeScienceSafetyTrafficPool, "grade3LifeScienceSafetyTrafficPool");
        return this.buildQuestionItem(raw, '🚦 Trafik Levhaları & Acil Durum Rehberi');
      } else if (gameType === 'lifescience_country_leaders_3') {
        const raw = this.drawFromPool(this.grade3LifeScienceCountryLeadersPool, "grade3LifeScienceCountryLeadersPool");
        return this.buildQuestionItem(raw, '🇹🇷 Vali mi Kaymakam mı? & Öncülerimiz');
      } else if (gameType === 'lifescience_nature_directions_3') {
        const raw = this.drawFromPool(this.grade3LifeScienceNatureDirectionsPool, "grade3LifeScienceNatureDirectionsPool");
        return this.buildQuestionItem(raw, '🧭 Doğada Yön Bulma & Çevre Koruyucusu');
      } else if (gameType === 'lifescience_3_karma') {
        const raw = this.generateGrade3LifeScienceKarma();
        return this.buildQuestionItem(raw, '🌱 3. Sınıf Hayat Bilgisi Karma Düello');
      // Geriye dönük uyumluluk
      } else if (gameType === 'lifescience_compass_consumer_3') {
        const raw = Math.random() < 0.5 ? this.drawFromPool(this.grade3LifeScienceHealthConsumerPool, "grade3LifeScienceHealthConsumerPool") : this.drawFromPool(this.grade3LifeScienceNatureDirectionsPool, "grade3LifeScienceNatureDirectionsPool");
        return this.buildQuestionItem(raw, '🧭 Yönlerimiz, Kroki ve Tüketici Hakları');
      } else if (gameType === 'english_family_feelings_3') {
        const raw = this.drawFromPool(this.grade3FamilyFeelingsPool, "grade3FamilyFeelingsPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp,
          englishWord: raw.englishWord,
          lang: 'en'
        }, '👨‍👩‍👧 Family, Feelings & Abilities');
      } else if (gameType === 'math_digits_operations_4') {
        const raw = this.generateGrade4DigitsOperations();
        return this.buildQuestionItem(raw, '👑 4, 5, 6 Basamaklı Sayılar & Dört İşlem');
      } else if (gameType === 'math_fractions_angles_4') {
        const raw = this.drawFromPool(this.grade4FractionsAnglesPool, "grade4FractionsAnglesPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '🍕 Kesirler, Zaman ve Açılar');
      } else if (gameType === 'math_perimeter_area_4') {
        const raw = this.generateGrade4PerimeterArea();
        return this.buildQuestionItem(raw, '📐 Çevre ve Alan Hesaplama');
      } else if (gameType === 'turkish_idioms_proverbs_4') {
        const raw = this.drawFromPool(this.grade4IdiomsProverbsPool, "grade4IdiomsProverbsPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '🏆 Deyimler ve Atasözleri Düellosu');
      } else if (gameType === 'turkish_sentences_logic_4') {
        const raw = this.drawFromPool(this.grade4SentencesLogicPool, "grade4SentencesLogicPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '💡 Sebep-Sonuç, Amaç-Sonuç & Yargılar');
      } else if (gameType === 'science_crust_nutrition_4') {
        const raw = this.drawFromPool(this.grade4CrustNutritionPool, "grade4CrustNutritionPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '🌍 Yer Kabuğu, Hareketler & Besinler');
      } else if (gameType === 'science_circuits_magnets_4') {
        const raw = this.drawFromPool(this.grade4CircuitsMagnetsPool, "grade4CircuitsMagnetsPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '💡 Kuvvet, Mıknatıslar & Devreler');
      } else if (gameType === 'social_identity_heroes_4') {
        const raw = this.drawFromPool(this.grade4IdentityHeroesPool, "grade4IdentityHeroesPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '🇹🇷 Birey, Toplum & Milli Mücadele');
      } else if (gameType === 'social_places_economy_4') {
        const raw = this.drawFromPool(this.grade4PlacesEconomyPool, "grade4PlacesEconomyPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '🗺️ İnsanlar, Yerler & Üretimden Tüketime');
      } else if (gameType === 'english_countries_routines_4') {
        const raw = this.drawFromPool(this.grade4CountriesRoutinesPool, "grade4CountriesRoutinesPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp,
          englishWord: raw.englishWord,
          lang: 'en'
        }, '🌍 Countries, Routines & Jobs');
      } else if (gameType === 'math') {
        let raw;
        if (g === 0) {
          const r = Math.random();
          if (r < 0.5) return this.buildQuestionItem(this.generateVisualChoiceQuestion(0, 'Renkler & Şekiller'), '🎨 Renkler & Şekiller');
          else if (r < 0.75) return this.buildQuestionItem(this.generateFloatingBalloonQuestion(0, 'math'), '🎈 Sayı Balonları');
          else return this.buildQuestionItem(this.generateMemoryGridQuestion(0), '🧠 Sayma & Eşleştirme');
        } else if (g === 1) {
          raw = this.generateGrade1MathKarma();
        } else if (g === 2) {
          raw = this.generateGrade2MathKarma();
        } else if (g === 3) {
          raw = this.generateGrade3Math();
        } else {
          raw = this.generateGrade4Math();
        }
        return this.buildQuestionItem(raw, g === 0 ? '🎨 Renkler & Sayma' : '📐 Matematik Düellosu');
      } else if (gameType === 'turkish') {
        if (g === 0) {
          const r = Math.random();
          if (r < 0.5) return this.buildQuestionItem(this.generateVisualChoiceQuestion(0, 'Hayvanlar'), '🦁 Hayvanlar & Doğa');
          else if (r < 0.75) return this.buildQuestionItem(this.generateFloatingBalloonQuestion(0), '🎈 Balon Avı');
          else return this.buildQuestionItem(this.generateMemoryGridQuestion(0), '🧠 Hafıza Kartları');
        } else if (g === 1) {
          const raw = this.generateGrade1TurkishKarma();
          return this.buildQuestionItem(raw, '📚 1. Sınıf Türkçe Karma');
        } else if (g === 2) {
          const raw = this.generateGrade2TurkishKarma();
          return this.buildQuestionItem(raw, '📚 2. Sınıf Türkçe Karma');
        } else if (g === 3) {
          const r = Math.random();
          if (r < 0.5) {
            const raw = this.drawFromPool(this.grade3HomonymsFigurativePool, "grade3HomonymsFigurativePool");
            return this.buildQuestionItem({
              question: raw.q,
              correct: raw.a,
              distractors: raw.d,
              explanation: raw.exp
            }, '🎭 Eş Sesli Kelimeler & Mecaz');
          } else {
            const raw = this.drawFromPool(this.grade3Punctuation5N1KPool, "grade3Punctuation5N1KPool");
            return this.buildQuestionItem({
              question: raw.q,
              correct: raw.a,
              distractors: raw.d,
              explanation: raw.exp
            }, '✍️ Noktalama & 5N1K');
          }
        } else {
          const r = Math.random();
          if (r < 0.5) {
            const raw = this.drawFromPool(this.grade4IdiomsProverbsPool, "grade4IdiomsProverbsPool");
            return this.buildQuestionItem({
              question: raw.q,
              correct: raw.a,
              distractors: raw.d,
              explanation: raw.exp
            }, '🏆 Deyimler ve Atasözleri');
          } else {
            const raw = this.drawFromPool(this.grade4SentencesLogicPool, "grade4SentencesLogicPool");
            return this.buildQuestionItem({
              question: raw.q,
              correct: raw.a,
              distractors: raw.d,
              explanation: raw.exp
            }, '💡 Cümlede Anlam & Mantık');
          }
        }
      } else if (gameType === 'lifescience') {
        if (g === 1) {
          const raw = this.generateGrade1LifeScienceKarma();
          return this.buildQuestionItem(raw, '🌱 Hayat Bilgisi Karma Düello');
        } else if (g === 2) {
          const raw = this.generateGrade2LifeScienceKarma();
          return this.buildQuestionItem(raw, '🌟 2. Sınıf Hayat Bilgisi Karma Düello');
        } else if (g === 3) {
          const raw = this.generateGrade3LifeScienceKarma();
          return this.buildQuestionItem(raw, '🌱 3. Sınıf Hayat Bilgisi Karma');
        } else {
          let filtered = this.lifeSciencePool.filter(item => !item.grade || item.grade <= g);
          if (filtered.length === 0) filtered = this.lifeSciencePool;
          const raw = this.drawFromPool(filtered, "filtered");
          return this.buildQuestionItem({
            question: raw.q,
            correct: raw.a,
            distractors: raw.d,
            explanation: raw.exp,
            audioKey: raw.audioKey || null
          }, '🌱 Hayat Bilgisi');
        }
      } else if (gameType === 'science') {
        if (g === 3) {
          const raw = this.generateGrade3ScienceKarma();
          return this.buildQuestionItem(raw, '🔬 3. Sınıf Fen Bilimleri Karma');
        } else if (g === 4) {
          const r = Math.random();
          if (r < 0.5) {
            const raw = this.drawFromPool(this.grade4CrustNutritionPool, "grade4CrustNutritionPool");
            return this.buildQuestionItem({ question: raw.q, correct: raw.a, distractors: raw.d, explanation: raw.exp }, '🌍 Yer Kabuğu & Besinlerimiz');
          } else {
            const raw = this.drawFromPool(this.grade4CircuitsMagnetsPool, "grade4CircuitsMagnetsPool");
            return this.buildQuestionItem({ question: raw.q, correct: raw.a, distractors: raw.d, explanation: raw.exp }, '💡 Mıknatıslar & Elektrik Devreleri');
          }
        } else {
          let filtered = this.sciencePool.filter(item => !item.grade || item.grade === g || item.grade <= g);
          if (filtered.length === 0) filtered = this.sciencePool;
          const raw = this.drawFromPool(filtered, "filtered");
          return this.buildQuestionItem({
            question: raw.q,
            correct: raw.a,
            distractors: raw.d,
            explanation: raw.exp,
            audioKey: raw.audioKey || null
          }, '🔬 Fen Bilimleri');
        }
      } else if (gameType === 'social') {
        const r = Math.random();
        if (r < 0.5) {
          const raw = this.drawFromPool(this.grade4IdentityHeroesPool, "grade4IdentityHeroesPool");
          return this.buildQuestionItem({ question: raw.q, correct: raw.a, distractors: raw.d, explanation: raw.exp }, '🇹🇷 Birey, Toplum & Kahramanlarımız');
        } else {
          const raw = this.drawFromPool(this.grade4PlacesEconomyPool, "grade4PlacesEconomyPool");
          return this.buildQuestionItem({ question: raw.q, correct: raw.a, distractors: raw.d, explanation: raw.exp }, '🗺️ İnsanlar, Yerler & Üretim');
        }
      } else if (gameType === 'english_colors') {
        const raw = this.drawFromPool(this.englishColorsPool, "englishColorsPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp,
          englishWord: raw.englishWord,
          lang: 'en'
        }, '🎨 Renkler (Colors Matching)');
      } else if (gameType === 'english_animals') {
        const raw = this.drawFromPool(this.englishAnimalsPool, "englishAnimalsPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp,
          englishWord: raw.englishWord,
          lang: 'en'
        }, '🐾 Hayvanlar (Animals Matching)');
      } else if (gameType === 'english_numbers') {
        const raw = this.drawFromPool(this.englishNumbersPool, "englishNumbersPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp,
          englishWord: raw.englishWord,
          lang: 'en'
        }, '🔢 Sayılar (Numbers Matching)');
      } else if (gameType === 'english_greetings') {
        const raw = this.drawFromPool(this.englishGreetingsPool, "englishGreetingsPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp,
          englishWord: raw.englishWord,
          lang: 'en'
        }, '👋 Günlük İfadeler (Greetings)');
      } else if (gameType === 'english') {
        const allPools = [
          ...this.englishColorsPool,
          ...this.englishAnimalsPool,
          ...this.englishNumbersPool,
          ...this.englishGreetingsPool,
          ...this.englishSchoolObjectsPool,
          ...this.englishAnimalsAndFruitsPool,
          ...this.grade3FamilyFeelingsPool,
          ...this.grade4CountriesRoutinesPool,
          ...this.englishPool
        ];
        const raw = this.drawFromPool(allPools, "allPools");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp,
          englishWord: raw.englishWord,
          lang: 'en'
        }, '🇬🇧 English Word Battle');
      } else if (gameType === 'oddone') {
        const raw = this.generateOddOneQuestion(g);
        return this.buildQuestionItem(raw, '👀 Farklı Olanı Yakala');
      } else if (gameType === 'stroop') {
        const raw = this.generateStroopQuestion(g);
        return this.buildQuestionItem(raw, '🎯 Renk Tuzakları (Stroop)');
      } else if (gameType === 'memory') {
        const raw = this.generateMemorySequenceQuestion(g);
        return this.buildQuestionItem(raw, '🧠 Süper Hafıza');
      } else if (gameType === 'reflex') {
        // %50 Şimşek Refleks (Hedef Avı), %50 Doğru / Yanlış Refleks Düellosu
        if (Math.random() < 0.5) {
          return this.generateTrueFalseQuestion(g);
        } else {
          const raw = this.generateSpeedReflexQuestion(g);
          return this.buildQuestionItem(raw, '⚡ Şimşek Refleks');
        }
      } else if (gameType === 'true_false') {
        return this.generateTrueFalseQuestion(g);
      } else if (gameType === 'matching') {
        return this.generateMatchingQuestion(g);
      } else {
        const raw = this.generateGrade1Math();
        return this.buildQuestionItem(raw, '📐 Matematik Düellosu');
      }
    }
  };

  /* ==========================================================================
     4. KONFETİ SİSTEMİ: CANVAS PARTİKÜL MOTORU (SADECE OYUN/ZAFER EKRANINDA)
     ========================================================================== */
  class ConfettiCanon {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.particles = [];
      this.animId = null;
      this.resize = this.resize.bind(this);
      window.addEventListener('resize', () => {
        // Ana sayfayı meşgul etmemek için sadece oyun veya zafer ekranında resize yap
        if (state.currentView === 'duel' || (DOM.victoryOverlay && !DOM.victoryOverlay.classList.contains('hide'))) {
          this.resize();
        }
      });
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    burst() {
      // Sadece oyun veya zafer ekranında çalıştır, ana sayfayı meşgul etmesin
      const isGameActive = state.currentView === 'duel' || 
        (DOM.viewDuel && DOM.viewDuel.classList.contains('active')) || 
        (DOM.victoryOverlay && !DOM.victoryOverlay.classList.contains('hide'));
      if (!isGameActive) return;
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
      // Oyun veya zafer ekranından çıkıldıysa partikülleri durdur
      const isGameActive = state.currentView === 'duel' || 
        (DOM.viewDuel && DOM.viewDuel.classList.contains('active')) || 
        (DOM.victoryOverlay && !DOM.victoryOverlay.classList.contains('hide'));
      if (!isGameActive) {
        this.stop();
        return;
      }
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
      this.animId = null;
      this.particles = [];
      if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /* ==========================================================================
     4.5. JUICINESS & GAME FEEL PARTİKÜL MOTORU (SADECE OYUN EKRANINDA ÇALIŞIR)
     ========================================================================== */
  class JuiceParticleEngine {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.particles = [];
      this.animId = null;
      this.resize = this.resize.bind(this);
      this.loop = this.loop.bind(this);
      window.addEventListener('resize', () => {
        // Sadece aktif oyunda canvas boyutlandır
        if (state.currentView === 'duel' || (DOM.viewDuel && DOM.viewDuel.classList.contains('active'))) {
          this.resize();
        }
      });
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    burst(x, y, mode = 'stars') {
      // Sadece oyun ekranında (ihtiyaç anında) çalışacak şekilde sınırla, ana sayfayı meşgul etmesin
      if (state.currentView !== 'duel' && (!DOM.viewDuel || !DOM.viewDuel.classList.contains('active'))) {
        return;
      }
      if (!this.canvas || !this.ctx) return;
      this.resize();

      const starIcons = ['⭐', '✨', '🌟'];
      const starColors = ['#10b981', '#34d399', '#6ee7b7', '#f59e0b', '#fbbf24', '#ffffff', '#38bdf8'];
      const fireColors = ['#ef4444', '#f97316', '#f59e0b', '#fbbf24', '#ffffff', '#dc2626'];

      const count = (mode === 'fire') ? 36 : 28;

      for (let i = 0; i < count; i++) {
        const isEmoji = (mode !== 'fire' && Math.random() < 0.45);
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 9 + 4;
        const pColor = (mode === 'fire')
          ? fireColors[Math.floor(Math.random() * fireColors.length)]
          : starColors[Math.floor(Math.random() * starColors.length)];

        this.particles.push({
          x: x || (window.innerWidth / 2),
          y: y || (window.innerHeight / 2),
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 3,
          vy: Math.sin(angle) * speed - Math.random() * 4,
          gravity: 0.22,
          color: pColor,
          size: Math.random() * 8 + 6,
          isEmoji: isEmoji,
          emoji: starIcons[Math.floor(Math.random() * starIcons.length)],
          rot: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 14,
          opacity: 1,
          decay: Math.random() * 0.018 + 0.016
        });
      }

      if (!this.animId) {
        this.animId = requestAnimationFrame(this.loop);
      }
    }

    loop() {
      // Oyun ekranı kapandıysa partikülleri anında temizle ve durdur
      if (state.currentView !== 'duel' && (!DOM.viewDuel || !DOM.viewDuel.classList.contains('active'))) {
        this.stop();
        return;
      }
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      let alive = 0;
      for (let p of this.particles) {
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        p.opacity -= p.decay;

        if (p.opacity > 0 && p.y < this.canvas.height + 60) {
          alive++;
          this.ctx.save();
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate((p.rot * Math.PI) / 180);
          this.ctx.globalAlpha = Math.max(0, p.opacity);

          if (p.isEmoji) {
            this.ctx.font = `${p.size * 1.8}px system-ui, sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(p.emoji, 0, 0);
          } else {
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
          }
          this.ctx.restore();
        }
      }

      this.particles = this.particles.filter(p => p.opacity > 0);

      if (this.particles.length > 0) {
        this.animId = requestAnimationFrame(this.loop);
      } else {
        this.animId = null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    stop() {
      if (this.animId) cancelAnimationFrame(this.animId);
      this.animId = null;
      this.particles = [];
      if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /* ==========================================================================
     5. YEREL DEPOLAMA (LOCALSTORAGE) YÖNETİCİSİ
     ========================================================================== */
  const StorageManager = {
    KEYS: {
      TEACHER: 'dersebimola_teacher',
      ROSTER: 'dersebimola_roster',
      TODAY_SELECTED: 'dersebimola_today_selected',
      CUSTOM_Q: 'dersebimola_custom_questions',
      CUSTOM_QUIZZES: 'custom_quizzes',
      LEAGUE: 'dersebimola_league',
      SETTINGS: 'dersebimola_settings'
    },

    loadAll() {
      try {
        const teacher = localStorage.getItem(this.KEYS.TEACHER);
        if (teacher) state.teacherSession = JSON.parse(teacher);

        const roster = localStorage.getItem(this.KEYS.ROSTER);
        if (roster) {
          const parsed = JSON.parse(roster);
          if (Array.isArray(parsed) && parsed.length > 0) state.classRoster = parsed;
        }

        const todaySelected = localStorage.getItem(this.KEYS.TODAY_SELECTED);
        if (todaySelected) {
          const parsedToday = JSON.parse(todaySelected);
          if (Array.isArray(parsedToday)) state.todaySelectedStudents = parsedToday;
        }

        const customQ = localStorage.getItem(this.KEYS.CUSTOM_Q);
        if (customQ) state.customQuestions = JSON.parse(customQ);

        const customQuizzes = localStorage.getItem(this.KEYS.CUSTOM_QUIZZES);
        if (customQuizzes) {
          try {
            const parsed = JSON.parse(customQuizzes);
            if (Array.isArray(parsed) && parsed.length > 0) state.customQuizzes = parsed;
          } catch (e) {}
        }
        if (!state.customQuizzes || state.customQuizzes.length === 0) {
          state.customQuizzes = [
            {
              id: 'quiz_sample_math_brain',
              title: '🌟 Örnek Hızlı Matematik & Dikkat Sınavı',
              createdAt: new Date().toLocaleDateString('tr-TR'),
              questions: [
                {
                  id: 'q_sample_1',
                  question: '25 sayısının 4 katının 20 eksiği kaçtır?',
                  options: { A: '80', B: '70', C: '90', D: '100' },
                  correctOption: 'A',
                  correctText: '80',
                  wrongOptions: ['70', '90', '100'],
                  explanation: '25 × 4 = 100. 100 - 20 = 80 eder.'
                },
                {
                  id: 'q_sample_2',
                  question: 'Hangi geometrik şeklin köşesi ve kenarı yoktur?',
                  options: { A: 'Üçgen', B: 'Kare', C: 'Çember', D: 'Dikdörtgen' },
                  correctOption: 'C',
                  correctText: 'Çember',
                  wrongOptions: ['Üçgen', 'Kare', 'Dikdörtgen'],
                  explanation: 'Çemberin kenarı ve köşesi yoktur.'
                },
                {
                  id: 'q_sample_3',
                  question: 'Günde 2 saat kitap okuyan bir öğrenci 1 haftada kaç saat okur?',
                  options: { A: '12 saat', B: '14 saat', C: '16 saat', D: '10 saat' },
                  correctOption: 'B',
                  correctText: '14 saat',
                  wrongOptions: ['12 saat', '16 saat', '10 saat'],
                  explanation: '1 hafta = 7 gün. 7 × 2 = 14 saat okur.'
                }
              ]
            }
          ];
          try { localStorage.setItem(this.KEYS.CUSTOM_QUIZZES, JSON.stringify(state.customQuizzes)); } catch (e) {}
        }

        const league = localStorage.getItem(this.KEYS.LEAGUE);
        if (league) state.leagueScores = JSON.parse(league);

        const settings = localStorage.getItem(this.KEYS.SETTINGS);
        if (settings) {
          const parsed = JSON.parse(settings);
          if (parsed.targetScore) state.targetScore = parsed.targetScore;
          if (parsed.gameMode) state.gameMode = parsed.gameMode;
          if (parsed.soundEnabled !== undefined) state.soundEnabled = parsed.soundEnabled;
          if (parsed.announcerEnabled !== undefined) state.announcerEnabled = parsed.announcerEnabled;
          if (parsed.autoReadQuestion !== undefined) state.autoReadQuestion = parsed.autoReadQuestion;
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
    saveTodaySelected() {
      try { localStorage.setItem(this.KEYS.TODAY_SELECTED, JSON.stringify(state.todaySelectedStudents)); } catch (e) {}
    },
    saveCustomQuestions() {
      try { localStorage.setItem(this.KEYS.CUSTOM_Q, JSON.stringify(state.customQuestions)); } catch (e) {}
    },
    saveCustomQuizzes() {
      try { localStorage.setItem(this.KEYS.CUSTOM_QUIZZES, JSON.stringify(state.customQuizzes)); } catch (e) {}
    },
    saveLeague() {
      try { localStorage.setItem(this.KEYS.LEAGUE, JSON.stringify(state.leagueScores)); } catch (e) {}
    },
    saveSettings() {
      try {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify({
          targetScore: state.targetScore,
          gameMode: state.gameMode,
          soundEnabled: state.soundEnabled,
          announcerEnabled: state.announcerEnabled,
          autoReadQuestion: state.autoReadQuestion,
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
    moliWidget: document.getElementById('moliWidget'),
    moliImg: document.getElementById('moliImg'),
    moliSpeechBubble: document.getElementById('moliSpeechBubble'),
    moliBubbleText: document.getElementById('moliBubbleText'),
    logoBtn: document.getElementById('logoBtn'),
    btnNavHome: document.getElementById('btnNavHome'),
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

    // Oyun Modu Seçici (Düello vs Tek Kişilik Pratik)
    modeSwitchContainer: document.getElementById('modeSwitchContainer'),
    btnModeDuel: document.getElementById('btnModeDuel'),
    btnModeSolo: document.getElementById('btnModeSolo'),
    btnDesktopGameMode: document.getElementById('btnDesktopGameMode'),
    desktopModeIcon: document.getElementById('desktopModeIcon'),
    desktopModeText: document.getElementById('desktopModeText'),
    btnSettingsModeToggle: document.getElementById('btnSettingsModeToggle'),
    btnStageQuickDuels: document.getElementById('btnStageQuickDuels'),
    btnModalDuels: document.getElementById('btnModalDuels'),
    btnSidebarDuels: document.getElementById('btnSidebarDuels'),
    activeContestantsBar: document.getElementById('activeContestantsBar'),
    contestantTagP1: document.getElementById('contestantTagP1'),
    contestantTagP2: document.getElementById('contestantTagP2'),
    teamBadgeP1: document.getElementById('teamBadgeP1'),
    vsCircle: document.getElementById('vsCircle'),
    quickDrawBtnText: document.getElementById('quickDrawBtnText'),
    splitArena: document.querySelector('.split-arena'),

    // Lobi Elemanları: 0. Kademe (Ana Sayfa Vitrini), 1. Kademe (Dersler) & 2. Kademe (Oyunlar)
    homeShowcaseSection: document.getElementById('homeShowcaseSection'),
    homeGradeCards: document.querySelectorAll('.home-grade-card'),
    homePopularCards: document.querySelectorAll('.home-popular-card'),
    btnBackToHome: document.getElementById('btnBackToHome'),
    subjectsSection: document.getElementById('subjectsSection'),
    subjectsGradeTitle: document.getElementById('subjectsGradeTitle'),
    subjectsCountBadge: document.getElementById('subjectsCountBadge'),
    subjectsGrid: document.getElementById('subjectsGrid'),
    gamesSection: document.getElementById('gamesSection'),
    btnBackToSubjects: document.getElementById('btnBackToSubjects'),
    currentSubjectIcon: document.getElementById('currentSubjectIcon'),
    currentSubjectTitle: document.getElementById('currentSubjectTitle'),
    currentSubjectGrade: document.getElementById('currentSubjectGrade'),
    lobbyP1Name: document.getElementById('lobbyPlayer1Name'),
    lobbyP2Name: document.getElementById('lobbyPlayer2Name'),
    btnHeroStart: document.getElementById('btnHeroStart'),
    btnQuickDraw: document.getElementById('btnQuickDrawPlayers'),
    subcategorySection: document.getElementById('subcategorySection'),
    subcategoryTabs: document.getElementById('subcategoryTabs'),
    maarifReadingContainer: document.getElementById('maarifReadingContainer'),
    maarifGroupsNav: document.getElementById('maarifGroupsNav'),
    maarifLettersRail: document.getElementById('maarifLettersRail'),
    maarifCumulativeBadge: document.getElementById('maarifCumulativeBadge'),
    gamesCountBadge: document.getElementById('gamesCountBadge'),
    gamesGrid: document.getElementById('gamesGrid'),
    targetScoreBtns: document.querySelectorAll('.score-btn'),
    chkAutoExplanation: document.getElementById('chkAutoExplanation'),
    chkAnnouncerVoice: document.getElementById('chkAnnouncerVoice'),
    chkAutoReadQuestion: document.getElementById('chkAutoReadQuestion'),

    // Düello HUD
    btnExitDuel: document.getElementById('btnExitDuel'),
    duelGradeBadge: document.getElementById('duelGradeBadge'),
    duelGameTypeBadge: document.getElementById('duelGameTypeBadge'),
    duelRoundBadge: document.getElementById('duelRoundBadge'),
    btnHudReadQuestion: document.getElementById('btnHudReadQuestion'),
    btnToggleSolutionNow: document.getElementById('btnToggleSolutionNow'),
    btnSkipQuestion: document.getElementById('btnSkipQuestion'),
    btnToggleAnnouncerDuel: document.getElementById('btnToggleAnnouncerDuel'),
    announcerHudIcon: document.getElementById('announcerHudIcon'),
    announcerHudText: document.getElementById('announcerHudText'),

    // Hızlı Refleks Zaman Barı (Doğru / Yanlış Modu)
    duelTimeBarTrack: document.getElementById('duelTimeBarTrack'),
    duelTimeBarFill: document.getElementById('duelTimeBarFill'),
    duelTimeBadge: document.getElementById('duelTimeBadge'),

    // Kombo & Ateş Modu ve Parçacık Katmanı
    comboFireBanner: document.getElementById('comboFireBanner'),
    comboFireTitle: document.getElementById('comboFireTitle'),
    comboFireSubtitle: document.getElementById('comboFireSubtitle'),
    gameParticlesCanvas: document.getElementById('gameParticlesCanvas'),

    // Düello: Oyuncu 1 (Mavi)
    p1Panel: document.getElementById('playerPanel1'),
    duelP1Avatar: document.getElementById('duelP1Avatar'),
    duelP1TeamTitle: document.getElementById('duelP1TeamTitle'),
    duelP1Name: document.getElementById('duelP1Name'),
    p1ScoreContainer: document.getElementById('p1ScoreContainer'),
    p1StreakFlame: document.getElementById('p1StreakFlame'),
    p1StreakCount: document.getElementById('p1StreakCount'),
    p1ScoreBadge: document.getElementById('p1ScoreBadge'),
    p1StarsTrack: document.getElementById('p1StarsTrack'),
    p1QuestionCard: document.getElementById('p1QuestionCard'),
    p1QuestionCategory: document.getElementById('p1QuestionCategory'),
    p1QuestionText: document.getElementById('p1QuestionText'),
    btnReadAloudP1: document.getElementById('btnReadAloudP1'),
    p1OptionsGrid: document.getElementById('p1OptionsGrid'),
    p1InteractiveZone: document.getElementById('p1InteractiveZone'),
    p1OptA: document.getElementById('p1OptA'),
    p1OptB: document.getElementById('p1OptB'),
    p1OptC: document.getElementById('p1OptC'),
    p1OptD: document.getElementById('p1OptD'),
    p1OptTextA: document.getElementById('p1OptTextA'),
    p1OptTextB: document.getElementById('p1OptTextB'),
    p1OptTextC: document.getElementById('p1OptTextC'),
    p1OptTextD: document.getElementById('p1OptTextD'),
    p1LockOverlay: document.getElementById('p1LockoutOverlay'),
    p1LockoutDesc: document.getElementById('p1LockoutDesc'),
    p1LockProgress: document.getElementById('p1LockProgress'),
    p1WinToast: document.getElementById('p1WinToast'),

    // Düello: Oyuncu 2 (Kırmızı)
    p2Panel: document.getElementById('playerPanel2'),
    duelP2Name: document.getElementById('duelP2Name'),
    p2ScoreContainer: document.getElementById('p2ScoreContainer'),
    p2StreakFlame: document.getElementById('p2StreakFlame'),
    p2StreakCount: document.getElementById('p2StreakCount'),
    p2ScoreBadge: document.getElementById('p2ScoreBadge'),
    p2StarsTrack: document.getElementById('p2StarsTrack'),
    p2QuestionCard: document.getElementById('p2QuestionCard'),
    p2QuestionCategory: document.getElementById('p2QuestionCategory'),
    p2QuestionText: document.getElementById('p2QuestionText'),
    btnReadAloudP2: document.getElementById('btnReadAloudP2'),
    p2OptionsGrid: document.getElementById('p2OptionsGrid'),
    p2InteractiveZone: document.getElementById('p2InteractiveZone'),
    p2OptA: document.getElementById('p2OptA'),
    p2OptB: document.getElementById('p2OptB'),
    p2OptC: document.getElementById('p2OptC'),
    p2OptD: document.getElementById('p2OptD'),
    p2OptTextA: document.getElementById('p2OptTextA'),
    p2OptTextB: document.getElementById('p2OptTextB'),
    p2OptTextC: document.getElementById('p2OptTextC'),
    p2OptTextD: document.getElementById('p2OptTextD'),
    p2LockOverlay: document.getElementById('p2LockoutOverlay'),
    p2LockProgress: document.getElementById('p2LockProgress'),
    p2WinToast: document.getElementById('p2WinToast'),

    // Çözüm Bildirimi
    solutionPopup: document.getElementById('solutionPopup'),
    solutionText: document.getElementById('solutionText'),
    btnCloseSolution: document.getElementById('btnCloseSolution'),

    // Zafer Ekranı
    victoryWinnerTitle: document.getElementById('victoryWinnerTitle'),
    victorySubtitle: document.getElementById('victorySubtitle'),
    victoryCongrats: document.getElementById('victoryCongrats'),
    victoryScoreBox: document.getElementById('victoryScoreBox'),
    victoryBlueBox: document.getElementById('victoryBlueBox'),
    victoryBlueName: document.getElementById('victoryBlueName'),
    victoryBlueScore: document.getElementById('victoryBlueScore'),
    victoryScoreVs: document.getElementById('victoryScoreVs'),
    victoryRedBox: document.getElementById('victoryRedBox'),
    victoryRedName: document.getElementById('victoryRedName'),
    victoryRedScore: document.getElementById('victoryRedScore'),
    btnRematchSame: document.getElementById('btnRematchSame'),
    btnSelectNewStudents: document.getElementById('btnSelectNewStudents'),
    btnBackToLobby: document.getElementById('btnBackToLobby'),

    // Modaller
    modalConfirmExit: document.getElementById('modalConfirmExit'),
    exitConfirmTitle: document.getElementById('exitConfirmTitle'),
    exitConfirmDesc: document.getElementById('exitConfirmDesc'),
    btnConfirmExitYes: document.getElementById('btnConfirmExitYes'),
    btnConfirmExitNo: document.getElementById('btnConfirmExitNo'),

    modalAuth: document.getElementById('modalAuth'),
    btnSimulateGoogleLogin: document.getElementById('btnSimulateGoogleLogin'),

    modalPicker: document.getElementById('modalPicker'),
    pickerMoliBubble: document.getElementById('pickerMoliBubble'),
    pickerMoliImg: document.getElementById('pickerMoliImg'),
    btnPickerModeSingle: document.getElementById('btnPickerModeSingle'),
    btnPickerModeDuel: document.getElementById('btnPickerModeDuel'),
    btnPickerTabRoster: document.getElementById('btnPickerTabRoster'),
    pickerStageSection: document.getElementById('pickerStageSection'),
    pickerRosterSection: document.getElementById('pickerRosterSection'),
    pickerSingleStage: document.getElementById('pickerSingleStage'),
    pickerDuelStage: document.getElementById('pickerDuelStage'),
    singleSlotCard: document.getElementById('singleSlotCard'),
    singleSlotAvatar: document.getElementById('singleSlotAvatar'),
    singleSlotName: document.getElementById('singleSlotName'),
    singleSlotSub: document.getElementById('singleSlotSub'),
    slotCrownAura: document.getElementById('slotCrownAura'),
    slotCardBlue: document.getElementById('slotCardBlue'),
    slotCardRed: document.getElementById('slotCardRed'),
    slotName1: document.getElementById('slotName1'),
    slotName2: document.getElementById('slotName2'),
    btnSpinWheel: document.getElementById('btnSpinWheel'),
    btnSpinWheelText: document.getElementById('btnSpinWheelText'),
    pickerResultActions: document.getElementById('pickerResultActions'),
    btnAddTodaySelected: document.getElementById('btnAddTodaySelected'),
    btnSpeakStudentName: document.getElementById('btnSpeakStudentName'),
    btnApplySelectedStudents: document.getElementById('btnApplySelectedStudents'),
    chkExcludeToday: document.getElementById('chkExcludeToday'),
    poolStatusBadge: document.getElementById('poolStatusBadge'),
    todayCount: document.getElementById('todayCount'),
    todayChipsList: document.getElementById('todayChipsList'),
    btnResetTodaySelected: document.getElementById('btnResetTodaySelected'),
    rosterTextarea: document.getElementById('rosterTextarea'),
    rosterCount: document.getElementById('rosterCount'),
    rosterCountBadge: document.getElementById('rosterCountBadge'),
    btnSaveRoster: document.getElementById('btnSaveRoster'),
    btnResetRoster: document.getElementById('btnResetRoster'),
    btnClearRoster: document.getElementById('btnClearRoster'),
    btnBackToStage: document.getElementById('btnBackToStage'),

    modalCustomQ: document.getElementById('modalCustomQ'),
    formCustomQuizBuilder: document.getElementById('formCustomQuizBuilder'),
    quizTitleInput: document.getElementById('quizTitleInput'),
    quizQuestionInput: document.getElementById('quizQuestionInput'),
    quizCurrentQBadge: document.getElementById('quizCurrentQBadge'),
    quizStagedCountBadge: document.getElementById('quizStagedCountBadge'),
    quizChoiceInputA: document.getElementById('quizChoiceInputA'),
    quizChoiceInputB: document.getElementById('quizChoiceInputB'),
    quizChoiceInputC: document.getElementById('quizChoiceInputC'),
    quizChoiceInputD: document.getElementById('quizChoiceInputD'),
    btnQuizAddQuestion: document.getElementById('btnQuizAddQuestion'),
    btnQuizSaveQuiz: document.getElementById('btnQuizSaveQuiz'),
    stagedQuestionsPreview: document.getElementById('stagedQuestionsPreview'),
    stagedChipsList: document.getElementById('stagedChipsList'),
    savedQuizzesList: document.getElementById('savedQuizzesList'),
    savedQuizzesCountBadge: document.getElementById('savedQuizzesCountBadge'),

    modalLeaderboard: document.getElementById('modalLeaderboard'),
    leaderboardTbody: document.getElementById('leaderboardTbody'),
    btnResetLeague: document.getElementById('btnResetLeague'),

    // Global Toast
    globalToast: document.getElementById('globalToast'),
    toastMsg: document.getElementById('toastMsg'),

    // Paylaşım & WhatsApp Araçları
    btnSidebarShare: document.getElementById('btnSidebarShare'),
    btnTopbarShare: document.getElementById('btnTopbarShare'),
    btnShareVictoryWhatsApp: document.getElementById('btnShareVictoryWhatsApp'),
    btnCopyVictoryLink: document.getElementById('btnCopyVictoryLink'),
    shareToast: document.getElementById('shareToast'),
    shareToastDesc: document.getElementById('shareToastDesc')
  };

  const confetti = new ConfettiCanon('confettiCanvas');
  const particles = new JuiceParticleEngine('gameParticlesCanvas');

  /* ==========================================================================
     6.5. JUICINESS & GAME FEEL YARDIMCILARI (KOMBO, SHAKE & FLOATING SCORE)
     ========================================================================== */
  let comboBannerTimer = null;

  // Yanlış cevapta ekran hafifçe titresin (Shake animasyonu)
  function triggerScreenShake() {
    const arena = DOM.splitArena || DOM.viewDuel || document.body;
    arena.classList.remove('screen-shaking');
    void arena.offsetWidth; // Force reflow
    arena.classList.add('screen-shaking');
    setTimeout(() => {
      arena.classList.remove('screen-shaking');
    }, 460);
  }

  // Doğru cevapta yukarı doğru süzülen "+10 Puan" yazısı
  function spawnFloatingScore(x, y, text = '+10 Puan', isStreak = false) {
    const floater = document.createElement('div');
    floater.className = `floating-score-badge ${isStreak ? 'streak-fire' : ''}`;
    floater.innerHTML = `<span>${text}</span>`;
    floater.style.left = `${x || (window.innerWidth / 2)}px`;
    floater.style.top = `${y || (window.innerHeight / 2)}px`;
    document.body.appendChild(floater);

    floater.addEventListener('animationend', () => {
      if (floater.parentNode) floater.parentNode.removeChild(floater);
    });
  }

  // 3x ve üzeri serilerde ekrana coşkulu alevli kombo banner'ı çıkar
  function showComboFireBanner(playerNum, streak) {
    if (!DOM.comboFireBanner) return;
    const playerName = (playerNum === 1) ? state.player1.name : state.player2.name;
    const teamTitle = (playerNum === 1) ? 'Mavi Takım' : 'Kırmızı Takım';

    if (DOM.comboFireTitle) {
      if (streak === 3) {
        DOM.comboFireTitle.textContent = `🔥 3x SERİ! SÜPERSİN! 🔥`;
      } else if (streak === 4) {
        DOM.comboFireTitle.textContent = `🔥 4x SERİ! ALEV ALDIN! 🔥`;
      } else {
        DOM.comboFireTitle.textContent = `🔥 ${streak}x EFSANEVİ SERİ! 🔥`;
      }
    }

    if (DOM.comboFireSubtitle) {
      DOM.comboFireSubtitle.textContent = `${playerName} (${teamTitle}) Ateş Modunda! Durdurulamıyor! ⚡🏆`;
    }

    if (comboBannerTimer) {
      clearTimeout(comboBannerTimer);
      comboBannerTimer = null;
    }

    DOM.comboFireBanner.classList.remove('hide', 'active');
    void DOM.comboFireBanner.offsetWidth; // Reflow
    DOM.comboFireBanner.classList.add('active');

    comboBannerTimer = setTimeout(() => {
      if (DOM.comboFireBanner) {
        DOM.comboFireBanner.classList.remove('active');
        DOM.comboFireBanner.classList.add('hide');
      }
    }, 1700);
  }

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

  // -------------------------------------------------------------
  // MOBİL & DOKUNMATİK EKRAN ETKİLEŞİM VE GHOST CLICK GÜVENLİK SİSTEMİ
  // Çok hızlı algılama, sürükleme/kaydırma sırasında yanlış açılma ve
  // ekran geçişlerinde ardışık tıklamaları (bleed-through) engeller.
  // -------------------------------------------------------------
  let globalInteractionLockUntil = 0;
  let lastGlobalTapTime = 0;

  function lockInteractions(ms = 380) {
    globalInteractionLockUntil = Math.max(globalInteractionLockUntil, Date.now() + ms);
  }

  function isInteractionLocked() {
    return Date.now() < globalInteractionLockUntil;
  }

  // Global Ghost Click & Rapid Tap Shield (Tüm sayfada geçiş anındaki sahte/art arda tıklamaları yutar)
  document.addEventListener('click', (e) => {
    if (isInteractionLocked()) {
      if (e && e.cancelable) e.preventDefault();
      if (e && e.stopPropagation) e.stopPropagation();
      if (e && e.stopImmediatePropagation) e.stopImmediatePropagation();
    }
  }, true);

  // Mobil ve Akıllı Tahta Güvenli Dokunmatik Tap Yöneticisi
  function addTapListener(el, callback) {
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let isScroll = false;
    let isPointerDown = false;

    el.addEventListener('pointerdown', (e) => {
      // Sadece ana tıklama (sol tık / tek parmak dokunma)
      if (e.button !== undefined && e.button !== 0) return;
      isPointerDown = true;
      isScroll = false;
      startX = e.clientX || 0;
      startY = e.clientY || 0;
    }, { passive: true });

    el.addEventListener('pointermove', (e) => {
      if (!isPointerDown) return;
      const dx = Math.abs((e.clientX || 0) - startX);
      const dy = Math.abs((e.clientY || 0) - startY);
      // Parmağı 8px'den fazla kaydırdıysa bu bir kaydırma (scroll) hareketidir, tıklama iptal edilir
      if (dx > 8 || dy > 8) {
        isScroll = true;
      }
    }, { passive: true });

    el.addEventListener('pointerup', () => {
      isPointerDown = false;
    }, { passive: true });

    el.addEventListener('pointercancel', () => {
      isPointerDown = false;
      isScroll = false;
    }, { passive: true });

    el.addEventListener('click', (e) => {
      // 1) Kullanıcı sayfayı kaydırıyorsa tıklama çalıştırma
      if (isScroll) {
        if (e && e.cancelable) e.preventDefault();
        return;
      }

      // 2) Ekran geçiş kilidi aktifse sahte/ardışık tıklamayı yut
      if (isInteractionLocked()) {
        if (e && e.cancelable) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();
        return;
      }

      // 3) Global tıklama debounce (çift tetikleme ve çok hızlı tıklama engeli)
      const now = Date.now();
      if (now - lastGlobalTapTime < 280) {
        if (e && e.cancelable) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();
        return;
      }
      lastGlobalTapTime = now;

      callback(e);
    });
  }

  function openModal(modalEl) {
    if (!modalEl) return;
    lockInteractions(350);
    audio.playClick();
    modalEl.classList.remove('hide');
  }

  // -------------------------------------------------------------
  // Panoya Kopyalama Yardımcısı (Tüm Tarayıcılar ve Akıllı Tahtalar)
  // -------------------------------------------------------------
  function copyTextToClipboard(textToCopy) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(textToCopy);
    }
    return new Promise((resolve, reject) => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        textArea.setAttribute('readonly', '');
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) resolve();
        else reject(new Error('Kopyalama başarısız'));
      } catch (err) {
        reject(err);
      }
    });
  }

  // -------------------------------------------------------------
  // Şık Moli Paylaşım Toast Bildirimi
  // -------------------------------------------------------------
  let shareToastTimer = null;
  function showShareToast(message) {
    if (DOM.shareToastDesc) {
      DOM.shareToastDesc.textContent = message || "Bağlantı kopyalandı! WhatsApp veya istediğiniz yere yapıştırabilirsiniz ✅";
    }
    if (DOM.shareToast) {
      DOM.shareToast.classList.remove('hide');
      void DOM.shareToast.offsetWidth; // Reflow tetikle
      DOM.shareToast.classList.add('show');
      if (shareToastTimer) clearTimeout(shareToastTimer);
      shareToastTimer = setTimeout(() => {
        DOM.shareToast.classList.remove('show');
        setTimeout(() => {
          if (!DOM.shareToast.classList.contains('show')) {
            DOM.shareToast.classList.add('hide');
          }
        }, 350);
      }, 4500);
    }
  }

  // -------------------------------------------------------------
  // Mobil & Masaüstü Paylaşım Motoru (Web Share API & WhatsApp)
  // -------------------------------------------------------------
  function shareContent({ title = "Derse Bi' Mola", text = "", url = "https://dersebimola.com", directWhatsApp = false } = {}) {
    audio.playClick();
    const shareText = text || `🎯 Derse Bi' Mola - İlkokul ve Okul Öncesi Eğitici Oyun & Düello Platformu! Hemen tıkla ve sınıfla oyna: ${url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

    if (directWhatsApp) {
      window.open(whatsappUrl, '_blank');
      return;
    }

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);

    if (isMobile && navigator.share) {
      navigator.share({
        title: title,
        text: shareText,
        url: url
      }).catch(err => {
        if (err && err.name !== 'AbortError') {
          window.open(whatsappUrl, '_blank');
        }
      });
    } else {
      // Bilgisayar veya Akıllı Tahta: Panoya kopyala ve şık bildirim göster
      copyTextToClipboard(shareText).then(() => {
        audio.playPop();
        showShareToast("Bağlantı kopyalandı! WhatsApp veya istediğiniz yere yapıştırabilirsiniz ✅");
      }).catch(() => {
        window.open(whatsappUrl, '_blank');
      });
    }
  }

  function shareActivity(activityName) {
    const text = `🎯 Derse Bi' Mola'da harika bir ${activityName} etkinliği var! Hemen tıkla ve pratiğe başla: https://dersebimola.com`;
    shareContent({
      title: `${activityName} - Derse Bi' Mola`,
      text: text,
      url: 'https://dersebimola.com',
      directWhatsApp: false
    });
  }

  const gameTypeBadges = {
    math: '📐 Matematik',
    turkish: '📚 Türkçe',
    english: '🇬🇧 İngilizce',
    lifescience: '🌱 Hayat Bilgisi',
    science: '🔬 Fen Bilimleri',
    social: '🌍 Sosyal Bilgiler',
    color_balloon: '🎈 Renk Balonları',
    count_tap: '🔢 Dokun & Say',
    shadow_match: '🧩 Gölgesini Bul',
    oddone: '👀 Farklı Olanı Bul',
    memory: '🧠 Hafıza Kartları',
    stroop: '🎨 Renk & Kelime',
    reflex: '⚡ Hızlı Refleks',
    true_false: '✅ Doğru / Yanlış',
    matching: '🎯 Dokun & Eşleştir',
    firstreading: '🔤 İlk Okuma Yazma',
    math_spatial_geo_1: '📐 Geometri & Uzamsal',
    math_numbers_quantities_1: '🔢 Sayılar (1-20)',
    math_operations_patterns_1: '➕➖ İşlemler & Örüntü',
    math_measure_money_time_1: '⏰ Ölçme, Saat & Para',
    math_data_tables_1: '📊 Grafik Dedektifi',
    math_1_karma: '🧮 Matematik Karma',
    turkish_listen_comprehend_1: '🎧 Dinleme & Anlama',
    turkish_sentence_punctuation_1: '✍️ Cümle & Noktalama',
    turkish_1_karma: '🦉 Türkçe Karma',
    lifescience_school_1: '🏫 Ben ve Okulum',
    lifescience_health_traffic_1: '🧼 Sağlık & Güvenlik',
    lifescience_family_home_1: '🏡 Ailem ve Toplum',
    lifescience_country_flag_1: '🇹🇷 Yaşadığım Yer & Ülkem',
    lifescience_nature_recycling_1: '🌿 Doğa ve Çevre',
    lifescience_1_karma: '🌱 Hayat Bilgisi Karma',
    grade1_grand_duel: '🏆 1. Sınıf Büyük Karma',
    math_operations_2: '➕➖ Toplama & Çıkarma',
    math_multiplication_division_2: '✖️➗ Çarpma & Bölme',
    math_fractions_time_money_2: '🍰 Kesir, Saat & Para',
    math_geometry_solids_2: '📐 Geometri & Cisimler',
    math_measure_data_2: '📊 Ölçme & Veri',
    math_2_karma: '🏆 2. Sınıf Matematik Karma',
    lifescience_school_2: '🏫 Okulumuzda Hayat',
    lifescience_health_2: '🍎 Sağlıklı Hayat',
    lifescience_safety_2: '🚦 Güvenli Hayat',
    lifescience_home_family_2: '🏡 Evimizde Hayat',
    lifescience_country_culture_2: '🇹🇷 Ülkemizde Hayat',
    lifescience_nature_environment_2: '🌿 Doğada Hayat',
    lifescience_2_karma: '🏆 2. Sınıf Hayat Bilgisi Karma',
    turkish_syn_ant_2: '✨ Eş & Zıt Anlam',
    turkish_alphabet_syllable_2: '🔤 Sözlük & Hece',
    turkish_reading_5n1k_2: '🔍 5N1K & Anlama',
    turkish_sentence_logic_2: '🧱 Kurallı Cümle',
    turkish_punctuation_spelling_2: '✍️ Noktalama & Yazım',
    turkish_2_karma: '🏆 2. Sınıf Türkçe Karma',
    grade2_grand_duel: '🏆 2. Sınıf Büyük Karma',
    science_planet_layers_3: '🌍 Dünya & Katmanlar',
    science_senses_3: '👂 Beş Duyumuz',
    science_force_motion_3: '🧲 Kuvvet & Hareket',
    science_matter_states_3: '🧊 Maddenin Halleri',
    science_light_sound_3: '💡 Işık ve Ses',
    science_living_environment_3: '🌱 Canlılar & Çevre',
    science_electricity_safety_3: '⚡ Elektrikli Araçlar',
    science_3_karma: '🏆 3. Sınıf Fen Karma',
    lifescience_school_professions_3: '🏫 Okul & Meslekler',
    lifescience_home_budget_3: '🏡 Plan & Tasarruf',
    lifescience_health_consumer_3: '🍎 Tüketici & Sağlık',
    lifescience_safety_traffic_3: '🚦 Trafik & Güvenlik',
    lifescience_country_leaders_3: '🇹🇷 Yönetim & Öncüler',
    lifescience_nature_directions_3: '🧭 Yönler & Doğa',
    lifescience_3_karma: '🏆 3. Sınıf Hayat Bilgisi Karma'
  };

  function getCurrentGameObject() {
    const g = state.currentGrade;
    const subjects = GRADE_SUBJECTS_CONFIG[g] || GRADE_SUBJECTS_CONFIG[1];
    if (subjects) {
      for (const s of subjects) {
        if (s.games) {
          const gm = s.games.find(x => x.id === state.currentGameType);
          if (gm) return gm;
        }
      }
    }
    return null;
  }

  function getCurrentGameTitle() {
    const g = state.currentGrade;
    const subjects = GRADE_SUBJECTS_CONFIG[g] || GRADE_SUBJECTS_CONFIG[1];
    if (subjects) {
      for (const s of subjects) {
        if (s.games) {
          const gm = s.games.find(x => x.id === state.currentGameType);
          if (gm) return gm.title;
        }
      }
    }
    const fallbackTitles = {
      maarif_sound_find: 'Sesi Hisset / Balon Patlatma',
      maarif_position: 'Başta mı, Ortada mı, Sonda mı?',
      maarif_case_match: 'Büyük-Küçük Harf Eşleştirme',
      maarif_syllable_build: 'Hece Birleştirme Atölyesi',
      maarif_speed_read: 'Kelime Oluşturma ve Yakalama',
      maarif_sentence_complete: 'Cümle Kurma ve Tamamlama',
      math: 'Matematik',
      math_rhythmic_1: 'Ritmik Sayma Düellosu',
      math_spatial_geo_1: 'Şekilleri Yakala & Neredeyim?',
      math_numbers_quantities_1: 'Onluk-Birlik Atölyesi & Ritmik Sayma Treni',
      math_operations_patterns_1: 'Matematik Düellosu & Örüntü Ustası',
      math_measure_money_time_1: 'Saat Kaç & Kumbaram',
      math_data_tables_1: 'Grafik Dedektifi',
      math_1_karma: 'Matematik Süper Karma Düello',
      turkish_listen_comprehend_1: 'Dinle, Anla ve Resmi Bul!',
      turkish_sentence_punctuation_1: 'Cümle Kurucu & Noktalama Avcısı',
      turkish_1_karma: 'Türkçe Süper Karma Düello',
      lifescience_school_1: 'Doğru Davranışı Seç & Okul Rehberi',
      lifescience_health_traffic_1: 'Sağlık Sepeti & Güvenli Yol',
      lifescience_family_home_1: 'Mutlu Evim & Sorumluluklarım',
      lifescience_country_flag_1: 'Milli Değerlerimiz & Bayramlarımız',
      lifescience_nature_recycling_1: 'Doğa Dostu & Geri Dönüşüm Avcısı',
      lifescience_1_karma: 'Hayat Bilgisi Karma Düello',
      grade1_grand_duel: '1. Sınıf Büyük Karma Düello',
      math_shapes_money_1: 'Geometrik Şekiller ve Paralarımız',
      turkish_antonyms_1: 'Zıt Anlamlı Kelimeler Avı',
      turkish_syllables_letters_1: 'Hece Sayısı ve Harf Bilgisi',
      lifescience_school_home_1: 'Okulumuzda ve Evimizde Hayat',
      lifescience_health_seasons_1: 'Sağlıklı Hayat ve Mevsimler',
      math_place_value_2: 'Basamak Değeri & Onluğa Yuvarlama Ustası',
      math_operations_2: 'Hızlı İşlem & Kayıp Sayı Düellosu',
      math_multiplication_division_2: 'Çarpım Kahramanı (1-5 & 10\'lar) & Eşit Paylaştır',
      math_fractions_time_money_2: 'Bütün-Yarım-Çeyrek & Saat/Kumbara Atölyesi',
      math_geometry_solids_2: 'Geometrik Cisim Avcısı & Simetri Aynası',
      math_measure_data_2: 'Metre-Kilogram & Grafik Dedektifi',
      math_2_karma: '2. Sınıf Matematik Büyük Karma Düello',
      math_multiplication_2: 'Hızlı Çarpma Başlangıcı',
      math_clock_2: 'Zamanı Ölçme ve Saatler',
      turkish_syn_ant_2: 'Eş ve Zıt Anlam Avcısı (Kelime Düellosu)',
      turkish_alphabet_syllable_2: 'Sözlük Sırası & Doğru Hece Bölme Atölyesi',
      turkish_reading_5n1k_2: '5N1K Dedektifi & Metin Anlama',
      turkish_sentence_logic_2: 'Kurallı Cümle İnşası',
      turkish_punctuation_spelling_2: 'Noktalama & Yazım Ustası Düellosu',
      turkish_punctuation_2: 'Noktalama İşaretleri ve Yazım Kuralları',
      turkish_2_karma: '2. Sınıf Türkçe Karma Düello',
      grade2_grand_duel: '2. Sınıf Büyük Karma Düello',
      lifescience_school_2: 'Okulda Empati & İş Birliği Düellosu',
      lifescience_health_2: 'Mevsim Tabakları & Sağlık Koruyucusu',
      lifescience_safety_2: 'Güvenli Adımlar & Acil Durum Avcısı',
      lifescience_home_family_2: 'İstek mi İhtiyaç mı? & Akraba Ağacı',
      lifescience_country_culture_2: 'Ülkemi Tanıyorum & Bayramlar Düellosu',
      lifescience_nature_environment_2: 'Doğa Dedektifi & Afet Bilinci',
      lifescience_2_karma: '2. Sınıf Hayat Bilgisi Karma Düello',
      lifescience_traffic_2: 'Güvenli Hayat ve Trafik',
      lifescience_culture_2: 'Ülkemiz ve Kültürümüz',
      english_school_objects_2: 'Colors, Numbers & Classroom Objects',
      english_animals_fruits_2: 'Animals & Fruits',
      turkish: 'Türkçe & Kelime Avcısı',
      firstreading: 'İlk Okuma & Ses Avcısı',
      firstreading_balloon: 'Ses & Harf Balonları',
      syllable_builder: 'Hece Birleştirme Atölyesi',
      word_catch: 'Hızlı Kelime Yakala',
      color_balloon: 'Renk Balonları',
      count_tap: 'Sayma Pratiği',
      shadow_match: 'Gölge Eşleştirme',
      lifescience: 'Hayat Bilgisi',
      science: 'Fen Bilimleri',
      social: 'Sosyal Bilgiler',
      english: 'İngilizce',
      english_colors: 'İngilizce Renkler',
      english_animals: 'İngilizce Hayvanlar',
      english_numbers: 'İngilizce Sayılar',
      math_romen_place_3: '3 Basamaklı Sayılar ve Romen Rakamları',
      math_mult_div_3: 'Çarpım Tablosu Şampiyonası ve Bölme',
      math_fractions_shapes_3: 'Kesirler ve Geometrik Cisimler',
      turkish_homonyms_figurative_3: 'Eş Sesli Kelimeler ve Mecaz Anlam',
      turkish_punctuation_5n1k_3: 'Noktalama, Yazım Kuralları ve 5N1K',
      science_planet_layers_3: 'Dünya\'nın Katmanları & Gezegen Keşfi',
      science_senses_3: 'Beş Duyu Dedektifi',
      science_force_motion_3: 'İtme mi Çekme mi? & Hareket Türleri Düellosu',
      science_matter_states_3: 'Katı-Sıvı-Gaz Avcısı & Madde Özellikleri',
      science_light_sound_3: 'Doğal mı Yapay mı? (Işık ve Ses Düellosu)',
      science_living_environment_3: 'Canlı-Cansız Sınıflandır & Doğal/Yapay Çevre',
      science_electricity_safety_3: 'Elektrik Kaynakları & Güvenli Kullanım',
      science_3_karma: '3. Sınıf Fen Bilimleri Karma Düello',
      science_earth_senses_3: 'Gezegenimiz Dünya ve Beş Duyumuz',
      science_force_matter_3: 'Kuvveti Tanıyalım ve Madde',
      lifescience_school_professions_3: 'Kroki Okuma & Meslekler Düellosu',
      lifescience_home_budget_3: 'Planlı Yaşam & Bütçe/Tasarruf Ustası',
      lifescience_health_consumer_3: 'Bilinçli Tüketici (SKT/TSE) & Sağlıklı Beslenme',
      lifescience_safety_traffic_3: 'Trafik Levhaları & Acil Durum Rehberi',
      lifescience_country_leaders_3: 'Vali mi Kaymakam mı? & Değerlerimiz/Öncülerimiz',
      lifescience_nature_directions_3: 'Doğada Yön Bulma (Pusula/Yosun) & Çevre Koruyucusu',
      lifescience_3_karma: '3. Sınıf Hayat Bilgisi Karma Düello',
      lifescience_compass_consumer_3: 'Yönlerimiz, Kroki ve Tüketici Hakları',
      english_family_feelings_3: 'Family Members, Feelings & Abilities',
      math_digits_operations_4: '4, 5, 6 Basamaklı Sayılar ve Dört İşlem',
      math_fractions_angles_4: 'Kesirler, Zaman ve Açılar',
      math_perimeter_area_4: 'Çevre ve Alan Hesaplama',
      turkish_idioms_proverbs_4: 'Deyimler ve Atasözleri Düellosu',
      turkish_sentences_logic_4: 'Sebep-Sonuç, Amaç-Sonuç ve Yargılar',
      science_crust_nutrition_4: 'Yer Kabuğu, Hareketler ve Besinlerimiz',
      science_circuits_magnets_4: 'Kuvvet, Mıknatıslar ve Basit Devreler',
      social_identity_heroes_4: 'Birey, Toplum ve Milli Mücadele',
      social_places_economy_4: 'İnsanlar, Yerler ve Üretimden Tüketime',
      english_countries_routines_4: 'Countries, Routines & Jobs',
      oddone: 'Farklı Olanı Yakala',
      stroop: 'Renk Tuzakları (Stroop)',
      memory: 'Süper Hafıza',
      reflex: 'Şimşek Refleks'
    };
    if (state.currentGameType === 'custom_quiz' && state.activeCustomQuiz) {
      return state.activeCustomQuiz.title;
    }
    return fallbackTitles[state.currentGameType] || 'Eğitici Oyun';
  }

  /* ==========================================================================
     7.5. SEVİMLİ MASKOT MOLİ MOTORU & KONUŞMA BALONU REAKSİYONLARI
     ========================================================================== */
  const MOLI_QUOTES = [
    'Ben Moli! Eğlenmeye hazır mısın? 🤖',
    'Soruları dikkatle oku, hızlı dokun! ⚡',
    'Her gün biraz pratik seni şampiyon yapar! 🌟',
    'Matematik ve Türkçe seninle çok eğlenceli! 📚',
    'Hata yapmaktan korkma, tekrar dene! 💪',
    'Yıldız antenim senin için parlıyor! ✨',
    'Dersi eğlenceli bir oyuna dönüştür! 🎮'
  ];

  let moliResetTimer = null;

  function changeMoliExpression(stateKey, customText = '') {
    if (!DOM.moliWidget || !DOM.moliBubbleText) return;

    if (moliResetTimer) {
      clearTimeout(moliResetTimer);
      moliResetTimer = null;
    }

    let text = '';
    let bubbleClass = '';
    let animClass = '';
    let autoResetDelay = 0;

    switch (stateKey) {
      case 'lobby':
      case 'welcome':
        text = customText || 'Hadi eğlenceye başlayalım! 🚀';
        bubbleClass = 'state-lobby';
        animClass = 'anim-wave';
        break;

      case 'start':
        text = customText || (state.gameMode === 'solo' ? 'Pratik başladı! Başarılar! 🎯' : 'Düello başladı! Başarılar! ⚡');
        bubbleClass = 'state-start';
        animClass = 'anim-bounce';
        autoResetDelay = 3500;
        break;

      case 'correct': {
        const isEnglishGame = (
          state.currentGameType === 'english' ||
          (typeof state.currentGameType === 'string' && state.currentGameType.startsWith('english_')) ||
          (state.currentQuestion && (state.currentQuestion.lang === 'en' || !!state.currentQuestion.englishWord))
        );
        text = customText || (isEnglishGame ? 'Awesome! / Harikasın ⭐' : 'Harikasın, süpersin! ⭐');
        bubbleClass = 'state-correct';
        animClass = 'anim-bounce';
        autoResetDelay = 3200;
        break;
      }

      case 'wrong':
      case 'lockout': {
        const isEnWrong = (
          state.currentGameType === 'english' ||
          (typeof state.currentGameType === 'string' && state.currentGameType.startsWith('english_')) ||
          (state.currentQuestion && (state.currentQuestion.lang === 'en' || !!state.currentQuestion.englishWord))
        );
        text = customText || (isEnWrong ? 'Try again! Dikkat et! ⏳' : 'Dikkat et, biraz yavaş ol! ⏳');
        bubbleClass = 'state-wrong';
        animClass = 'anim-wobble';
        autoResetDelay = 3000;
        break;
      }

      case 'victory':
        text = customText || (state.gameMode === 'solo' ? 'Tebrikler, görevi tamamladın! 🎯' : 'Tebrikler, harika bir maç oldu! 🏆');
        bubbleClass = 'state-victory';
        animClass = 'anim-bounce';
        break;

      case 'custom':
        text = customText || 'Hadi eğlenceye başlayalım! 🚀';
        bubbleClass = 'state-lobby';
        animClass = 'anim-bounce';
        autoResetDelay = 4000;
        break;

      default:
        text = customText || 'Hadi eğlenceye başlayalım! 🚀';
        bubbleClass = 'state-lobby';
        animClass = 'anim-wave';
    }

    DOM.moliBubbleText.textContent = text;

    if (DOM.moliSpeechBubble) {
      DOM.moliSpeechBubble.className = `moli-speech-bubble ${bubbleClass} bubble-pop`;
      setTimeout(() => {
        if (DOM.moliSpeechBubble) {
          DOM.moliSpeechBubble.classList.remove('bubble-pop');
        }
      }, 400);
    }

    if (DOM.moliImg) {
      DOM.moliImg.classList.remove('anim-bounce', 'anim-wobble', 'anim-wave');
      void DOM.moliImg.offsetWidth;
      if (animClass) {
        DOM.moliImg.classList.add(animClass);
      }
    }

    if (autoResetDelay > 0 && state.currentView === 'duel') {
      moliResetTimer = setTimeout(() => {
        if (state.currentView === 'duel' && !state.isQuestionAnswered) {
          DOM.moliBubbleText.textContent = 'Soruyu çöz, puanı kap! ⚡';
          if (DOM.moliSpeechBubble) {
            DOM.moliSpeechBubble.className = 'moli-speech-bubble state-lobby';
          }
        }
      }, autoResetDelay);
    }
  }

  function handleMoliClick() {
    if (state.currentView === 'duel') {
      exitDuel();
      return;
    }
    if (DOM.moliImg) {
      DOM.moliImg.classList.remove('anim-bounce', 'anim-wobble', 'anim-wave');
      void DOM.moliImg.offsetWidth;
      DOM.moliImg.classList.add('anim-bounce');
    }
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    lockInteractions(350);
    audio.playClick();
    modalEl.classList.add('hide');
  }

  function updateSettingsModalUI() {
    const btnSettingsModeToggle = document.getElementById('btnSettingsModeToggle');
    if (btnSettingsModeToggle) {
      const isSolo = (state.gameMode === 'solo');
      btnSettingsModeToggle.textContent = isSolo ? 'Mod: Pratik' : 'Mod: Düello';
      btnSettingsModeToggle.classList.toggle('is-off', isSolo);
    }
    const btnSettingsSoundToggle = document.getElementById('btnSettingsSoundToggle');
    if (btnSettingsSoundToggle) {
      btnSettingsSoundToggle.textContent = state.soundEnabled ? 'Ses: Açık' : 'Ses: Kapalı';
      btnSettingsSoundToggle.classList.toggle('is-off', !state.soundEnabled);
    }
    const btnSettingsAnnouncerToggle = document.getElementById('btnSettingsAnnouncerToggle');
    if (btnSettingsAnnouncerToggle) {
      btnSettingsAnnouncerToggle.textContent = state.announcerEnabled ? 'Anons: Açık' : 'Anons: Kapalı';
      btnSettingsAnnouncerToggle.classList.toggle('is-off', !state.announcerEnabled);
    }
    const btnSettingsAutoReadToggle = document.getElementById('btnSettingsAutoReadToggle');
    if (btnSettingsAutoReadToggle) {
      btnSettingsAutoReadToggle.textContent = state.autoReadQuestion ? 'Okuma: Açık' : 'Okuma: Kapalı';
      btnSettingsAutoReadToggle.classList.toggle('is-off', !state.autoReadQuestion);
    }
    const btnSettingsExplanationToggle = document.getElementById('btnSettingsExplanationToggle');
    if (btnSettingsExplanationToggle) {
      btnSettingsExplanationToggle.textContent = state.showAutoExplanation ? 'Açıklama: Açık' : 'Açıklama: Kapalı';
      btnSettingsExplanationToggle.classList.toggle('is-off', !state.showAutoExplanation);
    }
  }

  function openSettingsModal() {
    const modalSettings = document.getElementById('modalSettings');
    if (!modalSettings) return;
    updateSettingsModalUI();
    openModal(modalSettings);
  }
  window.openSettingsModal = openSettingsModal;

  // Tüm modal kapatma butonları (Hem dokunma hem tıklama gecikmesiz çalışır)
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    addTapListener(btn, (e) => {
      const targetId = btn.getAttribute('data-close-modal');
      const target = document.getElementById(targetId);
      if (target) closeModal(target);
    });
  });

  // Modal dışına tıklayınca kapatma
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    addTapListener(backdrop, (e) => {
      if (e.target === backdrop) {
        closeModal(backdrop);
      }
    });
  });

  // ESC tuşuna basıldığında açık modalları kapat
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      document.querySelectorAll('.modal-backdrop:not(.hide)').forEach(m => closeModal(m));
    }
  });

  // Erken ayarlar delegasyonu (Sayfa açılırken bile tıklandığında anında tepki verir)
  document.addEventListener('click', (e) => {
    const settingsBtn = e.target.closest('#btnDesktopSettings, #btnSidebarSettings');
    if (settingsBtn) {
      if (e.cancelable) e.preventDefault();
      openSettingsModal();
    }
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
      if (DOM.iconFsEnter) DOM.iconFsEnter.classList.add('hide');
      if (DOM.iconFsExit) DOM.iconFsExit.classList.remove('hide');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
      if (DOM.iconFsEnter) DOM.iconFsEnter.classList.remove('hide');
      if (DOM.iconFsExit) DOM.iconFsExit.classList.add('hide');
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
    if (DOM.iconSoundOn && DOM.iconSoundOff) {
      if (state.soundEnabled) {
        DOM.iconSoundOn.classList.remove('hide');
        DOM.iconSoundOff.classList.add('hide');
      } else {
        DOM.iconSoundOn.classList.add('hide');
        DOM.iconSoundOff.classList.remove('hide');
      }
    }
  }

  function updateAnnouncerUI() {
    if (DOM.chkAnnouncerVoice) {
      DOM.chkAnnouncerVoice.checked = state.announcerEnabled;
    }
    if (DOM.btnToggleAnnouncerDuel) {
      DOM.btnToggleAnnouncerDuel.classList.toggle('announcer-muted', !state.announcerEnabled);
      if (DOM.announcerHudIcon) DOM.announcerHudIcon.textContent = state.announcerEnabled ? '🎙️' : '🔇';
      if (DOM.announcerHudText) DOM.announcerHudText.textContent = state.announcerEnabled ? 'Sunucu: Açık' : 'Sunucu: Kapalı';
    }
  }

  function toggleAnnouncerVoice() {
    state.announcerEnabled = !state.announcerEnabled;
    StorageManager.saveSettings();
    updateAnnouncerUI();
    audio.playClick();
    if (state.announcerEnabled) {
      showToast('🎙️ Sunucu seslendirmesi açıldı');
    } else {
      showToast('🔇 Sunucu seslendirmesi kapatıldı');
    }
  }

  function updateAutoReadUI() {
    if (DOM.chkAutoReadQuestion) {
      DOM.chkAutoReadQuestion.checked = state.autoReadQuestion;
    }
  }

  function toggleAutoReadQuestion() {
    state.autoReadQuestion = !state.autoReadQuestion;
    StorageManager.saveSettings();
    updateAutoReadUI();
    audio.playClick();
    if (state.autoReadQuestion) {
      showToast('🔊 Soru sesli okuma açıldı');
    } else {
      showToast('🔇 Soru sesli okuma kapatıldı');
    }
  }

  /* ==========================================================================
     9. SINIF -> DERS -> KONU HİYERARŞİK MÜFREDAT YAPISI (DİNAMİK LOBİ SİSTEMİ)
     ========================================================================== */

  const GRADE_SUBJECTS_CONFIG = {
    // -------------------------------------------------------------
    // ANASINIFI (0): 2026 MAARİF MODELİ OKUL ÖNCESİ OYUN HAVUZU
    // (Bilişsel, Duyuşsal ve Motor Beceriler - 100% Görsel, İşitsel ve Şıksız)
    // -------------------------------------------------------------
    0: [
      {
        id: 'kinder_shapes_size',
        name: 'Renkler, Şekiller & Boyutlar',
        icon: '🎨',
        colorTheme: 'theme-math',
        tagline: 'Montessori & Görsel Keşif',
        description: 'Canlı renkler, geometrik şekiller ve Montessori büyük-küçük karşılaştırmaları! 🎈⭐',
        badge: 'Okul Öncesi',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'colors', label: '🎈 Renk Balonları' },
          { id: 'sizes', label: '🐘 Büyük & Küçük' },
          { id: 'shapes', label: '⭐ Şekiller' }
        ],
        games: [
          {
            id: 'color_balloon',
            active: true,
            title: 'Renk Balonlarını Patlat',
            icon: '🎈',
            badge: '🎈 Balon Patlatma',
            featureTag: '⭐ Şıksız & Canlı',
            description: 'Söylenen renkteki uçan balonu yakala ve güm diye patlat! 🎈💥',
            tags: ['🎈 Uçan Balonlar', '🎨 Canlı Renkler', '💥 Hızlı Patlat'],
            btnText: 'Düelloyu Başlat',
            topic: 'colors'
          },
          {
            id: 'kinder_size',
            active: true,
            title: 'Büyük mü, Küçük mü?',
            icon: '🐘',
            badge: '🐘 Boyut & Karşılaştırma',
            featureTag: '🌱 Montessori Algısı',
            description: 'Koca fil mi minik fare mi? Büyük, küçük, uzun ve ağır nesneleri keşfet! 🐘🐭',
            tags: ['🐘 Büyük-Küçük', '🦒 Uzun-Kısa', '🪨 Ağır-Hafif'],
            btnText: 'Düelloyu Başlat',
            topic: 'sizes'
          },
          {
            id: 'kinder_shapes',
            active: true,
            title: 'Şekilleri Keşfet',
            icon: '⭐',
            badge: '⭐ Geometrik Şekiller',
            featureTag: '🔺 Daire, Kare, Üçgen',
            description: 'Daire, kare, üçgen ve parlayan yıldızları sesli yönergelerle bul! ⭐🔺',
            tags: ['🔴 Daire', '🟦 Kare', '🔺 Üçgen'],
            btnText: 'Düelloyu Başlat',
            topic: 'shapes'
          }
        ]
      },
      {
        id: 'kinder_math',
        name: 'Minik Sayılar & Sayma',
        icon: '🔢',
        colorTheme: 'theme-science',
        tagline: '1-5 Miktar & Sayma',
        description: 'Meyveleri dokunarak say, zıplayan nesneleri yakala ve sayı balonlarını patlat! 🍎🔢',
        badge: 'Erken Matematik',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'count_tap', label: '🍎 Dokun & Say' },
          { id: 'counting', label: '🔢 Miktar Bul' },
          { id: 'number_balloon', label: '🎈 Sayı Balonları' }
        ],
        games: [
          {
            id: 'count_tap',
            active: true,
            title: 'Kaç Tane Var? Dokun & Say',
            icon: '🍎',
            badge: '🍎 Dokunmatik Sayma',
            featureTag: '🐾 Sevimli Sayma',
            description: 'Ekranda zıplayan nesnelere dokunarak say, doğru sayıyı bul! 🍎',
            tags: ['🍎 Dokunarak Say', '🔢 1-5 Sayılar', '✨ Sesli Yönerge'],
            btnText: 'Düelloyu Başlat',
            topic: 'count_tap'
          },
          {
            id: 'kinder_counting',
            active: true,
            title: 'Meyve & Yıldız Sayma',
            icon: '🔢',
            badge: '🔢 Miktar Eşleştirme',
            featureTag: '🖐️ 1-5 Miktar',
            description: 'Sepetteki çilekleri, parıldayan yıldızları ve kedileri sayıp doğru karta dokun! 🍓⭐',
            tags: ['🍓 Meyve Say', '⭐ Yıldız Say', '🖐️ Sayı Algısı'],
            btnText: 'Düelloyu Başlat',
            topic: 'counting'
          },
          {
            id: 'kinder_number_balloon',
            active: true,
            title: 'Sayı Balonlarını Yakala',
            icon: '🎈',
            badge: '🎈 Uçan Sayılar',
            featureTag: '1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣',
            description: 'Gökyüzünde süzülen 1-5 arası sayı balonlarını sesli dinle ve anında patlat! 🎈💥',
            tags: ['🎈 Uçan Balon', '🔢 1-5 Sayılar', '⚡ Refleks'],
            btnText: 'Düelloyu Başlat',
            topic: 'number_balloon'
          }
        ]
      },
      {
        id: 'kinder_nature',
        name: 'Sevimli Hayvanlar & Doğa',
        icon: '🦁',
        colorTheme: 'theme-turkish',
        tagline: 'Canlılar & Çevre Sevgisi',
        description: 'Sevimli hayvan sesleri, gizemli gölge eşleştirme ve lezzetli meyveler! 🐾🦁',
        badge: 'Doğa Dostları',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'sounds', label: '🐾 Hayvan Sesleri' },
          { id: 'shadows', label: '🧩 Gölgesini Bul' },
          { id: 'fruits', label: '🍓 Meyve Sepeti' }
        ],
        games: [
          {
            id: 'kinder_animal_sounds',
            active: true,
            title: 'Kim Miyavlar? Hayvan Sesleri',
            icon: '🐾',
            badge: '🐾 Sevimli Dostlar',
            featureTag: '🔊 İşitsel Tanıma',
            description: 'Miyavlayan, havlayan veya vak vak diyen dostlarımızı sesinden tanı! 🐱🐶',
            tags: ['🐱 Miyav', '🐶 Hav Hav', '🦆 Vak Vak'],
            btnText: 'Düelloyu Başlat',
            topic: 'sounds'
          },
          {
            id: 'shadow_match',
            active: true,
            title: 'Gölgesini Bul (Görsel Eşleştirme)',
            icon: '🧩',
            badge: '🧩 Gölge Kartları',
            featureTag: '👀 Keskin Gözler',
            description: 'Sevimli hayvan ve taşıtların gizemli gölgesini bul, dokunup rengini aç! 🦁🚗',
            tags: ['🧩 Gölge Eşleştir', '🦁 Sevimli Hayvanlar', '⚡ Hızlı Bul'],
            btnText: 'Düelloyu Başlat',
            topic: 'shadows'
          },
          {
            id: 'kinder_fruits',
            active: true,
            title: 'Meyve Sepeti & Sağlıklı Yaşam',
            icon: '🍓',
            badge: '🍓 Sağlıklı Beslenme',
            featureTag: '🍎 Vitamin Deposu',
            description: 'Çıtır elmalar, tatlı çilekler ve taze süt gibi sağlıklı yiyecekleri tanı! 🍎🥛',
            tags: ['🍓 Çilek & Elma', '🥛 Süt & Yoğurt', '🥕 Taze Havuç'],
            btnText: 'Düelloyu Başlat',
            topic: 'fruits'
          }
        ]
      },
      {
        id: 'kinder_brain',
        name: 'Duygularım & Görsel Dikkat',
        icon: '💖',
        colorTheme: 'theme-brain',
        tagline: 'Duyuşsal Maarif & Dikkat',
        description: 'Yüz ifadeleri, duygularımızı tanıma, farklı olanı yakalama ve hafıza kartları! 😊👀',
        badge: 'Duygusal Zeka',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'emotions', label: '💖 Duygularım' },
          { id: 'attention', label: '👀 Farklı Olanı Bul' },
          { id: 'memory', label: '🧠 Sevimli Hafıza' }
        ],
        games: [
          {
            id: 'kinder_emotions',
            active: true,
            title: 'Duygularım & Yüz İfadeleri',
            icon: '😊',
            badge: '💖 Maarif Duyuşsal',
            featureTag: '😊 😢 😲 😠 🥰',
            description: 'Mutlu, üzgün, şaşkın ve sevgi dolu yüz ifadelerini sesli hikayelerle tanı! 😊💖',
            tags: ['😊 Mutlu', '😢 Üzgün', '😲 Şaşkın', '🥰 Sevgi'],
            btnText: 'Düelloyu Başlat',
            topic: 'emotions'
          },
          {
            id: 'kinder_oddone',
            active: true,
            title: 'Farklı Olanı Yakala',
            icon: '👀',
            badge: '👀 Görsel Dikkat',
            featureTag: '🥑 Keskin Gözler',
            description: 'Meyve, hayvan ve şekiller arasına gizlenen yabancı nesneyi ilk sen bul! 🥑',
            tags: ['👀 Görsel Dikkat', '🥑 Yabancıyı Bul', '⚡ Hızlı Dokun'],
            btnText: 'Düelloyu Başlat',
            topic: 'attention'
          },
          {
            id: 'memory',
            active: true,
            title: 'Sevimli Hafıza Düellosu',
            icon: '🧠',
            badge: '🧠 2x3 Hafıza',
            featureTag: '🐱🐶 Eşleştirme',
            description: 'Sevimli kedi, köpek ve meyve kartlarını hafızanda tut, eşini bul! 🐱🍎',
            tags: ['🐱 Sevimli Hayvanlar', '🧠 Görsel Hafıza', '⭐ Çiftini Bul'],
            btnText: 'Düelloyu Başlat',
            topic: 'memory'
          }
        ]
      }
    ],

    // -------------------------------------------------------------
    // 1. SINIF: İlk Okuma Yazma, Matematik, Türkçe, Hayat Bilgisi, Akıl ve Zeka Oyunları
    // -------------------------------------------------------------
    1: [
      {
        id: 'firstreading',
        name: 'İlk Okuma Yazma',
        icon: '🔤',
        colorTheme: 'theme-firstreading',
        tagline: 'Harfler & Sesler',
        description: 'Harfleri tanı, heceleri birleştir ve okuma şampiyonu ol! 📖✨',
        badge: '1. Sınıf Temeli',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'letters', label: '🎈 Ses & Harf Balonları' },
          { id: 'syllables', label: '🔤 Hece Birleştirme' },
          { id: 'sentences', label: '⭐ Hızlı Kelime Yakala' }
        ],
        games: [
          {
            id: 'firstreading_balloon',
            active: true,
            title: 'Ses ve Harf Avcısı (Balon Patlatma)',
            icon: '🎈',
            badge: '🎈 Balon Patlatma',
            featureTag: '⚡ MEB Ses Grupları',
            description: 'Söylenen harfi veya içinde o ses geçen görseli uçan balonların içinden patlat! 🎈💥',
            tags: ['🔤 Maarif Modeli ANETİL', '🎈 Uçan Balonlar', '💥 Hızlı Patlat'],
            btnText: 'Düelloyu Başlat',
            topic: 'letters'
          },
          {
            id: 'syllable_builder',
            active: true,
            title: 'Hece Birleştirme Atölyesi',
            icon: '🔤',
            badge: '🧩 Dokun & Birleştir',
            featureTag: '🧱 Renkli Küpler',
            description: 'Renkli küplere sırayla dokunarak ("E + L = EL", "A + N + A = ANA") anlamlı kelimeleri oluştur! 🧱',
            tags: ['📖 Açık & Kapalı Hece', '🧱 Küp Birleştir', '🔊 Sesli Okuma'],
            btnText: 'Düelloyu Başlat',
            topic: 'syllables'
          },
          {
            id: 'word_catch',
            active: true,
            title: 'Hızlı Kelime Yakala',
            icon: '⭐',
            badge: '⭐ Parlayan Yıldızlar',
            featureTag: '🎯 Görsel Algı',
            description: 'Ekranda beliren görselin (🍎 Elma, 🐴 At, 🥛 Süt) baş harfini parlayan yıldızlardan yakala! ⭐',
            tags: ['🍎 Görsel Tanıma', '⭐ Yıldız Avı', '⚡ Hızlı Tepki'],
            btnText: 'Düelloyu Başlat',
            topic: 'sentences'
          },
          {
            id: 'firstreading',
            active: true,
            title: 'İlk Okuma & Ses Avcısı (Karma Düello)',
            icon: '🔤',
            badge: '🌱 Karma Pratik',
            featureTag: '🏆 Süper Düello',
            description: 'Balon patlatma, hece birleştirme ve kelime avından oluşan süper karma düello! 🎯',
            tags: ['🔤 Harf Sesleri', '📖 Hece Kurma', '🌟 Sözcük Oluşturma'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'math',
        name: 'Matematik',
        icon: '🧮',
        colorTheme: 'theme-math',
        tagline: '2026 Maarif Modeli',
        description: '20\'ye kadar işlemler, onluk-birlik, geometrik şekiller, saatler ve grafikler! ➕➖🪙',
        badge: 'Maarif Modeli 2026',
        topics: [
          { id: 'all', label: '🌟 Tüm Konular / Karma Düello' },
          { id: 'spatial_geo', label: '📐 Geometri & Uzamsal' },
          { id: 'numbers_quantities', label: '🔢 Sayılar & Nicelikler (1-20)' },
          { id: 'operations_patterns', label: '➕ Toplama, Çıkarma & Örüntü' },
          { id: 'measure_money_time', label: '⏰ Ölçme, Saat & Paralarımız' },
          { id: 'data_tables', label: '📊 Grafik Dedektifi' }
        ],
        games: [
          {
            id: 'math_spatial_geo_1',
            active: true,
            title: 'Şekilleri Yakala & Neredeyim?',
            icon: '📐',
            badge: '📐 Geometri & Uzamsal',
            featureTag: '🟦 Şekil & Konum',
            description: 'Üçgen, kare, dikdörtgen, çember ve uzamsal konumları (üstünde, altında, sağında, solunda) keşfet! 🔺🟦',
            tags: ['🔺 Üçgen, Kare, Çember', '📍 İçinde & Dışında', '↔️ Sağında & Solunda', '🎯 Kenar & Köşe'],
            btnText: 'Düelloyu Başlat',
            topic: 'spatial_geo'
          },
          {
            id: 'math_numbers_quantities_1',
            active: true,
            title: 'Onluk-Birlik Atölyesi & Ritmik Sayma Treni',
            icon: '🔢',
            badge: '🔢 Sayılar (1-20)',
            featureTag: '📦 Onluk & Birlik',
            description: '1-20 arası nesne sayma, onluk-birlik blokları, az-çok karşılaştırma, sıra sayıları ve ritmik sayma! 🚂🔢',
            tags: ['📦 Onluk & Birlik', '🔢 1-20 Sayılar', '🚂 Ritmik Sayma', '🥇 Sıra Sayıları'],
            btnText: 'Düelloyu Başlat',
            topic: 'numbers_quantities'
          },
          {
            id: 'math_operations_patterns_1',
            active: true,
            title: 'Matematik Düellosu & Örüntü Ustası',
            icon: '➕',
            badge: '➕➖ İşlemler & Örüntü',
            featureTag: '⚡ Toplam ≤ 20',
            description: 'Toplamı 20\'ye kadar olan doğal sayılarla toplama, 20\'den çıkarma ve şekil-sayı örüntüleri! ➕➖🧩',
            tags: ['➕ Doğal Toplama (≤20)', '➖ Eksiltme & Fark', '🔟 10\'a Tamamlama', '🧩 Örüntü Kuralı'],
            btnText: 'Düelloyu Başlat',
            topic: 'operations_patterns'
          },
          {
            id: 'math_measure_money_time_1',
            active: true,
            title: 'Saat Kaç & Kumbaram',
            icon: '⏰',
            badge: '⏰ Ölçme & Para',
            featureTag: '🪙 TL & Saatler',
            description: 'Tam ve yarım saatler, dün-bugün-yarın takvim, paralarımız (TL ve Kuruş) ve standart olmayan ölçüler! ⏰🪙',
            tags: ['⏰ Tam & Yarım Saat', '🪙 TL & Kuruşlar', '📅 Günler & Aylar', '📏 Karış & Adım'],
            btnText: 'Düelloyu Başlat',
            topic: 'measure_money_time'
          },
          {
            id: 'math_data_tables_1',
            active: true,
            title: 'Grafik Dedektifi',
            icon: '📊',
            badge: '📊 Tablo Okuma',
            featureTag: '🔍 Görsel Dedektif',
            description: 'Basit nesne ve şekil grafiklerini oku, en çok ve en az olanı bulup soruları çöz! 📊🔍',
            tags: ['📊 Nesne Grafiği', '🍎 Meyve Tablosu', '🔍 En Çok & En Az', '⚡ Farkı Bul'],
            btnText: 'Düelloyu Başlat',
            topic: 'data_tables'
          },
          {
            id: 'math_1_karma',
            active: true,
            title: 'Matematik Süper Karma Düello (Tüm Müfredat)',
            icon: '🧮',
            badge: '🌟 Süper Karma',
            featureTag: '🏆 MEB Şampiyonası',
            description: 'Tüm 1. sınıf matematik kazanımlarını harmanlayan genel tekrar ve akıllı tahta sınıf düellosu! 🧮⚡',
            tags: ['🔢 Sayılar (1-20)', '➕ Toplama & Çıkarma', '⏰ Saat & Para', '🏆 Süper Düello'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'turkish',
        name: 'Türkçe',
        icon: '📚',
        colorTheme: 'theme-turkish',
        tagline: '2026 Maarif Modeli',
        description: 'Dinleme ve görsel anlama, zıt kavramlar, kurallı cümleler ve temel noktalama işaretleri! 🦉📖',
        badge: 'Maarif Modeli 2026',
        topics: [
          { id: 'all', label: '🌟 Tüm Konular / Karma Düello' },
          { id: 'listen_comprehend', label: '🎧 Dinleme & Görsel Okuma' },
          { id: 'antonyms', label: '🔄 Zıt Kavramlar' },
          { id: 'sentence_punctuation', label: '✍️ Cümle & Noktalama' }
        ],
        games: [
          {
            id: 'turkish_listen_comprehend_1',
            active: true,
            title: 'Dinle, Anla ve Resmi Bul!',
            icon: '🎧',
            badge: '🎧 Dinleme & Anlama',
            featureTag: '🔊 TTS Destekli',
            description: 'Sesli okunan cümleyi dinle, anlatan doğru görseli bul veya olayları oluş sırasına (Önce-Sonra) koy! 🎧🖼️',
            tags: ['🎧 Sesli Dinleme', '🖼️ Görsel Eşleştirme', '⏳ Önce - Sonra', '🦉 Anlama Becerisi'],
            btnText: 'Düelloyu Başlat',
            topic: 'listen_comprehend'
          },
          {
            id: 'turkish_antonyms_1',
            active: true,
            title: 'Zıt Kavramlar Düellosu',
            icon: '🔄',
            badge: '🔄 Zıt Anlam',
            featureTag: '⭐ 35+ Kelime',
            description: 'Büyük-küçük, uzun-kısa, sıcak-soğuk, açık-kapalı gibi 1. sınıf temel zıt kavramlarını şimşek gibi yakala! 🔄⚡',
            tags: ['🔄 Karşıt Kavramlar', '⚡ Hızlı Eşleştirme', '🐘 Büyük - Küçük', '🥛 Dolu - Boş'],
            btnText: 'Düelloyu Başlat',
            topic: 'antonyms'
          },
          {
            id: 'turkish_sentence_punctuation_1',
            active: true,
            title: 'Cümle Kurucu & Noktalama Avcısı',
            icon: '✍️',
            badge: '✍️ Cümle & Noktalama',
            featureTag: '✍️ Nokta & Soru',
            description: 'Karışık kelimelerden anlamlı cümle kur, cümle sonuna Nokta (.) mı yoksa Soru İşareti (?) mi geleceğini bul! ✍️🎯',
            tags: ['✍️ Anlamlı Cümle', '🎯 Nokta (.) & Soru (?)', '🔠 Büyük Harf Kuralı', '✨ Kelime Sıralama'],
            btnText: 'Düelloyu Başlat',
            topic: 'sentence_punctuation'
          },
          {
            id: 'turkish_1_karma',
            active: true,
            title: 'Türkçe Süper Karma Düello (Tüm Konular)',
            icon: '🦉',
            badge: '🌟 Süper Karma',
            featureTag: '🏆 Büyük Yarışma',
            description: 'Görsel okuma, temel sözcük anlamı, zıt kavramlar ve cümle kurma konularından oluşan karma düello! 🦉📚',
            tags: ['🎧 Görsel Okuma', '🔄 Zıt Kavramlar', '✍️ Cümle & Noktalama', '🏆 Büyük Düello'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'lifescience',
        name: 'Hayat Bilgisi',
        icon: '🌱',
        colorTheme: 'theme-lifescience',
        tagline: '2026 Maarif Modeli',
        description: 'Ben ve okulum, sağlığım, ailem, ülkem, doğa ve çevre 2026 Maarif öğrenme alanları! 🏫🧼🇹🇷',
        badge: 'Maarif Modeli 2026',
        topics: [
          { id: 'all', label: '🌟 Hayat Bilgisi Karma Düello' },
          { id: 'school', label: '🏫 Tema 1: Ben ve Okulum' },
          { id: 'health_traffic', label: '🧼 Tema 2: Sağlığım ve Güvenliğim' },
          { id: 'family_home', label: '🏡 Tema 3: Ailem ve Toplum' },
          { id: 'country_flag', label: '🇹🇷 Tema 4: Yaşadığım Yer ve Ülkem' },
          { id: 'nature_recycling', label: '🌿 Tema 5: Doğa ve Çevre' }
        ],
        games: [
          {
            id: 'lifescience_school_1',
            active: true,
            title: 'Doğru Davranışı Seç & Okul Rehberi',
            icon: '🏫',
            badge: '🏫 Ben ve Okulum',
            featureTag: '🤝 Okul & Nezaket',
            description: 'Okul ortamı, sınıf kuralları, okul çalışanları, duygularımız ve nezaket ifadeleri (lütfen, teşekkürler, özür dilerim)! 🏫🤝',
            tags: ['🏫 Sınıf Kuralları', '🤝 Nezaket Sözleri', '😊 Duygularımız', '👨‍🏫 Okul Çalışanları'],
            btnText: 'Düelloyu Başlat',
            topic: 'school'
          },
          {
            id: 'lifescience_health_traffic_1',
            active: true,
            title: 'Sağlık Sepeti & Güvenli Yol',
            icon: '🧼',
            badge: '🧼 Sağlık & Güvenlik',
            featureTag: '🚦 Trafik & Sağlık',
            description: 'Kişisel bakım, sağlıklı beslenme, temel trafik kuralları (yaya geçidi, trafik ışıkları), acil durum (112) ve güvenli alanlar! 🧼🚦',
            tags: ['🧼 Kişisel Bakım', '🍎 Sağlıklı Beslenme', '🚦 Trafik Kuralları', '🚑 112 Acil'],
            btnText: 'Düelloyu Başlat',
            topic: 'health_traffic'
          },
          {
            id: 'lifescience_family_home_1',
            active: true,
            title: 'Mutlu Evim & Sorumluluklarım',
            icon: '🏡',
            badge: '🏡 Ailem ve Toplum',
            featureTag: '🤝 Ev & Sorumluluk',
            description: 'Aile bireyleri, akrabalık, evdeki görev ve sorumluluklar, ev adresimiz, komşuluk ve yardımlaşma! 🏡❤️',
            tags: ['👨‍👩‍👧 Aile Bireyleri', '🏡 Ev Sorumlulukları', '📍 Ev Adresi', '🤝 Komşuluk & Yardım'],
            btnText: 'Düelloyu Başlat',
            topic: 'family_home'
          },
          {
            id: 'lifescience_country_flag_1',
            active: true,
            title: 'Milli Değerlerimiz & Bayramlarımız',
            icon: '🇹🇷',
            badge: '🇹🇷 Yaşadığım Yer & Ülkem',
            featureTag: '🇹🇷 Bayrak & Atatürk',
            description: 'Şanlı bayrağımız, İstiklal Marşımız, Atatürk\'ün hayatı ve milli-dini bayramlarımız (29 Ekim, 23 Nisan vb.)! 🇹🇷🕊️',
            tags: ['🇹🇷 Türk Bayrağı', '🎶 İstiklal Marşı', '⭐ Atatürk\'ün Hayatı', '🎉 Milli Bayramlar'],
            btnText: 'Düelloyu Başlat',
            topic: 'country_flag'
          },
          {
            id: 'lifescience_nature_recycling_1',
            active: true,
            title: 'Doğa Dostu & Geri Dönüşüm Avcısı',
            icon: '🌿',
            badge: '🌿 Doğa ve Çevre',
            featureTag: '♻️ Geri Dönüşüm',
            description: '4 mevsim ve kıyafet seçimi, hayvanları-bitkileri koruma, geri dönüşüm, su ve elektrik tasarrufu! 🌍♻️',
            tags: ['🍂 4 Mevsim', '♻️ Geri Dönüşüm', '💧 Su Tasarrufu', '🐾 Canlıları Koruma'],
            btnText: 'Düelloyu Başlat',
            topic: 'nature_recycling'
          },
          {
            id: 'lifescience_1_karma',
            active: true,
            title: 'Hayat Bilgisi Karma Düello (Tüm Konular)',
            icon: '🌱',
            badge: '🌟 Süper Karma',
            featureTag: '⭐ Tüm Müfredat',
            description: '5 temanın tamamından dengeli ve rastgele sorular çeken genel tekrar ve akıllı tahta sınıf düellosu! 🏫🧼🇹🇷',
            tags: ['🏫 Okul & Nezaket', '🧼 Sağlık & Trafik', '🏡 Aile & Toplum', '🇹🇷 Milli Değerler'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'grade1_grand_duel',
        name: '🏆 1. Sınıf Büyük Karma Düello',
        icon: '🏆',
        colorTheme: 'theme-science',
        tagline: 'Tüm Dersler Şampiyonası',
        description: 'İlk Okuma, Türkçe, Matematik ve Hayat Bilgisi 2026 Maarif Modelinin tüm derslerinden karma büyük yarışma! 🏆🌟',
        badge: '🌟 Süper Şampiyona',
        topics: [
          { id: 'all', label: '🌟 Tüm Dersler Karma' }
        ],
        games: [
          {
            id: 'grade1_grand_duel',
            active: true,
            title: '1. Sınıf Büyük Karma Düello (Tüm Dersler)',
            icon: '🏆',
            badge: '🏆 Büyük Şampiyona',
            featureTag: '⭐ 4 Ders Harmanı',
            description: 'Matematik, Türkçe, Hayat Bilgisi ve Okuma-Anlama sorularıyla sınıfının şampiyonu sen ol! 🥇🎯',
            tags: ['🧮 Matematik', '📚 Türkçe', '🌱 Hayat Bilgisi', '🏆 Süper Düello'],
            btnText: 'Büyük Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'brain',
        name: 'Akıl ve Zeka Oyunları',
        icon: '🧠',
        colorTheme: 'theme-brain',
        tagline: 'Görsel Dikkat & Hız',
        description: 'Fark bulma, renk tuzakları, süper hafıza ve şimşek refleks! ⚡🎯',
        badge: 'Dikkat Gelişimi',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'oddone', label: '👀 Fark Bulma' },
          { id: 'stroop', label: '🎯 Renk Tuzağı' },
          { id: 'memory', label: '🧠 Hafıza' },
          { id: 'reflex', label: '⚡ Hızlı Refleks' }
        ],
        games: [
          {
            id: 'oddone',
            active: true,
            title: 'Farklı Olanı Yakala',
            icon: '👀',
            badge: '🌱 Gözlem & Odak',
            featureTag: '🔍 Dedektif Gözler',
            description: 'Gözünü dört aç! Benzer emojiler arasındaki tek farkı anında yakala! 🔍',
            tags: ['🔍 Benzer Emojiler', '🎯 İnce Farklar', '⚡ Hızlı Gözlem'],
            btnText: 'Düelloyu Başlat',
            topic: 'oddone'
          },
          {
            id: 'stroop',
            active: true,
            title: 'Göz ve Renk Düellosu',
            icon: '🎯',
            badge: '🌱 Renk & Dikkat',
            featureTag: '🎯 Hızlı Seçim',
            description: 'Gözlerin mi daha hızlı yoksa aklın mı? Rengine göre bas! 🎯',
            tags: ['🎯 Renk Eşleştirme', '⚡ Hızlı Seçim', '🌈 Renkler'],
            btnText: 'Düelloyu Başlat',
            topic: 'stroop'
          },
          {
            id: 'memory',
            active: true,
            title: 'Süper Hafıza: Sırayı Hatırla',
            icon: '🧠',
            badge: '🌱 Sıralı Hafıza',
            featureTag: '🧠 Zihin Belleği',
            description: 'Sırayı aklına kazı! İlk hangisi çıktı, kim kayboldu? 🧠',
            tags: ['🧠 Sıralama Belleği', '👀 Görsel Dikkat', '⚡ Hızlı Hatırla'],
            btnText: 'Düelloyu Başlat',
            topic: 'memory'
          },
          {
            id: 'reflex',
            active: true,
            title: 'Şimşek Refleks: Hedef Avı',
            icon: '⚡',
            badge: '🌱 Saf Hız',
            featureTag: '⚡ Şimşek Hız',
            description: 'Yıldıza bas (⭐), bombadan kaç (💣)! Yanlış basan kilitlenir! ⚡',
            tags: ['⭐ Yıldız Avı', '💣 Bombadan Kaç', '⚡ Şimşek Hız'],
            btnText: 'Düelloyu Başlat',
            topic: 'reflex'
          },
          {
            id: 'true_false',
            active: true,
            title: 'Doğru mu Yanlış mı? (Refleks)',
            icon: '⚡',
            badge: '✅❌ Hızlı Karar',
            featureTag: '⚡ 2x Hızlı Süre',
            description: 'Dev butonlar, 2 kat hızlı eriyen süre! Doğru mu yoksa yanlış mı? ⚡',
            tags: ['✅ Dev Butonlar', '⚡ 2x Hızlı Süre', '🔥 Anlık Refleks'],
            btnText: 'Düelloyu Başlat',
            topic: 'reflex'
          },
          {
            id: 'matching',
            active: true,
            title: 'Dokun ve Eşleştir (Zihin Çiftleri)',
            icon: '🧩',
            badge: '🧩 Ardışık Dokunma',
            featureTag: '⭐ Kart Eşleştirme',
            description: 'Sol ve sağ sütundaki doğru çiftlere ardışık dokun ve birleştir! 🧩',
            tags: ['🧩 Akıllı Dokunma', '🎯 Hızlı Eşleştir', '✨ Parıltılı Birleşme'],
            btnText: 'Düelloyu Başlat',
            topic: 'reflex'
          }
        ]
      }
    ],

    // -------------------------------------------------------------
    // 2. SINIF: Matematik, Türkçe, Hayat Bilgisi, İngilizce, Akıl ve Zeka Oyunları
    // -------------------------------------------------------------
    2: [
      {
        id: 'math',
        name: 'Matematik',
        icon: '🧮',
        colorTheme: 'theme-math',
        tagline: '2026 Maarif Modeli',
        description: '100\'e kadar sayılar, eldeli toplama, onluk bozarak çıkarma, 1-5 & 10 çarpım tablosu, kesirler, saatler ve grafikler! ➕➖✖️⏰',
        badge: 'Maarif Modeli 2026',
        topics: [
          { id: 'all', label: '🌟 Tüm Konular / Karma Düello' },
          { id: 'numbers', label: '🔢 Sayılar ve Nicelikler (100\'e Kadar)' },
          { id: 'operations', label: '➕➖ Toplama ve Çıkarma' },
          { id: 'mult_div', label: '✖️➗ Çarpma ve Bölme (1-5 & 10)' },
          { id: 'fractions_time_money', label: '🍰 Kesirler, Saat & Paralarımız' },
          { id: 'geometry', label: '📐 Geometri ve Simetri' },
          { id: 'measure_data', label: '📊 Ölçme ve Grafik Dedektifi' }
        ],
        games: [
          {
            id: 'math_place_value_2',
            active: true,
            title: 'Basamak Değeri & Onluğa Yuvarlama Ustası',
            icon: '📦',
            badge: '🔢 Sayılar (1-100)',
            featureTag: '📦 Onluk & Birlik',
            description: '100\'e kadar sayılar, basamak değeri, en yakın onluğa yuvarlama ve ritmik sayma treni!',
            tags: ['📦 Onluk & Birlik', '🎯 Basamak Değeri', '🔄 Onluğa Yuvarlama', '🚂 Ritmik Sayma'],
            btnText: 'Düelloyu Başlat',
            topic: 'numbers'
          },
          {
            id: 'math_operations_2',
            active: true,
            title: 'Hızlı İşlem & Kayıp Sayı Düellosu',
            icon: '➕',
            badge: '➕➖ Toplama & Çıkarma',
            featureTag: '⚡ Eldeli & Onluk Bozma',
            description: '100 içinde eldeli toplama, onluk bozarak çıkarma, kayıp toplananı bulma ve zihinden işlemler!',
            tags: ['➕ Eldeli Toplama', '➖ Onluk Bozma', '❓ Kayıp Sayıyı Bul', '🧠 Zihinden İşlem'],
            btnText: 'Düelloyu Başlat',
            topic: 'operations'
          },
          {
            id: 'math_multiplication_division_2',
            active: true,
            title: 'Çarpım Kahramanı (1-5 & 10\'lar) & Eşit Paylaştır',
            icon: '✖️',
            badge: '✖️➗ Çarpma & Bölme',
            featureTag: '🎯 1-5 ve 10 Katları',
            description: '1, 2, 3, 4, 5 ve 10\'lar çarpım tablosu, tekrarlı toplama ve 20 içinde eşit paylaştırma/bölme!',
            tags: ['✖️ Çarpım Tablosu (1-5, 10)', '➗ Eşit Paylaştırma (≤20)', '🍎 Çarpma Problemleri', '🐿️ Kalansız Bölme'],
            btnText: 'Düelloyu Başlat',
            topic: 'mult_div'
          },
          {
            id: 'math_fractions_time_money_2',
            active: true,
            title: 'Bütün-Yarım-Çeyrek & Saat/Kumbara Atölyesi',
            icon: '⏰',
            badge: '🍰 Kesir, Saat & Para',
            featureTag: '⏰ Tam/Yarım/Çeyrek',
            description: 'Bütün-yarım-çeyrek modelleri, tam-yarım-çeyrek saatler, takvim ve TL-Kuruş hesaplamaları!',
            tags: ['🍰 Bütün, Yarım, Çeyrek', '⏰ Saat Okuma', '🪙 TL & Kuruş', '📅 Takvim & Zaman'],
            btnText: 'Düelloyu Başlat',
            topic: 'fractions_time_money'
          },
          {
            id: 'math_geometry_solids_2',
            active: true,
            title: 'Geometrik Cisim Avcısı & Simetri Aynası',
            icon: '📐',
            badge: '📐 Geometri & Cisimler',
            featureTag: '🎲 Küp, Prizma, Silindir',
            description: 'Küp, prizma, silindir, koni, küre özellikleri, temel şekiller ve simetri doğrusu!',
            tags: ['🎲 Geometrik Cisimler', '🪞 Simetri Doğrusu', '🔺 Yüz, Köşe, Ayrıt', '🟦 Düzlemsel Şekiller'],
            btnText: 'Düelloyu Başlat',
            topic: 'geometry'
          },
          {
            id: 'math_measure_data_2',
            active: true,
            title: 'Metre-Kilogram & Grafik Dedektifi',
            icon: '📊',
            badge: '📊 Ölçme & Veri',
            featureTag: '📏 m, cm, kg & Tablo',
            description: 'Metre ve santimetre ile uzunluk ölçme, kilogram tartma, çetele-sıklık tablosu ve nesne grafiği!',
            tags: ['📏 Metre & Santimetre', '⚖️ Kilogram ile Tartma', '📊 Çetele & Sıklık', '🔍 Grafik Okuma'],
            btnText: 'Düelloyu Başlat',
            topic: 'measure_data'
          },
          {
            id: 'math_2_karma',
            active: true,
            title: '2. Sınıf Matematik Büyük Karma Düello',
            icon: '🧮',
            badge: '🏆 2. Sınıf Matematik Karma',
            featureTag: '🌟 6 Konu Genel Tekrar',
            description: 'Tüm 2. sınıf matematik konularından rastgele sorularla kafa kafaya yarış!',
            tags: ['🔢 Sayılar', '➕ İşlemler', '✖️ Çarpma/Bölme', '⏰ Zaman & Para', '📐 Geometri', '📊 Grafikler'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'turkish',
        name: 'Türkçe',
        icon: '📚',
        colorTheme: 'theme-turkish',
        tagline: '2026 Maarif Modeli',
        description: 'Eş ve zıt anlamlı kelimeler, sözlük sırası ve heceleme, 5N1K okuduğunu anlama, kurallı cümle inşası ve noktalama ustası! ✍️📖🦉',
        badge: 'Maarif Modeli 2026',
        topics: [
          { id: 'all', label: '🌟 Tüm Konular / Karma Düello' },
          { id: 'syn_ant', label: '✨ Tema 1: Sözcükte Anlam (Eş & Zıt)' },
          { id: 'alphabet_syllable', label: '🔤 Tema 2: Harf, Hece & Sözlük Sırası' },
          { id: 'reading_5n1k', label: '🔍 Tema 3: Okuduğunu Anlama & 5N1K' },
          { id: 'sentence_logic', label: '🧱 Tema 4: Cümle Bilgisi & Anlamlı Cümle' },
          { id: 'punctuation_spelling', label: '✍️ Tema 5: Yazım Kuralları & Noktalama' }
        ],
        games: [
          {
            id: 'turkish_syn_ant_2',
            active: true,
            title: 'Eş ve Zıt Anlam Avcısı (Kelime Düellosu)',
            icon: '✨',
            badge: '✨ Eş & Zıt Anlam',
            featureTag: '⭐ 50+ Kelime Hazinesi',
            description: 'Siyah-kara, beyaz-ak, mektep-okul ve acemi-usta, taze-bayat kelime düellosu!',
            tags: ['✨ Eş Anlamlılar', '🔄 Zıt Anlamlılar', '📚 Zengin Sözlük'],
            btnText: 'Düelloyu Başlat',
            topic: 'syn_ant'
          },
          {
            id: 'turkish_alphabet_syllable_2',
            active: true,
            title: 'Sözlük Sırası & Doğru Hece Bölme Atölyesi',
            icon: '🔤',
            badge: '🔤 Sözlük & Hece',
            featureTag: '📏 Hece & Alfabetik Sıra',
            description: '3 kelimelik alfabetik sözlük sırası, ünlü harf kuralıyla hece sayısı ve satır sonu kısa çizgi bölme ustası!',
            tags: ['🔤 Sözlük Sırası', '🔢 Hece Sayısı', '➖ Satır Sonu Bölme', '📖 Ünlü Harf Kuralı'],
            btnText: 'Düelloyu Başlat',
            topic: 'alphabet_syllable'
          },
          {
            id: 'turkish_reading_5n1k_2',
            active: true,
            title: '5N1K Dedektifi & Metin Anlama',
            icon: '🔍',
            badge: '🔍 5N1K & Anlama',
            featureTag: '🕵️ 5N1K Soruları',
            description: 'Kısa, eğlenceli metinlerle Kim, Ne, Nerede, Ne zaman, Nasıl, Niçin dedektifliği ve oluş sırası!',
            tags: ['🕵️ 5N1K Soruları', '📖 Okuduğunu Anlama', '⏳ Olayların Oluş Sırası', '🎯 Başlık & Konu'],
            btnText: 'Düelloyu Başlat',
            topic: 'reading_5n1k'
          },
          {
            id: 'turkish_sentence_logic_2',
            active: true,
            title: 'Kurallı Cümle İnşası',
            icon: '🧱',
            badge: '🧱 Kurallı Cümle',
            featureTag: '⚡ Cümle & Soru Eki',
            description: 'Karışık kelimelerden kurallı cümle oluşturma, sebep-sonuç tamamlama, tekil-çoğul ve mi soru eki ayrı yazımı!',
            tags: ['🧱 Anlamlı & Kurallı', '🌧️ Sebep-Sonuç', '👥 -lar/-ler Çoğul Eki', '❓ mı/mi Soru Eki'],
            btnText: 'Düelloyu Başlat',
            topic: 'sentence_logic'
          },
          {
            id: 'turkish_punctuation_spelling_2',
            active: true,
            title: 'Noktalama & Yazım Ustası Düellosu',
            icon: '✍️',
            badge: '✍️ Noktalama & Yazım',
            featureTag: '🛑 Nokta, Virgül, Kesme',
            description: 'Nokta, virgül, soru, ünlem, kesme işareti ve büyük harflerin doğru kullanımı (insan, şehir, bayram)!',
            tags: ['🛑 Nokta & Virgül', '❓ Soru & Ünlem', "✂️ Kesme İşareti (')", '🔤 Büyük Harfler'],
            btnText: 'Düelloyu Başlat',
            topic: 'punctuation_spelling'
          },
          {
            id: 'turkish_2_karma',
            active: true,
            title: '2. Sınıf Türkçe Karma Düello',
            icon: '🦉',
            badge: '🏆 2. Sınıf Türkçe Karma',
            featureTag: '🌟 5 Alan Genel Tekrar',
            description: 'Tüm 2. sınıf Türkçe öğrenme alanlarından harmanlanan akıllı tahta sınıf yarışması!',
            tags: ['✨ Eş/Zıt Anlam', '🔤 Sözlük & Hece', '🔍 5N1K', '🧱 Cümle Bilgisi', '✍️ Noktalama'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'lifescience',
        name: 'Hayat Bilgisi',
        icon: '🌱',
        colorTheme: 'theme-lifescience',
        tagline: '2026 Maarif Modeli',
        description: 'Okulda empati, mevsim tabakları, güvenli adımlar, aile bütçesi, vatan sevgisi ve doğa dedektifi! 🏫🍎🚦🏡🇹🇷🌿',
        badge: 'Maarif Modeli 2026',
        topics: [
          { id: 'all', label: '🌟 Hayat Bilgisi Karma Düello' },
          { id: 'school', label: '🏫 Tema 1: Ben ve Okulum' },
          { id: 'health', label: '🍎 Tema 2: Sağlığım ve Güvenliğim' },
          { id: 'safety', label: '🚦 Tema 3: Güvenli Hayat' },
          { id: 'home_family', label: '🏡 Tema 4: Ailem ve Toplum' },
          { id: 'country_culture', label: '🇹🇷 Tema 5: Yaşadığım Yer ve Ülkem' },
          { id: 'nature_environment', label: '🌿 Tema 6: Doğa ve Çevre' }
        ],
        games: [
          {
            id: 'lifescience_school_2',
            active: true,
            title: 'Okulda Empati & İş Birliği Düellosu',
            icon: '🏫',
            badge: '🏫 Okulumuzda Hayat',
            featureTag: '🤝 Empati & Kaynaklar',
            description: 'Bireysel farklılıklara saygı, okul kaynaklarını özenli kullanma, grup çalışması ve çanta hazırlama!',
            tags: ['🤝 Empati & Saygı', '💡 Kaynak Tasarrufu', '🎒 Çanta Düzeni', '👥 Grup Çalışması'],
            btnText: 'Düelloyu Başlat',
            topic: 'school'
          },
          {
            id: 'lifescience_health_2',
            active: true,
            title: 'Mevsim Tabakları & Sağlık Koruyucusu',
            icon: '🍎',
            badge: '🍎 Sağlıklı Hayat',
            featureTag: '🥗 Dengeli Beslenme',
            description: 'Mevsiminde taze meyve-sebze, dengeli öğünler, kişisel hijyen, düzenli uyku ve spor alışkanlığı!',
            tags: ['🥦 Mevsim Sebzeleri', '🧼 Temizlik & Hijyen', '🛌 Düzenli Uyku', '🏃‍♂️ Spor & Sağlık'],
            btnText: 'Düelloyu Başlat',
            topic: 'health'
          },
          {
            id: 'lifescience_safety_2',
            active: true,
            title: 'Güvenli Adımlar & Acil Durum Avcısı',
            icon: '🚦',
            badge: '🚦 Güvenli Hayat',
            featureTag: '🚨 112 Acil & Güvenlik',
            description: 'Okul servisi kuralları, güvenli oyun alanları, 112 Acil Çağrı, bilinçli ekran kullanımı ve yabancılara hayır deme!',
            tags: ['🚌 Servis Güvenliği', '📞 112 Acil Çağrı', '🛑 Hayır Deme Becerisi', '📱 Ekran Güvenliği'],
            btnText: 'Düelloyu Başlat',
            topic: 'safety'
          },
          {
            id: 'lifescience_home_family_2',
            active: true,
            title: 'İstek mi İhtiyaç mı? & Akraba Ağacı',
            icon: '🏡',
            badge: '🏡 Evimizde Hayat',
            featureTag: '💰 Bütçe & Akrabalık',
            description: 'Dayı, teyze, hala, amca akraba bağları, ev adresi, istek-ihtiyaç ayrımı, ailede iş bölümü ve tasarruf!',
            tags: ['🌳 Akraba Bağları', '💡 İstek & İhtiyaç', '📍 Ev Adresimiz', '🤝 Ailede İş Bölümü'],
            btnText: 'Düelloyu Başlat',
            topic: 'home_family'
          },
          {
            id: 'lifescience_country_culture_2',
            active: true,
            title: 'Ülkemi Tanıyorum & Bayramlar Düellosu',
            icon: '🇹🇷',
            badge: '🇹🇷 Ülkemizde Hayat',
            featureTag: '🗺️ Harita & Bayramlar',
            description: 'Türkiye haritası, başkent Ankara, Atatürk\'ün öğrenim hayatı, milli ve dini bayramlarımız ile kültürel mirasımız!',
            tags: ['🇹🇷 Başkent Ankara', '🎖️ Atatürk\'ün Çocukluğu', '🎉 Milli Bayramlar', '🕌 Dini Bayramlar'],
            btnText: 'Düelloyu Başlat',
            topic: 'country_culture'
          },
          {
            id: 'lifescience_nature_environment_2',
            active: true,
            title: 'Doğa Dedektifi & Afet Bilinci',
            icon: '🌿',
            badge: '🌿 Doğada Hayat',
            featureTag: '🌍 Afetler & Geri Dönüşüm',
            description: 'Canlıların yaşam gereksinimleri, doğal ve beşeri unsurlar, geri dönüşüm, afet bilinci ve doğada yön bulma!',
            tags: ['♻️ Geri Dönüşüm', '🧭 Yön Bulma', '🛡️ Afet Bilinci', '🌍 Dünya\'nın Hareketleri'],
            btnText: 'Düelloyu Başlat',
            topic: 'nature_environment'
          },
          {
            id: 'lifescience_2_karma',
            active: true,
            title: 'Hayat Bilgisi Büyük Karma Düello',
            icon: '🌱',
            badge: '🏆 2. Sınıf Karma',
            featureTag: '🌟 6 Tema Genel Tekrar',
            description: 'Tüm 2. sınıf Hayat Bilgisi temalarından rastgele ve dengeli sorularla akıllı tahta düellosu!',
            tags: ['🏫 Okulumuz', '🍎 Sağlık', '🚦 Güvenlik', '🏡 Evimiz', '🇹🇷 Ülkemiz', '🌿 Doğa'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'grade2_grand_duel',
        name: '🏆 2. Sınıf Büyük Karma Düello',
        icon: '🏆',
        colorTheme: 'theme-science',
        tagline: 'Tüm Dersler Şampiyonası',
        description: 'Hayat Bilgisi, Matematik ve Türkçe 2026 Maarif Modelinin tüm derslerinden karma büyük yarışma! 🏆🌟',
        badge: '🌟 Süper Şampiyona',
        topics: [
          { id: 'all', label: '🌟 Tüm Dersler Karma' }
        ],
        games: [
          {
            id: 'grade2_grand_duel',
            active: true,
            title: '2. Sınıf Büyük Karma Düello (Tüm Dersler)',
            icon: '🏆',
            badge: '🏆 Büyük Şampiyona',
            featureTag: '⭐ 3 Ders Harmanı',
            description: 'Hayat Bilgisi, Matematik ve Türkçe konularından dengeli sorularla sınıfının şampiyonu sen ol! 🥇🎯',
            tags: ['🧮 Matematik', '📚 Türkçe', '🌱 Hayat Bilgisi', '🏆 Süper Düello'],
            btnText: 'Büyük Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'english',
        name: 'İngilizce',
        icon: '🌍',
        colorTheme: 'theme-english',
        tagline: 'Classroom, Animals & Fruits',
        description: 'Sınıf eşyaları, meyveler, sevimli hayvanlar ve sayılar! 🎒🍎🐶',
        badge: 'MEB Müfredatı',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'school_objects', label: '🎒 Classroom & Numbers' },
          { id: 'animals_fruits', label: '🍎 Animals & Fruits' },
          { id: 'colors', label: '🎨 Colors' },
          { id: 'greetings', label: '👋 Greetings' }
        ],
        games: [
          {
            id: 'english_school_objects_2',
            active: true,
            title: 'Colors, Numbers (1-20) & Classroom Objects',
            icon: '🎒',
            badge: '🎒 Sınıf & Sayılar',
            featureTag: '⭐ 26 Özgün Soru',
            description: 'Book, pencil, ruler, bag gibi okul eşyaları, renkler ve 1-20 arası İngilizce sayılar! 🎒✏️',
            tags: ['🎒 School Objects', '🔢 Numbers 1-20', '🔊 Sesli Okuma'],
            btnText: 'Düelloyu Başlat',
            topic: 'school_objects'
          },
          {
            id: 'english_animals_fruits_2',
            active: true,
            title: 'Animals & Fruits',
            icon: '🍎',
            badge: '🍎 Canlılar & Meyveler',
            featureTag: '⭐ 32 Kelime',
            description: 'Apple, banana, strawberry ve sevimli hayvanları görsel-kelime eşleştir, sesli dinle! 🍎🦁',
            tags: ['🍎 Fruits (Meyveler)', '🦁 Animals (Hayvanlar)', '🔊 Doğru Telaffuz'],
            btnText: 'Düelloyu Başlat',
            topic: 'animals_fruits'
          },
          {
            id: 'english_colors',
            active: true,
            title: 'Renkler (Colors Matching)',
            icon: '🎨',
            badge: '🌈 Colors',
            featureTag: '🔊 Sesli Pratik',
            description: 'Red, blue, green gibi renkleri İngilizce dinle ve Türkçe karşılığıyla eşleştir! 🎨',
            tags: ['🎨 Colors', '🖼️ Renk Eşleştirme', '🔊 Doğru Telaffuz'],
            btnText: 'Eşleştirmeyi Başlat',
            topic: 'colors'
          },
          {
            id: 'english_greetings',
            active: true,
            title: 'Günlük İfadeler (Greetings)',
            icon: '👋',
            badge: '👋 Greetings',
            featureTag: '🔊 Sesli Pratik',
            description: 'Hello, good morning, thank you gibi günlük nezaket ve konuşma ifadeleri! 👋',
            tags: ['👋 Greetings', '☀️ Günaydın & Selam', '🔊 Doğru Telaffuz'],
            btnText: 'Eşleştirmeyi Başlat',
            topic: 'greetings'
          },
          {
            id: 'english',
            active: true,
            title: 'English Word Battle (Karma)',
            icon: '🇬🇧',
            badge: '🚀 Tüm Konular',
            featureTag: '⚡ Hızlı Kelime',
            description: 'Okul eşyaları, meyveler, hayvanlar ve sayılardan oluşan karma İngilizce düellosu! 🚀',
            tags: ['🇬🇧 Karma Pratik', '⚡ Çift Dilli Eşleme', '🔊 Otomatik Telaffuz'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'brain',
        name: 'Akıl ve Zeka Oyunları',
        icon: '🧠',
        colorTheme: 'theme-brain',
        tagline: 'Zeka & Nöro-Dikkat',
        description: 'Stroop renk tuzakları, 9\'lu sembol tarama ve foto-hafıza! ⚡🎯',
        badge: 'Zeka Düelloları',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'oddone', label: '👀 Fark Bulma' },
          { id: 'stroop', label: '🎯 Stroop Testi' },
          { id: 'memory', label: '🧠 Süper Hafıza' },
          { id: 'reflex', label: '⚡ Şimşek Refleks' }
        ],
        games: [
          {
            id: 'oddone',
            active: true,
            title: 'Farklı Olanı Yakala',
            icon: '👀',
            badge: '🚀 Gözlem Gücü',
            featureTag: '⚡ Hızlı Tarama',
            description: '9 emoji arasından gizlice saklanan yabancı sembolü avla! ⚡',
            tags: ['⚡ 9\'lu Dizi', '👀 Keskin Gözler', '⏱️ Hızlı Tepki'],
            btnText: 'Düelloyu Başlat',
            topic: 'oddone'
          },
          {
            id: 'stroop',
            active: true,
            title: 'Renk Tuzakları (Stroop)',
            icon: '🎯',
            badge: '🚀 Stroop Testi',
            featureTag: '🧠 Beyin Fırtınası',
            description: 'Dikkat tuzak! Renge aldanma, kelimenin gerçek rengini bil! 🧠',
            tags: ['🧠 Renk Tuzağı', '⚡ Beyin Jimnastiği', '🎯 Odaklanma'],
            btnText: 'Düelloyu Başlat',
            topic: 'stroop'
          },
          {
            id: 'memory',
            active: true,
            title: 'Süper Hafıza: Sırayı Hatırla',
            icon: '🧠',
            badge: '🚀 Sıralı Hafıza',
            featureTag: '⚡ Hızlı Hatırla',
            description: 'Sembolleri hızlıca tara! Sorulan sembolü ilk dokunan bulsun! 🚀',
            tags: ['🚀 3-4 Sembol', '⚡ Hızlı Kodlama', '🧠 Canlandırma'],
            btnText: 'Düelloyu Başlat',
            topic: 'memory'
          },
          {
            id: 'reflex',
            active: true,
            title: 'Şimşek Refleks: Hedef Avı',
            icon: '⚡',
            badge: '🚀 Hızlı Tepki',
            featureTag: '🚀 Saliselik Tepki',
            description: 'Saf hız ve konsantrasyon! Hedefi ilk yakalayan puanı kapar! 🚀',
            tags: ['🚀 Saliselik Tepki', '⚡ Hızlı Dokunuş', '🔒 Kilit Cezası'],
            btnText: 'Düelloyu Başlat',
            topic: 'reflex'
          },
          {
            id: 'true_false',
            active: true,
            title: 'Doğru mu Yanlış mı? (Refleks)',
            icon: '⚡',
            badge: '✅❌ Hızlı Karar',
            featureTag: '⚡ 2x Hızlı Süre',
            description: 'Dev butonlar, 2 kat hızlı eriyen süre! Doğru mu yoksa yanlış mı? ⚡',
            tags: ['✅ Dev Butonlar', '⚡ 2x Hızlı Süre', '🔥 Anlık Refleks'],
            btnText: 'Düelloyu Başlat',
            topic: 'reflex'
          },
          {
            id: 'matching',
            active: true,
            title: 'Dokun ve Eşleştir (Zihin Çiftleri)',
            icon: '🧩',
            badge: '🧩 Ardışık Dokunma',
            featureTag: '⭐ Kart Eşleştirme',
            description: 'Sol ve sağ sütundaki doğru çiftlere ardışık dokun ve birleştir! 🧩',
            tags: ['🧩 Akıllı Dokunma', '🎯 Hızlı Eşleştir', '✨ Parıltılı Birleşme'],
            btnText: 'Düelloyu Başlat',
            topic: 'reflex'
          }
        ]
      }
    ],

    // -------------------------------------------------------------
    // 3. SINIF: Matematik, Türkçe, Hayat Bilgisi, Fen Bilimleri, İngilizce, Akıl ve Zeka Oyunları
    // -------------------------------------------------------------
    3: [
      {
        id: 'math',
        name: 'Matematik',
        icon: '🧮',
        colorTheme: 'theme-math',
        tagline: 'Çarpım Tablosu & Bölme',
        description: 'Çarpım tablosu fırtınası, zihinden bölme ve basamak değerleri! 🌪️➗',
        badge: 'MEB Müfredatı',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'mult_table', label: '🌪️ Çarpım & Bölme' },
          { id: 'place_value', label: '🏛️ Basamak & Romen' },
          { id: 'fractions_3', label: '🍕 Kesirler & Şekiller' }
        ],
        games: [
          {
            id: 'math_romen_place_3',
            active: true,
            title: '3 Basamaklı Sayılar & Romen Rakamları',
            icon: '🏛️',
            badge: 'Dinamik Soru',
            featureTag: '🏛️ Basamak & Romen',
            description: 'Basamak değerleri, yüzlüğe yuvarlama ve I\'dan XX\'ye Romen rakamları! 🏛️📦',
            tags: ['🏛️ Romen Rakamları', '📦 Basamak Değeri', '🎯 Yüzlüğe Yuvarlama'],
            btnText: 'Düelloyu Başlat',
            topic: 'place_value'
          },
          {
            id: 'math_mult_div_3',
            active: true,
            title: 'Çarpım Tablosu & Bölme Düellosu',
            icon: '🌪️',
            badge: 'Sınırsız İşlem',
            featureTag: '⚡ 6, 7, 8, 9 Fırtınası',
            description: '6, 7, 8 ve 9\'lar çarpım tablosu ve bölme işlemlerinde sınırsız pratik! 🌪️➗',
            tags: ['🌪️ Çarpım Tablosu', '➗ Bölme İşlemi', '📖 Sözel Problemler'],
            btnText: 'Düelloyu Başlat',
            topic: 'mult_table'
          },
          {
            id: 'math_fractions_shapes_3',
            active: true,
            title: 'Kesirler & Geometrik Cisimler',
            icon: '🧊',
            badge: '26 Özgün Soru',
            featureTag: '🍕 Kesir & Prizma',
            description: 'Birim kesir, pay-payda ve küp/prizmaların yüz-köşe-ayrıt hesapları! 🧊🍕',
            tags: ['🍕 Birim Kesir', '🧊 Küp & Prizma', '📐 Yüz, Köşe & Ayrıt'],
            btnText: 'Düelloyu Başlat',
            topic: 'fractions_3'
          },
          {
            id: 'math',
            active: true,
            title: 'Kafa Kafaya Matematik (Karma)',
            icon: '🧮',
            badge: '⚡ Sınıf Düellosu',
            featureTag: '🌪️ Fırtına Hesap',
            description: 'Çarpım tablosu, bölme, kesirler ve Romen rakamlarından karma meydan okuma! 🌪️',
            tags: ['🌪️ Çarpım Tablosu', '➗ Hızlı Bölme', '📐 Basamak Değeri'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'turkish',
        name: 'Türkçe',
        icon: '📚',
        colorTheme: 'theme-turkish',
        tagline: 'Eş Sesli & Deyimler',
        description: 'Eş sesli sözcükler, 5N1K paragraf analizi ve zengin Türkçe! 🎭📖',
        badge: 'MEB Müfredatı',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'homonyms', label: '🎭 Eş Sesli & Mecaz' },
          { id: 'grammar_3', label: '✍️ Noktalama & 5N1K' }
        ],
        games: [
          {
            id: 'turkish_homonyms_figurative_3',
            active: true,
            title: 'Eş Sesli Kelimeler & Mecaz Anlam',
            icon: '🎭',
            badge: '30 Özgün Soru',
            featureTag: '🎭 Sözcükte Anlam',
            description: 'Yüz, çay, kaz gibi eş sesli sözcükler ve gerçek-mecaz anlam ayrımı! 🎭📖',
            tags: ['🎭 Eş Sesli (Sesteş)', '💔 Mecaz Anlam', '📖 Gerçek Anlam'],
            btnText: 'Düelloyu Başlat',
            topic: 'homonyms'
          },
          {
            id: 'turkish_punctuation_5n1k_3',
            active: true,
            title: 'Noktalama, Yazım Kuralları & 5N1K',
            icon: '✍️',
            badge: '26 Özgün Soru',
            featureTag: '🔍 Dedektif 5N1K',
            description: 'Noktalama işaretleri, büyük harf kuralları ve metinlerde 5N1K analizi! 🕵️‍♂️✍️',
            tags: ['✍️ Noktalama İşaretleri', '🕵️ 5N 1K Analizi', '📝 Yazım Kuralları'],
            btnText: 'Düelloyu Başlat',
            topic: 'grammar_3'
          },
          {
            id: 'turkish',
            active: true,
            title: 'Hızlı Türkçe & Bilgi Avcısı (Karma)',
            icon: '🦉',
            badge: '⚡ Eş Sesli & Bilgi',
            featureTag: '🌟 Keşif Zamanı',
            description: 'Eş sesli kelimeler, 5N1K ve eğlenceli Türkçe meydan okuması! 🌟',
            tags: ['🎭 Eş Sesliler', '📜 Deyimler', '✍️ Noktalama'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'lifescience',
        name: 'Hayat Bilgisi',
        icon: '🌱',
        colorTheme: 'theme-lifescience',
        tagline: '2026 Maarif Modeli',
        description: 'Okulda empati ve meslekler, evde planlı yaşam ve tasarruf, bilinçli tüketici, trafik güvenliği, yönetim ve yön bulma! 🏫🏡🍎🚦🏛️🧭',
        badge: 'Maarif Modeli 2026',
        topics: [
          { id: 'all', label: '🌟 Tüm Temalar / Karma Düello' },
          { id: 'school', label: '🏫 Tema 1: Okulumuzda Hayat' },
          { id: 'home', label: '🏡 Tema 2: Evimizde Hayat' },
          { id: 'health', label: '🍎 Tema 3: Sağlıklı Hayat' },
          { id: 'safety', label: '🚦 Tema 4: Güvenli Hayat' },
          { id: 'country', label: '🇹🇷 Tema 5: Ülkemizde Hayat' },
          { id: 'nature', label: '🧭 Tema 6: Doğada Hayat' }
        ],
        games: [
          {
            id: 'lifescience_school_professions_3',
            active: true,
            title: 'Kroki Okuma & Meslekler Düellosu',
            icon: '🏫',
            badge: '🏫 Okulumuzda Hayat',
            featureTag: '📐 Kroki & Meslekler',
            description: 'Sınıf ve okul krokisi okuma, güçlü yönlerimiz, arkadaşlık ilişkileri, sosyal kulüpler ve meslekleri tanıma!',
            tags: ['📐 Kroki Okuma', '💼 Meslekler', '🤝 Arkadaşlık & Empati', '🗳️ Dilek Kutusu'],
            btnText: 'Düelloyu Başlat',
            topic: 'school'
          },
          {
            id: 'lifescience_home_budget_3',
            active: true,
            title: 'Planlı Yaşam & Bütçe/Tasarruf Ustası',
            icon: '🏡',
            badge: '🏡 Evimizde Hayat',
            featureTag: '🪙 Bütçe & Planlı Yaşam',
            description: 'Geleneksel çocukluk oyunları, komşuluk ilişkileri, evdeki sorumluluklar, elektrik/su tasarrufu ve aile bütçesi!',
            tags: ['🪙 Aile Bütçesi', '💡 Kaynak Tasarrufu', '⏰ Planlı Yaşam', '🤝 Komşuluk'],
            btnText: 'Düelloyu Başlat',
            topic: 'home'
          },
          {
            id: 'lifescience_health_consumer_3',
            active: true,
            title: 'Bilinçli Tüketici (SKT/TSE) & Sağlıklı Beslenme',
            icon: '🍎',
            badge: '🍎 Sağlıklı Hayat',
            featureTag: '🛡️ SKT, TSE & Hijyen',
            description: 'Kişisel bakım, gıdalarda SKT ve TSE damgası kontrolü, fiş/fatura, mevsimine göre dengeli beslenme ve ortak hijyen!',
            tags: ['📅 Son Kullanma Tarihi', '🛡️ TSE & Fiş/Fatura', '🥦 Mevsiminde Beslenme', '🧼 Ortak Alan Hijyeni'],
            btnText: 'Düelloyu Başlat',
            topic: 'health'
          },
          {
            id: 'lifescience_safety_traffic_3',
            active: true,
            title: 'Trafik Levhaları & Acil Durum Rehberi',
            icon: '🚦',
            badge: '🚦 Güvenli Hayat',
            featureTag: '🚨 Trafik & 112 Acil',
            description: 'Trafik işaret ve levhaları, yaya güvenliği, ev/okul kazalarından korunma, deprem/yangın anında 112 ve güvenli adımlar!',
            tags: ['🚦 Trafik Levhaları', '🚨 112 Acil Çağrı', '🛡️ Çök-Kapan-Tutun', '🛑 Güvenlik ve "Hayır!"'],
            btnText: 'Düelloyu Başlat',
            topic: 'safety'
          },
          {
            id: 'lifescience_country_leaders_3',
            active: true,
            title: 'Vali mi Kaymakam mı? & Değerlerimiz/Öncülerimiz',
            icon: '🇹🇷',
            badge: '🇹🇷 Ülkemizde Hayat',
            featureTag: '🏛️ Vali, Kaymakam & Öncüler',
            description: 'Yönetim birimleri (vali, kaymakam, muhtar), cumhuriyet, tarihi/doğal güzelliklerimiz, Atatürk ve Türk öncüleri!',
            tags: ['🏛️ Vali & Kaymakam', '🗳️ Cumhuriyet', '✈️ Vecihi Hürkuş', '🧪 Aziz Sancar & Naim'],
            btnText: 'Düelloyu Başlat',
            topic: 'country'
          },
          {
            id: 'lifescience_nature_directions_3',
            active: true,
            title: 'Doğada Yön Bulma (Pusula/Yosun) & Çevre Koruyucusu',
            icon: '🧭',
            badge: '🧭 Doğada Hayat',
            featureTag: '🧭 Pusula, Yosun & Çevre',
            description: 'Pusula, Kutup Yıldızı, karınca yuvası ve yosunla yön bulma; nesli tükenen canlılar (kelaynak, caretta) ve geri dönüşüm!',
            tags: ['🧭 Pusula & Yön Bulma', '⭐ Kutup Yıldızı', '🐢 Caretta & Kelaynak', '♻️ Geri Dönüşüm'],
            btnText: 'Düelloyu Başlat',
            topic: 'nature'
          },
          {
            id: 'lifescience_3_karma',
            active: true,
            title: '3. Sınıf Hayat Bilgisi Karma Düello',
            icon: '🌱',
            badge: '🏆 3. Sınıf Hayat Bilgisi Karma',
            featureTag: '🌟 6 Tema Büyük Tekrar',
            description: 'Tüm 3. sınıf Hayat Bilgisi temalarından rastgele ve dengeli sorularla sınıf içi genel tekrar düellosu!',
            tags: ['🏫 Okul', '🏡 Evimiz', '🍎 Sağlık', '🚦 Güvenlik', '🇹🇷 Ülkemiz', '🧭 Doğa'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'science',
        name: 'Fen Bilimleri',
        icon: '🔬',
        colorTheme: 'theme-science',
        tagline: '2026 Maarif Modeli',
        description: 'Dünya\'nın katmanları, 5 duyumuz, kuvvet ve hareket, katı-sıvı-gaz, ışık ve ses, canlılar dünyası ve elektrik! 🌍👂🧲🧊💡🌱⚡',
        badge: 'Maarif Modeli 2026',
        topics: [
          { id: 'all', label: '🌟 Tüm Üniteler / Karma Düello' },
          { id: 'planet_layers', label: '🌍 Ünite 1: Gezegenimizi Tanıyalım' },
          { id: 'senses', label: '👂 Ünite 2: Beş Duyumuz' },
          { id: 'force_motion', label: '🧲 Ünite 3: Kuvveti Tanıyalım' },
          { id: 'matter_states', label: '🧊 Ünite 4: Maddeyi Tanıyalım' },
          { id: 'light_sound', label: '💡 Ünite 5: Çevremizdeki Işık ve Sesler' },
          { id: 'living_environment', label: '🌱 Ünite 6: Canlılar Dünyasına Yolculuk' },
          { id: 'electricity_safety', label: '⚡ Ünite 7: Elektrikli Araçlar' }
        ],
        games: [
          {
            id: 'science_planet_layers_3',
            active: true,
            title: 'Dünya\'nın Katmanları & Gezegen Keşfi',
            icon: '🌍',
            badge: '🌍 Gezegenimiz',
            featureTag: '🪐 Çekirdek, Manto, Taş Küre',
            description: 'Dünya\'nın küre şekli, kanıtları, içten dışa katmanları (çekirdek, manto, yer kabuğu) ve kara-su oranları!',
            tags: ['🌍 Dünya\'nın Şekli', '🌋 Manto & Magma', '🟡 Çekirdek', '🌊 Karalar & Sular'],
            btnText: 'Düelloyu Başlat',
            topic: 'planet_layers'
          },
          {
            id: 'science_senses_3',
            active: true,
            title: 'Beş Duyu Dedektifi',
            icon: '👂',
            badge: '👂 5 Duyumuz',
            featureTag: '👁️ Göz, Kulak, Burun, Dil, Deri',
            description: 'Göz, kulak, burun, dil ve deri görevleri, duyu ilişkileri ve organ sağlığını koruma kuralları!',
            tags: ['👁️ Görme & İşitme', '👃 Koku & Tat', '🖐️ Dokunma & Deri', '🛡️ Duyu Sağlığı'],
            btnText: 'Düelloyu Başlat',
            topic: 'senses'
          },
          {
            id: 'science_force_motion_3',
            active: true,
            title: 'İtme mi Çekme mi? & Hareket Türleri Düellosu',
            icon: '🧲',
            badge: '🧲 Kuvvet & Hareket',
            featureTag: '⚡ Hızlanma, Yavaşlama, Yön',
            description: 'İtme-çekme kuvveti, hızlanma, yavaşlama, sallanma, dönme ve hareketli cisimlerin oluşturabileceği tehlikeler!',
            tags: ['🛒 İtme & Çekme', '🛑 Hızlanma & Yavaşlama', '🔄 Dönme & Sallanma', '⚠️ Hareket Tehlikeleri'],
            btnText: 'Düelloyu Başlat',
            topic: 'force_motion'
          },
          {
            id: 'science_matter_states_3',
            active: true,
            title: 'Katı-Sıvı-Gaz Avcısı & Madde Özellikleri',
            icon: '🧊',
            badge: '🧊 Maddeyi Tanıyalım',
            featureTag: '💧 Katı, Sıvı, Gaz & Nitelikler',
            description: 'Sert-yumuşak, esnek-kırılgan, pürüzlü-pürüzsüz maddeler, maddenin 3 temel hali ve kimyasal güvenlik!',
            tags: ['🧊 Katı, Sıvı, Gaz', '🧽 Esnek & Berk', '🥛 Kırılgan Madde', '⚠️ Kimyasal Güvenlik'],
            btnText: 'Düelloyu Başlat',
            topic: 'matter_states'
          },
          {
            id: 'science_light_sound_3',
            active: true,
            title: 'Doğal mı Yapay mı? (Işık ve Ses Düellosu)',
            icon: '💡',
            badge: '💡 Işık ve Ses',
            featureTag: '☀️ Doğal & Yapay Kaynaklar',
            description: 'Işığın görmedeki rolü, doğal/yapay ışık ve ses kaynakları, sesin yayılması, şiddeti ve işitme sağlığı!',
            tags: ['☀️ Doğal Işık', '💡 Yapay Işık', '📢 Sesin Yayılması', '🎧 İşitme Sağlığı'],
            btnText: 'Düelloyu Başlat',
            topic: 'light_sound'
          },
          {
            id: 'science_living_environment_3',
            active: true,
            title: 'Canlı-Cansız Sınıflandır & Doğal/Yapay Çevre',
            icon: '🌱',
            badge: '🌱 Canlılar Dünyası',
            featureTag: '🌻 7 Ortak Özellik & Döngü',
            description: 'Canlı-cansız varlıklar, canlıların 7 ortak özelliği, bitkinin yaşam döngüsü, doğal/yapay çevre ve doğa koruma!',
            tags: ['🐾 Canlı ve Cansız', '🌿 Canlıların Özellikleri', '🫘 Bitki Yaşam Döngüsü', '🏞️ Doğal/Yapay Çevre'],
            btnText: 'Düelloyu Başlat',
            topic: 'living_environment'
          },
          {
            id: 'science_electricity_safety_3',
            active: true,
            title: 'Elektrik Kaynakları & Güvenli Kullanım',
            icon: '⚡',
            badge: '⚡ Elektrikli Araçlar',
            featureTag: '🔌 Priz, Pil, Akü, Batarya',
            description: 'Elektrikli aletlerin kullanım amaçları, şehir elektriği, pil, akü, batarya, atık pil tehlikesi ve elektrik güvenliği!',
            tags: ['🔌 Şehir Elektriği', '🔋 Pil, Akü, Batarya', '🪫 Atık Pil Bilinci', '⚡ Elektrik Çarpması'],
            btnText: 'Düelloyu Başlat',
            topic: 'electricity_safety'
          },
          {
            id: 'science_3_karma',
            active: true,
            title: '3. Sınıf Fen Bilimleri Karma Düello',
            icon: '🔬',
            badge: '🏆 3. Sınıf Fen Karma',
            featureTag: '🌟 7 Ünite Büyük Tekrar',
            description: 'Tüm 3. sınıf Fen Bilimleri ünitelerinden rastgele ve dengeli sorularla büyük sınıf içi düello!',
            tags: ['🌍 Dünya', '👂 Duyular', '🧲 Kuvvet', '🧊 Madde', '💡 Işık/Ses', '🌱 Canlılar', '⚡ Elektrik'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'english',
        name: 'İngilizce',
        icon: '🌍',
        colorTheme: 'theme-english',
        tagline: 'Family, Feelings & Abilities',
        description: 'Aile bireyleri, duygular, yetenekler (can/can\'t) ve renkler! 👨‍👩‍👧😊',
        badge: 'MEB Müfredatı',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'family', label: '👨‍👩‍👧 Family & Feelings' },
          { id: 'colors', label: '🎨 Renkler (Colors)' },
          { id: 'animals', label: '🐾 Hayvanlar (Animals)' },
          { id: 'numbers', label: '🔢 Sayılar (Numbers)' },
          { id: 'greetings', label: '👋 Günlük İfadeler (Greetings)' }
        ],
        games: [
          {
            id: 'english_family_feelings_3',
            active: true,
            title: 'Family Members, Feelings & Abilities',
            icon: '👨‍👩‍👧',
            badge: '30 Soru Sesli',
            featureTag: '🔊 Sesli Pratik',
            description: 'Father, mother, feelings (happy, sad, tired) ve can/can\'t cümleleri! 👨‍👩‍👧😊',
            tags: ['👨‍👩‍👧 Family Members', '😊 Feelings & Emotions', '🚀 Can & Can\'t'],
            btnText: 'Düelloyu Başlat',
            topic: 'family'
          },
          {
            id: 'english_colors',
            active: true,
            title: 'Renkler (Colors Matching)',
            icon: '🎨',
            badge: '🌈 Colors',
            featureTag: '🔊 Sesli Pratik',
            description: 'Red, blue, green gibi renkleri İngilizce dinle ve Türkçe karşılığıyla eşleştir! 🎨',
            tags: ['🎨 Colors', '🖼️ Renk Eşleştirme', '🔊 Doğru Telaffuz'],
            btnText: 'Eşleştirmeyi Başlat',
            topic: 'colors'
          },
          {
            id: 'english_animals',
            active: true,
            title: 'Hayvanlar (Animals Matching)',
            icon: '🐾',
            badge: '🦁 Animals',
            featureTag: '🔊 Sesli Pratik',
            description: 'Cat, dog, lion gibi sevimli dostlarımızın İngilizce telaffuzunu dinle ve doğru eşleştir! 🐾',
            tags: ['🐾 Animals', '🐶 Sevimli Dostlar', '🔊 Doğru Telaffuz'],
            btnText: 'Eşleştirmeyi Başlat',
            topic: 'animals'
          },
          {
            id: 'english_numbers',
            active: true,
            title: 'Sayılar (Numbers Matching)',
            icon: '🔢',
            badge: '🔢 Numbers',
            featureTag: '🔊 Sesli Pratik',
            description: 'One, two, three... İngilizce sayıları dinle ve doğru rakamlarla eşleştir! 🔢',
            tags: ['🔢 Numbers 1-20', '🎯 Hızlı Sayma', '🔊 Doğru Telaffuz'],
            btnText: 'Eşleştirmeyi Başlat',
            topic: 'numbers'
          },
          {
            id: 'english_greetings',
            active: true,
            title: 'Günlük İfadeler (Greetings)',
            icon: '👋',
            badge: '👋 Greetings',
            featureTag: '🔊 Sesli Pratik',
            description: 'Hello, good morning, thank you gibi günlük nezaket ve konuşma ifadeleri! 👋',
            tags: ['👋 Greetings', '☀️ Günaydın & Selam', '🔊 Doğru Telaffuz'],
            btnText: 'Eşleştirmeyi Başlat',
            topic: 'greetings'
          },
          {
            id: 'english',
            active: true,
            title: 'English Word Battle (Karma)',
            icon: '🇬🇧',
            badge: '⚡ Sınıf Düellosu',
            featureTag: '⚡ Hızlı Kelime',
            description: 'Aile, duygular, renkler, hayvanlar ve sayılardan karma İngilizce düellosu! 🚀',
            tags: ['🇬🇧 Karma Pratik', '⚡ Çift Dilli Eşleme', '🔊 Otomatik Telaffuz'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'brain',
        name: 'Akıl ve Zeka Oyunları',
        icon: '🧠',
        colorTheme: 'theme-brain',
        tagline: 'Algı & Foto-Hafıza',
        description: 'Geometrik fark avcılığı, ters köşe Stroop ve şimşek köstebek! 🎯⚡',
        badge: 'Zeka Ligi',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'oddone', label: '👀 Detay Avı' },
          { id: 'stroop', label: '🎯 Stroop' },
          { id: 'memory', label: '🧠 4\'lü Dizi' },
          { id: 'reflex', label: '⚡ Şimşek Hız' }
        ],
        games: [
          {
            id: 'oddone',
            active: true,
            title: 'Farklı Olanı Yakala',
            icon: '👀',
            badge: '⚡ Görsel Zeka',
            featureTag: '🎯 Şahin Bakışı',
            description: 'Birbirine benzeyen geometrik şekillerdeki minik farkı ilk gören puanı kapar! 🎯',
            tags: ['🎯 Detay Avcılığı', '🧠 Görsel Zeka', '🔍 Hızlı Tarama'],
            btnText: 'Düelloyu Başlat',
            topic: 'oddone'
          },
          {
            id: 'stroop',
            active: true,
            title: 'Renk Tuzakları (Stroop)',
            icon: '🎯',
            badge: '⚡ Beyin Jimnastiği',
            featureTag: '⚡ Ters Köşe',
            description: 'Ters köşe kelimeler! Zihnini şaşırtmaya çalışan tuzağı aş! ⚡',
            tags: ['⚡ Ters Köşe', '🎯 Konsantrasyon', '🧠 Görsel Odak'],
            btnText: 'Düelloyu Başlat',
            topic: 'stroop'
          },
          {
            id: 'memory',
            active: true,
            title: 'Süper Hafıza: Sırayı Hatırla',
            icon: '🧠',
            badge: '⚡ Şampiyon Bellek',
            featureTag: '⭐ Şampiyon Bellek',
            description: '4\'lü sembol sırasını zihninde canlandır ve puanı kap! ⭐',
            tags: ['⭐ 4\'lü Dizi', '🧠 Detaylı Hatırlama', '⚡ Hızlı Çağırma'],
            btnText: 'Düelloyu Başlat',
            topic: 'memory'
          },
          {
            id: 'reflex',
            active: true,
            title: 'Şimşek Refleks: Köstebek & Av',
            icon: '⚡',
            badge: '⚡ Süper Hız',
            featureTag: '🎯 Keskin Refleks',
            description: 'Hedef çıktığı an rekor hızla dokun! Sahte bombalara asla basma! ⚡',
            tags: ['⚡ Köstebek Avı', '🎯 Seçici Dikkat', '⚡ Hızlı Refleks'],
            btnText: 'Düelloyu Başlat',
            topic: 'reflex'
          },
          {
            id: 'true_false',
            active: true,
            title: 'Doğru mu Yanlış mı? (Refleks)',
            icon: '⚡',
            badge: '✅❌ Hızlı Karar',
            featureTag: '⚡ 2x Hızlı Süre',
            description: 'Dev butonlar, 2 kat hızlı eriyen süre! Doğru mu yoksa yanlış mı? ⚡',
            tags: ['✅ Dev Butonlar', '⚡ 2x Hızlı Süre', '🔥 Anlık Refleks'],
            btnText: 'Düelloyu Başlat',
            topic: 'reflex'
          },
          {
            id: 'matching',
            active: true,
            title: 'Dokun ve Eşleştir (Zihin Çiftleri)',
            icon: '🧩',
            badge: '🧩 Ardışık Dokunma',
            featureTag: '⭐ Kart Eşleştirme',
            description: 'Sol ve sağ sütundaki doğru çiftlere ardışık dokun ve birleştir! 🧩',
            tags: ['🧩 Akıllı Dokunma', '🎯 Hızlı Eşleştir', '✨ Parıltılı Birleşme'],
            btnText: 'Düelloyu Başlat',
            topic: 'reflex'
          }
        ]
      }
    ],

    // -------------------------------------------------------------
    // 4. SINIF: Matematik, Türkçe, Fen Bilimleri, Sosyal Bilgiler, İngilizce, Akıl ve Zeka Oyunları
    // -------------------------------------------------------------
    4: [
      {
        id: 'math',
        name: 'Matematik',
        icon: '🧮',
        colorTheme: 'theme-math',
        tagline: '4 İşlem & Kesirler',
        description: 'Dört basamaklı sayılar, kesirler, açılar ve çevre-alan ustalığı! 👑🍕',
        badge: 'MEB Müfredatı',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'four_operations', label: '👑 Bölükler & 4 İşlem' },
          { id: 'fractions', label: '🍕 Kesirler & Açılar' },
          { id: 'geometry', label: '📐 Çevre & Alan' }
        ],
        games: [
          {
            id: 'math_digits_operations_4',
            active: true,
            title: '4, 5, 6 Basamaklı Sayılar & Dört İşlem',
            icon: '👑',
            badge: 'Dinamik Üretici',
            featureTag: '👑 Bölükler & İşlem',
            description: 'Bölükler, basamak değerleri, en yakın binliğe yuvarlama ve zihinden çarpma/bölme! 👑⚡',
            tags: ['👑 Binler & Birler Bölüğü', '⚡ Zihinden Çarpma', '🎯 Binliğe Yuvarlama'],
            btnText: 'Düelloyu Başlat',
            topic: 'four_operations'
          },
          {
            id: 'math_fractions_angles_4',
            active: true,
            title: 'Kesirler, Zaman ve Açılar',
            icon: '🍕',
            badge: '26 Özgün Soru',
            featureTag: '🍕 Basit & Bileşik',
            description: 'Basit/bileşik/tam sayılı kesirler, dar-dik-geniş açılar ve saat-dakika dönüşümleri! 🍕📐',
            tags: ['🍕 Kesir Türleri', '📐 Dar, Dik & Geniş Açı', '⏳ Zaman Dönüşümleri'],
            btnText: 'Düelloyu Başlat',
            topic: 'fractions'
          },
          {
            id: 'math_perimeter_area_4',
            active: true,
            title: 'Çevre ve Alan Hesaplama',
            icon: '📐',
            badge: 'Dinamik Hesap',
            featureTag: '📐 Çevre & Alan',
            description: 'Kare ve dikdörtgenlerin çevre ve alanlarını dinamik uzunluklarla hesaplama düellosu! 🟦📏',
            tags: ['🟦 Kare Çevre & Alan', '🚪 Dikdörtgen Alanı', '📏 Santimetrekare (cm²)'],
            btnText: 'Düelloyu Başlat',
            topic: 'geometry'
          },
          {
            id: 'math',
            active: true,
            title: 'Kafa Kafaya Matematik (Karma)',
            icon: '🧮',
            badge: '👑 4 İşlem Ustası',
            featureTag: '👑 Usta Hesap',
            description: '4 işlem fırtınası! Kesirleri, çevre ve alanları saliseler içinde fethet! 👑',
            tags: ['👑 Hızlı 4 İşlem', '🍕 Kesirler', '📐 Açı & Alan'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'turkish',
        name: 'Türkçe',
        icon: '📚',
        colorTheme: 'theme-turkish',
        tagline: 'Deyimler & Cümle Mantığı',
        description: 'Zengin deyimler, atasözleri, sebep-sonuç ve öznel/nesnel yargı şampiyonası! 🏆📜',
        badge: 'MEB Müfredatı',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'idioms_4', label: '🏆 Deyimler & Atasözleri' },
          { id: 'logic_4', label: '💡 Cümlede Anlam & Mantık' }
        ],
        games: [
          {
            id: 'turkish_idioms_proverbs_4',
            active: true,
            title: 'Deyimler ve Atasözleri Düellosu',
            icon: '🏆',
            badge: '35 Özgün Soru',
            featureTag: '🏆 Deyim & Atasözü',
            description: 'En çok kullanılan 35 deyim ve atasözümüzün gerçek anlamını bulma şampiyonası! 🏆📜',
            tags: ['🏆 Meşhur Deyimler', '📜 Öğüt Veren Atasözleri', '💡 Söz Varlığı'],
            btnText: 'Düelloyu Başlat',
            topic: 'idioms_4'
          },
          {
            id: 'turkish_sentences_logic_4',
            active: true,
            title: 'Sebep-Sonuç, Amaç-Sonuç & Yargılar',
            icon: '💡',
            badge: '30 Özgün Soru',
            featureTag: '💡 Cümlede Anlam',
            description: 'Sebep-sonuç, amaç-sonuç, koşul-sonuç ve öznel/nesnel yargı analizi! 💡🔍',
            tags: ['🎯 Sebep & Amaç Sonuç', '⚖️ Öznel ve Nesnel', '🔍 Koşul ve Benzetme'],
            btnText: 'Düelloyu Başlat',
            topic: 'logic_4'
          },
          {
            id: 'turkish',
            active: true,
            title: 'Hızlı Türkçe & Genel Kültür (Karma)',
            icon: '🦉',
            badge: '👑 Deyim & Kültür',
            featureTag: '🏆 Deyim Ustası',
            description: 'Zengin deyimler, atasözleri ve cümle anlamı labirentinde kelime ustası ol! 🏆',
            tags: ['🏆 Zengin Deyimler', '📜 Atasözleri', '🗺️ Genel Kültür'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'science',
        name: 'Fen Bilimleri',
        icon: '🔬',
        colorTheme: 'theme-science',
        tagline: 'Yer Kabuğu, Madde & Devreler',
        description: 'Yer kabuğu, besinlerimiz, mıknatıslar ve basit elektrik devreleri! ⚡🍎',
        badge: 'MEB Müfredatı',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'crust_nutrition', label: '🌍 Yer Kabuğu & Besinler' },
          { id: 'circuits_magnets', label: '💡 Mıknatıs & Devreler' }
        ],
        games: [
          {
            id: 'science_crust_nutrition_4',
            active: true,
            title: 'Yer Kabuğu, Hareketler & Besinlerimiz',
            icon: '🌍',
            badge: '30 Özgün Soru',
            featureTag: '🌍 Kayaçlar & Besin',
            description: 'Kayaçlar, madenler, fosiller, Dünya\'nın dönme/dolanma hareketleri ve besin grupları! 🌍🍎',
            tags: ['💎 Kayaçlar ve Madenler', '🔄 Dönme ve Dolanma', '🥩 Protein & Karbonhidrat'],
            btnText: 'Düelloyu Başlat',
            topic: 'crust_nutrition'
          },
          {
            id: 'science_circuits_magnets_4',
            active: true,
            title: 'Kuvvet, Mıknatıslar & Basit Devreler',
            icon: '💡',
            badge: '30 Özgün Soru',
            featureTag: '⚡ Devre & Mıknatıs',
            description: 'Mıknatıs kutupları, saf madde-karışım ayırma ve basit elektrik devreleri! 🧲💡',
            tags: ['🧲 Mıknatıs Kutupları', '🥗 Saf Madde & Karışım', '💡 Pil, Anahtar & Ampul'],
            btnText: 'Düelloyu Başlat',
            topic: 'circuits_magnets'
          },
          {
            id: 'science',
            active: true,
            title: 'Fen Bilimleri Laboratuvarı (Karma)',
            icon: '🔬',
            badge: '👑 Bilim Ustası',
            featureTag: '⚡ Doğa & Madde',
            description: 'Karbonhidratlar, elektrik devreleri, mıknatıslar ve kayaçlar! 🔬⚡',
            tags: ['🍎 Besin Grupları', '🧊 Katı-Sıvı-Gaz', '💡 Basit Devre'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'social',
        name: 'Sosyal Bilgiler',
        icon: '🗺️',
        colorTheme: 'theme-social',
        tagline: 'Tarih, Kültür & Üretim',
        description: 'Kimlik kartımız, Milli Mücadele, yönler ve bilinçli tüketici hakları! 🪪🧭',
        badge: 'MEB Müfredatı',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'identity_heroes', label: '🇹🇷 Birey & Milli Mücadele' },
          { id: 'places_economy', label: '🗺️ Yerler & Üretimden Tüketime' }
        ],
        games: [
          {
            id: 'social_identity_heroes_4',
            active: true,
            title: 'Birey, Toplum & Milli Mücadele',
            icon: '🇹🇷',
            badge: '30 Özgün Soru',
            featureTag: '🇹🇷 Şanlı Tarihimiz',
            description: 'T.C. Kimlik belgesi, kronoloji, Milli Mücadele kahramanlarımız ve zaferlerimiz! 🪪🇹🇷',
            tags: ['🪪 Kimlik Kartımız', '🇹🇷 Kurtuluş Savaşı', '🎖️ Kahramanlarımız'],
            btnText: 'Düelloyu Başlat',
            topic: 'identity_heroes'
          },
          {
            id: 'social_places_economy_4',
            active: true,
            title: 'İnsanlar, Yerler & Üretimden Tüketime',
            icon: '🧭',
            badge: '25 Özgün Soru',
            featureTag: '🛒 Ekonomi & Doğa',
            description: 'Hava durumu, doğal afetler, yönler, bütçe yönetimi ve israfı önleme! 🧭💰',
            tags: ['⛅ Hava Durumu & Afetler', '💰 Aile Bütçesi & Tasarruf', '🛒 Üretim & Tüketim'],
            btnText: 'Düelloyu Başlat',
            topic: 'places_economy'
          },
          {
            id: 'social',
            active: true,
            title: 'Sosyal Bilgiler Keşif Düellosu (Karma)',
            icon: '🗺️',
            badge: '👑 Keşif & Tarih',
            featureTag: '🇹🇷 Milli Kültür',
            description: 'T.C. Kimlik kartı, pusula yönleri, afetler ve Milli Mücadele kahramanları! 🇹🇷🧭',
            tags: ['🪪 Kimlik Kartı', '🧭 Pusula Yönleri', '🇹🇷 Milli Mücadele'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'english',
        name: 'İngilizce',
        icon: '🌍',
        colorTheme: 'theme-english',
        tagline: 'Countries, Routines & Words',
        description: 'Ülkeler, milletler, saatler, rutinler, meslekler ve renkler! 🌍⏰👨‍🍳',
        badge: 'MEB Müfredatı',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'countries', label: '🌍 Countries & Routines' },
          { id: 'colors', label: '🎨 Colors' },
          { id: 'animals', label: '🐾 Animals' },
          { id: 'numbers', label: '🔢 Numbers' },
          { id: 'greetings', label: '👋 Greetings' }
        ],
        games: [
          {
            id: 'english_countries_routines_4',
            active: true,
            title: 'Countries, Routines & Jobs',
            icon: '🌍',
            badge: '35 Soru Sesli',
            featureTag: '🔊 Sesli Pratik',
            description: 'Ülkeler, milletler, saatler, günlük rutinler ve İngilizce meslekler! 🌍⏰',
            tags: ['🌍 Countries & Nationalities', '⏰ Daily Routines & Time', '💼 Jobs & Professions'],
            btnText: 'Düelloyu Başlat',
            topic: 'countries'
          },
          {
            id: 'english_colors',
            active: true,
            title: 'Renkler (Colors Matching)',
            icon: '🎨',
            badge: '🌈 Colors',
            featureTag: '🔊 Sesli Pratik',
            description: 'Red, blue, green gibi renkleri İngilizce dinle ve Türkçe karşılığıyla eşleştir! 🎨',
            tags: ['🎨 Colors', '🖼️ Renk Eşleştirme', '🔊 Doğru Telaffuz'],
            btnText: 'Eşleştirmeyi Başlat',
            topic: 'colors'
          },
          {
            id: 'english_animals',
            active: true,
            title: 'Hayvanlar (Animals Matching)',
            icon: '🐾',
            badge: '🦁 Animals',
            featureTag: '🔊 Sesli Pratik',
            description: 'Cat, dog, lion gibi sevimli dostlarımızın İngilizce telaffuzunu dinle ve doğru eşleştir! 🐾',
            tags: ['🐾 Animals', '🐶 Sevimli Dostlar', '🔊 Doğru Telaffuz'],
            btnText: 'Eşleştirmeyi Başlat',
            topic: 'animals'
          },
          {
            id: 'english_numbers',
            active: true,
            title: 'Sayılar (Numbers Matching)',
            icon: '🔢',
            badge: '🔢 Numbers',
            featureTag: '🔊 Sesli Pratik',
            description: 'One, two, three... İngilizce sayıları dinle ve doğru rakamlarla eşleştir! 🔢',
            tags: ['🔢 Numbers 1-20', '🎯 Hızlı Sayma', '🔊 Doğru Telaffuz'],
            btnText: 'Eşleştirmeyi Başlat',
            topic: 'numbers'
          },
          {
            id: 'english_greetings',
            active: true,
            title: 'Günlük İfadeler (Greetings)',
            icon: '👋',
            badge: '👋 Greetings',
            featureTag: '🔊 Sesli Pratik',
            description: 'Hello, good morning, thank you gibi günlük nezaket ve konuşma ifadeleri! 👋',
            tags: ['👋 Greetings', '☀️ Günaydın & Selam', '🔊 Doğru Telaffuz'],
            btnText: 'Eşleştirmeyi Başlat',
            topic: 'greetings'
          },
          {
            id: 'english',
            active: true,
            title: 'English Word Battle (Karma)',
            icon: '🇬🇧',
            badge: '👑 Şampiyonluk',
            featureTag: '⚡ Hızlı Kelime',
            description: 'Ülkeler, rutinler, meslekler, renkler ve sayılardan karma İngilizce düellosu! 🚀',
            tags: ['🇬🇧 Karma Pratik', '⚡ Çift Dilli Eşleme', '🔊 Otomatik Telaffuz'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'brain',
        name: 'Akıl ve Zeka Oyunları',
        icon: '🧠',
        colorTheme: 'theme-brain',
        tagline: 'Usta Düzey Zeka & Refleks',
        description: '12 sembol dedektifliği, usta Stroop, foto-bellek ve zirve refleks! 👑⚡',
        badge: 'Şampiyonlar Ligi',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'oddone', label: '🕵️ Usta Dedektif' },
          { id: 'stroop', label: '👑 Nöro-Hız' },
          { id: 'memory', label: '🧠 Foto-Bellek' },
          { id: 'reflex', label: '⚡ Zirve Refleks' }
        ],
        games: [
          {
            id: 'oddone',
            active: true,
            title: 'Farklı Olanı Yakala',
            icon: '👀',
            badge: '👑 Usta Dedektif',
            featureTag: '🕵️ Usta Dedektif',
            description: '12 sembol labirentindeki gizli detayı saliseler içinde yakala! 🕵️',
            tags: ['🕵️ Usta Dedektif', '⚡ Saliselik Fark', '🧩 Zorlu Labirent'],
            btnText: 'Düelloyu Başlat',
            topic: 'oddone'
          },
          {
            id: 'stroop',
            active: true,
            title: 'Süper Stroop: Renk Tuzakları',
            icon: '🎯',
            badge: '👑 Nöro-Dikkat',
            featureTag: '👑 Nöro-Hız',
            description: 'Usta seviye Stroop düellosu! Şampiyon refleksle ters köşeyi çöz! 👑',
            tags: ['👑 İleri Stroop', '⚡ Saliselik Karar', '🧠 Zihinsel Çeviklik'],
            btnText: 'Düelloyu Başlat',
            topic: 'stroop'
          },
          {
            id: 'memory',
            active: true,
            title: 'Usta Hafıza: Sırayı Hatırla',
            icon: '🧠',
            badge: '👑 Fotoğrafik Hafıza',
            featureTag: '👑 Fotoğrafik Hafıza',
            description: 'Fotoğrafik hafıza meydan okuması! Sıraları bil, tahtanın kralı ol! 👑',
            tags: ['👑 Fotoğrafik Bellek', '🔍 Sıra Analizi', '⚡ Süper Konsantrasyon'],
            btnText: 'Düelloyu Başlat',
            topic: 'memory'
          },
          {
            id: 'reflex',
            active: true,
            title: 'Şimşek Refleks: Köstebek & Av',
            icon: '⚡',
            badge: '👑 Şimşek Hızı',
            featureTag: '🏆 Zirve Refleks',
            description: 'Tahtanın en hızlısı kim? Saliseler içinde hedefi avla, zaferi kazan! 🏆',
            tags: ['🏆 Zirve Refleks', '⭐ Sıfır Hata', '👑 Tahta Rekoru'],
            btnText: 'Düelloyu Başlat',
            topic: 'reflex'
          },
          {
            id: 'true_false',
            active: true,
            title: 'Doğru mu Yanlış mı? (Refleks)',
            icon: '⚡',
            badge: '✅❌ Hızlı Karar',
            featureTag: '⚡ 2x Hızlı Süre',
            description: 'Dev butonlar, 2 kat hızlı eriyen süre! Doğru mu yoksa yanlış mı? ⚡',
            tags: ['✅ Dev Butonlar', '⚡ 2x Hızlı Süre', '🔥 Anlık Refleks'],
            btnText: 'Düelloyu Başlat',
            topic: 'reflex'
          },
          {
            id: 'matching',
            active: true,
            title: 'Dokun ve Eşleştir (Zihin Çiftleri)',
            icon: '🧩',
            badge: '🧩 Ardışık Dokunma',
            featureTag: '⭐ Kart Eşleştirme',
            description: 'Sol ve sağ sütundaki doğru çiftlere ardışık dokun ve birleştir! 🧩',
            tags: ['🧩 Akıllı Dokunma', '🎯 Hızlı Eşleştir', '✨ Parıltılı Birleşme'],
            btnText: 'Düelloyu Başlat',
            topic: 'reflex'
          }
        ]
      }
    ]
  };

  // -------------------------------------------------------------
  // 1. KADEME: DERS SEÇİM KARTLARINI (GRID) ÜRET
  // -------------------------------------------------------------
  function renderSubjects() {
    if (!DOM.subjectsGrid) return;
    const g = state.currentGrade;
    const subjects = GRADE_SUBJECTS_CONFIG[g] || GRADE_SUBJECTS_CONFIG[1];

    const gradeNames = {
      0: 'Anasınıfı',
      1: '1. Sınıf',
      2: '2. Sınıf',
      3: '3. Sınıf',
      4: '4. Sınıf'
    };
    if (DOM.subjectsGradeTitle) {
      DOM.subjectsGradeTitle.textContent = `${gradeNames[g] || g + '. Sınıf'} Dersleri`;
    }
    if (DOM.subjectsCountBadge) {
      DOM.subjectsCountBadge.textContent = `${subjects.length} Ders Mevcut`;
    }

    DOM.subjectsGrid.innerHTML = subjects.map(subject => {
      const activeGamesCount = subject.games.filter(gm => gm.active).length;
      return `
        <div class="subject-card ${subject.colorTheme} card-sub-${subject.id}" data-subject-id="${subject.id}" role="button" tabindex="0">
          <div class="subject-card-left">
            <div class="subject-icon-wrap">
              <span class="subject-icon">${replaceEmojisWith3D(subject.icon, 'game-3d-big-icon')}</span>
            </div>
          </div>
          <div class="subject-card-right">
            <div class="subject-card-top">
              <span class="subject-badge">${replaceEmojisWith3D(subject.badge, 'chip-3d-icon')}</span>
              <div class="card-top-right-actions">
                <span class="subject-games-count"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg> ${activeGamesCount} Etkinlik Aktif</span>
                <button class="card-share-btn" data-share-title="${escapeHtml(subject.name)}" title="Ödev / Pratik Gönder (WhatsApp)" aria-label="WhatsApp'ta Paylaş"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg></button>
              </div>
            </div>
            <h3 class="subject-title">${subject.name}</h3>
            <span class="subject-tagline">${subject.tagline}</span>
            <p class="subject-desc">${subject.description}</p>
            <div class="subject-card-footer">
              <span class="btn-open-subject">Konuları Aç <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Paylaşım Butonu Dinleyicileri (Kart Tıklamasını Engeller)
    DOM.subjectsGrid.querySelectorAll('.card-share-btn').forEach(btn => {
      addTapListener(btn, (e) => {
        if (e && e.cancelable) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();
        const title = btn.getAttribute('data-share-title') || 'Ders';
        shareActivity(title);
      });
    });

    // Ders Kartlarına Tıklama Dinleyicisi
    DOM.subjectsGrid.querySelectorAll('.subject-card').forEach(card => {
      addTapListener(card, (e) => {
        if (e && e.target && e.target.closest('.card-share-btn')) return;
        const subjectId = card.getAttribute('data-subject-id');
        if (subjectId) {
          selectSubject(subjectId);
        }
      });
    });
  }

  // Ders Seçildiğinde 2. Kademeye (Oyunlar & Konular) Geç
  function selectSubject(subjectId) {
    lockInteractions(400);
    const g = state.currentGrade;
    const subjects = GRADE_SUBJECTS_CONFIG[g] || GRADE_SUBJECTS_CONFIG[1];
    const subject = subjects.find(s => s.id === subjectId) || subjects[0];

    state.currentSection = 'games';
    state.currentSubject = subject.id;
    state.currentCategory = 'all';

    // Analytics: Seçilen dersi raporla
    AnalyticsTracker.trackSubjectSelect(subject.id, subject.name, g);

    // UI Geçişi: Ana sayfa ve dersler gizlenir, oyunlar açılır
    if (DOM.homeShowcaseSection) DOM.homeShowcaseSection.classList.add('hide');
    if (DOM.subjectsSection) DOM.subjectsSection.classList.add('hide');
    if (DOM.gamesSection) {
      DOM.gamesSection.classList.remove('hide');
      DOM.gamesSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Ders Başlığını ve İkonunu Doldur
    if (DOM.currentSubjectIcon) {
      DOM.currentSubjectIcon.innerHTML = replaceEmojisWith3D(subject.icon, 'chip-3d-icon');
    }
    if (DOM.currentSubjectTitle) {
      DOM.currentSubjectTitle.textContent = subject.name;
    }
    if (DOM.currentSubjectGrade) {
      const gradeNames = { 0: 'Anasınıfı', 1: '1. Sınıf', 2: '2. Sınıf', 3: '3. Sınıf', 4: '4. Sınıf' };
      DOM.currentSubjectGrade.textContent = `${gradeNames[g] || g + '. Sınıf'} Konu & Pratik Havuzu`;
    }

    audio.playClick();
    if (subject.id === 'firstreading' && g === 1) {
      if (DOM.subcategorySection) DOM.subcategorySection.classList.add('hide');
      if (DOM.maarifReadingContainer) DOM.maarifReadingContainer.classList.remove('hide');
      renderMaarifReadingPanel();
    } else {
      if (DOM.maarifReadingContainer) DOM.maarifReadingContainer.classList.add('hide');
      if (DOM.subcategorySection) DOM.subcategorySection.classList.remove('hide');
      renderSubcategories();
      renderGameCards();
    }
  }

  // "← Tüm Dersler" Butonuna Basıldığında 1. Kademeye Dönüş
  function returnToSubjectsList() {
    lockInteractions(400);
    state.currentSection = 'subjects';
    state.currentSubject = null;
    state.currentCategory = 'all';

    if (DOM.maarifReadingContainer) DOM.maarifReadingContainer.classList.add('hide');
    if (DOM.homeShowcaseSection) DOM.homeShowcaseSection.classList.add('hide');
    if (DOM.gamesSection) DOM.gamesSection.classList.add('hide');
    if (DOM.subjectsSection) DOM.subjectsSection.classList.remove('hide');

    renderSubjects();
    audio.playClick();
  }

  // Alt Kategori Sekmelerini (Pills/Tabs) Üret
  function renderSubcategories() {
    if (!DOM.subcategoryTabs) return;
    const g = state.currentGrade;
    const subjects = GRADE_SUBJECTS_CONFIG[g] || GRADE_SUBJECTS_CONFIG[1];
    const subject = subjects.find(s => s.id === state.currentSubject) || subjects[0];

    if (!subject) return;

    const topics = subject.topics || [{ id: 'all', label: '🌟 Tümü' }];

    // Aktif kategori bu derste yoksa 'all' yap
    const exists = topics.some(t => t.id === state.currentCategory);
    if (!exists) {
      state.currentCategory = 'all';
    }

    DOM.subcategoryTabs.innerHTML = topics.map(t => `
      <button class="subcat-pill ${t.id === state.currentCategory ? 'active' : ''}" data-cat-id="${t.id}">
        ${replaceEmojisWith3D(t.label, 'chip-3d-icon')}
      </button>
    `).join('');

    // Sekme Tıklama Dinleyicileri
    DOM.subcategoryTabs.querySelectorAll('.subcat-pill').forEach(btn => {
      addTapListener(btn, (e) => {
        const catId = btn.getAttribute('data-cat-id');
        if (state.currentCategory === catId) return;

        state.currentCategory = catId;
        audio.playClick();

        DOM.subcategoryTabs.querySelectorAll('.subcat-pill').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-cat-id') === state.currentCategory);
        });

        renderGameCards();
      });
    });
  }

  // Dinamik Oyun & Konu Kartlarını (Grid) Üret
  function renderGameCards() {
    if (!DOM.gamesGrid) return;
    const g = state.currentGrade;
    const subjects = GRADE_SUBJECTS_CONFIG[g] || GRADE_SUBJECTS_CONFIG[1];
    const subject = subjects.find(s => s.id === state.currentSubject) || subjects[0];

    if (!subject) return;

    const currentCat = state.currentCategory;
    const allGames = subject.games || [];

    // Filtreleme
    const filtered = allGames.filter(game => {
      if (currentCat === 'all') return true;
      return game.topic === currentCat;
    });

    // Sayaç Rozetini Güncelle
    if (DOM.gamesCountBadge) {
      const activeCount = filtered.filter(x => x.active).length;
      DOM.gamesCountBadge.textContent = `${activeCount} Aktif Pratik (${filtered.length} Konu)`;
    }

    // Kart HTML'lerini oluştur
    DOM.gamesGrid.innerHTML = filtered.map(game => {
      if (game.active) {
        return `
          <div class="game-card ${subject.colorTheme || 'theme-math'}" data-game-id="${game.id}">
            <div class="game-top-meta">
              <span class="game-category-tag">${replaceEmojisWith3D(game.badge, 'chip-3d-icon')}</span>
              <div class="card-top-right-actions">
                <span class="game-speed-badge">${replaceEmojisWith3D(game.featureTag, 'chip-3d-icon')}</span>
                <button class="card-share-btn" data-share-title="${escapeHtml(game.title)}" title="Ödev / Pratik Gönder (WhatsApp)" aria-label="WhatsApp'ta Paylaş"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg></button>
              </div>
            </div>
            <div class="game-visual-icon">${replaceEmojisWith3D(game.icon, 'game-3d-big-icon')}</div>
            <h3 class="game-title">${game.title}</h3>
            <p class="game-subtitle">${game.description}</p>
            <div class="game-features-list">
              ${game.tags.map(t => `<span class="feature-pill">${replaceEmojisWith3D(t, 'chip-3d-icon')}</span>`).join('')}
            </div>
            <button class="btn-play-game" data-game-id="${game.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z"/></svg> <span>${state.gameMode === 'solo' ? 'Pratiğe Başla' : game.btnText}</span>
            </button>
          </div>
        `;
      } else {
        // Yakında / Hazırlanıyor Kartı
        return `
          <div class="game-card game-card-upcoming" data-game-id="${game.id}">
            <div class="game-top-meta">
              <span class="game-category-tag tag-upcoming"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> ${game.badge || 'Hazırlanıyor'}</span>
              <span class="game-speed-badge">${replaceEmojisWith3D(game.featureTag, 'chip-3d-icon')}</span>
            </div>
            <div class="game-visual-icon" style="filter: grayscale(0.5); opacity:0.85;">${replaceEmojisWith3D(game.icon, 'game-3d-big-icon')}</div>
            <h3 class="game-title">${game.title}</h3>
            <p class="game-subtitle">${game.description}</p>
            <div class="game-features-list">
              ${game.tags.map(t => `<span class="feature-pill">${replaceEmojisWith3D(t, 'chip-3d-icon')}</span>`).join('')}
            </div>
            <button class="btn-play-game btn-upcoming" disabled>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> <span>Yakında Aktif</span>
            </button>
          </div>
        `;
      }
    }).join('');

    // Paylaşım Butonu Dinleyicileri (Kart Tıklamasını Engeller)
    DOM.gamesGrid.querySelectorAll('.card-share-btn').forEach(btn => {
      addTapListener(btn, (e) => {
        if (e && e.cancelable) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();
        const title = btn.getAttribute('data-share-title') || 'Oyun';
        shareActivity(title);
      });
    });

    // Aktif kartlara tıklama dinleyicisi (Hem kart gövdesi hem de "Pratiğe Başla / Düelloyu Başlat" butonu)
    DOM.gamesGrid.querySelectorAll('.game-card:not(.game-card-upcoming)').forEach(card => {
      addTapListener(card, (e) => {
        if (e && e.target && e.target.closest('.card-share-btn')) return;
        const gameId = card.getAttribute('data-game-id');
        if (gameId) {
          audio.playClick();
          startDuel(gameId);
        }
      });
    });
  }

  /* ==========================================================================
     TÜRKİYE YÜZYILI MAARİF MODELİ (2026) İLK OKUMA YAZMA PANELİ
     ========================================================================== */

  function renderMaarifReadingPanel() {
    if (!DOM.maarifGroupsNav) return;
    const groups = MAARIF_2026_CONFIG.groups;
    const isGen = !!state.isMaarifGeneral;

    // 1. Üst 5 Ses Grubu + Genel / Karma Pratik Sekmeleri
    let navHtml = groups.map(grp => {
      const isActive = (!isGen && state.maarifGroup === grp.id);
      return `
        <button class="maarif-group-tab ${isActive ? 'active' : ''}" data-group-id="${grp.id}" type="button">
          <span>${grp.name} (${grp.code})</span>
        </button>
      `;
    }).join('');

    navHtml += `
      <button class="maarif-group-tab tab-general ${isGen ? 'active' : ''}" data-group-id="general" type="button">
        <span>🎈 Genel / Karma Pratik</span>
      </button>
    `;

    DOM.maarifGroupsNav.innerHTML = navHtml;

    // Sekme tıklama dinleyicileri
    DOM.maarifGroupsNav.querySelectorAll('.maarif-group-tab').forEach(btn => {
      addTapListener(btn, (e) => {
        const gid = btn.getAttribute('data-group-id');
        audio.playClick();
        if (gid === 'general') {
          state.isMaarifGeneral = true;
          renderMaarifReadingPanel();
        } else {
          state.isMaarifGeneral = false;
          selectMaarifGroup(gid);
        }
      });
    });

    // 2. Karma Pratik Modu ise: Harf rayı ve rozeti gizle, alt kategori sekmesini ve standart ilk okuma oyunlarını göster
    if (state.isMaarifGeneral) {
      if (DOM.maarifLettersRail) DOM.maarifLettersRail.classList.add('hide');
      if (DOM.maarifCumulativeBadge) DOM.maarifCumulativeBadge.classList.add('hide');
      if (DOM.subcategorySection) DOM.subcategorySection.classList.remove('hide');
      renderSubcategories();
      renderGameCards();
      return;
    }

    // 3. Maarif Ses Grubu Modu: Harf rayını ve kümülatif rozeti göster, subcategory'yi gizle
    if (DOM.subcategorySection) DOM.subcategorySection.classList.add('hide');
    if (DOM.maarifLettersRail) DOM.maarifLettersRail.classList.remove('hide');
    if (DOM.maarifCumulativeBadge) DOM.maarifCumulativeBadge.classList.remove('hide');

    const activeGrp = MAARIF_2026_CONFIG.groups.find(g => g.id === state.maarifGroup) || MAARIF_2026_CONFIG.groups[0];
    if (!activeGrp.letters.includes(state.activeMaarifLetter)) {
      state.activeMaarifLetter = activeGrp.letters[0];
    }

    // 4. 3D Harf Kartları Rayı
    if (DOM.maarifLettersRail) {
      DOM.maarifLettersRail.innerHTML = activeGrp.letters.map(letter => {
        const upper = letter.toUpperCase('tr-TR');
        const lower = letter;
        const isLetterActive = (letter === state.activeMaarifLetter);
        const orderNum = MAARIF_2026_CONFIG.letterOrder.indexOf(lower) + 1;
        return `
          <button class="maarif-letter-chip ${isLetterActive ? 'active' : ''}" data-letter="${lower}" type="button" aria-label="${upper} ${lower} harfi">
            <span class="letter-main-text">[ ${upper} ${lower} ]</span>
            <span class="letter-sub-order">${orderNum}. Ses</span>
          </button>
        `;
      }).join('');

      DOM.maarifLettersRail.querySelectorAll('.maarif-letter-chip').forEach(chip => {
        addTapListener(chip, (e) => {
          const letter = chip.getAttribute('data-letter');
          if (state.activeMaarifLetter === letter) return;
          audio.playClick();
          selectMaarifLetter(letter);
        });
      });
    }

    // 5. Kümülatif Rozeti Güncelle
    updateMaarifCumulativeBadge();

    // 6. Bu harfe ve o ana kadarki kümülatif seslere özel oyun kartlarını üret
    renderMaarifGameCards();
  }

  function selectMaarifGroup(groupId) {
    state.maarifGroup = groupId;
    const grp = MAARIF_2026_CONFIG.groups.find(g => g.id === groupId) || MAARIF_2026_CONFIG.groups[0];
    if (!grp.letters.includes(state.activeMaarifLetter)) {
      state.activeMaarifLetter = grp.letters[0];
    }
    renderMaarifReadingPanel();
  }

  function selectMaarifLetter(letter) {
    state.activeMaarifLetter = letter.toLowerCase();
    if (DOM.maarifLettersRail) {
      DOM.maarifLettersRail.querySelectorAll('.maarif-letter-chip').forEach(chip => {
        chip.classList.toggle('active', chip.getAttribute('data-letter') === state.activeMaarifLetter);
      });
    }
    updateMaarifCumulativeBadge();
    renderMaarifGameCards();
  }

  function updateMaarifCumulativeBadge() {
    if (!DOM.maarifCumulativeBadge) return;
    const activeL = (state.activeMaarifLetter || 'a').toLowerCase();
    const activeUpper = activeL.toUpperCase('tr-TR');
    const learned = getLearnedLettersUpTo(activeL);
    const upperLearned = learned.map(l => l.toUpperCase('tr-TR'));

    DOM.maarifCumulativeBadge.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; width:100%;">
        <span style="display:inline-flex; align-items:center; color:#0284C7;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg></span>
        <span style="font-weight:900; color:#0369A1;">Seçili Ses: [ ${activeUpper} ${activeL} ]</span>
        <span style="color:#CBD5E1;">|</span>
        <span style="font-weight:800; color:#334155;">Kümülatif Ses Havuzu (${upperLearned.length} Ses):</span>
        <div class="cumulative-sound-chips">
          ${upperLearned.map(l => `<span class="snd-chip ${l === activeUpper ? 'active-chip' : ''}">${l}</span>`).join('')}
        </div>
      </div>
    `;
  }

  function renderMaarifGameCards() {
    if (!DOM.gamesGrid) return;
    const activeL = (state.activeMaarifLetter || 'a').toLowerCase();
    const letterUpper = activeL.toUpperCase('tr-TR');
    const letterLower = activeL;
    const learned = getLearnedLettersUpTo(activeL);
    const learnedStr = learned.map(l => l.toUpperCase('tr-TR')).join(', ');
    const letterIdx = MAARIF_2026_CONFIG.letterOrder.indexOf(activeL);

    const isSyllableUnlocked = true; // 1. Sınıf 1. Grup "A" sesi ve tüm harflerde açık
    const isSentenceUnlocked = true; // 1. Sınıf 1. Grup "A" sesi ve tüm harflerde açık

    const games = [
      {
        id: 'maarif_sound_find',
        title: 'Sesi Hisset / Balon Patlatma',
        icon: '🎈',
        badge: '👂 İşitsel & Görsel Algı',
        featureTag: '⚡ Hızlı Yakala',
        description: `Görseller arasından içinde "${letterUpper}" sesi geçen nesneleri ve sözcükleri yakala! 🎯`,
        tags: [`🔤 "${letterUpper}" Sesi`, '👂 Kulaktan Tanıma', '⭐ Görsel Algı'],
        active: true
      },
      {
        id: 'maarif_position',
        title: 'Başta mı, Ortada mı, Sonda mı?',
        icon: '🔍',
        badge: '📍 Ses Konumu',
        featureTag: '🎯 3 Seçenek',
        description: `Sözcüğün adını dinle; "${letterUpper}" sesi nerede (Başta, Ortada, Sonda) hemen bul! 🟢🟡🔴`,
        tags: ['🟢 Başta', '🟡 Ortada', '🔴 Sonda'],
        active: true
      },
      {
        id: 'maarif_case_match',
        title: `Büyük-Küçük Harf Eşleştirme (${letterUpper}-${letterLower})`,
        icon: '🅰️',
        badge: '🔤 Harf Avı',
        featureTag: '⚡ Hızlı Eşleştir',
        description: `"${letterUpper}" büyük ve "${letterLower}" küçük harfini diğer harflerin arasından hızla ayırt et! ✨`,
        tags: [`🅰️ Büyük "${letterUpper}"`, `🔤 Küçük "${letterLower}"`, '🎯 Harf Refleksi'],
        active: true
      },
      {
        id: 'maarif_syllable_build',
        title: 'Hece Birleştirme Atölyesi',
        icon: '🧱',
        badge: '🧱 Kümülatif Birleştirme',
        featureTag: '🧩 Renkli Küpler',
        description: letterIdx === 0
          ? `Küp parçalarına dokunarak büyük ve küçük "A - a" seslerini oluştur ve birleştir! 🧱`
          : `Sadece öğrenilen (${learnedStr}) ses küplerine dokunarak anlamlı kelimeler inşa et! 🏗️`,
        tags: letterIdx === 0
          ? ['🧱 Küp Birleştir', '🔤 "A - a" Ses İnşası', '🔊 Sesli Okuma']
          : ['🧱 Küp Birleştir', '📖 Kümülatif Hece', '🔊 Sesli Okuma'],
        active: true
      },
      {
        id: 'maarif_speed_read',
        title: 'Kelime Oluşturma ve Yakalama',
        icon: '⚡',
        badge: '🚀 Ritimli Okuma',
        featureTag: '⚡ Sesli Refleks',
        description: letterIdx === 0
          ? `Duyduğun "A" sesini dinle ve doğru kartı hızla yakala! 📖⭐`
          : `Öğrenilen (${learnedStr}) sesleriyle kurulan kelimeyi dinle ve doğru kartı hızla yakala! 📖⭐`,
        tags: ['🔊 Edge-TTS Sesli Okuma', '📖 Hızlı Okuma', '⭐ Ritimli Pratik'],
        active: true
      },
      {
        id: 'maarif_sentence_complete',
        title: 'Cümle Kurma ve Tamamlama',
        icon: '📚',
        badge: '📖 Anlamlı Cümle',
        featureTag: '🧩 Boşluk Doldur',
        description: letterIdx === 0
          ? `Eğlenceli tekerlemedeki eksik "A" sesini yerine koy ve tamamla! 📝`
          : `Öğrenilen kelimelerle oluşturulan kısa cümlelerdeki eksik kelimeyi yerine koy ve cümleyi tamamla! 📝`,
        tags: ['📖 Kısa Cümle', '💡 Anlam Bütünlüğü', '🎯 Boşluk Tamamla'],
        active: true
      }
    ];

    const activeCount = games.filter(g => g.active).length;
    if (DOM.gamesCountBadge) {
      DOM.gamesCountBadge.textContent = `${activeCount} Aktif Oyun ([${letterUpper} ${letterLower}] Harfi)`;
    }

    DOM.gamesGrid.innerHTML = games.map(game => {
      if (game.active) {
        return `
          <div class="game-card theme-firstreading" data-game-id="${game.id}">
            <div class="game-top-meta">
              <span class="game-category-tag">${replaceEmojisWith3D(game.badge, 'chip-3d-icon')}</span>
              <div class="card-top-right-actions">
                <span class="game-speed-badge">${replaceEmojisWith3D(game.featureTag, 'chip-3d-icon')}</span>
                <button class="card-share-btn" data-share-title="${escapeHtml(game.title)}" title="Ödev / Pratik Gönder (WhatsApp)" aria-label="WhatsApp'ta Paylaş"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg></button>
              </div>
            </div>
            <div class="game-visual-icon">${replaceEmojisWith3D(game.icon, 'game-3d-big-icon')}</div>
            <h3 class="game-title">${game.title}</h3>
            <p class="game-subtitle">${game.description}</p>
            <div class="game-features-list">
              ${game.tags.map(t => `<span class="feature-pill">${replaceEmojisWith3D(t, 'chip-3d-icon')}</span>`).join('')}
            </div>
            <button class="btn-play-game" data-game-id="${game.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z"/></svg> <span>${state.gameMode === 'solo' ? 'Pratiğe Başla' : 'Düelloyu Başlat'}</span>
            </button>
          </div>
        `;
      } else {
        return `
          <div class="game-card game-card-upcoming" data-game-id="${game.id}">
            <div class="game-top-meta">
              <span class="game-category-tag tag-upcoming">${game.lockedNotice || '🔒 Hazırlanıyor'}</span>
              <span class="game-speed-badge">${replaceEmojisWith3D(game.featureTag, 'chip-3d-icon')}</span>
            </div>
            <div class="game-visual-icon" style="filter: grayscale(0.5); opacity:0.85;">${replaceEmojisWith3D(game.icon, 'game-3d-big-icon')}</div>
            <h3 class="game-title">${game.title}</h3>
            <p class="game-subtitle">${game.description}</p>
            <div class="game-features-list">
              ${game.tags.map(t => `<span class="feature-pill">${replaceEmojisWith3D(t, 'chip-3d-icon')}</span>`).join('')}
            </div>
            <button class="btn-play-game btn-upcoming" disabled>
              ${game.lockedNotice || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> <span>Yakında Aktif</span>'}
            </button>
          </div>
        `;
      }
    }).join('');

    // Paylaşım butonu dinleyicileri
    DOM.gamesGrid.querySelectorAll('.card-share-btn').forEach(btn => {
      addTapListener(btn, (e) => {
        if (e && e.cancelable) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();
        const title = btn.getAttribute('data-share-title') || 'Oyun';
        shareActivity(title);
      });
    });

    // Aktif kartlara tıklama dinleyicisi
    DOM.gamesGrid.querySelectorAll('.game-card:not(.game-card-upcoming)').forEach(card => {
      addTapListener(card, (e) => {
        if (e && e.target && e.target.closest('.card-share-btn')) return;
        const gameId = card.getAttribute('data-game-id');
        if (gameId) {
          audio.playClick();
          startDuel(gameId);
        }
      });
    });
  }

  // Oyun Modu Değiştirme (İki Kişilik Düello & Tek Kişilik Pratik)
  function setGameMode(mode) {
    if (state.gameMode === mode) return;
    state.gameMode = mode;
    StorageManager.saveSettings();
    audio.playClick();
    updateGameModeUI();
    if (state.currentSubject === 'firstreading' && state.currentGrade === 1 && !state.isMaarifGeneral) {
      renderMaarifGameCards();
    } else {
      renderGameCards();
    }
  }

  function updateGameModeUI() {
    const isSolo = (state.gameMode === 'solo');

    if (DOM.btnModeDuel) DOM.btnModeDuel.classList.toggle('active', !isSolo);
    if (DOM.btnModeSolo) DOM.btnModeSolo.classList.toggle('active', isSolo);

    if (DOM.btnDesktopGameMode) {
      DOM.btnDesktopGameMode.classList.toggle('is-solo', isSolo);
    }
    if (DOM.desktopModeIcon) {
      DOM.desktopModeIcon.innerHTML = isSolo ? '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>' : '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>';
    }
    if (DOM.desktopModeText) {
      DOM.desktopModeText.textContent = isSolo ? 'Pratik Modu' : 'Düello Modu';
    }
    if (DOM.btnSettingsModeToggle) {
      DOM.btnSettingsModeToggle.textContent = isSolo ? 'Mod: Pratik' : 'Mod: Düello';
      DOM.btnSettingsModeToggle.classList.toggle('is-off', isSolo);
    }

    if (isSolo) {
      if (DOM.vsCircle) DOM.vsCircle.style.display = 'none';
      if (DOM.contestantTagP2) DOM.contestantTagP2.style.display = 'none';
      if (DOM.teamBadgeP1) DOM.teamBadgeP1.textContent = 'ÖĞRENCİ';
      if (DOM.quickDrawBtnText) DOM.quickDrawBtnText.textContent = 'Öğrenciyi Değiştir';
      if (DOM.duelP1TeamTitle) DOM.duelP1TeamTitle.textContent = 'BİREYSEL PRATİK';
      if (DOM.duelP1Avatar) DOM.duelP1Avatar.textContent = '🎓';
      if (DOM.p1LockoutDesc) DOM.p1LockoutDesc.textContent = '1.5 saniye kilitlendin! Tekrar dene...';
    } else {
      if (DOM.vsCircle) DOM.vsCircle.style.display = '';
      if (DOM.contestantTagP2) DOM.contestantTagP2.style.display = '';
      if (DOM.teamBadgeP1) DOM.teamBadgeP1.textContent = 'MAVİ TAKIM';
      if (DOM.quickDrawBtnText) DOM.quickDrawBtnText.textContent = 'Öğrencileri Değiştir';
      if (DOM.duelP1TeamTitle) DOM.duelP1TeamTitle.textContent = 'MAVİ TAKIM';
      if (DOM.duelP1Avatar) DOM.duelP1Avatar.textContent = '👦';
      if (DOM.p1LockoutDesc) DOM.p1LockoutDesc.textContent = '1.5 saniye kilitlendin! Sıra rakipte...';
    }
  }

  /**
   * Ana Sayfa (Karşılama Vitrini) Ekranını Açar
   */
  function openHomePage() {
    lockInteractions(400);
    state.currentSection = 'home';
    state.currentSubject = null;
    state.currentCategory = 'all';

    // Sol panelde "🏠 Ana Sayfa" aktif, sınıflar pasif
    if (DOM.btnNavHome) DOM.btnNavHome.classList.add('active');
    DOM.gradeChips.forEach(chip => chip.classList.remove('active'));
    DOM.gradeCards.forEach(card => card.classList.remove('active'));

    // Bölümleri yönet: Ana Sayfa Vitrini açık, diğerleri gizli
    if (DOM.maarifReadingContainer) DOM.maarifReadingContainer.classList.add('hide');
    if (DOM.homeShowcaseSection) DOM.homeShowcaseSection.classList.remove('hide');
    if (DOM.subjectsSection) DOM.subjectsSection.classList.add('hide');
    if (DOM.gamesSection) DOM.gamesSection.classList.add('hide');

    // Moli lobi ifadesi
    changeMoliExpression('lobby');
  }

  function setGrade(gradeNumber) {
    lockInteractions(400);
    state.currentGrade = parseInt(gradeNumber, 10);
    state.currentSubject = null;
    state.currentCategory = 'all';
    state.currentSection = 'subjects';
    audio.playClick();

    // Analytics: Sınıf seviyesi seçimini raporla
    const gradeLabels = { 0: 'Anasınıfı', 1: '1. Sınıf', 2: '2. Sınıf', 3: '3. Sınıf', 4: '4. Sınıf' };
    AnalyticsTracker.trackClassSelect(state.currentGrade, gradeLabels[state.currentGrade]);

    // Sol panelde "🏠 Ana Sayfa" butonunun aktifliğini kaldır
    if (DOM.btnNavHome) DOM.btnNavHome.classList.remove('active');

    // Çip butonları güncelle (Sidebar / Header)
    DOM.gradeChips.forEach(chip => {
      const g = parseInt(chip.getAttribute('data-grade'), 10);
      chip.classList.toggle('active', g === state.currentGrade);
    });

    // Lobi kartlarını güncelle (varsa)
    DOM.gradeCards.forEach(card => {
      const g = parseInt(card.getAttribute('data-grade'), 10);
      card.classList.toggle('active', g === state.currentGrade);
    });

    // Ana Sayfa Vitrini gizle, 1. Kademeyi (Dersler Listesi) göster
    if (DOM.maarifReadingContainer) DOM.maarifReadingContainer.classList.add('hide');
    if (DOM.homeShowcaseSection) DOM.homeShowcaseSection.classList.add('hide');
    if (DOM.gamesSection) DOM.gamesSection.classList.add('hide');
    if (DOM.subjectsSection) DOM.subjectsSection.classList.remove('hide');

    renderSubjects();
  }

  /* ==========================================================================
     10. FREEMIUM MODEL & ÖĞRETMEN OTURUMU
     ========================================================================== */
  function updateTeacherAuthUI() {
    const mobileLoginBtn = document.getElementById('btnMobileLogin');
    const mobileNoticeBanner = document.getElementById('btnMobileNoticeBanner');
    const desktopLoginText = document.getElementById('desktopLoginText');
    const desktopNoticeBanner = document.getElementById('desktopNoticeBanner');
    const btnDesktopLogin = document.getElementById('btnDesktopLogin');

    if (state.teacherSession.isLoggedIn) {
      DOM.btnTeacherAuth.classList.add('logged-in');
      DOM.authBtnText.textContent = state.teacherSession.name || 'Öğretmenim';
      DOM.authIcon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>';
      if (mobileLoginBtn) {
        mobileLoginBtn.classList.add('logged-in');
        mobileLoginBtn.innerHTML = '<span>🎓 ' + (state.teacherSession.name || 'Öğretmen') + '</span>';
      }
      if (mobileNoticeBanner) {
        mobileNoticeBanner.style.display = 'none';
      }
      if (desktopLoginText) {
        desktopLoginText.textContent = state.teacherSession.name || 'Öğretmenim';
      }
      if (btnDesktopLogin) {
        btnDesktopLogin.classList.add('logged-in');
      }
      if (desktopNoticeBanner) {
        desktopNoticeBanner.style.display = 'none';
      }
    } else {
      DOM.btnTeacherAuth.classList.remove('logged-in');
      DOM.authBtnText.textContent = 'Öğretmen Girişi';
      DOM.authIcon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
      if (mobileLoginBtn) {
        mobileLoginBtn.classList.remove('logged-in');
        mobileLoginBtn.innerHTML = '<span class="btn-icon">👤</span> Giriş Yap';
      }
      if (mobileNoticeBanner) {
        mobileNoticeBanner.style.display = '';
      }
      if (desktopLoginText) {
        desktopLoginText.textContent = 'Öğretmen Girişi';
      }
      if (btnDesktopLogin) {
        btnDesktopLogin.classList.remove('logged-in');
      }
      if (desktopNoticeBanner) {
        desktopNoticeBanner.style.display = '';
      }
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
     11. SINIF LİSTESİ VE ÇARKIFELEK KURA SİSTEMİ (PERMANENT CLASSROOM TOOL)
     ========================================================================== */
  function openPickerModal() {
    // Öğretmen giriş bariyeri kaldırıldı - Akıllı tahtada herkes doğrudan kullanabilir
    if (DOM.rosterCount) DOM.rosterCount.textContent = state.classRoster.length;
    if (DOM.rosterCountBadge) DOM.rosterCountBadge.textContent = state.classRoster.length;
    if (DOM.rosterTextarea) DOM.rosterTextarea.value = state.classRoster.join('\n');
    
    // Varsayılan görünüm ve durumları hazırla
    switchPickerView('stage');
    setPickerMode(state.pickerMode || 'single');
    renderTodaySelectedUI();
    updatePickerPoolStatus();
    
    // Moli selamlama
    if (DOM.pickerMoliBubble) {
      DOM.pickerMoliBubble.textContent = 'Kura çekmeye hazır mısın? 🎲';
    }
    
    openModal(DOM.modalPicker);
  }

  function setPickerMode(mode) {
    state.pickerMode = mode;
    if (DOM.btnPickerModeSingle) DOM.btnPickerModeSingle.classList.toggle('active', mode === 'single');
    if (DOM.btnPickerModeDuel) DOM.btnPickerModeDuel.classList.toggle('active', mode === 'duel');

    if (mode === 'single') {
      if (DOM.pickerSingleStage) DOM.pickerSingleStage.classList.remove('hide');
      if (DOM.pickerDuelStage) DOM.pickerDuelStage.classList.add('hide');
      if (DOM.btnSpinWheelText) DOM.btnSpinWheelText.textContent = 'Kura Çek & 1 Öğrenci Belirle!';
      if (DOM.btnApplySelectedStudents) DOM.btnApplySelectedStudents.classList.add('hide');
    } else {
      if (DOM.pickerSingleStage) DOM.pickerSingleStage.classList.add('hide');
      if (DOM.pickerDuelStage) DOM.pickerDuelStage.classList.remove('hide');
      if (DOM.btnSpinWheelText) DOM.btnSpinWheelText.textContent = 'Kura Çek & 2 Yarışmacı Belirle!';
    }
    updatePickerPoolStatus();
  }

  function switchPickerView(view) {
    if (view === 'roster') {
      if (DOM.pickerStageSection) DOM.pickerStageSection.classList.add('hide');
      if (DOM.pickerRosterSection) DOM.pickerRosterSection.classList.remove('hide');
      if (DOM.btnPickerTabRoster) DOM.btnPickerTabRoster.classList.add('active');
      if (DOM.btnPickerModeSingle) DOM.btnPickerModeSingle.classList.remove('active');
      if (DOM.btnPickerModeDuel) DOM.btnPickerModeDuel.classList.remove('active');
      if (DOM.rosterTextarea) DOM.rosterTextarea.value = state.classRoster.join('\n');
    } else {
      if (DOM.pickerStageSection) DOM.pickerStageSection.classList.remove('hide');
      if (DOM.pickerRosterSection) DOM.pickerRosterSection.classList.add('hide');
      if (DOM.btnPickerTabRoster) DOM.btnPickerTabRoster.classList.remove('active');
      setPickerMode(state.pickerMode || 'single');
    }
  }

  function updatePickerPoolStatus() {
    const total = state.classRoster.length;
    const excludedCount = state.excludeTodaySelected
      ? state.todaySelectedStudents.filter(n => state.classRoster.includes(n)).length
      : 0;
    const remaining = Math.max(0, total - excludedCount);
    if (DOM.poolStatusBadge) {
      DOM.poolStatusBadge.textContent = `Havuzda Kalan: ${remaining} / ${total}`;
    }
  }

  function renderTodaySelectedUI() {
    if (!DOM.todayChipsList) return;
    if (DOM.todayCount) DOM.todayCount.textContent = state.todaySelectedStudents.length;

    if (state.todaySelectedStudents.length === 0) {
      DOM.todayChipsList.innerHTML = '<span class="empty-chips-hint">Henüz öğrenci seçilmedi</span>';
    } else {
      DOM.todayChipsList.innerHTML = state.todaySelectedStudents.map(name => `
        <span class="today-chip">
          ${escapeHtml(name)}
          <button class="today-chip-remove" data-remove-today="${escapeHtml(name)}" title="Havuza geri döndür">✕</button>
        </span>
      `).join('');

      DOM.todayChipsList.querySelectorAll('[data-remove-today]').forEach(btn => {
        addTapListener(btn, (e) => {
          const name = btn.getAttribute('data-remove-today');
          removeStudentFromToday(name);
        });
      });
    }
    updatePickerPoolStatus();
  }

  function removeStudentFromToday(name) {
    state.todaySelectedStudents = state.todaySelectedStudents.filter(s => s !== name);
    StorageManager.saveTodaySelected();
    renderTodaySelectedUI();
    audio.playClick();
    showToast(`↩️ ${name} kura havuzuna geri alındı.`);
  }

  function resetTodaySelected() {
    if (state.todaySelectedStudents.length === 0) {
      showToast('Bugün seçilenler listesi zaten boş.');
      return;
    }
    state.todaySelectedStudents = [];
    StorageManager.saveTodaySelected();
    renderTodaySelectedUI();
    audio.playClick();
    showToast('🔄 Bugün seçilenler sıfırlandı, tüm sınıf kura havuzunda!');
  }

  let spinTimer = null;
  let activeDrumroll = null;

  function spinStudentWheel() {
    if (state.classRoster.length < 1) {
      showToast('⚠️ Sınıf listesinde öğrenci bulunmuyor! Lütfen liste ekleyin.');
      return;
    }
    if (state.pickerMode === 'duel' && state.classRoster.length < 2) {
      showToast('⚠️ Düello kurası için listede en az 2 öğrenci olmalıdır!');
      return;
    }

    // Aday havuzunu hesapla
    let pool = state.classRoster.slice();
    if (state.excludeTodaySelected && state.todaySelectedStudents.length > 0) {
      const filtered = pool.filter(n => !state.todaySelectedStudents.includes(n));
      const minRequired = (state.pickerMode === 'duel') ? 2 : 1;
      if (filtered.length >= minRequired) {
        pool = filtered;
      } else {
        showToast('ℹ️ Sınıftaki tüm öğrenciler kuradan geçti! Havuz otomatik olarak yenilendi.');
        state.todaySelectedStudents = [];
        StorageManager.saveTodaySelected();
        renderTodaySelectedUI();
        pool = state.classRoster.slice();
      }
    }

    // UI'ı kura çekim moduna al
    DOM.btnSpinWheel.disabled = true;
    if (DOM.pickerResultActions) DOM.pickerResultActions.classList.add('hide');

    if (state.pickerMode === 'single') {
      DOM.singleSlotCard.classList.remove('winner-celebrate');
      DOM.singleSlotCard.classList.add('spinning');
      DOM.singleSlotSub.textContent = 'Kura çekiliyor...';
    } else {
      DOM.slotCardBlue.classList.remove('winner-celebrate');
      DOM.slotCardBlue.classList.add('spinning');
      DOM.slotCardRed.classList.remove('winner-celebrate');
      DOM.slotCardRed.classList.add('spinning');
    }

    // Moli tepkisi
    if (DOM.pickerMoliBubble) {
      DOM.pickerMoliBubble.textContent = 'Kura çekiliyor, nefesler tutuldu! 🥁';
    }
    changeMoliExpression('thinking');

    // Heyecanlı Davul Ritmi (Drumroll) Başlat
    if (activeDrumroll) activeDrumroll.stop();
    activeDrumroll = audio.playDrumroll(3400);

    // Animasyon Parametreleri (3.3 - 3.5 saniye süren hızlanıp yavaşlayan kura çarkı)
    let stepCount = 0;
    const totalSteps = 34;
    let stepDelay = 45;

    function step() {
      // Rastgele geçici isimleri göster
      if (state.pickerMode === 'single') {
        const rand = pool[Math.floor(Math.random() * pool.length)];
        DOM.singleSlotName.textContent = rand;
      } else {
        const r1 = pool[Math.floor(Math.random() * pool.length)];
        let r2 = pool[Math.floor(Math.random() * pool.length)];
        while (r2 === r1 && pool.length > 1) {
          r2 = pool[Math.floor(Math.random() * pool.length)];
        }
        DOM.slotName1.textContent = r1;
        DOM.slotName2.textContent = r2;
      }

      audio.playTick();
      stepCount++;

      if (stepCount < totalSteps) {
        // Son saniyede çarkın yavaşlama eğrisi (Deceleration)
        if (stepCount > 20) {
          stepDelay += Math.floor((stepCount - 20) * 12);
        }
        spinTimer = setTimeout(step, stepDelay);
      } else {
        // KURA TAMAMLANDI - BÜYÜK FİNAL
        if (activeDrumroll) {
          activeDrumroll.stop();
          activeDrumroll = null;
        }

        DOM.btnSpinWheel.disabled = false;

        // Zafer Zili, Melodi ve Konfeti
        audio.playCymbalTada();
        audio.playVictory();
        confetti.burst(window.innerWidth / 2, window.innerHeight * 0.45, 45);

        if (state.pickerMode === 'single') {
          // Nihai Kazananı Kesin Seç
          const winner = pool[Math.floor(Math.random() * pool.length)];
          state.lastPickedStudent = winner;

          DOM.singleSlotCard.classList.remove('spinning');
          DOM.singleSlotCard.classList.add('winner-celebrate');
          DOM.singleSlotName.textContent = winner;
          DOM.singleSlotSub.textContent = '🌟 Günün şanslı öğrencisi!';

          // Moli Coşkulu Kutlama ve Sesli Okuma (Google TTS & Web Speech)
          const singleCheers = [
            `Sahne senin, ${winner}!`,
            `Sıra sende, ${winner}!`,
            `Tebrikler ${winner}, sahne senin!`,
            `Günün şanslısı ${winner}! Bol şans!`
          ];
          const cheerText = singleCheers[Math.floor(Math.random() * singleCheers.length)];
          if (DOM.pickerMoliBubble) DOM.pickerMoliBubble.textContent = cheerText;
          changeMoliExpression('victory');
          if (state.soundEnabled) {
            audio.speakTurkishText(cheerText);
          }

          // Anti-Repeat havuzuna otomatik ekle
          if (state.excludeTodaySelected && !state.todaySelectedStudents.includes(winner)) {
            state.todaySelectedStudents.push(winner);
            StorageManager.saveTodaySelected();
            renderTodaySelectedUI();
          }

          showToast(`🎯 Seçilen Öğrenci: ${winner}`);
        } else {
          // 2 Öğrenci Düello Seçimi
          const w1 = pool[Math.floor(Math.random() * pool.length)];
          let w2 = pool[Math.floor(Math.random() * pool.length)];
          while (w2 === w1 && pool.length > 1) {
            w2 = pool[Math.floor(Math.random() * pool.length)];
          }

          state.player1.name = w1;
          state.player2.name = w2;
          state.lastPickedStudent = `${w1} ve ${w2}`;

          DOM.slotCardBlue.classList.remove('spinning');
          DOM.slotCardBlue.classList.add('winner-celebrate');
          DOM.slotCardRed.classList.remove('spinning');
          DOM.slotCardRed.classList.add('winner-celebrate');

          DOM.slotName1.textContent = w1;
          DOM.slotName2.textContent = w2;

          const duelCheer = `${w1} ve ${w2}, sahne sizin!`;
          if (DOM.pickerMoliBubble) DOM.pickerMoliBubble.textContent = duelCheer;
          changeMoliExpression('victory');
          if (state.soundEnabled) {
            audio.speakTurkishText(duelCheer);
          }

          if (state.excludeTodaySelected) {
            if (!state.todaySelectedStudents.includes(w1)) state.todaySelectedStudents.push(w1);
            if (!state.todaySelectedStudents.includes(w2)) state.todaySelectedStudents.push(w2);
            StorageManager.saveTodaySelected();
            renderTodaySelectedUI();
          }

          if (DOM.btnApplySelectedStudents) DOM.btnApplySelectedStudents.classList.remove('hide');
          showToast(`⚔️ Düello Yarışmacıları: ${w1} vs ${w2}`);
        }

        if (DOM.pickerResultActions) DOM.pickerResultActions.classList.remove('hide');
      }
    }

    step();
  }

  function speakCurrentWinnerName() {
    if (!state.lastPickedStudent) return;
    const cheer = `Sahne senin, ${state.lastPickedStudent}!`;
    if (DOM.pickerMoliBubble) DOM.pickerMoliBubble.textContent = cheer;
    audio.speakTurkishText(cheer);
  }

  function addCurrentWinnerToToday() {
    if (!state.lastPickedStudent) return;
    if (state.pickerMode === 'single') {
      if (!state.todaySelectedStudents.includes(state.lastPickedStudent)) {
        state.todaySelectedStudents.push(state.lastPickedStudent);
        StorageManager.saveTodaySelected();
        renderTodaySelectedUI();
        audio.playClick();
        showToast(`⭐ ${state.lastPickedStudent} 'Bugün Seçilenler'e eklendi.`);
      } else {
        showToast(`${state.lastPickedStudent} zaten listede.`);
      }
    }
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
    if (DOM.lobbyP1Name) DOM.lobbyP1Name.textContent = state.player1.name;
    if (DOM.lobbyP2Name) DOM.lobbyP2Name.textContent = state.player2.name;
    if (DOM.duelP1Name) DOM.duelP1Name.textContent = state.player1.name;
    if (DOM.duelP2Name) DOM.duelP2Name.textContent = state.player2.name;
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
    if (DOM.rosterCount) DOM.rosterCount.textContent = lines.length;
    if (DOM.rosterCountBadge) DOM.rosterCountBadge.textContent = lines.length;
    updatePickerPoolStatus();
    audio.playClick();
    showToast(`✅ Sınıf listesi kalıcı hafızaya kaydedildi (${lines.length} Öğrenci)`);
    switchPickerView('stage');
  }

  function clearClassRoster() {
    if (confirm('Sınıf listesindeki tüm isimleri silmek istiyor musunuz?')) {
      DOM.rosterTextarea.value = '';
      DOM.rosterTextarea.focus();
      audio.playClick();
    }
  }

  function resetDefaultRoster() {
    if (confirm('Varsayılan 24 kişilik örnek MEB sınıf listesini yüklemek istiyor musunuz?')) {
      state.classRoster = [
        'Ali', 'Ayşe', 'Mehmet', 'Fatma', 'Can', 'Zeynep',
        'Yusuf', 'Elif', 'Kerem', 'Defne', 'Emir', 'Asya',
        'Burak', 'Nehir', 'Mert', 'Yağmur', 'Arda', 'Zehra',
        'Umut', 'Ela', 'Efe', 'Ceren', 'Baran', 'Duru'
      ];
      StorageManager.saveRoster();
      if (DOM.rosterCount) DOM.rosterCount.textContent = state.classRoster.length;
      if (DOM.rosterCountBadge) DOM.rosterCountBadge.textContent = state.classRoster.length;
      if (DOM.rosterTextarea) DOM.rosterTextarea.value = state.classRoster.join('\n');
      updatePickerPoolStatus();
      audio.playClick();
      showToast('Örnek liste başarıyla yüklendi.');
    }
  }

  /* ==========================================================================
     12. ÖZEL SINAV OLUŞTURUCU (CUSTOM QUIZ BUILDER) & AKILLI TAHTA MOTORU
     ========================================================================== */
  let currentQuizStagedQuestions = [];

  function openCustomQModal() {
    renderSavedQuizzesList();
    renderStagedQuestionsPreview();
    updateQuizRadioRowHighlights();
    openModal(DOM.modalCustomQ);
  }

  function updateQuizRadioRowHighlights() {
    const selected = document.querySelector('input[name="quizCorrectRadio"]:checked')?.value || 'A';
    ['A', 'B', 'C', 'D'].forEach(letter => {
      const row = document.getElementById('quizOptionRow' + letter);
      if (row) {
        row.classList.toggle('is-correct-selected', letter === selected);
      }
    });
  }

  function handleQuizAddQuestion(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const qText = (DOM.quizQuestionInput ? DOM.quizQuestionInput.value.trim() : '');
    const optA = (DOM.quizChoiceInputA ? DOM.quizChoiceInputA.value.trim() : '');
    const optB = (DOM.quizChoiceInputB ? DOM.quizChoiceInputB.value.trim() : '');
    const optC = (DOM.quizChoiceInputC ? DOM.quizChoiceInputC.value.trim() : '');
    const optD = (DOM.quizChoiceInputD ? DOM.quizChoiceInputD.value.trim() : '');

    if (!qText || !optA || !optB || !optC || !optD) {
      showToast('⚠️ Lütfen soru metnini ve 4 şıkkı da (A, B, C, D) eksiksiz doldurunuz.');
      return false;
    }

    const selectedRadio = document.querySelector('input[name="quizCorrectRadio"]:checked')?.value || 'A';
    const optMap = { A: optA, B: optB, C: optC, D: optD };
    const correctText = optMap[selectedRadio];
    const wrongOptions = ['A', 'B', 'C', 'D'].filter(k => k !== selectedRadio).map(k => optMap[k]);

    const newQuestion = {
      id: 'q_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      question: qText,
      options: { A: optA, B: optB, C: optC, D: optD },
      correctOption: selectedRadio,
      correctText: correctText,
      wrongOptions: wrongOptions
    };

    currentQuizStagedQuestions.push(newQuestion);

    // Formu sıfırla, soru metnine odaklan
    DOM.quizQuestionInput.value = '';
    DOM.quizChoiceInputA.value = '';
    DOM.quizChoiceInputB.value = '';
    DOM.quizChoiceInputC.value = '';
    DOM.quizChoiceInputD.value = '';

    const firstRadio = document.getElementById('choiceRadioA');
    if (firstRadio) firstRadio.checked = true;
    updateQuizRadioRowHighlights();

    renderStagedQuestionsPreview();
    audio.playClick();
    showToast(`✨ Soru #${currentQuizStagedQuestions.length} sınava eklendi!`);
    DOM.quizQuestionInput.focus();
    return true;
  }

  function handleQuizSaveQuiz(e) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    const quizTitle = (DOM.quizTitleInput ? DOM.quizTitleInput.value.trim() : '');
    if (!quizTitle) {
      showToast('⚠️ Lütfen bir sınav adı giriniz (Örn: Yarınki Matematik Denemesi).');
      if (DOM.quizTitleInput) DOM.quizTitleInput.focus();
      return;
    }

    // Eğer soru metni ve şıklar şu an doluysa otomatik olarak bu soruyu da ekle
    const qText = (DOM.quizQuestionInput ? DOM.quizQuestionInput.value.trim() : '');
    const optA = (DOM.quizChoiceInputA ? DOM.quizChoiceInputA.value.trim() : '');
    const optB = (DOM.quizChoiceInputB ? DOM.quizChoiceInputB.value.trim() : '');
    const optC = (DOM.quizChoiceInputC ? DOM.quizChoiceInputC.value.trim() : '');
    const optD = (DOM.quizChoiceInputD ? DOM.quizChoiceInputD.value.trim() : '');
    if (qText && optA && optB && optC && optD) {
      handleQuizAddQuestion();
    }

    if (currentQuizStagedQuestions.length === 0) {
      showToast('⚠️ Lütfen sınava kaydetmeden önce en az 1 soru ekleyiniz.');
      return;
    }

    const newQuiz = {
      id: 'quiz_' + Date.now(),
      title: quizTitle,
      createdAt: new Date().toLocaleDateString('tr-TR'),
      questions: [...currentQuizStagedQuestions]
    };

    state.customQuizzes.unshift(newQuiz);
    StorageManager.saveCustomQuizzes();

    // Sınav formunu tamamen sıfırla
    currentQuizStagedQuestions = [];
    DOM.quizTitleInput.value = '';
    DOM.quizQuestionInput.value = '';
    DOM.quizChoiceInputA.value = '';
    DOM.quizChoiceInputB.value = '';
    DOM.quizChoiceInputC.value = '';
    DOM.quizChoiceInputD.value = '';
    const firstRadio = document.getElementById('choiceRadioA');
    if (firstRadio) firstRadio.checked = true;
    updateQuizRadioRowHighlights();
    renderStagedQuestionsPreview();

    // Sağdaki listeyi yenile
    renderSavedQuizzesList();

    audio.playCorrect();
    showToast(`🎉 "${quizTitle}" başarıyla kaydedildi! Tahtada Oynatabilirsiniz.`);
  }

  function renderStagedQuestionsPreview() {
    const count = currentQuizStagedQuestions.length;
    if (DOM.quizStagedCountBadge) {
      DOM.quizStagedCountBadge.textContent = `Eklenen: ${count} Soru`;
    }
    if (DOM.quizCurrentQBadge) {
      DOM.quizCurrentQBadge.textContent = `Soru #${count + 1}`;
    }

    if (!DOM.stagedQuestionsPreview || !DOM.stagedChipsList) return;

    if (count === 0) {
      DOM.stagedQuestionsPreview.classList.add('hide');
      DOM.stagedChipsList.innerHTML = '';
      return;
    }

    DOM.stagedQuestionsPreview.classList.remove('hide');
    DOM.stagedChipsList.innerHTML = currentQuizStagedQuestions.map((q, idx) => `
      <div class="staged-q-chip">
        <span><strong>${idx + 1}.</strong> ${escapeHtml(q.question.length > 25 ? q.question.substring(0, 25) + '...' : q.question)}</span>
        <button type="button" class="btn-remove-staged" data-remove-staged="${idx}" title="Bu soruyu çıkar">✕</button>
      </div>
    `).join('');

    DOM.stagedChipsList.querySelectorAll('[data-remove-staged]').forEach(btn => {
      addTapListener(btn, (e) => {
        const index = parseInt(btn.getAttribute('data-remove-staged'), 10);
        removeStagedQuestion(index);
      });
    });
  }

  function removeStagedQuestion(index) {
    if (index >= 0 && index < currentQuizStagedQuestions.length) {
      currentQuizStagedQuestions.splice(index, 1);
      renderStagedQuestionsPreview();
      audio.playClick();
    }
  }

  function renderSavedQuizzesList() {
    if (!DOM.savedQuizzesList) return;
    const count = state.customQuizzes.length;
    if (DOM.savedQuizzesCountBadge) {
      DOM.savedQuizzesCountBadge.textContent = `${count} Sınav`;
    }

    if (count === 0) {
      DOM.savedQuizzesList.innerHTML = `
        <div class="empty-quizzes-box">
          <span class="empty-icon">📝</span>
          <strong>Henüz Kayıtlı Sınavınız Yok</strong>
          <p>Soldaki formu kullanarak sınıfınıza özel soruları ekleyin ve "Sınavı Kaydet"e basın.</p>
        </div>
      `;
      return;
    }

    DOM.savedQuizzesList.innerHTML = state.customQuizzes.map(quiz => `
      <div class="saved-quiz-card" data-quiz-id="${quiz.id}">
        <div class="quiz-card-header">
          <div class="quiz-card-title-group">
            <span class="quiz-card-icon">📝</span>
            <h4 class="quiz-card-title">${escapeHtml(quiz.title)}</h4>
          </div>
          <span class="quiz-card-count-badge">${quiz.questions ? quiz.questions.length : 0} Soru</span>
        </div>
        <div class="quiz-card-meta">
          <span>📅 ${escapeHtml(quiz.createdAt || 'Bugün')}</span>
          <span>•</span>
          <span>Akıllı Tahta Düellosu</span>
        </div>
        <div class="quiz-card-actions">
          <button type="button" class="btn-play-quiz-board" data-play-quiz-id="${quiz.id}" title="Bu sınavı akıllı tahtada hemen oynat">
            <span>🚀 Tahtada Oynat</span>
          </button>
          <button type="button" class="btn-del-quiz" data-del-quiz-id="${quiz.id}" title="Bu sınavı kalıcı olarak sil">
            <span>🗑️ Sil</span>
          </button>
        </div>
      </div>
    `).join('');

    // "🚀 Tahtada Oynat" Dinleyicileri
    DOM.savedQuizzesList.querySelectorAll('[data-play-quiz-id]').forEach(btn => {
      addTapListener(btn, (e) => {
        const quizId = btn.getAttribute('data-play-quiz-id');
        startCustomQuiz(quizId);
      });
    });

    // "🗑️ Sil" Dinleyicileri
    DOM.savedQuizzesList.querySelectorAll('[data-del-quiz-id]').forEach(btn => {
      addTapListener(btn, (e) => {
        const quizId = btn.getAttribute('data-del-quiz-id');
        deleteCustomQuiz(quizId);
      });
    });
  }

  function startCustomQuiz(quizId) {
    const quiz = state.customQuizzes.find(q => q.id === quizId);
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      showToast('⚠️ Bu sınavda soru bulunamadı.');
      return;
    }

    // Modalı kapat
    closeModal(DOM.modalCustomQ);

    // Aktif sınav state'ini ayarla
    state.activeCustomQuiz = quiz;
    state.customQuizQueue = QuestionEngine.fisherYatesShuffle([...quiz.questions]);

    // Düelloyu bu özel sınavla başlat
    startDuel('custom_quiz');
    showToast(`🚀 "${quiz.title}" akıllı tahta oyun motoruyla başlatıldı!`);
  }

  function deleteCustomQuiz(quizId) {
    const quiz = state.customQuizzes.find(q => q.id === quizId);
    if (!quiz) return;
    if (confirm(`"${quiz.title}" isimli sınavı silmek istediğinize emin misiniz?`)) {
      state.customQuizzes = state.customQuizzes.filter(q => q.id !== quizId);
      StorageManager.saveCustomQuizzes();
      renderSavedQuizzesList();
      audio.playClick();
      showToast('Sınav listeden silindi.');
    }
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
     14. DÜELLO & TEK KİŞİLİK PRATİK OYUN AKIŞI & MEKANİĞİ
     ========================================================================== */
  // Düello / Pratik Zamanlayıcı Takipçisi (Temiz Çıkış Güvencesi)
  let duelTimers = [];
  function setDuelTimeout(fn, delay) {
    const t = setTimeout(() => {
      duelTimers = duelTimers.filter(id => id !== t);
      fn();
    }, delay);
    duelTimers.push(t);
    return t;
  }
  function clearAllDuelTimers() {
    duelTimers.forEach(t => clearTimeout(t));
    duelTimers = [];
  }

  function startDuel(gameType) {
    lockInteractions(500);
    state.currentGameType = gameType;
    state.matchStartTime = Date.now();
    state.player1.score = 0;
    state.player2.score = 0;
    state.player1.streak = 0;
    state.player2.streak = 0;
    state.player1.isLocked = false;
    state.player2.isLocked = false;
    state.questionNumber = 1;

    // Analytics: Düello / Solo Oyun Başlangıcını Raporla
    const gameTitle = getCurrentGameTitle();
    AnalyticsTracker.trackDuelStart(gameType, gameTitle, state.currentGrade, state.gameMode);

    // Alev modlarını ve kombo banner'ını temizle
    if (DOM.p1ScoreContainer) DOM.p1ScoreContainer.classList.remove('on-fire');
    if (DOM.p2ScoreContainer) DOM.p2ScoreContainer.classList.remove('on-fire');
    if (DOM.p1StreakFlame) DOM.p1StreakFlame.classList.add('hide');
    if (DOM.p2StreakFlame) DOM.p2StreakFlame.classList.add('hide');
    if (DOM.comboFireBanner) {
      DOM.comboFireBanner.classList.remove('active');
      DOM.comboFireBanner.classList.add('hide');
    }

    // Anti-Repeat Fisher-Yates Oturumunu Başlat
    QuestionEngine.initSession(state.currentGrade, gameType);

    const isSolo = (state.gameMode === 'solo');

    // Split arena solo modunu uygula / kaldır
    if (DOM.splitArena) {
      if (isSolo) {
        DOM.splitArena.classList.add('solo-mode');
      } else {
        DOM.splitArena.classList.remove('solo-mode');
      }
    }

    // UI'ları sıfırla
    const gradeLabels = {
      0: '🎈 Anasınıfı',
      1: '🌱 1. Sınıf',
      2: '🚀 2. Sınıf',
      3: '⚡ 3. Sınıf',
      4: '👑 4. Sınıf'
    };
    const currentGm = getCurrentGameObject();
    const gameBadgeText = (currentGm && (currentGm.badge || currentGm.title))
      || (gameTypeBadges && gameTypeBadges[gameType])
      || (isSolo ? '🎯 Bireysel Pratik' : '🎯 Sınıf Düellosu');

    if (gameType === 'custom_quiz' && state.activeCustomQuiz) {
      if (DOM.duelGradeBadge) DOM.duelGradeBadge.innerHTML = '🎯 Özel Sınav';
      if (DOM.duelGameTypeBadge) DOM.duelGameTypeBadge.innerHTML = replaceEmojisWith3D('📝 ' + escapeHtml(state.activeCustomQuiz.title), 'chip-3d-icon');
    } else {
      if (DOM.duelGradeBadge) DOM.duelGradeBadge.innerHTML = replaceEmojisWith3D(gradeLabels[state.currentGrade] || `${state.currentGrade}. Sınıf`, 'chip-3d-icon');
      if (DOM.duelGameTypeBadge) DOM.duelGameTypeBadge.innerHTML = replaceEmojisWith3D(gameBadgeText, 'chip-3d-icon');
    }
    updateGameModeUI();
    updatePlayerNamesUI();
    renderScoreTrack();

    // Lobi -> Düello Görünümüne Geçiş (Kesin ve zorunlu ekran geçişi)
    if (DOM.viewLobby) {
      DOM.viewLobby.classList.remove('active');
      DOM.viewLobby.style.display = 'none';
    }

    if (DOM.viewDuel) {
      DOM.viewDuel.classList.add('active');
      DOM.viewDuel.style.display = 'flex';
    }
    state.currentView = 'duel';

    audio.playCorrect();
    if (!isSolo) {
      audio.playAnnouncerStart();
    }
    updateAnnouncerUI();
    changeMoliExpression('start');
    loadNextQuestion();
  }

  /**
   * Lobiye Kesin ve Güvenli Dönüş (Tüm state, ses ve sayaçları anında sıfırlar)
   */
  function returnToLobby() {
    lockInteractions(400);
    // 1) Sesleri ve konuşmayı anında tamamen durdur
    audio.stopAllAudio();
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }

    // Okuma butonlarının aktif görsel durumunu temizle
    const readBtns = [DOM.btnReadAloudP1, DOM.btnReadAloudP2, DOM.btnHudReadQuestion];
    readBtns.forEach(b => { if (b) b.classList.remove('reading-active'); });

    // 2) Bütün aktif zamanlayıcıları (clearTimeout, clearInterval) ve kilitleri temizle
    clearAllDuelTimers();
    clearAllLockouts();
    if (moliResetTimer) {
      clearTimeout(moliResetTimer);
      moliResetTimer = null;
    }
    if (spinTimer) {
      clearTimeout(spinTimer);
      spinTimer = null;
    }

    // 3) Açık olabilecek tüm modal/popup, bildirim ve efektleri kapat
    if (DOM.modalConfirmExit) DOM.modalConfirmExit.classList.add('hide');
    if (DOM.solutionPopup) DOM.solutionPopup.classList.add('hide');
    if (DOM.victoryOverlay) DOM.victoryOverlay.classList.add('hide');
    if (DOM.p1WinToast) DOM.p1WinToast.classList.add('hide');
    if (DOM.p2WinToast) DOM.p2WinToast.classList.add('hide');
    confetti.stop();
    particles.stop();

    // Şık butonlarındaki aktif ve kilitli durumları temizle
    document.querySelectorAll('.duel-option-btn').forEach(btn => {
      btn.classList.remove('btn-correct', 'btn-wrong');
      btn.disabled = false;
    });

    // İnteraktif oyun alanlarını sıfırla
    if (DOM.p1InteractiveZone) {
      DOM.p1InteractiveZone.innerHTML = '';
      DOM.p1InteractiveZone.classList.add('hide');
    }
    if (DOM.p2InteractiveZone) {
      DOM.p2InteractiveZone.innerHTML = '';
      DOM.p2InteractiveZone.classList.add('hide');
    }
    if (DOM.p1OptionsGrid) DOM.p1OptionsGrid.classList.remove('hide');
    if (DOM.p2OptionsGrid) DOM.p2OptionsGrid.classList.remove('hide');
    p1SyllableProgress = [];
    p2SyllableProgress = [];

    // 4) EKRAN GEÇİŞİNİ KESİN VE ZORUNLU KIL (display: none / flex)
    DOM.viewDuel.classList.remove('active');
    DOM.viewDuel.style.display = 'none';

    DOM.viewLobby.classList.add('active');
    DOM.viewLobby.style.display = 'flex';
    DOM.viewLobby.scrollTop = 0;
    window.scrollTo(0, 0);

    // 5) STATE SIFIRLAMA
    state.currentView = 'lobby';
    state.isQuestionAnswered = false;
    state.currentQuestion = null;
    state.questionNumber = 1;
    state.player1.score = 0;
    state.player2.score = 0;
    state.player1.isLocked = false;
    state.player2.isLocked = false;

    // Solo mod artıklarını temizle
    if (DOM.splitArena) {
      DOM.splitArena.classList.remove('solo-mode');
    }

    // Arayüz ve Moli'yi güncelle
    renderScoreTrack();
    updateGameModeUI();
    if (state.currentSubject) {
      if (DOM.homeShowcaseSection) DOM.homeShowcaseSection.classList.add('hide');
      if (DOM.subjectsSection) DOM.subjectsSection.classList.add('hide');
      if (DOM.gamesSection) DOM.gamesSection.classList.remove('hide');
      renderSubcategories();
      renderGameCards();
    } else if (state.currentSection === 'subjects') {
      if (DOM.homeShowcaseSection) DOM.homeShowcaseSection.classList.add('hide');
      if (DOM.gamesSection) DOM.gamesSection.classList.add('hide');
      if (DOM.subjectsSection) DOM.subjectsSection.classList.remove('hide');
      renderSubjects();
    } else {
      openHomePage();
    }
    changeMoliExpression('lobby');
    audio.playClick();
  }

  /**
   * Oyundan Çıkış: Onay penceresi (confirm / modal) olmadan doğrudan anında lobiye döner
   */
  function exitDuel() {
    returnToLobby();
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
      star.innerHTML = `<img src="assets/icons/3d/star.webp" style="width:28px; height:28px; object-fit:contain; vertical-align:middle; pointer-events:none;" alt="⭐">`;
      container.appendChild(star);
    }
  }

  /* ==========================================================================
     14.5. DOĞRU / YANLIŞ 2X REFLEKS ZAMANLAYICISI (HIZLI REFLEKS SAYACI)
     ========================================================================== */
  let reflexTimerRaf = null;

  function startReflexTimer(durationMs = 6000) {
    stopReflexTimer();
    if (!DOM.duelTimeBarTrack || !DOM.duelTimeBarFill) return;

    DOM.duelTimeBarTrack.classList.remove('hide');
    DOM.duelTimeBarFill.style.width = '100%';
    DOM.duelTimeBarFill.classList.remove('danger-state');
    if (DOM.duelTimeBadge) DOM.duelTimeBadge.textContent = '⚡ 2x HIZLI REFLEKS';

    const getNow = () => (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    const getRaf = (cb) => (typeof window !== 'undefined' && window.requestAnimationFrame) ? window.requestAnimationFrame(cb) : setTimeout(() => cb(getNow()), 16);

    const startTime = getNow();

    function updateReflexBar(now) {
      if (state.isQuestionAnswered || state.currentView !== 'duel') {
        stopReflexTimer();
        return;
      }
      const elapsed = (now || getNow()) - startTime;
      const remaining = Math.max(0, durationMs - elapsed);
      const pct = (remaining / durationMs) * 100;

      if (DOM.duelTimeBarFill) {
        DOM.duelTimeBarFill.style.width = `${pct}%`;
        if (pct < 30) {
          DOM.duelTimeBarFill.classList.add('danger-state');
        }
      }

      if (remaining <= 0) {
        handleReflexTimeout();
      } else {
        reflexTimerRaf = getRaf(updateReflexBar);
      }
    }

    reflexTimerRaf = getRaf(updateReflexBar);
  }

  function stopReflexTimer() {
    if (reflexTimerRaf) {
      if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
        cancelAnimationFrame(reflexTimerRaf);
      } else {
        clearTimeout(reflexTimerRaf);
      }
      reflexTimerRaf = null;
    }
    if (DOM.duelTimeBarTrack) DOM.duelTimeBarTrack.classList.add('hide');
    if (DOM.duelTimeBarFill) {
      DOM.duelTimeBarFill.style.width = '100%';
      DOM.duelTimeBarFill.classList.remove('danger-state');
    }
  }

  function handleReflexTimeout() {
    stopReflexTimer();
    if (state.isQuestionAnswered) return;
    state.isQuestionAnswered = true;
    audio.playWrong();

    const exp = state.currentQuestion ? (state.currentQuestion.explanation || 'Süre doldu! Hızlı davranmalısın.') : 'Süre doldu!';
    if (DOM.solutionText) {
      DOM.solutionText.innerHTML = replaceEmojisWith3D(exp, 'inline-3d-icon');
    }
    if (DOM.solutionPopup) {
      DOM.solutionPopup.classList.remove('hide');
    }

    state.questionNumber += 1;
    setDuelTimeout(() => {
      if (state.currentView === 'duel') {
        loadNextQuestion();
      }
    }, 2200);
  }

  function loadNextQuestion() {
    stopReflexTimer();
    clearAllLockouts();
    audio.stopQuestionAudio();
    DOM.solutionPopup.classList.add('hide');
    state.isQuestionAnswered = false;

    DOM.duelRoundBadge.textContent = `Soru ${state.questionNumber}`;

    // Yeni soruyu üret
    state.currentQuestion = QuestionEngine.getNextQuestion(state.currentGrade, state.currentGameType);

    // Mavi Tarafına Bas
    DOM.p1QuestionCategory.innerHTML = replaceEmojisWith3D(state.currentQuestion.category, 'chip-3d-icon');
    DOM.p1QuestionText.innerHTML = state.currentQuestion.questionHtml || replaceEmojisWith3D(state.currentQuestion.question, 'q-3d-item');

    // Kırmızı Tarafına Bas (Tamamen Simetrik)
    DOM.p2QuestionCategory.innerHTML = replaceEmojisWith3D(state.currentQuestion.category, 'chip-3d-icon');
    DOM.p2QuestionText.innerHTML = state.currentQuestion.questionHtml || replaceEmojisWith3D(state.currentQuestion.question, 'q-3d-item');

    // İnteraktif mod mu yoksa standart şıklar mı?
    if (state.currentQuestion.type && state.currentQuestion.type !== 'standard') {
      if (DOM.p1OptionsGrid) DOM.p1OptionsGrid.classList.add('hide');
      if (DOM.p2OptionsGrid) DOM.p2OptionsGrid.classList.add('hide');
      if (DOM.p1InteractiveZone) DOM.p1InteractiveZone.classList.remove('hide');
      if (DOM.p2InteractiveZone) DOM.p2InteractiveZone.classList.remove('hide');

      renderInteractiveQuestion(state.currentQuestion);
    } else {
      if (DOM.p1InteractiveZone) {
        DOM.p1InteractiveZone.innerHTML = '';
        DOM.p1InteractiveZone.classList.add('hide');
      }
      if (DOM.p2InteractiveZone) {
        DOM.p2InteractiveZone.innerHTML = '';
        DOM.p2InteractiveZone.classList.add('hide');
      }
      if (DOM.p1OptionsGrid) DOM.p1OptionsGrid.classList.remove('hide');
      if (DOM.p2OptionsGrid) DOM.p2OptionsGrid.classList.remove('hide');

      const opts = state.currentQuestion.options || [];
      const hasFour = (opts.length >= 4);

      if (DOM.p1OptionsGrid) DOM.p1OptionsGrid.classList.toggle('has-four-options', hasFour);
      if (DOM.p2OptionsGrid) DOM.p2OptionsGrid.classList.toggle('has-four-options', hasFour);

      if (opts.length >= 3) {
        DOM.p1OptTextA.innerHTML = replaceEmojisWith3D(opts[0], 'opt-3d-icon');
        DOM.p1OptTextB.innerHTML = replaceEmojisWith3D(opts[1], 'opt-3d-icon');
        DOM.p1OptTextC.innerHTML = replaceEmojisWith3D(opts[2], 'opt-3d-icon');

        DOM.p2OptTextA.innerHTML = replaceEmojisWith3D(opts[0], 'opt-3d-icon');
        DOM.p2OptTextB.innerHTML = replaceEmojisWith3D(opts[1], 'opt-3d-icon');
        DOM.p2OptTextC.innerHTML = replaceEmojisWith3D(opts[2], 'opt-3d-icon');

        if (hasFour && DOM.p1OptTextD && DOM.p2OptTextD) {
          DOM.p1OptTextD.innerHTML = replaceEmojisWith3D(opts[3], 'opt-3d-icon');
          DOM.p2OptTextD.innerHTML = replaceEmojisWith3D(opts[3], 'opt-3d-icon');
          if (DOM.p1OptD) DOM.p1OptD.classList.remove('hide');
          if (DOM.p2OptD) DOM.p2OptD.classList.remove('hide');
        } else {
          if (DOM.p1OptD) DOM.p1OptD.classList.add('hide');
          if (DOM.p2OptD) DOM.p2OptD.classList.add('hide');
        }
      }

      // Buton stillerini ve buz kilitlerini sıfırla
      [DOM.p1OptA, DOM.p1OptB, DOM.p1OptC, DOM.p1OptD, DOM.p2OptA, DOM.p2OptB, DOM.p2OptC, DOM.p2OptD].forEach(btn => {
        if (btn) {
          btn.className = 'duel-option-btn' + (btn === DOM.p1OptD || btn === DOM.p2OptD ? (hasFour ? '' : ' hide') : '');
          btn.disabled = false;
          const frost = btn.querySelector('.btn-frost-countdown');
          if (frost) frost.remove();
        }
      });
    }

    DOM.p1Panel.classList.remove('winner-glow');
    DOM.p2Panel.classList.remove('winner-glow');
    DOM.p1WinToast.classList.add('hide');
    DOM.p2WinToast.classList.add('hide');

    // Otomatik Soru Sesli Okuma (Edge-TTS Stüdyo & Web Speech)
    if (state.autoReadQuestion && state.soundEnabled) {
      const readDelay = (state.questionNumber === 1 && state.announcerEnabled) ? 1900 : 400;
      setDuelTimeout(() => {
        if (state.currentView === 'duel' && !state.isQuestionAnswered) {
          readCurrentQuestion();
        }
      }, readDelay);
    }
  }

  /* ==========================================================================
     15. AKILLI TAHTA MULTI-TOUCH CEVAP KONTROLÜ (POINTERDOWN)
     ========================================================================== */
  function handleAnswer(playerNum, optionIndex) {
    if (state.isQuestionAnswered) return;

    // Tek kişilik modda sadece 1. oyuncu (öğrenci) cevap verebilir
    if (state.gameMode === 'solo' && playerNum !== 1) return;

    // Ceza kilidi aktifse engelle
    if (playerNum === 1 && state.player1.isLocked) return;
    if (playerNum === 2 && state.player2.isLocked) return;

    audio.stopQuestionAudio();

    // Tıklanan butonun merkez koordinatlarını parçacık ve puan animasyonu için hesapla
    const gridEl = (playerNum === 1) ? DOM.p1OptionsGrid : DOM.p2OptionsGrid;
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    if (gridEl) {
      const btns = gridEl.querySelectorAll('.duel-option-btn');
      if (btns && btns[optionIndex]) {
        const rect = btns[optionIndex].getBoundingClientRect();
        cx = rect.left + rect.width / 2;
        cy = rect.top + rect.height / 2;
      }
    }

    const chosenText = state.currentQuestion.options[optionIndex];
    const isCorrect = (chosenText === state.currentQuestion.correct);

    if (isCorrect) {
      awardPointAndProgress(playerNum, optionIndex, cx, cy);
    } else {
      applyLockout(playerNum, optionIndex);
    }
  }

  function awardPointAndProgress(playerNum, optionIndex = null, cx = null, cy = null) {
    state.isQuestionAnswered = true;
    changeMoliExpression('correct');

    if (cx === null || cy === null) {
      const panel = (playerNum === 1) ? DOM.p1Panel : DOM.p2Panel;
      if (panel) {
        const rect = panel.getBoundingClientRect();
        cx = rect.left + rect.width / 2;
        cy = rect.top + rect.height * 0.45;
      } else {
        cx = window.innerWidth / 2;
        cy = window.innerHeight / 2;
      }
    }

    // Seri (Streak) ve Ateş Modu Yönetimi
    let streak = 0;
    if (playerNum === 1) {
      state.player1.score += 1;
      state.player1.streak = (state.player1.streak || 0) + 1;
      state.player2.streak = 0; // Rakibin serisini kır
      streak = state.player1.streak;

      if (DOM.p2ScoreContainer) DOM.p2ScoreContainer.classList.remove('on-fire');
      if (DOM.p2StreakFlame) DOM.p2StreakFlame.classList.add('hide');

      DOM.p1Panel.classList.add('winner-glow');
      DOM.p1WinToast.classList.remove('hide');
      if (optionIndex !== null && optionIndex !== undefined) {
        highlightCorrectOption(DOM.p1OptionsGrid, optionIndex);
      }
      if (state.gameMode !== 'solo' && state.player1.score < state.targetScore) {
        setDuelTimeout(() => audio.playAnnouncerBluePoint(), 180);
      }
    } else {
      state.player2.score += 1;
      state.player2.streak = (state.player2.streak || 0) + 1;
      state.player1.streak = 0; // Rakibin serisini kır
      streak = state.player2.streak;

      if (DOM.p1ScoreContainer) DOM.p1ScoreContainer.classList.remove('on-fire');
      if (DOM.p1StreakFlame) DOM.p1StreakFlame.classList.add('hide');

      DOM.p2Panel.classList.add('winner-glow');
      DOM.p2WinToast.classList.remove('hide');
      if (optionIndex !== null && optionIndex !== undefined) {
        highlightCorrectOption(DOM.p2OptionsGrid, optionIndex);
      }
      if (state.player2.score < state.targetScore) {
        setDuelTimeout(() => audio.playAnnouncerRedPoint(), 180);
      }
    }

    // 1) KOMBO (SERİ) VE ATEŞ MODU EFEKTLERİ (3x ve üzeri)
    const activeScoreBox = (playerNum === 1) ? DOM.p1ScoreContainer : DOM.p2ScoreContainer;
    const activeStreakFlame = (playerNum === 1) ? DOM.p1StreakFlame : DOM.p2StreakFlame;
    const activeStreakCount = (playerNum === 1) ? DOM.p1StreakCount : DOM.p2StreakCount;

    if (streak >= 3) {
      // Puan kutusu alev ve altın rengi parlasın
      if (activeScoreBox) activeScoreBox.classList.add('on-fire');
      if (activeStreakFlame) activeStreakFlame.classList.remove('hide');
      if (activeStreakCount) activeStreakCount.textContent = `${streak}x`;

      // Ateş modu coşkulu animasyon ve ses
      showComboFireBanner(playerNum, streak);
      audio.playComboFire();

      // Juiciness: Ekranda alev parçacıkları patlasın
      particles.burst(cx, cy, 'fire');
      spawnFloatingScore(cx, cy, `+10 Puan 🔥 ${streak}x SERİ!`, true);
    } else {
      audio.playCorrect();
      audio.playScorePoints();

      // Juiciness: Konfeti / yıldız parçacıkları patlasın ve "+10 Puan" yukarı süzülsün
      particles.burst(cx, cy, 'stars');
      spawnFloatingScore(cx, cy, '+10 Puan', false);
    }

    renderScoreTrack();

    // Pedagojik Çözümü Göster
    DOM.solutionText.innerHTML = replaceEmojisWith3D(state.currentQuestion.explanation, 'inline-3d-icon');
    if (state.showAutoExplanation) {
      DOM.solutionPopup.classList.remove('hide');
    }

    // Hedef puana ulaşıldı mı kontrol et
    if (state.player1.score >= state.targetScore || state.player2.score >= state.targetScore) {
      setDuelTimeout(() => {
        triggerVictory(playerNum === 1 ? state.player1 : state.player2);
      }, 1200);
    } else {
      // Sonraki soruya geçiş (2.2 saniye sonra)
      state.questionNumber += 1;
      setDuelTimeout(() => {
        if (state.currentView === 'duel') {
          loadNextQuestion();
        }
      }, 2200);
    }
  }

  function highlightCorrectOption(gridEl, index) {
    if (!gridEl) return;
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

    // Seri sıfırlama: Hatalı cevapta ateş modu söner
    if (isP1) {
      state.player1.streak = 0;
      if (DOM.p1ScoreContainer) DOM.p1ScoreContainer.classList.remove('on-fire');
      if (DOM.p1StreakFlame) DOM.p1StreakFlame.classList.add('hide');
    } else {
      state.player2.streak = 0;
      if (DOM.p2ScoreContainer) DOM.p2ScoreContainer.classList.remove('on-fire');
      if (DOM.p2StreakFlame) DOM.p2StreakFlame.classList.add('hide');
    }

    // 2) GÖRSEL GERİ BİLDİRİM: Ekran hafifçe titresin (Shake)
    triggerScreenShake();
    audio.playWrong();
    audio.playIceFreeze();

    changeMoliExpression('wrong');

    // 1.5 Saniyelik Buz / Kilit Efekti ve Geri Sayım Rozeti (❄️ 1.5s)
    let lockedButton = null;
    if (gridEl && optionIndex !== null && optionIndex !== undefined) {
      const buttons = gridEl.querySelectorAll('.duel-option-btn');
      if (buttons && buttons[optionIndex]) {
        lockedButton = buttons[optionIndex];
        lockedButton.classList.add('btn-wrong', 'frost-locked');
        if (state.gameMode === 'solo') {
          lockedButton.disabled = true;
        }

        // Buton üzerinde canlı geri sayan buz rozeti oluştur
        const existingBadge = lockedButton.querySelector('.btn-frost-countdown');
        if (existingBadge) existingBadge.remove();

        const badge = document.createElement('div');
        badge.className = 'btn-frost-countdown';
        badge.innerHTML = '<span class="frost-icon">❄️</span> <span class="frost-time">1.5s</span>';
        lockedButton.appendChild(badge);

        const startTime = Date.now();
        const duration = 1500;
        const timeEl = badge.querySelector('.frost-time');

        if (isP1 && state.player1.frostInterval) clearInterval(state.player1.frostInterval);
        if (!isP1 && state.player2.frostInterval) clearInterval(state.player2.frostInterval);

        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, (duration - elapsed) / 1000);
          if (timeEl) {
            timeEl.textContent = `${remaining.toFixed(1)}s`;
          }
          if (elapsed >= duration) {
            clearInterval(interval);
            if (badge && badge.parentNode) badge.parentNode.removeChild(badge);
            if (lockedButton) lockedButton.classList.remove('frost-locked');
          }
        }, 100);

        if (isP1) state.player1.frostInterval = interval;
        else state.player2.frostInterval = interval;
      }
    }

    if (isP1) state.player1.isLocked = true;
    else state.player2.isLocked = true;

    // Sesli uyarı: Bomba mı yoksa standart kilitlenme mi?
    const chosenOpt = (state.currentQuestion && state.currentQuestion.options && optionIndex !== null && optionIndex !== undefined)
      ? state.currentQuestion.options[optionIndex]
      : '';
    if (chosenOpt && chosenOpt.includes('BOMBA')) {
      audio.playAnnouncerBomb();
    } else {
      audio.playAnnouncerLockout();
    }

    // Overlay'i buz temasıyla aç ve süre çubuğunu boşalt
    const modalBox = lockOverlay.querySelector('.lockout-modal-box');
    if (modalBox) modalBox.classList.add('frost-theme');
    const lockIcon = lockOverlay.querySelector('.lockout-icon');
    if (lockIcon) lockIcon.textContent = '❄️';
    const lockTitle = lockOverlay.querySelector('.lockout-title');
    if (lockTitle) lockTitle.textContent = '❄️ Hatalı Şık! Donup Kilitlendin!';
    const lockDesc = lockOverlay.querySelector('.lockout-desc');
    if (lockDesc) lockDesc.textContent = '1.5 saniye buz kilidi aktif! Sıra rakipte...';

    lockOverlay.classList.remove('hide');
    lockProgress.style.transition = 'none';
    lockProgress.style.width = '100%';

    requestAnimationFrame(() => {
      lockProgress.style.transition = 'width 1.5s linear';
      lockProgress.style.width = '0%';
    });

    const timer = setTimeout(() => {
      if (isP1) {
        state.player1.isLocked = false;
        if (state.player1.frostInterval) clearInterval(state.player1.frostInterval);
      } else {
        state.player2.isLocked = false;
        if (state.player2.frostInterval) clearInterval(state.player2.frostInterval);
      }
      lockOverlay.classList.add('hide');
      if (lockedButton) {
        lockedButton.classList.remove('frost-locked');
        const b = lockedButton.querySelector('.btn-frost-countdown');
        if (b && b.parentNode) b.parentNode.removeChild(b);
      }
    }, 1500);

    if (isP1) state.player1.lockTimer = timer;
    else state.player2.lockTimer = timer;
  }

  /* ==========================================================================
     15.5. İNTERAKTİF MOTOR RENDER VE ETKİLEŞİM YÖNETİCİSİ
     ========================================================================== */
  let p1SyllableProgress = [];
  let p2SyllableProgress = [];

  // ---------------------------------------------------------------------------
  // MOBİL & AKILLI TAHTA SIFIR GECİKME (0ms) DOKUNMA YARDIMCISI
  // onTouchStart, pointerdown ve mousedown olaylarını birleştirir
  // ---------------------------------------------------------------------------
  function attachInstantTouch(el, callback) {
    let lastTime = 0;
    const onTrigger = (e) => {
      if (isInteractionLocked()) {
        if (e && e.cancelable) e.preventDefault();
        return;
      }
      const now = Date.now();
      if (now - lastTime < 280) return;
      lastTime = now;
      if (e.cancelable && (e.type === 'touchstart' || e.type === 'pointerdown')) {
        e.preventDefault();
      }
      callback(e);
    };
    el.addEventListener('touchstart', onTrigger, { passive: false });
    el.addEventListener('pointerdown', onTrigger);
    el.addEventListener('mousedown', onTrigger);
  }

  // ---------------------------------------------------------------------------
  // 1) 🎨 DİNLE & SEÇ (SESLİ YÖNERGE VE DEVASA GÖRSEL BUTONLAR)
  // ---------------------------------------------------------------------------
  function renderVisualChoiceArena(q) {
    const data = q.interactiveData || q;
    const cards = data.cards || q.visualCards || [];

    const createVisualCardsHtml = (playerNum) => {
      return `
        <div class="visual-choice-arena" data-player="${playerNum}">
          <div class="visual-speaker-banner">
            <button class="visual-audio-repeat-btn" data-player="${playerNum}" role="button" aria-label="Soruyu Tekrar Dinle">
              <span class="audio-btn-icon">🔊</span>
              <span>Tekrar Dinle</span>
            </button>
            <div class="visual-instruction-text">${replaceEmojisWith3D(q.question, 'q-3d-item')}</div>
          </div>
          <div class="visual-cards-grid">
            ${cards.map((c, idx) => {
              let iconHtml = '';
              if (EMOJI_TO_3D[c.icon]) {
                const iconPath = EMOJI_TO_3D[c.icon];
                const webpPath = (iconPath && iconPath.endsWith('.png')) ? iconPath.slice(0, -4) + '.webp' : iconPath;
                iconHtml = `<img src="${webpPath}" onerror="if(this.dataset.fb!=='1'){this.dataset.fb='1';this.src='${iconPath}';}" class="visual-3d-img" alt="${c.text}">`;
              } else {
                const rendered = replaceEmojisWith3D(c.icon, 'visual-3d-img');
                if (rendered && rendered !== c.icon) {
                  iconHtml = rendered;
                } else {
                  iconHtml = `<span class="visual-emoji-icon">${c.icon}</span>`;
                }
              }
              return `
                <div class="visual-choice-card" data-card-idx="${idx}" data-player="${playerNum}" role="button" tabindex="0">
                  <div class="visual-card-icon">${iconHtml}</div>
                  <div class="visual-card-label">${c.text}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    };

    if (DOM.p1InteractiveZone) DOM.p1InteractiveZone.innerHTML = createVisualCardsHtml(1);
    if (DOM.p2InteractiveZone) DOM.p2InteractiveZone.innerHTML = createVisualCardsHtml(2);

    // Otomatik Soru Sesli Okuma (Google TTS & Web Speech)
    if (state.soundEnabled && (q.spokenText || q.question)) {
      setTimeout(() => {
        if (!state.isQuestionAnswered && state.currentQuestion === q) {
          audio.speakTurkishText(getSpokenTextForQuestion(q));
        }
      }, 350);
    }

    [DOM.p1InteractiveZone, DOM.p2InteractiveZone].forEach((zone, zIdx) => {
      if (!zone) return;
      const pNum = zIdx + 1;

      zone.querySelectorAll('.visual-audio-repeat-btn').forEach(btn => {
        attachInstantTouch(btn, () => {
          audio.playClick();
          audio.speakTurkishText(getSpokenTextForQuestion(q));
        });
      });

      zone.querySelectorAll('.visual-choice-card').forEach(cardEl => {
        attachInstantTouch(cardEl, (e) => {
          const idx = parseInt(cardEl.getAttribute('data-card-idx'), 10);
          handleVisualCardTap(pNum, idx, cardEl, e);
        });
      });
    });
  }

  function handleVisualCardTap(playerNum, idx, cardEl, e) {
    if (state.isQuestionAnswered) return;
    if (state.gameMode === 'solo' && playerNum !== 1) return;
    if (playerNum === 1 && state.player1.isLocked) return;
    if (playerNum === 2 && state.player2.isLocked) return;

    const cards = (state.currentQuestion.interactiveData && state.currentQuestion.interactiveData.cards) || state.currentQuestion.visualCards || [];
    const card = cards[idx];
    if (!card) return;

    audio.stopQuestionAudio();
    const rect = cardEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    if (card.isCorrect) {
      cardEl.classList.add('card-correct');
      audio.playCorrect();
      if (window.gameParticles) {
        window.gameParticles.burst(cx, cy, 22, ['#10B981', '#34D399', '#FBBF24', '#60A5FA']);
      }
      awardPointAndProgress(playerNum, null, cx, cy);
    } else {
      cardEl.classList.add('card-wrong');
      audio.playWrong();
      setTimeout(() => cardEl.classList.remove('card-wrong'), 500);
      applyLockout(playerNum, null);
    }
  }

  // ---------------------------------------------------------------------------
  // 2) 🎈 HAREKETLİ BALON PATLATMA MOTORU (HARF / HECE / SAYI AVI)
  // ---------------------------------------------------------------------------
  let playerFloatingBalloonState = {
    1: { poppedTargets: 0, needed: 2 },
    2: { poppedTargets: 0, needed: 2 }
  };

  function renderFloatingBalloonArena(data) {
    const balloons = data.balloons || [];
    const targetsNeeded = data.targetsNeeded || 2;

    playerFloatingBalloonState = {
      1: { poppedTargets: 0, needed: targetsNeeded },
      2: { poppedTargets: 0, needed: targetsNeeded }
    };

    const createStreamHtml = (playerNum) => {
      return `
        <div class="balloon-stream-container" data-player="${playerNum}">
          <div class="balloon-task-header">
            <span class="task-remaining-badge" id="balloonCounterP${playerNum}">Kalan: ${targetsNeeded} 🎯</span>
          </div>
          <div class="balloon-stream-sky">
            ${balloons.map((b, idx) => {
              const speed = b.speed || (5.5 + (idx % 3) * 0.7);
              const delay = b.delay || (idx * 0.35);
              const left = b.left !== undefined ? b.left : ((idx * 18 + 8) % 85);
              return `
                <div class="floating-balloon ${b.colorClass || 'balloon-color-red'}"
                     data-balloon-idx="${idx}"
                     data-player="${playerNum}"
                     role="button"
                     tabindex="0"
                     style="left: ${left}%; animation-duration: ${speed}s; animation-delay: ${delay}s;">
                  ${b.text ? `<span class="balloon-inner-text">${b.text}</span>` : ''}
                  <div class="balloon-knot"></div>
                  <div class="balloon-string"></div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    };

    if (DOM.p1InteractiveZone) DOM.p1InteractiveZone.innerHTML = createStreamHtml(1);
    if (DOM.p2InteractiveZone) DOM.p2InteractiveZone.innerHTML = createStreamHtml(2);

    if (state.soundEnabled && data.spokenText) {
      setTimeout(() => {
        if (!state.isQuestionAnswered && state.currentQuestion && state.currentQuestion.spokenText === data.spokenText) {
          audio.speakTurkishText(data.spokenText);
        }
      }, 350);
    }

    [DOM.p1InteractiveZone, DOM.p2InteractiveZone].forEach((zone, zIdx) => {
      if (!zone) return;
      const pNum = zIdx + 1;
      zone.querySelectorAll('.floating-balloon').forEach(balloonEl => {
        attachInstantTouch(balloonEl, (e) => {
          const idx = parseInt(balloonEl.getAttribute('data-balloon-idx'), 10);
          handleFloatingBalloonTap(pNum, idx, balloonEl, e);
        });
      });
    });
  }

  function handleFloatingBalloonTap(playerNum, idx, balloonEl, e) {
    if (state.isQuestionAnswered) return;
    if (state.gameMode === 'solo' && playerNum !== 1) return;
    if (playerNum === 1 && state.player1.isLocked) return;
    if (playerNum === 2 && state.player2.isLocked) return;

    if (balloonEl.classList.contains('balloon-popped')) return;

    const data = state.currentQuestion.interactiveData || state.currentQuestion;
    const balloon = (data.balloons && data.balloons[idx]) || null;
    if (!balloon) return;

    const rect = balloonEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    if (balloon.isTarget) {
      balloonEl.classList.add('balloon-popped', 'balloon-popping');
      audio.playBalloonPop();
      if (window.gameParticles) {
        window.gameParticles.burst(cx, cy, 20, ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#EC4899']);
      }

      const pState = playerFloatingBalloonState[playerNum];
      if (pState) {
        pState.poppedTargets++;
        const remaining = Math.max(0, pState.needed - pState.poppedTargets);
        const counterEl = document.getElementById(`balloonCounterP${playerNum}`);
        if (counterEl) {
          counterEl.textContent = remaining === 0 ? 'Tamamlandı! 🌟' : `Kalan: ${remaining} 🎯`;
          counterEl.classList.add('badge-bump');
          setTimeout(() => counterEl.classList.remove('badge-bump'), 300);
        }

        if (pState.poppedTargets >= pState.needed) {
          awardPointAndProgress(playerNum, null, cx, cy);
        }
      }
    } else {
      audio.playWrong();
      balloonEl.classList.add('balloon-wrong');
      setTimeout(() => balloonEl.classList.remove('balloon-wrong'), 450);
      applyLockout(playerNum, null);
    }
  }

  // ---------------------------------------------------------------------------
  // 3) 🧠 EŞLEŞTİRME VE HAFIZA KARTLARI (ARDIŞIK DOKUNMA - TAP TO MATCH)
  // ---------------------------------------------------------------------------
  let memoryGameState = {
    1: { firstCard: null, matchedCount: 0, totalPairs: 0, isBusy: false },
    2: { firstCard: null, matchedCount: 0, totalPairs: 0, isBusy: false }
  };

  function renderMemoryGridArena(data) {
    const cards = data.cards || [];
    const totalPairs = data.totalPairs || (cards.length / 2);
    const gridSize = data.gridSize || (cards.length <= 6 ? 'grid-2x3' : 'grid-3x4');

    memoryGameState = {
      1: { firstCard: null, matchedCount: 0, totalPairs, isBusy: false },
      2: { firstCard: null, matchedCount: 0, totalPairs, isBusy: false }
    };

    const createMemoryHtml = (playerNum) => {
      return `
        <div class="memory-grid-arena" data-player="${playerNum}">
          <div class="memory-grid-cards ${gridSize}">
            ${cards.map((c, idx) => `
              <div class="memory-flip-card"
                   data-card-idx="${idx}"
                   data-pair-key="${c.pairKey}"
                   data-player="${playerNum}"
                   role="button"
                   tabindex="0">
                <div class="memory-card-inner">
                  <div class="memory-card-face memory-card-back">
                    <span class="memory-card-back-icon">❓</span>
                  </div>
                  <div class="memory-card-face memory-card-front">
                    <span class="memory-card-content">${replaceEmojisWith3D(c.text, 'chip-3d-icon')}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    };

    if (DOM.p1InteractiveZone) DOM.p1InteractiveZone.innerHTML = createMemoryHtml(1);
    if (DOM.p2InteractiveZone) DOM.p2InteractiveZone.innerHTML = createMemoryHtml(2);

    if (state.soundEnabled && data.spokenText) {
      setTimeout(() => {
        if (!state.isQuestionAnswered && state.currentQuestion && state.currentQuestion.spokenText === data.spokenText) {
          audio.speakTurkishText(data.spokenText);
        }
      }, 350);
    }

    [DOM.p1InteractiveZone, DOM.p2InteractiveZone].forEach((zone, zIdx) => {
      if (!zone) return;
      const pNum = zIdx + 1;
      zone.querySelectorAll('.memory-flip-card').forEach(cardEl => {
        attachInstantTouch(cardEl, (e) => {
          const idx = parseInt(cardEl.getAttribute('data-card-idx'), 10);
          handleMemoryCardTap(pNum, idx, cardEl, e);
        });
      });
    });
  }

  function handleMemoryCardTap(playerNum, idx, cardEl, e) {
    if (state.isQuestionAnswered) return;
    if (state.gameMode === 'solo' && playerNum !== 1) return;
    if (playerNum === 1 && state.player1.isLocked) return;
    if (playerNum === 2 && state.player2.isLocked) return;

    const mState = memoryGameState[playerNum];
    if (!mState || mState.isBusy) return;

    if (cardEl.classList.contains('card-flipped') || cardEl.classList.contains('card-matched')) {
      return;
    }

    const pairKey = cardEl.getAttribute('data-pair-key');
    audio.playCardFlip();
    cardEl.classList.add('card-flipped');

    if (!mState.firstCard) {
      cardEl.classList.add('card-selected');
      mState.firstCard = { idx, pairKey, el: cardEl };
      return;
    }

    const first = mState.firstCard;
    const second = { idx, pairKey, el: cardEl };
    mState.firstCard = null;

    const rect = cardEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    if (first.pairKey === second.pairKey) {
      audio.playSnap();
      first.el.classList.remove('card-selected');
      first.el.classList.add('card-matched');
      second.el.classList.add('card-matched');

      if (window.gameParticles) {
        window.gameParticles.burst(cx, cy, 18, ['#10B981', '#34D399', '#FBBF24']);
      }

      mState.matchedCount++;
      if (mState.matchedCount >= mState.totalPairs) {
        awardPointAndProgress(playerNum, null, cx, cy);
      }
    } else {
      audio.playWrong();
      mState.isBusy = true;
      first.el.classList.add('card-mismatch');
      second.el.classList.add('card-mismatch');

      setTimeout(() => {
        first.el.classList.remove('card-flipped', 'card-selected', 'card-mismatch');
        second.el.classList.remove('card-flipped', 'card-mismatch');
        mState.isBusy = false;
      }, 700);

      applyLockout(playerNum, null);
    }
  }

  function renderInteractiveQuestion(q) {
    if (!q) return;

    if (q.type === 'visual_choice') {
      renderVisualChoiceArena(q);
    } else if (q.type === 'floating_balloon') {
      renderFloatingBalloonArena(q.interactiveData || q);
    } else if (q.type === 'memory' || q.type === 'memory_grid') {
      renderMemoryGridArena(q.interactiveData || q);
    } else if (q.type === 'true_false') {
      renderTrueFalseArena(q);
      startReflexTimer(q.timeLimit || 6000);
    } else if (q.type === 'matching') {
      renderMatchingArena(q.interactiveData || q);
    } else if (q.type === 'balloon' && q.interactiveData) {
      renderBalloonArena(q.interactiveData);
    } else if (q.type === 'shadow_match' && q.interactiveData) {
      renderShadowMatchArena(q.interactiveData);
    } else if (q.type === 'syllable_builder' && q.interactiveData) {
      renderSyllableBuilderArena(q.interactiveData);
    } else if (q.type === 'count_tap' && q.interactiveData) {
      renderCountTapArena(q.interactiveData);
    } else if (q.type === 'word_catch' && q.interactiveData) {
      renderWordCatchArena(q.interactiveData);
    }
  }

  // 1) 🎈 BALON PATLATMA SAHNESİ
  function renderBalloonArena(data) {
    const createBalloonsHtml = (playerNum) => {
      return `
        <div class="balloon-sky-grid">
          ${data.balloons.map((b, idx) => `
            <div class="balloon-item ${b.colorClass || 'balloon-color-red'}" 
                 data-balloon-idx="${idx}" 
                 data-player="${playerNum}"
                 role="button" tabindex="0">
              <span class="balloon-text">${replaceEmojisWith3D(b.text, 'q-3d-fruit')}</span>
              <div class="balloon-knot"></div>
              <div class="balloon-string"></div>
            </div>
          `).join('')}
        </div>
      `;
    };

    DOM.p1InteractiveZone.innerHTML = createBalloonsHtml(1);
    DOM.p2InteractiveZone.innerHTML = createBalloonsHtml(2);

    DOM.p1InteractiveZone.querySelectorAll('.balloon-item').forEach(el => {
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const idx = parseInt(el.getAttribute('data-balloon-idx'), 10);
        handleBalloonTap(1, idx, el);
      });
    });

    DOM.p2InteractiveZone.querySelectorAll('.balloon-item').forEach(el => {
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const idx = parseInt(el.getAttribute('data-balloon-idx'), 10);
        handleBalloonTap(2, idx, el);
      });
    });
  }

  function handleBalloonTap(playerNum, idx, el) {
    if (state.isQuestionAnswered) return;
    if (state.gameMode === 'solo' && playerNum !== 1) return;
    if (playerNum === 1 && state.player1.isLocked) return;
    if (playerNum === 2 && state.player2.isLocked) return;

    const balloon = state.currentQuestion.interactiveData.balloons[idx];
    if (!balloon) return;

    if (balloon.isTarget) {
      audio.playPop();
      el.classList.add('balloon-popping');

      // Diğer taraftaki balonu da patlat
      const otherZone = playerNum === 1 ? DOM.p2InteractiveZone : DOM.p1InteractiveZone;
      const otherEl = otherZone.querySelector(`.balloon-item[data-balloon-idx="${idx}"]`);
      if (otherEl) otherEl.classList.add('balloon-popping');

      awardPointAndProgress(playerNum);
    } else {
      audio.playWrong();
      el.classList.add('balloon-wrong');
      setTimeout(() => el.classList.remove('balloon-wrong'), 500);
      applyLockout(playerNum, null);
    }
  }

  // 2) 🧩 GÖRSEL & GÖLGE EŞLEŞTİRME SAHNESİ
  function renderShadowMatchArena(data) {
    const createCardsHtml = (playerNum) => {
      return `
        <div class="shadow-match-grid">
          ${data.cards.map((c, idx) => `
            <div class="shadow-card" data-card-idx="${idx}" data-player="${playerNum}" role="button" tabindex="0">
              ${EMOJI_TO_3D[c.emoji] 
                ? `<img src="${EMOJI_TO_3D[c.emoji]}" class="shadow-silhouette" alt="${c.name}">` 
                : `<span class="shadow-text-fallback">${c.emoji}</span>`
              }
              <span class="shadow-card-tag">Gölge</span>
            </div>
          `).join('')}
        </div>
      `;
    };

    DOM.p1InteractiveZone.innerHTML = createCardsHtml(1);
    DOM.p2InteractiveZone.innerHTML = createCardsHtml(2);

    DOM.p1InteractiveZone.querySelectorAll('.shadow-card').forEach(el => {
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const idx = parseInt(el.getAttribute('data-card-idx'), 10);
        handleShadowCardTap(1, idx, el);
      });
    });

    DOM.p2InteractiveZone.querySelectorAll('.shadow-card').forEach(el => {
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const idx = parseInt(el.getAttribute('data-card-idx'), 10);
        handleShadowCardTap(2, idx, el);
      });
    });
  }

  function handleShadowCardTap(playerNum, idx, el) {
    if (state.isQuestionAnswered) return;
    if (state.gameMode === 'solo' && playerNum !== 1) return;
    if (playerNum === 1 && state.player1.isLocked) return;
    if (playerNum === 2 && state.player2.isLocked) return;

    const card = state.currentQuestion.interactiveData.cards[idx];
    if (!card) return;

    if (card.isTarget) {
      el.classList.add('revealed');
      const tag = el.querySelector('.shadow-card-tag');
      if (tag) tag.textContent = 'Doğru! ' + card.name;

      const otherZone = playerNum === 1 ? DOM.p2InteractiveZone : DOM.p1InteractiveZone;
      const otherEl = otherZone.querySelector(`.shadow-card[data-card-idx="${idx}"]`);
      if (otherEl) {
        otherEl.classList.add('revealed');
        const otherTag = otherEl.querySelector('.shadow-card-tag');
        if (otherTag) otherTag.textContent = 'Doğru! ' + card.name;
      }

      awardPointAndProgress(playerNum);
    } else {
      audio.playWrong();
      el.classList.add('balloon-wrong');
      setTimeout(() => el.classList.remove('balloon-wrong'), 500);
      applyLockout(playerNum, null);
    }
  }

  // 3) 🔤 HECE & KELİME İNŞAATI SAHNESİ
  function renderSyllableBuilderArena(data) {
    p1SyllableProgress = [];
    p2SyllableProgress = [];

    const createBuilderHtml = (playerNum) => {
      return `
        <div class="syllable-builder-container">
          <div class="word-slot-row">
            ${data.parts.map((p, i) => `
              <div class="word-slot" data-slot-idx="${i}">?</div>
            `).join('')}
          </div>
          <div class="cubes-pool-row">
            ${data.cubes.map((c, i) => `
              <button class="syllable-cube cube-color-${i % 5}" data-cube-idx="${i}" data-cube-text="${c.text}">
                ${c.text}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    };

    DOM.p1InteractiveZone.innerHTML = createBuilderHtml(1);
    DOM.p2InteractiveZone.innerHTML = createBuilderHtml(2);

    DOM.p1InteractiveZone.querySelectorAll('.syllable-cube').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        handleSyllableCubeTap(1, btn);
      });
    });

    DOM.p2InteractiveZone.querySelectorAll('.syllable-cube').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        handleSyllableCubeTap(2, btn);
      });
    });
  }

  function handleSyllableCubeTap(playerNum, btn) {
    if (state.isQuestionAnswered) return;
    if (state.gameMode === 'solo' && playerNum !== 1) return;
    if (playerNum === 1 && state.player1.isLocked) return;
    if (playerNum === 2 && state.player2.isLocked) return;

    const data = state.currentQuestion.interactiveData;
    const progress = playerNum === 1 ? p1SyllableProgress : p2SyllableProgress;
    const cubeText = btn.getAttribute('data-cube-text');
    const expectedPart = data.parts[progress.length];

    if (cubeText === expectedPart) {
      audio.playSnap();
      progress.push(cubeText);
      btn.classList.add('used');

      const zone = playerNum === 1 ? DOM.p1InteractiveZone : DOM.p2InteractiveZone;
      const slot = zone.querySelector(`.word-slot[data-slot-idx="${progress.length - 1}"]`);
      if (slot) {
        slot.textContent = cubeText;
        slot.classList.add('filled');
      }

      // Kelime tamamlandı mı?
      if (progress.length === data.parts.length) {
        zone.querySelectorAll('.word-slot').forEach(s => s.classList.add('word-complete'));

        if (state.announcerEnabled && 'speechSynthesis' in window) {
          try {
            const u = new SpeechSynthesisUtterance(data.word);
            u.lang = 'tr-TR';
            window.speechSynthesis.speak(u);
          } catch (e) {}
        }

        awardPointAndProgress(playerNum);
      }
    } else {
      audio.playWrong();
      btn.classList.add('cube-wrong');
      setTimeout(() => btn.classList.remove('cube-wrong'), 400);
      applyLockout(playerNum, null);
    }
  }

  // 4) 🔢 KAÇ TANE VAR? DOKUNARAK SAYMA SAHNESİ
  function renderCountTapArena(data) {
    const itemImg = EMOJI_TO_3D[data.item.emoji]
      ? `<img src="${EMOJI_TO_3D[data.item.emoji]}" class="q-3d-fruit" alt="${data.item.name}">`
      : `<span class="count-fallback-icon">${data.item.emoji}</span>`;

    const createCountHtml = (playerNum) => {
      return `
        <div class="count-tap-container">
          <div class="count-objects-row">
            ${Array(data.count).fill(0).map((_, i) => `
              <div class="count-item-badge" data-item-idx="${i}" role="button" tabindex="0">
                ${itemImg}
              </div>
            `).join('')}
          </div>
          <div class="count-number-btns">
            ${[1, 2, 3, 4, 5].map(n => `
              <button class="count-num-btn" data-num="${n}" data-player="${playerNum}">
                ${n}
              </button>
            `).join('')}
          </div>
        </div>
      `;
    };

    DOM.p1InteractiveZone.innerHTML = createCountHtml(1);
    DOM.p2InteractiveZone.innerHTML = createCountHtml(2);

    [DOM.p1InteractiveZone, DOM.p2InteractiveZone].forEach((zone, pIdx) => {
      let tapCounter = 0;
      zone.querySelectorAll('.count-item-badge').forEach((el) => {
        el.addEventListener('pointerdown', () => {
          audio.playClick();
          tapCounter++;
          el.classList.add('tapped');
          if (!el.querySelector('.count-item-num')) {
            const badge = document.createElement('span');
            badge.className = 'count-item-num';
            badge.textContent = tapCounter;
            el.appendChild(badge);
          }
        });
      });

      zone.querySelectorAll('.count-num-btn').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          const pNum = pIdx + 1;
          if (state.isQuestionAnswered) return;
          if (state.gameMode === 'solo' && pNum !== 1) return;
          if (pNum === 1 && state.player1.isLocked) return;
          if (pNum === 2 && state.player2.isLocked) return;

          const chosenNum = parseInt(btn.getAttribute('data-num'), 10);
          if (chosenNum === data.count) {
            btn.style.background = '#10B981';
            btn.style.color = '#FFF';
            btn.style.borderColor = '#059669';
            awardPointAndProgress(pNum);
          } else {
            audio.playWrong();
            btn.classList.add('balloon-wrong');
            setTimeout(() => btn.classList.remove('balloon-wrong'), 500);
            applyLockout(pNum, null);
          }
        });
      });
    });
  }

  // 5) ⭐ HIZLI KELİME YAKALA SAHNESİ
  function renderWordCatchArena(data) {
    const createStarsHtml = (playerNum) => {
      return `
        <div class="word-catch-container">
          ${data.options.map((opt, idx) => `
            <button class="star-card-btn" data-opt-idx="${idx}" data-player="${playerNum}">
              <span class="star-card-icon">⭐</span>
              <span class="star-card-label">${replaceEmojisWith3D(opt.text, 'inline-3d-icon')}</span>
            </button>
          `).join('')}
        </div>
      `;
    };

    DOM.p1InteractiveZone.innerHTML = createStarsHtml(1);
    DOM.p2InteractiveZone.innerHTML = createStarsHtml(2);

    [DOM.p1InteractiveZone, DOM.p2InteractiveZone].forEach((zone, pIdx) => {
      zone.querySelectorAll('.star-card-btn').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          const pNum = pIdx + 1;
          if (state.isQuestionAnswered) return;
          if (state.gameMode === 'solo' && pNum !== 1) return;
          if (pNum === 1 && state.player1.isLocked) return;
          if (pNum === 2 && state.player2.isLocked) return;

          const idx = parseInt(btn.getAttribute('data-opt-idx'), 10);
          const opt = data.options[idx];
          if (opt && opt.isTarget) {
            btn.style.background = '#10B981';
            btn.style.color = '#FFF';
            btn.style.borderColor = '#059669';
            btn.querySelector('.star-card-label').style.color = '#FFF';
            awardPointAndProgress(pNum);
          } else {
            audio.playWrong();
            btn.classList.add('balloon-wrong');
            setTimeout(() => btn.classList.remove('balloon-wrong'), 500);
            applyLockout(pNum, null);
          }
        });
      });
    });
  }

  // 6) ⚡ DOĞRU / YANLIŞ REFLEKS SAHNESİ
  function renderTrueFalseArena(q) {
    const statement = q.statement || q.question || '';
    const createTfHtml = (playerNum) => {
      return `
        <div class="tf-reflex-arena">
          <div class="tf-statement-card">
            <div class="tf-statement-text">${replaceEmojisWith3D(statement, 'q-3d-item')}</div>
          </div>
          <div class="tf-buttons-row">
            <button class="tf-btn tf-btn-true" data-player="${playerNum}" data-val="true" role="button" aria-label="Doğru">
              <span class="tf-icon">✅</span>
              <span class="tf-title">DOĞRU</span>
              <span class="tf-hint">İLK SEN BAS!</span>
            </button>
            <button class="tf-btn tf-btn-false" data-player="${playerNum}" data-val="false" role="button" aria-label="Yanlış">
              <span class="tf-icon">❌</span>
              <span class="tf-title">YANLIŞ</span>
              <span class="tf-hint">İLK SEN BAS!</span>
            </button>
          </div>
        </div>
      `;
    };

    if (DOM.p1InteractiveZone) DOM.p1InteractiveZone.innerHTML = createTfHtml(1);
    if (DOM.p2InteractiveZone) DOM.p2InteractiveZone.innerHTML = createTfHtml(2);

    // Event listeners for Player 1
    if (DOM.p1InteractiveZone) {
      DOM.p1InteractiveZone.querySelectorAll('.tf-btn').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          const val = btn.getAttribute('data-val') === 'true';
          handleTrueFalseAnswer(1, val, btn);
        });
      });
    }

    // Event listeners for Player 2
    if (DOM.p2InteractiveZone) {
      DOM.p2InteractiveZone.querySelectorAll('.tf-btn').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          const val = btn.getAttribute('data-val') === 'true';
          handleTrueFalseAnswer(2, val, btn);
        });
      });
    }
  }

  function handleTrueFalseAnswer(playerNum, chosenVal, btnEl) {
    if (state.isQuestionAnswered) return;
    if (state.gameMode === 'solo' && playerNum !== 1) return;
    if (playerNum === 1 && state.player1.isLocked) return;
    if (playerNum === 2 && state.player2.isLocked) return;

    audio.stopQuestionAudio();

    const isCorrect = (chosenVal === state.currentQuestion.isTrue);
    const rect = btnEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    if (isCorrect) {
      stopReflexTimer();
      btnEl.classList.add('tf-correct-glow');
      awardPointAndProgress(playerNum, null, cx, cy);
    } else {
      btnEl.classList.add('tf-wrong-shake');
      setTimeout(() => {
        if (btnEl) btnEl.classList.remove('tf-wrong-shake');
      }, 420);
      applyLockout(playerNum, null);
    }
  }

  // 7) 🧩 DOKUN VE EŞLEŞTİR (MATCHING / CLICK TO MATCH) SAHNESİ
  let playerMatchState = {
    1: { selectedLeft: null, selectedRight: null, matchedCount: 0, totalPairs: 0, isLocked: false },
    2: { selectedLeft: null, selectedRight: null, matchedCount: 0, totalPairs: 0, isLocked: false }
  };

  function renderMatchingArena(data) {
    const rawPairs = data.pairs || [];
    const totalPairs = rawPairs.length;

    playerMatchState = {
      1: { selectedLeft: null, selectedRight: null, matchedCount: 0, totalPairs, isLocked: false },
      2: { selectedLeft: null, selectedRight: null, matchedCount: 0, totalPairs, isLocked: false }
    };

    const createMatchingHtml = (playerNum) => {
      // Sol sütun kartları (Orijinal sıra)
      const leftItems = rawPairs.map((p, idx) => ({ id: p.id || `pair_${idx}`, text: p.left }));
      // Sağ sütun kartları (Fisher-Yates ile karıştırılmış)
      const rightItems = QuestionEngine.fisherYatesShuffle(
        rawPairs.map((p, idx) => ({ id: p.id || `pair_${idx}`, text: p.right }))
      );

      return `
        <div class="matching-arena" data-player="${playerNum}">
          <div class="matching-col col-left">
            ${leftItems.map(item => `
              <div class="matching-card match-left" data-pair-id="${item.id}" data-side="left" role="button" tabindex="0">
                <span class="match-text">${replaceEmojisWith3D(item.text, 'chip-3d-icon')}</span>
                <span class="match-status-icon"></span>
              </div>
            `).join('')}
          </div>
          <div class="matching-divider-vs">➔</div>
          <div class="matching-col col-right">
            ${rightItems.map(item => `
              <div class="matching-card match-right" data-pair-id="${item.id}" data-side="right" role="button" tabindex="0">
                <span class="match-text">${replaceEmojisWith3D(item.text, 'chip-3d-icon')}</span>
                <span class="match-status-icon"></span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    };

    if (DOM.p1InteractiveZone) DOM.p1InteractiveZone.innerHTML = createMatchingHtml(1);
    if (DOM.p2InteractiveZone) DOM.p2InteractiveZone.innerHTML = createMatchingHtml(2);

    // Bind Player 1
    if (DOM.p1InteractiveZone) {
      DOM.p1InteractiveZone.querySelectorAll('.matching-card').forEach(card => {
        card.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          handleMatchingCardTap(1, card);
        });
      });
    }

    // Bind Player 2
    if (DOM.p2InteractiveZone) {
      DOM.p2InteractiveZone.querySelectorAll('.matching-card').forEach(card => {
        card.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          handleMatchingCardTap(2, card);
        });
      });
    }
  }

  function handleMatchingCardTap(playerNum, cardEl) {
    if (state.isQuestionAnswered) return;
    if (state.gameMode === 'solo' && playerNum !== 1) return;
    if (playerNum === 1 && state.player1.isLocked) return;
    if (playerNum === 2 && state.player2.isLocked) return;

    const pState = playerMatchState[playerNum];
    if (!pState || pState.isLocked) return;

    if (cardEl.classList.contains('card-matched')) return;

    audio.ensureContext();
    const side = cardEl.getAttribute('data-side');
    const pairId = cardEl.getAttribute('data-pair-id');

    if (side === 'left') {
      if (pState.selectedLeft && pState.selectedLeft.el === cardEl) {
        cardEl.classList.remove('card-selected');
        pState.selectedLeft = null;
        return;
      }
      if (pState.selectedLeft && pState.selectedLeft.el) {
        pState.selectedLeft.el.classList.remove('card-selected');
      }
      cardEl.classList.add('card-selected');
      pState.selectedLeft = { id: pairId, el: cardEl };
      audio.playSnap();

      if (pState.selectedRight) {
        checkMatchingPair(playerNum);
      }
    } else if (side === 'right') {
      if (pState.selectedRight && pState.selectedRight.el === cardEl) {
        cardEl.classList.remove('card-selected');
        pState.selectedRight = null;
        return;
      }
      if (pState.selectedRight && pState.selectedRight.el) {
        pState.selectedRight.el.classList.remove('card-selected');
      }
      cardEl.classList.add('card-selected');
      pState.selectedRight = { id: pairId, el: cardEl };
      audio.playSnap();

      if (pState.selectedLeft) {
        checkMatchingPair(playerNum);
      }
    }
  }

  function checkMatchingPair(playerNum) {
    const pState = playerMatchState[playerNum];
    if (!pState || !pState.selectedLeft || !pState.selectedRight) return;

    const left = pState.selectedLeft;
    const right = pState.selectedRight;
    const isMatch = (left.id === right.id);

    if (isMatch) {
      audio.playPop();

      left.el.classList.remove('card-selected');
      right.el.classList.remove('card-selected');
      left.el.classList.add('card-matched');
      right.el.classList.add('card-matched');

      const r1 = left.el.getBoundingClientRect();
      const r2 = right.el.getBoundingClientRect();
      particles.burst(r1.left + r1.width / 2, r1.top + r1.height / 2, 'stars');
      particles.burst(r2.left + r2.width / 2, r2.top + r2.height / 2, 'stars');

      pState.selectedLeft = null;
      pState.selectedRight = null;
      pState.matchedCount += 1;

      if (pState.matchedCount >= pState.totalPairs) {
        const panel = (playerNum === 1) ? DOM.p1Panel : DOM.p2Panel;
        let cx = window.innerWidth / 2;
        let cy = window.innerHeight / 2;
        if (panel) {
          const rect = panel.getBoundingClientRect();
          cx = rect.left + rect.width / 2;
          cy = rect.top + rect.height / 2;
        }
        awardPointAndProgress(playerNum, null, cx, cy);
      }
    } else {
      audio.playWrong();
      pState.isLocked = true;

      left.el.classList.add('card-mismatch');
      right.el.classList.add('card-mismatch');

      setTimeout(() => {
        if (left.el) left.el.classList.remove('card-selected', 'card-mismatch');
        if (right.el) right.el.classList.remove('card-selected', 'card-mismatch');
        pState.selectedLeft = null;
        pState.selectedRight = null;
        pState.isLocked = false;
      }, 420);
    }
  }

  function clearAllLockouts() {
    stopReflexTimer();
    clearTimeout(state.player1.lockTimer);
    clearTimeout(state.player2.lockTimer);
    if (state.player1.frostInterval) {
      clearInterval(state.player1.frostInterval);
      state.player1.frostInterval = null;
    }
    if (state.player2.frostInterval) {
      clearInterval(state.player2.frostInterval);
      state.player2.frostInterval = null;
    }
    state.player1.isLocked = false;
    state.player2.isLocked = false;
    if (DOM.p1LockOverlay) DOM.p1LockOverlay.classList.add('hide');
    if (DOM.p2LockOverlay) DOM.p2LockOverlay.classList.add('hide');
    document.querySelectorAll('.btn-frost-countdown').forEach(b => b.remove());
    document.querySelectorAll('.duel-option-btn.frost-locked').forEach(b => b.classList.remove('frost-locked'));
  }

  /* ==========================================================================
     16. MAÇ SONU & ZAFER EKRANI (VICTORY SCREEN)
     ========================================================================== */
  function triggerVictory(winner) {
    clearAllLockouts();
    DOM.solutionPopup.classList.add('hide');

    const isSolo = (state.gameMode === 'solo');
    const isP1 = (winner === state.player1);

    if (isSolo) {
      if (DOM.victorySubtitle) DOM.victorySubtitle.textContent = 'BİREYSEL PRATİK GÖREVİ';
      DOM.victoryWinnerTitle.textContent = 'Tebrikler, Görevi Tamamladın! 🎯';

      DOM.victoryBlueName.textContent = state.player1.name;
      DOM.victoryBlueScore.textContent = `${state.player1.score} ⭐`;

      if (DOM.victoryScoreVs) DOM.victoryScoreVs.style.display = 'none';
      if (DOM.victoryRedBox) DOM.victoryRedBox.style.display = 'none';

      if (DOM.victoryCongrats) {
        DOM.victoryCongrats.textContent = 'Harika bir odaklanma ve başarı! Bütün soruları tamamladın! 👏';
      }

      if (DOM.btnRematchSame) {
        DOM.btnRematchSame.innerHTML = '<span>🔄</span> Tekrar Pratik Yap';
      }
      if (DOM.btnSelectNewStudents) {
        DOM.btnSelectNewStudents.innerHTML = '<span>👤</span> Öğrenciyi Değiştir';
      }
    } else {
      if (DOM.victorySubtitle) DOM.victorySubtitle.textContent = 'SINIF DÜELLOSU ŞAMPİYONU';
      DOM.victoryWinnerTitle.textContent = `${winner.name} (${isP1 ? 'Mavi Takım' : 'Kırmızı Takım'}) Kazandı!`;

      DOM.victoryBlueName.textContent = state.player1.name;
      DOM.victoryBlueScore.textContent = state.player1.score;
      DOM.victoryRedName.textContent = state.player2.name;
      DOM.victoryRedScore.textContent = state.player2.score;

      if (DOM.victoryScoreVs) DOM.victoryScoreVs.style.display = '';
      if (DOM.victoryRedBox) DOM.victoryRedBox.style.display = '';

      if (DOM.victoryCongrats) {
        DOM.victoryCongrats.textContent = 'Harika bir dikkat ve hız mücadelesi oldu! Kazananı ve yarışan tüm arkadaşlarımızı alkışlayalım! 👏';
      }

      if (DOM.btnRematchSame) {
        DOM.btnRematchSame.innerHTML = '<span>🔄</span> Aynı Oyuncularla Rövanş';
      }
      if (DOM.btnSelectNewStudents) {
        DOM.btnSelectNewStudents.innerHTML = '<span>👥</span> Yeni Yarışmacılar Seç';
      }
    }

    DOM.victoryOverlay.classList.remove('hide');

    // Zafer Müziği, Sunucu Anonsu ve Konfeti Patlat
    audio.playVictory();
    changeMoliExpression('victory');
    if (!isSolo) {
      setDuelTimeout(() => {
        if (isP1) {
          audio.playAnnouncerBlueWin();
        } else {
          audio.playAnnouncerRedWin();
        }
      }, 350);
    }
    confetti.burst();

    // Sınıf ligine kaydet (yalnızca düelloda)
    if (!isSolo) {
      const loser = isP1 ? state.player2 : state.player1;
      recordDuelWinner(winner.name, loser.name, winner.score, loser.score);
    }

    // Zafer Skoru Paylaşım Bilgilerini Sakla
    lastVictoryScore = isSolo ? state.player1.score : (winner ? winner.score : state.player1.score);
    lastVictoryGameTitle = getCurrentGameTitle();

    // Analytics: Oyun / Düello Tamamlandı Raporu (Kullanım Süresi, Kazanan ve Skorlarla)
    const durationSec = state.matchStartTime ? Math.round((Date.now() - state.matchStartTime) / 1000) : 0;
    const winnerName = isSolo ? state.player1.name : (winner ? winner.name : 'Berabere');
    AnalyticsTracker.trackGameFinish(
      state.currentGameType,
      lastVictoryGameTitle,
      state.currentGrade,
      state.gameMode,
      winnerName,
      state.player1.score,
      state.player2.score,
      durationSec
    );
  }

  // Zafer Skoru Paylaşım Yardımcıları
  let lastVictoryScore = 5;
  let lastVictoryGameTitle = 'Matematik';

  function getVictoryShareMessage() {
    const title = lastVictoryGameTitle || getCurrentGameTitle();
    const score = lastVictoryScore || 5;
    return `🏆 Derse Bi' Mola'da ${title} düellosunda ${score} puan topladım! Sen de dene: https://dersebimola.com`;
  }

  function handleShareVictoryWhatsApp() {
    const text = getVictoryShareMessage();
    shareContent({
      title: "Derse Bi' Mola Zafer Skoru",
      text: text,
      url: 'https://dersebimola.com',
      directWhatsApp: true
    });
  }

  function handleCopyVictoryLink() {
    const text = getVictoryShareMessage();
    copyTextToClipboard(text).then(() => {
      audio.playPop();
      showShareToast("🏆 Zafer skoru kopyalandı! WhatsApp veya istediğiniz yere yapıştırabilirsiniz ✅");
    }).catch(() => {
      shareContent({
        title: "Derse Bi' Mola Zafer Skoru",
        text: text,
        url: 'https://dersebimola.com',
        directWhatsApp: true
      });
    });
  }

  function handleRematchSame() {
    audio.playClick();
    DOM.victoryOverlay.classList.add('hide');
    confetti.stop();
    startDuel(state.currentGameType);
  }

  function handleSelectNewStudentsFromVictory() {
    returnToLobby();
    openPickerModal();
  }

  function handleBackToLobby() {
    returnToLobby();
  }

  /* ==========================================================================
     17. ETKİNLİK DİNLEYİCİLERİ (EVENT LISTENERS)
     ========================================================================== */
  function setupEventListeners() {
    // -------------------------------------------------------------
    // Akıllı Tahta Güvenliği: Çift tıklama ve sağ tık menüsünü engelle
    // -------------------------------------------------------------
    document.addEventListener('contextmenu', e => e.preventDefault());

    // Header Kontrolleri (Moli & Derse Bi' Mola Birleşik Logo)
    if (DOM.logoBtn) {
      addTapListener(DOM.logoBtn, () => {
        audio.playClick();
        if (state.currentView === 'duel') {
          exitDuel();
        } else if (state.currentSection !== 'home') {
          openHomePage();
        } else {
          handleMoliClick();
        }
      });
    }

    if (DOM.btnToggleFullscreen) addTapListener(DOM.btnToggleFullscreen, toggleFullscreen);
    if (DOM.btnToggleSound) addTapListener(DOM.btnToggleSound, toggleSound);
    if (DOM.btnTeacherAuth) addTapListener(DOM.btnTeacherAuth, handleAuthClick);
    if (DOM.btnSimulateGoogleLogin) addTapListener(DOM.btnSimulateGoogleLogin, simulateGoogleLogin);

    // Sol Panel "🏠 Ana Sayfa" Butonu
    if (DOM.btnNavHome) {
      addTapListener(DOM.btnNavHome, () => {
        audio.playClick();
        openHomePage();
      });
    }

    // Dersler Ekranındaki "← Ana Sayfa" Butonu
    if (DOM.btnBackToHome) {
      addTapListener(DOM.btnBackToHome, (e) => {
        audio.playClick();
        openHomePage();
      });
    }

    // Pro Butonlar
    if (DOM.btnOpenPicker) addTapListener(DOM.btnOpenPicker, openPickerModal);
    if (DOM.btnOpenCustomQ) addTapListener(DOM.btnOpenCustomQ, openCustomQModal);
    if (DOM.btnOpenLeaderboard) addTapListener(DOM.btnOpenLeaderboard, openLeaderboardModal);
    if (DOM.btnResetLeague) addTapListener(DOM.btnResetLeague, resetLeagueScores);

    // Sınıf Çipleri (Header & Sidebar)
    if (DOM.gradeChips) {
      DOM.gradeChips.forEach(chip => {
        addTapListener(chip, () => {
          setGrade(chip.getAttribute('data-grade'));
        });
      });
    }

    // Sınıf Kartları (Lobi ve Vitrin)
    if (DOM.gradeCards) {
      DOM.gradeCards.forEach(card => {
        addTapListener(card, () => {
          setGrade(card.getAttribute('data-grade'));
        });
      });
    }

    // Ana Sayfa Vitrini: Dev Sınıf Kartları (🎈 Anasınıfı, 1., 2., 3., 4. Sınıf)
    if (DOM.homeGradeCards) {
      DOM.homeGradeCards.forEach(card => {
        addTapListener(card, () => {
          const g = card.getAttribute('data-grade');
          if (g !== null && g !== undefined) {
            setGrade(g);
          }
        });
      });
    }

    // Ana Sayfa Vitrini: Hızlı Başlat Oyun Kartları (🔥 Sınıfların Favori Düelloları)
    if (DOM.homePopularCards) {
      DOM.homePopularCards.forEach(card => {
        addTapListener(card, () => {
          const quickGame = card.getAttribute('data-quick-game');
          if (quickGame) {
            if (quickGame === 'firstreading' && state.currentGrade > 1) {
              state.currentGrade = 1;
            }
            audio.playClick();
            startDuel(quickGame);
          }
        });
      });
    }

    // Ana Sayfa Hero "Hemen Başla" Butonu (Sınıf Seçim Kartlarına Akıcı Kaydır)
    if (DOM.btnHeroStart) {
      addTapListener(DOM.btnHeroStart, (e) => {
        if (e && e.cancelable) e.preventDefault();
        audio.playClick();
        const section = document.querySelector('.home-section-container');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    // Lobi Hızlı Öğrenci Değiştir
    if (DOM.btnQuickDraw) addTapListener(DOM.btnQuickDraw, openPickerModal);

    // Hedef Puan Seçicileri
    if (DOM.targetScoreBtns) {
      DOM.targetScoreBtns.forEach(btn => {
        addTapListener(btn, () => {
          audio.playClick();
          DOM.targetScoreBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.targetScore = parseInt(btn.getAttribute('data-score'), 10);
          StorageManager.saveSettings();
        });
      });
    }

    // Çözüm Gösterme Switch'i
    if (DOM.chkAutoExplanation) {
      DOM.chkAutoExplanation.addEventListener('change', () => {
        state.showAutoExplanation = DOM.chkAutoExplanation.checked;
        StorageManager.saveSettings();
      });
    }

    // Sunucu Sesi Switch'i (Lobi)
    if (DOM.chkAnnouncerVoice) {
      DOM.chkAnnouncerVoice.addEventListener('change', () => {
        state.announcerEnabled = DOM.chkAnnouncerVoice.checked;
        StorageManager.saveSettings();
        updateAnnouncerUI();
        audio.playClick();
      });
    }

    // Düello İçi Anlık Sunucu Sesi Butonu (HUD)
    if (DOM.btnToggleAnnouncerDuel) {
      addTapListener(DOM.btnToggleAnnouncerDuel, () => {
        toggleAnnouncerVoice();
      });
    }

    // Soru Sesli Okuma Switch'i (Lobi)
    if (DOM.chkAutoReadQuestion) {
      DOM.chkAutoReadQuestion.addEventListener('change', () => {
        state.autoReadQuestion = DOM.chkAutoReadQuestion.checked;
        StorageManager.saveSettings();
        updateAutoReadUI();
        audio.playClick();
      });
    }

    // Düello İçi Soru Sesli Okuma Butonları (HUD & Her İki Oyuncu Kartı)
    if (DOM.btnHudReadQuestion) {
      addTapListener(DOM.btnHudReadQuestion, e => {
        if (e && e.cancelable) e.preventDefault();
        readCurrentQuestion(true);
      });
    }
    if (DOM.btnReadAloudP1) {
      addTapListener(DOM.btnReadAloudP1, e => {
        if (e && e.cancelable) e.preventDefault();
        readCurrentQuestion(true);
      });
    }
    if (DOM.btnReadAloudP2) {
      addTapListener(DOM.btnReadAloudP2, e => {
        if (e && e.cancelable) e.preventDefault();
        readCurrentQuestion(true);
      });
    }

    // Düello Kontrolleri: Çıkış butonuna basıldığı an beklemeden ve onay sormadan anında lobiye dön
    const handleExitAction = (e) => {
      if (e) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
      }
      returnToLobby();
    };
    if (DOM.btnExitDuel) {
      addTapListener(DOM.btnExitDuel, handleExitAction);
    }
    if (DOM.btnSkipQuestion) {
      addTapListener(DOM.btnSkipQuestion, () => {
        audio.playClick();
        state.questionNumber += 1;
        loadNextQuestion();
      });
    }

    if (DOM.btnToggleSolutionNow) {
      addTapListener(DOM.btnToggleSolutionNow, () => {
        audio.playClick();
        if (state.currentQuestion) {
          DOM.solutionText.textContent = state.currentQuestion.explanation;
          DOM.solutionPopup.classList.toggle('hide');
        }
      });
    }

    if (DOM.btnCloseSolution) {
      addTapListener(DOM.btnCloseSolution, () => {
        audio.playClick();
        DOM.solutionPopup.classList.add('hide');
      });
    }

    // Modal Çıkış Onayı Dinleyicileri (Mobilde anında ve takılmasız çıkış)
    if (DOM.btnConfirmExitYes) {
      addTapListener(DOM.btnConfirmExitYes, (e) => {
        if (e && e.cancelable) e.preventDefault();
        returnToLobby();
      });
    }
    if (DOM.btnConfirmExitNo) {
      addTapListener(DOM.btnConfirmExitNo, (e) => {
        if (e && e.cancelable) e.preventDefault();
        closeModal(DOM.modalConfirmExit);
      });
    }

    // -------------------------------------------------------------
    // Akıllı Tahta Multi-Touch Şık Butonları (Pointerdown)
    // -------------------------------------------------------------
    // 1. Oyuncu (Mavi)
    if (DOM.p1OptA) DOM.p1OptA.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(1, 0); });
    if (DOM.p1OptB) DOM.p1OptB.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(1, 1); });
    if (DOM.p1OptC) DOM.p1OptC.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(1, 2); });
    if (DOM.p1OptD) {
      DOM.p1OptD.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(1, 3); });
    }

    // 2. Oyuncu (Kırmızı)
    if (DOM.p2OptA) DOM.p2OptA.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(2, 0); });
    if (DOM.p2OptB) DOM.p2OptB.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(2, 1); });
    if (DOM.p2OptC) DOM.p2OptC.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(2, 2); });
    if (DOM.p2OptD) {
      DOM.p2OptD.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(2, 3); });
    }

    // Çarkıfelek Kura & Sınıf Yönetimi Butonları
    if (DOM.btnSpinWheel) addTapListener(DOM.btnSpinWheel, spinStudentWheel);
    if (DOM.btnApplySelectedStudents) addTapListener(DOM.btnApplySelectedStudents, applySelectedStudents);
    if (DOM.btnSaveRoster) addTapListener(DOM.btnSaveRoster, saveClassRoster);
    if (DOM.btnResetRoster) addTapListener(DOM.btnResetRoster, resetDefaultRoster);
    if (DOM.btnClearRoster) addTapListener(DOM.btnClearRoster, clearClassRoster);
    if (DOM.btnBackToStage) addTapListener(DOM.btnBackToStage, () => switchPickerView('stage'));
    if (DOM.btnPickerModeSingle) addTapListener(DOM.btnPickerModeSingle, () => setPickerMode('single'));
    if (DOM.btnPickerModeDuel) addTapListener(DOM.btnPickerModeDuel, () => setPickerMode('duel'));
    if (DOM.btnPickerTabRoster) addTapListener(DOM.btnPickerTabRoster, () => switchPickerView('roster'));
    if (DOM.btnAddTodaySelected) addTapListener(DOM.btnAddTodaySelected, addCurrentWinnerToToday);
    if (DOM.btnSpeakStudentName) addTapListener(DOM.btnSpeakStudentName, speakCurrentWinnerName);
    if (DOM.btnResetTodaySelected) addTapListener(DOM.btnResetTodaySelected, resetTodaySelected);
    if (DOM.chkExcludeToday) {
      DOM.chkExcludeToday.addEventListener('change', () => {
        state.excludeTodaySelected = DOM.chkExcludeToday.checked;
        updatePickerPoolStatus();
      });
    }

    // Özel Sınav Oluşturucu & Soru Bankası Butonları
    if (DOM.btnQuizAddQuestion) {
      addTapListener(DOM.btnQuizAddQuestion, handleQuizAddQuestion);
    }
    if (DOM.btnQuizSaveQuiz) {
      addTapListener(DOM.btnQuizSaveQuiz, handleQuizSaveQuiz);
    }
    document.querySelectorAll('input[name="quizCorrectRadio"]').forEach(radio => {
      radio.addEventListener('change', updateQuizRadioRowHighlights);
    });

    // Oyun Modu Seçimi (İki Kişilik Düello vs Tek Kişilik Pratik)
    if (DOM.btnModeDuel) {
      addTapListener(DOM.btnModeDuel, (e) => {
        if (e && e.cancelable) e.preventDefault();
        setGameMode('duel');
      });
    }
    if (DOM.btnModeSolo) {
      addTapListener(DOM.btnModeSolo, (e) => {
        if (e && e.cancelable) e.preventDefault();
        setGameMode('solo');
      });
    }
    if (DOM.btnDesktopGameMode) {
      addTapListener(DOM.btnDesktopGameMode, (e) => {
        if (e && e.cancelable) e.preventDefault();
        setGameMode(state.gameMode === 'duel' ? 'solo' : 'duel');
      });
    }
    if (DOM.btnSettingsModeToggle) {
      addTapListener(DOM.btnSettingsModeToggle, (e) => {
        if (e && e.cancelable) e.preventDefault();
        setGameMode(state.gameMode === 'duel' ? 'solo' : 'duel');
      });
    }

    // Sevimli Maskot Moli Dokunma / Tıklama
    if (DOM.moliWidget) {
      addTapListener(DOM.moliWidget, (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        audio.playClick();
        if (state.currentView === 'duel') {
          exitDuel();
        } else {
          handleMoliClick();
        }
      });
    }

    // Ders Listesine Geri Dönüş Butonu (1. Kademeye Dönüş)
    if (DOM.btnBackToSubjects) {
      addTapListener(DOM.btnBackToSubjects, (e) => {
        if (e && e.cancelable) e.preventDefault();
        returnToSubjectsList();
      });
    }

    // Zafer Ekranı Butonları
    if (DOM.btnRematchSame) addTapListener(DOM.btnRematchSame, handleRematchSame);
    if (DOM.btnSelectNewStudents) addTapListener(DOM.btnSelectNewStudents, handleSelectNewStudentsFromVictory);
    if (DOM.btnBackToLobby) addTapListener(DOM.btnBackToLobby, handleBackToLobby);
    if (DOM.btnShareVictoryWhatsApp) {
      addTapListener(DOM.btnShareVictoryWhatsApp, (e) => {
        if (e && e.cancelable) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();
        handleShareVictoryWhatsApp();
      });
    }
    if (DOM.btnCopyVictoryLink) {
      addTapListener(DOM.btnCopyVictoryLink, (e) => {
        if (e && e.cancelable) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();
        handleCopyVictoryLink();
      });
    }

    // Üst Bar ve Sol Menü Paylaş Butonları
    const handleGeneralShare = (e) => {
      if (e) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
      }
      shareContent({
        title: "Derse Bi' Mola",
        text: "🎯 Derse Bi' Mola - İlkokul ve Okul Öncesi Eğitici Oyun & Düello Platformu! Hemen tıkla ve sınıfla oyna: https://dersebimola.com",
        url: "https://dersebimola.com",
        directWhatsApp: false
      });
    };
    if (DOM.btnSidebarShare) {
      addTapListener(DOM.btnSidebarShare, handleGeneralShare);
    }
    if (DOM.btnTopbarShare) {
      addTapListener(DOM.btnTopbarShare, handleGeneralShare);
    }

    // Ana Sayfa Vitrini Popüler Oyun Kartlarındaki Paylaş Butonları
    document.querySelectorAll('.home-popular-card .card-share-btn').forEach(btn => {
      addTapListener(btn, (e) => {
        if (e && e.cancelable) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();
        const title = btn.getAttribute('data-share-title') || 'Oyun';
        shareActivity(title);
      });
    });

    // =========================================================================
    // MOBİL TELEFON GÖRÜNÜMÜ & VİTRİN ETKİLEŞİMLERİ (1:1 Mobil Tasarım)
    // =========================================================================
    const btnMobileLogin = document.getElementById('btnMobileLogin');
    const btnMobileNoticeBanner = document.getElementById('btnMobileNoticeBanner');
    const btnMobileShare = document.getElementById('btnMobileShare');
    const btnMobileMenu = document.getElementById('btnMobileMenu');
    const mobileDrawerBackdrop = document.getElementById('mobileDrawerBackdrop');
    const btnMobileLogo = document.getElementById('btnMobileLogo');
    const btnMobileHeroStart = document.getElementById('btnMobileHeroStart');
    const btnMobileQuickClasses = document.getElementById('btnMobileQuickClasses');
    const btnMobileQuickDuels = document.getElementById('btnMobileQuickDuels');
    const appSidebar = document.getElementById('appSidebar');

    if (btnMobileLogin) {
      addTapListener(btnMobileLogin, (e) => {
        audio.playClick();
        handleAuthClick();
      });
    }

    if (btnMobileNoticeBanner) {
      addTapListener(btnMobileNoticeBanner, (e) => {
        audio.playClick();
        handleAuthClick();
      });
    }

    if (btnMobileShare) {
      addTapListener(btnMobileShare, handleGeneralShare);
    }

    const closeMobileSidebar = () => {
      if (appSidebar) appSidebar.classList.remove('sidebar-mobile-open');
      if (mobileDrawerBackdrop) mobileDrawerBackdrop.classList.remove('active');
      document.body.classList.remove('mobile-drawer-locked');
    };

    const toggleMobileSidebar = (e) => {
      if (e) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
      }
      audio.playClick();
      if (appSidebar) {
        const isOpen = appSidebar.classList.toggle('sidebar-mobile-open');
        if (mobileDrawerBackdrop) {
          mobileDrawerBackdrop.classList.toggle('active', isOpen);
        }
        document.body.classList.toggle('mobile-drawer-locked', isOpen);
      }
    };

    if (btnMobileMenu) {
      addTapListener(btnMobileMenu, toggleMobileSidebar);
    }

    const btnSidebarClose = document.getElementById('btnSidebarClose');
    if (btnSidebarClose) {
      addTapListener(btnSidebarClose, (e) => {
        audio.playClick();
        closeMobileSidebar();
      });
    }

    if (mobileDrawerBackdrop) {
      addTapListener(mobileDrawerBackdrop, (e) => {
        closeMobileSidebar();
      });
    }

    // Mobil menüdeki herhangi bir öğeye tıklandığında çekmeceyi otomatik kapat
    if (appSidebar) {
      appSidebar.querySelectorAll('.sidebar-item, .grade-chip, .sidebar-home-btn, .sidebar-sub-item').forEach(el => {
        addTapListener(el, () => {
          setTimeout(closeMobileSidebar, 150);
        });
      });
    }

    if (btnMobileLogo) {
      addTapListener(btnMobileLogo, (e) => {
        audio.playClick();
        if (state.currentView === 'duel') {
          exitDuel();
        } else if (state.currentSection !== 'home') {
          openHomePage();
        } else {
          handleMoliClick();
        }
      });
    }

    if (btnMobileHeroStart) {
      addTapListener(btnMobileHeroStart, (e) => {
        audio.playClick();
        const section = document.querySelector('.home-section-container');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          setGrade(1);
        }
      });
    }

    if (btnMobileQuickClasses) {
      addTapListener(btnMobileQuickClasses, (e) => {
        audio.playClick();
        const section = document.querySelector('.home-section-container');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          setGrade(1);
        }
      });
    }

    if (btnMobileQuickDuels) {
      addTapListener(btnMobileQuickDuels, (e) => {
        audio.playClick();
        setGameMode('duel');
        const section = document.querySelector('.home-popular-grid') || document.querySelector('.home-section-container');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    // Mobil Hızlı Liste Çipleri
    document.querySelectorAll('.mobile-quick-list-section .quick-list-chip').forEach(chip => {
      addTapListener(chip, (e) => {
        const gradeAttr = chip.getAttribute('data-grade');
        if (gradeAttr !== null && gradeAttr !== undefined) {
          setGrade(gradeAttr);
        }
      });
    });

    // Mobil Moli Maskotu ve Rozet Etkileşimleri
    const mobileMoliMascot = document.querySelector('.mobile-moli-mascot-wrap');
    if (mobileMoliMascot) {
      addTapListener(mobileMoliMascot, (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        audio.playClick();
        handleMoliClick();
      });
    }

    const pillBadgeMath = document.querySelector('.pill-badge-math');
    if (pillBadgeMath) {
      addTapListener(pillBadgeMath, () => {
        audio.playCorrect();
        showToast('🧮 4 + 5 = 9! Matematik harika!');
      });
    }

    const pillBadgeLetters = document.querySelector('.pill-badge-letters');
    if (pillBadgeLetters) {
      addTapListener(pillBadgeLetters, () => {
        audio.playClick();
        showToast('🔤 A B C - Harfleri öğrenmeye hazır mısın?');
      });
    }

    const badgeTrophy = document.querySelector('.badge-circle-trophy');
    if (badgeTrophy) {
      addTapListener(badgeTrophy, () => {
        audio.playFanfare();
        openLeaderboardModal();
      });
    }

    const badgeBalloon = document.querySelector('.badge-circle-balloon');
    if (badgeBalloon) {
      addTapListener(badgeBalloon, () => {
        audio.playPop();
        if (typeof launchConfetti === 'function') launchConfetti();
      });
    }

    const pillBadgePoints = document.querySelector('.pill-badge-points');
    if (pillBadgePoints) {
      addTapListener(pillBadgePoints, () => {
        audio.playCorrect();
        showToast('⭐ +10 Puan Kazandın! Tebrikler!');
      });
    }

    const pillBadgeReady = document.querySelector('.pill-badge-ready');
    if (pillBadgeReady) {
      addTapListener(pillBadgeReady, () => {
        audio.playClick();
        showToast('🤖 Moli seninle oynamaya hazır!');
      });
    }

    // =========================================================================
    // AKILLI TAHTA, TABLET & BİLGİSAYAR VİTRİNİ ETKİLEŞİMLERİ (WIDESCREEN SHOWCASE)
    // =========================================================================
    const btnDesktopHome = document.getElementById('btnDesktopHome');
    if (btnDesktopHome) {
      addTapListener(btnDesktopHome, (e) => {
        audio.playClick();
        if (state.currentView === 'duel') {
          exitDuel();
        } else if (state.currentSection !== 'home') {
          openHomePage();
        } else {
          handleMoliClick();
        }
      });
    }

    const btnDesktopLogin = document.getElementById('btnDesktopLogin');
    if (btnDesktopLogin) {
      addTapListener(btnDesktopLogin, () => {
        handleAuthClick();
      });
    }

    const desktopNoticeBanner = document.getElementById('desktopNoticeBanner');
    if (desktopNoticeBanner) {
      addTapListener(desktopNoticeBanner, () => {
        handleAuthClick();
      });
    }

    const btnDesktopShare = document.getElementById('btnDesktopShare');
    if (btnDesktopShare) {
      addTapListener(btnDesktopShare, handleGeneralShare);
    }

    const btnDesktopAddQuiz = document.getElementById('btnDesktopAddQuiz');
    if (btnDesktopAddQuiz) {
      addTapListener(btnDesktopAddQuiz, () => {
        openCustomQModal();
      });
    }

    const btnDesktopSettings = document.getElementById('btnDesktopSettings');
    if (btnDesktopSettings) {
      addTapListener(btnDesktopSettings, () => {
        openSettingsModal();
      });
    }

    const btnSidebarSettings = document.getElementById('btnSidebarSettings');
    if (btnSidebarSettings) {
      addTapListener(btnSidebarSettings, () => {
        closeMobileSidebar();
        openSettingsModal();
      });
    }

    const btnSettingsSoundToggle = document.getElementById('btnSettingsSoundToggle');
    if (btnSettingsSoundToggle) {
      addTapListener(btnSettingsSoundToggle, () => {
        toggleSound();
        updateSettingsModalUI();
      });
    }

    const btnSettingsAnnouncerToggle = document.getElementById('btnSettingsAnnouncerToggle');
    if (btnSettingsAnnouncerToggle) {
      addTapListener(btnSettingsAnnouncerToggle, () => {
        toggleAnnouncerVoice();
        updateSettingsModalUI();
      });
    }

    const btnSettingsAutoReadToggle = document.getElementById('btnSettingsAutoReadToggle');
    if (btnSettingsAutoReadToggle) {
      addTapListener(btnSettingsAutoReadToggle, () => {
        state.autoReadQuestion = !state.autoReadQuestion;
        StorageManager.saveSettings();
        updateAutoReadUI();
        updateSettingsModalUI();
        audio.playClick();
      });
    }

    const btnSettingsExplanationToggle = document.getElementById('btnSettingsExplanationToggle');
    if (btnSettingsExplanationToggle) {
      addTapListener(btnSettingsExplanationToggle, () => {
        state.showAutoExplanation = !state.showAutoExplanation;
        StorageManager.saveSettings();
        updateSettingsModalUI();
        audio.playClick();
      });
    }

    const btnSettingsFullscreenAction = document.getElementById('btnSettingsFullscreenAction');
    if (btnSettingsFullscreenAction) {
      addTapListener(btnSettingsFullscreenAction, () => {
        toggleFullscreen();
      });
    }

    const btnDesktopMenu = document.getElementById('btnDesktopMenu');
    if (btnDesktopMenu) {
      addTapListener(btnDesktopMenu, toggleMobileSidebar);
    }

    const btnDesktopHeroStart = document.getElementById('btnDesktopHeroStart');
    const modalSelectGrade = document.getElementById('modalSelectGrade');
    if (btnDesktopHeroStart) {
      addTapListener(btnDesktopHeroStart, (e) => {
        audio.playClick();
        if (modalSelectGrade) {
          openModal(modalSelectGrade);
        } else {
          setGrade(1);
        }
      });
    }

    // Modal içindeki sınıf kartları seçilince
    document.querySelectorAll('[data-modal-grade]').forEach(card => {
      addTapListener(card, (e) => {
        audio.playClick();
        const g = card.getAttribute('data-modal-grade');
        if (modalSelectGrade) {
          closeModal(modalSelectGrade);
        }
        if (g !== null && g !== undefined) {
          setGrade(g);
        }
      });
    });

    const btnModalEnglish = document.getElementById('btnModalEnglish');
    if (btnModalEnglish) {
      addTapListener(btnModalEnglish, (e) => {
        audio.playClick();
        if (modalSelectGrade) {
          closeModal(modalSelectGrade);
        }
        setGrade(2);
        if (typeof selectSubject === 'function') {
          selectSubject('english');
        }
      });
    }

    // 7 Adet Dikey Sınıf / Ders Kartı (Sol Sütun)
    document.querySelectorAll('.stage-grades-sidebar .stage-grade-card[data-grade]').forEach(card => {
      addTapListener(card, (e) => {
        const g = card.getAttribute('data-grade');
        if (g !== null && g !== undefined) {
          setGrade(g);
        }
      });
    });

    function handleQuickDuelsClick() {
      audio.playClick();
      setGameMode('duel');
      setGrade(1);
      if (typeof selectSubject === 'function') {
        selectSubject('grade1_extra');
      }
      const modalSelectGrade = document.getElementById('modalSelectGrade');
      if (modalSelectGrade) closeModal(modalSelectGrade);
    }

    const btnStageQuickDuels = document.getElementById('btnStageQuickDuels');
    if (btnStageQuickDuels) {
      addTapListener(btnStageQuickDuels, handleQuickDuelsClick);
    }

    const btnModalDuels = document.getElementById('btnModalDuels');
    if (btnModalDuels) {
      addTapListener(btnModalDuels, handleQuickDuelsClick);
    }

    const btnSidebarDuels = document.getElementById('btnSidebarDuels');
    if (btnSidebarDuels) {
      addTapListener(btnSidebarDuels, handleQuickDuelsClick);
    }

    const btnStageQuickEnglish = document.getElementById('btnStageQuickEnglish');
    if (btnStageQuickEnglish) {
      addTapListener(btnStageQuickEnglish, (e) => {
        audio.playClick();
        setGrade(2);
        if (typeof selectSubject === 'function') {
          selectSubject('english');
        }
      });
    }

    // Sağ Sütundaki Rozetler
    const btnPillMath = document.getElementById('btnPillMath');
    if (btnPillMath) {
      addTapListener(btnPillMath, () => {
        audio.playCorrect();
        showToast('🧮 4 + 5 = 9! Matematik harika!');
      });
    }

    const btnPillLetters = document.getElementById('btnPillLetters');
    if (btnPillLetters) {
      addTapListener(btnPillLetters, () => {
        audio.playClick();
        showToast('🔤 A B C - Harfleri öğrenmeye hazır mısın?');
      });
    }

    const btnStageCircleTrophy = document.getElementById('btnStageCircleTrophy');
    if (btnStageCircleTrophy) {
      addTapListener(btnStageCircleTrophy, () => {
        audio.playFanfare();
        openLeaderboardModal();
      });
    }

    const btnStageCircleBalloon = document.getElementById('btnStageCircleBalloon');
    if (btnStageCircleBalloon) {
      addTapListener(btnStageCircleBalloon, () => {
        audio.playPop();
        if (typeof launchConfetti === 'function') launchConfetti();
      });
    }

    const btnPillPoints = document.getElementById('btnPillPoints');
    if (btnPillPoints) {
      addTapListener(btnPillPoints, () => {
        audio.playCorrect();
        showToast('⭐ +10 Puan Kazandın! Harikasın!');
      });
    }

    const btnPillReady = document.getElementById('btnPillReady');
    if (btnPillReady) {
      addTapListener(btnPillReady, () => {
        audio.playClick();
        showToast('🤖 Moli seninle oynamaya hazır!');
      });
    }

    const widescreenMoliRobot = document.getElementById('widescreenMoliRobot');
    if (widescreenMoliRobot) {
      addTapListener(widescreenMoliRobot, (e) => {
        if (e) e.stopPropagation();
        audio.playClick();
        handleMoliClick();
      });
    }
  }

  /* ==========================================================================
     18. BAŞLANGIÇ (BOOTSTRAP)
     ========================================================================== */
  function init() {
    StorageManager.loadAll();
    loadSpeechIndex();
    updateSoundUI();
    updateAnnouncerUI();
    updateAutoReadUI();
    updateTeacherAuthUI();
    updateGameModeUI();
    updatePlayerNamesUI();
    renderSubjects();
    openHomePage(); // Varsayılan olarak Ana Sayfa Vitrini ile başla!

    // Kayıtlı ayarları UI'a yansıt
    if (DOM.chkAutoExplanation) {
      DOM.chkAutoExplanation.checked = state.showAutoExplanation;
    }
    if (DOM.chkAutoReadQuestion) {
      DOM.chkAutoReadQuestion.checked = state.autoReadQuestion;
    }
    if (DOM.targetScoreBtns) {
      DOM.targetScoreBtns.forEach(btn => {
        const s = parseInt(btn.getAttribute('data-score'), 10);
        btn.classList.toggle('active', s === state.targetScore);
      });
    }

    updateSettingsModalUI();
    setupEventListeners();
    console.log("🎯 Derse Bi' Mola başarıyla başlatıldı. MEB Fatih & ETAP uyumlu.");
  }

  // Dışarıdan ve konsoldan erişim için fonksiyonları globalde tanımla
  window.changeMoliExpression = changeMoliExpression;
  window.returnToLobby = returnToLobby;
  window.exitDuel = exitDuel;
  window.startDuel = startDuel;
  window.selectSubject = selectSubject;
  window.returnToSubjectsList = returnToSubjectsList;
  window.renderSubjects = renderSubjects;
  window.openHomePage = openHomePage;
  window.setGrade = setGrade;
  window.shareContent = shareContent;
  window.shareActivity = shareActivity;
  window.showShareToast = showShareToast;
  window.openSettingsModal = openSettingsModal;
  window.updateSettingsModalUI = updateSettingsModalUI;
  window.speechKey = speechKey;
  window.normalizeSpeechText = normalizeSpeechText;
  window.loadSpeechIndex = loadSpeechIndex;
  window.GRADE_SUBJECTS_CONFIG = GRADE_SUBJECTS_CONFIG;
  window.QuestionEngine = QuestionEngine;

  // DOM hazır olduğunda başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
