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

  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null;
    
    if ('files' in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    }

    if (file) {
      if (file.size > 700 * 1024) { // 700KB limit to account for base64 overhead (final size ~930KB)
        alert('รูปภาพต้องมีขนาดไม่เกิน 700KB เพื่อความรวดเร็วในการโหลด');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        setFormData({ ...formData, coverUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!formData.coverUrl) {
      alert('กรุณาเลือกรูปภาพหน้าปก');
      return;
    }

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
      setPreview(null);
      setFormData({
        title: '',
        author: '',
        genre: 'นิยาย',
        description: '',
        coverUrl: ''
      });
    } catch (error: any) {
      console.error('Submission error:', error);
      alert('ไม่สามารถเพิ่มหนังสือได้: ' + (error.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ'));
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
            <div className="p-10 pb-6 border-bottom border-black/5 flex items-center justify-between">
              <h2 className="font-black text-3xl tracking-tighter italic text-brand-text">แนะนำหนังสือใหม่</h2>
              <button
                onClick={onClose}
                className="p-3 hover:bg-black/5 rounded-full transition-colors text-stone-400 hover:text-brand-text"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 pt-0 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange ml-1">
                  รูปหน้าปก *
                </label>
                <div 
                  className={`relative group h-64 border-2 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center overflow-hidden bg-white ${preview ? 'border-brand-orange/50' : 'border-black/10 hover:border-brand-orange/50'}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleFileChange(e);
                  }}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {preview ? (
                    <>
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <Plus className="text-white" size={32} />
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 cursor-pointer">
                      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400 group-hover:text-brand-orange transition-colors">
                        <Plus size={32} />
                      </div>
                      <p className="text-sm font-bold text-stone-400 group-hover:text-brand-text transition-colors uppercase tracking-widest leading-relaxed">
                        คลิกหรือลากรูปภาพมาวาง<br/><span className="text-[10px] font-medium">(สูงสุด 1MB)</span>
                      </p>
                    </div>
                  )}
                  <input 
                    id="file-upload"
                    type="file" 
                    accept="image/*"
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </div>
              </div>

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

              <div className="pt-4 pb-10">
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
