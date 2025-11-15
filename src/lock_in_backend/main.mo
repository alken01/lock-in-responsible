import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Buffer "mo:base/Buffer";

actor LockInResponsible {

  // Types
  type UserId = Principal;
  type GoalId = Nat;
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
    #Completed;
    #Failed;
    #Verified;
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

  // State
  private stable var nextGoalId: Nat = 0;
  private var goals = HashMap.HashMap<GoalId, Goal>(0, Nat.equal, Hash.hash);
  private var userGoals = HashMap.HashMap<UserId, [GoalId]>(0, Principal.equal, Principal.hash);
  private var userTokens = HashMap.HashMap<UserId, Nat>(0, Principal.equal, Principal.hash);
  private var userStats = HashMap.HashMap<UserId, UserStats>(0, Principal.equal, Principal.hash);

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
    goals := HashMap.fromIter<GoalId, Goal>(goalsEntries.vals(), 0, Nat.equal, Hash.hash);
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

        // Update goal with proof
        let updatedGoal = {
          id = goal.id;
          userId = goal.userId;
          title = goal.title;
          description = goal.description;
          goalType = goal.goalType;
          deadline = goal.deadline;
          createdAt = goal.createdAt;
          status = #Completed;
          proof = ?proof;
          tokensReward = goal.tokensReward;
        };
        goals.put(goalId, updatedGoal);

        // Award tokens!
        let currentTokens = Option.get(userTokens.get(caller), 0);
        userTokens.put(caller, currentTokens + goal.tokensReward);

        // Update stats
        let stats = getOrCreateUserStats(caller);
        let newStreak = stats.currentStreak + 1;
        let updatedStats = {
          totalGoals = stats.totalGoals;
          completedGoals = stats.completedGoals + 1;
          failedGoals = stats.failedGoals;
          currentStreak = newStreak;
          longestStreak = if (newStreak > stats.longestStreak) { newStreak } else { stats.longestStreak };
          totalTokens = currentTokens + goal.tokensReward;
        };
        userStats.put(caller, updatedStats);

        true
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
    version: Text;
  } {
    {
      totalGoals = nextGoalId;
      totalUsers = userStats.size();
      version = "1.0.0";
    }
  };
}
