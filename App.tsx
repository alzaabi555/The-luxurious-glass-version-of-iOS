
import React, { useState, useEffect, Suspense, ErrorInfo, ReactNode } from 'react';
import { Student, ScheduleDay, PeriodTime, Group } from './types';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import AttendanceTracker from './components/AttendanceTracker';
import GradeBook from './components/GradeBook';
import StudentReport from './components/StudentReport';
import GroupCompetition from './components/GroupCompetition';
import UserGuide from './components/UserGuide';
import About from './components/About';
import Settings from './components/Settings';
import MinistrySync from './components/MinistrySync'; // Import MinistrySync
import BrandLogo from './components/BrandLogo';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import { useSchoolBell } from './hooks/useSchoolBell';
import { 
  LayoutDashboard, Users, CalendarCheck, BarChart3, FileText, 
  Trophy, HelpCircle, Info, 
  Menu, X, Moon, Sun, Zap, Settings as SettingsIcon, MoreHorizontal, Grid, Building2 // Import Building2 icon
} from 'lucide-react';
import Modal from './components/Modal';

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
    if (this.state.hasError) return <div className="p-10 text-center text-slate-800 dark:text-white glass-card m-10 rounded-3xl"><h1>حدث خطأ غير متوقع.</h1><button onClick={() => window.location.reload()} className="mt-4 bg-white/20 hover:bg-white/30 text-slate-800 dark:text-white px-6 py-2 rounded-xl backdrop-blur-md transition-all">إعادة تحميل</button></div>;
    return (this as any).props.children;
  }
}

