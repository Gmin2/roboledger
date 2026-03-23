cmake_minimum_required(VERSION 3.8)
project(roboledger_interfaces)

find_package(ament_cmake REQUIRED)
find_package(rosidl_default_generators REQUIRED)

rosidl_generate_interfaces(${PROJECT_NAME}
  "msg/TaskPost.msg"
  "msg/TaskBid.msg"
  "msg/ProofData.msg"
  "msg/TaskStatus.msg"
  "msg/TxStatus.msg"
  "srv/GetRobotInfo.srv"
)

ament_package()
