import test from 'node:test';import assert from 'node:assert/strict';
import {mailboxExport} from '../src/mailbox-export.ts';
import {newRoom,transition} from '../src/server/model.ts';
test('read receipts acknowledge selected messages only and reject unknown ids without changing state',()=>{
 let room=newRoom('a','A','R',0);room.members[1]={id:'b',name:'B'};
 room=transition(room,0,'message',{text:'one'},1000);room=transition(room,0,'message',{text:'two'},2000);
 const next=transition(room,1,'message-read',{ids:[room.messages[0].id]},3000);
 assert.deepEqual(next.messages.map(m=>m.read[1]),[true,false]);
 assert.throws(()=>transition(room,1,'message-read',{ids:['unknown']},3000));assert.equal(room.messages[0].read[1],false);
});
test('local mailbox export preserves multiline text, dates and replies while escaping HTML',()=>{
 const messages=[{id:'b',author:1,authorName:'<B>',text:'<script>alert(1)</script>\n第二行',parentId:'a',created:2000,read:[false,true],own:false},{id:'a',author:0,text:'first',parentId:null,created:1000,read:[true,true],own:true}];
 const files=mailboxExport(messages,['A','B'],'<小屋>');
 assert.equal(files.count,2);assert.ok(files.text.indexOf('first')<files.text.indexOf('<script>'));
 assert.ok(!files.html.includes('<script>'));assert.ok(files.html.includes('&lt;script&gt;'));assert.ok(files.html.includes('&lt;B&gt;'));
 assert.equal(JSON.parse(files.json).messages[1].replyTo,'a');assert.ok(files.text.includes('第二行'));
});
