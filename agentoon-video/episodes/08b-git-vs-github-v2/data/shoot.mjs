import {createRequire} from "module"; const pw=createRequire("/tmp/pw/")("playwright");
const b=await pw.chromium.launch(); const p=await b.newPage({viewport:{width:480,height:520},deviceScaleFactor:2});
for (const v of ["v1","v2","v3","v4","v5"]) { await p.goto("file:///tmp/ep9/work/snap/"+v+"/index.html"); await p.screenshot({path:"/tmp/ep9/shots/site-"+v+".png"}); }
await p.goto("file:///tmp/ep9/work/site_s4/index.html"); await p.screenshot({path:"/tmp/ep9/shots/site-recovered.png"});
await b.close();
