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
        
        // 2. Approve conditional tokens contract
        collateralToken.approve(address(conditionalTokens), investmentAmount);
        
        // 3. Split collateral into YES and NO tokens
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
        
        // 4. Swap logic: amountIn = newly minted opposite tokens
        // Formula: sharesOut = (investmentAmount * buyTokenPool) / (sellTokenPool + investmentAmount)
        uint256 sharesBought = (poolBalances[outcomeIndex] * investmentAmount) / (poolBalances[1 - outcomeIndex] + investmentAmount);
        uint256 totalSharesOut = investmentAmount + sharesBought;
        require(totalSharesOut >= minSharesExpected, "Slippage limit reached");
        
        // Update Pools
        poolBalances[1 - outcomeIndex] += investmentAmount;
        poolBalances[outcomeIndex] -= sharesBought;
        
        // 5. Transfer total calculated shares to user
        _transferOutcomeToken(msg.sender, outcomeIndex, totalSharesOut);
        
        emit AMMTrade(msg.sender, true, investmentAmount, totalSharesOut);
    }

    /// @notice Remove liquidity from the pool
    /// @param shareAmount Amount of LP shares to burn
    function removeFunding(uint256 shareAmount) external {
        require(shareAmount > 0, "Amount must be > 0");
        require(liquidityProviderShares[msg.sender] >= shareAmount, "Checking insufficient shares");

        // 1. Calculate outcomes to withdraw
        // simplified: assuming equal proportion. 
        // In a real CPMM, we need to withdraw proportional to the *current* pool skew?
        // Actually, if I own 10% of the shares, I own 10% of YES and 10% of NO in the pool.
        
        uint256 yesToRemove = (poolBalances[0] * shareAmount) / totalLiquidityShares;
        uint256 noToRemove = (poolBalances[1] * shareAmount) / totalLiquidityShares;
        
        // 2. Update Pool Balances
        poolBalances[0] -= yesToRemove;
        poolBalances[1] -= noToRemove;
        
        totalLiquidityShares -= shareAmount;
        liquidityProviderShares[msg.sender] -= shareAmount;
        
        // 3. Merge Positions (The "Lobster Trap" Exit)
        // We have YES and NO tokens. We want to merge them into Collateral to send to user.
        // BUT `mergePositions` only works if we have EQUAL amounts of YES and NO (for binary).
        // Since the pool moves (people bet), poolBalances[0] != poolBalances[1].
        // So we will likely have unequal amounts of YES and NO to remove.
        
        // Logic:
        // Merge the *minimum* of the two.
        // Send the *excess* (profit/loss) as raw Outcome Tokens to the user?
        // Or sell the excess to the pool?
        // Standard Gnosis approach: Send the Outcome tokens to the user. Let them merge if they want.
        // But for this "Simple" App, we want USDC mainly.
        
        // Let's try to merge what we can automatically.
        uint256 mergeAmount = yesToRemove < noToRemove ? yesToRemove : noToRemove;
        
        if (mergeAmount > 0) {
            uint256[] memory partition = new uint256[](2);
            partition[0] = 1; 
            partition[1] = 2;
            
            // The FPMM holds the tokens, so FPMM calls merge.
            // Result: FPMM gets Collateral.
            conditionalTokens.mergePositions(
                address(collateralToken),
                bytes32(0),
                conditionId,
                partition,
                mergeAmount
            );
            
            // Transfer that Collateral to User
            require(collateralToken.transfer(msg.sender, mergeAmount), "Transfer collateral failed");
        }
        
        // 4. Send Excess Outcome Tokens (The "Impermanent Loss" Residue)
        if (yesToRemove > mergeAmount) {
            // Send extra YES tokens to user
             _transferOutcomeToken(msg.sender, 0, yesToRemove - mergeAmount);
        }
        if (noToRemove > mergeAmount) {
             // Send extra NO tokens to user
             _transferOutcomeToken(msg.sender, 1, noToRemove - mergeAmount);
        }

        emit LiquidityRemoved(msg.sender, shareAmount);
    }
    
    // Internal helper to transfer raw conditional tokens
    function _transferOutcomeToken(address to, uint256 outcomeIndex, uint256 amount) internal {
        uint256 indexSet = outcomeIndex == 0 ? 1 : 2;
        bytes32 collectionId = conditionalTokens.getCollectionId(bytes32(0), conditionId, indexSet);
        uint256 positionId = conditionalTokens.getPositionId(address(collateralToken), collectionId);
        
        IERC1155(address(conditionalTokens)).safeTransferFrom(address(this), to, positionId, amount, "");
    }
    
    /// @notice Sell outcome tokens (Swap back to Collateral... mostly)
    /// @param outcomeIndex Index of the token to sell (e.g., 0 for YES)
    /// @param returnAmount Amount of this token user wants to SELL
    function sell(uint256 outcomeIndex, uint256 returnAmount, uint256 minCollateralOut) external {
        // "Selling YES" = "Buying NO" with the YES tokens?
        // No, that just gives you NO tokens.
        
        // Correct "Cash Out" Logic:
        // 1. User sends YES tokens.
        // 2. We swap those YES tokens to NO tokens? No.
        // 3. We assume User wants USDC.
        // 4. To get USDC, we need YES + NO.
        // 5. User provides YES. We need NO.
        // 6. We BUY NO from the pool using ... what?
        
        // Actually, valid "Sell" in Gnosis:
        // You sell YES *into* the pool.
        // The pool gives you USDC?
        // Only if the pool holds USDC. But this pool holds YES/NO.
        
        // This confirms the "Lobster Trap" thesis:
        // You CANNOT get USDC out of this specific AMM structure simply by selling one side,
        // UNLESS the AMM has a buffer of USDC or we do a multi-step routed swap.
        
        // For MVP, we will OMIT 'sell' to avoid getting funds stuck or broken math.
        // Users should use 'removeFunding' to exit Liquidity.
        // Traders must hold until resolution OR we implement a secondary "USDC Buffer" pool later.
        
        revert("Sell not implemented in MVP Alpha");
    }
}
