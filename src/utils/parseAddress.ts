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

interface ParsedAddress {
  streetName: string | null;
  streetNumber: number | null;
  postalCode: string | null;
  city: string | null;
  province: string | null;
  country: string | null;
}

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

  for (const component of addressData.address_components) {
    const types = component.types;

    if (types.includes('street_number')) {
      parsedAddress.streetNumber = parseInt(component.short_name, 10);
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
};
