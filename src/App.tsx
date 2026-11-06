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
  Clock,
  LogIn,
  Lock
} from 'lucide-react';
import { RecruitmentState, SavedEvaluation, AIReviewResult } from './types';

// Logo oficial GTM
import gtmLogo from './guarnicao_gtm_cinza_camuflado_fundo_transparente_final.png';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loginPasscode, setLoginPasscode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'evaluation' | 'protocols' | 'history'>('evaluation');
  const [passingGrade, setPassingGrade] = useState<number>(7.0);
  const [showSettings, setShowSettings] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SavedEvaluation | null>(null);
  const [expandedProtocol, setExpandedProtocol] = useState<number | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  
  const [history, setHistory] = useState<SavedEvaluation[]>(() => {
    try {
      const saved = localStorage.getItem('gtm_history_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Erro ao carregar histórico:", e);
      return [];
    }
  });

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

  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    localStorage.setItem('gtm_history_v1', JSON.stringify(history));
  }, [history]);

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticated(true);
  };

  const handleFinish = async () => {
    if (!state.candidate.name || !state.candidate.id) {
      alert("ERRO: Nome e ID do conscrito são obrigatórios.");
      return;
    }

    setIsFinishing(true);
    
    const instantReview: AIReviewResult = {
      summary: "Avaliação registrada no banco de dados operacional.",
      strengths: ["Conformidade operacional", "Execução de manobras"],
      weaknesses: ["Análise detalhada pendente"],
      verdict: isApprovedNow ? 'APROVADO' : 'REPROVADO'
    };

    const newEntry: SavedEvaluation = {
      id: Math.random().toString(36).substring(2, 11),
      date: new Date().toLocaleString('pt-BR'),
      state: JSON.parse(JSON.stringify(state)),
      finalScore,
      review: instantReview,
      passingGrade
    };

    setHistory(prev => [newEntry, ...prev]);
    setIsFinishing(false);
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
  };

  const deleteHistoryEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("CONFIRMAÇÃO OPERACIONAL: Deseja apagar este registro permanentemente do histórico?")) {
      setHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  const resetEval = () => {
    if(window.confirm("Deseja limpar todos os campos da ficha atual?")) {
      setState({
        instructors: [{ id: '', name: '' }],
        candidate: { id: '', name: '' },
        ramps: defaultRamps.map(r => ({ ...r, score: 0 })),
        tunnel: { time: '', score: 0 },
        modulation: { time: '', score: 0 },
        tracking: defaultTracking.map(t => ({ ...t, score: 0, time: '' })),
      });
      setShowSettings(false);
    }
  };

  // --- TELA DE LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black font-sans select-none relative overflow-hidden">
        {/* Background com efeito escuro/gradiente militar */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1c1c1e_0%,_#000000_100%)]"></div>

        <div className="relative z-10 w-full max-w-md p-8 bg-zinc-900/90 border border-amber-500/30 rounded-[2.5rem] shadow-[0_0_80px_rgba(245,158,11,0.1)] backdrop-blur-xl flex flex-col items-center text-center">
          <img 
            src={gtmLogo} 
            alt="GTM Logo" 
            className="w-36 h-36 object-contain mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-in fade-in zoom-in duration-500" 
          />
          
          <h1 className="text-2xl font-military font-bold text-amber-500 tracking-widest uppercase mb-1">
            G.T.M
          </h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">
            Grupamento Tático de Motocicletas
          </p>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500/60" size={16} />
              <input 
                type="password" 
                placeholder="CREDENCIAL DE ACESSO" 
                value={loginPasscode}
                onChange={e => setLoginPasscode(e.target.value)}
                className="w-full bg-black/70 border border-amber-500/20 rounded-xl py-3.5 pl-11 pr-4 text-[11px] font-mono tracking-widest uppercase text-amber-400 placeholder:text-slate-600 focus:border-amber-500 outline-none transition-all text-center"
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[10px] tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <LogIn size={14} /> Entrar no Sistema
            </button>
          </form>

          <span className="mt-8 text-[7px] font-black text-slate-600 uppercase tracking-[0.3em]">
            Sistema Restrito • Controle de Recrutamento
          </span>
        </div>
      </div>
    );
  }

  // --- TELA PRINCIPAL (LOGADO) ---
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
          <div className="bg-zinc-900 border border-amber-500/30 p-8 rounded-[2rem] w-full max-w-xs space-y-6 shadow-2xl">
            <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Controles do Sistema</h3>
            <button onClick={resetEval} className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all">Z
