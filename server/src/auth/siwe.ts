import { SiweMessage, generateNonce } from "siwe";
import { Nonce } from "../models/Nonce";

/// Issue a fresh single-use nonce for a SIWE sign-in.
export async function createNonce(): Promise<string> {
  const nonce = generateNonce();
  await Nonce.create({ nonce });
  return nonce;
}

/// Verify a SIWE message + signature and consume its nonce. Returns the signer.
export async function verifySiwe(message: string, signature: string): Promise<string> {
  const siwe = new SiweMessage(message);
  const result = await siwe.verify({ signature });
  if (!result.success) {
    throw new Error("invalid signature");
  }

  // Replay defense: the nonce must be one we issued, and it is consumed here.
  const consumed = await Nonce.findOneAndDelete({ nonce: siwe.nonce });
  if (!consumed) {
    throw new Error("unknown or expired nonce");
  }

  return siwe.address.toLowerCase();
}
