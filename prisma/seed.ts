/**
 * prisma/seed.ts
 *
 * Seeds reference data: rites, countries, and all 33 US Latin-rite
 * metropolitan archdioceses. Run with: npm run seed
 *
 * Idempotent — skips any record whose name already exists, so re-running
 * is safe after partial failures.
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function mkSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const prisma = new PrismaClient({ adapter })

// ─── Rites ──────────────────────────────────────────────────────────────────

const RITES = [
  { name: 'Latin',        type: 'latin'   },
  { name: 'Maronite',     type: 'eastern' },
  { name: 'Melkite',      type: 'eastern' },
  { name: 'Ukrainian',    type: 'eastern' },
  { name: 'Syro-Malabar', type: 'eastern' },
  { name: 'Romanian',     type: 'eastern' },
  { name: 'Ruthenian',    type: 'eastern' },
  { name: 'Chaldean',     type: 'eastern' },
  { name: 'Armenian',     type: 'eastern' },
  { name: 'Syriac',       type: 'eastern' },
]

// ─── Countries ──────────────────────────────────────────────────────────────

const COUNTRIES = [
  { name: 'United States', isoCode: 'US' },
  { name: 'Vatican City',  isoCode: 'VA' },
  { name: 'Canada',        isoCode: 'CA' },
  { name: 'Mexico',        isoCode: 'MX' },
]

// ─── Metropolitan archdioceses ───────────────────────────────────────────────
// name: place name only (display name computed at render time)
// dateErected: earliest erection date of the see in any form
// Sources: USCCB directory, Wikipedia "List of Catholic dioceses in the United States"

const METROPOLITAN_SEES = [
  {
    name:               'Anchorage-Juneau',
    stateRegion:        'Alaska',
    dateErected:        new Date('1966-01-22'),
    cathedralName:      'Holy Family Cathedral',
    cathedralAddress:   '225 W 5th Ave, Anchorage, AK 99501',
    cathedralLatitude:  '61.217600',
    cathedralLongitude: '-149.893800',
  },
  {
    name:               'Atlanta',
    stateRegion:        'Georgia',
    dateErected:        new Date('1956-07-02'),
    cathedralName:      'Cathedral of Christ the King',
    cathedralAddress:   '2699 Peachtree Rd NE, Atlanta, GA 30305',
    cathedralLatitude:  '33.847800',
    cathedralLongitude: '-84.369500',
  },
  {
    name:               'Baltimore',
    stateRegion:        'Maryland',
    dateErected:        new Date('1789-04-06'),
    cathedralName:      'Basilica of the National Shrine of the Assumption of the Blessed Virgin Mary',
    cathedralAddress:   '409 Cathedral St, Baltimore, MD 21201',
    cathedralLatitude:  '39.295300',
    cathedralLongitude: '-76.613700',
  },
  {
    name:               'Boston',
    stateRegion:        'Massachusetts',
    dateErected:        new Date('1808-04-08'),
    cathedralName:      'Cathedral of the Holy Cross',
    cathedralAddress:   '1400 Washington St, Boston, MA 02118',
    cathedralLatitude:  '42.336700',
    cathedralLongitude: '-71.071000',
  },
  {
    name:               'Chicago',
    stateRegion:        'Illinois',
    dateErected:        new Date('1843-11-28'),
    cathedralName:      'Holy Name Cathedral',
    cathedralAddress:   '735 N State St, Chicago, IL 60654',
    cathedralLatitude:  '41.896500',
    cathedralLongitude: '-87.628300',
  },
  {
    name:               'Cincinnati',
    stateRegion:        'Ohio',
    dateErected:        new Date('1821-06-19'),
    cathedralName:      'Cathedral Basilica of Saint Peter in Chains',
    cathedralAddress:   '325 W 8th St, Cincinnati, OH 45202',
    cathedralLatitude:  '39.106300',
    cathedralLongitude: '-84.515700',
  },
  {
    name:               'Denver',
    stateRegion:        'Colorado',
    dateErected:        new Date('1887-08-16'),
    cathedralName:      'Cathedral Basilica of the Immaculate Conception',
    cathedralAddress:   '1530 Logan St, Denver, CO 80203',
    cathedralLatitude:  '39.736200',
    cathedralLongitude: '-104.981800',
  },
  {
    name:               'Detroit',
    stateRegion:        'Michigan',
    dateErected:        new Date('1833-03-08'),
    cathedralName:      'Cathedral of the Most Blessed Sacrament',
    cathedralAddress:   '9844 Woodward Ave, Detroit, MI 48202',
    cathedralLatitude:  '42.368000',
    cathedralLongitude: '-83.080300',
  },
  {
    name:               'Dubuque',
    stateRegion:        'Iowa',
    dateErected:        new Date('1837-07-28'),
    cathedralName:      'St. Raphael Cathedral',
    cathedralAddress:   '231 Bluff St, Dubuque, IA 52001',
    cathedralLatitude:  '42.503000',
    cathedralLongitude: '-90.664500',
  },
  {
    name:               'Galveston-Houston',
    stateRegion:        'Texas',
    dateErected:        new Date('1847-05-04'),
    cathedralName:      'Co-Cathedral of the Sacred Heart',
    cathedralAddress:   '1111 St Joseph Pkwy, Houston, TX 77002',
    cathedralLatitude:  '29.753400',
    cathedralLongitude: '-95.371400',
  },
  {
    name:               'Hartford',
    stateRegion:        'Connecticut',
    dateErected:        new Date('1843-09-18'),
    cathedralName:      'Cathedral of Saint Joseph',
    cathedralAddress:   '140 Farmington Ave, Hartford, CT 06105',
    cathedralLatitude:  '41.760700',
    cathedralLongitude: '-72.695200',
  },
  {
    name:               'Indianapolis',
    stateRegion:        'Indiana',
    // Originally Diocese of Vincennes; renamed Indianapolis 1898; archdiocese 1944
    dateErected:        new Date('1834-05-06'),
    cathedralName:      'Saints Peter and Paul Cathedral',
    cathedralAddress:   '1347 N Meridian St, Indianapolis, IN 46202',
    cathedralLatitude:  '39.793400',
    cathedralLongitude: '-86.158300',
  },
  {
    name:               'Kansas City in Kansas',
    stateRegion:        'Kansas',
    // Originally Diocese of Leavenworth 1877; moved to Kansas City in Kansas 1947; archdiocese 1952
    dateErected:        new Date('1877-05-22'),
    cathedralName:      'Cathedral of Saint Peter the Apostle',
    cathedralAddress:   '2408 Central Ave, Kansas City, KS 66102',
    cathedralLatitude:  '39.108600',
    cathedralLongitude: '-94.627200',
  },
  {
    name:               'Los Angeles',
    stateRegion:        'California',
    // Diocese of Monterey-Los Angeles 1859; LA separated 1922; archdiocese 1936
    dateErected:        new Date('1859-07-29'),
    cathedralName:      'Cathedral of Our Lady of the Angels',
    cathedralAddress:   '555 W Temple St, Los Angeles, CA 90012',
    cathedralLatitude:  '34.057400',
    cathedralLongitude: '-118.246400',
  },
  {
    name:               'Louisville',
    stateRegion:        'Kentucky',
    // Originally Diocese of Bardstown 1808; moved to Louisville 1841; archdiocese 1937
    dateErected:        new Date('1808-04-08'),
    cathedralName:      'Cathedral of the Assumption',
    cathedralAddress:   '433 S 5th St, Louisville, KY 40202',
    cathedralLatitude:  '38.252700',
    cathedralLongitude: '-85.758500',
  },
  {
    name:               'Miami',
    stateRegion:        'Florida',
    dateErected:        new Date('1958-10-07'),
    cathedralName:      'St. Mary Cathedral',
    cathedralAddress:   '7525 NW 2nd Ave, Miami, FL 33150',
    cathedralLatitude:  '25.841300',
    cathedralLongitude: '-80.205000',
  },
  {
    name:               'Milwaukee',
    stateRegion:        'Wisconsin',
    dateErected:        new Date('1844-11-28'),
    cathedralName:      'Cathedral of Saint John the Evangelist',
    cathedralAddress:   '812 N Jackson St, Milwaukee, WI 53202',
    cathedralLatitude:  '43.047600',
    cathedralLongitude: '-87.906500',
  },
  {
    name:               'Mobile',
    stateRegion:        'Alabama',
    dateErected:        new Date('1829-08-15'),
    cathedralName:      'Cathedral of the Immaculate Conception',
    cathedralAddress:   '2 S Claiborne St, Mobile, AL 36602',
    cathedralLatitude:  '30.691700',
    cathedralLongitude: '-88.046700',
  },
  {
    name:               'New Orleans',
    stateRegion:        'Louisiana',
    dateErected:        new Date('1793-04-25'),
    cathedralName:      'St. Louis Cathedral',
    cathedralAddress:   '615 Pere Antoine Alley, New Orleans, LA 70116',
    cathedralLatitude:  '29.958400',
    cathedralLongitude: '-90.064400',
  },
  {
    name:               'New York',
    stateRegion:        'New York',
    dateErected:        new Date('1808-04-08'),
    cathedralName:      "Saint Patrick's Cathedral",
    cathedralAddress:   '5 E 50th St, New York, NY 10022',
    cathedralLatitude:  '40.758400',
    cathedralLongitude: '-73.976000',
  },
  {
    name:               'Newark',
    stateRegion:        'New Jersey',
    dateErected:        new Date('1853-07-29'),
    cathedralName:      'Cathedral Basilica of the Sacred Heart',
    cathedralAddress:   '89 Ridge St, Newark, NJ 07104',
    cathedralLatitude:  '40.752800',
    cathedralLongitude: '-74.179900',
  },
  {
    name:               'Oklahoma City',
    stateRegion:        'Oklahoma',
    // Diocese of Oklahoma and Indian Territory 1905; reorganized 1930; archdiocese 1972
    dateErected:        new Date('1905-08-17'),
    cathedralName:      'Cathedral of Our Lady of Perpetual Help',
    cathedralAddress:   '3214 N Lake Ave, Oklahoma City, OK 73112',
    cathedralLatitude:  '35.504600',
    cathedralLongitude: '-97.538800',
  },
  {
    name:               'Omaha',
    stateRegion:        'Nebraska',
    dateErected:        new Date('1885-08-02'),
    cathedralName:      'Saint Cecilia Cathedral',
    cathedralAddress:   '701 N 40th St, Omaha, NE 68131',
    cathedralLatitude:  '41.258800',
    cathedralLongitude: '-95.981400',
  },
  {
    name:               'Philadelphia',
    stateRegion:        'Pennsylvania',
    dateErected:        new Date('1808-04-08'),
    cathedralName:      'Cathedral Basilica of Saints Peter and Paul',
    cathedralAddress:   '1723 Race St, Philadelphia, PA 19103',
    cathedralLatitude:  '39.958600',
    cathedralLongitude: '-75.172300',
  },
  {
    name:               'Phoenix',
    stateRegion:        'Arizona',
    // Diocese 1969; elevated to archdiocese and made metropolitan June 20, 2023
    dateErected:        new Date('1969-12-02'),
    cathedralName:      "St. Mary's Basilica",
    cathedralAddress:   '231 N 3rd St, Phoenix, AZ 85004',
    cathedralLatitude:  '33.449000',
    cathedralLongitude: '-112.070100',
  },
  {
    name:               'Portland in Oregon',
    stateRegion:        'Oregon',
    // Erected as archdiocese of Oregon City 1846; renamed Portland in Oregon 1928
    dateErected:        new Date('1846-07-24'),
    cathedralName:      'Cathedral of the Immaculate Conception',
    cathedralAddress:   '1945 NW Irving St, Portland, OR 97209',
    cathedralLatitude:  '45.526800',
    cathedralLongitude: '-122.690000',
  },
  {
    name:               'Saint Louis',
    stateRegion:        'Missouri',
    dateErected:        new Date('1826-07-18'),
    cathedralName:      'Cathedral Basilica of Saint Louis',
    cathedralAddress:   '4431 Lindell Blvd, St. Louis, MO 63108',
    cathedralLatitude:  '38.636400',
    cathedralLongitude: '-90.269700',
  },
  {
    name:               'Saint Paul and Minneapolis',
    stateRegion:        'Minnesota',
    dateErected:        new Date('1850-07-19'),
    cathedralName:      'Cathedral of Saint Paul',
    cathedralAddress:   '239 Selby Ave, Saint Paul, MN 55102',
    cathedralLatitude:  '44.947600',
    cathedralLongitude: '-93.103400',
  },
  {
    name:               'San Antonio',
    stateRegion:        'Texas',
    dateErected:        new Date('1874-09-03'),
    cathedralName:      'San Fernando Cathedral',
    cathedralAddress:   '115 Main Plaza, San Antonio, TX 78205',
    cathedralLatitude:  '29.424000',
    cathedralLongitude: '-98.493600',
  },
  {
    name:               'San Francisco',
    stateRegion:        'California',
    // Erected directly as an archdiocese 1853
    dateErected:        new Date('1853-07-29'),
    cathedralName:      'Cathedral of Saint Mary of the Assumption',
    cathedralAddress:   '1111 Gough St, San Francisco, CA 94109',
    cathedralLatitude:  '37.784000',
    cathedralLongitude: '-122.426800',
  },
  {
    name:               'Santa Fe',
    stateRegion:        'New Mexico',
    dateErected:        new Date('1850-07-23'),
    cathedralName:      'Cathedral Basilica of Saint Francis of Assisi',
    cathedralAddress:   '131 Cathedral Pl, Santa Fe, NM 87501',
    cathedralLatitude:  '35.687200',
    cathedralLongitude: '-105.937100',
  },
  {
    name:               'Seattle',
    stateRegion:        'Washington',
    // Diocese of Nesqually 1850; renamed Seattle 1907; archdiocese 1951
    dateErected:        new Date('1850-05-31'),
    cathedralName:      'St. James Cathedral',
    cathedralAddress:   '804 9th Ave, Seattle, WA 98104',
    cathedralLatitude:  '47.602900',
    cathedralLongitude: '-122.320200',
  },
  {
    name:               'Washington',
    stateRegion:        'District of Columbia',
    dateErected:        new Date('1939-07-22'),
    cathedralName:      'Cathedral of Saint Matthew the Apostle',
    cathedralAddress:   '1725 Rhode Island Ave NW, Washington, DC 20036',
    cathedralLatitude:  '38.909100',
    cathedralLongitude: '-77.042800',
  },
]

// ─── Suffragan sees — eastern provinces ──────────────────────────────────────

type SuffraganEntry = {
  name: string
  seeType: string
  namePrefixOverride?: string | null
  stateRegion: string | null
  dateErected?: Date
  cathedralName?: string | null
  cathedralAddress?: string | null
  cathedralLatitude?: string | null
  cathedralLongitude?: string | null
}

const EASTERN_PROVINCES: Array<{ metropolitanName: string; suffragans: SuffraganEntry[] }> = [
  {
    metropolitanName: 'Baltimore',
    suffragans: [
      {
        name:               'Wheeling-Charleston',
        seeType:            'diocese',
        stateRegion:        'West Virginia',
        dateErected:        new Date('1850-07-29'),
        cathedralName:      'Cathedral of Saint Joseph',
        cathedralAddress:   '1218 Eoff St, Wheeling, WV 26003',
        cathedralLatitude:  '40.063700',
        cathedralLongitude: '-80.720900',
      },
      {
        name:               'Wilmington',
        seeType:            'diocese',
        stateRegion:        'Delaware',
        dateErected:        new Date('1868-03-03'),
        cathedralName:      'Cathedral of Saint Peter',
        cathedralAddress:   '604 N French St, Wilmington, DE 19801',
        cathedralLatitude:  '39.744700',
        cathedralLongitude: '-75.550400',
      },
      {
        name:               'Richmond',
        seeType:            'diocese',
        stateRegion:        'Virginia',
        dateErected:        new Date('1820-07-11'),
        cathedralName:      'Cathedral of the Sacred Heart',
        cathedralAddress:   '823 Cathedral Pl, Richmond, VA 23220',
        cathedralLatitude:  '37.546900',
        cathedralLongitude: '-77.461700',
      },
    ],
  },
  {
    metropolitanName: 'Washington',
    suffragans: [
      {
        name:               'Arlington',
        seeType:            'diocese',
        stateRegion:        'Virginia',
        dateErected:        new Date('1974-08-13'),
        cathedralName:      'Cathedral of Saint Thomas More',
        cathedralAddress:   '3901 Cathedral Ln, Arlington, VA 22203',
        cathedralLatitude:  '38.873000',
        cathedralLongitude: '-77.116500',
      },
    ],
  },
  {
    metropolitanName: 'Philadelphia',
    suffragans: [
      {
        name:               'Allentown',
        seeType:            'diocese',
        stateRegion:        'Pennsylvania',
        dateErected:        new Date('1961-01-28'),
        cathedralName:      'Cathedral of Saint Catherine of Siena',
        cathedralAddress:   '1825 W Turner St, Allentown, PA 18104',
        cathedralLatitude:  '40.603900',
        cathedralLongitude: '-75.482400',
      },
      {
        name:               'Altoona-Johnstown',
        seeType:            'diocese',
        stateRegion:        'Pennsylvania',
        dateErected:        new Date('1901-05-30'),
        cathedralName:      'Cathedral of the Blessed Sacrament',
        cathedralAddress:   '1300 12th Ave, Altoona, PA 16601',
        cathedralLatitude:  '40.509300',
        cathedralLongitude: '-78.409500',
      },
      {
        name:               'Erie',
        seeType:            'diocese',
        stateRegion:        'Pennsylvania',
        dateErected:        new Date('1853-08-11'),
        cathedralName:      'Saint Peter Cathedral',
        cathedralAddress:   '230 W 10th St, Erie, PA 16501',
        cathedralLatitude:  '42.128300',
        cathedralLongitude: '-80.085000',
      },
      {
        name:               'Greensburg',
        seeType:            'diocese',
        stateRegion:        'Pennsylvania',
        dateErected:        new Date('1951-03-10'),
        cathedralName:      'Blessed Sacrament Cathedral',
        cathedralAddress:   '300 N Main St, Greensburg, PA 15601',
        cathedralLatitude:  '40.301500',
        cathedralLongitude: '-79.538800',
      },
      {
        name:               'Harrisburg',
        seeType:            'diocese',
        stateRegion:        'Pennsylvania',
        dateErected:        new Date('1868-03-03'),
        cathedralName:      'Cathedral Parish of Saint Patrick',
        cathedralAddress:   '212 State St, Harrisburg, PA 17101',
        cathedralLatitude:  '40.259500',
        cathedralLongitude: '-76.884200',
      },
      {
        name:               'Pittsburgh',
        seeType:            'diocese',
        stateRegion:        'Pennsylvania',
        dateErected:        new Date('1843-08-11'),
        cathedralName:      'Saint Paul Cathedral',
        cathedralAddress:   '5029 Fifth Ave, Pittsburgh, PA 15232',
        cathedralLatitude:  '40.453300',
        cathedralLongitude: '-79.932000',
      },
      {
        name:               'Scranton',
        seeType:            'diocese',
        stateRegion:        'Pennsylvania',
        dateErected:        new Date('1868-03-03'),
        cathedralName:      'Cathedral of Saint Peter',
        cathedralAddress:   '315 Wyoming Ave, Scranton, PA 18503',
        cathedralLatitude:  '41.409700',
        cathedralLongitude: '-75.661900',
      },
    ],
  },
  {
    metropolitanName: 'Newark',
    suffragans: [
      {
        name:               'Camden',
        seeType:            'diocese',
        stateRegion:        'New Jersey',
        dateErected:        new Date('1937-12-09'),
        cathedralName:      'Cathedral of the Immaculate Conception',
        cathedralAddress:   '631 Market St, Camden, NJ 08102',
        cathedralLatitude:  '39.945500',
        cathedralLongitude: '-75.119300',
      },
      {
        name:               'Metuchen',
        seeType:            'diocese',
        stateRegion:        'New Jersey',
        dateErected:        new Date('1981-11-19'),
        cathedralName:      'Cathedral of Saint Francis of Assisi',
        cathedralAddress:   '10 Wycoff Ave, Metuchen, NJ 08840',
        cathedralLatitude:  '40.542400',
        cathedralLongitude: '-74.363800',
      },
      {
        name:               'Paterson',
        seeType:            'diocese',
        stateRegion:        'New Jersey',
        dateErected:        new Date('1937-12-09'),
        cathedralName:      'Cathedral of Saint John the Baptist',
        cathedralAddress:   '381 Grand St, Paterson, NJ 07505',
        cathedralLatitude:  '40.917500',
        cathedralLongitude: '-74.171800',
      },
      {
        name:               'Trenton',
        seeType:            'diocese',
        stateRegion:        'New Jersey',
        dateErected:        new Date('1881-08-02'),
        cathedralName:      'Cathedral of Saint Mary of the Assumption',
        cathedralAddress:   '151 N Warren St, Trenton, NJ 08608',
        cathedralLatitude:  '40.219600',
        cathedralLongitude: '-74.756100',
      },
    ],
  },
  {
    metropolitanName: 'New York',
    suffragans: [
      {
        name:               'Albany',
        seeType:            'diocese',
        stateRegion:        'New York',
        dateErected:        new Date('1847-04-23'),
        cathedralName:      'Cathedral of the Immaculate Conception',
        cathedralAddress:   '125 Eagle St, Albany, NY 12207',
        cathedralLatitude:  '42.652400',
        cathedralLongitude: '-73.754100',
      },
      {
        name:               'Brooklyn',
        seeType:            'diocese',
        stateRegion:        'New York',
        dateErected:        new Date('1853-07-29'),
        cathedralName:      'Cathedral Basilica of Saint James',
        cathedralAddress:   '83 St James Pl, Brooklyn, NY 11201',
        cathedralLatitude:  '40.694300',
        cathedralLongitude: '-73.990300',
      },
      {
        name:               'Buffalo',
        seeType:            'diocese',
        stateRegion:        'New York',
        dateErected:        new Date('1847-04-23'),
        cathedralName:      'Saint Joseph Cathedral',
        cathedralAddress:   '50 Franklin St, Buffalo, NY 14202',
        cathedralLatitude:  '42.884900',
        cathedralLongitude: '-78.878600',
      },
      {
        name:               'Ogdensburg',
        seeType:            'diocese',
        stateRegion:        'New York',
        dateErected:        new Date('1872-02-16'),
        cathedralName:      'Cathedral of Saint Mary',
        cathedralAddress:   '200 State St, Ogdensburg, NY 13669',
        cathedralLatitude:  '44.694800',
        cathedralLongitude: '-75.486800',
      },
      {
        name:               'Rochester',
        seeType:            'diocese',
        stateRegion:        'New York',
        dateErected:        new Date('1868-03-03'),
        cathedralName:      'Sacred Heart Cathedral',
        cathedralAddress:   '296 Flower City Park, Rochester, NY 14615',
        cathedralLatitude:  '43.172700',
        cathedralLongitude: '-77.641900',
      },
      {
        name:               'Rockville Centre',
        seeType:            'diocese',
        stateRegion:        'New York',
        dateErected:        new Date('1957-04-06'),
        cathedralName:      'Cathedral of Saint Agnes',
        cathedralAddress:   '29 Quealy Pl, Rockville Centre, NY 11570',
        cathedralLatitude:  '40.657400',
        cathedralLongitude: '-73.639500',
      },
      {
        name:               'Syracuse',
        seeType:            'diocese',
        stateRegion:        'New York',
        dateErected:        new Date('1886-02-16'),
        cathedralName:      'Cathedral of the Immaculate Conception',
        cathedralAddress:   '259 E Onondaga St, Syracuse, NY 13202',
        cathedralLatitude:  '43.044500',
        cathedralLongitude: '-76.146500',
      },
    ],
  },
  {
    metropolitanName: 'Hartford',
    suffragans: [
      {
        name:               'Bridgeport',
        seeType:            'diocese',
        stateRegion:        'Connecticut',
        dateErected:        new Date('1953-08-06'),
        cathedralName:      'Saint Augustine Cathedral',
        cathedralAddress:   '196 Fairfield Ave, Bridgeport, CT 06604',
        cathedralLatitude:  '41.166700',
        cathedralLongitude: '-73.205400',
      },
      {
        name:               'Norwich',
        seeType:            'diocese',
        stateRegion:        'Connecticut',
        dateErected:        new Date('1953-08-06'),
        cathedralName:      'Cathedral of Saint Patrick',
        cathedralAddress:   '213 Broadway, Norwich, CT 06360',
        cathedralLatitude:  '41.524000',
        cathedralLongitude: '-72.076000',
      },
      {
        name:               'Providence',
        seeType:            'diocese',
        stateRegion:        'Rhode Island',
        dateErected:        new Date('1872-02-16'),
        cathedralName:      'Cathedral of Saints Peter and Paul',
        cathedralAddress:   '30 Fenner St, Providence, RI 02903',
        cathedralLatitude:  '41.819400',
        cathedralLongitude: '-71.412800',
      },
      {
        name:               'Springfield',
        seeType:            'diocese',
        stateRegion:        'Massachusetts',
        dateErected:        new Date('1870-06-14'),
        cathedralName:      "Saint Michael's Cathedral",
        cathedralAddress:   '260 State St, Springfield, MA 01103',
        cathedralLatitude:  '42.101500',
        cathedralLongitude: '-72.592600',
      },
    ],
  },
  {
    metropolitanName: 'Boston',
    suffragans: [
      {
        name:               'Burlington',
        seeType:            'diocese',
        stateRegion:        'Vermont',
        dateErected:        new Date('1853-07-29'),
        cathedralName:      'Cathedral of the Immaculate Conception',
        cathedralAddress:   '20 Pine St, Burlington, VT 05401',
        cathedralLatitude:  '44.475900',
        cathedralLongitude: '-73.212100',
      },
      {
        name:               'Fall River',
        seeType:            'diocese',
        stateRegion:        'Massachusetts',
        dateErected:        new Date('1904-03-12'),
        cathedralName:      "Saint Mary's Cathedral",
        cathedralAddress:   '327 Second St, Fall River, MA 02721',
        cathedralLatitude:  '41.709000',
        cathedralLongitude: '-71.149500',
      },
      {
        name:               'Manchester',
        seeType:            'diocese',
        stateRegion:        'New Hampshire',
        dateErected:        new Date('1884-11-13'),
        cathedralName:      'Saint Joseph Cathedral',
        cathedralAddress:   '145 Lowell St, Manchester, NH 03104',
        cathedralLatitude:  '42.995600',
        cathedralLongitude: '-71.454800',
      },
      {
        name:               'Portland',
        seeType:            'diocese',
        stateRegion:        'Maine',
        dateErected:        new Date('1853-07-29'),
        cathedralName:      'Cathedral of the Immaculate Conception',
        cathedralAddress:   '307 Congress St, Portland, ME 04101',
        cathedralLatitude:  '43.659100',
        cathedralLongitude: '-70.256800',
      },
      {
        name:               'Worcester',
        seeType:            'diocese',
        stateRegion:        'Massachusetts',
        dateErected:        new Date('1950-01-14'),
        cathedralName:      'Saint Paul Cathedral',
        cathedralAddress:   '38 High St, Worcester, MA 01609',
        cathedralLatitude:  '42.262600',
        cathedralLongitude: '-71.802300',
      },
    ],
  },
  {
    metropolitanName: 'Atlanta',
    suffragans: [
      {
        name:               'Charlotte',
        seeType:            'diocese',
        stateRegion:        'North Carolina',
        dateErected:        new Date('1971-10-01'),
        cathedralName:      'Cathedral of Saint Patrick',
        cathedralAddress:   '1621 Dilworth Rd E, Charlotte, NC 28203',
        cathedralLatitude:  '35.203000',
        cathedralLongitude: '-80.846400',
      },
      {
        name:               'Raleigh',
        seeType:            'diocese',
        stateRegion:        'North Carolina',
        dateErected:        new Date('1924-12-12'),
        cathedralName:      'Sacred Heart Cathedral',
        cathedralAddress:   '823 Salisbury St, Raleigh, NC 27601',
        cathedralLatitude:  '35.782500',
        cathedralLongitude: '-78.639400',
      },
      {
        name:               'Charleston',
        seeType:            'diocese',
        stateRegion:        'South Carolina',
        dateErected:        new Date('1820-07-11'),
        cathedralName:      'Cathedral of Saint John the Baptist',
        cathedralAddress:   '120 Broad St, Charleston, SC 29401',
        cathedralLatitude:  '32.775200',
        cathedralLongitude: '-79.940200',
      },
      {
        name:               'Savannah',
        seeType:            'diocese',
        stateRegion:        'Georgia',
        dateErected:        new Date('1850-07-19'),
        cathedralName:      'Cathedral Basilica of Saint John the Baptist',
        cathedralAddress:   '222 E Harris St, Savannah, GA 31401',
        cathedralLatitude:  '32.080300',
        cathedralLongitude: '-81.091200',
      },
    ],
  },
  {
    metropolitanName: 'Miami',
    suffragans: [
      {
        name:               'Orlando',
        seeType:            'diocese',
        stateRegion:        'Florida',
        dateErected:        new Date('1968-06-18'),
        cathedralName:      'Cathedral Church of Saint James',
        cathedralAddress:   '215 N Orange Ave, Orlando, FL 32801',
        cathedralLatitude:  '28.542000',
        cathedralLongitude: '-81.379200',
      },
      {
        name:               'Palm Beach',
        seeType:            'diocese',
        stateRegion:        'Florida',
        dateErected:        new Date('1998-07-24'),
        cathedralName:      'Cathedral of Saint Ignatius Loyola',
        cathedralAddress:   '333 Hiatt Dr, Palm Beach Gardens, FL 33418',
        cathedralLatitude:  '26.849700',
        cathedralLongitude: '-80.091000',
      },
      {
        name:               'Pensacola-Tallahassee',
        seeType:            'diocese',
        stateRegion:        'Florida',
        dateErected:        new Date('1975-08-13'),
        cathedralName:      'Cathedral Basilica of the Sacred Heart',
        cathedralAddress:   '125 E Intendencia St, Pensacola, FL 32502',
        cathedralLatitude:  '30.420700',
        cathedralLongitude: '-87.216700',
      },
      {
        name:               'Saint Augustine',
        seeType:            'diocese',
        stateRegion:        'Florida',
        dateErected:        new Date('1870-02-22'),
        cathedralName:      'Cathedral Basilica of Saint Augustine',
        cathedralAddress:   '38 Cathedral Pl, St. Augustine, FL 32084',
        cathedralLatitude:  '29.891800',
        cathedralLongitude: '-81.312500',
      },
      {
        name:               'Saint Petersburg',
        seeType:            'diocese',
        stateRegion:        'Florida',
        dateErected:        new Date('1968-06-18'),
        cathedralName:      'Cathedral of Saint Jude the Apostle',
        cathedralAddress:   '5815 5th Ave N, St. Petersburg, FL 33710',
        cathedralLatitude:  '27.786700',
        cathedralLongitude: '-82.680700',
      },
      {
        name:               'Venice',
        seeType:            'diocese',
        stateRegion:        'Florida',
        dateErected:        new Date('1984-10-25'),
        cathedralName:      'Epiphany Cathedral',
        cathedralAddress:   '350 Tampa Ave W, Venice, FL 34285',
        cathedralLatitude:  '27.099800',
        cathedralLongitude: '-82.454300',
      },
    ],
  },
  {
    metropolitanName: 'Louisville',
    suffragans: [
      {
        name:               'Covington',
        seeType:            'diocese',
        stateRegion:        'Kentucky',
        dateErected:        new Date('1853-07-29'),
        cathedralName:      'Cathedral Basilica of the Assumption',
        cathedralAddress:   '1140 Madison Ave, Covington, KY 41011',
        cathedralLatitude:  '39.086200',
        cathedralLongitude: '-84.512100',
      },
      {
        name:               'Lexington',
        seeType:            'diocese',
        stateRegion:        'Kentucky',
        dateErected:        new Date('1988-01-14'),
        cathedralName:      'Cathedral of Christ the King',
        cathedralAddress:   '299 Colony Blvd, Lexington, KY 40502',
        cathedralLatitude:  '38.019500',
        cathedralLongitude: '-84.475600',
      },
      {
        name:               'Knoxville',
        seeType:            'diocese',
        stateRegion:        'Tennessee',
        dateErected:        new Date('1988-01-14'),
        cathedralName:      'Sacred Heart Cathedral',
        cathedralAddress:   '711 N Broadway, Knoxville, TN 37917',
        cathedralLatitude:  '35.974900',
        cathedralLongitude: '-83.940100',
      },
      {
        name:               'Memphis',
        seeType:            'diocese',
        stateRegion:        'Tennessee',
        dateErected:        new Date('1971-01-06'),
        cathedralName:      'Cathedral of the Immaculate Conception',
        cathedralAddress:   '1695 Central Ave, Memphis, TN 38104',
        cathedralLatitude:  '35.137500',
        cathedralLongitude: '-90.013500',
      },
      {
        name:               'Nashville',
        seeType:            'diocese',
        stateRegion:        'Tennessee',
        dateErected:        new Date('1837-07-28'),
        cathedralName:      'Cathedral of the Incarnation',
        cathedralAddress:   '2015 West End Ave, Nashville, TN 37203',
        cathedralLatitude:  '36.149800',
        cathedralLongitude: '-86.802300',
      },
    ],
  },
  {
    metropolitanName: 'Cincinnati',
    suffragans: [
      {
        name:               'Cleveland',
        seeType:            'diocese',
        stateRegion:        'Ohio',
        dateErected:        new Date('1847-04-23'),
        cathedralName:      'Cathedral of Saint John the Evangelist',
        cathedralAddress:   '1007 Superior Ave E, Cleveland, OH 44114',
        cathedralLatitude:  '41.499300',
        cathedralLongitude: '-81.694400',
      },
      {
        name:               'Columbus',
        seeType:            'diocese',
        stateRegion:        'Ohio',
        dateErected:        new Date('1868-03-03'),
        cathedralName:      'Saint Joseph Cathedral',
        cathedralAddress:   '212 E Broad St, Columbus, OH 43215',
        cathedralLatitude:  '39.961200',
        cathedralLongitude: '-82.998800',
      },
      {
        name:               'Steubenville',
        seeType:            'diocese',
        stateRegion:        'Ohio',
        dateErected:        new Date('1944-02-18'),
        cathedralName:      'Cathedral of the Holy Name',
        cathedralAddress:   '422 Washington St, Steubenville, OH 43952',
        cathedralLatitude:  '40.369800',
        cathedralLongitude: '-80.634500',
      },
      {
        name:               'Toledo',
        seeType:            'diocese',
        stateRegion:        'Ohio',
        dateErected:        new Date('1910-04-15'),
        cathedralName:      'Cathedral of Our Lady, Queen of the Most Holy Rosary',
        cathedralAddress:   '2535 Collingwood Blvd, Toledo, OH 43620',
        cathedralLatitude:  '41.661200',
        cathedralLongitude: '-83.555800',
      },
      {
        name:               'Youngstown',
        seeType:            'diocese',
        stateRegion:        'Ohio',
        dateErected:        new Date('1943-05-15'),
        cathedralName:      'Cathedral of Saint Columba',
        cathedralAddress:   '154 W Wood St, Youngstown, OH 44503',
        cathedralLatitude:  '41.099800',
        cathedralLongitude: '-80.649500',
      },
    ],
  },
  {
    metropolitanName: 'Detroit',
    suffragans: [
      {
        name:               'Gaylord',
        seeType:            'diocese',
        stateRegion:        'Michigan',
        dateErected:        new Date('1971-03-19'),
        cathedralName:      'Cathedral of Saint Mary',
        cathedralAddress:   '611 S Otsego Ave, Gaylord, MI 49735',
        cathedralLatitude:  '45.027600',
        cathedralLongitude: '-84.674100',
      },
      {
        name:               'Grand Rapids',
        seeType:            'diocese',
        stateRegion:        'Michigan',
        dateErected:        new Date('1882-04-22'),
        cathedralName:      'Cathedral of Saint Andrew',
        cathedralAddress:   '224 Sheldon Ave SE, Grand Rapids, MI 49503',
        cathedralLatitude:  '42.958800',
        cathedralLongitude: '-85.668700',
      },
      {
        name:               'Kalamazoo',
        seeType:            'diocese',
        stateRegion:        'Michigan',
        dateErected:        new Date('1971-03-19'),
        cathedralName:      'Saint Augustine Cathedral',
        cathedralAddress:   '545 W Michigan Ave, Kalamazoo, MI 49007',
        cathedralLatitude:  '42.291700',
        cathedralLongitude: '-85.587200',
      },
      {
        name:               'Lansing',
        seeType:            'diocese',
        stateRegion:        'Michigan',
        dateErected:        new Date('1937-05-22'),
        cathedralName:      'Cathedral of Saint Mary',
        cathedralAddress:   '219 Seymour Ave, Lansing, MI 48933',
        cathedralLatitude:  '42.733500',
        cathedralLongitude: '-84.557300',
      },
      {
        name:               'Marquette',
        seeType:            'diocese',
        stateRegion:        'Michigan',
        dateErected:        new Date('1857-07-29'),
        cathedralName:      'Cathedral of Saint Peter',
        cathedralAddress:   '311 W Baraga Ave, Marquette, MI 49855',
        cathedralLatitude:  '46.543600',
        cathedralLongitude: '-87.395400',
      },
      {
        name:               'Saginaw',
        seeType:            'diocese',
        stateRegion:        'Michigan',
        dateErected:        new Date('1938-02-26'),
        cathedralName:      'Cathedral of Mary of the Assumption',
        cathedralAddress:   '615 Hoyt Ave, Saginaw, MI 48607',
        cathedralLatitude:  '43.419600',
        cathedralLongitude: '-83.950800',
      },
    ],
  },
  {
    metropolitanName: 'Chicago',
    suffragans: [
      {
        name:               'Belleville',
        seeType:            'diocese',
        stateRegion:        'Illinois',
        dateErected:        new Date('1887-02-12'),
        cathedralName:      'Cathedral of Saint Peter',
        cathedralAddress:   '200 W Harrison St, Belleville, IL 62220',
        cathedralLatitude:  '38.520100',
        cathedralLongitude: '-89.984000',
      },
      {
        name:               'Joliet',
        seeType:            'diocese',
        stateRegion:        'Illinois',
        dateErected:        new Date('1948-12-11'),
        cathedralName:      'Cathedral of Saint Raymond Nonnatus',
        cathedralAddress:   '604 N Raynor Ave, Joliet, IL 60435',
        cathedralLatitude:  '41.525000',
        cathedralLongitude: '-88.081700',
      },
      {
        name:               'Peoria',
        seeType:            'diocese',
        stateRegion:        'Illinois',
        dateErected:        new Date('1877-02-12'),
        cathedralName:      "Saint Mary's Cathedral",
        cathedralAddress:   '607 NE Madison Ave, Peoria, IL 61603',
        cathedralLatitude:  '40.693600',
        cathedralLongitude: '-89.589200',
      },
      {
        name:               'Rockford',
        seeType:            'diocese',
        stateRegion:        'Illinois',
        dateErected:        new Date('1908-09-23'),
        cathedralName:      'Cathedral of Saint Peter',
        cathedralAddress:   '1243 N Church St, Rockford, IL 61103',
        cathedralLatitude:  '42.271100',
        cathedralLongitude: '-89.093800',
      },
      {
        name:               'Springfield',
        seeType:            'diocese',
        stateRegion:        'Illinois',
        dateErected:        new Date('1853-07-29'),
        cathedralName:      'Immaculate Conception Cathedral',
        cathedralAddress:   '524 E Lawrence Ave, Springfield, IL 62703',
        cathedralLatitude:  '39.794700',
        cathedralLongitude: '-89.636800',
      },
    ],
  },
  {
    metropolitanName: 'Milwaukee',
    suffragans: [
      {
        name:               'Green Bay',
        seeType:            'diocese',
        stateRegion:        'Wisconsin',
        dateErected:        new Date('1868-03-03'),
        cathedralName:      'Cathedral of Saint Francis Xavier',
        cathedralAddress:   '140 S Jefferson St, Green Bay, WI 54301',
        cathedralLatitude:  '44.513300',
        cathedralLongitude: '-88.015700',
      },
      {
        name:               'La Crosse',
        seeType:            'diocese',
        stateRegion:        'Wisconsin',
        dateErected:        new Date('1868-03-03'),
        cathedralName:      'Cathedral of Saint Joseph the Workman',
        cathedralAddress:   '530 Main St, La Crosse, WI 54601',
        cathedralLatitude:  '43.801400',
        cathedralLongitude: '-91.252900',
      },
      {
        name:               'Madison',
        seeType:            'diocese',
        stateRegion:        'Wisconsin',
        dateErected:        new Date('1946-12-12'),
        cathedralName:      'Cathedral of Saint Raphael',
        cathedralAddress:   '222 W Main St, Madison, WI 53703',
        cathedralLatitude:  '43.073100',
        cathedralLongitude: '-89.386800',
      },
      {
        name:               'Superior',
        seeType:            'diocese',
        stateRegion:        'Wisconsin',
        dateErected:        new Date('1905-05-03'),
        cathedralName:      'Cathedral of Christ the King',
        cathedralAddress:   '1611 Belknap St, Superior, WI 54880',
        cathedralLatitude:  '46.720800',
        cathedralLongitude: '-92.101300',
      },
    ],
  },
  {
    metropolitanName: 'Indianapolis',
    suffragans: [
      {
        name:               'Evansville',
        seeType:            'diocese',
        stateRegion:        'Indiana',
        dateErected:        new Date('1944-11-11'),
        cathedralName:      'Assumption Cathedral',
        cathedralAddress:   '1107 Olive St, Evansville, IN 47710',
        cathedralLatitude:  '37.978200',
        cathedralLongitude: '-87.555800',
      },
      {
        name:               'Fort Wayne-South Bend',
        seeType:            'diocese',
        stateRegion:        'Indiana',
        dateErected:        new Date('1857-09-22'),
        cathedralName:      'Cathedral of the Immaculate Conception',
        cathedralAddress:   '1122 S Calhoun St, Fort Wayne, IN 46802',
        cathedralLatitude:  '41.075900',
        cathedralLongitude: '-85.139400',
      },
      {
        name:               'Gary',
        seeType:            'diocese',
        stateRegion:        'Indiana',
        dateErected:        new Date('1956-08-30'),
        cathedralName:      'Cathedral of the Holy Angels',
        cathedralAddress:   '575 Tyler St, Gary, IN 46402',
        cathedralLatitude:  '41.593400',
        cathedralLongitude: '-87.346800',
      },
      {
        name:               'Lafayette',
        seeType:            'diocese',
        stateRegion:        'Indiana',
        dateErected:        new Date('1944-11-11'),
        cathedralName:      'Saint Mary Cathedral',
        cathedralAddress:   '1217 N 6th St, Lafayette, IN 47901',
        cathedralLatitude:  '40.416700',
        cathedralLongitude: '-86.875300',
      },
    ],
  },
  {
    metropolitanName: 'New Orleans',
    suffragans: [
      {
        name:               'Alexandria',
        seeType:            'diocese',
        stateRegion:        'Louisiana',
        dateErected:        new Date('1853-07-29'),
        cathedralName:      'Cathedral of Saint Francis Xavier',
        cathedralAddress:   '626 4th St, Alexandria, LA 71301',
        cathedralLatitude:  '31.311300',
        cathedralLongitude: '-92.446700',
      },
      {
        name:               'Baton Rouge',
        seeType:            'diocese',
        stateRegion:        'Louisiana',
        dateErected:        new Date('1961-07-20'),
        cathedralName:      'Cathedral of Saint Joseph',
        cathedralAddress:   '412 Main St, Baton Rouge, LA 70801',
        cathedralLatitude:  '30.450800',
        cathedralLongitude: '-91.187400',
      },
      {
        name:               'Houma-Thibodaux',
        seeType:            'diocese',
        stateRegion:        'Louisiana',
        dateErected:        new Date('1977-06-04'),
        cathedralName:      'Cathedral of Saint Francis de Sales',
        cathedralAddress:   '734 Canal Blvd, Houma, LA 70360',
        cathedralLatitude:  '29.595800',
        cathedralLongitude: '-90.719500',
      },
      {
        name:               'Lafayette',
        seeType:            'diocese',
        stateRegion:        'Louisiana',
        dateErected:        new Date('1918-01-11'),
        cathedralName:      'Cathedral of Saint John the Evangelist',
        cathedralAddress:   '914 St John St, Lafayette, LA 70501',
        cathedralLatitude:  '30.224100',
        cathedralLongitude: '-92.019800',
      },
      {
        name:               'Lake Charles',
        seeType:            'diocese',
        stateRegion:        'Louisiana',
        dateErected:        new Date('1980-08-13'),
        cathedralName:      'Immaculate Conception Cathedral',
        cathedralAddress:   '935 Bilbo St, Lake Charles, LA 70601',
        cathedralLatitude:  '30.226600',
        cathedralLongitude: '-93.217400',
      },
      {
        name:               'Shreveport',
        seeType:            'diocese',
        stateRegion:        'Louisiana',
        dateErected:        new Date('1986-06-16'),
        cathedralName:      'Cathedral of Saint John Berchmans',
        cathedralAddress:   '1759 Spring St, Shreveport, LA 71101',
        cathedralLatitude:  '32.508200',
        cathedralLongitude: '-93.740200',
      },
      {
        name:               'Biloxi',
        seeType:            'diocese',
        stateRegion:        'Mississippi',
        dateErected:        new Date('1977-03-08'),
        cathedralName:      'Cathedral of the Nativity of the Blessed Virgin Mary',
        cathedralAddress:   '1116 Church Ave, Biloxi, MS 39530',
        cathedralLatitude:  '30.396000',
        cathedralLongitude: '-88.885300',
      },
      {
        name:               'Jackson',
        seeType:            'diocese',
        stateRegion:        'Mississippi',
        dateErected:        new Date('1837-07-28'),
        cathedralName:      'Cathedral of Saint Peter the Apostle',
        cathedralAddress:   '123 N West St, Jackson, MS 39201',
        cathedralLatitude:  '32.298800',
        cathedralLongitude: '-90.184800',
      },
    ],
  },
]

// Personal jurisdictions not belonging to any province
const SPECIAL_JURISDICTIONS: SuffraganEntry[] = [
  {
    name:               'Military Services, USA',
    seeType:            'archdiocese',
    namePrefixOverride: 'for the',
    stateRegion:        'District of Columbia',
    dateErected:        new Date('1985-04-04'),
    cathedralName:      null,
    cathedralAddress:   null,
    cathedralLatitude:  null,
    cathedralLongitude: null,
  },
  {
    name:               'Chair of Saint Peter',
    seeType:            'personal_ordinariate',
    namePrefixOverride: 'of the',
    stateRegion:        'Texas',
    dateErected:        new Date('2012-01-01'),
    cathedralName:      'Our Lady of Walsingham',
    cathedralAddress:   '3506 Rosedale St, Houston, TX 77004',
    cathedralLatitude:  '29.735900',
    cathedralLongitude: '-95.383100',
  },
]

// ─── Suffragan sees — central provinces ──────────────────────────────────────

const CENTRAL_PROVINCES: Array<{ metropolitanName: string; suffragans: SuffraganEntry[] }> = [
  {
    metropolitanName: 'Saint Louis',
    suffragans: [
      {
        name:               'Jefferson City',
        seeType:            'diocese',
        stateRegion:        'Missouri',
        dateErected:        new Date('1956-07-02'),
        cathedralName:      'Cathedral of Saint Joseph',
        cathedralAddress:   '2700 Cathedral Dr, Jefferson City, MO 65109',
        cathedralLatitude:  '38.568300',
        cathedralLongitude: '-92.215100',
      },
      {
        name:               'Kansas City-Saint Joseph',
        seeType:            'diocese',
        stateRegion:        'Missouri',
        dateErected:        new Date('1880-09-10'),
        cathedralName:      'Cathedral of the Immaculate Conception',
        cathedralAddress:   '416 W 12th St, Kansas City, MO 64105',
        cathedralLatitude:  '39.102100',
        cathedralLongitude: '-94.584000',
      },
      {
        name:               'Springfield-Cape Girardeau',
        seeType:            'diocese',
        stateRegion:        'Missouri',
        dateErected:        new Date('1956-07-02'),
        cathedralName:      'Cathedral of Saint Agnes',
        cathedralAddress:   '533 S Jefferson Ave, Springfield, MO 65806',
        cathedralLatitude:  '37.204900',
        cathedralLongitude: '-93.292300',
      },
    ],
  },
  {
    metropolitanName: 'Dubuque',
    suffragans: [
      {
        name:               'Davenport',
        seeType:            'diocese',
        stateRegion:        'Iowa',
        dateErected:        new Date('1881-02-16'),
        cathedralName:      'Sacred Heart Cathedral',
        cathedralAddress:   '422 E 10th St, Davenport, IA 52803',
        cathedralLatitude:  '41.525200',
        cathedralLongitude: '-90.571800',
      },
      {
        name:               'Des Moines',
        seeType:            'diocese',
        stateRegion:        'Iowa',
        dateErected:        new Date('1911-08-12'),
        cathedralName:      'Cathedral of Saint Ambrose',
        cathedralAddress:   '607 High St, Des Moines, IA 50309',
        cathedralLatitude:  '41.593900',
        cathedralLongitude: '-93.623600',
      },
      {
        name:               'Sioux City',
        seeType:            'diocese',
        stateRegion:        'Iowa',
        dateErected:        new Date('1902-01-18'),
        cathedralName:      'Cathedral of the Epiphany',
        cathedralAddress:   '1000 Douglas St, Sioux City, IA 51101',
        cathedralLatitude:  '42.497100',
        cathedralLongitude: '-96.401500',
      },
    ],
  },
  {
    metropolitanName: 'Saint Paul and Minneapolis',
    suffragans: [
      {
        name:               'Crookston',
        seeType:            'diocese',
        stateRegion:        'Minnesota',
        dateErected:        new Date('1909-12-31'),
        cathedralName:      'Cathedral of the Immaculate Conception',
        cathedralAddress:   '218 N Broadway, Crookston, MN 56716',
        cathedralLatitude:  '47.775000',
        cathedralLongitude: '-96.608800',
      },
      {
        name:               'Duluth',
        seeType:            'diocese',
        stateRegion:        'Minnesota',
        dateErected:        new Date('1889-07-31'),
        cathedralName:      'Cathedral of Our Lady of the Rosary',
        cathedralAddress:   '2801 E 4th St, Duluth, MN 55812',
        cathedralLatitude:  '46.780700',
        cathedralLongitude: '-92.103300',
      },
      {
        name:               'New Ulm',
        seeType:            'diocese',
        stateRegion:        'Minnesota',
        dateErected:        new Date('1957-11-18'),
        cathedralName:      'Cathedral of the Holy Trinity',
        cathedralAddress:   '605 N State St, New Ulm, MN 56073',
        cathedralLatitude:  '44.312400',
        cathedralLongitude: '-94.460900',
      },
      {
        name:               'Saint Cloud',
        seeType:            'diocese',
        stateRegion:        'Minnesota',
        dateErected:        new Date('1889-07-31'),
        cathedralName:      'Cathedral of Saint Mary',
        cathedralAddress:   '25 8th Ave S, Saint Cloud, MN 56301',
        cathedralLatitude:  '45.557500',
        cathedralLongitude: '-94.155400',
      },
      {
        name:               'Winona-Rochester',
        seeType:            'diocese',
        stateRegion:        'Minnesota',
        dateErected:        new Date('1889-07-31'),
        cathedralName:      'Cathedral of the Sacred Heart',
        cathedralAddress:   '36 W Wabasha St, Winona, MN 55987',
        cathedralLatitude:  '44.049800',
        cathedralLongitude: '-91.639300',
      },
      {
        name:               'Bismarck',
        seeType:            'diocese',
        stateRegion:        'North Dakota',
        dateErected:        new Date('1909-12-31'),
        cathedralName:      'Cathedral of the Holy Spirit',
        cathedralAddress:   '519 Raymond St, Bismarck, ND 58501',
        cathedralLatitude:  '46.804700',
        cathedralLongitude: '-100.784800',
      },
      {
        name:               'Fargo',
        seeType:            'diocese',
        stateRegion:        'North Dakota',
        dateErected:        new Date('1889-11-12'),
        cathedralName:      'Cathedral of Saint Mary',
        cathedralAddress:   '604 Broadway N, Fargo, ND 58102',
        cathedralLatitude:  '46.879100',
        cathedralLongitude: '-96.789600',
      },
      {
        name:               'Rapid City',
        seeType:            'diocese',
        stateRegion:        'South Dakota',
        // Originally Diocese of Lead (1902); see transferred to Rapid City 1930
        dateErected:        new Date('1902-08-06'),
        cathedralName:      'Cathedral of Our Lady of Perpetual Help',
        cathedralAddress:   '606 Cathedral Dr, Rapid City, SD 57701',
        cathedralLatitude:  '44.081000',
        cathedralLongitude: '-103.231000',
      },
      {
        name:               'Sioux Falls',
        seeType:            'diocese',
        stateRegion:        'South Dakota',
        dateErected:        new Date('1889-11-12'),
        cathedralName:      'Cathedral of Saint Joseph',
        cathedralAddress:   '521 N Duluth Ave, Sioux Falls, SD 57104',
        cathedralLatitude:  '43.545900',
        cathedralLongitude: '-96.734000',
      },
    ],
  },
  {
    metropolitanName: 'Omaha',
    suffragans: [
      {
        name:               'Grand Island',
        seeType:            'diocese',
        stateRegion:        'Nebraska',
        dateErected:        new Date('1912-08-10'),
        cathedralName:      'Cathedral of the Nativity of the Blessed Virgin Mary',
        cathedralAddress:   '203 S Cedar St, Grand Island, NE 68801',
        cathedralLatitude:  '40.926200',
        cathedralLongitude: '-98.347000',
      },
      {
        name:               'Lincoln',
        seeType:            'diocese',
        stateRegion:        'Nebraska',
        dateErected:        new Date('1887-10-01'),
        cathedralName:      'Cathedral of the Risen Christ',
        cathedralAddress:   '3500 Sheridan Blvd, Lincoln, NE 68506',
        cathedralLatitude:  '40.796100',
        cathedralLongitude: '-96.665200',
      },
    ],
  },
  {
    metropolitanName: 'Kansas City in Kansas',
    suffragans: [
      {
        name:               'Dodge City',
        seeType:            'diocese',
        stateRegion:        'Kansas',
        dateErected:        new Date('1951-08-02'),
        cathedralName:      'Cathedral of Our Lady of Guadalupe',
        cathedralAddress:   '910 Central Ave, Dodge City, KS 67801',
        cathedralLatitude:  '37.754300',
        cathedralLongitude: '-100.018200',
      },
      {
        name:               'Salina',
        seeType:            'diocese',
        stateRegion:        'Kansas',
        dateErected:        new Date('1887-08-02'),
        cathedralName:      'Cathedral of the Sacred Heart',
        cathedralAddress:   '118 E Iron Ave, Salina, KS 67401',
        cathedralLatitude:  '38.837100',
        cathedralLongitude: '-97.610800',
      },
      {
        name:               'Wichita',
        seeType:            'diocese',
        stateRegion:        'Kansas',
        dateErected:        new Date('1887-08-02'),
        cathedralName:      'Cathedral of the Immaculate Conception',
        cathedralAddress:   '307 E 13th St N, Wichita, KS 67214',
        cathedralLatitude:  '37.701400',
        cathedralLongitude: '-97.325900',
      },
    ],
  },
  {
    metropolitanName: 'Oklahoma City',
    suffragans: [
      {
        name:               'Tulsa',
        seeType:            'diocese',
        stateRegion:        'Oklahoma',
        dateErected:        new Date('1973-12-13'),
        cathedralName:      'Holy Family Cathedral',
        cathedralAddress:   '820 S Boulder Ave, Tulsa, OK 74119',
        cathedralLatitude:  '36.152100',
        cathedralLongitude: '-95.993500',
      },
    ],
  },
  {
    metropolitanName: 'San Antonio',
    suffragans: [
      {
        name:               'Amarillo',
        seeType:            'diocese',
        stateRegion:        'Texas',
        dateErected:        new Date('1926-08-25'),
        cathedralName:      'Cathedral of Saint Laurence',
        cathedralAddress:   '1200 S Georgia St, Amarillo, TX 79102',
        cathedralLatitude:  '35.199200',
        cathedralLongitude: '-101.842700',
      },
      {
        name:               'Austin',
        seeType:            'diocese',
        stateRegion:        'Texas',
        dateErected:        new Date('1947-04-16'),
        cathedralName:      'Cathedral of Saint Mary',
        cathedralAddress:   '203 E 10th St, Austin, TX 78701',
        cathedralLatitude:  '30.270000',
        cathedralLongitude: '-97.740400',
      },
      {
        name:               'Brownsville',
        seeType:            'diocese',
        stateRegion:        'Texas',
        dateErected:        new Date('1965-10-07'),
        cathedralName:      'Cathedral of the Immaculate Conception',
        cathedralAddress:   '1218 E Jefferson St, Brownsville, TX 78520',
        cathedralLatitude:  '25.901700',
        cathedralLongitude: '-97.486900',
      },
      {
        name:               'Corpus Christi',
        seeType:            'diocese',
        stateRegion:        'Texas',
        dateErected:        new Date('1912-03-23'),
        cathedralName:      'Cathedral of Corpus Christi',
        cathedralAddress:   '505 N Upper Broadway, Corpus Christi, TX 78401',
        cathedralLatitude:  '27.800600',
        cathedralLongitude: '-97.396400',
      },
      {
        name:               'El Paso',
        seeType:            'diocese',
        stateRegion:        'Texas',
        dateErected:        new Date('1914-03-03'),
        cathedralName:      'Saint Patrick Cathedral',
        cathedralAddress:   '1118 N Mesa St, El Paso, TX 79902',
        cathedralLatitude:  '31.760600',
        cathedralLongitude: '-106.490000',
      },
      {
        name:               'Fort Worth',
        seeType:            'diocese',
        stateRegion:        'Texas',
        dateErected:        new Date('1969-08-08'),
        cathedralName:      'Saint Patrick Cathedral',
        cathedralAddress:   '1206 Throckmorton St, Fort Worth, TX 76102',
        cathedralLatitude:  '32.756600',
        cathedralLongitude: '-97.330400',
      },
      {
        name:               'Laredo',
        seeType:            'diocese',
        stateRegion:        'Texas',
        dateErected:        new Date('2000-07-03'),
        cathedralName:      'San Agustín Cathedral',
        cathedralAddress:   '214 San Bernardo Ave, Laredo, TX 78040',
        cathedralLatitude:  '27.503600',
        cathedralLongitude: '-99.507600',
      },
      {
        name:               'Lubbock',
        seeType:            'diocese',
        stateRegion:        'Texas',
        dateErected:        new Date('1983-11-15'),
        cathedralName:      'Cathedral of Christ the King',
        cathedralAddress:   '2910 53rd St, Lubbock, TX 79413',
        cathedralLatitude:  '33.544800',
        cathedralLongitude: '-101.907900',
      },
      {
        name:               'San Angelo',
        seeType:            'diocese',
        stateRegion:        'Texas',
        dateErected:        new Date('1961-03-23'),
        cathedralName:      'Cathedral of the Sacred Heart',
        cathedralAddress:   '18 S Irving St, San Angelo, TX 76903',
        cathedralLatitude:  '31.463800',
        cathedralLongitude: '-100.435000',
      },
      {
        name:               'Victoria',
        seeType:            'diocese',
        stateRegion:        'Texas',
        dateErected:        new Date('1982-03-29'),
        cathedralName:      'Cathedral of Our Lady of Victory',
        cathedralAddress:   '306 E Church St, Victoria, TX 77901',
        cathedralLatitude:  '28.805200',
        cathedralLongitude: '-97.003700',
      },
    ],
  },
  {
    metropolitanName: 'Galveston-Houston',
    suffragans: [
      {
        name:               'Beaumont',
        seeType:            'diocese',
        stateRegion:        'Texas',
        dateErected:        new Date('1966-12-17'),
        cathedralName:      'Cathedral of Saint Anthony of Padua',
        cathedralAddress:   '700 Jefferson St, Beaumont, TX 77701',
        cathedralLatitude:  '30.086000',
        cathedralLongitude: '-94.101800',
      },
      {
        name:               'Dallas',
        seeType:            'diocese',
        stateRegion:        'Texas',
        dateErected:        new Date('1890-08-03'),
        cathedralName:      'Cathedral Shrine of the Virgin of Guadalupe',
        cathedralAddress:   '2215 Ross Ave, Dallas, TX 75201',
        cathedralLatitude:  '32.789700',
        cathedralLongitude: '-96.798200',
      },
      {
        name:               'Tyler',
        seeType:            'diocese',
        stateRegion:        'Texas',
        dateErected:        new Date('1986-12-03'),
        cathedralName:      'Cathedral of the Immaculate Conception',
        cathedralAddress:   '1925 S Beckham Ave, Tyler, TX 75701',
        cathedralLatitude:  '32.339900',
        cathedralLongitude: '-95.297500',
      },
    ],
  },
  {
    metropolitanName: 'Denver',
    suffragans: [
      {
        name:               'Cheyenne',
        seeType:            'diocese',
        stateRegion:        'Wyoming',
        dateErected:        new Date('1887-08-02'),
        cathedralName:      'Cathedral of Saint Mary',
        cathedralAddress:   '2107 Capitol Ave, Cheyenne, WY 82001',
        cathedralLatitude:  '41.139400',
        cathedralLongitude: '-104.823400',
      },
      {
        name:               'Colorado Springs',
        seeType:            'diocese',
        stateRegion:        'Colorado',
        dateErected:        new Date('1984-11-10'),
        cathedralName:      'Cathedral of Saint Mary',
        cathedralAddress:   '26 W Kiowa St, Colorado Springs, CO 80903',
        cathedralLatitude:  '38.832000',
        cathedralLongitude: '-104.822500',
      },
      {
        name:               'Pueblo',
        seeType:            'diocese',
        stateRegion:        'Colorado',
        dateErected:        new Date('1941-11-15'),
        cathedralName:      'Cathedral of the Sacred Heart',
        cathedralAddress:   '11 W 7th St, Pueblo, CO 81003',
        cathedralLatitude:  '38.272700',
        cathedralLongitude: '-104.612000',
      },
    ],
  },
]

// ─── Seed functions ──────────────────────────────────────────────────────────

async function seedRites(): Promise<Record<string, string>> {
  const ids: Record<string, string> = {}
  for (const rite of RITES) {
    const existing = await prisma.rite.findFirst({ where: { name: rite.name } })
    const record = existing ?? (await prisma.rite.create({ data: rite }))
    ids[rite.name] = record.id
  }
  console.log(`  ${Object.keys(ids).length} rites (${RITES.length - Object.values(ids).length} skipped as existing)`)
  return ids
}

async function seedCountries(): Promise<Record<string, string>> {
  const ids: Record<string, string> = {}
  for (const country of COUNTRIES) {
    const existing = await prisma.country.findFirst({ where: { isoCode: country.isoCode } })
    const record = existing ?? (await prisma.country.create({ data: country }))
    ids[country.isoCode] = record.id
  }
  console.log(`  ${Object.keys(ids).length} countries`)
  return ids
}

async function seedMetropolitanSees(latinRiteId: string, usId: string): Promise<void> {
  let created = 0
  let skipped = 0

  for (const see of METROPOLITAN_SEES) {
    const existing = await prisma.see.findFirst({
      where: { name: see.name, countryId: usId },
    })

    if (existing) {
      skipped++
      continue
    }

    await prisma.see.create({
      data: {
        name:               see.name,
        slug:               mkSlug(see.name),
        seeType:            'archdiocese',
        riteId:             latinRiteId,
        countryId:          usId,
        stateRegion:        see.stateRegion,
        isMetropolitan:     true,
        metropolitanSeeId:  null,
        dateErected:        see.dateErected,
        cathedralName:      see.cathedralName,
        cathedralAddress:   see.cathedralAddress,
        cathedralLatitude:  see.cathedralLatitude,
        cathedralLongitude: see.cathedralLongitude,
      },
    })
    created++
  }

  console.log(`  ${created} metropolitan sees created, ${skipped} skipped`)
}

async function seedSuffraganSees(latinRiteId: string, usId: string): Promise<void> {
  const metropolitans = await prisma.see.findMany({
    where: { isMetropolitan: true, countryId: usId },
    select: { id: true, name: true },
  })
  const metroMap = new Map(metropolitans.map((m) => [m.name, m.id]))

  let created = 0
  let skipped = 0

  for (const province of [...EASTERN_PROVINCES, ...CENTRAL_PROVINCES]) {
    const metropolitanSeeId = metroMap.get(province.metropolitanName) ?? null
    if (!metropolitanSeeId) {
      console.warn(`  Warning: metropolitan '${province.metropolitanName}' not found — skipping its suffragans`)
      continue
    }

    for (const suf of province.suffragans) {
      const existing = await prisma.see.findFirst({
        where: { name: suf.name, stateRegion: suf.stateRegion, countryId: usId },
      })
      if (existing) { skipped++; continue }

      await prisma.see.create({
        data: {
          name:               suf.name,
          slug:               mkSlug(suf.name),
          seeType:            suf.seeType,
          namePrefixOverride: suf.namePrefixOverride ?? null,
          riteId:             latinRiteId,
          countryId:          usId,
          stateRegion:        suf.stateRegion,
          isMetropolitan:     false,
          metropolitanSeeId,
          dateErected:        suf.dateErected ?? null,
          cathedralName:      suf.cathedralName ?? null,
          cathedralAddress:   suf.cathedralAddress ?? null,
          cathedralLatitude:  suf.cathedralLatitude ?? null,
          cathedralLongitude: suf.cathedralLongitude ?? null,
        },
      })
      created++
    }
  }

  for (const jur of SPECIAL_JURISDICTIONS) {
    const existing = await prisma.see.findFirst({
      where: { name: jur.name, countryId: usId },
    })
    if (existing) { skipped++; continue }

    await prisma.see.create({
      data: {
        name:               jur.name,
        slug:               mkSlug(jur.name),
        seeType:            jur.seeType,
        namePrefixOverride: jur.namePrefixOverride ?? null,
        riteId:             latinRiteId,
        countryId:          usId,
        stateRegion:        jur.stateRegion,
        isMetropolitan:     false,
        metropolitanSeeId:  null,
        dateErected:        jur.dateErected ?? null,
        cathedralName:      jur.cathedralName ?? null,
        cathedralAddress:   jur.cathedralAddress ?? null,
        cathedralLatitude:  jur.cathedralLatitude ?? null,
        cathedralLongitude: jur.cathedralLongitude ?? null,
      },
    })
    created++
  }

  console.log(`  ${created} suffragan sees created, ${skipped} skipped`)
}

// ─── Entry point ─────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding rites...')
  const riteIds = await seedRites()

  console.log('Seeding countries...')
  const countryIds = await seedCountries()

  console.log('Seeding metropolitan archdioceses...')
  await seedMetropolitanSees(riteIds['Latin'], countryIds['US'])

  console.log('Seeding suffragan sees (eastern provinces)...')
  await seedSuffraganSees(riteIds['Latin'], countryIds['US'])

  console.log('Done.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
