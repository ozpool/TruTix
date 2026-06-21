import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, useSignMessage } from "wagmi";
import { SiweMessage } from "siwe";
import { apiGet, apiPost } from "../lib/api";
import { clearOrgToken, decodeOrgAddress, getOrgToken, setOrgToken } from "../lib/orgAuth";

const SIWE_DOMAIN = import.meta.env.VITE_SIWE_DOMAIN ?? "localhost";

/// Organizer sign-in via SIWE: fetch a nonce, sign an EIP-4361 message, exchange
/// it for a JWT, and persist it. The message's domain must match the backend's
/// SIWE_DOMAIN or verification fails.
export function useOrganizerAuth() {
  const { address, status } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const [token, setToken] = useState<string | null>(getOrgToken());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep the organizer session tied to the connected wallet: disconnecting the
  // wallet (or switching to a different account) ends the organizer session too,
  // reactively — no page refresh. `reconnecting`/`connecting` are left alone so a
  // page reload doesn't drop a still-valid session mid-handshake.
  useEffect(() => {
    if (status === "disconnected") {
      if (getOrgToken()) {
        clearOrgToken();
        setToken(null);
      }
      return;
    }
    if (status === "connected" && token && address) {
      const tokenAddress = decodeOrgAddress(token);
      if (tokenAddress && tokenAddress.toLowerCase() !== address.toLowerCase()) {
        clearOrgToken();
        setToken(null);
      }
    }
  }, [status, address, token]);

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
    } catch (e) {
      // Surface the real cause (domain mismatch, cold backend, bad API URL)
      // instead of a generic message so failures are diagnosable.
      setError(e instanceof Error ? e.message : "Sign-in failed.");
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
