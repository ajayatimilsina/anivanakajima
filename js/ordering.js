export function ensureCustomerSession(state, table, sessionId, startedAt = Date.now()) {
  state.sessions ||= [];
  const activeSessions = state.sessions.filter((entry) => entry.table === table && entry.status === "Active");
  const openOrders = state.orders.filter((order) => order.table === table && !order.paid);
  const sessionForOpenOrder = activeSessions.find((entry) =>
    typeof entry.sessionId === "string" && entry.sessionId
    && openOrders.some((order) => order.sessionId === entry.sessionId));
  const current = sessionForOpenOrder || activeSessions.find((entry) =>
    typeof entry.sessionId === "string" && entry.sessionId);
  const session = current || {
    table,
    sessionId: openOrders.find((order) => typeof order.sessionId === "string" && order.sessionId)?.sessionId || sessionId,
    status: "Active",
    startedAt: openOrders.find((order) => order.sessionStartedAt)?.sessionStartedAt || startedAt
  };
  if (!current) state.sessions.push(session);

  for (const duplicate of activeSessions) {
    if (duplicate !== session) {
      duplicate.status = "Completed";
      duplicate.completedAt ||= new Date(startedAt).toISOString();
    }
  }
  openOrders.forEach((order) => { order.sessionId = session.sessionId; });
  return session;
}
