/**
 * Backend health probe.
 *
 *   GET  /api/v1/health/       — liveness (always 200 when service is up)
 *   GET  /api/v1/health/ready/ — readiness (DB + Redis + Celery broker)
 *
 * Used by `/api/health` and any diagnostics page to give operators a
 * one-shot signal that the backend is reachable and healthy.
 */

import { apiFetch } from './api';

export type HealthCheck = {
  status: 'ok' | string;
  latency_ms?: number;
  backend?: string;
  error?: string;
};

export type HealthReport = {
  status: 'ok' | string;
  timestamp?: string;
  checks?: Record<string, HealthCheck>;
};

export async function checkLiveness(): Promise<HealthReport | null> {
  try {
    return await apiFetch<HealthReport>('/health/', { skipAuth: true, revalidate: 0 } as never);
  } catch {
    return null;
  }
}

export async function checkReadiness(): Promise<HealthReport | null> {
  try {
    return await apiFetch<HealthReport>('/health/ready/', { skipAuth: true, revalidate: 0 } as never);
  } catch {
    return null;
  }
}
