
"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Crosshair,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, INPUT_CLASS } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { WorkplaceLocationMap } from "@/components/workplaces/workplace-location-map";

import { useSaveWorkplace } from "@/hooks/use-workplace-mutations";
import { getErrorMessage } from "@/lib/errors";
import type { Workplace } from "@/types/workplaces";

const schema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Enter at least 2 characters")
      .max(100, "Maximum 100 characters"),

    latitude: z.number().min(-90).max(90).nullable(),

    longitude: z.number().min(-180).max(180).nullable(),

    geofence_radius_m: z
      .number()
      .int("Radius must be a whole number")
      .min(10, "Minimum radius is 10 metres")
      .max(1000, "Maximum radius is 1,000 metres"),

    require_location_verification: z.boolean(),
  })
  .superRefine((values, context) => {
    const hasLatitude = values.latitude !== null;
    const hasLongitude = values.longitude !== null;

    if (hasLatitude !== hasLongitude) {
      context.addIssue({
        code: "custom",
        message: "Select a complete workplace location.",
        path: ["latitude"],
      });
    }

    if (
      values.require_location_verification &&
      (!hasLatitude || !hasLongitude)
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Select a workplace location before enabling GPS verification.",
        path: ["latitude"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

type Props = {
  workplace?: Workplace;
  onClose: () => void;
};

export function WorkplaceForm({ workplace, onClose }: Props) {
  const save = useSaveWorkplace(workplace);

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: workplace?.name ?? "",
      latitude: workplace?.latitude ?? null,
      longitude: workplace?.longitude ?? null,
      geofence_radius_m: workplace?.geofence_radius_m ?? 100,
      require_location_verification:
        workplace?.require_location_verification ?? false,
    },
  });

  const latitude = useWatch({ control, name: "latitude" });
  const longitude = useWatch({ control, name: "longitude" });
  const radius = useWatch({ control, name: "geofence_radius_m" });
  const requireVerification = useWatch({
    control,
    name: "require_location_verification",
  });

  function updateCoordinates(lat: number, lng: number) {
    setValue("latitude", Number(lat.toFixed(7)), {
      shouldDirty: true,
      shouldValidate: true,
    });

    setValue("longitude", Number(lng.toFixed(7)), {
      shouldDirty: true,
      shouldValidate: true,
    });

    setLocationError(null);
  }

  function locateMe() {
    if (!navigator.geolocation) {
      setLocationError(
        "Your browser does not support location detection.",
      );
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateCoordinates(
          position.coords.latitude,
          position.coords.longitude,
        );

        setLocating(false);
      },
      (error) => {
        const messages: Record<number, string> = {
          1: "Location permission was denied. Allow location access in your browser settings.",
          2: "Your location could not be determined. Try again or select a point on the map.",
          3: "Location detection timed out. Try again.",
        };

        setLocationError(
          messages[error.code] ?? "Unable to determine your location.",
        );

        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }

  function onSubmit(values: FormValues) {
    save.mutate(
      {
        name: values.name,
        latitude: values.latitude,
        longitude: values.longitude,
        geofence_radius_m: values.geofence_radius_m,
        require_location_verification:
          values.require_location_verification,
      },
      {
        onSuccess: onClose,
      },
    );
  }

  return (
    <Modal
      title={workplace ? "Edit workplace" : "Create workplace"}
      onClose={onClose}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        {save.error && (
          <Alert>{getErrorMessage(save.error)}</Alert>
        )}

        {/* Required workplace details */}
        <section className="space-y-4">
          <div>
            <h3 className="font-semibold text-navy-900">
              Workplace details
            </h3>

            <p className="text-sm text-navy-600">
              Give this workplace a name employees and managers can recognize.
            </p>
          </div>

          <Field label="Workplace name" error={errors.name?.message}>
            <input
              className={INPUT_CLASS}
              placeholder="e.g. Main office, Factory, Branch 1"
              {...register("name")}
            />
          </Field>
        </section>

        <div className="border-t border-navy-100" />

        {/* Optional workplace location */}
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <MapPin className="size-5 text-navy-600" />

                <h3 className="font-semibold text-navy-900">
                  Workplace location
                </h3>

                <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs font-medium text-navy-600">
                  Optional
                </span>
              </div>

              <p className="mt-1 text-sm text-navy-600">
                Set this workplace on the map. A location is only required
                if you enable GPS attendance verification.
              </p>
            </div>

            <Button
              type="button"
              variant="secondary"
              loading={locating}
              onClick={locateMe}
            >
              <Crosshair className="mr-2 size-4" />
              {locating ? "Locating..." : "Use my location"}
            </Button>
          </div>

          {locationError && (
            <div
              role="alert"
              className="rounded-lg border border-danger-600/20 bg-danger-50 px-3 py-2 text-sm text-danger-700"
            >
              {locationError}
            </div>
          )}

          <WorkplaceLocationMap
            latitude={latitude}
            longitude={longitude}
            radius={radius}
            onLocationChange={updateCoordinates}
          />

          <p className="text-xs text-navy-600">
            Click the map to select the workplace location, or drag the
            marker to adjust it.
          </p>

          {errors.latitude?.message && (
            <p className="text-sm text-red-600">
              {errors.latitude.message}
            </p>
          )}

          {latitude !== null && longitude !== null && (
            <p className="text-xs text-navy-500">
              Workplace location selected.
            </p>
          )}
        </section>

        <div className="border-t border-navy-100" />

        {/* Optional GPS verification */}
        <section className="space-y-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-navy-600" />

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-navy-900">
                  GPS attendance verification
                </h3>

                <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs font-medium text-navy-600">
                  Optional
                </span>
              </div>

              <p className="text-sm text-navy-600">
                Control whether employees must be physically near this
                workplace when clocking in and out.
              </p>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-navy-200 p-4 transition hover:bg-navy-50">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-navy-700"
              {...register("require_location_verification")}
            />

            <span>
              <span className="block text-sm font-medium text-navy-900">
                Require GPS verification
              </span>

              <span className="mt-1 block text-xs text-navy-600">
                Employees must be within the permitted workplace area
                when recording attendance.
              </span>
            </span>
          </label>

          {requireVerification && (
            <div className="space-y-4 rounded-lg border border-navy-200 p-4">
              <div>
                <h4 className="font-semibold text-navy-900">
                  Allowed attendance radius
                </h4>

                <p className="mt-1 text-sm text-navy-600">
                  Choose how close employees must be to this workplace.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 50, label: "Small office" },
                  { value: 100, label: "Standard building" },
                  { value: 250, label: "Large site" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setValue("geofence_radius_m", option.value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    className={`rounded-lg border px-2 py-3 text-center transition ${
                      radius === option.value
                        ? "border-navy-700 bg-navy-50 text-navy-900"
                        : "border-navy-200 text-navy-700 hover:bg-navy-50"
                    }`}
                  >
                    <span className="block text-sm font-semibold">
                      {option.value} m
                    </span>

                    <span className="mt-1 block text-xs">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>

              <Field
                label="Custom radius (metres)"
                error={errors.geofence_radius_m?.message}
              >
                <input
                  type="number"
                  min={10}
                  max={1000}
                  step={1}
                  className={INPUT_CLASS}
                  {...register("geofence_radius_m", {
                    setValueAs: (value) =>
                      value === "" ? NaN : Number(value),
                  })}
                />
              </Field>

              <p className="text-xs text-navy-600">
                The map circle shows the permitted attendance area.
                You can use a radius between 10 and 1,000 metres.
              </p>
            </div>
          )}

          {!requireVerification && (
            <p className="text-sm text-navy-500">
              GPS verification is off. Employees will not be restricted
              by this workplace's GPS radius.
            </p>
          )}
        </section>

        <div className="flex flex-col-reverse justify-end gap-3 border-t border-navy-100 pt-5 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button type="submit" loading={save.isPending}>
            {workplace ? "Save changes" : "Create workplace"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
