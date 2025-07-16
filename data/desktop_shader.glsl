#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform vec2 u_resolution;

#define iTime u_time
#define iResolution u_resolution

void main() {
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

}
