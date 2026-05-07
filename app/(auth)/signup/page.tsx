import Link from "next/link";

import { Card } from "@/components/ui/Card";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md">
      <Card className="space-y-3 bg-surface">
        <h1 className="text-3xl font-bold">Create your account</h1>
        <p className="text-sm text-muted">
          Leafwork uses passwordless authentication. Continue to login and request a magic link.
        </p>
        <Link href="/login" className="inline-block rounded-brutal border-2 border-ink bg-accent px-4 py-2 font-bold">
          Go to Login
        </Link>
      </Card>
    </div>
  );
}
