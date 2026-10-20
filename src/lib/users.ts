import bcrypt from "bcryptjs";
import { getDb } from "./mongodb";
import { COLLECTIONS, type UserDoc } from "./types";

export interface AuthUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

export async function verifyCredentials(email: string, password: string): Promise<AuthUser | null> {
  const db = await getDb();
  const user = await db
    .collection<UserDoc>(COLLECTIONS.users)
    .findOne({ email: email.trim().toLowerCase() });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { id: user._id.toHexString(), email: user.email, isAdmin: user.isAdmin === true };
}

export async function upsertAdmin(email: string, password: string): Promise<void> {
  const db = await getDb();
  const passwordHash = await bcrypt.hash(password, 12);
  await db.collection<UserDoc>(COLLECTIONS.users).updateOne(
    { email: email.trim().toLowerCase() },
    {
      $set: { passwordHash, isAdmin: true },
      $setOnInsert: { email: email.trim().toLowerCase(), createdAt: new Date() },
    },
    { upsert: true },
  );
}
