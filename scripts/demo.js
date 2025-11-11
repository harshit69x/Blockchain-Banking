const BankVC = artifacts.require("BankVC");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const bank = accounts[0];
    const user = accounts[1];
    
    console.log("=== Blockchain Banking Demo ===\n");
    
    // Get deployed contract
    const bankVC = await BankVC.deployed();
    console.log("Contract Address:", bankVC.address);
    console.log("Bank Account:", bank);
    console.log("User Account:", user);
    console.log("\n");
    
    // Step 1: Bank mints VC
    console.log("Step 1: Bank minting VC for user...");
    const ipfsCID = "QmTestKYCData123456789";
    const mintTx = await bankVC.mintVC(user, ipfsCID, { from: bank });
    const tokenId = mintTx.logs[0].args.tokenId.toString();
    console.log("✅ VC minted! Token ID:", tokenId);
    console.log("\n");
    
    // Step 2: Check VC validity
    console.log("Step 2: Checking VC validity...");
    const isValid = await bankVC.isValidVC(tokenId);
    console.log("VC Valid:", isValid);
    console.log("\n");
    
    // Step 3: User deposits ETH
    console.log("Step 3: User depositing 0.01 ETH...");
    const depositAmount = web3.utils.toWei("0.01", "ether");
    await bankVC.deposit({ from: user, value: depositAmount });
    let balance = await bankVC.balance(user);
    console.log("✅ Deposit successful! Balance:", web3.utils.fromWei(balance, "ether"), "ETH");
    console.log("\n");
    
    // Step 4: User withdraws partial amount
    console.log("Step 4: User withdrawing 0.005 ETH...");
    const withdrawAmount = web3.utils.toWei("0.005", "ether");
    await bankVC.withdraw(withdrawAmount, { from: user });
    balance = await bankVC.balance(user);
    console.log("✅ Withdrawal successful! Remaining balance:", web3.utils.fromWei(balance, "ether"), "ETH");
    console.log("\n");
    
    // Step 5: Bank revokes VC
    console.log("Step 5: Bank revoking VC...");
    await bankVC.revokeVC(tokenId, { from: bank });
    const isStillValid = await bankVC.isValidVC(tokenId);
    console.log("✅ VC revoked! Valid:", isStillValid);
    console.log("\n");
    
    // Step 6: User tries to deposit (should fail)
    console.log("Step 6: User attempting to deposit (should fail)...");
    try {
      await bankVC.deposit({ from: user, value: depositAmount });
      console.log("❌ Unexpected: Deposit succeeded!");
    } catch (error) {
      console.log("✅ Expected: Deposit blocked - No valid VC found");
    }
    console.log("\n");
    
    // Display final stats
    console.log("=== Final Statistics ===");
    const userVCs = await bankVC.getUserVCs(user);
    console.log("User VCs:", userVCs.map(id => id.toString()).join(", "));
    console.log("User Balance:", web3.utils.fromWei(await bankVC.balance(user), "ether"), "ETH");
    console.log("Contract Balance:", web3.utils.fromWei(await bankVC.getContractBalance(), "ether"), "ETH");
    
    console.log("\n✅ Demo completed successfully!");
    
    callback();
  } catch (error) {
    console.error("Error:", error);
    callback(error);
  }
};
