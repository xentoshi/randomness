pub mod errors;
pub mod state;
pub mod instructions;
pub mod constants;

use anchor_lang::prelude::*;

pub use instructions::*;
pub use state::*;
pub use errors::*;

declare_id!("3pfz13JhzVwtWcZ9WRuQ4o5QjPAbzv9oF7fTsvi26Ptw");

#[program]
pub mod randomness {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, amount: u64) -> Result<()> {
        ctx.accounts.initialize(amount)
    }

    pub fn place_bet(ctx: Context<PlaceBet>, seed: u128, amount: u64, roll: u8) -> Result<()> {
        ctx.accounts.create_bet(seed, &ctx.bumps, amount, roll)?;
        let _ = ctx.accounts.deposit(amount);
        Ok(())
    }

    pub fn resolve_bet(ctx: Context<ResolveBet>, sig: Vec<u8>) -> Result<()> {
        ctx.accounts.verify_ed25519_signature(&sig)?;
        ctx.accounts.resolve_bet(&ctx.bumps, &sig)
    }

    pub fn refund_bet(ctx: Context<RefundBet>) -> Result<()> {
        ctx.accounts.refund_bet(&ctx.bumps)
    }
}
