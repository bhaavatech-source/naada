import {
  getMelakartaCurriculum,
  getPlayerExercises,
} from './service';

async function test() {
  for (const melaNumber of [3, 15]) {
    const mela = await getMelakartaCurriculum(melaNumber);

    console.log(`Mela ${melaNumber}: ${mela.raga_name}`);

    for (const tab of [
      'sarali',
      'janta',
      'dhaatu',
      'mel',
      'kil',
      'alankara',
    ] as const) {
      const exercises = getPlayerExercises(mela, tab);

      console.log(
        `${tab}: ${exercises.length} exercises`,
        exercises[0]
          ? {
              name: exercises[0].label,
              aro: exercises[0].aro,
              avro: exercises[0].avro,
            }
          : 'No exercises returned',
      );
    }
  }
}

test().catch(console.error);