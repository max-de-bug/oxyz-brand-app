"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sharedDesigns = exports.designExports = exports.collectionDesigns = exports.collections = exports.savedDesigns = exports.designs = exports.images = exports.logos = exports.presets = exports.authenticators = exports.verificationTokens = exports.sessions = exports.accounts = exports.users = exports.db = void 0;
const dotenv_1 = require("dotenv");
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = require("postgres");
const pg_core_1 = require("drizzle-orm/pg-core");
(0, dotenv_1.config)({ path: ".env" });
const connectionString = process.env.DATABASE_URL;
const client = (0, postgres_1.default)(connectionString, { max: 10, prepare: false });
exports.db = (0, postgres_js_1.drizzle)(client);
exports.users = (0, pg_core_1.pgTable)("user", {
    id: (0, pg_core_1.text)("id")
        .primaryKey()
        .$defaultFn(() => crypto.randomUUID()),
    name: (0, pg_core_1.text)("name"),
    email: (0, pg_core_1.text)("email").unique().notNull(),
    emailVerified: (0, pg_core_1.timestamp)("emailVerified", { mode: "date" }),
    image: (0, pg_core_1.text)("image"),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
});
exports.accounts = (0, pg_core_1.pgTable)("account", {
    userId: (0, pg_core_1.text)("userId")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    type: (0, pg_core_1.text)("type").$type().notNull(),
    provider: (0, pg_core_1.text)("provider").notNull(),
    providerAccountId: (0, pg_core_1.text)("providerAccountId").notNull(),
    refresh_token: (0, pg_core_1.text)("refresh_token"),
    access_token: (0, pg_core_1.text)("access_token"),
    expires_at: (0, pg_core_1.integer)("expires_at"),
    token_type: (0, pg_core_1.text)("token_type"),
    scope: (0, pg_core_1.text)("scope"),
    id_token: (0, pg_core_1.text)("id_token"),
    session_state: (0, pg_core_1.text)("session_state"),
}, (account) => ({
    compoundKey: (0, pg_core_1.primaryKey)({
        columns: [account.provider, account.providerAccountId],
    }),
}));
exports.sessions = (0, pg_core_1.pgTable)("session", {
    sessionToken: (0, pg_core_1.text)("sessionToken").primaryKey(),
    userId: (0, pg_core_1.text)("userId")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    expires: (0, pg_core_1.timestamp)("expires", { mode: "date" }).notNull(),
});
exports.verificationTokens = (0, pg_core_1.pgTable)("verificationToken", {
    identifier: (0, pg_core_1.text)("identifier").notNull(),
    token: (0, pg_core_1.text)("token").notNull(),
    expires: (0, pg_core_1.timestamp)("expires", { mode: "date" }).notNull(),
}, (verificationToken) => [
    {
        compositePk: (0, pg_core_1.primaryKey)({
            columns: [verificationToken.identifier, verificationToken.token],
        }),
    },
]);
exports.authenticators = (0, pg_core_1.pgTable)("authenticator", {
    credentialID: (0, pg_core_1.text)("credentialID").notNull().unique(),
    userId: (0, pg_core_1.text)("userId")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    providerAccountId: (0, pg_core_1.text)("providerAccountId").notNull(),
    credentialPublicKey: (0, pg_core_1.text)("credentialPublicKey").notNull(),
    counter: (0, pg_core_1.integer)("counter").notNull(),
    credentialDeviceType: (0, pg_core_1.text)("credentialDeviceType").notNull(),
    credentialBackedUp: (0, pg_core_1.boolean)("credentialBackedUp").notNull(),
    transports: (0, pg_core_1.text)("transports"),
}, (authenticator) => [
    {
        compositePK: (0, pg_core_1.primaryKey)({
            columns: [authenticator.userId, authenticator.credentialID],
        }),
    },
]);
exports.presets = (0, pg_core_1.pgTable)("presets", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.text)("userId").references(() => exports.users.id, { onDelete: "cascade" }),
    name: (0, pg_core_1.text)("name").notNull(),
    filter: (0, pg_core_1.json)("filter").$type(),
    isDefault: (0, pg_core_1.boolean)("isDefault").default(false),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
});
exports.logos = (0, pg_core_1.pgTable)("logos", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.text)("userId").references(() => exports.users.id, { onDelete: "cascade" }),
    url: (0, pg_core_1.text)("url").notNull(),
    filename: (0, pg_core_1.text)("filename").notNull(),
    mimeType: (0, pg_core_1.text)("mimeType").notNull(),
    publicId: (0, pg_core_1.text)("public_id"),
    size: (0, pg_core_1.integer)("size").notNull(),
    width: (0, pg_core_1.integer)("width"),
    height: (0, pg_core_1.integer)("height"),
    isDefault: (0, pg_core_1.boolean)("isDefault").default(false),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
});
exports.images = (0, pg_core_1.pgTable)("images", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.text)("userId").references(() => exports.users.id, { onDelete: "cascade" }),
    url: (0, pg_core_1.text)("url").notNull(),
    filename: (0, pg_core_1.text)("filename").notNull(),
    publicId: (0, pg_core_1.text)("public_id"),
    mimeType: (0, pg_core_1.text)("mimeType").notNull(),
    size: (0, pg_core_1.integer)("size").notNull(),
    width: (0, pg_core_1.integer)("width"),
    height: (0, pg_core_1.integer)("height"),
    description: (0, pg_core_1.text)("description"),
    tags: (0, pg_core_1.text)("tags").array(),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
});
exports.designs = (0, pg_core_1.pgTable)("designs", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.text)("userId")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    name: (0, pg_core_1.text)("name").notNull(),
    imageId: (0, pg_core_1.uuid)("imageId").references(() => exports.images.id, {
        onDelete: "cascade",
    }),
    logoId: (0, pg_core_1.uuid)("logoId").references(() => exports.logos.id),
    logoUrl: (0, pg_core_1.uuid)("logoUrl").references(() => exports.images.id),
    imageUrl: (0, pg_core_1.uuid)("imageUrl").references(() => exports.images.url),
    imageData: (0, pg_core_1.text)("image_data").notNull(),
    collectionId: (0, pg_core_1.text)("collection_id"),
    designState: (0, pg_core_1.text)("design_state").notNull(),
    preset: (0, pg_core_1.json)("preset").$type(),
    textOverlay: (0, pg_core_1.json)("textOverlay").$type(),
    position: (0, pg_core_1.json)("position").$type(),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
});
exports.savedDesigns = (0, pg_core_1.pgTable)("saved_designs", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.text)("userId").references(() => exports.users.id, { onDelete: "cascade" }),
    designId: (0, pg_core_1.uuid)("designId").references(() => exports.designs.id, {
        onDelete: "cascade",
    }),
    name: (0, pg_core_1.text)("name").notNull(),
    thumbnail: (0, pg_core_1.text)("thumbnail"),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
});
exports.collections = (0, pg_core_1.pgTable)("collections", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    userId: (0, pg_core_1.text)("userId").references(() => exports.users.id, { onDelete: "cascade" }),
    name: (0, pg_core_1.text)("name").notNull(),
    description: (0, pg_core_1.text)("description"),
    isPublic: (0, pg_core_1.boolean)("isPublic").default(false),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updatedAt").defaultNow().notNull(),
});
exports.collectionDesigns = (0, pg_core_1.pgTable)("collection_designs", {
    collectionId: (0, pg_core_1.uuid)("collectionId").references(() => exports.collections.id, {
        onDelete: "cascade",
    }),
    designId: (0, pg_core_1.uuid)("designId").references(() => exports.designs.id, {
        onDelete: "cascade",
    }),
    addedAt: (0, pg_core_1.timestamp)("addedAt").defaultNow().notNull(),
}, (table) => ({
    pk: (0, pg_core_1.primaryKey)({ columns: [table.collectionId, table.designId] }),
}));
exports.designExports = (0, pg_core_1.pgTable)("design_exports", {
    id: (0, pg_core_1.uuid)("id").primaryKey(),
    designId: (0, pg_core_1.uuid)("design_id")
        .notNull()
        .references(() => exports.designs.id, { onDelete: "cascade" }),
    userId: (0, pg_core_1.text)("user_id").notNull(),
    url: (0, pg_core_1.text)("url").notNull(),
    publicId: (0, pg_core_1.text)("public_id").notNull(),
    format: (0, pg_core_1.text)("format"),
    width: (0, pg_core_1.integer)("width"),
    height: (0, pg_core_1.integer)("height"),
    options: (0, pg_core_1.jsonb)("options").$type(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.sharedDesigns = (0, pg_core_1.pgTable)("shared_designs", {
    id: (0, pg_core_1.uuid)("id").defaultRandom().primaryKey(),
    designId: (0, pg_core_1.uuid)("designId").references(() => exports.designs.id, {
        onDelete: "cascade",
    }),
    sharedByUserId: (0, pg_core_1.text)("sharedByUserId").references(() => exports.users.id),
    sharedWithUserId: (0, pg_core_1.text)("sharedWithUserId").references(() => exports.users.id),
    permissions: (0, pg_core_1.text)("permissions").array(),
    createdAt: (0, pg_core_1.timestamp)("createdAt").defaultNow().notNull(),
    expiresAt: (0, pg_core_1.timestamp)("expiresAt"),
});
//# sourceMappingURL=schema.js.map