import {NextResponse} from 'next/server';
import {prisma} from '../../../../lib/prisma';
import {sql} from '../../../../lib/db';
import {requireApiUser} from '../../../../lib/apiAuth';
import {redirectTo} from '../../../../lib/http';
import {computeStatus} from '../../../../lib/inventoryRules';

export async function POST(req,{params}){
  const a=await requireApiUser(['Admin']);
  if(a.error)return NextResponse.json({error:a.error},{status:a.status});
  const id=Number(params.id),f=await req.formData(),action=String(f.get('action')||'update');

  if(action==='xref-add'||action==='xref-update'){
    const number=String(f.get('number')||'').trim(),brand=String(f.get('brand')||'').trim()||null,type=String(f.get('type')||'aftermarket'),isPreferred=String(f.get('isPreferred')||'')==='1';
    if(!number)return NextResponse.json({error:'Cross-reference number is required.'},{status:400});
    if(isPreferred)await prisma.partCrossReference.updateMany({where:{partId:id},data:{isPreferred:false}});
    if(action==='xref-add')await prisma.partCrossReference.create({data:{partId:id,number,brand,type,isPreferred}});
    else await prisma.partCrossReference.update({where:{id:Number(f.get('xrefId'))},data:{number,brand,type,isPreferred}});
    return redirectTo(`/parts/${id}/edit`);
  }

  const internalPartNumber=String(f.get('internalPartNumber')||'').trim();
  const name=String(f.get('name')||'').trim();
  const unitOfMeasure=String(f.get('unitOfMeasure')||'each').trim()||'each';
  const binLocation=String(f.get('binLocation')||'').trim()||null;
  const defaultCostText=String(f.get('defaultCost')||'').trim();
  const defaultCost=defaultCostText===''?null:Number(defaultCostText);
  const keepOnHand=Math.max(0,Math.floor(Number(f.get('keepOnHand')||1)));
  const reorderWhenBelow=Math.max(0,Math.floor(Number(f.get('reorderWhenBelow')||1)));
  if(!internalPartNumber||!name)return NextResponse.json({error:'Part number and description are required.'},{status:400});
  if(defaultCost!==null&&(!Number.isFinite(defaultCost)||defaultCost<0))return NextResponse.json({error:'Default unit cost must be a valid non-negative number.'},{status:400});

  await prisma.part.update({where:{id},data:{internalPartNumber,name,unitOfMeasure,binLocation}});
  await sql('UPDATE Part SET defaultCost=? WHERE id=?',[defaultCost,id]);

  const old=await prisma.partLocationInventory.findUnique({where:{partId_locationId:{partId:id,locationId:a.user.locationId}}});
  const status=old?computeStatus(old.onHand,reorderWhenBelow):'pending_count';
  await prisma.partLocationInventory.upsert({where:{partId_locationId:{partId:id,locationId:a.user.locationId}},update:{keepOnHand,reorderWhenBelow,status},create:{partId:id,locationId:a.user.locationId,onHand:0,keepOnHand,reorderWhenBelow,status:'pending_count'}});
  return redirectTo(`/parts/${id}`);
}

export async function DELETE(req,{params}){
  const a=await requireApiUser(['Admin']);
  if(a.error)return NextResponse.json({error:a.error},{status:a.status});
  const id=Number(params.id),xrefId=Number(new URL(req.url).searchParams.get('xrefId'));
  if(!xrefId)return NextResponse.json({error:'Cross-reference id required.'},{status:400});
  const x=await prisma.partCrossReference.findUnique({where:{id:xrefId}});
  if(!x||x.partId!==id)return NextResponse.json({error:'Cross reference not found.'},{status:404});
  await prisma.partCrossReference.delete({where:{id:xrefId}});
  return NextResponse.json({ok:true});
}
