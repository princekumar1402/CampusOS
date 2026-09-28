"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import AppShell from "@/components/layout/AppShell";
import {
  fetchDepartments,
  fetchMyStudentProfile,
  fetchStudentProfiles,
  updateMyStudentProfile,
} from "@/services/academic";
import type { Department, StudentProfile } from "@/types";
import { Users, GraduationCap, Edit, CheckCircle2 } from "lucide-react";

export default function StudentsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [myProfile, setMyProfile] = useState<StudentProfile | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("");

  // Edit My Profile Form State
  const [isEditingMyProfile, setIsEditingMyProfile] = useState(false);
  const [studentIdInput, setStudentIdInput] = useState("");
  const [departmentIdInput, setDepartmentIdInput] = useState("");
  const [programInput, setProgramInput] = useState("B.Tech Computer Science");
  const [batchYearInput, setBatchYearInput] = useState(2026);
  const [cgpaInput, setCgpaInput] = useState<number | "">("");
  const [phoneInput, setPhoneInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, isLoading, router, selectedDeptFilter]);

  const loadData = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const [deptsData, studentsData] = await Promise.all([
        fetchDepartments(),
        fetchStudentProfiles(selectedDeptFilter || undefined),
      ]);
      setDepartments(deptsData);
      setStudents(studentsData);

      // Attempt to load my student profile if user is student
      try {
        const myData = await fetchMyStudentProfile();
        setMyProfile(myData);
        setStudentIdInput(myData.student_id);
        setDepartmentIdInput(myData.department_id || "");
        setProgramInput(myData.program);
        setBatchYearInput(myData.batch_year);
        setCgpaInput(myData.cgpa ?? "");
        setPhoneInput(myData.phone_number || "");
        setBioInput(myData.bio || "");
      } catch {
        // Profile not created yet
      }
    } catch (err: any) {
      setError(err.message || "Failed to load student directory.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaveSuccess(null);
    setIsSaving(true);

    try {
      const updated = await updateMyStudentProfile({
        student_id: studentIdInput,
        department_id: departmentIdInput || undefined,
        program: programInput,
        batch_year: Number(batchYearInput),
        cgpa: cgpaInput !== "" ? Number(cgpaInput) : undefined,
        phone_number: phoneInput || undefined,
        bio: bioInput || undefined,
      });

      setMyProfile(updated);
      setSaveSuccess("Student profile saved successfully!");
      setIsEditingMyProfile(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isFetching) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm font-medium">Loading student directory...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppShell>
      <main className="dashboard">
        <div className="page-intro">
          <div>
            <div className="eyebrow">Academic Records</div>
            <h1>Student Directory &amp; Profiles</h1>
            <p>
              Academic rosters, program enrollments, and student cohorts · IIIT Kottayam
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 mb-4 bg-red-500/10 border border-red-500/30 rounded-md text-red-600 dark:text-red-400 text-xs flex items-center justify-between font-medium">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="cursor-pointer">✕</button>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3.5 mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-between font-medium">
            <span>{saveSuccess}</span>
            <button onClick={() => setSaveSuccess(null)} className="cursor-pointer">✕</button>
          </div>
        )}

        {/* My Student Profile Card / Edit Section (Only shown if user is student) */}
        {user.role === "STUDENT" && (
          <div className="p-5 mb-6 bg-[var(--card)] border border-[var(--border)] rounded-[9px] shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border)]">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>My Student Profile</span>
                </h2>
                <p className="text-xs text-muted-foreground">Manage your personal academic profile</p>
              </div>

              <button
                onClick={() => setIsEditingMyProfile(!isEditingMyProfile)}
                className="px-3 py-1 bg-muted hover:bg-muted/80 text-foreground border border-[var(--border)] rounded-md text-xs font-semibold transition-colors cursor-pointer"
              >
                {isEditingMyProfile ? "Cancel Editing" : myProfile ? "Edit Profile" : "+ Create My Profile"}
              </button>
            </div>

            {isEditingMyProfile ? (
              <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Student Roll / ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026BCS001"
                    value={studentIdInput}
                    onChange={(e) => setStudentIdInput(e.target.value)}
                    className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Department
                  </label>
                  <select
                    value={departmentIdInput}
                    onChange={(e) => setDepartmentIdInput(e.target.value)}
                    className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} — {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Program / Degree *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="B.Tech Computer Science"
                    value={programInput}
                    onChange={(e) => setProgramInput(e.target.value)}
                    className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Batch Year *
                  </label>
                  <input
                    type="number"
                    required
                    value={batchYearInput}
                    onChange={(e) => setBatchYearInput(Number(e.target.value))}
                    className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    CGPA (0.00 - 10.00)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="8.50"
                    value={cgpaInput}
                    onChange={(e) => setCgpaInput(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Bio / Technical Interests
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Passionate about systems programming, machine learning, and web engineering..."
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingMyProfile(false)}
                    className="px-3.5 py-1.5 bg-muted text-muted-foreground hover:text-foreground rounded-md text-xs font-medium transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            ) : myProfile ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 text-xs">
                <div className="p-3 bg-[var(--muted)] rounded-md border border-[var(--border)]">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">Roll ID</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{myProfile.student_id}</span>
                </div>

                <div className="p-3 bg-[var(--muted)] rounded-md border border-[var(--border)]">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">Program &amp; Batch</span>
                  <span className="text-foreground font-medium">{myProfile.program} ({myProfile.batch_year})</span>
                </div>

                <div className="p-3 bg-[var(--muted)] rounded-md border border-[var(--border)]">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">Department</span>
                  <span className="text-foreground font-medium">
                    {myProfile.department ? `${myProfile.department.code} - ${myProfile.department.name}` : "Unassigned"}
                  </span>
                </div>

                <div className="p-3 bg-[var(--muted)] rounded-md border border-[var(--border)]">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">CGPA</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{myProfile.cgpa ? myProfile.cgpa.toFixed(2) : "N/A"}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-xs">
                You have not created your student profile yet. Click &quot;Create My Profile&quot; to configure your batch and roll ID.
              </div>
            )}
          </div>
        )}

        {/* Directory Search & List */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-sm font-bold text-foreground">
              Enrolled Students ({students.length})
            </h2>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Filter:</span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="px-2.5 py-1 bg-[var(--card)] border border-[var(--border)] rounded-md text-xs text-foreground focus:outline-none"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {students.length === 0 ? (
            <div className="p-12 bg-[var(--card)] border border-[var(--border)] rounded-[9px] text-center text-xs text-muted-foreground">
              No student profiles found for the selected department.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((st) => (
                <div
                  key={st.id}
                  className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-[9px] shadow-sm flex flex-col justify-between transition-all hover:border-blue-500/40"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="status-badge blue font-mono font-bold">
                        {st.student_id}
                      </span>
                      {st.department && (
                        <span className="status-badge slate">
                          {st.department.code}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {st.user.full_name}
                      </h3>
                      <p className="text-xs text-muted-foreground">{st.user.email}</p>
                    </div>

                    <div className="pt-1 space-y-0.5 text-xs text-muted-foreground">
                      <div><strong className="text-foreground">Program:</strong> {st.program}</div>
                      <div><strong className="text-foreground">Batch:</strong> Class of {st.batch_year}</div>
                      {st.cgpa && (
                        <div><strong className="text-foreground">CGPA:</strong> <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{st.cgpa.toFixed(2)}</span></div>
                      )}
                    </div>

                    {st.bio && (
                      <p className="text-xs text-muted-foreground italic pt-1 line-clamp-2">
                        &quot;{st.bio}&quot;
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border)] text-[10px] text-muted-foreground flex justify-between">
                    <span>IIIT Kottayam Student</span>
                    <span className="text-blue-600 font-medium">Active</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
