export interface Carrier {
  id: string;
  icon: string;
  icon_style: string;
  title: string;
  description: string;
  forms: string;
  sort_order: number;
  parent_id: string | null;
  payment_type: "postpaid" | "prepaid" | "both";
  form_config: string | null;
  form_version: string | null;
  form_template: string | null;
  form_fields: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
  children?: Carrier[];
}

export interface FormFieldConfig {
  key: string;
  label: string;
  type: "text" | "phone" | "date" | "select" | "address";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface Notice {
  id: number;
  title: string;
  content: string;
  is_pinned: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Inquiry {
  id: number;
  name: string;
  phone: string;
  email: string;
  title: string;
  content: string;
  reply: string | null;
  replied_at: string | null;
  is_active: number;
  created_at: string;
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

export interface Application {
  id: number;
  carrier_id: string;
  carrier_name: string;
  plan_name: string;
  plan_monthly: number;
  usim_serial: string;
  customer_type: string;
  contact_number: string;
  subscriber_name: string;
  birth_date: string;
  id_number: string;
  nationality: string;
  address: string;
  address_detail: string;
  activation_type: string;
  desired_number: string;
  store_name: string;
  payment_type: string;
  created_at: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
