import os
import io
import math
import numpy as np
import cv2
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

IMAGE_PATHS = [
    r"C:\Users\brann\.gemini\antigravity-ide\brain\3379c853-a86f-4925-b0e3-3f5b6636155f\ugc_girl_holding_product_1790993833290.jpg",
    r"C:\Users\brann\.gemini\antigravity-ide\brain\3379c853-a86f-4925-b0e3-3f5b6636155f\ugc_girl_applying_tint_1790993902949.jpg",
    r"C:\Users\brann\.gemini\antigravity-ide\brain\3379c853-a86f-4925-b0e3-3f5b6636155f\ugc_girl_peeling_tint_1790994035997.jpg",
    r"C:\Users\brann\.gemini\antigravity-ide\brain\3379c853-a86f-4925-b0e3-3f5b6636155f\ugc_girl_showing_results_1790994543157.jpg"
]

VOICEOVER_TEXT = (
    "Stop scrolling! You guys kept asking how my lips stay glassy and tinted all day without any stickiness. "
    "This is the viral PHOFAY peel-off lip tint from Vexsen. "
    "You literally apply the wand gel, let it set, and peel the film right off. "
    "Look at this color! And check this out—zero transfer on my finger, no smudging, completely waterproof through coffee and dinner. "
    "It is only 18 dollars right now on vexsen.com. Tap the link in bio to get yours before this batch sells out!"
)

# Captions timeline: (start_sec, end_sec, text, highlight_word)
CAPTIONS = [
    (0.0, 3.2, "Stop scrolling! 🛑", "Stop"),
    (3.2, 6.8, "How my lips stay glassy ALL DAY without stickiness ✨", "ALL DAY"),
    (6.8, 10.5, "The viral PHOFAY 24H peel-off lip tint from Vexsen 💄", "PHOFAY"),
    (10.5, 14.5, "Apply the wand gel & let it set for 2 mins ⏳", "Apply"),
    (14.5, 18.0, "Peel the film right off... LOOK AT THIS COLOR! 😍", "LOOK"),
    (18.0, 21.5, "Zero transfer on my finger! Completely waterproof ☕️", "Zero transfer"),
    (21.5, 25.5, "Lasts all day through drinks & dinner 🍷", "Lasts all day"),
    (25.5, 30.0, "Only $18.00 right now on VEXSEN.COM! 👉 Tap link in bio 🛒", "$18.00")
]

def load_and_prep_images():
    imgs = []
    for path in IMAGE_PATHS:
        img = Image.open(path).convert("RGB")
        img = img.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
        imgs.append(np.array(img))
    return imgs

