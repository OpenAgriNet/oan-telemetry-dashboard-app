import { useState } from "react";

// A new date range or API scope starts at page one on its first render.
export function useScopedPage(scope: string) {
  const [state, setState] = useState({ scope, page: 1 });
  if (state.scope !== scope) setState({ scope, page: 1 });
  const page = state.scope === scope ? state.page : 1;
  const setPage = (next: number) => setState({ scope, page: next });
  return [page, setPage] as const;
}
