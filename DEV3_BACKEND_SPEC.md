# Developer 3 – Backend & Data Lead

## Goal
Provide a **SQLite‑based offline storage layer**, repository abstractions, and a **sync engine** that pushes pending attendance records to an AWS endpoint. All APIs are **type‑safe** and exposed to the UI via service interfaces.

---

## Folder Layout (under `src/`)
```
src/
├─ database/                # Low‑level SQLite wrapper & bootstrap
│   ├─ index.ts
│   └─ migrations.ts       # Table creation statements
├─ repositories/            # Data‑access objects – no business logic
│   ├─ employeeRepository.ts
│   └─ attendanceRepository.ts
├─ services/                # Public service contracts used by the UI (Dev 1)
│   ├─ employee/            # Employee operations (enroll, list)
│   │   └─ EmployeeService.ts
│   ├─ attendance/          # Attendance operations (record, list, sync)
│   │   └─ AttendanceService.ts
│   └─ sync/                # Sync engine – triggers AWS upload
│       └─ SyncService.ts
├─ api/                     # Simple wrapper around the remote AWS endpoint
│   └─ attendanceApi.ts
└─ utils/                  # Small helpers (e.g., uuid, date helpers)
    └─ uuid.ts
```
---

## Types (shared across modules)
```ts
// src/types.ts (re‑exported where needed)
export interface EmployeeRecord {
  employee_id: string;
  name: string;
  /** Base64‑encoded MobileFaceNet embedding (128 float32) */
  embedding: string;
  created_at: string; // ISO string
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  timestamp: string; // ISO string
  gps: string; // "lat,lon"
  sync_status: 'pending' | 'synced';
}
```
---

## 1️⃣ SQLite bootstrap (`src/database/index.ts`)
```ts
import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let db: SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabase({ name: 'secureface.db', location: 'default' });
  await runMigrations(db);
  return db;
}

/** Create tables if they do not exist – executed on first open */
async function runMigrations(database: SQLiteDatabase): Promise<void> {
  const queries = [
    `CREATE TABLE IF NOT EXISTS employees (
      employee_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      embedding TEXT NOT NULL,
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      gps TEXT NOT NULL,
      sync_status TEXT NOT NULL CHECK (sync_status IN ('pending','synced')),
      FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
    );`
  ];
  for (const q of queries) {
    await database.executeSql(q);
  }
}
```
---

## 2️⃣ Repositories
### Employee Repository (`src/repositories/employeeRepository.ts`)
```ts
import { getDB } from '../database';
import type { EmployeeRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const employeeRepository = {
  /** Insert a new employee (embedding should already be pre‑computed) */
  async create(payload: { employee_id: string; name: string; embedding: string }): Promise<EmployeeRecord> {
    const db = await getDB();
    const created_at = new Date().toISOString();
    await db.executeSql(
      `INSERT INTO employees (employee_id, name, embedding, created_at) VALUES (?,?,?,?);`,
      [payload.employee_id, payload.name, payload.embedding, created_at]
    );
    return { ...payload, created_at };
  },

  async getAll(): Promise<EmployeeRecord[]> {
    const db = await getDB();
    const [result] = await db.executeSql('SELECT * FROM employees ORDER BY created_at DESC;');
    const rows = result.rows;
    const list: EmployeeRecord[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows.item(i);
      list.push(r as EmployeeRecord);
    }
    return list;
  },

  async findById(id: string): Promise<EmployeeRecord | null> {
    const db = await getDB();
    const [result] = await db.executeSql('SELECT * FROM employees WHERE employee_id = ?;', [id]);
    if (result.rows.length === 0) return null;
    return result.rows.item(0) as EmployeeRecord;
  },
};
```
---
### Attendance Repository (`src/repositories/attendanceRepository.ts`)
```ts
import { getDB } from '../database';
import type { AttendanceRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const attendanceRepository = {
  async create(payload: { employee_id: string; gps: string }): Promise<AttendanceRecord> {
    const db = await getDB();
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    const sync_status: 'pending' = 'pending';
    await db.executeSql(
      `INSERT INTO attendance (id, employee_id, timestamp, gps, sync_status) VALUES (?,?,?,?,?);`,
      [id, payload.employee_id, timestamp, payload.gps, sync_status]
    );
    return { id, employee_id: payload.employee_id, timestamp, gps: payload.gps, sync_status };
  },

  async getAll(): Promise<AttendanceRecord[]> {
    const db = await getDB();
    const [result] = await db.executeSql('SELECT * FROM attendance ORDER BY timestamp DESC;');
    const rows = result.rows;
    const list: AttendanceRecord[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows.item(i);
      list.push(r as AttendanceRecord);
    }
    return list;
  },

  async getPending(): Promise<AttendanceRecord[]> {
    const db = await getDB();
    const [result] = await db.executeSql('SELECT * FROM attendance WHERE sync_status = "pending";');
    const rows = result.rows;
    const pending: AttendanceRecord[] = [];
    for (let i = 0; i < rows.length; i++) {
      pending.push(rows.item(i) as AttendanceRecord);
    }
    return pending;
  },

  async markSynced(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await getDB();
    const placeholders = ids.map(() => '?').join(',');
    await db.executeSql(
      `UPDATE attendance SET sync_status = 'synced' WHERE id IN (${placeholders});`,
      ids
    );
  }
};
```
---

