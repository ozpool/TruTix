// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title EventTicket
/// @notice ERC-721 event tickets. Each event fixes its capacity, tier prices,
///         resale cap, and royalty at creation; minting assigns a tier and an
///         auto-incrementing seat, and records the price paid for later resale
///         cap enforcement. Funds are held per organizer and withdrawn via pull.
contract EventTicket is ERC721, ERC2981 {
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

    mapping(uint256 tokenId => bool isRedeemedFlag) private _redeemed;
    mapping(uint256 eventId => mapping(address account => bool granted)) public redeemerRole;

    error EventAlreadyExists();
    error EventDoesNotExist();
    error NoTiers();
    error InvalidTier();
    error IncorrectPayment();
    error SoldOut();
    error SaleClosed();
    error NothingToWithdraw();
    error WithdrawFailed();
    error NotOrganizer();
    error NotRedeemer();
    error AlreadyRedeemed();
    error InvalidRoyalty();

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
    event RedeemerGranted(uint256 indexed eventId, address indexed account);
    event RedeemerRevoked(uint256 indexed eventId, address indexed account);
    event Redeemed(uint256 indexed tokenId, uint256 indexed eventId, address indexed redeemer);

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
        if (royaltyBps > 10_000) revert InvalidRoyalty();

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
        _setTokenRoyalty(tokenId, info.organizer, info.royaltyBps);

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

    /// @notice Grant the redeemer role for one event. Organizer only.
    function grantRedeemer(uint256 eventId, address account) external {
        if (msg.sender != events[eventId].organizer) revert NotOrganizer();
        redeemerRole[eventId][account] = true;
        emit RedeemerGranted(eventId, account);
    }

    /// @notice Revoke the redeemer role for one event. Organizer only.
    function revokeRedeemer(uint256 eventId, address account) external {
        if (msg.sender != events[eventId].organizer) revert NotOrganizer();
        redeemerRole[eventId][account] = false;
        emit RedeemerRevoked(eventId, account);
    }

    /// @notice Mark a ticket redeemed at the gate. One-way; callable only by a
    ///         redeemer of the token's event.
    function markRedeemed(uint256 tokenId) external {
        _requireOwned(tokenId);
        uint256 eventId = ticketEvent[tokenId];
        if (!redeemerRole[eventId][msg.sender]) revert NotRedeemer();
        if (_redeemed[tokenId]) revert AlreadyRedeemed();

        _redeemed[tokenId] = true;
        emit Redeemed(tokenId, eventId, msg.sender);
    }

    /// @notice Whether a ticket has been redeemed.
    function isRedeemed(uint256 tokenId) external view returns (bool) {
        return _redeemed[tokenId];
    }

    /// @notice The price list for an event, indexed by tier.
    function tierPrices(uint256 eventId) external view returns (uint256[] memory) {
        return _tierPrices[eventId];
    }

    /// @notice Fully on-chain metadata: base64 JSON embedding an inline SVG.
    ///         No IPFS or external gateway.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        uint256 eventId = ticketEvent[tokenId];
        string memory name = events[eventId].name;
        string memory tier = Strings.toString(ticketTier[tokenId]);
        string memory seat = Strings.toString(ticketSeat[tokenId]);
        string memory id = Strings.toString(tokenId);

        string memory image = Base64.encode(bytes(_svg(name, tier, seat, id)));
        string memory json = string.concat(
            '{"name":"',
            name,
            " #",
            id,
            '","description":"On-chain TruTix event ticket.",',
            '"image":"data:image/svg+xml;base64,',
            image,
            '","attributes":[',
            '{"trait_type":"Event","value":"',
            name,
            '"},',
            '{"trait_type":"Tier","value":',
            tier,
            "},",
            '{"trait_type":"Seat","value":',
            seat,
            "},",
            '{"trait_type":"Redeemed","value":',
            _redeemed[tokenId] ? "true" : "false",
            "}]}"
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    /// @dev Build the ticket's SVG image from its on-chain attributes.
    function _svg(
        string memory name,
        string memory tier,
        string memory seat,
        string memory id
    ) private pure returns (string memory) {
        return
            string.concat(
                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">',
                '<rect width="400" height="250" fill="#0f172a"/>',
                '<text x="24" y="52" fill="#f8fafc" font-family="sans-serif" font-size="26" font-weight="bold">',
                name,
                "</text>",
                '<text x="24" y="116" fill="#38bdf8" font-family="sans-serif" font-size="18">Tier ',
                tier,
                "</text>",
                '<text x="24" y="146" fill="#38bdf8" font-family="sans-serif" font-size="18">Seat ',
                seat,
                "</text>",
                '<text x="24" y="222" fill="#64748b" font-family="sans-serif" font-size="14">TruTix #',
                id,
                "</text></svg>"
            );
    }

    /// @inheritdoc ERC721
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
