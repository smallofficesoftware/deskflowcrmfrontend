// "Copy" on the entries list: a saved entry's answers become the starting answers of a NEW entry.
//
// answersFromItem (SubmissionDetailView.tsx) already leaves out what can't be copied - calculations (worked out
// again), file / image / signature uploads and auto-numbers (the server gives the new entry its own). The one thing
// left is the ids of repeater rows, which belong to the old entry: they are dropped so the rows are saved as new rows.
// Dates and everything else are kept as they were.
export function withoutRowIds(answers: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  Object.entries(answers).forEach(([key, value]) => {
    out[key] = Array.isArray(value)
      ? value.map((row) => {
          if (!row || typeof row !== "object" || Array.isArray(row)) return row;
          const { id, ...rest } = row as Record<string, any>;
          void id;
          return rest;
        })
      : value;
  });
  return out;
}
