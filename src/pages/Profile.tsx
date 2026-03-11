import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, Clock, Pill, Plus, Trash2, ChevronRight, LogOut, Shield, Edit2, Check, X, Baby, UserCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/authContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: string;
  avatar: string;
}

interface MedicineRecord {
  id: string;
  medicines: string[];
  date: string;
  memberName: string;
  criticalCount: number;
}

const RELATIONS = ['Self', 'Spouse', 'Mother', 'Father', 'Son', 'Daughter', 'Grandparent', 'Other'];
const AVATARS = ['👨', '👩', '👴', '👵', '👦', '👧', '🧑', '👶'];

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'history' | 'family'>('history');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { id: '1', name: user?.user_metadata?.full_name?.split(' ')[0] || 'Me', relation: 'Self', age: '', avatar: '🧑' },
  ]);
  const [history, setHistory] = useState<MedicineRecord[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', relation: 'Spouse', age: '', avatar: '👩' });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) navigate('/');
  }, [user]);

  // Mock history — in real app this would come from Supabase
  useEffect(() => {
    setHistory([
      { id: '1', medicines: ['Amlodipine 5mg', 'Metformin 500mg', 'Ecosprin 75mg'], date: '2 hours ago', memberName: 'Me', criticalCount: 1 },
      { id: '2', medicines: ['Thyronorm 50mcg', 'Calcium + D3'], date: 'Yesterday', memberName: 'Me', criticalCount: 0 },
    ]);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const addMember = () => {
    if (!newMember.name.trim()) return;
    setFamilyMembers(prev => [...prev, { ...newMember, id: Date.now().toString() }]);
    setNewMember({ name: '', relation: 'Spouse', age: '', avatar: '👩' });
    setAddingMember(false);
    toast.success(`${newMember.name} added to family`);
  };

  const deleteMember = (id: string) => {
    if (id === '1') { toast.error("Can't remove yourself"); return; }
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || user?.phone || '';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Hero */}
      <div className="gradient-hero relative overflow-hidden py-10">
        <div className="absolute inset-0 bg-grid opacity-[0.04]" />
        <div className="absolute top-0 right-1/4 w-[300px] h-[300px] rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
        <div className="relative container mx-auto px-4 max-w-2xl">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-xl font-bold shadow-glow">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                ) : initials}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success border-2 border-card flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white" />
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{displayName}</h1>
              <p className="text-white/50 text-xs">{displayEmail}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary-glow text-[9px] font-semibold uppercase tracking-wide">
                  MediSafe Member
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white/70 hover:text-white hover:bg-white/20 transition-all text-xs font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { label: 'Scans', value: history.length, icon: Pill },
              { label: 'Family', value: familyMembers.length, icon: Users },
              { label: 'Alerts', value: history.reduce((a, h) => a + h.criticalCount, 0), icon: Shield },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/8 rounded-xl p-3 border border-white/10 text-center">
                <stat.icon className="w-4 h-4 text-primary-glow mx-auto mb-1" />
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-[10px] text-white/40">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-2xl mt-6 pb-24">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/60 border border-border/50 mb-5">
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'history' ? 'bg-card shadow-elevated text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Clock className="w-3.5 h-3.5" /> Medicine History
          </button>
          <button
            onClick={() => setActiveTab('family')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'family' ? 'bg-card shadow-elevated text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Users className="w-3.5 h-3.5" /> Family Profiles
          </button>
        </div>

        <AnimatePresence mode="wait">

          {/* History Tab */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {history.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
                  <Clock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
                  <p className="text-sm font-medium text-muted-foreground">No scans yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1 mb-4">Your medicine checks will appear here</p>
                  <Button onClick={() => navigate('/check')} size="sm" className="gradient-primary text-white rounded-xl text-xs">
                    Check Medicines
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((record, i) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="bg-card rounded-2xl border border-border/50 p-4 shadow-elevated hover:shadow-glow-sm transition-all cursor-pointer group"
                      onClick={() => navigate('/check')}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Pill className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold">{record.memberName}</p>
                            <p className="text-[10px] text-muted-foreground">{record.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {record.criticalCount > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-destructive/10 text-destructive text-[9px] font-bold">
                              {record.criticalCount} Critical
                            </span>
                          )}
                          {record.criticalCount === 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-success/10 text-success text-[9px] font-bold">Safe</span>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {record.medicines.map((med) => (
                          <span key={med} className="px-2.5 py-1 rounded-lg bg-muted/60 text-[10px] font-medium text-muted-foreground border border-border/50">
                            {med}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}

                  <button
                    onClick={() => navigate('/check')}
                    className="w-full p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/[0.02] transition-all text-sm text-muted-foreground hover:text-primary font-medium flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> New Medicine Check
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Family Tab */}
          {activeTab === 'family' && (
            <motion.div key="family" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="space-y-3">
                {familyMembers.map((member, i) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-card rounded-2xl border border-border/50 p-4 shadow-elevated flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                      {member.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.relation}{member.age ? ` · ${member.age} yrs` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate('/check')}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold hover:bg-primary/20 transition-all"
                      >
                        Check Meds
                      </button>
                      {member.id !== '1' && (
                        <button
                          onClick={() => deleteMember(member.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Add member form */}
                <AnimatePresence>
                  {addingMember && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-card rounded-2xl border border-primary/20 p-4 shadow-elevated overflow-hidden"
                    >
                      <p className="text-xs font-bold text-primary mb-3 uppercase tracking-wider">Add Family Member</p>

                      {/* Avatar picker */}
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {AVATARS.map((a) => (
                          <button
                            key={a}
                            onClick={() => setNewMember(m => ({ ...m, avatar: a }))}
                            className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${newMember.avatar === a ? 'bg-primary/20 border-2 border-primary scale-110' : 'bg-muted hover:bg-muted/80'}`}
                          >
                            {a}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="text"
                          value={newMember.name}
                          onChange={(e) => setNewMember(m => ({ ...m, name: e.target.value }))}
                          placeholder="Name"
                          className="px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <input
                          type="number"
                          value={newMember.age}
                          onChange={(e) => setNewMember(m => ({ ...m, age: e.target.value }))}
                          placeholder="Age"
                          className="px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <select
                        value={newMember.relation}
                        onChange={(e) => setNewMember(m => ({ ...m, relation: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-3"
                      >
                        {RELATIONS.map(r => <option key={r}>{r}</option>)}
                      </select>

                      <div className="flex gap-2">
                        <Button onClick={addMember} disabled={!newMember.name} className="flex-1 gradient-primary text-white rounded-xl h-9 text-xs">
                          <Check className="w-3.5 h-3.5 mr-1" /> Add Member
                        </Button>
                        <button onClick={() => setAddingMember(false)} className="px-4 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground transition-all">
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!addingMember && (
                  <button
                    onClick={() => setAddingMember(true)}
                    className="w-full p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/[0.02] transition-all text-sm text-muted-foreground hover:text-primary font-medium flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Family Member
                  </button>
                )}

                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/15">
                  <div className="flex items-start gap-2.5">
                    <Heart className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Add family members to track their medicines separately. Great for elderly parents who take multiple medicines.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Profile;
