export type Workplace = {
  id: number;
  name: string;
  active: boolean;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number;
  require_location_verification: boolean;
  address: string | null
};

export type WorkplaceCreateInput = {
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  geofence_radius_m?: number;
  require_location_verification?: boolean;
  address?: string | null
};

export type WorkplaceUpdateInput = {
  name?: string;
  active?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  geofence_radius_m?: number;
  require_location_verification?: boolean;
  address?: string | null
};

export type QrToken = {
  token: string;
  expires_in_seconds: number;
};


export type AddressSuggestion = {
  id: string;
  formatted: string;
  address_line1: string | null;
  address_line2: string | null;
  latitude: number;
  longitude: number;
};

export type AddressSearchResponse = {
  suggestions: AddressSuggestion[];
};