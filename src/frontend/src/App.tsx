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
  | { type: "profile-setup" };

export default function App() {
  const { identity, login, clear, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: isAdmin, isLoading: loadingAdmin } = useIsAdmin();
  const { data: profile, isLoading: loadingProfile } = useCallerProfile();
  const { data: children = [] } = useListChildren();

  const [view, setView] = useState<AppView>({ type: "landing" });

  // After login, check admin + profile
  useEffect(() => {
    if (isAuthenticated && !loadingAdmin && !loadingProfile) {
      if (isAdmin) {
        if (!profile || !profile.name) {
          setView({ type: "profile-setup" });
        } else {
          setView({ type: "parent" });
        }
      }
    }
  }, [isAuthenticated, isAdmin, profile, loadingAdmin, loadingProfile]);

  // If not authenticated, return to landing
  useEffect(() => {
    if (!isAuthenticated && !isInitializing) {
      setView((prev) => {
        if (prev.type === "parent" || prev.type === "profile-setup") {
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

  // Global loading state
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
      </AnimatePresence>
    </>
  );
}
