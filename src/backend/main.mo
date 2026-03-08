import Map "mo:core/Map";
import Time "mo:core/Time";
import Int "mo:core/Int";
import List "mo:core/List";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Roles and Frequency Types
  public type Frequency = { #unlimited; #daily; #weekly };

  // User Profile Type (required by frontend)
  public type UserProfile = {
    name : Text;
    role : Text; // "parent" or "child"
  };

  // Core Data Types
  public type Child = {
    id : Principal;
    name : Text;
    avatar : Text;
    balance : Int; // Amount in cents
    createdBy : Principal;
  };

  public type Chore = {
    id : Nat;
    name : Text;
    description : Text;
    reward : Int; // Amount in cents
    frequency : Frequency;
    createdBy : Principal;
  };

  public type CompletionStatus = { #pending; #approved; #rejected };

  public type ChoreCompletion = {
    id : Nat;
    choreId : Nat;
    childId : Principal;
    status : CompletionStatus;
    timestamp : Time.Time;
    reward : Int;
    verifiedBy : ?Principal;
  };

  public type Deduction = {
    id : Nat;
    childId : Principal;
    amount : Int; // Negative amount in cents
    reason : Text;
    timestamp : Time.Time;
    createdBy : Principal;
  };

  // State
  let children = Map.empty<Principal, Child>();
  let chores = Map.empty<Nat, Chore>();
  let completions = Map.empty<Nat, ChoreCompletion>();
  let deductions = Map.empty<Nat, Deduction>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextChoreId = 0;
  var nextCompletionId = 0;
  var nextDeductionId = 0;

  // Mix in authorization system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Management (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Parent/Child Management
  public shared ({ caller }) func createChild(childPrincipal : Principal, name : Text, avatar : Text) : async Principal {
    // Authorization: Only parents can create new child accounts
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only parents can create new child accounts");
    };

    // Check if child already exists
    switch (children.get(childPrincipal)) {
      case (?_) { Runtime.trap("Child account already exists") };
      case null {};
    };

    let child : Child = {
      id = childPrincipal;
      name;
      avatar;
      balance = 0;
      createdBy = caller;
    };

    children.add(childPrincipal, child);
    AccessControl.assignRole(accessControlState, caller, childPrincipal, #user);
    childPrincipal;
  };

  public shared ({ caller }) func deleteChild(childId : Principal) : async () {
    // Authorization: Only parents can delete child accounts
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only parents can delete child accounts");
    };

    switch (children.get(childId)) {
      case (null) { Runtime.trap("Child does not exist") };
      case (?child) {
        // Only the parent who created the child can delete it
        if (child.createdBy != caller) {
          Runtime.trap("Unauthorized: Only the parent who created this child can delete it");
        };
        children.remove(childId);
      };
    };
  };

  public query ({ caller }) func listChildren() : async [Child] {
    // Authorization: Only parents can list all children
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only parents can list children");
    };

    children.values().toArray();
  };

  public query ({ caller }) func getChild(childId : Principal) : async ?Child {
    // Authorization: Parents can view any child, children can only view themselves
    if (caller != childId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };

    children.get(childId);
  };

  // Chore Management
  public shared ({ caller }) func createChore(name : Text, description : Text, reward : Int, frequency : Frequency) : async Nat {
    // Authorization: Only parents can create chores
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only parents can create chores");
    };

    let choreId = nextChoreId;
    let chore : Chore = {
      id = choreId;
      name;
      description;
      reward;
      frequency;
      createdBy = caller;
    };

    chores.add(choreId, chore);
    nextChoreId += 1;
    choreId;
  };

  public shared ({ caller }) func deleteChore(choreId : Nat) : async () {
    // Authorization: Only parents can delete chores
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only parents can delete chores");
    };

    switch (chores.get(choreId)) {
      case (null) { Runtime.trap("Chore does not exist") };
      case (?chore) {
        // Only the parent who created the chore can delete it
        if (chore.createdBy != caller) {
          Runtime.trap("Unauthorized: Only the parent who created this chore can delete it");
        };
        chores.remove(choreId);
      };
    };
  };

  public query ({ caller }) func listChores() : async [Chore] {
    // Authorization: Both parents and children can view chores
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list chores");
    };

    chores.values().toArray();
  };

  public query ({ caller }) func getChore(choreId : Nat) : async ?Chore {
    // Authorization: Both parents and children can view chores
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view chores");
    };

    chores.get(choreId);
  };

  // Chore Completions
  public shared ({ caller }) func markChoreComplete(choreId : Nat) : async Nat {
    // Authorization: Only children can mark chores as complete
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only children can mark chores as complete");
    };

    // Verify the caller is a registered child
    let child = switch (children.get(caller)) {
      case (null) { Runtime.trap("Only registered children can complete chores") };
      case (?c) { c };
    };

    let chore = switch (chores.get(choreId)) {
      case (null) { Runtime.trap("Chore does not exist") };
      case (?c) { c };
    };

    // Check frequency constraints
    switch (chore.frequency) {
      case (#daily) {
        let now = Time.now();
        let oneDayNanos = 24 * 60 * 60 * 1_000_000_000;
        let todaysCompletions = completions.values().filter(
          func(comp : ChoreCompletion) : Bool {
            comp.childId == child.id and
            comp.choreId == chore.id and
            comp.status == #approved and
            (now - comp.timestamp) < oneDayNanos
          }
        );
        if (todaysCompletions.size() > 0) {
          Runtime.trap("This chore can only be completed once per day");
        };
      };
      case (#weekly) {
        let now = Time.now();
        let oneWeekNanos = 7 * 24 * 60 * 60 * 1_000_000_000;
        let weeksCompletions = completions.values().filter(
          func(comp : ChoreCompletion) : Bool {
            comp.childId == child.id and
            comp.choreId == chore.id and
            comp.status == #approved and
            (now - comp.timestamp) < oneWeekNanos
          }
        );
        if (weeksCompletions.size() > 0) {
          Runtime.trap("This chore can only be completed once per week");
        };
      };
      case (#unlimited) {};
    };

    let completionId = nextCompletionId;
    let completion : ChoreCompletion = {
      id = completionId;
      choreId;
      childId = child.id;
      status = #pending;
      timestamp = Time.now();
      reward = chore.reward;
      verifiedBy = null;
    };

    completions.add(completionId, completion);
    nextCompletionId += 1;
    completionId;
  };

  // Approval
  public shared ({ caller }) func approveCompletion(completionId : Nat) : async () {
    // Authorization: Only parents can approve completions
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only parents can approve completions");
    };

    let completion = switch (completions.get(completionId)) {
      case (null) { Runtime.trap("Completion does not exist") };
      case (?c) { c };
    };

    if (completion.status != #pending) {
      Runtime.trap("This completion has already been processed");
    };

    completions.add(
      completionId,
      {
        completion with
        status = #approved;
        verifiedBy = ?caller;
      },
    );

    let child = switch (children.get(completion.childId)) {
      case (null) { Runtime.trap("Child does not exist") };
      case (?c) { c };
    };

    let updatedChild : Child = {
      child with balance = child.balance + completion.reward;
    };

    children.add(completion.childId, updatedChild);
  };

  // Rejection
  public shared ({ caller }) func rejectCompletion(completionId : Nat) : async () {
    // Authorization: Only parents can reject completions
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only parents can reject completions");
    };

    let completion = switch (completions.get(completionId)) {
      case (null) { Runtime.trap("Completion does not exist") };
      case (?c) { c };
    };

    if (completion.status != #pending) {
      Runtime.trap("This completion has already been processed");
    };

    completions.add(
      completionId,
      {
        completion with
        status = #rejected;
        verifiedBy = ?caller;
      },
    );
  };

  public query ({ caller }) func listPendingCompletions() : async [ChoreCompletion] {
    // Authorization: Only parents can view pending completions
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only parents can view pending completions");
    };

    completions.values().filter(
      func(comp : ChoreCompletion) : Bool { comp.status == #pending }
    ).toArray();
  };

  // Deductions
  public shared ({ caller }) func addDeduction(childId : Principal, amount : Int, reason : Text) : async Nat {
    // Authorization: Only parents can make deductions
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only parents can make deductions");
    };

    let child = switch (children.get(childId)) {
      case (null) { Runtime.trap("Child does not exist") };
      case (?c) { c };
    };

    let deductionId = nextDeductionId;
    let deduction : Deduction = {
      id = deductionId;
      childId;
      amount = Int.abs(amount) * -1; // Ensure negative
      reason;
      timestamp = Time.now();
      createdBy = caller;
    };

    deductions.add(deductionId, deduction);

    let updatedChild : Child = {
      child with balance = child.balance + deduction.amount;
    };

    children.add(childId, updatedChild);
    nextDeductionId += 1;
    deductionId;
  };

  // Transaction History
  public query ({ caller }) func getTransactionHistory(childId : Principal) : async {
    completions : [ChoreCompletion];
    deductions : [Deduction];
  } {
    // Authorization: Parents can view any child's history, children can only view their own
    if (caller != childId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own transaction history");
    };

    let childCompletions = completions.values().filter(
      func(comp : ChoreCompletion) : Bool { comp.childId == childId and comp.status == #approved }
    ).toArray();

    let childDeductions = deductions.values().filter(
      func(deduc : Deduction) : Bool { deduc.childId == childId }
    ).toArray();

    { completions = childCompletions; deductions = childDeductions };
  };

  // Balance Inquiry
  public query ({ caller }) func getBalance(childId : Principal) : async Int {
    // Authorization: Parents can view any child's balance, children can only view their own
    if (caller != childId and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own balance");
    };

    let child = switch (children.get(childId)) {
      case (null) { Runtime.trap("Child does not exist") };
      case (?c) { c };
    };
    child.balance;
  };
};
