// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @dev The subset of EventTicket this marketplace reads.
interface IEventTicket {
    function ticketEvent(uint256 tokenId) external view returns (uint256);

    function mintPrice(uint256 tokenId) external view returns (uint256);

    function isRedeemed(uint256 tokenId) external view returns (bool);

    function events(
        uint256 eventId
    )
        external
        view
        returns (
            string memory name,
            uint256 capacity,
            uint256 maxResalePct,
            uint96 royaltyBps,
            address organizer,
            uint64 startsAt,
            bool exists
        );
}

/// @title TicketMarketplace
/// @notice The canonical resale path for EventTicket NFTs. The resale price cap
///         is enforced on-chain, and proceeds are split between the seller and
///         the ERC-2981 royalty receiver via pull payment.
contract TicketMarketplace is ReentrancyGuard {
    IEventTicket public immutable ticket;

    struct Listing {
        uint256 price;
        address seller;
        uint64 listedAt;
    }

    mapping(uint256 tokenId => Listing) public listings;
    mapping(address account => uint256 amount) public proceeds;

    error ZeroPrice();
    error NotOwner();
    error TicketRedeemed();
    error PriceAboveCap();
    error NotApproved();
    error NotListed();
    error IncorrectPayment();
    error NothingToWithdraw();
    error TransferFailed();

    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event Sold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event Cancelled(uint256 indexed tokenId, address indexed seller);
    event ProceedsWithdrawn(address indexed account, uint256 amount);

    constructor(address eventTicket) {
        ticket = IEventTicket(eventTicket);
    }

    /// @notice List a ticket for resale at or below the event's price cap.
    function list(uint256 tokenId, uint256 price) external {
        if (price == 0) revert ZeroPrice();

        IERC721 nft = IERC721(address(ticket));
        if (nft.ownerOf(tokenId) != msg.sender) revert NotOwner();
        if (ticket.isRedeemed(tokenId)) revert TicketRedeemed();
        if (price > _cap(tokenId)) revert PriceAboveCap();
        if (nft.getApproved(tokenId) != address(this) && !nft.isApprovedForAll(msg.sender, address(this))) {
            revert NotApproved();
        }

        listings[tokenId] = Listing({price: price, seller: msg.sender, listedAt: uint64(block.timestamp)});
        emit Listed(tokenId, msg.sender, price);
    }

    /// @notice Buy a listed ticket. The NFT transfers immediately; the seller's
    ///         proceeds and the royalty are credited for later withdrawal.
    function buy(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        if (listing.seller == address(0)) revert NotListed();
        if (msg.value != listing.price) revert IncorrectPayment();

        delete listings[tokenId];

        (address royaltyReceiver, uint256 royaltyAmount) = IERC2981(address(ticket)).royaltyInfo(
            tokenId,
            listing.price
        );
        if (royaltyAmount > listing.price) royaltyAmount = listing.price;
        uint256 sellerAmount = listing.price - royaltyAmount;

        proceeds[listing.seller] += sellerAmount;
        if (royaltyAmount > 0) proceeds[royaltyReceiver] += royaltyAmount;

        IERC721(address(ticket)).safeTransferFrom(listing.seller, msg.sender, tokenId);

        emit Sold(tokenId, listing.seller, msg.sender, listing.price);
    }

    /// @notice Cancel your own listing.
    function cancel(uint256 tokenId) external {
        if (listings[tokenId].seller != msg.sender) revert NotOwner();
        delete listings[tokenId];
        emit Cancelled(tokenId, msg.sender);
    }

    /// @notice Withdraw accrued sale proceeds or royalties.
    function withdraw() external nonReentrant {
        uint256 amount = proceeds[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        proceeds[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit ProceedsWithdrawn(msg.sender, amount);
    }

    /// @dev Maximum resale price: mint price plus the event's allowed percentage.
    function _cap(uint256 tokenId) internal view returns (uint256) {
        uint256 eventId = ticket.ticketEvent(tokenId);
        (, , uint256 maxResalePct, , , , ) = ticket.events(eventId);
        uint256 base = ticket.mintPrice(tokenId);
        return base + (base * maxResalePct) / 100;
    }
}
