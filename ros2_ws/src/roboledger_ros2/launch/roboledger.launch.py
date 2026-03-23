"""Launch file for the RoboLedger ROS2 bridge.

Start both the bridge node (sensor data -> HCS) and the task node
(HCS -> ROS2) with a shared configuration file.
"""

import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    """Generate the launch description for the RoboLedger bridge."""
    pkg_share = get_package_share_directory("roboledger_ros2")
    default_config = os.path.join(pkg_share, "config", "robot_config.yaml")

    config_arg = DeclareLaunchArgument(
        "config_path",
        default_value=default_config,
        description="Path to the robot_config.yaml file.",
    )

    bridge_node = Node(
        package="roboledger_ros2",
        executable="bridge_node",
        name="roboledger_bridge",
        output="screen",
        parameters=[
            {"config_path": LaunchConfiguration("config_path")},
        ],
    )

    task_node = Node(
        package="roboledger_ros2",
        executable="task_node",
        name="roboledger_tasks",
        output="screen",
        parameters=[
            {"config_path": LaunchConfiguration("config_path")},
        ],
    )

    return LaunchDescription([
        config_arg,
        bridge_node,
        task_node,
    ])
