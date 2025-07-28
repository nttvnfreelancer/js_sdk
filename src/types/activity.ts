export interface ActivityWindow extends Window {
  rdnActivityParams?: RDNActivityParams;
}

export interface Item {
  item_id: string;
  qty: number;
  price: number;
}

export interface RDNActivityParams {
  code: string;
  rz?: string;
  idfa?: string;
  adid?: string;
  keys?: string[];
  transaction_id?: string;
  revenue?: number;
  only_logging?: boolean;
  email?: string;
  easy_id?: string;
  hashed_easy_id?: string;
  hashed_email?: string;
  category_id?: string;
  keyword?: string;
  items?: Item[];
}
