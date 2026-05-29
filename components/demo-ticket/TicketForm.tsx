'use client';

import { Box, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { DemoTicketData, TicketStatus } from './ticketTypes';

interface TicketFormProps {
  data: DemoTicketData;
  onFieldChange: (field: keyof DemoTicketData, value: string) => void;
}

const STATUS_OPTIONS: TicketStatus[] = ['CONFIRMED', 'PENDING', 'ON HOLD', 'CANCELLED'];

export default function TicketForm({ data, onFieldChange }: TicketFormProps) {
  return (
    <Paper elevation={0} sx={{ p: 2.2, borderRadius: 2, border: '1px solid #dbe3f2', bgcolor: '#ffffff' }}>
      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
          Ticket Input Form
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Fill details below. Preview updates live on the right.
        </Typography>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#334155' }}>
            Passenger and Booking
          </Typography>
          <Grid container spacing={1.4}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Passenger Name"
                value={data.passengerName}
                onChange={(event) => onFieldChange('passengerName', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Booking Date (Optional)"
                type="datetime-local"
                value={data.bookingDate}
                onChange={(event) => onFieldChange('bookingDate', event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Airline"
                value={data.airline}
                onChange={(event) => onFieldChange('airline', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Status"
                select
                value={data.status}
                onChange={(event) => onFieldChange('status', event.target.value)}
              >
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#334155' }}>
            Flight Route and Schedule
          </Typography>
          <Grid container spacing={1.4}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="From City / Airport"
                value={data.fromLocation}
                onChange={(event) => onFieldChange('fromLocation', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="From Terminal"
                value={data.fromTerminal}
                onChange={(event) => onFieldChange('fromTerminal', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="To City / Airport"
                value={data.toLocation}
                onChange={(event) => onFieldChange('toLocation', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="To Terminal"
                value={data.toTerminal}
                onChange={(event) => onFieldChange('toTerminal', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Departure Date & Time"
                type="datetime-local"
                value={data.departureDateTime}
                onChange={(event) => onFieldChange('departureDateTime', event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Arrival Date & Time"
                type="datetime-local"
                value={data.arrivalDateTime}
                onChange={(event) => onFieldChange('arrivalDateTime', event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Flight Number"
                value={data.flightNumber}
                onChange={(event) => onFieldChange('flightNumber', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Baggage"
                value={data.baggage}
                onChange={(event) => onFieldChange('baggage', event.target.value)}
              />
            </Grid>
          </Grid>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#334155' }}>
            Fare Details
          </Typography>
          <Grid container spacing={1.4}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Base Fare"
                value={data.baseFare}
                onChange={(event) => onFieldChange('baseFare', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Tax"
                value={data.tax}
                onChange={(event) => onFieldChange('tax', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Total Fare"
                value={data.totalFare}
                onChange={(event) => onFieldChange('totalFare', event.target.value)}
              />
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </Paper>
  );
}
