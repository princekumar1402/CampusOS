"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import AppShell from "@/components/layout/AppShell";
import { askAssistant } from "@/services/assistant";
import type { AssistantAnswerResponse } from "@/types";
import { Bot, Send, Sparkles, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";

const EXAMPLE_QUESTIONS = [
  "What is the minimum attendance requirement?",
  "How many classes do I need to attend to restore 75% attendance?",
  "How do I report a campus maintenance or Wi-Fi problem?",
  "What are the criteria for student club membership?",
  "What are the guidelines for internship applications?",
];

export default function AssistantPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<AssistantAnswerResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#0f766e] border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm font-medium">Loading Campus AI...</span>
        </div>
      </div>
    );
  }

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await askAssistant(trimmed);
      setResponse(res);
    } catch (err: any) {
      const detail =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "An error occurred while contacting the assistant. Please try again.";
      setErrorMessage(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectExample = (example: string) => {
    setQuestion(example);
    setErrorMessage(null);
  };

  return (
    <AppShell>
      <main className="dashboard">
        <div className="page-intro">
          <div>
            <div className="eyebrow teal-text">Campus Intelligence &amp; RAG</div>
            <h1>CampusOS AI Assistant</h1>
            <p>
              Grounded university guidelines, regulation policies, and institutional intelligence · IIIT Kottayam
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Question Form Card */}
          <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-[9px] shadow-sm space-y-5">
            <div className="flex items-start gap-3">
              <div className="ai-icon">
                <Bot />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Ask a question about campus policies or services
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Responses are verified and retrieved strictly from official university regulations
                  (Attendance, CampusFix, Events, Clubs, Career, Academics).
                </p>
              </div>
            </div>

            {/* Quick Example Questions */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Suggested Prompts
              </span>
              <div className="suggestions">
                {EXAMPLE_QUESTIONS.map((example, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectExample(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Input & Ask Button */}
            <form onSubmit={handleAsk} className="space-y-3 pt-1">
              <div>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. What happens if my attendance drops below 75%?"
                  rows={3}
                  className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3.5 py-2.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-[#0f766e] transition-colors"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[11px] text-muted-foreground">
                  Grounded in official IIIT Kottayam policy documents.
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting || !question.trim()}
                  className="ai-button disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? "Retrieving policy..." : "Ask Campus AI"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-md text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Response Display Card */}
          {response && (
            <div className="p-6 bg-[var(--card)] border border-[#c8e9e5] dark:border-[#214c4b] rounded-[9px] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0f766e]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f766e] dark:text-teal-400">
                    CampusOS Verified Answer
                  </h3>
                </div>
                <span className="status-badge teal">
                  Policy Grounded
                </span>
              </div>

              <div className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                {response.answer}
              </div>

              {/* Citations & Sources */}
              {response.sources && response.sources.length > 0 && (
                <div className="pt-3 border-t border-[var(--border)] space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-[#0f766e]" />
                    Retrieved Policy Sources &amp; Citations:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {response.sources.map((src, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2.5 py-1 rounded bg-[#e6f5f3] dark:bg-[#153a39] text-[#0f766e] dark:text-teal-300 border border-[#b9ded9] dark:border-[#2b5d5a] font-medium"
                      >
                        📄 {src.document}
                        {src.section ? ` · § ${src.section}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
