import { DemoTicketData } from './ticketTypes';
import JsBarcode from 'jsbarcode';

const TAX_RATE = 0.2483333333;

export const DEFAULT_AGENCY_LOGO = '/default-agency-logo.png';
export const GENERATED_AGENCY_LOGO = '/generated-agency-logo.jpg';
export const RANDOM_AGENCY_LOGOS = [
  '/generated-agency-logo.jpg',
  '/random-agency-logo-1.png',
  '/random-agency-logo-2.png',
  '/random-agency-logo-4.png',
];

export interface AgencyProfile {
  name: string;
  address: string;
  email: string;
  tel: string;
}

export const AGENCY_PRESETS: AgencyProfile[] = [
  {
    name: 'Al Raha Tours-Sharjah',
    address: 'Near Al Madeena Hypermarket, Al Zahra St, Rolla, Sharjah, UAE',
    email: 'info@alrahatours.com',
    tel: '+971 50 165 0070',
  },
  {
    name: 'Joelle Travel Services',
    address: 'Office 304, Al Maha Tower Block A, Al Taawun Street, Sharjah, UAE',
    email: 'info@joelletravel.com',
    tel: '+971 52 235 3358',
  },
  {
    name: 'Go Kite Travel & Tours Sharjah',
    address: 'Shuwaihean Building, Shop 29/30, Al Ghuwair, Sharjah, UAE',
    email: 'info@gokite.travel',
    tel: '+971 50 229 8658',
  },
  {
    name: 'Smart Travel',
    address: '2 24th Street, Bu Shaghara, Hay Al Qasimiah, Sharjah, UAE',
    email: 'info@smarttravel.ae',
    tel: '+971 6 522 7477',
  },
  {
    name: 'Smart Travel (Head Office)',
    address: 'Tower 400, 19th Floor, Al Soor, Sharjah, UAE',
    email: 'info@smarttravel.ae',
    tel: '+971 6 531 3533',
  },
  {
    name: 'Muwaileh Tourism | visa services | travel agency | Sharjah',
    address: 'Fire Station Road, Muwaileh Commercial Industrial Area, Sharjah, UAE',
    email: 'info@muwailehtourism.com',
    tel: '+971 6 535 3855',
  },
  {
    name: 'Seventh Sea holidays Travel Agency Sharjah',
    address: 'Sharjah Publishing City, Muwaileh Commercial, Al Zahia, Sharjah, UAE',
    email: 'info@seventhseaholidays.com',
    tel: '+971 55 253 9022',
  },
  {
    name: 'Mardan Express Travels And Tourism Sharjah',
    address: 'Shop #04, Building #443, Fire Station Road, Muwaileh, Sharjah, UAE',
    email: 'info@mardantravels.com',
    tel: '+971 50 775 7658',
  },
  {
    name: 'Arooha Tours',
    address: 'Ground Floor Shop 09, Al Arouba Building, Al Arouba Street, Rolla, Sharjah',
    email: 'contact@aroohatours.com',
    tel: '+971 56 828 3111',
  },
];

export interface AirlineOption {
  name: string;
  iata: string;
  economyCabinBaggage: string;
  businessCabinBaggage: string;
}

