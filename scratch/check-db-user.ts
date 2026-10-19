const url = new URL(process.env.DATABASE_URL);
console.log("DB User:", url.username);
console.log("DB Host:", url.host);
