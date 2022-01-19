export const setupLibraries = () => {
  // Hack to make Canvas work on Lambda
  if (process.env["LAMBDA_TASK_ROOT"]) {
    process.env["PATH"] =
      process.env["PATH"] + ":" + process.env["LAMBDA_TASK_ROOT"] + "/lib";
    process.env["LD_PRELOAD"] =
      process.env["LAMBDA_TASK_ROOT"] + "/lib/libz.so.1";
    process.env["LD_LIBRARY_PATH"] = process.env["LAMBDA_TASK_ROOT"] + "/lib";
    process.env["PKG_CONFIG_PATH"] = process.env["LAMBDA_TASK_ROOT"] + "/lib";
  }
};
