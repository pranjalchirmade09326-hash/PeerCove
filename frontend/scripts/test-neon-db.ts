import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testNeon() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in .env.local");
  }
  console.log("Connecting to Neon URL:", connectionString.replace(/:[^:@]+@/, ":***@"));
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  const client = await pool.connect();
  const res = await client.query("SELECT current_database(), current_user, version(), NOW() as now");
  console.log("Neon Database Name:", res.rows[0].current_database);
  console.log("Neon Current User:", res.rows[0].current_user);
  console.log("Neon Server Time:", res.rows[0].now);
  console.log("PostgreSQL Version:", res.rows[0].version.substring(0, 45));

  const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name LIMIT 15");
  console.log("Tables synced in Neon:", tables.rows.map((r: any) => r.table_name).join(", "));
  
  client.release();
  await pool.end();
}

testNeon().then(() => {
  console.log("LIVE NEON POSTGRESQL END-TO-END TEST: SUCCESSFUL!");
  process.exit(0);
}).catch(err => {
  console.error("Neon Connection Error:", err);
  process.exit(1);
});
