import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Keyboard, ArrowRight, FlaskConical, Sparkles, Check, AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, Volume2, RotateCcw, Clock, UtensilsCrossed, IndianRupee, Pill } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/languageContext';
import { sampleMedicines, sampleInteractions, sampleFoodInteractions, sampleSchedule, Medicine, Interaction } from '@/lib/mockData';

type AppState = 'input' | 'processing' | 'results';

const processingSteps = [
  { key: 'reading', icon: Camera, label: 'Reading medicine text...' },
  { key: 'identifying', icon: FlaskConical, label: 'Identifying medicines...' },
  { key: 'checking', icon: Sparkles, label: 'Checking interactions...' },
  { key: 'generating', icon: Check, label: 'Generating safety report...' },
];

const severityConfig = {
  critical: { color: 'border-destructive/50 bg-destructive/5', icon: AlertTriangle, iconColor: 'text-destructive', badge: 'bg-destructive text-destructive-foreground', label: 'Critical' },
  moderate: { color: 'border-warning/50 bg-warning/5', icon: AlertCircle, iconColor: 'text-warning', badge: 'bg-warning text-warning-foreground', label: 'Moderate' },
  minor: { color: 'border-success/50 bg-success/5', icon: Info, iconColor: 'text-success', badge: 'bg-success text-success-foreground', label: 'Minor' },
};

const foodSeverityConfig = {
  avoid: { badge: 'bg-destructive text-destructive-foreground', label: '🚫 Avoid' },
  caution: { badge: 'bg-warning text-warning-foreground', label: '⚠️ Caution' },
  timing: { badge: 'bg-primary text-primary-foreground', label: '🕐 Timing' },
};

const severityOrder = { critical: 0, moderate: 1, minor: 2 };
const foodSeverityOrder = { avoid: 0, caution: 1, timing: 2 };

