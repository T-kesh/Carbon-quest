// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IIdentity {
    function isWhitelisted(address account) external view returns (bool);
}

contract CarbonQuestPool {
    struct Submission {
        uint256 id;
        address proposer;
        string actionType;
        string proofHash; // IPFS CID
        string geoHash;
        uint256 timestamp;
        uint256 disputeDeadline;
        uint256 vouchStake;
        uint256 disputeStake;
        uint256 claimWeight;
        bool resolved;
        bool approved;
        bool claimed;
    }

    struct Season {
        uint256 id;
        uint256 startTime;
        uint256 endTime;
        uint256 totalRewardPool;
        uint256 totalClaimWeight;
        bool ended;
    }

    // GoodDollar Identity contract address
    address public identityContract;
    address public owner;
    
    // Whitelist fallback for testing without full GoodDollar verification on Alfajores
    mapping(address => bool) public manualWhitelist;
    bool public useGoodID = true;

    uint256 public constant DISPUTE_WINDOW = 5 minutes; // 5 mins for demo/testing, can be longer in prod
    uint256 public constant MIN_STAKE = 0.05 ether; // 0.05 CELO/cUSD equivalent

    uint256 public submissionCount;
    mapping(uint256 => Submission) public submissions;
    
    // Track stakes by users: submissionId => user => amount staked
    mapping(uint256 => mapping(address => uint256)) public vouchStakesOfUser;
    mapping(uint256 => mapping(address => uint256)) public disputeStakesOfUser;
    
    // Lists of users who staked to help distribute stakes easily
    mapping(uint256 => address[]) public vouchers;
    mapping(uint256 => address[]) public disputers;

    uint256 public currentSeasonId;
    mapping(uint256 => Season) public seasons;

    // Track user stats
    mapping(address => uint256) public userStreaks;
    mapping(address => uint256) public lastSubmissionTime;
    mapping(address => uint256) public totalEarned;

    event SubmissionCreated(uint256 indexed id, address indexed proposer, string actionType, string proofHash);
    event Vouched(uint256 indexed id, address indexed voter, uint256 amount);
    event Disputed(uint256 indexed id, address indexed voter, uint256 amount);
    event Resolved(uint256 indexed id, bool approved, uint256 winningPoolDistributed);
    event RewardClaimed(uint256 indexed id, address indexed proposer, uint256 reward);
    event SeasonStarted(uint256 indexed seasonId, uint256 startTime, uint256 endTime);
    event SeasonEnded(uint256 indexed seasonId, uint256 finalPool);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyWhitelisted() {
        if (useGoodID && identityContract != address(0)) {
            require(
                IIdentity(identityContract).isWhitelisted(msg.sender) || manualWhitelist[msg.sender],
                "Not GoodID or manual whitelisted"
            );
        } else {
            require(manualWhitelist[msg.sender] || msg.sender == owner, "Not whitelisted");
        }
        _;
    }

    constructor(address _identityContract) {
        owner = msg.sender;
        identityContract = _identityContract;
        manualWhitelist[msg.sender] = true;
        
        // Start Season 1 automatically
        _startSeason(30 days);
    }

    function setUseGoodID(bool _use) external onlyOwner {
        useGoodID = _use;
    }

    function setIdentityContract(address _identity) external onlyOwner {
        identityContract = _identity;
    }

    function setManualWhitelist(address _user, bool _status) external onlyOwner {
        manualWhitelist[_user] = _status;
    }

    function startSeason(uint256 _duration) external onlyOwner {
        // End current season if active
        if (currentSeasonId > 0 && !seasons[currentSeasonId].ended) {
            seasons[currentSeasonId].ended = true;
            emit SeasonEnded(currentSeasonId, seasons[currentSeasonId].totalRewardPool);
        }
        _startSeason(_duration);
    }

    function _startSeason(uint256 _duration) internal {
        currentSeasonId++;
        seasons[currentSeasonId] = Season({
            id: currentSeasonId,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            totalRewardPool: address(this).balance, // current contract balance acts as the pool
            totalClaimWeight: 0,
            ended: false
        });
        emit SeasonStarted(currentSeasonId, block.timestamp, block.timestamp + _duration);
    }

    function fundPool() external payable {
        require(currentSeasonId > 0, "No active season");
        seasons[currentSeasonId].totalRewardPool += msg.value;
    }

    function submitAction(
        string calldata _actionType,
        string calldata _proofHash,
        string calldata _geoHash
    ) external onlyWhitelisted returns (uint256) {
        require(!seasons[currentSeasonId].ended, "Season has ended");
        
        submissionCount++;
        uint256 id = submissionCount;

        // Base action weight: e.g., 100 points
        uint256 weight = 100;
        
        // Apply streak multiplier
        if (lastSubmissionTime[msg.sender] > 0) {
            // If submitted in the last 48 hours, maintain/increase streak
            if (block.timestamp - lastSubmissionTime[msg.sender] <= 48 hours) {
                if (block.timestamp - lastSubmissionTime[msg.sender] >= 20 hours) {
                    userStreaks[msg.sender]++;
                }
            } else {
                userStreaks[msg.sender] = 1; // reset streak
            }
        } else {
            userStreaks[msg.sender] = 1; // start streak
        }
        
        // Streak boost: +10% per streak level, capped at double (200)
        uint256 boost = (userStreaks[msg.sender] > 1) ? (userStreaks[msg.sender] - 1) * 10 : 0;
        if (boost > 100) boost = 100;
        weight = weight + (weight * boost) / 100;

        submissions[id] = Submission({
            id: id,
            proposer: msg.sender,
            actionType: _actionType,
            proofHash: _proofHash,
            geoHash: _geoHash,
            timestamp: block.timestamp,
            disputeDeadline: block.timestamp + DISPUTE_WINDOW,
            vouchStake: 0,
            disputeStake: 0,
            claimWeight: weight,
            resolved: false,
            approved: false,
            claimed: false
        });

        lastSubmissionTime[msg.sender] = block.timestamp;

        emit SubmissionCreated(id, msg.sender, _actionType, _proofHash);
        return id;
    }

    function stakeVouch(uint256 _submissionId) external payable {
        Submission storage sub = submissions[_submissionId];
        require(!sub.resolved, "Already resolved");
        require(block.timestamp < sub.disputeDeadline, "Dispute window closed");
        require(msg.value >= MIN_STAKE, "Stake too low");
        require(msg.sender != sub.proposer, "Proposer cannot vouch");

        if (vouchStakesOfUser[_submissionId][msg.sender] == 0) {
            vouchers[_submissionId].push(msg.sender);
        }
        
        vouchStakesOfUser[_submissionId][msg.sender] += msg.value;
        sub.vouchStake += msg.value;

        emit Vouched(_submissionId, msg.sender, msg.value);
    }

    function stakeDispute(uint256 _submissionId) external payable {
        Submission storage sub = submissions[_submissionId];
        require(!sub.resolved, "Already resolved");
        require(block.timestamp < sub.disputeDeadline, "Dispute window closed");
        require(msg.value >= MIN_STAKE, "Stake too low");
        require(msg.sender != sub.proposer, "Proposer cannot dispute");

        if (disputeStakesOfUser[_submissionId][msg.sender] == 0) {
            disputers[_submissionId].push(msg.sender);
        }

        disputeStakesOfUser[_submissionId][msg.sender] += msg.value;
        sub.disputeStake += msg.value;

        emit Disputed(_submissionId, msg.sender, msg.value);
    }

    function resolveSubmission(uint256 _submissionId) external {
        Submission storage sub = submissions[_submissionId];
        require(!sub.resolved, "Already resolved");
        require(block.timestamp >= sub.disputeDeadline, "Dispute window still open");

        sub.resolved = true;

        // Auto-approves if no disputes, or if vouches >= disputes
        if (sub.disputeStake == 0 || sub.vouchStake >= sub.disputeStake) {
            sub.approved = true;
            
            // Add weight to current season pool
            seasons[currentSeasonId].totalClaimWeight += sub.claimWeight;

            // Distribute losing side's stake to winning vouchers
            if (sub.disputeStake > 0 && sub.vouchStake > 0) {
                uint256 totalSlash = sub.disputeStake;
                address[] memory vList = vouchers[_submissionId];
                for (uint256 i = 0; i < vList.length; i++) {
                    address voucher = vList[i];
                    uint256 userStake = vouchStakesOfUser[_submissionId][voucher];
                    uint256 reward = userStake + (userStake * totalSlash) / sub.vouchStake;
                    payable(voucher).transfer(reward);
                }
            } else if (sub.vouchStake > 0) {
                // Return vouches if no disputes
                address[] memory vList = vouchers[_submissionId];
                for (uint256 i = 0; i < vList.length; i++) {
                    payable(vList[i]).transfer(vouchStakesOfUser[_submissionId][vList[i]]);
                }
            }
            emit Resolved(_submissionId, true, sub.disputeStake);
        } else {
            // Rejected
            sub.approved = false;
            // Reset proposer's streak
            userStreaks[sub.proposer] = 0;

            // Distribute losing side's stake (which includes proposer's potential future payout, but here it's just vouches)
            // plus we can slash proposer if we wanted, but standard game is vouchers lose stake to disputers
            if (sub.disputeStake > 0 && sub.vouchStake > 0) {
                uint256 totalSlash = sub.vouchStake;
                address[] memory dList = disputers[_submissionId];
                for (uint256 i = 0; i < dList.length; i++) {
                    address disputer = dList[i];
                    uint256 userStake = disputeStakesOfUser[_submissionId][disputer];
                    uint256 reward = userStake + (userStake * totalSlash) / sub.disputeStake;
                    payable(disputer).transfer(reward);
                }
            } else if (sub.disputeStake > 0) {
                // Return disputes if no vouches
                address[] memory dList = disputers[_submissionId];
                for (uint256 i = 0; i < dList.length; i++) {
                    payable(dList[i]).transfer(disputeStakesOfUser[_submissionId][dList[i]]);
                }
            }
            emit Resolved(_submissionId, false, sub.vouchStake);
        }
    }

    function claimReward(uint256 _submissionId) external {
        Submission storage sub = submissions[_submissionId];
        require(sub.resolved, "Not resolved yet");
        require(sub.approved, "Submission not approved");
        require(!sub.claimed, "Reward already claimed");
        require(msg.sender == sub.proposer, "Only proposer can claim");

        Season storage season = seasons[currentSeasonId];
        require(season.totalClaimWeight > 0, "No claim weight in season");
        
        sub.claimed = true;

        // Calculate share of the pool: (sub.claimWeight / season.totalClaimWeight) * rewardPool
        uint256 reward = (sub.claimWeight * season.totalRewardPool) / season.totalClaimWeight;
        
        // Ensure contract has enough funds
        if (reward > address(this).balance) {
            reward = address(this).balance;
        }

        totalEarned[msg.sender] += reward;
        payable(sub.proposer).transfer(reward);

        emit RewardClaimed(_submissionId, msg.sender, reward);
    }

    // Helper functions for UI views
    function getVouchers(uint256 _submissionId) external view returns (address[] memory) {
        return vouchers[_submissionId];
    }

    function getDisputers(uint256 _submissionId) external view returns (address[] memory) {
        return disputers[_submissionId];
    }
}
