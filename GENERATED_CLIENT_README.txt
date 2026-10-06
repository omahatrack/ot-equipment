WHY THIS PACKAGE EXISTS

GoDaddy must never run Prisma CLI for this build. Prisma 6.16.x can still fetch a native schema-engine during `prisma generate`, even when runtime uses engineType="client".

Run PREPARE_GODADDY_DEPLOY.bat on a Windows PC with Node 22 LTS. It will:
1. npm install locally
2. run prisma generate locally
3. verify the exact generated client entrypoint
4. run tests
5. run the same plain `next build` that GoDaddy will run
6. create OT_Equipment_GoDaddy_Deploy_v3.zip

Upload the generated OT_Equipment_GoDaddy_Deploy_v3.zip to GoDaddy, NOT this generator package.