const CheckMedicines = () => {
  const { t } = useLanguage();
  const [state, setState] = useState<AppState>('input');
  const [inputMode, setInputMode] = useState<'upload' | 'manual'>('upload');
  const [manualInput, setManualInput] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedInteraction, setExpandedInteraction] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const startProcessing = () => {
    setState('processing');
    setCurrentStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= processingSteps.length) {
        clearInterval(interval);
        setTimeout(() => setState('results'), 600);
      } else {
        setCurrentStep(step);
      }
    }, 900);
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const text = `Safety Report: ${sampleInteractions.filter(i => i.severity === 'critical').length} critical interactions found. ${sampleInteractions.filter(i => i.severity === 'critical').map(i => `${i.medicine1} and ${i.medicine2}: ${i.description}`).join('. ')}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    speechSynthesis.speak(utterance);
  };

  const sortedInteractions = [...sampleInteractions].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  const sortedFoodInteractions = [...sampleFoodInteractions].sort((a, b) => foodSeverityOrder[a.severity] - foodSeverityOrder[b.severity]);
  const criticalCount = sampleInteractions.filter(i => i.severity === 'critical').length;
  const moderateCount = sampleInteractions.filter(i => i.severity === 'moderate').length;
  const minorCount = sampleInteractions.filter(i => i.severity === 'minor').length;
  const overallSeverity = criticalCount > 0 ? 'critical' : moderateCount > 0 ? 'moderate' : 'safe';

  return (
    <div className="min-h-screen pt-20 pb-24">
      <div className="container mx-auto px-4 max-w-2xl">
        <AnimatePresence mode="wait">
          {/* INPUT STATE */}
          {state === 'input' && (
            <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('upload.title')}</h1>
                <p className="text-muted-foreground">{t('upload.subtitle')}</p>
              </div>

              {/* Mode toggle */}
              <div className="flex gap-2 mb-6 p-1 rounded-xl bg-muted">
                <button
                  onClick={() => setInputMode('upload')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${inputMode === 'upload' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                >
                  <Camera className="w-4 h-4" /> {t('upload.camera')}
                </button>
                <button
                  onClick={() => setInputMode('manual')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${inputMode === 'manual' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                >
                  <Keyboard className="w-4 h-4" /> {t('upload.manual')}
                </button>
              </div>

              {inputMode === 'upload' ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="border-2 border-dashed border-primary/30 rounded-2xl p-12 text-center hover:border-primary/60 hover:bg-primary/5 transition-all cursor-pointer group"
                  onClick={() => startProcessing()}
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-foreground font-medium mb-1">{t('upload.dragdrop')}</p>
                  <p className="text-sm text-muted-foreground mb-4">{t('upload.or')}</p>
                  <Button variant="outline" className="rounded-xl">{t('upload.browse')}</Button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <textarea
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder={t('upload.manualPlaceholder')}
                    className="w-full h-40 p-4 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono-medical text-sm"
                  />
                </motion.div>
              )}

              <Button
                onClick={startProcessing}
                className="w-full mt-6 gradient-primary text-primary-foreground py-6 rounded-xl text-lg font-semibold shadow-glow-sm hover:shadow-glow transition-all hover:-translate-y-0.5"
              >
                {t('upload.analyze')}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {/* Demo button */}
              <button
                onClick={() => { setManualInput('Amlodipine 5mg\nMetformin 500mg\nDiclofenac 50mg\nThyronorm 50mcg\nEcosprin 75mg'); setInputMode('manual'); }}
                className="w-full mt-3 text-sm text-primary hover:underline"
              >
                {t('upload.tryDemo')}
              </button>

              {/* Sample Medicine Carousel */}
              <div className="mt-8">
                <p className="text-xs text-muted-foreground text-center mb-3">Common medicines people check:</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {['Amlodipine', 'Metformin', 'Paracetamol', 'Omeprazole', 'Ecosprin', 'Thyronorm'].map((med) => (
                    <div key={med} className="flex-shrink-0 px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {med}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* PROCESSING STATE */}
          {state === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              {/* Animated capsule */}
              <div className="relative w-24 h-24 mx-auto mb-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary"
                />
                <div className="absolute inset-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <Pill className="w-8 h-8 text-primary" />
                </div>
              </div>

              <div className="space-y-4 max-w-sm mx-auto">
                {processingSteps.map((step, i) => (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      i < currentStep ? 'bg-success/10' : i === currentStep ? 'bg-primary/10' : 'bg-muted/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      i < currentStep ? 'bg-success text-success-foreground' : i === currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {i < currentStep ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-sm font-medium ${i <= currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.label}
                    </span>
                    {i === currentStep && (
                      <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
                        className="ml-auto w-2 h-2 rounded-full bg-primary"
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* RESULTS STATE */}
          {state === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {/* Overall Status */}
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={`rounded-2xl p-6 mb-6 text-center border-2 ${
                  overallSeverity === 'critical' ? 'border-destructive/30 bg-destructive/5' :
                  overallSeverity === 'moderate' ? 'border-warning/30 bg-warning/5' :
                  'border-success/30 bg-success/5'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center ${
                  overallSeverity === 'critical' ? 'bg-destructive/20' : overallSeverity === 'moderate' ? 'bg-warning/20' : 'bg-success/20'
                }`}>
                  <AlertTriangle className={`w-8 h-8 ${
                    overallSeverity === 'critical' ? 'text-destructive' : overallSeverity === 'moderate' ? 'text-warning' : 'text-success'
                  }`} />
                </div>
                <h2 className="text-xl font-bold mb-1">
                  {criticalCount > 0 ? `${criticalCount} Critical Interaction${criticalCount > 1 ? 's' : ''} Found` : 'All Safe!'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {sampleMedicines.length} medicines analyzed · {sampleInteractions.length} interactions checked
                </p>
                <div className="flex justify-center gap-3 mt-4">
                  <Button size="sm" variant="outline" onClick={handleSpeak} className="rounded-xl gap-2">
                    <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-primary animate-pulse' : ''}`} />
                    {t('results.listen')}
                  </Button>
                </div>
              </motion.div>

              {/* Medicines Found */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Pill className="w-4 h-4" /> {t('results.medicines')} ({sampleMedicines.length})
                </h3>
                <div className="space-y-2">
                  {sampleMedicines.map((med, i) => (
                    <motion.div
                      key={med.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass rounded-xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-sm">{med.name}</div>
                        <div className="text-xs text-muted-foreground font-mono-medical">{med.genericName}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">{med.dosage}</div>
                        {med.genericPrice && (
                          <div className="text-xs text-success font-medium">
                            Save ₹{med.price - med.genericPrice}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Interactions */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {t('results.interactions')}
                </h3>
                <div className="space-y-3">
                  {sampleInteractions.map((interaction, i) => {
                    const config = severityConfig[interaction.severity];
                    const isExpanded = expandedInteraction === interaction.id;
                    return (
                      <motion.div
                        key={interaction.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className={`rounded-xl border-2 overflow-hidden transition-all ${config.color} ${interaction.severity === 'critical' ? 'animate-pulse-glow' : ''}`}
                        style={interaction.severity === 'critical' ? { animationDuration: '3s' } : {}}
                      >
                        <button
                          onClick={() => setExpandedInteraction(isExpanded ? null : interaction.id)}
                          className="w-full flex items-center gap-3 p-4 text-left"
                        >
                          <config.icon className={`w-5 h-5 flex-shrink-0 ${config.iconColor}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${config.badge}`}>
                                {config.label}
                              </span>
                            </div>
                            <div className="text-sm font-medium truncate">
                              {interaction.medicine1} + {interaction.medicine2}
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-0 border-t border-border/30">
                                <p className="text-sm text-foreground/80 mt-3 mb-2">{interaction.description}</p>
                                <p className="text-sm font-medium text-primary">💡 {interaction.recommendation}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Food Interactions */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4" /> {t('results.food')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sampleFoodInteractions.map((fi, i) => (
                    <motion.div
                      key={fi.medicine + fi.food}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08 }}
                      className="glass rounded-xl p-4 hover:-translate-y-0.5 transition-transform"
                    >
                      <div className="text-2xl mb-2">{fi.icon}</div>
                      <div className="text-sm font-semibold mb-0.5">{fi.food}</div>
                      <div className="text-xs text-muted-foreground font-mono-medical mb-1">{fi.medicine}</div>
                      <div className="text-xs text-foreground/70">{fi.description}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {t('results.schedule')}
                </h3>
                <div className="space-y-3">
                  {sampleSchedule.map((slot, i) => (
                    <motion.div
                      key={slot.time}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-4 glass rounded-xl p-4"
                    >
                      <div className="text-center min-w-[60px]">
                        <div className="text-sm font-bold text-primary">{slot.time}</div>
                        <div className="text-[10px] text-muted-foreground">{slot.label}</div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {slot.medicines.map((med) => (
                          <span key={med} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                            {med}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Alternatives */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" /> {t('results.alternatives')}
                </h3>
                <div className="space-y-2">
                  {sampleMedicines.filter(m => m.genericPrice).map((med, i) => (
                    <motion.div
                      key={med.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass rounded-xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-medium">{med.name}</div>
                        <div className="text-xs text-muted-foreground">→ {med.genericBrand}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs line-through text-muted-foreground">₹{med.price}</div>
                        <div className="text-sm font-bold text-success">₹{med.genericPrice}</div>
                      </div>
                    </motion.div>
                  ))}
                  <div className="text-center mt-3 p-3 rounded-xl bg-success/10">
                    <span className="text-success font-bold text-lg">
                      Total savings: ₹{sampleMedicines.reduce((acc, m) => acc + (m.genericPrice ? m.price - m.genericPrice : 0), 0)}/month
                    </span>
                  </div>
                </div>
              </div>

              {/* Check Another */}
              <Button
                onClick={() => { setState('input'); setExpandedInteraction(null); speechSynthesis.cancel(); setIsSpeaking(false); }}
                className="w-full gradient-primary text-primary-foreground py-6 rounded-xl text-lg font-semibold shadow-glow-sm"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                {t('results.checkAnother')}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CheckMedicines;
