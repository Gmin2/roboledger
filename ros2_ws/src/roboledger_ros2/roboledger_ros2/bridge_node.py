"""Bridge node: relay sensor proof data from ROS2 to Hedera via the CLI.

Subscribe to ``/roboledger/proof_data``, hash the sensor fields, build a
JSON proof payload, and submit it through the roboledger CLI subprocess.
Transaction results are published on ``/roboledger/tx_status``.
"""

import hashlib
import json
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import rclpy
from rclpy.node import Node

from roboledger_interfaces.msg import ProofData, TxStatus
from roboledger_ros2.config import RoboLedgerConfig

FAILURE_LOG = Path("/tmp/roboledger_failures.jsonl")


class BridgeNode(Node):
    """ROS2 node that bridges proof data to Hedera Consensus Service.

    Each incoming ``ProofData`` message is hashed, wrapped in a JSON
    envelope, and submitted to HCS through the roboledger CLI.  The CLI
    is invoked as a subprocess so the ROS2 process stays lightweight.
    """

    def __init__(self) -> None:
        """Declare parameters, load config, and set up pub/sub."""
        super().__init__("roboledger_bridge")

        # Parameters
        self.declare_parameter("config_path", "")
        self.declare_parameter("cli_base_path", "")

        config_path = (
            self.get_parameter("config_path").get_parameter_value().string_value
        )
        if not config_path:
            self.get_logger().fatal("config_path parameter is required")
            raise SystemExit(1)

        self._config = RoboLedgerConfig(config_path)

        # Allow overriding CLI base path via parameter
        cli_override = (
            self.get_parameter("cli_base_path").get_parameter_value().string_value
        )
        if cli_override:
            self._config._bridge["cli_base_path"] = cli_override

        self._cli_path = self._config.cli_path()
        self.get_logger().info(f"CLI path resolved to: {self._cli_path}")

        # Publishers and subscribers
        self._tx_pub = self.create_publisher(TxStatus, "/roboledger/tx_status", 10)
        self._proof_sub = self.create_subscription(
            ProofData, "/roboledger/proof_data", self._on_proof, 10
        )

        self.get_logger().info("BridgeNode initialised and listening for proofs")

    # --- Callback ---

    def _on_proof(self, msg: ProofData) -> None:
        """Handle an incoming proof message.

        Hash the sensor fields, build the JSON payload, invoke the CLI,
        and publish the resulting transaction status.
        """
        self.get_logger().info(
            f"Received proof for task {msg.task_id} from {msg.robot_id}"
        )

        proof_hash = self._hash_proof(msg)
        payload = self._build_payload(msg, proof_hash)

        result = self._submit_with_retry(payload)

        tx_status = TxStatus()
        if result is not None:
            tx_status.phase = result.get("phase", "submitted")
            tx_status.tx_hash = result.get("txHash", result.get("tx_hash", ""))
            tx_status.error = ""
            self.get_logger().info(f"Proof submitted: tx={tx_status.tx_hash}")
        else:
            tx_status.phase = "failed"
            tx_status.tx_hash = ""
            tx_status.error = "All retry attempts exhausted"
            self.get_logger().error("Proof submission failed after all retries")

        self._tx_pub.publish(tx_status)

    # --- Hashing ---

    @staticmethod
    def _hash_proof(msg: ProofData) -> str:
        """Compute a SHA-256 digest over the proof's sensor fields.

        Concatenate the deterministic field values and return the hex
        digest string.
        """
        h = hashlib.sha256()
        h.update(msg.task_id.encode())
        h.update(msg.robot_id.encode())
        h.update(msg.gps_route_hash.encode())
        h.update(msg.sensor_data_hash.encode())
        h.update(msg.photo_hash.encode())
        return h.hexdigest()

    @staticmethod
    def _build_payload(msg: ProofData, proof_hash: str) -> dict:
        """Build the JSON payload sent to the CLI."""
        return {
            "taskId": msg.task_id,
            "robotId": msg.robot_id,
            "proofHash": proof_hash,
            "gpsRouteHash": msg.gps_route_hash,
            "sensorDataHash": msg.sensor_data_hash,
            "photoHash": msg.photo_hash,
            "signature": msg.signature,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    # --- CLI invocation ---

    def _submit_with_retry(self, payload: dict) -> Optional[dict]:
        """Invoke the CLI with retry logic.

        Return the parsed JSON response on success, or ``None`` if all
        attempts are exhausted.
        """
        attempts = self._config.retry_attempts
        delay = self._config.retry_delay_seconds

        for attempt in range(1, attempts + 1):
            try:
                result = self._call_cli(payload)
                return result
            except Exception as exc:
                self.get_logger().warn(
                    f"CLI attempt {attempt}/{attempts} failed: {exc}"
                )
                self._log_failure(payload, str(exc), attempt)
                if attempt < attempts:
                    time.sleep(delay)

        return None

    def _call_cli(self, payload: dict) -> dict:
        """Run the roboledger CLI as a subprocess and return parsed JSON.

        Raise ``RuntimeError`` on non-zero exit or unparseable output.
        """
        payload_str = json.dumps(payload)
        cmd = ["node", self._cli_path, "submit-proof", payload_str]

        self.get_logger().debug(f"Executing: {' '.join(cmd)}")

        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30,
        )

        if proc.returncode != 0:
            raise RuntimeError(
                f"CLI exited with code {proc.returncode}: {proc.stderr.strip()}"
            )

        try:
            return json.loads(proc.stdout.strip())
        except json.JSONDecodeError as exc:
            raise RuntimeError(f"Failed to parse CLI output: {exc}") from exc

    def _log_failure(self, payload: dict, error: str, attempt: int) -> None:
        """Append a failure record to the JSONL log file."""
        record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "attempt": attempt,
            "error": error,
            "payload": payload,
        }
        try:
            with open(FAILURE_LOG, "a") as fh:
                fh.write(json.dumps(record) + "\n")
        except OSError as exc:
            self.get_logger().error(f"Could not write failure log: {exc}")


def main(args=None):
    """Entry point for the bridge node."""
    rclpy.init(args=args)
    node = BridgeNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()
