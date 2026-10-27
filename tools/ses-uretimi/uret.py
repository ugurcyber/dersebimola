"""Uygulamanın sesli cümlelerini EMA Lightning ile seslendirir.

Kullanım (proje kökünden):
    .venv-ses\\Scripts\\python.exe tools/ses-uretimi/uret.py tools/ses-uretimi/metinler/ornek.txt
    ... uret.py metinler/*.txt --dinleme dinle.mp3      # hepsini art arda içeren dinleme dosyası
    ... uret.py --metin "Tebrikler, ke! sesini buldun!"  # tek metin
    ... uret.py --indeks                                # yalnızca index.json'u yeniden yaz
Her cümle CIKIS/<anahtar>.mp3 olur; kaydı olan cümle yeniden üretilmez (--yeniden ile zorlanır).
Anahtar hesabı uygulamadaki speechKey() ile BİREBİR aynıdır; biri değişirse öteki de değişmeli.
Metin dosyası: her satır bir sesli metin; boş satırlar ve # ile başlayanlar atlanır.
"""
import argparse, json, re, shutil, subprocess, sys, unicodedata
from pathlib import Path
import numpy as np

KOK = Path(__file__).resolve().parents[2]
CIKIS = KOK / "sesler"

HIZ = 0.9
CUMLE_BEKLEME = 0.4
VIRGUL_BEKLEME = 0.2
ORNEK_HIZI = 24000
SEED = 7
MP3_KALITE = "48k"
M32 = 0xFFFFFFFF

def _imul(a, b):
    return (a * b) & M32

def normalize(text):
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", text).strip())

def anahtar(text):
    """cyrb53 özeti, JavaScript charCodeAt (UTF-16) birimleriyle; 14 haneli onaltılık."""
    data = normalize(text).encode("utf-16-le")
    h1, h2 = 0xDEADBEEF, 0x41C6CE57
    for i in range(0, len(data), 2):
        ch = data[i] | (data[i + 1] << 8)
        h1 = _imul(h1 ^ ch, 2654435761)
        h2 = _imul(h2 ^ ch, 1597334677)
    h1 = _imul(h1 ^ (h1 >> 16), 2246822507)
    h1 ^= _imul(h2 ^ (h2 >> 13), 3266489909)
    h2 = _imul(h2 ^ (h2 >> 16), 2246822507)
    h2 ^= _imul(h1 ^ (h1 >> 13), 3266489909)
    return format(4294967296 * (2097151 & h2) + (h1 & M32), "x").zfill(14)

def cumleler(text):
    return [c for c in re.split(r"(?<=[.!?])\s+", normalize(text)) if c]

def sessizlik(sn):
    return np.zeros(int(sn * ORNEK_HIZI), dtype=np.float32)

def virgul_beklemeli(parca):
    """Virgülle biten kelimenin arkasına kısa sessizlik; cümle bölünmediği için tonlama bozulmaz."""
    ses = parca.audio.astype(np.float32)
    kesimler = [round(w.end * ORNEK_HIZI) for w in parca.words if w.text.endswith((",", ";", ":"))]
    out, son = [], 0
    for k in kesimler:
        k = min(k, len(ses))
        out += [ses[son:k], sessizlik(VIRGUL_BEKLEME)]
        son = k
    out.append(ses[son:])
    return np.concatenate(out)

def seslendir(tts, text):
    parcalar = tts.say(cumleler(text), seed=SEED, speed=HIZ, sample_rate=ORNEK_HIZI)
    out = []
    for i, p in enumerate(parcalar):
        if i:
            out.append(sessizlik(CUMLE_BEKLEME))
        out.append(virgul_beklemeli(p))
    return np.concatenate(out)

def mp3_yaz(ses, yol):
    pcm = (np.clip(ses, -1, 1) * 32767).astype("<i2").tobytes()
    ffmpeg_cmd = shutil.which("ffmpeg") or "ffmpeg"
    subprocess.run([ffmpeg_cmd, "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(ORNEK_HIZI), "-ac", "1",
                    "-i", "-", "-b:a", MP3_KALITE, str(yol)], input=pcm, check=True)

def metinleri_oku(dosyalar):
    m = []
    for d in dosyalar:
        for s in Path(d).read_text(encoding="utf-8").splitlines():
            s = s.strip()
            if s and not s.startswith("#"):
                m.append(normalize(s))
    return list(dict.fromkeys(m))

def indeks_yaz():
    keys = sorted(p.stem for p in CIKIS.glob("*.mp3"))
    (CIKIS / "index.json").write_text(json.dumps({"surum": 1, "anahtarlar": keys}, indent=2) + "\n", encoding="utf-8")
    return len(keys)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dosyalar", nargs="*")
    ap.add_argument("--metin", action="append", default=[])
    ap.add_argument("--yeniden", action="store_true")
    ap.add_argument("--indeks", action="store_true")
    ap.add_argument("--dinleme")
    a = ap.parse_args()
    CIKIS.mkdir(parents=True, exist_ok=True)
    if a.indeks:
        print(f"index.json: {indeks_yaz()} kayıt", file=sys.stderr); return
    metinler = metinleri_oku(a.dosyalar) + [normalize(m) for m in a.metin]
    if not metinler:
        ap.error("metin yok")
    from ema_lightning import EMA
    tts = EMA()
    yeni, dinleme = 0, []
    for m in metinler:
        yol = CIKIS / f"{anahtar(m)}.mp3"
        ses = None
        if a.yeniden or not yol.exists():
            ses = seslendir(tts, m); mp3_yaz(ses, yol); yeni += 1
        if a.dinleme:
            dinleme += [ses if ses is not None else seslendir(tts, m), sessizlik(1.0)]
    toplam = indeks_yaz()
    if a.dinleme:
        mp3_yaz(np.concatenate(dinleme), Path(a.dinleme))
    print(f"{len(metinler)} metin, {yeni} yeni kayıt; toplam {toplam} kayıt.", file=sys.stderr)

if __name__ == "__main__":
    main()
