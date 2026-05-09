import express from "express";
import { getRecommendations, getSimilarListings } from "../controllers/recommendationController.js";
// import { protect } from "../middlewares/authMiddleware.js"; // Optional: if you want to protect these routes

const recRouter = express.Router();

// GET /api/recommendations/:userId
recRouter.get('/:userId', getRecommendations);

// GET /api/recommendations/similar/:listingId
recRouter.get('/similar/:listingId', getSimilarListings);

export default recRouter;
