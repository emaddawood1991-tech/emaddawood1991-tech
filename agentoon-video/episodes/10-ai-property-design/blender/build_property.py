"""Original conceptual desert property for Agentoon.ai Ep 10. CONCEPT ONLY: not to scale, not an engineering design.
Run: python build_property.py  -> property.blend (collections: Land, V1_Blockout, V2_Partial, V3_Final, plus variant parts)
Units: metres. Plot 40 x 30 m, centred at origin, entrance side = -Y (south), house at north (+Y)."""
import bpy, math, random, bmesh
from mathutils import Vector, noise
random.seed(7)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
def coll(name):
    c = bpy.data.collections.new(name); sc.collection.children.link(c); return c
C = {n: coll(n) for n in ["Land","Fence","House","Pool","Paths","Gate","Trees","Marks","Rig"]}
def mat(name, col, rough=0.6, metal=0.0, emit=None, es=0.0, alpha=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*col, 1); b.inputs["Roughness"].default_value = rough; b.inputs["Metallic"].default_value = metal
    if emit: b.inputs["Emission Color"].default_value = (*emit, 1); b.inputs["Emission Strength"].default_value = es
    if alpha is not None: b.inputs["Alpha"].default_value = alpha
    return m
M = dict(sand=mat("Sand",(0.78,0.54,0.29),0.95), sand2=mat("SandDark",(0.5,0.34,0.2),0.95), wall=mat("WallWhite",(0.93,0.9,0.84),0.7),
 wood=mat("Wood",(0.35,0.2,0.1),0.5), roof=mat("Roof",(0.12,0.13,0.15),0.5), glass=mat("Glass",(0.35,0.55,0.7),0.05,0.0,alpha=0.35),
 water=mat("Water",(0.05,0.55,0.75),0.02,emit=(0.05,0.55,0.8),es=0.25), tile=mat("PoolTile",(0.8,0.92,0.95),0.3),
 paver=mat("Paver",(0.75,0.7,0.62),0.8), trunk=mat("Trunk",(0.3,0.2,0.12),0.9), frond=mat("Frond",(0.1,0.35,0.12),0.7),
 grass=mat("Grass",(0.15,0.4,0.15),0.9), fence=mat("Fence",(0.55,0.4,0.28),0.8), gate=mat("Gate",(0.08,0.09,0.1),0.4,0.6),
 warm=mat("Warm",(1,0.7,0.35),0.5,emit=(1,0.65,0.3),es=6), mark=mat("Mark",(0.38,0.8,1.0),0.5,emit=(0.38,0.8,1.0),es=2.5),
 dec=mat("Deck",(0.6,0.45,0.3),0.6), pot=mat("Planter",(0.7,0.4,0.25),0.8))
def link(o, c):
    for k in o.users_collection: k.objects.unlink(o)
    c.objects.link(o); return o
