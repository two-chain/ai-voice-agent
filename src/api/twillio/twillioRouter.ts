import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { Request, Response, Router } from "express";
import { z } from "zod";

import { GetUserSchema, UserSchema } from "@/api/user/userModel";
import { twillioService } from "@/api/twillio/twillioService";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import {
  handleServiceResponse,
  validateRequest,
} from "@/common/utils/httpHandlers";

export const twillioRegistry = new OpenAPIRegistry();

twillioRegistry.register("Agent", UserSchema);

export const twillioRouter: Router = (() => {
  const router = express.Router();

  twillioRegistry.registerPath({
    method: "post",
    path: "/twillio/agent",
    tags: ["Agent"],
    responses: createApiResponse(z.array(UserSchema), "Success"),
  });

  router.post("/agent", async (req: Request, res: Response) => {
    const serviceResponse = await twillioService.create();
    handleServiceResponse(serviceResponse, res);
  });

  router.post("/call", async (req: Request, res: Response) => {
    const payload = {
      agentId: req.body.agentId as string,
      recipientPhoneNumber: req.body.recipientPhoneNumber as string,
    };

    // TODO: add below in request validation schema
    // if (!payload.agentId) {
    //   return res.status(404).json({ detail: "Agent not provided" });
    // }

    // if (!cacheUtil.get(agent_id)) {
    //   return res.status(404).json({ detail: "Agent not found" });
    // }

    // if (!call_details || !call_details.recipient_phone_number) {
    //   return res
    //     .status(404)
    //     .json({ detail: "Recipient phone number not provided" });
    // }

    const serviceResponse = await twillioService.call(payload);
    handleServiceResponse(serviceResponse, res);
  });

  router.post("/callback", async (req: Request, res: Response) => {
    const payload = {
      wsUrl: req.query.wsUrl as string,
      agentId: req.query.agentId as string,
    };
    const serviceResponse = await twillioService.handleCallback(payload);
    // handleServiceResponse(serviceResponse, res);
    // TODO: use common util to send response
    res.status(200).type("text/xml").send(serviceResponse.toString());
  });

  return router;
})();
