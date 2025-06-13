
export enum TaskStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  AWAITING_SUPERVISOR_CONFIRMATION = 'Awaiting Supervisor Confirmation',
  AWAITING_MANAGER_CONFIRMATION = 'Awaiting Manager Confirmation',
  COMPLETED = 'Completed',
}

export enum ConditionGrade {
  A = 'A', // Satisfied
  B = 'B', // Adjusted
  C = 'C', // Replaced
  D = 'D', // Not Fixed
}

export interface Task {
  id: string;

  // New "sheet-like" fields
  serial_number: string;
  machine_name: string; // Stores machine's ID (UUID) if DB column is UUID, linked from spare_parts.id
  machine_part?: string; // Stores spare part's ID (UUID) if DB column is UUID, linked from spare_parts.id
  description_of_job: string;
  assigned_tech?: string; // Technician's User ID (UUID)
  plan_date: string;

  condition: TaskStatus; // Renamed from 'status'. DB column is 'condition'. Holds TaskStatus.
  creator_id?: string; // Creator's User ID (UUID) - UPDATED (DB column: creator_id)

  // Technician Completion Details
  completeDate?: string;
  grade?: ConditionGrade; // Renamed from 'condition'. DB column assumed 'grade'. Holds ConditionGrade.
  techNotes?: string;
  photo: string[]; // Renamed from technicianPhotos. DB column is 'photo'.

  // Supervisor Confirmation Details
  supervisorId?: string; // Supervisor's User ID (UUID)
  supervisorNotes?: string;
  supervisorReviewPhoto?: string;
  supervisorConfirmationDate?: string;

  // Manager Confirmation Details
  managerId?: string; // Manager's User ID (UUID)
  // managerNotes?: string; // Removed as per user request
  managerConfirmationDate?: string;

  // --- LEGACY FIELDS for reading old data if necessary ---
  equipmentName?: string;
  maintenanceDate?: string;
  assignedTechnician?: string;
  technicianNotes?: string;
  technicianCompletionDate?: string;

  supervisorConfirmationNotes?: string;
  supervisorConfirmationPhoto?: string;
  adminConfirmationNotes?: string;
  adminSignature?: string;
  adminConfirmationPhoto?: string;
  adminConfirmationDate?: string;
}

export enum UserRole {
  OWNER = 'owner',
  CREATOR = 'creator',
  SUPERVISOR = 'supervisor',
  TECHNICIAN = 'technician',
  MANAGER = 'manager',
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

// This represents an entry from the spare_parts table, used to populate dropdowns
export interface SparePart {
  id: string; // The UUID of the spare part or machine type entry
  machine_name: string; // The textual name of the machine
  machine_part: string; // The textual name of the part
  serial_number?: string;
}