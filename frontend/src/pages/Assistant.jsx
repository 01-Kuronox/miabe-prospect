import { useState, useRef, useEffect } from "react";
import { Sparkles, SendHorizontal, Bot } from "lucide-react";
import { api } from "../api";
import { BRAND } from "../brand";

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
      text: `Bonjour, je suis l'assistant IA de ${BRAND.name}. Demandez-moi vos prospects prioritaires, vos relances du jour, ou une analyse.`,
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

  // Sur téléphone, la barre du haut occupe 57 px : sans cette soustraction,
  // le champ de saisie tomberait sous le bas de l'écran.
  return (
    <div className="mx-auto flex h-[calc(100dvh-57px)] max-w-3xl flex-col p-4 sm:p-6 lg:h-screen lg:p-10">
      <div className="mb-5 flex items-start gap-3">
        <span
          className="icon-chip h-10 w-10"
          style={{
            backgroundColor: "var(--tint-violet-bg)",
            color: "var(--tint-violet-fg)",
          }}
        >
          <Sparkles size={19} strokeWidth={2.1} />
        </span>
        <div>
          <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-[var(--color-brand-blue)]">
            Assistant IA
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Posez une question sur vos prospects, vos relances, ou demandez une analyse.
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => send(s)}
            className="rounded-full border border-[var(--border-soft)] bg-white px-3.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-[var(--color-brand-blue)]/30 hover:text-[var(--color-brand-blue)]"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="card mb-4 flex-1 space-y-4 overflow-y-auto p-5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-end gap-2.5 ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.role === "assistant" && (
              <span
                className="icon-chip mb-0.5 h-8 w-8"
                style={{
                  backgroundColor: "var(--tint-violet-bg)",
                  color: "var(--tint-violet-fg)",
                }}
              >
                <Bot size={16} strokeWidth={2.1} />
              </span>
            )}
            <div
              className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-md bg-[var(--color-brand-blue)] text-white"
                  : "rounded-bl-md bg-[var(--surface-muted)] text-slate-700"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2.5">
            <span
              className="icon-chip mb-0.5 h-8 w-8"
              style={{
                backgroundColor: "var(--tint-violet-bg)",
                color: "var(--tint-violet-fg)",
              }}
            >
              <Bot size={16} strokeWidth={2.1} />
            </span>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-[var(--surface-muted)] px-4 py-3">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
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
          placeholder="Écrivez votre question…"
          className="flex-1 rounded-xl border border-[var(--border-soft)] bg-white px-4 py-3 text-sm placeholder:text-slate-400 focus:border-[var(--color-brand-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-blue)]/15"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-brand-blue)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-blue-light)] disabled:opacity-40"
        >
          <SendHorizontal size={16} strokeWidth={2.2} />
          Envoyer
        </button>
      </form>
    </div>
  );
}
