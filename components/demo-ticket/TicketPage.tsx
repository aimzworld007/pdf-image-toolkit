'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  Container,
  GlobalStyles,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import TicketForm from './TicketForm';
import TicketPreview from './TicketPreview';
import { DemoTicketData } from './ticketTypes';
import {
  AGENCY_PRESETS,
  DEFAULT_AGENCY_LOGO,
  GENERATED_AGENCY_LOGO,
  DESTINATION_OPTIONS,
  applyAgencyProfileToTicket,
  calculateTaxFromBaseFare,
  calculateTotalFareFromBaseFare,
  formatDateToDateTimeLocalInput,
  generateAutoBaggageContent,
  getOriginAndTerminalByAirline,
  getCabinBaggageByAirlineAndClass,
  getRandomAirlineByDestination,
  getRandomAgencyProfile,
  getRandomCheckInBaggage,
  generateRandomDepartureDateTimeByDate,
  generateAlphaNumericCode,
  generateBarcodeDataUrl,
  generateDemoReferenceNumber,
  estimateArrivalDateTime,
  getRandomBaseFareByDestination,
  generateFlightNumberFromAirline,
  generateDummyTicketNumber,
  getDefaultTicketData,
} from './demoTicketUtils';

const TOOL_MENU_LINKS = [
  { href: '/image-tools', label: 'Image Tools' },
  { href: '/pdf-tools', label: 'PDF Tools' },
  { href: '/lamination-tools', label: 'Lamination Tools' },
  { href: '/photo-print-tools', label: 'Photo Print Tools' },
  { href: '/demo-ticket-generator', label: 'Demo Ticket Generator' },
];

const EXTERNAL_TOOLS = [
  {
    icon: '💰',
    title: 'REMIT BD',
    url: 'https://remitbd.vercel.app/',
    desc: 'Fast remittance workflow and transaction support tools.',
  },
  {
    icon: '🍽️',
    title: 'Mess Meal Manager system',
    url: 'https://smm24.vercel.app/',
    desc: 'Meal planning, cost tracking, and member-wise management.',
  },
  {
    icon: '⚙️',
    title: 'WORK TRACKING MANAGMENT SYSTEM',
    url: 'https://worktms.vercel.app',
    desc: 'Task assignment, activity logs, and progress monitoring.',
  },
  {
    title: 'UAE VAT & TAX SUITE SYSTEM',
    icon: '🔗',
    url: 'https://www.uaevat.live',
    desc: 'VAT calculators, tax helpers, and compliance utilities.',
  },
  {
    icon: '🔗',
    title: 'PERSONAL FINANCE MANAGER',
    url: 'https://finpulse24.vercel.app/',
    desc: 'Budgeting, expense insights, and savings overview.',
  },
  {
    icon: '🔗',
    title: 'TYPING & TRVALE MANAGMENT ERP SYSTEM',
    url: 'https://ecashbiz.com/landing',
    desc: 'ERP toolkit for typing centers and travel operations.',
  },
];

const MARQUEE_TOOLS = [...EXTERNAL_TOOLS, ...EXTERNAL_TOOLS];

