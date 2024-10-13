// Import required modules from ethers library
const { Contract, ContractFactory } = require("ethers");

// Importing ABI and bytecode for required contracts

// const usdtArtifact = require("../artifacts/contracts/USDT.sol/Tether.json");
const myTokenArtifact = require("./artifacts/contracts/auditAIToken.sol/AuditAIToken.json")
const myStakingArtifact = require("./artifacts/contracts/auditAIStaking.sol/auditAIToken.json")

const WETH9 = require("../WETH9.json");
const { ethers } = require("hardhat");


// Hardcoded contract addresses

// const ROUTER_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
// const WETH_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
// const PAIR_ADDRESS = "0x9382988a9BC661ecCc69DEAe72ff92847eD38052";
// const PAIRWETH_ADDRESS = "0x75a174f152607bA13FfBb1E3006133f4d3CFaaEE";







// Setting up a provider to interact with the Ethereum network
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// Initializing contract instances with their addresses and ABIs
const usdt = new Contract(USDT_ADDRESS, usdtArtifact.abi, provider);
const usdc = new Contract(USDC_ADDRESS, usdcArtifact.abi, provider);
const weth = new Contract(WETH_ADDRESS, WETH9.abi, provider);

const pair = new Contract(PAIR_ADDRESS, pairArtifact.abi, provider);




// Function to log the balance of ETH, USDT, and USDC for a given signer
// const logBalance = async (signerObj) => {
//   // Fetch balances from blockchain
//   const ethBalance = await provider.getBalance(signerObj.address);
//   const usdtBalance = await usdt.balanceOf(signerObj.address);
//   const usdcBalance = await usdc.balanceOf(signerObj.address);

//   const balances = {
//     ethBalance: ethBalance,
//     usdtBalance: usdtBalance,
//     usdcBalance: usdcBalance,
//   };
  
  // Log the balances
//   console.log(balances);

// };

// Main function that will be executed
const main = async () => {
  // Сделайте contractETHBalance - totalAvailableToClaim >= 1 ether чтобы был больше чем 10 000 токенов, sThreshold
  // вам нужно будет инициализировать токен, стэйкинг и uniswapPair
  const [owner, token, staking, otherAccount] = await ethers.getSigners();

    await token.transfer(otherAccount.address, ethers.parseEther("120000"))
    await token.setStakingAddress(staking.target)

    await token.openTrading()

    await token.excludeFromTax(staking.target, true)
    await token.excludeFromRewards(staking.target, true)
    
    await token.connect(otherAccount).transfer(staking.target, ethers.parseEther("50000"))
    console.log(`If here is a info about otherAccount address, it works ${await token.holdersList(otherAccount.address)}`)

    await token.connect(otherAccount).transfer(uniswapPair, ethers.parseEther("10000"))

    console.log(`Balance should be more than 0 ${await provider.getBalance(otherAccount.address)}`)
};
  
  // Executing the main function and handling success/failure
  main()
    .then(() => process.exit(0)) // Exit script if everything worked
    .catch((error) => {
      console.error(error); // Log any errors
      process.exit(1); // Exit with an error code
    });