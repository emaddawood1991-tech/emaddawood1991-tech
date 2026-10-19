import React, {useEffect, useMemo, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import * as THREE from 'three';
import {DIM, sx, type ArmPose, type DoctorPose, type HandShape, type Side} from './skeleton';

const C = {
  skin: '#d9a07b', skinDark: '#c88d68', coat: '#f3f5f7', scrubs: '#17335a', hair: '#2b180e', lips: '#b8685d', teeth: '#f7f3ea', tongue: '#c4606a',
  mouth: '#2a0d0f', iris: '#5a3a22', shoe: '#f4f4f2', steth: '#1c2026', silver: '#bfc8d2',
};

const mat = (color: string, rough = 0.7, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => (
  <meshStandardMaterial color={color} roughness={rough} metalness={0} {...extra} />
);

const Capsule: React.FC<{r: number; len: number; color: string; rough?: number; rotation?: [number, number, number]; position?: [number, number, number]}> = ({r, len, color, rough = 0.7, rotation, position}) => (
  <mesh rotation={rotation} position={position}>
    <capsuleGeometry args={[r, Math.max(0.001, len - 2 * r), 8, 20]} />
    {mat(color, rough)}
  </mesh>
);

// ---------- head shaping ----------
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const taper = (v: number) => 1 - 0.2 * smooth(-0.1, -1.0, v); // jaw narrows toward the chin
/** Position on the head surface (unit head space) for a given x,y — used to place features. */
export const headSurface = (x: number, y: number): V => {
  const v = y / 1.04;
  const t = taper(v);
  const u = x / (0.95 * t);
  const w = Math.sqrt(Math.max(0, 1 - u * u - v * v));
  return [x, y, w * (1 - 0.04 * smooth(-0.3, -0.95, v)) * 0.98];
};
type V = [number, number, number];

const buildHeadGeometry = (radius = 1, keep?: (n: THREE.Vector3) => boolean, w = 64, h = 48) => {
  const g = new THREE.SphereGeometry(radius, w, h);
  const pos = g.getAttribute('position');
  const v3 = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v3.fromBufferAttribute(pos, i);
    const n = v3.clone().normalize();
    const t = taper(n.y);
    const chin = smooth(-0.55, -0.98, n.y);
    v3.set(v3.x * 0.95 * t * (1 - 0.16 * chin), v3.y * 1.04, v3.z * (1 - 0.04 * smooth(-0.3, -0.95, n.y)) * 0.98 + 0.13 * chin * Math.max(0, n.z));
    pos.setXYZ(i, v3.x, v3.y, v3.z);
  }
  g.computeVertexNormals();
  if (!keep) return g;
  // filter triangles by their (unit-space) normal at the centroid
  const idx = g.getIndex()!;
  const out: number[] = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const nrm = g.getAttribute('normal');
  for (let i = 0; i < idx.count; i += 3) {
    const ia = idx.getX(i), ib = idx.getX(i + 1), ic = idx.getX(i + 2);
    a.fromBufferAttribute(pos, ia); b.fromBufferAttribute(pos, ib); c.fromBufferAttribute(pos, ic);
    const cen = a.add(b).add(c).multiplyScalar(1 / 3);
    const n = new THREE.Vector3(cen.x / 0.95, cen.y / 1.04, cen.z).normalize();
    if (keep(n)) out.push(ia, ib, ic);
  }
  g.setIndex(out);
  void nrm;
  return g;
};

const maskTexture = (fn: (x: number, y: number, z: number) => number, jitter = 0.05) => {
  const W = 512, H = 256;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let py = 0; py < H; py++) {
    const th = (py / H) * Math.PI;
    for (let px = 0; px < W; px++) {
      const ph = (px / W) * Math.PI * 2;
      const x = -Math.cos(ph) * Math.sin(th), y = Math.cos(th), z = Math.sin(ph) * Math.sin(th);
      const v = Math.max(0, Math.min(1, fn(x, y, z) + (rnd() - 0.5) * jitter));
      const i = (py * W + px) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.round(v * 255); // three.js alphaMap reads the GREEN channel
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  return t;
};
/** Short, neatly styled hair: clean forehead line, tight temples, short sides and back. Face is completely clean-shaven. */
const hairMask = (x: number, y: number, z: number) => {
  const front = smooth(-0.1, 0.6, z);
  const thr = -0.12 * (1 - front) + 0.56 * front - 0.2 * smooth(0.6, 0.92, Math.abs(x)) * front + 0.06 * smooth(0.2, 0.7, Math.abs(x)) * front * 0;
  const sideLift = smooth(0.75, 0.97, Math.abs(x)) * 0.12; // ear area stays clear
  return smooth(thr + sideLift - 0.03, thr + sideLift + 0.05, y) * smooth(-0.55, -0.25, y + 0.0 * z);
};

const HeadShape: React.FC = () => {
  const skin = useMemo(() => buildHeadGeometry(1), []);
  const hair = useMemo(() => buildHeadGeometry(1.055, undefined, 72, 56), []);
  const hairMap = useMemo(() => maskTexture(hairMask, 0.22), []);
  return (
    <>
      <mesh geometry={skin}>{mat(C.skin, 0.55)}</mesh>
      <mesh geometry={hair}>
        <meshStandardMaterial color={C.hair} roughness={0.42} alphaMap={hairMap} transparent alphaTest={0.5} side={THREE.DoubleSide} />
      </mesh>
      {/* side-swept top: low, tidy volume (no big quiff) */}
      <mesh position={[0.1, 0.8, 0.34]} scale={[0.6, 0.17, 0.5]} rotation={[0.35, 0, -0.28]}>
        <sphereGeometry args={[1, 28, 16]} />
        {mat(C.hair, 0.42)}
      </mesh>
      <mesh position={[-0.2, 0.74, 0.4]} scale={[0.4, 0.14, 0.4]} rotation={[0.4, 0, 0.35]}>
        <sphereGeometry args={[1, 24, 14]} />
        {mat(C.hair, 0.42)}
      </mesh>
    </>
  );
};

const Eye: React.FC<{side: Side; lookX: number; lookY: number; open: number}> = ({side, lookX, lookY, open}) => {
  const s = sx(side);
  const p = headSurface(s * 0.37, 0.13);
  const upperRot = -1.55 + (1 - open) * 1.35; // 0 open  -> lid down
  const lowerRot = 1.55 - (1 - open) * 0.7;
  return (
    <group position={[p[0], p[1], p[2] - 0.075]}>
      <mesh scale={[1, 1, 0.8]}>
        <sphereGeometry args={[0.148, 28, 20]} />
        {mat('#fbfaf8', 0.35)}
      </mesh>
      <group rotation={[-lookY, lookX, 0]}>
        <mesh position={[0, 0, 0.128]} rotation={[0, 0, 0]}>
          <circleGeometry args={[0.088, 28]} />
          {mat(C.iris, 0.3)}
        </mesh>
        <mesh position={[0, 0, 0.1285]}>
          <circleGeometry args={[0.048, 24]} />
          {mat('#0b0705', 0.2)}
        </mesh>
        <mesh position={[0.034, 0.04, 0.13]}>
          <circleGeometry args={[0.022, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
      <mesh rotation={[upperRot, 0, 0]} scale={[1, 1, 0.86]}>
        <sphereGeometry args={[0.156, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        {mat(C.skin, 0.62, {side: THREE.DoubleSide})}
      </mesh>
      <mesh rotation={[lowerRot, 0, 0]} scale={[1, 1, 0.86]}>
        <sphereGeometry args={[0.156, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        {mat(C.skin, 0.62, {side: THREE.DoubleSide})}
      </mesh>
    </group>
  );
};

const Brow: React.FC<{side: Side; raise: number; furrow: number}> = ({side, raise, furrow}) => {
  const s = sx(side);
  const p = headSurface(s * 0.4, 0.42 + raise * 0.07);
  const curve = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(-0.2, -0.01, 0), new THREE.Vector3(-0.05, 0.035, 0.01), new THREE.Vector3(0.1, 0.03, 0.0), new THREE.Vector3(0.22, -0.02, -0.02)]), []);
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 20, 0.032, 8), [curve]);
  // inner end (towards the nose) lowers with furrow
  return (
    <group position={[p[0], p[1], p[2] + 0.005]} rotation={[-0.15, s * -0.25, s * (-0.12 + 0.34 * furrow - 0.1 * raise)]} scale={[s, 1, 1]}>
      <mesh geometry={geo}>{mat(C.hair, 0.7)}</mesh>
    </group>
  );
};

const Mouth: React.FC<{o: number; w: number; smile: number}> = ({o, w, smile}) => {
  const jaw = o * 0.3;
  const base = headSurface(0, -0.5);
  const z = base[2];
  const lipHalf = (s: number, upper: boolean) => (
    <group rotation={[0, 0, s * (smile * 0.42 - (upper ? 0 : 0.05 * smile))]} position={[0, 0, 0]}>
      <mesh position={[s * 0.1 * w, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, upper ? 0.9 : 1]}>
        <capsuleGeometry args={[upper ? 0.036 : 0.043, 0.17 * w, 6, 14]} />
        {mat(C.lips, 0.45)}
      </mesh>
    </group>
  );
  return (
    <>
      {/* mouth cavity (static, behind the lips) */}
      <mesh position={[0, -0.5, z - 0.05]} scale={[0.19 * w, 0.06 + 0.16 * o, 0.07]}>
        <sphereGeometry args={[1, 20, 14]} />
        {mat(C.mouth, 0.9)}
      </mesh>
      {/* upper lip + teeth (static) */}
      <group position={[0, -0.455, z + 0.01]}>
        {lipHalf(1, true)}
        {lipHalf(-1, true)}
        <mesh position={[0, -0.03, -0.015]} scale={[0.15 * w, 0.032, 0.025]}>
          <boxGeometry args={[1, 1, 1]} />
          {mat(C.teeth, 0.4)}
        </mesh>
      </group>
      {/* jaw: lower lip, lower teeth, tongue, goatee */}
      <group position={[0, -0.12, 0.0]} rotation={[jaw, 0, 0]}>
        <group position={[0, -0.38, z + 0.012]}>
          {lipHalf(1, false)}
          {lipHalf(-1, false)}
          <mesh position={[0, 0.032, -0.02]} scale={[0.13 * w, 0.022, 0.02]}>
            <boxGeometry args={[1, 1, 1]} />
            {mat(C.teeth, 0.4)}
          </mesh>
          <mesh position={[0, 0.06, -0.05]} scale={[0.1 * w, 0.025 + 0.02 * o, 0.05]}>
            <sphereGeometry args={[1, 14, 10]} />
            {mat(C.tongue, 0.6)}
          </mesh>
        </group>
      </group>
    </>
  );
};


const Head: React.FC<{pose: DoctorPose}> = ({pose}) => {
  const f = pose.face;
  const open = Math.min(1.1, f.eyeOpen) * (1 - f.blink);
  const nose = headSurface(0, -0.14);
  return (
    <group scale={0.146}>
      <HeadShape />
      {[-1, 1].map((s) => {
        const e = headSurface(s * 0.97, -0.05);
        return (
          <mesh key={s} position={[e[0] * 0.995, -0.05, -0.04]} scale={[0.3, 0.95, 0.65]} rotation={[0, 0, s * 0.1]}>
            <sphereGeometry args={[0.2, 18, 14]} />
            {mat(C.skin, 0.62)}
          </mesh>
        );
      })}
      {/* nose */}
      <mesh position={[0, nose[1] + 0.0, nose[2] + 0.03]} scale={[0.82, 1.15, 0.95]}>
        <sphereGeometry args={[0.105, 24, 18]} />
        {mat(C.skin, 0.55)}
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 0.075, nose[1] - 0.07, nose[2] + 0.015]} scale={[0.9, 0.7, 0.8]}>
          <sphereGeometry args={[0.05, 14, 10]} />
          {mat(C.skinDark, 0.6)}
        </mesh>
      ))}
      <Eye side="L" lookX={f.lookX} lookY={f.lookY} open={open} />
      <Eye side="R" lookX={f.lookX} lookY={f.lookY} open={open} />
      <Brow side="L" raise={f.brow} furrow={f.furrow} />
      <Brow side="R" raise={f.brow} furrow={f.furrow} />
      <Mouth o={f.mouthO} w={f.mouthW} smile={f.smile} />
    </group>
  );
};

