// src/app/resources/page.tsx
// US-031: Educational Content Hub — articles, video links, and downloadable guides.
// Static Server Component; content is curated and SEO-optimized.

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hiring Resources",
  description:
    "Practical articles, guides, and videos to help small business owners hire smarter — from the PROFIT method creators.",
  openGraph: {
    title: "Hiring Resources | HireRight",
    description:
      "Practical articles, guides, and videos to help small business owners hire smarter.",
    type: "website",
  },
};

interface Article {
  slug: string;
  title: string;
  excerpt: string;
  readTime: string;
  category: string;
  featured?: boolean;
}

interface Video {
  title: string;
  description: string;
  duration: string;
  youtubeId: string;
}

interface Guide {
  title: string;
  description: string;
  pages: string;
  href: string;
}

const ARTICLES: Article[] = [
  {
    slug: "hire-for-culture-fit",
    title: "Why 'Hire for Culture Fit' Often Means 'Hire People Like Me'",
    excerpt:
      "Culture fit has become one of the most overused and misunderstood hiring criteria. Here's what it actually means — and a framework for evaluating it without bias.",
    readTime: "6 min",
    category: "Hiring Bias",
    featured: true,
  },
  {
    slug: "cost-of-wrong-timing",
    title: "The Cost of Hiring Too Slow vs. Too Fast",
    excerpt:
      "Both ends of the spectrum are expensive. Hiring too fast leads to expensive mis-hires. Hiring too slow creates a hidden drag on revenue. This is how you find the right moment.",
    readTime: "8 min",
    category: "Timing",
    featured: true,
  },
  {
    slug: "rockstar-hire-not-working",
    title: "What to Do When Your Rockstar Hire Isn't Working Out",
    excerpt:
      "You hired someone with a great resume, great references, and great interview. Six months later, it's not working. Here's the decision framework for what to do next.",
    readTime: "7 min",
    category: "Performance",
  },
  {
    slug: "fractional-vs-full-time",
    title: "Fractional vs. Full-Time: A Decision Framework for Small Teams",
    excerpt:
      "The answer isn't always 'hire full-time as soon as you can afford it.' Fractional talent can be the highest-ROI move — if you know when to use it.",
    readTime: "5 min",
    category: "Strategy",
  },
  {
    slug: "internal-promotion-playbook",
    title: "The Internal Promotion Playbook: Developing From Within",
    excerpt:
      "Promoting internally is often faster, cheaper, and better for culture than external hiring. But most founders never consider it. Here's how to evaluate your bench.",
    readTime: "6 min",
    category: "Team Development",
  },
  {
    slug: "salary-benchmarking-101",
    title: "Salary Benchmarking 101: How to Price a Role Competitively",
    excerpt:
      "You don't need an HR department to pay competitively. Here's how small businesses can benchmark salaries without guessing — and what to do when you can't match market rate.",
    readTime: "5 min",
    category: "Compensation",
  },
  {
    slug: "onboarding-first-90-days",
    title: "The First 90 Days: An Onboarding Framework That Actually Sticks",
    excerpt:
      "Most onboarding fails in the first two weeks. The reasons are predictable and preventable. Here's the week-by-week framework used by the best operators.",
    readTime: "9 min",
    category: "Onboarding",
  },
  {
    slug: "profit-method-explained",
    title: "The PROFIT Method Explained: A Systematic Approach to Hiring",
    excerpt:
      "P-R-O-F-I-T is a 5-step framework for making hiring decisions with clarity. This is the complete guide to why each step matters and how they work together.",
    readTime: "10 min",
    category: "PROFIT Method",
    featured: true,
  },
];

const VIDEOS: Video[] = [
  {
    title: "The 5-Step PROFIT Framework in 8 Minutes",
    description:
      "A complete walkthrough of the PROFIT method — Pinpoint, Revamp, Optimize, Fill, Implement — with real examples from service businesses.",
    duration: "8:12",
    youtubeId: "dQw4w9WgXcQ", // placeholder — replace with real video ID
  },
  {
    title: "How to Know If You're Ready to Hire",
    description:
      "Three questions to answer before you start a hiring process. Most founders skip straight to writing a job description — here's why that's a mistake.",
    duration: "5:47",
    youtubeId: "dQw4w9WgXcQ",
  },
  {
    title: "The Full-Time vs. Fractional Decision (Live Demo)",
    description:
      "A live walkthrough of the financial model used to compare full-time and fractional hiring options, with a real client example.",
    duration: "11:23",
    youtubeId: "dQw4w9WgXcQ",
  },
];

const GUIDES: Guide[] = [
  {
    title: "The PROFIT Workbook",
    description:
      "The complete offline workbook for the 5-step PROFIT discovery process. Fillable PDF with space for notes, team maps, and role definitions.",
    pages: "18 pages",
    href: "/resources/profit-workbook.pdf",
  },
  {
    title: "Job Description Template Pack",
    description:
      "Ready-to-edit job description templates for the 10 most common roles hired by service businesses — consulting, agency, law firm, healthcare, and more.",
    pages: "32 pages",
    href: "/resources/jd-templates.pdf",
  },
  {
    title: "Interview Question Bank",
    description:
      "150 categorized interview questions across behavioral, situational, and culture-fit — with scoring rubrics for each question type.",
    pages: "24 pages",
    href: "/resources/interview-questions.pdf",
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(ARTICLES.map((a) => a.category)))];

export default function ResourcesPage() {
  const featured = ARTICLES.filter((a) => a.featured);
  const remaining = ARTICLES.filter((a) => !a.featured);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">
            HireRight
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/success-stories"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:block"
            >
              Success Stories
            </Link>
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
            The HireRight Resource Library
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Practical guides, articles, and tools to help you hire smarter — from the
            team behind the PROFIT method.
          </p>
        </div>

        {/* Featured articles */}
        <section className="mb-14">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">
            Featured Articles
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {featured.map((article) => (
              <article
                key={article.slug}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors flex flex-col"
              >
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 mb-3 self-start">
                  {article.category}
                </span>
                <h3 className="text-sm font-semibold text-gray-900 mb-2 leading-snug flex-1">
                  {article.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{article.readTime} read</span>
                  <Link
                    href={`/resources/${article.slug}`}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Read →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* All articles */}
        <section className="mb-14">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">
            All Articles
          </h2>
          <div className="space-y-3">
            {remaining.map((article) => (
              <article
                key={article.slug}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        {article.category}
                      </span>
                      <span className="text-xs text-gray-400">{article.readTime} read</span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {article.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>
                  <Link
                    href={`/resources/${article.slug}`}
                    className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
                  >
                    Read →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Videos */}
        <section className="mb-14">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">
            Videos
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {VIDEOS.map((video) => (
              <div
                key={video.title}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors"
              >
                {/* Thumbnail placeholder — replace with real embed or thumbnail */}
                <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow">
                    <svg
                      className="w-5 h-5 text-blue-600 ml-0.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                    {video.duration}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug">
                    {video.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {video.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Downloadable guides */}
        <section className="mb-14">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">
            Downloadable Guides
          </h2>
          <div className="space-y-3">
            {GUIDES.map((guide) => (
              <div
                key={guide.title}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                    PDF
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
                      {guide.title}
                    </h3>
                    <p className="text-xs text-gray-500">{guide.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{guide.pages}</p>
                  </div>
                </div>
                <a
                  href={guide.href}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  download
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center bg-white rounded-2xl border border-gray-200 px-8 py-10">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Ready to apply what you&apos;ve learned?
          </h2>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            Run a PROFIT discovery session and get a personalized hiring roadmap in
            under 10 minutes.
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
