import React, { useState, useMemo, useEffect } from 'react';
import { 
  Shield, User, MapPin, Trophy, ClipboardCheck, Zap, Loader2, Plus, Trash2, Activity,
  FileText, Settings, X, ChevronDown, BookOpen, UserCheck, UserX, Users, Target,
  HelpCircle, History, Eye, CheckCircle2, Clock, LogOut, Lock
} from 'lucide-react';

// --- INICIO DA CONEXÃO FIREBASE ---
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA6l96IKSBHh9Kg10Hb0uXWTqNvH4rEq54",
  authDomain: "recrutamento-rocam-96e76.firebaseapp.com",
  projectId: "recrutamento-rocam-96e76",
  storageBucket: "recrutamento-rocam-96e76.firebasestorage.app",
  messagingSenderId: "471290475293",
  appId: "1:471290475293:web:de263909337e633963e7f4"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
// --- FIM DA CONEXÃO FIREBASE ---

const App: React.FC = () => {
  // ESTADOS DE LOGIN
  const [isLogged, setIsLogged] = useState(sessionStorage.getItem('rocam_logged') === 'true');
  const [userField, setUserField] = useState('');
  const [passField, setPassField] = useState('');

  // SEUS ESTADOS ORIGINAIS
  const [activeTab, setActiveTab] = useState<'evaluation' | 'protocols' | 'history'>('evaluation');
  const [passingGrade, setPassingGrade] = useState<number>(7.0);
  const [showSettings, setShowSettings] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [expandedProtocol, setExpandedProtocol] = useState<number | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  
  const [history, setHistory] = useState<any[]>([]);

  const defaultRamps = [
    { uid: '1', name: 'RODOVIA PARA O VERMELHO', score: 0 },
    { uid: '2', name: 'ESCADINHA DO VERMELHO', score: 0 },
    { uid: '3', name: 'TRILHOS', score: 0 },
    { uid: '4', name: 'ESCADA CONSTRUÇÃO BAIXA P/ RODOVIA', score: 0 },
    { uid: '5', name: 'SPRITE', score: 0 }
  ];

  const defaultTracking = [
    { uid: '1', location: 'PRAIA', time: '', score: 0 },
    { uid: '2', location: 'GROOVE', time: '', score: 0 },
    { uid: '3', location: 'MANSÕES', time: '', score: 0 }
  ];

  const [state, setState] = useState<any>({
    instructors: [{ id: '', name: '' }],
    candidate: { id: '', name: '' },
    ramps: defaultRamps,
    tunnel: { time: '', score: 0 },
    modulation: { time: '', score: 0 },
    tracking: defaultTracking,
  });

  const [isFinishing, setIsFinishing] = useState(false);

  // CARREGAR HISTÓRICO DO FIREBASE (Database Real)
  useEffect(() => {
    if (isLogged) {
      const q = query(collection(db, "evaluations"), orderBy("dateTimestamp", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setHistory(data);
      });
      return () => unsubscribe();
    }
  }, [isLogged]);

  const categoryScores = useMemo(() => {
    const rampsSum = state.ramps.reduce((acc: number, r: any) => acc + (Number(r.score) || 0), 0);
    const trackingSum = state.tracking.reduce((acc: number, t: any) => acc + (Number(t.score) || 0), 0);
    const tunnelScore = Number(state.tunnel.score) || 0;
    const modulationScore = Number(state.modulation.score) || 0;
    return { ramps: rampsSum, tracking: trackingSum, tunnel: tunnelScore, modulation: modulationScore, total: rampsSum + trackingSum + tunnelScore + modulationScore };
  }, [state]);

  const finalScore = categoryScores.total;

  const handleLogin = () => {
    if (userField === "instrutor" && passField === "rocam2026") {
      sessionStorage.setItem('rocam_logged', 'true');
      setIsLogged(true);
    } else {
      alert("Credenciais Inválidas!");
    }
  };

  const handleFinish = async () => {
    if (!state.candidate.name || !state.candidate.id) {
      alert("ERRO: Nome e ID do conscrito são obrigatórios.");
      return;
    }
    setIsFinishing(true);
    try {
      await addDoc(collection(db, "evaluations"), {
        date: new Date().toLocaleString('pt-BR'),
        dateTimestamp: new Date(),
        state: JSON.parse(JSON.stringify(state)),
        finalScore,
        passingGrade,
        review: { summary: "Avaliação oficial registrada via Sistema ROCAM." }
      });
      setShowSuccessToast(true);
      setState({ instructors: state.instructors.map((i:any) => ({...i})), candidate: { id: '', name: '' }, ramps: defaultRamps.map(r => ({ ...r, score: 0 })), tunnel: { time: '', score: 0 }, modulation: { time: '', score: 0 }, tracking: defaultTracking.map(t => ({ ...t, score: 0, time: '' })) });
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (e) { alert("Erro ao salvar no Banco de Dados!"); }
    setIsFinishing(false);
  };

  const deleteHistoryEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("CONFIRMAÇÃO: Apagar este registro permanentemente da Database?")) {
      await deleteDoc(doc(db, "evaluations", id));
    }
  };

  // TELA DE LOGIN COM SEU ESTILO
  if (!isLogged) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black font-sans">
        <div className="bg-zinc-900/50 border border-amber-500/20 p-10 rounded-[2.5rem] w-full max-w-sm text-center backdrop-blur-md shadow-2xl">
          <img src="https://i.imgur.com/TXMorwL.png" alt="ROCAM" className="w-20 h-20 mx-auto mb-6 object-contain" />
          <h2 className="text-amber-500 font-military font-bold tracking-widest text-xl mb-8 uppercase">Acesso Restrito</h2>
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-slate-500" size={18} />
              <input placeholder="USUÁRIO" className="w-full bg-black border border-white/5 rounded-xl p-3.5 pl-12 text-[10px] font-black text-white outline-none focus:border-amber-500/50" onChange={e => setUserField(e.target.value)} />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 text-slate-500" size={18} />
              <input type="password" placeholder="SENHA" className="w-full bg-black border border-white/5 rounded-xl p-3.5 pl-12 text-[10px] font-black text-white outline-none focus:border-amber-500/50" onChange={e => setPassField(e.target.value)} />
            </div>
            <button onClick={handleLogin} className="w-full py-4 bg-amber-500 text-black rounded-xl font-black text-[10px] tracking-[0.2em] hover:bg-amber-400 transition-all mt-4">AUTENTICAR</button>
          </div>
        </div>
      </div>
    );
  }

  // --- SEU DESIGN ORIGINAL COMEÇA AQUI ---
  return (
    <div className="h-screen w-full flex flex-col bg-black text-slate-300 overflow-hidden font-sans select-none">
      
      {showSuccessToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-green-500 text-black px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={18} />
          Avaliação Salva na Database!
        </div>
      )}

      {/* SEU HEADER ORIGINAL */}
      <header className="px-8 py-3 flex items-center justify-between bg-zinc-950 border-b border-white/5 flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <img src="https://i.imgur.com/TXMorwL.png" alt="ROCAM" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-base font-military font-bold text-amber-500 tracking-widest leading-none uppercase">ROCAM</h1>
            <p className="text-[7px] font-black text-slate-700 uppercase tracking-[0.3em] mt-1 italic">Rondas Ostensivas com Apoio de Motocicletas</p>
          </div>
        </div>
        <nav className="flex bg-black p-1 rounded-xl border border-white/5">
          <button onClick={() => setActiveTab('evaluation')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'evaluation' ? 'bg-amber-500 text-black' : 'text-slate-600'}`}>
            <FileText size={12}/> Avaliação
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-amber-500 text-black' : 'text-slate-600'}`}>
            <History size={12}/> Histórico
          </button>
        </nav>
        <button onClick={() => {sessionStorage.clear(); setIsLogged(false)}} className="p-2 text-slate-700 hover:text-red-500 transition-all">
          <LogOut size={16} />
        </button>
      </header>

      {/* SEU MAIN ORIGINAL COM AS TABELAS */}
      <main className="flex-1 overflow-hidden p-4 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)] relative">
        {activeTab === 'evaluation' && (
          <div className="h-full max-w-full grid grid-cols-12 gap-4 animate-in fade-in duration-500 overflow-hidden">
            {/* Coluna 1: Instrutores e Conscrito */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
              <section className="bg-zinc-900/40 border border-white/5 rounded-[1.2rem] p-4 space-y-2.5">
                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><Users size={12}/> Instrutores</h3>
                {state.instructors.map((ins: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <input placeholder="NOME" className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-[10px] uppercase font-bold text-white outline-none" value={ins.name} onChange={e => {
                      const n = [...state.instructors]; n[idx].name = e.target.value; setState({...state, instructors: n});
                    }} />
                  </div>
                ))}
              </section>

              <section className="bg-zinc-900/40 border border-white/5 rounded-[1.2rem] p-4 space-y-2.5">
                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><User size={12}/> Conscrito</h3>
                <input placeholder="NOME DO CONSRITO" className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-[10px] uppercase font-bold text-white outline-none" value={state.candidate.name} onChange={e => setState({...state, candidate: {...state.candidate, name: e.target.value}})} />
                <input placeholder="ID" className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-[10px] font-bold text-white outline-none" value={state.candidate.id} onChange={e => setState({...state, candidate: {...state.candidate, id: e.target.value}})} />
              </section>

              <section className="bg-zinc-900/40 border border-white/5 rounded-[1.2rem] p-5 mt-auto">
                <span className="text-[9px] font-black text-slate-700 uppercase block mb-1">Nota Final</span>
                <div className="text-4xl font-black text-amber-500 mb-4">{finalScore.toFixed(1)}</div>
                <button onClick={handleFinish} disabled={isFinishing} className="w-full py-3 bg-amber-500 text-black rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-amber-400">
                  {isFinishing ? <Loader2 className="animate-spin" size={12}/> : "Salvar na Database"}
                </button>
              </section>
            </div>

            {/* Coluna 2: Rampas */}
            <div className="col-span-12 lg:col-span-4 overflow-y-auto custom-scrollbar">
              <section className="bg-zinc-900/30 border border-white/5 rounded-[1.5rem] p-5 space-y-3">
                <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-widest">CIRCUITO DE RAMPAS</h3>
                {state.ramps.map((ramp: any, idx: number) => (
                  <div key={idx} className="flex gap-3 items-center bg-black/60 border border-white/5 rounded-xl p-2.5">
                    <span className="flex-1 text-[8px] font-black uppercase text-slate-400">{ramp.name}</span>
                    <input type="number" className="w-12 bg-zinc-950 border border-amber-500/40 rounded p-1 text-center text-amber-400 text-sm font-black outline-none" value={ramp.score || ''} onChange={e => {
                      const n = [...state.ramps]; n[idx].score = parseFloat(e.target.value) || 0; setState({...state, ramps: n});
                    }} />
                  </div>
                ))}
              </section>
            </div>

            {/* Coluna 3: Acompanhamentos */}
            <div className="col-span-12 lg:col-span-5 overflow-y-auto custom-scrollbar">
              <section className="bg-zinc-900/30 border border-white/5 rounded-[1.5rem] p-5 space-y-4">
                <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-widest">ACOMPANHAMENTOS</h3>
                {state.tracking.map((track: any, idx: number) => (
                  <div key={idx} className="bg-black/60 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400">{track.location}</span>
                    <input type="number" className="w-12 bg-zinc-950 border border-amber-500/40 rounded p-1 text-center text-amber-400 text-sm font-black outline-none" value={track.score || ''} onChange={e => {
                      const n = [...state.tracking]; n[idx].score = parseFloat(e.target.value) || 0; setState({...state, tracking: n});
                    }} />
                  </div>
                ))}
              </section>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-5xl mx-auto h-full flex flex-col animate-in fade-in duration-500 overflow-hidden">
             <h2 className="text-xl font-military font-bold text-white tracking-widest uppercase mb-6">Arquivo de Database</h2>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                {history.map((item) => (
                  <div key={item.id} className="bg-zinc-900/40 border border-white/5 rounded-xl p-4 flex items-center justify-between group">
                    <div>
                      <h3 className="text-sm font-bold uppercase text-white">{item.state.candidate.name}</h3>
                      <p className="text-[9px] text-slate-500">{item.date}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={`text-xl font-black ${item.finalScore >= item.passingGrade ? 'text-green-500' : 'text-red-500'}`}>{item.finalScore.toFixed(1)}</span>
                      <button onClick={(e) => deleteHistoryEntry(item.id, e)} className="text-slate-700 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>

      <footer className="px-8 py-1.5 border-t border-white/5 bg-black text-[6px] font-black text-slate-800 uppercase tracking-[0.4em] text-center">
        ROCAM - GRUPAMENTO TÁTICO DE ELITE - CIDADE SOUL
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.99); } to { opacity: 1; transform: scale(1); } }
        .animate-in { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;
