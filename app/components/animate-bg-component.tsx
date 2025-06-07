'use client'

import { animate, stagger } from 'animejs'

const WaterDropGrid = () => {
    return (
        <div className="relative grid place-content-center px-8 py-12">
            <DotGrid />
        </div>
    )
}

const GRID_WIDTH = 25
const GRID_HEIGHT = 20

const DotGrid = () => {
    const handleDotClick = (e: React.MouseEvent<HTMLElement>) => {
        const target = e.target as HTMLElement
        const index = Number(target.dataset.index)

        animate('.dot-point', {
            scale: [
                { to: '1.35', ease: 'easeOutSine', duration: 250 },
                { to: '1', ease: 'easeInOutQuad', duration: 500 },
            ],
            translateY: [
                { to: '-15', ease: 'easeOutSine', duration: 250 },
                { to: 0, ease: 'easeInOutQuad', duration: 500 },
            ],
            opacity: [
                { to: '1', ease: 'easeOutSine', duration: 250 },
                { to: '0.5', ease: 'easeInOutQuad', duration: 500 },
            ],
            delay: stagger(100, {
                grid: [GRID_WIDTH, GRID_HEIGHT],
                from: index,
            }),
        })
    }

    const dots = []
    let index = 0

    for (let i = 0; i < GRID_WIDTH; i++) {
        for (let j = 0; j < GRID_HEIGHT; j++) {
            dots.push(
                <div
                    className="group cursor-crosshair rounded-full p-2 transition-colors hover:bg-slate-600"
                    data-index={index}
                    key={`${i}-${j}`}
                >
                    <div
                        className="dot-point h-2 w-2 rounded-full bg-gradient-to-b from-slate-700 to-slate-400 opacity-50 group-hover:from-indigo-600 group-hover:to-white"
                        data-index={index}
                    />
                </div>
            )
            index++
        }
    }

    return (
        <div
            onClick={handleDotClick}
            style={{ gridTemplateColumns: `repeat(${GRID_WIDTH}, 1fr)` }}
            className="grid w-fit"
        >
            {dots}
        </div>
    )
}

export default WaterDropGrid
