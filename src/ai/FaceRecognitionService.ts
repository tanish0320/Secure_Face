/**
 * SecureFace Edge AI - Face Recognition Service
 * Purpose: Perform facial matching using cosine similarity against enrolled embeddings.
 * Responsibilities: Similarity calculation, Best match finding, and Threshold enforcement.
 */

import { EmbeddingService } from './EmbeddingService';
import { AuthenticationResult, RecognitionMatch } from './RecognitionTypes';
import { RecognitionError } from './RecognitionErrors';
import { dbLogger } from '../database/types';

const RECOGNITION_THRESHOLD = 0.65;

export class FaceRecognitionService {
  private embeddingService: EmbeddingService;

  constructor() {
    this.embeddingService = EmbeddingService.getInstance();
  }

  /**
   * Recognizes a face by comparing its embedding against enrolled employees.
   */
  async recognizeFace(inputEmbedding: number[]): Promise<RecognitionMatch | null> {
    try {
      const enrolledEmployees = await this.embeddingService.getEnrolledEmployees();
      
      if (enrolledEmployees.length === 0) {
        dbLogger('WARN', 'Recognition attempt with zero enrolled employees.');
        return null;
      }

      let bestMatch: RecognitionMatch | null = null;
      let highestSimilarity = -1;

      for (const employee of enrolledEmployees) {
        // Parse the stored embedding string back into a number array
        const storedEmbedding: number[] = JSON.parse(employee.embedding);
        
        const similarity = this.cosineSimilarity(inputEmbedding, storedEmbedding);

        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
          bestMatch = {
            employeeId: employee.employee_id,
            similarity: similarity
          };
        }
      }

      // Apply threshold
      if (highestSimilarity < RECOGNITION_THRESHOLD) {
        dbLogger('INFO', `Recognition match rejected: Confidence ${highestSimilarity.toFixed(4)} below threshold ${RECOGNITION_THRESHOLD}`);
        return null;
      }

      dbLogger('INFO', `Face Recognized: ${bestMatch?.employeeId} (Confidence: ${highestSimilarity.toFixed(4)})`);
      return bestMatch;

    } catch (err) {
      dbLogger('ERROR', 'Face recognition process failed');
      throw new RecognitionError('Error during face comparison pipeline', err);
    }
  }

  /**
   * Calculates cosine similarity between two vectors.
   * Formula: (A · B) / (||A|| * ||B||)
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new RecognitionError('Embedding vector length mismatch.');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0; // Safe divide
    }

    return dotProduct / (normA * normB);
  }
}
