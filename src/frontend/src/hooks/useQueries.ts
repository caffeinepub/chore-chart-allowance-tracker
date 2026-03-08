import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Child,
  Chore,
  ChoreCompletion,
  Deduction,
  Frequency,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

// ── Children ──────────────────────────────────────────────────────────────────

export function useListChildren() {
  const { actor, isFetching } = useActor();
  return useQuery<Child[]>({
    queryKey: ["children"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listChildren();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetChild(childId: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Child | null>({
    queryKey: ["child", childId?.toString()],
    queryFn: async () => {
      if (!actor || !childId) return null;
      return actor.getChild(childId);
    },
    enabled: !!actor && !isFetching && !!childId,
  });
}

export function useGetBalance(childId: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["balance", childId?.toString()],
    queryFn: async () => {
      if (!actor || !childId) return BigInt(0);
      return actor.getBalance(childId);
    },
    enabled: !!actor && !isFetching && !!childId,
  });
}

export function useCreateChild() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      childPrincipal,
      name,
      avatar,
    }: { childPrincipal: Principal; name: string; avatar: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createChild(childPrincipal, name, avatar);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
}

export function useDeleteChild() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (childId: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteChild(childId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
}

// ── Chores ────────────────────────────────────────────────────────────────────

export function useListChores() {
  const { actor, isFetching } = useActor();
  return useQuery<Chore[]>({
    queryKey: ["chores"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listChores();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateChore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      description,
      reward,
      frequency,
    }: {
      name: string;
      description: string;
      reward: bigint;
      frequency: Frequency;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createChore(name, description, reward, frequency);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chores"] });
    },
  });
}

export function useDeleteChore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (choreId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteChore(choreId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chores"] });
    },
  });
}

// ── Completions ───────────────────────────────────────────────────────────────

export function useListPendingCompletions() {
  const { actor, isFetching } = useActor();
  return useQuery<ChoreCompletion[]>({
    queryKey: ["pending-completions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listPendingCompletions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMarkChoreComplete() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (choreId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.markChoreComplete(choreId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-completions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction-history"] });
    },
  });
}

export function useApproveCompletion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (completionId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.approveCompletion(completionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-completions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction-history"] });
      queryClient.invalidateQueries({ queryKey: ["balance"] });
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
}

export function useRejectCompletion() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (completionId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.rejectCompletion(completionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-completions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction-history"] });
    },
  });
}

// ── Deductions & History ──────────────────────────────────────────────────────

export function useTransactionHistory(childId: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<{ completions: ChoreCompletion[]; deductions: Deduction[] }>({
    queryKey: ["transaction-history", childId?.toString()],
    queryFn: async () => {
      if (!actor || !childId) return { completions: [], deductions: [] };
      return actor.getTransactionHistory(childId);
    },
    enabled: !!actor && !isFetching && !!childId,
  });
}

export function useAddDeduction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      childId,
      amount,
      reason,
    }: { childId: Principal; amount: bigint; reason: string }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addDeduction(childId, amount, reason);
    },
    onSuccess: (_data, { childId }) => {
      queryClient.invalidateQueries({
        queryKey: ["transaction-history", childId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["balance", childId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["children"] });
    },
  });
}

// ── Auth / Profile ────────────────────────────────────────────────────────────

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["is-admin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["caller-profile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCallerProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caller-profile"] });
      queryClient.invalidateQueries({ queryKey: ["is-admin"] });
    },
  });
}
