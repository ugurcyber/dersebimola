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
     2. SES MOTORU: WEB AUDIO API (SIFIR HARİCİ SES DOSYASI)
     ========================================================================== */
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.currentAudio = null;
      this.currentAnnouncerAudio = null;
      this.ttsTimeout = null;
      this.ttsReady = false;
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
        // Matematik sembollerini doğal Türkçe metne dönüştür:
        // + -> "artı", - -> "eksi", x veya * -> "çarpı", / veya ÷ -> "bölü", = -> "eşittir"
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
      }

      if (!cleanText) {
        if (onEnded) onEnded();
        return;
      }

      let done = false;
      const finish = () => {
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
      // MEB Pardus ve Linux akıllı tahtalarda Almanca veya bozuk sesleri
      // engellemek için STRICT tr-TR zorlaması ve ses filtresi uygulanır
      // -------------------------------------------------------------
      const playWithSpeechSynthesis = () => {
        if (done) return;
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
            // SADECE Türkçe sesleri ara ve eşle (Almanca 'de' veya İngilizce 'en' sesleri KESİNLİKLE seçilmez)
            matchedVoice = voices.find(v => 
              (v.lang && (v.lang === 'tr-TR' || v.lang.toLowerCase().startsWith('tr') || v.lang === 'tr')) ||
              (v.name && (v.name.toLowerCase().includes('turkish') || v.name.toLowerCase().includes('türkçe') || v.name.toLowerCase().includes('yelda') || v.name.toLowerCase().includes('tolga')))
            );
          }

          if (matchedVoice) {
            u.voice = matchedVoice;
          } else {
            // Sistemde Türkçe ses tanımlı değilse yabancı ses atama, sadece lang zorlaması yap
            u.lang = synthLang;
          }

          u.onend = finish;
          u.onerror = finish;
          window.speechSynthesis.speak(u);
        } catch (e) {
          finish();
        }
      };

      // -------------------------------------------------------------
      // BİRİNCİL SES MOTORU: Online Doğal Türkçe TTS (Google TTS Ses Akışı)
      // MEB Pardus akıllı tahta dahil tüm cihazlarda kusursuz doğal Türkçe
      // -------------------------------------------------------------
      let fallbackTriggered = false;
      const triggerFallback = () => {
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
        try {
          const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${ttsLang}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
          const audioEl = new Audio(googleUrl);
          this.currentAudio = audioEl;
          audioEl.volume = 1.0;

          // Ağ engeli veya bağlantı kopukluğunda takılı kalmayı önleyen güvenlik zamanlayıcısı
          this.ttsTimeout = setTimeout(() => {
            triggerFallback();
          }, 3500);

          audioEl.onplaying = () => {
            if (this.ttsTimeout) {
              clearTimeout(this.ttsTimeout);
              this.ttsTimeout = null;
            }
          };

          audioEl.onended = () => {
            if (this.ttsTimeout) {
              clearTimeout(this.ttsTimeout);
              this.ttsTimeout = null;
            }
            finish();
          };

          audioEl.onerror = () => {
            triggerFallback();
          };

          const p = audioEl.play();
          if (p !== undefined) {
            p.catch(() => {
              triggerFallback();
            });
          }
        } catch (err) {
          triggerFallback();
        }
      };

      // Birincil olarak doğal online TTS çalıştırılır
      playWithGoogleTts();
    }

    speakTurkishText(text, onEnded) {
      this.speakText(text, 'tr', onEnded);
    }

    speakEnglishText(text, onEnded) {
      this.speakText(text, 'en', onEnded);
    }

    stopQuestionAudio() {
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
    '🏮': 'assets/icons/3d/balloon.png'
  };

  const EMOJI_KEYS_SORTED = Object.keys(EMOJI_TO_3D).sort((a, b) => b.length - a.length);

  function replaceEmojisWith3D(str, customClass = 'inline-3d-icon') {
    if (!str || typeof str !== 'string') return str || '';
    let result = str;
    for (let i = 0; i < EMOJI_KEYS_SORTED.length; i++) {
      const key = EMOJI_KEYS_SORTED[i];
      if (result.indexOf(key) !== -1) {
        const iconPath = EMOJI_TO_3D[key];
        const imgTag = `<img src="${iconPath}" class="${customClass}" alt="" draggable="false" loading="lazy" decoding="async">`;
        result = result.split(key).join(imgTag);
      }
    }
    return result;
  }

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
      let pool = this.grade1BalloonLevelsPool;
      if (levelType === 'reading' || levelType === 'letters') {
        pool = pool.filter(l => l.category.includes('Harfler') || l.category.includes('Heceler'));
      } else if (levelType === 'rhythmic' || levelType === 'math') {
        pool = pool.filter(l => l.category.includes('Sayılar') || l.category.includes('Ritmik') || l.category.includes('Toplama'));
      }
      if (!pool || pool.length === 0) pool = this.grade1BalloonLevelsPool;

      const level = this.drawFromPool(pool, 'grade1BalloonLevelsPool') || pool[Math.floor(Math.random() * pool.length)];
      const colorClasses = [
        'balloon-color-red', 'balloon-color-blue', 'balloon-color-green', 
        'balloon-color-yellow', 'balloon-color-purple', 'balloon-color-pink', 'balloon-color-orange'
      ];

      const targetList = level.targets || [level.target];
      const distractorList = level.distractors || ['A', 'B', 'C', 'D'];
      const targetCount = level.targetsNeeded || 2;
      const balloons = [];

      for (let i = 0; i < targetCount; i++) {
        const tVal = targetList[i % targetList.length];
        balloons.push({ text: tVal, isTarget: true });
      }

      const distCount = 4;
      for (let i = 0; i < distCount; i++) {
        const dVal = distractorList[i % distractorList.length];
        balloons.push({ text: dVal, isTarget: false });
      }

      const shuffledBalloons = this.fisherYatesShuffle(balloons).map((b, idx) => {
        const speed = parseFloat((4.8 + Math.random() * 2.2).toFixed(2));
        const delay = parseFloat((idx * 0.35 + Math.random() * 0.25).toFixed(2));
        const left = Math.floor(6 + (idx * 14 + Math.random() * 6) % 78);
        return {
          ...b,
          colorClass: colorClasses[idx % colorClasses.length],
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
          cat = Math.random() < 0.6 ? 'antonyms' : 'letters';
        } else {
          const r = Math.random();
          if (r < 0.35) cat = 'letters';
          else if (r < 0.7) cat = 'antonyms';
          else cat = 'math';
        }
      }

      const rawPool = this.matchingPairsPool[cat] || this.matchingPairsPool.antonyms;
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
      if (cat === 'letters') {
        themeTitle = '🔤 Büyük Harf - Küçük Harf Eşleştirmesi! Eşini bul.';
        categoryName = '🔤 Harf Hafıza Kartları';
      } else if (cat === 'antonyms') {
        themeTitle = '🔄 Zıt Anlamlı Kelimeleri Eşleştir!';
        categoryName = '🔄 Zıt Anlam Hafızası';
      } else if (cat === 'math') {
        themeTitle = '➕ Toplama İşlemi ve Sonucunu Eşleştir!';
        categoryName = '➕ Toplama Eşleştirme Kartları';
      }

      return {
        type: 'memory',
        question: themeTitle,
        spokenText: themeTitle.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, ' '),
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
      // 1) Hayvanlar (12 Soru)
      { prompt: 'Hangi sevimli dostumuz "MİYAV" der? 🐾', spokenText: 'Hangi sevimli hayvan miyav der? Kediye dokun.', category: 'Hayvanlar', correct: 'Kedi', cards: [{ text: 'Kedi', icon: '🐱', isCorrect: true }, { text: 'Köpek', icon: '🐶', isCorrect: false }, { text: 'İnek', icon: '🐮', isCorrect: false }], exp: 'Kediler sevilmeyi çok sever ve "Miyav" derler! 🐱👏' },
      { prompt: 'Hangi sadık dostumuz "HAV HAV" der? 🦴', spokenText: 'Hangi sadık dostumuz hav hav der? Köpeğe dokun.', category: 'Hayvanlar', correct: 'Köpek', cards: [{ text: 'Köpek', icon: '🐶', isCorrect: true }, { text: 'Kedi', icon: '🐱', isCorrect: false }, { text: 'Civciv', icon: '🐥', isCorrect: false }], exp: 'Köpekler kuyruklarını sallayarak "Hav hav" derler! 🐶👏' },
      { prompt: 'Bize taze ve sağlıklı süt veren sevimli hayvan hangisidir? 🥛', spokenText: 'Bize taze ve sağlıklı süt veren hayvan hangisidir? İneğe dokun.', category: 'Hayvanlar', correct: 'İnek', cards: [{ text: 'İnek', icon: '🐮', isCorrect: true }, { text: 'Aslan', icon: '🦁', isCorrect: false }, { text: 'Kurt', icon: '🐺', isCorrect: false }], exp: 'İnekler "Mööö" der ve bize bembeyaz süt verir! 🥛🐄' },
      { prompt: 'Ormanların güçlü ve yeleli kralı hangisidir? 👑', spokenText: 'Ormanların güçlü ve yeleli kralı hangisidir? Aslana dokun.', category: 'Hayvanlar', correct: 'Aslan', cards: [{ text: 'Aslan', icon: '🦁', isCorrect: true }, { text: 'Maymun', icon: '🐵', isCorrect: false }, { text: 'Tavşan', icon: '🐰', isCorrect: false }], exp: 'Aslan güçlü kükremesiyle ormanların kralıdır! 🦁👑' },
      { prompt: 'Havuç yemeyi çok seven, uzun kulaklı zıp zıp hayvan hangisidir? 🥕', spokenText: 'Havuç yemeyi çok seven, uzun kulaklı hayvan hangisidir? Tavşana dokun.', category: 'Hayvanlar', correct: 'Tavşan', cards: [{ text: 'Tavşan', icon: '🐰', isCorrect: true }, { text: 'Ayı', icon: '🐻', isCorrect: false }, { text: 'Kurbağa', icon: '🐸', isCorrect: false }], exp: 'Tavşanlar zıp zıp zıplar ve çıtır havuç yer! 🐰🥕' },
      { prompt: 'Mavi denizlerde yüzgeçleriyle yüzen sevimli canlı hangisidir? 🌊', spokenText: 'Mavi denizlerde yüzgeçleriyle yüzen canlı hangisidir? Balığa dokun.', category: 'Hayvanlar', correct: 'Balık', cards: [{ text: 'Balık', icon: '🐟', isCorrect: true }, { text: 'Kuş', icon: '🐦', isCorrect: false }, { text: 'Kedi', icon: '🐱', isCorrect: false }], exp: 'Balıklar denizde yüzer ve solungaçlarıyla nefes alır! 🐟🌊' },
      { prompt: 'Gökyüzünde kanat çırparak uçan ve "Cik cik" öten hangisidir? 🌳', spokenText: 'Gökyüzünde uçan ve cik cik öten hangisidir? Kuşa dokun.', category: 'Hayvanlar', correct: 'Kuş', cards: [{ text: 'Kuş', icon: '🐦', isCorrect: true }, { text: 'Kaplumbağa', icon: '🐢', isCorrect: false }, { text: 'Köpek', icon: '🐶', isCorrect: false }], exp: 'Kuşlar kanatlarını açıp gökyüzünde süzülür! 🐦🌿' },
      { prompt: 'Kocaman kulakları ve uzun bir hortumu olan dev hayvan hangisidir? 🐘', spokenText: 'Kocaman kulakları ve uzun bir hortumu olan hayvan hangisidir? File dokun.', category: 'Hayvanlar', correct: 'Fil', cards: [{ text: 'Fil', icon: '🐘', isCorrect: true }, { text: 'Fare', icon: '🐭', isCorrect: false }, { text: 'Sincap', icon: '🐿️', isCorrect: false }], exp: 'Fil dünyanın en büyük ve en güçlü kara hayvanıdır! 🐘💧' },
      { prompt: 'Çiçeklerden nektar toplayıp tatlı bal yapan çalışkan dostumuz hangisidir? 🍯', spokenText: 'Çiçeklerden bal toplayan çalışkan dostumuz hangisidir? Arıya dokun.', category: 'Hayvanlar', correct: 'Arı', cards: [{ text: 'Arı', icon: '🐝', isCorrect: true }, { text: 'Tırtıl', icon: '🐛', isCorrect: false }, { text: 'Salyangoz', icon: '🐌', isCorrect: false }], exp: 'Arılar vız vız uçar ve şifalı bal yapar! 🐝🍯' },
      { prompt: 'Nilüfer yapraklarında "VAK VAK" diyerek zıplayan yeşil dostumuz hangisidir? 🌿', spokenText: 'Vak vak diyerek zıplayan yeşil dostumuz hangisidir? Kurbağaya dokun.', category: 'Hayvanlar', correct: 'Kurbağa', cards: [{ text: 'Kurbağa', icon: '🐸', isCorrect: true }, { text: 'Tilki', icon: '🦊', isCorrect: false }, { text: 'At', icon: '🐴', isCorrect: false }], exp: 'Kurbağalar göletlerde neşeyle zıplar! 🐸💧' },
      { prompt: 'Sırtında sert kabuğuyla yavaş yavaş yürüyen sevimli dostumuz hangisidir? 🍃', spokenText: 'Sırtında sert kabuğu olan sevimli dostumuz hangisidir? Kaplumbağaya dokun.', category: 'Hayvanlar', correct: 'Kaplumbağa', cards: [{ text: 'Kaplumbağa', icon: '🐢', isCorrect: true }, { text: 'Tavşan', icon: '🐇', isCorrect: false }, { text: 'Çita', icon: '🐆', isCorrect: false }], exp: 'Kaplumbağa evi olan kabuğunu sırtında taşır! 🐢💚' },
      { prompt: 'Ağaçlarda daldan dala atlayan ve muz seven sevimli hayvan hangisidir? 🍌', spokenText: 'Daldan dala atlayan ve muz seven sevimli hayvan hangisidir? Maymuna dokun.', category: 'Hayvanlar', correct: 'Maymun', cards: [{ text: 'Maymun', icon: '🐵', isCorrect: true }, { text: 'Kurt', icon: '🐺', isCorrect: false }, { text: 'Ayı', icon: '🐻', isCorrect: false }], exp: 'Maymunlar neşeyle zıplar ve muz yemeye bayılır! 🐵🍌' },

      // 2) Meyveler & Sebzeler (11 Soru)
      { prompt: 'Hangisi kırmızı ve küçük benekli, çok tatlı bir yaz meyvesidir? 🍓', spokenText: 'Hangisi kırmızı ve küçük benekli tatlı bir meyvedir? Çileğe dokun.', category: 'Meyveler', correct: 'Çilek', cards: [{ text: 'Çilek', icon: '🍓', isCorrect: true }, { text: 'Soğan', icon: '🧅', isCorrect: false }, { text: 'Patates', icon: '🥔', isCorrect: false }], exp: 'Çilek kokulu, kırmızı çok tatlı bir meyvedir! 🍓😋' },
      { prompt: 'Maymunların yemeye bayıldığı sarı ve tatlı meyve hangisidir? 🍌', spokenText: 'Maymunların yemeye bayıldığı sarı ve tatlı meyve hangisidir? Muza dokun.', category: 'Meyveler', correct: 'Muz', cards: [{ text: 'Muz', icon: '🍌', isCorrect: true }, { text: 'Domates', icon: '🍅', isCorrect: false }, { text: 'Brokoli', icon: '🥦', isCorrect: false }], exp: 'Muz enerji dolu, tatlı ve sapsarı bir meyvedir! 🍌☀️' },
      { prompt: 'Hangisi kış aylarında bol C vitamini veren sulu portakaldır? 🍊', spokenText: 'Hangisi kış aylarında bol C vitamini veren meyvedir? Portakala dokun.', category: 'Meyveler', correct: 'Portakal', cards: [{ text: 'Portakal', icon: '🍊', isCorrect: true }, { text: 'Karpuz', icon: '🍉', isCorrect: false }, { text: 'Kiraz', icon: '🍒', isCorrect: false }], exp: 'Portakal bizi hastalıklardan koruyan sulu bir kış meyvesidir! 🍊💪' },
      { prompt: 'Kırmızı veya yeşil renkli, çıtır çıtır ısırılan meyve hangisidir? 🍎', spokenText: 'Kırmızı veya yeşil renkli, çıtır ısırılan meyve hangisidir? Elmaya dokun.', category: 'Meyveler', correct: 'Elma', cards: [{ text: 'Elma', icon: '🍎', isCorrect: true }, { text: 'Havuç', icon: '🥕', isCorrect: false }, { text: 'Patlıcan', icon: '🍆', isCorrect: false }], exp: 'Günde bir elma yemek sağlığımıza çok iyi gelir! 🍎✨' },
      { prompt: 'Yazın soğuk soğuk dilimlenip yenen koca yeşil meyve hangisidir? 🍉', spokenText: 'Yazın dilimlenip yenen içi kırmızı koca meyve hangisidir? Karpuza dokun.', category: 'Meyveler', correct: 'Karpuz', cards: [{ text: 'Karpuz', icon: '🍉', isCorrect: true }, { text: 'Limon', icon: '🍋', isCorrect: false }, { text: 'Kestane', icon: '🌰', isCorrect: false }], exp: 'Karpuz yaz sıcağında içimizi ferahlatır! 🍉❄️' },
      { prompt: 'Çorbalara ve salatalara sıkılan ekşi sarı meyve hangisidir? 🍋', spokenText: 'Çorbalara sıkılan ekşi sarı meyve hangisidir? Limona dokun.', category: 'Meyveler', correct: 'Limon', cards: [{ text: 'Limon', icon: '🍋', isCorrect: true }, { text: 'Çilek', icon: '🍓', isCorrect: false }, { text: 'Üzüm', icon: '🍇', isCorrect: false }], exp: 'Limon ekşidir ama C vitamini deposudur! 🍋😋' },
      { prompt: 'Salkım salkım yetişen mor veya yeşil tatlı meyve hangisidir? 🍇', spokenText: 'Salkım salkım yetişen tatlı meyve hangisidir? Üzüme dokun.', category: 'Meyveler', correct: 'Üzüm', cards: [{ text: 'Üzüm', icon: '🍇', isCorrect: true }, { text: 'Mısır', icon: '🌽', isCorrect: false }, { text: 'Patates', icon: '🥔', isCorrect: false }], exp: 'Üzüm taneleri çok tatlı ve lezzetlidir! 🍇🍇' },
      { prompt: 'Tavşanların çıtır çıtır yemeyi çok sevdiği turuncu sebze hangisidir? 🥕', spokenText: 'Tavşanların yemeyi çok sevdiği turuncu sebze hangisidir? Havuca dokun.', category: 'Meyveler', correct: 'Havuç', cards: [{ text: 'Havuç', icon: '🥕', isCorrect: true }, { text: 'Yeşil Elma', icon: '🍏', isCorrect: false }, { text: 'Muz', icon: '🍌', isCorrect: false }], exp: 'Havuç gözlerimize çok iyi gelen turuncu bir sebzedir! 🥕👁️' },
      { prompt: 'İkiz sapları olan minik kırmızı tatlı meyve hangisidir? 🍒', spokenText: 'İkiz sapları olan kırmızı meyve hangisidir? Kiraza dokun.', category: 'Meyveler', correct: 'Kiraz', cards: [{ text: 'Kiraz', icon: '🍒', isCorrect: true }, { text: 'Ananas', icon: '🍍', isCorrect: false }, { text: 'Hindistan Cevizi', icon: '🥥', isCorrect: false }], exp: 'Kirazları kulağımıza küpe gibi takmayı da severiz! 🍒🌸' },
      { prompt: 'Kahvaltıda yediğimiz kıpkırmızı, sulu sebze hangisidir? 🍅', spokenText: 'Kahvaltıda yediğimiz sulu kırmızı sebze hangisidir? Domatese dokun.', category: 'Meyveler', correct: 'Domates', cards: [{ text: 'Domates', icon: '🍅', isCorrect: true }, { text: 'Limon', icon: '🍋', isCorrect: false }, { text: 'Muz', icon: '🍌', isCorrect: false }], exp: 'Domates salataların ve kahvaltıların vazgeçilmezidir! 🍅❤️' },
      { prompt: 'Sarı taneleri patlatılarak film izlerken yenen lezzetli yiyecek hangisidir? 🌽', spokenText: 'Sarı taneleri patlatılarak yenen lezzetli yiyecek hangisidir? Mısıra dokun.', category: 'Meyveler', correct: 'Mısır', cards: [{ text: 'Mısır', icon: '🌽', isCorrect: true }, { text: 'Brokoli', icon: '🥦', isCorrect: false }, { text: 'Soğan', icon: '🧅', isCorrect: false }], exp: 'Patlamış mısır çıtır çıtır ve çok eğlencelidir! 🌽🍿' },

      // 3) Taşıtlar (11 Soru)
      { prompt: 'Gökyüzünde bulutların üstünde kanatlarıyla uçan taşıt hangisidir? ✈️', spokenText: 'Gökyüzünde bulutların üstünde uçan taşıt hangisidir? Uçağa dokun.', category: 'Taşıtlar', correct: 'Uçak', cards: [{ text: 'Uçak', icon: '✈️', isCorrect: true }, { text: 'Araba', icon: '🚗', isCorrect: false }, { text: 'Gemi', icon: '🚢', isCorrect: false }], exp: 'Uçaklar bizi uzak şehirlere hızla götürür! ✈️☁️' },
      { prompt: 'Raylar üzerinde "Çuf çuf" diyerek giden uzun taşıt hangisidir? 🚂', spokenText: 'Raylar üzerinde çuf çuf diyerek giden taşıt hangisidir? Trene dokun.', category: 'Taşıtlar', correct: 'Tren', cards: [{ text: 'Tren', icon: '🚂', isCorrect: true }, { text: 'Helikopter', icon: '🚁', isCorrect: false }, { text: 'Bisiklet', icon: '🚲', isCorrect: false }], exp: 'Tren vagonlarıyla raylar üzerinde seyahat eder! 🚂🛤️' },
      { prompt: 'Denizlerde ve okyanuslarda dalgaların üstünde yüzen büyük taşıt hangisidir? 🚢', spokenText: 'Denizlerde dalgaların üstünde yüzen büyük taşıt hangisidir? Gemiye dokun.', category: 'Taşıtlar', correct: 'Gemi', cards: [{ text: 'Gemi', icon: '🚢', isCorrect: true }, { text: 'Otobüs', icon: '🚌', isCorrect: false }, { text: 'Motosiklet', icon: '🏍️', isCorrect: false }], exp: 'Gemiler kaptanlar eşliğinde mavi sularda ilerler! 🚢⚓' },
      { prompt: 'Hastaları hızla hastaneye yetiştiren sirenli acil araç hangisidir? 🚑', spokenText: 'Hastaları hızla hastaneye yetiştiren sirenli araç hangisidir? Ambulansa dokun.', category: 'Taşıtlar', correct: 'Ambulans', cards: [{ text: 'Ambulans', icon: '🚑', isCorrect: true }, { text: 'Traktör', icon: '🚜', isCorrect: false }, { text: 'Taksi', icon: '🚕', isCorrect: false }], exp: 'Ambulansa trafikte her zaman yol vermeliyiz! 🚑🏥' },
      { prompt: 'Yangınları söndürmek için siren çalarak koşan kırmızı araç hangisidir? 🚒', spokenText: 'Yangınları söndürmek için koşan kırmızı araç hangisidir? İtfaiye aracına dokun.', category: 'Taşıtlar', correct: 'İtfaiye Arabası', cards: [{ text: 'İtfaiye Arabası', icon: '🚒', isCorrect: true }, { text: 'Kamyon', icon: '🚚', isCorrect: false }, { text: 'Bisiklet', icon: '🚲', isCorrect: false }], exp: 'İtfaiye aracı uzun merdiveniyle yangınları söndürür! 🚒💦' },
      { prompt: 'Şehirde yolcuları duraklardan toplayan koca taşıt hangisidir? 🚌', spokenText: 'Şehirde yolcuları duraklardan toplayan taşıt hangisidir? Otobüse dokun.', category: 'Taşıtlar', correct: 'Otobüs', cards: [{ text: 'Otobüs', icon: '🚌', isCorrect: true }, { text: 'Scooter', icon: '🛴', isCorrect: false }, { text: 'Kayık', icon: '🛶', isCorrect: false }], exp: 'Otobüs toplu taşıma ile çevremizi korur! 🚌🚏' },
      { prompt: 'İki tekerleği olan ve pedallarını çevirerek sürdüğümüz sağlıklı taşıt hangisidir? 🚲', spokenText: 'Pedallarını çevirerek sürdüğümüz iki tekerlekli taşıt hangisidir? Bisiklete dokun.', category: 'Taşıtlar', correct: 'Bisiklet', cards: [{ text: 'Bisiklet', icon: '🚲', isCorrect: true }, { text: 'Araba', icon: '🚗', isCorrect: false }, { text: 'Tren', icon: '🚂', isCorrect: false }], exp: 'Bisiklet sürmek hem çok eğlenceli hem de sağlıklıdır! 🚲🚴' },
      { prompt: 'Tepesinde pervanesi dönerek havada asılı durabilen taşıt hangisidir? 🚁', spokenText: 'Tepesinde pervanesi dönen taşıt hangisidir? Helikoptere dokun.', category: 'Taşıtlar', correct: 'Helikopter', cards: [{ text: 'Helikopter', icon: '🚁', isCorrect: true }, { text: 'Uçak', icon: '✈️', isCorrect: false }, { text: 'Gemi', icon: '🚢', isCorrect: false }], exp: 'Helikopter piste gerek duymadan her yere inebilir! 🚁🚁' },
      { prompt: 'Tarlaları sürmek için köylerde kullanılan büyük tekerlekli araç hangisidir? 🚜', spokenText: 'Tarlaları sürmek için kullanılan araç hangisidir? Traktöre dokun.', category: 'Taşıtlar', correct: 'Traktör', cards: [{ text: 'Traktör', icon: '🚜', isCorrect: true }, { text: 'Yarış Arabası', icon: '🏎️', isCorrect: false }, { text: 'Motosiklet', icon: '🛵', isCorrect: false }], exp: 'Traktör çiftçilerin en büyük yardımcısıdır! 🚜🌾' },
      { prompt: 'Uzaya, Ay\'a ve yıldızlara gitmek için ateşlenen araç hangisidir? 🚀', spokenText: 'Uzaya ve Ay\'a gitmek için ateşlenen araç hangisidir? Rokete dokun.', category: 'Taşıtlar', correct: 'Roket', cards: [{ text: 'Roket', icon: '🚀', isCorrect: true }, { text: 'Uçak', icon: '✈️', isCorrect: false }, { text: 'Yelkenli', icon: '⛵', isCorrect: false }], exp: 'Roketler Dünya\'nın yerçekimini yenip uzaya uçar! 🚀⭐' },
      { prompt: 'Düt düt diye korna çalan dört tekerlekli aile taşıtı hangisidir? 🚗', spokenText: 'Düt düt diye korna çalan dört tekerlekli taşıt hangisidir? Arabaya dokun.', category: 'Taşıtlar', correct: 'Araba', cards: [{ text: 'Araba', icon: '🚗', isCorrect: true }, { text: 'Scooter', icon: '🛴', isCorrect: false }, { text: 'Tren', icon: '🚂', isCorrect: false }], exp: 'Arabaya bindiğimizde daima emniyet kemerimizi takarız! 🚗🛡️' },

      // 4) Meslekler (11 Soru)
      { prompt: 'Hastalandığımızda bizi muayene eden ve iyileştiren kimdir? 🩺', spokenText: 'Hastalandığımızda bizi muayene eden kimdir? Doktora dokun.', category: 'Meslekler', correct: 'Doktor', cards: [{ text: 'Doktor', icon: '🩺', isCorrect: true }, { text: 'Aşçı', icon: '👨‍🍳', isCorrect: false }, { text: 'Polis', icon: '👮', isCorrect: false }], exp: 'Doktorlar sağlığımıza kavuşmamıza yardımcı olur! 🩺🏥' },
      { prompt: 'Bize okulda okuma-yazmayı ve yeni bilgileri öğreten kimdir? 👩‍🏫', spokenText: 'Okulda okuma yazmayı ve yeni bilgileri öğreten kimdir? Öğretmene dokun.', category: 'Meslekler', correct: 'Öğretmen', cards: [{ text: 'Öğretmen', icon: '👩‍🏫', isCorrect: true }, { text: 'İtfaiyeci', icon: '🚒', isCorrect: false }, { text: 'İnşaat Ustası', icon: '👷', isCorrect: false }], exp: 'Öğretmenler geleceğimizi sevgiyle aydınlatır! 👩‍🏫📚' },
      { prompt: 'Yangınları hortumla su sıkarak söndüren kahraman kimdir? 👨‍🚒', spokenText: 'Yangınları söndüren kahraman kimdir? İtfaiyeciye dokun.', category: 'Meslekler', correct: 'İtfaiyeci', cards: [{ text: 'İtfaiyeci', icon: '👨‍🚒', isCorrect: true }, { text: 'Çiftçi', icon: '👨‍🌾', isCorrect: false }, { text: 'Ressam', icon: '🧑‍🎨', isCorrect: false }], exp: 'İtfaiyeciler tehlikeli anlarda canla başla yardım eder! 👨‍🚒🧯' },
      { prompt: 'Trafiği düzenleyen ve güvenliğimizi sağlayan üniformalı kimdir? 👮', spokenText: 'Trafiği düzenleyen ve güvenliğimizi sağlayan kimdir? Polise dokun.', category: 'Meslekler', correct: 'Polis', cards: [{ text: 'Polis', icon: '👮', isCorrect: true }, { text: 'Aşçı', icon: '👨‍🍳', isCorrect: false }, { text: 'Astronot', icon: '🧑‍🚀', isCorrect: false }], exp: 'Polisler huzur ve güvenliğimiz için nöbettedir! 👮🚨' },
      { prompt: 'Restoranlarda lezzetli yemekler ve pastalar pişiren kimdir? 👨‍🍳', spokenText: 'Lezzetli yemekler ve tatlılar pişiren kimdir? Aşçıya dokun.', category: 'Meslekler', correct: 'Aşçı', cards: [{ text: 'Aşçı', icon: '👨‍🍳', isCorrect: true }, { text: 'Pilot', icon: '🧑‍✈️', isCorrect: false }, { text: 'Tamirci', icon: '👨‍🔧', isCorrect: false }], exp: 'Aşçılar şef şapkalarıyla harika tatlar üretir! 👨‍🍳🍲' },
      { prompt: 'Gökyüzünde yolcu uçağını güvenle uçuran kaptan kimdir? 🧑‍✈️', spokenText: 'Gökyüzünde yolcu uçağını uçuran kaptan kimdir? Pilota dokun.', category: 'Meslekler', correct: 'Pilot', cards: [{ text: 'Pilot', icon: '🧑‍✈️', isCorrect: true }, { text: 'Çiftçi', icon: '🧑‍🌾', isCorrect: false }, { text: 'Öğretmen', icon: '👩‍🏫', isCorrect: false }], exp: 'Pilotlar kokpitte uçağı bulutların arasından geçirir! 🧑‍✈️✈️' },
      { prompt: 'Renkli boyalarla tuvale harika resimler çizen sanatçı kimdir? 🧑‍🎨', spokenText: 'Renkli boyalarla harika resimler çizen sanatçı kimdir? Ressama dokun.', category: 'Meslekler', correct: 'Ressam', cards: [{ text: 'Ressam', icon: '🧑‍🎨', isCorrect: true }, { text: 'Doktor', icon: '👨‍⚕️', isCorrect: false }, { text: 'Polis', icon: '👮', isCorrect: false }], exp: 'Ressamlar fırçalarıyla hayal dünyamızı renklendirir! 🧑‍🎨🎨' },
      { prompt: 'Tarlalarda meyve, sebze ve buğday yetiştiren üretici kimdir? 👨‍🌾', spokenText: 'Tarlalarda meyve ve sebze yetiştiren kimdir? Çiftçiye dokun.', category: 'Meslekler', correct: 'Çiftçi', cards: [{ text: 'Çiftçi', icon: '👨‍🌾', isCorrect: true }, { text: 'Astronot', icon: '👨‍🚀', isCorrect: false }, { text: 'Aşçı', icon: '👨‍🍳', isCorrect: false }], exp: 'Çiftçiler soframıza gelen sağlıklı besinleri üretir! 👨‍🌾🌾' },
      { prompt: 'Uzay kıyafeti giyip roketle uzayda yürüyen cesur kaşif kimdir? 👨‍🚀', spokenText: 'Uzay kıyafeti giyip uzayda yürüyen cesur kaşif kimdir? Astronota dokun.', category: 'Meslekler', correct: 'Astronot', cards: [{ text: 'Astronot', icon: '👨‍🚀', isCorrect: true }, { text: 'Tamirci', icon: '👨‍🔧', isCorrect: false }, { text: 'İtfaiyeci', icon: '👨‍🚒', isCorrect: false }], exp: 'Astronotlar Ay\'da ve uzay istasyonunda keşif yapar! 👨‍🚀🚀' },
      { prompt: 'Çürüyen dişlerimizi tedavi edip parlatan hekim kimdir? 🦷', spokenText: 'Dişlerimizi tedavi edip parlatan hekim kimdir? Diş hekimine dokun.', category: 'Meslekler', correct: 'Diş Hekimi', cards: [{ text: 'Diş Hekimi', icon: '🦷', isCorrect: true }, { text: 'Pilot', icon: '🧑‍✈️', isCorrect: false }, { text: 'Ressam', icon: '🧑‍🎨', isCorrect: false }], exp: 'Günde iki kez diş fırçalayarak diş hekimimizi sevindiririz! 🦷🪥' },
      { prompt: 'Evleri, okulları ve sağlam binaları inşa eden usta kimdir? 👷', spokenText: 'Sağlam evleri ve binaları inşa eden kimdir? İnşaat ustasına dokun.', category: 'Meslekler', correct: 'İnşaat Ustası', cards: [{ text: 'İnşaat Ustası', icon: '👷', isCorrect: true }, { text: 'Aşçı', icon: '👨‍🍳', isCorrect: false }, { text: 'Ressam', icon: '🧑‍🎨', isCorrect: false }], exp: 'İnşaat ustaları sarı baretleriyle güvenle çalışır! 👷🏢' },

      // 5) Renkler & Şekiller (10 Soru)
      { prompt: 'Hangisi gökyüzünün ve denizlerin rengi olan MAVİDİR? 🔵', spokenText: 'Hangisi mavi renktir? Mavi daireye dokun.', category: 'Renkler & Şekiller', correct: 'Mavi Daire', cards: [{ text: 'Mavi Daire', icon: '🔵', isCorrect: true }, { text: 'Kırmızı Daire', icon: '🔴', isCorrect: false }, { text: 'Sarı Daire', icon: '🟡', isCorrect: false }], exp: 'Mavi ferahlatıcı gökyüzünün ve denizin rengidir! 🔵🌊' },
      { prompt: 'Hangisi taze çimenlerin ve yaprakların rengi olan YEŞİLDİR? 🟢', spokenText: 'Hangisi yeşil renktir? Yeşil daireye dokun.', category: 'Renkler & Şekiller', correct: 'Yeşil Daire', cards: [{ text: 'Yeşil Daire', icon: '🟢', isCorrect: true }, { text: 'Mor Daire', icon: '🟣', isCorrect: false }, { text: 'Turuncu Daire', icon: '🟠', isCorrect: false }], exp: 'Yeşil doğanın ve ağaçların rengidir! 🟢🌿' },
      { prompt: 'Hangisi sıcacık Güneş\'in ve olgun muzun rengi olan SARIDIR? 🟡', spokenText: 'Hangisi sarı renktir? Sarı daireye dokun.', category: 'Renkler & Şekiller', correct: 'Sarı Daire', cards: [{ text: 'Sarı Daire', icon: '🟡', isCorrect: true }, { text: 'Mavi Daire', icon: '🔵', isCorrect: false }, { text: 'Kırmızı Daire', icon: '🔴', isCorrect: false }], exp: 'Sarı içimizi ısıtan Güneş\'in rengidir! 🟡☀️' },
      { prompt: 'Hangisi parlak çileğin ve kalbin rengi olan KIRMIZIDIR? 🔴', spokenText: 'Hangisi kırmızı renktir? Kırmızı daireye dokun.', category: 'Renkler & Şekiller', correct: 'Kırmızı Daire', cards: [{ text: 'Kırmızı Daire', icon: '🔴', isCorrect: true }, { text: 'Yeşil Daire', icon: '🟢', isCorrect: false }, { text: 'Mor Daire', icon: '🟣', isCorrect: false }], exp: 'Kırmızı canlı ve neşeli bir renktir! 🔴🍓' },
      { prompt: 'Hangisi geceleri gökyüzünde ışıl ışıl parlayan YILDIZ şeklidir? ⭐', spokenText: 'Hangisi parlayan yıldız şeklidir? Yıldıza dokun.', category: 'Renkler & Şekiller', correct: 'Sarı Yıldız', cards: [{ text: 'Sarı Yıldız', icon: '⭐', isCorrect: true }, { text: 'Mavi Üçgen', icon: '🔺', isCorrect: false }, { text: 'Siyah Kare', icon: '⬛', isCorrect: false }], exp: 'Yıldız gökyüzünde ışıl ışıl göz kırpar! ⭐✨' },
      { prompt: 'Hangisi sevgimizi anlatan pembe KALP şeklidir? 💖', spokenText: 'Hangisi pembe kalp şeklidir? Kalbe dokun.', category: 'Renkler & Şekiller', correct: 'Pembe Kalp', cards: [{ text: 'Pembe Kalp', icon: '💖', isCorrect: true }, { text: 'Yeşil Daire', icon: '⭕', isCorrect: false }, { text: 'Turuncu Üçgen', icon: '🔺', isCorrect: false }], exp: 'Kalp sevgi ve dostluğun en güzel sembolüdür! 💖' },
      { prompt: 'Hangisi tıpkı bir futbol topu gibi yuvarlak DAİREDİR? ⭕', spokenText: 'Hangisi yuvarlak dairedir? Daireye dokun.', category: 'Renkler & Şekiller', correct: 'Daire', cards: [{ text: 'Daire', icon: '⭕', isCorrect: true }, { text: 'Kare', icon: '🟩', isCorrect: false }, { text: 'Üçgen', icon: '🔺', isCorrect: false }], exp: 'Dairenin köşesi yoktur, top gibi yuvarlaktır! ⭕⚽' },
      { prompt: 'Hangisi tam 3 köşesi ve 3 kenarı olan ÜÇGENDİR? 🔺', spokenText: 'Hangisi 3 köşeli üçgendir? Üçgene dokun.', category: 'Renkler & Şekiller', correct: 'Üçgen', cards: [{ text: 'Üçgen', icon: '🔺', isCorrect: true }, { text: 'Daire', icon: '⚪', isCorrect: false }, { text: 'Kare', icon: '🟦', isCorrect: false }], exp: 'Üçgenin tam 3 sivri köşesi vardır! 🔺📐' },
      { prompt: 'Hangisi 4 kenarı da birbirine eşit olan KAREDİR? 🟩', spokenText: 'Hangisi 4 kenarı eşit karedir? Kareye dokun.', category: 'Renkler & Şekiller', correct: 'Kare', cards: [{ text: 'Kare', icon: '🟩', isCorrect: true }, { text: 'Daire', icon: '⭕', isCorrect: false }, { text: 'Üçgen', icon: '🔺', isCorrect: false }], exp: 'Kare kutu gibi dengeli ve dört köşelidir! 🟩📦' },
      { prompt: 'Hangisi lezzetli bir portakalın rengi olan TURUNCUDUR? 🟠', spokenText: 'Hangisi turuncu renktir? Turuncu daireye dokun.', category: 'Renkler & Şekiller', correct: 'Turuncu Daire', cards: [{ text: 'Turuncu Daire', icon: '🟠', isCorrect: true }, { text: 'Mor Daire', icon: '🟣', isCorrect: false }, { text: 'Yeşil Daire', icon: '🟢', isCorrect: false }], exp: 'Turuncu portakal ve havuç rengidir! 🟠🍊' }
    ],

    // -------------------------------------------------------------------------
    // 1. SINIF: 42 SEVİYELİK BALON PATLATMA HAVUZU (HARF, HECE, SAYI, RİTMİK)
    // -------------------------------------------------------------------------
    grade1BalloonLevelsPool: [
      // 1. Grup Harfler (E-L-A-K-İ-N) - 12 Bölüm
      { id: 'b_e_up', instruction: '🎈 Sadece "E" harfi olan balonları patlat!', spokenText: 'Sadece E harfi olan balonları patlat', target: 'E', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['E'], distractors: ['L', 'A', 'K', 'İ', 'N'], exp: 'Harika refleks! "E" harfini yakaladın! 🎈👏' },
      { id: 'b_e_low', instruction: '🎈 Sadece küçük "e" harfi olan balonları patlat!', spokenText: 'Sadece küçük e harfi olan balonları patlat', target: 'e', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['e'], distractors: ['l', 'a', 'k', 'i', 'n'], exp: 'Süpersin! Küçük "e" balonlarını patlattın! 🎈✨' },
      { id: 'b_l_up', instruction: '🎈 Sadece "L" harfi olan balonları patlat!', spokenText: 'Sadece L harfi olan balonları patlat', target: 'L', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['L'], distractors: ['E', 'A', 'K', 'T', 'N'], exp: 'Tebrikler! "L" harfi balonları patladı! 🎈🎉' },
      { id: 'b_l_low', instruction: '🎈 Sadece küçük "l" harfi olan balonları patlat!', spokenText: 'Sadece küçük l harfi olan balonları patlat', target: 'l', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['l'], distractors: ['e', 'i', 't', 'k', 'a'], exp: 'Çok hızlısın! Küçük "l" harfini buldun! 🎈⭐' },
      { id: 'b_a_up', instruction: '🎈 Sadece "A" harfi olan balonları patlat!', spokenText: 'Sadece A harfi olan balonları patlat', target: 'A', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['A'], distractors: ['E', 'L', 'O', 'K', 'İ'], exp: 'Muhteşem! "A" sesi balonunu avladın! 🎈👏' },
      { id: 'b_a_low', instruction: '🎈 Sadece küçük "a" harfi olan balonları patlat!', spokenText: 'Sadece küçük a harfi olan balonları patlat', target: 'a', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['a'], distractors: ['e', 'o', 'u', 'k', 'n'], exp: 'Bravo! Küçük "a" harfini kaçırmadın! 🎈💖' },
      { id: 'b_k_up', instruction: '🎈 Sadece "K" harfi olan balonları patlat!', spokenText: 'Sadece K harfi olan balonları patlat', target: 'K', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['K'], distractors: ['L', 'E', 'N', 'T', 'İ'], exp: 'Harika atış! "K" harfi patladı! 🎈💥' },
      { id: 'b_k_low', instruction: '🎈 Sadece küçük "k" harfi olan balonları patlat!', spokenText: 'Sadece küçük k harfi olan balonları patlat', target: 'k', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['k'], distractors: ['l', 't', 'b', 'h', 'n'], exp: 'Nefis gözlem! Küçük "k" balonunu patlattın! 🎈👍' },
      { id: 'b_i_up', instruction: '🎈 Sadece "İ" harfi olan balonları patlat!', spokenText: 'Sadece İ harfi olan balonları patlat', target: 'İ', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['İ'], distractors: ['E', 'L', 'A', 'K', 'T'], exp: 'Süper! Noktalı "İ" harfini hemen yakaladın! 🎈🌟' },
      { id: 'b_i_low', instruction: '🎈 Sadece küçük "i" harfi olan balonları patlat!', spokenText: 'Sadece küçük i harfi olan balonları patlat', target: 'i', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['i'], distractors: ['l', 'e', 't', 'k', 'j'], exp: 'Çok dikkatlisin! Küçük "i" harfini buldun! 🎈👏' },
      { id: 'b_n_up', instruction: '🎈 Sadece "N" harfi olan balonları patlat!', spokenText: 'Sadece N harfi olan balonları patlat', target: 'N', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['N'], distractors: ['M', 'K', 'L', 'Z', 'H'], exp: 'Tebrikler! "N" harfi balonlarını patlattın! 🎈🎉' },
      { id: 'b_n_low', instruction: '🎈 Sadece küçük "n" harfi olan balonları patlat!', spokenText: 'Sadece küçük n harfi olan balonları patlat', target: 'n', category: '1. Grup Harfler', targetsNeeded: 2, targets: ['n'], distractors: ['u', 'm', 'h', 'r', 'k'], exp: 'Harikasın! Küçük "n" harfini ustalıkla patlattın! 🎈💥' },

      // 2. Grup Harfler (O-M-U-T-Ü-Y) - 10 Bölüm
      { id: 'b_o_up', instruction: '🎈 Sadece "O" harfi olan balonları patlat!', spokenText: 'Sadece O harfi olan balonları patlat', target: 'O', category: '2. Grup Harfler', targetsNeeded: 2, targets: ['O'], distractors: ['U', 'A', 'E', 'C', 'D'], exp: 'Tıpkı bir çember gibi olan "O" harfini patlattın! 🎈⭕' },
      { id: 'b_m_up', instruction: '🎈 Sadece "M" harfi olan balonları patlat!', spokenText: 'Sadece M harfi olan balonları patlat', target: 'M', category: '2. Grup Harfler', targetsNeeded: 2, targets: ['M'], distractors: ['N', 'K', 'T', 'W', 'V'], exp: 'Nefis refleks! "M" sesini yakaladın! 🎈👏' },
      { id: 'b_m_low', instruction: '🎈 Sadece küçük "m" harfi olan balonları patlat!', spokenText: 'Sadece küçük m harfi olan balonları patlat', target: 'm', category: '2. Grup Harfler', targetsNeeded: 2, targets: ['m'], distractors: ['n', 'u', 'w', 'v', 'h'], exp: 'İki tepeli küçük "m" harfini buldun! 🎈✨' },
      { id: 'b_u_up', instruction: '🎈 Sadece "U" harfi olan balonları patlat!', spokenText: 'Sadece U harfi olan balonları patlat', target: 'U', category: '2. Grup Harfler', targetsNeeded: 2, targets: ['U'], distractors: ['O', 'Ü', 'A', 'V', 'C'], exp: 'Harika! "U" harfi balonlarını patlattın! 🎈⭐' },
      { id: 'b_t_up', instruction: '🎈 Sadece "T" harfi olan balonları patlat!', spokenText: 'Sadece T harfi olan balonları patlat', target: 'T', category: '2. Grup Harfler', targetsNeeded: 2, targets: ['T'], distractors: ['L', 'K', 'Y', 'F', 'İ'], exp: 'Çok hızlısın! "T" harfi patladı! 🎈💥' },
      { id: 'b_t_low', instruction: '🎈 Sadece küçük "t" harfi olan balonları patlat!', spokenText: 'Sadece küçük t harfi olan balonları patlat', target: 't', category: '2. Grup Harfler', targetsNeeded: 2, targets: ['t'], distractors: ['l', 'f', 'k', 'i', 'j'], exp: 'Bravo! Küçük "t" balonunu tam zamanında patlattın! 🎈👍' },
      { id: 'b_u2_up', instruction: '🎈 Sadece noktalı "Ü" harfi olan balonları patlat!', spokenText: 'Sadece noktalı Ü harfi olan balonları patlat', target: 'Ü', category: '2. Grup Harfler', targetsNeeded: 2, targets: ['Ü'], distractors: ['U', 'O', 'Ö', 'Y', 'T'], exp: 'Süper dikkat! Noktalı "Ü" harfini patlattın! 🎈🌟' },
      { id: 'b_y_up', instruction: '🎈 Sadece "Y" harfi olan balonları patlat!', spokenText: 'Sadece Y harfi olan balonları patlat', target: 'Y', category: '2. Grup Harfler', targetsNeeded: 2, targets: ['Y'], distractors: ['T', 'K', 'V', 'X', 'U'], exp: 'Muhteşem! "Y" harfi balonunu yakaladın! 🎈🎉' },
      { id: 'b_y_low', instruction: '🎈 Sadece küçük "y" harfi olan balonları patlat!', spokenText: 'Sadece küçük y harfi olan balonları patlat', target: 'y', category: '2. Grup Harfler', targetsNeeded: 2, targets: ['y'], distractors: ['u', 'v', 'g', 'j', 'p'], exp: 'Harika! Küçük "y" balonlarını havada vurdun! 🎈💖' },
      { id: 'b_vowels', instruction: '🎈 Sadece SESLİ (Ünlü) harfleri patlat! (A, E, İ, O, U)', spokenText: 'Sadece sesli harfleri patlat', target: 'Sesli Harfler', category: 'Harf Bilgisi', targetsNeeded: 3, targets: ['A', 'E', 'İ', 'O', 'U'], distractors: ['K', 'L', 'T', 'M', 'N'], exp: 'Şampiyon! Sesli harfleri eksiksiz topladın! 🎈🏆' },

      // 1. Sınıf Heceler - 10 Bölüm
      { id: 'b_syl_el', instruction: '🎈 Sadece "EL" hecesi olan balonları patlat!', spokenText: 'Sadece EL hecesi olan balonları patlat', target: 'EL', category: 'Heceler', targetsNeeded: 2, targets: ['EL'], distractors: ['LE', 'AL', 'LA', 'EK'], exp: 'Süpersin! "EL" hecesini hemen okudun ve patlattın! 🎈✋' },
      { id: 'b_syl_al', instruction: '🎈 Sadece "AL" hecesi olan balonları patlat!', spokenText: 'Sadece AL hecesi olan balonları patlat', target: 'AL', category: 'Heceler', targetsNeeded: 2, targets: ['AL'], distractors: ['LA', 'EL', 'OL', 'AT'], exp: 'Harika! "AL" hecesi balonlarını patlattın! 🎈🔴' },
      { id: 'b_syl_ak', instruction: '🎈 Sadece "AK" hecesi olan balonları patlat!', spokenText: 'Sadece AK hecesi olan balonları patlat', target: 'AK', category: 'Heceler', targetsNeeded: 2, targets: ['AK'], distractors: ['KA', 'EK', 'OK', 'KE'], exp: 'Nefis! "AK" hecesini tam hedeften vurdun! 🎈⚪' },
      { id: 'b_syl_ek', instruction: '🎈 Sadece "EK" hecesi olan balonları patlat!', spokenText: 'Sadece EK hecesi olan balonları patlat', target: 'EK', category: 'Heceler', targetsNeeded: 2, targets: ['EK'], distractors: ['KE', 'AK', 'ET', 'EL'], exp: 'Tebrikler! "EK" hecesi balonları patladı! 🎈🌾' },
      { id: 'b_syl_et', instruction: '🎈 Sadece "ET" hecesi olan balonları patlat!', spokenText: 'Sadece ET hecesi olan balonları patlat', target: 'ET', category: 'Heceler', targetsNeeded: 2, targets: ['ET'], distractors: ['TE', 'AT', 'OT', 'İT'], exp: 'Çok hızlısın! "ET" hecesini yakaladın! 🎈🥩' },
      { id: 'b_syl_an', instruction: '🎈 Sadece "AN" hecesi olan balonları patlat!', spokenText: 'Sadece AN hecesi olan balonları patlat', target: 'AN', category: 'Heceler', targetsNeeded: 2, targets: ['AN'], distractors: ['NA', 'EN', 'ON', 'AL'], exp: 'Harika okuma! "AN" hecesi patladı! 🎈✨' },
      { id: 'b_syl_la', instruction: '🎈 Sadece "LA" hecesi olan balonları patlat!', spokenText: 'Sadece LA hecesi olan balonları patlat', target: 'LA', category: 'Heceler', targetsNeeded: 2, targets: ['LA'], distractors: ['AL', 'LE', 'LI', 'LO'], exp: 'Bravo! "LA" hecesini ustalıkla patlattın! 🎈🎶' },
      { id: 'b_syl_ma', instruction: '🎈 Sadece "MA" hecesi olan balonları patlat!', spokenText: 'Sadece MA hecesi olan balonları patlat', target: 'MA', category: 'Heceler', targetsNeeded: 2, targets: ['MA'], distractors: ['AM', 'ME', 'MO', 'MU'], exp: 'Süper! "MA" hecesi balonları patladı! 🎈⭐' },
      { id: 'b_syl_to', instruction: '🎈 Sadece "TO" hecesi olan balonları patlat!', spokenText: 'Sadece TO hecesi olan balonları patlat', target: 'TO', category: 'Heceler', targetsNeeded: 2, targets: ['TO'], distractors: ['OT', 'TA', 'TE', 'TU'], exp: 'Harika refleks! "TO" hecesini patlattın! 🎈⚽' },
      { id: 'b_syl_ku', instruction: '🎈 Sadece "KU" hecesi olan balonları patlat!', spokenText: 'Sadece KU hecesi olan balonları patlat', target: 'KU', category: 'Heceler', targetsNeeded: 2, targets: ['KU'], distractors: ['UK', 'KO', 'KA', 'KE'], exp: 'Tebrikler! "KU" hecesini yakaladın! 🎈🐦' },

      // Sayılar ve Ritmik Sayma - 10 Bölüm
      { id: 'b_num_5', instruction: '🎈 Sadece "5" yazan balonları patlat!', spokenText: 'Sadece 5 yazan balonları patlat', target: '5', category: 'Sayılar', targetsNeeded: 2, targets: ['5'], distractors: ['2', '3', '6', '8', '9'], exp: 'Harika! 5 yazan balonları patlattın! 🎈🖐️' },
      { id: 'b_num_10', instruction: '🎈 Sadece "10" yazan balonları patlat!', spokenText: 'Sadece 10 yazan balonları patlat', target: '10', category: 'Sayılar', targetsNeeded: 2, targets: ['10'], distractors: ['1', '0', '7', '12', '9'], exp: 'Muhteşem! İki basamaklı 10 sayısını yakaladın! 🎈🔟' },
      { id: 'b_even', instruction: '🎈 Sadece ÇİFT sayıları patlat! (2, 4, 6, 8, 10)', spokenText: 'Sadece çift sayıları patlat', target: 'Çift Sayılar', category: 'Sayılar', targetsNeeded: 3, targets: ['2', '4', '6', '8', '10'], distractors: ['1', '3', '5', '7', '9'], exp: 'Harika matematik refleksi! Çift sayıları patlattın! 🎈🎯' },
      { id: 'b_odd', instruction: '🎈 Sadece TEK sayıları patlat! (1, 3, 5, 7, 9)', spokenText: 'Sadece tek sayıları patlat', target: 'Tek Sayılar', category: 'Sayılar', targetsNeeded: 3, targets: ['1', '3', '5', '7', '9'], distractors: ['2', '4', '6', '8', '10'], exp: 'Süpersin! Bütün tek sayıları tam zamanında yakaladın! 🎈⚡' },
      { id: 'b_gt_5', instruction: '🎈 5\'ten BÜYÜK olan sayıları patlat! (6, 7, 8, 9)', spokenText: '5 ten büyük olan sayıları patlat', target: '> 5', category: 'Sayılar', targetsNeeded: 3, targets: ['6', '7', '8', '9'], distractors: ['1', '2', '3', '4'], exp: 'Nefis karşılaştırma! 5\'ten büyük sayıları patlattın! 🎈📈' },
      { id: 'b_lt_5', instruction: '🎈 5\'ten KÜÇÜK olan sayıları patlat! (1, 2, 3, 4)', spokenText: '5 ten küçük olan sayıları patlat', target: '< 5', category: 'Sayılar', targetsNeeded: 3, targets: ['1', '2', '3', '4'], distractors: ['6', '7', '8', '9', '10'], exp: 'Tebrikler! 5\'ten küçük sayıları buldun! 🎈📉' },
      { id: 'b_rhythm_2', instruction: '🎈 2\'şer Ritmik Sayma sayılarını patlat! (2, 4, 6, 8, 10)', spokenText: '2 şer ritmik sayma sayılarını patlat', target: '2\'şer Sayma', category: 'Ritmik Sayma', targetsNeeded: 3, targets: ['2', '4', '6', '8', '10'], distractors: ['3', '5', '7', '9', '11'], exp: '2-4-6-8-10! 2\'şer ritmik saymayı harika biliyorsun! 🎈🚀' },
      { id: 'b_rhythm_5', instruction: '🎈 5\'er Ritmik Sayma sayılarını patlat! (5, 10, 15, 20)', spokenText: '5 er ritmik sayma sayılarını patlat', target: '5\'er Sayma', category: 'Ritmik Sayma', targetsNeeded: 3, targets: ['5', '10', '15', '20'], distractors: ['7', '12', '18', '22', '16'], exp: '5-10-15-20! 5\'er saymada bir yıldızsın! 🎈⭐' },
      { id: 'b_rhythm_10', instruction: '🎈 10\'ar Ritmik Sayma sayılarını patlat! (10, 20, 30, 40)', spokenText: '10 ar ritmik sayma sayılarını patlat', target: '10\'ar Sayma', category: 'Ritmik Sayma', targetsNeeded: 3, targets: ['10', '20', '30', '40'], distractors: ['15', '25', '35', '45', '18'], exp: '10-20-30-40! Hızına kimse yetişemez! 🎈💨' },
      { id: 'b_sum_10', instruction: '🎈 Sonucu 10 eden toplama işlemlerini patlat! (5+5, 8+2, 7+3)', spokenText: 'Sonucu 10 eden toplama işlemlerini patlat', target: '= 10', category: 'Toplama', targetsNeeded: 2, targets: ['5+5', '8+2', '7+3', '9+1'], distractors: ['4+4', '6+2', '9+3', '5+3'], exp: 'Müthiş hesap! Sonucu 10 olan balonları patlattın! 🎈🏆' }
    ],

    // -------------------------------------------------------------------------
    // 77 ÇİFTLİK HAFIZA & EŞLEŞTİRME HAVUZU (HARF, ZIT ANLAM, TOPLAMA)
    // -------------------------------------------------------------------------
    matchingPairsPool: {
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
        { left: 'Uzun 🦒', right: 'Kısa 🦔' }, { left: 'Ağır 🪨', right: 'Hafif 🪶' },
        { left: 'Temiz ✨', right: 'Kirli 🧼' }, { left: 'Genç 🧒', right: 'Yaşlı 👴' },
        { left: 'Mutlu 😊', right: 'Üzgün 😢' }, { left: 'Aşağı ⬇️', right: 'Yukarı ⬆️' },
        { left: 'Gündüz ☀️', right: 'Gece 🌙' }, { left: 'Ön 🚗', right: 'Arka 🚙' },
        { left: 'Dolu 🥛', right: 'Boş 🫗' }, { left: 'Zengin 💰', right: 'Fakir 🪙' },
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
          { name: 'Kırmızı', colorClass: 'balloon-color-red', emoji: '🔴', prompt: '🎈 KIRMIZI balonu patlat! 🔴' },
          { name: 'Mavi', colorClass: 'balloon-color-blue', emoji: '🔵', prompt: '🎈 MAVİ balonu patlat! 🔵' },
          { name: 'Sarı', colorClass: 'balloon-color-yellow', emoji: '🟡', prompt: '🎈 SARI balonu patlat! 🟡' },
          { name: 'Yeşil', colorClass: 'balloon-color-green', emoji: '🟢', prompt: '🎈 YEŞİL balonu patlat! 🟢' },
          { name: 'Turuncu', colorClass: 'balloon-color-orange', emoji: '🟠', prompt: '🎈 TURUNCU balonu patlat! 🟠' },
          { name: 'Mor', colorClass: 'balloon-color-purple', emoji: '🟣', prompt: '🎈 MOR balonu patlat! 🟣' },
          { name: 'Pembe', colorClass: 'balloon-color-pink', emoji: '🌸', prompt: '🎈 PEMBE balonu patlat! 🌸' }
        ];
        const target = colorPool[Math.floor(Math.random() * colorPool.length)];
        const otherColors = colorPool.filter(c => c.name !== target.name);
        const shuffledOthers = [...otherColors].sort(() => 0.5 - Math.random()).slice(0, 3);
        const balloons = [
          { text: target.name, colorClass: target.colorClass, isTarget: true, emoji: target.emoji },
          ...shuffledOthers.map(o => ({ text: o.name, colorClass: o.colorClass, isTarget: false, emoji: o.emoji }))
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
        // 1. Sınıf: MEB Ses Grupları (ANETİL / ELAKİN)
        const subMode = Math.floor(Math.random() * 3);
        if (subMode === 0) {
          // Doğrudan Harf Sesi
          const letterPool = [
            { letter: 'A', spoken: 'A harfi olan balonu patlat' },
            { letter: 'E', spoken: 'E harfi olan balonu patlat' },
            { letter: 'L', spoken: 'L sesini patlat' },
            { letter: 'K', spoken: 'K sesini patlat' },
            { letter: 'İ', spoken: 'İ harfini patlat' },
            { letter: 'N', spoken: 'N sesini patlat' },
            { letter: 'O', spoken: 'O harfini patlat' },
            { letter: 'M', spoken: 'M sesini patlat' },
            { letter: 'U', spoken: 'U harfini patlat' },
            { letter: 'T', spoken: 'T sesini patlat' }
          ];
          const allLetters = ['A', 'E', 'L', 'K', 'İ', 'N', 'O', 'M', 'U', 'T', 'B', 'S'];
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
        spokenText: `${target.name} dostumuzun gölgesini bul`,
        correct: target.name,
        explanation: `Harika gözlem! ${target.name} dostumuzun gölgesini doğru buldun! ${target.emoji}👏`,
        interactiveData: { target, cards }
      };
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
        spokenText: `${chosen.word} kelimesini oluştur`,
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
        spokenText: `Kaç tane ${item.name} var? Dokunarak say`,
        correct: count.toString(),
        explanation: `Tebrikler! Birlikte saydık: Tam ${count} tane ${item.name} var! ${item.emoji}👏`,
        interactiveData: { count, item }
      };
    },

    // 5) ⭐ HIZLI KELİME YAKALA (WORD CATCH)
    generateWordCatchQuestion() {
      const pool = [
        { visual: '🍎', name: 'Elma', q: 'Bu lezzetli meyvenin İLK HARFİ hangisidir? 🍎', a: 'E', d: ['A', 'M'], exp: 'Elma "E" harfi ile başlar! 🍎' },
        { visual: '🐴', name: 'At', q: 'Bu rüzgar gibi koşan dostumuzun adı nedir? 🐴', a: 'AT', d: ['OT', 'ET'], exp: 'Rüzgar gibi koşan dostumuz AT! 🐴' },
        { visual: '🥛', name: 'Süt', q: 'Bembeyaz sağlıklı içeceğin İLK SESİ nedir? 🥛', a: 'S', d: ['K', 'B'], exp: 'Süt "S" sesiyle başlar: S-ü-t! 🥛' },
        { visual: '🍋', name: 'Limon', q: 'Sarı ekşi meyvenin İLK SESİ nedir? 🍋', a: 'L', d: ['N', 'T'], exp: 'Limon "L" sesiyle başlar: L-i-m-o-n! 🍋' },
        { visual: '🐱', name: 'Kedi', q: 'Miyav diyen sevimli dostumuzun adı nedir? 🐱', a: 'KEDİ', d: ['KÖPEK', 'KUŞ'], exp: 'Miyav diyen dostumuz KEDİ! 🐱' },
        { visual: '🚗', name: 'Araba', q: 'Düt düt diye korna çalan taşıtın İLK SESİ nedir? 🚗', a: 'A', d: ['O', 'E'], exp: 'Araba "A" harfiyle başlar: A-r-a-b-a! 🚗' },
        { visual: '🐟', name: 'Balık', q: 'Mavi sularda yüzen sevimli canlının İLK HARFİ nedir? 🐟', a: 'B', d: ['D', 'P'], exp: 'Balık "B" harfiyle başlar: B-a-l-ı-k! 🐟' },
        { visual: '☀️', name: 'Güneş', q: 'Dünyamızı ısıtan sıcacık dostumuzun İLK SESİ nedir? ☀️', a: 'G', d: ['S', 'M'], exp: 'Güneş "G" harfiyle başlar! ☀️' }
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
        spokenText: item.q,
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
      { q: 'Hangisi tatlı, kırmızı ve çok lezzetli bir yaz meyvesidir?', a: '🍓 Çilek', d: ['🧅 Soğan', '🥔 Patates'], exp: 'Çilek minik noktalı, kırmızı çok tatlı bir meyvedir! 🍓', audioKey: 'q_cilek' },
      { q: 'Derelerde "VAK VAK" diyerek neşeyle zıplayan yeşil dostumuz hangisidir?', a: '🐸 Kurbağa', d: ['🦊 Tilki', '🐴 At'], exp: 'Kurbağalar nilüfer yapraklarının üstünde zıplar! 🐸', audioKey: 'q_kurbaga' }
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

    // 1. SINIF: RİTMİK SAYMA DİNAMİK ÜRETECİ (SINIRSIZ SORU)
    generateGrade1Rhythmic() {
      const mode = Math.floor(Math.random() * 4);
      if (mode === 0) {
        // 2'şer ileri sayma (2..20)
        const step = 2;
        const start = [2, 4, 6, 8, 10, 12, 14][Math.floor(Math.random() * 7)];
        const s1 = start;
        const s2 = s1 + step;
        const s3 = s2 + step;
        const ans = s3 + step;
        return {
          question: `${s1} - ${s2} - ${s3} - ?`,
          correct: ans.toString(),
          distractors: [(ans + 2).toString(), (ans - 1).toString()],
          explanation: `Sayılar 2'şer ritmik olarak artmaktadır. ${s3}'ten sonra ${ans} gelir.`
        };
      } else if (mode === 1) {
        // 5'er ileri veya geri sayma (5..50)
        const isReverse = Math.random() > 0.5;
        const step = 5;
        if (isReverse) {
          const start = [50, 45, 40, 35, 30, 25, 20][Math.floor(Math.random() * 7)];
          const s1 = start;
          const s2 = s1 - step;
          const s3 = s2 - step;
          const ans = s3 - step;
          return {
            question: `${s1} - ${s2} - ${s3} - ?`,
            correct: ans.toString(),
            distractors: [(ans - 5).toString(), (ans + 5).toString()],
            explanation: `Sayılar 5'er geriye doğru sayılmaktadır. ${s3}'ten sonra ${ans} gelir.`
          };
        } else {
          const start = [5, 10, 15, 20, 25, 30][Math.floor(Math.random() * 6)];
          const s1 = start;
          const s2 = s1 + step;
          const s3 = s2 + step;
          const ans = s3 + step;
          return {
            question: `${s1} - ${s2} - ${s3} - ?`,
            correct: ans.toString(),
            distractors: [(ans + 5).toString(), (ans - 5).toString()],
            explanation: `Sayılar 5'er ileriye doğru artmaktadır. ${s3}'ten sonra ${ans} gelir.`
          };
        }
      } else if (mode === 2) {
        // 10'ar ileri veya geri sayma (10..100)
        const isReverse = Math.random() > 0.5;
        const step = 10;
        if (isReverse) {
          const start = [100, 90, 80, 70, 60, 50][Math.floor(Math.random() * 6)];
          const s1 = start;
          const s2 = s1 - step;
          const s3 = s2 - step;
          const ans = s3 - step;
          return {
            question: `${s1} - ${s2} - ${s3} - ?`,
            correct: ans.toString(),
            distractors: [(ans - 10).toString(), (ans + 10).toString()],
            explanation: `Sayılar 10'ar geriye doğru azalmaktadır. ${s3}'ten sonra ${ans} gelir.`
          };
        } else {
          const start = [10, 20, 30, 40, 50, 60, 70][Math.floor(Math.random() * 7)];
          const s1 = start;
          const s2 = s1 + step;
          const s3 = s2 + step;
          const ans = s3 + step;
          return {
            question: `${s1} - ${s2} - ${s3} - ?`,
            correct: ans.toString(),
            distractors: [(ans + 10).toString(), (ans - 10).toString()],
            explanation: `Sayılar 10'ar ileriye doğru artmaktadır. ${s3}'ten sonra ${ans} gelir.`
          };
        }
      } else {
        // Ortadaki eksik sayıyı bulma (2'şer veya 5'er)
        const step = Math.random() > 0.5 ? 2 : 5;
        const start = step * (Math.floor(Math.random() * 4) + 1);
        const s1 = start;
        const ans = s1 + step;
        const s3 = ans + step;
        const s4 = s3 + step;
        return {
          question: `${s1} - ? - ${s3} - ${s4}`,
          correct: ans.toString(),
          distractors: [(ans + 1).toString(), (ans - 1).toString()],
          explanation: `Ritmik sayma kuralına (${step}'er artış) göre eksik bırakılan sayı ${ans}'dir.`
        };
      }
    },

    // 1. SINIF: GEOMETRİK ŞEKİLLER VE PARALARIMIZ (25 ÖZGÜN SORU)
    grade1ShapesAndMoneyPool: [
      { q: 'Hangi geometrik şeklin 4 kenarı, 4 köşesi vardır ve tüm kenar uzunlukları birbirine EŞİTTİR?', a: 'Kare 🟦', d: ['Üçgen 🔺', 'Çember ⚪'], exp: 'Karenin 4 eşit kenarı ve 4 dik köşesi vardır.' },
      { q: '3 kenarı ve 3 köşesi olan geometrik şekil hangisidir?', a: 'Üçgen 🔺', d: ['Kare 🟦', 'Dikdörtgen 🚪'], exp: 'Üçgenin 3 kenarı ve 3 köşesi bulunur.' },
      { q: 'Hiç köşesi ve kenarı olmayan, yuvarlak geometrik şekil hangisidir?', a: 'Çember ⚪', d: ['Kare 🟦', 'Üçgen 🔺'], exp: 'Çember yuvarlaktır, kenarı ve köşesi yoktur.' },
      { q: '2 uzun ve 2 kısa kenarı olan, karşılıklı kenarları eşit şekil hangisidir?', a: 'Dikdörtgen 🚪', d: ['Kare 🟦', 'Üçgen 🔺'], exp: 'Dikdörtgenin 4 kenarı ve 4 köşesi vardır, karşılıklı kenarları eşittir.' },
      { q: 'En büyük madeni paramız hangisidir?', a: '1 Türk Lirası (1 TL) 🪙', d: ['50 Kuruş 🪙', '25 Kuruş 🪙'], exp: 'Madeni paralarımızın en büyüğü 1 TL\'dir.' },
      { q: '1 Türk Lirası (1 TL) kaç kuruşa eşittir?', a: '100 Kuruş 🪙', d: ['50 Kuruş 🪙', '10 Kuruş 🪙'], exp: '1 TL = 100 Kuruştur.' },
      { q: 'En küçük kağıt paramız hangisidir?', a: '5 TL 💵', d: ['10 TL 💵', '20 TL 💵'], exp: 'Kağıt paralarımızın en küçük değerli olanı 5 TL\'dir.' },
      { q: '2 tane 50 Kuruş bir araya gelirse kaç TL eder?', a: '1 TL 🪙', d: ['2 TL 🪙', '75 Kuruş 🪙'], exp: '50 Kuruş + 50 Kuruş = 100 Kuruş = 1 TL eder.' },
      { q: 'Tanesi 5 TL olan kalemden 2 tane alırsak toplam kaç TL öderiz?', a: '10 TL 💵', d: ['8 TL 💵', '15 TL 💵'], exp: '5 + 5 = 10 TL öderiz.' },
      { q: 'Cebinde 20 TL olan Can, 8 TL\'ye defter alırsa kaç TL parası kalır?', a: '12 TL 💵', d: ['10 TL 💵', '14 TL 💵'], exp: '20 - 8 = 12 TL kalır.' },
      { q: 'Oyun zarı 🎲 hangi geometrik şekle benzer?', a: 'Kare 🟦', d: ['Üçgen 🔺', 'Çember ⚪'], exp: 'Zarın her bir yüzeyi kare şeklindedir.' },
      { q: 'Sınıf kapımız veya yazı tahtamız hangi geometrik şekle benzer?', a: 'Dikdörtgen 🚪', d: ['Çember ⚪', 'Üçgen 🔺'], exp: 'Kapı ve yazı tahtası iki uzun iki kısa kenarlı dikdörtgendir.' },
      { q: 'Futbol topu ⚽ veya madeni para hangi geometrik şekle benzer?', a: 'Çember ⚪', d: ['Kare 🟦', 'Üçgen 🔺'], exp: 'Madeni para ve top yuvarlaktır, çembere benzer.' },
      { q: 'Trafikteki tehlike uyarı levhaları ⚠️ genellikle hangi şekildedir?', a: 'Üçgen 🔺', d: ['Çember ⚪', 'Kare 🟦'], exp: 'Uyarı levhaları çoğunlukla üçgen şeklindedir.' },
      { q: 'Hangisi bir madeni (demir) paradır?', a: '50 Kuruş 🪙', d: ['50 TL 💵', '100 TL 💵'], exp: '50 Kuruş madeni paramızdır, 50 TL kağıt paradır.' },
      { q: 'Bir kare ile bir üçgenin köşe sayıları toplamı kaçtır? (4 + 3)', a: '7 köşe ✨', d: ['6 köşe ✨', '8 köşe ✨'], exp: 'Karenin 4, üçgenin 3 köşesi vardır. 4 + 3 = 7 eder.' },
      { q: 'Tanesi 2 TL olan simitten 3 tane alan Elif kaç TL öder?', a: '6 TL 💵', d: ['5 TL 💵', '8 TL 💵'], exp: '2 + 2 + 2 = 6 TL öder.' },
      { q: 'Hangisi paramızın resmi simgesidir?', a: '₺ (Türk Lirası) 🪙', d: ['$ (Dolar)', '€ (Euro)'], exp: 'Paramızın simgesi ₺ (Türk Lirası) simgesidir.' },
      { q: 'Üçgenin kaç kenarı vardır?', a: '3 kenar 🔺', d: ['4 kenar 🟦', '0 kenar ⚪'], exp: 'Üçgenin 3 adet kenarı bulunur.' },
      { q: 'Çemberin kaç köşesi vardır?', a: '0 (Köşesi yoktur) ⚪', d: ['1 köşe', '4 köşe'], exp: 'Çember yuvarlak olduğu için köşesi yoktur.' },
      { q: '4 tane 5 TL kağıt para toplam kaç TL eder?', a: '20 TL 💵', d: ['15 TL 💵', '25 TL 💵'], exp: '5 + 5 + 5 + 5 = 20 TL eder.' },
      { q: '10 TL parası olan Mehmet, 4 TL\'ye toka aldı. Geriye kaç TL\'si kaldı?', a: '6 TL 💵', d: ['5 TL 💵', '7 TL 💵'], exp: '10 - 4 = 6 TL para üstü alır.' },
      { q: 'Dikdörtgenin kaç köşesi vardır?', a: '4 köşe 🚪', d: ['3 köşe 🔺', '2 köşe'], exp: 'Dikdörtgenin 4 köşesi ve 4 kenarı vardır.' },
      { q: '2 tane 10 TL kağıt para toplam kaç TL eder?', a: '20 TL 💵', d: ['15 TL 💵', '30 TL 💵'], exp: '10 + 10 = 20 TL eder.' },
      { q: 'Hangisinin kenar sayısı DİĞERLERİNDEN DAHA AZDIR?', a: 'Üçgen (3 kenar) 🔺', d: ['Kare (4 kenar) 🟦', 'Dikdörtgen (4 kenar) 🚪'], exp: 'Üçgenin 3 kenarı varken, kare ve dikdörtgenin 4 kenarı vardır.' }
    ],

    // 1. SINIF: ZIT ANLAMLI KELİMELER HAVUZU (35+ KELİME)
    grade1AntonymsPool: [
      { q: '"Büyük" kelimesinin zıt anlamlısı nedir? 🐘', a: 'Küçük 🐁', d: ['Geniş', 'İri'], exp: 'Büyük ve Küçük birbirinin tam karşıtıdır.' },
      { q: '"Uzun" kelimesinin zıt anlamlısı nedir? 🦒', a: 'Kısa', d: ['İnce', 'Düz'], exp: 'Uzun boyun zıttı kısa boydur.' },
      { q: '"Sıcak" kelimesinin zıt anlamlısı nedir? ☀️', a: 'Soğuk ❄️', d: ['Ilık', 'Buz'], exp: 'Sıcak havanın zıttı soğuk havadır.' },
      { q: '"Hızlı" kelimesinin zıt anlamlısı nedir? 🐆', a: 'Yavaş 🐢', d: ['Durgun', 'Sakin'], exp: 'Çita hızlıdır, kaplumbağa ise yavaştır.' },
      { q: '"Açık" kelimesinin zıt anlamlısı nedir? 🚪', a: 'Kapalı', d: ['Koyu', 'Kilitli'], exp: 'Açık kapının zıttı kapalı kapıdır.' },
      { q: '"Dolu" kelimesinin zıt anlamlısı nedir? 🥛', a: 'Boş', d: ['Yarım', 'Temiz'], exp: 'Dolu bardağın karşıtı boş bardaktır.' },
      { q: '"Gece" kelimesinin zıt anlamlısı nedir? 🌙', a: 'Gündüz ☀️', d: ['Akşam', 'Sabah'], exp: 'Gece karanlıktır, gündüz aydınlıktır.' },
      { q: '"Ağır" kelimesinin zıt anlamlısı nedir? 🪨', a: 'Hafif 🪶', d: ['Küçük', 'Yumuşak'], exp: 'Taş ağırdır, kuş tüyü hafiftir.' },
      { q: '"Ön" kelimesinin zıt anlamlısı nedir? 🚗', a: 'Arka', d: ['Yan', 'Üst'], exp: 'Ön tarafın karşıtı arka taraftır.' },
      { q: '"Sert" kelimesinin zıt anlamlısı nedir? 🧱', a: 'Yumuşak 🧸', d: ['İnce', 'Kırılgan'], exp: 'Tuğla serttir, oyuncak ayı yumuşaktır.' },
      { q: '"Aşağı" kelimesinin zıt anlamlısı nedir? ⬇️', a: 'Yukarı ⬆️', d: ['İleri', 'Geri'], exp: 'Aşağı bakmanın zıttı yukarı bakmaktır.' },
      { q: '"Taze" kelimesinin zıt anlamlısı nedir? 🥖', a: 'Bayat', d: ['Çürük', 'Eski'], exp: 'Taze ekmeğin zıttı bayat ekmektir.' },
      { q: '"Temiz" kelimesinin zıt anlamlısı nedir? 🧼', a: 'Kirli', d: ['Islak', 'Tozlu'], exp: 'Temiz ellerin karşıtı kirli ellerdir.' },
      { q: '"Acı" biberin zıt anlamlısı nedir? 🌶️', a: 'Tatlı 🍯', d: ['Ekşi', 'Tuzlu'], exp: 'Acı biberin tat olarak zıttı tatlı baldır.' },
      { q: '"İyi" kelimesinin zıt anlamlısı nedir? 😇', a: 'Kötü 😈', d: ['Zayıf', 'Çirkin'], exp: 'İyi kalplinin zıttı kötü davranmaktır.' },
      { q: '"Siyah" kelimesinin zıt anlamlısı nedir? ⚫', a: 'Beyaz ⚪', d: ['Gri', 'Koyu'], exp: 'Siyahın karşıtı beyaz renktir.' },
      { q: '"Doğru" cevabın zıt anlamlısı nedir? ✅', a: 'Yanlış ❌', d: ['Eksik', 'Yalan'], exp: 'Doğru seçeneğin zıttı yanlış seçenektir.' },
      { q: '"Islak" kelimesinin zıt anlamlısı nedir? 🌧️', a: 'Kuru ☀️', d: ['Nemli', 'Sıcak'], exp: 'Yağmurda ıslanan elbise güneşte kurur.' },
      { q: '"Şişman" kelimesinin zıt anlamlısı nedir? 🐻', a: 'Zayıf', d: ['Küçük', 'Kısa'], exp: 'Şişmanın zıttı zayıftır.' },
      { q: '"Zor" sorunun zıt anlamlısı nedir? 🧩', a: 'Kolay ✨', d: ['Basit', 'Kısa'], exp: 'Zor bulmacanın zıttı kolay bulmacadır.' },
      { q: '"Neşeli" kelimesinin zıt anlamlısı nedir? 😄', a: 'Üzgün 😢', d: ['Kızgın', 'Yorgun'], exp: 'Neşeli gülümsemenin zıttı üzgün durmaktır.' },
      { q: '"İç" kelimesinin zıt anlamlısı nedir? 📦', a: 'Dış', d: ['Üst', 'Alt'], exp: 'Kutunun içi ve dışı birbirine zıttır.' },
      { q: '"Uzak" kelimesinin zıt anlamlısı nedir? 🗺️', a: 'Yakın 🏡', d: ['Hızlı', 'Büyük'], exp: 'Uzak memleketin zıttı yakın mesafedir.' },
      { q: '"Genç" kelimesinin zıt anlamlısı nedir? 👦', a: 'Yaşlı 👴', d: ['Büyük', 'Yorgun'], exp: 'Genç delikanlının zıttı yaşlı dededir.' },
      { q: '"Zengin" kelimesinin zıt anlamlısı nedir? 💰', a: 'Fakir / Yoksul', d: ['Cimri', 'Tutam'], exp: 'Zenginin zıttı fakir / yoksul demektir.' },
      { q: '"Cesur" kahramanın zıt anlamlısı nedir? 🦁', a: 'Korkak 🐭', d: ['Küçük', 'Çelimsiz'], exp: 'Cesur olmanın karşıtı korkak davranmaktır.' },
      { q: '"Giriş" kapısının zıt anlamlısı nedir? 🚪', a: 'Çıkış 🚶‍♂️', d: ['Açılış', 'Dönüş'], exp: 'Giriş kapısının zıttı çıkış kapısıdır.' },
      { q: '"Gülmek" eyleminin zıt anlamlısı nedir? 😊', a: 'Ağlamak 😭', d: ['Susmak', 'Kızmak'], exp: 'Gülmenin zıttı ağlamaktır.' },
      { q: '"Gelmek" fiilinin zıt anlamlısı nedir? 🏃‍♂️', a: 'Gitmek 🚶‍♂️', d: ['Koşmak', 'Durmak'], exp: 'Okula gelmenin zıttı okuldan gitmektir.' },
      { q: '"Almak" kelimesinin zıt anlamlısı nedir? 🎁', a: 'Vermek 🤲', d: ['Satmak', 'Koymak'], exp: 'Hediye almanın karşıtı hediye vermektir.' },
      { q: '"Başlamak" eyleminin zıt anlamlısı nedir? 🏁', a: 'Bitirmek 🏆', d: ['Durmak', 'Bölmek'], exp: 'Derse başlamanın zıttı dersi bitirmektir.' },
      { q: '"Yüksek" dağın zıt anlamlısı nedir? 🏔️', a: 'Alçak 🏕️', d: ['Düz', 'Kısa'], exp: 'Yüksek tepenin zıttı alçak tepedir.' },
      { q: '"Yeni" eşyanın zıt anlamlısı nedir? ✨', a: 'Eski 📦', d: ['Kırık', 'Kirli'], exp: 'Yeni ayakkabının zıttı eski ayakkabıdır.' },
      { q: '"Aydınlık" odanın zıt anlamlısı nedir? 💡', a: 'Karanlık 🌑', d: ['Dar', 'Koyu'], exp: 'Aydınlık gündüzün zıttı karanlık gecedir.' },
      { q: '"Kalın" kitabın zıt anlamlısı nedir? 📚', a: 'İnce 📖', d: ['Hafif', 'Dar'], exp: 'Kalın kitabın zıttı ince kitaptır.' }
    ],

    // 1. SINIF: HECE SAYISI VE HARF BİLGİSİ DİNAMİK ÜRETECİ
    generateGrade1SyllablesAndLetters() {
      const mode = Math.floor(Math.random() * 3);
      if (mode === 0) {
        // Hece sayısı bulma
        const words = [
          { word: 'KİTAP', count: 2, syllables: 'Kİ-TAP' },
          { word: 'ÇANTA', count: 2, syllables: 'ÇAN-TA' },
          { word: 'OKUL', count: 2, syllables: 'O-KUL' },
          { word: 'KALEM', count: 2, syllables: 'KA-LEM' },
          { word: 'ELMA', count: 2, syllables: 'EL-MA' },
          { word: 'ARABA', count: 3, syllables: 'A-RA-BA' },
          { word: 'KELEBEK', count: 3, syllables: 'KE-LE-BEK' },
          { word: 'PAPAĞAN', count: 3, syllables: 'PA-PA-ĞAN' },
          { word: 'DOMATES', count: 3, syllables: 'DO-MA-TES' },
          { word: 'MERDİVEN', count: 3, syllables: 'MER-Dİ-VEN' },
          { word: 'ŞEMSİYE', count: 3, syllables: 'ŞEM-Sİ-YE' },
          { word: 'BİLGİSAYAR', count: 4, syllables: 'BİL-Gİ-SA-YAR' },
          { word: 'TELEVİZYON', count: 4, syllables: 'TE-LE-VİZ-YON' },
          { word: 'CUMHURİYET', count: 4, syllables: 'CUM-HU-Rİ-YET' },
          { word: 'KÜTÜPHANE', count: 3, syllables: 'KÜ-TÜP-HA-NE' }
        ];
        const item = words[Math.floor(Math.random() * words.length)];
        return {
          question: `"${item.word}" sözcüğü kaç hecelidir? 📖`,
          correct: `${item.count} hece`,
          distractors: [`${item.count + 1} hece`, `${Math.max(1, item.count - 1)} hece`],
          explanation: `"${item.word}" kelimesi ${item.syllables} şeklinde ayrılır ve ${item.count} hecelidir.`
        };
      } else if (mode === 1) {
        // Ünlü (Sesli) Harf Tanıma
        const vowels = ['A', 'E', 'I', 'İ', 'O', 'Ö', 'U', 'Ü'];
        const consonants = ['B', 'C', 'D', 'F', 'G', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'Y', 'Z'];
        const targetVowel = vowels[Math.floor(Math.random() * vowels.length)];
        const shuffledCons = [...consonants].sort(() => 0.5 - Math.random());
        return {
          question: 'Aşağıdakilerden hangisi bir SESLİ (ÜNLÜ) harftir? 🔤',
          correct: targetVowel,
          distractors: [shuffledCons[0], shuffledCons[1]],
          explanation: `Alfabemizdeki ünlü harfler: A, E, I, İ, O, Ö, U, Ü. "${targetVowel}" bir ünlü harftir.`
        };
      } else {
        // Sözcükteki sesli harf sayısı
        const words = [
          { word: 'OKUL', vowels: 'O, U', count: 2 },
          { word: 'KALEM', vowels: 'A, E', count: 2 },
          { word: 'KİTAPLIK', vowels: 'İ, A, I', count: 3 },
          { word: 'TÜRKİYE', vowels: 'Ü, İ, E', count: 3 },
          { word: 'ARABA', vowels: 'A, A, A', count: 3 },
          { word: 'GÜNEŞ', vowels: 'Ü, E', count: 2 }
        ];
        const item = words[Math.floor(Math.random() * words.length)];
        return {
          question: `"${item.word}" kelimesinde kaç tane sesli (ünlü) harf vardır? 🔤`,
          correct: item.count.toString(),
          distractors: [(item.count + 1).toString(), Math.max(1, item.count - 1).toString()],
          explanation: `"${item.word}" sözcüğündeki sesli harfler (${item.vowels}) toplam ${item.count} tanedir.`
        };
      }
    },

    // 1. SINIF: OKULUMUZDA VE EVİMİZDE HAYAT (26 ÖZGÜN SORU)
    grade1SchoolHomeLifePool: [
      { q: 'Sınıfta öğretmenimizden veya arkadaşımızdan söz isterken ne yaparız? ✋', a: 'Parmak kaldırırız ✋', d: ['Bağırarak konuşuruz', 'Ayağa kalkıp gezeriz'], exp: 'Söz hakkı almak için nezaketle parmak kaldırırız.' },
      { q: 'Teneffüslerde koridorda ve merdivenlerde nasıl yürümeliyiz? 🚶‍♂️', a: 'Sakin ve sağdan yürümeliyiz 🚶‍♂️', d: ['Koşarak yarış yapmalıyız', 'Merdiven korkuluklarından kaymalıyız'], exp: 'Kazaları önlemek için koridor ve merdivenlerde yavaş ve sağdan yürürüz.' },
      { q: 'Arkadaşımız bize yardım ettiğinde hangi nezaket sözünü söyleriz? 🤝', a: 'Teşekkür ederim 🙏', d: ['Özür dilerim', 'Rica ederim'], exp: 'Bize yardım eden birine "Teşekkür ederim" deriz.' },
      { q: 'İstemeden arkadaşımıza çarptığımızda hangi nezaket sözünü söyleriz? 🥺', a: 'Özür dilerim 🤝', d: ['Teşekkürler', 'Güle güle'], exp: 'Hata yaptığımızda ya da birine çarptığımızda "Özür dilerim" deriz.' },
      { q: 'Sabah okula geldiğimizde öğretmenimize ve arkadaşlarımıza ne deriz? ☀️', a: 'Günaydın! ☀️', d: ['İyi geceler!', 'Güle güle!'], exp: 'Sabah karşılaştığımız kişilere "Günaydın" diyerek selam veririz.' },
      { q: 'Birinden silgi veya kalem ödünç isterken hangi sihirli kelimeyi kullanırız? ✨', a: 'Lütfen verebilir misin? ✨', d: ['Hemen ver!', 'Bana borçlusun!'], exp: 'Bir şey isterken kibarca "Lütfen" kelimesini kullanırız.' },
      { q: 'Okul tuvaletlerini kullandıktan sonra ellerimizi ne ile yıkamalıyız? 🧼', a: 'Su ve sabunla 🧼', d: ['Sadece peçeteyle sileriz', 'Yıkamamıza gerek yoktur'], exp: 'Mikroplardan korunmak için ellerimizi su ve sabunla en az 20 saniye yıkarız.' },
      { q: 'Sıramızı ve sınıfımızı temiz tutmak kimin görevidir? 🏫', a: 'Hepimizin görevidir 🤝', d: ['Sadece temizlik görevlisinin', 'Hiç kimsenin'], exp: 'Ortak yaşam alanımız olan sınıfı hep birlikte temiz tutarız.' },
      { q: 'Çöplerimizi nereye atmalıyız? 🗑️', a: 'Çöp kutusuna 🗑️', d: ['Sıranın altına', 'Pencereden dışarı'], exp: 'Çöpler daima çöp kutusuna atılır.' },
      { q: 'Evde kendi odamızı ve oyuncaklarımızı kim toplamalıdır? 🧸', a: 'Kendimiz toplamalıyız 👦', d: ['Sadece annemiz toplamalıdır', 'Hiç toplanmamalıdır'], exp: 'Sorumluluk sahibi çocuklar kendi oyuncaklarını ve odasını toplar.' },
      { q: 'Tanımadığımız biri bize çikolata veya hediye vermek isterse ne yapmalıyız? 🚫', a: 'Kabul etmeyip ailemize söylemeliyiz 🛑', d: ['Hemen alıp onunla gitmeliyiz', 'Teşekkür edip yemeliyiz'], exp: 'Güvenliğimiz için tanımadığımız kişilerden hiçbir şey almaz ve uzaklaşırız.' },
      { q: 'Evde pencereden veya balkondan aşağı doğru ne yapmamalıyız? 🏠', a: 'Sarkmamalıyız ⚠️', d: ['Hava almamalıyız', 'Bakmamalıyız'], exp: 'Düşme tehlikesine karşı pencere ve balkonlardan asla sarkılmaz.' },
      { q: 'Elektrik prizlerine ve kablolara ne yapmamalıyız? 🔌', a: 'Asla dokunmamalı ve cisim sokmamalıyız ⚡', d: ['Oyun oynamalıyız', 'Su dökmeliyiz'], exp: 'Elektrik prizleri çok tehlikelidir, asla yabancı cisim sokulmaz.' },
      { q: 'Islak ellerle elektrik anahtarına basmak neden tehlikelidir? 💧⚡', a: 'Elektrik çarpabilir ⚡', d: ['Düğme bozulur', 'Işık yanmaz'], exp: 'Su elektriği iletir ve ıslak elle dokunmak elektrik çarpmasına yol açar.' },
      { q: 'Ders zili çaldığında ne yapmalıyız? 🔔', a: 'Hemen sınıfımıza girip sıramıza oturmalıyız 📚', d: ['Bahçede oynamaya devam etmeliyiz', 'Okuldan dışarı çıkmalıyız'], exp: 'Zil çaldığında derse gecikmeden sınıfımıza geçeriz.' },
      { q: 'Okul servisindeyken güvenliğimiz için ne yapmalıyız? 🚌', a: 'Emniyet kemerini takıp oturmalıyız 🛡️', d: ['Ayakta gezinmeliyiz', 'Pencereden elimizi çıkarmalıyız'], exp: 'Servis hareket halindeyken emniyet kemeri bağlı şekilde oturulur.' },
      { q: 'Bayrak töreninde İstiklal Marşı söylenirken nasıl durmalıyız? 🇹🇷', a: 'Hazır ol vaziyetinde ve saygıyla 🇹🇷', d: ['Arkadaşımızla konuşarak', 'Kıpırdayıp oynayarak'], exp: 'Bayrağımıza ve marşımıza saygı için hazır ol vaziyetinde dimdik dururuz.' },
      { q: 'Okulda bir sorun yaşadığımızda ilk kime haber vermeliyiz? 👨‍🏫', a: 'Öğretmenimize veya nöbetçi öğretmene 👨‍🏫', d: ['Yoldan geçen yabancıya', 'Hiç kimseye'], exp: 'Okuldaki sorunlarımızı öğretmenlerimize iletiriz.' },
      { q: 'Arkadaşımızın boya kalemini kullanmak istediğimizde ne yaparız? 🖍️', a: 'İzin isteriz 🤝', d: ['Haber vermeden gizlice alırız', 'Zorla elinden kaparız'], exp: 'Başkasına ait bir eşyayı kullanmadan önce mutlaka izin almalıyız.' },
      { q: 'Yemek yerken ağzımızda lokma varken ne yapmamalıyız? 🍽️', a: 'Konuşmamalıyız 🤐', d: ['Çiğnememeliyiz', 'Yutmamalıyız'], exp: 'Görgü kuralı olarak ağzımızda yemek varken konuşmayız.' },
      { q: 'Akrabalarımızdan babamızın annesine ne deriz? 👵', a: 'Babaanne 👵', d: ['Anneanne', 'Hala'], exp: 'Babamızın annesi Babaanne, annemizin annesi Anneannedir.' },
      { q: 'Annemizin kız kardeşine ne deriz? 👩', a: 'Teyze 👩', d: ['Hala', 'Amca'], exp: 'Annemizin kız kardeşi teyzemizdir.' },
      { q: 'Babamızın erkek kardeşine ne deriz? 👨', a: 'Amca 👨', d: ['Dayı', 'Teyze'], exp: 'Babamızın erkek kardeşi amcamızdır.' },
      { q: 'Büyüklerimizin konuşması sırasında araya girmemiz gerektiğinde ne deriz? 🗣️', a: '"Özür dilerim, bölebilir miyim?" ✨', d: ['"Susun dinleyin!"', 'Bağırarak konuşuruz'], exp: 'Büyüklerin sözünü keserken kibarca özür dileyip izin isteriz.' },
      { q: 'Akşam yatarken aile bireylerimize ne dileriz? 🌙', a: 'İyi geceler / Tatlı rüyalar 🌙', d: ['Günaydın', 'Tünaydın'], exp: 'Uyumadan önce sevdiklerimize "İyi geceler" dileriz.' },
      { q: 'Sınıf kütüphanesinden aldığımız kitabı okuduktan sonra ne yapmalıyız? 📚', a: 'Zamanında ve yıpratmadan geri vermeliyiz 📚', d: ['Eve götürüp saklamalıyız', 'Sayfalarını yırtmalıyız'], exp: 'Kütüphane kitapları ortak maldır, özenle okunup zamanında iade edilir.' }
    ],

    // 1. SINIF: SAĞLIKLI HAYAT VE MEVSİMLER (26 ÖZGÜN SORU)
    grade1HealthSeasonsPool: [
      { q: 'Yemeklerden önce ve sonra mikroplardan korunmak için ne yaparız? 🧼', a: 'Ellerimizi su ve sabunla yıkarız 🧼', d: ['Hemen uyuruz', 'Oyun oynarız'], exp: 'Ellerimiz gün boyu kirlenir, yemekten önce ve sonra mutlaka sabunla yıkanmalıdır.' },
      { q: 'Dişlerimizin çürümemesi için günde en az kaç kez fırçalamalıyız? 🪥', a: 'Günde 2 kez (Sabah ve Akşam) 🪥', d: ['Haftada 1 kez', 'Hiç fırçalamamalıyız'], exp: 'Diş sağlığı için sabah kahvaltıdan sonra ve gece yatmadan önce fırçalarız.' },
      { q: 'Kemiklerimizin ve dişlerimizin güçlü olması için her gün ne içmeliyiz? 🥛', a: 'Süt 🥛', d: ['Gazoz', 'Kola'], exp: 'Süt kalsiyum deposudur, kemiklerimizi güçlendirir.' },
      { q: 'Güne zinde ve enerjik başlamak için sabahları ne yapmalıyız? 🍳', a: 'Dengeli kahvaltı yapmalıyız 🍳', d: ['Sadece cips yemeliyiz', 'Aç karnına okula gitmeliyiz'], exp: 'Kahvaltı günün en önemli öğünüdür; yumurta, peynir, süt içerir.' },
      { q: 'Hangi besin grubu sağlığımız için ZARARLIDIR? 🚫', a: 'Aşırı şekerli ve gazlı içecekler 🥤', d: ['Taze elma ve havuç 🍎', 'Balık ve yoğurt 🐟'], exp: 'Asitli içecekler ve aşırı şeker dişlerimizi çürütür, sağlığımızı bozar.' },
      { q: 'Vücudumuzun susuz kalmaması için günde bol bol ne içmeliyiz? 💧', a: 'Temiz su 💧', d: ['Meyve suyu kutusu', 'Çay'], exp: 'Su yaşam kaynağımızdır, her gün yeterli su içmeliyiz.' },
      { q: 'Hapşırırken veya öksürürken ağzımızı ne ile kapatmalıyız? 🤧', a: 'Tek kullanımlık mendil veya dirsek içiyle 🧻', d: ['Elimizin ayasıyla', 'Kapatmamıza gerek yoktur'], exp: 'Mikropların etrafa yayılmaması için peçete veya dirsek içimizle kapatırız.' },
      { q: 'Ağaçların yaprak açtığı, çiçeklerin açtığı ve havaların ısındığı mevsim hangisidir? 🌸', a: 'İlkbahar 🌸', d: ['Kış ❄️', 'Sonbahar 🍂'], exp: 'İlkbaharda doğa uyanır, çiçekler açar, kuşlar öter.' },
      { q: 'Havanın en sıcak olduğu, denize girilen ve dondurma yenilen mevsim hangisidir? ☀️', a: 'Yaz ☀️', d: ['Kış ❄️', 'İlkbahar 🌸'], exp: 'Yaz mevsimi yılın en sıcak mevsimidir.' },
      { q: 'Ağaçların yapraklarını döktüğü, rüzgarlı ve okulların açıldığı mevsim hangisidir? 🍂', a: 'Sonbahar 🍂', d: ['İlkbahar 🌸', 'Yaz ☀️'], exp: 'Sonbaharda sararan yapraklar dökülür ve okullar başlar.' },
      { q: 'Havanın en soğuk olduğu, kar yağdığı ve kardan adam yapılan mevsim hangisidir? ⛄', a: 'Kış ❄️', d: ['Yaz ☀️', 'İlkbahar 🌸'], exp: 'Kış mevsiminde havalar çok soğur, kar yağar ve kalın giyiniriz.' },
      { q: 'Bir yılda toplam kaç mevsim vardır? 🌍', a: '4 mevsim (İlkbahar, Yaz, Sonbahar, Kış) 🍂', d: ['2 mevsim', '12 mevsim'], exp: 'Bir yılda 4 mevsim vardır: İlkbahar, Yaz, Sonbahar, Kış.' },
      { q: 'Kış mevsiminde dışarı çıkarken nasıl giyinmeliyiz? 🧣', a: 'Kalın mont, bere ve eldiven giymeliyiz 🧤', d: ['Şort ve tişört giymeliyiz', 'Terlikle çıkmalıyız'], exp: 'Üşütüp hasta olmamak için kışın kalın yünlü giysiler tercih ederiz.' },
      { q: 'Yaz mevsiminde Güneş\'in yakıcı ışınlarından korunmak için ne takarız? 🧢', a: 'Güneş şapkası ve gözlük 🧢', d: ['Yün atkı ve bere 🧣', 'Kalın eldiven 🧤'], exp: 'Yazın başımıza güneş geçmemesi için şapka takarız.' },
      { q: 'Hangisi C vitamini deposu olan bir kış meyvesidir? 🍊', a: 'Portakal ve Mandalina 🍊', d: ['Karpuz 🍉', 'Kiraz 🍒'], exp: 'Portakal ve mandalina kışın bizi gripten koruyan vitamin depolarıdır.' },
      { q: 'Gözlerimizin sağlıklı görmesi için hangi sebzeyi tüketmek çok faydalıdır? 🥕', a: 'Havuç 🥕', d: ['Şeker', 'Çikolata'], exp: 'Havuç bol A vitamini içerir ve gözlerimizi korur.' },
      { q: 'Geceleri sağlıklı büyümek için vaktinde ne yapmalıyız? 😴', a: 'Erken yatıp uyumalıyız 😴', d: ['Gece geç saatlere kadar televizyon izlemeliyiz', 'Bilgisayar oynamalıyız'], exp: 'Büyüme hormonu uykuda salgılanır, çocuklar erken uyumalıdır.' },
      { q: 'Tırnaklarımız uzadığında ne yapmalıyız? ✂️', a: 'Büyüklerimizden yardım alarak temizce kesmeliyiz ✂️', d: ['Tırnaklarımızı dişlerimizle yemeliyiz', 'Uzamasına izin vermeliyiz'], exp: 'Uzayan tırnakların altında mikrop birikir, düzenli kesilmelidir.' },
      { q: 'Saçlarımızın ve vücudumuzun temiz olması için haftada en az kaç kez banyo yapmalıyız? 🚿', a: 'En az 2 kez 🚿', d: ['Yılda 1 kez', 'Hiç yapmamalıyız'], exp: 'Kişisel temizlik için düzenli banyo yapmak çok önemlidir.' },
      { q: 'Meyve ve sebzeleri yemeden önce mutlaka ne yapmalıyız? 🍎', a: 'Bol temiz suyla yıkamalıyız 💧', d: ['Hemen kabuğuyla yıkamadan yemeliyiz', 'Tozunu silip yemeliyiz'], exp: 'Üzerindeki toz ve tarım ilaçlarından arındırmak için meyveleri yıkarız.' },
      { q: 'Kardan adam ⛄ hangi mevsimde yapılabilir?', a: 'Kış ❄️', d: ['Yaz ☀️', 'İlkbahar 🌸'], exp: 'Kardan adam sadece kar yağan kış mevsiminde yapılır.' },
      { q: 'Deniz ve kum mevsimi hangi mevsimdir? 🏖️', a: 'Yaz ☀️', d: ['Kış ❄️', 'Sonbahar 🍂'], exp: 'Yazın hava sıcak olduğu için denize girilir.' },
      { q: 'Yağmur yağdığında ıslanmamak için yanımıza ne alırız? ☔', a: 'Şemsiye ☔', d: ['Güneş kremi', 'Yelpaze'], exp: 'Yağmurdan korunmak için şemsiye ve yağmurluk kullanırız.' },
      { q: 'Gözlerimizin yorulmaması için tablete ve ekrana nasıl bakmalıyız? 📱', a: 'Günde kısa süre ve belirli mesafeden ⏳', d: ['Karanlıkta çok yakından saatlerce', 'Hiç bırakmadan'], exp: 'Ekranlara çok yakından ve uzun süre bakmak göz sağlığını bozar.' },
      { q: 'Spor yapmak ve bahçede koşup oynamak vücudumuza ne kazandırır? ⚽', a: 'Sağlık ve güç kazandırır 💪', d: ['Bizi tembelleştirir', 'Hastalandırır'], exp: 'Hareket etmek kalbimizi, kaslarımızı ve kemiklerimizi güçlendirir.' },
      { q: 'Hasta olduğumuzda iyileşmek için kime gideriz? 🩺', a: 'Doktora 👨‍⚕️', d: ['Bakkala', 'Terziye'], exp: 'Hastalıklarımızı teşhis ve tedavi eden sağlık uzmanı doktordur.' }
    ],

    grade1TurkishPool: [
      { q: '"Büyük" kelimesinin zıt anlamlısı nedir?', a: 'Küçük', d: ['İri', 'Geniş'], exp: 'Büyük ve Küçük birbirinin tam karşıtı olan zıt kavramlardır.', audioKey: 'q_zit_buyuk' },
      { q: '"Uzun" kelimesinin zıt anlamlısı nedir?', a: 'Kısa', d: ['İnce', 'Düz'], exp: 'Uzun boyun zıttı kısa boydur.', audioKey: 'q_zit_uzun' },
      { q: '"Sıcak" kelimesinin zıt anlamlısı nedir?', a: 'Soğuk', d: ['Ilık', 'Buz'], exp: 'Sıcak havanın zıttı soğuk havadır.', audioKey: 'q_zit_sicak' },
      { q: '"Hızlı" kelimesinin zıt anlamlısı nedir?', a: 'Yavaş', d: ['Durgun', 'Sakin'], exp: 'Tavşan hızlıdır, kaplumbağa ise yavaştır.', audioKey: 'q_zit_hizli' },
      { q: '"Açık" kelimesinin zıt anlamlısı nedir?', a: 'Kapalı', d: ['Koyu', 'Kilitli'], exp: 'Açık kapının karşıtı kapalı kapıdır.', audioKey: 'q_zit_acik' },
      { q: '"Dolu" kelimesinin zıt anlamlısı nedir?', a: 'Boş', d: ['Yarım', 'Temiz'], exp: 'Dolu bardağın karşıtı boş bardaktır.', audioKey: 'q_zit_dolu' },
      { q: '"Gece" kelimesinin zıt anlamlısı nedir?', a: 'Gündüz', d: ['Akşam', 'Sabah'], exp: 'Güneş battığında gece, doğduğunda gündüz olur.', audioKey: 'q_zit_gece' },
      { q: '"Ağır" kelimesinin zıt anlamlısı nedir?', a: 'Hafif', d: ['Küçük', 'Yumuşak'], exp: 'Fil ağırdır, kuş tüyü ise hafiftir.', audioKey: 'q_zit_agir' },
      { q: '"Ön" kelimesinin zıt anlamlısı nedir?', a: 'Arka', d: ['Yan', 'Üst'], exp: 'Ön tarafın zıttı arka taraftır.', audioKey: 'q_zit_on' },
      { q: 'Hangisi bir sesli (ünlü) harftir?', a: 'A', d: ['B', 'K'], exp: 'Alfabemizdeki ünlü harfler: A, E, I, İ, O, Ö, U, Ü.', audioKey: 'q_harf_sesli' },
      { q: '"KALEM" kelimesi kaç harflidir?', a: '5', d: ['4', '6'], exp: 'K-A-L-E-M kelimesi 5 harften oluşur.', audioKey: 'q_harf_kalem' },
      { q: 'Hangi hayvan havada uçar?', a: 'Kuş', d: ['Kedi', 'Balık'], exp: 'Kuşların kanatları vardır ve uçabilirler.', audioKey: 'q_kus_ucan' }
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
    // 2. SINIF: BASAMAK DEĞERİ VE SAYILAR DİNAMİK ÜRETECİ (SINIRSIZ SORU)
    generateGrade2PlaceValue() {
      const mode = Math.floor(Math.random() * 4);
      if (mode === 0) {
        // Onluk ve Birlikten Sayı Oluşturma
        const tens = Math.floor(Math.random() * 8) + 2; // 2..9
        const ones = Math.floor(Math.random() * 9) + 1; // 1..9
        const num = tens * 10 + ones;
        return {
          question: `${tens} onluk ve ${ones} birlikten oluşan sayı kaçtır? 📦`,
          correct: num.toString(),
          distractors: [(ones * 10 + tens).toString(), (num + 10).toString()],
          explanation: `${tens} onluk = ${tens * 10}, ${ones} birlik = ${ones}. Sayı: ${num}'dur.`
        };
      } else if (mode === 1) {
        // Basamak Değeri
        const tens = Math.floor(Math.random() * 8) + 2; // 2..9
        const ones = Math.floor(Math.random() * 9) + 1; // 1..9
        const num = tens * 10 + ones;
        const askTens = Math.random() > 0.5;
        if (askTens) {
          return {
            question: `"${num}" sayısındaki ${tens} rakamının basamak değeri kaçtır? 🔢`,
            correct: (tens * 10).toString(),
            distractors: [tens.toString(), (tens * 10 + ones).toString()],
            explanation: `${tens} rakamı onlar basamağında yer aldığı için basamak değeri ${tens} × 10 = ${tens * 10}'dur.`
          };
        } else {
          return {
            question: `"${num}" sayısındaki ${ones} rakamının basamak değeri kaçtır? 🔢`,
            correct: ones.toString(),
            distractors: [(ones * 10).toString(), num.toString()],
            explanation: `${ones} rakamı birler basamağında yer aldığı için basamak değeri ${ones}'dir.`
          };
        }
      } else if (mode === 2) {
        // En Yakın Onluğa Yuvarlama
        const tens = Math.floor(Math.random() * 8) + 1; // 1..8
        const ones = Math.floor(Math.random() * 9) + 1; // 1..9
        const num = tens * 10 + ones;
        const rounded = ones >= 5 ? (tens + 1) * 10 : tens * 10;
        const otherTens = ones >= 5 ? tens * 10 : (tens + 1) * 10;
        return {
          question: `"${num}" sayısı en yakın hangi onluğa yuvarlanır? 🎯`,
          correct: rounded.toString(),
          distractors: [otherTens.toString(), (rounded + 10).toString()],
          explanation: `Birler basamağında ${ones} vardır. (${ones >= 5 ? '5 ve üzeri olduğu için yukarı' : '5\'ten küçük olduğu için aşağı'}) ${rounded} sayısına yuvarlanır.`
        };
      } else {
        // Deste ve Düzine
        const isDeste = Math.random() > 0.5;
        if (isDeste) {
          const count = Math.floor(Math.random() * 3) + 1; // 1..3 deste
          const ans = count * 10;
          return {
            question: `${count} deste kalem toplam kaç tanedir? 📦`,
            correct: `${ans} tane`,
            distractors: [`${ans + 2} tane`, `${ans - 2} tane`],
            explanation: `1 deste = 10 tanedir. ${count} deste = ${count} × 10 = ${ans} tane eder.`
          };
        } else {
          const count = Math.floor(Math.random() * 2) + 1; // 1..2 düzine
          const ans = count * 12;
          return {
            question: `${count} düzine gül toplam kaç tanedir? 🌹`,
            correct: `${ans} tane`,
            distractors: [`${count * 10} tane`, `${ans + 4} tane`],
            explanation: `1 düzine = 12 tanedir. ${count} düzine = ${count} × 12 = ${ans} tane eder.`
          };
        }
      }
    },

    // 2. SINIF: HIZLI ÇARPMA DİNAMİK ÜRETECİ (2, 3, 4, 5'LERLE ÇARPIM TABLOSU)
    generateGrade2Multiplication() {
      const multipliers = [2, 3, 4, 5];
      const a = multipliers[Math.floor(Math.random() * multipliers.length)];
      const b = Math.floor(Math.random() * 9) + 2; // 2..10
      const ans = a * b;
      const isWordProblem = Math.random() < 0.35;

      if (isWordProblem) {
        const problems = [
          { text: `Günde ${a} elma yiyen Ayşe, ${b} günde toplam kaç elma yer? 🍎`, exp: `${b} gün boyunca her gün ${a} elma: ${b} × ${a} = ${ans} elma eder.` },
          { text: `Her masada ${a} öğrenci oturuyor. ${b} masada toplam kaç öğrenci vardır? 🏫`, exp: `${b} masada ${a}'şar öğrenci: ${b} × ${a} = ${ans} öğrenci eder.` },
          { text: `Tanesi ${a} TL olan defterlerden ${b} tane alan Mert satıcıya kaç TL öder? 📚`, exp: `${b} tane ${a} TL: ${b} × ${a} = ${ans} TL öder.` },
          { text: `Bir sandalyenin 4 ayağı vardır. ${b} sandalyenin toplam kaç ayağı vardır? 🪑`, forceA: 4, ans: 4 * b, exp: `${b} sandalye × 4 ayak = ${4 * b} ayak eder.` }
        ];
        const prob = problems[Math.floor(Math.random() * problems.length)];
        const finalAns = prob.forceA ? prob.ans : ans;
        return {
          question: prob.text,
          correct: finalAns.toString(),
          distractors: [(finalAns + a).toString(), Math.max(1, finalAns - a).toString()],
          explanation: prob.exp
        };
      } else {
        return {
          question: `${a} × ${b} = ? ✖️`,
          correct: ans.toString(),
          distractors: [(ans + a).toString(), Math.max(1, ans - a).toString()],
          explanation: `${a} kere ${b} = ${ans} eder. Çarpma, aynı sayıyı tekrarlı toplama işlemidir.`
        };
      }
    },

    // 2. SINIF: ZAMANI ÖLÇME VE SAATLER (26 ÖZGÜN SORU)
    grade2ClocksPool: [
      { q: 'Saat üzerinde kısa ve kalın olan, saati gösteren kola ne ad verilir? ⏰', a: 'Akrep ⏰', d: ['Yelkovan', 'Saniye ibresi'], exp: 'Kısa kol akreptir ve saati gösterir.' },
      { q: 'Saat üzerinde uzun olan ve dakikaları gösteren kola ne ad verilir? ⏰', a: 'Yelkovan ⏰', d: ['Akrep', 'Zaman ibresi'], exp: 'Uzun kol yelkovandır ve dakikayı gösterir.' },
      { q: 'Akrep 4\'ü, yelkovan ise tam 12\'yi gösteriyorsa saat kaçtır? ⏰', a: 'Saat 04:00 (Tam saat) ⏰', d: ['Saat 04:30', 'Saat 12:20'], exp: 'Yelkovan 12\'de iken saat tam saattir (04:00).' },
      { q: 'Yelkovan tam 6\'nın üzerindeyken saat nasıl okunur? ⏳', a: 'Buçuk (Yarım saat) ⏳', d: ['Tam saat', 'Çeyrek geçiyor'], exp: 'Yelkovan 6\'da iken 30 dakikayı, yani "buçuk" olduğunu gösterir.' },
      { q: 'Akrep 2 ile 3\'ün tam ortasında, yelkovan 6\'da ise saat kaçtır? ⏰', a: '2 buçuk (02:30) ⏰', d: ['Saat 03:00', 'Saat 06:15'], exp: 'Akrep 2 ile 3 arasında, yelkovan 6\'da ise saat 2 buçuktur.' },
      { q: '1 saat kaç dakikaya eşittir? ⏳', a: '60 dakika ⏳', d: ['30 dakika', '100 dakika'], exp: '1 saat = 60 dakikadır.' },
      { q: 'Yarım saat kaç dakikadır? ⏳', a: '30 dakika ⏳', d: ['15 dakika', '45 dakika'], exp: '60 dakikanın yarısı 30 dakikadır.' },
      { q: 'Çeyrek saat kaç dakikadır? ⏳', a: '15 dakika ⏳', d: ['30 dakika', '20 dakika'], exp: 'Bir saatin çeyreği 15 dakikadır.' },
      { q: 'Bir gün kaç saattir? 🌍', a: '24 saat 🌍', d: ['12 saat', '48 saat'], exp: 'Dünya\'nın kendi etrafında 1 tam turu 24 saat, yani 1 gündür.' },
      { q: 'Bir hafta kaç gündür? 📅', a: '7 gün 📅', d: ['5 gün', '10 gün'], exp: 'Bir haftada 7 gün vardır: Pazartesi, Salı, Çarşamba, Perşembe, Cuma, Cumartesi, Pazar.' },
      { q: 'Bir yılda kaç ay vardır? 🗓️', a: '12 ay 🗓️', d: ['10 ay', '4 ay'], exp: 'Ocak ayından Aralık ayına kadar 1 yılda 12 ay vardır.' },
      { q: 'Bir yılda toplam kaç mevsim vardır? 🍂', a: '4 mevsim 🍂', d: ['12 mevsim', '52 mevsim'], exp: 'İlkbahar, Yaz, Sonbahar, Kış olmak üzere 4 mevsim vardır.' },
      { q: 'Bir yılda kaç hafta vardır? 📆', a: '52 hafta 📆', d: ['40 hafta', '30 hafta'], exp: 'Bir takvim yılında yaklaşık 52 hafta bulunur.' },
      { q: 'Haftanın ilk (1.) günü hangisidir? 🗓️', a: 'Pazartesi 🗓️', d: ['Pazar', 'Salı'], exp: 'Haftanın başlangıç günü Pazartesidir.' },
      { q: 'Haftanın tatil günleri (hafta sonu) hangileridir? 🎈', a: 'Cumartesi ve Pazar 🎈', d: ['Pazartesi ve Salı', 'Perşembe ve Cuma'], exp: 'Cumartesi ve Pazar günleri hafta sonu tatilidir.' },
      { q: 'Yelkovan 3\'ün üzerindeyken saat nasıl okunur? ⏰', a: 'Çeyrek geçiyor ⏰', d: ['Çeyrek var', 'Buçuk'], exp: 'Yelkovan 3\'te iken 15 dakika geçmektedir (çeyrek geçiyor).' },
      { q: 'Yelkovan 9\'un üzerindeyken saat nasıl okunur? ⏰', a: 'Çeyrek var ⏰', d: ['Çeyrek geçiyor', 'Tam saat'], exp: 'Yelkovan 9\'da iken bir sonraki saate 15 dakika kalmıştır (çeyrek var).' },
      { q: 'Saat 03:00\'ten 2 saat sonra saat kaç olur? ⏰', a: '05:00 ⏰', d: ['04:00', '06:00'], exp: '3 + 2 = 5 olur (05:00).' },
      { q: 'Saat 10:30\'da başlayan 30 dakikalık çizgi film saat kaçta biter? 📺', a: '11:00 📺', d: ['11:30', '12:00'], exp: '10:30 üzerine 30 dakika eklenince saat tam 11:00 olur.' },
      { q: 'Bir ay yaklaşık olarak kaç haftadır? 📅', a: '4 hafta 📅', d: ['2 hafta', '6 hafta'], exp: 'Bir ayda yaklaşık 4 hafta vardır.' },
      { q: 'Bir ay genellikle kaç gündür? 🗓️', a: '30 veya 31 gün 🗓️', d: ['15 gün', '40 gün'], exp: 'Aylar takvimde 30 veya 31 gündür (Şubat 28-29 gündür).' },
      { q: 'Öğleden sonra saat 2:00 dijital saatte nasıl gösterilir? ⏰', a: '14:00 ⏰', d: ['12:00', '16:00'], exp: 'Öğleden sonra 12 + 2 = 14:00 olarak gösterilir.' },
      { q: 'Öğleden sonra saat 5:00 dijital saatte nasıl gösterilir? ⏰', a: '17:00 ⏰', d: ['15:00', '19:00'], exp: '12 + 5 = 17:00 olarak gösterilir.' },
      { q: 'Dün Salı ise yarın hangi gün olur? 📅', a: 'Perşembe 📅', d: ['Çarşamba', 'Cuma'], exp: 'Dün Salı ise bugün Çarşambadır, yarın ise Perşembedir.' },
      { q: 'Pazartesi gününden sonra hangi gün gelir? 🗓️', a: 'Salı 🗓️', d: ['Çarşamba', 'Pazar'], exp: 'Pazartesiden sonra Salı günü gelir.' },
      { q: 'Akrep ve yelkovanın her ikisi de 12\'nin üzerindeyse saat kaçtır? ⏰', a: '12:00 (Tam on iki) ⏰', d: ['06:00', '12:30'], exp: 'İkisi de 12\'de iken saat tam 12:00\'dir.' }
    ],

    // 2. SINIF: EŞ VE ZIT ANLAMLILAR ŞAMPİYONASI (45+ KELİME)
    grade2SynAntPool: [
      { q: '"Siyah" kelimesinin eş anlamlısı nedir? ⚫', a: 'Kara', d: ['Karanlık', 'Koyu'], exp: 'Siyah ve Kara eş anlamlıdır.' },
      { q: '"Beyaz" kelimesinin eş anlamlısı nedir? ⚪', a: 'Ak', d: ['Açık', 'Parlak'], exp: 'Beyaz ve Ak eş anlamlıdır.' },
      { q: '"Kırmızı" kelimesinin eş anlamlısı nedir? 🔴', a: 'Al', d: ['Bordo', 'Pembe'], exp: 'Kırmızı ve Al eş anlamlıdır.' },
      { q: '"Doktor" kelimesinin eş anlamlısı nedir? 👨‍⚕️', a: 'Hekim', d: ['Hemşire', 'Eczacı'], exp: 'Doktor ve Hekim eş anlamlıdır.' },
      { q: '"Talebe" kelimesinin eş anlamlısı nedir? 🎒', a: 'Öğrenci', d: ['Öğretmen', 'Müdür'], exp: 'Talebe ve Öğrenci eş anlamlıdır.' },
      { q: '"Mektep" kelimesinin eş anlamlısı nedir? 🏫', a: 'Okul', d: ['Sınıf', 'Kütüphane'], exp: 'Mektep ve Okul eş anlamlıdır.' },
      { q: '"Vatan" kelimesinin eş anlamlısı nedir? 🇹🇷', a: 'Yurt', d: ['Şehir', 'Dünya'], exp: 'Vatan ve Yurt eş anlamlıdır.' },
      { q: '"Cevap" kelimesinin eş anlamlısı nedir? ✍️', a: 'Yanıt', d: ['Soru', 'Mesaj'], exp: 'Cevap ve Yanıt eş anlamlıdır.' },
      { q: '"Soru" kelimesinin eş anlamlısı nedir? ❓', a: 'Sual', d: ['Cevap', 'Test'], exp: 'Soru ve Sual eş anlamlıdır.' },
      { q: '"Yıl" kelimesinin eş anlamlısı nedir? 🗓️', a: 'Sene', d: ['Ay', 'Mevsim'], exp: 'Yıl ve Sene eş anlamlıdır.' },
      { q: '"Zaman" kelimesinin eş anlamlısı nedir? ⏳', a: 'Vakit', d: ['Saat', 'Gün'], exp: 'Zaman ve Vakit eş anlamlıdır.' },
      { q: '"Kalp" kelimesinin eş anlamlısı nedir? ❤️', a: 'Yürek', d: ['Göğüs', 'Akıl'], exp: 'Kalp ve Yürek eş anlamlıdır.' },
      { q: '"Nehir" kelimesinin eş anlamlısı nedir? 🌊', a: 'Irmak', d: ['Göl', 'Deniz'], exp: 'Nehir ve Irmak eş anlamlıdır.' },
      { q: '"Hatıra" kelimesinin eş anlamlısı nedir? 📸', a: 'Anı', d: ['Resim', 'Rüya'], exp: 'Hatıra ve Anı eş anlamlıdır.' },
      { q: '"Konuk" kelimesinin eş anlamlısı nedir? 🏡', a: 'Misafir', d: ['Ev sahibi', 'Komşu'], exp: 'Konuk ve Misafir eş anlamlıdır.' },
      { q: '"Şair" kelimesinin eş anlamlısı nedir? 📜', a: 'Ozan', d: ['Yazar', 'Ressam'], exp: 'Şair ve Ozan eş anlamlıdır.' },
      { q: '"İsim" kelimesinin eş anlamlısı nedir? 🏷️', a: 'Ad', d: ['Soyadı', 'Başlık'], exp: 'İsim ve Ad eş anlamlıdır.' },
      { q: '"Rüzgar" kelimesinin eş anlamlısı nedir? 💨', a: 'Yel', d: ['Fırtına', 'Boran'], exp: 'Rüzgar ve Yel eş anlamlıdır.' },
      { q: '"Hediye" kelimesinin eş anlamlısı nedir? 🎁', a: 'Armağan', d: ['Paket', 'Ödül'], exp: 'Hediye ve Armağan eş anlamlıdır.' },
      { q: '"Fayda" kelimesinin eş anlamlısı nedir? ✨', a: 'Yarar', d: ['Kâr', 'Kazanç'], exp: 'Fayda ve Yarar eş anlamlıdır.' },
      { q: '"Baş" kelimesinin eş anlamlısı nedir? 🧠', a: 'Kafa', d: ['Boyun', 'Yüz'], exp: 'Baş ve Kafa eş anlamlıdır.' },
      { q: '"Yaşlı" kelimesinin eş anlamlısı nedir? 👴', a: 'İhtiyar', d: ['Büyük', 'Dedecik'], exp: 'Yaşlı ve İhtiyar eş anlamlıdır.' },
      { q: '"Görev" kelimesinin eş anlamlısı nedir? 📋', a: 'Vazife', d: ['İş', 'Ödev'], exp: 'Görev ve Vazife eş anlamlıdır.' },
      { q: '"Lider" kelimesinin eş anlamlısı nedir? 🎖️', a: 'Önder', d: ['Başkan', 'Kaptan'], exp: 'Lider ve Önder eş anlamlıdır.' },
      { q: '"Millet" kelimesinin eş anlamlısı nedir? 🇹🇷', a: 'Ulus', d: ['Halk', 'Toplum'], exp: 'Millet ve Ulus eş anlamlıdır.' },
      { q: '"Cümle" kelimesinin eş anlamlısı nedir? 📝', a: 'Tümce', d: ['Kelime', 'Paragraf'], exp: 'Cümle ve Tümce eş anlamlıdır.' },
      { q: '"Kelime" kelimesinin eş anlamlısı nedir? 📖', a: 'Sözcük', d: ['Harf', 'Hece'], exp: 'Kelime ve Sözcük eş anlamlıdır.' },
      { q: '"Sonbahar" mevsiminin eş anlamlısı nedir? 🍂', a: 'Güz', d: ['Bahar', 'Kış'], exp: 'Sonbahar ve Güz eş anlamlıdır.' },
      { q: '"Konut" kelimesinin eş anlamlısı nedir? 🏠', a: 'Ev', d: ['Oda', 'Bina'], exp: 'Konut ve Ev eş anlamlıdır.' },
      { q: '"Yaş" (ıslak) kelimesinin zıt anlamlısı nedir? 🌧️', a: 'Kuru', d: ['Sert', 'Ilık'], exp: 'Yaş (ıslak) olanın zıttı kurudur.' },
      { q: '"Cesur" kelimesinin zıt anlamlısı nedir? 🦁', a: 'Korkak', d: ['Zayıf', 'Ürkek'], exp: 'Cesur yüreğin zıttı korkaktır.' },
      { q: '"Taze" kelimesinin zıt anlamlısı nedir? 🥖', a: 'Bayat', d: ['Çürük', 'Eski'], exp: 'Taze ekmeğin zıttı bayat ekmektir.' },
      { q: '"Pahalı" kelimesinin zıt anlamlısı nedir? 🏷️', a: 'Ucuz', d: ['Bedava', 'Basit'], exp: 'Pahalının zıttı ucuzdur.' },
      { q: '"Yaşlı" kelimesinin zıt anlamlısı nedir? 👴', a: 'Genç', d: ['Çocuk', 'Taze'], exp: 'Yaşlının zıttı gençtir.' },
      { q: '"Erken" kelimesinin zıt anlamlısı nedir? ⏰', a: 'Geç', d: ['Yavaş', 'Sonra'], exp: 'Erken uyanmanın zıttı geç kalmaktır.' },
      { q: '"Temiz" kelimesinin zıt anlamlısı nedir? 🧼', a: 'Kirli', d: ['Paslı', 'Bozuk'], exp: 'Temizin zıttı kirlidir.' },
      { q: '"Kolay" kelimesinin zıt anlamlısı nedir? ✨', a: 'Zor', d: ['Ağır', 'Karışık'], exp: 'Kolayın zıttı zordur.' },
      { q: '"Aydınlık" kelimesinin zıt anlamlısı nedir? 💡', a: 'Karanlık', d: ['Gölge', 'Bulanık'], exp: 'Aydınlığın zıttı karanlıktır.' },
      { q: '"Barış" kelimesinin zıt anlamlısı nedir? 🕊️', a: 'Savaş', d: ['Kavga', 'Düşmanlık'], exp: 'Barışın zıttı savaştır.' },
      { q: '"Dost" kelimesinin zıt anlamlısı nedir? 🤝', a: 'Düşman', d: ['Yabancı', 'Kırgın'], exp: 'Dostun zıttı düşmandır.' },
      { q: '"Zengin" kelimesinin zıt anlamlısı nedir? 💰', a: 'Yoksul / Fakir', d: ['Cimri', 'Muhtaç'], exp: 'Zenginin zıttı yoksul / fakirdir.' },
      { q: '"Cömert" (eli açık) kelimesinin zıt anlamlısı nedir? 🤲', a: 'Cimri (eli sıkı)', d: ['Kötü', 'Kıskanç'], exp: 'Cömert paylaşır, cimri saklar.' },
      { q: '"Tatlı" elmanın zıt anlamlısı nedir? 🍎', a: 'Acı', d: ['Tuzlu', 'Ekşi'], exp: 'Tatlının zıttı acıdır.' },
      { q: '"Alçak" tepenin zıt anlamlısı nedir? 🏕️', a: 'Yüksek', d: ['Derin', 'Uzak'], exp: 'Alçağın zıttı yüksektir.' },
      { q: '"Geniş" caddenin zıt anlamlısı nedir? 🛣️', a: 'Dar', d: ['Kısa', 'İnce'], exp: 'Geniş caddenin zıttı dar sokaktır.' }
    ],

    // 2. SINIF: NOKTALAMA İŞARETLERİ VE YAZIM KURALLARI (26 ÖZGÜN SORU)
    grade2PunctuationPool: [
      { q: '"Ali bugün okula gitti( )" Cümlesinin sonuna hangi noktalama işareti konur? ✍️', a: 'Nokta (.)', d: ['Soru işareti (?)', 'Ünlem (!)'], exp: 'Tamamlanmış bitmiş haber cümlelerinin sonuna nokta (.) konur.' },
      { q: '"Sen de bizimle parka gelecek misin( )" Cümlesinin sonuna hangi noktalama işareti konur? ❓', a: 'Soru işareti (?)', d: ['Nokta (.)', 'Virgül (,)'], exp: 'Soru bildiren cümlelerin sonuna soru işareti (?) konur.' },
      { q: '"Eyvah, süt döküldü( )" Cümlesinin sonuna hangi noktalama işareti konur? ⚠️', a: 'Ünlem işareti (!)', d: ['Nokta (.)', 'Soru işareti (?)'], exp: 'Korku, heyecan, şaşkınlık bildiren cümlelerin sonuna ünlem işareti (!) konur.' },
      { q: '"Pazardan elma( ) armut ve muz aldık." Parantez içine hangi işaret gelmelidir? 🍎', a: 'Virgül (,)', d: ['Nokta (.)', 'Kesme işareti (\')'], exp: 'Birbiri ardınca sıralanan eş görevli kelimeler arasına virgül (,) konur.' },
      { q: '"Ankara( )ya hızlı trenle gittik." Şehir adına gelen eki ayırmak için ne kullanılır? 🏛️', a: 'Kesme işareti (\')', d: ['Virgül (,)', 'Kısa çizgi (-)'], exp: 'Özel isimlere getirilen ekleri ayırmak için kesme işareti (\') kullanılır.' },
      { q: 'Cümlelerin ilk harfi DAİMA nasıl başlar? ✍️', a: 'Büyük harfle başlar 🔤', d: ['Küçük harfle başlar', 'Fark etmez'], exp: 'Türkçemizde her cümle mutlaka büyük harfle başlar.' },
      { q: 'Hangisi özel bir isimdir ve ilk harfi daima BÜYÜK yazılmalıdır? 🇹🇷', a: 'Mustafa', d: ['kalem', 'defter'], exp: 'İnsan adları (özel isimler) her zaman büyük harfle başlar.' },
      { q: 'Şiirlerin her bir dizesi (mısrası) nasıl başlar? 📜', a: 'Büyük harfle başlar', d: ['Küçük harfle başlar', 'İstediğimiz gibi'], exp: 'Şiirlerin her dizesi büyük harfle başlatılır.' },
      { q: '"Yaşasın, sınavdan 100 aldım( )" Cümlesinin sonuna ne konur? 🎉', a: 'Ünlem işareti (!)', d: ['Soru işareti (?)', 'Nokta (.)'], exp: 'Sevinç ve coşku bildiren cümlelerin sonuna ünlem (!) konur.' },
      { q: '"Saat kaçta buluşacağız( )" Cümlesinin sonuna ne konur? ⏰', a: 'Soru işareti (?)', d: ['Nokta (.)', 'Ünlem (!)'], exp: 'Saat sorulduğu için soru işareti (?) kullanılır.' },
      { q: 'Aşağıdaki cümlelerin hangisinde yazım yanlışı YOKTUR? ✅', a: 'Mehmet dün Bursa\'ya gitti.', d: ['mehmet dün bursa\'ya gitti.', 'Mehmet dün bursaya gitti.'], exp: 'Cümle başı ve şehir adı büyük harfle başlar, kesme işaretiyle ek ayrılır.' },
      { q: '"İmdat, boğuluyorum( )" Cümlesinin sonuna hangi noktalama işareti konur? 🌊', a: 'Ünlem işareti (!)', d: ['Nokta (.)', 'Soru işareti (?)'], exp: 'Acil durum ve yardım çağrılarında ünlem işareti (!) kullanılır.' },
      { q: '"1( ) sınıf öğrencisiyiz." Sıra bildiren (birinci) sayısının yanına hangi işaret konur? 🥇', a: 'Nokta (.)', d: ['Virgül (,)', 'Soru işareti (?)'], exp: 'Sıra bildirmek için sayıların yanına nokta konur (1. = birinci).' },
      { q: 'Tarihlerin yazılışında gün, ay ve yıl arasına hangi noktalama işareti konur? 📅', a: 'Nokta (.)', d: ['Soru işareti (?)', 'Ünlem (!)'], exp: 'Örnek: 29.10.1923 şeklinde aralara nokta (.) konur.' },
      { q: '"Kitabını açtın mı( )" Cümlesinin sonuna hangi işaret gelir? 📖', a: 'Soru işareti (?)', d: ['Nokta (.)', 'Virgül (,)'], exp: 'Soru sorulduğu için soru işareti konur.' },
      { q: '"Çantamda kalem( ) silgi ve defter var." Boşluğa ne gelmelidir? 🎒', a: 'Virgül (,)', d: ['Nokta (.)', 'Ünlem (!)'], exp: 'Sıralanan eşyalar arasına virgül (,) konur.' },
      { q: '"Ah( ) ayağım taşa çarptı!" Acı bildiren ünlemden sonra virgül konabilir mi?', a: 'Evet, virgül konur 🥺', d: ['Hayır, hiçbir şey konmaz', 'Sadece nokta konur'], exp: 'Ünlem sözcüğünden sonra virgül konup ünlem işareti cümlenin sonuna bırakılabilir.' },
      { q: '"Atatürk( )ün hayatını okudum." Boşluğa hangi işaret gelir? 🇹🇷', a: 'Kesme işareti (\')', d: ['Virgül (,)', 'Nokta (.)'], exp: 'Atatürk özel isim olduğu için gelen ek kesme işaretiyle (\') ayrılır.' },
      { q: 'Satır sonuna sığmayan kelimeleri hecelerinden bölmek için ne kullanılır? ✍️', a: 'Kısa çizgi (-)', d: ['Nokta (.)', 'Virgül (,)'], exp: 'Satır sonuna sığmayan sözcükler hecesinden kısa çizgiyle (-) bölünür.' },
      { q: '"Türkiye( )nin başkenti Ankara( )dır." Cümlesinde parantezlere ne konur? 🏛️', a: 'Kesme işareti (\')', d: ['Virgül (,)', 'Nokta (.)'], exp: 'Türkiye ve Ankara özel isimlerine gelen ekler kesme işaretiyle ayrılır.' },
      { q: 'Hangisinin yazımı DOĞRUDUR? 🐶', a: 'Karabaş\'a yemek verdim.', d: ['karabaşa yemek verdim.', 'Karabaşa yemek verdim.'], exp: 'Hayvanlara verdiğimiz isimler de özel isimdir, büyük harfle başlar ve ek kesmeyle ayrılır.' },
      { q: '"Kiminle konuştun( )" Cümlesinin sonuna ne konur? 📱', a: 'Soru işareti (?)', d: ['Nokta (.)', 'Ünlem (!)'], exp: 'Soru bildirdiği için soru işareti (?) konur.' },
      { q: 'Cümle içinde konuşma çizgisi (uzun çizgi) nerede kullanılır? 🗣️', a: 'Karşılıklı konuşmaların başında 🗣️', d: ['Cümlenin sonunda', 'Kelime aralarında'], exp: 'Diyaloglarda konuşan kişinin sözü başına uzun çizgi (—) konur.' },
      { q: 'Hangisi bir soru cümlesidir? ❓', a: 'Ödevini yaptın mı?', d: ['Ödevimi bitirdim.', 'Çok güzel bir gün!'], exp: '"Yaptın mı?" soru bildirmektedir.' },
      { q: 'Hangisi bir ünlem cümlesidir? ⚡', a: 'Dikkat et, araba geliyor!', d: ['Araba çok hızlı gitti.', 'Araba ne renk?'], exp: 'Uyarı ve heyecan bildiren cümle ünlem cümlesidir.' },
      { q: '"Bugün hava çok güzel( )" Cümlesinin sonuna ne konur? ☀️', a: 'Nokta (.)', d: ['Soru işareti (?)', 'Virgül (,)'], exp: 'Haber cümlesi olduğu için sonuna nokta (.) konur.' }
    ],

    // 2. SINIF: GÜVENLİ HAYAT VE TRAFİK (26 ÖZGÜN SORU)
    grade2TrafficSafeLifePool: [
      { q: 'Trafik ışığında KIRMIZI ışık yandığında araçlar ve yayalar ne yapmalıdır? 🔴', a: 'Durmalıdır 🛑', d: ['Geçmelidir', 'Hızlanmalıdır'], exp: 'Kırmızı ışık daima "DUR" anlamına gelir.' },
      { q: 'Trafik ışığında SARI ışık yandığında ne yapılır? 🟡', a: 'Hazırlanılır ⚠️', d: ['Hemen koşulur', 'Geri dönülür'], exp: 'Sarı ışık durmaya veya geçmeye hazırlık aşamasıdır.' },
      { q: 'Trafik ışığında YEŞİL ışık yandığında ne yapılır? 🟢', a: 'Dikkatle geçilir 🚶‍♂️', d: ['Beklenir', 'Durulur'], exp: 'Yeşil ışık yolu kontrol ederek geç anlamına gelir.' },
      { q: 'Karşıdan karşıya geçerken caddenin neresinden geçmeliyiz? 🚦', a: 'Yaya ve okul geçidinden 🚶‍♂️', d: ['Arabaların arasından koşarak', 'Virajın köşesinden'], exp: 'Trafikte güvenli geçiş yerleri yaya geçitleri, alt ve üst geçitlerdir.' },
      { q: 'Ülkemizde acil durumlarda (Ambulans, İtfaiye, Polis) hangi TEK numara aranır? 🚑', a: '112 Acil Çağrı Merkezi 🚑', d: ['155', '110'], exp: 'Tüm acil yardım hatları 112 numarası altında birleştirilmiştir.' },
      { q: 'Otomobilde seyahat ederken güvenliğimiz için mutlaka ne takmalıyız? 🛡️', a: 'Emniyet kemeri 🛡️', d: ['Kulaklık', 'Güneş gözlüğü'], exp: 'Emniyet kemeri kaza anında bizi araç içinde tutarak hayat kurtarır.' },
      { q: '12 yaşından küçük çocuklar otomobilde nereye oturmalıdır? 🚗', a: 'Arka koltuğa ve çocuk koltuğuna 👶', d: ['Ön koltuğa', 'Sürücünün kucağına'], exp: 'Güvenlik kurallarına göre çocuklar mutlaka arka koltukta oturmalıdır.' },
      { q: 'Deprem sarsıntısı anında bina içindeysek hangi hayat kurtaran hareketi yaparız? 🛡️', a: 'Çök - Kapan - Tutun 🛡️', d: ['Merdivenlerden koşarak inmek', 'Balkondan aşağı atlamak'], exp: 'Sağlam bir eşyanın yanında Çök-Kapan-Tutun pozisyonu en güvenli harekettir.' },
      { q: 'Deprem ve acil durumlar sırasında kesinlikle hangisi KULLANILMAZ? 🚫', a: 'Asansör 🛗', d: ['Merdiven', 'Işıldak'], exp: 'Depremde elektrik kesilebilir veya asansör boşluğa düşebilir; asansör asla kullanılmaz.' },
      { q: 'Evimizde ve okulumuzda olası afetlere karşı önceden ne hazırlamalıyız? 🎒', a: 'Deprem ve Afet Çantası 🎒', d: ['Piknik sepeti', 'Oyuncak kutusu'], exp: 'Afet çantasında su, düdük, el feneri ve ilk yardım malzemeleri bulunur.' },
      { q: 'Okul servisi durmadan önce ne yapmamalıyız? 🚌', a: 'Ayağa kalkmamalı ve kapıya yönelmemeliyiz 🛑', d: ['Çantamızı tutmamalıyız', 'Oturmamalıyız'], exp: 'Servis tamamen durup kapı açılmadan ayağa kalkılmaz.' },
      { q: 'Bisiklet, kaykay veya paten sürerken başımızı korumak için ne takmalıyız? 🚴', a: 'Kask ve dizlik 🪖', d: ['Güneş şapkası', 'Kulaklık'], exp: 'Düşmelere karşı kask, dizlik ve dirseklik takmak zorunludur.' },
      { q: 'Yaya kaldırımı olmayan yollarda yayalar nereden yürümelidir? 🚶‍♂️', a: 'Yolun solundaki banketten (gelen aracı görerek) 🚶‍♂️', d: ['Yolun tam ortasından', 'Sağ taraftan araçlara arkasını dönerek'], exp: 'Kaldırımsız yollarda gelen trafiği görebilmek için sol banketten yürünür.' },
      { q: 'Trafik polisinin kollarını iki yana açması ne anlama gelir? 👮‍♂️', a: 'Kolların gösterdiği yöndeki araçlara geç, diğerlerine dur 🚦', d: ['Herkes koşsun', 'Tüm araçlar dursun'], exp: 'Trafik polisi işaretleri ışıklardan ve levhalardan önceliklidir.' },
      { q: 'Evde yangın çıktığında ve duman dolduğunda nasıl ilerlemeliyiz? 🔥', a: 'Yere yakın emekleyerek ve ıslak bezle ağzımızı kapatarak 🧯', d: ['Ayakta koşarak', 'Dolaba saklanarak'], exp: 'Zehirli duman yukarı yükselir, temiz hava yerde kalır; emekleyerek çıkılır.' },
      { q: '112 Acil Çağrı numarasını gereksiz yere meşgul etmek neden suç ve tehlikelidir? 🚑', a: 'Gerçekten yardıma ihtiyacı olanların hayatı tehlikeye girer ⚠️', d: ['Telefon faturası kabarır', 'Şarjımız biter'], exp: '112 hattı sadece gerçek hayati tehlikelerde aranmalıdır.' },
      { q: 'Trafikte ambulans veya itfaiyenin siren çalarak gelmesi durumunda ne yapılır? 🚑', a: 'Araçlar fermuar sistemiyle sağa ve sola açılarak yol verir 🛣️', d: ['Önlerine geçilir', 'Yol verilmez'], exp: 'Geçiş üstünlüğü olan ambulans ve itfaiyeye derhal yol açılır.' },
      { q: 'Üzerinde yürüyen çocuk resmi olan trafik levhası neyi bildirir? 🚸', a: 'Okul geçidini (Hızını azalt) 🚸', d: ['Park alanını', 'Bisiklet yolunu'], exp: 'Okul geçidi levhası sürücülerin yavaşlaması gerektiğini bildirir.' },
      { q: 'Kırmızı daire içinde bisiklet resmi ve üstünde kırmızı çizgi ne demektir? 🚫', a: 'Bisiklet giremez 🚫', d: ['Bisiklet yolu', 'Bisiklet parkı'], exp: 'Kırmızı yuvarlak yasaklama levhasıdır; bisiklet giremez demektir.' },
      { q: 'Yolculuk sırasında taşıtların camından dışarı ne yapmamalıyız? 🚗', a: 'Elimizi, kolumuzu veya başımızı çıkarmamalıyız 🛑', d: ['Dışarıya bakmamalıyız', 'Nefes almamalıyız'], exp: 'Camdan kol veya baş çıkarmak çok ağır kazalara yol açabilir.' },
      { q: 'Fırtınalı ve şimşekli havalarda açık alanda neyin altına SIĞINILMAZ? ⚡', a: 'Tek başına duran uzun ağaçların altına 🌳', d: ['Güvenli bir binanın içine', 'Bir evin içine'], exp: 'Yıldırım sivri ve tek duran yüksek ağaçlara düşme eğilimindedir.' },
      { q: 'Sel baskını tehlikesi olduğunda nereye doğru çıkılmalıdır? 🌊', a: 'Yüksek ve güvenli yerlere 🏔️', d: ['Bodrum katlara', 'Dere yataklarına'], exp: 'Sel sularından kaçınmak için yüksek yerlere çıkılır.' },
      { q: 'Evimizde gaz kaçağı veya gaz kokusu hissettiğimizde ilk ne yapmalıyız? ⚠️', a: 'Pencereleri açıp ortamı havalandırmalı, düğmelere dokunmamalıyız 🪟', d: ['Çakmak yakmalıyız', 'Işıkları açıp kapamalıyız'], exp: 'Kıvılcım patlamaya yol açabilir; hemen havalandırılıp vana kapatılır.' },
      { q: 'Trafikte yayaların güvenle karşıya geçmesini sağlayan köprülere ne denir? 🌉', a: 'Üst geçit 🌉', d: ['Otoyol', 'Tünel'], exp: 'Yayaların yolu üstten güvenle geçtiği köprülere üst geçit denir.' },
      { q: 'Yolun altından yayaların geçtiği tünel biçimindeki geçitlere ne denir? 🚇', a: 'Alt geçit 🚇', d: ['Kaldırım', 'Bariyer'], exp: 'Yolun altından güvenli geçiş sağlayan yer alt geçittir.' },
      { q: 'Araç durduktan sonra kapıyı açarken neden önce aynaya bakmalıyız? 🚪', a: 'Arkadan gelen bisikletli veya arabayı görüp çarpmamak için 🚴', d: ['Saçımızı düzeltmek için', 'Dışarısı aydınlık mı diye bakmak için'], exp: 'Kapı açılmadan önce arkadan araç gelip gelmediği kontrol edilir.' }
    ],

    // 2. SINIF: ÜLKEMİZ VE KÜLTÜRÜMÜZ (26 ÖZGÜN SORU)
    grade2CultureAndCountryPool: [
      { q: 'Şanlı Türk bayrağımızın rengi hangi renktir ve üzerindeki semboller nelerdir? 🇹🇷', a: 'Al (Kırmızı) zemin üzerine beyaz Hilal ve Yıldız 🌙⭐', d: ['Mavi zemin üzerine Güneş', 'Sarı zemin üzerine Kartal'], exp: 'Bayrağımız şehitlerimizin kanını temsil eden al zemin üzerinde hilal ve yıldız taşır.' },
      { q: 'İstiklal Marşımızın şairi (yazarı) kimdir? 📜', a: 'Mehmet Akif Ersoy 🇹🇷', d: ['Osman Zeki Üngör', 'Mustafa Kemal Atatürk'], exp: 'İstiklal Marşımızın şairi Mehmet Akif Ersoy\'dur.' },
      { q: 'İstiklal Marşımızın bestecisi (müziğini yapan) kimdir? 🎶', a: 'Osman Zeki Üngör 🎼', d: ['Mehmet Akif Ersoy', 'Aşık Veysel'], exp: 'Marşımızın bestecisi Osman Zeki Üngör\'dür.' },
      { q: 'Mustafa Kemal Atatürk hangi şehirde doğmuştur? 🏛️', a: 'Selanik 🏛️', d: ['İstanbul', 'Ankara'], exp: 'Atatürk 1881 yılında Selanik\'te doğmuştur.' },
      { q: 'Atatürk\'ün annesinin adı nedir? 👩', a: 'Zübeyde Hanım 👩', d: ['Makbule Hanım', 'Sabiha Hanım'], exp: 'Atatürk\'ün saygıdeğer annesi Zübeyde Hanım\'dır.' },
      { q: 'Atatürk\'ün babasının adı nedir? 👨', a: 'Ali Rıza Efendi 👨', d: ['Hasan Tahsin', 'Enver Paşa'], exp: 'Atatürk\'ün babası Ali Rıza Efendi\'dir.' },
      { q: 'Atatürk\'ün anıt mezarı olan Anıtkabir hangi şehrimizdedir? 🏛️', a: 'Ankara 🏛️', d: ['İstanbul', 'İzmir'], exp: 'Anıtkabir başkentimiz Ankara\'dadır.' },
      { q: '23 Nisan günü hangi bayramı coşkuyla kutlarız? 🎈', a: 'Ulusal Egemenlik ve Çocuk Bayramı 🎈', d: ['Cumhuriyet Bayramı', 'Zafer Bayramı'], exp: 'Atatürk 23 Nisan\'ı dünya çocuklarına armağan etmiştir.' },
      { q: '29 Ekim günü hangi bayramı kutlarız? 🇹🇷', a: 'Cumhuriyet Bayramı 🇹🇷', d: ['Gençlik ve Spor Bayramı', 'Çocuk Bayramı'], exp: '29 Ekim 1923\'te Cumhuriyet ilan edilmiştir.' },
      { q: '19 Mayıs günü hangi bayramı kutlarız? 🏃‍♂️', a: 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı ⚡', d: ['Zafer Bayramı', 'Demokrasi Bayramı'], exp: 'Atatürk Samsun\'a çıkarak Kurtuluş Savaşı\'nı 19 Mayıs\'ta başlatmıştır.' },
      { q: '30 Ağustos günü hangi bayramı kutlarız? 🎖️', a: 'Zafer Bayramı 🎖️', d: ['Cumhuriyet Bayramı', 'Çocuk Bayramı'], exp: 'Kurtuluş Savaşı\'nın büyük zaferle sonuçlandığı gündür.' },
      { q: 'Türkiye Cumhuriyeti\'nin başkenti neresidir? 🏛️', a: 'Ankara 🏛️', d: ['İstanbul', 'Bursa'], exp: 'Ülkemizin başkenti Ankara\'dır.' },
      { q: 'Dini bayramlarımız hangileridir? 🍬', a: 'Ramazan Bayramı ve Kurban Bayramı 🍬', d: ['23 Nisan ve 29 Ekim', 'Yılbaşı ve Bahar Bayramı'], exp: 'Dini bayramlarımız Ramazan ve Kurban Bayramıdır.' },
      { q: 'Bayramlarda büyüklerimizin elini öpmek ve akrabaları ziyaret etmek neyi pekiştirir? 🤝', a: 'Sevgi, saygı ve birlikteliği 🤝', d: ['Kavga etmeyi', 'Yalnız kalmayı'], exp: 'Bayramlar sevgi, yardımlaşma ve dayanışma günleridir.' },
      { q: 'Hangisi kültürümüze ait geleneksel bir içecektir? ☕', a: 'Türk Kahvesi ve Ayran 🥛', d: ['Gazoz', 'Kola'], exp: 'Ayran ve Türk kahvesi köklü kültürel mirasımızdır.' },
      { q: 'Geleneksel gölge oyunumuzun sevimli iki kahramanı kimdir? 🎭', a: 'Karagöz ve Hacivat 🎭', d: ['Keloğlan ve Cüce', 'Nasreddin Hoca ve Eşeği'], exp: 'Karagöz ve Hacivat geleneksel gölge tiyatromuzun ustalarıdır.' },
      { q: 'Fıkralarıyla hem güldüren hem düşündüren tarihi bilgemiz kimdir? 🫏', a: 'Nasreddin Hoca 🫏', d: ['Evliya Çelebi', 'Keloğlan'], exp: 'Nasreddin Hoca eşeğe ters binen bilge halk kahramanımızdır.' },
      { q: 'Hangisi milli marşımız okunurken takınmamız gereken doğru tutumdur? 🇹🇷', a: 'Kıpırdamadan hazır ol vaziyetinde durmak ve eşlik etmek 🇹🇷', d: ['Arkadaşımızla sohbet etmek', 'Telefonla oynamak'], exp: 'İstiklal Marşı\'na saygı milletimizin bağımsızlığına saygıdır.' },
      { q: 'Atatürk nerede hayata gözlerini yummuştur? 🏛️', a: 'İstanbul Dolmabahçe Sarayı 🏛️', d: ['Selanik', 'Anıtkabir'], exp: 'Atatürk 10 Kasım 1938\'de Dolmabahçe Sarayı\'nda vefat etmiştir.' },
      { q: 'Her yıl 10 Kasım saat 09:05\'te sirenler çaldığında ne yaparız? ⏳', a: '1 dakikalık saygı duruşuna geçeriz 🇹🇷', d: ['Şarkı söyleriz', 'Oyun oynarız'], exp: '10 Kasım Atatürk\'ü Anma Günü\'nde derin saygıyla saygı duruşunda bulunuruz.' },
      { q: 'Hangisi Türk mutfağının geleneksel ve dünyaca meşhur bir tatlısıdır? 🥮', a: 'Baklava ve Aşure 🥮', d: ['Pizza', 'Kruvasan'], exp: 'Baklava ve aşure geleneksel tatlılarımızdır.' },
      { q: 'Kültürümüzde askere giden gençlere veya düğünlerde geline ne yakılır? 🌿', a: 'Kına 🌿', d: ['Boya', 'Çamur'], exp: 'Kına yakmak köklü bir Türk geleneğidir.' },
      { q: 'Atatürk\'ün kız kardeşinin adı nedir? 👧', a: 'Makbule Hanım 👧', d: ['Zübeyde Hanım', 'Latife Hanım'], exp: 'Atatürk\'ün kız kardeşi Makbule (Atadan) Hanım\'dır.' },
      { q: 'Türkiye Büyük Millet Meclisi (TBMM) hangi şehirde açılmıştır? 🏛️', a: 'Ankara 🏛️', d: ['Selanik', 'Samsun'], exp: 'TBMM 23 Nisan 1920\'de Ankara\'da açılmıştır.' },
      { q: 'Düğünlerimizde ve bayramlarımızda davul ve zurna eşliğinde oynanan oyunlara ne denir? 🥁', a: 'Halk Oyunları (Halay, Zeybek, Horon) 💃', d: ['Bale', 'Modern dans'], exp: 'Halay, zeybek, horon zengin halk oyunlarımızdır.' },
      { q: 'Farklı kültürlerden ve ülkelerden gelen insanlara karşı nasıl davranmalıyız? 🤝', a: 'Hoşgörülü, misafirperver ve saygılı 🤝', d: ['Kaba ve dışlayıcı', 'Düşmanca'], exp: 'Milletimiz köklü bir misafirperverlik ve hoşgörü kültürüne sahiptir.' }
    ],

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

    // 3. SINIF: 3 BASAMAKLI SAYILAR, BASAMAK DEĞERİ VE ROMEN RAKAMLARI (DİNAMİK)
    generateGrade3RomenAndPlace() {
      const mode = Math.floor(Math.random() * 4);
      if (mode === 0) {
        // Romen Rakamları (I - XX)
        const romanMap = [
          { r: 'I', n: 1 }, { r: 'II', n: 2 }, { r: 'III', n: 3 }, { r: 'IV', n: 4 }, { r: 'V', n: 5 },
          { r: 'VI', n: 6 }, { r: 'VII', n: 7 }, { r: 'VIII', n: 8 }, { r: 'IX', n: 9 }, { r: 'X', n: 10 },
          { r: 'XI', n: 11 }, { r: 'XII', n: 12 }, { r: 'XIII', n: 13 }, { r: 'XIV', n: 14 }, { r: 'XV', n: 15 },
          { r: 'XVI', n: 16 }, { r: 'XVII', n: 17 }, { r: 'XVIII', n: 18 }, { r: 'XIX', n: 19 }, { r: 'XX', n: 20 }
        ];
        const item = romanMap[Math.floor(Math.random() * romanMap.length)];
        const askRoman = Math.random() > 0.5;

        if (askRoman) {
          return {
            question: `Romen rakamıyla "${item.r}" hangi doğal sayıdır? 🏛️`,
            correct: item.n.toString(),
            distractors: [
              (item.n > 1 ? item.n - 1 : item.n + 2).toString(),
              (item.n + 1).toString()
            ],
            explanation: `Romen rakamlarındaki "${item.r}" sayısı doğal sayılarda ${item.n} değerine karşılık gelir.`
          };
        } else {
          return {
            question: `"${item.n}" doğal sayısının ROMEN RAKAMIYLA yazılışı hangisidir? 🏛️`,
            correct: item.r,
            distractors: [
              romanMap[(item.n) % romanMap.length].r,
              romanMap[(item.n + 2) % romanMap.length].r
            ],
            explanation: `${item.n} doğal sayısı Romen rakamıyla "${item.r}" şeklinde yazılır.`
          };
        }
      } else if (mode === 1) {
        // 3 Basamaklı Sayılarda Basamak Değeri
        const hundreds = Math.floor(Math.random() * 8) + 1; // 1..8
        const tens = Math.floor(Math.random() * 9) + 1; // 1..9
        const ones = Math.floor(Math.random() * 9) + 1; // 1..9
        const num = hundreds * 100 + tens * 10 + ones;
        const target = Math.floor(Math.random() * 3);

        if (target === 0) {
          return {
            question: `"${num}" sayısındaki ${hundreds} rakamının BASAMAK DEĞERİ kaçtır? 📦`,
            correct: (hundreds * 100).toString(),
            distractors: [hundreds.toString(), (hundreds * 10).toString()],
            explanation: `${hundreds} rakamı yüzler basamağında yer aldığı için basamak değeri ${hundreds} × 100 = ${hundreds * 100}'dür.`
          };
        } else if (target === 1) {
          return {
            question: `"${num}" sayısındaki ${tens} rakamının BASAMAK DEĞERİ kaçtır? 📦`,
            correct: (tens * 10).toString(),
            distractors: [tens.toString(), (tens * 100).toString()],
            explanation: `${tens} rakamı onlar basamağında yer aldığı için basamak değeri ${tens} × 10 = ${tens * 10}'dur.`
          };
        } else {
          return {
            question: `"${num}" sayısındaki ${ones} rakamının BASAMAK DEĞERİ kaçtır? 📦`,
            correct: ones.toString(),
            distractors: [(ones * 10).toString(), (ones * 100).toString()],
            explanation: `${ones} rakamı birler basamağında yer aldığı için basamak değeri ${ones}'dir.`
          };
        }
      } else if (mode === 2) {
        // En Yakın Yüzlüğe Yuvarlama
        const hundreds = Math.floor(Math.random() * 8) + 1; // 1..8
        const tens = Math.floor(Math.random() * 9) + 1; // 1..9
        const ones = Math.floor(Math.random() * 9) + 1;
        const num = hundreds * 100 + tens * 10 + ones;
        const isUp = tens >= 5;
        const rounded = isUp ? (hundreds + 1) * 100 : hundreds * 100;
        const other = isUp ? hundreds * 100 : (hundreds + 1) * 100;

        return {
          question: `"${num}" sayısı en yakın hangi YÜZLÜĞE yuvarlanır? 🎯`,
          correct: rounded.toString(),
          distractors: [other.toString(), (rounded + 100).toString()],
          explanation: `Onlar basamağında ${tens} vardır (${tens >= 5 ? '5 ve üzeri olduğu için yukarı' : '5\'ten küçük olduğu için aşağı'}). Sayı ${rounded}'e yuvarlanır.`
        };
      } else {
        // Yüzlük, onluk, birlik çözümleme
        const h = Math.floor(Math.random() * 7) + 2;
        const t = Math.floor(Math.random() * 8) + 1;
        const o = Math.floor(Math.random() * 9) + 1;
        const val = h * 100 + t * 10 + o;

        return {
          question: `${h} yüzlük, ${t} onluk ve ${o} birlikten oluşan sayı kaçtır? 📦`,
          correct: val.toString(),
          distractors: [(h * 100 + o * 10 + t).toString(), (t * 100 + h * 10 + o).toString()],
          explanation: `${h} yüzlük = ${h * 100}, ${t} onluk = ${t * 10}, ${o} birlik = ${o}. Toplam = ${val}'dir.`
        };
      }
    },

    // 3. SINIF: ÇARPIM TABLOSU (6,7,8,9) VE BÖLME İŞLEMİ (DİNAMİK)
    generateGrade3MultDiv() {
      const mode = Math.floor(Math.random() * 3);
      if (mode === 0) {
        // 6, 7, 8, 9'larla Çarpım Tablosu
        const multipliers = [6, 7, 8, 9];
        const a = multipliers[Math.floor(Math.random() * multipliers.length)];
        const b = Math.floor(Math.random() * 8) + 2; // 2..9
        const ans = a * b;

        return {
          question: `${a} × ${b} = ? ✖️`,
          correct: ans.toString(),
          distractors: [
            (ans + (Math.random() > 0.5 ? a : b)).toString(),
            Math.max(2, ans - (Math.random() > 0.5 ? a : b)).toString()
          ],
          explanation: `${a} tane ${b} veya ${b} tane ${a} = ${ans} eder.`
        };
      } else if (mode === 1) {
        // Bölme İşlemi
        const divisors = [4, 5, 6, 7, 8, 9];
        const d = divisors[Math.floor(Math.random() * divisors.length)];
        const q = Math.floor(Math.random() * 8) + 2; // 2..9
        const dividend = d * q;

        return {
          question: `${dividend} ÷ ${d} = ? ➗`,
          correct: q.toString(),
          distractors: [(q + 1).toString(), Math.max(1, q - 1).toString()],
          explanation: `${dividend} sayısı ${d} eşit parçaya ayrıldığında her parça ${q} olur.`
        };
      } else {
        // Sözel Problem
        const problems = [
          {
            a: 8, b: 7,
            q: 'Günde 8 sayfa kitap okuyan Zeynep, 7 günde toplam kaç sayfa okur? 📖',
            ans: 56, exp: '7 gün × 8 sayfa = 56 sayfa okur.'
          },
          {
            a: 9, b: 6,
            q: 'Bir pastanede 6 tepsi kurabiye var. Her tepside 9 kurabiye olduğuna göre toplam kaç kurabiye vardır? 🍪',
            ans: 54, exp: '6 tepsi × 9 kurabiye = 54 kurabiye eder.'
          },
          {
            a: 7, b: 8,
            q: 'Tanesi 7 TL olan defterlerden 8 tane alan Can kırtasiyeciye kaç TL öder? 📚',
            ans: 56, exp: '8 defter × 7 TL = 56 TL öder.'
          },
          {
            a: 48, b: 6,
            q: '48 cevizi 6 kardeş eşit olarak paylaştığında her birine kaç ceviz düşer? 🌰',
            ans: 8, exp: '48 ceviz ÷ 6 kardeş = 8 ceviz düşer.'
          },
          {
            a: 72, b: 8,
            q: '72 misketi 8 arkadaş eşit paylaşıyor. Her bir arkadaşa kaç misket düşer? 🔮',
            ans: 9, exp: '72 misket ÷ 8 arkadaş = 9 misket düşer.'
          }
        ];
        const item = problems[Math.floor(Math.random() * problems.length)];
        return {
          question: item.q,
          correct: item.ans.toString(),
          distractors: [(item.ans + 6).toString(), Math.max(1, item.ans - 6).toString()],
          explanation: item.exp
        };
      }
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

    // 3. SINIF: GEZEGENİMİZ DÜNYA VE BEŞ DUYUMUZ (26 ÖZGÜN SORU)
    grade3EarthSensesPool: [
      { q: 'Eski zamanlarda Dünya\'nın düz bir tepsi gibi olduğunu sananların aksine, Dünya\'nın küre şeklinde olduğunu kanıtlayan ünlü denizci kimdir? ⛵', a: 'Macellan ⛵', d: ['Piri Reis', 'Kristof Kolomb'], exp: 'Macellan sürekli batıya yelken açarak başladığı yere dönmüş ve Dünya\'nın yuvarlaklığını ispatlamıştır.' },
      { q: 'Dünyamızın uzaydan bakıldığında "Mavi Gezegen" olarak görünmesinin temel sebebi nedir? 🌍', a: 'Yüzeyinin yaklaşık 3/4\'ünün sularla kaplı olması 🌊', d: ['Gökyüzünün mavi olması', 'Kutupların buz olması'], exp: 'Dünya yüzeyinin yaklaşık 4\'te 3\'ü deniz ve okyanus sularından oluştuğu için mavi görünür.' },
      { q: 'Dünyamızı saran ve içinde nefes aldığımız gaz katmanına ne ad verilir? 🌬️', a: 'Hava Katmanı (Atmosfer) 🌬️', d: ['Su Katmanı (Hidrosfer)', 'Taş Küre (Litosfer)'], exp: 'Dünyayı çepeçevre kuşatan gaz kalkanına atmosfer (hava küre) denir.' },
      { q: 'Üzerinde yaşadığımız, dağların, ovaların ve toprakların bulunduğu katman hangisidir? 🏔️', a: 'Kara Katmanı (Taş Küre / Litosfer) 🏔️', d: ['Ateş Küre (Magma)', 'Hava Küre'], exp: 'İnsanların ve karadaki canlıların üzerinde yaşadığı katman yer kabuğu (taş küre)dir.' },
      { q: 'Yanardağlardan çıkan lavların kaynağı olan aşırı sıcak erimiş kayaç katmanına ne denir? 🌋', a: 'Magma Katmanı (Ateş Küre / Pirosfer) 🌋', d: ['Çekirdek', 'Hava Katmanı'], exp: 'Taş kürenin altındaki erimiş kızgın lav tabakası ateş küredir.' },
      { q: 'Dünya\'nın en iç merkezinde bulunan, en sıcak ve en ağır katman hangisidir? 🟡', a: 'Çekirdek (Ağır Küre / Barisfer) 🟡', d: ['Taş Küre', 'Su Küre'], exp: 'Gezegenimizin tam kalbinde yer alan en yoğun ve en sıcak katman çekirdektir.' },
      { q: 'Görme duyusu organımız hangisidir? 👁️', a: 'Göz 👁️', d: ['Burun', 'Kulak'], exp: 'Gözümüz ışık yardımıyla çevremizi görmemizi sağlar.' },
      { q: 'Göz sağlığımızı korumak için hangisini yapmamalıyız? ❌', a: 'Televizyon ve tablete çok yakından bakmak ❌', d: ['Yeterli ışıkta kitap okumak', 'Havuç gibi vitaminli besinler yemek'], exp: 'Ekrana yakından bakmak gözleri yorar ve görme kusurlarına yol açabilir.' },
      { q: 'İşitme duyusu organımız hangisidir? 👂', a: 'Kulak 👂', d: ['Dil', 'Deri'], exp: 'Kulak ses dalgalarını algılayarak beynimize iletir.' },
      { q: 'Kulağımızı temizlerken sivri uçlu cisimler sokarsak hangi hassas yapımız zarar görebilir? ⚠️', a: 'Kulak Zarı 👂', d: ['Göz Bebeği', 'Burun Kemiği'], exp: 'Sivri cisimler kulak zarını delerek işitme kaybına neden olabilir.' },
      { q: 'Koku alma ve solunum duyusu organımız hangisidir? 👃', a: 'Burun 👃', d: ['Ağız', 'Deri'], exp: 'Burun hem nefes alıp havayı süzer hem de kokuları algılar.' },
      { q: 'Burun içindeki mukus tabakası ve kılların en önemli görevi nedir? 🛡️', a: 'Havayı ısıtıp nemlendirmek ve tozları filtrelemek 🛡️', d: ['Sadece koku almak', 'Ses çıkarmak'], exp: 'Burnumuz akciğerlere giden havayı ısıtır, nemlendirir ve tozları tutar.' },
      { q: 'Tat alma duyusu organımız hangisidir? 👅', a: 'Dil 👅', d: ['Dudak', 'Yanak'], exp: 'Dilimizin üzerindeki tat tomurcukları tatları ayırt etmemizi sağlar.' },
      { q: 'Dilimiz temel olarak hangi tatları algılayabilir? 🍯🍋', a: 'Tatlı, tuzlu, ekşi ve acı 👅', d: ['Sıcak ve soğuk', 'Sert ve yumuşak'], exp: 'Dilimiz tatlı, tuzlu, ekşi ve acı tatları beynimize iletir.' },
      { q: 'Bütün vücudumuzu kaplayan, dokunma duyusu organımız hangisidir? 🖐️', a: 'Deri 🖐️', d: ['Kas', 'Kemik'], exp: 'Deri vücudumuzun dış yüzeyini kaplar, sıcak-soğuk, sert-yumuşak hissini verir.' },
      { q: 'Grip veya nezle olduğumuzda yemeklerin tadını iyi alamamamızın sebebi nedir? 🍲', a: 'Koku ve tat alma duyularının birlikte çalışması 👃👅', d: ['Dilin küçülmesi', 'Dişlerin ağrıması'], exp: 'Tat duyusu ile koku alma duyusu birlikte çalışır; burnumuz tıkalıyken tatları tam alamayız.' },
      { q: 'Limon yerken yüzümüzü buruşturmamıza sebep olan tat hangisidir? 🍋', a: 'Ekşi 🍋', d: ['Tatlı', 'Acı'], exp: 'Limon ekşi bir tada sahiptir.' },
      { q: 'Hangisi duyu organlarımızdan birisi DEĞİLDİR? 🧠', a: 'Kalp ❤️', d: ['Göz 👁️', 'Deri 🖐️'], exp: 'Göz, kulak, burun, dil ve deri 5 duyu organımızdır; kalp ise dolaşım organıdır.' },
      { q: 'Güneş ışınlarının zararlı etkilerinden derimizi korumak için yazın ne kullanmalıyız? 🧴', a: 'Güneş kremi ve şapka 🧴', d: ['Kalın kazak', 'Gözlük bandı'], exp: 'Güneş kremi ve şapka cildi zararlı ultraviyole ışınlardan korur.' },
      { q: 'Görme engelli bireylerin okuyabilmesi için geliştirilen kabartmalı alfabeye ne ad verilir? 📖', a: 'Braille (Kabartma) Alfabesi 📖', d: ['Mors Alfabesi', 'Romen Alfabesi'], exp: 'Görme engelliler dokunma duyusuyla Braille kabartma alfabesini okurlar.' },
      { q: 'Çok sıcak bir çaydanlığa dokunduğumuzda elimizi anında çekmemizi sağlayan duyu organımız hangisidir? 🖐️', a: 'Deri 🖐️', d: ['Göz', 'Burun'], exp: 'Deri sıcaklığı hisseder ve tehlikeye karşı beynimize sinyal gönderir.' },
      { q: 'Hangisi Dünya\'mızın katmanlarından birisi DEĞİLDİR? 🪐', a: 'Halka Katmanı 🪐', d: ['Taş Küre', 'Su Küre'], exp: 'Satürn gibi gezegenlerde halka vardır, Dünya\'da halka katmanı yoktur.' },
      { q: 'Çok yüksek sesli ortamlarda çalışan işçiler kulaklarını korumak için ne takmalıdır? 🎧', a: 'Koruyucu kulaklık 🎧', d: ['Güneş gözlüğü', 'Kask'], exp: 'Koruyucu kulaklıklar kulak zarını şiddetli ses hasarından korur.' },
      { q: 'Aşağıdaki maddelerden hangisini koklamak burnumuza ve sağlığımıza CİDDİ ZARAR verir? ☠️', a: 'Çamaşır suyu ve kimyasal deterjanlar ☠️', d: ['Papatya çiçeği 🌼', 'Nane yaprağı 🌿'], exp: 'Kimyasal temizlik maddelerini koklamak solunum yollarına ve akciğerlere zehirli zarar verir.' },
      { q: 'Okyanuslar, denizler, göller ve yer altı suları Dünya\'nın hangi katmanını oluşturur? 🌊', a: 'Su Katmanı (Hidrosfer) 🌊', d: ['Hava Katmanı', 'Ateş Katmanı'], exp: 'Yeryüzündeki tüm su kaynakları su katmanını (su küre) meydana getirir.' },
      { q: 'Gözümüzün rengini veren renkli kısma ne ad verilir? 👁️', a: 'İris 👁️', d: ['Göz bebeği', 'Göz kapağı'], exp: 'Gözün kahverengi, mavi, yeşil olan renkli kısmına iris denir.' }
    ],

    // 3. SINIF: KUVVETİ TANIYALIM VE MADDE (26 ÖZGÜN SORU)
    grade3ForceMatterPool: [
      { q: 'Duran bir topa ayağımızla vurduğumuzda topa hangi kuvveti uygularız? ⚽', a: 'İtme kuvveti ⚽', d: ['Çekme kuvveti', 'Durdurma kuvveti'], exp: 'Bir cismi kendimizden uzaklaştırmak için itme kuvveti uygularız.' },
      { q: 'Masanın çekmecesini açmak için çekmeceye hangi kuvveti uygularız? 🚪', a: 'Çekme kuvveti 🚪', d: ['İtme kuvveti', 'Döndürme kuvveti'], exp: 'Bir cismi kendimize doğru yaklaştırmak için çekme kuvveti uygularız.' },
      { q: 'Hareket halindeki bir bisikletin frenine bastığımızda bisiklette ne gözlenir? 🚲', a: 'Yavaşlama ve durma 🛑', d: ['Hızlanma', 'Yön değiştirme'], exp: 'Fren kuvveti sürtünme oluşturarak hareketi yavaşlatır ve durdurur.' },
      { q: 'Uygulanan kuvvet ortadan kalktığında eski haline DÖNEBİLEN maddelere ne ad verilir? 🧽', a: 'Esnek Madde 🧽', d: ['Berk (Sert) Madde', 'Kırılgan Madde'], exp: 'Sünger ve paket lastiği sıkılınca şekil değiştirir, bırakılınca eski haline döner.' },
      { q: 'Aşağıdakilerden hangisi ESNEK bir maddedir? 🎈', a: 'Paket lastiği 🎈', d: ['Taş 🪨', 'Cam bardak 🥛'], exp: 'Paket lastiği çekilip bırakıldığında eski haline döner, esnektir.' },
      { q: 'Kuvvet uygulandığında kolayca kırılan ve eski haline dönemeyen maddelere ne denir? 🥛', a: 'Kırılgan Madde 🥛', d: ['Esnek Madde', 'Sıvı Madde'], exp: 'Cam, porselen ve ayna kırılgan maddelerdir.' },
      { q: 'Maddenin katı, sıvı ve gaz olmak üzere kaç temel hali vardır? 🧊💧💨', a: '3 hali vardır 🧊💧💨', d: ['2 hali', '5 hali'], exp: 'Maddeler doğada katı, sıvı ve gaz olmak üzere 3 temel halde bulunur.' },
      { q: 'Belirli bir şekli olan ve dışarıdan kuvvet uygulanmadıkça şeklini koruyan maddeler hangi haldedir? 🪨', a: 'Katı Madde 🪨', d: ['Sıvı Madde 💧', 'Gaz Madde 💨'], exp: 'Taş, masa, kalem gibi maddeler katıdır ve belirli şekilleri vardır.' },
      { q: 'Belirli bir şekli olmayan, akışkan olan ve bulunduğu kabın şeklini alan maddeler hangi haldedir? 💧', a: 'Sıvı Madde 💧', d: ['Katı Madde 🪨', 'Gaz Madde 💨'], exp: 'Su, süt, meyve suyu ve zeytinyağı sıvıdır; kabın şeklini alır.' },
      { q: 'Bulunduğu odanın veya kabın her yerine hızla yayılan maddeler hangi haldedir? 💨', a: 'Gaz Madde 💨', d: ['Katı Madde 🪨', 'Sıvı Madde 💧'], exp: 'Hava, su buharı ve parfüm kokusu gazdır; bulunduğu ortama hızla yayılır.' },
      { q: 'Buzluktan çıkarılan buz küpünün oda sıcaklığında eriyerek suya dönüşmesi hangi hal değişimidir? 🧊➡️💧', a: 'Katı halden sıvı hale geçiş (Erime) 💧', d: ['Donma', 'Buharlaşma'], exp: 'Buz ısı alarak erir ve katı halden sıvı hale geçer.' },
      { q: 'Çaydanlıkta kaynayan suyun buharlaşarak havaya karışması hangi hal değişimidir? 💧➡️💨', a: 'Sıvı halden gaz hale geçiş (Buharlaşma) 💨', d: ['Donma', 'Erime'], exp: 'Sıvı su kaynayınca gaz (su buharı) haline dönüşür.' },
      { q: 'Direksiyonu çevirdiğimizde arabaya hangi kuvvet etkisini uygulamış oluruz? 🚗', a: 'Döndürme ve yön değiştirme 🚗', d: ['Sadece yavaşlatma', 'Sadece durdurma'], exp: 'Direksiyonu çevirmek döndürme etkisi yaratarak aracın yönünü değiştirir.' },
      { q: 'Sallanan beşik veya lunaparktaki salıncak hangi hareketi yapar? 🎠', a: 'Sallanma hareketi 🎠', d: ['Hızlanma hareketi', 'Dönme hareketi'], exp: 'İleri geri gidip gelen salıncak sallanma hareketi yapar.' },
      { q: 'Aşağıdakilerden hangisi PÜRÜZSÜZ bir yüzeye örnektir? 🪞', a: 'Cam ayna 🪞', d: ['Ağaç kabuğu 🪵', 'Zımpara kağıdı'], exp: 'Ayna ve cam yüzeyler son derece pürüzsüz ve kaygandır.' },
      { q: 'Aşağıdakilerden hangisi KOKULU bir maddedir? 🌸', a: 'Gül kolonyası 🌸', d: ['Saf içme suyu 💧', 'Cam bardak 🥛'], exp: 'Gül kolonyası etrafa güçlü koku yayan bir maddedir.' },
      { q: 'Topacın veya saatin yelkovanının yaptığı hareket hangisidir? ⏰', a: 'Dönme hareketi 🔄', d: ['Sallanma hareketi', 'Yavaşlama hareketi'], exp: 'Kendi ekseni etrafında tur atan cisimler dönme hareketi yapar.' },
      { q: 'Futbol maçında kalecinin gelen şutu tutması kuvvetin hangi etkisine örnektir? 🧤', a: 'Durdurma etkisi 🧤', d: ['Hızlandırma etkisi', 'Şekil verme etkisi'], exp: 'Kaleci hareket halindeki topu yakalayarak durdurur.' },
      { q: 'Oyun hamuruna elimizle bastırdığımızda hamurda ne değişir? 🧸', a: 'Şekli değişir (Şekil değiştirme) 🧸', d: ['Rengi tamamen uçar', 'Tadı değişir'], exp: 'Kuvvet hamur ve sünger gibi maddelerde şekil değişikliği yapar.' },
      { q: 'Aşağıdakilerden hangisi BERK (SERT) bir maddedir? 🧱', a: 'Tuğla ve demir 🧱', d: ['Pamuk ☁️', 'Yün kazak 🧶'], exp: 'Tuğla ve demir kolay şekil değiştirmeyen sert (berk) maddelerdir.' },
      { q: 'Aşağıdakilerden hangisi bir GAZ maddedir? 🎈', a: 'Balonun içindeki hava 💨', d: ['Süt 🥛', 'Elma 🍎'], exp: 'Hava gaz halindeki bir maddedir.' },
      { q: 'Rüzgarın ağaç yapraklarını sallaması kuvvetin hangi türüne örnektir? 🍃', a: 'Havanın itme kuvveti 🍃', d: ['Çekme kuvveti', 'Mıknatıs kuvveti'], exp: 'Rüzgar hareket eden havanın uyguladığı itme kuvvetidir.' },
      { q: 'Yere düşen cam şişenin kırılması kuvvetin hangi sonucudur? 💥', a: 'Kırılma ve şekil değişikliği 💥', d: ['Esneklik', 'Donma'], exp: 'Kırılgan maddeler darbe alınca kırılır.' },
      { q: 'Kışın yağan kar taneleri suyun hangi halidir? ❄️', a: 'Katı hali ❄️', d: ['Sıvı hali', 'Gaz hali'], exp: 'Kar ve dolu suyun katılaşmış halidir.' },
      { q: 'Pürüzlü bir yüzeyde yürürken kayıp düşme ihtimalimiz neden daha azdır? 👟', a: 'Sürtünme daha fazla olduğu için 👟', d: ['Hava soğuk olduğu için', 'Yer yumuşak olduğu için'], exp: 'Pürüzlü yüzeyler sürtünmeyi artırarak tutunmayı kolaylaştırır.' },
      { q: 'Mıknatısın çiviyi çekmesi kuvvetin hangi türüne örnektir? 🧲', a: 'Temassız çekme kuvveti 🧲', d: ['İtme kuvveti', 'Döndürme kuvveti'], exp: 'Mıknatıs dokunmadan uzaktan bile manyetik çekme kuvveti uygulayabilir.' }
    ],

    // 3. SINIF: YÖNLERİMİZ, KROKİ VE TÜKETİCİ HAKLARI (26 ÖZGÜN SORU)
    grade3CompassConsumerPool: [
      { q: 'Pusulanın renkli (kırmızı) ibresi daima hangi ana yönü gösterir? 🧭', a: 'Kuzey 🧭', d: ['Güney', 'Doğu'], exp: 'Pusula ibresinin renkli ucu Dünya\'nın manyetik kuzeyini gösterir.' },
      { q: 'Güneş\'in sabahları doğduğu yöne sağ kolumuzu uzatırsak, ÖNÜMÜZ hangi yönü gösterir? ☀️', a: 'Kuzey 🧭', d: ['Güney', 'Batı'], exp: 'Sağ kol Doğu, sol kol Batı olduğunda önümüz Kuzey, arkamız Güney olur.' },
      { q: 'Geceleri bulutsuz bir havada daima Kuzeyi gösteren parlak yıldız hangisidir? ⭐', a: 'Kutup Yıldızı (Demirkazık) ⭐', d: ['Çoban Yıldızı', 'Kuyruklu Yıldız'], exp: 'Kutup Yıldızı gökyüzünde daima Kuzey yönünü işaret eder.' },
      { q: 'Ormanda kaybolan bir izci ağaç gövdelerindeki ve taşlardaki YOSUNLARA bakarak hangi yönü bulur? 🌲', a: 'Kuzey (Yosunlu taraf) 🌲', d: ['Güney', 'Doğu'], exp: 'Güneş görmeyen ve nemli kalan kuzey taraflarında yosunlar oluşur.' },
      { q: 'Karınca yuvalarının ağzı ve çıkarılan toprak tepecikleri hangi yönü gösterir? 🐜', a: 'Yuva ağzı GÜNEYİ, toprak yığını KUZEYİ gösterir 🐜', d: ['Yuva ağzı kuzeyi gösterir', 'Doğuyu gösterir'], exp: 'Karıncalar rüzgardan korunmak için yuva girişlerini güneye doğru açarlar.' },
      { q: 'Kuzey ile Doğu arasındaki ARA YÖN hangisidir? 🧭', a: 'Kuzeydoğu 🧭', d: ['Güneydoğu', 'Kuzeybatı'], exp: 'Kuzey ile Doğu arasındaki ara yön Kuzeydoğudur.' },
      { q: 'Güney ile Batı arasındaki ARA YÖN hangisidir? 🧭', a: 'Güneybatı 🧭', d: ['Kuzeybatı', 'Güneydoğu'], exp: 'Güney ve Batı arasındaki ara yöne Güneybatı denir.' },
      { q: 'Bir yerin KUŞ BAKIŞI görünüşünün ölçüsüz, kaba taslak çizimine ne ad verilir? 🗺️', a: 'Kroki 🗺️', d: ['Harita', 'Plan'], exp: 'Ölçeksiz, kaba taslak kuş bakışı çizimlere kroki denir.' },
      { q: 'Krokilerde sokakları, binaları ve parkları daha kolay bulabilmek için hangisi kullanılır? 🏷️', a: 'Semboller ve sokak isimleri 🏷️', d: ['Gerçek fotoğraflar', 'Büyük resimler'], exp: 'Krokilerde basit geometrik çizimler ve isimler yer alır.' },
      { q: 'Marketten yiyecek satın alırken sağlığımız için İLK ÖNCE nereye bakmalıyız? 🥛', a: 'Son Kullanma Tarihine (SKT) 📅', d: ['Paketin süsüne', 'Rengine'], exp: 'Tarihi geçmiş ürünler zehirlenmeye yol açabilir; mutlaka SKT incelenmelidir.' },
      { q: 'Bir ürün üzerinde "TSE" damgasının bulunması ne anlama gelir? 🛡️', a: 'Ürünün Türk Standartlarına uygun ve kaliteli olduğunu 🛡️', d: ['Ürünün bedava olduğunu', 'İthal edildiğini'], exp: 'TSE, Türk Standartları Enstitüsü güvencesidir.' },
      { q: 'Alışveriş yaptıktan sonra satıcıdan mutlaka ne istemeliyiz? 🧾', a: 'Fiş veya Fatura 🧾', d: ['Poşet', 'Çikolata'], exp: 'Fiş/fatura alışveriş belgesidir, tüketici hakkını korur ve devlete vergi kazandırır.' },
      { q: 'Satın aldığımız bozuk veya ayıplı bir ürünü değiştirmek için satıcıya ne ile gitmeliyiz? 🧾', a: 'Ürün ve alışveriş fişiyle birlikte 🧾', d: ['Sadece ürünle', 'Kutusu olmadan'], exp: 'Alışveriş fişi olmadan ürün iadesi veya değişimi yapılamaz.' },
      { q: 'Tüketici haklarımızı korumak ve şikayette bulunmak için arayabileceğimiz ALO Tüketici Hattı hangisidir? 📞', a: 'ALO 175 📞', d: ['ALO 112', 'ALO 182'], exp: 'ALO 175 Tüketici Danışma Hattı vatandaşlara destek verir.' },
      { q: '"Komşu komşunun külüne muhtaçtır" atasözü hangi önemli değeri vurgular? 🏡', a: 'Komşuluk dayanışması ve yardımlaşmayı 🤝', d: ['Para biriktirmeyi', 'Tembellik yapmayı'], exp: 'Komşular en zor günlerde birbirlerinin yardımına koşar.' },
      { q: 'Güneş akşamları hangi ana yönden batar? 🌅', a: 'Batı 🌅', d: ['Doğu', 'Kuzey'], exp: 'Güneş Doğu\'dan doğar, Batı\'dan batar.' },
      { q: 'Toplam kaç tane ANA YÖN vardır? 🧭', a: '4 ana yön (Kuzey, Güney, Doğu, Batı) 🧭', d: ['2 ana yön', '8 ana yön'], exp: '4 ana yön ve 4 ara yön olmak üzere yönlerimiz belirlenir.' },
      { q: 'Yangın söndürme, can kurtarma ve afetlerde görev alan fedakar meslek hangisidir? 🚒', a: 'İtfaiyeci 🚒', d: ['Mimar', 'Bankacı'], exp: 'İtfaiyeciler canları pahasına yangınları söndürür ve kurtarma yapar.' },
      { q: 'Hastalıkları teşhis ve tedavi eden, sağlığımızı koruyan meslek hangisidir? 🩺', a: 'Doktor 🩺', d: ['Mühendis', 'Avukat'], exp: 'Doktorlar ve sağlık çalışanları şifa dağıtır.' },
      { q: 'Gereksiz yere yanan lambaları kapatmak, diş fırçalarken suyu kapatmak hangi davranıştır? 💡', a: 'Bilinçli tasarruf 💡', d: ['Cimrilik', 'İsraf'], exp: 'Kaynakları gerektiği kadar tüketmeye tasarruf denir.' },
      { q: 'Geri dönüşümü olan maddeleri çöpe atmak yerine geri dönüşüm kutusuna atmak neye katkı sağlar? ♻️', a: 'Doğanın korunmasına ve ülke ekonomisine 🌍', d: ['Çöp miktarının artmasına', 'Zaman kaybına'], exp: 'Geri dönüşüm ağaçları, suyu ve doğal kaynakları kurtarır.' },
      { q: 'Evimizin krokisini çizerken eşyaları hangi açıdan görmüş gibi çizeriz? 📐', a: 'Kuş bakışı (Tam üstten) 📐', d: ['Yandan', 'Alttan'], exp: 'Krokiler daima kuş bakışı açıyla çizilir.' },
      { q: 'Elektronik eşyalar aldığımızda garanti kapsamından yararlanmak için satıcıya neyi onaylatmalıyız? 📄', a: 'Garanti Belgesini 📄', d: ['Fiyat etiketini', 'Kullanım kılavuzunu'], exp: 'Garanti belgesi kaşelenip imzalanmalıdır.' },
      { q: 'Cami minarelerindeki şerefelerin kapısı genellikle hangi yönü gösterir? 🕌', a: 'Güney (Kıble yönü) 🕌', d: ['Kuzey', 'Batı'], exp: 'Ülkemizde minare şerefe kapıları güneye (kıbleye) bakar.' },
      { q: 'Öğrencilere yeni bilgiler öğreten, onları geleceğe hazırlayan kutsal meslek hangisidir? 👨‍🏫', a: 'Öğretmen 👨‍🏫', d: ['Pilot', 'Kaptan'], exp: 'Öğretmenler nesilleri yetiştirir.' },
      { q: 'Aşağıdakilerden hangisi bir İSTEK değil, temel İHTİYAÇTIR? 🍞', a: 'Ekmek ve su 🍞💧', d: ['Pahalı oyuncak robot 🤖', 'Video oyunu 🎮'], exp: 'Beslenme ve su yaşamsal temel ihtiyaçtır.' }
    ],

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

    // 4. SINIF: 4, 5, 6 BASAMAKLI DOĞAL SAYILAR VE DÖRT İŞLEM (DİNAMİK)
    generateGrade4DigitsOperations() {
      const mode = Math.floor(Math.random() * 4);
      if (mode === 0) {
        // Bölükler ve Basamak Değeri
        const thousandsPart = Math.floor(Math.random() * 850) + 12; // 12..861
        const unitsPart = Math.floor(Math.random() * 850) + 100; // 100..949
        const fullNum = thousandsPart * 1000 + unitsPart;

        const askThousandsPeriod = Math.random() > 0.5;
        if (askThousandsPeriod) {
          return {
            question: `"${fullNum.toLocaleString('tr-TR')}" sayısının BİNLER BÖLÜĞÜNDEKİ sayı kaçtır? 👑`,
            correct: thousandsPart.toString(),
            distractors: [unitsPart.toString(), (thousandsPart + 10).toString()],
            explanation: `Sayının sağdaki üç basamağı birler bölüğü (${unitsPart}), soldaki basamakları ise binler bölüğüdür (${thousandsPart}).`
          };
        } else {
          return {
            question: `"${fullNum.toLocaleString('tr-TR')}" sayısının BİRLER BÖLÜĞÜNDEKİ sayı kaçtır? 👑`,
            correct: unitsPart.toString(),
            distractors: [thousandsPart.toString(), (unitsPart - 10).toString()],
            explanation: `Sayının en sağındaki 3 basamak birler bölüğüdür (${unitsPart}).`
          };
        }
      } else if (mode === 1) {
        // 10, 100, 1000 ile Zihinden Çarpma
        const base = Math.floor(Math.random() * 80) + 12; // 12..91
        const mul = [10, 100, 1000][Math.floor(Math.random() * 3)];
        const ans = base * mul;

        return {
          question: `${base} × ${mul} işleminin zihinden sonucu kaçtır? ⚡`,
          correct: ans.toLocaleString('tr-TR'),
          distractors: [
            (ans / 10).toLocaleString('tr-TR'),
            (ans * 10).toLocaleString('tr-TR')
          ],
          explanation: `Bir sayıyı ${mul} ile kısa yoldan çarpmak için sağına sıfırları ekleriz: ${ans}.`
        };
      } else if (mode === 2) {
        // 10, 100 ile Zihinden Bölme
        const base = Math.floor(Math.random() * 80) + 12;
        const mul = [10, 100][Math.floor(Math.random() * 2)];
        const dividend = base * mul;

        return {
          question: `${dividend} ÷ ${mul} işleminin kısa yoldan sonucu kaçtır? ➗`,
          correct: base.toString(),
          distractors: [(base * 10).toString(), Math.max(1, base - 5).toString()],
          explanation: `${dividend} sayısını ${mul}'e bölerken sıfırları karşılıklı sileriz: Sonuç = ${base}.`
        };
      } else {
        // En Yakın Binliğe Yuvarlama
        const thousands = Math.floor(Math.random() * 8) + 2; // 2..9
        const hundreds = Math.floor(Math.random() * 9) + 1; // 1..9
        const rest = Math.floor(Math.random() * 80) + 10;
        const num = thousands * 1000 + hundreds * 100 + rest;
        const isUp = hundreds >= 5;
        const rounded = isUp ? (thousands + 1) * 1000 : thousands * 1000;
        const other = isUp ? thousands * 1000 : (thousands + 1) * 1000;

        return {
          question: `"${num.toLocaleString('tr-TR')}" sayısı en yakın hangi BİNLİĞE yuvarlanır? 🎯`,
          correct: rounded.toLocaleString('tr-TR'),
          distractors: [
            other.toLocaleString('tr-TR'),
            (rounded + 1000).toLocaleString('tr-TR')
          ],
          explanation: `Yüzler basamağında ${hundreds} vardır (${hundreds >= 5 ? '5 ve üzeri olduğu için yukarı' : '5\'ten küçük olduğu için aşağı'}). Sayı ${rounded.toLocaleString('tr-TR')} binliğine yuvarlanır.`
        };
      }
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

    // 4. SINIF: ÇEVRE VE ALAN HESAPLAMA (DİNAMİK ÜRETECİ)
    generateGrade4PerimeterArea() {
      const mode = Math.floor(Math.random() * 4);
      if (mode === 0) {
        // Karenin Çevresi
        const a = Math.floor(Math.random() * 15) + 3; // 3..17 cm
        const perim = 4 * a;
        return {
          question: `Bir kenar uzunluğu ${a} cm olan bir KARENİN ÇEVRESİ kaç cm'dir? 🟦`,
          correct: `${perim} cm`,
          distractors: [`${perim + a} cm`, `${perim - 4} cm`],
          explanation: `Karenin 4 kenarı birbirine eşittir. Çevre = 4 × ${a} = ${perim} cm'dir.`
        };
      } else if (mode === 1) {
        // Karenin Alanı
        const a = Math.floor(Math.random() * 9) + 2; // 2..10 cm
        const area = a * a;
        return {
          question: `Bir kenarı ${a} cm olan bir KARENİN ALANI kaç santimetrekaredir (cm²)? 🟦`,
          correct: `${area} cm²`,
          distractors: [`${area + a} cm²`, `${4 * a} cm²`],
          explanation: `Karenin Alanı = Kenar × Kenar = ${a} × ${a} = ${area} cm²'dir.`
        };
      } else if (mode === 2) {
        // Dikdörtgenin Çevresi
        const w = Math.floor(Math.random() * 8) + 3; // kısa kenar 3..10
        const l = w + Math.floor(Math.random() * 8) + 2; // uzun kenar
        const perim = 2 * (w + l);
        return {
          question: `Kısa kenarı ${w} cm, uzun kenarı ${l} cm olan DİKDÖRTGENİN ÇEVRESİ kaç cm'dir? 🚪`,
          correct: `${perim} cm`,
          distractors: [`${w + l} cm`, `${perim + 4} cm`],
          explanation: `Dikdörtgenin Çevresi = 2 × (Kısa + Uzun) = 2 × (${w} + ${l}) = ${perim} cm'dir.`
        };
      } else {
        // Dikdörtgenin Alanı
        const w = Math.floor(Math.random() * 7) + 2; // 2..8 cm
        const l = w + Math.floor(Math.random() * 6) + 3; // 5..13 cm
        const area = w * l;
        return {
          question: `Kısa kenarı ${w} cm, uzun kenarı ${l} cm olan DİKDÖRTGENİN ALANI kaç cm²'dir? 🚪`,
          correct: `${area} cm²`,
          distractors: [`${2 * (w + l)} cm²`, `${area + w} cm²`],
          explanation: `Dikdörtgenin Alanı = Kısa Kenar × Uzun Kenar = ${w} × ${l} = ${area} cm²'dir.`
        };
      }
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
      if (r < 0.4) {
        return this.generateGrade3MultDiv();
      } else if (r < 0.75) {
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
      if (r < 0.4) {
        return this.generateGrade4DigitsOperations();
      } else if (r < 0.7) {
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
      { q: "5 × 5 = 25 eder.", a: true, subject: 'math', exp: "Doğrudur! 5 kere 5 eşittir 25." },
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
        title: '➕ Matematik İşlem ve Sonuçları',
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
        spokenText: `${statement}. Doğru mu, yanlış mı?`,
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
      const allOpts = [qData.correct, ...(qData.distractors || [])];
      const options = this.fisherYatesShuffle(allOpts);

      let questionHtml = qData.questionHtml;
      if (!questionHtml && qData.englishWord) {
        questionHtml = `
          <div class="english-card-badge">
            <span class="en-flag-pill">🇬🇧 LISTEN & MATCH</span>
            <span class="en-big-word">${replaceEmojisWith3D(qData.englishWord, 'inline-3d-icon')}</span>
            <span class="en-audio-hint">🔊 Doğru telaffuzu dinle</span>
          </div>
          <div class="en-question-subtext">${replaceEmojisWith3D(qData.question, 'q-3d-item')}</div>
        `;
      }

      return {
        question: qData.question,
        questionHtml: questionHtml || (qData.question ? qData.question.replace(/\n/g, '<br>') : ''),
        options: options,
        correct: qData.correct,
        explanation: qData.explanation,
        category: category,
        audioKey: qData.audioKey || null,
        englishWord: qData.englishWord || null,
        lang: qData.lang || (qData.englishWord ? 'en' : 'tr'),
        spokenText: qData.spokenText || qData.englishWord || null,
        type: qData.type || 'standard',
        category: qData.category || category,
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
            html: '<div style="margin:6px auto;"><img src="assets/icons/3d/red_circle.png" class="q-3d-fruit" alt="Kırmızı Daire"></div><div style="font-weight:900; font-size:1.2rem;">Bu sevimli daire hangi renktir?</div>',
            correct: '🔴 Kırmızı',
            distractors: ['🔵 Mavi', '🟡 Sarı'],
            exp: 'Kırmızı, elmanın ve uğur böceğinin rengidir! 🍎',
            audioKey: 'q_daire_kirmizi'
          },
          {
            html: '<div style="margin:6px auto;"><img src="assets/icons/3d/blue_circle.png" class="q-3d-fruit" alt="Mavi Daire"></div><div style="font-weight:900; font-size:1.2rem;">Bu parlak daire hangi renktir?</div>',
            correct: '🔵 Mavi',
            distractors: ['🟢 Yeşil', '🔴 Kırmızı'],
            exp: 'Mavi, engin gökyüzünün ve denizlerin rengidir! 🌊',
            audioKey: 'q_daire_mavi'
          },
          {
            html: '<div style="margin:6px auto;"><img src="assets/icons/3d/yellow_circle.png" class="q-3d-fruit" alt="Sarı Daire"></div><div style="font-weight:900; font-size:1.2rem;">Bu sıcacık daire hangi renktir?</div>',
            correct: '🟡 Sarı',
            distractors: ['🟣 Mor', '🟠 Turuncu'],
            exp: 'Sarı, parlayan Güneş\'in ve tatlı muzun rengidir! ☀️',
            audioKey: 'q_daire_sari'
          },
          {
            html: '<div style="margin:6px auto;"><img src="assets/icons/3d/green_circle.png" class="q-3d-fruit" alt="Yeşil Daire"></div><div style="font-weight:900; font-size:1.2rem;">Bu doğa rengi daire hangi renktir?</div>',
            correct: '🟢 Yeşil',
            distractors: ['🔴 Kırmızı', '🔵 Mavi'],
            exp: 'Yeşil, ağaç yapraklarının ve çimenlerin rengidir! 🌿',
            audioKey: 'q_daire_yesil'
          },
          {
            html: '<div class="q-fruit-row" style="margin:8px auto; gap:24px; align-items:center;"><img src="assets/icons/3d/elephant.png" class="q-3d-fruit" alt="Fil" style="width:84px; height:84px;"> <span style="font-size:1.6rem; font-weight:900; color:#64748b;">vs</span> <img src="assets/icons/3d/ant.png" class="q-3d-fruit" alt="Karınca" style="width:48px; height:48px;"></div><div style="font-weight:900; font-size:1.2rem;">Hangisi GERÇEKTE çok daha BÜYÜKTÜR?</div>',
            correct: '🐘 Fil (Kocaman)',
            distractors: ['🐜 Karınca (Minik)', 'İkisi de Aynı'],
            exp: 'Fil devasa bir canlıdır, karıncadan kat kat büyüktür! 🐘',
            audioKey: 'q_fil_vs_karinca'
          },
          {
            html: '<div class="q-fruit-row" style="margin:8px auto; gap:24px; align-items:center;"><img src="assets/icons/3d/giraffe.png" class="q-3d-fruit" alt="Zürafa" style="width:84px; height:84px;"> <span style="font-size:1.6rem; font-weight:900; color:#64748b;">vs</span> <img src="assets/icons/3d/turtle.png" class="q-3d-fruit" alt="Kaplumbağa" style="width:52px; height:52px;"></div><div style="font-weight:900; font-size:1.2rem;">Hangisi çok daha UZUNDUR?</div>',
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
      if (parseInt(grade, 10) > 0 && isStandardSubject && state.questionNumber > 1 && (state.questionNumber % 4 === 0)) {
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
        // ANASINIFI: Çoktan seçmeli test mantığı tamamen kaldırıldı.
        // 1. Dinle & Seç (Büyük Görseller ve Sesli Yönerge) (%50)
        // 2. Hareketli Balon Patlatma (%25)
        // 3. Eşleştirme ve Hafıza Kartları (%25)
        if (gameType === 'color_balloon' || gameType === 'balloon') {
          return this.buildQuestionItem(this.generateFloatingBalloonQuestion(0), '🎈 Renkli Balon Avı');
        } else if (gameType === 'memory' || gameType === 'matching') {
          return this.buildQuestionItem(this.generateMemoryGridQuestion(0), '🧠 Eşleştirme ve Hafıza Kartları');
        } else if (gameType === 'shadow_match') {
          return this.buildQuestionItem(this.generateShadowMatchQuestion(0), '🧩 Gölgesini Bul');
        } else if (gameType === 'count_tap') {
          return this.buildQuestionItem(this.generateCountTapQuestion(), '🔢 Kaç Tane Var? Dokun & Say');
        } else {
          const r = Math.random();
          if (r < 0.50) {
            return this.buildQuestionItem(this.generateVisualChoiceQuestion(0), '🎨 Dinle & Seç');
          } else if (r < 0.75) {
            return this.buildQuestionItem(this.generateFloatingBalloonQuestion(0), '🎈 Hareketli Balon Avı');
          } else {
            return this.buildQuestionItem(this.generateMemoryGridQuestion(0), '🧠 Hafıza Kartları');
          }
        }
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
      } else if (gameType === 'math_rhythmic_1') {
        return this.buildQuestionItem(this.generateFloatingBalloonQuestion(1, 'rhythmic'), '🎈 Ritmik Sayma Balonları');
      } else if (gameType === 'turkish_antonyms_1') {
        return this.buildQuestionItem(this.generateMemoryGridQuestion(1, 'antonyms'), '🧠 Zıt Anlam Hafıza Kartları');
      } else if (gameType === 'math_shapes_money_1') {
        const raw = this.drawFromPool(this.grade1ShapesAndMoneyPool, "grade1ShapesAndMoneyPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '🪙 Geometrik Şekiller & Paralarımız');
      } else if (gameType === 'turkish_antonyms_1') {
        const raw = this.drawFromPool(this.grade1AntonymsPool, "grade1AntonymsPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '🔄 Zıt Anlamlı Kelimeler Avı');
      } else if (gameType === 'turkish_syllables_letters_1') {
        const raw = this.generateGrade1SyllablesAndLetters();
        return this.buildQuestionItem(raw, '🔤 Hece Sayısı ve Harf Bilgisi');
      } else if (gameType === 'lifescience_school_home_1') {
        const raw = this.drawFromPool(this.grade1SchoolHomeLifePool, "grade1SchoolHomeLifePool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '🏫 Okulumuzda ve Evimizde Hayat');
      } else if (gameType === 'lifescience_health_seasons_1') {
        const raw = this.drawFromPool(this.grade1HealthSeasonsPool, "grade1HealthSeasonsPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '🧼 Sağlıklı Hayat ve Mevsimler');
      } else if (gameType === 'math_place_value_2') {
        const raw = this.generateGrade2PlaceValue();
        return this.buildQuestionItem(raw, '📦 100\'e Kadar Sayılar & Basamak Değeri');
      } else if (gameType === 'math_multiplication_2') {
        const raw = this.generateGrade2Multiplication();
        return this.buildQuestionItem(raw, '✖️ Hızlı Çarpma Başlangıcı');
      } else if (gameType === 'math_clock_2') {
        const raw = this.drawFromPool(this.grade2ClocksPool, "grade2ClocksPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '⏰ Zamanı Ölçme ve Saatler');
      } else if (gameType === 'turkish_syn_ant_2') {
        const raw = this.drawFromPool(this.grade2SynAntPool, "grade2SynAntPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '✨ Eş ve Zıt Anlam Şampiyonası');
      } else if (gameType === 'turkish_punctuation_2') {
        const raw = this.drawFromPool(this.grade2PunctuationPool, "grade2PunctuationPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '✍️ Noktalama & Yazım Kuralları');
      } else if (gameType === 'lifescience_traffic_2') {
        const raw = this.drawFromPool(this.grade2TrafficSafeLifePool, "grade2TrafficSafeLifePool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '🚦 Güvenli Hayat ve Trafik');
      } else if (gameType === 'lifescience_culture_2') {
        const raw = this.drawFromPool(this.grade2CultureAndCountryPool, "grade2CultureAndCountryPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '🇹🇷 Ülkemiz ve Kültürümüz');
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
      } else if (gameType === 'science_earth_senses_3') {
        const raw = this.drawFromPool(this.grade3EarthSensesPool, "grade3EarthSensesPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '🌍 Gezegenimiz Dünya ve Beş Duyumuz');
      } else if (gameType === 'science_force_matter_3') {
        const raw = this.drawFromPool(this.grade3ForceMatterPool, "grade3ForceMatterPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '🧲 Kuvveti Tanıyalım ve Madde');
      } else if (gameType === 'lifescience_compass_consumer_3') {
        const raw = this.drawFromPool(this.grade3CompassConsumerPool, "grade3CompassConsumerPool");
        return this.buildQuestionItem({
          question: raw.q,
          correct: raw.a,
          distractors: raw.d,
          explanation: raw.exp
        }, '🧭 Yönlerimiz, Kroki ve Tüketici Hakları');
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
          const r = Math.random();
          if (r < 0.40) return this.buildQuestionItem(this.generateFloatingBalloonQuestion(1, 'math'), '🎈 Sayı & Toplama Balonları');
          else if (r < 0.70) return this.buildQuestionItem(this.generateMemoryGridQuestion(1, 'math'), '🧠 Toplama Eşleştirme Kartları');
          else raw = this.generateGrade1Math();
        } else if (g === 2) {
          const r = Math.random();
          if (r < 0.45) raw = this.generateGrade2Math();
          else if (r < 0.70) raw = this.generateGrade2PlaceValue();
          else if (r < 0.85) raw = this.generateGrade2Multiplication();
          else {
            const item = this.drawFromPool(this.grade2ClocksPool, "grade2ClocksPool");
            raw = { question: item.q, correct: item.a, distractors: item.d, explanation: item.exp };
          }
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
          const r = Math.random();
          if (r < 0.40) return this.buildQuestionItem(this.generateFloatingBalloonQuestion(1, 'reading'), '🎈 Harf & Sözcük Balonları');
          else if (r < 0.70) return this.buildQuestionItem(this.generateMemoryGridQuestion(1, 'antonyms'), '🧠 Zıt Anlam Hafıza Kartları');
          else return this.buildQuestionItem(this.generateMemoryGridQuestion(1, 'letters'), '🧠 Harf Eşleştirme Kartları');
        } else if (g === 2) {
          const r = Math.random();
          if (r < 0.4) {
            const raw = this.drawFromPool(this.grade2TurkishPool, "grade2TurkishPool");
            return this.buildQuestionItem({
              question: raw.q,
              correct: raw.a,
              distractors: raw.d,
              explanation: raw.exp
            }, '📚 Türkçe & Sözcük Düellosu');
          } else if (r < 0.7) {
            const raw = this.drawFromPool(this.grade2SynAntPool, "grade2SynAntPool");
            return this.buildQuestionItem({
              question: raw.q,
              correct: raw.a,
              distractors: raw.d,
              explanation: raw.exp
            }, '✨ Eş ve Zıt Anlam Şampiyonası');
          } else {
            const raw = this.drawFromPool(this.grade2PunctuationPool, "grade2PunctuationPool");
            return this.buildQuestionItem({
              question: raw.q,
              correct: raw.a,
              distractors: raw.d,
              explanation: raw.exp
            }, '✍️ Noktalama & Yazım Kuralları');
          }
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
          const r = Math.random();
          if (r < 0.34) {
            const raw = this.drawFromPool(this.lifeSciencePool, "lifeSciencePool");
            return this.buildQuestionItem({ question: raw.q, correct: raw.a, distractors: raw.d, explanation: raw.exp }, '🌱 Hayat Bilgisi');
          } else if (r < 0.67) {
            const raw = this.drawFromPool(this.grade1SchoolHomeLifePool, "grade1SchoolHomeLifePool");
            return this.buildQuestionItem({ question: raw.q, correct: raw.a, distractors: raw.d, explanation: raw.exp }, '🏫 Okulumuzda ve Evimizde Hayat');
          } else {
            const raw = this.drawFromPool(this.grade1HealthSeasonsPool, "grade1HealthSeasonsPool");
            return this.buildQuestionItem({ question: raw.q, correct: raw.a, distractors: raw.d, explanation: raw.exp }, '🧼 Sağlıklı Hayat ve Mevsimler');
          }
        } else if (g === 2) {
          const r = Math.random();
          if (r < 0.34) {
            const raw = this.drawFromPool(this.lifeSciencePool, "lifeSciencePool");
            return this.buildQuestionItem({ question: raw.q, correct: raw.a, distractors: raw.d, explanation: raw.exp }, '🌱 Hayat Bilgisi');
          } else if (r < 0.67) {
            const raw = this.drawFromPool(this.grade2TrafficSafeLifePool, "grade2TrafficSafeLifePool");
            return this.buildQuestionItem({ question: raw.q, correct: raw.a, distractors: raw.d, explanation: raw.exp }, '🚦 Güvenli Hayat ve Trafik');
          } else {
            const raw = this.drawFromPool(this.grade2CultureAndCountryPool, "grade2CultureAndCountryPool");
            return this.buildQuestionItem({ question: raw.q, correct: raw.a, distractors: raw.d, explanation: raw.exp }, '🇹🇷 Ülkemiz ve Kültürümüz');
          }
        } else if (g === 3) {
          const r = Math.random();
          if (r < 0.75) {
            const raw = this.drawFromPool(this.grade3CompassConsumerPool, "grade3CompassConsumerPool");
            return this.buildQuestionItem({ question: raw.q, correct: raw.a, distractors: raw.d, explanation: raw.exp }, '🧭 Yönlerimiz, Kroki & Tüketici');
          } else {
            const raw = this.drawFromPool(this.lifeSciencePool, "lifeSciencePool");
            return this.buildQuestionItem({ question: raw.q, correct: raw.a, distractors: raw.d, explanation: raw.exp }, '🌱 Hayat Bilgisi');
          }
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
          const r = Math.random();
          if (r < 0.5) {
            const raw = this.drawFromPool(this.grade3EarthSensesPool, "grade3EarthSensesPool");
            return this.buildQuestionItem({ question: raw.q, correct: raw.a, distractors: raw.d, explanation: raw.exp }, '🌍 Gezegenimiz & Duyularımız');
          } else {
            const raw = this.drawFromPool(this.grade3ForceMatterPool, "grade3ForceMatterPool");
            return this.buildQuestionItem({ question: raw.q, correct: raw.a, distractors: raw.d, explanation: raw.exp }, '🧲 Kuvvet ve Madde');
          }
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

  function openModal(modalEl) {
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
      math: 'Matematik',
      math_rhythmic_1: 'Ritmik Sayma Düellosu',
      math_shapes_money_1: 'Geometrik Şekiller ve Paralarımız',
      turkish_antonyms_1: 'Zıt Anlamlı Kelimeler Avı',
      turkish_syllables_letters_1: 'Hece Sayısı ve Harf Bilgisi',
      lifescience_school_home_1: 'Okulumuzda ve Evimizde Hayat',
      lifescience_health_seasons_1: 'Sağlıklı Hayat ve Mevsimler',
      math_place_value_2: '100\'e Kadar Sayılar ve Basamak Değeri',
      math_multiplication_2: 'Hızlı Çarpma Başlangıcı',
      math_clock_2: 'Zamanı Ölçme ve Saatler',
      turkish_syn_ant_2: 'Eş ve Zıt Anlamlılar Şampiyonası',
      turkish_punctuation_2: 'Noktalama İşaretleri ve Yazım Kuralları',
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
      science_earth_senses_3: 'Gezegenimiz Dünya ve Beş Duyumuz',
      science_force_matter_3: 'Kuvveti Tanıyalım ve Madde',
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
    // ANASINIFI (0): Renk & Şekil, Sayma & Kavram, Hayvanlar & Doğa, Akıl Oyunları
    // -------------------------------------------------------------
    0: [
      {
        id: 'kinder_math',
        name: 'Renkler & Sayma',
        icon: '🎨',
        colorTheme: 'theme-math',
        tagline: 'Temel Kavramlar',
        description: 'Meyve sayma, canlı renkler ve geometrik şekilleri keşfet! 🍎⭐',
        badge: 'Okul Öncesi',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'colors', label: '🎈 Renk Balonları' },
          { id: 'counting', label: '🔢 Dokun & Say' }
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
            tags: ['🎈 Uçan Balonlar', '🎨 Canlı Renkler', '💥 Patlatma'],
            btnText: 'Düelloyu Başlat',
            topic: 'colors'
          },
          {
            id: 'count_tap',
            active: true,
            title: 'Kaç Tane Var? Dokun & Say',
            icon: '🔢',
            badge: '🍎 Dokunmatik Sayma',
            featureTag: '🐾 Sevimli Sayma',
            description: 'Ekranda zıplayan nesnelere dokunarak say, doğru sayıyı bul! 🍎',
            tags: ['🍎 Dokunarak Say', '🔢 1-5 Sayılar', '✨ Sesli Yönerge'],
            btnText: 'Düelloyu Başlat',
            topic: 'counting'
          },
          {
            id: 'math',
            active: true,
            title: 'Kafa Kafaya Renkler & Şekiller',
            icon: '🎨',
            badge: '🎨 Renk & Şekil',
            featureTag: '⭐ Görsel Keşif',
            description: 'Meyveleri ve parlayan yıldızları say, doğru cevaba ilk sen dokun! 🍎⭐',
            tags: ['🍎 1-5 Sayma', '🎨 Canlı Renkler', '⭐ Şekil Avı'],
            btnText: 'Düelloyu Başlat',
            topic: 'all'
          }
        ]
      },
      {
        id: 'kinder_nature',
        name: 'Hayvanlar & Doğa',
        icon: '🦁',
        colorTheme: 'theme-turkish',
        tagline: 'Çevre & Canlılar',
        description: 'Sevimli hayvan sesleri, doğa sevgisi ve neşeli dostlarımız! 🐾',
        badge: 'Doğa Kahramanları',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'shadows', label: '🧩 Gölgesini Bul' },
          { id: 'animals', label: '🐾 Hayvanlar' },
          { id: 'nature', label: '🌿 Doğa' }
        ],
        games: [
          {
            id: 'shadow_match',
            active: true,
            title: 'Gölgesini Bul (Görsel Eşleştirme)',
            icon: '🧩',
            badge: '🧩 Gölge Kartları',
            featureTag: '👀 Keskin Gözler',
            description: 'Sevimli hayvan ve meyvelerin gizemli gölgesini bul, dokunup rengini aç! 🦁',
            tags: ['🧩 Gölge Eşleştir', '🦁 Sevimli Hayvanlar', '⚡ Hızlı Bul'],
            btnText: 'Düelloyu Başlat',
            topic: 'shadows'
          },
          {
            id: 'turkish',
            active: true,
            title: 'Sevimli Hayvanlar & Doğa',
            icon: '🦁',
            badge: '🦁 Doğa Kahramanları',
            featureTag: '🐾 Sevimli Dostlar',
            description: 'Miyavlayan dostlarımız ve doğa kahramanlarıyla tanış! 🐾',
            tags: ['🐾 Hayvan Sesleri', '🐘 Büyük-Küçük', '🌿 Doğa Sevgisi'],
            btnText: 'Düelloyu Başlat',
            topic: 'animals'
          }
        ]
      },
      {
        id: 'kinder_brain',
        name: 'Akıl ve Zeka Oyunları',
        icon: '🧠',
        colorTheme: 'theme-brain',
        tagline: 'Dikkat & Refleks',
        description: 'Gözlem yeteneği, hızlı fark etme ve sevimli hafıza kartları! 👀⚡',
        badge: 'Minik Zekalar',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'attention', label: '👀 Görsel Dikkat' },
          { id: 'memory', label: '🧠 Hafıza' }
        ],
        games: [
          {
            id: 'oddone',
            active: true,
            title: 'Farklı Olanı Yakala',
            icon: '👀',
            badge: '👀 Görsel Dikkat',
            featureTag: '👀 Keskin Gözler',
            description: 'Meyve ve hayvanlar arasında saklanan yabancıyı ilk sen bul! 🥑',
            tags: ['🥑 Tatlı Meyveler', '👀 Görsel Dikkat', '⚡ Hızlı Bul'],
            btnText: 'Düelloyu Başlat',
            topic: 'attention'
          },
          {
            id: 'memory',
            active: true,
            title: 'Sevimli Hafıza Düellosu',
            icon: '🧠',
            badge: '🎈 Görsel Hafıza',
            featureTag: '🎈 Neşeli Zihin',
            description: 'Ekranda parlayan 3 sevimli nesneyi aklında tut, sırayı bil! 🎈',
            tags: ['🎈 3 Nesne Sırası', '🧠 Görsel Hatırlama', '⭐ Hafıza'],
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
            tags: ['🔤 ANETİL / ELAKİN', '🎈 Uçan Balonlar', '💥 Hızlı Patlat'],
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
        tagline: 'Sayılar & İşlemler',
        description: '20\'ye kadar toplama, çıkarma ve neşeli ritmik sayma! ➕➖',
        badge: 'MEB Müfredatı',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'rhythmic', label: '🔢 Ritmik Sayma' },
          { id: 'addition', label: '➕ Toplama & Çıkarma' },
          { id: 'shapes_money', label: '🪙 Şekil & Para' }
        ],
        games: [
          {
            id: 'math_rhythmic_1',
            active: true,
            title: 'Ritmik Sayma Düellosu',
            icon: '🔢',
            badge: '🔢 Ritmik Sayma',
            featureTag: '♾️ Sınırsız Soru',
            description: '2\'şer, 5\'er ve 10\'ar ileri-geri say, eksik sayıları şimşek gibi yakala! 🔢⚡',
            tags: ['🔢 2-5-10\'ar Sayma', '🎯 Eksik Sayı', '♾️ Dinamik Soru'],
            btnText: 'Düelloyu Başlat',
            topic: 'rhythmic'
          },
          {
            id: 'math',
            active: true,
            title: 'Toplama ve Çıkarma Kampı',
            icon: '🧮',
            badge: '🌱 20\'ye Kadar İşlem',
            featureTag: '⚡ Görsel Destekli',
            description: '20\'ye kadar doğal sayılarla görsel destekli hızlı toplama ve çıkarma antrenmanı! ➕➖',
            tags: ['➕ Doğal Toplama', '➖ Geriye Çıkarma', '🎯 Hızlı İşlem'],
            btnText: 'Düelloyu Başlat',
            topic: 'addition'
          },
          {
            id: 'math_shapes_money_1',
            active: true,
            title: 'Geometrik Şekiller ve Paralarımız',
            icon: '🪙',
            badge: '🪙 Şekil & Para',
            featureTag: '⭐ 25+ Özgün Soru',
            description: 'Kare, üçgen, çember, dikdörtgen ve TL madeni-kağıt paralarımızı tanı! 🪙🟦',
            tags: ['🟦 Kare & Üçgen & Çember', '🪙 TL & Kuruş', '🛍️ Alışveriş'],
            btnText: 'Düelloyu Başlat',
            topic: 'shapes_money'
          }
        ]
      },
      {
        id: 'turkish',
        name: 'Türkçe',
        icon: '📚',
        colorTheme: 'theme-turkish',
        tagline: 'Sözcükler & Anlam',
        description: 'Zıt kavramlar, kelime bilgisi, harfler ve hece yapıları! 🦉📖',
        badge: 'MEB Müfredatı',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'antonyms', label: '🔄 Zıt Anlam' },
          { id: 'syllables', label: '🔤 Harf & Hece' }
        ],
        games: [
          {
            id: 'turkish_antonyms_1',
            active: true,
            title: 'Zıt Anlamlı Kelimeler Avı',
            icon: '🔄',
            badge: '🔄 Zıt Anlam',
            featureTag: '⭐ 35+ Kelime',
            description: 'Büyük-küçük, uzun-kısa, sıcak-soğuk gibi zıt anlamlı sözcükleri roket gibi yakala! 🔄🚀',
            tags: ['🔄 Karşıt Kavramlar', '⚡ Hızlı Eşleştirme', '🦉 Zengin Havuz'],
            btnText: 'Düelloyu Başlat',
            topic: 'antonyms'
          },
          {
            id: 'turkish_syllables_letters_1',
            active: true,
            title: 'Hece Sayısı ve Harf Bilgisi',
            icon: '🔤',
            badge: '🔤 Harf & Hece',
            featureTag: '♾️ Dinamik Soru',
            description: 'Sözcüklerin kaç heceli olduğunu bul, ünlü (sesli) harfleri dedektif gibi avla! 🔤🔍',
            tags: ['📖 Hece Sayma', '🔤 Ünlü Harfler (A-E-I-İ...)', '🔍 Dedektif'],
            btnText: 'Düelloyu Başlat',
            topic: 'syllables'
          },
          {
            id: 'turkish',
            active: true,
            title: 'Hızlı Türkçe & Kelime Avı (Karma)',
            icon: '🦉',
            badge: '🌱 Karma Türkçe',
            featureTag: '🏆 Süper Düello',
            description: 'Zıt kavramlar, ünlü harfler ve hece sayılarından oluşan büyük karma yarışma! 🦉',
            tags: ['🔄 Zıt Anlam', '🔤 Ünlü Harfler', '📖 Hece Sayısı'],
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
        tagline: 'Okulumuz & Sağlığımız',
        description: 'Okul kuralları, nezaket, kişisel bakım, dengeli beslenme ve mevsimler! 🏫🧼',
        badge: 'MEB Müfredatı',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'school_home', label: '🏫 Okulda & Evde Hayat' },
          { id: 'health_seasons', label: '🧼 Sağlık & Mevsimler' }
        ],
        games: [
          {
            id: 'lifescience_school_home_1',
            active: true,
            title: 'Okulumuzda ve Evimizde Hayat',
            icon: '🏫',
            badge: '🏫 Okul & Ev',
            featureTag: '⭐ 26 Özgün Soru',
            description: 'Okul kuralları, nezaket sözcükleri, aile bireyleri ve güvenli davranışları öğren! 🏫🏡',
            tags: ['🏫 Okul Kuralları', '🤝 Nezaket Sözleri', '🏡 Aile Yaşamı'],
            btnText: 'Düelloyu Başlat',
            topic: 'school_home'
          },
          {
            id: 'lifescience_health_seasons_1',
            active: true,
            title: 'Sağlıklı Hayat ve Mevsimler',
            icon: '🧼',
            badge: '🧼 Sağlık & Doğa',
            featureTag: '⭐ 26 Özgün Soru',
            description: 'Kişisel bakım, el yıkama, dengeli beslenme ve 4 mevsimin harika özellikleri! 🧼🍂',
            tags: ['🧼 Kişisel Bakım', '🍎 Dengeli Beslenme', '🍂 4 Mevsim'],
            btnText: 'Düelloyu Başlat',
            topic: 'health_seasons'
          },
          {
            id: 'lifescience',
            active: true,
            title: 'Hayat Bilgisi Bilgi Yarışı (Karma)',
            icon: '🌱',
            badge: '🌱 Karma Pratik',
            featureTag: '⭐ Yaşam Becerisi',
            description: 'Okulda, evde, sağlıkta ve doğada doğru davranışları en hızlı sen bil! 🏫🧼',
            tags: ['🏫 Okul Kuralları', '🧼 Kişisel Bakım', '🚦 Güvenli Hayat'],
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
        tagline: 'İki Basamaklı İşlemler & Çarpma',
        description: '100\'e kadar sayılar, basamak değeri, hızlı çarpma ve saatler! 📦⏰',
        badge: 'MEB Müfredatı',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'place_value', label: '📦 Basamak Değeri' },
          { id: 'multiplication', label: '✖️ Hızlı Çarpma' },
          { id: 'clocks', label: '⏰ Zaman & Saat' },
          { id: 'two_digits', label: '⚡ 2 Basamak' }
        ],
        games: [
          {
            id: 'math_place_value_2',
            active: true,
            title: '100\'e Kadar Sayılar ve Basamak Değeri',
            icon: '📦',
            badge: '📦 Basamak Değeri',
            featureTag: '♾️ Dinamik Soru',
            description: 'Onluk ve birliklere ayır, basamak değerini bul, en yakın onluğa yuvarla! 📦🎯',
            tags: ['📦 Onluk & Birlik', '🎯 En Yakın Onluk', '📦 Deste & Düzine'],
            btnText: 'Düelloyu Başlat',
            topic: 'place_value'
          },
          {
            id: 'math_multiplication_2',
            active: true,
            title: 'Hızlı Çarpma Başlangıcı',
            icon: '✖️',
            badge: '✖️ Çarpım Tablosu',
            featureTag: '⚡ 2-3-4-5 Katları',
            description: '2, 3, 4 ve 5\'lerle çarpım tablosu düellosu! Hızlıca çarp, puanları topla! ✖️🚀',
            tags: ['✖️ 2, 3, 4, 5 Katları', '🎯 Tekrarlı Toplama', '🍎 Çarpma Problemleri'],
            btnText: 'Düelloyu Başlat',
            topic: 'multiplication'
          },
          {
            id: 'math_clock_2',
            active: true,
            title: 'Zamanı Ölçme ve Saatler',
            icon: '⏰',
            badge: '⏰ Zaman & Saat',
            featureTag: '⭐ 26 Özgün Soru',
            description: 'Tam, yarım ve çeyrek saatleri oku; gün, hafta, ay ve mevsim ilişkilerini bil! ⏰📅',
            tags: ['⏰ Akrep & Yelkovan', '⏳ Tam-Yarım-Çeyrek', '📅 Gün-Hafta-Ay'],
            btnText: 'Düelloyu Başlat',
            topic: 'clocks'
          },
          {
            id: 'math',
            active: true,
            title: 'Kafa Kafaya Matematik (2 Basamaklı İşlemler)',
            icon: '🧮',
            badge: '🚀 2 Basamaklı İşlem',
            featureTag: '⚡ Hızlı İşlem',
            description: 'İki basamaklı çılgın işlemler, eldeli toplama ve onluk bozarak çıkarma! ⚡',
            tags: ['⚡ 2 Basamak', '➕ Eldeli Toplama', '➖ Onluk Bozma'],
            btnText: 'Düelloyu Başlat',
            topic: 'two_digits'
          }
        ]
      },
      {
        id: 'turkish',
        name: 'Türkçe',
        icon: '📚',
        colorTheme: 'theme-turkish',
        tagline: 'Eş & Zıt Anlamlılar',
        description: 'Zengin kelime hazinesi, eş/zıt anlam şampiyonası ve noktalama işaretleri! ✍️',
        badge: 'MEB Müfredatı',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'syn_ant', label: '✨ Eş & Zıt Anlam' },
          { id: 'punctuation', label: '✍️ Noktalama & Yazım' }
        ],
        games: [
          {
            id: 'turkish_syn_ant_2',
            active: true,
            title: 'Eş ve Zıt Anlamlılar Şampiyonası',
            icon: '✨',
            badge: '✨ Eş & Zıt Anlam',
            featureTag: '⭐ 45+ Kelime',
            description: 'Al-kırmızı, beyaz-ak gibi eş anlamlılar ve geniş zıt anlam havuzunda yarış! ✨🏆',
            tags: ['✨ Eş Anlamlılar', '🔄 Zıt Anlamlılar', '📚 Zengin Sözlük'],
            btnText: 'Düelloyu Başlat',
            topic: 'syn_ant'
          },
          {
            id: 'turkish_punctuation_2',
            active: true,
            title: 'Noktalama İşaretleri ve Yazım Kuralları',
            icon: '✍️',
            badge: '✍️ Noktalama',
            featureTag: '⭐ 26 Özgün Soru',
            description: 'Nokta, soru işareti, ünlem, kesme işareti ve özel isimlerin büyük harfle yazılışı! ✍️❓',
            tags: ['❓ Soru & Ünlem', '🛑 Nokta & Virgül', '🔤 Büyük Harfler'],
            btnText: 'Düelloyu Başlat',
            topic: 'punctuation'
          },
          {
            id: 'turkish',
            active: true,
            title: 'Hızlı Türkçe & Sözcük Düellosu (Karma)',
            icon: '🦉',
            badge: '🚀 Karma Türkçe',
            featureTag: '🔍 Sözcük Avı',
            description: 'Eş/zıt anlam, noktalama ve yazım kurallarından oluşan süper karma yarışma! 🎯',
            tags: ['✨ Eş Anlamlılar', '🔄 Zıt Anlamlılar', '✏️ Yazım Kuralları'],
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
        tagline: 'Güvenli Hayat & Ülkemiz',
        description: 'Trafik kuralları, 112 acil, Atatürk\'ün hayatı ve milli kültürümüz! 🇹🇷🚦',
        badge: 'MEB Müfredatı',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'traffic', label: '🚦 Güvenli Hayat & Trafik' },
          { id: 'culture', label: '🇹🇷 Ülkemiz ve Kültürümüz' }
        ],
        games: [
          {
            id: 'lifescience_traffic_2',
            active: true,
            title: 'Güvenli Hayat ve Trafik',
            icon: '🚦',
            badge: '🚦 Trafik & Güvenlik',
            featureTag: '⭐ 26 Özgün Soru',
            description: 'Trafik levhaları, yaya geçidi, 112 Acil Çağrı, deprem ve doğa olaylarında güvenlik! 🚦🚨',
            tags: ['🚦 Trafik Işıkları', '🚨 112 Acil Yardım', '🌍 Deprem Bilinci'],
            btnText: 'Düelloyu Başlat',
            topic: 'traffic'
          },
          {
            id: 'lifescience_culture_2',
            active: true,
            title: 'Ülkemiz ve Kültürümüz',
            icon: '🇹🇷',
            badge: '🇹🇷 Milli Değerler',
            featureTag: '⭐ 26 Özgün Soru',
            description: 'Al bayrağımız, İstiklal Marşımız, Atatürk\'ün hayatı ve milli bayramlarımızı öğren! 🇹🇷❤️',
            tags: ['🇹🇷 Şanlı Bayrağımız', '🎖️ Mustafa Kemal Atatürk', '🎉 Milli Bayramlar'],
            btnText: 'Düelloyu Başlat',
            topic: 'culture'
          },
          {
            id: 'lifescience',
            active: true,
            title: 'Hayat Bilgisi Bilgi Yarışı (Karma)',
            icon: '🌱',
            badge: '🚀 Karma Hayat Bilgisi',
            featureTag: '💡 Bilinçli Çocuk',
            description: 'Trafik güvenliği, milli değerler, tasarruf ve çevre bilincinde kafa kafaya yarış! 🇹🇷♻️',
            tags: ['🚦 Güvenli Hayat', '🇹🇷 Milli Değerler', '💡 Çevre Bilinci'],
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
        tagline: 'Yönetim, Yönler & Haklarımız',
        description: 'Ana ve ara yönler, kroki çizimi, tüketici hakları ve toplum bilinci! 🧭🛍️',
        badge: 'MEB Müfredatı',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'compass', label: '🧭 Yönlerimiz & Kroki' },
          { id: 'consumer', label: '🛍️ Tüketici Hakları' }
        ],
        games: [
          {
            id: 'lifescience_compass_consumer_3',
            active: true,
            title: 'Yönlerimiz, Kroki & Tüketici Hakları',
            icon: '🧭',
            badge: '26 Özgün Soru',
            featureTag: '🧭 Pusula & Haklarımız',
            description: 'Ana/ara yönler, kroki çizimi, bilinçli tüketici hakları ve komşuluk ilişkileri! 🧭🛍️',
            tags: ['🧭 Ana & Ara Yönler', '🗺️ Kroki Çizimi', '🛍️ Bilinçli Tüketici'],
            btnText: 'Düelloyu Başlat',
            topic: 'compass'
          },
          {
            id: 'lifescience',
            active: true,
            title: 'Hayat Bilgisi Bilgi Yarışı (Karma)',
            icon: '🌱',
            badge: '⚡ Afet & Toplum',
            featureTag: '🏛️ Vatandaşlık',
            description: 'Afetlerde doğru davranışlar, mahalle yönetimi ve cumhuriyet! 🏛️🛡️',
            tags: ['🛡️ Deprem Bilinci', '🏛️ Muhtar & Kaymakam', '🇹🇷 Atatürk İlkeleri'],
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
        tagline: 'Dünya, Duyular & Kuvvet',
        description: 'Dünyamızın katmanları, duyu organlarımız, kuvvet ve maddenin halleri! 🌍🧲',
        badge: 'MEB Müfredatı',
        topics: [
          { id: 'all', label: '🌟 Tümü' },
          { id: 'earth_senses', label: '🌍 Dünya & Duyularımız' },
          { id: 'force_matter', label: '🧲 Kuvvet & Maddenin Halleri' }
        ],
        games: [
          {
            id: 'science_earth_senses_3',
            active: true,
            title: 'Gezegenimiz Dünya ve Beş Duyumuz',
            icon: '🌍',
            badge: '26 Özgün Soru',
            featureTag: '🌍 Katmanlar & Duyular',
            description: 'Dünya\'nın katmanları, 5 duyu organımız, görevleri ve organ sağlığı! 🌍👂',
            tags: ['🌍 Dünya\'nın Katmanları', '👂 5 Duyu Organı', '👁️ Göz & Kulak Sağlığı'],
            btnText: 'Düelloyu Başlat',
            topic: 'earth_senses'
          },
          {
            id: 'science_force_matter_3',
            active: true,
            title: 'Kuvveti Tanıyalım ve Madde',
            icon: '🧲',
            badge: '26 Özgün Soru',
            featureTag: '⚡ Kuvvet & Haller',
            description: 'İtme-çekme kuvveti, hareket türleri, maddenin katı-sıvı-gaz halleri! 🧲🧊',
            tags: ['🧲 İtme & Çekme Kuvveti', '🧊 Maddenin 3 Hali', '🧽 Esnek & Berk Madde'],
            btnText: 'Düelloyu Başlat',
            topic: 'force_matter'
          },
          {
            id: 'science',
            active: true,
            title: 'Fen Bilimleri Laboratuvarı (Karma)',
            icon: '🔬',
            badge: '⚡ Fen & Doğa',
            featureTag: '🌍 Bilim Kaşifi',
            description: 'Dünyanın şekli, 5 duyu organı, itme-çekme ve maddenin halleri! 🌍🧲',
            tags: ['🌍 Dünyanın Şekli', '👂 5 Duyu Organı', '🧲 İtme & Çekme'],
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
        <div class="subject-card ${subject.colorTheme}" data-subject-id="${subject.id}" role="button" tabindex="0">
          <div class="subject-card-top">
            <span class="subject-badge">${replaceEmojisWith3D(subject.badge, 'chip-3d-icon')}</span>
            <div class="card-top-right-actions">
              <span class="subject-games-count">${activeGamesCount} Pratik Aktif</span>
              <button class="card-share-btn" data-share-title="${escapeHtml(subject.name)}" title="Ödev / Pratik Gönder (WhatsApp)" aria-label="WhatsApp'ta Paylaş">📲</button>
            </div>
          </div>
          <div class="subject-icon-wrap">
            <span class="subject-icon">${replaceEmojisWith3D(subject.icon, 'game-3d-big-icon')}</span>
          </div>
          <h3 class="subject-title">${subject.name}</h3>
          <span class="subject-tagline">${subject.tagline}</span>
          <p class="subject-desc">${subject.description}</p>
          <div class="subject-card-footer">
            <span class="btn-open-subject">Dersi Aç ➔</span>
          </div>
        </div>
      `;
    }).join('');

    // Paylaşım Butonu Dinleyicileri (Kart Tıklamasını Engeller)
    DOM.subjectsGrid.querySelectorAll('.card-share-btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const title = btn.getAttribute('data-share-title') || 'Ders';
        shareActivity(title);
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Ders Kartlarına Tıklama Dinleyicisi
    DOM.subjectsGrid.querySelectorAll('.subject-card').forEach(card => {
      card.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const subjectId = card.getAttribute('data-subject-id');
        selectSubject(subjectId);
      });
    });
  }

  // Ders Seçildiğinde 2. Kademeye (Oyunlar & Konular) Geç
  function selectSubject(subjectId) {
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
    renderSubcategories();
    renderGameCards();
  }

  // "← Tüm Dersler" Butonuna Basıldığında 1. Kademeye Dönüş
  function returnToSubjectsList() {
    state.currentSection = 'subjects';
    state.currentSubject = null;
    state.currentCategory = 'all';

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
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
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
                <button class="card-share-btn" data-share-title="${escapeHtml(game.title)}" title="Ödev / Pratik Gönder (WhatsApp)" aria-label="WhatsApp'ta Paylaş">📲</button>
              </div>
            </div>
            <div class="game-visual-icon">${replaceEmojisWith3D(game.icon, 'game-3d-big-icon')}</div>
            <h3 class="game-title">${game.title}</h3>
            <p class="game-subtitle">${game.description}</p>
            <div class="game-features-list">
              ${game.tags.map(t => `<span class="feature-pill">${replaceEmojisWith3D(t, 'chip-3d-icon')}</span>`).join('')}
            </div>
            <button class="btn-play-game" data-game-id="${game.id}">
              🎮 ${state.gameMode === 'solo' ? 'Pratiğe Başla' : game.btnText}
            </button>
          </div>
        `;
      } else {
        // Yakında / Hazırlanıyor Kartı
        return `
          <div class="game-card game-card-upcoming" data-game-id="${game.id}">
            <div class="game-top-meta">
              <span class="game-category-tag tag-upcoming">🔒 ${game.badge || 'Hazırlanıyor'}</span>
              <span class="game-speed-badge">${replaceEmojisWith3D(game.featureTag, 'chip-3d-icon')}</span>
            </div>
            <div class="game-visual-icon" style="filter: grayscale(0.5); opacity:0.85;">${replaceEmojisWith3D(game.icon, 'game-3d-big-icon')}</div>
            <h3 class="game-title">${game.title}</h3>
            <p class="game-subtitle">${game.description}</p>
            <div class="game-features-list">
              ${game.tags.map(t => `<span class="feature-pill">${replaceEmojisWith3D(t, 'chip-3d-icon')}</span>`).join('')}
            </div>
            <button class="btn-play-game btn-upcoming" disabled>
              🔒 Yakında Aktif
            </button>
          </div>
        `;
      }
    }).join('');

    // Paylaşım Butonu Dinleyicileri (Kart Tıklamasını Engeller)
    DOM.gamesGrid.querySelectorAll('.card-share-btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const title = btn.getAttribute('data-share-title') || 'Oyun';
        shareActivity(title);
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Aktif kartlara tıklama dinleyicisi
    DOM.gamesGrid.querySelectorAll('.game-card:not(.game-card-upcoming)').forEach(card => {
      card.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const gameId = card.getAttribute('data-game-id');
        startDuel(gameId);
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
    renderGameCards();
  }

  function updateGameModeUI() {
    const isSolo = (state.gameMode === 'solo');

    if (DOM.btnModeDuel) DOM.btnModeDuel.classList.toggle('active', !isSolo);
    if (DOM.btnModeSolo) DOM.btnModeSolo.classList.toggle('active', isSolo);

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
    state.currentSection = 'home';
    state.currentSubject = null;
    state.currentCategory = 'all';

    // Sol panelde "🏠 Ana Sayfa" aktif, sınıflar pasif
    if (DOM.btnNavHome) DOM.btnNavHome.classList.add('active');
    DOM.gradeChips.forEach(chip => chip.classList.remove('active'));
    DOM.gradeCards.forEach(card => card.classList.remove('active'));

    // Bölümleri yönet: Ana Sayfa Vitrini açık, diğerleri gizli
    if (DOM.homeShowcaseSection) DOM.homeShowcaseSection.classList.remove('hide');
    if (DOM.subjectsSection) DOM.subjectsSection.classList.add('hide');
    if (DOM.gamesSection) DOM.gamesSection.classList.add('hide');

    // Moli lobi ifadesi
    changeMoliExpression('lobby');
  }

  function setGrade(gradeNumber) {
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
      DOM.authIcon.textContent = '🎓';
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
      DOM.authIcon.textContent = '👨‍🏫';
      if (mobileLoginBtn) {
        mobileLoginBtn.classList.remove('logged-in');
        mobileLoginBtn.innerHTML = '<span class="btn-icon">👤</span> Giriş Yap';
      }
      if (mobileNoticeBanner) {
        mobileNoticeBanner.style.display = '';
      }
      if (desktopLoginText) {
        desktopLoginText.textContent = 'Giriş Yap';
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
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
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
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
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
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const quizId = btn.getAttribute('data-play-quiz-id');
        startCustomQuiz(quizId);
      });
    });

    // "🗑️ Sil" Dinleyicileri
    DOM.savedQuizzesList.querySelectorAll('[data-del-quiz-id]').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
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
    if (gameType === 'custom_quiz' && state.activeCustomQuiz) {
      DOM.duelGradeBadge.innerHTML = '🎯 Özel Sınav';
      DOM.duelGameTypeBadge.innerHTML = replaceEmojisWith3D('📝 ' + escapeHtml(state.activeCustomQuiz.title), 'chip-3d-icon');
    } else {
      DOM.duelGradeBadge.innerHTML = replaceEmojisWith3D(gradeLabels[state.currentGrade] || `${state.currentGrade}. Sınıf`, 'chip-3d-icon');
      DOM.duelGameTypeBadge.innerHTML = replaceEmojisWith3D(gameTypeBadges[gameType] || (isSolo ? '🎯 Bireysel Pratik' : '🎯 Sınıf Düellosu'), 'chip-3d-icon');
    }
    updateGameModeUI();
    updatePlayerNamesUI();
    renderScoreTrack();

    // Lobi -> Düello Görünümüne Geçiş (Kesin ve zorunlu ekran geçişi)
    DOM.viewLobby.classList.remove('active');
    DOM.viewLobby.style.display = 'none';

    DOM.viewDuel.classList.add('active');
    DOM.viewDuel.style.display = 'flex';
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
      star.innerHTML = `<img src="assets/icons/3d/star.png" style="width:28px; height:28px; object-fit:contain; vertical-align:middle; pointer-events:none;" alt="⭐">`;
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

    const startTime = performance.now();

    function updateReflexBar(now) {
      if (state.isQuestionAnswered || state.currentView !== 'duel') {
        stopReflexTimer();
        return;
      }
      const elapsed = now - startTime;
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
        reflexTimerRaf = requestAnimationFrame(updateReflexBar);
      }
    }

    reflexTimerRaf = requestAnimationFrame(updateReflexBar);
  }

  function stopReflexTimer() {
    if (reflexTimerRaf) {
      cancelAnimationFrame(reflexTimerRaf);
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
              const iconHtml = EMOJI_TO_3D[c.icon]
                ? `<img src="${EMOJI_TO_3D[c.icon]}" class="visual-3d-img" alt="${c.text}">`
                : `<span class="visual-emoji-icon">${c.icon}</span>`;
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
          audio.speakTurkishText(q.spokenText || q.question);
        }
      }, 350);
    }

    [DOM.p1InteractiveZone, DOM.p2InteractiveZone].forEach((zone, zIdx) => {
      if (!zone) return;
      const pNum = zIdx + 1;

      zone.querySelectorAll('.visual-audio-repeat-btn').forEach(btn => {
        attachInstantTouch(btn, () => {
          audio.playClick();
          audio.speakTurkishText(q.spokenText || q.question);
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
            <span class="moli-task-avatar">🎈</span>
            <span class="task-title-text">${replaceEmojisWith3D(data.instruction || 'Hedef Balonları Patlat!', 'inline-3d-icon')}</span>
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
                  <span class="balloon-inner-text">${b.text}</span>
                  <div class="balloon-string-knot"></div>
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
      DOM.logoBtn.addEventListener('pointerdown', () => {
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

    DOM.btnToggleFullscreen.addEventListener('pointerdown', toggleFullscreen);
    DOM.btnToggleSound.addEventListener('pointerdown', toggleSound);
    DOM.btnTeacherAuth.addEventListener('pointerdown', handleAuthClick);
    DOM.btnSimulateGoogleLogin.addEventListener('pointerdown', simulateGoogleLogin);

    // Sol Panel "🏠 Ana Sayfa" Butonu
    if (DOM.btnNavHome) {
      DOM.btnNavHome.addEventListener('pointerdown', () => {
        audio.playClick();
        openHomePage();
      });
    }

    // Dersler Ekranındaki "← Ana Sayfa" Butonu
    if (DOM.btnBackToHome) {
      DOM.btnBackToHome.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.playClick();
        openHomePage();
      });
    }

    // Pro Butonlar
    DOM.btnOpenPicker.addEventListener('pointerdown', openPickerModal);
    DOM.btnOpenCustomQ.addEventListener('pointerdown', openCustomQModal);
    DOM.btnOpenLeaderboard.addEventListener('pointerdown', openLeaderboardModal);
    DOM.btnResetLeague.addEventListener('pointerdown', resetLeagueScores);

    // Sınıf Çipleri (Header & Sidebar)
    DOM.gradeChips.forEach(chip => {
      chip.addEventListener('pointerdown', () => {
        setGrade(chip.getAttribute('data-grade'));
      });
    });

    // Sınıf Kartları (Lobi ve Vitrin)
    DOM.gradeCards.forEach(card => {
      card.addEventListener('pointerdown', () => {
        setGrade(card.getAttribute('data-grade'));
      });
    });

    // Ana Sayfa Vitrini: Dev Sınıf Kartları (🎈 Anasınıfı, 1., 2., 3., 4. Sınıf)
    if (DOM.homeGradeCards) {
      DOM.homeGradeCards.forEach(card => {
        card.addEventListener('pointerdown', () => {
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
        card.addEventListener('pointerdown', () => {
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
      DOM.btnHeroStart.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.playClick();
        const section = document.querySelector('.home-section-container');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

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
      DOM.btnToggleAnnouncerDuel.addEventListener('pointerdown', () => {
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
      DOM.btnHudReadQuestion.addEventListener('pointerdown', e => {
        e.preventDefault();
        readCurrentQuestion(true);
      });
    }
    if (DOM.btnReadAloudP1) {
      DOM.btnReadAloudP1.addEventListener('pointerdown', e => {
        e.preventDefault();
        readCurrentQuestion(true);
      });
    }
    if (DOM.btnReadAloudP2) {
      DOM.btnReadAloudP2.addEventListener('pointerdown', e => {
        e.preventDefault();
        readCurrentQuestion(true);
      });
    }

    // Düello Kontrolleri: Çıkış butonuna basıldığı an beklemeden ve onay sormadan anında lobiye dön
    const handleExitAction = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      returnToLobby();
    };
    DOM.btnExitDuel.addEventListener('pointerdown', handleExitAction);
    DOM.btnExitDuel.addEventListener('click', handleExitAction);
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

    // Modal Çıkış Onayı Dinleyicileri (Mobilde anında ve takılmasız çıkış)
    if (DOM.btnConfirmExitYes) {
      DOM.btnConfirmExitYes.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        returnToLobby();
      });
    }
    if (DOM.btnConfirmExitNo) {
      DOM.btnConfirmExitNo.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        closeModal(DOM.modalConfirmExit);
      });
    }

    // -------------------------------------------------------------
    // Akıllı Tahta Multi-Touch Şık Butonları (Pointerdown)
    // -------------------------------------------------------------
    // 1. Oyuncu (Mavi)
    DOM.p1OptA.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(1, 0); });
    DOM.p1OptB.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(1, 1); });
    DOM.p1OptC.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(1, 2); });
    if (DOM.p1OptD) {
      DOM.p1OptD.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(1, 3); });
    }

    // 2. Oyuncu (Kırmızı)
    DOM.p2OptA.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(2, 0); });
    DOM.p2OptB.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(2, 1); });
    DOM.p2OptC.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(2, 2); });
    if (DOM.p2OptD) {
      DOM.p2OptD.addEventListener('pointerdown', e => { e.preventDefault(); handleAnswer(2, 3); });
    }

    // Çarkıfelek Kura & Sınıf Yönetimi Butonları
    DOM.btnSpinWheel.addEventListener('pointerdown', spinStudentWheel);
    DOM.btnApplySelectedStudents.addEventListener('pointerdown', applySelectedStudents);
    DOM.btnSaveRoster.addEventListener('pointerdown', saveClassRoster);
    DOM.btnResetRoster.addEventListener('pointerdown', resetDefaultRoster);
    if (DOM.btnClearRoster) DOM.btnClearRoster.addEventListener('pointerdown', clearClassRoster);
    if (DOM.btnBackToStage) DOM.btnBackToStage.addEventListener('pointerdown', () => switchPickerView('stage'));
    if (DOM.btnPickerModeSingle) DOM.btnPickerModeSingle.addEventListener('pointerdown', () => setPickerMode('single'));
    if (DOM.btnPickerModeDuel) DOM.btnPickerModeDuel.addEventListener('pointerdown', () => setPickerMode('duel'));
    if (DOM.btnPickerTabRoster) DOM.btnPickerTabRoster.addEventListener('pointerdown', () => switchPickerView('roster'));
    if (DOM.btnAddTodaySelected) DOM.btnAddTodaySelected.addEventListener('pointerdown', addCurrentWinnerToToday);
    if (DOM.btnSpeakStudentName) DOM.btnSpeakStudentName.addEventListener('pointerdown', speakCurrentWinnerName);
    if (DOM.btnResetTodaySelected) DOM.btnResetTodaySelected.addEventListener('pointerdown', resetTodaySelected);
    if (DOM.chkExcludeToday) {
      DOM.chkExcludeToday.addEventListener('change', () => {
        state.excludeTodaySelected = DOM.chkExcludeToday.checked;
        updatePickerPoolStatus();
      });
    }

    // Özel Sınav Oluşturucu & Soru Bankası Butonları
    if (DOM.btnQuizAddQuestion) {
      DOM.btnQuizAddQuestion.addEventListener('pointerdown', handleQuizAddQuestion);
    }
    if (DOM.btnQuizSaveQuiz) {
      DOM.btnQuizSaveQuiz.addEventListener('pointerdown', handleQuizSaveQuiz);
    }
    document.querySelectorAll('input[name="quizCorrectRadio"]').forEach(radio => {
      radio.addEventListener('change', updateQuizRadioRowHighlights);
    });

    // Oyun Modu Seçimi (İki Kişilik Düello vs Tek Kişilik Pratik)
    if (DOM.btnModeDuel) {
      DOM.btnModeDuel.addEventListener('pointerdown', () => {
        setGameMode('duel');
      });
    }
    if (DOM.btnModeSolo) {
      DOM.btnModeSolo.addEventListener('pointerdown', () => {
        setGameMode('solo');
      });
    }

    // Sevimli Maskot Moli Dokunma / Tıklama
    if (DOM.moliWidget) {
      DOM.moliWidget.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
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
      DOM.btnBackToSubjects.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        returnToSubjectsList();
      });
    }

    // Zafer Ekranı Butonları
    DOM.btnRematchSame.addEventListener('pointerdown', handleRematchSame);
    DOM.btnSelectNewStudents.addEventListener('pointerdown', handleSelectNewStudentsFromVictory);
    DOM.btnBackToLobby.addEventListener('pointerdown', handleBackToLobby);
    if (DOM.btnShareVictoryWhatsApp) {
      DOM.btnShareVictoryWhatsApp.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleShareVictoryWhatsApp();
      });
      DOM.btnShareVictoryWhatsApp.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    }
    if (DOM.btnCopyVictoryLink) {
      DOM.btnCopyVictoryLink.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleCopyVictoryLink();
      });
      DOM.btnCopyVictoryLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    }

    // Üst Bar ve Sol Menü Paylaş Butonları
    const handleGeneralShare = (e) => {
      if (e) {
        e.preventDefault();
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
      DOM.btnSidebarShare.addEventListener('pointerdown', handleGeneralShare);
      DOM.btnSidebarShare.addEventListener('click', (e) => e.preventDefault());
    }
    if (DOM.btnTopbarShare) {
      DOM.btnTopbarShare.addEventListener('pointerdown', handleGeneralShare);
      DOM.btnTopbarShare.addEventListener('click', (e) => e.preventDefault());
    }

    // Ana Sayfa Vitrini Popüler Oyun Kartlarındaki Paylaş Butonları
    document.querySelectorAll('.home-popular-card .card-share-btn').forEach(btn => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const title = btn.getAttribute('data-share-title') || 'Oyun';
        shareActivity(title);
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
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
      btnMobileLogin.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.playClick();
        handleAuthClick();
      });
      btnMobileLogin.addEventListener('click', (e) => e.preventDefault());
    }

    if (btnMobileNoticeBanner) {
      btnMobileNoticeBanner.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.playClick();
        handleAuthClick();
      });
      btnMobileNoticeBanner.addEventListener('click', (e) => e.preventDefault());
    }

    if (btnMobileShare) {
      btnMobileShare.addEventListener('pointerdown', handleGeneralShare);
      btnMobileShare.addEventListener('click', (e) => e.preventDefault());
    }

    const closeMobileSidebar = () => {
      if (appSidebar) appSidebar.classList.remove('sidebar-mobile-open');
      if (mobileDrawerBackdrop) mobileDrawerBackdrop.classList.remove('active');
      document.body.classList.remove('mobile-drawer-locked');
    };

    const toggleMobileSidebar = (e) => {
      if (e) {
        e.preventDefault();
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
      btnMobileMenu.addEventListener('pointerdown', toggleMobileSidebar);
      btnMobileMenu.addEventListener('click', (e) => e.preventDefault());
    }

    if (mobileDrawerBackdrop) {
      mobileDrawerBackdrop.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        closeMobileSidebar();
      });
      mobileDrawerBackdrop.addEventListener('click', (e) => e.preventDefault());
    }

    // Mobil menüdeki herhangi bir öğeye tıklandığında çekmeceyi otomatik kapat
    if (appSidebar) {
      appSidebar.querySelectorAll('.sidebar-item, .grade-chip, .sidebar-home-btn, .sidebar-sub-item').forEach(el => {
        el.addEventListener('pointerdown', () => {
          setTimeout(closeMobileSidebar, 150);
        });
      });
    }

    if (btnMobileLogo) {
      btnMobileLogo.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.playClick();
        if (state.currentView === 'duel') {
          exitDuel();
        } else if (state.currentSection !== 'home') {
          openHomePage();
        } else {
          handleMoliClick();
        }
      });
      btnMobileLogo.addEventListener('click', (e) => e.preventDefault());
    }

    if (btnMobileHeroStart) {
      btnMobileHeroStart.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.playClick();
        const section = document.querySelector('.home-section-container');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          setGrade(1);
        }
      });
      btnMobileHeroStart.addEventListener('click', (e) => e.preventDefault());
    }

    if (btnMobileQuickClasses) {
      btnMobileQuickClasses.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.playClick();
        const section = document.querySelector('.home-section-container');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          setGrade(1);
        }
      });
      btnMobileQuickClasses.addEventListener('click', (e) => e.preventDefault());
    }

    if (btnMobileQuickDuels) {
      btnMobileQuickDuels.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.playClick();
        setGameMode('duel');
        const section = document.querySelector('.home-popular-grid') || document.querySelector('.home-section-container');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      btnMobileQuickDuels.addEventListener('click', (e) => e.preventDefault());
    }

    // Mobil Hızlı Liste Çipleri
    document.querySelectorAll('.mobile-quick-list-section .quick-list-chip').forEach(chip => {
      chip.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const gradeAttr = chip.getAttribute('data-grade');
        if (gradeAttr !== null && gradeAttr !== undefined) {
          setGrade(gradeAttr);
        }
      });
      chip.addEventListener('click', (e) => e.preventDefault());
    });

    // Mobil Moli Maskotu ve Rozet Etkileşimleri
    const mobileMoliMascot = document.querySelector('.mobile-moli-mascot-wrap');
    if (mobileMoliMascot) {
      mobileMoliMascot.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        audio.playClick();
        handleMoliClick();
      });
    }

    const pillBadgeMath = document.querySelector('.pill-badge-math');
    if (pillBadgeMath) {
      pillBadgeMath.addEventListener('pointerdown', () => {
        audio.playCorrect();
        showToast('🧮 4 + 5 = 9! Matematik harika!');
      });
    }

    const pillBadgeLetters = document.querySelector('.pill-badge-letters');
    if (pillBadgeLetters) {
      pillBadgeLetters.addEventListener('pointerdown', () => {
        audio.playClick();
        showToast('🔤 A B C - Harfleri öğrenmeye hazır mısın?');
      });
    }

    const badgeTrophy = document.querySelector('.badge-circle-trophy');
    if (badgeTrophy) {
      badgeTrophy.addEventListener('pointerdown', () => {
        audio.playFanfare();
        openLeaderboardModal();
      });
    }

    const badgeBalloon = document.querySelector('.badge-circle-balloon');
    if (badgeBalloon) {
      badgeBalloon.addEventListener('pointerdown', () => {
        audio.playPop();
        if (typeof launchConfetti === 'function') launchConfetti();
      });
    }

    const pillBadgePoints = document.querySelector('.pill-badge-points');
    if (pillBadgePoints) {
      pillBadgePoints.addEventListener('pointerdown', () => {
        audio.playCorrect();
        showToast('⭐ +10 Puan Kazandın! Tebrikler!');
      });
    }

    const pillBadgeReady = document.querySelector('.pill-badge-ready');
    if (pillBadgeReady) {
      pillBadgeReady.addEventListener('pointerdown', () => {
        audio.playClick();
        showToast('🤖 Moli seninle oynamaya hazır!');
      });
    }

    // =========================================================================
    // AKILLI TAHTA, TABLET & BİLGİSAYAR VİTRİNİ ETKİLEŞİMLERİ (WIDESCREEN SHOWCASE)
    // =========================================================================
    const btnDesktopHome = document.getElementById('btnDesktopHome');
    if (btnDesktopHome) {
      btnDesktopHome.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.playClick();
        if (state.currentView === 'duel') {
          exitDuel();
        } else if (state.currentSection !== 'home') {
          openHomePage();
        } else {
          handleMoliClick();
        }
      });
      btnDesktopHome.addEventListener('click', e => e.preventDefault());
    }

    const btnDesktopLogin = document.getElementById('btnDesktopLogin');
    if (btnDesktopLogin) {
      btnDesktopLogin.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.playClick();
        handleAuthClick();
      });
      btnDesktopLogin.addEventListener('click', e => e.preventDefault());
    }

    const desktopNoticeBanner = document.getElementById('desktopNoticeBanner');
    if (desktopNoticeBanner) {
      desktopNoticeBanner.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.playClick();
        handleAuthClick();
      });
      desktopNoticeBanner.addEventListener('click', e => e.preventDefault());
    }

    const btnDesktopShare = document.getElementById('btnDesktopShare');
    if (btnDesktopShare) {
      btnDesktopShare.addEventListener('pointerdown', handleGeneralShare);
      btnDesktopShare.addEventListener('click', e => e.preventDefault());
    }

    const btnDesktopAddQuiz = document.getElementById('btnDesktopAddQuiz');
    if (btnDesktopAddQuiz) {
      btnDesktopAddQuiz.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.playClick();
        openCustomQModal();
      });
      btnDesktopAddQuiz.addEventListener('click', e => e.preventDefault());
    }

    const btnDesktopSettings = document.getElementById('btnDesktopSettings');
    const modalSettings = document.getElementById('modalSettings');
    if (btnDesktopSettings && modalSettings) {
      btnDesktopSettings.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.playClick();
        openModal(modalSettings);
      });
      btnDesktopSettings.addEventListener('click', e => e.preventDefault());
    }

    const btnSettingsSoundToggle = document.getElementById('btnSettingsSoundToggle');
    if (btnSettingsSoundToggle) {
      btnSettingsSoundToggle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        toggleSound();
        btnSettingsSoundToggle.textContent = state.soundEnabled ? 'Ses: Açık 🔊' : 'Ses: Kapalı 🔇';
        btnSettingsSoundToggle.classList.toggle('is-off', !state.soundEnabled);
      });
    }

    const btnSettingsAnnouncerToggle = document.getElementById('btnSettingsAnnouncerToggle');
    if (btnSettingsAnnouncerToggle) {
      btnSettingsAnnouncerToggle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        toggleAnnouncerVoice();
        btnSettingsAnnouncerToggle.textContent = state.announcerEnabled ? 'Anons: Açık 🎙️' : 'Anons: Kapalı 🔇';
        btnSettingsAnnouncerToggle.classList.toggle('is-off', !state.announcerEnabled);
      });
    }

    const btnSettingsAutoReadToggle = document.getElementById('btnSettingsAutoReadToggle');
    if (btnSettingsAutoReadToggle) {
      btnSettingsAutoReadToggle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        state.autoReadQuestion = !state.autoReadQuestion;
        StorageManager.saveSettings();
        updateAutoReadUI();
        btnSettingsAutoReadToggle.textContent = state.autoReadQuestion ? 'Okuma: Açık 📖' : 'Okuma: Kapalı 🔇';
        btnSettingsAutoReadToggle.classList.toggle('is-off', !state.autoReadQuestion);
      });
    }

    const btnSettingsExplanationToggle = document.getElementById('btnSettingsExplanationToggle');
    if (btnSettingsExplanationToggle) {
      btnSettingsExplanationToggle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        state.showAutoExplanation = !state.showAutoExplanation;
        StorageManager.saveSettings();
        btnSettingsExplanationToggle.textContent = state.showAutoExplanation ? 'Açıklama: Açık 💡' : 'Açıklama: Kapalı 🔇';
        btnSettingsExplanationToggle.classList.toggle('is-off', !state.showAutoExplanation);
      });
    }

    const btnSettingsFullscreenAction = document.getElementById('btnSettingsFullscreenAction');
    if (btnSettingsFullscreenAction) {
      btnSettingsFullscreenAction.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        toggleFullscreen();
      });
    }

    const btnDesktopMenu = document.getElementById('btnDesktopMenu');
    if (btnDesktopMenu) {
      btnDesktopMenu.addEventListener('pointerdown', toggleMobileSidebar);
      btnDesktopMenu.addEventListener('click', e => e.preventDefault());
    }

    const btnDesktopHeroStart = document.getElementById('btnDesktopHeroStart');
    if (btnDesktopHeroStart) {
      btnDesktopHeroStart.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.playClick();
        const section = document.querySelector('.home-section-container');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          setGrade(1);
        }
      });
      btnDesktopHeroStart.addEventListener('click', e => e.preventDefault());
    }

    // 7 Adet Dikey Sınıf / Ders Kartı (Sol Sütun)
    document.querySelectorAll('.stage-grades-sidebar .stage-grade-card[data-grade]').forEach(card => {
      card.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const g = card.getAttribute('data-grade');
        if (g !== null && g !== undefined) {
          setGrade(g);
        }
      });
      card.addEventListener('click', e => e.preventDefault());
    });

    const btnStageQuickDuels = document.getElementById('btnStageQuickDuels');
    if (btnStageQuickDuels) {
      btnStageQuickDuels.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.playClick();
        setGameMode('duel');
        const section = document.querySelector('.home-popular-grid') || document.querySelector('.home-section-container');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      btnStageQuickDuels.addEventListener('click', e => e.preventDefault());
    }

    const btnStageQuickEnglish = document.getElementById('btnStageQuickEnglish');
    if (btnStageQuickEnglish) {
      btnStageQuickEnglish.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.playClick();
        setGrade(2);
        if (typeof selectSubject === 'function') {
          selectSubject('english');
        }
      });
      btnStageQuickEnglish.addEventListener('click', e => e.preventDefault());
    }

    // Sağ Sütundaki Rozetler
    const btnPillMath = document.getElementById('btnPillMath');
    if (btnPillMath) {
      btnPillMath.addEventListener('pointerdown', () => {
        audio.playCorrect();
        showToast('🧮 4 + 5 = 9! Matematik harika!');
      });
    }

    const btnPillLetters = document.getElementById('btnPillLetters');
    if (btnPillLetters) {
      btnPillLetters.addEventListener('pointerdown', () => {
        audio.playClick();
        showToast('🔤 A B C - Harfleri öğrenmeye hazır mısın?');
      });
    }

    const btnStageCircleTrophy = document.getElementById('btnStageCircleTrophy');
    if (btnStageCircleTrophy) {
      btnStageCircleTrophy.addEventListener('pointerdown', () => {
        audio.playFanfare();
        openLeaderboardModal();
      });
    }

    const btnStageCircleBalloon = document.getElementById('btnStageCircleBalloon');
    if (btnStageCircleBalloon) {
      btnStageCircleBalloon.addEventListener('pointerdown', () => {
        audio.playPop();
        if (typeof launchConfetti === 'function') launchConfetti();
      });
    }

    const btnPillPoints = document.getElementById('btnPillPoints');
    if (btnPillPoints) {
      btnPillPoints.addEventListener('pointerdown', () => {
        audio.playCorrect();
        showToast('⭐ +10 Puan Kazandın! Harikasın!');
      });
    }

    const btnPillReady = document.getElementById('btnPillReady');
    if (btnPillReady) {
      btnPillReady.addEventListener('pointerdown', () => {
        audio.playClick();
        showToast('🤖 Moli seninle oynamaya hazır!');
      });
    }

    const widescreenMoliRobot = document.getElementById('widescreenMoliRobot');
    if (widescreenMoliRobot) {
      widescreenMoliRobot.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
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
    updateSoundUI();
    updateAnnouncerUI();
    updateAutoReadUI();
    updateTeacherAuthUI();
    updateGameModeUI();
    updatePlayerNamesUI();
    renderSubjects();
    openHomePage(); // Varsayılan olarak Ana Sayfa Vitrini ile başla!

    // Kayıtlı ayarları UI'a yansıt
    DOM.chkAutoExplanation.checked = state.showAutoExplanation;
    if (DOM.chkAutoReadQuestion) {
      DOM.chkAutoReadQuestion.checked = state.autoReadQuestion;
    }
    DOM.targetScoreBtns.forEach(btn => {
      const s = parseInt(btn.getAttribute('data-score'), 10);
      btn.classList.toggle('active', s === state.targetScore);
    });

    setupEventListeners();
    console.log("🎯 Derse Bi' Mola başarıyla başlatıldı. MEB Fatih & ETAP uyumlu.");
  }

  // Dışarıdan ve konsoldan erişim için fonksiyonları globalde tanımla
  window.changeMoliExpression = changeMoliExpression;
  window.returnToLobby = returnToLobby;
  window.exitDuel = exitDuel;
  window.selectSubject = selectSubject;
  window.returnToSubjectsList = returnToSubjectsList;
  window.renderSubjects = renderSubjects;
  window.openHomePage = openHomePage;
  window.setGrade = setGrade;
  window.shareContent = shareContent;
  window.shareActivity = shareActivity;
  window.showShareToast = showShareToast;

  // DOM hazır olduğunda başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
