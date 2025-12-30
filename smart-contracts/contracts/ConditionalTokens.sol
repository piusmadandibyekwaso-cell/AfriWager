// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ConditionalTokens is ERC1155, Ownable {
    // Mapping of conditionId -> payout numerator for each outcome
    // If not resolved, numerator is 0
    mapping(bytes32 => uint256[]) public payoutNumerators;

    event ConditionPreparation(bytes32 indexed conditionId, address indexed oracle, bytes32 indexed questionId, uint256 outcomeSlotCount);
    event PositionSplit(address indexed stakeholder, address collateralToken, bytes32 indexed parentCollectionId, bytes32 indexed conditionId, uint256[] partition, uint256 amount);
    event PositionsMerge(address indexed stakeholder, address collateralToken, bytes32 indexed parentCollectionId, bytes32 indexed conditionId, uint256[] partition, uint256 amount);
    event PayoutRedemption(address indexed redeemer, address indexed collateralToken, bytes32 indexed parentCollectionId, bytes32 conditionId, uint256[] indexSets, uint256 payout);

    constructor() ERC1155("") Ownable(msg.sender) {}

    /// @dev Helper to generate a condition ID
    function getConditionId(address oracle, bytes32 questionId, uint256 outcomeSlotCount) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(oracle, questionId, outcomeSlotCount));
    }

    /// @dev Helper to generate a collection ID
    function getCollectionId(bytes32 parentCollectionId, bytes32 conditionId, uint256 indexSet) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(parentCollectionId, conditionId, indexSet));
    }

    /// @dev Helper to generate a position ID (which is the Token ID for ERC1155)
    function getPositionId(address collateralToken, bytes32 collectionId) external pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(collateralToken, collectionId)));
    }

    /// @notice Prepares a condition for users to trade on
    function prepareCondition(address oracle, bytes32 questionId, uint256 outcomeSlotCount) external {
        // In a full implementation, we would check if it exists. Simplified for MVP.
        bytes32 conditionId = keccak256(abi.encodePacked(oracle, questionId, outcomeSlotCount));
        require(payoutNumerators[conditionId].length == 0, "Condition already prepared");
        
        payoutNumerators[conditionId] = new uint256[](outcomeSlotCount);
        
        emit ConditionPreparation(conditionId, oracle, questionId, outcomeSlotCount);
    }

    /// @notice Reports the payout for a condition. Only the oracle can call this.
    /// @dev Simplified: For this MVP, anyone can call (in reality, restrict to oracle)
    /// OR make it Ownable for now to simulate oracle
    function reportPayouts(bytes32 questionId, uint256[] calldata payouts) external onlyOwner {
        // Reconstruct conditionId assuming oracle is msg.sender or stored
        // For MVP, we pass conditionId directly or assume 2 slots
        require(payouts.length == 2, "Binary markets only for MVP");
        
        // This is a simplified resolution logic
        // TODO: Full oracle integration
    }
    
    // Quick MVP resolution wrapper
    function resolveCondition(bytes32 conditionId, uint256[] calldata payouts) external onlyOwner {
        uint256 totalPayout = 0;
        for (uint i = 0; i < payouts.length; i++) {
            totalPayout += payouts[i];
        }
        require(totalPayout > 0, "Total payout must be > 0");
        require(payoutNumerators[conditionId].length == payouts.length, "Payout count mismatch");
        require(payoutNumerators[conditionId][0] == 0 && payoutNumerators[conditionId][1] == 0, "Already resolved");

        payoutNumerators[conditionId] = payouts;
    }

    /// @notice Splits collateral into conditional tokens (e.g., $1 -> 1 YES + 1 NO)
    function splitPosition(
        address collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata partition,
        uint256 amount
    ) external {
        require(partition.length > 0, "Partition must not be empty");
        
        // Transfer collateral from user to this contract
        require(IERC20(collateralToken).transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Mint tokens for each outcome in the partition
        // For binary (YES/NO), partition is usually [1, 2] representing index sets
        for(uint i = 0; i < partition.length; i++) {
            uint256 indexSet = partition[i];
            bytes32 collectionId = keccak256(abi.encodePacked(parentCollectionId, conditionId, indexSet));
            uint256 positionId = uint256(keccak256(abi.encodePacked(collateralToken, collectionId)));
            
            _mint(msg.sender, positionId, amount, "");
        }

        emit PositionSplit(msg.sender, collateralToken, parentCollectionId, conditionId, partition, amount);
    }

    /// @notice Merges conditional tokens back into collateral (e.g., 1 YES + 1 NO -> $1)
    function mergePositions(
        address collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata partition,
        uint256 amount
    ) external {
        require(partition.length > 0, "Partition must not be empty");

        // Burn tokens for each outcome
        for(uint i = 0; i < partition.length; i++) {
            uint256 indexSet = partition[i];
            bytes32 collectionId = keccak256(abi.encodePacked(parentCollectionId, conditionId, indexSet));
            uint256 positionId = uint256(keccak256(abi.encodePacked(collateralToken, collectionId)));
            
            _burn(msg.sender, positionId, amount);
        }

        // Return collateral
        require(IERC20(collateralToken).transfer(msg.sender, amount), "Transfer failed");

        emit PositionsMerge(msg.sender, collateralToken, parentCollectionId, conditionId, partition, amount);
    }

    /// @notice Redeem tokens for collateral after the condition is resolved
    function redeemPositions(
        address collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata indexSets 
    ) external {
        uint256 totalPayout = 0;
        uint256[] memory payouts = payoutNumerators[conditionId];
        require(payouts.length > 0, "Condition not resolved");

        // Calculate payout denominator (sum of all payout numerators)
        uint256 den = 0;
        for (uint i = 0; i < payouts.length; i++) {
            den += payouts[i];
        }

        for (uint i = 0; i < indexSets.length; i++) {
            uint256 indexSet = indexSets[i];
            bytes32 collectionId = keccak256(abi.encodePacked(parentCollectionId, conditionId, indexSet));
            uint256 positionId = uint256(keccak256(abi.encodePacked(collateralToken, collectionId)));

            uint256 balance = balanceOf(msg.sender, positionId);
            if (balance > 0) {
                // Logic: Which slot does this indexSet correspond to?
                // For MVP: Assuming indexSet 1 = slot 0 (YES), indexSet 2 = slot 1 (NO)
                // This logic needs to be robust for combinations. 
                // Simplified: binary check
                
                uint256 numerator = 0;
                if(indexSet == 1) numerator = payouts[0];
                if(indexSet == 2) numerator = payouts[1];
                
                uint256 payout = (balance * numerator) / den;
                totalPayout += payout;
                
                _burn(msg.sender, positionId, balance);
            }
        }

        if(totalPayout > 0) {
            require(IERC20(collateralToken).transfer(msg.sender, totalPayout), "Transfer failed");
        }
        
        emit PayoutRedemption(msg.sender, collateralToken, parentCollectionId, conditionId, indexSets, totalPayout);
    }
}
