import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book as BookIcon, 
  User, 
  Tag, 
  Heart, 
  Pencil, 
  Trash2, 
  MessageCircle, 
  Send,
  Loader2
} from 'lucide-react';
import { Book, Comment, OperationType } from '../types';
import { auth, db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { handleFirestoreError } from '../lib/errorUtils';

interface BookCardProps {
  key?: string;
  book: Book;
  isLiked?: boolean;
  onToggleLike?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function BookCard({ book, isLiked, onToggleLike, onEdit, onDelete }: BookCardProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const formattedDate = book.createdAt instanceof Date 
    ? book.createdAt.toLocaleDateString() 
    : (book.createdAt as any)?.toDate?.()?.toLocaleDateString() || 'N/A';

  const isOwner = auth.currentUser?.uid === book.addedBy;

  useEffect(() => {
    if (!book.id) return;

    setIsLoadingComments(true);
    const commentsRef = collection(db, 'books', book.id, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentsData);
      setIsLoadingComments(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `books/${book.id}/comments`);
      setIsLoadingComments(false);
    });

    return () => unsubscribe();
  }, [book.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newComment.trim() || !book.id) return;

    setIsSubmitting(true);
    try {
      const commentsRef = collection(db, 'books', book.id, 'comments');
      await addDoc(commentsRef, {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        userPhoto: auth.currentUser.photoURL || '',
        text: newComment.trim(),
        createdAt: serverTimestamp()
      });

      // Update comment count on book document
      const bookRef = doc(db, 'books', book.id);
      await updateDoc(bookRef, {
        commentCount: increment(1)
      });

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Could not add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -8, shadow: "0 25px 50px -12px rgb(0 0 0 / 0.15)" }}
      className="bg-white rounded-[2rem] overflow-hidden border border-black/5 flex flex-col h-full hover:shadow-2xl transition-all duration-300 relative group/card"
      id={`book-card-${book.id}`}
    >
      <div className="relative aspect-[3/4] bg-stone-50 overflow-hidden p-4">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover rounded-xl shadow-lg border-2 border-white"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-200 bg-stone-100/50 rounded-xl border-2 border-dashed border-stone-200">
            <BookIcon size={48} strokeWidth={1} />
          </div>
        )}
        <div className="absolute top-6 left-6 flex items-center gap-2 z-20">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike?.();
            }}
            className={`p-2.5 rounded-full backdrop-blur-md shadow-lg transition-all ${isLiked ? 'bg-red-500 text-white' : 'bg-white/90 text-stone-400 hover:text-red-500'}`}
          >
            <Heart size={18} fill={isLiked ? "currentColor" : "none"} strokeWidth={2.5} />
          </motion.button>

          <div 
            className="p-2.5 rounded-full bg-white/90 text-stone-400 shadow-lg flex items-center gap-1.5"
          >
            <MessageCircle size={18} strokeWidth={2.5} />
            {(book.commentCount || comments.length) > 0 && (
              <span className="text-[10px] font-black">{book.commentCount || comments.length}</span>
            )}
          </div>
          
          {isOwner && (
            <div className="flex gap-2">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
                className="p-2.5 rounded-full backdrop-blur-md shadow-lg transition-all bg-white/90 text-stone-400 hover:text-brand-orange"
              >
                <Pencil size={18} strokeWidth={2.5} />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
                className="p-2.5 rounded-full backdrop-blur-md shadow-lg transition-all bg-white/90 text-stone-400 hover:text-red-500"
              >
                <Trash2 size={18} strokeWidth={2.5} />
              </motion.button>
            </div>
          )}
        </div>
        <div className="absolute top-6 right-6">
          <span className="px-3 py-1 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
            {book.genre}
          </span>
        </div>
      </div>

      <div className="p-8 pt-4 flex flex-col flex-grow">
        <h3 className="font-black text-2xl text-brand-text leading-[1.3] mb-3 tracking-tight line-clamp-2 italic">
          {book.title}
        </h3>
        <p className="text-gray-400 text-sm mb-6 font-bold uppercase tracking-wider">{book.author}</p>
        
        {book.description && (
          <p className="text-gray-500 text-base line-clamp-3 mb-8 flex-grow font-medium leading-relaxed italic opacity-80">
            "{book.description}"
          </p>
        )}

        <div className="pt-4 border-t border-black/5 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 overflow-hidden text-[10px] border border-black/5">
                {book.addedByName?.charAt(0) || 'U'}
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
               @{book.addedByName?.split(' ')[0].toLowerCase() || 'reader'}
             </span>
          </div>
          <span className="text-[10px] font-black text-stone-200 uppercase tracking-widest">
            {formattedDate}
          </span>
        </div>
      </div>

      <div className="border-t border-black/5 bg-stone-50/50">
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-orange italic">Comments</span>
          </div>

          {/* Comment List */}
          <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
            {isLoadingComments ? (
              <div className="flex justify-center py-4">
                <Loader2 size={20} className="animate-spin text-stone-300" />
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 items-start group/comment">
                  <div className="w-8 h-8 rounded-full bg-white border border-black/5 overflow-hidden flex-shrink-0 text-[10px] flex items-center justify-center font-black text-stone-400">
                    {comment.userPhoto ? (
                      <img src={comment.userPhoto} alt={comment.userName} className="w-full h-full object-cover" />
                    ) : (
                      comment.userName.charAt(0)
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-brand-text italic">
                        {comment.userName.split(' ')[0]}
                      </span>
                      <span className="text-[8px] font-bold text-stone-300 uppercase tracking-widest">
                        {comment.createdAt instanceof Date 
                          ? comment.createdAt.toLocaleDateString()
                          : (comment.createdAt as any)?.toDate?.()?.toLocaleDateString() || 'Now'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed italic">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-300 italic">No comments yet</p>
              </div>
            )}
          </div>

          {/* Add Comment Input */}
          {auth.currentUser ? (
            <form onSubmit={handleAddComment} className="flex gap-2 mt-2 sticky bottom-0 bg-stone-50/50 py-2">
              <div className="flex-1 relative">
                <input 
                  type="text"
                  placeholder="Say something bold..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-white border border-black/5 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-brand-orange transition-colors italic"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                disabled={isSubmitting || !newComment.trim()}
                type="submit"
                className="p-2.5 bg-brand-orange text-white rounded-xl disabled:opacity-50 shadow-lg shadow-brand-orange/20"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </motion.button>
            </form>
          ) : (
            <div className="text-center py-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-300">Login to leave a comment</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
