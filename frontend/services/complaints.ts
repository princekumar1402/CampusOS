/**
 * CampusOS — CampusFix Complaints & Notifications Service Client (Day 4 MVP)
 *
 * Frontend service layer for Complaints and In-App Notifications.
 */
import { get, patch, post } from "@/lib/api-client";
import type {
  Complaint,
  ComplaintCreate,
  ComplaintStatus,
  Notification,
} from "@/types";

// ---------------------------------------------------------------------------
// Complaints Service
// ---------------------------------------------------------------------------

export async function createComplaint(payload: ComplaintCreate): Promise<Complaint> {
  return post<Complaint>("/complaints", payload);
}

export async function fetchMyComplaints(): Promise<Complaint[]> {
  return get<Complaint[]>("/complaints/me");
}

export async function fetchAllComplaints(): Promise<Complaint[]> {
  return get<Complaint[]>("/complaints");
}

export async function fetchComplaint(complaintId: string): Promise<Complaint> {
  return get<Complaint>(`/complaints/${complaintId}`);
}

export async function updateComplaintStatus(
  complaintId: string,
  status: ComplaintStatus
): Promise<Complaint> {
  return patch<Complaint>(`/complaints/${complaintId}/status`, { status });
}

// ---------------------------------------------------------------------------
// Notifications Service
// ---------------------------------------------------------------------------

export async function fetchNotifications(): Promise<Notification[]> {
  return get<Notification[]>("/notifications");
}

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  return patch<Notification>(`/notifications/${notificationId}/read`);
}
