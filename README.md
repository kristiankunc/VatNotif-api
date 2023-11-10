# VatNotif-api
The api server used to track online controllers for the VatNotif service (https://vatnotif.kristn.co.uk/)

This api is **free** to use by anyone without any API key required.

Documentation for this api can be found at https://api.vatnotif.kristn.co.uk/docs

## Development setup
### MySQL

This project requires a MySQL database to be running. The database schema can be found in the [schema.sql](src/lib/schema.sql) file.
To apply this schema, run the following command on your MySQL server:
```bash
$ mysql -u <username> -p < schema.sql
```

### Config
After that, edit the [mysql.ts.example](src/conf/mysql.ts.example) config file to match your MySQL server details and rename it to `mysql.ts`.

### Running
To build && run this project, first clone it
```bash
$ git clone git@github.com:kristiankunc/VatNotif-api.git
```

install dependencies via npm
``` bash
$ npm i
```

build & run
```bash
$ npm run build && npm start
```

## Contributing
Thank you for considering contributing to VatNotif-api! Here are some guidelines to follow:

### Issues
If you find a bug or have a feature request, please open an issue on the [GitHub repository](https://github.com/kristiankunc/VatNotif-api/issues). Please provide as much detail as possible, including steps to reproduce the issue.

### Pull Requests
If you want to contribute code, please follow these steps:
1. Fork the repository
2. Create a new branch for your changes
3. Make your changes and commit them with a descriptive message
4. Push your changes to your forked repository
5. Open a pull request to the main repository

Please make sure your code follows the existing code style and includes tests for any new functionality. Also, please provide a clear description of your changes in the pull request.

## Code of Conduct
Please note that this project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/). By participating, you are expected to uphold this code. Please report any unacceptable behavior to the project maintainers.

Thank you for your contributions!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
