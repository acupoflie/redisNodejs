import express from "express";
import { initializeRedisClient } from "../utils/client";
import { cuisineKey, cuisinesKey, restaurantKeyById } from "../utils/keys";
import { successResponse } from "../utils/responses";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const client = await initializeRedisClient();
    const cuisines = await client.sMembers(cuisinesKey);
    successResponse(res, cuisines);
  } catch (err) {
    next(err);
  }
});

router.get("/:cuisine", async (req, res, next) => {
  const { cuisine } = req.params;
  try {
    const client = await initializeRedisClient();
    const restaurantIds = await client.sMembers(cuisineKey(cuisine));
    const restaurants = await Promise.all(
      restaurantIds.map((id) => client.hGet(restaurantKeyById(id), "name"))
    );
    successResponse(res, restaurants)
  } catch (err) {
    next(err);
  }
});

export default router;
