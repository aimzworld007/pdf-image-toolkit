import { DemoTicketData } from './ticketTypes';
import JsBarcode from 'jsbarcode';

const FLIGHT_HOURS_AHEAD = 6;
const ARRIVAL_HOURS_AFTER_DEPARTURE = 5;

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

export function getDefaultTicketData(): DemoTicketData {
  const now = new Date();
  const departure = new Date(now.getTime() + FLIGHT_HOURS_AHEAD * 60 * 60 * 1000);
  const arrival = new Date(departure.getTime() + ARRIVAL_HOURS_AFTER_DEPARTURE * 60 * 60 * 1000);

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
    airline: 'FLYDUBAI',
    flightNumber: 'FZ 501',
    travelClass: 'Economy',
    stops: 'Non Stop',
    checkInBaggage: 'Adult - 40 Kg',
    cabinBaggage: 'Adult - 7 Kg',
    baggage: 'Baggage Allowance: Adult - 40 Kg',
    baggageNotes:
      'Bag 1 Chg May Apply If Bags Exceed TI Wt Allowance\nBag 2 Chgs May Apply If Bags Exceed TI Wt Allowance\nRefer to airline baggage policy for further details.',
    baseFare: '600.00',
    tax: '149.00',
    ssrAmount: '0.00',
    totalFare: '749.00',
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

export function calculateTotalFareWithSsr(baseFare: string, tax: string, ssrAmount: string): string {
  return (parseAmount(baseFare) + parseAmount(tax) + parseAmount(ssrAmount)).toFixed(2);
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
