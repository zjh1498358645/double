// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import {sqliteTable,text,integer,uniqueIndex} from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{id:text('id').primaryKey(),data:text('data').notNull(),version:integer('version').notNull(),inviteHash:text('invite_hash').unique()});
export const members=sqliteTable('members',{userId:text('user_id').primaryKey(),roomId:text('room_id').notNull(),slot:integer('slot').notNull()},t=>[uniqueIndex('members_room_slot').on(t.roomId,t.slot)]);
