"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  fetchDepartments,
  fetchFacultyProfiles,
  fetchMyFacultyProfile,
  updateMyFacultyProfile,
} from "@/services/academic";
import type { Department, FacultyProfile } from "@/types";

export default function FacultyPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [facultyList, setFacultyList] = useState<FacultyProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [myProfile, setMyProfile] = useState<FacultyProfile | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("");

  // Edit My Profile Form State
  const [isEditingMyProfile, setIsEditingMyProfile] = useState(false);
  const [employeeIdInput, setEmployeeIdInput] = useState("");
  const [departmentIdInput, setDepartmentIdInput] = useState("");
  const [designationInput, setDesignationInput] = useState("Assistant Professor");
  const [specializationInput, setSpecializationInput] = useState("");
  const [officeInput, setOfficeInput] = useState("");
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
      const [deptsData, facData] = await Promise.all([
        fetchDepartments(),
        fetchFacultyProfiles(selectedDeptFilter || undefined),
      ]);
      setDepartments(deptsData);
      setFacultyList(facData);

      // Attempt to load my faculty profile if faculty user
      try {
        const myData = await fetchMyFacultyProfile();
        setMyProfile(myData);
        setEmployeeIdInput(myData.employee_id);
        setDepartmentIdInput(myData.department_id || "");
        setDesignationInput(myData.designation);
        setSpecializationInput(myData.specialization || "");
        setOfficeInput(myData.office_location || "");
        setPhoneInput(myData.phone_number || "");
        setBioInput(myData.bio || "");
      } catch {
        // Profile not created yet
      }
    } catch (err: any) {
      setError(err.message || "Failed to load faculty directory.");
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
      const updated = await updateMyFacultyProfile({
        employee_id: employeeIdInput,
        department_id: departmentIdInput || undefined,
        designation: designationInput,
        specialization: specializationInput || undefined,
        office_location: officeInput || undefined,
        phone_number: phoneInput || undefined,
        bio: bioInput || undefined,
      });

      setMyProfile(updated);
      setSaveSuccess("Faculty profile saved successfully!");
      setIsEditingMyProfile(false);
      loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update faculty profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isFetching) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading faculty directory...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        {/* Header Navigation */}
        <header className="flex justify-between items-center bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 px-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold flex items-center justify-center hover:scale-105 transition-transform">
              COS
            </Link>
            <div>
              <h1 className="font-semibold text-white tracking-wide">Faculty Profiles & Directory</h1>
              <p className="text-xs text-slate-400">Campus Academic Staff & Professors</p>
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

        {/* My Faculty Profile Card / Edit Section */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>👩‍🏫</span>
                <span>My Faculty Profile</span>
              </h2>
              <p className="text-xs text-slate-400">Manage your professor/academic staff details</p>
            </div>

            <button
              onClick={() => setIsEditingMyProfile(!isEditingMyProfile)}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition-all"
            >
              {isEditingMyProfile ? "Cancel Editing" : myProfile ? "Edit Profile" : "+ Create Faculty Profile"}
            </button>
          </div>

          {isEditingMyProfile ? (
            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="FAC-2026-001"
                  value={employeeIdInput}
                  onChange={(e) => setEmployeeIdInput(e.target.value)}
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
                  Designation / Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Associate Professor"
                  value={designationInput}
                  onChange={(e) => setDesignationInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  placeholder="Distributed Systems, Machine Learning"
                  value={specializationInput}
                  onChange={(e) => setSpecializationInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Office Location
                </label>
                <input
                  type="text"
                  placeholder="Turing Building Room 302"
                  value={officeInput}
                  onChange={(e) => setOfficeInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 019-8821"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Bio / Research Overview
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of research areas, office hours, and courses taught..."
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
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-amber-500/25"
                >
                  {isSaving ? "Saving..." : "Save Faculty Profile"}
                </button>
              </div>
            </form>
          ) : myProfile ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 uppercase font-semibold block mb-1">Employee ID</span>
                <span className="font-mono text-amber-400 font-bold">{myProfile.employee_id}</span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 uppercase font-semibold block mb-1">Designation</span>
                <span className="text-white font-medium">{myProfile.designation}</span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 uppercase font-semibold block mb-1">Department</span>
                <span className="text-purple-300 font-medium">
                  {myProfile.department ? `${myProfile.department.code} - ${myProfile.department.name}` : "Unassigned"}
                </span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-500 uppercase font-semibold block mb-1">Office</span>
                <span className="text-slate-300 font-medium">{myProfile.office_location || "N/A"}</span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-sm">
              You haven&apos;t registered your faculty profile details yet. Click &quot;Create Faculty Profile&quot; above.
            </div>
          )}
        </div>

        {/* Directory Search & List */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Faculty Directory ({facultyList.length})
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

          {facultyList.length === 0 ? (
            <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-2xl text-center text-slate-400">
              No faculty profiles found for the selected criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facultyList.map((fac) => (
                <div
                  key={fac.id}
                  className="p-6 bg-slate-900/70 border border-slate-800 rounded-2xl transition-all shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-mono font-bold">
                        {fac.employee_id}
                      </span>
                      {fac.department && (
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded text-[10px] font-bold">
                          {fac.department.code}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white">
                      {fac.user.full_name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{fac.user.email}</p>

                    <div className="mt-3 space-y-1 text-xs text-slate-300">
                      <div><strong className="text-slate-500">Designation:</strong> {fac.designation}</div>
                      {fac.specialization && (
                        <div><strong className="text-slate-500">Specialization:</strong> {fac.specialization}</div>
                      )}
                      {fac.office_location && (
                        <div><strong className="text-slate-500">Office:</strong> {fac.office_location}</div>
                      )}
                    </div>

                    {fac.bio && (
                      <p className="text-xs text-slate-400 italic mt-3 line-clamp-2">
                        &quot;{fac.bio}&quot;
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
                    <span>Faculty Member</span>
                    <span className="text-amber-400">Academic Staff</span>
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
