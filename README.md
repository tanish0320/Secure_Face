# SecureFace EdgeAI

> **Hackathon MVP** — Edge-deployed face recognition attendance system for enterprise environments.

[![React Native](https://img.shields.io/badge/React%20Native-0.85-blue?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org)
[![Zustand](https://img.shields.io/badge/Zustand-4.x-orange)](https://github.com/pmndrs/zustand)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## Overview

SecureFace EdgeAI is a mobile application that replaces traditional badge-based attendance systems with on-device face recognition. Authentication, liveness detection, and attendance logging all occur locally on the device — no biometric data ever leaves the hardware.

Designed for deployment in enterprise environments where security, offline capability, and data privacy are non-negotiable requirements.

---

## Features

| Feature | Description |
|---------|-------------|
| **Face Authentication** | Capture → AI recognition → liveness check → attendance log in a single flow |
| **Liveness Detection** | Anti-spoofing check to prevent photo-based attacks |
| **Employee Enrollment** | 4-step guided wizard to enroll employees with 5-image face capture |
| **Offline-First** | All AI inference runs on-device; records sync when connectivity is available |
| **Attendance History** | Full log of check-ins with timestamps and recognition confidence scores |
| **Sync Center** | Manual and automatic sync of pending records to the backend |
| **Audit Logs** | Immutable record of all authentication events with sync status indicators |
| **Role-Based Access** | Separate flows for administrators (enrollment) and employees (authentication) |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                  React Native App            │
│                                              │
│  ┌──────────┐   ┌──────────┐  ┌──────────┐  │
│  │   Auth   │   │Enrollment│  │ History  │  │
│  │  Screen  │   │  Wizard  │  │ & Audit  │  │
│  └────┬─────┘   └────┬─────┘  └────┬─────┘  │
│       │              │              │         │
│  ┌────▼──────────────▼──────────────▼─────┐  │
│  │          Zustand Global Store           │  │
│  │  (auth, employees, records, sync)       │  │
│  └────┬──────────────┬──────────────┬─────┘  │
│       │              │              │         │
│  ┌────▼────┐  ┌──────▼───┐  ┌──────▼──────┐  │
│  │  Auth   │  │ Employee │  │ Attendance  │  │
│  │ Service │  │ Service  │  │  Service    │  │
│  └────┬────┘  └──────┬───┘  └──────┬──────┘  │
│       │              │              │         │
│  ┌────▼──────────────▼──────────────▼─────┐  │
│  │       On-Device AI + Edge Backend       │  │
│  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**Key design decisions:**
- **Service injection via Zustand** — All screens access services exclusively through the store. Zero direct service imports in UI code.
- **Edge-first** — AI inference is designed to run on-device; backend sync is asynchronous and optional.
- **New Architecture** — Built on React Native's New Architecture (Fabric + TurboModules) via `newArchEnabled=true`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.85 (New Architecture) |
| Language | TypeScript 5.8 — strict mode, 0 errors |
| State Management | Zustand 4 |
| Navigation | React Navigation 7 (Native Stack + Bottom Tabs) |
| Camera | react-native-vision-camera v4 |
| Animations | react-native-reanimated 3 |
| Gestures | react-native-gesture-handler 2 |
| UI Components | react-native-paper (Material Design 3) |
| Safe Areas | react-native-safe-area-context 5 |

---

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── AppButton.tsx
│   ├── AppInput.tsx
│   ├── CameraPreview.tsx
│   ├── LoadingOverlay.tsx
│   ├── ProfileCard.tsx
│   ├── ScreenHeader.tsx
│   ├── StatCard.tsx
│   └── AttendanceCard.tsx
├── navigation/          # React Navigation setup
│   ├── RootStack.tsx    # Auth gate + root navigator
│   ├── AuthStack.tsx    # Unauthenticated flow
│   └── MainTabNavigator.tsx
├── screens/             # All application screens
│   ├── LoginScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── FaceAuthScreen.tsx
│   ├── LivenessScreen.tsx
│   ├── AttendanceConfirmationScreen.tsx
│   ├── EmployeeEnrollmentScreen.tsx
│   ├── AttendanceHistoryScreen.tsx
│   ├── AuditLogsScreen.tsx
│   ├── SyncCenterScreen.tsx
│   ├── UserProfileScreen.tsx
│   └── SettingsScreen.tsx
├── services/            # Business logic & API layer
│   ├── ai/             # Face recognition + liveness
│   ├── employee/       # Employee management
│   └── attendance/     # Attendance recording + sync
├── store/
│   └── useStore.ts      # Zustand global store
├── theme/              # Design tokens
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── borderRadius.ts
└── types/              # Shared TypeScript types
    └── index.ts
```

---

## Setup & Installation

### Prerequisites

- Node.js ≥ 22.11
- Android Studio with Android SDK (API 24+)
- Java Development Kit (JDK 17)
- For iOS: Xcode 15+ and CocoaPods

### Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/SecureFace_EdgeAI_Hackathon7.git
cd SecureFace_EdgeAI_Hackathon7

# Install JavaScript dependencies
npm install

# iOS only — install CocoaPods native dependencies
cd ios && pod install && cd ..
```

### Run

```bash
# Start Metro bundler (keep running in a separate terminal)
npm start

# Android
npm run android

# iOS
npm run ios
```

### Type Check

```bash
npm run typecheck
```

---

## Screens

| Screen | Description |
|--------|-------------|
| Login | Authentication gate with credential entry |
| Dashboard | Stats overview — employees, attendance records, pending sync |
| Face Authentication | Camera capture → recognition → liveness → attendance recording |
| Liveness Check | Anti-spoofing verification modal |
| Attendance Confirmation | Post-auth confirmation with employee details and confidence score |
| Employee Enrollment | 4-step wizard: details → 5 face images → review → enroll |
| Attendance History | Chronological log of all check-ins |
| Audit Logs | Full event log with sync status indicators |
| Sync Center | Manual sync trigger with status display |
| User Profile | Current user details and logout |
| Settings | Navigation to all administrative screens |

---

## Permissions Required

| Permission | Platform | Purpose |
|-----------|----------|---------|
| `CAMERA` | Android + iOS | Face capture for authentication and enrollment |
| `INTERNET` | Android | Backend sync |

---

## Future Improvements

- [ ] **Real AI Model Integration** — Replace mock services with on-device ML model (TensorFlow Lite / Core ML)
- [ ] **Geolocation** — Replace hardcoded GPS `'0,0'` with `react-native-geolocation-service`
- [ ] **Offline Persistence** — Add `@react-native-async-storage/async-storage` + Zustand `persist` middleware
- [ ] **Push Notifications** — Alert managers on failed authentication attempts
- [ ] **Multi-Site Support** — Multiple locations / department grouping
- [ ] **Biometric Fallback** — Fingerprint / Face ID as secondary authentication method
- [ ] **Analytics Dashboard** — Attendance trends, late arrivals, absent employees
- [ ] **Export** — CSV / PDF attendance reports

---

## Contributing

This project was developed as a hackathon MVP. For contributions:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push and open a Pull Request

---

## License

MIT © 2024 SecureFace Team
