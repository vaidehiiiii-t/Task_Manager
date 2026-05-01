"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2, ArrowRight, LayoutDashboard, FolderKanban, ListTodo, Users, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Left — Hero Gradient */}
      <div className="hidden lg:flex lg:w-1/2 hero-gradient items-center justify-center p-16 relative overflow-hidden">
        {/* Parallax Background Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <LayoutDashboard className="absolute top-[15%] left-[20%] w-24 h-24 text-white/5 animate-float-slow" />
          <FolderKanban className="absolute top-[60%] left-[10%] w-32 h-32 text-white/5 animate-float-medium" />
          <ListTodo className="absolute top-[30%] right-[15%] w-20 h-20 text-white/5 animate-float-fast" />
          <Users className="absolute bottom-[20%] right-[20%] w-28 h-28 text-white/5 animate-float-slow" style={{ animationDelay: '-5s' }} />
          <CheckCircle2 className="absolute top-[10%] right-[30%] w-16 h-16 text-white/5 animate-float-medium" style={{ animationDelay: '-10s' }} />
        </div>

        <div className="max-w-md animate-fade-up relative z-10" style={{ animationDelay: '100ms' }}>
          <h1 className="text-white text-5xl font-light leading-tight" style={{ letterSpacing: '-1.2px' }}>
            Manage tasks,<br />
            <span className="font-semibold">together.</span>
          </h1>
          <p className="text-white/80 text-lg mt-6" style={{ fontWeight: 330, letterSpacing: '-0.14px' }}>
            A collaborative workspace for modern teams to organize, assign, and track progress with clarity.
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-12">
            <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center">
              <span className="text-white text-sm font-bold">T</span>
            </div>
            <span className="text-lg font-semibold tracking-tight" style={{ letterSpacing: '-0.3px' }}>TaskCanvas</span>
          </div>

          <div className="mb-8">
            <h2 className="text-subheading text-black">Sign in</h2>
            <p className="text-body-light text-[#666] mt-1">Welcome back. Enter your credentials.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-mono-label text-[#666] mb-1.5 block">Email</label>
              <input
                id="login-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-black/12 bg-white text-black text-sm placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30 transition-smooth"
                style={{ letterSpacing: '-0.14px' }}
              />
            </div>
            <div>
              <label className="text-mono-label text-[#666] mb-1.5 block">Password</label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-black/12 bg-white text-black text-sm placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/30 transition-smooth"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-pill btn-pill-black w-full justify-center text-sm h-12 mt-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#999] mt-8" style={{ fontWeight: 340 }}>
            No account?{" "}
            <Link href="/register" className="text-black underline underline-offset-3 hover:no-underline transition-smooth" style={{ fontWeight: 480 }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
