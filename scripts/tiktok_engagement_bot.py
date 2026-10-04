"""
tiktok_engagement_bot.py  (v2 — fully automated)
==================================================
Automatically:
  1. Creates burner emails via mail.tm (free, no API key)
  2. Registers new TikTok accounts using those emails
  3. Verifies email OTP pulled directly from the inbox
  4. Saves sessions to disk
  5. Runs a full engagement wave on any target @handle

USAGE
-----
  # Create N accounts and immediately engage with a target:
  python tiktok_engagement_bot.py --target vexsen --count 3

  # Just engage (use existing saved accounts):
  python tiktok_engagement_bot.py --target vexsen --wave

  # Create accounts only, don't engage yet:
  python tiktok_engagement_bot.py --target vexsen --create --count 3

  # Debug with visible browser:
  python tiktok_engagement_bot.py --target vexsen --count 2 --visible

REQUIREMENTS
------------
  pip install playwright requests
  playwright install chromium
"""

import sys, json, random, time, re, string, argparse, requests
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

# ── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
SESSION_DIR  = SCRIPT_DIR / 'bot_sessions'
ACCOUNTS_FILE= SCRIPT_DIR / 'bot_accounts.json'
OUTPUT_DIR   = SCRIPT_DIR / 'tiktok_growth_output'
LOG_FILE     = OUTPUT_DIR / 'engagement_log.txt'

SESSION_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# ── Comment pool ─────────────────────────────────────────────────────────────
COMMENTS = [
    "omg i need this so badly 😭",
    "this is SO good for the price wtf",
    "I've been looking for something like this forever",
    "okay adding to cart rn 🛒",
    "my sister told me about this and she was RIGHT",
    "POV: you just found your new holy grail 💅",
    "shipping to UK?? i need this",
    "the color payoff looks insane",
    "this actually stays on all day?? bestie i'm buying",
    "i just ordered one after seeing this 😍",
    "why is no one talking about this brand more",
    "okay but the packaging alone is giving",
    "lmk if you do a review after 2 weeks pls!!",
    "my fyp really said 'you need this' and it was RIGHT",
    "not me buying this at 2am 💀",
    "the formula is so good omg",
    "been using mine for a week and obsessed",
    "this slays harder than [expensive brand] ngl",
    "fyp for a reason bestie 🔥",
    "ok i caved and ordered 😅",
]

USERNAMES_ADJ = ['glossy','dewy','plush','velvet','glow','soft','shine','peach','blush','rosy']
USERNAMES_NOUN= ['babe','girl','vibes','mode','skin','looks','feels','era','energy','aura']

def rnd_username() -> str:
    a = random.choice(USERNAMES_ADJ)
    n = random.choice(USERNAMES_NOUN)
    num = random.randint(100, 9999)
    return f"{a}{n}{num}"

def rnd_password() -> str:
    chars = string.ascii_letters + string.digits + '!@#$'
    return ''.join(random.choices(chars, k=random.randint(12, 16)))

# ── Logging ───────────────────────────────────────────────────────────────────
def log(msg: str):
    ts = time.strftime('%Y-%m-%d %H:%M:%S')
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(line + '\n')

def human_delay(lo: float = 0.8, hi: float = 3.5):
    time.sleep(random.uniform(lo, hi))

# ── mail.tm — Free burner email with real inbox ───────────────────────────────
MAILTM_BASE = 'https://api.mail.tm'

