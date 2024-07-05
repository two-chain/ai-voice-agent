import { StatusCodes } from "http-status-codes";
const { v4: uuidv4 } = require("uuid");
const twilio = require("twilio");
const VoiceResponse = twilio.twiml.VoiceResponse;

import { User } from "@/api/twillio/twillioModel";
import { userRepository } from "@/api/twillio/twillioRepository";
import {
  ResponseStatus,
  ServiceResponse,
} from "@/common/models/serviceResponse";
import { logger } from "@/server";
import cacheUtil from "@/common/utils/cache";

const APP_CALLBACK_URL = `https://${process.env.NGROK_HOST}`;
const WEBSOCKET_URL = `wss://${process.env.NGROK_HOST}`;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// TODO: make common factory util
const twilio_client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
twilio_client.logLevel = "debug";

export const twillioService = {
  // FIXME: fix the type
  create: async (): Promise<ServiceResponse<any>> => {
    try {
      const agentId = uuidv4();
      const agentInfo = {
        id: agentId,
        created_at: new Date(),
      };

      cacheUtil.set(agentId, agentInfo);

      return new ServiceResponse(
        ResponseStatus.Success,
        "Agent Created",
        agentInfo,
        StatusCodes.OK
      );
    } catch (ex) {
      const errorMessage = `Error creating agent: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return new ServiceResponse(
        ResponseStatus.Failed,
        errorMessage,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },
  call: async ({
    agentId,
    recipientPhoneNumber,
  }: any): Promise<ServiceResponse<any>> => {
    // FIXME: type

    console.log(`APP_CALLBACK_URL: ${APP_CALLBACK_URL}`);
    console.log(`WEBSOCKET_URL: ${WEBSOCKET_URL}`);
    console.log("tokens");
    console.log(
      `${TWILIO_ACCOUNT_SID} ${TWILIO_AUTH_TOKEN} ${TWILIO_PHONE_NUMBER}`
    );

    const call = await twilio_client.calls.create({
      to: recipientPhoneNumber,
      from: TWILIO_PHONE_NUMBER,
      url: `${APP_CALLBACK_URL}/twillio/callback?wsUrl=${WEBSOCKET_URL}&agentId=${agentId}`,
      method: "POST",
      record: true,
    });

    return new ServiceResponse(
      ResponseStatus.Success,
      "Call Initiated",
      true,
      StatusCodes.OK
    );
  },
  handleCallback: async ({
    wsUrl,
    agentId,
  }: {
    wsUrl: string;
    agentId: string;
  }): Promise<ServiceResponse<any>> => {
    // TODO: logic to handle callback from twillio
    try {
      const response = new VoiceResponse();
      const connect = response.connect();
      const websocket_twilio_route = `${wsUrl}/voice`; // TODO: use this agentId to get config
      connect.stream({ url: websocket_twilio_route, agentId });
      response.say(
        "This TwiML instruction is unreachable unless the Stream is ended by your WebSocket server."
      );

      console.log(`websocket connection done to ${websocket_twilio_route}`);
      return response;
    } catch (ex) {
      const errorMessage = `Error creating agent: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return new ServiceResponse(
        ResponseStatus.Failed,
        errorMessage,
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  },
};
