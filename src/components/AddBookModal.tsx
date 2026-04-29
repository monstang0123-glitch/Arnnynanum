import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Book as BookIcon, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { GENRES, Genre, OperationType } from '../types';
import { handleFirestoreError } from '../lib/errorUtils';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddBookModal({ isOpen, onClose, onSuccess }: AddBookModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: 'นิยาย' as Genre,
    description: '',
    coverUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    const path = 'books';
    try {
      await addDoc(collection(db, path), {
        ...formData,
        addedBy: auth.currentUser.uid,
        addedByName: auth.currentUser.displayName,
        addedByEmail: auth.currentUser.email,
        createdAt: serverTimestamp()
      });
      onSuccess();
      onClose();
      setFormData({
        title: '',
        author: '',
        genre: 'Fiction',
        description: '',
        coverUrl: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-brand-bg w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-black/5"
            id="add-book-modal"
          >
            <div className="p-10 border-bottom border-black/5 flex items-center justify-between">
              <h2 className="font-black text-3xl tracking-tighter italic text-brand-text">แนะนำหนังสือใหม่</h2>
              <button
                onClick={onClose}
                className="p-3 hover:bg-black/5 rounded-full transition-colors text-stone-400 hover:text-brand-text"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 pt-0 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange ml-1">
                  ชื่อหนังสือ *
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="เช่น มหัศจรรย์ร้านชำของคุณนามิยะ"
                  className="w-full px-6 py-4 bg-white border border-black/10 rounded-2xl focus:ring-4 focus:ring-brand-orange/5 focus:border-brand-orange transition-all font-bold text-brand-text placeholder:text-stone-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange ml-1">
                    ผู้เขียน *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="ชื่อนักเขียน"
                    className="w-full px-6 py-4 bg-white border border-black/10 rounded-2xl focus:ring-4 focus:ring-brand-orange/5 focus:border-brand-orange transition-all font-bold text-brand-text placeholder:text-stone-300"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange ml-1">
                    หมวดหมู่ *
                  </label>
                  <select
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value as Genre })}
                    className="w-full px-6 py-4 bg-white border border-black/10 rounded-2xl focus:ring-4 focus:ring-brand-orange/5 focus:border-brand-orange transition-all font-bold text-brand-text appearance-none cursor-pointer"
                  >
                    {GENRES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange ml-1">
                  ทำไมถึงแนะนำเล่มนี้?
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="แชร์ความประทับใจสั้นๆ..."
                  className="w-full px-6 py-4 bg-white border border-black/10 rounded-2xl focus:ring-4 focus:ring-brand-orange/5 focus:border-brand-orange transition-all font-bold text-brand-text placeholder:text-stone-300 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange ml-1">
                  ลิงก์รูปหน้าปก (URL)
                </label>
                <input
                  type="url"
                  value={formData.coverUrl}
                  onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                  placeholder="https://example.com/cover.jpg"
                  className="w-full px-6 py-4 bg-white border border-black/10 rounded-2xl focus:ring-4 focus:ring-brand-orange/5 focus:border-brand-orange transition-all font-bold text-brand-text placeholder:text-stone-300"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-orange text-white py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-brand-orange/20"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      <Plus size={24} strokeWidth={3} />
                      เพิ่มคำแนะนำ
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
