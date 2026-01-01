import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className }) => {
  const { isLowPower } = useTheme();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  // Determine modal styling based on Performance Mode
  const overlayStyle = isLowPower 
    ? "bg-black/80" // Solid dark overlay for low power
    : "bg-black/20 backdrop-blur-sm"; // Soft Glass overlay for high power

  const contentStyle = isLowPower
    ? "bg-white dark:bg-[#1e1e1e] border-gray-200 dark:border-gray-700 shadow-xl" 
    : "glass-card border border-white/50 shadow-2xl backdrop-blur-2xl"; // Use global glass class

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 ${overlayStyle}`}
            onClick={onClose}
          />
          
          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`${contentStyle} w-[90%] rounded-[2.5rem] p-6 relative flex flex-col gap-4 max-h-[85vh] overflow-y-auto custom-scrollbar text-slate-800 dark:text-white ${className || 'max-w-[320px]'}`}
            onClick={e => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;