export {};

declare global {
  var GLOBAL_AGENT: {
    HTTP_PROXY?: string;
    HTTPS_PROXY?: string;
    NO_PROXY?: string;
  };
}
