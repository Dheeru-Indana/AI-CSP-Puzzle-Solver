import { Link, useLocation } from 'react-router';
import { Brain, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';

export function Navbar() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isHome = location.pathname === '/';

  return (
    <nav className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-xl group-hover:scale-105 transition-transform">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">AI Constraint Solver</h1>
              <p className="text-xs text-muted-foreground">Intelligent Puzzle Platform</p>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            {!isHome && (
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                <Link to="/">
                  <Button variant="ghost" size="sm">
                    Home
                  </Button>
                </Link>
                <Link to="/crypt-arithmetic">
                  <Button 
                    variant={location.pathname === '/crypt-arithmetic' ? 'secondary' : 'ghost'} 
                    size="sm"
                  >
                    Crypt
                  </Button>
                </Link>
                <Link to="/map-coloring">
                  <Button 
                    variant={location.pathname === '/map-coloring' ? 'secondary' : 'ghost'} 
                    size="sm"
                  >
                    Map
                  </Button>
                </Link>
                <Link to="/custom-csp">
                  <Button 
                    variant={location.pathname === '/custom-csp' ? 'secondary' : 'ghost'} 
                    size="sm"
                  >
                    Custom
                  </Button>
                </Link>
              </div>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
