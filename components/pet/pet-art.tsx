"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { PointerEvent } from "react";

import { PetEquipped, PetMood, PetSpecies } from "types/pet";

import assets from "./pet-assets.json";
import { hasWardrobe, WardrobeCharacter } from "./pet-wardrobe";

type Asset = { src: string; width: number; height: number };
const backgrounds: Record<string, Asset> = assets.backgrounds;

const SPRITE_X: Record<PetSpecies, number> = { bulldog: 9, monkey: 2, sphynx: 0 };

const FRAME_OFFSET: Record<PetSpecies, Record<PetMood, [number, number]>> = {
    bulldog: { calm: [0, 0], happy: [7.2, 0], sad: [0, 0], sleepy: [7.2, 0] },
    monkey: { calm: [0, 0], happy: [14.3, 0], sad: [0, 8.5], sleepy: [14.3, 8.5] },
    sphynx: { calm: [0, 0], happy: [12.4, 0], sad: [0, 3.3], sleepy: [12.4, 3.3] },
};

export type PetArtProps = {
    species: PetSpecies;
    mood?: PetMood;
    equipped?: Partial<PetEquipped>;
    scene?: boolean;
    className?: string;
    title?: string;
    interactive?: boolean;
    petLabel?: string;
};

export const PetArt = ({
    species,
    mood = "calm",
    equipped = {},
    scene = true,
    className,
    title,
    interactive = false,
    petLabel,
}: PetArtProps) => {
    const clip = useId();
    const [affection, setAffection] = useState(0);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const gesture = useRef<{ id: number; x: number; y: number } | null>(null);
    const lastStroke = useRef(0);
    const sequence = useRef(0);
    useEffect(() => {
        if (interactive) {
            const happyFrame = new Image();
            happyFrame.src = assets.characters[species].happy;
        }
    }, [interactive, species]);
    useEffect(
        () => () => {
            if (timer.current) clearTimeout(timer.current);
        },
        [],
    );

    const stroke = () => {
        const now = Date.now();
        if (now - lastStroke.current < 280) return;
        lastStroke.current = now;
        setAffection(++sequence.current);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setAffection(0), 1800);
    };
    const pointerDown = (event: PointerEvent<SVGSVGElement>) => {
        if (!interactive || (event.pointerType === "mouse" && event.button !== 0)) return;
        const target = event.target as Element;
        if (!target.closest("[data-pet-touch]")) return;
        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
        stroke();
    };
    const pointerMove = (event: PointerEvent<SVGSVGElement>) => {
        const previous = gesture.current;
        if (!interactive || !previous || previous.id !== event.pointerId) return;
        if (Math.hypot(event.clientX - previous.x, event.clientY - previous.y) < 12) return;
        gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        stroke();
    };

    const currentMood = affection ? "happy" : mood;
    const [frameX, frameY] = FRAME_OFFSET[species][currentMood];
    const background = backgrounds[equipped.background ?? "room"] ?? backgrounds.room;
    const dressed = hasWardrobe(species, equipped);
    const character = (
        <image
            href={assets.characters[species][currentMood]}
            x={SPRITE_X[species] + frameX}
            y={27 + frameY}
            width="172"
            height="172"
        />
    );

    return (
        <svg
            viewBox="0 0 200 200"
            className={`companion-art ${interactive ? "companion-interactive" : ""} ${className ?? ""}`}
            role={interactive ? "button" : "img"}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? (petLabel ?? title) : title}
            data-species={species}
            data-mood={currentMood}
            data-petting={Boolean(affection)}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onClick={
                interactive
                    ? (event) => {
                          if (event.detail === 0) stroke();
                      }
                    : undefined
            }
            onPointerUp={() => {
                gesture.current = null;
            }}
            onPointerCancel={() => {
                gesture.current = null;
            }}
            onLostPointerCapture={() => {
                gesture.current = null;
            }}
            onKeyDown={
                interactive
                    ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              stroke();
                          }
                      }
                    : undefined
            }
        >
            {title && <title>{title}</title>}
            <defs>
                <clipPath id={clip}>
                    <rect width="200" height="200" rx={scene ? 24 : 0} />
                </clipPath>
            </defs>
            <g clipPath={`url(#${clip})`}>
                {scene && <image href={background.src} width="200" height="200" preserveAspectRatio="xMidYMid slice" />}
                {scene && (
                    <ellipse
                        cx="100"
                        cy="187"
                        rx="44"
                        ry="6"
                        fill="#14221c"
                        opacity="0.23"
                        className="companion-shadow"
                    />
                )}
                <g
                    className={`companion-idle companion-${species} ${currentMood === "sleepy" ? "companion-sleeping" : ""}`}
                >
                    <g className={affection ? "companion-cuddle" : undefined} data-pet-touch="true">
                        {dressed ? (
                            <WardrobeCharacter
                                species={species}
                                equipped={equipped}
                                mood={currentMood}
                                maskId={`${clip}-wardrobe`}
                            />
                        ) : (
                            character
                        )}
                        {interactive && (
                            <rect
                                x="45"
                                y="45"
                                width="112"
                                height="143"
                                rx="42"
                                fill="transparent"
                                className="companion-touch-area"
                            />
                        )}
                    </g>
                </g>
                {scene && (
                    <rect
                        x="0.5"
                        y="0.5"
                        width="199"
                        height="199"
                        rx="24"
                        fill="none"
                        stroke="white"
                        strokeOpacity="0.1"
                        pointerEvents="none"
                    />
                )}
                {affection > 0 && (
                    <g key={affection} className="companion-hearts" pointerEvents="none" aria-hidden="true">
                        {[
                            [-27, 61],
                            [30, 48],
                            [12, 28],
                        ].map(([offset, y], index) => (
                            <g key={index} className={`companion-heart companion-heart-${index}`}>
                                <path
                                    d="M0 3 C-9 -5 -15 6 0 15 C15 6 9 -5 0 3"
                                    transform={`translate(${100 + offset} ${y}) scale(${index === 1 ? 0.8 : 0.6})`}
                                    fill={index === 1 ? "#f7b39b" : "#ffdbb6"}
                                />
                            </g>
                        ))}
                    </g>
                )}
                {currentMood === "sleepy" && scene && (
                    <g fill="#fff0d7" fontFamily="sans-serif" fontWeight="600" aria-hidden="true" pointerEvents="none">
                        <text x="151" y="61" fontSize="12" className="pet-z">
                            z
                        </text>
                        <text x="165" y="42" fontSize="9" className="pet-z pet-z-late">
                            z
                        </text>
                    </g>
                )}
            </g>
        </svg>
    );
};
