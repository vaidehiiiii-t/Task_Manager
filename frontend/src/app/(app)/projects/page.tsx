"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { FolderKanban, Plus, Users, ListTodo, ArrowRight, Loader2 } from "lucide-react";

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => projectsApi.create({ name, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Project created");
      setOpen(false);
      setName("");
      setDescription("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to create project");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate();
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between animate-fade-up" style={{ animationFillMode: 'forwards' }}>
        <div>
          <p className="text-mono-label text-[#999]">Workspace</p>
          <h1 className="text-heading text-black mt-2" style={{ fontSize: '2.5rem' }}>Projects</h1>
          <p className="text-sm text-[#999] mt-1" style={{ fontWeight: 340 }}>
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            id="create-project-btn"
            className="btn-pill btn-pill-black text-sm"
          >
            <Plus className="h-4 w-4" />
            New Project
          </DialogTrigger>
          <DialogContent className="bg-white border border-black/10 rounded-xl shadow-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-medium text-black" style={{ fontWeight: 540, letterSpacing: '-0.26px' }}>
                Create Project
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-5 mt-4">
              <div>
                <label className="text-mono-label text-[#999] mb-1.5 block">Name</label>
                <input
                  id="proj-name"
                  placeholder="e.g. Marketing Campaign"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-black/12 bg-white text-black text-sm placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-black/20 transition-smooth"
                  style={{ letterSpacing: '-0.14px' }}
                />
              </div>
              <div>
                <label className="text-mono-label text-[#999] mb-1.5 block">Description</label>
                <textarea
                  id="proj-desc"
                  placeholder="What is this project about?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-black/12 bg-white text-black text-sm placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-black/20 transition-smooth resize-none"
                  style={{ letterSpacing: '-0.14px' }}
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-pill btn-pill-glass-dark text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-pill btn-pill-black text-sm"
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 skeleton" />
          ))}
        </div>
      )}

      {/* Project Grid */}
      {!isLoading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
          {projects.map((project: any, i: number) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div
                className="card-surface p-6 h-full cursor-pointer group animate-fade-up opacity-0"
                style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'forwards' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="btn-circle bg-[rgba(0,0,0,0.04)] group-hover:bg-black group-hover:text-white transition-smooth">
                    <FolderKanban className="h-4 w-4" />
                  </div>
                  <span className={`text-mono-small ${
                    project.role === "ADMIN" ? "tag-priority-high" : "tag-priority-low"
                  }`}>
                    {project.role}
                  </span>
                </div>

                <h3
                  className="text-base font-medium text-black group-hover:underline underline-offset-3 transition-smooth"
                  style={{ fontWeight: 540, letterSpacing: '-0.14px' }}
                >
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-sm text-[#999] mt-1 line-clamp-2" style={{ fontWeight: 340 }}>
                    {project.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-black/6">
                  <div className="flex items-center gap-4 text-xs text-[#999]" style={{ fontWeight: 400 }}>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {project.memberCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <ListTodo className="h-3 w-3" />
                      {project.taskCount}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#ccc] group-hover:text-black group-hover:translate-x-1 transition-smooth" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && projects.length === 0 && (
        <div className="card-surface border-dashed flex flex-col items-center justify-center py-20 gap-5 animate-scale-in">
          <div className="btn-circle bg-[rgba(0,0,0,0.04)]">
            <FolderKanban className="h-5 w-5 text-[#999]" />
          </div>
          <div className="text-center">
            <p className="text-sm text-black" style={{ fontWeight: 540 }}>No projects yet</p>
            <p className="text-sm text-[#999] mt-1" style={{ fontWeight: 340 }}>
              Create your first project to start collaborating.
            </p>
          </div>
          <button onClick={() => setOpen(true)} className="btn-pill btn-pill-black text-sm">
            <Plus className="h-4 w-4" />
            Create Project
          </button>
        </div>
      )}
    </div>
  );
}
