import type { Metadata } from "next";
import { LegalPage, LegalSection } from "../legal-page";
import { legal, privacy } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How djmurphy.de handles personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Datenschutz" title="PRIVACY POLICY">
      <p className="text-white/50">Last updated: November 2026</p>

      <LegalSection title="1. Controller">
        <p>
          {legal.name}, {legal.street}, {legal.postalCode} {legal.city},{" "}
          {legal.country}. Email:{" "}
          <a href={`mailto:${legal.email}`} className="underline">
            {legal.email}
          </a>
        </p>
      </LegalSection>

      <LegalSection title="2. Hosting and server logs">
        <p>
          This website is hosted by Vercel Inc. (USA). When you visit it, the
          server processes technical data such as your IP address, the date and
          time, the page requested and your browser type. This is necessary to
          deliver and secure the site (Art. 6(1)(f) GDPR). Transfers to the USA are
          covered by the safeguards the provider offers, such as the EU-US Data
          Privacy Framework or standard contractual clauses.
        </p>
      </LegalSection>

      <LegalSection title="3. Cookies and local storage">
        <p>
          We do not use analytics, advertising or tracking cookies. The site loads
          its fonts from our own server, not from Google. Browser storage is only
          used for the administrator login of the site owner.
        </p>
      </LegalSection>

      <LegalSection title="4. Booking requests">
        <p>
          When you send a booking request we process your name, email address,
          phone number (optional), event type, date, duration, location and
          message. We use them to answer your request and prepare a possible
          booking (Art. 6(1)(b) GDPR).
        </p>
        <p>
          The data is stored in our database at Supabase (hosting region:{" "}
          {privacy.supabaseRegion}). Requests that do not lead to a booking are
          deleted after {privacy.requestRetentionMonths} months. If a booking is
          made, commercial and tax law may require us to keep related records for
          up to 10 years.
        </p>
      </LegalSection>

      <LegalSection title="5. Deposit payments">
        <p>
          Deposits are paid through Stripe Checkout. Your payment details are
          entered on Stripe&apos;s page and never reach our server. We receive the
          payment status and amount. Stripe processes your data under its own
          privacy policy (Art. 6(1)(b) GDPR).
        </p>
      </LegalSection>

      <LegalSection title="6. AI booking assistant">
        <p>
          If you use the chat assistant, the text you type is sent to OpenAI
          (USA) to generate answers. Please do not enter sensitive information
          such as payment details or health data. We do not store the
          conversation on our server, but OpenAI may keep requests for a limited
          time to detect misuse according to its terms. To prevent abuse we count
          requests per visitor using a shortened, hashed form of the IP address.
          Legal basis: Art. 6(1)(b) and (f) GDPR.
        </p>
      </LegalSection>

      <LegalSection title="7. Mixes, videos and images">
        <p>
          Audio, video and cover files are delivered from Cloudflare R2. When you
          play or load them, your browser connects to Cloudflare, which receives
          technical data such as your IP address (Art. 6(1)(f) GDPR).
        </p>
      </LegalSection>

      <LegalSection title="8. Links to social networks">
        <p>
          We link to Instagram (Meta), SoundCloud, YouTube (Google) and TikTok.
          These are plain links. No data is sent to these providers until you click
          one, and from then on their privacy policies apply.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact by email">
        <p>
          If you write to us, we process your message and email address to answer
          you (Art. 6(1)(b) or (f) GDPR).
        </p>
      </LegalSection>

      <LegalSection title="10. Your rights">
        <ul className="list-disc space-y-1 pl-5">
          <li>Access to your data (Art. 15 GDPR)</li>
          <li>Correction (Art. 16) and deletion (Art. 17)</li>
          <li>Restriction of processing (Art. 18)</li>
          <li>Data portability (Art. 20)</li>
          <li>Objection to processing based on legitimate interests (Art. 21)</li>
          <li>Withdrawal of consent at any time (Art. 7(3))</li>
        </ul>
        <p>
          To use these rights, email {legal.email}. You may also complain to a data
          protection authority, for example the state commissioner for data
          protection and freedom of information of North Rhine-Westphalia
          (ldi.nrw.de) or the authority where you live.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes">
        <p>
          We update this policy when the website or the law changes. The current
          version is always on this page.
        </p>
      </LegalSection>
    </LegalPage>
  );
}