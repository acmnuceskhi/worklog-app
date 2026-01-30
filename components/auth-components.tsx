import { signIn, signOut } from "@/lib/auth";

export function SignIn({ provider }: { provider?: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn(provider);
      }}
    >
      <button className="bg-neutral-700 text-white p-2 rounded-md">
        Sign In with {provider}
      </button>
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
      <button className="bg-neutral-700 text-white p-2 rounded-md">
        Sign Out
      </button>
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
      <button className="bg-neutral-700 text-white p-2 rounded-md">
        Sign In with GitHub
      </button>
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
      <button className="bg-blue-600 text-white p-2 rounded-md">
        Sign In with Google
      </button>
    </form>
  );
}
