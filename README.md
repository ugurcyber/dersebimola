# Derse Bi' Mola (dersebimola.com) 🎯

MEB Fatih Projesi ve Pardus ETAP akıllı tahtaları için geliştirilmiş; ilkokul 1, 2, 3 ve 4. sınıf öğrencilerine yönelik interaktif sınıf içi düello ve dikkat oyunları platformu.

## 🚀 Özellikler
- **Sıfır Harici Bağımlılık (Zero External CDN):** MEB internet filtresine takılmamak için harici CDN, Google Fonts veya harici resim/ses dosyası çekmez.
- **Yerleşik Web Audio API:** Tüm ses efektleri (doğru cevap, yanlış uyarısı, zafer müziği) tarayıcı içinde gerçek zamanlı sentezlenir.
- **Akıllı Tahta Multi-Touch Desteği:** İki öğrenci aynı anda parmakla dokunarak yarışabilir (`pointerdown` gecikmesiz tepki).
- **Freemium & Kancalı Model:** Misafir modunda anında başlama, öğretmen girişiyle sınıf listesi ve çarkıfelek ile 2 öğrenci seçimi.
- **Dinamik Soru Motoru:** 1'den 4. sınıfa kadar hem dinamik matematik işlemleri (çarpım tablosu, 4 işlem) hem de zengin Türkçe ve dikkat soruları.
- **Hata Spam Koruması:** Yanlış basanın ekranı 1.5 saniye süreyle kilitlenir.

## 📁 Dosya Yapısı
- `index.html`: Tek sayfa mimarisi (Lobi, Split-Screen Düello, Zafer Ekranı ve Modallar).
- `style.css`: 100vw/100vh tam ekran, neon temalı yüksek kontrastlı akıllı tahta CSS tasarımı.
- `app.js`: Web Audio ses sentezleyici, soru üretici, çarkıfelek, kilit mekanizması ve yerel hafıza yönetimi.

## 🌐 Dağıtım (Deployment)
Hostinger üzerinde `public_html` dizinine doğrudan yüklenerek veya Hostinger Git Webhook entegrasyonu ile GitHub üzerinden otomatik dağıtılmaktadır.
