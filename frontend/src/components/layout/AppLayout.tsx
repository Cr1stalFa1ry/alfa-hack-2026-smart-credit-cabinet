import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  PlusCircle,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { role } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar />

      {/* Sub-navigation bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto">
          <nav className="flex space-x-1 sm:space-x-4 py-2">
            {role === 'Client' ? (
              <>
                <NavLink
                  to="/client/dashboard"
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                      isActive
                        ? 'bg-alfa-50 dark:bg-alfa-950/40 text-alfa-600 dark:text-alfa-400'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <FileText className="w-4 h-4" />
                  Мои заявки
                </NavLink>

                <NavLink
                  to="/client/new"
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                      isActive
                        ? 'bg-alfa-50 dark:bg-alfa-950/40 text-alfa-600 dark:text-alfa-400'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <PlusCircle className="w-4 h-4" />
                  Новая заявка
                </NavLink>
              </>
            ) : (
              <>
                <NavLink
                  to="/analyst/queue"
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                      isActive
                        ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <ShieldCheck className="w-4 h-4" />
                  Очередь на андеррайтинг
                </NavLink>
              </>
            )}

            {/* Dev helper link to view State Machine Map */}
            <NavLink
              to="/dev/state-machine"
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`
              }
            >
              <Cpu className="w-4 h-4" />
              State Machine (T01–T17)
            </NavLink>
          </nav>

          <div className="hidden md:flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Backend: .NET 10 Modular Monolith (Wolverine)
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 mt-12 text-center text-xs text-slate-400 dark:text-slate-500 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 АО «АЛЬФА-БАНК». Хакатон «Альфа-Будущее 2026». Проект «Умный кредитный кабинет предпринимателя».</p>
          <div className="flex items-center gap-4">
            <span className="font-mono text-slate-400 dark:text-slate-500">State Machine T01–T17</span>
            <span>•</span>
            <span className="font-mono text-slate-400 dark:text-slate-500">RS256 JWT & WolverineFx</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
