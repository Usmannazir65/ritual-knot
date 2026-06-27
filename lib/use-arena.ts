"use client";

import { useCallback, useMemo } from "react";
import { createPublicClient, formatEther, http, parseEther } from "viem";
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { ARENA_ABI, ARENA_ADDRESS, SUBMIT_FEE_ETHER } from "@/lib/arena";
import { ritualChain } from "@/lib/ritual-chain";

const arenaAddress = (ARENA_ADDRESS || undefined) as `0x${string}` | undefined;

// Standalone client for awaiting receipts (the connected wallet handles writes).
const publicClient = createPublicClient({ chain: ritualChain, transport: http() });

export type LeaderEntry = {
  address: `0x${string}`;
  score: number;
  wins: number;
  rank: number;
  me: boolean;
};

/** All Ritual-Chain reads/writes for the arena, in one hook. */
export function useArena() {
  const { address, isConnected, chainId } = useAccount();
  const { connectAsync, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const contractReady = !!arenaAddress;
  const onRitualChain = chainId === ritualChain.id;

  const balance = useBalance({
    address,
    chainId: ritualChain.id,
    query: { enabled: !!address },
  });

  const statsRead = useReadContract({
    abi: ARENA_ABI,
    address: arenaAddress,
    functionName: "stats",
    args: address ? [address] : undefined,
    query: { enabled: contractReady && !!address },
  });

  const lbRead = useReadContract({
    abi: ARENA_ABI,
    address: arenaAddress,
    functionName: "leaderboard",
    query: { enabled: contractReady, refetchInterval: 15_000 },
  });

  const connect = useCallback(async () => {
    // Prefer a wallet discovered via EIP-6963 (e.g. "io.metamask") over the
    // generic injected fallback, then fall back to whatever's available.
    const discovered = connectors.find((c) => c.type === "injected" && c.id !== "injected");
    const connector = discovered ?? connectors.find((c) => c.type === "injected") ?? connectors[0];
    if (!connector) throw new Error("No EVM wallet detected. Install MetaMask, then refresh.");
    await connectAsync({ connector, chainId: ritualChain.id });
  }, [connectAsync, connectors]);

  const switchToRitual = useCallback(async () => {
    await switchChainAsync({ chainId: ritualChain.id });
  }, [switchChainAsync]);

  const submit = useCallback(
    async (opponentId: number, moveCount: number) => {
      if (!arenaAddress) throw new Error("Arena contract address is not configured.");
      // Ritual Chain rejects legacy (type-0) txs ("transaction type not
      // supported"). Force EIP-1559 with explicit fees so injected wallets
      // (e.g. MetaMask on a custom chain) don't fall back to legacy.
      const fees = await publicClient.estimateFeesPerGas();
      return writeContractAsync({
        abi: ARENA_ABI,
        address: arenaAddress,
        functionName: "submitScore",
        args: [opponentId, moveCount],
        value: parseEther(SUBMIT_FEE_ETHER),
        chainId: ritualChain.id,
        type: "eip1559",
        maxFeePerGas: fees.maxFeePerGas,
        maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      });
    },
    [writeContractAsync],
  );

  const waitForReceipt = useCallback(
    (hash: `0x${string}`) => publicClient.waitForTransactionReceipt({ hash }),
    [],
  );

  const refresh = useCallback(() => {
    statsRead.refetch();
    lbRead.refetch();
    balance.refetch();
  }, [statsRead, lbRead, balance]);

  const leaderboard = useMemo<LeaderEntry[]>(() => {
    const data = lbRead.data;
    if (!data) return [];
    const [addrs, scores, winCounts] = data;
    const rows = addrs.map((a, i) => ({
      address: a,
      score: Number(scores[i]),
      wins: Number(winCounts[i]),
    }));
    rows.sort((x, y) => y.score - x.score || y.wins - x.wins);
    return rows.map((r, i) => ({
      ...r,
      rank: i + 1,
      me: !!address && r.address.toLowerCase() === address.toLowerCase(),
    }));
  }, [lbRead.data, address]);

  const score = statsRead.data ? Number(statsRead.data[0]) : 0;
  const wins = statsRead.data ? Number(statsRead.data[1]) : 0;
  const rank = leaderboard.find((e) => e.me)?.rank ?? null;
  const balanceText = balance.data ? Number(formatEther(balance.data.value)).toFixed(3) : "—";

  return {
    // connection
    address,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    // network
    chainId,
    onRitualChain,
    switchToRitual,
    isSwitching,
    // wallet / stats
    balanceText,
    score,
    wins,
    rank,
    statsLoading: statsRead.isLoading,
    // leaderboard
    leaderboard,
    leaderboardLoading: lbRead.isLoading,
    // contract
    contractReady,
    submit,
    waitForReceipt,
    refresh,
  };
}
