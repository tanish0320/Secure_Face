/**
 * SecureFace Edge AI - AI Integration Service
 * Purpose: Orchestrate the end-to-end AI workflows for enrollment and authentication.
 * Responsibilities: Integrate AI logic with Dev3 Backend Services.
 */

import { EmployeeService } from '../services/employee/EmployeeService';
import { AttendanceService } from '../services/attendance/AttendanceService';
import { FaceRecognitionService } from './FaceRecognitionService';
import { LivenessService } from './LivenessService';
import { EmbeddingService } from './EmbeddingService';
import { RecognitionError, LivenessError } from './RecognitionErrors';
import { AuthenticationResult, FaceLandmarks } from './RecognitionTypes';
import { dbLogger } from '../database/types';

export class AIIntegrationService {
  private employeeService: EmployeeService;
  private attendanceService: AttendanceService;
  private recognitionService: FaceRecognitionService;
  private livenessService: LivenessService;
  private embeddingService: EmbeddingService;

  constructor() {
    this.employeeService = new EmployeeService();
    this.attendanceService = new AttendanceService();
    this.recognitionService = new FaceRecognitionService();
    this.livenessService = new LivenessService();
    this.embeddingService = EmbeddingService.getInstance();
  }

  /**
   * Enrolls a new employee face into the secure backend.
   * Flow: Capture -> Generate Embedding -> Backend Store
   */
  async enrollEmployeeFace(employeeId: string, name: string, embedding: number[]): Promise<void> {
    try {
      dbLogger('INFO', `Starting AI Enrollment for: ${employeeId}`);
      
      // We pass the stringified embedding to the service which handles encryption.
      await this.employeeService.enrollEmployee({
        employeeId,
        name,
        embedding: JSON.stringify(embedding)
      });

      // Refresh the embedding cache to include the new employee
      await this.embeddingService.getEnrolledEmployees(true);
      
      dbLogger('INFO', `AI Enrollment successful for: ${employeeId}`);
    } catch (err) {
      dbLogger('ERROR', `AI Enrollment failed for: ${employeeId}`);
      throw err;
    }
  }

  /**
   * Authenticates a user by face and records attendance.
   * Flow: Capture -> Generate Embedding -> Recognition -> Liveness -> Attendance
   */
  async authenticateFace(
    inputEmbedding: number[], 
    landmarks: FaceLandmarks, 
    blinkDetected: boolean, 
    movementDetected: boolean,
    gps: string
  ): Promise<AuthenticationResult> {
    try {
      // 1. Face Recognition
      const match = await this.recognitionService.recognizeFace(inputEmbedding);
      if (!match) {
        throw new RecognitionError('Face not recognized or confidence too low.');
      }

      // 2. Liveness Detection
      const liveness = this.livenessService.calculateLivenessScore(landmarks, blinkDetected, movementDetected);
      if (!liveness.passed) {
        throw new LivenessError('Liveness check failed. Potential spoofing attempt detected.');
      }

      // 3. Record Attendance via Backend
      await this.attendanceService.recordAttendance({
        employeeId: match.employeeId,
        recognitionScore: match.similarity,
        livenessScore: liveness.score,
        gps: gps
      });

      dbLogger('INFO', `Authentication Successful: ${match.employeeId}`);

      return {
        employeeId: match.employeeId,
        recognitionScore: match.similarity,
        livenessScore: liveness.score
      };

    } catch (err) {
      dbLogger('ERROR', 'AI Authentication Pipeline failed');
      throw err;
    }
  }
}
