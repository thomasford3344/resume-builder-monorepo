import type { ResumeData } from './index';

const MONTH_ABBREVIATIONS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const MONTH_NAME_TO_ABBREV: Record<string, string> = {
  jan: 'Jan',
  january: 'Jan',
  feb: 'Feb',
  february: 'Feb',
  mar: 'Mar',
  march: 'Mar',
  apr: 'Apr',
  april: 'Apr',
  may: 'May',
  jun: 'Jun',
  june: 'Jun',
  jul: 'Jul',
  july: 'Jul',
  aug: 'Aug',
  august: 'Aug',
  sep: 'Sep',
  sept: 'Sep',
  september: 'Sep',
  oct: 'Oct',
  october: 'Oct',
  nov: 'Nov',
  november: 'Nov',
  dec: 'Dec',
  december: 'Dec',
};

function formatCertificationDatePart(part: string): string {
  const text = part.trim();
  if (!text) {
    return '';
  }

  if (/^(present|current|now)$/i.test(text)) {
    return 'Present';
  }

  const slashMonthYearMatch = text.match(/^(\d{1,2})\/(\d{4})$/);
  if (slashMonthYearMatch) {
    const month = Number.parseInt(slashMonthYearMatch[1], 10);
    const year = slashMonthYearMatch[2];
    const monthName = MONTH_ABBREVIATIONS[month - 1];
    if (monthName) {
      return `${monthName} ${year}`;
    }
  }

  const slashFullDateMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashFullDateMatch) {
    const month = Number.parseInt(slashFullDateMatch[1], 10);
    const year = slashFullDateMatch[3];
    const monthName = MONTH_ABBREVIATIONS[month - 1];
    if (monthName) {
      return `${monthName} ${year}`;
    }
  }

  const monthYearMatch = text.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const monthKey = monthYearMatch[1].toLowerCase();
    const year = monthYearMatch[2];
    const monthName = MONTH_NAME_TO_ABBREV[monthKey];
    if (monthName) {
      return `${monthName} ${year}`;
    }
  }

  return text;
}

function formatCertificationDate(dateRange: string): string {
  const trimmed = dateRange.trim();
  if (!trimmed) {
    return '';
  }

  const rangeMatch = trimmed.match(/^(.+?)\s*(?:-|–|—|\sto\s)\s*(.+)$/i);
  if (rangeMatch) {
    return formatCertificationDatePart(rangeMatch[2]);
  }

  return formatCertificationDatePart(trimmed);
}

export function getCertificationText(
  cert: NonNullable<ResumeData['certifications']>[number],
): string {
  if (typeof cert === 'string') {
    return cert.trim();
  }

  const name = String(
    cert.name || cert.title || cert.certification || '',
  ).trim();
  const issuer = String(
    cert.issuer || cert.organization || cert.authority || '',
  ).trim();
  const dateRaw = String(
    cert.date || cert.date_range || cert.issued_date || cert.year || '',
  ).trim();
  const date = dateRaw ? formatCertificationDate(dateRaw) : '';

  if (!name) {
    return '';
  }
  if (issuer && date) {
    return `${name} – ${issuer} – ${date}`;
  }
  if (issuer) {
    return `${name} – ${issuer}`;
  }
  if (date) {
    return `${name} – ${date}`;
  }

  return name;
}
