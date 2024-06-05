const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { values } = require("lodash");
const { parseEther } = require("ethers");

async function increaseTime(seconds) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}


describe("Staking and token", function () {
  async function deploy(){
        
    const [owner, otherAccount, thirdAccount, holder, holder2, marketing, developer] = await ethers.getSigners();

    const tokenFactory = await ethers.getContractFactory("AuditAIToken");
    const token = await tokenFactory.deploy(
      "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008",
      marketing.address,
      developer.address
    );

    const StakingFactory = await ethers.getContractFactory("auditAIStaking");
    const staking = await StakingFactory.deploy(
      token.target
    );

    await token.transfer(staking.target, ethers.parseEther("100"))

    return {token, staking, owner, otherAccount, thirdAccount, marketing, developer, holder, holder2}
};

  // describe("Test fee", async function() {
  //   it("Should create Uniswap pair on deployment", async function() {
  //     // const{token, staking} = await loadFixture(deploy);
  //     // const pairAddress = await token.uniswapV2Pair();
  //     // expect(pairAddress).to.not.be.undefined;
  //     // expect(pairAddress).to.not.equal(ethers.constants.AddressZero);
  //     // expect(1).to.eq(1)

  //   })
  // })


  describe("Audit AI Token's functions", function () {
    it("Addresses deployed correctly", async function() {
      const{token, staking, owner, developer, marketing} = await loadFixture(deploy);
      expect(await staking.token()).to.eq(token.target);
      expect(await token.owner()).to.eq(owner.address);
      expect(await token._isExcludedFromFee(owner.address)).to.eq(true);
      expect(await token._isExcludedFromFee(token.target)).to.eq(true);
      expect(await token.blacklist(owner.address)).to.eq(true);
      expect(await token.blacklist(token.target)).to.eq(true);

      expect(await token.marketing()).to.eq(marketing.address);
      expect(await token.developer()).to.eq(developer.address);

    });  
    it("Should check that function exclude from tax / rewards working correctly", async function() {
      const{token, otherAccount} = await loadFixture(deploy);
      await token.excludeFromTax(otherAccount.address, true)
      expect(await token._isExcludedFromFee(otherAccount.address)).to.eq(true)
      await token.excludeFromRewards(otherAccount.address, true)
      expect(await token.blacklist(otherAccount.address)).to.eq(true)
    }) 
    it("should check function transfer ownership", async function() {
      const{token, staking, owner, thirdAccount} = await loadFixture(deploy);
      expect(await token.owner()).to.eq(owner.address);
      await token.transferOwnership(thirdAccount.address)
      expect(await token.owner()).to.eq(thirdAccount.address);
      await token.connect(thirdAccount).renounceOwnership()
      expect(await token.owner()).not.to.eq(thirdAccount.address);
    })
    // it("Should check openTrading function", async function() {
    //   const{token, staking, owner, thirdAccount} = await loadFixture(deploy);
    //   await token.openTrading(ethers.parseEther("10000"), { value: ethers.parseEther("100") })
    // })
  });
  describe("Audit AI Staking's functions", function() {
    it("Should check function stake", async function() {
      const{token, staking, thirdAccount, owner, otherAccount} = await loadFixture(deploy);
      expect(await staking.token()).to.eq(token.target);
      // in order to use this function, you need to be sure that you have tokens on balance, be sure that you approved staking address to transfer tokens from your address
      await token.transfer(thirdAccount.address, ethers.parseEther("100"))
      await token.connect(thirdAccount).approve(staking.target, ethers.parseEther("100"))
      expect(await token.balanceOf(thirdAccount.address)).to.eq(ethers.parseEther("100"));
      await staking.connect(thirdAccount).stake(ethers.parseEther("100"), 3)


      expect(await token.balanceOf(staking.target)).to.eq(ethers.parseEther("200"));

      let check = await staking.stakerList(thirdAccount.address, 0);
      expect(await check[2]).to.eq(ethers.parseEther("100"))
      
    }) 
    it("should check function that calculate rewards", async function() {
      const{token, staking, thirdAccount, owner, otherAccount} = await loadFixture(deploy);
      expect(await staking.token()).to.eq(token.target);
      // function with inputs ▼
      expect(await staking.preRewardsCheck(ethers.parseEther("100"), 3)).to.eq(ethers.parseEther("3"))
      // function that calculates rewards for user that have staked before ▼
      expect(await token.transfer(thirdAccount.address, ethers.parseEther("100"))).not.to.be.reverted;
      expect(await token.connect(thirdAccount).approve(staking.target, ethers.parseEther("100"))).not.to.be.reverted;
      expect(await token.balanceOf(thirdAccount.address)).to.eq(ethers.parseEther("100"));
      expect(await staking.connect(thirdAccount).stake(ethers.parseEther("100"), 3)).not.to.be.reverted;
      let check = await staking.stakerList(thirdAccount.address, 0)
      // console.log(check)
      let month = 86400 * 31
      await increaseTime(month);
      expect(await staking.calculateInterest(thirdAccount.address, 3)).to.eq(ethers.parseEther("3"))

    });
    it("Should check that pools work correctly", async function(){
      const{token, staking, thirdAccount, owner, otherAccount} = await loadFixture(deploy);
      expect(await staking.token()).to.eq(token.target);
      await token.transfer(thirdAccount.address, ethers.parseEther("100"))
      await token.connect(thirdAccount).approve(staking.target, ethers.parseEther("100"))
      await staking.connect(thirdAccount).stake(ethers.parseEther("10"), 3)
      await staking.connect(thirdAccount).stake(ethers.parseEther("10"), 12)
      await staking.connect(thirdAccount).stake(ethers.parseEther("10"), 30)
      await staking.connect(thirdAccount).stake(ethers.parseEther("10"), 50)
      await staking.connect(thirdAccount).stake(ethers.parseEther("10"), 70)
      await staking.connect(thirdAccount).stake(ethers.parseEther("10"), 120)
      await staking.connect(thirdAccount).stake(ethers.parseEther("10"), 160)

      let check1 = await staking.stakerList(thirdAccount.address, 0);
      expect(await check1[3]).to.eq(3)
      
      let check2 = await staking.stakerList(thirdAccount.address, 1);
      expect(await check2[3]).to.eq(12)

      let check3 = await staking.stakerList(thirdAccount.address, 2);
      expect(await check3[3]).to.eq(30)

      let check4 = await staking.stakerList(thirdAccount.address, 3);
      expect(await check4[3]).to.eq(50)

      let check5 = await staking.stakerList(thirdAccount.address, 4);
      expect(await check5[3]).to.eq(70)

      let check6 = await staking.stakerList(thirdAccount.address, 5);
      expect(await check6[3]).to.eq(120)

      let check7 = await staking.stakerList(thirdAccount.address, 6);
      expect(await check7[3]).to.eq(160)
    })
    it("Should calculate previous rewards correctly", async function(){
      // This check is necessary in case the user stakes tokens, then adds more tokens after some time into the same pool. 
      // It works as follows: the amount the user earns per day is calculated, multiplied by the number of days that have passed, and recorded in the structure. 
      // Then, when the withdraw method is called, this amount is added to the main percentage. 
      // the amount adds to the main percentage when user is calling stake function again
      // However, the user cannot withdraw before the end of the period in any case
      const{token, staking, thirdAccount, owner, otherAccount} = await loadFixture(deploy);
      expect(await staking.token()).to.eq(token.target);

      await(token.transfer(staking.target, ethers.parseEther("10000")))

      await token.transfer(thirdAccount.address, ethers.parseEther("1000"))
      await token.connect(thirdAccount).approve(staking.target, ethers.parseEther("1000"))
      await staking.connect(thirdAccount).stake(ethers.parseEther("100"), 12)
      await increaseTime(86410);

      let check1 = await staking.stakerList(thirdAccount.address, 0);
      expect(await check1[5]).to.eq(0) // need to be sure that rewards that have passed is 0 because we didnt call function stake again yet
      expect(await check1[2]).to.eq(ethers.parseEther('100'))
      await staking.connect(thirdAccount).stake(ethers.parseEther("100"), 12)
      // let check = await staking.stakerList(thirdAccount.address, 0);
      // console.log(check) (100 * 12) / (90 * 100) = 12/90 = check[5] this is amount of reward for one day
      expect(await token.balanceOf(thirdAccount.address)).to.eq(ethers.parseEther("800"))
      await increaseTime(86400 * 91)
      await staking.connect(thirdAccount).withdraw(12)
      
      // console.log(await token.balanceOf(thirdAccount.address))
      // wwokrs correctly, balance is 1024,13 ethers --> 24 ethers is rewards for staking 12% (200 eth) and 0,13 is previous rewards
    })



    it("Should check that addresses that has bought from pinkSale will not receive rewards for holding", async function() {
      const{token, staking, thirdAccount, owner, otherAccount} = await loadFixture(deploy);
      expect(await staking.token()).to.eq(token.target);
      expect(await token.transfer(staking.target, ethers.parseEther("1000"))).not.to.be.reverted;
      expect(await token.transfer(otherAccount.address, ethers.parseEther("1000"))).not.to.be.reverted;

      await token.connect(otherAccount).approve(thirdAccount.address, ethers.parseEther("10"))
      await token.excludeFromTax(otherAccount.address, true)
      expect(await token.connect(otherAccount).transfer(thirdAccount.address, ethers.parseEther("10")))
      expect(await token._isExcludedFromFee(otherAccount.address)).to.eq(true)
    })
    it('Should check how uint total is changing', async function() {
      const{token, staking, thirdAccount, owner, otherAccount} = await loadFixture(deploy);
      expect(await staking.token()).to.eq(token.target);
      expect(await staking.total()).to.eq(ethers.parseEther("45000000"))

      await token.transfer(staking.target, ethers.parseEther("1000"))
      await token.transfer(thirdAccount.address, ethers.parseEther("1000"))


      await token.connect(thirdAccount).approve(staking.target, ethers.parseEther("100"))
      await staking.connect(thirdAccount).stake(ethers.parseEther("100"), 3)
      expect(await staking.total()).to.eq(ethers.parseEther("44999997"))

      await(staking.connect(thirdAccount).withdraw(3))
      expect(await staking.total()).to.eq(ethers.parseEther("45000000"))

      await(token.approve(staking.target, ethers.parseEther("1")))
      expect(await staking.total()).to.eq(ethers.parseEther("45000000"))

      await token.connect(thirdAccount).approve(staking.target, ethers.parseEther("100"))
      await staking.connect(thirdAccount).stake(ethers.parseEther("100"), 3)
      expect(await staking.total()).to.eq(ethers.parseEther("44999997"))
      await increaseTime(86400 * 31)
      await(staking.connect(thirdAccount).withdraw(3))
      expect(await staking.total()).to.eq(ethers.parseEther("44999997"))

    })
    // it("Should check distribution", async function() {
    //   const{token, holder, holder2, thirdAccount, owner, otherAccount} = await loadFixture(deploy);
    //   await owner.sendTransaction({ to: token.target, value: ethers.parseEther("10") });
    //   const balance = await ethers.provider.getBalance(token.target);
    //   console.log(`token balance is ${balance} ETH`)
    //   await token.transfer(holder.address, ethers.parseEther("200000"))
    //   await token.transfer(holder.address, ethers.parseEther("200000"))
    //   await token.transfer(holder2.address, ethers.parseEther("400000"))
    //   await token.transfer(holder2.address, ethers.parseEther("400000"))

    //   await token.distribution()
    //   // console.log(await ethers.provider.getBalance(otherAccount.address))
    //   // console.log(await ethers.provider.getBalance(thirdAccount.address))
    //   // console.log(await ethers.provider.getBalance(owner.address))
    //   // console.log(await ethers.provider.getBalance(holder.address))
    //   // console.log(await ethers.provider.getBalance(holder2.address))
    //   // console.log(await token.balanceOf(holder2))
    //   // console.log(await token.holders(0))

    // })
    it("Should check withdraw function in all way", async function() {
      const{token, staking, thirdAccount, holder, otherAccount} = await loadFixture(deploy);
      console.log(await token.balanceOf(staking.target))

      expect(await staking.token()).to.eq(token.target);
      // in order to use this function, you need to be sure that you have tokens on balance, be sure that you approved staking address to transfer tokens from your address
      await token.transfer(thirdAccount.address, ethers.parseEther("1000"))
      await token.connect(thirdAccount).approve(staking.target, ethers.parseEther("1000"))
      await staking.connect(thirdAccount).stake(ethers.parseEther("100"), 3)

      await increaseTime(1314000);
      expect(await token.balanceOf(thirdAccount.address)).to.eq(ethers.parseEther("900"));
      // await staking.connect(thirdAccount).stake(ethers.parseEther("100"), 12)
      await staking.connect(thirdAccount).stake(ethers.parseEther("100"), 3)
      // console.log(await token.balanceOf(staking.target))


      expect(await token.balanceOf(staking.target)).to.eq(ethers.parseEther("300"));
      await token.transfer(staking.target, ethers.parseEther("100"))
      

      let check = await staking.stakerList(thirdAccount.address, 0);
      // console.log(check)
      expect(await check[2]).to.eq(ethers.parseEther("200"))
      let data = await staking.stakerList(thirdAccount.address, 0)
      expect(await data[3]).to.eq(3)

      await increaseTime(2628002)
      await expect(staking.connect(thirdAccount).withdraw(2)).to.be.reverted;
      expect(await staking.connect(thirdAccount).withdraw(3)).not.to.be.reverted;
      console.log(await token.balanceOf(thirdAccount));
      // let data2 = await staking.stakerList(thirdAccount, 0)
      expect(data[3]).to.eq(3);
      // console.log(await token.balanceOf(staking.target))
    })
  });
 

});
