"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

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
  inputClassName?: string;
  label?: string;
  onRawChange?: (value: string) => void;
  onResolved?: (value: AddressValue) => void;
}

let placesScriptPromise: Promise<void> | null = null;

function loadPlacesScript(apiKey: string) {
  if (window.google?.maps?.places) {
    return Promise.resolve();
  }

  if (placesScriptPromise) {
    return placesScriptPromise;
  }

  placesScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-places="true"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Places.")),
        {
          once: true,
        },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googlePlaces = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Failed to load Google Places.")),
      {
        once: true,
      },
    );
    document.head.appendChild(script);
  });

  return placesScriptPromise;
}

function findAddressComponent(
  components: google.maps.GeocoderAddressComponent[] | undefined,
  type: string,
) {
  return (
    components?.find((component) => component.types.includes(type))
      ?.long_name ?? ""
  );
}

export function GoogleAutocompleteInput({
  name,
  defaultValue,
  placeholder,
  initialResolvedValue,
  inputClassName,
  label,
  onRawChange,
  onResolved,
}: GoogleAutocompleteInputProps) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null,
  );
  const requestVersionRef = useRef(0);
  const [query, setQuery] = useState(
    defaultValue ?? initialResolvedValue?.label ?? "",
  );
  const [predictions, setPredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [placesAvailable, setPlacesAvailable] = useState<boolean>(() =>
    typeof process !== "undefined" && Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY),
  );

  useEffect(() => {
    if (!initialResolvedValue) {
      return;
    }

    setQuery(initialResolvedValue.label);
    onResolved?.(initialResolvedValue);
  }, [initialResolvedValue, onResolved]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

    if (!apiKey) {
      setPlacesAvailable(false);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    loadPlacesScript(apiKey)
      .then(() => {
        if (!isMounted || !window.google?.maps?.places) {
          setPlacesAvailable(false);
          return;
        }

        autocompleteServiceRef.current =
          new window.google.maps.places.AutocompleteService();
        placesServiceRef.current = new window.google.maps.places.PlacesService(
          document.createElement("div"),
        );
        setPlacesAvailable(true);
      })
      .catch(() => {
        setPlacesAvailable(false);
        setPredictions([]);
        setIsOpen(false);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const service = autocompleteServiceRef.current;
    const trimmedQuery = query.trim();

    if (!service || trimmedQuery.length < 3) {
      setPredictions([]);
      setActiveIndex(-1);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsLoading(true);
      const requestVersion = requestVersionRef.current + 1;
      requestVersionRef.current = requestVersion;

      service.getPlacePredictions(
        {
          input: trimmedQuery,
          componentRestrictions: { country: "au" },
          types: ["geocode"],
        },
        (results) => {
          if (requestVersionRef.current !== requestVersion) {
            return;
          }

          const nextPredictions = results ?? [];
          setPredictions(nextPredictions);
          setActiveIndex(nextPredictions.length > 0 ? 0 : -1);
          setIsOpen(nextPredictions.length > 0);
          setIsLoading(false);
        },
      );
    }, 150);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [query]);

  async function resolvePrediction(
    prediction: google.maps.places.AutocompletePrediction,
  ) {
    const service = placesServiceRef.current;

    if (!service) {
      return;
    }

    const details = await new Promise<google.maps.places.PlaceResult | null>(
      (resolve) => {
        service.getDetails(
          {
            placeId: prediction.place_id,
            fields: ["address_components", "formatted_address", "geometry"],
          },
          (result) => resolve(result ?? null),
        );
      },
    );

    if (!details?.formatted_address || !details.geometry?.location) {
      return;
    }

    const resolvedValue = {
      label: details.formatted_address,
      suburb:
        findAddressComponent(details.address_components, "locality") ||
        findAddressComponent(details.address_components, "sublocality") ||
        findAddressComponent(
          details.address_components,
          "administrative_area_level_2",
        ),
      postcode: findAddressComponent(details.address_components, "postal_code"),
      latitude: details.geometry.location.lat(),
      longitude: details.geometry.location.lng(),
    };

    setQuery(resolvedValue.label);
    setPredictions([]);
    setActiveIndex(-1);
    setIsOpen(false);
    onRawChange?.(resolvedValue.label);
    onResolved?.(resolvedValue);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!predictions.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current + 1) % predictions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        current <= 0 ? predictions.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter" && isOpen) {
      event.preventDefault();
      const prediction = predictions[activeIndex] ?? predictions[0];

      if (prediction) {
        void resolvePrediction(prediction);
      }
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  const activeDescendant =
    isOpen && activeIndex >= 0 ? `${inputId}-option-${activeIndex}` : undefined;

  return (
    <div ref={rootRef} className="relative">
      <Input
        id={inputId}
        ref={inputRef}
        name={name}
        aria-label={label}
        value={query}
        placeholder={placesAvailable ? placeholder : `${placeholder ?? "Address"} (manual entry)`}
        className={inputClassName}
        autoComplete={placesAvailable ? "off" : "street-address"}
        aria-autocomplete={placesAvailable ? "list" : "none"}
        aria-controls={listboxId}
        aria-expanded={placesAvailable ? isOpen : undefined}
        aria-activedescendant={activeDescendant}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          onRawChange?.(next);
          if (!placesAvailable && next.trim().length > 0) {
            const fallbackSuburbMatch = next.match(/([A-Za-z][A-Za-z\s]+?)\s+(\d{4})/);
            onResolved?.({
              label: next,
              suburb: fallbackSuburbMatch?.[1]?.trim() ?? "",
              postcode: fallbackSuburbMatch?.[2] ?? "",
              latitude: 0,
              longitude: 0,
            });
          }
        }}
        onFocus={() => {
          if (placesAvailable && predictions.length > 0) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
      />
      {!placesAvailable ? (
        <p className="mt-1 text-xs text-text-secondary">
          Address autocomplete is unavailable. Type the full address including suburb and postcode.
        </p>
      ) : null}

      {placesAvailable && (isOpen || isLoading) ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-lg"
        >
          {isLoading ? (
            <li className="px-3 py-3 text-sm text-text-secondary">
              Looking up nearby suburbs...
            </li>
          ) : null}
          {predictions.map((prediction, index) => {
            const isActive = index === activeIndex;

            return (
              <li
                key={prediction.place_id}
                id={`${inputId}-option-${index}`}
                role="option"
                aria-selected={isActive}
                className={`cursor-pointer px-3 py-3 text-sm text-text ${
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "active:bg-black/[0.04]"
                }`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  void resolvePrediction(prediction);
                }}
                onMouseEnter={() => setActiveIndex(index)}
              >
                {prediction.description}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
