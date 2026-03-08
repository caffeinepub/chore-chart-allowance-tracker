import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Child,
  type Chore,
  type ChoreCompletion,
  CompletionStatus,
  Frequency,
} from "../backend.d";
import {
  useListChores,
  useMarkChoreComplete,
  useTransactionHistory,
} from "../hooks/useQueries";
import {
  formatMoney,
  formatTimestamp,
  isThisWeek,
  isToday,
} from "../utils/format";
import { getAvatarBg } from "./LandingPage";

interface ChildViewProps {
  child: Child;
  onBack: () => void;
}

function getFrequencyLabel(freq: Frequency): { label: string; color: string } {
  switch (freq) {
    case Frequency.daily:
      return {
        label: "Once a day",
        color: "bg-blue-100 text-blue-700 border-blue-200",
      };
    case Frequency.weekly:
      return {
        label: "Once a week",
        color: "bg-purple-100 text-purple-700 border-purple-200",
      };
    case Frequency.unlimited:
      return {
        label: "Unlimited",
        color: "bg-green-100 text-green-700 border-green-200",
      };
    default:
      return {
        label: "Unlimited",
        color: "bg-green-100 text-green-700 border-green-200",
      };
  }
}

interface ChoreCardProps {
  chore: Chore;
  index: number;
  childId: string;
  pendingCompletions: ChoreCompletion[];
  onMark: (choreId: bigint) => void;
  isMarking: boolean;
  markingId: bigint | null;
}

