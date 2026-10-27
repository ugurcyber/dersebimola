import re
from pathlib import Path

content = Path('app.js').read_text(encoding='utf-8')

# 1. Visual Choice
start_v = content.find('grade0VisualQuestionsPool: [')
end_v = content.find('grade0BalloonLevelsPool: [')
visual_block = content[start_v:end_v]

visual_items = []
current_cat = "Genel"

for line in visual_block.splitlines():
    line = line.strip()
    cat_match = re.search(r'//\s*\d+\)\s*([^\(]+)', line)
    if cat_match:
        current_cat = cat_match.group(1).strip()
    
    m = re.search(r'spokenText:\s*([\'"])(.*?)\1\s*,', line)
    if m:
        text = m.group(2).replace(r"\'", "'").replace(r'\"', '"').strip()
        visual_items.append((current_cat, text))

# 2. Balloon Levels
start_b = end_v
end_b = content.find('grade1BalloonLevelsPool: [')
balloon_block = content[start_b:end_b]

balloon_items = []
for line in balloon_block.splitlines():
    m = re.search(r'spokenText:\s*([\'"])(.*?)\1\s*,', line)
    if m:
        text = m.group(2).replace(r"\'", "'").replace(r'\"', '"').strip()
        balloon_items.append(text)

# 3. Count Tap
count_tap_items = [
    "Kaç tane Kırmızı Elma var? Dokunarak say.",
    "Kaç tane Sevimli Tavşan var? Dokunarak say.",
    "Kaç tane Parlak Yıldız var? Dokunarak say.",
    "Kaç tane Miyavlayan Kedi var? Dokunarak say.",
    "Kaç tane Renkli Balon var? Dokunarak say.",
    "Kaç tane Hızlı Araba var? Dokunarak say.",
    "Kaç tane Tatlı Çilek var? Dokunarak say."
]

# 4. Shadow Match
shadow_match_items = [
    "Aslan dostumuzun gölgesini bul.",
    "Koca Fil dostumuzun gölgesini bul.",
    "Zıp Tavşan dostumuzun gölgesini bul.",
    "Sevimli Kedi dostumuzun gölgesini bul.",
    "Sadık Köpek dostumuzun gölgesini bul.",
    "Kırmızı Araba dostumuzun gölgesini bul.",
    "Hızlı Uçak dostumuzun gölgesini bul.",
    "Tatlı Elma dostumuzun gölgesini bul.",
    "Rengarenk Kelebek dostumuzun gölgesini bul.",
    "Yüzen Balık dostumuzun gölgesini bul."
]

# 5. Memory Grid
memory_items = [
    "Eşleşen sevimli görselleri bul! Dokun ve eşleştir."
]

out_lines = [
    "# Anasınıfı: Çocuğun duyduğu bütün cümleler\n"
]

# Group visual items by category
by_cat = {}
for cat, txt in visual_items:
    by_cat.setdefault(cat, []).append(txt)

for cat, texts in by_cat.items():
    out_lines.append(f"\n# {cat}\n")
    for t in texts:
        out_lines.append(f"{t}\n")

out_lines.append("\n# Balon Patlatma (Renkler, Sayılar ve Şekiller)\n")
for t in balloon_items:
    out_lines.append(f"{t}\n")

out_lines.append("\n# Dokunarak Sayma (Meyveler ve Nesneler)\n")
for t in count_tap_items:
    out_lines.append(f"{t}\n")

out_lines.append("\n# Gölgesini Bul (Hayvanlar ve Taşıtlar)\n")
for t in shadow_match_items:
    out_lines.append(f"{t}\n")

out_lines.append("\n# Sevimli Görsel Hafıza Kartları\n")
for t in memory_items:
    out_lines.append(f"{t}\n")

out_path = Path('tools/ses-uretimi/metinler/anasinifi.txt')
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text("".join(out_lines), encoding='utf-8')

# Verileri say ve kontrol et
raw_texts = [t for _, t in visual_items] + balloon_items + count_tap_items + shadow_match_items + memory_items
unique_texts = list(dict.fromkeys(raw_texts))

print(f"Toplam görsel soru: {len(visual_items)}")
print(f"Toplam balon seviyesi: {len(balloon_items)}")
print(f"Toplam sayma: {len(count_tap_items)}")
print(f"Toplam gölge: {len(shadow_match_items)}")
print(f"Toplam hafıza: {len(memory_items)}")
print(f"Toplam Anasınıfı cümlesi: {len(raw_texts)} (Benzersiz: {len(unique_texts)})")
print(f"Dosyaya yazıldı: {out_path}")
