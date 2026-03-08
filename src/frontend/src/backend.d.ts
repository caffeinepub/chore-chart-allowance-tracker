import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Chore {
    id: bigint;
    reward: bigint;
    name: string;
    createdBy: Principal;
    description: string;
    frequency: Frequency;
}
export interface Child {
    id: Principal;
    balance: bigint;
    name: string;
    createdBy: Principal;
    avatar: string;
}
export interface ChoreCompletion {
    id: bigint;
    status: CompletionStatus;
    reward: bigint;
    childId: Principal;
    timestamp: Time;
    choreId: bigint;
    verifiedBy?: Principal;
}
export type Time = bigint;
export interface UserProfile {
    name: string;
    role: string;
}
export interface Deduction {
    id: bigint;
    createdBy: Principal;
    childId: Principal;
    timestamp: Time;
    amount: bigint;
    reason: string;
}
export enum CompletionStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum Frequency {
    unlimited = "unlimited",
    daily = "daily",
    weekly = "weekly"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addDeduction(childId: Principal, amount: bigint, reason: string): Promise<bigint>;
    approveCompletion(completionId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createChild(childPrincipal: Principal, name: string, avatar: string): Promise<Principal>;
    createChore(name: string, description: string, reward: bigint, frequency: Frequency): Promise<bigint>;
    deleteChild(childId: Principal): Promise<void>;
    deleteChore(choreId: bigint): Promise<void>;
    getBalance(childId: Principal): Promise<bigint>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChild(childId: Principal): Promise<Child | null>;
    getChore(choreId: bigint): Promise<Chore | null>;
    getTransactionHistory(childId: Principal): Promise<{
        completions: Array<ChoreCompletion>;
        deductions: Array<Deduction>;
    }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listChildren(): Promise<Array<Child>>;
    listChores(): Promise<Array<Chore>>;
    listPendingCompletions(): Promise<Array<ChoreCompletion>>;
    markChoreComplete(choreId: bigint): Promise<bigint>;
    rejectCompletion(completionId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
