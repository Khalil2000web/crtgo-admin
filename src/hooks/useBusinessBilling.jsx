import { useQuery } from "@tanstack/react-query";

import { loadBusinessBilling } from "../lib/billing";

export function useBusinessBilling(businessId) {
  return useQuery({
    queryKey: ["business-billing", businessId],
    queryFn: () => loadBusinessBilling(businessId),
    enabled: Boolean(businessId),
  });
}