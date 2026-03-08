import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSaveCallerProfile } from "../hooks/useQueries";

interface ProfileSetupProps {
  onComplete: () => void;
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [name, setName] = useState("");
  const saveProfile = useSaveCallerProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await saveProfile.mutateAsync({ name: name.trim(), role: "admin" });
      toast.success("Welcome! Your profile is set up. 🎉");
      onComplete();
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  };

  return (
    <div className="min-h-screen confetti-bg flex items-center justify-center px-4">
      <motion.div
        className="w-full max-w-sm kid-card p-8 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="text-5xl mb-4">👋</div>
        <h1 className="font-display font-black text-2xl text-foreground mb-2">
          Welcome, Parent!
        </h1>
        <p className="text-muted-foreground mb-6">
          Let's set up your profile to get started.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <div>
            <Label htmlFor="parent-name" className="font-semibold mb-1 block">
              Your Name
            </Label>
            <Input
              id="parent-name"
              data-ocid="profile.input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="rounded-2xl h-12 text-base"
              required
            />
          </div>
          <Button
            type="submit"
            data-ocid="profile.submit_button"
            disabled={saveProfile.isPending || !name.trim()}
            className="h-12 rounded-2xl font-display font-bold text-base bg-primary text-primary-foreground"
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Get Started! 🚀"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
