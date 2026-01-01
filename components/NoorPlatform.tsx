import React from 'react';
import { ExternalLink, Globe, Lock, ShieldCheck, ChevronRight, Smartphone, Monitor } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

const NoorPlatform: React.FC = () => {
  const url = "https://lms.moe.gov.om/student/users/login";

  const handleOpenPlatform = async () => {
    if (Capacitor.isNativePlatform()) {
        await Browser.open({ 
            url: url, 
            presentationStyle: 'fullscreen',
            toolbarColor: '#2563EB' // Blue brand color
        });
    } else {
        window.open(url, '_blank');
    }
  };

  // GLASSMORPHISM STYLES
  const styles = {
      card: 'glass-card border border-white/50 shadow-glass backdrop-blur-xl h-full flex flex-col relative overflow-hidden',
      iconContainer: 'w-32 h-32 rounded-[2rem] bg-white/40 dark:bg-white/10 flex items-center justify-center relative shadow-inner border border-white/30 backdrop-blur-md mb-6',
      glow: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl animate-pulse',
      button: 'group w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl p-2 pl-3 flex items-center transition-all shadow-lg shadow-blue-500/30 active:scale-95 border border-white/20',
      warningBox: 'bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl w-full backdrop-blur-sm',
  };

  return (
    <div className="h-full pb-20 animate-in fade-in zoom-in duration-500">
      <div className={styles.card}>
        
        {/* Header Section */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
            
            {/* Decorative Glow */}
            <div className={styles.glow}></div>

            {/* Main Icon Bubble */}
            <div className={styles.iconContainer}>
                {/* Fallback Icon logic handled via onError or default */}
                <img 
                    src="noor_logo.png" 
                    className="w-20 h-20 object-contain drop-shadow-md opacity-90" 
                    alt="شعار نور" 
                    onError={(e) => {
                        e.currentTarget.style.display='none'; 
                        const icon = document.getElementById('fallback-globe');
                        if(icon) icon.classList.remove('hidden');
                    }} 
                />
                <Globe id="fallback-globe" className="w-14 h-14 text-blue-600 dark:text-blue-400 hidden drop-shadow-sm" />
                
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-xl border-4 border-white/30 backdrop-blur-sm shadow-lg">
                    <Lock className="w-4 h-4 text-white" />
                </div>
            </div>
            
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 drop-shadow-sm">منصة نور التعليمية</h2>
            <p className="text-xs font-bold text-slate-500 dark:text-white/60 max-w-[280px] leading-relaxed bg-white/30 dark:bg-black/20 px-4 py-1 rounded-full border border-white/20">
               الوصول المباشر للمنصة عبر المتصفح الآمن
            </p>
        </div>

        {/* Action Section */}
        <div className="p-6 pt-0 flex flex-col items-center space-y-6 relative z-10">
            
            {/* Glass Warning Box */}
            <div className={styles.warningBox}>
               <div className="flex gap-3 items-start">
                  <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-amber-800 dark:text-amber-200/90 leading-relaxed text-right">
                     سيتم فتح المنصة في نافذة مخصصة ومشفرة. 
                     <br/>
                     للعودة للتطبيق، استخدم زر <strong>"Done"</strong> أو <strong>"إغلاق"</strong>.
                  </p>
               </div>
            </div>

            {/* Main CTA Button */}
            <button onClick={handleOpenPlatform} className={styles.button}>
               <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors backdrop-blur-sm border border-white/10">
                   <ExternalLink className="w-6 h-6 text-white" />
               </div>
               <div className="flex-1 text-right pr-4">
                   <span className="block text-sm font-black text-white">فتح موقع نور</span>
                   <span className="block text-[9px] font-bold text-blue-100 opacity-80">lms.moe.gov.om</span>
               </div>
               <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
            </button>

        </div>
        
        {/* Footer */}
        <div className="p-4 text-center border-t border-white/10 bg-white/10 dark:bg-black/10 backdrop-blur-sm">
            <p className="text-[9px] font-bold text-slate-400 dark:text-white/30 flex items-center justify-center gap-2">
               <Smartphone className="w-3 h-3" />
               متوافق مع الجوال
               <span className="w-1 h-1 rounded-full bg-blue-500"></span>
               <Monitor className="w-3 h-3" />
               الأجهزة اللوحية
            </p>
        </div>

      </div>
    </div>
  );
};

export default NoorPlatform;