// Import required modules from ethers library
const { Contract, ContractFactory } = require("ethers");

// Importing ABI and bytecode for required contracts
const WETH9 = require("../WETH9.json");
const factoryArtifact = require("@uniswap/v2-core/build/UniswapV2Factory.json");
const routerArtifact = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const pairArtifact = require("@uniswap/v2-periphery/build/IUniswapV2Pair.json");
const usdcArtifact = require("../artifacts/contracts/auditAIToken.sol/auditAIToken.json");

// Hardcoded contract addresses

const USDC_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const WETH_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";
const FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const ROUTER_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

// Setting up a provider to interact with the Ethereum network
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// Initializing contract instances with their addresses and ABIs
const router = new Contract(ROUTER_ADDRESS, routerArtifact.abi, provider);
const factory = new Contract(FACTORY_ADDRESS, factoryArtifact.abi, provider);
const usdc = new Contract(USDC_ADDRESS, usdcArtifact.abi, provider);


// Function to log the balance of ETH, USDT, and USDC for a given signer
const logBalance = async (signerObj) => {
  // Fetch balances from blockchain
  const ethBalance = await provider.getBalance(signerObj.address);
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

  let ethBalance = await provider.getBalance(USDC_ADDRESS);
  console.log(ethBalance);

const tokenAmount = ethers.parseEther("15");
   const approveTx = await usdc
    .connect(owner)
    .approve(ROUTER_ADDRESS, ethers.parseUnits("100", 18));
await approveTx.wait();

const txETh = await router.connect(owner).addLiquidityETH(USDC_ADDRESS,  ethers.parseUnits("10", 18), 1, 1, owner.address, Math.floor(Date.now() / 1000) + 60 * 10,  {value: tokenAmount});
await txETh.wait();

const pairAddres = await factory.connect(owner).getPair(USDC_ADDRESS, WETH_ADDRESS);
console.log(pairAddres);

const tok = ethers.parseUnits("1", 18)
const mint = await usdc.connect(owner).mint(USDC_ADDRESS, tok );
await mint.wait();

const txApprove = await usdc.connect(owner).approve(pairAddres,tok );
await txApprove.wait();

 await usdc.connect(owner)._swapTokensForEth(ethers.parseUnits("1", 18));


let ethsd = await provider.getBalance(USDC_ADDRESS);
let blance = await usdc.balanceOf(USDC_ADDRESS);

console.log(ethsd);
console.log(blance);
  // Performing the swap on Uniswap: USDT for USDC
  // const tx = await router.connect(owner)
  //   .swapTokensForExactTokens  (
  //     1,
  //     ethers.parseUnits("1", 18),
  //     [USDC_ADDRESS, WETH_ADDRESS],
  //     owner.address,
  //     Math.floor(Date.now() / 1000) + 60 * 10, {value: tokenAmount}
  //   );

  // Waiting for the swap transaction to be confirmed
  // await tx.wait();

  // Logging final balances after the swap

};

// Executing the main function and handling success/failure
main()
  .then(() => process.exit(0)) // Exit script if everything worked
  .catch((error) => {
    console.error(error); // Log any errors
    process.exit(1); // Exit with an error code
  });