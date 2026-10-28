import { BlockchainBlock, DistributionRecord } from '../types';

/**
 * Simple client-side pseudo SHA-256 hash generator for audit logs
 */
export function generateHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  
  // Expand to standard 64-character SHA-256 lookalike format
  let extended = '0x' + hex;
  while (extended.length < 66) {
    extended += Math.abs(Math.sin(extended.length) * 10000).toString(16).substring(2, 6);
  }
  return extended.substring(0, 66);
}

/**
 * Creates a digital aid distribution receipt transaction block
 */
export function createDistributionHash(record: Partial<DistributionRecord>): string {
  const payload = `${record.receiptId}-${record.beneficiaryQrId}-${record.volunteerId}-${record.timestamp}-${JSON.stringify(record.itemsDistributed)}`;
  return generateHash(payload);
}

/**
 * Creates a new block in the simulated immutable aid distribution ledger
 */
export function createNewBlock(
  previousBlock: BlockchainBlock,
  receiptIds: string[],
  verifierName: string
): BlockchainBlock {
  const index = previousBlock.index + 1;
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const payload = `${index}-${previousBlock.hash}-${timestamp}-${receiptIds.join(',')}-${verifierName}`;
  const hash = generateHash(payload);

  return {
    index,
    timestamp,
    transactionsCount: receiptIds.length,
    previousHash: previousBlock.hash,
    hash,
    receiptIds,
    verifiedBy: verifierName
  };
}
