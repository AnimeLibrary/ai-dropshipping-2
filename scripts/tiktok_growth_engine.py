#!/usr/bin/env python3
"""
VEXSEN TIKTOK AGGRESSIVE GROWTH ENGINE
Trend Scanner | Caption Rotator | Comment Engine
Self-Comment Scripts | 7-Day Posting Calendar
"""

import sys
import json
import random
import datetime
import os
import shutil
import urllib.request
import urllib.parse
from pathlib import Path

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

OUT_DIR  = Path(__file__).parent / "tiktok_growth_output"
OUT_DIR.mkdir(exist_ok=True)

BRAND     = "@vexsen"
PRODUCT   = "PHOFAY Lip Stain"
STORE_URL = "vexsen.com/products/phofay-lip-tint-h93b"

# ═══════════════════════════════════════════════════════════════════════════
# MODULE 1  TREND SCANNER
# ═══════════════════════════════════════════════════════════════════════════

SEED_HASHTAGS = [
    "lipstain","liptint","peelofflipstain","lipstainreview",
    "makeuptok","beautytok","drugstorebeauty","lipproducts",
    "transferprooflipstick","24hourlipstain","ugcbeauty",
    "beautyhacks","lipcombo","tiktokbeauty","viralmakeup",
    "grwm","getreadywithme","makeuptransformation",
    "glossylips","poutperfection","glassylips","beautyfinds",
]

HIGH_VOL = {"makeuptok","beautytok","grwm","getreadywithme","makeuptransformation","tiktokbeauty","ugcbeauty","viralmakeup"}
MED_VOL  = {"lipstain","liptint","peelofflipstain","lipstainreview","beautyhacks","lipcombo","glossylips","glassylips","beautyfinds"}

def fetch_trending_hashtags():
    print("\n TREND SCANNER")
    print("-"*50)
    scraped = []
    for seed in SEED_HASHTAGS[:4]:
        try:
            url = ("https://www.tiktok.com/api/suggest/hashtag/?keyword="
                   + urllib.parse.quote(seed) + "&count=10&msToken=")
            req = urllib.request.Request(url, headers={
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
                "Referer":    "https://www.tiktok.com/",
                "Accept":     "application/json",
            })
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = json.loads(resp.read().decode())
                for h in data.get("hashtag_list", []):
                    name = h.get("hashtag_name","")
                    if name: scraped.append(name)
        except Exception:
            pass

    all_tags = list(dict.fromkeys(scraped + SEED_HASHTAGS))
    result = []
    for tag in all_tags:
        tier = ("FIRE HIGH 1B+" if tag in HIGH_VOL
                else ("UP MED 50M+" if tag in MED_VOL else "TARGET NICHE"))
        result.append({"tag": f"#{tag}", "tier": tier})

    print(f"  {len(result)} hashtags across 3 volume tiers\n")
    for r in result[:20]:
        print(f"    {r['tier']:18s}  {r['tag']}")
    return result


# ═══════════════════════════════════════════════════════════════════════════
# MODULE 2  CAPTION ROTATOR  20 ready-to-post captions
# Formula types: pattern_interrupt, pov, controversy, transformation, hack,
#                social_proof, urgency
# ═══════════════════════════════════════════════════════════════════════════

