import { motion } from "motion/react";
import type { Child } from "../backend.d";

interface LandingPageProps {
  kidList: Child[];
  onParentLogin: () => void;
  onChildSelect: (child: Child) => void;
  isLoggingIn: boolean;
}

const AVATARS = [
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

function getAvatarBg(avatar: string): string {
  const map: Record<string, string> = {
    "🐶": "bg-amber-100 border-amber-300",
    "🦊": "bg-orange-100 border-orange-300",
    "🐱": "bg-pink-100 border-pink-300",
    "🐸": "bg-green-100 border-green-300",
    "🦄": "bg-purple-100 border-purple-300",
    "🐼": "bg-gray-100 border-gray-300",
    "🐻": "bg-amber-100 border-amber-300",
    "🐨": "bg-slate-100 border-slate-300",
    "🐯": "bg-orange-100 border-orange-300",
    "🦁": "bg-yellow-100 border-yellow-300",
    "🐧": "bg-sky-100 border-sky-300",
    "🐺": "bg-slate-100 border-slate-300",
  };
  return map[avatar] || "bg-yellow-100 border-yellow-300";
}

export default function LandingPage({
  kidList,
  onParentLogin,
  onChildSelect,
  isLoggingIn,
}: LandingPageProps) {
  return (
    <div className="min-h-screen confetti-bg flex flex-col items-center justify-start px-4 py-8">
      {/* Header */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="text-6xl mb-3">⭐</div>
        <h1 className="font-display text-4xl md:text-5xl font-black text-foreground leading-tight">
          Chore Chart
        </h1>
        <p className="font-display text-2xl md:text-3xl font-bold text-kid-teal mt-1">
          & Allowance Tracker
        </p>
        <p className="text-muted-foreground mt-2 text-lg">
          Earn dollars for doing great work! 💵
        </p>
      </motion.div>

      {/* Two big buttons */}
      <motion.div
        className="flex flex-col sm:flex-row gap-4 w-full max-w-sm mb-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
      >
        <button
          type="button"
          data-ocid="landing.parent_button"
          onClick={onParentLogin}
          disabled={isLoggingIn}
          className="flex-1 flex flex-col items-center gap-2 bg-primary text-primary-foreground font-display font-bold text-xl rounded-3xl py-6 px-4 shadow-lg bouncy border-4 border-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="text-3xl">👨‍👩‍👧‍👦</span>
          <span>{isLoggingIn ? "Signing in…" : "I'm a Parent"}</span>
          <span className="text-sm font-normal opacity-75">
            Login to manage
          </span>
        </button>

        <button
          type="button"
          data-ocid="landing.kid_button"
          onClick={() => {
            const section = document.getElementById("kid-select");
            section?.scrollIntoView({ behavior: "smooth" });
          }}
          className="flex-1 flex flex-col items-center gap-2 bg-kid-teal text-white font-display font-bold text-xl rounded-3xl py-6 px-4 shadow-lg bouncy border-4 border-teal-400"
        >
          <span className="text-3xl">🌟</span>
          <span>I'm a Kid!</span>
          <span className="text-sm font-normal opacity-75">Pick your name</span>
        </button>
      </motion.div>

      {/* Kid selection grid */}
      <motion.section
        id="kid-select"
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {kidList.length === 0 ? (
          <div
            data-ocid="child_select.empty_state"
            className="text-center py-12 kid-card"
          >
            <p className="text-5xl mb-4">🏠</p>
            <p className="font-display text-xl font-bold text-foreground">
              No kids added yet!
            </p>
            <p className="text-muted-foreground mt-1">
              A parent needs to add children first.
            </p>
          </div>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold text-center text-foreground mb-4">
              Who are you? 👇
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {kidList.map((child, index) => (
                <motion.button
                  key={child.id.toString()}
                  type="button"
                  data-ocid={`child_select.item.${index + 1}`}
                  onClick={() => onChildSelect(child)}
                  className={`flex flex-col items-center gap-2 p-5 rounded-3xl border-4 ${getAvatarBg(child.avatar)} shadow-md bouncy font-display font-bold text-lg text-foreground`}
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.07 }}
                >
                  <span className="text-5xl">
                    {child.avatar || AVATARS[index % AVATARS.length]}
                  </span>
                  <span className="truncate w-full text-center">
                    {child.name}
                  </span>
                  <span className="text-base font-normal text-muted-foreground">
                    ${(Number(child.balance) / 100).toFixed(2)}
                  </span>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </motion.section>

      {/* Footer */}
      <footer className="mt-auto pt-12 pb-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()}. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

export { getAvatarBg, AVATARS };
