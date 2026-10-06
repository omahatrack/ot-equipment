import { NextResponse } from 'next/server';import { clearSessionCookie } from '../../../../lib/session';
import { redirectTo } from '../../../../lib/http';
export async function POST(req){clearSessionCookie();return redirectTo('/')}
