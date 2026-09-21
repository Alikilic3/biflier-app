import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-2 py-12 sm:px-6 sm:py-16">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        <h1 className="text-lg font-semibold text-neutral-900">Inloggen</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Alleen voor beheerders.
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
