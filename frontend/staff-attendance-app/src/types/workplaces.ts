export type Workplace = {
  id: number;
  name: string;
  active: boolean;
};

export type WorkplaceCreateInput = { name: string };

// Both optional: PATCH changes only the fields we send
export type WorkplaceUpdateInput = { name?: string; active?: boolean };

export type QrToken = {
  token: string;
  expires_in_seconds: number;
};