CAPTIONS = [
    ("STOP scrolling I need you to see this before you buy ANOTHER lipstick that transfers everywhere",
     "Drop a hand if your lip color disappears by lunch","pattern_interrupt"),
    ("This lip stain changed my whole morning routine and im actually kinda mad it took me this long",
     "Comment HOW and ill DM you the link","pattern_interrupt"),
    ("I wore this for 14 hours straight. Ate. Drank coffee. Kissed my bf. Still on. HOW.",
     "Save this if youre tired of reapplying all day","pattern_interrupt"),
    ("POV: you find a lip stain that doesnt budge, doesnt dry your lips, and doesnt stain your cups",
     "Tell me your shade in the comments","pov"),
    ("POV: running late and your makeup still looks fresh 3 hours later bc of this lip stain",
     "React if you need this in your life","pov"),
    ("POV: your lips look this good and you spent under $20 on it",
     "Share to a friend who needs to stop wasting money on expensive lip stuff","pov"),
    ("Unpopular opinion: most long lasting lipsticks are LYING to you. This one actually delivers",
     "Fight me in the comments if you disagree","controversy"),
    ("I said what I said - glossy lips that last ALL DAY are not a myth. This is proof",
     "Comment LINK and ill send it directly","controversy"),
    ("They dont want you to know about this lip stain because it makes every other formula look bad",
     "Duet this with your reaction","controversy"),
    ("Before vs After this lip stain and honestly the difference is insane. No filter btw",
     "Save this for your next makeup haul","transformation"),
    ("My lips at 7am vs my lips at 10pm. SAME PRODUCT. Zero touch ups",
     "Stitch this with your longest-lasting lip product","transformation"),
    ("Dry cracked lips BEFORE. Glass-shiny hydrated lips AFTER. This is not a drill",
     "Comment BEFORE if you relate to the struggle","transformation"),
    ("This lip stain hack is too good to keep to myself: apply BEFORE coffee, thank me later",
     "Follow for more hacks that actually work @vexsen","hack"),
    ("The lip stain you peel off?? YES. And somehow it stays on LONGER than regular formula???",
     "Save this before I delete it","hack"),
    ("Nobody talks about peel-off lip stain and I genuinely dont understand why. Its BETTER",
     "React if you want a full demo","hack"),
    ("This lip stain has 4.9 stars for a reason and I finally tried it so I can confirm: worth it",
     "Drop a star if you want the link","social_proof"),
    ("Everyone in the comments keeps asking what lip color this is - it DOES NOT COME OFF",
     "Link in bio or comment LIPS","social_proof"),
    ("I just checked and only a few left in stock - if youve been on the fence now is the time",
     "Drop WANT and ill send the link directly","urgency"),
    ("Running out of this lip stain and genuinely spiraling about it. Its on vexsen.com rn",
     "Someone tell me itll always be restocked","urgency"),
    ("This is your sign to try the lip stain everyone is talking about. Youll get it in the first wear",
     "Follow @vexsen for weekly drops","urgency"),
]

HASHTAG_COMBOS = {
    "pattern_interrupt": "#lipstain #makeuptok #tiktokbeauty #peelofflipstain #beautyhacks #viralmakeup #grwm #liptint",
    "pov":               "#pov #lipstain #getreadywithme #makeuptransformation #tiktokbeauty #liptint #beautytok #ugcbeauty",
    "controversy":       "#makeuptok #lipstain #transferprooflipstick #beautytok #lipproducts #24hourlipstain #viralmakeup",
    "transformation":    "#makeuptransformation #lipstain #grwm #beautytok #tiktokbeauty #liptint #beautyfinds",
    "hack":              "#makeuphack #beautyhacks #lipstain #peelofflipstain #tiktokbeauty #beautyfinds #ugcbeauty",
    "social_proof":      "#lipstain #makeuptok #beautytok #liptint #viralproduct #tiktokfinds #lipcombo #glossylips",
    "urgency":           "#lipstain #makeuptok #tiktokbeauty #beautyfinds #vexsen #liptint #glassylips",
}

def generate_captions():
    print("\n CAPTION ROTATOR  (20 Ready-to-Post)")
    print("-"*50)
    out = []
    for i,(hook,cta,formula) in enumerate(CAPTIONS,1):
        tags = HASHTAG_COMBOS.get(formula, HASHTAG_COMBOS["pattern_interrupt"])
        out.append({"id":i,"formula":formula,"hook":hook,"cta":cta,
                    "hashtags":tags,"full":f"{hook}\n\n{cta}\n\n{tags}"})
        print(f"\n  [{i:02d}] {formula.upper()}")
        print(f"  HOOK: {hook[:78]}{'...' if len(hook)>78 else ''}")
        print(f"  CTA:  {cta}")
    return out


# ═══════════════════════════════════════════════════════════════════════════
# MODULE 3  NICHE COMMENT ENGINE  (comment on trending beauty videos)
# Strategy: seed relatability + question-bait on #makeuptok #lipstain feeds
# Every 5th comment = soft brand mention
# ═══════════════════════════════════════════════════════════════════════════

NICHE_COMMENTS = [
    # Curiosity bait
    "wait what lip product is she wearing? asking for... myself",
    "ive been looking for something like this for MONTHS omg",
    "ok but has anyone tried the peel off version of lip stain bc it lasts way longer imo",
    "not me pausing the video 3 times to see what that lip color is",
    "the way this is exactly my lip situation every single morning",
    # Relatability
    "girl i felt this in my SOUL - every long-lasting lipstick has lied to me",
    "my coffee cup having more lip color than my actual lips is too real",
    "why did no one tell me peel off lip stain was a thing earlier im actually upset",
    "this is the sign i needed to stop being loyal to products that arent loyal to me",
    "we all deserve lip color that actually STAYS on and i wont accept less",
    # Soft brand mention (use every 5th comment session)
    "ok for real the @vexsen phofay lip stain is what changed everything for me, worth every penny",
    "i was skeptical about peel off lip stains too and then i tried vexsen and now i cant go back",
    "if anyones looking for a dupe thats actually BETTER: vexsen phofay. just saying",
    # Question bait (maximizes replies = algo boost)
    "genuine question: why do we keep buying glossy lipsticks that transfer when this exists??",
    "has anyone found a lip stain that holds up through coffee AND lunch bc i need answers",
    "lip stain girlies - whats your #1 tip for making it last even longer? obsessed rn",
    "can we start a support group for people let down by transfer proof lipstick",
    # Hype
    "THE LIP COLOR STAYED i need to try this immediately",
    "literally running to get this, no notes, no hesitation",
    "okay stitching this with my review because i need people to see both sides",
    "the before and after has me DEAD okay adding to cart rn",
]

