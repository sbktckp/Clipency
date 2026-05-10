from pathlib import Path
import re
import shutil

bad_scripts = [
    "clipency-payout-page-live-final.js",
    "clipency-payout-targeted-live.js",
    "clipency-launch-flow.js",
    "clipency-payment-history-live.js",
    "clipency-stats-live.js",
]

bases = [Path("."), Path("Clipency Authentication")]

for base in bases:
    campaigns = base / "campaigns" / "index.html"
    payouts = base / "payouts" / "index.html"
    stats = base / "stats" / "index.html"

    if campaigns.exists():
        if payouts.parent.exists():
            shutil.copyfile(campaigns, payouts)
            print("Restored payouts shell from campaigns:", payouts)

        if stats.parent.exists():
            shutil.copyfile(campaigns, stats)
            print("Restored stats shell from campaigns:", stats)

for f in [
    Path("payouts/index.html"),
    Path("stats/index.html"),
    Path("Clipency Authentication/payouts/index.html"),
    Path("Clipency Authentication/stats/index.html"),
]:
    if not f.exists():
        continue

    html = f.read_text(encoding="utf-8", errors="ignore")

    for script in bad_scripts:
        html = re.sub(
            rf'\s*<script[^>]+src=["\'][^"\']*{re.escape(script)}[^"\']*["\'][^>]*>\s*</script>\s*',
            "\n",
            html,
            flags=re.I
        )

    # Remove accidental old broken one-line fallback content if it got injected
    html = html.replace("Could not load live campaigns. Showing fallback data.", "")

    f.write_text(html, encoding="utf-8")
    print("Cleaned:", f)

# Make dangerous payout override files harmless so even if cached/included, they cannot wipe UI
safe_noop = """(function(){
  window.CLIPENCY_PAYOUT_LIVE_FINAL = "disabled-safe-noop";
  window.CLIPENCY_PAYOUT_TARGETED_LIVE = "disabled-safe-noop";
  console.log("[Clipency] destructive payout override disabled safely.");
})();\\n"""

for f in [
    Path("clipency-payout-page-live-final.js"),
    Path("clipency-payout-targeted-live.js"),
    Path("Clipency Authentication/clipency-payout-page-live-final.js"),
    Path("Clipency Authentication/clipency-payout-targeted-live.js"),
]:
    if f.exists():
        f.write_text(safe_noop, encoding="utf-8")
        print("Disabled dangerous script:", f)
