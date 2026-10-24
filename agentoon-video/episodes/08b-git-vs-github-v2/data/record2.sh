set -e
W=/tmp/ep11/work; rm -rf $W; mkdir -p $W/t; cd $W; T=$W/t
export GIT_AUTHOR_NAME=Agentoon GIT_AUTHOR_EMAIL=dev@agentoon.local GIT_COMMITTER_NAME=Agentoon GIT_COMMITTER_EMAIL=dev@agentoon.local GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null
run(){ f=$1; shift; echo "\$ $*" >> $T/$f.txt; "$@" >> $T/$f.txt 2>&1; }
snap(){ mkdir -p $W/snap/$1; cp index.html style.css $W/snap/$1/ 2>/dev/null || cp index.html $W/snap/$1/; }
git init -q -b main site && cd site
cat > index.html <<'EOF'
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bean Bar</title></head>
<body>
<h1>Bean Bar</h1>
<p>Fresh coffee, brewed slowly.</p>
<ul><li>Home</li><li>Menu</li><li>Visit us</li></ul>
<h2>Menu</h2>
<p>Espresso $3, Latte $4, Cold brew $5</p>
</body></html>
EOF
git add index.html && git commit -q -m "Add homepage"; snap v1
cat > style.css <<'EOF'
:root{--accent:#ffb347}
body{margin:0;font-family:system-ui,sans-serif;background:#1b120d;color:#f4e8dc;text-align:center}
ul{display:flex;gap:10px;justify-content:center;list-style:none;padding:14px 0;margin:0;background:#120b07;order:-1}
li{padding:8px 18px;border:2px solid var(--accent);border-radius:999px;font-size:18px;color:var(--accent)}
h1{font-size:68px;color:var(--accent);margin:34px 0 4px}
p{font-size:24px;opacity:.9;margin:0 0 18px}
h2{font-size:30px;margin:26px 0 8px}
EOF
python3 - <<'EOF'
t=open("index.html").read()
t=t.replace('<title>Bean Bar</title>','<title>Bean Bar</title><link rel="stylesheet" href="style.css">')
# nav first, as in style.css (flex order) -> move ul above h1 for a real nav bar
import re
ul=re.search(r"<ul>.*?</ul>\n",t).group(0); t=t.replace(ul,"").replace("<body>\n","<body>\n"+ul.replace("<ul>","<ul class=\"nav\">"))
open("index.html","w").write(t)
EOF
sed -i 's/^ul{/ul.nav{/; s/^li{/ul.nav li{/' style.css
git add . && git commit -q -m "Style the design"; snap v2
python3 - <<'EOF'
t=open("index.html").read()
t=t.replace("<p>Espresso $3, Latte $4, Cold brew $5</p>",'<div class="cards"><div class="card">Espresso<b>$3</b></div><div class="card">Latte<b>$4</b></div><div class="card">Cold brew<b>$5</b></div></div>')
t=t.replace("<h2>Menu</h2>","<h2>Menu</h2>")
t=t.replace("<p>Fresh coffee, brewed slowly.</p>","<p>Fresh coffee, brewed slowly.</p>\n<a class=\"btn\" href=\"#\">Order now</a>")
open("index.html","w").write(t)
open("style.css","a").write(".btn{display:inline-block;background:var(--accent);color:#1b120d;font-weight:800;font-size:22px;padding:12px 30px;border-radius:999px;text-decoration:none;margin-bottom:8px}\n.cards{display:flex;gap:16px;justify-content:center}.card{background:#2c1d14;border:2px solid var(--accent);border-radius:16px;padding:16px 26px;font-size:22px;display:flex;flex-direction:column;gap:4px}.card b{color:var(--accent);font-size:32px}\n")
EOF
git add . && git commit -q -m "Add menu cards"; snap v3
cd ..; mkdir -p site_s4; cp -r site/. site_s4/
cd site
run s3 git log --oneline
run s4 git log --oneline
H2=$(git rev-parse --short HEAD~1); echo "$(git rev-parse --short HEAD~2) $H2 $(git rev-parse --short HEAD)" > $T/hashes.txt
cd ../site_s4; run s4 git restore --source=$H2 .; run s4 git status --short; cd ../site
cd ..; git init -q --bare -b main remote.git; cd site
run s6 git remote add origin ../remote.git
run s6 git push -u origin main
cd ..; run s7 git clone remote.git laptop2
cd laptop2; sed -i 's/--accent:#ffb347/--accent:#ff9f45/' style.css; git add .; git commit -q -m "Tweak colours on laptop 2"; git push -q origin main; cd ../site
run s6 git pull origin main
snap v4
sed -i 's#<p>Fresh coffee, brewed slowly.</p>#<p>Fresh coffee, brewed slowly. Open daily 8am to 6pm.</p>#' index.html
snap v5
run s8 git status --short
run s8 git add .
run s8 git commit -m "Update website"
run s8 git log --oneline --graph --decorate
cd ..; rm -rf Hello-World; (echo '$ git clone https://github.com/octocat/Hello-World.git'; git clone https://github.com/octocat/Hello-World.git 2>&1; echo '$ cd Hello-World'; echo '$ git log --oneline'; git -C Hello-World log --oneline; echo '$ ls'; ls Hello-World) > $T/s7_github.txt
git -C Hello-World log --format='%h|%an|%ad|%s' --date=short > $T/hw_log.txt; git -C Hello-World log -1 --format='%h|%s|%ad' --date=short -- README > $T/hw_readme.txt
