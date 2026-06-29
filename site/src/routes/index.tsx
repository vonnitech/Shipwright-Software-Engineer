import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { readFile } from "node:fs/promises";

const getBusinessName = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cfg = JSON.parse(await readFile("site.json", "utf8")) as {
      businessName?: string;
    };
    return cfg.businessName?.trim() ?? "Shipwright Engineering";
  } catch {
    return "Shipwright Engineering";
  }
});

export const Route = createFileRoute("/")({
  loader: () => getBusinessName(),
  component: Home,
});

function Home() {
  const businessName = Route.useLoaderData();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 dark:bg-gray-950/80 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-xl font-bold tracking-tight">{businessName}</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-sm font-medium text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">Services</a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">How We Work</a>
              <a href="#contact" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all">Get Started</a>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white px-6 py-24 sm:py-32 lg:px-8 dark:bg-gray-950">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl dark:text-white">
              Expert Engineering, <span className="text-indigo-600">Shipped.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
              We build production-quality SaaS products end-to-end. Architecture, backend, frontend, and tests — delivered with the precision of a small, senior team.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a href="#contact" className="rounded-full bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all">
                Start your project
              </a>
              <a href="#services" className="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100">
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="bg-gray-50 py-24 sm:py-32 dark:bg-gray-900/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-indigo-600">Comprehensive Solutions</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                Everything you need to ship.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
                {[
                  {
                    title: 'Architecture',
                    description: 'Scalable, clean, and future-proof systems designed for growth.',
                    icon: '🏗️',
                  },
                  {
                    title: 'Backend',
                    description: 'Robust APIs and server-side logic that power your business logic.',
                    icon: '⚙️',
                  },
                  {
                    title: 'Frontend',
                    description: 'Responsive, accessible, and high-performance user interfaces.',
                    icon: '🎨',
                  },
                  {
                    title: 'Testing',
                    description: 'Full test coverage to ensure long-term stability and confidence.',
                    icon: '🧪',
                  },
                ].map((service) => (
                  <div key={service.title} className="flex flex-col bg-white p-8 rounded-2xl shadow-sm border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                      <span className="text-2xl">{service.icon}</span>
                      {service.title}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-400">
                      <p className="flex-auto">{service.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 sm:py-32 dark:bg-gray-950">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-indigo-600">The Shipwright Way</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                Small team, massive impact.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-3 lg:gap-x-12">
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">1</div>
                    Small & Focused
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-400">No account managers or bloat. You work directly with the senior engineers building your product.</dd>
                </div>
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">2</div>
                    End-to-End Delivery
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-400">From the first line of code to production deployment, we handle every step of the engineering lifecycle.</dd>
                </div>
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900 dark:text-white">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">3</div>
                    Quality-First Mindset
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-400">Clean architecture and thorough code reviews aren't "extras"—they're our standard for every project.</dd>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA Section */}
        <section id="contact" className="relative isolate overflow-hidden bg-indigo-600 px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to build something great?</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-100">
              Tell us about your project and let's see how we can help you ship faster and better.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a href="mailto:hello@shipwright.engineering" className="rounded-full bg-white px-8 py-3 text-base font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all">
                Send us an email
              </a>
            </div>
          </div>
          <svg viewBox="0 0 1024 1024" className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]" aria-hidden="true">
            <circle cx="512" cy="512" r="512" fill="url(#827591b1-ce4c-4110-991d-579766e2d55d)" fillOpacity="0.7" />
            <defs>
              <radialGradient id="827591b1-ce4c-4110-991d-579766e2d55d">
                <stop stopColor="#7775D6" />
                <stop offset="1" stopColor="#E935C1" />
              </radialGradient>
            </defs>
          </svg>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-100 py-12 dark:bg-gray-950 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="text-lg font-bold tracking-tight">{businessName}</span>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} {businessName}. All rights reserved.
            </p>
            <div className="text-sm text-gray-400">
              Built with{" "}
              <a href="https://cto.new" className="underline hover:text-gray-600 transition-colors">
                cto.new
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
