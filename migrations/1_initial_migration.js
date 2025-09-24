const Migrations = artifacts.require("Migrations");

module.exports = function (deployer) {
  deployer.deploy(Migrations).then(() => {
    console.log("Migrations deployed at:", Migrations.address);
  });
};