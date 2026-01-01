
import { countries } from './countries';

export const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
};

export const generateMyCESENumber = (): string => {
    const year = 2026;
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MYC-${year}-${randomPart}`;
};

export const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
};

export const formatDateTime = (dateString: string) => {
     return new Date(dateString).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export const generateTemporaryPassword = (): string => {
    const randomPart = Math.random().toString(36).substring(2, 8);
    return `Mudar@${randomPart}`;
};

export const parsePhoneNumber = (fullNumber: string): { countryCode: string; phoneNumber: string } => {
    if (!fullNumber) {
        return { countryCode: '+258', phoneNumber: '' };
    }
    
    const sortedCountries = [...countries].sort((a, b) => b.code.length - a.code.length);

    const foundCountry = sortedCountries.find(country => fullNumber.startsWith(country.code));

    if (foundCountry) {
        return {
            countryCode: foundCountry.code,
            phoneNumber: fullNumber.substring(foundCountry.code.length),
        };
    }

    return {
        countryCode: '+258',
        phoneNumber: fullNumber.replace(/^\+?258/, ''),
    };
};

export const formatMozambiquePhone = (value: string): string => {
  // Remove all non-digit characters
  const digitsOnly = value.replace(/\D/g, '');

  // Truncate to 9 digits
  const truncatedDigits = digitsOnly.slice(0, 9);

  let maskedValue = truncatedDigits;
  
  // Apply mask 8X-XXX-XXXX
  if (truncatedDigits.length > 5) {
    maskedValue = `${truncatedDigits.slice(0, 2)}-${truncatedDigits.slice(2, 5)}-${truncatedDigits.slice(5)}`;
  } else if (truncatedDigits.length > 2) {
    maskedValue = `${truncatedDigits.slice(0, 2)}-${truncatedDigits.slice(2)}`;
  }
  
  return maskedValue;
};
