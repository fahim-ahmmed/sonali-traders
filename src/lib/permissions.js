// পারমিশন কী (মাস্টার প্ল্যান বিভাগ ৯)
export const STAFF_PERMISSIONS = [
  { key: "pos", label: "POS", group: "Sales" },
  { key: "purchase", label: "Purchase", group: "Inventory" },
  { key: "supplier", label: "Supplier", group: "Inventory" },
  { key: "product", label: "Product", group: "Inventory" },
  { key: "customer_list", label: "Customer List", group: "People" },
  { key: "expenses", label: "Expenses", group: "People" },
];

export function parsePermissions(raw) {
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw || "[]"); } catch { return []; }
}

// Admin সবকিছু পায়; Staff শুধু অনুমোদিত কী
export function can(user, key) {
  if (!user || user.active === false) return false;
  if (user.role === "admin") return true;
  if (key === "admin") return false; // admin-only
  return parsePermissions(user.permissions).includes(key);
}

// সাইডবার মেনু — ভিডিওর ক্রম অনুযায়ী
export const MENU = [
  { label: "POS", href: "/pos", icon: "ShoppingCart", perm: "pos", shortcut: true },
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", perm: "admin" },
  { label: "Product", icon: "Package", perm: "product", children: [
    { label: "Add Product", href: "/products/create" },
    { label: "Add Category", href: "/products/categories/create" },
    { label: "Product List", href: "/products" },
  ]},
  { label: "Purchase", icon: "ArrowDownToLine", perm: "purchase", children: [
    { label: "New Purchase", href: "/purchases/create" },
    { label: "Purchase List", href: "/purchases" },
  ]},
  { label: "Supplier", icon: "Truck", perm: "supplier", children: [
    { label: "Add Supplier", href: "/suppliers/create" },
    { label: "Supplier List", href: "/suppliers" },
  ]},
  { label: "Customer", icon: "Users", perm: "customer_list", children: [
    { label: "Add Customer", href: "/customers/create" },
    { label: "Customer List", href: "/customers" },
    { label: "Due Customer", href: "/customers?due=1" },
  ]},
  { label: "Staff", icon: "UserCog", perm: "admin", children: [
    { label: "Add New Staff", href: "/staff/create" },
    { label: "Staff List", href: "/staff" },
  ]},
  { label: "Settings", icon: "Settings", perm: "admin", children: [
    { label: "General Settings", href: "/settings/general" },
    { label: "Role Permission", href: "/settings/roles" },
  ]},
  { label: "Report", icon: "BarChart3", perm: "admin", children: [
    { label: "Day Wise Report", href: "/reports/day-wise" },
    { label: "Month Wise Report", href: "/reports/month-wise" },
    { label: "Manual Report", href: "/reports/manual" },
  ]},
  { label: "Approval Section", href: "/approvals", icon: "CheckCircle2", perm: "admin", badge: "pending" },
  { label: "Subscription", href: "/subscription", icon: "BadgeCheck", perm: "admin" },
  { label: "Accounts", href: "/accounts", icon: "Landmark", perm: "admin" },
  { label: "Expenses", href: "/expenses", icon: "Receipt", perm: "expenses" },
];
