import { Request, Response, NextFunction } from 'express';

type AsyncHandlerType = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;

export const asyncHandler =
  (controller: AsyncHandlerType): AsyncHandlerType =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controller(req, res, next);
    } catch (error) {
      next(error);
    }
  };
