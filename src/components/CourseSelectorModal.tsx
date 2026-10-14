import React, { useState } from 'react';
import {
  X,
  Plus,
  BookOpen,
  Check,
  Trash2,
  School,
  User,
  Layers,
  ArrowRight,
  AlertCircle,
  FileText,
  Upload,
  CheckCircle2,
  Sparkles,
  Loader2,
  Users,
  DoorOpen,
  ShieldCheck,
  GraduationCap,
  RefreshCw,
  Copy,
  BookMarked,
  Pencil,
  ChevronDown,
  ChevronUp,
  Save,
  UserPlus,
} from 'lucide-react';
import { CourseSummary, DosenProfile } from '../types';
import {
  switchCourseApi,
  addCourseApi,
  editCourseApi,
  deleteCourseApi,
  parseRpsFileApi,
  syncCourseRosterApi,
  addSemesterApi,
} from '../services/api';

interface CourseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: CourseSummary[];
  activeCourseId?: string;
  courseProfile?: DosenProfile;
  isDosen: boolean;
  onCourseSwitched: (updatedDb: any) => void;
}

export const CourseSelectorModal: React.FC<CourseSelectorModalProps> = ({
  isOpen,
  onClose,
  courses = [],
  activeCourseId,
  courseProfile,
  isDosen,
  onCourseSwitched,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSemesterTab, setSelectedSemesterTab] = useState<number | 'all'>('all');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [sks, setSks] = useState(3);
  const [semesterNumber, setSemesterNumber] = useState<number>(3);
  const [semester, setSemester] = useState('Semester III (Ganjil 2026/2027)');
  const [roomName, setRoomName] = useState('Kamar MPI 3A (Ruang Ibnu Khaldun)');
  const [studentOption, setStudentOption] = useState<
    'use_existing_roster' | 'custom_roster' | 'copy_from_course' | 'empty' | 'generate_cohort'
  >('use_existing_roster');
  const [customStudentNamesText, setCustomStudentNamesText] = useState('');
  const [sourceCourseId, setSourceCourseId] = useState<string>(activeCourseId || courses?.[0]?.id || '');
  const [studyProgram, setStudyProgram] = useState(courseProfile?.studyProgram || 'Manajemen Pendidikan Islam (MPI)');
  const [campusName, setCampusName] = useState(courseProfile?.campusName || 'STAI Jarinabi');
  const [dosenName, setDosenName] = useState(courseProfile?.dosenName || 'Risfa Tri Ulfa');
  const [dosenTitle, setDosenTitle] = useState(courseProfile?.dosenTitle || 'S.Pd., M.Pd.');
  const [description, setDescription] = useState('');
  const [rpsText, setRpsText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileBase64, setUploadedFileBase64] = useState('');
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [defaultFormat, setDefaultFormat] = useState<'auto' | 'kelompok' | 'individu'>('auto');
  const [parsedSummary, setParsedSummary] = useState<{
    meetingsCount: number;
    kelompokCount: number;
    individuCount: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingCourseId, setIsSyncingCourseId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [courseToDelete, setCourseToDelete] = useState<{ id: string; title: string } | null>(null);

  // State for Edit Course (Kelola Mata Kuliah)
  const [editingCourse, setEditingCourse] = useState<CourseSummary | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editSks, setEditSks] = useState(3);
  const [editSemesterNumber, setEditSemesterNumber] = useState(1);
  const [editSemester, setEditSemester] = useState('');
  const [editRoomName, setEditRoomName] = useState('');
  const [editCampusName, setEditCampusName] = useState('STAI Jarinabi');
  const [editDosenName, setEditDosenName] = useState('Risfa Tri Ulfa');
  const [editDosenTitle, setEditDosenTitle] = useState('S.Pd., M.Pd.');
  const [editStudyProgram, setEditStudyProgram] = useState('Manajemen Pendidikan Islam (MPI)');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // State for Expanded RPS Preview
  const [expandedRpsCourseId, setExpandedRpsCourseId] = useState<string | null>(null);

  // Helper for RPS details preview
  const getRpsDetailsForCourse = (courseId: string, courseTitleStr: string) => {
    const t = (courseTitleStr || '').toLowerCase();
    if (courseId === 'mk-filsafat-ilmu' || t.includes('filsafat')) {
      return {
        type: 'filsafat',
        title: 'Filsafat Ilmu (MPI 1)',
        studentCount: 13,
        studentsRoster: 'Husna, Ikha, Indah, Kirana, Khoir, Nurazizah, Haza, Tomi, Estiyani, Munailatul, Anggun, Ridho, Nia',
        groups: [
          { no: 1, members: 'Husna, Ikha, Indah', title: 'Hakikat Pengetahuan dan Ilmu: Perbedaan Pengetahuan Biasa, Ilmu, dan Filsafat' },
          { no: 2, members: 'Kirana & Khoir', title: 'Pilar Ontologi Ilmu: Hakikat Ada (Being), Realitas Objek Kajian, dan Aliran-aliran Ontologi' },
          { no: 3, members: 'Nurazizah, Haza, Tomi', title: 'Pilar Epistemologi Ilmu: Sumber Pengetahuan, Metode Ilmiah, dan Sarana Berpikir Ilmiah' },
          { no: 4, members: 'Estiyani & Munailatul', title: 'Pilar Aksiologi Ilmu: Nilai, Etika Keilmuan, Tanggung Jawab Moral, dan Kemanfaatan Sains' },
          { no: 5, members: 'Anggun, Ridho, Nia', title: 'Sejarah Perkembangan Filsafat dan Ilmu (Era Yunani Klasik & Abad Pertengahan)' },
          { no: 6, members: 'Husna, Ikha, Indah', title: 'Masa Kejayaan Keilmuan Islam dan Kontribusi Ilmuwan Muslim terhadap Sains Modern' },
          { no: 7, members: 'Kirana & Khoir', title: 'Perkembangan Filsafat Ilmu Era Modern (Positivisme, Rasionalisme, Empirisme) dan Kontemporer' },
          { no: 8, members: 'Nurazizah, Haza, Tomi', title: 'Metodologi Penelitian dan Logika Penalaran Ilmiah (Induktif, Deduktif, Abduktif)' },
          { no: 9, members: 'Estiyani & Munailatul', title: 'Integrasi Ilmu, Agama, dan Kearifan Lokal (Local Wisdom) dalam Pengelolaan Pendidikan Islam' },
          { no: 10, members: 'Anggun, Ridho, Nia', title: 'Etika Akademik, Bebas Plagiarisme, dan Akuntabilitas Digitalisasi Berbasis Nilai Amanah' },
        ],
      };
    }

    if (courseId === 'mk-analisis-kebijakan-mpi3' || t.includes('kebijakan') || t.includes('analisis')) {
      return {
        type: 'kebijakan',
        title: 'Analisis Kebijakan Pendidikan (MPI 3)',
        studentCount: 20,
        studentsRoster: 'Heru, Sofyan, Isma, Zaza, Puput, Zainul, Hanif, Anita, Irma, Tina, Ardila, Dedi, Nawawi, Era, Rina, Dea, Milda, Sholeh, Hafidz, Zaima',
        groups: [
          { no: 1, members: 'Heru & Sofyan', title: 'Pendekatan Metodologi dalam Analisis Kebijakan Pendidikan' },
          { no: 2, members: 'Isma, Zaza, Puput', title: 'Analisis Agenda Setting dan Isu Strategis Pendidikan' },
          { no: 3, members: 'Zainul & Hanif', title: 'Proses Formulasi dan Legitimasi Kebijakan Publik' },
          { no: 4, members: 'Tina & Ardila', title: 'Model Implementasi Kebijakan di Madrasah dan Pesantren' },
          { no: 5, members: 'Era & Rina', title: 'Evaluasi Kinerja dan Monitoring Kebijakan Pendidikan' },
          { no: 6, members: 'Anita & Irma', title: 'Dinamika Politik Hukum Kebijakan Pendidikan di Indonesia' },
          { no: 7, members: 'Dedi & Nawawi', title: 'Kebijakan Anggaran dan Efektivitas Dana BOS' },
          { no: 8, members: 'Dea & Milda', title: 'Kebijakan Kurikulum dan Tantangan Digitalisasi Pendidikan' },
          { no: 9, members: 'Sholeh & Hafidz', title: 'Kebijakan Pendidikan Islam Berbasis Kearifan Lokal' },
          { no: 10, members: 'Irma & Zaima', title: 'Etika Publik dan Akuntabilitas Nilai Amanah Kebijakan' },
        ],
      };
    }

    // Default: Konsep Dasar Manajemen Pendidikan Islam (MPI 3)
    return {
      type: 'konsep_dasar',
      title: 'Konsep Dasar Manajemen Pendidikan Islam (MPI 3)',
      studentCount: 20,
      studentsRoster: 'Heru, Sofyan, Isma, Zaza, Puput, Zainul, Hanif, Anita, Irma, Tina, Ardila, Dedi, Nawawi, Era, Rina, Dea, Milda, Sholeh, Hafidz, Zaima',
      groups: [
        { no: 1, members: 'Heru & Sofyan', title: 'Hakikat dan Ruang Lingkup Manajemen Pendidikan Islam' },
        { no: 2, members: 'Isma, Zaza, Puput', title: 'Landasan Syar’i, Yuridis, dan Filosofis MPI' },
        { no: 3, members: 'Zainul, Hanif, Anita, Irma', title: 'Perencanaan Strategis dalam Pendidikan Islam' },
        { no: 4, members: 'Tina, Ardila, Dedi, Nawawi', title: 'Pengorganisasian dan Struktur Lembaga Pendidikan Islam' },
        { no: 5, members: 'Era, Rina, Dea, Milda', title: 'Kepemimpinan Profetik dalam Penggerakan Organisasi' },
        { no: 6, members: 'Sholeh, Hafidz, Irma, Zaima', title: 'Sistem Pengawasan dan Supervisi Lembaga Pendidikan Islam' },
        { no: 7, members: 'Heru & Sofyan', title: 'Manajemen Kurikulum Madrasah dan Pesantren' },
        { no: 8, members: 'Isma, Zaza, Puput', title: 'Manajemen Pendidik dan Tenaga Kependidikan Islam' },
        { no: 9, members: 'Zainul, Hanif, Anita, Irma', title: 'Manajemen Kesiswaan dan Pembinaan Karakter Islami' },
        { no: 10, members: 'Tina, Ardila, Dedi, Nawawi', title: 'Tata Kelola Pembiayaan dan Akuntabilitas Dana BOSP' },
        { no: 11, members: 'Era, Rina, Dea, Milda', title: 'Manajemen Sarana dan Prasarana Pendidikan Islam' },
        { no: 12, members: 'Sholeh, Hafidz, Irma, Zaima', title: 'Humas dan Pemasaran Pendidikan Berbasis Kearifan Lokal' },
      ],
    };
  };

  // Open Edit Form for Course
  const handleOpenEditCourse = (c: CourseSummary, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCourse(c);
    setEditTitle(c.title);
    setEditCode(c.code || '');
    setEditSks(c.sks || 3);
    const sNum = c.semesterNumber || (c.semester?.includes('3') || c.semester?.includes('III') ? 3 : 1);
    setEditSemesterNumber(sNum);
    setEditSemester(c.semester || `Semester ${sNum}`);
    setEditRoomName(c.roomName || '');
    setEditCampusName(c.campusName || 'STAI Jarinabi');
    setEditDosenName(c.dosenName || 'Risfa Tri Ulfa');
    setEditDosenTitle(c.dosenTitle || 'S.Pd., M.Pd.');
    setEditStudyProgram(c.studyProgram || 'Manajemen Pendidikan Islam (MPI)');
    setEditDescription(c.description || '');
    setErrorMsg('');
    setSuccessMsg('');
  };

  // Save Edit Course
  const handleSaveEditCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editTitle.trim()) {
      setErrorMsg('Nama mata kuliah wajib diisi!');
      return;
    }

    setIsSavingEdit(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await editCourseApi(editingCourse.id, {
        title: editTitle.trim(),
        code: editCode.trim(),
        sks: editSks,
        semester: editSemester.trim(),
        semesterNumber: editSemesterNumber,
        roomName: editRoomName.trim(),
        campusName: editCampusName.trim(),
        dosenName: editDosenName.trim(),
        dosenTitle: editDosenTitle.trim(),
        studyProgram: editStudyProgram.trim(),
        description: editDescription.trim(),
      });

      if (res.success) {
        setSuccessMsg(res.message || `Data mata kuliah "${editTitle}" berhasil diperbarui!`);
        if (res.data) {
          onCourseSwitched(res.data);
        }
        setTimeout(() => {
          setEditingCourse(null);
        }, 800);
      } else {
        setErrorMsg(res.error || 'Gagal menyimpan perubahan mata kuliah');
      }
    } catch {
      setErrorMsg('Kesalahan koneksi saat menyimpan perubahan mata kuliah');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // State for Add Semester Modal
  const [showAddSemesterModal, setShowAddSemesterModal] = useState(false);
  const [newSemNum, setNewSemNum] = useState<number>(2);
  const [newSemName, setNewSemName] = useState('Semester II (Genap 2026/2027)');
  const [newSemCourseTitle, setNewSemCourseTitle] = useState('');
  const [newSemCourseCode, setNewSemCourseCode] = useState('MPI 201');
  const [newSemRoomName, setNewSemRoomName] = useState('Kamar MPI 2 (Ruang Al-Ghazali)');
  const [newSemSks, setNewSemSks] = useState(3);

  // Dynamic unique semester list from existing courses
  const uniqueSemesters = Array.from(
    new Set((courses || []).map((c) => c.semesterNumber || (c.semester?.includes('3') || c.semester?.includes('III') ? 3 : 1)))
  ).sort((a, b) => a - b);

  // Handle change in new semester number
  const handleNewSemNumChange = (num: number) => {
    setNewSemNum(num);
    const roman =
      num === 1 ? 'I' : num === 2 ? 'II' : num === 3 ? 'III' : num === 4 ? 'IV' : num === 5 ? 'V' : num === 6 ? 'VI' : num === 7 ? 'VII' : num === 8 ? 'VIII' : String(num);
    const ganjilGenap = num % 2 === 1 ? 'Ganjil' : 'Genap';
    setNewSemName(`Semester ${roman} (${ganjilGenap} 2026/2027)`);
    const roomHall =
      num === 1 ? 'Ruang Al-Farabi' : num === 2 ? 'Ruang Al-Ghazali' : num === 3 ? 'Ruang Ibnu Khaldun' : num === 4 ? 'Ruang Ibnu Rusyd' : 'Ruang Kelas';
    setNewSemRoomName(`Kamar MPI ${num} (${roomHall})`);
    setNewSemCourseCode(`MPI ${num}01`);
  };

  // Quick semester selection handler
  const handleSelectSemesterNumber = (num: number) => {
    setSemesterNumber(num);
    const roman =
      num === 1 ? 'I' : num === 2 ? 'II' : num === 3 ? 'III' : num === 4 ? 'IV' : num === 5 ? 'V' : num === 6 ? 'VI' : num === 7 ? 'VII' : num === 8 ? 'VIII' : String(num);
    const ganjilGenap = num % 2 === 1 ? 'Ganjil' : 'Genap';
    setSemester(`Semester ${roman} (${ganjilGenap} 2026/2027)`);
    if (!roomName || roomName.includes('Kamar MPI')) {
      const roomHall =
        num === 1 ? 'Ruang Al-Farabi' : num === 3 ? 'Ruang Ibnu Khaldun' : num === 2 ? 'Ruang Al-Ghazali' : num === 4 ? 'Ruang Ibnu Rusyd' : 'Ruang Kelas';
      setRoomName(`Kamar MPI ${num} (${roomHall})`);
    }
  };

  // Quick template filler for Dosen
  const handleApplyTemplate = (type: 'konsep_dasar' | 'kebijakan' | 'filsafat') => {
    if (type === 'konsep_dasar') {
      setTitle('Konsep Dasar Manajemen Pendidikan Islam');
      setCode('MPI 301');
      setSks(3);
      setSemesterNumber(3);
      setSemester('Semester III (Ganjil 2026/2027)');
      setRoomName('Kamar MPI 3A (Ruang Ibnu Khaldun)');
      setDescription('Mata kuliah Semester 3 (RPS OBE): Konsep dasar, fungsi POAC, tata kelola kelembagaan, kepemimpinan Islami, dan manajemen madrasah/pesantren.');
      setStudentOption('use_existing_roster');
    } else if (type === 'kebijakan') {
      setTitle('Analisis Kebijakan Pendidikan');
      setCode('MPI 302');
      setSks(3);
      setSemesterNumber(3);
      setSemester('Semester III (Ganjil 2026/2027)');
      setRoomName('Kamar MPI 3B (Ruang Al-Ghazali)');
      setDescription('Mata kuliah Semester 3 (RPS OBE): Formulasi kebijakan, analisis regulasi UU Sisdiknas & KMA, evaluasi CIPP, dan policy brief pendidikan Islam.');
      setStudentOption('use_existing_roster');
    } else if (type === 'filsafat') {
      setTitle('Filsafat Ilmu');
      setCode('STI 105');
      setSks(2);
      setSemesterNumber(1);
      setSemester('Semester I (Ganjil 2026/2027)');
      setRoomName('Kamar MPI 1 (Ruang Al-Farabi)');
      setDescription('Mata kuliah Semester 1: Landasan filosofis, ontologi, epistemologi, dan aksiologi keilmuan manajemen pendidikan Islam.');
      setStudentOption('use_existing_roster');
    }
  };

  // Handle Synchronize Groups & Students with 13 official students
  const handleSyncCourseRoster = async (courseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSyncingCourseId(courseId);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await syncCourseRosterApi(courseId);
      if (res.success) {
        setSuccessMsg(res.message || '10 Kelompok berhasil disinkronkan dengan 13 mahasiswa resmi!');
        if (res.data) {
          onCourseSwitched(res.data);
        }
      } else {
        setErrorMsg(res.error || 'Gagal mensinkronkan kelompok');
      }
    } catch {
      setErrorMsg('Kesalahan koneksi saat mensinkronkan kelompok');
    } finally {
      setIsSyncingCourseId(null);
    }
  };

  if (!isOpen) return null;

  // Handle RPS document upload (.docx, .doc, .pdf, .txt)
  const handleRpsDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsParsingDoc(true);
    setErrorMsg('');
    setParsedSummary(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const resultStr = (event.target?.result as string) || '';
          const base64Data = resultStr.includes('base64,')
            ? resultStr.split('base64,')[1]
            : btoa(resultStr);

          setUploadedFileBase64(base64Data);

          const parseRes = await parseRpsFileApi({
            base64: base64Data,
            filename: file.name,
            defaultPresentationFormat: defaultFormat,
          });

          if (parseRes.success && parseRes.text) {
            setRpsText(parseRes.text);

            const prof = parseRes.detectedProfile;
            if (prof) {
              if (prof.courseTitle) setTitle(prof.courseTitle);
              if (prof.courseCode) setCode(prof.courseCode);
              if (prof.sks) setSks(prof.sks);
              if (prof.semester) setSemester(prof.semester);
              if (prof.studyProgram) setStudyProgram(prof.studyProgram);
              if (prof.campusName) setCampusName(prof.campusName);
              if (prof.dosenName) setDosenName(prof.dosenName);
              if (prof.dosenTitle) setDosenTitle(prof.dosenTitle);
              if (prof.description) setDescription(prof.description);
            }

            const meetings = parseRes.detectedMeetings || [];
            const kelompokCount = meetings.filter((m: any) => m.presentationFormat === 'kelompok').length;
            const individuCount = meetings.filter((m: any) => m.presentationFormat === 'individu' && m.type === 'kuliah').length;

            setParsedSummary({
              meetingsCount: meetings.length,
              kelompokCount,
              individuCount,
            });
          } else {
            setErrorMsg(parseRes.error || 'Gagal mengekstrak teks dari berkas RPS.');
          }
        } catch (err: any) {
          setErrorMsg(`Gagal memproses file RPS: ${err.message || 'Format tidak valid'}`);
        } finally {
          setIsParsingDoc(false);
        }
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMsg(`Gagal membaca berkas: ${err.message || 'Format tidak valid'}`);
      setIsParsingDoc(false);
    }
  };

  // Handle switching course
  const handleSwitch = async (courseId: string) => {
    if (courseId === activeCourseId) {
      onClose();
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await switchCourseApi(courseId);
      if (res && res.data) {
        onCourseSwitched(res.data);
        onClose();
        return;
      }
    } catch (e) {
      console.warn('Switch course notice:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding new course
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Nama mata kuliah wajib diisi!');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await addCourseApi({
        title: title.trim(),
        code: code.trim(),
        sks,
        semester: semester.trim(),
        semesterNumber,
        roomName: roomName.trim(),
        studentOption: studentOption === 'custom_roster' ? undefined : studentOption,
        customStudentNames: studentOption === 'custom_roster' ? customStudentNamesText.trim() : undefined,
        sourceCourseId: studentOption === 'copy_from_course' ? sourceCourseId : undefined,
        studyProgram: studyProgram.trim(),
        campusName: campusName.trim(),
        dosenName: dosenName.trim(),
        dosenTitle: dosenTitle.trim(),
        description: description.trim(),
        rpsText: rpsText.trim(),
        rpsBase64: uploadedFileBase64 || undefined,
        rpsFilename: uploadedFileName || undefined,
        defaultPresentationFormat: defaultFormat,
      });

      if (res.success && res.data) {
        setSuccessMsg('Kamar mata kuliah & data mahasiswa berhasil dibuat secara terpisah!');
        setTimeout(() => {
          onCourseSwitched(res.data);
          setShowAddForm(false);
          onClose();
        }, 900);
      } else {
        setErrorMsg(res.error || 'Gagal menambahkan mata kuliah');
      }
    } catch {
      setErrorMsg('Kesalahan server saat membuat mata kuliah');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete course confirmation
  const handleOpenDeleteConfirm = (courseId: string, courseName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorMsg('');
    setCourseToDelete({ id: courseId, title: courseName });
  };

  const handleExecuteDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await deleteCourseApi(courseToDelete.id);
      if (res.success) {
        setSuccessMsg(`Mata kuliah "${courseToDelete.title}" berhasil dihapus.`);
        setCourseToDelete(null);
        if (res.data) {
          onCourseSwitched(res.data);
        } else {
          const remaining = courses.filter(c => c.id !== courseToDelete.id);
          if (remaining.length > 0) {
            await handleSwitch(remaining[0].id);
          }
        }
      } else {
        setErrorMsg(res.error || 'Gagal menghapus mata kuliah');
      }
    } catch {
      setErrorMsg('Kesalahan koneksi saat menghapus mata kuliah');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter courses by semester tab
  const filteredCourses = (courses || []).filter(c => {
    if (selectedSemesterTab === 'all') return true;
    const semNum = c.semesterNumber || (c.semester?.includes('3') || c.semester?.includes('III') ? 3 : 1);
    return semNum === selectedSemesterTab;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-3 md:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <DoorOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight flex items-center gap-2">
                <span>Kamar Perkuliahan & Multi-Semester</span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Data Terpisah & Terisolasi
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Kelola Semester & Mata Kuliah (MK) dengan 13 Mahasiswa & 10 Kelompok resmi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-800">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isDosen && (
            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-950">Mode Akses Mahasiswa:</span>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Anda dapat melihat dan memilih mata kuliah yang ingin dibuka. Fitur <strong>menambah mata kuliah baru</strong>, <strong>menghapus data MK</strong>, dan <strong>mengunggah dokumen RPS</strong> secara eksklusif hanya dapat dikelola oleh Dosen Pengampu.
                </p>
              </div>
            </div>
          )}

          {editingCourse && isDosen ? (
            /* Edit Course (Kelola Mata Kuliah) Form */
            <form onSubmit={handleSaveEditCourse} className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Kelola & Edit Data Mata Kuliah (RPS)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Sesuaikan identitas mata kuliah, nama dosen, ruang kelas, semester, dan beban SKS
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Batal / Kembali
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Mata Kuliah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Contoh: Konsep Dasar Manajemen Pendidikan Islam"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Mata Kuliah
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    placeholder="Contoh: MPI 301"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bobot SKS
                  </label>
                  <select
                    value={editSks}
                    onChange={(e) => setEditSks(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value={1}>1 SKS</option>
                    <option value={2}>2 SKS</option>
                    <option value={3}>3 SKS</option>
                    <option value={4}>4 SKS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tingkat Semester (Angka)
                  </label>
                  <select
                    value={editSemesterNumber}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      setEditSemesterNumber(num);
                      const roman = num === 1 ? 'I' : num === 2 ? 'II' : num === 3 ? 'III' : num === 4 ? 'IV' : num === 5 ? 'V' : num === 6 ? 'VI' : num === 7 ? 'VII' : num === 8 ? 'VIII' : String(num);
                      const ganjilGenap = num % 2 === 1 ? 'Ganjil' : 'Genap';
                      setEditSemester(`Semester ${roman} (${ganjilGenap} 2026/2027)`);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-semibold text-slate-800"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        Semester {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Label Semester & Tahun Akademik
                  </label>
                  <input
                    type="text"
                    value={editSemester}
                    onChange={(e) => setEditSemester(e.target.value)}
                    placeholder="Contoh: Semester III (Ganjil 2026/2027)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ruang / Kamar Perkuliahan
                  </label>
                  <input
                    type="text"
                    value={editRoomName}
                    onChange={(e) => setEditRoomName(e.target.value)}
                    placeholder="Contoh: Kamar MPI 3A (Ruang Ibnu Khaldun)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dosen Pengampu
                  </label>
                  <input
                    type="text"
                    value={editDosenName}
                    onChange={(e) => setEditDosenName(e.target.value)}
                    placeholder="Contoh: Risfa Tri Ulfa"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gelar Dosen
                  </label>
                  <input
                    type="text"
                    value={editDosenTitle}
                    onChange={(e) => setEditDosenTitle(e.target.value)}
                    placeholder="Contoh: S.Pd., M.Pd."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Program Studi
                  </label>
                  <input
                    type="text"
                    value={editStudyProgram}
                    onChange={(e) => setEditStudyProgram(e.target.value)}
                    placeholder="Contoh: Manajemen Pendidikan Islam (MPI)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Kampus
                  </label>
                  <input
                    type="text"
                    value={editCampusName}
                    onChange={(e) => setEditCampusName(e.target.value)}
                    placeholder="Contoh: STAI Jarinabi"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Deskripsi Ringkas Mata Kuliah
                  </label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Tuliskan deskripsi fokus capaian pembelajaran RPS..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan MK</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : !showAddForm || !isDosen ? (
            <>
              {/* Courses List */}
              <div className="space-y-3">
                {/* Delete Confirmation Box */}
                {isDosen && courseToDelete && (
                  <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl space-y-2.5 animate-in fade-in">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 bg-rose-100 text-rose-700 rounded-lg flex-shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-bold text-rose-950">Konfirmasi Hapus Mata Kuliah</h4>
                        <p className="text-xs text-rose-800 mt-0.5">
                          Apakah Anda yakin ingin menghapus mata kuliah <strong>"{courseToDelete.title}"</strong>? Seluruh jadwal pertemuan, mahasiswa, dan tugas di dalamnya akan dihapus permanen.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setCourseToDelete(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={handleExecuteDeleteCourse}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isLoading ? 'Menghapus...' : 'Ya, Hapus Sekarang'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Filter Tabs & Add Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <button
                      type="button"
                      onClick={() => setSelectedSemesterTab('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedSemesterTab === 'all'
                           ? 'bg-slate-900 text-white shadow-xs'
                           : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua Kamar ({courses?.length || 0})
                    </button>
                    {uniqueSemesters.map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setSelectedSemesterTab(num)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          selectedSemesterTab === num
                            ? num === 1
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-indigo-700 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${num === 1 ? 'bg-emerald-400' : 'bg-indigo-400'}`}></span>
                        <span>{num === 1 ? 'Semester 1 (MPI 1)' : num === 3 ? 'Semester 3 (MPI 3)' : `Semester ${num}`}</span>
                      </button>
                    ))}
                  </div>

                  {isDosen && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddForm(true);
                          handleSelectSemesterNumber(3);
                          handleApplyTemplate('konsep_dasar');
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah MK / Kamar Baru</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 pt-1">
                  {filteredCourses.map((c) => {
                    const isActive = c.id === activeCourseId;
                    const semNum = c.semesterNumber || (c.semester?.includes('3') || c.semester?.includes('III') ? 3 : 1);
                    const roomDisplayName = c.roomName || (semNum === 3 ? 'Kamar MPI 3A (Ruang Ibnu Khaldun)' : 'Kamar MPI 1 (Ruang Al-Farabi)');
                    const isSem3 = semNum === 3;
                    const isKonsep = c.id === 'mk-konsep-dasar-mpi3' || c.title.toLowerCase().includes('konsep');
                    const isKebijakan = c.id === 'mk-analisis-kebijakan-mpi3' || c.title.toLowerCase().includes('kebijakan');
                    const isFilsafat = c.id === 'mk-filsafat-ilmu' || c.title.toLowerCase().includes('filsafat');
                    const studentCount = c.totalStudents || (isFilsafat ? 13 : (isKonsep || isKebijakan) ? 20 : 13);
                    const groupCount = isKonsep ? 12 : 10;
                    const isExpanded = expandedRpsCourseId === c.id;
                    const rpsPreview = getRpsDetailsForCourse(c.id, c.title);

                    return (
                      <div
                        key={c.id}
                        className={`rounded-xl border-2 transition-all overflow-hidden ${
                          isActive
                            ? 'border-emerald-600 bg-white shadow-sm ring-1 ring-emerald-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div
                          onClick={() => handleSwitch(c.id)}
                          className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                        >
                          <div className="flex items-start space-x-3.5">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isActive
                                ? isSem3 ? 'bg-indigo-700 text-white' : 'bg-emerald-700 text-white'
                                : isSem3 ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              <DoorOpen className="w-5 h-5" />
                            </div>
                            <div className="space-y-1">
                              {/* Badges bar */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isSem3 ? 'bg-indigo-100 text-indigo-900 border border-indigo-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                }`}>
                                  Semester {semNum}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                                  {roomDisplayName}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 text-[10px] font-semibold border border-sky-200 flex items-center gap-1">
                                  <Users className="w-3 h-3 text-sky-600" />
                                  <span>{studentCount} Mahasiswa</span>
                                </span>
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                                  {groupCount} Kelompok RPS
                                </span>
                                {isActive && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold shadow-2xs">
                                    Sedang Aktif
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-2">
                                <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-bold">
                                  {c.code}
                                </span>
                              </div>

                              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                                <span>{c.sks} SKS</span>
                                <span>•</span>
                                <span>Prodi: {c.studyProgram}</span>
                                <span>•</span>
                                <span>{c.semester}</span>
                              </div>

                              <div className="text-[11px] text-slate-600 flex items-center space-x-1.5 pt-0.5">
                                <User className="w-3 h-3 text-slate-400" />
                                <span>{c.dosenName}{c.dosenTitle ? ', ' + c.dosenTitle : ''}</span>
                                <span className="text-slate-300">•</span>
                                <School className="w-3 h-3 text-slate-400" />
                                <span className="font-semibold text-emerald-800">{c.campusName || 'STAI Jarinabi'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end sm:justify-center space-x-1.5 self-end sm:self-center shrink-0 flex-wrap gap-y-1">
                            {/* RPS preview accordion toggle */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedRpsCourseId(isExpanded ? null : c.id);
                              }}
                              className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1 text-xs font-semibold transition-colors ${
                                isExpanded
                                  ? 'bg-slate-200 text-slate-900 border-slate-300'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                              title="Lihat daftar kelompok dan rekomendasi judul makalah RPS"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                              <span className="text-[11px]">RPS & Kelompok</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>

                            {/* Edit MK Button */}
                            {isDosen && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditCourse(c, e)}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 flex items-center space-x-1 text-xs font-semibold transition-colors shadow-2xs"
                                title="Edit data mata kuliah (Nama, Kode, SKS, Dosen, Ruang, Semester)"
                              >
                                <Pencil className="w-3.5 h-3.5 text-amber-700" />
                                <span className="text-[11px]">Edit MK</span>
                              </button>
                            )}

                            {/* Sync Roster Button */}
                            {isDosen && (
                              <button
                                type="button"
                                disabled={isSyncingCourseId === c.id}
                                onClick={(e) => handleSyncCourseRoster(c.id, e)}
                                className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 flex items-center space-x-1 text-xs font-semibold transition-colors shadow-2xs"
                                title={`Sinkronkan ${studentCount} Mahasiswa & ${groupCount} Kelompok Sesuai RPS`}
                              >
                                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCourseId === c.id ? 'animate-spin text-sky-600' : 'text-sky-700'}`} />
                                <span className="text-[11px]">{isSyncingCourseId === c.id ? 'Menyinkronkan...' : 'Sinkronkan RPS'}</span>
                              </button>
                            )}

                            {isDosen && (courses?.length || 0) > 1 && (
                              <button
                                type="button"
                                onClick={(e) => handleOpenDeleteConfirm(c.id, c.title, e)}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center space-x-1 text-xs font-semibold transition-colors"
                                title="Hapus kamar mata kuliah ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Hapus</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSwitch(c.id);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                                isActive
                                  ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}
                              title={isActive ? 'Kamar kuliah ini sedang aktif' : 'Masuk ke kamar perkuliahan ini'}
                            >
                              {isActive ? <Check className="w-3.5 h-3.5" /> : <DoorOpen className="w-3.5 h-3.5" />}
                              <span>{isActive ? 'Kamar Aktif' : 'Pilih Kamar'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Expanded RPS Accordion */}
                        {isExpanded && (
                          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs space-y-3 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                              <div className="flex items-center space-x-2">
                                <BookOpen className="w-4 h-4 text-emerald-700" />
                                <span className="font-bold text-slate-800">
                                  Distribusi RPS & Rekomendasi Judul Makalah ({rpsPreview.groups.length} Kelompok)
                                </span>
                              </div>
                              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                                Sesuai RPS Terbagi
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {rpsPreview.groups.map((grp) => (
                                <div
                                  key={grp.no}
                                  className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-emerald-900 text-[11px]">
                                      Kelompok {grp.no}
                                    </span>
                                    <span className="text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                                      {grp.members}
                                    </span>
                                  </div>
                                  <p className="text-[11px] font-semibold text-slate-800 leading-snug">
                                    {grp.title}
                                  </p>
                                </div>
                              ))}
                            </div>

                            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600">
                              <div>
                                <span className="font-bold text-slate-700">Daftar Mahasiswa Terdaftar ({rpsPreview.studentCount} Mhs):</span>{' '}
                                <span className="text-slate-600">{rpsPreview.studentsRoster}</span>
                              </div>
                              {isDosen && (
                                <button
                                  type="button"
                                  disabled={isSyncingCourseId === c.id}
                                  onClick={(e) => handleSyncCourseRoster(c.id, e)}
                                  className="shrink-0 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                                >
                                  <RefreshCw className={`w-3 h-3 ${isSyncingCourseId === c.id ? 'animate-spin' : ''}`} />
                                  <span>Sinkronkan ke Kelas Ini</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {filteredCourses.length === 0 && (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <DoorOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">Belum ada kamar untuk filter semester ini</p>
                      <p className="text-[11px] text-slate-500 mt-1">Klik tombol "Tambah MK / Kamar Baru" di atas untuk menambahkan kamar kelas baru.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Add Course & Isolated Room Form */
            <form onSubmit={handleAddCourse} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <DoorOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Tambah Kamar Kelas & Multi-Semester Baru
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Tambah Semester (1..8) dan Mata Kuliah (MK) dengan nama kelompok resmi yang sudah ada
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 rounded bg-slate-100"
                >
                  Kembali ke Daftar
                </button>
              </div>

              {/* Quick Template Picker for Dosen */}
              <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Pilihan Cepat Sesuai RPS Dosen:</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Klik untuk mengisi form otomatis</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('konsep_dasar')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 shadow-2xs flex items-center gap-1.5 transition-all"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    <span>RPS Konsep Dasar MPI (Semester 3)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('kebijakan')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white text-indigo-900 border border-indigo-300 hover:bg-indigo-100 hover:border-indigo-400 shadow-2xs flex items-center gap-1.5 transition-all"
                  >
                    <BookMarked className="w-3.5 h-3.5 text-indigo-600" />
                    <span>RPS Analisis Kebijakan Pendidikan (Semester 3)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyTemplate('filsafat')}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-300 hover:bg-slate-100 shadow-2xs flex items-center gap-1.5 transition-all"
                  >
                    <School className="w-3.5 h-3.5 text-slate-600" />
                    <span>Filsafat Ilmu (Semester 1)</span>
                  </button>
                </div>
              </div>

              {/* Quick Semester Selector */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900">
                    Pilih Semester yang Diampu:
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Bisa pilih Semester 1 s.d. 8</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { num: 1, label: 'Semester 1 (Ganjil)' },
                    { num: 3, label: 'Semester 3 (Ganjil)' },
                    { num: 2, label: 'Semester 2 (Genap)' },
                    { num: 4, label: 'Semester 4 (Genap)' },
                    { num: 5, label: 'Semester 5 (Ganjil)' },
                    { num: 6, label: 'Semester 6 (Genap)' },
                    { num: 7, label: 'Semester 7 (Ganjil)' },
                    { num: 8, label: 'Semester 8 (Genap)' },
                  ].map((s) => {
                    const isSelected = semesterNumber === s.num;
                    return (
                      <button
                        key={s.num}
                        type="button"
                        onClick={() => handleSelectSemesterNumber(s.num)}
                        className={`p-2.5 rounded-lg border text-center text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-emerald-500/30'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-[11px]">{s.label}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-normal ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          Kamar Terpisah
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Course Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Mata Kuliah (MK) *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Konsep Dasar Manajemen Pendidikan Islam"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                    required
                  />
                </div>

                {/* Course Code & SKS */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Mata Kuliah
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Contoh: MPI 301"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bobot SKS
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={sks}
                    onChange={(e) => setSks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Room Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Kamar / Ruang Kuliah *
                  </label>
                  <div className="relative">
                    <DoorOpen className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="Contoh: Kamar MPI 3A (Ruang Ibnu Khaldun)"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Nama kamar mempermudah membedakan ruang kelas antara Semester 1 dan Semester 3.
                  </span>
                </div>

                {/* Student Cohort Isolation Options */}
                <div className="sm:col-span-2 p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border-2 border-emerald-300 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>Pilihan Data Mahasiswa & Kelompok:</span>
                    </label>
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full shadow-2xs">
                      Sesuai Permintaan
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option 1: Master 13 Students (Default) */}
                    <button
                      type="button"
                      onClick={() => setStudentOption('use_existing_roster')}
                      className={`p-3 rounded-xl border-2 text-left text-xs transition-all flex items-start gap-2.5 ${
                        studentOption === 'use_existing_roster'
                          ? 'bg-white text-emerald-950 border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                          : 'bg-white/70 text-slate-700 border-emerald-200 hover:bg-white'
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block flex items-center gap-1">
                          <span>Gunakan 13 Mahasiswa yang Sudah Ada</span>
                          {studentOption === 'use_existing_roster' && <Check className="w-3.5 h-3.5 text-emerald-600 inline" />}
                        </span>
                        <span className="text-[10px] text-slate-600 block mt-0.5 leading-snug">
                          Husna, Ikha, Indah, Kirana, Khoir, Nurazizah, Haza, Tomi, Estiyani, Munailatul, Anggun, Ridho, Nia & 10 Kelompok resmi.
                        </span>
                      </div>
                    </button>

                    {/* Option 2: Custom roster with different student names */}
                    <button
                      type="button"
                      onClick={() => setStudentOption('custom_roster')}
                      className={`p-3 rounded-xl border-2 text-left text-xs transition-all flex items-start gap-2.5 ${
                        studentOption === 'custom_roster'
                          ? 'bg-white text-emerald-950 border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                          : 'bg-white/70 text-slate-700 border-emerald-200 hover:bg-white'
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block flex items-center gap-1">
                          <span>Input / Tempel Daftar Nama Mahasiswa Beda</span>
                          {studentOption === 'custom_roster' && <Check className="w-3.5 h-3.5 text-emerald-600 inline" />}
                        </span>
                        <span className="text-[10px] text-slate-600 block mt-0.5 leading-snug">
                          Ketik atau tempel nama-nama mahasiswa khusus untuk mata kuliah & semester baru ini.
                        </span>
                      </div>
                    </button>

                    {/* Option 3: Copy from specific course */}
                    <button
                      type="button"
                      onClick={() => setStudentOption('copy_from_course')}
                      className={`p-3 rounded-xl border-2 text-left text-xs transition-all flex items-start gap-2.5 ${
                        studentOption === 'copy_from_course'
                          ? 'bg-white text-indigo-950 border-indigo-600 shadow-sm ring-2 ring-indigo-500/20'
                          : 'bg-white/70 text-slate-700 border-indigo-200 hover:bg-white'
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800 shrink-0 mt-0.5">
                        <Copy className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block flex items-center gap-1">
                          <span>Salin Mahasiswa dari MK Tertentu</span>
                          {studentOption === 'copy_from_course' && <Check className="w-3.5 h-3.5 text-indigo-600 inline" />}
                        </span>
                        <span className="text-[10px] text-slate-600 block mt-0.5 leading-snug">
                          Menyalin daftar mahasiswa & kelompok dari mata kuliah yang sudah ada di sistem.
                        </span>
                      </div>
                    </button>

                    {/* Option 4: Clean Empty */}
                    <button
                      type="button"
                      onClick={() => setStudentOption('empty')}
                      className={`p-3 rounded-xl border-2 text-left text-xs transition-all flex items-start gap-2.5 ${
                        studentOption === 'empty'
                          ? 'bg-white text-amber-950 border-amber-600 shadow-sm ring-2 ring-amber-500/20'
                          : 'bg-white/70 text-slate-700 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">Kamar Kosong Bersih</span>
                        <span className="text-[10px] text-slate-600 block mt-0.5 leading-snug">
                          Mulai tanpa mahasiswa, dosen dapat input mandiri atau unggah Excel/CSV.
                        </span>
                      </div>
                    </button>
                  </div>

                  {studentOption === 'custom_roster' && (
                    <div className="mt-3 p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-emerald-950">
                          Daftar Nama Mahasiswa Baru (1 nama per baris atau dipisah koma):
                        </label>
                        <span className="text-[11px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                          Terdeteksi: {customStudentNamesText.split(/[\n,;]+/).map(s => s.trim().replace(/^[0-9]+[\.\-\)\s]+/, '').trim()).filter(s => s.length > 1).length} Mahasiswa
                        </span>
                      </div>
                      <textarea
                        rows={5}
                        value={customStudentNamesText}
                        onChange={(e) => setCustomStudentNamesText(e.target.value)}
                        placeholder={`Contoh tempel atau ketik nama mahasiswa baru:\n1. Ahmad Zaki Al-Farisi\n2. Siti Nurhaliza\n3. Budi Santoso\n4. Putri Dewi Lestari\n5. Muhammad Ridwan`}
                        className="w-full p-2.5 text-xs font-mono rounded-lg border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                      <p className="text-[10px] text-emerald-800">
                        * Sistem akan otomatis membuatkan NIM, akun mahasiswa, pembagian kelompok, dan rekap penilaian tersendiri untuk MK ini.
                      </p>
                    </div>
                  )}

                  {studentOption === 'copy_from_course' && (
                    <div className="pt-2">
                      <label className="block text-[11px] font-bold text-indigo-950 mb-1">
                        Pilih Mata Kuliah Sumber Salinan:
                      </label>
                      <select
                        value={sourceCourseId}
                        onChange={(e) => setSourceCourseId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-indigo-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      >
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title} ({c.semester}) - {c.totalStudents || 0} Mahasiswa
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                {/* Smart RPS Document Upload (Word docx / PDF / txt) */}
                <div className="sm:col-span-2 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <div className="flex items-center space-x-2 text-emerald-950 font-bold text-xs">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>Upload Berkas RPS (Word .docx / .doc / PDF / .txt)</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold w-fit">
                      Auto-Extract 16 Pertemuan & Tugas
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mb-3 leading-relaxed">
                    Unggah dokumen RPS Mata Kuliah. Sistem otomatis membaca rincian MK, SKS, Dosen, menyusun jadwal 16 pertemuan, dan langsung membagi tugas presentasi (individu / kelompok) secara otomatis.
                  </p>

                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white/90 hover:bg-white rounded-xl p-4 cursor-pointer transition-all shadow-2xs">
                    <input
                      type="file"
                      accept=".docx,.doc,.pdf,.txt,.md"
                      className="hidden"
                      onChange={handleRpsDocUpload}
                      disabled={isParsingDoc}
                    />
                    {isParsingDoc ? (
                      <div className="flex items-center space-x-2 text-emerald-700 py-1">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-xs font-semibold">Mengekstrak teks & menganalisis dokumen RPS ({uploadedFileName})...</span>
                      </div>
                    ) : uploadedFileName ? (
                      <div className="flex items-center space-x-2 text-emerald-900 py-1">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span className="text-xs font-bold">{uploadedFileName}</span>
                        <span className="text-[10px] text-emerald-700 underline ml-2">Ganti berkas</span>
                      </div>
                    ) : (
                      <div className="text-center py-1">
                        <Upload className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                        <p className="text-xs font-bold text-slate-800">Klik atau seret berkas RPS (Word / PDF) ke sini</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Mendukung Microsoft Word (.docx, .doc), Adobe PDF (.pdf), atau Plain Text (.txt)</p>
                      </div>
                    )}
                  </label>

                  {/* Parsing summary card */}
                  {parsedSummary && (
                    <div className="mt-3 bg-white p-3 rounded-lg border border-emerald-200 text-xs text-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Hasil Pembacaan RPS:</span>
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-800">
                          {parsedSummary.meetingsCount} Pertemuan Terbaca
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {parsedSummary.kelompokCount} Tugas Presentasi Kelompok
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                          {parsedSummary.individuCount} Tugas Presentasi Individu
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          UTS & UAS Siap
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Format Penugasan Dosen Selector */}
                  <div className="mt-3 pt-2 border-t border-emerald-100">
                    <label className="block text-[11px] font-bold text-emerald-950 mb-1.5">
                      Penentuan Dosen untuk Format Tugas Presentasi:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setDefaultFormat('auto')}
                        className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] transition-all ${
                          defaultFormat === 'auto'
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <span className="block font-bold">Otomatis Sesuai RPS</span>
                        <span className="text-[10px] opacity-80">Sesuai teks RPS per sesi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDefaultFormat('kelompok')}
                        className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] transition-all ${
                          defaultFormat === 'kelompok'
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <span className="block font-bold">Tugas Presentasi Kelompok</span>
                        <span className="text-[10px] opacity-80">Materi dibagi per kelompok</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDefaultFormat('individu')}
                        className={`px-2.5 py-1.5 rounded-lg border text-left text-[11px] transition-all ${
                          defaultFormat === 'individu'
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <span className="block font-bold">Tugas Presentasi Individu</span>
                        <span className="text-[10px] opacity-80">Materi dibagi mandiri</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Mata Kuliah Baru *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Manajemen Lembaga Pendidikan Islam"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Mata Kuliah
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Contoh: MPI-502"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bobot SKS
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={sks}
                    onChange={(e) => setSks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Semester
                  </label>
                  <input
                    type="text"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="Semester Ganjil 2026/2027"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Program Studi
                  </label>
                  <input
                    type="text"
                    value={studyProgram}
                    onChange={(e) => setStudyProgram(e.target.value)}
                    placeholder="Manajemen Pendidikan Islam (MPI 1)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Kampus / Perguruan Tinggi
                  </label>
                  <input
                    type="text"
                    value={campusName}
                    onChange={(e) => setCampusName(e.target.value)}
                    placeholder="STAI Jarinabi"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Dosen Pengampu
                  </label>
                  <input
                    type="text"
                    value={dosenName}
                    onChange={(e) => setDosenName(e.target.value)}
                    placeholder="Risfa Tri Ulfa"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gelar Dosen
                  </label>
                  <input
                    type="text"
                    value={dosenTitle}
                    onChange={(e) => setDosenTitle(e.target.value)}
                    placeholder="S.Pd., M.Pd., Gr."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    RPS / Pokok Bahasan 16 Pertemuan (Opsional)
                  </label>
                  <textarea
                    value={rpsText}
                    onChange={(e) => setRpsText(e.target.value)}
                    placeholder="Tempel rincian RPS untuk mata kuliah baru ini..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center space-x-2"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan & Aktifkan MK'}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Dosen: {courseProfile?.name || 'Risfa Tri Ulfa, S.Pd., M.Pd., Gr.'}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
