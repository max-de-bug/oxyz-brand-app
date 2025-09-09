import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  primaryKey,
  json,
  decimal,
  jsonb,
} from "drizzle-orm/pg-core";

config({ path: ".env" });

const connectionString = process.env.DATABASE_URL as string;
const client = postgres(connectionString, { max: 10, prepare: false });
export const db = drizzle(client);

//-------------------- USER
export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => [
    {
      compositePK: primaryKey({
        columns: [authenticator.userId, authenticator.credentialID],
      }),
    },
  ]
);

//-------------------- PRESETS
export const presets = pgTable("presets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  filter: json("filter").$type<{
    brightness?: number;
    contrast?: number;
    saturation?: number;
    sepia?: number;
  }>(),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Add this after the presets table definition
export const typography = pgTable("typography", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mimeType").notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  publicId: text("publicId"),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//-------------------- LOGOS
export const logos = pgTable("logos", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mimeType").notNull(),
  publicId: text("public_id"), // Cloudinary public ID

  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//-------------------- IMAGES
export const images = pgTable("images", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  publicId: text("public_id"), // Cloudinary public ID

  mimeType: text("mimeType").notNull(),
  size: integer("size").notNull(),
  width: integer("width"),
  height: integer("height"),
  description: text("description"),
  tags: text("tags").array(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//-------------------- DESIGNS
export const designs = pgTable("designs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  imageId: uuid("imageId").references(() => images.id, {
    onDelete: "cascade",
  }),
  logoId: uuid("logoId").references(() => logos.id),
  logoUrl: text("logoUrl"),
  imageUrl: text("imageUrl"),
  imageData: text("image_data").notNull(),
  collectionId: text("collection_id"),
  designState: text("design_state").notNull(),
  preset: json("preset").$type<{
    name: string;
    filter: {
      brightness?: number;
      contrast?: number;
      saturation?: number;
      sepia?: number;
    };
  }>(),
  textOverlay: json("textOverlay").$type<{
    text: string;
    fontSize: number;
    color: string;
    fontFamily: string;
    isBold: boolean;
    isItalic: boolean;
    isVisible: boolean;
  }>(),
  position: json("position").$type<{
    x: number;
    y: number;
    rotation: number;
    scale: number;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//-------------------- SAVED DESIGNS
export const savedDesigns = pgTable("saved_designs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
  designId: uuid("designId").references(() => designs.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  thumbnail: text("thumbnail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//-------------------- COLLECTIONS
export const collections = pgTable("collections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

//-------------------- COLLECTION DESIGNS
export const collectionDesigns = pgTable(
  "collection_designs",
  {
    collectionId: uuid("collectionId").references(() => collections.id, {
      onDelete: "cascade",
    }),
    designId: uuid("designId").references(() => designs.id, {
      onDelete: "cascade",
    }),
    addedAt: timestamp("addedAt").defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.collectionId, table.designId] }),
  })
);

//-------------------- EXPORTS
// Add this to your schema.ts file if it doesn't exist
export const designExports = pgTable("design_exports", {
  id: uuid("id").primaryKey(),
  designId: uuid("design_id")
    .notNull()
    .references(() => designs.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  url: text("url").notNull(),
  publicId: text("public_id").notNull(),
  format: text("format"),
  width: integer("width"),
  height: integer("height"),
  options: jsonb("options").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
//-------------------- SHARED DESIGNS
export const sharedDesigns = pgTable("shared_designs", {
  id: uuid("id").defaultRandom().primaryKey(),
  designId: uuid("designId").references(() => designs.id, {
    onDelete: "cascade",
  }),
  sharedByUserId: text("sharedByUserId").references(() => users.id),
  sharedWithUserId: text("sharedWithUserId").references(() => users.id),
  permissions: text("permissions").array(), // e.g., ['view', 'edit', 'export']
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});
