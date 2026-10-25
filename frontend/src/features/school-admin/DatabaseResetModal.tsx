/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DatabaseResetModal — Maktab admini uchun bazani 2 bosqichli xavfsiz tozalash modali
 */

import { useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  X,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { resetSchoolDatabase, type ResetDatabaseResult } from '../../lib/api/schoolAdmin';

interface DatabaseResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  schoolNumber?: number;
}

export function DatabaseResetModal({
  isOpen,
  onClose,
  onSuccess,
  schoolNumber = 71,
}: DatabaseResetModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetCameras, setResetCameras] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResetDatabaseResult | null>(null);

  if (!isOpen) return null;

  const isConfirmed = confirmationText.trim().toUpperCase() === 'TOZALASH';
  const canSubmit = isConfirmed && password.length > 0 && !isLoading;

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await resetSchoolDatabase({
        password,
        confirmation: 'TOZALASH',
        resetCameras,
      });

      if (res.success) {
        setResult(res);
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || "Baza tozalanishida xatolik yuz berdi");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Server xatosi: Parol noto'g'ri yoki amal ruxsat etilmagan";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setConfirmationText('');
    setPassword('');
    setError(null);
    setResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-red-100 flex flex-col gap-6 relative">
        {/* Yopish tugmasi */}
        {!isLoading && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-5 right-5 text-muted hover:text-deep p-2 rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {result ? (
          /* Muvaffaqiyatli tugagan holat */
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-black text-deep font-serif">
                Baza muvaffaqiyatli tozalandi!
              </h3>
              <p className="text-sm text-muted mt-1.5">
                №{schoolNumber}-maktab barcha ma'lumotlari toza holatga keltirildi. Endi o'qituvchi va o'quvchilarni yangitdan kiritishingiz mumkin.
              </p>
            </div>

            {result.stats && (
              <div className="grid grid-cols-2 gap-2 w-full text-xs font-semibold bg-bg p-4 rounded-2xl border border-primary/5 mt-2">
                <div className="text-left text-muted">O'chirilgan o'quvchilar:</div>
                <div className="text-right text-deep font-bold">{result.stats.deletedStudents} ta</div>
                <div className="text-left text-muted">O'chirilgan o'qituvchilar/foydalanuvchilar:</div>
                <div className="text-right text-deep font-bold">{result.stats.deletedUsers} ta</div>
                <div className="text-left text-muted">O'chirilgan kunlik qaydlar:</div>
                <div className="text-right text-deep font-bold">{result.stats.deletedLogs} ta</div>
                <div className="text-left text-muted">O'chirilgan e'lonlar:</div>
                <div className="text-right text-deep font-bold">{result.stats.deletedAnnouncements} ta</div>
              </div>
            )}

            <Button
              variant="primary"
              className="w-full mt-2"
              onClick={() => {
                handleClose();
                window.location.reload();
              }}
            >
              Tushundim, yangitdan boshlash
            </Button>
          </div>
        ) : (
          /* Tozalash formasi va ogohlantirish */
          <form onSubmit={handleReset} className="flex flex-col gap-5">
            {/* Sarlavha va ogohlantirish belgisi */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-deep font-serif leading-tight">
                  Baza ma'lumotlarini tozalash va qayta boshlash
                </h3>
                <p className="text-xs text-red-600 font-bold mt-1">
                  №{schoolNumber}-sonli Maktab-Internati
                </p>
              </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/15 p-4 rounded-2xl text-xs text-deep/80 leading-relaxed space-y-2">
              <p className="font-bold text-red-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Diqqat! Ushbu amalni ortga qaytarib bo'lmaydi!
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted">
                <li>Barcha o'quvchilar va ularning tibbiy-pedagogik kartalari o'chiriladi.</li>
                <li>Barcha o'qituvchilar va ota-onalar hisoblari o'chiriladi.</li>
                <li>Baholar, davomat va kundalik jurnal hisobotlari to'liq tozalanadi.</li>
                <li className="font-bold text-emerald-700 list-none -ml-4 mt-2">
                  ✓ Sizning administrator profilingiz saqlanib qoladi va tizim yangi ma'lumotlarni qabul qilishga tayyor bo'ladi.
                </li>
              </ul>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-100/70 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* 1-bosqich: TOZALASH so'zini kiritish */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-deep flex justify-between">
                <span>1-Bosqich: Tasdiqlash so'zini kiriting</span>
                <span className="text-[11px] text-red-600 font-mono">TOZALASH</span>
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="TOZALASH so'zini yozing"
                className="w-full px-4 py-2.5 rounded-xl border border-cardBlue/80 text-sm focus:border-red-500 focus:outline-hidden uppercase font-semibold text-deep placeholder:normal-case placeholder:font-normal placeholder:text-muted/60"
                required
                disabled={isLoading}
              />
            </div>

            {/* 2-bosqich: Admin paroli */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-deep">
                2-Bosqich: Administrator parolingizni kiriting
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Amaldagi parolingiz"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-cardBlue/80 text-sm focus:border-red-500 focus:outline-hidden text-deep placeholder:text-muted/60 font-sans"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-deep p-1 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Qo'shimcha parametr: Kameralar */}
            <label className="flex items-center gap-2.5 text-xs text-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={resetCameras}
                onChange={(e) => setResetCameras(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                disabled={isLoading}
              />
              <span>Oshxona va yotoqxona kameralari sozlamalarini ham o'chirish</span>
            </label>

            {/* Tugmalar */}
            <div className="flex items-center gap-3 mt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={isLoading}
              >
                Bekor qilish
              </Button>
              <button
                type="submit"
                disabled={!canSubmit}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  canSubmit
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/25'
                    : 'bg-black/10 text-muted cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Tozalanmoqda...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Hammasini o'chirish
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
