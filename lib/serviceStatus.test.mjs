import test from 'node:test';import assert from 'node:assert/strict';import {getServiceStatus} from './serviceStatus.js';
const now=new Date('2026-08-27T12:00:00Z');
test('hours overdue',()=>assert.equal(getServiceStatus({hoursValue:250,lastServiceHours:1000,daysValue:null,lastServiceDate:null},1260,now).key,'overdue'));
test('hours due soon',()=>assert.equal(getServiceStatus({hoursValue:250,lastServiceHours:1000,daysValue:null,lastServiceDate:null},1230,now).key,'due_soon'));
test('calendar due soon',()=>assert.equal(getServiceStatus({hoursValue:null,lastServiceHours:null,daysValue:365,lastServiceDate:new Date('2025-09-10T00:00:00Z')},0,now).key,'due_soon'));
test('independent interval on track',()=>assert.equal(getServiceStatus({hoursValue:500,lastServiceHours:1000,daysValue:null,lastServiceDate:null},1100,now).key,'on_track'));
test('not set without last service baseline',()=>assert.equal(getServiceStatus({hoursValue:250,lastServiceHours:null,daysValue:null,lastServiceDate:null},1000,now).key,'not_set'));

test('within 100 hours is due soon',()=>assert.equal(getServiceStatus({hoursValue:500,lastServiceHours:1000,daysValue:null,lastServiceDate:null},1400,now).key,'due_soon'));
test('more than 100 hours remains on track',()=>assert.equal(getServiceStatus({hoursValue:500,lastServiceHours:1000,daysValue:null,lastServiceDate:null},1399,now).key,'on_track'));
