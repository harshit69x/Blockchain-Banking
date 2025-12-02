// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title BankVC
 * @dev Blockchain-backed Banking with SSI & Verifiable Credentials
 * Manages KYC verification through NFT-based credentials and banking operations
 */
contract BankVC is ERC721URIStorage, AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant BANK_ROLE = keccak256("BANK_ROLE");

    // VC Request structure
    struct VCRequest {
        address requester;
        string kycData;
        uint256 requestedAt;
        bool isPending;
        bool isApproved;
    }

    // Storage
    mapping(uint256 => bool) public revoked;
    mapping(address => uint256) public balance;
    mapping(address => uint256) public userToTokenId;
    uint256 public nextTokenId;
    uint256 public nextRequestId;
    mapping(uint256 => VCRequest) public vcRequests;
    mapping(address => uint256[]) public userRequests;
    uint256[] public allRequestIds;

    // Events
    event VCRequested(uint256 indexed requestId, address indexed requester, uint256 requestedAt);
    event VCRequestApproved(uint256 indexed requestId, uint256 indexed tokenId, address indexed user);
    event VCRequestRejected(uint256 indexed requestId, address indexed rejectedBy);
    event VCIssued(uint256 indexed tokenId, address indexed to, string ipfsCID, uint256 issuedAt);
    event VCRevoked(uint256 indexed tokenId, address indexed revokedBy, uint256 revokedAt);
    event Deposit(address indexed user, uint256 amount, uint256 balanceAfter);
    event Withdraw(address indexed user, uint256 amount, uint256 balanceAfter);
    event Transfer(address indexed from, address indexed to, uint256 amount, uint256 timestamp);

    /**
     * @dev Constructor to initialize the contract
     */
    constructor() ERC721("Bank Verifiable Credential", "BVC") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BANK_ROLE, msg.sender);
        
        nextTokenId = 1;
        nextRequestId = 1;
    }

    /**
     * @dev User requests a Verifiable Credential
     * @param kycData KYC data submitted by user
     * @return requestId The ID of the VC request
     */
    function requestVC(string calldata kycData) 
        external 
        returns (uint256 requestId) 
    {
        require(bytes(kycData).length > 0, "KYC data cannot be empty");
        require(userToTokenId[msg.sender] == 0, "User already has a VC");

        requestId = nextRequestId++;
        
        vcRequests[requestId] = VCRequest({
            requester: msg.sender,
            kycData: kycData,
            requestedAt: block.timestamp,
            isPending: true,
            isApproved: false
        });

        userRequests[msg.sender].push(requestId);
        allRequestIds.push(requestId);
        
        emit VCRequested(requestId, msg.sender, block.timestamp);
    }

    /**
     * @dev Get all pending VC requests
     * @return Array of request IDs
     */
    function getPendingRequests() 
        external 
        view 
        returns (uint256[] memory) 
    {
        uint256 pendingCount = 0;
        
        // Count pending requests
        for (uint256 i = 0; i < allRequestIds.length; i++) {
            if (vcRequests[allRequestIds[i]].isPending) {
                pendingCount++;
            }
        }
        
        // Create array of pending request IDs
        uint256[] memory pending = new uint256[](pendingCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allRequestIds.length; i++) {
            if (vcRequests[allRequestIds[i]].isPending) {
                pending[index] = allRequestIds[i];
                index++;
            }
        }
        
        return pending;
    }

    /**
     * @dev Get user's VC requests
     * @param user User address
     * @return Array of request IDs
     */
    function getUserRequests(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userRequests[user];
    }

    /**
     * @dev Approve VC request and mint VC
     * @param requestId The request ID to approve
     * @param ipfsCID IPFS CID containing KYC data
     * @return tokenId The ID of the minted token
     */
    function approveVCRequest(uint256 requestId, string calldata ipfsCID) 
        external 
        onlyRole(BANK_ROLE) 
        returns (uint256 tokenId) 
    {
        VCRequest storage request = vcRequests[requestId];
        require(request.isPending, "Request is not pending");
        require(request.requester != address(0), "Invalid request");

        address to = request.requester;
        require(userToTokenId[to] == 0, "User already has a VC");

        tokenId = nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", ipfsCID)));
        
        userToTokenId[to] = tokenId;
        request.isPending = false;
        request.isApproved = true;
        
        emit VCRequestApproved(requestId, tokenId, to);
        emit VCIssued(tokenId, to, ipfsCID, block.timestamp);
    }

    /**
     * @dev Reject VC request
     * @param requestId The request ID to reject
     */
    function rejectVCRequest(uint256 requestId) 
        external 
        onlyRole(BANK_ROLE) 
    {
        VCRequest storage request = vcRequests[requestId];
        require(request.isPending, "Request is not pending");
        
        request.isPending = false;
        request.isApproved = false;
        
        emit VCRequestRejected(requestId, msg.sender);
    }

    /**
     * @dev Mint a new Verifiable Credential NFT
     * @param to Address to receive the VC NFT
     * @param ipfsCID IPFS CID containing KYC data
     * @return tokenId The ID of the minted token
     */
    function mintVC(address to, string calldata ipfsCID) 
        external 
        onlyRole(BANK_ROLE) 
        returns (uint256 tokenId) 
    {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(ipfsCID).length > 0, "IPFS CID cannot be empty");

        tokenId = nextTokenId++;
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked("ipfs://", ipfsCID)));
        
        emit VCIssued(tokenId, to, ipfsCID, block.timestamp);
    }

    /**
     * @dev Revoke a Verifiable Credential
     * @param tokenId The token ID to revoke
     */
    function revokeVC(uint256 tokenId) 
        external 
        onlyRole(BANK_ROLE) 
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(!revoked[tokenId], "Token already revoked");

        revoked[tokenId] = true;
        
        emit VCRevoked(tokenId, msg.sender, block.timestamp);
    }

    /**
     * @dev Check if a VC is valid (exists, not revoked, and owned by holder)
     * @param tokenId The token ID to check
     * @return bool True if the VC is valid
     */
    function isValidVC(uint256 tokenId) 
        public 
        view 
        returns (bool) 
    {
        if (_ownerOf(tokenId) == address(0)) return false;
        if (revoked[tokenId]) return false;
        return true;
    }

    /**
     * @dev Deposit ETH into the user's internal balance
     * Requires a valid VC NFT
     */
    function deposit() 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        // Check if user has at least one valid VC
        uint256[] memory userVCs = getUserVCs(msg.sender);
        require(userVCs.length > 0, "No VC found for user");
        
        bool validVCFound = false;
        for (uint256 i = 0; i < userVCs.length; i++) {
            if (isValidVC(userVCs[i])) {
                validVCFound = true;
                break;
            }
        }
        require(validVCFound, "No valid VC found");

        balance[msg.sender] += msg.value;
        
        emit Deposit(msg.sender, msg.value, balance[msg.sender]);
    }

    /**
     * @dev Withdraw ETH from the user's internal balance
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        require(balance[msg.sender] >= amount, "Insufficient balance");

        balance[msg.sender] -= amount;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdraw(msg.sender, amount, balance[msg.sender]);
    }

    /**
     * @dev Transfer internal balance to another user
     * @param to Address to transfer to
     * @param amount Amount to transfer
     */
    function transferBalance(address to, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(to != address(0), "Cannot transfer to zero address");
        require(to != msg.sender, "Cannot transfer to yourself");
        require(amount > 0, "Transfer amount must be greater than 0");
        require(balance[msg.sender] >= amount, "Insufficient balance");

        // Check sender has valid VC
        uint256 senderTokenId = userToTokenId[msg.sender];
        require(senderTokenId != 0, "Sender has no VC");
        require(isValidVC(senderTokenId), "Sender VC is not valid");

        // Check recipient has valid VC
        uint256 recipientTokenId = userToTokenId[to];
        require(recipientTokenId != 0, "Recipient has no VC");
        require(isValidVC(recipientTokenId), "Recipient VC is not valid");

        balance[msg.sender] -= amount;
        balance[to] += amount;
        
        emit Transfer(msg.sender, to, amount, block.timestamp);
    }

    /**
     * @dev Bank-authorized transfer (for IoT/RFID transactions)
     * Bank acts as trusted intermediary to execute transfers on behalf of verified cardholders
     * @param from Address to transfer from (cardholder)
     * @param to Address to transfer to (merchant)
     * @param amount Amount to transfer
     */
    function bankAuthorizedTransfer(address from, address to, uint256 amount) 
        external 
        onlyRole(BANK_ROLE)
        nonReentrant 
        whenNotPaused 
    {
        require(from != address(0), "Cannot transfer from zero address");
        require(to != address(0), "Cannot transfer to zero address");
        require(from != to, "Cannot transfer to yourself");
        require(amount > 0, "Transfer amount must be greater than 0");
        require(balance[from] >= amount, "Insufficient balance");

        // Check sender has valid VC
        uint256 senderTokenId = userToTokenId[from];
        require(senderTokenId != 0, "Sender has no VC");
        require(isValidVC(senderTokenId), "Sender VC is not valid");

        // Note: Recipient doesn't need VC for receiving (e.g., merchants)
        
        balance[from] -= amount;
        balance[to] += amount;
        
        emit Transfer(from, to, amount, block.timestamp);
    }

    /**
     * @dev Get user's VC token ID
     * @param user Address of the user
     * @return tokenId The user's VC token ID (0 if none)
     */
    function getUserVCTokenId(address user) 
        external 
        view 
        returns (uint256) 
    {
        return userToTokenId[user];
    }

    /**
     * @dev Check if a user has a valid (non-revoked) VC
     * @param user Address of the user
     * @return bool True if user has valid VC
     */
    function hasValidVC(address user) 
        external 
        view 
        returns (bool) 
    {
        uint256 tokenId = userToTokenId[user];
        if (tokenId == 0) return false;
        return isValidVC(tokenId);
    }

    /**
     * @dev Get all VC token IDs owned by a user
     * @param user Address of the user
     * @return uint256[] Array of token IDs
     */
    function getUserVCs(address user) 
        public 
        view 
        returns (uint256[] memory) 
    {
        uint256 tokenCount = balanceOf(user);
        uint256[] memory tokens = new uint256[](tokenCount);
        
        uint256 index = 0;
        for (uint256 i = 1; i < nextTokenId && index < tokenCount; i++) {
            if (_ownerOf(i) != address(0) && ownerOf(i) == user) {
                tokens[index] = i;
                index++;
            }
        }
        
        return tokens;
    }

    /**
     * @dev Pause the contract (deposits and withdrawals)
     */
    function pause() 
        external 
        onlyRole(BANK_ROLE) 
    {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() 
        external 
        onlyRole(BANK_ROLE) 
    {
        _unpause();
    }

    /**
     * @dev Get the contract's ETH balance
     * @return uint256 Contract balance
     */
    function getContractBalance() 
        external 
        view 
        returns (uint256) 
    {
        return address(this).balance;
    }

    /**
     * @dev Required override for supportsInterface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
