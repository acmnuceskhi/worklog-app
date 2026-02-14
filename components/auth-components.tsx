import { signIn, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function SignIn({ provider }: { provider?: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn(provider);
      }}
    >
      <Button type="submit" variant="secondary">
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
      <Button type="submit" variant="secondary">
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
      <Button type="submit" variant="secondary">
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
      <Button type="submit" variant="primary">
        Sign In with Google
      </Button>
    </form>
  );
}
