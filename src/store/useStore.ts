// src/store/useStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  AppState,
  AuthService,
  EmployeeService,
  AttendanceService,
  EmployeeRecord,
  AttendanceRecord,
  EnrollmentStep,
  ImageData,
} from '../types';

/**
 * Zustand store – holds UI state, domain data, and the injected services.
 * persist middleware omitted for MVP (requires AsyncStorage setup).
 */
export const useStore = create<AppState>()(
  devtools((set, get) => ({
      /* ---------- Auth Slice ---------- */
      isLoggedIn: false,
      user: null,
      login: (user: { id: string; name: string }) => set({ isLoggedIn: true, user }),
      logout: () => set({ isLoggedIn: false, user: null }),

      /* ---------- Employee Slice ---------- */
      employees: [],
      loadEmployees: async () => {
        const svc = get().employeeService;
        if (!svc) return; // guard – service may be null during early boot
        const list = await svc.listEmployees();
        set({ employees: list });
      },
      addEmployee: (emp: EmployeeRecord) =>
        set((state) => ({ employees: [...state.employees, emp] })),

      /* ---------- Attendance Slice ---------- */
      records: [],
      loadAttendance: async () => {
        const svc = get().attendanceService;
        if (!svc) return;
        const list = await svc.listAttendance();
        set({ records: list });
      },
      addRecord: (rec: AttendanceRecord) =>
        set((state) => ({
          records: [rec, ...state.records],
          // Increment pending sync count when a new record is added
          pendingSyncCount: state.pendingSyncCount + 1,
        })),

      /* ---------- Sync Slice ---------- */
      syncStatus: 'idle',
      pendingSyncCount: 0,
      syncNow: async () => {
        set({ syncStatus: 'running' });
        try {
          const svc = get().attendanceService;
          if (!svc) throw new Error('Sync service not available');
          await svc.syncPending();
          // After a successful sync we reset the pending count
          set({ syncStatus: 'success', pendingSyncCount: 0 });
        } catch (e) {
          set({ syncStatus: 'error' });
        }
        // Return to idle after a short visual pause
        setTimeout(() => set({ syncStatus: 'idle' }), 1500);
      },

      /* ---------- Enrollment Slice ---------- */
      enrollmentStep: 'details',
      employeeId: '',
      name: '',
      department: '',
      clearanceLevel: '',
      capturedImages: [],
      setDetails: ({ employeeId, name, department, clearanceLevel }: { employeeId: string; name: string; department: string; clearanceLevel: string }) =>
        set({ employeeId, name, department, clearanceLevel }),
      addImage: (image: ImageData) =>
        set((state) => {
          if (state.capturedImages.length >= 5) {
              // Max 5 images – no state change
              return state;
            }
          return { capturedImages: [...state.capturedImages, image] };
        }),
      removeImage: (index: number) =>
        set((state) => {
          const newImgs = state.capturedImages.filter((_, i) => i !== index);
          return { capturedImages: newImgs };
        }),
      goToStep: (step: EnrollmentStep) => set({ enrollmentStep: step }),
      resetEnrollment: () =>
        set({
          enrollmentStep: 'details',
          employeeId: '',
          name: '',
          department: '',
          clearanceLevel: '',
          capturedImages: [],
        }),

      /* ---------- Service Bag ---------- */
      authService: null,
      employeeService: null,
      attendanceService: null,
      /** Inject concrete implementations (called once from App.tsx) */
      setServices: (services: { authService: AuthService | null; employeeService: EmployeeService | null; attendanceService: AttendanceService | null }) => set({ ...services }),
  }) as unknown as AppState)
);
