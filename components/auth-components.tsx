import { signIn, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { GithubIcon, GoogleIcon } from "@/components/ui/brand-icons";

export function SignIn({ provider }: { provider?: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn(provider);
      }}
    >
      <Button type="submit" variant="primary">
        Sign In with {provider}
      </Button>
    </form>
  );
}

export function SignOut() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
      className="w-full"
    >
      <Button
        type="submit"
        variant="danger"
        size="sm"
        aria-label="Sign out of account"
      >
        <LogOut className="mr-2" />
        Sign Out
      </Button>
    </form>
  );
}

export function SignInWithGitHub() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("github");
      }}
    >
      <Button
        type="submit"
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
        aria-label="Sign In with GitHub"
      >
        <GithubIcon className="w-5 h-5" />
        Sign In with GitHub
      </Button>
    </form>
  );
}

export function SignInWithGoogle() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
    >
      <Button
        type="submit"
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
        aria-label="Sign In with Google"
      >
        <GoogleIcon className="w-5 h-5" />
        Sign In with Google
      </Button>
    </form>
  );
}
