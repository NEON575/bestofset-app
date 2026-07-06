export function fmtMoney(n: number | null | undefined): string {
  return (
    (n ?? 0).toLocaleString("az-AZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
    " ₼"
  );
}

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export const PRODUCTION_STATUS_LABELS: Record<string, string> = {
  DIZAYN: "Dizayn",
  CAP: "Çap",
  KESIM: "Kəsim",
  LAMINASIYA: "Laminasiya",
  BITIB: "Bitib",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  GOZLEYIR: "Gözləyir",
  ISDEDIR: "İşdədir",
  TEHVIL_VERILDI: "Təhvil verildi",
  LEGV_EDILDI: "Ləğv edildi",
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  AKTIV: "Aktiv",
  QAYTARILDI: "Qaytarıldı",
};

export const EQAIME_STATUS_LABELS: Record<string, string> = {
  YAZILIB: "Yazılıb",
  YAZILMAYIB: "Yazılmayıb",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  ODENILIB: "Ödənilib",
  ODENILMEYIB: "Ödənilməyib",
  QISMEN_ODENILIB: "Qismən ödənilib",
};

export const DEBT_TYPE_LABELS: Record<string, string> = {
  BIZE_OLAN: "Bizə olan",
  BIZIM_OLAN: "Bizim olan",
};
