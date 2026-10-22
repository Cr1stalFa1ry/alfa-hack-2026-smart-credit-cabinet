import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types/auth';
import { LogOut, User, ShieldCheck, Briefcase, Sun, Moon, Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, switchRole, logout, isDemoMode, disableDemoMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleRoleChange = (newRole: UserRole) => {
    switchRole(newRole);
    if (newRole === 'BankEmployee') {
      navigate('/analyst/queue');
    } else {
      navigate('/client/dashboard');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleExitDemo = () => {
    disableDemoMode();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            to={role === 'BankEmployee' ? '/analyst/queue' : '/client/dashboard'}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-alfa-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-alfa-500/25 group-hover:scale-105 transition-transform">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-lg">
                  Альфа<span className="text-alfa-500">Бизнес</span>
                </span>
                <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                  Кредитный кабинет
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium hidden sm:block">
                Умная экспресс-оценка и финансирование ИП
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Role Switcher (Shown ONLY in Demo Mode) */}
        {isDemoMode && (
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              ДЕМО-РЕЖИМ
            </span>
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-700 text-xs shadow-xs">
              <button
                onClick={() => handleRoleChange('Client')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  role === 'Client'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-alfa-500" />
                Клиент (ИП)
              </button>
              <button
                onClick={() => handleRoleChange('BankEmployee')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  role === 'BankEmployee'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Аналитик банка
              </button>
            </div>
            <button
              onClick={handleExitDemo}
              className="text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium px-2 py-1 rounded-md transition-colors"
              title="Выйти из демо-режима"
            >
              Выйти из демо
            </button>
          </div>
        )}

        {/* User profile, Theme Toggle & actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
              {user?.fullName || user?.username}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {role === 'Client' ? (user?.inn ? `ИНН ${user.inn}` : 'Заёмщик') : 'Андеррайтер'}
            </span>
          </div>

          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-xs">
            <User className="w-4 h-4" />
          </div>

          <button
            onClick={handleLogout}
            title="Выйти из системы"
            className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
