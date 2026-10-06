import {NextResponse} from 'next/server';
import {prisma} from '../../../lib/prisma';
import {requireApiUser} from '../../../lib/apiAuth';
import {redirectTo} from '../../../lib/http';

export async function POST(req){
  const a=await requireApiUser(['Admin']);
  if(a.error)return NextResponse.json({error:a.error},{status:a.status});
  const f=await req.formData();
  const name=String(f.get('name')||'').trim();
  const contactInfo=String(f.get('contactInfo')||'').trim()||null;
  const lead=String(f.get('leadTimeDays')||'').trim();
  const returnTo=String(f.get('returnTo')||'').trim();
  if(!name)return NextResponse.json({error:'Vendor name required.'},{status:400});

  let v;
  try{
    v=await prisma.vendor.create({data:{name,contactInfo,leadTimeDays:lead?Number(lead):null}});
  }catch(err){
    if(err?.code==='P2002')return NextResponse.json({error:'A vendor with that name already exists.'},{status:409});
    throw err;
  }

  if(returnTo.startsWith('/')){
    const sep=returnTo.includes('?')?'&':'?';
    return redirectTo(`${returnTo}${sep}newVendor=${v.id}`);
  }
  return redirectTo(`/vendors/${v.id}`);
}
