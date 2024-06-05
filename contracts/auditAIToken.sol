//SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";


contract AuditAIToken is ERC20, Ownable {
    address public immutable feeCollector;
    address public staking;
    IUniswapV2Router02 private uniswapRouter;
    address public uniswapPair;

    constructor(address _uniswapRouter, address payable _marketing, address payable _developer)
        ERC20('AuditAI', '$AUDAI') Ownable(msg.sender)
    {
        require(_marketing != address(0),"Zero address exception");
        require(_developer != address(0),"Zero address exception");
        require(_uniswapRouter != address(0),"Zero address exception");
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        feeCollector = address(this);
        _mint(msg.sender, TOTAL);
        _isExcludedFromFee[owner()] = true;
        _isExcludedFromFee[address(this)] = true;
        excludeFromRewards(owner(), true);
        excludeFromRewards(address(this), true);
        marketing = _marketing;
        developer = _developer;
    }
    uint256 private constant BUY_TAX = 5;
    uint256 private constant SELL_TAX = 5;
    uint256 private constant TOTAL = 1e26; //100,000,000
    uint256 private sThreshold = TOTAL * 1 / 1e4;
    uint256 private holderLastIndex = 0;
    uint256 private totalAvailableToClaim = 0;
    uint256 private totalHoldedTokens = 0;

    struct Holder {
        uint index;
        uint amountToClaim;
        uint lastClaimedTimestamp;
    }

    mapping(address => bool) public _isExcludedFromFee;

    mapping(address => uint) public stakersAmount;
    mapping(address => Holder) public holdersList;
    mapping(uint => address) public indexToHolder;
    mapping(address => bool) public blacklist;


    event FeePaid(address indexed payer, uint256 amount);
    event FeePaidFrom(address indexed from, address indexed to, uint256 amount);
    event TokensTransfered(address indexed buyer, uint256 amount);
    event TokensTransferedFrom(address indexed from, address indexed to, uint256 amount);
    event UpdateExcludedFromTax(address indexed account, bool isExcluded);
    event UpdateExcludedFromRewards(address indexed account, bool isExcluded);
    event BuyTaxUpdated(uint newBuyFee);
    event SellTaxUpdated(uint newSellFee);
    event FeeWalletUpdated(address indexed newTreasury);

    address payable public immutable marketing;
    address payable public immutable developer;

    bool private inSwap = false;
    bool private tradingOpen = false;

    modifier lockTheSwap {
        inSwap = true;
        _;
        inSwap = false;
    }


    function _transfer(address from, address to, uint256 amount) internal override { 
        require(amount > 0, "Transfer amount must be greater than zero");
        require(balanceOf(from) >= amount,"Balance less then transfer"); 
        uint tax = 0;
        uint256 contractETHBalance = address(this).balance;

        
        if (!(_isExcludedFromFee[from] || _isExcludedFromFee[to]) ) {

            if(from == address(uniswapPair)){
                require(address(uniswapPair) != address(0), "uniswap pair is not found, did you open trades?");
                require(tradingOpen, "Trading is not open yet");
                tax = BUY_TAX;
            }
            else if(to == address(uniswapPair)){
                require(address(uniswapPair) != address(0), "uniswap pair is not found, did you open trades?");
                require(tradingOpen, "Trading is not open yet");
                tax = SELL_TAX;
                uint256 contractTokenBalance = balanceOf(address(this));
                if(!inSwap){
                    if(contractTokenBalance > sThreshold){
                        _swapTokensForEth(contractTokenBalance);
                    }
                }
            }
            if(to == address(staking)) {
                stakersAmount[from] += amount;
            } else if(from == address(staking)) {
                stakersAmount[to] -= amount;
            }
        }
        uint256 feeAmount = amount*tax/100;
        uint256 remainingAmount = amount - feeAmount;
        super._transfer(from, to, remainingAmount);
        super._transfer(from, address(this), feeAmount);

        if(contractETHBalance - totalAvailableToClaim >= 1 ether) { 
            distribution();
        }

        checkHolders(from, to);
    }

    function claim() public {
        uint amount = holdersList[msg.sender].amountToClaim;
        require( amount > 0, "Nothing to claim");
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "developer transfer failed.");
        holdersList[msg.sender].amountToClaim = 0;
        holdersList[msg.sender].lastClaimedTimestamp = block.timestamp;
        totalAvailableToClaim -= amount;
    }

 
    function _swapTokensForEth(uint256 tokenAmount) internal lockTheSwap{ 
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = uniswapRouter.WETH();

        _approve(address(this), address(uniswapRouter), tokenAmount); 

        uniswapRouter.swapExactTokensForETHSupportingFeeOnTransferTokens( 
            tokenAmount, 
            0,
            path,
            feeCollector,
            block.timestamp
        ); 
    } 

    function checkHolders(address from, address to) internal {
        uint hundredThousand = 100000e18;
        address[] memory holders = new address[](2);
        holders[0] = from;
        holders[1] = to;

        address[] memory stakers = new address[](2);
        stakers[0] = from;
        stakers[1] = to;

        for(uint i=0; i<2; i++){
            uint _amountToClaim = holdersList[holders[i]].amountToClaim;
            uint _lastClaimedTimestamp = holdersList[holders[i]].lastClaimedTimestamp;
            if(holdersList[holders[i]].index != 0){
                totalHoldedTokens -= stakersAmount[stakers[i]];
                totalHoldedTokens -= balanceOf(holders[i]);
            }
            delete indexToHolder[holdersList[holders[i]].index];
            delete holdersList[holders[i]];
            if(balanceOf(holders[i]) + stakersAmount[stakers[i]] >= hundredThousand && !blacklist[holders[i]]){
                holderLastIndex++; 
                holdersList[holders[i]] = Holder({
                    index: holderLastIndex,
                    amountToClaim: _amountToClaim,
                    lastClaimedTimestamp: _lastClaimedTimestamp
                });
                indexToHolder[holderLastIndex] = holders[i];
                uint totalHolded = balanceOf(holders[i]) + stakersAmount[stakers[i]];
                totalHoldedTokens += totalHolded;
            }
        }
    }

    function distribution() public onlyOwner {

        uint balanceThis = address(this).balance;
        uint amountToDistribute = balanceThis - totalAvailableToClaim;
        require(amountToDistribute > 0, "Contract balance is zero");
        uint toSentMarketing = (amountToDistribute * 40) / 100;
        uint toSentDeveloper = (amountToDistribute * 20) / 100;
        uint holdersReward = amountToDistribute - toSentDeveloper - toSentMarketing;
        totalAvailableToClaim += holdersReward;


        (bool success, ) = developer.call{value: toSentDeveloper}("");
        require(success, "developer transfer failed.");
        (bool success2, ) = marketing.call{value: toSentMarketing}("");
        require(success2, "marketing transfer failed.");

        for (uint i = 0; i <= holderLastIndex; i++) {
            uint amount = balanceOf(indexToHolder[i]) + stakersAmount[indexToHolder[i]];
            uint reward = (holdersReward * amount / totalHoldedTokens);
            holdersList[indexToHolder[i]].amountToClaim += reward;
        }
    }
        
        
    function excludeFromTax(address _address, bool _isExclude) external onlyOwner {
        require(_address != address(0), "address 0");
        _isExcludedFromFee[_address] = _isExclude;
        emit UpdateExcludedFromTax(_address, _isExclude);
    }

    function excludeFromRewards(address _address, bool _isExclude) public onlyOwner {
        require(_address != address(0), "address 0");
        blacklist[_address] = _isExclude;
        emit UpdateExcludedFromRewards(_address, _isExclude);
    }

    function openTrading() external  onlyOwner {
        require(!tradingOpen,"trading is already open");
        tradingOpen = true;

        //mainnet router 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
        //localhost router 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
        //testnet router 0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008

        IUniswapV2Router02 _uniswapV2Router = IUniswapV2Router02(0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008);
        uniswapRouter = _uniswapV2Router;
        uniswapPair = IUniswapV2Factory(_uniswapV2Router.factory()).getPair(address(this), _uniswapV2Router.WETH());
        require(address(uniswapPair) != address(0), "uniswap pair is not found, something went wrong, have you created pair for this token and WETH?");
    }

    function setStakingAddress(address _address) external onlyOwner {
        require(_address != address(0), "address is not found, try to input address of real staking");
        staking = _address;
    }
    receive() external payable {}

    fallback() external payable {}
}