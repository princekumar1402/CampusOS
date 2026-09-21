/**
 * CampusOS — Assistant Service Client (Day 6 MVP)
 *
 * Frontend service layer for querying the Campus AI Assistant RAG endpoint.
 */
import { post } from "@/lib/api-client";
import type { AssistantAnswerResponse } from "@/types";

export interface AssistantQuestionPayload {
  question: string;
}

export async function askAssistant(
  question: string
): Promise<AssistantAnswerResponse> {
  return post<AssistantAnswerResponse>("/assistant/ask", { question });
}
