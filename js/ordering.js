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