class BurnerEmail:
    """Creates a real, working throwaway inbox via mail.tm (no signup, no API key)."""

    def __init__(self):
        self.address  = None
        self.password = None
        self.token    = None

    def create(self) -> dict:
        """Create a new inbox. Returns {'address': ..., 'password': ...}"""
        # Get available domain
        domains = requests.get(f'{MAILTM_BASE}/domains', timeout=15).json()
        domain = domains['hydra:member'][0]['domain']

        # Generate random address
        local = ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))
        self.address  = f"{local}@{domain}"
        self.password = rnd_password()

        # Register the account
        r = requests.post(f'{MAILTM_BASE}/accounts', json={
            'address': self.address,
            'password': self.password,
        }, timeout=15)
        r.raise_for_status()

        # Get auth token
        t = requests.post(f'{MAILTM_BASE}/token', json={
            'address': self.address,
            'password': self.password,
        }, timeout=15)
        t.raise_for_status()
        self.token = t.json()['token']

        log(f"  📧 Burner email created: {self.address}")
        return {'address': self.address, 'password': self.password}

    def wait_for_otp(self, timeout: int = 120) -> str | None:
        """Poll the inbox until a TikTok OTP email arrives. Returns the 6-digit code."""
        log(f"  ⏳ Waiting for TikTok OTP email (up to {timeout}s)...")
        headers = {'Authorization': f'Bearer {self.token}'}
        deadline = time.time() + timeout
        while time.time() < deadline:
            msgs = requests.get(f'{MAILTM_BASE}/messages', headers=headers, timeout=15).json()
            for msg in msgs.get('hydra:member', []):
                if 'tiktok' in msg.get('from', {}).get('address', '').lower() or \
                   'tiktok' in msg.get('subject', '').lower():
                    # Fetch full message to get body
                    detail = requests.get(f"{MAILTM_BASE}/messages/{msg['id']}", headers=headers, timeout=15).json()
                    body = detail.get('text', '') + detail.get('html', '')
                    code = re.search(r'\b(\d{6})\b', body)
                    if code:
                        log(f"  ✅ OTP received: {code.group(1)}")
                        return code.group(1)
            time.sleep(5)
        log("  ⚠️  OTP timeout — email may not have arrived")
        return None


