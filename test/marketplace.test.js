const Marketplace = artifacts.require("Marketplace");
const TestUSD = artifacts.require("TestUSD");

contract("Marketplace", (accounts) => {
  const [deployer, seller, buyer] = accounts;
  let marketplace, testUSD;

  beforeEach(async () => {
    testUSD = await TestUSD.new(web3.utils.toWei("1000000", "ether"));
    marketplace = await Marketplace.new(testUSD.address);

    // Give buyer some TestUSD
    await testUSD.transfer(buyer, web3.utils.toWei("1000", "ether"), { from: deployer });
  });

  it("should let seller create and buyer purchase a listing", async () => {
    // Seller creates listing (price = 200 TUSD)
    await marketplace.createListing("Tomatoes", web3.utils.toWei("200", "ether"), 20, { from: seller });

    // Buyer approves marketplace to spend
    await testUSD.approve(marketplace.address, web3.utils.toWei("200", "ether"), { from: buyer });

    // Buyer buys listing
    await marketplace.buyListing(1, { from: buyer });

    const sellerBalance = await testUSD.balanceOf(seller);
    console.log("Seller balance after sale:", web3.utils.fromWei(sellerBalance, "ether"));

    assert.equal(web3.utils.fromWei(sellerBalance, "ether"), "200", "Seller should receive 200 TUSD");

    const listing = await marketplace.listings(1);
    assert.equal(listing.quantity, 19, "Quantity should reduce by 1");
  });
});
