/**
 * Centralized Theme Configuration
 * All color mappings for status badges, goal types, and UI elements
 * Update these constants to change colors across the entire app
 */

// Status Colors - Maps goal/task status to neon colors
export const STATUS_COLORS = {
  Completed: {
    bg: 'bg-neon-green/20',
    text: 'text-neon-green',
    border: 'border-neon-green',
  },
  Verified: {
    bg: 'bg-neon-green/20',
    text: 'text-neon-green',
    border: 'border-neon-green',
  },
  Pending: {
    bg: 'bg-neon-cyan/20',
    text: 'text-neon-cyan',
    border: 'border-neon-cyan',
  },
  Failed: {
    bg: 'bg-neon-pink/20',
    text: 'text-neon-pink',
    border: 'border-neon-pink',
  },
} as const;

// Goal Type Colors - Maps goal categories to neon colors
export const GOAL_TYPE_COLORS = {
  Custom: {
    bg: 'bg-neon-purple/20',
    text: 'text-neon-purple',
    border: 'border-neon-purple',
  },
  Coding: {
    bg: 'bg-neon-cyan/20',
    text: 'text-neon-cyan',
    border: 'border-neon-cyan',
  },
  Fitness: {
    bg: 'bg-neon-green/20',
    text: 'text-neon-green',
    border: 'border-neon-green',
  },
  Study: {
    bg: 'bg-neon-purple/20',
    text: 'text-neon-purple',
    border: 'border-neon-purple',
  },
  Work: {
    bg: 'bg-neon-pink/20',
    text: 'text-neon-pink',
    border: 'border-neon-pink',
  },
} as const;

// Token/Reward Colors
export const TOKEN_COLORS = {
  bg: 'bg-neon-purple/20',
  text: 'text-neon-purple',
  border: 'border-neon-purple',
} as const;

// Helper function to get status color classes
export function getStatusColors(status: string) {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.Pending;
}

// Helper function to get goal type color classes
export function getGoalTypeColors(type: string) {
  return GOAL_TYPE_COLORS[type as keyof typeof GOAL_TYPE_COLORS] || GOAL_TYPE_COLORS.Custom;
}

// Helper function to get full className string for status badge
export function getStatusBadgeClass(status: string): string {
  const colors = getStatusColors(status);
  return `${colors.bg} ${colors.text} ${colors.border} border-2 font-mono text-xs uppercase tracking-wider px-2 py-1`;
}

// Helper function to get full className string for goal type badge
export function getGoalTypeBadgeClass(type: string): string {
  const colors = getGoalTypeColors(type);
  return `${colors.bg} ${colors.text} ${colors.border} border font-mono text-xs uppercase tracking-wider px-2 py-1`;
}

// Helper function for token display
export function getTokenBadgeClass(): string {
  return `${TOKEN_COLORS.bg} ${TOKEN_COLORS.text} ${TOKEN_COLORS.border} border font-mono text-xs px-2 py-1`;
}