// ---------- hands ----------
const Finger: React.FC<{x: number; len: number[]; curl: number; r: number; splay?: number}> = ({x, len, curl, r, splay = 0}) => {
  const a1 = -curl * 1.25, a2 = -curl * 1.35, a3 = -curl * 0.9;
  return (
    <group position={[x, -0.088, 0]} rotation={[0, 0, splay]}>
      <group rotation={[a1, 0, 0]}>
        <Capsule r={r} len={len[0]} color={C.skin} position={[0, -len[0] / 2, 0]} />
        <group position={[0, -len[0], 0]} rotation={[a2, 0, 0]}>
          <Capsule r={r * 0.94} len={len[1]} color={C.skin} position={[0, -len[1] / 2, 0]} />
          <group position={[0, -len[1], 0]} rotation={[a3, 0, 0]}>
            <Capsule r={r * 0.88} len={len[2]} color={C.skin} position={[0, -len[2] / 2, 0]} />
          </group>
        </group>
      </group>
    </group>
  );
};

const Hand: React.FC<{side: Side; shape: HandShape}> = ({side, shape}) => {
  const s = sx(side);
  const lens: number[][] = [[0.035, 0.028, 0.024], [0.04, 0.03, 0.025], [0.043, 0.032, 0.026], [0.04, 0.03, 0.024], [0.033, 0.024, 0.021]];
  return (
    <group>
      <mesh position={[0, -0.05, 0]} scale={[1, 1, 0.55]}>
        <sphereGeometry args={[0.04, 18, 14]} />
        <meshStandardMaterial color={C.skin} roughness={0.62} />
      </mesh>
      <mesh position={[0, -0.075, 0]} scale={[0.95, 1.1, 0.5]}>
        <sphereGeometry args={[0.04, 18, 14]} />
        <meshStandardMaterial color={C.skin} roughness={0.62} />
      </mesh>
      {[1, 2, 3, 4].map((i) => (
        <Finger key={i} x={(-s) * (0.027 - (i - 1) * 0.0165) + 0} len={lens[i]} curl={shape.curl[i]} r={0.0115 - (i === 4 ? 0.0015 : 0)} splay={(-s) * -(i - 2.5) * shape.spread * 0.4} />
      ))}
      {/* thumb */}
      <group position={[s * 0.035 * -1 * -1 * 0 - s * 0.036 * -1, -0.05, 0.012]} rotation={[0, 0, (-s * -1) * (0.35 + shape.spread) * -1]}>
        <group rotation={[-shape.curl[0] * 0.9, 0, 0]}>
          <Capsule r={0.0125} len={lens[0][0] + 0.012} color={C.skin} position={[0, -0.02, 0]} />
          <group position={[0, -0.04, 0]} rotation={[-shape.curl[0] * 0.8, 0, 0]}>
            <Capsule r={0.0115} len={lens[0][1] + 0.01} color={C.skin} position={[0, -0.016, 0]} />
          </group>
        </group>
      </group>
    </group>
  );
};

