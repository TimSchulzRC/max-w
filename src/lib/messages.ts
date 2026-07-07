export type RunReason =
  | "applied-auto"
  | "applied-manual"
  | "already-contained"
  | "no-candidate"
  | "disabled";

export interface RunResult {
  applied: boolean;
  reason: RunReason;
  element?: string | null;
  maxWidth?: number;
}

export type Message =
  | { type: "GET_STATE" }
  | { type: "SET_ENABLED"; enabled: boolean }
  | { type: "SET_MAX_WIDTH"; maxWidth: number }
  | { type: "START_PICKER" }
  | { type: "RESET_SITE" };

export interface StateResponse {
  host: string;
  enabled: boolean;
  maxWidth: number;
  selector: string | null;
  hasOverride: boolean;
  defaultMaxWidth: number;
  last: RunResult | null;
}

export interface ActionResponse {
  ok: boolean;
  last?: RunResult | null;
}
