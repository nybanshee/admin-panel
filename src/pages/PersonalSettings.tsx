import { useState, useMemo } from 'react';
import { useAuthStore } from '../store/auth';
import { TechCard } from '../components/TechCard';
import { TechTabControl } from '../components/TechTabControl';
import { ColorPicker } from '../components/ColorPicker';
import { Search, User, Monitor, Bell, Shield, Key, Sliders } from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingItem {
    id: string;
    label: string;
    description: string;
    category: 'appearance' | 'account' | 'system' | 'notifications';
    keywords: string[];
    component: React.ReactNode;
}

export function PersonalSettings() {
    const { user, updateTheme, saveColor, deleteColor } = useAuthStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');

    const categories = [
        { id: 'all', label: 'All Settings', icon: <Sliders className="w-4 h-4" /> },
        { id: 'appearance', label: 'Appearance', icon: <Monitor className="w-4 h-4" /> },
        { id: 'account', label: 'Account', icon: <User className="w-4 h-4" /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    ];

    const settings: SettingItem[] = [
        // Appearance
        {
            id: 'primary-color',
            label: 'Primary Theme Color',
            description: 'Customize the main accent color used throughout the panel.',
            category: 'appearance',
            keywords: ['color', 'theme', 'style', 'paint'],
            component: (
                <div className="mt-4">
                    <ColorPicker 
                        color={user?.theme?.primaryColor || '#0f172a'}
                        onChange={(c) => updateTheme({ primaryColor: c })}
                        savedColors={user?.theme?.savedColors}
                        onSaveColor={saveColor}
                        onDeleteColor={deleteColor}
                    />
                </div>
            )
        },
        {
            id: 'accent-color',
            label: 'Secondary Accent',
            description: 'Secondary highlight color for buttons and active states.',
            category: 'appearance',
            keywords: ['color', 'theme', 'highlight'],
            component: (
                <div className="mt-4">
                    <ColorPicker 
                        color={user?.theme?.accentColor || '#06b6d4'}
                        onChange={(c) => updateTheme({ accentColor: c })}
                        savedColors={user?.theme?.savedColors}
                        onSaveColor={saveColor}
                        onDeleteColor={deleteColor}
                    />
                </div>
            )
        },
        
        // Account
        {
            id: 'username',
            label: 'Display Name',
            description: 'Your public display name visible to other team members.',
            category: 'account',
            keywords: ['name', 'profile', 'identity'],
            component: (
                <div className="mt-2 flex items-center gap-4">
                    <div className="h-10 px-4 bg-slate-900 border border-slate-700 rounded flex items-center text-slate-400 select-none">
                        @{user?.username}
                    </div>
                    <span className="text-xs text-slate-500 italic">Managed by Admin</span>
                </div>
            )
        },
        {
            id: 'password',
            label: 'Change Password',
            description: 'Update your login credentials.',
            category: 'account',
            keywords: ['security', 'login', 'auth'],
            component: (
                <button className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-sm font-bold border border-slate-600 transition-colors flex items-center gap-2">
                    <Key className="w-4 h-4" /> Update Password
                </button>
            )
        },

        // Notifications
        {
            id: 'desktop-notifs',
            label: 'Desktop Notifications',
            description: 'Receive alerts when the app is in the background.',
            category: 'notifications',
            keywords: ['alert', 'push', 'desktop'],
            component: (
                <div className="mt-2 flex items-center gap-2">
                    <div className="w-10 h-5 bg-emerald-500/20 rounded-full relative cursor-pointer border border-emerald-500/50">
                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-emerald-400 rounded-full shadow" />
                    </div>
                    <span className="text-xs font-mono text-emerald-400">ENABLED</span>
                </div>
            )
        }
    ];

    const filteredSettings = useMemo(() => {
        return settings.filter(item => {
            const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = 
                item.label.toLowerCase().includes(searchLower) || 
                item.description.toLowerCase().includes(searchLower) ||
                item.keywords.some(k => k.toLowerCase().includes(searchLower));
            
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, searchQuery, settings]);

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-widest text-white uppercase">
                        Personal <span className="text-cyan-400">Settings</span>
                    </h1>
                    <p className="text-slate-400 font-mono text-sm mt-1">&gt; Customize your workspace experience</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search settings (e.g. 'theme', 'password')..."
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-6">
                    <TechTabControl 
                        activeTab={activeCategory}
                        onChange={setActiveCategory}
                        tabs={categories}
                    />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
                    {filteredSettings.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-500 space-y-4">
                            <Search className="w-12 h-12 opacity-20" />
                            <p>No settings found matching "{searchQuery}"</p>
                        </div>
                    ) : (
                        filteredSettings.map(setting => (
                            <TechCard key={setting.id} className="p-6">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-white">{setting.label}</h3>
                                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono uppercase text-slate-400">
                                                {setting.category}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-sm">{setting.description}</p>
                                    </div>
                                    <div className="w-full md:w-auto">
                                        {setting.component}
                                    </div>
                                </div>
                            </TechCard>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