const Arm: React.FC<{side: Side; arm: ArmPose; hold?: DoctorPose['hold']}> = ({side, arm, hold}) => {
  const s = sx(side);
  return (
    <group position={arm.sh} quaternion={arm.upper}>
      <mesh>
        <sphereGeometry args={[0.056, 20, 16]} />
        {mat(C.coat, 0.85)}
      </mesh>
      <Capsule r={0.05} len={DIM.upperArm + 0.02} color={C.coat} rough={0.85} position={[0, -DIM.upperArm / 2, 0]} />
      <group position={[0, -DIM.upperArm, 0]} quaternion={arm.fore}>
        <mesh>
          <sphereGeometry args={[0.046, 18, 14]} />
          {mat(C.coat, 0.85)}
        </mesh>
        <Capsule r={0.043} len={DIM.foreArm + 0.02} color={C.coat} rough={0.85} position={[0, -DIM.foreArm / 2, 0]} />
        <mesh position={[0, -DIM.foreArm + 0.012, 0]}>
          <cylinderGeometry args={[0.046, 0.046, 0.03, 20]} />
          {mat(C.scrubs, 0.8)}
        </mesh>
        <group position={[0, -DIM.foreArm - 0.005, 0]} quaternion={arm.hand}>
          <mesh position={[0, 0.0, 0]}>
            <cylinderGeometry args={[0.024, 0.028, 0.04, 14]} />
            {mat(C.skin, 0.62)}
          </mesh>
          <group scale={1.12}><Hand side={side} shape={arm.shape} /></group>
          {hold && hold.side === side && hold.amount > 0.01 && (
            // a plain cup (cylinder) held across the palm; sags with `tilt`
            <group position={[0, -0.075, 0.05]} rotation={[0, 0, hold.tilt]} scale={1.35 * hold.amount}>
              <mesh><cylinderGeometry args={[0.034, 0.03, 0.085, 28, 1, true]} /><meshStandardMaterial color="#e9eef3" roughness={0.35} side={THREE.DoubleSide} /></mesh>
              <mesh position={[0, -0.04, 0]}><cylinderGeometry args={[0.03, 0.03, 0.004, 28]} /><meshStandardMaterial color="#e9eef3" roughness={0.35} /></mesh>
              <mesh position={[0, 0.036, 0]}><cylinderGeometry args={[0.031, 0.031, 0.01, 28]} /><meshStandardMaterial color="#2a7fa8" roughness={0.4} /></mesh>
            </group>
          )}
        </group>
      </group>
    </group>
  );
};

