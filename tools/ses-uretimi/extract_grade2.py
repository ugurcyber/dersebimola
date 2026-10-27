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

# 1. Zamanı Ölçme ve Saatler (26)
clocks = extract_pool_lines('grade2ClocksPool: [', 'grade2SynAntPool: [')
lines_by_section['2. Sınıf - Zamanı Ölçme ve Saatler'] = clocks

# 2. Eş ve Zıt Anlam Şampiyonası (45)
syn_ant = extract_pool_lines('grade2SynAntPool: [', 'grade2PunctuationPool: [')
lines_by_section['2. Sınıf - Eş ve Zıt Anlam Şampiyonası'] = syn_ant

# 3. Noktalama İşaretleri ve Yazım Kuralları (26)
punct = extract_pool_lines('grade2PunctuationPool: [', 'grade2TrafficSafeLifePool: [')
lines_by_section['2. Sınıf - Noktalama İşaretleri ve Yazım Kuralları'] = punct

# 4. Güvenli Hayat ve Trafik (26)
traffic = extract_pool_lines('grade2TrafficSafeLifePool: [', 'grade2CultureAndCountryPool: [')
lines_by_section['2. Sınıf - Güvenli Hayat ve Trafik'] = traffic

# 5. Ülkemiz ve Kültürümüz (26)
culture = extract_pool_lines('grade2CultureAndCountryPool: [', 'englishSchoolObjectsPool: [')
lines_by_section['2. Sınıf - Ülkemiz ve Kültürümüz'] = culture

# 6. Deste ve Düzine Soruları (5)
deste_duzine = [
    '1 deste kalem toplam kaç tanedir?',
    '2 deste kalem toplam kaç tanedir?',
    '3 deste kalem toplam kaç tanedir?',
    '1 düzine gül toplam kaç tanedir?',
    '2 düzine gül toplam kaç tanedir?'
]
lines_by_section['2. Sınıf - Deste ve Düzine Soruları'] = deste_duzine

# 7. Hayat Bilgisi Genel Havuz Soruları (4)
life_g2 = [
    'Acil bir sağlık yardımı veya ambulans gerektiğinde hangi numara aranır?',
    'Evimizde ve okulumuzda elektrik ve suyu boşa harcamamaya ne denir?',
    'Kullanılmış kağıt, cam ve plastikleri çöpe değil nereye atmalıyız?',
    'Şanlı bayrağımızın üzerindeki beyaz semboller nelerdir?'
]
lines_by_section['2. Sınıf - Hayat Bilgisi Genel Soruları'] = life_g2

# Write to 2-sinif.txt
out_path = Path('tools/ses-uretimi/metinler/2-sinif.txt')
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
