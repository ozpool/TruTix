// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

interface IMarket {
    function buy(uint256 tokenId) external payable;
}

/// @dev Test-only attacker: tries to re-enter `buy` from the ERC-721 receive
///      hook to prove the marketplace's reentrancy guard holds.
contract ReentrantBuyer is IERC721Receiver {
    IMarket private immutable _market;
    uint256 private _tokenId;

    constructor(address market) {
        _market = IMarket(market);
    }

    function attack(uint256 tokenId) external payable {
        _tokenId = tokenId;
        _market.buy{value: msg.value}(tokenId);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        _market.buy{value: 0}(_tokenId);
        return IERC721Receiver.onERC721Received.selector;
    }

    receive() external payable {}
}
