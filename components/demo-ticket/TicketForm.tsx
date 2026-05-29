'use client';

import {
  Autocomplete,
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DemoTicketData, TicketStatus } from './ticketTypes';
import {
  AIRLINE_OPTIONS,
  CHECKIN_BAGGAGE_OPTIONS,
  DESTINATION_OPTIONS,
  TRAVEL_CLASS_OPTIONS,
  UAE_ORIGIN_OPTIONS,
} from './demoTicketUtils';

interface TicketFormProps {
  data: DemoTicketData;
  onFieldChange: (field: keyof DemoTicketData, value: string) => void;
  onLogoUpload: (file: File | null) => void;
  onAirlineChange: (airlineName: string) => void;
  onTravelClassChange: (travelClass: string) => void;
}

const STATUS_OPTIONS: TicketStatus[] = ['CONFIRMED', 'PENDING', 'ON HOLD', 'CANCELLED'];
const AIRLINE_NAME_OPTIONS = AIRLINE_OPTIONS.map((item) => item.name);

export default function TicketForm({
  data,
  onFieldChange,
  onLogoUpload,
  onAirlineChange,
  onTravelClassChange,
}: TicketFormProps) {
  return (
    <Paper elevation={0} sx={{ p: 2.2, borderRadius: 2, border: '1px solid #dbe3f2', bgcolor: '#ffffff' }}>
      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
          Ticket Input Form
        </Typography>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#334155' }}>
            Agency Details (Customizable)
          </Typography>
          <Grid container spacing={1.4}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Agency Name"
                value={data.agencyName}
                onChange={(event) => onFieldChange('agencyName', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Agency Address"
                value={data.agencyAddress}
                onChange={(event) => onFieldChange('agencyAddress', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Agency Tel"
                value={data.agencyTel}
                onChange={(event) => onFieldChange('agencyTel', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Agency Email"
                value={data.agencyEmail}
                onChange={(event) => onFieldChange('agencyEmail', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Logo URL (Optional)"
                value={data.agencyLogoUrl}
                onChange={(event) => onFieldChange('agencyLogoUrl', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button variant="outlined" component="label" size="small">
                Upload Custom Logo
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    onLogoUpload(file);
                    event.currentTarget.value = '';
                  }}
                />
              </Button>
            </Grid>
          </Grid>
        </Box>

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
              <Autocomplete
                freeSolo
                options={AIRLINE_NAME_OPTIONS}
                value={data.airline}
                onChange={(_, value) => onAirlineChange(value || '')}
                onInputChange={(_, value, reason) => {
                  if (reason === 'input' || reason === 'clear') onAirlineChange(value);
                }}
                renderInput={(params) => <TextField {...params} size="small" label="Airline (Dropdown + Custom)" />}
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
              <Autocomplete
                freeSolo
                options={UAE_ORIGIN_OPTIONS}
                value={data.fromLocation}
                onChange={(_, value) => onFieldChange('fromLocation', value || '')}
                onInputChange={(_, value, reason) => {
                  if (reason === 'input' || reason === 'clear') onFieldChange('fromLocation', value);
                }}
                renderInput={(params) => <TextField {...params} size="small" label="From (UAE Origin)" />}
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
              <Autocomplete
                freeSolo
                options={DESTINATION_OPTIONS}
                value={data.toLocation}
                onChange={(_, value) => onFieldChange('toLocation', value || '')}
                onInputChange={(_, value, reason) => {
                  if (reason === 'input' || reason === 'clear') onFieldChange('toLocation', value);
                }}
                renderInput={(params) => <TextField {...params} size="small" label="To Destination" />}
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
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Flight Number (Auto)"
                value={data.flightNumber}
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Travel Class"
                select
                value={data.travelClass}
                onChange={(event) => onTravelClassChange(event.target.value)}
              >
                {TRAVEL_CLASS_OPTIONS.map((travelClass) => (
                  <MenuItem key={travelClass} value={travelClass}>
                    {travelClass}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Stops"
                value={data.stops}
                onChange={(event) => onFieldChange('stops', event.target.value)}
              />
            </Grid>
          </Grid>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#334155' }}>
            Baggage and Fare
          </Typography>
          <Grid container spacing={1.4}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Check-in Baggage"
                select
                value={data.checkInBaggage}
                onChange={(event) => onFieldChange('checkInBaggage', event.target.value)}
              >
                {CHECKIN_BAGGAGE_OPTIONS.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Cabin Baggage (Airline Policy)"
                value={data.cabinBaggage}
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Baggage Title (Manual)"
                value={data.baggage}
                onChange={(event) => onFieldChange('baggage', event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={3}
                label="Baggage Notes (Manual)"
                value={data.baggageNotes}
                onChange={(event) => onFieldChange('baggageNotes', event.target.value)}
              />
            </Grid>
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
              <TextField fullWidth size="small" label="Tax (Auto)" value={data.tax} slotProps={{ input: { readOnly: true } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Total Fare (Auto)"
                value={data.totalFare}
                slotProps={{ input: { readOnly: true } }}
              />
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </Paper>
  );
}
