/**
 * Type definitions for delivery proof submissions.
 *
 * After completing a task, a robot submits cryptographic proof of work
 * via HCS. These types define the proof message schema anchoring
 * off-chain evidence hashes to the consensus ledger.
 */

/** Proof-of-completion message submitted by a robot after finishing a task. */
export interface ProofSubmission {
  /** Discriminator for message routing. */
  type: "proof";
  /** ID of the completed task. */
  taskId: string;
  /** Unique identifier of the robot that completed the task. */
  robotId: string;
  /** SHA-256 hash of the recorded GPS route data. */
  gpsRouteHash: string;
  /** SHA-256 hash of the sensor telemetry collected during the task. */
  sensorDataHash: string;
  /** SHA-256 hash of the photographic evidence captured at delivery. */
  photoHash: string;
  /** Cryptographic signature proving the proof originated from the robot's key. */
  signature: string;
}
