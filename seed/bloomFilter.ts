import { initializeRedisClient } from "../utils/client";
import { bloomKey } from "../utils/keys";


async function createBloomFilter() {
    const client = await initializeRedisClient()
    await Promise.all([
        client.del(bloomKey),
        client.bf.reserve(bloomKey, 0.0001, 1000000)
    ])
}

await createBloomFilter()
process.exit()