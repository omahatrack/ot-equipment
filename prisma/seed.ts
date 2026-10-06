// Seed data transcribed from the Millard shop cabinet photo, confirmed with John on 2026-08-26.
// Excludes UTV-7, 019 Mac Dump, Power Pack (removed from fleet).
// SC-7's third (covered) line and CM-5's original hydraulic line were intentionally crossed out on
// the cabinet and are not included. CM-2's second Oil/Fuel lines are confirmed not used.
// Sorter 919 Generator (Kohler) is folded in as additional roles on the Sorter 919 equipment record.
//
// REVISED: Parts are now canonical, keyed by the physical part number — not per equipment/role.
// Where the same number appears on multiple equipment (or multiple roles on the same equipment),
// it is one Part row with multiple EquipmentPart fitments, per the shared-part design.
// Inventory starts at onHand: 0 for every part. Real on-hand counts get entered later as opening
// COUNT transactions once someone physically counts the cabinet — the ledger model shouldn't start
// with a fabricated "1 of everything" assumption.
//
// Open question carried over, not resolved by seed logic: JTV7's outer and inner engine air both
// read "WA10031" on the label. Treated here as the same physical part (one canonical Part, two
// fitments on JTV7) — confirm with John whether that's correct or a labeling error.

import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
const prisma = new PrismaClient();
function hashPassword(password:string){ const salt=crypto.randomBytes(16).toString("hex"); const hash=crypto.pbkdf2Sync(password,salt,120000,32,"sha256").toString("hex"); return `${salt}:${hash}`; }

type Fitment = { equipmentCode: string; role: string };

type PartSeed = {
  number: string; // physical part number — the dedup key
  brand?: string;
  name?: string;
  fitments: Fitment[];
};

const EQUIPMENT_CODES: { code: string; displayName?: string }[] = [
  { code: "FL-3" },
  { code: "H2" },
  { code: "SC-7", displayName: "Sennebogen Material Handler" },
  { code: "CM-1" },
  { code: "Sorter 919", displayName: "Sorter 919 (incl. Kohler generator)" },
  { code: "Saw 430" },
  { code: "M1", displayName: "Rogers Mower (Spartan)" },
  { code: "JTV7" },
  { code: "CM-5", displayName: "Cone Crusher" },
  { code: "L-22" },
  { code: "CM-2", displayName: "Crusher / Plant" },
];

