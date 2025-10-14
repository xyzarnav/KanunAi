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
				"Hi! Ask me anything about this case. I’ll cite relevant parts from the judgment where possible.",
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
		<div className="h-full flex flex-col rounded-xl border border-white/10 bg-white/5 overflow-hidden">
			<div className="px-4 py-3 border-b border-white/10 font-semibold">Case Chat</div>
			<div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
						{messages.map((m) => {
							const key = `${m.role}-${m.content.slice(0, 32)}-${m.content.length}`;
							return (
							<div key={key} className={`max-w-[85%] ${m.role === "user" ? "ml-auto text-right" : "mr-auto"}`}>
						<div
							className={`$${
								m.role === "user" ? "bg-yellow-500/20 border-yellow-500/30" : "bg-white/10 border-white/20"
							} border px-3 py-2 rounded-lg whitespace-pre-wrap`}
						>
							{m.role === "assistant" ? (
								<ReactMarkdown>{m.content}</ReactMarkdown>
							) : (
								m.content
							)}
						</div>
					</div>
						);})}
				{loading && (
					<div className="text-sm text-gray-400">Thinking…</div>
				)}
			</div>
			<div className="p-3 border-t border-white/10 flex gap-2">
				<input
					className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-yellow-500"
					placeholder="Ask a question about the analyzed case…"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={onKeyDown}
				/>
				<button
					onClick={send}
					disabled={loading || !input.trim()}
					className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-medium disabled:opacity-50"
				>
					Send
				</button>
			</div>
		</div>
	);
}
