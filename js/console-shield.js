(function () {

  const PRODUCTION_DOMAINS = [
    "solaraiadvisor.in",
    "www.solaraiadvisor.in",
    "solaraiadvisor.com",
    "www.solaraiadvisor.com",
    "solaraiadvisor.co.in",
    "www.solaraiadvisor.co.in"
  ];

  const isProduction =
    PRODUCTION_DOMAINS.includes(
      window.location.hostname
    );

  if (isProduction) {

    // Hide noisy logs in production

    console.log = function () {};
    console.info = function () {};
    console.debug = function () {};

    // Keep warnings & errors visible
    // console.warn remains active
    // console.error remains active
  }

})();
