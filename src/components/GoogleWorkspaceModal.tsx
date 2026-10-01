import React, { useState, useEffect } from 'react';
import { 
  X, 
  HardDrive, 
  FileText, 
  Upload, 
  ExternalLink, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FolderOpen, 
  BookOpen, 
  Eye, 
  HelpCircle,
  Sparkles,
  Users
} from 'lucide-react';
import { 
  signInWithGoogleWorkspace, 
  getWorkspaceAccessToken, 
  logoutWorkspace, 
  listDrivePdfFiles, 
  downloadDriveFileBlob, 
  createIslamicFatwaGoogleForm, 
  listUserGoogleForms, 
  getFormResponses,
  DriveFileItem, 
  GoogleFormItem,
  GoogleFormResponseItem 
} from '../services/googleWorkspaceService';
import { Book } from '../types';

interface GoogleWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBookInReader: (book: Book) => void;
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onOpenBookInReader,
}) => {
  const [activeTab, setActiveTab] = useState<'drive' | 'forms'>('drive');
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState('');

  // Forms state
  const [formsList, setFormsList] = useState<GoogleFormItem[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [formsError, setFormsError] = useState('');
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [selectedFormResponses, setSelectedFormResponses] = useState<GoogleFormResponseItem[]>([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);

  // Confirmation modal state for mutating operations per Workspace skill
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const loadDriveFiles = async (authToken: string) => {
    setIsLoadingDrive(true);
    setDriveError('');
    try {
      const files = await listDrivePdfFiles(authToken);
      setDriveFiles(files);
    } catch (err: any) {
      setDriveError('Google Drive ဖိုင်များ ဆွဲယူရာတွင် အခက်အခဲရှိနေပါသည်။ ခွင့်ပြုချက် သို့မဟုတ် ကွန်ရက်ကို စစ်ဆေးပေးပါ။');
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const loadForms = async (authToken: string) => {
    setIsLoadingForms(true);
    setFormsError('');
    try {
      const forms = await listUserGoogleForms(authToken);
      setFormsList(forms);
    } catch (err: any) {
      setFormsError('Google Forms စာရင်း ရယူရာတွင် အခက်အခဲရှိနေပါသည်။');
    } finally {
      setIsLoadingForms(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const existingToken = getWorkspaceAccessToken();
    if (existingToken) {
      setToken(existingToken);
      setIsSignedIn(true);
      loadDriveFiles(existingToken);
      loadForms(existingToken);
    }
  }, [isOpen]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setDriveError('');
    setFormsError('');
    try {
      const res = await signInWithGoogleWorkspace();
      setToken(res.accessToken);
      setUserEmail(res.user.email);
      setIsSignedIn(true);
      loadDriveFiles(res.accessToken);
      loadForms(res.accessToken);
    } catch (err: any) {
      setDriveError('Google ဖြင့် ဝင်ရောက်ခြင်း မအောင်မြင်ပါ။ နောက်တစ်ကြိမ် ကြိုးစားကြည့်ပါ။');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logoutWorkspace();
    setToken(null);
    setIsSignedIn(false);
    setDriveFiles([]);
    setFormsList([]);
  };

  // Convert Drive PDF file into Reader book
  const handleOpenDriveFile = async (file: DriveFileItem) => {
    if (!token) return;
    try {
      setIsLoadingDrive(true);
      const blob = await downloadDriveFileBlob(token, file.id);
      const fileUrl = URL.createObjectURL(blob);

      const virtualBook: Book = {
        id: `drive-${file.id}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        author: 'Google Drive မှ စာအုပ်',
        category: 'general',
        categoryNameMm: 'Google Drive',
        description: 'Google Drive မှ တိုက်ရိုက်ဖတ်ရှုသော PDF ကျမ်းစာအုပ်ဖြစ်ပါသည်။',
        pagesCount: 20,
        publishedYear: '၂၀၂၆',
        language: 'မြန်မာ / အာရဗီ',
        isMemberOnly: false,
        isPdfUploaded: true,
        pdfDataUrl: fileUrl,
        downloadUrl: file.webViewLink,
        chapters: [
          {
            id: 'ch-1',
            title: file.name,
            pageNumber: 1,
            content: `Google Drive PDF ဖိုင်: ${file.name}\n\nဖိုင်အရွယ်အစား: ${file.size ? (parseInt(file.size, 10) / 1024 / 1024).toFixed(2) + ' MB' : 'သိမ်းဆည်းထားသော ဖိုင်'}\nအွန်လိုင်း Drive မှ တိုက်ရိုက် ဖွင့်လှစ်ဖတ်ရှုနေပါသည်...`,
          },
        ],
      };

      onClose();
      onOpenBookInReader(virtualBook);
    } catch (err: any) {
      setDriveError('Google Drive ဖိုင်ကို ဖွင့်လှစ်၍ မရနိုင်ပါ။ ခွင့်ပြုချက် သို့မဟုတ် ဖိုင်ဖော်မတ်ကို စစ်ဆေးပါ။');
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // Create Google Form with explicit confirmation per skill requirement
  const handlePromptCreateForm = () => {
    if (!token) return;
    setConfirmModal({
      isOpen: true,
      title: 'Google Form အသစ် ဖန်တီးမည်လား?',
      message: 'သင်၏ Google Account ထဲသို့ "Al_HikMah - အစ္စလာမ် ဓမ္မသတ်နှင့် သာသနာ့ အမေးအဖြေ ဖောင်" အမည်ဖြင့် Google Form အသစ်တစ်ခုကို ထည့်သွင်း ဖန်တီးပေးမည် ဖြစ်ပါသည်။',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setIsCreatingForm(true);
        try {
          const newForm = await createIslamicFatwaGoogleForm(token);
          setFormsList((prev) => [newForm, ...prev]);
        } catch (err: any) {
          setFormsError('Google Form ဖန်တီးမှု မအောင်မြင်ပါ: ' + (err.message || ''));
        } finally {
          setIsCreatingForm(false);
        }
      },
    });
  };

  // View responses for a form
  const handleViewResponses = async (form: GoogleFormItem) => {
    if (!token) return;
    setSelectedFormId(form.formId);
    setIsLoadingResponses(true);
    try {
      const responses = await getFormResponses(token, form.formId);
      setSelectedFormResponses(responses);
    } catch (err: any) {
      console.warn('Could not load form responses:', err);
      setSelectedFormResponses([]);
    } finally {
      setIsLoadingResponses(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-6 overflow-hidden border border-stone-200 flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="bg-emerald-950 text-white p-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-900 border border-emerald-700 flex items-center justify-center text-amber-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                  <span>Google Workspace ချိတ်ဆက်မှု</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 border border-emerald-700">
                    Drive & Forms
                  </span>
                </h3>
                <p className="text-xs text-stone-300">
                  Google Drive မှ အစ္စလာမ့် PDF စာအုပ်များ ဖတ်ရှုခြင်းနှင့် Google Forms ဖသ်ဝါမေးမြန်းလွှာများ
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            
            {/* If NOT Signed in, show official Google Sign in button */}
            {!isSignedIn ? (
              <div className="text-center py-8 px-4 max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center mx-auto">
                  <HardDrive className="w-8 h-8 text-emerald-700" />
                </div>
                <h4 className="text-lg font-bold text-stone-900">
                  Google Account ဖြင့် ချိတ်ဆက်ပါ
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  သင်၏ Google Drive ထဲရှိ အစ္စလာမ့် PDF စာအုပ်များကို တိုက်ရိုက်ဆွဲယူ ဖတ်ရှုနိုင်သည့်အပြင်၊ သာသနာ့ဓမ္မသတ် မေးမြန်းလွှာ Google Forms များကိုလည်း အလွယ်တကူ စီမံဖန်တီးနိုင်ပါသည်။
                </p>

                {/* Official styled Google Sign In Button per skill requirement */}
                <div className="pt-3 flex justify-center">
                  <button
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl shadow-xs transition-all cursor-pointer font-medium text-stone-700 text-xs sm:text-sm active:scale-98 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>{isSigningIn ? 'Google ဖြင့် ဝင်ရောက်နေသည်...' : 'Sign in with Google (ခွင့်ပြုချက်ဖြင့် ချိတ်မည်)'}</span>
                  </button>
                </div>

                {driveError && (
                  <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                    {driveError}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Account info bar & Tab Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    {/* Unboxed segmented tab controls */}
                    <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                      <button
                        onClick={() => setActiveTab('drive')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          activeTab === 'drive'
                            ? 'bg-white text-emerald-950 shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        <HardDrive className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Google Drive စာအုပ်များ</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('forms')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          activeTab === 'forms'
                            ? 'bg-white text-emerald-950 shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-700" />
                        <span>Google Forms မေးမြန်းလွှာများ</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-stone-500 truncate max-w-[150px]">
                      {userEmail || 'Google ချိတ်ဆက်ပြီး'}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="text-stone-500 hover:text-rose-600 underline cursor-pointer text-[11px]"
                    >
                      ချိတ်ဆက်မှုဖြုတ်မည်
                    </button>
                  </div>
                </div>

                {/* TAB 1: Google Drive */}
                {activeTab === 'drive' && (
                  <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-stone-700">
                        သင်၏ Google Drive ထဲရှိ PDF စာအုပ်များနှင့် စာရွက်စာတမ်းများ
                      </div>
                      <button
                        onClick={() => token && loadDriveFiles(token)}
                        disabled={isLoadingDrive}
                        className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                        <span>ပြန်လည်စစ်ဆေးမည်</span>
                      </button>
                    </div>

                    {driveError && (
                      <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                        {driveError}
                      </div>
                    )}

                    {isLoadingDrive ? (
                      <div className="text-center py-10 text-xs text-stone-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-700" />
                        Google Drive ထဲရှိ စာအုပ်များကို ရှာဖွေနေပါသည်...
                      </div>
                    ) : driveFiles.length === 0 ? (
                      <div className="text-center py-10 bg-stone-50 rounded-xl border border-stone-200 p-6 space-y-2">
                        <FolderOpen className="w-8 h-8 text-stone-400 mx-auto" />
                        <div className="text-sm font-semibold text-stone-700">
                          Google Drive တွင် PDF စာအုပ်များ မတွေ့ရှိသေးပါ
                        </div>
                        <p className="text-xs text-stone-500 max-w-sm mx-auto">
                          သင်၏ Google Drive ထဲသို့ PDF အစ္စလာမ့်စာအုပ်များ ထည့်သွင်းထားပါက ဤနေရာတွင် တိုက်ရိုက် ဖွင့်ဖတ်နိုင်မည် ဖြစ်ပါသည်။
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                        {driveFiles.map((file) => (
                          <div
                            key={file.id}
                            className="p-3 bg-stone-50 hover:bg-emerald-50/50 border border-stone-200 hover:border-emerald-300 rounded-xl transition-all flex flex-col justify-between"
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-xs text-stone-900 truncate" title={file.name}>
                                  {file.name}
                                </div>
                                <div className="text-[10px] text-stone-500 mt-0.5">
                                  {file.size ? `${(parseInt(file.size, 10) / (1024 * 1024)).toFixed(2)} MB` : 'PDF Document'}
                                </div>
                              </div>
                            </div>

                            <div className="pt-3 flex items-center justify-between border-t border-stone-200/60 mt-3">
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-stone-500 hover:text-emerald-700 flex items-center gap-1"
                                >
                                  <span>Drive တွင်ကြည့်မည်</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}

                              <button
                                onClick={() => handleOpenDriveFile(file)}
                                className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>စာကြည့်တိုက်တွင် ဖတ်မည်</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Google Forms */}
                {activeTab === 'forms' && (
                  <div className="space-y-4 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-stone-800">
                          အစ္စလာမ် သာသနာ့ ဖသ်ဝါမေးမြန်းလွှာ Google Forms များ
                        </div>
                        <p className="text-[11px] text-stone-500">
                          Google Forms မှတစ်ဆင့် မေးခွန်းများ စုဆောင်းနိုင်ပြီး တုံ့ပြန်မှုများကို တိုက်ရိုက် ကြည့်ရှုနိုင်ပါသည်
                        </p>
                      </div>

                      <button
                        onClick={handlePromptCreateForm}
                        disabled={isCreatingForm}
                        className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isCreatingForm ? 'ဖန်တီးနေသည်...' : 'Google Form အသစ် ဖန်တီးမည်'}</span>
                      </button>
                    </div>

                    {formsError && (
                      <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                        {formsError}
                      </div>
                    )}

                    {isLoadingForms ? (
                      <div className="text-center py-10 text-xs text-stone-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-700" />
                        Google Forms စာရင်း ရယူနေပါသည်...
                      </div>
                    ) : formsList.length === 0 ? (
                      <div className="text-center py-10 bg-purple-50/50 rounded-xl border border-purple-200 p-6 space-y-3">
                        <FileText className="w-8 h-8 text-purple-400 mx-auto" />
                        <div className="text-sm font-semibold text-purple-950">
                          Google Form မရှိသေးပါ
                        </div>
                        <p className="text-xs text-stone-600 max-w-sm mx-auto">
                          "Google Form အသစ် ဖန်တီးမည်" ခလုတ်ကို နှိပ်၍ သာသနာ့ဓမ္မသတ် မေးမြန်းလွှာ Google Form တစ်ခုကို အသင့်မေးခွန်းပုံစံများဖြင့် ချက်ချင်း ဖန်တီးနိုင်ပါသည်။
                        </p>
                        <button
                          onClick={handlePromptCreateForm}
                          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>ဖသ်ဝါမေးမြန်းလွှာ Google Form စတင်ဖန်တီးမည်</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {formsList.map((form) => (
                          <div
                            key={form.formId}
                            className="p-4 bg-stone-50 border border-stone-200 rounded-xl hover:border-purple-300 transition-all space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-bold text-xs sm:text-sm text-stone-900">
                                    {form.title}
                                  </div>
                                  <div className="text-[10px] text-stone-500 font-mono">
                                    ID: {form.formId}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleViewResponses(form)}
                                  className="px-3 py-1.5 bg-white border border-purple-200 hover:bg-purple-50 text-purple-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Users className="w-3.5 h-3.5" />
                                  <span>တုံ့ပြန်မှုများ စစ်ဆေးမည်</span>
                                </button>

                                {form.responderUri && (
                                  <a
                                    href={form.responderUri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
                                  >
                                    <span>Form ဖွင့်မည်</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>

                            {/* Responses drawer for this form */}
                            {selectedFormId === form.formId && (
                              <div className="pt-3 border-t border-stone-200 mt-2 bg-white p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-bold text-xs text-purple-950">
                                    မေးမြန်းထားသော အဖြေများ ({selectedFormResponses.length})
                                  </span>
                                  <button
                                    onClick={() => setSelectedFormId(null)}
                                    className="text-[11px] text-stone-400 hover:text-stone-700 cursor-pointer"
                                  >
                                    ပိတ်မည်
                                  </button>
                                </div>

                                {isLoadingResponses ? (
                                  <div className="text-center py-4 text-xs text-stone-500">
                                    တုံ့ပြန်မှုများကို ဆွဲယူနေပါသည်...
                                  </div>
                                ) : selectedFormResponses.length === 0 ? (
                                  <div className="text-xs text-stone-500 py-3 text-center">
                                    ဤ Form တွင် ဖြေဆိုသူ မရှိသေးပါ။
                                  </div>
                                ) : (
                                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {selectedFormResponses.map((r, i) => (
                                      <div key={r.responseId || i} className="p-2.5 bg-stone-50 rounded border border-stone-200 text-xs">
                                        <div className="text-[10px] text-stone-400 mb-1">
                                          မေးမြန်းချိန်: {new Date(r.lastSubmittedTime || r.createTime).toLocaleString('my-MM')}
                                        </div>
                                        <div className="space-y-1">
                                          {r.answers && Object.entries(r.answers).map(([key, val]) => (
                                            <div key={key} className="text-stone-700">
                                              <span className="font-semibold text-stone-800">• </span>
                                              <span>{val.textAnswers?.answers?.map(a => a.value).join(', ') || 'အဖြေမရှိ'}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer note */}
          <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500 shrink-0">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google OAuth 2.0 Client-side စနစ်ဖြင့် လုံခြုံစွာ ချိတ်ဆက်ထားပါသည်</span>
            </span>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg font-medium transition-colors cursor-pointer"
            >
              ပိတ်မည်
            </button>
          </div>

        </div>
      </div>

      {/* Confirmation Dialog for Destructive / Mutating Action per skill */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 space-y-4 border border-stone-200">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <span>{confirmModal.title}</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
              >
                မလုပ်ဆောင်ပါ
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-3.5 py-1.5 text-xs bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg cursor-pointer shadow-xs"
              >
                အတည်ပြု ဖန်တီးမည်
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
