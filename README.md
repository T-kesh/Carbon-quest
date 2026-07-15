# Carbon Quest

> **Status**: in development — nothing deployed yet. This README will grow section
> by section as each phase actually ships. Nothing below describes finished
> functionality unless explicitly marked done.

Carbon Quest is a field-journal-styled app that turns real-world environmental
action into a documented expedition. Plant a tree, sort waste, drop off e-waste —
submit proof, get peer-verified, earn a share of a seasonal cUSD reward pool. Not a
crypto dashboard: it's built to feel like an official conservation field journal,
not a fintech app.

Built on Celo. Identity/uniqueness verification via GoodDollar's GoodID.

## Why

Most ReFi apps either feel like spreadsheets with a green theme, or don't have a
credible sybil-resistance story for "did this person actually do this." Carbon
Quest pairs GoodID-verified real humans with a peer stake-to-vouch/dispute
mechanism and a shared seasonal pool — payouts are proportional to collective
verified activity, not a flat per-action rate.

## Tech stack

- Frontend: Next.js, MiniPay-compatible
- Contracts: Solidity on Celo
- Identity: GoodDollar GoodID
- Proof storage: IPFS
- Backend: Node/TS service (dispute window resolution, leaderboard indexing)

## Roadmap

See [`AGENT_TASKS.md`](./AGENT_TASKS_CARBON_QUEST.md) for the full build plan —
architecture decisions, contract design, UI direction, and the phased task list
from setup through post-MVP extended features.

## Getting started

_Not yet — setup instructions land here once Phase 0/1 are actually working
locally._

## License

_TBD._