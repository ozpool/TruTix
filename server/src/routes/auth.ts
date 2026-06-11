import { Router } from "express";
import { z } from "zod";
import { createNonce, verifySiwe } from "../auth/siwe";
import { signOrganizerToken } from "../auth/jwt";

export const authRouter = Router();

authRouter.get("/nonce", async (_req, res) => {
  const nonce = await createNonce();
  res.json({ nonce });
});

const verifyBody = z.object({ message: z.string(), signature: z.string() });

authRouter.post("/verify", async (req, res) => {
  const parsed = verifyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "message and signature are required" });
    return;
  }

  try {
    const address = await verifySiwe(parsed.data.message, parsed.data.signature);
    res.json({ token: signOrganizerToken(address), address });
  } catch {
    res.status(401).json({ error: "verification failed" });
  }
});
