import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Menu, X, Globe, Activity, User, LogIn } from 'lucide-react';
import { useLanguage } from '@/lib/languageContext';
import { languageNames, Language } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/authContext';
import AuthModal from './AuthModal';

const Header = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const navItems = [
    { path: '/', label: t('nav.home') },
    { path: '/check', label: t('nav.check') },
    { path: '/reminders', label: 'Reminders' },
  ];

  const displayName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Profile';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="glass-strong shadow-elevated">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-all duration-300">
                  <Shield className="w-[18px] h-[18px] text-primary-foreground" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success border-2 border-card" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight leading-none">
                  Medi<span className="gradient-text">Safe</span>
                </span>
                <span className="text-[9px] font-medium text-muted-foreground tracking-[0.15em] uppercase leading-none mt-0.5">
                  AI Safety Checker
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                  {location.pathname === item.path && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full gradient-primary"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1.5">
              {/* Language Selector */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLangOpen(!langOpen)}
                  className="gap-1.5 text-muted-foreground hover:text-foreground h-8 px-2.5 rounded-lg"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs font-medium">{languageNames[language]}</span>
                </Button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 glass-strong rounded-xl shadow-elevated p-1 min-w-[140px]"
                    >
                      {(Object.keys(languageNames) as Language[]).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => { setLanguage(lang); setLangOpen(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            language === lang ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
                          }`}
                        >
                          {languageNames[lang]}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Live indicator */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success">
                <Activity className="w-3 h-3" />
                <span className="text-[10px] font-semibold tracking-wide uppercase">Live</span>
              </div>

              {/* Auth button */}
              {user ? (
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-all"
                >
                  <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center text-white text-[10px] font-bold">
                    {user?.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full rounded-lg object-cover" />
                    ) : initials}
                  </div>
                  <span className="text-xs font-semibold text-primary hidden sm:inline">{displayName}</span>
                </button>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl gradient-primary text-white text-xs font-semibold shadow-glow-sm hover:shadow-glow transition-all hover:-translate-y-0.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              {/* Mobile menu */}
              <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden glass-strong border-t border-border"
            >
              <div className="px-4 py-3 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                {!user && (
                  <button
                    onClick={() => { setAuthOpen(true); setMobileOpen(false); }}
                    className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-primary bg-primary/5"
                  >
                    Sign In / Create Account
                  </button>
                )}
                {user && (
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
                    My Profile
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
};

export default Header;
