"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("E-poçt və ya şifrə yanlışdır.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-md border-2 border-ink rotate-[-4deg] flex items-center justify-center" />
          <div>
            <div className="font-bold text-lg">Bestofset</div>
            <div className="text-xs text-inksoft uppercase tracking-wide">
              idarəetmə
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-inksoft mb-1">
              E-poçt
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-inksoft mb-1">
              Şifrə
            </label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="text-xs text-magenta bg-magenta/10 border border-magenta rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn w-full justify-center">
            {loading ? "Yoxlanılır..." : "Daxil ol"}
          </button>
        </form>
      </div>
    </div>
  );
}
