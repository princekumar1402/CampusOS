import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CampusOS — Unified Digital Campus Platform",
  description:
    "CampusOS brings academics, campus services, career tools, and AI together into one unified platform.",
};

const features = [
  {
    icon: "🎓",
    title: "Academic Suite",
    description:
      "Courses, timetables, assignments, exams, grades, and attendance — unified under one roof.",
    tags: ["Courses", "Attendance", "Grades"],
    color: "from-indigo-500/20 to-purple-500/20",
    border: "border-indigo-500/20",
    planned: true,
  },
  {
    icon: "🏛️",
    title: "Campus Services",
    description:
      "Events, clubs, CampusFix complaint management, and real-time notifications.",
    tags: ["Events", "CampusFix", "Clubs"],
    color: "from-sky-500/20 to-cyan-500/20",
    border: "border-sky-500/20",
    planned: true,
  },
  {
    icon: "💼",
    title: "Career Platform",
    description:
      "Internship listings, applications, and AI-powered opportunity matching for students.",
    tags: ["Internships", "AI Matching", "Profiles"],
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/20",
    planned: true,
  },
  {
    icon: "🤖",
    title: "Campus AI Assistant",
    description:
      "RAG-powered AI that answers queries about courses, policies, events, and deadlines.",
    tags: ["RAG", "LLM", "Knowledge Base"],
    color: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/20",
    planned: true,
  },
  {
    icon: "👥",
    title: "People Directory",
    description:
      "Unified profiles for students, faculty, and staff with RBAC across all modules.",
    tags: ["Students", "Faculty", "RBAC"],
    color: "from-rose-500/20 to-pink-500/20",
    border: "border-rose-500/20",
    planned: true,
  },
  {
    icon: "📊",
    title: "Admin Analytics",
    description:
      "Real-time dashboards, attendance reports, and system monitoring for administrators.",
    tags: ["Dashboards", "Reports", "Monitoring"],
    color: "from-violet-500/20 to-fuchsia-500/20",
    border: "border-violet-500/20",
    planned: true,
  },
];

const stack = [
  { label: "Next.js 14", category: "Frontend" },
  { label: "TypeScript", category: "Frontend" },
  { label: "Tailwind CSS", category: "Frontend" },
  { label: "TanStack Query", category: "Frontend" },
  { label: "FastAPI", category: "Backend" },
  { label: "Python 3.11", category: "Backend" },
  { label: "SQLAlchemy", category: "Backend" },
  { label: "Alembic", category: "Backend" },
  { label: "PostgreSQL 16", category: "Database" },
  { label: "Redis 7", category: "Infra" },
  { label: "Celery", category: "Infra" },
  { label: "Docker", category: "Infra" },
  { label: "OpenAI / RAG", category: "AI" },
  { label: "pgvector", category: "AI" },
];

