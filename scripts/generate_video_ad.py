import os
import io
import math
import urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from gtts import gTTS
from moviepy import VideoClip, AudioFileClip, CompositeAudioClip
from scipy.io import wavfile

# Configuration
WIDTH = 1080
HEIGHT = 1920
FPS = 24
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "video_output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

IMAGE_URLS = [
    "https://cf.cjdropshipping.com/35bc6ddb-6403-4a4d-a610-5a1c83a20f3b.jpg",
    "https://oss-cf.cjdropshipping.com/product/2024/11/02/00/5aa00a52-f5dd-48be-864b-a8e2ffc919a1.jpg",
    "https://oss-cf.cjdropshipping.com/product/2024/11/02/00/eaf774ab-35e8-4e09-9cd7-984a0b1019d8.jpg",
    "https://oss-cf.cjdropshipping.com/product/2024/11/02/00/63cb4057-0398-470d-8c30-918f177559be.jpg",
    "https://oss-cf.cjdropshipping.com/product/2024/11/02/00/f1df295d-3e78-4ae8-9c3b-214eb3ad2820.jpg",
    "https://oss-cf.cjdropshipping.com/product/2024/11/02/00/07136898-a5b1-41c7-bbbc-acb717d88ca8.jpg"
]

VOICEOVER_TEXT = (
    "Stop wasting 40 dollars on sticky lipsticks that wipe off after one sip! "
    "TikTok is going crazy over this new PHOFAY 24 hour peel and glow lip tint. "
    "Just swipe it on, peel it off, and you get waterproof, smudge-proof, mirror glass lips all day without any stickiness. "
    "It actually lasts through coffee, food, and workouts. "
    "Only 18 dollars right now on vexsen.com. Tap the link in bio to get yours before this batch sells out!"
)

def download_images():
    images = []
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    print("Downloading product images...")
    for idx, url in enumerate(IMAGE_URLS):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read()
                img = Image.open(io.BytesIO(data)).convert("RGB")
                images.append(img)
                print(f"Downloaded image {idx+1}/{len(IMAGE_URLS)}")
        except Exception as e:
            print(f"Failed to download {url}: {e}")
    if not images:
        images.append(Image.new("RGB", (800, 800), color=(180, 40, 80)))
    return images

def generate_voiceover(output_path):
    print("Generating AI Voiceover...")
    tts = gTTS(text=VOICEOVER_TEXT, lang='en', tld='com')
    tts.save(output_path)
    return output_path

