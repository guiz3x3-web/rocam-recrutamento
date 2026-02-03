
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Shield, 
  User, 
  MapPin, 
  Trophy, 
  ClipboardCheck, 
  Zap, 
  Loader2,
  Plus, 
  Trash2,
  Activity,
  FileText,
  Settings,
  X,
  ChevronDown,
  BookOpen,
  UserCheck,
  UserX,
  Users,
  Target,
  HelpCircle,
  History,
  Eye,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { RecruitmentState, SavedEvaluation, AIReviewResult } from './types';
import { getAIReview } from './services/geminiService';
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
const App: React.FC = () => { 
  const [isLogged, setIsLogged] = useState(sessionStorage.getItem('rocam_logged') === 'false');
  const [userField, setUserField] = useState('');
  const [passField, setPassField] = useState('');

  const handleLogin = () => {
    if (userField === "instrutor" && passField === "rocam2026") {
      sessionStorage.setItem('rocam_logged', 'true');
      setIsLogged(true);
    } else {
      alert("Usuário ou Senha incorretos!");
    }
  };
  const [activeTab, setActiveTab] = useState<'evaluation' | 'protocols' | 'history'>('evaluation');
  const [passingGrade, setPassingGrade] = useState<number>(7.0);
  const [showSettings, setShowSettings] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SavedEvaluation | null>(null);
  const [expandedProtocol, setExpandedProtocol] = useState<number | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  
  const [history, setHistory] = useState<SavedEvaluation[]>(() => {
    try {
      const saved = localStorage.getItem('rocam_history_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Erro ao carregar histórico:", e);
      return [];
    }
  });

  const defaultRamps = [
    { uid: '1', name: 'RODOVIA PARA O VERMELHO', score: 0 },
    { uid: '2', name: 'ESCADA DO VERMELHO', score: 0 },
    { uid: '3', name: 'TRILHOS', score: 0 },
    { uid: '4', name: 'ESCADA CONSTRUÇÃO BAIXA P/ RODOVIA', score: 0 },
    { uid: '5', name: 'RAMPA CONSTRUÇÃO BAIXA P/ RODOVIA', score: 0 },
    { uid: '6', name: 'BENNYS', score: 0 },
    { uid: '7', name: 'ESCADA BENNYS', score: 0 },
    { uid: '8', name: 'SPRITE', score: 0 },
    { uid: '9', name: 'GOLF', score: 0 },
    { uid: '10', name: 'AMIGAS INVERTIDA', score: 0 }
  ];

  const defaultTracking = [
    { uid: '1', location: 'PRAIA', time: '', score: 0 },
    { uid: '2', location: 'GROOVE', time: '', score: 0 },
    { uid: '3', location: 'MANSÕES', time: '', score: 0 }
  ];

  const [state, setState] = useState<RecruitmentState>({
    instructors: [{ id: '', name: '' }],
    candidate: { id: '', name: '' },
    ramps: defaultRamps,
    tunnel: { time: '', score: 0 },
    modulation: { time: '', score: 0 },
    tracking: defaultTracking,
  });

  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    localStorage.setItem('rocam_history_v1', JSON.stringify(history));
  }, [history]);

  const protocols = [
    { level: 'FÁCIL', q: 'Qual a prioridade principal da ROCAM em acompanhamentos?', a: 'A ROCAM tem prioridade em acompanhamentos à motocicletas.' },
    { level: 'FÁCIL', q: 'O que o oficial deve fazer obrigatoriamente após qualquer queda em ocorrência?', a: 'Deverá dar QTA imediato (encerrar a ocorrência).' },
    { level: 'FÁCIL', q: 'É permitido o uso da manobra Roadblock com a motocicleta?', a: 'Não, a utilização da moto como barreira física é totalmente proibida.' },
    { level: 'FÁCIL', q: 'Como deve ser o posicionamento das rodas ao estacionar a moto?', a: 'Ambas as rodas no mesmo lugar, nunca uma em cada.' },
    { level: 'FÁCIL', q: 'Qual o nome da formação padrão de patrulhamento para 3 motos?', a: 'Formação em "Serrote".' },
    { level: 'FÁCIL', q: 'Quantas motocicletas podem compor, no máximo, uma unidade ROCAM?', a: 'Até três motocicletas (P1, P2 e P3).' },
    { level: 'FÁCIL', q: 'Quem decide o destino da unidade e ocorrências?', a: 'O P1 (Moto Primária), o piloto mais experiente.' },
    { level: 'MÉDIO', q: 'Se o veículo for um 4 rodas importado, de quem é a prioridade?', a: 'A prioridade é do G.R.R.' },
    { level: 'MÉDIO', q: 'Qual a regra para o patrulhamento diário com garupa?', a: 'É proibido; cada membro deve usar sua própria moto.' },
    { level: 'MÉDIO', q: 'Regra para Probatórios patrulharem?', a: 'Somente na presença de um Piloto Oficial.' },
    { level: 'MÉDIO', q: 'Função do P2 nos acompanhamentos?', a: 'Assumir a modulação e o adiantamento nos becos.' },
    { level: 'MÉDIO', q: 'Modulação de entrada em serviço?', a: 'QAP Central, [Patente] [Nome] em QRV.' },
    { level: 'MÉDIO', q: 'O que o P3 deve priorizar no patrulhamento?', a: 'Cuidar da retaguarda e acatar as ordens do P1.' },
    { level: 'MÉDIO', q: 'O que o P3 prioriza nos becos?', a: 'Adiantamento de saída sem entrar no mesmo beco que P1/P2.' },
    { level: 'DIFÍCIL', q: 'Concurso para outro grupamento?', a: 'Deve pedir baixa da ROCAM antes, sujeito a exoneração.' },
    { level: 'DIFÍCIL', q: 'Posicionamento em "L" na abordagem?', a: 'P1 lateral, P2 diagonal, P3 retaguarda.' },
    { level: 'DIFÍCIL', q: 'Diferença tática no Alto Risco?', a: 'Motos rotacionam no próprio eixo apontando arma, sempre em movimento.' },
    { level: 'DIFÍCIL', q: 'Conduta em COD 5 de invasão?', a: 'Priorizar cerco tático e pontos elevados para cobertura.' },
    { level: 'DIFÍCIL', q: 'Regra sobre empinar a moto?', a: 'Apenas se o meliante empinar primeiro ou veículo desproporcional.' },
    { level: 'DIFÍCIL', q: 'Regra de retorno após queda?', a: 'A decisão de retorno é exclusivamente do suspeito, o oficial nunca pede.' }
  ];

  const categoryScores = useMemo(() => {
    const rampsSum = state.ramps.reduce((acc, r) => acc + (Number(r.score) || 0), 0);
    const trackingSum = state.tracking.reduce((acc, t) => acc + (Number(t.score) || 0), 0);
    const tunnelScore = Number(state.tunnel.score) || 0;
    const modulationScore = Number(state.modulation.score) || 0;
    
    return {
      ramps: rampsSum,
      tracking: trackingSum,
      tunnel: tunnelScore,
      modulation: modulationScore,
      total: rampsSum + trackingSum + tunnelScore + modulationScore
    };
  }, [state]);

  const finalScore = categoryScores.total;
  const isApprovedNow = finalScore >= passingGrade;

