// Screenshot every mode / camera preset. Usage: node shots.mjs <outDir> [url] [q]
// Needs Playwright (global install is fine): NODE_PATH=$(npm root -g) node shots.mjs ...
import { createRequire } from "module"; const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const [out, url = "http://localhost:8765/index.html", q = ""] = process.argv.slice(2);
const H = "document.querySelectorAll('.panel,#hide').forEach(p=>p.style.display='none');";
const F = "window.__f50", set = (m, t = 14, after = "") => `${F}.setMode('${m}'); ${F}.setTime(${t}); ${after}`;
const cam = (a) => `setTimeout(()=>${F}.putCamera(${a}),800)`, camp = (a) => `${F}.putCamera(${a})`;
const eng = (flags) => `Object.assign(${F}.state,{struct:false,rebar:false,found:false,glass:false,rain:false,elev:false,${flags}}); ${F}.apply();`;
const ALL = ["elec", "water", "sewer", "fire", "ac", "sensors", "blinds"].map((k) => `${F}.state.${k}=true`).join(";");
const NONE = ["elec", "water", "sewer", "fire", "ac", "sensors", "blinds"].map((k) => `${F}.state.${k}=false`).join(";");
const STEPS = [
  ["01_tower_overview", H + set("tower", 15.5) + `setTimeout(()=>${F}.putCamera(...${F}.VT.over),800)`, 5000],
  ["02_tower_crown", camp(`...${F}.VT.crown`), 2500], ["03_tower_floor50", camp(`...${F}.VT.f50`), 2500], ["04_tower_street_arrival", camp(`...${F}.VT.arrival`), 2500],
  ["05_tower_sunset", `${F}.setTime(18.2); ${camp(`...${F}.VT.over`)}`, 3000], ["06_tower_night", `${F}.setTime(22); ${camp(`...${F}.VT.over`)}`, 3000],
  ["07_eng_concrete", `${F}.setTime(14);` + eng("struct:true") + camp(`...${F}.VT.struct`), 3500], ["08_eng_rebar", eng("struct:true,rebar:true"), 3000],
  ["09_eng_foundation", eng("found:true") + camp(`...${F}.VT.under`), 3500], ["10_eng_glass_layers", eng("glass:true") + camp(`...${F}.VT.facade`), 3500],
  ["11_eng_rain", eng("rain:true") + camp(`...${F}.VT.podium`), 3500], ["12_eng_elevators", eng("elev:true") + camp(`...${F}.VT.elev`), 3500],
  ["13_lobby_entrance", eng("") + set("lobby", 18.5, cam(`...${F}.VL.entrance`)), 5000], ["14_lobby_desk", camp(`...${F}.VL.desk`), 2500], ["15_lobby_lounge", camp(`...${F}.VL.lounge`), 2500],
  ["16_parking_cutaway", set("park", 14, cam("[170,120,-210],[5,-6,-12]")), 5000], ["17_parking_ramp", camp("[150,30,-190],[92,-4,-105]"), 2500], ["18_parking_b2", camp("[-62,-5.0,-44],[25,-6.8,-24]"), 2500],
  ["19_floor12_plan", set("office", 14, cam(`...${F}.VO.plan`)), 6000], ["20_floor12_overview", camp(`...${F}.VO.over`), 3000], ["21_floor12_medical", camp(`...${F}.VO.med`), 3000], ["22_floor12_trading", camp(`...${F}.VO.trade`), 3000],
  ["23_floor12_systems", ALL + `;${F}.apply();` + camp("[20,44,17],[20,0,14]"), 4500], ["24_floor12_systems_off", NONE + `;${F}.apply();`, 500],
  ["25_floor49_overview", set("floor", 15.5, cam(`...${F}.VIEWS.over`)), 6000], ["26_floor49_living", camp(`...${F}.VIEWS.living`), 2500], ["27_floor49_dubai_view", camp(`...${F}.VIEWS.dubai`), 2500], ["28_floor49_pool_day", camp(`...${F}.VIEWS.poolday`), 2500],
  ["29_floor49_systems", ALL.replace(/;?[a-z]+\.state\.(sensors|blinds)=true/g, "") + `;${F}.apply();` + camp(`...${F}.VIEWS.mep`), 4500], ["30_floor49_systems_off", NONE + `;${F}.apply();`, 500],
  ["31_floor50_plan", set("apts", 14, cam(`...${F}.VA.plan`)), 6000], ["32_floor50_overview", camp(`...${F}.VA.over`), 3000], ["33_floor50_3bedroom", camp(`...${F}.VA.br3`), 3000], ["34_floor50_2bedroom", camp(`...${F}.VA.br2`), 3000], ["35_floor50_1bedroom", camp(`...${F}.VA.br1`), 3000], ["36_floor50_lobby", `${F}.APTS.liftOpen(true);` + camp(`...${F}.VA.lobby`), 3000],
  ["37_floor50_pools_day", camp(`...${F}.VA.pools`), 3000], ["38_floor50_pools_night", `${F}.setTime(21.5);` + camp(`...${F}.VA.pools`), 3500], ["39_floor50_systems", `${F}.setTime(14);` + ALL + `;${F}.apply();` + camp("[17,40,15],[17,0,12]"), 5000], ["40_floor50_systems_off", NONE + `;${F}.apply();`, 500],
  ["41_lift_cabin", `${F}.startRide(50,12,'office'); setTimeout(()=>{${F}.RIDE.phase='run';${F}.RIDE.t=8},2500)`, 6000],
  ["42_ui_panels_tower", `${F}.RIDE.on=false; document.querySelectorAll('.panel,#hide').forEach(p=>p.style.display=''); document.getElementById('liftHud').style.display='';` + set("tower", 15.5, cam(`...${F}.VT.over`)), 6000],
  ["50_garden_aerial_day", set("tower", 13) + `setTimeout(()=>${F}.putCamera([0,95,-215],[0,0,-90]),800)`, 6000], ["51_entrance_day", camp("[-16,4,-78],[0,6,-28]"), 3000], ["52_fountain_day", camp("[16,3.6,-86],[0,3,-100]"), 3000], ["53_garden_low_day", camp("[85,10,-135],[-10,3,-100]"), 3000],
  ["54_driveway_arrival", camp("[-62,6,-100],[-10,3,-48]"), 3000], ["55_garden_golden", `${F}.setTime(17.6);` + camp("[0,70,-200],[0,0,-80]"), 3500], ["56_garden_blue", `${F}.setTime(18.7);` + camp("[16,3.6,-86],[0,3,-100]"), 3500], ["57_garden_night", `${F}.setTime(22);` + camp("[-16,4,-78],[0,6,-28]"), 3500], ["58_garden_aerial_night", camp("[0,95,-215],[0,0,-90]"), 3500],
  ...[2, 12, 22, 27, 40, 46, 56, 67, 75, 79].map((T, i) => [`${60 + i}_lux_t${String(T).padStart(2, "0")}`, `${F}.camera.near=0.3; ${F}.camera.updateProjectionMatrix(); ${F}.setTime(${(17.4 + 1.7 * 1 / 84).toFixed(3)}+1.7*${T}/84); { const r=${F}.LUX_EXT.at(${T}); ${F}.putCamera([r.pos.x,r.pos.y,r.pos.z],[r.tgt.x,r.tgt.y,r.tgt.z]); }`, i === 0 ? 4000 : 2500]),
  ...[["70_scene_day", 13], ["71_scene_golden", 17.6], ["72_scene_blue", 18.55], ["73_scene_night", 22]].map(([n, h]) => [n, `${F}.setTime(${h}); ${F}.camera.near=1; ${F}.putCamera([-60,34,-215],[0,12,-60])`, 3500]),
];
const b = await chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 1100, height: 620 } });
const errs = []; p.on("console", (m) => ["error", "warning"].includes(m.type()) && errs.push(m.type() + ": " + m.text().slice(0, 200))); p.on("pageerror", (e) => errs.push("PAGEERR " + e.message));
await p.goto(url + (q ? "?q=" + q : "")); await p.waitForFunction(() => window.__f50, null, { timeout: 90000 }); await p.waitForTimeout(3000);
if (!process.env.KEEP_PANELS) await p.evaluate(H);
const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
for (const [name, code, wait] of STEPS) { if (only && !only.test(name)) continue; try { await p.evaluate(code); await p.waitForTimeout(wait); await p.screenshot({ path: `${out}/${name}.png`, timeout: 240000 }); console.log("ok", name); } catch (e) { console.log("FAIL", name, String(e).slice(0, 120)); } }
console.log(errs.slice(0, 10).join("\n") || "no console errors"); await b.close();
