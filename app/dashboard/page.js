import AppShell from '../../components/AppShell';
import { prisma } from '../../lib/prisma';
import { getCurrentUser } from '../../lib/session';
import { sql } from '../../lib/db';
import { getServiceStatus } from '../../lib/serviceStatus';

export const dynamic='force-dynamic';

function serviceRemaining(status){
  const parts=[];
  if(status.remainingHours!=null){
    const hrs=Math.round(Math.abs(status.remainingHours));
    parts.push(status.remainingHours<0?`${hrs.toLocaleString()} hrs overdue`:`${hrs.toLocaleString()} hrs remaining`);
  }
  if(status.remainingDays!=null){
    const days=Math.abs(status.remainingDays);
    parts.push(status.remainingDays<0?`${days.toLocaleString()} days overdue`:`${days.toLocaleString()} days remaining`);
  }
  return parts.join(' • ')||'Due threshold reached';
}

function activityText(t){
  const qty=`${t.qtyDelta>0?'+':''}${t.qtyDelta}`;
  const type=String(t.type||'Activity').replaceAll('_',' ');
  return `${type} ${qty}`;
}

export default async function Dashboard(){
  const user=await getCurrentUser();
  const locationId=user?.locationId;
  const role=user?.role?.name||'';
  const stockWhere=locationId?{locationId}:{};
  const [reorder,onorder,check,recent,equipmentRows,serviceIntervals]=await Promise.all([
    prisma.partLocationInventory.count({where:{...stockWhere,status:'needs_reorder'}}),
    prisma.partLocationInventory.count({where:{...stockWhere,status:'on_order'}}),
    prisma.partLocationInventory.count({where:{...stockWhere,status:'check'}}),
    prisma.inventoryTransaction.findMany({where:locationId?{locationId}:{},include:{part:true,user:true,equipment:true},orderBy:{createdAt:'desc'},take:8}),
    locationId
      ? sql(`SELECT id,code,displayName,currentHours FROM Equipment WHERE locationId=? AND UPPER(TRIM(COALESCE(status,''))) <> 'ARCHIVED' ORDER BY code ASC`,[locationId])
      : sql(`SELECT id,code,displayName,currentHours FROM Equipment WHERE UPPER(TRIM(COALESCE(status,''))) <> 'ARCHIVED' ORDER BY code ASC`),
    prisma.serviceInterval.findMany({where:{equipmentId:{not:null}},include:{equipment:true},orderBy:{id:'asc'}})
  ]);

  const equipment=equipmentRows||[];
  const equipmentCount=equipment.length;
  const neededService=serviceIntervals
    .filter(i=>i.equipment && String(i.equipment.status||'').trim().toUpperCase()!=='ARCHIVED' && (!locationId || Number(i.equipment.locationId)===Number(locationId)))
    .map(i=>({interval:i,equipment:i.equipment,status:getServiceStatus(i,Number(i.equipment.currentHours||0))}))
    .filter(x=>x.status.key==='overdue'||x.status.key==='due_soon')
    .sort((a,b)=>{
      if(a.status.key!==b.status.key)return a.status.key==='overdue'?-1:1;
      const av=a.status.remainingHours??a.status.remainingDays??Number.POSITIVE_INFINITY;
      const bv=b.status.remainingHours??b.status.remainingDays??Number.POSITIVE_INFINITY;
      return av-bv;
    });
  const overdueService=neededService.filter(x=>x.status.key==='overdue').length;
  const upcomingService=neededService.filter(x=>x.status.key==='due_soon').length;

  const quickActions=role==='Admin'
    ? [['Scan Equipment','/scan','Scan a QR code or open a unit'],['Service','/service','Record or review maintenance'],['Inventory','/inventory','Counts, reorder and stock'],['Reports','/reports','Maintenance and cost reporting']]
    : role==='Mechanic'
      ? [['Scan Equipment','/scan','Scan a QR code or open a unit'],['Service','/service','Record or review maintenance'],['Equipment','/equipment','Browse equipment records']]
      : [['Scan Equipment','/scan','Scan a QR code or open a unit'],['Inventory','/inventory','Counts, reorder and stock'],['Parts','/parts','Browse parts']];

  return <AppShell title="Dashboard Overview" active="Dashboard">
    <div className="dashboardKpiGrid">
      <a className="dashboardKpi kpiDanger" href="/inventory"><span>Needs Reorder</span><strong>{reorder}</strong><small>Parts below target</small></a>
      <a className="dashboardKpi kpiDark" href="/inventory"><span>On Order</span><strong>{onorder}</strong><small>Incoming stock</small></a>
      <a className="dashboardKpi kpiAmber" href="/inventory"><span>Check Inventory</span><strong>{check}</strong><small>Needs verification</small></a>
      <a className="dashboardKpi kpiPlain" href="/equipment"><span>Active Equipment</span><strong>{equipmentCount}</strong><small>At this location</small></a>
    </div>

    <div className="dashboardServiceStrip">
      <a className={`dashboardServiceStat ${overdueService?'hasAlert':''}`} href="#needed-service"><span>Overdue Service</span><strong>{overdueService}</strong></a>
      <a className={`dashboardServiceStat ${upcomingService?'hasWarning':''}`} href="#needed-service"><span>Due Within 100 Hours / 30 Days</span><strong>{upcomingService}</strong></a>
      <div className={`dashboardHealth ${neededService.length?'attention':'clear'}`}>
        <b>{neededService.length?'Maintenance attention needed':'Maintenance is clear'}</b>
        <span>{neededService.length?`${neededService.length} configured service item${neededService.length===1?'':'s'} need attention.`:'No configured service is currently inside the warning window.'}</span>
      </div>
    </div>

    <div className="dashboardMainGrid">
      <section className="card dashboardEquipmentCard">
        <div className="dashboardCardHeader"><div><h2>Equipment</h2><div className="muted">Current equipment at {user?.location?.name||'your location'}</div></div><a className="textLink" href="/equipment">View All</a></div>
        <div className="dashboardEquipmentList">
          {equipment.map(e=><a className="dashboardEquipmentRow" href={`/equipment/${e.id}`} key={e.id}>
            <div className="dashboardUnit"><b>{e.code}</b><span>{e.displayName||'No description'}</span></div>
            <div className="dashboardHours"><strong>{Number(e.currentHours||0).toLocaleString()}</strong><span>hrs</span></div>
            <span className="dashboardRowArrow" aria-hidden="true">›</span>
          </a>)}
        </div>
      </section>

      <div className="dashboardRightRail">
        <section className="card dashboardQuickCard">
          <div className="dashboardCardHeader"><div><h2>Quick Actions</h2><div className="muted">Common tasks</div></div></div>
          <div className="dashboardQuickGrid">{quickActions.map(([name,href,desc])=><a href={href} className="dashboardQuickAction" key={name}><b>{name}</b><span>{desc}</span><em>›</em></a>)}</div>
        </section>

        <section className="card dashboardActivityCard">
          <div className="dashboardCardHeader"><div><h2>Recent Inventory</h2><div className="muted">Latest stock activity</div></div><a className="textLink" href="/inventory">Inventory</a></div>
          <div className="dashboardActivityList">
            {recent.length?recent.map(t=><div className="dashboardActivityRow" key={t.id}>
              <div><b>{t.part?.internalPartNumber||'Part'}</b><span>{activityText(t)}{t.equipment?` • ${t.equipment.code}`:''}</span></div>
              <small>{t.user?.name||'System'}</small>
            </div>):<div className="dashboardEmptyMini">No recent inventory activity.</div>}
          </div>
        </section>
      </div>
    </div>

    <section id="needed-service" className={`card dashboardServiceCard dashboardServiceCardV45 ${neededService.length?'':'isClear'}`}>
      <div className="toolbar dashboardServiceHeader"><div><h2>Needed Service</h2><div className="muted">Overdue service and equipment within 100 hours or 30 days of its next configured service.</div></div><a className="textLink" href="/service">View Service</a></div>
      {neededService.length?<div className="tablewrap"><table><thead><tr><th>Unit</th><th>Service</th><th>Current</th><th>Interval</th><th>Status</th><th>Due</th></tr></thead><tbody>
        {neededService.map(({interval,equipment,status})=><tr key={interval.id} className={`dashboardServiceRow ${status.key}`}>
          <td><a className="tableLink" href={`/equipment/${equipment.id}`}><b>{equipment.code}</b></a><div className="muted">{equipment.displayName||'Equipment'}</div></td>
          <td><b>{interval.description}</b></td>
          <td>{Number(equipment.currentHours||0).toLocaleString()} hrs</td>
          <td>{interval.hoursValue?`${interval.hoursValue.toLocaleString()} hrs`:''}{interval.hoursValue&&interval.daysValue?' • ':''}{interval.daysValue?`${interval.daysValue.toLocaleString()} days`:''}</td>
          <td><span className={`serviceDashboardBadge ${status.key}`}>{status.label}</span></td>
          <td>{serviceRemaining(status)}</td>
        </tr>)}
      </tbody></table></div>:<div className="dashboardAllClear"><span className="dashboardCheck">✓</span><div><b>Nothing needs service right now.</b><span>Configured service intervals are outside the advance-warning window.</span></div></div>}
    </section>
  </AppShell>;
}
