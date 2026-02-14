"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserCog } from "lucide-react";

interface TestUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const testUsers: TestUser[] = [
  {
    id: "test-org-owner-1",
    name: "Alice Johnson",
    email: "test-org-owner@dev.local",
    role: "Organization Owner",
  },
  {
    id: "test-team-owner-1",
    name: "Bob Smith",
    email: "test-team-owner@dev.local",
    role: "Team Owner",
  },
  {
    id: "test-member-1",
    name: "Carol Williams",
    email: "test-member@dev.local",
    role: "Team Member",
  },
];

export function TestUserSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  // Only show in development environment
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const handleTestLogin = async (userId: string) => {
    setLoading(userId);
    try {
      await signIn("test", {
        userId: userId,
        callbackUrl: "/home", // Redirect to home page after successful login
      });

      // signIn with callbackUrl will handle the redirect automatically
      // No need to check result or manually reload
    } catch (error) {
      console.error("Test login error:", error);
      alert("Test login error occurred.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-600"
          title="Test User Switcher (Development Only)"
        >
          <UserCog className="mr-2 h-4 w-4" />
          Test Users
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Switch Test User (Development Only)</DialogTitle>
          <p className="text-sm text-white/60">
            Select a test user to switch authentication contexts.
          </p>
        </DialogHeader>
        <div className="space-y-3">
          {testUsers.map((user) => (
            <Button
              key={user.id}
              onClick={() => handleTestLogin(user.id)}
              disabled={loading === user.id}
              className="w-full justify-start h-auto p-3"
              variant="outline"
            >
              <div className="text-left">
                <div className="font-medium">{user.name}</div>
                <div className="text-sm text-white/50">{user.role}</div>
                <div className="text-xs text-white/40">{user.email}</div>
              </div>
              {loading === user.id && (
                <div className="ml-auto">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </div>
              )}
            </Button>
          ))}
        </div>
        <div className="text-xs text-white/50 mt-4 p-2 bg-white/5 rounded">
          ⚠️ This feature is only available in development mode and uses test
          authentication.
        </div>
      </DialogContent>
    </Dialog>
  );
}
