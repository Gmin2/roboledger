"""Configuration loader for the RoboLedger ROS2 bridge.

Load robot and Hedera settings from a YAML file, with environment
variable fallbacks for secrets and operator credentials.
"""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml


class RoboLedgerConfig:
    """Immutable configuration container for the RoboLedger bridge.

    Load once from a YAML file and access nested values through
    typed properties.  Environment variables override YAML values
    when present.
    """

    def __init__(self, yaml_path: str) -> None:
        """Load and validate configuration from a YAML file.

        Parameters
        ----------
        yaml_path : str
            Absolute or relative path to the robot_config.yaml file.
        """
        self._path = Path(yaml_path).expanduser().resolve()
        with open(self._path, "r") as fh:
            self._raw: Dict[str, Any] = yaml.safe_load(fh) or {}

        self._hedera = self._raw.get("hedera", {})
        self._robot = self._raw.get("robot", {})
        self._bridge = self._raw.get("bridge", {})

    # --- Hedera settings ---

    @property
    def network(self) -> str:
        """Return the Hedera network name (e.g. 'testnet')."""
        return self._hedera.get("network", "testnet")

    @property
    def operator_id(self) -> str:
        """Return the operator account ID, preferring the env var."""
        return os.environ.get("OPERATOR_ID", self._hedera.get("operator_id", ""))

    @property
    def operator_key(self) -> str:
        """Return the operator private key, preferring the env var."""
        return os.environ.get("OPERATOR_KEY", self._hedera.get("operator_key", ""))

    @property
    def topics(self) -> Dict[str, str]:
        """Return a dict of topic name -> topic ID."""
        return self._hedera.get("topics", {})

    @property
    def tasks_topic(self) -> str:
        """Return the HCS topic ID for task postings."""
        return self.topics.get("tasks", "")

    @property
    def bids_topic(self) -> str:
        """Return the HCS topic ID for bids."""
        return self.topics.get("bids", "")

    @property
    def proofs_topic(self) -> str:
        """Return the HCS topic ID for proof submissions."""
        return self.topics.get("proofs", "")

    @property
    def contract_id(self) -> str:
        """Return the smart-contract account ID on Hedera."""
        return self._hedera.get("contract_id", "")

    @property
    def nft_token_id(self) -> str:
        """Return the NFT token ID used for robot identity."""
        return self._hedera.get("nft_token_id", "")

    # --- Robot settings ---

    @property
    def robot_account_id(self) -> str:
        """Return the robot's Hedera account ID, preferring the env var."""
        return os.environ.get("ROBOT1_ID", self._robot.get("account_id", ""))

    @property
    def robot_key_path(self) -> str:
        """Return the path to the robot's private key file."""
        return str(
            Path(
                os.environ.get("ROBOT_KEY_PATH", self._robot.get("key_path", ""))
            ).expanduser()
        )

    @property
    def robot_capabilities(self) -> List[str]:
        """Return the list of capabilities this robot advertises."""
        return self._robot.get("capabilities", [])

    @property
    def robot_nft_serial(self) -> int:
        """Return the robot's NFT serial number."""
        return int(self._robot.get("nft_serial", 0))

    # --- Bridge settings ---

    @property
    def proof_interval_seconds(self) -> int:
        """Return the interval between proof submissions in seconds."""
        return int(self._bridge.get("proof_interval_seconds", 10))

    @property
    def retry_attempts(self) -> int:
        """Return the number of retry attempts for failed CLI calls."""
        return int(self._bridge.get("retry_attempts", 3))

    @property
    def retry_delay_seconds(self) -> int:
        """Return the delay between retries in seconds."""
        return int(self._bridge.get("retry_delay_seconds", 5))

    @property
    def cli_base_path(self) -> str:
        """Return the raw cli_base_path value from configuration."""
        return self._bridge.get("cli_base_path", "../../packages/cli")

    def cli_path(self) -> str:
        """Resolve the absolute path to the roboledger CLI entry point.

        The path is resolved relative to the YAML config file's parent
        directory, which keeps it stable regardless of the working
        directory at runtime.
        """
        base = Path(self.cli_base_path)
        if base.is_absolute():
            return str(base / "dist" / "index.js")
        resolved = (self._path.parent / base).resolve()
        return str(resolved / "dist" / "index.js")
