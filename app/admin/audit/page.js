import AppShell from '../../../components/AppShell';
import {getCurrentUser} from '../../../lib/session';
import {sql} from '../../../lib/db';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function AuditPage({searchParams}){
  const user=await getCurrentUser();if(user?.role?.name!=='Admin')notFound();
  const q=String((await searchParams)?.q||'').trim();
  const params=[user.locationId];let where='WHERE (a.locationId=? OR a.locationId IS NULL)';
  if(q){where+=' AND (a.entityType LIKE ? OR a.action LIKE ? OR a.summary LIKE ? OR u.name LIKE ?)';for(let i=0;i<4;i++)params.push(`%${q}%`)}
  const rows=await sql(`SELECT a.*,u.name userName FROM AuditLog a LEFT JOIN User u ON u.id=a.userId ${where} ORDER BY a.createdAt DESC LIMIT 250`,params);
  return <AppShell title="Audit Log" active="Audit Log"><section className="card"><div className="toolbar"><div><h2>Recent Changes</h2><div className="muted">Who changed what, and when. Showing the current yard plus system-level events.</div></div><form method="get"><input name="q" defaultValue={q} placeholder="Search audit log..."/><button className="btn">Search</button></form></div><div className="tablewrap"><table><thead><tr><th>When</th><th>User</th><th>Type</th><th>Action</th><th>Summary</th></tr></thead><tbody>{rows.length?rows.map(r=><tr key={r.id}><td>{new Date(r.createdAt).toLocaleString()}</td><td>{r.userName||'System'}</td><td>{r.entityType}{r.entityId?` #${r.entityId}`:''}</td><td><b>{r.action}</b></td><td>{r.summary||'—'}</td></tr>):<tr><td colSpan="5" className="emptyCell">No audit events recorded yet.</td></tr>}</tbody></table></div></section></AppShell>
}
