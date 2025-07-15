#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;

#define iTime u_time
#define iResolution u_resolution

void main() {
    vec2 I = gl_FragCoord.xy;
    float t = iTime;
    float z = 0.0, d = 0.0, s = 0.0;
    vec4 O = vec4(0.0);

    // Usa int per il loop principale
    for (int j = 0; j < 100; j++) {
        float i = float(j);
        vec3 p = z * normalize(vec3(I + I, 0.0) - iResolution.xyy);
        p.z -= t;

        d = 1.0;
        for (int k = 0; k < 6; k++) {
            if (d >= 64.0) break;
            p += 0.7 * cos(p.yzx * d) / d;
            d += d;
        }

        p.xy *= mat2(cos(z * 0.2 + vec4(0, 11, 33, 0)));
        z += d = 0.03 + 0.1 * max(s = 3.0 - abs(p.x), -s * 0.2);
        O += (cos(s + s - vec4(5, 0, 1, 3)) + 1.4) / d / z;
    }

    // Approx tanh
    vec4 result = (exp(2.0 * (O * O / 400000.0)) - 1.0) / (exp(2.0 * (O * O / 400000.0)) + 1.0);

    gl_FragColor = result;
}