const PARTS: PartSeed[] = [
  { number: "46489", fitments: [{ equipmentCode: "FL-3", role: "Air" }] },
  { number: "46490", fitments: [{ equipmentCode: "FL-3", role: "Air (inner)" }] },
  { number: "33128", fitments: [{ equipmentCode: "FL-3", role: "Fuel" }] },
  { number: "57106", fitments: [{ equipmentCode: "FL-3", role: "Oil" }] },

  { number: "46600", fitments: [{ equipmentCode: "H2", role: "Air (outer)" }] },
  { number: "42924", fitments: [{ equipmentCode: "H2", role: "Air (inner)" }] },
  { number: "33519", fitments: [{ equipmentCode: "H2", role: "Fuel" }] },
  { number: "51768", fitments: [{ equipmentCode: "H2", role: "Oil" }] },

  { number: "49711", fitments: [{ equipmentCode: "SC-7", role: "Air" }] },
  { number: "49710", fitments: [{ equipmentCode: "SC-7", role: "Air (inner)" }] },
  { number: "33732", fitments: [{ equipmentCode: "SC-7", role: "Fuel" }] },
  { number: "57182", fitments: [{ equipmentCode: "SC-7", role: "Oil" }] },

  { number: "42868", fitments: [{ equipmentCode: "CM-1", role: "Air" }] },
  { number: "33073", fitments: [{ equipmentCode: "CM-1", role: "Fuel" }] },
  {
    number: "51133",
    brand: "Wix", // confirmed via CM-2's label; CM-1's copy of the same number inherits it
    fitments: [
      { equipmentCode: "CM-1", role: "Oil" },
      { equipmentCode: "CM-2", role: "Oil" },
    ],
  },

  { number: "46672", fitments: [{ equipmentCode: "Sorter 919", role: "Air" }] },
  { number: "46652", fitments: [{ equipmentCode: "Sorter 919", role: "Air (2nd)" }] },
  {
    number: "51334",
    fitments: [
      { equipmentCode: "Sorter 919", role: "Oil" },
      { equipmentCode: "Sorter 919", role: "Generator Oil" },
    ],
  },
  {
    number: "33394",
    fitments: [
      { equipmentCode: "Sorter 919", role: "Fuel" },
      { equipmentCode: "Sorter 919", role: "Generator Fuel" },
    ],
  },
  {
    number: "33583",
    fitments: [
      { equipmentCode: "Sorter 919", role: "F/S" },
      { equipmentCode: "Sorter 919", role: "Generator Fuel (2nd)" },
    ],
  },

  { number: "46766", fitments: [{ equipmentCode: "Saw 430", role: "Air" }] },
  { number: "46761", fitments: [{ equipmentCode: "Saw 430", role: "Air (2nd)" }] },
  { number: "33977", fitments: [{ equipmentCode: "Saw 430", role: "Fuel" }] },
  { number: "33668", fitments: [{ equipmentCode: "Saw 430", role: "Fuel/Sep" }] },
  { number: "57750S", fitments: [{ equipmentCode: "Saw 430", role: "Oil" }] },

  { number: "33001", brand: "Wix", fitments: [{ equipmentCode: "M1", role: "Fuel" }] },
  { number: "57035", fitments: [{ equipmentCode: "M1", role: "Oil" }] },
  { number: "6206RSTFP", name: "Blade bearing (qty 4)", fitments: [{ equipmentCode: "M1", role: "Blade bearing" }] },
  { number: "42985", brand: "Wix", fitments: [{ equipmentCode: "M1", role: "Air (inner)" }] },
  { number: "46438", brand: "Wix", fitments: [{ equipmentCode: "M1", role: "Air (outer)" }] },

  { number: "33972", fitments: [{ equipmentCode: "JTV7", role: "Inline fuel" }] },
  { number: "51064", fitments: [{ equipmentCode: "JTV7", role: "Engine oil" }] },
  {
    number: "WA10031",
    // OPEN QUESTION: same number for both — confirm not a labeling error before relying on this.
    fitments: [
      { equipmentCode: "JTV7", role: "Outer engine air" },
      { equipmentCode: "JTV7", role: "Inner engine air" },
    ],
  },
  { number: "51367", fitments: [{ equipmentCode: "JTV7", role: "Hydraulic" }] },
  { number: "WL10013", fitments: [{ equipmentCode: "JTV7", role: "HST" }] },

  { number: "546568", fitments: [{ equipmentCode: "CM-5", role: "Air" }] },
  { number: "42648", fitments: [{ equipmentCode: "CM-5", role: "Air (2nd)" }] },
  { number: "51607", fitments: [{ equipmentCode: "CM-5", role: "Oil" }] },
  { number: "B3358", fitments: [{ equipmentCode: "CM-5", role: "Fuel" }] },

  { number: "600-185-4100", fitments: [{ equipmentCode: "L-22", role: "Air" }] },
  { number: "600-311-3750", fitments: [{ equipmentCode: "L-22", role: "Fuel" }] },
  { number: "600-311-3620", fitments: [{ equipmentCode: "L-22", role: "Fuel (2nd)" }] },
  { number: "6736-51-5142", fitments: [{ equipmentCode: "L-22", role: "Oil" }] },

  { number: "51551", brand: "Wix", fitments: [{ equipmentCode: "CM-2", role: "Hydraulic" }] },
  { number: "33122", brand: "Wix", fitments: [{ equipmentCode: "CM-2", role: "Fuel" }] },
  { number: "42610", brand: "Wix", fitments: [{ equipmentCode: "CM-2", role: "Air" }] },
];

