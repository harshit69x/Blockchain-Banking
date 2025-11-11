const BankVC = artifacts.require("BankVC");

module.exports = async function (deployer, network, accounts) {
  const bankAddress = accounts[0];
  
  console.log("Deploying BankVC contract...");
  console.log("Bank address:", bankAddress);
  
  await deployer.deploy(BankVC);
  
  const bankVC = await BankVC.deployed();
  console.log("BankVC deployed at:", bankVC.address);
  
  const BANK_ROLE = await bankVC.BANK_ROLE();
  console.log("BANK_ROLE hash:", BANK_ROLE);
  
  const hasRole = await bankVC.hasRole(BANK_ROLE, bankAddress);
  console.log("Bank has BANK_ROLE:", hasRole);
};
