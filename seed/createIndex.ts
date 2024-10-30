import { SchemaFieldTypes } from "redis";
import { initializeRedisClient } from "../utils/client";
import { getKeyName, indexKey } from "../utils/keys";

async function createIndex() {
    const client = await initializeRedisClient()
    try {
        await client.ft.dropIndex(indexKey)
    } catch(err) {
        console.log('No existing key to delete')
    }

    await client.ft.create(indexKey, 
        {
            id: {
                type: SchemaFieldTypes.TEXT,
                AS: 'id'
            },
            name: {
                type: SchemaFieldTypes.TEXT,
                AS: 'name'
            },
            avgStart: {
                type: SchemaFieldTypes.NUMERIC,
                AS: 'avgStars',
                SORTABLE: true
            }
        }, 
        {
            ON: "HASH",
            PREFIX: getKeyName('restaurants')
        }
    )
}

await createIndex()
process.exit()