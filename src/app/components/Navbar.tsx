import { Link, useLocation } from 'react-router';
import { Brain, Moon, Sun, Home, Binary, Map as MapIcon, Compass } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

const NAV_MODE = {
  HOME: { name: 'Home', path: '/', icon: Home, fullName: 'AI Constraint Solver' },
  CRYPT: { name: 'Crypt', path: '/crypt-arithmetic', icon: Binary, fullName: 'Cryptarithmetic' },
  MAP: { name: 'Map', path: '/map-coloring', icon: MapIcon, fullName: 'Map Coloring' },
  CUSTOM: { name: 'Custom', path: '/custom-csp', icon: Compass, fullName: 'Custom CSP' },
};

const navLinks = [NAV_MODE.HOME, NAV_MODE.CRYPT, NAV_MODE.MAP, NAV_MODE.CUSTOM];

export function Navbar() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const isHome = location.pathname === '/';
  const isFromHome = location.state?.fromHome;
  
  // Identify current game data
  const currentGame = navLinks.find(link => location.pathname.startsWith(link.path) && link.path !== '/') || NAV_MODE.HOME;
  const CurrentIcon = currentGame.icon;

  // State
  const [splashFinished, setSplashFinished] = useState(isHome || !isFromHome);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Splash Sequence Logic
  useEffect(() => {
    if (isHome || !isFromHome) {
      setSplashFinished(true);
    } else {
      setSplashFinished(false);
      const timer = setTimeout(() => setSplashFinished(true), 1200); 
      return () => clearTimeout(timer);
    }
  }, [location.pathname, isHome, isFromHome]);

  // Scroll & Click Outside Collapse Logic
  useEffect(() => {
    if (isHome) return; 
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      // Small threshold to prevent micro-jitters from collapsing
      if (!isCollapsed && window.scrollY > 20 && Math.abs(window.scrollY - lastScrollY) > 10) {
        setIsCollapsed(true);
      }
      lastScrollY = window.scrollY;
    };

    const handleClickOutside = (e: MouseEvent) => {
      const navElement = document.getElementById('floating-bottom-nav');
      if (!isCollapsed && navElement && !navElement.contains(e.target as Node)) {
        setIsCollapsed(true);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isHome, isCollapsed]);

  // Shared Theme Segment Component
  const ThemeSegmentedControl = () => (
    <div className="flex items-center bg-background/60 backdrop-blur-3xl border border-white/20 dark:border-white/10 p-1 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.15)] relative pointer-events-auto">
      <button
        onClick={() => setTheme('light')}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-colors z-10 outline-none ${theme !== 'dark' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <Sun className="w-4 h-4" />
        <span className="hidden sm:inline">Light</span>
        {theme !== 'dark' && (
          <motion.div
            layoutId="theme-active"
            className="absolute inset-0 bg-background shadow-[0_2px_10px_rgba(0,0,0,0.1)] rounded-full border border-border/50 -z-10"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-colors z-10 outline-none ${theme === 'dark' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
      >
        <Moon className="w-4 h-4" />
        <span className="hidden sm:inline">Dark</span>
        {theme === 'dark' && (
          <motion.div
            layoutId="theme-active"
            className="absolute inset-0 bg-background shadow-[0_2px_10px_rgba(0,0,0,0.1)] rounded-full border border-border/50 -z-10"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
      </button>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {!isHome && !splashFinished && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.8 }}
          >
            <motion.div
              initial={{ scale: 2.5, y: -20, opacity: 0 }}
              animate={{ 
                scale: [2.5, 1.2, 0.4], 
                y: [-20, 0, 100],
                opacity: [0, 1, 0] 
              }}
              transition={{ duration: 1.2, times: [0, 0.5, 1], ease: "easeInOut" }}
              className="flex flex-col items-center gap-6 text-center"
            >
              <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-8 rounded-3xl shadow-2xl">
                <CurrentIcon className="w-20 h-20 text-white drop-shadow-xl" />
              </div>
              <h1 className="font-bold text-4xl tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent px-4">
                {currentGame.fullName}
              </h1>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Section explicitly for Home Logo & Global Theme Switcher */}
      <nav className="fixed top-0 left-0 right-0 z-50 pt-4 px-4 sm:px-6 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-none h-16 relative">
          
          <AnimatePresence>
            {isHome && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex absolute left-0 pointer-events-auto">
                <Link to="/" className="flex items-center gap-3 group bg-background/60 backdrop-blur-3xl border border-white/20 dark:border-white/10 p-2 pr-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] hover:bg-background/80 transition-all">
                  <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 md:p-2.5 rounded-xl group-hover:scale-105 transition-transform shadow-inner">
                    <Brain className="w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-md" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <h1 className="font-semibold text-sm md:text-lg leading-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">AI Constraint</h1>
                    <p className="text-[10px] md:text-xs text-muted-foreground tracking-wide">Intelligent Platform</p>
                  </div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Theme Switcher always present at the top right, utilizing Liquid Glass styling */}
          <div className="absolute right-0 flex items-center">
            {(!isHome ? splashFinished : true) && (
              <motion.div
                initial={(!isHome && !splashFinished) ? { y: -20, opacity: 0 } : false}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              >
                <ThemeSegmentedControl />
              </motion.div>
            )}
          </div>
        </div>
      </nav>

      {/* Bottom Floating Dynamic Navbar specifically for Games */}
      {!isHome && (
        <nav className="fixed bottom-6 left-0 right-0 z-50 px-4 sm:px-6 pointer-events-none flex justify-center">
          <motion.div
            id="floating-bottom-nav"
            layout="size" // Only animate size changes, utterly ignoring positional shifts due to scrollbars!
            initial={splashFinished ? false : { y: 50, opacity: 0 }}
            animate={splashFinished ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.1, duration: 0.4 }} // Minimal pop layout transition
            className="pointer-events-auto bg-background/70 backdrop-blur-3xl border border-white/20 dark:border-white/10 p-1.5 rounded-full shadow-[0_12px_50px_rgba(0,0,0,0.25)] flex items-center justify-center overflow-hidden origin-center"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {isCollapsed ? (
                <motion.button
                  key="collapsed-circle"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  onClick={() => setIsCollapsed(false)}
                  onMouseEnter={() => setIsCollapsed(false)}
                  className="p-1.5 flex items-center justify-center outline-none hover:scale-105 transition-transform"
                >
                  <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-full shadow-inner relative">
                    <CurrentIcon className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                </motion.button>
              ) : (
                <motion.div
                  key="expanded-pill"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="flex items-center justify-center gap-1.5 origin-center"
                >
                  {navLinks.map((link) => {
                    const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
                    return (
                      <Link
                        key={link.name}
                        to={link.path}
                        className="relative px-5 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap"
                      >
                        {isActive && (
                          <motion.div
                            layoutId="navbar-active"
                            className="absolute inset-0 bg-foreground/10 dark:bg-foreground/20 rounded-full shadow-inner"
                            transition={{ type: "spring", stiffness: 500, damping: 35, mass: 1 }} // Snappy, non-pop shift
                          />
                        )}
                        <span className={`relative z-10 outline-none ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                          {link.name}
                        </span>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </nav>
      )}
    </>
  );
}
