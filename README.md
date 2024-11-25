# Winston Cloudwatch Transport (@initd.sg/winston-cloudwatch)

A Winston transport for AWS CloudWatch Logs that provides buffered logging capabilities.

## Why use this transport?

This library should be able to replace the existing transport
https://github.com/lazywithclass/winston-cloudwatch . The existing
winston-cloudwatch library, while functional, has several limitations and
challenges that our new implementation addresses:

- Built with modern TypeScript, providing better type safety and developer experience
- Uses AWS SDK v3
- Optimized batching algorithm that reduces AWS API calls
- Better handling of high-throughput logging scenarios

## Installation
```bash
yarn add @initd.sg/winston-cloudwatch
```

## Prerequisites

- AWS credentials properly configured (either through environment variables, AWS CLI, or IAM roles)
- AWS SDK v3
- Winston 3.x

## Usage

```typescript
import winston from 'winston';
import { WinstonCloudwatch } from '@initd.sg/winston-cloudwatch';

const logger = winston.createLogger({
  transports: [
    new WinstonCloudwatch({
      logGroupName: 'your-log-group-name',
      logStreamName: 'your-log-stream-name',
      logBufferSize: 500,  // optional
      timeout: 1000        // optional
    })
  ]
});

// Use the logger
logger.info('Hello CloudWatch!');
```

## Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| logGroupName | string | Yes | - | The name of the CloudWatch log group |
| logStreamName | string | Yes | - | The name of the CloudWatch log stream |
| logBufferSize | number | No | 500 | Maximum number of logs to buffer before sending to CloudWatch |
| timeout | number | No | 1000 | Time in milliseconds to wait before flushing the buffer |

## Features

- Buffered logging to reduce API calls to CloudWatch
- Automatic handling of sequence tokens
- Non-blocking logging operations
- Configurable buffer size and timeout
- Compatible with Winston 3.x

## Buffer Behavior

The transport implements a buffering mechanism that:
1. Collects logs until the buffer size is reached
2. Automatically flushes the buffer when the timeout is reached
3. Maintains the sequence token for proper log ordering

## Error Handling

Errors during log upload are caught and logged to console, ensuring your application continues to run even if CloudWatch is temporarily unavailable.

## AWS Configuration

Make sure you have the necessary AWS permissions to:
- Describe log streams
- Put log events
- Create log streams (if they don't exist)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

## Dependencies

- @aws-sdk/client-cloudwatch-logs
- winston-transport

## Note

This transport is designed for use in Node.js environments and requires proper AWS credentials configuration.
