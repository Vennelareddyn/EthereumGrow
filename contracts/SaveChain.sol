
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SaveChain {
    error InvalidGoal();
    error InvalidDeposit();
    error InvalidWithdrawalAmount();
    error InsufficientSavings();
    error TransferFailed();

    mapping(address => uint256) public savings;
    mapping(address => uint256) public savingsGoal;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event GoalUpdated(address indexed user, uint256 goal);

    function setSavingsGoal(uint256 goal) external {
        if (goal == 0) revert InvalidGoal();

        savingsGoal[msg.sender] = goal;
        emit GoalUpdated(msg.sender, goal);
    }

    function deposit() external payable {
        if (msg.value == 0) revert InvalidDeposit();

        savings[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external {
        if (amount == 0) revert InvalidWithdrawalAmount();
        if (savings[msg.sender] < amount) revert InsufficientSavings();

        savings[msg.sender] -= amount;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit Withdrawn(msg.sender, amount);
    }

    function getSavingsProgress() external view returns (uint256) {
        uint256 goal = savingsGoal[msg.sender];

        if (goal == 0) {
            return 0;
        }

        return (savings[msg.sender] * 100) / goal;
    }
}
