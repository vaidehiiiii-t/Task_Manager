"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi, tasksApi } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, MoreVertical, Trash2, UserPlus, Users, ChevronLeft, Loader2, CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

// ─── Task Card ───
function TaskCard({
  task, isAdmin, members, projectId, index,
}: {
  task: any; isAdmin: boolean; members: any[]; projectId: string; index: number;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const { user } = useAuth();
  const isAssigned = task.assignedTo?.id === user?.id;
  const canEdit = isAdmin || isAssigned;

  const updateMutation = useMutation({
    mutationFn: (data: any) => tasksApi.update(projectId, task.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Update failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(projectId, task.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task deleted");
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Delete failed"),
  });

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  return (
    <>
      <div
        className="card-surface p-4 group animate-fade-up opacity-0"
        style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-black flex-1" style={{ fontWeight: 480, letterSpacing: '-0.14px' }}>
            {task.title}
          </p>
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-smooth inline-flex items-center justify-center hover:bg-[rgba(0,0,0,0.06)]">
                <MoreVertical className="h-3.5 w-3.5 text-[#999]" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border border-black/10 rounded-lg shadow-lg">
                <DropdownMenuItem onClick={() => setEditing(true)} className="cursor-pointer">Edit</DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => deleteMutation.mutate()} className="cursor-pointer text-red-600">
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {task.description && (
          <p className="text-xs text-[#999] mt-2 line-clamp-2" style={{ fontWeight: 340 }}>
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-3">
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`cursor-pointer hover:opacity-80 transition-smooth outline-none ${
                  task.status === "DONE" ? "tag-status-done" : task.status === "IN_PROGRESS" ? "tag-status-in-progress" : "tag-status-todo"
                }`}
              >
                {task.status === "IN_PROGRESS" ? "In Progress" : task.status === "TODO" ? "To Do" : "Done"}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white border border-black/10 rounded-lg shadow-lg">
                <DropdownMenuItem onClick={() => updateMutation.mutate({ status: "TODO" })} className="cursor-pointer text-xs">To Do</DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateMutation.mutate({ status: "IN_PROGRESS" })} className="cursor-pointer text-xs">In Progress</DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateMutation.mutate({ status: "DONE" })} className="cursor-pointer text-xs">Done</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <span className={task.priority === "HIGH" ? "tag-priority-high" : task.priority === "MEDIUM" ? "tag-priority-medium" : "tag-priority-low"}>
            {task.priority}
          </span>
          {isOverdue && <span className="tag-overdue">Overdue</span>}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/6">
          {task.assignedTo ? (
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-medium">
                {task.assignedTo.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <span className="text-xs text-[#999]" style={{ fontWeight: 340 }}>{task.assignedTo.name}</span>
            </div>
          ) : (
            <span className="text-xs text-[#ccc]" style={{ fontWeight: 340 }}>Unassigned</span>
          )}
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-xs ${isOverdue ? "text-black font-medium" : "text-[#999]"}`} style={{ fontWeight: isOverdue ? 480 : 340 }}>
              <CalendarDays className="h-3 w-3" />
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="bg-white border border-black/10 rounded-xl shadow-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg" style={{ fontWeight: 540, letterSpacing: '-0.26px' }}>Edit Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            initial={task} members={members} isAdmin={isAdmin}
            onSubmit={(data) => { updateMutation.mutate(data); setEditing(false); }}
            onCancel={() => setEditing(false)} loading={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Task Form ───
function TaskForm({
  initial, members, isAdmin, onSubmit, onCancel, loading,
}: {
  initial?: any; members: any[]; isAdmin: boolean;
  onSubmit: (data: any) => void; onCancel: () => void; loading: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ? format(new Date(initial.dueDate), "yyyy-MM-dd") : "");
  const [priority, setPriority] = useState(initial?.priority ?? "MEDIUM");
  const [status, setStatus] = useState(initial?.status ?? "TODO");
  const [assignedToId, setAssignedToId] = useState(initial?.assignedTo?.id ?? "none");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {};
    if (isAdmin) {
      if (title) data.title = title;
      if (description !== undefined) data.description = description;
      if (dueDate) data.dueDate = new Date(dueDate).toISOString();
      if (priority) data.priority = priority;
      if (assignedToId !== "none") data.assignedToId = assignedToId;
      else if (assignedToId === "none" && initial?.assignedTo) data.assignedToId = null;
    }
    data.status = status;
    onSubmit(data);
  };

  const inputCls = "w-full px-4 py-3 rounded-lg border border-black/12 bg-white text-black text-sm placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-black/20 transition-smooth";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      {isAdmin && (
        <>
          <div>
            <label className="text-mono-label text-[#999] mb-1.5 block">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputCls} style={{ letterSpacing: '-0.14px' }} />
          </div>
          <div>
            <label className="text-mono-label text-[#999] mb-1.5 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-mono-label text-[#999] mb-1.5 block">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-mono-label text-[#999] mb-1.5 block">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-[46px] rounded-lg border-black/12 bg-white text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-black/10 rounded-lg shadow-lg">
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-mono-label text-[#999] mb-1.5 block">Assign To</label>
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger className="h-[46px] rounded-lg border-black/12 bg-white text-sm">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-black/10 rounded-lg shadow-lg">
                <SelectItem value="none">Unassigned</SelectItem>
                {members.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      <div>
        <label className="text-mono-label text-[#999] mb-1.5 block">Status</label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-[46px] rounded-lg border-black/12 bg-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border border-black/10 rounded-lg shadow-lg">
            <SelectItem value="TODO">To Do</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="DONE">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-3 justify-end pt-3">
        <button type="button" onClick={onCancel} className="btn-pill btn-pill-glass-dark text-sm">Cancel</button>
        <button type="submit" disabled={loading} className="btn-pill btn-pill-black text-sm">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Save
        </button>
      </div>
    </form>
  );
}

// ─── Main ───
export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [addMemberEmail, setAddMemberEmail] = useState("");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"board" | "members">("board");

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.get(id).then((r) => r.data),
  });

  const isAdmin = project?.myRole === "ADMIN";

  const createTaskMutation = useMutation({
    mutationFn: (data: any) => tasksApi.create(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Task created");
      setCreateOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed"),
  });

  const addMemberMutation = useMutation({
    mutationFn: () => projectsApi.addMember(id, addMemberEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Member added");
      setAddMemberOpen(false);
      setAddMemberEmail("");
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => projectsApi.removeMember(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Member removed");
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed"),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: () => projectsApi.delete(id),
    onSuccess: () => { toast.success("Project deleted"); router.push("/projects"); },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed"),
  });

  const tasksByStatus = (s: string) => project?.tasks?.filter((t: any) => t.status === s) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 skeleton" />
        <div className="grid grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 skeleton" />)}
        </div>
      </div>
    );
  }

  const statusCols = [
    { key: "TODO", label: "To Do", count: tasksByStatus("TODO").length },
    { key: "IN_PROGRESS", label: "In Progress", count: tasksByStatus("IN_PROGRESS").length },
    { key: "DONE", label: "Done", count: tasksByStatus("DONE").length },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap animate-fade-up" style={{ animationFillMode: 'forwards' }}>
        <div className="flex items-start gap-3">
          <Link href="/projects">
            <button className="btn-circle bg-[rgba(0,0,0,0.04)] hover:bg-[rgba(0,0,0,0.08)] transition-smooth mt-1">
              <ChevronLeft className="h-4 w-4 text-[#666]" />
            </button>
          </Link>
          <div>
            <p className="text-mono-label text-[#999]">Project</p>
            <h1 className="text-2xl text-black mt-1" style={{ fontWeight: 540, letterSpacing: '-0.26px' }}>
              {project?.name}
            </h1>
            {project?.description && (
              <p className="text-sm text-[#999] mt-1" style={{ fontWeight: 340 }}>{project.description}</p>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
              <DialogTrigger className="btn-pill btn-pill-glass-dark text-sm">
                <UserPlus className="h-4 w-4" />
                Add Member
              </DialogTrigger>
              <DialogContent className="bg-white border border-black/10 rounded-xl shadow-2xl sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle style={{ fontWeight: 540 }}>Add Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-mono-label text-[#999] mb-1.5 block">Email</label>
                    <input
                      type="email" placeholder="member@example.com"
                      value={addMemberEmail} onChange={(e) => setAddMemberEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-black/12 bg-white text-black text-sm placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-black/20 transition-smooth"
                    />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button onClick={() => setAddMemberOpen(false)} className="btn-pill btn-pill-glass-dark text-sm">Cancel</button>
                    <button onClick={() => addMemberMutation.mutate()} disabled={addMemberMutation.isPending} className="btn-pill btn-pill-black text-sm">
                      {addMemberMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Add
                    </button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger id="create-task-btn" className="btn-pill btn-pill-black text-sm">
                <Plus className="h-4 w-4" />
                New Task
              </DialogTrigger>
              <DialogContent className="bg-white border border-black/10 rounded-xl shadow-2xl sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle style={{ fontWeight: 540 }}>Create Task</DialogTitle>
                </DialogHeader>
                <TaskForm
                  members={project?.members ?? []} isAdmin={isAdmin}
                  onSubmit={(data) => createTaskMutation.mutate(data)}
                  onCancel={() => setCreateOpen(false)} loading={createTaskMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Pill Tab Bar */}
      <div className="flex items-center gap-1 bg-[#f5f5f5] rounded-full p-1 w-fit animate-fade-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
        <button
          onClick={() => setActiveTab("board")}
          className={`tab-pill ${activeTab === "board" ? "tab-pill-active" : ""}`}
        >
          Task Board
        </button>
        <button
          onClick={() => setActiveTab("members")}
          className={`tab-pill ${activeTab === "members" ? "tab-pill-active" : ""}`}
        >
          Members ({project?.members?.length ?? 0})
        </button>
      </div>

      {/* Board Tab */}
      {activeTab === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          {statusCols.map(({ key, label, count }) => {
            const tasks = tasksByStatus(key);
            return (
              <div key={key} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${key === "DONE" ? "bg-black" : key === "IN_PROGRESS" ? "bg-[#999]" : "bg-[#ddd]"}`} />
                    <span className="text-sm text-[#666]" style={{ fontWeight: 480 }}>{label}</span>
                  </div>
                  <span className="text-mono-small text-[#ccc] bg-[rgba(0,0,0,0.04)] rounded-full px-2 py-0.5">
                    {count}
                  </span>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {tasks.map((task: any, i: number) => (
                    <TaskCard
                      key={task.id} task={task} isAdmin={isAdmin}
                      members={project?.members ?? []} projectId={id} index={i}
                    />
                  ))}
                  {tasks.length === 0 && (
                    <div className="border border-dashed border-black/10 rounded-lg h-20 flex items-center justify-center">
                      <p className="text-xs text-[#ccc]" style={{ fontWeight: 340 }}>No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="max-w-2xl animate-fade-in">
          <div className="card-surface overflow-hidden">
            <div className="px-6 py-4 border-b border-black/6 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#999]" />
              <span className="text-mono-label text-[#999]">Team Members</span>
            </div>
            <div className="divide-y divide-black/6">
              {project?.members?.map((member: any, i: number) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-[rgba(0,0,0,0.02)] transition-smooth animate-slide-right opacity-0"
                  style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-medium">
                      {member.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm text-black" style={{ fontWeight: 480 }}>{member.name}</p>
                      <p className="text-xs text-[#999]" style={{ fontWeight: 340 }}>{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={member.role === "ADMIN" ? "tag-priority-high" : "tag-priority-low"}>
                      {member.role}
                    </span>
                    {isAdmin && member.id !== user?.id && (
                      <button
                        onClick={() => removeMemberMutation.mutate(member.id)}
                        className="btn-circle h-7 w-7 bg-transparent hover:bg-[rgba(0,0,0,0.06)] transition-smooth"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-[#ccc] hover:text-black" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {isAdmin && (
              <div className="px-6 py-4 border-t border-black/6">
                <button onClick={() => setAddMemberOpen(true)} className="btn-pill btn-pill-glass-dark text-sm w-full justify-center">
                  <UserPlus className="h-4 w-4" />
                  Add Member
                </button>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="card-surface border-black/20 mt-6 p-6">
              <p className="text-mono-label text-[#999] mb-3">Danger Zone</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-black" style={{ fontWeight: 480 }}>Delete this project</p>
                  <p className="text-xs text-[#999] mt-0.5" style={{ fontWeight: 340 }}>This action cannot be undone.</p>
                </div>
                <button
                  onClick={() => { if (confirm("Delete this project? This cannot be undone.")) deleteProjectMutation.mutate(); }}
                  disabled={deleteProjectMutation.isPending}
                  className="btn-pill btn-pill-black text-sm"
                >
                  {deleteProjectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
