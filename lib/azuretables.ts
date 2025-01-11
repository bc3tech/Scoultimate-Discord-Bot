import { GetTableEntityResponse, TableClient, TableEntityResult, TableEntity } from '@azure/data-tables';
import { UpdateMode } from '@azure/data-tables';
import { DefaultAzureCredential } from '@azure/identity';
import { PartialGroupDMChannel } from 'discord.js';

// Initialize Azure Table Storage
const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const tableName = process.env.AZURE_STORAGE_TABLE_NAME || 'botdata';
const credential = new DefaultAzureCredential();
const tableClient = new TableClient(`https://${account}.table.core.windows.net`, tableName, credential);

class AzureTables {
    private tableClient: TableClient;

    constructor(tableClient: TableClient) {
        this.tableClient = tableClient;
        this.initializeTable();
    }

    private async initializeTable() {
        try {
            await this.tableClient.createTable();
            console.log(`Table ${tableName} is ready.`);
        } catch (error) {
            if ((error as any).statusCode === 409) {
                console.log(`Table ${tableName} already exists.`);
            } else {
                throw error;
            }
        }
    }

    public collection(partitionKey: string) {
        return new Collection(this.tableClient, partitionKey);
    }
}

class Collection {
    private tableClient: TableClient;
    private partitionKey: string;

    constructor(tableClient: TableClient, partitionKey: string) {
        this.tableClient = tableClient;
        this.partitionKey = partitionKey;
    }

    public doc<T>(rowKey: string): Document<T> {
        return new Document<T>(this.tableClient, this.partitionKey, rowKey);
    }
}

export class Document<T> {
    private tableClient: TableClient;
    private rowKey: string;
    private partitionKey: string;

    constructor(tableClient: TableClient, partitionKey: string, rowKey: string) {
        this.partitionKey = partitionKey;
        this.rowKey = rowKey;
        this.tableClient = tableClient;
    }

    public async set(data: T) {
        await this.tableClient.upsertEntity({
            partitionKey: this.partitionKey,
            rowKey: this.rowKey,
            data: JSON.stringify(data)
        });
    }

    public async get(): Promise<T | null> {
        try {
            const entity = await this.tableClient.getEntity(this.partitionKey, this.rowKey);
            const obj = JSON.parse(entity.data as string) as T;
            console.log('Entity:', obj);
            return obj;
        } catch (error) {
            if ((error as any).statusCode === 404) {
                return null;
            }
            throw error;
        }
    }
}

// Export an instance of AzureTables
const azureTables = new AzureTables(tableClient);
export default azureTables;