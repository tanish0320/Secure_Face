# SecureFace Edge AI - Backend & AI Integration

SecureFace Edge AI is a production-grade, offline-first facial recognition attendance system built with React Native and TypeScript. It features a hardened security layer, transactional data synchronization, and an advanced behavioral biometrics pipeline.

## 🚀 Key Features

- **Offline-First Architecture**: Full SQLite local persistence with automatic background synchronization.
- **Biometric Pipeline**: Cosine similarity matching (Threshold: 0.65) and EAR-based liveness detection (Threshold: 0.70).
- **Hardened Security**: AES-256 hardware-backed encryption (via Keychain) for biometric embeddings and audit logs.
- **Data Lifecycle Management**: Automatic retention policies (90/180 days) and periodic synchronization telemetry.
- **Audit Integrity**: Mandatory UUID-based audit trails for every enrollment, authentication, and system event.

## 🏗️ Architecture

The codebase is organized into four distinct layers following the Repository and Service patterns:

```text
src/
├── ai/             # Facial Recognition & Liveness Logic
├── api/            # Cloud Communication (AWS Abstraction)
├── database/       # SQLite Infrastructure & Migrations
├── repositories/   # Data Access Layer (Validated & Prepared Statements)
├── security/       # AES Encryption, Key Management & Retention
├── services/       # Business Logic (Employee, Attendance, Sync)
├── types/          # Shared TypeScript Interfaces
└── validation/     # Centralized Validator Pipeline
```

### End-to-End Workflow

1.  **ML Bridge**: Landmarks and embedding vectors are extracted from the camera feed.
2.  **AI Orchestration**: The `AIIntegrationService` performs recognition matching and behavioral spoofing checks.
3.  **Secure Persistence**: On success, the `AttendanceService` encrypts data and stores it in the local SQLite database.
4.  **Sync Engine**: The `SyncService` monitors connectivity and performs signed HMAC-SHA256 uploads to the cloud.

## 🛠️ Installation

### Prerequisites
- Node.js >= 18
- React Native Development Environment
- Hardware support for Keychain (iOS) or Keystore (Android)

### Setup
```bash
# Clone the repository
git clone https://github.com/your-username/secureface-edgeai.git
cd secureface-edgeai

# Install dependencies
npm install

# Link native modules (if not using autolinking)
cd ios && pod install && cd ..
```

### Dependencies
- `react-native-sqlite-storage`: SQLite persistence layer.
- `crypto-js`: AES-256 and HMAC-SHA256 implementations.
- `react-native-keychain`: Hardware-backed key storage.
- `@react-native-async-storage/async-storage`: Persistent configuration fallback.
- `@react-native-community/netinfo`: Real-time connectivity monitoring.

## 🔒 Security Policy

- **Zero-Storage of Plaintext Biometrics**: All embeddings are encrypted *before* hitting the disk.
- **No Sensitive Logging**: GPS coordinates, raw images, and face vectors are explicitly excluded from all logs.
- **Unique Installation Keys**: Every device generates its own cryptographically unique master key; no shared fallback keys are used.
- **Transactional Atomicity**: Business operations (Enrollment/Attendance) and their corresponding Audit logs are treated as single logical units with rollback protection.

## 📊 Diagnostics

The system includes built-in diagnostic tools to verify health at startup:

```typescript
const health = await checkDatabaseHealth();
const security = await validateSecurityConfiguration();
const sync = await validateSyncConfiguration();
```

## 📝 License

This project is part of the Edge AI Hackathon. All rights reserved.
