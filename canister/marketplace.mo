// Marketplace Module for Lock-In Responsible
// Extends the main canister with service registry and subscription management

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
import Float "mo:base/Float";

module Marketplace {

  // Types
  public type ServiceId = Nat;
  public type DeveloperId = Principal;
  public type UserId = Principal;
  public type Timestamp = Int;

  public type ServiceCategory = {
    #Blocker;      // Block distractions
    #Validator;    // Custom AI validators
    #Analytics;    // Goal analytics
    #Integration;  // 3rd party integrations
    #Gamification; // Badges, achievements
    #Automation;   // Auto-tracking tools
  };

  public type ServiceStatus = {
    #Active;
    #Deprecated;
    #Suspended;
  };

  public type PricingModel = {
    #Free;
    #OneTime: Nat;      // One-time purchase (tokens)
    #Subscription: Nat;  // Monthly (tokens)
    #PayPerUse: Nat;    // Per activation (tokens)
  };

  public type Service = {
    id: ServiceId;
    developerId: DeveloperId;
    name: Text;
    description: Text;
    category: ServiceCategory;
    pricing: PricingModel;
    webhookUrl: Text;
    originAssetId: ?Text;      // Origin SDK asset ID on Basecamp
    installations: Nat;
    totalRevenue: Nat;
    rating: Float;
    ratingCount: Nat;
    status: ServiceStatus;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  };

  public type UserServiceSubscription = {
    userId: UserId;
    serviceId: ServiceId;
    activatedAt: Timestamp;
    expiresAt: ?Timestamp;     // null for lifetime/free services
    isActive: Bool;
    settings: Text;            // JSON config string
    totalSpent: Nat;
  };

  public type ServiceRating = {
    userId: UserId;
    serviceId: ServiceId;
    rating: Nat;  // 1-5 stars
    review: Text;
    createdAt: Timestamp;
  };

