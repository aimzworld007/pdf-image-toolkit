import { DemoTicketData } from './ticketTypes';

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
    baggage: 'Adult - 40 Kg',
    baseFare: '600.00',
    tax: '149.00',
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
