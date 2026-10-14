import os
import asyncio
import edge_tts

# Seslendirme klasörü
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sounds", "q")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Emel: Sıcak, sevecen ilkokul & anasınıfı öğretmen sesi
VOICE_TEACHER = "tr-TR-EmelNeural"
# Ahmet: TV yarışması stüdyo sunucusu
VOICE_ANNOUNCER = "tr-TR-AhmetNeural"

QUESTIONS = [
    # --- Anasınıfı Hayvanlar & Doğa ---
    ("q_kedi", VOICE_TEACHER, "Hangi sevimli hayvan miyav der?"),
    ("q_kopek", VOICE_TEACHER, "Hangi sadık dostumuz hav hav der?"),
    ("q_aslan", VOICE_TEACHER, "Ormanların kralı olan yeleli güçlü hayvan hangisidir?"),
    ("q_tavsan", VOICE_TEACHER, "Havuç yemeyi çok seven, uzun kulaklı zıp zıp hayvan hangisidir?"),
    ("q_balik", VOICE_TEACHER, "Mavi denizlerde yüzgeçleriyle yüzen sevimli canlı hangisidir?"),
    ("q_kus", VOICE_TEACHER, "Gökyüzünde kanat çırparak uçan ve cik cik öten hangisidir?"),
    ("q_fil", VOICE_TEACHER, "Hangisi çok daha büyüktür ve kocaman bir hortumu vardır?"),
    ("q_gunes", VOICE_TEACHER, "Gündüzleri gökyüzümüzü aydınlatan ve ısıtan sıcacık dostumuz hangisidir?"),
    ("q_inek", VOICE_TEACHER, "Bize lezzetli ve sağlıklı taze süt veren sevimli hayvan hangisidir?"),
    ("q_cilek", VOICE_TEACHER, "Hangisi tatlı, kırmızı ve çok lezzetli bir yaz meyvesidir?"),
    ("q_kurbaga", VOICE_TEACHER, "Derelerde vak vak diyerek neşeyle zıplayan yeşil dostumuz hangisidir?"),

    # --- Anasınıfı Renkler & Şekiller ---
    ("q_renk_kirmizi", VOICE_TEACHER, "Hangisi kırmızı renktir?"),
    ("q_renk_sari", VOICE_TEACHER, "Hangisi sarı renktir?"),
    ("q_renk_mavi", VOICE_TEACHER, "Hangisi mavi renktir?"),
    ("q_renk_yesil", VOICE_TEACHER, "Hangisi yeşil renktir?"),
    ("q_sekil_yildiz", VOICE_TEACHER, "Hangisi parlayan yıldız şeklidir?"),
    ("q_sekil_kalp", VOICE_TEACHER, "Hangisi sevgi dolu kalp şeklidir?"),
    ("q_sekil_ucgen", VOICE_TEACHER, "Hangisi üçgen şeklidir? Üç köşesi vardır!"),
    ("q_sekil_daire", VOICE_TEACHER, "Hangisi yuvarlak daire şeklidir?"),

    # --- Anasınıfı Meyve / Nesne Sayma (1-5) ---
    ("q_sayma_elma", VOICE_TEACHER, "Ekranda kaç tane kırmızı elma var? Birlikte sayalım!"),
    ("q_sayma_muz", VOICE_TEACHER, "Ekranda kaç tane sarı muz var? Birlikte sayalım!"),
    ("q_sayma_cilek", VOICE_TEACHER, "Ekranda kaç tane tatlı çilek var? Birlikte sayalım!"),
    ("q_sayma_portakal", VOICE_TEACHER, "Ekranda kaç tane turuncu portakal var? Birlikte sayalım!"),
    ("q_sayma_yildiz", VOICE_TEACHER, "Ekranda kaç tane parlak yıldız var? Birlikte sayalım!"),
    ("q_sayma_balon", VOICE_TEACHER, "Ekranda kaç tane renkli balon var? Birlikte sayalım!"),
    ("q_sayma_araba", VOICE_TEACHER, "Ekranda kaç tane sevimli araba var? Birlikte sayalım!"),

    # --- Görsel Dikkat & Farklı Olanı Bul ---
    ("q_farkli_olan", VOICE_TEACHER, "Bu grupta diğerlerinden farklı olan hangisidir?"),

    # --- Anasınıfı Kavramlar & Stroop ---
    ("q_daire_kirmizi", VOICE_TEACHER, "Bu sevimli daire hangi renktir?"),
    ("q_daire_mavi", VOICE_TEACHER, "Bu parlak daire hangi renktir?"),
    ("q_daire_sari", VOICE_TEACHER, "Bu sıcacık daire hangi renktir?"),
    ("q_daire_yesil", VOICE_TEACHER, "Bu doğa rengi daire hangi renktir?"),
    ("q_fil_vs_karinca", VOICE_TEACHER, "Hangisi gerçekte çok daha büyüktür?"),
    ("q_zurafa_vs_kaplumbaga", VOICE_TEACHER, "Hangisi çok daha uzundur?"),

    # --- 1. Sınıf Türkçe & Zıt Anlam ---
    ("q_zit_buyuk", VOICE_TEACHER, "Büyük kelimesinin zıt anlamlısı nedir?"),
    ("q_zit_uzun", VOICE_TEACHER, "Uzun kelimesinin zıt anlamlısı nedir?"),
    ("q_zit_sicak", VOICE_TEACHER, "Sıcak kelimesinin zıt anlamlısı nedir?"),
    ("q_zit_hizli", VOICE_TEACHER, "Hızlı kelimesinin zıt anlamlısı nedir?"),
    ("q_zit_acik", VOICE_TEACHER, "Açık kelimesinin zıt anlamlısı nedir?"),
    ("q_zit_dolu", VOICE_TEACHER, "Dolu kelimesinin zıt anlamlısı nedir?"),
    ("q_zit_gece", VOICE_TEACHER, "Gece kelimesinin zıt anlamlısı nedir?"),
    ("q_zit_agir", VOICE_TEACHER, "Ağır kelimesinin zıt anlamlısı nedir?"),
    ("q_zit_on", VOICE_TEACHER, "Ön kelimesinin zıt anlamlısı nedir?"),
    ("q_harf_sesli", VOICE_TEACHER, "Hangisi bir sesli, yani ünlü harftir?"),
    ("q_harf_kalem", VOICE_TEACHER, "Kalem kelimesi kaç harflidir?"),
    ("q_kus_ucan", VOICE_TEACHER, "Hangi hayvan havada uçar?"),

    # --- Stroop ve Genel Uyarı ---
    ("q_stroop_genel", VOICE_ANNOUNCER, "Dikkat! Kelimenin anlamına değil, yazıldığı renge bas!")
]

async def generate():
    print(f"Toplam {len(QUESTIONS)} ses dosyası üretiliyor...")
    for key, voice, text in QUESTIONS:
        path = os.path.join(OUTPUT_DIR, f"{key}.mp3")
        try:
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(path)
            print(f"[OK] {key}.mp3 olusturuldu")
        except Exception as e:
            print(f"[ERR] {key} hatasi: {e}")

if __name__ == "__main__":
    asyncio.run(generate())
