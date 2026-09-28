"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import AppShell from "@/components/layout/AppShell";
import {
  fetchDepartments,
  fetchFacultyProfiles,
  fetchMyFacultyProfile,
  updateMyFacultyProfile,
} from "@/services/academic";
import type { Department, FacultyProfile } from "@/types";
import { BookOpen, UserCheck, MapPin, Mail, Phone } from "lucide-react";

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
          <span className="text-muted-foreground text-sm font-medium">Loading faculty directory...</span>
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
            <div className="eyebrow">Academic Faculty</div>
            <h1>Faculty Directory &amp; Staff</h1>
            <p>
              Teaching professors, departmental chairs, and research investigators · IIIT Kottayam
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

        {/* My Faculty Profile Section (Only shown if user is FACULTY) */}
        {user.role === "FACULTY" && (
          <div className="p-5 mb-6 bg-[var(--card)] border border-[var(--border)] rounded-[9px] shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border)]">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>My Faculty Profile</span>
                </h2>
                <p className="text-xs text-muted-foreground">Manage your designation and contact details</p>
              </div>

              <button
                onClick={() => setIsEditingMyProfile(!isEditingMyProfile)}
                className="px-3 py-1 bg-muted hover:bg-muted/80 text-foreground border border-[var(--border)] rounded-md text-xs font-semibold transition-colors cursor-pointer"
              >
                {isEditingMyProfile ? "Cancel Editing" : myProfile ? "Edit Profile" : "+ Create Profile"}
              </button>
            </div>

            {isEditingMyProfile ? (
              <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FAC-CSE-001"
                    value={employeeIdInput}
                    onChange={(e) => setEmployeeIdInput(e.target.value)}
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
                    Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Assistant Professor, Associate Professor"
                    value={designationInput}
                    onChange={(e) => setDesignationInput(e.target.value)}
                    className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Specialization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Machine Learning, Distributed Systems"
                    value={specializationInput}
                    onChange={(e) => setSpecializationInput(e.target.value)}
                    className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Office Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room B-302, Academic Block"
                    value={officeInput}
                    onChange={(e) => setOfficeInput(e.target.value)}
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
                    Faculty Bio &amp; Research Interests
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief background on academic courses taught and publications..."
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
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">Emp ID</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{myProfile.employee_id}</span>
                </div>

                <div className="p-3 bg-[var(--muted)] rounded-md border border-[var(--border)]">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">Designation</span>
                  <span className="text-foreground font-medium">{myProfile.designation}</span>
                </div>

                <div className="p-3 bg-[var(--muted)] rounded-md border border-[var(--border)]">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">Department</span>
                  <span className="text-foreground font-medium">
                    {myProfile.department ? `${myProfile.department.code} - ${myProfile.department.name}` : "Unassigned"}
                  </span>
                </div>

                <div className="p-3 bg-[var(--muted)] rounded-md border border-[var(--border)]">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-0.5">Office</span>
                  <span className="text-foreground font-medium">{myProfile.office_location || "Campus Main"}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground text-xs">
                You have not created your faculty profile yet. Click &quot;Create Profile&quot; to configure your office and specialization.
              </div>
            )}
          </div>
        )}

        {/* Directory Search & List */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-sm font-bold text-foreground">
              Teaching Faculty ({facultyList.length})
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

          {facultyList.length === 0 ? (
            <div className="p-12 bg-[var(--card)] border border-[var(--border)] rounded-[9px] text-center text-xs text-muted-foreground">
              No faculty members found for the selected department.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {facultyList.map((fac) => (
                <div
                  key={fac.id}
                  className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-[9px] shadow-sm flex flex-col justify-between transition-all hover:border-blue-500/40"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="status-badge blue font-mono font-bold">
                        {fac.employee_id}
                      </span>
                      {fac.department && (
                        <span className="status-badge slate">
                          {fac.department.code}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {fac.user.full_name}
                      </h3>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{fac.designation}</p>
                    </div>

                    <div className="pt-1 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <span>{fac.user.email}</span>
                      </div>
                      {fac.office_location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span>{fac.office_location}</span>
                        </div>
                      )}
                      {fac.specialization && (
                        <div className="pt-0.5">
                          <strong className="text-foreground">Specialization:</strong> {fac.specialization}
                        </div>
                      )}
                    </div>

                    {fac.bio && (
                      <p className="text-xs text-muted-foreground italic pt-1 line-clamp-2">
                        &quot;{fac.bio}&quot;
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border)] text-[10px] text-muted-foreground flex justify-between">
                    <span>IIIT Kottayam Faculty</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Verified</span>
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
