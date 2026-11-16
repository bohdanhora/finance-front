"use client";

import { useEffect, useRef } from "react";

const VERTEX = `
attribute vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = `
precision mediump float;

uniform vec2 resolution;
uniform float time;
uniform float scroll;
uniform vec3 pointer;
uniform vec3 base;
uniform vec3 deep;
uniform vec3 mid;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
    );
}

float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    mat2 turn = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise(p);
        p = turn * p;
        amplitude *= 0.5;
    }
    return value;
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 p = (gl_FragCoord.xy - 0.5 * resolution) / resolution.y;
    vec2 m = (pointer.xy - 0.5 * resolution) / resolution.y;

    float pd = length(p - m);

    float t = time * 0.02;
    vec2 s = p * 0.6 + vec2(0.0, scroll);
    vec2 q = vec2(fbm(s + vec2(0.0, t)), fbm(s + vec2(5.2, 1.3) - t));
    float f = fbm(s + 1.5 * q);

    vec3 color = mix(base, deep, smoothstep(0.28, 0.62, f));
    color = mix(color, mid, smoothstep(0.5, 0.72, f) * 0.55);
    color = mix(color, mid, exp(-pd * pd * 5.0) * pointer.z * 0.3);

    float vignette = smoothstep(1.4, 0.0, length(uv - vec2(0.5, 0.7)));
    color = mix(base, color, vignette);

    gl_FragColor = vec4(color, 1.0);
}
`;

type Palette = { deep: string; mid: string };

const DARK: Palette = { deep: "#0b2a2a", mid: "#11504c" };
const LIGHT: Palette = { deep: "#dcefeb", mid: "#bfe3dc" };

const SCALE = 0.55;
const FRAME = 1000 / 30;

const toRgb = (hex: string): [number, number, number] => {
    const value = hex.replace("#", "");
    const full = value.length === 3 ? [...value].map((c) => c + c).join("") : value;
    const n = Number.parseInt(full, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
    }
    return shader;
};

export const Backdrop = () => {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        const gl = canvas?.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
        if (!canvas || !gl) return;

        const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
        const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
        const program = gl.createProgram();
        if (!vertex || !fragment || !program) return;
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
        gl.useProgram(program);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const position = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

        const uniform = (name: string) => gl.getUniformLocation(program, name);
        const u = {
            resolution: uniform("resolution"),
            time: uniform("time"),
            scroll: uniform("scroll"),
            pointer: uniform("pointer"),
            base: uniform("base"),
            deep: uniform("deep"),
            mid: uniform("mid"),
        };

        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const fine = window.matchMedia("(pointer: fine)");
        const pointer = { x: 0, y: 0, tx: 0, ty: 0, strength: 0, target: 0 };
        let frame = 0;
        let last = 0;
        let started = performance.now();

        const applyTheme = () => {
            const dark = document.documentElement.classList.contains("dark");
            const palette = dark ? DARK : LIGHT;
            const paper = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim();
            gl.uniform3fv(u.base, toRgb(paper || (dark ? "#050607" : "#f3f5f4")));
            gl.uniform3fv(u.deep, toRgb(palette.deep));
            gl.uniform3fv(u.mid, toRgb(palette.mid));
        };

        const resize = () => {
            canvas.width = Math.max(1, Math.round(window.innerWidth * SCALE));
            canvas.height = Math.max(1, Math.round(window.innerHeight * SCALE));
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform2f(u.resolution, canvas.width, canvas.height);
        };

        const render = (now: number) => {
            const seconds = (now - started) / 1000;
            pointer.x += (pointer.tx - pointer.x) * 0.07;
            pointer.y += (pointer.ty - pointer.y) * 0.07;
            pointer.strength += (pointer.target - pointer.strength) * 0.05;

            gl.uniform1f(u.time, seconds + 40);
            gl.uniform1f(u.scroll, (window.scrollY / Math.max(window.innerHeight, 1)) * 0.18);
            gl.uniform3f(u.pointer, pointer.x * SCALE, canvas.height - pointer.y * SCALE, pointer.strength);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        };

        const loop = (now: number) => {
            frame = requestAnimationFrame(loop);
            if (now - last < FRAME) return;
            last = now;
            render(now);
        };

        const start = () => {
            if (frame || motion.matches || document.hidden) return;
            frame = requestAnimationFrame(loop);
        };

        const stop = () => {
            cancelAnimationFrame(frame);
            frame = 0;
        };

        const refresh = () => render(last || performance.now());

        const onResize = () => {
            resize();
            refresh();
        };

        const onScroll = () => {
            if (!frame) refresh();
        };

        const onPointerMove = (event: PointerEvent) => {
            if (!fine.matches) return;
            if (pointer.target === 0 && pointer.strength < 0.01) {
                pointer.x = event.clientX;
                pointer.y = event.clientY;
            }
            pointer.tx = event.clientX;
            pointer.ty = event.clientY;
            pointer.target = 1;
        };

        const onPointerLeave = () => {
            pointer.target = 0;
        };

        const onVisibility = () => {
            if (document.hidden) stop();
            else start();
        };

        const onMotion = () => {
            if (motion.matches) {
                stop();
                refresh();
            } else start();
        };

        const onLost = (event: Event) => {
            event.preventDefault();
            stop();
        };

        const themeObserver = new MutationObserver(() => {
            applyTheme();
            refresh();
        });

        applyTheme();
        resize();
        started = performance.now();
        refresh();
        start();

        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        window.addEventListener("resize", onResize);
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        document.documentElement.addEventListener("pointerleave", onPointerLeave);
        document.addEventListener("visibilitychange", onVisibility);
        motion.addEventListener("change", onMotion);
        canvas.addEventListener("webglcontextlost", onLost);

        return () => {
            stop();
            themeObserver.disconnect();
            window.removeEventListener("resize", onResize);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("pointermove", onPointerMove);
            document.documentElement.removeEventListener("pointerleave", onPointerLeave);
            document.removeEventListener("visibilitychange", onVisibility);
            motion.removeEventListener("change", onMotion);
            canvas.removeEventListener("webglcontextlost", onLost);
            gl.deleteBuffer(buffer);
            gl.deleteProgram(program);
            gl.deleteShader(vertex);
            gl.deleteShader(fragment);
        };
    }, []);

    return (
        <canvas
            ref={ref}
            aria-hidden
            className="backdrop-glow pointer-events-none fixed inset-0 -z-20 size-full"
        />
    );
};
