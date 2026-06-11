import { useCallback, useState } from "react";
import { useAccount, useChainId, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import { apiGet, apiPost } from "../lib/api";
import { clearOrgToken, getOrgToken, setOrgToken } from "../lib/orgAuth";

const SIWE_DOMAIN = import.meta.env.VITE_SIWE_DOMAIN ?? "localhost";

/// Organizer sign-in via SIWE: fetch a nonce, sign an EIP-4361 message, exchange
/// it for a JWT, and persist it. The message's domain must match the backend's
/// SIWE_DOMAIN or verification fails.
export function useOrganizerAuth() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const [token, setToken] = useState<string | null>(getOrgToken());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async () => {
    if (!address) {
      setError("Connect your wallet first.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const { nonce } = await apiGet<{ nonce: string }>("/auth/nonce");
      const message = new SiweMessage({
        domain: SIWE_DOMAIN,
        address,
        uri: window.location.origin,
        version: "1",
        chainId,
        nonce,
      }).prepareMessage();
      const signature = await signMessageAsync({ message });
      const { token: jwt } = await apiPost<{ token: string }>("/auth/verify", {
        message,
        signature,
      });
      setOrgToken(jwt);
      setToken(jwt);
    } catch {
      setError("Sign-in failed.");
    } finally {
      setPending(false);
    }
  }, [address, chainId, signMessageAsync]);

  const logout = useCallback(() => {
    clearOrgToken();
    setToken(null);
  }, []);

  return { token, login, logout, pending, error };
}
