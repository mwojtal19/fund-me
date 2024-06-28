// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

error FundMe__NotOwner();

/// @title Fundme
/// @author Michał Wojtalczyk
/// @notice Contract to hold funds using chainlink price feed
contract FundMe {
    using PriceConverter for uint256;

    mapping(address => uint256) private s_addressToAmountFunded;
    address[] private s_funders;

    address private immutable i_owner;
    uint256 public constant MINIMUM_USD = 50 * 10 ** 18;
    AggregatorV3Interface private s_priceFeed;

    /// @notice check if sender is owner
    /// @dev Revert when sender isn't owner
    modifier onlyOwner() {
        if (msg.sender != i_owner) revert FundMe__NotOwner();
        _;
    }

    constructor(address _priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(_priceFeedAddress);
    }

    /// @notice fund contract
    /// @dev Revert when value is below minimum USD
    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!"
        );
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    /// @notice Get version of chainlink price feed
    /// @return version of chainlink price feed
    function getVersion() public view returns (uint256) {
        return s_priceFeed.version();
    }

    /// @notice Withdraw funds to owner
    /// @dev Only for owner
    /// @dev Revert when transfer to owner failed
    /// @dev Reset funders
    function withdraw() public onlyOwner {
        address[] memory funders = s_funders;
        for (
            uint256 funderIndex = 0;
            funderIndex < funders.length;
            funderIndex++
        ) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess, "Call failed");
    }

    /// @notice Get owner of the contract
    /// @return owner address
    function getOwner() public view returns (address) {
        return i_owner;
    }

    /// @notice Get funder by index
    /// @return funder address
    function getFunder(uint256 _index) public view returns (address) {
        return s_funders[_index];
    }

    /// @notice Get amount of ETH send by address
    /// @return amount of ETH
    function getAddressToAmountFunded(
        address _funder
    ) public view returns (uint256) {
        return s_addressToAmountFunded[_funder];
    }

    /// @notice Get chainlink price feed
    /// @return chainlink price feed
    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}
