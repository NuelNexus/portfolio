// Fur strands: each instance is one hair exported from the Blender scene
// (5 control points), drawn as a camera-facing ribbon that tapers to the tip.
// Wind, cursor-brushing, click gusts and the scroll "spread" all happen here.

const noise = /* glsl */ `
// Simplex 3D noise — Ashima Arts / Stefan Gustavson (MIT)
vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`

export const furVertex = /* glsl */ `
uniform float uTime;
uniform float uDScale;
uniform float uWidth;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform vec2 uMouseVel;
uniform float uMouseStr;
uniform float uMouseR;
uniform vec2 uGustC;
uniform float uGustAge;
uniform float uGustAmp;
uniform float uSpread;
uniform float uWind;
uniform float uRing;
uniform float uRingR;

attribute vec3 aRoot;
attribute vec3 aD1;
attribute vec3 aD2;
attribute vec3 aD3;
attribute vec3 aD4;
attribute float aCol;

varying float vT;
varying float vCol;
varying vec3 vTan;
varying float vGlow;
varying float vSide;
varying float vRnd;
varying float vSpot;

${noise}

vec3 curveAt(float t, vec3 P0, vec3 P1, vec3 P2, vec3 P3, vec3 P4) {
  float f = clamp(t, 0.0, 1.0) * 4.0;
  float i = min(floor(f), 3.0);
  float u = f - i;
  vec3 a; vec3 b; vec3 c; vec3 d;
  if (i < 0.5) { a = 2.0 * P0 - P1; b = P0; c = P1; d = P2; }
  else if (i < 1.5) { a = P0; b = P1; c = P2; d = P3; }
  else if (i < 2.5) { a = P1; b = P2; c = P3; d = P4; }
  else { a = P2; b = P3; c = P4; d = 2.0 * P4 - P3; }
  float u2 = u * u;
  return 0.5 * ((2.0 * b) + (-a + c) * u + (2.0 * a - 5.0 * b + 4.0 * c - d) * u2 + (-a + 3.0 * b - 3.0 * c + d) * u2 * u);
}

vec3 displace(vec3 p, float t, vec3 root, vec3 wind) {
  float w = t * t;
  // idle wind (per strand, computed once in main)
  p += wind * w;

  // gust: a shock ring expanding from the click point
  float gd = length(root.xy - uGustC);
  float gr = uGustAge * 1.6;
  float g = uGustAmp * exp(-uGustAge * 1.4) * exp(-pow((gd - gr) / 0.22, 2.0));
  vec2 gdir = (root.xy - uGustC) / max(gd, 1e-4);
  p.xy += gdir * g * 0.38 * w;
  p.z += g * 0.2 * w;

  // scroll: fur bursts outward around the ring
  float rr = length(root.xy);
  vec2 rdir = root.xy / max(rr, 1e-4);
  p.xy += rdir * uSpread * uRing * 0.45 * w;
  p.z += uSpread * 0.25 * w;

  // cursor brushing
  vec2 dm = p.xy - uMouse;
  float d2 = dot(dm, dm);
  float m = uMouseStr * exp(-d2 / (uMouseR * uMouseR));
  vec2 away = dm / max(sqrt(d2), 1e-4);
  p.xy += (away * 0.2 + uMouseVel * 0.3) * m * w;
  p.z += m * 0.08 * w;
  return p;
}

void main() {
  float t = position.x;
  float side = position.y;
  float rnd = fract(sin(float(gl_InstanceID) * 12.9898) * 43758.5453);

  float s = uDScale * 127.0;
  vec3 P0 = aRoot;
  vec3 P1 = P0 + aD1 * s;
  vec3 P2 = P1 + aD2 * s;
  vec3 P3 = P2 + aD3 * s;
  vec3 P4 = P3 + aD4 * s;

  vec3 wind = vec3(0.0);
  if (uWind > 0.0) {
    vec3 q = vec3(P0.xy * 1.7, uTime * 0.3 + rnd * 0.25);
    wind = vec3(
      snoise(q) * 0.05,
      snoise(q + vec3(19.1, 7.3, 3.7)) * 0.05,
      snoise(q + vec3(3.1, 11.7, 5.3)) * 0.02
    ) * uWind;
  }
  float e = 0.045;
  float ta = max(t - e, 0.0);
  float tb = min(t + e, 1.0);
  vec3 c  = displace(curveAt(t,  P0, P1, P2, P3, P4), t,  P0, wind);
  vec3 ca = displace(curveAt(ta, P0, P1, P2, P3, P4), ta, P0, wind);
  vec3 cb = displace(curveAt(tb, P0, P1, P2, P3, P4), tb, P0, wind);

  mat4 mvp = projectionMatrix * modelViewMatrix;
  vec4 clip = mvp * vec4(c, 1.0);
  vec4 clipA = mvp * vec4(ca, 1.0);
  vec4 clipB = mvp * vec4(cb, 1.0);
  vec2 sa = clipA.xy / clipA.w * uRes;
  vec2 sb = clipB.xy / clipB.w * uRes;
  vec2 dir = sb - sa;
  float dl = length(dir);
  dir = dl > 1e-5 ? dir / dl : vec2(0.0, 1.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  float width = uWidth * mix(1.0, 0.1, t) * (0.7 + 0.6 * rnd);
  // the back plane has a straight right edge above/below the ring: thin it out
  float edge = mix(1.0, smoothstep(0.02, -0.4, P0.x), (1.0 - uRing) * step(0.5, abs(P0.y)));
  width *= edge;
  clip.xy += nrm * side * width / uRes * clip.w;

  vT = t;
  vCol = aCol;
  vRnd = rnd;
  vSpot = 0.0;
  if (uRing < 0.5) {
    float sp = snoise(vec3(P0.xy * 2.3, 4.0)) + 0.45 * snoise(vec3(P0.xy * 5.1, 9.0));
    vSpot = smoothstep(0.45, 0.8, sp);
  }
  vSide = smoothstep(-1.6, 1.1, c.x) * 0.8 + smoothstep(-1.2, 1.2, c.y) * 0.2;
  vTan = normalize((modelViewMatrix * vec4(cb - ca, 0.0)).xyz);
  // bright rim where the fur meets the hole (lit from behind in the .blend)
  float rr = length(c.xy);
  vGlow = uRing * exp(-pow((rr - uRingR) / 0.04, 2.0));
  gl_Position = clip;
}
`

