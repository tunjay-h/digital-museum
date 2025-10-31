import rawPresidents from './presidents.json';
import rawFounders from './founders.json';
import type { Portrait } from '../types';

const portraits = ([...rawPresidents, ...rawFounders] as Portrait[]).map((entry) => ({
  ...entry,
}));

export default portraits;
