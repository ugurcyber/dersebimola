# Moly maskotu – el sallama animasyonunu siteye ekleme

Web siteme yeni bir maskot ekle: **Moly** (turuncu robot). El sallama animasyonu hazır, 30 karelik PNG dizisi olarak sana veriyorum.

## Kaynak dosyalar

- Proje kök dizininde `kareler/` klasörü var (dosyaları ben koyacağım; bulamazsan bana sor, yolu tahmin etme).
- Dosya adları: `el_sallama_000.png` … `el_sallama_029.png` (toplam 30 kare)
- Hepsi şeffaf arka planlı ve **719×1143 px**, yani en/boy oranı yaklaşık 0,63.
- Bütün kareler aynı tuvalde ve aynı hizada. Kaydırma, kırpma ya da hizalama gerekmez.
- **Oynatma hızı: 20 fps**, yani kare başına 50 ms.
- 1,5 saniyelik kesintisiz döngü: 029'dan sonra 000'a dön.
- Animasyonda olanlar: iki kez el sallama, hafif gövde zıplaması, kafa eğilmesi, antendeki yıldızın parlaması. 20–23. karelerde gözler kırpılır.

## Yapılacaklar

1. **Projeyi incele.** Önce projenin yapısını öğren: framework, statik dosya klasörü, bileşen düzeni, stil yöntemi. Kendi eklemelerini projede zaten kullanılan kalıplara göre yap; yeni bir kütüphane ekleme.
2. **Dosyaları yerleştir.** Kareleri projenin statik/public klasörüne kopyala (örneğin `/mascot/moly/wave/`). Orijinal PNG'leri silme.
3. **Web için optimize et.**
   - Kareleri kaliteli WebP'ye çevir, şeffaflık korunsun.
   - Sitede gösterilecek boyutun yaklaşık 2 katına küçült. Örneğin 240 px genişlikte gösterilecekse 480 px genişliğe indir.
4. **Yeniden kullanılabilir bir maskot bileşeni yaz.** Örnek kullanım: `<Mascot name="moly" state="wave" />`
   - Bütün kareleri önceden yükle; kareler yüklenmeden animasyonu başlatma.
   - Kareleri `requestAnimationFrame` ile 20 fps'te döngüye sok. Zamanlamayı geçen süreye göre hesapla, kare sayacına göre değil.
   - Kapsayıcının en/boy oranını sabitle, sayfada kayma (layout shift) olmasın.
   - Sekme görünmezken (`document.hidden`) ve bileşen ekran dışındayken (`IntersectionObserver`) animasyonu durdur.
   - `prefers-reduced-motion` açıksa sadece ilk kareyi sabit göster.
   - Alt metin: "Moly robot el sallıyor".
   - Arka plan şeffaf kalsın; açık ve koyu temada düzgün görünsün.
   - Bileşenin ve dosya klasörünün yapısı, ileride yeni durumlar (mutlu, uyuyan, üzgün vb.) yalnızca yeni bir kare klasörü ve kare sayısı eklenerek tanımlanabilecek şekilde olsun.
5. **Siteye yerleştir.** Maskotu uygun bir yere koy (örneğin ana sayfanın karşılama alanı). Mobilde küçülsün ve yatay kaydırmaya yol açmasın.
6. **Kontrol et.** Siteyi tarayıcıda çalıştır ve şunlara bak:
   - Döngü takılmadan akıyor mu?
   - 30 karenin hepsi oynuyor mu (20–23. karelerde gözler kırpılmalı)?
   - Kare geçişlerinde titreme ya da kenarlarda beyaz hale var mı?
   - Masaüstü ve mobil görünümler düzgün mü?
   - Konsolda hata var mı?
7. **Özetle.** Bitince hangi dosyaları eklediğini ya da değiştirdiğini ve maskotu başka bir sayfada nasıl kullanacağımı kısaca anlat.
