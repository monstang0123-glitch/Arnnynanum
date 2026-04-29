import { motion } from 'motion/react';
import { Book as BookIcon, User, Tag, Heart } from 'lucide-react';
import { Book } from '../types';

interface BookCardProps {
  book: Book;
  isLiked?: boolean;
  onToggleLike?: () => void;
}

export default function BookCard({ book, isLiked, onToggleLike }: BookCardProps) {
  const formattedDate = book.createdAt instanceof Date 
    ? book.createdAt.toLocaleDateString() 
    : (book.createdAt as any)?.toDate?.()?.toLocaleDateString() || 'N/A';

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
        </div>
        <div className="absolute top-6 right-6">
          <span className="px-3 py-1 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
            {book.genre}
          </span>
        </div>
      </div>

      <div className="p-6 pt-2 flex flex-col flex-grow">
        <h3 className="font-black text-xl text-brand-text leading-[1.3] mb-2 tracking-tight line-clamp-2 italic">
          {book.title}
        </h3>
        <p className="text-gray-400 text-xs mb-4 font-bold uppercase tracking-wider">{book.author}</p>
        
        {book.description && (
          <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-grow font-medium leading-relaxed italic opacity-80">
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
    </motion.div>
  );
}
