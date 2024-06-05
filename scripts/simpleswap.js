// Import required modules from ethers library
const { Contract, ContractFactory } = require("ethers");

// Importing ABI and bytecode for required contracts
const WETH9 = require("../WETH9.json");
const factoryArtifact = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const routerArtifact = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const pairArtifact = require("@uniswap/v2-periphery/build/IUniswapV2Pair.json");
const usdtArtifact = require("../artifacts/contracts/USDT.sol/Tether.json");
const usdcArtifact = require("../artifacts/contracts/MyToken.sol/MyToken.json");

// Hardcoded contract addresses
const USDC_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const WETH_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const ROUTER_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
const PAIR_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

// Setting up a provider to interact with the Ethereum network
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// Initializing contract instances with their addresses and ABIs
const router = new Contract(ROUTER_ADDRESS, routerArtifact.abi, provider);
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
  const [owner] = await ethers.getSigners();

  // await usdc.connect(owner).setIsLiquidFalse(false);
  // console.log(await usdc.isLiquid());

  // Logging initial balances
  await logBalance(owner);

  // Approving the Uniswap router to spend USDT on owner's behalf
  // const approveTx = await usdt
  //   .connect(owner)
  //   .approve(ROUTER_ADDRESS, ethers.parseUnits("1", 18));
  await approveTx.wait();

  // Performing the swap on Uniswap: USDT for USDC
  // const tx = await router
  //   .connect(owner)
  //   .swapExactTokensForTokens(
  //     ethers.parseUnits("1", 18),
  //     0,
  //     [USDT_ADDRESS, USDC_ADDRESS],
  //     owner.address,
  //     Math.floor(Date.now() / 1000) + 60 * 10,
  //     {
  //       gasLimit: 1000000,
  //     }
  //   );
  // // Waiting for the swap transaction to be confirmed
  // await tx.wait();

  // Logging final balances after the swap
  await logBalance(owner);
};

// Executing the main function and handling success/failure
main()
  .then(() => process.exit(0)) // Exit script if everything worked
  .catch((error) => {
    console.error(error); // Log any errors
    process.exit(1); // Exit with an error code
  });