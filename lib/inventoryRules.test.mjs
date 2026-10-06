import test from 'node:test';import assert from 'node:assert/strict';import {computeStatus,validateReceiveInput,validateAdjustInput,validateCountInput,validateMarkOrdered} from './inventoryRules.js';
test('status rules',()=>{assert.equal(computeStatus(-1,1),'check');assert.equal(computeStatus(0,1),'needs_reorder');assert.equal(computeStatus(1,1),'on_hand')});
test('receive validation',()=>{assert.equal(validateReceiveInput({qty:1,vendorId:1,cost:2}).valid,true);assert.equal(validateReceiveInput({qty:0,vendorId:1}).valid,false);assert.equal(validateReceiveInput({qty:1}).valid,false)});
test('adjust requires reason',()=>assert.equal(validateAdjustInput({qtyDelta:-1,reason:''}).valid,false));
test('count zero allowed',()=>assert.equal(validateCountInput({actualCount:0}).valid,true));
test('mark ordered only from reorder/check',()=>{assert.equal(validateMarkOrdered('needs_reorder').valid,true);assert.equal(validateMarkOrdered('on_hand').valid,false)});
