"""Setup script for the roboledger_simulator package."""

import os
from glob import glob

from setuptools import setup

package_name = "roboledger_simulator"

setup(
    name=package_name,
    version="0.1.0",
    packages=[package_name],
    data_files=[
        ("share/ament_index/resource_index/packages", ["resource/" + package_name]),
        ("share/" + package_name, ["package.xml"]),
        (os.path.join("share", package_name, "launch"), glob("launch/*.launch.py")),
    ],
    install_requires=["setuptools"],
    zip_safe=True,
    maintainer="roboledger",
    maintainer_email="dev@roboledger.io",
    description="Simulate a fleet of robots publishing fake sensor data and executing tasks.",
    license="Apache-2.0",
    entry_points={
        "console_scripts": [
            "mock_robot = roboledger_simulator.mock_robot:main",
            "task_executor = roboledger_simulator.task_executor:main",
        ],
    },
)
