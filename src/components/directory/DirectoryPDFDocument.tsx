import { Document, Page, View, Text, Image, Font, StyleSheet } from '@react-pdf/renderer'
import { formatName } from '@/lib/utils/formatName'
import { getRankColor as getSoaColor } from '@/lib/utils/formatTitle'
import type { BishopEntry, DirectoryConfig } from './types'

Font.register({
  family: 'CormorantGaramond',
  fonts: [
    { src: '/fonts/CormorantGaramond-Regular.ttf',        fontWeight: 'normal',   fontStyle: 'normal' },
    { src: '/fonts/CormorantGaramond-SemiBold.ttf',       fontWeight: 'semibold', fontStyle: 'normal' },
    { src: '/fonts/CormorantGaramond-Bold.ttf',           fontWeight: 'bold',     fontStyle: 'normal' },
    { src: '/fonts/CormorantGaramond-Italic.ttf',         fontWeight: 'normal',   fontStyle: 'italic' },
    { src: '/fonts/CormorantGaramond-SemiBoldItalic.ttf', fontWeight: 'semibold', fontStyle: 'italic' },
  ],
})

Font.register({
  family: 'PublicSans',
  fonts: [
    { src: '/fonts/PublicSans-Regular.ttf',  fontWeight: 'normal',   fontStyle: 'normal' },
    { src: '/fonts/PublicSans-SemiBold.ttf', fontWeight: 'semibold', fontStyle: 'normal' },
    { src: '/fonts/PublicSans-Bold.ttf',     fontWeight: 'bold',     fontStyle: 'normal' },
    { src: '/fonts/PublicSans-Italic.ttf',   fontWeight: 'normal',   fontStyle: 'italic' },
  ],
})

// ─── Styles ───────────────────────────────────────────────────────────────────

const COLORS = {
  text:      '#1A1714',
  secondary: '#6B6560',
  tertiary:  '#9C958D',
  burgundy:  '#6B1A2A',
  green:     '#007A00',
  scarlet:   '#C41E3A',
  border:    '#E8E4E0',
  surface:   '#F5F3F0',
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 36,
    paddingTop: 40,
    paddingBottom: 44,
    fontFamily: 'PublicSans',
  },
  coverPage: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 72,
    paddingVertical: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverTitle: {
    fontFamily: 'CormorantGaramond',
    fontSize: 32,
    fontWeight: 'semibold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  coverSubtitle: {
    fontFamily: 'PublicSans',
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  coverDivider: {
    width: 48,
    height: 1,
    backgroundColor: COLORS.burgundy,
    marginVertical: 24,
  },
  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
  },
  // Bishop cell
  cell: {
    padding: 8,
    alignItems: 'center',
  },
  portrait: {
    backgroundColor: COLORS.surface,
  },
  portraitFrame: {
    marginBottom: 6,
  },
  portraitRankBar: {
    height: 4,
  },
  initialsContainer: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontFamily: 'PublicSans',
    fontWeight: 'bold',
    color: COLORS.secondary,
    textTransform: 'uppercase',
  },
  bishopName: {
    fontFamily: 'CormorantGaramond',
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  metaPrimary: {
    fontFamily: 'PublicSans',
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 1,
  },
  metaSecondary: {
    fontFamily: 'PublicSans',
    color: COLORS.tertiary,
    textAlign: 'center',
    marginTop: 1,
  },
  metaItalic: {
    fontFamily: 'PublicSans',
    color: COLORS.tertiary,
    textAlign: 'center',
    marginTop: 1,
    fontStyle: 'italic',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerCenter: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'PublicSans',
    fontSize: 9,
    color: COLORS.secondary,
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(bishop: BishopEntry): string {
  return ((bishop.firstName[0] ?? '') + (bishop.lastName[0] ?? '')).toUpperCase() || '?'
}


function fmtDate(iso: string | null | undefined, prefix = ''): string | null {
  if (!iso) return null
  const d = new Date(iso)
  const s = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return prefix ? `${prefix} ${s}` : s
}

function sortBishops(bishops: BishopEntry[], sort: DirectoryConfig['sort']): BishopEntry[] {
  if (sort === 'manual') return bishops
  const copy = [...bishops]
  if (sort === 'alphabetical') {
    copy.sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName))
  } else if (sort === 'see') {
    copy.sort((a, b) => (a.currentSee ?? '').localeCompare(b.currentSee ?? ''))
  } else if (sort === 'seniority') {
    copy.sort((a, b) => {
      const da = a.episcopalConsDate ? new Date(a.episcopalConsDate).getTime() : Infinity
      const db = b.episcopalConsDate ? new Date(b.episcopalConsDate).getTime() : Infinity
      return da - db
    })
  }
  return copy
}

