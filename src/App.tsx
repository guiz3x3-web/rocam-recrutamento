import React, { useState, useEffect } from 'react';
import { Shield, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [logado, setLogado] = useState(sessionStorage.getItem("logado") === "true");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [nome, setNome] = useState("");
  const [nota, setNota] = useState(0);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (logado) {
      const q = query(collection(db, "evaluations"), orderBy("date", "desc"));
      return onSnapshot(q, (snapshot) => {
        setHistorico(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      });
    }
  }, [logado]);

  const salvar = async () => {
    if (!nome) return alert("Digite o nome!");
    setLoading(true);
    try {
      await addDoc(collection(db, "evaluations"), {
        nome, nota, date: new Date().toLocaleString('pt-BR'),
        status: nota >= 7 ? "APROVADO" : "REPROVADO"
      });
      alert("Salvo com sucesso!");
      setNome(""); setNota(0);
    } catch (e) { alert("Erro ao salvar!"); }
    setLoading(false);
  };

  if (!logado) {
    return (
      <div style={{ height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#111', padding: '40px', borderRadius: '20px', border: '1px solid #333', textAlign: 'center' }}>
          <Shield color="#f59e0b" size={48} style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#f59e0b' }}>ROCAM LOGIN</h2>
          <input placeholder="Usuário" style={{ display: 'block', width: '250px', margin: '10px 0', padding: '12px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '8px' }} onChange={e => setUser(e.target.value)} />
          <input type="password" placeholder="Senha" style={{ display: 'block', width: '250px', margin: '10px 0', padding: '12px', background: '#000', border: '1px solid #333', color: '#fff', borderRadius: '8px' }} onChange={e => setPass(e.target.value)} />
          <button onClick={() => { if(user === "instrutor" && pass === "rocam2026") { sessionStorage.setItem("logado", "true"); setLogado(true); } }} style={{ width: '100%', padding: '12px', background: '#f59e0b', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px' }}>ENTRAR</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#ccc', fontFamily: 'sans-serif', padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1 style={{ color: '#f59e0b', fontSize: '20px' }}>ROCAM SISTEMA</h1>
        <button onClick={() => { sessionStorage.clear(); window.location.reload(); }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>SAIR</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px', border: '1px solid #1a1a1a' }}>
          <h3 style={{ color: '#f59e0b', fontSize: '12px' }}>NOVA AVALIAÇÃO</h3>
          <input placeholder="NOME DO CONSCRITO" value={nome} style={{ width: '100%', padding: '10px', margin: '10px 0', background: '#000', border: '1px solid #222', color: '#fff' }} onChange={e => setNome(e.target.value.toUpperCase())} />
          <p>NOTA: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{nota}</span></p>
          <input type="range" min="0" max="10" step="0.5" value={nota} style={{ width: '100%' }} onChange={e => setNota(parseFloat(e.target.value))} />
          <button onClick={salvar} style={{ width: '100%', padding: '15px', background: '#f59e0b', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '10px', marginTop: '20px', cursor: 'pointer' }}>
            {loading ? <Loader2 className="animate-spin" /> : "SALVAR NO BANCO DE DADOS"}
          </button>
        </div>

        <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px', border: '1px solid #1a1a1a' }}>
          <h3 style={{ color: '#f59e0b', fontSize: '12px' }}>HISTÓRICO</h3>
          {historico.map(h => (
            <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #111', alignItems: 'center' }}>
              <div><div style={{ fontSize: '12px' }}>{h.nome}</div></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ color: h.nota >= 7 ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>{h.nota}</span>
                <button onClick={async () => await deleteDoc(doc(db, "evaluations", h.id))} style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer' }}><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
