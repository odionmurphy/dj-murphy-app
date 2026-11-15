import type { Metadata } from "next";
import { LegalPage, LegalSection } from "../legal-page";
import { legal } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Legal notice for djmurphy.de",
};

export default function ImpressumPage() {
  return (
    <LegalPage eyebrow="Legal notice" title="IMPRESSUM">
      <LegalSection title="Information pursuant to § 5 DDG">
        <p>
          {legal.name}
          <br />
          {legal.street}
          <br />
          {legal.postalCode} {legal.city}
          <br />
          {legal.country}
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Email:{" "}
          <a href={`mailto:${legal.email}`} className="underline">
            {legal.email}
          </a>
          {legal.phone && (
            <>
              <br />
              Phone: {legal.phone}
            </>
          )}
        </p>
      </LegalSection>

      {legal.vatId && (
        <LegalSection title="VAT ID">
          <p>VAT identification number pursuant to § 27a UStG: {legal.vatId}</p>
        </LegalSection>
      )}

      {legal.smallBusiness && (
        <LegalSection title="Small business">
          <p>No VAT is charged in accordance with § 19 UStG (small business regulation).</p>
        </LegalSection>
      )}

      <LegalSection title="Responsible for content (§ 18 (2) MStV)">
        <p>
          {legal.name}, {legal.street}, {legal.postalCode} {legal.city}
        </p>
      </LegalSection>

      <LegalSection title="Consumer dispute resolution">
        <p>
          We are neither willing nor obliged to take part in dispute resolution
          proceedings before a consumer arbitration board (§ 36 VSBG).
        </p>
      </LegalSection>

      <LegalSection title="Links to other websites">
        <p>
          Our pages link to external websites such as Instagram, SoundCloud and
          YouTube. We have no influence on their content and are not responsible
          for it. The respective provider is responsible for the content of linked
          pages.
        </p>
      </LegalSection>
    </LegalPage>
  );
}