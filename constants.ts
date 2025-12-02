
import { PromptTemplates, RatioOption, VeoPromptConfig, VoiceData } from './types';

export const RATIO_OPTIONS: RatioOption[] = [
    { key: '9:16', label: 'PORTRAIT (9:16)', ratio: { width: 9, height: 16 } },
    { key: '1:1', label: 'SQUARE (1:1)', ratio: { width: 1, height: 1 } },
    { key: '16:9', label: 'LANDSCAPE (16:9)', ratio: { width: 16, height: 9 } },
];

export const LANGUAGE_OPTIONS = ['Indonesia', 'English', 'Sunda', 'Jawa', 'Melayu', 'Arab'];

export const CAMERA_ANGLES = [
    'Eye-Level Angle',
    'High Angle',
    'Low Angle',
    'Dutch Angle (Tilted Angle)',
    'Bird’s Eye / Top Angle'
];

export const PROMPT_TEMPLATES: PromptTemplates = {
    'B-Roll': [
        { title: "B-Roll: Detail Makro", text: `B-Roll. Foto makro super detail dari produk referensi, menonjolkan tekstur dan detail terkecilnya. Gunakan pencahayaan studio yang tajam untuk menyorot kualitas produk. Latar belakang netral. Pastikan produk terlihat identik dengan referensi.`}, 
        { title: "B-Roll: Flat Lay Minimalis", text: `B-Roll. Foto produk referensi dari sudut pandang atas (top-down view) dengan gaya flat lay minimalis. Produk menjadi pusat perhatian. Pencahayaan lembut dan merata. Pastikan produk terlihat identik dengan referensi.`}, 
        { title: "B-Roll: Adegan Dinamis", text: `B-Roll. Foto produk referensi dalam sebuah adegan dinamis. Jika makanan, tunjukkan remah-remah di sekitarnya. Jika minuman, tunjukkan percikan. Tampilkan produk seolah-olah baru saja digunakan. Pastikan produk terlihat identik dengan referensi.`}, 
        { title: "B-Roll: Alami dengan Properti", text: `B-Roll. Foto produk referensi diletakkan secara alami di atas permukaan yang relevan. Tambahkan satu properti sederhana yang tidak mencuri fokus. Efek depth of field (bokeh) pada latar belakang. Pastikan produk terlihat identik dengan referensi.`} 
    ],
    'UGC': [
        { title: "UGC: Kasual", text: `UGC. Replikasi model dari foto referensi, pastikan wajah SANGAT IDENTIK. Gaya foto seperti hasil jepretan kamera mirrorless Sony full frame dengan detail ultra-realistis dan pencahayaan sinematik. Dia sedang menggunakan produk referensi dengan pose kasual.`}, 
        { title: "UGC: Bersemangat", text: `UGC. Replikasi model dari foto referensi, pastikan wajah SANGAT IDENTIK. Gaya foto seperti hasil jepretan kamera mirrorless Sony full frame dengan detail ultra-realistis dan pencahayaan sinematik. Dia sedang menggunakan produk referensi dengan pose bersemangat.`}, 
        { title: "UGC: Santai", text: `UGC. Replikasi model dari foto referensi, pastikan wajah SANGAT IDENTIK. Gaya foto seperti hasil jepretan kamera mirrorless Sony full frame dengan detail ultra-realistis dan pencahayaan sinematik. Dia sedang menggunakan produk referensi dengan pose santai.`}, 
        { title: "UGC: Sudut Berbeda", text: `UGC. Replikasi model dari foto referensi, pastikan wajah SANGAT IDENTIK. Gaya foto seperti hasil jepretan kamera mirrorless Sony full frame dengan detail ultra-realistis dan pencahayaan sinematik. Dia sedang menggunakan produk referensi, diambil dari sudut berbeda.`} 
    ]
    // PHOTO PRODUK removed to be replaced by specialized Video Scene Generator
};

export const VOICE_DATA: VoiceData[] = [
    { name: "Achernar", gender: "Wanita", style: "Narator", description: "Lembut, Halus" },
    { name: "Charon", gender: "Pria", style: "Narator", description: "Informatif, Stabil" },
    { name: "Erinome", gender: "Wanita", style: "Pendidik", description: "Jelas, Bersih" },
    { name: "Iapetus", gender: "Pria", style: "Pendidik", description: "Jelas, Berwibawa" },
    { name: "Kore", gender: "Pria", style: "Meyakinkan", description: "Tegas, Profesional" },
    { name: "Sulafat", gender: "Netral", style: "Meyakinkan", description: "Hangat, Ramah" },
    { name: "Puck", gender: "Wanita", style: "Pelatih", description: "Upbeat, Semangat" },
    { name: "Zephyr", gender: "Netral", style: "Pelatih", description: "Energik, Cerah" },
    { name: "Sadachbia", gender: "Wanita", style: "Motivator", description: "Bersemangat, Hidup" },
    { name: "Fenrir", gender: "Pria", style: "Motivator", description: "Penuh Gairah, Semangat" },
    { name: "Vindemiatrix", gender: "Wanita", style: "Ekspresif", description: "Lembut, Menarik, Drama" },
    { name: "Algenib", gender: "Pria", style: "Ekspresif", description: "Serak, Dalam, Drama" },
];

