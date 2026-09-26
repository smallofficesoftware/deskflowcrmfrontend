import { useCallback, useEffect, useState } from "react";
import { ICustomList, listCustomLists } from "../FormBuilderController";

// Loads the company's custom lists (Division, Department ...) once for the
// component using it; `reload` refreshes after the manager changes them.
export function useCustomLists() {
  const [lists, setLists] = useState<ICustomList[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const res = await listCustomLists();
    if (res?.ack === 1) setLists(res.data?.items || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { lists, loading, reload, setLists };
}
