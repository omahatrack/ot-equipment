import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { sql } from '../../../../lib/db';
import { verifyPassword, signSession } from '../../../../lib/auth';
import { setSessionCookie } from '../../../../lib/session';
import { redirectTo } from '../../../../lib/http';
export async function POST(req){
  const data=await req.formData();const login=String(data.get('login')||data.get('username')||'').trim().toLowerCase();const password=String(data.get('password')||'');const rawNext=String(data.get('next')||'');const next=rawNext.startsWith('/')&&!rawNext.startsWith('//')?rawNext:'/dashboard';
  let user=await prisma.user.findUnique({where:{username:login}});
  if(!user&&login){try{const rows=await sql('SELECT id FROM User WHERE LOWER(email)=? LIMIT 1',[login]);if(rows.length)user=await prisma.user.findUnique({where:{id:Number(rows[0].id)}})}catch{}}
  if(!user||!verifyPassword(password,user.passwordHash))return redirectTo(`/?error=1&next=${encodeURIComponent(next)}`);
  try{const s=await sql('SELECT isActive FROM UserAccessSettings WHERE userId=? LIMIT 1',[user.id]);if(s.length&&!s[0].isActive)return redirectTo(`/?error=inactive&next=${encodeURIComponent(next)}`)}catch{}
  const secret=process.env.SESSION_SECRET;if(!secret)throw new Error('SESSION_SECRET is required');setSessionCookie(signSession({userId:user.id},secret));return redirectTo(next);
}
