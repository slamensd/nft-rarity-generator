const cliSpinners = require('cli-spinners');
const { stdout } = require('process');

// The project doesn't support modular imports and this version of
// node-fetch is not supporting commonjs anymore hence we need to
// perform dynamic importing
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const resolveLink = (url) => {
  if (!url || !url.includes('ipfs://')) return url;
  return url.replace('ipfs://', 'https://gateway.ipfs.io/ipfs/');
};

const roundToHundredth = (num) => Math.round(100 * num) / 100;

const extractTraitsAndValues = (metadata) => {
  return metadata.reduce(
    (traitsAndValues, meta) => {
      return {
        ...traitsAndValues,
        traits: [...traitsAndValues.traits, meta.trait_type],
        values: [...traitsAndValues.values, meta.value]
      };
    },
    { traits: [], values: [] }
  );
};

const generateTally = (metadataList) => {
  return metadataList.reduce(
    (tally, meta) => {
      const { traits, values } = extractTraitsAndValues(meta);
      const numOfTraits = traits.length;

      if (tally.TraitCount[numOfTraits]) {
        tally.TraitCount[numOfTraits]++;
      } else {
        tally.TraitCount[numOfTraits] = 1;
      }

      traits.forEach((trait, index) => {
        if (tally[trait]) {
          tally[trait].occurences++;
        } else {
          tally[trait] = { occurences: 1 };
        }

        const traitValue = values[index];
        if (tally[trait][traitValue]) {
          tally[trait][traitValue]++;
        } else {
          tally[trait][traitValue] = 1;
        }
      });

      return tally;
    },
    { TraitCount: {} }
  );
};

// This will calculate the base rarity score
// and mutate the 'rarityScore' on the passed in meta list reference
const calculateTotalRaritybase = (meta, tally, totalMetadata) => {
  return meta.reduce((totalRarity, currentMeta, index) => {
    const { trait_type, value } = currentMeta;
    const rarityScore = 1 / (tally[trait_type][value] / totalMetadata);

    meta[index].rarityScore = roundToHundredth(rarityScore);
    return totalRarity + rarityScore;
  }, 0);
};

const getNftImage = async (tokenUri) => {
  try {
    return await fetch(tokenUri)
      .then((res) => res.json())
      .then((data) => resolveLink(data.image));
  } catch (error) {
    stdout.write(`❗ Something went wrong: ${error} ❗`);
    throw new Error(error);
  }
};

const createSpinner = (id) => {
  const state = {
    id,
    affix: null,
    currentFrame: 0,
    spinnerRef: null
  };

  const start = (affixOpt) => {
    if (state.spinnerRef === null) {
      state.spinnerRef = setInterval(() => {
        const { currentFrame } = state;
        state.affix = affixOpt ? affixOpt : null;

        stdout.clearLine();
        stdout.cursorTo(0);

        const text = affixOpt
          ? `${affixOpt} ${cliSpinners.dots.frames[currentFrame]} `
          : `${cliSpinners.dots.frames[currentFrame]} `;
        stdout.write(text);

        state.currentFrame = (currentFrame + 1) % cliSpinners.dots.frames.length;
      }, cliSpinners.dots.interval);
    } else {
      stdout.write(`\nSpinner ${state.id} is already running\n`);
    }
  };

  const stop = () => {
    if (state.spinnerRef) {
      clearInterval(state.spinnerRef);
      if (state.affix) {
        stdout.cursorTo(state.affix.length);
        stdout.write('  \n');
      } else {
        stdout.clearLine();
        stdout.cursorTo(0);
      }

      state.currentFrame = 0;
      state.affix = null;
    }
  };

  return Object.freeze({
    id,
    start,
    stop
  });
};

const createErrorHandler = () => {
  const state = {
    errors: []
  };

  const printErrors = () => {
    if (state.errors.length === 0) {
      return stdout.write('⚠️ No error stored ⚠️ \n');
    }

    state.errors.forEach(({ keys, tokenId, validationError }) => {
      stdout.write(`❗ Validation error occured for token #${tokenId} ❗\n`);
      keys.forEach((key) => {
        const error = validationError.errors[key]?.message;

        if (error) {
          stdout.write(`❗ ${error} ❗\n`);
        }
      });
      stdout.write('\n');
    });
  };

  const storeErrors = (errors) => {
    state.errors = errors;
    return true;
  };

  const addError = (error) => {
    state.errors = state.errors.concat(error);
    return true;
  };

  const getErrors = () => state.errors;

  const hasError = () => state.errors.length > 0;

  return Object.freeze({
    addError,
    getErrors,
    hasError,
    printErrors,
    storeErrors
  });
};

module.exports = {
  calculateTotalRaritybase,
  createErrorHandler,
  createSpinner,
  extractTraitsAndValues,
  generateTally,
  getNftImage,
  resolveLink,
  roundToHundredth
};
