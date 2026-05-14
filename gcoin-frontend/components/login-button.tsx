"use client";

import { usePrivy } from "@privy-io/react-auth";

export default function LoginButton() {
  const { login, logout, authenticated, user } = usePrivy();

  if (authenticated) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm">
          {user?.email?.address || "Connected"}
        </span>

        <button
          onClick={logout}
          className="bg-red-500 px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className="bg-green-500 px-4 py-2 rounded-lg"
    >
      Continue with Google
    </button>
  );
}