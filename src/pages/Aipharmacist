import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Bot, User, Sparkles, AlertTriangle, RotateCcw, ChevronRight, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  { icon: '💊', text: 'Can I take paracetamol with my BP medicine?' },
  { icon: '🍊', text: 'What foods should I avoid with Warfarin?' },
  { icon: '🤰', text: 'Is metformin safe during pregnancy?' },
  { icon: '🌿', text: 'Can I take Ashwagandha with thyroid medicine?' },
  { icon: '⏰', text: 'Should I take my medicine before or after food?' },
  { icon: '🍺', text: 'Can I drink alcohol with antibiotics?' },
];

const SYSTEM_PROMPT = `You are an expert AI Pharmacist assistant for MediSafe Sahayak, a medicine safety app for Indian patients. Your name is "MediSahayak AI".

Your role:
- Answer questions about medicine interactions, side effects, dosage, food interactions, timing
- Be especially knowledgeable about medicines common in India (generic names, Indian brands)
- Know about Ayurvedic + allopathic interactions (very important for Indian users)
- Give practical, clear advice in simple language
- Always mention consulting a doctor/pharmacist for serious concerns

Rules:
- Keep answers concise and easy to understand (not too medical/technical)
- Use simple English. If user writes in Hindi/Telugu/Tamil, respond in that language
- Use bullet points for clarity when listing multiple things
- Always end serious drug interaction answers with "⚠️ Please consult your doctor before making changes."
- Never diagnose diseases, only explain medicines
- For dosage questions always say "as prescribed by your doctor"
- Mention Jan Aushadhi stores when relevant for generic alternatives
- Be warm, helpful and human — not robotic

Format your responses cleanly with line breaks. Use ✅ for safe, ⚠️ for caution, ❌ for avoid.`;

const AiPharmacist = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.text,
      }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: history,
        }),
      });

      const data = await response.json();
      const replyText = data.content?.[0]?.text || 'Sorry, I could not get a response. Please try again.';

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: replyText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      toast.error('Could not connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice not supported in this browser');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Hindi — also picks up English
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      inputRef.current?.focus();
    };
    recognition.onerror = () => {
      setListening(false);
      toast.error('Voice recognition failed. Please try again.');
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const formatText = (text: string) => {
    // Convert newlines to <br>, bold **text**, and preserve structure
    return text
      .split('\n')
      .map((line, i) => {
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return `<span key="${i}">${formatted}</span>`;
      })
      .join('<br/>');
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="w-full min-h-screen bg-background pt-16 flex flex-col overflow-x-hidden">

      {/* Hero */}
      <div className="w-full gradient-hero relative overflow-hidden py-8 flex-shrink-0">
        <div className="absolute inset-0 bg-grid opacity-[0.04] pointer-events-none" />
        <motion.div
          className="absolute -top-16 right-0 w-[280px] h-[280px] rounded-full bg-primary/10 blur-[80px] pointer-events-none"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <div className="container mx-auto px-4 max-w-2xl relative flex items-center gap-4">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow"
          >
            <FlaskConical className="w-7 h-7 text-white" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-bold text-white">AI Pharmacist</h1>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/20 border border-success/30 text-success text-[9px] font-bold uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
                Online
              </span>
            </div>
            <p className="text-white/50 text-xs">Ask anything about medicines, interactions, side effects</p>
            <div className="flex items-center gap-3 mt-2">
              {['Hindi', 'Telugu', 'Tamil', 'English'].map(lang => (
                <span key={lang} className="text-[9px] text-white/40 font-medium">{lang}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 container mx-auto px-4 max-w-2xl w-full flex flex-col" style={{ minHeight: 0 }}>

        {/* Messages */}
        <div className="flex-1 py-4 space-y-4 overflow-y-auto" style={{ paddingBottom: '140px' }}>

          {/* Empty state */}
          {isEmpty && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="pt-2">
              <div className="text-center mb-6">
                <p className="text-sm font-semibold text-foreground mb-1">Ask your medicine question</p>
                <p className="text-xs text-muted-foreground">In English, Hindi, Telugu, Tamil, or any Indian language</p>
              </div>

              {/* Suggested questions */}
              <div className="grid grid-cols-1 gap-2">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => sendMessage(q.text)}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-left group shadow-sm"
                  >
                    <span className="text-xl flex-shrink-0">{q.icon}</span>
                    <span className="text-sm text-muted-foreground group-hover:text-foreground flex-1 transition-colors">{q.text}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </motion.button>
                ))}
              </div>

              {/* Disclaimer */}
              <div className="mt-4 p-3.5 rounded-2xl bg-warning/8 border border-warning/20 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AI Pharmacist gives general medicine information only. Always consult your doctor or pharmacist for medical decisions.
                </p>
              </div>
            </motion.div>
          )}

          {/* Message bubbles */}
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 ${
                  msg.role === 'assistant' ? 'gradient-primary shadow-glow-sm' : 'bg-muted border border-border/50'
                }`}>
                  {msg.role === 'assistant'
                    ? <Bot className="w-4 h-4 text-white" />
                    : <User className="w-4 h-4 text-muted-foreground" />
                  }
                </div>

                {/* Bubble */}
                <div className={`max-w-[82%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'gradient-primary text-white rounded-tr-sm'
                      : 'bg-card border border-border/50 text-foreground rounded-tl-sm'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div
                        className="whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 px-1">
                    {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 mt-1 shadow-glow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="px-4 py-3.5 rounded-2xl rounded-tl-sm bg-card border border-border/50 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary/60"
                        animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.8, delay, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar — fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border/50 z-40">
        <div className="container mx-auto px-4 max-w-2xl py-3">

          {/* Clear chat */}
          {messages.length > 0 && (
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setMessages([])}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Clear chat
              </button>
            </div>
          )}

          <div className="flex gap-2 items-end">
            {/* Voice button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={listening ? stopVoice : startVoice}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all border ${
                listening
                  ? 'bg-destructive/10 border-destructive/40 text-destructive'
                  : 'bg-muted border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30'
              }`}
            >
              {listening
                ? <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}><MicOff className="w-4 h-4" /></motion.div>
                : <Mic className="w-4 h-4" />
              }
            </motion.button>

            {/* Text input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about any medicine... (Hindi/Telugu/English)"
                rows={1}
                className="w-full px-4 py-3 pr-12 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none leading-relaxed"
                style={{ maxHeight: '120px', overflowY: 'auto' }}
                onInput={(e) => {
                  const el = e.target as HTMLTextAreaElement;
                  el.style.height = 'auto';
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                }}
              />
            </div>

            {/* Send button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4 text-white" />
            </motion.button>
          </div>

          <p className="text-center text-[9px] text-muted-foreground/40 mt-2">
            For emergencies, call 112. AI advice does not replace your doctor.
          </p>
        </div>
      </div>

    </div>
  );
};

export default AiPharmacist;

