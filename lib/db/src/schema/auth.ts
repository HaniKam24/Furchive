// Auth tables required by better-auth's Drizzle adapter (email/password + session).
//
// This file's shape (table names, columns, indexes) mirrors exactly what
// `@better-auth/drizzle-adapter`'s schema generator produces for our
// `lib/auth` config — modelNames pluralized to match this repo's table
// naming convention, and `advanced.database.generateId: "serial"` so ids
// stay integers like every other table in this schema.
//
// If the auth config in `lib/auth/src/auth.ts` changes (new fields, a new
// plugin), regenerate with `npx @better-auth/cli generate` against that
// config and reconcile the diff here — don't hand-edit column shapes.
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  // Not part of this branch's own work — copied verbatim from PR #90
  // (feature/account-plan-billing, not yet merged or approved). That PR's
  // own `pnpm run push` already added this column to our shared dev
  // database, so `main`'s copy of this file (which this branch started
  // from) not knowing about it made every push from this branch look like
  // it might be renaming `plan` into whatever new column this branch adds,
  // since drizzle-kit can't otherwise tell "add a column" from "rename this
  // other column no one told me about" without an interactive prompt this
  // environment can't answer. Declaring it here just catches this file up
  // to what's already true on the real database — remove this once PR #90
  // actually merges and `plan` is declared on `main` for real.
  plan: text("plan").default("free").notNull(),
  // Drives which region's rules the Care Recommendations Engine applies for
  // this account's pets (see care-recommendations.ts and PRD §7a). The auth
  // config (lib/auth/src/auth.ts) marks this `required: true`, and
  // `npx @better-auth/cli generate` accordingly generates this column as
  // `.notNull()` — deliberately overridden to nullable here: `required`
  // only enforces the field at signup for new accounts, but a straight
  // NOT NULL would break every account that existed before this field did
  // (no honest value to backfill them with — guessing a country would be
  // exactly the kind of error PRD §7a exists to prevent).
  country: text("country"),
});

export const sessions = pgTable(
  "sessions",
  {
    id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("sessions_userId_idx").on(table.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
    issuer: text("issuer").notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("accounts_issuer_accountId_uidx").on(
      table.issuer,
      table.accountId,
    ),
    index("accounts_userId_idx").on(table.userId),
  ],
);

export const verifications = pgTable(
  "verifications",
  {
    id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);
