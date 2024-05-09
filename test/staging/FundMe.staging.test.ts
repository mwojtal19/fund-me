import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { assert } from "chai";
import { parseEther } from "ethers";
import { deployments, ethers, network } from "hardhat";
import { developmentChains } from "../../helper-hardhat-config";
import { FundMe } from "../../typechain-types";

developmentChains.includes(network.config.chainId!)
    ? describe.skip
    : describe("FundMe", () => {
          let fundMe: FundMe;
          let deployer: SignerWithAddress;
          const sendValue = parseEther("1");
          beforeEach(async () => {
              const accounts = await ethers.getSigners();
              deployer = accounts[0];
              const fundMeContract = await deployments.get("FundMe");
              fundMe = (await ethers.getContractAt(
                  fundMeContract.abi,
                  fundMeContract.address,
                  deployer
              )) as unknown as FundMe;
          });

          it("allows people to fund and withdraw", async () => {
              await fundMe.fund({ value: sendValue });
              await fundMe.withdraw();
              const endingBalance = await ethers.provider.getBalance(
                  fundMe.getAddress()
              );
              assert.equal(endingBalance.toString(), "0");
          });
      });
