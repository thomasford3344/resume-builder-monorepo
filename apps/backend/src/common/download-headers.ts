import { type Response } from 'express';

export function applyNoCacheHeaders(res: Response): void {
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, private, max-age=0',
  );
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Vary', 'Authorization');
  res.setHeader('ETag', `"${Date.now()}-${Math.random().toString(36).slice(2)}"`);
}

export function sendAttachment(
  res: Response,
  contentType: string,
  filename: string,
  body: Buffer | string,
): void {
  applyNoCacheHeaders(res);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  if (Buffer.isBuffer(body)) {
    res.setHeader('Content-Length', body.length);
  } else {
    res.setHeader('Content-Length', Buffer.byteLength(body, 'utf-8'));
  }

  res.send(body);
}
