import type { Response } from "express";

interface ApiSuccess<T> {
  status: "success";
  message: string;
  data: T;
}

export function successResponse<T>(
  res: Response,
  data: T,
  message = "Operação realizada com sucesso.",
  httpStatus = 200,
) {
  const body: ApiSuccess<T> = {
    status: "success",
    message,
    data,
  };

  return res.status(httpStatus).json(body);
}
