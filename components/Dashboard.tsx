import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, ScheduleDay, PeriodTime } from '../types';
import { PieChart, Pie, Cell } from 'recharts';
import { Award, AlertCircle, Sun, Moon, Coffee, Calendar, Edit2, X, Clock, ArrowRight, FileSpreadsheet, Loader2, Settings, ChevronLeft, CalendarCheck, Timer, BellRing, Bell, BellOff, School, MapPin, Building2, UserCircle2, Camera, BookOpen } from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import Modal from './Modal';
import { useTheme } from '../context/ThemeContext';

interface DashboardProps {
  students: Student[];
  teacherInfo: { name: string; school: string; subject: string; governorate: string; avatar?: string };
  onUpdateTeacherInfo: (info: { name: string; school: string; subject: string; governorate: string; avatar?: string }) => void;
  schedule: ScheduleDay[];
  onUpdateSchedule: (newSchedule: ScheduleDay[]) => void;
  onSelectStudent: (s: Student) => void;
  onNavigate: (tab: string) => void;
  onOpenSettings: () => void;
  periodTimes: PeriodTime[];
  setPeriodTimes: React.Dispatch<React.SetStateAction<PeriodTime[]>>;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
}

const OMAN_GOVERNORATES = ["مسقط", "ظفار", "مسندم", "البريمي", "الداخلية", "شمال الباطنة", "جنوب الباطنة", "جنوب الشرقية", "شمال الشرقية", "الظاهرة", "الوسطى"];

