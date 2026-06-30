import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "~/components/AuthContext";

import appCss from "~/styles/app.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Shipwright Engineering | Production-Quality Software" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  notFoundComponent: () => <div>Page not found</div>,
  component: RootComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <RootDocument>
        <Navbar />
        <Outlet />
      </RootDocument>
    </AuthProvider>
  );
}

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 dark:bg-gray-950/80 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl">S</div>
              <span className="text-xl font-bold tracking-tight">Shipwright</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/board" className="text-sm font-medium text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 [&.active]:text-indigo-600">Board</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-sm font-medium text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 [&.active]:text-indigo-600">Admin</Link>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">Hi, {user.name}</span>
                <button 
                  onClick={logout}
                  className="text-sm font-medium text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                >
                  Logout
                </button>
                <Link 
                  to="/board/submit"
                  className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
                >
                  Submit Request
                </Link>
              </div>
            ) : (
              <Link 
                to="/login"
                className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100"
              >
                Log in <span aria-hidden="true">&rarr;</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
