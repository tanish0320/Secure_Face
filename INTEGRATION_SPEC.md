# Integration Specification – Bringing Frontend, AI, and Backend Together

## Purpose
This document shows **how the three development tracks** (Frontend – Dev 1, AI – Dev 2, Backend – Dev 3) are wired at runtime so the MVP can be built, run, and demo‑ready.

---

## 1️⃣ Application Entry Point (`src/App.tsx`)
```tsx
import React, { useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import RootStack from './navigation/RootStack';
import { useStore } from './store/useStore';

// Import concrete service implementations
import { employeeService } from './services/employee/EmployeeService';
import { attendanceService } from './services/attendance/AttendanceService';
import { authService } from './services/ai'; // exported from Dev 2 AI module

export default function App() {
  const setServices = useStore(state => state.setServices);

  // Inject services exactly once when the app starts
  useEffect(() => {
    setServices({
      employeeService,
      attendanceService,
      authService,
    });
  }, []);

  return (
    <PaperProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootStack />
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}
```
*`setServices` is a **Zustand action** (added to the store in Dev 1's spec) that stores the concrete implementations so any screen can call `useStore().employeeService` etc.
---

## 2️⃣ Extending the Zustand Store (`src/store/useStore.ts` – updated by Dev 1)
```ts
// ... existing slices omitted for brevity
export interface ServiceBag {
  authService: typeof authService;
  employeeService: typeof employeeService;
  attendanceService: typeof attendanceService;
}

export interface AppState extends AuthSlice, EmployeeSlice, AttendanceSlice {
  // Service references – will be injected at runtime (see App.tsx)
  authService: any;
  employeeService: any;
  attendanceService: any;
  // Helper to set them once
  setServices: (services: ServiceBag) => void;
}

export const useStore = create<AppState>()(
  devtools(
    persist((set, get) => ({
      // ... existing slice initialisation ...
      authService: null,
      employeeService: null,
      attendanceService: null,
      setServices: services => set({ ...services }),
    }) as AppState, { name: 'secureface-store' })
  )
);
```
---

## 3️⃣ Example UI Flow – Face Authentication (Dev 1 screen using Dev 2 AI)
```tsx
// src/screens/FaceAuthScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppButton } from '../components/AppButton';
import { CameraPreview } from '../components/CameraPreview';
import { useStore } from '../store/useStore';

export default function FaceAuthScreen() {
  const [result, setResult] = useState<any>(null);
  const { authService, attendanceService, addRecord } = useStore();

  const handleCapture = async (image: ImageData) => {
    // 1️⃣ Call AI façade (Dev 2) – returns AuthResult
    const authResult = await authService.authenticateUser(image);
    setResult(authResult);

    // 2️⃣ If recognized, record attendance via Backend service (Dev 3)
    if (authResult.recognized && authResult.livenessPassed) {
      const gps = '12.9716,77.5946'; // mock GPS – replace with real location API
      const attendance = await attendanceService.recordAttendance({
        employeeId: authResult.employeeId!,
        gps,
      });
      // Update local state for UI (e.g., AttendanceHistory screen)
      addRecord(attendance);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Face Authentication</Text>
      {result ? (
        <Text>{result.recognized ? '✅ Recognised' : '❌ Not recognised'} – Liveness {result.livenessPassed ? '✅ Passed' : '❌ Failed'}</Text>
      ) : null}
      <CameraPreview onCapture={handleCapture} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, marginBottom: 12 },
});
```
*Notice how **the screen never touches SQLite** – it only talks to the injected services.*
---

## 4️⃣ Sync Trigger (Dev 1 UI + Dev 3 backend)
```tsx
// src/screens/SyncCenterScreen.tsx (updated snippet)
import React from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { useStore } from '../store/useStore';

export default function SyncCenterScreen() {
  const { attendanceService, syncStatus, setSyncStatus } = useStore();

  const handleSync = async () => {
    setSyncStatus('running');
    try {
      await attendanceService.syncPending(); // Dev 3 sync implementation
      setSyncStatus('idle');
    } catch (e) {
      setSyncStatus('error');
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Sync Now" onPress={handleSync} />
      {syncStatus === 'running' && <ActivityIndicator style={{ marginTop: 10 }} />}
      {syncStatus === 'error' && <Text style={styles.error}>Sync failed – try again.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  error: { color: 'red', marginTop: 10 },
});
```
---

## 5️⃣ Service Contracts (the **only public API** each team must honour)
```ts
// AuthService – from Dev 2 (AI)
export interface AuthService {
  authenticateUser(image: ImageData): Promise<AuthResult>;
}

// EmployeeService – from Dev 3 (Backend)
export interface EmployeeService {
  enrollEmployee(payload: EnrollPayload): Promise<EmployeeRecord>;
  listEmployees(): Promise<EmployeeRecord[]>;
}

// AttendanceService – from Dev 3 (Backend)
export interface AttendanceService {
  recordAttendance(payload: AttendancePayload): Promise<AttendanceRecord>;
  listAttendance(): Promise<AttendanceRecord[]>;
  syncPending(): Promise<void>;
}
```
*All three interfaces are **imported by the UI** (Dev 1) via the injected store.  No code should import any SQLite or TensorFlow‑Lite modules directly.
---

## 6️⃣ Build & Run Checklist (for all developers)
1. **Run `npm install`** – installs React‑Native, Zustand, React‑Navigation, React‑Native‑Paper, and SQLite.
2. **Inject services** – ensure `App.tsx` imports the concrete implementations from the `services/` folders.
3. **Start Metro** – `npx react-native start`.
4. **Run on device / emulator** – `npx react-native run-android` (or `run-ios`).
5. **Verify the flow**:
   - Login (hard‑coded demo credentials).
   - Enroll an employee (captures 5 mock images, stores embedding via Backend repo).
   - Authenticate via FaceAuth screen – should see a success message and an attendance record appear in History.
   - Open Sync Center – click **Sync Now** – console logs a mock payload and marks the record as synced.
6. **Optional** – run `graphify update .` after any structural change to keep the knowledge‑graph up‑to‑date (as per project CLAUDE.md).
---

## 7️⃣ How to Extend / Replace Mock Implementations
* **AI layer** – Replace `src/services/ai/*` with real TensorFlow‑Lite models; keep the same `authenticateUser` signature.
* **Backend layer** – Swap the SQLite implementation for Realm or WatermelonDB; only the repository signatures (`create`, `getAll`, etc.) must stay the same.
* **Sync layer** – Point `src/api/attendanceApi.ts` to your real AWS API‑Gateway URL and use `fetch` instead of the mock `console.log`.
---

## 8️⃣ Summary of Integration Points
| Layer | File(s) | Exported Symbol | Consumed By |
|-------|---------|----------------|------------|
| UI (Dev 1) | `src/store/useStore.ts` | `setServices`, injected services | All screens |
| AI (Dev 2) | `src/services/ai/index.ts` | `authService.authenticateUser` | UI (FaceAuth screen) |
| Backend (Dev 3) | `src/services/employee/EmployeeService.ts` | `employeeService` | UI (Enrollment screen) |
| Backend (Dev 3) | `src/services/attendance/AttendanceService.ts` | `attendanceService` | UI (FaceAuth, AttendanceHistory, SyncCenter) |
---

**With this integration spec in place, each developer can work in isolation**, implement their sub‑folders, run the app, and the three parts will interoperate without further refactoring.

---

*End of integration specification.*