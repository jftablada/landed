export type LoginArrivalState = 'standard' | 'checkout' | 'confirmed' | 'password_reset';

export function getLoginArrivalState(search: string): LoginArrivalState {
  const params = new URLSearchParams(search);
  if (params.get('password_reset') === '1') return 'password_reset';
  if (params.get('confirmed') === '1') return 'confirmed';
  if (params.get('checkout') === 'success') return 'checkout';
  return 'standard';
}

export function buildConfirmationRedirect(origin: string): string {
  return `${origin.replace(/\/$/, '')}/login?confirmed=1`;
}
