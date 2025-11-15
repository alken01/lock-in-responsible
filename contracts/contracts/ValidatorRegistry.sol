// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ValidatorRegistry
 * @dev Manages validator registration, reputation, and selection
 */
contract ValidatorRegistry is Ownable, ReentrancyGuard {
    struct Validator {
        address validatorAddress;
        uint256 stake;
        uint256 reputation;           // 0-1000 (starts at 500)
        uint256 totalValidations;
        uint256 successfulValidations;
        uint256 failedValidations;
        uint256 totalRewardsEarned;
        bool isActive;
        uint256 registeredAt;
        string metadata;              // IPFS hash for validator profile
    }

    // Constants
    uint256 public constant MIN_VALIDATOR_STAKE = 0.1 ether;
    uint256 public constant INITIAL_REPUTATION = 500;
    uint256 public constant MAX_REPUTATION = 1000;
    uint256 public constant MIN_REPUTATION = 0;
    uint256 public constant REPUTATION_DECAY_RATE = 2; // Per failed validation

    // State variables
    mapping(address => Validator) public validators;
    address[] public validatorList;
    uint256 public activeValidatorCount;

    // For weighted random selection
    uint256 private nonce;

    // Events
    event ValidatorRegistered(address indexed validator, uint256 stake, string metadata);
    event ValidatorStakeIncreased(address indexed validator, uint256 newStake);
    event ValidatorStakeWithdrawn(address indexed validator, uint256 amount);
    event ValidatorDeactivated(address indexed validator);
    event ValidatorReactivated(address indexed validator);
    event ReputationUpdated(address indexed validator, uint256 newReputation);
    event ValidatorRewarded(address indexed validator, uint256 amount);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Register as a validator with minimum stake
     */
    function registerValidator(string memory _metadata) external payable nonReentrant {
        require(msg.value >= MIN_VALIDATOR_STAKE, "Insufficient stake");
        require(!validators[msg.sender].isActive, "Already registered");
        require(validators[msg.sender].validatorAddress == address(0), "Already exists");

        validators[msg.sender] = Validator({
            validatorAddress: msg.sender,
            stake: msg.value,
            reputation: INITIAL_REPUTATION,
            totalValidations: 0,
            successfulValidations: 0,
            failedValidations: 0,
            totalRewardsEarned: 0,
            isActive: true,
            registeredAt: block.timestamp,
            metadata: _metadata
        });

        validatorList.push(msg.sender);
        activeValidatorCount++;

        emit ValidatorRegistered(msg.sender, msg.value, _metadata);
    }

    /**
     * @dev Increase validator stake
     */
    function increaseStake() external payable nonReentrant {
        require(validators[msg.sender].isActive, "Not an active validator");
        require(msg.value > 0, "Must send ETH");

        validators[msg.sender].stake += msg.value;

        emit ValidatorStakeIncreased(msg.sender, validators[msg.sender].stake);
    }

    /**
     * @dev Withdraw validator stake (deactivates validator)
     */
    function withdrawStake(uint256 _amount) external nonReentrant {
        Validator storage validator = validators[msg.sender];
        require(validator.validatorAddress != address(0), "Not registered");
        require(_amount <= validator.stake, "Insufficient stake");

        validator.stake -= _amount;

        // Deactivate if below minimum
        if (validator.stake < MIN_VALIDATOR_STAKE && validator.isActive) {
            validator.isActive = false;
            activeValidatorCount--;
            emit ValidatorDeactivated(msg.sender);
        }

        payable(msg.sender).transfer(_amount);

        emit ValidatorStakeWithdrawn(msg.sender, _amount);
    }

    /**
     * @dev Reactivate validator (must meet stake requirement)
     */
    function reactivateValidator() external payable nonReentrant {
        Validator storage validator = validators[msg.sender];
        require(validator.validatorAddress != address(0), "Not registered");
        require(!validator.isActive, "Already active");

        validator.stake += msg.value;
        require(validator.stake >= MIN_VALIDATOR_STAKE, "Insufficient stake");

        validator.isActive = true;
        activeValidatorCount++;

        emit ValidatorReactivated(msg.sender);
    }

    /**
     * @dev Select random validators weighted by reputation
     * @param _count Number of validators to select
     * @param _excludeUser User to exclude from selection (goal creator)
     */
    function selectRandomValidators(uint256 _count, address _excludeUser)
        external
        returns (address[] memory)
    {
        require(_count > 0, "Count must be > 0");
        require(activeValidatorCount >= _count, "Not enough validators");

        address[] memory selected = new address[](_count);
        address[] memory eligible = _getEligibleValidators(_excludeUser);

        require(eligible.length >= _count, "Not enough eligible validators");

        // Weighted random selection
        for (uint256 i = 0; i < _count; i++) {
            uint256 randomIndex = _weightedRandom(eligible);
            selected[i] = eligible[randomIndex];

            // Remove selected validator from eligible list
            eligible[randomIndex] = eligible[eligible.length - 1];
            address[] memory temp = new address[](eligible.length - 1);
            for (uint256 j = 0; j < temp.length; j++) {
                temp[j] = eligible[j];
            }
            eligible = temp;
        }

        return selected;
    }

    /**
     * @dev Get eligible validators (active, sufficient stake, not excluded)
     */
    function _getEligibleValidators(address _excludeUser) internal view returns (address[] memory) {
        uint256 eligibleCount = 0;

        // Count eligible
        for (uint256 i = 0; i < validatorList.length; i++) {
            address validatorAddr = validatorList[i];
            if (
                validators[validatorAddr].isActive &&
                validators[validatorAddr].stake >= MIN_VALIDATOR_STAKE &&
                validatorAddr != _excludeUser
            ) {
                eligibleCount++;
            }
        }

        // Build array
        address[] memory eligible = new address[](eligibleCount);
        uint256 index = 0;

        for (uint256 i = 0; i < validatorList.length; i++) {
            address validatorAddr = validatorList[i];
            if (
                validators[validatorAddr].isActive &&
                validators[validatorAddr].stake >= MIN_VALIDATOR_STAKE &&
                validatorAddr != _excludeUser
            ) {
                eligible[index] = validatorAddr;
                index++;
            }
        }

        return eligible;
    }

    /**
     * @dev Weighted random selection based on reputation
     * Higher reputation = higher chance of selection
     */
    function _weightedRandom(address[] memory _validators) internal returns (uint256) {
        // Calculate total weight
        uint256 totalWeight = 0;
        for (uint256 i = 0; i < _validators.length; i++) {
            totalWeight += validators[_validators[i]].reputation;
        }

        // Generate random number
        uint256 random = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    msg.sender,
                    nonce++
                )
            )
        ) % totalWeight;

        // Select based on weight
        uint256 cumulativeWeight = 0;
        for (uint256 i = 0; i < _validators.length; i++) {
            cumulativeWeight += validators[_validators[i]].reputation;
            if (random < cumulativeWeight) {
                return i;
            }
        }

        return 0; // Fallback
    }

    /**
     * @dev Reward validator (called by GoalRegistry)
     */
    function rewardValidator(address _validator, uint256 _amount) external {
        require(validators[_validator].isActive, "Not active validator");

        validators[_validator].totalRewardsEarned += _amount;
        validators[_validator].successfulValidations++;
        validators[_validator].totalValidations++;

        // Increase reputation for successful validation
        _updateReputation(_validator, true);

        emit ValidatorRewarded(_validator, _amount);
    }

    /**
     * @dev Penalize validator for dishonest behavior
     */
    function penalizeValidator(address _validator) external onlyOwner {
        require(validators[_validator].isActive, "Not active validator");

        validators[_validator].failedValidations++;
        validators[_validator].totalValidations++;

        // Decrease reputation
        _updateReputation(_validator, false);
    }

    /**
     * @dev Update validator reputation
     */
    function _updateReputation(address _validator, bool _success) internal {
        Validator storage validator = validators[_validator];

        if (_success) {
            // Increase reputation, diminishing returns near max
            uint256 increase = (MAX_REPUTATION - validator.reputation) / 100;
            if (increase < 1) increase = 1;
            validator.reputation = _min(validator.reputation + increase, MAX_REPUTATION);
        } else {
            // Decrease reputation
            uint256 decrease = REPUTATION_DECAY_RATE * 10;
            if (validator.reputation > decrease) {
                validator.reputation -= decrease;
            } else {
                validator.reputation = MIN_REPUTATION;
            }

            // Deactivate if reputation too low
            if (validator.reputation < 100) {
                validator.isActive = false;
                activeValidatorCount--;
                emit ValidatorDeactivated(_validator);
            }
        }

        emit ReputationUpdated(_validator, validator.reputation);
    }

    /**
     * @dev Check if address is active validator
     */
    function isActiveValidator(address _validator) external view returns (bool) {
        return validators[_validator].isActive;
    }

    /**
     * @dev Get validator details
     */
    function getValidator(address _validator)
        external
        view
        returns (
            uint256 stake,
            uint256 reputation,
            uint256 totalValidations,
            uint256 successfulValidations,
            uint256 totalRewardsEarned,
            bool isActive,
            string memory metadata
        )
    {
        Validator storage validator = validators[_validator];
        return (
            validator.stake,
            validator.reputation,
            validator.totalValidations,
            validator.successfulValidations,
            validator.totalRewardsEarned,
            validator.isActive,
            validator.metadata
        );
    }

    /**
     * @dev Get all active validators
     */
    function getActiveValidators() external view returns (address[] memory) {
        address[] memory active = new address[](activeValidatorCount);
        uint256 index = 0;

        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validators[validatorList[i]].isActive) {
                active[index] = validatorList[i];
                index++;
            }
        }

        return active;
    }

    /**
     * @dev Get validator statistics
     */
    function getValidatorStats(address _validator)
        external
        view
        returns (
            uint256 successRate,
            uint256 avgReward,
            uint256 rankPercentile
        )
    {
        Validator storage validator = validators[_validator];

        if (validator.totalValidations == 0) {
            return (0, 0, 0);
        }

        // Success rate (percentage)
        successRate = (validator.successfulValidations * 100) / validator.totalValidations;

        // Average reward per validation
        avgReward = validator.totalRewardsEarned / validator.totalValidations;

        // Rank percentile (based on reputation)
        uint256 betterCount = 0;
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validators[validatorList[i]].reputation > validator.reputation) {
                betterCount++;
            }
        }
        rankPercentile = ((validatorList.length - betterCount) * 100) / validatorList.length;

        return (successRate, avgReward, rankPercentile);
    }

    /**
     * @dev Get top validators by reputation
     */
    function getTopValidators(uint256 _count) external view returns (address[] memory) {
        require(_count <= validatorList.length, "Count exceeds total validators");

        address[] memory sorted = new address[](validatorList.length);
        for (uint256 i = 0; i < validatorList.length; i++) {
            sorted[i] = validatorList[i];
        }

        // Simple bubble sort by reputation (sufficient for small arrays)
        for (uint256 i = 0; i < sorted.length; i++) {
            for (uint256 j = i + 1; j < sorted.length; j++) {
                if (validators[sorted[i]].reputation < validators[sorted[j]].reputation) {
                    address temp = sorted[i];
                    sorted[i] = sorted[j];
                    sorted[j] = temp;
                }
            }
        }

        // Return top N
        address[] memory top = new address[](_count);
        for (uint256 i = 0; i < _count; i++) {
            top[i] = sorted[i];
        }

        return top;
    }

    // Utility functions
    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    // Receive function
    receive() external payable {}
}
