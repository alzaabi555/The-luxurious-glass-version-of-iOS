
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Student, BehaviorType } from '../types';
import { Search, ThumbsUp, ThumbsDown, Edit2, Sparkles, Trash2, Plus, Printer, Loader2, MessageCircle, DoorOpen, LayoutGrid, FileSpreadsheet, X, UserPlus, Upload, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import ExcelImport from './ExcelImport';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';

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

const StudentItem = React.memo(({ student, onViewReport, onAction, currentSemester }: { 
    student: Student, onViewReport: (s: Student) => void, onAction: (s: Student, type: 'positive' | 'negative' | 'edit' | 'delete' | 'truant') => void, currentSemester: '1' | '2'
}) => {
    const totalScore = useMemo(() => (student.grades || []).filter(g => !g.semester || g.semester === currentSemester).reduce((sum, g) => sum + (Number(g.score) || 0), 0), [student.grades, currentSemester]);
    const gradeSymbol = useMemo(() => { if (totalScore >= 90) return 'أ'; if (totalScore >= 80) return 'ب'; if (totalScore >= 65) return 'ج'; if (totalScore >= 50) return 'د'; return 'هـ'; }, [totalScore]);
    
    const gradeColor = useMemo(() => { 
        if (totalScore >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'; 
        if (totalScore >= 80) return 'text-blue-400 bg-blue-500/10 border-blue-500/20'; 
        if (totalScore >= 65) return 'text-amber-400 bg-amber-500/10 border-amber-500/20'; 
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20'; 
    }, [totalScore]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 mb-3 glass-card rounded-[1.5rem] cursor-pointer hover:border-white/30 transition-all gap-4 sm:gap-0"
            onClick={() => onViewReport(student)}
        >
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-14 h-14 rounded-2xl glass-icon flex items-center justify-center text-slate-600 dark:text-white/70 text-lg font-bold overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-transform border border-white/20">
                    {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover" /> : student.name.charAt(0)}
                </div>
                <div className="min-w-0">
                    <h3 className="font-black text-slate-900 dark:text-white text-base truncate group-hover:text-glow transition-all">{student.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] glass-icon text-slate-500 dark:text-white/60 px-2.5 py-1 rounded-lg font-bold">{student.classes[0]}</span>
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border ${gradeColor}`}>{gradeSymbol} ({totalScore})</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 pl-1 opacity-90 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    <button onClick={(e) => { e.stopPropagation(); onAction(student, 'positive'); }} className="w-10 h-10 rounded-xl flex items-center justify-center glass-icon text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-90">
                        <ThumbsUp className="w-5 h-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onAction(student, 'negative'); }} className="w-10 h-10 rounded-xl flex items-center justify-center glass-icon text-rose-500 hover:text-rose-400 hover:bg-rose-500/20 transition-all active:scale-90">
                        <ThumbsDown className="w-5 h-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onAction(student, 'truant'); }} className="w-10 h-10 rounded-xl flex items-center justify-center glass-icon text-purple-500 hover:text-purple-400 hover:bg-purple-500/20 transition-all active:scale-90" title="تسرب">
                        <DoorOpen className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block"></div>
                
                <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); onAction(student, 'edit'); }} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 dark:text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onAction(student, 'delete'); }} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 dark:text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}, (prev, next) => prev.student === next.student && prev.currentSemester === next.currentSemester);

const StudentList: React.FC<StudentListProps> = ({ students, classes, onAddClass, onAddStudentManually, onBatchAddStudents, onUpdateStudent, onDeleteStudent, onViewReport, currentSemester }) => {
  const { teacherInfo } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  
  // Modals State
  const [showManualAddModal, setShowManualAddModal] = useState(false);
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
          const today = new Date().toLocaleDateString('en-CA');
          const filteredAttendance = student.attendance.filter(a => a.date !== today);
          const updatedStudent = {
              ...student,
              attendance: [...filteredAttendance, { date: today, status: 'truant' as const }]
          };
          onUpdateStudent(updatedStudent);
          alert(`تم تسجيل ${student.name} كمتسرب لهذا اليوم`);
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

  const exportPDF = async (element: HTMLElement, filename: string, setLoader: (val: boolean) => void) => {
    setLoader(true);
    const opt = {
        margin: 10,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
        try {
            const worker = html2pdf().set(opt).from(element).toPdf();
            if (Capacitor.isNativePlatform()) {
                 const pdfBase64 = await worker.output('datauristring');
                 const base64Data = pdfBase64.split(',')[1];
                 const result = await Filesystem.writeFile({ path: filename, data: base64Data, directory: Directory.Cache });
                 await Share.share({ title: filename, url: result.uri, dialogTitle: 'مشاركة/حفظ' });
            } else {
                 const pdfBlob = await worker.output('blob');
                 const url = URL.createObjectURL(pdfBlob);
                 const link = document.createElement('a');
                 link.href = url; link.download = filename; link.target = "_blank";
                 document.body.appendChild(link); link.click();
                 setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 2000);
            }
        } catch (err) { console.error('PDF Error:', err); } finally { setLoader(false); }
    } else { alert('مكتبة PDF غير جاهزة'); setLoader(false); }
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
                    <th style="border:1px solid #000; padding:5px;">سلوك إيجابي</th>
                    <th style="border:1px solid #000; padding:5px;">سلوك سلبي</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
      `;
      exportPDF(element, `تقرير_شامل_${selectedClass}.pdf`, setIsGeneratingPdf);
  };

  const handleExportExcelReport = async () => { /* Kept same */ };

  // --- CERTIFICATE BATCH PRINTING ---
  const getBase64Image = async (url: string): Promise<string> => {
      try {
          const response = await fetch(url);
          if (!response.ok) return "";
          const blob = await response.blob();
          return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = () => resolve("");
              reader.readAsDataURL(blob);
          });
      } catch (error) { return ""; }
  };

  const handleBatchPrintCertificates = async () => {
      if (filteredStudents.length === 0) return alert('لا يوجد طلاب');
      if (!confirm(`سيتم تجهيز ${filteredStudents.length} شهادة للطباعة. هذا قد يستغرق لحظات.\n\nتأكد من تفعيل خيار "Background graphics" في إعدادات الطباعة لظهور الألوان.`)) return;

      setIsGeneratingPdf(true);
      
      const schoolName = teacherInfo?.school || '...................';
      const teacherName = teacherInfo?.name || '...................';
      const subject = teacherInfo?.subject || '...............';
      const currentYear = new Date().getFullYear();
      const governorate = teacherInfo?.governorate || '.........';
      const emblemSrc = await getBase64Image('oman_logo.png') || await getBase64Image('icon.png');
      const stampSrc = teacherInfo?.stamp || ''; 

      // Construct HTML
      const pagesHtml = filteredStudents.map(student => `
        <div class="cert-body">
            <div class="frame-border"><div class="frame-corner c-tl"></div><div class="frame-corner c-tr"></div><div class="frame-corner c-bl"></div><div class="frame-corner c-br"></div></div>
            <div class="deco-tri tri-1"></div><div class="deco-tri tri-2"></div>
            <div class="content-wrapper">
                <div class="header-container">
                    ${emblemSrc ? `<img src="${emblemSrc}" class="oman-logo" />` : ''}
                    <div class="ministry-info">
                        سلطنة عمان<br/>
                        وزارة التربية والتعليم<br/>
                        المديرية العامة للتربية والتعليم لمحافظة ${governorate}<br/>
                        مدرسة ${schoolName}
                    </div>
                </div>
                <div class="main-title">شهادة تفوق دراسي<div class="title-underline"></div></div>
                <div class="cert-text-block">
                    تتشرف إدارة مدرسة <span class="highlight-data">${schoolName}</span> بمنح الطالب<br/>
                    <span class="highlight-name">${student.name}</span><br/>
                    هذه الشهادة نظير تفوقه وتميزه في مادة <span class="highlight-data">${subject}</span><br/>
                    للصف <span class="highlight-data">${student.classes[0] || '....'}</span> للعام الدراسي <span class="highlight-data">${currentYear} / ${currentYear + 1}</span><br/>
                    <span style="font-size: 18px; color: #666;">متمنين له دوام التوفيق والنجاح</span>
                </div>
                <div class="signatures-row">
                    <div class="sig-box"><div class="sig-title">معلم المادة</div><div class="sig-line">${teacherName}</div></div>
                    <div class="sig-box">
                        <div class="sig-title">مدير المدرسة</div>
                        <div class="sig-line">.........................</div>
                        ${stampSrc ? `<img src="${stampSrc}" class="stamp-img" />` : ''}
                    </div>
                </div>
            </div>
        </div>
      `).join('');

      const printWindow = window.open('', '_blank');
      if (printWindow) {
          printWindow.document.write(`
            <html>
                <head>
                    <title>طباعة الشهادات</title>
                    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        @page { size: A4 landscape; margin: 0; }
                        body { margin: 0; padding: 0; font-family: 'Tajawal', sans-serif; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        
                        .cert-body { 
                            width: 297mm; height: 210mm; position: relative; background: #fff; overflow: hidden; 
                            display: flex; flex-direction: column; align-items: center; box-sizing: border-box; 
                            padding: 10mm; justify-content: space-between; page-break-after: always;
                        }
                        .cert-body:last-child { page-break-after: auto; }

                        /* Design Styles */
                        .frame-border { position: absolute; top: 8mm; left: 8mm; right: 8mm; bottom: 8mm; border: 2px solid #0891b2; border-radius: 10px; z-index: 1; background: transparent; }
                        .frame-corner { position: absolute; width: 40px; height: 40px; z-index: 2; border: 6px solid #f59e0b; }
                        .c-tl { top: -2px; left: -2px; border-right: none; border-bottom: none; border-radius: 10px 0 0 0; }
                        .c-tr { top: -2px; right: -2px; border-left: none; border-bottom: none; border-radius: 0 10px 0 0; }
                        .c-bl { bottom: -2px; left: -2px; border-right: none; border-top: none; border-radius: 0 0 0 10px; }
                        .c-br { bottom: -2px; right: -2px; border-left: none; border-top: none; border-radius: 0 0 10px 0; }
                        .deco-tri { position: absolute; width: 0; height: 0; opacity: 0.1; z-index: 0; }
                        .tri-1 { top: 0; left: 0; border-top: 180px solid #0891b2; border-right: 180px solid transparent; }
                        .tri-2 { bottom: 0; right: 0; border-bottom: 180px solid #0891b2; border-left: 180px solid transparent; }
                        
                        .content-wrapper { position: relative; width: 100%; height: 100%; z-index: 10; display: flex; flex-direction: column; align-items: center; }
                        .header-container { text-align: center; margin-bottom: 5px; width: 100%; }
                        .oman-logo { height: 70px; width: auto; margin-bottom: 5px; }
                        .ministry-info { font-family: 'Tajawal', sans-serif; font-size: 14px; color: #444; line-height: 1.4; font-weight: bold; }
                        .main-title { font-family: 'Aref Ruqaa', serif; font-size: 50px; color: #1e293b; margin: 5px 0 20px 0; position: relative; }
                        .title-underline { width: 120px; height: 3px; background: #f59e0b; margin: 0 auto; border-radius: 2px; }
                        .cert-text-block { font-family: 'Amiri', serif; font-size: 24px; text-align: center; line-height: 2; color: #1f2937; width: 90%; margin-top: 10px; flex-grow: 1; }
                        .highlight-name { color: #0e7490; font-weight: bold; font-size: 34px; padding: 0 10px; display: inline-block; }
                        .highlight-data { color: #b45309; font-weight: bold; padding: 0 5px; }
                        .signatures-row { width: 100%; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 60px 20px 60px; margin-top: auto; }
                        .sig-box { text-align: center; width: 250px; position: relative; }
                        .sig-title { font-family: 'Tajawal', sans-serif; font-size: 18px; font-weight: bold; color: #64748b; margin-bottom: 30px; }
                        .sig-line { font-family: 'Amiri', serif; font-size: 20px; font-weight: bold; color: #000; border-top: 1px solid #cbd5e1; padding-top: 5px; display: block; }
                        
                        /* Stamp CSS Logic */
                        .stamp-img { 
                            position: absolute; 
                            top: -20px; 
                            left: 40px; 
                            width: 110px; 
                            height: auto; 
                            opacity: 0.85; 
                            transform: rotate(-10deg); 
                            mix-blend-mode: multiply; 
                            z-index: 5;
                        }
                    </style>
                </head>
                <body dir="rtl">
                    ${pagesHtml}
                    <script>
                        // Wait for images to load before print
                        window.onload = function() {
                            setTimeout(function(){
                                window.print();
                            }, 500);
                        };
                    </script>
                </body>
            </html>
          `);
          printWindow.document.close();
      }
      setIsGeneratingPdf(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] text-slate-900 dark:text-white pb-20">
        
        {/* Header */}
        <div className="glass-heavy border-b border-white/20 shadow-sm backdrop-blur-xl rounded-[0_0_2rem_2rem] mb-4 shrink-0">
            <div className="p-4 pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white">قائمة الطلاب</h1>
                    <div className="flex gap-2">
                        <button onClick={() => setShowManualAddModal(true)} className="w-10 h-10 rounded-full glass-icon text-indigo-600 dark:text-indigo-400 active:scale-95 transition-transform" title="إضافة طالب">
                            <UserPlus className="w-5 h-5"/>
                        </button>
                        <button onClick={() => setShowImportModal(true)} className="w-10 h-10 rounded-full glass-icon text-emerald-600 dark:text-emerald-400 active:scale-95 transition-transform" title="استيراد Excel">
                            <Upload className="w-5 h-5"/>
                        </button>
                        <button onClick={handleBatchPrintCertificates} disabled={isGeneratingPdf} className="w-10 h-10 rounded-full glass-icon text-amber-600 dark:text-amber-400 active:scale-95 transition-transform" title="طباعة شهادات جماعية">
                            {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin"/> : <Printer className="w-5 h-5"/>}
                        </button>
                        <button onClick={pickRandomStudent} className="w-10 h-10 rounded-full glass-icon text-purple-600 dark:text-purple-400 active:scale-95 transition-transform" title="اختيار عشوائي">
                            <Sparkles className="w-5 h-5"/>
                        </button>
                        <button onClick={handlePrintPdfReport} disabled={isGeneratingPdf} className="w-10 h-10 rounded-full glass-icon text-blue-600 dark:text-blue-400 active:scale-95 transition-transform" title="تقرير شامل">
                            <FileSpreadsheet className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 max-w-[65%]">
                        <button onClick={() => setSelectedClass('all')} className={`px-4 py-2 text-xs font-bold whitespace-nowrap transition-all rounded-xl border ${selectedClass === 'all' ? 'bg-indigo-600 text-white border-transparent' : 'glass-card border-white/20'}`}>الكل</button>
                        {classes.map(c => (
                            <button key={c} onClick={() => setSelectedClass(c)} className={`px-4 py-2 text-xs font-bold whitespace-nowrap transition-all rounded-xl border ${selectedClass === c ? 'bg-indigo-600 text-white border-transparent' : 'glass-card border-white/20'}`}>{c}</button>
                        ))}
                        <button onClick={() => setShowAddClassModal(true)} className="px-3 py-2 rounded-xl glass-card border border-white/20 hover:bg-white/10"><Plus className="w-4 h-4"/></button>
                    </div>
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="بحث..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full glass-input rounded-xl py-2 pr-9 pl-3 text-xs font-bold outline-none border border-white/10 focus:border-indigo-500" 
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Student List Content */}
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
            {filteredStudents.length > 0 ? (
                <div className="flex flex-col gap-3">
                    {filteredStudents.map(student => (
                        <StudentItem 
                            key={student.id} 
                            student={student} 
                            onViewReport={onViewReport} 
                            onAction={handleAction} 
                            currentSemester={currentSemester}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <LayoutGrid className="w-16 h-16 text-slate-400 mb-4" />
                    <p className="text-sm font-bold text-slate-500 dark:text-white/60">لا يوجد طلاب مطابقين</p>
                </div>
            )}
        </div>

        {/* --- MODALS --- */}

        {/* 1. Add Student Modal */}
        <Modal isOpen={showManualAddModal} onClose={() => { setShowManualAddModal(false); setEditingStudent(null); setEditName(''); setEditPhone(''); setEditClass(''); }}>
            <div className="text-center">
                <h3 className="font-black text-xl mb-4 text-slate-900 dark:text-white">{editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</h3>
                <div className="space-y-3">
                    <input className="w-full p-3 glass-input rounded-xl font-bold text-sm outline-none" placeholder="اسم الطالب" value={editName} onChange={e => setEditName(e.target.value)} />
                    <input className="w-full p-3 glass-input rounded-xl font-bold text-sm outline-none" placeholder="الصف (مثال: 5/1)" value={editClass} onChange={e => setEditClass(e.target.value)} />
                    <input className="w-full p-3 glass-input rounded-xl font-bold text-sm outline-none" placeholder="رقم ولي الأمر (اختياري)" value={editPhone} onChange={e => setEditPhone(e.target.value)} type="tel" />
                    <button onClick={handleSaveStudent} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-500/30">حفظ</button>
                </div>
            </div>
        </Modal>

        {/* 2. Import Excel Modal */}
        <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} className="max-w-md rounded-[2rem]">
            <ExcelImport existingClasses={classes} onImport={(s) => { onBatchAddStudents(s); setShowImportModal(false); }} onAddClass={onAddClass} />
        </Modal>

        {/* 3. Add Class Modal */}
        <Modal isOpen={showAddClassModal} onClose={() => setShowAddClassModal(false)} className="max-w-xs rounded-[2rem]">
            <div className="text-center">
                <h3 className="font-black text-lg mb-4 text-slate-900 dark:text-white">إضافة فصل جديد</h3>
                <input autoFocus className="w-full p-3 glass-input rounded-xl font-bold text-sm mb-4 outline-none" placeholder="اسم الفصل" value={newClassInput} onChange={e => setNewClassInput(e.target.value)} />
                <button onClick={() => { if(newClassInput.trim()) { onAddClass(newClassInput.trim()); setNewClassInput(''); setShowAddClassModal(false); } }} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-sm">إضافة</button>
            </div>
        </Modal>

        {/* 4. Random Picker Modal */}
        <Modal isOpen={isRandomPicking || !!randomStudent} onClose={() => { setRandomStudent(null); setIsRandomPicking(false); }} className="max-w-xs rounded-[2.5rem]">
            <div className="text-center py-6">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full glass-icon border-4 border-indigo-500 shadow-xl overflow-hidden relative">
                    {randomStudent ? (
                        randomStudent.avatar ? <img src={randomStudent.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-black text-indigo-500">{randomStudent.name.charAt(0)}</div>
                    ) : (
                        <Sparkles className="w-10 h-10 text-indigo-400 animate-spin" />
                    )}
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 min-h-[2rem]">
                    {randomStudent ? randomStudent.name : 'جاري الاختيار...'}
                </h3>
                {randomStudent && <p className="text-sm font-bold text-slate-500 dark:text-white/60 mb-6">{randomStudent.classes[0]}</p>}
                
                {randomStudent && (
                    <button onClick={() => { setRandomStudent(null); pickRandomStudent(); }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-500/30 w-full">
                        اختيار آخر
                    </button>
                )}
            </div>
        </Modal>

        {/* 5. Behavior Reasons Modals */}
        <Modal isOpen={!!showPositiveReasons} onClose={() => setShowPositiveReasons(null)} className="max-w-xs rounded-[2rem]">
            <div className="text-center">
                <h3 className="font-black text-lg mb-4 text-emerald-600 dark:text-emerald-400">سلوك إيجابي</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {['مشاركة مميزة', 'واجب منزلي', 'نظافة', 'تعاون', 'إجابة نموذجية', 'هدوء'].map(r => (
                        <button key={r} onClick={() => { if(showPositiveReasons) handleAddBehavior(showPositiveReasons.student, 'positive', r, 1); }} className="p-2 glass-card text-xs font-bold hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">{r}</button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input placeholder="سبب آخر..." value={customBehaviorReason} onChange={e => setCustomBehaviorReason(e.target.value)} className="flex-1 p-2 glass-input rounded-lg text-xs font-bold" />
                    <button onClick={() => { if(showPositiveReasons) handleManualBehaviorSubmit('positive', showPositiveReasons.student); }} className="p-2 bg-emerald-600 text-white rounded-lg"><Plus className="w-4 h-4"/></button>
                </div>
            </div>
        </Modal>

        <Modal isOpen={!!showNegativeReasons} onClose={() => setShowNegativeReasons(null)} className="max-w-xs rounded-[2rem]">
            <div className="text-center">
                <h3 className="font-black text-lg mb-4 text-rose-600 dark:text-rose-400">سلوك سلبي</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {['إزعاج', 'نسيان كتاب', 'نوم', 'تأخر', 'ألفاظ', 'شجار'].map(r => (
                        <button key={r} onClick={() => { if(showNegativeReasons) handleAddBehavior(showNegativeReasons.student, 'negative', r, -1); }} className="p-2 glass-card text-xs font-bold hover:bg-rose-500/20 transition-colors border border-rose-500/20">{r}</button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input placeholder="سبب آخر..." value={customBehaviorReason} onChange={e => setCustomBehaviorReason(e.target.value)} className="flex-1 p-2 glass-input rounded-lg text-xs font-bold" />
                    <button onClick={() => { if(showNegativeReasons) handleManualBehaviorSubmit('negative', showNegativeReasons.student); }} className="p-2 bg-rose-600 text-white rounded-lg"><Plus className="w-4 h-4"/></button>
                </div>
            </div>
        </Modal>

    </div>
  );
};

export default StudentList;
