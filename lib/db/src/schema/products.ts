import { pgTable, serial, text, numeric, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: numeric("original_price", { precision: 10, scale: 2 }),
  promoPrice: numeric("promo_price", { precision: 10, scale: 2 }),
  promoEndDate: timestamp("promo_end_date"),
  image: text("image").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  badge: text("badge"),
  installments: text("installments"),
  rating: text("rating").default("5.0"),
  reviewCount: text("review_count").default("0"),
  active: boolean("active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Product = typeof productsTable.$inferSelect;
