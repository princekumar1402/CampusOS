/**
 * CampusOS — Admin Service Client (Day 7 MVP)
 *
 * Frontend service layer for retrieving system aggregate statistics.
 */
import { get } from "@/lib/api-client";
import type { AdminStatsResponse } from "@/types";

export async function fetchAdminStats(): Promise<AdminStatsResponse> {
  return get<AdminStatsResponse>("/admin/stats");
}
