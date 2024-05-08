import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { parseEther } from "ethers";
import { deployments, ethers } from "hardhat";
import { FundMe, MockV3Aggregator } from "../../typechain-types";

describe("FundMe", () => {
    let fundMe: FundMe;
    let mockV3Aggregator: MockV3Aggregator;
    let deployer: SignerWithAddress;
    const sendValue = parseEther("1");
    beforeEach(async () => {
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["all"]);
        const fundMeContract = await deployments.get("FundMe");
        const mockV3AggregatorContract = await deployments.get(
            "MockV3Aggregator"
        );
        fundMe = (await ethers.getContractAt(
            fundMeContract.abi,
            fundMeContract.address,
            deployer
        )) as unknown as FundMe;
        mockV3Aggregator = (await ethers.getContractAt(
            mockV3AggregatorContract.abi,
            mockV3AggregatorContract.address,
            deployer
        )) as unknown as MockV3Aggregator;
    });

    describe("constructor", () => {
        it("sets the aggregator addresses correctly", async () => {
            const response = await fundMe.priceFeed();
            assert.equal(response, await mockV3Aggregator.getAddress());
        });
    });

    describe("fund", () => {
        it("fails if don't send enough ETH", async () => {
            await expect(fundMe.fund()).to.be.revertedWith(
                "You need to spend more ETH!"
            );
        });

        it("updates the amount funded data structure", async () => {
            await fundMe.fund({ value: sendValue });
            const response = await fundMe.addressToAmountFunded(
                deployer.address
            );
            assert.equal(response.toString(), sendValue.toString());
        });

        it("adds funder to array of funders", async () => {
            await fundMe.fund({ value: sendValue });
            const funder = await fundMe.funders(0);
            assert.equal(funder, deployer.address);
        });
    });

    describe("withdraw", () => {
        beforeEach(async () => {
            await fundMe.fund({ value: sendValue });
        });
        it("withdraw ETH from a single founder", async () => {
            const startingFundMeBalance = await ethers.provider.getBalance(
                fundMe.getAddress()
            );
            const startingDeployerBalance = await ethers.provider.getBalance(
                deployer.address
            );
            const txResponse = await fundMe.withdraw();
            const txReceipt = await txResponse.wait();
            if (!txReceipt) return;
            const gasCost = txReceipt.gasUsed * txReceipt.gasPrice;
            const endingFundMeBalance = await ethers.provider.getBalance(
                fundMe.getAddress()
            );
            const endingDeployerBalance = await ethers.provider.getBalance(
                deployer.address
            );
            assert.equal(endingFundMeBalance, BigInt(0));
            assert.equal(
                BigInt(
                    startingFundMeBalance + startingDeployerBalance
                ).toString(),
                BigInt(endingDeployerBalance + gasCost).toString()
            );
        });
        it("withdraw ETH from a multiple founders", async () => {
            const accounts = await ethers.getSigners();
            for (let i = 1; i < 6; i++) {
                const fundMeConnectedContract = fundMe.connect(accounts[i]);
                await fundMeConnectedContract.fund({ value: sendValue });
            }
            const startingFundMeBalance = await ethers.provider.getBalance(
                fundMe.getAddress()
            );
            const startingDeployerBalance = await ethers.provider.getBalance(
                deployer.address
            );
            const txResponse = await fundMe.withdraw();
            const txReceipt = await txResponse.wait();
            if (!txReceipt) return;
            const gasCost = txReceipt.gasUsed * txReceipt.gasPrice;
            const endingFundMeBalance = await ethers.provider.getBalance(
                fundMe.getAddress()
            );
            const endingDeployerBalance = await ethers.provider.getBalance(
                deployer
            );
            assert.equal(endingFundMeBalance, BigInt(0));
            assert.equal(
                BigInt(
                    startingFundMeBalance + startingDeployerBalance
                ).toString(),
                BigInt(endingDeployerBalance + gasCost).toString()
            );
            await expect(fundMe.funders(0)).to.be.reverted;
            for (let i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.addressToAmountFunded(accounts[i]),
                    BigInt(0)
                );
            }
        });

        it("only allows owner to withdraw", async () => {
            const accounts = await ethers.getSigners();
            const attacker = accounts[1];
            const attackerConnectedContract = fundMe.connect(attacker);
            await expect(
                attackerConnectedContract.withdraw()
            ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
        });
    });
});
