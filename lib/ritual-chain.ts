import { defineChain } from "viem";

// Ritual Chain (EVM testnet). RITUAL is the native gas coin (18 decimals),
// so the 0.001 submit fee is a plain native value transfer. ~350ms blocks.
// Source: docs.ritualfoundation.org / ritual-dapp-skills (chain 1979).
export const RITUAL_RPC_URL =
  process.env.NEXT_PUBLIC_RITUAL_RPC_URL ?? process.env.RITUAL_RPC_URL ?? "https://rpc.ritualfoundation.org";

export const RITUAL_EXPLORER_URL = "https://explorer.ritualfoundation.org";

export const ritualChain = defineChain({
  id: 1979,
  name: "Ritual",
  nativeCurrency: { name: "Ritual", symbol: "RITUAL", decimals: 18 },
  rpcUrls: {
    default: {
      http: [RITUAL_RPC_URL],
      webSocket: ["wss://rpc.ritualfoundation.org/ws"],
    },
  },
  blockExplorers: {
    default: { name: "Ritual Explorer", url: RITUAL_EXPLORER_URL },
  },
  // NOTE: no multicall3 — there is no Multicall3 deployed at the canonical
  // address on Ritual Chain (eth_call returns "0x"). Declaring it makes wagmi
  // batch reads through it, get empty data, and retry forever. Without it,
  // reads fall back to individual eth_calls, which work.
  testnet: true,
});

/** Explorer link helpers. */
export const txUrl = (hash: string) => `${RITUAL_EXPLORER_URL}/tx/${hash}`;
export const addressUrl = (address: string) => `${RITUAL_EXPLORER_URL}/address/${address}`;
