import {NextResponse} from 'next/server';
import {prisma} from '../../../../lib/prisma';
import {sql} from '../../../../lib/db';
import {requireApiUser} from '../../../../lib/apiAuth';
import {redirectTo} from '../../../../lib/http';

export async function POST(req){
  const a=await requireApiUser(['Admin']);
  if(a.error)return NextResponse.json({error:a.error},{status:a.status});
  const f=await req.formData();
  const name=String(f.get('name')||'').trim();
  if(!name)return NextResponse.json({error:'Location name required.'},{status:400});

  const loc=await prisma.location.upsert({where:{name},update:{},create:{name}});
  const adminRole=await prisma.role.findUnique({where:{name:'Admin'}});
  if(!adminRole)return NextResponse.json({error:'Admin role is missing.'},{status:500});

  // Global Admin users should always have Admin access to every location.
  // This keeps administrative access synchronized when a new yard/location is created.
  await sql(`
    INSERT INTO UserLocationAccess(userId,locationId,roleId,isActive)
    SELECT u.id, ?, ?, TRUE
    FROM User u
    JOIN Role r ON r.id=u.roleId
    WHERE r.name='Admin'
    ON DUPLICATE KEY UPDATE roleId=VALUES(roleId),isActive=TRUE
  `,[loc.id,adminRole.id]);

  return redirectTo('/admin/users');
}
