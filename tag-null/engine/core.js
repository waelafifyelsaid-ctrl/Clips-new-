// Core renderer: toon shading, screen-space outlines (depth + normals), fisheye lens, grading, HUD compositing.
import * as THREE from 'three';

export const W = 720, H = 1280;
export { THREE };

export const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setSize(W, H);
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(95, W / H, 0.03, 400);
camera.layers.enable(1);   // layer 1 = no outline (smoke, glow, sky details)
scene.add(camera);
export function noOutline(o) { o.traverse(c => c.layers.set(1)); return o; }

// ---------------------------------------------------------------- materials
const grad = new THREE.DataTexture(new Uint8Array([120, 120, 120, 255, 190, 190, 190, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
grad.minFilter = grad.magFilter = THREE.NearestFilter; grad.needsUpdate = true;
const matCache = new Map();
export function toon(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!opts.map && matCache.has(key)) return matCache.get(key);
  const m = new THREE.MeshToonMaterial({ color, gradientMap: grad, ...opts });
  if (!opts.map) matCache.set(key, m);
  return m;
}
export function flat(color, opts = {}) { return new THREE.MeshBasicMaterial({ color, ...opts }); }

export function mesh(geo, mat, x = 0, y = 0, z = 0, parent = null, o = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (o.rot) m.rotation.set(...o.rot);
  if (o.scale) m.scale.set(...(Array.isArray(o.scale) ? o.scale : [o.scale, o.scale, o.scale]));
  m.castShadow = o.cast !== false; m.receiveShadow = o.receive !== false;
  if (parent) parent.add(m);
  return m;
}
export const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const cyl = (rt, rb, h, s = 20) => new THREE.CylinderGeometry(rt, rb, h, s);
export const sph = (r, a = 24, b = 16) => new THREE.SphereGeometry(r, a, b);
export const cap = (r, l, s = 12) => new THREE.CapsuleGeometry(r, l, 6, s);

export function canvasTex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); }
  t.userData.canvas = c; t.userData.ctx = g;
  return t;
}

// ---------------------------------------------------------------- lights (sets adjust them)
export const lights = {
  amb: new THREE.AmbientLight(0xffffff, 1.0),
  hemi: new THREE.HemisphereLight(0xdfe8ff, 0x6b5a48, 0.8),
  key: new THREE.DirectionalLight(0xfff1dd, 1.3),
};
lights.key.castShadow = true;
lights.key.shadow.mapSize.set(1024, 1024);
lights.key.shadow.camera.left = -8; lights.key.shadow.camera.right = 8;
lights.key.shadow.camera.top = 8; lights.key.shadow.camera.bottom = -8;
lights.key.shadow.camera.far = 40; lights.key.shadow.bias = -0.0015; lights.key.shadow.normalBias = 0.02;
for (const l of Object.values(lights)) scene.add(l);
scene.add(lights.key.target);

// ---------------------------------------------------------------- post-processing
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4 });
rtColor.texture.colorSpace = THREE.SRGBColorSpace;
const rtNormal = new THREE.WebGLRenderTarget(W, H);
rtNormal.depthTexture = new THREE.DepthTexture(W, H);
const normalMat = new THREE.MeshNormalMaterial();

