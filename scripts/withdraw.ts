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
    console.log("Withdrawing...");
    const txResponse = await fundMe.withdraw();
    await txResponse.wait(1);
    console.log("Withdrawed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
