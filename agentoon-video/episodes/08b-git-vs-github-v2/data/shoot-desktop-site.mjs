import {createRequire} from "module"; const pw=createRequire("/tmp/pw/")("playwright");
const b=await pw.chromium.launch(); const p=await b.newPage({viewport:{width:720,height:500},deviceScaleFactor:2});
const W="/tmp/ep9/work/"; const out=process.argv[2];
for (const [n,dir] of [["v1","snap/v1"],["v2","snap/v2"],["v3","snap/v3"],["v5","snap/v5"],["recovered","site_s4"]]) { await p.goto("file://"+W+dir+"/index.html"); await p.screenshot({path:out+"/desk-site-"+n+".png"}); }
await b.close();
