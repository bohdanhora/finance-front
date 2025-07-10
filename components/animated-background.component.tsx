import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

// @ts-ignore
import CELLS from 'vanta/dist/vanta.cells.min'

type VantaEffect = {
    destroy: () => void
}

const VantaBackground = () => {
    const vantaRef = useRef<HTMLDivElement>(null)
    const [vantaEffect, setVantaEffect] = useState<VantaEffect | null>(null)

    useEffect(() => {
        if (!vantaEffect && vantaRef.current) {
            setVantaEffect(
                CELLS({
                    el: vantaRef.current,
                    THREE,
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    minHeight: 200.0,
                    minWidth: 200.0,
                    scale: 1.0,
                    color1: 0xffffff,
                    color2: 0x000000,
                    size: 0.9,
                    speed: 0.6,
                })
            )
        }
        return () => {
            if (vantaEffect) vantaEffect.destroy()
        }
    }, [vantaEffect])

    return <div ref={vantaRef} style={styles.vanta} />
}

const styles: { vanta: React.CSSProperties } = {
    vanta: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        zIndex: -1,
        top: 0,
        left: 0,
    },
}

export default VantaBackground