export const VEO_PROMPT_DATA: VeoPromptConfig = {
    // Subject and Dialogue removed from here to be handled dynamically
    action: { label: "2. Aksi/Tindakan (Keseluruhan)", type: 'text', placeholder: "Contoh: sedang memasak sup di atas perahu layar" },
    expression: { label: "3. Ekspresi (Umum)", type: 'text', placeholder: "Contoh: wajahnya bersemangat dan sedikit panik" },
    place: { label: "4. Tempat", type: 'text', placeholder: "Contoh: di tengah badai di Laut Arktik yang beku" },
    time: { 
        label: "5. Waktu (Pilihan)", 
        type: 'select', 
        options: [
            { value: "Bright Daylight", label: "Siang Hari yang Cerah" },
            { value: "Golden Hour Sunset", label: "Sore Hari Emas (Golden Hour)" },
            { value: "Foggy Misty Dawn", label: "Subuh Berkabut" },
            { value: "Deep Night, Ambient Light", label: "Malam Hari, Cahaya Sekitar" }
        ]
    },
    camera_motion: {
        label: "6. Gerakan Kamera (EN/ID)",
        type: 'select',
        options: [
            { value: "Static Shot", label: "Static Shot (Bidikan Statis)" },
            { value: "Pan", label: "Pan (Geser Horizontal)" },
            { value: "Tilt", label: "Tilt (Geser Vertikal)" },
            { value: "Dolly", label: "Dolly (Maju/Mundur)" },
            { value: "Truck", label: "Trucking (Geser Samping)" },
            { value: "Pedestal", label: "Pedestal (Naik/Turun)" },
            { value: "Roll", label: "Roll (Gulingan Kamera)" },
            { value: "Zoom In", label: "Zoom In (Perbesar)" },
            { value: "Zoom Out", label: "Zoom Out (Perkecil)" },
            { value: "Crane Shot", label: "Crane Shot (Bidikan Derek)" },
            { value: "3D Rotation", label: "3D Rotation (Rotasi 3D)" },
            { value: "Handheld Camera", label: "Handheld Camera (Genggam)" },
            { value: "Tracking Shot", label: "Tracking Shot (Bidikan Pelacakan)" }
        ]
    },
    lighting: { 
        label: "7. Pencahayaan", 
        type: 'select', 
        options: [
            { value: "Dramatic Side Lighting", label: "Cahaya Samping Dramatis" },
            { value: "Soft Natural Light", label: "Cahaya Alami yang Lembut" },
            { value: "High-Key, Bright Lighting", label: "High-Key (Sangat Terang)" },
            { value: "Low-Key, Dark Contrast", label: "Low-Key (Kontras Gelap)" },
            { value: "Colored Studio Lighting", label: "Pencahayaan Studio Berwarna" }
        ]
    },
    video_style: { 
        label: "8. Gaya Video", 
        type: 'select', 
        options: [
            { value: "Cinematic Photorealistic", label: "Fotorealistik Sinematik" },
            { value: "Studio Ghibli Anime", label: "Gaya Anime Studio Ghibli" },
            { value: "Cyberpunk Concept Art", label: "Seni Konsep Cyberpunk" },
            { value: "Retro VHS, Film Grain", label: "Retro VHS, Berbutir" },
            { value: "Oil Painting Style", label: "Gaya Lukisan Cat Minyak" }
        ]
    },
    video_vibe: { 
        label: "9. Suasana Video", 
        type: 'select', 
        options: [
            { value: "Mysterious and Tense", label: "Misterius dan Menegangkan" },
            { value: "Fun and Cheerful", label: "Menyenangkan dan Ceria" },
            { value: "Melancholic and Poetic", label: "Melankolis dan Puitis" },
            { value: "Epic and Grand", label: "Epik dan Kolosal" },
            { value: "Calm and Serene", label: "Tenang dan Damai" }
        ]
    },
    sound_music: { label: "10. Suara atau Musik (SFX)", type: 'text', placeholder: "Contoh: dentuman musik orkestra atau deru ombak" },
    additional_details: { label: "11. Detail Tambahan", type: 'text', placeholder: "Contoh: fokus tajam pada mata anjing laut, efek percikan air, resolusi 8K" }
};