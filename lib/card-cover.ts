const COVER_WIDTH = 856;
const COVER_HEIGHT = 540;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_COVER_LENGTH = 380_000;

export type CardCoverError = "notImage" | "tooBig" | "unreadable";

const loadImage = (file: File) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("unreadable"));
        };
        image.src = url;
    });

export const readCardCover = async (file: File): Promise<string> => {
    if (!file.type.startsWith("image/")) throw new Error("notImage" satisfies CardCoverError);
    if (file.size > MAX_FILE_SIZE) throw new Error("tooBig" satisfies CardCoverError);

    const image = await loadImage(file).catch(() => {
        throw new Error("unreadable" satisfies CardCoverError);
    });

    const scale = Math.max(COVER_WIDTH / image.naturalWidth, COVER_HEIGHT / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;

    const canvas = document.createElement("canvas");
    canvas.width = COVER_WIDTH;
    canvas.height = COVER_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("unreadable" satisfies CardCoverError);

    context.imageSmoothingQuality = "high";
    context.drawImage(image, (COVER_WIDTH - width) / 2, (COVER_HEIGHT - height) / 2, width, height);

    for (const quality of [0.82, 0.7, 0.58, 0.45]) {
        const data = canvas.toDataURL("image/jpeg", quality);
        if (data.length <= MAX_COVER_LENGTH) return data;
    }

    throw new Error("tooBig" satisfies CardCoverError);
};
