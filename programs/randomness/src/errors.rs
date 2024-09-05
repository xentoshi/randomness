use anchor_lang::prelude::*;

#[error_code]
pub enum DiceError {
    #[msg("Bet not found")]
    BetNotFound,
    #[msg("Ed25519 signature verification failed")]
    Ed25519Signature,
    #[msg("Ed25519 public key verification failed")]
    Ed25519Pubkey,
    #[msg("Ed25519 data length verification failed")]
    Ed25519DataLength,
    #[msg("Ed25519 header verification failed")]
    Ed25519Header,
    #[msg("Ed25519 accounts verification failed")]
    Ed25519Accounts,
    #[msg("Ed25519 data verification failed")]
    Ed25519Data,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Ed25519 program verification failed")]
    Ed25519Program,
    #[msg("Timeout not reached")]
    TimeoutNotReached,
}