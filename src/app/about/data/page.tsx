import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Data Sources',
  description: 'How the data at Hierarchy.Directory was collected, maintained, and sourced.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="font-display text-2xl font-semibold text-text-primary mb-4">{title}</h2>
      <div className="space-y-4 font-body text-[16px] text-text-primary leading-relaxed">
        {children}
      </div>
    </section>
  )
}

export default function DataSourcesPage() {
  return (
    <div className="mx-auto max-w-[700px] px-6 py-16 md:py-20">

      <h1 className="font-display text-5xl font-semibold text-text-primary mb-12 md:text-6xl">
        Data Sources
      </h1>

      <Section title="How the data was collected">
        <p>
          Hierarchy.Directory&rsquo;s dataset was built in stages. First we used the Wikidata API to build a
          foundation of bishops who have some relation to the United States and cross-referenced them with{' '}
          <a
            href="https://www.catholic-hierarchy.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-burgundy hover:underline underline-offset-2"
          >
            Catholic&#8209;Hierarchy.org
          </a>{' '}
          — David M. Cheney&rsquo;s extraordinary database representing over two decades of research. These
          imports provided the foundation: bishop identities, career timelines, consecration lineage,
          portraits, and diocese metadata.
        </p>
        <p>
          Automated imports are imperfect. We then spent considerable time auditing and correcting the data
          by hand — fixing assignment conflicts, verifying dates against primary sources, and ensuring
          accuracy. Our methodology is scalable, but not bulletproof.{' '}
          <Link href="/contact" className="text-burgundy hover:underline underline-offset-2">
            You can report data issues here.
          </Link>
        </p>
      </Section>

      <Section title="How the data is maintained">
        <p>
          Now that the historical baseline has been audited and verified, ongoing updates are done manually.
          The Church is alive — when Rome announces a new appointment or retirement, we add it by hand. The
          same goes for the death of a bishop. This is deliberate — automated pipelines are good for
          bootstrapping a dataset, but the Church&rsquo;s data deserves the care of human attention.
        </p>
        <p>
          As we expand to cover more dioceses worldwide, we will use a mix of methods — automated imports
          from Wikidata for the initial scaffold, structured imports from other open datasets where available,
          and manual curation to ensure accuracy. We will always note our sources.
        </p>
      </Section>

      <Section title="Sources we consult">
        <p className="font-body text-sm text-text-tertiary uppercase tracking-wide font-semibold">Sources</p>
        <p className="leading-loose">
          <a href="https://www.wikidata.org" target="_blank" rel="noopener noreferrer" className="text-burgundy hover:underline underline-offset-2">Wikidata</a>
          {' · '}
          <a href="https://www.catholic-hierarchy.org" target="_blank" rel="noopener noreferrer" className="text-burgundy hover:underline underline-offset-2">Catholic&#8209;Hierarchy.org</a>
          {' · '}
          <a href="https://www.usccb.org/offices/directory-bishops" target="_blank" rel="noopener noreferrer" className="text-burgundy hover:underline underline-offset-2">USCCB Directory</a>
          {' · '}
          <a href="https://press.vatican.va" target="_blank" rel="noopener noreferrer" className="text-burgundy hover:underline underline-offset-2">Vatican Press Office</a>
          {' · '}
          Diocesan websites
          {' · '}
          The Official Catholic Directory
          {' · '}
          The Annuario Pontificio
          {' · '}
          <a href="https://gcatholic.org" target="_blank" rel="noopener noreferrer" className="text-burgundy hover:underline underline-offset-2">GCatholic.org</a>
          {' · '}
          us_diocese_mapper (county-to-diocese mapping)
        </p>
      </Section>

      <Section title="About the data">
        <p>
          All factual data on this site — names, dates, assignments, and structural information — is
          published under{' '}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/deed.en"
            target="_blank"
            rel="noopener noreferrer"
            className="text-burgundy hover:underline underline-offset-2"
          >
            CC0 (public domain)
          </a>
          .{' '}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/deed.en"
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://licensebuttons.net/p/zero/1.0/88x31.png"
              alt="CC0"
              className="inline-block align-middle ml-1"
              width={88}
              height={31}
            />
          </a>{' '}
          You are free to use, share, and build upon this data for any purpose without permission or
          attribution, though attribution is appreciated.
        </p>
        <p>
          Portraits and images are the property of their respective copyright owners and are used for
          informational and reference purposes. They are not covered by CC0. Photo credits and license
          information are displayed beneath each portrait where available. The majority of portraits are
          sourced from{' '}
          <a
            href="https://commons.wikimedia.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-burgundy hover:underline underline-offset-2"
          >
            Wikimedia Commons
          </a>{' '}
          under Creative Commons licenses.
        </p>
      </Section>

      <Section title="Accuracy &amp; corrections">
        <p>
          This site is maintained by a single individual and errors are inevitable. If you notice incorrect
          information, a missing record, or have documentation that could improve the data, please{' '}
          <Link href="/contact" className="text-burgundy hover:underline underline-offset-2">contact us</Link>
          {' '}or email{' '}
          <a href="mailto:info@hierarchy.directory" className="text-burgundy hover:underline underline-offset-2">
            info@hierarchy.directory
          </a>
          . Corrections sourced to authoritative references are especially welcome.
        </p>
        <p>
          If you believe an image is being used without proper authorization, please{' '}
          <Link href="/contact" className="text-burgundy hover:underline underline-offset-2">contact us</Link>
          {' '}with the specific image and any relevant ownership information, and we will promptly review
          and remove it if necessary.
        </p>
      </Section>

      <Section title="For diocesan representatives">
        <p>
          If you are a communications director, chancellor, or other representative of an (arch)diocese or
          bishop listed in this directory, we welcome your contributions. We are happy to include official
          portraits, updated biographical information, or corrections to existing records. Submitted
          portraits will be credited to your (arch)diocese and displayed with appropriate attribution.
        </p>
        <p>
          To contribute, please{' '}
          <Link href="/contact" className="text-burgundy hover:underline underline-offset-2">contact us</Link>
          {' '}with the subject &ldquo;Portrait Submission&rdquo; or &ldquo;Data Correction.&rdquo;
        </p>
      </Section>

    </div>
  )
}
