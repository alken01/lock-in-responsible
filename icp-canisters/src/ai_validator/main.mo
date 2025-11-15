// AI Validator Canister for Lock-In Responsible
// Performs AI-based validation of proof submissions using HTTPS outcalls
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Cycles "mo:base/ExperimentalCycles";
import Time "mo:base/Time";
import Debug "mo:base/Debug";
import Nat8 "mo:base/Nat8";
import Nat "mo:base/Nat";

actor AIValidator {
  // Types
  type ValidationResult = {
    approved: Bool;
    confidence: Nat8;      // 0-100
    reasoning: Text;
    manipulationDetected: Bool;
  };

  type GoalData = {
    title: Text;
    description: Text;
    goalType: Text;
  };

  type ProofData = {
    proofText: Text;
    imageHashes: [Text];
  };

  // Configuration
  stable var openaiApiKey: Text = "";
  stable var anthropicApiKey: Text = "";
  stable var defaultProvider: Text = "openai"; // "openai" or "anthropic"

  // Stats
  stable var totalValidations: Nat = 0;
  stable var approvedCount: Nat = 0;
  stable var rejectedCount: Nat = 0;

  /**
   * Set API keys (only owner can call)
   */
  public shared(msg) func setApiKeys(
    openai: Text,
    anthropic: Text,
    provider: Text
  ) : async () {
    // TODO: Add proper access control
    openaiApiKey := openai;
    anthropicApiKey := anthropic;
    defaultProvider := provider;
  };

  /**
   * Validate proof using AI
   * Uses HTTPS outcalls to call external LLM APIs
   */
  public func validateProof(
    goal: GoalData,
    proof: ProofData
  ) : async ValidationResult {
    // Increment counter
    totalValidations += 1;

    // Build prompt
    let prompt = buildPrompt(goal, proof);

    // Call LLM based on provider
    let result = if (defaultProvider == "anthropic") {
      await callAnthropic(prompt)
    } else {
      await callOpenAI(prompt)
    };

    // Update stats
    if (result.approved) {
      approvedCount += 1;
    } else {
      rejectedCount += 1;
    };

    return result;
  };

  /**
   * Build validation prompt
   */
  func buildPrompt(goal: GoalData, proof: ProofData) : Text {
    let prompt = "You are an objective validator in a decentralized accountability network.\n" #
                 "Your role is to verify if submitted proof demonstrates completion of a goal.\n\n" #
                 "GOAL:\n" #
                 "Title: " # goal.title # "\n" #
                 "Description: " # goal.description # "\n" #
                 "Type: " # goal.goalType # "\n\n" #
                 "USER'S PROOF:\n" #
                 proof.proofText # "\n\n" #
                 "TASK: Analyze if this proof genuinely demonstrates goal completion.\n" #
                 "Respond in JSON format:\n" #
                 "{\n" #
                 "  \"approved\": true/false,\n" #
                 "  \"confidence\": 0-100,\n" #
                 "  \"reasoning\": \"your explanation\",\n" #
                 "  \"manipulation_detected\": true/false\n" #
                 "}";

    return prompt;
  };

  /**
   * Call OpenAI API using HTTPS outcalls
   */
  func callOpenAI(prompt: Text) : async ValidationResult {
    // Note: This is a simplified version
    // In production, use the HTTPS outcalls canister feature

    // Construct request body
    let requestBody = "{" #
      "\"model\": \"gpt-4o-mini\"," #
      "\"messages\": [{" #
        "\"role\": \"user\"," #
        "\"content\": \"" # escapeJson(prompt) # "\"" #
      "}]," #
      "\"response_format\": {\"type\": \"json_object\"}," #
      "\"max_tokens\": 500" #
    "}";

    // In real implementation, use management canister's http_request
    // For now, return a mock result for compilation

    // TODO: Implement actual HTTPS outcall
    // let ic : IC.Self = actor "aaaaa-aa";
    // let response = await ic.http_request({
    //   url = "https://api.openai.com/v1/chat/completions";
    //   max_response_bytes = ?10000;
    //   headers = [
    //     { name = "Content-Type"; value = "application/json" },
    //     { name = "Authorization"; value = "Bearer " # openaiApiKey }
    //   ];
    //   body = ?Text.encodeUtf8(requestBody);
    //   method = #post;
    //   transform = null;
    // });

    // Parse response and extract validation result
    // For now, return mock data
    {
      approved = true;
      confidence = 85;
      reasoning = "Validation via OpenAI (mock response - implement HTTPS outcall)";
      manipulationDetected = false;
    }
  };

  /**
   * Call Anthropic API using HTTPS outcalls
   */
  func callAnthropic(prompt: Text) : async ValidationResult {
    // Similar to OpenAI but using Claude API

    let requestBody = "{" #
      "\"model\": \"claude-3-haiku-20240307\"," #
      "\"max_tokens\": 500," #
      "\"messages\": [{" #
        "\"role\": \"user\"," #
        "\"content\": \"" # escapeJson(prompt) # "\"" #
      "}]" #
    "}";

    // TODO: Implement actual HTTPS outcall
    // let ic : IC.Self = actor "aaaaa-aa";
    // let response = await ic.http_request({
    //   url = "https://api.anthropic.com/v1/messages";
    //   max_response_bytes = ?10000;
    //   headers = [
    //     { name = "Content-Type"; value = "application/json" },
    //     { name = "x-api-key"; value = anthropicApiKey },
    //     { name = "anthropic-version"; value = "2023-06-01" }
    //   ];
    //   body = ?Text.encodeUtf8(requestBody);
    //   method = #post;
    //   transform = null;
    // });

    // For now, return mock data
    {
      approved = true;
      confidence = 90;
      reasoning = "Validation via Anthropic Claude (mock response - implement HTTPS outcall)";
      manipulationDetected = false;
    }
  };

  /**
   * Escape JSON strings
   */
  func escapeJson(text: Text) : Text {
    // Simple escape for quotes and newlines
    // In production, use a proper JSON library
    let escaped = Text.replace(text, #text "\"", "\\\"");
    let escaped2 = Text.replace(escaped, #text "\n", "\\n");
    escaped2
  };

  /**
   * Get validation statistics
   */
  public query func getStats() : async {
    total: Nat;
    approved: Nat;
    rejected: Nat;
    approvalRate: Nat;
  } {
    let rate = if (totalValidations > 0) {
      (approvedCount * 100) / totalValidations
    } else {
      0
    };

    {
      total = totalValidations;
      approved = approvedCount;
      rejected = rejectedCount;
      approvalRate = rate;
    }
  };

  /**
   * Alternative: Simple rule-based validation for specific goal types
   * No external API needed - runs entirely on-chain
   */
  public func validateSimple(
    goalType: Text,
    proofText: Text
  ) : async ValidationResult {
    // Example: For "word_count" goals, just count words
    if (goalType == "word_count") {
      let words = Text.split(proofText, #char ' ');
      let wordCount = Iter.size(words);

      if (wordCount >= 100) {
        return {
          approved = true;
          confidence = 95;
          reasoning = "Word count verified: " # Nat.toText(wordCount) # " words";
          manipulationDetected = false;
        };
      } else {
        return {
          approved = false;
          confidence = 95;
          reasoning = "Insufficient word count: " # Nat.toText(wordCount) # " words (need 100+)";
          manipulationDetected = false;
        };
      };
    };

    // Default: require manual validation or external LLM
    return {
      approved = false;
      confidence = 0;
      reasoning = "Cannot validate this goal type automatically";
      manipulationDetected = false;
    };
  };
}
