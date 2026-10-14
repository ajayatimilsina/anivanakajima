export const BUSINESS_HOURS_LABEL = "平日 11:00〜15:00 / 土日 11:00〜23:00（日本時間）";

const businessClock = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tokyo", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
});

export function getBusinessHoursStatus(now = Date.now()) {
  const parts = Object.fromEntries(businessClock.formatToParts(now).map(({ type, value }) => [type, value]));
  const weekend = parts.weekday === "Sat" || parts.weekday === "Sun";
  const closingHour = weekend ? 23 : 15;
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  return { open: minutes >= 11 * 60 && minutes < closingHour * 60, closingHour };
}

export function ensureCustomerSession(state, table, sessionId, startedAt = Date.now()) {
  state.sessions ||= [];
  const current = state.sessions.find((session) => session.table === table && session.status === "Active");
  if (current && typeof current.sessionId === "string" && current.sessionId) {
    return current;
  }

  const openOrder = state.orders.find((order) => order.table === table && !order.paid && order.sessionId);
  const session = {
    table,
    sessionId: openOrder?.sessionId || sessionId,
    status: "Active",
    startedAt: openOrder?.sessionStartedAt || startedAt
  };
  state.sessions.push(session);
  state.orders
    .filter((order) => order.table === table && !order.paid)
    .forEach((order) => { order.sessionId = session.sessionId; });
  return session;
}
