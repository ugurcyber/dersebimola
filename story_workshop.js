/**
 * ==========================================================================
 * DERSE Bİ' MOLA - BAĞIMSIZ HİKAYE & BİLMECE ATÖLYESİ (story_workshop.js)
 * 3. Aşama: 4 Sayfalı İnteraktif Masal Kitabı, Akıllı Tahta Slayt/Kitap
 * Arayüzü, Sayfa Bazlı ve Tüm Hikayeyi Sıralı Seslendirme Sistemi
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

  // 12 FARKLI VE 4 SAYFALIK (BÖLÜMLÜ) DETAYLI MASAL KİTABI ŞABLONLARI
  const STORY_BOOK_TEMPLATES = [
    {
      theme: '🗺️ Ada Macerası',
      title: (w1, w2, w3) => `🗺️ Gizemli Ada ve ${w3} Sırrı`,
      pages: [
        (w1, w2, w3) =>
          `Güneşin altın sarısı ışıkları masmavi denizin üzerinde neşeyle dans ediyordu. Sahilde yürüyüşe çıkan maceracı kahramanımız, dalgaların kıyıya getirdiği minik deniz kabuklarını tek tek inceliyordu. Tam o sırada kayalıkların arasında ışıl ışıl parıldayan ${w1} dikkatini çekti. Kahramanımız merakla eğilip ona dokundu ve adanın gizemli kapısının bu sabah aralandığını hemen hissetti.`,
        (w1, w2, w3) =>
          `Heyecanla palmiye ağaçlarının arasından adanın iç kısımlarına doğru ilerlemeye başladı. Çalıların arasından hafif çıtırtılar yükseldiğinde birden karşısına sevimli mi sevimli bir ${w2} çıktı! Şaşkınlıktan gözleri büyüyen kahramanımız tebessüm ederek "Merhaba dostum, burada seni görmek ne büyük sürpriz!" dedi. İki yeni arkadaş birbirlerine güvenle bakarak patikada omuz omuza yürümeye karar verdiler.`,
        (w1, w2, w3) =>
          `Ormanın sonuna geldiklerinde dev bir taş duvar ve sarmaşıklarla kilitlenmiş geçit yollarını kesti. Ne yapacaklarını bilemezken çantadan çıkardıkları ${w3} sayesinde geçidin gizli kilidi tıkır tıkır çözülüverdi. Birbirlerine yardım ederek bu büyük engeli kolayca aşmanın gururunu yaşadılar. Birlikte hareket ettiklerinde hiçbir zorluğun onları durduramayacağını çok iyi anladılar.`,
        (w1, w2, w3) =>
          `Geçidin ardındaki tepede güneş batarken bütün ada rengarenk çiçek kokularıyla doldu. Kahramanımız ve yeni dostları, en büyük hazinenin altınlar değil, paylaşılan sıcacık bir dostluk olduğunu öğrendiler. Mutluluk içinde el sallayarak eve dönerken gökyüzünde ilk akşam yıldızı parladı. Böylece bu unutulmaz keşif hikayesi tatlı bir tebessümle noktalandı.`
      ],
      discussion: (w1, w2, w3) =>
        `Kahramanımız ve arkadaşı o adada karşılaştıkları ${w3} ile başka nasıl bir iyilik yapabilirlerdi? Siz olsaydınız adadan yanınıza ne hatıra alırdınız?`
    },
    {
      theme: '🚀 Uzay Yolculuğu',
      title: (w1, w2, w3) => `🚀 Yıldızlararası ${w2} Keşfi`,
      pages: [
        (w1, w2, w3) =>
          `Uzay üssünün kontrol merkezinde monitörler pırıl pırıl parlıyor, astronotlar heyecanla geri sayımı bekliyordu. Genç uzay kaşifimiz kaskını takıp roketin penceresinden sonsuz karanlığa doğru gülümsedi. Koltuğunun hemen yanında parlayan ${w1}, bu uzun yıldızlararası yolculuğun en güvenilir rehberiydi. Motorlar ateşlenip gökyüzüne doğru havalandıklarında Dünya mavi bir bilye gibi geride kaldı.`,
        (w1, w2, w3) =>
          `Roket Samanyolu'nun renkli nebulaları arasından süzülürken radarda daha önce hiç görülmemiş tuhaf bir sinyal belirdi. Kaptan pilot kabin kapısını açtığında yan koltukta neşeyle parıldayan ${w2} ile göz göze geldi! Bütün ekip bu beklenmedik misafiri sevinçle alkışladı; çünkü o, bilinmeyen gezegenlerin şifresini biliyordu. İkisi hemen ekran başına geçip rotayı parlak halkalı Satürn'ün yanına çevirdiler.`,
        (w1, w2, w3) =>
          `Bir anda küçük bir göktaşı fırtınası başladı ve uzay gemisinin iletişim anteni kilitlendi. Kaşifimiz soğukkanlılığını koruyarak teknoloji dolabında saklanan ${w3} parçasını devreye soktu. İki astronot tam bir uyum içinde çalışarak anteni saniyeler içinde onardı ve rotayı güvene aldı. Yardımlaşmanın ve bilimin gücü sayesinde bu tehlikeli fırtına da geride kalmıştı.`,
        (w1, w2, w3) =>
          `Sonunda yeni keşfettikleri dost gezegene ulaşıp bayraklarını diktiler ve Dünya'daki arkadaşlarına selam yolladılar. Bu büyük keşif, evrende sevgi ve dayanışmayla aşılamayacak hiçbir uzaklık olmadığını kanıtladı. Yıldızların ışıltısı altında kasklarını birbirine dokundurarak bu tarihi başarıyı kutladılar. Kaşiflerimizin uzay günlüğüne yazdığı bu satırlar tüm sınıflara ilham oldu.`
      ],
      discussion: (w1, w2, w3) =>
        `Uzay gemisinde ${w1} ve ${w2} ile birlikte olsaydınız, yeni keşfettiğiniz gezegene hangi ismi verirdiniz? Orada hangi kuralları koyardınız?`
    },
    {
      theme: '🌲 Büyülü Orman',
      title: (w1, w2, w3) => `🌲 Fısıldayan Ağaçlar ve ${w1}`,
      pages: [
        (w1, w2, w3) =>
          `Sabah sisi dağların üzerinden yavaşça çekilirken ulu çam ağaçları hafif bir rüzgarla şarkı söylüyordu. Doğa dostu kahramanımız sırt çantasını takıp yaprak kokulu yemyeşil patikada neşeyle ilerliyordu. Yolun kenarındaki yosunlu bir kütüğün üzerinde duran ${w1}, ormanın derinliklerindeki sihirli kapının anahtarı gibi parlıyordu. Kahramanımız kuş seslerini dinleyerek doğanın kalbine doğru adım attı.`,
        (w1, w2, w3) =>
          `Biraz ilerideki berrak derenin kıyısına vardığında yapraklar birden havalandı ve karşısına meraklı bir ${w2} çıkıverdi. Kahramanımız şaşkınlıkla nefesini tuttu ve sevimli dostuna zarar vermemek için bir adım geri çekildi. İkisi göz göze geldiklerinde aralarında sessiz ama çok güçlü bir dostluk bağı kuruldu. Ormanın neşeli sakinleri de dallardan sarkarak bu tatlı tanışmayı izledi.`,
        (w1, w2, w3) =>
          `Fakat derenin üzerindeki eski tahta köprü kırılmıştı ve karşı kıyıdaki yavru sincap yuvasına dönemiyordu. Kahramanımız ve yeni dostu hemen el ele vererek çimenlerin arasındaki ${w3} ile köprüyü sağlamlaştırdılar. Birlikte çalışınca dakikalar içinde köprü eskisinden bile daha sağlam ve güvenli hale geldi. Küçük sincap sevinçle zıplayarak yuvasına kavuşurken orman şenlendi.`,
        (w1, w2, w3) =>
          `Akşam güneşi yaprakların arasından süzülürken ormanın bilge baykuşu dallardan onlara teşekkür etti. Doğayı korumanın, canlılara saygı duymanın ve zor zamanlarda yardıma koşmanın ne kadar kıymetli olduğunu bir kez daha öğrendiler. Kahramanımız kalbinde derin bir huzurla köyüne dönerken arkasında mutlu bir orman bıraktı. Bu masal kulaktan kulağa yayılarak herkese doğa sevgisi aşıladı.`
      ],
      discussion: (w1, w2, w3) =>
        `Sizce ormandaki hayvanların mutlu ve güvende yaşaması için ${w1} ve ${w2} gibi bizler günlük hayatımızda nelere dikkat etmeliyiz?`
    },
    {
      theme: '🏫 Okul Şenliği',
      title: (w1, w2, w3) => `🏫 Akıllı Tahta ve ${w2} Sürprizi`,
      pages: [
        (w1, w2, w3) =>
          `Sabah zili çaldığında koridorlar neşeli çocuk sesleriyle ve hızlı adımlarla yankılanıyordu. Sınıfına ilk giren çalışkan öğrencimiz, tahtanın yanındaki sırasına oturup defterini özenle açtı. Masanın üzerinde ışıl ışıl duran ${w1}, bugünkü grup etkinliğinin çok renkli geçeceğinin ilk işaretiydi. Öğretmen sınıfa girdiğinde tahtaya günün gizemli bilmecesini yazarak herkesi heyecanlandırdı.`,
        (w1, w2, w3) =>
          `Gruplar oluşturulup çalışmalar başladığında arka sıradan gelen hafif bir fısıltıyla herkes arkasını döndü. Kutunun kapağı açıldığında içinden çıkan neşeli ${w2} bütün sınıfın neşe kaynağı oldu! Öğrenciler sevinçle ayağa fırlayarak bu harika sürprizi alkışlamaya başladılar. Takım kaptanımız gülümseyerek "Bugün birlikte çalışırsak rekor kıracağız!" dedi.`,
        (w1, w2, w3) =>
          `Son etapta akıllı tahtadaki büyük matematik ve kelime bulmacası biraz zorlaşınca sınıfça kısa bir duraklama yaşandı. Tam o anda takım arkadaşlarımızın getirdiği ${w3} ile eksik parça yerine oturuverdi. Herkes tek tek fikrini söyledi ve birlikte düşünmenin gücüyle soru saniyeler içinde çözüldü. Tahtada kocaman yeşil bir yıldız yandı ve okul salonu alkışlarla inledi.`,
        (w1, w2, w3) =>
          `Teneffüs zili çaldığında sınıf panosuna günün en başarılı ve dayanışmacı ekibinin resmi asıldı. Birbirini dinleyen, farklı fikirlere değer veren öğrencilerin her zorluğu aşabileceği herkese kanıtlandı. Bütün okul bu güzel dostluk tablosunu gururla izledi ve örnek aldı. Böylece ders zili sadece bilgi değil, sıcacık bir kardeşlik ve paylaşım getirdi.`
      ],
      discussion: (w1, w2, w3) =>
        `Sınıfımızda ${w1}, ${w2} ve ${w3} ile oynanabilecek yeni bir akıl oyunu geliştirseydiniz, bu oyunun kuralları ve puanlama sistemi nasıl olurdu?`
    },
    {
      theme: '🌊 Denizaltı Keşfi',
      title: (w1, w2, w3) => `🌊 Mercan Resifinde ${w3}`,
      pages: [
        (w1, w2, w3) =>
          `Sarı denizaltı masmavi dalgaların altına doğru yavaşça süzülürken dev cam pencereden rengarenk balık sürüleri görünüyordu. Kaptan koltuğunda oturan genç deniz araştırmacımız, sonar ekranındaki derinlik ölçülerini kontrol ediyordu. Kontrol panelinin köşesinde güvenle duran ${w1}, derin sularda rotayı aydınlatan en önemli araçtı. Denizaltının güçlü farları yandığında okyanusun büyüleyici manzarası gözler önüne serildi.`,
        (w1, w2, w3) =>
          `Büyük mercan kayalığının yanından geçerken pencereye hafifçe dokunan sevimli bir ${w2} belirdi! Araştırmacımız heyecanla not defterini alıp bu eşsiz canlının zarif hareketlerini kaydetmeye başladı. Denizlerin bu sevimli sakini adeta "Beni takip edin!" dercesine denizaltının önünde taklalar atıyordu. Tüm ekip heyecan içinde bu büyüleyici yolculuğa kendini kaptırdı.`,
        (w1, w2, w3) =>
          `Ancak eski bir batığın yanında kayalıkların arasına sıkışmış eski bir balıkçı ağı deniz canlılarının yolunu kapatıyordu. Kaptanımız denizaltının robotik koluna takılan ${w3} sayesinde ağı dikkatlice toplayıp yolu temizledi. Hiçbir mercana ve canlıya zarar vermeden gösterdikleri bu çaba deniz altındaki tüm canlılara nefes aldırdı. Çevreye duyulan sevgi bir kez daha somut bir iyiliğe dönüştü.`,
        (w1, w2, w3) =>
          `Denizaltı su yüzeyine doğru yükselirken gün batımının kızıllaşan ışıkları dalgalarla kucaklaştı. Okyanusların temiz kalması, deniz canlılarının özgürce yüzmesi için verilen bu küçük mücadele büyük bir umuda dönüştü. Araştırma ekibi limana ulaştığında yüzlerinde gururlu bir gülümseme vardı. Masmavi derinliklerin anlattığı bu hikaye herkese deniz sevgisi aşıladı.`
      ],
      discussion: (w1, w2, w3) =>
        `Denizlerimizi ve sahillerimizi temiz tutmak için sizce çocuklar olarak bizler ${w1} ve ${w2} gibi nasıl bir kampanya başlatabiliriz?`
    },
    {
      theme: '⏳ Zaman Yolculuğu',
      title: (w1, w2, w3) => `⏳ Saat Kulesi ve ${w1} Macerası`,
      pages: [
        (w1, w2, w3) =>
          `Kasabanın tam merkezindeki asırlık taş saat kulesi, her saat başında melodik çan sesleriyle yankılanırdı. Meraklı kahramanımız tahta merdivenleri birer birer tırmanıp en üst kattaki çarkların yanına ulaştı. Tozlu bir masanın üzerinde parıldayan ${w1}, sanki zamanın durduğu büyülü bir kapıyı işaret ediyordu. Kahramanımız çekingen bir adımla yaklaşıp saatin altın ibresine usulca dokundu.`,
        (w1, w2, w3) =>
          `Birdenbire odanın içi mavi ve kehribar rengi ışıklarla doldu, çarklar tersine doğru hızla dönmeye başladı. Işık hüzmesinin içinden fırlayan neşeli ${w2}, kahramanımıza elini uzatarak "Geleceğe hoş geldin!" diye seslendi. Gördüğü uçan araçlar ve yeşil çatılı binalar karşısında kahramanımızın ağzı açık kaldı. İki arkadaş zamanın sınırlarını aşan çok özel bir yolculuğa çıktılar.`,
        (w1, w2, w3) =>
          `Fakat geleceğin büyük kütüphanesindeki dijital bilgi arşivi aniden bir elektrik kesintisiyle kapanma tehlikesi yaşadı. Kahramanımız cebinde sakladığı ${w3} parçasını ana terminale bağlayarak yedek gücü anında devreye soktu. Bilgilerin kaybolmasını engelleyen bu zeki hamle bütün bilim insanlarını sevinçten havalara uçurdu. Geçmişin tecrübesi ile geleceğin teknolojisi el ele vermişti.`,
        (w1, w2, w3) =>
          `Saat kulesinin melodisi tekrar çaldığında kahramanımız kendi zamanına, sıcacık odasına sağ salim geri döndü. Zamanın en değerli hazine olduğunu, her anı öğrenerek ve iyilik yaparak değerlendirmek gerektiğini artık çok iyi biliyordu. Pencereden dışarı bakıp kasabanın sakin sokaklarına sevgiyle gülümsedi. Bu fantastik yolculuk kalbinde unutulmaz bir merak meşalesi yaktı.`
      ],
      discussion: (w1, w2, w3) =>
        `Zaman makinesine binseydiniz ${w1} ile birlikte geçmişe mi yoksa geleceğe mi gitmek isterdiniz? Orada hangi önemli sorunu çözerdiniz?`
    },
    {
      theme: '🔬 Bilim Atölyesi',
      title: (w1, w2, w3) => `🔬 Mucit Dostlar ve ${w2}`,
      pages: [
        (w1, w2, w3) =>
          `Okulun bilim atölyesinde rengarenk deney tüpleri, büyüteçler ve mıknatıslar masaların üzerini süslüyordu. Beyaz önlüğünü giyen küçük mucidimiz, haftalardır üzerinde çalıştığı çevre dostu enerji projesini tamamlamak üzereydi. Masanın en dikkat çekici köşesinde duran ${w1}, projenin en hassas sensörünü oluşturuyordu. Atölyedeki herkes merakla deneyin sonucunu görmek için nefeslerini tuttu.`,
        (w1, w2, w3) =>
          `Tam devre tamamlanmak üzereyken atölye kapısı aralandı ve içeriye enerji saçan akıllı ${w2} girdi. Mucidimiz kafasını kaldırıp baktığında bu tatlı yardımcının getirdiği yeni çizimleri görünce büyük bir sevinç yaşadı. "Harika bir zamanda geldin, senin fikirlerinle bu icat mükemmel olacak!" diyerek hemen masaya davet etti. İki kafadar fikir fırtınası yaparak devreyi geliştirmeye başladılar.`,
        (w1, w2, w3) =>
          `Ancak güç ünitesinin fazla ısınmasıyla küçük bir alarm sesi duyuldu ve deney durma noktasına geldi. Neyse ki yedek rafta duran ${w3} tam zamanında soğutma sistemine eklendi ve alarm sustu. Sabırla ve yılmadan denemeye devam eden mucitlerimiz sorunun kaynağını birlikte çözmeyi başardılar. Bilimde pes etmemenin ve ekip çalışmasının ne kadar hayati olduğu bir kez daha anlaşıldı.`,
        (w1, w2, w3) =>
          `Düğmeye tekrar basıldığında atölyenin bütün lambaları sıfır atık enerjiyle pırıl pırıl aydınlandı ve herkes alkış tufanı kopardı. Bilim fuarında birincilik ödülü alan küçük mucitlerimiz madalyalarını gururla havaya kaldırdılar. Yarının dünyasını güzelleştirecek buluşların işte böyle küçük sınıflarda başladığı herkese gösterildi. Bu ilham verici gün okul tarihine altın harflerle yazıldı.`
      ],
      discussion: (w1, w2, w3) =>
        `Siz bir icat yapacak olsaydınız ${w3} kullanarak okulumuzda veya evimizde hangi günlük işi kolaylaştırırdınız?`
    },
    {
      theme: '🚂 Bulut Ekspresi',
      title: (w1, w2, w3) => `🚂 Masal Treni ve ${w3}`,
      pages: [
        (w1, w2, w3) =>
          `Eski tren istasyonunda renkli balonlar uçuşuyor, nostaljik buharlı tren neşeyle düdüğünü çalıyordu. Kadife koltuklu vagonuna binen minik gezginimiz, cam kenarındaki yerini alıp pencereden el sallamaya başladı. Çantasının fermuarından başını uzatan ${w1}, yolculuk boyunca ona eşlik edecek en neşeli yol arkadaşıydı. Tren raylar üzerinde tıkır tıkır hızlanırken vadi bembeyaz papatyalarla doldu.`,
        (w1, w2, w3) =>
          `Tren dağ tünelinden çıktığında gökyüzünde devasa bir gökkuşağı belirdi ve vagonun kapısından sevimli ${w2} içeri adım attı. Bütün yolcular hayranlıkla bu tatlı misafire yol verdi ve vagonun içi sıcacık bir sohbete büründü. Gezginimiz cebinden çıkardığı masal kitabını açarak yeni arkadaşına en sevdiği sayfaları okumaya başladı. Yolculuk adeta bir rüya trenine dönüşmüştü.`,
        (w1, w2, w3) =>
          `Fakat dağ yamacındaki dik rampaya gelindiğinde rayların üzerine düşen bir kaya trenin yavaşlamasına sebep oldu. Gezginimiz ve yol arkadaşları kondüktörün getirdiği ${w3} yardımıyla kayayı güvenli bir şekilde kenara aldılar. Yolcuların birbirine ikramlar dağıtarak yardımlaşması sayesinde tren duraklamadan yoluna devam etti. Birlikte hareket eden insanların aşamayacağı engel yoktu.`,
        (w1, w2, w3) =>
          `Güneş batarken Bulut Ekspresi göl kenarındaki son istasyona ulaştı ve herkes birbirine sarılarak vedalaştı. Bu yolculuk boyunca kazanılan dostluklar ve paylaşılan güzel hatıralar trenin pencerelerinde kaldı. Gezginimiz bavulunu alıp inerken kalbinde sıcacık bir mutluluk taşıyordu. Rayların türküsü nesiller boyu çocukların masallarına eşlik etti.`
      ],
      discussion: (w1, w2, w3) =>
        `Uzun bir tren yolculuğunda yanınızda ${w1} ve ${w2} olsaydı, yol boyunca diğer yolcularla hangi eğlenceli oyunları oynardınız?`
    },
    {
      theme: '🏰 Bulut Şatosu',
      title: (w1, w2, w3) => `🏰 Gökyüzü Kulesi ve ${w1}`,
      pages: [
        (w1, w2, w3) =>
          `Gökkuşağının bittiği yüksek tepelerde pamuk gibi beyaz bulutların üzerine kurulmuş görkemli bir şato vardı. Bu şatonun kapısında gökyüzünü izleyen neşeli prensesimiz, elindeki sihirli yıldız asasıyla havaya resimler çiziyordu. Şatonun mermer avlusunda pırıl pırıl ışıldayan ${w1}, tüm diyarın neşe ve huzur kaynağı olarak biliniyordu. Her sabah kuşlar şatonun pencerelerine konup şarkılar söylerdi.`,
        (w1, w2, w3) =>
          `Öğle saatlerinde bulutların arasından süzülerek gelen kanatlı sevimli ${w2}, şatonun bahçesine yumuşacık bir iniş yaptı. Prensesimiz kollarını açarak bu sevimli konuğunu karşıladı ve ona bahçedeki ballı elmalardan ikram etti. İki arkadaş kulelerin tepesine çıkarak gökyüzünün masmavi derinliklerini keyifle seyretmeye başladılar. Dostlukları gök kubbenin altındaki en temiz duyguydu.`,
        (w1, w2, w3) =>
          `Tam o sırada aniden esen sert bir fırtına şatonun neşe fenerini söndürdü ve gökyüzü hafifçe karardı. Prensesimiz cesurca kütüphaneye koşup dedesinden yadigar kalan ${w3} ile fenerin ışığını yeniden alevlendirdi. Bir anda bütün şato ve altındaki vadiler gökkuşağı renkleriyle tekrar aydınlandı. Umudu ve cesareti kaybetmemenin ne kadar mucizevi sonuçlar doğurduğu görüldü.`,
        (w1, w2, w3) =>
          `Bütün krallık akşam şenliğinde meydanda toplanıp bu büyük ışık zaferini neşeyle kutladı. İyiliğin, cesaretin ve paylaşılan dostluğun hiçbir karanlığa geçit vermeyeceği herkese ilan edildi. Şatonun kulelerinden atılan konfetiler bulutların üzerinden çocukların düşlerine yağdı. Bu büyüleyici masal nesiller boyu dillerden düşmedi.`
      ],
      discussion: (w1, w2, w3) =>
        `Bulut Şatosu'nda bir gün geçirme şansınız olsaydı ${w1} ile birlikte gökyüzünden Dünya'ya nasıl bir iyilik bırakmak isterdiniz?`
    },
    {
      theme: '🎨 Sanat Köyü',
      title: (w1, w2, w3) => `🎨 Renklerin Dansı ve ${w2}`,
      pages: [
        (w1, w2, w3) =>
          `Yeşil tepelerin arasına kurulmuş şirin Sanat Köyü'nde her evin duvarı rengarenk resimlerle süslüydü. Köyün meydanındaki tuvalin başına geçen küçük ressamımız, elindeki fırçayı paletindeki canlı renklere daldırdı. Tuvalin hemen yanında duran ${w1}, resme başlarken ona en büyük ilhamı veren değerli bir nesneydi. Güneş ışıkları tuvale vurdukça renkler canlanıyor, adeta can buluyordu.`,
        (w1, w2, w3) =>
          `Ressamımız manzara resmini tamamlarken sokağın başından koşarak gelen yetenekli ${w2} heyecanla yanına vardı. "Fırçaları paylaşalım, birlikte dev bir gökkuşağı tablosu yapalım!" diyerek elindeki boyaları palete ekledi. İki küçük sanatçı el ele verince tuvalin üzeri masalsı figürlerle dolup taşmaya başladı. Çevredeki köy sakinleri hayranlıkla bu ortak üretimi izledi.`,
        (w1, w2, w3) =>
          `Fakat resmin en önemli köşesini tamamlayacak altın yaldızlı boya kutusu aniden devrilme tehlikesi yaşadı. Ressamımız çevik bir hareketle masanın üzerindeki ${w3} desteğini kullanarak boyaları ve tuvali kurtardı. Sanat üretirken dikkatli olmanın, sabır göstermenin ve birbirini korumanın önemi bir kez daha ortaya çıktı. Birlikte çalışmanın neşesi tabloya yansıdı.`,
        (w1, w2, w3) =>
          `Akşamüstü köy meydanında açılan sergide iki arkadaşın ortak tablosu en büyük alkışı aldı. Sanatın birleştirici gücü sayesinde bütün köy halkı el ele tutuşup neşeyle şarkılar söyledi. Küçük ressamlarımız sanatın sadece boyalardan değil, kalpten kalbe kurulan köprülerden ibaret olduğunu kanıtladılar. Bu renkli gün köyün hafızasına silinmez bir güzellik bıraktı.`
      ],
      discussion: (w1, w2, w3) =>
        `Siz bu hikayedeki tabloyu çizseydiniz ${w1}, ${w2} ve ${w3} etrafına hangi renkleri ve hangi duyguları yerleştirirdiniz?`
    },
    {
      theme: '🏕️ Doğa Kampı',
      title: (w1, w2, w3) => `🏕️ Yıldızlı Gece ve ${w1} Çadırı`,
      pages: [
        (w1, w2, w3) =>
          `Göl kıyısındaki yemyeşil düzlükte çadırlarını kuran izci kulübümüz, doğanın huzurlu kollarına kendini bırakmıştı. Çadırın girişine asılan ${w1}, akşam karanlığında kamp alanına sıcacık bir ışık yayıyordu. İzcilerimiz odunları toplayıp kamp ateşini güvenli bir çemberin içine özenle yerleştirdiler. Gökyüzünde beliren ilk yıldızlar doğanın sessiz davetini başlatmıştı.`,
        (w1, w2, w3) =>
          `Ateşin etrafında toplanıp neşeli izci marşları söylerken çalılıkların arasından sevimli bir ${w2} başını uzattı! İzcilerimiz sessizce bekleyip doğanın bu küçük misafirine fındık ve elma dilimleri ikram ettiler. Sevimli dostumuz kamp ateşinin ılıklığına yaklaşıp güvenle yanlarına oturdu. İnsan ile doğanın böylesine barış içinde buluşması herkesin kalbini ısıttı.`,
        (w1, w2, w3) =>
          `Gece yarısına doğru aniden bastıran rüzgar kamp çadırının iplerinden birini gevşetince izci liderimiz hemen yardıma koştu. Çantadan çıkarılan sağlam ${w3} sayesinde çadır dakikalar içinde yeniden emniyete alındı. Herkes görevini eksiksiz yerine getirerek ekip ruhunun ne kadar vazgeçilmez olduğunu gösterdi. Zorluklar karşısında panik yapmadan planlı hareket etmek yine kazandırdı.`,
        (w1, w2, w3) =>
          `Sabah güneşin ilk ışıkları gölün üzerine vurduğunda izcilerimiz kamp alanını arkalarında tek bir çöp bile bırakmadan tertemiz topladılar. Doğaya saygı duyan, hayvanları koruyan ve dayanışmayı elden bırakmayan izcilerimiz şehre gururla döndüler. Kamp boyunca anlatılan bu güzel hatıra ömür boyu unutulmayacak bir hayat dersi oldu. Doğanın kalbinde kurulan bu bağ sonsuza dek yaşadı.`
      ],
      discussion: (w1, w2, w3) =>
        `Doğa kampında arkadaşınız ${w2} biraz üşüseydi veya tedirgin olsaydı, ${w1} ve ${w3} ile ona nasıl moral verip destek olurdunuz?`
    },
    {
      theme: '🌱 Sevgi Bahçesi',
      title: (w1, w2, w3) => `🌱 Birlikte Büyüyen ${w3}`,
      pages: [
        (w1, w2, w3) =>
          `Baharın taze kokusuyla uyanan mahallemizde çocuklar boş bir arsayı yemyeşil bir çiçek bahçesine dönüştürmeye karar verdiler. Küçük bahçıvanımız eline küçük tırmığını alıp toprağı özenle havalandırmaya başladı. Bahçe kapısının girişine konulan ${w1}, bu güzel projenin ilk umut çiçeği gibi parlıyordu. Mahalledeki diğer çocuklar da ellerinde tohum paketleriyle bahçeye koştular.`,
        (w1, w2, w3) =>
          `Toprağa ilk tohumlar atılırken yan komşunun bahçesinden gelen neşeli ${w2} sulama hortumunu taşıyarak çocuklara katıldı. Birlikte şarkılar söyleyerek fideleri tek tek toprağa yerleştirdiler ve ilk can suyunu verdiler. Paylaşarak çalışmanın işleri ne kadar kolaylaştırdığını gören büyükler de onlara alkışlarla destek oldu. Sevgiyle ekilen her tohum geleceğe bırakılan bir nefesti.`,
        (w1, w2, w3) =>
          `Haftalar sonra beklenen yağmurlar az yağınca fidelerin boynu hafifçe büküldü ve çocuklar endişelendi. Neyse ki akıllıca bir fikirle getirdikleri ${w3} sayesinde damla sulama sistemi kurup her köke eşit su ulaştırdılar. Emeğin ve araştırmanın gücüyle kuraklığı yenen çocuklar fidelerin yeniden canlandığını gördüler. Birlik olunca çözülemeyecek hiçbir problem kalmıyordu.`,
        (w1, w2, w3) =>
          `Yaz ortasında bahçe rengarenk güller, papatyalar ve domateslerle dolup taşınca bütün mahallede büyük bir hasat şenliği yapıldı. Çocukların el emeğiyle yeşeren bu cennet bahçesi herkes için en güzel dinlenme yeri oldu. Sevgiyle bakılan her şeyin nasıl güzelleştiğini kanıtlayan küçük bahçıvanlarımız gururla gülümsediler. Bu hikaye tüm dünyayı yeşertecek bir sevgi dersine dönüştü.`
      ],
      discussion: (w1, w2, w3) =>
        `Okulumuzda ve çevremizde ${w1}, ${w2} ve ${w3} gibi yeşili ve canlıları korumak adına bugün hangi somut adımı atabiliriz?`
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

  const CHAPTER_TITLES = [
    '1. Bölüm: Başlangıç ve Kahraman',
    '2. Bölüm: Gizem ve Keşif',
    '3. Bölüm: Macera ve Çözüm',
    '4. Bölüm: Mutlu Son ve Kutlama'
  ];

  const workshopState = {
    activeTab: 'story', // 'story' | 'riddle'
    words: ['Kedi', 'Robot Moli', 'Altın Anahtar'],
    nextSlot: 0,
    storyBag: [],
    riddleBag: [],
    riddleAnswerCursor: 2,
    currentOutput: null,
    isSpeaking: false,
    isReadingAll: false,
    autoReadOnPageChange: false,
    speechSeqToken: 0
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
    workshopState.speechSeqToken += 1;
    workshopState.isSpeaking = false;
    workshopState.isReadingAll = false;
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
    const singleBtn = document.getElementById('moliStorySpeakCurrentBtn');
    if (singleBtn) {
      singleBtn.classList.toggle('is-speaking', workshopState.isSpeaking && !workshopState.isReadingAll);
      singleBtn.innerHTML = (workshopState.isSpeaking && !workshopState.isReadingAll)
        ? '<span aria-hidden="true">⏹️</span> <span>Sayfa Okumayı Durdur</span>'
        : '<span aria-hidden="true">🔊</span> <span>Bu Sayfayı Oku</span>';
    }

    const allBtn = document.getElementById('moliStorySpeakAllBtn');
    if (allBtn) {
      allBtn.classList.toggle('is-speaking', workshopState.isReadingAll);
      allBtn.innerHTML = workshopState.isReadingAll
        ? '<span aria-hidden="true">⏹️</span> <span>Tümünü Durdur</span>'
        : '<span aria-hidden="true">▶️</span> <span>Tüm Hikayeyi Oku</span>';
    }

    const riddleBtn = document.getElementById('moliRiddleSpeakBtn');
    if (riddleBtn) {
      riddleBtn.classList.toggle('is-speaking', workshopState.isSpeaking);
      riddleBtn.innerHTML = workshopState.isSpeaking
        ? '<span aria-hidden="true">⏹️</span> <span>Okumayı Durdur</span>'
        : '<span aria-hidden="true">🔊</span> <span>Sesli Oku</span>';
    }
  }

  function speakText(textToSpeak, onDone) {
    if (window.MoliVoiceEngine && typeof window.MoliVoiceEngine.speak === 'function') {
      try {
        window.MoliVoiceEngine.speak(textToSpeak, onDone);
        return;
      } catch (e) {}
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(textToSpeak);
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

  function speakCurrentStoryPageOnly() {
    const out = workshopState.currentOutput;
    if (!out || out.type !== 'story') return;

    if (workshopState.isSpeaking) {
      stopVoicePlayback();
      return;
    }

    const currPage = out.pages[out.currentPage] || out.pages[0];
    const textToSpeak = `${currPage.title}. ${currPage.text}`;

    workshopState.speechSeqToken += 1;
    workshopState.isSpeaking = true;
    workshopState.isReadingAll = false;
    updateSpeakButtonUI();

    speakText(textToSpeak, () => {
      workshopState.isSpeaking = false;
      updateSpeakButtonUI();
    });
  }

  function speakEntireStorySequentially() {
    const out = workshopState.currentOutput;
    if (!out || out.type !== 'story') return;

    if (workshopState.isReadingAll) {
      stopVoicePlayback();
      return;
    }

    stopVoicePlayback();
    workshopState.speechSeqToken += 1;
    const token = workshopState.speechSeqToken;

    workshopState.isSpeaking = true;
    workshopState.isReadingAll = true;
    updateSpeakButtonUI();

    function readStep(pageIdx) {
      if (token !== workshopState.speechSeqToken || !workshopState.isReadingAll) return;
      if (pageIdx >= out.pages.length) {
        workshopState.isSpeaking = false;
        workshopState.isReadingAll = false;
        updateSpeakButtonUI();
        return;
      }

      setStoryCurrentPage(pageIdx, false);
      const pageObj = out.pages[pageIdx];
      const prefix = pageIdx === 0 ? `${out.title}. ` : '';
      const textToSpeak = `${prefix}${pageObj.title}. ${pageObj.text}`;

      speakText(textToSpeak, () => {
        if (token !== workshopState.speechSeqToken || !workshopState.isReadingAll) return;
        setTimeout(() => {
          readStep(pageIdx + 1);
        }, 550);
      });
    }

    readStep(0);
  }

  function speakRiddleOutput() {
    const out = workshopState.currentOutput;
    if (!out || out.type !== 'riddle') return;

    if (workshopState.isSpeaking) {
      stopVoicePlayback();
      return;
    }

    workshopState.speechSeqToken += 1;
    workshopState.isSpeaking = true;
    workshopState.isReadingAll = false;
    updateSpeakButtonUI();

    const spokenText = `${out.title}. ${out.text.replace(/\n/g, ' ')}`;
    speakText(spokenText, () => {
      workshopState.isSpeaking = false;
      updateSpeakButtonUI();
    });
  }

  function playWorkshopApplauseAndFanfare() {
    if (window.isMuted === true) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;

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
        background: linear-gradient(135deg, #FFFDF8 0%, #FFFFFF 50%, #F5F3FF 100%);
        border: 2.5px solid #DDD6FE;
        border-radius: 24px;
        padding: 20px 24px;
        box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
      }

      /* =======================================================
         DİJİTAL HİKAYE KİTABI (4 SAYFALI SLAYT / KİTAP ARAYÜZÜ)
         ======================================================= */
      #${MODAL_ID} .msw-book-container {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      #${MODAL_ID} .msw-book-top-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        padding-bottom: 12px;
        border-bottom: 2px solid #EDE9FE;
      }
      #${MODAL_ID} .msw-book-meta-left {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
      }
      #${MODAL_ID} .msw-theme-pill {
        padding: 4px 11px;
        border-radius: 999px;
        background: #E0E7FF;
        color: #3730A3;
        font-size: 0.78rem;
        font-weight: 900;
      }
      #${MODAL_ID} .msw-page-counter-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border-radius: 999px;
        background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%);
        color: #FFFFFF;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.88rem;
        font-weight: 700;
        box-shadow: 0 3px 8px rgba(79, 70, 229, 0.28);
      }
      #${MODAL_ID} .msw-book-dots {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      #${MODAL_ID} .msw-page-dot {
        width: 14px;
        height: 14px;
        border-radius: 999px;
        border: 2px solid #CBD5E1;
        background: #FFFFFF;
        cursor: pointer;
        padding: 0;
        touch-action: manipulation;
        transition: transform 0.16s ease, background 0.16s ease, border-color 0.16s ease;
      }
      #${MODAL_ID} .msw-page-dot:hover {
        transform: scale(1.22);
        border-color: #6366F1;
      }
      #${MODAL_ID} .msw-page-dot.is-active {
        width: 32px;
        border-radius: 999px;
        background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
        border-color: #4338CA;
        box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
      }

      /* Sayfa Sahnesi & Geçiş Animasyonu */
      #${MODAL_ID} .msw-book-page-wrapper {
        background: linear-gradient(180deg, #FFFFFF 0%, #FFFDF7 100%);
        border: 2px solid #E2E8F0;
        border-radius: 20px;
        padding: 20px 22px;
        box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.02), 0 4px 14px rgba(15, 23, 42, 0.04);
        min-height: 180px;
      }
      #${MODAL_ID} .msw-book-page {
        animation: mswPageFlip 0.28s cubic-bezier(0.25, 1, 0.5, 1);
      }
      @keyframes mswPageFlip {
        0% { opacity: 0; transform: translateX(18px) scale(0.985); }
        100% { opacity: 1; transform: translateX(0) scale(1); }
      }
      #${MODAL_ID} .msw-chapter-heading {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 12px 0;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: clamp(1.15rem, 1.8vw, 1.45rem);
        font-weight: 700;
        color: #1E1B4B;
      }
      #${MODAL_ID} .msw-book-text {
        font-size: clamp(1.12rem, 1.72vw, 1.36rem);
        line-height: 1.88;
        font-weight: 700;
        color: #1E293B;
        margin: 0;
      }

      /* Rozet (Badge) Şeklinde Parlayan Kelimeler */
      #${MODAL_ID} .msw-word-badge {
        display: inline-block;
        padding: 3px 12px;
        margin: 0 3px;
        border-radius: 12px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.05em;
        font-weight: 700;
        line-height: 1.35;
        vertical-align: baseline;
        box-shadow: 0 3px 10px rgba(15, 23, 42, 0.12);
        animation: mswBadgeGlow 2.4s infinite alternate ease-in-out;
      }
      @keyframes mswBadgeGlow {
        0% { transform: scale(1); }
        100% { transform: scale(1.03); }
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

      /* Sayfa Gezinme Butonları (Akıllı Tahta Dostu) */
      #${MODAL_ID} .msw-book-nav-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 8px;
      }
      #${MODAL_ID} .msw-book-nav-btn {
        flex: 1;
        min-width: 140px;
        padding: 12px 18px;
        border-radius: 16px;
        border: 2px solid #CBD5E1;
        border-bottom: 4px solid #94A3B8;
        background: #FFFFFF;
        color: #1E293B;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 1.06rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        touch-action: manipulation;
        transition: transform 0.14s ease, background 0.14s ease, border-color 0.14s ease;
      }
      #${MODAL_ID} .msw-book-nav-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        background: #F8FAFC;
        border-color: #6366F1;
      }
      #${MODAL_ID} .msw-book-nav-btn:active:not(:disabled) {
        transform: translateY(2px);
      }
      #${MODAL_ID} .msw-book-nav-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      #${MODAL_ID} .msw-book-nav-btn.btn-next-page:not(:disabled) {
        background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
        border-color: #4338CA;
        border-bottom-color: #312E81;
        color: #FFFFFF;
        box-shadow: 0 4px 14px rgba(79, 70, 229, 0.25);
      }

      /* Sayfa Sonu "Sınıfça Düşünelim" Kutusu (4. Sayfa) */
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
        font-size: 1.05rem;
        font-weight: 700;
        color: #1E40AF;
      }
      #${MODAL_ID} .msw-btn-next-discussion {
        padding: 5px 12px;
        border-radius: 10px;
        border: 1.5px solid #93C5FD;
        background: #FFFFFF;
        color: #1D4ED8;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.84rem;
        font-weight: 700;
        cursor: pointer;
        touch-action: manipulation;
      }
      #${MODAL_ID} .msw-discussion-text {
        margin: 0;
        font-size: clamp(1rem, 1.38vw, 1.15rem);
        font-weight: 800;
        color: #1E293B;
        line-height: 1.55;
      }

      /* Seslendirme Butonları ve Otomatik Oku Seçeneği */
      #${MODAL_ID} .msw-voice-panel {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 16px;
        padding-top: 14px;
        border-top: 2px solid #EDE9FE;
      }
      #${MODAL_ID} .msw-voice-actions {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }
      #${MODAL_ID} .msw-btn-voice {
        padding: 10px 18px;
        border-radius: 14px;
        font-family: 'Fredoka', 'Nunito', sans-serif;
        font-size: 0.98rem;
        font-weight: 700;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        touch-action: manipulation;
        transition: transform 0.14s ease, box-shadow 0.14s ease;
      }
      #${MODAL_ID} .msw-btn-voice.btn-read-page {
        background: linear-gradient(180deg, #0EA5E9 0%, #0284C7 100%);
        border: 2px solid #0284C7;
        border-bottom: 4px solid #0369A1;
        color: #FFFFFF;
        box-shadow: 0 4px 14px rgba(2, 132, 199, 0.22);
      }
      #${MODAL_ID} .msw-btn-voice.btn-read-all {
        background: linear-gradient(180deg, #10B981 0%, #059669 100%);
        border: 2px solid #059669;
        border-bottom: 4px solid #047857;
        color: #FFFFFF;
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.22);
      }
      #${MODAL_ID} .msw-btn-voice.is-speaking {
        background: linear-gradient(180deg, #EF4444 0%, #DC2626 100%) !important;
        border-color: #DC2626 !important;
        border-bottom-color: #991B1B !important;
        box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3) !important;
      }
      #${MODAL_ID} .msw-btn-voice:hover {
        transform: translateY(-2px);
      }
      #${MODAL_ID} .msw-autoread-label {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        font-size: 0.88rem;
        font-weight: 800;
        color: #475569;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
      }
      #${MODAL_ID} .msw-autoread-label input[type="checkbox"] {
        width: 17px;
        height: 17px;
        accent-color: #6366F1;
        cursor: pointer;
      }

      /* Bilmece Stilleri (Tam Uyumlu) */
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
      #${MODAL_ID} .msw-riddle-footer {
        display: flex;
        justify-content: center;
        margin-top: 14px;
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
        #${MODAL_ID} .msw-book-page-wrapper {
          padding: 14px 16px;
        }
        #${MODAL_ID} .msw-book-text {
          font-size: 1.05rem;
          line-height: 1.74;
        }
        #${MODAL_ID} .msw-book-nav-btn {
          min-width: 100px;
          padding: 10px 14px;
          font-size: 0.94rem;
        }
        #${MODAL_ID} .msw-voice-panel {
          flex-direction: column;
          align-items: stretch;
        }
        #${MODAL_ID} .msw-voice-actions {
          flex-direction: column;
        }
        #${MODAL_ID} .msw-btn-voice {
          width: 100%;
          justify-content: center;
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
    const idx = drawFromBag('storyBag', STORY_BOOK_TEMPLATES.length);
    const tpl = STORY_BOOK_TEMPLATES[idx];

    const pages = [
      {
        pageNumber: 1,
        title: CHAPTER_TITLES[0],
        text: tpl.pages[0](words[0], words[1], words[2])
      },
      {
        pageNumber: 2,
        title: CHAPTER_TITLES[1],
        text: tpl.pages[1](words[0], words[1], words[2])
      },
      {
        pageNumber: 3,
        title: CHAPTER_TITLES[2],
        text: tpl.pages[2](words[0], words[1], words[2])
      },
      {
        pageNumber: 4,
        title: CHAPTER_TITLES[3],
        text: tpl.pages[3](words[0], words[1], words[2])
      }
    ];

    return {
      type: 'story',
      theme: tpl.theme,
      title: tpl.title(words[0], words[1], words[2]),
      pages: pages,
      currentPage: 0,
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

  function setStoryCurrentPage(targetPageIdx, shouldSpeak = false) {
    const out = workshopState.currentOutput;
    if (!out || out.type !== 'story') return;

    const clamped = Math.max(0, Math.min(out.pages.length - 1, targetPageIdx));
    out.currentPage = clamped;
    renderOutputCard();

    if (shouldSpeak || workshopState.autoReadOnPageChange) {
      setTimeout(() => {
        if (!workshopState.isReadingAll) {
          speakCurrentStoryPageOnly();
        }
      }, 100);
    }
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

    // =========================================================================
    // 1. TÜR: 📖 4 SAYFALI MASAL KİTABI RENDER
    // =========================================================================
    if (out.type === 'story') {
      const pageIdx = Math.max(0, Math.min(out.pages.length - 1, out.currentPage || 0));
      const page = out.pages[pageIdx];

      const dotsHtml = out.pages.map((_, idx) => `
        <button class="msw-page-dot ${idx === pageIdx ? 'is-active' : ''}" type="button" data-msw-page="${idx}" title="${escapeHtml(out.pages[idx].title)}" aria-label="Sayfa ${idx + 1}"></button>
      `).join('');

      const discussionHtml = (pageIdx === 3)
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

      card.innerHTML = `
        <div class="msw-book-container">
          <!-- Üst Bilgi Barı: Sayfa 1/4 ve Noktalar -->
          <div class="msw-book-top-bar">
            <div class="msw-book-meta-left">
              ${out.theme ? `<span class="msw-theme-pill">${escapeHtml(out.theme)}</span>` : ''}
              <span class="msw-page-counter-badge">📖 Sayfa ${pageIdx + 1} / 4</span>
              <h3 class="msw-output-title" style="margin:0 0 0 6px;">${escapeHtml(out.title)}</h3>
            </div>
            <div class="msw-book-dots">
              ${dotsHtml}
            </div>
          </div>

          <!-- Sayfa İçerik Kutusu (Yumuşak Geçişli Kitap Sayfası) -->
          <div class="msw-book-page-wrapper">
            <article class="msw-book-page" key="${pageIdx}">
              <h4 class="msw-chapter-heading">${escapeHtml(page.title)}</h4>
              <p class="msw-book-text">${highlightWordsHtml(page.text, out.words)}</p>
              ${discussionHtml}
            </article>
          </div>

          <!-- Sayfa Değiştirme Butonları (Akıllı Tahta İçin Büyük Dokunsal Butonlar) -->
          <div class="msw-book-nav-row">
            <button class="msw-book-nav-btn btn-prev-page" id="moliPrevPageBtn" type="button" ${pageIdx === 0 ? 'disabled' : ''}>
              <span>⬅️</span>
              <span>Önceki Sayfa</span>
            </button>
            <button class="msw-book-nav-btn btn-next-page" id="moliNextPageBtn" type="button" ${pageIdx === 3 ? 'disabled' : ''}>
              <span>${pageIdx === 3 ? '🎉 Masal Sonu' : 'Sonraki Sayfa'}</span>
              <span>${pageIdx === 3 ? '⭐' : '➡️'}</span>
            </button>
          </div>

          <!-- Sayfa Bazlı ve Tüm Hikaye Seslendirme Paneli -->
          <div class="msw-voice-panel">
            <div class="msw-voice-actions">
              <button class="msw-btn-voice btn-read-page ${workshopState.isSpeaking && !workshopState.isReadingAll ? 'is-speaking' : ''}" id="moliStorySpeakCurrentBtn" type="button">
                <span aria-hidden="true">${workshopState.isSpeaking && !workshopState.isReadingAll ? '⏹️' : '🔊'}</span>
                <span>${workshopState.isSpeaking && !workshopState.isReadingAll ? 'Sayfa Okumayı Durdur' : 'Bu Sayfayı Oku'}</span>
              </button>
              <button class="msw-btn-voice btn-read-all ${workshopState.isReadingAll ? 'is-speaking' : ''}" id="moliStorySpeakAllBtn" type="button">
                <span aria-hidden="true">${workshopState.isReadingAll ? '⏹️' : '▶️'}</span>
                <span>${workshopState.isReadingAll ? 'Tümünü Durdur' : 'Tüm Hikayeyi Oku'}</span>
              </button>
            </div>
            <label class="msw-autoread-label">
              <input type="checkbox" id="moliAutoReadToggle" ${workshopState.autoReadOnPageChange ? 'checked' : ''}>
              <span>Sayfa geçişinde otomatik oku</span>
            </label>
          </div>
        </div>
      `;

      // Kitap Dinleyicileri
      const prevBtn = document.getElementById('moliPrevPageBtn');
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          stopVoicePlayback();
          setStoryCurrentPage(pageIdx - 1, false);
        });
      }

      const nextBtn = document.getElementById('moliNextPageBtn');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          stopVoicePlayback();
          setStoryCurrentPage(pageIdx + 1, false);
        });
      }

      card.querySelectorAll('.msw-page-dot').forEach((dotEl) => {
        dotEl.addEventListener('click', () => {
          const target = parseInt(dotEl.getAttribute('data-msw-page'), 10);
          if (!isNaN(target)) {
            stopVoicePlayback();
            setStoryCurrentPage(target, false);
          }
        });
      });

      const speakCurrentBtn = document.getElementById('moliStorySpeakCurrentBtn');
      if (speakCurrentBtn) {
        speakCurrentBtn.addEventListener('click', speakCurrentStoryPageOnly);
      }

      const speakAllBtn = document.getElementById('moliStorySpeakAllBtn');
      if (speakAllBtn) {
        speakAllBtn.addEventListener('click', speakEntireStorySequentially);
      }

      const autoReadCheckbox = document.getElementById('moliAutoReadToggle');
      if (autoReadCheckbox) {
        autoReadCheckbox.addEventListener('change', (e) => {
          workshopState.autoReadOnPageChange = !!e.target.checked;
        });
      }

      const nextDiscussionBtn = document.getElementById('moliNextDiscussionBtn');
      if (nextDiscussionBtn) {
        nextDiscussionBtn.addEventListener('click', () => {
          out.discussionIdx = (out.discussionIdx + 1) % out.discussionPool.length;
          renderOutputCard();
        });
      }

      return;
    }

    // =========================================================================
    // 2. TÜR: 🧩 BİLMECE MODU RENDER
    // =========================================================================
    const chipsHtml = out.words
      .map((w, idx) => `<span class="msw-used-chip">${idx + 1}. ${escapeHtml(w)}</span>`)
      .join('');

    const riddleHintHtml = (out.hintLevel > 0)
      ? `
        <div class="msw-riddle-hint-box" id="moliRiddleHintBox">
          <div><strong>💡 İpucu 1:</strong> ${escapeHtml(out.hints[0])}</div>
          ${out.hintLevel >= 2 ? `<div style="margin-top:4px;"><strong>🔎 İpucu 2:</strong> ${escapeHtml(out.hints[1])}</div>` : ''}
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
          <span class="msw-used-chip">🔒 1 Gizli Cevap</span>
          ${chipsHtml}
        </div>
      </div>
      <div class="msw-output-body">
        ${highlightWordsHtml(out.text, out.words)}
      </div>
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
      <div class="msw-riddle-footer">
        <button class="msw-btn-voice btn-read-page ${workshopState.isSpeaking ? 'is-speaking' : ''}" id="moliRiddleSpeakBtn" type="button">
          <span aria-hidden="true">${workshopState.isSpeaking ? '⏹️' : '🔊'}</span>
          <span>${workshopState.isSpeaking ? 'Okumayı Durdur' : 'Sesli Oku'}</span>
        </button>
      </div>
    `;

    const hintBtn = document.getElementById('moliRiddleHintBtn');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => {
        out.hintLevel = out.hintLevel < 2 ? out.hintLevel + 1 : 1;
        renderOutputCard();
      });
    }

    const revealBtn = document.getElementById('moliRiddleRevealBtn');
    if (revealBtn) {
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

    const riddleSpeakBtn = document.getElementById('moliRiddleSpeakBtn');
    if (riddleSpeakBtn) {
      riddleSpeakBtn.addEventListener('click', speakRiddleOutput);
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
        : '<span aria-hidden="true">📖</span> <span>4 Sayfalık Masal Kitabını Oluştur</span>';
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
              <p class="msw-subtitle">3 kelime seç veya yaz; sınıfınla 4 sayfalık sesli masal veya bilmece üret!</p>
            </div>
          </div>
          <button class="msw-close-btn" id="moliStoryCloseBtn" type="button" aria-label="Atölyeyi Kapat">✕ Kapat</button>
        </div>

        <div class="msw-tabs" role="tablist" aria-label="Atölye Sekmeleri">
          <button class="msw-tab-btn is-active" id="moliTabStory" data-msw-tab="story" type="button" role="tab" aria-selected="true">
            <span aria-hidden="true">📖</span>
            <span>4 Sayfalı Hikaye Kitabı</span>
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
            <input class="msw-word-input" id="moliWordInput0" type="text" maxlength="28" placeholder="1. Kelime (Kahraman)">
          </div>
          <div class="msw-input-wrap">
            <span class="msw-input-num">2</span>
            <input class="msw-word-input" id="moliWordInput1" type="text" maxlength="28" placeholder="2. Kelime (Gizem)">
          </div>
          <div class="msw-input-wrap">
            <span class="msw-input-num">3</span>
            <input class="msw-word-input" id="moliWordInput2" type="text" maxlength="28" placeholder="3. Kelime (Çözüm)">
          </div>
          <button class="msw-btn-random" id="moliRandomWordsBtn" type="button">🎲 Rastgele Seç</button>
          <button class="msw-btn-clear" id="moliClearWordsBtn" type="button">🧹 Temizle</button>
        </div>

        <div class="msw-generate-row">
          <button class="msw-btn-generate" id="moliStoryGenerateBtn" type="button">
            <span aria-hidden="true">📖</span>
            <span>4 Sayfalık Masal Kitabını Oluştur</span>
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
