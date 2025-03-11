// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// Chainlink Price Feed Addresses for BTC/USD
// Source: https://docs.chain.link/data-feeds/price-feeds/addresses
const PRICE_FEEDS = {
    // Testnets
    "sepolia": "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
    // Mainnets
    "ethereum": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c"
};

// Default to Polygon Amoy for deployment
const DEFAULT_NETWORK = "polygon_amoy";

// Default to Sepolia for price feed
const DEFAULT_PRICE_FEED_NETWORK = "sepolia";

// Network RPC URLs
const RPC_URLS = {
    "polygon_amoy": "https://rpc-amoy.polygon.technology",
    "sepolia": "https://eth-sepolia.g.alchemy.com/v2/demo",
    "ethereum": "https://eth-mainnet.g.alchemy.com/v2/demo"
};

// March 10, 2024 00:00:00 GMT
const BET_END_TIME = 1710000000;

// March 11, 2024 04:00:00 GMT (28 hours after betting ends)
const RESULT_TIME = 1710100000;

module.exports = buildModule("BTCBettingModule", (m) => {
    // Get deployment network from environment or default to Polygon Amoy
    const network = process.env.NETWORK || DEFAULT_NETWORK;
    
    // Get price feed network from environment or default to Sepolia
    const priceFeedNetwork = process.env.PRICE_FEED_NETWORK || DEFAULT_PRICE_FEED_NETWORK;
    const priceFeed = m.getParameter("priceFeed", PRICE_FEEDS[priceFeedNetwork]);

    console.log(`Deploying to ${network} with price feed from ${priceFeedNetwork}: ${priceFeed}`);
    
    // Validate price feed address
    if (!priceFeed) {
        throw new Error(`No price feed configured for network: ${priceFeedNetwork}`);
    }

    // Deploy the BTCBettingPolygon contract with the appropriate price feed
    const btcBetting = m.contract("BTCBettingPolygon", [priceFeed]);

    return { btcBetting };
});