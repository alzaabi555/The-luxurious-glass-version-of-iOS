import React, { useState, ErrorInfo, ReactNode } from 'react';
import { Student } from './types';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import AttendanceTracker from './components/AttendanceTracker';
import GradeBook from './components/GradeBook';
import StudentReport from './components/StudentReport';
import ExcelImport from './components/ExcelImport';
import NoorPlatform from './components/NoorPlatform';
import GroupCompetition from './components/GroupCompetition';
import UserGuide from './components/UserGuide';
import BrandLogo from './components/BrandLogo';
import Modal from './components/Modal';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import { useSchoolBell } from './hooks/useSchoolBell';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { 
  Users, 
  CalendarCheck, 
  ChevronLeft, 
  ChevronDown, 
  Trash2, 
  X, 
  Globe, 
  Bell, 
  Trophy, 
  Save, 
  FileUp, 
  Smartphone, 
  Layout, 
  GraduationCap, 
  Zap, 
  Book, 
  Clock, 
  MessageCircle, 
  Code2,
  HelpCircle,
  User,
  School,
  Settings,
  MapPin,
  UserCircle,
  Menu,
  Upload
} from 'lucide-react';

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_: Error): ErrorBoundaryState { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("Uncaught error:", error, errorInfo); }
  render() {
    if (this.state.hasError) return <div className="p-10 text-center text-slate-800"><h1>حدث خطأ غير متوقع.</h1><button onClick={() => window.location.reload()} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg">إعادة تحميل</button></div>;
    return (this as any).props.children;
  }
}

