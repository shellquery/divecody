import { pgTable, text, integer, serial, json, boolean, unique } from 'drizzle-orm/pg-core';

/** Top-level work: "divine-comedy", "paradise-lost", etc. */
export const works = pgTable('works', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  title_zh: text('title_zh'),
  author: text('author'),
  author_zh: text('author_zh'),
});

/**
 * Sections within a work: "inferno", "purgatorio", "paradiso" for Divine Comedy;
 * future books can be their own work + sections.
 */
export const sections = pgTable('sections', {
  id: text('id').primaryKey(),             // URL slug: "inferno", "paradise-lost"
  work_id: text('work_id').notNull(),
  title: text('title').notNull(),
  title_zh: text('title_zh'),
  number: integer('number').notNull(),     // ordering within the work
  canto_count: integer('canto_count').notNull(),
  translator_en: text('translator_en'),
  translator_zh: text('translator_zh'),
  source_url: text('source_url'),
  license: text('license'),
  zh_placeholder: boolean('zh_placeholder').default(false).notNull(),
  emoji: text('emoji'),
});

/** Individual cantos/chapters. Lines stored as JSON arrays. */
export const cantos = pgTable('cantos', {
  id: serial('id').primaryKey(),
  section_id: text('section_id').notNull(),
  number: integer('number').notNull(),
  roman: text('roman').notNull(),
  title_en: text('title_en'),
  title_zh: text('title_zh'),
  lines_en: json('lines_en').$type<string[]>().notNull(),
  lines_zh: json('lines_zh').$type<string[]>(),
}, (t) => [unique('cantos_section_canto').on(t.section_id, t.number)]);

/** One illustration per section × canto. */
export const illustrations = pgTable('illustrations', {
  id: serial('id').primaryKey(),
  section_id: text('section_id').notNull(),
  canto_number: integer('canto_number').notNull(),
  url: text('url').notNull(),
  artist: text('artist'),
  year: integer('year'),
}, (t) => [unique('illustrations_section_canto').on(t.section_id, t.canto_number)]);
