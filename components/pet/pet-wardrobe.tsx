import type { PetEquipped, PetMood, PetSpecies } from "types/pet";
import assets from "./pet-assets.json";

type WornRender = { src: string; slot: string };
const wardrobe: Record<PetSpecies, Record<string, WornRender>> = assets.wardrobe;
const chin: Record<PetSpecies, number> = { bulldog: 124.7, monkey: 119.1, sphynx: 110.3 };
const expressionNose: Record<PetSpecies, Record<PetMood, [number, number]>> = {
    bulldog: { calm: [110, 84], happy: [102, 84], sad: [110, 84], sleepy: [102, 84] },
    monkey: { calm: [114, 90], happy: [97, 90], sad: [114, 80], sleepy: [100, 88] },
    sphynx: { calm: [117, 88], happy: [102, 88], sad: [117, 84], sleepy: [102, 84] },
};

export function WardrobeCharacter({
    species,
    equipped,
    maskId,
    mood,
}: {
    species: PetSpecies;
    equipped: Partial<PetEquipped>;
    maskId: string;
    mood: PetMood;
}) {
    const renders = wardrobe[species];
    const head = equipped.head && renders[equipped.head]?.slot === "head" ? renders[equipped.head] : null;
    const eyes = equipped.eyes && renders[equipped.eyes]?.slot === "eyes" ? renders[equipped.eyes] : null;
    const neck = equipped.neck && renders[equipped.neck]?.slot === "neck" ? renders[equipped.neck] : null;
    const upper = head || eyes || neck;
    if (!upper) return null;
    const seam = chin[species] - 1;
    const [noseX, noseY] = expressionNose[species][mood];
    const sprite = (render: WornRender, mask?: string, item?: string | null) => (
        <image href={render.src} width="200" height="200" mask={mask ? `url(#${mask})` : undefined} data-worn={item} />
    );
    return (
        <g data-wardrobe="rendered">
            <defs>
                <linearGradient
                    id={`${maskId}-top-fade`}
                    x1="0"
                    y1={seam - 1}
                    x2="0"
                    y2={seam + 1}
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="white" />
                    <stop offset="1" stopColor="black" />
                </linearGradient>
                <linearGradient
                    id={`${maskId}-body-fade`}
                    x1="0"
                    y1={seam - 1}
                    x2="0"
                    y2={seam + 1}
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="black" />
                    <stop offset="1" stopColor="white" />
                </linearGradient>
                <mask id={`${maskId}-top`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
                    <rect width="200" height="200" fill={`url(#${maskId}-top-fade)`} />
                </mask>
                <mask id={`${maskId}-body`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
                    <rect width="200" height="200" fill={`url(#${maskId}-body-fade)`} />
                </mask>
                <filter id={`${maskId}-feather`}>
                    <feGaussianBlur stdDeviation="0.65" />
                </filter>
                <mask id={`${maskId}-face`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
                    <path
                        d={
                            species === "bulldog"
                                ? "M56 82Q100 71 144 80L143 102Q126 113 100 113Q74 113 57 103Z"
                                : "M55 81Q100 71 145 81L143 102Q125 111 100 111Q75 111 57 102Z"
                        }
                        fill="white"
                        filter={`url(#${maskId}-feather)`}
                    />
                </mask>
            </defs>
            {neck && upper !== neck ? (
                <>
                    {sprite(neck, `${maskId}-body`, equipped.neck)}
                    {sprite(upper, `${maskId}-top`, head ? equipped.head : equipped.eyes)}
                </>
            ) : (
                sprite(upper, undefined, head ? equipped.head : eyes ? equipped.eyes : equipped.neck)
            )}
            {head && eyes && sprite(eyes, `${maskId}-face`, equipped.eyes)}
            {mood !== "calm" && (
                <>
                    <defs>
                        <filter id={`${maskId}-expression-feather`}>
                            <feGaussianBlur stdDeviation="1.4" />
                        </filter>
                        <mask
                            id={`${maskId}-expression`}
                            maskUnits="userSpaceOnUse"
                            x="0"
                            y="0"
                            width="200"
                            height="200"
                        >
                            {eyes && ["round", "monocle"].includes(equipped.eyes ?? "") && (
                                <g fill="white">
                                    <ellipse
                                        cx="80"
                                        cy={species === "sphynx" ? 88 : 86}
                                        rx={equipped.eyes === "monocle" ? 15 : 10.5}
                                        ry={equipped.eyes === "monocle" ? 12 : 10.5}
                                    />
                                    <ellipse cx={species === "sphynx" ? 114 : 118} cy="85.5" rx="10.5" ry="10.5" />
                                </g>
                            )}
                            {eyes ? (
                                <ellipse
                                    cx="100"
                                    cy={species === "sphynx" ? 101 : 105}
                                    rx={species === "sphynx" ? 14 : 20}
                                    ry={species === "sphynx" ? 7 : 13}
                                    fill="white"
                                    filter={`url(#${maskId}-expression-feather)`}
                                />
                            ) : (
                                <path
                                    d={
                                        species === "bulldog"
                                            ? "M69 84Q100 77 131 83L134 107Q128 121 100 123Q73 121 66 107Z"
                                            : species === "monkey"
                                              ? "M68 82Q100 76 132 82L133 103Q125 117 100 118Q75 117 67 103Z"
                                              : "M70 82Q100 78 130 82L131 98Q122 111 100 111Q77 110 69 98Z"
                                    }
                                    fill="white"
                                    filter={`url(#${maskId}-expression-feather)`}
                                />
                            )}
                        </mask>
                    </defs>
                    <image
                        href={assets.characters[species][mood]}
                        x={100 - noseX * 0.86}
                        y={96.67 - noseY * 0.86}
                        width="172"
                        height="172"
                        mask={`url(#${maskId}-expression)`}
                        data-expression={mood}
                    />
                </>
            )}
        </g>
    );
}

export function hasWardrobe(species: PetSpecies, equipped: Partial<PetEquipped>) {
    return (["head", "eyes", "neck"] as const).some((slot) => {
        const id = equipped[slot];
        return id && wardrobe[species][id]?.slot === slot;
    });
}