const AppContent: React.FC = () => {
  const { 
      students, setStudents, 
      classes, setClasses, 
      groups, setGroups,
      schedule, setSchedule,
      periodTimes, setPeriodTimes,
      teacherInfo, setTeacherInfo,
      currentSemester, setCurrentSemester,
      assessmentTools, setAssessmentTools 
  } = useApp();
  
  const { theme, setTheme, isLowPower, toggleLowPower } = useTheme();
  
  // ✅ التعديل الذكي: يفحص الذاكرة، إذا وجد بيانات يدخل للتطبيق (true)، وإلا يعرض شاشة الإعداد (false)
  const [isSetupComplete, setIsSetupComplete] = useState<boolean>((true) => {
      const savedName = localStorage.getItem('teacherName');
      return !!(savedName && savedName.trim().length > 0);
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Initial Setup State
  const [setupName, setSetupName] = useState('');
  const [setupSchool, setSetupSchool] = useState('');
  const [setupSubject, setSetupSubject] = useState('');
  const [setupGovernorate, setSetupGovernorate] = useState('');

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
      return localStorage.getItem('bellEnabled') !== 'false';
  });

  const toggleNotifications = () => {
      const newState = !notificationsEnabled;
      setNotificationsEnabled(newState);
      localStorage.setItem('bellEnabled', String(newState));
  };

  useSchoolBell(periodTimes, schedule, notificationsEnabled);

  const handleSetupComplete = () => {
      if (setupName && setupSchool) {
          const info = { name: setupName, school: setupSchool, subject: setupSubject, governorate: setupGovernorate };
          setTeacherInfo(info);
          
          try {
            localStorage.setItem('teacherName', setupName);
            localStorage.setItem('schoolName', setupSchool);
            localStorage.setItem('subjectName', setupSubject);
            localStorage.setItem('governorate', setupGovernorate);
          } catch (e) {
            console.error("Storage failed", e);
          }
          
          setIsSetupComplete(true);
      } else {
          alert('الرجاء إدخال الاسم واسم المدرسة على الأقل');
      }
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    if (selectedStudentId === id) setSelectedStudentId(null);
  };

  const handleAddClass = (className: string) => {
    if (className && !classes.includes(className)) {
      setClasses(prev => [...prev, className]);
    }
  };

  const handleEditClass = (oldName: string, newName: string) => {
      if (!newName.trim() || classes.includes(newName)) return;
      setClasses(prev => prev.map(c => c === oldName ? newName : c));
      setStudents(prev => prev.map(s => ({
          ...s,
          classes: s.classes.map(c => c === oldName ? newName : c)
      })));
  };

  const handleDeleteClass = (className: string) => {
      setClasses(prev => prev.filter(c => c !== className));
      setStudents(prev => prev.map(s => ({
          ...s,
          classes: s.classes.filter(c => c !== className)
      })));
  };

  const handleAddStudentManually = (name: string, className: string, phone?: string, avatar?: string) => {
    const newStudent: Student = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      grade: '', 
      classes: [className],
      attendance: [],
      behaviors: [],
      grades: [],
      parentPhone: phone,
      avatar: avatar
    };
    setStudents(prev => [newStudent, ...prev]);
    handleAddClass(className);
  };

  const handleBatchAddStudents = (newStudents: Student[]) => {
      setStudents(prev => {
          const existingNames = new Set(prev.map(s => s.name));
          const uniqueNew = newStudents.filter(s => !existingNames.has(s.name));
          return [...prev, ...uniqueNew];
      });
      const newClasses = new Set(classes);
      newStudents.forEach(s => s.classes.forEach(c => newClasses.add(c)));
      setClasses(Array.from(newClasses));
      setActiveTab('students');
  };

  // --- Backup & Restore Logic ---
  const handleBackupData = async () => {
      const backupData = {
          version: '3.4.0',
          timestamp: new Date().toISOString(),
          data: {
              students,
              classes,
              groups,
              schedule,
              periodTimes,
              teacherInfo,
              currentSemester,
              assessmentTools
          }
      };
      
      const fileName = `Rased_Backup_${new Date().toISOString().split('T')[0]}.json`;
      const jsonString = JSON.stringify(backupData);

      if (Capacitor.isNativePlatform()) {
          try {
              const result = await Filesystem.writeFile({
                  path: fileName,
                  data: jsonString,
                  directory: Directory.Cache,
                  encoding: Encoding.UTF8
              });

              await Share.share({
                  title: 'نسخة احتياطية - راصد',
                  text: 'ملف النسخة الاحتياطية لبيانات تطبيق راصد',
                  url: result.uri,
                  dialogTitle: 'حفظ النسخة الاحتياطية'
              });
          } catch (e) {
              console.error("Backup Error:", e);
              alert("تعذر حفظ النسخة الاحتياطية على الهاتف.");
          }
      } else {
          const blob = new Blob([jsonString], {type: "application/json"});
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  };

  const handleRestoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              const content = json.data || json;
              
              if(confirm('تحذير: سيتم حذف البيانات الحالية واستبدالها بالنسخة الاحتياطية. هل أنت متأكد؟')) {
                  if(content.students) setStudents(content.students);
                  if(content.classes) setClasses(content.classes);
                  if(content.groups) setGroups(content.groups);
                  if(content.schedule) setSchedule(content.schedule);
                  if(content.periodTimes) setPeriodTimes(content.periodTimes);
                  if(content.teacherInfo) setTeacherInfo(content.teacherInfo);
                  if(content.currentSemester) setCurrentSemester(content.currentSemester);
                  if(content.assessmentTools && setAssessmentTools) setAssessmentTools(content.assessmentTools);
                  
                  alert('تمت استعادة البيانات بنجاح! سيتم إعادة تحميل التطبيق.');
                  window.location.reload();
              }
          } catch(err) {
              alert('الملف غير صالح أو تالف.');
              console.error(err);
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const handleFactoryReset = () => {
      if (confirm('هل أنت متأكد تماماً؟ سيتم حذف كل شيء! لا يمكن التراجع عن هذا الإجراء.')) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const handleContactDeveloper = async () => {
      const phone = '96899834455';
      const universalUrl = `https://api.whatsapp.com/send?phone=${phone}`;
      
      try {
          if (Capacitor.isNativePlatform()) {
              await Browser.open({ url: universalUrl });
          } else {
              window.open(universalUrl, '_blank');
          }
      } catch (e) {
          console.error("WhatsApp Error", e);
          window.open(universalUrl, '_blank');
      }
  };

  const renderContent = () => {
    if (activeTab === 'dashboard') return <Dashboard students={students} teacherInfo={teacherInfo} onUpdateTeacherInfo={setTeacherInfo} schedule={schedule} onUpdateSchedule={setSchedule} onSelectStudent={(s) => { setSelectedStudentId(s.id); setActiveTab('reports'); }} onNavigate={setActiveTab} onOpenSettings={() => setShowSettingsModal(true)} periodTimes={periodTimes} setPeriodTimes={setPeriodTimes} notificationsEnabled={notificationsEnabled} onToggleNotifications={toggleNotifications} />;
    
    if (activeTab === 'import') return <ExcelImport existingClasses={classes} onImport={handleBatchAddStudents} onAddClass={handleAddClass} />;
    
    if (activeTab === 'students') return <StudentList students={students} classes={classes} onAddClass={handleAddClass} onAddStudentManually={handleAddStudentManually} onBatchAddStudents={handleBatchAddStudents} onUpdateStudent={handleUpdateStudent} onDeleteStudent={handleDeleteStudent} onViewReport={(s) => { setSelectedStudentId(s.id); setActiveTab('reports'); }} onSwitchToImport={() => setActiveTab('import')} currentSemester={currentSemester} onSemesterChange={setCurrentSemester} onEditClass={handleEditClass} onDeleteClass={handleDeleteClass} />;
    if (activeTab === 'attendance') return <AttendanceTracker students={students} classes={classes} setStudents={setStudents} />;
    if (activeTab === 'grades') return <GradeBook students={students} classes={classes} onUpdateStudent={handleUpdateStudent} setStudents={setStudents} currentSemester={currentSemester} onSemesterChange={setCurrentSemester} teacherInfo={teacherInfo} />;
    
    if (activeTab === 'reports') {
        const selectedStudent = students.find(s => s.id === selectedStudentId);
        if (selectedStudent) return <div className="space-y-4"><button onClick={() => setSelectedStudentId(null)} className="flex items-center gap-2 text-slate-600 font-bold glass-card px-4 py-2 w-fit"><ChevronLeft className="w-4 h-4" /> عودة للقائمة</button><StudentReport student={selectedStudent} onUpdateStudent={handleUpdateStudent} currentSemester={currentSemester} teacherInfo={teacherInfo} /></div>;
        return <StudentList students={students} classes={classes} onAddClass={handleAddClass} onAddStudentManually={handleAddStudentManually} onBatchAddStudents={handleBatchAddStudents} onUpdateStudent={handleUpdateStudent} onDeleteStudent={handleDeleteStudent} onViewReport={(s) => { setSelectedStudentId(s.id); }} onSwitchToImport={() => setActiveTab('import')} currentSemester={currentSemester} onSemesterChange={setCurrentSemester} onEditClass={handleEditClass} onDeleteClass={handleDeleteClass} />;
    }
    
    if (activeTab === 'competition') return <GroupCompetition students={students} classes={classes} onUpdateStudent={handleUpdateStudent} groups={groups} onUpdateGroups={setGroups} setStudents={setStudents} />;
    
    if (activeTab === 'noor') return <NoorPlatform />;
    
    if (activeTab === 'guide') return <UserGuide />;
    
    return null;
  };

  const navItems = [
      { id: 'dashboard', icon: Layout, label: 'الرئيسية' },
      { id: 'students', icon: Users, label: 'الطلاب' },
      { id: 'attendance', icon: CalendarCheck, label: 'الغياب' },
      { id: 'grades', icon: GraduationCap, label: 'الدرجات' },
      { id: 'competition', icon: Trophy, label: 'المنافسة' },
      { id: 'noor', icon: Globe, label: 'نور' },
      { id: 'guide', icon: HelpCircle, label: 'الدليل' },
  ];

  return (
    <div className={`flex h-screen overflow-hidden app-background pt-safe-top pb-safe-bottom text-slate-800 transition-colors duration-300 font-['Tajawal'] ${isLowPower ? 'low-power' : ''}`} dir="rtl">
      
      {/* Sidebar - Desktop Glass */}
      <aside className="hidden md:flex w-24 flex-col items-center py-8 bg-white/20 dark:bg-black/20 backdrop-blur-xl border-l border-white/20 shadow-sm z-30 transition-all">
        <div className="mb-8 w-12 h-12">
            <BrandLogo className="w-full h-full" showText={false} />
        </div>
        
        <nav className="flex-1 flex flex-col items-center gap-4 w-full px-2 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`p-3 rounded-2xl transition-all duration-300 group relative flex items-center justify-center ${
                  isActive 
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' 
                    : 'text-slate-500 hover:bg-white/40 hover:text-slate-700'
                }`}
              >
                <item.icon className={`w-6 h-6 ${isActive ? 'stroke-2' : 'stroke-[1.5]'}`} />
                <span className="absolute right-full mr-3 bg-slate-800 text-white text-xs font-bold py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-4">
            <button onClick={() => setShowSettingsModal(true)} className="p-3 text-slate-500 hover:bg-white/40 rounded-2xl transition-colors">
                <Settings className="w-6 h-6" />
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* Mobile Header - Glass */}
          <header className="md:hidden flex items-center justify-between p-4 bg-white/20 backdrop-blur-xl border-b border-white/20 z-20 sticky top-0">
             <div className="flex items-center gap-3">
                 <div className="w-8 h-8"><BrandLogo className="w-full h-full" showText={false} /></div>
                 <span className="font-black text-lg text-slate-800">{navItems.find(i => i.id === activeTab)?.label}</span>
             </div>
             <div className="flex items-center gap-2">
                 <button onClick={() => setShowSettingsModal(true)} className="p-2 bg-white/40 rounded-full text-slate-700 hover:bg-white/60">
                     <Settings className="w-5 h-5" />
                 </button>
                 <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold border border-primary/20">
                     {teacherInfo.name.charAt(0)}
                 </div>
             </div>
          </header>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 custom-scrollbar relative pb-24 md:pb-8">
              <div className="max-w-7xl mx-auto h-full">
                {renderContent()}
              </div>
          </div>

          {/* Mobile Nav Bar - Glass Island */}
          <nav className="md:hidden fixed bottom-0 w-full bg-white/30 backdrop-blur-xl border-t border-white/20 z-50 flex items-center justify-between px-6 py-2 pb-safe-bottom transition-all">
              {navItems.slice(0, 5).map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                      <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 relative ${isActive ? 'text-primary -translate-y-1' : 'text-slate-400'}`}
                      >
                          <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary/10' : 'hover:bg-white/20'}`}>
                              <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                          </div>
                          {isActive && <div className="w-1 h-1 bg-primary rounded-full mt-1" />}
                      </button>
                  );
              })}
              {/* More Menu */}
              <button
                  onClick={() => setActiveTab('guide')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 relative ${activeTab === 'guide' || activeTab === 'noor' ? 'text-primary -translate-y-1' : 'text-slate-400'}`}
              >
                    <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'guide' ? 'bg-primary/10' : 'hover:bg-white/20'}`}>
                      <Menu className="w-6 h-6" strokeWidth={activeTab === 'guide' ? 2.5 : 2} />
                    </div>
                    {(activeTab === 'guide' || activeTab === 'noor') && <div className="w-1 h-1 bg-primary rounded-full mt-1" />}
              </button>
          </nav>

      </main>

      {/* Settings Modal - Glass */}
      <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} className="glass-card max-w-sm">
         <div className="flex items-center justify-between mb-6">
             <h3 className="font-black text-xl text-slate-800">الإعدادات</h3>
             <button onClick={() => setShowSettingsModal(false)} className="p-2 bg-white/40 rounded-full hover:bg-white/60"><X className="w-5 h-5"/></button>
         </div>
         
         <div className="space-y-4">
             {/* Performance Mode */}
             <div className="glass-card p-5 mb-2 border border-white/50 flex items-center justify-between shadow-sm bg-white/30">
                 <div>
                     <div className="flex items-center gap-2 mb-1">
                         <Zap className="w-4 h-4 text-amber-500" />
                         <h4 className="font-black text-sm text-slate-800">تقليل المؤثرات البصرية</h4>
                     </div>
                     <p className="text-[10px] text-slate-500 font-bold">للأجهزة القديمة: يوقف الشفافية والحركة</p>
                 </div>
                 <button 
                    onClick={toggleLowPower}
                    className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${isLowPower ? 'bg-slate-800' : 'bg-gray-200'}`}
                 >
                     <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${isLowPower ? '-translate-x-5' : 'translate-x-0'}`} />
                 </button>
             </div>

             {/* Data Management Actions */}
             <div className="space-y-3 mb-4">
                 <button onClick={handleBackupData} className="w-full py-4 bg-blue-50/50 hover:bg-blue-100/50 text-blue-600 rounded-[1.5rem] font-black text-xs flex items-center justify-between px-6 transition-colors border border-blue-100/30">
                     <span>حفظ نسخة احتياطية</span>
                     <Save className="w-5 h-5" />
                 </button>
                 
                 <label className="w-full py-4 bg-emerald-50/50 hover:bg-emerald-100/50 text-emerald-600 rounded-[1.5rem] font-black text-xs flex items-center justify-between px-6 transition-colors cursor-pointer border border-emerald-100/30">
                     <span>استعادة بيانات</span>
                     <Upload className="w-5 h-5" />
                     <input type="file" accept=".json" onChange={handleRestoreData} className="hidden" />
                 </label>

                 <button onClick={handleFactoryReset} className="w-full py-4 bg-rose-50/50 hover:bg-rose-100/50 text-rose-600 rounded-[1.5rem] font-black text-xs flex items-center justify-between px-6 transition-colors border border-rose-100/30">
                     <span>حذف كافة البيانات</span>
                     <Trash2 className="w-5 h-5" />
                 </button>
             </div>

             {/* Developer Card */}
             <div className="glass-card p-6 text-center border border-white/50 shadow-sm bg-gradient-to-br from-white/40 to-white/10">
                 <div className="w-14 h-14 bg-white/60 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-white/50">
                     <Code2 className="w-7 h-7" />
                 </div>
                 <h3 className="font-black text-base text-slate-800 mb-1">حول المطور</h3>
                 <p className="text-[10px] text-slate-500 font-bold mb-6">تصميم وتطوير: محمد درويش الزعابي</p>
                 
                 <button 
                    onClick={handleContactDeveloper} 
                    className="w-full py-3.5 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all active:scale-95 mb-6"
                 >
                     <MessageCircle className="w-5 h-5" />
                     تواصل مع المطور (واتساب)
                 </button>
                 
                 <p className="text-[9px] text-slate-400 font-bold tracking-widest">Version 3.4.0 (Glass UI)</p>
             </div>
         </div>
      </Modal>

    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
