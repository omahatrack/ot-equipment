import {NextResponse} from 'next/server';
import {prisma} from '../../../../lib/prisma';
import {requireApiUser} from '../../../../lib/apiAuth';
import {userCanAccessLocation} from '../../../../lib/session';
import {redirectTo} from '../../../../lib/http';
import {writeAudit} from '../../../../lib/audit';

function parseServiceDate(raw){
  const value=String(raw||'').trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d=new Date(`${value}T12:00:00Z`);
  return Number.isNaN(d.getTime())?null:d;
}

async function syncInterval(tx,equipmentId,intervalId){
  if(!intervalId) return;
  const latest=await tx.serviceRecord.findFirst({
    where:{equipmentId,intervalId},
    orderBy:[{serviceDate:'desc'},{id:'desc'}]
  });
  await tx.serviceInterval.update({
    where:{id:intervalId},
    data:{lastServiceHours:latest?.hoursAtService??null,lastServiceDate:latest?.serviceDate??null}
  });
}

export async function POST(req,{params}){
  const a=await requireApiUser(['Admin','Mechanic']);
  if(a.error) return NextResponse.json({error:a.error},{status:a.status});
  const id=Number(params.id);
  if(!Number.isInteger(id)) return NextResponse.json({error:'Invalid service record.'},{status:400});
  const existing=await prisma.serviceRecord.findUnique({where:{id},include:{equipment:true}});
  if(!existing) return NextResponse.json({error:'Service record not found.'},{status:404});
  if(!userCanAccessLocation(a.user,existing.equipment.locationId,['Admin','Mechanic'])) return NextResponse.json({error:'Location access denied.'},{status:403});

  const f=await req.formData();
  const intervalId=Number(f.get('intervalId'))||null;
  const hours=Number(f.get('hoursAtService'));
  const serviceDate=parseServiceDate(f.get('serviceDate'));
  const notes=String(f.get('notes')||'').trim();
  const manualPartsCost=Math.max(0,Number(f.get('manualPartsCost')||0)||0);
  const laborCost=Math.max(0,Number(f.get('laborCost')||0)||0);
  const externalCost=Math.max(0,Number(f.get('externalCost')||0)||0);
  if(!serviceDate) return NextResponse.json({error:'Valid service date is required.'},{status:400});
  if(!Number.isFinite(hours)||hours<0) return NextResponse.json({error:'Valid machine hours are required.'},{status:400});
  if(intervalId){
    const interval=await prisma.serviceInterval.findUnique({where:{id:intervalId}});
    if(!interval||interval.equipmentId!==existing.equipmentId) return NextResponse.json({error:'Service interval does not belong to this equipment.'},{status:400});
  }

  try{
    await prisma.$transaction(async tx=>{
      await tx.serviceRecord.update({where:{id},data:{intervalId,hoursAtService:hours,serviceDate,notes:notes||null,manualPartsCost,laborCost,externalCost}});
      const intervalIds=[...new Set([existing.intervalId,intervalId].filter(Boolean))];
      for(const iid of intervalIds) await syncInterval(tx,existing.equipmentId,iid);
      // If this service entry was also the source of the equipment's current hour reading,
      // correct the equipment value too. If hours have advanced since then, preserve the newer reading.
      if(Number(existing.equipment.currentHours)===Number(existing.hoursAtService)&&Number(hours)!==Number(existing.hoursAtService)){
        await tx.equipment.update({where:{id:existing.equipmentId},data:{currentHours:hours}});
        await tx.machineHoursLog.create({data:{equipmentId:existing.equipmentId,hours,userId:a.user.id}});
      }
    });
    await writeAudit({userId:a.user.id,locationId:existing.equipment.locationId,entityType:'ServiceRecord',entityId:id,action:'UPDATE',summary:`Updated service record for ${existing.equipment.code}`});
    return redirectTo(`/equipment/${existing.equipmentId}`);
  }catch(err){
    return NextResponse.json({error:err.message||'Could not update service record.'},{status:400});
  }
}
