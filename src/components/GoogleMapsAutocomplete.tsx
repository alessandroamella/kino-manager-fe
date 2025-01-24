import { useState, useCallback, useRef, useEffect, Key } from 'react';
import {
  Autocomplete,
  AutocompleteItem,
  AutocompleteProps,
  AutocompleteSection,
} from '@heroui/react';
import { Loader } from '@googlemaps/js-api-loader';
import { mapsApiKey } from '../constants/maps';
import { useTranslation } from 'react-i18next';
import { sanCesarioCoords } from '../constants/coords';

const DEBOUNCE_DELAY = 300; // Time to wait after typing before searching

interface GoogleMapsAutocompleteProps
  extends Omit<
    AutocompleteProps,
    'children' | 'onInputChange' | 'onSelectionChange' | 'value' | 'onChange'
  > {
  label?: string;
  placeholder?: string;
  onPlaceSelect?: (place: google.maps.places.PlaceResult | null) => void;
}

const GoogleMapsAutocomplete = ({
  label = 'Address',
  placeholder = 'Enter address',
  onPlaceSelect,
  ...props // Inherit all AutocompleteProps for flexibility
}: GoogleMapsAutocompleteProps) => {
  const [inputValue, setInputValue] = useState<string>(''); // Internal input value state
  const [autocompleteItems, setAutocompleteItems] = useState<
    { key: string; label: string }[]
  >([]);
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null,
  );
  const loaderRef = useRef<Loader | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null); // For debouncing predictions

  const { i18n } = useTranslation();

  useEffect(() => {
    // Initialize Google Maps Places API loader
    loaderRef.current = new Loader({
      apiKey: mapsApiKey,
      libraries: ['places'],
      language: i18n.language,
    });

    loaderRef.current
      .importLibrary('places')
      .then((google) => {
        if (google) {
          // Initialize Autocomplete and Places services
          autocompleteServiceRef.current = new google.AutocompleteService();
          placesServiceRef.current = new google.PlacesService(
            document.createElement('div'), // Invisible div for PlacesService
          );
        } else {
          console.error('Failed to load Google Maps API.');
        }
      })
      .catch((error) => {
        console.error('Google Maps API load error:', error);
      });

    return () => {
      // Cleanup on unmount
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (loaderRef.current) {
        loaderRef.current.deleteScript();
      }
    };

    // we can't reload the loader if the language changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value); // Update internal input value immediately

    // Debounce the autocomplete requests
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      if (value.length > 2 && autocompleteServiceRef.current) {
        // Get autocomplete predictions from Google Maps Places API
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: value,
            // language: i18n.language,
            language: 'it', // we need italian on the signed doc
            // usually based off Kino Cafe
            locationBias: sanCesarioCoords,
            componentRestrictions: { country: [] }, // You can set specific countries here if needed, or leave it empty for all.
          },
          (predictions, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              // Map predictions to AutocompleteItems format
              const items = predictions.map((prediction) => ({
                key: prediction.place_id || prediction.description,
                label: prediction.description,
              }));
              setAutocompleteItems(items);
            } else {
              setAutocompleteItems([]); // Clear suggestions on error or no results
              if (
                status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS
              ) {
                console.error('Google Maps Places Autocomplete error:', status);
              }
            }
          },
        );
      } else {
        setAutocompleteItems([]); // Clear suggestions if input is too short
      }
      debounceTimeoutRef.current = null; // Reset debounce timeout
    }, DEBOUNCE_DELAY);
  }, []);

  const handleSelectionChange = useCallback(
    (key: Key | null) => {
      console.log('Google Maps Places Selection:', key);
      if (!key) {
        onPlaceSelect?.(null); // Inform parent about no selection
        return; // No selection made
      }

      const selectedPlaceId = String(key);
      const selectedItem = autocompleteItems.find(
        (item) => item.key === selectedPlaceId,
      );

      if (selectedItem && placesServiceRef.current) {
        // Get detailed place information using PlacesService
        placesServiceRef.current.getDetails(
          {
            placeId: selectedPlaceId,
            fields: [
              'address_components', // Already present, includes street_number, route, etc.
              'formatted_address',
              'geometry',
              'name',
              'place_id',
              'types',
            ],
          },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              console.log('Google Maps Places Details:', place);
              setInputValue(place.formatted_address || selectedItem.label); // Update internal input
              onPlaceSelect?.(place);
            } else {
              console.error('Google Maps Places Details error:', status);
              setInputValue(selectedItem.label); // Update internal input even on detail fetch fail
              onPlaceSelect?.(null);
              console.error('Google Maps Places Details error:', status);
            }
            ref.current?.blur(); // Remove focus after selection
          },
        );
      } else if (selectedItem) {
        console.log('Google Maps Places Details: No PlacesService available');
        setInputValue(selectedItem.label); // Still update internal input
        onPlaceSelect?.(null); // Inform parent about limited selection
      } else {
        console.log('Google Maps Places Details: No item found');
        onPlaceSelect?.(null); // No item selected or found
      }
      setAutocompleteItems([]); // Clear suggestions after selection
    },
    [autocompleteItems, onPlaceSelect], // Dependencies for useCallback
  );

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setAutocompleteItems([]); // Clear items when menu closes without selection
    }
  }, []);

  const ref = useRef<HTMLInputElement | null>(null);

  return (
    <Autocomplete
      label={label}
      ref={ref}
      placeholder={placeholder}
      inputValue={inputValue} // Use internal inputValue state
      onInputChange={handleInputChange}
      disabledKeys={['no-results']}
      defaultFilter={() => true} // Let Autocomplete handle default filtering
      onSelectionChange={handleSelectionChange}
      onOpenChange={handleOpenChange}
      allowsCustomValue={false} // Prevent free-form input, only suggestions allowed
      {...props} // Pass through other Autocomplete props, including form integration props
    >
      {autocompleteItems.length > 0 ? (
        <AutocompleteSection title="">
          {autocompleteItems.map((item) => (
            <AutocompleteItem key={item.key} textValue={item.label}>
              {item.label}
            </AutocompleteItem>
          ))}
        </AutocompleteSection>
      ) : (
        <AutocompleteItem key="no-results">No results found</AutocompleteItem>
      )}
    </Autocomplete>
  );
};

export default GoogleMapsAutocomplete;
