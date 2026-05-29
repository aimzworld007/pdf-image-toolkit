'use client';

import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  GlobalStyles,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import TicketForm from './TicketForm';
import TicketPreview from './TicketPreview';
import { DemoTicketData } from './ticketTypes';
import {
  calculateTotalFareWithSsr,
  generateAlphaNumericCode,
  generateBarcodeDataUrl,
  generateDemoReferenceNumber,
  generateDummyTicketNumber,
  getDefaultTicketData,
} from './demoTicketUtils';

export default function TicketPage() {
  const [formData, setFormData] = useState<DemoTicketData>(getDefaultTicketData);
  const [referenceNumber, setReferenceNumber] = useState<string>(generateDemoReferenceNumber);
  const [ticketNumber, setTicketNumber] = useState<string>(generateDummyTicketNumber);
  const [airlineRef, setAirlineRef] = useState<string>(() => generateAlphaNumericCode(5));
  const [crsRef, setCrsRef] = useState<string>(() => generateAlphaNumericCode(5));
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string>('');

  const previewRef = useRef<HTMLDivElement>(null);
  const barcodeDataUrl = useMemo(() => generateBarcodeDataUrl(ticketNumber), [ticketNumber]);

  const canAutoCalculate = useMemo(
    () => Boolean(formData.baseFare.trim() || formData.tax.trim() || formData.ssrAmount.trim()),
    [formData.baseFare, formData.tax, formData.ssrAmount]
  );

  const handleFieldChange = (field: keyof DemoTicketData, value: string) => {
    setFormData((current) => {
      const next = { ...current, [field]: value };
      if (field === 'baseFare' || field === 'tax' || field === 'ssrAmount') {
        next.totalFare = calculateTotalFareWithSsr(next.baseFare, next.tax, next.ssrAmount);
      }
      return next;
    });
  };

  const handleAutoCalculateTotal = () => {
    setFormData((current) => ({
      ...current,
      totalFare: calculateTotalFareWithSsr(current.baseFare, current.tax, current.ssrAmount),
    }));
  };

  const handleRegenerateIds = () => {
    setReferenceNumber(generateDemoReferenceNumber());
    setTicketNumber(generateDummyTicketNumber());
    setAirlineRef(generateAlphaNumericCode(5));
    setCrsRef(generateAlphaNumericCode(5));
  };

  const handleReset = () => {
    setFormData(getDefaultTicketData());
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
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }} className="no-print">
          <Stack spacing={1.4}>
            <TicketForm data={formData} onFieldChange={handleFieldChange} />

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
                  Auto Total
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
    </Container>
  );
}
