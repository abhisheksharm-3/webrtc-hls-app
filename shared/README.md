# WebRTC-HLS Shared Module

This package contains shared TypeScript types, interfaces, and utility functions used by both the client and server of the WebRTC-HLS Streaming Platform.

## Contents
- Common API types
- Mediasoup and room types
- Socket event definitions
- Shared validation utilities

## Project Structure

```
shared/
├── src/
│   ├── types/          # TypeScript types (api, mediasoup, room, socket-events)
│   └── utils/          # Shared validation utilities
├── index.ts            # Entry point for exports
├── package.json        # Module metadata
└── tsconfig.json       # TypeScript configuration
```

## Usage

Import shared types and utilities in both client and server code:

```ts
import { SomeType } from 'shared';
```

## Development

1. Install dependencies:
   ```bash
   cd shared
   npm install
   ```
2. Build the package:
   ```bash
   npm run build
   ```

## License
MIT