def box(name, c, loc, size, m, rot=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.object; o.name = name
    o.scale = size; o.rotation_euler[2] = math.radians(rot); o.data.materials.append(m); return link(o, c)
def cyl(name, c, loc, r, h, m, verts=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=loc); o = bpy.context.object; o.name = name
    o.data.materials.append(m); return link(o, c)
# ---------- terrain ----------
N = 372; S = 1004.0
bpy.ops.mesh.primitive_grid_add(x_subdivisions=N, y_subdivisions=N, size=S); g = bpy.context.object; g.name = "Terrain"
g.data.materials.append(M["sand"]); link(g, C["Land"])
for v in g.data.vertices:
    x, y = v.co.x, v.co.y
    d = max(abs(x)-30, abs(y)-24, 0)       # flat inside/near the plot
    f = min(1.0, d/60.0); f = f*f*(3-2*f)
    h = noise.noise(Vector((x*0.012, y*0.012, 1.3)))*9 + noise.noise(Vector((x*0.05, y*0.05, 4.1)))*1.6 + noise.noise(Vector((x*0.3,y*0.3,2)))*0.08
    rr = math.hypot(x, y); far = max(0, (rr-180)/200); h += min(20.0, far*far*28); h += min(34.0, 10.0*(max(0, rr-380)/150)**1.4)
    v.co.z = h*f - (1-f)*0.0
g.data.update(); bpy.ops.object.shade_smooth()
# ---------- plot boundary ----------
W, D = 20.0, 15.0
def fence_run(p0, p1, tag):
    L = (Vector(p1)-Vector(p0)).length; mid = (Vector(p0)+Vector(p1))/2
    ang = math.degrees(math.atan2(p1[1]-p0[1], p1[0]-p0[0]))
    box(f"Fence_{tag}", C["Fence"], (mid.x, mid.y, 0.9), (L, 0.18, 1.8), M["fence"], ang)
gx0, gx1 = -12.0, -8.0                      # gate opening on the south side
fence_run((-W,-D),(gx0,-D),"S1"); fence_run((gx1,-D),(W,-D),"S2"); fence_run((W,-D),(W,D),"E"); fence_run((W,D),(-W,D),"N"); fence_run((-W,D),(-W,-D),"W")
for i,(px,py) in enumerate([(-W,-D),(W,-D),(W,D),(-W,D)]): box(f"Post{i}", C["Fence"], (px,py,1.1), (0.4,0.4,2.2), M["wall"])
# ---------- gate ----------
for s in (gx0, gx1): box(f"GatePost{s}", C["Gate"], (s,-D,1.3), (0.5,0.5,2.6), M["wall"])
box("GateLeaf1", C["Gate"], (gx0+1,-D,1.0), (1.9,0.1,1.8), M["gate"]); box("GateLeaf2", C["Gate"], (gx1-1,-D,1.0), (1.9,0.1,1.8), M["gate"])
box("GateLamp1", C["Gate"], (gx0,-D,2.7), (0.3,0.3,0.25), M["warm"]); box("GateLamp2", C["Gate"], (gx1,-D,2.7), (0.3,0.3,0.25), M["warm"])
# ---------- house (modern single-storey, L-shaped) ----------
hx, hy = 0.0, 5.0
box("Slab", C["House"], (hx,hy,0.15), (18,8.5,0.3), M["paver"])
box("Living", C["House"], (hx-2.5,hy,1.8), (13,7.5,3.0), M["wall"])
box("Wing", C["House"], (hx+6.5,hy+0.5,1.65), (5,6.5,2.7), M["wall"])
box("Roof1", C["House"], (hx-2.5,hy,3.45), (14.2,8.6,0.3), M["roof"])
box("Roof2", C["House"], (hx+6.5,hy+0.5,3.15), (6,7.6,0.3), M["roof"])
box("Glass_South", C["House"], (hx-3.0,hy-3.78,1.8), (9,0.1,2.5), M["glass"])
box("Glass_Wing", C["House"], (hx+6.5,hy-2.78,1.6), (3.2,0.1,2.2), M["glass"])
box("Door", C["House"], (hx+3.4,hy-3.8,1.2), (1.4,0.12,2.2), M["wood"])
box("Porch", C["House"], (hx+3.4,hy-4.6,0.2), (3.0,2.0,0.2), M["dec"])
box("LivingGlow", C["House"], (hx-3.0,hy-3.0,1.7), (8.6,0.2,2.3), M["warm"])
# ---------- variant-dependent pieces ----------
POOLS = {"V1": (-6.0, -4.5), "V2": (7.5, -4.5), "V3": (7.5, -4.5)}
def pool(tag, cx, cy, c):
    box(f"PoolDeck_{tag}", c, (cx,cy,0.05), (9.0,5.4,0.1), M["dec"])
    box(f"PoolRim_{tag}", c, (cx,cy,0.12), (7.2,3.6,0.14), M["tile"])
    box(f"PoolWater_{tag}", c, (cx,cy,0.2), (6.8,3.2,0.06), M["water"])
def path(tag, pts, w, c, m=None):
    for i in range(len(pts)-1):
        p0, p1 = Vector(pts[i]), Vector(pts[i+1]); mid=(p0+p1)/2; L=(p1-p0).length
        ang = math.degrees(math.atan2(p1.y-p0.y, p1.x-p0.x))
        box(f"{tag}_{i}", c, (mid.x,mid.y,0.04+i*0.006), (L+w*0.3,w,0.08), m or M["paver"], ang)
def palm(name, x, y, c, h=5.0, lean=0.12, seed=0):
    r = random.Random(seed); ang = r.uniform(0, 6.28)
    segs = 6; pos = Vector((x,y,0)); parts = []
    for i in range(segs):
        sh = h/segs; bend = lean*(i+1)
        d = Vector((math.cos(ang)*bend*0.35, math.sin(ang)*bend*0.35, 1)).normalized()
        o = cyl(f"{name}_t{i}", c, pos + d*sh/2, 0.22 - i*0.02, sh*1.05, M["trunk"], 10)
        o.rotation_euler = d.to_track_quat('Z','Y').to_euler(); pos = pos + d*sh; parts.append(o)
    for k in range(10):
        a = k*math.tau/10 + r.uniform(-.2,.2)
        bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.45, radius2=0.02, depth=3.3, location=(0,0,0)); f = bpy.context.object
        f.scale = (1, 0.25, 1); f.data.materials.append(M["frond"]); f.name=f"{name}_f{k}"
        f.rotation_euler = (math.radians(100+r.uniform(-8,12)), 0, 0)   # tip points outward/droops
        bpy.ops.object.transform_apply(rotation=True, scale=True)
        f.location = pos + Vector((math.cos(a)*1.6, math.sin(a)*1.6, -0.2))
        f.rotation_euler = (0, 0, a - math.pi/2)
        link(f, c)