COMMENT_STRATEGY = """
COMMENT TARGETING STRATEGY
============================================================
TARGET FEEDS:
  #makeuptok          highest volume, broad beauty audience
  #lipstain           direct buyer intent
  #liptint            younger audience, high engagement
  #grwm               high comment rate, easy conversion
  #makeuptransformation  before/after fans = easiest to convert

TIMING:
  Comment in the FIRST HOUR after a video posts
  Peak windows: 6-9am | 12-2pm | 7-11pm CST

RULES:
  Post 3-5 non-brand comments per session (relatability/question bait)
  Every 5th comment: soft @vexsen mention
  Reply to EVERY reply you get (multiplies your engagement signal)
  Like your own comments immediately after posting
  Target videos with 10K-500K views (not mega viral, not dead)
  NEVER post same text twice in 24h (shadowban trigger)
  NEVER drop buy links in other peoples comments
============================================================
"""

def generate_niche_comments():
    print("\n NICHE COMMENT ENGINE")
    print("-"*50)
    print(COMMENT_STRATEGY)
    print("  COMMENT BANK:")
    for i,c in enumerate(NICHE_COMMENTS,1):
        brand = " [BRAND MENTION - use 1 per 5 sessions]" if "vexsen" in c.lower() else ""
        print(f"\n  [{i:02d}]{brand}")
        print(f"  {c}")
    return NICHE_COMMENTS


# ═══════════════════════════════════════════════════════════════════════════
# MODULE 4  SELF-COMMENT ENGINE  (post on YOUR OWN videos)
# Seeds early engagement signal. Pin a link comment. Drop controversy to
# spark replies. Pre-written reply templates for every common DM/comment.
# ═══════════════════════════════════════════════════════════════════════════

SELF = {
    "pin_comment": [
        f"LINK IN BIO to shop - {STORE_URL} | Use code VEXSEN10 for 10% off",
        f"Get yours at {STORE_URL} | Free shipping on orders $60+",
        f"Grab the PHOFAY Lip Stain at {STORE_URL} | Limited stock rn",
        f"Comment your shade below and shop at {STORE_URL}",
    ],
    "engagement_seed": [
        "which shade are you getting?? I cant choose between all of them",
        "the way this doesnt transfer onto my coffee cup has me in TEARS",
        "answering questions in the comments - drop anything below",
        "stitch this with your reaction!! I want to see it",
        "save this if youve ever had a lipstick betray you",
        "duet me showing your current lip product and lets compare",
        "ok who else is going to try this?? drop your name below",
        "ill be replying to every comment tonight so drop your questions",
    ],
    "controversy_seed": [
        "hot take: peel-off lip stain is better than EVERY liquid lipstick on the market",
        "fight me in the comments if you think drugstore glosses actually last. go ahead",
        "genuinely cant believe i spent years on lipsticks that transferred when THIS exists",
        "unpopular opinion: glossy lips CAN be transfer-proof. proof: this video",
    ],
    "reply_templates": {
        "where to buy":          f"Link in bio! Or go directly to {STORE_URL}",
        "what color is that":    "Its the [SHADE] shade from the PHOFAY collection - shop at vexsen.com!",
        "how long does it last": "Tested for 14 hours with NO touch-up. Coffee, lunch, drinks - still on",
        "does it dry your lips": "NOPE - super hydrating under the stain layer. Zero dryness",
        "how much is it":        "Its $[PRICE] on vexsen.com - worth every penny for how long it lasts",
        "is it worth it":        "100% - its the only one I actually reorder. 4.9 stars for a reason",
        "shipping":              "Ships fast! Free shipping on orders $60+",
        "can I duet this":       "YES please duet me!! I want to see your reaction",
        "whats in bio":          f"The link to grab the lip stain! {STORE_URL}",
    }
}

