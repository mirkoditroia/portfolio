#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;
uniform vec4 u_mouse;

#define iTime u_time
#define iResolution u_resolution
#define iMouse u_mouse

#define H(a) (cos(radians(vec3(100.0, 140.0, 190.0)) - ((a) * 6.2832)) * 0.5 + 0.5)

mat2 rot(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
}

void main() {
    vec2 U = gl_FragCoord.xy;
    vec3 c = vec3(0.0), o = vec3(1.0, 1.732, 1.0), u, v, a, b;
    vec2 R = iResolution.xy;
    vec2 m = iMouse.xy / R * 4.0 - 2.0;
    vec2 uv = (U - 0.5 * R) / R.y;
    float t = iTime / 5.0;
    float tr = smoothstep(0.0, 1.0, sin(t) * 0.6 + 0.5);
    float s = tr * 4.0 + 2.0;
    float h, k, i;
    if (iMouse.z < 1.0) m = vec2(sin(t / 2.0) * 0.6, sin(t) * 0.4);

    mat2 pitch = rot(m.y * 1.571);
    mat2 yaw = rot(m.x * 1.571);

    for (int j = 1; j <= 9; j++) {
        float i = float(j) * 0.1;

        u = normalize(vec3(uv, 0.7 * sqrt(i))) * s;
        u.yz *= pitch;
        u.xz *= yaw;

        a = mod(u, o) * 2.0 - o;
        b = mod(u + o * 0.5, o) * 2.0 - o;
        h = min(dot(a, a), dot(b, b)) * 0.5;

        v = h * h * H(i - t / 5.0);
        k = 1.1 - max(i, tr - i);
        c += v * k;
    }

    vec3 color = pow(c, vec3(2.5)) * 0.5 + 0.05;

    // Calcola coordinate normalizzate schermo
    vec2 screenUV = U / iResolution.xy;

    // Bordo sfumato
    float borderSize = 0.05; // dimensione bordo sfumato
    float fadeX = smoothstep(0.0, borderSize, screenUV.x) * smoothstep(1.0, 1.0 - borderSize, screenUV.x);
    float fadeY = smoothstep(0.0, borderSize, screenUV.y) * smoothstep(1.0, 1.0 - borderSize, screenUV.y);
    float borderFade = fadeX * fadeY;

    vec3 borderColor = vec3(20.0 / 255.0, 30.0 / 255.0, 48.0 / 255.0);

    vec3 finalColor = mix(borderColor, color, borderFade);

    gl_FragColor = vec4(finalColor, 1.0);
}
