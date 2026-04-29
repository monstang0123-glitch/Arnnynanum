import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  LogIn, 
  LogOut, 
  BookHeart, 
  Filter, 
  Loader2,
  Library
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  where,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Book, GENRES, Genre, OperationType } from './types';
import BookCard from './components/BookCard';
import AddBookModal from './components/AddBookModal';
import { handleFirestoreError } from './lib/errorUtils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<Genre | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likedBookIds, setLikedBookIds] = useState<string[]>([]);
  const [showOnlyLiked, setShowOnlyLiked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currUser) => {
      setUser(currUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const path = 'books';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Book[];
      setBooks(booksData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setLikedBookIds([]);
      return;
    }

    const path = 'likes';
    const q = query(collection(db, path), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = snapshot.docs.map(doc => doc.data().bookId);
      setLikedBookIds(ids);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           book.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = selectedGenre === 'All' || book.genre === selectedGenre;
      const matchesLiked = !showOnlyLiked || likedBookIds.includes(book.id || '');
      return matchesSearch && matchesGenre && matchesLiked;
    });
  }, [books, searchQuery, selectedGenre, showOnlyLiked, likedBookIds]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error('Sign in error:', error);
      alert(`ไม่สามารถเข้าสู่ระบบได้: ${error.message || 'กรุณาลองใหม่อีกครั้ง'}`);
    }
  };

  const handleToggleLike = async (bookId: string) => {
    if (!user) {
      handleLogin();
      return;
    }

    const likeId = `${user.uid}_${bookId}`;
    const likeRef = doc(db, 'likes', likeId);

    try {
      if (likedBookIds.includes(bookId)) {
        await deleteDoc(likeRef);
      } else {
        await setDoc(likeRef, {
          userId: user.uid,
          bookId: bookId,
          createdAt: serverTimestamp()
        });
      }
    } catch (error: any) {
      console.error('Like toggle error:', error);
      alert('ไม่สามารถบันทึกถูกใจได้: ' + (error.message || 'เกิดข้อผิดพลาด'));
      handleFirestoreError(error, OperationType.WRITE, 'likes');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans selection:bg-brand-orange selection:text-white flex flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-40 bg-brand-bg/80 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-10 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-black tracking-tighter uppercase">
              อ่าน<span className="text-brand-orange">นี่</span>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-6 md:mx-12 hidden sm:block">
            <div className="relative flex items-center group">
              <Search className="absolute left-4 w-5 h-5 opacity-40 group-focus-within:text-brand-orange transition-colors" />
              <input 
                type="text"
                placeholder="ค้นหาชื่อหนังสือที่อยากอ่าน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-black/10 rounded-full py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-brand-orange transition-colors shadow-sm font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            {user ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="hidden sm:flex items-center gap-2 bg-brand-orange text-white px-5 py-2.5 rounded-full text-xs font-black hover:bg-orange-700 transition-all shadow-lg shadow-brand-orange/20 uppercase tracking-widest"
                >
                  <Plus size={16} strokeWidth={3} />
                  แนะนำหนังสือ
                </button>
                <div className="hidden lg:flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">READER</p>
                    <p className="text-sm font-bold text-brand-text leading-none">{user.displayName?.split(' ')[0]}</p>
                  </div>
                  {user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || ''} 
                      className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                    />
                  )}
                </div>
                <button 
                  onClick={logout}
                  className="p-2.5 hover:bg-black/5 rounded-full transition-colors text-stone-400 hover:text-brand-text"
                  title="Log out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="bg-brand-orange text-white px-6 py-3 rounded-full text-sm font-black hover:bg-orange-700 transition-all flex items-center gap-2 shadow-lg shadow-brand-orange/20"
              >
                <LogIn size={18} />
                <span className="uppercase tracking-tight">เข้าสู่ระบบ</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full">
        {/* Sidebar: Categories */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-black/5 p-6 md:p-10 flex flex-col gap-6">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange mb-2">ของฉัน</div>
          <ul className="flex flex-col gap-4 mb-4">
            <li 
              onClick={() => {
                setShowOnlyLiked(!showOnlyLiked);
                if (!showOnlyLiked) setSelectedGenre('All');
              }}
              className={`font-black text-lg cursor-pointer whitespace-nowrap transition-all flex items-center gap-3 ${showOnlyLiked ? 'text-brand-orange translate-x-1' : 'text-gray-400 hover:text-brand-text'}`}
            >
              <BookHeart size={20} fill={showOnlyLiked ? "currentColor" : "none"} />
              รายการที่ถูกใจ
            </li>
          </ul>

          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-orange mb-2">หมวดหมู่</div>
          <ul className="flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 scrollbar-hide">
            <li 
              onClick={() => {
                setSelectedGenre('All');
                setShowOnlyLiked(false);
              }}
              className={`font-black text-lg cursor-pointer whitespace-nowrap transition-all flex items-center gap-2 ${selectedGenre === 'All' && !showOnlyLiked ? 'text-brand-text translate-x-1' : 'text-gray-400 hover:text-brand-text'}`}
            >
              <span className={selectedGenre === 'All' && !showOnlyLiked ? 'block' : 'hidden'}>→</span>
              # ทั้งหมด
            </li>
            {GENRES.map(genre => (
              <li 
                key={genre}
                onClick={() => {
                  setSelectedGenre(genre);
                  setShowOnlyLiked(false);
                }}
                className={`font-black text-lg cursor-pointer whitespace-nowrap transition-all flex items-center gap-2 ${selectedGenre === genre ? 'text-brand-text translate-x-1' : 'text-gray-400 hover:text-brand-text'}`}
              >
                <span className={selectedGenre === genre ? 'block' : 'hidden'}>→</span>
                # {genre}
              </li>
            ))}
          </ul>
        </aside>

        {/* Content Area */}
        <section className="flex-1 p-6 md:p-10 flex flex-col gap-10">
          
          {/* Featured Hero Area (Static for now as per theme) */}
          <div className="relative bg-white rounded-[2.5rem] p-8 md:p-12 flex flex-col lg:flex-row items-center justify-between border border-black/5 overflow-hidden group shadow-sm">
            <div className="relative z-10 max-w-lg mb-8 lg:mb-0">
              <div className="inline-block bg-black text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">ไฮไลท์ประจำสัปดาห์</div>
              <h2 className="text-5xl md:text-7xl font-black leading-[1.1] md:leading-[1.15] tracking-tighter mb-6 italic">
                ค้นหาเล่ม<br/><span className="text-brand-orange">โปรด</span> ถัดไป
              </h2>
              <p className="text-gray-500 text-base leading-relaxed mb-8 font-medium">แบ่งปันความประทับใจจากการอ่านร่วมกับคอมมูนิตี้คนรักตัวหนังสือ</p>
              {!user ? (
                <button 
                  onClick={handleLogin}
                  className="bg-black text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:scale-105 transition-transform shadow-xl shadow-black/10 uppercase tracking-tight"
                >
                  เริ่มร่วมแบ่งปัน
                  <Search size={20} />
                </button>
              ) : (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-brand-orange text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:scale-105 transition-transform shadow-xl shadow-brand-orange/20 uppercase tracking-tight"
                >
                  เพิ่มการแนะนำของคุณ
                  <Plus size={20} strokeWidth={3} />
                </button>
              )}
            </div>
            <div className="relative">
              <div className="w-48 h-64 bg-stone-100 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center border-4 border-white transform rotate-6 group-hover:rotate-2 transition-transform duration-500">
                <div className="bg-brand-orange w-full h-full p-6 flex flex-col justify-between text-white">
                  <div className="text-3xl font-black leading-[0.9] tracking-tighter">READ<br/>NEXT</div>
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Community Library</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations Feed */}
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black italic tracking-tight uppercase">แนะนำโดยเพื่อนนักอ่าน</h2>
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest">
                {filteredBooks.length} เล่ม
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-300 gap-4">
                <Loader2 className="animate-spin" size={40} />
              </div>
            ) : filteredBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredBooks.map((book) => (
                    <BookCard 
                      key={book.id} 
                      book={book} 
                      isLiked={likedBookIds.includes(book.id || '')}
                      onToggleLike={() => handleToggleLike(book.id || '')}
                    />
                  ))}
                </AnimatePresence>

                {/* Upload Button Card */}
                {user && (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsModalOpen(true)}
                    className="bg-orange-50/50 p-6 rounded-[2rem] border-2 border-dashed border-brand-orange/30 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-orange-100/50 transition-colors h-full min-h-[320px]"
                  >
                    <div className="w-16 h-16 bg-brand-orange text-white rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-brand-orange/20">
                      <Plus size={32} strokeWidth={3} />
                    </div>
                    <div className="text-sm font-black text-brand-orange uppercase tracking-widest leading-relaxed">
                      ลงรูปแนะนำ<br/>หนังสือของคุณ
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-stone-300 gap-6 bg-white border border-black/5 rounded-[2.5rem]">
                <div className="p-8 bg-brand-bg rounded-full">
                  <BookHeart size={56} strokeWidth={1} />
                </div>
                <div className="text-center space-y-4">
                  <div>
                    <p className="font-serif text-3xl text-stone-400 italic font-black">ยังไม่พบผลลัพธ์</p>
                    <p className="text-xs font-black uppercase tracking-widest text-stone-300">ลองเปลี่ยนหมวดหมู่หรือคำค้นหาดูนะ</p>
                  </div>
                  {user && (
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="bg-brand-orange text-white px-8 py-3 rounded-full text-xs font-black hover:bg-orange-700 transition-all shadow-lg shadow-brand-orange/20 uppercase tracking-widest mx-auto flex items-center gap-2"
                    >
                      <Plus size={16} strokeWidth={3} />
                      เริ่มแนะนำหนังสือเล่มแรกเลย
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Sticky Status Bar */}
      <footer className="bg-white border-t border-black/5 px-4 md:px-10 py-5 flex flex-col md:flex-row items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] gap-4">
        <div>สถิติวันนี้: แนะนำ {books.length} เล่ม | ระบบพร้อมใช้งาน</div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span> ONLINE</span>
          <span>v. 1.0.0 (Bold Edition)</span>
        </div>
      </footer>

      {/* Modal */}
      <AddBookModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {}}
      />
    </div>
  );
}
