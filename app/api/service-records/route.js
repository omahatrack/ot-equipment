import {NextResponse} from 'next/server';
import {prisma} from '../../../lib/prisma';
import {sql} from '../../../lib/db';
import {requireApiUser} from '../../../lib/apiAuth';
import {userCanAccessLocation} from '../../../lib/session';
import {computeStatus} from '../../../lib/inventoryRules';
import {redirectTo} from '../../../lib/http';
import {uploadStorageObject,serviceAttachmentPath,getSupabaseStorageConfig} from '../../../lib/supabaseStorage';
import {writeAudit} from '../../../lib/audit';

const ALLOWED=new Set(['application/pdf','image/jpeg','image/png','image/webp']);
const MAX_SIZE=15*1024*1024;
const TYPES=new Set(['Invoice','Service Record','Inspection','Warranty','Manual','Photo','Other']);
function validMagic(buf,type){if(type==='application/pdf')return buf.length>4&&buf.subarray(0,5).toString()==='%PDF-';if(type==='image/jpeg')return buf.length>3&&buf[0]===0xff&&buf[1]===0xd8&&buf[2]===0xff;if(type==='image/png')return buf.length>8&&buf.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));if(type==='image/webp')return buf.length>12&&buf.subarray(0,4).toString()==='RIFF'&&buf.subarray(8,12).toString()==='WEBP';return false}

export async function POST(req){
  const a=await requireApiUser(['Admin','Mechanic']);if(a.error)return NextResponse.json({error:a.error},{status:a.status});
  const f=await req.formData();
  const equipmentId=Number(f.get('equipmentId')),intervalId=(Number(f.get('intervalId'))||null),hours=Number(f.get('hoursAtService'));
  const rawDate=String(f.get('serviceDate')||'').trim(),notes=String(f.get('notes')||'').trim();
  const manualPartsCost=Math.max(0,Number(f.get('manualPartsCost')||0)||0),laborCost=Math.max(0,Number(f.get('laborCost')||0)||0),externalCost=Math.max(0,Number(f.get('externalCost')||0)||0);
  const partIds=[...new Set(f.getAll('partId').map(Number).filter(Number.isInteger))];
  const file=f.get('attachment'),attachmentName=String(f.get('attachmentName')||'').trim(),attachmentNotes=String(f.get('attachmentNotes')||'').trim();
  const rawType=String(f.get('attachmentType')||'Other'),attachmentType=TYPES.has(rawType)?rawType:'Other';
  const serviceDate=/^\d{4}-\d{2}-\d{2}$/.test(rawDate)?new Date(`${rawDate}T12:00:00Z`):null;
  if(!serviceDate||Number.isNaN(serviceDate.getTime()))return NextResponse.json({error:'Valid service date is required.'},{status:400});
  let attachmentData=null;
  if(file&&typeof file.arrayBuffer==='function'&&file.size>0){
    if(!ALLOWED.has(file.type))return NextResponse.json({error:'Service attachment must be PDF, JPG, PNG or WEBP.'},{status:400});
    if(file.size>MAX_SIZE)return NextResponse.json({error:'Service attachment must be 15 MB or smaller.'},{status:400});
    if(!getSupabaseStorageConfig().configured)return NextResponse.json({error:'Supabase Storage is not configured yet. Ask an Admin to complete System Status setup.'},{status:503});
    attachmentData=Buffer.from(await file.arrayBuffer());if(!validMagic(attachmentData,file.type))return NextResponse.json({error:'The uploaded service document does not match its file format.'},{status:400});
  }
  const e=await prisma.equipment.findUnique({where:{id:equipmentId}});if(!e)return NextResponse.json({error:'Equipment not found.'},{status:404});
  if(!userCanAccessLocation(a.user,e.locationId,['Admin','Mechanic']))return NextResponse.json({error:'Location access denied.'},{status:403});
  const interval=intervalId?await prisma.serviceInterval.findUnique({where:{id:intervalId}}):null;if(intervalId&&(!interval||interval.equipmentId!==equipmentId))return NextResponse.json({error:'Service interval does not belong to this equipment.'},{status:400});
  if(!Number.isFinite(hours)||hours<0)return NextResponse.json({error:'Valid machine hours are required.'},{status:400});
  try{
    const recordId=await prisma.$transaction(async tx=>{
      const linked=partIds.length?await tx.equipmentPart.findMany({where:{equipmentId,partId:{in:partIds}},include:{part:{include:{vendorParts:{orderBy:[{isPreferred:'desc'},{price:'asc'}]}}}}}):[];
      if(linked.length!==partIds.length)throw new Error('One or more selected parts are not linked to this equipment.');
      const record=await tx.serviceRecord.create({data:{equipmentId,intervalId,performedById:a.user.id,hoursAtService:hours,serviceDate,notes:notes||null}});
      await tx.$executeRaw`UPDATE ServiceRecord SET manualPartsCost=${manualPartsCost}, laborCost=${laborCost}, externalCost=${externalCost} WHERE id=${record.id}`;
      if(intervalId)await tx.serviceInterval.update({where:{id:intervalId},data:{lastServiceHours:hours,lastServiceDate:serviceDate}});
      if(hours>e.currentHours){await tx.equipment.update({where:{id:equipmentId},data:{currentHours:hours}});await tx.machineHoursLog.create({data:{equipmentId,hours,userId:a.user.id}})}
      for(const ep of linked){
        const qty=Math.max(1,Math.floor(Number(f.get(`qty_${ep.partId}`)||1)||1));let inv=await tx.partLocationInventory.findUnique({where:{partId_locationId:{partId:ep.partId,locationId:e.locationId}}});
        if(!inv)inv=await tx.partLocationInventory.create({data:{partId:ep.partId,locationId:e.locationId,onHand:0,keepOnHand:1,reorderWhenBelow:1,status:'pending_count'}});
        const newQty=inv.onHand-qty,status=computeStatus(newQty,inv.reorderWhenBelow),priced=ep.part.vendorParts.find(v=>v.price!=null),unitCost=priced?.price??null;
        const trx=await tx.inventoryTransaction.create({data:{partId:ep.partId,locationId:e.locationId,type:'USE',qtyDelta:-qty,userId:a.user.id,equipmentId,cost:unitCost,notes:`Used during service: ${interval?.description||'General Service'}`}});
        await tx.partLocationInventory.update({where:{partId_locationId:{partId:ep.partId,locationId:e.locationId}},data:{onHand:newQty,status}});await tx.servicePartUsed.create({data:{serviceRecordId:record.id,partId:ep.partId,transactionId:trx.id}});
      }
      return record.id;
    });
    if(attachmentData){const fileName=String(file.name||'service-document'),path=serviceAttachmentPath(equipmentId,recordId,fileName),stored=await uploadStorageObject(path,attachmentData,file.type);await sql('INSERT INTO ServiceAttachment(serviceRecordId,displayName,notes,documentType,mimeType,fileName,data,storageProvider,storageBucket,storagePath,uploadedById) VALUES (?,?,?,?,?,?,NULL,?,?,?,?)',[recordId,attachmentName||fileName,attachmentNotes||null,attachmentType,file.type,fileName,'supabase',stored.bucket,stored.path,a.user.id])}
    await writeAudit({userId:a.user.id,locationId:e.locationId,entityType:'ServiceRecord',entityId:recordId,action:'CREATE',summary:`Recorded ${interval?.description||'general service'} for ${e.code} at ${hours} hrs`});
    return redirectTo(`/equipment/${equipmentId}`);
  }catch(err){return NextResponse.json({error:err.message||'Could not record service.'},{status:400})}
}
