// Shaders for the stack of plates. The plates are ordinary triangles, so a
// frame costs a small fraction of what tracing the same shape per pixel did.
// The background stays transparent so page typography can sit both behind
// and in front of the object.

export const plateVertex = /* glsl */ `
attribute vec3 aLocal;
attribute vec2 aNormal;
attribute vec2 aMeta;

uniform mat4 uCamera;
uniform vec3 uEye;
// Per plate: height, turn, scale, heat.
uniform vec4 uPose[21];
// Per plate: sideways offset (x, z), how filled its face is, opacity.
uniform vec4 uSway[21];
// Height, radius and darkness of the shadow under the stack.
uniform vec3 uFloor;
// Index of the highest plate, which sets the colour scale.
uniform float uTop;

varying vec2 vFace;
varying vec3 vView;
varying vec3 vNormal;
varying vec4 vData;
varying vec2 vTint;

const float HALF = 0.62;
const float THICK = 0.021;
// How far light reaches beyond a plate's rim, in half-widths.
const float SPILL = 0.46;

void main() {
  float kind = aMeta.y;
  vec3 world;
  vec3 normal = vec3(0.0, 1.0, 0.0);
  // Kind, position across the part, heat, opacity.
  vec4 data = vec4(kind, 0.0, 0.0, 1.0);
  vec2 tint = vec2(0.0);

  if (kind > 2.5) {
    world = vec3(aLocal.x * uFloor.y, uFloor.x, aLocal.z * uFloor.y);
    data.w = uFloor.z;
  } else {
    int index = int(aMeta.x + 0.5);
    vec4 pose = uPose[index];
    vec4 sway = uSway[index];
    float c = cos(pose.y);
    float s = sin(pose.y);
    // A plate that has barely started growing is also thinner.
    float thin = min(pose.z * 4.0, 1.0);
    vec2 across = aLocal.xz;
    float height = aLocal.y;
    data.y = aLocal.y * 0.5 + 0.5;
    if (kind < 0.5) {
      // The band of light leaves from the upper rim and reaches outward.
      across += aNormal * aLocal.y * SPILL;
      height = 1.0;
      data.y = aLocal.y;
    }
    vec3 local = vec3(
      across.x * HALF * pose.z,
      height * THICK * thin,
      across.y * HALF * pose.z
    );
    world = vec3(c * local.x - s * local.z, local.y, s * local.x + c * local.z);
    world += vec3(sway.x, pose.x, sway.y);
    if (kind > 0.5 && kind < 1.5) {
      normal = vec3(c * aNormal.x - s * aNormal.y, 0.0, s * aNormal.x + c * aNormal.y);
    }
    data.z = pose.w;
    data.w = sway.w;
    tint = vec2(clamp(aMeta.x / max(uTop, 1.0), 0.0, 1.0), sway.z);
  }

  vFace = aLocal.xz;
  vView = uEye - world;
  vNormal = normal;
  vData = data;
  vTint = tint;
  gl_Position = uCamera * vec4(world, 1.0);
}
`

// SOFTNESS and WALL_SOFT are replaced when the program is built: screen-space
// derivatives where the browser has them, fixed widths where it does not.
// Edges are softened here, in the shader, so the canvas needs no multisampling.
export const plateFragment = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float uVivid;
uniform float uGlow;
uniform float uSoft;

varying vec2 vFace;
varying vec3 vView;
varying vec3 vNormal;
varying vec4 vData;
varying vec2 vTint;

const float CORNER = 0.306;

// Distance to the edge of a rounded square; negative inside.
float roundSquare(vec2 p, float size, float radius) {
  vec2 q = abs(p) - (size - radius);
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}

// Violet at the bottom, coral in the middle, citron on top.
vec3 plateColour(float level) {
  vec3 violet = vec3(0.49, 0.36, 0.96);
  vec3 coral = vec3(1.0, 0.4, 0.27);
  vec3 citron = vec3(0.82, 0.95, 0.3);
  vec3 c = mix(violet, coral, smoothstep(0.0, 0.52, level));
  c = mix(c, citron, smoothstep(0.48, 1.0, level));
  vec3 muted = vec3(dot(c, vec3(0.3, 0.55, 0.15))) * vec3(0.9, 0.86, 1.0);
  return mix(muted, c, uVivid);
}

