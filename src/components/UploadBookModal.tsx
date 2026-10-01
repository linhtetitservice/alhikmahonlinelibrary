import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Link2, Sparkles } from 'lucide-react';
import { Book, BookCategory } from '../types';
import { useAuth } from '../context/AuthContext';

interface UploadBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookUploaded: (newBook: Book) => void;
}

export const UploadBookModal: React.FC<UploadBookModalProps> = ({
  isOpen,
  onClose,
  onBookUploaded,
}) => {
  const { isAuthenticated, openAuthModal } = useAuth();

  const [uploadSource, setUploadSource] = useState<'file' | 'url'>('file');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState<BookCategory>('general');
  const [description, setDescription] = useState('');
  const [isMemberOnly, setIsMemberOnly] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [onlinePdfUrl, setOnlinePdfUrl] = useState<string>('');
  
  const [contentSample, setContentSample] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Read as Data URL so it is fully self-contained and persistent
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFileUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUseSampleUrl = (url: string, sampleTitle: string, sampleAuthor: string, cat: BookCategory) => {
    setUploadSource('url');
    setOnlinePdfUrl(url);
    setTitle(sampleTitle);
    setAuthor(sampleAuthor);
    setCategory(cat);
    setDescription('အွန်လိုင်းမှ တိုက်ရိုက်ဖတ်ရှုနိုင်သော အစ္စလာမ့် PDF ကျမ်းစာအုပ်');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('စာအုပ်အမည် ထည့်သွင်းပေးပါ');
      return;
    }

    const activePdfUrl = uploadSource === 'file' ? fileUrl : onlinePdfUrl.trim();

    if (!activePdfUrl && !contentSample.trim()) {
      setErrorMessage('PDF ဖိုင် သို့မဟုတ် အွန်လိုင်း PDF လင့်ခ် သို့မဟုတ် စာသား တစ်ခုခု ထည့်သွင်းပေးပါ');
      return;
    }

    setIsSubmitting(true);

    const categoryNamesMm: Record<BookCategory, string> = {
      all: 'အားလုံး',
      quran: 'ကျမ်းမြတ်ကုရ်အာန်',
      hadith: 'ဟဒီးဆ်တော်များ',
      fiqh: 'ဖိကာဟ်နှင့် တရားဓမ္မ',
      history: 'သမိုင်းနှင့် အတ္ထုပ္ပတ္တိ',
      aqeedah: 'အကီဒဟ်နှင့် ယုံကြည်ချက်',
      dua: 'ဒိုအာနှင့် ဇိကိရ်',
      family: 'မိသားစုနှင့် လူငယ်',
      general: 'အထွေထွေ ဗဟုသုတ',
    };

    const newBook: Book = {
      id: 'book-uploaded-' + Date.now(),
      title: title.trim(),
      author: author.trim() || 'အမည်မသိ ရေးသားသူ',
      category,
      categoryNameMm: categoryNamesMm[category] || 'အထွေထွေ',
      description: description.trim() || 'တင်ထားသော စာအုပ်နှင့် PDF မှတ်တမ်း',
      pagesCount: selectedFile ? 15 : 25,
      isMemberOnly,
      publishedYear: '၂၀၂၆',
      language: 'မြန်မာ',
      fileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : 'အွန်လိုင်း PDF',
      isPdfUploaded: !!activePdfUrl,
      pdfDataUrl: activePdfUrl || undefined,
      downloadUrl: activePdfUrl || undefined,
      chapters: contentSample.trim() ? [
        {
          id: 'up-1',
          title: 'အခန်း (၁) - စာအုပ် မိတ်ဆက်နှင့် အစပြုခြင်း',
          pageNumber: 1,
          content: contentSample.trim(),
        }
      ] : undefined,
    };

    onBookUploaded(newBook);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full my-6 overflow-hidden border border-stone-200">
        
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg">PDF တင်ပြီး အွန်လိုင်းဖတ်ရှုရန်</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs sm:text-sm">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Source Toggle: Local File vs Online URL */}
          <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setUploadSource('file')}
              className={`flex-1 py-1.5 rounded-md font-semibold text-xs transition-colors ${
                uploadSource === 'file' ? 'bg-white shadow-xs text-emerald-900' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ဖုန်း/ကွန်ပျူတာမှ PDF တင်မည်
            </button>
            <button
              type="button"
              onClick={() => setUploadSource('url')}
              className={`flex-1 py-1.5 rounded-md font-semibold text-xs transition-colors ${
                uploadSource === 'url' ? 'bg-white shadow-xs text-emerald-900' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              အွန်လိုင်း PDF လင့်ခ် ထည့်မည်
            </button>
          </div>

          {/* Upload Method 1: Local PDF File */}
          {uploadSource === 'file' && (
            <div>
              <label className="block font-medium text-stone-700 mb-1">
                မိမိစက်ထဲမှ PDF ဖိုင် ရွေးချယ်ပါ
              </label>
              <div className="border-2 border-dashed border-stone-300 hover:border-emerald-600 rounded-lg p-4 text-center cursor-pointer transition-colors bg-stone-50">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pdf-upload-input"
                />
                <label htmlFor="pdf-upload-input" className="cursor-pointer block">
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>{selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <FileText className="w-8 h-8 text-stone-400 mx-auto" />
                      <div className="text-xs font-semibold text-stone-700">
                        PDF ဖိုင် ရွေးချယ်ရန် ဤနေရာကို နှိပ်ပါ
                      </div>
                      <div className="text-[11px] text-stone-500">
                        တင်ပြီးသည်နှင့် ဝဘ်ဆိုက်ပေါ်တွင် ချက်ချင်း Online ဖတ်နိုင်ပါသည်
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Upload Method 2: Online PDF Link */}
          {uploadSource === 'url' && (
            <div className="space-y-2">
              <label className="block font-medium text-stone-700">
                အွန်လိုင်း PDF လိပ်စာ (Direct PDF URL)
              </label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={onlinePdfUrl}
                  onChange={(e) => setOnlinePdfUrl(e.target.value)}
                  placeholder="https://example.com/books/sample.pdf"
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none text-xs"
                />
              </div>

              {/* Sample Online Islamic PDFs */}
              <div className="space-y-1 pt-1">
                <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>စမ်းသပ်ဖတ်ရှုရန် နမူနာ PDF စာအုပ်များ:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUseSampleUrl(
                      'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                      'အစ္စလာမ့် အခြေခံ အသိပညာ လက်စွဲ (PDF)',
                      'ဒါရုလ်အိဖ်တာဟ် ပညာရှင်များ',
                      'fiqh'
                    )}
                    className="text-[11px] px-2 py-0.5 bg-stone-100 hover:bg-emerald-100 hover:text-emerald-900 rounded border border-stone-200 transition-colors"
                  >
                    + အခြေခံလက်စွဲ PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUseSampleUrl(
                      'https://pdfobject.com/pdf/sample.pdf',
                      'ကုရ်အာန်နှင့် ဟဒီးဆ်တော် လမ်းညွှန် (PDF စာအုပ်)',
                      'သာသနာ့ဓမ္မသတ်အဖွဲ့',
                      'hadith'
                    )}
                    className="text-[11px] px-2 py-0.5 bg-stone-100 hover:bg-emerald-100 hover:text-emerald-900 rounded border border-stone-200 transition-colors"
                  >
                    + ဟဒီးဆ်လမ်းညွှန် PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Book Title */}
          <div>
            <label className="block font-medium text-stone-700 mb-1">
              စာအုပ် / စာတမ်း အမည် <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ဥပမာ- ကုရ်အာန်အလင်းရောင် လက်စွဲ"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Author */}
          <div>
            <label className="block font-medium text-stone-700 mb-1">
              ရေးသားပြုစုသူ / ဆရာတော်
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="ဥပမာ- မုဖ်သီ ဦးအေးလွင်"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-medium text-stone-700 mb-1">
              ကဏ္ဍ (Category) ရွေးချယ်ပါ
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as BookCategory)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white cursor-pointer"
            >
              <option value="quran">ကျမ်းမြတ်ကုရ်အာန်နှင့် တဖ်စီရ်</option>
              <option value="hadith">ဟဒီးဆ်တော်များ</option>
              <option value="fiqh">ဖိကာဟ်နှင့် တရားဓမ္မ</option>
              <option value="history">သမိုင်းနှင့် အတ္ထုပ္ပတ္တိ</option>
              <option value="aqeedah">အကီဒဟ်နှင့် ယုံကြည်ချက်</option>
              <option value="dua">ဒိုအာနှင့် ဇိကိရ်</option>
              <option value="family">မိသားစုနှင့် လူငယ်</option>
              <option value="general">အထွေထွေ ဗဟုသုတ</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-stone-700 mb-1">
              အကျဉ်းချုပ် ရှင်းလင်းချက်
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="စာအုပ်၏ အဓိက အနှစ်ချုပ် သို့မဟုတ် ရည်ရွယ်ချက်..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Direct Text content alternative */}
          <div>
            <label className="block font-medium text-stone-700 mb-1">
              သို့မဟုတ် စာသား တိုက်ရိုက်ရိုက်ထည့်ရန် (Optional)
            </label>
            <textarea
              rows={2}
              value={contentSample}
              onChange={(e) => setContentSample(e.target.value)}
              placeholder="စာအုပ်ပါ အကြောင်းအရာများကို ဤနေရာတွင် တိုက်ရိုက်ကူးယူ ထည့်သွင်းနိုင်ပါသည်..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Member Only Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="member-only-toggle"
              checked={isMemberOnly}
              onChange={(e) => setIsMemberOnly(e.target.checked)}
              className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="member-only-toggle" className="text-xs font-medium text-stone-700 cursor-pointer">
              မန်ဘာဝင်များသာ ဖတ်ရှုခွင့်ပြုမည် (Members Only)
            </label>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg text-xs font-medium"
            >
              မလုပ်တော့ပါ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>စာအုပ်တင်၍ Online ဖတ်မည်</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
