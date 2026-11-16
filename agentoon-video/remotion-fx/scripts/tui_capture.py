#!/usr/bin/env python3
"""REAL Claude Code TUI capture: spawns `claude` (Haiku) in a pty at COLSxROWS, types a slash command with human-like delays,
records every byte with a timestamp (JSONL: [t, base64]) while mirroring the screen through pyte to detect state.
Usage: tui_capture.py <out.jsonl> "<typed text>" [done_regex] [max_seconds]"""
import os, pty, sys, time, json, base64, select, fcntl, termios, struct, re, signal, subprocess
import pyte
COLS, ROWS = 76, 27
out, text = sys.argv[1], sys.argv[2]; done = re.compile(sys.argv[3] if len(sys.argv) > 3 else r"bytes"); maxs = float(sys.argv[4]) if len(sys.argv) > 4 else 120
cwd = "/home/user/emaddawood1991-tech/agentoon-video/remotion-fx"
pid, fd = pty.fork()
if pid == 0:
    os.chdir(cwd); env = dict(os.environ, TERM="xterm-256color", COLUMNS=str(COLS), LINES=str(ROWS), REMOTION_LOG="error", FORCE_COLOR="1")
    os.execvpe("claude", ["claude", "--model", "claude-haiku-5-5", "--permission-mode", "acceptEdits", "--allowedTools", "Skill Bash(npx remotion still:*) Bash(ls:*)"], env)
fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", ROWS, COLS, 0, 0))
screen = pyte.Screen(COLS, ROWS); stream = pyte.ByteStream(screen); t0 = time.time(); log = open(out, "w")
def pump(dur):
    end = time.time() + dur
    while time.time() < end:
        r, _, _ = select.select([fd], [], [], 0.05)
        if r:
            try: b = os.read(fd, 65536)
            except OSError: return False
            if not b: return False
            log.write(json.dumps([round(time.time() - t0, 3), base64.b64encode(b).decode()]) + "\n"); log.flush(); stream.feed(b)
    return True
def txt(): return "\n".join(screen.display)
def wait_for(rx, secs):
    end = time.time() + secs
    while time.time() < end:
        pump(0.3)
        if re.search(rx, txt()): return True
    return False
keys = [b"\r", b"\x1b[13u"]; ki = 0; last = None
for _ in range(60):
    pump(0.8); s = txt()
    if "for shortcuts" in s: break
    if s == last:                                  # dialog did not advance: try the other Enter encoding
        ki ^= 1
    os.write(fd, keys[ki]); last = s; pump(1.2)
pump(1.5)
for ch in text:
    os.write(fd, ch.encode()); pump(0.07 if ch != " " else 0.12)
pump(1.8)                         # let the slash menu / description sit on screen
os.write(fd, b"\r"); ok = wait_for(done, maxs); pump(3.0)
log.write(json.dumps([round(time.time() - t0, 3), "RESULT_OK" if ok else "RESULT_TIMEOUT"]) + "\n")
open(out + ".screen.txt", "w").write(txt())
os.write(fd, b"\x03"); pump(0.6); os.write(fd, b"\x03"); pump(1.0)
try: os.kill(pid, signal.SIGKILL)
except Exception: pass
print("ok" if ok else "timeout", "duration", round(time.time() - t0, 1))
