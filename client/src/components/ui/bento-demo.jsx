import {
  BellIcon,
  FileTextIcon,
  GlobeIcon,
  BarChartIcon,
  CheckCircledIcon,
} from "@radix-ui/react-icons";
import {
  AlertTriangle,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  PlugZap,
} from 'lucide-react';

import { BentoCard, BentoGrid } from "./bento-grid";

/* ═══════════════════════════════════════════════════
   BACKGROUND ILLUSTRATIONS
   • Centered horizontally, inset from edges
   • opacity-30 default → 100 on hover
   • Each wrapped in a padded container to prevent
     clipping against card rounded corners
   ═══════════════════════════════════════════════════ */

const MeetingHistoryBg = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none p-3 pt-3 pb-0">
    <div
      className={[
        "w-full",
        "opacity-30 group-hover:opacity-100",
        "scale-100 group-hover:scale-[1.01]",
        "transition-all duration-700 ease-out transform-gpu",
      ].join(" ")}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-[#D4E0DA] overflow-hidden">
        {/* Title bar */}
        <div className="px-3.5 py-2 bg-[#F7FAF8] border-b border-[#D4E0DA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#B45309]" />
            <span
              className="text-[9px] font-bold text-[#8FA89F] uppercase tracking-widest"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Archive
            </span>
          </div>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4E0DA]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4E0DA]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4E0DA]" />
          </div>
        </div>
        {/* Search bar */}
        <div className="px-3 pt-2.5 pb-1.5">
          <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#F0F4F2] rounded-lg border border-[#D4E0DA]">
            <div className="w-3 h-3 rounded-full border border-[#8FA89F]" />
            <div className="h-1.5 w-20 bg-[#D4E0DA] rounded-full" />
          </div>
        </div>
        {/* Meeting items */}
        <div className="p-2.5 space-y-1.5">
          {[
            { title: "Sprint Planning", date: "Jan 15", issues: 8, color: "#B45309", status: "done" },
            { title: "Design Review", date: "Jan 14", issues: 5, color: "#15803D", status: "done" },
            { title: "Tech Standup", date: "Jan 13", issues: 3, color: "#D97706", status: "done" },
            { title: "Client Sync", date: "Jan 12", issues: 6, color: "#3D5249", status: "done" },
            { title: "Retro Q4", date: "Jan 11", issues: 4, color: "#B45309", status: "done" },
            { title: "Kick-off Q1", date: "Jan 10", issues: 7, color: "#15803D", status: "pending" },
            { title: "Budget Review", date: "Jan 9", issues: 2, color: "#D97706", status: "done" },
          ].map((m, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-2 rounded-lg bg-[#F7FAF8]/80 border border-[#D4E0DA]/40"
            >
              <div
                className="w-0.5 h-7 rounded-full flex-shrink-0"
                style={{ backgroundColor: m.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-[#0C1A15] truncate">
                  {m.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[8px] text-[#8FA89F]">{m.date}</span>
                  <span className="text-[8px] text-[#8FA89F]">·</span>
                  <span
                    className="text-[8px] font-medium px-1 py-px rounded"
                    style={{
                      color: m.color,
                      backgroundColor: m.color + "15",
                    }}
                  >
                    {m.issues} issues
                  </span>
                </div>
              </div>
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                  m.status === "done"
                    ? "bg-[#15803D]/10"
                    : "bg-[#D97706]/10"
                }`}
              >
                {m.status === "done" ? (
                  <svg className="w-2.5 h-2.5 text-[#15803D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const AnalyticsBg = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none p-3 pt-3 pb-0">
    <div
      className={[
        "w-full",
        "opacity-30 group-hover:opacity-100",
        "scale-100 group-hover:scale-[1.01]",
        "transition-all duration-700 ease-out transform-gpu",
      ].join(" ")}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-[#D4E0DA] overflow-hidden">
        {/* Title bar */}
        <div className="px-3.5 py-2 bg-[#F7FAF8] border-b border-[#D4E0DA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#15803D]" />
            <span
              className="text-[9px] font-bold text-[#8FA89F] uppercase tracking-widest"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Analytics
            </span>
          </div>
          <div className="flex gap-1.5">
            <div className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-[#FEF3C7] text-[#B45309]">
              7D
            </div>
            <div className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-[#F0F4F2] text-[#8FA89F]">
              30D
            </div>
          </div>
        </div>
        {/* KPI row */}
        <div className="px-3.5 pt-3 pb-2 flex gap-2">
          {[
            { label: "Tasks", value: "128", change: "+12%", color: "#15803D" },
            { label: "Approved", value: "94%", change: "+3%", color: "#B45309" },
            { label: "Avg Time", value: "2.4h", change: "-18%", color: "#D97706" },
          ].map((kpi, i) => (
            <div
              key={i}
              className="flex-1 p-2 rounded-lg bg-[#F7FAF8] border border-[#D4E0DA]/40"
            >
              <p className="text-[8px] text-[#8FA89F] uppercase tracking-wider">
                {kpi.label}
              </p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-bold text-[#0C1A15]">
                  {kpi.value}
                </span>
                <span
                  className="text-[8px] font-semibold"
                  style={{ color: kpi.color }}
                >
                  {kpi.change}
                </span>
              </div>
            </div>
          ))}
        </div>
        {/* Bar chart */}
        <div className="px-3.5 pb-3">
          <div className="bg-[#F7FAF8] rounded-lg border border-[#D4E0DA]/40 p-3">
            <div className="flex items-end justify-between gap-1.5 h-24">
              {[45, 72, 55, 88, 62, 95, 78, 40, 85, 70, 58, 92].map(
                (h, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full rounded-t transition-all duration-500"
                      style={{
                        height: `${h}%`,
                        backgroundColor:
                          i === 5 || i === 11
                            ? "#B45309"
                            : i % 3 === 0
                            ? "#D97706" + "40"
                            : "#D4E0DA",
                      }}
                    />
                  </div>
                )
              )}
            </div>
            <div className="flex justify-between mt-1.5 px-0.5">
              {[
                "J","F","M","A","M","J","J","A","S","O","N","D",
              ].map((m, i) => (
                <span
                  key={i}
                  className="text-[6px] text-[#8FA89F] font-medium"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Sparkline row */}
        <div className="px-3.5 pb-3 flex gap-2">
          <div className="flex-1 p-2 rounded-lg bg-[#F7FAF8] border border-[#D4E0DA]/40">
            <p className="text-[8px] text-[#8FA89F]">Efficiency</p>
            <svg viewBox="0 0 100 24" className="w-full h-5 mt-1">
              <polyline
                fill="none"
                stroke="#B45309"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,20 10,16 20,18 30,12 40,14 50,8 60,10 70,6 80,8 90,4 100,2"
              />
              <polyline
                fill="url(#sparkGrad)"
                stroke="none"
                points="0,24 0,20 10,16 20,18 30,12 40,14 50,8 60,10 70,6 80,8 90,4 100,2 100,24"
              />
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B45309" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="flex-1 p-2 rounded-lg bg-[#F7FAF8] border border-[#D4E0DA]/40">
            <p className="text-[8px] text-[#8FA89F]">Volume</p>
            <svg viewBox="0 0 100 24" className="w-full h-5 mt-1">
              <polyline
                fill="none"
                stroke="#15803D"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="0,18 12,14 25,16 38,10 50,12 62,6 75,8 88,4 100,6"
              />
              <polyline
                fill="url(#sparkGrad2)"
                stroke="none"
                points="0,24 0,18 12,14 25,16 38,10 50,12 62,6 75,8 88,4 100,6 100,24"
              />
              <defs>
                <linearGradient id="sparkGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#15803D" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#15803D" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const HumanValidationBg = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none p-3 pt-3 pb-0">
    <div
      className={[
        "w-full",
        "opacity-30 group-hover:opacity-100",
        "scale-[0.97] group-hover:scale-100",
        "transition-all duration-700 ease-out transform-gpu",
        "origin-top",
      ].join(" ")}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-[#D4E0DA] overflow-hidden">
        <div className="px-3.5 py-2 bg-[#F7FAF8] border-b border-[#D4E0DA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D97706]" />
            <span
              className="text-[9px] font-bold text-[#8FA89F] uppercase tracking-widest"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Review Queue
            </span>
          </div>
          <span className="text-[8px] font-bold text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded">
            3 pending
          </span>
        </div>
        <div className="p-2.5 space-y-1.5">
          {[
            {
              task: "Setup CI/CD pipeline",
              type: "GitHub Issue",
              labels: ["infra", "priority"],
              status: "pending",
            },
            {
              task: "Update API docs",
              type: "Trello Card",
              labels: ["docs"],
              status: "approved",
            },
            {
              task: "Schedule retro",
              type: "Calendar",
              labels: ["meeting"],
              status: "pending",
            },
            {
              task: "Fix token refresh",
              type: "GitHub Issue",
              labels: ["bug"],
              status: "rejected",
            },
          ].map((t, i) => (
            <div
              key={i}
              className={`p-2 rounded-lg border ${
                t.status === "approved"
                  ? "bg-[#15803D]/[0.03] border-[#15803D]/20"
                  : t.status === "rejected"
                  ? "bg-[#B91C1C]/[0.03] border-[#B91C1C]/15"
                  : "bg-[#F7FAF8] border-[#D4E0DA]/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-semibold text-[#0C1A15] truncate">
                    {t.task}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[7px] font-medium text-[#8FA89F] bg-[#F0F4F2] px-1 py-px rounded">
                      {t.type}
                    </span>
                    {t.labels.map((l, li) => (
                      <span
                        key={li}
                        className="text-[7px] font-semibold text-[#D97706] bg-[#FEF3C7] px-1 py-px rounded"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {t.status === "approved" ? (
                    <div className="w-5 h-5 rounded-md bg-[#15803D] flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                  ) : t.status === "rejected" ? (
                    <div className="w-5 h-5 rounded-md bg-[#B91C1C] flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </div>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-md bg-[#15803D]/10 flex items-center justify-center">
                        <svg className="w-3 h-3 text-[#15803D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <div className="w-5 h-5 rounded-md bg-[#B91C1C]/10 flex items-center justify-center">
                        <svg className="w-3 h-3 text-[#B91C1C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const IntegrationHubBg = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none p-3 pt-3 pb-0">
    <div
      className={[
        "w-full",
        "opacity-30 group-hover:opacity-100",
        "scale-[0.97] group-hover:scale-100",
        "transition-all duration-700 ease-out transform-gpu",
        "origin-top",
      ].join(" ")}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-[#D4E0DA] overflow-hidden">
        <div className="px-3.5 py-2 bg-[#F7FAF8] border-b border-[#D4E0DA] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#3D5249]" />
          <span
            className="text-[9px] font-bold text-[#8FA89F] uppercase tracking-widest"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Integrations
          </span>
        </div>
        <div className="p-2.5 grid grid-cols-3 gap-1.5">
          {[
            { name: "GitHub", letter: "G", color: "#0C1A15", connected: true },
            { name: "Trello", letter: "T", color: "#3D5249", connected: true },
            { name: "Notion", letter: "N", color: "#0C1A15", connected: true },
            { name: "Calendar", letter: "C", color: "#B45309", connected: false },
            { name: "Discord", letter: "D", color: "#3D5249", connected: false },
            { name: "Slack", letter: "S", color: "#15803D", connected: false },
          ].map((int, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[#F7FAF8] border border-[#D4E0DA]/40"
            >
              <div className="relative">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ backgroundColor: int.color }}
                >
                  {int.letter}
                </div>
                {int.connected && (
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#15803D] border-[1.5px] border-white flex items-center justify-center">
                    <svg className="w-1.5 h-1.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                )}
              </div>
              <span className="text-[7px] font-medium text-[#3D5249]">
                {int.name}
              </span>
            </div>
          ))}
        </div>
        <div className="px-2.5 pb-2.5">
          <div className="rounded-lg bg-[#F0F4F2] border border-[#D4E0DA]/30 p-2 flex items-center justify-between">
            <span className="text-[7px] text-[#8FA89F]">3 / 6 connected</span>
            <div className="flex gap-0.5">
              {[1, 1, 1, 0, 0, 0].map((c, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    c ? "bg-[#15803D]" : "bg-[#D4E0DA]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const NotificationsBg = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none p-3 pt-3 pb-0">
    <div
      className={[
        "w-full",
        "opacity-30 group-hover:opacity-100",
        "scale-100 group-hover:scale-[1.01]",
        "transition-all duration-700 ease-out transform-gpu",
      ].join(" ")}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-[#D4E0DA] overflow-hidden">
        <div className="px-3.5 py-2 bg-[#F7FAF8] border-b border-[#D4E0DA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D97706]" />
            <span
              className="text-[9px] font-bold text-[#8FA89F] uppercase tracking-widest"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Notifications
            </span>
          </div>
          <span className="text-[7px] font-bold text-white bg-[#B91C1C] px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
            5
          </span>
        </div>
        <div className="p-2.5 space-y-1.5">
          {[
            { Icon: AlertTriangle, title: "3 tasks need review", sub: "Sprint Planning meeting", time: "2m ago", color: "#D97706", bg: "#FEF3C7" },
            { Icon: CheckCircle2, title: "PR #42 merged", sub: "feat/auth-flow → main", time: "15m ago", color: "#15803D", bg: "#E8F0EC" },
            { Icon: PlugZap, title: "Discord disconnected", sub: "Webhook expired", time: "1h ago", color: "#B91C1C", bg: "#FEE2E2" },
            { Icon: CalendarDays, title: "Client call scheduled", sub: "Tomorrow at 10:00 AM", time: "2h ago", color: "#B45309", bg: "#FEF3C7" },
            { Icon: ClipboardList, title: "6 Trello cards created", sub: "Design Review meeting", time: "3h ago", color: "#15803D", bg: "#E8F0EC" },
            { Icon: BellRing, title: "Issue #18 overdue", sub: "Setup monitoring", time: "5h ago", color: "#D97706", bg: "#FEF3C7" },
          ].map((n, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 p-2 rounded-lg border ${
                i === 0
                  ? "bg-[#FEF3C7]/30 border-[#D97706]/15"
                  : "bg-[#F7FAF8]/50 border-[#D4E0DA]/40"
              }`}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: n.bg }}
              >
                <n.Icon className="w-3.5 h-3.5" style={{ color: n.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-semibold text-[#0C1A15] truncate">
                  {n.title}
                </p>
                <p className="text-[7px] text-[#8FA89F] mt-0.5 truncate">
                  {n.sub}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[7px] text-[#8FA89F]">{n.time}</span>
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: n.color }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="px-3.5 py-2 border-t border-[#D4E0DA] bg-[#F7FAF8]">
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-[#8FA89F]">
              View all notifications
            </span>
            <svg className="w-3 h-3 text-[#8FA89F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </div>
        </div>
      </div>
    </div>
  </div>
);


/* ═══════════════════════════════════════════════════ */

const features = [
  {
    Icon: FileTextIcon,
    name: "Meeting History & Archive",
    description:
      "Every processed meeting is saved and searchable. Trace any GitHub issue back to the exact meeting it was discussed in.",
    href: "/dashboard/history",
    cta: "View History",
    background: <MeetingHistoryBg />,
    className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
  },
  {
    Icon: BarChartIcon,
    name: "Analytics & Insights",
    description:
      "Track task approval rates, team workload, and meeting efficiency with live charts.",
    href: "/dashboard/analytics",
    cta: "View Analytics",
    background: <AnalyticsBg />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
  },
  {
    Icon: CheckCircledIcon,
    name: "Human Validation",
    description:
      "Review, edit, approve or reject every AI-generated task before it reaches GitHub or Trello.",
    href: "/dashboard/validate",
    cta: "Review Tasks",
    background: <HumanValidationBg />,
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
  },
  {
    Icon: GlobeIcon,
    name: "Integration Hub",
    description:
      "Connect GitHub, Trello, Discord, and Notion from one settings page. No code required.",
    href: "/dashboard/integrations",
    cta: "Manage Integrations",
    background: <IntegrationHubBg />,
    className: "lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: BellIcon,
    name: "Notification Centre",
    description:
      "Get alerted when validation is needed, tasks are overdue, or integrations disconnect.",
    href: "/dashboard/notifications",
    cta: "View Notifications",
    background: <NotificationsBg />,
    className: "lg:col-start-3 lg:col-end-4 lg:row-start-2 lg:row-end-4",
  },
];

function BentoDemo() {
  return (
    <BentoGrid className="lg:grid-rows-3 pb-8">
      {features.map((feature) => (
        <BentoCard key={feature.name} {...feature} />
      ))}
    </BentoGrid>
  );
}

export { BentoDemo };