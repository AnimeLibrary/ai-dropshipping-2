import os
import io
import math
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
from gtts import gTTS
from moviepy import VideoClip, AudioFileClip, CompositeAudioClip, concatenate_audioclips
from scipy.io import wavfile

# Configuration
WIDTH = 1080
HEIGHT = 1920
FPS = 24
DURATION = 30.0
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "video_output")
ASSETS_DIR = os.path.join(os.path.dirname(__file__), "video_assets")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 4 COMPLETELY DISTINCT GIRLS
CREATORS = [
    {
        "name": "@chloe.beautyfinds",
        "image_path": r"C:\Users\brann\.gemini\antigravity-ide\brain\3379c853-a86f-4925-b0e3-3f5b6636155f\ugc_multi_girl1_hook_1790999663326.jpg", # Blonde in sweater holding PHOFAY tube
        "tld": "com",
        "voice_text": "Why did nobody tell me about this PHOFAY peel-off lip stain before?!",
        "caption": "Why did nobody tell me about this PHOFAY peel-off lip stain?! 😭",
        "highlight": "PHOFAY",
        "tag": "🔥 VIRAL TIKTOK FIND"
    },
    {
        "name": "@maya.glam",
        "image_path": r"C:\Users\brann\.gemini\antigravity-ide\brain\3379c853-a86f-4925-b0e3-3f5b6636155f\ugc_girl_peeling_tint_1790994035997.jpg", # Brunette peeling dried lip film
        "tld": "ca",
        "voice_text": "Look at this peel... you literally peel it off and it leaves the prettiest glass lips!",
        "caption": "The peel is so satisfying... LOOK AT THIS SHINE! 😍",
        "highlight": "LOOK AT THIS",
        "tag": "✨ 24H PEEL & GLOW"
    },
    {
        "name": "@sarah_aesthetic",
        "image_path": os.path.join(ASSETS_DIR, "creators", "creator_daylight.jpg"), # Auburn hair girl in daylight
        "tld": "co.uk",
        "voice_text": "It literally does not budge. No transfer on coffee cups, zero stickiness, and lasts all day.",
        "caption": "Rub test: zero transfer on coffee cups & 100% smudge-proof ☕️",
        "highlight": "zero transfer",
        "tag": "☕️ NO TRANSFER TEST"
    },
    {
        "name": "@emily.lips",
        "image_path": os.path.join(ASSETS_DIR, "creators", "creator_brunette.jpg"), # Eurasian model with glossy glass lips
        "tld": "com.au",
        "voice_text": "I got the four-shade bundle on vexsen.com for only eighteen bucks. Grab yours before it sells out!",
        "caption": "Grab the 4-shade bundle on VEXSEN.COM for only $18! 🛒",
        "highlight": "$18",
        "tag": "⚡ 50% OFF TODAY"
    }
]

# Product bottle bundle image for Scene 4 overlay
BUNDLE_IMG_PATH = os.path.join(ASSETS_DIR, "model_demo.jpg")

def load_and_prep_images():
    imgs = []
    for c in CREATORS:
        img = Image.open(c["image_path"]).convert("RGB")
        img = img.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
        imgs.append(np.array(img))
    return imgs

