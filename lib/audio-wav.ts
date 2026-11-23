const SAMPLE_RATE = 16000;

const writeText = (view: DataView, offset: number, text: string) => {
    for (let index = 0; index < text.length; index += 1) view.setUint8(offset + index, text.charCodeAt(index));
};

const encodeWav = (samples: Float32Array, sampleRate: number) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    writeText(view, 0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeText(view, 8, "WAVE");
    writeText(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeText(view, 36, "data");
    view.setUint32(40, samples.length * 2, true);

    samples.forEach((sample, index) => {
        const clamped = Math.max(-1, Math.min(1, sample));
        view.setInt16(44 + index * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    });

    return new Blob([buffer], { type: "audio/wav" });
};

export const toSpeechWav = async (recording: Blob): Promise<Blob> => {
    const context = new AudioContext();
    try {
        const decoded = await context.decodeAudioData(await recording.arrayBuffer());
        const length = Math.max(1, Math.ceil(decoded.duration * SAMPLE_RATE));
        const offline = new OfflineAudioContext(1, length, SAMPLE_RATE);
        const source = offline.createBufferSource();
        source.buffer = decoded;
        source.connect(offline.destination);
        source.start();
        const rendered = await offline.startRendering();
        return encodeWav(rendered.getChannelData(0), SAMPLE_RATE);
    } finally {
        void context.close();
    }
};

export const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
