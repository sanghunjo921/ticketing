import { Sequelize } from "sequelize";

class PostgresService {
  constructor() {
    this.initialize();
  }
  initialize() {
    this.sequelize = new Sequelize(
      "ftyxmjbr",
      "ftyxmjbr",
      "4uQ5TCNwzOh90oTsIijmjNJF-8f0IjdK",
      {
        host: "floppy.db.elephantsql.com",
        dialect: "postgres",
        port: 5432,
        query: {
          raw: true,
        },
      }
    );
  }
  registerModels() {}
}
