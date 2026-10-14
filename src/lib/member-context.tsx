import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Member } from "./domain";

const KEY = "lpgb.member";
interface Ctx {
  member: Member | null;
  ready: boolean;
  setMember: (m: Member) => void;
}
const MemberCtx = createContext<Ctx>({ member: null, ready: false, setMember: () => {} });

export function MemberProvider({ children }: { children: ReactNode }) {
  const [member, setState] = useState<Member | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const v = localStorage.getItem(KEY);
    if (v === "thong" || v === "thuan") setState(v);
    setReady(true);
  }, []);
  const setMember = (m: Member) => {
    localStorage.setItem(KEY, m);
    setState(m);
  };
  return <MemberCtx.Provider value={{ member, ready, setMember }}>{children}</MemberCtx.Provider>;
}

export const useMemberState = () => useContext(MemberCtx);
/** Only use inside the app shell, where a member is guaranteed. */
export function useMember(): Member {
  const { member } = useContext(MemberCtx);
  return member ?? "thong";
}
