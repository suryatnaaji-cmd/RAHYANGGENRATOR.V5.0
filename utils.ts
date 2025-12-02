
import { User } from './types';

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = (error) => reject(error);
    });
};

export const copyToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (!successful) {
             console.error('Copy fallback failed');
        }
    } catch (err) {
        console.error('Copy fallback exception: ', err);
    }
    
    document.body.removeChild(textArea);
};

export const downloadImage = (base64Data: string, filename: string) => {
    try {
        const link = document.createElement('a');
        link.href = `data:image/jpeg;base64,${base64Data}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) {
        console.error("Programmatic download failed:", err);
        window.open(`data:image/jpeg;base64,${base64Data}`, '_blank');
    }
};

// Audio Utils
function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export function pcmToWav(pcm16: Int16Array, sampleRate: number): Blob {
    const numChannels = 1;
    const bytesPerSample = 2; // 16-bit PCM
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    
    const dataLength = pcm16.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    let offset = 0;

    // RIFF chunk
    writeString(view, offset, 'RIFF'); offset += 4;
    view.setUint32(offset, 36 + dataLength, true); offset += 4;
    writeString(view, offset, 'WAVE'); offset += 4;

    // FMT sub-chunk
    writeString(view, offset, 'fmt '); offset += 4;
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint16(offset, numChannels, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, byteRate, true); offset += 4;
    view.setUint16(offset, blockAlign, true); offset += 2;
    view.setUint16(offset, bytesPerSample * 8, true); offset += 2;

    // DATA sub-chunk
    writeString(view, offset, 'data'); offset += 4;
    view.setUint32(offset, dataLength, true); offset += 4;

    for (let i = 0; i < pcm16.length; i++) {
        view.setInt16(offset, pcm16[i], true);
        offset += bytesPerSample;
    }

    return new Blob([view], { type: 'audio/wav' });
}

export const compressImage = (base64Str: string, maxWidth = 800): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8)); // Output JPEG 80% quality
        };
    });
};

export const cropImageToRatio = (base64Str: string, ratio: string): Promise<string> => {
    return new Promise((resolve) => {
        if (!ratio || ratio === 'Original') {
            resolve(base64Str);
            return;
        }

        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            let targetWidth = img.width;
            let targetHeight = img.height;
            let sourceX = 0;
            let sourceY = 0;

            // Calculate target dimensions and source offsets for center crop
            if (ratio === '1:1') {
                const minDim = Math.min(img.width, img.height);
                targetWidth = minDim;
                targetHeight = minDim;
            } else if (ratio === '4:5') { // Portrait Feed
                const aspectRatioVal = 4 / 5;
                if (img.width / img.height > aspectRatioVal) { // Image is wider than target ratio
                    targetHeight = img.height;
                    targetWidth = img.height * aspectRatioVal;
                } else { // Image is taller than target ratio
                    targetWidth = img.width;
                    targetHeight = img.width / aspectRatioVal;
                }
            } else if (ratio === '16:9') { // Landscape
                const aspectRatioVal = 16 / 9;
                if (img.width / img.height > aspectRatioVal) { // Image is wider than target ratio
                    targetWidth = img.width;
                    targetHeight = img.width / aspectRatioVal;
                } else { // Image is taller than target ratio
                    targetHeight = img.height;
                    targetWidth = img.width / aspectRatioVal;
                }
            } else if (ratio === '9:16') { // Story
                const aspectRatioVal = 9 / 16;
                if (img.width / img.height > aspectRatioVal) { // Image is wider than target ratio
                    targetHeight = img.height;
                    targetWidth = img.height * aspectRatioVal;
                } else { // Image is taller than target ratio
                    targetWidth = img.width;
                    targetHeight = img.width / aspectRatioVal;
                }
            }

            sourceX = (img.width - targetWidth) / 2;
            sourceY = (img.height - targetHeight) / 2;

            canvas.width = targetWidth;
            canvas.height = targetHeight;

            ctx?.drawImage(img, sourceX, sourceY, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);
            resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
    });
};

// Added delay function
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Auth Utils ---

const STORAGE_KEY = 'rahyang_users';

export const getStoredUsers = (): User[] => {
    const usersStr = localStorage.getItem(STORAGE_KEY);
    if (!usersStr) {
        // Initialize default users if not found
        const defaults: User[] = [
            { username: 'admin', password: 'admin123', role: 'admin' },
            { username: 'user', password: 'user123', role: 'user' }
        ];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
        return defaults;
    }
    return JSON.parse(usersStr);
};

export const saveUsers = (users: User[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};
