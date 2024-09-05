import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Randomness } from "../target/types/randomness";
import {
  Transaction,
  Ed25519Program,
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { randomBytes } from "crypto";
import { BN } from "bn.js";

describe("randomness", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Randomness as Program<Randomness>;

  const MSG = Uint8Array.from(Buffer.from("1337", "hex"));
  let house = new Keypair();
  let player = new Keypair();
  const seed = new BN("12345678901234567890"); // Example u128 value
  let vault = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), house.publicKey.toBuffer()],
    program.programId
  )[0];
  // Derive the bet PDA
  const [bet] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("bet"),
      vault.toBuffer(),
      seed.toArrayLike(Buffer, "le", 16), // Convert BN to 16-byte (128-bit) buffer
    ],
    program.programId
  );
  let signature: Uint8Array;

  it("Airdrop", async () => {
    await Promise.all(
      [house, player].map(async (k) => {
        return await anchor
          .getProvider()
          .connection.requestAirdrop(
            k.publicKey,
            1000 * anchor.web3.LAMPORTS_PER_SOL
          )
          .then(confirmTx);
      })
    );
  });

  it("Initialize", async () => {
    // Add your test here.
    let signature = await program.methods
      .initialize(new BN(LAMPORTS_PER_SOL).mul(new BN(100)))
      .accounts({
        house: house.publicKey,
        vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([house])
      .rpc()
      .then(confirmTx);
  });

  // Place bet
  it("Place a bet", async () => {
    // Add your test here.
    // Place the bet
    let signature = await program.methods
      .placeBet(
        seed,
        new BN(50), // amount
        100 // roll
      )
      .accounts({
        player: player.publicKey,
        house: house.publicKey,
        vault: vault,
        bet,
        systemProgram: SystemProgram.programId,
      })
      .signers([player])
      .rpc()
      .then(confirmTx);
  });

  it("Resolve a bet", async () => {
    let account = await anchor
      .getProvider()
      .connection.getAccountInfo(bet, "confirmed");
    let sig_ix = Ed25519Program.createInstructionWithPrivateKey({
      privateKey: house.secretKey,
      message: account.data.subarray(8),
    });

    const resolve_ix = await program.methods
      .resolveBet(Buffer.from(sig_ix.data.buffer.slice(16 + 32, 16 + 32 + 64)))
      .accounts({
        player: player.publicKey,
        house: house.publicKey,
        vault,
        bet,
        instructionSysvar: SYSVAR_INSTRUCTIONS_PUBKEY,
        systemProgram: SystemProgram.programId,
      })
      .signers([house])
      .instruction();

    const tx = new Transaction().add(sig_ix).add(resolve_ix);

    try {
      await sendAndConfirmTransaction(program.provider.connection, tx, [house]);
    } catch (error) {
      console.error("Error details:", error);
      throw error;
    }
  });
});

const confirmTx = async (signature: string): Promise<string> => {
  const latestBlockhash = await anchor
    .getProvider()
    .connection.getLatestBlockhash();
  await anchor.getProvider().connection.confirmTransaction(
    {
      signature,
      ...latestBlockhash,
    },
    "confirmed"
  );
  return signature;
};
