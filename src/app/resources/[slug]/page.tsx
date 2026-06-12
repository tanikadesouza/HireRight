// src/app/resources/[slug]/page.tsx
// Catch-all article page for /resources/[slug].
// In v1 content is embedded here; v2 will pull from a CMS.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Article {
  slug: string;
  title: string;
  category: string;
  readTime: string;
  excerpt: string;
  body: string; // HTML string
}

// ---------------------------------------------------------------------------
// Article content (curated inline in v1)
// ---------------------------------------------------------------------------
const ARTICLES: Record<string, Article> = {
  "hire-for-culture-fit": {
    slug: "hire-for-culture-fit",
    title: "Why 'Hire for Culture Fit' Often Means 'Hire People Like Me'",
    category: "Hiring Bias",
    readTime: "6 min",
    excerpt:
      "Culture fit has become one of the most overused and misunderstood hiring criteria.",
    body: `<p>Culture fit is one of the most cited reasons for passing on a candidate — and one of the most dangerous hiring criteria a small business can rely on. Left undefined, it becomes a proxy for familiarity: "they're like us," which often means "they share our demographic, background, or personality type."</p>
<h2>What culture fit actually is</h2>
<p>Genuine culture fit is alignment on how work gets done — not who does it. It's about shared operating principles: how decisions are made, how conflict is handled, how people communicate. A candidate can look nothing like your existing team and still be a perfect culture fit. Conversely, someone who "feels like one of us" from day one may operate in ways that quietly undermine how your team functions.</p>
<h2>A better framework: culture contribution</h2>
<p>The most effective hiring teams have shifted from asking "does this person fit our culture?" to "what will this person contribute to our culture?" The first question filters for sameness. The second invites growth.</p>
<p>To operationalize this, define 3–5 specific behaviors that describe how work gets done at your company. Instead of "collaborative," say: "when blocked, escalates to the team within 24 hours rather than working around the problem alone." Interview for those specific behaviors — they're observable and coachable, unlike "vibe."</p>
<h2>Red flags in your hiring process</h2>
<ul>
<li>You've never written down what your culture actually is — you just "know it when you see it"</li>
<li>Your last 5 hires all went to the same school, share the same background, or were referred by the same 2 people</li>
<li>You've passed on strong candidates because they "didn't feel right" without being able to name a specific concern</li>
</ul>
<h2>The PROFIT connection</h2>
<p>In the PROFIT method, the Optimize step is where we examine whether internal team members could grow into needed roles. This same lens applies to external hiring: rather than asking "does this person match our current team?" ask "does this person have the operating principles we need to succeed, even if they challenge our current norms?" The right hire expands what your team can do — they don't just mirror it.</p>`,
  },
  "cost-of-wrong-timing": {
    slug: "cost-of-wrong-timing",
    title: "The Cost of Hiring Too Slow vs. Too Fast",
    category: "Timing",
    readTime: "8 min",
    excerpt:
      "Both ends of the spectrum are expensive. Here's how to find the right moment.",
    body: `<p>Every founder knows the feeling: you wait too long to hire, drown in work, then panic-hire someone who isn't quite right — or you move too fast, bring someone on before you're ready, and spend the next 90 days managing around them instead of letting them help.</p>
<h2>The cost of hiring too slow</h2>
<p>The costs of delayed hiring are real but often invisible. You stop pursuing new clients because you can't service them. You personally carry load that compounds daily. You build a ceiling on your business at the exact moment you're trying to break through it. Opportunity cost rarely shows up on a P&L — which is why founders underestimate it.</p>
<p>The rule of thumb: if you've been thinking about this hire for more than 90 days and the need hasn't gone away, it's real. Start the process.</p>
<h2>The cost of hiring too fast</h2>
<p>Hiring before you're ready is more measurable and more immediately painful. A mis-hire costs 1.5–3× annual salary when you factor in recruiting, onboarding, lost productivity, and replacement. More importantly, it costs you credibility — both with the hire (who deserves a functional environment) and your team (who has to manage around the gap).</p>
<p>You're hiring too fast if: you don't have a clear success metric for this person's first 90 days, you haven't documented what they'll actually own, or you're hiring because you're overwhelmed rather than because the role is clearly defined.</p>
<h2>Finding the right moment</h2>
<p>The PROFIT method's Implement step addresses this directly: before committing to a hire, you define the timeline, budget, and success metrics. That discipline — naming what success looks like before you start — is the forcing function that separates strategic hiring from reactive hiring.</p>
<p>A practical indicator: if you can answer "what will this person own, deliver, and be measured on in 90 days?" with specificity, you're probably ready to hire. If you can't, you need another 2 weeks of clarity before you post the role.</p>`,
  },
  "profit-method-explained": {
    slug: "profit-method-explained",
    title: "The PROFIT Method Explained: A Systematic Approach to Hiring",
    category: "PROFIT Method",
    readTime: "10 min",
    excerpt:
      "A complete guide to the 5-step framework for making hiring decisions with clarity.",
    body: `<p>Most founders approach hiring reactively — they feel a pain, they post a job, they hire the best candidate from a small pool. The PROFIT method is a different operating system: a systematic, 5-step framework that starts with your business goals and works backward to the specific person you need.</p>
<h2>P — Pinpoint Goals</h2>
<p>The first step is clarifying what business outcome you're actually working toward. Not "I need help" — but "I need to increase revenue by 40% this year and the constraint is client delivery capacity." The role flows from the goal. Most founders skip this step and jump straight to "I need a [job title]" — which is how you end up hiring the wrong person for the right problem.</p>
<h2>R — Revamp Team Structure</h2>
<p>Before you look externally, map who is actually on your team and what they're doing versus what they're capable of. This step surfaces internal options you may have missed — and it reveals structural problems (the wrong people in the wrong roles) that a new hire won't solve.</p>
<h2>O — Optimize Roles</h2>
<p>Can anyone on your current team grow into the gap? A promotion, a title change, a shift in responsibilities? Internal development is almost always faster, cheaper, and better for culture than external hiring. This step asks the uncomfortable question before you spend 3 months looking externally.</p>
<h2>F — Fill the Gaps</h2>
<p>Only after you've exhausted internal options do you define the external hire. And you define it precisely: the specific skills, the specific outcomes, whether this is fractional or full-time, and what the competitive salary range is for someone who can actually deliver. Vague job descriptions attract vague candidates.</p>
<h2>I — Implement & Tune</h2>
<p>The final step is the plan: hiring timeline, budget, onboarding structure, and a 90-day success map. It also includes a "readiness check" — do you have the systems and capacity to actually onboard and develop this person? A new hire without a plan is a mis-hire waiting to happen.</p>
<h2>Why it works</h2>
<p>The PROFIT method works because it forces you to answer the right questions in the right order. It separates the decision (who to hire) from the execution (how to hire them), and it surfaces the non-obvious options — internal promotions, fractional arrangements, system fixes — before defaulting to a full-time external search. The result is a hiring decision you can defend, a roadmap your team can execute, and a new hire who lands with clarity about what success looks like.</p>`,
  },
  "fractional-vs-full-time": {
    slug: "fractional-vs-full-time",
    title: "Fractional vs. Full-Time: A Decision Framework for Small Teams",
    category: "Strategy",
    readTime: "5 min",
    excerpt:
      "The answer isn't always 'hire full-time as soon as you can afford it.'",
    body: `<p>The default assumption for most founders is that fractional is a temporary workaround and full-time is the goal. That's wrong. For many roles at many stages of a business, fractional is the strategically superior choice — not a compromise.</p>
<h2>When fractional wins</h2>
<p>Fractional works best when the role is episodic or strategic rather than operational. A fractional CFO reviewing your financials twice a month delivers more value than a full-time bookkeeper doing daily tasks you don't need. A fractional CMO running quarterly strategy and overseeing a contractor team often outperforms a full-time junior marketer who doesn't have the strategic experience to make decisions independently.</p>
<p>The key indicators for fractional: fewer than 20–25 hours per week of steady-state work needed; the role requires senior expertise you can't afford full-time; or your revenue isn't yet stable enough to commit to a full-time salary for 12+ months.</p>
<h2>When full-time wins</h2>
<p>Full-time is right when the role requires daily coordination with your team, when institutional knowledge compounds over time (you need someone who learns your clients, your systems, your preferences), or when you need accountability structures that fractional arrangements don't provide.</p>
<p>Operations roles almost always work better full-time. So do client-facing roles where relationship continuity matters. And any role where "always on" is part of the job description.</p>
<h2>The financial reality check</h2>
<p>Run the numbers honestly. A full-time hire at $70K salary is really $90–95K when you add benefits, employer taxes, and equipment. A fractional at $5K/month is $60K — with no benefits overhead and the flexibility to scale up or down. If you only need 15 hours a week of that expertise, fractional is often the higher-ROI choice.</p>
<p>The PROFIT method's Financial Reality Check calculator runs exactly this comparison with your specific numbers. Use it before you make the call.</p>`,
  },
  "rockstar-hire-not-working": {
    slug: "rockstar-hire-not-working",
    title: "What to Do When Your Rockstar Hire Isn't Working Out",
    category: "Performance",
    readTime: "7 min",
    excerpt:
      "You hired someone great on paper. Six months later, it's not working. Here's what to do.",
    body: `<p>This is one of the most disorienting experiences in business: you hired someone with a strong resume, strong references, and a great interview. Six months later, they're underperforming, and you don't know why — or what to do about it.</p>
<h2>Start with the honest diagnosis</h2>
<p>Before you decide what to do, you need to understand what's actually happening. There are three distinct failure modes, and they have very different solutions:</p>
<p><strong>Wrong role:</strong> The person is capable, but the role isn't what they thought — or what you thought when you hired for it. The skills they have aren't the skills the job actually requires. This is a hiring alignment failure, not a performance failure.</p>
<p><strong>Wrong environment:</strong> The person is capable and the role is right, but they don't have what they need to succeed: unclear expectations, missing tools, no feedback, no mentorship. This is a management failure.</p>
<p><strong>Wrong fit:</strong> The person's operating style genuinely doesn't work in your environment, and it's not fixable through better management or clearer expectations. This is the rarest of the three.</p>
<h2>The 30-day reset</h2>
<p>Before making any personnel decisions, run a 30-day reset. Have one honest conversation where you name what you're observing, ask what they're experiencing, and jointly agree on 3 specific success metrics for the next 30 days. This surfaces whether the problem is information (they didn't know what success looks like), motivation (they know but aren't engaged), or capability (they know, they're trying, but they can't do it).</p>
<p>Most underperformance is in the first category. Founders are often unclear about what they actually need — and unclear expectations produce unclear results.</p>
<h2>When to let go</h2>
<p>After the 30-day reset, if the metrics aren't being met and the conversation isn't changing the trajectory, it's time to make the call. Prolonging a mis-hire is expensive for both of you. A clean, well-supported exit is usually better than another 90 days of managed decline. Handle it with dignity: a clear transition plan, fair severance, and honest communication about why the role wasn't the right match.</p>`,
  },
  "internal-promotion-playbook": {
    slug: "internal-promotion-playbook",
    title: "The Internal Promotion Playbook: Developing From Within",
    category: "Team Development",
    readTime: "6 min",
    excerpt:
      "Promoting internally is often faster, cheaper, and better for culture. Here's how.",
    body: `<p>The instinct to look externally for every open role is deeply embedded in how most founders think about hiring. But internal promotion — developing someone already on your team into a new role — is often the highest-leverage move, and it's systematically underused.</p>
<h2>Why internal promotions outperform external hires</h2>
<p>An internal promotion skips the 60–90 day productivity ramp that every external hire requires. The person already knows your clients, your culture, your systems. They have institutional knowledge that an external hire will spend months acquiring. And internal promotions send a signal to your entire team: growth is available here.</p>
<p>Research consistently shows that internally promoted managers outperform external hires for the first 2 years in a role. The external hire eventually catches up — but you've already paid the cost of the ramp.</p>
<h2>How to evaluate internal candidates</h2>
<p>The question isn't "can they do the job today?" — it's "can they grow into this role in 90 days with the right support?" Look for:</p>
<ul>
<li>Has this person been operating above their current title already?</li>
<li>Do they have adjacent skills that transfer to the new role?</li>
<li>Do they have the relationship capital with the rest of the team to be effective in the new role?</li>
<li>Are they hungry for this? Reluctant promotions rarely work.</li>
</ul>
<h2>The transition plan</h2>
<p>Every internal promotion needs a 30-60-90 day plan that covers: what the old role hand-off looks like (who picks up their current work), what the new role expectations are from day one, what training or coaching they'll get, and how you'll evaluate success in 90 days. Promoting someone without this plan is setting them up to do both jobs badly.</p>`,
  },
  "salary-benchmarking-101": {
    slug: "salary-benchmarking-101",
    title: "Salary Benchmarking 101: How to Price a Role Competitively",
    category: "Compensation",
    readTime: "5 min",
    excerpt:
      "You don't need an HR department to benchmark salaries. Here's how.",
    body: `<p>Small business founders consistently underpay for the talent they need — not because they're cheap, but because they genuinely don't know what the market rate is. This guide fixes that.</p>
<h2>The three data sources that matter</h2>
<p><strong>Levels.fyi / Glassdoor / LinkedIn Salary Insights:</strong> Self-reported data with enough volume to be useful for common roles. Filter by location, company size (small companies for SMB benchmarks), and years of experience.</p>
<p><strong>Recruiter conversations:</strong> Call three recruiters who specialize in the role type and ask them what candidates are accepting right now. This is real-time market data that no database provides.</p>
<p><strong>Competitive job postings:</strong> Search for the role on LinkedIn and Indeed, filter to companies similar in size to yours, and look at what they're posting (many now disclose ranges legally).</p>
<h2>The SMB premium problem</h2>
<p>Small companies can't match the total comp packages of large employers — but they often don't need to. Candidates choose small businesses for ownership, autonomy, mission alignment, and flexibility. The question isn't "can I match Google's comp?" — it's "what is this role worth to a candidate who actually wants to work at a company like mine?"</p>
<p>A strong offer at a small company: competitive base (within 15% of market) + clear growth path + genuine flexibility + meaningful work. That beats an extra $10K at a corporation with bureaucracy and unclear impact.</p>
<h2>Structure the offer strategically</h2>
<p>If your base is below market, compensate with structure: performance bonus tied to clear metrics, additional PTO, a professional development budget, or equity if you're planning for a liquidity event. Candidates can often accept a lower base if the total package — including what they value most — is competitive. Ask them directly what matters most in the offer.</p>`,
  },
  "onboarding-first-90-days": {
    slug: "onboarding-first-90-days",
    title: "The First 90 Days: An Onboarding Framework That Actually Sticks",
    category: "Onboarding",
    readTime: "9 min",
    excerpt:
      "Most onboarding fails in the first two weeks. Here's the week-by-week framework used by the best operators.",
    body: `<p>The single biggest predictor of a hire's long-term performance is how their first 90 days are structured. And most small businesses have no structure at all: the new hire shows up, gets a laptop, gets introduced to the team, and is then largely left to figure things out. This is how you turn a $80K hire into a $100K mistake.</p>
<h2>Week 1: Context, not tasks</h2>
<p>The first week should be almost entirely listening and learning. No deliverables. Your new hire should be meeting every team member, reading through existing documentation, shadowing key workflows, and understanding the business context they're operating in. Their job in week 1 is to form enough of a mental model that they can ask the right questions.</p>
<p>Your job in week 1: be available, over-communicate context, and set explicit expectations about what you want them to learn — not deliver.</p>
<h2>Weeks 2–4: Supervised doing</h2>
<p>Start giving them real work in weeks 2–4, but with close supervision and daily check-ins. The goal is to catch misalignment early — between what you need and what they're delivering, between how they think about the work and how your business actually operates. Small corrections in weeks 2–4 prevent large problems in months 2–3.</p>
<h2>Month 2: Increasing independence</h2>
<p>By month 2, they should be owning specific outputs and operating more independently, with weekly check-ins replacing daily ones. You should be able to see their judgment emerging — how they make decisions when you're not in the room. If you're still making every decision for them in month 2, the ramp is behind schedule.</p>
<h2>Month 3: Full ownership, clear metrics</h2>
<p>Month 3 is when you should see the ROI starting to emerge. They should own at least one clear domain, be operating independently on their core responsibilities, and be able to articulate what success looks like in their role. By the end of month 3, you should know whether this hire is working — or whether you have an early performance conversation ahead of you.</p>`,
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES[slug];
  if (!article) return { title: "Article Not Found" };
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: `${article.title} | HireRight Resources`,
      description: article.excerpt,
      type: "article",
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = ARTICLES[slug];

  if (!article) notFound();

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-lg font-bold text-gray-900">
            HireRight
          </Link>
          <span className="text-gray-300">/</span>
          <Link href="/resources" className="text-sm text-gray-500 hover:text-gray-900">
            Resources
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Meta */}
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {article.category}
          </span>
          <span className="text-xs text-gray-400">{article.readTime} read</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 leading-tight">
          {article.title}
        </h1>

        <p className="text-base text-gray-500 mb-8 leading-relaxed border-b border-gray-200 pb-8">
          {article.excerpt}
        </p>

        {/* Body */}
        <div
          className="prose prose-sm sm:prose max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-a:text-blue-600"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        {/* CTA */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-2xl px-6 py-8 text-center">
          <p className="text-sm font-semibold text-blue-900 mb-1">
            Ready to apply this to your next hire?
          </p>
          <p className="text-xs text-blue-700 mb-4">
            Run a PROFIT discovery and get a personalized strategic roadmap in under 10 minutes.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Start Your PROFIT Discovery — Free
          </Link>
        </div>

        {/* Back to resources */}
        <div className="mt-8 text-center">
          <Link
            href="/resources"
            className="text-sm text-gray-500 hover:text-gray-900 font-medium"
          >
            ← Back to all resources
          </Link>
        </div>
      </div>
    </main>
  );
}
