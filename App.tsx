import React, { useState, useEffect, Suspense, ErrorInfo, ReactNode } from 'react';
import { Student, ScheduleDay, PeriodTime, Group } from './types';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import AttendanceTracker from './components/AttendanceTracker';
import GradeBook from './components/GradeBook';
import StudentReport from './components/StudentReport';
import ExcelImport from './components/ExcelImport';
import NoorPlatform from './components/NoorPlatform';
import MinistrySync from './components/MinistrySync';
import GroupCompetition from './components/GroupCompetition';
import GamificationHub from './components/GamificationHub';
import UserGuide from './components/UserGuide';
import About from './components/About';
import BrandLogo from './components/BrandLogo';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import { useSchoolBell } from './hooks/useSchoolBell';
import { 
  LayoutDashboard, Users, CalendarCheck, BarChart3, FileText, 
  Trophy, Crown, Upload, Globe, Building2, HelpCircle, Info, 
  Menu, X, LogOut, Moon, Sun, Laptop, Zap
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
    if (this.state.hasError) return <div className="p-10 text-center text-slate-800 dark:text-white"><h1>حدث خطأ غير متوقع.</h1><button onClick={() => window.location.reload()} className="mt-4 bg-indigo-500 text-white px-4 py-2 rounded">إعادة تحميل</button></div>;
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      setIsSidebarOpen(false); // Close sidebar on mobile after navigation
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
              onOpenSettings={() => {}} 
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
              onSwitchToImport={() => setActiveTab('import')}
              currentSemester={currentSemester}
              onSemesterChange={setCurrentSemester}
              onEditClass={handleEditClass}
              onDeleteClass={handleDeleteClass}
          />;
      }
      if (activeTab === 'attendance') return <AttendanceTracker students={students} classes={classes} setStudents={setStudents} />;
      if (activeTab === 'grades') return <GradeBook students={students} classes={classes} onUpdateStudent={handleUpdateStudent} setStudents={setStudents} currentSemester={currentSemester} onSemesterChange={setCurrentSemester} teacherInfo={teacherInfo} />;
      if (activeTab === 'groups') return <GroupCompetition students={students} classes={classes} onUpdateStudent={handleUpdateStudent} groups={groups} onUpdateGroups={setGroups} setStudents={setStudents} />;
      if (activeTab === 'gamification') return <GamificationHub students={students} classes={classes} onUpdateStudent={handleUpdateStudent} />;
      if (activeTab === 'report') {
          if (selectedStudentForReport) return <StudentReport student={selectedStudentForReport} onUpdateStudent={handleUpdateStudent} currentSemester={currentSemester} teacherInfo={teacherInfo} />;
          return <StudentList students={students} classes={classes} onAddClass={handleAddClass} onAddStudentManually={handleAddStudentManually} onBatchAddStudents={handleBatchAddStudents} onUpdateStudent={handleUpdateStudent} onDeleteStudent={handleDeleteStudent} onViewReport={(s) => { setSelectedStudentForReport(s); setActiveTab('report'); }} onSwitchToImport={() => setActiveTab('import')} currentSemester={currentSemester} onSemesterChange={setCurrentSemester} onEditClass={handleEditClass} onDeleteClass={handleDeleteClass} />;
      }
      if (activeTab === 'import') return <ExcelImport existingClasses={classes} onImport={handleBatchAddStudents} onAddClass={handleAddClass} />;
      if (activeTab === 'noor') return <NoorPlatform />;
      if (activeTab === 'ministry') return <MinistrySync />;
      if (activeTab === 'guide') return <UserGuide />;
      if (activeTab === 'about') return <About />;
      
      return null;
  };

  const navItems = [
      { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
      { id: 'students', label: 'الطلاب', icon: Users },
      { id: 'attendance', label: 'الغياب', icon: CalendarCheck },
      { id: 'grades', label: 'الدرجات', icon: BarChart3 },
      { id: 'groups', label: 'المنافسة', icon: Trophy },
      { id: 'gamification', label: 'المتجر', icon: Crown },
      { id: 'import', label: 'استيراد', icon: Upload },
      { id: 'noor', label: 'منصة نور', icon: Globe },
      { id: 'ministry', label: 'البوابة', icon: Building2 },
      { id: 'guide', label: 'الدليل', icon: HelpCircle },
      { id: 'about', label: 'حول', icon: Info },
  ];

  return (
    // ✅ 1. تم تغيير الخلفية هنا لتستخدم كلاس التصميم الزجاجي app-background
    <div className={`flex h-screen app-background transition-colors duration-300 overflow-hidden font-sans text-slate-900 dark:text-slate-100 ${isLowPower ? 'low-power' : ''}`}>
        
        {/* Sidebar (Desktop) - ✅ 2. تم تحويل القائمة الجانبية إلى زجاجية */}
        <aside className={`
            fixed inset-y-0 right-0 z-50 w-64 
            bg-white/20 dark:bg-black/20 backdrop-blur-2xl border-l border-white/20 
            transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-2xl md:shadow-none
            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
            <div className="h-full flex flex-col">
                {/* Sidebar Header */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10"><BrandLogo className="w-full h-full" showText={false} /></div>
                        <span className="text-xl font-black text-slate-800 dark:text-white tracking-tight">راصد</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-6 h-6"/></button>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm 
                            ${activeTab === item.id 
                                ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30 text-white' 
                                : 'text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/10 space-y-2">
                    <button 
                        onClick={toggleLowPower}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isLowPower ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'text-slate-500 hover:bg-white/40 dark:hover:bg-white/10'}`}
                    >
                        {isLowPower ? <Zap className="w-4 h-4 fill-amber-500"/> : <Zap className="w-4 h-4"/>}
                        {isLowPower ? 'وضع التوفير مفعل' : 'وضع التوفير'}
                    </button>

                    <button 
                        onClick={() => setTheme(isDark ? 'ceramic' : 'vision')}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 transition-all text-xs font-bold"
                    >
                        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        {isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
                    </button>
                </div>
            </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
            <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative h-full">
            {/* Mobile Header - ✅ 3. تم تحويل رأس الصفحة في الجوال إلى زجاجي */}
            <div className="md:hidden bg-white/30 dark:bg-black/30 backdrop-blur-xl border-b border-white/20 p-4 flex items-center justify-between shrink-0 z-30">
                <div className="flex items-center gap-3">
                    <BrandLogo className="w-8 h-8" showText={false} />
                    <span className="font-black text-lg text-slate-900 dark:text-white">راصد</span>
                </div>
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/40 dark:bg-white/10 rounded-xl text-slate-600 dark:text-white">
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 custom-scrollbar scroll-smooth">
                <div className="max-w-7xl mx-auto h-full">
                    {renderContent()}
                </div>
            </div>
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