export const post = {
  fisheye: 0.28, edge: 1.0, vignette: 0.55, grain: 0.018, sat: 0.92, tint: new THREE.Color(1, 1, 1),
  flash: 0, flashColor: new THREE.Color(1, 0.92, 0.75), red: 0, blur: 0, aberr: 0, exposure: 1.0, dark: 0,
};
const postMat = new THREE.ShaderMaterial({
  uniforms: {
    tColor: { value: rtColor.texture }, tNormal: { value: rtNormal.texture }, tDepth: { value: rtNormal.depthTexture },
    res: { value: new THREE.Vector2(W, H) }, k: { value: 0.28 }, edge: { value: 1.0 }, vig: { value: 0.5 }, grain: { value: 0.03 },
    sat: { value: 0.92 }, tint: { value: new THREE.Color(1, 1, 1) }, flash: { value: 0 }, flashColor: { value: new THREE.Color() },
    red: { value: 0 }, aberr: { value: 0 }, exposure: { value: 1 }, time: { value: 0 }, near: { value: 0.03 }, far: { value: 400 }, dark: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: /* glsl */`
    uniform sampler2D tColor, tNormal, tDepth; uniform vec2 res; uniform float k, edge, vig, grain, sat, flash, red, aberr, exposure, time, near, far, dark;
    uniform vec3 tint, flashColor; varying vec2 vUv;
    float lin(float d){ float z = d * 2.0 - 1.0; return (2.0 * near * far) / (far + near - z * (far - near)); }
    vec2 lens(vec2 uv){ vec2 p = uv * 2.0 - 1.0; float a = res.x / res.y; p.x *= a; float r2 = dot(p, p);
      p *= (1.0 + k * 0.12) / (1.0 + k * r2 * 0.35); p.x /= a; return p * 0.5 + 0.5; }
    float rnd(vec2 c){ return fract(sin(dot(c, vec2(12.9898, 78.233)) + time * 7.1) * 43758.5453); }
    void main(){
      vec2 uv = lens(vUv);
      vec3 col;
      if (aberr > 0.0) { vec2 dir = (uv - 0.5) * aberr * 0.012;
        col = vec3(texture2D(tColor, uv + dir).r, texture2D(tColor, uv).g, texture2D(tColor, uv - dir).b); }
      else col = texture2D(tColor, uv).rgb;
      // outlines from depth + normal discontinuities
      vec2 px = 1.4 / res;
      float d0 = lin(texture2D(tDepth, uv).r); vec3 n0 = texture2D(tNormal, uv).rgb;
      float de = 0.0, ne = 0.0;
      for (int i = 0; i < 4; i++) {
        vec2 o = i == 0 ? vec2(px.x, 0.0) : i == 1 ? vec2(-px.x, 0.0) : i == 2 ? vec2(0.0, px.y) : vec2(0.0, -px.y);
        float d = lin(texture2D(tDepth, uv + o).r); vec3 n = texture2D(tNormal, uv + o).rgb;
        de += abs(d - d0) / max(d0, 0.3); ne += distance(n, n0);
      }
      float e = clamp(smoothstep(0.10, 0.22, de) + smoothstep(0.55, 0.95, ne), 0.0, 1.0) * edge;
      e *= smoothstep(120.0, 25.0, d0) * 0.85 + 0.15;   // thinner lines far away
      col = mix(col, vec3(0.07, 0.06, 0.08), e * 0.92);
      // grade
      float l = dot(col, vec3(0.299, 0.587, 0.114)); col = mix(vec3(l), col, sat) * tint * exposure;
      col = mix(col, vec3(0.55, 0.02, 0.02) * (l + 0.3), red);
      col = mix(col, flashColor, flash);
      vec2 q = vUv * 2.0 - 1.0; q.x *= res.x / res.y * 0.9;
      col *= 1.0 - vig * smoothstep(0.55, 1.45, length(q));
      col *= 1.0 - dark;
      col += (rnd(vUv * res) - 0.5) * grain;
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }`,
});
const postScene = new THREE.Scene();
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// HUD canvas (subtitles, phone close-ups, cards) composited over the 3D frame
export const out = document.createElement('canvas'); out.width = W; out.height = H;
export const octx = out.getContext('2d');
document.body.appendChild(out);

export function renderFrame(t, hud) {
  const u = postMat.uniforms;
  u.k.value = post.fisheye; u.edge.value = post.edge; u.vig.value = post.vignette; u.grain.value = post.grain; u.sat.value = post.sat;
  u.tint.value.copy(post.tint); u.flash.value = post.flash; u.flashColor.value.copy(post.flashColor); u.red.value = post.red;
  u.aberr.value = post.aberr; u.exposure.value = post.exposure; u.time.value = t % 10; u.dark.value = post.dark;
  u.near.value = camera.near; u.far.value = camera.far;
  renderer.setRenderTarget(rtColor); renderer.render(scene, camera);
  const bg = scene.background; scene.background = null; scene.overrideMaterial = normalMat;
  const sw = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false;
  camera.layers.disable(1);
  renderer.setRenderTarget(rtNormal); renderer.render(scene, camera);
  camera.layers.enable(1);
  renderer.shadowMap.autoUpdate = sw; scene.overrideMaterial = null; scene.background = bg;
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
  octx.drawImage(renderer.domElement, 0, 0);
  if (hud) hud(octx, t);
  return out;
}
