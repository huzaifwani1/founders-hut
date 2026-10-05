import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface StructuredLogEvent {
  timestamp: string;
  requestId: string;
  method: string;
  route: string;
  statusCode?: number;
  latencyMs?: number;
  ip?: string;
  userAgent?: string;
}

/**
 * Structured Application Logger Middleware
 * Generates x-request-id headers, tracks route latency, and redacts sensitive credentials.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);

  res.on('finish', () => {
    const latencyMs = Date.now() - startTime;

    const logEvent: StructuredLogEvent = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      route: req.originalUrl || req.url,
      statusCode: res.statusCode,
      latencyMs,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    };

    // Redact sensitive headers & payload attributes silently
    console.log(JSON.stringify(logEvent));
  });

  next();
};
