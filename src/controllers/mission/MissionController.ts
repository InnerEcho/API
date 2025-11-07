import type { Request, Response, NextFunction } from 'express';
import createError from 'http-errors';
import MissionService from '@/services/mission/MissionService.js';

function ensureUserId(req: Request): number {
  const user = req.user ?? (req as any).user;
  const rawId = user?.userId ?? user?.id;
  const parsed = typeof rawId === 'string' ? Number.parseInt(rawId, 10) : Number(rawId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createError(401, 'Unauthorized');
  }
  return parsed;
}

export async function recommend(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = ensureUserId(req);
    const n = Math.min(Number(req.query.n) || 2, 3);
    const data = await MissionService.recommendIfEmpty(userId, n);
    res.json(data);
  } catch (err) { return next(err); }
}

export async function getToday(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = ensureUserId(req);
    const data = await MissionService.getToday(userId);
    res.json(data);
  } catch (err) { return next(err); }
}

export async function complete(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = ensureUserId(req);
    const userMissionId = Number(req.params.id);
    const result = await MissionService.complete(userId, userMissionId, req.body || {});
    res.json(result);
  } catch (err) { return next(err); }
}

export async function assignByCodes(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = ensureUserId(req);
    const rawCodes = req.body?.codes;
    const codes = Array.isArray(rawCodes)
      ? rawCodes.map(code => String(code))
      : [];
    const data = await MissionService.assignTodayByCodes(userId, codes);
    res.json(data);
  } catch (err) { return next(err); }
}

export async function clearToday(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = ensureUserId(req);
    const data = await MissionService.clearToday(userId);
    res.json(data);
  } catch (err) { return next(err); }
}
