"use client";

import { useEffect, useId, useRef } from "react";

import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    google?: typeof google;
  }
}

export interface AddressValue {
  label: string;
  suburb: string;
  postcode: string;
  latitude: number;
  longitude: number;
}

interface GoogleAutocompleteInputProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  initialResolvedValue?: AddressValue | null;
  onResolved?: (value: AddressValue) => void;
}

function loadPlacesScript(apiKey: string) {
  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-google-places="true"]',
  );

  if (existing) {
    return;
  }

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.async = true;
  script.defer = true;
  script.dataset.googlePlaces = "true";
  document.head.appendChild(script);
}

function findAddressComponent(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  type: string,
) {
  return components?.find((component) => component.types.includes(type))?.long_name ?? "";
}

export function GoogleAutocompleteInput({
  name,
  defaultValue,
  placeholder,
  initialResolvedValue,
  onResolved,
}: GoogleAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    if (initialResolvedValue) {
      onResolved?.(initialResolvedValue);
    }
  }, [initialResolvedValue, onResolved]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

    if (!apiKey || !inputRef.current) {
      return;
    }

    loadPlacesScript(apiKey);

    const interval = window.setInterval(() => {
      if (!window.google?.maps?.places || !inputRef.current) {
        return;
      }

      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: "au" },
          fields: ["address_components", "formatted_address", "geometry"],
          types: ["geocode"],
        },
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        if (!place.formatted_address || !place.geometry?.location) {
          return;
        }

        onResolved?.({
          label: place.formatted_address,
          suburb:
            findAddressComponent(place.address_components, "locality") ||
            findAddressComponent(place.address_components, "sublocality") ||
            findAddressComponent(place.address_components, "administrative_area_level_2"),
          postcode: findAddressComponent(place.address_components, "postal_code"),
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng(),
        });
      });

      window.clearInterval(interval);
    }, 200);

    return () => {
      window.clearInterval(interval);
    };
  }, [onResolved]);

  return (
    <Input
      id={id}
      ref={inputRef}
      name={name}
      defaultValue={defaultValue ?? initialResolvedValue?.label}
      placeholder={placeholder}
    />
  );
}
