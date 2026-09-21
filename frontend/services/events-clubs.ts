/**
 * CampusOS — Events & Clubs Service Client (Day 3 MVP)
 *
 * Frontend service layer for Events and Clubs endpoints.
 */
import { del, get, post } from "@/lib/api-client";
import type {
  Club,
  ClubCreate,
  ClubMembership,
  Event,
  EventCreate,
  EventRegistration,
} from "@/types";

// ---------------------------------------------------------------------------
// Events Service
// ---------------------------------------------------------------------------

export async function fetchEvents(): Promise<Event[]> {
  return get<Event[]>("/events");
}

export async function fetchEvent(eventId: string): Promise<Event> {
  return get<Event>(`/events/${eventId}`);
}

export async function createEvent(payload: EventCreate): Promise<Event> {
  return post<Event>("/events", payload);
}

export async function registerForEvent(eventId: string): Promise<EventRegistration> {
  return post<EventRegistration>(`/events/${eventId}/register`);
}

export async function unregisterFromEvent(eventId: string): Promise<void> {
  return del<void>(`/events/${eventId}/register`);
}

export async function fetchMyRegistrations(): Promise<EventRegistration[]> {
  return get<EventRegistration[]>("/events/my-registrations");
}

// ---------------------------------------------------------------------------
// Clubs Service
// ---------------------------------------------------------------------------

export async function fetchClubs(): Promise<Club[]> {
  return get<Club[]>("/clubs");
}

export async function fetchClub(clubId: string): Promise<Club> {
  return get<Club>(`/clubs/${clubId}`);
}

export async function createClub(payload: ClubCreate): Promise<Club> {
  return post<Club>("/clubs", payload);
}

export async function joinClub(clubId: string): Promise<ClubMembership> {
  return post<ClubMembership>(`/clubs/${clubId}/join`);
}

export async function leaveClub(clubId: string): Promise<void> {
  return del<void>(`/clubs/${clubId}/join`);
}
