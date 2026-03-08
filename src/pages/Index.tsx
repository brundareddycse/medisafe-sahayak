import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Camera, Brain, FileCheck, Heart, Lock, IndianRupee, ArrowRight, Pill, Activity, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/languageContext';
import { useEffect, useState } from 'react';

const FloatingIcon = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`absolute opacity-10 text-primary ${className}`}>{children}</div>
);

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
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }),
  };

  const stats = [
    { value: 70, suffix: 'M+', label: t('stats.elderly'), icon: Heart },
    { value: 150, suffix: 'M+', label: t('stats.chronic'), icon: Activity },
    { value: 50000, suffix: '+', label: t('stats.interactions'), icon: Stethoscope },
  ];

  const steps = [
    { icon: Camera, title: t('how.step1'), desc: t('how.step1desc'), color: 'bg-primary/10 text-primary' },
    { icon: Brain, title: t('how.step2'), desc: t('how.step2desc'), color: 'bg-secondary/10 text-secondary' },
    { icon: FileCheck, title: t('how.step3'), desc: t('how.step3desc'), color: 'bg-success/10 text-success' },
  ];

  return (
    <div className="min-h-screen pt-16 overflow-hidden">
      {/* Floating Background Icons */}
      <FloatingIcon className="top-32 left-[10%] animate-float"><Pill className="w-12 h-12" /></FloatingIcon>
      <FloatingIcon className="top-48 right-[15%] animate-float-reverse"><Shield className="w-10 h-10" /></FloatingIcon>
      <FloatingIcon className="top-[60%] left-[5%] animate-float-reverse"><Activity className="w-8 h-8" /></FloatingIcon>
      <FloatingIcon className="top-[70%] right-[8%] animate-float"><Stethoscope className="w-14 h-14" /></FloatingIcon>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              India's AI Medicine Safety Checker
            </div>
          </motion.div>

          <motion.h1 custom={1} initial="hidden" animate="visible" variants={fadeUp}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6"
          >
            {t('hero.title')}
            <br />
            <span className="gradient-text">{t('hero.titleHighlight')}</span>
          </motion.h1>

          <motion.p custom={2} initial="hidden" animate="visible" variants={fadeUp}
            className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10"
          >
            {t('hero.subtitle')}
          </motion.p>

          <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              onClick={() => navigate('/check')}
              className="gradient-primary text-primary-foreground text-lg px-8 py-6 rounded-xl shadow-glow animate-pulse-glow hover:shadow-glow transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {t('hero.cta')}
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-lg px-8 py-6 rounded-xl hover:-translate-y-0.5 transition-transform"
            >
              {t('hero.ctaSecondary')}
            </Button>
          </motion.div>
        </div>

        {/* Trust Badges */}
        <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp}
          className="flex flex-wrap justify-center gap-6 mt-16"
        >
          {[
            { icon: IndianRupee, label: t('trust.free') },
            { icon: Lock, label: t('trust.privacy') },
            { icon: Heart, label: t('trust.india') },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-muted-foreground">
              <badge.icon className="w-4 h-4 text-primary" />
              {badge.label}
            </div>
          ))}
        </motion.div>
      </section>

      {/* Stats */}
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-extrabold text-foreground mb-1">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('how.title')}</h2>
            <div className="w-16 h-1 rounded-full gradient-primary mx-auto" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
                className="relative group"
              >
                <div className="glass rounded-2xl p-8 text-center hover:shadow-glow-sm transition-all hover:-translate-y-1 h-full">
                  <div className="relative mb-6">
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full gradient-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                    <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mx-auto`}>
                      <step.icon className="w-8 h-8" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 text-muted-foreground/30">
                    <ArrowRight className="w-8 h-8" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center gradient-primary rounded-3xl p-12 shadow-glow"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Don't risk dangerous drug interactions
            </h2>
            <p className="text-primary-foreground/80 mb-8">
              Check your medicines now. It takes less than 30 seconds.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('/check')}
              className="bg-card text-foreground hover:bg-card/90 text-lg px-8 py-6 rounded-xl hover:-translate-y-0.5 transition-transform"
            >
              {t('hero.cta')}
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">MediSafe AI</span>
          </div>
          <p>Built with ❤️ in India. Free forever. No data stored.</p>
          <p className="mt-1 text-xs">⚠️ This tool provides guidance only. Always consult your doctor.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
