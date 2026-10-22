import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Briefcase, ShieldCheck, ArrowRight, Lock, User, Sun, Moon, Eye, EyeOff, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, enableDemoMode } = useAuth();
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
      await login({ username: username.trim(), password });
      const lower = username.trim().toLowerCase();
      if (lower.includes('analyst') || lower.includes('admin')) {
        navigate('/analyst/queue');
      } else {
        navigate('/client/dashboard');
      }
    } catch {
      setError('Неверный логин или пароль');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterDemo = (role: 'Client' | 'BankEmployee') => {
    enableDemoMode(role);
    if (role === 'BankEmployee') {
      navigate('/analyst/queue');
    } else {
      navigate('/client/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 dark:from-slate-950 to-slate-200/50 dark:to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200 relative">
      {/* Theme toggle on login page */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-alfa-500 items-center justify-center text-white font-black text-2xl shadow-lg shadow-alfa-500/30 mb-4">
          A
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Альфа<span className="text-alfa-500">Бизнес</span>
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 font-medium">
          Умный кредитный кабинет предпринимателя
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="shadow-xl p-6 sm:p-8 space-y-6">
          {/* Main User Login Form */}
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Вход в личный кабинет
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Введите учётные данные для доступа к вашим заявкам
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Логин (Username)"
              type="text"
              leftIcon={<User className="w-4 h-4" />}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="client1 или analyst"
              required
            />

            <div className="relative">
              <Input
                label="Пароль"
                type={showPassword ? 'text' : 'password'}
                leftIcon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123 или analyst123"
                required
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 pointer-events-auto"
                    title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Войти в систему
            </Button>
          </form>

          <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            Нет учётной записи?{' '}
            <Link to="/register" className="font-semibold text-alfa-600 dark:text-alfa-400 hover:text-alfa-700">
              Зарегистрировать ИП
            </Link>
          </div>

          {/* Demonstration Mode section for Jury / Evaluation */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="rounded-2xl p-4 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 text-center space-y-3">
              <div className="flex items-center justify-center gap-1.5 text-amber-900 dark:text-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Демонстрационный режим
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ознакомление с готовыми заявками, скорингом и переключением ролей в верхней плашке
              </p>
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleEnterDemo('Client')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-amber-300/80 dark:border-amber-800/60 bg-white dark:bg-slate-900 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs"
                >
                  <Briefcase className="w-3.5 h-3.5 text-alfa-500" />
                  Демо: Клиент
                </button>
                <button
                  type="button"
                  onClick={() => handleEnterDemo('BankEmployee')}
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-amber-300/80 dark:border-amber-800/60 bg-white dark:bg-slate-900 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  Демо: Аналитик
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
