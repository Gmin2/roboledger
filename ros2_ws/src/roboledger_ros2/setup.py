"""Setup script for the roboledger_ros2 ROS2 package."""

import os
from glob import glob

from setuptools import setup

package_name = "roboledger_ros2"

setup(
    name=package_name,
    version="0.1.0",
    packages=[package_name],
    data_files=[
        ("share/ament_index/resource_index/packages", ["resource/" + package_name]),
        ("share/" + package_name, ["package.xml"]),
        (os.path.join("share", package_name, "launch"), glob("launch/*.py")),
        (os.path.join("share", package_name, "config"), glob("config/*.yaml")),
    ],
    install_requires=["setuptools", "pyyaml", "requests"],
    zip_safe=True,
    maintainer="RoboLedger Team",
    maintainer_email="team@roboledger.dev",
    description="ROS2 bridge for connecting robots to the Hedera-based RoboLedger marketplace.",
    license="Apache-2.0",
    tests_require=["pytest"],
    entry_points={
        "console_scripts": [
            "bridge_node = roboledger_ros2.bridge_node:main",
            "task_node = roboledger_ros2.task_node:main",
        ],
    },
)
