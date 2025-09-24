// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CropAdvisor is Ownable, ReentrancyGuard {
    // Pricing and assets
    uint256 public analysisPriceETH = 0.00001 ether;
    IERC20 public paymentToken; // YellowUSD (test) on Sepolia when set
    uint256 public analysisPriceToken; // price in ERC20 smallest unit

    struct Analysis {
        address farmer;
        string imageHash;
        string diagnosis;
        string advice;
        uint256 timestamp;
        bool completed;
    }

    mapping(uint256 => Analysis) public analyses;
    mapping(address => uint256[]) public farmerAnalyses;
    uint256 public analysisCounter;

    event PaymentReceived(address indexed farmer, uint256 indexed analysisId, uint256 amount);
    event AnalysisCompleted(uint256 indexed analysisId, string diagnosis, string advice);
    event PriceUpdatedETH(uint256 newPriceETH);
    event PriceUpdatedToken(uint256 newPriceToken);
    event PaymentTokenUpdated(address token);

    constructor() Ownable(msg.sender) {}

    // ETH flow (kept for backward compatibility)
    function requestAnalysis(string memory _imageHash) external payable nonReentrant returns (uint256) {
        require(msg.value >= analysisPriceETH, "Insufficient payment");

        uint256 analysisId = _createAnalysis(_imageHash);
        emit PaymentReceived(msg.sender, analysisId, msg.value);

        // refund excess
        if (msg.value > analysisPriceETH) {
            (bool ok, ) = payable(msg.sender).call{value: msg.value - analysisPriceETH}("");
            require(ok, "Refund failed");
        }
        return analysisId;
    }

    // ERC20 YellowUSD flow
    function requestAnalysisToken(string memory _imageHash) external nonReentrant returns (uint256) {
        require(address(paymentToken) != address(0), "Token not set");
        require(analysisPriceToken > 0, "Token price not set");

        // Pull funds from user (requires prior approve)
        require(paymentToken.transferFrom(msg.sender, address(this), analysisPriceToken), "Token transfer failed");

        uint256 analysisId = _createAnalysis(_imageHash);
        emit PaymentReceived(msg.sender, analysisId, analysisPriceToken);
        return analysisId;
    }

    function _createAnalysis(string memory _imageHash) internal returns (uint256) {
        uint256 analysisId = analysisCounter++;
        analyses[analysisId] = Analysis({
            farmer: msg.sender,
            imageHash: _imageHash,
            diagnosis: "",
            advice: "",
            timestamp: block.timestamp,
            completed: false
        });
        farmerAnalyses[msg.sender].push(analysisId);
        return analysisId;
    }

    // Owner finalizes analysis details (server/relayer)
    function completeAnalysis(
        uint256 _analysisId,
        string memory _diagnosis,
        string memory _advice
    ) external onlyOwner {
        require(_analysisId < analysisCounter, "Analysis does not exist");
        require(!analyses[_analysisId].completed, "Analysis already completed");
        analyses[_analysisId].diagnosis = _diagnosis;
        analyses[_analysisId].advice = _advice;
        analyses[_analysisId].completed = true;
        emit AnalysisCompleted(_analysisId, _diagnosis, _advice);
    }

    // Views
    function getAnalysis(uint256 _analysisId) external view returns (Analysis memory) {
        require(_analysisId < analysisCounter, "Analysis does not exist");
        return analyses[_analysisId];
    }

    function getFarmerAnalyses(address _farmer) external view returns (uint256[] memory) {
        return farmerAnalyses[_farmer];
    }

    // Admin config
    function setPaymentToken(address _token) external onlyOwner {
        paymentToken = IERC20(_token);
        emit PaymentTokenUpdated(_token);
    }

    function setAnalysisPriceETH(uint256 _newPrice) external onlyOwner {
        analysisPriceETH = _newPrice;
        emit PriceUpdatedETH(_newPrice);
    }

    function setAnalysisPriceToken(uint256 _newPrice) external onlyOwner {
        analysisPriceToken = _newPrice;
        emit PriceUpdatedToken(_newPrice);
    }

    // Withdrawals
    function withdrawETH(address payable _to) external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No ETH");
        (bool ok, ) = _to.call{value: balance}("");
        require(ok, "Withdraw failed");
    }

    function withdrawToken(address _to) external onlyOwner nonReentrant {
        require(address(paymentToken) != address(0), "Token not set");
        uint256 bal = paymentToken.balanceOf(address(this));
        require(bal > 0, "No tokens");
        require(paymentToken.transfer(_to, bal), "Token withdraw failed");
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}