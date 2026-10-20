/**
 * The business details used on the About, Terms, Privacy and Delivery pages.
 *
 * Fill in what applies to you. Anything left empty is simply left out of the
 * pages, so nothing breaks if a field is blank. South African law (the ECTA
 * and POPIA) expects an online shop to show who it is and how to reach it,
 * so please fill in at least the legal name, the physical address and an
 * email address before you launch.
 */
export const BUSINESS = {
  /** The name customers see. */
  tradingName: "Offline House",
  /** The registered owner: your company's full name, or the owner's full name if you trade as an individual. */
  legalName: "",
  /** Company registration number, if you have one. */
  registrationNumber: "",
  /** VAT number, only if you are registered for VAT. */
  vatNumber: "",
  /** A physical address (a street address, not a PO box). */
  address: "",
  email: "",
  phone: "",
  /** WhatsApp number: digits only with the country code, e.g. 27821234567. Shows a WhatsApp button on the Help and Contact pages. */
  whatsapp: "",
  /** Opening hours for support, e.g. "Monday to Friday, 9:00 to 17:00". */
  hours: "",
};

/** The details above that are filled in, as short lines of text. */
export function businessLines(): string[] {
  const b = BUSINESS;
  return [
    `Trading name: ${b.tradingName}`,
    b.legalName && `Registered owner: ${b.legalName}`,
    b.registrationNumber && `Registration number: ${b.registrationNumber}`,
    b.vatNumber && `VAT number: ${b.vatNumber}`,
    b.address && `Physical address: ${b.address}`,
    b.email && `Email: ${b.email}`,
    b.phone && `Phone: ${b.phone}`,
    b.whatsapp && `WhatsApp: +${b.whatsapp.replace(/\D/g, "")}`,
    b.hours && `Support hours: ${b.hours}`,
  ].filter((l): l is string => Boolean(l));
}

/** Support hours as a list of lines for the contact page. */
export function hoursLines(): string[] | undefined {
  return BUSINESS.hours ? [BUSINESS.hours] : undefined;
}
