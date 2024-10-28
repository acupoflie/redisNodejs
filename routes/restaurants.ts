// https://www.youtube.com/redirect?event=video_description&redir_token=QUFFLUhqblhDS2lxTTVtM0xaN0RIaDlzT2M5bW81X19lZ3xBQ3Jtc0ttTnV3NXdsQUpQYllwRHhrbk5WR1p2SnNXNEwyZW9WamJnbDVOR1ZhOTc2bGVpMlNOU0k2SF9sZ2N1SWhIVmN6TVZJRFY1ZkJ2S3NScTFtd21MeXpCTFdIMWJsSGxqQ3JIdXRERHl2czdsbjQtanhVTQ&q=https%3A%2F%2Fexcalidraw.com%2F%23json%3DoTEnt4bz3tKBnqxf4KrMF%2Cx5eaM_MegV27vL_zc1hosA&v=dQV0xzOeGzU

import express, { type Request } from "express";
import { validate } from "../middlewares/validate.js";
import { RestaurantSchema, type Restaurant } from "../schemas/restaurant";
import { initializeRedisClient } from "../utils/client.js";
import { nanoid } from "nanoid";
import {
  cuisineKey,
  cuisinesKey,
  restaurantCuisineKeyById,
  restaurantKeyById,
  restaurantsByRatingKey,
  reviewDetailKeyById,
  reviewKeyById,
} from "../utils/keys.js";
import { errorResponse, successResponse } from "../utils/responses.js";
import { checkRestaurantExists } from "../middlewares/checkRestaurantId.js";
import { ReviewSchema, type Review } from "../schemas/review.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const start = (Number(page) - 1) * Number(limit);
  const end = start + Number(limit);

  try {
    const client = await initializeRedisClient();
    const restaurantIds = await client.zRange(
      restaurantsByRatingKey,
      start,
      end
    );
    const restaurants = await Promise.all(
      restaurantIds.map((id) => client.hGetAll(restaurantKeyById(id)))
    );
    successResponse(res, restaurants);
  } catch (err) {
    next(err);
  }
});

router.post("/", validate(RestaurantSchema), async (req, res, next) => {
  const data = req.body as Restaurant;
  try {
    const client = await initializeRedisClient();
    const id = nanoid();
    const restaurantKey = restaurantKeyById(id);
    const hashData = { id, name: data.name, location: data.location };
    const addResult = await Promise.all([
      ...data.cuisines.map((cuisine) =>
        Promise.all([
          client.sAdd(cuisinesKey, cuisine),
          client.sAdd(cuisineKey(cuisine), id),
          client.sAdd(restaurantCuisineKeyById(id), cuisine),
        ])
      ),
      client.hSet(restaurantKey, hashData),
      client.zAdd(restaurantsByRatingKey, {
        score: 0,
        value: id,
      }),
    ]);
    console.log(`Added ${addResult} fields`);
    successResponse(res, hashData, "Added new restaurant.");
  } catch (err) {
    next(err);
  }
});

router.post(
  "/:restaurantId/reviews",
  checkRestaurantExists,
  validate(ReviewSchema),
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;
    const data = req.body as Review;
    try {
      const client = await initializeRedisClient();
      const reviewId = nanoid();
      const reviewKey = reviewKeyById(restaurantId);
      const reviewDetailKey = reviewDetailKeyById(reviewId);
      const reviewData = {
        id: reviewId,
        ...data,
        timestamp: Date.now(),
        restaurantId,
      };
      const [reviewCount, setResult, totalStars] = await Promise.all([
        client.lPush(reviewKey, reviewId),
        client.hSet(reviewDetailKey, reviewData),
        client.hIncrByFloat(
          restaurantKeyById(restaurantId),
          "totalStars",
          data.rating
        ),
      ]);

      const averageRating = Number((totalStars / reviewCount).toFixed(1));
      await Promise.all([
        client.zAdd(restaurantsByRatingKey, {
          score: averageRating,
          value: restaurantKeyById(restaurantId),
        }),
        client.hSet(restaurantKeyById(restaurantId), "avgStars", averageRating),
      ]);

      successResponse(res, reviewData, "Review added.");
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:restaurantId/reviews",
  checkRestaurantExists,
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const start = (Number(page) - 1) * Number(limit);
    const end = start + Number(limit) - 1;

    try {
      const client = await initializeRedisClient();
      const reviewKey = reviewKeyById(restaurantId);
      const reviewIds = await client.lRange(reviewKey, start, end);
      const reviews = await Promise.all(
        reviewIds.map((id) => client.hGetAll(reviewDetailKeyById(id)))
      );
      successResponse(res, reviews);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:restaurantId/reviews/:reviewId",
  checkRestaurantExists,
  async (
    req: Request<{ restaurantId: string; reviewId: string }>,
    res,
    next
  ) => {
    const { restaurantId, reviewId } = req.params;

    try {
      const client = await initializeRedisClient();
      const reviewKey = reviewKeyById(restaurantId);
      const reviewDetailsKey = reviewDetailKeyById(reviewId);
      const [removeResult, deleteResult] = await Promise.all([
        client.lRem(reviewKey, 0, reviewId),
        client.del(reviewDetailsKey),
      ]);
      if (removeResult === 0 && deleteResult === 0) {
        errorResponse(res, 404, "Review not found");
      }
      successResponse(res, reviewId, "Review deleted.");
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:restaurantId",
  checkRestaurantExists,
  async (req: Request<{ restaurantId: string }>, res, next) => {
    const { restaurantId } = req.params;
    try {
      const client = await initializeRedisClient();
      const restaurantKey = restaurantKeyById(restaurantId);
      const [viewCount, restaurant, cuisines] = await Promise.all([
        client.hIncrBy(restaurantKey, "viewCount", 1),
        client.hGetAll(restaurantKey),
        client.sMembers(restaurantCuisineKeyById(restaurantId)),
      ]);
      successResponse(res, { ...restaurant, cuisines });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
