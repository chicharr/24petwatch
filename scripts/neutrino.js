// TODO path to the config file
// TODO we shouldn't need to specify the sheets that we want to retrieve
const FILE_PATH = '/drafts/neutrino/martech.json?sheet=default&sheet=adobe&sheet=ga4&sheet=gtm';

/**
 * Load the martech configured as non-delayed
 * @param {*} context should contain at lease sampleRUM object and toCamelCase function
 */
export async function loadMartechLazy(context) {
  loadMartech((delayed) => delayed && delayed.toLowerCase() === 'no', context);
}

/**
 * Load the martech configured as delayed
 * @param {*} context should contain at lease sampleRUM object and toCamelCase function
 */
export async function loadMartechDelayed(context) {
  loadMartech((delayed) => !delayed || delayed.toLowerCase() !== 'no', context);
}

async function loadMartech(delayedCondition, {sampleRUM, toCamelCase}) {
  Object.entries(await getNeutrinoConfig(toCamelCase))
    .filter(([k, v]) => delayedCondition(v.delayed))
    .forEach( async ([k, v]) => {
      console.log(`Load martech ${k}`);
      const { script } = v;
      if (!script) {
        return;
      }
      script.startsWith('http') ? loadExternalScript(script, v)
        : import(script).then((m) => m.default({sampleRUM, ...v}));
    });
}

function parseConfig(data, toCamelCase, env = 'Dev') {
  const config = {};
  if (!data) return config;
  data.forEach((prop) => {
    config[toCamelCase(prop.Property)] = prop[env];
  });
  return config;
}

// keep the config of neutrino in a var to avoid loading and parsing the info twice
let neutrinoConfig;
async function getNeutrinoConfig(toCamelCase) {
  if (neutrinoConfig) {
    return neutrinoConfig;
  }

  const resp = await fetch(FILE_PATH);
  if (resp.status !== 200) {
    console.error('Error reading neutrino configuration');
    return neutrinoConfig;
  }
  const json = await resp.json();
  neutrinoConfig = {};
  json.default.data.forEach((line) => {
    if (window.location.href.match(line['Path'])) {
      Object.assign(neutrinoConfig, Object.fromEntries(line['Active Martech'].split(',')
        .map((n) => n.trim())
        .filter((n) => json[n])
        .map((n) => [n, parseConfig(json[n].data, toCamelCase)])));
    }
  });
  return neutrinoConfig;
}

function loadExternalScript (script, config) {
  // TODO replace possible variables in script url
  const scriptElement = document.createElement('script');
  script.src = script;
  document.head.appendChild(script);
  return true;
}

