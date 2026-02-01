const DATETIME_LOCAL_REGEX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/**
 * Converte strings no formato datetime-local (YYYY-MM-DDTHH:mm[:ss])
 * em objetos Date preservando as partes locais sem aplicar offset de UTC.
 * Para outras strings compatíveis com Date, usa o parser nativo.
 */
export const parseDateTimeLocal = (value) => {
  if (value === '' || value === null || value === undefined || value === 'null' || value === 'undefined') {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? value : value;
  }

  if (typeof value === 'string') {
    const match = DATETIME_LOCAL_REGEX.exec(value);
    if (match) {
      const [, year, month, day, hour, minute, , second = '0'] = match;
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      );
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed;
};

export default {
  parseDateTimeLocal
};
