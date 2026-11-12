// A raymarched column of thin rounded plates with a torsion wave travelling
// through it. The background stays transparent so page typography can sit
// both behind and in front of the object.

export const vertexSource = /* glsl */ `
attribute vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

export const fragmentSource = /* glsl */ `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;
uniform float uSpread;
uniform float uIntro;
uniform float uVivid;
uniform float uEnergy;

const float HALF = 10.0;
const vec3 PLATE = vec3(0.62, 0.021, 0.62);
const float CORNER = 0.19;
const float EDGE = 0.012;
const float BOUND = 2.0;
const float FOCAL = 3.2;

float gSpacing;
float gTwist;
float gWave;

mat2 rot(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float sdPlate(vec3 p) {
  vec2 q = abs(p.xz) - (PLATE.xz - CORNER);
  float side = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - CORNER;
  vec2 w = vec2(side, abs(p.y) - PLATE.y) + EDGE;
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - EDGE;
}

vec3 toPlate(vec3 p, float id) {
  p.y -= id * gSpacing;
  p.xz = rot(gTwist * id + gWave * 0.55 * sin(uTime * 0.5 - id * 0.3)) * p.xz;
  return p;
}

// x: distance, y: index of the nearest plate. Neighbours are checked because
// each plate is rotated differently.
vec2 scene(vec3 p) {
  float id = clamp(floor(p.y / gSpacing + 0.5), -HALF, HALF);
  vec2 best = vec2(sdPlate(toPlate(p, id)), id);
  float lower = max(id - 1.0, -HALF);
  float d = sdPlate(toPlate(p, lower));
  if (d < best.x) best = vec2(d, lower);
  float upper = min(id + 1.0, HALF);
  d = sdPlate(toPlate(p, upper));
  if (d < best.x) best = vec2(d, upper);
  return best;
}

float map(vec3 p) {
  return scene(p).x;
}

// Plates two or more levels away are never closer than this, so capping a
// step here cannot tunnel through one of them.
float safeStep(float d) {
  return min(d, 1.5 * gSpacing - PLATE.y - EDGE);
}

float shadow(vec3 origin, vec3 direction) {
  float result = 1.0;
  float t = 0.02;
  for (int i = 0; i < 26; i++) {
    float h = map(origin + direction * t);
    result = min(result, 10.0 * h / t);
    t += clamp(safeStep(h), 0.018, 0.2);
    if (result < 0.02 || t > 2.6) break;
  }
  return clamp(result, 0.0, 1.0);
}

float occlusion(vec3 p, vec3 n) {
  float occluded = 0.0;
  float weight = 1.0;
  for (int i = 0; i < 4; i++) {
    float h = 0.012 + 0.045 * float(i);
    occluded += (h - map(p + n * h)) * weight;
    weight *= 0.72;
  }
  return clamp(1.0 - 3.4 * occluded, 0.0, 1.0);
}

// A small studio in camera space: x right, y up, z toward the viewer.
vec3 studio(vec3 v) {
  float h = v.y * 0.5 + 0.5;
  vec3 c = mix(vec3(0.012, 0.008, 0.03), vec3(0.09, 0.05, 0.17), smoothstep(0.0, 0.55, h));
  c = mix(c, vec3(1.5, 1.45, 1.7), smoothstep(0.66, 0.98, h));
  c += vec3(3.2, 1.5, 1.0) *
    smoothstep(0.8, 0.98, dot(v, normalize(vec3(-0.75, 0.3, -0.45))));
  c += vec3(1.4, 1.9, 0.6) *
    smoothstep(0.84, 0.99, dot(v, normalize(vec3(0.85, 0.05, 0.3))));
  return c;
}

vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

vec3 plateColour(float id) {
  float level = (id + HALF) / (2.0 * HALF);
  vec3 violet = vec3(0.2, 0.1, 0.85);
  vec3 coral = vec3(1.0, 0.12, 0.07);
  vec3 citron = vec3(0.6, 0.9, 0.05);
  vec3 c = mix(violet, coral, smoothstep(0.0, 0.52, level));
  c = mix(c, citron, smoothstep(0.48, 1.0, level));
  vec3 muted = vec3(dot(c, vec3(0.3, 0.55, 0.15))) * vec3(0.8, 0.74, 1.0);
  return mix(muted, c, uVivid);
}

vec3 shade(vec3 p, vec3 rd, vec3 rt, vec3 up, vec3 fw) {
  vec2 nearest = scene(p);
  vec3 e = vec3(0.0012, -0.0012, 0.0);
  vec3 n = normalize(
    e.xyy * map(p + e.xyy) +
    e.yyx * map(p + e.yyx) +
    e.yxy * map(p + e.yxy) +
    e.xxx * map(p + e.xxx)
  );
  vec3 base = plateColour(nearest.y);
  float rim = 1.0 - abs(n.y);

  // The top plate carries a fine engraved inset line.
  if (nearest.y > HALF - 0.5 && n.y > 0.9) {
    vec2 q = abs(toPlate(p, HALF).xz) - vec2(0.3);
    float inset = abs(length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.12);
    base *= mix(0.62, 1.0, smoothstep(0.004, 0.011, inset));
  }

  vec3 key = normalize(0.5 * rt + 0.95 * up - 0.3 * fw);
  float diffuse = max(dot(n, key), 0.0);
  float lit = shadow(p + n * 0.01, key);
  float open = occlusion(p, n);
  float fresnel = pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
  vec3 r = reflect(rd, n);
  vec3 reflection = studio(vec3(dot(r, rt), dot(r, up), -dot(r, fw)));
  float highlight = pow(max(dot(n, normalize(key - rd)), 0.0), 120.0) * lit;

  // Faces read as tinted glass; edges glow like lit acrylic.
  vec3 colour = base * 0.55 * (
    diffuse * lit * vec3(1.55, 1.45, 1.32) +
    (0.1 + 0.1 * n.y) * vec3(0.5, 0.45, 0.95) * open
  );
  colour += base * 1.25 * rim * rim * rim * mix(0.35, 1.0, open) * mix(0.4, 1.0, uVivid);
  colour += reflection * (0.012 + 0.6 * fresnel) * open * open;
  colour += vec3(1.0, 0.96, 0.9) * highlight * 2.0;

  return pow(aces(colour), vec3(0.4545));
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution) / uResolution.y;

  gSpacing = mix(0.05, 0.105 + 0.06 * uSpread, uIntro);
  gTwist = (0.1 + 0.06 * uPointer.x + 0.12 * uSpread) * uIntro;
  gWave = uEnergy * uIntro;

  float yaw = 0.7 + uTime * 0.05 + uPointer.x * 0.4 + (1.0 - uIntro) * 1.4;
  float pitch = 0.47 - uPointer.y * 0.14 + uSpread * 0.2;
  float distance = 5.9 * mix(1.3, 1.0, uIntro);
  vec3 ro = vec3(sin(yaw) * cos(pitch), sin(pitch), cos(yaw) * cos(pitch)) * distance;
  vec3 fw = normalize(-ro);
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  vec3 rd = normalize(uv.x * rt + uv.y * up + FOCAL * fw);

  float b = dot(ro, rd);
  float discriminant = b * b - (dot(ro, ro) - BOUND * BOUND);
  if (discriminant < 0.0) {
    gl_FragColor = vec4(0.0);
    return;
  }
  float root = sqrt(discriminant);
  float t = max(-b - root, 0.0);
  float tFar = -b + root;

  float edgeRatio = 1.0e3;
  float tEdge = t;
  float nearestMiss = 1.0e3;
  bool hit = false;
  for (int i = 0; i < 96; i++) {
    float d = map(ro + rd * t);
    if (d < 0.0014) {
      hit = true;
      break;
    }
    float ratio = d / t;
    if (ratio < edgeRatio) {
      edgeRatio = ratio;
      tEdge = t;
    }
    nearestMiss = min(nearestMiss, d);
    t += safeStep(d) * 0.94;
    if (t > tFar) break;
  }

  // Rays that graze the silhouette are shaded with partial coverage.
  float pixel = 2.0 / (uResolution.y * FOCAL);
  float coverage = hit ? 1.0 : clamp(1.0 - edgeRatio / (pixel * 1.6), 0.0, 1.0);
  vec4 colour = vec4(0.0);
  if (coverage > 0.0) {
    vec3 p = ro + rd * (hit ? t : tEdge);
    colour = vec4(shade(p, rd, rt, up, fw), 1.0) * coverage;
  }

  float impact = sqrt(max(dot(ro, ro) - b * b, 0.0));
  float falloff = smoothstep(BOUND, BOUND * 0.45, impact);
  float halo = exp(-nearestMiss * 7.0) * 0.18 * falloff * uIntro;
  vec3 tint = plateColour(clamp((ro + rd * tEdge).y / gSpacing, -HALF, HALF));
  tint = pow(tint, vec3(0.4545));
  colour += vec4(tint * halo, halo) * (1.0 - colour.a);

  colour.rgb += (hash(gl_FragCoord.xy) - 0.5) / 255.0 * colour.a;
  gl_FragColor = colour;
}
`
