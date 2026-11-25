/**
 * ==========================================================================
 * DERSE Bİ' MOLA - BAĞIMSIZ FOTOĞRAFTAN ÖĞRENCİ LİSTESİ & KURA SİSTEMİ
 * (student_picker.js - 5. Aşama)
 * - Sağ üstteki Sandwich Menünün (☰ / #appSidebar .sidebar-tools-list) içine
 *   "🎲 Öğrenci Kura & Liste" butonu ekler.
 * - Tam ekran bağımsız pencere (#moli-picker-modal, position: fixed; inset: 0; z-index: 99999;)
 * - Tesseract.js v5 CDN ile Türkçe (tur) Fotoğraftan Sınıf Listesi Okuma (OCR)
 * - localStorage kalıcı sınıf listesi ve tur durumu kaydı
 * - 2.5 sn tık-tık sesli heyecanlı kura dönüşü, konfeti, alkış ve MoliVoiceEngine.speak()
 * - "☑️ Çıkan öğrenci tekrar çıkmasın" (varsayılan işaretli) ve "🔄 Turu Sıfırla"
 * app.js ve mevcut oyun dosyalarından tamamen bağımsız çalışır.
 * ==========================================================================
 */
(function () {
  'use strict';

  const MODAL_ID = 'moli-picker-modal';
  const STYLE_ID = 'moli-student-picker-styles';
  const CONFETTI_CANVAS_ID = 'moli-picker-confetti-canvas';
  const SIDEBAR_BTN_ID = 'btnSidebarStudentPicker';
  const STORAGE_KEY_LIST = 'moli_student_picker_list_v1';
  const STORAGE_KEY_DRAWN = 'moli_student_picker_drawn_v1';
  const STORAGE_KEY_NO_REPEAT = 'moli_student_picker_norepeat_v1';
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

  const state = {
    isOpen: false,
    students: [],
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
    const cx = canvas.width * 0.62;
    const cy = canvas.height * 0.44;
    const particles = Array.from({ length: 100 }, () => {
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

  function speakStudentName(studentName) {
    if (!studentName) return;
    const text = `Şanslı öğrencimiz: ${studentName}!`;
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

  // OCR veya elle girilen satırları temizle (okul numaralarını, sıra rakamlarını, sembolleri ayıkla)
  function cleanStudentLine(rawLine) {
    let line = String(rawLine || '').trim();
    if (!line) return '';

    // Baştaki sıra/okul numaralarını ve noktalama işaretlerini temizle (Örn: "12 - 458 Ahmet Yılmaz" -> "Ahmet Yılmaz")
    line = line.replace(/^[\d\s.\-–—_()[\]:/|#*•+]+/, '').trim();
    // Satır sonundaki rakamları veya not sütunlarını temizle
    line = line.replace(/[\d\s.\-–—_()[\]:/|#*•+]+$/, '').trim();
    // Yalnızca Türkçe harfler ve boşluk bırak
    line = line.replace(/[^a-zA-ZçğıöşüÇĞİÖŞÜ\s]/g, ' ').replace(/\s+/g, ' ').trim();

    if (line.length < 2) return '';

    // E-Okul veya yoklama listesi başlık satırlarını filtrele
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

    // Baş harfleri büyük güzel isim formatına çevir
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

  function saveStudentsToStorage(showBadgeFeedback) {
    const textarea = document.getElementById('moliPickerTextarea');
    if (textarea) {
      const parsed = parseStudentTextarea(textarea.value);
      state.students = parsed;
      textarea.value = parsed.join('\n');
    }

    // Silinen öğrencileri drawnSet'ten çıkar
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

  // 2.5 Saniye Boyunca Hızla Dönüp Yavaşlayan Heyecanlı Kura Çekimi
  function startStudentDraw() {
    if (state.isDrawing) return;

    // Önce textarea'da kaydedilmemiş değişiklik varsa senkronize et
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
      // Tüm öğrenciler çıktıysa otomatik yeni tur başlat
      state.drawnSet.clear();
      persistDrawnState();
      pool = state.students.slice();
    }

    state.isDrawing = true;
    const drawBtn = document.getElementById('moliPickerDrawBtn');
    const displayEl = document.getElementById('moliPickerStageName');
    const subEl = document.getElementById('moliPickerStageSub');
    const cardEl = document.getElementById('moliPickerStageCard');

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

    // Şanslı öğrenciyi önceden adil biçimde seç
    const winnerIndex = Math.floor(Math.random() * pool.length);
    const winnerName = pool[winnerIndex];

    // 2.5 saniyelik (2500ms) hızla başlayıp yavaşlayan adım dizisi
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
        // Rastgele bir aday ismi göster (üst üste aynı isim gelmesin)
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
        // Bitiş: Şanslı öğrencide dur!
        state.isDrawing = false;
        state.selectedStudent = winnerName;
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
          subEl.textContent = '👏 Tebrikler! Söz hakkı şanslı öğrencimizde!';
        }
        if (drawBtn) {
          drawBtn.disabled = false;
          drawBtn.innerHTML = `<span aria-hidden="true">🎲</span> <span>KURA ÇEK</span>`;
        }

        updatePickerStatusUI();
        playWinnerApplauseAndFanfare();
        launchPickerConfetti();
        speakStudentName(winnerName);
      }
    }

    runRollStep();
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

      /* Üst Başlık Barı */
      #${MODAL_ID} .msp-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
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
        width: 46px;
        height: 46px;
        border-radius: 14px;
        background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.6rem;
        box-shadow: 0 6px 16px rgba(109, 40, 217, 0.35);
      }
      #${MODAL_ID} .msp-brand-title {
        margin: 0;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.15rem, 2vw, 1.5rem);
        font-weight: 700;
        color: #1E1B4B;
      }
      #${MODAL_ID} .msp-brand-sub {
        margin: 0;
        font-size: 0.84rem;
        font-weight: 800;
        color: #64748B;
      }
      #${MODAL_ID} .msp-close-btn {
        background: #FEF2F2;
        border: 2px solid #FCA5A5;
        border-bottom: 4px solid #EF4444;
        color: #B91C1C;
        border-radius: 14px;
        padding: 9px 18px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.14s ease, background 0.14s ease;
      }
      #${MODAL_ID} .msp-close-btn:hover {
        background: #FEE2E2;
        transform: translateY(-1px);
      }

      /* Ana İçerik: Sol Liste & Fotoğraf OCR Paneli + Sağ Büyük Kura Sahnesi */
      #${MODAL_ID} .msp-main-grid {
        flex: 1;
        display: grid;
        grid-template-columns: minmax(320px, 410px) 1fr;
        gap: 24px;
        max-width: 1380px;
        width: 100%;
        margin: 0 auto;
        padding: 20px 24px 26px;
        align-items: stretch;
      }

      /* Sol Panel: Fotoğraftan OCR & Sınıf Listesi Kayıt */
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
        transition: all 0.15s ease;
      }
      #${MODAL_ID} .msp-upload-label:hover {
        background: #BAE6FD;
        transform: translateY(-1px);
      }
      #${MODAL_ID} .msp-upload-input {
        display: none;
      }

      /* OCR İlerleme Çubuğu */
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
      #${MODAL_ID} .msp-textarea:focus {
        outline: none;
        border-color: #8B5CF6;
        background: #FFFFFF;
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
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.32);
        transition: transform 0.14s ease;
      }
      #${MODAL_ID} .msp-save-btn:hover {
        transform: translateY(-2px);
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

      /* Sağ Panel: Büyük Akıllı Tahta Kura Sahnesi */
      #${MODAL_ID} .msp-stage-panel {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.06) 100%);
        border: 3px solid rgba(255, 255, 255, 0.25);
        border-radius: 32px;
        padding: 28px;
        box-shadow: 0 26px 65px rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(10px);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
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
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
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
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.22);
      }
      #${MODAL_ID} .msp-norepeat-label input[type="checkbox"] {
        width: 20px;
        height: 20px;
        accent-color: #8B5CF6;
        cursor: pointer;
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
        transition: transform 0.14s ease;
      }
      #${MODAL_ID} .msp-reset-btn:hover {
        transform: translateY(-2px);
      }

      /* Dev İsim Gösterim Kartı */
      #${MODAL_ID} .msp-stage-card {
        width: 100%;
        flex: 1;
        min-height: 250px;
        border-radius: 32px;
        background: linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%);
        border: 6px solid #C4B5FD;
        border-bottom: 12px solid #8B5CF6;
        padding: 32px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 14px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.42);
        transition: all 0.22s ease;
      }
      #${MODAL_ID} .msp-stage-card.is-rolling {
        border-color: #FDE047;
        border-bottom-color: #F59E0B;
        background: linear-gradient(180deg, #FFFBEB 0%, #FEF3C7 100%);
        transform: scale(1.01);
      }
      #${MODAL_ID} .msp-stage-card.is-winner {
        border-color: #4ADE80;
        border-bottom-color: #16A34A;
        background: linear-gradient(135deg, #ECFDF5 0%, #FEFCE8 100%);
        box-shadow: 0 0 0 6px rgba(74, 222, 128, 0.35), 0 28px 65px rgba(22, 163, 74, 0.45);
        animation: mspWinnerPop 0.38s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes mspWinnerPop {
        0% { transform: scale(0.88); }
        100% { transform: scale(1); }
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
        font-size: clamp(2.4rem, 5.4vw, 4.6rem);
        font-weight: 700;
        color: #0F172A;
        line-height: 1.15;
        letter-spacing: 0.02em;
        word-break: break-word;
      }
      #${MODAL_ID} .msp-stage-card.is-winner .msp-stage-name {
        color: #14532D;
      }
      #${MODAL_ID} .msp-stage-sub {
        font-size: 1.08rem;
        font-weight: 800;
        color: #475569;
      }

      /* Kocaman 🎲 KURA ÇEK Butonu */
      #${MODAL_ID} .msp-draw-btn {
        width: 100%;
        max-width: 520px;
        padding: 20px 36px;
        border-radius: 26px;
        border: 4px solid #FDE047;
        border-bottom: 8px solid #B45309;
        background: linear-gradient(180deg, #F59E0B 0%, #EA580C 100%);
        color: #FFFFFF;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.5rem, 2.8vw, 2.1rem);
        font-weight: 700;
        letter-spacing: 0.04em;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        box-shadow: 0 16px 38px rgba(234, 88, 12, 0.55);
        touch-action: manipulation;
        transition: transform 0.14s ease, box-shadow 0.14s ease;
      }
      #${MODAL_ID} .msp-draw-btn:hover:not(:disabled) {
        transform: translateY(-3px) scale(1.02);
      }
      #${MODAL_ID} .msp-draw-btn:disabled {
        opacity: 0.82;
        cursor: wait;
      }

      /* Çıkan Öğrenciler Şeridi */
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
        text-transform: uppercase;
        letter-spacing: 0.04em;
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

      /* Sandwich Menü (☰) İçindeki Buton Vurgusu */
      #${SIDEBAR_BTN_ID} {
        background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%) !important;
        border: 1.5px solid #F59E0B !important;
        border-bottom: 3.5px solid #D97706 !important;
        color: #92400E !important;
        font-weight: 800 !important;
      }
      #${SIDEBAR_BTN_ID}:hover {
        background: linear-gradient(135deg, #FDE68A 0%, #FCD34D 100%) !important;
        transform: translateY(-2px);
      }

      @media (max-width: 960px) {
        #${MODAL_ID} .msp-main-grid {
          grid-template-columns: 1fr;
          padding: 14px;
        }
        #${MODAL_ID} .msp-stage-panel {
          order: 1;
          padding: 18px;
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
    modal.setAttribute('aria-label', 'Öğrenci Kura ve Sınıf Listesi Sistemi');

    modal.innerHTML = `
      <header class="msp-topbar">
        <div class="msp-brand">
          <div class="msp-brand-icon" aria-hidden="true">🎲</div>
          <div>
            <h2 class="msp-brand-title">🎲 Öğrenci Kura &amp; Sınıf Listesi</h2>
            <p class="msp-brand-sub">Fotoğraftan Sınıf Listesini Yükle veya Yapıştır • Akıllı Tahtada Heyecanlı Kura Çek!</p>
          </div>
        </div>
        <button class="msp-close-btn" id="moliPickerCloseBtn" type="button" aria-label="Öğrenci Kura Penceresini Kapat">✕ Kapat</button>
      </header>

      <main class="msp-main-grid">
        <!-- SOL PANEL: FOTOĞRAFTAN LİSTE YÜKLEME (TÜRKÇE OCR) & KALICI KAYIT -->
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

        <!-- SAĞ PANEL: AKILLI TAHTA BÜYÜK KURA EKRANI -->
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
    `;

    document.body.appendChild(modal);

    document.getElementById('moliPickerCloseBtn').addEventListener('click', closeStudentPicker);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeStudentPicker();
      }
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

    updatePickerStatusUI();
  }

  function openStudentPicker() {
    buildModal();
    state.isOpen = true;

    // Sandwich menü açıksa zarifçe kapat
    const sidebar = document.getElementById('appSidebar');
    const backdrop = document.getElementById('mobileDrawerBackdrop');
    if (sidebar) sidebar.classList.remove('open', 'active', 'is-open');
    if (backdrop) backdrop.classList.remove('open', 'active', 'is-open');

    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.add('is-open');
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

  // Sağ üstteki Sandwich Menünün (☰ / #appSidebar) içine "🎲 Öğrenci Kura & Liste" butonu ekle
  function injectSandwichMenuButton() {
    injectStyles();
    const toolsList = document.querySelector('#appSidebar .sidebar-tools-list');
    if (!toolsList || document.getElementById(SIDEBAR_BTN_ID)) return;

    const btn = document.createElement('button');
    btn.className = 'sidebar-tool-btn';
    btn.id = SIDEBAR_BTN_ID;
    btn.type = 'button';
    btn.title = 'Fotoğraftan Sınıf Listesi Yükle ve Akıllı Tahtada Öğrenci Kurası Çek';
    btn.innerHTML = `
      <span class="tool-icon" aria-hidden="true">🎲</span>
      <span class="tool-label">🎲 Öğrenci Kura &amp; Liste</span>
    `;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openStudentPicker();
    });

    toolsList.insertBefore(btn, toolsList.firstChild);
  }

  window.openMoliStudentPicker = openStudentPicker;
  window.closeMoliStudentPicker = closeStudentPicker;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSandwichMenuButton);
  } else {
    injectSandwichMenuButton();
  }
})();
