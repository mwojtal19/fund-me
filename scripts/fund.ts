import { parseEther } from "ethers";
import { deployments, ethers } from "hardhat";
import { FundMe } from "../typechain-types";

async function main() {
    const accounts = await ethers.getSigners();
    const deployer = accounts[0];
    const fundMeContract = await deployments.get("FundMe");
    const fundMe = (await ethers.getContractAt(
        fundMeContract.abi,
        fundMeContract.address,
        deployer
    )) as unknown as FundMe;
    console.log("Funding contract...");
    const txResponse = await fundMe.fund({ value: parseEther("0.1") });
    await txResponse.wait(1);
    console.log("Contract Funded!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
