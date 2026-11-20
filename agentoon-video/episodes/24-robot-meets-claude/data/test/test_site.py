from playwright.sync_api import sync_playwright
URL = "file:///home/user/emaddawood1991-tech/agentoon-video/episodes/24-robot-meets-claude/site-run/index.html"
res = []
def check(name, ok, detail=""):
    res.append((name, ok, detail)); print(("PASS" if ok else "FAIL"), "-", name, detail)

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    page = b.new_page()
    logs = []
    page.on("console", lambda m: logs.append((m.type, m.text)))
    page.on("pageerror", lambda e: logs.append(("pageerror", str(e))))
    page.on("requestfailed", lambda r: logs.append(("requestfailed", r.url)))
    page.goto(URL); page.wait_for_load_state("networkidle")
    cnt = lambda: page.inner_text("#cart-count").strip()
    check("initial count is 0", cnt() == "0", cnt())
    for i, id_ in enumerate(["add-croissant", "add-sourdough", "add-roll"], 1):
        page.click("#" + id_)
        check(f"{id_} -> count {i}", cnt() == str(i), "got " + cnt())
    page.click("#add-roll")
    check("extra click -> count 4", cnt() == "4", "got " + cnt())

    msg = lambda: page.inner_text("#news-msg").strip()
    def submit(v):
        page.fill("#email", v); page.click("#news-form button"); return msg()
    for v in ["", "notanemail", "foo.com"]:
        m = submit(v); check(f"invalid {v!r} rejected", "valid email" in m, repr(m))
    m = submit("test@example.com"); check("valid test@example.com accepted", "Thanks" in m, repr(m))
    for v in ["@", "a@", "@b", "a b@c"]:
        m = submit(v); check(f"malformed {v!r} rejected", "valid email" in m, repr(m))
    page.screenshot(path="/tmp/wat/shot-after.png", full_page=True)
    print("CONSOLE:", logs or "none")
    b.close()
