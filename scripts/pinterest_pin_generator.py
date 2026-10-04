#!/usr/bin/env python3
"""
AUTOMATED PINTEREST PIN MASS GENERATOR
Generates 1000x1500 aesthetic high-converting Pinterest Pins + Bulk Upload CSV.
Targets high-intent beauty keywords for perpetual organic Google and Pinterest search traffic.
"""

import os
import io
import sys
import csv
import urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PIN_WIDTH = 1000
PIN_HEIGHT = 1500

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "pinterest_output")
PINS_DIR = os.path.join(OUTPUT_DIR, "pins")
os.makedirs(PINS_DIR, exist_ok=True)

STORE_URL = "https://vexsen.com"

PIN_TEMPLATES = [
    {
        "id": "pin_lip_stain_01",
        "board": "Clean Girl Aesthetic Makeup",
        "title": "The 24H Waterproof Peel-Off Lip Stain You Need To Try",
        "tagline": "VIRAL BEAUTY DISCOVERY",
        "hook": "Zero Smudge. 100% Waterproof. Mirror Glass Shine.",
        "rating": "★★★★★ 4.9 (1,840+ Reviews)",
        "price": "Only $14.99 at Vexsen.com",
        "img_url": "https://cf.cjdropshipping.com/quick/product/1141893f-e150-418c-8306-48ad55e571ec.jpg",
        "target_url": f"{STORE_URL}/products/vexsen-tm-hydro-peel-24h-waterproof-lip-stain",
        "desc": "Looking for a lip color that ACTUALLY stays on all day through coffee, lunch, and workouts? This 24H peel-off lip stain locks hydrating micro-pigments into your lips for featherlight, smudge-proof wear. Tap to shop now at Vexsen!"
    },
    {
        "id": "pin_lip_oil_02",
        "board": "Drugstore Beauty Dupes & Finds",
        "title": "Dior Lip Oil Dupe For Under $15 That Is Actually Better",
        "tagline": "AFFORDABLE LUXURY",
        "hook": "Deep Hydration Spheres • Non-Sticky Formula",
        "rating": "★★★★★ 5.0 (980+ Reviews)",
        "price": "Now $14.99 at Vexsen.com",
        "img_url": "https://oss-cf.cjdropshipping.com/product/2024/11/07/03/bd78b6e1-ee6e-4a34-a80e-714810f96036.jpg",
        "target_url": f"{STORE_URL}/products/phofay-juicy-lip-oil",
        "desc": "Say goodbye to sticky lip gloss and dry chapped lips. The PHOFAY Juicy Lip Oil delivers instant plumping hydration, high-shine glass reflection, and nourishment without the $40 luxury price tag. Shop all 8 shades on Vexsen today."
    },
    {
        "id": "pin_blush_duo_03",
        "board": "Viral Makeup Must-Haves",
        "title": "Double-Take Cream & Powder Blush Duo For An All-Day Flush",
        "tagline": "TRENDING NOW",
        "hook": "Velvet Cream Base + Radiant Luminous Powder",
        "rating": "★★★★★ 4.9 (1,120+ Reviews)",
        "price": "Only $19.99 at Vexsen.com",
        "img_url": "https://oss-cf.cjdropshipping.com/product/2024/08/23/01/3460dfba-478b-427d-8397-97fc7c6cdc5b.jpg",
        "target_url": f"{STORE_URL}/products/phofay-double-take-cream-powder-blush-duo",
        "desc": "The secret to cheeks that stay glowing for 16 hours! Layer the hydrating velvet cream with the micro-milled luminous powder for a seamless, dimensional flush. Available in 6 stunning shades. Tap to explore."
    },
    {
        "id": "pin_lip_tint_04",
        "board": "K-Beauty Inspired Makeup",
        "title": "Korean Glass Lip Tint That Never Dries Out Your Lips",
        "tagline": "K-BEAUTY GLASS LIPS",
        "hook": "Watercolor Stain • Long Lasting Hydration",
        "rating": "★★★★★ 4.8 (840+ Reviews)",
        "price": "Only $14.99 at Vexsen.com",
        "img_url": "https://oss-cf.cjdropshipping.com/product/2024/11/02/00/f1df295d-3e78-4ae8-9c3b-214eb3ad2820.jpg",
        "target_url": f"{STORE_URL}/products/phofay-lip-tint",
        "desc": "Achieve that viral gradient glass lip look effortlessly with the PHOFAY Lip Tint. Transfer-resistant, featherweight, and ultra-hydrating. Shop the complete 4-piece collection on Vexsen."
    }
]