const Dashboard: React.FC<DashboardProps> = ({ 
    students = [], 
    teacherInfo, 
    onUpdateTeacherInfo, 
    schedule, 
    onUpdateSchedule, 
    onSelectStudent, 
    onNavigate, 
    onOpenSettings, 
    periodTimes, 
    setPeriodTimes,
    notificationsEnabled,
    onToggleNotifications
}) => {
  const { theme, isLowPower } = useTheme();
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [isImportingSchedule, setIsImportingSchedule] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [editName, setEditName] = useState(teacherInfo.name);
  const [editSchool, setEditSchool] = useState(teacherInfo.school);
  const [editSubject, setEditSubject] = useState(teacherInfo.subject);
  const [editGovernorate, setEditGovernorate] = useState(teacherInfo.governorate);
  const [editAvatar, setEditAvatar] = useState(teacherInfo.avatar || '');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update clock every minute
  useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 60000);
      return () => clearInterval(timer);
  }, []);

  // --- GLASSMORPHISM STYLES ---
  const getCardStyle = () => {
      // Use the global CSS class for consistency
      return `glass-card border border-white/50 shadow-glass`;
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صباح الخير" : hour < 17 ? "طاب يومك" : "مساء الخير";
  const GreetingIcon = hour < 12 ? Sun : hour < 17 ? Coffee : Moon;
  
  const today = new Date().toLocaleDateString('en-CA');
  
  const attendanceToday = useMemo(() => {
    return students.reduce((acc, s) => {
        if (!s.attendance) return acc;
        const record = s.attendance.find(a => a.date === today);
        if (record?.status === 'present') acc.present++;
        else if (record?.status === 'absent') acc.absent++;
        return acc;
    }, { present: 0, absent: 0 });
  }, [students, today]);

  const behaviorStats = useMemo(() => {
    return students.reduce((acc, s) => {
        (s.behaviors || []).forEach(b => {
        if (b.type === 'positive') acc.positive++;
        else acc.negative++; 
        });
        return acc;
    }, { positive: 0, negative: 0 });
  }, [students]);

  const pieData = useMemo(() => {
      const hasData = attendanceToday.present > 0 || attendanceToday.absent > 0;
      return hasData 
        ? [{ name: 'حاضر', value: attendanceToday.present }, { name: 'غائب', value: attendanceToday.absent }]
        : [{ name: 'لا توجد بيانات', value: 1 }];
  }, [attendanceToday]);

  const daysMap = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const todayName = daysMap[new Date().getDay()];
  const todaySchedule = schedule.find(s => s.dayName === todayName);

  const parseTime = (timeStr: string) => {
      if (!timeStr) return null;
      const [h, m] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(h, m, 0, 0);
      return date;
  };

  const getPeriodStatus = (startTime: string, endTime: string) => {
      const start = parseTime(startTime);
      const end = parseTime(endTime);
      const now = new Date(); 

      if (!start || !end) return 'unknown';
      if (now > end) return 'past';
      if (now >= start && now <= end) return 'active';
      return 'future';
  };

  const activePeriodIndex = useMemo(() => {
      return periodTimes.findIndex(pt => getPeriodStatus(pt.startTime, pt.endTime) === 'active');
  }, [periodTimes, currentTime]);

  const handlePeriodChange = (dayIdx: number, periodIdx: number, val: string) => {
    const updatedSchedule = [...schedule];
    updatedSchedule[dayIdx].periods = [...updatedSchedule[dayIdx].periods];
    updatedSchedule[dayIdx].periods[periodIdx] = val;
    onUpdateSchedule(updatedSchedule);
  };

  const handleTimeChange = (periodIndex: number, field: 'startTime' | 'endTime', value: string) => {
      const updated = [...periodTimes];
      updated[periodIndex] = { ...updated[periodIndex], [field]: value };
      setPeriodTimes(updated);
  };

  const handleSaveInfo = () => {
      onUpdateTeacherInfo({ name: editName, school: editSchool, subject: editSubject, governorate: editGovernorate, avatar: editAvatar });
      setIsEditingInfo(false);
  };

  const openInfoEditor = () => {
      setEditName(teacherInfo.name); setEditSchool(teacherInfo.school); setEditSubject(teacherInfo.subject); setEditGovernorate(teacherInfo.governorate); setEditAvatar(teacherInfo.avatar || ''); setIsEditingInfo(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setEditAvatar(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleImportSchedule = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImportingSchedule(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      const newSchedule = [...schedule];
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
      rawData.forEach(row => {
          const firstCell = String(row[0] || '').trim();
          const dayIndex = days.findIndex(d => firstCell.includes(d));
          if (dayIndex !== -1) newSchedule[dayIndex].periods = row.slice(1, 9).map(cell => String(cell || ''));
      });
      onUpdateSchedule(newSchedule);
      alert('تم الاستيراد');
    } catch (error) { alert('خطأ في الاستيراد'); } finally { setIsImportingSchedule(false); if (e.target) e.target.value = ''; }
  };

  return (
    <div className="space-y-4 pb-24 md:pb-8">
      
      {/* IDENTITY CARD (Glass Effect) */}
      <div className={`relative w-full rounded-[2rem] overflow-hidden shadow-lg transition-all group border border-white/20`}>
        {/* Glass Background Layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-blue-900/80 backdrop-blur-md"></div>
        <div className="absolute top-[-50%] left-[-20%] w-[120%] h-[120%] bg-blue-500/30 rounded-full blur-[80px] animate-pulse"></div>

        {/* Content */}
        <div className="relative z-10 p-6 flex flex-col justify-between h-auto min-h-[220px]">
            <div className="flex items-start gap-5">
                <div 
                    onClick={openInfoEditor}
                    className="w-16 h-16 rounded-full bg-white/10 border border-white/30 flex items-center justify-center shrink-0 shadow-lg cursor-pointer hover:scale-105 transition-transform overflow-hidden relative backdrop-blur-sm"
                >
                    {teacherInfo.avatar ? (
                        <img src={teacherInfo.avatar} alt="Teacher" className="w-full h-full object-cover" />
                    ) : (
                        <UserCircle2 className="w-10 h-10 text-white/80" strokeWidth={1.5} />
                    )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center pt-1">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-yellow-300 flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
                            <GreetingIcon className="w-3 h-3" /> {greeting}
                        </span>
                    </div>
                    
                    <h1 className="text-xl font-black text-white tracking-wide truncate leading-tight mb-2 drop-shadow-sm">
                        {teacherInfo?.name || 'المعلم'}
                    </h1>
                    
                    <div className="flex items-center gap-2 text-indigo-100 text-xs font-bold truncate mb-1.5 opacity-90">
                        <School className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{teacherInfo?.school || 'المدرسة'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-emerald-100 text-xs font-bold truncate opacity-90">
                        <BookOpen className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{teacherInfo?.subject || 'المادة الدراسية'}</span>
                    </div>
                </div>

                <button 
                    onClick={openInfoEditor} 
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white border border-white/20 transition-all self-start active:scale-95 backdrop-blur-sm"
                >
                    <Edit2 className="w-4 h-4 opacity-90" />
                </button>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-white/60 shrink-0" />
                <p className="text-[10px] font-bold text-white/70 leading-none truncate tracking-wide">
                    {teacherInfo?.governorate 
                        ? `المديرية العامة للتربية والتعليم لمحافظة ${teacherInfo.governorate}`
                        : 'وزارة التربية والتعليم'}
                </p>
            </div>
        </div>
      </div>

      {/* Action Button */}
      <button onClick={() => onNavigate('attendance')} className="w-full bg-gradient-to-r from-primary to-blue-600 p-0.5 shadow-lg shadow-primary/30 rounded-[1.5rem] active:scale-[0.99] transition-transform">
            <div className="bg-transparent px-5 py-3 flex items-center justify-between rounded-[1.4rem]">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm border border-white/20"><CalendarCheck className="w-5 h-5" /></div>
                    <span className="font-bold text-sm text-white">تسجيل الحضور</span>
                </div>
                <div className="bg-white/20 px-4 py-1.5 rounded-xl text-[10px] font-black text-white flex items-center gap-1 backdrop-blur-sm border border-white/20">ابدأ <ChevronLeft className="w-3 h-3" /></div>
            </div>
      </button>

      {/* Schedule - Glass Style */}
      <div className={`${getCardStyle()} p-4 relative overflow-hidden`}>
         {activePeriodIndex !== -1 && (
             <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse opacity-50"></div>
         )}

         <div className="flex justify-between items-center mb-4">
           <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-sm">
               <Calendar className={`w-4 h-4 ${activePeriodIndex !== -1 ? 'text-emerald-500 animate-pulse' : 'text-primary'}`} /> 
               {activePeriodIndex !== -1 ? <span className="text-emerald-600">الحصة {activePeriodIndex + 1} جارية الآن</span> : `جدول ${todayName}`}
           </h3>
           <div className="flex gap-2">
               <button onClick={onToggleNotifications} className={`p-2 rounded-xl transition-colors ${notificationsEnabled ? 'bg-indigo-50/50 text-indigo-600' : 'bg-gray-100/50 text-gray-400'}`}>
                   {notificationsEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
               </button>
               <button onClick={() => setShowTimeSettings(true)} className="p-2 bg-amber-50/50 text-amber-600 rounded-xl hover:bg-amber-100/50 transition-colors"><Clock className="w-3.5 h-3.5"/></button>
               <button onClick={() => setIsEditingSchedule(true)} className="p-2 bg-indigo-50/50 text-indigo-600 rounded-xl hover:bg-indigo-100/50 transition-colors"><Edit2 className="w-3.5 h-3.5"/></button>
           </div>
         </div>
         
         {todaySchedule ? (
           <div className="grid grid-cols-4 gap-2">
                {todaySchedule.periods.slice(0, 8).map((p, idx) => {
                   const status = getPeriodStatus(periodTimes[idx]?.startTime, periodTimes[idx]?.endTime);
                   const isPast = status === 'past';
                   const isActive = status === 'active';
                   
                   return (
                       <div key={idx} className={`relative flex flex-col items-center justify-between p-2 rounded-xl border h-[75px] transition-all duration-300
                           ${isActive 
                               ? 'bg-emerald-50/80 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)] scale-105 z-10 backdrop-blur-md' 
                               : isPast 
                                   ? 'bg-gray-50/30 border-transparent opacity-60 grayscale' 
                                   : 'bg-white/40 border-white/50 hover:bg-white/60'
                           }
                           ${!p ? 'opacity-40' : ''}
                       `}>
                          
                          {isActive && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-bounce shadow-sm z-20"></div>
                          )}

                          <span className={`text-[8px] font-black w-full text-right ${isActive ? 'text-emerald-700' : 'opacity-50 text-slate-500'}`}>#{idx + 1}</span>
                          
                          <span className={`text-[10px] font-black text-center truncate w-full ${isActive ? 'text-emerald-900 text-xs' : p ? 'text-slate-700' : 'opacity-30'}`}>
                              {p || '-'}
                          </span>
                          
                          <div className={`w-full text-left flex items-center justify-end gap-1 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {isActive && <Timer className="w-3 h-3 animate-pulse" />}
                              <span className="text-[8px] font-bold">{periodTimes[idx]?.startTime || ''}</span>
                          </div>
                       </div>
                   );
                })}
           </div>
         ) : <p className="text-center text-xs opacity-50 py-4">لا يوجد جدول</p>}
      </div>

      {/* Stats - Glass Style */}
      <div className="grid grid-cols-2 gap-3">
          <div className={`${getCardStyle()} p-4 flex flex-col items-center justify-center min-h-[140px]`}>
               <h3 className="font-black text-slate-800 text-xs mb-2 w-full text-right">الحضور اليوم</h3>
               <div className="relative w-16 h-16">
                    <PieChart width={64} height={64}>
                        <Pie data={pieData} cx={32} cy={32} innerRadius={20} outerRadius={32} paddingAngle={0} dataKey="value" stroke="none">
                            {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={['#10b981', '#f43f5e'][index % 2] || '#e2e8f0'} />)}
                        </Pie>
                    </PieChart>
               </div>
               <div className="flex gap-3 mt-2 text-[9px] font-bold text-slate-600">
                   <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> حاضر: {attendanceToday.present}</span>
                   <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> غائب: {attendanceToday.absent}</span>
               </div>
          </div>

          <div className={`${getCardStyle()} p-4 flex flex-col justify-between`}>
              <h3 className="font-black text-slate-800 text-xs w-full text-right mb-2">السلوك</h3>
              <div className="space-y-2">
                  <div className="bg-emerald-50/50 border border-emerald-100/50 p-2 rounded-xl flex justify-between items-center"><span className="text-[10px] font-bold text-emerald-600">إيجابي</span><span className="text-sm font-black text-emerald-600">+{behaviorStats.positive}</span></div>
                  <div className="bg-rose-50/50 border border-rose-100/50 p-2 rounded-xl flex justify-between items-center"><span className="text-[10px] font-bold text-rose-600">سلبي</span><span className="text-sm font-black text-rose-600">-{behaviorStats.negative}</span></div>
              </div>
          </div>
      </div>

      {/* Modals - Glass Style */}
      <Modal isOpen={isEditingSchedule} onClose={() => setIsEditingSchedule(false)} className="glass-card">
         <div className="flex justify-between mb-4"><h3 className="font-black text-sm text-slate-800">الجدول</h3><button onClick={() => setIsEditingSchedule(false)} className="bg-gray-100 rounded-full p-1"><X className="w-4 h-4 text-gray-500"/></button></div>
         <div className="flex gap-2 overflow-x-auto pb-2">{daysMap.slice(0, 5).map((d, i) => <button key={d} onClick={() => setActiveDayIndex(i)} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeDayIndex === i ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>{d}</button>)}</div>
         <div className="space-y-2 max-h-[40vh] overflow-y-auto custom-scrollbar">{Array.from({length:8}).map((_, i) => <input key={i} type="text" className="w-full p-2 bg-white/50 border border-white/50 rounded-lg text-xs font-bold focus:bg-white transition-colors" placeholder={`حصة ${i+1}`} value={schedule[activeDayIndex]?.periods[i] || ''} onChange={e => handlePeriodChange(activeDayIndex, i, e.target.value)} />)}</div>
         <div className="mt-4"><label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-slate-600 hover:text-primary"><FileSpreadsheet className="w-4 h-4"/> استيراد Excel <input type="file" className="hidden" onChange={handleImportSchedule}/></label></div>
      </Modal>

      <Modal isOpen={showTimeSettings} onClose={() => setShowTimeSettings(false)} className="glass-card">
         <div className="flex justify-between mb-4"><h3 className="font-black text-sm text-slate-800">التوقيت</h3><button onClick={() => setShowTimeSettings(false)} className="bg-gray-100 rounded-full p-1"><X className="w-4 h-4 text-gray-500"/></button></div>
         <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">{periodTimes.map((pt, i) => <div key={i} className="flex gap-2 items-center text-xs text-slate-600"><span className="w-4 font-bold">{pt.periodNumber}</span><input type="time" value={pt.startTime} onChange={e => handleTimeChange(i, 'startTime', e.target.value)} className="bg-white/50 border border-white/50 rounded p-1 flex-1"/><input type="time" value={pt.endTime} onChange={e => handleTimeChange(i, 'endTime', e.target.value)} className="bg-white/50 border border-white/50 rounded p-1 flex-1"/></div>)}</div>
      </Modal>

      <Modal isOpen={isEditingInfo} onClose={() => setIsEditingInfo(false)} className="glass-card">
         <h3 className="font-black text-sm mb-4 text-slate-800">تعديل بيانات المعلم</h3>
         
         <div className="flex flex-col items-center mb-6">
              <div 
                className="w-24 h-24 rounded-full bg-white/50 border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer relative overflow-hidden group shadow-inner"
                onClick={() => fileInputRef.current?.click()}
              >
                  {editAvatar ? (
                      <img src={editAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                      <Camera className="w-8 h-8 text-slate-400" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 className="w-6 h-6 text-white" />
                  </div>
              </div>
              <span className="text-xs font-bold text-gray-400 mt-2 block">اضغط لتغيير الصورة</span>
              <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleAvatarChange}
              />
         </div>

         <div className="space-y-3">
             <div>
                 <label className="text-[10px] font-bold text-gray-500 mb-1 block">الاسم</label>
                 <input className="w-full p-3 bg-white/50 border border-white/50 rounded-xl text-sm font-bold outline-none focus:bg-white" value={editName} onChange={e => setEditName(e.target.value)} placeholder="الاسم" />
             </div>
             <div>
                 <label className="text-[10px] font-bold text-gray-500 mb-1 block">المدرسة</label>
                 <input className="w-full p-3 bg-white/50 border border-white/50 rounded-xl text-sm font-bold outline-none focus:bg-white" value={editSchool} onChange={e => setEditSchool(e.target.value)} placeholder="المدرسة" />
             </div>
             <div>
                 <label className="text-[10px] font-bold text-gray-500 mb-1 block">المادة</label>
                 <input className="w-full p-3 bg-white/50 border border-white/50 rounded-xl text-sm font-bold outline-none focus:bg-white" value={editSubject} onChange={e => setEditSubject(e.target.value)} placeholder="المادة" />
             </div>
             <div>
                 <label className="text-[10px] font-bold text-gray-500 mb-1 block">المحافظة التعليمية</label>
                 <select value={editGovernorate} onChange={(e) => setEditGovernorate(e.target.value)} className="w-full p-3 bg-white/50 border border-white/50 rounded-xl text-sm font-bold outline-none focus:bg-white">
                    <option value="">اختر المحافظة...</option>
                    {OMAN_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                 </select>
             </div>
             <button onClick={handleSaveInfo} className="w-full py-3 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/30">حفظ التغييرات</button>
         </div>
      </Modal>
    </div>
  );
};

export default Dashboard;