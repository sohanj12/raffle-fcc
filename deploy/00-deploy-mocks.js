const { ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

const BASE_FEE = "250000000000000000"
const GAS_PRICE_LINKS = 1e9

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId

    //const args = [BASE_FEE, GAS_PRICE_LINKS]

    if (chainId == 31337) {
        log("Local network detected. Deploying mocks...")

        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINKS],
        })
        log("Mocks deployed")
        log("----------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
