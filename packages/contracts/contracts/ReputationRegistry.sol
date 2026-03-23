// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IReputationRegistry} from "./interfaces/IReputationRegistry.sol";
import {ReputationTypes} from "./types/ReputationTypes.sol";

/// @title ReputationRegistry
/// @author RoboLedger
/// @notice ERC-8004 Reputation Registry for physical robots on Hedera.
///
/// Stores on-chain feedback from clients to robots after task completion.
/// The TaskEscrow contract calls `giveFeedback` automatically on settlement
/// and refund, producing a tamper-proof performance history per robot.
///
/// Design decisions:
///   - Feedback is keyed by (robotId, clientAddress, feedbackIndex) for
///     Sybil-resistant querying — callers filter by trusted clients.
///   - Tags enable on-chain filtering by metric type without off-chain indexing.
///   - Summary aggregation is kept simple (sum + count) for gas efficiency.
contract ReputationRegistry is IReputationRegistry {
    /// @notice Feedback storage: robotId -> clientAddress -> feedbackIndex -> Feedback.
    mapping(address => mapping(address => mapping(uint64 => ReputationTypes.Feedback))) private _feedback;

    /// @notice Last feedback index per (robot, client) pair.
    mapping(address => mapping(address => uint64)) private _lastIndex;

    /// @notice All clients that have given feedback to a robot.
    mapping(address => address[]) private _clients;

    /// @notice Track whether a client has already been recorded for a robot.
    mapping(address => mapping(address => bool)) private _clientExists;

    /// @inheritdoc IReputationRegistry
    function giveFeedback(
        address robotId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2
    ) external override {
        if (msg.sender == robotId) revert SelfFeedback();
        if (valueDecimals > 18) revert InvalidDecimals();

        if (!_clientExists[robotId][msg.sender]) {
            _clients[robotId].push(msg.sender);
            _clientExists[robotId][msg.sender] = true;
        }

        uint64 idx = _lastIndex[robotId][msg.sender] + 1;
        _lastIndex[robotId][msg.sender] = idx;

        _feedback[robotId][msg.sender][idx] = ReputationTypes.Feedback({
            value: value,
            valueDecimals: valueDecimals,
            tag1: tag1,
            tag2: tag2,
            isRevoked: false
        });

        emit NewFeedback(robotId, msg.sender, idx, value, valueDecimals, tag1, tag2);
    }

    /// @inheritdoc IReputationRegistry
    function revokeFeedback(address robotId, uint64 feedbackIndex) external override {
        ReputationTypes.Feedback storage fb = _feedback[robotId][msg.sender][feedbackIndex];
        if (fb.valueDecimals == 0 && fb.value == 0 && bytes(fb.tag1).length == 0) {
            revert FeedbackNotFound();
        }
        if (_lastIndex[robotId][msg.sender] < feedbackIndex) revert FeedbackNotFound();

        fb.isRevoked = true;

        emit FeedbackRevoked(robotId, msg.sender, feedbackIndex);
    }

    /// @inheritdoc IReputationRegistry
    function readFeedback(
        address robotId,
        address clientAddress,
        uint64 feedbackIndex
    ) external view override returns (
        int128 value,
        uint8 valueDecimals,
        string memory tag1,
        string memory tag2,
        bool isRevoked
    ) {
        ReputationTypes.Feedback storage fb = _feedback[robotId][clientAddress][feedbackIndex];
        return (fb.value, fb.valueDecimals, fb.tag1, fb.tag2, fb.isRevoked);
    }

    /// @inheritdoc IReputationRegistry
    function getSummary(
        address robotId,
        string calldata tag1
    ) external view override returns (
        uint64 count,
        int128 summaryValue,
        uint8 avgDecimals
    ) {
        address[] storage clients = _clients[robotId];
        bool filterTag = bytes(tag1).length > 0;
        bytes32 tagHash = keccak256(bytes(tag1));

        for (uint256 c = 0; c < clients.length; c++) {
            address client = clients[c];
            uint64 lastIdx = _lastIndex[robotId][client];

            for (uint64 i = 1; i <= lastIdx; i++) {
                ReputationTypes.Feedback storage fb = _feedback[robotId][client][i];
                if (fb.isRevoked) continue;
                if (filterTag && keccak256(bytes(fb.tag1)) != tagHash) continue;

                count++;
                summaryValue += fb.value;
                avgDecimals = fb.valueDecimals;
            }
        }
    }

    /// @inheritdoc IReputationRegistry
    function getLastIndex(
        address robotId,
        address clientAddress
    ) external view override returns (uint64) {
        return _lastIndex[robotId][clientAddress];
    }

    /// @notice Return all client addresses that have given feedback to a robot.
    /// @param robotId Robot to query.
    /// @return clients Array of client addresses.
    function getClients(address robotId) external view returns (address[] memory clients) {
        return _clients[robotId];
    }
}
