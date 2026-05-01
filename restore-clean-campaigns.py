from pathlib import Path
import subprocess
import re
import os

ROOT = Path("/workspaces/Clipency")
APP = ROOT / "Clipency Authentication"

HTML_PATHS = [
    "Clipency Authentication/dashboard.html",
    "Clipency Authentication/campaigns/index.html",
]

BAD_NEEDLES = [
    "clipency-navigation-firewall",
    "clipency-campaign-click-neutralizer",
    "clipency-campaign-card-strict-restore",
    "cx-campaign-native-modal",
    "cx-first-campaign-modal",
    "cx-explicit-profile-link",
]

BAD_FILES = [
    APP / "clipency-navigation-firewall.js",
    APP / "clipency-navigation-firewall.css",
    APP / "clipency-campaign-click-neutralizer.js",
    APP / "clipency-campaign-card-strict-restore.js",
    APP / "clipency-campaign-card-strict-restore.css",
]

def run(cmd, check=True):
    return subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True, check=check)

def git_show(commit, path):
    res = run(["git", "show", f"{commit}:{path}"], check=False)
    if res.returncode != 0:
        return None
    return res.stdout

commits = run(["git", "rev-list", "HEAD"]).stdout.splitlines()

good = None

for commit in commits:
    combined = ""
    for path in HTML_PATHS:
        content = git_show(commit, path)
        if content:
            combined += content + "\n"

    if not combined:
        continue

    has_bad = any(needle in combined for needle in BAD_NEEDLES)
    looks_like_campaigns = (
        "Campaigns" in combined
        and (
            "Rate per 1M" in combined
            or "campaign" in combined.lower()
        )
    )

    if looks_like_campaigns and not has_bad:
        good = commit
        break

if not good:
    raise SystemExit("Could not find a clean campaign version in git history.")

print("Restoring clean campaign version from:", good)

# Restore dashboard + campaigns route from clean commit
for path in HTML_PATHS:
    if git_show(good, path) is not None:
        run(["git", "checkout", good, "--", path], check=True)

# Remove bad patch files
for file in BAD_FILES:
    if file.exists():
        file.unlink()
        print("Removed:", file)

# Remove bad script/style injections from every HTML file
bad_asset_names = [
    "clipency-navigation-firewall.js",
    "clipency-navigation-firewall.css",
    "clipency-campaign-click-neutralizer.js",
    "clipency-campaign-card-strict-restore.js",
    "clipency-campaign-card-strict-restore.css",
]

for html_file in APP.rglob("*.html"):
    html = html_file.read_text(encoding="utf-8", errors="ignore")

    for asset in bad_asset_names:
        html = re.sub(rf'\s*<script[^>]+src="/{re.escape(asset)}"[^>]*></script>\s*', "\n", html)
        html = re.sub(rf'\s*<link[^>]+href="/{re.escape(asset)}"[^>]*>\s*', "\n", html)

    html_file.write_text(html, encoding="utf-8")

# Ensure /campaigns physical route exists
campaigns_dir = APP / "campaigns"
campaigns_dir.mkdir(exist_ok=True)

if not (campaigns_dir / "index.html").exists():
    (campaigns_dir / "index.html").write_text(
        (APP / "dashboard.html").read_text(encoding="utf-8"),
        encoding="utf-8"
    )

print("Clean campaign restore completed.")
