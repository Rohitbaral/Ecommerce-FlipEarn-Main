import express from "express";
import { searchListings, getAutocompleteSuggestions } from "../controllers/searchController.js";

const searchRouter = express.Router();

// GET /api/search?q=keyword&...
searchRouter.get('/', searchListings);

// GET /api/search/suggestions?q=keyword
searchRouter.get('/suggestions', getAutocompleteSuggestions);

export default searchRouter;
