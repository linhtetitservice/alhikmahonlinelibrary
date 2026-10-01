import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Search, 
  Upload, 
  Music, 
  Headphones, 
  Download, 
  Share2, 
  Check, 
  Clock, 
  User, 
  Sparkles,
  Radio,
  FileAudio,
  ListPlus,
  ListMusic,
  SkipForward,
  SkipBack,
  Repeat,
  Repeat1,
  Shuffle,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  Layers
} from 'lucide-react';
import { AudioSermon } from '../types';
import { incrementAudioListenCount } from '../services/dbService';

interface AudioSectionProps {
  audios: AudioSermon[];
  onOpenUploadAudio: () => void;
  onOpenShareModal: () => void;
}

export const AudioSection: React.FC<AudioSectionProps> = ({
  audios,
  onOpenUploadAudio,
  onOpenShareModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Audio Player State
  const [currentTrack, setCurrentTrack] = useState<AudioSermon | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [copiedTrackId, setCopiedTrackId] = useState<string | null>(null);
  const [addedTrackId, setAddedTrackId] = useState<string | null>(null);

  // Playlist & Continuous Playback State
  const [playlist, setPlaylist] = useState<AudioSermon[]>([]);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState<boolean>(false);
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(true);
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('all');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filtered Audios
  const filteredAudios = audios.filter((a) => {
    const matchesCat = selectedCategory === 'all' || a.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = 
      !q || 
      a.title.toLowerCase().includes(q) || 
      a.speaker.toLowerCase().includes(q) || 
      a.description.toLowerCase().includes(q) ||
      a.categoryMm.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  // Track switching
  const handlePlayTrack = (track: AudioSermon, newQueue?: AudioSermon[]) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    // If new queue is provided, update playlist
    if (newQueue) {
      setPlaylist(newQueue);
    } else if (playlist.length === 0 || !playlist.some((item) => item.id === track.id)) {
      // Ensure current track is in playlist
      setPlaylist((prev) => (prev.some((p) => p.id === track.id) ? prev : [track, ...prev]));
    }

    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);
    // Increment listen count
    incrementAudioListenCount(track.id);
  };

  // Add a track to the end of the queue
  const handleAddToPlaylist = (sermon: AudioSermon) => {
    if (playlist.some((p) => p.id === sermon.id)) {
      // Already in queue
      setAddedTrackId(sermon.id);
      setTimeout(() => setAddedTrackId(null), 1500);
      return;
    }

    setPlaylist((prev) => [...prev, sermon]);
    setAddedTrackId(sermon.id);
    setTimeout(() => setAddedTrackId(null), 1500);

    // If no track is currently playing, start playing this one
    if (!currentTrack) {
      handlePlayTrack(sermon, [sermon]);
    }
  };

  // Play all filtered tracks in continuous sequence
  const handlePlayAll = () => {
    if (filteredAudios.length === 0) return;
    setPlaylist(filteredAudios);
    handlePlayTrack(filteredAudios[0], filteredAudios);
  };

  // Remove a track from queue
  const handleRemoveFromPlaylist = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPlaylist((prev) => prev.filter((p) => p.id !== id));
  };

  // Clear entire playlist
  const handleClearPlaylist = () => {
    setPlaylist([]);
    if (!isPlaying) {
      setCurrentTrack(null);
    }
  };

  // Move item up/down in playlist
  const handleMovePlaylistItem = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === playlist.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    setPlaylist((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(newIndex, 0, item);
      return copy;
    });
  };

  // Continuous playback: Play next track
  const handlePlayNext = () => {
    if (repeatMode === 'one' && currentTrack) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    const activeList = playlist.length > 0 ? playlist : filteredAudios;
    if (activeList.length === 0) return;

    if (isShuffle) {
      const randIndex = Math.floor(Math.random() * activeList.length);
      handlePlayTrack(activeList[randIndex]);
      return;
    }

    const currentIndex = currentTrack 
      ? activeList.findIndex((p) => p.id === currentTrack.id) 
      : -1;

    if (currentIndex >= 0 && currentIndex < activeList.length - 1) {
      // Play next in line
      handlePlayTrack(activeList[currentIndex + 1]);
    } else if (repeatMode === 'all' && activeList.length > 0) {
      // Loop back to beginning
      handlePlayTrack(activeList[0]);
    } else {
      setIsPlaying(false);
    }
  };

  // Continuous playback: Play previous track
  const handlePlayPrevious = () => {
    if (currentTime > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      return;
    }

    const activeList = playlist.length > 0 ? playlist : filteredAudios;
    if (activeList.length === 0) return;

    const currentIndex = currentTrack 
      ? activeList.findIndex((p) => p.id === currentTrack.id) 
      : -1;

    if (currentIndex > 0) {
      handlePlayTrack(activeList[currentIndex - 1]);
    } else if (activeList.length > 0) {
      handlePlayTrack(activeList[activeList.length - 1]);
    }
  };

  // Audio track ended event
  const handleAudioEnded = () => {
    if (autoPlayNext) {
      handlePlayNext();
    } else {
      setIsPlaying(false);
    }
  };

  // Sync audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack) {
      audio.src = currentTrack.audioUrl;
      audio.playbackRate = playbackSpeed;
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Playback error:', err);
        setIsPlaying(false);
      });
    }
  }, [currentTrack]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!duration || isNaN(duration)) {
        setDuration(audioRef.current.duration || 0);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  const handleSpeedChange = () => {
    const speeds = [1.0, 1.25, 1.5, 1.75, 2.0, 0.75];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.8;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const toggleRepeatMode = () => {
    if (repeatMode === 'all') setRepeatMode('one');
    else if (repeatMode === 'one') setRepeatMode('none');
    else setRepeatMode('all');
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(mins)}:${pad(remainingSecs)}`;
  };

  const handleCopyTrackLink = (track: AudioSermon) => {
    const shareText = `📻 ${track.title}\n🎙️ ${track.speaker}\n📁 ${track.categoryMm}\nနားဆင်ရန်: ${window.location.origin}?tab=audio&id=${track.id}\n— Al_HikMah အစ္စလာမ်မီ ဒစ်ဂျစ်တယ် စာကြည့်တိုက်`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedTrackId(track.id);
      setTimeout(() => setCopiedTrackId(null), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden audio element */}
      <audio 
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      {/* Hero Banner for Audio Bayans */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-emerald-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 space-y-2.5 max-w-xl">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>အသံဖိုင် တရားဒေသနာနှင့် ကုရ်အာန်ဌာန</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white">
            အစ္စလာမ်မီ တရားတော်များနှင့် ကုရ်အာန် ရွတ်ဖတ်သံများ
          </h1>
          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
            မောင်လာနာ ဆရာတော်ကြီးများ၏ မြန်မာဘာသာ တရားဒေသနာတော်များ၊ သာယာငြိမ့်ညောင်းသော ကုရ်အာန် ရွတ်ဖတ်သံများကို လူတိုင်း အခမဲ့ လွတ်လပ်စွာ အချိန်မရွေး နားဆင်နိုင်ပါသည်။ အသစ်တင်သွင်းလိုပါကလည်း ဖုန်း သို့မဟုတ် ကွန်ပျူတာမှ တိုက်ရိုက် တင်နိုင်ပါသည်။
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Play All Button */}
            <button
              onClick={handlePlayAll}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-lg text-xs sm:text-sm font-bold shadow transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>အားလုံး ဆက်တိုက်နားဆင်မည် (Play All)</span>
            </button>

            {/* Playlist Queue Toggle */}
            <button
              onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}
              className="px-4 py-2 bg-emerald-900/90 hover:bg-emerald-800 text-amber-300 border border-emerald-700 rounded-lg text-xs sm:text-sm font-semibold shadow transition-colors flex items-center gap-2 cursor-pointer"
            >
              <ListMusic className="w-4 h-4 text-emerald-400" />
              <span>နားဆင်မည့် စာရင်း {playlist.length > 0 && `(${playlist.length})`}</span>
            </button>

            {/* Upload Sermon Button */}
            <button
              onClick={onOpenUploadAudio}
              className="px-4 py-2 bg-emerald-950/70 hover:bg-emerald-900 text-stone-200 border border-emerald-700/60 rounded-lg text-xs sm:text-sm font-medium shadow transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>အသံဖိုင် တင်မည်</span>
            </button>
          </div>
        </div>

        <div className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-emerald-900/60 border border-emerald-700/60 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
          <Headphones className="w-12 h-12 sm:w-16 sm:h-16 animate-bounce" />
        </div>
      </div>

      {/* Playlist Drawer / Panel if opened */}
      {isPlaylistOpen && (
        <div className="bg-stone-900 text-white rounded-2xl p-5 border border-amber-500/30 shadow-2xl animate-in slide-in-from-top-3 duration-200 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-800 text-amber-400 flex items-center justify-center">
                <ListMusic className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>ဆက်တိုက်နားဆင်မည့် တရားတော်များ (Playlist Queue)</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {playlist.length} ပုဒ်
                  </span>
                </h3>
                <p className="text-[11px] text-stone-400">
                  တရားတော်များ ပြီးဆုံးပါက နောက်တစ်ပုဒ်သို့ အလိုအလျောက် ဆက်လက်ဖွင့်ပေးမည်ဖြစ်ပါသည်
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Auto play toggle */}
              <button
                onClick={() => setAutoPlayNext(!autoPlayNext)}
                title="အလိုအလျောက် နောက်တစ်ပုဒ် ဆက်ဖွင့်ခြင်း ဖွင့်/ပိတ်"
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  autoPlayNext 
                    ? 'bg-emerald-950 border-emerald-700 text-emerald-300 font-semibold' 
                    : 'bg-stone-800 border-stone-700 text-stone-400'
                }`}
              >
                <span>ဆက်တိုက်ဖွင့်:</span>
                <span>{autoPlayNext ? 'ဖွင့်ထားသည်' : 'ပိတ်ထားသည်'}</span>
              </button>

              {/* Clear queue button */}
              {playlist.length > 0 && (
                <button
                  onClick={handleClearPlaylist}
                  title="စာရင်းအားလုံးရှင်းလင်းမည်"
                  className="text-xs px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-950 text-rose-300 border border-rose-800/80 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>စာရင်းရှင်းမည်</span>
                </button>
              )}

              {/* Close drawer */}
              <button
                onClick={() => setIsPlaylistOpen(false)}
                className="p-1 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Playlist items */}
          {playlist.length === 0 ? (
            <div className="p-8 text-center bg-stone-950/60 rounded-xl border border-stone-800 space-y-2">
              <ListPlus className="w-8 h-8 text-stone-500 mx-auto mb-1" />
              <div className="text-xs font-semibold text-stone-300">
                နားဆင်မည့် စာရင်းထဲတွင် တရားတော် မရှိသေးပါ
              </div>
              <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                အောက်ဖော်ပြပါ တရားတော်ကတ်ပြားများရှိ <strong>"စာရင်းထဲထည့်"</strong> ခလုတ်ကို နှိပ်၍ မိမိနှစ်သက်ရာများကို စီစဉ်နားဆင်နိုင်ပါသည်
              </p>
              <div className="pt-2">
                <button
                  onClick={handlePlayAll}
                  className="px-3.5 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-amber-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  လက်ရှိ တရားတော်အားလုံးကို စာရင်းထဲထည့်မည်
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {playlist.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <div
                    key={`${track.id}-${idx}`}
                    onClick={() => handlePlayTrack(track)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-400/60 text-amber-300 ring-1 ring-amber-400/40'
                        : 'bg-stone-950/50 hover:bg-stone-800 border-stone-800 text-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="w-5 text-center text-xs font-mono text-stone-500 shrink-0">
                        {isCurrent && isPlaying ? (
                          <Music className="w-3.5 h-3.5 text-amber-400 animate-bounce mx-auto" />
                        ) : (
                          idx + 1
                        )}
                      </span>

                      <div className="overflow-hidden">
                        <div className="text-xs font-bold truncate max-w-xs sm:max-w-md">
                          {track.title}
                        </div>
                        <div className="text-[10px] text-stone-400 flex items-center gap-2">
                          <span>{track.speaker}</span>
                          <span>·</span>
                          <span>{track.duration || '00:00'}</span>
                          <span>·</span>
                          <span className="text-emerald-400">{track.categoryMm}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Move up/down & Remove */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500 text-stone-950 font-bold mr-1">
                          နားဆင်နေဆဲ
                        </span>
                      )}

                      <button
                        onClick={(e) => handleMovePlaylistItem(idx, 'up', e)}
                        disabled={idx === 0}
                        title="အပေါ်သို့ ရွှေ့မည်"
                        className="p-1 text-stone-400 hover:text-white hover:bg-stone-800 rounded disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleMovePlaylistItem(idx, 'down', e)}
                        disabled={idx === playlist.length - 1}
                        title="အောက်သို့ ရွှေ့မည်"
                        className="p-1 text-stone-400 hover:text-white hover:bg-stone-800 rounded disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleRemoveFromPlaylist(track.id, e)}
                        title="စာရင်းမှ ဖယ်ရှားမည်"
                        className="p-1 text-stone-400 hover:text-rose-400 hover:bg-stone-800 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Search & Category Filter Controls */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="တရားတော်အမည်၊ ဟောကြားသူ ဆရာတော် သို့မဟုတ် အကြောင်းအရာဖြင့် ရှာဖွေပါ..."
              className="w-full pl-10 pr-4 py-2.5 border border-stone-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
              >
                ဖျက်မည်
              </button>
            )}
          </div>

          <button
            onClick={handlePlayAll}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-lg text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>အားလုံးဖွင့်မည်</span>
          </button>

          <button
            onClick={onOpenUploadAudio}
            className="px-4 py-2.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-lg text-xs sm:text-sm font-semibold shadow transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>အသံဖိုင် တင်မည်</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'အားလုံး' },
            { id: 'bayan', label: 'တရားဒေသနာ (Bayan)' },
            { id: 'quran', label: 'ကုရ်အာန် ရွတ်ဖတ်သံ' },
            { id: 'hadith', label: 'ဟဒီးဆ်တော်များ' },
            { id: 'dua', label: 'ဒိုအာနှင့် ဇိကိရ်' },
            { id: 'history', label: 'သမိုင်းနှင့် အတ္ထုပ္ပတ္တိ' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-900 text-white shadow-xs font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Audio Sermons List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAudios.map((sermon) => {
          const isThisPlaying = currentTrack?.id === sermon.id && isPlaying;
          const isThisActive = currentTrack?.id === sermon.id;
          const isInQueue = playlist.some((p) => p.id === sermon.id);
          const wasJustAdded = addedTrackId === sermon.id;

          return (
            <div
              key={sermon.id}
              className={`bg-white rounded-xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md ${
                isThisActive ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-400' : 'border-stone-200 hover:border-emerald-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium">
                    {sermon.categoryMm}
                  </span>
                  
                  <div className="flex items-center gap-1 text-[11px] text-stone-500">
                    <Clock className="w-3 h-3 text-stone-400" />
                    <span>{sermon.duration || '00:00'}</span>
                  </div>
                </div>

                <h3 className="font-bold text-sm sm:text-base text-stone-900 line-clamp-2 leading-snug">
                  {sermon.title}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium mt-1 mb-2">
                  <User className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{sermon.speaker}</span>
                </div>

                <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-4">
                  {sermon.description}
                </p>
              </div>

              {/* Bottom Play & Controls Bar */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {/* Play Button */}
                  <button
                    onClick={() => handlePlayTrack(sermon)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isThisPlaying
                        ? 'bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-sm'
                        : 'bg-emerald-900 hover:bg-emerald-950 text-white'
                    }`}
                  >
                    {isThisPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>ခေတ္တရပ်မည်</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>နားဆင်မည်</span>
                      </>
                    )}
                  </button>

                  {/* Add to Playlist Queue Button */}
                  <button
                    onClick={() => handleAddToPlaylist(sermon)}
                    title={isInQueue ? "စာရင်းထဲတွင် ရှိပြီးပါပြီ" : "နားဆင်မည့် စာရင်းထဲထည့်မည်"}
                    className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all cursor-pointer ${
                      wasJustAdded
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-bold'
                        : isInQueue
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                        : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                    }`}
                  >
                    {wasJustAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[11px] hidden sm:inline">ထည့်ပြီး</span>
                      </>
                    ) : (
                      <>
                        <ListPlus className="w-3.5 h-3.5" />
                        <span className="text-[11px] hidden sm:inline">{isInQueue ? 'စာရင်းထဲရှိ' : 'စာရင်းထည့်'}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {/* Share / Copy link */}
                  <button
                    onClick={() => handleCopyTrackLink(sermon)}
                    title="တရားတော်လင့်ခ် ကူးယူရန်"
                    className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-800 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    {copiedTrackId === sermon.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Direct Download if URL is available */}
                  <a
                    href={sermon.audioUrl}
                    download={`${sermon.title}.mp3`}
                    target="_blank"
                    rel="noreferrer"
                    title="အသံဖိုင် ဒေါင်းလုဒ်ရယူရန်"
                    className="p-1.5 rounded-lg text-stone-500 hover:text-emerald-800 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAudios.length === 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-stone-500">
          <Headphones className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800 mb-1">
            ရှာဖွေမှုနှင့် ကိုက်ညီသော တရားတော် မတွေ့ရှိပါ
          </h3>
          <p className="text-xs text-stone-500 mb-4">
            အခြားသော စကားလုံးဖြင့် ရှာဖွေပါ သို့မဟုတ် သင်ကိုယ်တိုင် အသံဖိုင် တင်သွင်းနိုင်ပါသည်
          </p>
          <button
            onClick={onOpenUploadAudio}
            className="px-4 py-2 bg-emerald-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            တရားတော် အသံဖိုင် အသစ်တင်မည်
          </button>
        </div>
      )}

      {/* Floating Bottom Sticky Audio Player */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-stone-900/95 backdrop-blur-md text-white border-t border-emerald-800/60 shadow-2xl p-3 sm:p-4 animate-in slide-in-from-bottom-5">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Left: Track Information */}
            <div className="flex items-center gap-3 w-full md:w-1/4">
              <div className="w-10 h-10 rounded-lg bg-emerald-800 flex items-center justify-center text-amber-300 shrink-0">
                <Music className={`w-5 h-5 ${isPlaying ? 'animate-bounce' : ''}`} />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs sm:text-sm font-bold text-white truncate">
                  {currentTrack.title}
                </div>
                <div className="text-[11px] text-amber-300/90 truncate flex items-center gap-1">
                  <span>{currentTrack.speaker}</span>
                  <span>·</span>
                  <span className="text-emerald-400">{currentTrack.categoryMm}</span>
                </div>
              </div>
            </div>

            {/* Center: Playback Controls, Progress Bar & Playlist Controls */}
            <div className="flex-1 w-full max-w-xl space-y-1.5">
              <div className="flex items-center justify-center gap-3 sm:gap-4">
                
                {/* Shuffle Button */}
                <button
                  onClick={() => setIsShuffle(!isShuffle)}
                  title={isShuffle ? "ကမောက်ကမဖွင့်ခြင်း ပိတ်မည်" : "ကျပန်းကမောက်ကမဖွင့်မည် (Shuffle)"}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    isShuffle ? 'text-amber-400 bg-stone-800' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </button>

                {/* Previous Track Button */}
                <button
                  onClick={handlePlayPrevious}
                  title="ရှေ့တစ်ပုဒ်သို့ (Previous Track)"
                  className="text-stone-300 hover:text-white p-1 rounded transition-colors cursor-pointer"
                >
                  <SkipBack className="w-4 h-4 fill-current" />
                </button>

                {/* Skip -10s */}
                <button
                  onClick={() => handleSkip(-10)}
                  title="၁၀ စက္ကန့် နောက်ဆုတ်"
                  className="text-stone-400 hover:text-white p-1 rounded transition-colors cursor-pointer hidden sm:block"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Play / Pause Toggle */}
                <button
                  onClick={() => {
                    if (isPlaying) {
                      audioRef.current?.pause();
                      setIsPlaying(false);
                    } else {
                      audioRef.current?.play();
                      setIsPlaying(true);
                    }
                  }}
                  className="w-9 h-9 rounded-full bg-amber-500 hover:bg-amber-600 text-stone-950 flex items-center justify-center shadow transition-colors cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                {/* Skip +10s */}
                <button
                  onClick={() => handleSkip(10)}
                  title="၁၀ စက္ကန့် ရှေ့တိုး"
                  className="text-stone-400 hover:text-white p-1 rounded transition-colors cursor-pointer hidden sm:block"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                {/* Next Track Button */}
                <button
                  onClick={handlePlayNext}
                  title="နောက်တစ်ပုဒ်သို့ (Next Track)"
                  className="text-stone-300 hover:text-white p-1 rounded transition-colors cursor-pointer"
                >
                  <SkipForward className="w-4 h-4 fill-current" />
                </button>

                {/* Repeat Toggle Button */}
                <button
                  onClick={toggleRepeatMode}
                  title={
                    repeatMode === 'all' 
                      ? 'အားလုံး အဆုံးမရှိ ပြန်ဖွင့်မည် (Repeat All)' 
                      : repeatMode === 'one' 
                      ? 'ဤတစ်ပုဒ်တည်းကိုသာ ပြန်ဖွင့်မည် (Repeat One)' 
                      : 'ပြန်ဖွင့်ခြင်း ပိတ်ထားသည် (No Repeat)'
                  }
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    repeatMode !== 'none' ? 'text-amber-400 bg-stone-800' : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
                </button>

                {/* Speed toggle button */}
                <button
                  onClick={handleSpeedChange}
                  title="အသံမြန်နှုန်း ချိန်ညှိရန်"
                  className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 transition-colors cursor-pointer"
                >
                  {playbackSpeed}x
                </button>
              </div>

              {/* Slider & Time Stamps */}
              <div className="flex items-center gap-2 text-[11px] font-mono text-stone-400">
                <span>{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right: Playlist button, Volume & Close */}
            <div className="flex items-center justify-end gap-2.5 w-full md:w-1/4">
              {/* Playlist drawer toggle button */}
              <button
                onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}
                title="နားဆင်မည့် စာရင်း ဖွင့်/ပိတ် (Playlist Queue)"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  isPlaylistOpen 
                    ? 'bg-amber-500 text-stone-950 border-amber-400' 
                    : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border-stone-700'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span>စာရင်း ({playlist.length})</span>
              </button>

              {/* Volume Slider */}
              <div className="hidden lg:flex items-center gap-1.5">
                <button
                  onClick={toggleMute}
                  className="text-stone-300 hover:text-white transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Close audio player */}
              <button
                onClick={() => {
                  audioRef.current?.pause();
                  setIsPlaying(false);
                  setCurrentTrack(null);
                }}
                className="text-stone-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-stone-800 transition-colors cursor-pointer"
              >
                ပိတ်မည်
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
