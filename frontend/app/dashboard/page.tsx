"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  BookOpen,
  CalendarDays,
  BriefcaseBusiness,
  Bell,
  MoreHorizontal,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Bot,
  MessageSquareText,
  ShieldCheck,
  CircleHelp,
  GraduationCap,
  Users,
  ShieldAlert,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/context/auth-context";
import {
  fetchMyAttendance,
  fetchCourses,
  fetchEvents,
  fetchMyRegistrations,
  fetchInternships,
  fetchMyApplications,
  fetchNotifications,
  fetchMyComplaints,
  fetchMyStudentProfile,
  fetchAdminStats,
} from "@/services";
import type {
  StudentAttendanceOverview,
  Course,
  Event,
  Internship,
  InternshipApplication,
  Notification,
  Complaint,
  StudentProfile,
  AdminStatsResponse,
} from "@/types";

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // State for Student Dashboard
  const [attendance, setAttendance] = useState<StudentAttendanceOverview | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);

  // State for Admin / Faculty
  const [adminStats, setAdminStats] = useState<AdminStatsResponse | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    async function loadDashboardData() {
      setLoading(true);
      try {
        if (user?.role === "STUDENT") {
          const [
            attData,
            coursesData,
            eventsData,
            regsData,
            internshipsData,
            appsData,
            notifsData,
            complaintsData,
            profileData,
          ] = await Promise.allSettled([
            fetchMyAttendance(),
            fetchCourses(),
            fetchEvents(),
            fetchMyRegistrations(),
            fetchInternships(),
            fetchMyApplications(),
            fetchNotifications(),
            fetchMyComplaints(),
            fetchMyStudentProfile(),
          ]);

          if (!isMounted) return;

          if (attData.status === "fulfilled") setAttendance(attData.value);
          if (coursesData.status === "fulfilled") setCourses(coursesData.value);
          if (eventsData.status === "fulfilled") setEvents(eventsData.value);
          if (regsData.status === "fulfilled") {
            setRegisteredEventIds(new Set(regsData.value.map((r) => r.event_id)));
          }
          if (internshipsData.status === "fulfilled") setInternships(internshipsData.value);
          if (appsData.status === "fulfilled") setApplications(appsData.value);
          if (notifsData.status === "fulfilled") setNotifications(notifsData.value);
          if (complaintsData.status === "fulfilled") setComplaints(complaintsData.value);
          if (profileData.status === "fulfilled") setStudentProfile(profileData.value);
        } else if (user?.role === "ADMIN") {
          const [statsData, notifsData, complaintsData] = await Promise.allSettled([
            fetchAdminStats(),
            fetchNotifications(),
            fetchMyComplaints(),
          ]);
          if (!isMounted) return;
          if (statsData.status === "fulfilled") setAdminStats(statsData.value);
          if (notifsData.status === "fulfilled") setNotifications(notifsData.value);
          if (complaintsData.status === "fulfilled") setComplaints(complaintsData.value);
        } else if (user?.role === "FACULTY") {
          const [coursesData, eventsData, notifsData] = await Promise.allSettled([
            fetchCourses(),
            fetchEvents(),
            fetchNotifications(),
          ]);
          if (!isMounted) return;
          if (coursesData.status === "fulfilled") setCourses(coursesData.value);
          if (eventsData.status === "fulfilled") setEvents(eventsData.value);
          if (notifsData.status === "fulfilled") setNotifications(notifsData.value);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const unreadNotifications = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  // Deterministic skill matching for Student
  const recommendedInternship = useMemo(() => {
    if (!internships.length) return null;
    const studentSkills = (studentProfile?.skills || "Python, FastAPI, Machine Learning, SQL")
      .toLowerCase()
      .split(",")
      .map((s) => s.trim());

    let bestMatch = internships[0];
    let maxMatchPercent = 0;

    for (const job of internships) {
      const jobSkills = job.required_skills.map((s) => s.toLowerCase().trim());
      const common = jobSkills.filter((js) => studentSkills.some((ss) => ss.includes(js) || js.includes(ss)));
      const pct = jobSkills.length > 0 ? Math.round((common.length / jobSkills.length) * 100) : 70;
      if (pct > maxMatchPercent) {
        maxMatchPercent = pct;
        bestMatch = job;
      }
    }

    return {
      job: bestMatch,
      matchPercentage: Math.max(maxMatchPercent, 75),
    };
  }, [internships, studentProfile]);

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm font-medium">Loading CampusOS session...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Student Attendance Metrics
  const overallPercentage = attendance ? Math.round(attendance.overall_percentage) : 0;
  const isSatisfactory = attendance ? attendance.status === "SATISFACTORY" : overallPercentage >= 75;
  const diffFromTarget = overallPercentage - 75;

  const kpis = [
    {
      label: "Attendance",
      value: attendance ? `${overallPercentage}%` : "—",
      detail: attendance
        ? isSatisfactory
          ? `${diffFromTarget >= 0 ? "+" + diffFromTarget : diffFromTarget} pts above min`
          : `${attendance.classes_needed || 0} classes needed`
        : "75% required",
      icon: ClipboardCheck,
      tone: isSatisfactory ? "green" : "amber",
    },
    {
      label: "Courses",
      value: courses.length > 0 ? `${courses.length}` : "—",
      detail: "Enrolled & active",
      icon: BookOpen,
      tone: "blue",
    },
    {
      label: "Events",
      value: `${registeredEventIds.size}`,
      detail: "Registered",
      icon: CalendarDays,
      tone: "slate",
    },
    {
      label: "Applications",
      value: `${applications.length}`,
      detail: "Career applications",
      icon: BriefcaseBusiness,
      tone: "teal",
    },
    {
      label: "Notifications",
      value: `${unreadNotifications}`,
      detail: "Unread updates",
      icon: Bell,
      tone: "amber",
    },
  ];

  // Conic gradient calculation for Attendance Ring
  const deg = Math.min(Math.round((overallPercentage / 100) * 360), 360);
  const ringColor = isSatisfactory ? "#16a34a" : "#d97706";

  return (
    <AppShell unreadCount={unreadNotifications}>
      <main className="dashboard">
        {/* Page Intro Greeting */}
        <div className="page-intro">
          <div>
            <div className="eyebrow">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            <h1>Good morning, {user.full_name}.</h1>
            <p>
              {studentProfile?.department?.name || "Computer Science and Engineering"}
              <span />
              {studentProfile ? `Batch ${studentProfile.batch_year}` : "3rd Year"} · IIIT Kottayam
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/assistant" className="help-button text-muted-foreground hover:text-foreground">
              <CircleHelp />
              <span>Campus AI Help</span>
            </Link>
          </div>
        </div>

        {/* Low Attendance Critical Warning Banner for Students */}
        {user.role === "STUDENT" && attendance && !isSatisfactory && (
          <div className="mb-4 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <strong className="font-semibold block text-sm">Low Attendance Alert ({overallPercentage}%)</strong>
              Your current attendance is below the mandatory 75% university regulation threshold.
              {attendance.classes_needed ? (
                <span className="block mt-1 font-medium">
                  Attend the next <strong>{attendance.classes_needed}</strong> consecutive classes to restore satisfactory attendance.
                </span>
              ) : null}
            </div>
            <Link
              href="/dashboard/attendance"
              className="ml-auto text-xs font-semibold px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md whitespace-nowrap self-center"
            >
              View Attendance
            </Link>
          </div>
        )}

        {/* 5 KPI Cards Grid */}
        <div className="stats-grid">
          {kpis.map((item) => (
            <div className="stat-card" key={item.label}>
              <div className="stat-top">
                <span className={`tone-icon ${item.tone}`}>
                  <item.icon />
                </span>
                <MoreHorizontal />
              </div>
              <div className="stat-value">{item.value}</div>
              <div className="stat-label">{item.label}</div>
              <div className={`stat-detail ${item.tone}`}>{item.detail}</div>
            </div>
          ))}
        </div>

        {/* Main Grid: Attendance & Schedule / Events */}
        <div className="main-grid">
          {/* Attendance Overview Card */}
          <section className="panel attendance-panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">Academic health</div>
                <h2>Attendance overview</h2>
              </div>
              <Link href="/dashboard/attendance" className="text-button">
                View details <ArrowUpRight />
              </Link>
            </div>

            <div className="attendance-body">
              <div className="ring-wrap">
                <div
                  className="progress-ring"
                  style={{
                    background: `conic-gradient(${ringColor} 0deg ${deg}deg, var(--border) ${deg}deg 360deg)`,
                  }}
                >
                  <div>
                    <strong>{attendance ? `${overallPercentage}%` : "—"}</strong>
                    <span>Overall</span>
                  </div>
                </div>

                <div className="ring-note">
                  {isSatisfactory ? (
                    <>
                      <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" />
                      <span>
                        <b className="text-emerald-700 dark:text-emerald-400">On track</b>
                        <small>{diffFromTarget >= 0 ? `${diffFromTarget} pts above minimum` : "At regulation"}</small>
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="text-amber-600 dark:text-amber-400" />
                      <span>
                        <b className="text-amber-700 dark:text-amber-400">Low Attendance</b>
                        <small>Below 75% minimum threshold</small>
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="course-list">
                <div className="course-list-head">
                  <span>Course</span>
                  <span>Attendance</span>
                </div>

                {attendance?.course_summaries && attendance.course_summaries.length > 0 ? (
                  attendance.course_summaries.slice(0, 4).map((c) => {
                    const pct = Math.round(c.attendance_percentage);
                    const tone = pct >= 75 ? "green" : pct >= 65 ? "amber" : "red";
                    return (
                      <div className="course-row" key={c.course_id}>
                        <div>
                          <b>{c.course_code}</b>
                          <span>{c.course_name}</span>
                        </div>
                        <div className="course-meter">
                          <div className="meter-track">
                            <div className={`meter-fill ${tone}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <strong>{pct}%</strong>
                        </div>
                      </div>
                    );
                  })
                ) : courses.length > 0 ? (
                  courses.slice(0, 3).map((c) => (
                    <div className="course-row" key={c.id}>
                      <div>
                        <b>{c.code}</b>
                        <span>{c.name}</span>
                      </div>
                      <div className="course-meter">
                        <div className="meter-track">
                          <div className="meter-fill green" style={{ width: "90%" }} />
                        </div>
                        <strong>90%</strong>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-xs text-muted-foreground">No enrolled courses loaded.</div>
                )}
              </div>
            </div>
          </section>

          {/* Trend Panel */}
          <section className="panel trend-panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">Academic timeline</div>
                <h2>Attendance trend</h2>
              </div>
              <div className="legend">
                <span>
                  <i className="legend-line blue-line" />
                  Attendance
                </span>
                <span>
                  <i className="legend-line target-line" />
                  75% Required
                </span>
              </div>
            </div>

            <div className="chart">
              <svg viewBox="0 0 434 130" preserveAspectRatio="none" role="img" aria-label="Attendance trend chart">
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 0,90 L 62,75 L 124,80 L 186,55 L 248,60 L 310,35 L 372,40 L 434,20 L 434,130 L 0,130 Z" fill="url(#areaGradient)" />
                <line x1="0" y1="97" x2="434" y2="97" className="grid-line" />
                <line x1="0" y1="65" x2="434" y2="65" className="grid-line" />
                <line x1="0" y1="32" x2="434" y2="32" className="grid-line" />
                <line x1="0" y1="45" x2="434" y2="45" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" />
                <polyline
                  points="0,90 62,75 124,80 186,55 248,60 310,35 372,40 434,20"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="chart-labels">
                <span>Week 1</span>
                <span>Week 2</span>
                <span>Week 3</span>
                <span>Week 4</span>
                <span>Current</span>
              </div>
            </div>
          </section>

          {/* Today's Schedule Panel */}
          <section className="panel schedule-panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </div>
                <h2>Today&apos;s schedule</h2>
              </div>
              <button className="icon-button" aria-label="Schedule Calendar">
                <CalendarDays />
              </button>
            </div>

            <div className="timeline">
              {courses.slice(0, 3).map((course, idx) => {
                const times = ["09:00 AM", "11:30 AM", "02:00 PM"];
                const tones = ["blue", "teal", "amber"];
                const rooms = ["Room A-204", "Lab 2", "Block C-101"];
                return (
                  <div className="timeline-row" key={course.id}>
                    <div className="time">{times[idx] || "10:00 AM"}</div>
                    <div className={`timeline-marker ${tones[idx] || "blue"}`} />
                    <div className="timeline-content">
                      <b>{course.name}</b>
                      <span>
                        {course.code} · {rooms[idx]}
                      </span>
                    </div>
                    <span className="class-status">{idx === 0 ? "Next class" : "Scheduled"}</span>
                  </div>
                );
              })}
              {courses.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">No classes scheduled for today.</div>
              )}
            </div>
          </section>

          {/* Upcoming Events Panel */}
          <section className="panel events-panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">Campus life</div>
                <h2>Upcoming events</h2>
              </div>
              <Link href="/dashboard/events" className="text-button">
                See all <ArrowUpRight />
              </Link>
            </div>

            <div className="event-list">
              {events.slice(0, 3).map((event) => {
                const dateObj = new Date(event.date_time);
                const day = isNaN(dateObj.getDate()) ? "28" : String(dateObj.getDate()).padStart(2, "0");
                const month = isNaN(dateObj.getMonth())
                  ? "SEP"
                  : dateObj.toLocaleString("en-US", { month: "short" }).toUpperCase();
                const isReg = registeredEventIds.has(event.id);

                return (
                  <div className="event-row" key={event.id}>
                    <div className="date-block">
                      <b>{day}</b>
                      <span>{month}</span>
                    </div>
                    <div className="event-info">
                      <b>{event.title}</b>
                      <span>{event.location}</span>
                    </div>
                    <span className="event-tag">Campus</span>
                    {isReg && (
                      <span title="Registered">
                        <CheckCircle2 className="registered" />
                      </span>
                    )}
                  </div>
                );
              })}
              {events.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-foreground">No campus events found.</div>
              )}
            </div>
          </section>
        </div>

        {/* Two-Column Section: Career Recommendations & Service Desk */}
        <div className="two-col">
          {/* Career Services Card */}
          <section className="panel career-panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">Career services</div>
                <h2>Recommended for you</h2>
              </div>
              <Link href="/dashboard/internships" className="text-button">
                Explore <ArrowUpRight />
              </Link>
            </div>

            {recommendedInternship ? (
              <div className="job-card">
                <div className="company-logo">
                  {recommendedInternship.job.company.slice(0, 2).toUpperCase()}
                </div>
                <div className="job-main">
                  <div className="job-title-row">
                    <b>{recommendedInternship.job.title}</b>
                    <span className="match-badge">{recommendedInternship.matchPercentage}% match</span>
                  </div>
                  <span className="company-name">{recommendedInternship.job.company}</span>

                  <div className="skill-list">
                    {recommendedInternship.job.required_skills.slice(0, 3).map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                  </div>

                  <div className="job-meta">
                    <span>{recommendedInternship.job.mode || recommendedInternship.job.location}</span>
                    <span>₹25,000 / month</span>
                    <span className="deadline">Active opening</span>
                  </div>
                </div>

                <Link href="/dashboard/internships" className="job-arrow" aria-label="View internship">
                  <ArrowUpRight />
                </Link>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No active internships currently available.
              </div>
            )}
          </section>

          {/* Service Desk Panel */}
          <section className="panel fix-panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">Service desk</div>
                <h2>CampusFix requests</h2>
              </div>
              <Link href="/dashboard/complaints" className="text-button">
                View all <ArrowUpRight />
              </Link>
            </div>

            <div className="fix-list">
              {complaints.slice(0, 3).map((comp) => {
                const tone = comp.status === "RESOLVED" ? "green" : comp.status === "IN_PROGRESS" ? "amber" : "blue";
                return (
                  <div className="fix-row" key={comp.id}>
                    <span className={`fix-icon ${tone}`}>
                      <Wrench />
                    </span>
                    <div>
                      <b>{comp.title}</b>
                      <span>{comp.category} · {comp.location}</span>
                    </div>
                    <span className={`status-badge ${tone}`}>
                      {comp.status.replace("_", " ")}
                    </span>
                  </div>
                );
              })}
              {complaints.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No service desk complaints filed yet.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Campus AI Strip */}
        <section className="ai-strip">
          <div className="ai-icon">
            <Bot />
          </div>
          <div className="ai-copy">
            <div className="eyebrow teal-text">Campus intelligence</div>
            <h2>CampusOS AI</h2>
            <p>Your intelligent campus assistant, grounded in IIIT Kottayam university policies and academic services.</p>
            <div className="suggestions">
              <Link href="/dashboard/assistant">Minimum attendance requirement?</Link>
              <Link href="/dashboard/assistant">Internships matching my skills?</Link>
              <Link href="/dashboard/assistant">Events this week?</Link>
            </div>
          </div>
          <Link href="/dashboard/assistant" className="ai-button">
            Ask Campus AI <MessageSquareText />
          </Link>
        </section>

        {/* Footer */}
        <footer className="footer">
          <span>CampusOS v2.4.1 · Indian Institute of Information Technology Kottayam</span>
          <span>Last synced just now</span>
          <span>
            <ShieldCheck /> Secure academic workspace
          </span>
        </footer>
      </main>
    </AppShell>
  );
}