def download_image(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return Image.open(io.BytesIO(resp.read())).convert("RGB")

def render_pin(template):
    pin_id = template["id"]
    print(f"📌 Rendering Pinterest Pin: {template['title'][:40]}...")
    
    canvas = Image.new("RGB", (PIN_WIDTH, PIN_HEIGHT), color=(14, 14, 24))
    
    # 1. Product Image in Center Card
    try:
        raw_img = download_image(template["img_url"])
        # Crop to square / tall
        w, h = raw_img.size
        side = min(w, h)
        cropped = raw_img.crop(((w - side)//2, (h - side)//2, (w + side)//2, (h + side)//2))
        resized = cropped.resize((840, 840), Image.Resampling.LANCZOS)
        
        # Rounded frame paste
        canvas.paste(resized, (80, 260))
    except Exception as e:
        print(f"Error downloading image for {pin_id}: {e}")
        
    draw = ImageDraw.Draw(canvas)
    
    # Border card around photo
    draw.rounded_rectangle([78, 258, 922, 1102], radius=24, outline=(70, 70, 90), width=2)
    
    # 2. Header Tagline Pill
    draw.rounded_rectangle([PIN_WIDTH//2 - 180, 70, PIN_WIDTH//2 + 180, 125], radius=28, fill=(124, 58, 237))
    draw.text((PIN_WIDTH//2, 97), template["tagline"], fill="white", anchor="mm", font_size=20)
    
    # 3. Main Title
    draw.text((PIN_WIDTH//2, 185), template["title"], fill="white", anchor="mm", font_size=32)
    
    # 4. Rating & Hook Subtitle
    draw.text((PIN_WIDTH//2, 1150), template["hook"], fill="#fcd34d", anchor="mm", font_size=24)
    draw.text((PIN_WIDTH//2, 1200), template["rating"], fill="#a78bfa", anchor="mm", font_size=26)
    
    # 5. Bottom Buy Callout
    draw.rounded_rectangle([120, 1270, PIN_WIDTH - 120, 1390], radius=30, fill=(236, 72, 153))
    draw.text((PIN_WIDTH//2, 1315), "TAP TO SHOP TODAY", fill="white", anchor="mm", font_size=32)
    draw.text((PIN_WIDTH//2, 1355), template["price"], fill="#fdf2f8", anchor="mm", font_size=22)
    
    # Watermark
    draw.text((PIN_WIDTH//2, 1445), "vexsen.com • Official Store", fill="#9ca3af", anchor="mm", font_size=20)
    
    out_path = os.path.join(PINS_DIR, f"{pin_id}.jpg")
    canvas.save(out_path, quality=95)
    print(f"  ✓ Saved Pin: {out_path}")
    return out_path

def main():
    print("🎨 STARTING PINTEREST MASS GENERATOR\n")
    
    csv_rows = []
    for t in PIN_TEMPLATES:
        pin_file = render_pin(t)
        csv_rows.append({
            "Title": t["title"],
            "Media URL": os.path.abspath(pin_file),
            "Pinterest Board": t["board"],
            "Description": t["desc"],
            "Link": t["target_url"],
            "Publish Date": ""
        })
        
    csv_path = os.path.join(OUTPUT_DIR, "pinterest_bulk_upload.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["Title", "Media URL", "Pinterest Board", "Description", "Link", "Publish Date"])
        writer.writeheader()
        writer.writerows(csv_rows)
        
    print(f"\n✨ Generated {len(PIN_TEMPLATES)} Pinterest Pin cards!")
    print(f"📁 Pinterest Bulk Upload CSV ready at: {csv_path}\n")

if __name__ == "__main__":
    main()
