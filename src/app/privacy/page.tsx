import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Hierarchy.Directory',
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-2xl font-semibold text-text-primary mt-10 mb-3">
      {children}
    </h2>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-body text-[16px] text-text-primary leading-relaxed mb-3">
      {children}
    </p>
  )
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="font-body text-[16px] text-text-primary leading-relaxed">
      {children}
    </li>
  )
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[700px] px-6 py-16 md:py-20">
      <div>
        <h1 className="font-display text-5xl font-semibold text-text-primary mb-3 text-center md:text-6xl">Privacy Policy</h1>
        <p className="font-body text-[14px] text-text-tertiary mb-10 space-x-4 text-center">
          <span>Effective date: June 2026</span>
          <span>&bull;</span>
          <span>Last updated: June 2026</span>
        </p>

        <P>
          Hierarchy.Directory (&ldquo;the Site,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is committed to
          respecting the privacy of its visitors. This Privacy Policy describes what information we collect,
          how we use it, and your rights regarding that information.
        </P>

        <H2>1. Information We Collect</H2>
        <P>
          <em>1.1 Information You Provide.</em> When you contact us through the contact form or by email, we
          collect the information you voluntarily submit, including your name, email address, and the content
          of your message. If you submit a portrait or data correction, we may retain any supporting
          documentation you provide.
        </P>
        <P>
          <em>1.2 Automatically Collected Information.</em> When you visit the Site, our hosting provider
          (Vercel) may automatically collect limited technical information, including your IP address, browser
          type, operating system, referring URL, pages visited, and the date and time of your visit. This
          information is collected through server logs and basic analytics and is used solely to understand
          general usage patterns and maintain the performance and security of the Site.
        </P>
        <P>
          <em>1.3 Local Storage.</em> The &ldquo;Build a Directory&rdquo; feature stores your bishop selections in
          your browser&rsquo;s local storage. This data resides entirely on your device, is not transmitted to our
          servers, and is not accessible to us.
        </P>
        <P>
          <em>1.4 Cookies.</em> The Site does not use cookies for tracking or advertising purposes. Your
          browser may store minimal technical cookies required for the Site to function (such as session
          management), but these are not used to identify or profile individual visitors.
        </P>

        <H2>2. How We Use Your Information</H2>
        <P>We use the information we collect for the following purposes:</P>
        <ul className="list-disc list-outside ml-5 space-y-2 mb-3">
          <Li>To respond to inquiries, corrections, or submissions you send through the contact form or email.</Li>
          <Li>To improve the accuracy and completeness of the directory based on corrections and contributions.</Li>
          <Li>To monitor and maintain the performance, security, and availability of the Site.</Li>
          <Li>To understand aggregate usage patterns (e.g., total page views, most-visited pages, geographic distribution of visitors).</Li>
        </ul>
        <P>
          We do not use your information for marketing, advertising, profiling, or any purpose unrelated to
          the operation and improvement of the Site.
        </P>

        <H2>3. Information Sharing and Disclosure</H2>
        <P>
          We do not sell, rent, trade, or otherwise share your personal information with third parties,
          except in the following limited circumstances:
        </P>
        <ul className="list-disc list-outside ml-5 space-y-2 mb-3">
          <Li>
            <em>Service Providers.</em> We use third-party service providers (such as Vercel for hosting and
            email delivery services for the contact form) that may process data on our behalf. These
            providers are used solely to operate the Site and are not authorized to use your information for
            any other purpose.
          </Li>
          <Li>
            <em>Legal Requirements.</em> We may disclose your information if required to do so by law,
            regulation, legal process, or governmental request.
          </Li>
        </ul>

        <H2>4. Data Retention</H2>
        <P>
          Contact form submissions and email correspondence are retained for as long as reasonably necessary
          to respond to your inquiry and maintain a record of corrections and contributions to the directory.
          You may request deletion of your correspondence by emailing{' '}
          <a href="mailto:info@hierarchy.directory" className="text-burgundy hover:underline underline-offset-2">
            info@hierarchy.directory
          </a>
          .
        </P>
        <P>
          Automatically collected server logs and analytics data are retained in accordance with our hosting
          provider&rsquo;s standard retention policies.
        </P>

        <H2>5. Data Security</H2>
        <P>
          We take reasonable measures to protect the information collected through the Site. However, no
          method of transmission over the Internet or electronic storage is completely secure, and we cannot
          guarantee absolute security.
        </P>

        <H2>6. Children&rsquo;s Privacy</H2>
        <P>
          The Site is not directed at children under the age of 13, and we do not knowingly collect personal
          information from children. If you believe a child has provided us with personal information, please
          contact us at{' '}
          <a href="mailto:info@hierarchy.directory" className="text-burgundy hover:underline underline-offset-2">
            info@hierarchy.directory
          </a>
          {' '}and we will delete it promptly.
        </P>

        <H2>7. Third-Party Links</H2>
        <P>
          The Site contains links to external websites, including Catholic-Hierarchy.org, GCatholic.org, the
          USCCB, Wikidata, Wikipedia, and individual diocesan websites. We are not responsible for the
          privacy practices or content of these third-party sites. We encourage you to review the privacy
          policies of any external site you visit.
        </P>

        <H2>8. Your Rights</H2>
        <P>
          You may request access to, correction of, or deletion of any personal information we hold about
          you by contacting us at{' '}
          <a href="mailto:info@hierarchy.directory" className="text-burgundy hover:underline underline-offset-2">
            info@hierarchy.directory
          </a>
          . We will respond to your request within a reasonable timeframe.
        </P>

        <H2>9. International Visitors</H2>
        <P>
          The Site is hosted in the United States. If you are visiting from outside the United States, please
          be aware that your information may be transferred to, stored, and processed in the United States,
          where data protection laws may differ from those in your country of residence.
        </P>

        <H2>10. Changes to This Policy</H2>
        <P>
          We may update this Privacy Policy from time to time. Changes will be posted on this page with an
          updated &ldquo;Last updated&rdquo; date. Your continued use of the Site after any changes constitutes your
          acceptance of the revised policy.
        </P>

        <H2>11. Contact</H2>
        <P>
          If you have questions or concerns about this Privacy Policy, please contact us at{' '}
          <a href="mailto:info@hierarchy.directory" className="text-burgundy hover:underline underline-offset-2">
            info@hierarchy.directory
          </a>
          .
        </P>
      </div>
    </div>
  )
}
