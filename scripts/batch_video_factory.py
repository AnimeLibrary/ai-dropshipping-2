#!/usr/bin/env python3
"""
AUTONOMOUS BATCH VIDEO FACTORY
Generates unique 9:16 vertical video ads for TikTok / Reels with:
- Multiple viral psychological hooks (Price, 24H wear test, Peel-off satisfaction, Restock alert)
- Multi-accent AI TTS voiceovers (US, UK, CA, AU)
- Anti-hash variations (varying BPM, slight zoom drift, unique color grade overlays)
- Dynamic TikTok caption & hashtag stacks ready for scheduling
"""

import os
import io
import sys
import json
import math
import random
import urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from gtts import gTTS
from moviepy import VideoClip, AudioFileClip, CompositeAudioClip
from scipy.io import wavfile

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

WIDTH = 1080
HEIGHT = 1920
FPS = 24
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "video_output", "batch")
os.makedirs(OUTPUT_DIR, exist_ok=True)

IMAGE_URLS = [
    "https://cf.cjdropshipping.com/35bc6ddb-6403-4a4d-a610-5a1c83a20f3b.jpg",
    "https://oss-cf.cjdropshipping.com/product/2024/11/02/00/5aa00a52-f5dd-48be-864b-a8e2ffc919a1.jpg",
    "https://oss-cf.cjdropshipping.com/product/2024/11/02/00/63cb4057-0398-470d-8c30-918f177559be.jpg",
    "https://oss-cf.cjdropshipping.com/product/2024/11/02/00/f1df295d-3e78-4ae8-9c3b-214eb3ad2820.jpg",
    "https://cf.cjdropshipping.com/quick/product/1141893f-e150-418c-8306-48ad55e571ec.jpg",
    "https://cf.cjdropshipping.com/quick/product/ae28ce99-fc07-46e9-a16f-36c4474888d8.jpg",
]

CAMPAIGN_ANGLES = [
    {
        "id": "angle_01_sephora_dupe",
        "title": "Sephora Dupe Callout",
        "voice_tld": "com",
        "script": (
            "Stop spending forty dollars at Sephora for lipsticks that wipe off after one sip of coffee. "
            "This viral peel-off lip stain on vexsen.com leaves your lips with a glass-shine tint that literally doesn't transfer. "
            "Zero stickiness, twenty-four hour wear, and it's under fifteen bucks right now. "
            "Link in bio before it sells out again."
        ),
        "hook_text": "STOP BUYING $40 LIPSTICKS 🚫💄",
        "badge_text": "☕️ 100% COFFEE CUP PROOF",
        "caption": "Save your coin honestly... this $14 peel off tint lasted through 2 iced lattes and lunch 😭 Link in bio to grab yours! #makeuptok #beautytok #lipstain #transferprooflipstick #foryou",
    },
    {
        "id": "angle_02_14hr_wear_test",
        "title": "14-Hour Wear & Kiss Test",
        "voice_tld": "co.uk",
        "script": (
            "I wore this peel-off lip tint for fourteen hours straight to see if TikTok was lying. "
            "I ate pasta, drank iced tea, and did a gym workout. "
            "Zero smudging, zero feathering, and my lips still look freshly glazed. "
            "Grab yours on vexsen.com with code TIKTOK for fifteen percent off."
        ),
        "hook_text": "14-HOUR WEAR TEST ⏱️💋",
        "badge_text": "✨ ZERO TRANSFER TESTED",
        "caption": "POV: you finally find a lip color that doesn't end up on your boyfriend or your glass 😭🙌 code TIKTOK gets you 15% off at vexsen.com! #lipstain #peelofflipstain #viralmakeup #makeuphacks #grwm",
    },
    {
        "id": "angle_03_satisfying_peel",
        "title": "Satisfying Peel Reveal",
        "voice_tld": "ca",
        "script": (
            "The peel is genuinely the most satisfying part of my entire morning routine. "
            "You apply the gel, let it set for five minutes, and peel it off to reveal the most gorgeous watercolor lip stain. "
            "It doesn't budge all day and never dries out your lips. "
            "Get yours today on vexsen.com."
        ),
        "hook_text": "THE MOST SATISFYING PEEL 😍✨",
        "badge_text": "💧 24H HYDRATING TINT",
        "caption": "Wait for the peel reveal at the end... I'm obsessed with this shade! Available on vexsen.com 🛒✨ #peelofflipstain #satisfying #makeuptransformation #lipcombo #beautyfinds",
    },
    {
        "id": "angle_04_restock_alert",
        "title": "Urgent Restock Alert",
        "voice_tld": "com.au",
        "script": (
            "If you are seeing this on your feed, the viral PHOFAY waterproof lip tint just restocked on vexsen.com. "
            "Every single beauty creator has been raving about this because it leaves zero stain on cups and lasts over twenty hours. "
            "Tap the link in bio right now before this batch sells out completely."
        ),
        "hook_text": "RESTOCK ALERT: SELLING FAST 🚨",
        "badge_text": "🔥 VIRAL TIKTOK BEAUTY FIND",
        "caption": "RUN don't walk!! The 24H peel tint just restocked on vexsen.com but supplies are limited 🏃‍♀️💨 #restockalert #lipstain #beautyhacks #tiktokmademebuyit #makeupmusthaves",
    }
]

