import React, { useState } from 'react';
import { Student } from '../types';
import { Trophy, Crown, ShoppingBag, Star, Shield, Zap, X, Filter, Search, Coins, Sparkles, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';

interface GamificationHubProps {
  students: Student[];
  classes: string[];
  onUpdateStudent: (s: Student) => void;
}

interface RewardItem {
    id: string;
    title: string;
    cost: number;
    icon: string;
    color: string;
}

const REWARDS: RewardItem[] = [
    { id: '1', title: 'تغيير المكان', cost: 15, icon: '🪑', color: 'blue' },
    { id: '2', title: 'قائد الطابور', cost: 10, icon: '🚩', color: 'emerald' },
    { id: '3', title: 'إعفاء واجب', cost: 50, icon: '📝', color: 'purple' },
    { id: '4', title: 'مساعد المعلم', cost: 25, icon: '👨‍🏫', color: 'amber' },
    { id: '5', title: 'قلم مميز', cost: 30, icon: '✏️', color: 'rose' },
    { id: '6', title: 'نجمة الفصل', cost: 40, icon: '⭐', color: 'yellow' },
];

const LEVELS = [
    { name: 'مبتدئ', min: 0, color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-500/20' },
    { name: 'مغامر', min: 10, color: 'text-blue-600', bg: 'bg-blue-500/10 border-blue-500/20' },
    { name: 'فارس', min: 30, color: 'text-indigo-600', bg: 'bg-indigo-500/10 border-indigo-500/20' },
    { name: 'بطل', min: 60, color: 'text-purple-600', bg: 'bg-purple-500/10 border-purple-500/20' },
    { name: 'أسطورة', min: 100, color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/20' },
];

const GamificationHub: React.FC<GamificationHubProps> = ({ students, classes, onUpdateStudent }) => {
  const [selectedClass, setSelectedClass] = useState(classes[0] || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStore, setShowStore] = useState(false);

  // GLASSMORPHISM STYLES
  const styles = {
      card: 'glass-card border border-white/50 shadow-glass backdrop-blur-md rounded-[2rem]',
      headerCard: 'bg-gradient-to-r from-violet-600/90 to-indigo-600/90 backdrop-blur-xl border border-white/20 shadow-lg rounded-[2.5rem]',
      pill: 'rounded-xl border transition-all hover:scale-105 active:scale-95',
      storeCard: 'bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 rounded-2xl hover:bg-white/60 transition-all',
  };

  const getBalance = (student: Student) => {
      const positivePoints = (student.behaviors || [])
        .filter(b => b.type === 'positive')
        .reduce((acc, b) => acc + b.points, 0);
      const spent = student.spentCoins || 0;
      return Math.max(0, positivePoints - spent);
  };

  const getTotalPoints = (student: Student) => {
      return (student.behaviors || [])
        .filter(b => b.type === 'positive')
        .reduce((acc, b) => acc + b.points, 0);
  };

  const getLevel = (points: number) => {
      return LEVELS.slice().reverse().find(l => points >= l.min) || LEVELS[0];
  };

  const getAvatarUrl = (id: string) => {
      return `https://api.dicebear.com/7.x/adventurer/svg?seed=${id}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || s.classes?.includes(selectedClass);
    return matchesSearch && matchesClass;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => getBalance(b) - getBalance(a));

  const handlePurchase = (reward: RewardItem) => {
      if (!selectedStudent) return;
      const balance = getBalance(selectedStudent);
      
      if (balance >= reward.cost) {
          if (confirm(`هل يريد ${selectedStudent.name} شراء "${reward.title}" مقابل ${reward.cost} عملة؟`)) {
              const currentSpent = selectedStudent.spentCoins || 0;
              const updatedStudent = { 
                  ...selectedStudent, 
                  spentCoins: currentSpent + reward.cost 
              };
              onUpdateStudent(updatedStudent);
              setSelectedStudent(updatedStudent);
              alert('تم الشراء بنجاح! 🎉');
          }
      } else {
          alert('عذراً، رصيد العملات لا يكفي! 😔');
      }
  };

  // Helper to map color names to tailwind classes for the store items
  const getRewardColorClass = (color: string) => {
      const colors: any = {
          blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
          emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
          purple: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
          amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
          rose: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
          yellow: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      };
      return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-500">
      
      {/* Hero Header (Glass Gradient) */}
      <div className={`${styles.headerCard} p-8 text-white relative overflow-hidden`}>
          <div className="relative z-10">
              <h2 className="text-3xl font-black flex items-center gap-3 mb-2 drop-shadow-md">
                  <Crown className="w-10 h-10 text-yellow-300 fill-yellow-400" />
                  فرسان الفصل
              </h2>
              <p className="text-indigo-100 text-sm font-bold max-w-md leading-relaxed opacity-90">
                  نظام التحفيز والتكريم. جمع العملات الذهبية واستبدلها بمكافآت رائعة!
              </p>
          </div>
          <Sparkles className="absolute top-[-20px] right-[-20px] w-40 h-40 text-white/10 rotate-12 animate-pulse" />
          <Trophy className="absolute bottom-[-20px] left-4 w-32 h-32 text-yellow-400/20 rotate-[-12deg]" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar items-center">
         <button 
            onClick={() => setSelectedClass('all')} 
            className={`px-5 py-2 text-xs font-black whitespace-nowrap ${styles.pill} ${selectedClass === 'all' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' : 'bg-white/40 text-slate-600 border-white/40'}`}
         >
            الكل
         </button>
         <div className="h-6 w-px bg-white/30 mx-1 shrink-0"></div>
         {classes.map(c => (
            <button 
                key={c}
                onClick={() => setSelectedClass(c)} 
                className={`px-5 py-2 text-xs font-black whitespace-nowrap ${styles.pill} ${selectedClass === c ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' : 'bg-white/40 text-slate-600 border-white/40'}`}
            >
                {c}
            </button>
         ))}
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedStudents.map((student, idx) => {
              const balance = getBalance(student);
              const total = getTotalPoints(student);
              const level = getLevel(total);
              
              return (
                  <div 
                    key={student.id} 
                    onClick={() => { setSelectedStudent(student); setShowStore(true); }}
                    className={`${styles.card} p-4 relative group cursor-pointer hover:bg-white/30 transition-all`}
                  >
                      {/* Rank Badge */}
                      <div className="absolute top-3 left-3 w-7 h-7 bg-white/60 dark:bg-white/10 rounded-full flex items-center justify-center text-[10px] font-black text-slate-500 backdrop-blur-sm border border-white/40 shadow-sm z-10">
                          #{idx + 1}
                      </div>

                      <div className="flex flex-col items-center">
                          <div className="w-20 h-20 rounded-[1.5rem] bg-white/40 border-2 border-white/50 shadow-inner mb-3 overflow-hidden backdrop-blur-sm">
                              <img src={getAvatarUrl(student.id)} alt="avatar" className="w-full h-full object-cover" />
                          </div>
                          
                          <h3 className="font-black text-slate-800 dark:text-white text-sm text-center mb-1 truncate w-full">{student.name}</h3>
                          
                          <div className={`px-3 py-0.5 rounded-full text-[9px] font-black mb-3 border ${level.bg} ${level.color}`}>
                              {level.name}
                          </div>

                          <div className="w-full bg-white/40 dark:bg-black/20 rounded-xl p-2 flex items-center justify-between border border-white/30">
                              <span className="text-[9px] font-bold text-slate-500 dark:text-white/50">الرصيد</span>
                              <div className="flex items-center gap-1">
                                  <span className="text-sm font-black text-amber-500">{balance}</span>
                                  <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              </div>
                          </div>
                      </div>
                  </div>
              );
          })}
      </div>

      {sortedStudents.length === 0 && (
          <div className="text-center py-20 opacity-50">
              <Search className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <p className="text-sm font-bold text-slate-400">لا يوجد فرسان في هذا الفصل</p>
          </div>
      )}

      {/* Store Modal - Glass */}
      <Modal 
        isOpen={showStore && !!selectedStudent} 
        onClose={() => setShowStore(false)}
        className="glass-card w-full max-w-lg h-[80vh] overflow-hidden p-0 rounded-[2.5rem]" 
      >
          {selectedStudent && (
            <div className="flex flex-col h-full">
              {/* Modal Header */}
              <div className="bg-gradient-to-b from-white/40 to-transparent p-6 pb-4 shrink-0 border-b border-white/20">
                  <div className="flex justify-between items-start mb-4">
                      <button onClick={() => setShowStore(false)} className="p-2 bg-white/40 rounded-full hover:bg-white/60 shadow-sm"><X className="w-5 h-5 text-slate-500"/></button>
                      <div className="bg-amber-100/80 text-amber-700 px-4 py-1.5 rounded-full flex items-center gap-2 font-black text-sm shadow-sm backdrop-blur-md border border-amber-200">
                          <span>{getBalance(selectedStudent)}</span>
                          <Coins className="w-4 h-4 fill-amber-600" />
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                      <div className="w-20 h-20 rounded-[1.5rem] bg-white/40 border-2 border-white/50 shadow-inner overflow-hidden shrink-0">
                            <img src={getAvatarUrl(selectedStudent.id)} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                          <h2 className="text-xl font-black text-slate-800 dark:text-white leading-tight mb-1">{selectedStudent.name}</h2>
                          <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getLevel(getTotalPoints(selectedStudent)).bg} ${getLevel(getTotalPoints(selectedStudent)).color}`}>
                                  {getLevel(getTotalPoints(selectedStudent)).name}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-white/50 font-bold">مجموع النقاط: {getTotalPoints(selectedStudent)}</span>
                          </div>
                      </div>
                  </div>

                  <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden border border-white/20">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full" 
                        style={{ width: `${Math.min(100, (getTotalPoints(selectedStudent) % 30) / 30 * 100)}%` }}
                      ></div>
                  </div>
                  <p className="text-[9px] text-slate-400 text-left mt-1 font-bold">التقدم للمستوى التالي</p>
              </div>

              {/* Store Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2">
                  <h3 className="font-black text-slate-700 dark:text-white text-sm mb-4 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-indigo-500" />
                      متجر المكافآت
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                      {REWARDS.map(reward => {
                          const canAfford = getBalance(selectedStudent) >= reward.cost;
                          return (
                              <button 
                                key={reward.id}
                                onClick={() => handlePurchase(reward)}
                                className={`relative p-4 rounded-3xl border transition-all group flex flex-col items-center text-center ${getRewardColorClass(reward.color)} ${canAfford ? 'hover:scale-105 active:scale-95 cursor-pointer bg-opacity-30 border-opacity-40' : 'opacity-60 cursor-not-allowed grayscale'}`}
                              >
                                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform drop-shadow-sm">{reward.icon}</div>
                                  <h4 className="font-black text-slate-800 dark:text-white text-xs mb-1">{reward.title}</h4>
                                  <div className="flex items-center gap-1 bg-white/60 dark:bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                                      <span className="font-black text-amber-600 text-xs">{reward.cost}</span>
                                      <Coins className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  </div>
                                  
                                  {canAfford && (
                                      <div className="absolute top-2 left-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white">
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                      </div>
                                  )}
                              </button>
                          );
                      })}
                  </div>
              </div>
            </div>
          )}
      </Modal>

    </div>
  );
};

export default GamificationHub;