
import React, { useState } from 'react';
import { Film, Loader2, Sparkles, Plus, Trash2, Image, Wand2, Download, Crop, Languages, Eye, RefreshCw, X } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { fileToBase64, delay, downloadImage } from '../utils';
import { RATIO_OPTIONS, LANGUAGE_OPTIONS } from '../constants';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface VideoScene {
    id: number;
    image: string | null;
    prompt: string;
    videoUrl: string | null;
    isLoadingVideo: boolean;
    isLoadingPrompt: boolean;
    isRegeneratingImage?: boolean;
    type?: string; // HOOK, PROBLEM, SOLUTION, CTA
}

const VideoSceneCreator: React.FC = () => {
    // State
    const [scenes, setScenes] = useState<VideoScene[]>([
        { id: 1, image: null, prompt: '', videoUrl: null, isLoadingVideo: false, isLoadingPrompt: false, type: 'HOOK' }
    ]);
    const [isAutoGeneratingScenes, setIsAutoGeneratingScenes] = useState(false);
    const [selectedRatio, setSelectedRatio] = useState(RATIO_OPTIONS[0].key);
    const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGE_OPTIONS[0]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Helper: Generate Text using Gemini (Private inside component to avoid external deps issues)
    const generateTextFromImage = async (prompt: string, imageBase64: string | null = null, retries = 3): Promise<string> => {
        const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
        
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
                    config: { responseMimeType: 'text/plain' }
                });

                const text = response.text;
                if (!text) {
                    if (attempt < retries - 1) { await delay(1500); continue; }
                    throw new Error(`No text data returned from API.`);
                }
                return text;
            } catch (e: any) {
                if (attempt === retries - 1) throw e;
                await delay(2000 * (attempt + 1));
            }
        }
        throw new Error("Max retries reached.");
    };

    // --- HANDLERS ---

    const handleAddScene = () => {
        if (scenes.length < 4) {
            setScenes(prev => [...prev, { id: Date.now(), image: null, prompt: '', videoUrl: null, isLoadingVideo: false, isLoadingPrompt: false, type: 'SCENE' }]);
        }
    };

    const handleRemoveScene = (id: number) => {
        setScenes(prev => prev.filter(s => s.id !== id));
    };

    const handleSceneImageUpload = async (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const base64 = await fileToBase64(file);
            setScenes(prev => prev.map(s => s.id === id ? { ...s, image: base64, videoUrl: null } : s));
        }
    };

    const handleScenePromptChange = (id: number, value: string) => {
        setScenes(prev => prev.map(s => s.id === id ? { ...s, prompt: value } : s));
    };

    const handleGenerateScenePrompt = async (id: number) => {
        const scene = scenes.find(s => s.id === id);
        const img = scene?.image;
        
        if (!img) {
            alert("Harap unggah gambar scene terlebih dahulu.");
            return;
        }

        setScenes(prev => prev.map(s => s.id === id ? { ...s, isLoadingPrompt: true } : s));
        try {
            const prompt = `
                Analyze this image.
                1. Create a short script/dialogue (max 1 sentence) strictly in ${selectedLanguage}.
                2. Create a high-quality, cinematic English visual prompt for Veo (max 50 words).
                
                Output format:
                Script: [Script in ${selectedLanguage}]
                
                Visual Prompt (Veo): [English Visual Prompt]
            `;
            const text = await generateTextFromImage(prompt, img);
            setScenes(prev => prev.map(s => s.id === id ? { ...s, prompt: text } : s));
        } catch (err) {
            console.error(err);
        } finally {
            setScenes(prev => prev.map(s => s.id === id ? { ...s, isLoadingPrompt: false } : s));
        }
    };

    const handleRegenerateImage = async (id: number) => {
        // We need Scene 1 as the Anchor/Reference
        const scene1 = scenes[0];
        const currentScene = scenes.find(s => s.id === id);
        
        if (!scene1 || !scene1.image) {
            alert("Scene 1 (Gambar Utama) diperlukan sebagai referensi karakter.");
            return;
        }
        if (!currentScene) return;

        // If trying to regen Scene 1, just warn user or allow variation? 
        // Typically Scene 1 is the upload anchor.
        if (id === scene1.id && !isAutoGeneratingScenes) {
             const confirm = window.confirm("Scene 1 adalah referensi utama. Me-refresh ini akan mengubah wajah karakter untuk scene lainnya. Lanjutkan?");
             if (!confirm) return;
        }

        setScenes(prev => prev.map(s => s.id === id ? { ...s, isRegeneratingImage: true } : s));

        try {
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
            
            // Extract visual prompt part if possible, otherwise use full prompt
            let visualPrompt = currentScene.prompt;
            if (visualPrompt.includes("Visual Prompt (Veo):")) {
                visualPrompt = visualPrompt.split("Visual Prompt (Veo):")[1].trim();
            }

            const consistencyPrompt = `
                Create a photorealistic image based on the reference image provided.
                MANDATORY: The character's face, hair, clothing, and general style MUST BE IDENTICAL to the reference image.
                
                SCENE ACTION/CONTEXT: ${visualPrompt}
                
                Make sure the lighting and quality match the reference. Cinematic 8K.
            `;

            const parts = [
                { text: consistencyPrompt },
                { inlineData: { mimeType: 'image/jpeg', data: scene1.image! } } // Always refer to Scene 1
            ];

            const imgResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: [{ parts }],
                config: { imageConfig: { aspectRatio: selectedRatio } }
            });

            const imgPart = imgResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
            if (imgPart?.inlineData?.data) {
                setScenes(prev => prev.map(s => s.id === id ? { ...s, image: imgPart.inlineData.data, videoUrl: null } : s));
            } else {
                throw new Error("Tidak ada data gambar yang dikembalikan.");
            }

        } catch (err: any) {
            console.error("Regenerate Image Error:", err);
            alert("Gagal me-refresh gambar: " + err.message);
        } finally {
            setScenes(prev => prev.map(s => s.id === id ? { ...s, isRegeneratingImage: false } : s));
        }
    };

    const handleGenerateSceneVideo = async (id: number) => {
        if ((window as any).aistudio && !await (window as any).aistudio.hasSelectedApiKey()) {
            await (window as any).aistudio.openSelectKey();
        }

        const scene = scenes.find(s => s.id === id);
        if (!scene || !scene.prompt) return;
        const img = scene.image; 

        setScenes(prev => prev.map(s => s.id === id ? { ...s, isLoadingVideo: true, videoUrl: null } : s));

        try {
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
            
            const veoRatio = selectedRatio === '16:9' ? '16:9' : '9:16'; // Veo mostly supports these

            // --- IMPROVED PROMPT PARSING FOR LANGUAGE SYNC ---
            let finalPrompt = scene.prompt;
            let scriptContent = "";
            let visualContent = scene.prompt;

            if (scene.prompt.includes("Visual Prompt (Veo):")) {
                const parts = scene.prompt.split("Visual Prompt (Veo):");
                visualContent = parts[1].trim(); 
                
                const scriptPart = parts[0];
                const scriptMatch = scriptPart.match(/Script:\s*["“']?([^"”'\n]+)["”']?/i);
                
                if (scriptMatch && scriptMatch[1]) {
                    scriptContent = scriptMatch[1].trim();
                } else {
                    const simpleSplit = scriptPart.split(/Script:\s*/i);
                    if (simpleSplit.length > 1) {
                         scriptContent = simpleSplit[1].trim().replace(/^["“]/, '').replace(/["”]$/, '');
                    }
                }
            }

            if (scriptContent) {
                finalPrompt = `${visualContent} \n\nIMPORTANT: The character is speaking in ${selectedLanguage}. Dialogue: "${scriptContent}".`;
            } else {
                finalPrompt = visualContent;
            }

            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: finalPrompt,
                image: img ? { imageBytes: img, mimeType: 'image/jpeg' } : undefined,
                config: { numberOfVideos: 1, resolution: '720p', aspectRatio: veoRatio }
            });

            while (!operation.done) {
                await delay(8000);
                operation = await ai.operations.getVideosOperation({operation});
            }

            if (operation.error) throw new Error(`Veo API Error: ${operation.error.message}`);

            const responseVal = operation.response || (operation as any).result;
            const uri = responseVal?.generatedVideos?.[0]?.video?.uri;

            if (uri) {
                const vidResp = await fetch(`${uri}&key=${process.env.API_KEY}`);
                const blob = await vidResp.blob();
                setScenes(prev => prev.map(s => s.id === id ? { ...s, videoUrl: URL.createObjectURL(blob) } : s));
            } else {
                 throw new Error("Video berhasil dibuat namun URL tidak ditemukan.");
            }

        } catch (err: any) {
            console.error("Scene Gen Error:", err);
            let msg = err.message || "Gagal membuat video.";
            if (JSON.stringify(err).includes("RESOURCE_EXHAUSTED") || msg.includes("429")) {
                msg = "⚠️ KUOTA HABIS (429). Cek Plan Billing Google Cloud Anda.";
            }
            alert(msg);
        } finally {
            setScenes(prev => prev.map(s => s.id === id ? { ...s, isLoadingVideo: false } : s));
        }
    };

    // --- AUTO STORY GENERATOR ---
    const handleAutoGenerateStory = async () => {
        const scene1 = scenes[0];
        if (!scene1.image) {
            alert("Harap unggah FOTO di Scene 1 terlebih dahulu sebagai referensi utama.");
            return;
        }

        setIsAutoGeneratingScenes(true);

        try {
            const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

            const analysisPrompt = `
                Analyze this image (Scene 1). This is the "Hook".
                Create a 4-scene video promotion strategy for this product/person.
                
                IMPORTANT: Write the "script_id" (Dialogue/Voiceover) strictly in ${selectedLanguage} language.

                Structure:
                1. HOOK: Catchy opening. Example in ${selectedLanguage}.
                2. PROBLEM: The pain point. Example in ${selectedLanguage}.
                3. SOLUTION: The product/service details. Example in ${selectedLanguage}.
                4. CTA: Call to Action. Example in ${selectedLanguage}.

                Output JSON format ONLY:
                [
                    { "type": "HOOK", "script_id": "Script text in ${selectedLanguage}", "visual_en": "Detailed English visual prompt for Veo, describing the scene based on the reference image action." },
                    { "type": "PROBLEM", "script_id": "Script text in ${selectedLanguage}", "visual_en": "Detailed English visual prompt. Character looks sad/concerned or showing the problem. SAME CHARACTER FACE/CLOTHES as reference." },
                    { "type": "SOLUTION", "script_id": "Script text in ${selectedLanguage}", "visual_en": "Detailed English visual prompt. Character happy, holding product, glowing. SAME CHARACTER FACE/CLOTHES as reference." },
                    { "type": "CTA", "script_id": "Script text in ${selectedLanguage}", "visual_en": "Detailed English visual prompt. Character showing product to camera, inviting. SAME CHARACTER FACE/CLOTHES as reference." }
                ]
            `;

            const textResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    { text: analysisPrompt },
                    { inlineData: { mimeType: 'image/jpeg', data: scene1.image } }
                ],
                config: { responseMimeType: 'application/json' }
            });

            const storyPlan = JSON.parse(textResponse.text || '[]');
            
            if (!Array.isArray(storyPlan) || storyPlan.length !== 4) {
                throw new Error("Gagal membuat struktur cerita. Coba lagi.");
            }

            let updatedScenes: VideoScene[] = [];

            // Scene 1
            updatedScenes.push({
                ...scene1,
                prompt: `[HOOK] Script: "${storyPlan[0].script_id}"\n\nVisual Prompt (Veo): ${storyPlan[0].visual_en}`,
                type: 'HOOK'
            });

            // Scene 2, 3, 4
            for (let i = 1; i < 4; i++) {
                const plan = storyPlan[i];
                const consistencyPrompt = `
                    Create a photorealistic image based on the reference image (Scene 1).
                    MANDATORY: The character's face, hair, clothing, and general style MUST BE IDENTICAL to the reference image.
                    SCENE CONTEXT (${plan.type}): ${plan.visual_en}
                    Make sure the lighting and quality match the reference. Cinematic 8K.
                `;

                const parts = [
                    { text: consistencyPrompt },
                    { inlineData: { mimeType: 'image/jpeg', data: scene1.image } }
                ];

                const imgResponse = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: [{ parts }],
                    config: { imageConfig: { aspectRatio: selectedRatio } }
                });

                let generatedImage = null;
                const imgPart = imgResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
                if (imgPart?.inlineData?.data) {
                    generatedImage = imgPart.inlineData.data;
                }

                updatedScenes.push({
                    id: Date.now() + i,
                    image: generatedImage,
                    prompt: `[${plan.type}] Script: "${plan.script_id}"\n\nVisual Prompt (Veo): ${plan.visual_en}`,
                    videoUrl: null,
                    isLoadingVideo: false,
                    isLoadingPrompt: false,
                    type: plan.type
                });

                setScenes([...updatedScenes]);
                await delay(1000);
            }

        } catch (err: any) {
            console.error("Auto Story Error:", err);
            alert("Gagal membuat cerita otomatis: " + err.message);
        } finally {
            setIsAutoGeneratingScenes(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
             <div className="p-6 bg-gray-100/80 rounded-2xl shadow-xl border border-gray-300/50 backdrop-blur-sm">
                <h2 className="text-2xl font-bold mb-6 flex items-center text-red-600 border-b border-gray-300 pb-2">
                    <Film className="w-8 h-8 mr-2" /> VIDEO SCENE CREATOR (Veo 3)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                     <div>
                        <label className="text-sm font-semibold text-gray-800 block mb-1 flex items-center gap-2">
                             <Crop className="w-4 h-4"/> Rasio Video & Gambar
                        </label>
                        <select
                            value={selectedRatio}
                            onChange={(e) => setSelectedRatio(e.target.value)}
                            className="w-full p-3 text-sm bg-white rounded-lg border border-gray-400 focus:ring-red-500"
                        >
                            {RATIO_OPTIONS.map(option => (
                                <option key={option.key} value={option.key}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                         <label className="text-sm font-semibold text-gray-800 block mb-1 flex items-center gap-2">
                            <Languages className="w-4 h-4"/> Bahasa Script/Dialog
                        </label>
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="w-full p-3 text-sm bg-white rounded-lg border border-gray-400 focus:ring-red-500"
                        >
                            {LANGUAGE_OPTIONS.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleAutoGenerateStory}
                            disabled={isAutoGeneratingScenes || !scenes[0]?.image}
                            className={`text-white text-sm px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg 
                                ${isAutoGeneratingScenes || !scenes[0]?.image 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/30 animate-pulse'}`}
                            title="Generate Scene 2, 3, 4 otomatis berdasarkan Scene 1"
                        >
                            {isAutoGeneratingScenes ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5" />}
                            <div className="text-left">
                                <div className="font-bold">Auto-Create Full Story</div>
                                <div className="text-[10px] font-normal opacity-90">Hook, Masalah, Solusi, CTA (4 Scene)</div>
                            </div>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 mr-2">Manual Mode:</span>
                        {scenes.length < 4 && !isAutoGeneratingScenes && (
                            <button 
                                onClick={handleAddScene}
                                className="bg-red-600 hover:bg-red-500 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg shadow-red-900/20"
                            >
                                <Plus className="w-4 h-4" /> Tambah Scene
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="space-y-8">
                    {scenes.map((scene, idx) => (
                        <div key={scene.id} className={`bg-white p-6 rounded-3xl border shadow-sm relative group transition-all duration-500 ${scene.type === 'HOOK' ? 'border-purple-300 ring-2 ring-purple-50' : 'border-gray-200'}`}>
                            
                            <div className="flex justify-between items-center mb-4">
                                <div className={`text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md ${scene.type ? 'bg-purple-600' : 'bg-gray-800'}`}>
                                    SCENE {idx + 1} {scene.type ? `- ${scene.type}` : ''}
                                </div>
                                {scenes.length > 1 && !isAutoGeneratingScenes && (
                                    <button 
                                        onClick={() => handleRemoveScene(scene.id)}
                                        className="text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 p-2 rounded-full border border-gray-200 transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                {/* Image Input Section */}
                                <div className="md:col-span-5 flex flex-col gap-3">
                                    <div className={`w-full ${selectedRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'} bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center overflow-hidden relative transition group-hover:shadow-md ${scene.image ? 'border-none' : 'hover:border-red-400'}`}>
                                        {scene.image ? (
                                            <>
                                                <img src={`data:image/jpeg;base64,${scene.image}`} alt={`Scene ${idx+1}`} className="w-full h-full object-cover" />
                                                
                                                {/* HOVER OVERLAY: ACTION BUTTONS */}
                                                {!isAutoGeneratingScenes && !scene.isRegeneratingImage && (
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                                        <button 
                                                            onClick={() => setPreviewImage(`data:image/jpeg;base64,${scene.image}`)}
                                                            className="p-3 bg-white/20 hover:bg-white text-white hover:text-gray-900 rounded-full transition-all shadow-lg border border-white/20"
                                                            title="Preview Fullscreen"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => downloadImage(scene.image!, `Scene-${idx+1}.jpg`)}
                                                            className="p-3 bg-white/20 hover:bg-white text-white hover:text-gray-900 rounded-full transition-all shadow-lg border border-white/20"
                                                            title="Download Image"
                                                        >
                                                            <Download className="w-5 h-5" />
                                                        </button>
                                                        {idx > 0 && ( // Enable Refresh for non-anchor scenes mostly
                                                            <button 
                                                                onClick={() => handleRegenerateImage(scene.id)}
                                                                className="p-3 bg-white/20 hover:bg-white text-white hover:text-gray-900 rounded-full transition-all shadow-lg border border-white/20"
                                                                title="Refresh/Regenerate Image"
                                                            >
                                                                <RefreshCw className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {/* LOADING OVERLAY */}
                                                {scene.isRegeneratingImage && (
                                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10">
                                                        <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                                                        <span className="text-white text-xs font-bold">Refreshing...</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-center text-gray-400 p-4">
                                                <Image className="w-10 h-10 mx-auto mb-2" />
                                                <span className="text-xs font-medium block">
                                                    {idx === 0 ? "Upload Referensi Utama (Wajib)" : "Auto-Generated / Upload"}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {/* File Input is only active if no image or meant for upload */}
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={(e) => handleSceneImageUpload(scene.id, e)}
                                            className={`absolute inset-0 opacity-0 cursor-pointer ${scene.image ? 'z-[-1]' : 'z-10'}`} // Hide input behind if image exists so buttons work
                                            disabled={isAutoGeneratingScenes || !!scene.isRegeneratingImage}
                                        />
                                    </div>
                                    <div className="text-center text-xs text-gray-500">
                                        {idx === 0 ? "Foto ini menjadi 'DNA' untuk scene selanjutnya." : "Gambar dibuat otomatis agar konsisten."}
                                    </div>
                                </div>

                                {/* Prompt & Action Section */}
                                <div className="md:col-span-7 flex flex-col gap-4">
                                    <div className="relative flex-1">
                                        <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">Script & Visual Prompt</label>
                                        <textarea 
                                            value={scene.prompt}
                                            onChange={(e) => handleScenePromptChange(scene.id, e.target.value)}
                                            placeholder={isAutoGeneratingScenes ? "Sedang membuat prompt..." : "Format: [SCRIPT] ... \nVisual Prompt (Veo): ..."}
                                            rows={8}
                                            readOnly={isAutoGeneratingScenes}
                                            className="w-full h-full p-4 text-sm border border-gray-300 rounded-2xl focus:ring-red-400 focus:border-red-400 resize-none bg-gray-50 focus:bg-white transition-colors"
                                        />
                                        {!isAutoGeneratingScenes && (
                                            <button 
                                                onClick={() => handleGenerateScenePrompt(scene.id)}
                                                disabled={scene.isLoadingPrompt}
                                                className="absolute bottom-4 right-4 text-purple-600 hover:text-purple-800 p-2 hover:bg-purple-100 rounded-lg transition"
                                                title="Buat Prompt Otomatis dari Gambar"
                                            >
                                                {scene.isLoadingPrompt ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                                            </button>
                                        )}
                                    </div>

                                    {/* Video Output / Generate Button */}
                                    <div className="mt-auto">
                                        {scene.videoUrl ? (
                                            <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-lg border border-gray-700">
                                                <video src={scene.videoUrl} controls className="w-full h-auto max-h-[300px]" />
                                                <div className="p-3 bg-gray-800 flex justify-end border-t border-gray-700">
                                                    <a href={scene.videoUrl} download={`scene_${idx+1}.mp4`} className="text-xs font-bold text-white bg-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-500 flex items-center gap-2 transition">
                                                        <Download className="w-4 h-4" /> Download Video
                                                    </a>
                                                </div>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => handleGenerateSceneVideo(scene.id)}
                                                disabled={!scene.prompt || scene.isLoadingVideo || isAutoGeneratingScenes}
                                                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition flex items-center justify-center gap-2
                                                    ${!scene.prompt || scene.isLoadingVideo || isAutoGeneratingScenes
                                                        ? 'bg-gray-400 cursor-not-allowed' 
                                                        : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-red-900/30'}`}
                                            >
                                                {scene.isLoadingVideo ? (
                                                    <><Loader2 className="w-5 h-5 animate-spin" /> Rendering Scene...</>
                                                ) : (
                                                    <><Film className="w-5 h-5" /> Generate Video Scene</>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* FULLSCREEN PREVIEW MODAL */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewImage(null)}
                >
                    <button 
                        onClick={() => setPreviewImage(null)}
                        className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-3 bg-white/10 rounded-full hover:bg-white/20 z-50"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    
                    <img 
                        src={previewImage} 
                        alt="Fullscreen Preview" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()} 
                    />
                </div>
            )}
        </div>
    );
};

export default VideoSceneCreator;
