const networkConfig = {
    default: {
        name: "hardhat",
        interval: "30",
    },
    31337: {
        name: "localhost",
        subscriptionId: "588",
        gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c", // 30 gwei
        interval: "30",
        entranceFee: ethers.utils.parseEther("0.01"), // 0.01 ETH
        callBackGasLimit: "500000", // 500,000 gas
    },
    11155111: {
        name: "sepolia",
        vrfCoordinatorV2: "	0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        subscriptionId: "0",
        callBackGasLimit: "500000",
        interval: "30",
    },
}

const developmentChains = {
    31337: {
        name: ["localhost", "hardhat"],
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        callBackGasLimit: "500000",
        interval: "30",
    },
}

module.exports = { networkConfig, developmentChains }
