const { network, getNamedAccounts, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
          let raffle, vrfCoordinatorV2Mock, raffleEntranceFee, interval
          beforeEach(async () => {
              //const deployer = await getNamedAccounts()
              const accounts = await ethers.getSigners()
              player = accounts[1]
              await deployments.fixture(["mocks", "raffle"])
              raffleContract = await ethers.getContract("Raffle")
              raffle = await raffleContract.connect(player)
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
              raffleEntranceFee = await raffle.getEntranceFee()
              interval = await raffle.getInterval()
          })
          describe("Constructor", function () {
              it("initializes raffle correctly", async () => {
                  const raffleState = await raffle.getRaffleState()
                  const interval = await raffle.getInterval()
                  assert.equal(raffleState, "0")
                  assert.equal(
                      interval.toString(),
                      networkConfig[network.config.chainId]["interval"]
                  )
              })
          })

          describe("Enter raffle", function () {
              it("reverts when entry fees is insufficient", async () => {
                  await expect(raffle.enterRaffle()).to.be.revertedWith(
                      "Raffle__InsufficientEntryFees"
                  )
              })
              it("records player when they enter", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const playerFromContract = await raffle.getPlayer(0)
                  assert.equal(player.address, playerFromContract)
              })
              it("emits event when player enters raffle", async () => {
                  await expect(
                      raffle.enterRaffle({ value: raffleEntranceFee }),
                      raffle,
                      "RaffleEnter"
                  )
              })
              it("denies entry when Raffle is in calculating state", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  // for a documentation of the methods below, go here: https://hardhat.org/hardhat-network/reference
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  await raffle.performUpkeep([])
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith(
                      "Raffle__NotOpen"
                  )
              })
          })

          describe("check upkeep function", function () {
              it("returns false when no player has sent ETH", async () => {
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.checkUpkeep("0x")
                  assert(!upkeepNeeded)
              })
              it("returns false when enough time hasnt passed", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() - 10])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.checkUpkeep("0x")
                  assert(!upkeepNeeded)
              })
              it("returns true when enough time has passed and players have entered", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x") // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(upkeepNeeded)
              })
          })

          describe("performUpkeep", function () {
              it("performs upkeep only when checkUpkeep is true", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const tx = raffle.performUpkeep("0x")
                  assert(tx)
              })
              it("reverts when checkUpkeep is false", async () => {
                  await expect(raffle.performUpkeep("0x")).to.be.revertedWith(
                      "Raffle_UpkeepNotNeeded"
                  )
              })
              it("emits a requestId", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const txResponse = await raffle.performUpkeep("0x")
                  const txReceipt = await txResponse.wait(1)
                  //   const reqId = txReceipt.events[1].args.requestId
                  const event = txReceipt.events.find(
                      (event) => event.event === "RequestedRaffleWinner"
                  )
                  const [requestId] = event.args
                  assert(requestId.toNumber() > 0)
              })
              it("enters calculating state when performing upkeep", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  await raffle.performUpkeep("0x")
                  const raffleState = await raffle.getRaffleState()
                  assert.equal(raffleState, 1)
              })
          })

          describe("fulfillRandomWords", function () {
              beforeEach(async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
              })
              it("can only be called after perform upkeep", async () => {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
                  ).to.be.revertedWith("nonexistent request")
              })

              //   it("picks winner, sends funds and resets the raffle", async () => {
              //       const accounts = await ethers.getSigners()
              //       const rafflePlayers = 3
              //       const startingIndex = 2
              //       for (i = startingIndex; i < rafflePlayers + startingIndex; i++) {
              //           raffle.connect(accounts[i])
              //           //console.log(accounts[i])
              //           raffle.enterRaffle({ value: raffleEntranceFee })
              //       }

              //       //   await network.provider.send("evm_increaseTime", [interval.toNumber() + 1])
              //       //   await network.provider.request({ method: "evm_mine", params: [] })

              //       const tx = await raffle.performUpkeep("0x")
              //       const txReceipt = await tx.wait(1)

              //       console.log(txReceipt.events[1].args.requestId)
              //       await vrfCoordinatorV2Mock.fulfillRandomWords(
              //           txReceipt.events[1].args.requestId,
              //           raffle.address
              //       )

              //       const recentWinner = await raffle.getRecentWinner()
              //       //   console.log(recentWinner.toString())
              //       //   console.log(accounts[3].address)
              //       assert.equal(recentWinner.toString(), accounts[2].address)
              //   })
          })
      })
