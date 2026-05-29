import { DemoTicketData } from './ticketTypes';
import JsBarcode from 'jsbarcode';

const FLIGHT_HOURS_AHEAD = 6;
const ARRIVAL_HOURS_AFTER_DEPARTURE = 5;
const TAX_RATE = 0.2483333333;

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

export function generateDemoReferenceNumber(): string {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `AG${randomDigits}`;
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

export function getDefaultTicketData(): DemoTicketData {
  const now = new Date();
  const departure = new Date(now.getTime() + FLIGHT_HOURS_AHEAD * 60 * 60 * 1000);
  const arrival = new Date(departure.getTime() + ARRIVAL_HOURS_AFTER_DEPARTURE * 60 * 60 * 1000);

  const defaultBaseFare = '600.00';
  const defaultTax = calculateTaxFromBaseFare(defaultBaseFare);
  const defaultTotal = calculateTotalFareFromBaseFare(defaultBaseFare);

  return {
    agencyName: 'HABAT AL LULU TYPING & DOCUMENTS COPYING',
    agencyAddress: 'POLIMAR BUILDING SHOP S06A, INDUSTRIAL AREA 1, SHARJAH, UAE',
    agencyTel: '0555997270',
    agencyEmail: 'habatallulu.typing@gmail.com',
    agencyLogoUrl: '/default-agency-logo.png',
    passengerName: 'MD SUMON SHEIK',
    bookingDate: toDateTimeLocalValue(now),
    fromLocation: 'Dubai [DXB]',
    fromTerminal: 'Terminal 2',
    toLocation: 'Dhaka [DAC]',
    toTerminal: 'Terminal 1',
    departureDateTime: toDateTimeLocalValue(departure),
    arrivalDateTime: toDateTimeLocalValue(arrival),
    airline: 'Flydubai',
    flightNumber: 'FZ 501',
    travelClass: 'Economy',
    stops: 'Non Stop',
    checkInBaggage: '40 Kg',
    cabinBaggage: '7 Kg',
    baggage: 'Baggage Allowance: Adult - 40 Kg',
    baggageNotes:
      'Bag 1 Chg May Apply If Bags Exceed TI Wt Allowance\nBag 2 Chgs May Apply If Bags Exceed TI Wt Allowance\nRefer to airline baggage policy for further details.',
    baseFare: defaultBaseFare,
    tax: defaultTax,
    totalFare: defaultTotal,
    status: 'CONFIRMED',
  };
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
