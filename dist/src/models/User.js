import { knexClient } from "../config/config.js";
knexClient.schema.createTable('users', function (table) {
    table.increments();
    table.string('name');
    table.string('email');
    table.string('password');
    table.timestamps();
});
//# sourceMappingURL=User.js.map