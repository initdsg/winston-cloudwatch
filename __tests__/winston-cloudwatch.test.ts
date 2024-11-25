import { WinstonCloudwatch } from "../src/WinstonCloudwatch";
import {
    CloudWatchLogsClient,
    PutLogEventsCommand,
    DescribeLogStreamsCommand,
} from "@aws-sdk/client-cloudwatch-logs";

jest.mock("@aws-sdk/client-cloudwatch-logs");

describe("WinstonCloudwatch", () => {
    let transport: WinstonCloudwatch;
    const mockCloudWatchLogsClient = CloudWatchLogsClient as jest.MockedClass<
        typeof CloudWatchLogsClient
    >;

    beforeEach(() => {
        jest.useFakeTimers();
        mockCloudWatchLogsClient.prototype.send.mockClear();

        transport = new WinstonCloudwatch({
            logGroupName: "test-group",
            logStreamName: "test-stream",
            logBufferSize: 2,
            timeout: 1000,
        });

        mockCloudWatchLogsClient.prototype.send
            .mockImplementationOnce(() =>
                Promise.resolve({
                    logStreams: [
                        {
                            logStreamName: "test-stream",
                            uploadSequenceToken: "test-token",
                        },
                    ],
                })
            )
            .mockImplementationOnce(() => Promise.resolve({}));
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
    });

    it("should initialize with correct options", () => {
        const options = {
            logGroupName: "test-group",
            logStreamName: "test-stream",
            logBufferSize: 3,
            timeout: 2000,
        };

        const instance = new WinstonCloudwatch(options);

        expect(instance).toHaveProperty("logGroupName", options.logGroupName);
        expect(instance).toHaveProperty("logStreamName", options.logStreamName);
        expect(instance).toHaveProperty("logBufferSize", options.logBufferSize);
        expect(instance).toHaveProperty("timeout", options.timeout);
    });

    it("should initialize with default values when not provided", () => {
        const instance = new WinstonCloudwatch({
            logGroupName: "test-group",
            logStreamName: "test-stream",
        });

        expect(instance).toHaveProperty("logBufferSize", 500);
        expect(instance).toHaveProperty("timeout", 1000);
    });

    it("should call cloudwatch functions", async () => {
        const mockLog = {
            level: "info",
            message: "test message",
            timestamp: Date.now(),
        };

        await transport.upload([mockLog]);

        expect(mockCloudWatchLogsClient.prototype.send).toHaveBeenCalledWith(
            expect.any(DescribeLogStreamsCommand)
        );

        expect(mockCloudWatchLogsClient.prototype.send).toHaveBeenCalledWith(
            expect.any(PutLogEventsCommand)
        );

        expect(mockCloudWatchLogsClient.prototype.send).toHaveBeenCalledTimes(
            2
        );
    });

    it("should buffer logs and upload when buffer size is reached", async () => {
        const mockLog = {
            level: "info",
            message: "test message",
            timestamp: Date.now(),
        };

        WinstonCloudwatch.prototype.upload = jest.fn();
        const mockFn = jest.fn();
        const logCount = 2;

        // Log messages until buffer is full
        for (let i = 0; i < logCount; i++) {
            await transport.log(mockLog, mockFn);
        }

        expect(mockFn).toHaveBeenCalledTimes(logCount);
        expect(WinstonCloudwatch.prototype.upload).toHaveBeenCalledTimes(1);
    });

    it("should buffer logs and not upload when buffer size is not reached", async () => {
        const mockLog = {
            level: "info",
            message: "test message",
            timestamp: Date.now(),
        };

        WinstonCloudwatch.prototype.upload = jest.fn();
        const mockFn = jest.fn();
        const logCount = 1;

        // Log messages
        for (let i = 0; i < logCount; i++) {
            await transport.log(mockLog, mockFn);
        }

        expect(mockFn).toHaveBeenCalledTimes(logCount);
        expect(WinstonCloudwatch.prototype.upload).toHaveBeenCalledTimes(0);
    });

    it("should upload logs when timeout is reached", async () => {
        const mockLog = {
            level: "info",
            message: "test message",
            timestamp: Date.now(),
        };

        WinstonCloudwatch.prototype.upload = jest.fn();

        await transport.log(mockLog, () => {});

        jest.advanceTimersByTime(2000);

        expect(WinstonCloudwatch.prototype.upload).toHaveBeenCalledTimes(1);
    });

    it("should not upload logs when timeout is not reached", async () => {
        const mockLog = {
            level: "info",
            message: "test message",
            timestamp: Date.now(),
        };

        WinstonCloudwatch.prototype.upload = jest.fn();

        await transport.log(mockLog, () => {});

        expect(WinstonCloudwatch.prototype.upload).toHaveBeenCalledTimes(0);
    });
});
