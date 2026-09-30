export type TCalcDrives = "qty" | "amount" | null;

export interface ICalcConfig {
  expr: string;
  drives: TCalcDrives;
}

export interface ICalcField {
  reference_column_name: string;
  calc_config?: string | null;
}

// Built-in names a formula may reference besides other row fields.
export const FORMULA_BUILTINS = ["rate", "quantity"];

export const parseCalcConfig = (
  raw: string | null | undefined,
): ICalcConfig | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.expr !== "string" || !parsed.expr.trim()) {
      return null;
    }
    const drives = parsed.drives === "qty" || parsed.drives === "amount" ? parsed.drives : null;
    return { expr: parsed.expr.trim(), drives };
  } catch {
    return null;
  }
};

export const extractFormulaRefs = (expr: string): string[] => {
  const refs: string[] = [];
  const re = /\{([^{}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(expr)) !== null) refs.push(m[1].trim());
  return refs;
};

// Rewrites every {name} using the map (keys compared case-insensitively); unknown names are kept.
export const translateFormulaRefs = (
  expr: string,
  map: Record<string, string>,
): string =>
  expr.replace(/\{([^{}]+)\}/g, (_m, name: string) => {
    const key = name.trim();
    const mapped = map[key] ?? map[key.toLowerCase()];
    return `{${mapped !== undefined ? mapped : key}}`;
  });

type Token =
  | { t: "num"; v: number }
  | { t: "ref"; v: string }
  | { t: "id"; v: string }
  | { t: "op"; v: string };

const tokenize = (expr: string): Token[] | null => {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (/\s/.test(c)) {
      i++;
    } else if (/[0-9.]/.test(c)) {
      const m = /^\d*\.?\d+|^\d+\.?/.exec(expr.slice(i));
      if (!m) return null;
      tokens.push({ t: "num", v: Number(m[0]) });
      i += m[0].length;
    } else if (c === "{") {
      const end = expr.indexOf("}", i);
      if (end === -1) return null;
      tokens.push({ t: "ref", v: expr.slice(i + 1, end).trim() });
      i = end + 1;
    } else if (/[a-z]/i.test(c)) {
      const m = /^[a-z]+/i.exec(expr.slice(i));
      if (!m) return null;
      tokens.push({ t: "id", v: m[0].toLowerCase() });
      i += m[0].length;
    } else if ("+-*/(),".includes(c)) {
      tokens.push({ t: "op", v: c });
      i++;
    } else {
      return null;
    }
  }
  return tokens;
};

const FUNCS: Record<string, (args: number[]) => number> = {
  round: (a) => {
    const digits = a.length > 1 ? a[1] : 0;
    const f = Math.pow(10, digits);
    return Math.round(a[0] * f) / f;
  },
  min: (a) => Math.min(...a),
  max: (a) => Math.max(...a),
  abs: (a) => Math.abs(a[0]),
};

