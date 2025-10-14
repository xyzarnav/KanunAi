"use client";
import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
    role: "user" | "assistant";
    content: string;
};

interface ChatBotProps {
    session: string;
}

export default function ChatBot({ session }: Readonly<ChatBotProps>) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content:
                "Hi! Ask me anything about this case. I'll cite relevant parts from the judgment where possible.",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }, [messages]);

    const send = async () => {
        const question = input.trim();
        if (!question || loading) return;
        setInput("");
        setMessages((m) => [...m, { role: "user", content: question }]);
        setLoading(true);
        try {
            const resp = await fetch("/api/analysis/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ session, question }),
            });
            if (!resp.ok) {
                const errText = await resp.text();
                // Try to extract answer from error JSON
                let answer = "Sorry, something went wrong.";
                try {
                    const errObj = JSON.parse(errText);
                    // Sometimes error is double-encoded
                    let raw = errObj?.error;
                    if (typeof raw === "string" && raw.startsWith("{")) {
                        try { raw = JSON.parse(raw); } catch {}
                    }
                    if (raw?.raw) {
                        // Try to extract answer from raw
                        const match = /\{\\?\"answer\\?\":(.+?)\}/.exec(raw.raw);
                        if (match) {
                            let ans = match[1];
                            ans = ans.replace(/^\\?\"|\\?\"$/g, "");
                            ans = ans.replace(/\\n/g, "\n").replace(/\\"/g, '"');
                            answer = ans;
                        }
                    } else if (raw?.answer) {
                        answer = raw.answer;
                    }
                } catch {}
                setMessages((m) => [...m, { role: "assistant", content: answer }]);
                return;
            }
            const data = (await resp.json()) as { answer: string; sources?: string[] };
            setMessages((m) => [...m, { role: "assistant", content: data.answer || "(no answer)" }]);
        } catch (e: any) {
            setMessages((m) => [...m, { role: "assistant", content: `Sorry, something went wrong.` }]);
        } finally {
            setLoading(false);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <div className="h-full flex flex-col bg-gradient-to-b from-gray-900 to-black">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/80">
                <h2 className="text-lg font-semibold text-white">Case Chat</h2>
                <p className="text-xs text-gray-400 mt-0.5">AI-powered legal case analysis</p>
            </div>

            {/* Messages Container */}
            <div ref={listRef} className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                    {messages.map((m, idx) => {
                        const key = `${m.role}-${idx}-${m.content.slice(0, 20)}`;
                        return (
                            <div key={key} className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Avatar */}
                                <div className="flex-shrink-0">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                            m.role === "user"
                                                ? "bg-yellow-500 text-black"
                                                : "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                                        }`}
                                    >
                                        {m.role === "user" ? "Y" : "AI"}
                                    </div>
                                </div>

                                {/* Message Content */}
                                <div className="flex-1 space-y-2 pt-1">
                                    <div className="text-sm font-semibold text-gray-300">
                                        {m.role === "user" ? "You" : "Assistant"}
                                    </div>
                                    <div className="text-gray-100 leading-relaxed prose prose-invert max-w-none">
                                        {m.role === "assistant" ? (
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                                    ul: ({ children }) => <ul className="mb-3 ml-4 list-disc">{children}</ul>,
                                                    ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal">{children}</ol>,
                                                    li: ({ children }) => <li className="mb-1">{children}</li>,
                                                    code: ({ children }) => (
                                                        <code className="bg-gray-800 px-1.5 py-0.5 rounded text-sm text-yellow-400">
                                                            {children}
                                                        </code>
                                                    ),
                                                }}
                                            >
                                                {m.content}
                                            </ReactMarkdown>
                                        ) : (
                                            <div className="whitespace-pre-wrap">{m.content}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Thinking Animation */}
                    {loading && (
                        <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                    AI
                                </div>
                            </div>
                            <div className="flex-1 pt-1">
                                <div className="text-sm font-semibold text-gray-300 mb-2">Assistant</div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-800/50 bg-gray-900/80 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="flex gap-3 items-end">
                        <div className="flex-1 relative">
                            <input
                                className="w-full bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 outline-none focus:border-yellow-500/50 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-200"
                                placeholder="Ask a question about the case..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={onKeyDown}
                                disabled={loading}
                            />
                        </div>
                        <button
                            onClick={send}
                            disabled={loading || !input.trim()}
                            className="px-5 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-yellow-400 hover:to-yellow-500 transition-all duration-200 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                            </svg>
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        Press Enter to send, Shift + Enter for new line
                    </p>
                </div>
            </div>
        </div>
    );
}