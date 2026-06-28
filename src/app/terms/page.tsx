import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Use — Hierarchy.Directory',
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

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[700px] px-6 py-16 md:py-20">
      <div>
        <h1 className="font-display text-5xl font-semibold text-text-primary mb-3 text-center md:text-6xl">Terms of Use</h1>
        <p className="font-body text-[14px] text-text-tertiary mb-10 space-x-4 text-center">
          <span>Effective date: June 2026</span>
          <span>&bull;</span>
          <span>Last updated: June 2026</span>
        </p>

        <P>
          Please read these Terms of Use (&ldquo;Terms&rdquo;) carefully before using Hierarchy.Directory
          (&ldquo;the Site,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By accessing or using the Site, you agree
          to be bound by these Terms. If you do not agree to these Terms, you should not use the Site.
        </P>

        <H2>1. Description of Service</H2>
        <P>
          Hierarchy.Directory is a free, independent, informational reference directory of the bishops and
          dioceses of the Catholic Church in the United States. The Site provides biographical, historical,
          and structural data compiled from publicly available sources, along with portrait photography and
          tools for generating custom printable directories.
        </P>
        <P>
          The Site is not affiliated with, endorsed by, or sponsored by the United States Conference of
          Catholic Bishops (USCCB), any (arch)diocese, the Holy See, or any other ecclesiastical or
          governmental entity.
        </P>

        <H2>2. Directory Data and CC0 Dedication</H2>
        <P>
          All factual directory data presented on the Site — including but not limited to names, dates,
          assignments, titles, diocesan structures, geographic information, and hierarchical relationships —
          is published under the{' '}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/deed.en"
            target="_blank"
            rel="noopener noreferrer"
            className="text-burgundy hover:underline underline-offset-2"
          >
            Creative Commons CC0 1.0 Universal Public Domain Dedication
          </a>
          .
        </P>
        <P>
          To the extent possible under law, we have waived all copyright and related rights to this factual
          data. You are free to copy, modify, distribute, and use this data for any purpose, including
          commercial purposes, without asking permission or providing attribution, though attribution is
          appreciated.
        </P>
        <P>This CC0 dedication applies solely to the factual data and does not extend to:</P>
        <ul className="list-disc list-outside ml-5 space-y-2 mb-3">
          <Li>Portraits, photographs, and images displayed on the Site;</Li>
          <Li>The Site&rsquo;s design, layout, code, branding, logo, and visual identity;</Li>
          <Li>The Hierarchy.Directory name and trademark;</Li>
          <Li>Any third-party content linked to or referenced by the Site.</Li>
        </ul>

        <H2>3. Portraits and Images</H2>
        <P>
          Portraits and images displayed on the Site are the property of their respective copyright owners,
          which may include (arch)dioceses, news agencies, photographers, or other rights holders. These
          images are displayed on the Site for informational and reference purposes.
        </P>
        <P>
          Images on the Site are not covered by the CC0 dedication described in Section 2 and may not be
          reproduced, distributed, or used outside of the Site without the permission of the original
          copyright holder. Photo credits and license information are displayed where available.
        </P>
        <P>
          If you believe an image on the Site is being used without proper authorization, please contact us
          at{' '}
          <a href="mailto:info@hierarchy.directory" className="text-burgundy hover:underline underline-offset-2">
            info@hierarchy.directory
          </a>
          {' '}with the following information: (a) identification of the image in question, including the URL
          where it appears; (b) your name and contact information; (c) a statement of your ownership or
          authority to act on behalf of the copyright owner; and (d) a description of the basis for your
          claim. We will review all such claims promptly and remove or replace images where appropriate.
        </P>

        <H2>4. Generated Directories</H2>
        <P>
          The &ldquo;Build a Directory&rdquo; feature allows users to select bishops from the directory and generate
          custom printable PDF documents. These generated directories are provided for personal, educational,
          and institutional reference use.
        </P>
        <P>
          Generated directories may incorporate portraits that are the property of their respective copyright
          owners. Accordingly, generated directories should not be commercially distributed, sold, or
          published without obtaining the necessary permissions from the relevant copyright holders.
        </P>
        <P>
          The factual data contained in generated directories remains subject to the CC0 dedication and may
          be freely reused.
        </P>

        <H2>5. Accuracy and Disclaimer of Warranties</H2>
        <P>
          While we strive for accuracy, Hierarchy.Directory is an independent project maintained by a single
          individual. The information presented on the Site may contain errors, omissions, or outdated
          information.
        </P>
        <p className="font-body text-[15px] text-text-secondary leading-relaxed mb-3 uppercase tracking-wide">
          The site and all information, content, and materials contained herein are provided on an &ldquo;as
          is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, either express or implied. We
          disclaim all warranties, including but not limited to implied warranties of merchantability,
          fitness for a particular purpose, accuracy, completeness, and non-infringement.
        </p>
        <P>
          Hierarchy.Directory should not be relied upon as the sole or authoritative source for any official,
          legal, canonical, liturgical, or administrative purpose. Users should verify critical information
          against primary sources, including the USCCB, the Holy See Press Office, the Official Catholic
          Directory, and relevant (arch)diocesan offices.
        </P>

        <H2>6. Limitation of Liability</H2>
        <p className="font-body text-[15px] text-text-secondary leading-relaxed mb-3 uppercase tracking-wide">
          To the fullest extent permitted by applicable law, Hierarchy.Directory and its owner, operator,
          contributors, and affiliates shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages, or any loss of profits, data, use, or goodwill, arising out of
          or in connection with your access to or use of (or inability to access or use) the site, its
          content, or any generated directories, whether based on warranty, contract, tort (including
          negligence), statute, or any other legal theory, even if we have been advised of the possibility
          of such damages.
        </p>
        <p className="font-body text-[15px] text-text-secondary leading-relaxed mb-3 uppercase tracking-wide">
          In no event shall our total liability to you for all claims arising out of or related to the site
          exceed one hundred U.S. dollars ($100.00).
        </p>

        <H2>7. Intellectual Property</H2>
        <P>
          The Hierarchy.Directory name, logo (including the mitre mark), and visual identity are the
          property of Hierarchy.Directory. The Site&rsquo;s design, layout, code, and non-data content are
          protected by copyright. You may not reproduce, distribute, or create derivative works from these
          elements without our prior written permission.
        </P>
        <P>
          The CC0 dedication described in Section 2 applies only to the factual directory data and does not
          constitute a license or waiver of any rights in the Site&rsquo;s intellectual property.
        </P>

        <H2>8. Third-Party Links and Content</H2>
        <P>
          The Site contains links to third-party websites, including but not limited to
          Catholic-Hierarchy.org, GCatholic.org, the USCCB, Wikidata, Wikipedia, individual diocesan
          websites, and Wikimedia Commons. These links are provided for informational purposes only.
        </P>
        <P>
          We do not control, endorse, or assume responsibility for the content, privacy policies, or
          practices of any third-party websites. Your use of third-party websites is at your own risk and
          subject to the terms and policies of those sites.
        </P>

        <H2>9. User Submissions</H2>
        <P>
          By submitting corrections, portraits, biographical information, or other content to
          Hierarchy.Directory through the contact form, email, or any other means, you represent and warrant
          that: (a) you have the right to submit such content; (b) the content is accurate to the best of
          your knowledge; and (c) you grant us a non-exclusive, royalty-free, perpetual, worldwide license
          to use, display, and incorporate the submitted content into the Site.
        </P>
        <P>
          If you are submitting a portrait or image, you represent that you are the copyright holder or have
          obtained the necessary permissions for the image to be displayed on the Site, and you agree that
          the image will be credited as specified.
        </P>

        <H2>10. Modifications to the Site and Terms</H2>
        <P>
          We reserve the right to modify, suspend, or discontinue the Site (or any part thereof) at any time
          without notice. We also reserve the right to update these Terms from time to time. Changes will be
          posted on this page with an updated &ldquo;Last updated&rdquo; date.
        </P>
        <P>
          Your continued use of the Site after any changes to these Terms constitutes your acceptance of the
          revised Terms. If you do not agree to the revised Terms, you should discontinue your use of the
          Site.
        </P>

        <H2>11. Governing Law</H2>
        <P>
          These Terms shall be governed by and construed in accordance with the laws of the State of
          Washington, without regard to its conflict of law principles. Any disputes arising under or in
          connection with these Terms shall be subject to the exclusive jurisdiction of the courts located
          in King County, Washington.
        </P>

        <H2>12. Severability</H2>
        <P>
          If any provision of these Terms is found to be unenforceable or invalid, that provision shall be
          limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain
          in full force and effect.
        </P>

        <H2>13. Entire Agreement</H2>
        <P>
          These Terms, together with the{' '}
          <Link href="/privacy" className="text-burgundy hover:underline underline-offset-2">
            Privacy Policy
          </Link>
          , constitute the entire agreement between you and Hierarchy.Directory regarding your use of the
          Site and supersede all prior or contemporaneous communications, whether oral or written.
        </P>

        <H2>14. Contact</H2>
        <P>
          If you have questions about these Terms, please contact us at{' '}
          <a href="mailto:info@hierarchy.directory" className="text-burgundy hover:underline underline-offset-2">
            info@hierarchy.directory
          </a>
          .
        </P>
      </div>
    </div>
  )
}
