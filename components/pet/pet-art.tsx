import { ReactNode } from "react";

import { PetEquipped, PetMood, PetSpecies } from "types/pet";

const INK = "#1b1210";
const OUTLINE_WIDTH = 9;
const PATCH = "#3d3633";

type Palette = {
    fill: string;
    outline: string;
    belly: string;
    inner: string;
};

type Anchors = { hatY: number; hatScale: number; mouthY: number };

const PALETTES: Record<PetSpecies, Palette> = {
    bulldog: { fill: "#fbf6f1", outline: "#8c7f77", belly: "#ffffff", inner: "#f6a8a0" },
    monkey: { fill: "#b0714a", outline: "#6f4127", belly: "#f7d5b2", inner: "#f7d5b2" },
    sphynx: { fill: "#f6cfc0", outline: "#cf8d7a", belly: "#fbe0d5", inner: "#f7a1ad" },
};

const ANCHORS: Record<PetSpecies, Anchors> = {
    bulldog: { hatY: 50, hatScale: 1, mouthY: 118 },
    monkey: { hatY: 44, hatScale: 1, mouthY: 112 },
    sphynx: { hatY: 50, hatScale: 0.92, mouthY: 113 },
};

const Mirror = ({ children }: { children: ReactNode }) => (
    <>
        {children}
        <g transform="translate(200 0) scale(-1 1)">{children}</g>
    </>
);

const Silhouette = ({ palette, children }: { palette: Palette; children: ReactNode }) => (
    <>
        <g fill={palette.outline} stroke={palette.outline} strokeWidth={OUTLINE_WIDTH} strokeLinejoin="round">
            {children}
        </g>
        <g fill={palette.fill}>{children}</g>
    </>
);

const Arms = ({ mood }: { mood: PetMood }) => (
    <>
        {mood === "happy" ? (
            <g className="pet-wave">
                <rect x={54} y={100} width={22} height={54} rx={11} transform="rotate(-34 66 150)" />
            </g>
        ) : (
            <ellipse cx={60} cy={162} rx={13} ry={24} transform="rotate(12 60 162)" />
        )}
        <ellipse cx={140} cy={162} rx={13} ry={24} transform="rotate(-12 140 162)" />
        <ellipse cx={80} cy={196} rx={17} ry={10} />
        <ellipse cx={120} cy={196} rx={17} ry={10} />
    </>
);

const Shine = ({ head }: { head: { cx: number; cy: number; rx: number; ry: number } }) => {
    const left = head.cx - head.rx;
    const top = head.cy - head.ry;

    return (
        <g fill="none" stroke="#fff" strokeLinecap="round">
            <path
                d={`M${left + 10} ${head.cy - 10} Q${left + 16} ${top + 14} ${head.cx - 14} ${top + 6}`}
                strokeWidth={5}
                opacity={0.85}
            />
            <path d={`M${left + 7} ${head.cy + 4} L${left + 7} ${head.cy - 1}`} strokeWidth={5} opacity={0.85} />
            <path
                d={`M${head.cx + head.rx - 16} ${top + 14} Q${head.cx + head.rx - 6} ${top + 26} ${head.cx + head.rx - 5} ${head.cy - 6}`}
                strokeWidth={4}
                opacity={0.55}
            />
            <path d="M68 178 Q64 168 66 158" strokeWidth={4} opacity={0.55} />
        </g>
    );
};

const Eyes = ({ mood, y = 90 }: { mood: PetMood; y?: number }) => {
    if (mood === "happy" || mood === "sleepy") {
        return (
            <Mirror>
                <path
                    d={mood === "happy" ? `M73 ${y + 3} Q80 ${y - 7} 87 ${y + 3}` : `M73 ${y} Q80 ${y + 5} 87 ${y}`}
                    fill="none"
                    stroke={INK}
                    strokeWidth={4.5}
                    strokeLinecap="round"
                />
            </Mirror>
        );
    }

    return (
        <>
            <Mirror>
                <g className="pet-blink">
                    <ellipse cx={80} cy={y} rx={6.5} ry={8} fill={INK} />
                    <circle cx={82.4} cy={y - 3} r={2.3} fill="#fff" />
                </g>
            </Mirror>
            {mood === "sad" && (
                <>
                    <Mirror>
                        <path d={`M70 ${y - 13} L86 ${y - 18}`} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
                    </Mirror>
                    <path
                        d={`M72 ${y + 10} Q68 ${y + 18} 72 ${y + 21} Q76 ${y + 18} 72 ${y + 10} Z`}
                        fill="#7cc4ff"
                        stroke="#3b9ae0"
                        strokeWidth={1.5}
                    />
                </>
            )}
        </>
    );
};

