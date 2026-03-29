const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ValidationError = { field: string; message: string };

function err(field: string, message: string): ValidationError {
  return { field, message };
}

function required(val: unknown, field: string, label: string): ValidationError | null {
  if (val === null || val === undefined || (typeof val === "string" && !val.trim())) {
    return err(field, `${label} ist erforderlich.`);
  }
  return null;
}

function maxLen(val: string | null | undefined, max: number, field: string, label: string): ValidationError | null {
  if (val && val.length > max) {
    return err(field, `${label} darf maximal ${max} Zeichen haben.`);
  }
  return null;
}

function minLen(val: string | null | undefined, min: number, field: string, label: string): ValidationError | null {
  if (val && val.trim().length < min) {
    return err(field, `${label} muss mindestens ${min} Zeichen haben.`);
  }
  return null;
}

function validEmail(val: string, field: string): ValidationError | null {
  if (!EMAIL_RE.test(val)) {
    return err(field, "Bitte gib eine gültige E-Mail-Adresse ein.");
  }
  return null;
}

function validDate(val: string | null, field: string, label: string): ValidationError | null {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    return err(field, `${label}: Ungültiges Datumsformat.`);
  }
  return null;
}

function futureDate(val: string | null, field: string): ValidationError | null {
  if (!val) return null;
  const today = new Date().toISOString().split("T")[0];
  if (val <= today) {
    return err(field, "Bitte wähle ein Datum in der Zukunft.");
  }
  return null;
}

function collect(...results: (ValidationError | null)[]): ValidationError[] {
  return results.filter((r): r is ValidationError => r !== null);
}

// --- Domain validators ---

export function validateMessage(data: {
  title: string;
  body: string;
  recipient_name: string;
  recipient_email: string;
  trigger_type: string;
  trigger_date: string | null;
}): ValidationError[] {
  const errors = collect(
    required(data.title, "title", "Betreff"),
    maxLen(data.title, 100, "title", "Betreff"),
    required(data.body, "body", "Nachrichtentext"),
    maxLen(data.body, 5000, "body", "Nachrichtentext"),
    required(data.recipient_name, "recipient_name", "Empfänger-Name"),
    required(data.recipient_email, "recipient_email", "E-Mail-Adresse"),
  );
  if (data.recipient_email?.trim()) {
    const emailErr = validEmail(data.recipient_email.trim(), "recipient_email");
    if (emailErr) errors.push(emailErr);
  }
  if (!["date", "death"].includes(data.trigger_type)) {
    errors.push(err("trigger_type", "Ungültiger Auslöser-Typ."));
  }
  if (data.trigger_type === "date") {
    const reqErr = required(data.trigger_date, "trigger_date", "Datum");
    if (reqErr) errors.push(reqErr);
    if (data.trigger_date) {
      const dateErr = validDate(data.trigger_date, "trigger_date", "Datum");
      if (dateErr) errors.push(dateErr);
      else {
        const futErr = futureDate(data.trigger_date, "trigger_date");
        if (futErr) errors.push(futErr);
      }
    }
  }
  return errors;
}

export function validateMemorial(data: {
  name: string;
  description?: string | null;
  biography?: string | null;
  birth_date?: string | null;
  death_date?: string | null;
}): ValidationError[] {
  const errors = collect(
    required(data.name, "name", "Name"),
    maxLen(data.name, 200, "name", "Name"),
    maxLen(data.description ?? null, 500, "description", "Beschreibung"),
    maxLen(data.biography ?? null, 5000, "biography", "Biografie"),
    validDate(data.birth_date ?? null, "birth_date", "Geburtsdatum"),
    validDate(data.death_date ?? null, "death_date", "Sterbedatum"),
  );
  if (data.birth_date && data.death_date) {
    if (new Date(data.death_date) < new Date(data.birth_date)) {
      errors.push(err("death_date", "Sterbedatum muss nach Geburtsdatum liegen."));
    }
  }
  return errors;
}

export function validateTrustedPerson(data: {
  name: string;
  email: string;
  relationship?: string | null;
}): ValidationError[] {
  const errors = collect(
    required(data.name, "name", "Name"),
    maxLen(data.name, 200, "name", "Name"),
    required(data.email, "email", "E-Mail-Adresse"),
    maxLen(data.relationship ?? null, 200, "relationship", "Beziehung"),
  );
  if (data.email?.trim()) {
    const emailErr = validEmail(data.email.trim(), "email");
    if (emailErr) errors.push(emailErr);
  }
  return errors;
}

export function validateReminder(data: {
  title: string;
  description?: string | null;
  reminder_date: string;
  reminder_type: string;
}): ValidationError[] {
  const errors = collect(
    required(data.title, "title", "Titel"),
    maxLen(data.title, 200, "title", "Titel"),
    maxLen(data.description ?? null, 2000, "description", "Beschreibung"),
    required(data.reminder_date, "reminder_date", "Datum"),
    validDate(data.reminder_date, "reminder_date", "Datum"),
  );
  if (!["birthday", "deathday", "anniversary", "custom"].includes(data.reminder_type)) {
    errors.push(err("reminder_type", "Ungültiger Termin-Typ."));
  }
  return errors;
}

export function validateDiaryEntry(data: {
  title?: string | null;
  content: string;
}): ValidationError[] {
  return collect(
    maxLen(data.title ?? null, 200, "title", "Titel"),
    required(data.content, "content", "Eintrag"),
    maxLen(data.content, 10000, "content", "Eintrag"),
  );
}

export function validateSettings(data: {
  full_name?: string;
  password?: string;
  confirm_password?: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];
  if (data.full_name !== undefined) {
    const lenErr = maxLen(data.full_name, 100, "full_name", "Anzeigename");
    if (lenErr) errors.push(lenErr);
  }
  if (data.password !== undefined) {
    const minErr = minLen(data.password, 8, "password", "Passwort");
    if (minErr) errors.push(minErr);
    if (data.confirm_password !== undefined && data.password !== data.confirm_password) {
      errors.push(err("confirm_password", "Passwörter stimmen nicht überein."));
    }
  }
  return errors;
}

export function firstError(errors: ValidationError[]): string {
  return errors[0]?.message ?? "";
}
