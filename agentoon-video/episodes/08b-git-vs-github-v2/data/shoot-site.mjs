import {createRequire} from "module"; import fs from "fs"; const pw=createRequire("/tmp/pw/")("playwright");
const W="/tmp/ep11/work/", out="/tmp/ep11/shots"; fs.mkdirSync(out,{recursive:true});
const b=await pw.chromium.launch(); const p=await b.newPage({viewport:{width:720,height:480},deviceScaleFactor:2});
const regions={};
for (const [n,dir] of [["v1","snap/v1"],["v2","snap/v2"],["v3","snap/v3"],["v4","snap/v4"],["v5","snap/v5"],["recovered","site_s4"]]) {
  await p.goto("file://"+W+dir+"/index.html"); await p.screenshot({path:out+"/site-"+n+".png"});
  regions[n]=await p.evaluate(()=>{const r=s=>{const e=document.querySelector(s); if(!e) return null; const b=e.getBoundingClientRect(); return [Math.round(b.left),Math.round(b.top),Math.round(b.width),Math.round(b.height)]}; return {h1:r("h1"),cards:r(".cards"),btn:r(".btn"),nav:r("ul"),p:r("p")}});
}
fs.writeFileSync(out+"/regions.json",JSON.stringify(regions)); await b.close();
