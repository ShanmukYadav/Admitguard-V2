import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  Briefcase, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  FileText,
  Upload
} from 'lucide-react';
import { 
  EducationLevel, 
  EducationPath, 
  ApplicationData, 
  ValidationResult 
} from './types';
import CounselorDashboard from './CounselorDashboard';
import DirectorDashboard from './DirectorDashboard';

export default function App() {
  const [currentView, setCurrentView] = useState<'FORM' | 'COUNSELOR' | 'DIRECTOR'>('FORM');
  const [step, setStep] = useState(0); // 0 is AutoFill
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  
  // Auto-fill states
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [autoFillSuccess, setAutoFillSuccess] = useState(false);
  const [autoFillConfidence, setAutoFillConfidence] = useState(0);
  const [autoFillWarnings, setAutoFillWarnings] = useState<string[]>([]);

  // Validation states
  const [nameError, setNameError] = useState('');
  const [stepErrors, setStepErrors] = useState<{ [key: string]: string }>({});
  
  const [formData, setFormData] = useState<ApplicationData>({
    personalInfo: { fullName: '', email: '', phone: '', dateOfBirth: '' },
    educationPath: EducationPath.PATH_A,
    educationHistory: [
      { level: EducationLevel.TENTH, boardUniversity: '', yearOfPassing: 2020, score: 0, scoreScale: 'Percentage', gapMonths: 0 }
    ],
    workExperience: []
  });

  const handlePathChange = (path: EducationPath) => {
    let initialEdu = [{ level: EducationLevel.TENTH, boardUniversity: '', yearOfPassing: 2020, score: 0, scoreScale: 'Percentage', gapMonths: 0 }];
    
    if (path === EducationPath.PATH_A) {
      initialEdu.push({ level: EducationLevel.TWELFTH, boardUniversity: '', yearOfPassing: 2022, score: 0, scoreScale: 'Percentage', gapMonths: 0 });
    } else if (path === EducationPath.PATH_B) {
      initialEdu.push({ level: EducationLevel.DIPLOMA, boardUniversity: '', yearOfPassing: 2023, score: 0, scoreScale: 'Percentage', gapMonths: 0 });
    } else if (path === EducationPath.PATH_C) {
      initialEdu.push({ level: EducationLevel.ITI, boardUniversity: '', yearOfPassing: 2022, score: 0, scoreScale: 'Percentage', gapMonths: 0 });
      initialEdu.push({ level: EducationLevel.DIPLOMA, boardUniversity: '', yearOfPassing: 2024, score: 0, scoreScale: 'Percentage', gapMonths: 0 });
    }
    
    setFormData({ ...formData, educationPath: path, educationHistory: initialEdu });
  };

  const addEducation = () => {
    const last = formData.educationHistory[formData.educationHistory.length - 1];
    setFormData({
      ...formData,
      educationHistory: [
        ...formData.educationHistory,
        { level: EducationLevel.UG, boardUniversity: '', yearOfPassing: last.yearOfPassing + 3, score: 0, scoreScale: 'Percentage', gapMonths: 0 }
      ]
    });
  };

  const addWork = () => {
    setFormData({
      ...formData,
      workExperience: [
        ...formData.workExperience,
        { company: '', role: '', domain: 'IT', startDate: '', isCurrent: false, employmentType: 'Full-time', skills: [] }
      ]
    });
  };

  const validateStep1 = () => {
    const errors: { [key: string]: string } = {};
    const { fullName, email, phone, dateOfBirth } = formData.personalInfo;

    if (!/^[a-zA-Z\s'\-]{2,100}$/.test(fullName)) {
      errors.fullName = "Name can only contain letters, spaces, hyphens, and apostrophes (min 2 chars)";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email format";
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      errors.phone = "Phone must be exactly 10 digits starting with 6, 7, 8, or 9";
    }
    if (!dateOfBirth) {
      errors.dateOfBirth = "Date of Birth is required";
    } else {
      const age = (new Date().getTime() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (age < 18) errors.dateOfBirth = "Age must be at least 18";
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors: { [key: string]: string } = {};
    const edu = formData.educationHistory;

    const tenth = edu.find(e => e.level === EducationLevel.TENTH);
    if (!tenth || !tenth.boardUniversity || !tenth.yearOfPassing || !tenth.score) {
      errors.tenth = "10th entry must be completely filled";
    }

    if (formData.educationPath === EducationPath.PATH_A) {
      const twelfth = edu.find(e => e.level === EducationLevel.TWELFTH);
      if (!twelfth || !twelfth.boardUniversity || !twelfth.yearOfPassing || !twelfth.score) {
        errors.twelfth = "12th entry must be completely filled for Path A";
      }
    } else if (formData.educationPath === EducationPath.PATH_B || formData.educationPath === EducationPath.PATH_C) {
      const diploma = edu.find(e => e.level === EducationLevel.DIPLOMA);
      if (!diploma || !diploma.boardUniversity || !diploma.yearOfPassing || !diploma.score) {
        errors.diploma = "Diploma entry must be completely filled for Path B/C";
      }
    }

    const ug = edu.find(e => e.level === EducationLevel.UG);
    if (!ug) {
      errors.ug = "UG degree is required. If the candidate is still pursuing UG, they are not eligible. PG is optional.";
    }

    const currentYear = new Date().getFullYear();
    edu.forEach((e, i) => {
      if (!e.boardUniversity) errors[`edu_${i}_board`] = "Board/University is required";
      if (!e.yearOfPassing || e.yearOfPassing > currentYear) errors[`edu_${i}_year`] = `Valid year of passing required (≤ ${currentYear})`;
      if (e.score < 0 || e.score > 100) errors[`edu_${i}_score`] = "Score must be between 0 and 100";
    });

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors: { [key: string]: string } = {};
    
    formData.workExperience.forEach((w, i) => {
      if ((w.company && !w.role) || (!w.company && w.role)) {
        errors.work = "Please complete or remove incomplete work experience entries";
      }
    });

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep(step + 1);
  };

  const handleNameChange = (val: string) => {
    setFormData({ ...formData, personalInfo: { ...formData.personalInfo, fullName: val } });
    if (val && !/^[a-zA-Z\s'\-]{2,100}$/.test(val)) {
      setNameError("Name can only contain letters, spaces, hyphens, and apostrophes");
    } else {
      setNameError('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setAutoFillLoading(true);
    setAutoFillSuccess(false);
    setAutoFillWarnings([]);
    
    const files = Array.from(e.target.files) as File[];
    const fileData = await Promise.all(files.map(async (file) => {
      return new Promise<{name: string, base64: string, mimeType: string}>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = (ev.target?.result as string).split(',')[1];
          resolve({ name: file.name, base64, mimeType: file.type });
        };
        reader.readAsDataURL(file);
      });
    }));

    try {
      const res = await fetch('/api/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileData })
      });
      
      if (!res.ok) throw new Error('Auto-fill failed');
      const data = await res.json();
      
      if (data.success) {
        setFormData(data.data);
        setAutoFillConfidence(data.confidence);
        setAutoFillWarnings(data.warnings || []);
        setAutoFillSuccess(true);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to process documents');
    } finally {
      setAutoFillLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2() || !validateStep3()) {
      alert("Please ensure all required fields are filled correctly before submitting.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        let errorMsg = 'Server error';
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.message || errorJson.error || errorMsg;
        } catch (e) {
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      setResult(data);
      setStep(4); // Results step
    } catch (error: any) {
      console.error(error);
      alert(`Validation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <button 
                  onClick={() => {
                    setCurrentView('FORM');
                    setStep(0);
                    setFormData({
                      personalInfo: { fullName: '', email: '', phone: '', dateOfBirth: '' },
                      educationPath: EducationPath.PATH_A,
                      educationHistory: [],
                      workExperience: []
                    });
                    setResult(null);
                    setAutoFillSuccess(false);
                    setAutoFillWarnings([]);
                    setAutoFillConfidence(0);
                  }}
                  className="text-xl font-bold text-indigo-600 hover:text-indigo-800 transition-colors focus:outline-none"
                >
                  AdmitGuard
                </button>
              </div>
              <div className="ml-6 flex space-x-8">
                <button
                  onClick={() => setCurrentView('FORM')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    currentView === 'FORM' ? 'border-indigo-500 text-slate-900' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  New Application
                </button>
                <button
                  onClick={() => setCurrentView('COUNSELOR')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    currentView === 'COUNSELOR' ? 'border-indigo-500 text-slate-900' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  Counselor Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('DIRECTOR')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    currentView === 'DIRECTOR' ? 'border-indigo-500 text-slate-900' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  Director Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {currentView === 'COUNSELOR' && <CounselorDashboard />}
      {currentView === 'DIRECTOR' && <DirectorDashboard />}

      {currentView === 'FORM' && (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-2">AdmitGuard v2</h1>
          <p className="text-slate-500">Production-grade admission validation & intelligence</p>
        </header>

        {/* Progress Bar */}
        {step > 0 && step < 5 && (
        <div className="flex justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10 -translate-y-1/2" />
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                step >= s ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-slate-200 text-slate-400'
              }`}
            >
              {s === 1 && <User size={20} />}
              {s === 2 && <GraduationCap size={20} />}
              {s === 3 && <Briefcase size={20} />}
              {s === 4 && <CheckCircle2 size={20} />}
            </div>
          ))}
        </div>
        )}

        <main className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10 overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                  <FileText size={32} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Auto-Fill from Documents (Optional)</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                  Upload marksheets, resume, or certificates and let the AI fill the form for you.
                </p>

                <div className="mt-8 border-2 border-dashed border-slate-300 rounded-2xl p-12 hover:bg-slate-50 transition-colors relative">
                  <input 
                    type="file" 
                    multiple 
                    accept=".pdf,.jpg,.jpeg,.png,.csv"
                    onChange={handleFileUpload}
                    disabled={autoFillLoading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                  />
                  <div className="flex flex-col items-center gap-4">
                    {autoFillLoading ? (
                      <>
                        <Loader2 className="animate-spin text-indigo-600" size={48} />
                        <span className="text-indigo-600 font-medium">🤖 Agent is reading your documents...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="text-slate-400" size={48} />
                        <div>
                          <span className="text-indigo-600 font-medium">Click to upload</span> or drag and drop
                          <p className="text-sm text-slate-500 mt-1">Accepts: PDF, JPG, PNG, CSV</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {autoFillSuccess && (
                  <div className="mt-6 text-left space-y-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                      <CheckCircle2 className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-emerald-800">Extraction Successful</h4>
                        <p className="text-emerald-700 text-sm">Form auto-filled with {autoFillConfidence}% confidence. Please review all fields before submitting.</p>
                      </div>
                    </div>
                    {autoFillWarnings.length > 0 && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2"><AlertCircle size={16}/> Warnings</h4>
                        <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                          {autoFillWarnings.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-8 flex items-center justify-center gap-4">
                  <div className="h-px bg-slate-200 flex-1 max-w-[100px]"></div>
                  <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">OR</span>
                  <div className="h-px bg-slate-200 flex-1 max-w-[100px]"></div>
                </div>

                <button 
                  onClick={() => setStep(1)}
                  className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                >
                  {autoFillSuccess ? 'Review & Continue →' : 'Fill Manually →'}
                </button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <User className="text-indigo-600" /> Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Full Name</label>
                    <input 
                      type="text" 
                      className={`w-full px-4 py-2 rounded-xl border ${stepErrors.fullName ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-indigo-500'} focus:ring-2 outline-none transition-all`}
                      value={formData.personalInfo.fullName}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                    {(nameError || stepErrors.fullName) && <p className="text-red-500 text-xs mt-1">{nameError || stepErrors.fullName}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                    <input 
                      type="email" 
                      className={`w-full px-4 py-2 rounded-xl border ${stepErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-indigo-500'} focus:ring-2 outline-none transition-all`}
                      value={formData.personalInfo.email}
                      onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, email: e.target.value } })}
                    />
                    {stepErrors.email && <p className="text-red-500 text-xs mt-1">{stepErrors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Phone Number</label>
                    <input 
                      type="tel" 
                      className={`w-full px-4 py-2 rounded-xl border ${stepErrors.phone ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-indigo-500'} focus:ring-2 outline-none transition-all`}
                      value={formData.personalInfo.phone}
                      onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, phone: e.target.value } })}
                    />
                    {stepErrors.phone && <p className="text-red-500 text-xs mt-1">{stepErrors.phone}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Date of Birth</label>
                    <input 
                      type="date" 
                      className={`w-full px-4 py-2 rounded-xl border ${stepErrors.dateOfBirth ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-indigo-500'} focus:ring-2 outline-none transition-all`}
                      value={formData.personalInfo.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, personalInfo: { ...formData.personalInfo, dateOfBirth: e.target.value } })}
                    />
                    {stepErrors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{stepErrors.dateOfBirth}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <GraduationCap className="text-indigo-600" /> Education Path
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {Object.values(EducationPath).map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePathChange(p)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        formData.educationPath === p ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold text-indigo-600 uppercase mb-1">Path</div>
                      <div className="text-sm font-medium">{p}</div>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {stepErrors.tenth && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{stepErrors.tenth}</div>}
                  {stepErrors.twelfth && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{stepErrors.twelfth}</div>}
                  {stepErrors.diploma && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{stepErrors.diploma}</div>}
                  {stepErrors.ug && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{stepErrors.ug}</div>}
                  {Object.keys(stepErrors).some(k => k.startsWith('edu_')) && (
                    <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                      Please ensure all education entries have a valid Board/University, Year of Passing, and Score.
                    </div>
                  )}

                  {formData.educationHistory.map((edu, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-indigo-600">{edu.level}</span>
                        {idx > 1 && (
                          <button 
                            onClick={() => setFormData({ ...formData, educationHistory: formData.educationHistory.filter((_, i) => i !== idx) })}
                            className="text-red-500 hover:bg-red-50 p-1 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input 
                          placeholder="Board / University"
                          className="px-3 py-2 rounded-lg border border-slate-200 bg-white"
                          value={edu.boardUniversity}
                          onChange={(e) => {
                            const newEdu = [...formData.educationHistory];
                            newEdu[idx].boardUniversity = e.target.value;
                            setFormData({ ...formData, educationHistory: newEdu });
                          }}
                        />
                        {edu.level !== EducationLevel.TENTH && (
                          <input 
                            placeholder="Stream / Specialization"
                            className="px-3 py-2 rounded-lg border border-slate-200 bg-white"
                            value={edu.stream || ''}
                            onChange={(e) => {
                              const newEdu = [...formData.educationHistory];
                              newEdu[idx].stream = e.target.value;
                              setFormData({ ...formData, educationHistory: newEdu });
                            }}
                          />
                        )}
                        <input 
                          type="number"
                          placeholder="Year of Passing"
                          className="px-3 py-2 rounded-lg border border-slate-200 bg-white"
                          value={edu.yearOfPassing || ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                            const newEdu = [...formData.educationHistory];
                            newEdu[idx].yearOfPassing = val;
                            setFormData({ ...formData, educationHistory: newEdu });
                          }}
                        />
                        <div className="flex gap-2">
                          <input 
                            type="number"
                            placeholder="Score"
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white"
                            value={edu.score || ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              const newEdu = [...formData.educationHistory];
                              newEdu[idx].score = val;
                              setFormData({ ...formData, educationHistory: newEdu });
                            }}
                          />
                          <select 
                            className="px-2 py-2 rounded-lg border border-slate-200 bg-white text-xs"
                            value={edu.scoreScale}
                            onChange={(e) => {
                              const newEdu = [...formData.educationHistory];
                              newEdu[idx].scoreScale = e.target.value as any;
                              setFormData({ ...formData, educationHistory: newEdu });
                            }}
                          >
                            <option>Percentage</option>
                            <option>CGPA (out of 10)</option>
                            <option>CGPA (out of 4)</option>
                            <option>Grade</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(edu.level === EducationLevel.UG || edu.level === EducationLevel.PG) && (
                          <input 
                            type="number"
                            placeholder="Backlogs"
                            className="px-3 py-2 rounded-lg border border-slate-200 bg-white"
                            value={edu.backlogs || ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                              const newEdu = [...formData.educationHistory];
                              newEdu[idx].backlogs = val;
                              setFormData({ ...formData, educationHistory: newEdu });
                            }}
                          />
                        )}
                        <input 
                          type="number"
                          placeholder="Gap After This Level (Months)"
                          className="px-3 py-2 rounded-lg border border-slate-200 bg-white"
                          value={edu.gapMonths || ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                            const newEdu = [...formData.educationHistory];
                            newEdu[idx].gapMonths = val;
                            setFormData({ ...formData, educationHistory: newEdu });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={addEducation}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Add Higher Education (UG/PG)
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <Briefcase className="text-indigo-600" /> Work Experience
                </h2>

                <div className="space-y-4">
                  {stepErrors.work && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{stepErrors.work}</div>}
                  {formData.workExperience.map((work, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input 
                          placeholder="Company"
                          className="px-3 py-2 rounded-lg border border-slate-200 bg-white"
                          value={work.company}
                          onChange={(e) => {
                            const newWork = [...formData.workExperience];
                            newWork[idx].company = e.target.value;
                            setFormData({ ...formData, workExperience: newWork });
                          }}
                        />
                        <input 
                          placeholder="Role"
                          className="px-3 py-2 rounded-lg border border-slate-200 bg-white"
                          value={work.role}
                          onChange={(e) => {
                            const newWork = [...formData.workExperience];
                            newWork[idx].role = e.target.value;
                            setFormData({ ...formData, workExperience: newWork });
                          }}
                        />
                        <select 
                          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                          value={work.domain}
                          onChange={(e) => {
                            const newWork = [...formData.workExperience];
                            newWork[idx].domain = e.target.value as any;
                            setFormData({ ...formData, workExperience: newWork });
                          }}
                        >
                          <option>IT</option>
                          <option>Non-IT</option>
                          <option>Government</option>
                          <option>Startup</option>
                          <option>Freelance</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input 
                          type="date"
                          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                          value={work.startDate}
                          onChange={(e) => {
                            const newWork = [...formData.workExperience];
                            newWork[idx].startDate = e.target.value;
                            setFormData({ ...formData, workExperience: newWork });
                          }}
                        />
                        {!work.isCurrent && (
                          <input 
                            type="date"
                            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                            value={work.endDate || ''}
                            onChange={(e) => {
                              const newWork = [...formData.workExperience];
                              newWork[idx].endDate = e.target.value;
                              setFormData({ ...formData, workExperience: newWork });
                            }}
                          />
                        )}
                        <div className="flex items-center gap-2 px-3">
                          <input 
                            type="checkbox" 
                            checked={work.isCurrent}
                            onChange={(e) => {
                              const newWork = [...formData.workExperience];
                              newWork[idx].isCurrent = e.target.checked;
                              if (e.target.checked) newWork[idx].endDate = undefined;
                              setFormData({ ...formData, workExperience: newWork });
                            }}
                          />
                          <span className="text-sm">Currently working</span>
                        </div>
                        <select 
                          className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm"
                          value={work.employmentType}
                          onChange={(e) => {
                            const newWork = [...formData.workExperience];
                            newWork[idx].employmentType = e.target.value as any;
                            setFormData({ ...formData, workExperience: newWork });
                          }}
                        >
                          <option>Full-time</option>
                          <option>Part-time</option>
                          <option>Internship</option>
                          <option>Contract</option>
                          <option>Freelance</option>
                        </select>
                      </div>
                      <input 
                        placeholder="Key Skills (comma separated)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                        value={work.skills.join(', ')}
                        onChange={(e) => {
                          const newWork = [...formData.workExperience];
                          newWork[idx].skills = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                          setFormData({ ...formData, workExperience: newWork });
                        }}
                      />
                    </div>
                  ))}
                  <button 
                    onClick={addWork}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Add Experience
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && result && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <div className="text-center">
                  {result.status === 'SUCCESS' && <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={64} />}
                  {result.status === 'FLAG' && <AlertCircle className="mx-auto text-amber-500 mb-4" size={64} />}
                  {result.status === 'REJECT' && <XCircle className="mx-auto text-red-500 mb-4" size={64} />}
                  
                  <h2 className="text-3xl font-bold mb-2">
                    {result.status === 'SUCCESS' ? 'Application Success' : 
                     result.status === 'FLAG' ? 'Under Review' : 'Application Rejected'}
                  </h2>
                  <p className="text-slate-500 max-w-md mx-auto">{result.explanation}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Intelligence Metrics</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Risk Score</span>
                        <span className={`font-bold ${result.tier3Enrichment.riskScore > 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {result.tier3Enrichment.riskScore}/100
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Fit Category</span>
                        <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                          {result.tier3Enrichment.category}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Total Experience</span>
                        <span className="font-medium">{result.tier3Enrichment.totalExperienceMonths} Months</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Normalized Scores</h3>
                    <div className="space-y-2">
                      {(Object.entries(result.tier3Enrichment.normalizedScores) as [string, number][]).map(([lvl, score]) => (
                        <div key={lvl} className="flex items-center gap-4">
                          <span className="text-xs font-bold w-12">{lvl}</span>
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${score}%` }} />
                          </div>
                          <span className="text-xs font-medium">{score.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {result.aiInsights && (
                  <div className="p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-4">
                    <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                      <Loader2 size={16} className="animate-pulse" /> AI Intelligence Insights
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400 uppercase">Summary</span>
                        <p className="text-sm text-slate-700 leading-relaxed">{result.aiInsights.summary}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400 uppercase">Career Alignment</span>
                        <p className="text-sm text-slate-700 leading-relaxed">{result.aiInsights.alignment}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400 uppercase">Strengths</span>
                        <p className="text-sm text-slate-700 leading-relaxed">{result.aiInsights.strengths}</p>
                      </div>
                    </div>
                  </div>
                )}

                {result.tier2Flags.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <h4 className="text-amber-800 font-bold text-sm mb-2 flex items-center gap-2">
                      <AlertCircle size={16} /> System Flags
                    </h4>
                    <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                      {result.tier2Flags.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                )}

                <button 
                  onClick={() => { setStep(1); setResult(null); }}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
                >
                  Start New Application
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Navigation Buttons */}
        {step > 0 && step < 4 && (
          <div className="mt-8 flex justify-between">
            <button 
              disabled={step === 1 || loading}
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 rounded-xl border border-slate-200 font-medium flex items-center gap-2 hover:bg-white disabled:opacity-50"
            >
              <ChevronLeft size={20} /> Back
            </button>
            
            {step < 3 ? (
              <button 
                onClick={handleNext}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
              >
                Next <ChevronRight size={20} />
              </button>
            ) : (
              <button 
                disabled={loading}
                onClick={handleSubmit}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Submit Application'}
              </button>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
