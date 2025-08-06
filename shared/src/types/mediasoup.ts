import { types as mediasoupTypes } from 'mediasoup-client';

export interface MediasoupDevice {
  loaded: boolean;
  rtpCapabilities?: mediasoupTypes.RtpCapabilities;
}

export interface MediasoupTransport {
  id: string;
  direction: 'send' | 'recv';
  transport?: mediasoupTypes.Transport;
  producers: Map<string, mediasoupTypes.Producer>;
  consumers: Map<string, mediasoupTypes.Consumer>;
}

export interface ProducerOptions {
  kind: 'audio' | 'video';
  track: MediaStreamTrack;
  codecOptions?: mediasoupTypes.ProducerCodecOptions;
  encodings?: mediasoupTypes.RtpEncodingParameters[];
  appData?: any;
}

export interface ConsumerOptions {
  id: string;
  producerId: string;
  kind: 'audio' | 'video';
  rtpParameters: mediasoupTypes.RtpParameters;
  appData?: any;
}
