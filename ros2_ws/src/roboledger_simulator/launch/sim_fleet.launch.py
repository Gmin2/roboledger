"""Launch a simulated fleet of three robots.

Each robot group contains a mock_robot node (sensor publisher) and a
task_executor node (bid and proof workflow).  Robots are namespaced and
configured with distinct capabilities and GPS starting positions.
"""

from launch import LaunchDescription
from launch.actions import GroupAction
from launch_ros.actions import Node, PushRosNamespace


def _robot_group(
    robot_id: str,
    capabilities: list[str],
    start_lat: float,
    start_lng: float,
    end_lat: float,
    end_lng: float,
) -> GroupAction:
    """Return a GroupAction containing mock_robot and task_executor nodes."""
    return GroupAction(
        actions=[
            PushRosNamespace(robot_id),
            Node(
                package="roboledger_simulator",
                executable="mock_robot",
                name=f"mock_robot_{robot_id}",
                parameters=[
                    {
                        "robot_id": robot_id,
                        "start_lat": start_lat,
                        "start_lng": start_lng,
                        "end_lat": end_lat,
                        "end_lng": end_lng,
                        "speed": 0.001,
                    }
                ],
                output="screen",
            ),
            Node(
                package="roboledger_simulator",
                executable="task_executor",
                name=f"task_executor_{robot_id}",
                parameters=[
                    {
                        "robot_id": robot_id,
                        "capabilities": capabilities,
                        "robot_account_id": "",
                        "nft_serial": 1,
                    }
                ],
                output="screen",
            ),
        ]
    )


def generate_launch_description() -> LaunchDescription:
    """Generate a launch description for the three-robot fleet."""
    return LaunchDescription(
        [
            _robot_group(
                robot_id="robot_1",
                capabilities=["delivery", "outdoor"],
                start_lat=37.7700,
                start_lng=-122.4200,
                end_lat=37.7800,
                end_lng=-122.4100,
            ),
            _robot_group(
                robot_id="robot_2",
                capabilities=["delivery", "indoor"],
                start_lat=37.7750,
                start_lng=-122.4180,
                end_lat=37.7820,
                end_lng=-122.4080,
            ),
            _robot_group(
                robot_id="robot_3",
                capabilities=["inspection", "outdoor"],
                start_lat=37.7720,
                start_lng=-122.4250,
                end_lat=37.7850,
                end_lng=-122.4150,
            ),
        ]
    )