def generate_backing_beat(output_path, duration_sec):
    print("Synthesizing 124 BPM lo-fi trap beat...")
    sr = 44100
    total_samples = int(sr * duration_sec)
    bpm = 124
    spb = 60.0 / bpm
    step_samples = int(sr * (spb / 4)) # 16th notes
    
    audio = np.zeros(total_samples, dtype=np.float32)
    
    kick_len = int(0.18 * sr)
    kick_t = np.linspace(0, 0.18, kick_len, endpoint=False)
    kick_f = np.exp(-kick_t * 22) * 120 + 45
    kick_env = np.exp(-kick_t * 16)
    kick = np.sin(2 * np.pi * kick_f * kick_t) * kick_env * 0.45
    
    snare_len = int(0.14 * sr)
    snare_t = np.linspace(0, 0.14, snare_len, endpoint=False)
    snare_noise = np.random.uniform(-1, 1, snare_len)
    snare_tone = np.sin(2 * np.pi * 190 * snare_t)
    snare_env = np.exp(-snare_t * 26)
    snare = (snare_noise * 0.7 + snare_tone * 0.3) * snare_env * 0.28
    
    hihat_len = int(0.04 * sr)
    hihat_t = np.linspace(0, 0.04, hihat_len, endpoint=False)
    hihat_env = np.exp(-hihat_t * 60)
    hihat = np.random.uniform(-1, 1, hihat_len) * hihat_env * 0.12
    
    total_steps = int(duration_sec / (spb / 4))
    for step in range(total_steps):
        pos = step * step_samples
        if pos >= total_samples:
            break
        beat_in_bar = (step // 4) % 4
        sub_step = step % 4
        
        # Kick on 1 and off-beats
        if (beat_in_bar == 0 and sub_step == 0) or (beat_in_bar == 2 and sub_step == 2):
            end_pos = min(pos + kick_len, total_samples)
            audio[pos:end_pos] += kick[:end_pos - pos]
            
        # Snare on 2 and 4
        if (beat_in_bar == 1 and sub_step == 0) or (beat_in_bar == 3 and sub_step == 0):
            end_pos = min(pos + snare_len, total_samples)
            audio[pos:end_pos] += snare[:end_pos - pos]
            
        # Hi-hat on every 8th note
        if sub_step in (0, 2):
            end_pos = min(pos + hihat_len, total_samples)
            audio[pos:end_pos] += hihat[:end_pos - pos]

    # Warm 808 bass notes (D2, F2, C2, G2)
    chords = [73.42, 87.31, 65.41, 98.0] # D, F, C, G
    bar_samples = int(sr * spb * 4)
    for i in range(int(duration_sec / (spb * 4)) + 1):
        freq = chords[i % len(chords)]
        b_pos = i * bar_samples
        b_len = min(bar_samples, total_samples - b_pos)
        if b_len <= 0:
            break
        b_t = np.linspace(0, b_len / sr, b_len, endpoint=False)
        bass = np.sin(2 * np.pi * freq * b_t) * 0.18 * (0.8 + 0.2 * np.cos(2 * np.pi * 0.5 * b_t))
        audio[b_pos:b_pos + b_len] += bass

    # Soft limiter / normalizer
    max_val = np.max(np.abs(audio))
    if max_val > 0.01:
        audio = audio / max_val * 0.35 # Keep backing music subtle under voiceover
        
    audio_int16 = (audio * 32767).astype(np.int16)
    wavfile.write(output_path, sr, audio_int16)
    return output_path

def get_fonts():
    try:
        font_huge = ImageFont.truetype("arialbd.ttf", 64)
        font_big = ImageFont.truetype("arialbd.ttf", 46)
        font_med = ImageFont.truetype("arialbd.ttf", 36)
        font_small = ImageFont.truetype("arialbd.ttf", 26)
    except Exception:
        font_huge = ImageFont.load_default()
        font_big = ImageFont.load_default()
        font_med = ImageFont.load_default()
        font_small = ImageFont.load_default()
    return font_huge, font_big, font_med, font_small

def draw_pill(draw, xy, text, font, bg_color, text_color, pad=(20, 10)):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x, y = xy
    box = [x, y, x + tw + pad[0] * 2, y + th + pad[1] * 2]
    r = (box[3] - box[1]) // 2
    draw.rounded_rectangle(box, radius=r, fill=bg_color)
    draw.text((x + pad[0], y + pad[1] - bbox[1]), text, font=font, fill=text_color)
    return box

def render_frame(t, duration, images, fonts):
    font_huge, font_big, font_med, font_small = fonts
    frame = Image.new("RGBA", (WIDTH, HEIGHT), color=(10, 10, 16, 255))
    
    if t < 3.5:
        scene = "hook"
        img_idx = 0
    elif t < 7.5:
        scene = "comparison"
        img_idx = 1
    elif t < 12.0:
        scene = "shades"
        img_idx = 2 + int(((t - 7.5) / 4.5) * 3) % len(images)
    elif t < 16.5:
        scene = "proof"
        img_idx = 4 % len(images)
    else:
        scene = "cta"
        img_idx = 0

    img = images[img_idx % len(images)].convert("RGBA")
    
    # Ken Burns Zoom & Pan effect
    zoom = 1.05 + 0.08 * math.sin(t * 1.2)
    new_w = int(WIDTH * zoom)
    new_h = int(WIDTH * (img.height / img.width) * zoom)
    img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Background subtle blur
    bg_blur = img.resize((WIDTH // 4, HEIGHT // 4), Image.Resampling.BOX).filter(ImageFilter.GaussianBlur(15))
    bg_blur = bg_blur.resize((WIDTH, HEIGHT), Image.Resampling.BICUBIC)
    bg_blur = ImageEnhance.Brightness(bg_blur).enhance(0.35)
    frame.paste(bg_blur, (0, 0))
    
    # Card container in center
    card_w = 960
    card_h = 1000
    card_x = (WIDTH - card_w) // 2
    card_y = 380
    
    # Crop resized image to fit card
    cx = (new_w - card_w) // 2
    cy = max(0, (new_h - card_h) // 2)
    cropped_img = img_resized.crop((cx, cy, cx + card_w, cy + card_h))
    
    # Mask rounded corners for image
    mask = Image.new("L", (card_w, card_h), 0)
    draw_mask = ImageDraw.Draw(mask)
    draw_mask.rounded_rectangle([0, 0, card_w, card_h], radius=36, fill=255)
    
    frame.paste(cropped_img, (card_x, card_y), mask)
    
    # Card glow border
    draw = ImageDraw.Draw(frame)
    draw.rounded_rectangle([card_x, card_y, card_x + card_w, card_y + card_h], radius=36, outline=(255, 255, 255, 60), width=3)
    
    # Top Progress Bar (TikTok Retention hack)
    prog_w = int(WIDTH * (t / duration))
    draw.rectangle([0, 0, WIDTH, 10], fill=(30, 30, 40, 255))
    draw.rectangle([0, 0, prog_w, 10], fill=(236, 72, 153, 255))
    
    # Header Brand Tag
    draw_pill(draw, (card_x, 70), "VEXSEN.COM • OFFICIAL", font_small, (20, 20, 30, 220), (255, 255, 255, 240))
    
    # Floating live viewers badge
    viewers_count = 1420 + int(30 * math.sin(t * 3))
    draw_pill(draw, (WIDTH - card_x - 220, 70), f"🔥 {viewers_count} Buying", font_small, (220, 38, 38, 230), (255, 255, 255))

    # Scene specific overlays
    if scene == "hook":
        draw.rounded_rectangle([card_x, 150, card_x + card_w, 330], radius=24, fill=(0, 0, 0, 210), outline=(239, 68, 68, 200), width=3)
        draw.text((card_x + 30, 175), "STOP BUYING $40 GLOSS! 🚫", font=font_huge, fill=(248, 113, 113, 255))
        draw.text((card_x + 30, 260), "Why is everyone throwing away sticky lipstick?", font=font_med, fill=(255, 255, 255, 230))
        draw_pill(draw, (card_x + 40, card_y + 40), "✨ 24H PEEL & GLOW", font_big, (236, 72, 153, 240), (255, 255, 255))

    elif scene == "comparison":
        draw.rounded_rectangle([card_x, 140, card_x + card_w, 340], radius=24, fill=(0, 0, 0, 215), outline=(139, 92, 246, 200), width=3)
        draw.text((card_x + 30, 160), "REGULAR GLOSS VS PHOFAY", font=font_huge, fill=(192, 132, 252, 255))
        draw.text((card_x + 30, 245), "❌ Sticky hair & stains cups", font=font_med, fill=(248, 113, 113, 255))
        draw.text((card_x + 30, 290), "✅ 100% Transfer-proof mirror shine", font=font_med, fill=(74, 222, 128, 255))
        draw_pill(draw, (card_x + 40, card_y + 40), "💦 ZERO STICKINESS", font_big, (59, 130, 246, 240), (255, 255, 255))

    elif scene == "shades":
        draw.rounded_rectangle([card_x, 140, card_x + card_w, 340], radius=24, fill=(0, 0, 0, 215), outline=(236, 72, 153, 200), width=3)
        draw.text((card_x + 30, 160), "4 VIRAL GLASS SHADES", font=font_huge, fill=(244, 114, 182, 255))
        draw.text((card_x + 30, 250), "Swipe • Peel • Instant Glass Lips", font=font_big, fill=(255, 255, 255, 240))
        draw_pill(draw, (card_x + 40, card_y + 40), "💄 PEEL-OFF TECHNOLOGY", font_big, (168, 85, 247, 240), (255, 255, 255))

    elif scene == "proof":
        draw.rounded_rectangle([card_x, 140, card_x + card_w, 340], radius=24, fill=(0, 0, 0, 215), outline=(245, 158, 11, 200), width=3)
        draw.text((card_x + 30, 160), "⭐⭐⭐⭐⭐ 4.9 / 5 RATED", font=font_huge, fill=(251, 191, 36, 255))
        draw.text((card_x + 30, 250), "“Lasted through a 3-course dinner & drinks!”", font=font_med, fill=(255, 255, 255, 240))
        draw_pill(draw, (card_x + 40, card_y + 40), "🛡️ 30-DAY MONEY-BACK GUARANTEE", font_med, (16, 185, 129, 240), (255, 255, 255))

    else: # CTA
        draw.rounded_rectangle([card_x, 140, card_x + card_w, 340], radius=24, fill=(0, 0, 0, 215), outline=(236, 72, 153, 220), width=3)
        draw.text((card_x + 30, 160), "LIMITED RESTOCK: 50% OFF", font=font_huge, fill=(236, 72, 153, 255))
        draw.text((card_x + 30, 250), "Fast Tracked 7-12 Day Delivery in US", font=font_big, fill=(255, 255, 255, 240))
        draw_pill(draw, (card_x + 40, card_y + 40), "⚡ ONLY $18.00 TODAY", font_big, (220, 38, 38, 240), (255, 255, 255))

    # Bottom Fixed CTA Card
    cta_y = card_y + card_h + 40
    cta_h = 360
    
    draw.rounded_rectangle([card_x, cta_y, card_x + card_w, cta_y + cta_h], radius=28, fill=(18, 18, 28, 235), outline=(255, 255, 255, 30), width=2)
    
    draw.text((card_x + 40, cta_y + 35), "PHOFAY 24H Lip Tint", font=font_big, fill=(255, 255, 255, 255))
    draw.text((card_x + card_w - 280, cta_y + 30), "$18.00", font=font_huge, fill=(74, 222, 128, 255))
    draw.text((card_x + card_w - 140, cta_y + 45), "$25.20", font=font_med, fill=(156, 163, 175, 200))
    
    btn_pulse = int(6 * math.sin(t * 6))
    btn_box = [card_x + 40 - btn_pulse, cta_y + 125 - btn_pulse, card_x + card_w - 40 + btn_pulse, cta_y + 245 + btn_pulse]
    draw.rounded_rectangle(btn_box, radius=24, fill=(124, 58, 237, 255), outline=(192, 132, 252, 255), width=3)
    
    cta_text = "👉 TAP LINK IN BIO TO SHOP 👈"
    c_bbox = draw.textbbox((0, 0), cta_text, font=font_big)
    c_w = c_bbox[2] - c_bbox[0]
    draw.text((card_x + (card_w - c_w) // 2, cta_y + 155), cta_text, font=font_big, fill=(255, 255, 255, 255))
    
    guarantee_text = "🔒 Secure Stripe Checkout • 30-Day Money-Back • Insured Shipping"
    g_bbox = draw.textbbox((0, 0), guarantee_text, font=font_small)
    g_w = g_bbox[2] - g_bbox[0]
    draw.text((card_x + (card_w - g_w) // 2, cta_y + 285), guarantee_text, font=font_small, fill=(156, 163, 175, 240))
    
    return np.array(frame.convert("RGB"))

def main():
    images = download_images()
    fonts = get_fonts()
    
    vo_path = os.path.join(OUTPUT_DIR, "viral_voiceover.mp3")
    generate_voiceover(vo_path)
    vo_clip = AudioFileClip(vo_path)
    duration = vo_clip.duration + 1.2
    print(f"Total video duration: {duration:.2f} seconds")
    
    beat_path = os.path.join(OUTPUT_DIR, "backing_beat.wav")
    generate_backing_beat(beat_path, duration)
    beat_clip = AudioFileClip(beat_path)
    
    beat_ducked = beat_clip.with_volume_scaled(0.35)
    vo_ducked = vo_clip.with_volume_scaled(1.0)
    final_audio = CompositeAudioClip([beat_ducked, vo_ducked]).with_duration(duration)
    
    print("Compositing video frames...")
    video_clip = VideoClip(frame_function=lambda t: render_frame(t, duration, images, fonts), duration=duration)
    video_clip = video_clip.with_audio(final_audio)
    
    output_mp4 = os.path.join(OUTPUT_DIR, "vexsen_phofay_viral_v2.mp4")
    print(f"Rendering high-converting 9:16 ad to {output_mp4}...")
    video_clip.write_videofile(
        output_mp4,
        fps=FPS,
        codec="libx264",
        audio_codec="aac",
        preset="fast",
        threads=4
    )
    
    downloads_path = r"C:\Users\brann\Downloads\vexsen_phofay_viral_v2.mp4"
    try:
        import shutil
        shutil.copyfile(output_mp4, downloads_path)
        print(f"SUCCESS: Copied video to {downloads_path}")
    except Exception as e:
        print(f"Copy failed, trying hardlink: {e}")
        try:
            if os.path.exists(downloads_path):
                os.remove(downloads_path)
            os.link(output_mp4, downloads_path)
            print(f"SUCCESS: Hardlinked video to {downloads_path}")
        except Exception as e2:
            print(f"Hardlink also failed: {e2}")

if __name__ == "__main__":
    main()
