import json
import os
import re
import time
import requests

# ── config ────────────────────────────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IDS_DIR  = os.path.join(BASE_DIR, "ids")

URL = "https://nkb-backend-ccbp-prod-apis.ccbp.in/api/nkb_learning_resource/learning_resources/set/complete/"

HEADERS = {
    "accept": "application/json",
    "accept-language": "en-US,en;q=0.9",
    "authorization": "Bearer LYWuq48JdmkbxbHGRRwt5e8dHllvFW",
    "content-type": "application/json",
    "origin": "https://learning.ccbp.in",
    "referer": "https://learning.ccbp.in/",
    "priority": "u=1, i",
    "sec-ch-ua": '"Chromium";v="145", "Not:A-Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Linux"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    "x-app-version": "1127",
    "x-browser-session-id": "60b5d4c3-1598-4602-b497-a935c6611e3a",
}

DELAY_BETWEEN_REQUESTS = 1  # seconds

# ── helpers ───────────────────────────────────────────────────────────────────

def parse_json_objects(text: str) -> list:
    """Extract all top-level JSON objects from a string (handles multi-object files)."""
    objects = []
    decoder = json.JSONDecoder()
    idx = 0
    text = text.strip()
    while idx < len(text):
        match = re.search(r'\S', text[idx:])
        if not match:
            break
        idx += match.start()
        try:
            obj, end = decoder.raw_decode(text, idx)
            objects.append(obj)
            idx += end - idx
        except json.JSONDecodeError:
            break
    return objects


def extract_units_from_data(data: dict, source_label: str, unit_ids: list) -> None:
    """Pull LEARNING_SET unit_ids out of any known JSON shape."""

    # Shape 1: { "topics": [ { "units": [...] } ] }
    for topic in data.get("topics", []):
        for unit in topic.get("units", []):
            if unit.get("unit_type") == "LEARNING_SET":
                uid = unit.get("unit_id")
                if uid and uid not in unit_ids:
                    unit_ids.append(uid)
                    print(f"  [+] {uid}  ({source_label} -> {topic.get('topic_name', '')})")

    # Shape 2: { "units_details": [...] }
    for unit in data.get("units_details", []):
        if unit.get("unit_type") == "LEARNING_SET":
            uid = unit.get("unit_id")
            if uid and uid not in unit_ids:
                unit_ids.append(uid)
                name = (unit.get("learning_resource_set_unit_details") or {}).get("name", "")
                print(f"  [+] {uid}  ({source_label} -> {name})")


def collect_from_json_dir(ids_dir: str, unit_ids: list) -> None:
    """Scan ids/ folder for .json files (single or multi-object)."""
    if not os.path.isdir(ids_dir):
        return
    for filename in sorted(os.listdir(ids_dir)):
        if not filename.endswith(".json"):
            continue
        filepath = os.path.join(ids_dir, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            raw = f.read()
        for data in parse_json_objects(raw):
            extract_units_from_data(data, filename, unit_ids)


def collect_from_har(har_path: str, unit_ids: list) -> None:
    """Extract LEARNING_SET unit_ids from every response body inside a HAR file.

    The HAR structure is:
      log.entries[].response.content.text  ->  JSON string of the API response
    """
    filename = os.path.basename(har_path)
    print(f"  Reading HAR: {filename}")
    with open(har_path, "r", encoding="utf-8") as f:
        har = json.load(f)

    entries = har.get("log", {}).get("entries", [])
    hits = 0
    for entry in entries:
        content_text = (
            entry.get("response", {})
                 .get("content", {})
                 .get("text", "")
        )
        if not content_text:
            continue
        try:
            data = json.loads(content_text)
        except (json.JSONDecodeError, TypeError):
            continue
        if not isinstance(data, dict):
            continue
        before = len(unit_ids)
        extract_units_from_data(data, filename, unit_ids)
        hits += len(unit_ids) - before

    print(f"  => {hits} new LEARNING_SET ids found in {len(entries)} HAR entries")


# ── main ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    unit_ids = []

    # 1. HAR files in the project root
    har_files = sorted(f for f in os.listdir(BASE_DIR) if f.endswith(".har"))
    if har_files:
        print("── HAR files ──────────────────────────────────────")
        for har_file in har_files:
            collect_from_har(os.path.join(BASE_DIR, har_file), unit_ids)
    else:
        print("No .har files found in project root.")

    # 2. JSON files in the ids/ folder
    if os.path.isdir(IDS_DIR):
        print(f"\n── ids/ folder ────────────────────────────────────")
        collect_from_json_dir(IDS_DIR, unit_ids)

    print(f"\nFound {len(unit_ids)} unique LEARNING_SET unit_id(s). Starting requests...\n")

    for i, uid in enumerate(unit_ids, 1):
        print(f"[{i}/{len(unit_ids)}] Marking complete: {uid}")
        payload_inner = json.dumps({"learning_resource_set_id": uid})
        payload = {"data": json.dumps(payload_inner), "clientKeyDetailsId": 1}
        resp = requests.post(URL, headers=HEADERS, json=payload, timeout=30)
        try:
            body = resp.json()
        except Exception:
            body = resp.text[:200]
        print(f"  -> {resp.status_code}  {body}")
        if i < len(unit_ids):
            time.sleep(DELAY_BETWEEN_REQUESTS)

    print("\nDone.")
