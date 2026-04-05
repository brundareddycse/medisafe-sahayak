import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Plus, Trash2, Clock, Pill, Check, Volume2, VolumeX, AlarmClock, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Reminder {
  id: string;
  medicineName: string;
  time: string;
  label: string;
  enabled: boolean;
  sound: boolean;
  notification: boolean;
}

const DEFAULT_REMINDERS: Reminder[] = [
  { id: '1', medicineName: '', time: '06:00', label: 'Empty Stomach', enabled: false, sound: true, notification: true },
];

const TIME_LABELS = [
  'Empty Stomach',
  'After Breakfast',
  'After Lunch',
  'Evening',
  'After Dinner',
  'Bedtime',
];

// ── Sound: continuous alarm using HTML Audio (works in Chrome iframes) ──────
let beepWavUrl: string | null = null;
let alarmInterval: ReturnType<typeof setInterval> | null = null;
let alarmAudio: HTMLAudioElement | null = null;

function makeBeepWav(): string {
  const sampleRate = 8000;
  const freq = 880;
  const duration = 0.28;
  const numSamples = Math.floor(sampleRate * duration);
  const dataLen = numSamples * 2;
  const buf = new ArrayBuffer(44 + dataLen);
  const view = new DataView(buf);
  const str = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); view.setUint32(4, 36 + dataLen, true);
  str(8, 'WAVE'); str(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); str(36, 'data');
  view.setUint32(40, dataLen, true);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.sin(Math.PI * t / duration);
    const s = Math.floor(env * 0.7 * 32767 * Math.sin(2 * Math.PI * freq * t));
    view.setInt16(44 + i * 2, s, true);
  }
  let bin = '';
  new Uint8Array(buf).forEach(b => { bin += String.fromCharCode(b); });
  return 'data:audio/wav;base64,' + btoa(bin);
}

function startAlarmSound() {
  stopAlarmSound(); // clear any existing
  if (!beepWavUrl) beepWavUrl = makeBeepWav();
  const url = beepWavUrl;

  const playOnce = () => {
    const a = new Audio(url);
    a.volume = 1.0;
    alarmAudio = a;
    a.play().catch(err => console.warn('Alarm play failed:', err));
  };

  // Play immediately then repeat every 1.2 seconds continuously
  playOnce();
  alarmInterval = setInterval(playOnce, 1200);
}

function stopAlarmSound() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
  if (alarmAudio) {
    alarmAudio.pause();
    alarmAudio = null;
  }
}

const Reminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>(DEFAULT_REMINDERS);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [activeAlarm, setActiveAlarm] = useState<Reminder | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update current time every second
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Check reminders every minute
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const timeNow = `${h}:${m}`;

      reminders.forEach((r) => {
        if (r.enabled && r.medicineName && r.time === timeNow) {
          triggerAlarm(r);
        }
      });
    };

    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, [reminders]);

  const triggerAlarm = (reminder: Reminder) => {
    setActiveAlarm(reminder);
    if (reminder.sound) startAlarmSound();
    if (reminder.notification && notifPermission === 'granted') {
      try {
        new Notification('💊 Medicine Reminder', {
          body: `Time to take ${reminder.medicineName} — ${reminder.label}`,
          icon: '/favicon.ico',
        });
      } catch (_) {}
    }
    toast.success(`Time to take ${reminder.medicineName}!`, {
      description: reminder.label,
      duration: 10000,
    });
  };

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported in this browser');
      return;
    }
    // Check if running inside an iframe (Lovable preview) — notifications blocked there
    const inIframe = window.self !== window.top;
    if (inIframe) {
      toast.info('Open the app in a new tab for notifications to work', {
        description: 'Click the external link icon in Lovable to open in full tab',
        duration: 6000,
      });
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm === 'granted') {
        toast.success('Notifications enabled! You will get alerts for medicine reminders.');
        // Send a test notification immediately
        new Notification('✅ MediSafe Notifications Active', {
          body: 'You will now receive medicine reminders',
          icon: '/favicon.ico',
        });
      } else if (perm === 'denied') {
        toast.error('Permission denied. Enable from browser address bar settings.');
      }
    } catch (e) {
      toast.error('Could not request notification permission');
    }
  };

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const addReminder = () => {
    const newReminder: Reminder = {
      id: Date.now().toString(),
      medicineName: '',
      time: '08:00',
      label: 'After Breakfast',
      enabled: false,
      sound: true,
      notification: true,
    };
    setReminders((prev) => [...prev, newReminder]);
  };

  const updateReminder = (id: string, field: keyof Reminder, value: any) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    toast.success('Reminder deleted');
  };

  const toggleReminder = (id: string) => {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) return;
    if (!reminder.medicineName.trim()) {
      toast.error('Please enter a medicine name first');
      return;
    }
    const newEnabled = !reminder.enabled;
    updateReminder(id, 'enabled', newEnabled);
    toast.success(newEnabled ? `Reminder set for ${reminder.time}` : 'Reminder turned off');
  };

  const testAlarm = (reminder: Reminder) => {
    if (!reminder.medicineName.trim()) {
      toast.error('Please enter a medicine name first');
      return;
    }
    triggerAlarm(reminder);
  };

  const enabledCount = reminders.filter((r) => r.enabled && r.medicineName).length;

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Hero header */}
      <div className="gradient-hero relative overflow-hidden py-12">
        <div className="absolute inset-0 bg-grid opacity-[0.04]" />
        <div className="absolute top-10 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
        <div className="relative container mx-auto px-4 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/15 bg-white/10 text-primary-glow text-[10px] font-semibold tracking-wider uppercase mb-4">
            <AlarmClock className="w-3 h-3" />
            Medicine Reminders
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight text-white">Never Miss a Dose</h1>
          <p className="text-sm text-white/50">Set alarms and notifications for all your medicines</p>

          {/* Stats row */}
          <div className="flex justify-center gap-4 mt-6">
            <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-center">
              <div className="text-2xl font-bold text-white">{enabledCount}</div>
              <div className="text-[10px] text-white/50">Active</div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-center">
              <div className="text-2xl font-bold text-white">{reminders.length}</div>
              <div className="text-[10px] text-white/50">Total</div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-center">
              <div className="text-2xl font-bold text-white font-mono-medical">{currentTime}</div>
              <div className="text-[10px] text-white/50">Now</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-2xl mt-6 pb-24 relative z-10">

        {/* Notification permission banner */}
        {notifPermission !== 'granted' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-4 rounded-2xl flex items-center justify-between gap-3 ${
              notifPermission === 'denied'
                ? 'bg-destructive/10 border border-destructive/30'
                : 'bg-warning/10 border border-warning/30'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bell className={`w-4 h-4 flex-shrink-0 ${notifPermission === 'denied' ? 'text-destructive' : 'text-warning'}`} />
              <div>
                <p className={`text-sm font-semibold ${notifPermission === 'denied' ? 'text-destructive' : 'text-warning'}`}>
                  {notifPermission === 'denied' ? 'Notifications Blocked' : 'Enable Notifications'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {notifPermission === 'denied'
                    ? 'Go to browser Settings → Site permissions → Allow notifications'
                    : 'Get popup alerts even when the app is in background'}
                </p>
              </div>
            </div>
            {notifPermission !== 'denied' && (
              <Button
                size="sm"
                onClick={requestNotifPermission}
                className="gradient-primary text-primary-foreground rounded-lg text-xs h-8 flex-shrink-0"
              >
                Enable
              </Button>
            )}
          </motion.div>
        )}

        {/* Active alarm popup */}
        <AnimatePresence>
          {activeAlarm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="mb-4 p-5 rounded-2xl bg-success/10 border-2 border-success/40 shadow-elevated"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                    <motion.div animate={{ rotate: [0, -15, 15, -15, 15, 0] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}>
                      <Bell className="w-6 h-6 text-success" />
                    </motion.div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-success">Time for your medicine!</p>
                    <p className="text-base font-semibold">{activeAlarm.medicineName}</p>
                    <p className="text-xs text-muted-foreground">{activeAlarm.label} • {activeAlarm.time}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => { stopAlarmSound(); setActiveAlarm(null); }}
                  className="bg-success text-success-foreground rounded-xl h-9 px-4 text-xs font-semibold"
                >
                  <Check className="w-3.5 h-3.5 mr-1" /> Done
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reminders list */}
        <div className="bg-card rounded-2xl shadow-elevated border border-border/50 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Pill className="w-4 h-4 text-primary" />
              My Reminders
            </h2>
            <Button
              onClick={addReminder}
              size="sm"
              className="gradient-primary text-primary-foreground rounded-xl h-8 px-3 text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {reminders.map((reminder, i) => (
                <motion.div
                  key={reminder.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-2xl border p-4 transition-all duration-200 ${
                    reminder.enabled && reminder.medicineName
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border/50 bg-muted/20'
                  }`}
                >
                  {/* Top row — medicine name + toggle */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Pill className="w-4 h-4 text-primary" />
                    </div>
                    <input
                      type="text"
                      value={reminder.medicineName}
                      onChange={(e) => updateReminder(reminder.id, 'medicineName', e.target.value)}
                      placeholder="Medicine name (e.g. Metformin 500mg)"
                      className="flex-1 bg-transparent text-sm font-semibold placeholder:text-muted-foreground/40 focus:outline-none"
                    />
                    {/* Toggle switch */}
                    <button
                      onClick={() => toggleReminder(reminder.id)}
                      className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
                        reminder.enabled && reminder.medicineName ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <motion.div
                        animate={{ x: reminder.enabled && reminder.medicineName ? 20 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                      />
                    </button>
                  </div>

                  {/* Time + Label row */}
                  <div className="flex gap-2 mb-3">
                    <div className="flex items-center gap-1.5 bg-card rounded-xl px-3 py-2 border border-border/50 flex-shrink-0">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <input
                        type="time"
                        value={reminder.time}
                        onChange={(e) => updateReminder(reminder.id, 'time', e.target.value)}
                        className="bg-transparent text-sm font-mono-medical font-semibold focus:outline-none w-[80px]"
                      />
                    </div>
                    <select
                      value={reminder.label}
                      onChange={(e) => updateReminder(reminder.id, 'label', e.target.value)}
                      className="flex-1 bg-card rounded-xl px-3 py-2 border border-border/50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {TIME_LABELS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>

                  {/* Options row */}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      {/* Sound toggle */}
                      <button
                        onClick={() => updateReminder(reminder.id, 'sound', !reminder.sound)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                          reminder.sound ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {reminder.sound ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                        Sound
                      </button>

                      {/* Notification toggle */}
                      <button
                        onClick={() => updateReminder(reminder.id, 'notification', !reminder.notification)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                          reminder.notification ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {reminder.notification ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                        Notify
                      </button>

                      {/* Test button */}
                      <button
                        onClick={() => testAlarm(reminder)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
                      >
                        <Play className="w-3 h-3" />
                        Test
                      </button>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteReminder(reminder.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {reminders.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <AlarmClock className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No reminders yet</p>
                <p className="text-xs mt-1">Click "Add" to create your first reminder</p>
              </div>
            )}
          </div>
        </div>

        {/* Tips card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-4 rounded-2xl bg-card border border-border/50 shadow-elevated"
        >
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">💡 Tips</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>• Click <strong className="text-foreground">Test</strong> to preview the alarm sound and notification</p>
            <p>• Toggle the switch on the right to activate/deactivate a reminder</p>
            <p>• Enable <strong className="text-foreground">Notifications</strong> at the top for alerts when the app is minimized</p>
            <p>• Reminders are active as long as this page/tab is open</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Reminders;
