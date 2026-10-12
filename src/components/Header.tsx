import React from 'react';
import { Student, DosenProfile } from '../types';
import {
  BookOpen,
  User,
  ShieldCheck,
  Share2,
  Wifi,
  WifiOff,
  Calendar,
  Award,
  FileQuestion,
  Film,
  Layers,
  School,
  Volume2,
  VolumeX,
  FileText,
  Settings,
  Archive,
  Gamepad2,
  Users,
  Bell,
  Clock,
  Sun,
  Moon,
  Trophy,
  DoorOpen,
  Minimize2,
  Maximize2,
  Zap,
} from 'lucide-react';

interface HeaderProps {
  currentStudent: Student | null;
  isDosen: boolean;
  isOffline: boolean;
  activeOnlineCount: number;
  courseProfile?: DosenProfile;
  coursesCount?: number;
  soundEnabled: boolean;
  utsFormat?: 'esai' | 'proyek_video';
  uasFormat?: 'proyek_video' | 'esai';
  unreadNotificationCount?: number;
  hasUrgentDeadline?: boolean;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenNotificationCenter?: () => void;
  onToggleSound: () => void;
  onOpenStudentSelect: () => void;
  onOpenStudentProfile?: () => void;
  onOpenDosenLogin: () => void;
  onLogoutDosen: () => void;
  onOpenShareModal: () => void;
  onOpenCourseSelect: () => void;
  onOpenRpsModal: () => void;
  onOpenProfileModal?: () => void;
  onOpenSemesterTransition?: () => void;
  onOpenBiodataModal?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStudent,
  isDosen,
  isOffline,
  activeOnlineCount,
  courseProfile,
  coursesCount = 1,
  soundEnabled,
  utsFormat = 'esai',
  uasFormat = 'proyek_video',
  unreadNotificationCount = 0,
  hasUrgentDeadline = false,
  theme = 'light',
  onToggleTheme,
  onOpenNotificationCenter,
  onToggleSound,
  onOpenStudentSelect,
  onOpenStudentProfile,
  onOpenDosenLogin,
  onLogoutDosen,
  onOpenShareModal,
  onOpenCourseSelect,
  onOpenRpsModal,
  onOpenProfileModal,
  onOpenSemesterTransition,
  onOpenBiodataModal,
  activeTab,
  setActiveTab,
}) => {
  const [isCompactMenu, setIsCompactMenu] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem('siakad_compact_menu') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCompactMenu = () => {
    setIsCompactMenu(prev => {
      const next = !prev;
      try {
        localStorage.setItem('siakad_compact_menu', String(next));
      } catch {}
      return next;
    });
  };

  const campus = courseProfile?.campusName || 'STAI Jarinabi';
  const dosenFullName = courseProfile?.name || (courseProfile?.dosenName ? `${courseProfile.dosenName}${courseProfile.dosenTitle ? ', ' + courseProfile.dosenTitle : ''}` : 'Risfa Tri Ulfa, S.Pd., M.Pd., Gr.');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-emerald-500/30 text-emerald-200 font-bold px-2 py-0.5 rounded-full border border-emerald-400/40 text-[11px] tracking-wide flex items-center gap-1">
              <School size={12} />
              <span>{campus}</span>
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="font-semibold text-slate-200">
              Dosen: <span className="text-white font-bold">{dosenFullName}</span>
            </span>
            <span className="hidden md:inline text-slate-400">•</span>
            <span className="hidden md:inline font-medium text-slate-300">
              {courseProfile?.courseTitle || 'Filsafat Ilmu'} ({courseProfile?.courseCode || 'STI 105'})
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Audio chime toggle */}
            <button
              onClick={onToggleSound}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors border ${
                soundEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30'
                  : 'bg-slate-700/40 text-slate-400 border-slate-600 hover:bg-slate-700/60'
              }`}
              title={soundEnabled ? 'Suara chime aktif saat mahasiswa online (klik untuk senyapkan)' : 'Suara notifikasi dibisukan (klik untuk bunyikan)'}
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              <span className="hidden sm:inline">{soundEnabled ? 'Suara Online: Aktif' : 'Mute'}</span>
            </button>

            {/* Live Presence indicator */}
            <div className="flex items-center gap-1.5 bg-black/30 px-2.5 py-0.5 rounded-full text-emerald-300 font-medium border border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>{activeOnlineCount} Online</span>
            </div>

            {/* Offline/Online badge */}
            <div className="flex items-center gap-1 text-[11px] text-slate-300">
              {isOffline ? (
                <span className="flex items-center gap-1 text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded">
                  <WifiOff size={12} /> Offline
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-300">
                  <Wifi size={12} /> Terhubung
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header bar */}
      <div className={`max-w-7xl mx-auto px-4 transition-all duration-200 ${isCompactMenu ? 'py-1.5 sm:py-2' : 'py-3 sm:py-3.5'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Logo & Course Info */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className={`rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-md font-bold flex-shrink-0 transition-all ${
              isCompactMenu ? 'h-8 w-8 text-sm' : 'h-11 w-11 text-lg'
            }`}>
              <BookOpen size={isCompactMenu ? 16 : 22} className="text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`font-black text-slate-900 tracking-tight leading-none font-serif-title transition-all ${
                  isCompactMenu ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
                }`}>
                  {courseProfile?.courseTitle || 'Filsafat Ilmu'}
                </h1>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  {courseProfile?.courseCode || 'STI 105'} • {courseProfile?.sks || 2} SKS
                </span>

                {/* Semester & Room Tag */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                  (courseProfile?.semesterNumber === 3 || courseProfile?.semester?.includes('3') || courseProfile?.semester?.includes('III'))
                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}>
                  <DoorOpen size={11} className="shrink-0" />
                  <span>
                    {courseProfile?.roomName || (
                      (courseProfile?.semesterNumber === 3 || courseProfile?.semester?.includes('3') || courseProfile?.semester?.includes('III'))
                        ? 'Kamar MPI 3'
                        : 'Kamar MPI 1'
                    )}
                  </span>
                </span>
                
                {/* Course & Room Switcher trigger */}
                <button
                  onClick={onOpenCourseSelect}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-white transition-colors shadow-2xs border border-slate-700 cursor-pointer"
                  title="Pilih, kelola, atau ganti mata kuliah & semester yang diampu"
                >
                  <Layers size={12} className="text-emerald-400" />
                  <span>{coursesCount > 1 ? `Mata Kuliah & RPS (${coursesCount})` : 'Pilih MK & RPS'}</span>
                </button>
              </div>
              <div className={`text-slate-500 flex items-center gap-2 flex-wrap transition-all ${
                isCompactMenu ? 'text-[11px] mt-0.5' : 'text-xs mt-1'
              }`}>
                <span>{campus}</span>
                <span>•</span>
                <span>Prodi: {courseProfile?.studyProgram || 'MPI 1'}</span>
                <span>•</span>
                <span className="font-semibold text-slate-700">{courseProfile?.semester || 'Semester I'}</span>
                <span>•</span>
                <span className="font-semibold text-emerald-800">{dosenFullName}</span>
              </div>
            </div>
          </div>

          {/* User Status and Action Controls */}
          <div className="flex items-center flex-wrap gap-2">
            
            {/* Toggle Perkecil / Perluas Menu */}
            <button
              id="btn-toggle-compact-menu"
              type="button"
              onClick={toggleCompactMenu}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                isCompactMenu
                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border-emerald-400 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title={isCompactMenu ? 'Kembalikan menu navigasi ke ukuran standar' : 'Perkecil menu navigasi untuk memperluas ruang kerja layar'}
            >
              {isCompactMenu ? <Maximize2 size={13} className="text-emerald-700" /> : <Minimize2 size={13} className="text-slate-600" />}
              <span className="hidden sm:inline font-bold">{isCompactMenu ? 'Perluas Menu' : 'Perkecil Menu'}</span>
              <span className="sm:hidden font-bold">{isCompactMenu ? 'Besar' : 'Kecil'}</span>
            </button>
            
            {/* View RPS Document Modal Button */}
            <button
              onClick={onOpenRpsModal}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors shadow-xs"
              title="Lihat Rencana Pembelajaran Semester (RPS) lengkap dan unduh ke Microsoft Word"
            >
              <FileText size={14} className="text-teal-700" />
              <span>Lihat RPS</span>
            </button>

            {/* Dosen Specific Quick Controls */}
            {isDosen && onOpenProfileModal && (
              <button
                onClick={onOpenProfileModal}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                title="Edit nama kampus (STAI Jarinabi) dan gelar akademik dosen"
              >
                <Settings size={14} className="text-slate-600" />
                <span className="hidden sm:inline">Kampus & Gelar</span>
              </button>
            )}

            {isDosen && onOpenSemesterTransition && (
              <button
                onClick={onOpenSemesterTransition}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors shadow-xs"
                title="Pindah ke semester baru, simpan arsip nilai Word/Excel, dan upload RPS terbaru"
              >
                <Archive size={14} className="text-amber-700" />
                <span>Pindah Semester</span>
              </button>
            )}

            {isDosen && onOpenBiodataModal && (
              <button
                onClick={onOpenBiodataModal}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 transition-colors shadow-xs"
                title="Kelola data & biodata mahasiswa (NIM, Tempat/Tgl Lahir, Alamat, Upload Dokumen)"
              >
                <Users size={14} className="text-indigo-700" />
                <span>Data Mahasiswa</span>
              </button>
            )}

            {/* Notification Bell with Badge & Deadline Alert */}
            {onOpenNotificationCenter && (
              <button
                id="btn-open-notifications"
                onClick={onOpenNotificationCenter}
                className={`relative flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-colors border shadow-xs ${
                  hasUrgentDeadline
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400/40'
                    : unreadNotificationCount > 0
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="Pusat Notifikasi: Pengingat Deadline (< 24 Jam) & Riwayat Pengumpulan Tugas"
              >
                <div className="relative">
                  <Bell size={15} className={hasUrgentDeadline ? 'text-amber-600 animate-bounce' : 'text-emerald-700'} />
                  {hasUrgentDeadline && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline">Notifikasi</span>
                {unreadNotificationCount > 0 && (
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                      hasUrgentDeadline
                        ? 'bg-rose-500 text-white'
                        : 'bg-emerald-700 text-white'
                    }`}
                  >
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
            )}

            {/* Dark / Light Theme Toggle */}
            {onToggleTheme && (
              <button
                id="btn-toggle-theme"
                onClick={onToggleTheme}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition-colors shadow-xs cursor-pointer"
                title={theme === 'dark' ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun size={15} className="text-amber-400" />
                    <span className="hidden sm:inline">Terang</span>
                  </>
                ) : (
                  <>
                    <Moon size={15} className="text-indigo-600" />
                    <span className="hidden sm:inline">Gelap</span>
                  </>
                )}
              </button>
            )}

            {/* Share to WA button */}
            <button
              id="btn-share-wa"
              onClick={onOpenShareModal}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
              title="Bagikan tautan portal perkuliahan tatap muka ke grup WhatsApp mahasiswa"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">Share ke WA</span>
            </button>

            {/* Student Role Identification */}
            {!isDosen && (
              <button
                id="btn-select-student"
                onClick={onOpenStudentSelect}
                className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 transition-colors"
              >
                <div className="relative">
                  <User size={15} className="text-emerald-700" />
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                </div>
                <div className="text-left leading-tight">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold flex items-center justify-between gap-1">
                    <span>Mahasiswa Aktif:</span>
                    {currentStudent && (
                      <span
                        onClick={(e) => {
                          if (onOpenStudentProfile) {
                            e.stopPropagation();
                            onOpenStudentProfile();
                          }
                        }}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-black text-[9px] border border-amber-300 transition-colors shadow-2xs"
                        title="Poin Keaktifan Mahasiswa (Klik untuk lihat profil keaktifan)"
                      >
                        <Zap size={9} className="fill-amber-500 text-amber-600" />
                        <span>{currentStudent.activityPoints || 0} Poin</span>
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[180px]">
                    {currentStudent ? currentStudent.name : 'Pilih Nama Anda'}
                  </div>
                </div>
              </button>
            )}

            {/* Dosen Portal Button or Active Badge */}
            {isDosen ? (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg">
                <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs">
                  <ShieldCheck size={16} className="text-indigo-600" />
                  <span>Portal Dosen</span>
                </div>
                <button
                  id="btn-logout-dosen"
                  onClick={onLogoutDosen}
                  className="text-[11px] text-indigo-700 underline hover:text-indigo-900 font-medium ml-1"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <button
                id="btn-dosen-login"
                onClick={onOpenDosenLogin}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-indigo-300 text-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 transition-colors"
              >
                <ShieldCheck size={15} className="text-indigo-600" />
                <span>Portal Dosen</span>
              </button>
            )}

          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 transition-all duration-200 ${
          isCompactMenu ? 'mt-1.5 pt-1.5' : 'mt-3 sm:mt-3.5 pt-2.5'
        }`}>
          <button
            onClick={() => setActiveTab('jadwal')}
            className={`flex items-center gap-1.5 font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              isCompactMenu ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs sm:text-sm'
            } ${
              activeTab === 'jadwal'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar size={isCompactMenu ? 13 : 15} />
            <span>RPS & 16 Temu</span>
          </button>

          <button
            onClick={() => setActiveTab('tugas-individu')}
            className={`flex items-center gap-1.5 font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              isCompactMenu ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs sm:text-sm'
            } ${
              activeTab === 'tugas-individu'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen size={isCompactMenu ? 13 : 15} />
            <span>Tugas Presentasi</span>
          </button>

          <button
            id="nav-tugas-uts"
            onClick={() => setActiveTab('tugas-uts')}
            className={`flex items-center gap-1.5 font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              isCompactMenu ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs sm:text-sm'
            } ${
              activeTab === 'tugas-uts'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileQuestion size={isCompactMenu ? 13 : 15} />
            <span>UTS ({utsFormat === 'proyek_video' ? 'Video' : 'Essay'})</span>
          </button>

          <button
            id="nav-tugas-uas"
            onClick={() => setActiveTab('tugas-kelompok')}
            className={`flex items-center gap-1.5 font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              isCompactMenu ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs sm:text-sm'
            } ${
              activeTab === 'tugas-kelompok'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Film size={isCompactMenu ? 13 : 15} />
            <span>UAS ({uasFormat === 'esai' ? 'Essay' : 'Video'})</span>
          </button>

          <button
            id="nav-kuis-interaktif"
            onClick={() => setActiveTab('kuis-interaktif')}
            className={`flex items-center gap-1.5 font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              isCompactMenu ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs sm:text-sm'
            } ${
              activeTab === 'kuis-interaktif'
                ? 'bg-amber-600 text-white shadow-xs font-bold'
                : 'text-amber-900 bg-amber-50 hover:bg-amber-100 hover:text-amber-950 border border-amber-200/60'
            }`}
          >
            <Gamepad2 size={isCompactMenu ? 13 : 15} className={activeTab === 'kuis-interaktif' ? 'animate-bounce' : 'text-amber-700'} />
            <span>Game Kuis RPS</span>
          </button>

          <button
            onClick={() => setActiveTab('absensi')}
            className={`flex items-center gap-1.5 font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              isCompactMenu ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs sm:text-sm'
            } ${
              activeTab === 'absensi'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar size={isCompactMenu ? 13 : 15} />
            <span>Presensi (16 Pertemuan)</span>
          </button>

          <button
            id="nav-leaderboard"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-1.5 font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              isCompactMenu ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs sm:text-sm'
            } ${
              activeTab === 'leaderboard'
                ? 'bg-amber-600 text-white shadow-xs font-bold'
                : 'text-amber-900 bg-amber-50 hover:bg-amber-100 hover:text-amber-950 border border-amber-200/70'
            }`}
          >
            <Trophy size={isCompactMenu ? 13 : 15} className={activeTab === 'leaderboard' ? 'animate-bounce text-yellow-300' : 'text-amber-600'} />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab('nilai')}
            className={`flex items-center gap-1.5 font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              isCompactMenu ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs sm:text-sm'
            } ${
              activeTab === 'nilai'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award size={isCompactMenu ? 13 : 15} />
            <span>Rekap Nilai</span>
          </button>

          {isDosen && (
            <button
              onClick={() => setActiveTab('portal-dosen')}
              className={`flex items-center gap-1.5 font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                isCompactMenu ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-xs sm:text-sm'
              } ${
                activeTab === 'portal-dosen'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'text-indigo-800 bg-indigo-50 hover:bg-indigo-100'
              }`}
            >
              <ShieldCheck size={isCompactMenu ? 13 : 15} />
              <span>Portal Dosen</span>
            </button>
          )}

          {/* Quick Perkecil/Perluas Menu Button at edge */}
          <button
            type="button"
            onClick={toggleCompactMenu}
            className="ml-auto flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg text-slate-600 hover:text-emerald-900 hover:bg-emerald-50 bg-slate-100 transition-colors shrink-0 border border-slate-300 cursor-pointer shadow-2xs"
            title={isCompactMenu ? 'Perluas tampilan menu navigasi' : 'Perkecil tampilan menu navigasi'}
          >
            {isCompactMenu ? <Maximize2 size={12} className="text-emerald-700" /> : <Minimize2 size={12} className="text-slate-600" />}
            <span className="hidden md:inline">{isCompactMenu ? 'Perluas Menu' : 'Perkecil Menu'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
