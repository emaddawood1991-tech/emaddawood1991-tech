// DEMO ONLY: the in-browser demo has no multi-factor authentication (it is not a secure system and holds synthetic data only).
export function makeMfa() {
  const no = () => { throw Object.assign(new Error('Multi-factor authentication is not available in the demo.'), { status: 501 }); };
  return { enabled: () => false, required: () => false, requiredRoles: () => [], verifySecondFactor: () => null, startSetup: no, confirmSetup: no, newRecoveryCodes: no, reset: () => {}, checkTotp: () => false,
    status: () => ({ available: false, enabled: false, pending: false, required: false, recovery_codes_remaining: 0 }), summary: () => ({ enabled: false, recovery_codes_remaining: 0 }) };
}
export const keyFromHex = () => new Uint8Array(32);
