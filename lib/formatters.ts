/**
 * Formatting Utilities
 * 
 * Provides date, number, and currency formatting functions based on user settings.
 */

import { Settings, DateFormatOption, NumberFormatOption, CurrencyLocale } from '../types';

// Default formatting options
export const DEFAULT_DATE_FORMAT: DateFormatOption = 'MM/DD/YYYY';
export const DEFAULT_NUMBER_FORMAT: NumberFormatOption = 'us';
export const DEFAULT_CURRENCY_LOCALE: CurrencyLocale = 'USD';

/**
 * Format a date string according to the specified format
 */
export function formatDate(
    date: string | Date | undefined | null,
    format: DateFormatOption = DEFAULT_DATE_FORMAT
): string {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    switch (format) {
        case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
        case 'DD/MM/YYYY':
            return `${day}/${month}/${year}`;
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        default:
            return `${month}/${day}/${year}`;
    }
}

/**
 * Format a number according to the specified locale
 */
export function formatNumber(
    num: number | undefined | null,
    format: NumberFormatOption = DEFAULT_NUMBER_FORMAT,
    decimals: number = 0
): string {
    if (num === null || num === undefined || isNaN(num)) return '';

    const locale = format === 'eu' ? 'de-DE' : 'en-US';
    return num.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

/**
 * Get currency symbol and locale settings
 */
export function getCurrencyConfig(locale: CurrencyLocale = DEFAULT_CURRENCY_LOCALE) {
    const configs: Record<CurrencyLocale, { symbol: string; locale: string; code: string }> = {
        USD: { symbol: '$', locale: 'en-US', code: 'USD' },
        EUR: { symbol: '€', locale: 'de-DE', code: 'EUR' },
        GBP: { symbol: '£', locale: 'en-GB', code: 'GBP' },
        CAD: { symbol: '$', locale: 'en-CA', code: 'CAD' },
    };
    return configs[locale] || configs.USD;
}

/**
 * Format a currency amount
 */
export function formatCurrency(
    amount: number | undefined | null,
    currencyLocale: CurrencyLocale = DEFAULT_CURRENCY_LOCALE,
    numberFormat: NumberFormatOption = DEFAULT_NUMBER_FORMAT
): string {
    if (amount === null || amount === undefined || isNaN(amount)) return '';

    const config = getCurrencyConfig(currencyLocale);

    // Use the number format's locale for grouping, but currency's symbol
    const displayLocale = numberFormat === 'eu' ? 'de-DE' : config.locale;

    return new Intl.NumberFormat(displayLocale, {
        style: 'currency',
        currency: config.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format a currency amount with decimals
 */
export function formatCurrencyWithDecimals(
    amount: number | undefined | null,
    currencyLocale: CurrencyLocale = DEFAULT_CURRENCY_LOCALE,
    numberFormat: NumberFormatOption = DEFAULT_NUMBER_FORMAT,
    decimals: number = 2
): string {
    if (amount === null || amount === undefined || isNaN(amount)) return '';

    const config = getCurrencyConfig(currencyLocale);
    const displayLocale = numberFormat === 'eu' ? 'de-DE' : config.locale;

    return new Intl.NumberFormat(displayLocale, {
        style: 'currency',
        currency: config.code,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(amount);
}

/**
 * Format a percentage
 */
export function formatPercent(
    value: number | undefined | null,
    numberFormat: NumberFormatOption = DEFAULT_NUMBER_FORMAT,
    decimals: number = 1
): string {
    if (value === null || value === undefined || isNaN(value)) return '';

    const locale = numberFormat === 'eu' ? 'de-DE' : 'en-US';
    return new Intl.NumberFormat(locale, {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value / 100);
}

/**
 * Create formatters bound to user settings
 */
export function createFormatters(settings: Settings | null) {
    const dateFormat = settings?.dateFormat || DEFAULT_DATE_FORMAT;
    const numberFormat = settings?.numberFormat || DEFAULT_NUMBER_FORMAT;
    const currencyLocale = settings?.currencyLocale || DEFAULT_CURRENCY_LOCALE;

    return {
        date: (d: string | Date | undefined | null) => formatDate(d, dateFormat),
        number: (n: number | undefined | null, decimals?: number) => formatNumber(n, numberFormat, decimals),
        currency: (a: number | undefined | null) => formatCurrency(a, currencyLocale, numberFormat),
        currencyWithDecimals: (a: number | undefined | null, decimals?: number) =>
            formatCurrencyWithDecimals(a, currencyLocale, numberFormat, decimals),
        percent: (v: number | undefined | null, decimals?: number) => formatPercent(v, numberFormat, decimals),
    };
}
