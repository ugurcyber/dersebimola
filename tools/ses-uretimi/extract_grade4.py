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

# 1. Kesirler, Zaman ve Açılar (26)
fractions = extract_pool_lines('grade4FractionsAnglesPool: [', 'generateGrade4PerimeterArea() {')
lines_by_section['4. Sınıf - Kesirler, Zaman ve Açılar'] = fractions

# 2. Deyimler ve Atasözleri Düellosu (35)
idioms = extract_pool_lines('grade4IdiomsProverbsPool: [', 'grade4SentencesLogicPool: [')
lines_by_section['4. Sınıf - Deyimler ve Atasözleri'] = idioms

# 3. Cümlede Anlam, Sebep-Sonuç ve Mantık (30)
sentences = extract_pool_lines('grade4SentencesLogicPool: [', 'grade4CrustNutritionPool: [')
lines_by_section['4. Sınıf - Cümlede Anlam ve Mantık'] = sentences

# 4. Yer Kabuğu, Hareketler ve Besinlerimiz (26)
crust = extract_pool_lines('grade4CrustNutritionPool: [', 'grade4CircuitsMagnetsPool: [')
lines_by_section['4. Sınıf - Yer Kabuğu ve Besinlerimiz'] = crust

# 5. Basit Elektrik Devreleri ve Mıknatıslar (26)
circuits = extract_pool_lines('grade4CircuitsMagnetsPool: [', 'grade4IdentityHeroesPool: [')
lines_by_section['4. Sınıf - Elektrik Devreleri ve Mıknatıslar'] = circuits

# 6. Birey, Toplum ve Milli Mücadele (26)
identity = extract_pool_lines('grade4IdentityHeroesPool: [', 'grade4PlacesEconomyPool: [')
lines_by_section['4. Sınıf - Birey, Toplum ve Milli Mücadele'] = identity

# 7. İnsanlar, Yerler ve Üretimden Tüketime (25)
places = extract_pool_lines('grade4PlacesEconomyPool: [', 'grade4CountriesRoutinesPool: [')
lines_by_section['4. Sınıf - İnsanlar, Yerler ve Üretim'] = places

# 8. Fen Bilimleri Genel Havuz Soruları (6)
sci_g4 = [
    'Vücudumuza gereken enerjiyi sağlayan temel besin grubu hangisidir?',
    'Yaralarımızın iyileşmesini, büyüme ve gelişmemizi sağlayan besin hangisidir?',
    'Suyun ısı kaybederek katı (buz) hale geçmesine ne ad verilir?',
    'Basit bir elektrik devresinde elektrik akımını açıp kapatmaya yarayan eleman nedir?',
    'Dünya\'nın kendi ekseni etrafında 1 tam tur dönmesiyle ne oluşur?',
    'Aşağıdakilerden hangisi saf bir maddedir?'
]
lines_by_section['4. Sınıf - Fen Bilimleri Genel Soruları'] = sci_g4

# Write to 4-sinif.txt
out_path = Path('tools/ses-uretimi/metinler/4-sinif.txt')
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
