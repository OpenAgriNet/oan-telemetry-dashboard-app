import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function useDateScopedPage(scope: string | null) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [previousScope, setPreviousScope] = useState(scope);
  const dateChanged = scope !== null && previousScope !== null && scope !== previousScope;

  // Use page one immediately, before the URL update, so the new dates never
  // request the previous range's page. Keep deep links on initial date loading.
  const page = dateChanged ? 1 : parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    if (scope === null || scope === previousScope) return;
    if (dateChanged) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set("page", "1");
        return next;
      }, { replace: true });
    }
    setPreviousScope(scope);
  }, [scope, previousScope, dateChanged, setSearchParams]);

  return { page, searchParams, setSearchParams };
}
