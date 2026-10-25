import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ArrowRight, Lock, User, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
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
        navigate('/client/dashboard');
      }
    } catch {
      setError('Неверный логин или пароль');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200/50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-2">
        <div className="brandmark-container inline-flex items-center gap-4 justify-center">
          <span className="brandmark-lg">
            А<span></span>
          </span>
          <div className="text-left">
            <span className="font-black text-[25px] tracking-tight text-[#141414] dark:text-white leading-tight block">
              Альфа
            </span>
            <span className="brand-sub text-xs text-[#505358] dark:text-slate-300 font-medium block mt-0.5">
              Умный кредитный кабинет
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="shadow-xl p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Вход в личный кабинет
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Логин"
              type="text"
              leftIcon={<User className="w-4 h-4" />}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Введите логин"
              required
            />

            <div className="relative">
              <Input
                label="Пароль"
                type={showPassword ? 'text' : 'password'}
                leftIcon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
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
        </Card>
      </div>
    </div>
  );
};