def generate_self_comments():
    print("\n SELF-COMMENT ENGINE  (Post on YOUR Videos)")
    print("-"*50)
    print("\n  PIN COMMENTS (post immediately + pin to top of comments):")
    for i,c in enumerate(SELF["pin_comment"],1):
        print(f"    [{i}] {c}")
    print("\n  ENGAGEMENT SEEDS (post 2-3 of these in first 10 minutes):")
    for i,c in enumerate(SELF["engagement_seed"],1):
        print(f"    [{i}] {c}")
    print("\n  CONTROVERSY SEEDS (use 1 per video to spark debate):")
    for i,c in enumerate(SELF["controversy_seed"],1):
        print(f"    [{i}] {c}")
    print("\n  REPLY TEMPLATES:")
    for trigger,reply in SELF["reply_templates"].items():
        print(f'    When someone says "{trigger}":')
        print(f'      -> {reply}')
    return SELF


# ═══════════════════════════════════════════════════════════════════════════
# MODULE 5  7-DAY AGGRESSIVE POSTING CALENDAR
# 4 posts/day at peak CST times. Rotates hook formulas. Mix of content types.
# ═══════════════════════════════════════════════════════════════════════════

POST_TYPES = [
    "Product Demo (application + peel-off reveal)",
    "UGC-Style (first-time reaction)",
    "Trend Hijack (ride trending sound in beauty niche)",
    "Before/After Transformation",
    "Stitch/Duet Bait (react to a lip product complaint)",
    "Humor/Relatable (lipstick betrayal POV)",
    "Secret/Hack (peel-off technique tip)",
    "Hot Take (controversy hook)",
    "Social Proof (reading 5-star reviews out loud)",
    "Unboxing (fresh package, first impressions)",
]

PEAK_TIMES = ["6:30 AM","9:00 AM","12:00 PM","5:00 PM","8:00 PM","10:00 PM"]

def generate_calendar():
    print("\n 7-DAY AGGRESSIVE POSTING CALENDAR  (4 posts/day)")
    print("-"*50)
    today = datetime.date.today()
    calendar = []
    cap_pool = list(CAPTIONS)

    for day_offset in range(7):
        date     = today + datetime.timedelta(days=day_offset)
        day_name = date.strftime("%A %b %d")
        times    = sorted(random.sample(PEAK_TIMES, 4))
        types_today = random.sample(POST_TYPES, 4)
        day_posts = []

        print(f"\n  {day_name}")
        for i,(t,ptype) in enumerate(zip(times, types_today)):
            hook,cta,formula = cap_pool[(day_offset*4+i) % len(cap_pool)]
            tags = HASHTAG_COMBOS.get(formula, HASHTAG_COMBOS["pattern_interrupt"])
            entry = {"time":t,"post_type":ptype,"formula":formula,
                     "hook":hook,"cta":cta,"hashtags":tags}
            day_posts.append(entry)
            print(f"    {t:8s} | {ptype}")
            print(f"             HOOK: {hook[:65]}...")

        calendar.append({"date":str(date),"day":day_name,"posts":day_posts})
    return calendar


# ═══════════════════════════════════════════════════════════════════════════
# TRENDING SOUNDS
# ═══════════════════════════════════════════════════════════════════════════

SOUNDS = [
    {"sound":"Espresso - Sabrina Carpenter",        "why":"Massive trend, beauty niche crossover, high FYP push rn"},
    {"sound":"Not Like Us - Kendrick Lamar",         "why":"Controversy hook sound = high comment rate"},
    {"sound":"Levii Jeans slowed - Beyonce",         "why":"Luxury aesthetic vibe, perfect for product reveal"},
    {"sound":"BIRDS OF A FEATHER sped up - Billie",  "why":"Transformation content + this sound = algo loves it"},
    {"sound":"TEXAS HOLD EM - Beyonce",              "why":"High energy, fast-cut product demos"},
    {"sound":"Von Dutch sped up - Charli xcx",       "why":"Gen Z beauty audience magnet"},
    {"sound":"Original: glowing lips ASMR trend",    "why":"Search glowing lips asmr on TT - currently boosted in beauty"},
    {"sound":"Original: that girl gets ready niche", "why":"Search get ready with me + lip stain, replicate top performers"},
]

