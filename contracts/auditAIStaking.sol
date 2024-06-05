// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuditAIStaking is Ownable {
    IERC20 public immutable token;

    uint public total;
    

    struct Staker {
        uint lastStakedTime;
        uint reward;
        uint stakedAmount;
        uint percent;
        uint stakingPeriod;
        uint previousRewards;
    }

    struct Pools {
        uint period;
        uint poolsPercent;
    }

    mapping(uint => Pools) pools;
    mapping(address => Staker[]) public stakerList;

    event Staked(address indexed user, uint amount, uint _percent);
    event Unstaked(address indexed user, uint amount, uint percent);

    error withdrawError(string _reason);


    

    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Wrong address");
        token = IERC20(_token);
        total = 45000000e18;
        pools[3].poolsPercent = 3;
        pools[3].period = 30 days;
        pools[12].poolsPercent = 12;
        pools[12].period = 90 days;
        pools[30].poolsPercent = 30;
        pools[30].period = 180 days;
        pools[50].poolsPercent = 50;
        pools[50].period = 270 days;
        pools[70].poolsPercent = 70;
        pools[70].period = 365 days;
        pools[120].poolsPercent = 120;
        pools[120].period = 530 days;
        pools[160].poolsPercent = 160;
        pools[160].period = 730 days;
    }
    
    function stake(uint _amountToStake, uint8 percent) external {
        require(_amountToStake > 0, "Cannot stake zero tokens");
        uint preReward = preRewardsCheck(
            _amountToStake,
            percent
        );
        if (pools[percent].poolsPercent != 0) {
            require(
                total >= _amountToStake + preReward || token.balanceOf(address(this)) >= _amountToStake + preReward,
                "Insufficient balance of tokens in pool for rewards"
            );
            require(token.transferFrom( msg.sender, address(this), _amountToStake), "Token didn't transfered from user to this contract address");
            updatePool(_amountToStake, percent);
            total -= preReward;
            emit Staked(msg.sender, _amountToStake, percent);
        }
    }


    function preRewardsCheck(
        uint _amountToStake,
        uint percent
    ) public pure returns (uint) {
        uint reward = _amountToStake * percent / 100;
        return reward;
    }

    function calculateInterest(address _user, uint _percent) public view returns (uint256) {
        uint interest = 0;
        for (uint i = 0; i < stakerList[_user].length; i++) {
            Staker memory newStaker = stakerList[_user][i];
            if(newStaker.percent == _percent) {
                uint periodFinished = newStaker.lastStakedTime + newStaker.stakingPeriod;
                if (block.timestamp > periodFinished) {
                    interest = newStaker.stakedAmount * newStaker.percent / 100;
                } 
            }
        }
        return interest;
    }

    function withdraw(uint _percent) external {
        for (uint i = 0; i < stakerList[msg.sender].length; i++) {
            Staker memory newStaker = stakerList[msg.sender][i];
            if(newStaker.percent == _percent) {
                if(block.timestamp > newStaker.lastStakedTime + newStaker.stakingPeriod) {
                    newStaker.reward += calculateInterest(msg.sender, _percent) + newStaker.previousRewards;
                } else {
                    newStaker.reward = 0;
                }
                if(newStaker.reward == 0 ) {
                    total += preRewardsCheck(newStaker.stakedAmount, newStaker.percent);
                }
                uint sum = newStaker.stakedAmount + newStaker.reward;
                require(token.transfer(msg.sender, sum), "Tokens didn't transfered from this address to user's address ");
                
                if (i < stakerList[msg.sender].length - 1) {
                    stakerList[msg.sender][i] = stakerList[msg.sender][stakerList[msg.sender].length - 1];
                }
                stakerList[msg.sender].pop();
                emit Unstaked(msg.sender, sum, newStaker.percent);
            } else {
                revert withdrawError("Withdraw ended with error");
            }
            
        }
    }

    function updatePool(uint _stakedAmount, uint _percent) private {
    bool stakerUpdated = false;
    
    for(uint i = 0; i < stakerList[msg.sender].length; i++) {
            Staker storage staker = stakerList[msg.sender][i];
            if(staker.percent == _percent) {
                stakerUpdated = true;
            }
            if (stakerUpdated) {
                uint periodInDays = staker.stakingPeriod / 1 days;
                uint preReward = (staker.stakedAmount * staker.percent) / (periodInDays * 100);
                uint periodPassed = block.timestamp - staker.lastStakedTime;
                uint rewardsPassed = (preReward * periodPassed) / 1 days;

                staker.lastStakedTime = block.timestamp;
                staker.stakedAmount += _stakedAmount;
                staker.percent = pools[_percent].poolsPercent;
                staker.stakingPeriod = pools[_percent].period;
                staker.reward = 0;
                staker.previousRewards = rewardsPassed;
                break;
            }
    }

    if (!stakerUpdated) {
            Staker memory newStaker;
            newStaker.lastStakedTime = block.timestamp;
            newStaker.stakedAmount = _stakedAmount;
            newStaker.percent = pools[_percent].poolsPercent;
            newStaker.stakingPeriod = pools[_percent].period;
            newStaker.reward = 0;
            newStaker.previousRewards = 0;

            stakerList[msg.sender].push(newStaker);
        }
    
            
        

        
    
    }
    function getStakers(address _staker) external view returns (Staker[] memory) {
        return stakerList[_staker];
    }
    
}
