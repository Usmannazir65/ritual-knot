/**
 * Deploy RitualArena to Ritual Chain (1979).
 *
 *   PRIVATE_KEY=0x... bun run deploy:contract
 *
 * The key is read from the environment only and never written anywhere. On
 * success the deployed address is printed and saved to .env.local as
 * NEXT_PUBLIC_ARENA_ADDRESS so the frontend picks it up.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPublicClient, createWalletClient, formatEther, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ARENA_ABI, ARENA_BYTECODE } from "../lib/arena";
import { addressUrl, ritualChain } from "../lib/ritual-chain";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const raw = process.env.PRIVATE_KEY;
if (!raw) {
  console.error("Missing PRIVATE_KEY. Run:  PRIVATE_KEY=0x... bun run deploy:contract");
  process.exit(1);
}
const key = (raw.startsWith("0x") ? raw : `0x${raw}`) as `0x${string}`;
const account = privateKeyToAccount(key);

const publicClient = createPublicClient({ chain: ritualChain, transport: http() });
const walletClient = createWalletClient({ account, chain: ritualChain, transport: http() });

console.log(`Deployer: ${account.address}`);
const balance = await publicClient.getBalance({ address: account.address });
console.log(`Balance:  ${formatEther(balance)} RITUAL`);
if (balance === BigInt(0)) {
  console.error("Deployer has 0 RITUAL — fund it at https://faucet.ritualfoundation.org first.");
  process.exit(1);
}

console.log("Deploying RitualArena…");
const hash = await walletClient.deployContract({
  abi: ARENA_ABI,
  bytecode: ARENA_BYTECODE,
  account,
});
console.log(`Deploy tx: ${hash}`);

const receipt = await publicClient.waitForTransactionReceipt({ hash });
const address = receipt.contractAddress;
if (!address) {
  console.error("No contract address in receipt — deployment failed.");
  process.exit(1);
}

console.log(`\n✓ RitualArena deployed at ${address}`);
console.log(`  ${addressUrl(address)}`);

// Persist for the frontend.
const envPath = join(root, ".env.local");
const line = `NEXT_PUBLIC_ARENA_ADDRESS=${address}`;
let env = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
if (/^NEXT_PUBLIC_ARENA_ADDRESS=.*$/m.test(env)) {
  env = env.replace(/^NEXT_PUBLIC_ARENA_ADDRESS=.*$/m, line);
} else {
  env += (env && !env.endsWith("\n") ? "\n" : "") + line + "\n";
}
writeFileSync(envPath, env);
console.log(`  wrote ${line} → .env.local`);
console.log("\nRestart the dev server so the frontend reads the new address.");
