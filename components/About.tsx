import React from 'react';
import { Users, Phone, Code2 } from 'lucide-react';
import BrandLogo from './BrandLogo';

const About: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 text-slate-800 dark:text-white animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Glass Logo Container */}
      <div className="w-36 h-36 bg-white/20 backdrop-blur-xl rounded-full shadow-2xl flex items-center justify-center mb-6 overflow-hidden border-4 border-white/30 p-2 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent opacity-50"></div>
          <BrandLogo className="w-full h-full relative z-10" showText={false} />
      </div>

      <h1 className="text-4xl font-black mb-1 tracking-tight text-slate-900 dark:text-white drop-shadow-sm">تطبيق راصد</h1>
      <p className="text-slate-500 dark:text-white/60 font-bold mb-8 bg-white/30 px-4 py-1 rounded-full border border-white/20 backdrop-blur-sm">الإصدار 3.4.0</p>
      
      {/* Main Glass Card */}
      <div className="glass-card border border-white/50 shadow-glass p-8 max-w-md w-full text-center relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>

          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-8 relative inline-block z-10">
              فريق العمل
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-70 rounded-full"></div>
          </h2>
          
          <div className="flex flex-col gap-4 relative z-10">
              {/* Developer Card */}
              <div className="flex items-center gap-4 p-4 bg-white/40 dark:bg-white/5 rounded-2xl border border-white/40 dark:border-white/10 hover:bg-white/60 transition-transform duration-300 hover:scale-[1.02] shadow-sm">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 shadow-inner shrink-0 backdrop-blur-md">
                      <Code2 className="w-7 h-7" />
                  </div>
                  <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-white/50 mb-0.5">إعداد وتصميم</p>
                      <h3 className="text-base font-black text-slate-800 dark:text-white">أ. محمد درويش الزعابي</h3>
                  </div>
              </div>

              {/* Contact Card */}
              <a href="tel:+96899834455" className="flex items-center gap-4 p-4 bg-white/40 dark:bg-white/5 rounded-2xl border border-white/40 dark:border-white/10 hover:bg-white/60 transition-transform duration-300 hover:scale-[1.02] shadow-sm cursor-pointer">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 shadow-inner shrink-0 backdrop-blur-md">
                      <Phone className="w-7 h-7" />
                  </div>
                  <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-white/50 mb-0.5">للتواصل والدعم الفني</p>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white dir-ltr" dir="ltr">+968 99834455</h3>
                  </div>
              </a>
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/20 relative z-10">
            <p className="text-xs text-slate-500 dark:text-white/60 font-bold leading-relaxed">
                تم تطوير هذا التطبيق لخدمة المعلم العماني وتسهيل المهام اليومية داخل الغرفة الصفية بأسلوب تقني حديث.
            </p>
          </div>
      </div>
      
      <p className="mt-8 text-[10px] font-bold text-slate-400 dark:text-white/30">
          جميع الحقوق محفوظة © {new Date().getFullYear()}
      </p>
    </div>
  );
};

export default About;