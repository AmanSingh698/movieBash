const express = require("express");
const router = express.Router();
// const authController = require("../controllers/authController");
const moviesController = require("../controllers/moviesController");

// router.post("/login", authController.login);
// router.post("/register", authController.register);
// router.post("/refresh", authController.refreshToken); // client calls this to get new access token (cookie sent automatically)
// router.post("/logout", authController.logout);

router.post("/movies/nowShowing", moviesController.getNowShowingMovies);
router.post("/movies/comingSoon", moviesController.getComingSoonMovies);
router.post("/movies/heroSlider", moviesController.getMoviesForHeroSlider);
router.post("/movies/details/:id", moviesController.getMovieDetails);
module.exports = router;