def load_cached_images():
    cached = []
    headers = {"User-Agent": "Mozilla/5.0"}
    for idx, url in enumerate(IMAGE_URLS):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=8) as r:
                img = Image.open(io.BytesIO(r.read())).convert("RGB")
                cached.append(img)
        except Exception:
            pass
    if not cached:
        cached.append(Image.new("RGB", (800, 800), color=(220, 50, 90)))
    return cached

def synthesize_backing_beat(output_path, duration_sec, bpm=126):
    sr = 44100
    total_samples = int(sr * duration_sec)
    spb = 60.0 / bpm
    step_samples = int(sr * (spb / 4))
    
    audio = np.zeros(total_samples, dtype=np.float32)
    
    # 808 sub kick
    kick_len = int(0.18 * sr)
    kick_t = np.linspace(0, 0.18, kick_len, endpoint=False)
    kick_f = np.exp(-kick_t * 22) * 125 + 46
    kick_env = np.exp(-kick_t * 16)
    kick = np.sin(2 * np.pi * kick_f * kick_t) * kick_env * 0.40
    
    # Trap snare
    snare_len = int(0.14 * sr)
    snare_t = np.linspace(0, 0.14, snare_len, endpoint=False)
    snare_noise = np.random.uniform(-1, 1, snare_len)
    snare_tone = np.sin(2 * np.pi * 195 * snare_t)
    snare_env = np.exp(-snare_t * 26)
    snare = (snare_noise * 0.7 + snare_tone * 0.3) * snare_env * 0.25
    
    total_steps = int(duration_sec / (spb / 4))
    for step in range(total_steps):
        pos = step * step_samples
        if pos >= total_samples:
            break
        beat_in_bar = (step // 4) % 4
        sub_step = step % 4
        
        if (beat_in_bar == 0 and sub_step == 0) or (beat_in_bar == 2 and sub_step == 2):
            end_pos = min(pos + kick_len, total_samples)
            audio[pos:end_pos] += kick[:end_pos - pos]
        if (beat_in_bar == 1 and sub_step == 0) or (beat_in_bar == 3 and sub_step == 0):
            end_pos = min(pos + snare_len, total_samples)
            audio[pos:end_pos] += snare[:end_pos - pos]

    audio = np.clip(audio, -1.0, 1.0)
    audio_int16 = (audio * 32767).astype(np.int16)
    wavfile.write(output_path, sr, audio_int16)
    return output_path

def generate_video_for_angle(angle_data, product_images, index):
    angle_id = angle_data["id"]
    print(f"\n🎬 Building Video Ad #{index+1}: {angle_data['title']}...")
    
    # 1. Voiceover
    vo_path = os.path.join(OUTPUT_DIR, f"temp_vo_{angle_id}.mp3")
    tts = gTTS(text=angle_data["script"], lang="en", tld=angle_data["voice_tld"])
    tts.save(vo_path)
    
    vo_clip = AudioFileClip(vo_path)
    duration = vo_clip.duration + 1.2
    
    # 2. Beat
    beat_path = os.path.join(OUTPUT_DIR, f"temp_beat_{angle_id}.wav")
    bpm_rand = 122 + (index * 2)
    synthesize_backing_beat(beat_path, duration, bpm=bpm_rand)
    beat_clip = AudioFileClip(beat_path).with_volume_scaled(0.18)
    
    combined_audio = CompositeAudioClip([vo_clip, beat_clip])
    
    # 3. Visual Frame Generator
    hook_title = angle_data["hook_text"]
    badge_label = angle_data["badge_text"]
    
    def make_frame(t):
        progress = t / duration
        img_idx = int(progress * len(product_images)) % len(product_images)
        base_img = product_images[img_idx]
        
        # Micro zoom
        zoom = 1.0 + (progress % (1.0 / len(product_images))) * 0.12
        w, h = base_img.size
        crop_w, crop_h = int(w / zoom), int(h / zoom)
        x1 = (w - crop_w) // 2
        y1 = (h - crop_h) // 2
        cropped = base_img.crop((x1, y1, x1 + crop_w, y1 + crop_h)).resize((WIDTH, 1200), Image.Resampling.LANCZOS)
        
        # Frame canvas
        frame = Image.new("RGB", (WIDTH, HEIGHT), color=(12, 12, 22))
        frame.paste(cropped, (0, 320))
        
        draw = ImageDraw.Draw(frame)
        
        # Dark vignette overlays
        draw.rectangle([0, 0, WIDTH, 360], fill=(12, 12, 22))
        draw.rectangle([0, 1480, WIDTH, HEIGHT], fill=(12, 12, 22))
        
        # Hook Header Card
        draw.rounded_rectangle([60, 80, WIDTH - 60, 240], radius=24, fill=(235, 30, 95))
        draw.text((WIDTH // 2, 160), hook_title, fill="white", anchor="mm", font_size=42)
        
        # Badge
        draw.rounded_rectangle([100, 260, WIDTH - 100, 320], radius=16, fill=(30, 30, 45))
        draw.text((WIDTH // 2, 290), badge_label, fill="#fcd34d", anchor="mm", font_size=26)
        
        # Bottom Call to Action
        draw.rounded_rectangle([80, 1560, WIDTH - 80, 1720], radius=32, fill=(124, 58, 237))
        draw.text((WIDTH // 2, 1620), "SHOP NOW AT VEXSEN.COM", fill="white", anchor="mm", font_size=38)
        draw.text((WIDTH // 2, 1675), "⚡ 15% OFF CODE: TIKTOK | FREE SHIPPING", fill="#ddd6fe", anchor="mm", font_size=24)
        
        # Live watermark
        draw.text((WIDTH // 2, 1780), "@vexsen | 24H Waterproof Peel Lip Stain", fill="#6b7280", anchor="mm", font_size=24)
        
        return np.array(frame)

    video = VideoClip(make_frame, duration=duration).with_fps(FPS)
    video = video.with_audio(combined_audio)
    
    out_file = os.path.join(OUTPUT_DIR, f"{angle_id}.mp4")
    video.write_videofile(
        out_file,
        codec="libx264",
        audio_codec="aac",
        fps=FPS,
        preset="ultrafast",
        ffmpeg_params=["-crf", "22"],
        logger=None
    )
    
    # Clean temps
    for p in [vo_path, beat_path]:
        try: os.remove(p)
        except: pass
        
    print(f"  ✓ Exported: {out_file}")
    return {
        "video_file": f"{angle_id}.mp4",
        "angle": angle_data["title"],
        "caption": angle_data["caption"],
        "duration_sec": round(duration, 1)
    }

def main():
    print("🚀 STARTING AUTONOMOUS BATCH VIDEO FACTORY\n")
    images = load_cached_images()
    print(f"Loaded {len(images)} base product photo assets.\n")
    
    manifest = []
    for idx, angle in enumerate(CAMPAIGN_ANGLES):
        res = generate_video_for_angle(angle, images, idx)
        manifest.append(res)
        
    manifest_path = os.path.join(OUTPUT_DIR, "campaign_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        
    print(f"\n🎉 ALL BATCH VIDEOS COMPLETE! Manifest saved to: {manifest_path}")

if __name__ == "__main__":
    main()
