const {format} = require('url');

const serviceName = 'aqua';
const client = require('./net/client')(serviceName);

class Aqua {
  constructor({baseUrl, username, password}) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.password = password;
  }

  async login() {
    return this.fetch('token',
        {
          pathname: '/token',
        },
        {
          method: 'POST',
          body: new URLSearchParams([
            ['grant_type', 'password'],
            ['username', this.username],
            ['password', this.password],
          ]),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
    );
  }

  /* eslint max-len: "off" */
  async fetch(apiMethodName, {host, pathname, query}, {method, body, headers = {}} = {}) {
    const url = format({
      host: host || this.baseUrl,
      pathname,
      query,
    });

    if (headers['Content-Type'] === undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const state = {
      req: {
        method,
        headers,
        body,
        url,
      },
    };

    try {
      await client(state, `${serviceName}:${apiMethodName}`);
    } catch (error) {
      const fields = {
        originError: error,
        source: 'aqua',
      };

      delete state.req.headers;

      throw Object.assign(new Error('Aqua API error'), state, fields );
    }
    return state.res.body;
  }
}


module.exports = Aqua;
