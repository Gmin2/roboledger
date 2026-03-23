"""Execute simulated tasks for a single robot.

Subscribe to available tasks, evaluate capability matches, submit bids,
simulate execution, generate fake proof hashes, and publish proof data.
"""

import hashlib
import json
import os
import threading
from datetime import datetime, timezone

import rclpy
from rclpy.node import Node

from roboledger_interfaces.msg import ProofData, TaskBid, TaskPost


class TaskExecutor(Node):
    """ROS2 node that bids on matching tasks and publishes completion proofs."""

    def __init__(self) -> None:
        """Declare parameters, create publishers/subscribers, and initialize state."""
        super().__init__("task_executor")

        self.declare_parameter("robot_id", "robot_1")
        self.declare_parameter("capabilities", ["delivery", "outdoor"])
        self.declare_parameter("robot_account_id", "")
        self.declare_parameter("nft_serial", 1)

        robot_id: str = self.get_parameter("robot_id").value

        self._robot_id = robot_id
        self._capabilities: list[str] = list(
            self.get_parameter("capabilities").value
        )
        self._robot_account_id: str = self.get_parameter("robot_account_id").value
        self._nft_serial: int = self.get_parameter("nft_serial").value

        self._active_tasks: set[str] = set()
        self._lock = threading.Lock()

        self._bid_pub = self.create_publisher(
            TaskBid, "/roboledger/bid_outbox", 10
        )
        self._proof_pub = self.create_publisher(
            ProofData, "/roboledger/proof_data", 10
        )

        self._task_sub = self.create_subscription(
            TaskPost, "/roboledger/available_tasks", self._on_task, 10
        )

        self.get_logger().info(
            f"TaskExecutor started: {self._robot_id} "
            f"capabilities={self._capabilities}"
        )

    def _on_task(self, msg: TaskPost) -> None:
        """Evaluate an incoming task and begin execution if capabilities match."""
        task_id = msg.task_id
        self.get_logger().info(
            f"[{self._robot_id}] Evaluating task {task_id}..."
        )

        if not self._capabilities_match(msg.requirements):
            self.get_logger().info(
                f"[{self._robot_id}] Skipping task {task_id} "
                f"(missing capabilities for {list(msg.requirements)})"
            )
            return

        with self._lock:
            if task_id in self._active_tasks:
                self.get_logger().info(
                    f"[{self._robot_id}] Already handling task {task_id}"
                )
                return
            self._active_tasks.add(task_id)

        self._submit_bid(msg)
        self._schedule_execution(msg)

    def _capabilities_match(self, requirements: list[str]) -> bool:
        """Return True if all task requirements are in the robot capabilities."""
        return all(req in self._capabilities for req in requirements)

    def _submit_bid(self, task: TaskPost) -> None:
        """Publish a TaskBid for the given task."""
        self.get_logger().info(
            f"[{self._robot_id}] Bidding on task {task.task_id}..."
        )
        bid = TaskBid()
        bid.task_id = task.task_id
        bid.robot_id = self._robot_id
        bid.nft_serial = self._nft_serial
        bid.eta_minutes = 10
        bid.signature = self._sign_placeholder(task.task_id)
        self._bid_pub.publish(bid)

    def _schedule_execution(self, task: TaskPost) -> None:
        """Start a timer that simulates task execution and publishes proof."""
        execution_seconds = 10.0
        self.get_logger().info(
            f"[{self._robot_id}] Executing task {task.task_id} "
            f"(simulated {execution_seconds}s)..."
        )
        self.create_timer(
            execution_seconds,
            lambda: self._complete_task(task),
        )

    def _complete_task(self, task: TaskPost) -> None:
        """Generate proof hashes and publish a ProofData message."""
        task_id = task.task_id

        gps_route_hash = self._fake_hash(f"{task_id}:gps_route")
        sensor_data_hash = self._fake_hash(f"{task_id}:sensor_data")
        photo_hash = self._fake_hash(f"{task_id}:photo")

        proof = ProofData()
        proof.task_id = task_id
        proof.robot_id = self._robot_id
        proof.gps_route_hash = gps_route_hash
        proof.sensor_data_hash = sensor_data_hash
        proof.photo_hash = photo_hash
        proof.signature = self._sign_placeholder(task_id)

        self._proof_pub.publish(proof)

        with self._lock:
            self._active_tasks.discard(task_id)

        self.get_logger().info(
            f"[{self._robot_id}] Proof submitted for task {task_id}"
        )

    @staticmethod
    def _fake_hash(seed: str) -> str:
        """Return a SHA-256 hex digest derived from the given seed string."""
        timestamp = datetime.now(timezone.utc).isoformat()
        noise = os.urandom(8).hex()
        data = f"{seed}:{timestamp}:{noise}"
        return hashlib.sha256(data.encode()).hexdigest()

    @staticmethod
    def _sign_placeholder(payload: str) -> str:
        """Return a placeholder signature hash for the given payload."""
        return hashlib.sha256(f"sig:{payload}".encode()).hexdigest()


def main(args=None) -> None:
    """Spin the TaskExecutor node until shutdown."""
    rclpy.init(args=args)
    node = TaskExecutor()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()
