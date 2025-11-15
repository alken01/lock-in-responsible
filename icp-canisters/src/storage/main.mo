// Storage Canister for Lock-In Responsible
// Stores goal descriptions and proof submissions on ICP
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Blob "mo:base/Blob";
import Time "mo:base/Time";
import Array "mo:base/Array";
import Principal "mo:base/Principal";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import Hash "mo:base/Hash";

actor Storage {
  // Types
  type GoalData = {
    goalId: Nat;
    userId: Principal;
    ethAddress: Text;     // Ethereum address of goal creator
    title: Text;
    description: Text;
    goalType: Text;       // "custom", "github_commits", "fitness", etc.
    target: Nat;
    createdAt: Time.Time;
  };

  type ProofData = {
    proofId: Text;
    goalId: Nat;
    userId: Principal;
    proofText: Text;
    imageHashes: [Text];  // IPFS hashes or base64 data
    timestamp: Time.Time;
  };

  type ValidationReasoning = {
    validationId: Nat;
    validator: Text;      // Validator's Ethereum or ICP address
    approved: Bool;
    confidence: Nat8;     // 0-100
    reasoning: Text;
    timestamp: Time.Time;
    llmModel: Text;
  };

  // Stable storage (survives upgrades)
  stable var goalCounter: Nat = 0;
  stable var proofCounter: Nat = 0;
  stable var reasoningCounter: Nat = 0;

  // HashMaps for quick lookup
  let goals = HashMap.HashMap<Nat, GoalData>(100, Nat.equal, Hash.hash);
  let proofs = HashMap.HashMap<Text, ProofData>(100, Text.equal, Text.hash);
  let validationReasonings = HashMap.HashMap<Nat, ValidationReasoning>(100, Nat.equal, Hash.hash);

  // Index: user -> goal IDs
  let userGoals = HashMap.HashMap<Principal, Buffer.Buffer<Nat>>(50, Principal.equal, Principal.hash);

  // Index: goal ID -> proof IDs
  let goalProofs = HashMap.HashMap<Nat, Buffer.Buffer<Text>>(100, Nat.equal, Hash.hash);

  /**
   * Store goal data
   */
  public shared(msg) func storeGoal(
    goalId: Nat,
    ethAddress: Text,
    title: Text,
    description: Text,
    goalType: Text,
    target: Nat
  ) : async Nat {
    let goal: GoalData = {
      goalId = goalId;
      userId = msg.caller;
      ethAddress = ethAddress;
      title = title;
      description = description;
      goalType = goalType;
      target = target;
      createdAt = Time.now();
    };

    goals.put(goalId, goal);

    // Update user index
    switch (userGoals.get(msg.caller)) {
      case null {
        let buffer = Buffer.Buffer<Nat>(10);
        buffer.add(goalId);
        userGoals.put(msg.caller, buffer);
      };
      case (?buffer) {
        buffer.add(goalId);
      };
    };

    goalCounter := goalId + 1;
    return goalId;
  };

  /**
   * Get goal data
   */
  public query func getGoal(goalId: Nat) : async ?GoalData {
    goals.get(goalId)
  };

  /**
   * Store proof submission
   */
  public shared(msg) func storeProof(
    goalId: Nat,
    proofText: Text,
    imageHashes: [Text]
  ) : async Text {
    proofCounter += 1;
    let proofId = Nat.toText(proofCounter);

    let proof: ProofData = {
      proofId = proofId;
      goalId = goalId;
      userId = msg.caller;
      proofText = proofText;
      imageHashes = imageHashes;
      timestamp = Time.now();
    };

    proofs.put(proofId, proof);

    // Update goal -> proofs index
    switch (goalProofs.get(goalId)) {
      case null {
        let buffer = Buffer.Buffer<Text>(5);
        buffer.add(proofId);
        goalProofs.put(goalId, buffer);
      };
      case (?buffer) {
        buffer.add(proofId);
      };
    };

    return proofId;
  };

  /**
   * Get proof data
   */
  public query func getProof(proofId: Text) : async ?ProofData {
    proofs.get(proofId)
  };

  /**
   * Get all proofs for a goal
   */
  public query func getProofsByGoal(goalId: Nat) : async [ProofData] {
    switch (goalProofs.get(goalId)) {
      case null { [] };
      case (?buffer) {
        let proofIds = Buffer.toArray(buffer);
        let results = Buffer.Buffer<ProofData>(proofIds.size());

        for (proofId in proofIds.vals()) {
          switch (proofs.get(proofId)) {
            case (?proof) { results.add(proof); };
            case null {};
          };
        };

        Buffer.toArray(results)
      };
    };
  };

  /**
   * Store validation reasoning (from validator)
   */
  public func storeValidationReasoning(
    validationId: Nat,
    validator: Text,
    approved: Bool,
    confidence: Nat8,
    reasoning: Text,
    llmModel: Text
  ) : async Nat {
    let reasoningData: ValidationReasoning = {
      validationId = validationId;
      validator = validator;
      approved = approved;
      confidence = confidence;
      reasoning = reasoning;
      timestamp = Time.now();
      llmModel = llmModel;
    };

    reasoningCounter += 1;
    validationReasonings.put(reasoningCounter, reasoningData);

    return reasoningCounter;
  };

  /**
   * Get validation reasoning
   */
  public query func getValidationReasoning(reasoningId: Nat) : async ?ValidationReasoning {
    validationReasonings.get(reasoningId)
  };

  /**
   * Get all goals for a user
   */
  public query func getUserGoals(user: Principal) : async [GoalData] {
    switch (userGoals.get(user)) {
      case null { [] };
      case (?buffer) {
        let goalIds = Buffer.toArray(buffer);
        let results = Buffer.Buffer<GoalData>(goalIds.size());

        for (goalId in goalIds.vals()) {
          switch (goals.get(goalId)) {
            case (?goal) { results.add(goal); };
            case null {};
          };
        };

        Buffer.toArray(results)
      };
    };
  };

  /**
   * Get storage stats
   */
  public query func getStats() : async {
    totalGoals: Nat;
    totalProofs: Nat;
    totalValidations: Nat;
  } {
    {
      totalGoals = goalCounter;
      totalProofs = proofCounter;
      totalValidations = reasoningCounter;
    }
  };

  /**
   * Get canister cycles balance (for monitoring)
   */
  public query func getCyclesBalance() : async Nat {
    return Cycles.balance();
  };

  // System functions for upgrades
  system func preupgrade() {
    // Storage is already stable
  };

  system func postupgrade() {
    // Restore state if needed
  };
}
