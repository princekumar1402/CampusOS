"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  fetchCourses,
  createCourse,
  markAttendanceBatch,
  fetchMyAttendance,
  fetchCourseAttendanceRecords,
  fetchStudentProfiles,
  fetchDepartments,
} from "@/services";
import type {
  Course,
  StudentProfile,
  Department,
  AttendanceMarkItem,
  AttendanceStatus,
  StudentAttendanceOverview,
  AttendanceRecord,
} from "@/types";

export default function AttendanceDashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  // Mode toggle for Admin/Faculty to preview student view
  const [activeTab, setActiveTab] = useState<"take_attendance" | "my_attendance">("take_attendance");

  // State for Courses
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);

  // Course Creation Modal State
  const [showCourseModal, setShowCourseModal] = useState<boolean>(false);
  const [newCourseCode, setNewCourseCode] = useState<string>("");
  const [newCourseName, setNewCourseName] = useState<string>("");
  const [newCourseDeptId, setNewCourseDeptId] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [creatingCourse, setCreatingCourse] = useState<boolean>(false);

  // Faculty Attendance Taking State
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [markMap, setMarkMap] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});
  const [submittingAttendance, setSubmittingAttendance] = useState<boolean>(false);
  const [existingCourseRecords, setExistingCourseRecords] = useState<AttendanceRecord[]>([]);

  // Student Self-Service State
  const [studentOverview, setStudentOverview] = useState<StudentAttendanceOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState<boolean>(false);

  // Global Toast / Message
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Initial tab preference based on role
  useEffect(() => {
    if (user?.role === "STUDENT") {
      setActiveTab("my_attendance");
    } else {
      setActiveTab("take_attendance");
    }
  }, [user]);

  // Load Courses & Departments
  useEffect(() => {
    if (user) {
      loadInitialData();
    }
  }, [user]);

  async function loadInitialData() {
    setLoadingCourses(true);
    try {
      const [deptList, courseList] = await Promise.all([
        fetchDepartments(),
        fetchCourses(),
      ]);
      setDepartments(deptList);
      setCourses(courseList);
      if (courseList.length > 0) {
        setSelectedCourseId(courseList[0].id);
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to load initial data",
      });
    } finally {
      setLoadingCourses(false);
    }
  }

  // Load Student profiles for marking when course or date changes
  useEffect(() => {
    if (user && user.role !== "STUDENT" && activeTab === "take_attendance") {
      loadStudentsAndExistingRecords();
    }
  }, [user, activeTab, selectedCourseId, attendanceDate]);

  async function loadStudentsAndExistingRecords() {
    setLoadingStudents(true);
    try {
      const studentList = await fetchStudentProfiles();
      setStudents(studentList);

      // Initialize default mark map (PRESENT)
      const initialMap: Record<string, { status: AttendanceStatus; remarks: string }> = {};
      studentList.forEach((st) => {
        initialMap[st.id] = { status: "PRESENT", remarks: "" };
      });

      // Fetch existing records for this course and date if selected
      if (selectedCourseId) {
        const records = await fetchCourseAttendanceRecords(selectedCourseId, attendanceDate);
        setExistingCourseRecords(records);

        // Override initialMap with existing records
        records.forEach((rec) => {
          if (rec.student_profile_id) {
            initialMap[rec.student_profile_id] = {
              status: rec.status,
              remarks: rec.remarks || "",
            };
          }
        });
      }

      setMarkMap(initialMap);
    } catch (err: any) {
      console.error("Error loading students or records:", err);
    } finally {
      setLoadingStudents(false);
    }
  }

  // Load Student Overview if viewing "my_attendance" tab
  useEffect(() => {
    if (user && activeTab === "my_attendance") {
      loadMyAttendance();
    }
  }, [user, activeTab]);

  async function loadMyAttendance() {
    setLoadingOverview(true);
    try {
      const overview = await fetchMyAttendance();
      setStudentOverview(overview);
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to load attendance records",
      });
    } finally {
      setLoadingOverview(false);
    }
  }

  // Handle Course Creation
  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault();
    if (!newCourseCode || !newCourseName) return;

    setCreatingCourse(true);
    setFeedback(null);
    try {
      const newCourse = await createCourse({
        code: newCourseCode.trim().toUpperCase(),
        name: newCourseName.trim(),
        department_id: newCourseDeptId || undefined,
      });

      setCourses((prev) => [...prev, newCourse]);
      setSelectedCourseId(newCourse.id);
      setShowCourseModal(false);
      setNewCourseCode("");
      setNewCourseName("");
      setNewCourseDeptId("");
      setFeedback({
        type: "success",
        text: `Course ${newCourse.code} created successfully!`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to create course",
      });
    } finally {
      setCreatingCourse(false);
    }
  }

  // Batch toggle all students
  function handleSetAllStatus(status: AttendanceStatus) {
    setMarkMap((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id] = { ...updated[id], status };
      });
      return updated;
    });
  }

  // Toggle single student status
  function handleToggleStudentStatus(studentProfileId: string) {
    setMarkMap((prev) => {
      const current = prev[studentProfileId]?.status || "PRESENT";
      const nextStatus: AttendanceStatus = current === "PRESENT" ? "ABSENT" : "PRESENT";
      return {
        ...prev,
        [studentProfileId]: {
          ...prev[studentProfileId],
          status: nextStatus,
        },
      };
    });
  }

  // Submit Batch Attendance
  async function handleSubmitAttendance() {
    if (!selectedCourseId) {
      setFeedback({ type: "error", text: "Please select a course first" });
      return;
    }

    setSubmittingAttendance(true);
    setFeedback(null);

    const records: AttendanceMarkItem[] = Object.entries(markMap).map(([student_profile_id, data]) => ({
      student_profile_id,
      status: data.status,
      remarks: data.remarks.trim() || undefined,
    }));

    try {
      const res = await markAttendanceBatch({
        course_id: selectedCourseId,
        date: attendanceDate,
        records,
      });

      setFeedback({
        type: "success",
        text: `Successfully saved attendance for ${res.length} students!`,
      });
      loadStudentsAndExistingRecords();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to mark attendance",
      });
    } finally {
      setSubmittingAttendance(false);
    }
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading attendance module...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header Bar */}
        <header className="flex justify-between items-center bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 px-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1"
            >
              <span>←</span>
              <span>Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <h1 className="font-bold text-white tracking-wide text-lg">
                Attendance Management
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Logged in as <strong className="text-slate-200">{user.full_name}</strong>
            </span>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-all"
            >
              Logout ➔
            </button>
          </div>
        </header>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-sm ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{feedback.type === "success" ? "✅" : "⚠️"}</span>
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Role Tab Selector (If Admin/Faculty) */}
        {user.role !== "STUDENT" && (
          <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab("take_attendance")}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === "take_attendance"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-900/50 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <span>👩‍🏫</span>
              <span>Take / Manage Attendance (Faculty)</span>
            </button>
            <button
              onClick={() => setActiveTab("my_attendance")}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === "my_attendance"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "bg-slate-900/50 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <span>🎓</span>
              <span>View My Attendance (Student View)</span>
            </button>
          </div>
        )}

        {/* TAB 1: FACULTY ATTENDANCE TAKING & COURSE SELECTOR */}
        {activeTab === "take_attendance" && user.role !== "STUDENT" && (
          <div className="space-y-6">
            {/* Course & Date Controls Bar */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Course Attendance Portal
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select a course and date to record or update attendance records.
                  </p>
                </div>

                <button
                  onClick={() => setShowCourseModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
                >
                  <span>+</span>
                  <span>Add New Course</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* Course Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Select Course
                  </label>
                  {loadingCourses ? (
                    <div className="h-10 bg-slate-800 animate-pulse rounded-xl" />
                  ) : courses.length === 0 ? (
                    <p className="text-xs text-amber-400 py-2">
                      No courses found. Click "+ Add New Course" to create one.
                    </p>
                  ) : (
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Attendance Date
                  </label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Actions & Statistics */}
                <div className="flex flex-col justify-end">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSetAllStatus("PRESENT")}
                      className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all"
                    >
                      All Present
                    </button>
                    <button
                      onClick={() => handleSetAllStatus("ABSENT")}
                      className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all"
                    >
                      All Absent
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Student List Checklist */}
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-md font-bold text-white">Student Roster</h3>
                  <p className="text-xs text-slate-400">
                    {students.length} student profile(s) found in campus directory.
                  </p>
                </div>

                <button
                  onClick={handleSubmitAttendance}
                  disabled={submittingAttendance || !selectedCourseId || students.length === 0}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  {submittingAttendance ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>Save Attendance Records</span>
                    </>
                  )}
                </button>
              </div>

              {loadingStudents ? (
                <div className="py-12 text-center text-slate-500 text-sm animate-pulse">
                  Loading student checklist...
                </div>
              ) : students.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No registered students found. Create student profiles in the Student Directory first.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-2xl overflow-hidden">
                  {students.map((st) => {
                    const status = markMap[st.id]?.status || "PRESENT";
                    const remarks = markMap[st.id]?.remarks || "";
                    const isPresent = status === "PRESENT";

                    return (
                      <div
                        key={st.id}
                        className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                          isPresent ? "bg-slate-900/40" : "bg-rose-950/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm">
                            {st.user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-white text-sm block">
                              {st.user.full_name}
                            </span>
                            <span className="text-xs font-mono text-indigo-400">
                              ID: {st.student_id} • {st.program}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Status Toggle Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleStudentStatus(st.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
                              isPresent
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                                : "bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30"
                            }`}
                          >
                            <span>{isPresent ? "✓ PRESENT" : "✕ ABSENT"}</span>
                          </button>

                          {/* Remarks input */}
                          <input
                            type="text"
                            placeholder="Optional remarks..."
                            value={remarks}
                            onChange={(e) =>
                              setMarkMap((prev) => ({
                                ...prev,
                                [st.id]: {
                                  ...prev[st.id],
                                  remarks: e.target.value,
                                },
                              }))
                            }
                            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600 w-44"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: STUDENT SELF-SERVICE VIEW */}
        {(activeTab === "my_attendance" || user.role === "STUDENT") && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    My Attendance Record
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Self-service overview of course attendance and class statistics.
                  </p>
                </div>
                <button
                  onClick={loadMyAttendance}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition-all"
                >
                  🔄 Refresh
                </button>
              </div>

              {loadingOverview ? (
                <div className="py-12 text-center text-slate-500 text-sm animate-pulse">
                  Calculating attendance metrics...
                </div>
              ) : !studentOverview ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No attendance records found for your account. Ensure your student profile is linked.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Overall Attendance
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full font-bold text-[11px] uppercase tracking-wider border shadow-sm ${
                              (studentOverview.status || (studentOverview.overall_percentage >= 75 ? "SATISFACTORY" : "LOW_ATTENDANCE")) === "SATISFACTORY"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            }`}
                          >
                            {(studentOverview.status || (studentOverview.overall_percentage >= 75 ? "SATISFACTORY" : "LOW_ATTENDANCE")) === "SATISFACTORY"
                              ? "✓ SATISFACTORY"
                              : "⚠️ LOW ATTENDANCE"}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span
                            className={`text-4xl font-extrabold tracking-tight ${
                              studentOverview.overall_percentage >= 75
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            {studentOverview.overall_percentage}%
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            ({studentOverview.attended_classes}/{studentOverview.total_classes} classes)
                          </span>
                        </div>
                      </div>

                      {/* Enhanced Progress Bar with 75% Target Marker */}
                      <div className="mt-4 space-y-1">
                        <div className="relative w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              studentOverview.overall_percentage >= 75
                                ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                                : "bg-gradient-to-r from-rose-600 to-amber-500"
                            }`}
                            style={{ width: `${Math.min(studentOverview.overall_percentage, 100)}%` }}
                          />
                          {/* 75% Target Vertical Pin */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-indigo-400 shadow-sm shadow-indigo-400 z-10"
                            style={{ left: "75%" }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium pt-0.5">
                          <span>0%</span>
                          <span className="text-indigo-400 font-semibold">75% Target</span>
                          <span>100%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Attended Classes
                        </span>
                        <span className="text-4xl font-extrabold text-indigo-400">
                          {studentOverview.attended_classes}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-4 border-t border-slate-800/80 pt-2">
                        Total sessions marked as <strong className="text-emerald-400">PRESENT</strong>
                      </p>
                    </div>

                    <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col justify-between">
                      <div>
                        <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                          Total Classes Held
                        </span>
                        <span className="text-4xl font-extrabold text-slate-200">
                          {studentOverview.total_classes}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-4 border-t border-slate-800/80 pt-2">
                        Total recorded course sessions to date
                      </p>
                    </div>
                  </div>

                  {/* Stage 2B Attendance Intelligence Callout Banner */}
                  {(studentOverview.status || (studentOverview.overall_percentage >= 75 ? "SATISFACTORY" : "LOW_ATTENDANCE")) === "LOW_ATTENDANCE" ? (
                    <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 flex items-start gap-4 shadow-lg">
                      <span className="text-2xl mt-0.5">⚠️</span>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-rose-200 tracking-wide uppercase">
                          Low Attendance Alert
                        </h4>
                        <p className="text-xs text-rose-300/90 leading-relaxed">
                          Your overall attendance is currently below the required 75% threshold. You must attend at least{" "}
                          <strong className="text-white underline underline-offset-2">
                            {studentOverview.classes_needed ?? 0} consecutive class(es)
                          </strong>{" "}
                          to bring your attendance back to satisfactory status.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 flex items-center gap-3">
                      <span className="text-lg">✅</span>
                      <p className="text-xs font-medium">
                        <strong>Satisfactory Attendance:</strong> Your overall attendance meets university standards (0 additional classes needed).
                      </p>
                    </div>
                  )}

                  {/* Course Summary Breakdown Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
                        Course Breakdown & Intelligence
                      </h3>
                      <span className="text-xs text-slate-500">
                        {studentOverview.course_summaries.length} Course(s) Enrolled
                      </span>
                    </div>

                    <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="p-3.5 px-4 font-semibold uppercase tracking-wider">Course Code</th>
                            <th className="p-3.5 px-4 font-semibold uppercase tracking-wider">Course Name</th>
                            <th className="p-3.5 px-4 font-semibold uppercase tracking-wider">Attended / Total</th>
                            <th className="p-3.5 px-4 font-semibold uppercase tracking-wider">Percentage</th>
                            <th className="p-3.5 px-4 font-semibold uppercase tracking-wider">Classes Needed (75%)</th>
                            <th className="p-3.5 px-4 font-semibold uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
                          {studentOverview.course_summaries.map((cs) => {
                            const isGood = (cs.status || (cs.attendance_percentage >= 75 ? "SATISFACTORY" : "LOW_ATTENDANCE")) === "SATISFACTORY";
                            return (
                              <tr
                                key={cs.course_id}
                                className={`transition-colors ${
                                  isGood ? "hover:bg-slate-900/60" : "bg-rose-950/20 hover:bg-rose-900/30"
                                }`}
                              >
                                <td className="p-3.5 px-4 font-mono font-bold text-indigo-400">
                                  {cs.course_code}
                                </td>
                                <td className="p-3.5 px-4 font-semibold text-slate-200">
                                  {cs.course_name}
                                </td>
                                <td className="p-3.5 px-4 text-slate-300">
                                  {cs.attended_classes} / {cs.total_classes}
                                </td>
                                <td className="p-3.5 px-4 font-bold text-slate-100">
                                  {cs.attendance_percentage}%
                                </td>
                                <td className="p-3.5 px-4 font-medium">
                                  {(cs.classes_needed ?? 0) > 0 ? (
                                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded font-semibold text-[11px]">
                                      +{cs.classes_needed} needed
                                    </span>
                                  ) : (
                                    <span className="text-emerald-400 font-semibold">0</span>
                                  )}
                                </td>
                                <td className="p-3.5 px-4">
                                  <span
                                    className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${
                                      isGood
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                        : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                    }`}
                                  >
                                    {isGood ? "Satisfactory" : "Low Attendance"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recent Records Log */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider text-slate-300">
                      Recent Activity Log
                    </h3>
                    <div className="border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800/60 bg-slate-900/30">
                      {studentOverview.recent_records.length === 0 ? (
                        <div className="p-4 text-slate-500 text-xs text-center">
                          No recent activity recorded yet.
                        </div>
                      ) : (
                        studentOverview.recent_records.map((rec) => (
                          <div
                            key={rec.id}
                            className="p-3 px-4 flex items-center justify-between text-xs hover:bg-slate-900/60 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  rec.status === "PRESENT" ? "bg-emerald-400" : "bg-rose-400"
                                }`}
                              />
                              <span className="font-mono text-slate-400">{rec.date}</span>
                              <span className="font-bold text-white">{rec.course?.code}</span>
                              <span className="text-slate-400">— {rec.course?.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {rec.remarks && (
                                <span className="text-slate-500 italic text-[11px]">
                                  "{rec.remarks}"
                                </span>
                              )}
                              <span
                                className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                                  rec.status === "PRESENT"
                                    ? "bg-emerald-500/20 text-emerald-300"
                                    : "bg-rose-500/20 text-rose-300"
                                }`}
                              >
                                {rec.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL: Create New Course */}
        {showCourseModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white">Create New Course</h3>
                <button
                  onClick={() => setShowCourseModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Course Code (e.g. CS101)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="CS101"
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Introduction to Computer Science"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Department (Optional)
                  </label>
                  <select
                    value={newCourseDeptId}
                    onChange={(e) => setNewCourseDeptId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} — {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCourseModal(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingCourse}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl shadow-md transition-all"
                  >
                    {creatingCourse ? "Creating..." : "Save Course"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
