import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  UserCheck,
  UserX,
  Users,
  Target,
  HelpCircle,
  History,
  Eye,
  CheckCircle2,
  Play,
  Square,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Award,
  Medal,
  Wifi,
  FolderOpen,
  Save
} from 'lucide-react';
import { RecruitmentState, SavedEvaluation, AIReviewResult } from './types';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA6l96IKSBHh9Kg10Hb0uXWTqNvH4rEq54",
  authDomain: "recrutamento-rocam-96e76.firebaseapp.com",
  projectId: "recrutamento-rocam-96e76",
  storageBucket: "recrutamento-rocam-96e76.firebasestorage.app",
  messagingSenderId: "471290475293",
  appId: "1:471290475293:web:de263909337e633963e7f4",
  databaseURL: "https://recrutamento-rocam-96e76-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const gtmLogo = '/guarnicao_gtm_cinza_camuflado_fundo_transparente_final.png';

interface TimerButtonProps {
  value: string;
  onStop: (formattedTime: string) => void;
}

const InteractiveTimer: React.FC<TimerButtonProps> = ({ value, onStop }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      const formatted = `${mins}:${secs}`;
      onStop(formatted);
    } else {
      setSeconds(0);
      setIsRunning(true);
    }
  };

  const formatDisplay = (secCount: number) => {
    const mins = Math.floor(secCount / 60).toString().padStart(2, '0');
    const secs = (secCount % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <button
      type="button"
      onClick={toggleTimer}
      title={isRunning ? "Clique para parar e salvar" : "Clique para iniciar o cronômetro"}
      className={`px-2 py-1 rounded-md text-[10px] font-mono font-black uppercase flex items-center gap-1.5 transition-all shadow-md ${
        isRunning 
          ? 'bg-red-500 text-white animate-pulse border border-red-400' 
          : 'bg-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-black border border-amber-500/30'
      }`}
    >
      {isRunning ? <Square size={10} className="fill-current" /> : <Play size={10} className="fill-current" />}
      <span>{isRunning ? formatDisplay(seconds) : (value || '00:00')}</span>
    </button>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('gtm_logged_in') === 'true';
  });
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'dashboard' | 'evaluation' | 'protocols' | 'history'>('dashboard');
  const [passingGrade, setPassingGrade] = useState<number>(7.0);
  const [showSettings, setShowSettings] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SavedEvaluation | null>(null);
  const [expandedProtocol, setExpandedProtocol] = useState<number | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string>('Avaliação Salva com Sucesso!');
  
  const [sessionId, setSessionId] = useState<string>('GTM-01');
  const [activeEvaluationsList, setActiveEvaluationsList] = useState<{ [id: string]: { candidateName: string; updatedAt: string } }>({});
  const [showEvaluationsModal, setShowEvaluationsModal] = useState(false);

  const [history, setHistory] = useState<SavedEvaluation[]>([]);

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

  const [state, setState] = useState<RecruitmentState>({
    instructors: [{ id: '', name: '' }],
    candidate: { id: '', name: '' },
    ramps: defaultRamps,
    tunnel: { time: '', score: 0 },
    modulation: { time: '', score: 0 },
    tracking: defaultTracking,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const parseTimeToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10) || 0;
      const secs = parseInt(parts[1], 10) || 0;
      return mins * 60 + secs;
    }
    return parseFloat(timeStr) || 0;
  };

  useEffect(() => {
    const listRef = ref(database, 'active_sessions');
    const unsubList = onValue(listRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setActiveEvaluationsList(data);
        // Se estivermos na aba de avaliação mas a sala atual foi apagada e não há mais nenhuma, joga para o dashboard
        if (Object.keys(data).length === 0 && activeTab === 'evaluation') {
          setActiveTab('dashboard');
        }
      } else {
        setActiveEvaluationsList({});
        if (activeTab === 'evaluation') {
          setActiveTab('dashboard');
        }
      }
    });
    return () => unsubList();
  }, [activeTab]);

  useEffect(() => {
    const historyRef = ref(database, 'global_history');
    const unsubHistory = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const historyArray = Object.values(data) as SavedEvaluation[];
        setHistory(historyArray.reverse());
      } else {
        setHistory([]);
      }
    });
    return () => unsubHistory();
  }, []);

  useEffect(() => {
    if (!sessionId.trim()) return;
    const sessionRef = ref(database, `sessions/${sessionId.trim().toUpperCase()}`);
    
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setState(data);
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  const handleCreateNewBlankSheet = () => {
    const newId = 'GTM-' + Math.floor(100 + Math.random() * 900);
    const cleanState = {
      instructors: [{ id: '', name: '' }],
      candidate: { id: '', name: '' },
      ramps: defaultRamps.map(r => ({ ...r, score: 0 })),
      tunnel: { time: '', score: 0 },
      modulation: { time: '', score: 0 },
      tracking: defaultTracking.map(t => ({ ...t, score: 0, time: '' })),
    };
    
    setSessionId(newId);
    setState(cleanState);
    
    const cleanSessionId = newId.toUpperCase();
    set(ref(database, `sessions/${cleanSessionId}`), cleanState);
    set(ref(database, `active_sessions/${cleanSessionId}`), {
      candidateName: 'Novo Recrutamento',
      updatedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    setActiveTab('evaluation');
  };

  const updateStateAndSync = (newState: RecruitmentState) => {
    setState(newState);
    if (sessionId.trim()) {
      const cleanSessionId = sessionId.trim().toUpperCase();
      const sessionRef = ref(database, `sessions/${cleanSessionId}`);
      set(sessionRef, newState).catch(err => console.error("Erro ao sincronizar Firebase:", err));

      const metaRef = ref(database, `active_sessions/${cleanSessionId}`);
      set(metaRef, {
        candidateName: newState.candidate.name || 'Candidato em andamento',
        updatedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }).catch(err => console.error("Erro ao atualizar índice:", err));
    }
  };

  const handleTunnelTimeChange = (timeStr: string) => {
    const secs = parseTimeToSeconds(timeStr);
    let calculatedScore = 0.5;
    if (secs > 100) {
      calculatedScore = Math.max(0, 0.5 * (100 / secs));
    }
    calculatedScore = Math.round(calculatedScore * 10) / 10;

    updateStateAndSync({
      ...state,
      tunnel: { time: timeStr, score: calculatedScore }
    });
  };

  const handleTrackingTimeChange = (idx: number, timeStr: string) => {
    const secs = parseTimeToSeconds(timeStr);
    let calculatedScore = Math.min(1.0, Math.max(0, 1.0 * (secs / 90)));
    calculatedScore = Math.round(calculatedScore * 10) / 10;

    const n = [...state.tracking];
    n[idx].time = timeStr;
    n[idx].score = calculatedScore;
    updateStateAndSync({ ...state, tracking: n });
  };

  const protocols = [
    { level: 'FÁCIL', q: 'Qual a prioridade principal do GTM em acompanhamentos?', a: 'O GTM tem prioridade em acompanhamentos a motocicletas.' },
    { level: 'FÁCIL', q: 'O que o oficial deve fazer obrigatoriamente após qualquer queda em ocorrência?', a: 'Deverá dar QTA imediato (encerrar a ocorrência).' },
    { level: 'FÁCIL', q: 'É permitido o uso da manobra Roadblock com a motocicleta?', a: 'Não, a utilização da moto como barreira física é totalmente proibida.' },
    { level: 'FÁCIL', q: 'Como deve ser o posicionamento das rodas ao estacionar a moto?', a: 'Ambas as rodas no mesmo lugar, nunca uma em cada.' },
    { level: 'FÁCIL', q: 'Qual o nome da formação padrão de patrulhamento para 3 motos?', a: 'Formação em "Serrote".' },
    { level: 'FÁCIL', q: 'Quantas motocicletas podem compor, no máximo, uma unidade GTM?', a: 'Até três motocicletas (P1, P2 e P3).' },
    { level: 'FÁCIL', q: 'Quem decide o destino da unidade e ocorrências?', a: 'O P1 (Moto Primária), o piloto mais experiente.' },
    { level: 'MÉDIO', q: 'Se o veículo for um 4 rodas importado, de quem é a prioridade?', a: 'A prioridade é do G.R.R.' },
    { level: 'MÉDIO', q: 'Qual a regra para o patrulhamento diário com garupa?', a: 'É proibido; cada membro deve usar sua própria moto.' },
    { level: 'MÉDIO', q: 'Regra para Probatórios patrulharem?', a: 'Somente na presença de um Piloto Oficial.' },
    { level: 'MÉDIO', q: 'Função do P2 nos acompanhamentos?', a: 'Assumir a modulação e o adiantamento nos becos.' },
    { level: 'MÉDIO', q: 'Modulação de entrada em serviço?', a: 'QAP Central, [Patente] [Nome] em QRV.' },
    { level: 'MÉDIO', q: 'O que o P3 deve priorizar no patrulhamento?', a: 'Cuidar da retaguarda e acatar as ordens do P1.' },
    { level: 'MÉDIO', q: 'O que o P3 prioriza nos becos?', a: 'Adiantamento de saída sem entrar no mesmo beco que P1/P2.' },
    { level: 'DIFÍCIL', q: 'Concurso para outro grupamento?', a: 'Deve pedir baixa do GTM antes, sujeito a exoneração.' },
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

  const stats = useMemo(() => {
    const total = history.length;
    if (total === 0) return { total: 0, approved: 0, rejected: 0, rate: 0, avgScore: '0.0' };
    const approved = history.filter(h => h.finalScore >= h.passingGrade).length;
    const rejected = total - approved;
    const rate = Math.round((approved / total) * 100);
    const avgScore = (history.reduce((acc, h) => acc + h.finalScore, 0) / total).toFixed(1);
    return { total, approved, rejected, rate, avgScore };
  }, [history]);

  const topInstructors = useMemo(() => {
    const map: { [name: string]: { count: number; approved: number } } = {};
    history.forEach(item => {
      item.state.instructors.forEach(ins => {
        const key = ins.name.trim().toUpperCase();
        if (key) {
          if (!map[key]) map[key] = { count: 0, approved: 0 };
          map[key].count += 1;
          if (item.finalScore >= item.passingGrade) {
            map[key].approved += 1;
          }
        }
      });
    });

    const list = Object.keys(map).map(name => ({
      name,
      count: map[name].count,
      approved: map[name].approved
    })).sort((a, b) => b.count - a.count);

    return list.slice(0, 4);
  }, [history]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'instrutor' && password === 'gtm2026') {
      localStorage.setItem('gtm_logged_in', 'true');
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Credenciais inválidas. Verifique o usuário e senha.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gtm_logged_in');
    setIsAuthenticated(false);
    setShowSettings(false);
  };

  const handleSaveOnly = () => {
    setIsSaving(true);
    updateStateAndSync(state);
    setTimeout(() => {
      setIsSaving(false);
      setToastMessage('Ficha salva e sincronizada na nuvem!');
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }, 500);
  };

  const handleFinish = async () => {
    if (!state.candidate.name || !state.candidate.id) {
      alert("ERRO: Nome e ID do conscrito são obrigatórios para finalizar.");
      return;
    }

    setIsFinishing(true);
    
    const instantReview: AIReviewResult = {
      summary: "Avaliação registrada e finalizada no banco de dados operacional GTM.",
      strengths: ["Conformidade operacional", "Execução de manobras"],
      weaknesses: ["Análise detalhada concluída"],
      verdict: isApprovedNow ? 'APROVADO' : 'REPROVADO'
    };

    const entryId = Math.random().toString(36).substring(2, 11);
    const newEntry: SavedEvaluation = {
      id: entryId,
      date: new Date().toLocaleString('pt-BR'),
      state: JSON.parse(JSON.stringify(state)),
      finalScore,
      review: instantReview,
      passingGrade
    };

    const historyEntryRef = ref(database, `global_history/${entryId}`);
    await set(historyEntryRef, newEntry).catch(err => console.error("Erro ao salvar histórico global:", err));

    setIsFinishing(false);
    setToastMessage('Avaliação Finalizada e Salva no Histórico Global!');
    setShowSuccessToast(true);
    
    const cleanId = sessionId.trim().toUpperCase();
    await remove(ref(database, `sessions/${cleanId}`)).catch(err => console.error(err));
    await remove(ref(database, `active_sessions/${cleanId}`)).catch(err => console.error(err));

    setTimeout(() => setShowSuccessToast(false), 3000);
    setActiveTab('dashboard');
  };

  const handleDeleteActiveSession = async (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Deseja realmente apagar a ficha da sala ${idToDelete}?`)) {
      await remove(ref(database, `sessions/${idToDelete}`)).catch(err => console.error(err));
      await remove(ref(database, `active_sessions/${idToDelete}`)).catch(err => console.error(err));
      
      // Se a ficha apagada for a que estava aberta, limpa e joga para o dashboard
      if (sessionId.toUpperCase() === idToDelete.toUpperCase()) {
        setActiveTab('dashboard');
      }
    }
  };

  const deleteHistoryEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("CONFIRMAÇÃO OPERACIONAL: Deseja apagar este registro permanentemente do histórico global?")) {
      remove(ref(database, `global_history/${id}`)).catch(err => console.error("Erro ao apagar do histórico:", err));
    }
  };

  const resetEval = () => {
    if(window.confirm("Deseja limpar todos os campos da ficha atual?")) {
      const resetState = {
        instructors: [{ id: '', name: '' }],
        candidate: { id: '', name: '' },
        ramps: defaultRamps.map(r => ({ ...r, score: 0 })),
        tunnel: { time: '', score: 0 },
        modulation: { time: '', score: 0 },
        tracking: defaultTracking.map(t => ({ ...t, score: 0, time: '' })),
      };
      updateStateAndSync(resetState);
      setShowSettings(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#171717] font-sans select-none relative overflow-hidden">
        <div className="w-full max-w-md p-8 bg-[#1f1f1f] border border-amber-500/40 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center text-center">
          <div className="w-28 h-28 rounded-2xl flex items-center justify-center mb-4">
            <img src={gtmLogo} alt="GTM Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(245,158,11,0.2)]" />
          </div>
          <h1 className="text-2xl font-black text-amber-500 tracking-wider uppercase mb-1">GTM</h1>
          <h2 className="text-[11px] font-black text-white uppercase tracking-widest mb-1">GRUPAMENTO TÁTICO DE MOTOCICLETAS</h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6">ACESSO RESTRITO</p>

          <form onSubmit={handleLoginSubmit} className="w-full space-y-4 text-left">
            <div>
              <label className="block text-[10px] font-black text-amber-500 uppercase tracking-wider mb-1.5">LOGIN</label>
              <input 
                type="text" 
                placeholder="Digite seu usuário" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-[#2a2a2a] border border-white/5 rounded-lg py-3 px-4 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-amber-500 uppercase tracking-wider mb-1.5">SENHA</label>
              <input 
                type="password" 
                placeholder="Digite sua senha" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#2a2a2a] border border-white/5 rounded-lg py-3 px-4 text-xs text-white placeholder:text-slate-500 focus:border-amber-500 outline-none transition-all"
              />
            </div>
            {loginError && (
              <p className="text-[10px] font-bold text-red-500 text-center uppercase tracking-wide">{loginError}</p>
            )}
            <button type="submit" className="w-full py-3.5 bg-[#c8922a] hover:bg-[#b07d1f] text-black font-black uppercase text-xs tracking-wider rounded-lg transition-all shadow-md mt-2 flex items-center justify-center gap-2">
              ENTRAR NO SISTEMA
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-black text-slate-300 overflow-hidden font-sans select-none">
      
      {showSuccessToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-amber-500 text-black px-6 py-3 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={18} /> {toastMessage}
        </div>
      )}

      {showEvaluationsModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-zinc-950 border border-amber-500/30 p-6 rounded-[2rem] w-full max-w-lg space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <FolderOpen className="text-amber-500" size={20} />
                <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest">Fichas em Andamento (Equipe)</h3>
              </div>
              <button onClick={() => setShowEvaluationsModal(false)} className="text-slate-500 hover:text-white"><X size={18}/></button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {Object.keys(activeEvaluationsList).length === 0 ? (
                <p className="text-center text-[10px] text-slate-600 uppercase py-8 font-bold">Nenhuma outra ficha aberta no momento.</p>
              ) : (
                Object.entries(activeEvaluationsList).map(([id, info]) => (
                  <div key={id} className="bg-zinc-900/60 border border-white/5 rounded-xl p-3 flex items-center justify-between hover:border-amber-500/30 transition-all">
                    <div>
                      <span className="text-[8px] font-mono text-amber-500 font-black block">SALA: {id}</span>
                      <h4 className="text-xs font-bold text-white uppercase mt-0.5">{info.candidateName}</h4>
                      <span className="text-[7px] text-slate-500 uppercase">Atualizado às {info.updatedAt}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSessionId(id);
                          setShowEvaluationsModal(false);
                          setActiveTab('evaluation');
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[9px] tracking-wider rounded-lg transition-all shadow-md"
                      >
                        Aceder Ficha
                      </button>
                      <button 
                        onClick={(e) => handleDeleteActiveSession(id, e)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg transition-all"
                        title="Apagar Ficha"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-white/5 flex gap-3">
              <button 
                onClick={() => {
                  setShowEvaluationsModal(false);
                  handleCreateNewBlankSheet();
                }} 
                className="w-full py-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Criar Nova Ficha em Branco
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-amber-500/30 p-8 rounded-[2rem] w-full max-w-xs space-y-6 shadow-2xl">
            <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Controles do Sistema</h3>
            <button onClick={resetEval} className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all">Zerar Ficha Atual</button>
            <button onClick={handleLogout} className="w-full py-3 bg-zinc-800 text-amber-500 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all">Sair do Sistema</button>
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
                <h2 className="text-lg font-military font-bold tracking-widest uppercase">Ficha de Recrutamento GTM</h2>
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

      <header className="px-8 py-3 flex items-center justify-between bg-zinc-950 border-b border-amber-500/20 flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <img src={gtmLogo} alt="GTM Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
          <div>
            <h1 className="text-base font-military font-bold text-amber-500 tracking-widest leading-none uppercase">GTM</h1>
            <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 italic">Grupamento Tático De Motocicletas</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleCreateNewBlankSheet}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse"
          >
            <Plus size={14} className="stroke-[3]" /> Nova Ficha
          </button>

          <nav className="flex bg-black p-1 rounded-xl border border-white/5">
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'}`}>
              <BarChart3 size={12}/> Dashboard
            </button>
            <button onClick={() => setActiveTab('evaluation')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'evaluation' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'}`}>
              <FileText size={12}/> Avaliação
            </button>
            <button onClick={() => setActiveTab('protocols')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'protocols' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'}`}>
              <HelpCircle size={12}/> Perguntas
            </button>
            <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:text-white'}`}>
              <History size={12}/> Histórico
            </button>
          </nav>
        </div>

        <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-amber-500 transition-all">
          <Settings className="w-4 h-4" />
        </button>
      </header>

      <main className="flex-1 overflow-hidden p-4 bg-[radial-gradient(circle_at_center,_#1f1f23_0%,_#09090b_100%)] relative">
        {activeTab === 'dashboard' && (
          <div className="h-full max-w-6xl mx-auto flex flex-col gap-5 overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Avaliados</span>
                  <div className="text-3xl font-black text-white mt-1">{stats.total}</div>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500"><Users size={20} /></div>
              </div>
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Taxa de Aprovação</span>
                  <div className="text-3xl font-black text-green-500 mt-1">{stats.rate}%</div>
                </div>
                <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20 text-green-500"><TrendingUp size={20} /></div>
              </div>
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Média Geral</span>
                  <div className="text-3xl font-black text-amber-500 mt-1">{stats.avgScore}</div>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500"><Target size={20} /></div>
              </div>
              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reprovações</span>
                  <div className="text-3xl font-black text-red-500 mt-1">{stats.rejected}</div>
                </div>
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-500"><AlertTriangle size={20} /></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 bg-zinc-900/40 border border-white/5 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest">Desempenho dos Recrutamentos</h3>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">Comparativo de aprovações por volume</p>
                  </div>
                  <div className="flex items-center gap-4 text-[9px] font-bold">
                    <span className="flex items-center gap-1 text-green-500"><span className="w-2 h-2 rounded-full bg-green-500"></span> Aprovados ({stats.approved})</span>
                    <span className="flex items-center gap-1 text-red-500"><span className="w-2 h-2 rounded-full bg-red-500"></span> Reprovados ({stats.rejected})</span>
                  </div>
                </div>

                <div className="h-48 flex items-end justify-between gap-4 pt-6 px-4 border-b border-white/5">
                  {['SET', 'OUT', 'NOV', 'DEZ'].map((month, idx) => {
                    const approvedHeight = idx === 2 ? (stats.approved ? Math.min(stats.approved * 20, 100) : 40) : (idx + 1) * 20;
                    const rejectedHeight = idx === 2 ? (stats.rejected ? Math.min(stats.rejected * 20, 80) : 20) : (idx + 1) * 10;
                    return (
                      <div key={month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <div className="w-full flex items-end justify-center gap-1.5 h-full">
                          <div className="w-3 bg-green-500/80 rounded-t-sm transition-all duration-500 hover:bg-green-400" style={{ height: `${approvedHeight}%` }}></div>
                          <div className="w-3 bg-red-500/80 rounded-t-sm transition-all duration-500 hover:bg-red-400" style={{ height: `${rejectedHeight}%` }}></div>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">{month}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Centro de Inteligência GTM</span>
                  <button onClick={() => setActiveTab('evaluation')} className="text-[10px] font-black text-amber-500 hover:underline uppercase tracking-wider flex items-center gap-1">
                    Iniciar Nova Avaliação <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                      <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                        <Award size={14} /> Top Instrutores
                      </h3>
                      <span className="text-[8px] font-bold bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded uppercase">Ranking</span>
                    </div>

                    {topInstructors.length === 0 ? (
                      <p className="text-center text-[10px] text-slate-600 uppercase py-8 font-bold">Nenhuma avaliação realizada ainda.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {topInstructors.map((ins, idx) => (
                          <div key={ins.name} className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${idx === 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-black/40 border-white/5'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] ${idx === 0 ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-slate-400'}`}>
                                {idx === 0 ? <Medal size={12} /> : `#${idx + 1}`}
                              </div>
                              <div>
                                <h4 className="text-[11px] font-bold text-white uppercase leading-none">{ins.name}</h4>
                                <span className="text-[8px] text-slate-500 uppercase tracking-wider mt-1 block">
                                  {ins.count} {ins.count === 1 ? 'Avaliação' : 'Avaliações'}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-black text-green-500">{ins.approved} Aprovados</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button onClick={handleCreateNewBlankSheet} className="w-full py-3 mt-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2">
                    <Plus size={14} /> Abrir Nova Ficha
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6">
              <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest">Últimas Fichas Concluídas</h3>
                <button onClick={() => setActiveTab('history')} className="text-[9px] font-bold text-slate-500 hover:text-amber-500 uppercase tracking-wider">
                  Ver Histórico Completo →
                </button>
              </div>

              {history.length === 0 ? (
                <p className="text-center text-[10px] text-slate-600 uppercase py-6 font-bold">Nenhum registro arquivado recentemente.</p>
              ) : (
                <div className="space-y-2">
                  {history.slice(0, 4).map(item => (
                    <div key={item.id} className="bg-black/40 border border-white/5 rounded-xl p-3 flex items-center justify-between hover:border-amber-500/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${item.finalScore >= item.passingGrade ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {item.finalScore >= item.passingGrade ? <UserCheck size={16}/> : <UserX size={16}/>}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase">{item.state.candidate.name}</h4>
                          <span className="text-[8px] text-slate-500 font-mono uppercase">ID: {item.state.candidate.id} • {item.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className={`text-sm font-black tabular-nums ${item.finalScore >= item.passingGrade ? 'text-green-500' : 'text-red-500'}`}>{item.finalScore.toFixed(1)}</span>
                          <span className="text-[7px] font-bold text-slate-600 block uppercase">Nota</span>
                        </div>
                        <button onClick={() => { setSelectedResult(item); setShowResultModal(true); }} className="p-2 text-slate-400 hover:text-amber-500 bg-white/5 rounded-lg">
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'evaluation' && (
          <div className="h-full max-w-full flex flex-col gap-3 animate-in fade-in duration-500 overflow-hidden">
            
            <div className="bg-zinc-900/60 border border-amber-500/30 rounded-xl px-4 py-2 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Wifi size={14} className="text-green-500 animate-pulse" />
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Sincronização em Tempo Real</span>
                </div>
                <button 
                  onClick={() => setShowEvaluationsModal(true)}
                  className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all"
                >
                  <FolderOpen size={12} /> Ver Fichas Abertas ({Object.keys(activeEvaluationsList).length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase">CÓDIGO DA SALA:</span>
                <input 
                  type="text" 
                  className="bg-black border border-amber-500/40 rounded px-2 py-1 text-center text-amber-500 font-mono text-[10px] font-black uppercase outline-none focus:border-amber-400 w-28" 
                  value={sessionId} 
                  onChange={e => setSessionId(e.target.value.toUpperCase())}
                />
              </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
              <div className="col-span-12 lg:col-span-3 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2">
                <section className="bg-zinc-900/50 border border-amber-500/10 rounded-[1.2rem] p-4 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><Users size={12}/> Instrutores</h3>
                    <button onClick={() => updateStateAndSync({...state, instructors: [...state.instructors, {id:'', name:''}]})} className="p-1 bg-amber-500/10 text-amber-500 rounded-md hover:bg-amber-500/20"><Plus size={10}/></button>
                  </div>
                  {state.instructors.map((ins, idx) => (
                    <div key={idx} className="space-y-1 group relative">
                      <input placeholder="NOME INSTRUTOR" className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-[10px] uppercase font-bold focus:border-amber-500 outline-none" value={ins.name} onChange={e => {
                        const n = [...state.instructors]; n[idx].name = e.target.value; updateStateAndSync({...state, instructors: n});
                      }} />
                      <input placeholder="ID" className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-[10px] font-bold focus:border-amber-500 outline-none" value={ins.id} onChange={e => {
                        const n = [...state.instructors]; n[idx].id = e.target.value; updateStateAndSync({...state, instructors: n});
                      }} />
                      {state.instructors.length > 1 && (
                        <button onClick={() => updateStateAndSync({...state, instructors: state.instructors.filter((_, i) => i !== idx)})} className="absolute top-0 right-0 p-1 text-slate-800 hover:text-red-500 transition-colors"><X size={8}/></button>
                      )}
                    </div>
                  ))}
                </section>

                <section className="bg-zinc-900/50 border border-amber-500/10 rounded-[1.2rem] p-4 space-y-2.5">
                  <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><User size={12}/> Conscrito</h3>
                  <input placeholder="NOME DO CONSRITO" className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-[10px] uppercase font-bold outline-none focus:border-amber-500" value={state.candidate.name} onChange={e => updateStateAndSync({...state, candidate: {...state.candidate, name: e.target.value}})} />
                  <input placeholder="ID / PASSAPORTE" className="w-full bg-black/60 border border-white/5 rounded-lg p-2 text-[10px] font-bold outline-none focus:border-amber-500" value={state.candidate.id} onChange={e => updateStateAndSync({...state, candidate: {...state.candidate, id: e.target.value}})} />
                </section>

                <section className="bg-zinc-900/50 border border-amber-500/20 rounded-[1.2rem] p-4 flex flex-col gap-2.5 mt-auto">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Nota Atual</span>
                      <div className="text-3xl font-sans font-black text-amber-500 tracking-tighter">{finalScore.toFixed(1)}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Média</span>
                      <input type="number" step="0.5" className="w-12 bg-black border border-amber-500/20 rounded-lg p-1 text-center text-amber-500 text-[10px] font-bold outline-none" value={passingGrade} onChange={e => setPassingGrade(parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>

                  <div className={`w-full py-1.5 rounded-lg border text-center font-black text-[8px] tracking-[0.2em] ${finalScore >= passingGrade ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                    {finalScore >= passingGrade ? 'APROVADO' : 'REPROVADO'}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button onClick={handleSaveOnly} disabled={isSaving} className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-500 border border-amber-500/30 rounded-xl font-black uppercase text-[8px] tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md">
                      {isSaving ? <Loader2 className="animate-spin" size={10}/> : <Save size={12}/>}
                      Salvar Ficha
                    </button>
                    <button onClick={handleFinish} disabled={isFinishing} className="py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-black uppercase text-[8px] tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10">
                      {isFinishing ? <Loader2 className="animate-spin" size={10}/> : <Shield size={12}/>}
                      Finalizar
                    </button>
                  </div>
                </section>
              </div>

              <div className="col-span-12 lg:col-span-4 flex flex-col gap-4 overflow-hidden">
                <section className="bg-zinc-900/30 border border-white/5 rounded-[1.5rem] p-5 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><MapPin size={14}/> CIRCUITO DE RAMPAS</h3>
                    <button onClick={() => updateStateAndSync({...state, ramps: [...state.ramps, {uid:Math.random().toString(), name:'', score:0}]})} className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500/20 transition-all"><Plus size={12}/></button>
                  </div>
                  <div className="space-y-1.5">
                    {state.ramps.map((ramp, idx) => (
                      <div key={ramp.uid} className="flex gap-2 items-center bg-black/60 border border-white/5 rounded-xl p-2.5 group hover:border-amber-500/30 transition-all">
                        <input placeholder="TESTE DE RAMPA" className="flex-1 bg-transparent text-[8px] font-black uppercase outline-none text-slate-300" value={ramp.name} onChange={e => {
                          const n = [...state.ramps]; n[idx].name = e.target.value; updateStateAndSync({...state, ramps: n});
                        }} />
                        
                        <div className="flex items-center gap-1">
                          <button 
                            type="button"
                            onClick={() => {
                              const n = [...state.ramps]; 
                              n[idx].score = 0.6; 
                              updateStateAndSync({...state, ramps: n});
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${ramp.score === 0.6 ? 'bg-green-500 text-black shadow-lg scale-105' : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'}`}
                            title="Acertou (+0,6)"
                          >
                            ✓
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              const n = [...state.ramps]; 
                              n[idx].score = 0.0; 
                              updateStateAndSync({...state, ramps: n});
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${ramp.score === 0.0 ? 'bg-red-500 text-white shadow-lg scale-105' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                            title="Errou (0,0)"
                          >
                            ✕
                          </button>
                        </div>

                        <button onClick={() => updateStateAndSync({...state, ramps: state.ramps.filter(r=>r.uid!==ramp.uid)})} className="text-slate-700 group-hover:text-red-500 transition-colors ml-1"><Trash2 size={10}/></button>
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
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter flex items-center gap-2">{item.icon} {item.label}</span>
                        <span className="text-sm font-black text-amber-500 tabular-nums">{item.score.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 overflow-hidden">
                <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                  <div className="bg-zinc-900/30 border border-white/5 rounded-[1.5rem] p-4 space-y-2.5">
                    <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><Zap size={14}/> TUNEL (Máx 0.5)</h3>
                    
                    <div className="flex items-center justify-between gap-2 bg-black/60 border border-white/5 rounded-lg px-2.5 py-1.5">
                      <InteractiveTimer 
                        value={state.tunnel.time} 
                        onStop={(formatted) => handleTunnelTimeChange(formatted)}
                      />
                      <input 
                        placeholder="00:00" 
                        className="w-full bg-transparent text-[11px] font-black uppercase outline-none text-amber-500 text-right font-mono" 
                        value={state.tunnel.time} 
                        onChange={e => handleTunnelTimeChange(e.target.value)} 
                      />
                    </div>

                    <div className="bg-zinc-950 border border-amber-500/40 rounded-lg p-1.5 flex items-center justify-between px-2.5">
                      <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">NOTA AUTO:</span>
                      <span className="text-sm font-black text-amber-400">{state.tunnel.score.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-white/5 rounded-[1.5rem] p-4 space-y-2.5">
                    <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><Activity size={14}/> MOD. CHINA (Manual)</h3>
                    
                    <div className="flex items-center justify-between gap-2 bg-black/60 border border-white/5 rounded-lg px-2.5 py-1.5">
                      <InteractiveTimer 
                        value={state.modulation.time} 
                        onStop={(formatted) => updateStateAndSync({...state, modulation: {...state.modulation, time: formatted}})}
                      />
                      <input 
                        placeholder="00:00" 
                        className="w-full bg-transparent text-[11px] font-black uppercase outline-none text-amber-500 text-right font-mono" 
                        value={state.modulation.time} 
                        onChange={e => updateStateAndSync({...state, modulation: {...state.modulation, time: e.target.value}})} 
                      />
                    </div>

                    <div className="bg-zinc-950 border border-amber-500/40 rounded-lg p-1.5 flex items-center justify-between px-2.5">
                      <span className="text-[8px] font-black text-amber-600 uppercase tracking-tighter">NOTA:</span>
                      <input type="number" step="0.5" className="flex-1 bg-transparent text-sm font-black outline-none text-amber-400 text-center" value={state.modulation.score || ''} onChange={e => updateStateAndSync({...state, modulation: {...state.modulation, score: parseFloat(e.target.value) || 0}})} />
                    </div>
                  </div>
                </div>

                <section className="bg-zinc-900/30 border border-white/5 rounded-[1.5rem] p-5 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-[9px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2"><ClipboardCheck size={14}/> ACOMPANHAMENTOS (Máx 1.0)</h3>
                    <button onClick={() => updateStateAndSync({...state, tracking: [...state.tracking, {uid:Math.random().toString(), location:'', time:'', score:0}]})} className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500/20 transition-all"><Plus size={12}/></button>
                  </div>
                  <div className="space-y-2.5">
                    {state.tracking.map((track, idx) => (
                      <div key={track.uid} className="bg-black/60 border border-white/5 rounded-xl p-3 flex items-center justify-between group transition-all hover:border-amber-500/30">
                        <div className="flex-1 space-y-1.5">
                          <input placeholder="SETOR / ROTA" className="w-full bg-transparent text-[10px] font-black uppercase outline-none text-slate-400" value={track.location} onChange={e => {
                            const n = [...state.tracking]; n[idx].location = e.target.value; updateStateAndSync({...state, tracking: n});
                          }} />
                          <div className="flex items-center justify-between gap-2">
                            <InteractiveTimer 
                              value={track.time} 
                              onStop={(formatted) => handleTrackingTimeChange(idx, formatted)}
                            />
                            <input placeholder="00:00" className="bg-transparent outline-none text-[11px] text-amber-500 font-mono w-full text-right" value={track.time} onChange={e => handleTrackingTimeChange(idx, e.target.value)} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 border-l border-white/5 pl-3 ml-3">
                          <div className="flex flex-col items-center bg-zinc-950 border border-amber-500/30 rounded py-1.5 px-3 shadow-inner">
                            <span className="text-[7px] font-black text-amber-600 uppercase mb-0.5 tracking-tighter">NOTA</span>
                            <span className="text-lg font-black text-amber-400">{track.score.toFixed(1)}</span>
                          </div>
                          <button onClick={() => updateStateAndSync({...state, tracking: state.tracking.filter(t=>t.uid!==track.uid)})} className="text-slate-700 group-hover:text-red-500 transition-colors"><Trash2 size={12}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'protocols' && (
          <div className="max-w-4xl mx-auto h-full flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden">
            <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8 backdrop-blur-md overflow-hidden flex flex-col h-full shadow-2xl">
              <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20"><HelpCircle className="text-amber-500" size={20}/></div>
                <h2 className="text-2xl font-military font-bold text-white tracking-widest uppercase">Perguntas de Recrutamento GTM</h2>
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
                  <h2 className="text-xl font-military font-bold text-white tracking-widest uppercase">Histórico Operacional GTM</h2>
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
                          <span className="text-slate-600 font-mono">{item.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right pr-6 border-r border-white/5">
                        <span className={`text-xl font-black tabular-nums ${item.finalScore >= item.passingGrade ? 'text-green-500' : 'text-red-500'}`}>{item.finalScore.toFixed(1)}</span>
                        <div className="text-[7px] font-bold text-slate-600 uppercase tracking-widest">Score</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" className="p-2.5 text-slate-400 hover:text-amber-500 transition-colors bg-white/5 rounded-lg border border-white/5" title="Visualizar">
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

      <footer className="px-8 py-1.5 border-t border-white/5 bg-black text-[6px] font-black text-slate-600 uppercase tracking-[0.4em] text-center flex-shrink-0">
        GTM - GRUPAMENTO TÁTICO DE MOTOCICLETAS
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.99); } to { opacity: 1; transform: scale(1); } }
        .animate-in { animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default App;