def shrub(name, x, y, c, s=0.8, m=None):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=s, location=(x,y,s*0.6)); o=bpy.context.object; o.scale=(1.3,1.3,0.8); o.name=name
    o.data.materials.append(m or M["grass"]); bpy.ops.object.shade_smooth(); link(o,c)
# V1: blockout (plain grey massing + marks), V2: partial (pool A, driveway, first trees), V3: final (pool moved, landscaping, path, extra trees)
# Driveway + gate path (shared)
path("Driveway", [(-10,-D),(-10,-9),(-4,-6.5),(3.4,-6.2)], 3.2, C["Paths"])
# Pool in 3 variants
pool("V1", *POOLS["V1"], C["Pool"]); pool("V2", *POOLS["V2"], C["Pool"])
pool("V3", *POOLS["V3"], C["Pool"])
# Trees / landscape per stage (collections created per stage for visibility switching)
for n in ("S_Partial","S_Final","S_Iter1","S_Garden","Stakes"): coll(n)
cp, cf = bpy.data.collections["S_Partial"], bpy.data.collections["S_Final"]
palm("PalmA", -14, -9, cp, 5.5, .14, 1); palm("PalmB", -14, 2, cp, 6.2, .1, 2)
palm("PalmC", 15, -10, cf, 5.0, .15, 3); palm("PalmD", 15, 9, cf, 6.5, .12, 4); palm("PalmE", 3, 12, cf, 5.8, .1, 5); palm("PalmF", -9, 11.5, cf, 6.0, .13, 6)
palm("PalmG", 12.5, -9, cf, 5.2, .1, 8); palm("PalmH", -16, -12, cf, 4.6, .16, 9)
for i,(sx,sy) in enumerate([(-7,-10.5),(-12,-3),(1,-9.5),(10,-11),(17,-2),(-5,-8.2),(6,-8.5)]): shrub(f"Shrub{i}", sx, sy, cf, 0.7+0.15*(i%3))
# garden layer (version 4): lawn, stepping path, pergola over the porch, loungers on the pool deck, planter pots
cg = bpy.data.collections["S_Garden"]
box("Lawn", cg, (-7,-10.2,0.02), (8,3.2,0.05), M["grass"])
path("Garden", [(3.4,-6.4),(8,-8.5),(12,-9),(14,-9)], 1.4, cg)
path("PoolWalk", [(3.4,-6.1),(5.5,-6.1)], 1.4, cg)
for px_ in (1.9, 4.9):
    for py_ in (-5.4, -3.9): box(f"PergolaPost{px_}{py_}", cg, (px_,py_,1.3), (0.16,0.16,2.6), M["wood"])
for i in range(7): box(f"PergolaSlat{i}", cg, (3.4,-4.65,2.65), (3.5,0.12,0.12), M["wood"]).location.y = -5.4 + i*0.25
box("PergolaBeam1", cg, (3.4,-5.4,2.7), (3.5,0.15,0.18), M["wood"]); box("PergolaBeam2", cg, (3.4,-3.9,2.7), (3.5,0.15,0.18), M["wood"])
for i,lx in enumerate((5.5, 7.5, 9.5)):
    box(f"Lounger{i}", cg, (lx,-1.7,0.4), (0.8,2.0,0.25), M["wall"]); box(f"LoungerBack{i}", cg, (lx,-0.8,0.65), (0.8,0.12,0.6), M["wall"])
