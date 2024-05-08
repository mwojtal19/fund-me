import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../helper-hardhat-config";
import verify from "../utils/verify";

const deployFundMe: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { deployer } = await hre.getNamedAccounts();
    const chainId = hre.network.config.chainId!;

    let ethUsdPriceFeedAddress;
    if (developmentChains.includes(chainId)) {
        const ethUsdAggregator = await hre.deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed;
    }
    const args = [ethUsdPriceFeedAddress];
    const fundMe = await hre.deployments.deploy("FundMe", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: 0,
    });
    if (!developmentChains.includes(chainId) && process.env.ETHERSCAN_API_KEY) {
        await verify(fundMe.address, args);
    }
};
export default deployFundMe;
deployFundMe.tags = ["all", "fundme"];
