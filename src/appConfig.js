import generalConf from "./general-conf.json";

// local-conf.json holds deployment-specific values (institution URLs, folder paths) and is
// gitignored - see local-conf.example.json for the expected shape and README for setup.
// import.meta.glob resolves to no matches (not a build error) if the file doesn't exist,
// so a fresh clone without it still builds - those values just come back undefined.
const localConfModules = import.meta.glob("./local-conf.json", { eager: true, import: "default" });
const localConf = Object.values(localConfModules)[0] || {};

export default { ...generalConf, ...localConf };