const Blush = ({ y = 104 }: { y?: number }) => (
    <Mirror>
        <ellipse cx={64} cy={y} rx={9} ry={5} fill="#ff8fa3" opacity={0.6} />
    </Mirror>
);

const Mouth = ({ mood, y, color = INK }: { mood: PetMood; y: number; color?: string }) => {
    if (mood === "happy") {
        return (
            <g>
                <path
                    d={`M88 ${y} Q100 ${y + 22} 112 ${y} Z`}
                    fill="#4a1d1a"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                />
                <path d={`M93 ${y + 9} Q100 ${y + 19} 107 ${y + 9} Q100 ${y + 5} 93 ${y + 9} Z`} fill="#ff7a90" />
            </g>
        );
    }
    if (mood === "sad") {
        return (
            <path
                d={`M90 ${y + 8} Q100 ${y} 110 ${y + 8}`}
                fill="none"
                stroke={color}
                strokeWidth={3.5}
                strokeLinecap="round"
            />
        );
    }
    if (mood === "sleepy") {
        return <ellipse cx={100} cy={y + 4} rx={4} ry={3.4} fill={color} />;
    }
    return (
        <path
            d={`M89 ${y} Q94.5 ${y + 7} 100 ${y} Q105.5 ${y + 7} 111 ${y}`}
            fill="none"
            stroke={color}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    );
};

const Shadow = () => <ellipse cx={100} cy={202} rx={64} ry={9} fill="#000" opacity={0.18} />;

const Bulldog = ({ mood }: { mood: PetMood }) => {
    const palette = PALETTES.bulldog;
    const head = { cx: 100, cy: 92, rx: 58, ry: 46 };

    return (
        <>
            <Shadow />
            <Silhouette palette={palette}>
                <ellipse cx={100} cy={160} rx={46} ry={40} />
                <Arms mood={mood} />
                <Mirror>
                    <path d="M62 62 C46 50 38 26 46 14 C56 6 76 22 86 44 Z" />
                </Mirror>
                <ellipse {...head} />
                <Mirror>
                    <ellipse cx={77} cy={114} rx={24} ry={17} />
                </Mirror>
            </Silhouette>
            <ellipse cx={100} cy={164} rx={26} ry={24} fill={palette.belly} />
            <Mirror>
                <path d="M62 62 C46 50 38 26 46 14 C56 6 76 22 86 44 Q80 56 62 62 Z" fill={PATCH} />
                <path d="M63 54 C52 44 47 30 51 22 C57 18 70 30 76 44 Z" fill={palette.inner} />
            </Mirror>
            <path d="M104 72 Q118 62 134 70 Q144 82 138 96 Q128 104 114 100 Q102 94 104 72 Z" fill={PATCH} />
            <path
                d="M78 104 Q100 92 122 104 Q136 122 116 130 Q100 136 84 130 Q64 122 78 104 Z"
                fill="#f6e9e3"
                stroke="#d9c8bf"
                strokeWidth={3}
                strokeLinejoin="round"
            />
            <path
                d="M86 96 Q100 89 114 96"
                fill="none"
                stroke={palette.outline}
                strokeWidth={3}
                strokeLinecap="round"
            />
            <ellipse cx={100} cy={106} rx={13} ry={7.5} fill="#2a1b15" />
            <ellipse cx={95} cy={103.5} rx={4} ry={2} fill="#fff" opacity={0.5} />
            <Eyes mood={mood} y={84} />
            {mood === "happy" && <Blush y={100} />}
            <Mouth mood={mood} y={ANCHORS.bulldog.mouthY} />
            <Shine head={head} />
        </>
    );
};

