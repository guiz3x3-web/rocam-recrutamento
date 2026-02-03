import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Trash2, UserCheck, UserX, Loader2, MapPin, Zap, Activity } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";

// CONFIGURAÇÃO DO SEU FIREBASE
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
  const [aba, setAba] = useState('avaliar');
  const [historico, setHistorico] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [scores, setScores] = useState({
    rampas: [0,0,0,0,0],
    tunel: 0,
    china: 0,
    acompanhamentos: [0,0,0]
  });

  useEffect(() => {
    if (logado) {
      const q = query(collection(db, "evaluations"), orderBy("date", "desc"));
      return onSnapshot(q, (snapshot) => {
        setHistorico(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      });
    }
  }, [logado]);

  const total = useMemo(() => {
    const s1 = scores.rampas.reduce((a, b) => a + b, 0);
    const s2 = scores.acompanhamentos.reduce((a, b) => a + b, 0);
    return s1 + s2 + scores.tunel + scores.china;
  }, [scores]);

  const salvar = async () => {
    if (!nome) return alert("Digite o nome!");
    setLoading(true);
    try {
      await addDoc(collection(db, "evaluations"), {
        nome, nota: total, date: new Date().toLocaleString('pt-BR'),
        status: total >= 7 ? "APROVADO" : "REPROVADO"
      });
      alert("Avaliação salva!");
      window.location.reload();
    } catch (e) { alert("Erro ao salvar!"); }
    setLoading(false);
  };

  if (!logado) {
    return (
      <div style={{ height: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ background: '#0a0a0a', padding: '40px', borderRadius: '20px', border: '1px solid #111', textAlign: 'center' }}>
          <Shield color="#f59e0b" size={48} style={{ marginBottom: '20px' }} />
          <input placeholder="Usuário" style={{ display: 'block', width: '250px', margin: '10px 0', padding: '12px', background: '#000', border: '1px solid #222', color: '#fff' }} onChange={e => setUser(e.target.value)} />
          <input type="password" placeholder="Senha" style={{ display: 'block', width: '250px', margin: '10px 0', padding: '12px', background: '#000', border: '1px solid #222', color: '#fff' }} onChange={e => setPass(e.target.value)} />
          <button onClick={() => { if(user === "instrutor" && pass === "rocam2026") { sessionStorage.setItem("logado", "true"); setLogado(true); } }} style={{ width: '100%', padding: '12px', background: '#f59e0b', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>ENTRAR</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#ccc', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 30px', background: '#050505', borderBottom: '1px solid #111' }}>
        <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>ROCAM SISTEMA</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setAba('avaliar')} style={{ background: aba==='avaliar'?'#f59e0b':'#111', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' }}>AVALIAÇÃO</button>
          <button onClick={() => setAba('historico')} style={{ background: aba==='historico'?'#f59e0b':'#111', border: 'none', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' }}>HISTÓRICO</button>
        </div>
      </header>

      <main style={{ padding: '20px' }}>
        {aba === 'avaliar' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px' }}>
              <p style={{ color: '#f59e0b', fontSize: '10px' }}>CONSCRITO</p>
              <input placeholder="NOME" style={{ width: '90%', padding: '10px', background: '#000', border: '1px solid #222', color: '#fff' }} onChange={e => setNome(e.target.value.toUpperCase())} />
              <div style={{ marginTop: '40px' }}>
                <p>NOTA FINAL</p>
                <h1 style={{ fontSize: '50px', color: '#f59e0b' }}>{total.toFixed(1)}</h1>
                <button onClick={salvar} style={{ width: '100%', padding: '15px', background: '#f59e0b', fontWeight: 'bold', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>SALVAR</button>
              </div>
            </div>
            
            <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px' }}>
              <p style={{ color: '#f59e0b', fontSize: '10px' }}>RAMPAS</p>
              {scores.rampas.map((s, i) => (
                <input key={i} type="number" placeholder={`Rampa ${i+1}`} style={{ width: '90%', margin: '5px 0', padding: '8px', background: '#000', border: '1px solid #222', color: '#fff' }} onChange={e => {
                  const n = [...scores.rampas]; n[i] = parseFloat(e.target.value) || 0; setScores({...scores, rampas: n});
                }} />
              ))}
            </div>

            <div style={{ background: '#0a0a0a', padding: '20px', borderRadius: '15px' }}>
              <p style={{ color: '#f59e0b', fontSize: '10px' }}>CIRCUITOS</p>
              <input type="number" placeholder="Túnel" style={{ width: '90%', margin: '5px 0', padding: '8px', background: '#000', border: '1px solid #222', color: '#fff' }} onChange={e => setScores({...scores, tunel: parseFloat(e.target.value) || 0})} />
              <input type="number" placeholder="China" style={{ width: '90%', margin: '5px 0', padding: '8px', background: '#000', border: '1px solid #222', color: '#fff' }} onChange={e => setScores({...scores, china: parseFloat(e.target.value) || 0})} />
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {historico.map(h => (
              <div key={h.id} style={{ background: '#0a0a0a', padding: '15px', marginBottom: '10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{h.nome}</span>
                <span style={{ color: h.nota >= 7 ? '#22c55e' : '#ef4444', fontWeight: 'bold' }}>{h.nota.toFixed(1)}</span>
                <button onClick={async () => await deleteDoc(doc(db, "evaluations", h.id))} style={{ background: 'none', border: 'none', color: '#333' }}><Trash2 size={16}/></button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