// ─── Column count and cell size ───────────────────────────────────────────────

const DENSITY_COLS: Record<DirectoryConfig['gridDensity'], number> = {
  large:   3,
  medium:  4,
  compact: 6,
}

const PORTRAIT_SIZE: Record<DirectoryConfig['gridDensity'], { w: number; h: number }> = {
  large:   { w: 96, h: 128 },
  medium:  { w: 72, h: 96 },
  compact: { w: 48, h: 64 },
}

const FONT_SIZE: Record<DirectoryConfig['gridDensity'], { name: number; meta: number; small: number }> = {
  large:   { name: 10, meta: 7.5, small: 7   },
  medium:  { name: 9,  meta: 7,   small: 6.5 },
  compact: { name: 7,  meta: 6,   small: 5.5 },
}

// ─── Bishop Cell ──────────────────────────────────────────────────────────────

function BishopCell({
  bishop,
  colWidth,
  config,
}: {
  bishop: BishopEntry
  colWidth: number
  config: DirectoryConfig
}) {
  const portrait  = PORTRAIT_SIZE[config.gridDensity]
  const fonts     = FONT_SIZE[config.gridDensity]
  const { fields } = config
  const w = colWidth - 16
  const rankColor = bishop.isCardinal ? COLORS.scarlet : COLORS.green

  return (
    <View style={[styles.cell, { width: colWidth }]}>
      {/* Portrait — always shown */}
      <View style={[styles.portraitFrame, { width: portrait.w }]}>
        {bishop.portraitUrl ? (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image src={bishop.portraitUrl} style={[styles.portrait, { width: portrait.w, height: portrait.h }]} />
        ) : (
          <View style={[styles.initialsContainer, { width: portrait.w, height: portrait.h }]}>
            <Text style={[styles.initialsText, { fontSize: portrait.w * 0.25 }]}>
              {getInitials(bishop)}
            </Text>
          </View>
        )}
        <View style={[styles.portraitRankBar, { width: portrait.w, backgroundColor: rankColor }]} />
      </View>

      {/* Style of address — italic, rank color; shown before name */}
      {fields.styleOfAddress && bishop.styleOfAddress && (
        <Text style={[styles.metaItalic, { fontSize: fonts.small, width: w, color: getSoaColor(bishop.isCardinal), marginTop: 2 }]}>
          {bishop.styleOfAddress}
        </Text>
      )}

      {/* Name — always shown */}
      <Text style={[styles.bishopName, { fontSize: fonts.name, width: w }]}>
        {formatName(bishop, { isCardinal: bishop.isCardinal })}
      </Text>

      {/* Current Role group — title then see */}
      {fields.title && bishop.currentTitle && (
        <Text style={[styles.metaPrimary, { fontSize: fonts.meta, width: w }]}>
          {bishop.currentTitle}
        </Text>
      )}
      {fields.diocese && bishop.currentSee && (
        <Text style={[styles.metaPrimary, { fontSize: fonts.meta, width: w }]}>
          {bishop.currentSee}
        </Text>
      )}

      {/* Biographical group */}
      {fields.dateOfBirth && bishop.dateOfBirth && (
        <Text style={[styles.metaSecondary, { fontSize: fonts.small, width: w }]}>
          {fmtDate(bishop.dateOfBirth, 'b.')}
        </Text>
      )}
      {fields.placeOfBirth && bishop.placeOfBirth && (
        <Text style={[styles.metaSecondary, { fontSize: fonts.small, width: w }]}>
          {bishop.placeOfBirth}
        </Text>
      )}
      {fields.dateOfDeath && bishop.dateOfDeath && (
        <Text style={[styles.metaSecondary, { fontSize: fonts.small, width: w }]}>
          {fmtDate(bishop.dateOfDeath, 'd.')}
        </Text>
      )}

      {/* Ordination group */}
      {fields.priestOrdDate && bishop.priestOrdDate && (
        <Text style={[styles.metaSecondary, { fontSize: fonts.small, width: w }]}>
          {fmtDate(bishop.priestOrdDate, 'Ord.')}
        </Text>
      )}
      {fields.priestOrdLocation && bishop.priestOrdLocation && (
        <Text style={[styles.metaSecondary, { fontSize: fonts.small, width: w }]}>
          {bishop.priestOrdLocation}
        </Text>
      )}
      {fields.episcopalConsDate && bishop.episcopalConsDate && (
        <Text style={[styles.metaSecondary, { fontSize: fonts.small, width: w }]}>
          {fmtDate(bishop.episcopalConsDate, 'Cons.')}
        </Text>
      )}
      {fields.episcopalConsLocation && bishop.episcopalConsLocation && (
        <Text style={[styles.metaSecondary, { fontSize: fonts.small, width: w }]}>
          {bishop.episcopalConsLocation}
        </Text>
      )}
      {fields.principalConsecrator && bishop.principalConsecrator && (
        <Text style={[styles.metaItalic, { fontSize: fonts.small, width: w }]}>
          by {bishop.principalConsecrator}
        </Text>
      )}

      {/* Other group */}
      {fields.rite && bishop.rite && bishop.rite !== 'Latin' && (
        <Text style={[styles.metaSecondary, { fontSize: fonts.small, width: w }]}>
          {bishop.rite}
        </Text>
      )}
      {fields.education && bishop.education && (
        <Text style={[styles.metaSecondary, { fontSize: fonts.small, width: w }]}>
          {bishop.education}
        </Text>
      )}
    </View>
  )
}

