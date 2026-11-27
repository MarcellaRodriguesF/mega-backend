
import type { Request, Response } from "express";
import { z } from "zod";

import { successResponse } from "../../shared/http/api-response.js";
import { GeocodingService } from "./geocoding.service.js";

const reverseSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export class GeocodingController {
  private readonly geocodingService = new GeocodingService();

  reverse = async (req: Request, res: Response) => {
    const { latitude, longitude } = reverseSchema.parse(req.body);

    const result = await this.geocodingService.reverse(
      latitude,
      longitude,
    );

    return successResponse(
      res,
      result,
      "Localização identificada com sucesso.",
    );
  };
}
