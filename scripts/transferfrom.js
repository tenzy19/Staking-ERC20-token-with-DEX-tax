// Import required modules from ethers library
const { Contract, ContractFactory } = require("ethers");

// Importing ABI and bytecode for required contracts

const usdtArtifact = require("../artifacts/contracts/USDT.sol/Tether.json");
const usdcArtifact = require("../artifacts/contracts/MyToken.sol/MyToken.json");

// Hardcoded contract addresses
const USDT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const USDC_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";


// Setting up a provider to interact with the Ethereum network
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// Initializing contract instances with their addresses and ABIs
const usdt = new Contract(USDT_ADDRESS, usdtArtifact.abi, provider);
const usdc = new Contract(USDC_ADDRESS, usdcArtifact.abi, provider);


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
  // Fetching the owner's signer object
  const [owner, otherAccount] = await ethers.getSigners();

  // Logging initial balances
  await logBalance(owner);
  await logBalance(otherAccount);


  // Approving the Uniswap router to spend USDT on owner's behalf
  const approveTx = await usdc
    .connect(owner)
    .approve(otherAccount.address, ethers.parseUnits("1", 18));
  await approveTx.wait();


  // Performing the swap on Uniswap: USDT for USDC
  const tx = await usdc
    .connect(otherAccount)
    .transferFrom(
      owner.address,
      otherAccount.address,
      ethers.parseUnits("1", 18)
    );

  // Waiting for the swap transaction to be confirmed
  await tx.wait();

  // Logging final balances after the swap
  await logBalance(owner);
  await logBalance(otherAccount);

};

// Executing the main function and handling success/failure
main()
  .then(() => process.exit(0)) // Exit script if everything worked
  .catch((error) => {
    console.error(error); // Log any errors
    process.exit(1); // Exit with an error code
  });