const Monkey = ({ mood }: { mood: PetMood }) => {
    const palette = PALETTES.monkey;
    const head = { cx: 100, cy: 90, rx: 50, ry: 48 };

    return (
        <>
            <Shadow />
            <Silhouette palette={palette}>
                <ellipse cx={100} cy={160} rx={44} ry={40} />
                <Arms mood={mood} />
                <Mirror>
                    <circle cx={48} cy={94} r={19} />
                </Mirror>
                <ellipse {...head} />
                <path d="M90 46 Q94 30 103 38 Q109 26 115 42 Z" />
            </Silhouette>
            <ellipse cx={100} cy={164} rx={26} ry={24} fill={palette.belly} />
            <Mirror>
                <circle cx={48} cy={94} r={10.5} fill={palette.inner} />
            </Mirror>
            <g fill={palette.belly}>
                <circle cx={83} cy={88} r={20} />
                <circle cx={117} cy={88} r={20} />
                <ellipse cx={100} cy={112} rx={32} ry={22} />
            </g>
            <ellipse cx={95} cy={105} rx={2.6} ry={3.4} fill="#7a4a2c" />
            <ellipse cx={105} cy={105} rx={2.6} ry={3.4} fill="#7a4a2c" />
            <Eyes mood={mood} y={88} />
            {mood === "happy" && <Blush y={104} />}
            <Mouth mood={mood} y={ANCHORS.monkey.mouthY} />
            <Shine head={head} />
        </>
    );
};

const Sphynx = ({ mood }: { mood: PetMood }) => {
    const palette = PALETTES.sphynx;
    const head = { cx: 100, cy: 92, rx: 52, ry: 45 };

    return (
        <>
            <Shadow />
            <Silhouette palette={palette}>
                <ellipse cx={100} cy={160} rx={42} ry={40} />
                <Arms mood={mood} />
                <Mirror>
                    <path d="M58 66 L42 12 L94 48 Z" strokeWidth={OUTLINE_WIDTH + 8} />
                </Mirror>
                <ellipse {...head} />
                <ellipse cx={100} cy={112} rx={30} ry={20} />
            </Silhouette>
            <Mirror>
                <path
                    d="M60 58 L50 26 L82 50 Z"
                    fill={palette.inner}
                    stroke={palette.inner}
                    strokeWidth={6}
                    strokeLinejoin="round"
                />
            </Mirror>
            <g fill="none" stroke="#e3a693" strokeWidth={3} strokeLinecap="round">
                <path d="M88 58 Q100 52 112 58" />
                <path d="M84 66 Q100 59 116 66" />
                <path d="M93 73 Q100 70 107 73" />
                <path d="M84 150 Q100 144 116 150" />
                <path d="M88 158 Q100 153 112 158" />
            </g>
            <Mirror>
                <g stroke="#cf8d7a" strokeWidth={2} strokeLinecap="round">
                    <path d="M74 110 L50 105" />
                    <path d="M74 115 L50 116" />
                </g>
            </Mirror>
            <path
                d="M94 104 L106 104 L100 110 Z"
                fill={palette.inner}
                stroke="#e2788a"
                strokeWidth={3}
                strokeLinejoin="round"
            />
            <Eyes mood={mood} y={88} />
            {mood === "happy" && <Blush y={104} />}
            <Mouth mood={mood} y={ANCHORS.sphynx.mouthY} />
            <Shine head={head} />
        </>
    );
};

