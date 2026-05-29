export type TicketStatus = 'CONFIRMED' | 'PENDING' | 'ON HOLD' | 'CANCELLED';

export interface DemoTicketData {
  passengerName: string;
  bookingDate: string;
  fromLocation: string;
  fromTerminal: string;
  toLocation: string;
  toTerminal: string;
  departureDateTime: string;
  arrivalDateTime: string;
  airline: string;
  flightNumber: string;
  baggage: string;
  baseFare: string;
  tax: string;
  totalFare: string;
  status: TicketStatus;
}
