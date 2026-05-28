const express = require("express");
const router = express.Router();
const moviesController = require("../controllers/moviesController");

// Fix #8: All movie data-fetching routes changed from POST → GET.
// - GET is the correct HTTP verb for read-only operations.
// - Allows HTTP caching by browsers and CDNs.
// - Makes URLs bookmarkable and back-button friendly.
router.get("/movies/nowShowing", moviesController.getNowShowingMovies);
router.get("/movies/comingSoon", moviesController.getComingSoonMovies);
router.get("/movies/heroSlider", moviesController.getMoviesForHeroSlider);
router.get("/movies/details/:id", moviesController.getMovieDetails);

module.exports = router;
