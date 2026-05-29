const pool = require("../services/dbService");
const redis = require("../services/redisService");

// TTLs driven by env vars (seconds)
const TTL_MOVIES = parseInt(process.env.CACHE_TTL_MOVIES, 10) || 300;        // 5 min
const TTL_DETAIL = parseInt(process.env.CACHE_TTL_MOVIE_DETAIL, 10) || 600;  // 10 min

// Cache keys
const KEYS = {
  NOW_SHOWING: "movies:now_showing",
  COMING_SOON: "movies:coming_soon",
  HERO_SLIDER:  "movies:hero_slider",
  detail: (id) => `movies:detail:${id}`,
  shows:  (id) => `movies:shows:${id}`,
};

/**
 * Cache-aside helper.
 * 1. Try Redis → return cached value if hit.
 * 2. On miss → call dbFn() → store result in Redis → return result.
 */
async function withCache(key, ttl, dbFn) {
  const cached = await redis.get(key);
  if (cached !== null) {
    return cached;
  }
  const result = await dbFn();
  await redis.set(key, result, ttl);
  return result;
}

const movieModelQueries = {
  getNowShowingMovies: () =>
    withCache(KEYS.NOW_SHOWING, TTL_MOVIES, async () => {
      const [rows] = await pool.query(
        `SELECT 
          m.*,
          GROUP_CONCAT(DISTINCT g.name) AS genres,
          GROUP_CONCAT(DISTINCT f.name) AS formats
        FROM movies m
        LEFT JOIN movie_genres mg ON m.id = mg.movie_id
        LEFT JOIN genres g ON mg.genre_id = g.id
        LEFT JOIN movie_formats mf ON m.id = mf.movie_id
        LEFT JOIN formats f ON mf.format_id = f.id
        WHERE m.status = 'now_showing'
        GROUP BY m.id`
      );
      return rows;
    }),

  getComingSoonMovies: () =>
    withCache(KEYS.COMING_SOON, TTL_MOVIES, async () => {
      const [rows] = await pool.query(
        `SELECT 
          m.*,
          GROUP_CONCAT(DISTINCT g.name) AS genres,
          GROUP_CONCAT(DISTINCT f.name) AS formats
        FROM movies m
        LEFT JOIN movie_genres mg ON m.id = mg.movie_id
        LEFT JOIN genres g ON mg.genre_id = g.id
        LEFT JOIN movie_formats mf ON m.id = mf.movie_id
        LEFT JOIN formats f ON mf.format_id = f.id
        WHERE m.status = 'coming_soon'
        GROUP BY m.id`
      );
      return rows;
    }),

  getMoviesForHeroSlider: () =>
    withCache(KEYS.HERO_SLIDER, TTL_MOVIES, async () => {
      const [rows] = await pool.query(
        `SELECT 
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
        LIMIT 3`
      );
      return rows;
    }),

  getMovieDetails: (movieId) =>
    withCache(KEYS.detail(movieId), TTL_DETAIL, async () => {
      const [rows] = await pool.query(
        `SELECT
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
          COALESCE(GROUP_CONCAT(DISTINCT g.name SEPARATOR ',') , '') AS genres,
          COALESCE(GROUP_CONCAT(DISTINCT f.name SEPARATOR ',') , '') AS formats,
          COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN mp.credit = 'Director' THEN p.name END SEPARATOR ',') , '') AS directors,
          COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN mp.credit = 'Actor' THEN p.name END SEPARATOR ',') , '') AS cast,
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
        GROUP BY m.id`,
        [movieId]
      );

      const row = rows[0];
      if (!row) return null;

      const parseCsv = (str) =>
        (str || "").split(",").map((x) => x.trim()).filter(Boolean);

      return {
        id:               row.id,
        title:            row.title,
        slug:             row.slug,
        synopsis:         row.synopsis,
        trailer_link:     row.trailer_link,
        video_url:        row.video_url,
        rating:           row.rating,
        release_date:     row.release_date,
        runtime_minutes:  row.runtime_minutes,
        primary_language: row.primary_language,
        status:           row.status,
        poster_url:       row.poster_url,
        backdrop_url:     row.backdrop_url,
        genres:    parseCsv(row.genres),
        formats:   parseCsv(row.formats),
        directors: parseCsv(row.directors),
        cast:      parseCsv(row.cast),
        languages: Array.from(
          new Set([
            ...(row.languages_in_shows ? parseCsv(row.languages_in_shows) : []),
            ...(row.primary_language   ? [row.primary_language]           : []),
          ])
        ),
      };
    }),

  getMovieShows: async (movieId) => {
    // Shows contain real-time availability data — cache with a shorter TTL
    const cacheKey = KEYS.shows(movieId);
    return withCache(cacheKey, 60, async () => {  // 60-second TTL
      const [showRows] = await pool.query(
        `SELECT
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
          COALESCE(MIN(sp.price), s.base_price) AS min_price,
          GROUP_CONCAT(DISTINCT CONCAT(sp.seat_class, '::', sp.price) ORDER BY sp.price SEPARATOR '||') AS seat_price_list,
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
        ORDER BY t.name ASC, s.start_time ASC`,
        [movieId]
      );

      return (showRows || []).map((r) => ({
        show_id:  r.show_id,
        movie_id: r.movie_id,
        screen:   { id: r.screen_id,   name: r.screen_name },
        theatre:  {
          id:    r.theatre_id,
          name:  r.theatre_name,
          city:  r.theatre_city,
          state: r.theatre_state,
        },
        start_time: r.start_time,
        end_time:   r.end_time,
        time:       r.time_12,
        time_24:    r.time_24,
        format:     r.format,
        language:   r.language,
        seat_class: r.min_seat_class || null,
      }));
    });
  },

  /**
   * Invalidate all movie-related cache entries.
   * Call this whenever a movie is created, updated, or deleted (admin actions).
   */
  invalidateMovieCache: async (movieId = null) => {
    const toDelete = [KEYS.NOW_SHOWING, KEYS.COMING_SOON, KEYS.HERO_SLIDER];
    if (movieId) {
      toDelete.push(KEYS.detail(movieId));
      toDelete.push(KEYS.shows(movieId));
    }
    await redis.del(...toDelete);
    console.log("🗑️  Movie cache invalidated:", toDelete);
  },
};

module.exports = movieModelQueries;
