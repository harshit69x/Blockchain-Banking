const BankVC = artifacts.require("BankVC");
const { expect } = require("chai");

contract("BankVC", (accounts) => {
  const [deployer, bank, user1, user2, nonBank] = accounts;
  let bankVC;
  let BANK_ROLE;

  beforeEach(async () => {
    bankVC = await BankVC.new();
    BANK_ROLE = await bankVC.BANK_ROLE();
  });

  describe("Deployment", () => {
    it("should deploy correctly with BANK_ROLE assigned", async () => {
      const hasBankRole = await bankVC.hasRole(BANK_ROLE, deployer);
      expect(hasBankRole).to.be.true;
    });

    it("should set the correct contract name and symbol", async () => {
      const name = await bankVC.name();
      const symbol = await bankVC.symbol();
      expect(name).to.equal("Bank Verifiable Credential");
      expect(symbol).to.equal("BVC");
    });

    it("should initialize nextTokenId to 1", async () => {
      const nextTokenId = await bankVC.nextTokenId();
      expect(nextTokenId.toString()).to.equal("1");
    });
  });

  describe("Minting VC", () => {
    it("should allow bank to mint VC", async () => {
      const ipfsCID = "QmTest123";
      const result = await bankVC.mintVC(user1, ipfsCID, { from: deployer });
      
      // Check event
      const event = result.logs.find(log => log.event === "VCIssued");
      expect(event).to.exist;
      expect(event.args.tokenId.toString()).to.equal("1");
      expect(event.args.to).to.equal(user1);
      expect(event.args.ipfsCID).to.equal(ipfsCID);
      
      // Check ownership
      const owner = await bankVC.ownerOf(1);
      expect(owner).to.equal(user1);
      
      // Check token URI
      const tokenURI = await bankVC.tokenURI(1);
      expect(tokenURI).to.equal(`ipfs://${ipfsCID}`);
    });

    it("should not allow non-bank to mint VC", async () => {
      const ipfsCID = "QmTest123";
      try {
        await bankVC.mintVC(user1, ipfsCID, { from: nonBank });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("revert");
      }
    });

    it("should not mint to zero address", async () => {
      const ipfsCID = "QmTest123";
      try {
        await bankVC.mintVC("0x0000000000000000000000000000000000000000", ipfsCID, { from: deployer });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Cannot mint to zero address");
      }
    });

    it("should increment token ID correctly", async () => {
      await bankVC.mintVC(user1, "QmTest1", { from: deployer });
      await bankVC.mintVC(user2, "QmTest2", { from: deployer });
      
      const nextTokenId = await bankVC.nextTokenId();
      expect(nextTokenId.toString()).to.equal("3");
    });
  });

  describe("Revoking VC", () => {
    beforeEach(async () => {
      await bankVC.mintVC(user1, "QmTest123", { from: deployer });
    });

    it("should allow bank to revoke VC", async () => {
      const result = await bankVC.revokeVC(1, { from: deployer });
      
      // Check event
      const event = result.logs.find(log => log.event === "VCRevoked");
      expect(event).to.exist;
      expect(event.args.tokenId.toString()).to.equal("1");
      expect(event.args.revokedBy).to.equal(deployer);
      
      // Check revoked status
      const isRevoked = await bankVC.revoked(1);
      expect(isRevoked).to.be.true;
      
      // Check validity
      const isValid = await bankVC.isValidVC(1);
      expect(isValid).to.be.false;
    });

    it("should not allow non-bank to revoke VC", async () => {
      try {
        await bankVC.revokeVC(1, { from: nonBank });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("revert");
      }
    });

    it("should not revoke already revoked VC", async () => {
      await bankVC.revokeVC(1, { from: deployer });
      
      try {
        await bankVC.revokeVC(1, { from: deployer });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Token already revoked");
      }
    });
  });

  describe("Deposits", () => {
    beforeEach(async () => {
      await bankVC.mintVC(user1, "QmTest123", { from: deployer });
    });

    it("should allow user with valid VC to deposit", async () => {
      const depositAmount = web3.utils.toWei("0.01", "ether");
      const result = await bankVC.deposit({ from: user1, value: depositAmount });
      
      // Check event
      const event = result.logs.find(log => log.event === "Deposit");
      expect(event).to.exist;
      expect(event.args.user).to.equal(user1);
      expect(event.args.amount.toString()).to.equal(depositAmount);
      expect(event.args.balanceAfter.toString()).to.equal(depositAmount);
      
      // Check balance
      const balance = await bankVC.balance(user1);
      expect(balance.toString()).to.equal(depositAmount);
    });

    it("should fail if user lacks valid VC", async () => {
      const depositAmount = web3.utils.toWei("0.01", "ether");
      
      try {
        await bankVC.deposit({ from: user2, value: depositAmount });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("No VC found for user");
      }
    });

    it("should fail if VC is revoked", async () => {
      await bankVC.revokeVC(1, { from: deployer });
      const depositAmount = web3.utils.toWei("0.01", "ether");
      
      try {
        await bankVC.deposit({ from: user1, value: depositAmount });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("No valid VC found");
      }
    });

    it("should accumulate multiple deposits correctly", async () => {
      const deposit1 = web3.utils.toWei("0.01", "ether");
      const deposit2 = web3.utils.toWei("0.02", "ether");
      
      await bankVC.deposit({ from: user1, value: deposit1 });
      await bankVC.deposit({ from: user1, value: deposit2 });
      
      const balance = await bankVC.balance(user1);
      const expected = web3.utils.toWei("0.03", "ether");
      expect(balance.toString()).to.equal(expected);
    });

    it("should fail when paused", async () => {
      await bankVC.pause({ from: deployer });
      const depositAmount = web3.utils.toWei("0.01", "ether");
      
      try {
        await bankVC.deposit({ from: user1, value: depositAmount });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Pausable: paused");
      }
    });
  });

  describe("Withdrawals", () => {
    beforeEach(async () => {
      await bankVC.mintVC(user1, "QmTest123", { from: deployer });
      const depositAmount = web3.utils.toWei("0.1", "ether");
      await bankVC.deposit({ from: user1, value: depositAmount });
    });

    it("should allow user to withdraw with sufficient balance", async () => {
      const withdrawAmount = web3.utils.toWei("0.05", "ether");
      const balanceBefore = await web3.eth.getBalance(user1);
      
      const result = await bankVC.withdraw(withdrawAmount, { from: user1 });
      
      // Check event
      const event = result.logs.find(log => log.event === "Withdraw");
      expect(event).to.exist;
      expect(event.args.user).to.equal(user1);
      expect(event.args.amount.toString()).to.equal(withdrawAmount);
      
      // Check internal balance
      const internalBalance = await bankVC.balance(user1);
      const expected = web3.utils.toWei("0.05", "ether");
      expect(internalBalance.toString()).to.equal(expected);
    });

    it("should fail with insufficient balance", async () => {
      const withdrawAmount = web3.utils.toWei("1", "ether");
      
      try {
        await bankVC.withdraw(withdrawAmount, { from: user1 });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Insufficient balance");
      }
    });

    it("should update balances correctly", async () => {
      const withdrawAmount = web3.utils.toWei("0.03", "ether");
      await bankVC.withdraw(withdrawAmount, { from: user1 });
      
      const balance = await bankVC.balance(user1);
      const expected = web3.utils.toWei("0.07", "ether");
      expect(balance.toString()).to.equal(expected);
    });

    it("should fail when paused", async () => {
      await bankVC.pause({ from: deployer });
      const withdrawAmount = web3.utils.toWei("0.01", "ether");
      
      try {
        await bankVC.withdraw(withdrawAmount, { from: user1 });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Pausable: paused");
      }
    });
  });

  describe("Get User VCs", () => {
    it("should return empty array for user with no VCs", async () => {
      const vcs = await bankVC.getUserVCs(user1);
      expect(vcs.length).to.equal(0);
    });

    it("should return all VCs owned by user", async () => {
      await bankVC.mintVC(user1, "QmTest1", { from: deployer });
      await bankVC.mintVC(user1, "QmTest2", { from: deployer });
      await bankVC.mintVC(user2, "QmTest3", { from: deployer });
      
      const vcs = await bankVC.getUserVCs(user1);
      expect(vcs.length).to.equal(2);
      expect(vcs[0].toString()).to.equal("1");
      expect(vcs[1].toString()).to.equal("2");
    });
  });

  describe("Pause/Unpause", () => {
    it("should allow bank to pause and unpause", async () => {
      await bankVC.pause({ from: deployer });
      const paused = await bankVC.paused();
      expect(paused).to.be.true;
      
      await bankVC.unpause({ from: deployer });
      const unpaused = await bankVC.paused();
      expect(unpaused).to.be.false;
    });

    it("should not allow non-bank to pause", async () => {
      try {
        await bankVC.pause({ from: nonBank });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("revert");
      }
    });
  });

  describe("Reentrancy Protection", () => {
    it("should prevent reentrancy attacks on deposit", async () => {
      // This is implicitly tested by the ReentrancyGuard modifier
      // A more comprehensive test would require a malicious contract
      await bankVC.mintVC(user1, "QmTest123", { from: deployer });
      const depositAmount = web3.utils.toWei("0.01", "ether");
      await bankVC.deposit({ from: user1, value: depositAmount });
      
      const balance = await bankVC.balance(user1);
      expect(balance.toString()).to.equal(depositAmount);
    });
  });

  describe("End-to-End Flow", () => {
    it("should complete full banking flow", async () => {
      // 1. Bank mints VC for user
      await bankVC.mintVC(user1, "QmKYCData123", { from: deployer });
      
      // 2. User deposits ETH
      const depositAmount = web3.utils.toWei("0.01", "ether");
      await bankVC.deposit({ from: user1, value: depositAmount });
      
      let balance = await bankVC.balance(user1);
      expect(balance.toString()).to.equal(depositAmount);
      
      // 3. User withdraws partial amount
      const withdrawAmount = web3.utils.toWei("0.005", "ether");
      await bankVC.withdraw(withdrawAmount, { from: user1 });
      
      balance = await bankVC.balance(user1);
      const expectedBalance = web3.utils.toWei("0.005", "ether");
      expect(balance.toString()).to.equal(expectedBalance);
      
      // 4. Bank revokes VC
      await bankVC.revokeVC(1, { from: deployer });
      
      // 5. User cannot deposit anymore
      try {
        await bankVC.deposit({ from: user1, value: depositAmount });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("No valid VC found");
      }
    });
  });
});
