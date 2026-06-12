// src/app/privacy/page.tsx
// Privacy Policy — covers data collection, processing, user rights (GDPR/CCPA),
// and the account deletion / right to erasure flow (UM-7).

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — HireRight",
  description:
    "HireRight privacy policy: how we collect, use, and protect your data, and your rights as a user.",
};

const LAST_UPDATED = "June 2026";
const CONTACT_EMAIL = "privacy@hireright.app";
const APP_URL = "https://hireright.app";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10 scroll-mt-6">
      <h2 className="text-lg font-bold text-gray-900 mb-3">{title}</h2>
      <div className="text-sm text-gray-700 leading-relaxed space-y-3">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-base font-bold text-gray-900">
            HireRight
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400">Last updated: {LAST_UPDATED}</p>
        </div>

        {/* TOC */}
        <nav className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-10 text-sm">
          <p className="font-semibold text-gray-700 mb-3">Contents</p>
          <ol className="space-y-1.5 text-blue-600">
            {[
              ["what-we-collect", "1. Information We Collect"],
              ["how-we-use", "2. How We Use Your Information"],
              ["sharing", "3. Information Sharing"],
              ["retention", "4. Data Retention"],
              ["rights", "5. Your Rights (GDPR / CCPA)"],
              ["deletion", "6. Account Deletion & Right to Erasure"],
              ["cookies", "7. Cookies"],
              ["security", "8. Security"],
              ["children", "9. Children's Privacy"],
              ["changes", "10. Changes to This Policy"],
              ["contact", "11. Contact"],
            ].map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="hover:underline">
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="prose-sm max-w-none">
          <p className="text-sm text-gray-700 leading-relaxed mb-8">
            HireRight (&quot;HireRight,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates{" "}
            <a href={APP_URL} className="text-blue-600 hover:underline">
              hireright.app
            </a>
            . This Privacy Policy explains how we collect, use, disclose, and safeguard your
            information when you use our platform. Please read this policy carefully. If you
            disagree with its terms, please discontinue use of the platform.
          </p>

          <Section id="what-we-collect" title="1. Information We Collect">
            <p>
              <strong>Account information.</strong> When you create an account, we collect your
              email address, display name, and password (hashed by Supabase Auth — we never see
              plaintext passwords).
            </p>
            <p>
              <strong>Profile information.</strong> Optionally: company name, industry, and team
              size. You may choose to withhold company name using Anonymous Mode.
            </p>
            <p>
              <strong>Discovery session data.</strong> Responses you provide during PROFIT
              discovery sessions, including your business goals, team structure, and hiring
              intentions.
            </p>
            <p>
              <strong>Usage data.</strong> We collect standard server logs (IP address, browser
              type, pages visited, timestamps). This data is used for security monitoring and
              product improvement.
            </p>
            <p>
              <strong>Email preferences.</strong> Which types of automated emails you have opted
              into or out of.
            </p>
          </Section>

          <Section id="how-we-use" title="2. How We Use Your Information">
            <p>We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide and operate the HireRight platform</li>
              <li>Generate your strategic hiring roadmap using the PROFIT method</li>
              <li>Send transactional emails (account confirmation, password reset, report delivery)</li>
              <li>
                Send automated follow-up emails if you opted in (you can opt out at any time — see
                Section 5)
              </li>
              <li>Allow the admin team to view sessions and provide support</li>
              <li>Analyze aggregate usage patterns to improve the product</li>
            </ul>
            <p>
              We do not sell your personal information to third parties. We do not use your
              session data to train AI models without your explicit consent.
            </p>
          </Section>

          <Section id="sharing" title="3. Information Sharing">
            <p>
              <strong>Service providers.</strong> We share data with trusted third-party services
              necessary to operate HireRight:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Supabase</strong> — database, authentication, and edge function hosting
                (data stored in us-east-1)
              </li>
              <li>
                <strong>Anthropic</strong> — AI processing of your PROFIT discovery responses to
                generate your roadmap
              </li>
              <li>
                <strong>Resend</strong> — transactional email delivery
              </li>
              <li>
                <strong>Vercel</strong> — frontend hosting and CDN
              </li>
            </ul>
            <p>
              <strong>Legal requirements.</strong> We may disclose information if required by law,
              subpoena, or other legal process, or if we believe disclosure is necessary to protect
              the rights, property, or safety of HireRight, our users, or the public.
            </p>
            <p>
              <strong>Business transfer.</strong> If HireRight is acquired or merged, your
              information may be transferred as a business asset, subject to the same privacy
              commitments.
            </p>
          </Section>

          <Section id="retention" title="4. Data Retention">
            <p>
              We retain your account and session data for as long as your account is active or as
              needed to provide services. You may request deletion at any time (see Section 6).
            </p>
            <p>
              Server logs are retained for 90 days and then deleted. Aggregated, anonymized
              analytics data may be retained indefinitely.
            </p>
          </Section>

          <Section id="rights" title="5. Your Rights (GDPR / CCPA)">
            <p>
              Depending on your jurisdiction, you may have the following rights regarding your
              personal data:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Access.</strong> Request a copy of the personal data we hold about you.
              </li>
              <li>
                <strong>Correction.</strong> Update inaccurate or incomplete data via your account
                settings.
              </li>
              <li>
                <strong>Deletion.</strong> Request that we delete your account and all associated
                data (see Section 6).
              </li>
              <li>
                <strong>Data portability.</strong> Request your session data in a structured,
                machine-readable format.
              </li>
              <li>
                <strong>Opt-out of automated emails.</strong> Each automated email includes a
                one-click unsubscribe link. You can also manage preferences in{" "}
                <Link href="/settings/account" className="text-blue-600 hover:underline">
                  Account Settings
                </Link>
                .
              </li>
              <li>
                <strong>Restrict processing.</strong> Request that we stop processing your data
                while a dispute is being resolved.
              </li>
            </ul>
            <p>
              To exercise any of these rights, email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
                {CONTACT_EMAIL}
              </a>
              . We will respond within 30 days.
            </p>
          </Section>

          <Section id="deletion" title="6. Account Deletion & Right to Erasure">
            <p>
              You have the right to delete your HireRight account and all associated data at any
              time. To do so:
            </p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>
                Go to{" "}
                <Link href="/settings/account" className="text-blue-600 hover:underline">
                  Settings → Account
                </Link>
              </li>
              <li>
                Scroll to the &quot;Delete Account&quot; section
              </li>
              <li>Type &quot;DELETE&quot; to confirm and submit</li>
            </ol>
            <p>
              Upon deletion, your account, all PROFIT session data, reports, and admin notes are
              permanently removed. Deletion is irreversible. Aggregate anonymized analytics data
              (with no personal identifiers) may be retained.
            </p>
            <p>
              If you have referred other users, your referral attribution is removed. Their
              accounts remain unaffected.
            </p>
          </Section>

          <Section id="cookies" title="7. Cookies">
            <p>
              HireRight uses cookies solely for authentication session management (via{" "}
              <code className="bg-gray-100 px-1 rounded text-xs">@supabase/ssr</code>). No
              third-party tracking or advertising cookies are used. Session cookies are cleared when
              you sign out.
            </p>
          </Section>

          <Section id="security" title="8. Security">
            <p>
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>TLS encryption in transit</li>
              <li>Row-level security (RLS) on all database tables — users can only access their own data</li>
              <li>Passwords hashed by Supabase Auth (bcrypt)</li>
              <li>No storage of plaintext credentials</li>
              <li>Rate limiting on all API endpoints</li>
            </ul>
            <p>
              No system is 100% secure. If you discover a security vulnerability, please report it
              responsibly to{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>

          <Section id="children" title="9. Children's Privacy">
            <p>
              HireRight is not directed to individuals under 16 years of age. We do not knowingly
              collect personal information from children under 16. If you believe a child has
              provided us information, please contact us and we will delete it promptly.
            </p>
          </Section>

          <Section id="changes" title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy periodically. Material changes will be communicated
              via email to registered users at least 14 days before taking effect. Continued use of
              HireRight after the effective date constitutes acceptance of the updated policy. The
              &quot;Last updated&quot; date at the top of this page reflects the most recent revision.
            </p>
          </Section>

          <Section id="contact" title="11. Contact">
            <p>
              For privacy-related questions, data access requests, or to report concerns, contact
              us at:
            </p>
            <address className="not-italic bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm">
              <strong>HireRight Privacy</strong>
              <br />
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
                {CONTACT_EMAIL}
              </a>
            </address>
            <p className="text-xs text-gray-400 mt-3">
              For EU/EEA residents: We process your data under the lawful basis of contract
              performance (operating the platform) and legitimate interest (product improvement
              and security). You may lodge a complaint with your local data protection authority
              if you believe your rights have been violated.
            </p>
          </Section>
        </div>

        <div className="border-t border-gray-100 pt-8 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">
            ← Back to HireRight
          </Link>
        </div>
      </div>
    </main>
  );
}
