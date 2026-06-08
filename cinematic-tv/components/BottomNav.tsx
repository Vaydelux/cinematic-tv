import { Home, Search, Bookmark, Settings } from 'lucide-react';

export function BottomNav({ currentView, setCurrentView }: { currentView: string, setCurrentView: (v: string) => void }) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'list', icon: Bookmark, label: 'Watchlist' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 h-16 bg-black/70 border-t border-white/10 md:hidden z-50 flex items-center justify-around px-2 backdrop-blur-xl">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button 
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
              isActive ? 'text-white' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className={`p-1.5 rounded-md mb-0.5 ${isActive ? 'bg-primary' : ''}`}>
              <Icon className="w-[18px] h-[18px]" />
            </span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
