/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  School as SchoolIcon,
  MapPin,
  Phone,
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { getSchoolProfile, updateSchoolProfile } from '../../lib/api/schoolAdmin';
import type { SchoolProfileData } from '../../types/schoolAdmin';
import { DatabaseResetModal } from './DatabaseResetModal';
import { ShieldAlert, Trash2 } from 'lucide-react';

export function SchoolProfileEditPage() {
  const [profile, setProfile] = useState<SchoolProfileData | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSchoolProfile();
      setProfile(data);
      setName(data.name || '');
      setAddress(data.address || '');
      setRegion(data.region || '');
      setPhone(data.phone || '');
      setDescription(data.description || '');
      setPhotos(data.photos || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Maktab profilini yuklab bo'lmadi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const updated = await updateSchoolProfile({
        name,
        address,
        region,
        phone,
        description,
        photos,
      });

      setProfile(updated);
      setSuccessMessage("Maktab ma'lumotlari muvaffaqiyatli yangilandi!");
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Tahrirlashda xatolik yuz berdi');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 bg-white rounded-2xl" />
        <div className="h-96 bg-white rounded-3xl" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <Card variant="white" className="p-8 text-center max-w-md mx-auto my-12 shadow-sm">
        <AlertCircle className="w-10 h-10 text-coral mx-auto mb-3" />
        <p className="text-sm text-muted mb-4">{error}</p>
        <Button variant="primary" onClick={fetchProfile} className="gap-2 mx-auto">
          <RefreshCw className="w-4 h-4" /> Qayta yuklash
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black font-serif text-deep flex items-center gap-2.5">
          <SchoolIcon className="w-7 h-7 text-primary" /> Maktab Profili va Sozlamalari
        </h1>
        <p className="text-sm text-muted">
          Maktab rekvizitlari, manzili, aloqa ma'lumotlari va rasmiy tavsifi
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-success/10 text-success border border-success/20 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-coral/10 text-coral border border-coral/20 rounded-2xl flex items-center gap-3 text-sm font-bold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card variant="white" className="p-6 sm:p-8 shadow-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* School Number (Read Only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-deep">Maktab raqami</label>
              <input
                type="text"
                disabled
                value={`№ ${profile?.schoolNumber || 71}-sonli maktab`}
                className="w-full px-4 py-2.5 rounded-2xl bg-bg border border-cardBlue text-sm font-bold text-muted cursor-not-allowed"
              />
            </div>

            {/* School Name */}
            <Input
              label="Maktabning rasmiy nomi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Region */}
            <Input
              label="Shahar / Viloyat"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Toshkent shahri"
            />

            {/* Phone */}
            <Input
              label="Aloqa telefoni"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 71 277-71-71"
            />
          </div>

          {/* Address */}
          <Input
            label="Aniq manzil"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Chilonzor tumani, 9-mavze"
          />

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-deep">Maktab haqida qisqacha tavsif</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-white border border-cardBlue/60 text-sm focus:outline-hidden focus:border-primary transition-all resize-y"
              placeholder="Ixtisoslashtirilgan ta'lim yo'nalishlari va sharoitlar haqida ma'lumot..."
            />
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-deep flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-primary" /> Maktab fotosuratlari
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((url, idx) => (
                <div key={idx} className="relative rounded-2xl overflow-hidden h-28 border border-cardBlue shadow-xs">
                  <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Xavfli zona / Baza tozalash */}
        <div className="mt-8 border-t border-cardBlue/60 pt-6">
          <Card variant="white" className="p-6 shadow-sm border border-red-200 bg-red-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <ShieldAlert className="w-4 h-4" />
                <span>Xavfli zona: Baza ma'lumotlarini tozalash</span>
              </div>
              <p className="text-xs text-muted max-w-xl">
                Maktabga tegishli barcha o'quvchilar, o'qituvchilar, baholar va hisobotlarni butunlay tozalab, tizimni yangitdan boshlash uchun boshlang'ich holatga keltiradi.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-red-300 text-red-600 hover:bg-red-600 hover:text-white transition-all text-xs font-bold shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Bazani tozalash va qayta boshlash
            </button>
          </Card>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            type="submit"
            disabled={isSaving}
            className="gap-2 font-bold shadow-md w-full sm:w-auto"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Saqlanmoqda...' : 'O\'zgarishlarni Saqlash'}
          </Button>
        </div>
      </form>
      <DatabaseResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        schoolNumber={profile?.schoolNumber || 71}
        onSuccess={fetchProfile}
      />
    </div>
  );
}
