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
    # strip emojis and variation selectors
    t = re.sub(r'[\U00010000-\U0010ffff]', '', t)
    t = re.sub(r'[\u2600-\u27bf]', '', t)
    t = re.sub(r'[\ufe00-\ufe0f]', '', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t

lines_by_section = {}

# 1. grade1BalloonLevelsPool (42)
b_start = content.find('grade1BalloonLevelsPool: [')
b_end = content.find('\n    ],', b_start)
balloon_block = content[b_start:b_end]
b_lines = []
for line in balloon_block.splitlines():
    m = re.search(r'spokenText:\s*([\'"])(.*?)\1\s*,', line)
    if m:
        txt = clean_text(m.group(2).replace(r"\'", "'").replace(r'\"', '"'))
        if not txt.endswith(('.', '!', '?')):
            txt += '.'
        b_lines.append(txt)
lines_by_section['1. Sınıf - Balon Seviyeleri (Harfler, Heceler, Sayılar, Ritmik Sayma, Toplama)'] = b_lines

# 2. grade1ShapesAndMoneyPool (25)
shapes_block = get_block('grade1ShapesAndMoneyPool: [', 'grade1AntonymsPool: [')
shapes_lines = []
for line in shapes_block.splitlines():
    m = re.search(r'q:\s*(?:\x27((?:[^\x27\x5c]|\x5c.)*)\x27|\x22((?:[^\x22\x5c]|\x5c.)*)\x22)', line)
    if m:
        raw = m.group(1) if m.group(1) is not None else m.group(2)
        txt = clean_text(raw.replace(r"\'", "'").replace(r'\"', '"'))
        if not txt.endswith(('.', '!', '?')):
            txt += '?'
        shapes_lines.append(txt)
lines_by_section['1. Sınıf - Geometrik Şekiller ve Paralarımız'] = shapes_lines

# 3. grade1AntonymsPool (35)
antonyms_block = get_block('grade1AntonymsPool: [', 'generateGrade1SyllablesAndLetters()')
antonyms_lines = []
for line in antonyms_block.splitlines():
    m = re.search(r'q:\s*(?:\x27((?:[^\x27\x5c]|\x5c.)*)\x27|\x22((?:[^\x22\x5c]|\x5c.)*)\x22)', line)
    if m:
        raw = m.group(1) if m.group(1) is not None else m.group(2)
        txt = clean_text(raw.replace(r"\'", "'").replace(r'\"', '"'))
        if not txt.endswith(('.', '!', '?')):
            txt += '?'
        antonyms_lines.append(txt)
lines_by_section['1. Sınıf - Zıt Anlamlı Kelimeler'] = antonyms_lines

# 4. grade1SchoolHomeLifePool (26)
school_block = get_block('grade1SchoolHomeLifePool: [', 'grade1HealthSeasonsPool: [')
school_lines = []
for line in school_block.splitlines():
    m = re.search(r'q:\s*(?:\x27((?:[^\x27\x5c]|\x5c.)*)\x27|\x22((?:[^\x22\x5c]|\x5c.)*)\x22)', line)
    if m:
        raw = m.group(1) if m.group(1) is not None else m.group(2)
        txt = clean_text(raw.replace(r"\'", "'").replace(r'\"', '"'))
        if not txt.endswith(('.', '!', '?')):
            txt += '?'
        school_lines.append(txt)
lines_by_section['1. Sınıf - Okulumuzda ve Evimizde Hayat'] = school_lines

# 5. grade1HealthSeasonsPool (26)
health_block = get_block('grade1HealthSeasonsPool: [', 'grade1TurkishPool: [')
health_lines = []
for line in health_block.splitlines():
    m = re.search(r'q:\s*(?:\x27((?:[^\x27\x5c]|\x5c.)*)\x27|\x22((?:[^\x22\x5c]|\x5c.)*)\x22)', line)
    if m:
        raw = m.group(1) if m.group(1) is not None else m.group(2)
        txt = clean_text(raw.replace(r"\'", "'").replace(r'\"', '"'))
        if not txt.endswith(('.', '!', '?')):
            txt += '?'
        health_lines.append(txt)
lines_by_section['1. Sınıf - Sağlıklı Hayat ve Mevsimler'] = health_lines

# 6. Syllable Builder (18)
syl_block = get_block('generateSyllableBuilderQuestion() {', 'generateCountTapQuestion() {')
syl_words = re.findall(r"word:\s*'([^']+)'", syl_block)
syl_lines = [f"{w.lower()} kelimesini oluştur." for w in syl_words]
lines_by_section['1. Sınıf - Hece Birleştirme Atölyesi'] = syl_lines

# 7. Word Catch (8)
wc_block = get_block('generateWordCatchQuestion() {', 'generateKindergartenMath()')
wc_lines = []
for line in wc_block.splitlines():
    m = re.search(r'spokenText:\s*([\'"])(.*?)\1\s*,', line)
    if m:
        txt = clean_text(m.group(2).replace(r"\'", "'").replace(r'\"', '"'))
        if not txt.endswith(('.', '!', '?')):
            txt += '?'
        wc_lines.append(txt)
lines_by_section['1. Sınıf - Hızlı Kelime Yakala'] = wc_lines

# 8. Syllables & Letters (Mode 0: 15 words, Mode 1: 1 question, Mode 2: 6 words)
sl_block = get_block('generateGrade1SyllablesAndLetters() {', 'grade1SchoolHomeLifePool: [')
mode0_words = re.findall(r"word:\s*'([^']+)'\s*,\s*count:\s*\d+\s*,\s*syllables:", sl_block)
mode2_words = re.findall(r"word:\s*'([^']+)'\s*,\s*vowels:", sl_block)

sl_lines = []
for w in mode0_words:
    sl_lines.append(f'"{w.lower()}" sözcüğü kaç hecelidir?')
sl_lines.append('Aşağıdakilerden hangisi bir sesli harftir?')
for w in mode2_words:
    sl_lines.append(f'"{w.lower()}" kelimesinde kaç tane sesli harf vardır?')
lines_by_section['1. Sınıf - Hece Sayısı ve Harf Bilgisi'] = sl_lines

# 9. Memory Grid (3)
mem_lines = [
    'Büyük harf ile küçük harfi eşleştir! Eşini bul.',
    'Zıt anlamlı kelimeleri eşleştir!',
    'Toplama işlemi ve sonucunu eşleştir!'
]
lines_by_section['1. Sınıf - Hafıza Kartları Yönergeleri'] = mem_lines

# 10. Hayat Bilgisi Genel Havuz (Ek 4 soru)
life_lines = [
    'Yemeklerden önce ve sonra sağlığımız için ne yapmalıyız?',
    'Trafikte karşıdan karşıya geçerken nereden geçmeliyiz?',
    'Türkiye Cumhuriyeti\'nin kurucusu ve ilk Cumhurbaşkanı kimdir?',
    'Sağlıklı büyümek ve gelişmek için sabahları ne yapmalıyız?'
]
lines_by_section['1. Sınıf - Hayat Bilgisi Genel Havuz Soruları'] = life_lines

# 11. Maarif Modeli (2026) İlk Okuma Yazma Etkinlikleri
node_script = """
const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');
const vm = require('vm');
const sandbox = { window: {}, console };
vm.createContext(sandbox);
const s = content.indexOf('const MAARIF_2026_CONFIG = {');
const e = content.indexOf('function getLearnedLettersUpTo');
const slice = content.slice(s, e);
vm.runInContext(slice.replace('const MAARIF_2026_CONFIG', 'var MAARIF_2026_CONFIG'), sandbox);

const map = {
  'a': 'a!', 'e': 'e!', 'ı': 'ı!', 'i': 'i!', 'o': 'o!', 'ö': 'ö!', 'u': 'u!', 'ü': 'ü!',
  'b': 'be!', 'c': 'ce!', 'ç': 'çe!', 'd': 'de!', 'f': 'fe!', 'g': 'ge!', 'ğ': 'yumuşak ge!',
  'h': 'he!', 'j': 'je!', 'k': 'ke!', 'l': 'le!', 'm': 'me!', 'n': 'ne!', 'p': 'pe!',
  'r': 're!', 's': 'se!', 'ş': 'şe!', 't': 'te!', 'v': 've!', 'y': 'ye!', 'z': 'ze!'
};

const lines = [];
for (const l of sandbox.MAARIF_2026_CONFIG.letterOrder) {
  lines.push('Hangisinin adında ' + map[l] + ' sesi vardır?');
  lines.push('Büyük ' + map[l] + ' harfinin küçük yazılışı hangisidir?');
  lines.push('Küçük ' + map[l] + ' harfinin büyük yazılışı hangisidir?');

  const data = sandbox.MAARIF_2026_CONFIG.letters[l];
  if (!data) continue;
  const pool = [...(data.soundWords || []), ...(data.noSoundWords || [])];
  for (const item of pool) {
    lines.push('\x22' + item.word + '\x22 adında ' + map[l] + ' sesi var mı?');
  }
  for (const item of (data.soundWords || [])) {
    lines.push('\x22' + item.word + '\x22 sözcüğünde ' + map[l] + ' sesi neresindedir?');
  }
}

const wordsSet = new Set();
for (const l of sandbox.MAARIF_2026_CONFIG.letterOrder) {
  const data = sandbox.MAARIF_2026_CONFIG.letters[l];
  if (!data || !data.cumulativeWords) continue;
  for (const w of data.cumulativeWords) {
    wordsSet.add(w.word.toLowerCase('tr-TR'));
  }
}
for (const w of wordsSet) {
  lines.push(w + ' kelimesini oluştur.');
  lines.push('Duyduğun kelimeyi yakala: ' + w + '!');
  lines.push(w + '!');
}
lines.push('Cümledeki eksik kelimeyi bul.');

process.stdout.write(JSON.stringify([...new Set(lines)]));
"""

import subprocess, json
res = subprocess.run(['node', '-e', node_script], capture_output=True, encoding='utf-8', check=True)
maarif_lines = json.loads(res.stdout)
lines_by_section['1. Sınıf - Maarif Modeli (2026) İlk Okuma Yazma Etkinlikleri'] = maarif_lines

# Write to 1-sinif.txt
out_path = Path('tools/ses-uretimi/metinler/1-sinif.txt')
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
