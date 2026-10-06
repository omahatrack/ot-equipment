import {NextResponse} from 'next/server';
import {getCurrentUser,setLocationCookie} from '../../../../lib/session';
import {redirectTo} from '../../../../lib/http';
function cleanReturn(v){const s=String(v||'/dashboard');return s.startsWith('/')&&!s.startsWith('//')?s:'/dashboard'}
async function apply(user,locationId,returnTo){if(!(user.accessibleLocations||[]).some(x=>x.id===locationId))return NextResponse.json({error:'Location access denied'},{status:403});setLocationCookie(locationId);return redirectTo(cleanReturn(returnTo))}
export async function POST(req){const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});const f=await req.formData();return apply(user,Number(f.get('locationId')),f.get('returnTo'))}
export async function GET(req){const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});const u=new URL(req.url);return apply(user,Number(u.searchParams.get('locationId')),u.searchParams.get('returnTo'))}
