// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./ValidatorRegistry.sol";

/**
 * @title GoalRegistry
 * @dev Main contract for goal creation, staking, and validation in the decentralized accountability network
 */
contract GoalRegistry is Ownable, ReentrancyGuard, Pausable {
    // Structs
    struct Goal {
        address user;
        uint256 goalId;
        string ipfsHash;           // Goal description stored on IPFS
        uint256 stakeAmount;       // Amount staked by user
        uint256 deadline;          // Unix timestamp
        bytes32 deviceId;          // ESP32 device identifier
        GoalStatus status;
        uint256 createdAt;
    }

    struct ValidationRequest {
        uint256 goalId;
        string proofIpfsHash;      // Proof submission on IPFS
        address[] validators;      // Selected validators (5)
        uint256 approvalCount;
        uint256 rejectionCount;
        uint256 createdAt;
        uint256 expiresAt;         // Validation window (24 hours)
        ValidationStatus status;
        mapping(address => Vote) votes;
    }

    struct Vote {
        bool hasVoted;
        bool approved;
        uint8 confidence;          // 0-100
        string reasoningIpfsHash;  // Reasoning stored on IPFS
        uint256 timestamp;
    }

    enum GoalStatus {
        Active,
        PendingValidation,
        Completed,
        Failed,
        Expired
    }

    enum ValidationStatus {
        Pending,
        Approved,
        Rejected,
        Expired
    }

    // State variables
    ValidatorRegistry public validatorRegistry;

    uint256 public goalCounter;
    uint256 public validationCounter;

    uint256 public constant MIN_STAKE = 0.01 ether;
    uint256 public constant MAX_STAKE = 10 ether;
    uint256 public constant PROTOCOL_FEE_PERCENTAGE = 5; // 5%
    uint256 public constant VALIDATOR_COUNT = 5;
    uint256 public constant APPROVAL_THRESHOLD = 3; // 3 out of 5
    uint256 public constant VALIDATION_WINDOW = 24 hours;

    address public protocolTreasury;
    address public charityAddress;

    // Mappings
    mapping(uint256 => Goal) public goals;
    mapping(uint256 => ValidationRequest) public validationRequests;
    mapping(address => uint256[]) public userGoals;
    mapping(bytes32 => uint256[]) public deviceGoals; // ESP32 device to goals

    // Events
    event GoalCreated(
        uint256 indexed goalId,
        address indexed user,
        uint256 stakeAmount,
        string ipfsHash,
        uint256 deadline
    );

    event ProofSubmitted(
        uint256 indexed goalId,
        uint256 indexed validationId,
        string proofIpfsHash,
        address[] validators
    );

    event VoteCast(
        uint256 indexed validationId,
        address indexed validator,
        bool approved,
        uint8 confidence
    );

    event ValidationCompleted(
        uint256 indexed validationId,
        uint256 indexed goalId,
        bool approved,
        uint256 approvalCount,
        uint256 rejectionCount
    );

    event GoalCompleted(
        uint256 indexed goalId,
        address indexed user,
        uint256 stakeReturned
    );

    event GoalFailed(
        uint256 indexed goalId,
        address indexed user,
        uint256 stakeSlashed
    );

    event UnlockCodeReleased(
        uint256 indexed goalId,
        bytes32 indexed deviceId,
        string unlockCodeHash
    );

    // Modifiers
    modifier onlyGoalOwner(uint256 _goalId) {
        require(goals[_goalId].user == msg.sender, "Not goal owner");
        _;
    }

    modifier onlyActiveGoal(uint256 _goalId) {
        require(
            goals[_goalId].status == GoalStatus.Active ||
            goals[_goalId].status == GoalStatus.PendingValidation,
            "Goal not active"
        );
        _;
    }

    modifier onlySelectedValidator(uint256 _validationId) {
        bool isValidator = false;
        for (uint i = 0; i < validationRequests[_validationId].validators.length; i++) {
            if (validationRequests[_validationId].validators[i] == msg.sender) {
                isValidator = true;
                break;
            }
        }
        require(isValidator, "Not a selected validator");
        _;
    }

    // Constructor
    constructor(
        address _validatorRegistry,
        address _protocolTreasury,
        address _charityAddress
    ) Ownable(msg.sender) {
        validatorRegistry = ValidatorRegistry(_validatorRegistry);
        protocolTreasury = _protocolTreasury;
        charityAddress = _charityAddress;
    }

    /**
     * @dev Create a new goal with stake
     */
    function createGoal(
        string memory _ipfsHash,
        uint256 _deadline,
        bytes32 _deviceId
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        require(msg.value >= MIN_STAKE && msg.value <= MAX_STAKE, "Invalid stake amount");
        require(_deadline > block.timestamp, "Deadline must be in future");
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");

        goalCounter++;
        uint256 goalId = goalCounter;

        goals[goalId] = Goal({
            user: msg.sender,
            goalId: goalId,
            ipfsHash: _ipfsHash,
            stakeAmount: msg.value,
            deadline: _deadline,
            deviceId: _deviceId,
            status: GoalStatus.Active,
            createdAt: block.timestamp
        });

        userGoals[msg.sender].push(goalId);
        deviceGoals[_deviceId].push(goalId);

        emit GoalCreated(goalId, msg.sender, msg.value, _ipfsHash, _deadline);

        return goalId;
    }

    /**
     * @dev Submit proof for goal completion
     */
    function submitProof(
        uint256 _goalId,
        string memory _proofIpfsHash
    ) external onlyGoalOwner(_goalId) onlyActiveGoal(_goalId) nonReentrant returns (uint256) {
        require(block.timestamp <= goals[_goalId].deadline, "Goal deadline passed");
        require(bytes(_proofIpfsHash).length > 0, "Proof IPFS hash required");

        // Update goal status
        goals[_goalId].status = GoalStatus.PendingValidation;

        // Select random validators
        address[] memory selectedValidators = validatorRegistry.selectRandomValidators(
            VALIDATOR_COUNT,
            msg.sender
        );
        require(selectedValidators.length == VALIDATOR_COUNT, "Not enough validators");

        // Create validation request
        validationCounter++;
        uint256 validationId = validationCounter;

        ValidationRequest storage request = validationRequests[validationId];
        request.goalId = _goalId;
        request.proofIpfsHash = _proofIpfsHash;
        request.validators = selectedValidators;
        request.approvalCount = 0;
        request.rejectionCount = 0;
        request.createdAt = block.timestamp;
        request.expiresAt = block.timestamp + VALIDATION_WINDOW;
        request.status = ValidationStatus.Pending;

        emit ProofSubmitted(_goalId, validationId, _proofIpfsHash, selectedValidators);

        return validationId;
    }

    /**
     * @dev Validator casts vote on proof
     */
    function castVote(
        uint256 _validationId,
        bool _approved,
        uint8 _confidence,
        string memory _reasoningIpfsHash
    ) external onlySelectedValidator(_validationId) nonReentrant {
        ValidationRequest storage request = validationRequests[_validationId];

        require(request.status == ValidationStatus.Pending, "Validation not pending");
        require(block.timestamp <= request.expiresAt, "Validation expired");
        require(!request.votes[msg.sender].hasVoted, "Already voted");
        require(_confidence >= 0 && _confidence <= 100, "Invalid confidence");
        require(validatorRegistry.isActiveValidator(msg.sender), "Not active validator");

        // Record vote
        request.votes[msg.sender] = Vote({
            hasVoted: true,
            approved: _approved,
            confidence: _confidence,
            reasoningIpfsHash: _reasoningIpfsHash,
            timestamp: block.timestamp
        });

        // Update counts
        if (_approved) {
            request.approvalCount++;
        } else {
            request.rejectionCount++;
        }

        emit VoteCast(_validationId, msg.sender, _approved, _confidence);

        // Check if consensus reached
        if (request.approvalCount >= APPROVAL_THRESHOLD) {
            _finalizeValidation(_validationId, true);
        } else if (request.rejectionCount > (VALIDATOR_COUNT - APPROVAL_THRESHOLD)) {
            _finalizeValidation(_validationId, false);
        }
    }

    /**
     * @dev Finalize validation after consensus or expiry
     */
    function _finalizeValidation(uint256 _validationId, bool _approved) internal {
        ValidationRequest storage request = validationRequests[_validationId];
        uint256 goalId = request.goalId;
        Goal storage goal = goals[goalId];

        if (_approved) {
            request.status = ValidationStatus.Approved;
            goal.status = GoalStatus.Completed;

            // Return stake to user minus protocol fee
            uint256 protocolFee = (goal.stakeAmount * PROTOCOL_FEE_PERCENTAGE) / 100;
            uint256 returnAmount = goal.stakeAmount - protocolFee;

            // Pay validators
            uint256 validatorReward = protocolFee / request.validators.length;

            for (uint i = 0; i < request.validators.length; i++) {
                if (request.votes[request.validators[i]].hasVoted) {
                    validatorRegistry.rewardValidator(request.validators[i], validatorReward);
                    payable(request.validators[i]).transfer(validatorReward);
                }
            }

            // Return stake to user
            payable(goal.user).transfer(returnAmount);

            emit GoalCompleted(goalId, goal.user, returnAmount);
            emit UnlockCodeReleased(goalId, goal.deviceId, "UNLOCK_APPROVED");

        } else {
            request.status = ValidationStatus.Rejected;
            goal.status = GoalStatus.Failed;

            // Distribute slashed stake
            uint256 validatorShare = goal.stakeAmount / 2; // 50% to validators
            uint256 charityShare = goal.stakeAmount / 3;    // 33% to charity
            uint256 protocolShare = goal.stakeAmount - validatorShare - charityShare; // Remainder

            // Pay validators
            uint256 perValidatorReward = validatorShare / request.validators.length;
            for (uint i = 0; i < request.validators.length; i++) {
                if (request.votes[request.validators[i]].hasVoted) {
                    validatorRegistry.rewardValidator(request.validators[i], perValidatorReward);
                    payable(request.validators[i]).transfer(perValidatorReward);
                }
            }

            // Transfer to charity and protocol
            payable(charityAddress).transfer(charityShare);
            payable(protocolTreasury).transfer(protocolShare);

            emit GoalFailed(goalId, goal.user, goal.stakeAmount);
        }

        emit ValidationCompleted(_validationId, goalId, _approved, request.approvalCount, request.rejectionCount);
    }

    /**
     * @dev Expire validation if time window passed
     */
    function expireValidation(uint256 _validationId) external {
        ValidationRequest storage request = validationRequests[_validationId];

        require(request.status == ValidationStatus.Pending, "Validation not pending");
        require(block.timestamp > request.expiresAt, "Validation not expired");

        request.status = ValidationStatus.Expired;

        // If not enough votes, treat as rejection
        if (request.approvalCount < APPROVAL_THRESHOLD) {
            _finalizeValidation(_validationId, false);
        } else {
            _finalizeValidation(_validationId, true);
        }
    }

    /**
     * @dev Get user's goals
     */
    function getUserGoals(address _user) external view returns (uint256[] memory) {
        return userGoals[_user];
    }

    /**
     * @dev Get device's goals
     */
    function getDeviceGoals(bytes32 _deviceId) external view returns (uint256[] memory) {
        return deviceGoals[_deviceId];
    }

    /**
     * @dev Get validation details
     */
    function getValidationDetails(uint256 _validationId)
        external
        view
        returns (
            uint256 goalId,
            string memory proofIpfsHash,
            address[] memory validators,
            uint256 approvalCount,
            uint256 rejectionCount,
            ValidationStatus status
        )
    {
        ValidationRequest storage request = validationRequests[_validationId];
        return (
            request.goalId,
            request.proofIpfsHash,
            request.validators,
            request.approvalCount,
            request.rejectionCount,
            request.status
        );
    }

    /**
     * @dev Get vote details for a validator
     */
    function getVote(uint256 _validationId, address _validator)
        external
        view
        returns (
            bool hasVoted,
            bool approved,
            uint8 confidence,
            string memory reasoningIpfsHash,
            uint256 timestamp
        )
    {
        Vote storage vote = validationRequests[_validationId].votes[_validator];
        return (
            vote.hasVoted,
            vote.approved,
            vote.confidence,
            vote.reasoningIpfsHash,
            vote.timestamp
        );
    }

    // Admin functions
    function updateTreasury(address _newTreasury) external onlyOwner {
        protocolTreasury = _newTreasury;
    }

    function updateCharityAddress(address _newCharity) external onlyOwner {
        charityAddress = _newCharity;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Emergency withdraw (only owner, only when paused)
    function emergencyWithdraw() external onlyOwner whenPaused {
        payable(owner()).transfer(address(this).balance);
    }

    // Receive function
    receive() external payable {}
}
