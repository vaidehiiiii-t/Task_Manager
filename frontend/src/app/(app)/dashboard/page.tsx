"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  FolderKanban,
  ListTodo,
  AlertTriangle,
  User,
  ArrowRight,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  delay,
}: {
  title: string;
  value: number | string;
  icon: any;
  description?: string;
  delay: number;
}) {
  return (
    <div
      className="card-surface p-6 animate-fade-up opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-mono-label text-[#999]">{title}</p>
          <p
            className="text-4xl font-light mt-2 text-black animate-count-up"
            style={{ letterSpacing: '-1.2px', animationDelay: `${delay + 200}ms`, animationFillMode: 'forwards' }}
          >
            {value}
          </p>
          {description && (
            <p className="text-xs text-[#999] mt-2" style={{ fontWeight: 340 }}>
              {description}
            </p>
          )}
        </div>
        <div className="btn-circle bg-[rgba(0,0,0,0.04)] flex-shrink-0">
          <Icon className="h-4 w-4 text-[#666]" />
        </div>
      </div>
    </div>
  );
}

function StatusBar({ label, count, total, isActive }: { label: string; count: number; total: number; isActive?: boolean }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#666]" style={{ fontWeight: 400 }}>{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-black" style={{ fontWeight: 540 }}>{count}</span>
          <span className="text-xs text-[#ccc]">({pct}%)</span>
        </div>
      </div>
      <div className="h-1 rounded-full bg-[rgba(0,0,0,0.06)] overflow-hidden">
        <div
          className="h-full rounded-full bg-black transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            opacity: isActive ? 1 : 0.3,
          }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.get().then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-10 w-64 skeleton" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 stagger">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 skeleton" />
          ))}
        </div>
      </div>
    );
  }

  const totalDone = data?.tasksByStatus?.DONE ?? 0;
  const totalTasks = data?.totalTasks ?? 0;
  const completionRate = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 17
      ? "Good afternoon"
      : "Good evening";

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="animate-fade-up" style={{ animationFillMode: 'forwards' }}>
        <p className="text-mono-label text-[#999]">{greeting}</p>
        <h1
          className="text-heading text-black mt-2"
          style={{ fontSize: 'clamp(2rem, 3.5rem, 3.5rem)' }}
        >
          {user?.name?.split(" ")[0]}
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Projects"
          value={data?.totalProjects ?? 0}
          icon={FolderKanban}
          description="Active workspaces"
          delay={0}
        />
        <StatCard
          title="Tasks"
          value={data?.totalTasks ?? 0}
          icon={ListTodo}
          description="Across all projects"
          delay={80}
        />
        <StatCard
          title="Overdue"
          value={data?.overdueTasks ?? 0}
          icon={AlertTriangle}
          description="Need attention"
          delay={160}
        />
        <StatCard
          title="Assigned"
          value={data?.myAssignedTasks ?? 0}
          icon={User}
          description="My tasks"
          delay={240}
        />
      </div>

      {/* Middle section: Status + Completion + Users */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status breakdown */}
        <div className="card-surface p-6 animate-fade-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
          <p className="text-mono-label text-[#999] mb-6">Tasks by Status</p>
          <div className="space-y-5">
            <StatusBar label="To Do" count={data?.tasksByStatus?.TODO ?? 0} total={totalTasks} />
            <StatusBar label="In Progress" count={data?.tasksByStatus?.IN_PROGRESS ?? 0} total={totalTasks} isActive />
            <StatusBar label="Done" count={totalDone} total={totalTasks} />
          </div>
        </div>

        {/* Tasks by User */}
        <div className="card-surface p-6 animate-fade-up opacity-0" style={{ animationDelay: '340ms', animationFillMode: 'forwards' }}>
          <p className="text-mono-label text-[#999] mb-6">Tasks by User</p>
          <div className="space-y-4 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
            {Object.entries(data?.tasksByUser || {}).length > 0 ? (
              Object.entries(data.tasksByUser).map(([name, count]: any) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-[rgba(0,0,0,0.06)] text-black flex items-center justify-center text-[10px] font-medium">
                      {name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <span className="text-sm text-black" style={{ fontWeight: 480, letterSpacing: '-0.14px' }}>{name}</span>
                  </div>
                  <span className="text-sm text-[#666]" style={{ fontWeight: 400 }}>{count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#ccc]" style={{ fontWeight: 340 }}>No tasks assigned</p>
            )}
          </div>
        </div>

        {/* Completion ring */}
        <div className="card-surface p-6 flex flex-col items-center justify-center animate-fade-up opacity-0" style={{ animationDelay: '380ms', animationFillMode: 'forwards' }}>
          <p className="text-mono-label text-[#999] mb-6">Completion</p>
          <div className="relative flex items-center justify-center">
            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke="rgba(0,0,0,0.06)"
                strokeWidth="1.5"
              />
              <circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke="#000000"
                strokeWidth="1.5"
                strokeDasharray={`${completionRate} ${100 - completionRate}`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-light text-black" style={{ letterSpacing: '-1px' }}>
                {completionRate}%
              </span>
              <span className="text-mono-small text-[#999] mt-1">Done</span>
            </div>
          </div>
          <p className="text-xs text-[#999] mt-5" style={{ fontWeight: 340 }}>
            {totalDone} of {totalTasks} tasks completed
          </p>
        </div>
      </div>

      {/* Recent Tasks */}
      {data?.recentTasks?.length > 0 && (
        <div className="animate-fade-up opacity-0" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-mono-label text-[#999]">Recent Tasks</p>
            <Link
              href="/projects"
              className="text-xs text-[#999] hover:text-black flex items-center gap-1 transition-smooth underline underline-offset-3"
              style={{ fontWeight: 400 }}
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="card-surface divide-y divide-black/6 overflow-hidden">
            {data.recentTasks.map((task: any, i: number) => (
              <div
                key={task.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-[rgba(0,0,0,0.02)] transition-smooth animate-slide-right opacity-0"
                style={{ animationDelay: `${500 + i * 60}ms`, animationFillMode: 'forwards' }}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-black truncate" style={{ fontWeight: 480, letterSpacing: '-0.14px' }}>
                    {task.title}
                  </p>
                  <p className="text-xs text-[#999] mt-0.5" style={{ fontWeight: 340 }}>
                    {task.projectName}
                    {task.dueDate && <> · {format(new Date(task.dueDate), "MMM d")}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={
                    task.priority === "HIGH" ? "tag-priority-high" :
                    task.priority === "MEDIUM" ? "tag-priority-medium" : "tag-priority-low"
                  }>
                    {task.priority}
                  </span>
                  <span className={
                    task.status === "DONE" ? "tag-status-done" :
                    task.status === "IN_PROGRESS" ? "tag-status-in-progress" : "tag-status-todo"
                  }>
                    {task.status === "IN_PROGRESS" ? "In Progress" : task.status === "TODO" ? "To Do" : "Done"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {data?.totalProjects === 0 && (
        <div className="card-surface border-dashed flex flex-col items-center justify-center py-20 gap-5 animate-scale-in">
          <div className="btn-circle bg-[rgba(0,0,0,0.04)]">
            <FolderKanban className="h-5 w-5 text-[#999]" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-black" style={{ fontWeight: 540 }}>No projects yet</p>
            <p className="text-sm text-[#999] mt-1" style={{ fontWeight: 340 }}>
              Create your first project to start tracking tasks.
            </p>
          </div>
          <Link href="/projects" className="btn-pill btn-pill-black text-sm">
            Go to Projects
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
