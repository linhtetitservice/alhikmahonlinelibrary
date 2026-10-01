import React from 'react';
import { 
  X, 
  User, 
  Bookmark, 
  Clock, 
  Heart, 
  HelpCircle, 
  LogOut, 
  BookOpen, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Book } from '../types';
import { toMyanmarDigits } from '../utils/hijriCalendar';

interface MemberProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onOpenBook: (book: Book, pageNumber?: number) => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  isOpen,
  onClose,
  books,
  onOpenBook,
}) => {
  const { user, logout, submittedQuestions } = useAuth();

  if (!isOpen || !user) return null;

  const favoriteBooks = books.filter((b) => user.favoriteBookIds.includes(b.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-6 overflow-hidden border border-stone-200">
        
        {/* User Card Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full border-2 border-amber-400 object-cover shadow-md"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xl text-white">{user.name}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 font-bold">
                  {user.roleNameMm}
                </span>
              </div>
              <p className="text-xs text-stone-300">{user.email}</p>
              <div className="text-[11px] text-emerald-300">
                အဖွဲ့ဝင် စတင်သည့်ကာလ: {user.joinedDate}
              </div>
            </div>
          </div>
        </div>

        {/* Member Data Tabs */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          
          {/* Section 1: Bookmarks */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-900 flex items-center gap-2 text-sm border-b border-stone-100 pb-2">
              <Bookmark className="w-4 h-4 text-amber-500" />
              <span>မှတ်သားထားသော စာမျက်နှာများ ({toMyanmarDigits(user.bookmarks.length)})</span>
            </h4>

            {user.bookmarks.length === 0 ? (
              <p className="text-xs text-stone-500 italic">မှတ်သားထားသော စာမျက်နှာ မရှိသေးပါ။</p>
            ) : (
              <div className="space-y-2">
                {user.bookmarks.map((bm, idx) => {
                  const book = books.find((b) => b.id === bm.bookId);
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 flex items-center justify-between gap-3 hover:bg-emerald-50/40 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-stone-900">{book?.title || 'စာအုပ်'}</div>
                        <div className="text-[11px] text-stone-500">
                          စာမျက်နှာ {toMyanmarDigits(bm.pageNumber)} · {bm.note || 'အမှတ်အသား'}
                        </div>
                      </div>

                      {book && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenBook(book, bm.pageNumber);
                          }}
                          className="px-3 py-1 bg-emerald-800 text-white rounded text-xs hover:bg-emerald-900 flex items-center gap-1 cursor-pointer"
                        >
                          <span>ဖတ်မည်</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Reading History */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-900 flex items-center gap-2 text-sm border-b border-stone-100 pb-2">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span>မကြာသေးမီက ဖတ်ရှုခဲ့မှု မှတ်တမ်း</span>
            </h4>

            {user.readingHistory.length === 0 ? (
              <p className="text-xs text-stone-500 italic">ဖတ်ရှုမှု မှတ်တမ်း မရှိသေးပါ။</p>
            ) : (
              <div className="space-y-2">
                {user.readingHistory.map((rh, idx) => {
                  const book = books.find((b) => b.id === rh.bookId);
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-stone-900">{book?.title || 'စာအုပ်'}</div>
                        <div className="text-[11px] text-stone-500">
                          နောက်ဆုံးဖတ်ခဲ့သော စာမျက်နှာ: {toMyanmarDigits(rh.lastPage)} ({rh.lastReadDate})
                        </div>
                      </div>

                      {book && (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenBook(book, rh.lastPage);
                          }}
                          className="px-3 py-1 bg-emerald-800 text-white rounded text-xs hover:bg-emerald-900 flex items-center gap-1 cursor-pointer"
                        >
                          <span>ဆက်ဖတ်ရန်</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Favorite Books */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-900 flex items-center gap-2 text-sm border-b border-stone-100 pb-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>အနှစ်သက်ဆုံး စာအုပ်များ ({toMyanmarDigits(favoriteBooks.length)})</span>
            </h4>

            {favoriteBooks.length === 0 ? (
              <p className="text-xs text-stone-500 italic">အနှစ်သက်ဆုံး စာအုပ် မထည့်သွင်းရသေးပါ။</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {favoriteBooks.map((fb) => (
                  <div
                    key={fb.id}
                    onClick={() => {
                      onClose();
                      onOpenBook(fb);
                    }}
                    className="p-3 bg-stone-50 rounded-lg border border-stone-200 hover:border-emerald-500 cursor-pointer transition-colors"
                  >
                    <div className="font-bold text-stone-900 line-clamp-1">{fb.title}</div>
                    <div className="text-[11px] text-stone-500 truncate">{fb.author}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Submitted Questions */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-900 flex items-center gap-2 text-sm border-b border-stone-100 pb-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>မေးမြန်းထားသော ဖသ်ဝါမေးခွန်းများ</span>
            </h4>

            {submittedQuestions.length === 0 ? (
              <p className="text-xs text-stone-500 italic">မေးမြန်းထားသော မေးခွန်း မရှိသေးပါ။</p>
            ) : (
              <div className="space-y-3">
                {submittedQuestions.map((q) => (
                  <div key={q.id} className="p-3.5 bg-stone-50 rounded-lg border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-700">မေးခွန်း:</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        q.status === 'answered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {q.status === 'answered' ? 'ဖြေကြားပြီး' : 'စိစစ်ဆဲ'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-800 font-medium">{q.question}</p>
                    {q.answer && (
                      <div className="p-2.5 bg-emerald-50 rounded border border-emerald-100 text-xs text-emerald-950">
                        <strong className="block text-[11px] text-emerald-800 mb-0.5">ဓမ္မသတ်အဖြေ-</strong>
                        <span>{q.answer}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer / Logout Button */}
        <div className="bg-stone-50 p-4 border-t border-stone-200 flex justify-between items-center">
          <span className="text-xs text-stone-500">အကောင့်စီမံခန့်ခွဲမှု</span>
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>အကောင့်မှ ထွက်မည် (Logout)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
