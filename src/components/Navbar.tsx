import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  Calculator, 
  Clock, 
  Upload, 
  LogIn, 
  LogOut,
  Sparkles,
  Scale,
  Bot,
  Shield,
  HardDrive,
  Headphones,
  Share2,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyanmarStandardTimeInfo } from '../utils/hijriCalendar';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  activeTab: 'library' | 'audio' | 'fatwa' | 'zakat' | 'qurbani' | 'chatbot';
  setActiveTab: (tab: 'library' | 'audio' | 'fatwa' | 'zakat' | 'qurbani' | 'chatbot') => void;
  onOpenUpload: () => void;
  onOpenSchedule: () => void;
  onOpenProfile: () => void;
  onOpenWorkspace: () => void;
  onOpenShare?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  onOpenSchedule,
  onOpenProfile,
  onOpenWorkspace,
  onOpenShare,
}) => {
  const { user, isAuthenticated, isAdmin, openAuthModal, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const mmtInfo = getMyanmarStandardTimeInfo(currentTime);

  const navItems: { id: 'library' | 'audio' | 'fatwa' | 'zakat' | 'qurbani' | 'chatbot'; label: string; icon: any }[] = [
    { id: 'library', label: 'စာအုပ်နှင့် PDF စင်', icon: BookOpen },
    { id: 'audio', label: 'တရားတော် အသံဖိုင်', icon: Headphones },
    { id: 'fatwa', label: 'ဖသ်ဝါဌာန', icon: HelpCircle },
    { id: 'zakat', label: 'ဇကားသ်တွက်စက်', icon: Calculator },
    { id: 'qurbani', label: 'ကုရ်ဘာနီတွက်စက်', icon: Scale },
    { id: 'chatbot', label: 'သာသနာ့ AI', icon: Bot },
  ];

  const handleSelectTab = (tab: 'library' | 'audio' | 'fatwa' | 'zakat' | 'qurbani' | 'chatbot') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Brand Logo & Subtitle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => handleSelectTab('library')}
              className="flex items-center gap-2 sm:gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-900 flex items-center justify-center text-amber-400 shadow-sm group-hover:bg-emerald-950 transition-colors shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-emerald-950 whitespace-nowrap">
                    Al_HikMah
                  </span>
                  <span className="font-arabic text-xs text-amber-600 font-bold whitespace-nowrap">
                    (الحِكْمَة)
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-stone-500 block leading-tight whitespace-nowrap">
                  အစ္စလာမ်မီ ဒစ်ဂျစ်တယ် စာကြည့်တိုက်
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links (Only visible on xl screens 1280px+ where they fit comfortably without squishing) */}
          <div className="hidden xl:flex items-center gap-4 2xl:gap-6 text-xs sm:text-sm font-medium shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center gap-1.5 py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'text-emerald-900 font-bold border-b-2 border-emerald-800'
                      : 'text-stone-600 hover:text-emerald-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-emerald-700" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <button
              onClick={onOpenSchedule}
              className="flex items-center gap-1.5 text-stone-600 hover:text-emerald-800 py-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>နမားဇ်အချိန်ဇယား</span>
            </button>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Quick Share Link button (always accessible) */}
            {onOpenShare && (
              <button
                onClick={onOpenShare}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                title="အခြားသူများဆီသို့ ဝဘ်ဆိုက်လင့်ခ် ပေးပို့မျှဝေရန်"
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">လင့်ခ်မျှဝေမည်</span>
              </button>
            )}

            {/* In-App PWA Install Button */}
            <PWAInstallButton variant="navbar" />

            {/* Google Drive & Forms button (visible on large screens, or inside mobile menu) */}
            <button
              onClick={onOpenWorkspace}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200/90 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Google Drive နှင့် Google Forms ချိတ်ဆက်မှု"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Drive & Forms</span>
            </button>

            {/* Upload Book / PDF button (visible on desktop or inside mobile menu) */}
            <button
              onClick={() => {
                if (!isAdmin) {
                  openAuthModal('စာအုပ်အသစ်တင်ရန် Admin စီမံခန့်ခွဲသူအဖြစ် Login ဝင်ရောက်ပေးပါ');
                } else {
                  onOpenUpload();
                }
              }}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="စာအုပ် သို့မဟုတ် PDF အသစ်တင်ရန်"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
              <span>စာအုပ်/PDF တင်မည်</span>
            </button>

            {/* Admin Login / Profile Button */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <button
                  onClick={onOpenProfile}
                  className={`flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isAdmin 
                      ? 'border-amber-400 bg-amber-50 text-amber-950 font-bold' 
                      : 'border-emerald-200 hover:bg-emerald-50'
                  }`}
                  title="အကောင့် အချက်အလက်များ"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-amber-400 shrink-0"
                  />
                  <span className="hidden sm:inline text-xs font-bold text-stone-900 truncate max-w-[80px]">
                    {user.name}
                  </span>
                </button>

                <button
                  onClick={logout}
                  className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="ထွက်မည် (Logout)"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('စာအုပ်တင်ခြင်းနှင့် စီမံခန့်ခွဲမှုများအတွက် Admin သာ Login ဝင်ရန် လိုအပ်ပါသည်')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Admin ဝင်ရန်</span>
              </button>
            )}

            {/* Mobile / Tablet Hamburger Menu Button (visible below xl screens) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-stone-700 hover:bg-stone-100 hover:text-emerald-900 transition-colors cursor-pointer border border-stone-200"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-rose-600" />
              ) : (
                <Menu className="w-5 h-5 text-emerald-950" />
              )}
            </button>

          </div>

        </div>

        {/* Mobile / Tablet Horizontal Scrollable Fast Navigation Bar (Always neat and responsive with zero squishing) */}
        <div className="xl:hidden flex items-center gap-1.5 py-2 border-t border-stone-100 text-xs font-medium overflow-x-auto no-scrollbar scroll-smooth">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`py-1.5 px-3 rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-900 text-white font-bold shadow-xs' 
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-emerald-800'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={onOpenSchedule}
            className="py-1.5 px-3 rounded-lg whitespace-nowrap shrink-0 flex items-center gap-1.5 bg-amber-50 text-amber-950 hover:bg-amber-100 border border-amber-200 font-medium transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>နမားဇ်အချိန်</span>
          </button>
        </div>

      </div>

      {/* Mobile Drawer Dropdown Menu (Opened by Hamburger) */}
      {isMobileMenuOpen && (
        <div className="xl:hidden border-t border-stone-200 bg-white/95 backdrop-blur-md px-4 py-4 space-y-3 shadow-xl transition-all">
          <div className="text-xs font-bold text-stone-500 uppercase tracking-wider px-2">
            ကဏ္ဍများနှင့် ဝန်ဆောင်မှုများ
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-900 text-white' 
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-emerald-700'}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </button>
              );
            })}

            <button
              onClick={() => {
                onOpenSchedule();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold bg-amber-50/70 hover:bg-amber-100 text-amber-950 border border-amber-200/80 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>နမားဇ်အချိန်ဇယား အပြည့်အစုံ</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          </div>

          {/* Mobile Utility Actions */}
          <div className="pt-2 border-t border-stone-100 space-y-2">
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider px-2">
              စီမံခန့်ခွဲမှုနှင့် အထောက်အကူပြု
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* PWA Install Button inside Mobile Menu */}
              <div className="sm:col-span-2">
                <PWAInstallButton variant="hero" className="w-full justify-center" />
              </div>

              <button
                onClick={() => {
                  onOpenWorkspace();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 font-medium transition-colors cursor-pointer border border-stone-200"
              >
                <HardDrive className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Google Drive & Forms ချိတ်ဆက်မှု</span>
              </button>

              <button
                onClick={() => {
                  if (!isAdmin) {
                    openAuthModal('စာအုပ်အသစ်တင်ရန် Admin စီမံခန့်ခွဲသူအဖြစ် Login ဝင်ရောက်ပေးပါ');
                  } else {
                    onOpenUpload();
                  }
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-800 font-medium transition-colors cursor-pointer border border-stone-200"
              >
                <Upload className="w-4 h-4 text-emerald-800 shrink-0" />
                <span>စာအုပ် သို့မဟုတ် PDF အသစ်တင်မည်</span>
              </button>

              {!isAuthenticated && (
                <button
                  onClick={() => {
                    openAuthModal('စာအုပ်တင်ခြင်းနှင့် စီမံခန့်ခွဲမှုများအတွက် Admin သာ Login ဝင်ရန် လိုအပ်ပါသည်');
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-900 text-white font-bold transition-colors cursor-pointer sm:col-span-2 justify-center"
                >
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Admin စီမံခန့်ခွဲသူ Login ဝင်ရောက်ရန်</span>
                </button>
              )}
            </div>
          </div>

        </div>
      )}
    </nav>
  );
};
