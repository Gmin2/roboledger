// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ReputationTypes} from "../types/ReputationTypes.sol";

/// @title IReputationRegistry
/// @notice ERC-8004 Reputation Registry adapted for physical robots.
///
/// Clients submit feedback after task completion. Scores are stored on-chain
/// for composability — any contract can query a robot's track record before
/// accepting a bid or releasing payment.
interface IReputationRegistry {
    /** Events */

    /// @notice Emitted when new feedback is submitted.
    /// @param robotId       Identifier of the rated robot (Hedera account address).
    /// @param clientAddress Address of the feedback author.
    /// @param feedbackIndex 1-based index of this feedback entry for the (robotId, client) pair.
    /// @param value         Signed fixed-point score.
    /// @param valueDecimals Decimal precision of `value`.
    /// @param tag1          Primary tag (indexed for filtering).
    /// @param tag2          Secondary tag.
    event NewFeedback(
        address indexed robotId,
        address indexed clientAddress,
        uint64 feedbackIndex,
        int128 value,
        uint8 valueDecimals,
        string indexed tag1,
        string tag2
    );

    /// @notice Emitted when feedback is revoked.
    event FeedbackRevoked(
        address indexed robotId,
        address indexed clientAddress,
        uint64 indexed feedbackIndex
    );

    /** Errors */

    /// @notice The specified feedback entry does not exist.
    error FeedbackNotFound();

    /// @notice Caller is not the original feedback author.
    error OnlyFeedbackAuthor();

    /// @notice Cannot give feedback to yourself.
    error SelfFeedback();

    /// @notice valueDecimals must be between 0 and 18.
    error InvalidDecimals();

    /** External Functions */

    /// @notice Submit feedback for a robot.
    /// @param robotId       Hedera account address of the robot.
    /// @param value         Signed fixed-point score.
    /// @param valueDecimals Decimal precision (0-18).
    /// @param tag1          Primary category (e.g. "taskSuccess", "deliverySpeed").
    /// @param tag2          Secondary category (e.g. "outdoor", "delivery").
    function giveFeedback(
        address robotId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2
    ) external;

    /// @notice Revoke a previously submitted feedback entry.
    /// @param robotId       Robot that was rated.
    /// @param feedbackIndex 1-based index of the feedback to revoke.
    function revokeFeedback(address robotId, uint64 feedbackIndex) external;

    /// @notice Read a single feedback entry.
    /// @param robotId       Robot that was rated.
    /// @param clientAddress Address of the feedback author.
    /// @param feedbackIndex 1-based index.
    /// @return value         Score value.
    /// @return valueDecimals Decimal precision.
    /// @return tag1          Primary tag.
    /// @return tag2          Secondary tag.
    /// @return isRevoked     Whether the feedback was revoked.
    function readFeedback(
        address robotId,
        address clientAddress,
        uint64 feedbackIndex
    ) external view returns (
        int128 value,
        uint8 valueDecimals,
        string memory tag1,
        string memory tag2,
        bool isRevoked
    );

    /// @notice Aggregate feedback summary for a robot, filtered by tag.
    /// @param robotId  Robot to summarize.
    /// @param tag1     Optional primary tag filter (empty string = no filter).
    /// @return count        Number of non-revoked feedback entries matching the filter.
    /// @return summaryValue Sum of all matching values.
    /// @return avgDecimals  Decimal precision of summaryValue.
    function getSummary(
        address robotId,
        string calldata tag1
    ) external view returns (
        uint64 count,
        int128 summaryValue,
        uint8 avgDecimals
    );

    /// @notice Return the last feedback index for a (robot, client) pair.
    function getLastIndex(
        address robotId,
        address clientAddress
    ) external view returns (uint64);
}