## 3️⃣ Service Layer (public contracts used by UI)
### Employee Service (`src/services/employee/EmployeeService.ts`)
```ts
import type { EmployeeRecord } from '../../types';
import { employeeRepository } from '../../repositories/employeeRepository';
import { v4 as uuidv4 } from 'uuid';

/** Payload received from the UI when enrolling */
export interface EnrollPayload {
  employeeId: string;
  name: string;
  /** Array of 5 base64‑encoded face images (raw) */
  images: string[];
}

/** The Service – thin wrapper around the repository + embedding generation */
export const employeeService = {
  /** Enrolls a new employee. */
  async enrollEmployee(payload: EnrollPayload): Promise<EmployeeRecord> {
    // In the MVP we **mock** embedding generation – concatenate the first image’s base64
    // and hash it to a 128‑float vector (real world: run MobileFaceNet).
    const mockEmbedding = Buffer.from(payload.images[0] ?? '').toString('base64');
    return await employeeRepository.create({
      employee_id: payload.employeeId,
      name: payload.name,
      embedding: mockEmbedding,
    });
  },

  async listEmployees(): Promise<EmployeeRecord[]> {
    return await employeeRepository.getAll();
  }
};
```
---
### Attendance Service (`src/services/attendance/AttendanceService.ts`)
```ts
import type { AttendanceRecord } from '../../types';
import { attendanceRepository } from '../../repositories/attendanceRepository';
import { v4 as uuidv4 } from 'uuid';

/** Payload from the UI when marking attendance */
export interface AttendancePayload {
  employeeId: string;
  gps: string; // "lat,lon"
}

export const attendanceService = {
  async recordAttendance(payload: AttendancePayload): Promise<AttendanceRecord> {
    return await attendanceRepository.create({ employee_id: payload.employeeId, gps: payload.gps });
  },

  async listAttendance(): Promise<AttendanceRecord[]> {
    return await attendanceRepository.getAll();
  },

  async syncPending(): Promise<void> {
    const pending = await attendanceRepository.getPending();
    if (pending.length === 0) return; // nothing to sync
    await syncService.upload(pending);
    await attendanceRepository.markSynced(pending.map(r => r.id));
  }
};
```
---
### Sync Service (`src/services/sync/SyncService.ts`)
```ts
import type { AttendanceRecord } from '../../types';
import { uploadAttendance } from '../../api/attendanceApi';

export const syncService = {
  /** Upload an array of attendance records to AWS */
  async upload(records: AttendanceRecord[]): Promise<void> {
    const payload = { records };
    await uploadAttendance(payload);
  }
};
```
---
## 4️⃣ Remote API Wrapper (`src/api/attendanceApi.ts`)
```ts
/**
 * Mock AWS call – in a real build replace the URL with your API‑Gateway endpoint.
 */
export async function uploadAttendance(payload: { records: any[] }): Promise<void> {
  // Simulate network latency & occasional failure for demo purposes
  await new Promise(r => setTimeout(r, 800));
  const success = Math.random() > 0.1; // 90% chance success
  if (!success) throw new Error('Network error – sync failed');
  // No actual fetch – placeholder for real fetch call
  console.log('🔁 Sync payload sent to AWS:', JSON.stringify(payload));
}
```
---

## 5️⃣ Utility – UUID helper (`src/utils/uuid.ts`)
```ts
import { v4 as uuidv4 } from 'uuid';
export const generateId = () => uuidv4();
```
---

## 6️⃣ Integration with UI (Dev 1)
* The UI obtains the services via **dependency injection** when the app boots (see `integration_spec.md`).
* Example injection code (simplified):
```ts
import { employeeService } from './services/employee/EmployeeService';
import { attendanceService } from './services/attendance/AttendanceService';
import { authService } from '../services/ai'; // provided by Dev 2

// Set the services into the global Zustand store defined by Dev 1
useStore.setState({ employeeService, attendanceService, authService });
```
---

## 7️⃣ What’s Provided to Other Teams
* **Public TypeScript interfaces** (`EmployeeService`, `AttendanceService`, `SyncService`) – these are the only contracts the UI may import.
* **SQLite schema** – kept internal to the backend layer; UI never accesses it directly.
* **Mock AWS sync** – simple promise‑based function that can be swapped with a real fetch call.
---

## Deliverable
A **markdown specification** (`DEV3_BACKEND_SPEC.md`) that details the database tables, repository functions, service contracts, and mock sync implementation.