# ── TikTok Account Creator ────────────────────────────────────────────────────
class TikTokAccountCreator:
    def __init__(self, headless: bool = True):
        self.headless = headless

    def _new_context(self, p, storage_state: str | None = None):
        ctx_opts = {
            'viewport': {'width': random.randint(375, 414), 'height': random.randint(812, 896)},
            'user_agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
            'locale': random.choice(['en-US', 'en-GB', 'en-CA']),
            'timezone_id': random.choice(['America/New_York', 'America/Chicago', 'America/Los_Angeles']),
        }
        if storage_state:
            ctx_opts['storage_state'] = storage_state
        ctx = self.browser.new_context(**ctx_opts)
        ctx.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3,4] });
            window.chrome = { runtime: {} };
        """)
        return ctx

    def create_account(self, p, email_obj: BurnerEmail) -> dict | None:
        """Full automated TikTok registration flow. Returns account dict on success."""
        self.browser = p.chromium.launch(
            headless=self.headless,
            args=['--no-sandbox', '--disable-blink-features=AutomationControlled']
        )
        ctx  = self._new_context(p)
        page = ctx.new_page()

        username = rnd_username()
        password = rnd_password()

        try:
            log(f"  🌐 Opening TikTok registration...")
            page.goto('https://www.tiktok.com/signup/phone-or-email/email', timeout=30000)
            human_delay(2.5, 5.0)

            # Birthday (must be 18+)
            birth_year  = random.randint(1990, 2003)
            birth_month = random.randint(1, 12)
            birth_day   = random.randint(1, 28)

            try:
                # Month dropdown
                page.select_option('select[name="month"]', str(birth_month))
                human_delay(0.4, 1.0)
                page.select_option('select[name="day"]', str(birth_day))
                human_delay(0.4, 1.0)
                page.select_option('select[name="year"]', str(birth_year))
                human_delay(0.8, 2.0)
                page.click('button[type="submit"]')
                human_delay(1.5, 3.0)
            except Exception:
                pass  # Birthday selectors may vary — continue anyway

            # Email field
            email_input = page.wait_for_selector('input[name="email"]', timeout=10000)
            email_input.fill(email_obj.address)
            human_delay(0.6, 1.5)

            # Password field
            pwd_input = page.query_selector('input[type="password"]')
            if pwd_input:
                pwd_input.fill(password)
                human_delay(0.6, 1.5)

            # Submit
            page.click('button[type="submit"]')
            human_delay(2.0, 4.0)

            # Handle OTP screen — wait for 6-digit input
            try:
                page.wait_for_selector('input[placeholder*="6"]', timeout=15000)
                otp = email_obj.wait_for_otp(timeout=120)
                if otp:
                    otp_input = page.query_selector('input[placeholder*="6"]')
                    if otp_input:
                        otp_input.fill(otp)
                        human_delay(0.8, 2.0)
                        # Click confirm/verify button
                        verify_btn = page.query_selector('button[type="submit"]')
                        if verify_btn:
                            verify_btn.click()
                            human_delay(2.0, 4.0)
                else:
                    log("  ⚠️ No OTP — trying to continue anyway")
            except Exception as e:
                log(f"  ⚠️ OTP step: {e}")

            # Set username if prompted
            try:
                un_input = page.query_selector('input[placeholder*="username" i]')
                if un_input:
                    un_input.fill(username)
                    human_delay(0.5, 1.5)
                    submit = page.query_selector('button[type="submit"]')
                    if submit:
                        submit.click()
                        human_delay(2.0, 3.5)
            except Exception:
                pass

            # Save session
            session_file = SESSION_DIR / f"session_{username}.json"
            state = page.context.storage_state()
            session_file.write_text(json.dumps(state), encoding='utf-8')

            account = {
                'username': username,
                'email': email_obj.address,
                'email_password': email_obj.password,
                'tiktok_password': password,
                'session_file': session_file.name,
                'created_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            }
            log(f"  ✅ Account created: @{username} ({email_obj.address})")
            return account

        except Exception as e:
            log(f"  ❌ Account creation failed: {e}")
            return None
        finally:
            ctx.close()
            self.browser.close()


# ── TikTok Engager ────────────────────────────────────────────────────────────
class TikTokEngager:
    def __init__(self, account: dict, target: str, headless: bool = True):
        self.account  = account
        self.target   = target.lstrip('@')
        self.headless = headless
        self.session_file = str(SESSION_DIR / account['session_file'])

    def run(self) -> bool:
        from playwright.sync_api import sync_playwright
        log(f"\n🤖 Engaging @{self.target} as @{self.account['username']}")

        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=self.headless,
                args=['--no-sandbox', '--disable-blink-features=AutomationControlled']
            )
            ctx = browser.new_context(
                viewport={'width': random.randint(375, 414), 'height': random.randint(812, 896)},
                user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
                storage_state=self.session_file if Path(self.session_file).exists() else None,
            )
            ctx.add_init_script("Object.defineProperty(navigator,'webdriver',{get:()=>undefined})")
            page = ctx.new_page()

            try:
                # Navigate to target profile
                log(f"  📱 Opening @{self.target}'s profile...")
                page.goto(f'https://www.tiktok.com/@{self.target}', timeout=30000)
                human_delay(3.0, 5.5)

                # Follow
                try:
                    btn = page.query_selector('[data-e2e="follow-button"]')
                    if btn and 'following' not in btn.inner_text().lower():
                        human_delay(1.0, 2.5)
                        btn.click()
                        log(f"  ➕ Followed @{self.target}")
                        human_delay(0.8, 2.0)
                except Exception as e:
                    log(f"  ⚠️ Follow: {e}")

                # Find latest video
                video_url = None
                try:
                    page.wait_for_selector('[data-e2e="user-post-item"]', timeout=10000)
                    items = page.query_selector_all('[data-e2e="user-post-item"] a')
                    if items:
                        video_url = items[0].get_attribute('href')
                except Exception:
                    pass

                if video_url:
                    log(f"  🎬 Watching: {video_url}")
                    page.goto(video_url, timeout=30000)
                    watch_s = random.uniform(18, 50)
                    log(f"  👁  Watching {watch_s:.0f}s...")
                    time.sleep(watch_s)

                    # Like
                    try:
                        like = page.query_selector('[data-e2e="like-icon"]')
                        if like:
                            human_delay(0.8, 2.5)
                            like.click()
                            log("  ❤️  Liked")
                    except Exception:
                        pass

                    # Comment (70% chance)
                    if random.random() < 0.70:
                        try:
                            cmt_btn = page.query_selector('[data-e2e="comment-icon"]')
                            if cmt_btn:
                                cmt_btn.click()
                                human_delay(1.5, 3.0)
                            box = page.query_selector('[data-e2e="comment-input"]')
                            if box:
                                text = random.choice(COMMENTS)
                                box.click()
                                for ch in text:
                                    box.type(ch, delay=random.randint(40, 120))
                                human_delay(0.8, 2.0)
                                box.press('Enter')
                                log(f"  💬 Commented: \"{text[:45]}...\"")
                        except Exception as e:
                            log(f"  ⚠️ Comment: {e}")
                else:
                    log("  ⚠️ No video found")

                # Save updated session
                state = page.context.storage_state()
                Path(self.session_file).write_text(json.dumps(state), encoding='utf-8')
                log(f"  💾 Session saved")
                return True

            except Exception as e:
                log(f"  ❌ Engagement failed: {e}")
                return False
            finally:
                browser.close()


# ── Account Manager ───────────────────────────────────────────────────────────
def load_accounts() -> list:
    if ACCOUNTS_FILE.exists():
        return json.loads(ACCOUNTS_FILE.read_text(encoding='utf-8'))
    return []

def save_accounts(accounts: list):
    ACCOUNTS_FILE.write_text(json.dumps(accounts, indent=2, ensure_ascii=False), encoding='utf-8')


def create_accounts(count: int, headless: bool) -> list:
    from playwright.sync_api import sync_playwright
    created = []
    creator = TikTokAccountCreator(headless=headless)

    with sync_playwright() as p:
        for i in range(count):
            log(f"\n{'─'*50}")
            log(f"📧 Creating account {i+1}/{count}...")
            burner = BurnerEmail()
            try:
                burner.create()
            except Exception as e:
                log(f"  ❌ Burner email failed: {e}")
                continue

            acct = creator.create_account(p, burner)
            if acct:
                created.append(acct)
                # Save after each success in case of later failure
                existing = load_accounts()
                save_accounts(existing + [acct])
                log(f"  📁 Saved to bot_accounts.json")

            # Cooldown between creations
            if i < count - 1:
                gap = random.uniform(20, 45)
                log(f"  ⏳ Cooling down {gap:.0f}s before next account...")
                time.sleep(gap)

    return created


def run_wave(target: str, accounts: list, headless: bool) -> int:
    if not accounts:
        log("⚠️ No accounts found. Run with --count to create some first.")
        return 0

    log(f"\n🚀 Running engagement wave on @{target} with {len(accounts)} account(s)")
    success = 0
    for i, acct in enumerate(accounts):
        engager = TikTokEngager(acct, target, headless=headless)
        if engager.run():
            success += 1
        if i < len(accounts) - 1:
            gap = random.uniform(12, 35)
            log(f"⏳ Waiting {gap:.0f}s before next account...")
            time.sleep(gap)

    log(f"\n{'='*55}")
    log(f"🏁 Wave done: {success}/{len(accounts)} accounts engaged @{target}")
    log(f"📊 Log: {LOG_FILE}")
    return success


# ── Entry Point ───────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description='TikTok auto-account creator & engagement bot')
    parser.add_argument('--target',  type=str, required=True, help='TikTok @handle to engage (e.g. vexsen)')
    parser.add_argument('--count',   type=int, default=0,     help='Number of new accounts to create')
    parser.add_argument('--wave',    action='store_true',      help='Run engagement with existing accounts only')
    parser.add_argument('--create',  action='store_true',      help='Create accounts only, skip engagement')
    parser.add_argument('--visible', action='store_true',      help='Show browser (useful for debugging/CAPTCHAs)')
    args = parser.parse_args()

    headless = not args.visible
    target   = args.target.lstrip('@')

    # Step 1: Create accounts if requested
    new_accounts = []
    if args.count > 0:
        log(f"\n🏭 Creating {args.count} burner TikTok account(s)...")
        new_accounts = create_accounts(args.count, headless)
        log(f"\n✅ Created {len(new_accounts)}/{args.count} accounts successfully")

    # Step 2: Engage (unless --create only)
    if not args.create:
        all_accounts = load_accounts()
        if not all_accounts:
            log("No accounts saved yet. Use --count N to create accounts first.")
            return
        run_wave(target, all_accounts, headless)


if __name__ == '__main__':
    main()