useEffect(() => {
    if (isLogged) {
      // Cria uma consulta ordenada pela data mais recente
      const q = query(collection(db, "evaluations"), orderBy("dateTimestamp", "desc"));
      
      // Escuta as mudanças em tempo real
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as SavedEvaluation[];
        setHistory(items);
      });

      return () => unsubscribe();
    }
  }, [isLogged]);
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
        review: { summary: "Avaliação registrada via Sistema ROCAM." }
      });
      setShowSuccessToast(true);
      setState({
        instructors: state.instructors.map(i => ({...i})), 
        candidate: { id: '', name: '' },
        ramps: defaultRamps.map(r => ({ ...r, score: 0 })),
        tunnel: { time: '', score: 0 },
        modulation: { time: '', score: 0 },
        tracking: defaultTracking.map(t => ({ ...t, score: 0, time: '' })),
      });
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (e) {
      alert("Erro ao salvar no banco!");
    } finally {
      setIsFinishing(false);
    }
  };

  const deleteHistoryEntry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Deseja apagar este registro permanentemente?")) {
      await deleteDoc(doc(db, "evaluations", id));
    }
  };

  if (!isLogged) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black font-sans">
        <div className="bg-zinc-900/50 border border-amber-500/20 p-10 rounded-[2.5rem] w-full max-w-sm text-center backdrop-blur-md shadow-2xl">
          <img src="https://i.imgur.com/TXMorwL.png" alt="ROCAM" className="w-20 h-20 mx-auto mb-6 object-contain" />
          <h2 className="text-amber-500 font-bold tracking-widest text-xl mb-8 uppercase">Acesso Restrito</h2>
          <div className="space-y-4">
            <input placeholder="USUÁRIO" className="w-full bg-black border border-white/5 rounded-xl p-3.5 text-[10px] font-black text-white outline-none focus:border-amber-500/50" onChange={e => setUserField(e.target.value)} />
            <input type="password" placeholder="SENHA" className="w-full bg-black border border-white/5 rounded-xl p-3.5 text-[10px] font-black text-white outline-none focus:border-amber-500/50" onChange={e => setPassField(e.target.value)} />
            <button onClick={handleLogin} className="w-full py-4 bg-amber-500 text-black rounded-xl font-black text-[10px] tracking-[0.2em] hover:bg-amber-400 mt-4">AUTENTICAR</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-black text-slate-300 overflow-hidden font-sans select-none">
      
      {showSuccessToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-green-500 text-black px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={18} />
          Avaliação Salva e Ficha Resetada!
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-[2rem] w-full max-w-xs space-y-6 shadow-2xl">
            <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Controles do Sistema</h3>
            <button onClick={resetEval} className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all">Zerar Ficha Atual</button>
            <button onClick={() => setShowSettings(false)} className="w-full py-3 bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Fechar</button>
          </div>
        </div>
      )}

      {showResultModal && selectedResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-zinc-950 border border-amber-500/30 w-full max-w-4xl rounded-[2.5rem] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(245,158,11,0.05)] max-h-[95vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/30">
              <div className="flex items-center gap-3">
                <Shield className="text-amber-500 w-6 h-6" />
                <h2 className="text-lg font-military font-bold tracking-widest uppercase">Ficha de Recrutamento</h2>
              </div>
              <button onClick={() => setShowResultModal(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors text-slate-500"><X /></button>
            </div>
            
            <div className="p-10 flex-1 overflow-y-auto custom-scrollbar space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-1">Candidato Avaliado</span>
                    <h3 className="text-4xl font-bold text-white uppercase tracking-tighter">{selectedResult.state.candidate.name}</h3>
                    <p className="text-[9px] text-slate-600 font-mono mt-1">ID: {selectedResult.state.candidate.id} • DATA: {selectedResult.date}</p>
                  </div>
                  
                  <div className="flex items-center gap-6 bg-zinc-900/40 p-8 rounded-[2rem] border border-white/5">
                    <div className="text-center pr-8 border-r border-white/10">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Nota</span>
                      <div className="text-5xl font-black text-amber-500">{selectedResult.finalScore.toFixed(1)}</div>
                    </div>
                    <div className="flex-1">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Veredito</span>
                      <div className={`text-2xl font-black tracking-widest uppercase flex items-center gap-3 ${selectedResult.finalScore >= selectedResult.passingGrade ? 'text-green-500' : 'text-red-500'}`}>
                        {selectedResult.finalScore >= selectedResult.passingGrade ? <UserCheck className="w-7 h-7" /> : <UserX className="w-7 h-7" />}
                        {selectedResult.finalScore >= selectedResult.passingGrade ? 'APROVADO' : 'REPROVADO'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/20 p-8 rounded-[2rem] border border-white/5 space-y-4">
                  <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><Trophy className="w-4 h-4"/> Parecer Tático</h4>
                  <p className="text-sm leading-relaxed italic text-slate-400">"{selectedResult.review.summary}"</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/5"></div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Pontuação Técnica</h4>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5">
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block mb-4 border-b border-white/5 pb-2">Rampas</span>
                    {selectedResult.state.ramps.map((r, i) => (
                      <div key={i} className="flex justify-between text-[11px] font-bold uppercase mb-1 last:mb-0">
                        <span className="text-slate-500">{r.name}</span>
                        <span className="text-amber-500">{r.score.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5">
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block mb-4 border-b border-white/5 pb-2">Circuitos</span>
                    <div className="flex justify-between text-[11px] font-bold uppercase mb-2">
                      <span className="text-slate-500">TÚNEL</span>
                      <span className="text-amber-500">{selectedResult.state.tunnel.score.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold uppercase">
                      <span className="text-slate-500">CHINA</span>
                      <span className="text-amber-500">{selectedResult.state.modulation.score.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="bg-zinc-900/40 p-6 rounded-2xl border border-white/5">
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block mb-4 border-b border-white/5 pb-2">Acomp.</span>
                    {selectedResult.state.tracking.map((t, i) => (
                      <div key={i} className="flex justify-between text-[11px] font-bold uppercase mb-1 last:mb-0">
                        <span className="text-slate-500">{t.location || 'SETOR'}</span>
                        <span className="text-amber-500">{t.score.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <span className="text-[8px] font-black text-slate-700 uppercase block mb-2">Equipe de Instrutores:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedResult.state.instructors.map((ins, i) => (
                    <div key={i} className="text-[9px] font-bold bg-zinc-900 border border-white/5 px-3 py-1 rounded-lg text-slate-400">
                      {ins.name} (ID: {ins.id})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="px-8 py-3 flex items-center justify-between bg-zinc-950 border-b border-white/5 flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <img src="https://i.imgur.com/TXMorwL.png" alt="ROCAM" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-base font-military font-bold text-amber-500 tracking-widest leading-none uppercase">ROCAM</h1>
            <p className="text-[7px] font-black text-slate-700 uppercase tracking-[0.3em] mt-1 italic">Rondas Ostensivas com Apoio de Motocicletas</p>
          </div>
        </div>
        <nav className="flex bg-black p-1 rounded-xl border border-white/5">
          <button onClick={() => setActiveTab('evaluation')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'evaluation' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-600 hover:text-white'}`}>
            <FileText size={12}/> Avaliação
          </button>
          <button onClick={() => setActiveTab('protocols')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'protocols' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-600 hover:text-white'}`}>
            <HelpCircle size={12}/> Perguntas
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-600 hover:text-white'}`}>
            <History size={12}/> Histórico
          </button>
        </nav>
        <button onClick={() => setShowSettings(true)} className="p-2 text-white/10 hover:text-amber-500/40 transition-all">
          <Settings className="w-4 h-4" />
        </button>
      </header>

      <main className="flex-1 overflow-hidden p-4 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)] relative">
        
        {activeTab === 'evaluation' && (
          <div className="h-full max-w-full grid grid-cols-12 gap-4 animate-in fade-in duration-500 overflow-hidden">
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2">
              <section className="bg-zinc-900/40 border border-white/5 rounded-[1.2rem] p-4 space-y-2.5">
                <div className="flex justify-between items-center">
                  <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><Users size={12}/> Instrutores</h3>
                  <button onClick={() => setState(p => ({...p, instructors: [...p.instructors, {id:'', name:''}]}))} className="p-1 bg-amber-500/10 text-amber-500 rounded-md hover:bg-amber-500/20"><Plus size={10}/></button>
                </div>
                {state.instructors.map((ins, idx) => (
                  <div key={idx} className="space-y-1 group relative">
                    <input placeholder="NOME INSTRUTOR" className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-[10px] uppercase font-bold focus:border-amber-500 outline-none" value={ins.name} onChange={e => {
                      const n = [...state.instructors]; n[idx].name = e.target.value; setState({...state, instructors: n});
                    }} />
                    <input placeholder="ID" className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-[10px] font-bold focus:border-amber-500 outline-none" value={ins.id} onChange={e => {
                      const n = [...state.instructors]; n[idx].id = e.target.value; setState({...state, instructors: n});
                    }} />
                    {state.instructors.length > 1 && (
                      <button onClick={() => setState(p => ({...p, instructors: p.instructors.filter((_, i) => i !== idx)}))} className="absolute top-0 right-0 p-1 text-slate-800 hover:text-red-500 transition-colors"><X size={8}/></button>
                    )}
                  </div>
                ))}
              </section>

              <section className="bg-zinc-900/40 border border-white/5 rounded-[1.2rem] p-4 space-y-2.5">
                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><User size={12}/> Conscrito</h3>
                <input placeholder="NOME DO CONSRITO" className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-[10px] uppercase font-bold outline-none focus:border-amber-500" value={state.candidate.name} onChange={e => setState({...state, candidate: {...state.candidate, name: e.target.value}})} />
                <input placeholder="ID / PASSAPORTE" className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-[10px] font-bold outline-none focus:border-amber-500" value={state.candidate.id} onChange={e => setState({...state, candidate: {...state.candidate, id: e.target.value}})} />
              </section>

              <section className="bg-zinc-900/40 border border-white/5 rounded-[1.2rem] p-5 flex flex-col gap-3 mt-auto">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black text-slate-700 uppercase block mb-1 tracking-widest">Nota Atual</span>
                    <div className="text-4xl font-sans font-black text-amber-500 tracking-tighter">{finalScore.toFixed(1)}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-black text-slate-700 uppercase block mb-1 tracking-widest">Média</span>
                    <input type="number" step="0.5" className="w-12 bg-black border border-white/5 rounded-lg p-1 text-center text-amber-500 text-[10px] font-bold outline-none" value={passingGrade} onChange={e => setPassingGrade(parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
                <div className={`w-full py-2 rounded-lg border text-center font-black text-[9px] tracking-[0.2em] ${finalScore >= passingGrade ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                  {finalScore >= passingGrade ? 'APROVADO' : 'REPROVADO'}
                </div>
                <button onClick={handleFinish} disabled={isFinishing} className="w-full py-3 bg-amber-500 text-black rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-amber-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10">
                  {isFinishing ? <Loader2 className="animate-spin" size={12}/> : <Shield size={12}/>}
                  Finalizar e Salvar
                </button>
              </section>
            </div>

            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-hidden">
              <section className="bg-zinc-900/30 border border-white/5 rounded-[1.5rem] p-5 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><MapPin size={14}/> CIRCUITO DE RAMPAS</h3>
                  <button onClick={() => setState(p => ({...p, ramps: [...p.ramps, {uid:Math.random().toString(), name:'', score:0}]}))} className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500/20 transition-all"><Plus size={12}/></button>
                </div>
                <div className="space-y-1.5">
                  {state.ramps.map((ramp, idx) => (
                    <div key={ramp.uid} className="flex gap-3 items-center bg-black/60 border border-white/5 rounded-xl p-2.5 group hover:border-amber-500/20 transition-all">
                      <input placeholder="TESTE DE RAMPA" className="flex-1 bg-transparent text-[8px] font-black uppercase outline-none text-slate-300" value={ramp.name} onChange={e => {
                        const n = [...state.ramps]; n[idx].name = e.target.value; setState({...state, ramps: n});
                      }} />
                      <div className="flex items-center gap-1.5 bg-zinc-950 border border-amber-500/40 rounded px-2.5 py-1 shadow-inner">
                        <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">NOTA:</span>
                        <input type="number" step="0.5" className="w-10 bg-transparent text-center text-amber-400 text-sm font-black outline-none" value={ramp.score || ''} onChange={e => {
                          const n = [...state.ramps]; n[idx].score = parseFloat(e.target.value) || 0; setState({...state, ramps: n});
                        }} />
                      </div>
                      <button onClick={() => setState(p => ({...p, ramps: p.ramps.filter(r=>r.uid!==ramp.uid)}))} className="text-slate-900 group-hover:text-red-500 transition-colors"><Trash2 size={10}/></button>
                    </div>
                  ))}
                </div>
              </section>
              <section className="bg-zinc-900/40 border border-white/5 rounded-[1.5rem] p-4 space-y-3">
                <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] text-center border-b border-white/5 pb-2 flex items-center justify-center gap-2"><Target size={12}/> RESUMO OPERACIONAL</h3>
                <div className="space-y-1.5">
                  {[
                    { label: 'CIRCUITOS', score: categoryScores.tunnel + categoryScores.modulation, icon: <Zap size={10}/> },
                    { label: 'ACOMPANHAMENTOS', score: categoryScores.tracking, icon: <ClipboardCheck size={10}/> },
                    { label: 'RAMPAS', score: categoryScores.ramps, icon: <MapPin size={10}/> },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center bg-black/40 px-3 py-2 rounded-xl border border-white/5">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter flex items-center gap-2">{item.icon} {item.label}</span>
                      <span className="text-sm font-black text-amber-500 tabular-nums">{item.score.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 overflow-hidden">
              <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                <div className="bg-zinc-900/30 border border-white/5 rounded-[1.5rem] p-4 space-y-2.5">
                  <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><Zap size={14}/> TUNEL</h3>
                  <div className="flex items-center gap-2 bg-black/60 border border-white/5 rounded-lg px-2.5 py-1.5 group/time">
                    <Clock className="text-amber-500/50 group-focus-within/time:text-amber-500 transition-colors shrink-0" size={14} />
                    <input placeholder="00:00" className="w-full bg-transparent text-[11px] font-black uppercase outline-none text-amber-500" value={state.tunnel.time} onChange={e => setState({...state, tunnel: {...state.tunnel, time: e.target.value}})} />
                  </div>
                  <div className="bg-zinc-950 border border-amber-500/40 rounded-lg p-1.5 flex items-center justify-between px-2.5">
                    <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">NOTA:</span>
                    <input type="number" step="0.5" className="flex-1 bg-transparent text-sm font-black outline-none text-amber-400 text-center" value={state.tunnel.score || ''} onChange={e => setState({...state, tunnel: {...state.tunnel, score: parseFloat(e.target.value) || 0}})} />
                  </div>
                </div>
                <div className="bg-zinc-900/30 border border-white/5 rounded-[1.5rem] p-4 space-y-2.5">
                  <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><Activity size={14}/> MOD. CHINA</h3>
                  <div className="flex items-center gap-2 bg-black/60 border border-white/5 rounded-lg px-2.5 py-1.5 group/time">
                    <Clock className="text-amber-500/50 group-focus-within/time:text-amber-500 transition-colors shrink-0" size={14} />
                    <input placeholder="00:00" className="w-full bg-transparent text-[11px] font-black uppercase outline-none text-amber-500" value={state.modulation.time} onChange={e => setState({...state, modulation: {...state.modulation, time: e.target.value}})} />
                  </div>
                  <div className="bg-zinc-950 border border-amber-500/40 rounded-lg p-1.5 flex items-center justify-between px-2.5">
                    <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">NOTA:</span>
                    <input type="number" step="0.5" className="flex-1 bg-transparent text-sm font-black outline-none text-amber-400 text-center" value={state.modulation.score || ''} onChange={e => setState({...state, modulation: {...state.modulation, score: parseFloat(e.target.value) || 0}})} />
                  </div>
                </div>
              </div>
              <section className="bg-zinc-900/30 border border-white/5 rounded-[1.5rem] p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><ClipboardCheck size={14}/> ACOMPANHAMENTOS</h3>
                  <button onClick={() => setState(p => ({...p, tracking: [...p.tracking, {uid:Math.random().toString(), location:'', time:'', score:0}]}))} className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500/20 transition-all"><Plus size={12}/></button>
                </div>
                <div className="space-y-2.5">
                  {state.tracking.map((track, idx) => (
                    <div key={track.uid} className="bg-black/60 border border-white/5 rounded-xl p-3 flex items-center justify-between group transition-all hover:border-amber-500/20">
                      <div className="flex-1 space-y-1.5">
                        <input placeholder="SETOR / ROTA" className="w-full bg-transparent text-[10px] font-black uppercase outline-none text-slate-400" value={track.location} onChange={e => {
                          const n = [...state.tracking]; n[idx].location = e.target.value; setState({...state, tracking: n});
                        }} />
                        <div className="flex items-center gap-2 group/time">
                          <Clock className="text-amber-500/40 group-focus-within/time:text-amber-500 transition-colors" size={14} />
                          <input placeholder="00:00" className="bg-transparent outline-none text-[11px] text-amber-500 font-mono w-full" value={track.time} onChange={e => {
                            const n = [...state.tracking]; n[idx].time = e.target.value; setState({...state, tracking: n});
                          }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 border-l border-white/5 pl-3 ml-3">
                        <div className="flex flex-col items-center bg-zinc-950 border border-amber-500/30 rounded py-1.5 px-3 shadow-inner">
                          <span className="text-[7px] font-black text-amber-600 uppercase mb-0.5 tracking-tighter">NOTA</span>
                          <input type="number" step="0.5" className="w-10 bg-transparent text-center text-amber-400 text-lg font-black outline-none" value={track.score || ''} onChange={e => {
                            const n = [...state.tracking]; n[idx].score = parseFloat(e.target.value) || 0; setState({...state, tracking: n});
                          }} />
                        </div>
                        <button onClick={() => setState(p => ({...p, tracking: p.tracking.filter(t=>t.uid!==track.uid)}))} className="text-slate-900 group-hover:text-red-500 transition-colors"><Trash2 size={12}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'protocols' && (
          <div className="max-w-4xl mx-auto h-full flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden">
            <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8 backdrop-blur-md overflow-hidden flex flex-col h-full shadow-2xl">
              <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20"><HelpCircle className="text-amber-500" size={20}/></div>
                <h2 className="text-2xl font-military font-bold text-white tracking-widest uppercase">Perguntas de Recrutamento</h2>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-3">
                {protocols.map((p, idx) => (
                  <div key={idx} className={`border transition-all rounded-xl ${expandedProtocol === idx ? 'bg-amber-500/5 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]' : 'bg-black/60 border-white/5'}`}>
                    <button onClick={() => setExpandedProtocol(expandedProtocol === idx ? null : idx)} className="w-full text-left p-5 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border mb-2 inline-block ${p.level === 'FÁCIL' ? 'text-green-500' : p.level === 'MÉDIO' ? 'text-amber-500' : 'text-red-500'}`}>{p.level}</span>
                        <h4 className={`text-base font-bold tracking-tight leading-snug ${expandedProtocol === idx ? 'text-amber-500' : 'text-slate-300'}`}>{p.q}</h4>
                      </div>
                      <ChevronDown className={`w-5 h-5 transition-transform shrink-0 ${expandedProtocol === idx ? 'rotate-180 text-amber-500' : ''}`} />
                    </button>
                    {expandedProtocol === idx && (
                      <div className="px-5 pb-5 text-sm leading-relaxed text-slate-400 italic border-t border-white/5 pt-4">"{p.a}"</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-5xl mx-auto h-full flex flex-col animate-in fade-in duration-500 overflow-hidden">
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20"><History className="text-amber-500" size={20}/></div>
                <div>
                  <h2 className="text-xl font-military font-bold text-white tracking-widest uppercase">Histórico Operacional</h2>
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1">{history.length} Registros Arquivados</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2.5">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                  <Shield size={64}/>
                  <p className="mt-4 font-black uppercase text-[10px] tracking-[0.3em]">Arquivo Vazio</p>
                </div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="bg-zinc-900/40 border border-white/5 rounded-xl p-4 flex items-center justify-between group hover:border-amber-500/40 transition-all cursor-pointer hover:bg-zinc-900/60 shadow-lg shadow-black/20" onClick={() => { setSelectedResult(item); setShowResultModal(true); }}>
                    <div className="flex items-center gap-5">
                      <div className={`p-3 rounded-lg ${item.finalScore >= item.passingGrade ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {item.finalScore >= item.passingGrade ? <UserCheck size={20}/> : <UserX size={20}/>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[7px] font-black bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-500 uppercase tracking-tighter">Conscrito</span>
                          <h3 className="text-sm font-bold uppercase text-white tracking-tight">{item.state.candidate.name}</h3>
                        </div>
                        <div className="flex gap-2 text-[9px] text-slate-500 font-bold uppercase mt-0.5 items-center">
                          <span className="flex items-center gap-1">
                            <Users size={10} className="text-amber-500"/> 
                            <span className="text-slate-400">Instrutor:</span>
                            <span className="text-white">{item.state.instructors[0]?.name || 'N/A'}</span>
                          </span>
                          <span className="opacity-20">|</span>
                          <span className="text-slate-700 font-mono">{item.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right pr-6 border-r border-white/5">
                        <span className={`text-xl font-black tabular-nums ${item.finalScore >= item.passingGrade ? 'text-green-500' : 'text-red-500'}`}>{item.finalScore.toFixed(1)}</span>
                        <div className="text-[7px] font-bold text-slate-700 uppercase tracking-widest">Score</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" className="p-2.5 text-slate-600 hover:text-amber-500 transition-colors bg-white/5 rounded-lg border border-white/5" title="Visualizar">
                          <Eye size={18}/>
                        </button>
                        <button type="button" onClick={(e) => deleteHistoryEntry(item.id, e)} className="p-2.5 text-slate-400 hover:text-red-500 transition-all bg-white/5 rounded-lg border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 relative z-50" title="Apagar Registro">
                          <Trash2 size={18}/>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>

      <footer className="px-8 py-1.5 border-t border-white/5 bg-black text-[6px] font-black text-slate-800 uppercase tracking-[0.4em] text-center flex-shrink-0">
        ROCAM - GRUPAMENTO TÁTICO DE ELITE - CIDADE SOUL
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.99); } to { opacity: 1; transform: scale(1); } }
        .animate-in { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;
