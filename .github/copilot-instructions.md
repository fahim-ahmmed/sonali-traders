# Shared database-backed entity lists

Product, category, staff, customer, and supplier lists or dropdowns must always be loaded from the database through the shared API or reusable component. Never hardcode these entities, brands, or categories in application UI or business logic. Product pickers should use `src/components/shared/ProductSelect.jsx` and the product lookup API.
