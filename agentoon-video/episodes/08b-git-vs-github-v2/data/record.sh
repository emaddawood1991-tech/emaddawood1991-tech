set -e
cd /tmp/ep9/work && rm -rf site remote.git laptop2 t && mkdir t
T=/tmp/ep9/work/t
export GIT_AUTHOR_NAME=Agentoon GIT_AUTHOR_EMAIL=dev@agentoon.local GIT_COMMITTER_NAME=Agentoon GIT_COMMITTER_EMAIL=dev@agentoon.local GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null
run(){ f=$1; shift; echo "\$ $*" >> $T/$f.txt; "$@" >> $T/$f.txt 2>&1; }
git init -q -b main site && cd site
cat > index.html <<'EOF'
<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bean Bar</title></head>
<body><h1>Bean Bar</h1><p>Fresh coffee, brewed slowly.</p></body></html>
EOF
git add index.html && git commit -q -m "Add homepage"
cat > style.css <<'EOF'
body{margin:0;font-family:system-ui,sans-serif;background:#1b120d;color:#f4e8dc;text-align:center;padding:48px 20px}
h1{font-size:44px;color:#ffb347;margin:0 0 8px}p{font-size:19px;opacity:.85}
EOF
sed -i 's#<title>Bean Bar</title>#<title>Bean Bar</title><link rel="stylesheet" href="style.css">#' index.html
git add . && git commit -q -m "Style the design"
python3 - <<'EOF'
t=open("index.html").read().replace("</body>",'<div class="cards"><div class="card">Espresso<br><b>$3</b></div><div class="card">Latte<br><b>$4</b></div><div class="card">Cold brew<br><b>$5</b></div></div></body>')
open("index.html","w").write(t)
open("style.css","a").write(".cards{display:flex;gap:12px;justify-content:center;margin-top:28px}.card{background:#2c1d14;border:2px solid #ffb347;border-radius:14px;padding:16px 14px;font-size:17px}.card b{color:#ffb347;font-size:22px}\n")
EOF
git add . && git commit -q -m "Add menu cards"
mkdir -p /tmp/ep9/shots; cp -r . /tmp/ep9/work/v3snap
run s3 git log --oneline
run s4 git log --oneline
H2=$(git rev-parse --short HEAD~1); H1=$(git rev-parse --short HEAD~2); echo "$H1 $H2 $(git rev-parse --short HEAD)" > $T/hashes.txt
cd .. ; rm -rf site_s4; cp -r site site_s4; cd site_s4
run s4 git restore --source=$H2 .
run s4 git status --short
cd ../site
cd ..; git init -q --bare -b main remote.git; cd site
run s6 git remote add origin ../remote.git
run s6 git push -u origin main
cd ..; run s7 git clone remote.git laptop2
cd laptop2; echo "/* tweak from laptop 2 */" >> style.css; git add .; git commit -q -m "Tweak colours on laptop 2"; git push -q origin main; cd ../site
run s6 git pull origin main
sed -i 's#Fresh coffee, brewed slowly.#Fresh coffee, brewed slowly. Open daily 8am to 6pm.#' index.html
run s8 git status --short
run s8 git add .
run s8 git commit -m "Update website"
run s8 git log --oneline --graph --decorate
