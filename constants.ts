
import { TaskStatus, UserRole, User, ConditionGrade } from './types';

export const APP_NAME = "Preventive Maintenance Tracker";

// These are keyed by TaskStatus values, which is correct.
// Access will be like STATUS_COLORS[task.condition] where task.condition holds a TaskStatus value.
export const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'bg-status-pending', // amber-400
  [TaskStatus.IN_PROGRESS]: 'bg-status-in-progress', // blue-500
  [TaskStatus.AWAITING_SUPERVISOR_CONFIRMATION]: 'bg-status-awaiting-confirmation', // purple-500
  [TaskStatus.AWAITING_MANAGER_CONFIRMATION]: 'bg-teal-500', // New: teal-500
  [TaskStatus.COMPLETED]: 'bg-status-completed', // emerald-500
};

export const STATUS_TEXT_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.PENDING]: 'text-amber-800',
  [TaskStatus.IN_PROGRESS]: 'text-blue-800',
  [TaskStatus.AWAITING_SUPERVISOR_CONFIRMATION]: 'text-purple-800',
  [TaskStatus.AWAITING_MANAGER_CONFIRMATION]: 'text-teal-800', // New: teal-800
  [TaskStatus.COMPLETED]: 'text-emerald-800',
};

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

// This is keyed by ConditionGrade values, which is correct.
// Access will be like CONDITION_GRADE_NOTES[task.grade] where task.grade holds a ConditionGrade value.
export const CONDITION_GRADE_NOTES: Record<ConditionGrade, string> = {
  [ConditionGrade.A]: 'Satisfied - Equipment is in good condition.',
  [ConditionGrade.B]: 'Adjusted - Minor adjustments were made.',
  [ConditionGrade.C]: 'Replaced - Parts were replaced.',
  [ConditionGrade.D]: 'Not Fixed - Issue persists or requires further action.',
};