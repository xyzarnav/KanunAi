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

    /**
     * Detects incomplete endings and truncates to the last complete sentence
     * AGGRESSIVE APPROACH: Find last sentence and remove ANYTHING that looks like JSON
     */
    const ensureCompleteEnding = (text: string): string => {
        if (!text || text.trim().length === 0) return text;

        let trimmed = text.trim();
        
        // FIRST: Aggressively remove JSON patterns (try multiple passes)
        // Pattern 1: Remove ", "sources": [...]" anywhere in the text
        trimmed = trimmed.replace(/[,\s]*["']sources["']?\s*:\s*\[[^\]]*\]/gi, '');
        // Pattern 2: Remove any trailing quotes, commas, JSON structures
        trimmed = trimmed.replace(/["']\s*,\s*["']sources.*$/i, '');
        trimmed = trimmed.replace(/[,;\s]*["']sources.*$/i, '');
        trimmed = trimmed.replace(/\[.*?\]\s*$/g, '');
        trimmed = trimmed.replace(/\{.*?\}\s*$/g, '');
        trimmed = trimmed.replace(/["'],\s*\{.*$/i, '');
        // Pattern 3: Remove any content after quote-comma-quote pattern
        trimmed = trimmed.replace(/["']\s*,\s*["'].*$/i, '');
        trimmed = trimmed.trim();
        
        // SECOND: Find the last sentence-ending punctuation
        // Check for period/question/exclamation followed by space OR directly by comma/quote (JSON)
        const lastPeriodSpace = trimmed.lastIndexOf('. ');
        const lastQuestionSpace = trimmed.lastIndexOf('? ');
        const lastExclamationSpace = trimmed.lastIndexOf('! ');
        const lastPeriodNewline = trimmed.lastIndexOf('.\n');
        const lastQuestionNewline = trimmed.lastIndexOf('?\n');
        const lastExclamationNewline = trimmed.lastIndexOf('!\n');
        
        // Also check for period directly followed by comma/quote (no space - JSON case)
        const lastPeriodComma = trimmed.lastIndexOf('.,');
        const lastPeriodQuote = trimmed.lastIndexOf('."');
        const lastPeriodQuoteSingle = trimmed.lastIndexOf(".'");
        
        let lastPunct = Math.max(
            lastPeriodSpace, lastQuestionSpace, lastExclamationSpace,
            lastPeriodNewline, lastQuestionNewline, lastExclamationNewline,
            lastPeriodComma, lastPeriodQuote, lastPeriodQuoteSingle
        );
        
        // If we found a sentence boundary
        if (lastPunct >= 0 && lastPunct > trimmed.length * 0.15) {
            // Check what character follows the punctuation
            const charAfter = trimmed.charAt(lastPunct + 1);
            
            // If it's a space or newline (normal sentence end)
            if (charAfter === ' ' || charAfter === '\n') {
                const afterPunct = trimmed.substring(lastPunct + 2).trim();
                if (!afterPunct || afterPunct.length === 0) {
                    return trimmed.substring(0, lastPunct + 1).trim();
                }
                // Check if JSON follows
                if (afterPunct.match(/^[,;\s]*["']/) ||
                    afterPunct.match(/["']sources/i) ||
                    afterPunct.match(/[:\[\{]/) ||
                    (afterPunct.length < 30 && afterPunct.match(/["',;]/))) {
                    return trimmed.substring(0, lastPunct + 1).trim();
                }
            }
            // If it's a comma or quote directly after (JSON case: ".", "sources" or ".", "sources")
            else if (charAfter === ',' || charAfter === '"' || charAfter === "'") {
                // Definitely JSON - truncate immediately
                return trimmed.substring(0, lastPunct + 1).trim();
            }
        }
        
        // Fallback: Find any punctuation and check what follows
        const lastPeriod = trimmed.lastIndexOf('.');
        const lastQuestion = trimmed.lastIndexOf('?');
        const lastExclamation = trimmed.lastIndexOf('!');
        lastPunct = Math.max(lastPeriod, lastQuestion, lastExclamation);
        
        if (lastPunct >= 0 && lastPunct > trimmed.length * 0.15) {
            const afterPunct = trimmed.substring(lastPunct + 1).trim();
            // If what comes after is suspicious (JSON-like), truncate
            if (afterPunct.length > 0 && 
                (afterPunct.match(/^[,;\s]*["']/) ||
                 afterPunct.match(/["']sources/i) ||
                 afterPunct.match(/[:\[\{]/) ||
                 (afterPunct.length < 30 && afterPunct.match(/["',;]/)))) {
                return trimmed.substring(0, lastPunct + 1).trim();
            }
        }
        
        // THIRD: Final cleanup - remove any remaining JSON-looking content
        trimmed = trimmed.replace(/[,\s]*["']sources.*$/i, '');
        trimmed = trimmed.replace(/["']\s*,\s*["'].*$/i, '');
        trimmed = trimmed.replace(/\[.*?\]\s*$/g, '');
        trimmed = trimmed.replace(/\{.*?\}\s*$/g, '');
        trimmed = trimmed.trim();
        
        // FOURTH: Ensure it ends with proper punctuation
        if (trimmed && !/[.!?]$/.test(trimmed)) {
            trimmed = trimmed + '.';
        }

        return trimmed;
    };

    useEffect(() => {
        // Scroll to bottom when messages change or loading state changes
        if (listRef.current) {
            setTimeout(() => {
                listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
            }, 100);
        }
    }, [messages, loading]);

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
                // Ensure the answer ends at a complete sentence
                const cleanAnswer = ensureCompleteEnding(answer);
                setMessages((m) => [...m, { role: "assistant", content: cleanAnswer }]);
                return;
            }
            const data = (await resp.json()) as { answer: string; sources?: string[] };
            // Ensure the answer ends at a complete sentence, not mid-thought
            const cleanAnswer = ensureCompleteEnding(data.answer || "(no answer)");
            setMessages((m) => [...m, { role: "assistant", content: cleanAnswer }]);
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
        <div className="flex flex-col bg-gray-900 rounded-2xl" style={{ height: '850px', maxHeight: '95vh' }}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex-shrink-0">
                <h2 className="text-lg font-semibold text-white">Case Chat</h2>
                <p className="text-xs text-gray-500 mt-0.5">AI-powered legal case analysis</p>
            </div>

            {/* Messages Container with Custom Scrollbar */}
            <div 
                ref={listRef} 
                className="flex-1 overflow-y-auto scrollbar-thin min-h-0"
                style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#4B5563 #1F2937'
                }}
            >
                <style jsx>{`
                    .scrollbar-thin::-webkit-scrollbar {
                        width: 6px;
                    }
                    .scrollbar-thin::-webkit-scrollbar-track {
                        background: #1F2937;
                    }
                    .scrollbar-thin::-webkit-scrollbar-thumb {
                        background: #4B5563;
                        border-radius: 3px;
                    }
                    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                        background: #6B7280;
                    }
                `}</style>
                <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
                    {messages.map((m, idx) => {
                        const key = `${m.role}-${idx}-${m.content.slice(0, 20)}`;
                        
                        if (m.role === "assistant") {
                            return (
                                <div key={key} className="flex justify-start animate-in fade-in slide-in-from-left-4 duration-500">
                                    <div className="flex gap-3 max-w-[80%]">
                                        {/* AI Avatar */}
                                        <div className="flex-shrink-0 pt-1">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                                kAI
                                            </div>
                                        </div>
                                        {/* AI Message Bubble */}
                                        <div className="flex-1">
                                            <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg">
                                                <div className="text-gray-100 leading-relaxed prose prose-invert prose-sm max-w-none">
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                            ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                                                            ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                                                            li: ({ children }) => <li className="mb-1">{children}</li>,
                                                            code: ({ children }) => (
                                                                <code className="bg-gray-900 px-1.5 py-0.5 rounded text-sm text-yellow-400">
                                                                    {children}
                                                                </code>
                                                            ),
                                                        }}
                                                    >
                                                        {m.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        } else {
                            return (
                                <div key={key} className="flex justify-end animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex gap-3 max-w-[80%]">
                                        {/* User Message Bubble */}
                                        <div className="flex-1">
                                            <div className="bg-yellow-600 rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg">
                                                <div className="text-black leading-relaxed whitespace-pre-wrap">
                                                    {m.content}
                                                </div>
                                            </div>
                                        </div>
                                        {/* User Avatar */}
                                        <div className="flex-shrink-0 pt-1">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-yellow-500 text-black">
                                                Y
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                    })}

                    {/* Thinking Animation */}
                    {loading && (
                        <div className="flex justify-start animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="flex gap-3 max-w-[80%]">
                                <div className="flex-shrink-0 pt-1">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                        AI
                                    </div>
                                </div>
                                <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-lg">
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-800 bg-gray-900 flex-shrink-0">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex gap-3 items-end">
                        <div className="flex-1 relative">
                            <input
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all duration-200"
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
                            className="px-5 py-3 rounded-xl bg-yellow-600 text-black font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-yellow-500 transition-all duration-200"
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
                    <p className="text-xs text-gray-600 mt-2 text-center">
                        Press Enter to send
                    </p>
                </div>
            </div>
        </div>
    );
}