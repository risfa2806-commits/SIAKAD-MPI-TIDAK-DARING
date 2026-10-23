import React from 'react';
import { Student } from '../types';
import {
  X,
  Zap,
  Award,
  Sparkles,
  TrendingUp,
  Calendar,
  User,
  ShieldCheck,
  Printer,
  ChevronRight,
  Flame,
  CheckCircle2,
  Clock,
  BookOpen,
  MessageSquare,
  Trophy,
} from 'lucide-react';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  allStudents?: Student[];
  dosenName?: string;
  courseTitle?: string;
}

export function getActivityTier(points: number = 0) {
  if (points >= 60) {
    return {
      title: 'Maestro Cendekia',
      icon: '👑',
      badgeColor: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-amber-300 shadow-md',
      bgCard: 'from-amber-950/40 via-yellow-900/20 to-slate-900',
      nextTier: 'Puncak Prestasi Tertinggi (Maksimal)',
      pointsToNext: 0,
      progress: 100,
    };
  }
  if (points >= 40) {
    return {
      title: 'Bintang Cendekia',
      icon: '🌟',
      badgeColor: 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 border-amber-300',
      bgCard: 'from-amber-950/30 via-slate-900 to-slate-950',
      nextTier: 'Maestro Cendekia (60 Poin)',
      pointsToNext: 60 - points,
      progress: Math.round(((points - 40) / 20) * 100),
    };
  }
  if (points >= 20) {
    return {
      title: 'Cendekia Aktif',
      icon: '⭐',
      badgeColor: 'bg-emerald-500 text-white border-emerald-300',
      bgCard: 'from-emerald-950/30 via-slate-900 to-slate-950',
      nextTier: 'Bintang Cendekia (40 Poin)',
      pointsToNext: 40 - points,
      progress: Math.round(((points - 20) / 20) * 100),
    };
  }
  if (points >= 10) {
    return {
      title: 'Pejuang Diskusi',
      icon: '💬',
      badgeColor: 'bg-blue-600 text-white border-blue-400',
      bgCard: 'from-blue-950/30 via-slate-900 to-slate-950',
      nextTier: 'Cendekia Aktif (20 Poin)',
      pointsToNext: 20 - points,
      progress: Math.round(((points - 10) / 10) * 100),
    };
  }
  if (points >= 1) {
    return {
      title: 'Cendekia Pemula',
      icon: '🌱',
      badgeColor: 'bg-teal-600 text-white border-teal-400',
      bgCard: 'from-teal-950/30 via-slate-900 to-slate-950',
      nextTier: 'Pejuang Diskusi (10 Poin)',
      pointsToNext: 10 - points,
      progress: Math.round((points / 10) * 100),
    };
  }
  return {
    title: 'Belum Memiliki Poin',
    icon: '⚪',
    badgeColor: 'bg-slate-700 text-slate-300 border-slate-600',
    bgCard: 'from-slate-900 via-slate-900 to-slate-950',
    nextTier: 'Cendekia Pemula (1 Poin)',
    pointsToNext: 1,
    progress: 0,
  };
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  allStudents = [],
  dosenName = 'Risfa Tri Ulfa, S.Pd., M.Pd.',
  courseTitle = 'Filsafat Ilmu',
}) => {
  if (!isOpen || !student) return null;

  const currentPoints = student.activityPoints || 0;
  const tier = getActivityTier(currentPoints);

  // Calculate rank based on activity points among all students
  const sortedStudents = [...allStudents].sort((a, b) => (b.activityPoints || 0) - (a.activityPoints || 0));
  const rankIndex = sortedStudents.findIndex(s => s.id === student.id || s.nim === student.nim);
  const rankNumber = rankIndex >= 0 ? rankIndex + 1 : 1;

  const logs = student.activityPointLogs || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 flex justify-center items-start min-h-screen animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto sm:my-6 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-amber-400/20">
              <Zap className="w-6 h-6 fill-slate-950" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-amber-400 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" />
                <span>Profil Keaktifan Cendekia Mahasiswa</span>
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                {student.name}
              </h2>
              <div className="text-xs text-slate-300 font-mono flex items-center gap-2 mt-0.5">
                <span>NIM: {student.nim}</span>
                <span>•</span>
                <span>Kelompok {student.groupId}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer"
              title="Cetak Ringkasan Poin / Simpan PDF"
            >
              <Printer size={16} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto scrollbar-thin">
          
          {/* Main Hero Card: Poin Keaktifan & Tingkat */}
          <div className={`p-5 rounded-2xl border border-white/10 bg-gradient-to-br ${tier.bgCard} relative overflow-hidden shadow-xl`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>
            
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider block mb-1">
                  Total Akumulasi Poin Keaktifan
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-black text-amber-300 tracking-tight font-mono">
                    {currentPoints}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-white/90">
                    Poin Keaktifan
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-xs inline-flex items-center gap-1.5 ${tier.badgeColor}`}>
                    <span>{tier.icon}</span>
                    <span>{tier.title}</span>
                  </span>
                  <span className="text-xs font-semibold bg-white/10 text-slate-200 px-3 py-1 rounded-full border border-white/10 inline-flex items-center gap-1">
                    <Trophy size={13} className="text-amber-400" />
                    <span>Peringkat #{rankNumber} di Kelas ({allStudents.length} Mahasiswa)</span>
                  </span>
                </div>
              </div>

              {/* Progress to next level */}
              <div className="bg-black/30 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 sm:max-w-xs w-full space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Target Level Berikutnya:</span>
                  <span className="font-bold text-amber-300">{tier.progress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${Math.min(100, Math.max(5, tier.progress))}%` }}
                  ></div>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between">
                  <span>{tier.title}</span>
                  <span className="text-slate-300 font-medium">{tier.nextTier}</span>
                </div>
                {tier.pointsToNext > 0 && (
                  <p className="text-[10px] text-amber-300/90 italic pt-0.5">
                    Kurang <strong>{tier.pointsToNext} poin lagi</strong> untuk naik pangkat berikutnya! Terus aktif berdiskusi di kelas.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Motivation Quote Box */}
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs sm:text-sm leading-relaxed flex items-start gap-3 shadow-inner">
            <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <strong className="text-white font-semibold">Penyemangat Cendekia:</strong> Setiap pertanyaan kritis, sanggahan ilmiah, dan jawaban yang Anda berikan dalam ruang kuliah tatap muka dinilai langsung oleh Dosen sebagai bukti kesungguhan menuntut ilmu.
            </div>
          </div>

          {/* History of Activity Points */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Clock size={16} className="text-indigo-400" />
                <span>Riwayat Catatan Poin dari Dosen Pengampu</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono font-normal">
                  {logs.length} Catatan
                </span>
              </h3>
              <span className="text-xs text-slate-400">
                Dosen: <strong>{dosenName}</strong>
              </span>
            </div>

            {logs.length === 0 ? (
              <div className="text-center py-8 bg-slate-800/40 rounded-xl border border-dashed border-slate-700 text-slate-400 text-xs">
                Belum ada catatan poin keaktifan untuk mahasiswa ini. Dosen akan menambahkan poin saat Anda berpartisipasi aktif dalam sesi perkuliahan tatap muka.
              </div>
            ) : (
              <div className="divide-y divide-white/5 bg-slate-800/40 rounded-xl border border-white/10 overflow-hidden">
                {logs.map((log) => {
                  const isPositive = log.points >= 0;
                  return (
                    <div
                      key={log.id}
                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-white/5 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs font-black rounded-lg font-mono ${
                            isPositive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                          }`}>
                            {isPositive ? `+${log.points}` : log.points} Poin
                          </span>
                          {log.meetingNumber && (
                            <span className="text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-md">
                              Pertemuan {log.meetingNumber}
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            {new Date(log.timestamp).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-200 font-medium">
                          "{log.reason}"
                        </p>
                      </div>

                      <div className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1 self-start sm:self-center">
                        <ShieldCheck size={13} className="text-emerald-400" />
                        <span>Diverifikasi Dosen</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Academic Topic & Details Card */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-white/5 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <BookOpen size={14} className="text-amber-400" />
              <span>Tugas & Topik Kajian Mahasiswa di RPS:</span>
            </div>
            <p className="italic text-slate-300">
              "{student.topic || 'Hakikat Filsafat Ilmu Manajemen Pendidikan Islam'}"
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
              <span>Alokasi: {student.rpsPart || 'Pertemuan Mandiri'}</span>
              <span>•</span>
              <span>Kelompok RPS: Kelompok {student.groupId}</span>
              <span>•</span>
              <span>Mata Kuliah: {courseTitle}</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400 hidden sm:block">
            Data Poin Keaktifan tersimpan permanen di database SIAKAD.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer ml-auto"
          >
            Tutup Profil Keaktifan
          </button>
        </div>

      </div>
    </div>
  );
};
