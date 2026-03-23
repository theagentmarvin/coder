import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-surface-container border-b border-outline-variant">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary-container text-xl">
                architecture
              </span>
            </div>
            <div>
              <h1 className="font-headline text-xl text-on-surface">KINETIC_BIM</h1>
              <p className="text-xs text-on-surface-variant font-label">Project Manager</p>
            </div>
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className="px-3 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
            >
              Dashboard
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
