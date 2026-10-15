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

    // Sınıf Seviyesi: 0 (Anasınıfı), 1, 2, 3 veya 4
    currentGrade: 1,

    // Aktif Kategori Filtresi: 'all' veya sınıfa özel kategori id'si
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

    // -------------------------------------------------------------
    // Edge-TTS Sunucu & Zafer Seslendirmeleri
    // -------------------------------------------------------------
    playAnnouncer(name) {
      if (!state.soundEnabled || !state.announcerEnabled) return;
      try {
        const audio = new Audio(`sounds/${name}.mp3`);
        audio.volume = 0.95;
        audio.play().catch(() => {});
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
    // Soru Sesli Okuma (Edge-TTS MP3 & Web Speech API)
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

    speakTurkishText(text, onEnded) {
      if (!state.soundEnabled) {
        if (onEnded) onEnded();
        return;
      }
      // 3) Yeni bir ses çalmadan önce devam eden önceki Audio veya konuşmayı mutlaka durdur
      this.stopQuestionAudio();

      // 1) Metni okumadan önce tüm emojileri sil ve matematik işaretlerini Türkçe kelimelere çevir
      let cleanText = (text || '').toString()
        .replace(/\p{Extended_Pictographic}/gu, '')
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}\u{1F680}-\u{1F6FF}]/gu, '')
        .replace(/[\uFE00-\uFE0F]/g, '')
        .replace(/\+/g, ' artı ')
        .replace(/[-−–—]/g, ' eksi ')
        .replace(/[*×]/g, ' kere ')
        .replace(/(\d)\s*[xX]\s*(\d)/g, '$1 kere $2')
        .replace(/(^|\s)[xX](\s|$)/g, '$1 kere $2')
        .replace(/[xX]/g, ' kere ')
        .replace(/[\/÷]/g, ' bölü ')
        .replace(/=/g, ' eşittir ')
        .replace(/\b(kaç eder|kaçtır)\s*\?/gi, '$1')
        .replace(/\?/g, ' kaçtır ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) {
        if (onEnded) onEnded();
        return;
      }

      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          this.currentAudio = null;
          if (onEnded) onEnded();
        }
      };

      // 2) Eğer cihazda kaliteli yerel Türkçe ses yoksa (veya Linux/Pardus ise) Google TTS kullan
      const ua = (navigator.userAgent || '').toLowerCase();
      const platform = (navigator.platform || '').toLowerCase();
      const isLinuxOrPardus = /linux|pardus|x11/i.test(ua) || /linux/i.test(platform);

      let trVoice = null;
      if ('speechSynthesis' in window) {
        try {
          const voices = window.speechSynthesis.getVoices() || [];
          trVoice = voices.find(v => 
            (v.lang && (v.lang === 'tr-TR' || v.lang.toLowerCase().startsWith('tr'))) ||
            (v.name && (v.name.toLowerCase().includes('turkish') || v.name.toLowerCase().includes('türkçe')))
          );
        } catch(e) {}
      }

      const playWithSpeechSynthesis = () => {
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
          u.lang = 'tr-TR';
          u.rate = 0.95;
          u.pitch = 1.05;

          if (trVoice) {
            u.voice = trVoice;
          }

          u.onend = finish;
          u.onerror = finish;
          window.speechSynthesis.speak(u);
        } catch (e) {
          finish();
        }
      };

      const playWithGoogleTts = () => {
        try {
          const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=tr&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
          const audioEl = new Audio(googleUrl);
          this.currentAudio = audioEl;
          audioEl.volume = 1.0;

          audioEl.onended = finish;
          audioEl.onerror = () => {
            // Google TTS bağlantı hatasında çevrimdışı yedek olarak speechSynthesis dene
            this.currentAudio = null;
            playWithSpeechSynthesis();
          };

          const p = audioEl.play();
          if (p !== undefined) {
            p.catch(() => {
              this.currentAudio = null;
              playWithSpeechSynthesis();
            });
          }
        } catch (err) {
          playWithSpeechSynthesis();
        }
      };

      if (isLinuxOrPardus || !trVoice) {
        playWithGoogleTts();
      } else {
        playWithSpeechSynthesis();
      }
    }

    stopQuestionAudio() {
      if (this.currentAudio) {
        try {
          this.currentAudio.onended = null;
          this.currentAudio.onerror = null;
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
        } catch(e) {}
        this.currentAudio = null;
      }
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch(e) {}
      }
    }
  }

  const audio = new SoundEngine();

  // -------------------------------------------------------------
  // Soru Sesli Okuma Yardımcıları (Edge-TTS & Web Speech)
  // -------------------------------------------------------------
  function getSpokenTextForQuestion(q) {
    if (!q) return '';
    let text = q.question || '';
    if (!text && q.questionHtml) {
      text = q.questionHtml;
    }

    // HTML etiketlerini ve içeriğini temizle
    text = text.replace(/<[^>]*>/g, ' ');

    // Matematik sembollerini akıcı Türkçeye çevir
    if (text.includes('+') && text.includes('=')) {
      text = text.replace(/(\d+)\s*\+\s*(\d+)\s*=\s*\?/, '$1 artı $2 kaç eder?');
    } else if (text.includes('-') && text.includes('=')) {
      text = text.replace(/(\d+)\s*-\s*(\d+)\s*=\s*\?/, '$1 eksi $2 kaç eder?');
    } else if (text.includes('×') && text.includes('=')) {
      text = text.replace(/(\d+)\s*×\s*(\d+)\s*=\s*\?/, '$1 kere $2 kaç eder?');
    } else if (text.includes('÷') && text.includes('=')) {
      text = text.replace(/(\d+)\s*÷\s*(\d+)\s*=\s*\?/, '$1 bölü $2 kaç eder?');
    } else if (text.includes(' - ') && text.includes('?')) {
      text = text.replace(/\s*-\s*\?/g, '... Sıradaki sayı kaçtır?').replace(/\s*-\s*/g, ', ');
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

    if (state.currentQuestion.audioKey) {
      audio.playQuestionFile(state.currentQuestion.audioKey, finish);
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
        const imgTag = `<img src="${iconPath}" class="${customClass}" alt="" draggable="false">`;
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
        questionHtml: qData.questionHtml || qData.question.replace(/\n/g, '<br>'),
        options: options,
        correct: qData.correct,
        explanation: qData.explanation,
        category: category,
        audioKey: qData.audioKey || null
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
      const seqLength = (g === 0 || g === 1) ? 3 : 4;
      const sequence = shuffled.slice(0, seqLength);
      const unchosen = shuffled[seqLength];

      const modes = ['ask_second', 'ask_first', 'ask_last', 'ask_not_in_seq'];
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
      } else if (gameType === 'turkish') {
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
          explanation: raw.exp,
          audioKey: raw.audioKey || null
        }, g === 0 ? '🦁 Hayvanlar & Doğa' : '📚 Türkçe & Dikkat Avcısı');
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
        const raw = this.generateSpeedReflexQuestion(g);
        return this.buildQuestionItem(raw, '⚡ Şimşek Refleks');
      } else {
        const raw = this.generateGrade1Math();
        return this.buildQuestionItem(raw, '📐 Matematik Düellosu');
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

    // Lobi Elemanları
    lobbyP1Name: document.getElementById('lobbyPlayer1Name'),
    lobbyP2Name: document.getElementById('lobbyPlayer2Name'),
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

    // Düello: Oyuncu 1 (Mavi)
    p1Panel: document.getElementById('playerPanel1'),
    duelP1Avatar: document.getElementById('duelP1Avatar'),
    duelP1TeamTitle: document.getElementById('duelP1TeamTitle'),
    duelP1Name: document.getElementById('duelP1Name'),
    p1ScoreBadge: document.getElementById('p1ScoreBadge'),
    p1StarsTrack: document.getElementById('p1StarsTrack'),
    p1QuestionCard: document.getElementById('p1QuestionCard'),
    p1QuestionCategory: document.getElementById('p1QuestionCategory'),
    p1QuestionText: document.getElementById('p1QuestionText'),
    btnReadAloudP1: document.getElementById('btnReadAloudP1'),
    p1OptionsGrid: document.getElementById('p1OptionsGrid'),
    p1OptA: document.getElementById('p1OptA'),
    p1OptB: document.getElementById('p1OptB'),
    p1OptC: document.getElementById('p1OptC'),
    p1OptTextA: document.getElementById('p1OptTextA'),
    p1OptTextB: document.getElementById('p1OptTextB'),
    p1OptTextC: document.getElementById('p1OptTextC'),
    p1LockOverlay: document.getElementById('p1LockoutOverlay'),
    p1LockoutDesc: document.getElementById('p1LockoutDesc'),
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
    btnReadAloudP2: document.getElementById('btnReadAloudP2'),
    p2OptionsGrid: document.getElementById('p2OptionsGrid'),
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
     9. SINIF, ALT KATEGORİ VE OYUN KATALOĞU (DİNAMİK LOBİ SİSTEMİ)
     ========================================================================== */

  // 1. Her Sınıf Seviyesine Özel Alt Kategori Sekmeleri (Pills/Tabs)
  const SUBCATEGORIES_CONFIG = {
    // Anasınıfı
    0: [
      { id: 'all', label: '🌟 Tümü' },
      { id: 'concept', label: '🎨 Renk & Şekil' },
      { id: 'visual', label: '👀 Görsel Dikkat' },
      { id: 'reflex', label: '⚡ Neşeli Refleks' }
    ],
    // 1. Sınıf
    1: [
      { id: 'all', label: '🌟 Tümü' },
      { id: 'math', label: '🧮 Neşeli Matematik' },
      { id: 'reading', label: '📚 Kelime Avı' },
      { id: 'memory', label: '🧠 Süper Hafıza' },
      { id: 'reflex', label: '⚡ Şimşek Refleks' }
    ],
    // 2. Sınıf
    2: [
      { id: 'all', label: '🌟 Tümü' },
      { id: 'math', label: '🧮 2 Basamak Matematik' },
      { id: 'reading', label: '📚 Sözcük Düellosu' },
      { id: 'memory', label: '🧠 Süper Hafıza' },
      { id: 'reflex', label: '⚡ Şimşek Refleks' }
    ],
    // 3. Sınıf
    3: [
      { id: 'all', label: '🌟 Tümü' },
      { id: 'math', label: '➗ Çarpım & 4 İşlem' },
      { id: 'turkish', label: '📖 Türkçe Avcısı' },
      { id: 'science', label: '🌍 Fen & Keşif' },
      { id: 'brain', label: '🧠 Zeka & Refleks' }
    ],
    // 4. Sınıf
    4: [
      { id: 'all', label: '🌟 Tümü' },
      { id: 'math', label: '➗ Hızlı 4 İşlem' },
      { id: 'turkish', label: '📖 Deyimler & Kültür' },
      { id: 'science', label: '🌍 Fen & Keşif' },
      { id: 'brain', label: '🧠 Zeka & Refleks' }
    ]
  };

  // 2. Zengin Oyun Kataloğu (6 Oyun x 5 Sınıf Düzeyi = %100 Dinamik)
  const GAMES_CATALOG = [
    {
      id: 'math',
      themeClass: 'math-theme',
      tagClass: 'math-tag',
      categoryMapping: (grade) => {
        if (grade === 0) return ['all', 'concept'];
        return ['all', 'math'];
      },
      gradeContent: {
        0: {
          title: 'Renkler, Şekiller & Sayma',
          icon: '🎨',
          badge: '🎨 Renk & Şekil',
          featureTag: '⭐ Görsel Keşif',
          description: 'Meyveleri ve parlayan yıldızları say, doğru cevaba ilk sen dokun! 🍎⭐',
          tags: ['🍎 1-5 Sayma', '🎨 Canlı Renkler', '⭐ Şekil Avı'],
          btnText: 'Düelloyu Başlat'
        },
        1: {
          title: 'Kafa Kafaya Matematik',
          icon: '🧮',
          badge: '🌱 Hızlı Toplama',
          featureTag: '⚡ Hızlı İşlem',
          description: 'Hızlıca topla, ritmik say, puanları roket gibi kap! 🚀',
          tags: ['➕ Toplama & Çıkarma', '🔢 Ritmik Sayma', '🎯 Eksik Sayı'],
          btnText: 'Düelloyu Başlat'
        },
        2: {
          title: 'Kafa Kafaya Matematik',
          icon: '🧮',
          badge: '🚀 2 Basamaklı İşlem',
          featureTag: '⚡ Hızlı İşlem',
          description: 'İki basamaklı çılgın işlemler ve deste-düzine avı! ⚡',
          tags: ['⚡ 2 Basamak', '📦 Deste & Düzine', '➕ Eldeli Toplama'],
          btnText: 'Düelloyu Başlat'
        },
        3: {
          title: 'Kafa Kafaya Matematik',
          icon: '🧮',
          badge: '⚡ Çarpım Tablosu',
          featureTag: '🌪️ Fırtına Hesap',
          description: 'Çarpım tablosu fırtınası! Kim daha hızlı hesaplayacak? 🌪️',
          tags: ['🌪️ Çarpım Tablosu', '➗ Hızlı Bölme', '📐 Basamak Değeri'],
          btnText: 'Düelloyu Başlat'
        },
        4: {
          title: 'Kafa Kafaya Matematik',
          icon: '🧮',
          badge: '👑 4 İşlem Ustası',
          featureTag: '👑 Usta Hesap',
          description: '4 işlem fırtınası! Kesirleri ve açıları saliseler içinde fethet! 👑',
          tags: ['👑 Hızlı 4 İşlem', '🍕 Kesirler', '📐 Açı Türleri'],
          btnText: 'Düelloyu Başlat'
        }
      }
    },
    {
      id: 'turkish',
      themeClass: 'turkish-theme',
      tagClass: 'turkish-tag',
      categoryMapping: (grade) => {
        if (grade === 0) return ['all', 'visual'];
        if (grade === 1 || grade === 2) return ['all', 'reading'];
        return ['all', 'turkish', 'science'];
      },
      gradeContent: {
        0: {
          title: 'Sevimli Hayvanlar & Doğa',
          icon: '🦁',
          badge: '🦁 Doğa Kahramanları',
          featureTag: '🐾 Sevimli Dostlar',
          description: 'Miyavlayan dostlarımız ve doğa kahramanlarıyla tanış! 🐾',
          tags: ['🐾 Hayvan Sesleri', '🐘 Büyük-Küçük', '🌿 Doğa Sevgisi'],
          btnText: 'Düelloyu Başlat'
        },
        1: {
          title: 'Hızlı Türkçe & Kelime Avı',
          icon: '🦉',
          badge: '🌱 Harf & Hece',
          featureTag: '🔍 Kelime Avı',
          description: 'Zıt kavramları yakala, heceleri jet gibi tamamla! 🦉',
          tags: ['🔄 Zıt Anlam', '🔤 Ünlü Harfler', '📖 Hece Sayısı'],
          btnText: 'Düelloyu Başlat'
        },
        2: {
          title: 'Hızlı Türkçe & Sözcük Düellosu',
          icon: '🦉',
          badge: '🚀 Eş ve Zıt Anlam',
          featureTag: '🔍 Sözcük Avı',
          description: 'Eş ve zıt anlamlı sözcük düellosu! Hızlı olan kazanır! 🎯',
          tags: ['✨ Eş Anlamlılar', '🔄 Zıt Anlamlılar', '✏️ Yazım Kuralları'],
          btnText: 'Düelloyu Başlat'
        },
        3: {
          title: 'Hızlı Türkçe & Bilgi Avcısı',
          icon: '🦉',
          badge: '⚡ Eş Sesli & Bilgi',
          featureTag: '🌟 Keşif Zamanı',
          description: 'Eş sesli kelimeler ve eğlenceli Fen gerçekleri! 🌟',
          tags: ['🎭 Eş Sesliler', '🌍 Fen Gerçekleri', '✍️ Noktalama'],
          btnText: 'Düelloyu Başlat'
        },
        4: {
          title: 'Hızlı Türkçe & Genel Kültür',
          icon: '🦉',
          badge: '👑 Deyim & Kültür',
          featureTag: '🏆 Deyim Ustası',
          description: 'Zengin deyimler ve atasözleri labirentinde kelime ustası ol! 🏆',
          tags: ['🏆 Zengin Deyimler', '📜 Atasözleri', '🗺️ Sosyal Bilgiler'],
          btnText: 'Düelloyu Başlat'
        }
      }
    },
    {
      id: 'oddone',
      themeClass: 'oddone-theme',
      tagClass: 'oddone-tag',
      categoryMapping: (grade) => {
        if (grade === 0) return ['all', 'visual'];
        if (grade === 1 || grade === 2) return ['all', 'memory'];
        return ['all', 'brain'];
      },
      gradeContent: {
        0: {
          title: 'Farklı Olanı Yakala',
          icon: '👀',
          badge: '👀 Görsel Dikkat',
          featureTag: '👀 Keskin Gözler',
          description: 'Meyve ve hayvanlar arasında saklanan yabancıyı ilk sen bul! 🥑',
          tags: ['🥑 Tatlı Meyveler', '👀 Görsel Dikkat', '⚡ Hızlı Bul'],
          btnText: 'Düelloyu Başlat'
        },
        1: {
          title: 'Farklı Olanı Yakala',
          icon: '👀',
          badge: '🌱 Gözlem & Odak',
          featureTag: '🔍 Dedektif Gözler',
          description: 'Gözünü dört aç! Benzer emojiler arasındaki tek farkı anında yakala! 🔍',
          tags: ['🔍 Benzer Emojiler', '🎯 İnce Farklar', '⚡ Hızlı Gözlem'],
          btnText: 'Düelloyu Başlat'
        },
        2: {
          title: 'Farklı Olanı Yakala',
          icon: '👀',
          badge: '🚀 Gözlem Gücü',
          featureTag: '⚡ Hızlı Tarama',
          description: '9 emoji arasından gizlice saklanan yabancı sembolü avla! ⚡',
          tags: ['⚡ 9\'lu Dizi', '👀 Keskin Gözler', '⏱️ Hızlı Tepki'],
          btnText: 'Düelloyu Başlat'
        },
        3: {
          title: 'Farklı Olanı Yakala',
          icon: '👀',
          badge: '⚡ Görsel Zeka',
          featureTag: '🎯 Şahin Bakışı',
          description: 'Birbirine benzeyen geometrik şekillerdeki minik farkı ilk gören puanı kapar! 🎯',
          tags: ['🎯 Detay Avcılığı', '🧠 Görsel Zeka', '🔍 Hızlı Tarama'],
          btnText: 'Düelloyu Başlat'
        },
        4: {
          title: 'Farklı Olanı Yakala',
          icon: '👀',
          badge: '👑 Usta Dedektif',
          featureTag: '🕵️ Usta Dedektif',
          description: '12 sembol labirentindeki gizli detayı saliseler içinde yakala! 🕵️',
          tags: ['🕵️ Usta Dedektif', '⚡ Saliselik Fark', '🧩 Zorlu Labirent'],
          btnText: 'Düelloyu Başlat'
        }
      }
    },
    {
      id: 'stroop',
      themeClass: 'stroop-theme',
      tagClass: 'stroop-tag',
      categoryMapping: (grade) => {
        if (grade === 0) return ['all', 'concept'];
        if (grade === 1 || grade === 2) return ['all', 'reflex'];
        return ['all', 'brain'];
      },
      gradeContent: {
        0: {
          title: 'Renk & Şekil Eşleştirme',
          icon: '🎯',
          badge: '🎨 Renk Düellosu',
          featureTag: '🎨 Canlı Renkler',
          description: 'Cıvıl cıvıl renkleri tanı, şekilleri doğru eşleştir ve eğlen! 🎨',
          tags: ['🎨 Canlı Renkler', '👀 Görsel Algı', '🐘 Büyük-Küçük'],
          btnText: 'Düelloyu Başlat'
        },
        1: {
          title: 'Göz ve Renk Düellosu',
          icon: '🎯',
          badge: '🌱 Renk & Dikkat',
          featureTag: '🎯 Hızlı Seçim',
          description: 'Gözlerin mi daha hızlı yoksa aklın mı? Rengine göre bas! 🎯',
          tags: ['🎯 Renk Eşleştirme', '⚡ Hızlı Seçim', '🌈 Renkler'],
          btnText: 'Düelloyu Başlat'
        },
        2: {
          title: 'Renk Tuzakları (Stroop)',
          icon: '🎯',
          badge: '🚀 Stroop Testi',
          featureTag: '🧠 Beyin Fırtınası',
          description: 'Dikkat tuzak! Renge aldanma, kelimenin gerçek rengini bil! 🧠',
          tags: ['🧠 Renk Tuzağı', '⚡ Beyin Jimnastiği', '🎯 Odaklanma'],
          btnText: 'Düelloyu Başlat'
        },
        3: {
          title: 'Renk Tuzakları (Stroop)',
          icon: '🎯',
          badge: '⚡ Beyin Jimnastiği',
          featureTag: '⚡ Ters Köşe',
          description: 'Ters köşe kelimeler! Zihnini şaşırtmaya çalışan tuzağı aş! ⚡',
          tags: ['⚡ Ters Köşe', '🎯 Konsantrasyon', '🧠 Görsel Odak'],
          btnText: 'Düelloyu Başlat'
        },
        4: {
          title: 'Süper Stroop: Renk Tuzakları',
          icon: '🎯',
          badge: '👑 Nöro-Dikkat',
          featureTag: '👑 Nöro-Hız',
          description: 'Usta seviye Stroop düellosu! Şampiyon refleksle ters köşeyi çöz! 👑',
          tags: ['👑 İleri Stroop', '⚡ Saliselik Karar', '🧠 Zihinsel Çeviklik'],
          btnText: 'Düelloyu Başlat'
        }
      }
    },
    {
      id: 'memory',
      themeClass: 'memory-theme',
      tagClass: 'memory-tag',
      categoryMapping: (grade) => {
        if (grade === 0) return ['all', 'reflex'];
        if (grade === 1 || grade === 2) return ['all', 'memory'];
        return ['all', 'brain'];
      },
      gradeContent: {
        0: {
          title: 'Sevimli Hafıza Düellosu',
          icon: '🧠',
          badge: '🎈 Görsel Hafıza',
          featureTag: '🎈 Neşeli Zihin',
          description: 'Ekranda parlayan 3 sevimli nesneyi aklında tut, sırayı bil! 🎈',
          tags: ['🎈 3 Nesne Sırası', '🧠 Görsel Hatırlama', '⭐ Hafıza'],
          btnText: 'Düelloyu Başlat'
        },
        1: {
          title: 'Süper Hafıza: Sırayı Hatırla',
          icon: '🧠',
          badge: '🌱 Sıralı Hafıza',
          featureTag: '🧠 Zihin Belleği',
          description: 'Sırayı aklına kazı! İlk hangisi çıktı, kim kayboldu? 🧠',
          tags: ['🧠 Sıralama Belleği', '👀 Görsel Dikkat', '⚡ Hızlı Hatırla'],
          btnText: 'Düelloyu Başlat'
        },
        2: {
          title: 'Süper Hafıza: Sırayı Hatırla',
          icon: '🧠',
          badge: '🚀 Sıralı Hafıza',
          featureTag: '⚡ Hızlı Hatırla',
          description: 'Sembolleri hızlıca tara! Sorulan sembolü ilk dokunan bulsun! 🚀',
          tags: ['🚀 3-4 Sembol', '⚡ Hızlı Kodlama', '🧠 Canlandırma'],
          btnText: 'Düelloyu Başlat'
        },
        3: {
          title: 'Süper Hafıza: Sırayı Hatırla',
          icon: '🧠',
          badge: '⚡ Şampiyon Bellek',
          featureTag: '⭐ Şampiyon Bellek',
          description: '4\'lü sembol sırasını zihninde canlandır ve puanı kap! ⭐',
          tags: ['⭐ 4\'lü Dizi', '🧠 Detaylı Hatırlama', '⚡ Hızlı Çağırma'],
          btnText: 'Düelloyu Başlat'
        },
        4: {
          title: 'Usta Hafıza: Sırayı Hatırla',
          icon: '🧠',
          badge: '👑 Fotoğrafik Hafıza',
          featureTag: '👑 Fotoğrafik Hafıza',
          description: 'Fotoğrafik hafıza meydan okuması! Sıraları bil, tahtanın kralı ol! 👑',
          tags: ['👑 Fotoğrafik Bellek', '🔍 Sıra Analizi', '⚡ Süper Konsantrasyon'],
          btnText: 'Düelloyu Başlat'
        }
      }
    },
    {
      id: 'reflex',
      themeClass: 'reflex-theme',
      tagClass: 'reflex-tag',
      categoryMapping: (grade) => {
        if (grade === 0) return ['all', 'reflex'];
        if (grade === 1 || grade === 2) return ['all', 'reflex'];
        return ['all', 'brain'];
      },
      gradeContent: {
        0: {
          title: 'Neşeli Refleks & Balon Avı',
          icon: '⚡',
          badge: '🎈 Hızlı Dokun',
          featureTag: '⚡ Hızlı Dokun',
          description: 'Balon belirdiğinde ekrana ilk dokunan ol, kaktüsten kaç! 🎈',
          tags: ['🎈 Balon Avı', '⚡ Hızlı Dokun', '🌵 Kaktüsten Kaç'],
          btnText: 'Düelloyu Başlat'
        },
        1: {
          title: 'Şimşek Refleks: Hedef Avı',
          icon: '⚡',
          badge: '🌱 Saf Hız',
          featureTag: '⚡ Şimşek Hız',
          description: 'Yıldıza bas (⭐), bombadan kaç (💣)! Yanlış basan kilitlenir! ⚡',
          tags: ['⭐ Yıldız Avı', '💣 Bombadan Kaç', '⚡ Şimşek Hız'],
          btnText: 'Düelloyu Başlat'
        },
        2: {
          title: 'Şimşek Refleks: Hedef Avı',
          icon: '⚡',
          badge: '🚀 Hızlı Tepki',
          featureTag: '🚀 Saliselik Tepki',
          description: 'Saf hız ve konsantrasyon! Hedefi ilk yakalayan puanı kapar! 🚀',
          tags: ['🚀 Saliselik Tepki', '⚡ Hızlı Dokunuş', '🔒 Kilit Cezası'],
          btnText: 'Düelloyu Başlat'
        },
        3: {
          title: 'Şimşek Refleks: Köstebek & Av',
          icon: '⚡',
          badge: '⚡ Süper Hız',
          featureTag: '🎯 Keskin Refleks',
          description: 'Hedef çıktığı an rekor hızla dokun! Sahte bombalara asla basma! ⚡',
          tags: ['⚡ Köstebek Avı', '🎯 Seçici Dikkat', '⚡ Hızlı Refleks'],
          btnText: 'Düelloyu Başlat'
        },
        4: {
          title: 'Şimşek Refleks: Köstebek & Av',
          icon: '⚡',
          badge: '👑 Şimşek Hızı',
          featureTag: '🏆 Zirve Refleks',
          description: 'Tahtanın en hızlısı kim? Saliseler içinde hedefi avla, zaferi kazan! 🏆',
          tags: ['🏆 Zirve Refleks', '⭐ Sıfır Hata', '👑 Tahta Rekoru'],
          btnText: 'Düelloyu Başlat'
        }
      }
    }
  ];

  // Alt Kategori Sekmelerini (Pills/Tabs) Üret
  function renderSubcategories() {
    if (!DOM.subcategoryTabs) return;
    const g = state.currentGrade;
    const cats = SUBCATEGORIES_CONFIG[g] || SUBCATEGORIES_CONFIG[1];

    // Aktif kategori bu sınıfta yoksa 'all' yap
    const exists = cats.some(c => c.id === state.currentCategory);
    if (!exists) {
      state.currentCategory = 'all';
    }

    DOM.subcategoryTabs.innerHTML = cats.map(c => `
      <button class="subcat-pill ${c.id === state.currentCategory ? 'active' : ''}" data-cat-id="${c.id}">
        ${replaceEmojisWith3D(c.label, 'chip-3d-icon')}
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

  // Dinamik Oyun Kartlarını (Grid) Üret
  function renderGameCards() {
    if (!DOM.gamesGrid) return;
    const g = state.currentGrade;
    const currentCat = state.currentCategory;

    // Filtreleme
    const filtered = GAMES_CATALOG.filter(game => {
      const cats = game.categoryMapping(g);
      if (currentCat === 'all') return true;
      return cats.includes(currentCat);
    });

    // Sayaç Rozetini Güncelle
    if (DOM.gamesCountBadge) {
      DOM.gamesCountBadge.textContent = `${filtered.length} Oyun Gösteriliyor`;
    }

    // Kart HTML'lerini oluştur
    DOM.gamesGrid.innerHTML = filtered.map(game => {
      const content = game.gradeContent[g] || game.gradeContent[1];
      return `
        <div class="game-card ${game.themeClass}" data-game-id="${game.id}">
          <div class="game-top-meta">
            <span class="game-category-tag ${game.tagClass}">${replaceEmojisWith3D(content.badge, 'chip-3d-icon')}</span>
            <span class="game-speed-badge">${replaceEmojisWith3D(content.featureTag, 'chip-3d-icon')}</span>
          </div>
          <div class="game-visual-icon">${replaceEmojisWith3D(content.icon, 'game-3d-big-icon')}</div>
          <h3 class="game-title">${content.title}</h3>
          <p class="game-subtitle">${content.description}</p>
          <div class="game-features-list">
            ${content.tags.map(t => `<span class="feature-pill">${replaceEmojisWith3D(t, 'chip-3d-icon')}</span>`).join('')}
          </div>
          <button class="btn-play-game" data-game-id="${game.id}">
            🎮 ${state.gameMode === 'solo' ? 'Pratiğe Başla' : content.btnText}
          </button>
        </div>
      `;
    }).join('');

    // Kartlara ve Butonlara Tıklama / Dokunma Dinleyicisi
    DOM.gamesGrid.querySelectorAll('.game-card').forEach(card => {
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

  function setGrade(gradeNumber) {
    state.currentGrade = parseInt(gradeNumber, 10);
    audio.playClick();

    // Çip butonları güncelle (Header)
    DOM.gradeChips.forEach(chip => {
      const g = parseInt(chip.getAttribute('data-grade'), 10);
      chip.classList.toggle('active', g === state.currentGrade);
    });

    // Lobi kartlarını güncelle
    DOM.gradeCards.forEach(card => {
      const g = parseInt(card.getAttribute('data-grade'), 10);
      card.classList.toggle('active', g === state.currentGrade);
    });

    // Dinamik alt kategorileri ve oyun kartlarını sınıfa göre baştan üret
    renderSubcategories();
    renderGameCards();
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
     14. DÜELLO & TEK KİŞİLİK PRATİK OYUN AKIŞI & MEKANİĞİ
     ========================================================================== */
  function startDuel(gameType) {
    state.currentGameType = gameType;
    state.player1.score = 0;
    state.player2.score = 0;
    state.player1.isLocked = false;
    state.player2.isLocked = false;
    state.questionNumber = 1;

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
    DOM.duelGradeBadge.innerHTML = replaceEmojisWith3D(gradeLabels[state.currentGrade] || `${state.currentGrade}. Sınıf`, 'chip-3d-icon');

    const gameTypeBadges = {
      math: state.currentGrade === 0 ? '🎨 Renkler & Sayma' : (isSolo ? '📐 Matematik Pratiği' : '📐 Matematik Düellosu'),
      turkish: state.currentGrade === 0 ? '🦁 Hayvanlar & Doğa' : '📚 Türkçe & Dikkat',
      oddone: '👀 Farklı Olanı Yakala',
      stroop: '🎯 Renk Tuzakları (Stroop)',
      memory: '🧠 Süper Hafıza',
      reflex: '⚡ Şimşek Refleks'
    };
    DOM.duelGameTypeBadge.innerHTML = replaceEmojisWith3D(gameTypeBadges[gameType] || (isSolo ? '🎯 Bireysel Pratik' : '🎯 Sınıf Düellosu'), 'chip-3d-icon');
    updateGameModeUI();
    updatePlayerNamesUI();
    renderScoreTrack();

    // Lobi -> Düello Görünümüne Geçiş
    DOM.viewLobby.classList.remove('active');
    DOM.viewDuel.classList.add('active');
    state.currentView = 'duel';

    audio.playCorrect();
    if (!isSolo) {
      audio.playAnnouncerStart();
    }
    updateAnnouncerUI();
    loadNextQuestion();
  }

  function exitDuel() {
    const exitMsg = (state.gameMode === 'solo')
      ? 'Pratiği sonlandırıp lobiye dönmek istiyor musunuz?'
      : 'Düelloyu sonlandırıp lobiye dönmek istiyor musunuz?';
    if (confirm(exitMsg)) {
      audio.stopQuestionAudio();
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
      star.innerHTML = `<img src="assets/icons/3d/star.png" style="width:28px; height:28px; object-fit:contain; vertical-align:middle; pointer-events:none;" alt="⭐">`;
      container.appendChild(star);
    }
  }

  function loadNextQuestion() {
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
    DOM.p1OptTextA.innerHTML = replaceEmojisWith3D(state.currentQuestion.options[0], 'opt-3d-icon');
    DOM.p1OptTextB.innerHTML = replaceEmojisWith3D(state.currentQuestion.options[1], 'opt-3d-icon');
    DOM.p1OptTextC.innerHTML = replaceEmojisWith3D(state.currentQuestion.options[2], 'opt-3d-icon');

    // Kırmızı Tarafına Bas (Tamamen Simetrik)
    DOM.p2QuestionCategory.innerHTML = replaceEmojisWith3D(state.currentQuestion.category, 'chip-3d-icon');
    DOM.p2QuestionText.innerHTML = state.currentQuestion.questionHtml || replaceEmojisWith3D(state.currentQuestion.question, 'q-3d-item');
    DOM.p2OptTextA.innerHTML = replaceEmojisWith3D(state.currentQuestion.options[0], 'opt-3d-icon');
    DOM.p2OptTextB.innerHTML = replaceEmojisWith3D(state.currentQuestion.options[1], 'opt-3d-icon');
    DOM.p2OptTextC.innerHTML = replaceEmojisWith3D(state.currentQuestion.options[2], 'opt-3d-icon');

    // Buton stillerini sıfırla
    [DOM.p1OptA, DOM.p1OptB, DOM.p1OptC, DOM.p2OptA, DOM.p2OptB, DOM.p2OptC].forEach(btn => {
      btn.className = 'duel-option-btn';
      btn.disabled = false;
    });

    DOM.p1Panel.classList.remove('winner-glow');
    DOM.p2Panel.classList.remove('winner-glow');
    DOM.p1WinToast.classList.add('hide');
    DOM.p2WinToast.classList.add('hide');

    // Otomatik Soru Sesli Okuma (Edge-TTS Stüdyo & Web Speech)
    if (state.autoReadQuestion && state.soundEnabled) {
      const readDelay = (state.questionNumber === 1 && state.announcerEnabled) ? 1900 : 400;
      setTimeout(() => {
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
        if (state.gameMode !== 'solo' && state.player1.score < state.targetScore) {
          setTimeout(() => audio.playAnnouncerBluePoint(), 180);
        }
      } else {
        state.player2.score += 1;
        DOM.p2Panel.classList.add('winner-glow');
        DOM.p2WinToast.classList.remove('hide');
        highlightCorrectOption(DOM.p2OptionsGrid, optionIndex);
        if (state.player2.score < state.targetScore) {
          setTimeout(() => audio.playAnnouncerRedPoint(), 180);
        }
      }

      renderScoreTrack();

      // Pedagojik Çözümü Göster
      DOM.solutionText.innerHTML = replaceEmojisWith3D(state.currentQuestion.explanation, 'inline-3d-icon');
      if (state.showAutoExplanation) {
        DOM.solutionPopup.classList.remove('hide');
      }

      // Hedef puana ulaşıldı mı kontrol et
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
      if (state.gameMode === 'solo') {
        buttons[optionIndex].disabled = true;
      }
    }

    if (isP1) state.player1.isLocked = true;
    else state.player2.isLocked = true;

    // Sesli uyarı: Bomba mı yoksa standart kilitlenme mi?
    const chosenOpt = (state.currentQuestion && state.currentQuestion.options) ? state.currentQuestion.options[optionIndex] : '';
    if (chosenOpt && chosenOpt.includes('BOMBA')) {
      audio.playAnnouncerBomb();
    } else {
      audio.playAnnouncerLockout();
    }

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
    if (!isSolo) {
      setTimeout(() => {
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
    updateAnnouncerUI();
    updateAutoReadUI();
    updateTeacherAuthUI();
    updateGameModeUI();
    updatePlayerNamesUI();
    renderSubcategories();
    renderGameCards();

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

  // DOM hazır olduğunda başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
