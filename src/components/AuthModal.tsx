import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, Chrome, Shield, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type AuthStep = 'choose' | 'email' | 'phone' | 'otp';
type EmailStep = 'signin' | 'signup';

const AuthModal = ({ open, onClose }: AuthModalProps) => {
  const [step, setStep] = useState<AuthStep>('choose');
  const [emailStep, setEmailStep] = useState<EmailStep>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep('choose');
    setEmail('');
    setPassword('');
    setPhone('');
    setOtp('');
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) return;
    setLoading(true);
    if (emailStep === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error(error.message); setLoading(false); return; }
      toast.success('Welcome back!');
      handleClose();
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { toast.error(error.message); setLoading(false); return; }
      toast.success('Account created! Check your email to verify.');
      handleClose();
    }
    setLoading(false);
  };

  const handlePhoneSend = async () => {
    if (!phone) return;
    setLoading(true);
    const formatted = phone.startsWith('+') ? phone : `+91${phone}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success('OTP sent!');
    setStep('otp');
    setLoading(false);
  };

  const handleOtpVerify = async () => {
    if (!otp) return;
    setLoading(true);
    const formatted = phone.startsWith('+') ? phone : `+91${phone}`;
    const { error } = await supabase.auth.verifyOtp({ phone: formatted, token: otp, type: 'sms' });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success('Welcome to MediSafe!');
    handleClose();
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm px-4"
          >
            <div className="bg-card rounded-3xl shadow-elevated border border-border/50 overflow-hidden">

              {/* Header */}
              <div className="gradient-hero px-6 pt-8 pb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-[0.04]" />
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="relative text-center">
                  <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {step === 'otp' ? 'Enter OTP' : step === 'phone' ? 'Phone Login' : step === 'email' ? (emailStep === 'signin' ? 'Welcome Back' : 'Create Account') : 'Sign In to MediSafe'}
                  </h2>
                  <p className="text-white/50 text-xs">
                    {step === 'choose' ? 'Save your medicine history & family profiles' : step === 'otp' ? `OTP sent to +91 ${phone}` : 'Continue with your account'}
                  </p>
                </div>
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">

                  {/* Choose method */}
                  {step === 'choose' && (
                    <motion.div key="choose" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
                      <button
                        onClick={handleGoogle}
                        disabled={loading}
                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                        <span className="text-sm font-semibold">Continue with Google</span>
                        <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </button>

                      <button
                        onClick={() => setStep('phone')}
                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-semibold">Continue with Phone OTP</span>
                        <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </button>

                      <button
                        onClick={() => setStep('email')}
                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-semibold">Continue with Email</span>
                        <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </button>

                      <p className="text-center text-[10px] text-muted-foreground pt-2">
                        App works without login too. Sign in to unlock history & family profiles.
                      </p>
                    </motion.div>
                  )}

                  {/* Email */}
                  {step === 'email' && (
                    <motion.div key="email" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
                      <div className="flex gap-1 p-1 rounded-xl bg-muted/60 border border-border/50 mb-4">
                        <button onClick={() => setEmailStep('signin')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${emailStep === 'signin' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>Sign In</button>
                        <button onClick={() => setEmailStep('signup')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${emailStep === 'signup' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>Sign Up</button>
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                      />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                        onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                      />
                      <Button onClick={handleEmailAuth} disabled={loading || !email || !password} className="w-full gradient-primary text-white rounded-xl py-5 text-sm font-semibold">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : emailStep === 'signin' ? 'Sign In' : 'Create Account'}
                      </Button>
                      <button onClick={() => setStep('choose')} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">← Back</button>
                    </motion.div>
                  )}

                  {/* Phone */}
                  {step === 'phone' && (
                    <motion.div key="phone" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
                      <div className="flex rounded-xl border border-border overflow-hidden bg-muted/30">
                        <div className="px-3 py-3 bg-muted/50 border-r border-border flex items-center">
                          <span className="text-sm font-semibold text-muted-foreground">🇮🇳 +91</span>
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="10-digit mobile number"
                          className="flex-1 px-4 py-3 bg-transparent text-sm focus:outline-none"
                          onKeyDown={(e) => e.key === 'Enter' && handlePhoneSend()}
                        />
                      </div>
                      <Button onClick={handlePhoneSend} disabled={loading || phone.length < 10} className="w-full gradient-primary text-white rounded-xl py-5 text-sm font-semibold">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP'}
                      </Button>
                      <button onClick={() => setStep('choose')} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">← Back</button>
                    </motion.div>
                  )}

                  {/* OTP */}
                  {step === 'otp' && (
                    <motion.div key="otp" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15 mb-2">
                        <KeyRound className="w-4 h-4 text-primary flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">Enter the 6-digit OTP sent to <span className="font-semibold text-foreground">+91 {phone}</span></p>
                      </div>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit OTP"
                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm text-center font-mono-medical font-bold tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                        onKeyDown={(e) => e.key === 'Enter' && handleOtpVerify()}
                      />
                      <Button onClick={handleOtpVerify} disabled={loading || otp.length < 6} className="w-full gradient-primary text-white rounded-xl py-5 text-sm font-semibold">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify OTP'}
                      </Button>
                      <button onClick={() => setStep('phone')} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">← Resend OTP</button>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
