// Central question bank. Questions are plain data, so this file can later be replaced by
// an API or database fetch (see services/questionRepository.js).
import general from './general.js';
import history from './history.js';
import geography from './geography.js';
import science from './science.js';
import technology from './technology.js';
import movies from './movies.js';
import music from './music.js';
import gaming from './gaming.js';
import sports from './sports.js';
import football from './football.js';
import food from './food.js';
import literature from './literature.js';
import math from './math.js';
import art from './art.js';
import business from './business.js';
import people from './people.js';
import animals from './animals.js';
import space from './space.js';

export const QUESTION_BANK = [
  ...general, ...history, ...geography, ...science, ...technology, ...movies,
  ...music, ...gaming, ...sports, ...football, ...food, ...literature,
  ...math, ...art, ...business, ...people, ...animals, ...space,
];
