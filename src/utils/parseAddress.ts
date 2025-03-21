import { MemberExtended } from '@/types/Member';

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface AddressApiResponse {
  address_components?: AddressComponent[];
  formatted_address?: string;
  geometry?: unknown;
  name?: string;
  place_id?: string;
  types?: string[];
  html_attributions?: unknown[];
}

type ParsedAddress = Pick<
  MemberExtended,
  'streetName' | 'streetNumber' | 'postalCode' | 'city' | 'province' | 'country'
>;

export const parseAddress = (
  addressData: AddressApiResponse,
): ParsedAddress => {
  const parsedAddress: ParsedAddress = {
    streetName: null,
    streetNumber: null,
    postalCode: null,
    city: null,
    province: null,
    country: null,
  };

  if (!addressData || !addressData.address_components) {
    return parsedAddress; // Return default null values if input is invalid
  }

  if (addressData.address_components.some((e) => e.short_name === 'IT')) {
    for (const component of addressData.address_components) {
      const { types } = component;

      if (types.includes('street_number')) {
        parsedAddress.streetNumber = component.short_name;
      } else if (types.includes('route')) {
        parsedAddress.streetName = component.long_name;
      } else if (types.includes('postal_code')) {
        parsedAddress.postalCode = component.short_name;
      } else if (types.includes('administrative_area_level_3')) {
        // prioritize administrative_area_level_3 over locality
        // since usually locality also includes frazioni and other subdivisions
        parsedAddress.city = component.long_name;
      } else if (types.includes('locality')) {
        parsedAddress.city = component.long_name;
      } else if (types.includes('administrative_area_level_2')) {
        parsedAddress.province = component.short_name; // Short name for province
      } else if (types.includes('country')) {
        parsedAddress.country = component.short_name; // Short name for country
      }
    }

    return parsedAddress;
  }

  // Track if we've found a city to handle priority
  let foundCity = false;

  for (const component of addressData.address_components) {
    const types = component.types;

    if (types.includes('street_number')) {
      // Handle numeric and non-numeric street numbers
      parsedAddress.streetNumber = component.short_name;
    } else if (types.includes('route')) {
      parsedAddress.streetName = component.long_name;
    } else if (types.includes('postal_code')) {
      parsedAddress.postalCode = component.short_name;
    } else if (types.includes('administrative_area_level_3') && !foundCity) {
      // For Italian addresses - prioritize administrative_area_level_3
      parsedAddress.city = component.long_name;
      foundCity = true;
    } else if (types.includes('locality') && !foundCity) {
      // Common city identifier in many countries
      parsedAddress.city = component.long_name;
      foundCity = true;
    } else if (types.includes('sublocality') && !foundCity) {
      // Some countries use sublocality
      parsedAddress.city = component.long_name;
      foundCity = true;
    } else if (types.includes('administrative_area_level_1')) {
      // State/province/region - use long_name for international addresses
      // parsedAddress.province = component.long_name;
      parsedAddress.province = component.short_name;
    } else if (
      types.includes('administrative_area_level_2') &&
      !parsedAddress.province
    ) {
      // County/district - fallback if level_1 not present
      parsedAddress.province = component.short_name;
    } else if (types.includes('country')) {
      parsedAddress.country = component.short_name; // ISO country code
    }
  }

  return parsedAddress;
};
