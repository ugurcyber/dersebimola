import asyncio
import os
import edge_tts

VOICE = "tr-TR-AhmetNeural"

SOUNDS = {
    "announcer_start.mp3": "Düello başlıyor! Hazır olun!",
    "announcer_blue_point.mp3": "Mavi takım puanı kaptı!",
    "announcer_red_point.mp3": "Kırmızı takım puanı kaptı!",
    "announcer_blue_win.mp3": "Tebrikler! Mavi Takım düelloyu kazandı!",
    "announcer_red_win.mp3": "Tebrikler! Kırmızı Takım düelloyu kazandı!",
    "announcer_lockout.mp3": "Eyvah! Yanlış cevap, ekran kilitlendi!",
    "announcer_bomb.mp3": "Dikkat! Bombaya dokunma!"
}

async def generate():
    output_dir = os.path.join(os.path.dirname(__file__), "sounds")
    os.makedirs(output_dir, exist_ok=True)
    
    for filename, text in SOUNDS.items():
        filepath = os.path.join(output_dir, filename)
        print(f"Ses oluşturuluyor: {filename} -> '{text}'")
        communicate = edge_tts.Communicate(text, VOICE, rate="+10%")
        await communicate.save(filepath)
        size = os.path.getsize(filepath)
        print(f"Tamamlandı: {filename} ({size} bayt)")

if __name__ == "__main__":
    asyncio.run(generate())
