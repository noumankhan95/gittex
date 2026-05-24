import { JetStreamClient, JetStreamManager, JsMsg, AckPolicy, DeliverPolicy, jetstream, jetstreamManager } from "@nats-io/jetstream"

import { Subjects } from "./Subjects"

interface Event {
    subject: Subjects;
    data: any
}
export abstract class Listener<T extends Event> {
    abstract subject: T['subject'];
    abstract queueGroupName: string;
    abstract onMessage(data: T['data'], msg: JsMsg): void

    private client: JetStreamClient;
    private jsm: JetStreamManager;
    protected ackWait = 5 * 1000;

    constructor(client: JetStreamClient, jsm: JetStreamManager) {
        this.client = client;
        this.jsm = jsm;
    }

    async ensureStream() {
        try {
            await this.jsm.streams.add({
                name: this.subject,
                subjects: [this.subject]
            })
        } catch (err: any) {
            if (err?.api_error?.err_code === 10058) {
                console.log(`Stream already exists: ${this.subject}`);
            } else {
                throw err;
            }
        }
    }

    async listen() {
        await this.ensureStream();

        // In the new @nats-io/jetstream package the consumer API changed.
        // You create a consumer explicitly then consume from it.
        const stream = await this.jsm.streams.get(this.subject);

        // create or fetch the durable consumer
        const consumer = await this.client.consumers.get(this.subject, this.queueGroupName)
            .catch(async () => {
                // consumer doesn't exist yet — create it
                await this.jsm.consumers.add(this.subject, {
                    durable_name: this.queueGroupName,
                    deliver_policy: DeliverPolicy.All,
                    ack_policy: AckPolicy.Explicit,
                    ack_wait: this.ackWait * 1_000_000, // nanoseconds
                    filter_subject: this.subject,
                });
                return this.client.consumers.get(this.subject, this.queueGroupName);
            });

        console.log(`Listening on subject: ${this.subject} / ${this.queueGroupName}`);

        // consume() returns an async iterator — replaces subscription.on('message')
        const messages = await consumer.consume();

        for await (const msg of messages) {
            console.log(`Message received: ${this.subject} / ${this.queueGroupName}`);
            const parsedData = this.parseMessage(msg);
            this.onMessage(parsedData, msg);
        }
    }

    parseMessage(msg: JsMsg) {
        return JSON.parse(msg.string());
    }
}