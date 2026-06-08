import { Home, Search, Bookmark, Settings } from 'lucide-react';

export function Sidebar({ currentView, setCurrentView }: { currentView: string, setCurrentView: (v: string) => void }) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'list', icon: Bookmark, label: 'Watchlist' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed left-0 inset-y-0 w-20 bg-black/[0.45] border-r border-white/10 hidden md:flex flex-col items-center py-6 z-50 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setCurrentView('home')}
        className="w-11 h-11 rounded-lg bg-primary text-white mb-10 flex items-center justify-center font-display font-bold text-xl shadow-[0_12px_34px_rgba(244,63,70,0.35)]"
        aria-label="Go home"
      >
        C
      </button>
      <div className="flex flex-col gap-3 flex-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`p-3 rounded-lg transition-colors relative group ${
                isActive
                  ? 'text-white bg-white/[0.12] ring-1 ring-white/10'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-white/[0.08]'
              }`}
            >
              <Icon className="w-6 h-6" />
              {isActive && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-primary" />}
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
