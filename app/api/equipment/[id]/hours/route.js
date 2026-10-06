import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { requireApiUser } from '../../../../../lib/apiAuth';
import { userCanAccessLocation } from '../../../../../lib/session';
import {writeAudit} from '../../../../../lib/audit';
function redirectTo(path){ return new NextResponse(null,{status:303,headers:{Location:path}}); }
export async function POST(req,{params}){
  const auth=await requireApiUser(['Admin','Mechanic']);if(auth.error)return NextResponse.json({error:auth.error},{status:auth.status});
  const resolvedParams=await params,id=Number(resolvedParams.id);if(!Number.isInteger(id))return NextResponse.json({error:'Invalid equipment ID.'},{status:400});
  const equipment=await prisma.equipment.findUnique({where:{id}});if(!equipment)return NextResponse.json({error:'Equipment not found.'},{status:404});if(!userCanAccessLocation(auth.user,equipment.locationId,['Admin','Mechanic']))return NextResponse.json({error:'Location access denied.'},{status:403});
  const form=await req.formData(),hours=Number(form.get('hours')),allowCorrection=String(form.get('allowCorrection')||'')==='yes';
  if(!Number.isFinite(hours)||hours<0)return NextResponse.json({error:'Enter valid machine hours.'},{status:400});
  if(hours<Number(equipment.currentHours||0)&&!allowCorrection)return NextResponse.json({error:`New hours cannot be lower than the current ${equipment.currentHours}. Check “Correction” if you are intentionally fixing a bad reading.`},{status:400});
  if(Number(equipment.currentHours)!==hours){await prisma.$transaction(async tx=>{await tx.equipment.update({where:{id},data:{currentHours:hours}});await tx.machineHoursLog.create({data:{equipmentId:id,hours,userId:auth.user.id}})});await writeAudit({userId:auth.user.id,locationId:equipment.locationId,entityType:'Equipment',entityId:id,action:allowCorrection&&hours<equipment.currentHours?'HOURS_CORRECTION':'HOURS_UPDATE',summary:`${equipment.code} hours changed from ${equipment.currentHours} to ${hours}`})}
  return redirectTo(`/equipment/${id}`);
}
