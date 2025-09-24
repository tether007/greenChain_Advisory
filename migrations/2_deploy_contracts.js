const CropAdvisor = artifacts.require("CropAdvisor");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(CropAdvisor);
  const advisor = await CropAdvisor.deployed();
  console.log("CropAdvisor deployed at:", advisor.address);

  // Optional post-deploy configuration via env
  const tokenAddress = process.env.PAYMENT_TOKEN_ADDRESS; // ERC20 (YellowUSD/TestUSD)
  const priceToken = process.env.ANALYSIS_PRICE_TOKEN;     // integer string (wei units)
  const priceEth = process.env.ANALYSIS_PRICE_ETH;         // integer string (wei)

  if (priceEth) {
    try {
      await advisor.setAnalysisPriceETH(priceEth);
      console.log("Set analysisPriceETH:", priceEth);
    } catch (e) {
      console.warn("setAnalysisPriceETH failed:", e.message || e);
    }
  }

  if (tokenAddress) {
    try {
      await advisor.setPaymentToken(tokenAddress);
      console.log("Set payment token:", tokenAddress);
      if (priceToken) {
        await advisor.setAnalysisPriceToken(priceToken);
        console.log("Set analysisPriceToken:", priceToken);
      }
    } catch (e) {
      console.warn("Token config failed:", e.message || e);
    }
  }
};