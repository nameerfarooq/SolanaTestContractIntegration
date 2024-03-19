import * as anchor from "@project-serum/anchor";
import { Signer } from "@solana/web3.js";
import {
  WhirlpoolContext,
  buildWhirlpoolClient,
  ORCA_WHIRLPOOL_PROGRAM_ID,
  PDAUtil,
} from "@orca-so/whirlpools-sdk";
import { AnchorProvider } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import idl from "../idl.json";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { useEffect, useMemo } from "react";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
export function useHelper() {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();
  const { publicKey, connected } = useWallet();

  const PROGRAM_KEY = new PublicKey(
    "G75LASowPG4GZCcdFRe9mrbJeAoUeYkPJJWyC1YhPkwa"
  );
  //devUSDC / devUSDT
  const poolAddress = new PublicKey(
    "EgxU92G34jw6QDG9RuTX9StFg1PmHuDqkRKAE5kVEiZ4"
  );
  // const position = await openPosition(poolAddress, whirlpoolClient, 50, true)
  const positionMint = new PublicKey(
    "DDPRv1KRq6dicZzGSKTdcUu7ryvwRyiuXYqgWe6ut8je"
  );
  const devUSDC = new PublicKey("BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k");

  const devSAMO = new PublicKey("Jd4M8bfJG3sAkd82RsGWyEXoaBXQP7njFzBwEaCTuDa");
  const program = useMemo(() => {
    if (anchorWallet) {
      const provider = new anchor.AnchorProvider(
        connection,
        anchorWallet,
        anchor.AnchorProvider.defaultOptions()
      );
      return new anchor.Program(idl as anchor.Idl, PROGRAM_KEY, provider);
    }
  }, [connection, anchorWallet]);

  const testWallet1Seed = new Uint8Array([
    89, 23, 160, 27, 25, 218, 160, 136, 22, 234, 74, 127, 163, 95, 239, 11, 84,
    69, 103, 218, 75, 138, 231, 25, 188, 180, 194, 12, 23, 191, 214, 198, 48,
    205, 144, 242, 47, 230, 19, 140, 227, 46, 99, 48, 165, 29, 165, 88, 75, 4,
    93, 4, 93, 232, 57, 241, 29, 43, 184, 197, 108, 103, 164, 106,
  ]);
  const testWallet1 = Keypair.fromSecretKey(testWallet1Seed);
  const providerWallet1 = new AnchorProvider(
    connection,
    new NodeWallet(testWallet1),
    {
      commitment: "confirmed",
    }
  );
  const whirlpoolCtx = WhirlpoolContext.withProvider(
    providerWallet1,
    ORCA_WHIRLPOOL_PROGRAM_ID
  );
  const whirlpoolClient = buildWhirlpoolClient(whirlpoolCtx);
  let signers: Signer[] = [];
  const wallet1Signer = {
    publicKey: publicKey,
    secretKey: testWallet1Seed,
  };
  // Check if wallet1Signer.publicKey is not null
  if (wallet1Signer.publicKey) {
    // Create a Signer object using the publicKey and secretKey from wallet1Signer
    const signer = {
      publicKey: wallet1Signer.publicKey,
      secretKey: wallet1Signer.secretKey,
    };
    // Add the Signer object to the signers array
    signers.push(signer);
  } else {
    // throw new Error("Wallet1 signer publicKey is null");
  }
  const claimFees = async () => {
    console.log("CLAIM FEE TRIGERRED");
    const accounts = {
      position_mint: positionMint,
      whirlpoolPubkey: poolAddress,
      tokenOwnerAccountA: getAssociatedTokenAddressSync(
        devSAMO,
        testWallet1.publicKey
      ),
      tokenOwnerAccountB: getAssociatedTokenAddressSync(
        devUSDC,
        testWallet1.publicKey
      ),
    };

    try {
      const programId = program?.programId;

      const publicKeyBytes = wallet1Signer.publicKey?.toBytes();
      if (!publicKeyBytes) {
        throw new Error("Public key is null or undefined.");
      }
      if (!programId) {
        throw new Error("Program ID is not defined.");
      }
      const [lpPosition] = PublicKey.findProgramAddressSync(
        [
          anchor.utils.bytes.utf8.encode("lp-position"),
          accounts.whirlpoolPubkey.toBytes(),
          publicKeyBytes,
          accounts.position_mint.toBytes(),
        ],
        programId
      );
      if (wallet1Signer && wallet1Signer.publicKey) {
      } else {
        throw new Error("wallet1Signer or its publicKey is null.");
      }
      const position_ta = getAssociatedTokenAddressSync(
        accounts.position_mint,
        wallet1Signer.publicKey
      );
      let ownerTokenAccount = await getAccount(connection, position_ta);
      console.log(
        "ownerTokenAccount.amount.toString()",
        ownerTokenAccount.amount.toString()
      );
      const nftCustody = getAssociatedTokenAddressSync(
        accounts.position_mint,
        lpPosition,
        true
      );
      ownerTokenAccount = await getAccount(connection, nftCustody);
      console.log(
        "ownerTokenAccount.amount.toString()",
        ownerTokenAccount.amount.toString()
      );
      const client = whirlpoolClient;
      const whirlpoolPubkey = poolAddress;

      const pool = await client.getPool(whirlpoolPubkey);
      const positionPda = PDAUtil.getPosition(
        ORCA_WHIRLPOOL_PROGRAM_ID,
        accounts.position_mint
      ).publicKey;
      if (wallet1Signer && wallet1Signer?.publicKey) {
        const tx = await program.methods
          .claimFees()
          .accounts({
            whirlpool: whirlpoolPubkey,
            whirlpoolPosition: positionPda,
            position: lpPosition,
            tokenOwnerAccountA: accounts.tokenOwnerAccountA,
            tokenOwnerAccountB: accounts.tokenOwnerAccountB,
            tokenVaultA: pool.getData().tokenVaultA,
            tokenVaultB: pool.getData().tokenVaultB,
            nftCustody: nftCustody,
            user: wallet1Signer.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            whirlpoolProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
          })
          .signers(signers)
          .rpc();
        console.log("TX: ", tx);
      } else {
        throw new Error("wallet1Signer or its publicKey is null.");
      }
    } catch (error) {
      console.log("ERROR   : ", error);
    }
  };

  return { claimFees };
}
