
"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { Avatar } from "@/components/ui/avatar";
import { useMe } from "@/hooks/use-me";
import {
  useUploadProfileImage,
  useRemoveProfileImage,
} from "@/hooks/use-user-mutations";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ProfilePictureSettings() {
  const { data: me, isPending, error } = useMe();

  const upload = useUploadProfileImage();
  const remove = useRemoveProfileImage();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setValidationError("");
    upload.reset();

    if (!ALLOWED_TYPES.includes(file.type)) {
      setValidationError("Only JPEG, PNG and WebP images are supported.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setValidationError("Image must not exceed 5 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleUpload() {
    if (!selectedFile) return;

    upload.mutate(selectedFile, {
      onSuccess: () => {
        setSelectedFile(null);
        setPreviewUrl(null);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
    });
  }

  function handleRemove() {
    if (!window.confirm("Remove your profile picture?")) return;

    remove.mutate(undefined, {
      onSuccess: () => {
        setSelectedFile(null);
        setPreviewUrl(null);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
    });
  }

  if (isPending) {
    return <p className="text-sm text-navy-500">Loading profile...</p>;
  }

  if (error || !me) {
    return (
      <p className="text-sm text-red-600">
        Unable to load your profile.
      </p>
    );
  }

  const hasProfileImage = Boolean(me.user.profile_image_url);

  return (
    <section className="space-y-5 rounded-xl border border-navy-200 bg-white p-6">
      <div>
        <h2 className="font-semibold text-navy-900">Profile picture</h2>
        <p className="mt-1 text-sm text-navy-500">
          Choose a picture that helps others recognize your account.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Avatar
          key={previewUrl ?? me.user.profile_image_url ?? "no-image"}
          name={me.user.full_name}
          imageUrl={previewUrl ?? me.user.profile_image_url}
          size="lg"
        />

        <div className="min-w-0">
          <p className="font-medium text-navy-900">
            {me.user.full_name}
          </p>
          <p className="break-all text-sm text-navy-500">
            {me.user.email}
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="block w-full text-sm text-navy-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-100 file:px-4 file:py-2 file:font-medium file:text-brand-900 hover:file:bg-brand-200"
      />

      <p className="text-xs text-navy-500">
        JPEG, PNG or WebP. Maximum file size: 5 MB.
      </p>

      {validationError && (
        <p className="text-sm text-red-600">{validationError}</p>
      )}

      {upload.error && (
        <p className="text-sm text-red-600">{upload.error.message}</p>
      )}

      {remove.error && (
        <p className="text-sm text-red-600">{remove.error.message}</p>
      )}

      {upload.isSuccess && (
        <p className="text-sm text-emerald-700">
          Profile picture updated successfully.
        </p>
      )}

      {remove.isSuccess && (
        <p className="text-sm text-emerald-700">
          Profile picture removed successfully.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!selectedFile || upload.isPending || remove.isPending}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {upload.isPending ? "Uploading..." : "Save picture"}
        </button>

        {hasProfileImage && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={upload.isPending || remove.isPending}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {remove.isPending ? "Removing..." : "Remove picture"}
          </button>
        )}
      </div>
    </section>
  );
}