export const AIRLINE_OPTIONS: AirlineOption[] = [
  { name: 'Flydubai', iata: 'FZ', economyCabinBaggage: '7 Kg', businessCabinBaggage: '14 Kg (2x7 Kg)' },
  { name: 'Emirates', iata: 'EK', economyCabinBaggage: '7 Kg', businessCabinBaggage: '14 Kg (2x7 Kg)' },
  { name: 'Etihad Airways', iata: 'EY', economyCabinBaggage: '12 Kg (max 2 pieces)', businessCabinBaggage: '12 Kg (max 2 pieces)' },
  { name: 'Air Arabia', iata: 'G9', economyCabinBaggage: '10 Kg (7+3 Kg)', businessCabinBaggage: '10 Kg (7+3 Kg)' },
  { name: 'Biman Bangladesh Airlines', iata: 'BG', economyCabinBaggage: '7 Kg', businessCabinBaggage: '14 Kg (2x7 Kg)' },
  { name: 'US-Bangla Airlines', iata: 'BS', economyCabinBaggage: '7 Kg', businessCabinBaggage: '10 Kg' },
  { name: 'Air India', iata: 'AI', economyCabinBaggage: '7 Kg', businessCabinBaggage: '10 Kg' },
  { name: 'IndiGo', iata: '6E', economyCabinBaggage: '7 Kg', businessCabinBaggage: '7 Kg' },
  { name: 'Pakistan International Airlines', iata: 'PK', economyCabinBaggage: '7 Kg', businessCabinBaggage: '12 Kg' },
  { name: 'Ethiopian Airlines', iata: 'ET', economyCabinBaggage: '7 Kg', businessCabinBaggage: '14 Kg (2x7 Kg)' },
  { name: 'Uganda Airlines', iata: 'UR', economyCabinBaggage: '7 Kg', businessCabinBaggage: '14 Kg (2x7 Kg)' },
];

export const TRAVEL_CLASS_OPTIONS = ['Economy', 'Premium Economy', 'Business', 'First'];

export const CHECKIN_BAGGAGE_OPTIONS = ['20 Kg', '25 Kg', '30 Kg', '35 Kg', '40 Kg', '46 Kg'];

export const UAE_ORIGIN_OPTIONS = [
  'Dubai [DXB]',
  'Dubai Al Maktoum [DWC]',
  'Abu Dhabi [AUH]',
  'Sharjah [SHJ]',
  'Ras Al Khaimah [RKT]',
  'Al Ain [AAN]',
];

interface UaeAirlineOriginRule {
  allowedOrigins: string[];
  terminal: string;
}

const UAE_AIRLINE_ORIGIN_RULES: Record<string, UaeAirlineOriginRule> = {
  flydubai: {
    allowedOrigins: ['Dubai [DXB]'],
    terminal: 'Terminal 2',
  },
  emirates: {
    allowedOrigins: ['Dubai [DXB]'],
    terminal: 'Terminal 3',
  },
  'air arabia': {
    allowedOrigins: ['Sharjah [SHJ]', 'Abu Dhabi [AUH]'],
    terminal: 'Terminal 1',
  },
};

export const DESTINATION_OPTIONS = [
  'Dhaka [DAC] - Bangladesh',
  'Chattogram [CGP] - Bangladesh',
  'Sylhet [ZYL] - Bangladesh',
  'Delhi [DEL] - India',
  'Mumbai [BOM] - India',
  'Kolkata [CCU] - India',
  'Kochi [COK] - India',
  'Kozhikode [CCJ] - India',
  'Hyderabad [HYD] - India',
  'Karachi [KHI] - Pakistan',
  'Lahore [LHE] - Pakistan',
  'Islamabad [ISB] - Pakistan',
  'Peshawar [PEW] - Pakistan',
  'Sialkot [SKT] - Pakistan',
  'Addis Ababa [ADD] - Ethiopia',
  'Entebbe [EBB] - Uganda',
  'Nairobi [NBO] - Kenya',
  'Dar es Salaam [DAR] - Tanzania',
];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toDateTimeLocalValue(date: Date): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatDateToDateTimeLocalInput(date: Date): string {
  return toDateTimeLocalValue(date);
}

function getRandomMinuteBucket(): number {
  const buckets = [0, 10, 15, 20, 30, 40, 45, 50];
  return buckets[Math.floor(Math.random() * buckets.length)];
}

function getAirportCodeFromRoute(route: string): string {
  const match = route.match(/\[([A-Z]{3})\]/);
  return match?.[1] || '';
}

const NONSTOP_DURATION_MINUTES_BY_AIRPORT: Record<string, number> = {
  DAC: 310,
  CGP: 320,
  ZYL: 340,
  DEL: 205,
  BOM: 185,
  CCU: 265,
  COK: 235,
  CCJ: 240,
  HYD: 215,
  KHI: 130,
  LHE: 185,
  ISB: 190,
  PEW: 200,
  SKT: 190,
  ADD: 250,
  EBB: 330,
  NBO: 300,
  DAR: 340,
};

