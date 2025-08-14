/**
 * WebRTC Connection Diagnostics Utility
 * Use this to debug WebRTC connection issues
 */

interface ConnectionDiagnostics {
  timestamp: string;
  iceConnectionState: string;
  connectionState: string;
  signalingState: string;
  iceGatheringState: string;
  localCandidates: RTCIceCandidate[];
  remoteCandidates: RTCIceCandidate[];
  selectedCandidatePair?: RTCIceCandidatePair;
}

export class WebRTCDiagnostics {
  private static instance: WebRTCDiagnostics;
  private connections: Map<string, RTCPeerConnection> = new Map();
  private diagnostics: Map<string, ConnectionDiagnostics[]> = new Map();

  public static getInstance(): WebRTCDiagnostics {
    if (!WebRTCDiagnostics.instance) {
      WebRTCDiagnostics.instance = new WebRTCDiagnostics();
    }
    return WebRTCDiagnostics.instance;
  }

  public registerConnection(id: string, pc: RTCPeerConnection): void {
    this.connections.set(id, pc);
    this.diagnostics.set(id, []);
    this.setupConnectionMonitoring(id, pc);
  }

  private setupConnectionMonitoring(id: string, pc: RTCPeerConnection): void {
    const logState = () => {
      this.logConnectionState(id);
    };

    pc.oniceconnectionstatechange = logState;
    pc.onconnectionstatechange = logState;
    pc.onsignalingstatechange = logState;
    pc.onicegatheringstatechange = logState;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`🧊 [DIAGNOSTICS] New ICE candidate for ${id}:`, {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          foundation: event.candidate.foundation,
          protocol: event.candidate.protocol,
          type: event.candidate.type,
        });
      }
      logState();
    };
  }

  private async logConnectionState(id: string): Promise<void> {
    const pc = this.connections.get(id);
    if (!pc) return;

    try {
      const stats = await pc.getStats();
      const localCandidates: RTCIceCandidate[] = [];
      const remoteCandidates: RTCIceCandidate[] = [];
      let selectedCandidatePair: RTCIceCandidatePair | undefined;

      stats.forEach((report) => {
        if (report.type === 'local-candidate') {
          localCandidates.push(report as unknown as RTCIceCandidate);
        } else if (report.type === 'remote-candidate') {
          remoteCandidates.push(report as unknown as RTCIceCandidate);
        } else if (report.type === 'candidate-pair' && report.selected) {
          selectedCandidatePair = report as unknown as RTCIceCandidatePair;
        }
      });

      const diagnostic: ConnectionDiagnostics = {
        timestamp: new Date().toISOString(),
        iceConnectionState: pc.iceConnectionState,
        connectionState: pc.connectionState,
        signalingState: pc.signalingState,
        iceGatheringState: pc.iceGatheringState,
        localCandidates,
        remoteCandidates,
        selectedCandidatePair,
      };

      const diagnosticHistory = this.diagnostics.get(id) || [];
      diagnosticHistory.push(diagnostic);
      this.diagnostics.set(id, diagnosticHistory);

      console.log(`📊 [DIAGNOSTICS] Connection ${id} state:`, {
        iceConnectionState: pc.iceConnectionState,
        connectionState: pc.connectionState,
        signalingState: pc.signalingState,
        iceGatheringState: pc.iceGatheringState,
        localCandidatesCount: localCandidates.length,
        remoteCandidatesCount: remoteCandidates.length,
        hasSelectedPair: !!selectedCandidatePair,
      });

      if (pc.connectionState === 'failed' || pc.iceConnectionState === 'failed') {
        console.error(`❌ [DIAGNOSTICS] Connection ${id} failed! Detailed info:`, diagnostic);
        this.printTroubleshootingTips(id);
      }
    } catch (error) {
      console.error(`❌ [DIAGNOSTICS] Error getting stats for ${id}:`, error);
    }
  }

  private printTroubleshootingTips(id: string): void {
    console.group(`🔧 [TROUBLESHOOTING] Tips for connection ${id}:`);
    console.log('1. Check if STUN/TURN servers are reachable');
    console.log('2. Verify firewall settings (ports 40000-49999 for this app)');
    console.log('3. Try enabling TCP-only mode (set MEDIASOUP_FORCE_TCP=true)');
    console.log('4. Check if you\'re behind a symmetric NAT (may need TURN server)');
    console.log('5. Verify server announced IP matches actual public IP');
    console.log('6. Try different ICE servers');
    console.groupEnd();
  }

  public getDiagnostics(id: string): ConnectionDiagnostics[] {
    return this.diagnostics.get(id) || [];
  }

  public printSummary(): void {
    console.group('📋 [DIAGNOSTICS] WebRTC Connections Summary:');
    this.connections.forEach((pc, id) => {
      console.log(`Connection ${id}:`, {
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        signalingState: pc.signalingState,
      });
    });
    console.groupEnd();
  }

  public unregisterConnection(id: string): void {
    this.connections.delete(id);
    this.diagnostics.delete(id);
  }
}

// Convenience function to start diagnostics
export function enableWebRTCDiagnostics(): WebRTCDiagnostics {
  console.log('🔍 [DIAGNOSTICS] WebRTC diagnostics enabled');
  return WebRTCDiagnostics.getInstance();
}
