"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  fetchDepartments,
  fetchMyStudentProfile,
  fetchStudentProfiles,
  updateMyStudentProfile,
} from "@/services/academic";
import type { Department, StudentProfile } from "@/types";

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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading student directory...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        {/* Header Navigation */}
        <header className="flex justify-between items-center bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 px-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold flex items-center justify-center hover:scale-105 transition-transform">
              COS
            </Link>
            <div>
              <h1 className="font-semibold text-white tracking-wide">Student Profiles & Directory</h1>
              <p className="text-xs text-slate-400">Campus Student Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium border border-slate-700 transition-all"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </header>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
            <span>✅</span>
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* My Student Profile Card / Edit Section */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>🎓</span>
                <span>My Student Profile</span>
              </h2>
              <p className="text-xs text-slate-400">Manage your personal academic profile</p>
            </div>

            <button
              onClick={() => setIsEditingMyProfile(!isEditingMyProfile)}
              className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all"
            >
              {isEditingMyProfile ? "Cancel Editing" : myProfile ? "Edit Profile" : "+ Create My Profile"}
            </button>
          </div>

          {isEditingMyProfile ? (
            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Student Roll / ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="STU-2026-001"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Department
                </label>
                <select
                  value={departmentIdInput}
                  onChange={(e) => setDepartmentIdInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
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
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Program / Degree
                </label>
                <input
                  type="text"
                  required
                  placeholder="B.Tech Computer Science"
                  value={programInput}
                  onChange={(e) => setProgramInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Batch Year
                </label>
                <input
                  type="number"
                  required
                  value={batchYearInput}
                  onChange={(e) => setBatchYearInput(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  CGPA (0.00 - 10.00)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="3.85"
                  value={cgpaInput}
                  onChange={(e) => setCgpaInput(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 019-2834"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Bio / Interests
                </label>
                <textarea
                  rows={2}
                  placeholder="Tell campus peers about your technical interests..."
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingMyProfile(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-500/25"
                >
                  {isSaving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          ) : myProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 uppercase font-semibold block mb-1">Student Roll ID</span>
                <span className="font-mono text-indigo-400 font-bold">{myProfile.student_id}</span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 uppercase font-semibold block mb-1">Program & Batch</span>
                <span className="text-white font-medium">{myProfile.program} ({myProfile.batch_year})</span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 uppercase font-semibold block mb-1">Department</span>
                <span className="text-purple-300 font-medium">
                  {myProfile.department ? `${myProfile.department.code} - ${myProfile.department.name}` : "Unassigned"}
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 uppercase font-semibold block mb-1">CGPA</span>
                <span className="text-emerald-400 font-bold">{myProfile.cgpa ? myProfile.cgpa.toFixed(2) : "N/A"}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-sm">
              You haven&apos;t created your student profile yet. Click &quot;Create My Profile&quot; above to get started.
            </div>
          )}
        </div>

        {/* Directory Search & List */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Student Directory ({students.length})
            </h2>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filter Department:</span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
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
            <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-2xl text-center text-slate-400">
              No student profiles found for the selected criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((st) => (
                <div
                  key={st.id}
                  className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl transition-all shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-lg text-xs font-mono font-bold">
                        {st.student_id}
                      </span>
                      {st.department && (
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded text-[10px] font-bold">
                          {st.department.code}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white">
                      {st.user.full_name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{st.user.email}</p>

                    <div className="mt-3 space-y-1 text-xs text-slate-300">
                      <div><strong className="text-slate-500">Program:</strong> {st.program}</div>
                      <div><strong className="text-slate-500">Batch:</strong> Class of {st.batch_year}</div>
                      {st.cgpa && (
                        <div><strong className="text-slate-500">CGPA:</strong> <span className="text-emerald-400 font-semibold">{st.cgpa.toFixed(2)}</span></div>
                      )}
                    </div>

                    {st.bio && (
                      <p className="text-xs text-slate-400 italic mt-3 line-clamp-2">
                        &quot;{st.bio}&quot;
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
                    <span>Registered Student</span>
                    <span className="text-indigo-400">Verified</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
