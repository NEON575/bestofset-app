"use client";
import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="card w-full max-w-sm p-8"
      >
        <div className="flex flex-col items-center text-center mb-6">
          {/* Loqonun rəngləri sabitdir — ağ fon üzərində göstərilir ki, tünd
              temada da (kart fonu tündləşəndə) oxunaqlı qalsın. */}
          <div className="bg-white rounded-xl p-4">
            <Image src="/logo.png" alt="Bestofset" width={220} height={119} priority />
          </div>
          <div className="text-[11px] text-inksoft uppercase tracking-[0.25em] mt-3">
            Experts in Print
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
      </motion.div>
    </div>
  );
}
