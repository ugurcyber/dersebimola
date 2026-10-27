import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
content = Path('app.js').read_text(encoding='utf-8')

def get_block(start_str, end_str):
    s = content.find(start_str)
    if s == -1:
        raise ValueError(f"Start string not found: {start_str}")
    e = content.find(end_str, s)
    if e == -1:
        raise ValueError(f"End string not found: {end_str}")
    return content[s:e]

def clean_text(t):
    # strip emojis, symbols, variation selectors, ZWJ
    t = re.sub(r'[\U00010000-\U0010ffff\u2300-\u23ff\u2600-\u27bf\u2b00-\u2bff\ufe00-\ufe0f\u200b-\u200f]', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

lines_by_section = {}

def extract_pool_lines(start_str, end_str, default_end='?'):
    block = get_block(start_str, end_str)
    res = []
    for line in block.splitlines():
        m = re.search(r'q:\s*(?:\x27((?:[^\x27\x5c]|\x5c.)*)\x27|\x22((?:[^\x22\x5c]|\x5c.)*)\x22)', line)
        if m:
            raw = m.group(1) if m.group(1) is not None else m.group(2)
            txt = clean_text(raw.replace(r"\'", "'").replace(r'\"', '"'))
            if not txt.endswith(('.', '!', '?')):
                txt += default_end
            res.append(txt)
    return res

# 1. Kesirler & Geometrik Cisimler (26)
fractions = extract_pool_lines('grade3FractionsAndShapesPool: [', 'grade3HomonymsFigurativePool: [')
lines_by_section['3. Sınıf - Kesirler ve Geometrik Cisimler'] = fractions

# 2. Eş Sesli Kelimeler & Mecaz Anlam (30)
homonyms = extract_pool_lines('grade3HomonymsFigurativePool: [', 'grade3Punctuation5N1KPool: [')
lines_by_section['3. Sınıf - Eş Sesli Kelimeler ve Mecaz Anlam'] = homonyms

# 3. Noktalama, Yazım Kuralları & 5N1K (26)
punct = extract_pool_lines('grade3Punctuation5N1KPool: [', 'grade3EarthSensesPool: [')
lines_by_section['3. Sınıf - Noktalama İşaretleri ve 5N1K'] = punct

# 4. Gezegenimiz Dünya ve Beş Duyumuz (26)
earth = extract_pool_lines('grade3EarthSensesPool: [', 'grade3ForceMatterPool: [')
lines_by_section['3. Sınıf - Gezegenimiz Dünya ve Beş Duyumuz'] = earth

# 5. Kuvveti Tanıyalım ve Madde (26)
force = extract_pool_lines('grade3ForceMatterPool: [', 'grade3CompassConsumerPool: [')
lines_by_section['3. Sınıf - Kuvveti Tanıyalım ve Madde'] = force

# 6. Yönlerimiz, Kroki ve Tüketici Hakları (26)
compass = extract_pool_lines('grade3CompassConsumerPool: [', 'grade3FamilyFeelingsPool: [')
lines_by_section['3. Sınıf - Yönlerimiz, Kroki ve Tüketici Hakları'] = compass

# 7. Sözel Çarpma ve Bölme Problemleri (5)
mult_div_word = [
    'Günde 8 sayfa kitap okuyan Zeynep, 7 günde toplam kaç sayfa okur?',
    'Bir pastanede 6 tepsi kurabiye var. Her tepside 9 kurabiye olduğuna göre toplam kaç kurabiye vardır?',
    'Tanesi 7 TL olan defterlerden 8 tane alan Can kırtasiyeciye kaç TL öder?',
    '48 cevizi 6 kardeş eşit olarak paylaştığında her birine kaç ceviz düşer?',
    '72 misketi 8 arkadaş eşit paylaşıyor. Her bir arkadaşa kaç misket düşer?'
]
lines_by_section['3. Sınıf - Çarpma ve Bölme Problemleri'] = mult_div_word

# 8. 3. Sınıf Fen ve Hayat Bilgisi Genel Havuz Soruları (8)
gen_g3 = [
    'Deprem sarsıntısı başladığında güvenli bir yerde hangi hareketi yaparız?',
    'İlçemizi yöneten en yetkili mülki idare amiri kimdir?',
    'Pusula ibresinin renkli ucu daima hangi yönü gösterir?',
    'Dünyamızın uzaydan çekilen fotoğraflarına göre şekli neye benzer?',
    'Çevremizdeki sesleri algılamamızı sağlayan duyu organımız hangisidir?',
    'Mıknatıs aşağıdaki maddelerden hangisini ÇEKER?',
    'Hareketsiz bir topu durduğu yerden hareket ettirmek için ne uygularız?',
    'Işık olmadan göremeyiz. Dünyamızın en büyük doğal ışık kaynağı nedir?'
]
lines_by_section['3. Sınıf - Fen ve Hayat Bilgisi Genel Soruları'] = gen_g3

# 9. Romen Rakamları Soruları (40)
roman_map = [
    ('I', 1), ('II', 2), ('III', 3), ('IV', 4), ('V', 5),
    ('VI', 6), ('VII', 7), ('VIII', 8), ('IX', 9), ('X', 10),
    ('XI', 11), ('XII', 12), ('XIII', 13), ('XIV', 14), ('XV', 15),
    ('XVI', 16), ('XVII', 17), ('XVIII', 18), ('XIX', 19), ('XX', 20)
]
roman_lines = []
for r, n in roman_map:
    roman_lines.append(f'Romen rakamıyla "{r}" hangi doğal sayıdır?')
for r, n in roman_map:
    roman_lines.append(f'"{n}" doğal sayısının ROMEN RAKAMIYLA yazılışı hangisidir?')
lines_by_section['3. Sınıf - Romen Rakamları Soruları'] = roman_lines

# Write to 3-sinif.txt
out_path = Path('tools/ses-uretimi/metinler/3-sinif.txt')
out_path.parent.mkdir(parents=True, exist_ok=True)

all_lines = []
total_sentences = 0
for sec_title, sec_lines in lines_by_section.items():
    all_lines.append(f"# {sec_title} ({len(sec_lines)} Cümle)")
    for l in sec_lines:
        all_lines.append(l)
        total_sentences += 1
    all_lines.append("")

out_path.write_text('\n'.join(all_lines), encoding='utf-8')

print(f"Toplam Bölüm: {len(lines_by_section)}")
print(f"Toplam Cümle: {total_sentences}")
for sec_title, sec_lines in lines_by_section.items():
    print(f"  - {sec_title}: {len(sec_lines)}")
