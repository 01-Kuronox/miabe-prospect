import { useState, useRef, useEffect } from "react";
import { api } from "../api";

const SUGGESTIONS = [
  "Quels sont mes prospects prioritaires ?",
  "Quels prospects dois-je relancer aujourd'hui ?",
  "Analyse le prospect 1",
  "Génère un message pour le prospect 1",
];

export default function Assistant() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Bonjour 👋 Je suis l'assistant IA de ProspectAI. Demande-moi tes prospects prioritaires, tes relances du jour, ou une analyse.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const extractProspectId = (text) => {
    const match = text.match(/prospect\s*(?:id\s*)?#?(\d+)/i);
    return match ? Number(match[1]) : undefined;
  };

  const send = async (text) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const prospectId = extractProspectId(text);
      const res = await api.chat(text, prospectId);
      setMessages((m) => [...m, { role: "assistant", text: res.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: `Erreur : ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl flex flex-col h-screen">
      <h1 className="text-2xl font-black text-[var(--color-brand-blue)] mb-1">Assistant IA</h1>
      <p className="text-slate-500 text-sm mb-4">
        Pose une question sur tes prospects, tes relances ou demande une analyse.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:border-[var(--color-brand-yellow)] hover:text-[var(--color-brand-blue)]"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl bg-white border border-slate-100 shadow-sm p-5 space-y-4 mb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-[var(--color-brand-blue)] text-white rounded-br-sm"
                  : "bg-[var(--color-brand-gray)] text-slate-700 rounded-bl-sm"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-[var(--color-brand-gray)] px-4 py-2.5 text-sm text-slate-400">
              L'assistant réfléchit…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Écris ta question…"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-yellow)]"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[var(--color-brand-yellow)] px-4 py-2 text-sm font-bold text-[var(--color-brand-blue)] hover:bg-[var(--color-brand-yellow-dark)] disabled:opacity-50"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
