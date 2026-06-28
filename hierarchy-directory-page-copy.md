# Hierarchy Directory — Page Copy

Use this document to build the following pages. Each section below corresponds to a route. Build the pages using the site's existing design system — Cormorant Garamond for headings, Public Sans for body, the warm white background, burgundy accent color, and the same content max-width as the rest of the site. These are all public-facing pages under the (public) layout with the standard header and footer.

---

## About (`/about`)

### Content

Hierarchy.Directory was built out of a want to marry the incredible amount of historical data held in repositories such as [Catholic-Hierarchy.org](https://www.catholic-hierarchy.org/), [GCatholic.org](https://gcatholic.org/), and Wikidata, with a visual representation of the hierarchy.

When I worked in the Church, I was frequently creating "Face Books" of bishops for visits and briefings and always wanted a tool that would do it for me. Now, it exists.

Hierarchy.Directory is an independent project, not affiliated with the USCCB, any (arch)diocese, or the Holy See. It is custom-coded and maintained by a single developer with a background in Catholic institutional communications.

If you find this resource useful, consider [buying me a coffee](https://ko-fi.com/YOURHANDLE).

This site is dedicated to Mary, Queen of Apostles and the Immaculate Conception. *Ora pro nobis!*

### Colophon section

This section should be visually distinct from the text above — treat it as an editorial design piece within the page.

**Weight parade animation:** At the top of the Colophon section, display the word "Hierarchy" in Cormorant Garamond at roughly 80-100px. When the word scrolls into view, animate it through the available weights — starting from the lightest (300) and stepping through each weight up to the heaviest (700), then settling on 600 (SemiBold), which is the weight actually used on the site. The animation should take about 1.5 seconds total, easing into the final weight. Use Intersection Observer to trigger it once when scrolled into view, don't repeat.

**Cormorant Garamond specimen:** Show a full alphabet specimen "Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz" in Cormorant Garamond at 48-60px, in text-tertiary color, spanning the full content width. Then the following paragraph, which should itself be set in Cormorant Garamond (not the default body font):

> Cormorant Garamond, designed by Christian Thalmann, is a display typeface rooted in the sixteenth-century Garamond tradition. Garamond-style typefaces have been the backbone of Catholic publishing for centuries — from papal encyclicals to parish bulletins — and Cormorant is a faithful revival that feels equally at home in a cathedral and on a screen. It is used here for all display typography: bishop names, diocese titles, and page headings.

**Public Sans specimen:** Show the same alphabet specimen treatment "Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz" but in Public Sans at 48-60px, in text-tertiary color. Then the following paragraph in Public Sans (the default body font):

> Public Sans, designed by the United States Web Design System team at the General Services Administration, is a strong, neutral typeface built for clarity and accessibility at any size. Originally created to serve the American public through government digital services, it carries an inherent sense of institutional trustworthiness — appropriate for a directory that aspires to be a reliable public resource. It is used here for body text, metadata, interface elements, and the printed directory exports.

**Colors section** (normal body copy, Public Sans):

> The rank accent colors — scarlet [inline 16px circle swatch in #C41E3A] and amaranth [inline 16px circle swatch in #9F2B68] — reference the zucchetto, the small skullcap worn by bishops and cardinals. Scarlet identifies cardinals; amaranth identifies archbishops and bishops. The mitre in the logo serves as both a symbol of episcopal authority and the letter A in "Hierarchy."

**Closing** (normal body copy):

> Directory data is compiled from publicly available sources and published under [CC0 (public domain)](https://creativecommons.org/publicdomain/zero/1.0/deed.en). A full list of sources is available on the [Data Sources](/about/data) page.

---

## Data Sources (`/about/data`)

This is the page the footer "Learn more here" link points to.

### Content

**Data Sources**

Hierarchy.Directory compiles publicly available information about the bishops and dioceses of the Catholic Church in the United States. The following sources inform the data presented on this site:

**Primary Sources**

*USCCB Directory* — The United States Conference of Catholic Bishops maintains an official directory of all active bishops and dioceses, which serves as the primary reference for current assignments and contact information.

*Vatican Press Office* — Papal appointments, acceptances of resignation, and erections of new dioceses are announced through the Holy See Press Office and the daily bulletin of the *Bollettino*.

*Diocesan Websites* — Individual (arch)diocesan websites publish biographical information about their current and former bishops, cathedral details, and diocesan history.

*The Official Catholic Directory (OCD)* — Published annually, the OCD provides comprehensive data on diocesan boundaries, clergy assignments, and institutional information. It is the standard reference for territorial descriptions used in our diocese-to-county mapping.

**Secondary & Cross-Reference Sources**

*Catholic-Hierarchy.org* — David M. Cheney's comprehensive database is used as a cross-reference for historical dates, assignment sequences, and episcopal lineage data.

*GCatholic.org* — Gabriel Chow's directory serves as an additional cross-reference, particularly for Eastern Catholic and international data.

*Wikidata / Wikipedia* — Used for supplementary biographical details, identifiers, and verification.

*The Annuario Pontificio* — The Vatican's official yearbook of the Catholic Church, published annually, serves as the authoritative source for hierarchical data. It is referenced indirectly through the above sources.

**About the Data**

All factual data on this site — names, dates, assignments, and structural information — is published under [CC0 (public domain)](https://creativecommons.org/publicdomain/zero/1.0/deed.en). You are free to use, share, and build upon this data for any purpose without permission or attribution, though attribution is appreciated.

Portraits and images displayed on this site are the property of their respective copyright owners and are used here for informational and reference purposes. They are not covered by the CC0 dedication and may not be reproduced without permission from the original copyright holder. Photo credits and license information are displayed beneath each portrait where available.

**Accuracy & Corrections**

This site strives for accuracy but is maintained by a single individual and errors are possible. If you notice incorrect information, a missing record, or have documentation that could improve the data, please reach out via the [Contact](/contact) page or email info@hierarchy.directory. Corrections sourced to authoritative references are especially welcome.

If you believe an image on this site is being used without proper authorization, please contact us at info@hierarchy.directory with the specific image and any relevant ownership information, and we will promptly review and remove it if necessary.

**For Diocesan Representatives**

If you are a communications director, chancellor, or other representative of an (arch)diocese or bishop listed in this directory, we welcome your contributions. We are happy to include official portraits, updated biographical information, or corrections to existing records. Submitted portraits will be credited to your (arch)diocese and displayed with appropriate attribution.

To contribute information or an official portrait, please contact us at [info@hierarchy.directory](mailto:info@hierarchy.directory) or use the [Contact](/contact) form with the subject "Data Correction."

---

## Contact (`/contact`)

### Content

**Contact**

For corrections, feedback, or inquiries, email [info@hierarchy.directory](mailto:info@hierarchy.directory) or use the form below.

If you are a representative of an (arch)diocese or bishop and would like to contribute an official portrait or updated information, we'd love to hear from you — please select "Portrait Submission" or "Data Correction" below.

### Contact form

Build a form with the following fields:
- Name (text input, required)
- Email (text input, required)
- Subject (dropdown, required): Data Correction, Portrait Submission, General Inquiry, Partnership, Media, Image Concern, Other
- Message (textarea, required)
- Submit button (burgundy)

On submit, send the form data to info@hierarchy.directory via an API route. Show a success message after sending: "Thank you for your message. We'll get back to you as soon as possible."

### Below the form

Hierarchy.Directory is a free resource maintained in my spare time. If you find it useful, consider [buying me a coffee](https://ko-fi.com/YOURHANDLE).

---

## Privacy (`/privacy`)

### Content

**Privacy Policy**

*Effective date: June 2026*
*Last updated: June 2026*

Hierarchy.Directory ("the Site," "we," "us," or "our") is committed to respecting the privacy of its visitors. This Privacy Policy describes what information we collect, how we use it, and your rights regarding that information.

**1. Information We Collect**

*1.1 Information You Provide.* When you contact us through the contact form or by email, we collect the information you voluntarily submit, including your name, email address, and the content of your message. If you submit a portrait or data correction, we may retain any supporting documentation you provide.

*1.2 Automatically Collected Information.* When you visit the Site, our hosting provider (Vercel) may automatically collect limited technical information, including your IP address, browser type, operating system, referring URL, pages visited, and the date and time of your visit. This information is collected through server logs and basic analytics and is used solely to understand general usage patterns and maintain the performance and security of the Site.

*1.3 Local Storage.* The "Build a Directory" feature stores your bishop selections in your browser's local storage. This data resides entirely on your device, is not transmitted to our servers, and is not accessible to us.

*1.4 Cookies.* The Site does not use cookies for tracking or advertising purposes. Your browser may store minimal technical cookies required for the Site to function (such as session management), but these are not used to identify or profile individual visitors.

**2. How We Use Your Information**

We use the information we collect for the following purposes:

- To respond to inquiries, corrections, or submissions you send through the contact form or email.
- To improve the accuracy and completeness of the directory based on corrections and contributions.
- To monitor and maintain the performance, security, and availability of the Site.
- To understand aggregate usage patterns (e.g., total page views, most-visited pages, geographic distribution of visitors).

We do not use your information for marketing, advertising, profiling, or any purpose unrelated to the operation and improvement of the Site.

**3. Information Sharing and Disclosure**

We do not sell, rent, trade, or otherwise share your personal information with third parties, except in the following limited circumstances:

- *Service Providers.* We use third-party service providers (such as Vercel for hosting and email delivery services for the contact form) that may process data on our behalf. These providers are used solely to operate the Site and are not authorized to use your information for any other purpose.
- *Legal Requirements.* We may disclose your information if required to do so by law, regulation, legal process, or governmental request.

**4. Data Retention**

Contact form submissions and email correspondence are retained for as long as reasonably necessary to respond to your inquiry and maintain a record of corrections and contributions to the directory. You may request deletion of your correspondence by emailing info@hierarchy.directory.

Automatically collected server logs and analytics data are retained in accordance with our hosting provider's standard retention policies.

**5. Data Security**

We take reasonable measures to protect the information collected through the Site. However, no method of transmission over the Internet or electronic storage is completely secure, and we cannot guarantee absolute security.

**6. Children's Privacy**

The Site is not directed at children under the age of 13, and we do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us at info@hierarchy.directory and we will delete it promptly.

**7. Third-Party Links**

The Site contains links to external websites, including Catholic-Hierarchy.org, GCatholic.org, the USCCB, Wikidata, Wikipedia, and individual diocesan websites. We are not responsible for the privacy practices or content of these third-party sites. We encourage you to review the privacy policies of any external site you visit.

**8. Your Rights**

You may request access to, correction of, or deletion of any personal information we hold about you by contacting us at info@hierarchy.directory. We will respond to your request within a reasonable timeframe.

**9. International Visitors**

The Site is hosted in the United States. If you are visiting from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States, where data protection laws may differ from those in your country of residence.

**10. Changes to This Policy**

We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last updated" date. Your continued use of the Site after any changes constitutes your acceptance of the revised policy.

**11. Contact**

If you have questions or concerns about this Privacy Policy, please contact us at [info@hierarchy.directory](mailto:info@hierarchy.directory).

---

## Terms (`/terms`)

### Content

**Terms of Use**

*Effective date: June 2026*
*Last updated: June 2026*

Please read these Terms of Use ("Terms") carefully before using Hierarchy.Directory ("the Site," "we," "us," or "our"). By accessing or using the Site, you agree to be bound by these Terms. If you do not agree to these Terms, you should not use the Site.

**1. Description of Service**

Hierarchy.Directory is a free, independent, informational reference directory of the bishops and dioceses of the Catholic Church in the United States. The Site provides biographical, historical, and structural data compiled from publicly available sources, along with portrait photography and tools for generating custom printable directories.

The Site is not affiliated with, endorsed by, or sponsored by the United States Conference of Catholic Bishops (USCCB), any (arch)diocese, the Holy See, or any other ecclesiastical or governmental entity.

**2. Directory Data and CC0 Dedication**

All factual directory data presented on the Site — including but not limited to names, dates, assignments, titles, diocesan structures, geographic information, and hierarchical relationships — is published under the [Creative Commons CC0 1.0 Universal Public Domain Dedication](https://creativecommons.org/publicdomain/zero/1.0/deed.en).

To the extent possible under law, we have waived all copyright and related rights to this factual data. You are free to copy, modify, distribute, and use this data for any purpose, including commercial purposes, without asking permission or providing attribution, though attribution is appreciated.

This CC0 dedication applies solely to the factual data and does not extend to:
- Portraits, photographs, and images displayed on the Site;
- The Site's design, layout, code, branding, logo, and visual identity;
- The Hierarchy.Directory name and trademark;
- Any third-party content linked to or referenced by the Site.

**3. Portraits and Images**

Portraits and images displayed on the Site are the property of their respective copyright owners, which may include (arch)dioceses, news agencies, photographers, or other rights holders. These images are displayed on the Site for informational and reference purposes.

Images on the Site are not covered by the CC0 dedication described in Section 2 and may not be reproduced, distributed, or used outside of the Site without the permission of the original copyright holder. Photo credits and license information are displayed where available.

If you believe an image on the Site is being used without proper authorization, please contact us at info@hierarchy.directory with the following information: (a) identification of the image in question, including the URL where it appears; (b) your name and contact information; (c) a statement of your ownership or authority to act on behalf of the copyright owner; and (d) a description of the basis for your claim. We will review all such claims promptly and remove or replace images where appropriate.

**4. Generated Directories**

The "Build a Directory" feature allows users to select bishops from the directory and generate custom printable PDF documents. These generated directories are provided for personal, educational, and institutional reference use.

Generated directories may incorporate portraits that are the property of their respective copyright owners. Accordingly, generated directories should not be commercially distributed, sold, or published without obtaining the necessary permissions from the relevant copyright holders.

The factual data contained in generated directories remains subject to the CC0 dedication and may be freely reused.

**5. Accuracy and Disclaimer of Warranties**

While we strive for accuracy, Hierarchy.Directory is an independent project maintained by a single individual. The information presented on the Site may contain errors, omissions, or outdated information.

THE SITE AND ALL INFORMATION, CONTENT, AND MATERIALS CONTAINED HEREIN ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, COMPLETENESS, AND NON-INFRINGEMENT.

Hierarchy.Directory should not be relied upon as the sole or authoritative source for any official, legal, canonical, liturgical, or administrative purpose. Users should verify critical information against primary sources, including the USCCB, the Holy See Press Office, the Official Catholic Directory, and relevant (arch)diocesan offices.

**6. Limitation of Liability**

TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, HIERARCHY.DIRECTORY AND ITS OWNER, OPERATOR, CONTRIBUTORS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR ACCESS TO OR USE OF (OR INABILITY TO ACCESS OR USE) THE SITE, ITS CONTENT, OR ANY GENERATED DIRECTORIES, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), STATUTE, OR ANY OTHER LEGAL THEORY, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THE SITE EXCEED ONE HUNDRED U.S. DOLLARS ($100.00).

**7. Intellectual Property**

The Hierarchy.Directory name, logo (including the mitre mark), and visual identity are the property of Hierarchy.Directory. The Site's design, layout, code, and non-data content are protected by copyright. You may not reproduce, distribute, or create derivative works from these elements without our prior written permission.

The CC0 dedication described in Section 2 applies only to the factual directory data and does not constitute a license or waiver of any rights in the Site's intellectual property.

**8. Third-Party Links and Content**

The Site contains links to third-party websites, including but not limited to Catholic-Hierarchy.org, GCatholic.org, the USCCB, Wikidata, Wikipedia, individual diocesan websites, and Wikimedia Commons. These links are provided for informational purposes only.

We do not control, endorse, or assume responsibility for the content, privacy policies, or practices of any third-party websites. Your use of third-party websites is at your own risk and subject to the terms and policies of those sites.

**9. User Submissions**

By submitting corrections, portraits, biographical information, or other content to Hierarchy.Directory through the contact form, email, or any other means, you represent and warrant that: (a) you have the right to submit such content; (b) the content is accurate to the best of your knowledge; and (c) you grant us a non-exclusive, royalty-free, perpetual, worldwide license to use, display, and incorporate the submitted content into the Site.

If you are submitting a portrait or image, you represent that you are the copyright holder or have obtained the necessary permissions for the image to be displayed on the Site, and you agree that the image will be credited as specified.

**10. Modifications to the Site and Terms**

We reserve the right to modify, suspend, or discontinue the Site (or any part thereof) at any time without notice. We also reserve the right to update these Terms from time to time. Changes will be posted on this page with an updated "Last updated" date.

Your continued use of the Site after any changes to these Terms constitutes your acceptance of the revised Terms. If you do not agree to the revised Terms, you should discontinue your use of the Site.

**11. Governing Law**

These Terms shall be governed by and construed in accordance with the laws of the State of Washington, without regard to its conflict of law principles. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts located in King County, Washington.

**12. Severability**

If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.

**13. Entire Agreement**

These Terms, together with the [Privacy Policy](/privacy), constitute the entire agreement between you and Hierarchy.Directory regarding your use of the Site and supersede all prior or contemporaneous communications, whether oral or written.

**14. Contact**

If you have questions about these Terms, please contact us at [info@hierarchy.directory](mailto:info@hierarchy.directory).
