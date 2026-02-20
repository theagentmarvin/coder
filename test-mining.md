# Bitcoin Mining Guide

## Table of Contents
*(Generated automatically)*

## Introduction[^1]

Bitcoin mining is the process of adding transaction records to Bitcoin's public ledger of past transactions, known as the blockchain[^footnote].

Mining secures the network and verifies transactions. Miners are rewarded with newly created bitcoins and transaction fees.

## How It Works

### Proof of Work (PoW)

Miners compete to solve a cryptographic puzzle:

1. Collect transactions into a block.
2. Hash the block header repeatedly until finding a hash below the target difficulty.
3. Broadcast the solution.

```python
import hashlib

def mine(block_header, difficulty):
    target = '0' * difficulty
    nonce = 0
    while True:
        hash_result = hashlib.sha256((block_header + str(nonce)).encode()).hexdigest()
        if hash_result.startswith(target):
            return nonce
        nonce += 1
```

### Hardware Evolution

| Era | Hardware | Hashrate |
|-----|----------|----------|
| 2009 | CPU | 2 MH/s |
| 2011 | GPU | 200 MH/s |
| 2013 | FPGA | 500 MH/s |
| 2014+ | ASIC | 100+ TH/s |

## Economics

- **Reward**: 3.125 BTC/block (post-2024 halving)
- **Electricity**: Major cost
- **Profitability**: Calculate ROI with tools like [WhatToMine](https://whattomine.com)

## Challenges

- High energy consumption
- Centralization in mining pools
- 51% attacks (theoretical)

[^1]: Original whitepaper by Satoshi Nakamoto.
[^footnote]: The blockchain is a distributed database.
