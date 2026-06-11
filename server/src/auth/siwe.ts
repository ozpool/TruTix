import { SiweMessage, generateNonce } from "siwe";
import { Nonce } from "../models/Nonce";
import { config } from "../config";

/// Issue a fresh single-use nonce for a SIWE sign-in.
export async function createNonce(): Promise<string> {
  const nonce = generateNonce();
  await Nonce.create({ nonce });
  return nonce;
}

/// Verify a SIWE message + signature and consume its nonce. Returns the signer.
export async function verifySiwe(message: string, signature: string): Promise<string> {
  const siwe = new SiweMessage(message);

  // Replay defense: the nonce must be one we issued; consume it atomically first.
  const consumed = await Nonce.findOneAndDelete({ nonce: siwe.nonce });
  if (!consumed) {
    throw new Error("unknown or expired nonce");
  }

  // Bind verification to our domain and the consumed nonce so a message signed
  // for another site (phishing) or with an attacker-chosen nonce is rejected.
  const result = await siwe.verify({
    signature,
    domain: config.SIWE_DOMAIN,
    nonce: siwe.nonce,
  });
  if (!result.success) {
    throw new Error("invalid signature");
  }

  return siwe.address.toLowerCase();
}
