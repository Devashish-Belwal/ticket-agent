import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { state } from "../state";

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const body = req.body;
  if (!body || typeof body !== "object") {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request body must be a JSON object",
      },
    });
    return;
  }

  const { email, password } = body as { email?: unknown; password?: unknown };

  if (
    typeof email !== "string" ||
    !EMAIL_REGEX.test(email) ||
    typeof password !== "string" ||
    password.length === 0
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid email or password format",
      },
    });
    return;
  }

  const user = state.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    res.status(401).json({
      success: false,
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      },
    });
    return;
  }

  let isPasswordValid = false;
  try {
    isPasswordValid = await Bun.password.verify(password, user.passwordHash);
  } catch {
    isPasswordValid = false;
  }

  if (!isPasswordValid) {
    res.status(401).json({
      success: false,
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      },
    });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "JWT_SECRET is not configured",
      },
    });
    return;
  }

  const token = jwt.sign({ userId: user.id }, jwtSecret, {
    expiresIn: "24h",
  });

  res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

export default router;
