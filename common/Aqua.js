const {format} = require('url');
const core = require('@actions/core');

const serviceName = 'aqua';
const client = require('./net/client')(serviceName);

class Aqua {
  constructor({baseUrl, token = ''}) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async login({username, password}) {
    return this.fetch('token',
        {
          pathname: '/token',
        },
        {
          method: 'POST',
          body: new URLSearchParams([
            ['grant_type', 'password'],
            ['username', username],
            ['password', password],
          ]),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
    );
  }

  async logout() {
    return this.fetch('Session',
        {
          pathname: '/Session',
        },
        {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer ' + this.token,
          },
        }
    );
  }

  /**
  * Updates the transition of a defect in aqua.
  *
  */
  async updateTransition({defect, transition}) {
    if (defect.toLowerCase().startsWitch('df')) {
        defect = defect.substring(2);
    } else {
        throw new Error('Defect ${defect} should be match the following format \'DF[0-9]+\'');
    }
    const transitionIds = {
      'closed': 1476,
      'new': 1527,
      'solved': 1474,
      'in processing': 1528,
      'reopened': 1529,
      'paused': 1530,
    };
    const transitionId = transitionIds[transition.toLowerCase()];
    return this.fetch('Defect',
        {
          pathname: '/Defect/' + defect,
        },
        {
          method: 'PUT',
          body: JSON.stringify({
            'Details': [
              {
                'FieldId': 'Status',
                'Value': transitionId,
              },
            ],
          }),
          headers: {
            'Authorization': 'Bearer ' + this.token,
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
      core.error(`Error: \'${error}\'`);
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
