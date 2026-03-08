import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Keyboard, ArrowRight, FlaskConical, Sparkles, Check, AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, Volume2, RotateCcw, Clock, UtensilsCrossed, IndianRupee, Pill, X, Image as ImageIcon, FileText, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/languageContext';
import { sampleMedicines, sampleInteractions, sampleFoodInteractions, sampleSchedule, Medicine, Interaction, FoodInteraction, ScheduleItem } from '@/lib/mockData';
import { runOCR, parseManualInput } from '@/lib/ocrEngine';
import { analyzeMedicines, AIAnalysisResult } from '@/lib/aiAnalysis';
import { toast } from 'sonner';

type AppState = 'input' | 'processing' | 'results';

const getProcessingSteps = (t: (key: string) => string) => [
  { key: 'reading', icon: Camera, label: t('processing.reading') },
  { key: 'identifying', icon: FlaskConical, label: t('processing.identifying') },
  { key: 'checking', icon: Sparkles, label: t('processing.checking') },
  { key: 'generating', icon: Check, label: t('processing.generating') },
];

const getSeverityConfig = (t: (key: string) => string) => ({
  critical: { color: 'border-destructive/40 bg-destructive/5', icon: AlertTriangle, iconColor: 'text-destructive', badge: 'bg-destructive text-destructive-foreground', label: t('results.critical') },
  moderate: { color: 'border-warning/40 bg-warning/5', icon: AlertCircle, iconColor: 'text-warning', badge: 'bg-warning text-warning-foreground', label: t('results.moderate') },
  minor: { color: 'border-success/40 bg-success/5', icon: Info, iconColor: 'text-success', badge: 'bg-success text-success-foreground', label: t('results.minor') },
});

const foodSeverityConfig = {
  avoid: { badge: 'bg-destructive text-destructive-foreground', label: '🚫 Avoid' },
  caution: { badge: 'bg-warning text-warning-foreground', label: '⚠️ Caution' },
  timing: { badge: 'bg-primary text-primary-foreground', label: '🕐 Timing' },
};

const severityOrder = { critical: 0, moderate: 1, minor: 2 };
const foodSeverityOrder = { avoid: 0, caution: 1, timing: 2 };

