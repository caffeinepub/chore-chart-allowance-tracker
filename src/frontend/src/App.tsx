import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Child } from "./backend.d";
import ChildView from "./components/ChildView";
import LandingPage from "./components/LandingPage";
import ParentDashboard from "./components/ParentDashboard";
import ProfileSetup from "./components/ProfileSetup";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  useCallerProfile,
  useIsAdmin,
  useListChildren,
} from "./hooks/useQueries";

type AppView =
  | { type: "landing" }
  | { type: "child"; child: Child }
  | { type: "parent" }
  | { type: "profile-setup" }
  | { type: "not-admin" };

export default function App() {
  const { identity, login, clear, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: isAdmin, isLoading: loadingAdmin } = useIsAdmin();
  const { data: profile, isLoading: loadingProfile } = useCallerProfile();
  const { data: children = [] } = useListChildren();

  const [view, setView] = useState<AppView>({ type: "landing" });

  // After login, navigate based on admin status + profile completeness.
  // We use `identity` (not loginStatus) as the source of truth so that a
  // transient re-initialization of the auth client never resets our view.
  useEffect(() => {
    if (!isAuthenticated || loadingAdmin || loadingProfile) return;
    if (isAdmin) {
      if (!profile || !profile.name) {
        setView({ type: "profile-setup" });
      } else {
        setView({ type: "parent" });
      }
    } else {
      // Authenticated but not an admin yet — show a helpful screen rather
      // than silently falling back to the landing/login page.
      setView({ type: "not-admin" });
    }
  }, [isAuthenticated, isAdmin, profile, loadingAdmin, loadingProfile]);

  // If truly signed out (identity gone), return protected views to landing.
  // Guard: only trigger when isInitializing is stable-false to avoid reacting
  // to the transient re-init that the auth client can emit after login.
  useEffect(() => {
    if (!isAuthenticated && !isInitializing) {
      setView((prev) => {
        if (
          prev.type === "parent" ||
          prev.type === "profile-setup" ||
          prev.type === "not-admin"
        ) {
          return { type: "landing" };
        }
        return prev;
      });
    }
  }, [isAuthenticated, isInitializing]);

  const handleLogout = () => {
    clear();
    setView({ type: "landing" });
  };

  const handleChildSelect = (child: Child) => {
    setView({ type: "child", child });
  };

  const handleBackToLanding = () => {
    setView({ type: "landing" });
  };

  const handleProfileSetupComplete = () => {
    setView({ type: "parent" });
  };

  // Global loading state — only show the spinner during the very first
  // initialisation or while fetching admin/profile after a confirmed login.
  // We deliberately exclude the transient re-init that happens after login
  // (identity is set, so isAuthenticated is already true by then).
  const isGlobalLoading =
    isInitializing || (isAuthenticated && (loadingAdmin || loadingProfile));

  if (isGlobalLoading) {
    return (
      <div className="min-h-screen confetti-bg flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-5xl mb-4">⭐</div>
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="font-display font-bold text-lg text-foreground mt-3">
            Loading…
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Toaster richColors position="top-center" />
      <AnimatePresence mode="wait">
        {view.type === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LandingPage
              kidList={children}
              onParentLogin={login}
              onChildSelect={handleChildSelect}
              isLoggingIn={isLoggingIn}
            />
          </motion.div>
        )}

        {view.type === "child" && (
          <motion.div
            key="child"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <ChildView child={view.child} onBack={handleBackToLanding} />
          </motion.div>
        )}

        {view.type === "parent" && (
          <motion.div
            key="parent"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <ParentDashboard
              onLogout={handleLogout}
              parentName={profile?.name}
            />
          </motion.div>
        )}

        {view.type === "profile-setup" && (
          <motion.div
            key="profile-setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ProfileSetup onComplete={handleProfileSetupComplete} />
          </motion.div>
        )}

        {view.type === "not-admin" && (
          <motion.div
            key="not-admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-screen confetti-bg flex items-center justify-center p-6"
          >
            <div
              className="bg-card border border-border rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
              data-ocid="not-admin.panel"
            >
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="font-display font-bold text-2xl text-foreground mb-2">
                Not Set Up Yet
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                You're logged in, but your account hasn't been set up as a
                parent yet. Ask an existing parent to add you, or contact
                support.
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full bg-primary text-primary-foreground font-semibold rounded-xl py-3 px-6 hover:bg-primary/90 transition-colors"
                data-ocid="not-admin.button"
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
