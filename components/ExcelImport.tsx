import React, { useState } from 'react';
import { Student } from '../types';
import { FileUp, CheckCircle2, FileSpreadsheet, Loader2, Info, LayoutGrid, Check, Plus } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelImportProps {
  existingClasses: string[];
  onImport: (students: Student[]) => void;
  onAddClass: (name: string) => void;
}

const ExcelImport: React.FC<ExcelImportProps> = ({ existingClasses, onImport, onAddClass }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [targetClass, setTargetClass] = useState<string>('');
  const [newClassInput, setNewClassInput] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // GLASSMORPHISM STYLES
  const styles = {
      card: 'glass-card border border-white/50 shadow-glass backdrop-blur-md p-6 rounded-[2rem]',
      input: 'w-full bg-white/50 border border-white/40 rounded-2xl py-4 px-4 text-sm font-bold focus:bg-white focus:border-primary/50 outline-none transition-all placeholder:text-gray-400 shadow-inner',
      gridButton: 'p-3 rounded-xl text-[10px] font-black transition-all border flex items-center justify-between shadow-sm',
      uploadZone: 'relative flex flex-col items-center text-center p-8 rounded-[2rem] border-2 border-dashed transition-all overflow-hidden',
  };

  const cleanHeader = (header: string): string => {
      if (!header) return '';
      return String(header).trim().replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase();
  };

  const cleanPhoneNumber = (raw: any): string => {
      if (!raw) return '';
      const str = String(raw).trim();
      return str.replace(/[^0-9+]/g, '');
  };

  const looksLikeAPhoneNumber = (val: string): boolean => {
      const clean = cleanPhoneNumber(val);
      return /^\+?\d{7,15}$/.test(clean);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const finalTargetClass = isCreatingNew ? newClassInput.trim() : targetClass;
    if (!finalTargetClass) {
        alert('الرجاء اختيار فصل أو كتابة اسم فصل جديد قبل استيراد الملف');
        if (e.target) e.target.value = '';
        return;
    }
    
    setIsImporting(true);
    setImportStatus('idle');
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false }) as any[];

      if (jsonData.length === 0) throw new Error('الملف فارغ');

      if (isCreatingNew && finalTargetClass) {
          onAddClass(finalTargetClass);
      }

      const headers = Object.keys(jsonData[0]);
      
      const nameKeywords = ['الاسم', 'اسم الطالب', 'اسم', 'name', 'student', 'full name', 'المتعلم'];
      const phoneKeywords = ['جوال', 'هاتف', 'phone', 'mobile', 'contact', 'تواصل', 'ولي', 'parent', 'رقم', 'cell'];
      const gradeKeywords = ['الصف', 'صف', 'grade', 'level', 'المرحلة'];

      let nameKey = headers.find(h => nameKeywords.some(kw => cleanHeader(h).includes(kw)));
      let phoneKey = headers.find(h => phoneKeywords.some(kw => cleanHeader(h).includes(kw)));
      const gradeKey = headers.find(h => gradeKeywords.some(kw => cleanHeader(h).includes(kw)));

      if (!nameKey) nameKey = headers[0];

      if (!phoneKey) {
          for (const header of headers) {
              if (header === nameKey) continue;
              let matchCount = 0;
              let checkLimit = Math.min(jsonData.length, 10);
              for (let i = 0; i < checkLimit; i++) {
                  if (looksLikeAPhoneNumber(jsonData[i][header])) matchCount++;
              }
              if (matchCount >= checkLimit * 0.3) {
                  phoneKey = header;
                  break;
              }
          }
          if (!phoneKey && nameKey) {
              const nameIndex = headers.indexOf(nameKey);
              if (nameIndex !== -1 && nameIndex + 1 < headers.length) {
                  phoneKey = headers[nameIndex + 1];
              }
          }
      }

      const mappedStudents: Student[] = jsonData
        .map((row, idx): Student | null => {
          const studentName = String(row[nameKey!] || '').trim();
          let parentPhone = '';
          if (phoneKey) parentPhone = cleanPhoneNumber(row[phoneKey]);
          if (!studentName || nameKeywords.includes(cleanHeader(studentName))) return null;

          return {
            id: Math.random().toString(36).substr(2, 9),
            name: studentName,
            grade: gradeKey ? String(row[gradeKey]).trim() : '',
            classes: [finalTargetClass],
            attendance: [],
            behaviors: [],
            grades: [],
            parentPhone: parentPhone
          };
        })
        .filter((student): student is Student => student !== null);

      if (mappedStudents.length === 0) {
        alert('لم يتم العثور على بيانات صالحة. تأكد من صحة الملف.');
        setImportStatus('error');
        return;
      }

      onImport(mappedStudents);
      setImportStatus('success');
      setTimeout(() => setImportStatus('idle'), 3000);
      setNewClassInput('');
      setTargetClass('');
    } catch (error) {
      console.error(error);
      setImportStatus('error');
      alert('حدث خطأ أثناء قراءة الملف. تأكد من أن الملف سليم.');
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  const isReady = isCreatingNew ? newClassInput.length > 0 : targetClass.length > 0;

  return (
    <div className="space-y-6 pb-20 text-slate-800 dark:text-white">
      
      {/* Class Selection Card */}
      <div className={styles.card}>
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-primary" />
                توزيع الطلاب على فصل
            </h3>
            <button 
                onClick={() => {
                    setIsCreatingNew(!isCreatingNew);
                    setTargetClass('');
                    setNewClassInput('');
                }}
                className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full active:scale-95 transition-all hover:bg-primary/20 flex items-center gap-1"
            >
                {isCreatingNew ? 'اختر من القائمة' : <><Plus className="w-3 h-3" /> فصل جديد</>}
            </button>
        </div>

        {isCreatingNew ? (
            <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                <input 
                  type="text" 
                  placeholder="اكتب اسم الفصل الجديد (مثال: 4/ب)" 
                  className={styles.input}
                  value={newClassInput}
                  onChange={(e) => setNewClassInput(e.target.value)}
                  autoFocus
                />
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {existingClasses.length > 0 ? existingClasses.map(cls => (
                    <button
                        key={cls}
                        onClick={() => setTargetClass(cls)}
                        className={`${styles.gridButton} ${targetClass === cls ? 'bg-primary text-white border-primary shadow-md' : 'bg-white/40 text-slate-600 border-white/40 hover:bg-white/60'}`}
                    >
                        {cls}
                        {targetClass === cls && <Check className="w-3 h-3" />}
                    </button>
                )) : <p className="col-span-2 text-center text-[10px] text-slate-400 py-4">لا توجد فصول حالياً، قم بإنشاء فصل جديد.</p>}
            </div>
        )}
      </div>

      {/* Upload Zone Card */}
      <div className={`glass-card ${styles.uploadZone} ${isReady ? 'border-primary/50 bg-blue-50/30' : 'border-gray-300/30 bg-white/20'}`}>
        {/* Glow Effect if Ready */}
        {isReady && <div className="absolute inset-0 bg-primary/5 blur-xl"></div>}

        <div className={`w-20 h-20 rounded-3xl shadow-inner flex items-center justify-center mb-4 relative z-10 border transition-all duration-500 ${isReady ? 'bg-white text-primary border-white' : 'bg-white/30 text-slate-400 border-white/20'}`}>
          {isImporting ? <Loader2 className="w-8 h-8 animate-spin" /> : <FileSpreadsheet className="w-8 h-8" />}
        </div>
        
        <h3 className="text-lg font-black mb-1 text-slate-800 dark:text-white relative z-10">
            {isImporting ? 'جاري المعالجة...' : 'ارفع ملف الإكسل'}
        </h3>
        <p className="text-xs text-slate-500 mb-6 px-4 relative z-10 font-bold max-w-xs">
            {isReady
                ? `سيتم استيراد الطلاب إلى فصل: ${isCreatingNew ? newClassInput : targetClass}`
                : 'يجب اختيار الفصل أو إنشاء فصل جديد لتفعيل الزر'}
        </p>
        
        <label className={`w-full max-w-[240px] relative z-10 ${!isReady ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            onChange={handleFileChange} 
            disabled={isImporting || !isReady} 
          />
          <div className={`w-full py-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${!isReady ? 'bg-gray-200 text-gray-500 shadow-none' : 'bg-primary text-white shadow-primary/30 active:scale-95 hover:bg-blue-700'}`}>
            <FileUp className="w-4 h-4" /> {isReady ? 'اختر الملف الآن' : 'بانتظار اختيار الفصل'}
          </div>
        </label>
      </div>

      {/* Status Notifications */}
      {importStatus === 'success' && (
        <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 p-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 border border-emerald-500/20 backdrop-blur-md">
          <div className="bg-emerald-500 text-white p-1 rounded-full shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-black block leading-none">تم الاستيراد بنجاح!</span>
            <span className="text-[10px] opacity-80">تمت إضافة الطلاب إلى القائمة.</span>
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="p-4 bg-amber-50/50 dark:bg-amber-500/10 rounded-2xl border border-amber-200/50 backdrop-blur-sm">
          <div className="flex gap-3 items-start">
              <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[10px] text-amber-800 dark:text-amber-100 font-bold leading-relaxed">
                  <p>تم تحديث النظام ليدعم الأرقام العمانية والدولية تلقائياً.</p>
                  <ul className="list-disc list-inside mt-1 opacity-80">
                      <li>يتم نسخ الرقم كما هو دون تعديل.</li>
                      <li>إذا لم يتم العثور على عمود "هاتف"، سيحاول النظام استكشافه ذاتياً.</li>
                  </ul>
              </div>
          </div>
      </div>
    </div>
  );
};

export default ExcelImport;