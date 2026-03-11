import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, Shield, ArrowRight, Loader2, KeyRound, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type AuthStep = 'choose' | 'email' | 'phone' | 'otp' | 'success';
type EmailStep = 'signin' | 'signup';

const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const [step, setStep] = useState<AuthStep>('choose');
  const [emailStep, setEmailStep] = useState<EmailStep>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null);

  const reset = () => {
    setStep('choose');
    setEmail(''); setPassword(''); setPhone(''); setOtp('');
    setLoading(false); setLoadingMethod(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const showSuccess = () => {
    setStep('success');
    setLoading(false);
    setLoadingMethod(null);
    setTimeout(() => handleClose(), 2200);
  };

  const handleGoogle = async () => {
    setLoadingMethod('google'); setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) { toast.error(error.message); setLoading(false); setLoadingMethod(null); }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) return;
    setLoading(true); setLoadingMethod('email');
    if (emailStep === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error(error.message); setLoading(false); setLoadingMethod(null); return; }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { toast.error(error.message); setLoading(false); setLoadingMethod(null); return; }
    }
    showSuccess();
  };

  const handlePhoneSend = async () => {
    if (!phone) return;
    setLoading(true); setLoadingMethod('phone');
    const formatted = phone.startsWith('+') ? phone : `+91${phone}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
    if (error) { toast.error(error.message); setLoading(false); setLoadingMethod(null); return; }
    toast.success('OTP sent!');
    setStep('otp'); setLoading(false); setLoadingMethod(null);
  };

  const handleOtpVerify = async () => {
    if (!otp) return;
    setLoading(true); setLoadingMethod('otp');
    const formatted = phone.startsWith('+') ? phone : `+91${phone}`;
    const { error } = await supabase.auth.verifyOtp({ phone: formatted, token: otp, type: 'sms' });
    if (error) { toast.error(error.message); setLoading(false); setLoadingMethod(null); return; }
    showSuccess();
  };

  const slide = {
    enter: { opacity: 0, x: 28 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -28 },
  };

  return (
    <AnimatePresence>
      {open && (
        /* ── Full viewport overlay, flex-centered ── */
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ margin: 0 }}
        >
          {/* Blurred backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/65 backdrop-blur-md"
          />

          {/* Card — stops clicks from closing */}
          <motion.div
            initial={{ opacity: 0, scale: 0.84, y: 44 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="relative z-10 w-full max-w-[360px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-card rounded-[28px] shadow-2xl border border-border/40 overflow-hidden">

              {/* ── SUCCESS ── */}
              <AnimatePresence mode="wait">
                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="gradient-hero flex flex-col items-center justify-center py-16 px-8 text-center relative overflow-hidden"
                  >
                    {/* Expanding rings */}
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute rounded-full border-2 border-primary/25"
                        initial={{ width: 64, height: 64, opacity: 0.9 }}
                        animate={{ width: 220, height: 220, opacity: 0 }}
                        transition={{ delay: i * 0.22, duration: 1.4, ease: 'easeOut', repeat: 1, repeatDelay: 0.5 }}
                        style={{ top: '50%', left: '50%', translateX: '-50%', translateY: '-50%' }}
                      />
                    ))}

                    {/* Check */}
                    <motion.div
                      initial={{ scale: 0, rotate: -120 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 440, damping: 18, delay: 0.1 }}
                      className="relative w-20 h-20 rounded-full gradient-primary flex items-center justify-center shadow-glow mb-5"
                    >
                      <CheckCircle2 className="w-10 h-10 text-white" />
                    </motion.div>

                    {/* Confetti particles */}
                    {[...Array(10)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-2.5 h-2.5 rounded-full"
                        style={{
                          background: ['#2dd4bf','#f97316','#60a5fa','#a78bfa','#34d399'][i % 5],
                          top: '42%', left: '50%',
                        }}
                        initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                        animate={{
                          opacity: 0, scale: 0.2,
                          x: Math.cos((i / 10) * Math.PI * 2) * 90,
                          y: Math.sin((i / 10) * Math.PI * 2) * 90,
                        }}
                        transition={{ delay: 0.2, duration: 1.0, ease: 'easeOut' }}
                      />
                    ))}

                    <motion.h2
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.38 }}
                      className="text-2xl font-bold text-white mb-2"
                    >
                      Welcome! 🎉
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="text-white/55 text-sm"
                    >
                      You're now signed in to MediSafe
                    </motion.p>

                    {/* Progress bar */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.65 }}
                      className="mt-7 w-36 h-1 rounded-full bg-white/10 overflow-hidden"
                    >
                      <motion.div
                        className="h-full rounded-full gradient-primary"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2.0, ease: 'linear' }}
                      />
                    </motion.div>
                  </motion.div>
                )}

                {/* ── FORM ── */}
                {step !== 'success' && (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                    {/* Header */}
                    <div className="gradient-hero px-6 pt-7 pb-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-grid opacity-[0.04]" />
                      <motion.div
                        className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-primary/20 blur-3xl pointer-events-none"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 5, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-secondary/15 blur-3xl pointer-events-none"
                        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      />

                      <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all z-10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="relative text-center">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                          className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3 shadow-glow"
                        >
                          {step === 'otp' ? <KeyRound className="w-7 h-7 text-white" /> : <Shield className="w-7 h-7 text-white" />}
                        </motion.div>

                        <AnimatePresence mode="wait">
                          <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                          >
                            <h2 className="text-lg font-bold text-white mb-1">
                              {step === 'otp' ? 'Enter OTP'
                                : step === 'phone' ? 'Phone Login'
                                : step === 'email' ? (emailStep === 'signin' ? 'Welcome Back' : 'Create Account')
                                : 'Sign In to MediSafe'}
                            </h2>
                            <p className="text-white/45 text-xs">
                              {step === 'choose' ? 'Save medicine history & family profiles'
                                : step === 'otp' ? `Code sent to +91 ${phone}`
                                : 'Enter your details to continue'}
                            </p>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5">
                      <AnimatePresence mode="wait">

                        {/* Choose */}
                        {step === 'choose' && (
                          <motion.div key="choose" variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }} className="space-y-2.5">
                            {/* Google */}
                            <motion.button
                              whileHover={{ scale: 1.02, y: -1 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={handleGoogle}
                              disabled={loading}
                              className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group disabled:opacity-60"
                            >
                              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                                {loadingMethod === 'google'
                                  ? <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                  : <svg className="w-5 h-5" viewBox="0 0 24 24">
                                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                }
                              </div>
                              <div className="flex-1 text-left">
                                <span className="text-sm font-semibold block">Continue with Google</span>
                                <span className="text-[10px] text-muted-foreground">Fastest sign-in method</span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                            </motion.button>

                            {/* Phone */}
                            <motion.button
                              whileHover={{ scale: 1.02, y: -1 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setStep('phone')}
                              className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group"
                            >
                              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                                <Phone className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 text-left">
                                <span className="text-sm font-semibold block">Continue with Phone OTP</span>
                                <span className="text-[10px] text-muted-foreground">Works with any Indian number</span>
                              </div>
                              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                            </motion.button>

                            {/* Email */}
                            <motion.button
                              whileHover={{ scale: 1.02, y: -1 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setStep('email')}
                              className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group"
                            >
                              <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                                <Mail className="w-4 h-4 text-primary" />
                              </div>
                              <span className="flex-1 text-left text-sm font-semibold">Continue with Email</span>
                              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                            </motion.button>

                            <div className="flex items-center gap-2 pt-1">
                              <Sparkles className="w-3 h-3 text-primary/50 flex-shrink-0" />
                              <p className="text-[10px] text-muted-foreground">App works without login too. Sign in to unlock history & family profiles.</p>
                            </div>
                          </motion.div>
                        )}

                        {/* Email */}
                        {step === 'email' && (
                          <motion.div key="email" variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }} className="space-y-3">
                            <div className="flex gap-1 p-1 rounded-xl bg-muted/60 border border-border/50">
                              <button onClick={() => setEmailStep('signin')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${emailStep === 'signin' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>Sign In</button>
                              <button onClick={() => setEmailStep('signup')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${emailStep === 'signup' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>Sign Up</button>
                            </div>
                            <motion.input initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                              type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
                              className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                            />
                            <motion.input initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                              type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                              className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                              onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                            />
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                              <Button onClick={handleEmailAuth} disabled={loading || !email || !password} className="w-full gradient-primary text-white rounded-xl py-5 text-sm font-semibold">
                                {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Signing in...</> : emailStep === 'signin' ? 'Sign In →' : 'Create Account →'}
                              </Button>
                            </motion.div>
                            <button onClick={() => setStep('choose')} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center">← Back</button>
                          </motion.div>
                        )}

                        {/* Phone */}
                        {step === 'phone' && (
                          <motion.div key="phone" variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }} className="space-y-3">
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              className="flex rounded-xl border border-border overflow-hidden bg-muted/30 focus-within:ring-2 focus-within:ring-primary/30 transition-all"
                            >
                              <div className="px-3 py-3 bg-muted/60 border-r border-border flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-sm">🇮🇳</span>
                                <span className="text-xs font-bold text-muted-foreground">+91</span>
                              </div>
                              <input type="tel" value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="10-digit mobile number"
                                className="flex-1 px-4 py-3 bg-transparent text-sm focus:outline-none min-w-0"
                                onKeyDown={(e) => e.key === 'Enter' && handlePhoneSend()}
                                autoFocus
                              />
                            </motion.div>
                            <div className="flex gap-1 px-1">
                              {Array.from({ length: 10 }).map((_, i) => (
                                <motion.div key={i}
                                  className={`h-1 rounded-full flex-1 transition-colors duration-150 ${i < phone.length ? 'bg-primary' : 'bg-muted'}`}
                                  animate={i < phone.length ? { scaleY: [1, 2, 1] } : {}}
                                  transition={{ duration: 0.15 }}
                                />
                              ))}
                            </div>
                            <Button onClick={handlePhoneSend} disabled={loading || phone.length < 10} className="w-full gradient-primary text-white rounded-xl py-5 text-sm font-semibold">
                              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending...</> : 'Send OTP →'}
                            </Button>
                            <button onClick={() => setStep('choose')} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center">← Back</button>
                          </motion.div>
                        )}

                        {/* OTP */}
                        {step === 'otp' && (
                          <motion.div key="otp" variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }} className="space-y-3">
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-3 p-3 rounded-xl bg-primary/8 border border-primary/15"
                            >
                              <KeyRound className="w-4 h-4 text-primary flex-shrink-0" />
                              <p className="text-xs text-muted-foreground">OTP sent to <span className="font-semibold text-foreground">+91 {phone}</span></p>
                            </motion.div>
                            <motion.input
                              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                              type="text" value={otp}
                              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="• • • • • •"
                              className="w-full px-4 py-4 rounded-xl border border-border bg-muted/30 text-center font-mono-medical font-bold tracking-[0.5em] text-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                              onKeyDown={(e) => e.key === 'Enter' && handleOtpVerify()}
                              autoFocus
                            />
                            <div className="flex gap-2 justify-center">
                              {Array.from({ length: 6 }).map((_, i) => (
                                <motion.div key={i}
                                  className={`h-1.5 rounded-full transition-colors duration-150 ${i < otp.length ? 'bg-primary' : 'bg-muted'}`}
                                  style={{ width: 28 }}
                                  animate={i < otp.length ? { scaleY: [1, 2.2, 1] } : {}}
                                  transition={{ duration: 0.18 }}
                                />
                              ))}
                            </div>
                            <Button onClick={handleOtpVerify} disabled={loading || otp.length < 6} className="w-full gradient-primary text-white rounded-xl py-5 text-sm font-semibold">
                              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Verifying...</> : 'Verify & Sign In →'}
                            </Button>
                            <button onClick={() => { setOtp(''); setStep('phone'); }} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center">← Resend OTP</button>
                          </motion.div>
                        )}

                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
