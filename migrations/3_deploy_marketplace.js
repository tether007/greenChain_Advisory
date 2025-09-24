const Marketplace = artifacts.require("Marketplace");
const TestUSD = artifacts.require("TestUSD");

module.exports = async function (deployer) {
  // Optional TestUSD deployment for local/test usage
  await deployer.deploy(TestUSD, web3.utils.toWei("1000000", "ether"));
  const testUSD = await TestUSD.deployed();

  await deployer.deploy(Marketplace);
  const marketplace = await Marketplace.deployed();

  console.log("TestUSD deployed at:", testUSD.address);
  console.log("Marketplace deployed at:", marketplace.address);
};
