"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { askAssistant } from "@/services/assistant";
import type { AssistantAnswerResponse } from "@/types";

const EXAMPLE_QUESTIONS = [
  "What is the attendance requirement?",
  "How do I report a campus maintenance problem?",
  "How can I apply for an internship?",
  "What is the process for joining a student club?",
  "What are the rules for course registration and academic credits?",
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        {/* Header navigation */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">
                CampusOS AI Assistant
              </h1>
              <p className="text-xs text-slate-400">
                Grounded Campus Policy & Guidelines Assistant
              </p>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-800 transition-all flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Question Form Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Ask a question about campus policies
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Answers are retrieved strictly from official CampusOS documents
              (Attendance, CampusFix, Events/Clubs, Internships, Academics).
            </p>
          </div>

          {/* Quick Example Questions */}
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Example Questions:
            </span>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((example, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectExample(example)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-all text-left"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Input & Ask Button */}
          <form onSubmit={handleAsk} className="space-y-4">
            <div>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What is the attendance requirement?"
                rows={3}
                maxLength={500}
                required
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all resize-none"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1 px-1">
                <span>Keep questions focused on campus policies.</span>
                <span>{question.length}/500</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !question.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Searching Policies...</span>
                  </>
                ) : (
                  <>
                    <span>Ask Assistant</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <div className="space-y-1">
                <p className="font-semibold">Unable to complete request</p>
                <p className="text-xs text-rose-400">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Answer Output Card */}
        {response && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs uppercase tracking-wider text-indigo-400 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                Grounded Answer
              </span>
              <span className="text-xs text-slate-500 font-mono">
                CampusOS RAG MVP
              </span>
            </div>

            <div className="text-sm md:text-base leading-relaxed text-slate-200 whitespace-pre-line bg-slate-950/40 p-5 rounded-2xl border border-slate-800/60">
              {response.answer}
            </div>

            {/* Sources section */}
            <div className="pt-2">
              <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
                Source Policy Documents:
              </span>
              {response.sources && response.sources.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {response.sources.map((src, idx) => (
                    <div
                      key={idx}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 text-xs flex items-center gap-2 shadow-sm"
                    >
                      <span className="text-sm">📄</span>
                      <span className="font-medium text-white">
                        {src.document}
                      </span>
                      {src.section && (
                        <span className="text-slate-400 text-xs border-l border-slate-700 pl-2">
                          {src.section}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  No verified campus policy sources cited.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
