/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  AlertTriangle,
  Video,
  Megaphone,
  UserPlus,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Sparkles,
  School as SchoolIcon,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';
import { getReports, getSchoolProfile } from '../../lib/api/schoolAdmin';
import type { SchoolReportData, SchoolProfileData } from '../../types/schoolAdmin';
import { DatabaseResetModal } from './DatabaseResetModal';
import { ShieldAlert, Trash2 } from 'lucide-react';

export function SchoolAdminDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState<SchoolReportData | null>(null);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [repData, profData] = await Promise.all([
        getReports('week'),
        getSchoolProfile(),
      ]);
      setReports(repData);
      setSchoolProfile(profData);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Ma\'lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-cardBlue/30 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-3xl border border-primary/5" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-3xl" />
      </div>
    );
  }

  if (error || !reports) {
    return (
      <Card variant="white" className="p-8 text-center max-w-lg mx-auto my-12 shadow-md">
        <AlertTriangle className="w-12 h-12 text-coral mx-auto mb-4" />
        <h3 className="text-lg font-bold text-deep mb-2">Ma'lumotlar yuklanmadi</h3>
        <p className="text-sm text-muted mb-6">{error || 'Server bilan aloqa uzildi'}</p>
        <Button variant="primary" onClick={loadData} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Qayta urinish
        </Button>
      </Card>
    );
  }

  const { kpis, attentionNeeded, classesBreakdown } = reports;
  const schoolName = schoolProfile?.name || `${user?.schoolNumber || 71}-sonli Maktab-Internati`;

  return (
    <div className="space-y-6">
      {/* Top Welcome & School Identity Banner */}
      <div className="bg-gradient-to-r from-[#123C5C] via-[#1B6FA8] to-[#123C5C] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="space-y-2 max-w-2xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide uppercase border border-white/10">
            <SchoolIcon className="w-3.5 h-3.5" />
            Maktab Admini Boshqaruv Markazi
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-serif tracking-tight">
            {schoolName}
          </h1>
          <p className="text-sm text-[#D3E6F5]/80">
            Maktab o'qituvchilari, o'quvchilar salomatligi va pedagogik jarayonlarning real vaqtdagi monitoringi.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 z-10 w-full sm:w-auto">
          <Link to="/school-admin/teachers" className="w-full sm:w-auto">
            <Button variant="secondary" size="md" className="gap-2 font-bold bg-white text-primary hover:bg-white/90 shadow-md w-full justify-center">
              <UserPlus className="w-4 h-4 text-primary" /> + O'qituvchi qo'shish
            </Button>
          </Link>
          <Link to="/school-admin/announcements" className="w-full sm:w-auto">
            <Button variant="secondary" size="md" className="gap-2 font-bold border-white/30 text-white hover:bg-white/10 w-full justify-center">
              <Megaphone className="w-4 h-4" /> Bildirishnoma yuborish
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: O'qituvchilar */}
        <Card variant="white" className="p-5 shadow-sm border border-primary/5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-muted">Jami faol</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-deep">
            {kpis.totalTeachers}
          </div>
          <div className="text-xs text-muted font-medium mt-1">
            Maktab o'qituvchilari
          </div>
        </Card>

        {/* KPI 2: O'quvchilar */}
        <Card variant="white" className="p-5 shadow-sm border border-primary/5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl bg-cardBlue text-primary">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-muted">{kpis.totalClasses} ta sinf</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-deep">
            {kpis.totalStudents}
          </div>
          <div className="text-xs text-muted font-medium mt-1">
            Ro'yxatdagi o'quvchilar
          </div>
        </Card>

        {/* KPI 3: Bugungi qayd kiritish foizi */}
        <Card variant="white" className="p-5 shadow-sm border border-primary/5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl bg-success/10 text-success">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-success">
              {kpis.todayLoggedCount}/{kpis.totalStudents}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-deep">
            {kpis.todayLogRatePercentage}%
          </div>
          <div className="text-xs text-muted font-medium mt-1">
            Bugungi kunlik qayd foizi
          </div>
        </Card>

        {/* KPI 4: E'tibor talab holatlar */}
        <Card variant="white" className="p-5 shadow-sm border border-primary/5 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-2xl bg-coral/10 text-coral">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-coral">Diqqat markazida</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-coral">
            {kpis.activeAlertsCount}
          </div>
          <div className="text-xs text-muted font-medium mt-1">
            E'tibor talab o'quvchilar
          </div>
        </Card>
      </div>

      {/* Attention Alerts Card */}
      {attentionNeeded.length > 0 && (
        <Card variant="white" className="p-6 border-l-4 border-l-coral shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-coral/10 rounded-xl text-coral">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-deep">
                  Tibbiy-pedagogik e'tibor talab qiladigan holatlar ({attentionNeeded.length})
                </h3>
                <p className="text-xs text-muted">
                  Bugungi kun davomida kayfiyatida yoki salomatligida bezovtalik qayd etilgan bolalar
                </p>
              </div>
            </div>
            <Link
              to="/school-admin/students"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              Barcha o'quvchilar <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attentionNeeded.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-bg border border-coral/20 flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-coral/10 text-coral flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  !
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-deep truncate">{item.fullName}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-white text-muted rounded-full border border-cardBlue">
                      {item.className}
                    </span>
                  </div>
                  <div className="text-xs text-coral font-medium mt-1">
                    {item.mood} • {item.health}
                  </div>
                  {item.teacherNote && (
                    <p className="text-xs text-muted mt-1 italic line-clamp-2">
                      "{item.teacherNote}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Class Activity Breakdown & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Class Progress Bars (2 cols) */}
        <Card variant="white" className="p-6 lg:col-span-2 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-deep">Sinflar kesimida kunlik faollik</h3>
              <p className="text-xs text-muted">Bugungi kunlik holatlar qaysi sinflarda kiritilgan</p>
            </div>
            <Link to="/school-admin/reports" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
              Batafsil tahlil <TrendingUp className="w-3.5 h-3.5" />
            </Link>
          </div>

          {classesBreakdown.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">Sinflar ma'lumoti mavjud emas</p>
          ) : (
            <div className="space-y-4">
              {classesBreakdown.map((c) => (
                <div key={c.className} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-deep">{c.className}</span>
                    <span className="text-muted font-medium">
                      {c.todayLogged}/{c.totalStudents} o'quvchi ({c.ratePercentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-bg rounded-full overflow-hidden border border-primary/5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        c.ratePercentage === 100
                          ? 'bg-success'
                          : c.ratePercentage >= 50
                          ? 'bg-primary'
                          : 'bg-coral'
                      }`}
                      style={{ width: `${c.ratePercentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right: Quick Tools */}
        <div className="space-y-4">
          <Card variant="white" className="p-6 shadow-sm space-y-3">
            <h3 className="text-base font-bold text-deep mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Tezkor havolalar
            </h3>

            <Link
              to="/school-admin/teachers"
              className="flex items-center justify-between p-3 rounded-2xl bg-bg hover:bg-cardBlue/50 transition-colors border border-primary/5 text-sm font-semibold text-deep group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white text-primary shadow-xs">
                  <Users className="w-4 h-4" />
                </div>
                <span>O'qituvchilar ro'yxati</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/school-admin/cameras"
              className="flex items-center justify-between p-3 rounded-2xl bg-bg hover:bg-cardBlue/50 transition-colors border border-primary/5 text-sm font-semibold text-deep group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white text-primary shadow-xs">
                  <Video className="w-4 h-4" />
                </div>
                <span>Kamera nazorati</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/school-admin/profile"
              className="flex items-center justify-between p-3 rounded-2xl bg-bg hover:bg-cardBlue/50 transition-colors border border-primary/5 text-sm font-semibold text-deep group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white text-primary shadow-xs">
                  <SchoolIcon className="w-4 h-4" />
                </div>
                <span>Maktab profili & rekvizitlar</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted group-hover:translate-x-1 transition-transform" />
            </Link>
          </Card>
          {/* Danger Zone: Database Reset */}
          <Card variant="white" className="p-6 shadow-sm border border-red-200 bg-red-500/5 space-y-3">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <ShieldAlert className="w-4 h-4" />
              <span>Ma'lumotlar bazasini boshqarish</span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Yangi o'quv yili yoki tizimni toza holatda qayta ishga tushirish uchun maktab bazasini xavfsiz tozalash.
            </p>
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-red-300 text-red-600 hover:bg-red-600 hover:text-white transition-all text-xs font-bold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Bazani tozalash va qayta boshlash
            </button>
          </Card>
        </div>
      </div>
      <DatabaseResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        schoolNumber={user?.schoolNumber || 71}
        onSuccess={loadData}
      />
    </div>
  );
}