const Leg: React.FC<{side: Side; leg: DoctorPose['legs']['L']}> = ({side, leg}) => {
  const s = sx(side);
  return (
    <group position={[s * DIM.hipX, 0, 0]} quaternion={leg.thigh}>
      <mesh position={[0, -DIM.thigh / 2, 0]}>
        <cylinderGeometry args={[0.083, 0.064, DIM.thigh, 24]} />
        {mat(C.scrubs, 0.85)}
      </mesh>
      <mesh>
        <sphereGeometry args={[0.083, 20, 16]} />
        {mat(C.scrubs, 0.85)}
      </mesh>
      <group position={[0, -DIM.thigh, 0]} quaternion={leg.shin}>
        <mesh>
          <sphereGeometry args={[0.064, 18, 14]} />
          {mat(C.scrubs, 0.85)}
        </mesh>
        <mesh position={[0, -DIM.shin / 2, 0]}>
          <cylinderGeometry args={[0.062, 0.046, DIM.shin, 24]} />
          {mat(C.scrubs, 0.85)}
        </mesh>
        <group position={[0, -DIM.shin, 0]} rotation={[leg.footPitch, 0, 0]}>
          <mesh position={[0, -0.03, 0.05]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.75]}>
            <capsuleGeometry args={[0.05, 0.14, 8, 16]} />
            {mat(C.shoe, 0.55)}
          </mesh>
        </group>
      </group>
    </group>
  );
};

