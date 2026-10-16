import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { state, type User, type UserRole } from "../state";

export const JWT_SECRET = process.env.JWT_SECRET || "replace-me";

const AUTH_ERROR_RESPONSE = {
  success: false,
  error: {
    code: "AUTHENTICATION_REQUIRED",
    message: "Missing or invalid authentication token",
  },
};

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.header("authorization");

  if (!authHeader) {
    res.status(401).json(AUTH_ERROR_RESPONSE);
    return;
  }

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1]?.trim();
  if (!token) {
    res.status(401).json(AUTH_ERROR_RESPONSE);
    return;
  }

  const secret = process.env.JWT_SECRET || JWT_SECRET;

  try {
    const decoded = jwt.verify(token, secret);

    if (!decoded || typeof decoded === "string") {
      res.status(401).json(AUTH_ERROR_RESPONSE);
      return;
    }

    const payload = decoded as jwt.JwtPayload & { userId?: string; id?: string };
    const userId =
      typeof payload.userId === "string"
        ? payload.userId
        : typeof payload.id === "string"
          ? payload.id
          : undefined;

    if (!userId) {
      res.status(401).json(AUTH_ERROR_RESPONSE);
      return;
    }

    const user = state.users.find((u) => u.id === userId);
    if (!user) {
      res.status(401).json(AUTH_ERROR_RESPONSE);
      return;
    }

    (req as any).user = user;
    next();
  } catch {
    res.status(401).json(AUTH_ERROR_RESPONSE);
  }
}

export function requireRole(roleOrRoles: UserRole | UserRole[]) {
  const allowedRoles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];

  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as User | undefined;

    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to perform this action",
        },
      });
      return;
    }

    next();
  };
}

export function getUser(req: Request): User {
  return (req as any).user as User;
}
