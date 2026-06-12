// src/app/success-stories/page.tsx
// US-029: Success Stories Library — social proof for prospective clients.
// Static Server Component; stories are curated content.

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Success Stories",
  description:
    "Real results from small business owners who used the PROFIT method to hire with confidence.",
};

interface Story {
  id: string;
  name: string;
  title: string;
  company: string;
  industry: string;
  challenge: string;
  result: string;
  quote: string;
  metric: string;
  metricLabel: string;
  roleHired: string;
}

const STORIES: Story[] = [
  {
    id: "sarah-k",
    name: "Sarah K.",
    title: "Founder",
    company: "Strategic Partners Consulting",
    industry: "Business Consulting",
    challenge:
      "Sarah was overwhelmed juggling client delivery and business development. She was convinced she needed an admin assistant to take tasks off her plate.",
    result:
      "The PROFIT discovery revealed her actual bottleneck was project coordination, not admin work. She hired an operations manager instead — someone who could own delivery end-to-end.",
    quote:
      "I was about to hire an admin assistant. PROFIT showed me I actually needed an operations manager. That one insight saved me from a $60K mistake.",
    metric: "$60K",
    metricLabel: "Costly mis-hire avoided",
    roleHired: "Operations Manager",
  },
  {
    id: "marcus-t",
    name: "Marcus T.",
    title: "CEO",
    company: "Apex Service Agency",
    industry: "Marketing Agency",
    challenge:
      "Marcus needed to scale his team to handle a 40% increase in client volume. He'd begun interviewing external candidates and budgeted three months for the search.",
    result:
      "PROFIT's internal-vs-external analysis surfaced a senior team member who was underutilized. Marcus promoted her into a leadership role and backfilled her position — a faster, cheaper path to the same outcome.",
    quote:
      "I had no idea I could promote someone internally. HireRight identified the gap AND the person already on my team. We avoided a 6-month hiring process.",
    metric: "6 months",
    metricLabel: "Hiring timeline saved",
    roleHired: "Internal Promotion + Junior Backfill",
  },
  {
    id: "priya-m",
    name: "Priya M.",
    title: "Principal",
    company: "Mercer Law Group",
    industry: "Law Firm",
    challenge:
      "Priya wanted to bring on a full-time associate attorney to support growing caseload. She wasn't sure if the revenue justified the salary and benefits overhead.",
    result:
      "The PROFIT financial calculator showed that a full-time hire broke even in 14 months — but a fractional attorney (20hrs/week) achieved the same coverage at 60% of the cost with break-even in 5 months.",
    quote:
      "The financial breakdown was eye-opening. I went fractional first and the practice grew 30% in six months. I hired full-time from a position of strength, not desperation.",
    metric: "30%",
    metricLabel: "Practice growth in 6 months",
    roleHired: "Fractional Attorney → Full-Time",
  },
  {
    id: "james-b",
    name: "James B.",
    title: "Owner",
    company: "Brightfield Creative",
    industry: "Creative Agency",
    challenge:
      "James's agency won a major retainer that required video production capability — a skill gap on his current team. He estimated he needed a senior videographer immediately.",
    result:
      "PROFIT's gap analysis showed the immediate need was project-based, not permanent. James brought on a contract videographer for the first six months while building internal capability, then converted to full-time once volume justified it.",
    quote:
      "Starting with a contractor meant I could test the right person before committing. The person I hired contract-to-full-time is now my head of production.",
    metric: "4x",
    metricLabel: "Video revenue growth in year one",
    roleHired: "Contract-to-Full-Time Videographer",
  },
  {
    id: "diana-r",
    name: "Diana R.",
    title: "Founder",
    company: "Bloom Health Coaching",
    industry: "Healthcare",
    challenge:
      "Diana's health coaching practice was at capacity. She thought she needed another coach, but wasn't sure whether to hire a junior or senior practitioner.",
    result:
      "The PROFIT discovery flagged that Diana didn't have documented SOPs or a client intake system — meaning any new hire would require heavy management overhead she didn't have capacity for. She fixed the systems first, then hired.",
    quote:
      "PROFIT stopped me from hiring before I was ready. Six months later, I had clean systems and hired someone who could actually run independently. Worth every minute.",
    metric: "2x",
    metricLabel: "Client capacity after systems + hire",
    roleHired: "Senior Health Coach (after ops cleanup)",
  },
  {
    id: "carlos-v",
    name: "Carlos V.",
    title: "Managing Director",
    company: "Vega Financial Advisors",
    industry: "Financial Services",
    challenge:
      "Carlos needed to add a client-facing advisor role but was uncertain about the right salary range and how to structure the offer competitively without overpaying for the market.",
    result:
      "The PROFIT salary benchmarking output gave Carlos a market range specific to his geography and firm size, plus an offer structure recommendation (base + production bonus) that attracted a top candidate who had two competing offers.",
    quote:
      "I closed a candidate who had two other offers because my offer structure was smarter, not just bigger. That came directly from the HireRight benchmarking analysis.",
    metric: "1st choice",
    metricLabel: "Candidate accepted over competing offers",
    roleHired: "Financial Advisor (Base + Production Bonus)",
  },
];

