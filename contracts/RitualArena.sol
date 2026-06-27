// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title RitualArena — onchain scoreboard for Ritual · Tic Tac Toe
/// @notice Entering a match is free and happens entirely client-side. The only
///         onchain action is recording a win: `submitScore` costs a fixed
///         0.001 RITUAL (native) fee, computes the points on-chain, and updates
///         the player's running total + win count that power the leaderboard.
/// @dev Trust model per the design brief: the client reports which opponent it
///      beat and in how many moves; the contract computes the score. The match
///      itself (a client-side minimax AI) is not re-run on-chain.
contract RitualArena {
    /// @notice Fixed fee to record a win, in wei (0.001 RITUAL).
    uint256 public constant SUBMIT_FEE = 0.001 ether;

    /// @notice Number of opponents in the roster (ids 0..ROSTER_SIZE-1).
    uint8 public constant ROSTER_SIZE = 9;

    address public owner;

    mapping(address => uint256) public totalScore;
    mapping(address => uint256) public wins;
    mapping(address => bool) private _known;
    address[] private _players;

    event ScoreSubmitted(
        address indexed player,
        uint8 opponentId,
        uint8 moveCount,
        uint256 points,
        uint256 newTotal,
        uint256 newWins
    );
    event Withdrawn(address indexed to, uint256 amount);
    event OwnerTransferred(address indexed from, address indexed to);

    error WrongFee(uint256 sent, uint256 required);
    error BadOpponent(uint8 opponentId);
    error BadMoveCount(uint8 moveCount);
    error NotOwner();
    error ZeroAddress();
    error TransferFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Record a win on-chain. Must send exactly SUBMIT_FEE.
    /// @param opponentId Roster index of the beaten opponent (0..8).
    /// @param moveCount Number of player moves taken to win (1..9).
    /// @return points The score awarded for this win.
    function submitScore(uint8 opponentId, uint8 moveCount)
        external
        payable
        returns (uint256 points)
    {
        if (msg.value != SUBMIT_FEE) revert WrongFee(msg.value, SUBMIT_FEE);
        if (opponentId >= ROSTER_SIZE) revert BadOpponent(opponentId);
        if (moveCount == 0 || moveCount > 9) revert BadMoveCount(moveCount);

        points = _computePoints(moveCount);

        if (!_known[msg.sender]) {
            _known[msg.sender] = true;
            _players.push(msg.sender);
        }

        uint256 newTotal = totalScore[msg.sender] + points;
        uint256 newWins = wins[msg.sender] + 1;
        totalScore[msg.sender] = newTotal;
        wins[msg.sender] = newWins;

        emit ScoreSubmitted(msg.sender, opponentId, moveCount, points, newTotal, newWins);
    }

    /// @dev 100 base + speed bonus. Fewer moves to close out the win → bigger
    ///      bonus: a 3-move win is worth 160, 4 → 140, 5 → 120, 6+ → 100.
    function _computePoints(uint8 moveCount) internal pure returns (uint256) {
        uint8 moves = moveCount < 3 ? 3 : moveCount;
        uint256 bonus = moves < 6 ? uint256(6 - moves) * 20 : 0;
        return 100 + bonus;
    }

    /// @notice A wallet's running total score and win count.
    function stats(address player) external view returns (uint256 score, uint256 winCount) {
        return (totalScore[player], wins[player]);
    }

    /// @notice Number of wallets that have ever submitted a score.
    function playerCount() external view returns (uint256) {
        return _players.length;
    }

    /// @notice Full leaderboard data (unsorted). Rank client-side by score.
    /// @dev Fine for testnet scale; an indexer would replace this at volume.
    function leaderboard()
        external
        view
        returns (address[] memory addrs, uint256[] memory scores, uint256[] memory winCounts)
    {
        uint256 n = _players.length;
        addrs = new address[](n);
        scores = new uint256[](n);
        winCounts = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            address p = _players[i];
            addrs[i] = p;
            scores[i] = totalScore[p];
            winCounts[i] = wins[p];
        }
    }

    /// @notice Withdraw accumulated fees to an address.
    function withdraw(address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        uint256 amount = address(this).balance;
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
        emit Withdrawn(to, amount);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }
}
