/**
 * CampusOS — Internship & Career Service Client (Day 5 MVP)
 *
 * Frontend service layer for Internships, Applications, and Skill Overlap.
 */
import { get, post } from "@/lib/api-client";
import type {
  Internship,
  InternshipApplication,
  InternshipCreate,
} from "@/types";

// ---------------------------------------------------------------------------
// Internships Service
// ---------------------------------------------------------------------------

export async function fetchInternships(): Promise<Internship[]> {
  return get<Internship[]>("/internships");
}

export async function fetchInternship(internshipId: string): Promise<Internship> {
  return get<Internship>(`/internships/${internshipId}`);
}

export async function createInternship(payload: InternshipCreate): Promise<Internship> {
  return post<Internship>("/internships", payload);
}

// ---------------------------------------------------------------------------
// Applications Service
// ---------------------------------------------------------------------------

export async function applyToInternship(internshipId: string): Promise<InternshipApplication> {
  return post<InternshipApplication>(`/internships/${internshipId}/apply`);
}

export async function fetchMyApplications(): Promise<InternshipApplication[]> {
  return get<InternshipApplication[]>("/applications/me");
}
