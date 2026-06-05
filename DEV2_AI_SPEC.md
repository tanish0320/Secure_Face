# Developer 2 – AI / Face‑Recognition Lead

## Overview
This module lives under **`src/services/ai`** and provides a **single public interface** for the frontend:
```ts
authenticateUser(image: ImageData): Promise<AuthResult>
```
All internal steps (face detection, embedding generation, matching, blink‑based liveness) are **mocked** for the MVP but follow the real‑world SDK signatures (BlazeFace, MobileFaceNet, MediaPipe). The implementation can be swapped out later with TensorFlow‑Lite models without changing the public contract.

---

## Folder Structure
```
src/services/ai/
├─ detection/            # BlazeFace face detection wrapper
│   └─ blazefaceDetector.ts
├─ recognition/          # MobileFaceNet embedding generator
│   └─ mobileFaceNet.ts
├─ liveness/             # Blink detection (MediaPipe Face Mesh based)
│   └─ blinkLiveness.ts
└─ index.ts              # Public AuthService façade
```
---

## Types
```ts
// src/services/ai/types.ts (exported from index.ts)
export interface ImageData {
  /** URI of the captured image – e.g. `file://…` */
  uri: string;
  /** Optional base64 representation – useful for web fallback */
  base64?: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export type Embedding = Float32Array; // 128‑dim vector for MobileFaceNet

export interface AuthResult {
  recognized: boolean;
  employeeId?: string;
  confidence?: number; // 0‑1 similarity score
  livenessPassed: boolean;
  livenessScore?: number; // 0‑1 confidence blink detection
}
```
---

## Detection – BlazeFace (mocked)
```ts
// src/services/ai/detection/blazefaceDetector.ts
import type { ImageData, BoundingBox } from '../index';

/**
 * Mock implementation – returns a random bounding box with high confidence.
 * In production replace with @tensorflow-models/blazeface.
 */
export async function detectFace(image: ImageData): Promise<BoundingBox | null> {
  // Simulate async inference latency
  await new Promise(r => setTimeout(r, 200));
  const hasFace = Math.random() > 0.05; // 95% chance a face is found in demo images
  if (!hasFace) return null;
  return {
    x: 0.1,
    y: 0.2,
    width: 0.8,
    height: 0.8,
    confidence: Number((0.85 + Math.random() * 0.1).toFixed(2)),
  };
}
```
---

## Recognition – MobileFaceNet (mocked)
```ts
// src/services/ai/recognition/mobileFaceNet.ts
import type { ImageData, Embedding } from '../index';

/**
 * Returns a deterministic pseudo‑random embedding based on the image URI.
 * Real implementation would load a TFLite model and run inference.
 */
export async function generateEmbedding(image: ImageData): Promise<Embedding> {
  await new Promise(r => setTimeout(r, 300)); // simulate model load / inference time
  const seed = image.uri.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const arr = new Float32Array(128);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = ((seed * (i + 1)) % 1000) / 1000;
  }
  return arr;
}
```
---

## Liveness – Blink Detection (mocked)
```ts
// src/services/ai/liveness/blinkLiveness.ts
import type { ImageData } from '../index';

/**
 * Mock blink detector – randomly decides if a blink was detected.
 * In a real app you would feed the image sequence to MediaPipe Face Mesh
 * and analyse eye‑aspect‑ratio over a short window.
 */
export async function checkLiveness(image: ImageData): Promise<{ passed: boolean; score: number }> {
  await new Promise(r => setTimeout(r, 200));
  const score = Number((0.75 + Math.random() * 0.25).toFixed(2)); // 0.75‑1.0 confidence
  const passed = score >= 0.85; // threshold for MVP
  return { passed, score };
}
```
---

## Public Facade – `AuthService`
```ts
// src/services/ai/index.ts
import type { ImageData, AuthResult } from './types';
import { detectFace } from './detection/blazefaceDetector';
import { generateEmbedding } from './recognition/mobileFaceNet';
import { checkLiveness } from './liveness/blinkLiveness';
import { employeeRepository } from '../../repositories/employeeRepository'; // provided by Dev 3

/**
 * Core function used by the UI (Dev 1).
 * Steps:
 *   1️⃣ Detect a face – if none, fail.
 *   2️⃣ Generate an embedding.
 *   3️⃣ Compare to stored embeddings (simple cosine similarity > 0.8 => match).
 *   4️⃣ Run liveness detection.
 * Returns a structured result for the frontend to display.
 */
export async function authenticateUser(image: ImageData): Promise<AuthResult> {
  // 1️⃣ Face detection
  const bbox = await detectFace(image);
  if (!bbox) {
    return { recognized: false, livenessPassed: false };
  }

  // 2️⃣ Embedding generation
  const queryEmbedding = await generateEmbedding(image);

  // 3️⃣ Simple linear search against stored employees (Dev 3 repo)
  const allEmployees = await employeeRepository.getAll();
  let bestMatch: { employeeId: string; similarity: number } | null = null;

  for (const emp of allEmployees) {
    // emp.embedding is stored as a Float32Array (or base64‑string that you can decode)
    const stored = new Float32Array(emp.embedding);
    const similarity = cosineSimilarity(queryEmbedding, stored);
    if (similarity > 0.80 && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = { employeeId: emp.employee_id, similarity };
    }
  }

  // 4️⃣ Liveness (blink) detection
  const liveness = await checkLiveness(image);

  if (bestMatch) {
    return {
      recognized: true,
      employeeId: bestMatch.employeeId,
      confidence: Number(bestMatch.similarity.toFixed(2)),
      livenessPassed: liveness.passed,
      livenessScore: liveness.score,
    };
  }

  return { recognized: false, livenessPassed: liveness.passed, livenessScore: liveness.score };
}

/** Utility – cosine similarity */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Export the public façade type
export const authService = { authenticateUser };
```
---

## Integration Notes for Developer 3
* The AI module expects an **employee repository** exposing `getAll(): Promise<EmployeeRecord[]>` where each record contains `employee_id: string` and `embedding: Uint8Array | Float32Array`.
* In the MVP we store the embedding as a **base64‑encoded string** in SQLite (see Dev 3 spec). Convert back with `new Float32Array(atob(base64).split(',').map(Number))` before similarity.
* The **public contract** for the UI is the `AuthResult` interface – no direct access to detection/recognition functions.
---

## Deliverable
A **markdown spec** (`DEV2_AI_SPEC.md`) that defines the AI service layout, mock implementations, types, and the single public façade `authenticateUser`.
