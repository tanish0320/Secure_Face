import type { ImageData, AuthResult } from '../../types';

/**
 * Mock AI authentication service – implements the public contract expected by the UI.
 * Returns a deterministic successful result for any image (suitable for MVP demo).
 */
export const authService = {
  async authenticateUser(image: ImageData): Promise<AuthResult> {
    // In a real implementation you would run detection, embedding, liveness, etc.
    // Here we simply return a fixed successful result.
    return {
      recognized: true,
      employeeId: 'E001',
      confidence: 0.97,
      livenessPassed: true,
      livenessScore: 0.94,
    };
  },
};
