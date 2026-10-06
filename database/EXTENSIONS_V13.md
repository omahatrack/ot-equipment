# v13 extension tables

`002_core_modules.sql` intentionally adds `EquipmentPhoto`, `UserAccessSettings`, `UserLocationAccess`, and `VendorPriceHistory` outside the generated Prisma client. The deployed Prisma client is pre-generated and GoDaddy does not run the Prisma CLI. These extension tables are accessed through `lib/db.js` with the same managed MySQL credentials.

This keeps GoDaddy deployment free of Prisma schema-engine downloads while allowing the v13 modules to persist new data. If the Prisma schema is regenerated in a future development environment, these tables should be promoted into the canonical Prisma schema at that time.
