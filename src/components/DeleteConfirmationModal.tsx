import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { translations, Language } from '../lib/translations';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  lang: Language;
}

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, title, lang }: DeleteConfirmationModalProps) {
  const t = translations[lang];
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-8 text-center"
          >
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            
            <h3 className="text-xl font-black text-brand-text mb-2 italic tracking-tighter">{t.confirmDelete}</h3>
            <p className="text-stone-500 text-sm font-bold mb-8 leading-relaxed">
              {t.deleteWarning} <br/>
              <span className="text-brand-text">"{title}"</span><br/>
              {t.undoneWarning}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={onConfirm}
                className="w-full py-4 bg-red-500 text-white font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
              >
                <Trash2 size={18} />
                {t.deletePost}
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 bg-stone-100 text-stone-500 font-black uppercase tracking-widest rounded-xl hover:bg-stone-200 transition-all"
              >
                {t.cancel}
              </button>
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-stone-300 hover:text-stone-500 transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
