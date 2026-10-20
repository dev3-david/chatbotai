"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatResponse } from "@/app/api/chat/route";

interface Message {
  id: number;
  role: "user" | "bot";
  text: string;
}

export function Chat() {
  const t = useTranslations("Chat");
  const [messages, setMessages] = useState<Message[]>([{ id: 0, role: "bot", text: t("welcome") }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    setMessages((m) => [...m, { id: Date.now(), role: "user", text: question }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = (await res.json()) as ChatResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setMessages((m) => [...m, { id: Date.now() + 1, role: "bot", text: data.answer ?? t("noAnswer") }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, role: "bot", text: t("error", { message: (err as Error).message }) },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ minHeight: 360 }}>
        {messages.map((msg) => (
          <div key={msg.id} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={
                msg.role === "user"
                  ? "max-w-[80%] rounded-2xl rounded-ee-sm bg-zinc-900 px-4 py-2 text-sm text-white"
                  : "max-w-[80%] rounded-2xl rounded-es-sm bg-blue-50 px-4 py-2 text-sm text-zinc-900"
              }
            >
              <p className="whitespace-pre-wrap" dir="auto">
                {msg.text}
              </p>
            </div>
          </div>
        ))}
        {loading && <p className="text-xs text-zinc-400">{t("thinking")}</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="flex gap-2 border-t border-zinc-200 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("placeholder")}
          dir="auto"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500"
          maxLength={500}
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {t("send")}
        </button>
      </form>
    </div>
  );
}