const CheckMedicines = () => {
  const { t } = useLanguage();
  const processingSteps = getProcessingSteps(t);
  const severityConfig = getSeverityConfig(t);
  const [state, setState] = useState<AppState>('input');
  const [inputMode, setInputMode] = useState<'upload' | 'manual'>('upload');
  const [manualInput, setManualInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [expandedInteraction, setExpandedInteraction] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ocrRawText, setOcrRawText] = useState('');
  const [detectedNames, setDetectedNames] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [aiPowered, setAiPowered] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const [matchedMedicines, setMatchedMedicines] = useState<Medicine[]>([]);
  const [activeInteractions, setActiveInteractions] = useState<Interaction[]>([]);
  const [activeFoodInteractions, setActiveFoodInteractions] = useState<FoodInteraction[]>([]);
  const [activeSchedule, setActiveSchedule] = useState<ScheduleItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const clearUpload = () => {
    setUploadedImage(null);
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const runAIAnalysis = async (names: string[]) => {
    setCurrentStep(2);
    try {
      const result = await analyzeMedicines(names);
      setAiPowered(true);
      setAiSummary(result.summary || '');
      setMatchedMedicines(result.medicines);
      setActiveInteractions(result.interactions);
      setActiveFoodInteractions(result.foodInteractions);
      setActiveSchedule(result.schedule);
      setCurrentStep(3);
      setTimeout(() => setState('results'), 600);
    } catch (err) {
      console.error('AI analysis failed, falling back to local data:', err);
      toast.error('AI analysis unavailable, using local database', { duration: 4000 });
      fallbackToLocalData(names);
    }
  };

  const fallbackToLocalData = (names: string[]) => {
    setAiPowered(false);
    const lower = names.map(n => n.toLowerCase());
    const medicines = sampleMedicines.filter(m =>
      lower.some(n => n.includes(m.name.toLowerCase().split(' ')[0]) || m.name.toLowerCase().includes(n.split(' ')[0]))
    );
    const finalMeds = medicines.length > 0 ? medicines : sampleMedicines;
    const medNames = finalMeds.map(m => m.name);
    setMatchedMedicines(finalMeds);
    setActiveInteractions(sampleInteractions.filter(i => medNames.includes(i.medicine1) && medNames.includes(i.medicine2)));
    setActiveFoodInteractions(sampleFoodInteractions.filter(fi => medNames.includes(fi.medicine)));
    setActiveSchedule(sampleSchedule.filter(s => s.medicines.some(m => medNames.includes(m))));
    setCurrentStep(3);
    setTimeout(() => setState('results'), 600);
  };

  const processWithOCR = async () => {
    if (!uploadedFile) return;
    setState('processing');
    setCurrentStep(0);
    setOcrProgress(0);
    try {
      const result = await runOCR(uploadedFile, (progress) => {
        setOcrProgress(progress);
        if (progress < 60) setCurrentStep(0);
        else if (progress < 80) setCurrentStep(1);
      });
      setOcrRawText(result.rawText);
      setDetectedNames(result.medicineNames);
      setCurrentStep(1);
      if (result.medicineNames.length > 0) {
        await runAIAnalysis(result.medicineNames);
      } else {
        toast.info('No medicines detected from image. Using demo data.');
        setDetectedNames(sampleMedicines.map(m => m.name));
        await runAIAnalysis(sampleMedicines.map(m => m.name));
      }
    } catch (err) {
      console.error('OCR failed:', err);
      toast.error('Could not read image. Using demo data.');
      setDetectedNames(sampleMedicines.map(m => m.name));
      await runAIAnalysis(sampleMedicines.map(m => m.name));
    }
  };

  const processManualInput = async () => {
    setState('processing');
    setCurrentStep(0);
    const names = parseManualInput(manualInput);
    setDetectedNames(names);
    setCurrentStep(0);
    await new Promise(r => setTimeout(r, 500));
    setCurrentStep(1);
    await new Promise(r => setTimeout(r, 500));
    if (names.length > 0) {
      await runAIAnalysis(names);
    } else {
      toast.info('No medicines found in text. Using demo data.');
      await runAIAnalysis(sampleMedicines.map(m => m.name));
    }
  };

  const startProcessing = () => {
    if (inputMode === 'upload' && uploadedFile) {
      processWithOCR();
    } else if (inputMode === 'manual' && manualInput.trim()) {
      processManualInput();
    } else {
      setDetectedNames(sampleMedicines.map(m => m.name));
      setState('processing');
      setCurrentStep(0);
      (async () => {
        await new Promise(r => setTimeout(r, 400));
        setCurrentStep(1);
        await new Promise(r => setTimeout(r, 400));
        await runAIAnalysis(sampleMedicines.map(m => m.name));
      })();
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) { speechSynthesis.cancel(); setIsSpeaking(false); return; }
    const criticals = activeInteractions.filter(i => i.severity === 'critical');
    const text = aiSummary
      ? `Safety Report: ${aiSummary}`
      : criticals.length > 0
        ? `Safety Report: ${criticals.length} critical interactions found. ${criticals.map(i => `${i.medicine1} and ${i.medicine2}: ${i.description}`).join('. ')}`
        : `Safety Report: ${matchedMedicines.length} medicines analyzed. No critical interactions found.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    speechSynthesis.speak(utterance);
  };

  const sortedInteractions = [...activeInteractions].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  const sortedFoodInteractions = [...activeFoodInteractions].sort((a, b) => foodSeverityOrder[a.severity] - foodSeverityOrder[b.severity]);
  const criticalCount = activeInteractions.filter(i => i.severity === 'critical').length;
  const moderateCount = activeInteractions.filter(i => i.severity === 'moderate').length;
  const minorCount = activeInteractions.filter(i => i.severity === 'minor').length;
  const overallSeverity = criticalCount > 0 ? 'critical' : moderateCount > 0 ? 'moderate' : 'safe';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header matching home page */}
      <div className="gradient-hero relative overflow-hidden pt-20 pb-16">
        <div className="absolute inset-0 bg-grid opacity-[0.04]" />
        <div className="absolute top-10 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        <div className="relative container mx-auto px-4 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/10 text-primary-glow text-[10px] font-semibold tracking-wider uppercase mb-4">
            <Zap className="w-3 h-3" />
            {t('upload.poweredBy')}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight text-white">{t('upload.title')}</h1>
          <p className="text-sm text-white/50">{t('upload.subtitle')}</p>
        </div>
      </div>

      {/* Main content card overlapping hero */}
      <div className="container mx-auto px-4 max-w-2xl -mt-6 pb-24 relative z-10">
        <div className="bg-card rounded-2xl shadow-elevated border border-border/50 p-5 md:p-6">
          <AnimatePresence mode="wait">

            {/* ══════ INPUT STATE ══════ */}
            {state === 'input' && (
              <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>


              {/* Mode toggle */}
              <div className="flex gap-1 mb-6 p-1 rounded-xl bg-muted/60 border border-border/50">
                <button
                  onClick={() => setInputMode('upload')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    inputMode === 'upload' ? 'bg-card shadow-elevated text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" /> {t('upload.camera')}
                </button>
                <button
                  onClick={() => setInputMode('manual')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    inputMode === 'manual' ? 'bg-card shadow-elevated text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Keyboard className="w-3.5 h-3.5" /> {t('upload.manual')}
                </button>
              </div>

              {inputMode === 'upload' ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(file); }}
                  />
                  {!uploadedImage ? (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className={`relative border-2 border-dashed rounded-2xl p-10 md:p-12 text-center transition-all duration-200 cursor-pointer group ${
                        isDragOver
                          ? 'border-primary bg-primary/5 scale-[1.01]'
                          : 'border-border hover:border-primary/40 hover:bg-primary/[0.02]'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-200">
                        <Upload className="w-7 h-7 text-primary" />
                      </div>
                      <p className="text-foreground font-semibold text-sm mb-1">{t('upload.dragdrop')}</p>
                      <p className="text-xs text-muted-foreground mb-5">{t('upload.or')}</p>
                      <div className="flex gap-2.5 justify-center">
                        <Button variant="outline" size="sm" className="rounded-lg gap-1.5 text-xs h-8 shadow-sm">
                          <ImageIcon className="w-3.5 h-3.5" />
                          {t('upload.browse')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg gap-1.5 text-xs h-8 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            const input = fileInputRef.current;
                            if (input) { input.removeAttribute('capture'); input.click(); setTimeout(() => input.setAttribute('capture', 'environment'), 100); }
                          }}
                        >
                          <Camera className="w-3.5 h-3.5" />
                           Take Photo
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 mt-5">
                        JPG, PNG • {t('upload.fileHint').replace('JPG, PNG • ', '')}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-2xl overflow-hidden border border-border shadow-elevated"
                    >
                      <img src={uploadedImage} alt="Uploaded medicine" className="w-full max-h-64 object-contain bg-muted/20" />
                      <button
                        onClick={clearUpload}
                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-foreground/80 text-background flex items-center justify-center hover:bg-foreground transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="p-3 bg-success/10 border-t border-success/20 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-success" />
                        <span className="text-xs text-success font-medium">{t('upload.imageReady')}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto font-mono-medical">
                          {uploadedFile && `${(uploadedFile.size / 1024).toFixed(0)} KB`}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <textarea
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder={t('upload.manualPlaceholder')}
                    className="w-full h-36 p-4 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 font-mono-medical text-sm shadow-sm transition-all"
                  />
                </motion.div>
              )}

              <Button
                onClick={startProcessing}
                className="w-full mt-5 gradient-primary text-primary-foreground py-5 rounded-xl text-sm font-semibold shadow-glow-sm hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5 group"
              >
                {uploadedFile ? (
                  <><Zap className="w-4 h-4 mr-1.5" /> {t('upload.scanAnalyze')}</>
                ) : (
                  <>{t('upload.analyze')} <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" /></>
                )}
              </Button>

              <button
                onClick={() => { setManualInput('Amlodipine 5mg\nMetformin 500mg\nDiclofenac 50mg\nThyronorm 50mcg\nEcosprin 75mg'); setInputMode('manual'); }}
                className="w-full mt-3 text-xs text-primary/70 hover:text-primary transition-colors"
              >
                {t('upload.tryDemo')}
              </button>

              {/* Quick tags */}
              <div className="mt-8">
                <p className="text-[10px] text-muted-foreground/60 text-center mb-2.5 uppercase tracking-wider font-medium">{t('upload.commonMeds')}</p>
                <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide justify-center flex-wrap">
                  {['Amlodipine', 'Metformin', 'Paracetamol', 'Omeprazole', 'Ecosprin', 'Thyronorm'].map((med) => (
                    <div key={med} className="px-2.5 py-1 rounded-md bg-muted/60 border border-border/50 text-[10px] font-medium text-muted-foreground">
                      {med}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════ PROCESSING STATE ══════ */}
          {state === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <div className="relative w-20 h-20 mx-auto mb-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-[3px] border-primary/15 border-t-primary"
                />
                <div className="absolute inset-2.5 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-7 h-7 text-primary" />
                </div>
              </div>

              {uploadedFile && currentStep < 2 && (
                <div className="max-w-xs mx-auto mb-8">
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full gradient-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${ocrProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 font-mono-medical">OCR {ocrProgress}%</p>
                </div>
              )}

              <div className="space-y-2.5 max-w-sm mx-auto">
                {processingSteps.map((step, i) => (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                      i < currentStep ? 'bg-success/8' : i === currentStep ? 'bg-primary/8' : 'bg-muted/30'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      i < currentStep ? 'bg-success text-success-foreground' : i === currentStep ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {i < currentStep ? <Check className="w-3.5 h-3.5" /> : <step.icon className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-xs font-medium ${i <= currentStep ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                      {step.label}
                    </span>
                    {i === currentStep && (
                      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ══════ RESULTS STATE ══════ */}
          {state === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

              {/* AI Badge */}
              {aiPowered && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center mb-4"
                >
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-semibold tracking-wide uppercase">
                    <Zap className="w-3 h-3" />
                    {t('results.aiBadge')}
                  </div>
                </motion.div>
              )}

              {/* OCR Debug */}
              {ocrRawText && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mb-4 p-3 rounded-xl bg-muted/30 border border-border/50"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('results.ocrOutput')}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-mono-medical leading-relaxed line-clamp-2">{ocrRawText}</p>
                  {detectedNames.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {detectedNames.map((name, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[9px] font-semibold">{name}</span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* AI Summary */}
              {aiSummary && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mb-4 p-4 rounded-xl bg-card border border-primary/15 shadow-sm"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <p className="text-sm text-foreground/85 leading-relaxed">{aiSummary}</p>
                  </div>
                </motion.div>
              )}

              {/* Overall Status Card */}
              <motion.div
                initial={{ scale: 0.97 }}
                animate={{ scale: 1 }}
                className={`rounded-2xl p-6 mb-6 text-center border shadow-elevated ${
                  overallSeverity === 'critical' ? 'border-destructive/30 bg-destructive/5' :
                  overallSeverity === 'moderate' ? 'border-warning/30 bg-warning/5' :
                  'border-success/30 bg-success/5'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center ${
                  overallSeverity === 'critical' ? 'bg-destructive/15' : overallSeverity === 'moderate' ? 'bg-warning/15' : 'bg-success/15'
                }`}>
                  {overallSeverity === 'safe' ? (
                    <Check className="w-7 h-7 text-success" />
                  ) : (
                    <AlertTriangle className={`w-7 h-7 ${overallSeverity === 'critical' ? 'text-destructive' : 'text-warning'}`} />
                  )}
                </div>
                 <h2 className="text-lg font-bold mb-1">
                   {criticalCount > 0 ? `${criticalCount} ${t('results.criticalFound')}` : t('results.allSafe')}
                 </h2>
                 <p className="text-xs text-muted-foreground">
                   {matchedMedicines.length} {t('results.medicinesCount')} · {activeInteractions.length} {t('results.interactionsCount')}
                 </p>
                <div className="flex justify-center gap-2 mt-3">
                   {criticalCount > 0 && (
                     <span className="px-2 py-0.5 rounded-md bg-destructive/10 text-destructive text-[10px] font-bold">{criticalCount} {t('results.critical')}</span>
                   )}
                   {moderateCount > 0 && (
                     <span className="px-2 py-0.5 rounded-md bg-warning/10 text-warning text-[10px] font-bold">{moderateCount} {t('results.moderate')}</span>
                   )}
                   {minorCount > 0 && (
                     <span className="px-2 py-0.5 rounded-md bg-success/10 text-success text-[10px] font-bold">{minorCount} {t('results.minor')}</span>
                   )}
                </div>
                <div className="mt-4">
                  <Button size="sm" variant="outline" onClick={handleSpeak} className="rounded-lg gap-1.5 h-8 text-xs">
                    <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'text-primary animate-pulse' : ''}`} />
                    {t('results.listen')}
                  </Button>
                </div>
              </motion.div>

              {/* Medicines */}
              <div className="mb-6">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
                  <Pill className="w-3.5 h-3.5" /> {t('results.medicines')} ({matchedMedicines.length})
                </h3>
                <div className="space-y-1.5">
                  {matchedMedicines.map((med, i) => (
                    <motion.div
                      key={med.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-card rounded-xl p-3.5 border border-border/50 shadow-sm flex items-center justify-between hover:shadow-elevated transition-shadow"
                    >
                      <div>
                        <div className="text-sm font-semibold">{med.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono-medical">{med.genericName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-muted-foreground">{med.dosage}</div>
                         {med.genericPrice && (
                           <div className="text-[10px] text-success font-bold">{t('results.save')} ₹{med.price - (med.genericPrice || 0)}</div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Interactions */}
              {sortedInteractions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" /> {t('results.interactions')}
                  </h3>
                  <div className="space-y-2">
                    {sortedInteractions.map((interaction, i) => {
                      const config = severityConfig[interaction.severity];
                      const isExpanded = expandedInteraction === interaction.id;
                      return (
                        <motion.div
                          key={interaction.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className={`rounded-xl border overflow-hidden transition-all shadow-sm ${config.color}`}
                        >
                          <button
                            onClick={() => setExpandedInteraction(isExpanded ? null : interaction.id)}
                            className="w-full flex items-center gap-3 p-3.5 text-left"
                          >
                            <config.icon className={`w-4 h-4 flex-shrink-0 ${config.iconColor}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${config.badge}`}>{config.label}</span>
                              </div>
                              <div className="text-xs font-semibold truncate">{interaction.medicine1} + {interaction.medicine2}</div>
                            </div>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-3.5 pb-3.5 pt-0 border-t border-border/20">
                                  <p className="text-xs text-foreground/75 mt-2.5 mb-2 leading-relaxed">{interaction.description}</p>
                                  <p className="text-xs font-semibold text-primary">💡 {interaction.recommendation}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Food Interactions */}
              {sortedFoodInteractions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
                    <UtensilsCrossed className="w-3.5 h-3.5" /> {t('results.food')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sortedFoodInteractions.map((fi, i) => {
                      const fConfig = foodSeverityConfig[fi.severity];
                      return (
                        <motion.div
                          key={fi.medicine + fi.food}
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.06 }}
                          className="bg-card rounded-xl p-3.5 border border-border/50 shadow-sm hover:shadow-elevated transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xl">{fi.icon}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${fConfig.badge}`}>{fConfig.label}</span>
                          </div>
                          <div className="text-xs font-bold mb-0.5">{fi.food}</div>
                          <div className="text-[10px] text-muted-foreground font-mono-medical mb-1">{fi.medicine}</div>
                          <div className="text-[10px] text-foreground/65 leading-relaxed">{fi.description}</div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Schedule */}
              {activeSchedule.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> {t('results.schedule')}
                  </h3>
                  <div className="space-y-2">
                    {activeSchedule.map((slot, i) => (
                      <motion.div
                        key={slot.time}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-start gap-3 bg-card rounded-xl p-3.5 border border-border/50 shadow-sm"
                      >
                        <div className="text-center min-w-[52px] py-1 px-2 rounded-lg bg-primary/10">
                          <div className="text-xs font-bold text-primary font-mono-medical">{slot.time}</div>
                          <div className="text-[9px] text-muted-foreground">{slot.label}</div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {slot.medicines.map((med) => (
                            <span key={med} className="px-2 py-0.5 rounded-md bg-accent text-accent-foreground text-[10px] font-medium">{med}</span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternatives */}
              {matchedMedicines.some(m => m.genericPrice) && (
                <div className="mb-8">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-3 flex items-center gap-2">
                    <IndianRupee className="w-3.5 h-3.5" /> {t('results.alternatives')}
                  </h3>
                  <div className="space-y-1.5">
                    {matchedMedicines.filter(m => m.genericPrice).map((med, i) => (
                      <motion.div
                        key={med.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="bg-card rounded-xl p-3.5 border border-border/50 shadow-sm flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-semibold">{med.name}</div>
                          <div className="text-[10px] text-muted-foreground">→ {med.genericBrand}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] line-through text-muted-foreground">₹{med.price}</div>
                          <div className="text-xs font-bold text-success">₹{med.genericPrice}</div>
                        </div>
                      </motion.div>
                    ))}
                    <div className="text-center mt-3 p-3 rounded-xl bg-success/8 border border-success/15">
                       <span className="text-success font-bold text-sm">
                         {t('results.totalSavings')}: ₹{matchedMedicines.reduce((acc, m) => acc + (m.genericPrice ? m.price - m.genericPrice : 0), 0)}{t('results.perMonth')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Check Another */}
              <Button
                onClick={() => {
                  setState('input');
                  setExpandedInteraction(null);
                  speechSynthesis.cancel();
                  setIsSpeaking(false);
                  clearUpload();
                  setOcrRawText('');
                  setDetectedNames([]);
                  setManualInput('');
                  setAiPowered(false);
                  setAiSummary('');
                }}
                className="w-full gradient-primary text-primary-foreground py-5 rounded-xl text-sm font-semibold shadow-glow-sm group"
              >
                <RotateCcw className="w-4 h-4 mr-1.5 group-hover:-rotate-180 transition-transform duration-500" />
                {t('results.checkAnother')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CheckMedicines;