const DEFAULT_NONSTOP_DURATION_MINUTES = 270;
const DEFAULT_FARE_RANGE: [number, number] = [500, 2000];
const DESTINATION_FARE_RANGE_BY_AIRPORT: Record<string, [number, number]> = {
  DAC: [700, 1500],
  CGP: [720, 1550],
  ZYL: [760, 1600],
  DEL: [500, 1200],
  BOM: [500, 1250],
  CCU: [650, 1400],
  COK: [620, 1350],
  CCJ: [650, 1400],
  HYD: [600, 1350],
  KHI: [500, 1100],
  LHE: [560, 1300],
  ISB: [580, 1350],
  PEW: [620, 1400],
  SKT: [580, 1300],
  ADD: [850, 1800],
  EBB: [950, 2000],
  NBO: [920, 1950],
  DAR: [980, 2000],
};

export function generateDemoReferenceNumber(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `AG${randomDigits}`;
}

export function generateRandomDepartureDateTimeForToday(baseDate = new Date()): string {
  const date = new Date(baseDate);
  date.setHours(Math.floor(Math.random() * 24), getRandomMinuteBucket(), 0, 0);
  return toDateTimeLocalValue(date);
}

export function generateRandomDepartureDateTimeByDate(dateValue: string): string {
  if (!dateValue) return generateRandomDepartureDateTimeForToday(new Date());

  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return generateRandomDepartureDateTimeForToday(new Date());

  date.setHours(Math.floor(Math.random() * 24), getRandomMinuteBucket(), 0, 0);
  return toDateTimeLocalValue(date);
}

export function estimateArrivalDateTime(departureDateTime: string, toLocation: string): string {
  const departure = new Date(departureDateTime);
  if (Number.isNaN(departure.getTime())) return departureDateTime;

  const airportCode = getAirportCodeFromRoute(toLocation);
  const durationMinutes = NONSTOP_DURATION_MINUTES_BY_AIRPORT[airportCode] ?? DEFAULT_NONSTOP_DURATION_MINUTES;
  const arrival = new Date(departure.getTime() + durationMinutes * 60 * 1000);
  return toDateTimeLocalValue(arrival);
}

function randomMoneyInRange(min: number, max: number): string {
  const value = min + Math.random() * (max - min);
  return value.toFixed(2);
}

