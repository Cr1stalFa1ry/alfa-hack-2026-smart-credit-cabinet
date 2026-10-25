import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const isEmployee = role === 'BankEmployee';
    await logout();
    navigate(isEmployee ? '/employee/login' : '/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-[#e6e8ea] dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[88px] flex items-center justify-between gap-4">
        {/* Brand with authentic Alfa logo mark */}
        <div className="flex items-center gap-6">
          <Link
            to={role === 'BankEmployee' ? '/analyst/queue' : '/client/dashboard'}
            className="brandmark-container group"
            aria-label="На главную"
          >
            <span className="brandmark">
              А<span></span>
            </span>
            <div>
              <span className="font-bold text-[22px] tracking-tight text-[#141414] dark:text-white leading-tight block">
                Альфа
              </span>
              <span className="brand-sub">
                Умный кредитный кабинет
              </span>
            </div>
          </Link>
        </div>

        {/* Right: User menu */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
              {user?.fullName || user?.username}
            </span>
            <span className="text-[11px] text-[#686b70]">
              {role === 'Client' ? (user?.inn ? `ИНН ${user.inn}` : 'ИП клиент') : 'Специалист банка'}
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-xs">
            <User className="w-4 h-4" />
          </div>

          <button
            onClick={handleLogout}
            title="Выйти"
            className="p-2 text-slate-400 hover:text-[#EF3124] hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
