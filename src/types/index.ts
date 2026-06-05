// src/types/index.ts
/*** Core data types ***/
export interface ImageData {
  /** URI of the captured image – e.g. `file://…` */
  uri: string;
  /** Optional base64 representation */
  base64?: string;
}

/*** Auth Service ***/
export interface AuthResult {
  recognized: boolean;
  employeeId?: string;
  confidence?: number; // 0‑1 similarity score
  livenessPassed: boolean;
  livenessScore?: number;
}
export interface AuthService {
  /** Authenticate a raw image and return a structured result */
  authenticateUser(image: ImageData): Promise<AuthResult>;
}

/*** Employee Service ***/
export interface EnrollPayload {
  employeeId: string;
  name: string;
  /** Exactly five face images */
  images: ImageData[];
}
export interface EmployeeRecord {
  employee_id: string;
  name: string;
  /** Base64‑encoded MobileFaceNet embedding (128 float32) */
  embedding: string;
  created_at: string; // ISO‑8601 timestamp
}
export interface EmployeeService {
  enrollEmployee(payload: EnrollPayload): Promise<EmployeeRecord>;
  listEmployees(): Promise<EmployeeRecord[]>;
}

/*** Attendance Service ***/
export interface AttendancePayload {
  employeeId: string;
  /** "lat,lon" */
  gps: string;
}
export interface AttendanceRecord {
  id: string;
  employee_id: string;
  timestamp: string; // ISO‑8601
  gps: string;
  sync_status: 'pending' | 'synced';
}
export interface AttendanceService {
  recordAttendance(payload: AttendancePayload): Promise<AttendanceRecord>;
  listAttendance(): Promise<AttendanceRecord[]>;
  syncPending(): Promise<void>;
}

/*** Zustand Store Slices ***/
export interface AuthSlice {
  isLoggedIn: boolean;
  user: { id: string; name: string } | null;
  login: (user: { id: string; name: string }) => void;
  logout: () => void;
}

export interface EmployeeSlice {
  employees: EmployeeRecord[];
  loadEmployees: () => Promise<void>;
  addEmployee: (e: EmployeeRecord) => void;
}

export interface AttendanceSlice {
  records: AttendanceRecord[];
  loadAttendance: () => Promise<void>;
  addRecord: (r: AttendanceRecord) => void;
}

export type SyncStatus = 'idle' | 'running' | 'success' | 'error';
export interface SyncSlice {
  syncStatus: SyncStatus;
  pendingSyncCount: number;
  syncNow: () => Promise<void>;
}

/*** Service Bag – injected at runtime ***/
export interface ServiceBag {
  /** Nullable – may be injected later during app bootstrap */
  authService: AuthService | null;
  employeeService: EmployeeService | null;
  attendanceService: AttendanceService | null;
}

/*** Enrollment Flow ***/
export type EnrollmentStep = 'details' | 'capture' | 'review' | 'success';
export interface EnrollmentSlice {
  /** Current wizard step */
  enrollmentStep: EnrollmentStep;
  /** Collected employee details */
  employeeId: string;
  name: string;
  department: string;
  clearanceLevel: string;
  /** Captured face images – must contain exactly 5 */
  capturedImages: ImageData[];
  /** Actions */
  setDetails: (details: {
    employeeId: string;
    name: string;
    department: string;
    clearanceLevel: string;
  }) => void;
  addImage: (image: ImageData) => void;
  removeImage: (index: number) => void;
  goToStep: (step: EnrollmentStep) => void;
  resetEnrollment: () => void;
}

/*** Full AppState combined ***/
export interface AppState
  extends AuthSlice,
    EmployeeSlice,
    AttendanceSlice,
    SyncSlice,
    EnrollmentSlice,
    ServiceBag {
  /** Called once during bootstrap to inject concrete implementations */
  setServices: (services: ServiceBag) => void;
}
