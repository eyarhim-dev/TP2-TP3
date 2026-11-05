
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">
        Bienvenue !
      </h1>

      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded bg-blue-600 px-5 py-3 text-white"
        >
          Se connecter
        </Link>

        <Link
          href="/register"
          className="rounded bg-green-600 px-5 py-3 text-white"
        >
          S'inscrire
        </Link>
      </div>
    </main>
  );
}
