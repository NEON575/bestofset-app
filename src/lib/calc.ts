/**
 * Bütün hesablama düsturları burada cəmlənib ki, sifariş/faktura/maya dəyəri
 * məntiqi bir yerdə saxlanılsın və müxtəlif API route-larında təkrarlanmasın.
 */

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Cəmi = Say × Ədəd qiyməti */
export function calcTotal(quantity: number, unitPrice: number): number {
  return round2(quantity * unitPrice);
}

/** Bonus məbləği = Cəmi × Bonus % / 100 */
export function calcBonusAmount(total: number, bonusPercent: number): number {
  return round2((total * (bonusPercent || 0)) / 100);
}

/** Son Cəm = Cəmi - Bonus məbləği - 2-ci Bonus məbləği */
export function calcFinalTotal(
  total: number,
  bonusAmount: number,
  bonus2Amount: number
): number {
  return round2(total - (bonusAmount || 0) - (bonus2Amount || 0));
}

export interface OrderCalcInput {
  quantity: number;
  unitPrice: number;
  bonusPercent: number;
  bonus2Percent: number;
  /** Verilsə, Say×Ədəd qiyməti əvəzinə birbaşa bu istifadə olunur (əl ilə yazılan Cəmi). */
  total?: number;
  /** Verilsə, Cəmi×Bonus% əvəzinə birbaşa bu istifadə olunur (əl ilə yazılan Bonus məbləği). */
  bonusAmount?: number;
  /** Verilsə, Cəmi×2-ci Bonus% əvəzinə birbaşa bu istifadə olunur (əl ilə yazılan 2-ci Bonus məbləği). */
  bonus2Amount?: number;
}

export interface OrderCalcResult {
  total: number;
  bonusAmount: number;
  bonus2Amount: number;
  finalTotal: number;
}

export function calcOrderAmounts(input: OrderCalcInput): OrderCalcResult {
  const total =
    input.total !== undefined && input.total !== null
      ? round2(input.total)
      : calcTotal(input.quantity, input.unitPrice);
  const bonusAmount =
    input.bonusAmount !== undefined && input.bonusAmount !== null
      ? round2(input.bonusAmount)
      : calcBonusAmount(total, input.bonusPercent);
  const bonus2Amount =
    input.bonus2Amount !== undefined && input.bonus2Amount !== null
      ? round2(input.bonus2Amount)
      : calcBonusAmount(total, input.bonus2Percent);
  const finalTotal = calcFinalTotal(total, bonusAmount, bonus2Amount);
  return { total, bonusAmount, bonus2Amount, finalTotal };
}

/** Ümumi maya = Kağız + Çap + Laminasiya + Kəsim + Digər xərc */
export function calcTotalCost(parts: {
  paperCost: number;
  printCost: number;
  laminationCost: number;
  cuttingCost: number;
  otherCost: number;
}): number {
  return round2(
    (parts.paperCost || 0) +
      (parts.printCost || 0) +
      (parts.laminationCost || 0) +
      (parts.cuttingCost || 0) +
      (parts.otherCost || 0)
  );
}

/** Mənfəət = Satış məbləği - Ümumi maya */
export function calcProfit(saleAmount: number, totalCost: number): number {
  return round2((saleAmount || 0) - (totalCost || 0));
}

/** Növbəti sifariş nömrəsini yaradır: SIF-0001, SIF-0002, ... */
export function nextOrderNumber(lastNumber: string | null): string {
  if (!lastNumber) return "SIF-0001";
  const match = lastNumber.match(/(\d+)$/);
  const n = match ? parseInt(match[1], 10) + 1 : 1;
  return "SIF-" + String(n).padStart(4, "0");
}

/** Faktura üçün ödəniş statusunu ödəniş cəminə görə müəyyən edir */
export function calcInvoicePaymentStatus(
  finalTotal: number,
  paidSum: number
): "ODENILIB" | "ODENILMEYIB" | "QISMEN_ODENILIB" {
  const paid = round2(paidSum);
  const total = round2(finalTotal);
  if (paid <= 0) return "ODENILMEYIB";
  if (paid >= total) return "ODENILIB";
  return "QISMEN_ODENILIB";
}

/** Alış / borc üçün ödəniş statusu (eyni məntiq, ayrı adla oxunaqlılıq üçün) */
export function calcPaymentStatus(
  total: number,
  paid: number
): "ODENILIB" | "ODENILMEYIB" | "QISMEN_ODENILIB" {
  return calcInvoicePaymentStatus(total, paid);
}

/** Anbar qalığı = Giriş - Çıxış */
export function calcInventoryBalance(incoming: number, outgoing: number): number {
  return round2((incoming || 0) - (outgoing || 0));
}

/** Əmək haqqı: Cəmi maaş = Sabit + Bonus, Qalıq = Cəmi - Ödənilən */
export function calcSalary(baseSalary: number, bonus: number, paid: number) {
  const total = round2((baseSalary || 0) + (bonus || 0));
  const remaining = round2(total - (paid || 0));
  return { total, remaining };
}

/** Borc qalığı = Məbləğ - Ödənilən */
export function calcDebtRemaining(amount: number, paid: number): number {
  return round2((amount || 0) - (paid || 0));
}
