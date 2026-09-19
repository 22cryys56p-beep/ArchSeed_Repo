export type Outcome<Details = unknown> =
  | { status: "success"; details?: Details }
  | { status: "noop"; details?: Details }
  | { status: "invalid"; details?: Details }
  | { status: "failure"; details?: Details };
