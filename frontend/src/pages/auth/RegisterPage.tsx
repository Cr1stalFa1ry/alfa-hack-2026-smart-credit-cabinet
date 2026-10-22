import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { authApi } from '../../api/authApi';
import { egripApi } from '../../api/egripApi';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { ArrowRight, Sun, Moon, Eye, EyeOff } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { setUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [inn, setInn] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [egripStatus, setEgripStatus] = useState<string | null>(null);

  const handleInnBlur = async () => {
    const clean = inn.trim();
    if (clean.length === 12) {
      const company = await egripApi.getCompanyByInn(clean);
      if (company) {
        setEgripStatus(`ЕГРИП: ${company.fullName} (${company.region})`);
        // Only set full name if it's empty and starts with 'ИП '
        if (!fullName && company.fullName.startsWith('ИП ')) {
          setFullName(company.fullName.replace(/^ИП\s+/, ''));
        }
      } else {
        setEgripStatus('ИНН корректен (12 знаков)');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (inn.trim().length !== 12) {
      setError('ИНН индивидуального предпринимателя должен содержать ровно 12 цифр');
      return;
    }

    if (password !== confirmPassword) {
      setError('Введённые пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать не менее 6 символов');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.registerClient({
        username: username.trim(),
        password,
        inn: inn.trim(),
        fullName: fullName.trim(),
      });

      setUser(res.user);
      navigate('/client/dashboard');
    } catch {
      setError('Ошибка при регистрации. Возможно, пользователь с таким логином или ИНН уже существует.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-200 relative">
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
          Регистрация предпринимателя
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Умный кредитный кабинет Альфа-Банка для ИП
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="shadow-xl p-6 sm:p-8 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ИНН */}
            <Input
              label="ИНН предпринимателя (12 цифр)"
              placeholder="500100000011"
              maxLength={12}
              value={inn}
              onChange={(e) => setInn(e.target.value.replace(/\D/g, ''))}
              onBlur={handleInnBlur}
              helperText={egripStatus || 'Введите 12 цифр ИНН физического лица / ИП'}
              required
            />

            {/* ФИО */}
            <Input
              label="ФИО предпринимателя"
              placeholder="Иванов Иван Сергеевич"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            {/* Логин (без email и телефона) */}
            <Input
              label="Логин (Username)"
              type="text"
              placeholder="client1"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            {/* Пароль с кнопкой просмотра */}
            <div className="relative">
              <Input
                label="Пароль"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {/* Подтверждение пароля с кнопкой просмотра */}
            <div className="relative">
              <Input
                label="Подтверждение пароля"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 pointer-events-auto"
                    title={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              Зарегистрироваться
            </Button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="font-semibold text-alfa-600 dark:text-alfa-400 hover:text-alfa-700">
              Войти
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
