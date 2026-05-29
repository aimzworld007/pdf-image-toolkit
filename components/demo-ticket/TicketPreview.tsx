'use client';

import { Box, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { RefObject } from 'react';
import { DemoTicketData } from './ticketTypes';
import { calculateDuration, formatDateOnly, formatDateTime, formatMoney, formatTimeOnly } from './demoTicketUtils';

interface TicketPreviewProps {
  data: DemoTicketData;
  referenceNumber: string;
  ticketNumber: string;
  airlineRef: string;
  crsRef: string;
  barcodeDataUrl: string;
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
  airlineRef,
  crsRef,
  barcodeDataUrl,
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
        borderRadius: 0,
        border: '1px solid #b9c2d0',
        bgcolor: '#ffffff',
        color: '#111827',
        p: { xs: 1, sm: 1.2 },
      }}
    >
      <Box sx={{ border: '1px solid #cfd8e3' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '180px 1fr' }, gap: 1, p: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #dbe3f2' }}>
            <Box
              component="img"
              src={data.agencyLogoUrl || '/default-agency-logo.png'}
              alt="Agency Logo"
              sx={{ width: '100%', maxWidth: 150, maxHeight: 60, objectFit: 'contain', p: 0.5 }}
            />
          </Box>
          <Box sx={{ fontSize: 11, lineHeight: 1.45 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '80px 1fr', borderBottom: '1px solid #e2e8f0', py: 0.3 }}>
              <Typography sx={{ fontSize: 11, color: '#475569' }}>Name</Typography>
              <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{data.agencyName || '-'}</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '80px 1fr', borderBottom: '1px solid #e2e8f0', py: 0.3 }}>
              <Typography sx={{ fontSize: 11, color: '#475569' }}>Address</Typography>
              <Typography sx={{ fontSize: 11 }}>{data.agencyAddress || '-'}</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '80px 1fr', borderBottom: '1px solid #e2e8f0', py: 0.3 }}>
              <Typography sx={{ fontSize: 11, color: '#475569' }}>Tel</Typography>
              <Typography sx={{ fontSize: 11 }}>{data.agencyTel || '-'}</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '80px 1fr', py: 0.3 }}>
              <Typography sx={{ fontSize: 11, color: '#475569' }}>Email</Typography>
              <Typography sx={{ fontSize: 11 }}>{data.agencyEmail || '-'}</Typography>
            </Box>
          </Box>
        </Box>

        <Table size="small" sx={{ borderTop: '1px solid #dbe3f2', '& .MuiTableCell-root': { fontSize: 11, py: 0.8 } }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ width: '28%', borderRight: '1px solid #dbe3f2' }}>
                <Typography sx={{ fontSize: 10, color: '#475569' }}>Ref. No:</Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{referenceNumber}</Typography>
              </TableCell>
              <TableCell sx={{ width: '28%', borderRight: '1px solid #dbe3f2' }}>
                <Typography sx={{ fontSize: 10, color: '#475569' }}>Date of Booking:</Typography>
                <Typography sx={{ fontWeight: 700 }}>{formatDateOnly(data.bookingDate)}</Typography>
              </TableCell>
              <TableCell sx={{ width: '24%', borderRight: '1px solid #dbe3f2' }}>
                <Typography sx={{ fontSize: 10, color: '#475569' }}>Status:</Typography>
                <Chip
                  label={data.status || 'PENDING'}
                  size="small"
                  color={getStatusColor(data.status)}
                  sx={{ fontWeight: 800, mt: 0.4 }}
                />
              </TableCell>
              <TableCell sx={{ width: '20%', textAlign: 'right' }}>
                <Box
                  sx={{
                    display: 'inline-block',
                    px: 1.1,
                    py: 0.5,
                    bgcolor: '#8b0000',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                >
                  Web check-in
                </Box>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Box sx={{ p: 0.8, borderTop: '1px solid #dbe3f2', bgcolor: '#f8fafc' }}>
          <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
            ONWARD &nbsp; {data.fromLocation || '-'} &nbsp; {'>'} &nbsp; {data.toLocation || '-'}
          </Typography>
          <Typography sx={{ fontSize: 11 }}>
            {formatDateOnly(data.departureDateTime)} | {data.stops || '-'} | {calculateDuration(data.departureDateTime, data.arrivalDateTime)}
          </Typography>
        </Box>

        <Table
          size="small"
          sx={{
            '& .MuiTableCell-root': { fontSize: 10.5, py: 0.55, borderColor: '#dbe3f2' },
            borderTop: '1px solid #dbe3f2',
          }}
        >
          <TableHead>
            <TableRow sx={{ bgcolor: '#f0f4f8' }}>
              <TableCell sx={{ fontWeight: 700 }}>Airline Ref: {airlineRef}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Travel Class: {data.travelClass || '-'}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Check-In Baggage: {data.checkInBaggage || '-'}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Cabin Baggage: {data.cabinBaggage || '-'}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>CRS Ref: {crsRef}</TableCell>
            </TableRow>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 700 }}>Flight Number</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>From (Terminal)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Departure date & time</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>To (Terminal)</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Arrival date & time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <Typography sx={{ fontWeight: 700, fontSize: 11 }}>{data.flightNumber || '-'}</Typography>
                <Typography sx={{ fontSize: 10 }}>Operated by {data.airline || '-'}</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700, fontSize: 11 }}>{data.fromLocation || '-'}</Typography>
                <Typography sx={{ fontSize: 10 }}>{data.fromTerminal || '-'}</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{formatTimeOnly(data.departureDateTime)}</Typography>
                <Typography sx={{ fontWeight: 700 }}>{formatDateOnly(data.departureDateTime)}</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700, fontSize: 11 }}>{data.toLocation || '-'}</Typography>
                <Typography sx={{ fontSize: 10 }}>{data.toTerminal || '-'}</Typography>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{formatTimeOnly(data.arrivalDateTime)}</Typography>
                <Typography sx={{ fontWeight: 700 }}>{formatDateOnly(data.arrivalDateTime)}</Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Box sx={{ p: 1, mt: 0.6 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 0.7 }}>Traveler(s) Information</Typography>
          <Table size="small" sx={{ border: '1px solid #dbe3f2', '& .MuiTableCell-root': { fontSize: 10.5, py: 0.6 } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Ticket No.</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ width: '22%' }}>
                  {barcodeDataUrl ? (
                    <Box component="img" src={barcodeDataUrl} alt="Ticket Barcode" sx={{ width: '100%', maxWidth: 150, height: 36, objectFit: 'cover' }} />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{data.passengerName || '-'}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{ticketNumber}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Box sx={{ border: '1px solid #dbe3f2', borderTop: 0, p: 1 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 11, mb: 0.5 }}>Baggage</Typography>
            <Typography sx={{ fontSize: 10.5, fontWeight: 700 }}>{data.baggage || '-'}</Typography>
            <Typography sx={{ fontSize: 10.3, whiteSpace: 'pre-line', mt: 0.5 }}>
              {data.baggageNotes || '-'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: 1, pb: 1 }}>
          <Table size="small" sx={{ border: '1px solid #dbe3f2', '& .MuiTableCell-root': { fontSize: 10.5, py: 0.65 } }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700 }}>Base Fare</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Taxes and Charges</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>SSR Amount</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>{formatMoney(data.baseFare)}</TableCell>
                <TableCell>{formatMoney(data.tax)}</TableCell>
                <TableCell>{formatMoney(data.ssrAmount)}</TableCell>
                <TableCell sx={{ textAlign: 'right' }}>{formatMoney(data.totalFare)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Typography sx={{ fontWeight: 800, textAlign: 'right', mt: 0.8, fontSize: 29 }}>
            Total Net Fare : {formatMoney(data.totalFare)}
          </Typography>
        </Box>

        <Box sx={{ px: 1, pb: 1 }}>
          <Box sx={{ bgcolor: '#fff8e6', border: '1px solid #ecd9ab', p: 0.8, fontSize: 10.3, mb: 0.7 }}>
            <Typography sx={{ fontSize: 10.3, fontWeight: 700 }}>
              Important Note :
            </Typography>
            <Typography sx={{ fontSize: 10.3 }}>
              Transit Visa is a mandatory requirement if there are via TWO Schengen countries or TWO stop in same countries.
            </Typography>
          </Box>
          <Box sx={{ bgcolor: '#fff8e6', border: '1px solid #ecd9ab', p: 0.8, fontSize: 10.3 }}>
            <Typography sx={{ fontSize: 10.3 }}>
              Important Note : Refund/date change penalties upto 100% may apply. Refund/date change penalties upto
              100% may apply. Refund/date change penalties upto 100% may apply.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: 1, pb: 1 }}>
          <Typography sx={{ fontSize: 10, color: '#64748b' }}>
            Generated on: {formatDateTime(new Date().toISOString())}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