const Hat = ({ id }: { id: string }) => {
    switch (id) {
        case "cap":
            return (
                <g>
                    <path d="M-40 2 C-40 -36 40 -36 40 2 Z" fill="#e5484d" />
                    <path
                        d="M-14 -27 C-6 -31 6 -31 14 -27"
                        fill="none"
                        stroke="#ff7b7f"
                        strokeWidth={3}
                        strokeLinecap="round"
                    />
                    <circle cx={0} cy={-31} r={4} fill="#b83237" />
                    <ellipse cx={0} cy={4} rx={44} ry={8} fill="#b83237" />
                </g>
            );
        case "beanie":
            return (
                <g>
                    <path d="M-40 4 C-40 -42 40 -42 40 4 Z" fill="#3b82f6" />
                    {[-24, -8, 8, 24].map((x) => (
                        <path
                            key={x}
                            d={`M${x} -2 L${x * 0.8} -28`}
                            stroke="#60a5fa"
                            strokeWidth={3}
                            strokeLinecap="round"
                        />
                    ))}
                    <rect x={-44} y={-6} width={88} height={16} rx={8} fill="#2563eb" />
                    <circle cx={0} cy={-42} r={10} fill="#eef2ff" />
                </g>
            );
        case "party":
            return (
                <g transform="rotate(-12)">
                    <path d="M-22 4 L0 -60 L22 4 Z" fill="#8b5cf6" />
                    <path d="M-15 -16 L15 -16 L11 -28 L-11 -28 Z" fill="#facc15" />
                    <path d="M-7 -40 L7 -40 L4 -50 L-4 -50 Z" fill="#facc15" />
                    <circle cx={0} cy={-62} r={7} fill="#f472b6" />
                </g>
            );
        case "beret":
            return (
                <g transform="rotate(-10)">
                    <ellipse cx={6} cy={-8} rx={46} ry={15} fill="#b91c1c" />
                    <ellipse cx={6} cy={-12} rx={40} ry={9} fill="#dc2626" />
                    <path d="M6 -22 L8 -30" stroke="#7f1d1d" strokeWidth={4} strokeLinecap="round" />
                </g>
            );
        case "chef":
            return (
                <g>
                    <circle cx={-22} cy={-30} r={17} fill="#fff" />
                    <circle cx={22} cy={-30} r={17} fill="#fff" />
                    <circle cx={0} cy={-42} r={20} fill="#fff" />
                    <rect x={-30} y={-18} width={60} height={22} rx={5} fill="#f3f4f6" />
                    <path d="M-12 -14 L-12 0 M0 -14 L0 0 M12 -14 L12 0" stroke="#d1d5db" strokeWidth={2} />
                </g>
            );
        case "cowboy":
            return (
                <g>
                    <path d="M-30 2 C-32 -40 -12 -38 0 -30 C12 -38 32 -40 30 2 Z" fill="#a16207" />
                    <rect x={-30} y={-10} width={60} height={8} fill="#422006" />
                    <path d="M-64 -4 Q-58 12 0 12 Q58 12 64 -4 Q50 6 0 4 Q-50 6 -64 -4 Z" fill="#854d0e" />
                </g>
            );
        case "tophat":
            return (
                <g>
                    <rect x={-26} y={-60} width={52} height={60} rx={5} fill="#18181b" />
                    <rect x={-26} y={-20} width={52} height={10} fill="#dc2626" />
                    <ellipse cx={0} cy={1} rx={42} ry={8} fill="#27272a" />
                    <path d="M-18 -52 L-18 -26" stroke="#3f3f46" strokeWidth={4} strokeLinecap="round" />
                </g>
            );
        default:
            return null;
    }
};

const Glasses = ({ id }: { id: string }) => {
    switch (id) {
        case "shades":
            return (
                <g>
                    <rect x={-38} y={-12} width={32} height={24} rx={11} fill="#111827" />
                    <rect x={6} y={-12} width={32} height={24} rx={11} fill="#111827" />
                    <path d="M-6 -4 Q0 -8 6 -4" fill="none" stroke="#111827" strokeWidth={4} />
                    <path d="M-30 -5 L-22 -5 M14 -5 L22 -5" stroke="#6b7280" strokeWidth={3} strokeLinecap="round" />
                </g>
            );
        case "round":
            return (
                <g fill="#fff" fillOpacity={0.12} stroke="#d4a017" strokeWidth={3}>
                    <circle cx={-20} cy={0} r={15} />
                    <circle cx={20} cy={0} r={15} />
                    <path d="M-5 -2 Q0 -6 5 -2" fill="none" />
                </g>
            );
        case "hearts":
            return (
                <g fill="#ff5c8a" stroke="#be185d" strokeWidth={2}>
                    {[-20, 20].map((x) => (
                        <path
                            key={x}
                            d={`M${x} 12 C${x - 22} -2 ${x - 14} -20 ${x} -8 C${x + 14} -20 ${x + 22} -2 ${x} 12 Z`}
                        />
                    ))}
                    <path d="M-4 -4 Q0 -7 4 -4" fill="none" />
                </g>
            );
        case "monocle":
            return (
                <g fill="none" stroke="#d4a017" strokeWidth={3.5}>
                    <circle cx={20} cy={0} r={16} fill="#fff" fillOpacity={0.15} />
                    <path d="M34 8 Q46 30 36 52" strokeWidth={2} strokeDasharray="3 3" />
                </g>
            );
        default:
            return null;
    }
};

