export function normalizeTurkishPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  if (!cleaned) return null;

  if (cleaned.startsWith("+90")) {
    return cleaned;
  }

  if (cleaned.startsWith("+")) {
    return "+90" + cleaned.slice(1);
  }

  if (cleaned.startsWith("90") && cleaned.length === 11) {
    return "+" + cleaned;
  }

  if (cleaned.startsWith("0") && cleaned.length === 11) {
    return "+90" + cleaned.slice(1);
  }

  if (cleaned.startsWith("5") && cleaned.length === 10) {
    return "+90" + cleaned;
  }

  return null;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "****";
  if (phone.length < 4) return "****";
  return phone.slice(0, 4) + "****" + phone.slice(-4);
}

export function formatPhoneForDisplay(phone: string | null | undefined): string {
  if (!phone) return "-";
  if (phone.startsWith("+90")) {
    return "0" + phone.slice(3);
  }
  return phone;
}