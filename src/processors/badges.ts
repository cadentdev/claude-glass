/** Shared badge rendering for effort levels, model tiers, and other metadata */

import { escapeHtml } from './markdown';

const EFFORT_COLORS: Record<string, string> = {
  low: 'badge-green',
  medium: 'badge-yellow',
  high: 'badge-orange',
};

const MODEL_COLORS: Record<string, string> = {
  opus: 'badge-blue',
  sonnet: 'badge-purple',
  haiku: 'badge-red',
};

export function effortBadge(effort: string): string {
  if (!effort) return '';
  const cls = EFFORT_COLORS[effort] || 'badge-default';
  return `<span class="badge ${cls}">${escapeHtml(effort)} effort</span>`;
}

export function modelBadge(model: string): string {
  if (!model) return '';
  const cls = MODEL_COLORS[model] || 'badge-blue';
  return `<span class="badge ${cls}">${escapeHtml(model)}</span>`;
}

export function tagBadge(label: string, cls: string = 'badge-purple'): string {
  return `<span class="badge ${cls}">${escapeHtml(label)}</span>`;
}
