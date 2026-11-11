/**
 * ==========================================================================
 * DERSE Bİ' MOLA - BAĞIMSIZ HİKAYE & BİLMECE ATÖLYESİ (story_workshop.js)
 * app.js ve mevcut oyun motorlarından tamamen bağımsız çalışır.
 * ==========================================================================
 */
(function () {
  'use strict';

  const MODAL_ID = 'moli-story-modal';
  const STYLE_ID = 'moli-story-workshop-styles';

  const WORD_CARDS = [
    {
      id: 'kedi',
      word: 'Kedi',
      emoji: '🐱',
      bg: '#FFF7ED',
      border: '#FDBA74',
      riddleLines: [
        'Bıyıkları uzundur, mırıl mırıl ses çıkarır,',
        'Pamuk gibi patisiyle her oyuna hemen katılır.'
      ]
    },
    {
      id: 'moli',
      word: 'Robot Moli',
      emoji: '🤖',
      bg: '#EFF6FF',
      border: '#93C5FD',
      riddleLines: [
        'Mavi gözlü robot dostum, anteninde yıldız parlar,',
        'Bilgi dolu sorularda bütün sınıfı neşe sarar.'
      ]
    },
    {
      id: 'orman',
      word: 'Orman',
      emoji: '🌲',
      bg: '#ECFDF5',
      border: '#6EE7B7',
      riddleLines: [
        'Yüzlerce yeşil ağacı gökyüzüne doğru uzanır,',
        'Kuşlar dallarında öter, rüzgar yaprakta uyanır.'
      ]
    },
    {
      id: 'uzay',
      word: 'Uzay',
      emoji: '🚀',
      bg: '#F5F3FF',
      border: '#C4B5FD',
      riddleLines: [
        'Milyonlarca yıldız parlar, gezegenler sessiz döner,',
        'Roketlerle yol alınır, karanlıkta ışıklar söner.'
      ]
    },
    {
      id: 'anahtar',
      word: 'Altın Anahtar',
      emoji: '🗝️',
      bg: '#FEFCE8',
      border: '#FDE047',
      riddleLines: [
        'Sapsarıdır, ışıl ışıl, kilitleri hemen açar,',
        'Gizli sandık açılınca etrafına neşe saçar.'
      ]
    },
    {
      id: 'balon',
      word: 'Uçan Balon',
      emoji: '🎈',
      bg: '#FFF1F2',
      border: '#FDA4AF',
      riddleLines: [
        'Renk renktir, hafifçedir, gökyüzüne süzülür,',
        'İpini sıkı tutmazsan bulutlara doğru üzülür.'
      ]
    },
    {
      id: 'dinozor',
      word: 'Sevimli Dinozor',
      emoji: '🦖',
      bg: '#F0FDF4',
      border: '#86EFAC',
      riddleLines: [
        'Çok eski çağlardan gelir, kocaman ama pek şirin,',
        'Ayak izi dev olsa da kalbi yumuşaktır derin.'
      ]
    },
    {
      id: 'sato',
      word: 'Bulut Şatosu',
      emoji: '🏰',
      bg: '#F0F9FF',
      border: '#7DD3FC',
      riddleLines: [
        'Pamuk beyaz kuleleri gökyüzünde yükselir,',
        'Masallara kapı açar, rüyalardan seslenir.'
      ]
    },
    {
      id: 'kelebek',
      word: 'Renkli Kelebek',
      emoji: '🦋',
      bg: '#FDF4FF',
      border: '#F0ABFC',
      riddleLines: [
        'İncecik iki kanatta gökkuşağı renkleri var,',
        'Çiçekten çiçeğe konar, bahar gelince uçar.'
      ]
    },
    {
      id: 'harita',
      word: 'Gizli Harita',
      emoji: '🧭',
      bg: '#FFFBEB',
      border: '#FCD34D',
      riddleLines: [
        'Üzerinde yollar çizili, çarpı işareti saklar,',
        'Defineyi bulmak için ipucunu tek tek aktar.'
      ]
    },
    {
      id: 'yunus',
      word: 'Neşeli Yunus',
      emoji: '🐬',
      bg: '#ECFEFF',
      border: '#67E8F9',
      riddleLines: [
        'Masmavi dalgalar içinde zıplar durur neşeyle,',
        'Gülümseyen yüzüyle selam verir herkese böyle.'
      ]
    },
    {
      id: 'yildiz',
      word: 'Parlayan Yıldız',
      emoji: '⭐',
      bg: '#FEF9C3',
      border: '#FACC15',
      riddleLines: [
        'Gece olunca gökyüzünde tek tek göz kırpar bize,',
        'Işıl ışıl parıltısıyla yol gösterir gecemize.'
      ]
    }
  ];

  const STORY_TEMPLATES = [
    {
      title: (w1, w2, w3) => `✨ ${w1} ve ${w3} Macerası`,
      build: (w1, w2, w3) =>
        `Güneşli bir sabah ${w1} neşeyle uyanıp pencereden dışarı baktı. Bahçede karşısına birden ${w2} çıktı ve ikisi gülüşerek yeni bir oyun başlattı. Çok geçmeden çimenlerin arasında parlayan bir ${w3} buldular! Gün boyu ${w1}, ${w2} ve ${w3} sayesinde unutulmaz bir macera yaşayıp eve mutlu döndüler.`
    },
    {
      title: (w1, w2, w3) => `🌟 ${w2} Yolculuğu`,
      build: (w1, w2, w3) =>
        `Bir varmış bir yokmuş, meraklı ${w1} bir gün büyük bir keşfe çıkmaya karar vermiş. Yol boyunca karşısına çıkan ${w2} ona tatlı bir gülümsemeyle eşlik etmiş. Tam dinlenirken ikisinin de aradığı ${w3} birden karşılarında belirmiş! O gün ${w1} ile ${w2}, paylaşmanın en güzel hazine olduğunu anlamış.`
    },
    {
      title: (w1, w2, w3) => `🎈 ${w1} ile ${w2} Dostluğu`,
      build: (w1, w2, w3) =>
        `Okulun en neşeli kahramanı ${w1}, teneffüste sıra arkadaşı ${w2} ile harika bir plan yaptı. Masanın üzerinde duran ${w3} ile tüm arkadaşlarını şaşırtacak eğlenceli bir gösteri hazırladılar. Bütün sınıf alkışlarla bu oyuna katılınca etraf kahkahalarla doldu. ${w1}, ${w2} ve ${w3} bir araya gelince her mola şenliğe dönüştü!`
    },
    {
      title: (w1, w2, w3) => `🧭 ${w3} Sırrı`,
      build: (w1, w2, w3) =>
        `Rüzgarlı bir öğleden sonra ${w1}, defterinin arasında küçük ve renkli bir not buldu. Notta "Eğer ${w2} ile el ele verirseniz, sizi harika bir ${w3} bekliyor!" yazıyordu. Hemen yola koyulan ${w1} ve ${w2}, bilmeceleri tek tek çözerek hedefe ulaştı. Birlikte düşününce en zor görünen yollar bile neşeli bir oyuna dönüştü!`
    },
    {
      title: (w1, w2, w3) => `🌙 Yıldızlı ${w1} Masalı`,
      build: (w1, w2, w3) =>
        `Ay ışığının parladığı sakin bir akşamda ${w1}, tatlı rüyalar diyarına doğru hayaller kurmaya başladı. Tam o sırada ${w2} kapıyı çalıp yanına geldi ve birlikte ${w3} etrafında ışıl ışıl bir oyun oynadılar. Gökyüzündeki yıldızlar bile bu sevimli dostluğu izleyip gülümsedi. ${w1} ile ${w2}, yarınki yeni maceralar için huzurla dinlendi.`
    },
    {
      title: (w1, w2, w3) => `🏆 En Güzel Takım: ${w1} & ${w2}`,
      build: (w1, w2, w3) =>
        `Büyük sınıf şenliği başlamak üzereydi ama sahnedeki ${w3} bir türlü yerine yerleşmiyordu. Hemen yardıma koşan ${w1} ve ${w2}, fikirlerini birleştirerek akıllıca bir çözüm buldu. Kısa sürede ${w3} parlamaya başladı ve tüm öğrenciler onları coşkuyla alkışladı. Çünkü iş birliği yapan ${w1} ile ${w2} için hiçbir iş zor değildi!`
    }
  ];

  const RIDDLE_INTROS = [
    (a, b) => `${a} ile ${b} fısıldaşır yan yana,`,
    (a, b) => `${a} sormuş ${b} dinlemiş merakla,`,
    (a, b) => `${a} ve ${b} saklamış bir sır oyunda,`
  ];

  const RIDDLE_OUTROS = [
    'Bil bakalım bu gizli şey nedir bana?',
    'Hadi düşün, bu bilmecenin cevabı nedir?',
    'Tahmin et bakalım, saklanan kelime hangisidir?'
  ];

  const workshopState = {
    activeTab: 'story', // 'story' | 'riddle'
    words: ['Kedi', 'Robot Moli', 'Altın Anahtar'],
    nextSlot: 0,
    lastStoryIdx: -1,
    lastRiddleIdx: -1,
    riddleAnswerCursor: 2,
    currentOutput: null, // { type, title, text, words, riddleAnswer, answerEmoji, answerRevealed }
    isSpeaking: false
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightWordsHtml(text, words) {
    let html = escapeHtml(text);
    const uniqueWords = Array.from(new Set(words.filter(Boolean)))
      .sort((a, b) => b.length - a.length);
    uniqueWords.forEach((word) => {
      const escapedWord = escapeHtml(word);
      const regex = new RegExp(`(${escapeRegExp(escapedWord)})`, 'gi');
      html = html.replace(regex, '<mark class="msw-highlight">$1</mark>');
    });
    return html.replace(/\n/g, '<br>');
  }

  function findPresetCard(word) {
    const clean = String(word || '').trim().toLocaleLowerCase('tr-TR');
    return WORD_CARDS.find((c) => c.word.toLocaleLowerCase('tr-TR') === clean) || null;
  }

  function pickThreeRandomWords() {
    const pool = WORD_CARDS.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i];
      pool[i] = pool[j];
      pool[j] = tmp;
    }
    return pool.slice(0, 3).map((c) => c.word);
  }

  function stopVoicePlayback() {
    workshopState.isSpeaking = false;
    try {
      if (window.MoliVoiceEngine && typeof window.MoliVoiceEngine.stop === 'function') {
        window.MoliVoiceEngine.stop();
      }
    } catch (e) {}
    try {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    } catch (e) {}
    updateSpeakButtonUI();
  }

  function updateSpeakButtonUI() {
    const btn = document.getElementById('moliStorySpeakBtn');
    if (!btn) return;
    btn.classList.toggle('is-speaking', workshopState.isSpeaking);
    btn.innerHTML = workshopState.isSpeaking
      ? '<span aria-hidden="true">⏹️</span> <span>Okumayı Durdur</span>'
      : '<span aria-hidden="true">🔊</span> <span>Sesli Oku</span>';
  }

  function speakCurrentOutput() {
    const out = workshopState.currentOutput;
    if (!out) return;

    if (workshopState.isSpeaking) {
      stopVoicePlayback();
      return;
    }

    const spokenText = out.type === 'riddle'
      ? `${out.text.replace(/\n/g, ' ')}`
      : `${out.title}. ${out.text}`;

    workshopState.isSpeaking = true;
    updateSpeakButtonUI();

    const onDone = () => {
      workshopState.isSpeaking = false;
      updateSpeakButtonUI();
    };

    if (window.MoliVoiceEngine && typeof window.MoliVoiceEngine.speak === 'function') {
      try {
        window.MoliVoiceEngine.speak(spokenText, onDone);
        return;
      } catch (e) {}
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(spokenText);
        utter.lang = 'tr-TR';
        utter.rate = 0.96;
        utter.onend = onDone;
        utter.onerror = onDone;
        window.speechSynthesis.speak(utter);
        return;
      } catch (e) {}
    }

    onDone();
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${MODAL_ID} {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(15, 23, 42, 0.72);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        overflow-y: auto;
        box-sizing: border-box;
      }
      #${MODAL_ID}.is-open {
        display: flex;
      }
      #${MODAL_ID} .msw-dialog {
        width: 100%;
        max-width: 1060px;
        max-height: 94vh;
        overflow-y: auto;
        background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
        border: 3px solid #DDD6FE;
        border-bottom: 6px solid #A78BFA;
        border-radius: 28px;
        box-shadow: 0 24px 70px rgba(15, 23, 42, 0.36);
        padding: 20px 24px 24px;
        box-sizing: border-box;
        font-family: 'Nunito', 'Fredoka', sans-serif;
        color: #0F172A;
        animation: mswPopIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes mswPopIn {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      #${MODAL_ID} .msw-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding-bottom: 14px;
        border-bottom: 2px solid #EDE9FE;
        margin-bottom: 16px;
      }
      #${MODAL_ID} .msw-title-wrap {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }
      #${MODAL_ID} .msw-header-icon {
        width: 48px;
        height: 48px;
        border-radius: 16px;
        background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
        color: #FFFFFF;
        font-size: 1.65rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 6px 16px rgba(109, 40, 217, 0.28);
      }
      #${MODAL_ID} .msw-title {
        margin: 0;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.2rem, 2.2vw, 1.6rem);
        font-weight: 700;
        color: #1E1B4B;
      }
      #${MODAL_ID} .msw-subtitle {
        margin: 2px 0 0;
        font-size: 0.9rem;
        font-weight: 700;
        color: #64748B;
      }
      #${MODAL_ID} .msw-close-btn {
        background: #FEF2F2;
        border: 2px solid #FCA5A5;
        border-bottom: 4px solid #EF4444;
        color: #B91C1C;
        border-radius: 14px;
        padding: 9px 16px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        flex-shrink: 0;
        touch-action: manipulation;
        transition: transform 0.14s ease, background 0.14s ease;
      }
      #${MODAL_ID} .msw-close-btn:hover {
        background: #FEE2E2;
        transform: translateY(-1px);
      }
      #${MODAL_ID} .msw-tabs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 16px;
      }
      #${MODAL_ID} .msw-tab-btn {
        padding: 12px 16px;
        border-radius: 16px;
        border: 2px solid #E2E8F0;
        border-bottom: 4px solid #CBD5E1;
        background: #FFFFFF;
        color: #475569;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(0.95rem, 1.4vw, 1.12rem);
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        touch-action: manipulation;
        transition: all 0.15s ease;
      }
      #${MODAL_ID} .msw-tab-btn.is-active[data-msw-tab="story"] {
        background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
        border-color: #4338CA;
        border-bottom-color: #312E81;
        color: #FFFFFF;
        box-shadow: 0 6px 16px rgba(79, 70, 229, 0.28);
      }
      #${MODAL_ID} .msw-tab-btn.is-active[data-msw-tab="riddle"] {
        background: linear-gradient(135deg, #F59E0B 0%, #EA580C 100%);
        border-color: #D97706;
        border-bottom-color: #9A3412;
        color: #FFFFFF;
        box-shadow: 0 6px 16px rgba(234, 88, 12, 0.28);
      }
      #${MODAL_ID} .msw-section-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
        font-size: 0.92rem;
        font-weight: 800;
        color: #334155;
      }
      #${MODAL_ID} .msw-word-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 10px;
        margin-bottom: 14px;
      }
      #${MODAL_ID} .msw-word-card {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding: 10px 6px;
        border-radius: 16px;
        border: 2px solid #CBD5E1;
        border-bottom: 4px solid #94A3B8;
        background: #FFFFFF;
        cursor: pointer;
        text-align: center;
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
        transition: transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease;
      }
      #${MODAL_ID} .msw-word-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 14px rgba(15, 23, 42, 0.08);
      }
      #${MODAL_ID} .msw-word-card.is-selected {
        border-color: #7C3AED !important;
        border-bottom-color: #5B21B6 !important;
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.24), 0 6px 16px rgba(109, 40, 217, 0.18);
        transform: translateY(-2px);
      }
      #${MODAL_ID} .msw-card-slot-badge {
        position: absolute;
        top: 5px;
        right: 5px;
        width: 20px;
        height: 20px;
        border-radius: 999px;
        background: #7C3AED;
        color: #FFFFFF;
        font-size: 0.72rem;
        font-weight: 900;
        display: none;
        align-items: center;
        justify-content: center;
      }
      #${MODAL_ID} .msw-word-card.is-selected .msw-card-slot-badge {
        display: inline-flex;
      }
      #${MODAL_ID} .msw-card-emoji {
        font-size: 1.75rem;
        line-height: 1;
      }
      #${MODAL_ID} .msw-card-title {
        font-size: 0.82rem;
        font-weight: 800;
        color: #1E293B;
        line-height: 1.15;
      }
      #${MODAL_ID} .msw-inputs-bar {
        display: grid;
        grid-template-columns: repeat(3, 1fr) auto auto;
        gap: 10px;
        align-items: center;
        background: #F1F5F9;
        border: 2px solid #E2E8F0;
        border-radius: 18px;
        padding: 12px;
        margin-bottom: 14px;
      }
      #${MODAL_ID} .msw-input-wrap {
        position: relative;
        display: flex;
        align-items: center;
      }
      #${MODAL_ID} .msw-input-num {
        position: absolute;
        left: 10px;
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background: #EDE9FE;
        color: #5B21B6;
        font-size: 0.76rem;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      #${MODAL_ID} .msw-word-input {
        width: 100%;
        box-sizing: border-box;
        padding: 10px 12px 10px 38px;
        border-radius: 12px;
        border: 2px solid #CBD5E1;
        background: #FFFFFF;
        color: #0F172A;
        font-family: 'Nunito', sans-serif;
        font-size: 0.96rem;
        font-weight: 800;
        outline: none;
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
      }
      #${MODAL_ID} .msw-word-input:focus {
        border-color: #7C3AED;
        box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
      }
      #${MODAL_ID} .msw-btn-random,
      #${MODAL_ID} .msw-btn-clear {
        padding: 10px 14px;
        border-radius: 12px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.92rem;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
        touch-action: manipulation;
        transition: transform 0.14s ease;
      }
      #${MODAL_ID} .msw-btn-random {
        background: linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%);
        border: 2px solid #F59E0B;
        border-bottom: 4px solid #D97706;
        color: #92400E;
      }
      #${MODAL_ID} .msw-btn-clear {
        background: #FFFFFF;
        border: 2px solid #CBD5E1;
        border-bottom: 4px solid #94A3B8;
        color: #475569;
      }
      #${MODAL_ID} .msw-btn-random:hover,
      #${MODAL_ID} .msw-btn-clear:hover {
        transform: translateY(-1px);
      }
      #${MODAL_ID} .msw-generate-row {
        display: flex;
        justify-content: center;
        margin-bottom: 16px;
      }
      #${MODAL_ID} .msw-btn-generate {
        width: 100%;
        max-width: 440px;
        padding: 14px 24px;
        border-radius: 18px;
        border: none;
        border-bottom: 5px solid #5B21B6;
        background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
        color: #FFFFFF;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.2rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: 0 10px 24px rgba(109, 40, 217, 0.3);
        touch-action: manipulation;
        transition: transform 0.14s ease, box-shadow 0.14s ease;
      }
      #${MODAL_ID} .msw-btn-generate:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(109, 40, 217, 0.38);
      }
      #${MODAL_ID} .msw-btn-generate:active {
        transform: translateY(2px);
      }
      #${MODAL_ID} .msw-output-card {
        background: linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 50%, #F5F3FF 100%);
        border: 2.5px solid #DDD6FE;
        border-radius: 22px;
        padding: 18px 22px;
        box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
      }
      #${MODAL_ID} .msw-output-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 12px;
      }
      #${MODAL_ID} .msw-output-title {
        margin: 0;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.1rem, 1.8vw, 1.4rem);
        font-weight: 700;
        color: #312E81;
      }
      #${MODAL_ID} .msw-used-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      #${MODAL_ID} .msw-used-chip {
        padding: 4px 10px;
        border-radius: 999px;
        background: #EDE9FE;
        color: #5B21B6;
        font-size: 0.8rem;
        font-weight: 800;
      }
      #${MODAL_ID} .msw-output-body {
        font-size: clamp(1.08rem, 1.65vw, 1.32rem);
        line-height: 1.68;
        font-weight: 700;
        color: #1E293B;
        background: #FFFFFF;
        border: 2px solid #E2E8F0;
        border-radius: 16px;
        padding: 16px 18px;
      }
      #${MODAL_ID} .msw-highlight {
        background: #FEF08A;
        color: #78350F;
        padding: 1px 6px;
        border-radius: 7px;
        font-weight: 900;
      }
      #${MODAL_ID} .msw-riddle-answer-box {
        margin-top: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        padding: 12px 16px;
        border-radius: 14px;
        background: #FFF7ED;
        border: 2px dashed #FB923C;
      }
      #${MODAL_ID} .msw-riddle-secret {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.05rem;
        font-weight: 700;
        color: #9A3412;
      }
      #${MODAL_ID} .msw-btn-reveal {
        padding: 8px 14px;
        border-radius: 12px;
        border: 2px solid #F97316;
        border-bottom: 3px solid #C2410C;
        background: #FFFFFF;
        color: #C2410C;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.92rem;
        font-weight: 700;
        cursor: pointer;
        touch-action: manipulation;
      }
      #${MODAL_ID} .msw-output-footer {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 14px;
      }
      #${MODAL_ID} .msw-btn-speak {
        padding: 12px 24px;
        border-radius: 16px;
        border: 2px solid #0284C7;
        border-bottom: 5px solid #0369A1;
        background: linear-gradient(180deg, #0EA5E9 0%, #0284C7 100%);
        color: #FFFFFF;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.08rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 6px 18px rgba(2, 132, 199, 0.28);
        touch-action: manipulation;
        transition: transform 0.14s ease;
      }
      #${MODAL_ID} .msw-btn-speak.is-speaking {
        background: linear-gradient(180deg, #EF4444 0%, #DC2626 100%);
        border-color: #DC2626;
        border-bottom-color: #991B1B;
        box-shadow: 0 6px 18px rgba(220, 38, 38, 0.3);
      }
      #${MODAL_ID} .msw-btn-speak:hover {
        transform: translateY(-2px);
      }
      @media (max-width: 900px) {
        #${MODAL_ID} .msw-word-grid {
          grid-template-columns: repeat(4, 1fr);
        }
        #${MODAL_ID} .msw-inputs-bar {
          grid-template-columns: 1fr 1fr 1fr;
        }
        #${MODAL_ID} .msw-btn-random {
          grid-column: span 2;
        }
      }
      @media (max-width: 640px) {
        #${MODAL_ID} {
          padding: 8px;
        }
        #${MODAL_ID} .msw-dialog {
          padding: 14px 14px 18px;
          border-radius: 20px;
          max-height: 96vh;
        }
        #${MODAL_ID} .msw-header-icon {
          width: 40px;
          height: 40px;
          font-size: 1.35rem;
        }
        #${MODAL_ID} .msw-subtitle {
          display: none;
        }
        #${MODAL_ID} .msw-word-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 7px;
        }
        #${MODAL_ID} .msw-word-card {
          padding: 8px 4px;
        }
        #${MODAL_ID} .msw-card-emoji {
          font-size: 1.45rem;
        }
        #${MODAL_ID} .msw-card-title {
          font-size: 0.74rem;
        }
        #${MODAL_ID} .msw-inputs-bar {
          grid-template-columns: 1fr;
          gap: 8px;
          padding: 10px;
        }
        #${MODAL_ID} .msw-btn-random {
          grid-column: span 1;
        }
        #${MODAL_ID} .msw-output-card {
          padding: 14px;
        }
        #${MODAL_ID} .msw-output-body {
          padding: 12px 14px;
          font-size: 1.02rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function getWordsFromInputs() {
    const res = [];
    for (let i = 0; i < 3; i++) {
      const inp = document.getElementById(`moliWordInput${i}`);
      res.push(inp ? inp.value.trim() : (workshopState.words[i] || ''));
    }
    return res;
  }

  function setWordsToInputs(arr) {
    for (let i = 0; i < 3; i++) {
      const val = arr[i] || '';
      workshopState.words[i] = val;
      const inp = document.getElementById(`moliWordInput${i}`);
      if (inp) inp.value = val;
    }
    syncWordCardStates();
  }

  function syncWordCardStates() {
    const current = getWordsFromInputs();
    const lowered = current.map((w) => w.toLocaleLowerCase('tr-TR'));
    document.querySelectorAll(`#${MODAL_ID} .msw-word-card`).forEach((cardEl) => {
      const cardWord = cardEl.getAttribute('data-word') || '';
      const idx = lowered.indexOf(cardWord.toLocaleLowerCase('tr-TR'));
      const badge = cardEl.querySelector('.msw-card-slot-badge');
      cardEl.classList.toggle('is-selected', idx !== -1);
      if (badge) badge.textContent = idx !== -1 ? String(idx + 1) : '';
    });
  }

  function handleWordCardClick(word) {
    const current = getWordsFromInputs();
    const lowered = current.map((w) => w.toLocaleLowerCase('tr-TR'));
    const existingIdx = lowered.indexOf(word.toLocaleLowerCase('tr-TR'));

    if (existingIdx !== -1) {
      current[existingIdx] = '';
      workshopState.nextSlot = existingIdx;
    } else {
      const emptyIdx = current.findIndex((w) => !w);
      const targetIdx = emptyIdx !== -1 ? emptyIdx : workshopState.nextSlot;
      current[targetIdx] = word;
      workshopState.nextSlot = (targetIdx + 1) % 3;
    }
    setWordsToInputs(current);
  }

  function ensureThreeWords() {
    const current = getWordsFromInputs();
    const usedLower = new Set(current.filter(Boolean).map((w) => w.toLocaleLowerCase('tr-TR')));
    const available = WORD_CARDS.filter((c) => !usedLower.has(c.word.toLocaleLowerCase('tr-TR')));
    for (let i = 0; i < 3; i++) {
      if (!current[i]) {
        const pick = available.length > 0
          ? available.splice(Math.floor(Math.random() * available.length), 1)[0].word
          : WORD_CARDS[i].word;
        current[i] = pick;
      }
    }
    setWordsToInputs(current);
    return current;
  }

  function buildStoryOutput(words) {
    let idx = Math.floor(Math.random() * STORY_TEMPLATES.length);
    if (STORY_TEMPLATES.length > 1 && idx === workshopState.lastStoryIdx) {
      idx = (idx + 1) % STORY_TEMPLATES.length;
    }
    workshopState.lastStoryIdx = idx;
    const tpl = STORY_TEMPLATES[idx];
    return {
      type: 'story',
      title: tpl.title(words[0], words[1], words[2]),
      text: tpl.build(words[0], words[1], words[2]),
      words: words.slice()
    };
  }

  function buildRiddleOutput(words) {
    workshopState.riddleAnswerCursor = (workshopState.riddleAnswerCursor + 1) % 3;
    const targetIdx = workshopState.riddleAnswerCursor;
    const answerWord = words[targetIdx];
    const others = words.filter((_, i) => i !== targetIdx);
    const otherA = others[0] || 'Moli';
    const otherB = others[1] || 'Yıldız';

    const preset = findPresetCard(answerWord);
    let introIdx = Math.floor(Math.random() * RIDDLE_INTROS.length);
    if (RIDDLE_INTROS.length > 1 && introIdx === workshopState.lastRiddleIdx) {
      introIdx = (introIdx + 1) % RIDDLE_INTROS.length;
    }
    workshopState.lastRiddleIdx = introIdx;

    const introLine = RIDDLE_INTROS[introIdx](otherA, otherB);
    const outroLine = RIDDLE_OUTROS[introIdx % RIDDLE_OUTROS.length];

    let bodyLines;
    if (preset) {
      bodyLines = preset.riddleLines;
    } else {
      const cleanAnswer = answerWord.trim();
      const firstChar = cleanAnswer.charAt(0).toLocaleUpperCase('tr-TR');
      const letterLen = cleanAnswer.replace(/\s+/g, '').length;
      bodyLines = [
        `Tam ${letterLen} harfli adı "${firstChar}" ile başlar,`,
        'Masalımızda saklanır, bilenleri neşe sarar!'
      ];
    }

    return {
      type: 'riddle',
      title: '🧩 Bil Bakalım Bu Nedir?',
      text: `${introLine}\n${bodyLines[0]}\n${bodyLines[1]}\n${outroLine}`,
      words: [otherA, otherB],
      allWords: words.slice(),
      riddleAnswer: answerWord,
      answerEmoji: preset ? preset.emoji : '✨',
      answerRevealed: false
    };
  }

  function renderOutputCard() {
    const card = document.getElementById('moliStoryOutputCard');
    if (!card) return;
    const out = workshopState.currentOutput;

    if (!out) {
      card.innerHTML = `
        <div class="msw-output-header">
          <h3 class="msw-output-title">✨ Hazır mısın?</h3>
        </div>
        <div class="msw-output-body">
          Yukarıdan 3 kelime seç veya yaz, sonra <strong>"✨ Oluştur"</strong> butonuna dokun!
        </div>
      `;
      return;
    }

    const chipsHtml = out.words
      .map((w) => `<span class="msw-used-chip">${escapeHtml(w)}</span>`)
      .join('');

    const riddleExtraHtml = out.type === 'riddle'
      ? `
        <div class="msw-riddle-answer-box">
          <span class="msw-riddle-secret" id="moliRiddleSecretText">
            ${out.answerRevealed
              ? `🎉 Cevap: <strong>${escapeHtml(out.answerEmoji)} ${escapeHtml(out.riddleAnswer)}</strong>`
              : '❓ Cevap gizli tutuluyor — önce sınıfça tahmin edin!'}
          </span>
          <button class="msw-btn-reveal" id="moliRiddleRevealBtn" type="button">
            ${out.answerRevealed ? '🙈 Cevabı Gizle' : '👀 Cevabı Göster'}
          </button>
        </div>
      `
      : '';

    card.innerHTML = `
      <div class="msw-output-header">
        <h3 class="msw-output-title">${escapeHtml(out.title)}</h3>
        <div class="msw-used-chips">
          ${out.type === 'riddle' ? '<span class="msw-used-chip">🔒 1 Gizli Cevap</span>' : ''}
          ${chipsHtml}
        </div>
      </div>
      <div class="msw-output-body">
        ${highlightWordsHtml(out.text, out.words)}
      </div>
      ${riddleExtraHtml}
      <div class="msw-output-footer">
        <button class="msw-btn-speak ${workshopState.isSpeaking ? 'is-speaking' : ''}" id="moliStorySpeakBtn" type="button">
          <span aria-hidden="true">${workshopState.isSpeaking ? '⏹️' : '🔊'}</span>
          <span>${workshopState.isSpeaking ? 'Okumayı Durdur' : 'Sesli Oku'}</span>
        </button>
      </div>
    `;

    const speakBtn = document.getElementById('moliStorySpeakBtn');
    if (speakBtn) {
      speakBtn.addEventListener('click', speakCurrentOutput);
    }

    const revealBtn = document.getElementById('moliRiddleRevealBtn');
    if (revealBtn) {
      revealBtn.addEventListener('click', () => {
        if (!workshopState.currentOutput) return;
        workshopState.currentOutput.answerRevealed = !workshopState.currentOutput.answerRevealed;
        renderOutputCard();
      });
    }
  }

  function generateCurrentOutput() {
    stopVoicePlayback();
    const words = ensureThreeWords();
    workshopState.currentOutput = workshopState.activeTab === 'riddle'
      ? buildRiddleOutput(words)
      : buildStoryOutput(words);
    renderOutputCard();
  }

  function updateTabUI() {
    document.querySelectorAll(`#${MODAL_ID} .msw-tab-btn`).forEach((btn) => {
      const tab = btn.getAttribute('data-msw-tab');
      const active = tab === workshopState.activeTab;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    const genBtn = document.getElementById('moliStoryGenerateBtn');
    if (genBtn) {
      genBtn.innerHTML = workshopState.activeTab === 'riddle'
        ? '<span aria-hidden="true">✨</span> <span>Oluştur (Kafiyeli Bilmece)</span>'
        : '<span aria-hidden="true">✨</span> <span>Oluştur (Eğlenceli Hikaye)</span>';
    }
  }

  function buildModal() {
    if (document.getElementById(MODAL_ID)) return;
    injectStyles();

    const modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Hikaye ve Bilmece Atölyesi');

    const cardsHtml = WORD_CARDS.map((c) => `
      <button class="msw-word-card" type="button" data-word="${escapeHtml(c.word)}" style="background:${c.bg}; border-color:${c.border};">
        <span class="msw-card-slot-badge"></span>
        <span class="msw-card-emoji" aria-hidden="true">${c.emoji}</span>
        <span class="msw-card-title">${escapeHtml(c.word)}</span>
      </button>
    `).join('');

    modal.innerHTML = `
      <div class="msw-dialog">
        <div class="msw-header">
          <div class="msw-title-wrap">
            <div class="msw-header-icon" aria-hidden="true">🪄</div>
            <div>
              <h2 class="msw-title">Hikaye &amp; Bilmece Atölyesi</h2>
              <p class="msw-subtitle">3 kelime seç veya yaz; sınıfınla sesli hikaye veya bilmece üret!</p>
            </div>
          </div>
          <button class="msw-close-btn" id="moliStoryCloseBtn" type="button" aria-label="Atölyeyi Kapat">✕ Kapat</button>
        </div>

        <div class="msw-tabs" role="tablist" aria-label="Atölye Sekmeleri">
          <button class="msw-tab-btn is-active" id="moliTabStory" data-msw-tab="story" type="button" role="tab" aria-selected="true">
            <span aria-hidden="true">📖</span>
            <span>Hikaye Üretici</span>
          </button>
          <button class="msw-tab-btn" id="moliTabRiddle" data-msw-tab="riddle" type="button" role="tab" aria-selected="false">
            <span aria-hidden="true">🧩</span>
            <span>Bilmece Üretici</span>
          </button>
        </div>

        <div class="msw-section-label">
          <span>🎯 12 Hazır Kelime Kartından Seç veya Aşağıya Kendi Kelimeni Yaz:</span>
        </div>

        <div class="msw-word-grid" id="moliWordGrid">
          ${cardsHtml}
        </div>

        <div class="msw-inputs-bar">
          <div class="msw-input-wrap">
            <span class="msw-input-num">1</span>
            <input class="msw-word-input" id="moliWordInput0" type="text" maxlength="28" placeholder="1. Kelime">
          </div>
          <div class="msw-input-wrap">
            <span class="msw-input-num">2</span>
            <input class="msw-word-input" id="moliWordInput1" type="text" maxlength="28" placeholder="2. Kelime">
          </div>
          <div class="msw-input-wrap">
            <span class="msw-input-num">3</span>
            <input class="msw-word-input" id="moliWordInput2" type="text" maxlength="28" placeholder="3. Kelime">
          </div>
          <button class="msw-btn-random" id="moliRandomWordsBtn" type="button">🎲 Rastgele Seç</button>
          <button class="msw-btn-clear" id="moliClearWordsBtn" type="button">🧹 Temizle</button>
        </div>

        <div class="msw-generate-row">
          <button class="msw-btn-generate" id="moliStoryGenerateBtn" type="button">
            <span aria-hidden="true">✨</span>
            <span>Oluştur</span>
          </button>
        </div>

        <div class="msw-output-card" id="moliStoryOutputCard"></div>
      </div>
    `;

    document.body.appendChild(modal);

    // Kapatma dinleyicileri
    document.getElementById('moliStoryCloseBtn').addEventListener('click', closeWorkshop);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeWorkshop();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeWorkshop();
      }
    });

    // Sekme dinleyicileri
    modal.querySelectorAll('.msw-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextTab = btn.getAttribute('data-msw-tab');
        if (nextTab !== 'story' && nextTab !== 'riddle') return;
        workshopState.activeTab = nextTab;
        updateTabUI();
        generateCurrentOutput();
      });
    });

    // Kelime kartları dinleyicileri
    modal.querySelectorAll('.msw-word-card').forEach((cardEl) => {
      cardEl.addEventListener('click', () => {
        handleWordCardClick(cardEl.getAttribute('data-word'));
      });
    });

    // Serbest yazım kutuları
    for (let i = 0; i < 3; i++) {
      const inp = document.getElementById(`moliWordInput${i}`);
      if (inp) {
        inp.addEventListener('input', () => {
          workshopState.words[i] = inp.value.trim();
          syncWordCardStates();
        });
      }
    }

    // Rastgele Seç & Temizle & Oluştur
    document.getElementById('moliRandomWordsBtn').addEventListener('click', () => {
      setWordsToInputs(pickThreeRandomWords());
      generateCurrentOutput();
    });

    document.getElementById('moliClearWordsBtn').addEventListener('click', () => {
      stopVoicePlayback();
      workshopState.nextSlot = 0;
      setWordsToInputs(['', '', '']);
      workshopState.currentOutput = null;
      renderOutputCard();
    });

    document.getElementById('moliStoryGenerateBtn').addEventListener('click', generateCurrentOutput);

    setWordsToInputs(workshopState.words);
    updateTabUI();
    generateCurrentOutput();
  }

  function openWorkshop() {
    buildModal();
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.add('is-open');
  }

  function closeWorkshop() {
    stopVoicePlayback();
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.remove('is-open');
  }

  window.openMoliStoryWorkshop = openWorkshop;
  window.closeMoliStoryWorkshop = closeWorkshop;

  function attachTriggers() {
    ['btnTopbarStoryWorkshop', 'btnSidebarStoryWorkshop'].forEach((id) => {
      const el = document.getElementById(id);
      if (el && !el.dataset.mswBound) {
        el.dataset.mswBound = '1';
        el.addEventListener('click', (e) => {
          e.preventDefault();
          openWorkshop();
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachTriggers);
  } else {
    attachTriggers();
  }
})();
