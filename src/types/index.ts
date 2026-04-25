export interface Carrier {
  id: string;
  icon: string;
  icon_style: string;
  title: string;
  description: string;
  forms: string;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: number;
  carrier_id: string;
  name: string;
  monthly: number;
  base_fee: number;
  discount: number;
  voice: string;
  sms: string;
  data: string;
  qos: string;
  type: "postpaid" | "prepaid";
  is_active: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
