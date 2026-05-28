const movieModelQueries = require("../models/movieModel");

const moviesController = {
  getNowShowingMovies: async (req, res) => {
    try {
      const movies = await movieModelQueries.getNowShowingMovies();
      res
        .status(200)
        .json({ message: "Now Showing Movies fetched successfully", movies });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  getComingSoonMovies: async (req, res) => {
    try {
      const movies = await movieModelQueries.getComingSoonMovies();
      res
        .status(200)
        .json({ message: "Coming Soon Movies fetched successfully", movies });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  getMoviesForHeroSlider: async (req, res) => {
    try {
      const movies = await movieModelQueries.getMoviesForHeroSlider();
      res.status(200).json({ message: "Movies fetched successfully", movies });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  getMovieDetails: async (req, res) => {
    try {
      const getMovieDetails = await movieModelQueries.getMovieDetails(
        req.params.id,
      );
      const showTimingAndDetails = await movieModelQueries.getMovieShows(
        req.params.id,
      );
      res.status(200).json({
        message: "Movie details fetched successfully",
        getMovieDetails,
        showTimingAndDetails,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

module.exports = moviesController;
