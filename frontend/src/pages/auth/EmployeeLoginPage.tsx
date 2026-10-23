import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { ShieldCheck, ArrowRight, Lock, User, Sun, Moon, Eye, EyeOff, Building2, ArrowLeft } from 'lucide-react';

export const EmployeeLoginPage: React.FC = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const loggedUser = await login({ username: username.trim(), password });
      if (loggedUser.role === 'BankEmployee') {
        navigate('/analyst/queue');
      } else {
        // In case a client logs in on employee page, still route safely
        navigate('/client/dashboard');
      }
    } catch {
      setError('Неверный логин или пароль сотрудника банка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200 relative text-slate-100">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 items-center justify-center text-white shadow-xl shadow-purple-600/30 mb-4 border border-purple-400/20">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
          Альфа<span className="text-purple-400">Бизнес</span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-700/50 uppercase tracking-wider font-bold">
            Служебный вход
          </span>
        </h2>
        <p className="mt-1.5 text-sm text-slate-400 font-medium">
          Автоматизированное рабочее место кредитного андеррайтера
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="shadow-2xl p-6 sm:p-8 space-y-6 bg-slate-800/90 border-slate-700/80 backdrop-blur-sm">
          <div>
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              Вход для сотрудников банка
            </h3>
            <p className="text-xs text-slate-400">
              Введите корпоративные учётные данные для доступа к очереди заявок
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Логин сотрудника"
              type="text"
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="analyst"
              required
            />

            <div className="relative">
              <Input
                label="Пароль"
                type={showPassword ? 'text' : 'password'}
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="analyst123"
                required
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="p-1 text-slate-400 hover:text-white pointer-events-auto"
                    title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-300 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {isLoading ? 'Авторизация...' : 'Войти в рабочий профиль'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Security Notice: No open registration */}
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span>🔒</span> Внутренняя система Альфа-Банка
            </div>
            <p className="leading-relaxed">
              Регистрация учётных записей сотрудников выполняется исключительно администратором безопасности банка через панель управления.
            </p>
          </div>

          <div className="text-center pt-1 border-t border-slate-700/60">
            <Link
              to="/login"
              className="text-xs text-slate-400 hover:text-purple-400 transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Вернуться на страницу для клиентов
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
