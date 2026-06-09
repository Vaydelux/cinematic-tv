import { Bookmark, Clapperboard, Home, Search, Settings, Tags } from 'lucide-react';

export function Sidebar({ currentView, setCurrentView }: { currentView: string, setCurrentView: (v: string) => void }) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'genre', icon: Tags, label: 'Genres' },
    { id: 'list', icon: Bookmark, label: 'Watchlist' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed left-0 inset-y-0 w-24 bg-black/[0.42] border-r border-white/10 hidden md:flex flex-col items-center py-6 z-50 backdrop-blur-2xl">
      <button
        type="button"
        onClick={() => setCurrentView('home')}
        className="mb-10 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-contrast shadow-[0_18px_44px_rgba(0,0,0,0.36)] ring-1 ring-white/15"
        aria-label="Go home"
      >
        <Clapperboard className="h-6 w-6" />
      </button>
      <div className="flex flex-1 flex-col gap-3">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex h-14 w-16 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold transition ${
                isActive
                  ? 'bg-primary text-primary-contrast shadow-lg shadow-black/30'
                  : 'text-on-surface-variant hover:bg-white/[0.08] hover:text-on-surface'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
              {isActive && <span className="absolute -right-3 top-1/2 h-8 w-1 -translate-y-1/2 rounded-l bg-primary" />}
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-surface-container text-on-surface text-xs rounded-md font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap border border-white/10">
                {item.label}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
