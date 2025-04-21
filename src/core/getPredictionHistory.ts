import { EventLog, JsonRpcProvider } from "ethers";
import CONFIGS from "./configs";
import { BetManager__factory } from "typechain";

export async function getPredictionHistory(
  chainId: number,
  address: string,
  addEvents: (event: EventLog[]) => void
) {
  const config = CONFIGS[chainId];
  const provider = new JsonRpcProvider(config.rpcUrl);
  const bm = BetManager__factory.connect(config.RangeBetManager, provider);

  const filter = bm.filters.TokensBought(undefined, address);

  const BATCH_SIZE = 1000; // 한 번에 조회할 블록 수
  const MIN_BLOCK = config.createdBlocknum; // 최소 블록 (필요에 따라 조정)
  const PARALLEL_CHUNKS = 20; // 병렬로 처리할 청크 수

  const currentBlock = await provider.getBlockNumber();
  const totalBlocks = currentBlock - MIN_BLOCK;
  const totalBatches = Math.ceil(totalBlocks / BATCH_SIZE);

  for (
    let batchStart = 0;
    batchStart < totalBatches;
    batchStart += PARALLEL_CHUNKS
  ) {
    const batchPromises = [];

    // 병렬로 처리할 배치 그룹 생성
    for (let i = 0; i < PARALLEL_CHUNKS && batchStart + i < totalBatches; i++) {
      const batchIndex = batchStart + i;
      const toBlock = currentBlock - batchIndex * BATCH_SIZE;
      const fromBlock = Math.max(toBlock - BATCH_SIZE + 1, MIN_BLOCK);

      // 각 배치에 대한 이벤트 조회 함수
      const fetchBatch = async () => {
        try {
          const events = await bm.queryFilter(filter, fromBlock, toBlock);
          return events;
        } catch (error) {
          console.error(
            `Error fetching events from ${fromBlock} to ${toBlock}:`,
            error
          );
          return [];
        }
      };

      batchPromises.push(fetchBatch());
    }

    const batchResults = await Promise.all(batchPromises);
    for (const events of batchResults) {
      if (events.length > 0) {
        addEvents(events as unknown as EventLog[]);
      }
    }
  }
}
