import React, { useState, useMemo, useEffect } from 'react';
import { 
  Shield, User, MapPin, Trophy, ClipboardCheck, Zap, Loader2,
  Plus, Trash2, Activity, FileText, Settings, X, ChevronDown,
  UserCheck, UserX, Users, Target, HelpCircle, History, Eye,
  CheckCircle2, Clock
} from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE (Nuvem) ---
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, query, 
  orderBy, deleteDoc, doc, onSnapshot 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA6l96IKSBHh9Kg10Hb0uXWTqNvH4rEq54",
  authDomain: "recrutamento-rocam-96e76.firebaseapp.com",
  projectId: "recrutamento-rocam-96e76",
  storageBucket: "recrutamento-rocam-96e76.firebasestorage.app",
  messagingSenderId: "471290475293",
  appId: "1:471290475293:web:de263909337e633963e7f4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// ---------------------------------------

const App: React.FC = () => {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [logado, setLogado] = useState(sessionStorage.getItem("logado") === "true");
  const [activeTab, setActiveTab] = useState<'evaluation' | 'protocols' | 'history'>('evaluation');
  const [history, setHistory] = useState<any[]>([]);
  const [isFinishing, setIsFinishing] = useState(false);
  const [expandedProtocol, setExpandedProtocol] = useState<number | null>(null);

  const [state, setState] = useState({
    instructors: [{ id: '', name: '' }],
    candidate: { id: '', name: '' },
    ramps: [
      { uid: '1', name: 'RODOVIA PARA O VERMELHO', score: 0 },
      { uid: '2', name: 'ESCADINHA DO VERMELHO', score: 0 },
      { uid: '3', name: 'TRILHOS', score: 0 },
      { uid: '4', name: 'ESCADA CONSTRUÇÃO BAIXA P/ RODOVIA', score: 0 },
      { uid: '5', name: 'SPRITE', score: 0 }
    ],
    tunnel: { time: '', score: 0 },
    modulation: { time: '', score: 0 },
    tracking: [
      { uid: '1', location: 'PRAIA', time: '', score: 0 },
      { uid: '2', location: 'GROOVE', time: '', score: 0 },
      { uid: '3', location: 'MANSÕES', time: '', score: 0 }
    ],
  });

  // Carregar histórico em tempo real do Firebase
  useEffect(() => {
    if (logado) {
      const q = query(collection(db, "evaluations"), orderBy("date", "desc"));
      return onSnapshot(q, (snapshot) => {
        setHistory(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      });
    }
  }, [logado]);

  const categoryScores = useMemo(() => {
    const ramps = state.ramps.reduce((acc, r) => acc + (Number(r.score) || 0), 0);
    const tracking = state.tracking.reduce((acc, t) => acc + (Number(t.score) || 0), 0);
    const circuits = (Number(state.tunnel.score) || 0) + (Number(state.modulation.score) || 0);
    return { ramps, tracking, circuits, total: ramps + tracking + circuits };
  }, [state]);

  const handleFinish = async () => {
    if (!state.candidate.name) return alert("Preencha o nome do conscrito!");
    setIsFinishing(true);
    try {
      await addDoc(collection(db, "evaluations"), {
        date: new Date().toLocaleString('pt-BR'),
        candidateName: state.candidate.name,
        instructor: state.instructors[0].name,
        score: categoryScores.total,
        status: categoryScores.total >= 7 ? 'APROVADO' : 'REPROVADO'
      });
      alert("Avaliação salva na nuvem!");
      window.location.reload(); 
    } catch (e) { alert("Erro ao salvar."); }
    setIsFinishing(false);
  };

  // Perguntas (Protocols)
  const protocols = [
    { level: 'FÁCIL', q: 'Qual a prioridade principal da ROCAM?', a: 'Prioridade em acompanhamentos à motocicletas.' },
    { level: 'MÉDIO', q: 'Regra para Probatórios patrulharem?', a: 'Somente na presença de um Piloto Oficial.' }
    // ... adicione as outras conforme necessário
  ];

  if (!logado) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="bg-zinc-900 p-8 rounded-2xl border border-white/10 w-80 space-y-4">
          <Shield className="text-amber-500 mx-auto" size={40}/>
          <input placeholder="Usuário" className="w-full bg-black border border-white/10 p-2 rounded text-white" onChange={e => setUser(e.target.value)} />
          <input type="password" placeholder="Senha" className="w-full bg-black border border-white/10 p-2 rounded text-white" onChange={e => setPass(e.target.value)} />
          <button onClick={() => { if(user==="instrutor" && pass==="rocam2026") { sessionStorage.setItem("logado","true"); setLogado(true); } }} className="w-full bg-amber-500 p-2 rounded font-black text-black">ENTRAR</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-black text-slate-300 font-sans overflow-hidden">
      <header className="px-8 py-3 bg-zinc-950 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Shield className="text-amber-500" />
          <span className="font-bold tracking-widest text-amber-500">ROCAM</span>
        </div>
        <nav className="flex bg-black p-1 rounded-xl border border-white/5">
          <button onClick={() => setActiveTab('evaluation')} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase ${activeTab === 'evaluation' ? 'bg-amber-500 text-black' : 'text-slate-600'}`}>Avaliação</button>
          <button onClick={() => setActiveTab('protocols')} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase ${activeTab === 'protocols' ? 'bg-amber-500 text-black' : 'text-slate-600'}`}>Perguntas</button>
          <button onClick={() => setActiveTab('history')} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase ${activeTab === 'history' ? 'bg-amber-500 text-black' : 'text-slate-600'}`}>Histórico</button>
        </nav>
      </header>

      <main className="flex-1 p-4 overflow-hidden bg-zinc-950">
        {activeTab === 'evaluation' && (
          <div className="h-full grid grid-cols-12 gap-4">
            {/* Esquerda: Conscrito e Nota */}
            <div className="col-span-3 flex flex-col gap-4">
              <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 space-y-4">
                <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest">Conscrito</p>
                <input placeholder="NOME" className="w-full bg-black border border-white/5 p-2 rounded text-xs" value={state.candidate.name} onChange={e => setState({...state, candidate: {...state.candidate, name: e.target.value.toUpperCase()}})} />
                <input placeholder="ID" className="w-full bg-black border border-white/5 p-2 rounded text-xs" value={state.candidate.id} onChange={e => setState({...state, candidate: {...state.candidate, id: e.target.value}})} />
              </div>
              <div className="mt-auto bg-zinc-900/40 p-6 rounded-xl border border-white/5">
                <p className="text-slate-500 text-[10px] font-black uppercase mb-1">Nota Atual</p>
                <p className="text-5xl font-black text-amber-500 mb-4">{categoryScores.total.toFixed(1)}</p>
                <button onClick={handleFinish} disabled={isFinishing} className="w-full bg-amber-500 text-black font-black py-3 rounded-xl text-[10px] uppercase">
                  {isFinishing ? "Salvando..." : "Finalizar e Salvar"}
                </button>
              </div>
            </div>

            {/* Meio: Rampas */}
            <div className="col-span-4 bg-zinc-900/40 p-4 rounded-xl border border-white/5 overflow-y-auto custom-scrollbar">
              <p className="text-amber-500 text-[10px] font-black uppercase mb-4">Circuito de Rampas</p>
              {state.ramps.map((r, i) => (
                <div key={i} className="flex justify-between items-center bg-black/40 p-2 rounded-lg mb-2 border border-white/5">
                  <span className="text-[9px] font-bold uppercase">{r.name}</span>
                  <input type="number" className="w-12 bg-zinc-900 text-center text-amber-500 font-bold rounded" value={r.score || ''} onChange={e => {
                    const n = [...state.ramps]; n[i].score = parseFloat(e.target.value) || 0; setState({...state, ramps: n});
                  }} />
                </div>
              ))}
            </div>

            {/* Direita: Circuitos e Acomp */}
            <div className="col-span-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5">
                  <p className="text-amber-500 text-[9px] font-black mb-2">TÚNEL</p>
                  <input type="number" className="w-full bg-black p-2 rounded text-center text-amber-500 font-bold" value={state.tunnel.score || ''} onChange={e => setState({...state, tunnel: {...state.tunnel, score: parseFloat(e.target.value) || 0}})} />
                </div>
                <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5">
                  <p className="text-amber-500 text-[9px] font-black mb-2">CHINA</p>
                  <input type="number" className="w-full bg-black p-2 rounded text-center text-amber-500 font-bold" value={state.modulation.score || ''} onChange={e => setState({...state, modulation: {...state.modulation, score: parseFloat(e.target.value) || 0}})} />
                </div>
              </div>
              <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 flex-1">
                <p className="text-amber-500 text-[9px] font-black mb-4">Acompanhamentos</p>
                {state.tracking.map((t, i) => (
                  <div key={i} className="flex justify-between items-center mb-2 bg-black/40 p-2 rounded-lg border border-white/5">
                    <span className="text-[9px] font-bold uppercase">{t.location}</span>
                    <input type="number" className="w-12 bg-zinc-900 text-center text-amber-500 font-bold rounded" value={t.score || ''} onChange={e => {
                      const n = [...state.tracking]; n[i].score = parseFloat(e.target.value) || 0; setState({...state, tracking: n});
                    }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'protocols' && (
          <div className="max-w-2xl mx-auto space-y-2">
            {protocols.map((p, i) => (
              <div key={i} className="bg-zinc-900/40 border border-white/5 p-4 rounded-xl">
                <button onClick={() => setExpandedProtocol(expandedProtocol === i ? null : i)} className="w-full text-left font-bold text-sm text-white flex justify-between uppercase">
                  {p.q} <ChevronDown size={14}/>
                </button>
                {expandedProtocol === i && <p className="mt-2 text-xs text-amber-500 italic">"{p.a}"</p>}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-2xl mx-auto space-y-2 overflow-y-auto h-full pr-2">
            {history.map((h: any) => (
              <div key={h.id} className="bg-zinc-900/60 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <p className="text-white font-bold uppercase text-xs">{h.candidateName}</p>
                  <p className="text-[8px] text-slate-500 uppercase">{h.date} • {h.status}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-lg font-black ${h.score >= 7 ? 'text-green-500' : 'text-red-500'}`}>{h.score.toFixed(1)}</span>
                  <button onClick={async () => { if(window.confirm("Apagar?")) await deleteDoc(doc(db, "evaluations", h.id)); }} className="text-red-500/30 hover:text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="py-2 text-center text-[6px] font-black text-slate-800 uppercase tracking-widest border-t border-white/5">
        ROCAM - GRUPAMENTO TÁTICO DE ELITE - CIDADE SOUL
      </footer>
    </div>
  );
};

export default App;