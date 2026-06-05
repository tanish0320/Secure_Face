# Developer 1 – Frontend Lead (React Native UI)

## Goal
Create a **feature‑based** folder layout, reusable UI components, navigation, and state‑management that consumes only the public service contracts supplied by Developers 2 and 3.

---

## Folder Structure (under `src/`)
```
src/
├─ navigation/            # React‑Navigation stacks & tabs
│   ├─ RootStack.tsx
│   ├─ AuthStack.tsx
│   └─ MainTabNavigator.tsx
├─ screens/               # One screen per feature
│   ├─ LoginScreen.tsx
│   ├─ DashboardScreen.tsx
│   ├─ EmployeeEnrollmentScreen.tsx
│   ├─ FaceAuthScreen.tsx
│   ├─ AttendanceHistoryScreen.tsx
│   └─ SettingsScreen.tsx
├─ components/            # Re‑usable UI primitives (React‑Native Paper compatible)
│   ├─ AppButton.tsx
│   ├─ AppInput.tsx
│   ├─ CameraPreview.tsx
│   ├─ AttendanceCard.tsx
│   ├─ UserCard.tsx
│   └─ LoadingOverlay.tsx
├─ theme/                 # Design system extracted from DESIGN.md (colors, typography, spacing)
│   ├─ colors.ts
│   ├─ typography.ts
│   └─ spacing.ts
├─ hooks/                 # Custom React hooks (e.g., useNetworkStatus, useLocation)
│   └─ useNetworkStatus.ts
├─ store/                 # State management – **Zustand** (lightweight, no boiler‑plate)
│   ├─ useStore.ts           # Central store definition
│   └─ selectors.ts         # Helper selectors used by components
└─ utils/                 # Small pure helpers (date formatting, uuid wrapper, etc.)
    └─ formatDate.ts
```
---

## Public Service Contracts (imported from other developers)
```ts
/** AuthService – provided by Dev 2 (AI) */
export interface AuthService {
  /** Authenticate a raw image (camera frame). */
  authenticateUser(image: ImageData): Promise<AuthResult>;
}

/** EmployeeService – provided by Dev 3 (Backend) */
export interface EmployeeService {
  enrollEmployee(payload: EnrollPayload): Promise<Employee>;
  listEmployees(): Promise<Employee[]>;
}

/** AttendanceService – provided by Dev 3 (Backend) */
export interface AttendanceService {
  recordAttendance(record: AttendancePayload): Promise<AttendanceRecord>;
  listAttendance(): Promise<AttendanceRecord[]>;
  syncPending(): Promise<SyncResult>;
}
```
> **Never** import SQLite directly. All data operations go through the above services.
---

## Navigation (sample RootStack)
```tsx
// src/navigation/RootStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import AuthStack from './AuthStack';
import MainTabNavigator from './MainTabNavigator';

export type RootStackParams = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParams>();

export default function RootStack() {
  const { auth } = useStore();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {auth.isLoggedIn ? (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}
```
---

## Zustand Store (`src/store/useStore.ts`)
```ts
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Employee, AttendanceRecord } from '../types';

interface AuthSlice {
  isLoggedIn: boolean;
  user: { id: string; name: string } | null;
  login: (user: { id: string; name: string }) => void;
  logout: () => void;
}

interface EmployeeSlice {
  employees: Employee[];
  loadEmployees: () => Promise<void>;
  addEmployee: (e: Employee) => void;
}

interface AttendanceSlice {
  records: AttendanceRecord[];
  loadAttendance: () => Promise<void>;
  addRecord: (r: AttendanceRecord) => void;
  pendingSyncCount: number;
}

export const useStore = create<AppState>()(
  devtools(
    persist((set, get) => ({
      // AuthSlice
      isLoggedIn: false,
      user: null,
      login: user => set({ isLoggedIn: true, user }),
      logout: () => set({ isLoggedIn: false, user: null }),

      // EmployeeSlice
      employees: [],
      loadEmployees: async () => {
        // Calls EmployeeService (Dev 3) – placeholder implementation
        const service = get().employeeService;
        const list = await service.listEmployees();
        set({ employees: list });
      },
      addEmployee: e => set(state => ({ employees: [...state.employees, e] })),

      // AttendanceSlice
      records: [],
      loadAttendance: async () => {
        const svc = get().attendanceService;
        const list = await svc.listAttendance();
        set({ records: list });
      },
      addRecord: r => set(state => ({ records: [r, ...state.records] })),
      pendingSyncCount: 0,

      // Service references – injected at app start (see integration file)
      employeeService: null as any,
      attendanceService: null as any,
      authService: null as any,
    }) as AppState,
    { name: 'secureface-store' }
  )
);

// Types used by the store
export interface AppState extends AuthSlice, EmployeeSlice, AttendanceSlice {
  employeeService: EmployeeService;
  attendanceService: AttendanceService;
  authService: AuthService;
}
```
---

