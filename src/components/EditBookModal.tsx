import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Book as BookIcon, Loader2, Crop, Plus } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import Cropper, { Area } from 'react-easy-crop';
import { db, auth } from '../lib/firebase';
import { GENRES, Genre, OperationType, Book } from '../types';
import { handleFirestoreError } from '../lib/errorUtils';
import getCroppedImg from '../lib/cropImage';

interface EditBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  book: Book | null;
}

export default function EditBookModal({ isOpen, onClose, onSuccess, book }: EditBookModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: 'นิยาย' as Genre,
    description: '',
    coverUrl: ''
  });

  const [preview, setPreview] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        genre: book.genre,
        description: book.description || '',
        coverUrl: book.coverUrl || ''
      });
      setPreview(book.coverUrl || null);
    }
  }, [book]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null;
    
    if ('target' in e && 'files' in e.target && e.target.files) {
      file = e.target.files[0];
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      file = e.dataTransfer.files[0];
    }

    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('รูปภาพต้องมีขนาดไม่เกิน 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleApplyCrop = async () => {
    if (imageToCrop && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
        setPreview(croppedImage);
        setFormData({ ...formData, coverUrl: croppedImage });
        setImageToCrop(null);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !book || !book.id) return;
    if (!formData.coverUrl) {
      alert('กรุณาเลือกรูปภาพหน้าปก');
      return;
    }

    setLoading(true);
    const path = 'books';
    try {
      const bookRef = doc(db, path, book.id);
      await updateDoc(bookRef, {
        ...formData,
        // addedBy and createdAt are immutable and already exist in the document.
        // Merging happens in Firestore rules (request.resource.data).
        // Sending them back can cause precision issues with Timestamps.
        updatedAt: new Date() // Optional: add an updatedAt field if desired
      });
      alert('บันทึกการแก้ไขเรียบร้อยแล้ว');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Update error:', error);
      alert('ไม่สามารถแก้ไขข้อมูลได้: ' + (error.message || 'เกิดข้อผิดพลาด'));
      handleFirestoreError(error, OperationType.UPDATE, path);
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
          >
            <div className="p-10 pb-6 border-bottom border-black/5 flex items-center justify-between">
              <h2 className="font-black text-3xl tracking-tighter italic text-brand-text">แก้ไขคำแนะนำ</h2>
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
                  onClick={() => document.getElementById('edit-file-upload')?.click()}
                >
                  {preview ? (
                    <>
                      <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <Plus className="text-white" size={32} />
                        <span className="text-white text-[10px] font-black uppercase">เปลี่ยนรูป</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 cursor-pointer">
                      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400 group-hover:text-brand-orange transition-colors">
                        <Plus size={32} />
                      </div>
                      <p className="text-sm font-bold text-stone-400 group-hover:text-brand-text transition-colors uppercase tracking-widest leading-relaxed">
                        คลิกหรือลากรูปภาพมาวาง<br/><span className="text-[10px] font-medium">(สูงสุด 2MB)</span>
                      </p>
                    </div>
                  )}
                  <input 
                    id="edit-file-upload"
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
                      <Save size={24} strokeWidth={3} />
                      บันทึกการแก้ไข
                    </>
                  )}
                </button>
              </div>
            </form>

            <AnimatePresence>
              {imageToCrop && (
                <motion.div 
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="absolute inset-0 z-50 bg-black flex flex-col"
                >
                  <div className="relative flex-1">
                    <Cropper
                      image={imageToCrop}
                      crop={crop}
                      zoom={zoom}
                      aspect={3 / 4}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                    />
                  </div>
                  <div className="p-8 bg-black/80 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">ซูม</label>
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full accent-brand-orange"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => setImageToCrop(null)}
                        className="flex-1 py-4 text-white font-black uppercase tracking-widest bg-white/10 rounded-xl hover:bg-white/20 transition-all"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={handleApplyCrop}
                        className="flex-1 py-4 bg-brand-orange text-white font-black uppercase tracking-widest rounded-xl hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Crop size={20} />
                        ยืนยันรูปภาพ
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