export function getRandomBaseFareByDestination(toLocation: string): string {
  const airportCode = getAirportCodeFromRoute(toLocation);
  const [min, max] = DESTINATION_FARE_RANGE_BY_AIRPORT[airportCode] ?? DEFAULT_FARE_RANGE;
  return randomMoneyInRange(min, max);
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function getRandomAgencyLogo(): string {
  return randomItem(RANDOM_AGENCY_LOGOS);
}

function hashTextToIndex(text: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return modulo > 0 ? hash % modulo : 0;
}

export function getAgencyLinkedRandomLogo(agencyName: string): string {
  const normalized = agencyName.trim().toLowerCase();
  if (!normalized) return RANDOM_AGENCY_LOGOS[0];
  return RANDOM_AGENCY_LOGOS[hashTextToIndex(normalized, RANDOM_AGENCY_LOGOS.length)];
}

export function getUaeOriginRuleByAirline(airlineName: string): UaeAirlineOriginRule | null {
  const normalized = normalizeAirlineName(airlineName);
  if (!normalized) return null;

  const exact = UAE_AIRLINE_ORIGIN_RULES[normalized];
  if (exact) return exact;

  const partialKey = Object.keys(UAE_AIRLINE_ORIGIN_RULES).find(
    (key) => normalized.includes(key) || key.includes(normalized)
  );
  return partialKey ? UAE_AIRLINE_ORIGIN_RULES[partialKey] : null;
}

export function getOriginAndTerminalByAirline(airlineName: string): { fromLocation: string; fromTerminal: string } {
  const rule = getUaeOriginRuleByAirline(airlineName);
  if (!rule) {
    return { fromLocation: 'Dubai [DXB]', fromTerminal: 'Terminal 1' };
  }

  return {
    fromLocation: randomItem(rule.allowedOrigins),
    fromTerminal: rule.terminal,
  };
}

export function getRandomAirlineByDestination(toLocation: string): string {
  const destination = toLocation.toLowerCase();

  if (destination.includes('bangladesh')) {
    return randomItem(['Flydubai', 'Emirates', 'Biman Bangladesh Airlines', 'US-Bangla Airlines', 'Air Arabia']);
  }

  if (destination.includes('india')) {
    return randomItem(['Air India', 'IndiGo', 'Emirates', 'Etihad Airways', 'Air Arabia', 'Flydubai']);
  }

  if (destination.includes('pakistan')) {
    return randomItem(['Pakistan International Airlines', 'Emirates', 'Etihad Airways', 'Flydubai', 'Air Arabia']);
  }

  if (
    destination.includes('ethiopia') ||
    destination.includes('uganda') ||
    destination.includes('kenya') ||
    destination.includes('tanzania')
  ) {
    return randomItem(['Ethiopian Airlines', 'Uganda Airlines', 'Emirates', 'Etihad Airways', 'Flydubai']);
  }

  return randomItem(['Flydubai', 'Emirates', 'Etihad Airways', 'Air Arabia']);
}

export function getRandomCheckInBaggage(): string {
  return randomItem(['30 Kg', '35 Kg', '40 Kg', '46 Kg']);
}

export function generateAlphaNumericCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function generateDummyTicketNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let code = 'A2';
  for (let i = 0; i < 7; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function randomFlightDigits(): string {
  const number = Math.floor(100 + Math.random() * 900);
  return String(number);
}

export function normalizeAirlineName(name: string): string {
  return name.trim().toLowerCase();
}

export function getAirlineOptionByName(name: string): AirlineOption | null {
  const normalized = normalizeAirlineName(name);
  if (!normalized) return null;

  const exact = AIRLINE_OPTIONS.find((option) => normalizeAirlineName(option.name) === normalized);
  if (exact) return exact;

  const partial = AIRLINE_OPTIONS.find((option) =>
    normalizeAirlineName(option.name).includes(normalized) || normalized.includes(normalizeAirlineName(option.name))
  );
  return partial || null;
}

export function deriveIataCodeForCustomAirline(airlineName: string): string {
  const cleaned = airlineName.replace(/[^A-Za-z0-9 ]/g, ' ').trim();
  if (!cleaned) return 'XX';

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    const token = words[0].toUpperCase().slice(0, 2);
    return token.length === 2 ? token : `${token}X`.slice(0, 2);
  }

  const letters = `${words[0][0] ?? 'X'}${words[1][0] ?? 'X'}`.toUpperCase();
  return letters;
}

export function generateFlightNumberFromAirline(airlineName: string): string {
  const match = getAirlineOptionByName(airlineName);
  const iata = match?.iata || deriveIataCodeForCustomAirline(airlineName);
  return `${iata} ${randomFlightDigits()}`;
}

export function getCabinBaggageByAirlineAndClass(airlineName: string, travelClass: string): string {
  const option = getAirlineOptionByName(airlineName);
  if (!option) return '7 Kg';

  const normalizedClass = travelClass.trim().toLowerCase();
  if (normalizedClass === 'business' || normalizedClass === 'first') {
    return option.businessCabinBaggage;
  }
  return option.economyCabinBaggage;
}

function extractWeightLabel(value: string): string {
  const normalized = value.trim();
  if (!normalized) return '-';
  return normalized;
}

export function generateAutoBaggageContent(airlineName: string, checkInBaggage: string, cabinBaggage: string): {
  title: string;
  notes: string;
} {
  const airline = airlineName.trim() || 'Selected airline';
  const checkIn = extractWeightLabel(checkInBaggage);
  const cabin = extractWeightLabel(cabinBaggage);

  const title = `Baggage Allowance (${airline}): Check-in ${checkIn} | Cabin ${cabin}`;
  const notes = [
    `Cabin: Adult ${cabin}. Excess hand baggage may be charged at the airport.`,
    `Check-in: Adult ${checkIn}. Oversize/overweight bags may incur additional fees.`,
    'Restricted and prohibited items follow airline and airport safety policy.',
    'Final allowance can vary by route/fare/frequent-flyer tier; verify at check-in.',
  ].join('\n');

  return { title, notes };
}

export function getDefaultTicketData(): DemoTicketData {
  const now = new Date();
  const departureDateTime = generateRandomDepartureDateTimeForToday(now);
  const arrivalDateTime = estimateArrivalDateTime(departureDateTime, 'Dhaka [DAC]');

  const defaultBaseFare = getRandomBaseFareByDestination('Dhaka [DAC]');
  const defaultTax = calculateTaxFromBaseFare(defaultBaseFare);
  const defaultTotal = calculateTotalFareFromBaseFare(defaultBaseFare);

  const defaultAgency = AGENCY_PRESETS[0];

  const autoBaggage = generateAutoBaggageContent('Flydubai', '40 Kg', '7 Kg');

  return {
    agencyName: defaultAgency.name,
    agencyAddress: defaultAgency.address,
    agencyTel: defaultAgency.tel,
    agencyEmail: defaultAgency.email,
    agencyLogoUrl: DEFAULT_AGENCY_LOGO,
    passengerName: 'Ainul islam',
    bookingDate: toDateTimeLocalValue(now),
    fromLocation: 'Dubai [DXB]',
    fromTerminal: 'Terminal 2',
    toLocation: 'Dhaka [DAC]',
    toTerminal: 'Terminal 1',
    departureDateTime,
    arrivalDateTime,
    airline: 'Flydubai',
    flightNumber: 'FZ 501',
    travelClass: 'Economy',
    stops: 'Non Stop',
    checkInBaggage: '40 Kg',
    cabinBaggage: '7 Kg',
    baggage: autoBaggage.title,
    baggageNotes: autoBaggage.notes,
    baseFare: defaultBaseFare,
    tax: defaultTax,
    totalFare: defaultTotal,
    status: 'CONFIRMED',
  };
}

export function applyAgencyProfileToTicket(data: DemoTicketData, profile: AgencyProfile, logoUrl: string): DemoTicketData {
  return {
    ...data,
    agencyName: profile.name,
    agencyAddress: profile.address,
    agencyEmail: profile.email,
    agencyTel: profile.tel,
    agencyLogoUrl: logoUrl,
  };
}

export function getRandomAgencyProfile(): AgencyProfile {
  const index = Math.floor(Math.random() * AGENCY_PRESETS.length);
  return AGENCY_PRESETS[index];
}

export function formatDateTime(value: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function parseAmount(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function calculateTotalFare(baseFare: string, tax: string): string {
  return (parseAmount(baseFare) + parseAmount(tax)).toFixed(2);
}

export function calculateTaxFromBaseFare(baseFare: string): string {
  return (parseAmount(baseFare) * TAX_RATE).toFixed(2);
}

export function calculateTotalFareFromBaseFare(baseFare: string): string {
  const tax = parseAmount(calculateTaxFromBaseFare(baseFare));
  return (parseAmount(baseFare) + tax).toFixed(2);
}

export function calculateDuration(departureDateTime: string, arrivalDateTime: string): string {
  const start = new Date(departureDateTime);
  const end = new Date(arrivalDateTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '-';

  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return '-';

  const minutes = Math.round(diffMs / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return `${hours}h ${remainMinutes}m`;
}

export function formatMoney(value: string): string {
  return parseAmount(value).toFixed(2);
}

export function formatDateOnly(value: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTimeOnly(value: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function generateBarcodeDataUrl(text: string): string {
  if (!text) return '';
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, text, {
    format: 'CODE128',
    displayValue: false,
    margin: 0,
    width: 1.5,
    height: 36,
    background: '#ffffff',
    lineColor: '#000000',
  });
  return canvas.toDataURL('image/png');
}