// ─── Document ─────────────────────────────────────────────────────────────────

const PAGE_SIZE_MAP: Record<DirectoryConfig['pageSize'], [number, number]> = {
  letter: [612, 792],
  a4:     [595, 842],
}

export function DirectoryPDFDocument({
  bishops,
  config,
  generatedDate,
  logoSrc,
}: {
  bishops: BishopEntry[]
  config: DirectoryConfig
  generatedDate: string
  logoSrc?: string
}) {
  const sorted = sortBishops(bishops, config.sort)
  const cols = DENSITY_COLS[config.gridDensity]
  const [pageW] = PAGE_SIZE_MAP[config.pageSize]
  const contentWidth = pageW - 72
  const colWidth = Math.floor(contentWidth / cols)

  const ROWS_PER_PAGE: Record<DirectoryConfig['gridDensity'], number> = {
    large:   3,
    medium:  4,
    compact: 5,
  }
  const perPage = cols * ROWS_PER_PAGE[config.gridDensity]
  const pages: BishopEntry[][] = []
  for (let i = 0; i < sorted.length; i += perPage) {
    pages.push(sorted.slice(i, i + perPage))
  }

  return (
    <Document title={config.coverTitle} author="hierarchy.directory">
      {/* Cover page */}
      {config.coverPage && (
        <Page size={PAGE_SIZE_MAP[config.pageSize]} style={styles.coverPage}>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.coverTitle}>{config.coverTitle || 'Catholic Bishops Directory'}</Text>
            <View style={styles.coverDivider} />
            {config.coverSubtitle && (
              <Text style={styles.coverSubtitle}>{config.coverSubtitle}</Text>
            )}
          </View>
          {/* Cover footer: logo centered, no page number */}
          {logoSrc && (
            <View style={styles.footerCenter}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={logoSrc} style={{ width: 100 }} />
            </View>
          )}
        </Page>
      )}

      {/* Bishop grid pages */}
      {pages.map((pageBishops, pageIdx) => (
        <Page
          key={pageIdx}
          size={PAGE_SIZE_MAP[config.pageSize]}
          style={styles.page}
        >
          <View style={styles.grid}>
            {pageBishops.map((bishop) => (
              <BishopCell
                key={bishop.id}
                bishop={bishop}
                colWidth={colWidth}
                config={config}
              />
            ))}
          </View>

          {/* Copyright line on last page only */}
          {pageIdx === pages.length - 1 && (
            <View style={{ position: 'absolute', bottom: 30, left: 36, right: 36, alignItems: 'center' }}>
              <Text style={[styles.footerText, { color: COLORS.tertiary, fontStyle: 'italic' }]}>
                Portraits courtesy of their respective (arch)dioceses and copyright holders.
              </Text>
            </View>
          )}

          {/* Footer: branding | generation date | page number */}
          <View style={styles.footer}>
            {logoSrc
              // eslint-disable-next-line jsx-a11y/alt-text
              ? <Image src={logoSrc} style={{ width: 80 }} />
              : <Text style={styles.footerText}>hierarchy.directory</Text>
            }
            <Text style={styles.footerText}>Generated {generatedDate}</Text>
            <Text
              style={styles.footerText}
              render={({ pageNumber, totalPages }) => {
                const n = config.coverPage ? pageNumber - 1 : pageNumber
                const t = config.coverPage ? totalPages - 1 : totalPages
                return `Page ${n} of ${t}`
              }}
            />
          </View>
        </Page>
      ))}
    </Document>
  )
}
