
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Student, BehaviorType } from '../types';
import { Search, ThumbsUp, ThumbsDown, X, UserPlus, Edit2, FileSpreadsheet, Sparkles, Trash2, Plus, Printer, Loader2, Download, Save, MessageCircle, AlertTriangle, Share2, DoorOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from './Modal';
import ExcelImport from './ExcelImport';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import * as XLSX from 'xlsx';

declare var html2pdf: any;

interface StudentListProps {
  students: Student[];
  classes: string[];
  onAddClass: (name: string) => void;
  onAddStudentManually: (name: string, className: string, phone?: string, avatar?: string) => void;
  onBatchAddStudents: (students: Student[]) => void;
  onUpdateStudent: (s: Student) => void;
  onDeleteStudent: (id: string) => void;
  onViewReport: (s: Student) => void;
  currentSemester: '1' | '2';
  onSemesterChange: (sem: '1' | '2') => void;
  onEditClass: (oldName: string, newName: string) => void;
  onDeleteClass: (className: string) => void;
}

const POSITIVE_BEHAVIORS = [
    { label: 'مشاركة مميزة', points: 1 },
    { label: 'واجب منزلي', points: 1 },
    { label: 'نظافة وترتيب', points: 1 },
    { label: 'تعاون مع الزملاء', points: 2 },
    { label: 'إجابة نموذجية', points: 2 },
    { label: 'انضباط وهدوء', points: 1 },
    { label: 'مبادرة إيجابية', points: 3 },
    { label: 'إحضار الأدوات', points: 1 },
];

const NEGATIVE_BEHAVIORS = [
    { label: 'إزعاج في الحصة', points: -1 },
    { label: 'عدم حل الواجب', points: -1 },
    { label: 'نسيان الكتاب/الدفت', points: -1 },
    { label: 'تأخر عن الحصة', points: -1 },
    { label: 'نوم داخل الفصل', points: -1 },
    { label: 'ألفاظ غير لائقة', points: -2 },
    { label: 'شجار مع زميل', points: -3 },
    { label: 'استخدام الهاتف', points: -2 },
];

const StudentItem = React.memo(({ student, onViewReport, onAction, currentSemester }: { 
    student: Student, onViewReport: (s: Student) => void, onAction: (s: Student, type: 'positive' | 'negative' | 'edit' | 'delete' | 'truant') => void, currentSemester: '1' | '2'
}) => {
    const totalScore = useMemo(() => (student.grades || []).filter(g => !g.semester || g.semester === currentSemester).reduce((sum, g) => sum + (Number(g.score) || 0), 0), [student.grades, currentSemester]);
    const gradeSymbol = useMemo(() => { if (totalScore >= 90) return 'أ'; if (totalScore >= 80) return 'ب'; if (totalScore >= 65) return 'ج'; if (totalScore >= 50) return 'د'; return 'هـ'; }, [totalScore]);
    
    // Glassy Colors
    const gradeColor = useMemo(() => { 
        if (totalScore >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'; 
        if (totalScore >= 80) return 'text-blue-400 bg-blue-500/10 border-blue-500/20'; 
        if (totalScore >= 65) return 'text-amber-400 bg-amber-500/10 border-amber-500/20'; 
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20'; 
    }, [totalScore]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="group flex items-center justify-between p-3 mb-3 glass-card rounded-2xl cursor-pointer hover:border-white/30 transition-all"
            onClick={() => onViewReport(student)}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full glass-icon flex items-center justify-center text-slate-600 dark:text-white/70 text-sm font-bold overflow-hidden shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover" /> : student.name.charAt(0)}
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate group-hover:text-glow transition-all">{student.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] glass-icon text-slate-500 dark:text-white/60 px-2 py-0.5 rounded-lg font-bold">{student.classes[0]}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold border ${gradeColor}`}>{gradeSymbol}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1.5 pl-1 opacity-80 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); onAction(student, 'positive'); }} className="p-2 rounded-xl glass-icon text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onAction(student, 'negative'); }} className="p-2 rounded-xl glass-icon text-rose-500 hover:text-rose-400 hover:bg-rose-500/20 transition-colors">
                    <ThumbsDown className="w-4 h-4" />
                </button>
                {/* Truancy Button Added Here */}
                <button onClick={(e) => { e.stopPropagation(); onAction(student, 'truant'); }} className="p-2 rounded-xl glass-icon text-purple-500 hover:text-purple-400 hover:bg-purple-500/20 transition-colors" title="تسرب">
                    <DoorOpen className="w-4 h-4" />
                </button>
                <div className="w-px h-6 bg-white/10 mx-1"></div>
                <button onClick={(e) => { e.stopPropagation(); onAction(student, 'edit'); }} className="p-2 text-slate-400 dark:text-white/40 hover:text-white transition-colors">
                    <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onAction(student, 'delete'); }} className="p-2 text-slate-400 dark:text-white/40 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}, (prev, next) => prev.student === next.student && prev.currentSemester === next.currentSemester);

const StudentList: React.FC<StudentListProps> = ({ students, classes, onAddClass, onAddStudentManually, onBatchAddStudents, onUpdateStudent, onDeleteStudent, onViewReport, currentSemester }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  
  // Modals State
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  
  // Inputs State
  const [newClassInput, setNewClassInput] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  
  // Behavior Logic State
  const [showNegativeReasons, setShowNegativeReasons] = useState<{student: Student} | null>(null);
  const [showPositiveReasons, setShowPositiveReasons] = useState<{student: Student} | null>(null);
  const [customBehaviorReason, setCustomBehaviorReason] = useState('');
  const [customBehaviorPoints, setCustomBehaviorPoints] = useState<string>('1');

  // Notification State (For Truancy)
  const [notificationTarget, setNotificationTarget] = useState<{student: Student, type: 'truancy'} | null>(null);

  // Random Picker State
  const [randomStudent, setRandomStudent] = useState<Student | null>(null);
  const [isRandomPicking, setIsRandomPicking] = useState(false);

  // Export States
  const [isExporting, setIsExporting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const filteredStudents = useMemo(() => students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = selectedClass === 'all' || s.classes?.includes(selectedClass);
      return matchesSearch && matchesClass;
  }), [students, searchTerm, selectedClass]);

  const handleAction = useCallback((student: Student, type: 'positive' | 'negative' | 'edit' | 'delete' | 'truant') => {
      if (type === 'positive') { 
          setCustomBehaviorReason(''); 
          setCustomBehaviorPoints('1'); 
          setShowPositiveReasons({student}); 
      }
      else if (type === 'negative') { 
          setCustomBehaviorReason(''); 
          setCustomBehaviorPoints('-1'); 
          setShowNegativeReasons({student}); 
      }
      else if (type === 'truant') {
          // Record as Truant in Attendance
          const today = new Date().toLocaleDateString('en-CA');
          const filteredAttendance = student.attendance.filter(a => a.date !== today);
          const updatedStudent = {
              ...student,
              attendance: [...filteredAttendance, { date: today, status: 'truant' as const }]
          };
          onUpdateStudent(updatedStudent);
          setNotificationTarget({ student: updatedStudent, type: 'truancy' });
      }
      else if (type === 'edit') { 
          setEditingStudent(student); 
          setEditName(student.name); 
          setEditPhone(student.parentPhone || ''); 
          setEditClass(student.classes[0] || ''); 
          setEditAvatar(student.avatar || ''); 
          setShowManualAddModal(true); 
      }
      else if (type === 'delete') { 
          if(confirm('حذف الطالب؟')) onDeleteStudent(student.id); 
      }
  }, [onDeleteStudent, onUpdateStudent]);

  const handleAddBehavior = (student: Student, type: BehaviorType, description: string, points: number) => {
    onUpdateStudent({ 
        ...student, 
        behaviors: [{ 
            id: Math.random().toString(36).substr(2, 9), 
            date: new Date().toISOString(), 
            type, 
            description, 
            points, 
            semester: currentSemester 
        }, ...(student.behaviors || [])] 
    });
    
    setShowNegativeReasons(null); 
    setShowPositiveReasons(null);
  };

  const handleManualBehaviorSubmit = (type: BehaviorType, student: Student) => {
      if (!customBehaviorReason.trim()) return;
      const points = parseInt(customBehaviorPoints) || (type === 'positive' ? 1 : -1);
      handleAddBehavior(student, type, customBehaviorReason, points);
  };

  const handleSaveStudent = () => {
      if (!editName.trim() || !editClass.trim()) return alert('البيانات ناقصة');
      if (editingStudent) onUpdateStudent({ ...editingStudent, name: editName, parentPhone: editPhone, classes: [editClass], avatar: editAvatar });
      else onAddStudentManually(editName, editClass, editPhone, editAvatar);
      setShowManualAddModal(false); setEditingStudent(null); setEditName(''); setEditPhone(''); setEditClass(''); setEditAvatar('');
  };

  const handleCreateClass = () => {
      if (newClassInput.trim()) {
          onAddClass(newClassInput.trim());
          setNewClassInput('');
          setShowAddClassModal(false);
      }
  };

  const pickRandomStudent = () => { 
      if (filteredStudents.length === 0) return; 
      setIsRandomPicking(true); 
      setRandomStudent(filteredStudents[Math.floor(Math.random() * filteredStudents.length)]); 
      let i=0; 
      const int = setInterval(() => { 
          setRandomStudent(filteredStudents[Math.floor(Math.random() * filteredStudents.length)]); 
          i++; 
          if(i>15) { 
              clearInterval(int); 
              setIsRandomPicking(false); 
          } 
      }, 100); 
  };

  const performNotification = async (method: 'whatsapp' | 'sms') => {
      if(!notificationTarget || !notificationTarget.student.parentPhone) {
          alert('لا يوجد رقم هاتف مسجل');
          return;
      }
      
      const { student } = notificationTarget;
      let cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
      if (!cleanPhone || cleanPhone.length < 5) return alert('رقم الهاتف غير صحيح');
      
      if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
      if (cleanPhone.length === 8) cleanPhone = '968' + cleanPhone;
      else if (cleanPhone.length === 9 && cleanPhone.startsWith('0')) cleanPhone = '968' + cleanPhone.substring(1);

      const statusText = 'هروب (تسرب) من الحصة';
      const dateText = new Date().toLocaleDateString('ar-EG');
      const msg = encodeURIComponent(`السلام عليكم، نود إشعاركم بأن الطالب ${student.name} قام بسلوك: *${statusText}* اليوم (${dateText}). نرجو متابعة الأمر.`);
      
      if (method === 'whatsapp') {
          // ============================================================
          // 🔥 الحل النووي (Windows Nuclear Solution) 🔥
          // ============================================================
          // هذا الكود يتأكد إذا كنا في بيئة إلكترون (ويندوز) ويستخدم الجسر
          // لفتح واتساب مباشرة، وإذا كنا في الويب/موبايل يستخدم الطريقة العادية
          if (window.electron && window.electron.openExternal) {
              window.electron.openExternal(`whatsapp://send?phone=${cleanPhone}&text=${msg}`);
          } else {
              // Android / iOS / Web
              const universalUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
              try {
                  if (Capacitor.isNativePlatform()) await Browser.open({ url: universalUrl });
                  else window.open(universalUrl, '_blank');
              } catch (e) { window.open(universalUrl, '_blank'); }
          }
      } else {
          window.location.href = `sms:${cleanPhone}?body=${msg}`;
      }
      setNotificationTarget(null);
  };

  // --- REPORT EXPORT LOGIC ---

  const handleExportExcelReport = async () => {
      if (filteredStudents.length === 0) return alert('لا يوجد طلاب');
      setIsExporting(true);
      try {
          const data = filteredStudents.map(student => {
              const absences = student.attendance.filter(a => a.status === 'absent');
              const positiveBehaviors = (student.behaviors || []).filter(b => b.type === 'positive');
              const negativeBehaviors = (student.behaviors || []).filter(b => b.type === 'negative');
              const totalScore = (student.grades || []).reduce((acc, g) => acc + (Number(g.score) || 0), 0);

              return {
                  'اسم الطالب': student.name,
                  'الصف': student.classes[0] || '',
                  'عدد أيام الغياب': absences.length,
                  'تواريخ الغياب': absences.map(a => a.date).join(', '),
                  'سلوكيات إيجابية': positiveBehaviors.map(b => b.description).join(', '),
                  'سلوكيات سلبية': negativeBehaviors.map(b => b.description).join(', '),
                  'مجموع الدرجات': totalScore
              };
          });

          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.json_to_sheet(data);
          // RTL support
          if(!ws['!views']) ws['!views'] = [];
          ws['!views'].push({ rightToLeft: true });
          
          XLSX.utils.book_append_sheet(wb, ws, "تقرير شامل");
          const fileName = `Report_${new Date().toISOString().split('T')[0]}.xlsx`;

          if (Capacitor.isNativePlatform()) {
              const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
              const result = await Filesystem.writeFile({
                  path: fileName,
                  data: wbout,
                  directory: Directory.Cache
              });
              await Share.share({
                  title: 'تقرير الطلاب الشامل',
                  url: result.uri,
                  dialogTitle: 'مشاركة التقرير'
              });
          } else {
              XLSX.writeFile(wb, fileName);
          }
      } catch (e) {
          console.error(e);
          alert('حدث خطأ أثناء التصدير');
      } finally {
          setIsExporting(false);
      }
  };

  const handlePrintPdfReport = async () => {
      if (filteredStudents.length === 0) return alert('لا يوجد طلاب');
      setIsGeneratingPdf(true);

      const element = document.createElement('div');
      element.setAttribute('dir', 'rtl');
      element.style.fontFamily = 'Tajawal, sans-serif';
      element.style.padding = '20px';
      element.style.backgroundColor = '#fff';
      element.style.color = '#000';

      const rows = filteredStudents.map((s, i) => {
          const absences = s.attendance.filter(a => a.status === 'absent').map(a => a.date).join(', ');
          const pos = (s.behaviors || []).filter(b => b.type === 'positive').map(b => b.description).join('، ');
          const neg = (s.behaviors || []).filter(b => b.type === 'negative').map(b => b.description).join('، ');
          
          return `
            <tr>
                <td style="border:1px solid #000; padding:5px; text-align:center;">${i + 1}</td>
                <td style="border:1px solid #000; padding:5px;">${s.name}</td>
                <td style="border:1px solid #000; padding:5px; text-align:center;">${s.attendance.filter(a => a.status === 'absent').length}</td>
                <td style="border:1px solid #000; padding:5px; font-size:10px;">${absences}</td>
                <td style="border:1px solid #000; padding:5px; font-size:10px; color:green;">${pos}</td>
                <td style="border:1px solid #000; padding:5px; font-size:10px; color:red;">${neg}</td>
            </tr>
          `;
      }).join('');

      element.innerHTML = `
        <div style="text-align:center; margin-bottom:20px;">
            <h2 style="margin:0;">تقرير شامل للطلاب</h2>
            <p style="margin:5px 0;">الفصل: ${selectedClass === 'all' ? 'جميع الفصول' : selectedClass} | التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
            <thead>
                <tr style="background-color:#eee;">
                    <th style="border:1px solid #000; padding:5px; width:30px;">#</th>
                    <th style="border:1px solid #000; padding:5px;">الاسم</th>
                    <th style="border:1px solid #000; padding:5px; width:50px;">غياب</th>
                    <th style="border:1px solid #000; padding:5px;">تواريخ الغياب</th>
                    <th style="border:1px solid #000; padding:5px;">إيجابيات</th>
                    <th style="border:1px solid #000; padding:5px;">سلبيات</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
      `;

      if (typeof html2pdf !== 'undefined') {
          const opt = {
              margin: 10,
              filename: `Class_Report.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2 },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
          };
          try {
              const worker = html2pdf().set(opt).from(element).toPdf();
              if (Capacitor.isNativePlatform()) {
                  const pdfBase64 = await worker.output('datauristring');
                  const base64Data = pdfBase64.split(',')[1];
                  const result = await Filesystem.writeFile({
                      path: 'Class_Report.pdf',
                      data: base64Data,
                      directory: Directory.Cache
                  });
                  await Share.share({
                      title: 'تقرير الفصل',
                      url: result.uri,
                      dialogTitle: 'مشاركة التقرير'
                  });
              } else {
                  worker.save();
              }
          } catch (e) {
              console.error(e);
              alert('خطأ في إنشاء PDF');
          } finally {
              setIsGeneratingPdf(false);
          }
      } else {
          alert('مكتبة PDF غير محملة');
          setIsGeneratingPdf(false);
      }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sticky Glass Header */}
      <div className="sticky top-0 z-30 pb-4 pt-2 -mx-2 px-2">
          <div className="glass-heavy rounded-3xl p-4 shadow-2xl backdrop-blur-xl border border-white/20">
              <div className="flex justify-between items-center mb-4">
                  <div><h1 className="text-2xl font-black text-slate-800 dark:text-white text-glow">قائمة الطلاب</h1><p className="text-slate-500 dark:text-white/50 text-xs font-bold">{filteredStudents.length} طالب</p></div>
                  <div className="flex gap-2">
                      <button onClick={handleExportExcelReport} disabled={isExporting} className="w-10 h-10 rounded-xl glass-icon text-emerald-600 dark:text-emerald-400 active:scale-95" title="تصدير تقرير إكسل شامل">
                          {isExporting ? <Loader2 className="w-5 h-5 animate-spin"/> : <FileSpreadsheet className="w-5 h-5"/>}
                      </button>
                      <button onClick={handlePrintPdfReport} disabled={isGeneratingPdf} className="w-10 h-10 rounded-xl glass-icon text-blue-600 dark:text-blue-400 active:scale-95" title="طباعة تقرير PDF">
                          {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin"/> : <Printer className="w-5 h-5"/>}
                      </button>
                      <div className="w-px h-8 bg-slate-300 dark:bg-white/20 mx-1"></div>
                      <button onClick={pickRandomStudent} className="w-10 h-10 rounded-xl glass-icon text-amber-400 active:scale-95"><Sparkles className="w-5 h-5"/></button>
                      <button onClick={() => setShowSelectionModal(true)} className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.5)] active:scale-95 border border-indigo-400/50"><Plus className="w-6 h-6"/></button>
                  </div>
              </div>
              
              <div className="relative mb-3 group">
                  <input type="text" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full glass-input rounded-xl py-3 pr-10 pl-4 text-sm font-bold outline-none focus:border-indigo-500/50 transition-colors text-slate-900 dark:text-white" />
                  <Search className="absolute right-3 top-3 w-5 h-5 text-slate-400 dark:text-white/30" />
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar items-center pb-1">
                  <button onClick={() => setSelectedClass('all')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedClass === 'all' ? 'bg-indigo-600 text-white border-transparent shadow-lg' : 'glass-card text-slate-500 dark:text-white/60 border-white/10'}`}>الكل</button>
                  {classes.map(c => (<button key={c} onClick={() => setSelectedClass(c)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedClass === c ? 'bg-indigo-600 text-white border-transparent shadow-lg' : 'glass-card text-slate-500 dark:text-white/60 border-white/10'}`}>{c}</button>))}
                  <button onClick={() => setShowAddClassModal(true)} className="px-3 py-2 glass-card rounded-xl text-xs font-bold text-indigo-400 ml-1 whitespace-nowrap flex items-center gap-1 active:scale-95">
                      <Plus className="w-3 h-3" /> فصل
                  </button>
              </div>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-24 px-1">
          {filteredStudents.length > 0 ? filteredStudents.map(student => (
              <StudentItem key={student.id} student={student} onViewReport={onViewReport} onAction={handleAction} currentSemester={currentSemester} />
          )) : <div className="text-center py-20 text-slate-400 dark:text-white/30 font-bold glass rounded-3xl mt-4">لا يوجد طلاب</div>}
      </div>

      {/* --- Add Selection Modal (GLASS) --- */}
      <Modal isOpen={showSelectionModal} onClose={() => setShowSelectionModal(false)}>
          <div className="text-center">
              <h3 className="font-black text-xl mb-6 text-slate-900 dark:text-white">إضافة طلاب</h3>
              <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => { setShowSelectionModal(false); setShowManualAddModal(true); }} className="glass-card p-6 rounded-3xl flex flex-col items-center gap-4 transition-all hover:bg-white/10 hover:border-white/30 active:scale-95 group">
                      <div className="w-16 h-16 rounded-full glass-icon flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform"><UserPlus className="w-8 h-8"/></div>
                      <span className="font-black text-sm text-slate-800 dark:text-white">إضافة يدوية</span>
                  </button>
                  <button onClick={() => { setShowSelectionModal(false); setShowImportModal(true); }} className="glass-card p-6 rounded-3xl flex flex-col items-center gap-4 transition-all hover:bg-white/10 hover:border-white/30 active:scale-95 group">
                      <div className="w-16 h-16 rounded-full glass-icon flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform"><FileSpreadsheet className="w-8 h-8"/></div>
                      <span className="font-black text-sm text-slate-800 dark:text-white">استيراد Excel</span>
                  </button>
              </div>
          </div>
      </Modal>

      {/* --- Excel Import Modal --- */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} className="w-full max-w-lg rounded-[2rem]">
          <div className="text-center">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-xl text-slate-900 dark:text-white">استيراد من Excel</h3>
                  <button onClick={() => setShowImportModal(false)} className="p-2 glass-icon rounded-full hover:bg-white/20"><X className="w-5 h-5 text-slate-500 dark:text-white/70"/></button>
              </div>
              <ExcelImport 
                  existingClasses={classes} 
                  onImport={(data) => { onBatchAddStudents(data); setShowImportModal(false); }} 
                  onAddClass={onAddClass} 
              />
          </div>
      </Modal>

      {/* --- Add Class Modal (GLASS) --- */}
      <Modal isOpen={showAddClassModal} onClose={() => setShowAddClassModal(false)}>
          <div className="text-center">
              <h3 className="font-black text-xl mb-6 text-slate-900 dark:text-white">إضافة فصل جديد</h3>
              <input autoFocus className="w-full p-4 glass-input rounded-2xl text-slate-900 dark:text-white font-bold text-sm outline-none focus:border-indigo-500/50 mb-6 placeholder:text-slate-400 dark:placeholder:text-white/30" value={newClassInput} onChange={e => setNewClassInput(e.target.value)} placeholder="اسم الفصل (مثال: 5/2)" />
              <div className="flex gap-3">
                  <button onClick={() => setShowAddClassModal(false)} className="flex-1 py-4 glass-card rounded-2xl font-bold text-xs text-slate-500 dark:text-white/60 hover:bg-white/10">إلغاء</button>
                  <button onClick={handleCreateClass} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-500/30">حفظ</button>
              </div>
          </div>
      </Modal>
      
      {/* --- Manual Add Student Modal (GLASS) --- */}
      <Modal isOpen={showManualAddModal} onClose={() => setShowManualAddModal(false)}>
          <div className="text-center">
              <h3 className="font-black text-xl mb-6 text-slate-900 dark:text-white">{editingStudent ? 'تعديل الطالب' : 'طالب جديد'}</h3>
              <div className="space-y-4">
                  <input autoFocus placeholder="اسم الطالب" value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-4 glass-input rounded-2xl text-slate-900 dark:text-white font-bold text-sm outline-none" />
                  <input placeholder="الصف (مثال: 5/1)" value={editClass} onChange={e => setEditClass(e.target.value)} className="w-full p-4 glass-input rounded-2xl text-slate-900 dark:text-white font-bold text-sm outline-none" />
                  <input placeholder="رقم ولي الأمر" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full p-4 glass-input rounded-2xl text-slate-900 dark:text-white font-bold text-sm outline-none" />
                  <button onClick={handleSaveStudent} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/30 mt-2">حفظ البيانات</button>
              </div>
          </div>
      </Modal>

      {/* --- Positive Behavior Modal --- */}
      <Modal isOpen={!!showPositiveReasons} onClose={() => setShowPositiveReasons(null)} className="max-w-sm rounded-[2rem]">
          <div className="text-center">
              <div className="w-16 h-16 glass-icon rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"><ThumbsUp className="w-8 h-8"/></div>
              <h3 className="font-black text-lg mb-1 text-slate-900 dark:text-white">{showPositiveReasons?.student.name}</h3>
              <p className="text-xs font-bold text-emerald-500 mb-6">تعزيز السلوك الإيجابي</p>
              
              <div className="grid grid-cols-2 gap-2 mb-4 max-h-[200px] overflow-y-auto custom-scrollbar p-1">
                  {POSITIVE_BEHAVIORS.map(r => (
                      <button key={r.label} onClick={() => handleAddBehavior(showPositiveReasons!.student, 'positive', r.label, r.points)} className="p-3 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-300 rounded-xl text-xs font-bold border border-white/10 transition-colors text-slate-700 dark:text-white flex justify-between items-center group">
                          <span>{r.label}</span>
                          <span className="text-[10px] opacity-50 bg-white/10 px-1.5 rounded-full group-hover:bg-emerald-500/20">+{r.points}</span>
                      </button>
                  ))}
              </div>

              <div className="pt-4 border-t border-white/10">
                  <p className="text-[10px] font-bold text-slate-400 text-right mb-2">إضافة يدوية:</p>
                  <div className="flex flex-col gap-3">
                      <input 
                        type="text" 
                        placeholder="السبب..." 
                        value={customBehaviorReason} 
                        onChange={e => setCustomBehaviorReason(e.target.value)} 
                        className="w-full glass-input rounded-xl px-3 py-3 text-xs font-bold"
                      />
                      <div className="flex gap-2">
                          <input 
                            type="number" 
                            placeholder="1" 
                            value={customBehaviorPoints} 
                            onChange={e => setCustomBehaviorPoints(e.target.value)} 
                            className="flex-[1] glass-input rounded-xl px-2 py-3 text-xs font-bold text-center"
                          />
                          <button 
                            onClick={() => handleManualBehaviorSubmit('positive', showPositiveReasons!.student)}
                            className="flex-[3] bg-emerald-500 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-xs shadow-lg active:scale-95 hover:bg-emerald-600 transition-colors"
                          >
                              <Save className="w-4 h-4" /> حفظ
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      </Modal>

      {/* --- Negative Behavior Modal --- */}
      <Modal isOpen={!!showNegativeReasons} onClose={() => setShowNegativeReasons(null)} className="max-w-sm rounded-[2rem]">
          <div className="text-center">
              <div className="w-16 h-16 glass-icon rounded-full flex items-center justify-center mx-auto mb-4 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]"><ThumbsDown className="w-8 h-8"/></div>
              <h3 className="font-black text-lg mb-1 text-slate-900 dark:text-white">{showNegativeReasons?.student.name}</h3>
              <p className="text-xs font-bold text-rose-500 mb-6">رصد سلوك سلبي</p>
              
              <div className="grid grid-cols-2 gap-2 mb-4 max-h-[200px] overflow-y-auto custom-scrollbar p-1">
                  {NEGATIVE_BEHAVIORS.map(r => (
                      <button key={r.label} onClick={() => handleAddBehavior(showNegativeReasons!.student, 'negative', r.label, r.points)} className={`p-3 bg-white/5 hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-300 rounded-xl text-xs font-bold border border-white/10 transition-colors text-slate-700 dark:text-white flex justify-between items-center group`}>
                          <span>{r.label}</span>
                          <span className="text-[10px] opacity-50 bg-white/10 px-1.5 rounded-full group-hover:bg-rose-500/20">{r.points}</span>
                      </button>
                  ))}
              </div>

              <div className="pt-4 border-t border-white/10">
                  <p className="text-[10px] font-bold text-slate-400 text-right mb-2">إضافة يدوية:</p>
                  <div className="flex flex-col gap-3">
                      <input 
                        type="text" 
                        placeholder="المخالفة..." 
                        value={customBehaviorReason} 
                        onChange={e => setCustomBehaviorReason(e.target.value)} 
                        className="w-full glass-input rounded-xl px-3 py-3 text-xs font-bold"
                      />
                      <div className="flex gap-2">
                          <input 
                            type="number" 
                            placeholder="-1" 
                            value={customBehaviorPoints} 
                            onChange={e => setCustomBehaviorPoints(e.target.value)} 
                            className="flex-[1] glass-input rounded-xl px-2 py-3 text-xs font-bold text-center"
                          />
                          <button 
                            onClick={() => handleManualBehaviorSubmit('negative', showNegativeReasons!.student)}
                            className="flex-[3] bg-rose-500 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-xs shadow-lg active:scale-95 hover:bg-rose-600 transition-colors"
                          >
                              <Save className="w-4 h-4" /> حفظ
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      </Modal>

      {/* --- Notification Modal (For Truancy) --- */}
      <Modal isOpen={!!notificationTarget} onClose={() => setNotificationTarget(null)} className="max-w-xs rounded-[2rem]">
            <div className="text-center">
                <div className="w-16 h-16 glass-icon rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 shadow-lg shadow-amber-500/10">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="font-black text-lg mb-1 text-slate-900 dark:text-white">إبلاغ ولي الأمر</h3>
                <p className="text-xs text-rose-500 mb-6 font-bold">{notificationTarget?.student.name} - تسرب من الحصة</p>
                
                <div className="space-y-3">
                    <button onClick={() => performNotification('whatsapp')} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all active:scale-95">
                        <MessageCircle className="w-5 h-5" /> واتساب
                    </button>
                    <button onClick={() => performNotification('sms')} className="w-full glass-card hover:bg-white/20 text-slate-700 dark:text-white py-3.5 rounded-xl font-black text-sm transition-all active:scale-95">
                        رسالة نصية (SMS)
                    </button>
                    <button onClick={() => setNotificationTarget(null)} className="text-xs font-bold text-gray-400 mt-2">إلغاء</button>
                </div>
            </div>
      </Modal>

      <Modal isOpen={!!randomStudent || isRandomPicking} onClose={() => { setRandomStudent(null); setIsRandomPicking(false); }} className="max-w-xs">
          <div className="text-center py-6">
               <div className={`w-28 h-28 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl font-black shadow-[0_0_30px_rgba(255,255,255,0.2)] border-4 ${isRandomPicking ? 'bg-transparent text-indigo-400 border-indigo-400/50 animate-spin border-t-transparent' : 'glass-heavy text-slate-900 dark:text-white border-white/30'}`}>
                  {randomStudent?.avatar ? <img src={randomStudent.avatar} className="w-full h-full rounded-full object-cover"/> : randomStudent?.name.charAt(0)}
               </div>
               <h2 className="text-2xl font-black mb-2 text-slate-900 dark:text-white text-glow">{isRandomPicking ? '...' : randomStudent?.name}</h2>
               {!isRandomPicking && <div className="flex gap-2 mt-6 px-4">
                   <button onClick={pickRandomStudent} className="flex-1 py-3 bg-white/10 rounded-xl font-bold text-xs text-slate-600 dark:text-white/70">مرة أخرى</button>
                   <button onClick={() => handleAction(randomStudent!, 'positive')} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.5)]">تعزيز</button>
               </div>}
          </div>
      </Modal>
    </div>
  );
};

export default StudentList;
