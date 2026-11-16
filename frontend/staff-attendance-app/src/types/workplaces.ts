export type Workplace = {
  id: number;
  name: string;
  active: boolean;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number;
  require_location_verification: boolean;
};

export type WorkplaceCreateInput = {
  name: string;
  latitude?: number | null;
  longitude?: number | null;
  geofence_radius_m?: number;
  require_location_verification?: boolean;
};

export type WorkplaceUpdateInput = {
  name?: string;
  active?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  geofence_radius_m?: number;
  require_location_verification?: boolean;
};

export type QrToken = {
  token: string;
  expires_in_seconds: number;
};