import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
    DECIMALS,
    developmentChains,
    INITIAL_ANSWER,
} from "../helper-hardhat-config";

const deployMocks: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { deployer } = await hre.getNamedAccounts();
    const chainId = hre.network.config.chainId!;
    if (developmentChains.includes(chainId)) {
        hre.deployments.log("Local network detected! Deploying mocks...");
        await hre.deployments.deploy("MockV3Aggregator", {
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER],
        });
        hre.deployments.log("Mocks deployed!");
        hre.deployments.log("---------------------------------");
    }
};
export default deployMocks;
deployMocks.tags = ["all", "mocks"];