def compute_optical_flow_pairs(imgs):
    print("Computing inter-creator transition flows...")
    flows = []
    scale = 0.5
    dw, dh = int(WIDTH * scale), int(HEIGHT * scale)
    
    for i in range(len(imgs) - 1):
        img_a = cv2.resize(imgs[i], (dw, dh))
        img_b = cv2.resize(imgs[i+1], (dw, dh))
        gray_a = cv2.cvtColor(img_a, cv2.COLOR_RGB2GRAY)
        gray_b = cv2.cvtColor(img_b, cv2.COLOR_RGB2GRAY)
        
        flow_fwd = cv2.calcOpticalFlowFarneback(gray_a, gray_b, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        flow_bwd = cv2.calcOpticalFlowFarneback(gray_b, gray_a, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        
        flow_fwd_full = cv2.resize(flow_fwd, (WIDTH, HEIGHT)) * (1.0 / scale)
        flow_bwd_full = cv2.resize(flow_bwd, (WIDTH, HEIGHT)) * (1.0 / scale)
        flows.append((flow_fwd_full, flow_bwd_full))
    return flows

def warp_frame(img, flow, factor):
    h, w = img.shape[:2]
    grid_x, grid_y = np.meshgrid(np.arange(w), np.arange(h))
    map_x = (grid_x + flow[..., 0] * factor).astype(np.float32)
    map_y = (grid_y + flow[..., 1] * factor).astype(np.float32)
    return cv2.remap(img, map_x, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

def interpolate_frames(img_a, img_b, flow_pair, alpha):
    smooth_alpha = 0.5 * (1.0 - math.cos(math.pi * alpha))
    flow_fwd, flow_bwd = flow_pair
    warped_a = warp_frame(img_a, flow_fwd, smooth_alpha)
    warped_b = warp_frame(img_b, flow_bwd, 1.0 - smooth_alpha)
    blended = (1.0 - smooth_alpha) * warped_a.astype(np.float32) + smooth_alpha * warped_b.astype(np.float32)
    return np.clip(blended, 0, 255).astype(np.uint8)

def apply_handheld_drift(frame, t):
    dx = 8.0 * math.sin(1.9 * t) + 4.5 * math.cos(3.1 * t)
    dy = 6.0 * math.cos(1.6 * t) + 3.5 * math.sin(2.5 * t)
    angle = 0.4 * math.sin(1.1 * t)
    zoom = 1.03 + 0.02 * math.sin(0.85 * t)
    
    center = (WIDTH / 2, HEIGHT / 2)
    M = cv2.getRotationMatrix2D(center, angle, zoom)
    M[0, 2] += dx
    M[1, 2] += dy
    return cv2.warpAffine(frame, M, (WIDTH, HEIGHT), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

def generate_multi_voiceover(output_path):
    print("Generating 4 distinct female creator voices...")
    audio_clips = []
    seg_duration = DURATION / len(CREATORS) # 7.5s each
    
    for i, c in enumerate(CREATORS):
        seg_path = os.path.join(OUTPUT_DIR, f"creator_distinct_voice_{i}.mp3")
        tts = gTTS(text=c["voice_text"], lang='en', tld=c["tld"])
        tts.save(seg_path)
        clip = AudioFileClip(seg_path)
        
        if clip.duration > seg_duration:
            clip = clip.subclipped(0, seg_duration)
        else:
            silence_len = seg_duration - clip.duration
            silence = AudioFileClip(seg_path).subclipped(0, 0.01).with_volume_scaled(0).with_duration(silence_len)
            clip = concatenate_audioclips([clip, silence])
        audio_clips.append(clip)
        
    final_vo = concatenate_audioclips(audio_clips).with_duration(DURATION)
    final_vo.write_audiofile(output_path, fps=44100, logger=None)
    return output_path

def generate_trending_beat(output_path, duration_sec):
    print("Synthesizing trending 124 BPM lo-fi beat...")
    sr = 44100
    total_samples = int(sr * duration_sec)
    bpm = 124
    spb = 60.0 / bpm
    step_samples = int(sr * (spb / 4))
    
    audio = np.zeros(total_samples, dtype=np.float32)
    
    kick_len = int(0.18 * sr)
    kick_t = np.linspace(0, 0.18, kick_len, endpoint=False)
    kick = np.sin(2 * np.pi * (np.exp(-kick_t * 22) * 120 + 45) * kick_t) * np.exp(-kick_t * 16) * 0.42
    
    snare_len = int(0.14 * sr)
    snare = np.random.uniform(-1, 1, snare_len) * np.exp(-np.linspace(0, 0.14, snare_len) * 26) * 0.24
    
    hihat_len = int(0.04 * sr)
    hihat = np.random.uniform(-1, 1, hihat_len) * np.exp(-np.linspace(0, 0.04, hihat_len) * 60) * 0.12
    
    total_steps = int(duration_sec / (spb / 4))
    for step in range(total_steps):
        pos = step * step_samples
        if pos >= total_samples: break
        beat = (step // 4) % 4
        sub = step % 4
        if (beat == 0 and sub == 0) or (beat == 2 and sub == 2):
            end_p = min(pos + kick_len, total_samples)
            audio[pos:end_p] += kick[:end_p - pos]
        if (beat == 1 and sub == 0) or (beat == 3 and sub == 0):
            end_p = min(pos + snare_len, total_samples)
            audio[pos:end_p] += snare[:end_p - pos]
        if sub in (0, 2):
            end_p = min(pos + hihat_len, total_samples)
            audio[pos:end_p] += hihat[:end_p - pos]

    chords = [110.0, 87.31, 130.81, 98.0]
    bar_samples = int(sr * spb * 4)
    for i in range(int(duration_sec / (spb * 4)) + 1):
        freq = chords[i % len(chords)]
        b_pos = i * bar_samples
        b_len = min(bar_samples, total_samples - b_pos)
        if b_len <= 0: break
        b_t = np.linspace(0, b_len / sr, b_len, endpoint=False)
        audio[b_pos:b_pos + b_len] += np.sin(2 * np.pi * freq * b_t) * 0.15

    max_v = np.max(np.abs(audio))
    if max_v > 0.01:
        audio = audio / max_v * 0.28
        
    wavfile.write(output_path, sr, (audio * 32767).astype(np.int16))
    return output_path

def get_fonts():
    try:
        font_caption = ImageFont.truetype("arialbd.ttf", 46)
        font_badge = ImageFont.truetype("arialbd.ttf", 32)
        font_name = ImageFont.truetype("arialbd.ttf", 30)
    except Exception:
        font_caption = ImageFont.load_default()
        font_badge = ImageFont.load_default()
        font_name = ImageFont.load_default()
    return font_caption, font_badge, font_name

def render_frame(t, imgs, flows, fonts, bundle_img):
    font_caption, font_badge, font_name = fonts
    
    seg_duration = DURATION / len(CREATORS) # 7.5s each
    idx = int(t // seg_duration)
    if idx >= len(CREATORS): idx = len(CREATORS) - 1
    
    seg_t = t - (idx * seg_duration)
    trans_len = 0.8 # 0.8s optical flow in-between morphing transition
    
    if seg_t < (seg_duration - trans_len) or idx == len(CREATORS) - 1:
        base = imgs[idx]
    else:
        alpha = (seg_t - (seg_duration - trans_len)) / trans_len
        base = interpolate_frames(imgs[idx], imgs[idx+1], flows[idx], alpha)
        
    drifted = apply_handheld_drift(base, t)
    
    pil_frame = Image.fromarray(drifted).convert("RGBA")
    draw = ImageDraw.Draw(pil_frame)
    
    # 1. Top Retention Progress Bar
    prog_w = int(WIDTH * (t / DURATION))
    draw.rectangle([0, 0, WIDTH, 8], fill=(30, 30, 40, 200))
    draw.rectangle([0, 0, prog_w, 8], fill=(236, 72, 153, 255))
    
    # 2. Creator Handle Tag & Verified Badge
    creator = CREATORS[idx]
    handle_box = [50, 45, 430, 105]
    draw.rounded_rectangle(handle_box, radius=18, fill=(0, 0, 0, 190), outline=(255, 255, 255, 60), width=1)
    draw.text((70, 58), f"{creator['name']} ✓", font=font_name, fill=(255, 255, 255, 255))
    
    # 3. Product Hook Tag Top-Right
    draw.rounded_rectangle([WIDTH - 440, 45, WIDTH - 50, 105], radius=18, fill=(124, 58, 237, 230), outline=(216, 180, 254, 255), width=2)
    draw.text((WIDTH - 420, 58), creator["tag"], font=font_badge, fill=(255, 255, 255, 255))
    
    # 4. Floating TikTok Hearts Animation
    heart_y = int(HEIGHT * 0.72 - ((t * 110) % 280))
    heart_alpha = int(240 * (1.0 - ((t * 110) % 280) / 280))
    draw.text((WIDTH - 110, heart_y), "❤️", font=font_caption, fill=(239, 68, 68, heart_alpha))
    
    # 5. Scene 4 Overlay: Floating PHOFAY 4-bottle bundle card
    if idx == 3 and bundle_img is not None:
        bw, bh = 340, 340
        b_x, b_y = WIDTH - bw - 50, 140
        card_mask = Image.new("L", (bw, bh), 0)
        ImageDraw.Draw(card_mask).rounded_rectangle([0, 0, bw, bh], radius=24, fill=255)
        b_resized = bundle_img.resize((bw, bh), Image.Resampling.LANCZOS)
        pil_frame.paste(b_resized, (b_x, b_y), card_mask)
        draw.rounded_rectangle([b_x, b_y, b_x + bw, b_y + bh], radius=24, outline=(236, 72, 153, 230), width=3)
        draw.text((b_x + 20, b_y + bh - 45), "4-PIECE SET", font=font_badge, fill=(255, 255, 255, 255))
    
    # 6. Dynamic Word-by-Word Subtitles
    words = creator["caption"].split(" ")
    lines = []
    cur = []
    for w in words:
        cur.append(w)
        bbox = draw.textbbox((0, 0), " ".join(cur), font=font_caption)
        if bbox[2] - bbox[0] > WIDTH - 160:
            cur.pop()
            lines.append(" ".join(cur))
            cur = [w]
    if cur: lines.append(" ".join(cur))
    
    start_y = 1270
    total_h = len(lines) * 65
    draw.rounded_rectangle([50, start_y - 20, WIDTH - 50, start_y + total_h + 10], radius=24, fill=(0, 0, 0, 205), outline=(236, 72, 153, 220), width=2)
    
    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font_caption)
        lw = bbox[2] - bbox[0]
        lx = (WIDTH - lw) // 2
        ly = start_y + i * 65
        for ox in [-3, 0, 3]:
            for oy in [-3, 0, 3]:
                draw.text((lx + ox, ly + oy), line, font=font_caption, fill=(0, 0, 0, 255))
        fill_c = (255, 235, 59, 255) if creator["highlight"] in line else (255, 255, 255, 255)
        draw.text((lx, ly), line, font=font_caption, fill=fill_c)
        
    # 7. Persistent Bottom CTA on last scene
    if t > 18.0:
        pulse = int(4 * math.sin(t * 8))
        cta_box = [50 - pulse, HEIGHT - 180 - pulse, WIDTH - 50 + pulse, HEIGHT - 60 + pulse]
        draw.rounded_rectangle(cta_box, radius=28, fill=(124, 58, 237, 245), outline=(216, 180, 254, 255), width=3)
        cta_str = "👉 TAP LINK IN BIO FOR 4-SHADE SET ($18) 👈"
        c_bbox = draw.textbbox((0, 0), cta_str, font=font_badge)
        cw = c_bbox[2] - c_bbox[0]
        draw.text(((WIDTH - cw) // 2, HEIGHT - 135), cta_str, font=font_badge, fill=(255, 255, 255, 255))
        
    return np.array(pil_frame.convert("RGB"))

def main():
    imgs = load_and_prep_images()
    flows = compute_optical_flow_pairs(imgs)
    fonts = get_fonts()
    
    bundle_img = None
    if os.path.exists(BUNDLE_IMG_PATH):
        bundle_img = Image.open(BUNDLE_IMG_PATH).convert("RGBA")
    
    vo_path = os.path.join(OUTPUT_DIR, "multi_ugc_distinct_voiceover.mp3")
    generate_multi_voiceover(vo_path)
    vo_clip = AudioFileClip(vo_path)
    
    beat_path = os.path.join(OUTPUT_DIR, "multi_ugc_distinct_beat.wav")
    generate_trending_beat(beat_path, DURATION)
    beat_clip = AudioFileClip(beat_path)
    
    final_audio = CompositeAudioClip([
        beat_clip.with_volume_scaled(0.25),
        vo_clip.with_volume_scaled(1.0)
    ]).with_duration(DURATION)
    
    print(f"Compositing 30.0s multi-creator UGC video with 4 DISTINCT girls at {FPS} FPS...")
    video_clip = VideoClip(frame_function=lambda t: render_frame(t, imgs, flows, fonts, bundle_img), duration=DURATION)
    video_clip = video_clip.with_audio(final_audio)
    
    output_mp4 = os.path.join(OUTPUT_DIR, "vexsen_multi_girl_ugc.mp4")
    print(f"Rendering to {output_mp4}...")
    video_clip.write_videofile(
        output_mp4,
        fps=FPS,
        codec="libx264",
        audio_codec="aac",
        preset="fast",
        threads=4
    )
    
    downloads_path = r"C:\Users\brann\Downloads\vexsen_multi_girl_ugc.mp4"
    try:
        import shutil
        shutil.copyfile(output_mp4, downloads_path)
        print(f"SUCCESS: Copied video to {downloads_path}")
    except Exception as e:
        print(f"Copy failed, trying hardlink: {e}")
        try:
            if os.path.exists(downloads_path): os.remove(downloads_path)
            os.link(output_mp4, downloads_path)
            print(f"SUCCESS: Hardlinked video to {downloads_path}")
        except Exception as e2:
            print(f"Hardlink failed: {e2}")

if __name__ == "__main__":
    main()
