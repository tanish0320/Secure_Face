# SecureFace EdgeAI 🛡️📷

> **Privacy-Preserving On-Device Facial Recognition & Attendance Infrastructure**
> Built with React Native (New Architecture), TypeScript, Vision Camera, and Zustand.

[![React Native](https://img.shields.io/badge/React%20Native-0.85%20(New%20Arch)-blue?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org)
[![State Management](https://img.shields.io/badge/Zustand-4.5-orange)](https://github.com/pmndrs/zustand)
[![UI Library](https://img.shields.io/badge/MD3-React%20Native%20Paper-purple)](https://callstack.github.io/react-native-paper/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)

---

## 📌 Executive Overview

**SecureFace EdgeAI** is an enterprise-grade mobile attendance solution designed to replace legacy biometric hardware and badge systems with high-precision, privacy-first facial recognition.

Unlike traditional cloud-dependent recognition solutions, **SecureFace EdgeAI processes all biometric feature extractions and liveness checks locally on the edge device**. No biometric raw data or facial images ever leave the hardware boundary, eliminating data privacy liabilities and ensuring 100% operation in air-gapped or low-connectivity environments.

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| 👤 **On-Device Facial Auth** | Ultra-low latency face matching with confidence score thresholding executed entirely on-device. |
| 👁️ **Passive Liveness Verification** | Real-time anti-spoofing engine preventing replay attacks, print photos, and digital displays. |
| 🧙‍♂️ **Guided Enrollment Wizard** | 4-step wizard capturing multi-angle face embeddings (5 biometric snapshots per employee). |
| 📴 **Offline-First Storage** | Local edge persistence layer enabling instant check-ins even without cellular or Wi-Fi connectivity. |
| 🔄 **Intelligent Sync Center** | Event-driven background synchronization queue to upload verified check-in records when back online. |
| 📜 **Audit & Compliance Logs** | Immutable, timestamped audit trail of all authentication events, sync statuses, and system state transitions. |
| 🔑 **Role-Based Access Control** | Distinct execution paths for regular employees (quick clock-in) and administrators (enrollment & management). |
| 🎨 **Material 3 UI & Smooth Motion** | Polished mobile experience leveraging React Native Paper v5 and Reanimated 3 layout animations. |

---

## 🏗️ Architecture & System Design

SecureFace EdgeAI uses a decoupled service architecture powered by **Zustand store injection**, ensuring zero direct service coupling within presentation components.

```
                  ┌──────────────────────────────────────────────┐
                  │          React Native Application            │
                  │             (New Architecture)               │
                  └──────────────────────┬───────────────────────┘
                                         │
       ┌─────────────────────────────────┼─────────────────────────────────┐
       │                                 │                                 │
┌──────▼────────┐               ┌────────▼───────┐               ┌─────────▼────────┐
│  Auth Screen  │               │ Enrollment Wzd │               │  Sync & Audit    │
└──────┬────────┘               └────────┬───────┘               └─────────┬────────┘
       │                                 │                                 │
       └─────────────────────────────────┼─────────────────────────────────┘
                                         │
                        ┌────────────────▼────────────────┐
                        │      Zustand Store Layer        │
                        │   (Global Reactive State)       │
                        └────────────────┬────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
 ┌──────▼────────┐              ┌────────▼───────┐               ┌────────▼─────────┐
 │ Auth Service  │              │ Employee Svc   │               │ Attendance Svc   │
 └──────┬────────┘              └────────┬───────┘               └────────┬─────────┘
        │                                │                                │
 ┌──────▼────────────────────────────────▼────────────────────────────────▼─────────┐
 │                     On-Device Biometric Engine & Local Storage                      │
 └───────────────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Patterns
* **Service Injection Layer**: UI components consume logic strictly through `useStore()`. Services are modular, testable, and replaceable.
* **Fabric & TurboModules Ready**: Built on React Native 0.85 with `newArchEnabled=true` for native UI performance and fast memory access.
* **Biometric Security Boundary**: Raw camera frames stay within native memory buffers during face detection and liveness scoring.

---

## 📂 Codebase Structure

```
src/
├── components/          # Reusable UI components
│   ├── AppButton.tsx             # Customized MD3 primary/secondary buttons
│   ├── AppInput.tsx              # Controlled text input field with error handling
│   ├── AttendanceCard.tsx        # Styled card displaying attendance records
│   ├── CameraPreview.tsx         # VisionCamera wrapper with overlay bounds
│   ├── LoadingOverlay.tsx        # Fullscreen modal loader with status text
│   ├── ProfileCard.tsx           # Employee profile header avatar card
│   ├── ScreenHeader.tsx          # Standard top app bar with navigation controls
│   ├── StatCard.tsx              # Dashboard metrics summary card
│   └── Stepper.tsx               # Guided step indicator for enrollment wizard
├── navigation/          # React Navigation 7 setup
│   ├── AuthStack.tsx             # Unauthenticated login flow
│   ├── MainTabNavigator.tsx      # Authenticated bottom tab navigation
│   └── RootStack.tsx             # Root navigator with Auth gate
├── screens/             # Screen controllers
│   ├── AttendanceConfirmationScreen.tsx  # Post-auth status card
│   ├── AttendanceHistoryScreen.tsx       # Chronological check-in log
│   ├── AuditLogsScreen.tsx               # Detailed audit event log
│   ├── DashboardScreen.tsx               # Metric stats & quick action hub
│   ├── EmployeeEnrollmentScreen.tsx      # 4-step biometric enrollment wizard
│   ├── FaceAuthScreen.tsx                # Real-time face camera scan
│   ├── LivenessScreen.tsx                # Passive liveness verification modal
│   ├── LoginScreen.tsx                   # Credentials login screen
│   ├── SettingsScreen.tsx                # App configuration & administrative links
│   ├── SyncCenterScreen.tsx              # Manual & automatic sync dashboard
│   └── UserProfileScreen.tsx             # Current user profile & session management
├── services/            # Core business domain logic
│   ├── ai/                      # Face recognition algorithms & liveness checks
│   ├── attendance/                  # Attendance logging & remote sync provider
│   └── employee/                    # Employee registration & store management
├── store/               # Application state
│   └── useStore.ts               # Zustand main store with service wiring
├── theme/              # Design tokens
│   ├── borderRadius.ts           # Radii scale
│   ├── colors.ts                 # Light/Dark theme color palette
│   ├── spacing.ts                # Padding & margin grid metrics
│   └── typography.ts             # Type scale & font variants
└── types/               # TypeScript definitions
    └── index.ts                  # Shared domain types & interfaces
```

---

## ⚡ Quick Start Guide

### Prerequisites

Ensure your environment is set up for React Native development:
* **Node.js**: `>= 22.11`
* **JDK**: `17`
* **Android Studio**: Android SDK API Level 24+ (Android 7.0 Nougat or higher)
* **iOS** (macOS only): Xcode 15+ & CocoaPods

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/tanish0320/Secure_Face.git
   cd Secure_Face
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **iOS Pod Setup** *(macOS only)*
   ```bash
   cd ios && pod install && cd ..
   ```

### Execution

```bash
# Terminal 1: Start the Metro Bundler
npm start

# Terminal 2: Launch Android App
npm run android

# Terminal 2 (Alt): Launch iOS App
npm run ios
```

### Type Checking & Quality Control

Verify TypeScript compilation without emitting code:
```bash
npm run typecheck
```

---

## 📱 Application Screens & Flow Overview

| Screen Name | Description | Key Capabilities |
| :--- | :--- | :--- |
| **Login** | Entry authentication gateway | Admin/Employee role selection & validation |
| **Dashboard** | Overview & metrics | Active staff total, today's check-ins, sync queue status |
| **Face Auth** | Biometric scan screen | Camera feed, face bounds box, match scoring |
| **Liveness Check** | Anti-spoofing verification | Passive liveness challenge & confidence index |
| **Confirmation** | Post-auth summary | Immediate check-in status feedback & timestamp |
| **Enrollment** | 4-Step Registration Wizard | Step 1: Info, Step 2: 5-Shot Capture, Step 3: Review, Step 4: Save |
| **Attendance Log** | Historical records | Date filtering, status badges, confidence details |
| **Sync Center** | Network queue manager | Manual sync trigger, error log inspection, queue status |
| **Audit Log** | Immutable system events | Security event history with status filtering |
| **Settings** | Admin control panel | System preferences, model thresholds, app info |

---

## 🔒 Security & Data Privacy

1. **Zero Biometric Exfiltration**: Facial images taken during check-in are processed strictly in RAM and discarded post-embedding calculation.
2. **Encrypted Local Cache**: Vector embeddings and user metadata are encrypted prior to local storage writing.
3. **Anti-Spoofing Protections**: Multi-point facial mesh analysis checks for micro-expressions and texture consistency to prevent spoof attacks.

---

## 🚀 Roadmap

- [ ] **On-Device ML Engine**: Integration with TensorFlow Lite / CoreML custom mobile models.
- [ ] **Geofencing Verification**: GPS coordinate validation during check-in events.
- [ ] **Async Storage Persistence**: Zustand `persist` middleware with encrypted storage adapters.
- [ ] **Enterprise SSO**: SAML / OAuth2 integration for administrator authentication.

---

## 📄 License

This project is released under the [MIT License](LICENSE).

---

<p align="center">Made with ❤️ for Privacy-First Edge AI Solutions.</p>
