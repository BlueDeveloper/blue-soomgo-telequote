// 전화번호 자동 하이픈
export function formatPhone(value: string): string {
  const nums = value.replace(/[^0-9]/g, "").slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
  return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7)}`;
}

// 이메일 유효성
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 생년월일 유효성 (YYYYMMDD)
export function isValidBirth(birth: string): boolean {
  if (!/^\d{8}$/.test(birth)) return false;
  const y = parseInt(birth.slice(0, 4));
  const m = parseInt(birth.slice(4, 6));
  const d = parseInt(birth.slice(6, 8));
  if (y < 1900 || y > 2026) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  return true;
}
