// Import required modules from ethers library
const { Contract, ContractFactory } = require("ethers");

// Importing ABI and bytecode for required contracts

// const usdtArtifact = require("../artifacts/contracts/USDT.sol/Tether.json");
const myTokenArtifact = require("./contracts/auditAIToken.sol/AuditAIToken.json")


const WETH9 = require("../WETH9.json");


// Hardcoded contract addresses
// const USDT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const USDC_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const ROUTER_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
const WETH_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
const PAIR_ADDRESS = "0x9382988a9BC661ecCc69DEAe72ff92847eD38052";
const PAIRWETH_ADDRESS = "0x75a174f152607bA13FfBb1E3006133f4d3CFaaEE";







// Setting up a provider to interact with the Ethereum network
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// Initializing contract instances with their addresses and ABIs
const usdt = new Contract(USDT_ADDRESS, usdtArtifact.abi, provider);
const usdc = new Contract(USDC_ADDRESS, usdcArtifact.abi, provider);
const weth = new Contract("0x0165878A594ca255338adfa4d48449f69242Eb8F", WETH9.abi, provider);

const pair = new Contract(PAIR_ADDRESS, pairArtifact.abi, provider);




// Function to log the balance of ETH, USDT, and USDC for a given signer
const logBalance = async (signerObj) => {
  // Fetch balances from blockchain
  const ethBalance = await provider.getBalance(signerObj.address);
  const usdtBalance = await usdt.balanceOf(signerObj.address);
  const usdcBalance = await usdc.balanceOf(signerObj.address);

  const balances = {
    ethBalance: ethBalance,
    usdtBalance: usdtBalance,
    usdcBalance: usdcBalance,
  };
  
  // Log the balances
  console.log(balances);

};

// Main function that will be executed
const main = async () => {

  const [owner] = await ethers.getSigners();


    const amount = ethers.parseEther("1000");
      // 22. Mint WETH to Router
  await weth.connect(owner).deposit({value: amount});
  console.log(await weth.balanceOf(PAIRWETH_ADDRESS));
  await weth.connect(owner).transfer(PAIRWETH_ADDRESS, amount);
  console.log(await weth.balanceOf(PAIRWETH_ADDRESS));

    // console.log(await provider.getBalance(USDC_ADDRESS));
    // console.log(await usdc.balanceOf(USDC_ADDRESS));
    

};
  
  // Executing the main function and handling success/failure
  main()
    .then(() => process.exit(0)) // Exit script if everything worked
    .catch((error) => {
      console.error(error); // Log any errors
      process.exit(1); // Exit with an error code
    });