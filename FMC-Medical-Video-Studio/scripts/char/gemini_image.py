"""Image generation/editing via Gemini image models using reference images (identity-preserving).
usage: gemini_image.py MODEL OUT.png "prompt" ref1.png [ref2.png ...]   (key from env GEMINI_API_KEY; never printed)"""
import sys, os, json, base64, urllib.request, urllib.error, time
model, out, prompt, *refs = sys.argv[1:]
parts = [{"text": prompt}]
for r in refs:
    parts.append({"inlineData": {"mimeType": "image/png", "data": base64.b64encode(open(r, 'rb').read()).decode()}})
body = json.dumps({"contents": [{"parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"]}}).encode()
url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
for attempt in range(5):
    req = urllib.request.Request(url, body, {"Content-Type": "application/json", "x-goog-api-key": os.environ["GEMINI_API_KEY"]})
    try:
        j = json.load(urllib.request.urlopen(req, timeout=240)); break
    except urllib.error.HTTPError as e:
        msg = e.read().decode()[:300]
        if e.code in (429, 503) and attempt < 4:
            print("retry", e.code, msg[:120]); time.sleep(25); continue
        print("HTTP", e.code, msg); sys.exit(2)
for c in j.get("candidates", []):
    for p in c["content"]["parts"]:
        if "inlineData" in p:
            open(out, "wb").write(base64.b64decode(p["inlineData"]["data"])); print("saved", out); sys.exit(0)
print("no image:", json.dumps(j)[:400]); sys.exit(3)
