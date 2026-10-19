# Why Block Pramana

I traded crypto and used Web3 applications between 2021 and 2024. When researching
projects, I looked at market cap, token supply, vesting schedules, investor allocations,
rewards, and the purpose of the project. Sites such as CoinGecko and CryptoRank helped
me understand those concepts, but I depended on the data they presented.

I want to understand how these mechanisms work in code and how much of the reported
information I can establish from the chain myself.

Block Pramana is where I am working through that question. It starts with reading token
supply at one block. From there, I want to investigate minting, burns, releases from
vesting contracts, and the difference between an observed event and a supported claim.

The service is designed to run independently and expose an API so others can use it or
self-host it. Yellowkey is the intended first integration, once the data and its limits
are understood.

The goal is to learn the architecture, implement a small part, test what can fail, and
explain the result before moving on. Each feature should make its evidence and
assumptions visible.
