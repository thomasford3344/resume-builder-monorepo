export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    uri: process.env.DATABASE_URL,
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY,
  },
});