// Returns null on any syntax error, unknown name, or non-finite result.
export const evaluateFormula = (
  expr: string,
  scope: Record<string, number>,
): number | null => {
  const tokens = tokenize(expr);
  if (!tokens || tokens.length === 0) return null;

  let pos = 0;
  let failed = false;
  const fail = (): number => {
    failed = true;
    return NaN;
  };
  const peek = () => tokens[pos];
  const isOp = (v: string) => {
    const tk = peek();
    return !!tk && tk.t === "op" && tk.v === v;
  };

  const parseExpr = (): number => {
    let left = parseTerm();
    while (isOp("+") || isOp("-")) {
      const op = (tokens[pos++] as { v: string }).v;
      const right = parseTerm();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  };

  const parseTerm = (): number => {
    let left = parseUnary();
    while (isOp("*") || isOp("/")) {
      const op = (tokens[pos++] as { v: string }).v;
      const right = parseUnary();
      if (op === "/" && right === 0) return fail();
      left = op === "*" ? left * right : left / right;
    }
    return left;
  };

  const parseUnary = (): number => {
    if (isOp("-")) {
      pos++;
      return -parseUnary();
    }
    if (isOp("+")) {
      pos++;
      return parseUnary();
    }
    return parsePrimary();
  };

  const parsePrimary = (): number => {
    const tk = tokens[pos++];
    if (!tk) return fail();
    if (tk.t === "num") return tk.v;
    if (tk.t === "ref") {
      const v = scope[tk.v];
      return typeof v === "number" && isFinite(v) ? v : fail();
    }
    if (tk.t === "op" && tk.v === "(") {
      const v = parseExpr();
      if (!isOp(")")) return fail();
      pos++;
      return v;
    }
    if (tk.t === "id") {
      const fn = FUNCS[tk.v];
      if (!fn || !isOp("(")) return fail();
      pos++;
      const args: number[] = [];
      if (!isOp(")")) {
        args.push(parseExpr());
        while (isOp(",")) {
          pos++;
          args.push(parseExpr());
        }
      }
      if (!isOp(")")) return fail();
      pos++;
      return args.length ? fn(args) : fail();
    }
    return fail();
  };

  const result = parseExpr();
  if (failed || pos !== tokens.length || !isFinite(result)) return null;
  return result;
};

// Validation used by the setup screen: returns an error message or "" when fine.
export const validateFormula = (
  expr: string,
  drives: TCalcDrives,
  availableRefs: string[],
): string => {
  if (!expr.trim()) return "Formula is required";
  const refs = extractFormulaRefs(expr);
  const allowed = [...availableRefs, ...FORMULA_BUILTINS];
  const unknown = refs.find((r) => !allowed.includes(r));
  if (unknown) return `Unknown field {${unknown}}`;
  if (drives === "qty" && refs.includes("quantity")) {
    return "A quantity formula cannot use {quantity}";
  }
  const scope: Record<string, number> = {};
  allowed.forEach((r) => (scope[r] = 1));
  if (evaluateFormula(expr, scope) === null) return "Formula is not valid";
  return "";
};

export interface IRowFormulaResult {
  values: Record<string, number>;
  qty?: number;
  amount?: number;
  hasQtyFormula: boolean;
  hasAmountFormula: boolean;
}

// Evaluates every formula field of one order row in dependency order.
// A formula whose inputs are missing or cyclic is skipped (left blank).
export const computeRowFormulas = (
  row: Record<string, any>,
  fields: ICalcField[],
): IRowFormulaResult => {
  const calcFields = fields
    .map((f) => ({ ref: f.reference_column_name, cfg: parseCalcConfig(f.calc_config) }))
    .filter((f): f is { ref: string; cfg: ICalcConfig } => !!f.cfg);

  const result: IRowFormulaResult = {
    values: {},
    hasQtyFormula: calcFields.some((f) => f.cfg.drives === "qty"),
    hasAmountFormula: calcFields.some((f) => f.cfg.drives === "amount"),
  };
  if (calcFields.length === 0) return result;

  const calcRefs = new Set(calcFields.map((f) => f.ref));
  const scope: Record<string, number> = {};
  const numeric = (v: any) => (v === "" || v === null || v === undefined ? 0 : Number(v));

  // plain number inputs come straight from the row; formula outputs are filled as they resolve
  Object.keys(row).forEach((k) => {
    if (k.startsWith("products_column_") && !calcRefs.has(k)) scope[k] = numeric(row[k]);
  });
  scope.rate = numeric(row.rate);
  scope.quantity = numeric(row.quantity);

  const pending = calcFields.slice();
  const qtyDrivers = pending.filter((f) => f.cfg.drives === "qty");
  const usesQuantity = (f: { cfg: ICalcConfig }) => extractFormulaRefs(f.cfg.expr).includes("quantity");
  const resolved = new Set<string>();

  // a formula that reads {quantity} waits until the quantity formula (if any) has run
  let progress = true;
  while (pending.length && progress) {
    progress = false;
    for (let i = 0; i < pending.length; i++) {
      const f = pending[i];
      const refs = extractFormulaRefs(f.cfg.expr);
      const waitingOnField = refs.some((r) => calcRefs.has(r) && !resolved.has(r));
      const waitingOnQty =
        usesQuantity(f) &&
        f.cfg.drives !== "qty" &&
        qtyDrivers.some((q) => !resolved.has(q.ref));
      if (waitingOnField || waitingOnQty) continue;

      const value = evaluateFormula(f.cfg.expr, scope);
      if (value !== null) {
        scope[f.ref] = value;
        result.values[f.ref] = value;
        if (f.cfg.drives === "qty") {
          result.qty = value;
          scope.quantity = value;
        } else if (f.cfg.drives === "amount") {
          result.amount = value;
        }
      }
      resolved.add(f.ref);
      pending.splice(i, 1);
      i--;
      progress = true;
    }
  }
  return result;
};