const GENERAL_NOTES: { title: string; body: string }[] = [
  { title: "Fuel tank", body: "Wix 24066" },
  { title: "SC7 Gen Belt", body: "Sennebogen pt# 135294 — possibly belongs to SC-7's generator, unconfirmed" },
  { title: "PP19/PP11 Hyd", body: "Hyd LIT-752-10P-OR (Lenz) — hydraulic fluid spec, exact reading unconfirmed" },
  { title: "Honda engine spec", body: "15400-PLM-A02PE — Mobil 5W30 full synthetic, 2.5 qt — equipment unclear" },
  { title: "9A Sorter belt lengths", body: "Discharge 38ft, Main 66ft, Hopper 16ft 2in" },
  { title: "Cabinet tag 1208", body: "Unclear meaning — equipment #, bin #? Left for John to clarify" },
];

async function main() {
  const location = await prisma.location.upsert({
    where: { name: "Millard" },
    update: {},
    create: { name: "Millard" },
  });

  const adminRole = await prisma.role.upsert({ where:{name:"Admin"}, update:{}, create:{name:"Admin"} });
  const mechanicRole = await prisma.role.upsert({ where:{name:"Mechanic"}, update:{}, create:{name:"Mechanic"} });
  const scaleRole = await prisma.role.upsert({ where:{name:"Scale House"}, update:{}, create:{name:"Scale House"} });

  const userSeeds = [
    { name:"John", username:"john", password:"ChangeMe-John!", roleId:adminRole.id },
    { name:"Ray", username:"ray", password:"ChangeMe-Ray!", roleId:mechanicRole.id },
    { name:"Scale House", username:"scalehouse", password:"ChangeMe-Scale!", roleId:scaleRole.id },
  ];
  for (const u of userSeeds) {
    const exists = await prisma.user.findUnique({ where:{username:u.username} });
    if (!exists) await prisma.user.create({data:{name:u.name,username:u.username,passwordHash:hashPassword(u.password),roleId:u.roleId,locationId:location.id}});
  }

  for (const vendorName of ["NAPA","FleetPride","Grainger"]) {
    await prisma.vendor.upsert({where:{name:vendorName},update:{},create:{name:vendorName}});
  }

  const equipmentIdByCode = new Map<string, number>();
  for (const eq of EQUIPMENT_CODES) {
    const equipment = await prisma.equipment.upsert({
      where: { code: eq.code },
      update: {},
      create: {
        code: eq.code,
        displayName: eq.displayName,
        locationId: location.id,
        qrCode: `EQ-${eq.code.replace(/\s+/g, "-").toUpperCase()}`,
      },
    });
    equipmentIdByCode.set(eq.code, equipment.id);
  }

  for (const p of PARTS) {
    // canonical part keyed by the real physical number, NOT by equipment/role
    const part = await prisma.part.upsert({
      where: { internalPartNumber: p.number },
      update: {},
      create: {
        name: p.name ?? (p.brand ? `${p.brand} ${p.number}` : p.number),
        internalPartNumber: p.number,
      },
    });

    await prisma.partCrossReference.upsert({
      where: { partId_number: { partId: part.id, number: p.number } },
      update: {},
      create: {
        partId: part.id,
        number: p.number,
        brand: p.brand,
        type: p.brand ? "aftermarket" : "OEM",
        isPreferred: true,
      },
    });

    for (const f of p.fitments) {
      const equipmentId = equipmentIdByCode.get(f.equipmentCode);
      if (!equipmentId) throw new Error(`Unknown equipment code: ${f.equipmentCode}`);

      await prisma.equipmentPart.upsert({
        where: {
          equipmentId_partId_partRole: {
            equipmentId,
            partId: part.id,
            partRole: f.role,
          },
        },
        update: {},
        create: { equipmentId, partId: part.id, partRole: f.role },
      });
    }

    // Inventory starts at 0 — real on-hand counts get entered as opening COUNT
    // transactions once the cabinet is physically counted, not assumed here.
    await prisma.partLocationInventory.upsert({
      where: { partId_locationId: { partId: part.id, locationId: location.id } },
      update: {},
      create: {
        partId: part.id,
        locationId: location.id,
        onHand: 0,
        keepOnHand: 1,
        reorderWhenBelow: 1,
        status: "pending_count",
      },
    });
  }

  for (const note of GENERAL_NOTES) {
    const exists = await prisma.note.findFirst({ where: { title: note.title, body: note.body } });
    if (!exists) await prisma.note.create({ data: note });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