const Neckwear = ({ id }: { id: string }) => {
    switch (id) {
        case "bandana":
            return (
                <g>
                    <path d="M-42 -6 Q0 8 42 -6 L0 34 Z" fill="#e5484d" />
                    {[
                        [-18, 4],
                        [8, 6],
                        [-4, 18],
                        [18, -2],
                    ].map(([x, y]) => (
                        <circle key={`${x}${y}`} cx={x} cy={y} r={2.6} fill="#fff" />
                    ))}
                </g>
            );
        case "bowtie":
            return (
                <g fill="#dc2626">
                    <path d="M0 6 L-24 -6 L-24 18 Z" />
                    <path d="M0 6 L24 -6 L24 18 Z" />
                    <rect x={-6} y={0} width={12} height={12} rx={4} fill="#991b1b" />
                </g>
            );
        case "scarf":
            return (
                <g>
                    <path d="M-46 -8 Q0 12 46 -8 L44 8 Q0 26 -44 8 Z" fill="#16a34a" />
                    <path d="M14 10 L30 10 L34 44 L18 44 Z" fill="#15803d" />
                    <path
                        d="M-30 2 L-26 14 M-10 6 L-8 18 M10 6 L8 18"
                        stroke="#86efac"
                        strokeWidth={3}
                        strokeLinecap="round"
                    />
                </g>
            );
        case "chain":
            return (
                <g>
                    <path d="M-34 -6 Q0 22 34 -6" fill="none" stroke="#e8b923" strokeWidth={4} strokeDasharray="5 3" />
                    <circle cx={0} cy={18} r={11} fill="#facc15" stroke="#a16207" strokeWidth={2} />
                    <path
                        d="M3 12 Q-4 11 -3 16 Q4 18 3 22 Q-2 25 -4 22 M0 9 L0 27"
                        fill="none"
                        stroke="#a16207"
                        strokeWidth={2}
                        strokeLinecap="round"
                    />
                </g>
            );
        default:
            return null;
    }
};

const Stars = ({ points, color = "#fff" }: { points: [number, number, number][]; color?: string }) => (
    <>
        {points.map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={color} />
        ))}
    </>
);

