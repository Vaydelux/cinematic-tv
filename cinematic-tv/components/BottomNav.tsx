import { Home, Search, Bookmark, Settings, Tags } from 'lucide-react';

export function BottomNav({ currentView, setCurrentView }: { currentView: string, setCurrentView: (v: string) => void }) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'genre', icon: Tags, label: 'Genres' },
    { id: 'list', icon: Bookmark, label: 'Watchlist' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="safe-bottom-bar fixed bottom-0 inset-x-0 z-50 flex items-center justify-around border-t border-white/10 bg-black/75 px-2 backdrop-blur-2xl md:hidden">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button 
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex h-full min-w-0 flex-1 flex-col items-center justify-center transition-colors ${
              isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className={`mb-1 rounded-xl p-2 ${isActive ? 'bg-primary text-primary-contrast shadow-lg shadow-black/30' : ''}`}>
              <Icon className="w-[18px] h-[18px]" />
            </span>
            <span className="max-w-full truncate text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