export default function TicketPage() {
  const [formData, setFormData] = useState<DemoTicketData>(getDefaultTicketData);
  const [referenceNumber, setReferenceNumber] = useState<string>(generateDemoReferenceNumber);
  const [ticketNumber, setTicketNumber] = useState<string>(generateDummyTicketNumber);
  const [airlineRef, setAirlineRef] = useState<string>(() => generateAlphaNumericCode(5));
  const [crsRef, setCrsRef] = useState<string>(() => generateAlphaNumericCode(5));
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string>('');
  const [isBaggageManualEdit, setIsBaggageManualEdit] = useState(false);
  const [formMode, setFormMode] = useState<'default-editable' | 'magic-locked'>('default-editable');
  const [agencyMode, setAgencyMode] = useState<'default' | 'random'>('default');
  const [magicPassengerName, setMagicPassengerName] = useState('Ainul islam');
  const [magicDestination, setMagicDestination] = useState('Dhaka [DAC] - Bangladesh');
  const [magicDate, setMagicDate] = useState(() => new Date().toISOString().slice(0, 10));

  const previewRef = useRef<HTMLDivElement>(null);
  const barcodeDataUrl = useMemo(() => generateBarcodeDataUrl(ticketNumber), [ticketNumber]);

  const canAutoCalculate = useMemo(() => Boolean(formData.baseFare.trim()), [formData.baseFare]);

  const handleFieldChange = (field: keyof DemoTicketData, value: string) => {
    setFormData((current) => {
      const next = { ...current, [field]: value };
      if (field === 'baseFare') {
        next.tax = calculateTaxFromBaseFare(next.baseFare);
        next.totalFare = calculateTotalFareFromBaseFare(next.baseFare);
      }
      if (field === 'departureDateTime' || field === 'toLocation') {
        next.arrivalDateTime = estimateArrivalDateTime(next.departureDateTime, next.toLocation);
      }
      if (field === 'toLocation') {
        const nextBaseFare = getRandomBaseFareByDestination(next.toLocation);
        next.baseFare = nextBaseFare;
        next.tax = calculateTaxFromBaseFare(nextBaseFare);
        next.totalFare = calculateTotalFareFromBaseFare(nextBaseFare);
      }
      if (!isBaggageManualEdit && (field === 'checkInBaggage' || field === 'airline' || field === 'cabinBaggage')) {
        const auto = generateAutoBaggageContent(next.airline, next.checkInBaggage, next.cabinBaggage);
        next.baggage = auto.title;
        next.baggageNotes = auto.notes;
      }
      return next;
    });
  };

  const handleAirlineChange = (airlineName: string) => {
    setFormData((current) => {
      const nextAirline = airlineName || '';
      const nextClass = current.travelClass || 'Economy';
      const nextCabin = getCabinBaggageByAirlineAndClass(nextAirline, nextClass);
      const originRule = getOriginAndTerminalByAirline(nextAirline);
      const auto = generateAutoBaggageContent(nextAirline, current.checkInBaggage, nextCabin);
      return {
        ...current,
        airline: nextAirline,
        flightNumber: generateFlightNumberFromAirline(nextAirline),
        fromLocation: originRule.fromLocation,
        fromTerminal: originRule.fromTerminal,
        cabinBaggage: nextCabin,
        baggage: isBaggageManualEdit ? current.baggage : auto.title,
        baggageNotes: isBaggageManualEdit ? current.baggageNotes : auto.notes,
      };
    });
  };

  const handleTravelClassChange = (travelClass: string) => {
    setFormData((current) => {
      const nextCabin = getCabinBaggageByAirlineAndClass(current.airline, travelClass);
      const auto = generateAutoBaggageContent(current.airline, current.checkInBaggage, nextCabin);
      return {
        ...current,
        travelClass,
        cabinBaggage: nextCabin,
        baggage: isBaggageManualEdit ? current.baggage : auto.title,
        baggageNotes: isBaggageManualEdit ? current.baggageNotes : auto.notes,
      };
    });
  };

  const handleToggleBaggageManualEdit = (enabled: boolean) => {
    setIsBaggageManualEdit(enabled);
    if (enabled) return;

    setFormData((current) => {
      const auto = generateAutoBaggageContent(current.airline, current.checkInBaggage, current.cabinBaggage);
      return { ...current, baggage: auto.title, baggageNotes: auto.notes };
    });
  };

  const handlePresetAgencySelect = (agencyName: string) => {
    const profile = AGENCY_PRESETS.find((agency) => agency.name === agencyName);
    if (!profile) return;
    setFormData((current) => applyAgencyProfileToTicket(current, profile, current.agencyLogoUrl || DEFAULT_AGENCY_LOGO));
  };

  const handleApplyDefaultAgency = () => {
    const defaultAgency = AGENCY_PRESETS[0];
    setAgencyMode('default');
    setFormData((current) => applyAgencyProfileToTicket(current, defaultAgency, DEFAULT_AGENCY_LOGO));
  };

  const handleGenerateRandomAgency = () => {
    const randomAgency = getRandomAgencyProfile();
    setAgencyMode('random');
    setFormData((current) => applyAgencyProfileToTicket(current, randomAgency, GENERATED_AGENCY_LOGO));
  };

  const handleAutoCalculateTotal = () => {
    setFormData((current) => ({
      ...current,
      tax: calculateTaxFromBaseFare(current.baseFare),
      totalFare: calculateTotalFareFromBaseFare(current.baseFare),
    }));
  };

  const handleLogoUpload = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;
      setFormData((current) => ({ ...current, agencyLogoUrl: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRegenerateIds = () => {
    setReferenceNumber(generateDemoReferenceNumber());
    setTicketNumber(generateDummyTicketNumber());
    setAirlineRef(generateAlphaNumericCode(5));
    setCrsRef(generateAlphaNumericCode(5));
  };

  const handleGenerateMagicTicket = () => {
    const passengerName = magicPassengerName.trim() || 'Ainul islam';
    const toLocation = magicDestination || 'Dhaka [DAC] - Bangladesh';
    const departureDateTime = generateRandomDepartureDateTimeByDate(magicDate);
    const arrivalDateTime = estimateArrivalDateTime(departureDateTime, toLocation);
    const airline = getRandomAirlineByDestination(toLocation);
    const travelClass = 'Economy';
    const flightNumber = generateFlightNumberFromAirline(airline);
    const checkInBaggage = getRandomCheckInBaggage();
    const cabinBaggage = getCabinBaggageByAirlineAndClass(airline, travelClass);
    const originRule = getOriginAndTerminalByAirline(airline);
    const baggageAuto = generateAutoBaggageContent(airline, checkInBaggage, cabinBaggage);
    const baseFare = getRandomBaseFareByDestination(toLocation);
    const tax = calculateTaxFromBaseFare(baseFare);
    const totalFare = calculateTotalFareFromBaseFare(baseFare);
    const randomAgency = getRandomAgencyProfile();
    const bookingDate = formatDateToDateTimeLocalInput(new Date());

    setFormData((current) => ({
      ...current,
      agencyName: randomAgency.name,
      agencyAddress: randomAgency.address,
      agencyEmail: randomAgency.email,
      agencyTel: randomAgency.tel,
      agencyLogoUrl: GENERATED_AGENCY_LOGO,
      passengerName,
      bookingDate,
      fromLocation: originRule.fromLocation,
      fromTerminal: originRule.fromTerminal,
      toLocation,
      toTerminal: 'Terminal 1',
      departureDateTime,
      arrivalDateTime,
      airline,
      flightNumber,
      travelClass,
      stops: 'Non Stop',
      checkInBaggage,
      cabinBaggage,
      baggage: baggageAuto.title,
      baggageNotes: baggageAuto.notes,
      baseFare,
      tax,
      totalFare,
      status: 'CONFIRMED',
    }));

    handleRegenerateIds();
    setIsBaggageManualEdit(false);
    setAgencyMode('random');
    setFormMode('magic-locked');
  };

  const handleReset = () => {
    setFormData(getDefaultTicketData());
    setIsBaggageManualEdit(false);
    setAgencyMode('default');
    handleRegenerateIds();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const target = previewRef.current;
    if (!target) return;

    setPdfError('');
    setIsDownloading(true);
    try {
      const [html2canvasModule, jsPdfModule] = await Promise.all([import('html2canvas'), import('jspdf')]);

      const canvas = await html2canvasModule.default(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPdfModule.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 6;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      const widthRatio = usableWidth / canvas.width;
      const heightRatio = usableHeight / canvas.height;
      const ratio = Math.min(widthRatio, heightRatio);

      const imageWidth = canvas.width * ratio;
      const imageHeight = canvas.height * ratio;
      const x = (pageWidth - imageWidth) / 2;
      const y = margin;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, imageWidth, imageHeight, undefined, 'FAST');
      pdf.save(`${referenceNumber}-demo-ticket.pdf`);
    } catch (error) {
      setPdfError('PDF download failed. You can still use Print and choose Save as PDF from your browser.');
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2.2, md: 3.2 } }}>
      <GlobalStyles
        styles={{
          '@page': { size: 'A4', margin: '8mm' },
          '@media print': {
            body: { background: '#ffffff !important' },
            '.no-print': { display: 'none !important' },
            '.ticket-print-root': {
              boxShadow: 'none !important',
              border: '1px solid #94a3b8 !important',
            },
            '.ticket-status-text': {
              color: '#0f8a2f !important',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            },
          },
        }}
      />

      <Paper
        className="no-print"
        elevation={0}
        sx={{
          mb: 2,
          p: { xs: 2, md: 2.4 },
          borderRadius: 3,
          border: '1px solid #dbe3f2',
          color: '#ffffff',
          background: 'linear-gradient(135deg, #0f172a, #0f766e)',
        }}
      >
        <Typography variant="h4" sx={{ fontSize: { xs: '1.6rem', md: '2rem' }, fontWeight: 800 }}>
          Demo Ticket Generator
        </Typography>
        <Typography sx={{ mt: 0.8, opacity: 0.9 }}>
          Standalone React + TypeScript + Material UI page with live preview and print/PDF output.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.3, flexWrap: 'wrap' }} useFlexGap>
          <Link href="/" className="btn ghost" style={{ textDecoration: 'none' }}>
            Back To Home
          </Link>
          {TOOL_MENU_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="btn ghost" style={{ textDecoration: 'none' }}>
              {item.label}
            </Link>
          ))}
        </Stack>
      </Paper>

      <Paper
        className="no-print"
        elevation={0}
        sx={{ mb: 2, p: 1.6, borderRadius: 2, border: '1px solid #dbe3f2', bgcolor: '#ffffff' }}
      >
        <Stack spacing={1.2}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Magic Ticket Generator
          </Typography>
          <Typography sx={{ fontSize: 13, color: '#64748b' }}>
            Enter only passenger name, destination, and date. Generate and lock a pro random ticket instantly.
          </Typography>
          <Grid container spacing={1.2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Passenger Name"
                value={magicPassengerName}
                onChange={(event) => setMagicPassengerName(event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Destination"
                select
                value={magicDestination}
                onChange={(event) => setMagicDestination(event.target.value)}
              >
                {DESTINATION_OPTIONS.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Travel Date"
                type="date"
                value={magicDate}
                onChange={(event) => setMagicDate(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
          </Grid>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Button variant="contained" onClick={handleGenerateMagicTicket}>
              Generate Random (Lock Edit)
            </Button>
            <Button variant="outlined" onClick={() => setFormMode('default-editable')}>
              Default (Editable Mode)
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }} className="no-print">
          <Stack spacing={1.4}>
            <TicketForm
              data={formData}
              onFieldChange={handleFieldChange}
              onLogoUpload={handleLogoUpload}
              onAirlineChange={handleAirlineChange}
              onTravelClassChange={handleTravelClassChange}
              onPresetAgencySelect={handlePresetAgencySelect}
              onApplyDefaultAgency={handleApplyDefaultAgency}
              onGenerateRandomAgency={handleGenerateRandomAgency}
              agencyMode={agencyMode}
              onAgencyModeChange={setAgencyMode}
              isBaggageManualEdit={isBaggageManualEdit}
              onToggleBaggageManualEdit={handleToggleBaggageManualEdit}
              isReadOnly={formMode === 'magic-locked'}
            />

            <Paper elevation={0} sx={{ p: 1.6, borderRadius: 2, border: '1px solid #dbe3f2', bgcolor: '#ffffff' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Button variant="contained" onClick={handlePrint}>
                  Print Ticket
                </Button>
                <Button variant="contained" color="secondary" onClick={handleDownloadPdf} disabled={isDownloading}>
                  {isDownloading ? 'Generating PDF...' : 'Download PDF'}
                </Button>
                <Button variant="outlined" onClick={handleRegenerateIds}>
                  Regenerate Numbers
                </Button>
                <Button variant="outlined" onClick={handleAutoCalculateTotal} disabled={!canAutoCalculate}>
                  Recalculate Fare
                </Button>
                <Button variant="text" color="inherit" onClick={handleReset}>
                  Reset
                </Button>
              </Stack>
              {pdfError ? (
                <Alert severity="warning" sx={{ mt: 1.2 }}>
                  {pdfError}
                </Alert>
              ) : null}
            </Paper>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <TicketPreview
            data={formData}
            referenceNumber={referenceNumber}
            ticketNumber={ticketNumber}
            airlineRef={airlineRef}
            crsRef={crsRef}
            barcodeDataUrl={barcodeDataUrl}
            previewRef={previewRef}
          />
        </Grid>
      </Grid>

      <section className="home-section no-print" style={{ marginTop: 22 }}>
        <h2 className="section-title">Other Tools</h2>
        <div className="home-marquee-wrap">
          <div className="home-marquee-track">
            {MARQUEE_TOOLS.map((tool, index) => (
              <article
                key={`${tool.url}-${index}`}
                className="home-marquee-card"
                aria-hidden={index >= EXTERNAL_TOOLS.length}
              >
                <a href={tool.url} target="_blank" rel="noopener noreferrer" className="home-external-link-title">
                  <span className="home-tool-icon">{tool.icon}</span>
                  <span>{tool.title}</span>
                  <span className="home-open-pill">Open</span>
                </a>
                <p>{tool.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="home-footer no-print">
        <p>
          Developed By{' '}
          <a href="https://ainulislam.info" target="_blank" rel="noopener noreferrer">
            Ainul islam
          </a>{' '}
          Powered By{' '}
          <a href="https://aimzit.xyz" target="_blank" rel="noopener noreferrer">
            Aimz it
          </a>
        </p>
      </footer>
    </Container>
  );
}
