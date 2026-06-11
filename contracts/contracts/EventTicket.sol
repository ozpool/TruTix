// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title EventTicket
/// @notice ERC-721 event tickets. Each event fixes its capacity, tier prices,
///         resale cap, and royalty at creation; minting assigns a tier and an
///         auto-incrementing seat, and records the price paid for later resale
///         cap enforcement. Funds are held per organizer and withdrawn via pull.
contract EventTicket is ERC721 {
    struct EventInfo {
        string name;
        uint256 capacity;
        uint256 maxResalePct; // percent over mint price allowed on resale, e.g. 20 = +20%
        uint96 royaltyBps; // ERC-2981 basis points (consumed by a later issue)
        address organizer;
        uint64 startsAt; // mint closes at this timestamp
        bool exists;
    }

    uint256 public nextTokenId = 1;

    mapping(uint256 eventId => EventInfo) public events;
    mapping(uint256 eventId => uint256[] prices) private _tierPrices;
    mapping(uint256 eventId => uint256 minted) public eventMinted;
    mapping(uint256 eventId => mapping(uint8 tier => uint32 seats)) public tierSeatCount;

    mapping(uint256 tokenId => uint256 eventId) public ticketEvent;
    mapping(uint256 tokenId => uint8 tier) public ticketTier;
    mapping(uint256 tokenId => uint32 seat) public ticketSeat;
    mapping(uint256 tokenId => uint256 price) public mintPrice;

    mapping(address organizer => uint256 amount) public proceeds;

    error EventAlreadyExists();
    error EventDoesNotExist();
    error NoTiers();
    error InvalidTier();
    error IncorrectPayment();
    error SoldOut();
    error SaleClosed();
    error NothingToWithdraw();
    error WithdrawFailed();

    event EventCreated(uint256 indexed eventId, address indexed organizer, string name, uint256 capacity);
    event TicketMinted(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        address indexed to,
        uint8 tier,
        uint32 seat,
        uint256 price
    );
    event ProceedsWithdrawn(address indexed organizer, uint256 amount);

    constructor() ERC721("TruTix Ticket", "TRUTIX") {}

    /// @notice Create an event. The caller becomes its organizer.
    /// @param prices Price per tier; the tier index is the array position.
    function createEvent(
        uint256 eventId,
        string calldata name,
        uint256 capacity,
        uint256 maxResalePct,
        uint96 royaltyBps,
        uint64 startsAt,
        uint256[] calldata prices
    ) external {
        if (events[eventId].exists) revert EventAlreadyExists();
        if (prices.length == 0) revert NoTiers();

        events[eventId] = EventInfo({
            name: name,
            capacity: capacity,
            maxResalePct: maxResalePct,
            royaltyBps: royaltyBps,
            organizer: msg.sender,
            startsAt: startsAt,
            exists: true
        });
        _tierPrices[eventId] = prices;

        emit EventCreated(eventId, msg.sender, name, capacity);
    }

    /// @notice Mint a ticket for `eventId` in the given `tier`, paying its price.
    function mint(uint256 eventId, uint8 tier) external payable returns (uint256 tokenId) {
        EventInfo storage info = events[eventId];
        if (!info.exists) revert EventDoesNotExist();
        if (block.timestamp >= info.startsAt) revert SaleClosed();
        if (tier >= _tierPrices[eventId].length) revert InvalidTier();
        if (eventMinted[eventId] >= info.capacity) revert SoldOut();

        uint256 price = _tierPrices[eventId][tier];
        if (msg.value != price) revert IncorrectPayment();

        tokenId = nextTokenId++;
        uint32 seat = ++tierSeatCount[eventId][tier];

        // Effects before the _safeMint interaction (CEI).
        eventMinted[eventId] += 1;
        ticketEvent[tokenId] = eventId;
        ticketTier[tokenId] = tier;
        ticketSeat[tokenId] = seat;
        mintPrice[tokenId] = price;
        proceeds[info.organizer] += msg.value;

        _safeMint(msg.sender, tokenId);

        emit TicketMinted(tokenId, eventId, msg.sender, tier, seat, price);
    }

    /// @notice Withdraw accrued mint proceeds for the calling organizer.
    function withdraw() external {
        uint256 amount = proceeds[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        proceeds[msg.sender] = 0; // effect before interaction
        (bool ok, ) = msg.sender.call{value: amount}("");
        if (!ok) revert WithdrawFailed();

        emit ProceedsWithdrawn(msg.sender, amount);
    }

    /// @notice The price list for an event, indexed by tier.
    function tierPrices(uint256 eventId) external view returns (uint256[] memory) {
        return _tierPrices[eventId];
    }
}