export const furFragment = /* glsl */ `
uniform vec3 uLight;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uTip;
uniform float uBright;
uniform float uFade;
uniform float uRing;

varying float vT;
varying float vCol;
varying vec3 vTan;
varying float vGlow;
varying float vSide;
varying float vRnd;
varying float vSpot;

vec3 ramp(float f) {
  vec3 c = mix(uC0, uC1, smoothstep(0.28, 0.52, f));
  return mix(c, uC2, smoothstep(0.52, 0.78, f));
}

void main() {
  vec3 T = normalize(vTan);
  vec3 L = normalize(uLight);
  float tl = dot(T, L);
  float diff = sqrt(max(0.0, 1.0 - tl * tl));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float th = dot(T, H);
  float spec = pow(sqrt(max(0.0, 1.0 - th * th)), 70.0);

  // ring: lit from the side; back plane: strands face the camera, so light
  // them more evenly and let the colour noise do the work
  float side = mix(1.0, vSide, uRing);
  float light = mix(0.7 + 0.45 * diff, 0.35 + 0.95 * diff, uRing);
  vec3 base = ramp(vCol * mix(1.0, 0.82, uRing) + side * mix(0.02, 0.24, uRing));
  base = mix(base, uTip, vT * (0.08 + 0.55 * side * side) * mix(1.0, vT, 0.5));
  base = mix(base, uC0 * 0.22, vSpot);
  float ao = mix(mix(0.3, 0.16, uRing), 1.0, smoothstep(0.0, 0.8, vT));
  float streak = mix(0.38, 1.15, smoothstep(0.05, 0.95, vRnd));
  vec3 col = base * light * ao * uBright * mix(1.0, 0.62 + 0.75 * vSide, uRing) * streak;
  // the Cycles render is punchier (AgX High Contrast): more saturation
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = max(vec3(0.0), mix(vec3(lum), col, 1.35));
  col += spec * 0.3 * vec3(1.0, 0.86, 0.72) * vT;
  col = mix(col, vec3(1.0, 0.94, 0.88) * 1.4, clamp(vGlow, 0.0, 1.0) * 0.9);

  gl_FragColor = vec4(col * uFade, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const backdropVertex = /* glsl */ `
varying vec2 vP;
varying vec2 vW;
void main() {
  vP = position.xy;
  vW = (modelMatrix * vec4(position, 1.0)).xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const backdropFragment = /* glsl */ `
uniform vec3 uC0;
uniform vec3 uC1;
varying vec2 vP;
varying vec2 vW;
${noise}
void main() {
  // the emitter plane in the .blend has a round cut-out for the ring
  if (length(vW) < 0.66) discard;
  float n = 0.5 + 0.5 * snoise(vec3(vW * 1.6, 0.0));
  // ragged right edge so it hides under the ring fur
  float n2 = snoise(vec3(vW * 5.0, 3.0));
  if (abs(vW.y) > 0.5 && vW.x > -0.42 + n2 * 0.18) discard;
  vec3 col = mix(uC0 * 0.45, uC1 * 0.6, smoothstep(0.3, 0.8, n));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
