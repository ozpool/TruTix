/// The message a ticket holder signs for the gate QR. Must stay identical to the
/// backend's gateMessage in server/src/services/verify.ts.
export function gateMessage(tokenId: number, timestamp: number): string {
  return `TruTix gate check\nticket: ${tokenId}\ntime: ${timestamp}`;
}
