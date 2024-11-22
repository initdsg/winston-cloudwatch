import TransportStream, { TransportStreamOptions } from "winston-transport";
import {
    DescribeLogStreamsCommand,
    PutLogEventsCommand,
    CloudWatchLogsClient,
} from "@aws-sdk/client-cloudwatch-logs";

export interface WinstonCloudwatchOptions extends TransportStreamOptions {
    logGroupName: string;
    logStreamName: string;
    /**
     * Buffer size. Default is 500
     * */
    logBufferSize?: number;
    /**
     * Time taken to flush buffer (ms). Default is 1000ms
     * */
    timeout?: number;
}

interface Log {
    level: string;
    message: string;
    timestamp: string;
}

export class WinstonCloudwatch extends TransportStream {
    private logGroupName: string;
    private logStreamName: string;
    private nextSequenceToken: string | undefined;
    private logBuffer: Log[] = [];
    private logBufferSize: number;
    private timeoutId: NodeJS.Timeout;
    private timeout: number;
    private cloudwatchClient: CloudWatchLogsClient;

    constructor(options: WinstonCloudwatchOptions) {
        super(options);
        this.logGroupName = options.logGroupName;
        this.logStreamName = options.logStreamName;
        this.logBufferSize = options.logBufferSize || 500;
        this.timeout = options.timeout || 1000;
        this.cloudwatchClient = new CloudWatchLogsClient();
    }

    async log(info: Log, callback: any) {
        // https://github.com/winstonjs/winston-transport
        // this calls ensures that the event loop is not blocked and tell logger
        // that the log event has been handled
        setImmediate(() => {
            this.emit("logged");
        });

        clearTimeout(this.timeoutId);

        if (this.logBuffer.length > this.logBufferSize) {
            await this.upload(this.logBuffer);
            this.logBuffer = [];
        } else {
            this.logBuffer.push(info);

            this.timeoutId = setTimeout(() => {
                this.upload(this.logBuffer);
            }, this.timeout);
        }

        // Perform the writing to the remote service
        callback();
    }

    private async upload(logs: Log[]) {
        try {
            // Retrieve the sequence token (if required)
            const logStreamInfo = await this.cloudwatchClient.send(
                new DescribeLogStreamsCommand({
                    logGroupName: this.logGroupName,
                    logStreamNamePrefix: this.logStreamName,
                })
            );

            const logStream = logStreamInfo.logStreams?.find(
                (stream) => stream.logStreamName === this.logStreamName
            );
            this.nextSequenceToken = logStream?.uploadSequenceToken;

            // Prepare log events
            const logEvents = logs.map((log) => ({
                level: log.level,
                message: log.message,
                timestamp: Date.now(),
            }));

            // Send log events
            const command = new PutLogEventsCommand({
                logGroupName: this.logGroupName,
                logStreamName: this.logStreamName,
                logEvents,
                sequenceToken: this.nextSequenceToken,
            });

            await this.cloudwatchClient.send(command);
        } catch (err) {
            console.error("Error sending log events:", err);
        }
    }
}
