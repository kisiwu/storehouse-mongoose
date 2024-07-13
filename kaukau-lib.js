module.exports = {
  enableLogs: true,
  exitOnFail: true,
  files: 'test/lib',
  ext: '.test.js',
  options: {
    bail: false,
    fullTrace: true,
    grep: '',
    ignoreLeaks: false,
    reporter: 'spec',
    retries: 0,
    slow: 2000,
    timeout: 7000,
    ui: 'bdd',
    color: true,
  },
  parameters: {
    mongodb: {
      protocol: process.env.TEST_DB_PROTOCOL || 'mongodb',
      hostname: process.env.TEST_DB_HOSTNAME || 'localhost',
      port: typeof process.env.TEST_DB_PORT === 'undefined' ? 27017 : process.env.TEST_DB_PORT,
      database: process.env.TEST_DB_NAME || 'ci',
			username: process.env.TEST_DB_USERNAME || '',
      password: process.env.TEST_DB_PASSWORD || '',
      options: process.env.TEST_DB_OPTIONS || '',
    }
  },
};
