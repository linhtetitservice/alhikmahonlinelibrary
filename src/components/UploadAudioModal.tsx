import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Music, 
  Link as LinkIcon, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Mic, 
  FileAudio,
  User,
  Tag
} from 'lucide-react';
import { AudioSermon } from '../types';
import { addAudioSermonToFirestore } from '../services/dbService';

interface UploadAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAudioUploaded: (sermon: AudioSermon) => void;
  uploaderName?: string;
}

export const UploadAudioModal: React.FC<UploadAudioModalProps> = ({
  isOpen,
  onClose,
  onAudioUploaded,
  uploaderName = 'အစ္စလာမ်မီ ဓမ္မမိတ်ဆွေ',
}) => {
  const [activeUploadType, setActiveUploadType] = useState<'file' | 'url'>('file');
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [category, setCategory] = useState<'bayan' | 'quran' | 'hadith' | 'dua' | 'history'>('bayan');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioDuration, setAudioDuration] = useState<string>('00:00');
  const [fileSizeText, setFileSizeText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const categoryNamesMm: Record<string, string> = {
    bayan: 'တရားဒေသနာ (Bayan)',
    quran: 'ကုရ်အာန် ရွတ်ဖတ်သံ',
    hadith: 'ဟဒီးဆ်တော်များ',
    dua: 'ဒိုအာနှင့် ဇိကိရ်',
    history: 'သမိုင်းနှင့် အတ္ထုပ္ပတ္တိ',
  };

  // Handle local audio file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|aac|ogg|opus)$/i)) {
      setErrorMessage('ကျေးဇူးပြု၍ အသံဖိုင် (MP3, WAV, M4A, AAC, OGG) သာ ရွေးချယ်ပေးပါ');
      return;
    }

    setSelectedFile(file);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setFileSizeText(`${sizeMb} MB`);

    if (!title) {
      // Auto-populate title from file name
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName);
    }

    // Attempt to calculate duration using temporary Audio object
    try {
      const audioUrl = URL.createObjectURL(file);
      const audio = new Audio(audioUrl);
      audio.onloadedmetadata = () => {
        const mins = Math.floor(audio.duration / 60);
        const secs = Math.floor(audio.duration % 60);
        const pad = (n: number) => String(n).padStart(2, '0');
        setAudioDuration(`${pad(mins)}:${pad(secs)}`);
      };
    } catch {
      setAudioDuration('00:00');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('တရားတော်ခေါင်းစဉ် ထည့်သွင်းပေးပါ');
      return;
    }
    if (!speaker.trim()) {
      setErrorMessage('ဟောကြားသူ သို့မဟုတ် ရွတ်ဖတ်သူ ဆရာတော်အမည် ထည့်သွင်းပေးပါ');
      return;
    }

    let finalAudioUrl = '';

    if (activeUploadType === 'file') {
      if (!selectedFile) {
        setErrorMessage('အသံဖိုင် ရွေးချယ်ပေးပါ');
        return;
      }

      setIsProcessing(true);
      setUploadProgress(30);

      try {
        // Read file into Data URL
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('ဖိုင်ဖတ်ရှုမှု မအောင်မြင်ပါ'));
          reader.readAsDataURL(selectedFile);
        });

        finalAudioUrl = dataUrl;
        setUploadProgress(70);
      } catch {
        setErrorMessage('အသံဖိုင် စီမံဆောင်ရွက်ရာတွင် အခက်အခဲရှိနေပါသည်');
        setIsProcessing(false);
        return;
      }
    } else {
      if (!externalUrl.trim()) {
        setErrorMessage('အသံဖိုင် လင့်ခ် (URL) ထည့်သွင်းပေးပါ');
        return;
      }
      finalAudioUrl = externalUrl.trim();
      setIsProcessing(true);
    }

    try {
      const newSermon: AudioSermon = {
        id: `sermon-${Date.now()}`,
        title: title.trim(),
        speaker: speaker.trim(),
        category,
        categoryMm: categoryNamesMm[category] || 'တရားဒေသနာ',
        description: description.trim() || 'အစ္စလာမ်မီ တရားဒေသနာတော် အသံဖိုင်။',
        audioUrl: finalAudioUrl,
        duration: audioDuration || '00:00',
        publishedDate: `${new Date().getFullYear()} ခုနှစ်`,
        fileSize: fileSizeText || (activeUploadType === 'url' ? 'အွန်လိုင်း' : '1.5 MB'),
        isCustomUploaded: true,
        listensCount: 1,
        uploadedBy: uploaderName,
        createdAt: new Date().toISOString(),
      };

      await addAudioSermonToFirestore(newSermon);
      setUploadProgress(100);
      onAudioUploaded(newSermon);
      onClose();
    } catch {
      setErrorMessage('ဒေတာဘေ့စ်သို့ သိမ်းဆည်းရာတွင် အခက်အခဲရှိနေပါသည်။');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-stone-200 animate-in fade-in-50 duration-200 my-8">
        
        {/* Header */}
        <div className="bg-emerald-950 text-white p-5 flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                အစ္စလာမ်မီ တရားဒေသနာ အသံဖိုင်တင်မည်
              </h2>
              <p className="text-xs text-emerald-300">
                အသံဖိုင် MP3/WAV/M4A သို့မဟုတ် လင့်ခ်ဖြင့် အများပြည်သူ နားဆင်နိုင်ရန် တင်သွင်းပါ
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: File Upload or Online URL */}
        <div className="flex border-b border-stone-200 bg-stone-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveUploadType('file')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeUploadType === 'file'
                ? 'bg-white text-emerald-900 border-b-2 border-emerald-800'
                : 'text-stone-600 hover:text-emerald-900'
            }`}
          >
            <FileAudio className="w-4 h-4" />
            <span>ဖုန်း/ကွန်ပျူတာမှ အသံဖိုင် တိုက်ရိုက်တင်မည်</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveUploadType('url')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeUploadType === 'url'
                ? 'bg-white text-emerald-900 border-b-2 border-emerald-800'
                : 'text-stone-600 hover:text-emerald-900'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>အသံဖိုင် လင့်ခ် (URL / Drive) ထည့်မည်</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Mode 1: File Selection */}
          {activeUploadType === 'file' ? (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                အသံဖိုင် ရွေးချယ်ပါ (MP3, WAV, M4A, OGG) *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
                onChange={handleFileChange}
                className="hidden"
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-600 bg-emerald-50/40 rounded-xl p-5 text-center cursor-pointer transition-colors"
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3 text-emerald-900">
                    <FileAudio className="w-8 h-8 text-emerald-700 shrink-0" />
                    <div className="text-left">
                      <div className="text-xs sm:text-sm font-bold truncate max-w-[260px]">
                        {selectedFile.name}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        အရွယ်အစား: {fileSizeText} {audioDuration !== '00:00' && `· ကြာချိန်: ${audioDuration}`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
                    <span className="text-xs sm:text-sm font-semibold text-emerald-950 block">
                      အသံဖိုင် ရွေးချယ်ရန် ဤနေရာကို နှိပ်ပါ
                    </span>
                    <span className="text-[11px] text-stone-500 mt-1 block">
                      MP3, M4A, WAV, AAC ဖော်မတ်များ လက်ခံပါသည်
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Mode 2: Audio URL */
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                အသံဖိုင် လင့်ခ် (Direct MP3 URL သို့မဟုတ် Drive Link) *
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://example.com/audio/bayan.mp3"
                className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              တရားတော် / ဒေသနာတော် ခေါင်းစဉ် *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ဥပမာ - စိတ်နှလုံးငြိမ်းချမ်းမှု မြန်မာဘာသာ တရားဒေသနာ"
              className="w-full px-3.5 py-2.5 border border-stone-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              required
            />
          </div>

          {/* Speaker / Scholar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                ဟောကြားသူ / ရွတ်ဖတ်သူ ဆရာတော် *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={speaker}
                  onChange={(e) => setSpeaker(e.target.value)}
                  placeholder="ဥပမာ - မောင်လာနာ ဦးအေးလွင်"
                  className="w-full pl-9 pr-3.5 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                အမျိုးအစား *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer bg-white"
              >
                <option value="bayan">တရားဒေသနာ (Bayan)</option>
                <option value="quran">ကုရ်အာန် ရွတ်ဖတ်သံ</option>
                <option value="hadith">ဟဒီးဆ်တော်များ</option>
                <option value="dua">ဒိုအာနှင့် ဇိကိရ်</option>
                <option value="history">သမိုင်းနှင့် အတ္ထုပ္ပတ္တိ</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              တရားတော် အကျဉ်းချုပ် ရှင်းလင်းချက် (စိတ်ကြိုက်)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="တရားတော်တွင် ပါဝင်သော အဓိက သာသနာ့လမ်းညွှန်ချက် အကျဉ်း..."
              className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none resize-none"
            />
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-800 text-xs font-semibold rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            >
              ပယ်ဖျက်မည်
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white rounded-lg text-xs font-bold shadow transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>တင်သွင်းနေပါသည်...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>အသံဖိုင် တင်မည်</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
