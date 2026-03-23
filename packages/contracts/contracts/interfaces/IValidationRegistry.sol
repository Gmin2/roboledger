// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ValidationTypes} from "../types/ValidationTypes.sol";

/// @title IValidationRegistry
/// @notice ERC-8004 Validation Registry adapted for physical robot task verification.
///
/// Robots request independent validation of their proof-of-completion.
/// Validators (other robots, clients, or staked third parties) respond with
/// a score from 0 (failed) to 100 (passed). The TaskEscrow contract queries
/// validation status before releasing payment.
interface IValidationRegistry {
    /** Events */

    /// @notice Emitted when a robot requests validation of completed work.
    /// @param validatorAddress Designated validator for this request.
    /// @param robotId          Robot requesting validation.
    /// @param requestURI       Off-chain URI containing proof data for the validator.
    /// @param requestHash      Keccak-256 commitment identifying this request.
    event ValidationRequest(
        address indexed validatorAddress,
        uint256 indexed robotId,
        string requestURI,
        bytes32 indexed requestHash
    );

    /// @notice Emitted when a validator submits their assessment.
    /// @param validatorAddress Validator that responded.
    /// @param robotId          Robot whose work was validated.
    /// @param requestHash      Request being responded to.
    /// @param response         Score (0 = failed, 100 = passed).
    /// @param tag              Optional categorization tag.
    event ValidationResponse(
        address indexed validatorAddress,
        uint256 indexed robotId,
        bytes32 indexed requestHash,
        uint8 response,
        string tag
    );

    /** Errors */

    /// @notice No validation request exists for this hash.
    error RequestNotFound();

    /// @notice Caller is not the designated validator for this request.
    error OnlyDesignatedValidator();

    /// @notice Response value must be between 0 and 100.
    error InvalidResponse();

    /// @notice A request with this hash already exists.
    error RequestAlreadyExists();

    /** External Functions */

    /// @notice Request validation of completed work.
    /// @param validatorAddress Address of the validator to respond.
    /// @param robotId          Identifier of the robot (can be NFT serial or account).
    /// @param requestURI       URI pointing to off-chain proof data.
    /// @param requestHash      Keccak-256 hash identifying this request uniquely.
    function validationRequest(
        address validatorAddress,
        uint256 robotId,
        string calldata requestURI,
        bytes32 requestHash
    ) external;

    /// @notice Submit a validation response.
    /// @param requestHash  Hash identifying the request.
    /// @param response     Score from 0 (failed) to 100 (passed).
    /// @param responseURI  Optional URI to off-chain evidence.
    /// @param responseHash Keccak-256 of the evidence content.
    /// @param tag          Optional categorization tag.
    function validationResponse(
        bytes32 requestHash,
        uint8 response,
        string calldata responseURI,
        bytes32 responseHash,
        string calldata tag
    ) external;

    /// @notice Read the current validation status for a request.
    /// @param requestHash Hash identifying the request.
    /// @return record The full validation record.
    function getValidationStatus(
        bytes32 requestHash
    ) external view returns (ValidationTypes.ValidationRecord memory record);

    /// @notice Aggregate validation statistics for a robot.
    /// @param robotId             Robot to summarize.
    /// @param validatorAddresses  Optional filter by validators (empty = all).
    /// @return count           Number of validation responses.
    /// @return averageResponse Weighted average response score (0-100).
    function getSummary(
        uint256 robotId,
        address[] calldata validatorAddresses
    ) external view returns (uint64 count, uint8 averageResponse);

    /// @notice Return all request hashes for a robot.
    function getAgentValidations(
        uint256 robotId
    ) external view returns (bytes32[] memory requestHashes);
}