## UI Component Samples
### AppButton (`src/components/AppButton.tsx`)
```tsx
import React from 'react';
import { Button, ButtonProps } from 'react-native-paper';
import { colors } from '../theme/colors';

export const AppButton = (props: ButtonProps) => (
  <Button
    mode="contained"
    color={colors.primary}
    {...props}
  />
);
```

### AppInput (`src/components/AppInput.tsx`)
```tsx
import React from 'react';
import { TextInput, TextInputProps } from 'react-native-paper';

export const AppInput = (props: TextInputProps) => (
  <TextInput
    style={{ marginBottom: 12 }}
    {...props}
  />
);
```

### CameraPreview (`src/components/CameraPreview.tsx`)
```tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

export const CameraPreview = ({ onCapture }: { onCapture: (image: ImageData) => void }) => {
  const devices = useCameraDevices();
  const device = devices.back;
  const camera = useRef<Camera>(null);

  // Simple capture helper – you can replace with any library later
  const capture = async () => {
    if (camera.current) {
      const photo = await camera.current.takePhoto({ qualityPrioritization: 'speed' });
      // Convert the file URI to an ImageData object expected by AuthService
      const imageData: ImageData = { uri: `file://${photo.path}` } as any;
      onCapture(imageData);
    }
  };

  useEffect(() => {
    // auto‑capture after 3 seconds for demo purposes
    const timer = setTimeout(capture, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!device) return <View />;
  return (
    <Camera
      ref={camera}
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
      photo={true}
    />
  );
};
```
---

## Example Screen Flow (Employee Enrollment)
```tsx
// src/screens/EmployeeEnrollmentScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { CameraPreview } from '../components/CameraPreview';
import { useStore } from '../store/useStore';

export default function EmployeeEnrollmentScreen() {
  const [employeeId, setEmployeeId] = useState('');
  const [name, setName] = useState('');
  const [captured, setCaptured] = useState<ImageData[]>([]);
  const { employeeService, addEmployee } = useStore();

  const handleCapture = (img: ImageData) => {
    if (captured.length < 5) setCaptured([...captured, img]);
  };

  const handleEnroll = async () => {
    if (!employeeId || !name || captured.length !== 5) return;
    const payload = { employeeId, name, images: captured };
    const employee = await employeeService.enrollEmployee(payload);
    addEmployee(employee);
    // Reset UI
    setEmployeeId('');
    setName('');
    setCaptured([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enroll Employee</Text>
      <AppInput label="Employee ID" value={employeeId} onChangeText={setEmployeeId} />
      <AppInput label="Name" value={name} onChangeText={setName} />
      <Text>Capture 5 face images ({captured.length}/5)</Text>
      {captured.length < 5 && <CameraPreview onCapture={handleCapture} />}
      <AppButton mode="contained" onPress={handleEnroll} disabled={captured.length !== 5}>
        Enroll
      </AppButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, marginBottom: 16 },
});
```
---

## How to Wire Services (see *Integration* file)
The actual concrete implementations of `AuthService`, `EmployeeService`, and `AttendanceService` are **injected** into the Zustand store during app bootstrap (see `integration_spec.md`).
---

## Deliverable
A **markdown spec** that gives Developer 1 everything needed to start coding UI, navigation, reusable components, and state‑management without touching the database or AI layers.