def print_sounds():
    print("\n TRENDING SOUNDS REPORT")
    print("-"*50)
    for i,s in enumerate(SOUNDS,1):
        print(f"  [{i}] {s['sound']}")
        print(f"       -> {s['why']}\n")


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main():
    print("\n" + "="*60)
    print("  VEXSEN TIKTOK AGGRESSIVE GROWTH ENGINE")
    print("="*60)

    hashtags   = fetch_trending_hashtags()
    captions   = generate_captions()
    comments   = generate_niche_comments()
    self_comms = generate_self_comments()
    calendar   = generate_calendar()
    print_sounds()

    # Build full output package
    output = {
        "generated_at": datetime.datetime.now().isoformat(),
        "brand": BRAND, "product": PRODUCT,
        "trending_hashtags": hashtags,
        "caption_bank": captions,
        "niche_comments": comments,
        "self_comment_scripts": self_comms,
        "7_day_calendar": calendar,
        "trending_sounds": SOUNDS,
    }

    today_str = datetime.date.today().isoformat()
    json_path = OUT_DIR / f"growth_plan_{today_str}.json"
    txt_path  = OUT_DIR / f"action_plan_{today_str}.txt"

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False, default=str)

    with open(txt_path, "w", encoding="utf-8") as f:
        f.write("VEXSEN TIKTOK AGGRESSIVE GROWTH ACTION PLAN\n")
        f.write(f"Generated: {datetime.datetime.now().strftime('%B %d, %Y %I:%M %p')}\n")
        f.write("="*60+"\n\n")

        f.write("TOP HASHTAGS\n"+"-"*40+"\n")
        for h in hashtags:
            f.write(f"{h['tier']:20s}  {h['tag']}\n")

        f.write("\n\nCAPTION BANK (20 READY-TO-POST)\n"+"-"*40+"\n")
        for c in captions:
            f.write(f"\n[{c['id']:02d}] {c['formula'].upper()}\n")
            f.write(f"HOOK: {c['hook']}\n")
            f.write(f"CTA:  {c['cta']}\n")
            f.write(f"TAGS: {c['hashtags']}\n")
            f.write("-"*40+"\n")

        f.write("\n\nNICHE COMMENT BANK\n"+"-"*40+"\n")
        for i,c in enumerate(comments,1):
            f.write(f"[{i:02d}] {c}\n")

        f.write("\n\nSELF-COMMENT SCRIPTS\n"+"-"*40+"\n")
        f.write("\nPIN COMMENTS:\n")
        for c in self_comms["pin_comment"]:     f.write(f"  -> {c}\n")
        f.write("\nENGAGEMENT SEEDS:\n")
        for c in self_comms["engagement_seed"]: f.write(f"  -> {c}\n")
        f.write("\nCONTROVERSY SEEDS:\n")
        for c in self_comms["controversy_seed"]:f.write(f"  -> {c}\n")
        f.write("\nREPLY TEMPLATES:\n")
        for trigger,reply in self_comms["reply_templates"].items():
            f.write(f'  "{trigger}" -> {reply}\n')

        f.write("\n\n7-DAY CALENDAR\n"+"-"*40+"\n")
        for day in calendar:
            f.write(f"\n{day['day']}\n")
            for p in day["posts"]:
                f.write(f"  {p['time']} | {p['post_type']}\n")
                f.write(f"  HOOK: {p['hook'][:80]}...\n")
                f.write(f"  TAGS: {p['hashtags'][:60]}...\n\n")

        f.write("\n\nTRENDING SOUNDS\n"+"-"*40+"\n")
        for s in SOUNDS:
            f.write(f"{s['sound']}\n  -> {s['why']}\n\n")

    # Copy to Downloads
    dl = Path(os.path.expanduser("~")) / "Downloads"
    shutil.copy(json_path, dl / f"vexsen_tiktok_growth_{today_str}.json")
    shutil.copy(txt_path,  dl / f"vexsen_tiktok_action_plan_{today_str}.txt")

    print("\n" + "="*60)
    print("GROWTH PACKAGE EXPORTED:")
    print(f"  JSON:        scripts/tiktok_growth_output/growth_plan_{today_str}.json")
    print(f"  TXT Plan:    scripts/tiktok_growth_output/action_plan_{today_str}.txt")
    print(f"  Downloads:   vexsen_tiktok_action_plan_{today_str}.txt")
    print("="*60)
    print("""
QUICK START - DO THIS TODAY:
--------------------------------------------------------------
1. POST: Use Caption #01 with your best UGC video right now
2. COMMENT: Drop 5 niche comments on #makeuptok (no brand yet)
3. SELF-COMMENT: Pin the link comment + drop 2 engagement seeds
4. SOUND: Use Espresso (Sabrina Carpenter) or glowing lips ASMR
5. TONIGHT: Post again at 8pm + 10pm with Captions #04 and #07
--------------------------------------------------------------
4 posts/day x 7 days = 28 pieces of content this week
Feed the algorithm VOLUME + CONSISTENCY. That's the game.
""")

if __name__ == "__main__":
    main()