  public type DeveloperPayout = {
    developerId: DeveloperId;
    serviceId: ServiceId;
    amount: Nat;
    timestamp: Timestamp;
    txType: { #Purchase; #Subscription; #PayPerUse };
  };

  // State
  public class MarketplaceState() {
    // Service registry
    private var nextServiceId: Nat = 0;
    private var services = HashMap.HashMap<ServiceId, Service>(0, Nat.equal, natHash);
    private var developerServices = HashMap.HashMap<DeveloperId, [ServiceId]>(0, Principal.equal, Principal.hash);

    // User subscriptions
    private var userSubscriptions = HashMap.HashMap<(UserId, ServiceId), UserServiceSubscription>(
      0,
      tupleEqual,
      tupleHash
    );
    private var userServicesList = HashMap.HashMap<UserId, [ServiceId]>(0, Principal.equal, Principal.hash);

    // Ratings
    private var serviceRatings = HashMap.HashMap<ServiceId, [ServiceRating]>(0, Nat.equal, natHash);

    // Developer payouts tracking
    private var developerPayouts = HashMap.HashMap<DeveloperId, [DeveloperPayout]>(0, Principal.equal, Principal.hash);

    // Helper functions
    private func natHash(n : Nat) : Hash.Hash {
      var hash : Nat32 = 0;
      var value = n;
      while (value > 0) {
        hash := hash +% Nat32.fromNat(value % 256);
        value := value / 256;
      };
      hash
    };

    private func tupleHash(t : (Principal, Nat)) : Hash.Hash {
      let (p, n) = t;
      Principal.hash(p) +% natHash(n)
    };

    private func tupleEqual(t1 : (Principal, Nat), t2 : (Principal, Nat)) : Bool {
      let (p1, n1) = t1;
      let (p2, n2) = t2;
      Principal.equal(p1, p2) and Nat.equal(n1, n2)
    };

    // ===== SERVICE MANAGEMENT =====

    public func registerService(
      developerId: DeveloperId,
      name: Text,
      description: Text,
      category: ServiceCategory,
      pricing: PricingModel,
      webhookUrl: Text
    ) : ServiceId {
      let serviceId = nextServiceId;
      nextServiceId += 1;

      let service : Service = {
        id = serviceId;
        developerId = developerId;
        name = name;
        description = description;
        category = category;
        pricing = pricing;
        webhookUrl = webhookUrl;
        originAssetId = null;
        installations = 0;
        totalRevenue = 0;
        rating = 0.0;
        ratingCount = 0;
        status = #Active;
        createdAt = Time.now();
        updatedAt = Time.now();
      };

      services.put(serviceId, service);

      // Update developer's service list
      let devServices = switch (developerServices.get(developerId)) {
        case (?services) { Array.append(services, [serviceId]) };
        case null { [serviceId] };
      };
      developerServices.put(developerId, devServices);

      serviceId
    };

    public func updateService(
      serviceId: ServiceId,
      originAssetId: ?Text,
      status: ?ServiceStatus
    ) : Bool {
      switch (services.get(serviceId)) {
        case (?service) {
          let updated = {
            id = service.id;
            developerId = service.developerId;
            name = service.name;
            description = service.description;
            category = service.category;
            pricing = service.pricing;
            webhookUrl = service.webhookUrl;
            originAssetId = switch (originAssetId) {
              case (?id) { ?id };
              case null { service.originAssetId };
            };
            installations = service.installations;
            totalRevenue = service.totalRevenue;
            rating = service.rating;
            ratingCount = service.ratingCount;
            status = switch (status) {
              case (?s) { s };
              case null { service.status };
            };
            createdAt = service.createdAt;
            updatedAt = Time.now();
          };
          services.put(serviceId, updated);
          true
        };
        case null { false };
      }
    };

    public func getService(serviceId: ServiceId) : ?Service {
      services.get(serviceId)
    };

    public func listServices(category: ?ServiceCategory) : [Service] {
      let buffer = Buffer.Buffer<Service>(0);
      for ((_, service) in services.entries()) {
        let matches = switch (category) {
          case (?cat) {
            switch (service.category, cat) {
              case (#Blocker, #Blocker) { true };
              case (#Validator, #Validator) { true };
              case (#Analytics, #Analytics) { true };
              case (#Integration, #Integration) { true };
              case (#Gamification, #Gamification) { true };
              case (#Automation, #Automation) { true };
              case _ { false };
            }
          };
          case null { true };
        };
        if (matches and service.status == #Active) {
          buffer.add(service);
        };
      };
      Buffer.toArray(buffer)
    };

    public func getDeveloperServices(developerId: DeveloperId) : [Service] {
      switch (developerServices.get(developerId)) {
        case (?serviceIds) {
          let buffer = Buffer.Buffer<Service>(serviceIds.size());
          for (serviceId in serviceIds.vals()) {
            switch (services.get(serviceId)) {
              case (?service) { buffer.add(service) };
              case null {};
            };
          };
          Buffer.toArray(buffer)
        };
        case null { [] };
      }
    };

    // ===== USER SUBSCRIPTIONS =====

    public func purchaseService(
      userId: UserId,
      serviceId: ServiceId,
      userTokens: HashMap.HashMap<UserId, Nat>,
      settings: Text
    ) : ?UserServiceSubscription {
      switch (services.get(serviceId)) {
        case (?service) {
          // Calculate price
          let price = getPriceForService(service);

          // Check user balance
          let userBalance = Option.get(userTokens.get(userId), 0);
          if (userBalance < price) {
            return null; // Insufficient funds
          };

          // Deduct tokens from user
          userTokens.put(userId, userBalance - price);

          // Calculate revenue distribution
          let platformFee = (price * 20) / 100;  // 20% platform fee
          let developerRevenue = price - platformFee;

          // Pay developer
          let devBalance = Option.get(userTokens.get(service.developerId), 0);
          userTokens.put(service.developerId, devBalance + developerRevenue);

          // Record payout
          recordDeveloperPayout(
            service.developerId,
            serviceId,
            developerRevenue,
            #Purchase
          );

          // Calculate expiration
          let expiresAt = switch (service.pricing) {
            case (#Subscription(monthlyPrice)) {
              ?(Time.now() + 2592000_000_000_000) // 30 days in nanoseconds
            };
            case _ { null }; // Free or one-time = lifetime
          };

          // Create subscription
          let subscription : UserServiceSubscription = {
            userId = userId;
            serviceId = serviceId;
            activatedAt = Time.now();
            expiresAt = expiresAt;
            isActive = true;
            settings = settings;
            totalSpent = price;
          };

          userSubscriptions.put((userId, serviceId), subscription);

          // Update user's services list
          let userServices = switch (userServicesList.get(userId)) {
            case (?services) { Array.append(services, [serviceId]) };
            case null { [serviceId] };
          };
          userServicesList.put(userId, userServices);

          // Update service stats
          updateServiceStats(serviceId, price);

          ?subscription
        };
        case null { null };
      }
    };

    public func getUserServices(userId: UserId) : [UserServiceSubscription] {
      switch (userServicesList.get(userId)) {
        case (?serviceIds) {
          let buffer = Buffer.Buffer<UserServiceSubscription>(serviceIds.size());
          for (serviceId in serviceIds.vals()) {
            switch (userSubscriptions.get((userId, serviceId))) {
              case (?sub) { buffer.add(sub) };
              case null {};
            };
          };
          Buffer.toArray(buffer)
        };
        case null { [] };
      }
    };

    public func getUserSubscription(userId: UserId, serviceId: ServiceId) : ?UserServiceSubscription {
      userSubscriptions.get((userId, serviceId))
    };

    public func deactivateUserService(userId: UserId, serviceId: ServiceId) : Bool {
      switch (userSubscriptions.get((userId, serviceId))) {
        case (?sub) {
          let updated = {
            userId = sub.userId;
            serviceId = sub.serviceId;
            activatedAt = sub.activatedAt;
            expiresAt = sub.expiresAt;
            isActive = false;
            settings = sub.settings;
            totalSpent = sub.totalSpent;
          };
          userSubscriptions.put((userId, serviceId), updated);
          true
        };
        case null { false };
      }
    };

    // ===== RATINGS & REVIEWS =====

    public func rateService(
      userId: UserId,
      serviceId: ServiceId,
      rating: Nat,
      review: Text
    ) : Bool {
      // Validate rating
      if (rating < 1 or rating > 5) {
        return false;
      };

      let serviceRating : ServiceRating = {
        userId = userId;
        serviceId = serviceId;
        rating = rating;
        review = review;
        createdAt = Time.now();
      };

      let ratings = switch (serviceRatings.get(serviceId)) {
        case (?existing) { Array.append(existing, [serviceRating]) };
        case null { [serviceRating] };
      };
      serviceRatings.put(serviceId, ratings);

      // Update service's average rating
      updateServiceRating(serviceId, ratings);

      true
    };

    public func getServiceRatings(serviceId: ServiceId) : [ServiceRating] {
      Option.get(serviceRatings.get(serviceId), [])
    };

    // ===== DEVELOPER ANALYTICS =====

    public func getDeveloperRevenue(developerId: DeveloperId) : Nat {
      switch (developerPayouts.get(developerId)) {
        case (?payouts) {
          var total : Nat = 0;
          for (payout in payouts.vals()) {
            total += payout.amount;
          };
          total
        };
        case null { 0 };
      }
    };

    public func getDeveloperPayouts(developerId: DeveloperId) : [DeveloperPayout] {
      Option.get(developerPayouts.get(developerId), [])
    };

    // ===== PRIVATE HELPERS =====

    private func getPriceForService(service: Service) : Nat {
      switch (service.pricing) {
        case (#Free) { 0 };
        case (#OneTime(price)) { price };
        case (#Subscription(monthlyPrice)) { monthlyPrice };
        case (#PayPerUse(perUsePrice)) { perUsePrice };
      }
    };

    private func updateServiceStats(serviceId: ServiceId, revenue: Nat) {
      switch (services.get(serviceId)) {
        case (?service) {
          let updated = {
            id = service.id;
            developerId = service.developerId;
            name = service.name;
            description = service.description;
            category = service.category;
            pricing = service.pricing;
            webhookUrl = service.webhookUrl;
            originAssetId = service.originAssetId;
            installations = service.installations + 1;
            totalRevenue = service.totalRevenue + revenue;
            rating = service.rating;
            ratingCount = service.ratingCount;
            status = service.status;
            createdAt = service.createdAt;
            updatedAt = Time.now();
          };
          services.put(serviceId, updated);
        };
        case null {};
      };
    };

    private func updateServiceRating(serviceId: ServiceId, ratings: [ServiceRating]) {
      switch (services.get(serviceId)) {
        case (?service) {
          var sum : Float = 0.0;
          for (rating in ratings.vals()) {
            sum += Float.fromInt(rating.rating);
          };
          let average = sum / Float.fromInt(ratings.size());

          let updated = {
            id = service.id;
            developerId = service.developerId;
            name = service.name;
            description = service.description;
            category = service.category;
            pricing = service.pricing;
            webhookUrl = service.webhookUrl;
            originAssetId = service.originAssetId;
            installations = service.installations;
            totalRevenue = service.totalRevenue;
            rating = average;
            ratingCount = ratings.size();
            status = service.status;
            createdAt = service.createdAt;
            updatedAt = Time.now();
          };
          services.put(serviceId, updated);
        };
        case null {};
      };
    };

    private func recordDeveloperPayout(
      developerId: DeveloperId,
      serviceId: ServiceId,
      amount: Nat,
      txType: { #Purchase; #Subscription; #PayPerUse }
    ) {
      let payout : DeveloperPayout = {
        developerId = developerId;
        serviceId = serviceId;
        amount = amount;
        timestamp = Time.now();
        txType = txType;
      };

      let payouts = switch (developerPayouts.get(developerId)) {
        case (?existing) { Array.append(existing, [payout]) };
        case null { [payout] };
      };
      developerPayouts.put(developerId, payouts);
    };

    // ===== STABLE STORAGE =====

    public func toStable() : {
      nextServiceId: Nat;
      servicesEntries: [(ServiceId, Service)];
      developerServicesEntries: [(DeveloperId, [ServiceId])];
      userSubscriptionsEntries: [((UserId, ServiceId), UserServiceSubscription)];
      userServicesListEntries: [(UserId, [ServiceId])];
      serviceRatingsEntries: [(ServiceId, [ServiceRating])];
      developerPayoutsEntries: [(DeveloperId, [DeveloperPayout])];
    } {
      {
        nextServiceId = nextServiceId;
        servicesEntries = Iter.toArray(services.entries());
        developerServicesEntries = Iter.toArray(developerServices.entries());
        userSubscriptionsEntries = Iter.toArray(userSubscriptions.entries());
        userServicesListEntries = Iter.toArray(userServicesList.entries());
        serviceRatingsEntries = Iter.toArray(serviceRatings.entries());
        developerPayoutsEntries = Iter.toArray(developerPayouts.entries());
      }
    };

    public func fromStable(stable: {
      nextServiceId: Nat;
      servicesEntries: [(ServiceId, Service)];
      developerServicesEntries: [(DeveloperId, [ServiceId])];
      userSubscriptionsEntries: [((UserId, ServiceId), UserServiceSubscription)];
      userServicesListEntries: [(UserId, [ServiceId])];
      serviceRatingsEntries: [(ServiceId, [ServiceRating])];
      developerPayoutsEntries: [(DeveloperId, [DeveloperPayout])];
    }) {
      nextServiceId := stable.nextServiceId;
      services := HashMap.fromIter<ServiceId, Service>(stable.servicesEntries.vals(), 0, Nat.equal, natHash);
      developerServices := HashMap.fromIter<DeveloperId, [ServiceId]>(stable.developerServicesEntries.vals(), 0, Principal.equal, Principal.hash);
      userSubscriptions := HashMap.fromIter<(UserId, ServiceId), UserServiceSubscription>(stable.userSubscriptionsEntries.vals(), 0, tupleEqual, tupleHash);
      userServicesList := HashMap.fromIter<UserId, [ServiceId]>(stable.userServicesListEntries.vals(), 0, Principal.equal, Principal.hash);
      serviceRatings := HashMap.fromIter<ServiceId, [ServiceRating]>(stable.serviceRatingsEntries.vals(), 0, Nat.equal, natHash);
      developerPayouts := HashMap.fromIter<DeveloperId, [DeveloperPayout]>(stable.developerPayoutsEntries.vals(), 0, Principal.equal, Principal.hash);
    };
  };
}