// ---------- torso ----------
const coatProfile = [[0.001, 0.548], [0.09, 0.542], [0.16, 0.51], [0.195, 0.45], [0.205, 0.37], [0.192, 0.24], [0.176, 0.09], [0.18, -0.04], [0.206, -0.17], [0.226, -0.29], [0.236, -0.37]].map(([r, y]) => new THREE.Vector2(r, y));

const useTexture = (url: string) => {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [h] = useState(() => delayRender(`tex-${url}`, {timeoutInMilliseconds: 60000}));
  useEffect(() => {
    new THREE.TextureLoader().load(url, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      setTex(t);
      continueRender(h);
    }, undefined, () => {
      throw new Error(`texture failed: ${url}`);
    });
  }, [url, h]);
  return tex;
};

const glowTexture = (() => {
  let t: THREE.CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, 'rgba(255,70,60,0.95)');
    grad.addColorStop(0.5, 'rgba(255,60,50,0.45)');
    grad.addColorStop(1, 'rgba(255,60,50,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
    t = new THREE.CanvasTexture(c);
    return t;
  };
})();

const Torso: React.FC<{pose: DoctorPose; time: number}> = ({pose, time}) => {
  const logo = useTexture(staticFile('logo/fmc-original-logo.png'));
  const steth = useMemo(
    () => [1, -1].map((s) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.07, 0.585, -0.03), new THREE.Vector3(s * 0.1, 0.55, 0.06), new THREE.Vector3(s * 0.085, 0.43, 0.14), new THREE.Vector3(s * 0.04, 0.29, 0.158), new THREE.Vector3(0, 0.215, 0.16)]), 40, 0.0075, 8)),
    [],
  );
  const pulse = 0.65 + 0.35 * Math.sin(time * 4);
  return (
    <>
      <group scale={[1.0, 1, 0.74]}>
        <mesh>
          <latheGeometry args={[coatProfile, 48]} />
          {mat(C.coat, 0.85, {side: THREE.DoubleSide})}
        </mesh>
      </group>
      {/* shoulders blend */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 0.165, 0.46, 0]} scale={[1.0, 0.9, 1]}>
          <sphereGeometry args={[0.05, 20, 14]} />
          {mat(C.coat, 0.85)}
        </mesh>
      ))}
      {/* scrub V-neck + collar */}
      <group position={[0, 0.0, 0.0]} rotation={[-0.12, 0, 0]}>
        <mesh position={[0, 0, 0.132]}>
          <shapeGeometry args={[(() => { const sh = new THREE.Shape(); sh.moveTo(-0.07, 0.545); sh.lineTo(0.07, 0.545); sh.lineTo(0, 0.34); sh.closePath(); return sh; })()]} />
          <meshStandardMaterial color={C.scrubs} roughness={0.85} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      </group>
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 0.066, 0.45, 0.14]} rotation={[-0.1, 0, s * -0.38]}>
          <boxGeometry args={[0.03, 0.2, 0.012]} />
          {mat(C.coat, 0.85)}
        </mesh>
      ))}
      <mesh position={[0, 0.5, -0.1]}>
        <cylinderGeometry args={[0.085, 0.1, 0.07, 24]} />
        {mat(C.coat, 0.85)}
      </mesh>
      {/* neck */}
      <mesh position={[0, 0.58, 0]}>
        <cylinderGeometry args={[0.052, 0.058, 0.1, 20]} />
        {mat(C.skin, 0.62)}
      </mesh>
      {/* stethoscope */}
      {steth.map((g, i) => (
        <mesh key={i} geometry={g}>
          {mat(C.steth, 0.4)}
        </mesh>
      ))}
      <mesh position={[0, 0.213, 0.162]} rotation={[Math.PI / 2 - 0.2, 0, 0]}>
        <cylinderGeometry args={[0.024, 0.024, 0.012, 20]} />
        {mat(C.silver, 0.25, {metalness: 0.6})}
      </mesh>
      {/* official FMC logo on the left chest (the file is used unmodified) */}
      {logo && (
        <mesh position={[0.095, 0.3, 0.1465]} rotation={[-0.06, 0.1, 0]}>
          <planeGeometry args={[0.095, 0.095]} />
          <meshBasicMaterial map={logo} transparent toneMapped={false} />
        </mesh>
      )}
      {/* pocket */}
      {/* pain highlight on the lower back */}
      {pose.painGlow > 0.01 && (
        <>
          <mesh position={[0, 0.12, -0.1]} scale={[0.17, 0.14, 0.12]}>
            <sphereGeometry args={[1, 24, 16]} />
            <meshBasicMaterial color="#ff3b30" transparent opacity={0.42 * pose.painGlow * (0.6 + 0.4 * pulse)} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0.12, -0.131]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.3, 0.3]} />
            <meshBasicMaterial map={glowTexture()} transparent opacity={pose.painGlow * (0.6 + 0.4 * pulse)} depthWrite={false} />
          </mesh>
        </>
      )}
    </>
  );
};

export const Doctor: React.FC<{pose: DoctorPose; time: number}> = ({pose, time}) => {
  const {root, hips, torso, head} = pose;
  return (
    <group position={[root.x, root.y, root.z]} rotation={[0, root.yaw, 0]}>
      <group position={[hips.x, DIM.hipY + hips.yOffset, 0]} rotation={[0, hips.yaw, hips.roll]}>
        <mesh position={[0, -0.03, 0]} scale={[1.25, 0.95, 0.9]}>
          <sphereGeometry args={[0.13, 24, 16]} />
          {mat(C.scrubs, 0.85)}
        </mesh>
        <Leg side="L" leg={pose.legs.L} />
        <Leg side="R" leg={pose.legs.R} />
        <group rotation={[torso.pitch, torso.yaw, torso.roll]}>
          <group scale={[1, 0.95, 1]}><Torso pose={pose} time={time} /></group>
          <Arm side="L" arm={pose.arms.L} hold={pose.hold} />
          <Arm side="R" arm={pose.arms.R} hold={pose.hold} />
          <group position={[0, DIM.neckY, 0]} rotation={[head.pitch, head.yaw, head.roll]}>
            <group position={[0, DIM.headY, 0.01]}>
              <Head pose={pose} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};
