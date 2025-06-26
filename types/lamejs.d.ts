declare module 'lamejs' {
  export interface WavHeaderInfo {
    channels: number;
    sampleRate: number;
    dataOffset: number;
    dataLen: number;
  }

  export class WavHeader {
    static readHeader(dataView: DataView): WavHeaderInfo;
  }

  export interface Mp3Encoder {
    encodeBuffer(samples: Int16Array): Int8Array;
    flush(): Int8Array;
  }

  export class Mp3Encoder {
    constructor(channels: number, sampleRate: number, kbps: number);
    encodeBuffer(samples: Int16Array): Int8Array;
    flush(): Int8Array;
  }

  const lamejs: {
    WavHeader: typeof WavHeader;
    Mp3Encoder: typeof Mp3Encoder;
  };

  export default lamejs;
} 