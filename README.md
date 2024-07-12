# VatNotif API

The api server used to track online controllers for VatNotif (https://vatnotif.kristn.co.uk/)

This api is **free** to use by anyone without any API key required.

Documentation for this api can be found at https://api.vatnotif.kristn.co.uk/docs

## Development setup
A MYSQL database is required, the prisma schema is defined [prisma/schema.prisma](https://github.com/kristiankunc/VatNotif-api/blob/main/prisma/schema.prisma).
Database connection string has to be added to a `.env` file

1) After cloning, install dependencies using NPM
```
$ npm i
```

2) Generate the prisma client API using
```
$ npx prisma genrate
```

3) Start the server
```
$ npx tsx src/index.ts
```

## License
This project is released under the MIT License - see the [LICENSE](https://github.com/kristiankunc/VatNotif-api/blob/main/LICENSE). file for details.

## Contributing
Contributions are welcome, feel free to fork the project and submit a PR.
This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/), by participating you are expected to follow it.

Thank you for your contributions!
