# RitualKnot · Tic Tac Toe — Onchain Arena

A single-player tic-tac-toe built for the **Ritual testnet** (chain 1979). Enter
a match for free, face a randomly drawn Ritual team member as your machine
opponent, and — if you beat them — **record the win onchain for 0.001 RITUAL**
to climb a global, verifiable leaderboard.

The signature moment is the **Endless-Knot Reveal**: the Ritual logo is the coin
you flip and the loader for every pending transaction.

## How it works (real, not mocked)

- **Wallet** — connect MetaMask / any injected EVM wallet via wagmi; the app
  adds/switches to Ritual Chain (1979) for you.
- **Entry is free** — the match (a client-side minimax AI with per-opponent
  "sharpness") runs in the browser.
- **Submit = 0.001 RITUAL** — the only onchain action. `submitScore(opponentId,
  moveCount)` is `payable`; the contract computes the score (100 base + speed
  bonus) and updates your running total + win count.
- **Leaderboard** — read live from the contract, ranked by score, verifiable on
  the Explorer.

Trust model (per the design brief): the client reports which opponent it beat
and in how many moves; the contract scores it. The match isn't re-run onchain.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript · **wagmi + viem**
· Bun. Contract: a single self-contained Solidity file compiled with `solc`.
Fonts: Oxanium (display) · Space Grotesk (body) · Space Mono (data).

```
app/            layout, providers (wagmi), globals.css, page
components/     game.tsx (screens + chain orchestration), hud, primitives, ritual-knot
contracts/      RitualArena.sol
lib/            game.ts (engine), use-game.ts (match state), use-arena.ts (chain),
                ritual-chain.ts, wagmi.ts, arena.ts (generated ABI), utils.ts
scripts/        build-contract.ts (compile), deploy-contract.ts (deploy)
public/         ritual-logo.svg + opponent avatars
```

## Deploy the contract (one-time)

The contract is **not deployed yet** — until it is, the UI runs but Submit will
say the contract isn't configured.

1. Fund a wallet with test RITUAL from <https://faucet.ritualfoundation.org>.
2. Deploy (the key is read from env only and never stored):

   ```bash
   PRIVATE_KEY=0xYOUR_TESTNET_KEY bun run deploy:contract
   ```

   This compiles `RitualArena.sol`, deploys to chain 1979, prints the address +
   Explorer link, and writes `NEXT_PUBLIC_ARENA_ADDRESS` to `.env.local`.
3. Restart the dev server so the frontend reads the new address.

`bun run build:contract` recompiles the ABI (`lib/arena.ts`) without deploying.

## Develop

```bash
bun install
bun run dev          # http://localhost:3200
bun run build        # production build
bun run typecheck
bun run lint
```

Then connect a wallet (it'll prompt to add Ritual Chain), play a match, and on a
win hit **Submit Score · 0.001 RITUAL**.

## Network

| | |
|---|---|
| Chain ID | `1979` |
| RPC | `https://rpc.ritualfoundation.org` |
| Currency | RITUAL (native, 18 decimals) |
| Explorer | `https://explorer.ritualfoundation.org` |
| Faucet | `https://faucet.ritualfoundation.org` |
