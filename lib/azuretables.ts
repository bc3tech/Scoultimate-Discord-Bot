import { TableClient, TableEntity } from '@azure/data-tables';
import { DefaultAzureCredential } from '@azure/identity';

// Initialize Azure Table Storage
const account = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const tableName = process.env.AZURE_STORAGE_TABLE_NAME || 'bot_data';
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

    public doc(rowKey: string) {
        return new Document(this.tableClient, this.partitionKey, rowKey);
    }
}

class Document {
    private tableClient: TableClient;
    private partitionKey: string;
    private rowKey: string;

    constructor(tableClient: TableClient, partitionKey: string, rowKey: string) {
        this.tableClient = tableClient;
        this.partitionKey = partitionKey;
        this.rowKey = rowKey;
    }

    public async set(data: any) {
        const entity: TableEntity = {
            partitionKey: this.partitionKey,
            rowKey: this.rowKey,
            ...data
        };
        await this.tableClient.createEntity(entity);
    }

    public async get() {
        try {
            const entity = await this.tableClient.getEntity(this.partitionKey, this.rowKey);
            return entity;
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