"""Task listener node: poll Hedera mirror node and publish tasks to ROS2.

Periodically query the HCS mirror REST API for new task postings and bid
status updates, then convert them into ROS2 messages on the appropriate
topics.
"""

import base64
import json
from typing import Any, Dict, List, Optional

import rclpy
import requests
from rclpy.node import Node

from roboledger_interfaces.msg import TaskPost, TaskStatus
from roboledger_ros2.config import RoboLedgerConfig

MIRROR_BASE = "https://testnet.mirrornode.hedera.com/api/v1"


class TaskNode(Node):
    """ROS2 node that polls Hedera mirror node for marketplace events.

    Two polling loops run via a shared timer:

    * **Tasks topic** -- new ``TaskPost`` messages are decoded and
      published to ``/roboledger/available_tasks``.
    * **Bids topic** -- status updates are decoded and published to
      ``/roboledger/task_status``.
    """

    def __init__(self) -> None:
        """Declare parameters, load config, and set up publishers."""
        super().__init__("roboledger_tasks")

        self.declare_parameter("config_path", "")

        config_path = (
            self.get_parameter("config_path").get_parameter_value().string_value
        )
        if not config_path:
            self.get_logger().fatal("config_path parameter is required")
            raise SystemExit(1)

        self._config = RoboLedgerConfig(config_path)

        # Sequence tracking
        self._last_task_seq: int = 0
        self._last_bid_seq: int = 0

        # Publishers
        self._task_pub = self.create_publisher(
            TaskPost, "/roboledger/available_tasks", 10
        )
        self._status_pub = self.create_publisher(
            TaskStatus, "/roboledger/task_status", 10
        )

        # Timer -- poll every 5 seconds
        self._timer = self.create_timer(5.0, self._poll_tick)

        self.get_logger().info(
            f"TaskNode initialised -- tasks topic: {self._config.tasks_topic}, "
            f"bids topic: {self._config.bids_topic}"
        )

    # --- Timer callback ---

    def _poll_tick(self) -> None:
        """Execute a single polling cycle for tasks and bids."""
        self._poll_tasks()
        self._poll_bids()

    # --- Task polling ---

    def _poll_tasks(self) -> None:
        """Fetch new task messages from the mirror node and publish them."""
        topic_id = self._config.tasks_topic
        if not topic_id:
            return

        messages = self._fetch_messages(topic_id, self._last_task_seq)
        if messages is None:
            return

        for entry in messages:
            seq = entry.get("sequence_number", 0)
            decoded = self._decode_message(entry)
            if decoded is None:
                continue

            msg = TaskPost()
            msg.task_id = decoded.get("taskId", decoded.get("task_id", ""))
            msg.requirements = decoded.get("requirements", [])
            msg.location_from_lat = float(
                decoded.get("locationFromLat", decoded.get("location_from_lat", 0.0))
            )
            msg.location_from_lng = float(
                decoded.get("locationFromLng", decoded.get("location_from_lng", 0.0))
            )
            msg.location_to_lat = float(
                decoded.get("locationToLat", decoded.get("location_to_lat", 0.0))
            )
            msg.location_to_lng = float(
                decoded.get("locationToLng", decoded.get("location_to_lng", 0.0))
            )
            msg.reward_hbar = float(
                decoded.get("rewardHbar", decoded.get("reward_hbar", 0.0))
            )
            msg.deadline = decoded.get("deadline", "")

            self._task_pub.publish(msg)
            self.get_logger().info(
                f"Published task {msg.task_id} (seq {seq})"
            )

            if seq > self._last_task_seq:
                self._last_task_seq = seq

    # --- Bid / status polling ---

    def _poll_bids(self) -> None:
        """Fetch new bid-status messages from the mirror node and publish them."""
        topic_id = self._config.bids_topic
        if not topic_id:
            return

        messages = self._fetch_messages(topic_id, self._last_bid_seq)
        if messages is None:
            return

        for entry in messages:
            seq = entry.get("sequence_number", 0)
            decoded = self._decode_message(entry)
            if decoded is None:
                continue

            msg = TaskStatus()
            msg.task_id = decoded.get("taskId", decoded.get("task_id", ""))
            msg.status = decoded.get("status", "bid")
            msg.assigned_robot = decoded.get(
                "assignedRobot", decoded.get("assigned_robot", decoded.get("robotId", ""))
            )
            msg.tx_hash = decoded.get("txHash", decoded.get("tx_hash", ""))

            self._status_pub.publish(msg)
            self.get_logger().info(
                f"Published task status {msg.task_id} -> {msg.status} (seq {seq})"
            )

            if seq > self._last_bid_seq:
                self._last_bid_seq = seq

    # --- Mirror node helpers ---

    def _fetch_messages(
        self, topic_id: str, last_seq: int
    ) -> Optional[List[Dict[str, Any]]]:
        """Query the mirror node REST API for messages after last_seq.

        Return the list of message dicts on success, or ``None`` on
        network / parse errors.
        """
        url = (
            f"{MIRROR_BASE}/topics/{topic_id}/messages"
            f"?sequencenumber=gte:{last_seq + 1}&limit=25&order=asc"
        )
        try:
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            return data.get("messages", [])
        except requests.RequestException as exc:
            self.get_logger().warn(f"Mirror node request failed: {exc}")
            return None
        except (ValueError, KeyError) as exc:
            self.get_logger().warn(f"Mirror node response parse error: {exc}")
            return None

    def _decode_message(self, entry: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Base64-decode and JSON-parse a mirror node message entry.

        Return the parsed dict or ``None`` on failure.
        """
        raw = entry.get("message", "")
        try:
            decoded_bytes = base64.b64decode(raw)
            return json.loads(decoded_bytes)
        except (ValueError, json.JSONDecodeError) as exc:
            self.get_logger().warn(f"Failed to decode message: {exc}")
            return None


def main(args=None):
    """Entry point for the task listener node."""
    rclpy.init(args=args)
    node = TaskNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()
