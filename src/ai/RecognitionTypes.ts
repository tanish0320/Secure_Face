/**
 * SecureFace Edge AI - Recognition Types
 */

export interface AuthenticationResult {
  employeeId: string;
  recognitionScore: number;
  livenessScore: number;
}

export interface RecognitionMatch {
  employeeId: string;
  similarity: number;
}

export interface LivenessResult {
  score: number;
  passed: boolean;
}

export interface FaceLandmarks {
  leftEye: Point[];
  rightEye: Point[];
  nose: Point;
  mouth: Point;
  faceOutline: Point[];
}

export interface Point {
  x: number;
  y: number;
  z?: number;
}
