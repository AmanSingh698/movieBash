const mysql = require("mysql2");
const authController = require("../controllers/authController");
const pool = require("../services/dbService");
const moviesController = require("../controllers/moviesController");

const movieModalQueries = {
  getNowShowingMovies: async () => {
    const [rows] = await pool.query(
      `
    SELECT 
    m.*,
    GROUP_CONCAT(DISTINCT g.name) AS genres,
    GROUP_CONCAT(DISTINCT f.name) AS formats
FROM movies m
LEFT JOIN movie_genres mg ON m.id = mg.movie_id
LEFT JOIN genres g ON mg.genre_id = g.id
LEFT JOIN movie_formats mf ON m.id = mf.movie_id
LEFT JOIN formats f ON mf.format_id = f.id
WHERE m.status = 'now_showing'
GROUP BY m.id;
    `
    );
    return rows;
  },

  getComingSoonMovies: async () => {
    const [rows] = await pool.query(
      `
    SELECT 
    m.*,
    GROUP_CONCAT(DISTINCT g.name) AS genres,
    GROUP_CONCAT(DISTINCT f.name) AS formats
FROM movies m
LEFT JOIN movie_genres mg ON m.id = mg.movie_id
LEFT JOIN genres g ON mg.genre_id = g.id
LEFT JOIN movie_formats mf ON m.id = mf.movie_id
LEFT JOIN formats f ON mf.format_id = f.id
WHERE m.status = 'coming_soon'
GROUP BY m.id;
    `
    );
    return rows;
  },

  getMoviesForHeroSlider: async () => {
    const [rows] = await pool.query(
      `
    SELECT 
    m.*,
    GROUP_CONCAT(DISTINCT g.name) AS genres,
    GROUP_CONCAT(DISTINCT f.name) AS formats
FROM movies m
LEFT JOIN movie_genres mg ON m.id = mg.movie_id
LEFT JOIN genres g ON mg.genre_id = g.id
LEFT JOIN movie_formats mf ON m.id = mf.movie_id
LEFT JOIN formats f ON mf.format_id = f.id
WHERE m.status = 'now_showing' OR m.status = 'coming_soon'
GROUP BY m.id
LIMIT 3;
    `
    );
    return rows;
  },

  getMovieDetails: async (movieId) => {
    const [rows] = await pool.query(
      `
    SELECT
      m.id,
      m.title,
      m.slug,
      m.synopsis,
      m.trailer_link,
      m.rating,
      m.release_date,
      m.runtime_minutes,
      m.language AS primary_language,
      m.status,
      m.poster_url,
      m.backdrop_url,
      -- aggregated lists
      COALESCE(GROUP_CONCAT(DISTINCT g.name SEPARATOR ',') , '') AS genres,
      COALESCE(GROUP_CONCAT(DISTINCT f.name SEPARATOR ',') , '') AS formats,
      -- Directors and Cast separated
      COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN mp.credit = 'Director' THEN p.name END SEPARATOR ',') , '') AS directors,
      COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN mp.credit = 'Actor' THEN p.name END SEPARATOR ',') , '') AS cast,
      -- languages seen in shows (useful if a movie has dubbed shows)
      COALESCE(GROUP_CONCAT(DISTINCT s.lang SEPARATOR ',') , '') AS languages_in_shows
    FROM movies m
    LEFT JOIN movie_genres mg ON m.id = mg.movie_id
    LEFT JOIN genres g ON mg.genre_id = g.id
    LEFT JOIN movie_formats mf ON m.id = mf.movie_id
    LEFT JOIN formats f ON mf.format_id = f.id
    LEFT JOIN movie_people mp ON m.id = mp.movie_id
    LEFT JOIN people p ON mp.person_id = p.id
    LEFT JOIN shows s ON s.movie_id = m.id
    WHERE m.id = ?
    GROUP BY m.id
    `,
      [movieId]
    );

    const row = rows[0];
    if (!row) return null;

    // Parse CSV fields into arrays (unique, trimmed)
    const parseCsv = (str) =>
      (str || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      synopsis: row.synopsis,
      trailer_link: row.trailer_link,
      video_url: row.video_url,
      rating: row.rating,
      release_date: row.release_date, // YYYY-MM-DD
      runtime_minutes: row.runtime_minutes,
      primary_language: row.primary_language,
      status: row.status,
      poster_url: row.poster_url,
      backdrop_url: row.backdrop_url,
      genres: parseCsv(row.genres),
      formats: parseCsv(row.formats),
      directors: parseCsv(row.directors), // array (may be single item)
      cast: parseCsv(row.cast), // array of actor names
      languages: Array.from(
        new Set([
          ...(row.languages_in_shows ? parseCsv(row.languages_in_shows) : []),
          ...(row.primary_language ? [row.primary_language] : []),
        ])
      ),
    };
  },
  // getMovieShows: returns flat list of shows with seat prices, min_price and min_price_class
  getMovieShows: async (movieId) => {
    const [showRows] = await pool.query(
      `
    SELECT
      s.id                    AS show_id,
      s.movie_id,
      s.screen_id,
      sc.name                 AS screen_name,
      sc.theatre_id,
      t.name                  AS theatre_name,
      t.city                  AS theatre_city,
      t.state                 AS theatre_state,
      s.start_time,
      s.end_time,
      TIME_FORMAT(s.start_time, '%h:%i %p') AS time_12,
      TIME_FORMAT(s.start_time, '%H:%i') AS time_24,
      s.format,
      s.lang                  AS language,
      s.base_price,

      -- Pick MIN price; if none exist, fall back to base_price
      COALESCE(MIN(sp.price), s.base_price) AS min_price,

      -- Aggregated seat prices (not returned directly)
      GROUP_CONCAT(DISTINCT CONCAT(sp.seat_class, '::', sp.price) ORDER BY sp.price SEPARATOR '||') AS seat_price_list,

      -- Find seat_class associated with the minimum price
      (
        SELECT sp2.seat_class 
        FROM show_seat_prices sp2
        WHERE sp2.show_id = s.id
        ORDER BY sp2.price ASC
        LIMIT 1
      ) AS min_seat_class

    FROM shows s
    LEFT JOIN screens sc ON s.screen_id = sc.id
    LEFT JOIN theatres t ON sc.theatre_id = t.id
    LEFT JOIN show_seat_prices sp ON s.id = sp.show_id
    WHERE s.movie_id = ? 
      AND s.status IN ('scheduled','running','active')
      AND s.start_time > NOW()
    GROUP BY s.id
    ORDER BY t.name ASC, s.start_time ASC
    `,
      [movieId]
    );

    const shows = (showRows || []).map((r) => {
      return {
        show_id: r.show_id,
        movie_id: r.movie_id,
        screen: { id: r.screen_id, name: r.screen_name },
        theatre: {
          id: r.theatre_id,
          name: r.theatre_name,
          city: r.theatre_city,
          state: r.theatre_state,
        },

        start_time: r.start_time,
        end_time: r.end_time,

        time: r.time_12,
        time_24: r.time_24,

        format: r.format,
        language: r.language,

        // Return only SEAT CLASS (not price)
        seat_class: r.min_seat_class || null,
      };
    });

    return shows;
  },
};

module.exports = movieModalQueries;
