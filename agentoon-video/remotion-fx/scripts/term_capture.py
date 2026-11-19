#!/usr/bin/env python3
"""Real terminal capture: types `cmd` after a "$ " prompt (typing is synthetic, the command that runs is exactly the typed text), runs it in a pty via bash -c,
records every output byte with a timestamp (JSONL [t, base64]). Usage: term_capture.py <out.jsonl> <cwd> "<cmd>" [cols rows]"""
import os, pty, sys, time, json, base64, select, fcntl, termios, struct, signal
out, cwd, cmd = sys.argv[1], sys.argv[2], sys.argv[3]
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 74; rows = int(sys.argv[5]) if len(sys.argv) > 5 else 26
log = open(out, "w"); t0 = time.time()
def w(b): log.write(json.dumps([round(time.time() - t0, 3), base64.b64encode(b).decode()]) + "\n"); log.flush()
w(b"\x1b[1;32m$\x1b[0m ")
for ch in cmd: w(ch.encode()); time.sleep(0.045)
time.sleep(0.4); w(b"\r\n")
pid, fd = pty.fork()
if pid == 0:
    os.chdir(cwd); env = dict(os.environ, TERM="xterm-256color", COLUMNS=str(cols), LINES=str(rows), DISABLE_TELEMETRY="1", NODE_USE_ENV_PROXY="1", NODE_NO_WARNINGS="1", NODE_EXTRA_CA_CERTS="/root/.ccr/ca-bundle.crt", FORCE_COLOR="1")
    os.execvpe("bash", ["bash", "-c", cmd], env)
fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))
end = time.time() + 120; last = time.time(); got = False; sent = False
while time.time() < end:
    r, _, _ = select.select([fd], [], [], 0.1)
    if r:
        try: b = os.read(fd, 65536)
        except OSError: break
        if not b: break
        w(b); last = time.time(); got = True
    else:
        try:
            p, st = os.waitpid(pid, os.WNOHANG)
            if p: break
        except ChildProcessError: break
        if got and not sent and time.time() - last > 4.0:      # interactive picker is waiting for a key: hold 1.5 s more, then Ctrl-C
            time.sleep(1.0); os.write(fd, b"\x03"); sent = True; last = time.time()
        elif sent and time.time() - last > 2.5: break
time.sleep(0.3); w(b"\x1b[1;32m$\x1b[0m ")
print("done", round(time.time() - t0, 1))