const Scene = ({ id }: { id: string }) => {
    switch (id) {
        case "park":
            return (
                <>
                    <rect width={200} height={200} fill="#bfe6ff" />
                    <circle cx={160} cy={40} r={18} fill="#fde68a" />
                    <ellipse cx={50} cy={176} rx={110} ry={60} fill="#86d48a" />
                    <ellipse cx={170} cy={186} rx={90} ry={50} fill="#5fbf6a" />
                    <rect x={24} y={92} width={8} height={40} rx={3} fill="#8b5a3c" />
                    <circle cx={28} cy={86} r={20} fill="#3fa356" />
                </>
            );
        case "beach":
            return (
                <>
                    <rect width={200} height={200} fill="#ffe1c7" />
                    <circle cx={150} cy={58} r={26} fill="#ff9f68" />
                    <rect y={120} width={200} height={34} fill="#38bdf8" />
                    <path
                        d="M0 126 Q25 120 50 126 T100 126 T150 126 T200 126"
                        fill="none"
                        stroke="#e0f2fe"
                        strokeWidth={3}
                    />
                    <rect y={150} width={200} height={50} fill="#fde68a" />
                </>
            );
        case "night":
            return (
                <>
                    <rect width={200} height={200} fill="#0f1733" />
                    <circle cx={156} cy={42} r={16} fill="#f8f3d6" />
                    <circle cx={163} cy={37} r={14} fill="#0f1733" />
                    <Stars
                        points={[
                            [30, 30, 1.6],
                            [60, 52, 1.2],
                            [100, 22, 1.4],
                            [126, 64, 1],
                            [182, 92, 1.3],
                            [18, 84, 1],
                        ]}
                    />
                    <path
                        d="M0 160 L0 130 L20 130 L20 116 L38 116 L38 138 L56 138 L56 104 L76 104 L76 150 L132 150 L132 112 L150 112 L150 126 L172 126 L172 100 L200 100 L200 200 L0 200 Z"
                        fill="#1c2650"
                    />
                </>
            );
        case "space":
            return (
                <>
                    <rect width={200} height={200} fill="#1b1036" />
                    <Stars
                        points={[
                            [22, 26, 1.4],
                            [70, 40, 1],
                            [120, 18, 1.6],
                            [176, 36, 1.2],
                            [30, 120, 1.1],
                            [180, 140, 1.4],
                            [150, 90, 1],
                        ]}
                    />
                    <circle cx={160} cy={58} r={20} fill="#f472b6" />
                    <ellipse cx={160} cy={58} rx={32} ry={7} fill="none" stroke="#fbcfe8" strokeWidth={3} />
                    <circle cx={34} cy={70} r={10} fill="#60a5fa" />
                </>
            );
        default:
            return (
                <>
                    <rect width={200} height={200} fill="#12302d" />
                    <rect y={150} width={200} height={50} fill="#0c2321" />
                    <rect x={128} y={26} width={48} height={52} rx={6} fill="#1d4a45" />
                    <path d="M152 26 L152 78 M128 52 L176 52" stroke="#12302d" strokeWidth={4} />
                    <rect x={20} y={118} width={22} height={32} rx={4} fill="#b45f3c" />
                    <circle cx={26} cy={108} r={10} fill="#2f9e6a" />
                    <circle cx={38} cy={104} r={9} fill="#3ab87c" />
                </>
            );
    }
};
const CHARACTERS: Record<PetSpecies, (props: { mood: PetMood }) => ReactNode> = {
    bulldog: Bulldog,
    monkey: Monkey,
    sphynx: Sphynx,
};

export type PetArtProps = {
    species: PetSpecies;
    mood?: PetMood;
    equipped?: Partial<PetEquipped>;
    scene?: boolean;
    className?: string;
    title?: string;
};

export const PetArt = ({ species, mood = "calm", equipped = {}, scene = true, className, title }: PetArtProps) => {
    const Character = CHARACTERS[species];
    const anchors = ANCHORS[species];
    const clip = `pet-clip-${species}-${scene ? "scene" : "bare"}`;

    return (
        <svg viewBox="0 0 200 200" className={className} role="img" aria-label={title}>
            <defs>
                <clipPath id={clip}>
                    <rect width={200} height={200} rx={scene ? 36 : 0} />
                </clipPath>
            </defs>
            <g clipPath={`url(#${clip})`}>
                {scene && <Scene id={equipped.background ?? "room"} />}
                <g transform="translate(15 26) scale(0.85)">
                    <g className={mood === "happy" ? "pet-hop" : "pet-breathe"}>
                        <Character mood={mood} />
                        {equipped.neck && (
                            <g
                                transform="translate(100 134)"
                                stroke="rgb(0 0 0 / 0.28)"
                                strokeWidth={3}
                                paintOrder="stroke"
                            >
                                <Neckwear id={equipped.neck} />
                            </g>
                        )}
                        {equipped.eyes && (
                            <g transform={`translate(100 ${species === "bulldog" ? 84 : 88})`}>
                                <Glasses id={equipped.eyes} />
                            </g>
                        )}
                        {equipped.head && (
                            <g
                                transform={`translate(100 ${anchors.hatY}) scale(${anchors.hatScale})`}
                                stroke="rgb(0 0 0 / 0.28)"
                                strokeWidth={3}
                                paintOrder="stroke"
                            >
                                <Hat id={equipped.head} />
                            </g>
                        )}
                    </g>
                    {mood === "sleepy" && (
                        <g fill="#cbd5e1" fontFamily="var(--font-geist-mono)" fontWeight={700}>
                            <text x={150} y={52} fontSize={18} className="pet-z">
                                z
                            </text>
                            <text x={166} y={32} fontSize={13} className="pet-z pet-z-late">
                                z
                            </text>
                        </g>
                    )}
                </g>
            </g>
        </svg>
    );
};
