/**
 * ==========================================================================
 * DERSE Bİ' MOLA - BAĞIMSIZ FOTOĞRAFTAN ÖĞRENCİ LİSTESİ, KURA & SINIF LİGİ
 * (student_picker.js - 5. Aşama & Sınıf Ligi Güncellemesi)
 * - Her oyunun üstünde çalışan Yüzen "🎲 Kura / Lig" Butonu ve
 *   Üst Yüzen Yarışmacı Çubuğu (z-index: 100000; açık oyunu kapatmaz!)
 * - "🎲 1 Kişi Çek", "⚔️ 2 Kişi (Düello)", "+5" ve "+10" hızlı puan butonları,
 *   "🏆 Lig" tam ekran yönetim butonu
 * - #moli-picker-modal içinde 2 Sekme:
 *   1) 📋 Liste & Kura (Tesseract.js Türkçe OCR + 2.5sn Heyecanlı Kura)
 *   2) 🏆 Sınıf Ligi (1-2-3. Madalya Kürsüsü, 👤 Bireysel / 🚩 3 Takım Ligi,
 *      🔄 Puanları Sıfırla)
 * app.js ve mevcut oyun dosyalarından tamamen bağımsız çalışır.
 * ==========================================================================
 */
(function () {
  'use strict';

  const MODAL_ID = 'moli-picker-modal';
  const FLOATING_FAB_ID = 'moli-floating-kura-fab';
  const FLOATING_BAR_ID = 'moli-floating-kura-bar';
  const STYLE_ID = 'moli-student-picker-styles';
  const CONFETTI_CANVAS_ID = 'moli-picker-confetti-canvas';
  const SIDEBAR_BTN_ID = 'btnSidebarStudentPicker';

  const STORAGE_KEY_LIST = 'moli_student_picker_list_v1';
  const STORAGE_KEY_DRAWN = 'moli_student_picker_drawn_v1';
  const STORAGE_KEY_NO_REPEAT = 'moli_student_picker_norepeat_v1';
  const STORAGE_KEY_SCORES = 'moli_student_picker_scores_v1';
  const TESSERACT_CDN_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

  const DEFAULT_SAMPLE_STUDENTS = [
    'Ahmet Yılmaz',
    'Zeynep Kaya',
    'Mustafa Demir',
    'Elif Çelik',
    'Mehmet Şahin',
    'Defne Yıldız',
    'Kerem Öztürk',
    'Ayşe Aydın',
    'Ömer Özdemir',
    'Azra Arslan',
    'Yusuf Doğan',
    'Nehir Kılıç'
  ];

  const TEAMS_META = [
    { id: 'blue', name: '🔵 Mavi Takım', badge: '🔵 Mavi', bg: '#E0F2FE', border: '#0284C7', text: '#075985' },
    { id: 'orange', name: '🟠 Turuncu Takım', badge: '🟠 Turuncu', bg: '#FFEDD5', border: '#EA580C', text: '#9A3412' },
    { id: 'green', name: '🟢 Yeşil Takım', badge: '🟢 Yeşil', bg: '#DCFCE7', border: '#16A34A', text: '#166534' }
  ];

  const state = {
    isOpen: false,
    activeModalTab: 'picker', // 'picker' | 'league'
    leagueViewMode: 'individual', // 'individual' | 'teams'
    floatingBarOpen: false,
    floatingMode: 'none', // 'none' | 'single' | 'duel'
    activeContestants: [], // [name1] veya [name1, name2]
    isBarRolling: false,
    barRollTimer: null,
    students: [],
    scores: {}, // { 'Ahmet Yılmaz': 25, ... }
    drawnSet: new Set(),
    noRepeat: true,
    isDrawing: false,
    selectedStudent: null,
    drawTimer: null,
    ocrLoading: false,
    tesseractPromise: null,
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

  // Kura dönerken isim geçişlerinde mekanik "tık-tık" sesi
  function playPickerTickSound(progressRatio) {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const freq = 760 - Math.min(340, progressRatio * 320);
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(210, now + 0.028);

      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.032);
    } catch (e) {}
  }

  // +5 / +10 hızlı puan verildiğinde neşeli çan & hafif alkış sesi
  function playQuickScoreSound(points) {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = points >= 10
        ? [523.25, 659.25, 783.99, 1046.5]
        : [587.33, 783.99, 987.77];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.055);
        gain.gain.setValueAtTime(0.001, now + idx * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.055 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.24);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.055);
        osc.stop(now + idx * 0.055 + 0.26);
      });

      for (let i = 0; i < 4; i++) {
        const start = now + 0.03 + i * 0.065;
        const bufLen = Math.floor(ctx.sampleRate * 0.045);
        const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let k = 0; k < bufLen; k++) {
          data[k] = (Math.random() * 2 - 1) * Math.exp(-k / (bufLen * 0.25));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1250 + Math.random() * 500, start);
        const clapGain = ctx.createGain();
        clapGain.gain.setValueAtTime(0.12, start);
        clapGain.gain.exponentialRampToValueAtTime(0.001, start + 0.045);
        noise.connect(filter);
        filter.connect(clapGain);
        clapGain.connect(ctx.destination);
        noise.start(start);
        noise.stop(start + 0.05);
      }
    } catch (e) {}
  }

  // Şanslı öğrenci seçildiğinde zafer fanfarı ve alkış efekti
  function playWinnerApplauseAndFanfare() {
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
        gain.gain.exponentialRampToValueAtTime(0.16, now + idx * 0.075 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.075 + 0.36);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.075);
        osc.stop(now + idx * 0.075 + 0.38);
      });

      const clapCount = 9;
      for (let i = 0; i < clapCount; i++) {
        const start = now + 0.06 + i * 0.075 + Math.random() * 0.02;
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

  function launchPickerConfetti() {
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

    const colors = ['#F59E0B', '#10B981', '#0EA5E9', '#EC4899', '#8B5CF6', '#FACC15'];
    const cx = canvas.width * 0.58;
    const cy = canvas.height * 0.42;
    const particles = Array.from({ length: 95 }, () => {
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
        p.life -= 0.013;
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

  function speakStudentName(studentName) {
    if (!studentName) return;
    speakWithMoli(`Şanslı öğrencimiz: ${studentName}!`);
  }

  // OCR veya elle girilen satırları temizle (okul numaralarını, sıra rakamlarını, sembolleri ayıkla)
  function cleanStudentLine(rawLine) {
    let line = String(rawLine || '').trim();
    if (!line) return '';

    line = line.replace(/^[\d\s.\-–—_()[\]:/|#*•+]+/, '').trim();
    line = line.replace(/[\d\s.\-–—_()[\]:/|#*•+]+$/, '').trim();
    line = line.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ\s]/g, ' ').replace(/\s+/g, ' ').trim();

    if (line.length < 2) return '';

    const upper = line.toLocaleUpperCase('tr-TR');
    const ignoreKeywords = [
      'ÖĞRENCİ NO',
      'ADI SOYADI',
      'SINIF LİSTESİ',
      'SIRA NO',
      'OKUL NO',
      'CİNSİYETİ',
      'TC KİMLİK',
      'DEVAMSIZLIK',
      'İMZA',
      'AÇIKLAMA',
      'TOPLAM'
    ];
    for (let i = 0; i < ignoreKeywords.length; i++) {
      if (upper === ignoreKeywords[i] || upper.includes(ignoreKeywords[i])) {
        return '';
      }
    }

    return line
      .split(' ')
      .filter(Boolean)
      .map((word) => {
        const first = word.charAt(0).toLocaleUpperCase('tr-TR');
        const rest = word.slice(1).toLocaleLowerCase('tr-TR');
        return first + rest;
      })
      .join(' ');
  }

  function parseStudentTextarea(rawText) {
    const lines = String(rawText || '').split(/\r?\n/);
    const seen = new Set();
    const list = [];
    for (let i = 0; i < lines.length; i++) {
      const cleaned = cleanStudentLine(lines[i]);
      if (!cleaned) continue;
      const key = cleaned.toLocaleUpperCase('tr-TR');
      if (!seen.has(key)) {
        seen.add(key);
        list.push(cleaned);
      }
    }
    return list;
  }

  function loadStoredState() {
    try {
      const savedRaw = localStorage.getItem(STORAGE_KEY_LIST);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          state.students = parsed;
        }
      }
    } catch (e) {}

    if (!state.students || state.students.length === 0) {
      state.students = DEFAULT_SAMPLE_STUDENTS.slice();
    }

    try {
      const savedScores = localStorage.getItem(STORAGE_KEY_SCORES);
      if (savedScores) {
        const parsedScores = JSON.parse(savedScores);
        if (parsedScores && typeof parsedScores === 'object') {
          state.scores = parsedScores;
        }
      }
    } catch (e) {
      state.scores = {};
    }

    try {
      const savedDrawn = localStorage.getItem(STORAGE_KEY_DRAWN);
      if (savedDrawn) {
        const arr = JSON.parse(savedDrawn);
        if (Array.isArray(arr)) {
          const validSet = new Set(state.students);
          state.drawnSet = new Set(arr.filter((name) => validSet.has(name)));
        }
      }
    } catch (e) {}

    try {
      const savedNoRepeat = localStorage.getItem(STORAGE_KEY_NO_REPEAT);
      if (savedNoRepeat !== null) {
        state.noRepeat = savedNoRepeat !== '0';
      } else {
        state.noRepeat = true;
      }
    } catch (e) {
      state.noRepeat = true;
    }
  }

  function saveScoresToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(state.scores));
    } catch (e) {}
  }

  function getStudentScore(name) {
    return Number(state.scores[name] || 0);
  }

  function addStudentPoints(name, deltaPoints, btnEl) {
    if (!name) return;
    const current = getStudentScore(name);
    state.scores[name] = Math.max(0, current + deltaPoints);
    saveScoresToStorage();
    playQuickScoreSound(deltaPoints);

    if (btnEl) {
      btnEl.classList.remove('is-pulsing');
      void btnEl.offsetWidth;
      btnEl.classList.add('is-pulsing');
    }

    renderFloatingContestantsArea();
    if (state.isOpen && state.activeModalTab === 'league') {
      renderLeagueTab();
    }
  }

  function resetAllLeagueScores() {
    const ok = window.confirm('Sınıf Ligi puanlarını sıfırlayıp yeni bir lig haftası/ayı başlatmak istediğinize emin misiniz?');
    if (!ok) return;
    state.scores = {};
    saveScoresToStorage();
    renderFloatingContestantsArea();
    renderLeagueTab();
  }

  function saveStudentsToStorage(showBadgeFeedback) {
    const textarea = document.getElementById('moliPickerTextarea');
    if (textarea) {
      const parsed = parseStudentTextarea(textarea.value);
      state.students = parsed;
      textarea.value = parsed.join('\n');
    }

    const validSet = new Set(state.students);
    state.drawnSet.forEach((name) => {
      if (!validSet.has(name)) state.drawnSet.delete(name);
    });

    try {
      localStorage.setItem(STORAGE_KEY_LIST, JSON.stringify(state.students));
      localStorage.setItem(STORAGE_KEY_DRAWN, JSON.stringify(Array.from(state.drawnSet)));
      localStorage.setItem(STORAGE_KEY_NO_REPEAT, state.noRepeat ? '1' : '0');
    } catch (e) {}

    updatePickerStatusUI();
    renderFloatingContestantsArea();
    if (state.isOpen && state.activeModalTab === 'league') {
      renderLeagueTab();
    }

    if (showBadgeFeedback) {
      const saveMsg = document.getElementById('moliPickerSaveFeedback');
      if (saveMsg) {
        saveMsg.textContent = `✅ ${state.students.length} kişilik sınıf listesi kaydedildi!`;
        saveMsg.classList.add('is-visible');
        setTimeout(() => saveMsg.classList.remove('is-visible'), 2800);
      }
    }
  }

  function persistDrawnState() {
    try {
      localStorage.setItem(STORAGE_KEY_DRAWN, JSON.stringify(Array.from(state.drawnSet)));
      localStorage.setItem(STORAGE_KEY_NO_REPEAT, state.noRepeat ? '1' : '0');
    } catch (e) {}
  }

  function getRemainingStudents() {
    if (!state.noRepeat) {
      return state.students.slice();
    }
    return state.students.filter((name) => !state.drawnSet.has(name));
  }

  // "Çıkan tekrar çıkmasın" kuralıyla N adet rastgele öğrenci seçer
  function drawRandomContestants(count) {
    if (!state.students || state.students.length === 0) {
      loadStoredState();
    }
    if (state.students.length === 0) return [];

    const needed = Math.min(count, state.students.length);
    let pool = getRemainingStudents();

    if (pool.length < needed) {
      state.drawnSet.clear();
      persistDrawnState();
      pool = state.students.slice();
    }

    const picked = [];
    const copy = pool.slice();
    for (let i = 0; i < needed; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      const chosen = copy.splice(idx, 1)[0];
      picked.push(chosen);
      if (state.noRepeat) {
        state.drawnSet.add(chosen);
      }
    }

    persistDrawnState();
    updatePickerStatusUI();
    return picked;
  }

  function resetRound() {
    if (state.isDrawing) return;
    state.drawnSet.clear();
    state.selectedStudent = null;
    persistDrawnState();
    updatePickerStatusUI();

    const displayEl = document.getElementById('moliPickerStageName');
    const subEl = document.getElementById('moliPickerStageSub');
    const cardEl = document.getElementById('moliPickerStageCard');
    if (cardEl) cardEl.classList.remove('is-winner', 'is-rolling');
    if (displayEl) displayEl.textContent = '🎲 Kura Hazır!';
    if (subEl) subEl.textContent = 'Tur sıfırlandı — tüm öğrenciler yeniden kuraya dahil edildi.';
  }

  function updatePickerStatusUI() {
    const total = state.students.length;
    const remaining = state.noRepeat
      ? Math.max(0, total - state.drawnSet.size)
      : total;

    const countEl = document.getElementById('moliPickerRemainingBadge');
    if (countEl) {
      countEl.innerHTML = `👥 Kalan: <strong>${remaining} / ${total}</strong>`;
    }

    const listBadge = document.getElementById('moliPickerListCountBadge');
    if (listBadge) {
      listBadge.textContent = `${total} Öğrenci`;
    }

    const chipsContainer = document.getElementById('moliPickerDrawnChips');
    if (chipsContainer) {
      if (state.drawnSet.size === 0) {
        chipsContainer.innerHTML = `<span class="msp-chips-empty">Henüz bu turda seçilen öğrenci yok.</span>`;
      } else {
        const items = Array.from(state.drawnSet).map((name) => `
          <span class="msp-drawn-chip">✓ ${escapeHtml(name)}</span>
        `);
        chipsContainer.innerHTML = items.join('');
      }
    }
  }

  // =========================================================================
  // 1) HER OYUNUN ÜSTÜNDE ÇALIŞAN YÜZEN KURA BUTONU & YARIŞMACI ÇUBUĞU
  // =========================================================================
  function toggleFloatingBar(forceState) {
    const next = typeof forceState === 'boolean' ? forceState : !state.floatingBarOpen;
    state.floatingBarOpen = next;

    const bar = document.getElementById(FLOATING_BAR_ID);
    const fab = document.getElementById(FLOATING_FAB_ID);
    if (bar) {
      bar.classList.toggle('is-open', next);
    }
    if (fab) {
      fab.classList.toggle('is-active', next);
      fab.setAttribute('aria-expanded', next ? 'true' : 'false');
    }
    if (next) {
      renderFloatingContestantsArea();
    }
  }

  function startFloatingQuickDraw(count) {
    if (state.isBarRolling) return;
    if (!state.students || state.students.length === 0) {
      loadStoredState();
    }
    if (state.students.length === 0) return;

    state.isBarRolling = true;
    state.floatingMode = count === 2 ? 'duel' : 'single';
    const area = document.getElementById('moliFloatingContestantsArea');

    const totalSteps = 10;
    let step = 0;

    function rollTick() {
      if (step < totalSteps) {
        const r1 = state.students[Math.floor(Math.random() * state.students.length)];
        const r2 = state.students[Math.floor(Math.random() * state.students.length)];
        playPickerTickSound(step / totalSteps);

        if (area) {
          if (count === 1) {
            area.innerHTML = `
              <div class="mfp-contestant-pill is-rolling">
                <span class="mfp-badge-tag">🎰 Seçiliyor:</span>
                <strong class="mfp-name">${escapeHtml(r1)}</strong>
              </div>
            `;
          } else {
            area.innerHTML = `
              <div class="mfp-contestant-pill is-team1 is-rolling">
                <span class="mfp-badge-tag">🟡</span>
                <strong class="mfp-name">${escapeHtml(r1)}</strong>
              </div>
              <span class="mfp-vs-tag">VS</span>
              <div class="mfp-contestant-pill is-team2 is-rolling">
                <span class="mfp-badge-tag">🟠</span>
                <strong class="mfp-name">${escapeHtml(r2)}</strong>
              </div>
            `;
          }
        }
        step += 1;
        state.barRollTimer = setTimeout(rollTick, 65 + step * 14);
      } else {
        state.isBarRolling = false;
        const winners = drawRandomContestants(count);
        state.activeContestants = winners;
        state.selectedStudent = winners[0] || null;

        renderFloatingContestantsArea();
        playQuickScoreSound(10);

        if (winners.length === 1) {
          speakWithMoli(`Yarışan öğrencimiz: ${winners[0]}!`);
        } else if (winners.length >= 2) {
          speakWithMoli(`Düello başlıyor! ${winners[0]} ve ${winners[1]}!`);
        }
      }
    }

    rollTick();
  }

  function renderFloatingContestantsArea() {
    const area = document.getElementById('moliFloatingContestantsArea');
    if (!area) return;

    if (!state.activeContestants || state.activeContestants.length === 0) {
      const rem = getRemainingStudents().length;
      area.innerHTML = `
        <span class="mfp-empty-hint">
          👆 Açık oyunda yarışacak öğrenciyi seçmek için <strong>🎲 1 Kişi Çek</strong> veya <strong>⚔️ 2 Kişi (Düello)</strong> butonuna dokunun (Kalan: ${rem}/${state.students.length})
        </span>
      `;
      return;
    }

    if (state.activeContestants.length === 1) {
      const name = state.activeContestants[0];
      const sc = getStudentScore(name);
      area.innerHTML = `
        <div class="mfp-contestant-pill is-single">
          <span class="mfp-badge-tag">⭐ Yarışan:</span>
          <strong class="mfp-name">${escapeHtml(name)}</strong>
          <span class="mfp-score-chip" title="Toplam Sınıf Ligi Puanı">${sc}p</span>
          <button class="mfp-pts-btn is-plus5" type="button" data-add-pts="5" data-student="${escapeHtml(name)}" title="+5 Puan Ver">+5</button>
          <button class="mfp-pts-btn is-plus10" type="button" data-add-pts="10" data-student="${escapeHtml(name)}" title="+10 Puan Ver">+10</button>
        </div>
      `;
    } else {
      const n1 = state.activeContestants[0];
      const n2 = state.activeContestants[1];
      const s1 = getStudentScore(n1);
      const s2 = getStudentScore(n2);
      area.innerHTML = `
        <div class="mfp-contestant-pill is-team1">
          <span class="mfp-badge-tag">🟡</span>
          <strong class="mfp-name">${escapeHtml(n1)}</strong>
          <span class="mfp-score-chip">${s1}p</span>
          <button class="mfp-pts-btn is-plus5" type="button" data-add-pts="5" data-student="${escapeHtml(n1)}">+5</button>
          <button class="mfp-pts-btn is-plus10" type="button" data-add-pts="10" data-student="${escapeHtml(n1)}">+10</button>
        </div>
        <span class="mfp-vs-tag">vs</span>
        <div class="mfp-contestant-pill is-team2">
          <span class="mfp-badge-tag">🟠</span>
          <strong class="mfp-name">${escapeHtml(n2)}</strong>
          <span class="mfp-score-chip">${s2}p</span>
          <button class="mfp-pts-btn is-plus5" type="button" data-add-pts="5" data-student="${escapeHtml(n2)}">+5</button>
          <button class="mfp-pts-btn is-plus10" type="button" data-add-pts="10" data-student="${escapeHtml(n2)}">+10</button>
        </div>
      `;
    }

    area.querySelectorAll('[data-add-pts]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const student = btn.getAttribute('data-student');
        const pts = parseInt(btn.getAttribute('data-add-pts'), 10) || 5;
        addStudentPoints(student, pts, btn);
      });
    });
  }

  function buildFloatingWidgets() {
    injectStyles();
    loadStoredState();

    if (!document.getElementById(FLOATING_FAB_ID)) {
      const fab = document.createElement('button');
      fab.id = FLOATING_FAB_ID;
      fab.type = 'button';
      fab.setAttribute('aria-label', 'Yüzen Öğrenci Kura ve Sınıf Ligi Çubuğunu Aç/Kapat');
      fab.setAttribute('aria-expanded', 'false');
      fab.title = 'Açık oyunu kapatmadan Öğrenci Kura ve Sınıf Ligi çubuğunu aç/kapat';
      fab.innerHTML = `
        <span class="mfp-fab-icon" aria-hidden="true">🎲</span>
        <span class="mfp-fab-text">Kura / Lig</span>
      `;
      fab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFloatingBar();
      });
      document.body.appendChild(fab);
    }

    if (!document.getElementById(FLOATING_BAR_ID)) {
      const bar = document.createElement('div');
      bar.id = FLOATING_BAR_ID;
      bar.setAttribute('role', 'region');
      bar.setAttribute('aria-label', 'Yüzen Yarışmacı ve Hızlı Puan Çubuğu');
      bar.innerHTML = `
        <div class="mfp-bar-inner">
          <div class="mfp-draw-actions">
            <button class="mfp-action-btn is-draw1" id="moliFloatDraw1Btn" type="button" title="Kayıtlı listeden 1 öğrenci seç">
              <span aria-hidden="true">🎲</span>
              <span>1 Kişi Çek</span>
            </button>
            <button class="mfp-action-btn is-draw2" id="moliFloatDraw2Btn" type="button" title="Düello için aynı anda 2 öğrenci seç">
              <span aria-hidden="true">⚔️</span>
              <span>2 Kişi (Düello)</span>
            </button>
          </div>

          <div class="mfp-contestants-area" id="moliFloatingContestantsArea" aria-live="polite"></div>

          <div class="mfp-right-actions">
            <button class="mfp-action-btn is-league" id="moliFloatOpenLeagueBtn" type="button" title="Tam Ekran Sınıf Ligi ve Liste Yönetimi">
              <span aria-hidden="true">🏆</span>
              <span>Lig</span>
            </button>
            <button class="mfp-close-bar-btn" id="moliFloatCloseBarBtn" type="button" aria-label="Yüzen Çubuğu Gizle" title="Çubuğu Gizle">✕</button>
          </div>
        </div>
      `;
      document.body.appendChild(bar);

      document.getElementById('moliFloatDraw1Btn').addEventListener('click', (e) => {
        e.stopPropagation();
        startFloatingQuickDraw(1);
      });
      document.getElementById('moliFloatDraw2Btn').addEventListener('click', (e) => {
        e.stopPropagation();
        startFloatingQuickDraw(2);
      });
      document.getElementById('moliFloatOpenLeagueBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        openStudentPicker('league');
      });
      document.getElementById('moliFloatCloseBarBtn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFloatingBar(false);
      });

      renderFloatingContestantsArea();
    }
  }

  // =========================================================================
  // 2) TAM EKRAN KURA ÇEKİMİ (2.5 Saniye Heyecanlı Dönüş)
  // =========================================================================
  function startStudentDraw() {
    if (state.isDrawing) return;

    const textarea = document.getElementById('moliPickerTextarea');
    if (textarea) {
      const currentList = parseStudentTextarea(textarea.value);
      if (currentList.length > 0) {
        state.students = currentList;
      }
    }

    if (state.students.length === 0) {
      const displayEl = document.getElementById('moliPickerStageName');
      const subEl = document.getElementById('moliPickerStageSub');
      if (displayEl) displayEl.textContent = '📋 Liste Boş!';
      if (subEl) subEl.textContent = 'Lütfen sol taraftan sınıf listesi fotoğrafı yükleyin veya isimleri yazın.';
      return;
    }

    let pool = getRemainingStudents();
    if (pool.length === 0) {
      state.drawnSet.clear();
      persistDrawnState();
      pool = state.students.slice();
    }

    state.isDrawing = true;
    const drawBtn = document.getElementById('moliPickerDrawBtn');
    const displayEl = document.getElementById('moliPickerStageName');
    const subEl = document.getElementById('moliPickerStageSub');
    const cardEl = document.getElementById('moliPickerStageCard');
    const quickScoreRow = document.getElementById('moliPickerStageQuickScore');

    if (quickScoreRow) quickScoreRow.style.display = 'none';
    if (drawBtn) {
      drawBtn.disabled = true;
      drawBtn.innerHTML = `<span aria-hidden="true">🎰</span> <span>KURA ÇEKİLİYOR...</span>`;
    }
    if (cardEl) {
      cardEl.classList.remove('is-winner');
      cardEl.classList.add('is-rolling');
    }
    if (subEl) {
      subEl.textContent = '✨ İsimler dönüyor... Şanslı öğrenci kim olacak?';
    }

    const winnerIndex = Math.floor(Math.random() * pool.length);
    const winnerName = pool[winnerIndex];

    const delays = [
      55, 55, 60, 60, 65, 70, 75, 80, 90, 100,
      115, 130, 145, 165, 190, 220, 255, 295, 340
    ];
    let step = 0;
    let lastShown = '';

    function runRollStep() {
      if (!state.isOpen) {
        state.isDrawing = false;
        return;
      }

      if (step < delays.length) {
        const ratio = step / delays.length;
        let candidate = pool[Math.floor(Math.random() * pool.length)];
        if (pool.length > 1 && candidate === lastShown) {
          candidate = pool[(pool.indexOf(candidate) + 1) % pool.length];
        }
        lastShown = candidate;

        if (displayEl) {
          displayEl.textContent = candidate;
        }
        playPickerTickSound(ratio);

        const waitMs = delays[step];
        step += 1;
        state.drawTimer = setTimeout(runRollStep, waitMs);
      } else {
        state.isDrawing = false;
        state.selectedStudent = winnerName;
        state.activeContestants = [winnerName];
        if (state.noRepeat) {
          state.drawnSet.add(winnerName);
          persistDrawnState();
        }

        if (cardEl) {
          cardEl.classList.remove('is-rolling');
          cardEl.classList.add('is-winner');
        }
        if (displayEl) {
          displayEl.textContent = `🎉 ${winnerName}`;
        }
        if (subEl) {
          subEl.textContent = `👏 Tebrikler! Söz hakkı şanslı öğrencimizde! (Mevcut Puanı: ${getStudentScore(winnerName)}p)`;
        }
        if (quickScoreRow) {
          quickScoreRow.style.display = 'flex';
        }
        if (drawBtn) {
          drawBtn.disabled = false;
          drawBtn.innerHTML = `<span aria-hidden="true">🎲</span> <span>KURA ÇEK</span>`;
        }

        updatePickerStatusUI();
        renderFloatingContestantsArea();
        playWinnerApplauseAndFanfare();
        launchPickerConfetti();
        speakStudentName(winnerName);
      }
    }

    runRollStep();
  }

  // =========================================================================
  // 3) 🏆 SINIF LİGİ PUAN TABLOSU (BİREYSEL KÜRSÜ & 3 TAKIM LİGİ)
  // =========================================================================
  function getStudentTeamMeta(studentName) {
    const idx = Math.max(0, state.students.indexOf(studentName));
    return TEAMS_META[idx % TEAMS_META.length];
  }

  function renderLeagueTab() {
    const container = document.getElementById('moliPickerLeagueContainer');
    if (!container) return;

    const ranked = state.students.map((name, idx) => ({
      name,
      score: getStudentScore(name),
      team: TEAMS_META[idx % TEAMS_META.length]
    })).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name, 'tr');
    });

    const isTeamView = state.leagueViewMode === 'teams';

    let bodyHtml = '';
    if (!isTeamView) {
      const first = ranked[0] || null;
      const second = ranked[1] || null;
      const third = ranked[2] || null;
      const rest = ranked.slice(3);

      const podiumCard = (item, rankNum, medalEmoji, medalClass) => {
        if (!item) return `<div class="msp-podium-col ${medalClass} is-empty"></div>`;
        return `
          <div class="msp-podium-col ${medalClass}">
            <div class="msp-podium-medal">${medalEmoji}</div>
            <div class="msp-podium-rank">${rankNum}. Sıra</div>
            <div class="msp-podium-name">${escapeHtml(item.name)}</div>
            <div class="msp-podium-team" style="background:${item.team.bg};color:${item.team.text};border-color:${item.team.border};">
              ${item.team.badge}
            </div>
            <div class="msp-podium-score">${item.score} <span>Puan</span></div>
            <div class="msp-podium-quick-pts">
              <button class="msp-mini-pts-btn" type="button" data-league-pts="5" data-student="${escapeHtml(item.name)}">+5</button>
              <button class="msp-mini-pts-btn is-ten" type="button" data-league-pts="10" data-student="${escapeHtml(item.name)}">+10</button>
            </div>
          </div>
        `;
      };

      const restRowsHtml = rest.map((item, idx) => `
        <div class="msp-league-row">
          <div class="msp-row-left">
            <span class="msp-row-rank">#${idx + 4}</span>
            <span class="msp-row-name">${escapeHtml(item.name)}</span>
            <span class="msp-row-team-tag" style="background:${item.team.bg};color:${item.team.text};border-color:${item.team.border};">
              ${item.team.badge}
            </span>
          </div>
          <div class="msp-row-right">
            <strong class="msp-row-score">${item.score} Puan</strong>
            <button class="msp-mini-pts-btn" type="button" data-league-pts="5" data-student="${escapeHtml(item.name)}">+5</button>
            <button class="msp-mini-pts-btn is-ten" type="button" data-league-pts="10" data-student="${escapeHtml(item.name)}">+10</button>
          </div>
        </div>
      `).join('');

      bodyHtml = `
        <!-- 1. - 2. - 3. Madalya Kürsüsü -->
        <div class="msp-podium-grid">
          ${podiumCard(second, 2, '🥈', 'is-silver')}
          ${podiumCard(first, 1, '🥇', 'is-gold')}
          ${podiumCard(third, 3, '🥉', 'is-bronze')}
        </div>

        <!-- Diğer Öğrenciler Sıralaması -->
        <div class="msp-league-list">
          ${restRowsHtml || '<div class="msp-chips-empty">Tüm öğrenciler kürsüde yer alıyor.</div>'}
        </div>
      `;
    } else {
      // 🚩 Takım Ligi Görünümü (Pedagojik Mod: Mavi, Turuncu, Yeşil Takımlar)
      const teamsData = TEAMS_META.map((tm, tIdx) => {
        const members = state.students
          .filter((_, sIdx) => sIdx % TEAMS_META.length === tIdx)
          .map((name) => ({ name, score: getStudentScore(name) }))
          .sort((a, b) => b.score - a.score);
        const totalScore = members.reduce((sum, m) => sum + m.score, 0);
        return {
          ...tm,
          members,
          totalScore
        };
      }).sort((a, b) => b.totalScore - a.totalScore);

      const teamCardsHtml = teamsData.map((tm, rankIdx) => {
        const medal = rankIdx === 0 ? '🥇' : (rankIdx === 1 ? '🥈' : '🥉');
        const membersHtml = tm.members.map((m) => `
          <div class="msp-team-member-row">
            <span class="msp-tm-name">${escapeHtml(m.name)}</span>
            <div class="msp-tm-actions">
              <strong class="msp-tm-score">${m.score}p</strong>
              <button class="msp-mini-pts-btn" type="button" data-league-pts="5" data-student="${escapeHtml(m.name)}">+5</button>
              <button class="msp-mini-pts-btn is-ten" type="button" data-league-pts="10" data-student="${escapeHtml(m.name)}">+10</button>
            </div>
          </div>
        `).join('');

        return `
          <div class="msp-team-card" style="border-color:${tm.border};">
            <div class="msp-team-card-head" style="background:${tm.bg};color:${tm.text};">
              <div class="msp-team-title-row">
                <span class="msp-team-medal">${medal}</span>
                <h4 class="msp-team-name">${escapeHtml(tm.name)}</h4>
              </div>
              <div class="msp-team-total">${tm.totalScore} <span>Toplam Puan</span></div>
            </div>
            <div class="msp-team-members-list">
              ${membersHtml || '<div class="msp-chips-empty">Üye yok</div>'}
            </div>
          </div>
        `;
      }).join('');

      bodyHtml = `
        <div class="msp-teams-grid">
          ${teamCardsHtml}
        </div>
      `;
    }

    container.innerHTML = `
      <div class="msp-league-toolbar">
        <div class="msp-league-mode-switch" role="tablist" aria-label="Sınıf Ligi Görünüm Modu">
          <button class="msp-mode-btn ${!isTeamView ? 'is-active' : ''}" type="button" id="moliLeagueModeIndBtn">
            👤 Bireysel Kürsü
          </button>
          <button class="msp-mode-btn ${isTeamView ? 'is-active' : ''}" type="button" id="moliLeagueModeTeamBtn">
            🚩 Takım Ligi (3 Takım)
          </button>
        </div>

        <button class="msp-reset-scores-btn" type="button" id="moliLeagueResetScoresBtn">
          🔄 Puanları Sıfırla
        </button>
      </div>

      ${bodyHtml}
    `;

    const indBtn = document.getElementById('moliLeagueModeIndBtn');
    const teamBtn = document.getElementById('moliLeagueModeTeamBtn');
    const resetScoresBtn = document.getElementById('moliLeagueResetScoresBtn');

    if (indBtn) {
      indBtn.addEventListener('click', () => {
        state.leagueViewMode = 'individual';
        renderLeagueTab();
      });
    }
    if (teamBtn) {
      teamBtn.addEventListener('click', () => {
        state.leagueViewMode = 'teams';
        renderLeagueTab();
      });
    }
    if (resetScoresBtn) {
      resetScoresBtn.addEventListener('click', resetAllLeagueScores);
    }

    container.querySelectorAll('[data-league-pts]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const student = btn.getAttribute('data-student');
        const pts = parseInt(btn.getAttribute('data-league-pts'), 10) || 5;
        addStudentPoints(student, pts, btn);
      });
    });
  }

  function switchModalTab(tabId) {
    state.activeModalTab = tabId === 'league' ? 'league' : 'picker';
    const pickerView = document.getElementById('moliPickerTabViewPicker');
    const leagueView = document.getElementById('moliPickerTabViewLeague');

    if (pickerView) pickerView.style.display = state.activeModalTab === 'picker' ? 'grid' : 'none';
    if (leagueView) leagueView.style.display = state.activeModalTab === 'league' ? 'flex' : 'none';

    document.querySelectorAll(`#${MODAL_ID} .msp-nav-tab`).forEach((btn) => {
      const active = btn.getAttribute('data-modal-tab') === state.activeModalTab;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    if (state.activeModalTab === 'league') {
      renderLeagueTab();
    }
  }

  // Dinamik Tesseract.js v5 CDN Yükleyici
  function ensureTesseractLoaded() {
    if (window.Tesseract && typeof window.Tesseract.recognize === 'function') {
      return Promise.resolve(window.Tesseract);
    }
    if (state.tesseractPromise) {
      return state.tesseractPromise;
    }

    state.tesseractPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = TESSERACT_CDN_URL;
      script.async = true;
      script.onload = () => {
        if (window.Tesseract) {
          resolve(window.Tesseract);
        } else {
          state.tesseractPromise = null;
          reject(new Error('Tesseract.js yüklenemedi.'));
        }
      };
      script.onerror = () => {
        state.tesseractPromise = null;
        reject(new Error('Tesseract CDN bağlantısı kurulamadı.'));
      };
      document.head.appendChild(script);
    });

    return state.tesseractPromise;
  }

  function setOcrProgressUI(visible, statusText, percent) {
    const wrap = document.getElementById('moliPickerOcrProgressWrap');
    const label = document.getElementById('moliPickerOcrStatusText');
    const bar = document.getElementById('moliPickerOcrProgressBar');
    if (!wrap) return;

    wrap.style.display = visible ? 'flex' : 'none';
    if (label && statusText) label.textContent = statusText;
    if (bar && typeof percent === 'number') {
      const clamped = Math.max(5, Math.min(100, Math.round(percent)));
      bar.style.width = `${clamped}%`;
    }
  }

  async function handlePhotoFileSelected(file) {
    if (!file || state.ocrLoading) return;
    state.ocrLoading = true;
    setOcrProgressUI(true, '🔍 Liste okunuyor... (Türkçe OCR motoru hazırlanıyor)', 12);

    try {
      const Tesseract = await ensureTesseractLoaded();
      setOcrProgressUI(true, '🔍 Fotoğraftaki öğrenci isimleri taranıyor...', 25);

      const result = await Tesseract.recognize(file, 'tur', {
        logger: (m) => {
          if (m && typeof m.progress === 'number') {
            const pct = 20 + Math.round(m.progress * 78);
            const msg = m.status === 'recognizing text'
              ? `🔍 Liste okunuyor... (%${Math.round(m.progress * 100)})`
              : '🔍 Türkçe dil modeli hazırlanıyor...';
            setOcrProgressUI(true, msg, pct);
          }
        }
      });

      const rawText = (result && result.data && result.data.text) ? result.data.text : '';
      const extractedNames = parseStudentTextarea(rawText);

      if (extractedNames.length > 0) {
        const textarea = document.getElementById('moliPickerTextarea');
        if (textarea) {
          textarea.value = extractedNames.join('\n');
        }
        state.drawnSet.clear();
        saveStudentsToStorage(true);
        setOcrProgressUI(true, `✅ Fotoğraftan ${extractedNames.length} öğrenci ismi başarıyla aktarıldı!`, 100);
        setTimeout(() => setOcrProgressUI(false, '', 0), 3200);
      } else {
        setOcrProgressUI(true, '⚠️ Fotoğrafta okunaklı isim bulunamadı. Daha net bir fotoğraf deneyin veya elle yazın.', 100);
        setTimeout(() => setOcrProgressUI(false, '', 0), 4000);
      }
    } catch (err) {
      setOcrProgressUI(true, '⚠️ Fotoğraf okunurken bağlantı hatası oluştu. İsimleri kutuya yapıştırabilirsiniz.', 100);
      setTimeout(() => setOcrProgressUI(false, '', 0), 4000);
    } finally {
      state.ocrLoading = false;
    }
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      /* =====================================================================
         1) HER OYUNUN ÜSTÜNDE ÇALIŞAN YÜZEN KURA BUTONU & YARIŞMACI ÇUBUĞU
         ===================================================================== */
      #${FLOATING_FAB_ID} {
        position: fixed;
        right: 16px;
        bottom: 68px;
        z-index: 100001;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        border-radius: 999px;
        border: 2.5px solid #FDE047;
        border-bottom: 5px solid #B45309;
        background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
        color: #FFFFFF;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.96rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 10px 26px rgba(109, 40, 217, 0.5);
        user-select: none;
        touch-action: manipulation;
        transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
      }
      #${FLOATING_FAB_ID}:hover {
        transform: translateY(-2px) scale(1.03);
        box-shadow: 0 14px 30px rgba(109, 40, 217, 0.65);
      }
      #${FLOATING_FAB_ID}.is-active {
        background: linear-gradient(135deg, #F59E0B 0%, #EA580C 100%);
        border-color: #FFFFFF;
        border-bottom-color: #9A3412;
      }

      #${FLOATING_BAR_ID} {
        position: fixed;
        top: 8px;
        left: 50%;
        transform: translate(-50%, -140%);
        z-index: 100000;
        width: min(96vw, 1220px);
        background: rgba(15, 23, 42, 0.93);
        border: 2.5px solid rgba(253, 224, 71, 0.65);
        border-radius: 20px;
        padding: 8px 14px;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
        backdrop-filter: blur(12px);
        font-family: 'Nunito', 'Fredoka', sans-serif;
        color: #F8FAFC;
        opacity: 0;
        pointer-events: none;
        transition: transform 0.24s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.18s ease;
      }
      #${FLOATING_BAR_ID}.is-open {
        transform: translate(-50%, 0);
        opacity: 1;
        pointer-events: auto;
      }
      #${FLOATING_BAR_ID} .mfp-bar-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
      }
      #${FLOATING_BAR_ID} .mfp-draw-actions,
      #${FLOATING_BAR_ID} .mfp-right-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      #${FLOATING_BAR_ID} .mfp-action-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 13px;
        border-radius: 12px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.88rem;
        font-weight: 700;
        cursor: pointer;
        border: 2px solid transparent;
        touch-action: manipulation;
        transition: transform 0.12s ease;
      }
      #${FLOATING_BAR_ID} .mfp-action-btn:hover {
        transform: translateY(-1px);
      }
      #${FLOATING_BAR_ID} .mfp-action-btn.is-draw1 {
        background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
        border-color: #FDE047;
        color: #FFFFFF;
      }
      #${FLOATING_BAR_ID} .mfp-action-btn.is-draw2 {
        background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%);
        border-color: #BAE6FD;
        color: #FFFFFF;
      }
      #${FLOATING_BAR_ID} .mfp-action-btn.is-league {
        background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
        border-color: #DDD6FE;
        color: #FFFFFF;
      }
      #${FLOATING_BAR_ID} .mfp-close-bar-btn {
        width: 32px;
        height: 32px;
        border-radius: 10px;
        border: 1.5px solid rgba(255, 255, 255, 0.25);
        background: rgba(255, 255, 255, 0.12);
        color: #F8FAFC;
        font-weight: 800;
        cursor: pointer;
      }

      #${FLOATING_BAR_ID} .mfp-contestants-area {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        flex-wrap: wrap;
        min-width: 240px;
      }
      #${FLOATING_BAR_ID} .mfp-empty-hint {
        font-size: 0.84rem;
        font-weight: 700;
        color: #CBD5E1;
        text-align: center;
      }
      #${FLOATING_BAR_ID} .mfp-contestant-pill {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 5px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.96);
        color: #0F172A;
        border: 2px solid #FACC15;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      }
      #${FLOATING_BAR_ID} .mfp-contestant-pill.is-team1 {
        background: #FEF9C3;
        border-color: #FACC15;
      }
      #${FLOATING_BAR_ID} .mfp-contestant-pill.is-team2 {
        background: #FFEDD5;
        border-color: #FB923C;
      }
      #${FLOATING_BAR_ID} .mfp-badge-tag {
        font-size: 0.8rem;
        font-weight: 800;
        color: #475569;
      }
      #${FLOATING_BAR_ID} .mfp-name {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.98rem;
        font-weight: 700;
        color: #0F172A;
      }
      #${FLOATING_BAR_ID} .mfp-score-chip {
        padding: 2px 8px;
        border-radius: 999px;
        background: #EDE9FE;
        color: #6D28D9;
        font-size: 0.78rem;
        font-weight: 800;
      }
      #${FLOATING_BAR_ID} .mfp-vs-tag {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.88rem;
        font-weight: 800;
        color: #FDE047;
      }
      #${FLOATING_BAR_ID} .mfp-pts-btn,
      .msp-mini-pts-btn {
        padding: 4px 9px;
        border-radius: 8px;
        border: 1.5px solid #16A34A;
        border-bottom: 3px solid #15803D;
        background: linear-gradient(180deg, #22C55E 0%, #16A34A 100%);
        color: #FFFFFF;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
        touch-action: manipulation;
        transition: transform 0.12s ease;
      }
      #${FLOATING_BAR_ID} .mfp-pts-btn.is-plus10,
      .msp-mini-pts-btn.is-ten {
        background: linear-gradient(180deg, #F59E0B 0%, #D97706 100%);
        border-color: #FDE047;
        border-bottom-color: #B45309;
      }
      #${FLOATING_BAR_ID} .mfp-pts-btn.is-pulsing,
      .msp-mini-pts-btn.is-pulsing {
        animation: mfpPulseScore 0.35s ease;
      }
      @keyframes mfpPulseScore {
        0% { transform: scale(1); }
        45% { transform: scale(1.26); }
        100% { transform: scale(1); }
      }

      /* =====================================================================
         2) TAM EKRAN KURA & SINIF LİGİ PENCERESİ (#moli-picker-modal)
         ===================================================================== */
      #${MODAL_ID} {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: none;
        flex-direction: column;
        background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #064E3B 100%);
        color: #0F172A;
        font-family: 'Nunito', 'Fredoka', sans-serif;
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

      /* Üst Başlık ve 2 Sekme Barı */
      #${MODAL_ID} .msp-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 14px;
        padding: 10px 24px;
        background: rgba(255, 255, 255, 0.97);
        border-bottom: 4px solid #CBD5E1;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.28);
        flex-shrink: 0;
      }
      #${MODAL_ID} .msp-brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      #${MODAL_ID} .msp-brand-icon {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        box-shadow: 0 6px 16px rgba(109, 40, 217, 0.35);
      }
      #${MODAL_ID} .msp-brand-title {
        margin: 0;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.1rem, 1.9vw, 1.45rem);
        font-weight: 700;
        color: #1E1B4B;
      }
      #${MODAL_ID} .msp-brand-sub {
        margin: 0;
        font-size: 0.8rem;
        font-weight: 800;
        color: #64748B;
      }

      #${MODAL_ID} .msp-nav-tabs {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      #${MODAL_ID} .msp-nav-tab {
        padding: 9px 18px;
        border-radius: 14px;
        border: 2px solid #CBD5E1;
        border-bottom: 4px solid #94A3B8;
        background: #F8FAFC;
        color: #334155;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.98rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.14s ease;
      }
      #${MODAL_ID} .msp-nav-tab.is-active {
        background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
        border-color: #C4B5FD;
        border-bottom-color: #4C1D95;
        color: #FFFFFF;
        box-shadow: 0 6px 16px rgba(109, 40, 217, 0.35);
      }

      #${MODAL_ID} .msp-close-btn {
        background: #FEF2F2;
        border: 2px solid #FCA5A5;
        border-bottom: 4px solid #EF4444;
        color: #B91C1C;
        border-radius: 14px;
        padding: 9px 18px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.98rem;
        font-weight: 700;
        cursor: pointer;
      }

      /* SEKME 1: 📋 Liste & Kura */
      #${MODAL_ID} .msp-main-grid {
        flex: 1;
        display: grid;
        grid-template-columns: minmax(320px, 410px) 1fr;
        gap: 24px;
        max-width: 1380px;
        width: 100%;
        margin: 0 auto;
        padding: 18px 24px 24px;
        align-items: stretch;
      }

      #${MODAL_ID} .msp-list-panel {
        background: rgba(255, 255, 255, 0.97);
        border: 4px solid #E2E8F0;
        border-bottom: 8px solid #CBD5E1;
        border-radius: 28px;
        padding: 20px;
        box-shadow: 0 22px 50px rgba(0, 0, 0, 0.38);
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      #${MODAL_ID} .msp-panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      #${MODAL_ID} .msp-panel-title {
        margin: 0;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.2rem;
        color: #1E293B;
      }
      #${MODAL_ID} .msp-list-count-badge {
        padding: 5px 12px;
        border-radius: 999px;
        background: #EDE9FE;
        color: #6D28D9;
        font-size: 0.84rem;
        font-weight: 800;
      }

      #${MODAL_ID} .msp-upload-label {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        padding: 13px 16px;
        border-radius: 18px;
        border: 2.5px dashed #0284C7;
        background: linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 100%);
        color: #0369A1;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.02rem;
        font-weight: 700;
        cursor: pointer;
        text-align: center;
      }
      #${MODAL_ID} .msp-upload-input {
        display: none;
      }

      #${MODAL_ID} .msp-ocr-progress-wrap {
        display: none;
        flex-direction: column;
        gap: 6px;
        padding: 10px 12px;
        border-radius: 14px;
        background: #FFFBEB;
        border: 2px solid #FDE68A;
      }
      #${MODAL_ID} .msp-ocr-status-text {
        font-size: 0.84rem;
        font-weight: 800;
        color: #92400E;
      }
      #${MODAL_ID} .msp-ocr-track {
        width: 100%;
        height: 10px;
        border-radius: 999px;
        background: #FEF3C7;
        overflow: hidden;
      }
      #${MODAL_ID} .msp-ocr-bar {
        width: 15%;
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, #F59E0B 0%, #10B981 100%);
        transition: width 0.2s ease;
      }

      #${MODAL_ID} .msp-textarea-hint {
        margin: 0;
        font-size: 0.82rem;
        font-weight: 700;
        color: #64748B;
      }
      #${MODAL_ID} .msp-textarea {
        flex: 1;
        width: 100%;
        min-height: 220px;
        resize: vertical;
        padding: 12px 14px;
        border-radius: 18px;
        border: 2.5px solid #CBD5E1;
        background: #F8FAFC;
        color: #0F172A;
        font-family: 'Nunito', sans-serif;
        font-size: 0.98rem;
        font-weight: 800;
        line-height: 1.55;
        user-select: text;
        -webkit-user-select: text;
      }

      #${MODAL_ID} .msp-save-btn {
        width: 100%;
        padding: 14px 18px;
        border-radius: 18px;
        border: 2px solid #059669;
        border-bottom: 5px solid #047857;
        background: linear-gradient(180deg, #10B981 0%, #059669 100%);
        color: #FFFFFF;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.08rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      #${MODAL_ID} .msp-save-feedback {
        display: none;
        padding: 8px 12px;
        border-radius: 12px;
        background: #DCFCE7;
        color: #166534;
        font-size: 0.86rem;
        font-weight: 800;
        text-align: center;
      }
      #${MODAL_ID} .msp-save-feedback.is-visible {
        display: block;
      }

      #${MODAL_ID} .msp-stage-panel {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.06) 100%);
        border: 3px solid rgba(255, 255, 255, 0.25);
        border-radius: 32px;
        padding: 26px;
        box-shadow: 0 26px 65px rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(10px);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        gap: 18px;
      }
      #${MODAL_ID} .msp-stage-top-bar {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
      }
      #${MODAL_ID} .msp-remaining-badge {
        padding: 10px 20px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.95);
        color: #1E1B4B;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.12rem;
        font-weight: 700;
      }
      #${MODAL_ID} .msp-controls-right {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
      }
      #${MODAL_ID} .msp-norepeat-label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.94);
        color: #1E293B;
        font-size: 0.96rem;
        font-weight: 800;
        cursor: pointer;
      }
      #${MODAL_ID} .msp-norepeat-label input[type="checkbox"] {
        width: 20px;
        height: 20px;
        accent-color: #8B5CF6;
      }
      #${MODAL_ID} .msp-reset-btn {
        padding: 10px 18px;
        border-radius: 16px;
        border: 2px solid #7DD3FC;
        border-bottom: 4px solid #0284C7;
        background: #E0F2FE;
        color: #0369A1;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.98rem;
        font-weight: 700;
        cursor: pointer;
      }

      #${MODAL_ID} .msp-stage-card {
        width: 100%;
        flex: 1;
        min-height: 230px;
        border-radius: 32px;
        background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
        border: 6px solid #C4B5FD;
        border-bottom: 12px solid #8B5CF6;
        padding: 28px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 12px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.42);
      }
      #${MODAL_ID} .msp-stage-card.is-rolling {
        border-color: #FDE047;
        border-bottom-color: #F59E0B;
        background: linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 100%);
      }
      #${MODAL_ID} .msp-stage-card.is-winner {
        border-color: #4ADE80;
        border-bottom-color: #16A34A;
        background: linear-gradient(135deg, #ECFDF5 0%, #FEFCE8 100%);
      }
      #${MODAL_ID} .msp-moli-host {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 16px;
        border-radius: 999px;
        background: #EEF2FF;
        color: #4338CA;
        font-size: 0.92rem;
        font-weight: 800;
      }
      #${MODAL_ID} .msp-stage-name {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(2.3rem, 5.2vw, 4.4rem);
        font-weight: 700;
        color: #0F172A;
        line-height: 1.15;
      }
      #${MODAL_ID} .msp-stage-sub {
        font-size: 1.05rem;
        font-weight: 800;
        color: #475569;
      }
      #${MODAL_ID} .msp-stage-quick-score {
        display: none;
        align-items: center;
        gap: 10px;
        margin-top: 4px;
      }

      #${MODAL_ID} .msp-draw-btn {
        width: 100%;
        max-width: 520px;
        padding: 18px 36px;
        border-radius: 26px;
        border: 4px solid #FDE047;
        border-bottom: 8px solid #B45309;
        background: linear-gradient(180deg, #F59E0B 0%, #EA580C 100%);
        color: #FFFFFF;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.45rem, 2.6vw, 2rem);
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        box-shadow: 0 16px 38px rgba(234, 88, 12, 0.55);
      }

      #${MODAL_ID} .msp-drawn-box {
        width: 100%;
        background: rgba(15, 23, 42, 0.55);
        border: 2px solid rgba(255, 255, 255, 0.18);
        border-radius: 20px;
        padding: 12px 16px;
      }
      #${MODAL_ID} .msp-drawn-title {
        font-size: 0.82rem;
        font-weight: 800;
        color: #CBD5E1;
        margin-bottom: 8px;
      }
      #${MODAL_ID} .msp-drawn-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        max-height: 84px;
        overflow-y: auto;
      }
      #${MODAL_ID} .msp-drawn-chip {
        padding: 5px 12px;
        border-radius: 999px;
        background: rgba(34, 197, 94, 0.22);
        border: 1.5px solid #4ADE80;
        color: #F0FDF4;
        font-size: 0.86rem;
        font-weight: 800;
      }
      #${MODAL_ID} .msp-chips-empty {
        font-size: 0.86rem;
        font-weight: 700;
        color: #94A3B8;
      }

      /* =====================================================================
         3) SEKME 2: 🏆 SINIF LİGİ PUAN TABLOSU (KÜRSÜ & TAKIM LİGİ)
         ===================================================================== */
      #${MODAL_ID} .msp-league-view {
        flex: 1;
        display: none;
        flex-direction: column;
        max-width: 1280px;
        width: 100%;
        margin: 0 auto;
        padding: 20px 24px 30px;
        gap: 20px;
      }
      #${MODAL_ID} .msp-league-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
        background: rgba(255, 255, 255, 0.96);
        padding: 12px 18px;
        border-radius: 20px;
        border: 3px solid #E2E8F0;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);
      }
      #${MODAL_ID} .msp-league-mode-switch {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #${MODAL_ID} .msp-mode-btn {
        padding: 9px 18px;
        border-radius: 14px;
        border: 2px solid #CBD5E1;
        background: #F8FAFC;
        color: #334155;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.96rem;
        font-weight: 700;
        cursor: pointer;
      }
      #${MODAL_ID} .msp-mode-btn.is-active {
        background: linear-gradient(135deg, #F59E0B 0%, #EA580C 100%);
        border-color: #FDE047;
        color: #FFFFFF;
        box-shadow: 0 5px 14px rgba(234, 88, 12, 0.35);
      }
      #${MODAL_ID} .msp-reset-scores-btn {
        padding: 9px 16px;
        border-radius: 14px;
        border: 2px solid #FCA5A5;
        border-bottom: 4px solid #EF4444;
        background: #FEF2F2;
        color: #B91C1C;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.92rem;
        font-weight: 700;
        cursor: pointer;
      }

      /* 1. - 2. - 3. Kürsüsü */
      #${MODAL_ID} .msp-podium-grid {
        display: grid;
        grid-template-columns: 1fr 1.15fr 1fr;
        align-items: end;
        gap: 18px;
        margin-top: 6px;
      }
      #${MODAL_ID} .msp-podium-col {
        background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
        border: 4px solid #CBD5E1;
        border-bottom-width: 10px;
        border-radius: 26px;
        padding: 20px 16px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        box-shadow: 0 20px 44px rgba(0, 0, 0, 0.35);
      }
      #${MODAL_ID} .msp-podium-col.is-gold {
        background: linear-gradient(180deg, #FFFBEB 0%, #FEF08A 100%);
        border-color: #FACC15;
        border-bottom-color: #CA8A04;
        min-height: 265px;
        transform: translateY(-8px);
      }
      #${MODAL_ID} .msp-podium-col.is-silver {
        background: linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 100%);
        border-color: #94A3B8;
        border-bottom-color: #64748B;
        min-height: 230px;
      }
      #${MODAL_ID} .msp-podium-col.is-bronze {
        background: linear-gradient(180deg, #FFF7ED 0%, #FED7AA 100%);
        border-color: #FB923C;
        border-bottom-color: #C2410C;
        min-height: 215px;
      }
      #${MODAL_ID} .msp-podium-medal {
        font-size: 3rem;
        line-height: 1;
      }
      #${MODAL_ID} .msp-podium-rank {
        font-size: 0.82rem;
        font-weight: 800;
        color: #64748B;
        text-transform: uppercase;
      }
      #${MODAL_ID} .msp-podium-name {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.4rem;
        font-weight: 700;
        color: #0F172A;
      }
      #${MODAL_ID} .msp-podium-team {
        padding: 3px 10px;
        border-radius: 999px;
        border: 1.5px solid;
        font-size: 0.76rem;
        font-weight: 800;
      }
      #${MODAL_ID} .msp-podium-score {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.75rem;
        font-weight: 700;
        color: #15803D;
      }
      #${MODAL_ID} .msp-podium-score span {
        font-size: 0.92rem;
      }
      #${MODAL_ID} .msp-podium-quick-pts {
        display: flex;
        gap: 6px;
        margin-top: 4px;
      }

      /* Diğer Öğrenciler Liste Satırları */
      #${MODAL_ID} .msp-league-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 12px;
        margin-top: 12px;
      }
      #${MODAL_ID} .msp-league-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        background: rgba(255, 255, 255, 0.96);
        border: 2.5px solid #E2E8F0;
        border-bottom: 5px solid #CBD5E1;
        border-radius: 18px;
        padding: 12px 16px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.22);
      }
      #${MODAL_ID} .msp-row-left,
      #${MODAL_ID} .msp-row-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #${MODAL_ID} .msp-row-rank {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1rem;
        font-weight: 700;
        color: #64748B;
        min-width: 30px;
      }
      #${MODAL_ID} .msp-row-name {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.08rem;
        font-weight: 700;
        color: #0F172A;
      }
      #${MODAL_ID} .msp-row-team-tag {
        padding: 2px 8px;
        border-radius: 999px;
        border: 1.5px solid;
        font-size: 0.72rem;
        font-weight: 800;
      }
      #${MODAL_ID} .msp-row-score {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.08rem;
        color: #047857;
        margin-right: 4px;
      }

      /* 🚩 3 Takım Ligi Görünümü */
      #${MODAL_ID} .msp-teams-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin-top: 8px;
      }
      #${MODAL_ID} .msp-team-card {
        background: rgba(255, 255, 255, 0.97);
        border: 4px solid;
        border-bottom-width: 10px;
        border-radius: 26px;
        overflow: hidden;
        box-shadow: 0 20px 44px rgba(0, 0, 0, 0.35);
        display: flex;
        flex-direction: column;
      }
      #${MODAL_ID} .msp-team-card-head {
        padding: 18px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 2px solid rgba(15, 23, 42, 0.08);
      }
      #${MODAL_ID} .msp-team-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      #${MODAL_ID} .msp-team-medal {
        font-size: 1.8rem;
      }
      #${MODAL_ID} .msp-team-name {
        margin: 0;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.25rem;
      }
      #${MODAL_ID} .msp-team-total {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.55rem;
        font-weight: 700;
      }
      #${MODAL_ID} .msp-team-total span {
        display: block;
        font-size: 0.72rem;
        font-weight: 800;
        opacity: 0.85;
      }
      #${MODAL_ID} .msp-team-members-list {
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      #${MODAL_ID} .msp-team-member-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-radius: 12px;
        background: #F8FAFC;
        border: 1.5px solid #E2E8F0;
      }
      #${MODAL_ID} .msp-tm-name {
        font-weight: 800;
        color: #1E293B;
      }
      #${MODAL_ID} .msp-tm-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      #${MODAL_ID} .msp-tm-score {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        color: #047857;
        margin-right: 4px;
      }

      /* Sandwich Menü (☰) İçindeki Buton Vurgusu */
      #${SIDEBAR_BTN_ID} {
        background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%) !important;
        border: 1.5px solid #F59E0B !important;
        border-bottom: 3.5px solid #D97706 !important;
        color: #92400E !important;
        font-weight: 800 !important;
      }

      @media (max-width: 960px) {
        #${MODAL_ID} .msp-main-grid,
        #${MODAL_ID} .msp-podium-grid,
        #${MODAL_ID} .msp-teams-grid {
          grid-template-columns: 1fr;
        }
        #${MODAL_ID} .msp-stage-panel {
          order: 1;
        }
        #${MODAL_ID} .msp-list-panel {
          order: 2;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function buildModal() {
    if (document.getElementById(MODAL_ID)) return;
    injectStyles();
    loadStoredState();

    const modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Öğrenci Kura ve Sınıf Ligi Sistemi');

    modal.innerHTML = `
      <header class="msp-topbar">
        <div class="msp-brand">
          <div class="msp-brand-icon" aria-hidden="true">🎲</div>
          <div>
            <h2 class="msp-brand-title">🎲 Öğrenci Kura &amp; 🏆 Sınıf Ligi</h2>
            <p class="msp-brand-sub">Fotoğraftan Sınıf Listesi (OCR) • Heyecanlı Kura • Sınıf Ligi Puan Tablosu</p>
          </div>
        </div>

        <nav class="msp-nav-tabs" role="tablist" aria-label="Kura ve Sınıf Ligi Sekmeleri">
          <button class="msp-nav-tab is-active" type="button" role="tab" data-modal-tab="picker" aria-selected="true">
            📋 Liste &amp; Kura
          </button>
          <button class="msp-nav-tab" type="button" role="tab" data-modal-tab="league" aria-selected="false">
            🏆 Sınıf Ligi
          </button>
        </nav>

        <button class="msp-close-btn" id="moliPickerCloseBtn" type="button" aria-label="Pencereyi Kapat">✕ Kapat</button>
      </header>

      <!-- SEKME 1: 📋 LİSTE & KURA -->
      <main class="msp-main-grid" id="moliPickerTabViewPicker">
        <aside class="msp-list-panel" aria-label="Sınıf Listesi Yönetimi">
          <div class="msp-panel-head">
            <h3 class="msp-panel-title">📋 Sınıf Listesi</h3>
            <span class="msp-list-count-badge" id="moliPickerListCountBadge">${state.students.length} Öğrenci</span>
          </div>

          <label class="msp-upload-label" for="moliPickerPhotoInput">
            <span aria-hidden="true">📷</span>
            <span>Liste Fotoğrafı Yükle / Çek</span>
            <input class="msp-upload-input" id="moliPickerPhotoInput" type="file" accept="image/*" capture="environment">
          </label>

          <div class="msp-ocr-progress-wrap" id="moliPickerOcrProgressWrap" aria-live="polite">
            <div class="msp-ocr-status-text" id="moliPickerOcrStatusText">🔍 Liste okunuyor...</div>
            <div class="msp-ocr-track">
              <div class="msp-ocr-bar" id="moliPickerOcrProgressBar"></div>
            </div>
          </div>

          <p class="msp-textarea-hint">
            Her satıra bir öğrenci adı yazın veya E-Okul / yoklama listesini yapıştırın (numaralar otomatik temizlenir):
          </p>

          <textarea class="msp-textarea" id="moliPickerTextarea" spellcheck="false" placeholder="Her satıra bir öğrenci adı...">${escapeHtml(state.students.join('\n'))}</textarea>

          <button class="msp-save-btn" id="moliPickerSaveBtn" type="button">
            <span aria-hidden="true">💾</span>
            <span>Listeyi Kaydet</span>
          </button>

          <div class="msp-save-feedback" id="moliPickerSaveFeedback" aria-live="polite"></div>
        </aside>

        <section class="msp-stage-panel" aria-label="Akıllı Tahta Kura Ekranı">
          <div class="msp-stage-top-bar">
            <div class="msp-remaining-badge" id="moliPickerRemainingBadge">
              👥 Kalan: <strong>${state.students.length} / ${state.students.length}</strong>
            </div>

            <div class="msp-controls-right">
              <label class="msp-norepeat-label" for="moliPickerNoRepeatChk">
                <input type="checkbox" id="moliPickerNoRepeatChk" ${state.noRepeat ? 'checked' : ''}>
                <span>☑️ Çıkan öğrenci tekrar çıkmasın</span>
              </label>

              <button class="msp-reset-btn" id="moliPickerResetRoundBtn" type="button">
                🔄 Turu Sıfırla
              </button>
            </div>
          </div>

          <div class="msp-stage-card" id="moliPickerStageCard" aria-live="polite">
            <div class="msp-moli-host">
              <img src="assets/mascot/moli.webp" alt="Moli" width="32" height="32" style="object-fit:contain;">
              <span>Moli Şanslı Öğrenci Kurası</span>
            </div>
            <div class="msp-stage-name" id="moliPickerStageName">🎲 Kura Hazır!</div>
            <div class="msp-stage-sub" id="moliPickerStageSub">
              Aşağıdaki <strong>"🎲 KURA ÇEK"</strong> butonuna dokunarak şanslı öğrenciyi belirleyin!
            </div>
            <div class="msp-stage-quick-score" id="moliPickerStageQuickScore">
              <button class="msp-mini-pts-btn" type="button" id="moliStageAdd5Btn">+5 Puan Ver</button>
              <button class="msp-mini-pts-btn is-ten" type="button" id="moliStageAdd10Btn">+10 Puan Ver</button>
            </div>
          </div>

          <button class="msp-draw-btn" id="moliPickerDrawBtn" type="button">
            <span aria-hidden="true">🎲</span>
            <span>KURA ÇEK</span>
          </button>

          <div class="msp-drawn-box">
            <div class="msp-drawn-title">✅ Bu Turda Seçilen Öğrenciler</div>
            <div class="msp-drawn-chips" id="moliPickerDrawnChips"></div>
          </div>
        </section>
      </main>

      <!-- SEKME 2: 🏆 SINIF LİGİ PUAN TABLOSU -->
      <section class="msp-league-view" id="moliPickerTabViewLeague" aria-label="Sınıf Ligi Puan Tablosu">
        <div id="moliPickerLeagueContainer"></div>
      </section>
    `;

    document.body.appendChild(modal);

    document.getElementById('moliPickerCloseBtn').addEventListener('click', closeStudentPicker);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeStudentPicker();
      }
    });

    modal.querySelectorAll('.msp-nav-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-modal-tab');
        switchModalTab(tab);
      });
    });

    const photoInput = document.getElementById('moliPickerPhotoInput');
    if (photoInput) {
      photoInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          handlePhotoFileSelected(file);
        }
        photoInput.value = '';
      });
    }

    const saveBtn = document.getElementById('moliPickerSaveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => saveStudentsToStorage(true));
    }

    const noRepeatChk = document.getElementById('moliPickerNoRepeatChk');
    if (noRepeatChk) {
      noRepeatChk.addEventListener('change', (e) => {
        state.noRepeat = !!e.target.checked;
        persistDrawnState();
        updatePickerStatusUI();
      });
    }

    const resetBtn = document.getElementById('moliPickerResetRoundBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetRound);
    }

    const drawBtn = document.getElementById('moliPickerDrawBtn');
    if (drawBtn) {
      drawBtn.addEventListener('click', startStudentDraw);
    }

    const stageAdd5 = document.getElementById('moliStageAdd5Btn');
    const stageAdd10 = document.getElementById('moliStageAdd10Btn');
    if (stageAdd5) {
      stageAdd5.addEventListener('click', () => {
        if (state.selectedStudent) {
          addStudentPoints(state.selectedStudent, 5, stageAdd5);
          const subEl = document.getElementById('moliPickerStageSub');
          if (subEl) subEl.textContent = `👏 ${state.selectedStudent} +5 puan kazandı! (Toplam: ${getStudentScore(state.selectedStudent)}p)`;
        }
      });
    }
    if (stageAdd10) {
      stageAdd10.addEventListener('click', () => {
        if (state.selectedStudent) {
          addStudentPoints(state.selectedStudent, 10, stageAdd10);
          const subEl = document.getElementById('moliPickerStageSub');
          if (subEl) subEl.textContent = `🏆 ${state.selectedStudent} +10 puan kazandı! (Toplam: ${getStudentScore(state.selectedStudent)}p)`;
        }
      });
    }

    updatePickerStatusUI();
  }

  function openStudentPicker(initialTab) {
    buildModal();
    state.isOpen = true;

    const sidebar = document.getElementById('appSidebar');
    const backdrop = document.getElementById('mobileDrawerBackdrop');
    if (sidebar) sidebar.classList.remove('open', 'active', 'is-open');
    if (backdrop) backdrop.classList.remove('open', 'active', 'is-open');

    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.add('is-open');

    switchModalTab(initialTab === 'league' ? 'league' : 'picker');
    updatePickerStatusUI();
  }

  function closeStudentPicker() {
    state.isOpen = false;
    state.isDrawing = false;
    if (state.drawTimer) {
      clearTimeout(state.drawTimer);
      state.drawTimer = null;
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

  function injectSandwichMenuButton() {
    buildFloatingWidgets();
    const toolsList = document.querySelector('#appSidebar .sidebar-tools-list');
    if (!toolsList || document.getElementById(SIDEBAR_BTN_ID)) return;

    const btn = document.createElement('button');
    btn.className = 'sidebar-tool-btn';
    btn.id = SIDEBAR_BTN_ID;
    btn.type = 'button';
    btn.title = 'Fotoğraftan Sınıf Listesi Yükle, Öğrenci Kurası Çek ve Sınıf Ligi Puan Tablosunu Gör';
    btn.innerHTML = `
      <span class="tool-icon" aria-hidden="true">🎲</span>
      <span class="tool-label">🎲 Öğrenci Kura &amp; Lig</span>
    `;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openStudentPicker('picker');
    });

    toolsList.insertBefore(btn, toolsList.firstChild);
  }

  window.openMoliStudentPicker = openStudentPicker;
  window.closeMoliStudentPicker = closeStudentPicker;
  window.toggleMoliFloatingKuraBar = toggleFloatingBar;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSandwichMenuButton);
  } else {
    injectSandwichMenuButton();
  }
})();
