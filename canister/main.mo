import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Buffer "mo:base/Buffer";

persistent actor LockInResponsible {

  // Types
  type UserId = Principal;
  type GoalId = Nat;
  type ValidatorId = Principal;
  type VerificationRequestId = Nat;
  type Timestamp = Int;

  type GoalType = {
    #Custom;
    #Coding;
    #Fitness;
    #Study;
    #Work;
  };

  type GoalStatus = {
    #Pending;
    #InReview;
    #Completed;
    #Failed;
    #Verified;
  };

  // Validator Types
  type Validator = {
    id: ValidatorId;
    stake: Nat;
    reputation: Int;
    totalVotes: Nat;
    correctVotes: Nat;
    registeredAt: Timestamp;
    isActive: Bool;
  };

  type Verdict = {
    validator: ValidatorId;
    verified: Bool;
    confidence: Nat;
    reasoning: Text;
    timestamp: Timestamp;
  };

  type VerificationStatus = {
    #Pending;
    #Complete;
    #Failed;
  };

  type VerificationRequest = {
    id: VerificationRequestId;
    goalId: GoalId;
    userId: UserId;
    proofText: Text;
    proofUrl: ?Text;
    fee: Nat;
    validators: [ValidatorId];
    verdicts: [Verdict];
    status: VerificationStatus;
    createdAt: Timestamp;
    deadline: Timestamp;
  };

  type Goal = {
    id: GoalId;
    userId: UserId;
    title: Text;
    description: Text;
    goalType: GoalType;
    deadline: Timestamp;
    createdAt: Timestamp;
    status: GoalStatus;
    proof: ?Text;
    tokensReward: Nat;
  };

  type UserStats = {
    totalGoals: Nat;
    completedGoals: Nat;
    failedGoals: Nat;
    currentStreak: Nat;
    longestStreak: Nat;
    totalTokens: Nat;
  };

  // Custom hash function for Nat
  private func natHash(n : Nat) : Hash.Hash {
    var hash : Nat32 = 0;
    var value = n;
    while (value > 0) {
      hash := hash +% Nat32.fromNat(value % 256);
      value := value / 256;
    };
    hash
  };

  // State
  private stable var nextGoalId: Nat = 0;
  private stable var nextVerificationRequestId: Nat = 0;
  private transient var goals = HashMap.HashMap<GoalId, Goal>(0, Nat.equal, natHash);
  private transient var userGoals = HashMap.HashMap<UserId, [GoalId]>(0, Principal.equal, Principal.hash);
  private transient var userTokens = HashMap.HashMap<UserId, Nat>(0, Principal.equal, Principal.hash);
  private transient var userStats = HashMap.HashMap<UserId, UserStats>(0, Principal.equal, Principal.hash);

  // Validator State
  private transient var validators = HashMap.HashMap<ValidatorId, Validator>(0, Principal.equal, Principal.hash);
  private transient var verificationRequests = HashMap.HashMap<VerificationRequestId, VerificationRequest>(0, Nat.equal, natHash);
  private transient var activeValidators = Buffer.Buffer<ValidatorId>(0);

  // Stable storage for upgrades
  private stable var goalsEntries : [(GoalId, Goal)] = [];
  private stable var userGoalsEntries : [(UserId, [GoalId])] = [];
  private stable var userTokensEntries : [(UserId, Nat)] = [];
  private stable var userStatsEntries : [(UserId, UserStats)] = [];

  system func preupgrade() {
    goalsEntries := Iter.toArray(goals.entries());
    userGoalsEntries := Iter.toArray(userGoals.entries());
    userTokensEntries := Iter.toArray(userTokens.entries());
    userStatsEntries := Iter.toArray(userStats.entries());
  };

  system func postupgrade() {
    goals := HashMap.fromIter<GoalId, Goal>(goalsEntries.vals(), 0, Nat.equal, natHash);
    userGoals := HashMap.fromIter<UserId, [GoalId]>(userGoalsEntries.vals(), 0, Principal.equal, Principal.hash);
    userTokens := HashMap.fromIter<UserId, Nat>(userTokensEntries.vals(), 0, Principal.equal, Principal.hash);
    userStats := HashMap.fromIter<UserId, UserStats>(userStatsEntries.vals(), 0, Principal.equal, Principal.hash);
    goalsEntries := [];
    userGoalsEntries := [];
    userTokensEntries := [];
    userStatsEntries := [];
  };

  // Helper: Get or create user stats
  private func getOrCreateUserStats(userId: UserId) : UserStats {
    switch (userStats.get(userId)) {
      case (?stats) { stats };
      case null {
        let newStats = {
          totalGoals = 0;
          completedGoals = 0;
          failedGoals = 0;
          currentStreak = 0;
          longestStreak = 0;
          totalTokens = 0;
        };
        userStats.put(userId, newStats);
        newStats
      };
    }
  };

  // Helper: Count eligible validators
  private func getEligibleValidatorsCount() : Nat {
    var count = 0;
    for ((userId, stats) in userStats.entries()) {
      if (stats.completedGoals > 0) {
        count += 1;
      };
    };
    count
  };

  // Create a new goal (on-chain storage!)
  public shared(msg) func createGoal(
    title: Text,
    description: Text,
    goalType: GoalType,
    deadline: Timestamp
  ) : async GoalId {
    let caller = msg.caller;
    let goalId = nextGoalId;
    nextGoalId += 1;

    let goal : Goal = {
      id = goalId;
      userId = caller;
      title = title;
      description = description;
      goalType = goalType;
      deadline = deadline;
      createdAt = Time.now();
      status = #Pending;
      proof = null;
      tokensReward = 10; // Base reward
    };

    goals.put(goalId, goal);

    // Update user's goal list
    let userGoalIds = switch (userGoals.get(caller)) {
      case (?ids) { Array.append(ids, [goalId]) };
      case null { [goalId] };
    };
    userGoals.put(caller, userGoalIds);

    // Update stats
    let stats = getOrCreateUserStats(caller);
    let updatedStats = {
      totalGoals = stats.totalGoals + 1;
      completedGoals = stats.completedGoals;
      failedGoals = stats.failedGoals;
      currentStreak = stats.currentStreak;
      longestStreak = stats.longestStreak;
      totalTokens = stats.totalTokens;
    };
    userStats.put(caller, updatedStats);

    goalId
  };

  // Submit proof for goal completion
  public shared(msg) func submitProof(goalId: GoalId, proof: Text) : async Bool {
    let caller = msg.caller;

    switch (goals.get(goalId)) {
      case (?goal) {
        // Verify ownership
        if (goal.userId != caller) {
          return false;
        };

        // Check if there are any eligible validators
        let eligibleValidators = getEligibleValidatorsCount();

        // If no validators exist, auto-approve the goal
        if (eligibleValidators == 0) {
          let updatedGoal = {
            id = goal.id;
            userId = goal.userId;
            title = goal.title;
            description = goal.description;
            goalType = goal.goalType;
            deadline = goal.deadline;
            createdAt = goal.createdAt;
            status = #Completed; // Auto-approve when no validators
            proof = ?proof;
            tokensReward = goal.tokensReward;
          };
          goals.put(goalId, updatedGoal);

          // Award tokens
          let currentTokens = Option.get(userTokens.get(goal.userId), 0);
          userTokens.put(goal.userId, currentTokens + goal.tokensReward);

          // Update user stats
          let stats = getOrCreateUserStats(goal.userId);
          let newStreak = stats.currentStreak + 1;
          let updatedStats = {
            totalGoals = stats.totalGoals;
            completedGoals = stats.completedGoals + 1;
            failedGoals = stats.failedGoals;
            currentStreak = newStreak;
            longestStreak = if (newStreak > stats.longestStreak) { newStreak } else { stats.longestStreak };
            totalTokens = currentTokens + goal.tokensReward;
          };
          userStats.put(goal.userId, updatedStats);

          return true;
        };

        // Create verification request if validators exist
        let verificationResult = await createVerificationRequest(goalId, proof, null);

        switch (verificationResult) {
          case (?requestId) {
            // Update goal status to in review
            let updatedGoal = {
              id = goal.id;
              userId = goal.userId;
              title = goal.title;
              description = goal.description;
              goalType = goal.goalType;
              deadline = goal.deadline;
              createdAt = goal.createdAt;
              status = #InReview; // Set to InReview while being validated
              proof = ?proof;
              tokensReward = goal.tokensReward;
            };
            goals.put(goalId, updatedGoal);
            true
          };
          case null { false };
        }
      };
      case null { false };
    }
  };

  // Mark goal as failed
  public shared(msg) func failGoal(goalId: GoalId) : async Bool {
    let caller = msg.caller;

    switch (goals.get(goalId)) {
      case (?goal) {
        if (goal.userId != caller) {
          return false;
        };

        let updatedGoal = {
          id = goal.id;
          userId = goal.userId;
          title = goal.title;
          description = goal.description;
          goalType = goal.goalType;
          deadline = goal.deadline;
          createdAt = goal.createdAt;
          status = #Failed;
          proof = goal.proof;
          tokensReward = goal.tokensReward;
        };
        goals.put(goalId, updatedGoal);

        // Reset streak
        let stats = getOrCreateUserStats(caller);
        let updatedStats = {
          totalGoals = stats.totalGoals;
          completedGoals = stats.completedGoals;
          failedGoals = stats.failedGoals + 1;
          currentStreak = 0;
          longestStreak = stats.longestStreak;
          totalTokens = stats.totalTokens;
        };
        userStats.put(caller, updatedStats);

        true
      };
      case null { false };
    }
  };

  // Get user's goals
  public query(msg) func getMyGoals() : async [Goal] {
    let caller = msg.caller;

    switch (userGoals.get(caller)) {
      case (?goalIds) {
        let buffer = Buffer.Buffer<Goal>(goalIds.size());
        for (goalId in goalIds.vals()) {
          switch (goals.get(goalId)) {
            case (?goal) { buffer.add(goal) };
            case null {};
          };
        };
        Buffer.toArray(buffer)
      };
      case null { [] };
    }
  };

  // Get all public goals from all users
  public query func getAllGoals() : async [Goal] {
    let buffer = Buffer.Buffer<Goal>(goals.size());
    for ((_, goal) in goals.entries()) {
      buffer.add(goal);
    };
    Buffer.toArray(buffer)
  };

  // Get all goals that are in review (for validation)
  public query func getGoalsInReview() : async [Goal] {
    let buffer = Buffer.Buffer<Goal>(goals.size());
    for ((_, goal) in goals.entries()) {
      if (goal.status == #InReview) {
        buffer.add(goal);
      };
    };
    Buffer.toArray(buffer)
  };

  // Get goals for a specific user
  public query func getUserGoals(userId: UserId) : async [Goal] {
    switch (userGoals.get(userId)) {
      case (?goalIds) {
        let buffer = Buffer.Buffer<Goal>(goalIds.size());
        for (goalId in goalIds.vals()) {
          switch (goals.get(goalId)) {
            case (?goal) { buffer.add(goal) };
            case null {};
          };
        };
        Buffer.toArray(buffer)
      };
      case null { [] };
    }
  };

  // Get specific goal
  public query func getGoal(goalId: GoalId) : async ?Goal {
    goals.get(goalId)
  };

  // Get user's token balance
  public query(msg) func getMyTokens() : async Nat {
    let caller = msg.caller;
    Option.get(userTokens.get(caller), 0)
  };

  // Get user stats
  public query(msg) func getMyStats() : async UserStats {
    let caller = msg.caller;
    getOrCreateUserStats(caller)
  };

  // Get all users token balances (leaderboard)
  public query func getLeaderboard() : async [(Principal, Nat)] {
    Iter.toArray(userTokens.entries())
  };

  // Admin: Verify goal manually
  public shared(msg) func verifyGoal(goalId: GoalId) : async Bool {
    switch (goals.get(goalId)) {
      case (?goal) {
        let updatedGoal = {
          id = goal.id;
          userId = goal.userId;
          title = goal.title;
          description = goal.description;
          goalType = goal.goalType;
          deadline = goal.deadline;
          createdAt = goal.createdAt;
          status = #Verified;
          proof = goal.proof;
          tokensReward = goal.tokensReward;
        };
        goals.put(goalId, updatedGoal);
        true
      };
      case null { false };
    }
  };

  // Health check
  public query func healthCheck() : async Bool {
    true
  };

  // Get canister info
  public query func getInfo() : async {
    totalGoals: Nat;
    totalUsers: Nat;
    totalValidators: Nat;
    version: Text;
  } {
    {
      totalGoals = nextGoalId;
      totalUsers = userStats.size();
      totalValidators = validators.size();
      version = "2.0.0-validator";
    }
  };

  // ===== VALIDATOR NETWORK FUNCTIONS =====

  // Register as a validator
  public shared(msg) func registerValidator(stake: Nat) : async Bool {
    let caller = msg.caller;

    // Check minimum stake (100 tokens)
    if (stake < 100_000_000) {
      return false;
    };

    let validator : Validator = {
      id = caller;
      stake = stake;
      reputation = 0;
      totalVotes = 0;
      correctVotes = 0;
      registeredAt = Time.now();
      isActive = true;
    };

    validators.put(caller, validator);
    activeValidators.add(caller);

    true
  };

  // Create verification request
  public shared(msg) func createVerificationRequest(
    goalId: GoalId,
    proofText: Text,
    proofUrl: ?Text
  ) : async ?VerificationRequestId {
    let caller = msg.caller;

    // Verify goal exists and belongs to caller
    switch (goals.get(goalId)) {
      case (?goal) {
        if (goal.userId != caller) {
          return null;
        };

        // Select 5 random validators
        let selectedValidators = selectRandomValidators(5);

        let requestId = nextVerificationRequestId;
        nextVerificationRequestId += 1;

        let request : VerificationRequest = {
          id = requestId;
          goalId = goalId;
          userId = caller;
          proofText = proofText;
          proofUrl = proofUrl;
          fee = 50_000_000; // 0.50 tokens
          validators = selectedValidators;
          verdicts = [];
          status = #Pending;
          createdAt = Time.now();
          deadline = Time.now() + 300_000_000_000; // 5 minutes
        };

        verificationRequests.put(requestId, request);

        ?requestId
      };
      case null { null };
    }
  };

  // Submit verdict (called by validators)
  public shared(msg) func submitVerdict(
    requestId: VerificationRequestId,
    verified: Bool,
    confidence: Nat,
    reasoning: Text
  ) : async Bool {
    let caller = msg.caller;

    switch (verificationRequests.get(requestId)) {
      case (?request) {
        // Verify caller is a selected validator
        let isValidator = Array.find<ValidatorId>(request.validators, func(v) { v == caller });
        if (isValidator == null) {
          return false;
        };

        // Check if already submitted
        let hasSubmitted = Array.find<Verdict>(request.verdicts, func(v) { v.validator == caller });
        if (hasSubmitted != null) {
          return false;
        };

        // Add verdict
        let verdict : Verdict = {
          validator = caller;
          verified = verified;
          confidence = confidence;
          reasoning = reasoning;
          timestamp = Time.now();
        };

        let updatedRequest = {
          id = request.id;
          goalId = request.goalId;
          userId = request.userId;
          proofText = request.proofText;
          proofUrl = request.proofUrl;
          fee = request.fee;
          validators = request.validators;
          verdicts = Array.append(request.verdicts, [verdict]);
          status = request.status;
          createdAt = request.createdAt;
          deadline = request.deadline;
        };

        verificationRequests.put(requestId, updatedRequest);

        // Calculate consensus when all validators have voted or we have enough votes
        let totalValidators = updatedRequest.validators.size();
        let requiredVotes = if (totalValidators >= 5) { 3 } else { (totalValidators + 1) / 2 };

        if (updatedRequest.verdicts.size() >= totalValidators or updatedRequest.verdicts.size() >= requiredVotes) {
          ignore calculateConsensus(requestId);
        };

        true
      };
      case null { false };
    }
  };

  // Get pending verification requests (for users to vote on)
  public query(msg) func getPendingRequests() : async [VerificationRequest] {
    let caller = msg.caller;

    let buffer = Buffer.Buffer<VerificationRequest>(0);
    for ((_, request) in verificationRequests.entries()) {
      if (request.status == #Pending) {
        // Check if caller is a selected validator for this request
        if (Array.find<ValidatorId>(request.validators, func(v) { v == caller }) != null) {
          // Check if caller hasn't voted yet
          let hasVoted = Array.find<Verdict>(request.verdicts, func(verdict) { verdict.validator == caller });
          if (hasVoted == null) {
            buffer.add(request);
          };
        };
      };
    };
    Buffer.toArray(buffer)
  };

  // Calculate consensus and distribute rewards
  private func calculateConsensus(requestId: VerificationRequestId) : async () {
    switch (verificationRequests.get(requestId)) {
      case (?request) {
        // Count verified votes
        var verifiedCount = 0;
        for (verdict in request.verdicts.vals()) {
          if (verdict.verified) {
            verifiedCount += 1;
          };
        };

        // Calculate required votes based on validator count
        let totalValidators = request.validators.size();
        let requiredVotes = if (totalValidators >= 5) {
          3 // At least 3/5 if we have 5 validators
        } else {
          // More than (n-1)/2 for fewer validators
          (totalValidators + 1) / 2 // This gives us ceiling of n/2
        };

        let majority = verifiedCount >= requiredVotes;

        // Update validators and distribute rewards
        let rewardPerValidator = request.fee / request.verdicts.size();

        for (verdict in request.verdicts.vals()) {
          switch (validators.get(verdict.validator)) {
            case (?validator) {
              // Check if vote matches majority
              let isCorrect = verdict.verified == majority;

              let updatedValidator = {
                id = validator.id;
                stake = validator.stake;
                reputation = if (isCorrect) { validator.reputation + 1 } else { validator.reputation - 1 };
                totalVotes = validator.totalVotes + 1;
                correctVotes = if (isCorrect) { validator.correctVotes + 1 } else { validator.correctVotes };
                registeredAt = validator.registeredAt;
                isActive = validator.isActive;
              };

              validators.put(verdict.validator, updatedValidator);

              // Pay validator if correct
              if (isCorrect) {
                let currentBalance = Option.get(userTokens.get(verdict.validator), 0);
                userTokens.put(verdict.validator, currentBalance + rewardPerValidator);
              };
            };
            case null {};
          };
        };

        // Mark goal as verified if majority approved, or failed if rejected
        if (majority) {
          // Update goal status to completed
          switch (goals.get(request.goalId)) {
            case (?goal) {
              let updatedGoal = {
                id = goal.id;
                userId = goal.userId;
                title = goal.title;
                description = goal.description;
                goalType = goal.goalType;
                deadline = goal.deadline;
                createdAt = goal.createdAt;
                status = #Completed;
                proof = ?request.proofText;
                tokensReward = goal.tokensReward;
              };
              goals.put(request.goalId, updatedGoal);

              // Award tokens
              let currentTokens = Option.get(userTokens.get(goal.userId), 0);
              userTokens.put(goal.userId, currentTokens + goal.tokensReward);

              // Update user stats
              let stats = getOrCreateUserStats(goal.userId);
              let newStreak = stats.currentStreak + 1;
              let updatedStats = {
                totalGoals = stats.totalGoals;
                completedGoals = stats.completedGoals + 1;
                failedGoals = stats.failedGoals;
                currentStreak = newStreak;
                longestStreak = if (newStreak > stats.longestStreak) { newStreak } else { stats.longestStreak };
                totalTokens = currentTokens + goal.tokensReward;
              };
              userStats.put(goal.userId, updatedStats);
            };
            case null {};
          };
        } else {
          // Majority rejected - mark goal as failed
          switch (goals.get(request.goalId)) {
            case (?goal) {
              let updatedGoal = {
                id = goal.id;
                userId = goal.userId;
                title = goal.title;
                description = goal.description;
                goalType = goal.goalType;
                deadline = goal.deadline;
                createdAt = goal.createdAt;
                status = #Failed;
                proof = ?request.proofText;
                tokensReward = goal.tokensReward;
              };
              goals.put(request.goalId, updatedGoal);

              // Reset streak
              let stats = getOrCreateUserStats(goal.userId);
              let updatedStats = {
                totalGoals = stats.totalGoals;
                completedGoals = stats.completedGoals;
                failedGoals = stats.failedGoals + 1;
                currentStreak = 0;
                longestStreak = stats.longestStreak;
                totalTokens = stats.totalTokens;
              };
              userStats.put(goal.userId, updatedStats);
            };
            case null {};
          };
        };

        // Mark request as complete
        let updatedRequest = {
          id = request.id;
          goalId = request.goalId;
          userId = request.userId;
          proofText = request.proofText;
          proofUrl = request.proofUrl;
          fee = request.fee;
          validators = request.validators;
          verdicts = request.verdicts;
          status = #Complete;
          createdAt = request.createdAt;
          deadline = request.deadline;
        };

        verificationRequests.put(requestId, updatedRequest);
      };
      case null {};
    }
  };

  // Helper: Select random validators from users who have submitted proofs
  private func selectRandomValidators(count: Nat) : [ValidatorId] {
    // Get all users who have completed at least one goal
    let eligibleUsers = Buffer.Buffer<ValidatorId>(0);

    for ((userId, stats) in userStats.entries()) {
      if (stats.completedGoals > 0) {
        eligibleUsers.add(userId);
      };
    };

    let available = Buffer.toArray(eligibleUsers);

    if (available.size() <= count) {
      return available;
    };

    // Simple random selection (in production, use better randomness)
    let selected = Buffer.Buffer<ValidatorId>(count);
    var i = 0;
    while (i < count and i < available.size()) {
      selected.add(available[i]);
      i += 1;
    };

    Buffer.toArray(selected)
  };
}
