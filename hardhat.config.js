require("@nomicfoundation/hardhat-toolbox");
/** @type import('hardhat/config').HardhatUserConfig */
SECRET = "720cc119f8a1813f6432af7cb447fe72f5d0af96a529002d338bba8639284cd2"
SEP = "T43LOF7ZK6yjYwOfS1rQacbfFIaaDzMo"
module.exports = {
  solidity: "0.8.20",
  sourcify: {
    enabled: false
  },
networks: {
  testnet: {
    url: "https://eth-sepolia.g.alchemy.com/v2/T43LOF7ZK6yjYwOfS1rQacbfFIaaDzMo",
    chainId: 11155111,
    gasPrice: 20000000000,
    accounts: [SECRET]
  },
},
etherscan: {
  apiKey: SEP
}
};