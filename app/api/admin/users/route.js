import {NextResponse} from 'next/server';
import {prisma} from '../../../../lib/prisma';
import {sql} from '../../../../lib/db';
import {requireApiUser} from '../../../../lib/apiAuth';
import {hashPassword} from '../../../../lib/auth';
import {redirectTo} from '../../../../lib/http';

export async function POST(req){
  const a=await requireApiUser(['Admin']);
  if(a.error)return NextResponse.json({error:a.error},{status:a.status});
  const f=await req.formData();
  const name=String(f.get('name')||'').trim();
  const username=String(f.get('username')||'').trim().toLowerCase();
  const email=String(f.get('email')||'').trim().toLowerCase();
  const password=String(f.get('password')||'');
  const locationId=Number(f.get('locationId'));
  const roleId=Number(f.get('roleId'));
  if(!name||!username||!email||password.length<8||!locationId||!roleId)return NextResponse.json({error:'Name, username, email, 8+ character password, location and role are required.'},{status:400});

  const access=(a.user.accessibleLocations||[]).find(x=>x.id===locationId&&x.roleName==='Admin');
  if(!access)return NextResponse.json({error:'You can only create users for a location where you are Admin.'},{status:403});
  const existing=await sql('SELECT id FROM User WHERE LOWER(email)=? LIMIT 1',[email]);
  if(existing.length)return NextResponse.json({error:'Email address already belongs to another user.'},{status:400});

  try{
    const user=await prisma.user.create({data:{name,username,passwordHash:hashPassword(password),roleId,locationId}});
    await sql('UPDATE User SET email=?,passwordChangedAt=NOW(3) WHERE id=?',[email,user.id]);
    await sql('INSERT INTO UserAccessSettings(userId,isActive) VALUES (?,TRUE) ON DUPLICATE KEY UPDATE isActive=TRUE',[user.id]);

    const roleRows=await sql('SELECT name FROM Role WHERE id=? LIMIT 1',[roleId]);
    if(roleRows[0]?.name==='Admin'){
      // Global Admin accounts automatically receive Admin rights at every location.
      await sql(`
        INSERT INTO UserLocationAccess(userId,locationId,roleId,isActive)
        SELECT ?, l.id, ?, TRUE FROM Location l
        ON DUPLICATE KEY UPDATE roleId=VALUES(roleId),isActive=TRUE
      `,[user.id,roleId]);
    }else{
      await sql('INSERT INTO UserLocationAccess(userId,locationId,roleId,isActive) VALUES (?,?,?,TRUE) ON DUPLICATE KEY UPDATE roleId=VALUES(roleId),isActive=TRUE',[user.id,locationId,roleId]);
    }
    return redirectTo('/admin/users');
  }catch(e){
    return NextResponse.json({error:e?.code==='P2002'?'Username already exists.':e.message},{status:400});
  }
}
