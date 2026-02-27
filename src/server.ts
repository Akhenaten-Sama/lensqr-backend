import { env } from './config/environment';
import createApp from './app';

const app = createApp();
const PORT = env.PORT;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Demo Credit API running on port ${PORT} [${env.NODE_ENV}]`);
});

export default app;
