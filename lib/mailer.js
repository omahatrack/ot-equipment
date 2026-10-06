export function mailConfigured(){return Boolean(process.env.SMTP_HOST&&process.env.SMTP_FROM)}
export async function sendMail({to,subject,text,html}){
  if(!mailConfigured()) return {sent:false,reason:'not_configured'};
  const nodemailer=(await import('nodemailer')).default;
  const port=Number(process.env.SMTP_PORT||587);
  const secure=String(process.env.SMTP_SECURE||'false').toLowerCase()==='true';
  const transport=nodemailer.createTransport({
    host:process.env.SMTP_HOST,port,secure,
    auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD||''}:undefined,
    requireTLS:!secure
  });
  await transport.sendMail({from:process.env.SMTP_FROM,to,subject,text,html});
  return {sent:true};
}
