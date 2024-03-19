import * as anchor from "@project-serum/anchor";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
// import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";
import { utils } from "@project-serum/anchor";
import idl from "../idl.json";
import { useHelper } from "../Hooks/useHelper.tsx";
import { useMemo } from "react";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

const Locker = () => {
  const { connected } = useWallet();
  const { claimFees } = useHelper();
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

  const anchorWallet = useAnchorWallet();
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const testWallet1Seed = new Uint8Array([
    89, 23, 160, 27, 25, 218, 160, 136, 22, 234, 74, 127, 163, 95, 239, 11, 84,
    69, 103, 218, 75, 138, 231, 25, 188, 180, 194, 12, 23, 191, 214, 198, 48,
    205, 144, 242, 47, 230, 19, 140, 227, 46, 99, 48, 165, 29, 165, 88, 75, 4,
    93, 4, 93, 232, 57, 241, 29, 43, 184, 197, 108, 103, 164, 106,
  ]);
  const testWallet1 = Keypair.fromSecretKey(testWallet1Seed);
  const wallet1Signer = {
    publicKey: publicKey,
    secretKey: testWallet1Seed,
  };
  const providerWallet1 = new anchor.AnchorProvider(connection, testWallet1, {
    commitment: "confirmed",
  });
  anchor.setProvider(providerWallet1);
  const program = useMemo(() => {
    if (anchorWallet) {
      const provider = new anchor.AnchorProvider(
        connection,
        anchorWallet,
        anchor.AnchorProvider.defaultOptions()
      );
      return new anchor.Program(idl, PROGRAM_KEY, provider);
    }
  }, [connection, anchorWallet]);

  console.log("PROGRAM ++++++++++  : ", program);
  // const whirlpoolCtx = WhirlpoolContext.withProvider(
  //   providerWallet1,
  //   ORCA_WHIRLPOOL_PROGRAM_ID
  // );
  // const fetcher = whirlpoolCtx.fetcher;
  // const whirlpoolClient = buildWhirlpoolClient(whirlpoolCtx);
  // ###################################################################################################
  // ###################################################################################################
  // ###################################################################################################

  const unlock = async () => {
    console.log("UNLOCK POSITION TRIGERRED");

    try {
      const accounts = {
        position_mint: positionMint,
        whirlpoolPubkey: poolAddress,
      };

      const programId = program.programId;

      const position_ta = getAssociatedTokenAddressSync(
        accounts.position_mint,
        wallet1Signer.publicKey
      );
      // const [lockerDetails] = PublicKey.findProgramAddressSync([
      //   utils.bytes.utf8.encode("locker-details"),
      //   accounts.lockerCreatorPubkey.toBytes(),
      //   accounts.whirlpoolPubkey.toBytes(),
      // ], programId);

      const [lpPosition] = PublicKey.findProgramAddressSync(
        [
          utils.bytes.utf8.encode("lp-position"),
          accounts.whirlpoolPubkey.toBytes(),
          wallet1Signer.publicKey.toBytes(),
          accounts.position_mint.toBytes(),
        ],
        programId
      );

      const nftCustody = getAssociatedTokenAddressSync(
        accounts.position_mint,
        lpPosition,
        true
      );
      let ownerTokenAccount = await getAccount(connection, nftCustody);
      console.log(
        "ownerTokenAccount.amount.toString()",
        ownerTokenAccount.amount.toString()
      );
      const tx = await program.methods
        .unlockPosition()
        .accounts({
          position: lpPosition,
          nftMint: accounts.position_mint,
          nftReceiveAccount: position_ta,
          nftCustody: nftCustody,
          user: wallet1Signer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([wallet1Signer])
        .rpc();
      console.log("TX: ", tx);
    } catch (error) {
      console.log("ERR : ", error);
    }
  };

  // ###################################################################################################
  // ###################################################################################################
  // ###################################################################################################
  const lock = async () => {
    try {
      console.log("LOCK POSITION TRIGERRED");
      const currentTimestamp = Math.floor(new Date().getTime() / 1000);
      const lockPositionParams = {
        allowFeeClaim: true,
        cliff: 15 * 60,
        duration: 30 * 60,
        start: currentTimestamp,
      };
      const accounts = {
        position_mint: positionMint,
        whirlpoolPubkey: poolAddress,
      };
      const programId = program.programId;
      const [lpPosition] = PublicKey.findProgramAddressSync(
        [
          utils.bytes.utf8.encode("lp-position"),
          accounts.whirlpoolPubkey.toBytes(),
          wallet1Signer.publicKey.toBytes(),
          accounts.position_mint.toBytes(),
        ],
        programId
      );

      const position_ta = getAssociatedTokenAddressSync(
        accounts.position_mint,
        wallet1Signer.publicKey
      );
      console.log("position_ta", position_ta);
      let ownerTokenAccount = await getAccount(connection, position_ta);
      console.log(
        "ownerTokenAccount.amount.toString()",
        ownerTokenAccount.amount.toString(),
        ownerTokenAccount.owner
      );
      const nftCustody = getAssociatedTokenAddressSync(
        accounts.position_mint,
        lpPosition,
        true
      );

      console.log("lockPositionParams", lockPositionParams);
      const tx = await program.methods
        .lockPosition(
          lockPositionParams.cliff,
          lockPositionParams.start,
          lockPositionParams.duration,
          lockPositionParams.allowFeeClaim
        )
        .accounts({
          whirlpool: accounts.whirlpoolPubkey,
          position: lpPosition,
          nftToken: position_ta,
          nftMint: accounts.position_mint,
          nftCustody: nftCustody,
          user: wallet1Signer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([wallet1Signer])
        .rpc();
      console.log("TX: ", tx);
    } catch (error) {
      console.log("error   :  ", error);
    }
  };

  // const claimFees = async () => {
  //   console.log("CLAIM FEE  TRIGERRED");

  //   try {
  //     const programId = program.programId;
  //     const accounts = {
  //       position_mint: positionMint,
  //       whirlpoolPubkey: poolAddress,
  //       tokenOwnerAccountA: getAssociatedTokenAddressSync(
  //         devSAMO,
  //         testWallet1.publicKey
  //       ),
  //       tokenOwnerAccountB: getAssociatedTokenAddressSync(
  //         devUSDC,
  //         testWallet1.publicKey
  //       ),
  //     };
  //     // const [lockerDetails] = PublicKey.findProgramAddressSync([
  //     //     utils.bytes.utf8.encode("locker-details"),
  //     //     accounts.lockerCreatorPubkey.toBytes(),
  //     //     whirlpoolPubkey.toBytes(),
  //     //   ], programId);

  //     const [lpPosition] = PublicKey.findProgramAddressSync(
  //       [
  //         utils.bytes.utf8.encode("lp-position"),
  //         accounts.whirlpoolPubkey.toBytes(),
  //         wallet1Signer.publicKey.toBytes(),
  //         accounts.position_mint.toBytes(),
  //       ],
  //       programId
  //     );

  //     const position_ta = getAssociatedTokenAddressSync(
  //       accounts.position_mint,
  //       wallet1Signer.publicKey
  //     );
  //     let ownerTokenAccount = await getAccount(connection, position_ta);
  //     console.log(
  //       "ownerTokenAccount.amount.toString()",
  //       ownerTokenAccount.amount.toString()
  //     );
  //     const nftCustody = getAssociatedTokenAddressSync(
  //       accounts.position_mint,
  //       lpPosition,
  //       true
  //     );
  //     ownerTokenAccount = await getAccount(connection, nftCustody);
  //     console.log(
  //       "ownerTokenAccount.amount.toString()",
  //       ownerTokenAccount.amount.toString()
  //     );
  //     const client = whirlpoolClient;
  //     const whirlpoolPubkey = poolAddress;

  //     const pool = await client.getPool(whirlpoolPubkey);
  //     const positionPda = PDAUtil.getPosition(
  //       ORCA_WHIRLPOOL_PROGRAM_ID,
  //       accounts.position_mint
  //     ).publicKey;

  //     const tx = await program.methods
  //       .claimFees()
  //       .accounts({
  //         whirlpool: whirlpoolPubkey,
  //         whirlpoolPosition: positionPda,
  //         position: lpPosition,
  //         tokenOwnerAccountA: accounts.tokenOwnerAccountA,
  //         tokenOwnerAccountB: accounts.tokenOwnerAccountB,
  //         tokenVaultA: pool.getData().tokenVaultA,
  //         tokenVaultB: pool.getData().tokenVaultB,
  //         nftCustody: nftCustody,
  //         user: wallet1Signer.publicKey,
  //         tokenProgram: TOKEN_PROGRAM_ID,
  //         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //         systemProgram: SystemProgram.programId,
  //         whirlpoolProgram: ORCA_WHIRLPOOL_PROGRAM_ID,
  //       })
  //       .signers([wallet1Signer])
  //       .rpc();
  //     console.log("TX: ", tx);
  //   } catch (error) {
  //     console.log("ERROR   : ", error);
  //   }
  // };
  return (
    <>
      {connected ? (
        <>
          <br />
          <button onClick={unlock}>Unlock Position</button>
          <br />
          <br />
          <br />
          <button onClick={lock}>Lock Position</button>
          <br />
          <br />

          <br />

          <button onClick={claimFees}>Claim Fees</button>
        </>
      ) : (
        "PLEASE CONNECT YOUR WALLET"
      )}
    </>
  );
};

export default Locker;
