/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Heart, Eye, EyeOff, ShieldAlert, ArrowLeft } from 'lucide-react';
import type { UserRole } from '../../types';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('parent');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Login maydoni majburiy.');
      return;
    }
    if (!password) {
      setError('Parol maydoni majburiy.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(role, username.trim(), password);
      if (result.ok) {
        const stored = localStorage.getItem('yordamchi_auth_user');
        const parsed = stored ? (JSON.parse(stored) as { role?: string }) : null;
        const actualRole = parsed?.role || role;

        if (actualRole === 'school_admin') {
          navigate('/school-admin/dashboard');
        } else if (actualRole === 'teacher') {
          navigate('/teacher/class');
        } else {
          navigate('/parent/reports');
        }
      } else {
        setError(result.error || 'Login yoki parol xato! Iltimos, tekshirib qayta kiriting.');
      }
    } catch {
      setError('Tizimga ulanishda xatolik yuz berdi. Iltimos qayta urining.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (newRole: UserRole) => {
    setRole(newRole);
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-bg relative">
      {/* Go Back button */}
      <div className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-deep font-semibold hover:text-primary transition-all text-sm">
          <ArrowLeft className="w-4 h-4" />
          Bosh sahifaga qaytish
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Logo brand */}
          <div className="flex flex-col items-center gap-2 mb-6 text-center">
            <div className="bg-primary text-white rounded-full p-3 shadow-lg shadow-primary/25">
              <Heart className="w-8 h-8 animate-pulse" fill="currentColor" />
            </div>
            <h1 className="text-2xl font-black text-deep font-serif">
              YORDAMCHI <span className="text-red-500 text-sm lowercase">med</span>
            </h1>
            <p className="text-sm text-muted">
              Ijtimoiy himoya va maktab-internat hamkorlik tizimi
            </p>
          </div>

          <Card variant="white" className="p-6 sm:p-8 shadow-xl border border-primary/5">
            {/* Role segmented toggle */}
            <div className="grid grid-cols-3 bg-bg rounded-2xl p-1 mb-6 gap-1">
              <button
                type="button"
                onClick={() => handleRoleSelect('parent')}
                className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer truncate ${
                  role === 'parent' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-deep'
                }`}
              >
                Ota-ona
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('teacher')}
                className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer truncate ${
                  role === 'teacher' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-deep'
                }`}
              >
                O‘qituvchi
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('school_admin')}
                className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer truncate ${
                  role === 'school_admin' ? 'bg-primary text-white shadow-sm' : 'text-muted hover:text-deep'
                }`}
              >
                Maktab admini
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Form errors */}
              {error && (
                <div className="bg-coral/10 text-coral border border-coral/20 p-4 rounded-xl flex items-start gap-3 text-sm font-semibold">
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login */}
              <Input
                label="Login"
                type="text"
                placeholder="Loginingizni kiriting"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              {/* Password wrapper with eye toggle */}
              <div className="relative">
                <Input
                  label="Parol"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[44px] text-primary/70 hover:text-primary cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            
              <Button variant="primary" size="lg" fullWidth type="submit" disabled={isLoading} className="mt-2">
                {isLoading ? 'Yuklanmoqda...' : 'Kirish'}
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-muted">
        © 2026{' '}
        <a
          href="https://yordamchiadmin.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-deep transition-colors underline-offset-2 hover:underline"
          title="Boshqaruv Tizimi"
        >
          Yordamchi med
        </a>
        . Maxsus ehtiyojli bolalar va ularning ota-onalari uchun yordamchi platforma.
      </footer>
    </div>
  );
}
