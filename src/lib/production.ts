export type StepStatus = "GOZLEYIR" | "BASLANIB" | "BITIB";

interface StepLike {
  id: string;
  sequence: number;
  status: string;
}

/**
 * Addımlar öz qrupu (parça və ya sifarişin birləşmə mərhələləri) daxilində
 * sequence sırası ilə bir-birini gözləyir: əvvəlki addım BİTİB olmadan
 * sonrakı BAŞLANIB ola bilməz, BAŞLANIB olmadan da BİTİB ola bilməz.
 */
export function assertStepTransition(steps: StepLike[], stepId: string, nextStatus: StepStatus): void {
  const step = steps.find((s) => s.id === stepId);
  if (!step) throw new Error("Addım tapılmadı");

  if (nextStatus === "BASLANIB") {
    if (step.status !== "GOZLEYIR") throw new Error("Bu addım artıq başlanıb və ya bitib");
    const earlierPending = steps.some((s) => s.sequence < step.sequence && s.status !== "BITIB");
    if (earlierPending) throw new Error("Əvvəlki addım bitmədən bu addım başlana bilməz");
  } else if (nextStatus === "BITIB") {
    if (step.status !== "BASLANIB") throw new Error("Addım əvvəlcə başlanmalıdır");
  } else {
    throw new Error("Yanlış status");
  }
}
