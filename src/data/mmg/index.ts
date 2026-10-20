// src/data/mmg/index.ts

export { saraliVarisaiMmg }       from './sarali';
export { jantaVarisaiMmg }        from './janta';
export { dhatuVarisaiMmg }        from './dhatu';
export { melsthayiVarisaiMmg }    from './melsthayi';
export { mandrasthayiVarisaiMmg } from './mandrasthayi';
export { alankaramMmg }           from './alankarams';

import { saraliVarisaiMmg }       from './sarali';
import { jantaVarisaiMmg }        from './janta';
import { dhatuVarisaiMmg }        from './dhatu';
import { melsthayiVarisaiMmg }    from './melsthayi';
import { mandrasthayiVarisaiMmg } from './mandrasthayi';
import { alankaramMmg }           from './alankarams';

export const allMmgVarisai = [
  ...saraliVarisaiMmg,
  ...jantaVarisaiMmg,
  ...dhatuVarisaiMmg,
  ...melsthayiVarisaiMmg,
  ...mandrasthayiVarisaiMmg,
  ...alankaramMmg,
];