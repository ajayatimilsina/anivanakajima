export const MENU_LABELS = [
  { id: "recommended", name: "おすすめ" },
  { id: "manager", name: "店長のおすすめ" },
  { id: "new", name: "NEW" }
];

export function renderMenuLabels(labels) {
  return MENU_LABELS.filter((label) => Array.isArray(labels) && labels.includes(label.id))
    .map((label) => `<span class="menu-label menu-label-${label.id}">${label.name}</span>`).join("");
}
