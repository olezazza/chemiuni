export type Proposal = {
  id: string;
  action: "add" | "remove" | "replace";
  targetId: string | null;
  programId: string | null;
  reason: string;
  status: "pending" | "accepted" | "rejected" | "stale";
  notice?: string;
};
export type CounselorMessage = {
  id: string;
  role: "user" | "assistant";
  parts: { type: "text"; text: string }[];
  proposals: Proposal[];
};
export type CounselorState = { messages: CounselorMessage[] };
