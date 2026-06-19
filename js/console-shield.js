(function () {
  const isProduction = window.location.hostname !== "localhost" && 
                       window.location.hostname !== "127.0.0.1";
  if (isProduction) {
    console.log = console.warn = console.info = console.debug = function () {};
  }
})();
