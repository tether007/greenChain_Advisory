const Marketplace = artifacts.require("Marketplace");
const TestUSD = artifacts.require("TestUSD");

module.exports = async function (deployer, network, accounts) {
  // Deploy TestUSD with initial supply of 1,000,000 tokens
  await deployer.deploy(TestUSD, web3.utils.toWei("1000000", "ether"));
  const testUSD = await TestUSD.deployed();

  // Deploy Marketplace
  await deployer.deploy(Marketplace, testUSD.address);
  const marketplace = await Marketplace.deployed();

  console.log("TestUSD deployed at:", testUSD.address);
  console.log("Marketplace deployed at:", marketplace.address);
};