function ChoreCard({
  chore,
  index,
  childId,
  pendingCompletions,
  onMark,
  isMarking,
  markingId,
}: ChoreCardProps) {
  const { label, color } = getFrequencyLabel(chore.frequency);

  // Check if already done based on frequency
  const childCompletions = pendingCompletions.filter(
    (c) => c.childId.toString() === childId && c.choreId === chore.id,
  );

  let isDisabled = false;
  let disabledMsg = "";

  if (chore.frequency === Frequency.daily) {
    const doneToday = childCompletions.some(
      (c) =>
        (c.status === CompletionStatus.pending ||
          c.status === CompletionStatus.approved) &&
        isToday(c.timestamp),
    );
    if (doneToday) {
      isDisabled = true;
      disabledMsg = "Already done today! ✅";
    }
  } else if (chore.frequency === Frequency.weekly) {
    const doneThisWeek = childCompletions.some(
      (c) =>
        (c.status === CompletionStatus.pending ||
          c.status === CompletionStatus.approved) &&
        isThisWeek(c.timestamp),
    );
    if (doneThisWeek) {
      isDisabled = true;
      disabledMsg = "Done this week! 🌟";
    }
  }

  const thisIsMarking = isMarking && markingId === chore.id;

  const cardColors = [
    "border-yellow-300 bg-yellow-50",
    "border-teal-300 bg-teal-50",
    "border-pink-300 bg-pink-50",
    "border-purple-300 bg-purple-50",
    "border-orange-300 bg-orange-50",
    "border-sky-300 bg-sky-50",
  ];

  return (
    <motion.div
      data-ocid={`child_view.chore.item.${index + 1}`}
      className={`rounded-3xl border-4 p-5 flex flex-col gap-3 shadow-sm ${cardColors[index % cardColors.length]}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-lg text-foreground leading-tight">
            {chore.name}
          </h3>
          {chore.description && (
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
              {chore.description}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="font-display font-black text-xl text-green-600">
            {formatMoney(chore.reward)}
          </span>
          <p className="text-xs text-muted-foreground">reward</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full border ${color}`}
        >
          {label}
        </span>

        {isDisabled ? (
          <span className="text-sm font-semibold text-muted-foreground bg-gray-100 px-4 py-2 rounded-full border-2 border-gray-200">
            {disabledMsg}
          </span>
        ) : (
          <button
            type="button"
            data-ocid={`child_view.chore.button.${index + 1}`}
            onClick={() => onMark(chore.id)}
            disabled={thisIsMarking}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-display font-bold text-sm px-5 py-2.5 rounded-full shadow-md bouncy border-2 border-green-400 disabled:opacity-60"
          >
            {thisIsMarking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>Done! ✅</span>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function ChildView({ child, onBack }: ChildViewProps) {
  const [activeTab, setActiveTab] = useState("chores");
  const [markingId, setMarkingId] = useState<bigint | null>(null);

  const { data: chores = [], isLoading: loadingChores } = useListChores();
  const { data: history, isLoading: loadingHistory } = useTransactionHistory(
    child.id,
  );
  const markComplete = useMarkChoreComplete();

  // We use ALL pending completions for this child to determine disabled state
  // Since we fetch all, filter by childId
  const childCompletions = (history?.completions ?? []).filter(
    (c) => c.childId.toString() === child.id.toString(),
  );

  // Combine for disability checks (pending + approved)
  const allCompletions = childCompletions;

  const handleMark = async (choreId: bigint) => {
    setMarkingId(choreId);
    try {
      await markComplete.mutateAsync(choreId);
      toast.success("Waiting for parent to approve! 🎉");
    } catch (_e) {
      toast.error("Oops! Something went wrong. Try again.");
    } finally {
      setMarkingId(null);
    }
  };

  const approvedCompletions = childCompletions.filter(
    (c) => c.status === CompletionStatus.approved,
  );
  const deductions = history?.deductions ?? [];

  // Sort transactions by timestamp
  type TxItem = {
    type: "earned" | "deducted";
    amount: bigint;
    label: string;
    timestamp: bigint;
    id: string;
  };
  const transactions: TxItem[] = [
    ...approvedCompletions.map((c) => {
      const choreName =
        chores.find((ch) => ch.id === c.choreId)?.name ?? "Chore";
      return {
        type: "earned" as const,
        amount: c.reward,
        label: `✅ ${choreName}`,
        timestamp: c.timestamp,
        id: `c-${c.id.toString()}`,
      };
    }),
    ...deductions.map((d) => ({
      type: "deducted" as const,
      amount: d.amount,
      label: `⚠️ ${d.reason}`,
      timestamp: d.timestamp,
      id: `d-${d.id.toString()}`,
    })),
  ].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <div className="min-h-screen confetti-bg flex flex-col">
      {/* Header */}
      <motion.div
        className="px-4 pt-6 pb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground mb-4 text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-4 kid-card p-5">
          <div
            className={`w-16 h-16 rounded-full border-4 flex items-center justify-center text-4xl ${getAvatarBg(child.avatar)}`}
          >
            {child.avatar}
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-foreground">
              Hi {child.name}! 👋
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-display font-bold text-2xl text-green-600">
                {formatMoney(child.balance)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex-1 px-4 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4 rounded-2xl h-12 bg-muted">
            <TabsTrigger
              value="chores"
              className="flex-1 rounded-xl font-display font-bold text-base"
            >
              🏠 My Chores
            </TabsTrigger>
            <TabsTrigger
              data-ocid="child_view.tab"
              value="earnings"
              className="flex-1 rounded-xl font-display font-bold text-base"
            >
              💵 My Earnings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chores">
            {loadingChores ? (
              <div
                data-ocid="child_view.loading_state"
                className="flex justify-center py-12"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : chores.length === 0 ? (
              <div
                data-ocid="child_view.empty_state"
                className="text-center py-12 kid-card"
              >
                <p className="text-5xl mb-3">🌱</p>
                <p className="font-display text-xl font-bold">No chores yet!</p>
                <p className="text-muted-foreground mt-1">
                  Ask a parent to add some chores.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {chores.map((chore, i) => (
                  <ChoreCard
                    key={chore.id.toString()}
                    chore={chore}
                    index={i}
                    childId={child.id.toString()}
                    pendingCompletions={allCompletions}
                    onMark={handleMark}
                    isMarking={markComplete.isPending}
                    markingId={markingId}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="earnings">
            {loadingHistory ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : transactions.length === 0 ? (
              <div
                data-ocid="earnings.empty_state"
                className="text-center py-12 kid-card"
              >
                <p className="text-5xl mb-3">💰</p>
                <p className="font-display text-xl font-bold">
                  No earnings yet!
                </p>
                <p className="text-muted-foreground mt-1">
                  Complete some chores to earn money!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {transactions.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 ${
                      tx.type === "earned"
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-foreground">
                        {tx.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimestamp(tx.timestamp)}
                      </p>
                    </div>
                    <span
                      className={`font-display font-black text-xl ${tx.type === "earned" ? "text-green-600" : "text-red-600"}`}
                    >
                      {tx.type === "earned" ? "+" : "-"}
                      {formatMoney(tx.amount)}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

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
