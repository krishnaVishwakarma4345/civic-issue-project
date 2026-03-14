import React          from "react";
import Link           from "next/link";
import { adminDb }    from "@/lib/firebase-admin/config";
import {
  ArrowRight,
  MapPin,
  Bell,
  BarChart3,
  Shield,
  CheckCircle2,
  Clock,
  Users,
  Star,
  ChevronRight,
  Zap,
} from "lucide-react";
import Button from "@/components/ui/Button";

// ─── Static Data ──────────────────────────────────────────────

const FEATURES = [
  {
    icon:        <MapPin size={22} />,
    iconBg:      "bg-blue-50",
    iconColor:   "text-blue-600",
    title:       "Location-Based Reporting",
    description:
      "Auto-detect your GPS location or pin it on the map. Every issue is geotagged for precise tracking and faster resolution.",
  },
  {
    icon:        <Bell size={22} />,
    iconBg:      "bg-yellow-50",
    iconColor:   "text-yellow-600",
    title:       "Real-Time Notifications",
    description:
      "Get instant updates as your issue moves through each stage — from reported to assigned to resolved.",
  },
  {
    icon:        <BarChart3 size={22} />,
    iconBg:      "bg-purple-50",
    iconColor:   "text-purple-600",
    title:       "Analytics Dashboard",
    description:
      "Authorities get powerful analytics — category breakdowns, monthly trends, resolution rates, and department performance.",
  },
  {
    icon:        <Shield size={22} />,
    iconBg:      "bg-primary-50",
    iconColor:   "text-primary-600",
    title:       "Secure & Role-Based",
    description:
      "Firebase Auth with JWT verification. Citizens and admins see only what they need. All routes are protected.",
  },
  {
    icon:        <Zap size={22} />,
    iconBg:      "bg-orange-50",
    iconColor:   "text-orange-600",
    title:       "Image Evidence Upload",
    description:
      "Attach up to 5 images per issue. Files are compressed automatically and stored securely in Firebase Storage.",
  },
  {
    icon:        <Users size={22} />,
    iconBg:      "bg-green-50",
    iconColor:   "text-green-600",
    title:       "Department Assignment",
    description:
      "Admins assign issues to the right department — PWD, sanitation, water board — for targeted resolution.",
  },
];

const STEPS = [
  {
    step:        "01",
    title:       "Create Account",
    description: "Register as a citizen in under 30 seconds. No paperwork.",
  },
  {
    step:        "02",
    title:       "Report an Issue",
    description: "Describe the problem, attach photos, and share your location.",
  },
  {
    step:        "03",
    title:       "Track Progress",
    description: "Watch your issue move through assigned → in-progress → resolved.",
  },
  {
    step:        "04",
    title:       "See the Change",
    description: "Get notified when the issue is fixed. Your city improves.",
  },
];

const CATEGORIES = [
  { emoji: "🛣️", label: "Roads",       count: "2.4K issues" },
  { emoji: "🗑️", label: "Garbage",     count: "1.8K issues" },
  { emoji: "💧", label: "Water",        count: "1.2K issues" },
  { emoji: "💡", label: "Streetlights", count: "890 issues"  },
  { emoji: "🧹", label: "Sanitation",   count: "760 issues"  },
];

const STATS = [
  { value: "50K+",  label: "Issues Reported"   },
  { value: "87%",   label: "Resolution Rate"   },
  { value: "120+",  label: "Cities Covered"    },
  { value: "2.3 days", label: "Avg Resolution" },
];

export const dynamic = "force-dynamic";

type LiveLandingStats = {
  reportedIssues: number;
  resolutionRate: number;
  citiesCovered: number;
  avgResolutionDays: number;
};

const extractCityFromAddress = (address: unknown): string | null => {
  if (typeof address !== "string") return null;
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  // Common pattern: "area, city, state" -> pick city.
  const city = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  return city.toLowerCase();
};

const toMillis = (value: unknown): number | null => {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : null;
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    const date = (value as { toDate: () => Date }).toDate();
    return date.getTime();
  }
  return null;
};

const getLiveLandingStats = async (): Promise<LiveLandingStats | null> => {
  try {
    const issuesCollection = adminDb.collection("issues");

    const [totalSnap, resolvedCountSnap, issuesSnap] = await Promise.all([
      issuesCollection.count().get(),
      issuesCollection.where("status", "==", "resolved").count().get(),
      issuesCollection.select("status", "location", "createdAt", "updatedAt").get(),
    ]);

    const totalIssues = totalSnap.data().count ?? 0;
    const resolvedIssues = resolvedCountSnap.data().count ?? 0;

    const citySet = new Set<string>();
    let totalResolutionDays = 0;
    let resolvedWithDates = 0;

    issuesSnap.forEach((doc) => {
      const data = doc.data() as {
        status?: string;
        location?: { address?: unknown };
        createdAt?: unknown;
        updatedAt?: unknown;
      };

      const city = extractCityFromAddress(data.location?.address);
      if (city) citySet.add(city);

      if (data.status !== "resolved") return;
      const createdMs = toMillis(data.createdAt);
      const updatedMs = toMillis(data.updatedAt);
      if (createdMs === null || updatedMs === null || updatedMs < createdMs) return;

      totalResolutionDays += (updatedMs - createdMs) / (1000 * 60 * 60 * 24);
      resolvedWithDates += 1;
    });

    const resolutionRate = totalIssues > 0
      ? Math.round((resolvedIssues / totalIssues) * 100)
      : 0;

    const avgResolutionDays = resolvedWithDates > 0
      ? Number((totalResolutionDays / resolvedWithDates).toFixed(1))
      : 0;

    return {
      reportedIssues: totalIssues,
      resolutionRate,
      citiesCovered: citySet.size,
      avgResolutionDays,
    };
  } catch (error) {
    console.error("[LandingPage] Failed to fetch live stats:", error);
    return null;
  }
};

