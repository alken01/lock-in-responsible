// Marketplace Extension for main.mo
// Add these imports and code to the existing LockInResponsible canister

// ===== ADD THESE IMPORTS AT THE TOP =====
import Float "mo:base/Float";
import Marketplace "./marketplace";

// ===== ADD THESE TYPE EXPORTS AFTER EXISTING TYPES =====

  // Re-export marketplace types
  public type ServiceId = Marketplace.ServiceId;
  public type ServiceCategory = Marketplace.ServiceCategory;
  public type ServiceStatus = Marketplace.ServiceStatus;
  public type PricingModel = Marketplace.PricingModel;
  public type Service = Marketplace.Service;
  public type UserServiceSubscription = Marketplace.UserServiceSubscription;
  public type ServiceRating = Marketplace.ServiceRating;
  public type DeveloperPayout = Marketplace.DeveloperPayout;

// ===== ADD MARKETPLACE STATE =====

  // Marketplace state instance
  private let marketplace = Marketplace.MarketplaceState();

  // Marketplace stable storage
  private stable var marketplaceStable : {
    nextServiceId: Nat;
    servicesEntries: [(ServiceId, Service)];
    developerServicesEntries: [(Principal, [ServiceId])];
    userSubscriptionsEntries: [((Principal, ServiceId), UserServiceSubscription)];
    userServicesListEntries: [(Principal, [ServiceId])];
    serviceRatingsEntries: [(ServiceId, [ServiceRating])];
    developerPayoutsEntries: [(Principal, [DeveloperPayout])];
  } = {
    nextServiceId = 0;
    servicesEntries = [];
    developerServicesEntries = [];
    userSubscriptionsEntries = [];
    userServicesListEntries = [];
    serviceRatingsEntries = [];
    developerPayoutsEntries = [];
  };

// ===== UPDATE PREUPGRADE/POSTUPGRADE FUNCTIONS =====

  // Add to preupgrade():
  system func preupgrade() {
    // ... existing code ...
    marketplaceStable := marketplace.toStable();
  };

  // Add to postupgrade():
  system func postupgrade() {
    // ... existing code ...
    marketplace.fromStable(marketplaceStable);
  };

// ===== ADD MARKETPLACE PUBLIC FUNCTIONS =====

  // ===== SERVICE MANAGEMENT =====

  /// Register a new service in the marketplace
  public shared(msg) func registerService(
    name: Text,
    description: Text,
    category: ServiceCategory,
    pricing: PricingModel,
    webhookUrl: Text
  ) : async ServiceId {
    let caller = msg.caller;
    marketplace.registerService(caller, name, description, category, pricing, webhookUrl)
  };

  /// Update service metadata (Origin asset ID, status)
  public shared(msg) func updateService(
    serviceId: ServiceId,
    originAssetId: ?Text,
    status: ?ServiceStatus
  ) : async Bool {
    marketplace.updateService(serviceId, originAssetId, status)
  };

  /// Get service details
  public query func getService(serviceId: ServiceId) : async ?Service {
    marketplace.getService(serviceId)
  };

  /// List all active services, optionally filtered by category
  public query func listServices(category: ?ServiceCategory) : async [Service] {
    marketplace.listServices(category)
  };

  /// Get all services created by a developer
  public query func getDeveloperServices(developerId: Principal) : async [Service] {
    marketplace.getDeveloperServices(developerId)
  };

  /// Get my developer services
  public query(msg) func getMyDeveloperServices() : async [Service] {
    marketplace.getDeveloperServices(msg.caller)
  };

  // ===== USER SUBSCRIPTIONS =====

  /// Purchase a service subscription
  public shared(msg) func purchaseService(
    serviceId: ServiceId,
    settings: Text
  ) : async ?UserServiceSubscription {
    let caller = msg.caller;
    marketplace.purchaseService(caller, serviceId, userTokens, settings)
  };

  /// Get all services purchased by user
  public query(msg) func getMyServices() : async [UserServiceSubscription] {
    marketplace.getUserServices(msg.caller)
  };

  /// Get services for specific user
  public query func getUserServices(userId: Principal) : async [UserServiceSubscription] {
    marketplace.getUserServices(userId)
  };

  /// Get specific subscription
  public query(msg) func getUserSubscription(serviceId: ServiceId) : async ?UserServiceSubscription {
    marketplace.getUserSubscription(msg.caller, serviceId)
  };

  /// Deactivate a service subscription
  public shared(msg) func deactivateService(serviceId: ServiceId) : async Bool {
    marketplace.deactivateUserService(msg.caller, serviceId)
  };

  // ===== RATINGS & REVIEWS =====

  /// Rate a service (1-5 stars)
  public shared(msg) func rateService(
    serviceId: ServiceId,
    rating: Nat,
    review: Text
  ) : async Bool {
    marketplace.rateService(msg.caller, serviceId, rating, review)
  };

  /// Get ratings for a service
  public query func getServiceRatings(serviceId: ServiceId) : async [ServiceRating] {
    marketplace.getServiceRatings(serviceId)
  };

  // ===== DEVELOPER ANALYTICS =====

  /// Get total revenue for a developer
  public query func getDeveloperRevenue(developerId: Principal) : async Nat {
    marketplace.getDeveloperRevenue(developerId)
  };

  /// Get my developer revenue
  public query(msg) func getMyDeveloperRevenue() : async Nat {
    marketplace.getDeveloperRevenue(msg.caller)
  };

  /// Get payout history for a developer
  public query func getDeveloperPayouts(developerId: Principal) : async [DeveloperPayout] {
    marketplace.getDeveloperPayouts(developerId)
  };

  /// Get my payout history
  public query(msg) func getMyDeveloperPayouts() : async [DeveloperPayout] {
    marketplace.getDeveloperPayouts(msg.caller)
  };

  // ===== MARKETPLACE INFO =====

  /// Get marketplace statistics
  public query func getMarketplaceInfo() : async {
    totalServices: Nat;
    totalInstallations: Nat;
    totalRevenue: Nat;
  } {
    let services = marketplace.listServices(null);
    var totalInstalls : Nat = 0;
    var totalRev : Nat = 0;

    for (service in services.vals()) {
      totalInstalls += service.installations;
      totalRev += service.totalRevenue;
    };

    {
      totalServices = services.size();
      totalInstallations = totalInstalls;
      totalRevenue = totalRev;
    }
  };
}
