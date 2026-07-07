import { BaseError, ContractFunctionRevertedError } from "viem";

/// Pull the Solidity custom error name (e.g. "NotApproved") out of a simulate/
/// write failure, so callers can show a cause-specific message instead of a
/// generic revert string.
export function contractErrorName(err: unknown): string | null {
  if (!(err instanceof BaseError)) return null;
  const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
  return revert instanceof ContractFunctionRevertedError ? (revert.data?.errorName ?? null) : null;
}

/// Turn a wallet/RPC error into a short, honest, user-facing line. It never
/// hides the failure — it surfaces the most specific message viem provides, with
/// a few friendlier rewrites for the cases users actually hit.
export function txErrorMessage(err: unknown): string {
  if (err instanceof BaseError) {
    if (/user rejected|user denied|rejected the request/i.test(err.message)) {
      return "You rejected the request in your wallet.";
    }
    if (/insufficient funds/i.test(err.message)) {
      return "Not enough ETH to cover the ticket price plus gas. Top up and try again.";
    }
    if (err.shortMessage) return err.shortMessage;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Please try again.";
}
