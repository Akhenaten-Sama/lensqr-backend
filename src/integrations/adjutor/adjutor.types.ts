export interface KarmaIdentity {
  karma_identity: string;
  total_amount_loaned: string | null;
  total_amount_repaid: string | null;
  karma_type: {
    karma: string;
  } | null;
  karma_date: string | null;
  reporting_entity: {
    name: string;
    email: string;
  } | null;
}

export interface KarmaLookupResponse {
  status: string;
  message: string;
  data: KarmaIdentity | null;
}
