import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { sql } from './db';
import { verifySession } from './auth';
const COOKIE='ot_session';
const LOCATION_COOKIE='ot_location';
export function getSessionPayload(){
  const secret=process.env.SESSION_SECRET;
  if(!secret) throw new Error('SESSION_SECRET is required');
  return verifySession(cookies().get(COOKIE)?.value, secret);
}
export async function getCurrentUser(){
  const p=getSessionPayload();
  if(!p?.userId) return null;
  const base=await prisma.user.findUnique({where:{id:p.userId},include:{role:true,location:true}});
  if(!base) return null;
  let settings=[]; let accesses=[];
  try{
    settings=await sql('SELECT isActive FROM UserAccessSettings WHERE userId=? LIMIT 1',[base.id]);
    if(settings.length && !settings[0].isActive) return null;
    accesses=await sql(`SELECT ula.locationId, ula.roleId, l.name AS locationName, r.name AS roleName
      FROM UserLocationAccess ula JOIN Location l ON l.id=ula.locationId JOIN Role r ON r.id=ula.roleId
      WHERE ula.userId=? AND ula.isActive=TRUE ORDER BY l.name`,[base.id]);
  }catch{
    // Migration may not exist during first startup request; preserve legacy single-location behavior.
  }
  if(!accesses.length && base.locationId){
    accesses=[{locationId:base.locationId,roleId:base.roleId,locationName:base.location?.name||'Location',roleName:base.role.name}];
  }
  const requested=Number(cookies().get(LOCATION_COOKIE)?.value||base.locationId||0);
  const selected=accesses.find(a=>Number(a.locationId)===requested)||accesses[0]||null;
  if(!selected && base.role.name!=='Admin') return null;
  return {
    ...base,
    locationId:selected?Number(selected.locationId):base.locationId,
    location:selected?{id:Number(selected.locationId),name:selected.locationName}:base.location,
    role:selected?{id:Number(selected.roleId),name:selected.roleName}:base.role,
    accessibleLocations:accesses.map(a=>({id:Number(a.locationId),name:a.locationName,roleId:Number(a.roleId),roleName:a.roleName}))
  };
}
export function setSessionCookie(token){cookies().set(COOKIE,token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*14})}
export function setLocationCookie(locationId){cookies().set(LOCATION_COOKIE,String(locationId),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60*24*30})}
export function clearSessionCookie(){cookies().delete(COOKIE);cookies().delete(LOCATION_COOKIE)}
export function userCanAccessLocation(user,locationId,roles=[]){
  if(!user) return false;
  const a=(user.accessibleLocations||[]).find(x=>Number(x.id)===Number(locationId));
  if(!a) return false;
  return !roles.length||roles.includes(a.roleName);
}