for i,(qx,qy) in enumerate([(-3.5,-3.3),(1.0,-3.3),(10.5,-3.0)]):
    cyl(f"Pot{i}", cg, (qx,qy,0.35), 0.35, 0.7, M["pot"], 16); shrub(f"PotPlant{i}", qx, qy+0.0, cg, 0.35)
# survey stakes at the four plot corners (visible in the empty and blockout stages)
cs = bpy.data.collections["Stakes"]
red = mat("StakeRed",(0.9,0.12,0.08),0.5)
for i,(qx,qy) in enumerate([(-W,-D),(W,-D),(W,D),(-W,D)]):
    cyl(f"Stake{i}", cs, (qx,qy,0.6), 0.05, 1.2, M["wood"], 8); box(f"StakeFlag{i}", cs, (qx+0.2,qy,1.05), (0.4,0.02,0.3), red)
# ---------- blockout massing (V1 look: simple clay boxes) ----------
clay = mat("Clay",(0.72,0.74,0.78),0.9)
cb = bpy.data.collections["S_Iter1"]
box("Block_House", cb, (hx-2.5,hy,1.6), (13,7.5,3.2), clay); box("Block_Wing", cb, (hx+6.5,hy+0.5,1.4), (5,6.5,2.8), clay)
box("Block_Pool", cb, (*POOLS["V1"],0.1), (7,3.6,0.2), clay)
# ---------- label markers (cyan flags used in the plan overlay) ----------
for nm,(mx,my) in {"House":(-2.5,5),"Pool":POOLS["V3"],"Entrance":(-10,-D+0.2),"Garden":(-7,-10.2)}.items():
    o = cyl(f"Mark_{nm}", C["Marks"], (mx,my,7.5), 0.15, 0.2, M["mark"]); o.hide_render = True
# ---------- sky + lights ----------
w = bpy.data.worlds.new("W"); sc.world = w; w.use_nodes = True
nt = w.node_tree; nt.nodes.clear()
sky = nt.nodes.new("ShaderNodeTexSky"); bg = nt.nodes.new("ShaderNodeBackground"); out = nt.nodes.new("ShaderNodeOutputWorld")
try:
    sky.sky_type = "MULTIPLE_SCATTERING"
except Exception:
    try: sky.sky_type = "NISHITA"
    except Exception: pass
sky.sun_disc = False; sky.sun_elevation = math.radians(28); sky.sun_rotation = math.radians(215)
nt.links.new(sky.outputs[0], bg.inputs[0]); nt.links.new(bg.outputs[0], out.inputs[0]); bg.inputs[1].default_value = 0.12
bpy.ops.object.light_add(type='SUN', location=(0,0,50)); sun = bpy.context.object; sun.name="Sun"
sun.rotation_euler = (math.radians(62), 0, math.radians(35)); sun.data.energy = 3.0; sun.data.angle = math.radians(1.2); link(sun, C["Rig"])
# ---------- cameras ----------
def cam(name, loc, target, lens=28):
    bpy.ops.object.camera_add(location=loc); c = bpy.context.object; c.name = name; c.data.lens = lens
    c.data.clip_end = 2000
    d = Vector(target) - Vector(loc); c.rotation_euler = d.to_track_quat('-Z','Y').to_euler(); link(c, C["Rig"]); return c
cam("Cam_Aerial", (-52, -62, 48), (0,0,0), 30)
cam("Cam_Top", (0, 0, 78), (0, 0.001, 0), 34)
cam("Cam_Hero", (-20, -56, 22), (0, 1, 1), 25)
cam("Cam_Front", (-12, -42, 6), (0, 4, 2), 28)
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
sc.render.resolution_x, sc.render.resolution_y = 1080, 1920
sc.view_settings.view_transform = 'Standard'; sc.view_settings.exposure = -0.3; sc.view_settings.look = 'None'
bpy.ops.wm.save_as_mainfile(filepath=__file__.replace("build_property.py","property.blend"))
print("saved", len(bpy.data.objects), "objects")