const categoryColors: Record<string, string> = {
  Frontend: "bg-indigo-500/15 text-indigo-300 border border-indigo-500/25",
  Backend: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25",
  Database: "bg-sky-500/15 text-sky-300 border border-sky-500/25",
  Infra: "bg-amber-500/15 text-amber-300 border border-amber-500/25",
  AI: "bg-violet-500/15 text-violet-300 border border-violet-500/25",
};

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background glow orbs */}
      <div
        className="glow-orb w-[600px] h-[600px] top-[-200px] left-[-200px]"
        style={{ background: "rgba(99, 102, 241, 0.15)" }}
      />
      <div
        className="glow-orb w-[500px] h-[500px] top-[30%] right-[-150px]"
        style={{
          background: "rgba(34, 211, 238, 0.1)",
          animationDelay: "3s",
        }}
      />
      <div
        className="glow-orb w-[400px] h-[400px] bottom-[10%] left-[30%]"
        style={{
          background: "rgba(52, 211, 153, 0.08)",
          animationDelay: "6s",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/30">
            C
          </div>
          <span className="font-semibold text-white text-lg tracking-tight">
            CampusOS
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            <span className="relative w-2 h-2 flex">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            Auth + RBAC Live
          </span>
          <a
            href="/login"
            className="px-4 py-2 rounded-xl text-sm font-medium glass-card text-slate-200 hover:text-white transition-all"
          >
            Sign In
          </a>
          <a
            href="/register"
            className="px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-500/20"
          >
            Register
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full glass-card text-sm text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Architecture initialized · Backend API running · Frontend active
        </div>

        <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
          <span className="text-white">The OS for your</span>
          <br />
          <span className="gradient-text">Campus</span>
        </h1>

        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-4 leading-relaxed">
          <strong className="text-slate-200">Unified Digital Campus Platform</strong>
        </p>
        <p className="text-lg text-slate-500 max-w-3xl mx-auto mb-12 leading-relaxed">
          CampusOS will bring academics, campus services, career tools, and
          AI-powered features together into a single, cohesive platform — built
          as a production-grade modular monolith.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            id="api-docs-link"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5"
          >
            View API Docs →
          </a>
          <a
            href="http://localhost:8000/api/v1/health"
            target="_blank"
            rel="noopener noreferrer"
            id="health-check-link"
            className="px-6 py-3 rounded-xl glass-card text-slate-300 hover:text-white font-medium transition-all duration-200 hover:-translate-y-0.5"
          >
            Health Check
          </a>
        </div>
      </section>

      {/* Platform Status Banner */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 mb-20">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex flex-wrap gap-6 items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Platform Status</p>
              <p className="text-slate-200 font-medium">Foundation Initialized</p>
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                { label: "API Server", status: "Live", color: "text-emerald-400" },
                { label: "PostgreSQL", status: "Ready", color: "text-emerald-400" },
                { label: "Redis", status: "Ready", color: "text-emerald-400" },
                { label: "Auth Module", status: "Planned", color: "text-amber-400" },
                { label: "AI Assistant", status: "Planned", color: "text-amber-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full bg-current ${item.color}`} />
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className={`text-xs font-medium ${item.color}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 mb-24">
        <div className="text-center mb-14">
          <p className="text-sm text-indigo-400 font-medium uppercase tracking-widest mb-3">
            Planned Modules
          </p>
          <h2 className="text-4xl font-bold text-white mb-4">
            Everything your campus needs
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Each domain is a self-contained module with clean boundaries —
            built today as a modular monolith, extractable tomorrow as services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`feature-card glass-card rounded-2xl p-6 ${feature.border}`}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-2xl mb-5`}
              >
                {feature.icon}
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                {feature.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {feature.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-slate-400 border border-white/10"
                  >
                    {tag}
                  </span>
                ))}
                {feature.planned && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Planned
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 mb-24">
        <div className="text-center mb-12">
          <p className="text-sm text-cyan-400 font-medium uppercase tracking-widest mb-3">
            Technology Stack
          </p>
          <h2 className="text-3xl font-bold text-white mb-4">
            Built with production-grade tools
          </h2>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {stack.map((item) => (
            <span
              key={item.label}
              className={`badge ${categoryColors[item.category]}`}
            >
              {item.label}
            </span>
          ))}
        </div>
      </section>

      {/* Architecture note */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 mb-24">
        <div className="glass-card rounded-2xl p-8 border border-indigo-500/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-sm text-indigo-400 font-medium uppercase tracking-widest mb-3">
                Architecture
              </p>
              <h2 className="text-3xl font-bold text-white mb-4">
                Modular Monolith
              </h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                CampusOS starts as a modular monolith — a single deployable unit
                with rigorously enforced domain boundaries. Clean separation
                between domains means any module can be extracted into an
                independent microservice when scale demands it.
              </p>
              <p className="text-slate-500 text-sm">
                See{" "}
                <code className="text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                  docs/decisions/ADR-001-modular-monolith.md
                </code>{" "}
                for the full architectural decision record.
              </p>
            </div>

            <div className="font-mono text-sm space-y-1">
              {[
                { indent: 0, text: "Next.js", color: "text-indigo-300" },
                { indent: 1, text: "↓  HTTP / REST", color: "text-slate-600" },
                { indent: 0, text: "FastAPI  /api/v1/", color: "text-emerald-300" },
                { indent: 1, text: "↓  domain routing", color: "text-slate-600" },
                { indent: 0, text: "Domain Modules", color: "text-cyan-300" },
                { indent: 1, text: "↓  service calls", color: "text-slate-600" },
                { indent: 0, text: "Service Layer", color: "text-sky-300" },
                { indent: 1, text: "↓  data access", color: "text-slate-600" },
                { indent: 0, text: "Repository Layer", color: "text-violet-300" },
                { indent: 1, text: "↓  SQL / async", color: "text-slate-600" },
                { indent: 0, text: "PostgreSQL", color: "text-rose-300" },
              ].map((line, i) => (
                <p
                  key={i}
                  className={`${line.color}`}
                  style={{ paddingLeft: `${line.indent * 16}px` }}
                >
                  {line.text}
                </p>
              ))}
              <div className="pt-4 border-t border-white/5">
                <p className="text-slate-500 text-xs mb-2">Supporting infrastructure:</p>
                <div className="flex flex-wrap gap-2">
                  {["Redis", "Celery Workers", "Object Storage", "Vector DB", "LLM"].map(
                    (item) => (
                      <span
                        key={item}
                        className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded"
                      >
                        {item}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-10">
        <div className="max-w-7xl mx-auto px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs">
              C
            </div>
            <span className="text-slate-500 text-sm">
              CampusOS v0.1.0 — Foundation
            </span>
          </div>
          <p className="text-slate-600 text-sm">
            Built as an internship-level Full Stack + AI + System Design project
          </p>
        </div>
      </footer>
    </main>
  );
}
