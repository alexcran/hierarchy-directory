import type { Metadata } from 'next'
import Link from 'next/link'
import { WeightParade } from './WeightParade'

export const metadata: Metadata = {
  title: 'About',
  description: 'Hierarchy.Directory is an independent visual directory of the Catholic hierarchy — visualizing the bishops and dioceses of the United States with historical data and apostolic lineage.',
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <div className="overflow-hidden">
      <section className="mx-auto max-w-[700px] px-6 py-16 text-center md:py-20">
        <h1 className="mb-10 font-display text-5xl font-semibold text-text-primary md:text-6xl">
          About
        </h1>

        <div className="space-y-5 font-body text-[17px] leading-relaxed text-text-primary">
          <p className="font-body text-base italic text-text-tertiary">
            Currently featuring the bishops and dioceses of the United States.
          </p>
          <p>
            Hierarchy.Directory was built out of a want to marry the incredible amount of historical data held in
            repositories such as{' '}
            <a href="https://www.catholic-hierarchy.org/" target="_blank" rel="noopener noreferrer" className="text-burgundy hover:underline underline-offset-2">
              Catholic-Hierarchy.org
            </a>
            ,{' '}
            <a href="https://gcatholic.org/" target="_blank" rel="noopener noreferrer" className="text-burgundy hover:underline underline-offset-2">
              GCatholic.org
            </a>
            , and Wikidata, with a visual representation of the hierarchy.
          </p>
          <p>
            When I worked in the Church, I was frequently creating &ldquo;Face Books&rdquo; of bishops for visits and
            briefings and always wanted a tool that would do it for me. Now, it exists.
          </p>
          <p>
            Hierarchy.Directory is an independent project, not affiliated with the USCCB, any (arch)diocese, or the Holy
            See. It is custom-coded and maintained by a single developer with a background in Catholic institutional
            communications.
          </p>
          <p>
            If you find this resource useful, consider{' '}
            <a href="https://ko-fi.com/hierarchydirectory" target="_blank" rel="noopener noreferrer" className="text-burgundy hover:underline underline-offset-2">
              buying me a coffee
            </a>
            .
          </p>
          <p>
            This site is dedicated to Mary, Queen of Apostles and the Immaculate Conception.{' '}
            <em>Ora pro nobis!</em>
          </p>
        </div>
      </section>

      <section className="relative left-1/2 w-screen -translate-x-1/2 bg-text-primary px-6 py-20 text-center md:py-28">
        <div className="mx-auto max-w-[1500px]">
          <p className="mb-20 font-body text-[11px] font-semibold uppercase tracking-widest text-background md:mb-24">
            Colophon
          </p>

          <WeightParade />

          <div className="mx-auto mt-16 max-w-[980px] space-y-2 text-background md:mt-20 md:space-y-3">
            <p className="font-display text-[clamp(2rem,4.6vw,2.25rem)] font-normal italic leading-none tracking-[0.015em] md:tracking-[0.13em]">
              Do <span className="font-bold italic">you</span> resolve, for the sake of
            </p>
            <p className="font-display text-[clamp(3.2rem,8.1vw,4.5rem)] font-semibold leading-none tracking-[0.01em] md:tracking-[0.07em]">
              the <span className="text-[0.78em] uppercase tracking-[0.12em]">Lord&apos;s</span> name,
            </p>
            <p className="font-display text-[clamp(1.45rem,3.7vw,1.75rem)] font-light uppercase leading-none tracking-[0.24em] md:tracking-[0.5em]">
              to reach out
            </p>
            <p className="font-display text-[clamp(2.65rem,6.6vw,3rem)] font-light leading-none tracking-[0.01em] md:tracking-[0.145em]">
              <span className="italic">in</span> kindness <span className="italic">and</span> mercy
            </p>
            <p className="font-display text-[clamp(2.2rem,5.5vw,2.5rem)] font-normal leading-none tracking-[0.015em] md:tracking-[0.135em]">
              to the poor, to strangers,
            </p>
            <p className="relative left-1/2 w-screen -translate-x-1/2 px-4 font-display text-[clamp(3.25rem,10vw,5rem)] font-bold leading-[0.85] tracking-[-0.01em]">
              and to all those in need?
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[600px] px-6 py-16 text-center md:py-20">
        <p className="font-display text-[17px] leading-relaxed text-text-primary md:text-lg">
          Cormorant Garamond, designed by Christian Thalmann, is a display typeface rooted in the tradition
          of the sixteenth-century Garamond tradition. Garamond-style typefaces have been the backbone of
          Catholic publishing for centuries — from papal encyclicals to parish bulletins — and Cormorant is a
          faithful revival that feels equally at home in a cathedral and on a screen. It is used here for all
          display typography: bishop names, diocese titles, and page headings.
        </p>
      </section>

      <section className="relative left-1/2 w-screen -translate-x-1/2 px-6 py-14 text-center md:py-20">
        <div className="mx-auto max-w-[1500px]">
          <WeightParade className="font-body text-text-primary">
            Public Sans
          </WeightParade>

          <div className="mx-auto mt-16 max-w-[980px] space-y-2 text-text-tertiary md:mt-20 md:space-y-3">
            <p className="font-body text-[clamp(1.8rem,4.2vw,2rem)] font-light leading-none tracking-[0.04em] md:tracking-[0.31em]">
              Do you resolve,
            </p>
            <p className="font-body text-[clamp(2.45rem,5.9vw,2.75rem)] font-normal leading-none tracking-[0.01em] md:tracking-[0.135em]">
              as a <span className="font-semibold italic">good</span> shepherd,
            </p>
            <p className="font-body text-[clamp(1.55rem,3.8vw,2.25rem)] font-bold uppercase leading-none tracking-[0.18em] md:tracking-[0.3em]">
              To Seek Out
            </p>
            <p className="relative left-1/2 w-screen -translate-x-1/2 px-4 font-body text-[clamp(4rem,14vw,7rem)] font-black uppercase leading-[0.82] tracking-[-0.02em]">
              The Sheep
            </p>
            <p className="font-body text-[clamp(1.4rem,3.5vw,1.75rem)] font-medium uppercase leading-none tracking-[0.22em] md:tracking-[0.4em]">
              Who Stray
            </p>
            <p className="font-body text-[clamp(2.25rem,5.3vw,2.5rem)] font-light italic leading-none tracking-[0.01em] md:tracking-[0.135em]">
              and to gather them
            </p>
            <p className="font-body text-[clamp(3rem,7vw,3.5rem)] font-semibold leading-none tracking-[0.01em] md:tracking-[0.12em]">
              into the Lord&apos;s fold?
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[600px] px-6 pb-20 pt-6 text-center md:pb-28">
        <p className="font-body text-[17px] leading-relaxed text-text-primary md:text-lg">
          Public Sans, designed by the United States Web Design System team at the General Services
          Administration, is a strong, neutral typeface built for clarity and accessibility at any size.
          Originally created to serve the American public through government digital services, it carries an
          inherent sense of institutional trustworthiness — appropriate for a directory that aspires to be a
          reliable public resource. It is used here for body text, metadata, interface elements, and the
          printed directory exports.
        </p>
      </section>

      <section className="mx-auto max-w-[760px] px-6 pb-20 text-center md:pb-28">
        <p className="font-display text-[clamp(1.75rem,4vw,2rem)] italic leading-snug text-text-secondary">
          Do you resolve to pray without ceasing to almighty God for his holy people and to carry out the office
          of High Priest without reproach?
        </p>
      </section>

      <section className="mx-auto max-w-[760px] px-6 pb-20 text-center md:pb-24">
        <p className="font-body text-xs leading-relaxed text-text-tertiary">
          Excerpts from the Promise of the Elect, Ordination of a Bishop, of Priests, and of Deacons, Copyright &copy; 2018,
          International Commission on English in the Liturgy. All Rights Reserved.
        </p>
      </section>

      <section className="mx-auto max-w-[700px] px-6 pb-16 text-center md:pb-24">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex min-h-[200px] flex-col items-center justify-center bg-scarlet p-8 text-white">
            <h2 className="font-display text-4xl font-semibold">Scarlet</h2>
            <p className="mt-2 font-body text-sm font-semibold uppercase tracking-widest text-white/80">#C41E3A</p>
            <p className="mt-6 font-body text-lg">Cardinals</p>
          </div>
          <div className="flex min-h-[200px] flex-col items-center justify-center bg-episcopal-green p-8 text-white">
            <h2 className="font-display text-4xl font-semibold">Episcopal Green</h2>
            <p className="mt-2 font-body text-sm font-semibold uppercase tracking-widest text-white/80">#007A00</p>
            <p className="mt-6 font-body text-lg">Archbishops &amp; Bishops</p>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-[600px] font-body text-[17px] leading-relaxed text-text-primary">
          The rank accent colors — scarlet and episcopal green — reference the galero, the ceremonial hat depicted on a
          bishop&apos;s coat of arms. Scarlet identifies cardinals; green identifies archbishops and bishops.
        </p>

        <p className="mx-auto mt-12 max-w-[600px] font-body text-[17px] leading-relaxed text-text-primary">
          Directory data is compiled from publicly available sources and published under{' '}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/deed.en"
            target="_blank"
            rel="noopener noreferrer"
            className="text-burgundy hover:underline underline-offset-2"
          >
            CC0 (public domain)
          </a>
          . A full list of sources is available on the{' '}
          <Link href="/about/data" className="text-burgundy hover:underline underline-offset-2">
            Data Sources
          </Link>{' '}
          page.
        </p>
      </section>
    </div>
  )
}
