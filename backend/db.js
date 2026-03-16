const sql = require("mssql");

const config = {
    user: "sa",
    password: "12345",
    server: "LAPTOP-NB4BADLS\\SQLEXPRESS",
    database: "StreetlightDB",
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

sql.connect(config)
.then(() => {
    console.log("Connected to SQL Server");
})
.catch(err => {
    console.log("Database connection error:", err);
});

module.exports = sql;