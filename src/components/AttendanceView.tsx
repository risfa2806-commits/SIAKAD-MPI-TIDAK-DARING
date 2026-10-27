import React, { useState, useMemo, useEffect } from 'react';
import { Student, MeetingSchedule, AttendanceStatus, DosenProfile, ArchivedSemester, StudentGrade } from '../types';
import { updateAttendanceApi, isStudentOnline, formatActiveTime, updateMeetingApi } from '../services/api';
import {
  exportAttendanceToWord,
  exportAttendanceToExcel,
  exportAttendanceToPdf,
  downloadAttendanceAsPdfFile,
  printSingleMeetingAttendance,
  downloadSingleMeetingAttendanceAsPdfFile,
  exportSingleMeetingAttendanceToWord,
} from '../utils/documentExport';
import { AttendanceRecapModal } from './AttendanceRecapModal';
import { AttendanceExportModal } from './AttendanceExportModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  UserCheck,
  ShieldCheck,
  CheckCheck,
  Search,
  Edit2,
  Save,
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Table,
  Layers,
  Loader2,
  SlidersHorizontal,
  UserPlus,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Activity,
  AlertTriangle,
  Info,
  PieChart as PieIcon,
  Filter,
  Check,
  Users,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface AttendanceViewProps {
  students: Student[];
  meetings: MeetingSchedule[];
  attendance: Record<number, Record<string, AttendanceStatus>>;
  isDosen: boolean;
  currentStudent: Student | null;
  onRefreshData: () => Promise<void>;
  onOpenDosenLogin: () => void;
  onOpenAddStudent?: () => void;
  courseProfile?: DosenProfile;
  archivedSemesters?: ArchivedSemester[];
  grades?: Record<string, StudentGrade>;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students = [],
  meetings = [],
  attendance = {},
  isDosen = false,
  currentStudent,
  onRefreshData,
  onOpenDosenLogin,
  onOpenAddStudent,
  courseProfile,
  archivedSemesters = [],
  grades = {},
}) => {
  // Selected meeting for detailed viewing / attendance ticking (default to meeting 1: 12 Sept 2026)
  const [selectedMeetingNumber, setSelectedMeetingNumber] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);

  // Persistent local attendance state to guarantee immediate UI updates on click,
  // eliminate UI mismatches, and ensure 'Sudah Absen' + disabled state persist across re-renders.
  // Isolated per course code/title so different MK & semester rosters never clash!
  const courseStorageKey = `siakad_local_attendance_${courseProfile?.courseCode || courseProfile?.courseTitle || 'default'}`;
  const [localAttendance, setLocalAttendance] = useState<Record<number, Record<string, AttendanceStatus>>>(() => {
    try {
      const saved = localStorage.getItem(courseStorageKey);
      if (saved && (saved.trim().startsWith('{') || saved.trim().startsWith('['))) {
        return JSON.parse(saved);
      }
      return {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(courseStorageKey, JSON.stringify(localAttendance));
    } catch (e) {
      console.error(e);
    }
  }, [localAttendance, courseStorageKey]);

  // Recharts Attendance Visualisation states
  type ChartViewMode = 'stacked' | 'grouped' | 'trend' | 'distribution';
  type ChartPhaseFilter = 'all' | 'pra_uts' | 'pasca_uts' | 'exam';

  const [chartMode, setChartMode] = useState<ChartViewMode>('stacked');
  const [chartPhase, setChartPhase] = useState<ChartPhaseFilter>('all');
  const [showThreshold, setShowThreshold] = useState<boolean>(true);
  const [isChartCollapsed, setIsChartCollapsed] = useState(false);
  const [isAtRiskDrawerOpen, setIsAtRiskDrawerOpen] = useState(false);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);

  // Merge server attendance with immediate local attendance overrides
  const effectiveAttendance = useMemo(() => {
    const merged: Record<number, Record<string, AttendanceStatus>> = {};
    // 1. Base from server attendance prop
    Object.keys(attendance || {}).forEach(mKey => {
      const mNum = Number(mKey);
      merged[mNum] = { ...(attendance[mNum] || {}) };
    });
    // 2. Overlay local optimistic attendance
    Object.keys(localAttendance || {}).forEach(mKey => {
      const mNum = Number(mKey);
      if (!merged[mNum]) merged[mNum] = {};
      Object.assign(merged[mNum], localAttendance[mNum]);
    });
    return merged;
  }, [attendance, localAttendance]);

  // Meeting date & title editing state for Dosen
  const [isEditingMeeting, setIsEditingMeeting] = useState(false);
  const [editedDateStr, setEditedDateStr] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedPresenters, setEditedPresenters] = useState('');
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);

  // Export Modal & Loading states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportModalMeetingNumber, setExportModalMeetingNumber] = useState<number>(0);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingSessionPdf, setIsDownloadingSessionPdf] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const activeMeeting = (meetings || []).find(m => m.meetingNumber === selectedMeetingNumber) || meetings?.[0];

  const triggerActionFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handlePrint16Pdf = () => {
    exportAttendanceToPdf(exportOpts);
    triggerActionFeedback('Membuka jendela cetak / dialog simpan PDF Rekap 16 Pertemuan...');
  };

  const handleDirectDownload16Pdf = async () => {
    setIsDownloadingPdf(true);
    triggerActionFeedback('Sedang menyiapkan file PDF 16 Pertemuan...');
    try {
      await downloadAttendanceAsPdfFile(exportOpts);
      triggerActionFeedback('File PDF Rekap 16 Pertemuan berhasil diunduh!');
    } catch (err) {
      console.error(err);
      triggerActionFeedback('Membuka jendela cetak PDF...');
      exportAttendanceToPdf(exportOpts);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintSessionAttendance = () => {
    if (!activeMeeting) return;
    printSingleMeetingAttendance({
      ...exportOpts,
      meeting: activeMeeting,
    });
    triggerActionFeedback(`Membuka jendela cetak Presensi Pertemuan #${activeMeeting.meetingNumber}...`);
  };

  const handleDownloadSessionPdf = async () => {
    if (!activeMeeting) return;
    setIsDownloadingSessionPdf(true);
    triggerActionFeedback(`Sedang menyiapkan PDF Pertemuan #${activeMeeting.meetingNumber}...`);
    try {
      await downloadSingleMeetingAttendanceAsPdfFile({
        ...exportOpts,
        meeting: activeMeeting,
      });
      triggerActionFeedback(`File PDF Pertemuan #${activeMeeting.meetingNumber} berhasil diunduh!`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloadingSessionPdf(false);
    }
  };

  const handleDownloadSessionWord = () => {
    if (!activeMeeting) return;
    exportSingleMeetingAttendanceToWord({
      ...exportOpts,
      meeting: activeMeeting,
    });
    triggerActionFeedback(`File Word Pertemuan #${activeMeeting.meetingNumber} berhasil diunduh!`);
  };

  const exportOpts = {
    campusName: courseProfile?.campusName || 'STAI Jarinabi',
    dosenFullName:
      courseProfile?.name ||
      (courseProfile?.dosenName
        ? `${courseProfile.dosenName}${courseProfile.dosenTitle ? ', ' + courseProfile.dosenTitle : ''}`
        : 'Risfa Tri Ulfa, S.Pd., M.Pd.'),
    courseTitle: courseProfile?.courseTitle || 'Filsafat Ilmu',
    courseCode: courseProfile?.courseCode || 'STI 105',
    sks: courseProfile?.sks || 2,
    semester: courseProfile?.semester || 'Semester I (Ganjil 2026/2027)',
    studyProgram: courseProfile?.studyProgram || 'Manajemen Pendidikan Islam (MPI)',
    academicYear: '2026/2027',
    students,
    meetings,
    attendance: effectiveAttendance,
    grades,
  };

  // Recharts: Calculate meeting attendance trends across 16 meetings
  const meetingChartData = useMemo(() => {
    const totalEnrolled = students.length || 1;
    return (meetings || []).map((m) => {
      const mAtt = effectiveAttendance[m.meetingNumber] || {};
      let hadir = 0;
      let izin = 0;
      let sakit = 0;
      let alfa = 0;
      let belum = 0;
      const absentStudents: Array<{ id: string; name: string; nim: string; status: 'I' | 'S' | 'A' }> = [];

      students.forEach((s) => {
        const st = mAtt[s.id] || 'BELUM';
        if (st === 'H') hadir++;
        else if (st === 'I') {
          izin++;
          absentStudents.push({ id: s.id, name: s.name, nim: s.nim, status: 'I' });
        } else if (st === 'S') {
          sakit++;
          absentStudents.push({ id: s.id, name: s.name, nim: s.nim, status: 'S' });
        } else if (st === 'A') {
          alfa++;
          absentStudents.push({ id: s.id, name: s.name, nim: s.nim, status: 'A' });
        } else {
          belum++;
        }
      });

      const rate = totalEnrolled > 0 ? Math.round((hadir / totalEnrolled) * 100) : 0;
      const phase: 'pra_uts' | 'uts' | 'pasca_uts' | 'uas' =
        m.meetingNumber === 8 ? 'uts' :
        m.meetingNumber === 16 ? 'uas' :
        m.meetingNumber < 8 ? 'pra_uts' : 'pasca_uts';

      const isExam = m.meetingNumber === 8 || m.meetingNumber === 16;
      const statusColor = rate >= 80 ? '#059669' : rate >= 75 ? '#d97706' : '#e11d48';

      return {
        meetingNumber: m.meetingNumber,
        label: `P${m.meetingNumber}`,
        fullTitle: m.title,
        dateStr: m.dateStr,
        hadir,
        izin,
        sakit,
        alfa,
        belum,
        rate,
        totalEnrolled,
        phase,
        isExam,
        statusColor,
        absentStudents,
      };
    });
  }, [meetings, effectiveAttendance, students]);

  // Filtered chart data based on active phase
  const filteredChartData = useMemo(() => {
    return meetingChartData.filter(item => {
      if (chartPhase === 'pra_uts') return item.meetingNumber >= 1 && item.meetingNumber <= 7;
      if (chartPhase === 'pasca_uts') return item.meetingNumber >= 9 && item.meetingNumber <= 15;
      if (chartPhase === 'exam') return item.meetingNumber === 8 || item.meetingNumber === 16;
      return true; // 'all'
    });
  }, [meetingChartData, chartPhase]);

  // Overall attendance statistics across all 16 meetings
  const chartSummaryStats = useMemo(() => {
    const totalEnrolled = students.length || 1;
    let totalHadirOverall = 0;
    let meetingsWithAttendance = 0;
    let highestAttendanceMeeting = 1;
    let highestAttendanceCount = 0;

    meetingChartData.forEach((item) => {
      totalHadirOverall += item.hadir;
      if (item.hadir > 0 || item.izin > 0 || item.sakit > 0 || item.alfa > 0) {
        meetingsWithAttendance++;
      }
      if (item.hadir >= highestAttendanceCount) {
        highestAttendanceCount = item.hadir;
        highestAttendanceMeeting = item.meetingNumber;
      }
    });

    const divisor = (meetingsWithAttendance || 1) * totalEnrolled;
    const avgAttendancePercent = Math.min(100, Math.round((totalHadirOverall / divisor) * 100));

    return {
      avgAttendancePercent,
      highestAttendanceMeeting,
      highestAttendanceCount,
      totalEnrolled,
      meetingsCount: meetings.length,
      meetingsWithAttendance,
    };
  }, [meetingChartData, students.length, meetings.length]);

  // Semester Aggregate Distribution for Donut Chart
  const semesterDistributionData = useMemo(() => {
    let totalH = 0;
    let totalI = 0;
    let totalS = 0;
    let totalA = 0;

    meetings.forEach(m => {
      const mAtt = effectiveAttendance[m.meetingNumber] || {};
      students.forEach(s => {
        const st = mAtt[s.id];
        if (st === 'H') totalH++;
        else if (st === 'I') totalI++;
        else if (st === 'S') totalS++;
        else if (st === 'A') totalA++;
      });
    });

    const grandTotal = totalH + totalI + totalS + totalA;

    return [
      { name: 'Hadir (H)', value: totalH, color: '#059669', percent: grandTotal > 0 ? Math.round((totalH / grandTotal) * 100) : 0 },
      { name: 'Izin (I)', value: totalI, color: '#0284c7', percent: grandTotal > 0 ? Math.round((totalI / grandTotal) * 100) : 0 },
      { name: 'Sakit (S)', value: totalS, color: '#d97706', percent: grandTotal > 0 ? Math.round((totalS / grandTotal) * 100) : 0 },
      { name: 'Alfa (A)', value: totalA, color: '#e11d48', percent: grandTotal > 0 ? Math.round((totalA / grandTotal) * 100) : 0 },
    ];
  }, [meetings, effectiveAttendance, students]);

  // Lecturer Participation Pattern Detection & Student At-Risk Analysis
  const studentParticipationPatterns = useMemo(() => {
    const atRiskList: Array<{
      student: Student;
      hadirCount: number;
      izinCount: number;
      sakitCount: number;
      alfaCount: number;
      attendanceRate: number;
      recordedMeetings: number;
      riskReason: string;
    }> = [];

    students.forEach(s => {
      let h = 0, i = 0, sk = 0, a = 0, recorded = 0;
      meetings.forEach(m => {
        const st = effectiveAttendance[m.meetingNumber]?.[s.id];
        if (st && st !== 'BELUM') {
          recorded++;
          if (st === 'H') h++;
          else if (st === 'I') i++;
          else if (st === 'S') sk++;
          else if (st === 'A') a++;
        }
      });

      const rate = recorded > 0 ? Math.round((h / recorded) * 100) : 100;
      const isAtRisk = recorded >= 2 && (rate < 75 || a >= 2);

      if (isAtRisk) {
        let riskReason = '';
        if (a >= 2 && rate < 75) riskReason = `${a}x Alfa & Presensi ${rate}% (Di bawah batas 75%)`;
        else if (a >= 2) riskReason = `${a}x Alfa (Perlu Peringatan)`;
        else riskReason = `Presensi ${rate}% (Di bawah syarat minimal ujian 75%)`;

        atRiskList.push({
          student: s,
          hadirCount: h,
          izinCount: i,
          sakitCount: sk,
          alfaCount: a,
          attendanceRate: rate,
          recordedMeetings: recorded,
          riskReason,
        });
      }
    });

    // Calculate participation trajectory
    const activeMeetings = meetingChartData.filter(m => (m.hadir + m.izin + m.sakit + m.alfa) > 0);
    let trendLabel = 'Stabil';
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    let trendDiff = 0;

    if (activeMeetings.length >= 2) {
      const half = Math.floor(activeMeetings.length / 2);
      const firstHalfAvg = activeMeetings.slice(0, half).reduce((sum, m) => sum + m.rate, 0) / (half || 1);
      const secondHalfAvg = activeMeetings.slice(half).reduce((sum, m) => sum + m.rate, 0) / (activeMeetings.length - half || 1);
      trendDiff = Math.round(secondHalfAvg - firstHalfAvg);

      if (trendDiff >= 4) {
        trendLabel = `Meningkat (+${trendDiff}%)`;
        trendDirection = 'up';
      } else if (trendDiff <= -4) {
        trendLabel = `Menurun (${trendDiff}%)`;
        trendDirection = 'down';
      } else {
        trendLabel = `Stabil (${trendDiff >= 0 ? '+' : ''}${trendDiff}%)`;
        trendDirection = 'stable';
      }
    }

    const sortedByRate = [...activeMeetings].sort((a, b) => a.rate - b.rate);
    const lowestMeeting = sortedByRate[0] || null;
    const criticalMeetings = activeMeetings.filter(m => m.rate < 75);

    return {
      atRiskStudents: atRiskList,
      trendLabel,
      trendDirection,
      trendDiff,
      lowestMeeting,
      criticalMeetings,
      activeMeetingsCount: activeMeetings.length,
    };
  }, [students, meetings, effectiveAttendance, meetingChartData]);

  // Custom Chart Tooltip displaying deep meeting breakdown and absent student list
  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const phaseLabel =
        data.meetingNumber === 8 ? 'Ujian Tengah Semester (UTS)' :
        data.meetingNumber === 16 ? 'Ujian Akhir Semester (UAS)' :
        data.meetingNumber < 8 ? 'Fase Pra-UTS' : 'Fase Pasca-UTS';

      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-2xl border border-slate-700/80 text-xs max-w-xs z-50">
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-2 mb-2">
            <div>
              <span className="font-black text-emerald-400 text-sm">Pertemuan #{data.meetingNumber}</span>
              <span className="text-[10px] text-slate-400 block">{data.dateStr}</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-md border border-slate-700">
              {phaseLabel}
            </span>
          </div>

          <p className="font-semibold text-slate-200 line-clamp-2 mb-2.5 text-[11px] leading-tight">
            {data.fullTitle}
          </p>

          {/* Progress bar */}
          <div className="mb-2.5">
            <div className="flex justify-between items-center text-[10px] mb-1 font-semibold">
              <span className="text-slate-400">Tingkat Kehadiran:</span>
              <span className={data.rate >= 80 ? 'text-emerald-400 font-bold' : data.rate >= 75 ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>
                {data.rate}% ({data.hadir}/{data.totalEnrolled} Mhs)
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  data.rate >= 80 ? 'bg-emerald-500' : data.rate >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, data.rate)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] bg-slate-800/60 p-2 rounded-lg border border-slate-700/50 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-emerald-300 font-medium">● Hadir (H):</span>
              <strong className="text-white">{data.hadir}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sky-300 font-medium">● Izin (I):</span>
              <strong className="text-white">{data.izin}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-medium">● Sakit (S):</span>
              <strong className="text-white">{data.sakit}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-rose-300 font-medium">● Alfa (A):</span>
              <strong className="text-white">{data.alfa}</strong>
            </div>
          </div>

          {/* Absent students preview */}
          {data.absentStudents && data.absentStudents.length > 0 ? (
            <div className="mt-2 pt-2 border-t border-slate-700/80 text-[10px]">
              <span className="text-slate-400 font-semibold block mb-1">
                Mahasiswa Berhalangan ({data.absentStudents.length}):
              </span>
              <div className="space-y-0.5 max-h-24 overflow-y-auto">
                {data.absentStudents.slice(0, 3).map((st: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-slate-300">
                    <span className="truncate max-w-[170px]">{st.name}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      st.status === 'A' ? 'bg-rose-900/60 text-rose-300 border border-rose-700/40' :
                      st.status === 'I' ? 'bg-sky-900/60 text-sky-300 border border-sky-700/40' :
                      'bg-amber-900/60 text-amber-300 border border-amber-700/40'
                    }`}>
                      {st.status === 'A' ? 'Alfa' : st.status === 'I' ? 'Izin' : 'Sakit'}
                    </span>
                  </div>
                ))}
                {data.absentStudents.length > 3 && (
                  <span className="text-[9px] text-slate-400 italic block pt-0.5 text-right">
                    +{data.absentStudents.length - 3} mahasiswa lainnya
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-emerald-400/90 flex items-center gap-1 mt-1 font-medium">
              <CheckCircle size={11} />
              <span>Semua mahasiswa hadir penuh</span>
            </div>
          )}

          <p className="text-[9px] text-emerald-400/80 font-medium italic mt-2 text-center border-t border-slate-800 pt-1.5">
            Klik batang untuk membuka presensi Pertemuan #{data.meetingNumber}
          </p>
        </div>
      );
    }
    return null;
  };


  const handleStartEditMeeting = () => {
    if (!activeMeeting) return;
    setEditedDateStr(activeMeeting.dateStr);
    setEditedTitle(activeMeeting.title);
    setEditedPresenters(activeMeeting.presenters?.join(', ') || '');
    setIsEditingMeeting(true);
  };

  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMeeting) return;
    setIsSavingMeeting(true);
    try {
      await updateMeetingApi(activeMeeting.meetingNumber, {
        dateStr: editedDateStr,
        title: editedTitle,
        presenters: editedPresenters.split(',').map(s => s.trim()).filter(Boolean),
      });
      setIsEditingMeeting(false);
      await onRefreshData().catch(() => {});
    } finally {
      setIsSavingMeeting(false);
    }
  };

  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);

  // Function for student self-attendance or dosen quick mark
  // Updates local state IMMEDIATELY on click to guarantee zero delay and prevent UI mismatches,
  // then verifies database completion asynchronously.
  const handleStudentSelfAbsen = async (studentId: string) => {
    setSavingStudentId(studentId);
    
    // 1. Immediate local update: immediately flips button to 'Sudah Absen' and disabled state
    setLocalAttendance(prev => ({
      ...prev,
      [selectedMeetingNumber]: {
        ...(prev[selectedMeetingNumber] || {}),
        [studentId]: 'H',
      },
    }));

    try {
      // 2. Asynchronous database call to verify completion
      const ok = await updateAttendanceApi(selectedMeetingNumber, studentId, 'H');
      if (ok) {
        triggerActionFeedback('Presensi kehadiran Anda berhasil dicatat dan diverifikasi di database!');
        // 3. Reconcile with latest server database state
        await onRefreshData().catch(() => {});
      } else {
        // Rollback local optimistic state if server failed
        setLocalAttendance(prev => {
          const updatedMeeting = { ...(prev[selectedMeetingNumber] || {}) };
          delete updatedMeeting[studentId];
          return { ...prev, [selectedMeetingNumber]: updatedMeeting };
        });
        triggerActionFeedback('Gagal memverifikasi presensi ke database. Silakan coba lagi.');
      }
    } catch (err) {
      console.error(err);
      // Rollback local optimistic state on connection failure
      setLocalAttendance(prev => {
        const updatedMeeting = { ...(prev[selectedMeetingNumber] || {}) };
        delete updatedMeeting[studentId];
        return { ...prev, [selectedMeetingNumber]: updatedMeeting };
      });
      triggerActionFeedback('Terjadi kesalahan koneksi saat menyimpan presensi.');
    } finally {
      setSavingStudentId(null);
    }
  };

  const handleSetStatus = async (studentId: string, status: AttendanceStatus) => {
    if (!isDosen) return;
    const previousStatus = (effectiveAttendance[selectedMeetingNumber] || {})[studentId] || 'BELUM';

    // 1. Immediate local update on click
    setLocalAttendance(prev => ({
      ...prev,
      [selectedMeetingNumber]: {
        ...(prev[selectedMeetingNumber] || {}),
        [studentId]: status,
      },
    }));

    setIsUpdating(true);
    try {
      // 2. Async database call verifying completion
      const ok = await updateAttendanceApi(selectedMeetingNumber, studentId, status);
      if (ok) {
        await onRefreshData().catch(() => {});
      } else {
        // Revert on failure
        setLocalAttendance(prev => ({
          ...prev,
          [selectedMeetingNumber]: {
            ...(prev[selectedMeetingNumber] || {}),
            [studentId]: previousStatus,
          },
        }));
        triggerActionFeedback('Gagal memperbarui status presensi di database.');
      }
    } catch (err) {
      console.error(err);
      setLocalAttendance(prev => ({
        ...prev,
        [selectedMeetingNumber]: {
          ...(prev[selectedMeetingNumber] || {}),
          [studentId]: previousStatus,
        },
      }));
      triggerActionFeedback('Kesalahan koneksi saat memperbarui status presensi.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkSetHadir = async () => {
    if (!isDosen) return;

    // 1. Immediate local update for all students
    const bulkUpdates: Record<string, AttendanceStatus> = {};
    students.forEach(s => {
      bulkUpdates[s.id] = 'H';
    });

    setLocalAttendance(prev => ({
      ...prev,
      [selectedMeetingNumber]: {
        ...(prev[selectedMeetingNumber] || {}),
        ...bulkUpdates,
      },
    }));

    setIsUpdating(true);
    try {
      // 2. Async database call
      const ok = await updateAttendanceApi(selectedMeetingNumber, undefined, undefined, 'H');
      if (ok) {
        triggerActionFeedback('Seluruh mahasiswa berhasil ditandai Hadir (H) di database!');
        await onRefreshData().catch(() => {});
      } else {
        triggerActionFeedback('Gagal memperbarui presensi massal di database.');
        await onRefreshData().catch(() => {});
      }
    } catch (err) {
      console.error(err);
      triggerActionFeedback('Kesalahan koneksi saat memperbarui presensi massal.');
      await onRefreshData().catch(() => {});
    } finally {
      setIsUpdating(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rpsPart.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.nim.includes(searchTerm)
  );

  // Statistics for selected meeting using effectiveAttendance
  const meetingAttendance = effectiveAttendance[selectedMeetingNumber] || {};
  let hadirCount = 0;
  let izinCount = 0;
  let sakitCount = 0;
  let alfaCount = 0;

  students.forEach(s => {
    const status = meetingAttendance[s.id] || 'BELUM';
    if (status === 'H') hadirCount++;
    else if (status === 'I') izinCount++;
    else if (status === 'S') sakitCount++;
    else if (status === 'A') alfaCount++;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full mb-2">
              <Calendar size={13} />
              <span>Sistem Presensi Kelas Tatap Muka (16 Pertemuan)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif-title">
              Presensi Perkuliahan Tatap Muka {courseProfile?.courseTitle || 'Mata Kuliah'} (16 Pertemuan)
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Mencatat kehadiran resmi {students.length} mahasiswa dengan 4 status: <strong>Hadir (H)</strong>, <strong>Izin (I)</strong>, <strong>Sakit (S)</strong>, dan <strong>Alfa (A)</strong> pada perkuliahan tatap muka di {courseProfile?.roomName || 'ruang kelas'} {courseProfile?.campusName || 'STAI Jarinabi'} ({courseProfile?.semester || 'Semester'}). Diverifikasi langsung oleh Dosen Pengampu melalui Portal Dosen.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isDosen ? (
              <button
                onClick={onOpenDosenLogin}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-800 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors"
              >
                <ShieldCheck size={16} className="text-indigo-600" />
                <span>Buka Portal Dosen untuk Centang Absen</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                {onOpenAddStudent && (
                  <button
                    type="button"
                    id="btn-attendance-tambah-mhs"
                    onClick={onOpenAddStudent}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                    title="Tambah data mahasiswa baru ke daftar kelas"
                  >
                    <UserPlus size={15} />
                    <span>+ Tambah Mahasiswa</span>
                  </button>
                )}
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-900">
                  <ShieldCheck size={16} className="text-emerald-700" />
                  <span>Mode Dosen: Klik status untuk absensi</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PUSAT UNDUH & REKAPITULASI SEMUA PERTEMUAN (P1 - P16) */}
        <div className="mt-5 p-4 bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl shadow-xs border border-emerald-700/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Download size={16} className="text-emerald-300" />
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Pusat Unduh Rekap Presensi 16 Pertemuan
              </h3>
              <span className="text-[10px] bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold">
                PDF • Word • Excel
              </span>
            </div>
            <p className="text-[11px] text-emerald-100/80 mt-1 max-w-xl">
              Unduh rekapitulasi kehadiran lengkap pertemuan 1 sampai 16 untuk semester ini atau semester lainnya. Lengkap dengan persentase kehadiran, bobot nilai 15%, dan tanda tangan resmi dosen.
            </p>
          </div>

          {/* Action Download Buttons: Memanjang ke samping agar semua terlihat */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 overflow-x-auto pb-1 scrollbar-thin shrink-0">
            <button
              type="button"
              onClick={() => setIsRecapModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
              title="Buka tampilan tabel matriks presensi 16 pertemuan lengkap"
            >
              <Table size={14} />
              <span>Lihat Matriks Rekap</span>
            </button>

            <button
              type="button"
              onClick={handlePrint16Pdf}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              title="Buka dialog cetak printer atau simpan sebagai PDF dari browser"
            >
              <Printer size={14} />
              <span>Cetak PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDirectDownload16Pdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              title="Unduh file .pdf rekap 16 pertemuan langsung ke perangkat"
            >
              {isDownloadingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{isDownloadingPdf ? 'Membuat PDF...' : 'Unduh PDF'}</span>
            </button>

            <button
              type="button"
              onClick={() => exportAttendanceToWord(exportOpts)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              title="Unduh dokumen Microsoft Word (.doc) lengkap tanda tangan dosen"
            >
              <FileText size={14} />
              <span>Unduh Word</span>
            </button>

            <button
              type="button"
              onClick={() => exportAttendanceToExcel(exportOpts)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              title="Unduh spreadsheet Microsoft Excel (.xls) dengan format cell & formula"
            >
              <FileSpreadsheet size={14} />
              <span>Unduh Excel</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setExportModalMeetingNumber(0);
                setIsExportModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-xl text-xs font-bold transition-colors border border-white/20 shadow-2xs cursor-pointer"
              title="Buka panel lengkap pilihan dokumen, beralih mode cetak, atau unduh berkas"
            >
              <SlidersHorizontal size={14} />
              <span>Pilihan Lengkap</span>
            </button>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div className="mt-3 px-4 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-2 shadow-2xs animate-fadeIn">
            <CheckCircle size={15} className="text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* VISUALISASI DATA RECHARTS: TREN KEHADIRAN 16 PERTEMUAN & ANALISIS POLA PARTISIPASI */}
        <div className="mt-5 p-4 sm:p-5 bg-gradient-to-b from-slate-50 via-white to-slate-50/70 border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
                <BarChart3 size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                    Visualisasi Tren Kehadiran & Pola Partisipasi (Recharts)
                  </h3>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300/60 flex items-center gap-1">
                    <TrendingUp size={11} />
                    <span>Analisis Dosen</span>
                  </span>
                  {studentParticipationPatterns.criticalMeetings.length > 0 && (
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-300/60 flex items-center gap-1">
                      <AlertTriangle size={11} />
                      <span>{studentParticipationPatterns.criticalMeetings.length} Temu Kritis (&lt;75%)</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Visualisasi pola keikutsertaan mahasiswa per pertemuan tatap muka <strong>{courseProfile?.courseTitle || 'Mata Kuliah'}</strong>. Membantu dosen mendeteksi penurunan presensi dan mahasiswa berisiko secara dini.
                </p>
              </div>
            </div>

            {/* Chart Mode, Phase Filters, & Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Mode Visualisasi */}
              <div className="bg-slate-200/80 p-0.5 rounded-xl flex items-center gap-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setChartMode('stacked')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    chartMode === 'stacked'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Grafik batang bertumpuk komposisi seluruh mahasiswa (Hadir, Izin, Sakit, Alfa)"
                >
                  Bertumpuk
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('grouped')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    chartMode === 'grouped'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Grafik batang berdampingan membandingkan jumlah Hadir, Izin, Sakit, Alfa"
                >
                  Komparasi
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('trend')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    chartMode === 'trend'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Kurva tren area persentase kehadiran dengan garis batas minimal 75%"
                >
                  Tren (%)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('distribution')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                    chartMode === 'distribution'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Donut chart agregat proporsi kehadiran seluruh semester"
                >
                  <PieIcon size={12} />
                  <span>Donut</span>
                </button>
              </div>

              {/* Threshold Toggle (Khusus Mode Bar / Trend) */}
              {chartMode !== 'distribution' && (
                <button
                  type="button"
                  onClick={() => setShowThreshold(prev => !prev)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    showThreshold
                      ? 'bg-rose-50 text-rose-800 border-rose-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Aktifkan atau sembunyikan garis acuan batas minimal kehadiran 75%"
                >
                  <Activity size={12} className={showThreshold ? 'text-rose-600' : 'text-slate-400'} />
                  <span>Garis 75%</span>
                </button>
              )}

              {/* Ekspor Laporan PDF Button */}
              <button
                type="button"
                id="btn-chart-export-pdf"
                onClick={handleDirectDownload16Pdf}
                disabled={isDownloadingPdf}
                className="flex items-center gap-1.5 px-3 py-1 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                title="Unduh laporan kehadiran 16 pertemuan lengkap dalam format PDF"
              >
                {isDownloadingPdf ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />}
                <span>{isDownloadingPdf ? 'Membuat PDF...' : 'Ekspor PDF'}</span>
              </button>

              {/* Toggle Perkecil / Perluas Tampilan Grafik */}
              <button
                type="button"
                onClick={() => setIsChartCollapsed(prev => !prev)}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                title={isChartCollapsed ? 'Perluas tampilan visualisasi tren' : 'Perkecil tampilan visualisasi tren'}
              >
                {isChartCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                <span className="hidden sm:inline">{isChartCollapsed ? 'Buka Tren' : 'Perkecil'}</span>
              </button>
            </div>
          </div>

          {!isChartCollapsed && (
            <>
              {/* Filter Fase Perkuliahan (Pra-UTS, Pasca-UTS, Ujian) */}
              {chartMode !== 'distribution' && (
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs pt-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Filter size={12} />
                      <span>Filter Fase:</span>
                    </span>
                    <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setChartPhase('all')}
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                          chartPhase === 'all'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Semua 16 Temu
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartPhase('pra_uts')}
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                          chartPhase === 'pra_uts'
                            ? 'bg-white text-emerald-800 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Pra-UTS (P1–P7)
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartPhase('pasca_uts')}
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                          chartPhase === 'pasca_uts'
                            ? 'bg-white text-blue-800 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Pasca-UTS (P9–P15)
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartPhase('exam')}
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                          chartPhase === 'exam'
                            ? 'bg-white text-purple-800 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Ujian (P8 &amp; P16)
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Menampilkan {filteredChartData.length} pertemuan aktif</span>
                  </div>
                </div>
              )}

              {/* Lecturer Pattern Insights KPIs Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* KPI 1: Rata-Rata Kehadiran */}
                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Rata-Rata Kehadiran Kelas
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl sm:text-2xl font-black text-emerald-950 font-serif-title">
                      {chartSummaryStats.avgAttendancePercent}%
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700">
                      {chartSummaryStats.avgAttendancePercent >= 80 ? '● Sangat Baik' : '● Perlu Perhatian'}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-800/80 mt-1 block">
                    Dari {chartSummaryStats.meetingsWithAttendance} pertemuan yang telah dicatat
                  </span>
                </div>

                {/* KPI 2: Pola Tren Partisipasi */}
                <div className={`border rounded-xl p-3 ${
                  studentParticipationPatterns.trendDirection === 'up'
                    ? 'bg-teal-50/80 border-teal-200/80 text-teal-900'
                    : studentParticipationPatterns.trendDirection === 'down'
                    ? 'bg-rose-50/80 border-rose-200/80 text-rose-900'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider block opacity-85">
                      Pola Tren Keikutsertaan
                    </span>
                    {studentParticipationPatterns.trendDirection === 'up' ? (
                      <TrendingUp size={14} className="text-teal-700" />
                    ) : studentParticipationPatterns.trendDirection === 'down' ? (
                      <TrendingDown size={14} className="text-rose-700" />
                    ) : (
                      <Activity size={14} className="text-slate-600" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-lg sm:text-xl font-black font-serif-title">
                      {studentParticipationPatterns.trendLabel}
                    </span>
                  </div>
                  <span className="text-[10px] opacity-80 mt-1 block truncate">
                    {studentParticipationPatterns.trendDirection === 'up'
                      ? 'Partisipasi mahasiswa meningkat positif'
                      : studentParticipationPatterns.trendDirection === 'down'
                      ? 'Waspadai penurunan di sesi terkini'
                      : 'Kehadiran relatif konsisten stabil'}
                  </span>
                </div>

                {/* KPI 3: Titik Pertemuan Paling Kritis / Anomali */}
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Titik Presensi Terendah
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl sm:text-2xl font-black text-amber-950 font-serif-title">
                      {studentParticipationPatterns.lowestMeeting
                        ? `Temu #${studentParticipationPatterns.lowestMeeting.meetingNumber}`
                        : 'Belum Ada'}
                    </span>
                    {studentParticipationPatterns.lowestMeeting && (
                      <span className="text-[10px] font-bold text-amber-800">
                        ({studentParticipationPatterns.lowestMeeting.rate}% Hadir)
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-amber-800/80 mt-1 block truncate">
                    {studentParticipationPatterns.lowestMeeting
                      ? `${studentParticipationPatterns.lowestMeeting.alfa} Alfa • ${studentParticipationPatterns.lowestMeeting.izin + studentParticipationPatterns.lowestMeeting.sakit} Izin/Sakit`
                      : 'Data presensi belum terisi'}
                  </span>
                </div>

                {/* KPI 4: Deteksi Mahasiswa Berisiko Rendah Absensi */}
                <div className={`border rounded-xl p-3 ${
                  studentParticipationPatterns.atRiskStudents.length > 0
                    ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                    : 'bg-blue-50/80 border-blue-200/80 text-blue-950'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider block">
                      Mahasiswa Perlu Perhatian
                    </span>
                    <AlertCircle size={14} className={studentParticipationPatterns.atRiskStudents.length > 0 ? 'text-rose-600' : 'text-blue-600'} />
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl sm:text-2xl font-black font-serif-title">
                      {studentParticipationPatterns.atRiskStudents.length}
                    </span>
                    <span className="text-[10px] font-semibold">
                      {studentParticipationPatterns.atRiskStudents.length > 0 ? 'Mahasiswa Berisiko' : 'Mahasiswa Aman'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAtRiskDrawerOpen(true)}
                    className="text-[10px] font-bold text-rose-700 hover:text-rose-900 underline mt-1 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{studentParticipationPatterns.atRiskStudents.length > 0 ? 'Tinjau Rincian Mahasiswa' : 'Lihat Rekap Partisipasi'}</span>
                    <ArrowRight size={10} />
                  </button>
                </div>
              </div>

              {/* Recharts Main Canvas Container */}
              <div className="w-full bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 pt-5">
                {chartMode === 'distribution' ? (
                  /* Donut Chart: Semester Overall Status Breakdown */
                  <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-4">
                    <div className="h-[260px] w-full md:w-1/2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={semesterDistributionData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={95}
                            paddingAngle={3}
                            label={({ name, percent }) => `${name} (${percent}%)`}
                          >
                            {semesterDistributionData.map((entry, index) => (
                              <Cell key={`donut-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value: any, name: any) => [`${value} Mahasiswa-Pertemuan`, name]}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '11px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="w-full md:w-1/2 space-y-3">
                      <div className="border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                          Distribusi Partisipasi Kumulatif Seluruh Semester
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Total akumulasi status kehadiran seluruh {students.length} mahasiswa pada 16 pertemuan tatap muka.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {semesterDistributionData.map((item) => (
                          <div
                            key={item.name}
                            className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/60 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <div>
                                <span className="text-xs font-bold text-slate-800 block">{item.name}</span>
                                <span className="text-[10px] text-slate-500">{item.percent}% dari total</span>
                              </div>
                            </div>
                            <span className="text-base font-black text-slate-900 font-serif-title">{item.value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-900 leading-relaxed flex items-start gap-2">
                        <Sparkles size={15} className="text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <strong>Wawasan Evaluasi Dosen:</strong> Proporsi kehadiran sebesar{' '}
                          <strong>{semesterDistributionData[0]?.percent || 0}%</strong> menunjukkan keterlibatan yang kuat. Pastikan mahasiswa dengan status Alfa terverifikasi sebelum penutupan nilai akhir.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Bar / Composed Trend Charts */
                  <div className="h-[280px] sm:h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartMode === 'trend' ? (
                        <ComposedChart
                          data={filteredChartData}
                          margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
                          onClick={(state: any) => {
                            if (state && state.activePayload && state.activePayload[0]) {
                              const clickedMeeting = state.activePayload[0].payload.meetingNumber;
                              setSelectedMeetingNumber(clickedMeeting);
                              triggerActionFeedback(`Membuka presensi Pertemuan #${clickedMeeting}`);
                            }
                          }}
                        >
                          <defs>
                            <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
                            axisLine={{ stroke: '#cbd5e1' }}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={{ stroke: '#cbd5e1' }}
                            tickLine={false}
                            domain={[0, 100]}
                            unit="%"
                          />
                          <RechartsTooltip content={<CustomChartTooltip />} cursor={{ stroke: '#059669', strokeWidth: 1, strokeDasharray: '4 4' }} />
                          <RechartsLegend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          {showThreshold && (
                            <ReferenceLine
                              y={75}
                              stroke="#e11d48"
                              strokeDasharray="4 4"
                              strokeWidth={1.5}
                              label={{ value: 'Batas Minimal 75%', fill: '#e11d48', fontSize: 10, position: 'insideTopRight' }}
                            />
                          )}
                          <Area
                            type="monotone"
                            dataKey="rate"
                            name="Persentase Kehadiran (%)"
                            fill="url(#rateGradient)"
                            stroke="#059669"
                            strokeWidth={2.5}
                            cursor="pointer"
                          />
                          <Line
                            type="monotone"
                            dataKey="rate"
                            name="Titik Temu"
                            stroke="#047857"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                            activeDot={{ r: 7 }}
                            cursor="pointer"
                          />
                        </ComposedChart>
                      ) : (
                        <BarChart
                          data={filteredChartData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                          onClick={(state: any) => {
                            if (state && state.activePayload && state.activePayload[0]) {
                              const clickedMeeting = state.activePayload[0].payload.meetingNumber;
                              setSelectedMeetingNumber(clickedMeeting);
                              triggerActionFeedback(`Membuka presensi Pertemuan #${clickedMeeting}`);
                            }
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
                            axisLine={{ stroke: '#cbd5e1' }}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={{ stroke: '#cbd5e1' }}
                            tickLine={false}
                            domain={[0, 'auto']}
                          />
                          <RechartsTooltip content={<CustomChartTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.08)' }} />
                          <RechartsLegend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                          {showThreshold && (
                            <ReferenceLine
                              y={Math.round(students.length * 0.75)}
                              stroke="#e11d48"
                              strokeDasharray="3 3"
                              strokeWidth={1.5}
                              label={{ value: `Batas 75% (${Math.round(students.length * 0.75)} Mhs)`, fill: '#e11d48', fontSize: 10, position: 'insideTopRight' }}
                            />
                          )}

                          {chartMode === 'stacked' ? (
                            <>
                              <Bar
                                dataKey="hadir"
                                stackId="cohort"
                                name="Hadir (H)"
                                fill="#059669"
                                radius={[0, 0, 0, 0]}
                                cursor="pointer"
                              />
                              <Bar
                                dataKey="izin"
                                stackId="cohort"
                                name="Izin (I)"
                                fill="#0284c7"
                                radius={[0, 0, 0, 0]}
                                cursor="pointer"
                              />
                              <Bar
                                dataKey="sakit"
                                stackId="cohort"
                                name="Sakit (S)"
                                fill="#d97706"
                                radius={[0, 0, 0, 0]}
                                cursor="pointer"
                              />
                              <Bar
                                dataKey="alfa"
                                stackId="cohort"
                                name="Alfa (A)"
                                fill="#e11d48"
                                radius={[3, 3, 0, 0]}
                                cursor="pointer"
                              />
                            </>
                          ) : (
                            <>
                              <Bar
                                dataKey="hadir"
                                name="Hadir (H)"
                                fill="#059669"
                                radius={[3, 3, 0, 0]}
                                cursor="pointer"
                              />
                              <Bar
                                dataKey="izin"
                                name="Izin (I)"
                                fill="#0284c7"
                                radius={[3, 3, 0, 0]}
                                cursor="pointer"
                              />
                              <Bar
                                dataKey="sakit"
                                name="Sakit (S)"
                                fill="#d97706"
                                radius={[3, 3, 0, 0]}
                                cursor="pointer"
                              />
                              <Bar
                                dataKey="alfa"
                                name="Alfa (A)"
                                fill="#e11d48"
                                radius={[3, 3, 0, 0]}
                                cursor="pointer"
                              />
                            </>
                          )}
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Footer Navigation & Shortcuts */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Klik pada salah satu batang/titik pertemuan untuk membuka daftar presensi pertemuan tersebut di bawah.</span>
                  </div>
                  <div className="flex items-center gap-3 font-semibold text-slate-700">
                    <button
                      type="button"
                      onClick={() => setSelectedMeetingNumber(chartSummaryStats.highestAttendanceMeeting)}
                      className="text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Lompat ke Temu Tertinggi (#{chartSummaryStats.highestAttendanceMeeting})</span>
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={handlePrint16Pdf}
                      className="text-rose-700 hover:text-rose-900 underline flex items-center gap-1 cursor-pointer"
                    >
                      <Printer size={12} />
                      <span>Cetak Laporan PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* MODAL / DRAWER ANALISIS MAHASISWA PERLU PERHATIAN (AT-RISK INTERVENTION) */}
        {isAtRiskDrawerOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-900 via-slate-900 to-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600/30 text-rose-300 border border-rose-500/40 flex items-center justify-center shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Deteksi Mahasiswa Perlu Perhatian (At-Risk)
                    </h3>
                    <p className="text-xs text-rose-200/80 mt-0.5">
                      Mahasiswa dengan presensi &lt; 75% atau memiliki akumulasi Alfa &ge; 2 kali
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAtRiskDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                  <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Rekomendasi Akademik Dosen:</strong> Mahasiswa yang tercatat pada daftar ini berisiko tidak memenuhi syarat minimal 75% kehadiran untuk mengikuti Ujian Akhir Semester (UAS). Dosen dapat memberikan tugas pengganti atau konfirmasi surat sakit/izin resmi.
                  </div>
                </div>

                {studentParticipationPatterns.atRiskStudents.length === 0 ? (
                  <div className="text-center py-8 bg-emerald-50/50 border border-emerald-200 rounded-2xl">
                    <CheckCircle size={36} className="text-emerald-600 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-emerald-950">Kondisi Kelas Sangat Baik!</h4>
                    <p className="text-xs text-emerald-800 mt-1 max-w-sm mx-auto">
                      Seluruh {students.length} mahasiswa saat ini memenuhi standar kehadiran minimal &ge; 75% tanpa akumulasi alfa yang mengkhawatirkan.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {studentParticipationPatterns.atRiskStudents.map((item) => (
                      <div
                        key={item.student.id}
                        className="p-3.5 bg-white hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                            {item.attendanceRate}%
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-xs sm:text-sm block">
                              {item.student.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              NIM: {item.student.nim} • Kelompok #{item.student.groupId || '-'}
                            </span>
                            <span className="text-[11px] font-semibold text-rose-700 block mt-0.5">
                              ⚠️ {item.riskReason}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold">
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">H: {item.hadirCount}</span>
                            <span className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded">I: {item.izinCount}</span>
                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded">S: {item.sakitCount}</span>
                            <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-black">A: {item.alfaCount}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Total {studentParticipationPatterns.atRiskStudents.length} dari {students.length} Mahasiswa
                </span>
                <button
                  type="button"
                  onClick={() => setIsAtRiskDrawerOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Tutup Tinjauan
                </button>
              </div>
            </div>
          </div>
        )}


        {/* 16 Pertemuan Horizontal Selector Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Pilih Pertemuan Tatap Muka (Setiap Sabtu):</span>
            <span className="text-emerald-800 font-semibold text-[11px]">
              {activeMeeting.dateStr}
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {meetings.map((m) => {
              const isSelected = m.meetingNumber === selectedMeetingNumber;
              const isToday = m.meetingNumber === 1;

              return (
                <button
                  type="button"
                  key={m.meetingNumber}
                  onClick={() => setSelectedMeetingNumber(m.meetingNumber)}
                  className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center min-w-[70px] ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-md scale-[1.02]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <span className="text-[10px] opacity-75">TEMU</span>
                  <span className="text-sm font-black">{m.meetingNumber}</span>
                  {isToday && (
                    <span className="text-[8px] bg-emerald-500 text-white px-1 rounded mt-0.5">
                      Hari Ini
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Meeting Summary & Ticking Roster */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        
        {/* Tombol & Status Absensi Mandiri Mahasiswa */}
        {currentStudent && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/70 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <UserCheck size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100/90 px-2 py-0.5 rounded-md">
                    Presensi Mahasiswa • Pertemuan #{selectedMeetingNumber}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">({activeMeeting.dateStr})</span>
                </div>
                <h4 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                  {currentStudent.name} <span className="font-normal text-xs text-slate-600">({currentStudent.nim})</span>
                </h4>
                <p className="text-[11px] text-slate-600">
                  {meetingAttendance[currentStudent.id] === 'H'
                    ? 'Status kehadiran Anda telah berhasil tercatat Hadir (H) di database.'
                    : 'Anda belum mengisi presensi untuk pertemuan ini. Silakan klik tombol di samping.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {meetingAttendance[currentStudent.id] === 'H' ? (
                <button
                  type="button"
                  disabled
                  id="btn-status-sudah-absen-banner"
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm cursor-default border border-emerald-700"
                >
                  <CheckCircle size={17} />
                  <span>Sudah Absen</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-klik-absen-banner"
                  onClick={() => handleStudentSelfAbsen(currentStudent.id)}
                  disabled={savingStudentId === currentStudent.id}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Klik untuk menyimpan absensi kehadiran Anda ke database"
                >
                  {savingStudentId === currentStudent.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck size={17} />
                      <span>Klik untuk Absen</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Meeting Header Detail */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          {isEditingMeeting ? (
            <form onSubmit={handleSaveMeeting} className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800">
                  Edit Tanggal & Informasi Pertemuan {activeMeeting.meetingNumber}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingMeeting(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tanggal Presensi (Contoh: Sabtu, 19 September 2026)
                  </label>
                  <input
                    type="text"
                    required
                    value={editedDateStr}
                    onChange={e => setEditedDateStr(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Pemateri (Pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={editedPresenters}
                    onChange={e => setEditedPresenters(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Topik Kajian Pertemuan
                </label>
                <input
                  type="text"
                  required
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingMeeting(false)}
                  disabled={isSavingMeeting}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingMeeting}
                  className="flex items-center gap-1 px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  <Save size={13} />
                  <span>{isSavingMeeting ? 'Menyimpan...' : 'Simpan Tanggal'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-1 rounded bg-slate-900 text-white">
                    PERTEMUAN {activeMeeting.meetingNumber}
                  </span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {activeMeeting.dateStr}
                  </span>
                  {isDosen && (
                    <button
                      onClick={handleStartEditMeeting}
                      className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors"
                      title="Edit Tanggal & Info Pertemuan Ini"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 mt-1.5">
                  {activeMeeting.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pemateri: {activeMeeting.presenters.join(', ')}
                </p>
              </div>

              {/* Counts & Dosen Bulk Action */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 text-xs">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md font-bold">
                    H: {hadirCount}
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-bold">
                    I: {izinCount}
                  </span>
                  <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md font-bold">
                    S: {sakitCount}
                  </span>
                  <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded-md font-bold">
                    A: {alfaCount}
                  </span>
                </div>

                {isDosen && (
                  <>
                    <button
                      type="button"
                      onClick={handleStartEditMeeting}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors shadow-xs"
                      title="Edit tanggal presensi untuk pertemuan ini"
                    >
                      <Edit2 size={13} />
                      <span>Edit Tanggal</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBulkSetHadir}
                      disabled={isUpdating}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                    >
                      <CheckCheck size={14} />
                      <span>Set Semua Hadir</span>
                    </button>
                  </>
                )}
              </div>

              {/* Sesi Meeting-Specific Print & Download Toolbar */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                  <FileText size={14} className="text-emerald-700" />
                  <span>Dokumen Presensi & Berita Acara Sesi #{activeMeeting.meetingNumber}:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrintSessionAttendance}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title={`Buka dialog cetak presensi pertemuan #${activeMeeting.meetingNumber}`}
                  >
                    <Printer size={13} className="text-rose-600" />
                    <span>Cetak Sesi #{activeMeeting.meetingNumber}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSessionPdf}
                    disabled={isDownloadingSessionPdf}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title={`Unduh file PDF resmi presensi pertemuan #${activeMeeting.meetingNumber}`}
                  >
                    {isDownloadingSessionPdf ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    <span>{isDownloadingSessionPdf ? 'Menyiapkan...' : 'Unduh PDF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadSessionWord}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    title={`Unduh file Word presensi pertemuan #${activeMeeting.meetingNumber}`}
                  >
                    <FileText size={13} />
                    <span>Unduh Word</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportModalMeetingNumber(activeMeeting.meetingNumber);
                      setIsExportModalOpen(true);
                    }}
                    className="flex items-center gap-1 px-2 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Buka opsi cetak & unduh lengkap"
                  >
                    <SlidersHorizontal size={13} />
                    <span>Opsi</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="flex items-center justify-between gap-2">
          <div className="relative max-w-sm w-full">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari mahasiswa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <span className="text-xs text-slate-500">
            Total: {filteredStudents.length} Mahasiswa
          </span>
        </div>

        {/* Attendance List */}
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {filteredStudents.map((std, idx) => {
            const status = meetingAttendance[std.id] || 'BELUM';
            const online = isStudentOnline(std.lastActive);
            const isMe = currentStudent?.id === std.id;

            return (
              <div
                key={std.id}
                className={`p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isMe ? 'bg-emerald-50/50' : 'hover:bg-slate-50/60'
                }`}
              >
                {/* Student Info */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <span className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    {online && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {std.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-bold">
                          Anda
                        </span>
                      )}
                      {online && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                          ONLINE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      NIM: {std.nim} • {std.rpsPart} • Terakhir: {formatActiveTime(std.lastActive)}
                    </div>
                  </div>
                </div>

                {/* Status Ticking Controls */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  {isDosen ? (
                    // Dosen can click any status button
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleSetStatus(std.id, 'H')}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                          status === 'H'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title="Hadir"
                      >
                        Hadir (H)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetStatus(std.id, 'I')}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                          status === 'I'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'
                        }`}
                        title="Izin"
                      >
                        Izin (I)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetStatus(std.id, 'S')}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                          status === 'S'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                        }`}
                        title="Sakit"
                      >
                        Sakit (S)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetStatus(std.id, 'A')}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                          status === 'A'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                        }`}
                        title="Alfa"
                      >
                        Alfa (A)
                      </button>
                    </div>
                  ) : (
                    // Student view (interactive self-attendance button)
                    <div className="flex items-center gap-2">
                      {status === 'I' && (
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg font-bold text-xs flex items-center gap-1 border border-blue-200">
                          <Clock size={13} /> Izin
                        </span>
                      )}
                      {status === 'S' && (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg font-bold text-xs flex items-center gap-1 border border-amber-200">
                          <AlertCircle size={13} /> Sakit
                        </span>
                      )}
                      {status === 'A' && (
                        <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg font-bold text-xs flex items-center gap-1 border border-rose-200">
                          <AlertCircle size={13} /> Alfa
                        </span>
                      )}

                      {status === 'H' ? (
                        <button
                          type="button"
                          disabled
                          className="px-3.5 py-1.5 bg-emerald-600 text-white border border-emerald-700 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-default"
                          title="Kehadiran telah tercatat Hadir (H) di database"
                        >
                          <CheckCircle size={14} className="text-white" />
                          <span>Sudah Absen</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStudentSelfAbsen(std.id)}
                          disabled={savingStudentId === std.id}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                          title="Klik untuk konfirmasi kehadiran dan simpan ke database"
                        >
                          {savingStudentId === std.id ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Menyimpan...</span>
                            </>
                          ) : (
                            <>
                              <UserCheck size={13} />
                              <span>{isMe ? 'Klik untuk Absen' : 'Klik untuk Absen'}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800">Keterangan:</span>
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span> H = Hadir
            </span>
            <span className="flex items-center gap-1 text-blue-700 font-semibold">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span> I = Izin
            </span>
            <span className="flex items-center gap-1 text-amber-700 font-semibold">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span> S = Sakit
            </span>
            <span className="flex items-center gap-1 text-rose-700 font-semibold">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span> A = Alfa
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Total 16 Pertemuan dihitung ke bobot 15% Rekap Nilai SIAKAD.
          </div>
        </div>

      </div>

      {/* Attendance Recap Modal for 16 Meetings (PDF, Word, Excel, Print) */}
      <AttendanceRecapModal
        isOpen={isRecapModalOpen}
        onClose={() => setIsRecapModalOpen(false)}
        students={students}
        meetings={meetings}
        attendance={attendance}
        grades={grades}
        courseProfile={courseProfile}
        archivedSemesters={archivedSemesters}
      />

      {/* Dedicated Attendance Export & Print Modal */}
      <AttendanceExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        students={students}
        meetings={meetings}
        attendance={attendance}
        grades={grades}
        courseProfile={courseProfile}
        initialMeetingNumber={exportModalMeetingNumber}
      />

    </div>
  );
};
