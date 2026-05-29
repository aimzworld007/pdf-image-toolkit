'use client';

import {
  Box,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { RefObject } from 'react';
import { DemoTicketData } from './ticketTypes';
import { calculateDuration, formatDateTime, formatMoney } from './demoTicketUtils';

interface TicketPreviewProps {
  data: DemoTicketData;
  referenceNumber: string;
  ticketNumber: string;
  previewRef: RefObject<HTMLDivElement | null>;
}

function getStatusColor(status: string): 'success' | 'warning' | 'error' {
  if (status === 'CONFIRMED') return 'success';
  if (status === 'ON HOLD' || status === 'PENDING') return 'warning';
  return 'error';
}

export default function TicketPreview({
  data,
  referenceNumber,
  ticketNumber,
  previewRef,
}: TicketPreviewProps) {
  return (
    <Paper
      ref={previewRef}
      elevation={0}
      className="ticket-print-root"
      sx={{
        width: '100%',
        maxWidth: '210mm',
        mx: 'auto',
        borderRadius: 1,
        border: '1px solid #aeb9c8',
        bgcolor: '#ffffff',
        color: '#111827',
        p: { xs: 1.2, sm: 1.6 },
      }}
    >
      <Box
        sx={{
          border: '1px solid #cfd8e3',
          p: 1.1,
          bgcolor: '#f8fafc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ lineHeight: 1, fontWeight: 800, letterSpacing: 1.1 }}>
            DEMO TICKET
          </Typography>
          <Typography variant="caption" sx={{ color: '#475569' }}>
            Professional Itinerary Preview
          </Typography>
        </Box>
        <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
          <Typography sx={{ fontSize: 12, color: '#64748b' }}>Status</Typography>
          <Chip
            label={data.status || 'PENDING'}
            size="small"
            color={getStatusColor(data.status)}
            sx={{ fontWeight: 700, mt: 0.3 }}
          />
        </Box>
      </Box>

      <Table size="small" sx={{ mt: 1, border: '1px solid #dbe3f2' }}>
        <TableBody>
          <TableRow>
            <TableCell sx={{ width: '28%', fontWeight: 700 }}>Ref. No.</TableCell>
            <TableCell>{referenceNumber}</TableCell>
            <TableCell sx={{ width: '28%', fontWeight: 700 }}>Date of Booking</TableCell>
            <TableCell>{formatDateTime(data.bookingDate)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Airline Ref.</TableCell>
            <TableCell>{referenceNumber}</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Ticket No.</TableCell>
            <TableCell>{ticketNumber}</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Box sx={{ mt: 1.2, border: '1px solid #dbe3f2' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
            gap: 1,
            bgcolor: '#eef2f7',
            borderBottom: '1px solid #dbe3f2',
            px: 1.1,
            py: 0.8,
          }}
        >
          <Typography sx={{ fontWeight: 800 }}>
            ONWARD: {data.fromLocation || '-'} to {data.toLocation || '-'}
          </Typography>
          <Typography sx={{ fontWeight: 700, color: '#0f766e' }}>
            Duration: {calculateDuration(data.departureDateTime, data.arrivalDateTime)}
          </Typography>
        </Box>

        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 700 }}>Flight</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>From (Terminal)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Departure</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>To (Terminal)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Arrival</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>{data.flightNumber || '-'}</Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  Operated by {data.airline || '-'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>{data.fromLocation || '-'}</Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  {data.fromTerminal || '-'}
                </Typography>
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{formatDateTime(data.departureDateTime)}</TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>{data.toLocation || '-'}</Typography>
                <Typography variant="caption" sx={{ display: 'block' }}>
                  {data.toTerminal || '-'}
                </Typography>
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{formatDateTime(data.arrivalDateTime)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>

      <Box sx={{ mt: 1.2, border: '1px solid #dbe3f2' }}>
        <Typography
          sx={{
            px: 1.1,
            py: 0.8,
            borderBottom: '1px solid #dbe3f2',
            bgcolor: '#f8fafc',
            fontWeight: 700,
          }}
        >
          Passenger Information
        </Typography>
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell sx={{ width: '34%', fontWeight: 700 }}>Passenger Name</TableCell>
              <TableCell>{data.passengerName || '-'}</TableCell>
              <TableCell sx={{ width: '20%', fontWeight: 700 }}>Baggage</TableCell>
              <TableCell>{data.baggage || '-'}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>

      <Box sx={{ mt: 1.2, border: '1px solid #dbe3f2' }}>
        <Typography
          sx={{
            px: 1.1,
            py: 0.8,
            borderBottom: '1px solid #dbe3f2',
            bgcolor: '#f8fafc',
            fontWeight: 700,
          }}
        >
          Fare Section
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 700 }}>Base Fare</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tax</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Total Fare</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{formatMoney(data.baseFare)}</TableCell>
              <TableCell>{formatMoney(data.tax)}</TableCell>
              <TableCell sx={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                {formatMoney(data.totalFare)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>

      <Box sx={{ mt: 1.2, border: '1px solid #ecd9ab', bgcolor: '#fff8e6', p: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 12, mb: 0.5 }}>Important Notes</Typography>
        <Typography sx={{ fontSize: 11, lineHeight: 1.5 }}>
          This is a demo ticket for UI/print preview only. Visa and transit rules may apply based on route and
          passport type. Refund and date-change policies are airline-dependent and may include penalties.
        </Typography>
      </Box>

      <Divider sx={{ my: 1.2 }} />
      <Typography sx={{ fontSize: 11, color: '#64748b' }}>
        Generated by Demo Ticket Generator | Print-Ready A4 Layout
      </Typography>
    </Paper>
  );
}
