import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Principal } from "@icp-sdk/core/principal";
import {
  ArrowLeft,
  Check,
  Loader2,
  LogOut,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Child,
  type Chore,
  ChoreCompletion,
  Frequency,
} from "../backend.d";
import {
  useAddDeduction,
  useApproveCompletion,
  useCreateChild,
  useCreateChore,
  useDeleteChild,
  useDeleteChore,
  useListChildren,
  useListChores,
  useListPendingCompletions,
  useRejectCompletion,
  useTransactionHistory,
} from "../hooks/useQueries";
import { dollarsToCents, formatMoney, formatTimestamp } from "../utils/format";
import { AVATARS, getAvatarBg } from "./LandingPage";

const AVATAR_OPTIONS = [
  "🐶",
  "🦊",
  "🐱",
  "🐸",
  "🦄",
  "🐼",
  "🐻",
  "🐨",
  "🐯",
  "🦁",
  "🐧",
  "🐺",
];

interface ParentDashboardProps {
  onLogout: () => void;
  parentName?: string;
}

// ─── Children Tab ─────────────────────────────────────────────────────────────

function ChildrenTab() {
  const { data: children = [], isLoading } = useListChildren();
  const createChild = useCreateChild();
  const deleteChild = useDeleteChild();

  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrincipal, setNewPrincipal] = useState("");
  const [newAvatar, setNewAvatar] = useState("🐶");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPrincipal.trim()) return;
    try {
      const principal = Principal.fromText(newPrincipal.trim());
      await createChild.mutateAsync({
        childPrincipal: principal,
        name: newName.trim(),
        avatar: newAvatar,
      });
      toast.success(`${newName} added! 🎉`);
      setNewName("");
      setNewPrincipal("");
      setNewAvatar("🐶");
      setShowAdd(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to add child";
      toast.error(
        msg.includes("Principal")
          ? "Invalid Internet Identity. Check the principal ID."
          : msg,
      );
    }
  };

  const handleDelete = async (child: Child) => {
    try {
      await deleteChild.mutateAsync(child.id);
      toast.success(`${child.name} removed.`);
      if (selectedChild?.id.toString() === child.id.toString()) {
        setSelectedChild(null);
      }
    } catch {
      toast.error("Failed to remove child.");
    }
  };

  if (selectedChild) {
    return (
      <ChildDetail
        child={selectedChild}
        onBack={() => setSelectedChild(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl text-foreground">
          Your Children
        </h2>
        <Button
          data-ocid="parent.add_child_button"
          onClick={() => setShowAdd((v) => !v)}
          className="rounded-full gap-2 bg-primary text-primary-foreground font-bold"
        >
          <Plus className="h-4 w-4" />
          Add Child
        </Button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.form
            onSubmit={handleAdd}
            className="kid-card p-5 flex flex-col gap-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3 className="font-display font-bold text-lg">Add a New Child</h3>

            <div>
              <Label className="font-semibold text-sm mb-1 block">
                Child's Name
              </Label>
              <Input
                data-ocid="parent.child_name_input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Emma"
                className="rounded-2xl h-11"
                required
              />
            </div>

            <div>
              <Label className="font-semibold text-sm mb-1 block">
                Child's Internet Identity Principal
              </Label>
              <Input
                data-ocid="parent.child_principal_input"
                value={newPrincipal}
                onChange={(e) => setNewPrincipal(e.target.value)}
                placeholder="e.g. xxxxx-xxxxx-xxxxx-xxxxx-xxx"
                className="rounded-2xl h-11 font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                The child's unique Internet Identity ID
              </p>
            </div>

            <div>
              <Label className="font-semibold text-sm mb-2 block">
                Pick an Avatar
              </Label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewAvatar(emoji)}
                    className={`text-2xl w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                      newAvatar === emoji
                        ? "border-primary bg-primary/20 scale-110"
                        : "border-border bg-muted hover:border-primary/50"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                disabled={createChild.isPending}
                className="flex-1 rounded-full bg-primary text-primary-foreground font-bold"
              >
                {createChild.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add Child 🌟"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdd(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div data-ocid="children.loading_state" className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : children.length === 0 ? (
        <div
          data-ocid="children.empty_state"
          className="text-center py-12 kid-card"
        >
          <p className="text-5xl mb-3">👶</p>
          <p className="font-display text-xl font-bold">No children yet!</p>
          <p className="text-muted-foreground mt-1">
            Add your first child above.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {children.map((child, i) => (
            <motion.div
              key={child.id.toString()}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="kid-card p-4 flex items-center gap-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedChild(child)}
            >
              <div
                className={`w-12 h-12 rounded-full border-4 flex items-center justify-center text-2xl shrink-0 ${getAvatarBg(child.avatar)}`}
              >
                {child.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-lg text-foreground">
                  {child.name}
                </p>
                <p className="text-sm text-green-600 font-semibold">
                  Balance: {formatMoney(child.balance)}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    data-ocid={`children.item.${i + 1}`}
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent
                  data-ocid="children.dialog"
                  className="rounded-3xl"
                >
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove {child.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove {child.name} and all their
                      data. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel
                      data-ocid="children.cancel_button"
                      className="rounded-full"
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      data-ocid="children.confirm_button"
                      onClick={() => handleDelete(child)}
                      className="rounded-full bg-destructive text-destructive-foreground"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Child Detail ─────────────────────────────────────────────────────────────

function ChildDetail({ child, onBack }: { child: Child; onBack: () => void }) {
  const { data: history, isLoading } = useTransactionHistory(child.id);
  const { data: chores = [] } = useListChores();
  const addDeduction = useAddDeduction();

  const [deductAmount, setDeductAmount] = useState("");
  const [deductReason, setDeductReason] = useState("");

  const completions = history?.completions ?? [];
  const deductions = history?.deductions ?? [];

  type TxItem = {
    type: "earned" | "deducted";
    amount: bigint;
    label: string;
    timestamp: bigint;
    id: string;
  };
  const transactions: TxItem[] = [
    ...completions.map((c) => ({
      type: "earned" as const,
      amount: c.reward,
      label: `✅ ${chores.find((ch) => ch.id === c.choreId)?.name ?? "Chore"} (${c.status})`,
      timestamp: c.timestamp,
      id: `c-${c.id.toString()}`,
    })),
    ...deductions.map((d) => ({
      type: "deducted" as const,
      amount: d.amount,
      label: `⚠️ ${d.reason}`,
      timestamp: d.timestamp,
      id: `d-${d.id.toString()}`,
    })),
  ].sort((a, b) => Number(b.timestamp - a.timestamp));

  const handleDeduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deductAmount || !deductReason.trim()) return;
    const amountCents = dollarsToCents(deductAmount);
    if (amountCents <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    try {
      await addDeduction.mutateAsync({
        childId: child.id,
        amount: amountCents,
        reason: deductReason.trim(),
      });
      toast.success(`Deduction added: -${formatMoney(amountCents)}`);
      setDeductAmount("");
      setDeductReason("");
    } catch {
      toast.error("Failed to add deduction.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm font-semibold w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Children
      </button>

      <div className="flex items-center gap-4 kid-card p-4">
        <div
          className={`w-14 h-14 rounded-full border-4 flex items-center justify-center text-3xl ${getAvatarBg(child.avatar)}`}
        >
          {child.avatar}
        </div>
        <div>
          <h2 className="font-display font-black text-2xl">{child.name}</h2>
          <p className="text-green-600 font-bold text-lg">
            Balance: {formatMoney(child.balance)}
          </p>
        </div>
      </div>

      {/* Add Deduction */}
      <div className="kid-card p-5">
        <h3 className="font-display font-bold text-lg mb-3 text-destructive">
          ⚠️ Add Deduction
        </h3>
        <form onSubmit={handleDeduction} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-sm font-semibold mb-1 block">
                Amount ($)
              </Label>
              <Input
                data-ocid="deduction.amount_input"
                type="number"
                min="0.01"
                step="0.01"
                value={deductAmount}
                onChange={(e) => setDeductAmount(e.target.value)}
                placeholder="5.00"
                className="rounded-2xl h-11"
                required
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold mb-1 block">Reason</Label>
            <Textarea
              data-ocid="deduction.reason_input"
              value={deductReason}
              onChange={(e) => setDeductReason(e.target.value)}
              placeholder="e.g. Didn't listen at dinner"
              className="rounded-2xl resize-none"
              rows={2}
              required
            />
          </div>
          <Button
            type="submit"
            data-ocid="deduction.submit_button"
            disabled={addDeduction.isPending}
            variant="destructive"
            className="rounded-full font-bold"
          >
            {addDeduction.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Add Deduction
          </Button>
        </form>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="font-display font-bold text-lg mb-3">
          Transaction History
        </h3>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-2xl" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div
            data-ocid="transactions.empty_state"
            className="text-center py-8 kid-card"
          >
            <p className="text-4xl mb-2">📋</p>
            <p className="font-semibold text-muted-foreground">
              No transactions yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 ${
                  tx.type === "earned"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {tx.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(tx.timestamp)}
                  </p>
                </div>
                <span
                  className={`font-display font-black text-lg ${tx.type === "earned" ? "text-green-600" : "text-red-600"}`}
                >
                  {tx.type === "earned" ? "+" : "-"}
                  {formatMoney(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chores Tab ───────────────────────────────────────────────────────────────

function ChoresTab() {
  const { data: chores = [], isLoading } = useListChores();
  const createChore = useCreateChore();
  const deleteChore = useDeleteChore();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [frequency, setFrequency] = useState<Frequency>(Frequency.daily);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !reward) return;
    const rewardCents = dollarsToCents(reward);
    if (rewardCents <= 0) {
      toast.error("Enter a valid reward amount.");
      return;
    }
    try {
      await createChore.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        reward: rewardCents,
        frequency,
      });
      toast.success(`"${name}" chore added! ✅`);
      setName("");
      setDescription("");
      setReward("");
      setFrequency(Frequency.daily);
      setShowAdd(false);
    } catch {
      toast.error("Failed to add chore.");
    }
  };

  const handleDelete = async (chore: Chore) => {
    try {
      await deleteChore.mutateAsync(chore.id);
      toast.success(`"${chore.name}" removed.`);
    } catch {
      toast.error("Failed to remove chore.");
    }
  };

  const freqLabel = (f: Frequency) => {
    if (f === Frequency.daily) return "Once a day";
    if (f === Frequency.weekly) return "Once a week";
    return "Unlimited";
  };

  const freqBadge = (f: Frequency) => {
    if (f === Frequency.daily) return "bg-blue-100 text-blue-700";
    if (f === Frequency.weekly) return "bg-purple-100 text-purple-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl">All Chores</h2>
        <Button
          data-ocid="parent.add_chore_button"
          onClick={() => setShowAdd((v) => !v)}
          className="rounded-full gap-2 bg-kid-teal text-white font-bold"
        >
          <Plus className="h-4 w-4" />
          Add Chore
        </Button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.form
            onSubmit={handleAdd}
            className="kid-card p-5 flex flex-col gap-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3 className="font-display font-bold text-lg">New Chore</h3>

            <div>
              <Label className="text-sm font-semibold mb-1 block">
                Chore Name
              </Label>
              <Input
                data-ocid="parent.chore_name_input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Clean your room"
                className="rounded-2xl h-11"
                required
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-1 block">
                Description (optional)
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What exactly needs to be done?"
                className="rounded-2xl resize-none"
                rows={2}
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Label className="text-sm font-semibold mb-1 block">
                  Reward ($)
                </Label>
                <Input
                  data-ocid="parent.chore_reward_input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  placeholder="1.00"
                  className="rounded-2xl h-11"
                  required
                />
              </div>

              <div className="flex-1">
                <Label className="text-sm font-semibold mb-1 block">
                  Frequency
                </Label>
                <Select
                  value={frequency}
                  onValueChange={(v) => setFrequency(v as Frequency)}
                >
                  <SelectTrigger
                    data-ocid="parent.chore_frequency_select"
                    className="rounded-2xl h-11"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value={Frequency.unlimited}>
                      ♾️ Unlimited
                    </SelectItem>
                    <SelectItem value={Frequency.daily}>
                      📅 Once a Day
                    </SelectItem>
                    <SelectItem value={Frequency.weekly}>
                      🗓️ Once a Week
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="submit"
                disabled={createChore.isPending}
                className="flex-1 rounded-full bg-kid-teal text-white font-bold"
              >
                {createChore.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add Chore ✅"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdd(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div data-ocid="chores.loading_state" className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : chores.length === 0 ? (
        <div
          data-ocid="chores.empty_state"
          className="text-center py-12 kid-card"
        >
          <p className="text-5xl mb-3">📋</p>
          <p className="font-display text-xl font-bold">No chores yet!</p>
          <p className="text-muted-foreground mt-1">
            Add your first chore above.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {chores.map((chore, i) => (
            <motion.div
              key={chore.id.toString()}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="kid-card p-4 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display font-bold text-base text-foreground">
                    {chore.name}
                  </p>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${freqBadge(chore.frequency)}`}
                  >
                    {freqLabel(chore.frequency)}
                  </span>
                </div>
                {chore.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {chore.description}
                  </p>
                )}
              </div>
              <span className="font-display font-black text-lg text-green-600 shrink-0">
                {formatMoney(chore.reward)}
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent
                  data-ocid="chores.dialog"
                  className="rounded-3xl"
                >
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete "{chore.name}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This chore will be permanently deleted. Kids won't be able
                      to complete it anymore.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-full">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(chore)}
                      className="rounded-full bg-destructive text-destructive-foreground"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Approvals Tab ────────────────────────────────────────────────────────────

function ApprovalsTab() {
  const { data: pending = [], isLoading } = useListPendingCompletions();
  const { data: chores = [] } = useListChores();
  const { data: children = [] } = useListChildren();
  const approve = useApproveCompletion();
  const reject = useRejectCompletion();

  const handleApprove = async (id: bigint) => {
    try {
      await approve.mutateAsync(id);
      toast.success("Chore approved! 💰 Money added.");
    } catch {
      toast.error("Failed to approve.");
    }
  };

  const handleReject = async (id: bigint) => {
    try {
      await reject.mutateAsync(id);
      toast.success("Chore rejected.");
    } catch {
      toast.error("Failed to reject.");
    }
  };

  const getChildName = (childId: { toString: () => string }) => {
    return (
      children.find((c) => c.id.toString() === childId.toString())?.name ??
      "Unknown"
    );
  };

  const getChoreName = (choreId: bigint) => {
    return chores.find((c) => c.id === choreId)?.name ?? "Unknown Chore";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 className="font-display font-bold text-xl">Pending Approvals</h2>
        {pending.length > 0 && (
          <Badge className="bg-destructive text-destructive-foreground rounded-full font-bold">
            {pending.length}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div
          data-ocid="approvals.loading_state"
          className="flex flex-col gap-3"
        >
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div
          data-ocid="approvals.empty_state"
          className="text-center py-12 kid-card"
        >
          <p className="text-5xl mb-3">🎉</p>
          <p className="font-display text-xl font-bold">All caught up!</p>
          <p className="text-muted-foreground mt-1">
            No chores waiting for approval.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((completion, i) => (
            <motion.div
              key={completion.id.toString()}
              data-ocid={`approvals.item.${i + 1}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="kid-card p-4 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-base text-foreground">
                  {getChildName(completion.childId)}
                </p>
                <p className="text-sm text-muted-foreground">
                  🏠 {getChoreName(completion.choreId)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatTimestamp(completion.timestamp)} ·{" "}
                  {formatMoney(completion.reward)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  data-ocid={`approvals.approve_button.${i + 1}`}
                  size="sm"
                  onClick={() => handleApprove(completion.id)}
                  disabled={approve.isPending}
                  className="rounded-full bg-green-500 hover:bg-green-600 text-white font-bold gap-1 px-4"
                >
                  {approve.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Approve</span>
                </Button>
                <Button
                  data-ocid={`approvals.reject_button.${i + 1}`}
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReject(completion.id)}
                  disabled={reject.isPending}
                  className="rounded-full font-bold gap-1 px-4"
                >
                  {reject.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Reject</span>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function ParentDashboard({
  onLogout,
  parentName,
}: ParentDashboardProps) {
  const { data: pending = [] } = useListPendingCompletions();
  const [activeTab, setActiveTab] = useState("children");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display font-black text-xl text-foreground">
              ⭐ Parent Dashboard
            </h1>
            {parentName && (
              <p className="text-xs text-muted-foreground">
                Welcome, {parentName}
              </p>
            )}
          </div>
          <Button
            onClick={onLogout}
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground rounded-full"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </motion.header>

      {/* Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-6 rounded-2xl h-12 bg-muted">
            <TabsTrigger
              data-ocid="parent.children_tab"
              value="children"
              className="flex-1 rounded-xl font-display font-bold text-sm sm:text-base"
            >
              👨‍👩‍👧‍👦 Children
            </TabsTrigger>
            <TabsTrigger
              data-ocid="parent.chores_tab"
              value="chores"
              className="flex-1 rounded-xl font-display font-bold text-sm sm:text-base"
            >
              🏠 Chores
            </TabsTrigger>
            <TabsTrigger
              data-ocid="parent.approvals_tab"
              value="approvals"
              className="flex-1 rounded-xl font-display font-bold text-sm sm:text-base relative"
            >
              ✅ Approvals
              {pending.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full text-xs w-5 h-5 flex items-center justify-center font-bold">
                  {pending.length > 9 ? "9+" : pending.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="children">
            <ChildrenTab />
          </TabsContent>

          <TabsContent value="chores">
            <ChoresTab />
          </TabsContent>

          <TabsContent value="approvals">
            <ApprovalsTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="pb-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
