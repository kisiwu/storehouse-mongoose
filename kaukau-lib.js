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
      protocol: process.env.TEST_DB_PROTOCOL || 'mongodb+srv',
      hostname: process.env.TEST_DB_HOSTNAME || 'cluster0.xycj1.mongodb.net',
      port: typeof process.env.TEST_DB_PORT === 'undefined' ? '' : process.env.TEST_DB_PORT,
      database: process.env.TEST_DB_NAME || 'github',
      username: process.env.TEST_DB_USERNAME || 'github-user2',
      password: process.env.TEST_DB_PASSWORD || 'fgxNtDTF0N9AtYWh',
      options: process.env.TEST_DB_OPTIONS || 'retryWrites=true&w=majority&appName=Cluster0',
    }
  },
};
