import * as express from 'express';
import * as env from 'env-var';
import log from './log';
import * as swaggerUi from 'swagger-ui-express';
import junctionsRoute from './routes/junctions';
const YAML = require('yamljs');
import { resolve } from 'path';

let swaggerJson;
try {
  swaggerJson = YAML.load(resolve(__dirname, '../open-apispec.yaml'));

  //swaggerJson = require('../open-apispec.json');
} catch (e) {
  console.error(
    '\nERROR: please add your openapi-spec.json file to the root of the project\n',
    e
  );
  process.exit(1);
}

const PORT = env.get('PORT', '8080').asPortNumber();

const app = express();

// Add kubernetes liveness and readiness probes at
// /api/health/readiness and /api/health/liveness
require('kube-probe')(app);

// Include sensible security headers by default
app.use(require('helmet')());

// Log incoming requests
app.use(require('morgan')('combined'));

// Redirect to the api-docs by default
app.get('/', (req: express.Request, res: express.Response) => {
  res.redirect('/api-docs');
});

// Setup an api-docs endpoint using swagger ui
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerJson));

// Mount a /junctions endpoint that uses the junctions router
app.use('/junctions', junctionsRoute);

app.listen(PORT, (err: any) => {
  if (err) {
    log.error('serve error', err);
    throw err;
  }

  log.info(`server listening on port ${PORT}`);
});
