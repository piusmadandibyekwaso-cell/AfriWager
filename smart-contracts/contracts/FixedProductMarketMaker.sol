// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

interface IConditionalTokens {
    function splitPosition(
        address collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata partition,
        uint256 amount
    ) external;

    function mergePositions(
        address collateralToken,
        bytes32 parentCollectionId,
        bytes32 conditionId,
        uint256[] calldata partition,
        uint256 amount
    ) external;
    
    function getCollectionId(bytes32 parentCollectionId, bytes32 conditionId, uint256 indexSet) external view returns (bytes32);
    function getPositionId(address collateralToken, bytes32 collectionId) external view returns (uint256);
}

contract FixedProductMarketMaker is ERC1155Holder {
    IConditionalTokens public conditionalTokens;
    IERC20 public collateralToken;
    bytes32 public conditionId;

    // For this simplified MVP, we assume binary market (2 outcomes)
    // Outcome 0 (YES), Outcome 1 (NO)
    uint256 public constant OUTCOME_COUNT = 2;

    // Internal balances of shares held by the AMM
    // poolBalances[0] = YES shares, poolBalances[1] = NO shares
    uint256[2] public poolBalances;
    
    uint256 public totalLiquidityShares;
    mapping(address => uint256) public liquidityProviderShares;

    event LiquidityAdded(address indexed provider, uint256 amount);
    event LiquidityRemoved(address indexed provider, uint256 amount);
    event AMMTrade(address indexed user, bool isBuy, uint256 investmentAmount, uint256 returnAmount);

    constructor(
        address _conditionalTokens,
        address _collateralToken,
        bytes32 _conditionId
    ) {
        conditionalTokens = IConditionalTokens(_conditionalTokens);
        collateralToken = IERC20(_collateralToken);
        conditionId = _conditionId;
    }

    /// @notice Add liquidity to the pool.
    /// The user sends USDC, the contract splits it into YES and NO tokens, and adds them to the pool.
    /// In a simplified FPMM (x*y=k), adding liquidity means adding equal amounts of x and y.
    function addFunding(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        
        // 1. Transfer collateral from user
        require(collateralToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // 2. Approve conditional tokens contract
        collateralToken.approve(address(conditionalTokens), amount);

        // 3. Split collateral into YES and NO tokens
        // Partition [1, 2] for binary
        uint256[] memory partition = new uint256[](2);
        partition[0] = 1;
        partition[1] = 2;
        
        conditionalTokens.splitPosition(
            address(collateralToken),
            bytes32(0),
            conditionId,
            partition,
            amount
        );

        // 4. Update pool balances
        // Since we just split 'amount' collateral into 'amount' YES and 'amount' NO
        // And this contract now holds them
        poolBalances[0] += amount;
        poolBalances[1] += amount;

        // 5. Mint Liquidity Provider (LP) tokens
        // Simplified: 1-to-1 for initial liquidity
        if (totalLiquidityShares == 0) {
            totalLiquidityShares = amount;
            liquidityProviderShares[msg.sender] = amount;
        } else {
            // Proportional distribution for subsequent adds
            // This simplification assumes balanced add. Real AMMs are more complex.
            uint256 mintAmount = amount; // Since we add equal amounts to both sides
            totalLiquidityShares += mintAmount;
            liquidityProviderShares[msg.sender] += mintAmount;
        }

        emit LiquidityAdded(msg.sender, amount);
    }

    /// @notice Buy outcome tokens
    /// @param outcomeIndex 0 for YES, 1 for NO
    /// @param investmentAmount Amount of USDC to invest
    /// @param minSharesExpected Minimum shares to receive (slippage protection)
    function buy(uint256 outcomeIndex, uint256 investmentAmount, uint256 minSharesExpected) external {
        require(outcomeIndex < OUTCOME_COUNT, "Invalid outcome index");
        
        // 1. Transfer collateral from user
        require(collateralToken.transferFrom(msg.sender, address(this), investmentAmount), "Transfer failed");
        
        // 2. Split collateral into YES and NO (equal amounts)
        // Similar logic to addFunding: AMM temporarily holds both
        collateralToken.approve(address(conditionalTokens), investmentAmount);
        
        uint256[] memory partition = new uint256[](2);
        partition[0] = 1;
        partition[1] = 2;

        conditionalTokens.splitPosition(
            address(collateralToken),
            bytes32(0),
            conditionId,
            partition,
            investmentAmount
        );
        
        // At this point, the contract has:
        // poolBalances[0] (old) + investmentAmount (newly minted YES)
        // poolBalances[1] (old) + investmentAmount (newly minted NO)
        
        // The user wants outcomeIndex tokens (e.g., YES).
        // To get YES, we "swap" the newly minted NO tokens for YES tokens using the pool (x*y=k).
        // Essentially, we leave the NO tokens in the pool, and take out MORE YES tokens.
        
        // uint256 buyTokenPool = poolBalances[outcomeIndex];
        // uint256 sellTokenPool = poolBalances[1 - outcomeIndex];
        
        // Trade: Input = investmentAmount (of the token we don't want)
        // Output = sharesOut (of the token we do want)
        // Formula: sharesOut = (investmentAmount * buyTokenPool) / (sellTokenPool + investmentAmount)
        // Note: sellTokenPool here is the pool of the token we are effectively "selling" back to the AMM
        // Wait, standard Gnosis implementation logic:
        // Buying YES means:
        // 1. You put in Collateral. 
        // 2. Collateral splits into YES + NO.
        // 3. You keep YES.
        // 4. You sell NO to the pool in exchange for MORE YES.
        
        uint256 sharesBought = (poolBalances[outcomeIndex] * investmentAmount) / (poolBalances[1 - outcomeIndex] + investmentAmount);
        
        uint256 totalSharesOut = investmentAmount + sharesBought;
        require(totalSharesOut >= minSharesExpected, "Slippage limit reached");
        
        // Update Pools
        // We added investmentAmount to the sellTokenPool (the one we didn't want)
        poolBalances[1 - outcomeIndex] += investmentAmount;
        // We removed sharesBought from the buyTokenPool
        poolBalances[outcomeIndex] -= sharesBought;
        
        // Transfer calculated shares to user
        // We need the Position ID for the ERC1155 transfer
        uint256 indexSet = outcomeIndex == 0 ? 1 : 2;
        bytes32 collectionId = conditionalTokens.getCollectionId(bytes32(0), conditionId, indexSet);
        uint256 positionId = conditionalTokens.getPositionId(address(collateralToken), collectionId);
        
        // The contract holds the tokens from the split + the pool. 
        // We transfer totalSharesOut to user.
        IERC1155(address(conditionalTokens)).safeTransferFrom(address(this), msg.sender, positionId, totalSharesOut, "");
        
        emit AMMTrade(msg.sender, true, investmentAmount, totalSharesOut);
    }
}