const AppContent: React.FC = () => {
  const { 
      students, setStudents, classes, setClasses, groups, setGroups,
      schedule, setSchedule, periodTimes, setPeriodTimes,
      teacherInfo, setTeacherInfo, currentSemester, setCurrentSemester
  } = useApp();

  const { theme, setTheme, isDark, toggleLowPower, isLowPower } = useTheme();
  
  // State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For Desktop Mobile Toggle fallback (rarely used now)
  const [showMoreMenu, setShowMoreMenu] = useState(false); // For Mobile Bottom Bar "More"
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);

  // Custom Hooks
  useSchoolBell(periodTimes, schedule, notificationsEnabled);

  // Handlers
  const handleUpdateTeacherInfo = (info: any) => setTeacherInfo(prev => ({ ...prev, ...info }));
  const handleUpdateSchedule = (newSchedule: ScheduleDay[]) => setSchedule(newSchedule);
  const handleToggleNotifications = () => {
      setNotificationsEnabled(prev => {
          const newVal = !prev;
          if (newVal) alert('تم تفعيل جرس الحصص 🔔');
          else alert('تم إيقاف جرس الحصص 🔕');
          return newVal;
      });
  };

  const handleNavigate = (tab: string) => {
      setActiveTab(tab);
      setIsSidebarOpen(false);
      setShowMoreMenu(false);
      if (tab !== 'report') setSelectedStudentForReport(null);
  };

  // Helper to handle student operations
  const handleUpdateStudent = (updatedStudent: Student) => {
      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
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
          avatar
      };
      setStudents(prev => [...prev, newStudent]);
      if (!classes.includes(className)) setClasses(prev => [...prev, className]);
  };

  const handleBatchAddStudents = (newStudents: Student[]) => {
      setStudents(prev => [...prev, ...newStudents]);
      // Extract new classes
      const newClasses = new Set(classes);
      newStudents.forEach(s => s.classes.forEach(c => newClasses.add(c)));
      setClasses(Array.from(newClasses));
  };

  const handleDeleteStudent = (id: string) => {
      setStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleAddClass = (name: string) => {
      if (!classes.includes(name)) setClasses(prev => [...prev, name]);
  };

  const handleEditClass = (oldName: string, newName: string) => {
      setClasses(prev => prev.map(c => c === oldName ? newName : c));
      setStudents(prev => prev.map(s => ({
          ...s,
          classes: s.classes.map(c => c === oldName ? newName : c)
      })));
  };

  const handleDeleteClass = (className: string) => {
      if (confirm(`هل أنت متأكد من حذف الفصل "${className}"؟ سيتم حذف الفصل من قائمة الفصول، لكن الطلاب سيبقون مسجلين.`)) {
          setClasses(prev => prev.filter(c => c !== className));
      }
  };

  // Render Main Content
  const renderContent = () => {
      if (activeTab === 'dashboard') {
          return <Dashboard 
              students={students} 
              teacherInfo={teacherInfo} 
              onUpdateTeacherInfo={handleUpdateTeacherInfo}
              schedule={schedule}
              onUpdateSchedule={handleUpdateSchedule}
              onSelectStudent={(s) => { setSelectedStudentForReport(s); setActiveTab('report'); }}
              onNavigate={handleNavigate}
              onOpenSettings={() => setActiveTab('settings')} 
              periodTimes={periodTimes}
              setPeriodTimes={setPeriodTimes}
              notificationsEnabled={notificationsEnabled}
              onToggleNotifications={handleToggleNotifications}
          />;
      }
      if (activeTab === 'students') {
          return <StudentList 
              students={students} 
              classes={classes}
              onAddClass={handleAddClass}
              onAddStudentManually={handleAddStudentManually}
              onBatchAddStudents={handleBatchAddStudents}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onViewReport={(s) => { setSelectedStudentForReport(s); setActiveTab('report'); }}
              currentSemester={currentSemester}
              onSemesterChange={setCurrentSemester}
              onEditClass={handleEditClass}
              onDeleteClass={handleDeleteClass}
          />;
      }
      if (activeTab === 'attendance') return <AttendanceTracker students={students} classes={classes} setStudents={setStudents} />;
      if (activeTab === 'grades') return <GradeBook students={students} classes={classes} onUpdateStudent={handleUpdateStudent} setStudents={setStudents} currentSemester={currentSemester} onSemesterChange={setCurrentSemester} teacherInfo={teacherInfo} />;
      if (activeTab === 'groups') return <GroupCompetition students={students} classes={classes} onUpdateStudent={handleUpdateStudent} groups={groups} onUpdateGroups={setGroups} setStudents={setStudents} />;
      if (activeTab === 'report') {
          if (selectedStudentForReport) return <StudentReport student={selectedStudentForReport} onUpdateStudent={handleUpdateStudent} currentSemester={currentSemester} teacherInfo={teacherInfo} onBack={() => setSelectedStudentForReport(null)} />;
          return <StudentList students={students} classes={classes} onAddClass={handleAddClass} onAddStudentManually={handleAddStudentManually} onBatchAddStudents={handleBatchAddStudents} onUpdateStudent={handleUpdateStudent} onDeleteStudent={handleDeleteStudent} onViewReport={(s) => { setSelectedStudentForReport(s); setActiveTab('report'); }} currentSemester={currentSemester} onSemesterChange={setCurrentSemester} onEditClass={handleEditClass} onDeleteClass={handleDeleteClass} />;
      }
      if (activeTab === 'ministry') return <MinistrySync />;
      if (activeTab === 'settings') return <Settings />;
      if (activeTab === 'guide') return <UserGuide />;
      if (activeTab === 'about') return <About />;
      
      return null;
  };

  // Main navigation items (Mobile Bottom Bar)
  const mainNavItems = [
      { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
      { id: 'attendance', label: 'الحضور', icon: CalendarCheck },
      { id: 'students', label: 'الطلاب', icon: Users },
      { id: 'grades', label: 'الدرجات', icon: BarChart3 },
  ];

  // Secondary items (In "More" menu)
  const secondaryNavItems = [
      { id: 'groups', label: 'المنافسة', icon: Trophy },
      { id: 'ministry', label: 'بوابة الوزارة', icon: Building2 }, // Added Ministry
      { id: 'settings', label: 'البيانات', icon: SettingsIcon },
      { id: 'guide', label: 'الدليل', icon: HelpCircle },
      { id: 'about', label: 'حول', icon: Info },
  ];

  // Full Sidebar items (Desktop)
  const sidebarNavItems = [...mainNavItems, ...secondaryNavItems];

  return (
    // استخدام h-[100dvh] بدلاً من h-screen لتفادي مشاكل شريط العنوان في سفاري
    <div className={`flex h-[100dvh] overflow-hidden font-sans text-slate-900 dark:text-white ${isLowPower ? 'low-power' : ''}`}>
        
        {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
        <aside className="hidden md:flex flex-col w-64 h-full p-4 shrink-0 relative z-50">
            <div className="h-full rounded-[2.5rem] glass-heavy flex flex-col overflow-hidden shadow-2xl border border-white/20">
                {/* Header */}
                <div className="p-6 pb-2 flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 glass-icon rounded-2xl border border-white/30"><BrandLogo className="w-full h-full" showText={false} /></div>
                    <span className="text-xl font-black text-slate-800 dark:text-white tracking-tight text-glow">راصد</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar">
                    {sidebarNavItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id)}
                            className={`
                                w-full flex items-center gap-4 px-4 py-3.5 rounded-[1.2rem] transition-all duration-300 font-bold text-sm relative group
                                ${activeTab === item.id 
                                    ? 'glass-card border-white/40 text-slate-900 dark:text-white shadow-[0_0_20px_rgba(255,255,255,0.15)] bg-white/20' 
                                    : 'text-slate-600 dark:text-white/60 hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                                }
                            `}
                        >
                            <div className={`w-6 h-6 flex items-center justify-center transition-all ${activeTab === item.id ? 'scale-110 drop-shadow-md' : 'opacity-70'}`}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className="block tracking-wide">{item.label}</span>
                            {activeTab === item.id && <div className="absolute left-3 w-1.5 h-1.5 bg-indigo-400 dark:bg-white rounded-full shadow-[0_0_10px_currentColor]"></div>}
                        </button>
                    ))}
                </nav>

                {/* Footer Actions */}
                <div className="p-4 pt-2 space-y-2 bg-transparent">
                    <button onClick={() => setTheme(isDark ? 'ceramic' : 'vision')} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-slate-600 dark:text-white/60 hover:bg-white/10 glass-card border-white/10 hover:border-white/20 active:scale-95">
                        <div className="w-6 h-6 flex items-center justify-center">{isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</div>
                        <span className="block">{isDark ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
                    </button>
                </div>
            </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative h-full">
            
            {/* Mobile Header (Safe Area Optimized) */}
            {/* استخدام pt-[max(1rem,env(safe-area-inset-top))] لضمان عدم تغطية النوتش */}
            <div 
                className="md:hidden px-4 pb-2 flex justify-between items-center z-30 transition-all"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)' }}
            >
                <div className="flex items-center gap-2">
                    <BrandLogo className="w-8 h-8" showText={false} />
                    <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">راصد</span>
                </div>
                {/* Optional: Add a top right action if needed */}
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 custom-scrollbar scroll-smooth pb-28 md:pb-6">
                <div className="max-w-7xl mx-auto h-full">
                    {renderContent()}
                </div>
            </div>

            {/* --- IPHONE BOTTOM BAR (Mobile Only) --- */}
            <div 
                className="md:hidden fixed bottom-6 left-4 right-4 z-50"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="glass-heavy rounded-[2rem] p-1.5 flex justify-between items-center shadow-2xl border border-white/20 backdrop-blur-xl relative">
                    {mainNavItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id)}
                            className={`flex-1 flex flex-col items-center justify-center py-3 rounded-[1.5rem] transition-all duration-300 relative overflow-hidden ${activeTab === item.id ? 'text-indigo-600 dark:text-white' : 'text-slate-400 dark:text-white/40 hover:text-slate-600'}`}
                        >
                            {activeTab === item.id && (
                                <div className="absolute inset-0 bg-white/20 shadow-inner rounded-[1.5rem]"></div>
                            )}
                            <item.icon className={`w-6 h-6 mb-0.5 relative z-10 transition-transform ${activeTab === item.id ? 'scale-110 -translate-y-0.5' : ''}`} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                            <span className="text-[9px] font-black relative z-10">{item.label}</span>
                        </button>
                    ))}
                    
                    {/* More Button */}
                    <button
                        onClick={() => setShowMoreMenu(true)}
                        className={`flex-1 flex flex-col items-center justify-center py-3 rounded-[1.5rem] transition-all duration-300 ${['groups', 'settings', 'guide', 'about', 'ministry'].includes(activeTab) ? 'text-indigo-600 dark:text-white bg-white/10' : 'text-slate-400 dark:text-white/40'}`}
                    >
                        <Grid className="w-6 h-6 mb-0.5" />
                        <span className="text-[9px] font-black">المزيد</span>
                    </button>
                </div>
            </div>

            {/* --- MOBILE MORE MENU SHEET --- */}
            <Modal isOpen={showMoreMenu} onClose={() => setShowMoreMenu(false)} className="mb-20 rounded-[2.5rem] max-w-sm w-full mx-4">
                <div className="grid grid-cols-2 gap-3">
                    {secondaryNavItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id)}
                            className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white border-transparent shadow-lg' : 'glass-card border-white/10 text-slate-700 dark:text-white hover:bg-white/10'}`}
                        >
                            <div className={`p-3 rounded-full ${activeTab === item.id ? 'bg-white/20' : 'glass-icon'}`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <span className="font-black text-sm">{item.label}</span>
                        </button>
                    ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
                    <button onClick={() => setTheme(isDark ? 'ceramic' : 'vision')} className="p-3 glass-card rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-white/70">
                        {isDark ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
                        {isDark ? 'نهاري' : 'ليلي'}
                    </button>
                    <button onClick={toggleLowPower} className={`p-3 glass-card rounded-xl flex items-center justify-center gap-2 text-xs font-bold ${isLowPower ? 'text-amber-500 border-amber-500/30' : 'text-slate-600 dark:text-white/70'}`}>
                        <Zap className={`w-4 h-4 ${isLowPower ? 'fill-amber-500' : ''}`}/>
                        توفير طاقة
                    </button>
                </div>
            </Modal>

        </main>
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
