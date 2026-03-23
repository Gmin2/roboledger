// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IValidationRegistry} from "./interfaces/IValidationRegistry.sol";
import {ValidationTypes} from "./types/ValidationTypes.sol";

/// @title ValidationRegistry
/// @author RoboLedger
/// @notice ERC-8004 Validation Registry for physical robot task verification on Hedera.
///
/// Robots request independent validation of their proof-of-completion after
/// executing a task. Designated validators (other robots, clients, or staked
/// verifiers) respond with a score from 0 (rejected) to 100 (approved).
///
/// The TaskEscrow contract queries the validation status before releasing
/// escrowed payment, ensuring multi-party consensus on physical work.
///
/// Design decisions:
///   - One designated validator per request (keeps gas low, avoids threshold logic in this contract).
///   - Multiple requests per task are allowed — escrow can require N validations.
///   - `validationResponse` can be called multiple times (progressive validation).
///   - No slashing in this contract — managed by the escrow or a separate staking module.
contract ValidationRegistry is IValidationRegistry {
    /// @notice Validation records keyed by request hash.
    mapping(bytes32 => ValidationTypes.ValidationRecord) private _records;

    /// @notice All request hashes for a given robot.
    mapping(uint256 => bytes32[]) private _robotValidations;

    /// @notice Robot ID associated with each request hash (for reverse lookup).
    mapping(bytes32 => uint256) private _requestRobotId;

    /// @notice Designated validator for each request.
    mapping(bytes32 => address) private _requestValidator;

    /// @notice Track whether a request exists.
    mapping(bytes32 => bool) private _requestExists;

    /// @inheritdoc IValidationRegistry
    function validationRequest(
        address validatorAddress,
        uint256 robotId,
        string calldata requestURI,
        bytes32 requestHash
    ) external override {
        if (_requestExists[requestHash]) revert RequestAlreadyExists();

        _requestExists[requestHash] = true;
        _requestValidator[requestHash] = validatorAddress;
        _requestRobotId[requestHash] = robotId;

        _records[requestHash] = ValidationTypes.ValidationRecord({
            validatorAddress: validatorAddress,
            robotId: robotId,
            response: 0,
            responseHash: bytes32(0),
            tag: "",
            lastUpdate: 0
        });

        _robotValidations[robotId].push(requestHash);

        emit ValidationRequest(validatorAddress, robotId, requestURI, requestHash);
    }

    /// @inheritdoc IValidationRegistry
    function validationResponse(
        bytes32 requestHash,
        uint8 response,
        string calldata responseURI,
        bytes32 responseHash,
        string calldata tag
    ) external override {
        if (!_requestExists[requestHash]) revert RequestNotFound();
        if (msg.sender != _requestValidator[requestHash]) revert OnlyDesignatedValidator();
        if (response > 100) revert InvalidResponse();

        ValidationTypes.ValidationRecord storage record = _records[requestHash];
        record.response = response;
        record.responseHash = responseHash;
        record.tag = tag;
        record.lastUpdate = block.timestamp;

        emit ValidationResponse(
            msg.sender,
            record.robotId,
            requestHash,
            response,
            tag
        );
    }

    /// @inheritdoc IValidationRegistry
    function getValidationStatus(
        bytes32 requestHash
    ) external view override returns (ValidationTypes.ValidationRecord memory record) {
        if (!_requestExists[requestHash]) revert RequestNotFound();
        return _records[requestHash];
    }

    /// @inheritdoc IValidationRegistry
    function getSummary(
        uint256 robotId,
        address[] calldata validatorAddresses
    ) external view override returns (uint64 count, uint8 averageResponse) {
        bytes32[] storage hashes = _robotValidations[robotId];
        bool filterValidators = validatorAddresses.length > 0;

        uint256 totalResponse = 0;

        for (uint256 i = 0; i < hashes.length; i++) {
            ValidationTypes.ValidationRecord storage record = _records[hashes[i]];

            /// Skip entries that haven't been responded to yet.
            if (record.lastUpdate == 0) continue;

            if (filterValidators) {
                bool matched = false;
                for (uint256 v = 0; v < validatorAddresses.length; v++) {
                    if (record.validatorAddress == validatorAddresses[v]) {
                        matched = true;
                        break;
                    }
                }
                if (!matched) continue;
            }

            count++;
            totalResponse += record.response;
        }

        if (count > 0) {
            averageResponse = uint8(totalResponse / count);
        }
    }

    /// @inheritdoc IValidationRegistry
    function getAgentValidations(
        uint256 robotId
    ) external view override returns (bytes32[] memory requestHashes) {
        return _robotValidations[robotId];
    }

    /// @notice Check whether a specific request has been responded to.
    /// @param requestHash The request to check.
    /// @return responded True if the validator has submitted at least one response.
    function isResponded(bytes32 requestHash) external view returns (bool responded) {
        return _requestExists[requestHash] && _records[requestHash].lastUpdate > 0;
    }

    /// @notice Check whether a request exists.
    /// @param requestHash The request to check.
    /// @return exists True if the request has been created.
    function requestExists(bytes32 requestHash) external view returns (bool exists) {
        return _requestExists[requestHash];
    }
}
