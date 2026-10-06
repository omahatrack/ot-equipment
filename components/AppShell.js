import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../lib/session';
import MobileMenu from './MobileMenu';

export default async function AppShell({title,active,children}){
  const user=await getCurrentUser();
  if(!user) redirect('/');
  const role=user.role.name;
  const nav = role==='Admin'
    ? [['Dashboard','/dashboard'],['Scan','/scan'],['Equipment','/equipment'],['Parts','/parts'],['Inventory','/inventory'],['Service','/service'],['Reports','/reports'],['Vendors','/vendors'],['General Ref','/general-ref'],['Users & Roles','/admin/users'],['Audit Log','/admin/audit'],['System Status','/admin/system-status']]
    : role==='Mechanic'
      ? [['Dashboard','/dashboard'],['Scan','/scan'],['Equipment','/equipment'],['Service','/service']]
      : [['Dashboard','/dashboard'],['Scan','/scan'],['Parts','/parts'],['Inventory','/inventory']];
  return <div className="shell"><aside className="side"><img src="/img/logo-dark.png" className="logo" alt="Omaha Track Equipment"/><div className="user"><b>{user.name}</b><small>{role}{user.location?` • ${user.location.name}`:''}</small></div>{user.accessibleLocations?.length>1?<form action="/api/location/select" method="post" className="locationSwitch"><input type="hidden" name="returnTo" value="/dashboard"/><label>Working Location</label><select name="locationId" defaultValue={user.locationId}>{user.accessibleLocations.map(l=><option key={l.id} value={l.id}>{l.name} — {l.roleName}</option>)}</select><button className="btn small" type="submit">Switch</button></form>:null}<form action="/search" className="sidebarSearch"><input name="q" placeholder="Search everything..." aria-label="Global search"/></form><nav className="nav">{nav.map(([n,h])=><Link key={n} className={active===n?'active':''} href={h}>{n}</Link>)}</nav><div className="yard">● {(user.location?.name||'NO LOCATION').toUpperCase()}</div></aside><main className="main"><header className="top"><MobileMenu userName={user.name} role={role} locationName={user.location?.name||''} locationId={user.locationId} accessibleLocations={user.accessibleLocations||[]} nav={nav} active={active}/><h1>{title}</h1><form action="/api/auth/logout" method="post"><button className="btn">Log out</button></form></header><div className="content">{children}</div></main></div>
}
