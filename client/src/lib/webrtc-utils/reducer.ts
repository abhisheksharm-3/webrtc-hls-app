import { Participant } from "@relay-app/shared";
import type { Consumer, Producer } from "mediasoup-client/types";

export interface WebRTCState {
  participants: Participant[];
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
}

export type WebRTCAction =
  | { type: "ROOM_JOINED"; payload: { participants: Participant[] } }
  | { type: "NEW_PARTICIPANT"; payload: { participant: Participant } }
  | { type: "PARTICIPANT_LEFT"; payload: { participantId: string } }
  | { type: "ADD_PRODUCER"; payload: { producer: Producer } }
  | { type: "REMOVE_PRODUCER"; payload: { producerId: string } }
  | { type: "ADD_CONSUMER"; payload: { consumer: Consumer } }
  | { type: "REMOVE_CONSUMER"; payload: { consumerId: string } }
  | { type: "UPDATE_PARTICIPANT"; payload: { participantId: string; patch: Partial<Participant> } }
  | { type: "RESET_STATE" };

export const initialState: WebRTCState = {
  participants: [],
  producers: new Map(),
  consumers: new Map(),
};

export function webrtcReducer(state: WebRTCState, action: WebRTCAction): WebRTCState {
  switch (action.type) {
    case "ROOM_JOINED":
      return { ...state, participants: action.payload.participants };
    case "NEW_PARTICIPANT":
      if (state.participants.some((p) => p.id === action.payload.participant.id)) return state;
      return { ...state, participants: [...state.participants, action.payload.participant] };
    case "PARTICIPANT_LEFT":
      return { ...state, participants: state.participants.filter(p => p.id !== action.payload.participantId) };
    case "ADD_PRODUCER":
      return { ...state, producers: new Map(state.producers).set(action.payload.producer.id, action.payload.producer) };
    case "REMOVE_PRODUCER": {
      const newProducers = new Map(state.producers);
      newProducers.delete(action.payload.producerId);
      return { ...state, producers: newProducers };
    }
    case "ADD_CONSUMER":
      return { ...state, consumers: new Map(state.consumers).set(action.payload.consumer.id, action.payload.consumer) };
    case "REMOVE_CONSUMER": {
        const newConsumers = new Map(state.consumers);
        newConsumers.delete(action.payload.consumerId);
        return { ...state, consumers: newConsumers };
    }
    case "UPDATE_PARTICIPANT":
      return {
        ...state,
        participants: state.participants.map(p =>
          p.id === action.payload.participantId ? { ...p, ...action.payload.patch } : p
        ),
      };
    case "RESET_STATE":
      return initialState;
    default:
      return state;
  }
}