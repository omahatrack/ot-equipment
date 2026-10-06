import {NextResponse} from 'next/server';
import {prisma} from '../../../../../lib/prisma';
import {sql} from '../../../../../lib/db';
import {requireApiUser} from '../../../../../lib/apiAuth';
import {redirectTo} from '../../../../../lib/http';

export async function POST(req,{params}){
  const a=await requireApiUser(['Admin']);
  if(a.error)return NextResponse.json({error:a.error},{status:a.status});
  const partId=Number(params.id),f=await req.formData(),vendorId=Number(f.get('vendorId'));
  const vendorPartNumber=String(f.get('vendorPartNumber')||'').trim()||null;
  const purchaseUrl=String(f.get('purchaseUrl')||'').trim()||null;
  const priceText=String(f.get('price')||'').trim();
  const price=priceText?Number(priceText):null;
  const isPreferred=String(f.get('isPreferred')||'')==='1';
  if(price!==null&&(!Number.isFinite(price)||price<0))return NextResponse.json({error:'Price must be a valid non-negative number.'},{status:400});

  const old=await prisma.vendorPart.findUnique({where:{vendorId_partId:{vendorId,partId}}});
  const priceChanged=!old ? price!==null : old.price!==price;
  if(isPreferred)await prisma.vendorPart.updateMany({where:{partId},data:{isPreferred:false}});
  const vp=await prisma.vendorPart.upsert({
    where:{vendorId_partId:{vendorId,partId}},
    update:{vendorPartNumber,purchaseUrl,price,lastPriceUpdate:priceChanged&&price!==null?new Date():old?.lastPriceUpdate,isPreferred},
    create:{vendorId,partId,vendorPartNumber,purchaseUrl,price,lastPriceUpdate:price!=null?new Date():null,isPreferred}
  });
  if(price!==null&&(!old||old.price!==price))await sql('INSERT INTO VendorPriceHistory(vendorPartId,price,recordedById) VALUES (?,?,?)',[vp.id,price,a.user.id]);
  return redirectTo(`/parts/${partId}/edit`);
}