void main() {
  float kind = vData.x;
  float heat = vData.z;
  float opacity = vData.w;
  vec3 colour = plateColour(vTint.x);
  vec3 view = normalize(vView);
  vec3 white = vec3(1.0, 0.97, 0.92);

  if (kind > 2.5) {
    // The shadow the stack casts on the floor.
    float shade = smoothstep(1.0, 0.1, length(vFace));
    gl_FragColor = vec4(0.0, 0.0, 0.0, shade * shade * opacity);
    return;
  }

  if (kind < 0.5) {
    // Light spilling out of the plate's rim, added to whatever is behind.
    float fall = 1.0 - vData.y;
    float spill = fall * fall * (0.25 + 0.75 * fall);
    vec3 light = colour * spill * opacity * mix(0.11, 0.34, uVivid) *
      (1.0 + 2.6 * heat + 0.8 * uGlow);
    gl_FragColor = vec4(light, max(light.r, max(light.g, light.b)));
    return;
  }

  if (kind < 1.5) {
    // The side wall, brightest along its upper edge like lit acrylic.
    vec3 normal = normalize(vNormal);
    float facing = dot(normal, view);
    if (facing < 0.0) discard;
    float level = vData.y;
    float key = max(dot(normal, normalize(vec3(-0.5, 0.25, 0.83))), 0.0);
    float graze = pow(1.0 - facing, 3.0);
    vec3 wall = colour * (0.2 + 0.62 * level * level + 0.34 * key + 0.5 * graze);
    wall += white * (0.42 * pow(level, 7.0) + 0.3 * pow(key, 12.0));
    wall += (colour * 0.5 + white * 0.7) * heat;
    // Soft along the lower edge and where the wall turns away from view.
    float cover = smoothstep(0.0, WALL_SOFT, level) * smoothstep(0.0, 0.1, facing);
    gl_FragColor = vec4(wall, 1.0) * (opacity * cover);
    return;
  }

  // The top face: tinted glass with a bright rim.
  float edge = roundSquare(vFace, 1.0, CORNER);
  float soft = SOFTNESS;
  float cover = 1.0 - smoothstep(-soft, soft, edge);
  if (cover <= 0.0) discard;
  float inside = max(-edge, 0.0);
  float rim = exp(-inside * 30.0);
  float bleed = exp(-inside * 5.0);
  vec3 up = vec3(0.0, 1.0, 0.0);
  float sheen = pow(max(dot(up, normalize(view + normalize(vec3(-0.5, 0.75, 0.42)))), 0.0), 90.0);
  float graze = pow(1.0 - max(view.y, 0.0), 3.0);
  vec3 glass = vec3(0.055, 0.04, 0.09) + colour * (0.035 + 0.1 * graze);
  vec3 face = glass + colour * (0.3 * bleed + 1.1 * rim) +
    white * (0.42 * rim * rim + 0.3 * sheen);
  face += (colour * 0.55 + white * 0.6) * heat * (0.3 + rim);

  // The highest plate is solid, with a fine engraved inset line.
  float engraved = smoothstep(0.012, 0.04, abs(roundSquare(vFace, 0.55, 0.2)));
  vec3 solid = colour * (0.8 + 0.16 * graze) * mix(0.7, 1.0, engraved) +
    white * (0.2 * rim + 0.28 * sheen) + (colour * 0.4 + white * 0.4) * heat;
  face = mix(face, solid, vTint.y);

  float alpha = mix(0.9, 1.0, max(vTint.y, rim)) * cover * opacity;
  gl_FragColor = vec4(face, 1.0) * alpha;
}
`

export const moteVertex = /* glsl */ `
attribute vec4 aSeed;

uniform mat4 uCamera;
uniform vec3 uForward;
uniform float uTime;
// Canvas size in pixels, half the height of the stack, overall opacity.
uniform vec3 uField;
// 0 draws the specks behind the stack, 1 the ones in front of it.
uniform float uLayer;

varying float vLevel;
varying float vAlpha;

void main() {
  float turn = aSeed.x + uTime * (0.04 + 0.1 * fract(aSeed.w * 7.31));
  float rise = fract(aSeed.z + uTime * (0.01 + 0.022 * fract(aSeed.w * 3.17)));
  vec3 world = vec3(
    cos(turn) * aSeed.y,
    (rise * 2.0 - 1.0) * (uField.y + 0.45),
    sin(turn) * aSeed.y
  );
  float front = dot(world, uForward) < 0.0 ? 1.0 : 0.0;
  float shown = 1.0 - abs(front - uLayer);
  float twinkle = 0.55 + 0.45 * sin(uTime * (0.9 + fract(aSeed.w * 5.71)) + aSeed.w * 40.0);
  float fade = smoothstep(0.0, 0.14, rise) * (1.0 - smoothstep(0.8, 1.0, rise));

  gl_Position = uCamera * vec4(world, 1.0);
  gl_PointSize = shown * uField.x * (0.004 + 0.009 * fract(aSeed.w * 11.13)) *
    5.9 / max(gl_Position.w, 1.0);
  vLevel = rise;
  vAlpha = shown * fade * twinkle * uField.z * mix(0.6, 1.0, front);
}
`

export const moteFragment = /* glsl */ `
precision mediump float;

uniform float uVivid;

varying float vLevel;
varying float vAlpha;

void main() {
  float away = length(gl_PointCoord - 0.5) * 2.0;
  float glow = max(1.0 - away, 0.0);
  glow *= glow;
  vec3 violet = vec3(0.6, 0.5, 1.0);
  vec3 coral = vec3(1.0, 0.55, 0.42);
  vec3 citron = vec3(0.88, 0.97, 0.5);
  vec3 c = mix(violet, coral, smoothstep(0.0, 0.52, vLevel));
  c = mix(c, citron, smoothstep(0.48, 1.0, vLevel));
  c = mix(vec3(dot(c, vec3(0.3, 0.55, 0.15))), c, uVivid);
  vec3 light = c * glow * vAlpha;
  gl_FragColor = vec4(light, max(light.r, max(light.g, light.b)) * 0.7);
}
`
