// Mise à jour du modèle d'abonnement pour inclure la période d'essai et les codes promotionnels

import { defineTable } from 'drizzle-orm/pg-core';
import { pgTable, uuid, varchar, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

// Table des abonnements
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  agency_id: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  stripe_customer_id: varchar('stripe_customer_id', { length: 255 }),
  stripe_subscription_id: varchar('stripe_subscription_id', { length: 255 }),
  plan_id: varchar('plan_id', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('inactive'),
  interval: varchar('interval', { length: 20 }).notNull().default('month'),
  current_period_start: timestamp('current_period_start'),
  current_period_end: timestamp('current_period_end'),
  cancel_at_period_end: boolean('cancel_at_period_end').default(false),
  
  // Nouveaux champs pour la période d'essai
  trial_start: timestamp('trial_start'),
  trial_end: timestamp('trial_end'),
  is_in_trial: boolean('is_in_trial').default(false),
  trial_days: integer('trial_days').default(0),
  
  // Nouveaux champs pour les codes promotionnels
  coupon_id: varchar('coupon_id', { length: 255 }),
  coupon_name: varchar('coupon_name', { length: 255 }),
  discount_amount: integer('discount_amount').default(0),
  discount_percent: integer('discount_percent').default(0),
  
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  metadata: jsonb('metadata').default({})
});

// Table des quotas d'utilisation
export const usageQuotas = pgTable('usage_quotas', {
  id: uuid('id').primaryKey().defaultRandom(),
  agency_id: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  subscription_id: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
  
  // Quotas et utilisation
  calls_limit: integer('calls_limit').notNull().default(0),
  calls_used: integer('calls_used').notNull().default(0),
  minutes_limit: integer('minutes_limit').notNull().default(0),
  minutes_used: integer('minutes_used').notNull().default(0),
  
  // Nouveaux champs pour les notifications de quota
  calls_notification_threshold: integer('calls_notification_threshold').default(80), // pourcentage
  minutes_notification_threshold: integer('minutes_notification_threshold').default(80), // pourcentage
  last_notification_sent_at: timestamp('last_notification_sent_at'),
  notification_cooldown_hours: integer('notification_cooldown_hours').default(24),
  
  reset_date: timestamp('reset_date'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

// Nouvelle table pour les codes promotionnels
export const coupons = pgTable('coupons', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
  
  // Type de remise
  discount_type: varchar('discount_type', { length: 20 }).notNull().default('percent'), // 'percent' ou 'amount'
  discount_amount: integer('discount_amount').default(0), // en centimes pour les montants fixes
  discount_percent: integer('discount_percent').default(0), // pourcentage de remise
  
  // Validité
  valid_from: timestamp('valid_from').defaultNow(),
  valid_until: timestamp('valid_until'),
  max_redemptions: integer('max_redemptions'),
  times_redeemed: integer('times_redeemed').default(0),
  
  // Restrictions
  applies_to_plan: varchar('applies_to_plan', { length: 100 }), // null = tous les plans
  min_subscription_months: integer('min_subscription_months').default(1),
  
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  created_by: uuid('created_by').references(() => users.id),
  metadata: jsonb('metadata').default({})
});

// Table pour suivre l'utilisation des codes promo
export const couponRedemptions = pgTable('coupon_redemptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  coupon_id: uuid('coupon_id').notNull().references(() => coupons.id, { onDelete: 'cascade' }),
  agency_id: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  subscription_id: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
  
  redeemed_at: timestamp('redeemed_at').defaultNow(),
  discount_applied: integer('discount_applied').notNull(), // montant réel de la remise appliquée
  
  created_at: timestamp('created_at').defaultNow(),
  metadata: jsonb('metadata').default({})
});

// Table pour les notifications de quota
export const quotaNotifications = pgTable('quota_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  agency_id: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  notification_type: varchar('notification_type', { length: 50 }).notNull(), // 'calls_threshold', 'minutes_threshold', etc.
  threshold_percent: integer('threshold_percent').notNull(),
  current_usage_percent: integer('current_usage_percent').notNull(),
  
  sent_at: timestamp('sent_at').defaultNow(),
  read_at: timestamp('read_at'),
  
  metadata: jsonb('metadata').default({})
});
