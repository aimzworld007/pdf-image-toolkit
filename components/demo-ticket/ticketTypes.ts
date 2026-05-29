export type TicketStatus = 'CONFIRMED' | 'PENDING' | 'ON HOLD' | 'CANCELLED';

export interface DemoTicketData {
  agencyName: string;
  agencyAddress: string;
  agencyTel: string;
  agencyEmail: string;
  agencyLogoUrl: string;
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
  travelClass: string;
  stops: string;
  checkInBaggage: string;
  cabinBaggage: string;
  baggage: string;
  baggageNotes: string;
  baseFare: string;
  tax: string;
  ssrAmount: string;
  totalFare: string;
  status: TicketStatus;
}
