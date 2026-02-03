
import { GoogleGenAI, Type } from "@google/genai";
import { RecruitmentState } from "../types";

export const getAIReview = async (state: RecruitmentState, finalScore: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const instructorNames = state.instructors.map(i => `${i.name} (ID: ${i.id})`).join(', ');

  const prompt = `
    Analise o desempenho tático de um recruta da ROCAM para os instrutores: ${instructorNames}.
    
    Candidato: ${state.candidate.name} (ID: ${state.candidate.id})
    Nota Final: ${finalScore.toFixed(2)}
    
    Detalhes da Performance:
    - CIRCUITO DE RAMPAS: ${state.ramps.map(r => `${r.name}: ${r.score} pts`).join(' | ')}
    - TUNEL: Tempo: ${state.tunnel.time}, Nota: ${state.tunnel.score}
    - MODULAÇÃO CHINA: Tempo: ${state.modulation.time}, Nota: ${state.modulation.score}
    - ACOMPANHAMENTOS PRATICOS (Incluindo MANSÕES): ${state.tracking.map(t => `${t.location}: ${t.score} pts (Tempo: ${t.time})`).join(' | ')}

    Forneça uma avaliação rigorosa no estilo Militar/RP.
    Retorne um JSON com: summary (resumo tático), strengths (array de pontos fortes), weaknesses (array de pontos a melhorar) e verdict (APROVADO ou REPROVADO).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            verdict: { type: Type.STRING },
          },
          required: ["summary", "strengths", "weaknesses", "verdict"]
        },
      },
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Erro crítico na análise de IA:", error);
    throw error;
  }
};
