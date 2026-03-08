import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Camera, Brain, FileCheck, Heart, Lock, IndianRupee, ArrowRight, Pill, Activity, Stethoscope, Zap, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/languageContext';
import { useEffect, useState } from 'react';

const AnimatedCounter = ({ target, suffix = '' }: { target: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString('en-IN')}{suffix}</span>;
};

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }),
  };

  const stats = [
    { value: 70, suffix: 'M+', label: t('stats.elderly'), icon: Heart },
    { value: 150, suffix: 'M+', label: t('stats.chronic'), icon: Activity },
    { value: 50000, suffix: '+', label: t('stats.interactions'), icon: Stethoscope },
  ];

  const steps = [
    { icon: Camera, title: t('how.step1'), desc: t('how.step1desc'), num: '01' },
    { icon: Brain, title: t('how.step2'), desc: t('how.step2desc'), num: '02' },
    { icon: FileCheck, title: t('how.step3'), desc: t('how.step3desc'), num: '03' },
  ];

  return (
    <div className="min-h-screen pt-16 overflow-hidden">
      {/* ──── HERO ──── */}
      <section className="relative gradient-hero overflow-hidden">
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid opacity-[0.04]" />
        {/* Glow orbs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/8 blur-[100px] pointer-events-none" />

        <div className="relative container mx-auto px-4 pt-20 pb-24 md:pt-32 md:pb-36">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/20 bg-primary/10 text-primary-glow text-xs font-semibold tracking-wide uppercase mb-8">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-glow animate-pulse" />
                India's AI Medicine Safety Checker
              </div>
            </motion.div>

            <motion.h1 custom={1} initial="hidden" animate="visible" variants={fadeUp}
              className="text-4xl md:text-6xl lg:text-[4.5rem] font-extrabold tracking-tight leading-[1.1] mb-6 text-primary-foreground"
            >
              {t('hero.title')}
              <br />
              <span className="gradient-text">{t('hero.titleHighlight')}</span>
            </motion.h1>

            <motion.p custom={2} initial="hidden" animate="visible" variants={fadeUp}
              className="text-base md:text-lg text-primary-foreground/60 max-w-xl mx-auto mb-10 leading-relaxed"
            >
              {t('hero.subtitle')}
            </motion.p>

            <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Button
                size="lg"
                onClick={() => navigate('/check')}
                className="gradient-primary text-primary-foreground text-base px-8 py-6 rounded-xl shadow-glow hover:shadow-[0_0_60px_-8px_hsl(174_72%_40%_/_0.5)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 group"
              >
                {t('hero.cta')}
                <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-base px-8 py-6 rounded-xl border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white hover:-translate-y-0.5 transition-all"
              >
                {t('hero.ctaSecondary')}
              </Button>
            </motion.div>
          </div>

          {/* Trust row */}
          <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp}
            className="flex flex-wrap justify-center gap-4 mt-16"
          >
            {[
              { icon: IndianRupee, label: t('trust.free') },
              { icon: Lock, label: t('trust.privacy') },
              { icon: Heart, label: t('trust.india') },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 text-xs text-primary-foreground/50 font-medium">
                <badge.icon className="w-3.5 h-3.5 text-primary-glow" />
                {badge.label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ──── STATS ──── */}
      <section className="py-16 -mt-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative bg-card rounded-2xl p-6 shadow-elevated text-center group hover:-translate-y-1 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 mb-3">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-extrabold text-foreground mb-1 font-mono-medical">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── HOW IT WORKS ──── */}
      <section id="how-it-works" className="py-20 relative">
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />
        <div className="relative container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold tracking-wide uppercase mb-4">
              <Sparkles className="w-3 h-3" />
              Simple Process
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">{t('how.title')}</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="group"
              >
                <div className="bg-card rounded-2xl p-6 shadow-elevated hover:shadow-glow-sm transition-all duration-300 hover:-translate-y-1 h-full relative overflow-hidden">
                  {/* Step number watermark */}
                  <span className="absolute top-3 right-4 text-5xl font-extrabold text-muted/60 select-none">
                    {step.num}
                  </span>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 shadow-glow-sm">
                      <step.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-base font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
                {i < 2 && (
                  <div className="hidden md:flex justify-center mt-4">
                    <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── CTA ──── */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative max-w-2xl mx-auto gradient-hero rounded-3xl p-10 md:p-14 shadow-glow overflow-hidden"
          >
            <div className="absolute inset-0 bg-grid opacity-[0.04]" />
            <div className="relative text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary-foreground/15 bg-primary-foreground/5 text-xs text-primary-glow font-semibold mb-6">
                <Zap className="w-3 h-3" />
                Free Forever
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
                Don't risk dangerous drug interactions
              </h2>
              <p className="text-primary-foreground/50 mb-8 text-sm">
                Check your medicines now. It takes less than 30 seconds.
              </p>
              <Button
                size="lg"
                onClick={() => navigate('/check')}
                className="bg-card text-foreground hover:bg-card/90 text-base px-8 py-6 rounded-xl hover:-translate-y-0.5 transition-all shadow-elevated group"
              >
                {t('hero.cta')}
                <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ──── FOOTER ──── */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold">MediSafe AI</span>
          </div>
          <p className="text-xs text-muted-foreground">Built with ❤️ in India. Free forever. No data stored.</p>
          <p className="mt-1 text-[10px] text-muted-foreground/60">⚠️ This tool provides guidance only. Always consult your doctor.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
