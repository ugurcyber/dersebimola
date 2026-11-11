/**
 * ==========================================================================
 * DERSE Bİ' MOLA - BAĞIMSIZ HİKAYE & BİLMECE ATÖLYESİ (story_workshop.js)
 * 2. Aşama: 12 Hikaye, 15 Bilmece, Sınıfça Düşünelim, İpucu & Alkış/Konfeti
 * app.js ve mevcut oyun motorlarından tamamen bağımsız çalışır.
 * ==========================================================================
 */
(function () {
  'use strict';

  const MODAL_ID = 'moli-story-modal';
  const STYLE_ID = 'moli-story-workshop-styles';
  const CONFETTI_CANVAS_ID = 'moli-story-confetti-canvas';

  const WORD_CARDS = [
    {
      id: 'kedi',
      word: 'Kedi',
      emoji: '🐱',
      bg: '#FFF7ED',
      border: '#FDBA74',
      featureHint: 'Bıyıklı, yumuşak patili ve mırıldamayı çok seven sevimli dostumuzdur.',
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
      featureHint: 'Derse Bi\' Mola sınıfının ışıklı gözlü, yıldız antenli akıllı maskotudur.',
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
      featureHint: 'Yüzlerce ağacın, kuşun ve temiz havanın bir arada olduğu yeşil dünyadır.',
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
      featureHint: 'Yıldızların, Ay\'ın ve gezegenlerin içinde süzüldüğü sonsuz boşluktur.',
      riddleLines: [
        'Milyonlarca yıldız parlar, gezegenler sessiz döner,',
        'Roketlerle yol alınır, ışıklar orada söner.'
      ]
    },
    {
      id: 'anahtar',
      word: 'Altın Anahtar',
      emoji: '🗝️',
      bg: '#FEFCE8',
      border: '#FDE047',
      featureHint: 'Sapsarı parlar ve kilitli kapılarla gizli sandıkları açmaya yarar.',
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
      featureHint: 'İpinden tutmazsan hafifliğiyle gökyüzüne doğru yükseliverir.',
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
      featureHint: 'Milyonlarca yıl önce yaşamış, kocaman ayaklı ama gülümseyen dev dosttur.',
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
      featureHint: 'Masallarda gökyüzünün tepesinde bembeyaz bulutlardan kurulan kaledir.',
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
      featureHint: 'Tırtıldan dönüşür ve desenli iki kanadıyla çiçeklere konar.',
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
      featureHint: 'Yolları, yönleri ve hazinenin saklandığı yeri gösteren rehber kağıttır.',
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
      featureHint: 'Denizlerde akıllı oyunlar yapan, dalgaların üzerinden sıçrayan dosttur.',
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
      featureHint: 'Geceleri karanlık gökyüzünde beş köşesiyle pırıl pırıl ışıldar.',
      riddleLines: [
        'Gece olunca gökyüzünde tek tek göz kırpar bize,',
        'Işıl ışıl parıltısıyla yol gösterir gecemize.'
      ]
    }
  ];

  const STORY_TEMPLATES = [
    {
      theme: '🗺️ Macera',
      title: (w1, w2, w3) => `🗺️ ${w1} ve ${w3} Adası Macerası`,
      build: (w1, w2, w3) =>
        `Güneşli bir sabah ${w1} neşeyle uyanıp büyük bir macera haritası çıkardı. Bahçede karşısına birden ${w2} çıktı ve ikisi gülüşerek gizemli patikaya doğru yola koyuldu. Çok geçmeden büyük bir ağacın kovuğunda parlayan bir ${w3} buldular! Gün boyu ${w1}, ${w2} ve ${w3} sayesinde unutulmaz bir keşif yaşayıp eve mutlu döndüler.`,
      discussion: (w1, w2, w3) =>
        `Kahramanımız ${w1} ile ${w2}, buldukları ${w3} ile sınıf arkadaşlarına nasıl bir sürpriz hazırlayabilirdi? Hikayenin sonunu siz olsanız nasıl bitirirdiniz?`
    },
    {
      theme: '🚀 Uzay',
      title: (w1, w2, w3) => `🚀 Yıldızlararası ${w2} Yolculuğu`,
      build: (w1, w2, w3) =>
        `Uzay istasyonunda geri sayım başladığında kaptan ${w1}, roketin penceresinden parlayan gezegenlere baktı. Yan koltukta oturan yardımcı pilot ${w2}, kontrol panelinde yanıp sönen ${w3} işaretini fark etti. İkisi el ele verip rotayı Ay'ın parlak kraterine çevirdi ve herkesin hayran kaldığı bir keşif yaptı. Böylece ${w1}, ${w2} ve ${w3} uzayın en neşeli ekibi oldu!`,
      discussion: (w1, w2, w3) =>
        `Siz ${w1} ve ${w2} ile birlikte uzay gemisine binseydiniz, yanınıza ${w3} dışında hangi eşyayı alırdınız ve hangi gezegene inerdiniz?`
    },
    {
      theme: '🌲 Orman',
      title: (w1, w2, w3) => `🌲 Fısıldayan Ormanda ${w3}`,
      build: (w1, w2, w3) =>
        `Kuş sesleriyle dolu yeşil ormanda yürüyüşe çıkan ${w1}, dev çam ağaçlarının arasında kaybolan bir iz gördü. İzleri takip edince yanına neşeyle zıplayarak gelen ${w2} ile karşılaştı. İkisi yaprakların altında saklanan ${w3} görünce sevinçten havalara uçtu! O günden sonra ${w1}, ${w2} ve ${w3} doğayı koruyan en iyi arkadaşlar oldu.`,
      discussion: (w1, w2, w3) =>
        `Ormanda yaşayan canlıları korumak için ${w1} ve ${w2} nasıl kurallar koyabilir? Doğa yürüyüşünde nelere dikkat etmeliyiz?`
    },
    {
      theme: '🏫 Okul',
      title: (w1, w2, w3) => `🏫 Akıllı Tahta ve ${w1} Şenliği`,
      build: (w1, w2, w3) =>
        `Teneffüs zili çaldığında sınıfın en meraklı öğrencisi ${w1}, öğretmeninin masasında parlayan bir not buldu. Sıra arkadaşı ${w2} ile birlikte akıllı tahtadaki bilmeceyi çözünce ödül kutusundan ${w3} çıktı! Bütün sınıf alkışlarla bu başarıyı kutladı ve günün yıldızı seçildi. İşte ${w1}, ${w2} ve ${w3} sayesinde okulda her ders oyuna dönüştü!`,
      discussion: (w1, w2, w3) =>
        `Sınıfımızda ${w1}, ${w2} ve ${w3} ile oynanacak yeni bir mola oyunu tasarlasaydınız kuralları neler olurdu?`
    },
    {
      theme: '🌊 Denizaltı',
      title: (w1, w2, w3) => `🌊 Mavi Denizaltıda ${w3} Keşfi`,
      build: (w1, w2, w3) =>
        `Masmavi okyanusun derinliklerine dalan sarı denizaltıda kaptan ${w1} dürbünden mercanları izliyordu. Tam o sırada camın dışında ona el sallayan ${w2} belirdi ve deniz kabuklarının yanındaki ${w3} işaret etti. Denizaltının ışıklarını açıp birlikte okyanusun en renkli sırrını çözdüler. Su altındaki ${w1}, ${w2} ve ${w3} macerası balıkların dansıyla son buldu!`,
      discussion: (w1, w2, w3) =>
        `Denizlerin temiz kalması için ${w1} ve ${w2} denizaltından yüzeye nasıl bir mesaj göndermeli?`
    },
    {
      theme: '⏳ Zaman Yolculuğu',
      title: (w1, w2, w3) => `⏳ Zaman Makinesi ve ${w2}`,
      build: (w1, w2, w3) =>
        `Eski saat kulesinin kapısını açan ${w1}, tıkır tıkır çalışan parlak bir zaman makinesiyle karşılaştı. Makinenin kolunu çevirince yanına birden ${w2} ışınlandı ve ikisi geçmişle gelecek arasında eğlenceli bir yolculuğa çıktı. Gittikleri her çağda yanlarındaki ${w3} sayesinde insanlara yardım ettiler. Sonunda ${w1}, ${w2} ve ${w3} tam zamanında sınıfına geri döndü!`,
      discussion: (w1, w2, w3) =>
        `Zaman makinesine binme şansınız olsaydı ${w1} ile geçmişe mi yoksa geleceğe mi gitmek isterdiniz? Neden?`
    },
    {
      theme: '🔬 Bilim',
      title: (w1, w2, w3) => `🔬 Mucit ${w1} Laboratuvarda`,
      build: (w1, w2, w3) =>
        `Renkli deney tüplerinin arasında çalışan mucit ${w1}, bugün çok ilginç bir icat deniyordu. Yardımcı olarak laboratuvara gelen ${w2}, masanın köşesinde duran ${w3} ile eksik parçayı hemen tamamladı. Küçük bir kıvılcım sonrası odanın içi gökkuşağı ışıklarıyla doldu! Bilim meraklısı ${w1}, ${w2} ve ${w3} ile harika bir icada imza attı.`,
      discussion: (w1, w2, w3) =>
        `Siz bir icat yapacak olsaydınız ${w3} kullanarak okulda veya evde hangi işi kolaylaştırırdınız?`
    },
    {
      theme: '🚂 Yolculuk',
      title: (w1, w2, w3) => `🚂 Bulut Ekspresi ve ${w3}`,
      build: (w1, w2, w3) =>
        `Çuf çuf diye öten renkli tren Bulut Ekspresi'ne binen ${w1}, cam kenarındaki koltuğa yerleşti. Karşısına oturan ${w2} çantasından çıkardığı ${w3} ile bütün vagonu neşelendiren bir oyun başlattı. Tren dağları aşıp gökkuşağının altından geçerken tüm yolcular şarkılar söyledi. Bu yolculukta ${w1}, ${w2} ve ${w3} ömürlük bir dostluk kurdu!`,
      discussion: (w1, w2, w3) =>
        `Uzun bir tren yolculuğunda yanınızda ${w1} ve ${w2} olsaydı sıkılmamak için birlikte hangi oyunu oynardınız?`
    },
    {
      theme: '🏰 Masal',
      title: (w1, w2, w3) => `🏰 Masal Tepesinde ${w1} Şöleni`,
      build: (w1, w2, w3) =>
        `Pamuk bulutların üzerindeki şatoda büyük bir bahar şöleni hazırlanıyordu. Kapıda misafirleri karşılayan ${w1}, gökyüzünden süzülerek gelen ${w2} ile kucaklaştı. İkisi şatonun bahçesindeki ${w3} ışığını yakınca bütün diyar müzikle doldu! Masalın sonunda ${w1}, ${w2} ve ${w3} herkese gülümseyerek iyi dilekler dağıttı.`,
      discussion: (w1, w2, w3) =>
        `Bu masaldaki kahramanımız ${w1} yerinde siz olsaydınız şölene başka kimleri davet ederdiniz?`
    },
    {
      theme: '🎨 Sanat',
      title: (w1, w2, w3) => `🎨 Gökkuşağı Boyası ve ${w2}`,
      build: (w1, w2, w3) =>
        `Resim dersinde fırçalarını hazırlayan ${w1}, bembeyaz tuvalin üzerine büyük bir hayal çizmeye başladı. Yanına yaklaşan ${w2}, hayal gücünü kullanarak resmin tam ortasına parlayan bir ${w3} ekledi. İki arkadaşın tablosu o kadar canlı oldu ki herkes merakla etraflarına toplandı. Böylece ${w1}, ${w2} ve ${w3} sanat sergimizin yıldızı oldu!`,
      discussion: (w1, w2, w3) =>
        `Bu hikayeyi bir resme dönüştürseydiniz en çok hangi renkleri kullanırdınız ve resmin ortasına ne çizerdiniz?`
    },
    {
      theme: '🏕️ Doğa & Kamp',
      title: (w1, w2, w3) => `🏕️ Yıldızlı Gecede ${w1} Kampı`,
      build: (w1, w2, w3) =>
        `Akşam serinliğinde çadırlarını kuran ${w1} ile ${w2}, gökyüzünde beliren ilk yıldızları saymaya başladı. Çimenlerin üzerinde hafifçe parlayan ${w3} onlara gece lambası gibi yol gösterdi. Ateş böcekleri etraflarında dans ederken ikisi birbirine en güzel anılarını anlattı. Doğada geçirilen bu gecede ${w1}, ${w2} ve ${w3} huzurla parladı.`,
      discussion: (w1, w2, w3) =>
        `Kamp yaparken arkadaşımız ${w2} biraz korksaydı, ${w1} onu rahatlatmak için ne söyleyebilirdi?`
    },
    {
      theme: '🌱 Dayanışma',
      title: (w1, w2, w3) => `🌱 Okul Bahçesinde ${w3} Sürprizi`,
      build: (w1, w2, w3) =>
        `Bahçe temizliği gününde eldivenlerini takan ${w1}, toprağın kenarında tek başına duran bir fidan gördü. Hemen yardıma gelen ${w2}, su kovasını taşırken çantadaki ${w3} sayesinde bahçeye neşe kattı. Kısa sürede okul bahçesi çiçeklerle dolup pırıl pırıl oldu. Birlikte çalışan ${w1}, ${w2} ve ${w3} herkese dayanışmanın gücünü gösterdi!`,
      discussion: (w1, w2, w3) =>
        `Okulumuzu ve sınıfımızı güzelleştirmek için ${w1} ile ${w2} gibi biz de bugün hangi küçük iyiliği yapabiliriz?`
    }
  ];

  const EXTRA_DISCUSSIONS = [
    (w1, w2, w3) => `Kahramanımız ${w1} bu durumda başka ne yapabilirdi? Hikayenin sonunu siz olsanız nasıl bitirirdiniz?`,
    (w1, w2, w3) => `Sizce bu hikayede en önemli rolü ${w1}, ${w2} yoksa ${w3} mü üstlendi? Nedenini sınıfça paylaşalım!`,
    (w1, w2, w3) => `Hikayeye 4. bir kahraman daha eklemek isteseydiniz bu kim olurdu ve ${w3} ile ne yapardı?`,
    (w1, w2, w3) => `Bu hikayeden öğrendiğimiz en güzel ders veya mesaj nedir? Tek cümleyle özetleyebilir misiniz?`
  ];

  const RIDDLE_TEMPLATES = [
    {
      theme: '🎈 Kafiyeli Bilmece',
      intro: (a, b) => `${a} ile ${b} fısıldaşır yan yana,`,
      outro: 'Bil bakalım bu gizli şey nedir bana?'
    },
    {
      theme: '🔍 Meraklı Soru',
      intro: (a, b) => `${a} sormuş, ${b} dinlemiş merakla,`,
      outro: 'Hadi düşün, bu bilmecenin cevabı nedir acaba?'
    },
    {
      theme: '🗝️ Sır Kutusu',
      intro: (a, b) => `${a} ve ${b} saklamış bir sır oyunda,`,
      outro: 'Tahmin et bakalım, saklanan kelime hangisidir?'
    },
    {
      theme: '🌟 Yıldız İpucu',
      intro: (a, b) => `${a} yukarı baktı, ${b} gülümsedi sessizce,`,
      outro: 'Kim ilk önce bulacak bu cevabı gizlice?'
    },
    {
      theme: '🏫 Sınıf Yarışı',
      intro: (a, b) => `Tahtada ${a} durur, yanında ise ${b},`,
      outro: 'El kaldırıp söyle bakalım, bu gizemli şey ne?'
    },
    {
      theme: '🎵 Neşeli Tekerleme',
      intro: (a, b) => `Bir yanda ${a} oynar, bir yanda ${b} zıplar,`,
      outro: 'Şimdi sıra sende, cevabı yüksek sesle aktar!'
    },
    {
      theme: '🧭 Kaşif İzleri',
      intro: (a, b) => `Kaşif ${a} haritayı açtı, ${b} baktı dikkatle,`,
      outro: 'İşte ipucu önünde, doğru cevabı hemen söyle!'
    },
    {
      theme: '🎨 Renkli İpucu',
      intro: (a, b) => `${a} bir resim çizmiş, ${b} renkleri seçmiş,`,
      outro: 'Resimde gizli kalan o güzel şey neymiş?'
    },
    {
      theme: '🚀 Uzay Sinyali',
      intro: (a, b) => `Roketten ${a} seslendi, ${b} mesajı kaptı,`,
      outro: 'Sinyalde saklı duran doğru kelimeyi kim buldu?'
    },
    {
      theme: '🌲 Orman Fısıltısı',
      intro: (a, b) => `Rüzgar ${a} üzerinden esti, ${b} yaprağına kondu,`,
      outro: 'Doğanın bize sorduğu bu bilmece ne oldu?'
    },
    {
      theme: '🎁 Sürpriz Paket',
      intro: (a, b) => `Kurdeleli kutuda ${a} ile ${b} buluşmuş,`,
      outro: 'Kutunun tam ortasındaki sürpriz neymiş?'
    },
    {
      theme: '🤖 Moli Soruyor',
      intro: (a, b) => `Moli dedi ki: "${a} ve ${b} çok iyi dosttur,`,
      outro: 'Üçüncü arkadaşları kimdir, haydi sınıfça buldur!"'
    },
    {
      theme: '🌊 Dalga Sesi',
      intro: (a, b) => `Mavi dalgalar ${a} kıyısına vurdu, ${b} parladı,`,
      outro: 'Suların fısıldadığı bu gizemli yanıt neydi?'
    },
    {
      theme: '⏰ Zaman İpucu',
      intro: (a, b) => `Saatler tik tak çaldı, ${a} ile ${b} bekledi,`,
      outro: 'Zaman dolmadan önce doğru cevabı kim söyledi?'
    },
    {
      theme: '🏆 Şampiyon Sorusu',
      intro: (a, b) => `Büyük finalde ${a} hazırlandı, ${b} alkışladı,`,
      outro: 'Alkışı hak eden o gizli cevap nedir şimdi?'
    }
  ];

  const workshopState = {
    activeTab: 'story', // 'story' | 'riddle'
    words: ['Kedi', 'Robot Moli', 'Altın Anahtar'],
    nextSlot: 0,
    storyBag: [],
    riddleBag: [],
    riddleAnswerCursor: 2,
    discussionVariantIdx: 0,
    currentOutput: null,
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

  function drawFromBag(bagKey, totalCount) {
    if (!Array.isArray(workshopState[bagKey]) || workshopState[bagKey].length === 0) {
      const fresh = Array.from({ length: totalCount }, (_, i) => i);
      for (let i = fresh.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = fresh[i];
        fresh[i] = fresh[j];
        fresh[j] = tmp;
      }
      workshopState[bagKey] = fresh;
    }
    return workshopState[bagKey].pop();
  }

  function highlightWordsHtml(text, words) {
    const cleanWords = [];
    const slotByLower = {};
    words.forEach((w, idx) => {
      const trimmed = String(w || '').trim();
      if (!trimmed) return;
      const low = trimmed.toLocaleLowerCase('tr-TR');
      if (slotByLower[low] === undefined) {
        slotByLower[low] = idx % 3;
        cleanWords.push(trimmed);
      }
    });

    const escapedText = escapeHtml(text);
    if (cleanWords.length === 0) return escapedText.replace(/\n/g, '<br>');

    const pattern = cleanWords
      .slice()
      .sort((a, b) => b.length - a.length)
      .map((w) => escapeRegExp(escapeHtml(w)))
      .join('|');
    const combinedRegex = new RegExp(`(${pattern})`, 'gi');

    const highlighted = escapedText.replace(combinedRegex, (match) => {
      const slot = slotByLower[match.toLocaleLowerCase('tr-TR')];
      const badgeCls = slot !== undefined ? `msw-word-badge msw-badge-${slot}` : 'msw-word-badge msw-badge-0';
      return `<mark class="${badgeCls}">${match}</mark>`;
    });

    return highlighted.replace(/\n/g, '<br>');
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

  function playWorkshopApplauseAndFanfare() {
    if (window.isMuted === true) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;

      // 1) Neşeli kutlama akoru (C5 - E5 - G5 - C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.36);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.38);
      });

      // 2) Sınıf alkışı (filtreli kısa beyaz gürültü darbeleri)
      const clapCount = 9;
      for (let i = 0; i < clapCount; i++) {
        const start = now + 0.06 + i * 0.085 + (Math.random() * 0.025);
        const bufLen = Math.floor(ctx.sampleRate * 0.065);
        const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let k = 0; k < bufLen; k++) {
          data[k] = (Math.random() * 2 - 1) * Math.exp(-k / (bufLen * 0.25));
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100 + Math.random() * 700, start);
        filter.Q.setValueAtTime(1.4, start);

        const clapGain = ctx.createGain();
        clapGain.gain.setValueAtTime(0.16, start);
        clapGain.gain.exponentialRampToValueAtTime(0.001, start + 0.065);

        noise.connect(filter);
        filter.connect(clapGain);
        clapGain.connect(ctx.destination);
        noise.start(start);
        noise.stop(start + 0.068);
      }

      setTimeout(() => {
        try { ctx.close(); } catch (e) {}
      }, 1500);
    } catch (e) {}
  }

  function launchWorkshopConfetti() {
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

    const colors = ['#F97316', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];
    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.52;
    const particles = Array.from({ length: 85 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 11;
      return {
        x: cx + (Math.random() - 0.5) * 140,
        y: cy + (Math.random() - 0.5) * 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        size: 6 + Math.random() * 7,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.28,
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
        p.vy += 0.32;
        p.vx *= 0.985;
        p.rot += p.vRot;
        p.life -= 0.014;
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
      #${MODAL_ID} .msw-output-title-group {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
      }
      #${MODAL_ID} .msw-theme-pill {
        padding: 4px 10px;
        border-radius: 999px;
        background: #E0E7FF;
        color: #3730A3;
        font-size: 0.78rem;
        font-weight: 900;
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
        line-height: 1.78;
        font-weight: 700;
        color: #1E293B;
        background: #FFFFFF;
        border: 2px solid #E2E8F0;
        border-radius: 16px;
        padding: 16px 18px;
      }
      /* Hikaye & Bilmece içi parlayan büyük renkli kelime rozetleri */
      #${MODAL_ID} .msw-word-badge {
        display: inline-block;
        padding: 2px 11px;
        margin: 0 2px;
        border-radius: 12px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.04em;
        font-weight: 700;
        line-height: 1.35;
        vertical-align: baseline;
        box-shadow: 0 3px 10px rgba(15, 23, 42, 0.12);
      }
      #${MODAL_ID} .msw-badge-0 {
        background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
        color: #1E3A8A;
        border: 2px solid #3B82F6;
      }
      #${MODAL_ID} .msw-badge-1 {
        background: linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%);
        color: #9A3412;
        border: 2px solid #F97316;
      }
      #${MODAL_ID} .msw-badge-2 {
        background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
        color: #065F46;
        border: 2px solid #10B981;
      }
      /* Hikaye Sonu "Sınıfça Düşünelim" Kutusu */
      #${MODAL_ID} .msw-discussion-box {
        margin-top: 14px;
        padding: 14px 16px;
        border-radius: 16px;
        background: linear-gradient(135deg, #F0F9FF 0%, #EEF2FF 100%);
        border: 2px solid #93C5FD;
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.08);
      }
      #${MODAL_ID} .msw-discussion-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 6px;
      }
      #${MODAL_ID} .msw-discussion-heading {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.02rem;
        font-weight: 700;
        color: #1E40AF;
      }
      #${MODAL_ID} .msw-btn-next-discussion {
        padding: 5px 11px;
        border-radius: 10px;
        border: 1.5px solid #93C5FD;
        background: #FFFFFF;
        color: #1D4ED8;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.82rem;
        font-weight: 700;
        cursor: pointer;
        touch-action: manipulation;
      }
      #${MODAL_ID} .msw-discussion-text {
        margin: 0;
        font-size: clamp(0.98rem, 1.35vw, 1.12rem);
        font-weight: 800;
        color: #1E293B;
        line-height: 1.5;
      }
      /* Bilmece İpucu ve Büyük Cevap Kutusu */
      #${MODAL_ID} .msw-riddle-hint-box {
        margin-top: 12px;
        padding: 10px 14px;
        border-radius: 14px;
        background: #FEFCE8;
        border: 2px solid #FDE047;
        color: #854D0E;
        font-size: 0.98rem;
        font-weight: 800;
        line-height: 1.45;
      }
      #${MODAL_ID} .msw-riddle-answer-box {
        margin-top: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        padding: 12px 16px;
        border-radius: 16px;
        background: #FFF7ED;
        border: 2px dashed #FB923C;
      }
      #${MODAL_ID} .msw-riddle-answer-box.is-revealed {
        background: linear-gradient(135deg, #ECFDF5 0%, #FEFCE8 100%);
        border: 2.5px solid #22C55E;
        box-shadow: 0 8px 22px rgba(34, 197, 94, 0.2);
      }
      #${MODAL_ID} .msw-riddle-secret {
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.05rem;
        font-weight: 700;
        color: #9A3412;
      }
      #${MODAL_ID} .msw-riddle-answer-box.is-revealed .msw-riddle-secret {
        font-size: clamp(1.25rem, 2.2vw, 1.7rem);
        color: #15803D;
        letter-spacing: 0.03em;
        animation: mswAnswerPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes mswAnswerPop {
        0% { transform: scale(0.84); opacity: 0.4; }
        100% { transform: scale(1); opacity: 1; }
      }
      #${MODAL_ID} .msw-riddle-actions {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
      }
      #${MODAL_ID} .msw-btn-hint {
        padding: 8px 14px;
        border-radius: 12px;
        border: 2px solid #F59E0B;
        border-bottom: 3px solid #D97706;
        background: #FFFBEB;
        color: #92400E;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.92rem;
        font-weight: 700;
        cursor: pointer;
        touch-action: manipulation;
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
    const idx = drawFromBag('storyBag', STORY_TEMPLATES.length);
    const tpl = STORY_TEMPLATES[idx];
    workshopState.discussionVariantIdx = 0;

    return {
      type: 'story',
      theme: tpl.theme,
      title: tpl.title(words[0], words[1], words[2]),
      text: tpl.build(words[0], words[1], words[2]),
      discussionPool: [
        tpl.discussion(words[0], words[1], words[2]),
        ...EXTRA_DISCUSSIONS.map((fn) => fn(words[0], words[1], words[2]))
      ],
      discussionIdx: 0,
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
    const riddleIdx = drawFromBag('riddleBag', RIDDLE_TEMPLATES.length);
    const tpl = RIDDLE_TEMPLATES[riddleIdx];

    const cleanAnswer = answerWord.trim();
    const firstChar = cleanAnswer.charAt(0).toLocaleUpperCase('tr-TR');
    const letterLen = cleanAnswer.replace(/\s+/g, '').length;
    const wordCount = cleanAnswer.split(/\s+/).filter(Boolean).length;

    let bodyLines;
    if (preset) {
      bodyLines = preset.riddleLines;
    } else {
      bodyLines = [
        `Tam ${letterLen} harfli adı "${firstChar}" ile başlar,`,
        'Masalımızda saklanır, bilenleri neşe sarar!'
      ];
    }

    const hint1 = wordCount > 1
      ? `Cevap ${wordCount} kelimeden (toplam ${letterLen} harf) oluşuyor ve "${firstChar}" harfiyle başlıyor!`
      : `Cevap ${letterLen} harfli bir kelime ve "${firstChar}" harfiyle başlıyor!`;

    const hint2 = preset
      ? preset.featureHint
      : `Seçtiğiniz 3 kelimeden biri (${otherA} ve ${otherB} dışındaki) gizli cevabımız!`;

    return {
      type: 'riddle',
      theme: tpl.theme,
      title: '🧩 Bil Bakalım Bu Nedir?',
      text: `${tpl.intro(otherA, otherB)}\n${bodyLines[0]}\n${bodyLines[1]}\n${tpl.outro}`,
      words: [otherA, otherB],
      allWords: words.slice(),
      riddleAnswer: answerWord,
      answerEmoji: preset ? preset.emoji : '✨',
      hints: [hint1, hint2],
      hintLevel: 0,
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
      .map((w, idx) => `<span class="msw-used-chip">${idx + 1}. ${escapeHtml(w)}</span>`)
      .join('');

    const storyDiscussionHtml = out.type === 'story'
      ? `
        <div class="msw-discussion-box">
          <div class="msw-discussion-top">
            <span class="msw-discussion-heading">🤔 Sınıfça Düşünelim:</span>
            <button class="msw-btn-next-discussion" id="moliNextDiscussionBtn" type="button">💬 Başka Soru</button>
          </div>
          <p class="msw-discussion-text">${escapeHtml(out.discussionPool[out.discussionIdx])}</p>
        </div>
      `
      : '';

    const riddleHintHtml = (out.type === 'riddle' && out.hintLevel > 0)
      ? `
        <div class="msw-riddle-hint-box" id="moliRiddleHintBox">
          <div><strong>💡 İpucu 1:</strong> ${escapeHtml(out.hints[0])}</div>
          ${out.hintLevel >= 2 ? `<div style="margin-top:4px;"><strong>🔎 İpucu 2:</strong> ${escapeHtml(out.hints[1])}</div>` : ''}
        </div>
      `
      : '';

    const riddleExtraHtml = out.type === 'riddle'
      ? `
        ${riddleHintHtml}
        <div class="msw-riddle-answer-box ${out.answerRevealed ? 'is-revealed' : ''}">
          <span class="msw-riddle-secret" id="moliRiddleSecretText">
            ${out.answerRevealed
              ? `🎉 CEVAP: <strong>${escapeHtml(out.answerEmoji)} ${escapeHtml(out.riddleAnswer.toLocaleUpperCase('tr-TR'))}</strong>`
              : '❓ Cevap gizli tutuluyor — önce sınıfça tahmin edin!'}
          </span>
          <div class="msw-riddle-actions">
            <button class="msw-btn-hint" id="moliRiddleHintBtn" type="button">
              ${out.hintLevel === 0 ? '💡 İpucu Ver' : (out.hintLevel === 1 ? '💡 2. İpucunu Ver' : '💡 İpucu Açık')}
            </button>
            <button class="msw-btn-reveal" id="moliRiddleRevealBtn" type="button">
              ${out.answerRevealed ? '🙈 Cevabı Gizle' : '👁️ Cevabı Göster'}
            </button>
          </div>
        </div>
      `
      : '';

    card.innerHTML = `
      <div class="msw-output-header">
        <div class="msw-output-title-group">
          ${out.theme ? `<span class="msw-theme-pill">${escapeHtml(out.theme)}</span>` : ''}
          <h3 class="msw-output-title">${escapeHtml(out.title)}</h3>
        </div>
        <div class="msw-used-chips">
          ${out.type === 'riddle' ? '<span class="msw-used-chip">🔒 1 Gizli Cevap</span>' : ''}
          ${chipsHtml}
        </div>
      </div>
      <div class="msw-output-body">
        ${highlightWordsHtml(out.text, out.words)}
      </div>
      ${storyDiscussionHtml}
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

    const nextDiscussionBtn = document.getElementById('moliNextDiscussionBtn');
    if (nextDiscussionBtn && out.type === 'story') {
      nextDiscussionBtn.addEventListener('click', () => {
        out.discussionIdx = (out.discussionIdx + 1) % out.discussionPool.length;
        renderOutputCard();
      });
    }

    const hintBtn = document.getElementById('moliRiddleHintBtn');
    if (hintBtn && out.type === 'riddle') {
      hintBtn.addEventListener('click', () => {
        if (out.hintLevel < 2) {
          out.hintLevel += 1;
        } else {
          out.hintLevel = 1;
        }
        renderOutputCard();
      });
    }

    const revealBtn = document.getElementById('moliRiddleRevealBtn');
    if (revealBtn && out.type === 'riddle') {
      revealBtn.addEventListener('click', () => {
        const wasRevealed = !!out.answerRevealed;
        out.answerRevealed = !wasRevealed;
        renderOutputCard();
        if (!wasRevealed) {
          launchWorkshopConfetti();
          playWorkshopApplauseAndFanfare();
        }
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

    document.getElementById('moliStoryCloseBtn').addEventListener('click', closeWorkshop);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeWorkshop();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeWorkshop();
      }
    });

    modal.querySelectorAll('.msw-tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextTab = btn.getAttribute('data-msw-tab');
        if (nextTab !== 'story' && nextTab !== 'riddle') return;
        workshopState.activeTab = nextTab;
        updateTabUI();
        generateCurrentOutput();
      });
    });

    modal.querySelectorAll('.msw-word-card').forEach((cardEl) => {
      cardEl.addEventListener('click', () => {
        handleWordCardClick(cardEl.getAttribute('data-word'));
      });
    });

    for (let i = 0; i < 3; i++) {
      const inp = document.getElementById(`moliWordInput${i}`);
      if (inp) {
        inp.addEventListener('input', () => {
          workshopState.words[i] = inp.value.trim();
          syncWordCardStates();
        });
      }
    }

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
    const confetti = document.getElementById(CONFETTI_CANVAS_ID);
    if (confetti) confetti.remove();
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
