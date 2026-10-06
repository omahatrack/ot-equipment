export function publicOrigin(req){
  const host=(req.headers.get('x-forwarded-host')||req.headers.get('host')||'').split(',')[0].trim();
  const proto=(req.headers.get('x-forwarded-proto')||'https').split(',')[0].trim();
  if(!host) throw new Error('Public host is unavailable.');
  return `${proto}://${host}`;
}