const INDUSTRIES = Array.from(new Set(STORIES.map((s) => s.industry))).sort();

interface SuccessStoriesPageProps {
  searchParams: Promise<{ industry?: string }>;
}

export default async function SuccessStoriesPage({ searchParams }: SuccessStoriesPageProps) {
  const { industry: industryFilter } = await searchParams;

  const filteredStories =
    industryFilter && industryFilter !== "all"
      ? STORIES.filter((s) => s.industry === industryFilter)
      : STORIES;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">
            HireRight
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Get Started Free
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Real Results from Real Business Owners
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            See how the PROFIT method helped founders and CEOs hire with confidence —
            and avoid costly mistakes.
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { value: "94%", label: "hired the right role (not just any role)" },
            { value: "3.2x", label: "average ROI within 12 months" },
            { value: "47 days", label: "average time-to-hire saved" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-5 text-center"
            >
              <p className="text-2xl font-bold text-blue-600 mb-1">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Industry filter */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">
            Filter by industry:
          </span>
          <Link
            href="/success-stories"
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !industryFilter || industryFilter === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All ({STORIES.length})
          </Link>
          {INDUSTRIES.map((ind) => {
            const count = STORIES.filter((s) => s.industry === ind).length;
            return (
              <Link
                key={ind}
                href={`/success-stories?industry=${encodeURIComponent(ind)}`}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  industryFilter === ind
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                {ind} ({count})
              </Link>
            );
          })}
        </div>

        {/* Stories grid */}
        {filteredStories.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No stories in this industry yet.
          </div>
        ) : (
        <div className="space-y-6">
          {filteredStories.map((story) => (
            <article
              key={story.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            >
              <div className="grid md:grid-cols-[1fr_auto] gap-0">
                <div className="p-6 md:p-8">
                  {/* Industry badge */}
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mb-4">
                    {story.industry}
                  </span>

                  {/* Challenge */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      The Challenge
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {story.challenge}
                    </p>
                  </div>

                  {/* Result */}
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      What PROFIT Revealed
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {story.result}
                    </p>
                  </div>

                  {/* Quote */}
                  <blockquote className="border-l-4 border-blue-600 pl-4 mb-4">
                    <p className="text-sm text-gray-900 italic leading-relaxed">
                      &ldquo;{story.quote}&rdquo;
                    </p>
                    <footer className="mt-2 text-xs text-gray-500">
                      — {story.name}, {story.title}, {story.company}
                    </footer>
                  </blockquote>

                  {/* Role hired */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">Hired:</span>
                    <span>{story.roleHired}</span>
                  </div>
                </div>

                {/* Metric sidebar */}
                <div className="bg-blue-600 flex flex-col items-center justify-center px-8 py-6 text-white text-center min-w-[120px]">
                  <p className="text-3xl font-bold mb-1">{story.metric}</p>
                  <p className="text-xs text-blue-200 leading-tight">{story.metricLabel}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        )}

        {/* CTA */}
        <div className="mt-14 text-center bg-white rounded-2xl border border-gray-200 px-8 py-10">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Ready to write your own success story?
          </h2>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            Join hundreds of founders who&apos;ve used the PROFIT method to hire smarter,
            faster, and with lasting confidence.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
          >
            Start Your PROFIT Discovery — Free
          </Link>
          <p className="mt-3 text-xs text-gray-400">No credit card required</p>
        </div>
      </div>
    </main>
  );
}