const TESTIMONIALS = [
  {
    name:   "Priya Sharma",
    city:   "Mumbai, Maharashtra",
    text:   "The pothole near my street was fixed within 3 days of reporting. I was shocked at how fast it worked!",
    rating: 5,
    avatar: "PS",
  },
  {
    name:   "Rajesh Kumar",
    city:   "Bengaluru, Karnataka",
    text:   "Finally a platform where my complaints don't disappear into a void. The real-time updates are fantastic.",
    rating: 5,
    avatar: "RK",
  },
  {
    name:   "Anita Desai",
    city:   "Pune, Maharashtra",
    text:   "Reported a broken streetlight and got a notification when it was fixed. This is what civic tech should be.",
    rating: 5,
    avatar: "AD",
  },
];

// ─── Page ─────────────────────────────────────────────────────

export default async function LandingPage() {
  const liveStats = await getLiveLandingStats();
  const stats = [
    {
      value:
        liveStats !== null
          ? liveStats.reportedIssues.toLocaleString("en-IN")
          : STATS[0].value,
      label: STATS[0].label,
    },
    {
      value: liveStats !== null ? `${liveStats.resolutionRate}%` : STATS[1].value,
      label: STATS[1].label,
    },
    {
      value: liveStats !== null ? liveStats.citiesCovered.toLocaleString("en-IN") : STATS[2].value,
      label: STATS[2].label,
    },
    {
      value: liveStats !== null ? `${liveStats.avgResolutionDays} days` : STATS[3].value,
      label: STATS[3].label,
    },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* ─── Navbar ──────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="font-bold text-gray-900 text-lg">
                Civic<span className="text-primary-600">Report</span>
              </span>
            </div>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
              <a href="#features"      className="hover:text-primary-600 transition-colors">Features</a>
              <a href="#how-it-works"  className="hover:text-primary-600 transition-colors">How It Works</a>
              <a href="#categories"    className="hover:text-primary-600 transition-colors">Categories</a>
              <a href="#testimonials"  className="hover:text-primary-600 transition-colors">Reviews</a>
            </nav>

            {/* CTA */}
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost"   size="sm">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Get Started
                  <ChevronRight size={14} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-green-50 pt-20 pb-24">
        {/* Background Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-100/40 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-green-100/40 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold mb-6 border border-primary-200">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
              Government of India · Official Platform
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
              Report Civic Issues.{" "}
              <span className="text-primary-600">
                Drive Real Change.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-2xl mx-auto">
              CivicReport connects citizens with local authorities to fix
              roads, garbage, water supply, streetlights, and sanitation
              issues — faster than ever before.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register">
                <Button
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight size={18} />}
                >
                  Sign up
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg">
                  Login to your account
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-primary-500" />
                Free for citizens
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-primary-500" />
                No app download needed
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-primary-500" />
                Secure & encrypted
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ────────────────────────────────────── */}
      <section className="bg-primary-600 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-extrabold text-white">{stat.value}</p>
                <p className="text-primary-200 text-sm font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Categories ───────────────────────────────────── */}
      <section id="categories" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              What Can You Report?
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Five civic issue categories, each routed to the right department automatically.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.label}
                className="bg-white rounded-xl p-5 text-center shadow-card hover:shadow-md hover:border-primary-100 border border-transparent transition-all duration-200 group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-200">
                  {cat.emoji}
                </div>
                <p className="font-semibold text-gray-900 text-sm">{cat.label}</p>
                <p className="text-xs text-gray-400 mt-1">{cat.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-4">
              Platform Features
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Everything You Need to Fix Your City
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Built for citizens who care and authorities who act.
              A complete civic issue management platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl border border-gray-100 hover:border-primary-100 hover:shadow-md transition-all duration-200 group"
              >
                <div className={`w-11 h-11 rounded-xl ${feature.iconBg} ${feature.iconColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────── */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              How CivicReport Works
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              From report to resolution in four simple steps.
            </p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map((step, index) => (
                <div key={step.step} className="relative text-center">
                  {/* Step Number */}
                  <div className="relative z-10 w-20 h-20 rounded-2xl bg-white border-2 border-primary-200 flex flex-col items-center justify-center mx-auto mb-4 shadow-sm">
                    <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">
                      Step
                    </span>
                    <span className="text-2xl font-extrabold text-primary-600 leading-none">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────── */}
      

      {/* ─── CTA Banner ───────────────────────────────────── */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to Make Your City Better?
          </h2>
          <p className="text-primary-200 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of citizens who are already reporting issues and
            driving civic change in their communities.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button
                variant="secondary"
                size="lg"
                rightIcon={<ArrowRight size={18} />}
              >
                Register as Citizen
              </Button>
            </Link>
            <Link href="/login">
              <button className="text-primary-200 hover:text-white text-sm font-medium underline underline-offset-2 transition-colors">
                Already have an account? Sign in →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">C</span>
              </div>
              <span className="font-bold text-white">
                Civic<span className="text-primary-400">Report</span>
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm">
              {["Privacy Policy", "Terms of Service", "Accessibility", "Contact"].map((l) => (
                <Link
                  key={l}
                  href="#"
                  className="hover:text-white transition-colors text-xs"
                >
                  {l}
                </Link>
              ))}
            </div>

            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} Government of India Initiative
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}