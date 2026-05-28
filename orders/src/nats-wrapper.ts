import { connect, NatsConnection } from "@nats-io/transport-node"

import {
    jetstream,
    jetstreamManager,
    JetStreamClient,
    JetStreamManager,
} from '@nats-io/jetstream';

class NatsWrapper {
    private _nc?: NatsConnection;
    private _js?: JetStreamClient;
    private _jsm?: JetStreamManager;

    get nc(): NatsConnection {
        if (!this._nc) throw new Error('Cannot access NATS connection before connecting');
        return this._nc;
    }

    get js(): JetStreamClient {
        if (!this._js) throw new Error('Cannot access JetStream client before connecting');
        return this._js;
    }

    get jsm(): JetStreamManager {
        if (!this._jsm) throw new Error('Cannot access JetStream manager before connecting');
        return this._jsm;
    }

    async connect(url: string): Promise<void> {
        this._nc = await connect({ servers: url });

        this._js = jetstream(this._nc);
        this._jsm = await jetstreamManager(this._nc);

        console.log(`Connected to NATS JetStream at ${url}`);

        // watch for connection status changes
        (async () => {
            for await (const status of this._nc!.status()) {
                console.log(`NATS status: ${status.type}`);
            }
        })();
    }

    async gracefulShutdown(): Promise<void> {
        if (this._nc) {
            await this._nc.drain();
            console.log('NATS connection drained and closed');
        }
    }
}

export const natsWrapper = new NatsWrapper()