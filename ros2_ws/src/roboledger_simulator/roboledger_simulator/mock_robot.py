"""Publish simulated sensor data for a single robot.

Generates fake GPS positions and velocity commands at 1 Hz, linearly
interpolating the robot from a start coordinate toward a destination.
"""

import json
import math
from datetime import datetime, timezone

import rclpy
from geometry_msgs.msg import Twist
from rclpy.node import Node
from std_msgs.msg import String


class MockRobot(Node):
    """ROS2 node that publishes simulated GPS and cmd_vel data."""

    def __init__(self) -> None:
        """Declare parameters, create publishers, and start the 1 Hz timer."""
        self.declare_parameter("robot_id", "robot_1")
        self.declare_parameter("start_lat", 37.77)
        self.declare_parameter("start_lng", -122.42)
        self.declare_parameter("end_lat", 37.78)
        self.declare_parameter("end_lng", -122.41)
        self.declare_parameter("speed", 0.001)

        robot_id: str = self.get_parameter("robot_id").value
        super().__init__(f"mock_robot_{robot_id}")

        self._robot_id = robot_id
        self._start_lat: float = self.get_parameter("start_lat").value
        self._start_lng: float = self.get_parameter("start_lng").value
        self._end_lat: float = self.get_parameter("end_lat").value
        self._end_lng: float = self.get_parameter("end_lng").value
        self._speed: float = self.get_parameter("speed").value

        self._current_lat = self._start_lat
        self._current_lng = self._start_lng
        self._tick = 0

        self._cmd_vel_pub = self.create_publisher(
            Twist, f"/{self._robot_id}/cmd_vel", 10
        )
        self._gps_pub = self.create_publisher(
            String, f"/{self._robot_id}/gps", 10
        )

        self._timer = self.create_timer(1.0, self._timer_callback)
        self.get_logger().info(
            f"MockRobot started: {self._robot_id} "
            f"({self._start_lat}, {self._start_lng}) -> "
            f"({self._end_lat}, {self._end_lng})"
        )

    def _timer_callback(self) -> None:
        """Advance the simulated position and publish sensor messages."""
        self._tick += 1
        self._advance_position()
        self._publish_cmd_vel()
        self._publish_gps()

        if self._tick % 10 == 0:
            self.get_logger().info(
                f"[{self._robot_id}] pos=({self._current_lat:.6f}, "
                f"{self._current_lng:.6f})  tick={self._tick}"
            )

    def _advance_position(self) -> None:
        """Move the current position toward the destination by one tick."""
        dlat = self._end_lat - self._current_lat
        dlng = self._end_lng - self._current_lng
        distance = math.sqrt(dlat ** 2 + dlng ** 2)

        if distance < 1e-8:
            return

        step = min(self._speed, distance)
        ratio = step / distance
        self._current_lat += dlat * ratio
        self._current_lng += dlng * ratio

    def _publish_cmd_vel(self) -> None:
        """Publish a simulated Twist message on cmd_vel."""
        msg = Twist()
        dlat = self._end_lat - self._current_lat
        dlng = self._end_lng - self._current_lng
        distance = math.sqrt(dlat ** 2 + dlng ** 2)

        if distance > 1e-8:
            msg.linear.x = self._speed
            msg.angular.z = math.atan2(dlng, dlat)
        else:
            msg.linear.x = 0.0
            msg.angular.z = 0.0

        self._cmd_vel_pub.publish(msg)

    def _publish_gps(self) -> None:
        """Publish a JSON-encoded GPS position on the gps topic."""
        payload = {
            "lat": round(self._current_lat, 8),
            "lng": round(self._current_lng, 8),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        msg = String()
        msg.data = json.dumps(payload)
        self._gps_pub.publish(msg)


def main(args=None) -> None:
    """Spin the MockRobot node until shutdown."""
    rclpy.init(args=args)
    node = MockRobot()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()
