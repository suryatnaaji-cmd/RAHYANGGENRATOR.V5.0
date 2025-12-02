
import React, { useState, useEffect } from 'react';
import TTSGenerator from './components/TTSGenerator';
import ImageGenerator from './components/ImageGenerator';
import VeoPromptCrafter from './components/VeoPromptCrafter';
import GoogleFlowPanel from './components/GoogleFlowPanel';
import CharacterGenerator from './components/CharacterGenerator';
import FoodDrinkGenerator from './components/FoodDrinkGenerator';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import AnimationGenerator from './components/AnimationGenerator';
import VideoSceneCreator from './components/VideoSceneCreator';
import { User } from './types';
import { 
    LogOut, 
    Shield, 
    Mic, 
    Image, 
    Clapperboard, 
    Video, 
    User as UserIcon, 
    Coffee, 
    Globe, 
    Menu, 
    X,
    ChevronRight,
    Sparkles,
    Film
} from 'lucide-react';

type Page = 'ttsGenerator' | 'imageGenerator' | 'veoCrafter' | 'googleFlow' | 'characterGenerator' | 'foodDrinkGenerator' | 'adminPanel' | 'animationGenerator' | 'videoSceneCreator';

const App: React.FC = () => {
    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Initialize page state from localStorage or default to 'ttsGenerator'
    const [page, setPage] = useState<Page>(() => {
        const savedPage = localStorage.getItem('currentPage');
        return (savedPage as Page) || 'ttsGenerator';
    });

    // Save current page to localStorage whenever it changes
    useEffect(() => {
        if (isAuthenticated) {
            localStorage.setItem('currentPage', page);
        }
    }, [page, isAuthenticated]);

    // Handle Login Logic
    const handleLogin = (user: User) => {
        setCurrentUser(user);
        setIsAuthenticated(true);
        if (user.role !== 'admin' && page === 'adminPanel') {
            setPage('ttsGenerator');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setCurrentUser(null);
        localStorage.removeItem('currentPage');
    };

    // Menu Items Configuration
    const menuItems = [
        { id: 'ttsGenerator', label: 'Text To Voice', icon: Mic, desc: 'Gemini TTS' },
        { id: 'imageGenerator', label: 'Images Generator', icon: Image, desc: 'Imagen 4.0 & Veo' },
        { id: 'videoSceneCreator', label: 'Video Scene Creator', icon: Film, desc: 'Veo 3 Story Mode' },
        { id: 'animationGenerator', label: 'Create Animasi', icon: Clapperboard, desc: 'Story & Video' },
        { id: 'veoCrafter', label: 'Veo 3 Prompter', icon: Video, desc: 'Video Prompting' },
        { id: 'characterGenerator', label: 'Create Karakter', icon: UserIcon, desc: 'Character Design' },
        { id: 'foodDrinkGenerator', label: 'Food & Drink', icon: Coffee, desc: 'Product Photo' },
        { id: 'googleFlow', label: 'Google Labs', icon: Globe, desc: 'Flow Browser' },
    ];

    if (currentUser?.role === 'admin') {
        menuItems.push({ id: 'adminPanel', label: 'Admin Panel', icon: Shield, desc: 'User Manager' });
    }

    // If not authenticated, show Login Screen
    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
            
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* SIDEBAR NAVIGATION */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50 w-72 bg-[#0f1117] text-white transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Sidebar Header */}
                <div className="h-20 flex items-center px-6 border-b border-gray-800 bg-[#161922]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white leading-none">RAHYANG</h1>
                            <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Generator V4.6</span>
                        </div>
                    </div>
                    <button 
                        className="ml-auto lg:hidden text-gray-400 hover:text-white"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Main Tools</p>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = page === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setPage(item.id as Page);
                                    setIsSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                                    ${isActive 
                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/20' 
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-emerald-400'} transition-colors`} />
                                <div className="flex-1 text-left">
                                    <div className="text-sm font-medium">{item.label}</div>
                                    <div className={`text-[10px] ${isActive ? 'text-emerald-100' : 'text-gray-600 group-hover:text-gray-400'}`}>{item.desc}</div>
                                </div>
                                {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
                            </button>
                        );
                    })}
                </nav>

                {/* Sidebar Footer (User Info) */}
                <div className="p-4 border-t border-gray-800 bg-[#161922]">
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {currentUser?.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {currentUser?.username}
                            </p>
                            <p className="text-xs text-emerald-500 capitalize">
                                {currentUser?.role}
                            </p>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-100/50">
                {/* Mobile Header */}
                <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <span className="font-bold text-gray-800">RAHYANG AI</span>
                    </div>
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 scroll-smooth">
                    <div className="max-w-7xl mx-auto min-h-full">
                         {/* Dynamic Page Rendering */}
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'ttsGenerator' ? 'block' : 'hidden'}`}>
                            <TTSGenerator />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'imageGenerator' ? 'block' : 'hidden'}`}>
                            <ImageGenerator />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'videoSceneCreator' ? 'block' : 'hidden'}`}>
                            <VideoSceneCreator />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'animationGenerator' ? 'block' : 'hidden'}`}>
                            <AnimationGenerator />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'veoCrafter' ? 'block' : 'hidden'}`}>
                            <VeoPromptCrafter />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'characterGenerator' ? 'block' : 'hidden'}`}>
                            <CharacterGenerator />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'foodDrinkGenerator' ? 'block' : 'hidden'}`}>
                            <FoodDrinkGenerator />
                        </div>
                        <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'googleFlow' ? 'block' : 'hidden'}`}>
                            <GoogleFlowPanel />
                        </div>
                        
                        {currentUser?.role === 'admin' && (
                            <div className={`animate-in fade-in zoom-in-95 duration-300 ${page === 'adminPanel' ? 'block' : 'hidden'}`}>
                                <AdminPanel />
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
