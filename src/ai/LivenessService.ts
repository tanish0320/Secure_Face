/**
 * SecureFace Edge AI - Liveness Service
 * Purpose: Detect spoofing attempts using behavioral biometrics.
 * Responsibilities: Blink detection (EAR) and Head movement challenge.
 */

import { LivenessResult, FaceLandmarks, Point } from './RecognitionTypes';
import { LivenessError } from './RecognitionErrors';
import { dbLogger } from '../database/types';

const LIVENESS_THRESHOLD = 0.70;

export class LivenessService {
  /**
   * Calculates a consolidated liveness score based on EAR and head pose.
   * 
   * NOTE: In a real mobile environment, landmarks are provided by MediaPipe/TF Lite
   * frame-by-frame. This service processes the landmarks extracted from those frames.
   */
  calculateLivenessScore(landmarks: FaceLandmarks, blinkDetected: boolean, movementDetected: boolean): LivenessResult {
    try {
      let score = 0;

      // 1. Blink Detection (Contribution: 50%)
      if (blinkDetected) {
        score += 0.5;
      }

      // 2. Head Movement Challenge (Contribution: 50%)
      // This assumes the UI challenged the user to move and the AI tracked it.
      if (movementDetected) {
        score += 0.5;
      }

      const passed = score >= LIVENESS_THRESHOLD;

      dbLogger('INFO', `Liveness Check: Score ${score.toFixed(2)} - ${passed ? 'PASSED' : 'FAILED'}`);

      return {
        score,
        passed
      };
    } catch (err) {
      dbLogger('ERROR', 'Liveness score calculation failed');
      throw new LivenessError('Error during spoofing detection', err);
    }
  }

  /**
   * Calculates the Eye Aspect Ratio (EAR) for a single eye.
   * Formula: (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
   */
  calculateEAR(eyeLandmarks: Point[]): number {
    if (eyeLandmarks.length < 6) return 0;

    const p1 = eyeLandmarks[0];
    const p2 = eyeLandmarks[1];
    const p3 = eyeLandmarks[2];
    const p4 = eyeLandmarks[3];
    const p5 = eyeLandmarks[4];
    const p6 = eyeLandmarks[5];

    const v1 = this.getDistance(p2, p6);
    const v2 = this.getDistance(p3, p5);
    const h = this.getDistance(p1, p4);

    if (h === 0) return 0;

    return (v1 + v2) / (2.0 * h);
  }

  private getDistance(a: Point, b: Point): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
}
