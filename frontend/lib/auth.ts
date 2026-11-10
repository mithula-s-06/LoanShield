export const DEFAULT_CREDENTIALS = {
  email: 'analyst@loanshield.bank',
  password: 'LoanShield2026',
  name: 'Eleanor Vance',
  role: 'Bank Analyst',
  department: 'Credit Underwriting & Risk Operations',
  employeeId: 'BA-98421'
};

export const AUTH_STORAGE_KEY = 'loanshield_auth_token';

export interface UserProfile {
  email: string;
  name: string;
  role: string;
  department: string;
  employeeId: string;
}

export function getStoredAuth(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredAuth(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
}

export function clearStoredAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