def compute_optical_flow_pairs(imgs):
    print("Pre-computing bidirectional optical flow between keyframes...")
    flows = []
    # Work on downsampled resolution for fast, robust flow estimation
    scale = 0.5
    dw, dh = int(WIDTH * scale), int(HEIGHT * scale)
    
    for i in range(len(imgs) - 1):
        img_a = cv2.resize(imgs[i], (dw, dh))
        img_b = cv2.resize(imgs[i+1], (dw, dh))
        gray_a = cv2.cvtColor(img_a, cv2.COLOR_RGB2GRAY)
        gray_b = cv2.cvtColor(img_b, cv2.COLOR_RGB2GRAY)
        
        # Farneback dense optical flow
        flow_fwd = cv2.calcOpticalFlowFarneback(gray_a, gray_b, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        flow_bwd = cv2.calcOpticalFlowFarneback(gray_b, gray_a, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        
        # Resize flow fields back to full resolution
        flow_fwd_full = cv2.resize(flow_fwd, (WIDTH, HEIGHT)) * (1.0 / scale)
        flow_bwd_full = cv2.resize(flow_bwd, (WIDTH, HEIGHT)) * (1.0 / scale)
        
        flows.append((flow_fwd_full, flow_bwd_full))
        print(f"Computed optical flow pair {i+1}/{len(imgs)-1}")
    return flows

def warp_frame(img, flow, factor):
    h, w = img.shape[:2]
    grid_x, grid_y = np.meshgrid(np.arange(w), np.arange(h))
    map_x = (grid_x + flow[..., 0] * factor).astype(np.float32)
    map_y = (grid_y + flow[..., 1] * factor).astype(np.float32)
    return cv2.remap(img, map_x, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

def interpolate_frames(img_a, img_b, flow_pair, alpha):
    # Smooth S-curve transition
    smooth_alpha = 0.5 * (1.0 - math.cos(math.pi * alpha))
    flow_fwd, flow_bwd = flow_pair
    
    warped_a = warp_frame(img_a, flow_fwd, smooth_alpha)
    warped_b = warp_frame(img_b, flow_bwd, 1.0 - smooth_alpha)
    
    blended = (1.0 - smooth_alpha) * warped_a.astype(np.float32) + smooth_alpha * warped_b.astype(np.float32)
    return np.clip(blended, 0, 255).astype(np.uint8)

def apply_handheld_drift(frame, t):
    # Authentic handheld camera physics
    dx = 7.0 * math.sin(1.8 * t) + 4.0 * math.cos(3.3 * t)
    dy = 5.5 * math.cos(1.5 * t) + 3.0 * math.sin(2.7 * t)
    angle = 0.35 * math.sin(1.2 * t)
    zoom = 1.025 + 0.015 * math.sin(0.8 * t)
    
    center = (WIDTH / 2, HEIGHT / 2)
    M = cv2.getRotationMatrix2D(center, angle, zoom)
    M[0, 2] += dx
    M[1, 2] += dy
    
    stabilized = cv2.warpAffine(frame, M, (WIDTH, HEIGHT), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    return stabilized

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
    step_samples = int(sr * (spb / 4))
    
    audio = np.zeros(total_samples, dtype=np.float32)
    
    kick_len = int(0.18 * sr)
    kick_t = np.linspace(0, 0.18, kick_len, endpoint=False)
    kick_f = np.exp(-kick_t * 22) * 120 + 45
    kick = np.sin(2 * np.pi * kick_f * kick_t) * np.exp(-kick_t * 16) * 0.4
    
    snare_len = int(0.14 * sr)
    snare_t = np.linspace(0, 0.14, snare_len, endpoint=False)
    snare = np.random.uniform(-1, 1, snare_len) * np.exp(-snare_t * 26) * 0.22
    
    hihat_len = int(0.04 * sr)
    hihat = np.random.uniform(-1, 1, hihat_len) * np.exp(-np.linspace(0, 0.04, hihat_len) * 60) * 0.1
    
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
            
        if sub_step in (0, 2):
            end_pos = min(pos + hihat_len, total_samples)
            audio[pos:end_pos] += hihat[:end_pos - pos]

    # Warm chord progression
    chords = [73.42, 87.31, 65.41, 98.0]
    bar_samples = int(sr * spb * 4)
    for i in range(int(duration_sec / (spb * 4)) + 1):
        freq = chords[i % len(chords)]
        b_pos = i * bar_samples
        b_len = min(bar_samples, total_samples - b_pos)
        if b_len <= 0:
            break
        b_t = np.linspace(0, b_len / sr, b_len, endpoint=False)
        bass = np.sin(2 * np.pi * freq * b_t) * 0.16
        audio[b_pos:b_pos + b_len] += bass

    max_val = np.max(np.abs(audio))
    if max_val > 0.01:
        audio = audio / max_val * 0.3
        
    wavfile.write(output_path, sr, (audio * 32767).astype(np.int16))
    return output_path

def get_fonts():
    try:
        font_caption = ImageFont.truetype("arialbd.ttf", 48)
        font_badge = ImageFont.truetype("arialbd.ttf", 34)
    except Exception:
        font_caption = ImageFont.load_default()
        font_badge = ImageFont.load_default()
    return font_caption, font_badge

def draw_dynamic_captions(draw, t, fonts):
    font_caption, font_badge = fonts
    
    current_cap = None
    for start_t, end_t, text, highlight in CAPTIONS:
        if start_t <= t <= end_t:
            current_cap = (text, highlight)
            break
            
    if current_cap:
        text, highlight = current_cap
        
        # Word wrapping helper
        words = text.split(" ")
        lines = []
        cur_line = []
        for w in words:
            cur_line.append(w)
            bbox = draw.textbbox((0, 0), " ".join(cur_line), font=font_caption)
            if bbox[2] - bbox[0] > WIDTH - 160:
                cur_line.pop()
                lines.append(" ".join(cur_line))
                cur_line = [w]
        if cur_line:
            lines.append(" ".join(cur_line))
            
        total_h = len(lines) * 65
        start_y = 1260
        
        # Draw glowing pill container behind captions
        bg_box = [60, start_y - 20, WIDTH - 60, start_y + total_h + 10]
        draw.rounded_rectangle(bg_box, radius=24, fill=(0, 0, 0, 190), outline=(236, 72, 153, 200), width=2)
        
        for i, line in enumerate(lines):
            line_bbox = draw.textbbox((0, 0), line, font=font_caption)
            lw = line_bbox[2] - line_bbox[0]
            lx = (WIDTH - lw) // 2
            ly = start_y + i * 65
            
            # Thick black outline for viral TikTok look
            for ox in [-3, 0, 3]:
                for oy in [-3, 0, 3]:
                    draw.text((lx + ox, ly + oy), line, font=font_caption, fill=(0, 0, 0, 255))
            
            fill_color = (255, 235, 59, 255) if highlight in line else (255, 255, 255, 255)
            draw.text((lx, ly), line, font=font_caption, fill=fill_color)

def render_ugc_frame(t, duration, imgs, flows, fonts):
    # Total 4 scenes connected by 3 morphing transitions:
    # 0 to 6.5s: Scene 0 (holds product)
    # 6.5 to 8.5s: Morph 0 -> 1 (moving wand to lips)
    # 8.5 to 13.5s: Scene 1 (applying wand)
    # 13.5 to 15.5s: Morph 1 -> 2 (peeling tint)
    # 15.5 to 20.5s: Scene 2 (peeling)
    # 20.5 to 22.5s: Morph 2 -> 3 (showing clean lips & finger)
    # 22.5 to end: Scene 3 (final radiant smile & CTA)
    
    if t < 6.5:
        base = imgs[0]
    elif t < 8.5:
        alpha = (t - 6.5) / 2.0
        base = interpolate_frames(imgs[0], imgs[1], flows[0], alpha)
    elif t < 13.5:
        base = imgs[1]
    elif t < 15.5:
        alpha = (t - 13.5) / 2.0
        base = interpolate_frames(imgs[1], imgs[2], flows[1], alpha)
    elif t < 20.5:
        base = imgs[2]
    elif t < 22.5:
        alpha = (t - 20.5) / 2.0
        base = interpolate_frames(imgs[2], imgs[3], flows[2], alpha)
    else:
        base = imgs[3]
        
    # Apply camera drift & organic breathing
    drifted = apply_handheld_drift(base, t)
    
    # Composite overlays
    pil_frame = Image.fromarray(drifted).convert("RGBA")
    draw = ImageDraw.Draw(pil_frame)
    
    # Top progress bar
    prog_w = int(WIDTH * (t / duration))
    draw.rectangle([0, 0, WIDTH, 8], fill=(30, 30, 40, 200))
    draw.rectangle([0, 0, prog_w, 8], fill=(236, 72, 153, 255))
    
    # Top creator brand badge
    font_caption, font_badge = fonts
    brand_box = [60, 50, 440, 115]
    draw.rounded_rectangle(brand_box, radius=20, fill=(0, 0, 0, 180), outline=(255, 255, 255, 50), width=1)
    draw.text((80, 65), "✨ VEXSEN BEAUTY", font=font_badge, fill=(255, 255, 255, 240))
    
    # Right-side floating viral hearts animation
    heart_y = int(HEIGHT * 0.7 - ((t * 90) % 260))
    heart_alpha = int(220 * (1.0 - ((t * 90) % 260) / 260))
    draw.text((WIDTH - 120, heart_y), "❤️", font=font_caption, fill=(239, 68, 68, heart_alpha))
    
    # Draw Subtitles
    draw_dynamic_captions(draw, t, fonts)
    
    # Persistent bottom buy-now reminder on last scene
    if t > 21.0:
        cta_box = [60, HEIGHT - 180, WIDTH - 60, HEIGHT - 60]
        pulse = int(4 * math.sin(t * 8))
        draw.rounded_rectangle([cta_box[0]-pulse, cta_box[1]-pulse, cta_box[2]+pulse, cta_box[3]+pulse], radius=26, fill=(124, 58, 237, 245), outline=(216, 180, 254, 255), width=3)
        cta_text = "👉 TAP LINK IN BIO TO SHOP ($18) 👈"
        bbox = draw.textbbox((0, 0), cta_text, font=font_badge)
        cw = bbox[2] - bbox[0]
        draw.text(((WIDTH - cw) // 2, HEIGHT - 135), cta_text, font=font_badge, fill=(255, 255, 255, 255))
        
    return np.array(pil_frame.convert("RGB"))

def main():
    imgs = load_and_prep_images()
    flows = compute_optical_flow_pairs(imgs)
    fonts = get_fonts()
    
    vo_path = os.path.join(OUTPUT_DIR, "ugc_voiceover.mp3")
    generate_voiceover(vo_path)
    vo_clip = AudioFileClip(vo_path)
    duration = vo_clip.duration + 0.8
    print(f"Total UGC video duration: {duration:.2f} seconds")
    
    beat_path = os.path.join(OUTPUT_DIR, "ugc_backing_beat.wav")
    generate_backing_beat(beat_path, duration)
    beat_clip = AudioFileClip(beat_path)
    
    beat_ducked = beat_clip.with_volume_scaled(0.25)
    vo_ducked = vo_clip.with_volume_scaled(1.0)
    final_audio = CompositeAudioClip([beat_ducked, vo_ducked]).with_duration(duration)
    
    print("Rendering fully interpolated UGC video...")
    video_clip = VideoClip(frame_function=lambda t: render_ugc_frame(t, duration, imgs, flows, fonts), duration=duration)
    video_clip = video_clip.with_audio(final_audio)
    
    output_mp4 = os.path.join(OUTPUT_DIR, "vexsen_ugc_viral_ad.mp4")
    print(f"Exporting to {output_mp4}...")
    video_clip.write_videofile(
        output_mp4,
        fps=FPS,
        codec="libx264",
        audio_codec="aac",
        preset="fast",
        threads=4
    )
    
    downloads_path = r"C:\Users\brann\Downloads\vexsen_ugc_viral_ad.mp4"
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
