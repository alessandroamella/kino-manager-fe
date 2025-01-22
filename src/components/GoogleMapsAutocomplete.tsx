import { useState, useCallback, useRef, useEffect, Key } from 'react';
import {
  Autocomplete,
  AutocompleteItem,
  AutocompleteSection,
} from '@heroui/react';
import { Loader } from '@googlemaps/js-api-loader';

const GoogleMapsAutocomplete = ({
  apiKey,
  label,
  placeholder = 'Enter address',
  onPlaceSelect,
  ...props
}: {
  apiKey: string;
  label?: string;
  placeholder?: string;
  onPlaceSelect?: (place: google.maps.places.PlaceResult | null) => void;
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [autocompleteItems, setAutocompleteItems] = useState<
    { key: string; label: string }[]
  >([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null,
  );
  const loaderRef = useRef<Loader | null>(null);

  useEffect(() => {
    if (!apiKey) {
      console.error(
        'Google Maps API Key is required for GoogleMapsAutocomplete component.',
      );
      return;
    }

    loaderRef.current = new Loader({
      apiKey: apiKey,
      libraries: ['places'],
    });

    loaderRef.current
      .load()
      .then((google) => {
        if (google) {
          autocompleteServiceRef.current =
            new google.maps.places.AutocompleteService();
          placesServiceRef.current = new google.maps.places.PlacesService(
            document.createElement('div'),
          ); // Dummy div for PlacesService
        } else {
          console.error('Failed to load Google Maps API.');
        }
      })
      .catch((error) => {
        console.error('Google Maps API load error:', error);
      });

    return () => {
      // Cleanup if needed when component unmounts
    };
  }, [apiKey]);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    setIsMenuOpen(true);
    if (value.length > 2 && autocompleteServiceRef.current) {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: value,
          // types: ['address'], // You can restrict types if needed, e.g., 'address'
          // componentRestrictions: { country: 'us' }, // Restrict to a specific country
        },
        (predictions, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            const items = predictions.map((prediction) => ({
              key: prediction.place_id || prediction.description, // Use place_id as key, fallback to description
              label: prediction.description,
            }));
            setAutocompleteItems(items);
          } else {
            setAutocompleteItems([]); // Clear items on error or no predictions
            if (
              status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS
            ) {
              console.error('Google Maps Places Autocomplete error:', status);
            }
          }
        },
      );
    } else {
      setAutocompleteItems([]); // Clear items if input is too short
    }
  }, []);

  const handleSelectionChange = useCallback(
    (key: Key | null) => {
      if (!key) {
        console.log('No key selected');
        return;
      }
      const selectedPlaceId = String(key); // Key is place_id from Google Maps
      const selectedItem = autocompleteItems.find(
        (item) => item.key === selectedPlaceId,
      );

      if (selectedItem && placesServiceRef.current) {
        placesServiceRef.current.getDetails(
          {
            placeId: selectedPlaceId,
            fields: [
              'address_components',
              'formatted_address',
              'geometry',
              'name',
              'place_id',
              'types',
            ], // Specify fields to retrieve
          },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place) {
              setInputValue(place.formatted_address || selectedItem.label); // Set input value to formatted address or label
              setAutocompleteItems([]); // Clear autocomplete items after selection
              setIsMenuOpen(false);
              if (onPlaceSelect) {
                onPlaceSelect(place); // Pass the selected place details to the parent component
              }
            } else {
              console.error('Google Maps Places Details error:', status);
              setInputValue(selectedItem.label); // Fallback to label if details fail
              setAutocompleteItems([]);
              setIsMenuOpen(false);
              if (onPlaceSelect) {
                onPlaceSelect(null); // Inform parent component of failure to get details
              }
            }
          },
        );
      } else if (selectedItem) {
        setInputValue(selectedItem.label); // If placesService is not loaded, just set label
        setAutocompleteItems([]);
        setIsMenuOpen(false);
        if (onPlaceSelect) {
          onPlaceSelect(null); // Inform parent component of limited selection
        }
      } else {
        setAutocompleteItems([]);
        setIsMenuOpen(false);
        if (onPlaceSelect) {
          onPlaceSelect(null);
        }
      }
    },
    [autocompleteItems, onPlaceSelect],
  );

  const handleOpenChange = useCallback((open: boolean) => {
    setIsMenuOpen(open);
    if (!open) {
      setAutocompleteItems([]); // Clear items when menu closes without selection
    }
  }, []);

  return (
    <Autocomplete
      label={label}
      placeholder={placeholder}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      disabledKeys={['no-results']}
      onSelectionChange={handleSelectionChange}
      // isOpen={isMenuOpen}
      onOpenChange={handleOpenChange}
      allowsCustomValue={false} // Prevent custom values not from suggestions
      {...props} // Pass through other InputProps
    >
      {autocompleteItems.length > 0 ? (
        <AutocompleteSection title="">
          {autocompleteItems.map((item) => (
            <AutocompleteItem key={item.key} textValue={item.label}>
              {item.label}
            </AutocompleteItem>
          ))}
        </AutocompleteSection>
      ) : inputValue.length > 2 && isMenuOpen ? (
        <AutocompleteItem key="no-results">No results found</AutocompleteItem>
      ) : null}
    </Autocomplete>
  );
};

export default GoogleMapsAutocomplete;
