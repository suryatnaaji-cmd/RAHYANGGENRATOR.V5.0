import { GoogleAI } from "@google/generative-ai";
import React, { useState, useCallback, useEffect } from 'react';
import { Download, Image, Zap, Loader2, Check, X, Video, Clipboard, Wand2, Edit, RefreshCcw, ListFilter, Film, Plus, Trash2, Upload, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import CustomFileInput from './CustomFileInput';
import { PROMPT_TEMPLATES, RATIO_OPTIONS, LANGUAGE_OPTIONS, CAMERA_ANGLES } from '../constants';
import { fileToBase64, copyToClipboard, downloadImage, delay } from '../utils'; // Import delay
import { PromptTemplate } from '../types';


const ImageGenerator: React.FC = () => {
    // State management
    const [productImageBase64, setProductImageBase64] = useState<string[]>([]);
    const [productDescription, setProductDescription] = useState('');
    const [modelImageBase64, setModelImageBase64] = useState<string[]>([]);
    const [modelDescriptions, setModelDescriptions] = useState<string[]>([]);
    const [selectedRatio, setSelectedRatio] = useState(RATIO_OPTIONS[0].key);
    const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGE_OPTIONS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false); // New state to control visibility
    
    // Results
    const [results, setResults] = useState<Record<string, (string | null)[]>>({
        'B-Roll': Array(4).fill(null),
        'UGC': Array(4).fill(null),
    });
    
    const [finalPrompts, setFinalPrompts] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Video Prompts State
    const [videoPrompts, setVideoPrompts] = useState<Record<string, (string | null)[]>>({
        'B-Roll': Array(4).fill(null),
        'UGC': Array(4).fill(null),
    });
    const [videoPromptLoading, setVideoPromptLoading] = useState<Record<string, boolean[]>>({
        'B-Roll': Array(4).fill(false),
        'UGC': Array(4).fill(false),
    });

    const [selectedPromptTypes, setSelectedPromptTypes] = useState<Record<string, Record<number, string>>>({
        'B-Roll': {},
        'UGC': {}
    });

    const [cinematicPrompts, setCinematicPrompts] = useState<Record<string, (string | null)[]>>({
        'B-Roll': Array(4).fill(null),
        'UGC': Array(4).fill(null),
    });
    const [cinematicPromptLoading, setCinematicPromptLoading] = useState<Record<string, boolean[]>>({
        'B-Roll': Array(4).fill(false),
        'UGC': Array(4).fill(false),
    });

    // Veo Video Generation State
    const [generatedVideos, setGeneratedVideos] = useState<Record<string, string>>({});
    const [videoGenLoading, setVideoGenLoading] = useState<Record<string, boolean>>({});

    // Edit and Regenerate State
    const [openEditMenu, setOpenEditMenu] = useState<string | null>(null);
    const [editedImages, setEditedImages] = useState<Record<string, string>>({});
    const [editLoading, setEditLoading] = useState<string | null>(null);
    const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);

    // Lightbox
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxImageSrc, setLightboxImageSrc] = useState('');

    useEffect(() => {
        if (modelImageBase64.length !== modelDescriptions.length) {
            setModelDescriptions(prev => {
                const diff = modelImageBase64.length - prev.length;
                if (diff > 0) return [...prev, ...new Array(diff).fill('')];
                return prev.slice(0, modelImageBase64.length);
            });
        }
    }, [modelImageBase64.length]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string[]>>, isMultiple = false, maxFiles = 2) => {
        const files = Array.from(event.target.files || []) as File[];
        if (files.length === 0) return;

        if (isMultiple) {
             const newFiles = files.slice(0, maxFiles);
             const base64Promises = newFiles.map(fileToBase64);
             const newBase64s = await Promise.all(base64Promises);
             setter(prev => [...prev, ...newBase64s].slice(0, maxFiles));
        } else {
            const base64 = await fileToBase64(files[0]);
            setter([base64]);
        }
        setError(null);
    };

    const buildFullPrompt = (baseTemplatePrompt: PromptTemplate, categoryKey: string) => {
        const ratioOptions = RATIO_OPTIONS.find(o => o.key === selectedRatio);
        const ratioKey = ratioOptions ? ratioOptions.key : '9:16';
        const modelDescText = modelDescriptions.filter(d => d && d.trim().length > 0).join(' dan model kedua: ');
        const isProductDescriptionProvided = productDescription && productDescription.trim() !== '';

        let modelIntegrationInstruction = '';
        if (categoryKey === 'UGC' && modelImageBase64.length > 0) {
            modelIntegrationInstruction = `
                PENTING UNTUK MODEL: Replikasi model dari foto referensi. Gunakan produk dari foto-foto produk utama dan tampilkan bersama model yang dihasilkan AI. Wajah model HARUS identik dengan foto model yang diunggah secara terpisah. JANGAN meniru wajah apapun yang mungkin ada di foto-foto produk.
                ${modelDescText ? `Keterangan tambahan untuk model: ${modelDescText}.` : ''}
            `;
        } else {
            modelIntegrationInstruction = ` PENTING: Tanpa model manusia di gambar ini. Fokus hanya pada produk.`;
        }

        return `
            Anda adalah pakar Image-to-Image (I2I) dan DALL-E. Tugas Anda adalah menghasilkan konten visual yang sangat detail dan realistis untuk tujuan pemasaran afiliasi.
            
            # ATURAN UTAMA
            1. REPLIKASI PRODUK: Produk yang dihasilkan HARUS terlihat 100% IDENTIK dengan gambar-gambar referensi produk utama.
            2. GAYA FOTO: Gunakan gaya fotografi komersial, ultra-realistis, dan sinematik.
            3. RAHASIA & OUTPUT: JANGAN PERNAH mengembalikan teks. Fokus hanya pada payload gambar Base64.
            4. INTRUKSI FINAL: Gambar ini akan dipotong menjadi rasio ${ratioKey}.
            5. PENTING: Jika ada wajah manusia di gambar-gambar referensi produk utama, ABAIKAN wajah tersebut.
            6. RASIO: Pastikan aspek rasio output adalah ${ratioKey}.
            7. PENTING (ANTI-TEKS): JANGAN PERNAH menambahkan teks buatan AI.

            # KONTEKS GAMBAR:
            - JENIS KONTEN: ${baseTemplatePrompt.title}
            - RASIO OUTPUT: ${ratioKey}
            - DESKRIPSI KONSEP UTAMA: ${baseTemplatePrompt.text}. ${isProductDescriptionProvided ? `Integrasikan suasana dan latar belakang berikut: "${productDescription}".` : ''}
            
            # DETAIL SPESIFIK:
            ${modelIntegrationInstruction}
            
            PENTING: Latar belakang, suasana, dan properti foto harus sesuai dengan konteks ini.
        `;
    };

    const generateImage = async (prompt: string, category: string, index: number): Promise<string> => {
       const genAI = new GoogleAI(import.meta.env.VITE_GEMINI_API_KEY);
        const shouldSendModelImages = category === 'UGC' && modelImageBase64.length > 0;
        
        const parts = [
            { text: prompt },
            ...productImageBase64.map(base64 => ({ inlineData: { mimeType: 'image/jpeg', data: base64 } })),
            ...(shouldSendModelImages ? modelImageBase64.map(base64 => ({ inlineData: { mimeType: 'image/jpeg', data: base64 } })) : [])
        ];

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image', 
                contents: [{ parts }],
                config: {
                    imageConfig: {
                        aspectRatio: selectedRatio
                    }
                }
            });
            
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
                return imagePart.inlineData.data; 
            } else {
                 const textPart = response.candidates?.[0]?.content?.parts?.find(p => p.text);
                 throw new Error(textPart?.text || "No image data returned.");
            }
        } catch (err) {
            throw err;
        }
    };

    const generateTextFromImage = async (prompt: string, imageBase64: string | null = null, retries = 3): Promise<string> => {
        const genAI = new GoogleAI(import.meta.env.VITE_GEMINI_API_KEY);
        
        const contents: any[] = [{ text: prompt }];
        if (imageBase64) {
            const data = imageBase64.startsWith('data:') ? imageBase64.split(',')[1] : imageBase64;
            contents.push({ inlineData: { mimeType: 'image/jpeg', data: data } });
        }

        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: contents,
                    config: {
                        responseMimeType: 'text/plain' 
                    }
                });

                if (response.candidates?.[0]?.finishReason === 'SAFETY') {
                    throw new Error(`Safety Block: Content may violate safety guidelines.`);
                }
                const text = response.text;
                if (!text) {
                    if (attempt < retries - 1) { await delay(1500); continue; }
                    throw new Error(`No text data returned from API.`);
                }
                return text;
            } catch (e: any) {
                console.error(`Attempt ${attempt + 1} failed for text generation:`, e);
                if (attempt === retries - 1) throw e;
                await delay(2000 * (attempt + 1));
            }
        }
        throw new Error("Max retries reached for text generation.");
    };


    const handleGenerate = async () => {
        if (productImageBase64.length === 0) {
            setError("Harap unggah setidaknya satu Foto Produk (utama) terlebih dahulu."); 
            return;
        }

        setShowResults(true); // Show the results panel immediately
        setIsLoading(true);
        // Reset states (Only for B-Roll and UGC)
        setResults({ 'B-Roll': Array(4).fill(null), 'UGC': Array(4).fill(null) });
        setVideoPrompts({ 'B-Roll': Array(4).fill(null), 'UGC': Array(4).fill(null) });
        setCinematicPrompts({ 'B-Roll': Array(4).fill(null), 'UGC': Array(4).fill(null) });
        setEditedImages({});
        setGeneratedVideos({});
        setVideoGenLoading({});
        setFinalPrompts([]);
        setError(null);

        const tasks: {category: string, index: number, prompt: string}[] = [];
        const promptsList: string[] = [];

        for (const categoryKey in PROMPT_TEMPLATES) {
            PROMPT_TEMPLATES[categoryKey].forEach((template, index) => {
                const prompt = buildFullPrompt(template, categoryKey);
                tasks.push({ category: categoryKey, index, prompt });
                promptsList.push(prompt);
            });
        }
        setFinalPrompts(promptsList);
        
        for (const task of tasks) {
            try {
                const base64 = await generateImage(task.prompt, task.category, task.index);
                setResults(prev => {
                    const newRes = { ...prev };
                    if (!newRes[task.category]) newRes[task.category] = [];
                    newRes[task.category][task.index] = base64;
                    return newRes;
                });
            } catch (err: any) {
                console.error(`Failed ${task.category} ${task.index}`, err);
            }
            await delay(500); 
        }
        setIsLoading(false);
    };
    
    // ... (Existing Video Prompt and Cinematic Prompt handlers kept as is) ...
    const handleGenerateVideoPrompt = async (category: string, index: number, imageBase64: string | null) => {
        if (!imageBase64) return;
        setVideoPromptLoading(prev => {
            const copy = {...prev}; copy[category][index] = true; return copy;
        });

        const selectedType = selectedPromptTypes[category]?.[index];
        let inspirationStyle = '';
        if (selectedType && category === 'UGC') {
             const defs: Record<string, string> = {
                'Hook': "Buat kalimat pembuka (HOOK) yang sangat menarik perhatian dalam 3 detik pertama.",
                'Masalah': "Fokus pada MASALAH (Pain Point) yang sering dialami audiens.",
                'Solusi': "Fokus pada SOLUSI dan MANFAAT utama produk.",
                'CTA': "Fokus pada CALL TO ACTION (Ajakan Bertindak)."
            };
            if (defs[selectedType]) inspirationStyle = `MODUS KHUSUS: ${selectedType}. ${defs[selectedType]}`;
        }

        const prompt = `
            Anda adalah copywriter. Buat prompt video (skenario) singkat berdasarkan GAMBAR INI.
            Produk: ${productDescription || 'produk di gambar'}
            Bahasa Dialog: ${selectedLanguage}
            
            Tugas: Buat skenario video pendek (5-10 detik) dan DIALOG KREATIF.
            ${inspirationStyle}
            
            Format Output:
            **Suasana:** ...
            **Gaya Kamera:** ...
            **Dialog (${selectedLanguage}):** ...
        `;

        try {
            const text = await generateTextFromImage(prompt, imageBase64);
            setVideoPrompts(prev => {
                const copy = {...prev}; copy[category][index] = text || null; return copy;
            });
        } catch (e) {
            console.error(e);
        } finally {
            setVideoPromptLoading(prev => {
                const copy = {...prev}; copy[category][index] = false; return copy;
            });
        }
    };

    const handleGenerateCinematicPrompt = async (category: string, index: number, imageBase64: string | null) => {
        if (!imageBase64) return;
         setCinematicPromptLoading(prev => {
            const copy = {...prev}; copy[category][index] = true; return copy;
        });

        const prompt = `
            Analyze this image and write a highly detailed, cinematic 'text-to-image' prompt in English to recreate it. 
            Focus on subject, lighting, atmosphere, and composition. One paragraph only.
        `;

        try {
            const text = await generateTextFromImage(prompt, imageBase64);
            setCinematicPrompts(prev => {
                const copy = {...prev}; copy[category][index] = text || null; return copy;
            });
        } catch (e) {
             console.error(e);
        } finally {
            setCinematicPromptLoading(prev => {
                const copy = {...prev}; copy[category][index] = false; return copy;
            });
        }
    };

    const handleGenerateEdit = async (categoryKey: string, index: number, originalImage: string | null, angle: string) => {
        if (!originalImage) return;
        const itemKey = `${categoryKey}-${index}`;
        const editKey = `${itemKey}-${angle}`;
        setEditLoading(editKey);

        const prompt = `
            EDIT GAMBAR INI.
            Ubah sudut kamera menjadi: "${angle}".
            JANGAN mengubah subjek atau produk. Pertahankan gaya asli.
        `;

        try {
            const genAI = new GoogleAI(import.meta.env.VITE_GEMINI_API_KEY);
            const parts = [
                { text: prompt },
                { inlineData: { mimeType: 'image/jpeg', data: originalImage } }, 
                ...productImageBase64.map(b => ({ inlineData: { mimeType: 'image/jpeg', data: b } }))
            ];
             const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: [{ parts }],
                config: {
                    imageConfig: {
                        aspectRatio: selectedRatio
                    }
                }
            });
            const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (imagePart?.inlineData?.data) {
                setEditedImages(prev => ({ ...prev, [editKey]: imagePart.inlineData!.data }));
            }
        } catch (err: any) {
             setError(`Edit failed: ${err.message}`);
        } finally {
            setEditLoading(null);
        }
    };

    const handleRegenerateSingle = async (categoryKey: string, index: number, template: PromptTemplate) => {
        const itemKey = `${categoryKey}-${index}`;
        setRegeneratingKey(itemKey);
        try {
            const prompt = buildFullPrompt(template, categoryKey);
            const base64 = await generateImage(prompt, categoryKey, index);
            setResults(prev => {
                const copy = {...prev}; copy[categoryKey][index] = base64; return copy;
            });
            setVideoPrompts(prev => { const c = {...prev}; c[categoryKey][index] = null; return c; });
            setCinematicPrompts(prev => { const c = {...prev}; c[categoryKey][index] = null; return c; });
            setEditedImages(prev => {
                const copy = {...prev};
                Object.keys(copy).forEach(k => { if (k.startsWith(itemKey)) delete copy[k]; });
                return copy;
            });
            setGeneratedVideos(prev => { const c = {...prev}; delete c[itemKey]; return c; });
        } catch (err: any) {
            setError(`Regenerate failed: ${err.message}`);
        } finally {
            setRegeneratingKey(null);
        }
    };

    const handleGenerateVeoVideo = async (category: string, index: number, imageBase64: string) => {
        if ((window as any).aistudio && !await (window as any).aistudio.hasSelectedApiKey()) {
            await (window as any).aistudio.openSelectKey();
        }

        const itemKey = `${category}-${index}`;
        setVideoGenLoading(prev => ({...prev, [itemKey]: true}));

        try {
            const genAI = new GoogleAI(import.meta.env.VITE_GEMINI_API_KEY);
            let promptText = "Cinematic product shot, slow motion, high quality, 4k, photorealistic";
            if (videoPrompts[category]?.[index]) {
                const scenerioText = videoPrompts[category][index];
                if (scenerioText) {
                    // Try to extract only visual parts if it's too long, or use as is
                    promptText = `${scenerioText}. Cinematic, high resolution.`;
                }
            }
            
            // --- STRICT RATIO VEO ---
            const veoRatio = selectedRatio === '16:9' ? '16:9' : '9:16';

            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: promptText,
                image: {
                    imageBytes: imageBase64,
                    mimeType: 'image/jpeg'
                },
                config: {
                   numberOfVideos: 1,
                   resolution: '720p',
                   aspectRatio: veoRatio
                }
            });

            while (!operation.done) {
                await delay(10000); 
                operation = await ai.operations.getVideosOperation({operation});
            }

            if (operation.error) {
                throw new Error(`Veo API Error: ${operation.error.message}`);
            }

            const responseVal = operation.response || (operation as any).result;
            const uri = responseVal?.generatedVideos?.[0]?.video?.uri;

            if (uri) {
                const vidResp = await fetch(`${uri}&key=${process.env.API_KEY}`);
                if (!vidResp.ok) throw new Error("Failed to download video bytes");
                const blob = await vidResp.blob();
                const blobUrl = URL.createObjectURL(blob);
                setGeneratedVideos(prev => ({...prev, [itemKey]: blobUrl}));
            } else {
                throw new Error("Video generation completed but no URI returned.");
            }

        } catch (e: any) {
            console.error("Video Gen Error:", e);
            let msg = e.message || "Terjadi kesalahan.";
            if (JSON.stringify(e).includes("RESOURCE_EXHAUSTED") || msg.includes("429")) {
                msg = "⚠️ KUOTA HABIS (429). Cek Plan Billing Google Cloud Anda atau tunggu reset.";
            }
            setError(`Video Generation Failed: ${msg}`);
        } finally {
             setVideoGenLoading(prev => ({...prev, [itemKey]: false}));
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            {/* Input Section - Full Width */}
            <div className="w-full space-y-6">
                <div className="p-6 bg-gray-100/80 rounded-2xl shadow-xl border border-gray-300/50 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold mb-4 flex items-center text-emerald-600">
                        <Zap className="w-6 h-6 mr-2" /> Input Generator
                    </h2>
                    
                    <CustomFileInput
                        id="product-upload-main"
                        label="1. Unggah Foto Produk (utama) - Wajib (Maks 2)" 
                        onChange={(e) => handleFileChange(e, setProductImageBase64, true, 2)} 
                        preview={productImageBase64}
                        onDelete={(idx) => setProductImageBase64(prev => prev.filter((_, i) => i !== idx))}
                        multiple={true}
                        maxFiles={2}
                    />

                    <div className="mt-6">
                        <label className="text-sm font-semibold text-gray-800 block mb-1">
                            2. Deskripsi Produk & Konsep Foto (Opsional)
                        </label>
                        <textarea
                            rows={3}
                            value={productDescription}
                            onChange={(e) => setProductDescription(e.target.value)}
                            placeholder="Contoh: Kaos ini sangat bagus. Konsep foto di kamar estetik, suasana santai pada malam hari"
                            className="w-full p-3 text-sm text-gray-900 bg-white/80 rounded-lg border border-gray-400 focus:ring-emerald-400 resize-none"
                        />
                    </div>

                    <div className="mt-6">
                        <CustomFileInput
                            id="model-upload"
                            label="3. Unggah Foto Model (Opsional, Max 2) - Hanya untuk UGC"
                            onChange={(e) => handleFileChange(e, setModelImageBase64, true, 2)}
                            preview={modelImageBase64}
                            multiple={true}
                            maxFiles={2}
                            modelDescription={modelDescriptions}
                            onModelDescriptionChange={(idx, val) => setModelDescriptions(prev => { const n = [...prev]; n[idx] = val; return n; })}
                            onDelete={(idx) => {
                                setModelImageBase64(prev => prev.filter((_, i) => i !== idx));
                                setModelDescriptions(prev => prev.filter((_, i) => i !== idx));
                            }}
                        />
                    </div>

                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-800 block mb-1">4. Pilih Rasio</label>
                            <select
                                value={selectedRatio}
                                onChange={(e) => setSelectedRatio(e.target.value)}
                                className="w-full p-3 text-sm bg-white/80 rounded-lg border border-gray-400"
                            >
                                {RATIO_OPTIONS.map(option => (
                                    <option key={option.key} value={option.key}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                             <label className="text-sm font-semibold text-gray-800 block mb-1">5. Pilih Bahasa Output</label>
                            <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="w-full p-3 text-sm bg-white/80 rounded-lg border border-gray-400"
                            >
                                {LANGUAGE_OPTIONS.map(lang => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-300/50">
                        {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading || productImageBase64.length === 0}
                            className={`w-full text-white font-bold py-3 px-6 rounded-xl shadow-lg flex justify-center items-center transition duration-300
                                ${isLoading || productImageBase64.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                        >
                            {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</> : <><Zap className="w-5 h-5 mr-2" /> Generate 8 Konten (B-Roll & UGC)</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Section - Full Width, appearing below */}
            {showResults && (
                <div className="w-full space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="p-6 bg-gray-100/80 rounded-2xl shadow-xl border border-gray-300/50 backdrop-blur-sm">
                        <h2 className="text-2xl font-bold mb-4 flex items-center text-purple-600">
                            <Download className="w-6 h-6 mr-2" /> Hasil Generator
                        </h2>
                        
                        <div className="space-y-12">
                            {/* 1. Static Images (B-Roll & UGC) */}
                            {Object.keys(results).map(categoryKey => (
                                <div key={categoryKey}>
                                    <h3 className="text-xl font-bold text-emerald-600 mb-4 border-b border-gray-300 pb-2">{categoryKey}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {PROMPT_TEMPLATES[categoryKey].map((template, index) => {
                                            const itemKey = `${categoryKey}-${index}`;
                                            const img = results[categoryKey][index];
                                            const isRegen = regeneratingKey === itemKey;
                                            const videoUrl = generatedVideos[itemKey];
                                            const isVideoLoading = videoGenLoading[itemKey];
                                            
                                            return (
                                                <div key={itemKey} className="flex flex-col items-center w-full bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                                    <div className={`image-container w-full ${selectedRatio === '1:1' ? 'aspect-square' : (selectedRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-[16/9]')} bg-gray-200 rounded-xl border-4 border-dashed ${isLoading || isRegen ? 'border-purple-500' : 'border-gray-400'} flex items-center justify-center overflow-hidden mb-4`}>
                                                        {isLoading || isRegen ? (
                                                            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                                                        ) : img ? (
                                                            <>
                                                                <img src={`data:image/jpeg;base64,${img}`} alt="Generated" className="w-full h-full object-cover" />
                                                            </>
                                                        ) : null}
                                                    </div>

                                                    {img && (
                                                        <div className="w-full space-y-3">
                                                            <div className="flex justify-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                                                <button onClick={() => { setLightboxImageSrc(`data:image/jpeg;base64,${img}`); setIsLightboxOpen(true); }} className="bg-purple-600/80 p-2 rounded text-white hover:bg-purple-600 flex-1 flex justify-center"><Image className="w-5 h-5" /></button>
                                                                <button onClick={() => downloadImage(img!, `gen_${itemKey}.jpg`)} className="bg-emerald-600/80 p-2 rounded text-white hover:bg-emerald-600 flex-1 flex justify-center"><Download className="w-5 h-5" /></button>
                                                                <button onClick={() => handleRegenerateSingle(categoryKey, index, template)} disabled={!!regeneratingKey} className="bg-blue-500/80 p-2 rounded text-white hover:bg-blue-500 flex-1 flex justify-center"><RefreshCcw className="w-5 h-5" /></button>
                                                            </div>

                                                            {videoPrompts[categoryKey][index] ? (
                                                                <div className="p-3 bg-gray-200/70 rounded-lg text-xs">
                                                                    <div className="font-bold text-blue-700 mb-1 flex items-center"><Video className="w-3 h-3 mr-1"/> Skenario</div>
                                                                    <div className="whitespace-pre-wrap mb-2">{videoPrompts[categoryKey][index]}</div>
                                                                    <button onClick={() => copyToClipboard(videoPrompts[categoryKey][index]!)} className="w-full bg-emerald-600 text-white py-1 rounded flex items-center justify-center"><Clipboard className="w-3 h-3 mr-1"/> Salin</button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col gap-2">
                                                                    {categoryKey === 'UGC' && (
                                                                        <select 
                                                                            className="text-xs p-2 rounded border"
                                                                            onChange={(e) => setSelectedPromptTypes(prev => ({...prev, [categoryKey]: {...prev[categoryKey], [index]: e.target.value}}))}
                                                                            defaultValue=""
                                                                        >
                                                                            <option value="">-- Tipe Script --</option>
                                                                            <option value="Hook">Hook</option>
                                                                            <option value="Masalah">Masalah</option>
                                                                            <option value="Solusi">Solusi</option>
                                                                            <option value="CTA">CTA</option>
                                                                        </select>
                                                                    )}
                                                                    <button 
                                                                        onClick={() => handleGenerateVideoPrompt(categoryKey, index, img)}
                                                                        disabled={videoPromptLoading[categoryKey][index]}
                                                                        className="w-full bg-blue-400 text-white text-xs py-2 rounded flex justify-center items-center hover:bg-blue-500"
                                                                    >
                                                                        {videoPromptLoading[categoryKey][index] ? <Loader2 className="w-3 h-3 animate-spin"/> : <Video className="w-3 h-3 mr-1"/>} Buat Skenario
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {cinematicPrompts[categoryKey][index] ? (
                                                                <div className="p-3 bg-gray-200/70 rounded-lg text-xs">
                                                                    <div className="font-bold text-teal-700 mb-1 flex items-center"><Wand2 className="w-3 h-3 mr-1"/> Cinematic Prompt</div>
                                                                    <div className="whitespace-pre-wrap mb-2">{cinematicPrompts[categoryKey][index]}</div>
                                                                    <button onClick={() => copyToClipboard(cinematicPrompts[categoryKey][index]!)} className="w-full bg-emerald-600 text-white py-1 rounded flex items-center justify-center"><Clipboard className="w-3 h-3 mr-1"/> Salin</button>
                                                                </div>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => handleGenerateCinematicPrompt(categoryKey, index, img)}
                                                                    disabled={cinematicPromptLoading[categoryKey][index]}
                                                                    className="w-full bg-teal-500 text-white text-xs py-2 rounded flex justify-center items-center hover:bg-teal-600"
                                                                >
                                                                    {cinematicPromptLoading[categoryKey][index] ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3 mr-1"/>} Buat Prompt Cinematic
                                                                </button>
                                                            )}

                                                            <div className="pt-2 border-t border-gray-300/50">
                                                                {!videoUrl && (
                                                                    <button
                                                                        onClick={() => handleGenerateVeoVideo(categoryKey, index, img!)}
                                                                        disabled={isVideoLoading}
                                                                        className={`w-full text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center transition duration-300 shadow-md ${isVideoLoading ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 text-white shadow-red-900/40'}`}
                                                                    >
                                                                        {isVideoLoading ? (
                                                                            <>
                                                                                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                                                                Generating Video (Veo)...
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Film className="w-4 h-4 mr-1.5" />
                                                                                Generate Video (Veo)
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                )}
                                                                
                                                                {videoUrl && (
                                                                    <div className="mt-2 bg-gray-200/50 p-2 rounded-lg border border-gray-300">
                                                                        <video 
                                                                            src={videoUrl} 
                                                                            controls 
                                                                            autoPlay 
                                                                            loop 
                                                                            className="w-full rounded-md shadow-sm mb-2"
                                                                        />
                                                                        <a 
                                                                            href={videoUrl} 
                                                                            download={`veo_${itemKey}.mp4`}
                                                                            className="w-full bg-emerald-600 text-white text-xs py-2 rounded flex justify-center items-center hover:bg-emerald-700 font-medium"
                                                                        >
                                                                            <Download className="w-4 h-4 mr-1.5"/> Download Video
                                                                        </a>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {isLightboxOpen && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setIsLightboxOpen(false)}>
                    <div className="relative max-w-full max-h-full">
                        <button className="absolute -top-10 right-0 text-white hover:text-gray-300" onClick={() => setIsLightboxOpen(false)}><X className="w-8 h-8"/></button>
                        <img src={lightboxImageSrc} className="max-w-full max-h-[85vh] object-contain rounded" onClick={(e) => e.stopPropagation()} alt="Lightbox"/>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageGenerator;
