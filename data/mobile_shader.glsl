#ifdef GL_ES
precision mediump float;
#endif

// Dichiara uniform usate da glslCanvas
uniform float u_time;
uniform vec2 u_resolution;
uniform vec4 u_mouse;

// Definisci alias per compatibilità con codice Shadertoy
#define iTime u_time
#define iResolution u_resolution
#define iMouse u_mouse

#define WAVES
#define BORDER

#define RAY_STEPS 150

#define BRIGHTNESS 1.2
#define GAMMA 1.4
#define SATURATION .65

#define detail .001
#define t iTime*.5

const vec3 origin = vec3(-1., .7, 0.);
float det = 0.0;

mat2 rot(float a) {
    return mat2(cos(a), sin(a), -sin(a), cos(a));
}

vec4 formula(vec4 p) {
    p.xz = abs(p.xz + 1.) - abs(p.xz - 1.) - p.xz;
    p.y -= .25;
    p.xy *= rot(radians(35.));
    p = p * 2. / clamp(dot(p.xyz, p.xyz), .2, 1.);
    return p;
}

float de(vec3 pos) {
#ifdef WAVES
    pos.y += sin(pos.z - t * 6.) * .15;
#endif
    vec3 tpos = pos;
    tpos.z = abs(3. - mod(tpos.z, 6.));
    vec4 p = vec4(tpos, 1.);
    for (int i = 0; i < 4; i++) {
        p = formula(p);
    }
    float fr = (length(max(vec2(0.), p.yz - 1.5)) - 1.) / p.w;
    float ro = max(abs(pos.x + 1.) - .3, pos.y - .35);
    ro = max(ro, -max(abs(pos.x + 1.) - .1, pos.y - .5));
    pos.z = abs(.25 - mod(pos.z, .5));
    ro = max(ro, -max(abs(pos.z) - .2, pos.y - .3));
    ro = max(ro, -max(abs(pos.z) - .01, -pos.y + .32));
    return min(fr, ro);
}

vec3 path(float ti) {
    ti *= 1.5;
    return vec3(sin(ti), (1. - sin(ti * 2.)) * .5, -ti * 5.) * .5;
}

float edge = 0.;
vec3 normal(vec3 p) {
    vec3 e = vec3(0.0, det * 5., 0.0);
    float d1 = de(p - e.yxx), d2 = de(p + e.yxx);
    float d3 = de(p - e.xyx), d4 = de(p + e.xyx);
    float d5 = de(p - e.xxy), d6 = de(p + e.xxy);
    float d = de(p);
    edge = abs(d - 0.5 * (d2 + d1)) + abs(d - 0.5 * (d4 + d3)) + abs(d - 0.5 * (d6 + d5));
    edge = min(1., pow(edge, .55) * 15.);
    return normalize(vec3(d1 - d2, d3 - d4, d5 - d6));
}

vec3 raymarch(vec3 from, vec3 dir) {
    edge = 0.;
    vec3 p, norm;
    float d = 100.;
    float totdist = 0.;
    for (int i = 0; i < RAY_STEPS; i++) {
        if (d > det && totdist < 25.0) {
            p = from + totdist * dir;
            d = de(p);
            det = detail * exp(.13 * totdist);
            totdist += d;
        }
    }
    vec3 col = vec3(0.);
    p -= (det - d) * dir;
    norm = normal(p);
    col = (1. - abs(norm)) * max(0., 1. - edge * .8);
    totdist = clamp(totdist, 0., 26.);

    float y = mix(.45, 1.2, pow(smoothstep(0., 1., .75 - dir.y), 2.));
    vec3 backg = vec3(0.5, 0., 1.) * y;

    col = mix(vec3(1., .9, .3), col, exp(-.004 * totdist * totdist));
    if (totdist > 25.) col = backg;

    col = pow(col, vec3(GAMMA)) * BRIGHTNESS;
    col = mix(vec3(length(col)), col, SATURATION);
    col *= vec3(1., .9, .85);
    return col;
}

vec3 move(inout vec3 dir) {
    vec3 go = path(t);
    vec3 adv = path(t + .7);
    vec3 advec = normalize(adv - go);
    float an = adv.x - go.x;
    an *= min(1., abs(adv.z - go.z)) * sign(adv.z - go.z) * .7;
    dir.xy *= mat2(cos(an), sin(an), -sin(an), cos(an));
    an = advec.y * 1.7;
    dir.yz *= mat2(cos(an), sin(an), -sin(an), cos(an));
    an = atan(advec.x, advec.z);
    dir.xz *= mat2(cos(an), sin(an), -sin(an), cos(an));
    return go;
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = fragCoord.xy / iResolution.xy * 2. - 1.;
    vec2 oriuv = uv;
    uv.y *= iResolution.y / iResolution.x;
    vec2 mouse = (iMouse.xy / iResolution.xy - .5) * 3.;
    if (iMouse.z < 1.) mouse = vec2(0., -0.05);
    float fov = .9 - max(0., .7 - iTime * .3);
    vec3 dir = normalize(vec3(uv * fov, 1.));
    dir.yz *= rot(mouse.y);
    dir.xz *= rot(mouse.x);
    vec3 from = origin + move(dir);
    vec3 color = raymarch(from, dir);
#ifdef BORDER
    color = mix(vec3(0.), color, pow(max(0., .95 - length(oriuv * oriuv * oriuv * vec2(1.05, 1.1))), .3));
#endif
    gl_FragColor = vec4(color, 1.);
}
