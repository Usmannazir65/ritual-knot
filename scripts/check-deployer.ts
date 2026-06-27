/**
 * Sanity-check the deployer key WITHOUT printing it: shows the derived address
 * (public) and its RITUAL balance, so you know it's valid and funded.
 *
 *   bun run check:deployer
 */
import { createPublicClient, formatEther, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { addressUrl, ritualChain } from "../lib/ritual-chain";

const raw = process.env.PRIVATE_KEY;
if (!raw) {
  console.error("No PRIVATE_KEY found (add it to .env.local).");
  process.exit(1);
}
const key = (raw.startsWith("0x") ? raw : `0x${raw}`) as `0x${string}`;
if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
  console.error("PRIVATE_KEY is not a valid 32-byte hex key (expected 0x + 64 hex chars).");
  process.exit(1);
}

const account = privateKeyToAccount(key);
const client = createPublicClient({ chain: ritualChain, transport: http() });
const balance = await client.getBalance({ address: account.address });

console.log("Deployer address:", account.address);
console.log("Balance:        ", formatEther(balance), "RITUAL");
console.log("Explorer:       ", addressUrl(account.address));
if (balance === BigInt(0)) {
  console.log("\n⚠ Not funded. Send test RITUAL to that address from https://faucet.ritualfoundation.org");
} else {
  console.log("\n✓ Funded — ready to deploy:  bun run deploy:contract");
}
